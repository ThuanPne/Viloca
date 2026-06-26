import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';
import type { FestivalWithStatus } from '@/src/hooks/useFestivals';

function StatusBadge({ festival }: { festival: FestivalWithStatus }) {
  let label = '';
  if (festival.displayStatus === 'coming_soon') label = 'Coming Soon';
  else if (festival.displayStatus === 'days_away') label = `${festival.daysAway} ngày nữa`;
  else label = `${festival.monthsAway} tháng nữa`;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

interface Props {
  festival: FestivalWithStatus;
  onPress?: () => void;
}

export function FestivalCard({ festival, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <Image
        source={{ uri: festival.cover_image ?? undefined }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <StatusBadge festival={festival} />
        <Text style={styles.name} numberOfLines={2}>{festival.name}</Text>
        <Text style={styles.location} numberOfLines={1}>📍 {festival.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.nomad.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  image:   { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  content: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.nomad.primary,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  name:     { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 20, marginBottom: 2 },
  location: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});
