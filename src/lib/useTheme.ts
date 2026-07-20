import { useColorScheme } from 'react-native';
import { Palette, type Scheme } from './theme';

export function useTheme() {
  const scheme = useColorScheme();
  const key: Scheme = scheme === 'dark' ? 'dark' : 'light';
  return { scheme: key, c: Palette[key] };
}
