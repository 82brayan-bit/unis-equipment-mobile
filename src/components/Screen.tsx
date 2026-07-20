import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/useTheme';

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.accent}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}
