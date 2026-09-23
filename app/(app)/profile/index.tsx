import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/src/hooks/useAuth';
import { Avatar } from '@/src/components/ui/Avatar';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';

const MENU_ITEMS = [
  { icon: 'grid-outline',          label: 'Bài viết & Đã lưu',  route: '/(app)/profile/posts' },
  { icon: 'map-outline',           label: 'Chuyến đi của tôi',  route: '/(app)/profile/trips' },
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
  const [userPlan, setUserPlan]     = useState<'free' | 'pro'>('free');
  const [aiCredits, setAiCredits]   = useState(0);
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);

  const name  = user?.user_metadata?.full_name ?? 'Traveler';
  const email = user?.email ?? '';

  useFocusEffect(useCallback(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      // Plan + credits
      const { data: profile } = await supabase
        .from('profiles').select('plan, ai_credits_remaining, avatar_url').eq('id', uid).single();
      if (profile) {
        setUserPlan(profile.plan ?? 'free');
        setAiCredits(profile.ai_credits_remaining ?? 0);
        setAvatarUrl(profile.avatar_url ?? null);
      }
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
  }, []));

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/onboarding');
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.hero}>
          <Avatar uri={avatarUrl} name={name} size={80} />
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

        {/* Plan card */}
        <View style={styles.planCard}>
          <View style={styles.planLeft}>
            <View style={[styles.planBadge, userPlan === 'pro' && styles.planBadgePro]}>
              <Text style={[styles.planBadgeText, userPlan === 'pro' && styles.planBadgeTextPro]}>
                {userPlan === 'pro' ? '✦ Pro' : 'Free'}
              </Text>
            </View>
            {userPlan === 'free' && (
              <Text style={styles.planCredits}>{aiCredits} lượt giúp đỡ còn lại</Text>
            )}
          </View>
          {userPlan === 'free' && (
            <TouchableOpacity style={styles.planUpgradeBtn}>
              <Text style={styles.planUpgradeText}>Nâng cấp Pro →</Text>
            </TouchableOpacity>
          )}
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

const styles = StyleSheet.create({
  hero:          { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  name:          { fontSize: 22, fontWeight: '700', color: colors.nomad.onSurface, marginTop: 12 },
  email:         { fontSize: 13, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.nomad.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, marginTop: 12 },
  editText:      { fontSize: 13, fontWeight: '500', color: colors.nomad.primary },
  statsRow:      { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.outlineVariant, padding: spacing.md },
  statItem:      { flex: 1, alignItems: 'center' },
  statValue:     { fontSize: 20, fontWeight: '700', color: colors.nomad.onSurface },
  statLabel:     { fontSize: 11, color: colors.nomad.onSurfaceVariant, marginTop: 2 },
  planCard:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.outlineVariant, paddingHorizontal: spacing.md, paddingVertical: 12 },
  planLeft:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planBadge:         { backgroundColor: colors.nomad.surfaceContainer, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  planBadgePro:      { backgroundColor: colors.nomad.primary },
  planBadgeText:     { fontSize: 12, fontWeight: '700', color: colors.nomad.onSurfaceVariant },
  planBadgeTextPro:  { color: colors.nomad.onPrimary },
  planCredits:       { fontSize: 12, color: colors.nomad.onSurfaceVariant },
  planUpgradeBtn:    { backgroundColor: colors.nomad.secondaryContainer, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  planUpgradeText:   { fontSize: 12, fontWeight: '700', color: colors.nomad.primary },
  menuSection:   { marginTop: spacing.lg, marginHorizontal: spacing.lg, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.nomad.outlineVariant },
  menuRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: spacing.md },
  menuBorder:    { borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant },
  menuLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon:      { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.nomad.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { fontSize: 14, color: colors.nomad.onSurface },
  signOutSection:{ margin: spacing.lg },
  signOutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.error + '14', paddingVertical: 14, borderRadius: radius.lg },
  signOutText:   { fontSize: 15, fontWeight: '600', color: colors.error },
});
