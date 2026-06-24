import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/src/components/ui/Avatar';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';
import supabase from '@/src/lib/supabase';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); return; }
    setSaving(true);
    setError('');
    const { data, error: err } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data.user) setUser(data.user);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.avatarSection}>
        <Avatar name={fullName || user?.user_metadata?.full_name} size={80} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Họ và tên</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={(v) => { setFullName(v); setError(''); }}
        placeholder="Họ và tên"
        placeholderTextColor={colors.textMuted}
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
          ? <ActivityIndicator color={colors.textOnDark} />
          : <Text style={styles.saveText}>Lưu thay đổi</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bgScreen },
  content:      { paddingBottom: 48 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.xl },
  backBtn:      { width: 38, height: 38, borderRadius: radius.lg, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  heading:      { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  avatarSection:{ alignItems: 'center', paddingVertical: spacing.lg },
  label:        { fontSize: 13, fontWeight: '500', color: colors.textMuted, marginHorizontal: spacing.lg, marginBottom: 6, marginTop: spacing.md },
  input:        { marginHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.bgCard },
  inputDisabled:{ backgroundColor: colors.bgScreen, color: colors.textMuted },
  hint:         { fontSize: 11, color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: 4 },
  error:        { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: spacing.md },
  saveBtn:      { backgroundColor: colors.primary600, marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: 16, borderRadius: radius.xl, alignItems: 'center' },
  saveText:     { color: colors.textOnDark, fontWeight: '600', fontSize: 16 },
});
