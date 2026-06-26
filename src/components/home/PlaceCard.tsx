import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';
import type { Place } from '@/src/types';

const REGION_LABEL: Record<string, string> = {
  north: 'Miền Bắc',
  central: 'Miền Trung',
  south: 'Miền Nam',
};

interface Props {
  place: Place;
  onPress?: () => void;
  size?: 'sm' | 'lg';
}

export function PlaceCard({ place, onPress, size = 'sm' }: Props) {
  const isLarge = size === 'lg';
  return (
    <TouchableOpacity
      style={[styles.card, isLarge ? styles.cardLg : styles.cardSm]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <Image
        source={{ uri: place.cover_image ?? undefined }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.regionPill}>
          <Text style={styles.regionText}>{REGION_LABEL[place.region] ?? place.region}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.nomad.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSm: { width: 140, height: 170 },
  cardLg: { width: 200, height: 240 },
  image:   { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  content: { flex: 1, justifyContent: 'flex-end', padding: 10 },
  regionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  regionText: { fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.4 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 18 },
});
