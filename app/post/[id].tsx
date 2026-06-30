import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { spacing, radius, shadow } from '@/src/theme/spacing';
import type { Post, PostComment } from '@/src/types';

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

  const [post, setPost]         = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: postData }, { data: commentsData }] = await Promise.all([
        supabase.from('posts').select('*, post_likes(user_id)').eq('id', id).single(),
        supabase.from('post_comments').select('*').eq('post_id', id).order('created_at'),
      ]);

      const userIds = [...new Set([
        postData?.user_id,
        ...((commentsData ?? []).map((c: any) => c.user_id)),
      ].filter(Boolean))];

      const { data: profilesData } = await supabase
        .from('profiles').select('id, full_name, avatar_url').in('id', userIds);
      const profileMap = Object.fromEntries((profilesData ?? []).map((pr: any) => [pr.id, pr]));

      if (postData) (postData as any).profiles = profileMap[postData.user_id] ?? null;
      const comments = (commentsData ?? []).map((c: any) => ({ ...c, profiles: profileMap[c.user_id] ?? null }));

      setPost(postData as Post);
      setComments(comments as PostComment[]);
      setLoading(false);
    })();
  }, [id]);

  const liked = post?.post_likes?.some((l) => l.user_id === user?.id) ?? false;

  async function handleLike() {
    if (!post || !user) return;
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setPost({ ...post, likes_count: Math.max(0, post.likes_count - 1), post_likes: (post.post_likes ?? []).filter((l) => l.user_id !== user.id) });
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      setPost({ ...post, likes_count: post.likes_count + 1, post_likes: [...(post.post_likes ?? []), { user_id: user.id }] });
    }
  }

  async function handleShare() {
    if (!post) return;
    await Share.share({ message: `Xem bài viết trên Viloca: viloca://post/${post.id}` });
  }

  async function sendComment() {
    if (!user || !post || !newComment.trim()) return;
    setSending(true);
    const { data } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
      .select('*')
      .single();
    if (data) {
      // Cập nhật comments_count trong DB
      await supabase
        .from('posts')
        .update({ comments_count: post.comments_count + 1 })
        .eq('id', post.id);
      const commentWithProfile = {
        ...data,
        profiles: {
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      };
      setComments((prev) => [...prev, commentWithProfile as PostComment]);
      setPost((p) => p ? { ...p, comments_count: p.comments_count + 1 } : p);
      setNewComment('');
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Back bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bài viết</Text>
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
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#e74c3c' : colors.nomad.onSurfaceVariant} />
            <Text style={styles.actionText}>{post.likes_count} thích</Text>
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
          {comments.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <View style={styles.commentAvatar}>
                {c.profiles?.avatar_url
                  ? <Image source={{ uri: c.profiles.avatar_url }} style={styles.commentAvatarImg} />
                  : <Ionicons name="person" size={14} color={colors.nomad.onSurfaceVariant} />
                }
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentName}>{c.profiles?.full_name ?? 'Người dùng'}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
                <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={styles.commentInput}>
        <TextInput
          style={styles.commentTextInput}
          placeholder="Viết bình luận..."
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.nomad.surface },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, backgroundColor: colors.nomad.surface, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
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
  commentsSection:  { gap: spacing.md },
  commentsTitle:    { fontSize: 15, fontWeight: '700', color: colors.nomad.onSurface },
  noComments:       { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontStyle: 'italic' },
  commentItem:      { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  commentAvatar:    { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.nomad.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 2 },
  commentAvatarImg: { width: 28, height: 28, borderRadius: 14 },
  commentBubble:    { flex: 1, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.md, padding: spacing.sm },
  commentName:      { fontSize: 12, fontWeight: '700', color: colors.nomad.onSurface, marginBottom: 2 },
  commentText:      { fontSize: 13, color: colors.nomad.onSurface, lineHeight: 19 },
  commentTime:      { fontSize: 11, color: colors.nomad.onSurfaceVariant, marginTop: 4 },
  commentInput:     { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.nomad.outlineVariant, backgroundColor: colors.nomad.surface },
  commentTextInput: { flex: 1, backgroundColor: colors.nomad.surfaceContainerLow, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.nomad.onSurface, maxHeight: 100 },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.nomad.primary, alignItems: 'center', justifyContent: 'center' },
});
