import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, RefreshControl, Alert,
  Image, TouchableOpacity, Dimensions, Share, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import type { Post } from '@/src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'vừa xong';
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ─── Image carousel ───────────────────────────────────────────────────────────

function CarouselImage({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={[s.postSingleImg, { width: SCREEN_W }]}
      resizeMode="cover"
      fadeDuration={200}
    />
  );
}

function ImageCarousel({ images }: { images: string[] | null | undefined }) {
  const [idx, setIdx] = useState(0);
  // Supabase đôi khi trả TEXT[] dạng string thô "{url1,url2}" — parse lại
  const list: string[] = Array.isArray(images)
    ? images
    : typeof images === 'string' && (images as string).startsWith('{')
      ? (images as string).slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  if (list.length === 0) return null;
  if (list.length === 1) return <CarouselImage uri={list[0]} />;
  return (
    <View>
      <FlatList
        data={list}
        keyExtractor={(_, i) => String(i)}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
        renderItem={({ item }) => <CarouselImage uri={item} />}
      />
      <View style={s.carouselDots}>
        {list.map((_, i) => <View key={i} style={[s.carouselDot, i === idx && s.carouselDotActive]} />)}
      </View>
    </View>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onLike, onSave, onDelete }: {
  post: Post;
  currentUserId?: string;
  onLike: (post: Post) => void;
  onSave: (post: Post) => void;
  onDelete: (postId: string) => void;
}) {
  const [showFull, setShowFull] = useState(false);
  const liked   = post.post_likes?.some((l) => l.user_id === currentUserId) ?? false;
  const saved   = post.post_saves?.some((s) => s.user_id === currentUserId) ?? false;
  const isMock  = post.id.startsWith('mock-');
  const isOwn   = !isMock && post.user_id === currentUserId;
  const longText = (post.content?.length ?? 0) > 120;

  function handleMenu() {
    if (isMock) return;
    if (isOwn) {
      Alert.alert('Tùy chọn', undefined, [
        { text: 'Xóa bài viết', style: 'destructive', onPress: () => {
          Alert.alert('Xác nhận xóa', 'Bài viết sẽ bị xóa vĩnh viễn.', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa', style: 'destructive', onPress: () => onDelete(post.id) },
          ]);
        }},
        { text: 'Hủy', style: 'cancel' },
      ]);
    }
  }

  return (
    <View style={s.postCard}>
      <TouchableOpacity
        style={s.postHeader}
        onPress={() => !isMock && router.push(`/post/${post.id}`)}
        activeOpacity={isMock ? 1 : 0.85}
      >
        {post.profiles?.avatar_url
          ? <Image source={{ uri: post.profiles.avatar_url }} style={s.avatar} />
          : <View style={[s.avatar, { backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={18} color={colors.nomad.onSurfaceVariant} /></View>
        }
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.postUserName}>{post.profiles?.full_name ?? 'Người dùng'}</Text>
          <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
        {!isMock && (
          <TouchableOpacity style={{ padding: 4 }} onPress={handleMenu}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.nomad.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {post.content ? (
        <View style={s.captionWrap}>
          <Text style={s.captionText} numberOfLines={showFull || !longText ? undefined : 3}>{post.content}</Text>
          {longText && (
            <TouchableOpacity onPress={() => setShowFull(!showFull)}>
              <Text style={s.captionToggle}>{showFull ? 'Thu gọn' : 'Xem thêm'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <ImageCarousel images={post.images} />

      <View style={s.postActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onLike(post)} activeOpacity={0.7}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.error : colors.nomad.onSurfaceVariant} />
          <Text style={[s.actionCount, liked && { color: colors.error }]}>{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => !isMock && router.push(`/post/${post.id}`)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={21} color={colors.nomad.onSurfaceVariant} />
          <Text style={s.actionCount}>{post.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => Share.share({ message: `Xem bài viết trên Viloca: viloca://post/${post.id}` })} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={21} color={colors.nomad.onSurfaceVariant} />
          <Text style={s.actionCount}>Chia sẻ</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 4 }} onPress={() => onSave(post)}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={saved ? colors.nomad.primary : colors.nomad.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);

  const [realPosts, setRealPosts]     = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);

  async function fetchPosts(from = 0, append = false, isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else if (from === 0) setLoading(true); else setLoadingMore(true);

    const { data: postsData } = await supabase
      .from('posts')
      .select('*, post_likes(user_id), post_saves(user_id), post_comments(count)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const posts = (postsData ?? []) as any[];

    if (posts.length > 0) {
      // Dùng count thực từ post_comments thay vì cột comments_count (không có trigger cập nhật)
      posts.forEach((p) => {
        p.comments_count = p.post_comments?.[0]?.count ?? p.comments_count ?? 0;
      });

      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      const profileMap = Object.fromEntries((profilesData ?? []).map((pr: any) => [pr.id, pr]));
      posts.forEach((p) => { p.profiles = profileMap[p.user_id] ?? null; });
    }

    if (append) setRealPosts((prev) => [...prev, ...posts]); else setRealPosts(posts);
    setHasMore(posts.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }

  useFocusEffect(useCallback(() => { fetchPosts(); }, []));

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchPosts(realPosts.length, true);
  }, [realPosts.length, hasMore, loadingMore]);

  const displayPosts: Post[] = realPosts;

  async function handleLike(post: Post) {
    if (!user || post.id.startsWith('mock-')) return;
    const liked = post.post_likes?.some((l) => l.user_id === user.id);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    setRealPosts((prev) => prev.map((p) => {
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

  async function handleSave(post: Post) {
    if (!user || post.id.startsWith('mock-')) return;
    const wasSaved = post.post_saves?.some((s) => s.user_id === user.id);
    // Optimistic update first
    setRealPosts((prev) => prev.map((p) => {
      if (p.id !== post.id) return p;
      return {
        ...p,
        post_saves: wasSaved
          ? (p.post_saves ?? []).filter((s) => s.user_id !== user.id)
          : [...(p.post_saves ?? []), { user_id: user.id }],
      };
    }));
    const { error } = wasSaved
      ? await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', user.id)
      : await supabase.from('post_saves').insert({ post_id: post.id, user_id: user.id });
    if (error) {
      // Revert optimistic update on failure
      setRealPosts((prev) => prev.map((p) => {
        if (p.id !== post.id) return p;
        return {
          ...p,
          post_saves: wasSaved
            ? [...(p.post_saves ?? []), { user_id: user.id }]
            : (p.post_saves ?? []).filter((s) => s.user_id !== user.id),
        };
      }));
    }
  }

  async function handleDelete(postId: string) {
    await supabase.from('posts').delete().eq('id', postId);
    setRealPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  const ListHeader = (
    <>
      {/* Create post bar */}
      <View style={s.createBar}>
        <View style={[s.avatarSm, { backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="person" size={18} color={colors.nomad.onSurfaceVariant} />
        </View>
        <TouchableOpacity style={s.createInput} activeOpacity={0.7} onPress={() => router.push('/post/create')}>
          <Text style={s.createPlaceholder}>Bạn vừa đi đâu về? Chia sẻ ngay!</Text>
        </TouchableOpacity>
      </View>
      <View style={s.createActions}>
        <TouchableOpacity style={s.createAction} onPress={() => router.push('/post/create')}>
          <Ionicons name="images-outline" size={18} color={colors.nomad.primary} />
          <Text style={s.createActionText}>Ảnh</Text>
        </TouchableOpacity>
        <View style={s.createDivider} />
        <TouchableOpacity style={s.createAction} onPress={() => router.push('/post/create')}>
          <Ionicons name="videocam-outline" size={18} color={colors.error} />
          <Text style={[s.createActionText, { color: colors.error }]}>Reels</Text>
        </TouchableOpacity>
        <View style={s.createDivider} />
        <TouchableOpacity style={s.createAction} onPress={() => router.push('/post/create')}>
          <Ionicons name="location-outline" size={18} color={colors.warning} />
          <Text style={[s.createActionText, { color: colors.warning }]}>Địa điểm</Text>
        </TouchableOpacity>
      </View>

      <View style={s.sectionDivider} />

      {loading && (
        <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.nomad.primary} />
      )}
    </>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Background decoration */}
      <View style={s.blobTopRight}   pointerEvents="none" />
      <View style={s.blobBottomLeft} pointerEvents="none" />
      <Image
        source={require('@/assets/viloca-logo.png')}
        style={s.watermark}
        resizeMode="contain"
        pointerEvents="none"
      />

      <View style={s.header}>
        <Text style={s.headerTitle}>Khám phá</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity><Ionicons name="search-outline" size={24} color={colors.nomad.onSurface} /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color={colors.nomad.onSurface} /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id} onLike={handleLike} onSave={handleSave} onDelete={handleDelete} />}
        ItemSeparatorComponent={() => <View style={s.postDivider} />}
        ListEmptyComponent={!loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <Ionicons name="newspaper-outline" size={40} color={colors.nomad.outlineVariant} />
            <Text style={{ fontSize: 14, color: colors.nomad.onSurfaceVariant }}>Chưa có bài viết nào</Text>
            <Text style={{ fontSize: 12, color: colors.nomad.outlineVariant }}>Hãy là người đầu tiên chia sẻ!</Text>
          </View>
        ) : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color={colors.nomad.primary} /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPosts(0, false, true)}
            colors={[colors.nomad.primary]}
            tintColor={colors.nomad.primary}
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.nomad.background, overflow: 'hidden' },
  blobTopRight:   { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.nomad.secondaryContainer, opacity: 0.28 },
  blobBottomLeft: { position: 'absolute', bottom: 60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.nomad.primary, opacity: 0.07 },
  watermark:      { position: 'absolute', bottom: 24, right: 20, width: 88, height: 88, opacity: 0.05 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.nomad.background,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.nomad.outlineVariant,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.nomad.onSurface },

  createBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  avatarSm:  { width: 38, height: 38, borderRadius: 19 },
  createInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.nomad.surfaceContainer, borderRadius: 24 },
  createPlaceholder: { fontSize: 14, color: colors.nomad.onSurfaceVariant },
  createActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  createAction:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  createActionText: { fontSize: 13, fontWeight: '600', color: colors.nomad.primary },
  createDivider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: colors.nomad.outlineVariant },
  sectionDivider: { height: 8, backgroundColor: colors.nomad.surfaceContainer },


  postCard:    { backgroundColor: colors.nomad.background },
  postDivider: { height: 8, backgroundColor: colors.nomad.surfaceContainer },
  postHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  avatar:      { width: 40, height: 40, borderRadius: 20 },
  postUserName: { fontSize: 14, fontWeight: '700', color: colors.nomad.onSurface },
  postTime:     { fontSize: 11, color: colors.nomad.onSurfaceVariant, marginTop: 1 },

  captionWrap:   { paddingHorizontal: 14, paddingBottom: 10 },
  captionText:   { fontSize: 14, color: colors.nomad.onSurface, lineHeight: 20 },
  captionToggle: { fontSize: 13, color: colors.nomad.onSurfaceVariant, marginTop: 2, fontWeight: '600' },

  postSingleImg:     { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: colors.nomad.surfaceContainer },
  carouselDots:      { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  carouselDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.nomad.outlineVariant },
  carouselDotActive: { backgroundColor: colors.nomad.primary, width: 16 },

  postActions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6, paddingVertical: 6 },
  actionCount: { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontWeight: '500' },
});
