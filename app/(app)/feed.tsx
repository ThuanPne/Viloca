import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, ScrollView, Share,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { spacing, radius, shadow } from '@/src/theme/spacing';
import type { Post } from '@/src/types';

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
}

function PostCard({ post, currentUserId, onLike }: {
  post: Post;
  currentUserId: string | undefined;
  onLike: (post: Post) => void;
}) {
  const liked = post.post_likes?.some((l) => l.user_id === currentUserId) ?? false;
  const name = post.profiles?.full_name ?? 'Người dùng';
  const avatar = post.profiles?.avatar_url;

  async function handleShare() {
    await Share.share({ message: `Xem bài viết trên Viloca: viloca://post/${post.id}` });
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => router.push(`/post/${post.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          {avatar
            ? <Image source={{ uri: avatar }} style={styles.avatarImg} />
            : <Ionicons name="person" size={20} color={colors.nomad.onSurfaceVariant} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardTime}>{timeAgo(post.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {post.content ? (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.9}>
          <Text style={styles.cardContent} numberOfLines={4}>{post.content}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Images */}
      {post.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          contentContainerStyle={{ gap: 6 }}
        >
          {post.images.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.9}>
              <Image source={{ uri }} style={styles.postImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post)}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#e74c3c' : colors.nomad.onSurfaceVariant}
          />
          <Text style={styles.actionCount}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}`)}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.nomad.onSurfaceVariant} />
          <Text style={styles.actionCount}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={colors.nomad.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  async function fetchPosts(from = 0, append = false) {
    if (from === 0) setLoading(true); else setLoadingMore(true);

    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url), post_likes(user_id)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const fetched = (data ?? []) as Post[];
    if (append) setPosts((prev) => [...prev, ...fetched]);
    else setPosts(fetched);
    setHasMore(fetched.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => { fetchPosts(); }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPosts(posts.length, true);
  }, [posts.length, hasMore, loadingMore]);

  async function handleLike(post: Post) {
    if (!user) return;
    const liked = post.post_likes?.some((l) => l.user_id === user.id);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    setPosts((prev) => prev.map((p) => {
      if (p.id !== post.id) return p;
      const wasLiked = p.post_likes?.some((l) => l.user_id === user.id);
      return {
        ...p,
        likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1,
        post_likes: wasLiked
          ? (p.post_likes ?? []).filter((l) => l.user_id !== user.id)
          : [...(p.post_likes ?? []), { user_id: user.id }],
      };
    }));
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.nomad.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cộng đồng</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/post/create')}>
          <Ionicons name="create-outline" size={22} color={colors.nomad.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} currentUserId={user?.id} onLike={handleLike} />
        )}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color={colors.nomad.primary} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={colors.nomad.outlineVariant} />
            <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
            <Text style={styles.emptySub}>Hãy là người đầu tiên chia sẻ trải nghiệm du lịch!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/post/create')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={colors.nomad.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.nomad.surface },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, backgroundColor: colors.nomad.surface, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: colors.nomad.onSurface },
  createBtn:    { padding: 6 },
  list:         { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  card:         { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  avatar:       { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:    { width: 36, height: 36, borderRadius: 18 },
  cardName:     { fontSize: 13, fontWeight: '600', color: colors.nomad.onSurface },
  cardTime:     { fontSize: 11, color: colors.nomad.onSurfaceVariant, marginTop: 1 },
  cardContent:  { fontSize: 14, color: colors.nomad.onSurface, lineHeight: 21, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  imageScroll:  { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  postImage:    { width: 200, height: 160, borderRadius: radius.md },
  cardActions:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount:  { fontSize: 12, color: colors.nomad.onSurfaceVariant },
  empty:        { alignItems: 'center', paddingVertical: 80, gap: spacing.md },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: colors.nomad.onSurface },
  emptySub:     { fontSize: 13, color: colors.nomad.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 40 },
  fab:          { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
});
