import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, StyleSheet,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors } from '@/src/theme/colors';

const c = colors.nomad;

type PasswordConditions = {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

function getPasswordConditions(password: string): PasswordConditions {
  return {
    minLength: password.length >= 8,
    hasUpper:  /[A-Z]/.test(password),
    hasLower:  /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function getPasswordStrength(conditions: PasswordConditions): number {
  const count = Object.values(conditions).filter(Boolean).length;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count === 4) return 3;
  return 4;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const STRENGTH_CONFIG = [
  { label: 'Yếu',      color: '#DC2626' },
  { label: 'Yếu',      color: '#DC2626' },
  { label: 'Trung bình', color: '#F97316' },
  { label: 'Mạnh',     color: '#EAB308' },
  { label: 'Rất mạnh', color: '#16A34A' },
];

const CONDITION_LABELS = [
  { key: 'minLength' as const, label: 'Ít nhất 8 ký tự' },
  { key: 'hasUpper'  as const, label: 'Có chữ hoa (A-Z)' },
  { key: 'hasLower'  as const, label: 'Có chữ thường (a-z)' },
  { key: 'hasNumber' as const, label: 'Có số (0-9)' },
  { key: 'hasSpecial' as const, label: 'Có ký tự đặc biệt (!@#...)' },
];

function mapAuthError(message: string): string {
  if (/rate limit/i.test(message))   return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
  if (/already registered/i.test(message)) return 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.';
  if (/invalid email/i.test(message)) return 'Địa chỉ email không hợp lệ.';
  if (/password/i.test(message))      return 'Mật khẩu không đáp ứng yêu cầu bảo mật.';
  if (/sending confirmation email|confirmation email/i.test(message)) return 'Email không tồn tại. Vui lòng kiểm tra lại.';
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName]                         = useState('');
  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const [emailError, setEmailError]             = useState('');
  const [submitted, setSubmitted]               = useState(false);

  const conditions      = getPasswordConditions(password);
  const strength        = password.length > 0 ? getPasswordStrength(conditions) : 0;
  const allConditionsMet = Object.values(conditions).every(Boolean);
  const passwordsMatch  = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid     = name.trim().length > 0 && validateEmail(email) && allConditionsMet && passwordsMatch;

  function handleFieldChange(setter: (v: string) => void, clearEmailError = false) {
    return (value: string) => {
      setError('');
      if (clearEmailError) setEmailError('');
      setter(value);
    };
  }

  async function handleRegister() {
    setSubmitted(true);
    if (!passwordsMatch) return;
    setEmailError('');
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);

    if (authError) {
      if (/sending confirmation email|confirmation email/i.test(authError.message)) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email, emailPending: 'true' } });
        return;
      }
      if (/already registered/i.test(authError.message)) {
        setEmailError('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.');
        return;
      }
      setError(mapAuthError(authError.message));
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setEmailError('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.');
      return;
    }

    if (data.session) {
      router.replace('/(app)');
    } else if (data.user) {
      router.replace({ pathname: '/(auth)/verify-email', params: { email } });
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={c.onSurface} />
            </TouchableOpacity>
          </Link>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <Image source={require('@/assets/viloca-logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.headlineWrap}>
              <Text style={styles.headline}>Tạo tài khoản</Text>
              <Text style={styles.subheadline}>Bắt đầu hành trình khám phá của bạn.</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={c.primary} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>HỌ VÀ TÊN</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={c.outlineVariant}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={name}
                  onChangeText={handleFieldChange(setName)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>ĐỊA CHỈ EMAIL</Text>
              <View style={[styles.inputRow, emailError ? styles.inputRowError : null]}>
                <Ionicons name="mail-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="hello@viloca.vn"
                  placeholderTextColor={c.outlineVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={handleFieldChange(setEmail, true)}
                />
              </View>
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu của bạn"
                  placeholderTextColor={c.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handleFieldChange(setPassword)}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.outline} />
                </TouchableOpacity>
              </View>

              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: strength >= level ? STRENGTH_CONFIG[strength].color : c.outlineVariant },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: STRENGTH_CONFIG[strength].color }]}>
                    {STRENGTH_CONFIG[strength].label}
                  </Text>
                  <View style={styles.conditionList}>
                    {CONDITION_LABELS.map(({ key, label }) => (
                      <View key={key} style={styles.conditionRow}>
                        <Ionicons
                          name={conditions[key] ? 'checkmark-circle' : 'close-circle-outline'}
                          size={14}
                          color={conditions[key] ? '#16A34A' : c.outlineVariant}
                        />
                        <Text style={[styles.conditionText, { color: conditions[key] ? '#16A34A' : c.onSurfaceVariant }]}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>NHẬP LẠI MẬT KHẨU</Text>
              <View style={[styles.inputRow, submitted && !passwordsMatch ? styles.inputRowError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={c.outlineVariant}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={handleFieldChange(setConfirmPassword)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.outline} />
                </TouchableOpacity>
              </View>
              {submitted && !passwordsMatch ? (
                <Text style={styles.fieldError}>Mật khẩu không khớp</Text>
              ) : null}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryBtn, (!isFormValid || loading) && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={!isFormValid || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Tạo tài khoản</Text>
                  <Ionicons name="arrow-forward" size={18} color={c.onPrimary} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },

  blob: { position: 'absolute', borderRadius: 9999, pointerEvents: 'none' },
  blobTopRight: {
    width: '70%', height: '35%', top: '-8%', right: '-15%',
    backgroundColor: c.secondaryContainer, opacity: 0.18,
  },
  blobBottomLeft: {
    width: '55%', height: '28%', bottom: '-5%', left: '-12%',
    backgroundColor: c.onPrimaryContainer, opacity: 0.10,
  },

  scroll: { flexGrow: 1, paddingHorizontal: 20 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: c.primary, opacity: 0.1, transform: [{ scale: 1.3 }],
  },
  logo: { width: 80, height: 80 },
  headlineWrap: { alignItems: 'center', gap: 6 },
  headline: { fontSize: 26, fontWeight: '700', color: c.primary, letterSpacing: -0.5, textAlign: 'center' },
  subheadline: { fontSize: 14, color: c.onSurfaceVariant, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  form: { gap: 14 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.onPrimaryContainer, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 14, color: c.primary },

  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: c.onSurfaceVariant, letterSpacing: 0.8, marginLeft: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surfaceContainerLow,
    borderRadius: 12, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden',
  },
  inputRowError: { borderColor: '#DC2626' },
  inputIcon: { marginLeft: 16, marginRight: 4 },
  input: { flex: 1, fontSize: 16, color: c.onSurface, paddingHorizontal: 12, paddingVertical: 16 },
  eyeBtn: { paddingHorizontal: 16, paddingVertical: 16 },
  fieldError: { fontSize: 12, color: '#DC2626', marginLeft: 4 },

  strengthWrap: { marginTop: 10, gap: 6 },
  strengthBars: { flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600' },
  conditionList: { gap: 4, marginTop: 2 },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conditionText: { fontSize: 12 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: 12, paddingVertical: 16, marginTop: 8,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: c.onPrimary },

  footer: { alignItems: 'center', marginTop: 32 },
  loginRow: { flexDirection: 'row', alignItems: 'center' },
  loginText: { fontSize: 15, color: c.onSurface },
  loginLink: { fontSize: 15, fontWeight: '700', color: c.onSurface, borderBottomWidth: 2, borderBottomColor: c.outlineVariant },
});
