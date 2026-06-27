import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Image, ActivityIndicator, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { DatePicker } from '@/src/components/ui/DatePicker';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import type { Trip } from '@/src/types';

const STATUS_LABEL: Record<string, string> = {
  planning:  'Lên kế hoạch',
  active:    'Đang đi',
  completed: 'Hoàn thành',
};
const STATUS_COLOR: Record<string, 'warning' | 'forest' | 'neutral'> = {
  planning:  'warning',
  active:    'forest',
  completed: 'neutral',
};

function stripDiacritics(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D');
}

const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cần Thơ',
  'Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp',
  'Gia Lai','Hà Giang','Hà Nam','Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng',
  'Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu',
  'Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình',
  'Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh',
  'Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa',
  'Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh','Tuyên Quang',
  'Vĩnh Long','Vĩnh Phúc','Yên Bái',
];
const VIBES           = ['Bình yên', 'Cổ kính', 'Hoang sơ', 'Ẩm thực', 'Mạo hiểm', 'Văn hóa'];
const TRAVELING_WITH: { label: string; value: string }[] = [
  { label: 'Solo', value: 'solo' },
  { label: 'Cặp đôi', value: 'couple' },
  { label: 'Gia đình', value: 'family' },
  { label: 'Nhóm bạn', value: 'friends' },
];
const ACCOMMODATIONS  = ['Homestay', 'Khách sạn', 'Camping'];
const TRANSPORTS      = ['Xe máy', 'Thuê ô tô', 'Xe khách'];
const ACTIVITY_LEVELS = ['Thư giãn', 'Vừa phải', 'Năng động'];
const BUDGETS: { label: string; sublabel: string; value: number }[] = [
  { label: '< 300k/ngày',     sublabel: 'Tiết kiệm',     value: 300000 },
  { label: '300k–700k/ngày',  sublabel: 'Trung bình',    value: 500000 },
  { label: '700k–1.5M/ngày',  sublabel: 'Thoải mái',     value: 1000000 },
  { label: '1.5M+/ngày',      sublabel: 'Cao cấp',       value: 2000000 },
];

const PICKER_CONFIG: Record<string, { title: string; options: { label: string; value: string }[] }> = {
  travelingWith: { title: 'Đi cùng ai?',              options: TRAVELING_WITH },
  accommodation: { title: 'Loại hình lưu trú',        options: ACCOMMODATIONS.map((a) => ({ label: a, value: a })) },
  transport:     { title: 'Phương tiện di chuyển',    options: TRANSPORTS.map((t) => ({ label: t, value: t })) },
  activityLevel: { title: 'Mức độ hoạt động',         options: ACTIVITY_LEVELS.map((l) => ({ label: l, value: l })) },
  budget:        { title: 'Ngân sách / người / ngày', options: BUDGETS.map((b) => ({ label: `${b.sublabel} — ${b.label}`, value: String(b.value) })) },
};

type Step = 1 | 2 | '3a' | '3b';

function tripCoverUrl(trip: Trip) {
  return trip.cover_image ?? `https://picsum.photos/seed/trip-${trip.id}/400/200`;
}

export default function WorkspaceScreen() {
  const user = useAuthStore((s) => s.user);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');

  // Step 3b fields (manual)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 3a fields (AI)
  const [vibes, setVibes] = useState<string[]>([]);
  const [travelingWith, setTravelingWith] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [hasChildren, setHasChildren] = useState(false);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<number | null>(null);
  const [accommodation, setAccommodation] = useState('');
  const [transport, setTransport] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  // Field picker
  const [pickerField, setPickerField] = useState<string | null>(null);

  useEffect(() => { fetchTrips(); }, [user]);

  async function fetchTrips() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (!error) setTrips(data ?? []);
    setLoading(false);
  }

  function openModal() {
    resetForm();
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  function resetForm() {
    setStep(1);
    setTitle('');
    setDestination('');
    setProvinceSearch('');
    setStartDate('');
    setEndDate('');
    setVibes([]);
    setTravelingWith('');
    setGroupSize(2);
    setHasChildren(false);
    setDays(3);
    setBudget(null);
    setAccommodation('');
    setTransport('');
    setActivityLevel('');
    setError('');
    setAiLogs([]);
    setCreating(false);
    setPickerField(null);
  }

  function handlePickerSelect(value: string) {
    if (pickerField === 'travelingWith') setTravelingWith(value);
    else if (pickerField === 'accommodation') setAccommodation(value);
    else if (pickerField === 'transport') setTransport(value);
    else if (pickerField === 'activityLevel') setActivityLevel(value);
    else if (pickerField === 'budget') setBudget(parseInt(value, 10));
    setPickerField(null);
  }

  function getPickerValue(): string {
    if (pickerField === 'travelingWith') return travelingWith;
    if (pickerField === 'accommodation') return accommodation;
    if (pickerField === 'transport') return transport;
    if (pickerField === 'activityLevel') return activityLevel;
    if (pickerField === 'budget') return budget ? String(budget) : '';
    return '';
  }

  function formatVND(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M đ`;
    return `${(amount / 1_000).toFixed(0)}k đ`;
  }

  function labelForField(field: string): string {
    if (field === 'travelingWith') return TRAVELING_WITH.find((x) => x.value === travelingWith)?.label ?? '';
    if (field === 'accommodation') return accommodation;
    if (field === 'transport') return transport;
    if (field === 'activityLevel') return activityLevel;
    if (field === 'budget') return BUDGETS.find((b) => b.value === budget)?.label ?? '';
    return '';
  }

  function confirmDeleteTrip(trip: Trip) {
    Alert.alert(
      'Xóa chuyến đi',
      `Xóa "${trip.title}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('trips').delete().eq('id', trip.id);
            if (!error) setTrips((prev) => prev.filter((t) => t.id !== trip.id));
          },
        },
      ],
    );
  }

  function goStep2() {
    if (!title.trim()) { setError('Vui lòng nhập tên chuyến đi'); return; }
    if (!destination) { setError('Vui lòng chọn điểm đến'); return; }
    setError('');
    setStep(2);
  }

  function toggleVibe(v: string) {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  async function createManual() {
    if (creating || !user) return;
    setCreating(true);
    setError('');
    let created = false;
    let tripId = '';
    try {
      const { data, error: err } = await supabase.from('trips').insert({
        user_id:          user.id,
        title:            title.trim(),
        destination:      destination,
        start_date:       startDate || null,
        end_date:         endDate || null,
        status:           'planning',
        summary_note:     null,
        cover_image:      null,
        is_ai_generated:  false,
      }).select().single();

      if (err) { setError('Không thể tạo trip: ' + err.message); return; }
      setTrips((prev) => [data, ...prev]);
      tripId = data.id;
      created = true;
    } catch (err: any) {
      setError('Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
    if (created) { closeModal(); router.push(`/trip/${tripId}`); }
  }

  async function createWithAI() {
    if (creating) return;
    if (!vibes.length) { setError('Chọn ít nhất 1 phong cách'); return; }
    if (!budget) { setError('Chọn ngân sách dự kiến'); return; }

    setCreating(true);
    setAiLogs([]);
    setError('');

    const log = (msg: string) => setAiLogs((prev) => [...prev, msg]);
    let tripId = '';
    let success = false;

    try {
      if (!user) { setError('Phiên đăng nhập hết hạn'); return; }

      // 1. Create trip record
      log('Đang tạo chuyến đi...');
      const summaryParts = [
        hasChildren   ? 'Có trẻ em / người lớn tuổi' : null,
        accommodation ? `Lưu trú: ${accommodation}` : null,
        transport     ? `Di chuyển: ${transport}` : null,
        activityLevel ? `Mức độ: ${activityLevel}` : null,
      ].filter(Boolean);

      const { data: trip, error: tripErr } = await supabase.from('trips').insert({
        user_id:          user.id,
        title:            title.trim(),
        destination:      destination,
        start_date:       null,
        end_date:         null,
        status:           'planning',
        summary_note:     summaryParts.length ? summaryParts.join(' · ') : null,
        cover_image:      null,
        is_ai_generated:  true,
      }).select().single();

      if (tripErr) { log(`✗ ${tripErr.message}`); setError('Không thể tạo trip.'); return; }
      tripId = trip.id;
      log(`✓ Đã tạo trip "${title.trim()}"`);

      // 2. Call plan-trip Edge Function
      log(`Đang gửi yêu cầu tới AI (${days} ngày, ${vibes.join(', ')})...`);
      const { data: plan, error: fnErr } = await supabase.functions.invoke('plan-trip', {
        body: {
          destination,
          days,
          budget_per_person: budget,
          group_size: groupSize,
          vibes,
          accommodation:    accommodation    || undefined,
          transport:        transport        || undefined,
          activity_level:   activityLevel    || undefined,
          traveling_with:   travelingWith    || undefined,
        },
      });

      if (fnErr || !plan?.days) {
        let detail = fnErr?.message ?? plan?.error ?? JSON.stringify(plan);
        if (fnErr?.context) {
          try { const b = await (fnErr.context as Response).json(); detail = [b?.error, b?.detail].filter(Boolean).join(' — ') || JSON.stringify(b); } catch {}
        }
        log(`✗ ${detail}`);
        setError('AI không thể tạo lịch trình. Xem log bên dưới.');
        return;
      }

      const totalSlots = (plan.days as { slots: unknown[] }[]).reduce((n, d) => n + d.slots.length, 0);
      log(`✓ AI đã lên ${plan.days.length} ngày với ${totalSlots} địa điểm`);

      // 3. Insert trip_items
      log('Đang lưu lịch trình...');
      const slotMap: Record<string, 'morning' | 'afternoon' | 'evening'> = {
        'sáng': 'morning', 'chiều': 'afternoon', 'tối': 'evening',
      };
      const items = (plan.days as { day: number; slots: { location_id: string; time_slot: string; hint: string | null; reason: string | null }[] }[])
        .flatMap((d) =>
          d.slots.map((s, i) => ({
            trip_id:     trip.id,
            location_id: s.location_id,
            day_number:  d.day,
            time_slot:   slotMap[s.time_slot] ?? 'morning',
            note:        s.hint ?? null,
            ai_reason:   s.reason ?? null,
            sort_order:  i,
          }))
        );

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from('trip_items').insert(items);
        if (itemsErr) { log(`✗ Lỗi lưu địa điểm: ${itemsErr.message}`); setError('Lưu lịch trình thất bại.'); return; }
        log(`✓ Đã lưu ${items.length} địa điểm vào lịch trình`);
      } else {
        log('⚠ AI không gợi ý được địa điểm nào');
      }

      log('Hoàn thành! Đang mở trip...');
      setTrips((prev) => [trip, ...prev]);
      success = true;
    } catch (err: any) {
      const msg = err?.message ?? 'Lỗi không xác định';
      log(`✗ ${msg}`);
      setError('Lỗi kết nối mạng. Kiểm tra internet và thử lại.');
    } finally {
      setCreating(false);
    }
    if (success) { closeModal(); router.push(`/trip/${tripId}`); }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.nomad.primary} />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Trip Workspace</Text>
          <Text style={styles.subheading}>{trips.length} chuyến đi của bạn</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.aiBtn} onPress={openModal}>
            <Ionicons name="sparkles-outline" size={16} color={colors.nomad.primary} />
            <Text style={styles.aiText}>AI Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Ionicons name="add" size={20} color={colors.textOnDark} />
            <Text style={styles.addText}>Trip mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {trips.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="Chưa có chuyến đi nào"
          body="Tạo trip đầu tiên để bắt đầu lên kế hoạch hành trình của bạn"
          ctaLabel="Tạo Trip đầu tiên"
          onCta={openModal}
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/trip/${item.id}`)}
              onLongPress={() => confirmDeleteTrip(item)}
              delayLongPress={500}
            >
              <View style={styles.tripImageWrap}>
                <Image source={{ uri: tripCoverUrl(item) }} style={styles.tripImage} />
                <View style={styles.tripOverlay} />
                <View style={styles.tripBadge}>
                  <Badge label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} />
                </View>
                {item.is_ai_generated && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={11} color="#fff" />
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                )}
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.tripDest}>📍 {item.destination}</Text>
                {item.start_date ? (
                  <Text style={styles.tripDate}>
                    {formatDate(item.start_date)}{item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Province Picker Modal ── */}
      <Modal visible={showProvincePicker} animationType="slide" transparent onRequestClose={() => setShowProvincePicker(false)}>
        <View style={styles.pickerOverlay}>
          <SafeAreaView style={styles.provinceModal}>
            <View style={styles.modalHandle} />
            <View style={styles.provinceHeader}>
              <Text style={styles.modalTitle}>Chọn điểm đến</Text>
              <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.provinceSearchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.provinceSearchInput}
                placeholder="Tìm tỉnh / thành phố..."
                placeholderTextColor={colors.textMuted}
                value={provinceSearch}
                onChangeText={setProvinceSearch}
                autoFocus
              />
              {provinceSearch ? (
                <TouchableOpacity onPress={() => setProvinceSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={PROVINCES.filter((p) => stripDiacritics(p).toLowerCase().includes(stripDiacritics(provinceSearch).toLowerCase()))}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.provinceItem, destination === item && styles.provinceItemActive]}
                  onPress={() => { setDestination(item); setShowProvincePicker(false); }}
                >
                  <Text style={[styles.provinceItemText, destination === item && styles.provinceItemTextActive]}>{item}</Text>
                  {destination === item && <Ionicons name="checkmark" size={16} color={colors.nomad.primary} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Create Trip Wizard — Full Screen ── */}
      <Modal visible={showModal} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.fullModal}>

          {/* ── AI Loading Screen ── */}
          {creating ? (
            <View style={styles.aiLoadingScreen}>
              <View style={styles.aiLoadingIconWrap}>
                <Ionicons name="sparkles" size={36} color={colors.nomad.primary} />
              </View>
              <Text style={styles.aiLoadingTitle}>AI đang lên lịch trình</Text>
              <Text style={styles.aiLoadingSubtitle}>{title} · {destination} · {days} ngày</Text>
              <ActivityIndicator size="large" color={colors.nomad.primary} style={{ marginTop: 32, marginBottom: 32 }} />
              <View style={styles.aiLogList}>
                {aiLogs.map((msg, i) => (
                  <View key={i} style={styles.aiLogItem}>
                    <Ionicons
                      name={msg.startsWith('✓') ? 'checkmark-circle' : msg.startsWith('✗') ? 'close-circle' : 'ellipse-outline'}
                      size={16}
                      color={msg.startsWith('✓') ? colors.nomad.secondary : msg.startsWith('✗') ? colors.error : colors.nomad.primary}
                    />
                    <Text style={[styles.aiLogItemText, msg.startsWith('✗') && { color: colors.error }]}>{msg}</Text>
                  </View>
                ))}
              </View>
              {!!error && (
                <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
                  <Text style={{ color: colors.error, textAlign: 'center', marginBottom: 12 }}>{error}</Text>
                  <TouchableOpacity onPress={() => { setCreating(false); setError(''); setAiLogs([]); }}>
                    <Text style={{ color: colors.nomad.primary, fontWeight: '700', fontSize: 15 }}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                {step !== 1 ? (
                  <TouchableOpacity onPress={() => setStep(step === 2 ? 1 : 2)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : <View style={{ width: 32 }} />}
                <Text style={styles.modalTitle}>
                  {step === 1 ? 'Chuyến đi mới' : step === 2 ? 'Tạo bằng cách nào?' : step === '3a' ? 'Thiết lập AI' : 'Chọn ngày đi'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Step indicator */}
              <View style={styles.stepRow}>
                {[1, 2, 3].map((s) => {
                  const active = s === (step === 1 ? 1 : step === 2 ? 2 : 3);
                  const done = s < (step === 1 ? 1 : step === 2 ? 2 : 3);
                  return (
                    <View key={s} style={styles.stepItem}>
                      <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                        {done
                          ? <Ionicons name="checkmark" size={10} color="#fff" />
                          : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{s}</Text>
                        }
                      </View>
                      {s < 3 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                    </View>
                  );
                })}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* ── STEP 1 ── */}
              {step === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.inputLabel}>Tên chuyến đi *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Hội An cuối tuần"
                    placeholderTextColor={colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                  />

                  <Text style={styles.inputLabel}>Điểm đến *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.destPicker]}
                    onPress={() => { setProvinceSearch(''); setShowProvincePicker(true); }}
                  >
                    <Text style={destination ? styles.destPickerText : styles.destPickerPlaceholder}>
                      {destination || 'Chọn tỉnh / thành phố...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                </View>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.sectionLabel}>Chọn cách tạo lịch trình</Text>

                  {/* AI card */}
                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => { setError(''); setStep('3a'); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons name="sparkles" size={28} color={colors.nomad.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>Tạo bằng AI</Text>
                      <Text style={styles.methodDesc}>AI gợi ý lịch trình theo phong cách và ngân sách của bạn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Manual card */}
                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => { setError(''); setStep('3b'); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons name="pencil-outline" size={28} color={colors.secondary600} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodTitle}>Tạo thủ công</Text>
                      <Text style={styles.methodDesc}>Tự thêm địa điểm và sắp xếp theo ý muốn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 3a — AI params ── */}
              {step === '3a' && (
                <View style={[styles.stepContent, { paddingBottom: spacing.xl }]}>
                  <Text style={styles.inputLabel}>Đi cùng ai?</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectBtn]}
                    onPress={() => setPickerField('travelingWith')}
                  >
                    <Text style={travelingWith ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                      {labelForField('travelingWith') || 'Chọn hình thức đi...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Phong cách chuyến đi</Text>
                  <View style={styles.chipRow}>
                    {VIBES.map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.chip, vibes.includes(v) && styles.chipActive]}
                        onPress={() => toggleVibe(v)}
                      >
                        <Text style={[styles.chipText, vibes.includes(v) && styles.chipTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Số người</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.max(1, groupSize - 1))}>
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{groupSize}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.min(20, groupSize + 1))}>
                      <Ionicons name="add" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.checkRow} onPress={() => setHasChildren(!hasChildren)}>
                    <View style={[styles.checkbox, hasChildren && styles.checkboxChecked]}>
                      {hasChildren && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.checkLabel}>Có trẻ em hoặc người lớn tuổi</Text>
                  </TouchableOpacity>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Số ngày</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.max(1, days - 1))}>
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{days} ngày</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.min(14, days + 1))}>
                      <Ionicons name="add" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Ngân sách tổng chuyến đi</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectBtn]}
                    onPress={() => setPickerField('budget')}
                  >
                    <Text style={budget ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                      {labelForField('budget') || 'Chọn mức ngân sách...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  {budget !== null && (
                    <View style={styles.budgetTotalRow}>
                      <Ionicons name="wallet-outline" size={14} color={colors.nomad.primary} />
                      <Text style={styles.budgetTotalText}>
                        Dự kiến tổng: ~{formatVND(budget * groupSize * days)}
                        {'  '}({groupSize} người × {days} ngày)
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Loại hình lưu trú</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectBtn]}
                    onPress={() => setPickerField('accommodation')}
                  >
                    <Text style={accommodation ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                      {accommodation || 'Chọn loại lưu trú...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Phương tiện di chuyển</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectBtn]}
                    onPress={() => setPickerField('transport')}
                  >
                    <Text style={transport ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                      {transport || 'Chọn phương tiện...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>

                  <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Mức độ hoạt động</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.selectBtn]}
                    onPress={() => setPickerField('activityLevel')}
                  >
                    <Text style={activityLevel ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                      {activityLevel || 'Chọn mức độ...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 3b — Manual ── */}
              {step === '3b' && (
                <View style={[styles.stepContent, { paddingBottom: spacing.xl }]}>
                  <Text style={styles.inputLabel}>Ngày đi (tùy chọn)</Text>
                  <DatePicker value={startDate} onChange={(v) => { setStartDate(v); if (endDate && endDate < v) setEndDate(''); }} placeholder="Chọn ngày khởi hành" />

                  <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Ngày về (tùy chọn)</Text>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="Chọn ngày về" minDate={startDate ? new Date(startDate) : undefined} />

                  <View style={styles.dateHint}>
                    <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.dateHintText}>Ngày đi có thể thêm sau trong trip</Text>
                  </View>
                </View>
              )}
              </ScrollView>

              {/* ── Fixed Bottom Button ── */}
              {step === 1 && (
                <View style={styles.bottomBar}>
                  <Button label="Tiếp theo →" onPress={goStep2} />
                </View>
              )}
              {step === '3a' && (
                <View style={styles.bottomBar}>
                  <Button label="✨ Tạo lịch trình AI" onPress={createWithAI} />
                </View>
              )}
              {step === '3b' && (
                <View style={styles.bottomBar}>
                  <Button label="Tạo Trip" onPress={createManual} loading={creating} />
                </View>
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Field Picker Modal ── */}
      {pickerField && PICKER_CONFIG[pickerField] && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setPickerField(null)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPickerField(null)}>
            <View style={styles.pickerSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.pickerHeader}>
                <Text style={styles.modalTitle}>{PICKER_CONFIG[pickerField].title}</Text>
                <TouchableOpacity onPress={() => setPickerField(null)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {PICKER_CONFIG[pickerField].options.map((opt, i) => {
                const current = getPickerValue();
                const active = current === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pickerItem, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.nomad.outlineVariant }]}
                    onPress={() => handlePickerSelect(opt.value)}
                  >
                    <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{opt.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={colors.nomad.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScreenWrapper>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const N = colors.nomad;

const styles = StyleSheet.create({
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  heading:        { fontSize: 22, fontWeight: '800', color: N.onSurface },
  subheading:     { fontSize: 13, color: N.onSurfaceVariant, marginTop: 2 },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBtn:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: N.primary, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  aiText:         { color: N.primary, fontWeight: '600', fontSize: 14 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: N.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  addText:        { color: N.onPrimary, fontWeight: '600', fontSize: 14 },

  tripCard:       { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: N.surface, elevation: 2 },
  tripImageWrap:  { height: 100, overflow: 'hidden' },
  tripImage:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: 100, resizeMode: 'cover' },
  tripOverlay:    { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,0.2)' },
  tripBadge:      { position: 'absolute', top: 12, right: 12 },
  aiBadge:        { position: 'absolute', bottom: 8, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(69,97,27,0.85)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  aiBadgeText:    { fontSize: 10, color: '#fff', fontWeight: '700' },
  tripInfo:       { paddingHorizontal: spacing.md, paddingVertical: 6 },
  tripTitle:      { fontSize: 14, fontWeight: '700', color: N.onSurface, marginBottom: 1 },
  tripDest:       { fontSize: 11, color: N.onSurfaceVariant },
  tripDate:       { fontSize: 11, color: N.primary, marginTop: 1, fontWeight: '500' },

  // Full-screen Modal
  fullModal:      { flex: 1, backgroundColor: N.surface, paddingHorizontal: spacing.lg },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: N.outlineVariant, alignSelf: 'center', marginTop: 10, marginBottom: spacing.md },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingTop: spacing.md },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: N.onSurface },
  backBtn:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  // Fixed bottom button
  bottomBar:      { paddingHorizontal: 0, paddingVertical: spacing.md, paddingBottom: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: N.outlineVariant },

  // SelectButton (dropdown trigger)
  selectBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectBtnText:  { fontSize: 15, color: N.onSurface, flex: 1 },
  selectBtnPlaceholder: { fontSize: 15, color: N.onSurfaceVariant, flex: 1 },

  // Budget total
  budgetTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
  budgetTotalText:{ fontSize: 13, color: N.primary, fontWeight: '600' },

  // AI Loading Screen
  aiLoadingScreen:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  aiLoadingIconWrap:  { width: 80, height: 80, borderRadius: 40, backgroundColor: N.onPrimaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  aiLoadingTitle:     { fontSize: 22, fontWeight: '800', color: N.onSurface, textAlign: 'center' },
  aiLoadingSubtitle:  { fontSize: 14, color: N.onSurfaceVariant, textAlign: 'center', marginTop: 6 },
  aiLogList:          { width: '100%', gap: 10 },
  aiLogItem:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiLogItemText:      { fontSize: 14, color: N.onSurface, flex: 1, lineHeight: 20 },

  // Field Picker Modal
  pickerOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet:        { backgroundColor: N.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: spacing.lg, paddingBottom: 40 },
  pickerHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.md },
  pickerItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  pickerItemText:     { fontSize: 15, color: N.onSurface },
  pickerItemTextActive: { color: N.primary, fontWeight: '700' },

  // Step indicator
  stepRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: N.background },
  stepDotActive:  { borderColor: N.primary, backgroundColor: N.primary },
  stepDotDone:    { borderColor: N.secondary, backgroundColor: N.secondary },
  stepNum:        { fontSize: 11, fontWeight: '700', color: N.onSurfaceVariant },
  stepLine:       { width: 40, height: 1.5, backgroundColor: N.outlineVariant, marginHorizontal: 4 },
  stepLineDone:   { backgroundColor: N.secondary },

  stepContent:    { paddingTop: spacing.sm },
  sectionLabel:   { fontSize: 15, fontWeight: '700', color: N.onSurface, marginBottom: spacing.md },

  // Error
  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:      { flex: 1, color: colors.error, fontSize: 13 },

  // Inputs
  inputLabel:     { fontSize: 13, fontWeight: '600', color: N.onSurfaceVariant, marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: N.onSurface, backgroundColor: N.background },

  // Chips
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainer },
  chipActive:     { borderColor: N.primary, backgroundColor: N.onPrimaryContainer },
  chipText:       { fontSize: 13, color: N.onSurfaceVariant, fontWeight: '500' },
  chipTextActive: { color: N.primary, fontWeight: '700' },

  // Method cards
  methodCard:         { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.background, marginBottom: 12 },
  methodCardDisabled: { opacity: 0.55 },
  methodIcon:         { width: 52, height: 52, borderRadius: radius.md, backgroundColor: N.onPrimaryContainer, alignItems: 'center', justifyContent: 'center' },
  methodTitle:        { fontSize: 16, fontWeight: '700', color: N.onSurface, marginBottom: 2 },
  methodTitleDisabled:{ color: N.onSurfaceVariant },
  methodDesc:         { fontSize: 12, color: N.onSurfaceVariant, lineHeight: 17 },
  freeBadge:          { backgroundColor: N.secondaryContainer, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  freeBadgeText:      { fontSize: 10, color: N.secondary, fontWeight: '700' },
  usedBadge:          { backgroundColor: N.surfaceContainer, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  usedBadgeText:      { fontSize: 10, color: N.onSurfaceVariant, fontWeight: '700' },

  // Stepper
  stepper:        { flexDirection: 'row', alignItems: 'center', gap: 0, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, overflow: 'hidden', alignSelf: 'flex-start' },
  stepperBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: N.background },
  stepperVal:     { paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: N.onSurface },

  // Checkbox
  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:{ backgroundColor: N.primary, borderColor: N.primary },
  checkLabel:     { fontSize: 14, color: N.onSurface },

  // Destination picker
  destPicker:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  destPickerText:        { fontSize: 15, color: N.onSurface, flex: 1 },
  destPickerPlaceholder: { fontSize: 15, color: N.onSurfaceVariant, flex: 1 },
  provinceModal:         { backgroundColor: N.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  provinceHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  provinceSearchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: N.background },
  provinceSearchInput:   { flex: 1, fontSize: 14, color: N.onSurface },
  provinceItem:          { paddingHorizontal: spacing.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  provinceItemActive:    { backgroundColor: N.onPrimaryContainer },
  provinceItemText:      { fontSize: 15, color: N.onSurface },
  provinceItemTextActive:{ color: N.primary, fontWeight: '700' },

  // Date hint
  dateHint:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dateHintText:   { fontSize: 12, color: N.onSurfaceVariant },
});
