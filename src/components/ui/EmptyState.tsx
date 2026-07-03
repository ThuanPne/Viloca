import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, body, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.nomad.outlineVariant} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title:     { fontSize: 18, fontWeight: '600', color: colors.nomad.onSurface, marginTop: spacing.lg, textAlign: 'center' },
  body:      { fontSize: 14, color: colors.nomad.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 },
  cta:       { marginTop: spacing.xl },
});
