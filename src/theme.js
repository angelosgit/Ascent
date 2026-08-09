import { Platform } from 'react-native';

/** Sampled from the artwork so the UI sits inside the same palette. */
export const COLORS = {
  ink: '#1B0D07',
  ember: '#D9481B',
  rust: '#8C2F12',
  sand: '#F2C078',
  cream: '#FBEBD2',
  veil: 'rgba(27, 13, 7, 0.82)',
  moss: '#5C7A46',
};

/** Tabular figures — five decimals must not jitter as they tick over. */
export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
