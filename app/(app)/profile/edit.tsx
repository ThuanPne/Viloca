import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/src/components/ui/Avatar';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';

const N = colors.nomad;

export default function EditProfileScreen() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName,    setFullName]    = useState(user?.user_metadata?.full_name ?? '');
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [localAvatar,   setLocalAvatar]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
        .then(({ data }) => { if (data?.avatar_url) setCurrentAvatar(data.avatar_url); });
    });
  }, []);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Cần quyền truy cập thư viện ảnh'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLocalAvatar(result.assets[0].uri);
  }

  async function uploadAvatar(uid: string, uri: string): Promise<string | null> {
    const ext  = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${uid}.${ext}`;
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
    if (uploadErr) { setError('Không thể tải ảnh lên: ' + uploadErr.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    return publicUrl;
  }

  async function handleSave() {
    if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); return; }
    setSaving(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Phiên đăng nhập hết hạn'); setSaving(false); return; }
    const uid = session.user.id;

    let avatarUrl = currentAvatar;
    if (localAvatar) {
      avatarUrl = await uploadAvatar(uid, localAvatar);
      if (!avatarUrl) { setSaving(false); return; }
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', uid);
    }

    const { data, error: err } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), avatar_url: avatarUrl },
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data.user) setUser(data.user);
    router.back();
  }

  const displayUri = localAvatar ?? currentAvatar;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={N.onSurface} />
        </TouchableOpacity>
        <Text style={styles.heading}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Avatar picker */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
          <Avatar uri={displayUri} name={fullName || user?.user_metadata?.full_name} size={88} />
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Nhấn để đổi ảnh</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Họ và tên</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={(v) => { setFullName(v); setError(''); }}
        placeholder="Họ và tên"
        placeholderTextColor={N.onSurfaceVariant}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, styles.inputDisabled]}
        value={user?.email ?? ''}
        editable={false}
      />
      <Text style={styles.hint}>Email không thể thay đổi</Text>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color={N.onPrimary} />
          : <Text style={styles.saveText}>Lưu thay đổi</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: N.background },
  content:       { paddingBottom: 48 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  backBtn:       { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: N.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: N.outlineVariant },
  heading:       { fontSize: 18, fontWeight: '700', color: N.onSurface },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: 8 },
  avatarWrap:    { position: 'relative' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: N.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: N.background },
  avatarHint:    { fontSize: 12, color: N.onSurfaceVariant },
  label:         { fontSize: 13, fontWeight: '500', color: N.onSurfaceVariant, marginHorizontal: spacing.lg, marginBottom: 6, marginTop: spacing.md },
  input:         { marginHorizontal: spacing.lg, borderWidth: 1, borderColor: N.outlineVariant, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: N.onSurface, backgroundColor: N.surfaceContainerLow },
  inputDisabled: { backgroundColor: N.background, color: N.onSurfaceVariant },
  hint:          { fontSize: 11, color: N.onSurfaceVariant, marginHorizontal: spacing.lg, marginTop: 4 },
  error:         { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: spacing.md, marginHorizontal: spacing.lg },
  saveBtn:       { backgroundColor: N.primary, marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: 16, borderRadius: radius.xl, alignItems: 'center' },
  saveText:      { color: N.onPrimary, fontWeight: '600', fontSize: 16 },
});
