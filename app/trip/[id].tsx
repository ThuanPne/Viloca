import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, TextInput, ActivityIndicator, Image, Modal, Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { DatePicker } from '@/src/components/ui/DatePicker';
import supabase from '@/src/lib/supabase';
import { useLocationSearch, CITY_OPTIONS } from '@/src/hooks/useLocationSearch';
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

const SLOT_BASE_MIN: Record<string, number> = { morning: 7 * 60, afternoon: 13 * 60, evening: 18 * 60 };

function suggestTime(slot: string, slotIndex: number): string {
  const total = (SLOT_BASE_MIN[slot] ?? 7 * 60) + slotIndex * 90;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

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
  const [openDays, setOpenDays]             = useState<Set<number>>(new Set([1]));
  const scrollY = useRef(new Animated.Value(0)).current;

  const COVER_MAX = 220;
  const COVER_MIN = 72;
  const coverHeight = scrollY.interpolate({ inputRange: [0, COVER_MAX - COVER_MIN], outputRange: [COVER_MAX, COVER_MIN], extrapolate: 'clamp' });
  const coverOpacity = scrollY.interpolate({ inputRange: [0, COVER_MAX - COVER_MIN], outputRange: [1, 0.45], extrapolate: 'clamp' });

  function toggleDay(day: number) {
    setOpenDays((prev) => { const n = new Set(prev); n.has(day) ? n.delete(day) : n.add(day); return n; });
  }

  // AI suggest state
  const [aiVibes, setAiVibes]               = useState<string[]>([]);
  const [aiBudget, setAiBudget]             = useState(500000);
  const [aiDays, setAiDays]                 = useState(3);
  const [aiGenerating, setAiGenerating]     = useState(false);
  const [aiLog, setAiLog]                   = useState('');

  // Detail modal
  const [selectedItem, setSelectedItem]     = useState<TripItem | null>(null);

  // Add location modal
  const [showAddExp, setShowAddExp]   = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<ReturnType<typeof useLocationSearch>['results'][0] | null>(null);
  const [addDay, setAddDay]           = useState(1);
  const [addSlot, setAddSlot]         = useState<TimeSlot>('morning');
  const [addTime, setAddTime]         = useState('');
  const [addNote, setAddNote]         = useState('');
  const [adding, setAdding]           = useState(false);
  const [addError, setAddError]       = useState('');

  const { query: locQuery, setQuery: setLocQuery, cityCode, setCityCode, results: locResults, loading: locLoading } = useLocationSearch();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_items').select('*, locations(name, category, hint, short_description, long_description, cover_image, district, address, price_per_person, duration_minutes, rating, opening_hours)').eq('trip_id', id).order('day_number').order('sort_order'),
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

  async function invokePlanTrip() {
    if (!trip || !id) return;
    if (!aiVibes.length) { setAiLog('Chọn ít nhất 1 phong cách'); return; }
    setAiGenerating(true);
    setAiLog('Đang gửi yêu cầu tới AI...');

    const days = aiDays;
    const { data: plan, error: fnErr } = await supabase.functions.invoke('plan-trip', {
      body: { destination: trip.destination, days, budget_per_person: aiBudget, group_size: 2, vibes: aiVibes },
    });

    if (fnErr || !plan?.days) {
      let detail = fnErr?.message ?? plan?.error ?? JSON.stringify(plan);
      if (fnErr?.context) {
        try { const b = await (fnErr.context as Response).json(); detail = [b?.error, b?.detail].filter(Boolean).join(' — ') || JSON.stringify(b); } catch {}
      }
      setAiLog(`✗ ${detail}`);
      setAiGenerating(false);
      return;
    }

    setAiLog(`✓ AI đã lên ${plan.days.length} ngày, đang lưu...`);

    const slotMap: Record<string, 'morning' | 'afternoon' | 'evening'> = {
      'sáng': 'morning', 'chiều': 'afternoon', 'tối': 'evening',
    };
    const newItems = (plan.days as { day: number; slots: { location_id: string; time_slot: string; hint: string | null; reason: string | null }[] }[])
      .flatMap((d) => d.slots.map((s, i) => ({
        trip_id:     id,
        location_id: s.location_id,
        day_number:  d.day,
        time_slot:   slotMap[s.time_slot] ?? 'morning',
        note:        s.hint ?? null,
        ai_reason:   s.reason ?? null,
        sort_order:  i,
      })));

    if (newItems.length > 0) {
      const { error: insertErr } = await supabase.from('trip_items').insert(newItems);
      if (insertErr) {
        setAiLog(`✗ Lỗi lưu: ${insertErr.message}`);
        setAiGenerating(false);
        return;
      }
    }

    const { data: refreshed } = await supabase.from('trip_items').select('*').eq('trip_id', id).order('day_number').order('sort_order');
    setItems(refreshed ?? []);
    setAiGenerating(false);
    setAiLog('');
    setDismissedAI(true);
  }

  async function handleAddLocation() {
    if (!selectedLoc || !id) return;
    setAdding(true);
    setAddError('');
    const { data, error } = await supabase.from('trip_items').insert({
      trip_id:     id,
      location_id: selectedLoc.id,
      day_number:  addDay,
      time_slot:   addSlot,
      visit_time:  addTime || null,
      note:        addNote.trim() || null,
      sort_order:  0,
    }).select('*, locations(name, category, hint, cover_image, district)').single();
    setAdding(false);
    if (error) { setAddError('Không thể thêm: ' + error.message); return; }
    if (data) setItems((prev) => [...prev, data].sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order));
    closeAddExp();
  }

  function openAddExp(day?: number) {
    setSelectedLoc(null);
    setLocQuery('');
    setAddDay(day ?? 1);
    setAddSlot('morning');
    setAddTime('');
    setAddNote('');
    setAddError('');
    setShowAddExp(true);
  }
  function closeAddExp() {
    setShowAddExp(false);
    setSelectedLoc(null);
    setLocQuery('');
  }

  async function removeItem(itemId: string) {
    await supabase.from('trip_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }


  const maxDays = (() => {
    if (!trip) return 1;
    if (trip.start_date && trip.end_date) return tripDayCount(trip);
    if (items.length > 0) return Math.max(...items.map((i) => i.day_number));
    return tripDayCount(trip);
  })();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.nomad.primary} />
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
      {/* Fixed navbar — absolute over cover */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navbarInfo}>
          <Text style={styles.navbarTitle} numberOfLines={1}>{trip.title}</Text>
          <Badge label={STATUS_LABEL[trip.status]} color={STATUS_COLOR[trip.status]} />
        </View>
      </View>

      {/* ── Main scroll ── */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Cover — shrinks on scroll */}
        <Animated.Image
          source={{ uri: trip.cover_image ?? `https://picsum.photos/seed/${trip.id}/800/400` }}
          style={[styles.cover, { height: coverHeight, opacity: coverOpacity }]}
        />

        {/* Meta */}
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
          <View style={{ paddingBottom: 100 }}>

            {/* Setup card — hiện khi chưa có ngày đi */}
            {!trip.start_date && (
              <TouchableOpacity style={styles.setupCard} activeOpacity={0.85} onPress={() => { setSetupStart(''); setSetupEnd(''); setShowDateModal(true); }}>
                <View style={styles.setupCardLeft}>
                  <View style={styles.setupCardIcon}>
                    <Ionicons name="calendar-outline" size={20} color={colors.nomad.primary} />
                  </View>
                  <View>
                    <Text style={styles.setupCardTitle}>Thêm ngày đi</Text>
                    <Text style={styles.setupCardSub}>Để xem timeline theo từng ngày</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.nomad.primary} />
              </TouchableOpacity>
            )}

            {/* AI banner — hiện khi chưa có địa điểm, chưa dismiss */}
            {items.length === 0 && !dismissedAI && (
              <View style={styles.aiBanner}>
                <View style={styles.aiBannerTop}>
                  <View style={styles.aiBannerTitleRow}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.nomad.primary} />
                    <Text style={styles.aiBannerTitle}>AI gợi ý lịch trình cho bạn</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDismissedAI(true)}>
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.aiBannerSub}>Chọn phong cách chuyến đi</Text>
                <View style={styles.vibesRow}>
                  {['Bình yên', 'Cổ kính', 'Hoang sơ', 'Ẩm thực', 'Mạo hiểm', 'Văn hóa'].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.vibeChip, aiVibes.includes(v) && styles.vibeChipActive]}
                      onPress={() => setAiVibes((prev) => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                    >
                      <Text style={[styles.vibeChipText, aiVibes.includes(v) && styles.vibeChipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.aiBannerSub, { marginTop: 10 }]}>Ngân sách / người / ngày</Text>
                <View style={styles.vibesRow}>
                  {[{ label: '< 300k', value: 300000 }, { label: '300k–700k', value: 500000 }, { label: '700k+', value: 1000000 }].map((b) => (
                    <TouchableOpacity
                      key={b.value}
                      style={[styles.vibeChip, aiBudget === b.value && styles.vibeChipActive]}
                      onPress={() => setAiBudget(b.value)}
                    >
                      <Text style={[styles.vibeChipText, aiBudget === b.value && styles.vibeChipTextActive]}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.aiBannerSub, { marginTop: 10 }]}>Số ngày</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setAiDays((d) => Math.max(1, d - 1))}
                  >
                    <Ionicons name="remove" size={18} color={colors.nomad.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{aiDays} ngày</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setAiDays((d) => Math.min(14, d + 1))}
                  >
                    <Ionicons name="add" size={18} color={colors.nomad.primary} />
                  </TouchableOpacity>
                </View>
                {aiLog ? <Text style={styles.aiLogText}>{aiLog}</Text> : null}
                <TouchableOpacity
                  style={[styles.aiBannerBtn, aiGenerating && { opacity: 0.7 }]}
                  onPress={invokePlanTrip}
                  disabled={aiGenerating}
                >
                  {aiGenerating
                    ? <ActivityIndicator size="small" color={colors.textOnDark} />
                    : <Ionicons name="sparkles-outline" size={15} color={colors.textOnDark} />
                  }
                  <Text style={styles.aiBannerBtnText}>{aiGenerating ? 'Đang tạo...' : 'Bắt đầu gợi ý'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="map-outline" size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
                <Text style={styles.emptyBody}>Tự thêm địa điểm hoặc để AI gợi ý lịch trình phù hợp với bạn</Text>
                <TouchableOpacity style={styles.aiSuggestBtn} onPress={() => setDismissedAI(false)}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.nomad.primary} />
                  <Text style={styles.aiSuggestText}>AI gợi ý lịch trình</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addInlineBtn} onPress={openAddExp}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
                  <Text style={styles.addInlineBtnText}>Tự thêm địa điểm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Accordion days */
              Array.from({ length: maxDays }, (_, i) => i + 1).map((dayNum) => {
                const dayItems = itemsByDay[dayNum] ?? [];
                const isOpen = openDays.has(dayNum);
                return (
                  <View key={dayNum} style={styles.accordionSection}>
                    {/* Day header — tap to toggle */}
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => toggleDay(dayNum)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.dayPill}>
                        <Text style={styles.dayPillText}>{dayLabel(trip, dayNum)}</Text>
                      </View>
                      <View style={styles.accordionHeaderRight}>
                        <TouchableOpacity
                          style={styles.dayAddBtn}
                          onPress={() => openAddExp(dayNum)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="add" size={14} color={colors.nomad.primary} />
                          <Text style={styles.dayAddText}>Thêm</Text>
                        </TouchableOpacity>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Day content */}
                    {isOpen && (
                      <View style={styles.accordionBody}>
                        {dayItems.length === 0 ? (
                          <View style={styles.dayEmptyWrap}>
                            <Text style={styles.dayEmptyText}>Chưa có địa điểm cho ngày này</Text>
                          </View>
                        ) : (
                          dayItems.map((item, idx) => {
                            const isLast    = idx === dayItems.length - 1;
                            const locData   = item.locations ?? null;
                            const isAIItem  = false;

                            const displayTitle    = locData?.name ?? item.experience_title ?? '—';
                            const displayLocation = locData?.district ?? item.experience_location;
                            const hintText        = item.note ?? locData?.hint ?? null;
                            const displayNote     = item.note ?? null;
                            const displayCategory = locData?.category ?? item.experience_category;

                            const slotIdx  = dayItems.filter(i => i.time_slot === item.time_slot).findIndex(i => i.id === item.id);
                            const timeLabel = item.visit_time ? item.visit_time.slice(0, 5) : suggestTime(item.time_slot, slotIdx);

                            return (
                              <View key={item.id} style={styles.timelineRow}>
                                {/* Left: time */}
                                <View style={styles.timelineTimeCol}>
                                  <Text style={styles.timelineTime}>{timeLabel}</Text>
                                </View>

                                {/* Middle: dot + vertical line */}
                                <View style={styles.timelineDotCol}>
                                  <View style={[styles.timelineDot, idx === 0 && styles.timelineDotFirst]} />
                                  {!isLast && <View style={styles.timelineLine} />}
                                </View>

                                {/* Right: card */}
                                <TouchableOpacity
                                  style={styles.timelineCard}
                                  activeOpacity={0.85}
                                  onPress={() => {
                                    const destId = item.location_id ?? item.experience_id;
                                    if (destId) router.push(`/experience/${destId}`);
                                    else setSelectedItem(item);
                                  }}
                                  onLongPress={() => setSelectedItem(item)}
                                  delayLongPress={400}
                                >
                                  <View style={styles.cardTitleRow}>
                                    <Text
                                      style={[styles.timelineTitle, isAIItem && styles.timelineExpHint]}
                                      numberOfLines={2}
                                    >
                                      {displayTitle}
                                    </Text>
                                    {isAIItem && (
                                      <View style={styles.aiItemBadge}>
                                        <Ionicons name="sparkles" size={9} color={colors.nomad.primary} />
                                        <Text style={styles.aiItemBadgeText}>AI</Text>
                                      </View>
                                    )}
                                  </View>

                                  {displayLocation && (
                                    <Text style={styles.timelineCardLoc} numberOfLines={1}>📍 {displayLocation}</Text>
                                  )}

                                  {hintText && (
                                    <Text style={[styles.timelineCardDesc, styles.timelineExpHint]} numberOfLines={3}>{hintText}</Text>
                                  )}
                                  {displayNote && (
                                    <Text style={styles.timelineCardDesc} numberOfLines={2}>{displayNote}</Text>
                                  )}

                                  {!isAIItem && displayCategory && (
                                    <View style={styles.timelineTags}>
                                      <View style={styles.tagChip}>
                                        <Text style={styles.tagChipText}>
                                          {CATEGORY_LABEL[displayCategory] ?? displayCategory}
                                        </Text>
                                      </View>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}


        {/* ── Journal ── */}
        {tab === 'journal' && (
          <View style={{ padding: spacing.lg }}>
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
        </View>
        )}

        {/* ── Info ── */}
        {tab === 'info' && (
          <View style={{ padding: spacing.lg }}>
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
          </View>
        )}

      </Animated.ScrollView>

      {/* FAB */}
      {tab === 'timeline' && (
        <TouchableOpacity style={styles.fab} onPress={openAddExp} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color={colors.textOnDark} />
        </TouchableOpacity>
      )}

      {/* ── Item Detail Modal ── */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />

            {selectedItem && (() => {
              const loc  = selectedItem.locations as any;
              const slot = TIME_SLOTS.find(s => s.value === selectedItem.time_slot);
              const coverImg  = loc?.cover_image ?? selectedItem.experience_image;
              const title     = loc?.name ?? selectedItem.experience_title ?? '—';
              const locLabel  = loc?.district ?? loc?.address ?? selectedItem.experience_location;
              const category  = loc?.category ?? selectedItem.experience_category;
              const shortDesc = loc?.short_description ?? loc?.hint ?? selectedItem.note;
              const longDesc  = loc?.long_description;
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Cover image */}
                  {coverImg ? (
                    <Image source={{ uri: coverImg }} style={styles.detailImg} />
                  ) : (
                    <View style={styles.detailImgPlaceholder}>
                      <Ionicons name="image-outline" size={40} color={colors.border} />
                    </View>
                  )}

                  <View style={styles.detailBody}>
                    {/* Category badge */}
                    {category && (
                      <View style={styles.detailCatBadge}>
                        <Text style={styles.detailCatText}>{CATEGORY_LABEL[category] ?? category}</Text>
                      </View>
                    )}

                    {/* Title */}
                    <Text style={styles.detailTitle}>{title}</Text>

                    {/* Location */}
                    {locLabel && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.detailRowText}>{locLabel}</Text>
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

                    {/* Rating + duration + price */}
                    {!!(loc?.rating || loc?.duration_minutes || loc?.price_per_person) && (
                      <View style={[styles.detailRow, { flexWrap: 'wrap', gap: 12 }]}>
                        {loc?.rating && (
                          <Text style={styles.detailMeta}>⭐ {loc.rating}</Text>
                        )}
                        {loc?.duration_minutes && (
                          <Text style={styles.detailMeta}>⏱ {loc.duration_minutes >= 60 ? `${Math.floor(loc.duration_minutes / 60)}h` : `${loc.duration_minutes}p`}</Text>
                        )}
                        {loc?.price_per_person && (
                          <Text style={styles.detailMeta}>💰 {(loc.price_per_person / 1000).toFixed(0)}k/người</Text>
                        )}
                        {loc?.opening_hours && (
                          <Text style={styles.detailMeta}>🕐 {loc.opening_hours}</Text>
                        )}
                      </View>
                    )}

                    {/* Short description */}
                    {shortDesc && (
                      <Text style={styles.detailDesc}>{shortDesc}</Text>
                    )}

                    {/* Long description */}
                    {longDesc && longDesc !== shortDesc && (
                      <Text style={[styles.detailDesc, { color: colors.textMuted }]}>{longDesc}</Text>
                    )}

                    {/* Note */}
                    {selectedItem.note && !shortDesc?.includes(selectedItem.note) && (
                      <View style={styles.detailNoteBox}>
                        <Text style={styles.detailNoteLabel}>Ghi chú</Text>
                        <Text style={styles.detailNoteText}>{selectedItem.note}</Text>
                      </View>
                    )}

                    {/* AI reason */}
                    {selectedItem.ai_reason && (
                      <View style={[styles.detailNoteBox, { marginTop: 8, borderColor: colors.nomad.primary + '40', backgroundColor: '#e8f0d8' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Ionicons name="sparkles" size={12} color={colors.nomad.primary} />
                          <Text style={[styles.detailNoteLabel, { color: colors.nomad.primary }]}>AI chọn vì</Text>
                        </View>
                        <Text style={styles.detailNoteText}>{selectedItem.ai_reason}</Text>
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
                {selectedLoc ? 'Chọn ngày & thời điểm' : 'Thêm địa điểm'}
              </Text>
              <TouchableOpacity onPress={selectedLoc ? () => setSelectedLoc(null) : closeAddExp}>
                <Ionicons name={selectedLoc ? 'arrow-back-outline' : 'close'} size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {addError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            ) : null}

            {!selectedLoc ? (
              <>
                {/* Search input */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm địa điểm, quán ăn, di tích..."
                    placeholderTextColor={colors.textMuted}
                    value={locQuery}
                    onChangeText={setLocQuery}
                    autoFocus
                  />
                  {locQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setLocQuery('')}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* City chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, gap: 8, paddingBottom: 10 }}>
                  {CITY_OPTIONS.map((opt) => {
                    const active = cityCode === opt.code;
                    return (
                      <TouchableOpacity
                        key={String(opt.code)}
                        style={[styles.cityChip, active && styles.cityChipActive]}
                        onPress={() => setCityCode(active ? null : opt.code)}
                      >
                        <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Results */}
                {locLoading ? (
                  <ActivityIndicator color={colors.nomad.primary} style={{ paddingVertical: 24 }} />
                ) : locResults.length === 0 ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center', gap: 8 }}>
                    <Ionicons name="location-outline" size={40} color={colors.border} />
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      {locQuery ? 'Không tìm thấy kết quả' : 'Nhập tên địa điểm để tìm kiếm'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={locResults}
                    keyExtractor={(l) => l.id}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 380 }}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
                    renderItem={({ item: loc }) => {
                      const photo = loc.photos?.split(',')[0]?.trim() ?? loc.cover_image;
                      const subtitle = [loc.district, loc.city === 'SG' ? 'TP. HCM' : loc.city === 'HN' ? 'Hà Nội' : loc.city === 'DN' ? 'Đà Nẵng' : loc.city].filter(Boolean).join(', ');
                      const cat = loc.category?.split(',')[0]?.trim();
                      return (
                        <TouchableOpacity style={styles.expOption} activeOpacity={0.8} onPress={() => setSelectedLoc(loc)}>
                          <Image source={{ uri: photo ?? `https://picsum.photos/seed/loc-${loc.id}/100/100` }} style={styles.expOptionImg} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expOptionTitle} numberOfLines={1}>{loc.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                              <Text style={styles.expOptionSub} numberOfLines={1}>{subtitle}</Text>
                            </View>
                            {cat && (
                              <View style={[styles.categoryPill, { alignSelf: 'flex-start', marginTop: 4 }]}>
                                <Text style={styles.categoryPillText}>{cat}</Text>
                              </View>
                            )}
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.border} />
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </>
            ) : (
              /* Day + Slot picker */
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.pickedExpCard}>
                  <Image
                    source={{ uri: selectedLoc.cover_image ?? `https://picsum.photos/seed/loc-${selectedLoc.id}/100/100` }}
                    style={styles.pickedExpImg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickedExpTitle} numberOfLines={1}>{selectedLoc.name}</Text>
                    <Text style={styles.pickedExpLoc}>📍 {selectedLoc.district ?? selectedLoc.city}</Text>
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
                  <Button label="Thêm vào lịch trình" onPress={handleAddLocation} loading={adding} />
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
  // Navbar — absolute over cover
  navbar:             { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
  backBtn:            { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  navbarInfo:         { flex: 1, gap: 4 },
  navbarTitle:        { fontSize: 16, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  tripTitle:          { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cover:              { width: '100%', resizeMode: 'cover' },
  coverMeta:          { backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  // Accordion
  accordionSection:   { borderBottomWidth: 1, borderBottomColor: colors.border },
  accordionHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12, backgroundColor: colors.bgCard },
  accordionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accordionBody:      { paddingTop: spacing.md, paddingBottom: spacing.lg, paddingLeft: spacing.sm, paddingRight: spacing.md },
  destination:        { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  dates:              { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabs:               { flexDirection: 'row', backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:             { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:       { borderBottomWidth: 2, borderBottomColor: colors.nomad.primary },
  tabText:            { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  tabTextActive:      { color: colors.nomad.primary, fontWeight: '600' },
  // Setup card
  setupCard:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e8f0d8', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.nomad.primary + '40' },
  setupCardLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setupCardIcon:    { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  setupCardTitle:   { fontSize: 14, fontWeight: '700', color: colors.nomad.primary },
  setupCardSub:     { fontSize: 12, color: colors.nomad.primary + 'aa', marginTop: 2 },
  // AI banner
  aiBanner:         { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  aiBannerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  aiBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBannerTitle:    { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  aiBannerSub:      { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  vibesRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  vibeChip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  vibeChipActive:   { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  vibeChipText:     { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  vibeChipTextActive: { color: colors.nomad.primary, fontWeight: '700' },
  stepperRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  stepperBtn:       { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center' },
  stepperValue:     { fontSize: 15, fontWeight: '600', color: colors.text, minWidth: 56, textAlign: 'center' },
  aiLogText:        { fontSize: 12, color: colors.nomad.primary, marginTop: 8 },
  aiBannerBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.nomad.primary, paddingVertical: 10, borderRadius: radius.lg },
  aiBannerBtnText:  { color: colors.textOnDark, fontWeight: '600', fontSize: 13 },
  // Detail modal
  detailImg:          { width: '100%', height: 200, borderRadius: radius.lg, resizeMode: 'cover', marginBottom: spacing.md },
  detailImgPlaceholder: { width: '100%', height: 140, borderRadius: radius.lg, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  detailBody:         { paddingBottom: spacing.lg },
  detailCatBadge:     { alignSelf: 'flex-start', backgroundColor: '#e8f0d8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, marginBottom: 8 },
  detailCatText:      { fontSize: 11, fontWeight: '600', color: colors.nomad.primary },
  detailTitle:        { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  detailRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailRowText:      { fontSize: 13, color: colors.textMuted },
  detailNoteBox:      { backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  detailNoteLabel:    { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  detailMeta:         { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  detailDesc:         { fontSize: 14, color: colors.textPrimary, lineHeight: 21, marginTop: spacing.sm },
  detailNoteText:     { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  detailActions:      { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  detailDeleteBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.error, paddingVertical: 12, borderRadius: radius.lg },
  detailDeleteText:   { fontSize: 13, fontWeight: '600', color: colors.error },
  detailCloseBtn:     { flex: 1, backgroundColor: colors.nomad.primary, paddingVertical: 12, borderRadius: radius.lg, alignItems: 'center' },
  detailCloseBtnText: { fontSize: 13, fontWeight: '600', color: colors.textOnDark },
  // Date setup modal
  dateSetupLabel:   { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm },
  // Timeline empty
  emptyWrap:          { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  emptyBody:          { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  addInlineBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.nomad.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  addInlineBtnText:   { color: colors.textOnDark, fontWeight: '700', fontSize: 14 },
  // FAB
  fab:                { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  // Day group
  dayGroup:              { marginBottom: spacing.xl },
  dayGroupHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayPill:               { backgroundColor: colors.nomad.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full },
  dayPillText:           { fontSize: 12, fontWeight: '700', color: colors.textOnDark },
  dayAddBtn:             { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.nomad.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  dayAddText:            { fontSize: 12, color: colors.nomad.primary, fontWeight: '600' },
  aiSuggestBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.nomad.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  aiSuggestText:         { color: colors.nomad.primary, fontWeight: '700', fontSize: 14 },
  // Timeline item — new layout: [time | dot+line | card]
  timelineRow:           { flexDirection: 'row', alignItems: 'stretch', marginBottom: 0 },
  timelineTimeCol:       { width: 50, alignItems: 'flex-end', paddingRight: 8, paddingTop: 13 },
  timelineTime:          { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  timelineDotCol:        { width: 20, alignItems: 'center', paddingTop: 11 },
  timelineDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, borderWidth: 2, borderColor: colors.nomad.primary },
  timelineDotFirst:      { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.nomad.primary, borderWidth: 0 },
  timelineLine:          { width: 2, flex: 1, backgroundColor: colors.nomad.primary + '25', marginTop: 4, marginBottom: 0 },
  timelineCard:          { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginLeft: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardTitleRow:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  timelineTitle:         { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary, lineHeight: 20 },
  timelineCardLoc:       { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  timelineCardDesc:      { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  timelineTags:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagChip:               { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  tagChipText:           { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  deleteBtn:             { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, padding: 4 },
  // Journal
  journalCard:        { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  journalHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  journalDay:         { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  journalContent:     { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  journalForm:        { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  formLabel:          { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  dayBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f0d8', alignItems: 'center', justifyContent: 'center' },
  dayBtnActive:       { backgroundColor: colors.nomad.primary },
  dayBtnText:         { fontSize: 13, fontWeight: '500', color: colors.nomad.primary },
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
  expOptionCat:       { fontSize: 11, color: colors.nomad.primary, marginTop: 2 },
  cityChip:           { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  cityChipActive:     { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  cityChipText:       { fontSize: 12, color: colors.textMuted },
  cityChipTextActive: { color: colors.nomad.primary, fontWeight: '600' },
  categoryPill:       { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: '#e8f0d8' },
  categoryPillText:   { fontSize: 10, color: colors.nomad.primary, fontWeight: '600' },
  pickedExpCard:      { flexDirection: 'row', gap: 10, backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: 10, marginBottom: spacing.lg, alignItems: 'center' },
  pickedExpImg:       { width: 52, height: 52, borderRadius: radius.md, resizeMode: 'cover' },
  pickedExpTitle:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  pickedExpLoc:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stepLabel:          { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  dayChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  dayChipActive:      { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  dayChipText:        { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  dayChipTextActive:  { color: colors.textOnDark },
  slotRow:            { flexDirection: 'row', gap: 8 },
  slotBtn:            { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen },
  slotBtnActive:      { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  slotIcon:           { fontSize: 18, marginBottom: 4 },
  slotLabel:          { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  slotLabelActive:    { color: colors.nomad.primary },
  timeChip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  timeChipActive:     { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  timeChipText:       { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  timeChipTextActive: { color: colors.textOnDark },
  noteInput:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 60, backgroundColor: colors.bgScreen },
  // Day tabs bar
  dayTabsBar:         { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard, paddingVertical: 10 },
  dayTab:             { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen },
  dayTabActive:       { borderColor: colors.nomad.primary, backgroundColor: colors.nomad.primary },
  dayTabText:         { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  dayTabTextActive:   { color: '#fff' },
  // Day empty
  dayEmptyWrap:       { alignItems: 'center', paddingVertical: 40 },
  dayEmptyText:       { fontSize: 14, color: colors.textMuted, marginTop: 10, marginBottom: 20 },
  // AI item
  aiItemBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, backgroundColor: '#e8f0d8' },
  aiItemBadgeText:    { fontSize: 10, color: colors.nomad.primary, fontWeight: '700' },
  timelineExpHint:    { fontStyle: 'italic', color: colors.textMuted },
});
