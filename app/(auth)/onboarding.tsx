import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Dimensions,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { colors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'discover',
    title: 'Khám phá trải nghiệm địa phương',
    body: 'Tìm những chuyến đi chân thực cùng người dân bản địa — không phải tour đại trà.',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
  },
  {
    key: 'connect',
    title: 'Kết nối với Local Guides',
    body: 'Người dẫn đường là người dân địa phương — họ biết những góc khuất mà không guidebook nào có.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  },
  {
    key: 'plan',
    title: 'Lên kế hoạch theo cách của bạn',
    body: 'Trip Workspace giúp bạn tổ chức toàn bộ hành trình — từ lịch trình đến ghi chú cá nhân.',
    image: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  // OTP verification state
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const { loading, signIn, signUp } = useAuth();

  const totalSlides = slides.length + 1;

  function goNext() {
    if (currentIndex < totalSlides - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  }

  async function handleAuth() {
    setError('');
    if (!email || !password) { setError('Vui lòng điền đầy đủ thông tin'); return; }
    if (!isLogin) {
      if (!fullName) { setError('Vui lòng nhập họ tên'); return; }
      if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
      if (password.length < 6) { setError('Mật khẩu phải ít nhất 6 ký tự'); return; }
    }

    if (isLogin) {
      const err = await signIn(email, password);
      if (err) {
        if (err.toLowerCase().includes('confirm') || err.toLowerCase().includes('verified')) {
          setError('Email chưa được xác nhận. Vui lòng nhập mã OTP từ email.');
          setVerifyingEmail(true);
        } else {
          setError('Email hoặc mật khẩu không đúng');
        }
        return;
      }
      router.replace('/(app)');
    } else {
      const result = await signUp(email, password, fullName);
      if (result === '__confirm_email__') {
        // Supabase sent OTP — show OTP input
        setError('');
        setVerifyingEmail(true);
        return;
      }
      if (result) {
        setError(result);
        return;
      }
      router.replace('/(app)');
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return; }
    setError('');
    setOtpLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });
    setOtpLoading(false);
    if (err) {
      setError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.');
      return;
    }
    router.replace('/(app)');
  }

  async function resendOtp() {
    setError('');
    await supabase.auth.resend({ type: 'signup', email });
    setError('');
  }

  function switchMode(login: boolean) {
    setIsLogin(login);
    setError('');
    setVerifyingEmail(false);
    setOtp('');
    setConfirmPassword('');
  }

  // ── OTP Verification Screen ──────────────────────────────────────
  function renderOtpScreen() {
    return (
      <KeyboardAvoidingView
        style={styles.slide}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setVerifyingEmail(false); setOtp(''); setError(''); }}
          >
            <Ionicons name="arrow-back-outline" size={20} color={colors.textMuted} />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.otpIcon}>
            <Ionicons name="mail-open-outline" size={48} color={colors.primary600} />
          </View>
          <Text style={styles.authTitle}>Xác nhận email</Text>
          <Text style={styles.authSubtitle}>
            Nhập mã 6 chữ số đã được gửi đến{'\n'}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</Text>
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mã OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
            />
          </View>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleVerifyOtp}
            disabled={otpLoading}
            activeOpacity={0.85}
          >
            {otpLoading
              ? <ActivityIndicator color={colors.textOnDark} />
              : <Text style={styles.ctaText}>Xác nhận</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: spacing.lg, alignItems: 'center' }}
            onPress={resendOtp}
          >
            <Text style={{ fontSize: 13, color: colors.primary600 }}>Gửi lại mã OTP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Auth Form Screen ─────────────────────────────────────────────
  function renderAuthForm() {
    return (
      <KeyboardAvoidingView
        style={styles.slide}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.authTitle}>
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isLogin ? 'Đăng nhập để tiếp tục hành trình' : 'Bắt đầu khám phá Việt Nam'}
          </Text>

          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && styles.toggleActive]}
              onPress={() => switchMode(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
              onPress={() => switchMode(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.ctaBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={colors.textOnDark} />
              : <Text style={styles.ctaText}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
            }
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: colors.primary600 }}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const renderSlide = ({ item, index }: { item: typeof slides[0] | null; index: number }) => {
    if (index === slides.length) {
      return verifyingEmail ? renderOtpScreen() : renderAuthForm();
    }

    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <View style={styles.imageOverlay} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Tiếp theo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: 12, alignItems: 'center' }}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: slides.length });
              setCurrentIndex(slides.length);
            }}
          >
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const data = [...slides, null];

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data as any[]}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bgScreen },
  slide:           { width, flex: 1 },
  imageContainer:  { height: 300, overflow: 'hidden' },
  image:           { width, height: 300, resizeMode: 'cover' },
  imageOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  content:         { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, justifyContent: 'center' },
  title:           { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md, lineHeight: 34 },
  body:            { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.xl },
  ctaBtn:          { backgroundColor: colors.primary600, paddingVertical: 16, borderRadius: radius.xl, alignItems: 'center' },
  ctaText:         { color: colors.textOnDark, fontWeight: '700', fontSize: 16 },
  dotsRow:         { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 28 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary100 },
  dotActive:       { backgroundColor: colors.primary600, width: 24 },
  authContainer:   { padding: spacing.lg, paddingTop: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  authTitle:       { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  authSubtitle:    { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  toggle:          { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.lg, padding: 4, marginBottom: spacing.lg },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md },
  toggleActive:    { backgroundColor: colors.bgCard },
  toggleText:      { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  toggleTextActive:{ color: colors.textPrimary, fontWeight: '700' },
  inputGroup:      { marginBottom: spacing.md },
  inputLabel:      { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.bgCard, paddingHorizontal: 14, paddingVertical: 3 },
  inputIcon:       { marginRight: 8 },
  input:           { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 11 },
  eyeBtn:          { padding: 6 },
  errorBox:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: radius.md, padding: 10, marginBottom: spacing.md },
  errorText:       { flex: 1, color: colors.error, fontSize: 13 },
  // OTP screen
  backBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl },
  backText:        { fontSize: 14, color: colors.textMuted },
  otpIcon:         { alignItems: 'center', marginBottom: spacing.lg },
  otpInput:        { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.bgCard, fontSize: 28, fontWeight: '700', letterSpacing: 8, paddingVertical: 16, paddingHorizontal: 14, color: colors.textPrimary, width: '100%' },
});
