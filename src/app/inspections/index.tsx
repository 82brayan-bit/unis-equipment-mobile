import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, EmptyState, ErrorState, Loading, RecordCard } from '@/components/ui';
import { hub, messageFor } from '@/lib/api';
import { listDrafts, syncDrafts, type InspectionDraft } from '@/lib/queue';
import { Brand } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { useTheme } from '@/lib/useTheme';

export default function Inspections() {
  const { c } = useTheme();
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(
    async () => (await hub.inspections()).inspections,
    [],
  );
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadDrafts = useCallback(() => {
    listDrafts().then(setDrafts).catch(() => {});
  }, []);

  // Refresh the server list and local drafts every time the screen regains focus
  // (e.g. after returning from the New Inspection form).
  useFocusEffect(
    useCallback(() => {
      reload();
      loadDrafts();
    }, [reload, loadDrafts]),
  );

  const onSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await syncDrafts();
      await loadDrafts();
      if (res.synced > 0) reload();
      Alert.alert(
        'Sync complete',
        `Uploaded ${res.synced}, ${res.remaining} still queued${
          res.failed ? `, ${res.failed} failed` : ''
        }.`,
      );
    } catch (e) {
      Alert.alert('Sync failed', messageFor(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/inspections/new')}>
              <Ionicons name="add-circle" size={26} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />

      <TouchableOpacity
        onPress={() => router.push('/inspections/new')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: c.accent,
          paddingVertical: 14,
          borderRadius: 12,
        }}>
        <Ionicons name="clipboard-outline" size={18} color={c.onAccent} />
        <Text style={{ color: c.onAccent, fontWeight: '700' }}>New Inspection</Text>
      </TouchableOpacity>

      {drafts.length > 0 ? (
        <Card style={{ gap: 10, borderColor: Brand.amber, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="cloud-offline-outline" size={18} color={Brand.amber} />
            <Text style={{ color: c.text, fontWeight: '700', flex: 1 }}>
              {drafts.length} inspection{drafts.length > 1 ? 's' : ''} queued offline
            </Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            Saved on this device and not yet uploaded. Photos remain local until a server upload
            endpoint is available.
          </Text>
          {drafts.some((d) => d.lastError) ? (
            <Text style={{ color: Brand.red, fontSize: 12 }}>
              Last error: {drafts.find((d) => d.lastError)?.lastError}
            </Text>
          ) : null}
          <TouchableOpacity
            disabled={syncing}
            onPress={onSync}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: c.cardAlt,
              borderColor: c.border,
              borderWidth: 1,
              paddingVertical: 12,
              borderRadius: 10,
              opacity: syncing ? 0.6 : 1,
            }}>
            {syncing ? (
              <ActivityIndicator color={c.text} />
            ) : (
              <Ionicons name="sync-outline" size={18} color={c.text} />
            )}
            <Text style={{ color: c.text, fontWeight: '700' }}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No inspections yet"
          message="Completed inspections for this facility will appear here. Tap New Inspection to run a check."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {data.map((row, i) => (
            <RecordCard key={row.id ?? i} row={row} />
          ))}
        </View>
      )}
    </Screen>
  );
}
