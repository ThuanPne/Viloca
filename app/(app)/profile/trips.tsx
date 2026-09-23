import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ImageBackground, ActivityIndicator, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import { getCoverForDestination } from '@/src/lib/destination-covers';
import type { Trip } from '@/src/types';

const N = colors.nomad;

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function MyTripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });
      setTrips(data ?? []);
      setLoading(false);
    }
    load();
  }, []));

  function confirmDelete(trip: Trip) {
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

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={N.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến đi của tôi</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={N.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={N.outlineVariant} />
          <Text style={styles.emptyTitle}>Chưa có chuyến đi hoàn thành</Text>
          <Text style={styles.emptyHint}>Các chuyến đi đã kết thúc sẽ xuất hiện ở đây</Text>
          <TouchableOpacity style={styles.goBtn} onPress={() => router.push('/(app)/workspace')}>
            <Text style={styles.goBtnText}>Xem tất cả chuyến đi →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/trip/${item.id}`)}
              onLongPress={() => confirmDelete(item)}
              delayLongPress={500}
            >
              <View style={styles.imageWrap}>
                <ImageBackground
                  source={{ uri: getCoverForDestination(item.destination, item.id) }}
                  style={styles.image}
                  imageStyle={styles.imageStyle}
                  resizeMode="cover"
                >
                  <View style={styles.overlay} />
                  {item.is_ai_generated && (
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={11} color="#fff" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </ImageBackground>
              </View>

              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={styles.meta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={N.onSurfaceVariant} />
                    <Text style={styles.metaText}>{item.destination}</Text>
                  </View>
                  {item.start_date && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={12} color={N.onSurfaceVariant} />
                      <Text style={styles.metaText}>
                        {formatDate(item.start_date)}{item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.hint}>Giữ lâu để xóa</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: N.outlineVariant },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: N.onSurface },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.xl },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: N.onSurface, textAlign: 'center' },
  emptyHint:    { fontSize: 13, color: N.onSurfaceVariant, textAlign: 'center' },
  goBtn:        { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: N.primary },
  goBtnText:    { fontSize: 13, fontWeight: '600', color: N.primary },
  card:         { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: N.surface, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  imageWrap:    { height: 140 },
  image:        { height: 140, justifyContent: 'flex-end' },
  imageStyle:   { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  aiBadge:      { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(69,97,27,0.88)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  aiBadgeText:  { fontSize: 10, color: '#fff', fontWeight: '700' },
  info:         { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 5 },
  title:        { fontSize: 16, fontWeight: '700', color: N.onSurface },
  meta:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:     { fontSize: 12, color: N.onSurfaceVariant },
  hint:         { fontSize: 11, color: N.outlineVariant, marginTop: 2 },
});
