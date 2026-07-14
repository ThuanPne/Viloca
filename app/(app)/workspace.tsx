import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ImageBackground, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Badge } from '@/src/components/ui/Badge';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import { getCoverForDestination } from '@/src/lib/destination-covers';
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

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function tripCoverUrl(trip: Trip) {
  return getCoverForDestination(trip.destination, trip.id);
}

const N = colors.nomad;

export default function WorkspaceScreen() {
  const user = useAuthStore((s) => s.user);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={N.primary} />
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
          <TouchableOpacity style={styles.aiBtn} onPress={() => router.push('/create-trip')}>
            <Ionicons name="sparkles-outline" size={16} color={N.primary} />
            <Text style={styles.aiText}>AI Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/create-trip')}>
            <Ionicons name="add" size={20} color={N.onPrimary} />
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
          onCta={() => router.push('/create-trip')}
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: 16 }}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchTrips}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tripCard}
              activeOpacity={0.92}
              onPress={() => router.push(`/trip/${item.id}`)}
              onLongPress={() => confirmDeleteTrip(item)}
              delayLongPress={500}
            >
              {/* ── Ảnh phía trên ── */}
              <View style={styles.tripImageWrap}>
                <ImageBackground
                  source={{ uri: tripCoverUrl(item) }}
                  style={styles.tripImage}
                  imageStyle={styles.tripImageStyle}
                  resizeMode="cover"
                />
                <View style={styles.tripBadgeWrap}>
                  <Badge label={STATUS_LABEL[item.status]} color={STATUS_COLOR[item.status]} />
                  {item.is_ai_generated && (
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={11} color="#fff" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ── Thông tin phía dưới ── */}
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.tripMeta}>
                  <View style={styles.tripMetaItem}>
                    <Ionicons name="location-outline" size={12} color={N.onSurfaceVariant} />
                    <Text style={styles.tripMetaText}>{item.destination}</Text>
                  </View>
                  {item.start_date && (
                    <View style={styles.tripMetaItem}>
                      <Ionicons name="calendar-outline" size={12} color={N.onSurfaceVariant} />
                      <Text style={styles.tripMetaText}>
                        {formatDate(item.start_date)}{item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  heading:       { fontSize: 22, fontWeight: '800', color: N.onSurface },
  subheading:    { fontSize: 13, color: N.onSurfaceVariant, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBtn:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: N.primary, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  aiText:        { color: N.primary, fontWeight: '600', fontSize: 14 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: N.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.xl, gap: 4 },
  addText:       { color: N.onPrimary, fontWeight: '600', fontSize: 14 },

  tripCard:        { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: N.surface, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  tripImageWrap:   { height: 160, position: 'relative' },
  tripImage:       { height: 160 },
  tripImageStyle:  { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  tripBadgeWrap:   { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadge:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(69,97,27,0.88)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  aiBadgeText:     { fontSize: 10, color: '#fff', fontWeight: '700' },
  tripInfo:        { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 6 },
  tripTitle:       { fontSize: 17, fontWeight: '800', color: N.onSurface, lineHeight: 22 },
  tripMeta:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tripMetaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText:    { fontSize: 12, color: N.onSurfaceVariant, fontWeight: '500' },
});
