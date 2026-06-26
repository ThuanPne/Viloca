import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { useFestivals } from '@/src/hooks/useFestivals';
import { useLocations } from '@/src/hooks/useLocations';
import { FilterSheet, FilterTab } from '@/src/components/home/FilterSheet';
import type { FestivalWithStatus } from '@/src/hooks/useFestivals';
import type { Location } from '@/src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_W = SCREEN_W - 56;

const CATEGORY_CHIPS = [
  { label: 'Di tích',     value: 'Di tích' },
  { label: 'Ẩm thực',    value: 'Ẩm thực' },
  { label: 'Nghệ thuật',  value: 'Nghệ thuật' },
  { label: 'Thiên nhiên', value: 'Thiên nhiên' },
  { label: 'Kiến trúc',  value: 'Kiến trúc' },
];

function festivalBadge(f: FestivalWithStatus) {
  if (f.displayStatus === 'coming_soon') return 'Sắp diễn ra';
  if (f.displayStatus === 'days_away')   return `${f.daysAway} ngày nữa`;
  return `${f.monthsAway} tháng nữa`;
}

function cityLabel(code: string | null) {
  if (code === 'SG') return 'TP. HCM';
  if (code === 'HN') return 'Hà Nội';
  if (code === 'DN') return 'Đà Nẵng';
  return code ?? '';
}

// ─── Festival card (unchanged) ───────────────────────────────────────────────
function TallFestivalCard({ festival }: { festival: FestivalWithStatus }) {
  return (
    <TouchableOpacity style={styles.tallCard} activeOpacity={0.9}>
      <Image
        source={{ uri: festival.cover_image ?? undefined }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.tallBadge}>
        <Text style={styles.tallBadgeText}>{festivalBadge(festival)}</Text>
      </View>
      <View style={styles.tallInfo}>
        <Text style={styles.tallTitle} numberOfLines={2}>{festival.name}</Text>
        <Text style={styles.tallSub}>📍 {festival.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Hero card (full-width, tall) ────────────────────────────────────────────
function HeroCard({ location }: { location: Location }) {
  const firstPhoto = location.photos?.split(',')[0]?.trim();
  const subtitle   = [location.district, cityLabel(location.city)].filter(Boolean).join(', ');
  return (
    <TouchableOpacity
      style={styles.heroCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[colors.nomad.inverseSurface, colors.nomad.primary]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroInfo}>
        <Text style={styles.heroName} numberOfLines={2}>{location.name}</Text>
        <View style={styles.heroSubRow}>
          <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.heroSub}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Small card (2 side-by-side) ─────────────────────────────────────────────
function SmallCard({ location }: { location: Location }) {
  const firstPhoto = location.photos?.split(',')[0]?.trim();
  return (
    <TouchableOpacity
      style={styles.smallCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[colors.nomad.primary, colors.nomad.primaryContainer]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.smallInfo}>
        <Text style={styles.smallName} numberOfLines={2}>{location.name}</Text>
        {location.district ? (
          <Text style={styles.smallSub} numberOfLines={1}>{location.district}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Carousel card (auto-scroll) ─────────────────────────────────────────────
function CarouselCard({ location }: { location: Location }) {
  const firstPhoto   = location.photos?.split(',')[0]?.trim();
  const subtitle     = [location.district, cityLabel(location.city)].filter(Boolean).join(', ');
  const firstCategory = location.category?.split(',')[0]?.trim();
  return (
    <TouchableOpacity
      style={[styles.carouselCard, { width: CAROUSEL_W }]}
      activeOpacity={0.9}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[colors.nomad.surfaceDim, colors.nomad.inverseSurface]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {firstCategory && (
        <View style={styles.carouselBadge}>
          <Text style={styles.carouselBadgeText}>{firstCategory}</Text>
        </View>
      )}
      <View style={styles.carouselInfo}>
        <Text style={styles.carouselName} numberOfLines={1}>{location.name}</Text>
        <View style={styles.carouselSubRow}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" />
          <Text style={styles.carouselSub}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets    = useSafeAreaInsets();
  const user      = useAuthStore((s) => s.user);
  const firstName = user?.user_metadata?.full_name?.split(' ').pop() ?? 'bạn';

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible]     = useState(false);
  const [sheetTab, setSheetTab]             = useState<FilterTab>('category');
  const [carouselIndex, setCarouselIndex]   = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const { festivals, loading: festivalsLoading }    = useFestivals();
  const { locations: featured }                      = useLocations(3);
  const { locations, loading: locationsLoading }     = useLocations(13, activeCategory);

  // Auto-scroll carousel every 3s
  useEffect(() => {
    if (locations.length === 0) return;
    const interval = setInterval(() => {
      const next = (carouselIndex + 1) % locations.length;
      carouselRef.current?.scrollTo({ x: next * (CAROUSEL_W + 14), animated: true });
      setCarouselIndex(next);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselIndex, locations.length]);

  const [hero, ...rest] = featured;
  const smallCards = rest.slice(0, 2);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Background decoration ── */}
      <LinearGradient
        colors={['rgba(232,255,194,0.5)', 'rgba(250,250,240,0)']}
        locations={[0, 1]}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <View style={styles.bgBlobTopRight} pointerEvents="none" />
      <View style={styles.bgBlobMidLeft} pointerEvents="none" />

      {/* ── Fixed blur header ── */}
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/viloca-logo.png')} style={styles.logoImg} resizeMode="contain" />
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.nomad.onSurface} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64, paddingBottom: 32 }}
      >
        {/* Greeting */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>{firstName} ơi!</Text>
          <Text style={styles.tagline}>Hôm nay đi đâu?</Text>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.85} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={18} color={colors.nomad.primary} />
          <Text style={styles.searchPlaceholder}>Quán cà phê, bảo tàng, phố cổ...</Text>
        </TouchableOpacity>

        {/* Category chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {CATEGORY_CHIPS.map((chip) => {
            const active = activeCategory === chip.value;
            return (
              <TouchableOpacity
                key={chip.value}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(active ? null : chip.value)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Dành cho bạn ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dành cho bạn</Text>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </View>

        <View style={styles.featuredWrap}>
          {hero && <HeroCard location={hero} />}
          {smallCards.length > 0 && (
            <View style={styles.smallRow}>
              {smallCards.map((loc) => <SmallCard key={loc.id} location={loc} />)}
            </View>
          )}
        </View>

        {/* ── Đừng bỏ lỡ ── */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Đừng bỏ lỡ</Text>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </View>

        {festivalsLoading ? (
          <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 32 }} />
        ) : festivals.length === 0 ? (
          <Text style={styles.emptyText}>Không có sự kiện nào trong thời gian tới</Text>
        ) : (
          <View style={styles.tallCards}>
            {festivals.slice(0, 1).map((f) => <TallFestivalCard key={f.id} festival={f} />)}
          </View>
        )}

        {/* ── Dân local hay ghé (auto-scroll carousel) ── */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Phải ghé một lần</Text>
        </View>

        {locationsLoading ? (
          <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 24 }} />
        ) : locations.length === 0 ? (
          <Text style={styles.emptyText}>Không có địa điểm nào</Text>
        ) : (
          <View>
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CAROUSEL_W + 14}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (CAROUSEL_W + 14));
                setCarouselIndex(Math.max(0, Math.min(idx, locations.length - 1)));
              }}
            >
              {locations.map((loc) => <CarouselCard key={loc.id} location={loc} />)}
            </ScrollView>

            {/* Dot indicators */}
            <View style={styles.dots}>
              {locations.map((_, i) => (
                <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <FilterSheet
        visible={sheetVisible}
        initialTab={sheetTab}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.nomad.background },

  // Background decoration
  bgGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
  },
  bgBlobTopRight: {
    position: 'absolute', top: -40, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: colors.nomad.secondaryContainer, opacity: 0.35,
  },
  bgBlobMidLeft: {
    position: 'absolute', top: 160, left: -50,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: colors.nomad.onPrimaryContainer, opacity: 0.5,
  },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.nomad.outlineVariant,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg:    { width: 44, height: 44 },
  headerIcon: { padding: 4 },

  // Greeting
  heroSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  greeting:    { fontSize: 28, fontWeight: '700', color: colors.nomad.onSurface, lineHeight: 36 },
  tagline:     { fontSize: 28, fontWeight: '700', color: colors.nomad.primaryContainer, lineHeight: 36 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: colors.nomad.surfaceContainerLow,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: colors.nomad.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 2,
  },
  searchPlaceholder: { flex: 1, fontSize: 15, color: colors.nomad.outline },

  // Category chips
  chipsScroll:            { marginBottom: 24 },
  categoryChip:           { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, backgroundColor: colors.nomad.surfaceContainer },
  categoryChipActive:     { backgroundColor: colors.nomad.secondaryContainer },
  categoryChipText:       { fontSize: 12, fontWeight: '600', color: colors.nomad.onSurfaceVariant, letterSpacing: 0.3 },
  categoryChipTextActive: { color: colors.nomad.onSurface },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.nomad.onSurface },
  seeAll:       { fontSize: 12, fontWeight: '600', color: colors.nomad.primary },

  // Featured section
  featuredWrap: { paddingHorizontal: 20, gap: 12 },

  // Hero card
  heroCard: {
    width: '100%', height: 200, borderRadius: 20,
    overflow: 'hidden', backgroundColor: colors.nomad.surfaceContainer,
  },
  heroInfo:   { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroName:   { fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 28, marginBottom: 4 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroSub:    { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Small cards
  smallRow:  { flexDirection: 'row', gap: 12 },
  smallCard: {
    flex: 1, height: 130, borderRadius: 16,
    overflow: 'hidden', backgroundColor: colors.nomad.surfaceContainer,
  },
  smallInfo: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  smallName: { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 18 },
  smallSub:  { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Festival cards
  tallCards: { paddingHorizontal: 20, gap: 20 },
  tallCard: {
    width: '100%', aspectRatio: 4 / 5,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: colors.nomad.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.12, shadowRadius: 48, elevation: 6,
  },
  tallBadge:     { position: 'absolute', top: 20, left: 20, backgroundColor: colors.nomad.primary, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  tallBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  tallInfo:      { position: 'absolute', bottom: 24, left: 24, right: 24 },
  tallTitle:     { fontSize: 24, fontWeight: '700', color: '#fff', lineHeight: 32, marginBottom: 4 },
  tallSub:       { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Carousel
  carouselCard: {
    height: 200, borderRadius: 20,
    overflow: 'hidden', backgroundColor: colors.nomad.surfaceContainer,
  },
  carouselBadge:     { position: 'absolute', top: 16, left: 16, backgroundColor: colors.nomad.primary, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  carouselBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  carouselInfo:      { position: 'absolute', bottom: 20, left: 20, right: 20 },
  carouselName:      { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  carouselSubRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  carouselSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Dots
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.nomad.outlineVariant },
  dotActive: { width: 18, height: 6, borderRadius: 3, backgroundColor: colors.nomad.primary },

  emptyText: { paddingHorizontal: 20, fontSize: 13, color: colors.nomad.onSurfaceVariant },
});
