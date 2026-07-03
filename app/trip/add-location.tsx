import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ImageBackground, ActivityIndicator, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { consumePendingTripLocation } from '@/store/tripPick';
import supabase from '@/src/lib/supabase';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { Location, TimeSlot } from '@/src/types';

const TIMES = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00',
];

type SlimItem = { day_number: number; visit_time: string | null; location_id: string | null; sort_order: number };

function cityLabel(code: string | null) {
  if (code === 'SG') return 'TP. HCM';
  if (code === 'HN') return 'Hà Nội';
  if (code === 'DN') return 'Đà Nẵng';
  return code ?? '';
}

export default function AddLocationScreen() {
  const insets = useSafeAreaInsets();
  const { trip_id, day: dayParam } = useLocalSearchParams<{ trip_id: string; day: string }>();

  const [location, setLocation]     = useState<Location | null>(null);
  const [tripItems, setTripItems]   = useState<SlimItem[]>([]);
  const [maxDays, setMaxDays]       = useState(1);
  const [selectedDay, setSelectedDay] = useState(parseInt(dayParam ?? '1'));
  const [selectedTime, setSelectedTime] = useState('');
  const [adding, setAdding]         = useState(false);
  const [error, setError]           = useState('');
  const [warnModal, setWarnModal]   = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const picked = consumePendingTripLocation();
    if (picked) setLocation(picked);

    if (!trip_id) return;
    Promise.all([
      supabase.from('trips').select('start_date, end_date').eq('id', trip_id).single(),
      supabase.from('trip_items').select('day_number, visit_time, location_id, sort_order').eq('trip_id', trip_id),
    ]).then(([t, i]) => {
      const items = (i.data ?? []) as SlimItem[];
      setTripItems(items);
      if (t.data?.start_date && t.data?.end_date) {
        const diff = Math.ceil(
          (new Date(t.data.end_date).getTime() - new Date(t.data.start_date).getTime()) / 86400000
        ) + 1;
        const fromItems = items.length > 0 ? Math.max(...items.map(x => x.day_number)) : 0;
        setMaxDays(Math.max(diff, fromItems, 1));
      } else {
        const fromItems = items.length > 0 ? Math.max(...items.map(x => x.day_number)) : 1;
        setMaxDays(Math.max(fromItems, 1));
      }
    });
  }, [trip_id]);

  async function doAdd() {
    if (!location || !trip_id || !selectedTime) return;
    setAdding(true);
    setError('');
    const hour = parseInt(selectedTime.split(':')[0]);
    const timeSlot: TimeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const maxOrder = tripItems.filter(i => i.day_number === selectedDay).length;

    const { error: err } = await supabase.from('trip_items').insert({
      trip_id,
      location_id: location.id,
      day_number:  selectedDay,
      time_slot:   timeSlot,
      visit_time:  selectedTime,
      note:        null,
      sort_order:  maxOrder,
    });
    setAdding(false);
    if (err) { setError('Không thể thêm: ' + err.message); return; }
    router.dismiss(2); // quay về trip page (bỏ qua search)
  }

  function handleAdd() {
    if (!location || !selectedTime) return;

    const sameDay = tripItems.find(
      i => i.location_id === location.id && i.day_number === selectedDay
    );
    if (sameDay) {
      setError(`"${location.name}" đã có trong lịch trình Ngày ${selectedDay}.`);
      return;
    }

    const otherDay = tripItems.find(
      i => i.location_id === location.id && i.day_number !== selectedDay
    );
    if (otherDay) {
      setWarnModal({
        message: `"${location.name}" đã có trong lịch trình Ngày ${otherDay.day_number}.\n\nVẫn muốn thêm vào Ngày ${selectedDay}?`,
        onConfirm: doAdd,
      });
      return;
    }

    doAdd();
  }

  if (!location) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.nomad.primary} />
      </View>
    );
  }

  const photo    = location.photos?.split(',')[0]?.trim() ?? location.cover_image;
  const subtitle = [location.district, cityLabel(location.city)].filter(Boolean).join(', ');
  const cat      = location.category?.split(',')[0]?.trim();

  const openStr  = location.opening_hours?.slice(0, 5) ?? null;
  const closeStr = location.closing_hours?.slice(0, 5) ?? null;
  const availableTimes = TIMES.filter(t =>
    (!openStr || t >= openStr) && (!closeStr || t <= closeStr)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm vào lịch trình</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Location card */}
        <ImageBackground
          source={{ uri: photo ?? `https://picsum.photos/seed/loc-${location.id}/800/300` }}
          style={styles.locCard}
          resizeMode="cover"
          imageStyle={{ borderRadius: 20 }}
        >
          {!photo && (
            <LinearGradient
              colors={[colors.nomad.primaryContainer, colors.nomad.primary]}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.82)']}
            locations={[0.15, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {cat && (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{cat}</Text>
            </View>
          )}
          <View style={styles.locCardInfo}>
            <Text style={styles.locName} numberOfLines={2}>{location.name}</Text>
            {subtitle ? (
              <View style={styles.locSubRow}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locSub}>{subtitle}</Text>
              </View>
            ) : null}
          </View>
        </ImageBackground>

        {/* Day selector */}
        <Text style={styles.sectionLabel}>Chọn ngày</Text>
        <View style={styles.chipWrap}>
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
              onPress={() => { setSelectedDay(d); setSelectedTime(''); setError(''); }}
            >
              <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                Ngày {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time scroll */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>
            Giờ tham quan{'  '}<Text style={{ color: colors.error }}>*</Text>
          </Text>
          {(openStr || closeStr) && (
            <Text style={styles.hoursHint}>
              {openStr ?? '?'} – {closeStr ?? '?'}
            </Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
          {availableTimes.map((t) => {
            const isTaken    = tripItems.some(i => i.day_number === selectedDay && i.visit_time?.slice(0, 5) === t);
            const isSelected = selectedTime === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, isSelected && styles.timeChipActive, isTaken && styles.timeChipTaken]}
                onPress={() => { if (!isTaken) { setSelectedTime(isSelected ? '' : t); setError(''); } }}
                disabled={isTaken}
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive, isTaken && styles.timeChipTakenText]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Confirm button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedTime || adding) && { opacity: 0.45 }]}
          onPress={handleAdd}
          disabled={!selectedTime || adding}
          activeOpacity={0.85}
        >
          {adding
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="add-circle-outline" size={20} color="#fff" />}
          <Text style={styles.confirmBtnText}>Thêm vào Ngày {selectedDay}</Text>
        </TouchableOpacity>
      </View>

      {/* Warn modal — trùng địa điểm ngày khác */}
      <Modal visible={!!warnModal} animationType="fade" transparent onRequestClose={() => setWarnModal(null)}>
        <View style={styles.warnOverlay}>
          <View style={styles.warnBox}>
            <View style={styles.warnIconWrap}>
              <Ionicons name="warning" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.warnTitle}>Địa điểm trùng lặp</Text>
            <Text style={styles.warnMessage}>{warnModal?.message}</Text>
            <View style={styles.warnActions}>
              <TouchableOpacity style={styles.warnCancelBtn} onPress={() => setWarnModal(null)}>
                <Text style={styles.warnCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.warnConfirmBtn}
                onPress={() => { setWarnModal(null); warnModal?.onConfirm(); }}
              >
                <Text style={styles.warnConfirmText}>Vẫn thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const N = colors.nomad;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: N.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: N.background },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 12, gap: 8 },
  backBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: N.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: N.onSurface, textAlign: 'center' },

  body: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.lg },

  locCard:     { height: 220, borderRadius: 20, overflow: 'hidden', backgroundColor: N.surfaceContainer, justifyContent: 'flex-end' },
  catBadge:    { position: 'absolute', top: 16, left: 16, backgroundColor: N.primary, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  catBadgeText:{ fontSize: 11, fontWeight: '700', color: '#fff' },
  locCardInfo: { padding: spacing.md },
  locName:     { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  locSubRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locSub:      { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: N.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  hoursHint:       { fontSize: 12, color: N.onSurfaceVariant },

  chipWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeScroll: { flexDirection: 'row', gap: 8, paddingVertical: 2 },

  dayChip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainer },
  dayChipActive:  { backgroundColor: N.primary, borderColor: N.primary },
  dayChipText:    { fontSize: 13, fontWeight: '600', color: N.onSurfaceVariant },
  dayChipTextActive: { color: '#fff' },

  timeChip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow },
  timeChipActive:    { backgroundColor: N.primary, borderColor: N.primary },
  timeChipTaken:     { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', opacity: 0.6 },
  timeChipText:      { fontSize: 13, fontWeight: '500', color: N.onSurfaceVariant },
  timeChipTextActive:{ color: '#fff', fontWeight: '700' },
  timeChipTakenText: { color: colors.error },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { flex: 1, color: colors.error, fontSize: 13 },

  footer:     { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: N.outlineVariant, backgroundColor: N.background },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: N.primary, paddingVertical: 15, borderRadius: radius.xl },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  warnOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  warnBox:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12 },
  warnIconWrap:   { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  warnTitle:      { fontSize: 17, fontWeight: '800', color: N.onSurface, marginBottom: 8, textAlign: 'center' },
  warnMessage:    { fontSize: 14, color: N.onSurfaceVariant, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  warnActions:    { flexDirection: 'row', gap: 10, width: '100%' },
  warnCancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center' },
  warnCancelText: { fontSize: 14, fontWeight: '600', color: N.onSurfaceVariant },
  warnConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.lg, backgroundColor: '#F59E0B', alignItems: 'center' },
  warnConfirmText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
});
