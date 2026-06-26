import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Modal, FlatList, TextInput, ActivityIndicator, Animated, Pressable, Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '@/src/hooks/useBookmarks';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import type { Location, Trip, TimeSlot, BookmarkStatus } from '@/src/types';

const TIME_SLOTS: { value: TimeSlot; label: string; icon: string }[] = [
  { value: 'morning',   label: 'Buổi sáng',  icon: '🌅' },
  { value: 'afternoon', label: 'Buổi chiều', icon: '☀️' },
  { value: 'evening',   label: 'Buổi tối',   icon: '🌙' },
];
const STATUS_LABEL: Record<string, string> = {
  planning: 'Lên kế hoạch', active: 'Đang đi', completed: 'Hoàn thành',
};
const BOOKMARK_ICON_COLOR: Record<BookmarkStatus, string> = {
  want: '#EF4444', planned: '#F59E0B', done: '#22C55E',
};
const BOOKMARK_LABEL: Record<BookmarkStatus, string> = {
  want: 'Muốn đi', planned: 'Đã kế hoạch', done: 'Đã đi',
};

function formatPrice(p: number) {
  if (p === 0) return 'Miễn phí';
  return p.toLocaleString('vi-VN') + 'đ';
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g${m}p` : `${h} giờ`;
}
function tripDayCount(trip: Trip): number {
  if (trip.start_date && trip.end_date) {
    const diff = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
    ) + 1;
    return Math.max(1, Math.min(diff, 14));
  }
  return 7;
}
function buildMapsUrl(loc: Location): string {
  if (loc.coordinates) return `https://maps.google.com/?q=${loc.coordinates.lat},${loc.coordinates.lng}`;
  const q = encodeURIComponent([loc.name, loc.address].filter(Boolean).join(', '));
  return `https://maps.google.com/?q=${q}`;
}

export default function ExperienceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookmarks, toggle, setStatus } = useBookmarks();
  const [location, setLocation]     = useState<Location | null>(null);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(false);
  const [openHours, setOpenHours]   = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [showBmSheet, setShowBmSheet] = useState(false);
  const bmScale  = useRef(new Animated.Value(1)).current;
  const scrollY  = useRef(new Animated.Value(0)).current;
  const bmStatus = id ? bookmarks[id] : undefined;

  const HERO_MAX = 240;
  const HERO_MIN = Math.round(HERO_MAX / 3); // 80px — 1/3 phần dưới hình
  const heroHeight = scrollY.interpolate({
    inputRange: [0, HERO_MAX - HERO_MIN],
    outputRange: [HERO_MAX, HERO_MIN],
    extrapolate: 'clamp',
  });
  const imageTranslate = scrollY.interpolate({
    inputRange: [0, HERO_MAX - HERO_MIN],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HERO_MAX - HERO_MIN],
    outputRange: [1, 0.4],
    extrapolate: 'clamp',
  });

  // Add to trip modal
  const [showModal, setShowModal]       = useState(false);
  const [trips, setTrips]               = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDay, setSelectedDay]   = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('morning');
  const [note, setNote]                 = useState('');
  const [adding, setAdding]             = useState(false);
  const [addError, setAddError]         = useState('');

  useEffect(() => {
    if (!id) return;
    supabase.from('locations').select('*').eq('id', id).single()
      .then(({ data }) => { setLocation(data); setLoading(false); });
  }, [id]);

  function handleBookmark() {
    Animated.sequence([
      Animated.timing(bmScale, { toValue: 1.5, duration: 90,  useNativeDriver: true }),
      Animated.timing(bmScale, { toValue: 1,   duration: 150, useNativeDriver: true }),
    ]).start();
    if (id) toggle(id);
  }

  const openModal = useCallback(async () => {
    setShowModal(true);
    setSelectedTrip(null);
    setSelectedDay(1);
    setSelectedSlot('morning');
    setNote('');
    setAddError('');
    setLoadingTrips(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('trips').select('*')
        .eq('user_id', session.user.id).order('created_at', { ascending: false });
      setTrips(data ?? []);
    }
    setLoadingTrips(false);
  }, []);

  async function handleAddToTrip() {
    if (!selectedTrip || !location) return;
    setAdding(true);
    setAddError('');
    const { error } = await supabase.from('trip_items').insert({
      trip_id:     selectedTrip.id,
      location_id: location.id,
      day_number:  selectedDay,
      time_slot:   selectedSlot,
      note:        note.trim() || null,
      sort_order:  0,
    });
    setAdding(false);
    if (error) { setAddError('Không thể thêm: ' + error.message); return; }
    setShowModal(false);
    router.push(`/trip/${selectedTrip.id}`);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.nomad.primary} /></View>;
  if (!location) return <View style={styles.center}><Text style={{ color: colors.nomad.onSurfaceVariant }}>Không tìm thấy địa điểm</Text></View>;

  const maxDays = selectedTrip ? tripDayCount(selectedTrip) : 7;
  const cityLine = [location.district, location.city ?? location.address].filter(Boolean).join(', ');
  const longDesc   = location.long_description ?? location.description ?? '';
  const shortText  = location.hint ?? location.short_description ?? '';
  const fullDesc   = longDesc;
  const TRUNCATE  = 200;
  const needsTruncate = fullDesc.length > TRUNCATE;
  const displayDesc   = (expanded || !needsTruncate) ? fullDesc : fullDesc.slice(0, TRUNCATE) + '…';

  return (
    <View style={styles.container}>
      {/* Hero — absolute, shrinks on scroll */}
      <Animated.View style={[styles.heroWrap, { height: heroHeight }]}>
        <Animated.View style={{ flex: 1, transform: [{ translateY: imageTranslate }], opacity: imageOpacity }}>
          {location.cover_image
            ? <Image source={{ uri: location.cover_image }} style={styles.hero} />
            : <View style={[styles.hero, styles.heroPlaceholder]} />}
        </Animated.View>
      </Animated.View>

      {/* Fixed buttons above hero */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={colors.nomad.onSurface} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.bmBtn} onPress={handleBookmark} onLongPress={() => setShowBmSheet(true)}>
        <Animated.View style={{ transform: [{ scale: bmScale }] }}>
          <Ionicons
            name={bmStatus ? 'heart' : 'heart-outline'}
            size={22}
            color={bmStatus ? BOOKMARK_ICON_COLOR[bmStatus] : '#fff'}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_MAX, paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.title}>{location.name}</Text>

          {/* Location chip */}
          {cityLine ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.nomad.onSurfaceVariant} />
              <Text style={styles.locationText}>{cityLine}</Text>
            </View>
          ) : null}

          {/* Vibes tags */}
          {location.vibes?.length > 0 && (
            <View style={styles.tagsRow}>
              {location.vibes.map((v) => (
                <View key={v} style={styles.tag}><Text style={styles.tagText}>{v}</Text></View>
              ))}
            </View>
          )}

          {/* Price + Duration row */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="cash-outline" size={14} color={colors.nomad.onSurfaceVariant} />
              <Text style={styles.metaText}>{formatPrice(location.price_per_person)}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={colors.nomad.onSurfaceVariant} />
              <Text style={styles.metaText}>{formatDuration(location.duration_minutes)}</Text>
            </View>
            {location.rating != null && (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>⭐ {Number(location.rating).toFixed(1)}</Text>
                </View>
              </>
            )}
            {location.opening_hours ? (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaChip}>
                  <Ionicons name="alarm-outline" size={14} color={colors.nomad.onSurfaceVariant} />
                  <Text style={styles.metaText}>{location.opening_hours}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Short description: hint nếu có, fallback sang full description */}
          {shortText ? (
            <Text style={styles.hint}>{shortText}</Text>
          ) : null}

          {/* Full description expandable — chỉ hiện khi hint tồn tại và description khác */}
          {fullDesc ? (
            <View style={styles.descWrap}>
              <Text style={styles.desc}>{displayDesc}</Text>
              {needsTruncate && (
                <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
                  <Text style={styles.expandBtn}>{expanded ? 'Ẩn bớt ▲' : 'Xem thêm ▼'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        {/* Giờ mở cửa accordion */}
        <TouchableOpacity style={styles.accordion} onPress={() => setOpenHours((v) => !v)} activeOpacity={0.8}>
          <Text style={styles.accordionTitle}>Giờ mở cửa</Text>
          <Ionicons name={openHours ? 'chevron-up' : 'chevron-down'} size={18} color={colors.nomad.onSurfaceVariant} />
        </TouchableOpacity>
        {openHours && (
          <View style={styles.accordionBody}>
            <Text style={styles.accordionText}>
              {location.opening_hours ?? 'Mở cửa hàng ngày · Liên hệ để xác nhận giờ cụ thể'}
            </Text>
          </View>
        )}
        <View style={styles.divider} />

        {/* Liên hệ & Địa chỉ accordion */}
        <TouchableOpacity style={styles.accordion} onPress={() => setOpenContact((v) => !v)} activeOpacity={0.8}>
          <Text style={styles.accordionTitle}>Liên hệ & Địa chỉ</Text>
          <Ionicons name={openContact ? 'chevron-up' : 'chevron-down'} size={18} color={colors.nomad.onSurfaceVariant} />
        </TouchableOpacity>
        {openContact && (
          <View style={styles.accordionBody}>
            {location.address ? (
              <View style={styles.contactRow}>
                <Ionicons name="location-outline" size={15} color={colors.nomad.onSurfaceVariant} />
                <Text style={styles.accordionText}>{location.address}</Text>
              </View>
            ) : null}
            {location.phone ? (
              <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`tel:${location.phone}`)}>
                <Ionicons name="call-outline" size={15} color={colors.nomad.onSurfaceVariant} />
                <Text style={[styles.accordionText, { color: colors.nomad.primary }]}>{location.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {location.website ? (
              <TouchableOpacity style={styles.contactRow} onPress={() => location.website && Linking.openURL(location.website)}>
                <Ionicons name="globe-outline" size={15} color={colors.nomad.onSurfaceVariant} />
                <Text style={[styles.accordionText, { color: colors.nomad.primary }]} numberOfLines={1}>{location.website}</Text>
              </TouchableOpacity>
            ) : null}
            {!location.address && !location.phone && !location.website && (
              <Text style={styles.accordionText}>Chưa có thông tin liên hệ</Text>
            )}
          </View>
        )}
        <View style={styles.divider} />
      </Animated.ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mapsBtn} onPress={() => Linking.openURL(buildMapsUrl(location))} activeOpacity={0.85}>
          <Ionicons name="map-outline" size={17} color={colors.nomad.onPrimary} />
          <Text style={styles.mapsBtnText}>Mở Google Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={openModal} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={17} color={colors.nomad.primary} />
          <Text style={styles.addBtnText}>Thêm vào Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Trip Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm vào Trip</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.nomad.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.expMini}>
              {location.cover_image
                ? <Image source={{ uri: location.cover_image }} style={styles.expMiniImg} />
                : <View style={[styles.expMiniImg, { backgroundColor: colors.nomad.outlineVariant }]} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.expMiniTitle} numberOfLines={1}>{location.name}</Text>
                {cityLine ? <Text style={styles.expMiniLoc}>📍 {cityLine}</Text> : null}
              </View>
            </View>

            {addError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.stepLabel}>1. Chọn chuyến đi</Text>
              {loadingTrips ? (
                <ActivityIndicator color={colors.nomad.primary} style={{ marginVertical: 16 }} />
              ) : trips.length === 0 ? (
                <View style={styles.noTrips}>
                  <Text style={styles.noTripsText}>Bạn chưa có chuyến đi nào.</Text>
                  <TouchableOpacity onPress={() => { setShowModal(false); router.push('/(app)/workspace'); }}>
                    <Text style={styles.noTripsLink}>Tạo trip mới →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                trips.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tripOption, selectedTrip?.id === t.id && styles.tripOptionActive]}
                    onPress={() => { setSelectedTrip(t); setSelectedDay(1); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tripOptionTitle, selectedTrip?.id === t.id && styles.tripOptionTitleActive]} numberOfLines={1}>{t.title}</Text>
                      <Text style={styles.tripOptionSub}>📍 {t.destination} · {STATUS_LABEL[t.status]}</Text>
                    </View>
                    {selectedTrip?.id === t.id && <Ionicons name="checkmark-circle" size={20} color={colors.nomad.primary} />}
                  </TouchableOpacity>
                ))
              )}

              {selectedTrip && (
                <>
                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>2. Chọn ngày</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, alignItems: 'center' }}>
                    {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity key={d} style={[styles.dayChip, selectedDay === d && styles.dayChipActive]} onPress={() => setSelectedDay(d)}>
                        <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>Ngày {d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>3. Thời điểm</Text>
                  <View style={styles.slotRow}>
                    {TIME_SLOTS.map((slot) => (
                      <TouchableOpacity key={slot.value} style={[styles.slotBtn, selectedSlot === slot.value && styles.slotBtnActive]} onPress={() => setSelectedSlot(slot.value)}>
                        <Text style={styles.slotIcon}>{slot.icon}</Text>
                        <Text style={[styles.slotLabel, selectedSlot === slot.value && styles.slotLabelActive]}>{slot.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>4. Ghi chú (tuỳ chọn)</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Đặt vé trước / Mang giày trekking / ..."
                    placeholderTextColor={colors.nomad.onSurfaceVariant}
                    value={note} onChangeText={setNote}
                    multiline numberOfLines={2} textAlignVertical="top"
                  />
                  <View style={{ marginTop: spacing.lg }}>
                    <Button label="Thêm vào lịch trình" onPress={handleAddToTrip} loading={adding} />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bookmark sheet */}
      <Modal visible={showBmSheet} transparent animationType="slide" onRequestClose={() => setShowBmSheet(false)}>
        <Pressable style={styles.bmOverlay} onPress={() => setShowBmSheet(false)}>
          <Pressable style={styles.bmSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.bmHandle} />
            <Text style={styles.bmSheetTitle}>Lưu địa điểm</Text>
            {(['want', 'planned', 'done'] as BookmarkStatus[]).map((s) => (
              <TouchableOpacity key={s} style={styles.bmItem} onPress={() => { if (id) setStatus(id, s); setShowBmSheet(false); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="heart" size={18} color={BOOKMARK_ICON_COLOR[s]} />
                  <Text style={[styles.bmItemText, bmStatus === s && { fontWeight: '700', color: colors.nomad.primary }]}>{BOOKMARK_LABEL[s]}</Text>
                </View>
                {bmStatus === s && <Ionicons name="checkmark" size={18} color={colors.nomad.primary} />}
              </TouchableOpacity>
            ))}
            {bmStatus && (
              <TouchableOpacity style={[styles.bmItem, { borderBottomWidth: 0 }]} onPress={() => { if (id) setStatus(id, null); setShowBmSheet(false); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="heart-dislike-outline" size={18} color={colors.nomad.onSurfaceVariant} />
                  <Text style={[styles.bmItemText, { color: colors.nomad.onSurfaceVariant }]}>Bỏ lưu</Text>
                </View>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.nomad.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroWrap:         { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 2 },
  hero:             { width: '100%', height: 240, resizeMode: 'cover' },
  heroPlaceholder:  { height: 240, backgroundColor: colors.nomad.outlineVariant },
  backBtn:          { position: 'absolute', top: 48, left: spacing.lg, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bmBtn:            { position: 'absolute', top: 48, right: spacing.lg, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },

  // Body
  body:         { padding: spacing.lg },
  title:        { fontSize: 22, fontWeight: '800', color: colors.nomad.onSurface, lineHeight: 30, marginBottom: 8 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 13, color: colors.nomad.onSurfaceVariant },
  tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tag:          { backgroundColor: colors.nomad.surfaceContainerLow, borderWidth: 1, borderColor: colors.nomad.outlineVariant, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  tagText:      { fontSize: 12, color: colors.nomad.onSurface, fontWeight: '500' },
  metaRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 13, color: colors.nomad.onSurfaceVariant },
  metaDot:      { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.nomad.outlineVariant },
  hint:         { fontSize: 15, fontWeight: '700', color: colors.nomad.onSurface, lineHeight: 22, marginBottom: 10 },
  descWrap:     { marginBottom: 4 },
  desc:         { fontSize: 14, color: colors.nomad.onSurfaceVariant, lineHeight: 22 },
  expandBtn:    { fontSize: 13, color: colors.nomad.secondary, fontWeight: '600', marginTop: 6 },

  // Accordions
  accordion:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 18 },
  accordionTitle: { fontSize: 15, fontWeight: '600', color: colors.nomad.onSurface },
  accordionBody:  { paddingHorizontal: spacing.lg, paddingBottom: 16, gap: 10 },
  accordionText:  { fontSize: 14, color: colors.nomad.onSurfaceVariant, lineHeight: 20, flex: 1 },
  contactRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  divider:        { height: 1, backgroundColor: colors.nomad.outlineVariant, marginHorizontal: spacing.lg },

  // Bottom bar
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, backgroundColor: colors.nomad.surfaceContainerLow, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant },
  mapsBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.nomad.secondary, paddingVertical: 13, borderRadius: radius.xl },
  mapsBtnText:  { color: colors.nomad.onPrimary, fontWeight: '700', fontSize: 14 },
  addBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.nomad.surfaceContainerLow, paddingVertical: 13, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.nomad.primary },
  addBtnText:   { color: colors.nomad.primary, fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:           { backgroundColor: colors.nomad.surfaceContainerLow, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, maxHeight: '90%' },
  modalHandle:          { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.nomad.outlineVariant, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:           { fontSize: 18, fontWeight: '800', color: colors.nomad.onSurface },
  expMini:              { flexDirection: 'row', gap: 10, backgroundColor: colors.nomad.background, borderRadius: radius.md, padding: 10, marginBottom: spacing.lg, alignItems: 'center' },
  expMiniImg:           { width: 52, height: 52, borderRadius: radius.md, resizeMode: 'cover' },
  expMiniTitle:         { fontSize: 13, fontWeight: '600', color: colors.nomad.onSurface },
  expMiniLoc:           { fontSize: 11, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  errorBox:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:            { flex: 1, color: colors.error, fontSize: 12 },
  stepLabel:            { fontSize: 12, fontWeight: '700', color: colors.nomad.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  noTrips:              { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  noTripsText:          { fontSize: 14, color: colors.nomad.onSurfaceVariant },
  noTripsLink:          { fontSize: 14, color: colors.nomad.primary, fontWeight: '600' },
  tripOption:           { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.outlineVariant, marginBottom: 8, backgroundColor: colors.nomad.background },
  tripOptionActive:     { borderColor: colors.nomad.primary, backgroundColor: colors.nomad.secondaryContainer },
  tripOptionTitle:      { fontSize: 14, fontWeight: '600', color: colors.nomad.onSurface },
  tripOptionTitleActive:{ color: colors.nomad.primary },
  tripOptionSub:        { fontSize: 12, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  dayChip:              { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.nomad.background, borderWidth: 1, borderColor: colors.nomad.outlineVariant },
  dayChipActive:        { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  dayChipText:          { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontWeight: '500' },
  dayChipTextActive:    { color: colors.nomad.onPrimary },
  slotRow:              { flexDirection: 'row', gap: 8 },
  slotBtn:              { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.outlineVariant, backgroundColor: colors.nomad.background },
  slotBtnActive:        { borderColor: colors.nomad.primary, backgroundColor: colors.nomad.secondaryContainer },
  slotIcon:             { fontSize: 18, marginBottom: 4 },
  slotLabel:            { fontSize: 12, color: colors.nomad.onSurfaceVariant, fontWeight: '500' },
  slotLabelActive:      { color: colors.nomad.primary },
  noteInput:            { borderWidth: 1, borderColor: colors.nomad.outlineVariant, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.nomad.onSurface, minHeight: 60, backgroundColor: colors.nomad.background },

  // Bookmark sheet
  bmOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  bmSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: spacing.lg, paddingBottom: 32 },
  bmHandle:     { width: 40, height: 4, backgroundColor: colors.nomad.outlineVariant, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  bmSheetTitle: { fontSize: 16, fontWeight: '700', color: colors.nomad.onSurface, marginBottom: spacing.md },
  bmItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  bmItemText:   { fontSize: 15, color: colors.nomad.onSurface },
});
