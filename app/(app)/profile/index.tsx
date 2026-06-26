import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/src/hooks/useAuth';
import { Avatar } from '@/src/components/ui/Avatar';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';

const MENU_ITEMS = [
  { icon: 'map-outline',           label: 'Chuyến đi của tôi',  route: '/(app)/workspace' },
  { icon: 'heart-outline',         label: 'Địa điểm yêu thích', route: null },
  { icon: 'star-outline',          label: 'Đánh giá của tôi',   route: null },
  { icon: 'notifications-outline', label: 'Thông báo',           route: null },
  { icon: 'shield-outline',        label: 'Quyền riêng tư',     route: null },
  { icon: 'help-circle-outline',   label: 'Trợ giúp',           route: null },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { signOut, loading } = useAuth();
  const [tripCount, setTripCount]   = useState(0);
  const [placeCount, setPlaceCount] = useState(0);

  const name  = user?.user_metadata?.full_name ?? 'Traveler';
  const email = user?.email ?? '';

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const { count: tCount } = await supabase
        .from('trips').select('id', { count: 'exact', head: true }).eq('user_id', uid);
      setTripCount(tCount ?? 0);
      const { data: userTrips } = await supabase.from('trips').select('id').eq('user_id', uid);
      if (userTrips && userTrips.length > 0) {
        const tripIds = userTrips.map((t: { id: string }) => t.id);
        const { count: pCount } = await supabase
          .from('trip_items').select('id', { count: 'exact', head: true }).in('trip_id', tripIds);
        setPlaceCount(pCount ?? 0);
      }
    }
    loadStats();
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.hero}>
          <Avatar name={name} size={80} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/(app)/profile/edit')}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.nomad.primary} />
            <Text style={styles.editText}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Chuyến đi', value: String(tripCount) },
            { label: 'Địa điểm',  value: String(placeCount) },
            { label: 'Đánh giá',  value: '0' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i > 0 && styles.menuBorder]}
              onPress={item.route ? () => router.push(item.route as any) : undefined}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={18} color={colors.nomad.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.nomad.outlineVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={loading}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.signOutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const n = colors.nomad;
const styles = StyleSheet.create({
  hero:          { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  name:          { fontSize: 22, fontWeight: '700', color: n.onSurface, marginTop: 12 },
  email:         { fontSize: 13, color: n.onSurfaceVariant, marginTop: 2 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: n.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, marginTop: 12 },
  editText:      { fontSize: 13, fontWeight: '500', color: n.primary },
  statsRow:      { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: n.surfaceContainer, borderRadius: radius.lg, borderWidth: 1, borderColor: n.outlineVariant, padding: spacing.md },
  statItem:      { flex: 1, alignItems: 'center' },
  statValue:     { fontSize: 20, fontWeight: '700', color: n.onSurface },
  statLabel:     { fontSize: 11, color: n.onSurfaceVariant, marginTop: 2 },
  menuSection:   { marginTop: spacing.lg, marginHorizontal: spacing.lg, backgroundColor: n.surfaceContainer, borderRadius: radius.lg, borderWidth: 1, borderColor: n.outlineVariant },
  menuRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: spacing.md },
  menuBorder:    { borderTopWidth: 1, borderTopColor: n.outlineVariant },
  menuLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: n.onPrimaryContainer, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { fontSize: 14, color: n.onSurface },
  signOutSection:{ margin: spacing.lg },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: radius.lg },
  signOutText:   { fontSize: 15, fontWeight: '600', color: colors.error },
});
