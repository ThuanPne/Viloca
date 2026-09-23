import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, ScrollView, SafeAreaView, Modal, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DatePicker } from '@/src/components/ui/DatePicker';
import { Button } from '@/src/components/ui/Button';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import { getCoverForDestination, DESTINATION_COVERS } from '@/src/lib/destination-covers';
import { stripDiacritics } from '@/src/lib/trip-utils';

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

const PRESET_VIBES = ['Bình yên', 'Cổ kính', 'Hoang sơ', 'Ẩm thực'];

// Tỉnh/thành hiện có dữ liệu địa điểm — cập nhật khi thêm tỉnh mới vào DB
const SUPPORTED_DESTINATIONS = new Set([
  'Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh', 'Quảng Nam',
]);

const FIXED_GROUP_SIZE: Record<string, number> = { solo: 1, couple: 2 };

const TRAVELING_WITH: { label: string; value: string }[] = [
  { label: '🧍 Solo',        value: 'solo' },
  { label: '💑 Cặp đôi',    value: 'couple' },
  { label: '👨‍👩‍👧 Gia đình', value: 'family' },
  { label: '👫 Nhóm bạn',   value: 'friends' },
];

const ACCOMMODATIONS = ['Homestay', 'Khách sạn', 'Camping', 'Resort'];
const TRANSPORTS     = ['Xe máy', 'Thuê ô tô', 'Xe khách'];
const ACTIVITY_LEVELS = ['Thư giãn', 'Vừa phải', 'Năng động'];

const BUDGETS: { label: string; sublabel: string; value: number }[] = [
  { label: 'Tiết kiệm',  sublabel: '< 300k/ngày',    value: 300000 },
  { label: 'Trung bình', sublabel: '300–700k/ngày',  value: 500000 },
  { label: 'Thoải mái',  sublabel: '700k–1.5M/ngày', value: 1000000 },
  { label: 'Sang trọng', sublabel: '> 1.5M/ngày',    value: 2000000 },
];

const AI_LOG_STEPS = [
  'Đang tìm kiếm địa điểm...',
  'Tối ưu hóa lộ trình di chuyển...',
  'Đang chọn lọc địa điểm ăn uống...',
  'Hoàn thiện chi tiết chuyến đi...',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoverImage(destination: string): string {
  return getCoverForDestination(destination, destination);
}

type Step = 0 | 1 | 'ai' | 'manual';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateTripScreen() {
  const [step, setStep]                 = useState<Step>(0);
  const [mode, setMode]                 = useState<'ai' | 'manual'>('ai');
  const [userPlan, setUserPlan]         = useState<'free' | 'pro'>('free');
  const [aiCredits, setAiCredits]       = useState(0);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [aiLogs, setAiLogs]             = useState<{ msg: string; type: 'info' | 'ok' | 'err' | 'warn' }[]>([]);
  const [error, setError]               = useState('');
  const [cancelled, setCancelled]       = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const abortRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1
  const [title, setTitle]                           = useState('');
  const [destination, setDestination]               = useState('');
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [provinceSearch, setProvinceSearch]         = useState('');

  // Step manual
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  // Step ai
  const [travelingWith, setTravelingWith] = useState('');
  const [vibes, setVibes]                 = useState<string[]>([]);
  const [groupSize, setGroupSize]         = useState(2);
  const [days, setDays]                   = useState(3);
  const [budget, setBudget]               = useState<number | null>(null);
  const [accommodation, setAccommodation] = useState('');
  const [transport, setTransport]         = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [vibeInput, setVibeInput]         = useState('');
  const [showVibeInput, setShowVibeInput] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('plan, ai_credits_remaining').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data) { setUserPlan(data.plan ?? 'free'); setAiCredits(data.ai_credits_remaining ?? 0); }
        });
    });
  }, []);

  function goBack() {
    if (step === 0) router.back();
    else if (step === 1) setStep(0);
    else setStep(1);
    setError('');
  }

  function validateStep1(): boolean {
    if (!title.trim()) { setError('Vui lòng nhập tên chuyến đi'); return false; }
    if (!destination)  { setError('Vui lòng chọn điểm đến'); return false; }
    setError('');
    return true;
  }

  function goAI()     { if (validateStep1()) setStep('ai'); }
  function goManual() { if (validateStep1()) setStep('manual'); }

  function toggleVibe(v: string) {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function addCustomVibe() {
    const v = vibeInput.trim();
    if (!v || vibes.includes(v)) { setVibeInput(''); setShowVibeInput(false); return; }
    setVibes(prev => [...prev, v]);
    setVibeInput('');
    setShowVibeInput(false);
  }

  function removeVibe(v: string) {
    setVibes(prev => prev.filter(x => x !== v));
  }

  function selectTravelingWith(val: string) {
    const next = travelingWith === val ? '' : val;
    setTravelingWith(next);
    if (FIXED_GROUP_SIZE[next] !== undefined) setGroupSize(FIXED_GROUP_SIZE[next]);
  }

  const showGroupSizePicker = !FIXED_GROUP_SIZE[travelingWith];
  const customVibes = vibes.filter(v => !PRESET_VIBES.includes(v));

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

    // Preflight: kiểm tra điểm đến có dữ liệu không trước khi tạo trip
    const { count: destCount } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .ilike('address', `%${destination}%`);

    if (!destCount || destCount === 0) {
      setError(`"${destination}" chưa có dữ liệu địa điểm trên Viloca. Hiện hỗ trợ: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh, Quảng Nam. Vui lòng chọn lại điểm đến.`);
      setAiGenerating(false);
      setStep(1);
      return;
    }

    log('Đang tạo chuyến đi...');
    const summaryParts = [
      travelingWith ? `Đi cùng: ${TRAVELING_WITH.find(x => x.value === travelingWith)?.label}` : null,
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
      const httpStatus = (fnErr as any)?.context?.status;
      let isOutOfCredits = httpStatus === 402 || plan?.error === 'No AI credits remaining';
      let isNoLocations = false;
      let noLocationsMessage = '';

      if (fnErr?.context) {
        try {
          const b = await (fnErr.context as Response).json();
          if (!isOutOfCredits) isOutOfCredits = b?.error === 'No AI credits remaining';
          if (b?.error === 'no_locations_for_destination') {
            isNoLocations = true;
            noLocationsMessage = b?.message ?? '';
          }
          detail = [b?.error, b?.detail].filter(Boolean).join(' — ') || JSON.stringify(b);
        } catch {}
      }

      if (isOutOfCredits) {
        setShowCreditsModal(true);
        setAiGenerating(false);
        return;
      }

      if (isNoLocations || httpStatus === 404) {
        // Xoá trip đã tạo vì không có địa điểm để lên lịch
        await supabase.from('trips').delete().eq('id', trip.id);
        setError(noLocationsMessage || `"${destination}" chưa có dữ liệu. Hiện hỗ trợ: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh, Quảng Nam.`);
        setAiGenerating(false);
        setStep(1);
        return;
      }

      log(`✗ ${detail}`, 'err');
      setError('AI không thể tạo lịch trình. Thử lại hoặc tạo thủ công.');
      setAiGenerating(false);
      return;
    }

    const totalSlots = (plan.days as { slots: unknown[] }[]).reduce((n, d) => n + d.slots.length, 0);
    log(`✓ AI đã lên ${plan.days.length} ngày với ${totalSlots} địa điểm`, 'ok');
    if (plan.credits_remaining !== undefined && plan.credits_remaining !== null) {
      log(`Còn ${plan.credits_remaining} lượt giúp đỡ miễn phí`, 'warn');
    }

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

  // ── Step 0: Mode selection ──
  if (step === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBack} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={N.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo lộ trình</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.modeScreen}>
          <Text style={styles.modeHeading}>Bạn muốn lên lịch{'\n'}thế nào?</Text>

          {/* Sen / AI card */}
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardAI]}
            onPress={() => { setMode('ai'); setStep(1); }}
            activeOpacity={0.85}
          >
            <View style={[styles.modeCardIcon, styles.modeCardIconAI]}>
              <Ionicons name="sparkles" size={26} color={N.primary} />
            </View>
            <View style={styles.modeCardBody}>
              <Text style={styles.modeCardTitle}>Nhờ Sen lên kế hoạch</Text>
              <Text style={styles.modeCardDesc}>Sen gợi ý lịch trình phù hợp dựa trên sở thích của bạn</Text>
              {userPlan === 'free' && (
                <View style={styles.modeCardBadge}>
                  <Ionicons name="flash-outline" size={12} color={N.primary} />
                  <Text style={styles.modeCardBadgeText}>{aiCredits} lượt giúp đỡ còn lại</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={N.primary} />
          </TouchableOpacity>

          {/* Manual card */}
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => { setMode('manual'); setStep(1); }}
            activeOpacity={0.85}
          >
            <View style={styles.modeCardIcon}>
              <Ionicons name="create-outline" size={26} color={N.onSurfaceVariant} />
            </View>
            <View style={styles.modeCardBody}>
              <Text style={styles.modeCardTitle}>Tự lên lịch trình</Text>
              <Text style={styles.modeCardDesc}>Tự chọn điểm đến, ngày đi và sắp xếp theo ý muốn</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={N.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── AI Loading screen ──
  if (aiGenerating) {
    const okCount = aiLogs.filter(l => l.type === 'ok').length;
    const hasErr  = aiLogs.some(l => l.type === 'err');

    function stepState(i: number): 'done' | 'active' | 'error' | 'pending' {
      if (hasErr && i === okCount) return 'error';
      if (i < okCount) return 'done';
      if (i === okCount) return 'active';
      return 'pending';
    }

    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingProgress}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.loadingProgressBar, i === 0 && styles.loadingProgressBarFilled]} />
          ))}
        </View>

        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="sparkles" size={48} color={N.primary} />
          </View>
          <Text style={styles.loadingTitle}>AI đang tạo lịch trình</Text>
          <Text style={styles.loadingSubtitle}>{title} · {destination} · {days} ngày</Text>
          <ActivityIndicator size="small" color={N.primary} style={{ marginTop: spacing.lg }} />

          <View style={styles.logBox}>
            {AI_LOG_STEPS.map((msg, i) => {
              const state = stepState(i);
              return (
                <View key={i} style={styles.logRow}>
                  {state === 'done'    && <Ionicons name="checkmark-circle" size={18} color={N.primary} />}
                  {state === 'active'  && <ActivityIndicator size="small" color={N.primary} style={{ width: 18, height: 18 }} />}
                  {state === 'pending' && <Ionicons name="radio-button-off" size={18} color={N.onSurfaceVariant} />}
                  {state === 'error'   && <Ionicons name="close-circle" size={18} color={colors.error} />}
                  <Text style={[
                    styles.logLine,
                    state === 'done'    && { color: N.secondary },
                    state === 'pending' && { color: N.onSurfaceVariant, opacity: 0.4 },
                    state === 'error'   && { color: colors.error },
                  ]}>{msg}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={cancelAI}>
          <Text style={styles.cancelBtnText}>Huỷ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const headerTitle  = step === 'ai' ? 'Thiết lập sở thích' : step === 'manual' ? 'Chọn ngày đi' : 'Tạo chuyến đi';
  const progressStep = step === 1 ? 1 : 2;
  const hasCover     = !!destination && !!DESTINATION_COVERS[destination];
  const coverUri     = destination ? getCoverImage(destination) : null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={N.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.progressItem}>
            <View style={[styles.progressBar, s <= progressStep && styles.progressBarFilled]} />
            <View style={[styles.progressDot, s <= progressStep && styles.progressDotFilled]} />
          </View>
        ))}
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
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View>
            {/* Hero cover */}
            <View style={styles.hero}>
              {hasCover ? (
                <>
                  <Image source={{ uri: coverUri! }} style={styles.heroImg} resizeMode="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFillObject} />
                  <View style={styles.heroCityWrap}>
                    <Text style={styles.heroCity}>{destination}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name="location-outline" size={36} color={N.primary + '80'} />
                  <Text style={styles.heroPlaceholderText}>Chọn điểm đến</Text>
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Điểm đến</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => { setProvinceSearch(''); setShowProvincePicker(true); }}
                activeOpacity={0.75}
              >
                <Text style={destination ? styles.pickerRowText : styles.pickerRowPlaceholder}>
                  {destination || 'Chọn tỉnh / thành phố...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={N.onSurfaceVariant} />
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Tên chuyến đi</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hội An cuối tuần"
                placeholderTextColor={N.onSurfaceVariant}
                value={title}
                onChangeText={setTitle}
              />
              <Text style={styles.inputHint}>Sử dụng tên dễ nhớ để tìm lại sau này.</Text>

              {!!destination && SUPPORTED_DESTINATIONS.has(destination) && (
                <View style={styles.tipCard}>
                  <Ionicons name="information-circle-outline" size={18} color={N.secondary} />
                  <Text style={styles.tipText}>
                    {destination} là điểm đến được yêu thích trên Viloca. Bạn đã sẵn sàng khám phá chưa?
                  </Text>
                </View>
              )}
              {!!destination && !SUPPORTED_DESTINATIONS.has(destination) && (
                <View style={styles.tipCardWarn}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                  <Text style={styles.tipTextWarn}>
                    Viloca chưa có dữ liệu địa điểm tại {destination}. Tính năng AI Trip sẽ không khả dụng — bạn vẫn có thể tự lên lịch.{'\n'}
                    <Text style={{ fontWeight: '600' }}>Hỗ trợ AI: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh, Quảng Nam.</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── STEP AI ── */}
        {step === 'ai' && (
          <View style={styles.formSection}>

            {/* Đi cùng ai */}
            <Text style={styles.sectionTitle}>Đi cùng ai?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
              {TRAVELING_WITH.map((opt) => {
                const active = travelingWith === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pillChip, active && styles.pillChipActive]}
                    onPress={() => selectTravelingWith(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Phong cách */}
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Phong cách chuyến đi *</Text>
            <View style={styles.chipWrap}>
              {PRESET_VIBES.map((v) => {
                const active = vibes.includes(v);
                return (
                  <TouchableOpacity key={v} style={[styles.pillChip, active && styles.pillChipActive]} onPress={() => toggleVibe(v)} activeOpacity={0.75}>
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                );
              })}
              {customVibes.map((v) => (
                <TouchableOpacity key={v} style={[styles.pillChip, styles.pillChipCustom]} onPress={() => removeVibe(v)} activeOpacity={0.75}>
                  <Text style={styles.pillChipTextCustom}>{v}</Text>
                  <Ionicons name="close" size={13} color={N.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
              {!showVibeInput && (
                <TouchableOpacity style={styles.pillChipAdd} onPress={() => setShowVibeInput(true)} activeOpacity={0.75}>
                  <Ionicons name="add" size={15} color={N.onSurfaceVariant} />
                  <Text style={styles.pillChipAddText}>Thêm</Text>
                </TouchableOpacity>
              )}
            </View>
            {showVibeInput && (
              <View style={styles.vibeInputRow}>
                <TextInput
                  style={styles.vibeInput}
                  placeholder="VD: Thể thao, Chụp ảnh..."
                  placeholderTextColor={N.onSurfaceVariant}
                  value={vibeInput}
                  onChangeText={setVibeInput}
                  maxLength={30}
                  autoFocus
                  onSubmitEditing={addCustomVibe}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.vibeInputBtn} onPress={addCustomVibe}>
                  <Text style={styles.vibeInputBtnText}>Thêm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.vibeInputCancel} onPress={() => { setShowVibeInput(false); setVibeInput(''); }}>
                  <Ionicons name="close" size={18} color={N.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            )}

            {/* Số người + Số ngày */}
            <View style={[styles.stepperRow, { marginTop: spacing.xl }]}>
              {showGroupSizePicker && (
                <View style={styles.stepperCard}>
                  <Text style={styles.stepperCardLabel}>Số người</Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.max(1, groupSize - 1))}>
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperVal}>{groupSize}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setGroupSize(Math.min(20, groupSize + 1))}>
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={[styles.stepperCard, !showGroupSizePicker && { flex: 1 }]}>
                <Text style={styles.stepperCardLabel}>Số ngày</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.max(1, days - 1))}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{days}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => setDays(Math.min(14, days + 1))}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Ngân sách */}
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Ngân sách / người / ngày *</Text>
            <View style={styles.budgetGrid}>
              {BUDGETS.map((b) => {
                const active = budget === b.value;
                return (
                  <TouchableOpacity key={b.value} style={[styles.budgetCard, active && styles.budgetCardActive]} onPress={() => setBudget(b.value)} activeOpacity={0.75}>
                    <Text style={[styles.budgetLabel, active && styles.budgetLabelActive]}>{b.label}</Text>
                    <Text style={styles.budgetSublabel}>{b.sublabel}</Text>
                    {active && <View style={styles.budgetCheck}><Ionicons name="checkmark-circle" size={18} color={N.primary} /></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lưu trú */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Lưu trú</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
              {ACCOMMODATIONS.map((a) => {
                const active = accommodation === a;
                return (
                  <TouchableOpacity key={a} style={[styles.pillChip, active && styles.pillChipActive]} onPress={() => setAccommodation(active ? '' : a)} activeOpacity={0.75}>
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{a}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Phương tiện */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Phương tiện</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
              {TRANSPORTS.map((t) => {
                const active = transport === t;
                return (
                  <TouchableOpacity key={t} style={[styles.pillChip, active && styles.pillChipActive]} onPress={() => setTransport(active ? '' : t)} activeOpacity={0.75}>
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mức độ hoạt động */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Mức độ hoạt động</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
              {ACTIVITY_LEVELS.map((l) => {
                const active = activityLevel === l;
                return (
                  <TouchableOpacity key={l} style={[styles.pillChip, active && styles.pillChipActive]} onPress={() => setActivityLevel(active ? '' : l)} activeOpacity={0.75}>
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>{l}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── STEP MANUAL ── */}
        {step === 'manual' && (
          <View style={styles.formSection}>
            <Text style={styles.manualQuestion}>Bạn định đi khi nào?</Text>
            <Text style={styles.manualSubtitle}>Chọn thời gian để Viloca giúp bạn sắp xếp lịch trình tối ưu nhất.</Text>

            <View style={styles.dateCard}>
              <Text style={styles.dateCardLabel}>NGÀY ĐI</Text>
              <DatePicker
                value={startDate}
                onChange={(v) => { setStartDate(v); if (endDate && endDate < v) setEndDate(''); }}
                placeholder="Chọn ngày khởi hành"
              />
            </View>

            <View style={[styles.dateCard, { marginTop: spacing.md }]}>
              <Text style={styles.dateCardLabel}>NGÀY VỀ</Text>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Chọn ngày về"
                minDate={startDate ? new Date(startDate) : undefined}
              />
            </View>

            <View style={styles.dateHint}>
              <Ionicons name="information-circle-outline" size={14} color={N.onSurfaceVariant} />
              <Text style={styles.dateHintText}>Ngày đi có thể thêm sau nếu bạn chưa chắc chắn.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom buttons */}
      {step === 1 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} onPress={mode === 'ai' ? goAI : goManual} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Tiếp tục →</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 'ai' && (
        <View style={styles.bottomBar}>
          <Button label="✨ Tạo lịch trình AI" onPress={createWithAI} />
        </View>
      )}
      {step === 'manual' && (
        <View style={styles.bottomBar}>
          <Button label="Tạo lộ trình" onPress={createManual} loading={saving} />
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

      {/* ── Credits exhausted modal ───────────────────────────────────────────── */}
      <Modal visible={showCreditsModal} transparent animationType="fade" onRequestClose={() => setShowCreditsModal(false)}>
        <View style={styles.creditsOverlay}>
          <View style={styles.creditsCard}>
            <Ionicons name="sparkles" size={32} color={N.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.creditsTitle}>Hết lượt giúp đỡ</Text>
            <Text style={styles.creditsBody}>
              Bạn đã dùng hết số lượt giúp đỡ miễn phí. Nâng cấp lên Pro để tạo lịch trình không giới hạn và xem đầy đủ thông tin địa điểm.
            </Text>
            <TouchableOpacity style={styles.creditsUpgradeBtn} onPress={() => setShowCreditsModal(false)}>
              <Text style={styles.creditsUpgradeBtnText}>Nâng cấp Pro →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCreditsModal(false)} style={styles.creditsDismiss}>
              <Text style={styles.creditsDismissText}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const N = colors.nomad;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: N.background },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: N.background },
  headerBack:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: N.onSurface },

  progressRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  progressItem:      { flex: 1, gap: 4 },
  progressBar:       { height: 4, borderRadius: 4, backgroundColor: N.surfaceContainer },
  progressBarFilled: { backgroundColor: N.primary },
  progressDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: N.outlineVariant },
  progressDotFilled: { backgroundColor: N.primary },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 12, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.md },
  errorText: { flex: 1, color: colors.error, fontSize: 13 },

  hero:                { height: 220, width: '100%', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroImg:             { width: '100%', height: '100%' },
  heroCityWrap:        { position: 'absolute', bottom: 20, left: 20 },
  heroCity:            { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  heroPlaceholder:     { flex: 1, backgroundColor: N.secondaryContainer + '40', alignItems: 'center', justifyContent: 'center', gap: 10 },
  heroPlaceholderText: { fontSize: 15, color: N.primary + '80', fontWeight: '600' },

  formSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  inputLabel:  { fontSize: 13, fontWeight: '600', color: N.onSurfaceVariant, marginBottom: 6 },
  input:       { backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: N.onSurface },
  inputHint:   { fontSize: 11, color: N.onSurfaceVariant, marginTop: 5, paddingHorizontal: 2 },
  pickerRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14 },
  pickerRowText:        { fontSize: 16, fontWeight: '700', color: N.primary, flex: 1 },
  pickerRowPlaceholder: { fontSize: 16, color: N.onSurfaceVariant, flex: 1 },

  tipCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: N.secondaryContainer + '30', borderRadius: radius.lg, borderWidth: 1, borderColor: N.secondaryContainer + '50', padding: spacing.md, marginTop: spacing.lg },
  tipText:     { flex: 1, fontSize: 12, color: N.onSurface, lineHeight: 18 },
  tipCardWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.error + '12', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.error + '40', padding: spacing.md, marginTop: spacing.lg },
  tipTextWarn: { flex: 1, fontSize: 12, color: colors.error, lineHeight: 18 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: N.onSurface, marginBottom: spacing.sm },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: N.onSurfaceVariant, marginBottom: 8 },

  chipScroll:        { marginHorizontal: -spacing.lg },
  chipScrollContent: { paddingHorizontal: spacing.lg, gap: 8, flexDirection: 'row' },
  chipWrap:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillChip:          { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow },
  pillChipActive:    { borderColor: N.primary, backgroundColor: N.primary },
  pillChipText:      { fontSize: 14, color: N.onSurfaceVariant, fontWeight: '500' },
  pillChipTextActive: { color: '#fff', fontWeight: '600' },
  pillChipCustom:    { borderColor: N.primary, backgroundColor: N.secondaryContainer + '40', flexDirection: 'row', alignItems: 'center' },
  pillChipTextCustom: { fontSize: 14, color: N.primary, fontWeight: '600' },
  pillChipAdd:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: N.outlineVariant, borderStyle: 'dashed', backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 3 },
  pillChipAddText:   { fontSize: 14, color: N.onSurfaceVariant, fontWeight: '500' },
  vibeInputRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  vibeInput:         { flex: 1, backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: N.onSurface, borderWidth: 1.5, borderColor: N.primary },
  vibeInputBtn:      { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: N.primary },
  vibeInputBtnText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  vibeInputCancel:   { padding: 6 },

  stepperRow:       { flexDirection: 'row', gap: spacing.md },
  stepperCard:      { flex: 1, backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, borderWidth: 1, borderColor: N.outlineVariant, padding: spacing.md },
  stepperCardLabel: { fontSize: 12, color: N.onSurfaceVariant, marginBottom: spacing.sm },
  stepperControls:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperBtn:       { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: N.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: N.background },
  stepperBtnText:   { fontSize: 18, color: N.onSurface, lineHeight: 22 },
  stepperVal:       { fontSize: 16, fontWeight: '700', color: N.onSurface },

  budgetGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  budgetCard:        { width: '48%', padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: N.outlineVariant, backgroundColor: N.surfaceContainerLow, position: 'relative' },
  budgetCardActive:  { borderColor: N.primary, backgroundColor: N.primary + '10' },
  budgetLabel:       { fontSize: 14, fontWeight: '600', color: N.onSurface, marginBottom: 3 },
  budgetLabelActive: { color: N.primary },
  budgetSublabel:    { fontSize: 12, color: N.onSurfaceVariant },
  budgetCheck:       { position: 'absolute', top: 10, right: 10 },

  manualQuestion: { fontSize: 26, fontWeight: '800', color: N.onSurface, letterSpacing: -0.5, marginBottom: 8 },
  manualSubtitle: { fontSize: 14, color: N.onSurfaceVariant, lineHeight: 20, marginBottom: spacing.xl },
  dateCard:       { backgroundColor: N.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.md },
  dateCardLabel:  { fontSize: 11, fontWeight: '700', color: N.onSurfaceVariant, letterSpacing: 0.8, marginBottom: 6 },
  dateHint:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  dateHintText:   { fontSize: 12, color: N.onSurfaceVariant },

  bottomBar:        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: N.outlineVariant, backgroundColor: N.background, gap: 10 },
  primaryBtn:       { height: 54, borderRadius: radius.xl, backgroundColor: N.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn:     { height: 54, borderRadius: radius.xl, borderWidth: 1.5, borderColor: N.primary, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: N.primary },

  modeScreen:         { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  modeHeading:        { fontSize: 28, fontWeight: '800', color: N.onSurface, letterSpacing: -0.5, marginBottom: spacing.xl, lineHeight: 36 },
  modeCard:           { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: N.surfaceContainerLow, borderRadius: radius.xl, borderWidth: 1.5, borderColor: N.outlineVariant, padding: spacing.md, marginBottom: spacing.md },
  modeCardAI:         { borderColor: N.primary, backgroundColor: N.secondaryContainer + '30' },
  modeCardIcon:       { width: 52, height: 52, borderRadius: 14, backgroundColor: N.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  modeCardIconAI:     { backgroundColor: N.secondaryContainer },
  modeCardBody:       { flex: 1, gap: 4 },
  modeCardTitle:      { fontSize: 15, fontWeight: '700', color: N.onSurface },
  modeCardDesc:       { fontSize: 12, color: N.onSurfaceVariant, lineHeight: 17 },
  modeCardBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: N.secondaryContainer, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  modeCardBadgeText:  { fontSize: 11, fontWeight: '700', color: N.primary },

  overlay:                { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  provinceModal:          { backgroundColor: N.surfaceContainerLow, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  modalHandle:            { width: 40, height: 4, borderRadius: 2, backgroundColor: N.outlineVariant, alignSelf: 'center', marginTop: 10, marginBottom: spacing.md },
  provinceHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  provinceTitle:          { fontSize: 18, fontWeight: '800', color: N.onSurface },
  provinceSearchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: N.background },
  provinceSearchInput:    { flex: 1, fontSize: 14, color: N.onSurface },
  provinceItem:           { paddingHorizontal: spacing.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  provinceItemActive:     { backgroundColor: N.secondaryContainer + '40' },
  provinceItemText:       { fontSize: 15, color: N.onSurface },
  provinceItemTextActive: { color: N.primary, fontWeight: '700' },

  loadingScreen:            { flex: 1, backgroundColor: N.background, alignItems: 'center' },
  loadingProgress:          { flexDirection: 'row', gap: 8, paddingTop: spacing.xl, paddingHorizontal: spacing.xl },
  loadingProgressBar:       { height: 4, width: 48, borderRadius: 4, backgroundColor: N.secondaryContainer + '40' },
  loadingProgressBarFilled: { backgroundColor: N.primary },
  loadingContent:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, maxWidth: 340, width: '100%' },
  loadingIconWrap:          { width: 96, height: 96, borderRadius: 48, backgroundColor: N.secondaryContainer + '50', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  loadingTitle:             { fontSize: 22, fontWeight: '800', color: N.onSurface, textAlign: 'center', marginBottom: spacing.sm },
  loadingSubtitle:          { fontSize: 14, color: N.onSurfaceVariant, textAlign: 'center', lineHeight: 21 },
  logBox:                   { width: '100%', backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, padding: spacing.lg, gap: 12, marginTop: spacing.xl },
  logRow:                   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logLine:                  { flex: 1, fontSize: 13, color: N.onSurface, lineHeight: 19 },
  cancelBtn:                { paddingVertical: 16, paddingHorizontal: 40 },
  cancelBtnText:            { fontSize: 14, fontWeight: '600', color: N.onSurfaceVariant },

  creditsOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  creditsCard:         { backgroundColor: N.surfaceContainerLow, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', maxWidth: 340 },
  creditsTitle:        { fontSize: 20, fontWeight: '800', color: N.onSurface, marginBottom: 10, textAlign: 'center' },
  creditsBody:         { fontSize: 14, color: N.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  creditsUpgradeBtn:   { width: '100%', backgroundColor: N.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  creditsUpgradeBtnText: { fontSize: 15, fontWeight: '700', color: N.onPrimary },
  creditsDismiss:      { paddingVertical: 10 },
  creditsDismissText:  { fontSize: 14, color: N.onSurfaceVariant },
});
