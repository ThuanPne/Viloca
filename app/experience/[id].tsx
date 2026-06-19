import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Modal, FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockExperiences } from '@/src/data/mock/experiences';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Tag } from '@/src/components/ui/Tag';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { Trip, TimeSlot } from '@/src/types';

const CATEGORY_LABEL: Record<string, string> = {
  food_tour: 'Ẩm thực', workshop: 'Workshop', trekking: 'Thiên nhiên', cultural: 'Văn hóa',
};
const TIME_SLOTS: { value: TimeSlot; label: string; icon: string }[] = [
  { value: 'morning',   label: 'Buổi sáng',  icon: '🌅' },
  { value: 'afternoon', label: 'Buổi chiều', icon: '☀️' },
  { value: 'evening',   label: 'Buổi tối',   icon: '🌙' },
];
const STATUS_LABEL: Record<string, string> = {
  planning: 'Lên kế hoạch', active: 'Đang đi', completed: 'Hoàn thành',
};

function formatPrice(p: number) {
  return p.toLocaleString('vi-VN') + 'đ';
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

export default function ExperienceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const experience = mockExperiences.find((e) => e.id === id);

  // Modal state
  const [showModal, setShowModal]         = useState(false);
  const [trips, setTrips]                 = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips]   = useState(false);
  const [selectedTrip, setSelectedTrip]   = useState<Trip | null>(null);
  const [selectedDay, setSelectedDay]     = useState(1);
  const [selectedSlot, setSelectedSlot]   = useState<TimeSlot>('morning');
  const [note, setNote]                   = useState('');
  const [adding, setAdding]               = useState(false);
  const [addError, setAddError]           = useState('');

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
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setTrips(data ?? []);
    }
    setLoadingTrips(false);
  }, []);

  async function handleAddToTrip() {
    if (!selectedTrip || !experience) return;
    setAdding(true);
    setAddError('');
    const { error } = await supabase.from('trip_items').insert({
      trip_id:              selectedTrip.id,
      experience_id:        null,
      experience_title:     experience.title,
      experience_location:  experience.location,
      experience_image:     experience.coverImage,
      experience_category:  experience.category,
      day_number:           selectedDay,
      time_slot:            selectedSlot,
      note:                 note.trim() || null,
      sort_order:           0,
    });
    setAdding(false);
    if (error) {
      setAddError('Không thể thêm vào trip: ' + error.message);
      return;
    }
    setShowModal(false);
    router.push(`/trip/${selectedTrip.id}`);
  }

  if (!experience) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Không tìm thấy trải nghiệm</Text>
      </View>
    );
  }

  const maxDays = selectedTrip ? tripDayCount(selectedTrip) : 7;

  return (
    <View style={styles.container}>
      {/* Hero image */}
      <View style={styles.heroWrap}>
        <Image source={{ uri: experience.coverImage }} style={styles.hero} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.heroOverlay} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.categoryRow}>
            <Badge label={CATEGORY_LABEL[experience.category]} color="primary" />
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>⭐ {experience.rating} ({experience.reviewCount})</Text>
            </View>
          </View>
          <Text style={styles.title}>{experience.title}</Text>
          <Text style={styles.location}>📍 {experience.location}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{experience.durationHours} giờ</Text>
            </View>
            <View style={styles.metaSep} />
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatPrice(experience.price)} / người</Text>
            </View>
          </View>
        </View>

        {/* Guide */}
        <View style={styles.guideSection}>
          <Text style={styles.sectionTitle}>Người hướng dẫn</Text>
          <View style={styles.guideRow}>
            <Avatar uri={experience.guideAvatar} name={experience.guideName} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guideName}>{experience.guideName}</Text>
              <Text style={styles.guideLabel}>Local Guide</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.verifiedText}>Đã xác minh</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{experience.description}</Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsWrap}>
            {experience.tags.map((tag) => (
              <Tag key={tag} label={tag} color="forest" />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Giá từ</Text>
          <Text style={styles.priceValue}>{formatPrice(experience.price)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
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
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Experience mini card */}
            <View style={styles.expMini}>
              <Image source={{ uri: experience.coverImage }} style={styles.expMiniImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.expMiniTitle} numberOfLines={1}>{experience.title}</Text>
                <Text style={styles.expMiniLoc}>📍 {experience.location}</Text>
              </View>
            </View>

            {addError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Step 1: Pick Trip */}
              <Text style={styles.stepLabel}>1. Chọn chuyến đi</Text>
              {loadingTrips ? (
                <ActivityIndicator color={colors.primary600} style={{ marginVertical: 16 }} />
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
                      <Text style={[styles.tripOptionTitle, selectedTrip?.id === t.id && styles.tripOptionTitleActive]} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.tripOptionSub}>📍 {t.destination} · {STATUS_LABEL[t.status]}</Text>
                    </View>
                    {selectedTrip?.id === t.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary600} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {/* Step 2: Pick Day */}
              {selectedTrip && (
                <>
                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>2. Chọn ngày</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                        onPress={() => setSelectedDay(d)}
                      >
                        <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>Ngày {d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Step 3: Pick Slot */}
                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>3. Thời điểm</Text>
                  <View style={styles.slotRow}>
                    {TIME_SLOTS.map((slot) => (
                      <TouchableOpacity
                        key={slot.value}
                        style={[styles.slotBtn, selectedSlot === slot.value && styles.slotBtnActive]}
                        onPress={() => setSelectedSlot(slot.value)}
                      >
                        <Text style={styles.slotIcon}>{slot.icon}</Text>
                        <Text style={[styles.slotLabel, selectedSlot === slot.value && styles.slotLabelActive]}>
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Note */}
                  <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>4. Ghi chú (tuỳ chọn)</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Đặt vé trước / Mang giày trekking / ..."
                    placeholderTextColor={colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bgScreen },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap:           { position: 'relative', height: 280 },
  hero:               { width: '100%', height: 280, resizeMode: 'cover' },
  heroOverlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  backBtn:            { position: 'absolute', top: 48, left: spacing.lg, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  infoSection:        { padding: spacing.lg, paddingBottom: 0 },
  categoryRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  ratingPill:         { backgroundColor: colors.primary100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  ratingText:         { fontSize: 12, color: colors.primary600, fontWeight: '500' },
  title:              { fontSize: 22, fontWeight: '800', color: colors.textPrimary, lineHeight: 30, marginBottom: 6 },
  location:           { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  metaRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem:           { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:           { fontSize: 13, color: colors.textMuted },
  metaSep:            { width: 1, height: 16, backgroundColor: colors.border },
  guideSection:       { marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  sectionTitle:       { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  guideRow:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideName:          { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  guideLabel:         { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  verifiedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:       { fontSize: 12, color: '#059669' },
  section:            { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  description:        { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  tagsWrap:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.border },
  priceLabel:         { fontSize: 11, color: colors.textMuted },
  priceValue:         { fontSize: 18, fontWeight: '800', color: colors.primary600 },
  addBtn:             { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl },
  addBtnText:         { color: colors.textOnDark, fontWeight: '700', fontSize: 15 },
  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, maxHeight: '90%' },
  modalHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:         { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  expMini:            { flexDirection: 'row', gap: 10, backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: 10, marginBottom: spacing.lg, alignItems: 'center' },
  expMiniImg:         { width: 52, height: 52, borderRadius: radius.md, resizeMode: 'cover' },
  expMiniTitle:       { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  expMiniLoc:         { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  errorBox:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:          { flex: 1, color: colors.error, fontSize: 12 },
  stepLabel:          { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  noTrips:            { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  noTripsText:        { fontSize: 14, color: colors.textMuted },
  noTripsLink:        { fontSize: 14, color: colors.primary600, fontWeight: '600' },
  tripOption:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 8, backgroundColor: colors.bgScreen },
  tripOptionActive:   { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  tripOptionTitle:    { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tripOptionTitleActive: { color: colors.primary600 },
  tripOptionSub:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dayChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  dayChipActive:      { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  dayChipText:        { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  dayChipTextActive:  { color: colors.textOnDark },
  slotRow:            { flexDirection: 'row', gap: 8 },
  slotBtn:            { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen },
  slotBtnActive:      { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  slotIcon:           { fontSize: 18, marginBottom: 4 },
  slotLabel:          { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  slotLabelActive:    { color: colors.primary600 },
  noteInput:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 60, backgroundColor: colors.bgScreen },
});
