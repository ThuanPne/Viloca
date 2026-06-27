import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, ScrollView, SafeAreaView, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DatePicker } from '@/src/components/ui/DatePicker';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const VIBES = ['Bình yên', 'Cổ kính', 'Hoang sơ', 'Ẩm thực', 'Mạo hiểm', 'Văn hóa'];

const TRAVELING_WITH: { label: string; value: string }[] = [
  { label: 'Solo', value: 'solo' },
  { label: 'Cặp đôi', value: 'couple' },
  { label: 'Gia đình', value: 'family' },
  { label: 'Nhóm bạn', value: 'friends' },
];

const ACCOMMODATIONS = ['Homestay', 'Khách sạn', 'Camping'];
const TRANSPORTS     = ['Xe máy', 'Thuê ô tô', 'Xe khách'];
const ACTIVITY_LEVELS = ['Thư giãn', 'Vừa phải', 'Năng động'];

const BUDGETS: { label: string; sublabel: string; value: number }[] = [
  { label: '< 300k/ngày',    sublabel: 'Tiết kiệm',  value: 300000 },
  { label: '300k–700k/ngày', sublabel: 'Trung bình', value: 500000 },
  { label: '700k–1.5M/ngày', sublabel: 'Thoải mái',  value: 1000000 },
  { label: '1.5M+/ngày',     sublabel: 'Cao cấp',    value: 2000000 },
];

// City → representative cover image seed (picsum)
const CITY_COVER_SEEDS: Record<string, string> = {
  'Hà Nội':         'hanoi-city',
  'TP. Hồ Chí Minh':'saigon-city',
  'Đà Nẵng':        'danang-beach',
  'Hội An':         'hoian-lanterns',
  'Quảng Nam':      'quangnam-ancient',
  'Nha Trang':      'nhatrang-sea',
  'Khánh Hòa':      'khanhhoa-coast',
  'Đà Lạt':         'dalat-flower',
  'Lâm Đồng':       'lamdong-pine',
  'Huế':            'hue-imperial',
  'Thừa Thiên Huế': 'hue-citadel',
  'Hạ Long':        'halong-bay',
  'Quảng Ninh':     'quangninh-bay',
  'Sapa':           'sapa-terraces',
  'Lào Cai':        'laocai-mountain',
  'Hà Giang':       'hagiang-plateau',
  'Ninh Bình':      'ninhbinh-caves',
  'Phú Quốc':       'phuquoc-island',
  'Kiên Giang':     'kiengiang-sea',
  'Cần Thơ':        'cantho-river',
  'Hải Phòng':      'haiphong-port',
  'Mũi Né':         'muine-dunes',
  'Bình Thuận':     'binhthuan-sand',
  'Phú Yên':        'phuyen-yellow',
  'Quy Nhơn':       'quinhon-coast',
  'Bình Định':      'binhdinh-sea',
};

function getCoverImage(destination: string): string {
  const seed = CITY_COVER_SEEDS[destination] ?? `vn-${destination.toLowerCase().replace(/\s+/g, '-')}`;
  return `https://picsum.photos/seed/${seed}/800/400`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripDiacritics(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D');
}

function formatVND(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M đ`;
  return `${(amount / 1_000).toFixed(0)}k đ`;
}

type Step = 1 | 2 | '3a' | '3b';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateTripScreen() {
  const [step, setStep]                 = useState<Step>(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [aiLogs, setAiLogs]             = useState<{ msg: string; type: 'info' | 'ok' | 'err' | 'warn' }[]>([]);
  const [error, setError]               = useState('');
  const [cancelled, setCancelled]       = useState(false);
  const abortRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1
  const [title, setTitle]                       = useState('');
  const [destination, setDestination]           = useState('');
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [provinceSearch, setProvinceSearch]     = useState('');

  // Step 3b
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  // Step 3a
  const [travelingWith, setTravelingWith]   = useState('');
  const [vibes, setVibes]                   = useState<string[]>([]);
  const [groupSize, setGroupSize]           = useState(2);
  const [hasChildren, setHasChildren]       = useState(false);
  const [days, setDays]                     = useState(3);
  const [budget, setBudget]                 = useState<number | null>(null);
  const [accommodation, setAccommodation]   = useState('');
  const [transport, setTransport]           = useState('');
  const [activityLevel, setActivityLevel]   = useState('');
  const [openDropdown, setOpenDropdown]     = useState<string | null>(null);

  function goBack() {
    if (step === 1) router.back();
    else if (step === 2) setStep(1);
    else setStep(2);
    setError('');
  }

  function goStep2() {
    if (!title.trim()) { setError('Vui lòng nhập tên chuyến đi'); return; }
    if (!destination)  { setError('Vui lòng chọn điểm đến'); return; }
    setError('');
    setStep(2);
  }

  function toggleVibe(v: string) {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function toggleDropdown(field: string) {
    setOpenDropdown(prev => prev === field ? null : field);
  }

  async function createManual() {
    if (saving) return;
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Phiên đăng nhập hết hạn'); setSaving(false); return; }

    const { data, error: err } = await supabase.from('trips').insert({
      user_id: session.user.id, title: title.trim(), destination,
      start_date: startDate || null, end_date: endDate || null,
      cover_image: getCoverImage(destination),
      status: 'planning', summary_note: null, is_ai_generated: false,
    }).select().single();

    setSaving(false);
    if (err) { setError('Không thể tạo trip: ' + err.message); return; }
    router.replace(`/trip/${data.id}`);
  }

  async function createWithAI() {
    if (!vibes.length) { setError('Chọn ít nhất 1 phong cách'); return; }
    if (!budget)       { setError('Chọn ngân sách dự kiến'); return; }

    setAiGenerating(true);
    setCancelled(false);
    setAiLogs([]);
    setError('');

    const log = (msg: string, type: 'info' | 'ok' | 'err' | 'warn' = 'info') =>
      setAiLogs(prev => [...prev, { msg, type }]);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Phiên đăng nhập hết hạn'); setAiGenerating(false); return; }

    log('Đang tạo chuyến đi...');
    const summaryParts = [
      travelingWith ? `Đi cùng: ${TRAVELING_WITH.find(x => x.value === travelingWith)?.label}` : null,
      hasChildren   ? 'Có trẻ em / người lớn tuổi' : null,
      accommodation ? `Lưu trú: ${accommodation}` : null,
      transport     ? `Di chuyển: ${transport}` : null,
      activityLevel ? `Mức độ: ${activityLevel}` : null,
    ].filter(Boolean);

    const { data: trip, error: tripErr } = await supabase.from('trips').insert({
      user_id: session.user.id, title: title.trim(), destination,
      start_date: null, end_date: null, status: 'planning',
      cover_image: getCoverImage(destination),
      summary_note: summaryParts.length ? summaryParts.join(' · ') : null,
      is_ai_generated: true,
    }).select().single();

    if (tripErr) { setError('Không thể tạo trip: ' + tripErr.message); setAiGenerating(false); return; }
    log(`✓ Đã tạo trip "${title.trim()}"`, 'ok');

    log(`Đang gửi yêu cầu tới AI (${days} ngày, ${vibes.join(', ')})...`);

    // AI call with 45s timeout
    let timedOut = false;
    const timeoutId = setTimeout(() => { timedOut = true; }, 45000);
    abortRef.current = timeoutId;

    const { data: plan, error: fnErr } = await supabase.functions.invoke('plan-trip', {
      body: {
        destination, days, budget_per_person: budget, group_size: groupSize, vibes,
        accommodation:  accommodation  || undefined,
        transport:      transport      || undefined,
        activity_level: activityLevel  || undefined,
        travelling_with: travelingWith || undefined,
      },
    });
    clearTimeout(timeoutId);

    if (timedOut || cancelled) {
      log('✗ Quá thời gian hoặc đã huỷ', 'err');
      setError('AI không phản hồi. Thử lại hoặc tạo thủ công.');
      setAiGenerating(false);
      return;
    }

    if (fnErr || !plan?.days) {
      let detail = fnErr?.message ?? plan?.error ?? JSON.stringify(plan);
      if (fnErr?.context) {
        try { const b = await (fnErr.context as Response).json(); detail = [b?.error, b?.detail].filter(Boolean).join(' — ') || JSON.stringify(b); } catch {}
      }
      log(`✗ ${detail}`, 'err');
      setError('AI không thể tạo lịch trình. Thử lại hoặc tạo thủ công.');
      setAiGenerating(false);
      return;
    }

    const totalSlots = (plan.days as { slots: unknown[] }[]).reduce((n, d) => n + d.slots.length, 0);
    log(`✓ AI đã lên ${plan.days.length} ngày với ${totalSlots} địa điểm`, 'ok');

    log('Đang lưu lịch trình...');
    const slotMap: Record<string, 'morning' | 'afternoon' | 'evening'> = {
      'sáng': 'morning', 'chiều': 'afternoon', 'tối': 'evening',
    };
    const items = (plan.days as { day: number; slots: { location_id: string; time_slot: string; hint: string | null; reason: string | null }[] }[])
      .flatMap((d) => d.slots.map((s, i) => ({
        trip_id: trip.id, location_id: s.location_id,
        day_number: d.day, time_slot: slotMap[s.time_slot] ?? 'morning',
        note: s.hint ?? null, ai_reason: s.reason ?? null, sort_order: i,
      })));

    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from('trip_items').insert(items);
      if (itemsErr) {
        log(`✗ Lỗi lưu địa điểm: ${itemsErr.message}`, 'err');
        setError('Lưu lịch trình thất bại.');
        setAiGenerating(false);
        return;
      }
      log(`✓ Đã lưu ${items.length} địa điểm`, 'ok');
    } else {
      log('⚠ AI không gợi ý được địa điểm nào', 'warn');
    }

    log('Hoàn thành!', 'ok');
    setAiGenerating(false);
    router.replace(`/trip/${trip.id}`);
  }

  function cancelAI() {
    setCancelled(true);
    if (abortRef.current) clearTimeout(abortRef.current);
  }

  // ── Full-screen AI loading ──
  if (aiGenerating) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="sparkles" size={52} color={N.primary} />
          </View>
          <Text style={styles.loadingTitle}>AI đang tạo lịch trình</Text>
          <Text style={styles.loadingSubtitle}>{title} · {destination} · {days} ngày</Text>
          <ActivityIndicator size="small" color={N.primary} style={{ marginTop: spacing.lg }} />
          {aiLogs.length > 0 && (
            <View style={styles.logBox}>
              {aiLogs.map((entry, i) => (
                <View key={i} style={styles.logRow}>
                  <Ionicons
                    name={entry.type === 'ok' ? 'checkmark-circle' : entry.type === 'err' ? 'close-circle' : entry.type === 'warn' ? 'warning-outline' : 'ellipse-outline'}
                    size={14}
                    color={entry.type === 'ok' ? N.secondary : entry.type === 'err' ? colors.error : entry.type === 'warn' ? '#F59E0B' : N.primary}
                  />
                  <Text style={[styles.logLine, entry.type === 'err' && { color: colors.error }]}>{entry.msg}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelAI}>
            <Text style={styles.cancelBtnText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stepNumber = step === 1 ? 1 : step === 2 ? 2 : 3;
  const stepTitle  = step === 1 ? 'Chuyến đi mới' : step === 2 ? 'Chọn cách tạo' : step === '3a' ? 'Thiết lập AI' : 'Chọn ngày đi';

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={N.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {[1, 2, 3].map((s) => {
          const active = s === stepNumber;
          const done   = s < stepNumber;
          return (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Text style={[styles.stepNum, active && { color: '#fff' }]}>{s}</Text>}
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

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>Tên chuyến đi *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Hội An cuối tuần"
              placeholderTextColor={N.onSurfaceVariant}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Điểm đến *</Text>
            <TouchableOpacity
              style={[styles.input, styles.destPicker]}
              onPress={() => { setProvinceSearch(''); setShowProvincePicker(true); }}
            >
              <Text style={destination ? styles.destPickerText : styles.destPickerPlaceholder}>
                {destination || 'Chọn tỉnh / thành phố...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionLabel}>Chọn cách tạo lịch trình</Text>

            <TouchableOpacity style={styles.methodCard} onPress={() => { setError(''); setStep('3a'); }} activeOpacity={0.85}>
              <View style={styles.methodIcon}>
                <Ionicons name="sparkles" size={28} color={N.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Tạo bằng AI</Text>
                <Text style={styles.methodDesc}>AI gợi ý lịch trình theo phong cách và ngân sách của bạn</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={N.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodCard} onPress={() => { setError(''); setStep('3b'); }} activeOpacity={0.85}>
              <View style={[styles.methodIcon, { backgroundColor: N.secondaryContainer }]}>
                <Ionicons name="pencil-outline" size={28} color={N.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Tạo thủ công</Text>
                <Text style={styles.methodDesc}>Tự thêm địa điểm và sắp xếp theo ý muốn</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={N.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3a — AI params ── */}
        {step === '3a' && (
          <View style={styles.stepContent}>

            {/* Đi cùng ai */}
            <Text style={styles.inputLabel}>Đi cùng ai?</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'travelingWith' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('travelingWith')}
            >
              <Text style={travelingWith ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                {TRAVELING_WITH.find(x => x.value === travelingWith)?.label || 'Chọn hình thức đi...'}
              </Text>
              <Ionicons name={openDropdown === 'travelingWith' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'travelingWith' && (
              <View style={styles.dropdownList}>
                {TRAVELING_WITH.map((opt, i) => {
                  const active = travelingWith === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.dropdownItem, i > 0 && styles.dropdownItemBorder]}
                      onPress={() => { setTravelingWith(active ? '' : opt.value); setOpenDropdown(null); }}
                    >
                      <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{opt.label}</Text>
                      {active && <Ionicons name="checkmark" size={16} color={N.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Phong cách */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Phong cách chuyến đi *</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'vibes' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('vibes')}
            >
              <Text style={vibes.length ? styles.selectBtnText : styles.selectBtnPlaceholder} numberOfLines={1}>
                {vibes.length ? vibes.join(', ') : 'Chọn phong cách...'}
              </Text>
              <Ionicons name={openDropdown === 'vibes' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'vibes' && (
              <View style={[styles.dropdownList, { padding: spacing.sm }]}>
                <View style={styles.chipRow}>
                  {VIBES.map((v) => (
                    <TouchableOpacity key={v} style={[styles.chip, vibes.includes(v) && styles.chipActive]} onPress={() => toggleVibe(v)}>
                      <Text style={[styles.chipText, vibes.includes(v) && styles.chipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Số người */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Số người</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.max(1, groupSize - 1))}>
                <Ionicons name="remove" size={20} color={N.onSurface} />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{groupSize}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.min(20, groupSize + 1))}>
                <Ionicons name="add" size={20} color={N.onSurface} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.checkRow} onPress={() => setHasChildren(!hasChildren)}>
              <View style={[styles.checkbox, hasChildren && styles.checkboxChecked]}>
                {hasChildren && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.checkLabel}>Có trẻ em hoặc người lớn tuổi</Text>
            </TouchableOpacity>

            {/* Số ngày */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Số ngày</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.max(1, days - 1))}>
                <Ionicons name="remove" size={20} color={N.onSurface} />
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{days} ngày</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.min(14, days + 1))}>
                <Ionicons name="add" size={20} color={N.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Ngân sách */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Ngân sách / người / ngày *</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'budget' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('budget')}
            >
              <Text style={budget ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                {BUDGETS.find(b => b.value === budget)?.label || 'Chọn mức ngân sách...'}
              </Text>
              <Ionicons name={openDropdown === 'budget' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'budget' && (
              <View style={styles.dropdownList}>
                {BUDGETS.map((b, i) => {
                  const active = budget === b.value;
                  return (
                    <TouchableOpacity
                      key={b.value}
                      style={[styles.dropdownItem, i > 0 && styles.dropdownItemBorder]}
                      onPress={() => { setBudget(b.value); setOpenDropdown(null); }}
                    >
                      <View>
                        <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{b.sublabel}</Text>
                        <Text style={styles.dropdownItemSub}>{b.label}</Text>
                      </View>
                      {active && <Ionicons name="checkmark" size={16} color={N.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {budget !== null && openDropdown !== 'budget' && (
              <View style={styles.budgetTotalRow}>
                <Ionicons name="wallet-outline" size={14} color={N.primary} />
                <Text style={styles.budgetTotalText}>
                  Dự kiến tổng: ~{formatVND(budget * groupSize * days)}{'  '}({groupSize} người × {days} ngày)
                </Text>
              </View>
            )}

            {/* Lưu trú */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Loại hình lưu trú</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'accommodation' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('accommodation')}
            >
              <Text style={accommodation ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                {accommodation || 'Chọn loại lưu trú...'}
              </Text>
              <Ionicons name={openDropdown === 'accommodation' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'accommodation' && (
              <View style={styles.dropdownList}>
                {ACCOMMODATIONS.map((a, i) => {
                  const active = accommodation === a;
                  return (
                    <TouchableOpacity key={a} style={[styles.dropdownItem, i > 0 && styles.dropdownItemBorder]} onPress={() => { setAccommodation(active ? '' : a); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{a}</Text>
                      {active && <Ionicons name="checkmark" size={16} color={N.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Di chuyển */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Phương tiện di chuyển</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'transport' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('transport')}
            >
              <Text style={transport ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                {transport || 'Chọn phương tiện...'}
              </Text>
              <Ionicons name={openDropdown === 'transport' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'transport' && (
              <View style={styles.dropdownList}>
                {TRANSPORTS.map((t, i) => {
                  const active = transport === t;
                  return (
                    <TouchableOpacity key={t} style={[styles.dropdownItem, i > 0 && styles.dropdownItemBorder]} onPress={() => { setTransport(active ? '' : t); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{t}</Text>
                      {active && <Ionicons name="checkmark" size={16} color={N.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Mức độ */}
            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Mức độ hoạt động</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectBtn, openDropdown === 'activityLevel' && styles.selectBtnOpen]}
              onPress={() => toggleDropdown('activityLevel')}
            >
              <Text style={activityLevel ? styles.selectBtnText : styles.selectBtnPlaceholder}>
                {activityLevel || 'Chọn mức độ...'}
              </Text>
              <Ionicons name={openDropdown === 'activityLevel' ? 'chevron-up' : 'chevron-down'} size={16} color={N.onSurfaceVariant} />
            </TouchableOpacity>
            {openDropdown === 'activityLevel' && (
              <View style={styles.dropdownList}>
                {ACTIVITY_LEVELS.map((l, i) => {
                  const active = activityLevel === l;
                  return (
                    <TouchableOpacity key={l} style={[styles.dropdownItem, i > 0 && styles.dropdownItemBorder]} onPress={() => { setActivityLevel(active ? '' : l); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{l}</Text>
                      {active && <Ionicons name="checkmark" size={16} color={N.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── STEP 3b — Manual ── */}
        {step === '3b' && (
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>Ngày đi (tùy chọn)</Text>
            <DatePicker value={startDate} onChange={(v) => { setStartDate(v); if (endDate && endDate < v) setEndDate(''); }} placeholder="Chọn ngày khởi hành" />

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Ngày về (tùy chọn)</Text>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Chọn ngày về" minDate={startDate ? new Date(startDate) : undefined} />

            <View style={styles.dateHint}>
              <Ionicons name="information-circle-outline" size={13} color={N.onSurfaceVariant} />
              <Text style={styles.dateHintText}>Ngày đi có thể thêm hoặc thay đổi sau trong trip</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
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
          <Button label="Tạo Trip" onPress={createManual} loading={saving} />
        </View>
      )}

      {/* Province Picker Modal */}
      <Modal visible={showProvincePicker} animationType="slide" transparent onRequestClose={() => setShowProvincePicker(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.provinceModal}>
            <View style={styles.modalHandle} />
            <View style={styles.provinceHeader}>
              <Text style={styles.provinceTitle}>Chọn điểm đến</Text>
              <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
                <Ionicons name="close" size={24} color={N.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={styles.provinceSearchWrap}>
              <Ionicons name="search-outline" size={16} color={N.onSurfaceVariant} />
              <TextInput
                style={styles.provinceSearchInput}
                placeholder="Tìm tỉnh / thành phố..."
                placeholderTextColor={N.onSurfaceVariant}
                value={provinceSearch}
                onChangeText={setProvinceSearch}
                autoFocus
              />
              {provinceSearch ? (
                <TouchableOpacity onPress={() => setProvinceSearch('')}>
                  <Ionicons name="close-circle" size={16} color={N.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>
            <FlatList
              data={PROVINCES.filter((p) =>
                stripDiacritics(p).toLowerCase().includes(stripDiacritics(provinceSearch).toLowerCase())
              )}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.provinceItem, destination === item && styles.provinceItemActive]}
                  onPress={() => { setDestination(item); setShowProvincePicker(false); }}
                >
                  <Text style={[styles.provinceItemText, destination === item && styles.provinceItemTextActive]}>{item}</Text>
                  {destination === item && <Ionicons name="checkmark" size={16} color={N.primary} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: N.outlineVariant, marginHorizontal: spacing.lg }} />}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const N = colors.nomad;

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: N.background },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow },
  headerBack:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: N.onSurface },

  stepRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, backgroundColor: N.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: N.outlineVariant },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: N.background },
  stepDotActive:  { borderColor: N.primary, backgroundColor: N.primary },
  stepDotDone:    { borderColor: N.secondary, backgroundColor: N.secondary },
  stepNum:        { fontSize: 11, fontWeight: '700', color: N.onSurfaceVariant },
  stepLine:       { width: 44, height: 1.5, backgroundColor: N.outlineVariant, marginHorizontal: 4 },
  stepLineDone:   { backgroundColor: N.secondary },

  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 12, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.md },
  errorText:      { flex: 1, color: colors.error, fontSize: 13 },

  stepContent:    { paddingTop: spacing.lg },
  sectionLabel:   { fontSize: 15, fontWeight: '700', color: N.onSurface, marginBottom: spacing.md },

  inputLabel:     { fontSize: 13, fontWeight: '600', color: N.onSurfaceVariant, marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: N.onSurface, backgroundColor: N.surfaceContainerLow },
  destPicker:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  destPickerText: { fontSize: 15, color: N.onSurface, flex: 1 },
  destPickerPlaceholder: { fontSize: 15, color: N.onSurfaceVariant, flex: 1 },

  selectBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectBtnOpen:  { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomColor: 'transparent' },
  selectBtnText:  { fontSize: 15, color: N.onSurface, flex: 1 },
  selectBtnPlaceholder: { fontSize: 15, color: N.onSurfaceVariant, flex: 1 },

  dropdownList:   { borderWidth: 1, borderColor: N.outlineVariant, borderTopWidth: 0, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, backgroundColor: N.surfaceContainerLow, marginBottom: 2 },
  dropdownItem:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13 },
  dropdownItemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: N.outlineVariant },
  dropdownItemText: { fontSize: 14, color: N.onSurface },
  dropdownItemTextActive: { color: N.primary, fontWeight: '700' },
  dropdownItemSub: { fontSize: 12, color: N.onSurfaceVariant, marginTop: 2 },

  budgetTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 4 },
  budgetTotalText: { fontSize: 13, color: N.primary, fontWeight: '600' },

  methodCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow, marginBottom: 12 },
  methodIcon:     { width: 52, height: 52, borderRadius: radius.md, backgroundColor: N.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  methodTitle:    { fontSize: 16, fontWeight: '700', color: N.onSurface, marginBottom: 2 },
  methodDesc:     { fontSize: 12, color: N.onSurfaceVariant, lineHeight: 17 },

  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow },
  chipActive:     { borderColor: N.primary, backgroundColor: N.secondaryContainer },
  chipText:       { fontSize: 13, color: N.onSurfaceVariant, fontWeight: '500' },
  chipTextActive: { color: N.primary, fontWeight: '700' },

  stepper:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, overflow: 'hidden', alignSelf: 'flex-start' },
  stepperBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: N.surfaceContainerLow },
  stepperVal:     { paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: N.onSurface },

  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: N.primary, borderColor: N.primary },
  checkLabel:     { fontSize: 14, color: N.onSurface },

  dateHint:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dateHintText:   { fontSize: 12, color: N.onSurfaceVariant },

  bottomBar:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow },

  overlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  provinceModal:         { backgroundColor: N.surfaceContainerLow, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  modalHandle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: N.outlineVariant, alignSelf: 'center', marginTop: 10, marginBottom: spacing.md },
  provinceHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  provinceTitle:         { fontSize: 18, fontWeight: '800', color: N.onSurface },
  provinceSearchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: N.background },
  provinceSearchInput:   { flex: 1, fontSize: 14, color: N.onSurface },
  provinceItem:          { paddingHorizontal: spacing.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  provinceItemActive:    { backgroundColor: N.secondaryContainer },
  provinceItemText:      { fontSize: 15, color: N.onSurface },
  provinceItemTextActive: { color: N.primary, fontWeight: '700' },

  loadingScreen:   { flex: 1, backgroundColor: N.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingContent:  { alignItems: 'center', maxWidth: 320, width: '100%' },
  loadingIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: N.secondaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  loadingTitle:    { fontSize: 22, fontWeight: '800', color: N.onSurface, textAlign: 'center', marginBottom: spacing.sm },
  loadingSubtitle: { fontSize: 14, color: N.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: spacing.md },
  logBox:          { width: '100%', backgroundColor: N.surfaceContainerLow, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: N.outlineVariant, gap: 8, marginTop: spacing.lg },
  logRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logLine:         { flex: 1, fontSize: 13, color: N.onSurfaceVariant, lineHeight: 19 },
  cancelBtn:       { marginTop: spacing.xl, paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.xl, borderWidth: 1, borderColor: N.outlineVariant },
  cancelBtnText:   { fontSize: 14, fontWeight: '600', color: N.onSurfaceVariant },
});
