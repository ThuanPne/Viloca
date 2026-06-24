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
import { DatePicker } from '@/src/components/ui/DatePicker';
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
const SLOT_COLOR: Record<string, string> = {
  morning:   '#F59E0B',
  afternoon: '#3B82F6',
  evening:   '#7C3AED',
};

function dayLabel(trip: Trip, dayNum: number): string {
  if (!trip.start_date) return `Ngày ${dayNum}`;
  const d = new Date(trip.start_date);
  d.setDate(d.getDate() + dayNum - 1);
  return `Ngày ${dayNum} · ${d.getDate()}/${d.getMonth() + 1}`;
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

  // Date setup
  const [showDateModal, setShowDateModal]   = useState(false);
  const [setupStart, setSetupStart]         = useState('');
  const [setupEnd, setSetupEnd]             = useState('');
  const [savingDates, setSavingDates]       = useState(false);
  const [dismissedAI, setDismissedAI]       = useState(false);

  // Detail modal
  const [selectedItem, setSelectedItem]     = useState<TripItem | null>(null);

  // Add experience modal
  const [showAddExp, setShowAddExp]         = useState(false);
  const [expSearch, setExpSearch]           = useState('');
  const [pickedExp, setPickedExp]           = useState<(typeof mockExperiences)[0] | null>(null);
  const [addDay, setAddDay]                 = useState(1);
  const [addSlot, setAddSlot]              = useState<TimeSlot>('morning');
  const [addTime, setAddTime]              = useState('');
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

  async function saveTripDates() {
    if (!setupStart || !id) return;
    setSavingDates(true);
    const { data } = await supabase
      .from('trips')
      .update({ start_date: setupStart, end_date: setupEnd || null })
      .eq('id', id)
      .select()
      .single();
    setSavingDates(false);
    if (data) setTrip(data);
    setShowDateModal(false);
  }

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
      visit_time:           addTime || null,
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
    setAddTime('');
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

            {/* Setup card — hiện khi chưa có ngày đi */}
            {!trip.start_date && (
              <TouchableOpacity style={styles.setupCard} activeOpacity={0.85} onPress={() => { setSetupStart(''); setSetupEnd(''); setShowDateModal(true); }}>
                <View style={styles.setupCardLeft}>
                  <View style={styles.setupCardIcon}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary600} />
                  </View>
                  <View>
                    <Text style={styles.setupCardTitle}>Thêm ngày đi</Text>
                    <Text style={styles.setupCardSub}>Để xem timeline theo từng ngày</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary600} />
              </TouchableOpacity>
            )}

            {/* AI banner — hiện khi đã có ngày, chưa có địa điểm, chưa dismiss */}
            {trip.start_date && items.length === 0 && !dismissedAI && (
              <View style={styles.aiBanner}>
                <View style={styles.aiBannerTop}>
                  <View style={styles.aiBannerTitleRow}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.primary600} />
                    <Text style={styles.aiBannerTitle}>AI gợi ý lịch trình cho bạn</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDismissedAI(true)}>
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.aiBannerSub}>Chọn vibe chuyến đi để AI tạo gợi ý phù hợp</Text>
                <View style={styles.vibesRow}>
                  {['Bình yên', 'Cổ kính', 'Hoang sơ', 'Ẩm thực', 'Mạo hiểm', 'Văn hóa'].map((v) => (
                    <View key={v} style={styles.vibeChip}>
                      <Text style={styles.vibeChipText}>{v}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.aiBannerBtn} onPress={() => alert('Tính năng AI đang được phát triển. Thử lại sau!')}>
                  <Ionicons name="sparkles-outline" size={15} color={colors.textOnDark} />
                  <Text style={styles.aiBannerBtnText}>Bắt đầu gợi ý</Text>
                </TouchableOpacity>
              </View>
            )}

            {items.length === 0 ? (
              /* Inline empty state — không dùng EmptyState component vì flex:1 collapse trong ScrollView */
              <View style={styles.emptyWrap}>
                <Ionicons name="map-outline" size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
                <Text style={styles.emptyBody}>Tự thêm địa điểm hoặc để AI gợi ý lịch trình phù hợp với bạn</Text>
                <TouchableOpacity style={styles.aiSuggestBtn} onPress={() => alert('Tính năng AI đang được phát triển. Thử lại sau!')}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary600} />
                  <Text style={styles.aiSuggestText}>AI gợi ý lịch trình</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addInlineBtn} onPress={openAddExp}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
                  <Text style={styles.addInlineBtnText}>Tự thêm địa điểm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              Object.keys(itemsByDay).map((dayNum) => {
                const dayItems = itemsByDay[Number(dayNum)];
                return (
                  <View key={dayNum} style={styles.dayGroup}>
                    {/* Day header */}
                    <View style={styles.dayGroupHeader}>
                      <View style={styles.dayPill}>
                        <Text style={styles.dayPillText}>{dayLabel(trip, Number(dayNum))}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.dayAddBtn}
                        onPress={() => { setAddDay(Number(dayNum)); openAddExp(); }}
                      >
                        <Ionicons name="add" size={14} color={colors.primary600} />
                        <Text style={styles.dayAddText}>Thêm</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Timeline items */}
                    {dayItems.map((item, idx) => {
                      const slot      = TIME_SLOTS.find(s => s.value === item.time_slot);
                      const slotColor = SLOT_COLOR[item.time_slot] ?? colors.primary600;
                      const isLast    = idx === dayItems.length - 1;
                      return (
                        <TouchableOpacity key={item.id} style={styles.timelineItem} activeOpacity={0.85} onPress={() => setSelectedItem(item)}>
                          {/* Dot + line column */}
                          <View style={styles.timelineDotWrap}>
                            <View style={[styles.timelineDotRing, { borderColor: slotColor }]}>
                              <View style={[styles.timelineDotInner, { backgroundColor: slotColor }]} />
                            </View>
                            {!isLast && <View style={[styles.timelineConnector, { backgroundColor: slotColor + '40' }]} />}
                          </View>

                          {/* Card */}
                          <View style={[styles.timelineCard, { borderLeftColor: slotColor }]}>
                            <View style={styles.timelineCardContent}>
                              {/* Slot pill + category */}
                              <View style={styles.timelineTopRow}>
                                <View style={[styles.slotPill, { backgroundColor: slotColor + '18' }]}>
                                  <Text style={[styles.slotPillText, { color: slotColor }]}>
                                    {slot?.icon} {slot?.label}{item.visit_time ? ` · ${item.visit_time.slice(0, 5)}` : ''}
                                  </Text>
                                </View>
                                {item.experience_category && (
                                  <View style={styles.catBadge}>
                                    <Text style={styles.catBadgeText}>{CATEGORY_LABEL[item.experience_category]}</Text>
                                  </View>
                                )}
                              </View>

                              {/* Title */}
                              <Text style={styles.timelineExp} numberOfLines={2}>{item.experience_title ?? '—'}</Text>

                              {/* Location */}
                              {item.experience_location && (
                                <View style={styles.timelineLocRow}>
                                  <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                                  <Text style={styles.timelineLoc} numberOfLines={1}>{item.experience_location}</Text>
                                </View>
                              )}

                              {/* Note */}
                              {item.note && (
                                <View style={styles.timelineNoteRow}>
                                  <Ionicons name="chatbubble-outline" size={11} color={colors.textMuted} />
                                  <Text style={styles.timelineNote} numberOfLines={1}>{item.note}</Text>
                                </View>
                              )}
                            </View>

                            {/* Thumbnail */}
                            {item.experience_image ? (
                              <Image source={{ uri: item.experience_image }} style={styles.timelineThumb} />
                            ) : (
                              <View style={styles.timelineThumbPlaceholder}>
                                <Ionicons name="image-outline" size={22} color={colors.border} />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })
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

      {/* ── Item Detail Modal ── */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />

            {selectedItem && (() => {
              const slot = TIME_SLOTS.find(s => s.value === selectedItem.time_slot);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Cover image */}
                  {selectedItem.experience_image ? (
                    <Image source={{ uri: selectedItem.experience_image }} style={styles.detailImg} />
                  ) : (
                    <View style={styles.detailImgPlaceholder}>
                      <Ionicons name="image-outline" size={40} color={colors.border} />
                    </View>
                  )}

                  <View style={styles.detailBody}>
                    {/* Category badge */}
                    {selectedItem.experience_category && (
                      <View style={styles.detailCatBadge}>
                        <Text style={styles.detailCatText}>{CATEGORY_LABEL[selectedItem.experience_category] ?? selectedItem.experience_category}</Text>
                      </View>
                    )}

                    {/* Title */}
                    <Text style={styles.detailTitle}>{selectedItem.experience_title ?? '—'}</Text>

                    {/* Location */}
                    {selectedItem.experience_location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.detailRowText}>{selectedItem.experience_location}</Text>
                      </View>
                    )}

                    {/* Day + time */}
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                      <Text style={styles.detailRowText}>
                        Ngày {selectedItem.day_number} · {slot?.icon} {slot?.label}
                        {selectedItem.visit_time ? ` · ${selectedItem.visit_time.slice(0, 5)}` : ''}
                      </Text>
                    </View>

                    {/* Note */}
                    {selectedItem.note && (
                      <View style={styles.detailNoteBox}>
                        <Text style={styles.detailNoteLabel}>Ghi chú</Text>
                        <Text style={styles.detailNoteText}>{selectedItem.note}</Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.detailActions}>
                      <TouchableOpacity
                        style={styles.detailDeleteBtn}
                        onPress={() => { removeItem(selectedItem.id); setSelectedItem(null); }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={styles.detailDeleteText}>Xoá khỏi lịch trình</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setSelectedItem(null)}>
                        <Text style={styles.detailCloseBtnText}>Đóng</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ── Date Setup Modal ── */}
      <Modal visible={showDateModal} animationType="slide" transparent onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '55%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ngày đi & về</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.dateSetupLabel}>Ngày đi *</Text>
            <DatePicker value={setupStart} onChange={setSetupStart} placeholder="Chọn ngày đi" />
            <Text style={[styles.dateSetupLabel, { marginTop: spacing.md }]}>Ngày về</Text>
            <DatePicker
              value={setupEnd}
              onChange={setSetupEnd}
              placeholder="Chọn ngày về"
              minDate={setupStart ? new Date(setupStart) : undefined}
            />
            <View style={{ marginTop: spacing.xl }}>
              <Button label="Lưu ngày đi" onPress={saveTripDates} loading={savingDates} disabled={!setupStart} />
            </View>
          </View>
        </View>
      </Modal>

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

                <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>Giờ tham quan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, marginBottom: spacing.sm }}>
                  {['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeChip, addTime === t && styles.timeChipActive]}
                      onPress={() => setAddTime(addTime === t ? '' : t)}
                    >
                      <Text style={[styles.timeChipText, addTime === t && styles.timeChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

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
  // Setup card
  setupCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary100, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary600 + '40' },
  setupCardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setupCardIcon:    { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  setupCardTitle:   { fontSize: 14, fontWeight: '700', color: colors.primary600 },
  setupCardSub:     { fontSize: 12, color: colors.primary600 + 'aa', marginTop: 2 },
  // AI banner
  aiBanner:         { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  aiBannerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  aiBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBannerTitle:    { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  aiBannerSub:      { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  vibesRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  vibeChip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  vibeChipText:     { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  aiBannerBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary600, paddingVertical: 10, borderRadius: radius.lg },
  aiBannerBtnText:  { color: colors.textOnDark, fontWeight: '600', fontSize: 13 },
  // Detail modal
  detailImg:          { width: '100%', height: 200, borderRadius: radius.lg, resizeMode: 'cover', marginBottom: spacing.md },
  detailImgPlaceholder: { width: '100%', height: 140, borderRadius: radius.lg, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  detailBody:         { paddingBottom: spacing.lg },
  detailCatBadge:     { alignSelf: 'flex-start', backgroundColor: colors.primary100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, marginBottom: 8 },
  detailCatText:      { fontSize: 11, fontWeight: '600', color: colors.primary600 },
  detailTitle:        { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  detailRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailRowText:      { fontSize: 13, color: colors.textMuted },
  detailNoteBox:      { backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  detailNoteLabel:    { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  detailNoteText:     { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  detailActions:      { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  detailDeleteBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.error, paddingVertical: 12, borderRadius: radius.lg },
  detailDeleteText:   { fontSize: 13, fontWeight: '600', color: colors.error },
  detailCloseBtn:     { flex: 1, backgroundColor: colors.primary600, paddingVertical: 12, borderRadius: radius.lg, alignItems: 'center' },
  detailCloseBtnText: { fontSize: 13, fontWeight: '600', color: colors.textOnDark },
  // Date setup modal
  dateSetupLabel:   { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm },
  // Timeline empty
  emptyWrap:          { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  emptyBody:          { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  addInlineBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  addInlineBtnText:   { color: colors.textOnDark, fontWeight: '700', fontSize: 14 },
  // FAB
  fab:                { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  // Day group
  dayGroup:              { marginBottom: spacing.xl },
  dayGroupHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayPill:               { backgroundColor: colors.primary600, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full },
  dayPillText:           { fontSize: 12, fontWeight: '700', color: colors.textOnDark },
  dayAddBtn:             { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.primary600, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  dayAddText:            { fontSize: 12, color: colors.primary600, fontWeight: '600' },
  aiSuggestBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.primary600, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  aiSuggestText:         { color: colors.primary600, fontWeight: '700', fontSize: 14 },
  // Timeline item
  timelineItem:          { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timelineDotWrap:       { alignItems: 'center', width: 20, paddingTop: 14 },
  timelineDotRing:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard },
  timelineDotInner:      { width: 7, height: 7, borderRadius: 4 },
  timelineConnector:     { width: 2, flex: 1, marginTop: 4, marginBottom: -4, borderRadius: 1 },
  timelineCard:          { flex: 1, flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, padding: spacing.sm, gap: 10 },
  timelineCardContent:   { flex: 1 },
  timelineTopRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  slotPill:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  slotPillText:          { fontSize: 11, fontWeight: '600' },
  catBadge:              { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.bgScreen },
  catBadgeText:          { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  timelineExp:           { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, lineHeight: 20 },
  timelineLocRow:        { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  timelineLoc:           { fontSize: 11, color: colors.textMuted, flex: 1 },
  timelineNoteRow:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timelineNote:          { fontSize: 11, color: colors.textMuted, flex: 1 },
  timelineThumb:         { width: 72, height: 72, borderRadius: radius.md, resizeMode: 'cover', alignSelf: 'center' },
  timelineThumbPlaceholder: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  deleteBtn:             { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, padding: 4 },
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
  timeChip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  timeChipActive:     { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  timeChipText:       { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  timeChipTextActive: { color: colors.textOnDark },
  noteInput:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 60, backgroundColor: colors.bgScreen },
});
