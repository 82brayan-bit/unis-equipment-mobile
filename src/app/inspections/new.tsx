import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { ApiError, hub, messageFor, type Row } from '@/lib/api';
import {
  type CheckItem,
  type CheckResult,
  makeChecklist,
  overallStatus,
} from '@/lib/inspection';
import { enqueueDraft } from '@/lib/queue';
import { Brand } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

// Photos stay as LOCAL URIs only. They are intentionally NOT embedded as base64
// in the inspection JSON — the backend has no photo upload endpoint yet, so
// captured photos are queued locally and marked pending. See
// docs/inspection-photo-upload.md.
type Photo = { uri: string };

const RESULTS: { value: CheckResult; label: string; color: string }[] = [
  { value: 'pass', label: 'Pass', color: Brand.mint },
  { value: 'fail', label: 'Fail', color: Brand.red },
  { value: 'na', label: 'N/A', color: Brand.blue },
];

export default function NewInspection() {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ equipmentId?: string }>();

  const [equipmentList, setEquipmentList] = useState<Row[]>([]);
  const [equipmentId, setEquipmentId] = useState(params.equipmentId ?? '');
  const [equipmentName, setEquipmentName] = useState('');
  const [meter, setMeter] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CheckItem[]>(makeChecklist());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Idempotency key generated once per form instance. Sent as `client_ref` so a
  // retry (or an offline draft synced later) cannot create a duplicate record.
  const clientRef = useRef<string>(Crypto.randomUUID());

  useEffect(() => {
    hub
      .equipment()
      .then((r) => setEquipmentList(r.equipment ?? []))
      .catch(() => {});
  }, []);

  const setResult = (key: string, result: CheckResult) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, result } : i)));

  const addPhoto = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to add photos.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      quality: 0.5,
      mediaTypes: ['images'],
    };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    setPhotos((p) => [...p, { uri: a.uri }]);
  };

  const removePhoto = (uri: string) =>
    setPhotos((p) => p.filter((x) => x.uri !== uri));

  const buildPayload = (): Row => ({
    // NOTE: request body keys are PROPOSED, not confirmed against the backend
    // schema (see docs/mobile-api-contract.md). They are the app's best-effort
    // contract until the real inspections table columns are verified.
    equipment_id: equipmentId.trim(),
    equipment_name: equipmentName.trim() || undefined,
    status: overallStatus(items),
    performed_at: new Date().toISOString(),
    meter_reading: meter ? Number(meter) : undefined,
    notes: notes.trim() || undefined,
    items: items.map(({ key, label, result }) => ({ key, label, result })),
  });

  const saveDraft = async (payload: Row, reason: string) => {
    await enqueueDraft({
      id: clientRef.current,
      payload,
      photoUris: photos.map((p) => p.uri),
    });
    Alert.alert('Saved as draft', `${reason}\n\nIt will sync automatically when you reconnect.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const submit = async () => {
    if (submitting) return; // guard against duplicate submissions
    if (!equipmentId.trim()) {
      Alert.alert('Equipment required', 'Select or enter the equipment being inspected.');
      return;
    }
    setSubmitting(true);
    const payload = buildPayload();
    try {
      await hub.createInspection({ ...payload, client_ref: clientRef.current });
      const photoNote = photos.length
        ? `\n\n${photos.length} photo(s) were captured but cannot be uploaded yet — no server photo endpoint exists.`
        : '';
      Alert.alert('Inspection submitted', `Your inspection was uploaded.${photoNote}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      // Offline (or a network drop): keep the user's work — queue it.
      if (e instanceof ApiError && (e.kind === 'offline' || e.kind === 'timeout')) {
        await saveDraft(payload, messageFor(e));
      } else {
        Alert.alert('Upload failed', messageFor(e), [
          { text: 'Save as draft', onPress: () => saveDraft(payload, 'The upload failed.') },
          { text: 'Dismiss', style: 'cancel' },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const status = overallStatus(items);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 14 }}>
        {/* Equipment */}
        <Card style={{ gap: 10 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Equipment</Text>
          {equipmentList.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {equipmentList.map((e) => {
                  const id = String(e.id);
                  const active = id === equipmentId;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        setEquipmentId(id);
                        setEquipmentName(String(e.name ?? e.equipment_name ?? ''));
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: active ? c.accent : c.cardAlt,
                        borderColor: c.border,
                        borderWidth: 1,
                      }}>
                      <Text style={{ color: active ? c.onAccent : c.text }}>
                        {String(e.name ?? e.equipment_name ?? id)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
          <TextInput
            value={equipmentId}
            onChangeText={setEquipmentId}
            placeholder="Equipment ID"
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            style={inputStyle(c)}
          />
          <TextInput
            value={equipmentName}
            onChangeText={setEquipmentName}
            placeholder="Equipment name (optional)"
            placeholderTextColor={c.textMuted}
            style={inputStyle(c)}
          />
          <TextInput
            value={meter}
            onChangeText={setMeter}
            placeholder="Meter reading (hours/odometer)"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
            style={inputStyle(c)}
          />
        </Card>

        {/* Checklist */}
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Checks</Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: (status === 'fail' ? Brand.red : Brand.mint) + '22',
              }}>
              <Text style={{ color: status === 'fail' ? Brand.red : Brand.mint, fontWeight: '700' }}>
                {status === 'fail' ? 'FAIL' : 'PASS'}
              </Text>
            </View>
          </View>
          {items.map((item) => (
            <View key={item.key} style={{ gap: 6 }}>
              <Text style={{ color: c.text }}>{item.label}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {RESULTS.map((r) => {
                  const active = item.result === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      onPress={() => setResult(item.key, r.value)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        backgroundColor: active ? r.color + '22' : c.cardAlt,
                        borderColor: active ? r.color : c.border,
                        borderWidth: 1,
                      }}>
                      <Text style={{ color: active ? r.color : c.textMuted, fontWeight: '600' }}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </Card>

        {/* Photos */}
        <Card style={{ gap: 12 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Photos</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            Photos are saved with this inspection locally. Upload is pending — the backend has no
            photo endpoint yet.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PhotoButton icon="camera-outline" label="Take Photo" onPress={() => addPhoto(true)} c={c} />
            <PhotoButton icon="images-outline" label="Library" onPress={() => addPhoto(false)} c={c} />
          </View>
          {photos.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {photos.map((p) => (
                <View key={p.uri}>
                  <Image source={{ uri: p.uri }} style={{ width: 84, height: 84, borderRadius: 10 }} />
                  <TouchableOpacity
                    onPress={() => removePhoto(p.uri)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: Brand.red,
                      borderRadius: 999,
                    }}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Notes */}
        <Card style={{ gap: 8 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any observations…"
            placeholderTextColor={c.textMuted}
            multiline
            style={[inputStyle(c), { minHeight: 90, textAlignVertical: 'top' }]}
          />
        </Card>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: insets.bottom + 12,
          backgroundColor: c.bg,
          borderTopColor: c.border,
          borderTopWidth: 1,
        }}>
        <TouchableOpacity
          disabled={submitting}
          onPress={submit}
          style={{
            backgroundColor: c.accent,
            paddingVertical: 15,
            borderRadius: 12,
            alignItems: 'center',
            opacity: submitting ? 0.6 : 1,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}>
          {submitting ? <ActivityIndicator color={c.onAccent} /> : (
            <Ionicons name="cloud-upload-outline" size={18} color={c.onAccent} />
          )}
          <Text style={{ color: c.onAccent, fontWeight: '700', fontSize: 16 }}>
            {submitting ? 'Uploading…' : 'Submit Inspection'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PhotoButton({
  icon,
  label,
  onPress,
  c,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  c: ReturnType<typeof useTheme>['c'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderColor: c.border,
        borderWidth: 1,
        backgroundColor: c.cardAlt,
      }}>
      <Ionicons name={icon} size={18} color={c.text} />
      <Text style={{ color: c.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const inputStyle = (c: ReturnType<typeof useTheme>['c']) => ({
  color: c.text,
  backgroundColor: c.cardAlt,
  borderColor: c.border,
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
});
