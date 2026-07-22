import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import supabase from '@/src/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import type { PostVisibility } from '@/src/types';

const MAX_IMAGES      = 5;
const MAX_FILE_BYTES  = 10 * 1024 * 1024; // 10MB — khớp server limit
const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // 30MB tổng
const ALLOWED_MIME    = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type ImageAsset = { uri: string; mimeType: string; ext: string; base64: string };
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

function estimateBytes(base64: string): number {
  return Math.floor(base64.length * 0.75);
}

export default function CreatePostScreen() {
  const user = useAuthStore((s) => s.user);
  const { trip_id } = useLocalSearchParams<{ trip_id?: string }>();

  const [content, setContent]       = useState('');
  const [images, setImages]         = useState<ImageAsset[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>('public');

  const xhrRefs = useRef<XMLHttpRequest[]>([]);

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_IMAGES - images.length,
      base64: true,
    });
    if (result.canceled) return;

    const rawAssets: ImageAsset[] = result.assets.map((a) => {
      const mime = a.mimeType ?? 'image/jpeg';
      const ext  = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : 'jpg';
      return { uri: a.uri, mimeType: mime === 'image/heic' ? 'image/jpeg' : mime, ext, base64: a.base64 ?? '' };
    });

    // 1. Lọc MIME không hợp lệ
    const invalidMime = rawAssets.filter((a) => !ALLOWED_MIME.has(a.mimeType));
    if (invalidMime.length) {
      Alert.alert('Định dạng không hỗ trợ', `${invalidMime.length} ảnh bị bỏ qua. Chỉ hỗ trợ JPG, PNG, WebP, GIF.`);
    }
    const validMime = rawAssets.filter((a) => ALLOWED_MIME.has(a.mimeType));

    // 2. Lọc file quá lớn
    const tooLarge = validMime.filter((a) => estimateBytes(a.base64) > MAX_FILE_BYTES);
    if (tooLarge.length) {
      Alert.alert('Ảnh quá lớn', `${tooLarge.length} ảnh vượt quá 10MB và bị bỏ qua.`);
    }
    const validSize = validMime.filter((a) => estimateBytes(a.base64) <= MAX_FILE_BYTES);

    // 3. Kiểm tra tổng dung lượng
    const existingBytes = images.reduce((s, a) => s + estimateBytes(a.base64), 0);
    const newBytes      = validSize.reduce((s, a) => s + estimateBytes(a.base64), 0);
    if (existingBytes + newBytes > MAX_TOTAL_BYTES) {
      Alert.alert('Tổng dung lượng quá lớn', 'Tổng ảnh không được vượt quá 30MB.');
      return;
    }

    if (validSize.length > 0) {
      setImages((prev) => [...prev, ...validSize].slice(0, MAX_IMAGES));
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((a) => a.uri !== uri));
  }

  function uploadImageXHR(
    asset: ImageAsset,
    filename: string,
    token: string,
    anonKey: string,
    supabaseUrl: string,
    onStatusChange: (status: UploadStatus) => void,
  ): Promise<boolean> {
    if (!asset.base64) return Promise.resolve(false);

    const binary = atob(asset.base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhrRefs.current.push(xhr);
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/post-images/${filename}`, true);
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', asset.mimeType);
      xhr.timeout = 30000;
      xhr.upload.onprogress = () => onStatusChange('uploading');
      xhr.onload    = () => {
        const ok = xhr.status < 300;
        onStatusChange(ok ? 'done' : 'error');
        resolve(ok);
      };
      xhr.onerror   = () => { onStatusChange('error'); resolve(false); };
      xhr.ontimeout = () => { onStatusChange('error'); resolve(false); };
      xhr.send(bytes.buffer);
    });
  }

  async function handleSubmit() {
    if (!user) return;
    if (!content.trim() && images.length === 0) {
      Alert.alert('Bài viết trống', 'Vui lòng nhập nội dung hoặc chọn ảnh.');
      return;
    }

    // Kiểm tra session trước khi upload
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.', [
        { text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login' as any) },
        { text: 'Hủy', style: 'cancel' },
      ]);
      return;
    }
    const token      = sessionData.session.access_token;
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const anonKey    = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

    setUploading(true);
    setUploadStatus(images.map(() => 'idle'));
    xhrRefs.current = [];

    let posted = false;
    try {
      const statusArr: UploadStatus[] = images.map(() => 'idle');

      const results = await Promise.all(
        images.map((asset, i) => {
          const filename = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${asset.ext}`;
          return uploadImageXHR(asset, filename, token, anonKey, supabaseUrl, (status) => {
            statusArr[i] = status;
            setUploadStatus([...statusArr]);
          }).then((ok) =>
            ok ? `${supabaseUrl}/storage/v1/object/public/post-images/${filename}` : null
          );
        })
      );

      const uploadedUrls = results.filter((u): u is string => u !== null);
      const failedCount  = results.filter((r) => r === null).length;

      if (images.length > 0 && uploadedUrls.length === 0) {
        Alert.alert('Lỗi upload ảnh', 'Không thể tải ảnh lên. Vui lòng thử lại.');
        return;
      }

      // Thất bại một phần — hỏi user
      if (failedCount > 0 && uploadedUrls.length > 0) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            `${failedCount} ảnh không upload được`,
            `Đăng bài với ${uploadedUrls.length} ảnh còn lại?`,
            [
              { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Đăng', onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
      }

      const { error } = await supabase.from('posts').insert({
        user_id:    user.id,
        content:    content.trim() || null,
        images:     uploadedUrls,
        trip_id:    trip_id ?? null,
        visibility,
      });

      if (error) {
        Alert.alert('Lỗi', 'Không thể đăng bài. Vui lòng thử lại.');
      } else {
        posted = true;
      }
    } finally {
      setUploading(false);
      setUploadStatus([]);
      xhrRefs.current = [];
    }
    if (posted) router.back();
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
        {trip_id && (
          <View style={styles.tripBanner}>
            <Ionicons name="map-outline" size={16} color={colors.nomad.primary} />
            <Text style={styles.tripBannerText}>Bài viết sẽ được gắn với chuyến đi của bạn</Text>
          </View>
        )}

        {/* Visibility picker */}
        <View style={styles.visibilityRow}>
          {([
            { value: 'public',  label: 'Công khai', icon: 'earth-outline' },
            { value: 'friends', label: 'Bạn bè',    icon: 'people-outline' },
            { value: 'only_me', label: 'Chỉ mình',  icon: 'lock-closed-outline' },
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.visChip, visibility === opt.value && styles.visChipActive]}
              onPress={() => setVisibility(opt.value)}
              activeOpacity={0.75}
            >
              <Ionicons name={opt.icon} size={14} color={visibility === opt.value ? colors.nomad.primary : colors.nomad.onSurfaceVariant} />
              <Text style={[styles.visChipText, visibility === opt.value && styles.visChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Image previews with upload status */}
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow} contentContainerStyle={{ gap: 8 }}>
            {images.map((asset, i) => {
              const status = uploadStatus[i];
              return (
                <View key={asset.uri} style={styles.imageWrap}>
                  <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
                  {!uploading && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(asset.uri)}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {status === 'uploading' && (
                    <View style={styles.statusOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  {status === 'done' && (
                    <View style={[styles.statusOverlay, { backgroundColor: 'rgba(69,97,27,0.6)' }]}>
                      <Ionicons name="checkmark" size={22} color="#fff" />
                    </View>
                  )}
                  {status === 'error' && (
                    <View style={[styles.statusOverlay, { backgroundColor: 'rgba(239,68,68,0.6)' }]}>
                      <Ionicons name="close" size={22} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Pick image button */}
        {images.length < MAX_IMAGES && !uploading && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
            <Ionicons name="image-outline" size={22} color={colors.nomad.primary} />
            <Text style={styles.addImageText}>
              {images.length === 0 ? 'Thêm ảnh' : `Thêm ảnh (${images.length}/${MAX_IMAGES})`}
            </Text>
          </TouchableOpacity>
        )}

        {/* File size info */}
        {images.length > 0 && (
          <Text style={styles.sizeHint}>
            {`Dung lượng: ${(images.reduce((s, a) => s + estimateBytes(a.base64), 0) / 1024 / 1024).toFixed(1)}MB / 30MB`}
          </Text>
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
  statusOverlay: { position: 'absolute', inset: 0, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  addImageBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.nomad.primary, borderRadius: radius.lg, borderStyle: 'dashed', alignSelf: 'flex-start' },
  addImageText: { fontSize: 14, color: colors.nomad.primary, fontWeight: '600' },
  sizeHint:     { fontSize: 11, color: colors.nomad.onSurfaceVariant },
  tripBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f0d8', borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.nomad.primary + '40' },
  tripBannerText: { fontSize: 13, color: colors.nomad.primary, fontWeight: '500', flex: 1 },
  visibilityRow:     { flexDirection: 'row', gap: 8 },
  visChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.nomad.outlineVariant, backgroundColor: colors.nomad.surfaceContainer },
  visChipActive:     { borderColor: colors.nomad.primary, backgroundColor: '#e8f0d8' },
  visChipText:       { fontSize: 13, color: colors.nomad.onSurfaceVariant, fontWeight: '500' },
  visChipTextActive: { color: colors.nomad.primary, fontWeight: '700' },
});
