import { useState } from 'react';
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
const ACCOMMODATIONS  = ['Homestay', 'Khách sạn', 'Camping'];
const TRANSPORTS      = ['Xe máy', 'Thuê ô tô', 'Xe khách'];
const ACTIVITY_LEVELS = ['Thư giãn', 'Vừa phải', 'Năng động'];
const BUDGETS: { label: string; value: number }[] = [
  { label: '< 300k', value: 300000 },
  { label: '300k–700k', value: 500000 },
  { label: '700k–1.5M', value: 1000000 },
  { label: '1.5M+', value: 2000000 },
];

type Step = 1 | 2 | '3a' | '3b';

function stripDiacritics(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D');
}

export default function CreateTripScreen() {
  const [step, setStep] = useState<Step>(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Step 1
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');

  // Step 3b
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 3a
  const [vibes, setVibes] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState(2);
  const [hasChildren, setHasChildren] = useState(false);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<number | null>(null);
  const [accommodation, setAccommodation] = useState('');
  const [transport, setTransport] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

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

  async function createManual() {
    if (saving) return;
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Phiên đăng nhập hết hạn'); setSaving(false); return; }

    const { data, error: err } = await supabase.from('trips').insert({
      user_id: session.user.id, title: title.trim(), destination,
      start_date: startDate || null, end_date: endDate || null,
      status: 'planning', summary_note: null, cover_image: null, is_ai_generated: false,
    }).select().single();

    setSaving(false);
    if (err) { setError('Không thể tạo trip: ' + err.message); return; }
    router.replace(`/trip/${data.id}`);
  }

  async function createWithAI() {
    if (!vibes.length) { setError('Chọn ít nhất 1 phong cách'); return; }
    if (!budget)       { setError('Chọn ngân sách dự kiến'); return; }

    setAiGenerating(true);
    setAiLogs([]);
    setError('');

    const log = (msg: string) => setAiLogs((prev) => [...prev, msg]);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Phiên đăng nhập hết hạn'); setAiGenerating(false); return; }

    log('Đang tạo chuyến đi...');
    const summaryParts = [
      hasChildren   ? 'Có trẻ em / người lớn tuổi' : null,
      accommodation ? `Lưu trú: ${accommodation}` : null,
      transport     ? `Di chuyển: ${transport}` : null,
      activityLevel ? `Mức độ: ${activityLevel}` : null,
    ].filter(Boolean);

    const { data: trip, error: tripErr } = await supabase.from('trips').insert({
      user_id: session.user.id, title: title.trim(), destination,
      start_date: null, end_date: null, status: 'planning',
      summary_note: summaryParts.length ? summaryParts.join(' · ') : null,
      cover_image: null, is_ai_generated: true,
    }).select().single();

    if (tripErr) { setError('Không thể tạo trip: ' + tripErr.message); setAiGenerating(false); return; }
    log(`✓ Đã tạo trip "${title.trim()}"`);

    log(`Đang gửi yêu cầu tới AI (${days} ngày, ${vibes.join(', ')})...`);
    const { data: plan, error: fnErr } = await supabase.functions.invoke('plan-trip', {
      body: { destination, days, budget_per_person: budget, group_size: groupSize, vibes,
        accommodation: accommodation || undefined, transport: transport || undefined,
        activity_level: activityLevel || undefined },
    });

    if (fnErr || !plan?.days) {
      let detail = fnErr?.message ?? plan?.error ?? JSON.stringify(plan);
      if (fnErr?.context) {
        try { const b = await (fnErr.context as Response).json(); detail = [b?.error, b?.detail].filter(Boolean).join(' — ') || JSON.stringify(b); } catch {}
      }
      log(`✗ ${detail}`);
      setError('AI không thể tạo lịch trình. Thử lại hoặc tạo thủ công.');
      setAiGenerating(false);
      return;
    }

    const totalSlots = (plan.days as { slots: unknown[] }[]).reduce((n, d) => n + d.slots.length, 0);
    log(`✓ AI đã lên ${plan.days.length} ngày với ${totalSlots} địa điểm`);

    log('Đang lưu lịch trình...');
    const slotMap: Record<string, 'morning' | 'afternoon' | 'evening'> = {
      'sáng': 'morning', 'chiều': 'afternoon', 'tối': 'evening',
    };
    const items = (plan.days as { day: number; slots: { location_id: string; time_slot: string; hint: string }[] }[])
      .flatMap((d) => d.slots.map((s, i) => ({
        trip_id: trip.id, location_id: s.location_id,
        day_number: d.day, time_slot: slotMap[s.time_slot] ?? 'morning',
        note: s.hint ?? null, sort_order: i,
      })));

    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from('trip_items').insert(items);
      if (itemsErr) {
        log(`✗ Lỗi lưu địa điểm: ${itemsErr.message}`);
        setError('Lưu lịch trình thất bại.');
        setAiGenerating(false);
        return;
      }
      log(`✓ Đã lưu ${items.length} địa điểm`);
    } else {
      log('⚠ AI không gợi ý được địa điểm nào');
    }

    log('Hoàn thành!');
    setAiGenerating(false);
    router.replace(`/trip/${trip.id}`);
  }

  // ── Full-screen AI loading ──
  if (aiGenerating) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="sparkles" size={52} color={colors.primary600} />
          </View>
          <Text style={styles.loadingTitle}>AI đang tạo lịch trình</Text>
          <Text style={styles.loadingSubtitle}>Đang phân tích địa điểm và tối ưu hành trình cho bạn...</Text>
          <ActivityIndicator size="small" color={colors.primary600} style={{ marginTop: spacing.lg }} />
          {aiLogs.length > 0 && (
            <View style={styles.logBox}>
              {aiLogs.map((msg, i) => (
                <Text key={i} style={styles.logLine}>{msg}</Text>
              ))}
            </View>
          )}
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
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
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
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
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

            <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Điểm đến *</Text>
            <TouchableOpacity
              style={[styles.input, styles.destPicker]}
              onPress={() => { setProvinceSearch(''); setShowProvincePicker(true); }}
            >
              <Text style={destination ? styles.destPickerText : styles.destPickerPlaceholder}>
                {destination || 'Chọn tỉnh / thành phố...'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={{ marginTop: spacing.xl }}>
              <Button label="Tiếp theo →" onPress={goStep2} />
            </View>
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionLabel}>Chọn cách tạo lịch trình</Text>

            <TouchableOpacity style={styles.methodCard} onPress={() => { setError(''); setStep('3a'); }} activeOpacity={0.85}>
              <View style={styles.methodIcon}>
                <Ionicons name="sparkles" size={28} color={colors.primary600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Tạo bằng AI</Text>
                <Text style={styles.methodDesc}>AI gợi ý lịch trình theo phong cách và ngân sách của bạn</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodCard} onPress={() => { setError(''); setStep('3b'); }} activeOpacity={0.85}>
              <View style={[styles.methodIcon, { backgroundColor: colors.secondary100 }]}>
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
          <View style={styles.stepContent}>
            <Text style={styles.inputLabel}>Phong cách chuyến đi</Text>
            <View style={styles.chipRow}>
              {VIBES.map((v) => (
                <TouchableOpacity key={v} style={[styles.chip, vibes.includes(v) && styles.chipActive]} onPress={() => toggleVibe(v)}>
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

            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Ngân sách / người / ngày</Text>
            <View style={styles.chipRow}>
              {BUDGETS.map((b) => (
                <TouchableOpacity key={b.value} style={[styles.chip, budget === b.value && styles.chipActive]} onPress={() => setBudget(b.value)}>
                  <Text style={[styles.chipText, budget === b.value && styles.chipTextActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Loại hình lưu trú</Text>
            <View style={styles.chipRow}>
              {ACCOMMODATIONS.map((a) => (
                <TouchableOpacity key={a} style={[styles.chip, accommodation === a && styles.chipActive]} onPress={() => setAccommodation(accommodation === a ? '' : a)}>
                  <Text style={[styles.chipText, accommodation === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Phương tiện di chuyển</Text>
            <View style={styles.chipRow}>
              {TRANSPORTS.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, transport === t && styles.chipActive]} onPress={() => setTransport(transport === t ? '' : t)}>
                  <Text style={[styles.chipText, transport === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Mức độ hoạt động</Text>
            <View style={styles.chipRow}>
              {ACTIVITY_LEVELS.map((l) => (
                <TouchableOpacity key={l} style={[styles.chip, activityLevel === l && styles.chipActive]} onPress={() => setActivityLevel(activityLevel === l ? '' : l)}>
                  <Text style={[styles.chipText, activityLevel === l && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Button label="✨ Tạo lịch trình AI" onPress={createWithAI} />
            </View>
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
              <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
              <Text style={styles.dateHintText}>Ngày đi có thể thêm sau trong trip</Text>
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Button label="Tạo Trip" onPress={createManual} loading={saving} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Province Picker Modal */}
      <Modal visible={showProvincePicker} animationType="slide" transparent onRequestClose={() => setShowProvincePicker(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.provinceModal}>
            <View style={styles.modalHandle} />
            <View style={styles.provinceHeader}>
              <Text style={styles.provinceTitle}>Chọn điểm đến</Text>
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
                  {destination === item && <Ionicons name="checkmark" size={16} color={colors.primary600} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: colors.bgScreen },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard },
  headerBack:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  // Step indicator
  stepRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepItem:       { flexDirection: 'row', alignItems: 'center' },
  stepDot:        { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgScreen },
  stepDotActive:  { borderColor: colors.primary600, backgroundColor: colors.primary600 },
  stepDotDone:    { borderColor: colors.secondary600, backgroundColor: colors.secondary600 },
  stepNum:        { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  stepLine:       { width: 44, height: 1.5, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineDone:   { backgroundColor: colors.secondary600 },

  // Error
  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 12, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.md },
  errorText:      { flex: 1, color: colors.error, fontSize: 13 },

  stepContent:    { paddingTop: spacing.lg },
  sectionLabel:   { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },

  // Inputs
  inputLabel:     { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgCard },
  destPicker:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  destPickerText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  destPickerPlaceholder: { fontSize: 15, color: colors.textMuted, flex: 1 },

  // Method cards
  methodCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: 12 },
  methodIcon:     { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  methodTitle:    { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  methodDesc:     { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

  // Chips
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  chipActive:     { borderColor: colors.primary600, backgroundColor: colors.primary100 },
  chipText:       { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: colors.primary600, fontWeight: '700' },

  // Stepper
  stepper:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', alignSelf: 'flex-start' },
  stepperBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard },
  stepperVal:     { paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  // Checkbox
  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:{ backgroundColor: colors.primary600, borderColor: colors.primary600 },
  checkLabel:     { fontSize: 14, color: colors.textPrimary },

  // Date
  dateHint:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dateHintText:   { fontSize: 12, color: colors.textMuted },

  // Province picker
  overlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  provinceModal:         { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  modalHandle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10, marginBottom: spacing.md },
  provinceHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  provinceTitle:         { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  provinceSearchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.bgScreen },
  provinceSearchInput:   { flex: 1, fontSize: 14, color: colors.textPrimary },
  provinceItem:          { paddingHorizontal: spacing.lg, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  provinceItemActive:    { backgroundColor: colors.primary100 },
  provinceItemText:      { fontSize: 15, color: colors.textPrimary },
  provinceItemTextActive:{ color: colors.primary600, fontWeight: '700' },

  // AI loading screen
  loadingScreen:    { flex: 1, backgroundColor: colors.bgScreen, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingContent:   { alignItems: 'center', maxWidth: 320 },
  loadingIconWrap:  { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  loadingTitle:     { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  loadingSubtitle:  { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  logBox:           { marginTop: spacing.xl, width: '100%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 6 },
  logLine:          { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
