import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFavorite } from '@/src/hooks/useFavorite';
import { colors } from '@/src/theme/colors';
import type { Location } from '@/src/types';

interface Props {
  location: Location;
  distanceLabel?: string | null;
}

function cityLabel(code: string | null): string {
  if (code === 'SG') return 'TP. HCM';
  if (code === 'HN') return 'Hà Nội';
  if (code === 'DN') return 'Đà Nẵng';
  return code ?? '';
}

export function FeaturedPlaceCard({ location, distanceLabel }: Props) {
  const { isFavorite, toggle } = useFavorite(location.id);
  const firstPhoto = location.photos?.split(',')[0]?.trim() ?? location.cover_image ?? undefined;
  const subtitle = [location.district, cityLabel(location.city)]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      <ImageBackground
        source={firstPhoto ? { uri: firstPhoto } : undefined}
        style={styles.image}
        resizeMode="cover"
        imageStyle={{ borderRadius: 20 }}
      >
        {/* Fallback gradient when no image */}
        {!firstPhoto && (
          <LinearGradient
            colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          locations={[0.25, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ Nổi bật hôm nay</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={(e) => { e.stopPropagation(); toggle(); }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#FF4D6D' : colors.nomad.onSurface}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.info}>
          {/* Row 1: tag + rating */}
          <View style={styles.metaRow}>
            {location.style_tag ? (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{location.style_tag}</Text>
              </View>
            ) : null}
            {location.rating != null ? (
              <Text style={styles.rating}>★ {location.rating}</Text>
            ) : null}
          </View>

          {/* Row 2: name */}
          <Text style={styles.name} numberOfLines={2}>{location.name}</Text>

          {/* Row 3: address + distance */}
          {(subtitle || distanceLabel) ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.address} numberOfLines={1}>
                {[subtitle, distanceLabel].filter(Boolean).join(' • ')}
              </Text>
            </View>
          ) : null}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:              { marginHorizontal: 16, marginBottom: 16, height: 230, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  image:             { flex: 1 },
  topRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  featuredBadge:     { backgroundColor: colors.nomad.primary, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  favoriteBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  info:              { padding: 14, paddingTop: 0 },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tagPill:           { backgroundColor: 'rgba(220,240,180,0.25)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  tagText:           { color: colors.nomad.onPrimaryContainer, fontSize: 12, fontWeight: '600' },
  rating:            { color: '#FFD700', fontSize: 13, fontWeight: '700' },
  name:              { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 6 },
  addressRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address:           { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },
});
