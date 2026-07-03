import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

type Color = 'terracotta' | 'forest' | 'neutral';

interface Props {
  label: string;
  color?: Color;
}

const bg: Record<Color, string> = {
  terracotta: colors.primary100,
  forest:     colors.secondary100,
  neutral:    colors.border,
};
const text: Record<Color, string> = {
  terracotta: colors.primary600,
  forest:     colors.secondary600,
  neutral:    colors.textMuted,
};

export function Tag({ label, color = 'neutral' }: Props) {
  return (
    <View style={[styles.tag, { backgroundColor: bg[color] }]}>
      <Text style={[styles.label, { color: text[color] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontWeight: '500' },
});
