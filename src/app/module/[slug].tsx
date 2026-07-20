import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui';
import { moduleBySlug } from '@/lib/modules';

export default function ModuleStub() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const mod = moduleBySlug(String(slug));

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: mod?.title ?? 'Module' }} />
      <EmptyState
        icon={mod?.icon ?? 'cube-outline'}
        title={`${mod?.title ?? 'This module'} is coming soon`}
        message="The hub does not yet expose a mobile API for this module. Once an endpoint is available, this screen will light up with live data."
      />
    </Screen>
  );
}
