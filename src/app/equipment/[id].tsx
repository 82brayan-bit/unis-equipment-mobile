import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading, StatusPill, prettyKey } from '@/components/ui';
import { hub } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useTheme } from '@/lib/useTheme';

export default function EquipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(
    () => hub.equipmentById(String(id)),
    [id],
  );

  const eq = data?.equipment;
  const title =
    eq?.name ?? eq?.equipment_name ?? eq?.asset_name ?? `Equipment ${id}`;

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <Stack.Screen options={{ title: 'Equipment' }} />
      {loading && !eq ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : eq ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>{title}</Text>
            {eq.status ? <StatusPill status={String(eq.status)} /> : null}
          </View>

          <Card style={{ gap: 10 }}>
            {Object.entries(eq)
              .filter(([, v]) => v != null && typeof v !== 'object')
              .map(([k, v]) => (
                <View
                  key={k}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: c.textMuted, fontSize: 13 }}>{prettyKey(k)}</Text>
                  <Text style={{ color: c.text, fontSize: 13, flexShrink: 1, textAlign: 'right' }}>
                    {String(v)}
                  </Text>
                </View>
              ))}
          </Card>

          <TouchableOpacity
            onPress={() =>
              router.push(`/inspections/new?equipmentId=${eq.id}` as any)
            }
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
            <Text style={{ color: c.onAccent, fontWeight: '700' }}>Start Inspection</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </Screen>
  );
}
