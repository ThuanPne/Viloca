import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export function HomeSectionHeader({ title, subtitle, onViewAll }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onViewAll ? (
        <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.nomad.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  left:       { flex: 1, marginRight: 8 },
  title:      { fontSize: 20, fontWeight: '800', color: colors.nomad.onSurface, lineHeight: 26 },
  subtitle:   { fontSize: 13, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText:{ fontSize: 14, fontWeight: '700', color: colors.nomad.primary },
});
