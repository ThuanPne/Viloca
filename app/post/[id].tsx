import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
  Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { Post, PostComment, ReactionType } from '@/src/types';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like',  emoji: '👍', label: 'Thích' },
  { type: 'love',  emoji: '❤️', label: 'Yêu thích' },
  { type: 'haha',  emoji: '😂', label: 'Haha' },
  { type: 'wow',   emoji: '😮', label: 'Wow' },
  { type: 'sad',   emoji: '😢', label: 'Buồn' },
  { type: 'angry', emoji: '😡', label: 'Phẫn nộ' },
];

const REACTION_EMOJI: Record<string, string> = Object.fromEntries(REACTIONS.map((r) => [r.type, r.emoji]));

function getTopReactions(likes?: { user_id: string; reaction_type?: string }[]): { emojis: string; count: number } {
  if (!likes?.length) return { emojis: '', count: 0 };
  const counts: Record<string, number> = {};
  likes.forEach((l) => { const t = l.reaction_type ?? 'like'; counts[t] = (counts[t] ?? 0) + 1; });
  const emojis = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => REACTION_EMOJI[t] ?? '👍').join('');
  return { emojis, count: likes.length };
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'vừa xong';
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`;
  return `${Math.floor(diff / 86400)} ngày`;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [post, setPost]           = useState<Post | null>(null);
  const [comments, setComments]   = useState<PostComment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending]     = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: postData }, { data: commentsData }] = await Promise.all([
        supabase.from('posts').select('*, post_likes(user_id, reaction_type), post_saves(user_id)').eq('id', id).single(),
        supabase.from('post_comments').select('*, comment_likes(user_id)').eq('post_id', id).order('created_at'),
      ]);

      const userIds = [...new Set([
        postData?.user_id,
        ...((commentsData ?? []).map((c: any) => c.user_id)),
      ].filter(Boolean))];

      const { data: profilesData } = await supabase
        .from('profiles').select('id, full_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profilesData ?? []).map((pr: any) => [pr.id, pr]));

      if (postData) (postData as any).profiles = profileMap[postData.user_id] ?? null;
      const enrichedComments = (commentsData ?? []).map((c: any) => ({ ...c, profiles: profileMap[c.user_id] ?? null }));

      setPost(postData as Post);
      setComments(enrichedComments as PostComment[]);
      setLoading(false);
    })();
  }, [id]);

  const userReaction = post?.post_likes?.find((l) => l.user_id === user?.id)?.reaction_type;
  const isSaved      = post?.post_saves?.some((s) => s.user_id === user?.id) ?? false;
  const { emojis: reactionEmojis, count: reactionCount } = getTopReactions(post?.post_likes);

  async function handleReact(reactionType: ReactionType) {
    if (!post || !user) return;
    const existing = post.post_likes?.find((l) => l.user_id === user.id);
    if (existing) {
      if (existing.reaction_type === reactionType) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        setPost({ ...post, likes_count: Math.max(0, post.likes_count - 1), post_likes: (post.post_likes ?? []).filter((l) => l.user_id !== user.id) });
      } else {
        await supabase.from('post_likes').update({ reaction_type: reactionType }).eq('post_id', post.id).eq('user_id', user.id);
        setPost({ ...post, post_likes: (post.post_likes ?? []).map((l) => l.user_id === user.id ? { ...l, reaction_type: reactionType } : l) });
      }
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id, reaction_type: reactionType });
      setPost({ ...post, likes_count: post.likes_count + 1, post_likes: [...(post.post_likes ?? []), { user_id: user.id, reaction_type: reactionType }] });
    }
  }

  async function handleSave() {
    if (!post || !user) return;
    if (isSaved) {
      await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', user.id);
      setPost({ ...post, post_saves: (post.post_saves ?? []).filter((s) => s.user_id !== user.id) });
    } else {
      await supabase.from('post_saves').insert({ post_id: post.id, user_id: user.id });
      setPost({ ...post, post_saves: [...(post.post_saves ?? []), { user_id: user.id }] });
    }
  }

  async function handleShare() {
    if (!post) return;
    const authorName = post.profiles?.full_name ?? 'Ai đó';
    const preview    = post.content ? post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '') : 'Chia sẻ ảnh du lịch';
    await Share.share({
      title:   `${authorName} trên Viloca`,
      message: `${preview}\n\n🗺️ Xem trên Viloca: viloca://post/${post.id}`,
      url:     post.images?.[0],
    });
  }

  async function handleDeleteComment(comment: PostComment) {
    if (!user || comment.user_id !== user.id) return;
    Alert.alert('Xóa bình luận?', 'Bình luận sẽ bị xóa vĩnh viễn.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await supabase.from('post_comments').delete().eq('id', comment.id);
        setComments((prev) => prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id));
        setPost((p) => p ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p);
      }},
    ]);
  }

  async function handleCommentLike(comment: PostComment) {
    if (!user) return;
    const liked = comment.comment_likes?.some((l) => l.user_id === user.id);
    if (liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', comment.id).eq('user_id', user.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id: comment.id, user_id: user.id });
    }
    setComments((prev) => prev.map((c) => {
      if (c.id !== comment.id) return c;
      const wasLiked = c.comment_likes?.some((l) => l.user_id === user.id);
      return {
        ...c,
        comment_likes: wasLiked
          ? (c.comment_likes ?? []).filter((l) => l.user_id !== user.id)
          : [...(c.comment_likes ?? []), { user_id: user.id }],
      };
    }));
  }

  async function sendComment() {
    if (!user || !post || !newComment.trim()) return;
    setSending(true);
    const { data } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, content: newComment.trim(), parent_id: replyingTo?.id ?? null })
      .select('*')
      .single();
    if (data) {
      await supabase.from('posts').update({ comments_count: post.comments_count + 1 }).eq('id', post.id);
      const commentWithProfile = {
        ...data,
        comment_likes: [],
        profiles: {
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      };
      setComments((prev) => [...prev, commentWithProfile as PostComment]);
      setPost((p) => p ? { ...p, comments_count: p.comments_count + 1 } : p);
      setNewComment('');
      setReplyingTo(null);
    }
    setSending(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.nomad.primary} /></View>;
  }
  if (!post) {
    return <View style={styles.center}><Text style={{ color: colors.nomad.onSurfaceVariant }}>Không tìm thấy bài viết</Text></View>;
  }

  const authorName = post.profiles?.full_name ?? 'Người dùng';
  const topLevelComments = comments.filter((c) => !c.parent_id);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Back bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bài viết</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleSave}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color={isSaved ? colors.nomad.primary : colors.nomad.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Post header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            {post.profiles?.avatar_url
              ? <Image source={{ uri: post.profiles.avatar_url }} style={styles.avatarImg} />
              : <Ionicons name="person" size={20} color={colors.nomad.onSurfaceVariant} />
            }
          </View>
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>

        {/* Content */}
        {post.content ? <Text style={styles.postContent}>{post.content}</Text> : null}

        {/* Images */}
        {post.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow} contentContainerStyle={{ gap: 8 }}>
            {post.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.postImage} resizeMode="cover" />
            ))}
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleReact(userReaction as ReactionType ?? 'like')}
            onLongPress={() => setReactionPickerOpen(true)}
            delayLongPress={400}
          >
            <Text style={[styles.reactionIcon, userReaction && { color: '#EF4444' }]}>
              {userReaction ? (REACTION_EMOJI[userReaction] ?? '👍') : '🤍'}
            </Text>
            <Text style={[styles.actionText, userReaction && { color: '#EF4444' }]}>
              {reactionEmojis ? `${reactionEmojis} ${reactionCount}` : reactionCount > 0 ? `${reactionCount} thích` : 'Thích'}
            </Text>
          </TouchableOpacity>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={19} color={colors.nomad.onSurfaceVariant} />
            <Text style={styles.actionText}>{post.comments_count} bình luận</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={colors.nomad.onSurfaceVariant} />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Bình luận</Text>
          {comments.length === 0 && (
            <Text style={styles.noComments}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
          )}
          {topLevelComments.map((c) => {
            const replies = comments.filter((r) => r.parent_id === c.id);
            return (
              <View key={c.id}>
                <CommentRow
                  comment={c}
                  currentUserId={user?.id}
                  onDelete={handleDeleteComment}
                  onLike={handleCommentLike}
                  onReply={() => setReplyingTo(c)}
                />
                {replies.map((r) => (
                  <View key={r.id} style={styles.replyIndent}>
                    <CommentRow
                      comment={r}
                      currentUserId={user?.id}
                      onDelete={handleDeleteComment}
                      onLike={handleCommentLike}
                      onReply={() => setReplyingTo(c)}
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Reply indicator */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <Ionicons name="return-down-forward-outline" size={14} color={colors.nomad.primary} />
          <Text style={styles.replyBannerText} numberOfLines={1}>
            Trả lời {replyingTo.profiles?.full_name ?? 'Người dùng'}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={16} color={colors.nomad.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}

      {/* Comment input */}
      <View style={styles.commentInput}>
        <TextInput
          style={styles.commentTextInput}
          placeholder={replyingTo ? `Trả lời ${replyingTo.profiles?.full_name ?? 'Người dùng'}...` : 'Viết bình luận...'}
          placeholderTextColor={colors.nomad.onSurfaceVariant}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newComment.trim() || sending) && { opacity: 0.4 }]}
          onPress={sendComment}
          disabled={!newComment.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={colors.nomad.onPrimary} />
            : <Ionicons name="send" size={18} color={colors.nomad.onPrimary} />
          }
        </TouchableOpacity>
      </View>

      {/* Reaction picker */}
      <Modal visible={reactionPickerOpen} transparent animationType="fade" onRequestClose={() => setReactionPickerOpen(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setReactionPickerOpen(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Chọn cảm xúc</Text>
            <View style={styles.pickerRow}>
              {REACTIONS.map((r) => (
                <TouchableOpacity
                  key={r.type}
                  style={styles.pickerItem}
                  onPress={() => { handleReact(r.type); setReactionPickerOpen(false); }}
                >
                  <Text style={styles.pickerEmoji}>{r.emoji}</Text>
                  <Text style={styles.pickerLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment, currentUserId, onDelete, onLike, onReply }: {
  comment: PostComment;
  currentUserId?: string;
  onDelete: (c: PostComment) => void;
  onLike: (c: PostComment) => void;
  onReply: (c: PostComment) => void;
}) {
  const isOwn    = comment.user_id === currentUserId;
  const liked    = comment.comment_likes?.some((l) => l.user_id === currentUserId) ?? false;
  const likeCount = comment.comment_likes?.length ?? 0;

  return (
    <TouchableOpacity
      style={styles.commentItem}
      onLongPress={() => isOwn && onDelete(comment)}
      delayLongPress={500}
      activeOpacity={1}
    >
      <View style={styles.commentAvatar}>
        {comment.profiles?.avatar_url
          ? <Image source={{ uri: comment.profiles.avatar_url }} style={styles.commentAvatarImg} />
          : <Ionicons name="person" size={14} color={colors.nomad.onSurfaceVariant} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentName}>{comment.profiles?.full_name ?? 'Người dùng'}</Text>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
          <TouchableOpacity onPress={() => onReply(comment)}>
            <Text style={styles.commentAction}>Trả lời</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentLikeBtn} onPress={() => onLike(comment)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={13} color={liked ? '#EF4444' : colors.nomad.onSurfaceVariant} />
            {likeCount > 0 && <Text style={[styles.commentTime, liked && { color: '#EF4444' }]}>{likeCount}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.nomad.surface },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, backgroundColor: colors.nomad.surface, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  backBtn:          { padding: 4 },
  topTitle:         { fontSize: 16, fontWeight: '700', color: colors.nomad.onSurface },
  body:             { padding: spacing.lg, paddingBottom: 120 },
  postHeader:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar:           { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:        { width: 40, height: 40, borderRadius: 20 },
  authorName:       { fontSize: 14, fontWeight: '700', color: colors.nomad.onSurface },
  postTime:         { fontSize: 12, color: colors.nomad.onSurfaceVariant, marginTop: 1 },
  postContent:      { fontSize: 15, color: colors.nomad.onSurface, lineHeight: 23, marginBottom: spacing.md },
  imageRow:         { marginBottom: spacing.md },
  postImage:        { width: 260, height: 200, borderRadius: radius.md },
  actions:          { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant, marginBottom: spacing.lg },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText:       { fontSize: 13, color: colors.nomad.onSurfaceVariant },
  reactionIcon:     { fontSize: 18, color: colors.nomad.onSurfaceVariant },
  commentsSection:  { gap: spacing.md },
  commentsTitle:    { fontSize: 15, fontWeight: '700', color: colors.nomad.onSurface },
  noComments:       { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontStyle: 'italic' },
  commentItem:      { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: 8 },
  commentAvatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 2 },
  commentAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  commentBubble:    { backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  commentName:      { fontSize: 12, fontWeight: '700', color: colors.nomad.onSurface, marginBottom: 2 },
  commentText:      { fontSize: 13, color: colors.nomad.onSurface, lineHeight: 19 },
  commentMeta:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3, paddingLeft: 4 },
  commentTime:      { fontSize: 11, color: colors.nomad.onSurfaceVariant },
  commentAction:    { fontSize: 11, color: colors.nomad.onSurfaceVariant, fontWeight: '600' },
  commentLikeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  replyIndent:      { paddingLeft: 36 },
  replyBanner:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 7, backgroundColor: '#e8f0d8', borderTopWidth: 1, borderTopColor: colors.nomad.primary + '40' },
  replyBannerText:  { flex: 1, fontSize: 13, color: colors.nomad.primary, fontWeight: '500' },
  commentInput:     { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant, backgroundColor: colors.nomad.surface },
  commentTextInput: { flex: 1, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.nomad.onSurface, maxHeight: 100 },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center' },
  pickerOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer:  { backgroundColor: colors.nomad.surface, borderRadius: 20, padding: 20, width: '88%', maxWidth: 360 },
  pickerTitle:      { fontSize: 15, fontWeight: '700', color: colors.nomad.onSurface, textAlign: 'center', marginBottom: 16 },
  pickerRow:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 8 },
  pickerItem:       { alignItems: 'center', width: 72, paddingVertical: 8 },
  pickerEmoji:      { fontSize: 32, marginBottom: 4 },
  pickerLabel:      { fontSize: 11, color: colors.nomad.onSurfaceVariant, textAlign: 'center' },
});
