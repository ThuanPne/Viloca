export const colors = {
  primary600: '#C8602E',
  primary400: '#E8895C',
  primary100: '#F5E4D6',

  secondary600: '#3D7A5A',
  secondary400: '#72AA8A',
  secondary100: '#D8EDE3',

  bgScreen:  '#FAF7F2',
  bgCard:    '#FFFFFF',
  border:    '#EDE3D8',

  textPrimary: '#2D1A0E',
  textMuted:   '#8A7060',
  textOnDark:  '#FFFFFF',

  error:   '#DC2626',
  warning: '#F59E0B',
  success: '#16A34A',

  // Legacy alias — maps old nomad tokens to the current design system
  nomad: {
    surface:             '#FAF7F2',   // bgScreen
    surfaceDim:          '#EDE3D8',   // border
    surfaceContainer:    '#FAF7F2',   // bgScreen
    surfaceContainerLow: '#FFFFFF',   // bgCard
    onSurface:           '#2D1A0E',   // textPrimary
    onSurfaceVariant:    '#8A7060',   // textMuted
    outline:             '#EDE3D8',   // border
    outlineVariant:      '#EDE3D8',   // border
    primary:             '#C8602E',   // primary600
    onPrimary:           '#FFFFFF',   // textOnDark
    primaryContainer:    '#F5E4D6',   // primary100
    onPrimaryContainer:  '#C8602E',   // primary600
    secondary:           '#3D7A5A',   // secondary600
    secondaryContainer:  '#D8EDE3',   // secondary100
    inverseSurface:      '#2D1A0E',   // textPrimary
    inverseOnSurface:    '#FFFFFF',   // bgCard
    background:          '#FAF7F2',   // bgScreen
    onBackground:        '#2D1A0E',   // textPrimary
  },
} as const;
