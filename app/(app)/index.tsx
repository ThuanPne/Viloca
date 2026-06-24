import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Image, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useUpcomingTrip } from '@/src/hooks/useUpcomingTrip';
import { useTodaySchedule } from '@/src/hooks/useTodaySchedule';
import { useExperiences } from '@/src/hooks/useExperiences';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { Experience } from '@/src/types';

const SLOT_ICON: Record<string, string> = {
  morning: '🌅', afternoon: '☀️', evening: '🌙',
};

const QUICK_ACTIONS = [
  { icon: 'add-circle', label: 'Tạo trip',  color: '#fff', bg: 'rgba(255,255,255,0.2)', action: '/(app)/workspace' },
  { icon: 'compass',    label: 'Khám phá',  color: '#fff', bg: 'rgba(255,255,255,0.2)', action: '/(app)/explore'   },
  { icon: 'book',       label: 'Nhật ký',   color: '#fff', bg: 'rgba(255,255,255,0.2)', action: null               },
  { icon: 'bag-handle', label: 'Hành lý',   color: '#fff', bg: 'rgba(255,255,255,0.2)', action: null               },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng ☀️';
  if (h < 18) return 'Chào buổi chiều 🌤';
  return 'Chào buổi tối 🌙';
}

function formatPrice(p: number) {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + 'M';
  if (p >= 1_000)     return (p / 1_000).toFixed(0) + 'K';
  return p.toString();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { trip, daysUntil, loading: tripLoading } = useUpcomingTrip();
  const { items: scheduleItems, dayNumber } = useTodaySchedule(trip);
  const { experiences } = useExperiences(null);

  const firstName = user?.user_metadata?.full_name?.split(' ').pop() ?? 'bạn';
  const recommendations = experiences.slice(0, 8);

  const tripAction = trip ? `/trip/${trip.id}` : '/(app)/workspace';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary600} />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>

        {/* ── HERO HEADER (sticky) ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          {/* Top bar */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>{getGreeting()},</Text>
              <Text style={styles.heroName}>{firstName}!</Text>
            </View>
            <TouchableOpacity style={styles.avatarBtn}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Hero tagline */}
          <Text style={styles.heroTagline}>Khám phá thế giới đẹp!</Text>

          {/* Search bar */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => router.push('/(app)/explore' as any)}
          >
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Bạn muốn đi đâu?</Text>
            <View style={styles.searchFilter}>
              <Ionicons name="options-outline" size={16} color={colors.primary600} />
            </View>
          </TouchableOpacity>

          {/* Quick Actions — horizontal chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {QUICK_ACTIONS.map(({ icon, label, bg, action }) => (
              <TouchableOpacity
                key={label}
                style={[styles.quickChip, { backgroundColor: bg }]}
                activeOpacity={0.75}
                onPress={() => router.push((action ?? tripAction) as any)}
              >
                <Ionicons name={icon as any} size={16} color="#fff" />
                <Text style={styles.quickChipLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── BODY ── */}
        <View style={styles.body}>

          {/* Upcoming Trip */}
          {!tripLoading && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chuyến đi sắp tới</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/workspace' as any)}>
                  <Text style={styles.sectionLink}>Tất cả →</Text>
                </TouchableOpacity>
              </View>

              {trip ? (
                <TouchableOpacity
                  style={styles.tripCard}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/trip/${trip.id}` as any)}
                >
                  <Image
                    source={{ uri: trip.cover_image ?? `https://picsum.photos/seed/${trip.id}/800/400` }}
                    style={styles.tripCardBg}
                  />
                  {/* Gradient-like overlay using two Views */}
                  <View style={styles.tripCardOverlayTop} />
                  <View style={styles.tripCardOverlayBottom} />

                  {/* Countdown badge */}
                  <View style={styles.tripCountdownBadge}>
                    <Text style={styles.tripCountdownNum}>{daysUntil}</Text>
                    <Text style={styles.tripCountdownUnit}>ngày</Text>
                  </View>

                  {/* Bottom info */}
                  <View style={styles.tripCardContent}>
                    <Text style={styles.tripCardTitle} numberOfLines={1}>{trip.title}</Text>
                    <View style={styles.tripCardRow}>
                      <View style={styles.tripCardLocation}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.tripCardDest} numberOfLines={1}>{trip.destination}</Text>
                      </View>
                      {trip.start_date && (
                        <Text style={styles.tripCardDate}>{trip.start_date}</Text>
                      )}
                    </View>
                    <View style={styles.tripCardCta}>
                      <Text style={styles.tripCardCtaText}>Xem lịch trình</Text>
                      <Ionicons name="arrow-forward" size={12} color={colors.primary600} />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.noTripCard}
                  onPress={() => router.push('/(app)/workspace' as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.noTripIcon}>
                    <Text style={{ fontSize: 32 }}>🗺️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noTripTitle}>Lên kế hoạch ngay!</Text>
                    <Text style={styles.noTripSub}>Chưa có chuyến đi nào sắp tới</Text>
                  </View>
                  <View style={styles.noTripArrow}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Today's Schedule */}
          {trip?.status === 'active' && scheduleItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hôm nay · Ngày {dayNumber}</Text>
              </View>
              <View style={styles.timelineCard}>
                {scheduleItems.map((item, idx) => (
                  <View key={item.id} style={styles.timelineRow}>
                    <View style={styles.timelineLine}>
                      <View style={styles.timelineDot} />
                      {idx < scheduleItems.length - 1 && <View style={styles.timelineConnector} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineSlot}>{SLOT_ICON[item.time_slot]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineTitle} numberOfLines={1}>{item.experience_title}</Text>
                        {item.experience_location && (
                          <Text style={styles.timelineLoc}>📍 {item.experience_location}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommended */}
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/explore' as any)}>
                <Text style={styles.sectionLink}>Xem thêm →</Text>
              </TouchableOpacity>
            </View>

            {/* 2-column grid for first 4 */}
            <View style={styles.recGrid}>
              {recommendations.slice(0, 4).map((item) => (
                <RecCard key={item.id} item={item} />
              ))}
            </View>

            {/* Horizontal scroll for rest */}
            {recommendations.length > 4 && (
              <FlatList
                horizontal
                data={recommendations.slice(4)}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12, marginTop: 12 }}
                renderItem={({ item }) => <RecCardSmall item={item} />}
              />
            )}
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function RecCard({ item }: { item: Experience }) {
  return (
    <TouchableOpacity
      style={styles.recCard}
      activeOpacity={0.88}
      onPress={() => router.push(`/experience/${item.id}` as any)}
    >
      <Image source={{ uri: item.coverImage }} style={styles.recCardImg} />
      <View style={styles.recCardOverlay} />
      <View style={styles.recCardContent}>
        <Text style={styles.recCardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.recCardMeta}>
          <Text style={styles.recCardLoc} numberOfLines={1}>📍 {item.location}</Text>
          <Text style={styles.recCardPrice}>{formatPrice(item.price)}đ</Text>
        </View>
      </View>
      <View style={styles.recCardRating}>
        <Ionicons name="star" size={10} color="#FBBF24" />
        <Text style={styles.recCardRatingText}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

function RecCardSmall({ item }: { item: Experience }) {
  return (
    <TouchableOpacity
      style={styles.recCardSmall}
      activeOpacity={0.88}
      onPress={() => router.push(`/experience/${item.id}` as any)}
    >
      <Image source={{ uri: item.coverImage }} style={styles.recCardSmallImg} />
      <View style={styles.recCardSmallOverlay} />
      <View style={styles.recCardSmallContent}>
        <Text style={styles.recCardSmallTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.recCardSmallPrice}>{formatPrice(item.price)}đ</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  // Hero
  hero:             { backgroundColor: colors.primary600, paddingHorizontal: spacing.lg, paddingBottom: 24 },
  heroTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroGreeting:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  heroName:         { fontSize: 22, color: '#fff', fontWeight: '800', marginTop: 2 },
  heroTagline:      { fontSize: 28, color: '#fff', fontWeight: '800', lineHeight: 34, marginBottom: 18 },
  avatarBtn:        { marginTop: 4 },
  avatarCircle:     { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText:       { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Search
  searchBar:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  searchPlaceholder:{ flex: 1, fontSize: 14, color: colors.textMuted },
  searchFilter:     { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },

  // Quick chips
  quickRow:         { gap: 10, paddingRight: 4 },
  quickChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  quickChipLabel:   { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Body
  body:             { paddingTop: 20 },
  section:          { paddingHorizontal: spacing.lg, marginBottom: 24 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:     { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  sectionLink:      { fontSize: 13, color: colors.primary600, fontWeight: '600' },

  // Trip card
  tripCard:         { height: 220, borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  tripCardBg:       { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  tripCardOverlayTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.15)' },
  tripCardOverlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 130, backgroundColor: 'rgba(0,0,0,0.55)' },
  tripCountdownBadge:    { position: 'absolute', top: 14, right: 14, backgroundColor: colors.primary600, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  tripCountdownNum:      { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 24 },
  tripCountdownUnit:     { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '500' },
  tripCardContent:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  tripCardTitle:         { color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 6 },
  tripCardRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tripCardLocation:      { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  tripCardDest:          { color: 'rgba(255,255,255,0.85)', fontSize: 12, flex: 1 },
  tripCardDate:          { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  tripCardCta:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tripCardCtaText:       { fontSize: 12, fontWeight: '700', color: colors.primary600 },

  // No trip
  noTripCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  noTripIcon:       { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  noTripTitle:      { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  noTripSub:        { fontSize: 12, color: colors.textMuted },
  noTripArrow:      { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary600, alignItems: 'center', justifyContent: 'center' },

  // Timeline
  timelineCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  timelineRow:      { flexDirection: 'row', gap: 12 },
  timelineLine:     { width: 20, alignItems: 'center' },
  timelineDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary600, marginTop: 4 },
  timelineConnector:{ width: 2, flex: 1, backgroundColor: colors.primary100, marginVertical: 4 },
  timelineContent:  { flex: 1, flexDirection: 'row', gap: 10, paddingBottom: 14 },
  timelineSlot:     { fontSize: 18, width: 26 },
  timelineTitle:    { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  timelineLoc:      { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Rec grid (2 columns)
  recGrid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 12 },
  recCard:          { width: '47.5%', height: 180, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  recCardImg:       { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  recCardOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  recCardContent:   { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  recCardTitle:     { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 4 },
  recCardMeta:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recCardLoc:       { color: 'rgba(255,255,255,0.8)', fontSize: 10, flex: 1 },
  recCardPrice:     { color: '#FCD34D', fontSize: 11, fontWeight: '700' },
  recCardRating:    { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  recCardRatingText:{ color: '#fff', fontSize: 10, fontWeight: '600' },

  // Rec card small (horizontal)
  recCardSmall:        { width: 140, height: 130, borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  recCardSmallImg:     { ...StyleSheet.absoluteFillObject, resizeMode: 'cover' },
  recCardSmallOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  recCardSmallContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 },
  recCardSmallTitle:   { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 15, marginBottom: 2 },
  recCardSmallPrice:   { color: '#FCD34D', fontSize: 10, fontWeight: '700' },
});
