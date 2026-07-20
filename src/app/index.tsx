import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, ErrorState, Loading, StatCard } from '@/components/ui';
import { hub } from '@/lib/api';
import { getSession, type Session } from '@/lib/config';
import { MODULES } from '@/lib/modules';
import { Brand } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { useTheme } from '@/lib/useTheme';

export default function Dashboard() {
  const { c } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const { data, loading, error, reload } = useAsync(() => hub.dashboard(), []);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const s = data?.summary;

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      <View style={styles.headerRow}>
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>
            Performance & Maintenance Hub
          </Text>
          <Text style={{ color: c.textMuted, marginTop: 2 }}>
            Facility {session?.facilityId ?? '—'} · {session?.roles ?? ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[styles.iconBtn, { borderColor: c.border }]}>
          <Ionicons name="settings-outline" size={20} color={c.text} />
        </TouchableOpacity>
      </View>

      {loading && !s ? (
        <Loading label="Loading fleet summary…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : s ? (
        <View style={styles.statGrid}>
          <StatCard label="Total Equipment" value={s.total_equipment} icon="car-outline" />
          <StatCard label="Available" value={s.available} icon="checkmark-circle-outline" tint={Brand.mint} />
          <StatCard label="Under Repair" value={s.under_repair} icon="construct-outline" tint={Brand.red} />
          <StatCard label="Maint. Required" value={s.maintenance_required} icon="alert-circle-outline" tint={Brand.amber} />
          <StatCard label="Open Work Orders" value={s.open_work_orders} icon="clipboard-outline" />
          <StatCard label="Overdue Plans" value={s.overdue_plans} icon="time-outline" tint={Brand.amber} />
          <StatCard label="Inspections (mo.)" value={s.inspections_this_month} icon="checkbox-outline" tint={Brand.mint} />
          <StatCard label="Costs (mo.)" value={`$${Number(s.total_costs_this_month ?? 0).toLocaleString()}`} icon="cash-outline" />
        </View>
      ) : null}

      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginTop: 8 }}>
        Modules
      </Text>

      <View style={styles.moduleGrid}>
        {MODULES.filter((m) => m.slug !== 'dashboard').map((m) => (
          <Link key={m.slug} href={m.route as any} asChild>
            <TouchableOpacity style={{ width: '48%' }} activeOpacity={0.75}>
              <Card style={{ gap: 10, opacity: m.live ? 1 : 0.72 }}>
                <View style={styles.moduleIconRow}>
                  <View
                    style={[
                      styles.moduleIcon,
                      { backgroundColor: (m.live ? Brand.green : c.textMuted) + '22' },
                    ]}>
                    <Ionicons name={m.icon} size={22} color={m.live ? c.accent : c.textMuted} />
                  </View>
                  {!m.live ? (
                    <View style={[styles.soon, { borderColor: c.border }]}>
                      <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '600' }}>
                        SOON
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>
                    {m.title}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>
                    {m.subtitle}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
