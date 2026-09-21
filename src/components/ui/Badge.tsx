import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

type Color = 'primary' | 'forest' | 'warning' | 'error' | 'neutral';

interface Props {
  label: string;
  color?: Color;
}

const bg: Record<Color, string> = {
  primary: colors.nomad.primary,
  forest:  colors.nomad.primaryContainer,
  warning: colors.warning,
  error:   colors.error,
  neutral: colors.nomad.outlineVariant,
};
const text: Record<Color, string> = {
  primary: colors.nomad.onPrimary,
  forest:  colors.nomad.onPrimary,
  warning: colors.nomad.onPrimary,
  error:   colors.nomad.onPrimary,
  neutral: colors.nomad.onSurfaceVariant,
};

export function Badge({ label, color = 'neutral' }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg[color] }]}>
      <Text style={[styles.label, { color: text[color] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  label: { fontSize: 11, fontWeight: '600' },
});
