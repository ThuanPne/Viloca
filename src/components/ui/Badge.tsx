import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

type Color = 'primary' | 'forest' | 'warning' | 'error' | 'neutral';

interface Props {
  label: string;
  color?: Color;
}

const bg: Record<Color, string> = {
  primary: colors.primary600,
  forest:  colors.secondary600,
  warning: colors.warning,
  error:   colors.error,
  neutral: colors.border,
};
const text: Record<Color, string> = {
  primary: colors.textOnDark,
  forest:  colors.textOnDark,
  warning: colors.textOnDark,
  error:   colors.textOnDark,
  neutral: colors.textMuted,
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
