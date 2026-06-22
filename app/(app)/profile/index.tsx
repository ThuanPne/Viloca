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
  { icon: 'map-outline',           label: 'Chuyến đi của tôi',  value: null, route: '/(app)/workspace' },
  { icon: 'heart-outline',         label: 'Địa điểm yêu thích', value: null, route: null },
  { icon: 'star-outline',          label: 'Đánh giá của tôi',   value: null, route: null },
  { icon: 'notifications-outline', label: 'Thông báo',           value: null, route: null },
  { icon: 'shield-outline',        label: 'Quyền riêng tư',     value: null, route: null },
  { icon: 'help-circle-outline',   label: 'Trợ giúp',           value: null, route: null },
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
      // Count trips
      const { count: tCount } = await supabase
        .from('trips').select('id', { count: 'exact', head: true }).eq('user_id', uid);
      setTripCount(tCount ?? 0);
      // Count trip_items owned by this user (via trip ownership)
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
            <Ionicons name="pencil-outline" size={14} color={colors.primary600} />
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
                  <Ionicons name={item.icon as any} size={18} color={colors.primary600} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </View>
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

const styles = StyleSheet.create({
  hero:          { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  name:          { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 12 },
  email:         { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.primary600, paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, marginTop: 12 },
  editText:      { fontSize: 13, fontWeight: '500', color: colors.primary600 },
  statsRow:      { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  statItem:      { flex: 1, alignItems: 'center' },
  statValue:     { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statLabel:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  menuSection:   { marginTop: spacing.lg, marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  menuRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: spacing.md },
  menuBorder:    { borderTopWidth: 1, borderTopColor: colors.border },
  menuLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { fontSize: 14, color: colors.textPrimary },
  menuRight:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuValue:     { fontSize: 12, color: colors.textMuted },
  signOutSection:{ margin: spacing.lg },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: radius.lg },
  signOutText:   { fontSize: 15, fontWeight: '600', color: colors.error },
});
