import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { hub } from '@/lib/api';
import { DEFAULTS, DEV_MODE, getSession, resetSession, saveSession, type Session } from '@/lib/config';
import { useTheme } from '@/lib/useTheme';

export default function Settings() {
  const { c } = useTheme();
  const router = useRouter();
  const [form, setForm] = useState<Session>({ ...DEFAULTS });
  const [health, setHealth] = useState<string>('checking…');

  useEffect(() => {
    getSession().then(setForm);
  }, []);

  const field = (
    key: keyof Session,
    label: string,
    placeholder: string,
    opts: { secure?: boolean } = {},
  ) => (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={opts.secure}
        style={{
          color: c.text,
          backgroundColor: c.cardAlt,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
        }}
      />
    </View>
  );

  const save = async () => {
    await saveSession(form);
    Alert.alert('Saved', 'Connection settings updated.');
    router.back();
  };

  const testConnection = async () => {
    setHealth('checking…');
    await saveSession(form);
    try {
      const res: any = await hub.health();
      setHealth(res?.status === 'healthy' ? 'healthy ✓' : JSON.stringify(res));
    } catch (e: any) {
      setHealth(`error: ${e?.message ?? 'failed'}`);
    }
  };

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        {field('baseUrl', 'API Base URL', DEFAULTS.baseUrl)}
        {field('token', 'Access token (Bearer)', 'Paste your access token')}
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          When set, the token is stored in the device keychain and sent as
          {' '}Authorization: Bearer. This is the intended production identity.
        </Text>
      </Card>

      {DEV_MODE ? (
        <Card style={{ gap: 16, borderColor: c.border, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="construct-outline" size={16} color={c.textMuted} />
            <Text style={{ color: c.text, fontWeight: '700' }}>Developer identity override</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            Dev-only. These header fields let you impersonate a facility user before real token auth
            exists. They are hidden in production builds — facility access is enforced server-side.
          </Text>
          {field('userId', 'User ID (x-user-id)', DEFAULTS.userId)}
          {field('roles', 'Roles (x-user-roles)', DEFAULTS.roles)}
          {field('facilityId', 'Facility ID (x-facility-id)', DEFAULTS.facilityId)}
        </Card>
      ) : null}

      <TouchableOpacity
        onPress={testConnection}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderColor: c.border,
          borderWidth: 1,
          paddingVertical: 12,
          borderRadius: 12,
        }}>
        <Ionicons name="pulse-outline" size={18} color={c.text} />
        <Text style={{ color: c.text, fontWeight: '600' }}>Test connection — {health}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={save}
        style={{
          backgroundColor: c.accent,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}>
        <Text style={{ color: c.onAccent, fontWeight: '700' }}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => setForm(await resetSession())}
        style={{ paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: c.textMuted }}>Reset to defaults</Text>
      </TouchableOpacity>
    </Screen>
  );
}
