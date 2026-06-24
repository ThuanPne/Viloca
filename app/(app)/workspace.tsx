import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
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

function tripCoverUrl(trip: Trip) {
  return trip.cover_image ?? `https://picsum.photos/seed/trip-${trip.id}/400/200`;
}

export default function WorkspaceScreen() {
  const user = useAuthStore((s) => s.user);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', destination: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

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

  async function createTrip() {
    if (!form.title.trim()) { setCreateError('Vui lòng nhập tên chuyến đi'); return; }
    if (!form.destination.trim()) { setCreateError('Vui lòng nhập điểm đến'); return; }

    setCreating(true);
    setCreateError('');

    // Use session directly to ensure JWT is attached to the request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCreating(false);
      setCreateError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const { data, error } = await supabase.from('trips').insert({
      user_id:      session.user.id,
      title:        form.title.trim(),
      destination:  form.destination.trim(),
      start_date:   null,
      end_date:     null,
      status:       'planning',
      summary_note: null,
      cover_image:  null,
    }).select().single();

    setCreating(false);

    if (error) {
      setCreateError('Không thể tạo trip: ' + error.message);
      return;
    }

    setTrips([data, ...trips]);
    setShowModal(false);
    resetForm();
    router.push(`/trip/${data.id}`);
  }

  function resetForm() {
    setForm({ title: '', destination: '' });
    setCreateError('');
  }

  function openModal() {
    resetForm();
    setShowModal(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary600} />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Trip Workspace</Text>
          <Text style={styles.subheading}>{trips.length} chuyến đi của bạn</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.aiBtn} onPress={() => alert('Tính năng AI đang được phát triển. Thử lại sau!')}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary600} />
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
            >
              <Image source={{ uri: tripCoverUrl(item) }} style={styles.tripImage} />
              <View style={styles.tripOverlay} />
              <View style={styles.tripBadge}>
                <Badge label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.tripDest}>📍 {item.destination}</Text>
                {item.start_date ? (
                  <Text style={styles.tripDate}>
                    {formatDate(item.start_date)} {item.end_date ? `→ ${formatDate(item.end_date)}` : ''}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Trip Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Trip mới</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {createError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
                <Text style={styles.errorText}>{createError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Tên chuyến đi *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Hội An cuối tuần"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />

            <Text style={styles.inputLabel}>Điểm đến *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Hội An, Quảng Nam"
              placeholderTextColor={colors.textMuted}
              value={form.destination}
              onChangeText={(v) => setForm({ ...form, destination: v })}
            />

            <View style={styles.dateHint}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={styles.dateHintText}>Ngày đi có thể thêm sau trong trip</Text>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Button label="Tạo Trip" onPress={createTrip} loading={creating} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  heading:       { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subheading:    { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBtn:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.primary600, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  aiText:        { color: colors.primary600, fontWeight: '600', fontSize: 14 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary600, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  addText:       { color: colors.textOnDark, fontWeight: '600', fontSize: 14 },
  tripCard:    { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.bgCard, elevation: 2 },
  tripImage:   { width: '100%', height: 180, resizeMode: 'cover' },
  tripOverlay: { ...StyleSheet.absoluteFillObject as any, height: 180, backgroundColor: 'rgba(0,0,0,0.2)' },
  tripBadge:   { position: 'absolute', top: 12, right: 12 },
  tripInfo:    { padding: spacing.md },
  tripTitle:   { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  tripDest:    { fontSize: 13, color: colors.textMuted },
  tripDate:    { fontSize: 12, color: colors.primary600, marginTop: 4, fontWeight: '500' },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:       { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:   { flex: 1, color: colors.error, fontSize: 13 },
  inputLabel:   { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: spacing.md },
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgScreen },
  dateHint:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  dateHintText: { fontSize: 12, color: colors.textMuted },
});
