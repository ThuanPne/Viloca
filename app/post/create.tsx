import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';

const MAX_IMAGES = 5;

export default function CreatePostScreen() {
  const user = useAuthStore((s) => s.user);
  const [content, setContent]   = useState('');
  const [images, setImages]     = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  async function uploadImage(uri: string, userId: string): Promise<string | null> {
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const arrayBuffer = await fetch(uri).then((r) => r.arrayBuffer());
    const { error } = await supabase.storage
      .from('post-images')
      .upload(filename, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('post-images').getPublicUrl(filename);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!content.trim() && images.length === 0) {
      Alert.alert('Bài viết trống', 'Vui lòng nhập nội dung hoặc chọn ảnh.');
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of images) {
        const url = await uploadImage(uri, user.id);
        if (url) uploadedUrls.push(url);
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim() || null,
        images: uploadedUrls,
      });

      if (error) {
        Alert.alert('Lỗi', 'Không thể đăng bài. Vui lòng thử lại.');
      } else {
        router.back();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài viết mới</Text>
        <TouchableOpacity
          style={[styles.submitBtn, uploading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator size="small" color={colors.nomad.onPrimary} />
            : <Text style={styles.submitText}>Đăng</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          multiline
          placeholder="Bạn vừa đi đâu về? Chia sẻ trải nghiệm..."
          placeholderTextColor={colors.nomad.onSurfaceVariant}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
          autoFocus
        />

        {/* Image previews */}
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow} contentContainerStyle={{ gap: 8 }}>
            {images.map((uri) => (
              <View key={uri} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Pick image button */}
        {images.length < MAX_IMAGES && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
            <Ionicons name="image-outline" size={22} color={colors.nomad.primary} />
            <Text style={styles.addImageText}>
              {images.length === 0 ? 'Thêm ảnh' : `Thêm ảnh (${images.length}/${MAX_IMAGES})`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.nomad.surface },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.nomad.outlineVariant },
  headerBtn:    { padding: 4 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: colors.nomad.onSurface },
  submitBtn:    { backgroundColor: colors.nomad.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  submitText:   { color: colors.nomad.onPrimary, fontWeight: '700', fontSize: 14 },
  body:         { padding: spacing.lg, gap: spacing.lg },
  input:        { minHeight: 140, fontSize: 15, color: colors.nomad.onSurface, lineHeight: 23 },
  imageRow:     { marginTop: spacing.sm },
  imageWrap:    { position: 'relative' },
  previewImage: { width: 120, height: 120, borderRadius: radius.md },
  removeBtn:    { position: 'absolute', top: 4, right: 4 },
  addImageBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.nomad.primary, borderRadius: radius.lg, borderStyle: 'dashed', alignSelf: 'flex-start' },
  addImageText: { fontSize: 14, color: colors.nomad.primary, fontWeight: '600' },
});
