import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { statusColor } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const body = (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 14,
          padding: 16,
        },
        style,
      ]}>
      {children}
    </View>
  );
  return onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {body}
    </TouchableOpacity>
  ) : (
    body
  );
}

export function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint?: string;
}) {
  const { c } = useTheme();
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={18} color={tint ?? c.accent} />
        <Text style={{ color: c.textMuted, fontSize: 13, flexShrink: 1 }}>{label}</Text>
      </View>
      <Text style={{ color: c.text, fontSize: 28, fontWeight: '700', marginTop: 8 }}>
        {value}
      </Text>
    </Card>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const color = statusColor(status);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: color + '22',
        borderColor: color,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>
        {status ?? 'unknown'}
      </Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.accent} />
      {label ? (
        <Text style={{ color: c.textMuted, marginTop: 10 }}>{label}</Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={44} color={c.textMuted} />
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '600', marginTop: 12 }}>
        {title}
      </Text>
      {message ? (
        <Text
          style={{ color: c.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={statusColor('error')} />
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '600', marginTop: 12 }}>
        Something went wrong
      </Text>
      <Text style={{ color: c.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            marginTop: 16,
            backgroundColor: c.accent,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
          }}>
          <Text style={{ color: c.onAccent, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Renders an arbitrary record as a titled card with key/value rows. */
export function RecordCard({
  row,
  titleKeys = ['name', 'title', 'label', 'equipment_name', 'asset_name', 'id'],
  statusKeys = ['status', 'state', 'condition'],
  onPress,
}: {
  row: Record<string, any>;
  titleKeys?: string[];
  statusKeys?: string[];
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const titleKey = titleKeys.find((k) => row[k] != null);
  const statusKey = statusKeys.find((k) => row[k] != null);
  const title = titleKey ? String(row[titleKey]) : 'Record';
  const detailEntries = Object.entries(row)
    .filter(([k, v]) => k !== titleKey && k !== statusKey && v != null && typeof v !== 'object')
    .slice(0, 5);

  return (
    <Card onPress={onPress} style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', flexShrink: 1 }}>
          {title}
        </Text>
        {statusKey ? <StatusPill status={String(row[statusKey])} /> : null}
      </View>
      {detailEntries.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{prettyKey(k)}</Text>
          <Text style={{ color: c.text, fontSize: 13, flexShrink: 1, textAlign: 'right' }}>
            {String(v)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

export function prettyKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .replace(/\bId\b/, 'ID');
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 240,
  },
});
