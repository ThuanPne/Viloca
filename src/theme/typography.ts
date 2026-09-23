import { colors } from './colors';

export const typography = {
  h1:    { fontSize: 28, fontWeight: '700' as const, color: colors.nomad.onSurface,        lineHeight: 36 },
  h2:    { fontSize: 22, fontWeight: '600' as const, color: colors.nomad.onSurface,        lineHeight: 30 },
  h3:    { fontSize: 18, fontWeight: '600' as const, color: colors.nomad.onSurface,        lineHeight: 26 },
  body:  { fontSize: 15, fontWeight: '400' as const, color: colors.nomad.onSurface,        lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.nomad.onSurfaceVariant, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '500' as const, color: colors.nomad.onSurfaceVariant, letterSpacing: 0.8 },
};
