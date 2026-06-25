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
import { usePackingList } from '@/src/hooks/usePackingList';

type Tab = 'timeline' | 'journal' | 'info' | 'packing';

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
  { value: 'morning',   label: 'Sáng',  icon: '🌅' },
  { value: 'afternoon', label: 'Chiều', icon: '☀️' },
  { value: 'evening',   label: 'Tối',   icon: '🌙' },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  food_tour: { label: 'Ẩm thực',   icon: '🍜' },
  workshop:  { label: 'Workshop',  icon: '🎨' },
  trekking:  { label: 'Thiên nhiên', icon: '🥾' },
  cultural:  { label: 'Văn hóa',   icon: '🏛' },
};

const SLOT_BASE_HOUR: Record<TimeSlot, number> = {
  morning: 7, afternoon: 13, evening: 18,
};

function suggestTime(slot: TimeSlot, idx: number): string {
  const h = SLOT_BASE_HOUR[slot] + idx;
  return `${String(Math.min(h, 23)).padStart(2, '0')}:00`;
}

function getDayLabel(trip: Trip, dayNum: number): string {
  if (!trip.start_date) return '';
  const d = new Date(trip.start_date);
  d.setDate(d.getDate() + dayNum - 1);
  const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${names[d.getDay()]}, ${dd}/${mm}`;
}

function tripDayCount(trip: Trip): number {
  if (trip.start_date && trip.end_date) {
    const diff = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000,
    ) + 1;
    return Math.max(1, Math.min(diff, 14));
  }
  return 7;
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip]         = useState<Trip | null>(null);
  const [items, setItems]       = useState<TripItem[]>([]);
  const [journals, setJournals] = useState<TripJournal[]>([]);
  const [tab, setTab]           = useState<Tab>('timeline');
  const [loading, setLoading]   = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  const { items: packingItems, addItem, togglePacked, deleteItem, addTemplate, progress } = usePackingList(id);
  const [newPackingItem, setNewPackingItem] = useState('');
  const [templatesUsed, setTemplatesUsed]   = useState(false);

  const [journalDay, setJournalDay]       = useState(1);
  const [journalContent, setJournalContent] = useState('');
  const [saving, setSaving]               = useState(false);

  const [showAddExp, setShowAddExp] = useState(false);
  const [expSearch, setExpSearch]   = useState('');
  const [pickedExp, setPickedExp]   = useState<(typeof mockExperiences)[0] | null>(null);
  const [addDay, setAddDay]         = useState(1);
  const [addSlot, setAddSlot]       = useState<TimeSlot>('morning');
  const [addNote, setAddNote]       = useState('');
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_items').select('*').eq('trip_id', id).order('day_number').order('sort_order'),
      supabase.from('trip_journals').select('*').eq('trip_id', id).order('day_number'),
    ]).then(([t, i, j]) => {
      setTrip(t.data);
      const fetched = i.data ?? [];
      setItems(fetched);
      setJournals(j.data ?? []);
      if (fetched.length > 0) setSelectedDay(fetched[0].day_number);
      setLoading(false);
    });
  }, [id]);

  async function saveJournal() {
    if (!id || !journalContent.trim()) return;
    setSaving(true);
    const existing = journals.find((j) => j.day_number === journalDay);
    if (existing) {
      const { data } = await supabase
        .from('trip_journals').update({ content: journalContent })
        .eq('id', existing.id).select().single();
      if (data) setJournals(journals.map((j) => (j.id === data.id ? data : j)));
    } else {
      const { data } = await supabase
        .from('trip_journals')
        .insert({ trip_id: id, day_number: journalDay, content: journalContent, photos: [], mood: null, weather: null })
        .select().single();
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
      trip_id:             id,
      experience_id:       null,
      experience_title:    pickedExp.title,
      experience_location: pickedExp.location,
      experience_image:    pickedExp.coverImage,
      experience_category: pickedExp.category,
      day_number:          addDay,
      time_slot:           addSlot,
      note:                addNote.trim() || null,
      sort_order:          0,
    }).select().single();
    setAdding(false);
    if (error) { setAddError('Không thể thêm: ' + error.message); return; }
    if (data) setItems((prev) => [...prev, data].sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order));
    closeAddExp();
  }

  function openAddExp() {
    setPickedExp(null); setExpSearch('');
    setAddDay(selectedDay); setAddSlot('morning');
    setAddNote(''); setAddError('');
    setShowAddExp(true);
  }
  function closeAddExp() { setShowAddExp(false); setPickedExp(null); }

  async function removeItem(itemId: string) {
    await supabase.from('trip_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  const filteredExps = expSearch.trim()
    ? mockExperiences.filter((e) =>
        e.title.toLowerCase().includes(expSearch.toLowerCase()) ||
        e.location.toLowerCase().includes(expSearch.toLowerCase()))
    : mockExperiences;

  const maxDays = trip ? tripDayCount(trip) : 7;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary600} /></View>;
  if (!trip)   return <View style={styles.center}><Text style={{ color: colors.textMuted }}>Trip không tìm thấy</Text></View>;

  // Group items by day
  const dayNumbers = Array.from(new Set(items.map((i) => i.day_number))).sort((a, b) => a - b);
  if (dayNumbers.length > 0 && !dayNumbers.includes(selectedDay)) {
    // keep selectedDay as-is; it'll show empty
  }
  const dayItems = items.filter((i) => i.day_number === selectedDay);

  const dateRange = trip.start_date && trip.end_date
    ? `${trip.start_date.slice(5).replace('-', '/')} – ${trip.end_date.slice(5).replace('-', '/')}`
    : null;
  const nightCount = Math.max(0, maxDays - 1);

  return (
    <View style={styles.container}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{trip.title}</Text>
        <Badge label={STATUS_LABEL[trip.status]} color={STATUS_COLOR[trip.status]} />
      </View>

      {/* ── Info header ── */}
      <View style={styles.infoHeader}>
        <Text style={styles.infoHeaderLabel}>LỊCH TRÌNH CHUYẾN ĐI</Text>
        <Text style={styles.infoHeaderTitle}>{trip.title}</Text>
        {dateRange && (
          <Text style={styles.infoHeaderDates}>
            {dateRange} · {maxDays} ngày {nightCount} đêm
          </Text>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{maxDays}</Text>
            <Text style={styles.statUnit}>ngày</Text>
            <Text style={styles.statLabel}>Thời gian</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statUnit}>điểm</Text>
            <Text style={styles.statLabel}>Lịch trình</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{dayNumbers.length || maxDays}</Text>
            <Text style={styles.statUnit}>ngày</Text>
            <Text style={styles.statLabel}>Có địa điểm</Text>
          </View>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {(['timeline', 'journal', 'info', 'packing'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { timeline: 'Lịch trình', journal: 'Nhật ký', info: 'Thông tin', packing: 'Hành lý' };
          return (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{labels[t]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ TIMELINE ══ */}
      {tab === 'timeline' && (
        <View style={{ flex: 1 }}>
          {/* Day selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabsScroll} contentContainerStyle={styles.dayTabsContent}>
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayTab, selectedDay === d && styles.dayTabActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text style={[styles.dayTabText, selectedDay === d && styles.dayTabTextActive]}>Ngày {d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Day header card */}
            <View style={styles.dayHeaderCard}>
              <View>
                <Text style={styles.dayHeaderNum}>NGÀY {selectedDay}</Text>
                {getDayLabel(trip, selectedDay) ? (
                  <Text style={styles.dayHeaderLabel}>{getDayLabel(trip, selectedDay)}</Text>
                ) : null}
              </View>
              <Text style={styles.dayHeaderMeta}>{dayItems.length} điểm</Text>
            </View>

            {dayItems.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="map-outline" size={56} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm</Text>
                <Text style={styles.emptyBody}>Nhấn nút + bên dưới để thêm vào ngày {selectedDay}</Text>
                <TouchableOpacity style={styles.addInlineBtn} onPress={openAddExp}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
                  <Text style={styles.addInlineBtnText}>Thêm địa điểm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timelineBody}>
                {dayItems.map((item, idx) => {
                  const cat = CATEGORY_CONFIG[item.experience_category ?? ''];
                  const isLast = idx === dayItems.length - 1;
                  return (
                    <View key={item.id} style={styles.tlRow}>
                      {/* Time column */}
                      <Text style={styles.tlTime}>{suggestTime(item.time_slot, idx)}</Text>

                      {/* Dot + line */}
                      <View style={styles.tlMiddle}>
                        <View style={styles.tlDot} />
                        {!isLast && <View style={styles.tlLine} />}
                      </View>

                      {/* Card */}
                      <View style={[styles.tlCard, isLast && { marginBottom: 8 }]}>
                        <View style={styles.tlCardHeader}>
                          <Text style={styles.tlTitle} numberOfLines={2}>{item.experience_title ?? '—'}</Text>
                          <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.tlDeleteBtn}>
                            <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                        {item.note ? (
                          <Text style={styles.tlDesc} numberOfLines={2}>{item.note}</Text>
                        ) : item.experience_location ? (
                          <Text style={styles.tlDesc} numberOfLines={1}>📍 {item.experience_location}</Text>
                        ) : null}
                        {cat && (
                          <View style={styles.tlTags}>
                            <View style={styles.tlTag}>
                              <Text style={styles.tlTagText}>{cat.icon} {cat.label}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} onPress={openAddExp} activeOpacity={0.85}>
            <Ionicons name="add" size={26} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>
      )}

      {/* ══ JOURNAL ══ */}
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
              multiline numberOfLines={4}
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

      {/* ══ INFO ══ */}
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

      {/* ══ PACKING ══ */}
      {tab === 'packing' && (
        <View style={{ flex: 1 }}>
          <View style={styles.packingProgress}>
            <View style={styles.packingProgressRow}>
              <Text style={styles.packingProgressLabel}>🎒 {progress.packed}/{progress.total} vật dụng</Text>
              <Text style={styles.packingPercent}>{progress.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` as any }]} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
            {!templatesUsed && (
              <View style={styles.templateSection}>
                <Text style={styles.templateLabel}>Gợi ý nhanh</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {([
                    { key: 'beach', label: '🏖 Biển' },
                    { key: 'mountain', label: '⛰ Núi' },
                    { key: 'international', label: '✈️ Quốc tế' },
                    { key: 'business', label: '💼 Công tác' },
                  ] as { key: any; label: string }[]).map(({ key, label }) => (
                    <TouchableOpacity key={key} style={styles.templateChip} onPress={async () => { await addTemplate(key); setTemplatesUsed(true); }}>
                      <Text style={styles.templateChipText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {packingItems.length === 0 && !templatesUsed ? (
              <View style={styles.packingEmpty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎒</Text>
                <Text style={styles.emptyTitle}>Chưa có vật dụng nào</Text>
                <Text style={styles.emptyBody}>Chọn template bên trên hoặc thêm thủ công</Text>
              </View>
            ) : (
              packingItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.packingItem} activeOpacity={0.7} onPress={() => togglePacked(item.id)}>
                  <View style={[styles.checkbox, item.is_packed && styles.checkboxChecked]}>
                    {item.is_packed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.packingItemText, item.is_packed && styles.packingItemTextDone]}>{item.name}</Text>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.packingDeleteBtn}>
                    <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
            <View style={styles.packingAddRow}>
              <TextInput
                style={styles.packingInput}
                placeholder="Thêm vật dụng..."
                placeholderTextColor={colors.textMuted}
                value={newPackingItem}
                onChangeText={setNewPackingItem}
                returnKeyType="done"
                onSubmitEditing={async () => { if (!newPackingItem.trim()) return; await addItem(newPackingItem.trim()); setNewPackingItem(''); }}
              />
              <TouchableOpacity style={styles.packingAddBtn} onPress={async () => { if (!newPackingItem.trim()) return; await addItem(newPackingItem.trim()); setNewPackingItem(''); }}>
                <Ionicons name="add" size={20} color={colors.textOnDark} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ══ Add Experience Modal ══ */}
      <Modal visible={showAddExp} animationType="slide" transparent onRequestClose={closeAddExp}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickedExp ? 'Chọn ngày & thời điểm' : 'Thêm địa điểm'}</Text>
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
                    <TouchableOpacity style={styles.expOption} activeOpacity={0.8} onPress={() => setPickedExp(item)}>
                      <Image source={{ uri: item.coverImage }} style={styles.expOptionImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expOptionTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.expOptionSub}>📍 {item.location}</Text>
                        <Text style={styles.expOptionCat}>{CATEGORY_CONFIG[item.category]?.label ?? item.category} · ⭐ {item.rating}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.border} />
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
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
                    <TouchableOpacity key={d} style={[styles.dayChip, addDay === d && styles.dayChipActive]} onPress={() => setAddDay(d)}>
                      <Text style={[styles.dayChipText, addDay === d && styles.dayChipTextActive]}>Ngày {d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.stepLabel, { marginTop: spacing.lg }]}>Thời điểm</Text>
                <View style={styles.slotRow}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity key={slot.value} style={[styles.slotBtn, addSlot === slot.value && styles.slotBtnActive]} onPress={() => setAddSlot(slot.value)}>
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
                  multiline numberOfLines={2}
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

const DAY_HEADER_BG = '#2D1A0E';   // colors.textPrimary — giữ palette cũ
const DOT_COLOR     = '#C8602E';   // colors.primary600
const LINE_COLOR    = '#F5E4D6';   // colors.primary100
const TAG_BG        = '#F5E4D6';   // colors.primary100
const TAG_TEXT      = '#C8602E';   // colors.primary600

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bgScreen },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:      { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  topBarTitle:  { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  // Info header
  infoHeader:       { backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoHeaderLabel:  { fontSize: 11, fontWeight: '700', color: colors.primary600, letterSpacing: 1, marginBottom: 4 },
  infoHeaderTitle:  { fontSize: 22, fontWeight: '800', color: colors.textPrimary, lineHeight: 28, marginBottom: 4 },
  infoHeaderDates:  { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  statsRow:         { flexDirection: 'row', backgroundColor: colors.bgScreen, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  statChip:         { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statValue:        { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statUnit:         { fontSize: 11, color: colors.primary600, fontWeight: '600' },
  statLabel:        { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  statDivider:      { width: 1, backgroundColor: colors.border },

  // Tabs
  tabs:         { flexDirection: 'row', backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:       { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.primary600 },
  tabText:      { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  tabTextActive:{ color: colors.primary600, fontWeight: '700' },

  // Day selector
  dayTabsScroll:   { flexShrink: 0, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayTabsContent:  { paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 12, gap: 8 },
  dayTab:          { paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  dayTabActive:    { backgroundColor: DAY_HEADER_BG, borderColor: DAY_HEADER_BG },
  dayTabText:      { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  dayTabTextActive:{ color: '#fff' },

  // Day header card
  dayHeaderCard:  { margin: spacing.lg, marginBottom: 0, backgroundColor: DAY_HEADER_BG, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayHeaderNum:   { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 2 },
  dayHeaderLabel: { fontSize: 17, fontWeight: '800', color: '#fff' },
  dayHeaderMeta:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // Timeline body
  timelineBody: { paddingTop: 16, paddingHorizontal: spacing.lg },
  tlRow:        { flexDirection: 'row', marginBottom: 0 },

  // Time column
  tlTime: { width: 46, fontSize: 12, color: colors.textMuted, fontWeight: '500', paddingTop: 14, textAlign: 'right', paddingRight: 8 },

  // Dot + line column
  tlMiddle: { width: 24, alignItems: 'center' },
  tlDot:    { width: 12, height: 12, borderRadius: 6, backgroundColor: DOT_COLOR, marginTop: 12, borderWidth: 2, borderColor: colors.bgCard, elevation: 2 },
  tlLine:   { width: 2, flex: 1, backgroundColor: LINE_COLOR, marginTop: 2 },

  // Card
  tlCard:       { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginLeft: 10, marginBottom: 12, padding: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  tlCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  tlTitle:      { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  tlDeleteBtn:  { padding: 2 },
  tlDesc:       { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 8 },
  tlTags:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tlTag:        { backgroundColor: TAG_BG, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  tlTagText:    { fontSize: 11, color: TAG_TEXT, fontWeight: '600' },

  // Empty
  emptyWrap:       { alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: spacing.xl },
  emptyTitle:      { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' },
  emptyBody:       { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 },
  addInlineBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary600, paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.xl, marginTop: spacing.lg },
  addInlineBtnText:{ color: colors.textOnDark, fontWeight: '700', fontSize: 14 },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary600, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },

  // Journal
  journalCard:    { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  journalHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  journalDay:     { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  journalContent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  journalForm:    { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  formLabel:      { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  dayBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive:   { backgroundColor: colors.primary600 },
  dayBtnText:     { fontSize: 13, fontWeight: '500', color: colors.primary600 },
  dayBtnTextActive:{ color: colors.textOnDark },
  journalInput:   { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 100, marginBottom: spacing.md },

  // Info
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: '60%' },

  // Packing
  packingProgress:      { backgroundColor: colors.bgCard, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  packingProgressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  packingProgressLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  packingPercent:       { fontSize: 13, fontWeight: '700', color: colors.primary600 },
  progressTrack:        { height: 6, borderRadius: 3, backgroundColor: colors.border },
  progressFill:         { height: 6, borderRadius: 3, backgroundColor: colors.primary600 },
  templateSection:      { marginBottom: spacing.lg },
  templateLabel:        { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  templateChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  templateChipText:     { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  packingEmpty:         { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  packingItem:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: 8 },
  checkbox:             { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:      { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  packingItemText:      { flex: 1, fontSize: 14, color: colors.textPrimary },
  packingItemTextDone:  { textDecorationLine: 'line-through', color: colors.textMuted, opacity: 0.6 },
  packingDeleteBtn:     { padding: 4 },
  packingAddRow:        { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  packingInput:         { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.bgCard },
  packingAddBtn:        { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.primary600, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:     { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, maxHeight: '85%' },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:      { flex: 1, color: colors.error, fontSize: 12 },
  searchBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 10, marginBottom: spacing.md, backgroundColor: colors.bgScreen },
  searchInput:    { flex: 1, fontSize: 14, color: colors.textPrimary },
  expOption:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  expOptionImg:   { width: 56, height: 56, borderRadius: radius.md, resizeMode: 'cover' },
  expOptionTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  expOptionSub:   { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  expOptionCat:   { fontSize: 11, color: colors.primary600, marginTop: 2 },
  pickedExpCard:  { flexDirection: 'row', gap: 10, backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: 10, marginBottom: spacing.lg, alignItems: 'center' },
  pickedExpImg:   { width: 52, height: 52, borderRadius: radius.md, resizeMode: 'cover' },
  pickedExpTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pickedExpLoc:   { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stepLabel:      { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  dayChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  dayChipActive:  { backgroundColor: colors.primary600, borderColor: colors.primary600 },
  dayChipText:    { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  dayChipTextActive: { color: colors.textOnDark },
  slotRow:        { flexDirection: 'row', gap: 8 },
  slotBtn:        { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen },
  slotBtnActive:  { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  slotIcon:       { fontSize: 18, marginBottom: 4 },
  slotLabel:      { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  slotLabelActive:{ color: colors.primary600 },
  noteInput:      { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 60, backgroundColor: colors.bgScreen },
});
