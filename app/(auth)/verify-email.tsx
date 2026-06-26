import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors } from '@/src/theme/colors';

const c = colors.nomad;

function mapOtpError(message: string): string {
  if (/rate limit/i.test(message))    return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
  if (/expired/i.test(message))       return 'Mã đã hết hạn. Vui lòng nhấn "Gửi lại mã".';
  if (/invalid/i.test(message))       return 'Mã không đúng. Vui lòng kiểm tra lại.';
  if (/sending confirmation email|confirmation email/i.test(message)) return 'Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.';
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const { email, emailPending } = useLocalSearchParams<{ email: string; emailPending?: string }>();
  const pending  = emailPending === 'true';
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [countdown, setCountdown] = useState(pending ? 0 : 60);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleVerify(token: string) {
    if (token.length < OTP_LENGTH) return;
    setLoading(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email ?? '',
      token,
      type: 'email',
    });
    setLoading(false);
    if (verifyError) {
      setError(mapOtpError(verifyError.message));
      setOtpValue('');
    } else {
      router.replace('/(app)');
    }
  }

  function handleChangeText(value: string) {
    setError('');
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpValue(digits);
    if (digits.length === OTP_LENGTH) handleVerify(digits);
  }

  async function handleResend() {
    setError('');
    const { error: resendError } = await supabase.auth.resend({ email: email ?? '', type: 'signup' });
    if (resendError) {
      setError(mapOtpError(resendError.message));
    } else {
      setCountdown(60);
    }
  }

  const digits = otpValue.split('');

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={c.onSurface} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <View style={styles.logoGlow} />
              <Image source={require('@/assets/viloca-logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.headline}>Xác nhận email</Text>
            <Text style={styles.subheadline}>Nhập mã 6 số được gửi đến</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Pending warning */}
          {pending ? (
            <View style={styles.warningBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#92400E" />
              <Text style={styles.warningText}>
                Email có thể chưa đến. Nhấn "Gửi lại mã" để thử lại.
              </Text>
            </View>
          ) : null}

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            value={otpValue}
            onChangeText={handleChangeText}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            autoFocus
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />

          {/* OTP boxes */}
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
            <View style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const filled  = digits[index] !== undefined;
                const active  = index === digits.length;
                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      (filled || active) ? styles.otpBoxActive : styles.otpBoxEmpty,
                    ]}
                  >
                    <Text style={styles.otpDigit}>{digits[index] ?? ''}</Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={c.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.primaryBtn, (otpValue.length < OTP_LENGTH || loading) && styles.primaryBtnDisabled]}
            onPress={() => handleVerify(otpValue)}
            disabled={otpValue.length < OTP_LENGTH || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Xác nhận</Text>
                <Ionicons name="checkmark" size={18} color={c.onPrimary} />
              </>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendWrap}>
            <Text style={styles.resendLabel}>Chưa nhận được mã?</Text>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Gửi lại sau <Text style={styles.countdownNum}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={styles.resendLink}>Gửi lại mã</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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

  container: { flex: 1, paddingHorizontal: 20 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: c.primary, opacity: 0.1, transform: [{ scale: 1.3 }],
  },
  logo: { width: 80, height: 80 },
  headline: { fontSize: 26, fontWeight: '700', color: c.primary, letterSpacing: -0.5, marginBottom: 8 },
  subheadline: { fontSize: 14, color: c.onSurfaceVariant, textAlign: 'center' },
  emailText: { fontSize: 14, fontWeight: '600', color: c.primary, marginTop: 4 },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  otpBoxEmpty:  { borderColor: c.outlineVariant, backgroundColor: c.surfaceContainerLow },
  otpBoxActive: { borderColor: c.primary, backgroundColor: c.onPrimaryContainer },
  otpDigit: { fontSize: 22, fontWeight: '700', color: c.onSurface },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.onPrimaryContainer, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 14, color: c.primary },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.primary, borderRadius: 12, paddingVertical: 16,
    shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4,
    marginBottom: 24,
  },
  primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: c.onPrimary },

  resendWrap: { alignItems: 'center', gap: 8 },
  resendLabel: { fontSize: 14, color: c.onSurfaceVariant },
  countdownText: { fontSize: 14, color: c.onSurfaceVariant },
  countdownNum: { fontWeight: '600', color: c.primary },
  resendLink: { fontSize: 14, fontWeight: '700', color: c.primary },
});
