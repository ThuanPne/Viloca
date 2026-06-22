import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError('Email hoặc mật khẩu không đúng');
      return;
    }
    setUser(data.user);
    router.replace('/(app)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f9ff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#0077b6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            {/* Image Placeholder */}
            <View className="items-center mb-6">
              <View
                style={{
                  width: 160,
                  height: 120,
                  backgroundColor: '#e8e4f8',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="image-outline" size={28} color="#9b8fcc" />
              </View>
            </View>

            {/* Title */}
            <View className="items-center mb-6">
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#005d90',
                  textAlign: 'center',
                  letterSpacing: -0.5,
                  marginBottom: 6,
                }}
              >
                Bắt đầu hành trình
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: '#404850',
                  textAlign: 'center',
                }}
              >
                Khám phá thế giới cùng Viloca
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View
                style={{
                  backgroundColor: '#ffdad6',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: '#93000a', fontSize: 14, textAlign: 'center' }}>{error}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#404850',
                  marginBottom: 6,
                  letterSpacing: 0.2,
                }}
              >
                Email của bạn
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f1f4f9',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1.5,
                  borderColor: '#f1f4f9',
                }}
              >
                <Ionicons name="mail-outline" size={20} color="#707881" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#181c20' }}
                  placeholder="email@vidu.com"
                  placeholderTextColor="#bfc7d1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(v) => { setError(''); setEmail(v); }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#404850',
                  marginBottom: 6,
                  letterSpacing: 0.2,
                }}
              >
                Mật khẩu
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f1f4f9',
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderWidth: 1.5,
                  borderColor: '#f1f4f9',
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#707881" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#181c20' }}
                  placeholder="••••••••"
                  placeholderTextColor="#bfc7d1"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => { setError(''); setPassword(v); }}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#707881"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
              <Text style={{ color: '#005d90', fontSize: 14, fontWeight: '600' }}>
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#6aafe6' : '#005d90',
                borderRadius: 9999,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 24,
              }}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>
                  Đăng nhập
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e8' }} />
              <Text style={{ marginHorizontal: 12, color: '#707881', fontSize: 14 }}>
                Hoặc tiếp tục với
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e8' }} />
            </View>

            {/* Social Buttons */}
            <View style={{ marginBottom: 28 }}>
              <TouchableOpacity
                style={{
                  borderWidth: 1.5,
                  borderColor: '#e0e3e8',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 10,
                  backgroundColor: '#ffffff',
                }}
                activeOpacity={0.7}
              >
                <AntDesign name="google" size={22} color="#4285F4" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#181c20' }}>
                  Tiếp tục với Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#404850', fontSize: 15 }}>Chưa có tài khoản? </Text>
              <Link href="/(auth)/register">
                <Text style={{ color: '#005d90', fontSize: 15, fontWeight: '700' }}>
                  Tham gia ngay
                </Text>
              </Link>
            </View>
          </View>

          {/* Footer */}
          <Text
            style={{
              textAlign: 'center',
              color: '#707881',
              fontSize: 12,
              marginTop: 24,
            }}
          >
            © 2024 Viloca Travel. Boundless Exploration.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
