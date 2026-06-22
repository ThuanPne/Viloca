import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, TextInput, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockExperiences } from '@/src/data/mock/experiences';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import supabase from '@/src/lib/supabase';
import type { Trip, TripItem, TripJournal, TimeSlot } from '@/src/types';

type Tab = 'timeline' | 'journal' | 'info';

const STATUS_COLOR: Record<string, 'warning' | 'forest' | 'neutral'> = {
  planning: 'warning', active: 'forest', completed: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  planning: 'Đang lên kế hoạch', active: 'Đang diễn ra', completed: 'Hoàn thành',
};
const MOOD_ICONS: Record<string, string> = {
  great: '😄', good: '😊', okay: '😐', tired: '😴',
};
const TIME_SLOTS: { value: TimeSlot; label: string; icon: string }[] = [
  { value: 'morning',   label: 'Sáng',   icon: '🌅' },
  { value: 'afternoon', label: 'Chiều',  icon: '☀️' },
  { value: 'evening',   label: 'Tối',    icon: '🌙' },
];
const CATEGORY_LABEL: Record<string, string> = {
  food_tour: 'Ẩm thực', workshop: 'Workshop', trekking: 'Thiên nhiên', cultural: 'Văn hóa',
};

function tripDayCount(trip: Trip): number {
  if (trip.start_date && trip.end_date) {
    const diff = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
    ) + 1;
    return Math.max(1, Math.min(diff, 14));
  }
  return 7;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip]           = useState<Trip | null>(null);
  const [items, setItems]         = useState<TripItem[]>([]);
  const [journals, setJournals]   = useState<TripJournal[]>([]);
  const [tab, setTab]             = useState<Tab>('timeline');
  const [loading, setLoading]     = useState(true);

  // Journal form
  const [journalDay, setJournalDay]         = useState(1);
  const [journalContent, setJournalContent] = useState('');
  const [saving, setSaving]                 = useState(false);

  // Add experience modal
  const [showAddExp, setShowAddExp]         = useState(false);
  const [expSearch, setExpSearch]           = useState('');
  const [pickedExp, setPickedExp]           = useState<(typeof mockExperiences)[0] | null>(null);
  const [addDay, setAddDay]                 = useState(1);
  const [addSlot, setAddSlot]              = useState<TimeSlot>('morning');
  const [addNote, setAddNote]              = useState('');
  const [adding, setAdding]                 = useState(false);
  const [addError, setAddError]             = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_items').select('*').eq('trip_id', id).order('day_number').order('sort_order'),
      supabase.from('trip_journals').select('*').eq('trip_id', id).order('day_number'),
    ]).then(([t, i, j]) => {
      setTrip(t.data);
      setItems(i.data ?? []);
      setJournals(j.data ?? []);
      setLoading(false);
    });
  }, [id]);

  async function saveJournal() {
    if (!id || !journalContent.trim()) return;
    setSaving(true);
    const existing = journals.find((j) => j.day_number === journalDay);
    if (existing) {
      const { data } = await supabase
        .from('trip_journals')
        .update({ content: journalContent })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) setJournals(journals.map((j) => (j.id === data.id ? data : j)));
    } else {
      const { data } = await supabase
        .from('trip_journals')
        .insert({ trip_id: id, day_number: journalDay, content: journalContent, photos: [], mood: null, weather: null })
        .select()
        .single();
      if (data) setJournals([...journals, data]);
    }
    setSaving(false);
    setJournalContent('');
  }

  async function handleAddExperience() {
    if (!pickedExp || !id) return;
    setAdding(true);
    setAddError('');
    const { data, error } = await supabase.from('trip_items').insert({
      trip_id:              id,
      experience_id:        null,
      experience_title:     pickedExp.title,
      experience_location:  pickedExp.location,
      experience_image:     pickedExp.coverImage,
      experience_category:  pickedExp.category,
      day_number:           addDay,
      time_slot:            addSlot,
      note:                 addNote.trim() || null,
      sort_order:           0,
    }).select().single();
    setAdding(false);
    if (error) { setAddError('Không thể thêm: ' + error.message); return; }
    if (data) setItems((prev) => [...prev, data].sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order));
    closeAddExp();
  }

  function openAddExp() {
    setPickedExp(null);
    setExpSearch('');
    setAddDay(1);
    setAddSlot('morning');
    setAddNote('');
    setAddError('');
    setShowAddExp(true);
  }
  function closeAddExp() {
    setShowAddExp(false);
    setPickedExp(null);
  }

  async function removeItem(itemId: string) {
    await supabase.from('trip_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const filteredExps = expSearch.trim()
    ? mockExperiences.filter((e) =>
        e.title.toLowerCase().includes(expSearch.toLowerCase()) ||
        e.location.toLowerCase().includes(expSearch.toLowerCase())
      )
    : mockExperiences;

  const maxDays = trip ? tripDayCount(trip) : 7;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary600} />
      </View>
    );
  }
  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Trip không tìm thấy</Text>
      </View>
    );
  }

  // Group timeline items by day
  const itemsByDay: Record<number, TripItem[]> = {};
  items.forEach((item) => {
    if (!itemsByDay[item.day_number]) itemsByDay[item.day_number] = [];
    itemsByDay[item.day_number].push(item);
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.tripTitle} numberOfLines={1}>{trip.title}</Text>
          <Badge label={STATUS_LABEL[trip.status]} color={STATUS_COLOR[trip.status]} />
        </View>
      </View>

      {/* Cover */}
      <Image
        source={{ uri: trip.cover_image ?? `https://picsum.photos/seed/${trip.id}/800/200` }}
        style={styles.cover}
      />
      <View style={styles.coverMeta}>
        <Text style={styles.destination}>📍 {trip.destination}</Text>
        {trip.start_date && (
          <Text style={styles.dates}>{trip.start_date} → {trip.end_date ?? '...'}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['timeline', 'journal', 'info'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { timeline: 'Timeline', journal: 'Nhật ký', info: 'Thông tin' };
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{labels[t]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Timeline ── */}
      {tab === 'timeline' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
            {items.length === 0 ? (
              /* Inline empty state — không dùng EmptyState component vì flex:1 collapse trong ScrollView */
              <View style={styles.emptyWrap}>
                <Ionicons name="map-outline" size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
                <Text style={styles.emptyBody}>Nhấn nút{' '}
                  <Text style={{ color: colors.primary600, fontWeight: '700' }}>+</Text>
                  {' '}ở góc dưới để thêm địa điểm vào lịch trình
                </Text>
                <TouchableOpacity style={styles.addInlineBtn} onPress={openAddExp}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
                  <Text style={styles.addInlineBtnText}>Thêm địa điểm đầu tiên</Text>
                </TouchableOpacity>
              </View>
            ) : (
              Object.keys(itemsByDay).map((dayNum) => (
                <View key={dayNum} style={styles.dayGroup}>
                  <Text style={styles.dayGroupTitle}>Ngày {dayNum}</Text>
                  {itemsByDay[Number(dayNum)].map((item) => (
                    <View key={item.id} style={styles.timelineItem}>
                      <View style={styles.timelineDotWrap}>
                        <View style={styles.timelineDot} />
                      </View>
                      <View style={styles.timelineCard}>
                        {item.experience_image && (
                          <Image source={{ uri: item.experience_image }} style={styles.timelineImg} />
                        )}
                        <View style={styles.timelineInfo}>
                          <View style={styles.timelineTopRow}>
                            <Text style={styles.timelineSlot}>
                              {TIME_SLOTS.find(s => s.value === item.time_slot)?.icon}{' '}
                              {TIME_SLOTS.find(s => s.value === item.time_slot)?.label}
                            </Text>
                            {item.experience_category && (
                              <Text style={styles.timelineCat}>{CATEGORY_LABEL[item.experience_category]}</Text>
                            )}
                          </View>
                          <Text style={styles.timelineExp} numberOfLines={2}>
                            {item.experience_title ?? '—'}
                          </Text>
                          {item.experience_location && (
                            <Text style={styles.timelineLoc}>📍 {item.experience_location}</Text>
                          )}
                          {item.note && <Text style={styles.timelineNote}>💬 {item.note}</Text>}
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* FAB — luôn hiện, không phụ thuộc list có item hay không */}
          <TouchableOpacity style={styles.fab} onPress={openAddExp} activeOpacity={0.85}>
            <Ionicons name="add" size={26} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Journal ── */}
      {tab === 'journal' && (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {journals.map((j) => (
            <View key={j.id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalDay}>Ngày {j.day_number}</Text>
                {j.mood && <Text style={{ fontSize: 18 }}>{MOOD_ICONS[j.mood]}</Text>}
              </View>
              <Text style={styles.journalContent}>{j.content}</Text>
            </View>
          ))}

          <View style={styles.journalForm}>
            <Text style={styles.formLabel}>Thêm ghi chú · Ngày {journalDay}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayBtn, journalDay === d && styles.dayBtnActive]}
                    onPress={() => {
                      setJournalDay(d);
                      const existing = journals.find((j) => j.day_number === d);
                      setJournalContent(existing?.content ?? '');
                    }}
                  >
                    <Text style={[styles.dayBtnText, journalDay === d && styles.dayBtnTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={styles.journalInput}
              multiline
              numberOfLines={4}
              placeholder="Hôm nay bạn đã khám phá được gì?"
              placeholderTextColor={colors.textMuted}
              value={journalContent}
              onChangeText={setJournalContent}
              textAlignVertical="top"
            />
            <Button label="Lưu ghi chú" onPress={saveJournal} loading={saving} />
          </View>
        </ScrollView>
      )}

      {/* ── Info ── */}
      {tab === 'info' && (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {[
            { label: 'Điểm đến',   value: trip.destination },
            { label: 'Ngày đi',    value: trip.start_date ?? '—' },
            { label: 'Ngày về',    value: trip.end_date   ?? '—' },
            { label: 'Trạng thái', value: STATUS_LABEL[trip.status] },
            { label: 'Số ngày',    value: `${maxDays} ngày` },
            { label: 'Địa điểm',   value: `${items.length} trải nghiệm` },
          ].map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
          {trip.summary_note && (
            <View style={[styles.infoRow, { flexDirection: 'column', gap: 6 }]}>
              <Text style={styles.infoLabel}>Tổng kết</Text>
              <Text style={styles.infoValue}>{trip.summary_note}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Add Experience Modal ── */}
      <Modal visible={showAddExp} animationType="slide" transparent onRequestClose={closeAddExp}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickedExp ? 'Chọn ngày & thời điểm' : 'Thêm địa điểm'}
              </Text>
              <TouchableOpacity onPress={pickedExp ? () => setPickedExp(null) : closeAddExp}>
                <Ionicons name={pickedExp ? 'arrow-back-outline' : 'close'} size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {addError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            ) : null}

            {!pickedExp ? (
              /* Experience list */
              <>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm trải nghiệm..."
                    placeholderTextColor={colors.textMuted}
                    value={expSearch}
                    onChangeText={setExpSearch}
                  />
                </View>
                <FlatList
                  data={filteredExps}
                  keyExtractor={(e) => e.id}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 420 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.expOption}
                      activeOpacity={0.8}
                      onPress={() => setPickedExp(item)}
                    >
                      <Image source={{ uri: item.coverImage }} style={styles.expOptionImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expOptionTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.expOptionSub}>📍 {item.location}</Text>
                        <Text style={styles.expOptionCat}>{CATEGORY_LABEL[item.category]} · ⭐ {item.rating}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.border} />
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              /* Day + Slot picker */
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.pickedExpCard}>
                  <Image source={{ uri: pickedExp.coverImage }} style={styles.pickedExpImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickedExpTitle} numberOfLines={1}>{pickedExp.title}</Text>
                    <Text style={styles.pickedExpLoc}>📍 {pickedExp.location}</Text>
                  </View>
                </View>

                <Text style={styles.stepLabel}>Chọn ngày</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, addDay === d && styles.dayChipActive]}
                      onPress={() => setAddDay(d)}
                    >
                      <Text style={[styles.dayChipText, addDay === d && styles.dayChipTextActive]}>Ngày {d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>Thời điểm</Text>
                <View style={styles.slotRow}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot.value}
                      style={[styles.slotBtn, addSlot === slot.value && styles.slotBtnActive]}
                      onPress={() => setAddSlot(slot.value)}
                    >
                      <Text style={styles.slotIcon}>{slot.icon}</Text>
                      <Text style={[styles.slotLabel, addSlot === slot.value && styles.slotLabelActive]}>{slot.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>Ghi chú (tuỳ chọn)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Đặt vé trước / Mang theo đồ..."
                  placeholderTextColor={colors.textMuted}
                  value={addNote}
                  onChangeText={setAddNote}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />

                <View style={{ marginTop: spacing.lg }}>
                  <Button label="Thêm vào lịch trình" onPress={handleAddExperience} loading={adding} />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.bgScreen },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:             { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:            { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerInfo:         { flex: 1, gap: 4 },
  tripTitle:          { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cover:              { width: '100%', height: 160, resizeMode: 'cover' },
  coverMeta:          { backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  destination:        { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  dates:              { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabs:               { flexDirection: 'row', backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:       { borderBottomWidth: 2, borderBottomColor: colors.primary600 },
  tabText:            { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  tabTextActive:      { color: colors.primary600, fontWeight: '600' },
  // Timeline empty
  emptyWrap:          { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  emptyBody:          { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  addInlineBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  addInlineBtnText:   { color: colors.textOnDark, fontWeight: '700', fontSize: 14 },
  // FAB
  fab:                { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  // Timeline items
  dayGroup:           { marginBottom: spacing.lg },
  dayGroupTitle:      { fontSize: 13, fontWeight: '700', color: colors.primary600, marginBottom: 10, paddingLeft: 22 },
  timelineItem:       { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timelineDotWrap:    { alignItems: 'center', paddingTop: 6 },
  timelineDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary600 },
  timelineCard:       { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  timelineImg:        { width: '100%', height: 90, resizeMode: 'cover' },
  timelineInfo:       { padding: spacing.sm },
  timelineTopRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  timelineSlot:       { fontSize: 11, color: colors.textMuted },
  timelineCat:        { fontSize: 11, color: colors.primary600, fontWeight: '500' },
  timelineExp:        { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  timelineLoc:        { fontSize: 11, color: colors.textMuted },
  timelineNote:       { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  deleteBtn:          { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, padding: 4 },
  // Journal
  journalCard:        { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  journalHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  journalDay:         { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  journalContent:     { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  journalForm:        { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  formLabel:          { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  dayBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive:       { backgroundColor: colors.primary600 },
  dayBtnText:         { fontSize: 13, fontWeight: '500', color: colors.primary600 },
  dayBtnTextActive:   { color: colors.textOnDark },
  journalInput:       { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 100, marginBottom: spacing.md },
  // Info
  infoRow:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:          { fontSize: 13, color: colors.textMuted },
  infoValue:          { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: '60%' },
  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, maxHeight: '85%' },
  modalHandle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:         { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  errorBox:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:          { flex: 1, color: colors.error, fontSize: 12 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10, marginBottom: spacing.md, backgroundColor: colors.bgScreen },
  searchInput:        { flex: 1, fontSize: 14, color: colors.textPrimary },
  expOption:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  expOptionImg:       { width: 56, height: 56, borderRadius: radius.md, resizeMode: 'cover' },
  expOptionTitle:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  expOptionSub:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  expOptionCat:       { fontSize: 11, color: colors.primary600, marginTop: 2 },
  pickedExpCard:      { flexDirection: 'row', gap: 10, backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: 10, marginBottom: spacing.lg, alignItems: 'center' },
  pickedExpImg:       { width: 52, height: 52, borderRadius: radius.md, resizeMode: 'cover' },
  pickedExpTitle:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pickedExpLoc:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stepLabel:          { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
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
