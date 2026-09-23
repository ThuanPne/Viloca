import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/src/components/ui/ScreenWrapper';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';
import type { Post } from '@/src/types';

const SCREEN_W = Dimensions.get('window').width;
const POST_CELL = (SCREEN_W - spacing.lg * 2 - 4) / 3;

type Tab = 'mine' | 'saved';

export default function PostsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [loading, setLoading]     = useState(true);
  const [userPosts,  setUserPosts]  = useState<Pick<Post, 'id' | 'images' | 'content' | 'likes_count' | 'comments_count'>[]>([]);
  const [savedPosts, setSavedPosts] = useState<{ id: string; images: string[]; content: string | null; likes_count: number }[]>([]);

  useFocusEffect(useCallback(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const [postsRes, savesRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, images, content, likes_count, comments_count')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_saves')
          .select('post_id')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }),
      ]);

      setUserPosts(postsRes.data ?? []);

      const postIds = (savesRes.data ?? []).map((s: any) => s.post_id).filter(Boolean);
      if (postIds.length > 0) {
        const { data: savedPostsData } = await supabase
          .from('posts')
          .select('id, images, content, likes_count')
          .in('id', postIds);
        setSavedPosts(savedPostsData ?? []);
      } else {
        setSavedPosts([]);
      }
      setLoading(false);
    }
    load();
  }, []));

  async function handleDeletePost(postId: string) {
    await supabase.from('posts').delete().eq('id', postId);
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function confirmDelete(postId: string) {
    Alert.alert('Xóa bài viết', 'Bài viết sẽ bị xóa vĩnh viễn.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => handleDeletePost(postId) },
    ]);
  }

  function getThumb(images: string[]): string | null {
    const imgList: string[] = Array.isArray(images)
      ? images
      : typeof images === 'string' && (images as string).startsWith('{')
        ? (images as string).slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    return imgList[0] ?? null;
  }

  const list = activeTab === 'mine' ? userPosts : savedPosts;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết</Text>
        {activeTab === 'mine' ? (
          <TouchableOpacity onPress={() => router.push('/post/create')} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={22} color={colors.nomad.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {/* Tab pills */}
      <View style={styles.tabs}>
        {([['mine', 'Của tôi'], ['saved', 'Đã lưu']] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.nomad.primary} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name={activeTab === 'mine' ? 'camera-outline' : 'bookmark-outline'}
            size={40}
            color={colors.nomad.outlineVariant}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'mine' ? 'Chưa có bài viết nào' : 'Chưa có bài lưu nào'}
          </Text>
          <Text style={styles.emptyHint}>
            {activeTab === 'mine'
              ? 'Nhấn + để đăng bài viết đầu tiên'
              : 'Nhấn 🔖 trên bài viết trong Khám phá để lưu lại'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
          {list.map((post) => {
            const thumb = getThumb(post.images);
            return (
              <TouchableOpacity
                key={post.id}
                style={styles.cell}
                activeOpacity={0.8}
                onPress={() => router.push(`/post/${post.id}` as any)}
                onLongPress={activeTab === 'mine' ? () => confirmDelete(post.id) : undefined}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.cellImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.cellImg, styles.cellNoImg]}>
                    <Ionicons name="text-outline" size={20} color={colors.nomad.onSurfaceVariant} />
                  </View>
                )}
                <View style={styles.cellOverlay}>
                  <Ionicons name="heart" size={11} color="#fff" />
                  <Text style={styles.cellStat}>{post.likes_count}</Text>
                </View>
                {activeTab === 'mine' && (
                  <View style={styles.cellDeleteHint}>
                    <Ionicons name="ellipsis-vertical" size={12} color="rgba(255,255,255,0.7)" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: colors.nomad.onSurface },
  tabs:          { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  tab:           { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.full, backgroundColor: colors.nomad.surfaceContainerLow, borderWidth: 1, borderColor: colors.nomad.outlineVariant },
  tabActive:     { backgroundColor: colors.nomad.primary, borderColor: colors.nomad.primary },
  tabText:       { fontSize: 13, fontWeight: '600', color: colors.nomad.onSurfaceVariant },
  tabTextActive: { color: colors.nomad.onPrimary },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: spacing.xl },
  emptyText:     { fontSize: 14, fontWeight: '600', color: colors.nomad.onSurface, textAlign: 'center' },
  emptyHint:     { fontSize: 12, color: colors.nomad.onSurfaceVariant, textAlign: 'center' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  cell:          { width: POST_CELL, height: POST_CELL, borderRadius: radius.sm, overflow: 'hidden', position: 'relative' },
  cellImg:       { width: '100%', height: '100%' },
  cellNoImg:     { backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  cellOverlay:   { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  cellStat:      { fontSize: 10, color: '#fff', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  cellDeleteHint:{ position: 'absolute', top: 4, right: 4 },
});
