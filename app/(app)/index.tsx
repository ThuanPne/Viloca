import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Image,
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

// ─── Category chips (Nhóm địa điểm — simplified as chips) ───────────────────
const CATEGORY_CHIPS = [
  { label: 'Di tích',    value: 'Di tích' },
  { label: 'Ẩm thực',   value: 'Ẩm thực' },
  { label: 'Nghệ thuật', value: 'Nghệ thuật' },
  { label: 'Thiên nhiên', value: 'Thiên nhiên' },
  { label: 'Kiến trúc', value: 'Kiến trúc' },
];

// ─── Festival badge ──────────────────────────────────────────────────────────
function festivalBadge(f: FestivalWithStatus) {
  if (f.displayStatus === 'coming_soon') return 'Coming Soon';
  if (f.displayStatus === 'days_away')   return `${f.daysAway} ngày nữa`;
  return `${f.monthsAway} tháng nữa`;
}

// ─── Tall festival card (4:5 aspect) ────────────────────────────────────────
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
      {/* Badge top-left */}
      <View style={styles.tallBadge}>
        <Text style={styles.tallBadgeText}>{festivalBadge(festival)}</Text>
      </View>
      {/* Info bottom */}
      <View style={styles.tallInfo}>
        <Text style={styles.tallTitle} numberOfLines={2}>{festival.name}</Text>
        <Text style={styles.tallSub}>📍 {festival.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Square place card (text below) ─────────────────────────────────────────
function SquarePlaceCard({ location }: { location: Location }) {
  const firstPhoto = location.photos?.split(',')[0]?.trim();
  const subtitle = [location.district, location.city].filter(Boolean).join(', ');
  return (
    <TouchableOpacity
      style={styles.squareCard}
      activeOpacity={0.88}
      onPress={() => router.push(`/location/${location.id}`)}
    >
      <Image
        source={firstPhoto ? { uri: firstPhoto } : undefined}
        style={styles.squareImage}
        resizeMode="cover"
      />
      <Text style={styles.squareName} numberOfLines={1}>{location.name}</Text>
      <Text style={styles.squareSub}>
        <Ionicons name="location-outline" size={10} color={colors.nomad.onSurfaceVariant} />
        {' '}{subtitle || 'Việt Nam'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const user     = useAuthStore((s) => s.user);
  const firstName = user?.user_metadata?.full_name?.split(' ').pop() ?? 'bạn';

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible]     = useState(false);
  const [sheetTab, setSheetTab]             = useState<FilterTab>('hashtag');

  const { festivals,  loading: festivalsLoading } = useFestivals();
  const { locations, loading: locationsLoading }  = useLocations(6, activeCategory);

  function openFilter(tab: FilterTab) {
    setSheetTab(tab);
    setSheetVisible(true);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── Fixed blur header ──────────────────────────────────────── */}
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/viloca-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.nomad.onSurface} />
        </TouchableOpacity>
      </BlurView>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64, paddingBottom: 32 }}
      >
        {/* Greeting */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>Xin chào, {firstName}!</Text>
          <Text style={styles.tagline}>where to next?</Text>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.85} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={18} color={colors.nomad.primary} />
          <Text style={styles.searchPlaceholder}>Tìm địa điểm...</Text>
          <TouchableOpacity onPress={() => openFilter('hashtag')} style={styles.filterIcon}>
            <Ionicons name="options-outline" size={18} color={colors.nomad.onSurfaceVariant} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Category chips (Nhóm địa điểm) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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

        {/* ── Sự kiện sắp diễn ra ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sự kiện sắp diễn ra</Text>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </View>

        {festivalsLoading ? (
          <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 32 }} />
        ) : festivals.length === 0 ? (
          <Text style={styles.emptyText}>Không có sự kiện nào trong thời gian tới</Text>
        ) : (
          <View style={styles.tallCards}>
            {festivals.slice(0, 3).map((f) => (
              <TallFestivalCard key={f.id} festival={f} />
            ))}
          </View>
        )}

        {/* ── Địa điểm nổi bật ─────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>Địa điểm nổi bật</Text>
        </View>

        {locationsLoading ? (
          <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 24 }} />
        ) : locations.length === 0 ? (
          <Text style={styles.emptyText}>Không có địa điểm nào</Text>
        ) : (
          <FlatList
            horizontal
            data={locations}
            keyExtractor={(l) => l.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => <SquarePlaceCard location={item} />}
          />
        )}
      </ScrollView>

      {/* Filter sheet */}
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

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.nomad.outlineVariant,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg:     { width: 44, height: 44 },
  headerIcon:  { padding: 4 },

  // Hero
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
  filterIcon:        { padding: 2 },

  // Category chips
  chipsScroll: { marginBottom: 24 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99,
    backgroundColor: colors.nomad.surfaceContainer,
  },
  categoryChipActive: { backgroundColor: colors.nomad.secondaryContainer },
  categoryChipText:   { fontSize: 12, fontWeight: '600', color: colors.nomad.onSurfaceVariant, letterSpacing: 0.3 },
  categoryChipTextActive: { color: colors.nomad.onSurface },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.nomad.onSurface },
  seeAll:       { fontSize: 12, fontWeight: '600', color: colors.nomad.primary },

  // Tall festival cards (4:5 ratio, stacked vertically)
  tallCards:  { paddingHorizontal: 20, gap: 20 },
  tallCard: {
    width: '100%', aspectRatio: 4 / 5,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: colors.nomad.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.12, shadowRadius: 48, elevation: 6,
  },
  tallBadge: {
    position: 'absolute', top: 20, left: 20,
    backgroundColor: colors.nomad.primary,
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
  },
  tallBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  tallInfo:  { position: 'absolute', bottom: 24, left: 24, right: 24 },
  tallTitle: { fontSize: 24, fontWeight: '700', color: '#fff', lineHeight: 32, marginBottom: 4 },
  tallSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Square place cards
  squareCard:  { width: 180 },
  squareImage: { width: 180, height: 180, borderRadius: 16, marginBottom: 8 },
  squareName:  { fontSize: 15, fontWeight: '600', color: colors.nomad.onSurface, marginBottom: 2 },
  squareSub:   { fontSize: 11, color: colors.nomad.onSurfaceVariant },

  emptyText: { paddingHorizontal: 20, fontSize: 13, color: colors.nomad.onSurfaceVariant },
});
