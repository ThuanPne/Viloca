import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Image, Modal, Pressable, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from '@/src/components/ui/Badge';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import {
  getTourById, updateTourStatus,
  type MockBookingDetail, type TourStatus,
} from '@/src/data/mockTourData';

const N = colors.nomad;
const COVER_MAX = 220;
const COVER_MIN = 72;

const STATUS_LABEL: Record<TourStatus, string> = {
  pending:   'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  active:    'Đang dẫn',
  completed: 'Hoàn thành',
};
const STATUS_COLOR: Record<TourStatus, 'warning' | 'forest' | 'neutral'> = {
  pending:   'warning',
  confirmed: 'forest',
  active:    'forest',
  completed: 'neutral',
};

const CATEGORY_COLOR: Record<string, string> = {
  'Điểm danh': '#64748b',
  'Di tích':   '#7c3aed',
  'Tâm linh':  '#d97706',
  'Ẩm thực':   '#dc2626',
  'Thiên nhiên':'#16a34a',
  'Văn hóa':   '#0ea5e9',
};

function formatVND(n: number) {
  return (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('vi-VN') + ' ₫';
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Category dot ─────────────────────────────────────────────────────────────

function CatDot({ category, checked }: { category: string; checked?: boolean }) {
  const color = checked ? N.primary : (CATEGORY_COLOR[category] ?? N.outline);
  return <View style={[s.catDot, { backgroundColor: color }]} />;
}

// ─── Star selector ────────────────────────────────────────────────────────────

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={8}>
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={32}
            color={i <= value ? '#F59E0B' : N.outlineVariant}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [tour, setTour] = useState<MockBookingDetail | undefined>(() => getTourById(id ?? ''));
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useFocusEffect(useCallback(() => {
    const fresh = getTourById(id ?? '');
    if (fresh) setTour({ ...fresh });
  }, [id]));

  if (!tour) {
    return (
      <View style={s.center}>
        <Text style={s.noTourText}>Không tìm thấy tour</Text>
      </View>
    );
  }

  const coverContentOpacity = scrollY.interpolate({
    inputRange: [0, COVER_MAX - COVER_MIN],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const coverParallax = scrollY.interpolate({
    inputRange: [0, COVER_MAX],
    outputRange: [0, -COVER_MAX * 0.4],
    extrapolate: 'clamp',
  });
  // Solid header bg fades in as cover scrolls away (native driver)
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [COVER_MAX - 60, COVER_MAX],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const allChecked = tour.schedule.length > 0 && completedStops.size === tour.schedule.length;

  function toggleStop(stopId: string) {
    setCompletedStops((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });
  }

  function handleStartTour() {
    updateTourStatus(tour!.id, 'active');
    setTour((prev) => prev ? { ...prev, status: 'active' } : prev);
  }

  function handleCompleteTour() {
    updateTourStatus(tour!.id, 'completed');
    setTour((prev) => prev ? { ...prev, status: 'completed' } : prev);
    setShowCompleteModal(false);
    setShowReviewModal(true);
  }

  function handleSubmitReview() {
    setShowReviewModal(false);
    router.replace('/(app)/my-tours');
  }

  function handleAcceptPending() {
    updateTourStatus(tour!.id, 'confirmed');
    setTour((prev) => prev ? { ...prev, status: 'confirmed' } : prev);
  }

  const coverUrl = `https://picsum.photos/seed/${tour.coverSeed}/800/500`;

  // ─── Render ───────────────────────────────────────────────────────────────

  const HEADER_H = 48;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>

      {/* Cover — absolutely positioned, height is fixed (no animation) */}
      <View style={[s.coverWrap, { top: HEADER_H }]}>
        <Animated.Image
          source={{ uri: coverUrl }}
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverParallax }] }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[s.coverContent, { opacity: coverContentOpacity }]}>
          <View style={s.coverTopRow}>
            <Badge label={STATUS_LABEL[tour.status]} color={STATUS_COLOR[tour.status]} />
            <View style={s.bookingCodeChip}>
              <Text style={s.bookingCodeText}>#{tour.bookingCode}</Text>
            </View>
          </View>
          <View style={s.coverBottomRow}>
            <Text style={s.coverTitle} numberOfLines={2}>{tour.title}</Text>
            <Text style={s.coverMeta}>📅 {tour.dateLabel}  ·  {tour.timeRange}</Text>
            <Text style={s.coverMeta} numberOfLines={1}>📍 {tour.meetingPoint}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Fixed header — overlaid on cover with fading solid bg */}
      <View style={[s.fixedHeader, { height: HEADER_H }]}>
        <Animated.View style={[s.headerBg, { opacity: headerBgOpacity }]} />
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chi tiết Booking</Text>
        <TouchableOpacity style={s.moreBtn} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable body — paddingTop pushes content below cover */}
      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: COVER_MAX, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* ── KHÁCH HÀNG ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="KHÁCH HÀNG" />
          <View style={s.customerCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{tour.customer.initials}</Text>
            </View>
            <View style={s.customerInfo}>
              <Text style={s.customerName}>{tour.customer.name}</Text>
              <Text style={s.customerRole}>{tour.customer.role} · {tour.customer.source}</Text>
              <View style={s.customerMeta}>
                <View style={s.metaPill}>
                  <Ionicons name="people-outline" size={12} color={N.primary} />
                  <Text style={s.metaPillText}>{tour.customer.guestCount} khách</Text>
                </View>
                <View style={s.metaPill}>
                  <Ionicons name="language-outline" size={12} color={N.primary} />
                  <Text style={s.metaPillText}>{tour.customer.language}</Text>
                </View>
              </View>
            </View>
            <View style={s.customerActions}>
              <TouchableOpacity style={s.iconCircleBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={N.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconCircleBtn}>
                <Ionicons name="call-outline" size={18} color={N.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── YÊU CẦU ĐẶC BIỆT ──────────────────────────────────────────── */}
        {tour.specialRequests.length > 0 && (
          <View style={s.section}>
            <SectionHeader
              title="YÊU CẦU ĐẶC BIỆT"
              right={
                <View style={s.countBadge}>
                  <Text style={s.countBadgeText}>{tour.specialRequests.length}</Text>
                </View>
              }
            />
            <View style={s.requestList}>
              {tour.specialRequests.map((req, i) => (
                <View key={i} style={s.requestItem}>
                  <Text style={s.requestEmoji}>{req.emoji}</Text>
                  <Text style={s.requestText}>{req.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── LỊCH TRÌNH ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader
            title="LỊCH TRÌNH"
            right={
              tour.status === 'active' ? (
                <View style={s.progressChip}>
                  <Text style={s.progressChipText}>{completedStops.size}/{tour.schedule.length} điểm đã ghé</Text>
                </View>
              ) : (
                <View style={[s.progressChip, { backgroundColor: N.surfaceContainer }]}>
                  <Text style={[s.progressChipText, { color: N.onSurfaceVariant }]}>{tour.schedule.length} điểm</Text>
                </View>
              )
            }
          />

          <View style={s.timeline}>
            {tour.schedule.map((stop, i) => {
              const isChecked = completedStops.has(stop.id);
              const isLast = i === tour.schedule.length - 1;
              const isActive = tour.status === 'active';

              return (
                <View key={stop.id}>
                  <View style={s.timelineRow}>
                    {/* Time column */}
                    <Text style={s.stopTime}>{stop.time}</Text>

                    {/* Dot + line column */}
                    <View style={s.dotCol}>
                      <View style={[s.dot, isChecked && s.dotChecked]} />
                      {!isLast && <View style={s.line} />}
                    </View>

                    {/* Content */}
                    <View style={s.stopContent}>
                      <View style={s.stopNameRow}>
                        <CatDot category={stop.category} checked={isChecked} />
                        <Text style={[s.stopName, isChecked && s.stopNameDone]} numberOfLines={2}>
                          {stop.name}
                        </Text>
                        {isActive && (
                          <TouchableOpacity onPress={() => toggleStop(stop.id)} style={s.checkbox} hitSlop={6}>
                            <Ionicons
                              name={isChecked ? 'checkmark-circle' : 'ellipse-outline'}
                              size={22}
                              color={isChecked ? N.primary : N.outlineVariant}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={s.stopMeta}>
                        <View style={s.catTag}>
                          <Text style={[s.catTagText, { color: CATEGORY_COLOR[stop.category] ?? N.outline }]}>
                            {stop.category}
                          </Text>
                        </View>
                        <Text style={s.stopDuration}>⏱ {stop.durationLabel}</Text>
                      </View>

                      {/* Travel to next */}
                      {stop.travelNext && !isLast && (
                        <View style={s.travelNext}>
                          <Ionicons
                            name={stop.travelNext.mode === 'walk' ? 'walk-outline' : 'car-outline'}
                            size={12}
                            color={N.onSurfaceVariant}
                          />
                          <Text style={s.travelNextText}>{stop.travelNext.label}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── THANH TOÁN ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="THANH TOÁN" />
          <View style={s.payCard}>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Giá tour</Text>
              <Text style={s.payValue}>{formatVND(tour.payment.base)}</Text>
            </View>
            {tour.payment.extras.map((ex, i) => (
              <View key={i} style={s.payRow}>
                <Text style={s.payLabel}>{ex.label}</Text>
                <Text style={[s.payValue, ex.amount < 0 && { color: colors.error }]}>
                  {formatVND(ex.amount)}
                </Text>
              </View>
            ))}
            <View style={s.payDivider} />
            <View style={s.payRow}>
              <Text style={s.payTotalLabel}>Bạn nhận</Text>
              <Text style={s.payTotalValue}>{formatVND(tour.payment.total)}</Text>
            </View>
            <View style={s.payInfoChip}>
              <Ionicons name="information-circle-outline" size={14} color={N.primary} />
              <Text style={s.payInfoText}>
                Thanh toán được chuyển trong vòng 24h sau khi tour hoàn thành
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Fixed bottom bar ───────────────────────────────────────────────── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {tour.status === 'pending' && (
          <View style={s.bottomRow}>
            <TouchableOpacity style={s.rejectBtn}>
              <Text style={s.rejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={handleAcceptPending}>
              <Ionicons name="checkmark" size={16} color={N.onPrimary} />
              <Text style={s.acceptText}>Nhận tour</Text>
            </TouchableOpacity>
          </View>
        )}

        {tour.status === 'confirmed' && (
          <View style={s.bottomRow}>
            <TouchableOpacity style={s.chatIconBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={N.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.primaryBtn} onPress={handleStartTour}>
              <Text style={s.primaryBtnText}>Bắt đầu tour →</Text>
            </TouchableOpacity>
          </View>
        )}

        {tour.status === 'active' && (
          <View style={s.bottomRow}>
            <TouchableOpacity style={s.chatIconBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={N.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryBtn, !allChecked && s.primaryBtnDisabled]}
              disabled={!allChecked}
              onPress={() => setShowCompleteModal(true)}
            >
              <Text style={[s.primaryBtnText, !allChecked && s.primaryBtnTextDisabled]}>
                Hoàn thành tour ✓
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {tour.status === 'completed' && (
          <View style={s.bottomRow}>
            <TouchableOpacity style={[s.primaryBtn, { flex: 1, backgroundColor: N.surfaceContainer }]}>
              <Ionicons name="star-outline" size={16} color={N.primary} />
              <Text style={[s.primaryBtnText, { color: N.primary }]}>Xem đánh giá</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Complete confirmation modal ─────────────────────────────────── */}
      <Modal visible={showCompleteModal} transparent animationType="fade" onRequestClose={() => setShowCompleteModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowCompleteModal(false)} />
        <View style={s.modalBox}>
          <Text style={s.modalEmoji}>🎉</Text>
          <Text style={s.modalTitle}>Tour hoàn thành!</Text>
          <Text style={s.modalBody}>Xác nhận kết thúc tour và ghi nhận thu nhập?</Text>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowCompleteModal(false)}>
              <Text style={s.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalConfirmBtn} onPress={handleCompleteTour}>
              <Text style={s.modalConfirmText}>Xác nhận hoàn thành</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Review modal ───────────────────────────────────────────────── */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={handleSubmitReview}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={s.modalOverlay} onPress={handleSubmitReview} />
          <View style={[s.reviewSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.handle} />
            <Text style={s.reviewTitle}>Khách đã để lại đánh giá</Text>
            <Text style={s.reviewSubtitle}>Chọn số sao mà khách đã đánh giá cho bạn</Text>
            <StarRow value={reviewStars} onChange={setReviewStars} />
            <TextInput
              style={s.reviewInput}
              placeholder="Nhận xét của khách..."
              placeholderTextColor={N.outlineVariant}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
            <TouchableOpacity style={s.reviewSubmitBtn} onPress={handleSubmitReview}>
              <Text style={s.reviewSubmitText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: N.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noTourText: { fontSize: 16, color: N.onSurfaceVariant },

  // Fixed header — sits above cover (zIndex)
  fixedHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject as object,
    backgroundColor: N.surface,
    borderBottomWidth: 1,
    borderBottomColor: N.outlineVariant,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  moreBtn:     { padding: 4 },

  // Cover — absolutely positioned, never changes size
  coverWrap:    { position: 'absolute', left: 0, right: 0, height: COVER_MAX, overflow: 'hidden', backgroundColor: N.surfaceContainer, zIndex: 1 },
  coverContent: { ...StyleSheet.absoluteFillObject as object, padding: spacing.lg, justifyContent: 'space-between' },
  coverTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverBottomRow: { gap: 4 },
  coverTitle:   { fontSize: 20, fontWeight: '800', color: '#fff' },
  coverMeta:    { fontSize: 13, color: 'rgba(255,255,255,0.88)' },

  bookingCodeChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  bookingCodeText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Scroll — sits on top of cover, transparent so cover shows through paddingTop area
  scroll:        { flex: 1, zIndex: 2 },
  scrollContent: { gap: 0 },

  // Section
  section:       { backgroundColor: N.surface, marginTop: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: N.outline, letterSpacing: 0.8 },

  countBadge:     { backgroundColor: N.primary, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, color: N.onPrimary, fontWeight: '700' },

  progressChip:     { backgroundColor: N.onPrimaryContainer, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  progressChipText: { fontSize: 12, color: N.primary, fontWeight: '600' },

  // Customer card
  customerCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar:          { width: 48, height: 48, borderRadius: 24, backgroundColor: N.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontSize: 17, fontWeight: '800', color: N.onPrimary },
  customerInfo:    { flex: 1, gap: 3 },
  customerName:    { fontSize: 15, fontWeight: '700', color: N.onSurface },
  customerRole:    { fontSize: 12, color: N.onSurfaceVariant },
  customerMeta:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  metaPill:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: N.onPrimaryContainer, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  metaPillText:    { fontSize: 12, color: N.primary, fontWeight: '500' },
  customerActions: { gap: 6 },
  iconCircleBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center' },

  // Special requests
  requestList: { gap: spacing.sm },
  requestItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#FFFBEB', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: '#FDE68A' },
  requestEmoji: { fontSize: 16 },
  requestText:  { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },

  // Timeline
  timeline:    { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 0, paddingBottom: 4 },

  stopTime:   { width: 44, fontSize: 12, fontWeight: '600', color: N.onSurfaceVariant, paddingTop: 2, textAlign: 'right' },
  dotCol:     { width: 36, alignItems: 'center', paddingTop: 4 },
  dot:        { width: 12, height: 12, borderRadius: 6, backgroundColor: N.outlineVariant, borderWidth: 2, borderColor: N.surface },
  dotChecked: { backgroundColor: N.primary, borderColor: N.onPrimaryContainer },
  line:       { width: 2, flex: 1, minHeight: 40, backgroundColor: N.outlineVariant, marginTop: 4 },

  stopContent: { flex: 1, paddingBottom: 20, paddingTop: 0 },
  stopNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  catDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  stopName:    { flex: 1, fontSize: 14, fontWeight: '600', color: N.onSurface, lineHeight: 20 },
  stopNameDone:{ textDecorationLine: 'line-through', color: N.outline },
  checkbox:    { marginLeft: 'auto' },

  stopMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginLeft: 14 },
  catTag:       { borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  catTagText:   { fontSize: 11, fontWeight: '600' },
  stopDuration: { fontSize: 11, color: N.onSurfaceVariant },

  travelNext:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginLeft: 14 },
  travelNextText: { fontSize: 11, color: N.onSurfaceVariant, fontStyle: 'italic' },

  // Payment
  payCard:       { backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  payRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel:      { fontSize: 13, color: N.onSurfaceVariant },
  payValue:      { fontSize: 13, color: N.onSurface, fontWeight: '500' },
  payDivider:    { height: 1, backgroundColor: N.outlineVariant, marginVertical: 2 },
  payTotalLabel: { fontSize: 14, fontWeight: '700', color: N.onSurface },
  payTotalValue: { fontSize: 18, fontWeight: '800', color: N.primary },
  payInfoChip:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4, backgroundColor: N.onPrimaryContainer, borderRadius: radius.md, padding: spacing.sm },
  payInfoText:   { fontSize: 11, color: N.primary, flex: 1, lineHeight: 16 },

  // Bottom bar
  bottomBar:  { backgroundColor: N.surface, borderTopWidth: 1, borderTopColor: N.outlineVariant, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  bottomRow:  { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  rejectBtn:  { flex: 1, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center' },
  rejectText: { fontSize: 14, color: N.onSurfaceVariant, fontWeight: '600' },
  acceptBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: N.primary, paddingVertical: 13, borderRadius: radius.lg },
  acceptText: { fontSize: 14, color: N.onPrimary, fontWeight: '700' },

  chatIconBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center' },

  primaryBtn:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: N.primary, paddingVertical: 13, borderRadius: radius.lg },
  primaryBtnDisabled:    { backgroundColor: N.surfaceContainer },
  primaryBtnText:        { fontSize: 15, fontWeight: '700', color: N.onPrimary },
  primaryBtnTextDisabled:{ color: N.outline },

  // Complete modal
  modalOverlay:    { ...StyleSheet.absoluteFillObject as object, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalBox:        { position: 'absolute', alignSelf: 'center', top: '30%', width: '85%', backgroundColor: N.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  modalEmoji:      { fontSize: 40 },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: N.onSurface },
  modalBody:       { fontSize: 14, color: N.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  modalActions:    { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
  modalCancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: N.onSurfaceVariant, fontWeight: '600' },
  modalConfirmBtn: { flex: 2, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: N.primary, alignItems: 'center' },
  modalConfirmText:{ fontSize: 14, color: N.onPrimary, fontWeight: '700' },

  // Review sheet
  reviewSheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: N.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  handle:            { width: 40, height: 4, borderRadius: 2, backgroundColor: N.outlineVariant, marginBottom: spacing.sm },
  reviewTitle:       { fontSize: 18, fontWeight: '800', color: N.onSurface, textAlign: 'center' },
  reviewSubtitle:    { fontSize: 13, color: N.onSurfaceVariant, textAlign: 'center' },
  starRow:           { flexDirection: 'row', gap: 8 },
  reviewInput:       { width: '100%', minHeight: 90, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.lg, padding: spacing.md, fontSize: 14, color: N.onSurface, backgroundColor: N.surfaceContainerLow },
  reviewSubmitBtn:   { width: '100%', backgroundColor: N.primary, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  reviewSubmitText:  { fontSize: 15, fontWeight: '700', color: N.onPrimary },
});
