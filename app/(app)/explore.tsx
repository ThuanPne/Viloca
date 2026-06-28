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

// ─── Mock stories ────────────────────────────────────────────────────────────

type Story = { id: string; user: string; avatarSeed: string; isAdd?: boolean; isReel?: boolean };

const MOCK_STORIES: Story[] = [
  { id: '0', user: 'Bạn',    avatarSeed: 'me',      isAdd: true },
  { id: '1', user: 'Lan Anh', avatarSeed: 'lananh',  isReel: true },
  { id: '2', user: 'Minh Tú', avatarSeed: 'minhtu' },
  { id: '3', user: 'Hương',   avatarSeed: 'huong',   isReel: true },
  { id: '4', user: 'Đức Nam', avatarSeed: 'ducnam' },
  { id: '5', user: 'Phương',  avatarSeed: 'phuong',  isReel: true },
];

// ─── Mock posts (fallback khi DB chưa có data) ───────────────────────────────

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1', user_id: 'mock', content: 'Hội An buổi tối thật sự ma mị 🏮 Đèn lồng rực rỡ khắp phố, ngồi cà phê bên sông nghe nhạc acoustic mà không muốn về. Ai chưa đến thì phải đến một lần nhé!',
    images: ['https://picsum.photos/seed/hoian1/800/600', 'https://picsum.photos/seed/hoian2/800/600'],
    location_id: null, trip_id: null, likes_count: 84, comments_count: 17,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    profiles: { full_name: 'Lan Anh', avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=lananh' },
    post_likes: [],
  },
  {
    id: 'mock-2', user_id: 'mock', content: '🎬 Ngủ trên thuyền giữa vịnh Hạ Long — trải nghiệm không thể quên trong đời. Sáng dậy mở cửa cabin là thấy ngay cảnh này 🌊',
    images: ['https://picsum.photos/seed/halong1/800/600'],
    location_id: null, trip_id: null, likes_count: 201, comments_count: 43,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    profiles: { full_name: 'Minh Tú', avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=minhtu' },
    post_likes: [],
  },
  {
    id: 'mock-3', user_id: 'mock', content: 'Ai mà không biết Cầu Vàng thì phải biết ngay 😂 Thật ra cầu đẹp thật, chỉ tội đông khách quá. Tip: đến sớm khoảng 7h sáng sẽ vắng hơn nhiều!',
    images: ['https://picsum.photos/seed/danang1/800/600', 'https://picsum.photos/seed/danang2/800/600', 'https://picsum.photos/seed/danang3/800/600'],
    location_id: null, trip_id: null, likes_count: 136, comments_count: 29,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    profiles: { full_name: 'Hương Giang', avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=huong' },
    post_likes: [],
  },
  {
    id: 'mock-4', user_id: 'mock', content: 'Cuối tuần Hà Nội đông vui lắm 🍃 Bún chả Hàng Mành ăn xong đi bộ quanh hồ, ghé cà phê trứng nghe mưa rơi. Đó là Hà Nội của tôi.',
    images: ['https://picsum.photos/seed/hanoi1/800/600'],
    location_id: null, trip_id: null, likes_count: 57, comments_count: 8,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(), updated_at: new Date().toISOString(),
    profiles: { full_name: 'Đức Nam', avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=ducnam' },
    post_likes: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'vừa xong';
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ─── Story item ───────────────────────────────────────────────────────────────

function StoryItem({ story }: { story: Story }) {
  if (story.isAdd) {
    return (
      <TouchableOpacity style={s.storyWrap} activeOpacity={0.8} onPress={() => router.push('/post/create')}>
        <View style={[s.storyRing, { borderColor: colors.nomad.outlineVariant }]}>
          <View style={[s.storyImg, { backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="add" size={28} color={colors.nomad.primary} />
          </View>
        </View>
        <Text style={s.storyName} numberOfLines={1}>Thêm</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={s.storyWrap} activeOpacity={0.8}>
      <View style={[s.storyRing, story.isReel && { borderColor: colors.nomad.primary }]}>
        <Image source={{ uri: `https://picsum.photos/seed/${story.avatarSeed}story/160/160` }} style={s.storyImg} />
        {story.isReel && (
          <View style={s.reelBadge}>
            <Ionicons name="play" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={s.storyName} numberOfLines={1}>{story.user}</Text>
    </TouchableOpacity>
  );
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

function PostCard({ post, currentUserId, onLike, onDelete }: {
  post: Post;
  currentUserId?: string;
  onLike: (post: Post) => void;
  onDelete: (postId: string) => void;
}) {
  const [showFull, setShowFull] = useState(false);
  const liked   = post.post_likes?.some((l) => l.user_id === currentUserId) ?? false;
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
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#EF4444' : colors.nomad.onSurfaceVariant} />
          <Text style={[s.actionCount, liked && { color: '#EF4444' }]}>{post.likes_count}</Text>
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
        <TouchableOpacity style={{ padding: 4 }}>
          <Ionicons name="bookmark-outline" size={21} color={colors.nomad.onSurfaceVariant} />
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
      .select('*, post_likes(user_id), post_comments(count)')
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

  // Real posts on top, mock posts at bottom as filler
  const displayPosts: Post[] = realPosts.length > 0
    ? [...realPosts, ...MOCK_POSTS]
    : MOCK_POSTS;

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
          <Ionicons name="videocam-outline" size={18} color="#EF4444" />
          <Text style={[s.createActionText, { color: '#EF4444' }]}>Reels</Text>
        </TouchableOpacity>
        <View style={s.createDivider} />
        <TouchableOpacity style={s.createAction} onPress={() => router.push('/post/create')}>
          <Ionicons name="location-outline" size={18} color="#F59E0B" />
          <Text style={[s.createActionText, { color: '#F59E0B' }]}>Địa điểm</Text>
        </TouchableOpacity>
      </View>

      <View style={s.sectionDivider} />

      {/* Stories / Reels */}
      <View style={s.storiesSection}>
        <Text style={s.storiesTitle}>Reels & Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
          {MOCK_STORIES.map((story) => <StoryItem key={story.id} story={story} />)}
        </ScrollView>
      </View>

      <View style={s.sectionDivider} />

      {loading && (
        <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.nomad.primary} />
      )}
    </>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
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
        renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id} onLike={handleLike} onDelete={handleDelete} />}
        ItemSeparatorComponent={() => <View style={s.postDivider} />}
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
  screen:  { flex: 1, backgroundColor: colors.nomad.background },

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

  storiesSection: { backgroundColor: colors.nomad.background, paddingTop: 12 },
  storiesTitle:   { fontSize: 13, fontWeight: '700', color: colors.nomad.onSurfaceVariant, paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  storyWrap:      { alignItems: 'center', width: 68 },
  storyRing:      { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: colors.nomad.outlineVariant, padding: 2, marginBottom: 5 },
  storyImg:       { width: '100%', height: '100%', borderRadius: 28 },
  storyName:      { fontSize: 11, color: colors.nomad.onSurfaceVariant, textAlign: 'center' },
  reelBadge:      { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.nomad.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.nomad.background },

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
