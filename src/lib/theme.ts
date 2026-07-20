/**
 * UNIS Equipment brand palette, mirroring the web hub's dark-green sidebar.
 */
export const Brand = {
  green: '#1f3d2f',
  greenDeep: '#162c22',
  greenAccent: '#2f5d43',
  mint: '#7cc79a',
  amber: '#e0a83c',
  red: '#d9534f',
  blue: '#3a7ca5',
};

export const Palette = {
  light: {
    bg: '#f4f6f5',
    card: '#ffffff',
    cardAlt: '#eef1ef',
    text: '#14201a',
    textMuted: '#5c6a63',
    border: '#e2e7e4',
    accent: Brand.green,
    onAccent: '#ffffff',
  },
  dark: {
    bg: '#0f1713',
    card: '#182620',
    cardAlt: '#1f3327',
    text: '#eef3ef',
    textMuted: '#9db0a6',
    border: '#2a3b32',
    accent: Brand.mint,
    onAccent: '#0f1713',
  },
} as const;

export type Scheme = keyof typeof Palette;

export const statusColor = (status?: string): string => {
  const s = (status ?? '').toLowerCase();
  if (/(open|overdue|repair|fail|critical|down|out)/.test(s)) return Brand.red;
  if (/(pending|due|maintenance|warn|progress|hold)/.test(s)) return Brand.amber;
  if (/(available|active|complete|closed|pass|ok|good|done)/.test(s)) return Brand.mint;
  return Brand.blue;
};
