import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import {
  MOCK_BOOKING_DETAILS, updateTourStatus,
  type MockBookingDetail, type TourStatus,
} from '@/src/data/mockTourData';

const N = colors.nomad;

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterTab = 'upcoming' | 'active' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDeadline(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

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

function filterTours(tours: MockBookingDetail[], tab: FilterTab) {
  if (tab === 'upcoming')  return tours.filter((t) => t.status === 'pending' || t.status === 'confirmed');
  if (tab === 'active')    return tours.filter((t) => t.status === 'active');
  return tours.filter((t) => t.status === 'completed');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaIcon}>{icon}</Text>
      <Text style={s.metaText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function TourCard({ tour, onAccept }: { tour: MockBookingDetail; onAccept: (t: MockBookingDetail) => void }) {
  const isPending = tour.status === 'pending';

  return (
    <View style={s.card}>
      {/* Cover image placeholder */}
      <View style={s.cardCover}>
        <Ionicons name="image-outline" size={32} color={N.outlineVariant} />
        {/* Status badge */}
        <View style={s.badgeWrap}>
          <Badge label={STATUS_LABEL[tour.status]} color={STATUS_COLOR[tour.status]} />
        </View>
        {/* Deadline chip — only for pending */}
        {isPending && tour.deadlineMinutes !== null && (
          <View style={s.deadlineChip}>
            <Ionicons name="time-outline" size={11} color="#C0392B" />
            <Text style={s.deadlineText}>Hết hạn: {formatDeadline(tour.deadlineMinutes)}</Text>
          </View>
        )}
      </View>

      {/* Card body */}
      <View style={s.cardBody}>
        <Text style={s.tourTitle} numberOfLines={2}>{tour.title}</Text>

        <View style={s.metaGroup}>
          <MetaRow icon="📅" text={`${tour.dateLabel} · ${tour.timeRange}`} />
          <MetaRow icon="📍" text={tour.meetingPoint} />
          <MetaRow icon="👥" text={`${tour.customer.guestCount} khách · ${tour.customer.language}`} />
        </View>

        {/* Earnings row */}
        <View style={s.earningsRow}>
          <Ionicons name="cash-outline" size={14} color={N.primary} />
          <Text style={s.earningsLabel}>Bạn nhận: </Text>
          <Text style={s.earningsValue}>{formatVND(tour.guideEarning)}</Text>
        </View>

        {/* Special requests note */}
        {tour.specialRequests.length > 0 && (
          <View style={s.noteBox}>
            <Ionicons name="warning-outline" size={13} color="#B7791F" />
            <Text style={s.noteText}>{tour.specialRequests[0].text}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={s.divider} />

        {/* Action buttons */}
        {isPending ? (
          <View style={s.actionRow}>
            <TouchableOpacity style={s.rejectBtn}>
              <Text style={s.rejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept(tour)}>
              <Ionicons name="checkmark" size={15} color={N.onPrimary} />
              <Text style={s.acceptText}>Nhận tour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.detailBtn} onPress={() => router.push(`/booking/${tour.id}`)}>
            <Text style={s.detailText}>Xem chi tiết tour</Text>
            <Ionicons name="chevron-forward" size={14} color={N.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Confirm bottom sheet ─────────────────────────────────────────────────────

function ConfirmSheet({ tour, onClose, onConfirm }: { tour: MockBookingDetail; onClose: () => void; onConfirm: (t: MockBookingDetail) => void }) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        {/* Drag handle */}
        <View style={s.handle} />

        {/* Icon + title */}
        <View style={s.sheetIcon}>
          <Ionicons name="checkmark" size={26} color={N.primary} />
        </View>
        <Text style={s.sheetTitle}>Xác nhận nhận tour</Text>
        <Text style={s.sheetSubtitle}>Bạn sẽ trở thành HDV chính thức cho tour này</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
          {/* Tour summary card */}
          <View style={s.summaryCard}>
            <View style={s.summaryLeft}>
              <View style={s.summaryThumb}>
                <Ionicons name="image-outline" size={18} color={N.outlineVariant} />
              </View>
            </View>
            <View style={s.summaryInfo}>
              <Text style={s.summaryTitle} numberOfLines={2}>{tour.title}</Text>
              <Text style={s.summaryMeta}>📅 {tour.dateLabel} · {tour.timeRange}</Text>
              <Text style={s.summaryMeta}>👥 {tour.customer.guestCount} khách · {tour.customer.language}</Text>
              <Text style={s.summaryMeta} numberOfLines={1}>📍 {tour.meetingPoint}</Text>
            </View>
          </View>

          {/* Earnings breakdown */}
          <View style={s.earningsCard}>
            <Text style={s.earningsSectionTitle}>Thu nhập</Text>
            <View style={s.earningsLine}>
              <Text style={s.earningsLineLabel}>Giá tour</Text>
              <Text style={s.earningsLineValue}>{formatVND(tour.tourPrice)}</Text>
            </View>
            <View style={s.earningsLine}>
              <Text style={s.earningsLineLabel}>Phí nền tảng</Text>
              <Text style={[s.earningsLineValue, { color: colors.error }]}>- {formatVND(tour.platformFee)}</Text>
            </View>
            <View style={s.earningsDivider} />
            <View style={s.earningsLine}>
              <Text style={s.earningsTotalLabel}>Bạn nhận</Text>
              <Text style={s.earningsTotalValue}>{formatVND(tour.guideEarning)}</Text>
            </View>
          </View>

          {/* Special requests (if any) */}
          {tour.specialRequests.length > 0 && (
            <View style={s.sheetNoteBox}>
              <Ionicons name="warning-outline" size={14} color="#B7791F" />
              <Text style={s.sheetNoteText}>{tour.specialRequests[0].text}</Text>
            </View>
          )}

          {/* Policy warning */}
          <View style={s.warningBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#92400E" />
            <Text style={s.warningText}>
              Sau khi xác nhận, tour sẽ được thêm vào lịch của bạn và không thể hủy trong vòng 2 giờ.
            </Text>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={s.sheetActions}>
          <TouchableOpacity style={s.sheetCancelBtn} onPress={onClose}>
            <Text style={s.sheetCancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.sheetConfirmBtn} onPress={() => onConfirm(tour)}>
            <Ionicons name="checkmark" size={16} color={N.onPrimary} />
            <Text style={s.sheetConfirmText}>Xác nhận nhận tour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'upcoming',  label: 'Sắp tới' },
  { key: 'active',    label: 'Đang dẫn' },
  { key: 'completed', label: 'Hoàn thành' },
];

export default function MyToursScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>('upcoming');
  const [confirmTour, setConfirmTour] = useState<MockBookingDetail | null>(null);
  const [tours, setTours] = useState<MockBookingDetail[]>(MOCK_BOOKING_DETAILS);

  useFocusEffect(useCallback(() => {
    setTours([...MOCK_BOOKING_DETAILS]);
  }, []));

  function handleConfirm(tour: MockBookingDetail) {
    updateTourStatus(tour.id, 'confirmed');
    setConfirmTour(null);
    router.push(`/booking/${tour.id}`);
  }

  const filtered = filterTours(tours, activeTab);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.heading}>Tour của tôi</Text>
          <Text style={s.subheading}>{filtered.length} tour</Text>
        </View>
        <TouchableOpacity style={s.filterIconBtn}>
          <Ionicons name="options-outline" size={22} color={N.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Tab chips */}
      <View style={s.tabRow}>
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabChip, active && s.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabChipText, active && s.tabChipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Không có tour nào"
          body="Chưa có tour nào trong mục này"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TourCard tour={item} onAccept={setConfirmTour} />
          )}
        />

      )}

      {/* Bottom note */}
      {activeTab === 'upcoming' && filtered.some((t) => t.status === 'pending') && (
        <View style={[s.bottomNote, { paddingBottom: insets.bottom + 8 }]}>
          <Ionicons name="information-circle-outline" size={14} color={N.onSurfaceVariant} />
          <Text style={s.bottomNoteText}>
            Tour ở trạng thái "Chờ xác nhận" cần được Nhận trước khi hết hạn
          </Text>
        </View>
      )}

      {/* Confirmation sheet */}
      {confirmTour && (
        <ConfirmSheet tour={confirmTour} onClose={() => setConfirmTour(null)} onConfirm={handleConfirm} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: N.background },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  heading:     { fontSize: 22, fontWeight: '800', color: N.onSurface },
  subheading:  { fontSize: 13, color: N.onSurfaceVariant, marginTop: 2 },
  filterIconBtn: { padding: 6 },

  // Filter tabs
  tabRow:      { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: N.outlineVariant },
  tabChip:     { paddingHorizontal: 18, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: N.outlineVariant, backgroundColor: N.surface },
  tabChipActive:  { backgroundColor: N.secondaryContainer, borderColor: N.secondaryContainer },
  tabChipText:    { fontSize: 13, fontWeight: '500', color: N.onSurfaceVariant },
  tabChipTextActive: { color: N.primary, fontWeight: '700' },

  // List
  listContent: { padding: spacing.lg, gap: 14, paddingBottom: 32 },

  // Card
  card:        { backgroundColor: colors.bgCard, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: N.outlineVariant },
  cardCover:   { height: 110, backgroundColor: N.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  badgeWrap:   { position: 'absolute', top: 10, left: 10 },
  deadlineChip: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: '#FECACA' },
  deadlineText: { fontSize: 10, color: '#C0392B', fontWeight: '600' },
  cardBody:    { padding: spacing.md, gap: spacing.sm },
  tourTitle:   { fontSize: 15, fontWeight: '700', color: N.onSurface },

  // Meta rows
  metaGroup:   { gap: 5 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaIcon:    { fontSize: 13, width: 18, textAlign: 'center' },
  metaText:    { fontSize: 13, color: N.onSurfaceVariant, flex: 1 },

  // Earnings
  earningsRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: N.onPrimaryContainer, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, alignSelf: 'flex-start' },
  earningsLabel: { fontSize: 13, color: N.primary },
  earningsValue: { fontSize: 13, fontWeight: '700', color: N.primary },

  // Special note
  noteBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFFBEB', borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: '#FDE68A' },
  noteText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 17 },

  divider:  { height: 1, backgroundColor: N.outlineVariant, marginTop: spacing.xs },

  // Action buttons
  actionRow:   { flexDirection: 'row', gap: spacing.sm },
  rejectBtn:   { flex: 1, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center' },
  rejectText:  { fontSize: 14, color: N.onSurfaceVariant, fontWeight: '600' },
  acceptBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: N.primary, paddingVertical: 10, borderRadius: radius.lg },
  acceptText:  { fontSize: 14, color: N.onPrimary, fontWeight: '700' },
  detailBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: N.onPrimaryContainer },
  detailText:  { fontSize: 14, color: N.primary, fontWeight: '600' },

  // Bottom note
  bottomNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: N.surface, borderTopWidth: 1, borderTopColor: N.outlineVariant },
  bottomNoteText: { fontSize: 12, color: N.onSurfaceVariant, flex: 1, lineHeight: 17 },

  // Bottom sheet overlay
  overlay:     { ...StyleSheet.absoluteFillObject as object, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingBottom: 32, paddingTop: spacing.md, maxHeight: '90%', alignItems: 'center' },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: N.outlineVariant, marginBottom: spacing.md },

  sheetIcon:    { width: 56, height: 56, borderRadius: 28, backgroundColor: N.onPrimaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: N.onSurface, textAlign: 'center' },
  sheetSubtitle: { fontSize: 13, color: N.onSurfaceVariant, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg },

  // Summary card inside sheet
  summaryCard:  { flexDirection: 'row', gap: spacing.sm, backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, width: '100%' },
  summaryLeft:  {},
  summaryThumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: N.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  summaryInfo:  { flex: 1, gap: 3 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: N.onSurface },
  summaryMeta:  { fontSize: 12, color: N.onSurfaceVariant },

  // Earnings breakdown in sheet
  earningsCard:   { width: '100%', backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  earningsSectionTitle: { fontSize: 13, fontWeight: '700', color: N.onSurface, marginBottom: 2 },
  earningsLine:   { flexDirection: 'row', justifyContent: 'space-between' },
  earningsLineLabel: { fontSize: 13, color: N.onSurfaceVariant },
  earningsLineValue: { fontSize: 13, color: N.onSurface, fontWeight: '500' },
  earningsDivider: { height: 1, backgroundColor: N.outlineVariant },
  earningsTotalLabel: { fontSize: 14, fontWeight: '700', color: N.onSurface },
  earningsTotalValue: { fontSize: 16, fontWeight: '800', color: N.primary },

  // Note / warning in sheet
  sheetNoteBox:  { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFFBEB', borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: '#FDE68A', marginBottom: spacing.md },
  sheetNoteText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  warningBox:    { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF8F5', borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: '#FDDCCC', marginBottom: spacing.lg },
  warningText:   { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 17 },

  // Sheet buttons
  sheetActions:     { flexDirection: 'row', gap: spacing.sm, width: '100%', marginTop: spacing.sm },
  sheetCancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center' },
  sheetCancelText:  { fontSize: 14, fontWeight: '600', color: N.onSurfaceVariant },
  sheetConfirmBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: N.primary, paddingVertical: 13, borderRadius: radius.lg },
  sheetConfirmText: { fontSize: 14, fontWeight: '700', color: N.onPrimary },
});
