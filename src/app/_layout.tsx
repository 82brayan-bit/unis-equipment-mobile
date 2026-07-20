import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Brand } from '@/lib/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Brand.green },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: dark ? '#0f1713' : '#f4f6f5' },
          }}>
          <Stack.Screen name="index" options={{ title: 'UNIS Equipment' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
          <Stack.Screen name="equipment/index" options={{ title: 'Vehicles' }} />
          <Stack.Screen name="equipment/[id]" options={{ title: 'Equipment' }} />
          <Stack.Screen name="inspections/index" options={{ title: 'Inspections' }} />
          <Stack.Screen name="inspections/new" options={{ title: 'New Inspection', presentation: 'modal' }} />
          <Stack.Screen name="work-orders/index" options={{ title: 'Service' }} />
          <Stack.Screen name="reminders/index" options={{ title: 'Reminders' }} />
          <Stack.Screen name="meter-readings/index" options={{ title: 'Meter Readings' }} />
          <Stack.Screen name="reports/index" options={{ title: 'Reports' }} />
          <Stack.Screen name="module/[slug]" options={{ title: 'Module' }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
