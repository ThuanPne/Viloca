import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Image, TouchableOpacity, TextInput, Pressable,
  Dimensions, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mock data ───────────────────────────────────────────────────────────────

type Post = {
  id: string;
  user: { name: string; avatarSeed: string };
  location: string;
  time: string;
  caption: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  type: 'photo' | 'reel';
};

type Story = {
  id: string;
  user: string;
  avatarSeed: string;
  isAdd?: boolean;
  isReel?: boolean;
};

const MOCK_STORIES: Story[] = [
  { id: '0', user: 'Bạn', avatarSeed: 'me', isAdd: true },
  { id: '1', user: 'Lan Anh', avatarSeed: 'lananh', isReel: true },
  { id: '2', user: 'Minh Tú', avatarSeed: 'minhtu' },
  { id: '3', user: 'Hương', avatarSeed: 'huong', isReel: true },
  { id: '4', user: 'Đức Nam', avatarSeed: 'ducnam' },
  { id: '5', user: 'Phương', avatarSeed: 'phuong', isReel: true },
];

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    user: { name: 'Lan Anh', avatarSeed: 'lananh' },
    location: 'Phố cổ Hội An, Quảng Nam',
    time: '2 giờ trước',
    caption: 'Hội An buổi tối thật sự ma mị 🏮 Đèn lồng rực rỡ khắp phố, ngồi cà phê bên sông nghe nhạc acoustic mà không muốn về. Ai chưa đến thì phải đến một lần nhé!',
    images: [
      'https://picsum.photos/seed/hoian1/800/600',
      'https://picsum.photos/seed/hoian2/800/600',
    ],
    likes: 84,
    comments: 17,
    isLiked: false,
    type: 'photo',
  },
  {
    id: '2',
    user: { name: 'Minh Tú', avatarSeed: 'minhtu' },
    location: 'Vịnh Hạ Long, Quảng Ninh',
    time: '5 giờ trước',
    caption: '🎬 Reels | Ngủ trên thuyền giữa vịnh Hạ Long — trải nghiệm không thể quên trong đời. Sáng dậy mở cửa cabin là thấy ngay cảnh này 🌊',
    images: ['https://picsum.photos/seed/halong1/800/600'],
    likes: 201,
    comments: 43,
    isLiked: true,
    type: 'reel',
  },
  {
    id: '3',
    user: { name: 'Hương Giang', avatarSeed: 'huong' },
    location: 'Cầu Vàng, Đà Nẵng',
    time: 'Hôm qua',
    caption: 'Ai mà không biết Cầu Vàng thì phải biết ngay 😂 Thật ra cầu đẹp thật, chỉ tội đông khách quá. Tip: đến sớm khoảng 7h sáng sẽ vắng hơn nhiều!',
    images: [
      'https://picsum.photos/seed/danang1/800/600',
      'https://picsum.photos/seed/danang2/800/600',
      'https://picsum.photos/seed/danang3/800/600',
    ],
    likes: 136,
    comments: 29,
    isLiked: false,
    type: 'photo',
  },
  {
    id: '4',
    user: { name: 'Đức Nam', avatarSeed: 'ducnam' },
    location: 'Phố đi bộ Hồ Gươm, Hà Nội',
    time: '2 ngày trước',
    caption: 'Cuối tuần Hà Nội đông vui lắm 🍃 Bún chả Hàng Mành ăn xong đi bộ quanh hồ, ghé cà phê trứng nghe mưa rơi. Đó là Hà Nội của tôi.',
    images: ['https://picsum.photos/seed/hanoi1/800/600'],
    likes: 57,
    comments: 8,
    isLiked: false,
    type: 'photo',
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function Avatar({ seed, size = 36 }: { seed: string; size?: number }) {
  return (
    <Image
      source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&size=${size * 2}` }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.nomad.surfaceContainer }}
    />
  );
}

function StoryItem({ story }: { story: Story }) {
  if (story.isAdd) {
    return (
      <TouchableOpacity style={s.storyWrap} activeOpacity={0.8}>
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
        <Image
          source={{ uri: `https://picsum.photos/seed/${story.avatarSeed}story/160/160` }}
          style={s.storyImg}
        />
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

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 1) {
    return (
      <Image source={{ uri: images[0] }} style={s.postSingleImg} resizeMode="cover" />
    );
  }
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
        }}
      >
        {images.map((img, i) => (
          <Image key={i} source={{ uri: img }} style={[s.postSingleImg, { width: SCREEN_W }]} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={s.carouselDots}>
        {images.map((_, i) => (
          <View key={i} style={[s.carouselDot, i === idx && s.carouselDotActive]} />
        ))}
      </View>
    </View>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const captionLong = post.caption.length > 120;

  return (
    <View style={s.postCard}>
      {/* Header */}
      <View style={s.postHeader}>
        <Avatar seed={post.user.avatarSeed} size={40} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.postUserName}>{post.user.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={11} color={colors.nomad.primary} />
            <Text style={s.postLocation} numberOfLines={1}>{post.location}</Text>
            <Text style={s.postTime}> · {post.time}</Text>
          </View>
        </View>
        {post.type === 'reel' && (
          <View style={s.reelTag}>
            <Ionicons name="play-circle-outline" size={14} color={colors.nomad.primary} />
            <Text style={s.reelTagText}>Reel</Text>
          </View>
        )}
        <TouchableOpacity style={{ padding: 4 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.nomad.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={s.captionWrap}>
        <Text style={s.captionText} numberOfLines={showFullCaption || !captionLong ? undefined : 3}>
          {post.caption}
        </Text>
        {captionLong && (
          <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
            <Text style={s.captionToggle}>{showFullCaption ? 'Thu gọn' : 'Xem thêm'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Images */}
      <ImageCarousel images={post.images} />

      {/* Actions */}
      <View style={s.postActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onLike(post.id)} activeOpacity={0.7}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={post.isLiked ? '#EF4444' : colors.nomad.onSurfaceVariant}
          />
          <Text style={[s.actionCount, post.isLiked && { color: '#EF4444' }]}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={21} color={colors.nomad.onSurfaceVariant} />
          <Text style={s.actionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
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

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  function handleLike(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Khám phá</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={24} color={colors.nomad.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.nomad.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Create post bar */}
            <View style={s.createBar}>
              <Avatar seed="me" size={38} />
              <TouchableOpacity style={s.createInput} activeOpacity={0.7}>
                <Text style={s.createPlaceholder}>Bạn vừa đi đâu về? Chia sẻ ngay!</Text>
              </TouchableOpacity>
            </View>
            <View style={s.createActions}>
              <TouchableOpacity style={s.createAction}>
                <Ionicons name="images-outline" size={18} color={colors.nomad.primary} />
                <Text style={s.createActionText}>Ảnh</Text>
              </TouchableOpacity>
              <View style={s.createDivider} />
              <TouchableOpacity style={s.createAction}>
                <Ionicons name="videocam-outline" size={18} color="#EF4444" />
                <Text style={[s.createActionText, { color: '#EF4444' }]}>Reels</Text>
              </TouchableOpacity>
              <View style={s.createDivider} />
              <TouchableOpacity style={s.createAction}>
                <Ionicons name="location-outline" size={18} color="#F59E0B" />
                <Text style={[s.createActionText, { color: '#F59E0B' }]}>Địa điểm</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={s.sectionDivider} />

            {/* Stories / Reels */}
            <View style={s.storiesSection}>
              <Text style={s.storiesTitle}>Reels & Stories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}
              >
                {MOCK_STORIES.map((story) => (
                  <StoryItem key={story.id} story={story} />
                ))}
              </ScrollView>
            </View>

            <View style={s.sectionDivider} />
          </>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onLike={handleLike} />
        )}
        ItemSeparatorComponent={() => <View style={s.postDivider} />}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.nomad.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.nomad.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.nomad.outlineVariant,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.nomad.onSurface },

  // Create post
  createBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    backgroundColor: colors.nomad.background,
  },
  createInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.nomad.surfaceContainer,
    borderRadius: 24,
  },
  createPlaceholder: { fontSize: 14, color: colors.nomad.onSurfaceVariant },
  createActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: colors.nomad.background,
  },
  createAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  createActionText: { fontSize: 13, fontWeight: '600', color: colors.nomad.primary },
  createDivider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: colors.nomad.outlineVariant },

  sectionDivider: { height: 8, backgroundColor: colors.nomad.surfaceContainer },

  // Stories
  storiesSection: { backgroundColor: colors.nomad.background, paddingTop: 12 },
  storiesTitle:   { fontSize: 13, fontWeight: '700', color: colors.nomad.onSurfaceVariant, paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  storyWrap:      { alignItems: 'center', width: 68 },
  storyRing: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2.5, borderColor: colors.nomad.outlineVariant,
    padding: 2, marginBottom: 5,
  },
  storyImg:     { width: '100%', height: '100%', borderRadius: 28 },
  storyName:    { fontSize: 11, color: colors.nomad.onSurfaceVariant, textAlign: 'center' },
  reelBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.nomad.primary,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.nomad.background,
  },

  // Post
  postCard:    { backgroundColor: colors.nomad.background },
  postDivider: { height: 8, backgroundColor: colors.nomad.surfaceContainer },
  postHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
  },
  postUserName: { fontSize: 14, fontWeight: '700', color: colors.nomad.onSurface },
  postLocation: { fontSize: 11, color: colors.nomad.primary, flex: 1 },
  postTime:     { fontSize: 11, color: colors.nomad.onSurfaceVariant },
  reelTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.nomad.secondaryContainer,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginRight: 6,
  },
  reelTagText: { fontSize: 11, fontWeight: '600', color: colors.nomad.primary },

  captionWrap:   { paddingHorizontal: 14, paddingBottom: 10 },
  captionText:   { fontSize: 14, color: colors.nomad.onSurface, lineHeight: 20 },
  captionToggle: { fontSize: 13, color: colors.nomad.onSurfaceVariant, marginTop: 2, fontWeight: '600' },

  postSingleImg: { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: colors.nomad.surfaceContainer },

  carouselDots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  carouselDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.nomad.outlineVariant },
  carouselDotActive: { backgroundColor: colors.nomad.primary, width: 16 },

  postActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6, paddingVertical: 6 },
  actionCount: { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontWeight: '500' },
});
