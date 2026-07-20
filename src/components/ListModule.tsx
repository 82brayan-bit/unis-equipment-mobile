import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Loading, RecordCard } from '@/components/ui';
import type { Row } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useTheme } from '@/lib/useTheme';

/**
 * Generic list screen for a hub collection endpoint. Renders each row as a
 * schema-flexible card so it works regardless of the exact column names.
 */
export function ListModule({
  fetcher,
  emptyIcon = 'file-tray-outline',
  emptyTitle,
  emptyMessage,
  header,
  onPressRow,
  intro,
}: {
  fetcher: () => Promise<Row[]>;
  emptyIcon?: React.ComponentProps<typeof Ionicons>['name'];
  emptyTitle: string;
  emptyMessage?: string;
  header?: ReactNode;
  intro?: string;
  onPressRow?: (row: Row) => void;
}) {
  const { c } = useTheme();
  const { data, loading, error, reload } = useAsync(fetcher, []);

  return (
    <Screen refreshing={loading} onRefresh={reload}>
      {header}
      {intro ? (
        <Text style={{ color: c.textMuted, fontSize: 13 }}>{intro}</Text>
      ) : null}

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
      ) : (
        <View style={{ gap: 12 }}>
          {data.map((row, i) => (
            <RecordCard
              key={row.id ?? i}
              row={row}
              onPress={onPressRow ? () => onPressRow(row) : undefined}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
