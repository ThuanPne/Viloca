import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, TextInput, ActivityIndicator, Image, ImageBackground, Modal, Animated, Alert, Share,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { DatePicker } from '@/src/components/ui/DatePicker';
import supabase from '@/src/lib/supabase';
import type { Trip, TripItem, TripJournal, TimeSlot, TripStatus } from '@/src/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'timeline' | 'journal' | 'info';

const STATUS_COLOR: Record<string, 'warning' | 'forest' | 'neutral'> = {
  planning: 'warning', active: 'forest', completed: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  planning: 'Lên kế hoạch', active: 'Đang diễn ra', completed: 'Hoàn thành',
};
const STATUS_OPTIONS: { value: TripStatus; label: string; icon: string }[] = [
  { value: 'planning',  label: 'Lên kế hoạch', icon: 'calendar-outline' },
  { value: 'active',    label: 'Đang diễn ra',  icon: 'airplane-outline' },
  { value: 'completed', label: 'Hoàn thành',    icon: 'checkmark-circle-outline' },
];
const MOOD_OPTIONS: { value: 'great' | 'good' | 'okay' | 'tired'; icon: string; label: string }[] = [
  { value: 'great', icon: '😄', label: 'Tuyệt' },
  { value: 'good',  icon: '😊', label: 'Vui' },
  { value: 'okay',  icon: '😐', label: 'Bình thường' },
  { value: 'tired', icon: '😴', label: 'Mệt' },
];
const MOOD_ICONS: Record<string, string> = {
  great: '😄', good: '😊', okay: '😐', tired: '😴',
};
const TIME_SLOTS: { value: TimeSlot; label: string; icon: string }[] = [
  { value: 'morning',   label: 'Sáng',  icon: '🌅' },
  { value: 'afternoon', label: 'Chiều', icon: '☀️' },
  { value: 'evening',   label: 'Tối',   icon: '🌙' },
];
const CATEGORY_LABEL: Record<string, string> = {
  food_tour: 'Ẩm thực', workshop: 'Workshop', trekking: 'Thiên nhiên', cultural: 'Văn hóa',
};

const SLOT_BASE_MIN: Record<string, number> = { morning: 7 * 60, afternoon: 13 * 60, evening: 18 * 60 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    return Math.max(1, Math.min(diff, 30));
  }
  return 0;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Sortable Day List ────────────────────────────────────────────────────────

const ITEM_H = 90; // approximate height of each timeline card

type SortableProps = {
  items: TripItem[];
  trip: Trip;
  dayNum: number;
  editMode?: boolean;
  checkedIds?: Set<string>;
  onToggleCheck?: (id: string) => void;
  onReorder: (newItems: TripItem[]) => void;
  onItemPress: (item: TripItem) => void;
  onItemDetail: (item: TripItem) => void;
};

function SortableDayItems({ items, trip, dayNum, editMode, checkedIds, onToggleCheck, onReorder, onItemPress, onItemDetail }: SortableProps) {
  const [display, setDisplay]   = useState<TripItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  // refs — stable across re-renders, safe to read inside gesture callbacks
  const displayRef   = useRef<TripItem[]>(items);
  const onReorderRef = useRef(onReorder);
  const pendingIdx   = useRef(-1);
  const startIdx     = useRef(-1);
  const currentIdx   = useRef(-1);
  const activeIdRef  = useRef<string | null>(null);

  // keep onReorder ref in sync without recreating the gesture
  onReorderRef.current = onReorder;

  useEffect(() => {
    displayRef.current = items;
    setDisplay(items);
    setActiveId(null);
    activeIdRef.current = null;
  }, [items]);

  // gesture created once — never recreated on re-render
  const panGesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .activateAfterLongPress(220)
    .onStart(() => {
      const idx = pendingIdx.current;
      const id  = displayRef.current[idx]?.id ?? null;
      startIdx.current    = idx;
      currentIdx.current  = idx;
      activeIdRef.current = id;
      setActiveId(id);
    })
    .onUpdate((e) => {
      if (startIdx.current < 0 || !activeIdRef.current) return;
      const target = Math.max(0, Math.min(
        displayRef.current.length - 1,
        startIdx.current + Math.round(e.translationY / ITEM_H),
      ));
      if (target === currentIdx.current) return;
      const next    = [...displayRef.current];
      const fromIdx = next.findIndex(i => i.id === activeIdRef.current);
      if (fromIdx < 0) return;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(target, 0, moved);
      displayRef.current = next;
      setDisplay([...next]);
      currentIdx.current = target;
    })
    .onEnd(() => {
      if (activeIdRef.current) onReorderRef.current([...displayRef.current]);
      setActiveId(null);
      activeIdRef.current = null;
      startIdx.current    = -1;
    })
    .onFinalize(() => {
      setActiveId(null);
      activeIdRef.current = null;
      startIdx.current    = -1;
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  return (
    <GestureDetector gesture={panGesture}>
      <View>
        {display.map((item, idx) => {
          const isActive      = activeId === item.id;
          const locData       = item.locations ?? null;
          const displayTitle  = locData?.name ?? item.experience_title ?? '—';
          const displayLoc    = locData?.district ?? item.experience_location;
          const hintText      = item.note ?? locData?.hint ?? null;
          const displayNote   = item.note ?? null;
          const displayCat    = locData?.category ?? item.experience_category;
          const slotIdx       = display.filter(i => i.time_slot === item.time_slot).findIndex(i => i.id === item.id);
          const timeLabel     = item.visit_time ? item.visit_time.slice(0, 5) : suggestTime(item.time_slot, slotIdx);
          const isLast        = idx === display.length - 1;

          const photoUrl = locData?.cover_image
            ?? (locData?.photos ? locData.photos.split(',')[0].trim() : null)
            ?? item.experience_image
            ?? null;

          return (
            <View
              key={item.id}
              onStartShouldSetResponder={() => { pendingIdx.current = idx; return false; }}
              style={[styles.timelineRow, isActive && styles.timelineRowActive]}
            >
              {/* Checkbox (edit mode) hoặc drag handle */}
              {editMode ? (
                <TouchableOpacity
                  style={styles.checkboxWrap}
                  onPress={() => onToggleCheck?.(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={[styles.checkbox, checkedIds?.has(item.id) && styles.checkboxChecked]}>
                    {checkedIds?.has(item.id) && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.dragHandle}>
                  <Ionicons name="reorder-two-outline" size={20} color={isActive ? colors.nomad.primary : colors.border} />
                </View>
              )}

              {/* Giờ bên trái */}
              <View style={styles.timelineTimeCol}>
                <Text style={styles.timelineTime}>{timeLabel}</Text>
              </View>

              {/* Dot + line */}
              <View style={styles.timelineDotCol}>
                <View style={[styles.timelineDot, idx === 0 && styles.timelineDotFirst]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              {/* Card */}
              <TouchableOpacity
                style={[styles.timelineCard, isActive && styles.timelineCardActive]}
                activeOpacity={0.9}
                onPress={() => onItemPress(item)}
                onLongPress={() => onItemDetail(item)}
                delayLongPress={500}
              >
                <View style={styles.cardInner}>
                  {/* Ảnh bên trái */}
                  <ImageBackground
                    source={photoUrl ? { uri: photoUrl } : undefined}
                    style={styles.cardThumb}
                    imageStyle={styles.cardThumbImg}
                    resizeMode="cover"
                  >
                    {!photoUrl && (
                      <LinearGradient
                        colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    {photoUrl && (
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.35)']}
                        locations={[0.4, 1]}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                  </ImageBackground>

                  {/* Text bên phải */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.timelineTitle} numberOfLines={2}>{displayTitle}</Text>
                      {!!item.ai_reason && (
                        <View style={styles.aiItemBadge}>
                          <Ionicons name="sparkles" size={9} color={colors.nomad.primary} />
                          <Text style={styles.aiItemBadgeText}>AI</Text>
                        </View>
                      )}
                    </View>
                    {displayLoc && (
                      <View style={styles.cardLocRow}>
                        <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                        <Text style={styles.timelineCardLoc} numberOfLines={1}>{displayLoc}</Text>
                      </View>
                    )}
                    {hintText && (
                      <Text style={[styles.timelineCardDesc, { fontStyle: 'italic' }]} numberOfLines={1}>{hintText}</Text>
                    )}
                    {displayCat && (
                      <View style={[styles.tagChip, { alignSelf: 'flex-start', marginTop: 6 }]}>
                        <Text style={styles.tagChipText}>{CATEGORY_LABEL[displayCat] ?? displayCat}</Text>
                      </View>
                    )}
                  </View>
                </View>

              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip]         = useState<Trip | null>(null);
  const [items, setItems]       = useState<TripItem[]>([]);
  const [journals, setJournals] = useState<TripJournal[]>([]);
  const [tab, setTab]           = useState<Tab>('timeline');
  const [loading, setLoading]   = useState(true);

  // Journal
  const [journalDay, setJournalDay]       = useState(1);
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood]     = useState<'great' | 'good' | 'okay' | 'tired' | null>(null);
  const [saving, setSaving]               = useState(false);

  // Date modal
  const [showDateModal, setShowDateModal] = useState(false);
  const [setupStart, setSetupStart]       = useState('');
  const [setupEnd, setSetupEnd]           = useState('');
  const [savingDates, setSavingDates]     = useState(false);

  // Extra days (extend beyond date range)
  const [extraDays, setExtraDays] = useState(0);

  // AI banner
  const [dismissedAI, setDismissedAI]   = useState(false);
  const [aiVibes, setAiVibes]           = useState<string[]>([]);
  const [aiBudget, setAiBudget]         = useState(500000);
  const [aiDays, setAiDays]             = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiLog, setAiLog]               = useState('');

  // Day selector
  const [selectedDay, setSelectedDay] = useState(1);

  // Edit mode (selection)
  const [editMode, setEditMode]               = useState(false);
  const [checkedIds, setCheckedIds]           = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal]     = useState(false);
  const [movingItems, setMovingItems]         = useState(false);

  // Scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const COVER_MAX = 220;
  const COVER_MIN = 72;
  const coverHeight  = scrollY.interpolate({ inputRange: [0, COVER_MAX - COVER_MIN], outputRange: [COVER_MAX, COVER_MIN], extrapolate: 'clamp' });
  const coverOpacity = scrollY.interpolate({ inputRange: [0, COVER_MAX - COVER_MIN], outputRange: [1, 0.45], extrapolate: 'clamp' });

  // Dragging state per day

  // Detail modal
  const [selectedItem, setSelectedItem] = useState<TripItem | null>(null);


  // Edit trip modal
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editTitle, setEditTitle]           = useState('');
  const [editStatus, setEditStatus]         = useState<TripStatus>('planning');
  const [savingEdit, setSavingEdit]         = useState(false);


  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_items')
        .select('*, locations(name, category, hint, short_description, long_description, cover_image, photos, district, address, price_per_person, duration_minutes, rating, opening_hours)')
        .eq('trip_id', id)
        .order('day_number')
        .order('sort_order'),
      supabase.from('trip_journals').select('*').eq('trip_id', id).order('day_number'),
    ]).then(([t, i, j]) => {
      setTrip(t.data);
      setItems(i.data ?? []);
      setJournals(j.data ?? []);
      if (!t.data?.is_ai_generated) setDismissedAI(true);
      setLoading(false);
    });
  }, [id]);

  // ── Dates ────────────────────────────────────────────────────────────────────

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
    if (data) { setTrip(data); setExtraDays(0); }
    setShowDateModal(false);
  }

  // ── Journal ───────────────────────────────────────────────────────────────────

  async function saveJournal() {
    if (!id || !journalContent.trim()) return;
    setSaving(true);
    const existing = journals.find((j) => j.day_number === journalDay);
    if (existing) {
      const { data } = await supabase
        .from('trip_journals')
        .update({ content: journalContent, mood: journalMood })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) setJournals(journals.map((j) => (j.id === data.id ? data : j)));
    } else {
      const { data } = await supabase
        .from('trip_journals')
        .insert({ trip_id: id, day_number: journalDay, content: journalContent, photos: [], mood: journalMood, weather: null })
        .select()
        .single();
      if (data) setJournals([...journals, data]);
    }
    setSaving(false);
    setJournalContent('');
    setJournalMood(null);
  }

  // ── AI suggest ────────────────────────────────────────────────────────────────

  async function invokePlanTrip() {
    if (!trip || !id) return;
    if (!aiVibes.length) { setAiLog('Chọn ít nhất 1 phong cách'); return; }
    setAiGenerating(true);
    setAiLog('Đang gửi yêu cầu tới AI...');

    const { data: plan, error: fnErr } = await supabase.functions.invoke('plan-trip', {
      body: { destination: trip.destination, days: aiDays, budget_per_person: aiBudget, group_size: 2, vibes: aiVibes },
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
      if (insertErr) { setAiLog(`✗ Lỗi lưu: ${insertErr.message}`); setAiGenerating(false); return; }
    }

    const { data: refreshed } = await supabase
      .from('trip_items')
      .select('*, locations(name, category, hint, short_description, long_description, cover_image, photos, district, address, price_per_person, duration_minutes, rating, opening_hours)')
      .eq('trip_id', id)
      .order('day_number')
      .order('sort_order');
    setItems(refreshed ?? []);
    setAiGenerating(false);
    setAiLog('');
    setDismissedAI(true);
  }

  // ── Add location ──────────────────────────────────────────────────────────────

  // Refresh items khi quay về từ add-location page
  useFocusEffect(useCallback(() => {
    if (!id) return;
    supabase.from('trip_items')
      .select('*, locations(name, category, hint, short_description, long_description, cover_image, photos, district, address, price_per_person, duration_minutes, rating, opening_hours)')
      .eq('trip_id', id)
      .order('day_number').order('sort_order')
      .then(({ data }) => { if (data) setItems(data); });
  }, [id]));

  function openAddExp(day?: number) {
    router.push({ pathname: '/search', params: { mode: 'pick', trip_id: id, day: String(day ?? selectedDay) } });
  }

  async function removeItem(itemId: string) {
    await supabase.from('trip_items').delete().eq('id', itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  // ── Reorder (drag-and-drop) ───────────────────────────────────────────────────

  async function handleDragEnd(dayNum: number, newOrder: TripItem[]) {
    // Optimistic: update sort_order sequentially
    const updated = newOrder.map((item, idx) => ({ ...item, sort_order: idx }));
    setItems(prev => {
      const otherDays = prev.filter(i => i.day_number !== dayNum);
      return [...otherDays, ...updated].sort((a, b) => a.day_number - b.day_number || a.sort_order - b.sort_order);
    });
    // Persist
    await Promise.all(
      updated.map(item => supabase.from('trip_items').update({ sort_order: item.sort_order }).eq('id', item.id))
    );

  }

  // ── Bulk actions ─────────────────────────────────────────────────────────────

  function exitEditMode() {
    setEditMode(false);
    setCheckedIds(new Set());
  }

  async function bulkDelete() {
    const ids = [...checkedIds];
    if (!ids.length) return;
    Alert.alert('Xoá địa điểm', `Xoá ${ids.length} địa điểm đã chọn?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive',
        onPress: async () => {
          await Promise.all(ids.map(id => supabase.from('trip_items').delete().eq('id', id)));
          setItems(prev => prev.filter(i => !ids.includes(i.id)));
          exitEditMode();
        },
      },
    ]);
  }

  async function bulkMove(targetDay: number) {
    const ids = [...checkedIds];
    if (!ids.length) return;
    setMovingItems(true);
    await Promise.all(ids.map(id => supabase.from('trip_items').update({ day_number: targetDay }).eq('id', id)));
    setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, day_number: targetDay } : i));
    setMovingItems(false);
    setShowMoveModal(false);
    exitEditMode();
    setSelectedDay(targetDay);
  }

  // ── Edit trip ─────────────────────────────────────────────────────────────────

  function openEditModal() {
    if (!trip) return;
    setEditTitle(trip.title);
    setEditStatus(trip.status);
    setShowEditModal(true);
  }

  async function saveEdit() {
    if (!id || !editTitle.trim()) return;
    setSavingEdit(true);
    const { data } = await supabase
      .from('trips')
      .update({ title: editTitle.trim(), status: editStatus })
      .eq('id', id)
      .select()
      .single();
    setSavingEdit(false);
    if (data) setTrip(data);
    setShowEditModal(false);
  }

  async function deleteTrip() {
    Alert.alert(
      'Xoá chuyến đi',
      `Xoá "${trip?.title}"? Toàn bộ lịch trình và nhật ký sẽ bị xoá vĩnh viễn.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await supabase.from('trip_items').delete().eq('trip_id', id);
            await supabase.from('trip_journals').delete().eq('trip_id', id);
            await supabase.from('trips').delete().eq('id', id);
            router.back();
          },
        },
      ],
    );
  }

  // ── Share ─────────────────────────────────────────────────────────────────────

  function shareItinerary() {
    if (!trip) return;
    const lines: string[] = [
      `🗺 ${trip.title}`,
      `📍 ${trip.destination}`,
      trip.start_date ? `📅 ${formatDate(trip.start_date)}${trip.end_date ? ` → ${formatDate(trip.end_date)}` : ''}` : '',
      '',
    ];

    const grouped: Record<number, TripItem[]> = {};
    items.forEach(i => { (grouped[i.day_number] = grouped[i.day_number] ?? []).push(i); });

    Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).forEach(day => {
      lines.push(`── ${dayLabel(trip, Number(day))} ──`);
      grouped[Number(day)]
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach(item => {
          const name = (item.locations as any)?.name ?? item.experience_title ?? '?';
          const slot = TIME_SLOTS.find(s => s.value === item.time_slot);
          lines.push(`  ${slot?.icon ?? ''} ${name}`);
          if (item.note) lines.push(`     → ${item.note}`);
        });
      lines.push('');
    });

    lines.push('Tạo bởi Viloca 🌿');
    Share.share({ message: lines.filter(l => l !== null).join('\n') });
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  const baseDays = trip ? tripDayCount(trip) : 0;
  const maxDays = (() => {
    if (!trip) return 1;
    const fromItems = items.length > 0 ? Math.max(...items.map(i => i.day_number)) : 0;
    return Math.max(baseDays + extraDays, fromItems, 1);
  })();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.nomad.primary} /></View>;
  }
  if (!trip) {
    return <View style={styles.center}><Text style={{ color: colors.textMuted }}>Trip không tìm thấy</Text></View>;
  }

  const itemsByDay: Record<number, TripItem[]> = {};
  items.forEach(item => {
    if (!itemsByDay[item.day_number]) itemsByDay[item.day_number] = [];
    itemsByDay[item.day_number].push(item);
  });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Fixed navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navbarInfo}>
          <Text style={styles.navbarTitle} numberOfLines={1}>{trip.title}</Text>
          <Badge label={STATUS_LABEL[trip.status]} color={STATUS_COLOR[trip.status]} />
        </View>
        <TouchableOpacity style={styles.editNavBtn} onPress={openEditModal}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Cover */}
        <Animated.Image
          source={{ uri: trip.cover_image ?? `https://picsum.photos/seed/trip-${trip.id}/800/400` }}
          style={[styles.cover, { height: coverHeight, opacity: coverOpacity }]}
        />

        {/* Meta */}
        <View style={styles.coverMeta}>
          <Text style={styles.destination}>📍 {trip.destination}</Text>
          {trip.start_date ? (
            <Text style={styles.dates}>{formatDate(trip.start_date)} → {trip.end_date ? formatDate(trip.end_date) : '...'}</Text>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['timeline', 'journal', 'info'] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = { timeline: 'Timeline', journal: 'Nhật ký', info: 'Thông tin' };
            return (
              <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{labels[t]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── TIMELINE ── */}
        {tab === 'timeline' && (
          <View style={{ paddingBottom: 100 }}>
            {/* Setup dates card */}
            <TouchableOpacity
              style={styles.setupCard}
              activeOpacity={0.85}
              onPress={() => { setSetupStart(trip.start_date ?? ''); setSetupEnd(trip.end_date ?? ''); setShowDateModal(true); }}
            >
              <View style={styles.setupCardLeft}>
                <View style={styles.setupCardIcon}>
                  <Ionicons name="calendar-outline" size={20} color={colors.nomad.primary} />
                </View>
                <View>
                  <Text style={styles.setupCardTitle}>
                    {trip.start_date ? `${formatDate(trip.start_date)} → ${trip.end_date ? formatDate(trip.end_date) : '...'}` : 'Thêm ngày đi'}
                  </Text>
                  <Text style={styles.setupCardSub}>
                    {trip.start_date ? `${maxDays} ngày · Nhấn để thay đổi` : 'Để xem timeline theo từng ngày'}
                  </Text>
                </View>
              </View>
              <View style={styles.setupCardRight}>
                {trip.start_date && (
                  <View style={styles.extendDaysRow}>
                    <TouchableOpacity
                      style={styles.extendBtn}
                      onPress={(e) => { e.stopPropagation?.(); setExtraDays(Math.max(1 - baseDays, extraDays - 1)); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="remove" size={14} color={colors.nomad.primary} />
                    </TouchableOpacity>
                    <Text style={styles.extendBtnText}>{extraDays > 0 ? `+${extraDays}` : '±'}</Text>
                    <TouchableOpacity
                      style={styles.extendBtn}
                      onPress={(e) => { e.stopPropagation?.(); setExtraDays(extraDays + 1); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="add" size={14} color={colors.nomad.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.nomad.primary} />
              </View>
            </TouchableOpacity>

            {/* AI banner */}
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
                      onPress={() => setAiVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                    >
                      <Text style={[styles.vibeChipText, aiVibes.includes(v) && styles.vibeChipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.aiBannerSub, { marginTop: 10 }]}>Ngân sách / người / ngày</Text>
                <View style={styles.vibesRow}>
                  {[{ label: '< 300k', value: 300000 }, { label: '300k–700k', value: 500000 }, { label: '700k+', value: 1000000 }].map((b) => (
                    <TouchableOpacity key={b.value} style={[styles.vibeChip, aiBudget === b.value && styles.vibeChipActive]} onPress={() => setAiBudget(b.value)}>
                      <Text style={[styles.vibeChipText, aiBudget === b.value && styles.vibeChipTextActive]}>{b.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.aiBannerSub, { marginTop: 10 }]}>Số ngày</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setAiDays(d => Math.max(1, d - 1))}>
                    <Ionicons name="remove" size={18} color={colors.nomad.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{aiDays} ngày</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setAiDays(d => Math.min(14, d + 1))}>
                    <Ionicons name="add" size={18} color={colors.nomad.primary} />
                  </TouchableOpacity>
                </View>
                {aiLog ? <Text style={styles.aiLogText}>{aiLog}</Text> : null}
                <TouchableOpacity style={[styles.aiBannerBtn, aiGenerating && { opacity: 0.7 }]} onPress={invokePlanTrip} disabled={aiGenerating}>
                  {aiGenerating
                    ? <ActivityIndicator size="small" color={colors.textOnDark} />
                    : <Ionicons name="sparkles-outline" size={15} color={colors.textOnDark} />}
                  <Text style={styles.aiBannerBtnText}>{aiGenerating ? 'Đang tạo...' : 'Bắt đầu gợi ý'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="map-outline" size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm nào</Text>
                <Text style={styles.emptyBody}>
                  {dismissedAI ? 'Thêm địa điểm đầu tiên vào lịch trình' : 'Tự thêm địa điểm hoặc để AI gợi ý lịch trình phù hợp'}
                </Text>
                {!dismissedAI && (
                  <TouchableOpacity style={styles.aiSuggestBtn} onPress={() => setDismissedAI(false)}>
                    <Ionicons name="sparkles-outline" size={18} color={colors.nomad.primary} />
                    <Text style={styles.aiSuggestText}>AI gợi ý lịch trình</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addInlineBtn} onPress={() => { setDismissedAI(true); openAddExp(); }}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.textOnDark} />
                  <Text style={styles.addInlineBtnText}>Tự thêm địa điểm</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Day selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.daySelectorBar}
                  contentContainerStyle={styles.daySelectorContent}
                >
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((dayNum) => {
                    const isActive = selectedDay === dayNum;
                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[styles.daySelectorChip, isActive && styles.daySelectorChipActive]}
                        onPress={() => setSelectedDay(dayNum)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.daySelectorDay, isActive && styles.daySelectorDayActive]}>
                          Ngày {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Selected day content */}
                <View style={styles.dayContent}>
                  <View style={styles.dayContentHeader}>
                    <Text style={styles.dayContentTitle}>{dayLabel(trip, selectedDay)}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(itemsByDay[selectedDay] ?? []).length > 0 && (
                        <TouchableOpacity
                          style={[styles.dayAddBtn, editMode && { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' }]}
                          onPress={() => { editMode ? exitEditMode() : setEditMode(true); setCheckedIds(new Set()); }}
                        >
                          <Ionicons name={editMode ? 'checkmark' : 'create-outline'} size={14} color={colors.nomad.primary} />
                          <Text style={styles.dayAddText}>{editMode ? 'Xong' : 'Chỉnh sửa'}</Text>
                        </TouchableOpacity>
                      )}
                      {!editMode && (
                        <TouchableOpacity style={styles.dayAddBtn} onPress={() => openAddExp(selectedDay)}>
                          <Ionicons name="add" size={14} color={colors.nomad.primary} />
                          <Text style={styles.dayAddText}>Thêm</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {(itemsByDay[selectedDay] ?? []).length === 0 ? (
                    <View style={styles.dayEmptyWrap}>
                      <Ionicons name="calendar-outline" size={40} color={colors.border} />
                      <Text style={styles.dayEmptyText}>Chưa có địa điểm cho ngày này</Text>
                      <TouchableOpacity style={styles.dayEmptyAddBtn} onPress={() => openAddExp(selectedDay)}>
                        <Text style={styles.dayEmptyAddText}>+ Thêm địa điểm</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <SortableDayItems
                      items={(itemsByDay[selectedDay] ?? []).sort((a, b) => a.sort_order - b.sort_order)}
                      trip={trip}
                      dayNum={selectedDay}
                      editMode={editMode}
                      checkedIds={checkedIds}
                      onToggleCheck={(id) => setCheckedIds(prev => {
                        const n = new Set(prev);
                        n.has(id) ? n.delete(id) : n.add(id);
                        return n;
                      })}
                      onReorder={(newItems) => handleDragEnd(selectedDay, newItems)}
                      onItemPress={(item) => {
                        if (editMode) {
                          setCheckedIds(prev => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; });
                        } else {
                          if (item.location_id) router.push(`/location/${item.location_id}`);
                          else if (item.experience_id) router.push(`/experience/${item.experience_id}`);
                          else setSelectedItem(item);
                        }
                      }}
                      onItemDetail={(item) => { if (!editMode) setSelectedItem(item); }}
                    />
                  )}

                  {/* Bottom action bar khi edit mode */}
                  {editMode && (
                    <View style={styles.editActionBar}>
                      <TouchableOpacity
                        style={[styles.editActionBtn, { borderColor: colors.nomad.primary }]}
                        onPress={() => setShowMoveModal(true)}
                        disabled={checkedIds.size === 0}
                      >
                        <Ionicons name="arrow-forward-circle-outline" size={18} color={checkedIds.size > 0 ? colors.nomad.primary : colors.border} />
                        <Text style={[styles.editActionText, { color: checkedIds.size > 0 ? colors.nomad.primary : colors.border }]}>
                          Chuyển ngày ({checkedIds.size})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionBtn, { borderColor: colors.error }]}
                        onPress={bulkDelete}
                        disabled={checkedIds.size === 0}
                      >
                        <Ionicons name="trash-outline" size={18} color={checkedIds.size > 0 ? colors.error : colors.border} />
                        <Text style={[styles.editActionText, { color: checkedIds.size > 0 ? colors.error : colors.border }]}>
                          Xoá ({checkedIds.size})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* ── JOURNAL ── */}
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

              {/* Day selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayBtn, journalDay === d && styles.dayBtnActive]}
                      onPress={() => {
                        setJournalDay(d);
                        const existing = journals.find(j => j.day_number === d);
                        setJournalContent(existing?.content ?? '');
                        setJournalMood(existing?.mood ?? null);
                      }}
                    >
                      <Text style={[styles.dayBtnText, journalDay === d && styles.dayBtnTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Mood picker */}
              <Text style={styles.moodLabel}>Cảm xúc hôm nay</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.moodBtn, journalMood === m.value && styles.moodBtnActive]}
                    onPress={() => setJournalMood(journalMood === m.value ? null : m.value)}
                  >
                    <Text style={styles.moodIcon}>{m.icon}</Text>
                    <Text style={[styles.moodBtnLabel, journalMood === m.value && styles.moodBtnLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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

        {/* ── INFO ── */}
        {tab === 'info' && (
          <View style={{ padding: spacing.lg }}>
            {/* Status picker */}
            <Text style={styles.infoSectionLabel}>Trạng thái</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusBtn, trip.status === opt.value && styles.statusBtnActive]}
                  onPress={async () => {
                    const { data } = await supabase.from('trips').update({ status: opt.value }).eq('id', id!).select().single();
                    if (data) setTrip(data);
                  }}
                >
                  <Ionicons name={opt.icon as any} size={16} color={trip.status === opt.value ? colors.nomad.primary : colors.textMuted} />
                  <Text style={[styles.statusBtnText, trip.status === opt.value && styles.statusBtnTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info rows */}
            {[
              { label: 'Tên chuyến đi', value: trip.title },
              { label: 'Điểm đến',      value: trip.destination },
              { label: 'Ngày đi',       value: trip.start_date ? formatDate(trip.start_date) : '—' },
              { label: 'Ngày về',       value: trip.end_date   ? formatDate(trip.end_date)   : '—' },
              { label: 'Số ngày',       value: `${maxDays} ngày` },
              { label: 'Địa điểm',      value: `${items.length} địa điểm` },
            ].map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}

            {trip.summary_note && (
              <View style={[styles.infoRow, { flexDirection: 'column', gap: 6 }]}>
                <Text style={styles.infoLabel}>Ghi chú</Text>
                <Text style={styles.infoValue}>{trip.summary_note}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.infoActions}>
              <TouchableOpacity style={styles.infoActionBtn} onPress={shareItinerary}>
                <Ionicons name="share-outline" size={18} color={colors.nomad.primary} />
                <Text style={styles.infoActionText}>Chia sẻ lịch trình</Text>
              </TouchableOpacity>

              {trip.status === 'completed' && (
                <TouchableOpacity
                  style={styles.infoActionBtn}
                  onPress={() => router.push({ pathname: '/post/create', params: { trip_id: id } })}
                >
                  <Ionicons name="camera-outline" size={18} color={colors.nomad.primary} />
                  <Text style={styles.infoActionText}>Tạo bài viết từ trip này</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.infoActionBtn, { borderColor: colors.error }]} onPress={deleteTrip}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.infoActionText, { color: colors.error }]}>Xoá chuyến đi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {tab === 'timeline' && items.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => openAddExp(selectedDay)} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color={colors.textOnDark} />
        </TouchableOpacity>
      )}

      {/* ── Item Detail Modal ── */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            {selectedItem && (() => {
              const loc       = selectedItem.locations as any;
              const slot      = TIME_SLOTS.find(s => s.value === selectedItem.time_slot);
              const coverImg  = loc?.cover_image ?? selectedItem.experience_image;
              const title     = loc?.name ?? selectedItem.experience_title ?? '—';
              const locLabel  = loc?.district ?? loc?.address ?? selectedItem.experience_location;
              const category  = loc?.category ?? selectedItem.experience_category;
              const shortDesc = loc?.short_description ?? loc?.hint ?? selectedItem.note;
              const longDesc  = loc?.long_description;
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {coverImg ? (
                    <Image source={{ uri: coverImg }} style={styles.detailImg} />
                  ) : (
                    <View style={styles.detailImgPlaceholder}>
                      <Ionicons name="image-outline" size={40} color={colors.border} />
                    </View>
                  )}
                  <View style={styles.detailBody}>
                    {category && (
                      <View style={styles.detailCatBadge}>
                        <Text style={styles.detailCatText}>{CATEGORY_LABEL[category] ?? category}</Text>
                      </View>
                    )}
                    <Text style={styles.detailTitle}>{title}</Text>
                    {locLabel && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                        <Text style={styles.detailRowText}>{locLabel}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                      <Text style={styles.detailRowText}>
                        Ngày {selectedItem.day_number} · {slot?.icon} {slot?.label}
                        {selectedItem.visit_time ? ` · ${selectedItem.visit_time.slice(0, 5)}` : ''}
                      </Text>
                    </View>
                    {!!(loc?.rating || loc?.duration_minutes || loc?.price_per_person) && (
                      <View style={[styles.detailRow, { flexWrap: 'wrap', gap: 12 }]}>
                        {!!loc?.rating && <Text style={styles.detailMeta}>⭐ {loc.rating}</Text>}
                        {!!loc?.duration_minutes && <Text style={styles.detailMeta}>⏱ {loc.duration_minutes >= 60 ? `${Math.floor(loc.duration_minutes / 60)}h` : `${loc.duration_minutes}p`}</Text>}
                        {!!loc?.price_per_person && <Text style={styles.detailMeta}>💰 {(loc.price_per_person / 1000).toFixed(0)}k/người</Text>}
                        {!!loc?.opening_hours && <Text style={styles.detailMeta}>🕐 {loc.opening_hours}</Text>}
                      </View>
                    )}
                    {shortDesc && <Text style={styles.detailDesc}>{shortDesc}</Text>}
                    {longDesc && longDesc !== shortDesc && <Text style={[styles.detailDesc, { color: colors.textMuted }]}>{longDesc}</Text>}
                    {selectedItem.note && !shortDesc?.includes(selectedItem.note) && (
                      <View style={styles.detailNoteBox}>
                        <Text style={styles.detailNoteLabel}>Ghi chú</Text>
                        <Text style={styles.detailNoteText}>{selectedItem.note}</Text>
                      </View>
                    )}
                    {selectedItem.ai_reason && (
                      <View style={[styles.detailNoteBox, { borderColor: colors.nomad.primary + '40', backgroundColor: '#e8f0d8' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          <Ionicons name="sparkles" size={12} color={colors.nomad.primary} />
                          <Text style={[styles.detailNoteLabel, { color: colors.nomad.primary }]}>AI chọn vì</Text>
                        </View>
                        <Text style={styles.detailNoteText}>{selectedItem.ai_reason}</Text>
                      </View>
                    )}
                    <View style={styles.detailActions}>
                      <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => { removeItem(selectedItem.id); setSelectedItem(null); }}>
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

      {/* ── Date Modal ── */}
      <Modal visible={showDateModal} animationType="slide" transparent onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '60%' }]}>
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
            <DatePicker value={setupEnd} onChange={setSetupEnd} placeholder="Chọn ngày về" minDate={setupStart ? new Date(setupStart) : undefined} />
            <View style={{ marginTop: spacing.xl }}>
              <Button label="Lưu ngày đi" onPress={saveTripDates} loading={savingDates} disabled={!setupStart} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Trip Modal ── */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '60%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa trip</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.dateSetupLabel}>Tên chuyến đi</Text>
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Tên chuyến đi..."
              placeholderTextColor={colors.textMuted}
            />
            <View style={{ marginTop: spacing.xl }}>
              <Button label="Lưu" onPress={saveEdit} loading={savingEdit} disabled={!editTitle.trim()} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Move to Day Modal ── */}
      <Modal visible={showMoveModal} animationType="slide" transparent onRequestClose={() => setShowMoveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '55%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chuyển sang ngày</Text>
              <TouchableOpacity onPress={() => setShowMoveModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: spacing.md }}>
              Chọn ngày để chuyển {checkedIds.size} địa điểm đã chọn
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {Array.from({ length: maxDays }, (_, i) => i + 1)
                  .filter(d => d !== selectedDay)
                  .map(d => (
                    <TouchableOpacity
                      key={d}
                      style={styles.moveDayChip}
                      onPress={() => bulkMove(d)}
                      disabled={movingItems}
                    >
                      {movingItems
                        ? <ActivityIndicator size="small" color={colors.nomad.primary} />
                        : <Text style={styles.moveDayChipText}>Ngày {d}</Text>
                      }
                    </TouchableOpacity>
                  ))
                }
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bgScreen },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  navbar:       { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
  backBtn:      { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  editNavBtn:   { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  navbarInfo:   { flex: 1, gap: 4 },
  navbarTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  cover:        { width: '100%', resizeMode: 'cover' },
  coverMeta:    { backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  destination:  { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  dates:        { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  tabs:         { flexDirection: 'row', backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.nomad.primary },
  tabText:      { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  tabTextActive: { color: colors.nomad.primary, fontWeight: '600' },

  // Setup card
  setupCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e8f0d8', borderRadius: radius.lg, padding: spacing.md, margin: spacing.md, borderWidth: 1, borderColor: colors.nomad.primary + '40' },
  setupCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  setupCardIcon:  { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  setupCardTitle: { fontSize: 14, fontWeight: '700', color: colors.nomad.primary },
  setupCardSub:   { fontSize: 12, color: colors.nomad.primary + 'aa', marginTop: 2 },
  setupCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extendDaysRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  extendBtn:      { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center' },
  extendBtnText:  { fontSize: 11, color: colors.nomad.primary, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // AI banner
  aiBanner:         { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, margin: spacing.md, borderWidth: 1, borderColor: colors.border },
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
  stepperValue:     { fontSize: 15, fontWeight: '600', color: colors.textPrimary, minWidth: 56, textAlign: 'center' },
  aiLogText:        { fontSize: 12, color: colors.nomad.primary, marginTop: 8 },
  aiBannerBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.nomad.primary, paddingVertical: 10, borderRadius: radius.lg },
  aiBannerBtnText:  { color: colors.textOnDark, fontWeight: '600', fontSize: 13 },

  // Empty
  emptyWrap:      { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  emptyBody:      { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
  aiSuggestBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.nomad.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.xl },
  aiSuggestText:  { color: colors.nomad.primary, fontWeight: '700', fontSize: 14 },
  addInlineBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.nomad.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, marginTop: spacing.md },
  addInlineBtnText: { color: colors.textOnDark, fontWeight: '700', fontSize: 14 },

  // Day selector
  daySelectorBar:            { backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  daySelectorContent:        { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  daySelectorChip:           { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgScreen },
  daySelectorChipActive:     { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  daySelectorDay:            { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  daySelectorDayActive:      { color: colors.nomad.primary },
  daySelectorDate:           { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  daySelectorDateActive:     { color: colors.nomad.primary + 'aa' },
  daySelectorBadge:          { marginTop: 5, backgroundColor: colors.border, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  daySelectorBadgeActive:    { backgroundColor: colors.nomad.primary + '25' },
  daySelectorBadgeText:      { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  daySelectorBadgeTextActive: { color: colors.nomad.primary },

  // Day content
  dayContent:       { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  dayContentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  dayContentTitle:  { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  dayAddBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.nomad.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  dayAddText:       { fontSize: 12, color: colors.nomad.primary, fontWeight: '600' },
  dayEmptyWrap:     { alignItems: 'center', paddingVertical: 48, gap: 10 },
  dayEmptyText:     { fontSize: 14, color: colors.textMuted },
  dayEmptyAddBtn:   { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.nomad.primary },
  dayEmptyAddText:  { fontSize: 14, color: colors.nomad.primary, fontWeight: '600' },


  // Timeline row
  timelineRow:       { flexDirection: 'row', alignItems: 'stretch', marginBottom: 8, paddingHorizontal: 4, paddingVertical: 2 },
  timelineRowActive: { backgroundColor: colors.nomad.primary + '12', borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.nomad.primary + '60' },
  dragHandle:        { width: 28, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 14 },
  checkboxWrap:      { width: 28, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 14 },
  checkbox:          { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard },
  checkboxChecked:   { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  editActionBar:     { flexDirection: 'row', gap: 10, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  editActionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: radius.lg, borderWidth: 1.5 },
  editActionText:    { fontSize: 13, fontWeight: '600' },
  moveDayChip:       { paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8', minWidth: 90, alignItems: 'center' },
  moveDayChipText:   { fontSize: 14, fontWeight: '700', color: colors.nomad.primary },
  timelineTimeCol:   { width: 44, alignItems: 'flex-end', paddingRight: 6, paddingTop: 32 },
  timelineTime:      { fontSize: 11, fontWeight: '700', color: colors.nomad.primary },
  timelineTime2:     { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginRight: 6, marginTop: 2 },
  timelineDotCol:    { width: 16, alignItems: 'center', paddingTop: 11 },
  timelineDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, borderWidth: 2, borderColor: colors.nomad.primary },
  timelineDotFirst:  { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.nomad.primary, borderWidth: 0 },
  timelineLine:      { width: 2, flex: 1, backgroundColor: colors.nomad.primary + '25', marginTop: 4 },
  timelineCard:       { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.nomad.primary + '30', marginLeft: 8, marginBottom: 0, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  timelineCardActive: { borderColor: colors.nomad.primary, borderWidth: 2, backgroundColor: '#f4f8ec', shadowOpacity: 0.14, elevation: 5 },
  cardInner:          { flexDirection: 'row', alignItems: 'stretch' },
  cardThumb:          { width: 80, height: 86, justifyContent: 'flex-end' },
  cardThumbImg:       { borderTopLeftRadius: radius.lg - 1, borderBottomLeftRadius: radius.lg - 1 },
  cardThumbTime:      { paddingHorizontal: 5, paddingVertical: 3 },
  cardThumbTimeText:  { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardBody:           { flex: 1, padding: spacing.sm, justifyContent: 'center' },
  cardLocRow:         { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  cardTitleRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  timelineTitle:      { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 19 },
  timelineCardLoc:    { fontSize: 11, color: colors.textMuted },
  timelineCardDesc:   { fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 16 },
  timelineTags:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tagChip:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.bgScreen, borderWidth: 1, borderColor: colors.border },
  tagChipText:        { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  aiItemBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, backgroundColor: '#e8f0d8' },
  aiItemBadgeText:    { fontSize: 10, color: colors.nomad.primary, fontWeight: '700' },


  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },

  // Journal
  journalCard:      { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  journalHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  journalDay:       { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  journalContent:   { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  journalForm:      { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  formLabel:        { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  dayBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f0d8', alignItems: 'center', justifyContent: 'center' },
  dayBtnActive:     { backgroundColor: colors.nomad.primary },
  dayBtnText:       { fontSize: 13, fontWeight: '500', color: colors.nomad.primary },
  dayBtnTextActive: { color: colors.textOnDark },
  moodLabel:        { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8, marginTop: spacing.sm },
  moodRow:          { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  moodBtn:          { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen },
  moodBtnActive:    { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  moodIcon:         { fontSize: 20, marginBottom: 2 },
  moodBtnLabel:     { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  moodBtnLabelActive: { color: colors.nomad.primary, fontWeight: '700' },
  journalInput:     { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, minHeight: 100, marginBottom: spacing.md },

  // Info
  infoSectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  statusRow:        { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  statusBtn:        { flex: 1, flexDirection: 'column', alignItems: 'center', paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgScreen, gap: 4 },
  statusBtnActive:  { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  statusBtnText:    { fontSize: 10, color: colors.textMuted, fontWeight: '500', textAlign: 'center' },
  statusBtnTextActive: { color: colors.nomad.primary, fontWeight: '700' },
  infoRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:        { fontSize: 13, color: colors.textMuted },
  infoValue:        { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', maxWidth: '60%' },
  infoActions:      { marginTop: spacing.xl, gap: 10 },
  infoActionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  infoActionText:   { fontSize: 14, color: colors.nomad.primary, fontWeight: '600' },

  // Detail modal
  detailImg:             { width: '100%', height: 200, borderRadius: radius.lg, resizeMode: 'cover', marginBottom: spacing.md },
  detailImgPlaceholder:  { width: '100%', height: 140, borderRadius: radius.lg, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  detailBody:            { paddingBottom: spacing.lg },
  detailCatBadge:        { alignSelf: 'flex-start', backgroundColor: '#e8f0d8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, marginBottom: 8 },
  detailCatText:         { fontSize: 11, fontWeight: '600', color: colors.nomad.primary },
  detailTitle:           { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  detailRow:             { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailRowText:         { fontSize: 13, color: colors.textMuted },
  detailMeta:            { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  detailDesc:            { fontSize: 14, color: colors.textPrimary, lineHeight: 21, marginTop: spacing.sm },
  detailNoteBox:         { backgroundColor: colors.bgScreen, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border },
  detailNoteLabel:       { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
  detailNoteText:        { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  detailActions:         { flexDirection: 'row', gap: 10, marginTop: spacing.xl },
  detailDeleteBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.error, paddingVertical: 12, borderRadius: radius.lg },
  detailDeleteText:      { fontSize: 13, fontWeight: '600', color: colors.error },
  detailCloseBtn:        { flex: 1, backgroundColor: colors.nomad.primary, paddingVertical: 12, borderRadius: radius.lg, alignItems: 'center' },
  detailCloseBtnText:    { fontSize: 13, fontWeight: '600', color: colors.textOnDark },

  // Date modal
  dateSetupLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: spacing.sm },

  // Edit trip
  editInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgScreen },

  // Modal base
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, maxHeight: '85%' },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: colors.textPrimary },

  // Error
  errorBox:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText:  { flex: 1, color: colors.error, fontSize: 12 },

});
