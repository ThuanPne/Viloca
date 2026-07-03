import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
  StyleSheet,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/src/theme/colors';

const c = colors.nomad;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogin() {
    setError('');
    if (!email || !password) { setError('Vui lòng nhập email và mật khẩu'); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError('Email hoặc mật khẩu không đúng'); return; }
    setUser(data.user);
    router.replace('/(app)');
  }

  return (
    <View style={styles.screen}>
      {/* ── Decorative blobs ─────────────────────────────────────── */}
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo & headline ──────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <Image source={require('@/assets/viloca-logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.headlineWrap}>
              <Text style={styles.headline}>Bắt đầu hành trình</Text>
              <Text style={styles.subheadline}>Khám phá thế giới cùng Viloca hôm nay.</Text>
            </View>
          </View>

          {/* ── Form ─────────────────────────────────────────────── */}
          <View style={styles.form}>
            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={c.primary} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>ĐỊA CHỈ EMAIL</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="hello@viloca.vn"
                  placeholderTextColor={c.outlineVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => { setError(''); setEmail(v); }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={c.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={c.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => { setError(''); setPassword(v); }}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={c.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={18} color={c.onPrimary} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.7}>
              <Image source={require('@/assets/Google.png')} style={styles.googleLogo} resizeMode="contain" />
              <Text style={styles.socialBtnText}>Tiếp tục với Google</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ───────────────────────────────────────────── */}
          <View style={styles.footer}>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Chưa có tài khoản? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.signupLink}>Tham gia ngay</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.legalRow}>
              <Text style={styles.legalLink}>Điều khoản dịch vụ</Text>
              <View style={styles.legalDot} />
              <Text style={styles.legalLink}>Chính sách bảo mật</Text>
            </View>
            <Text style={styles.copyright}>© 2024 Viloca Travel. All rights reserved.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },

  // Decorative blobs
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    pointerEvents: 'none',
  },
  blobTopRight: {
    width: '70%', height: '35%',
    top: '-8%', right: '-15%',
    backgroundColor: colors.nomad.secondaryContainer,
    opacity: 0.18,
  },
  blobBottomLeft: {
    width: '55%', height: '28%',
    bottom: '-5%', left: '-12%',
    backgroundColor: colors.nomad.onPrimaryContainer,
    opacity: 0.10,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 112, height: 112,
    borderRadius: 56,
    backgroundColor: c.primary,
    opacity: 0.1,
    transform: [{ scale: 1.3 }],
  },
  logo: {
    width: 90, height: 90,
  },
  headlineWrap: {
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 15,
    color: c.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },

  // Form
  form: {
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: c.onSurfaceVariant,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.nomad.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Forgot password
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.nomad.onPrimaryContainer,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: c.primary,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryBtnLoading: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.onPrimary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.outlineVariant,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: c.outlineVariant,
    letterSpacing: 0.5,
  },

  // Social
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.nomad.surfaceContainer,
    borderRadius: 12,
    paddingVertical: 14,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.onSurfaceVariant,
  },

  // Footer
  footer: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: c.onSurface,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    color: c.onSurface,
    borderBottomWidth: 2,
    borderBottomColor: c.outlineVariant,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 11,
    fontWeight: '600',
    color: c.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  legalDot: {
    width: 3, height: 3,
    borderRadius: 9999,
    backgroundColor: c.outlineVariant,
  },
  copyright: {
    fontSize: 10,
    color: c.outline,
    opacity: 0.5,
  },
});
