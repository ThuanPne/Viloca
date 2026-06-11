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
} from 'react-native';
import { Link, router } from 'expo-router';
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="pt-4 pb-8">
            <Link href="/(auth)/welcome" asChild>
              <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-gray-600 text-lg">←</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4 shadow-sm">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Chào mừng trở lại</Text>
            <Text className="text-gray-400 text-sm mt-1">Đăng nhập để tiếp tục</Text>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-4 mb-5">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-gray-50"
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => { setError(''); setEmail(v); }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-gray-50 pr-14"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => { setError(''); setPassword(v); }}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 bottom-0 justify-center"
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text className="text-gray-400 text-sm">{showPassword ? 'Ẩn' : 'Hiện'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity className="mt-2 self-end">
                <Text className="text-blue-500 text-sm font-medium">Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-6 ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400 text-sm">hoặc tiếp tục với</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social */}
          <View className="gap-3 mb-10">
            <TouchableOpacity
              className="border border-gray-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 bg-white"
              activeOpacity={0.7}
            >
              <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">G</Text>
              </View>
              <Text className="font-medium text-gray-700">Tiếp tục với Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#1877F2] py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
              activeOpacity={0.7}
            >
              <View className="w-5 h-5 bg-white rounded-full items-center justify-center">
                <Text className="text-[#1877F2] text-xs font-bold">f</Text>
              </View>
              <Text className="font-medium text-white">Tiếp tục với Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-400">Chưa có tài khoản? </Text>
            <Link href="/(auth)/register">
              <Text className="text-blue-500 font-semibold">Đăng ký ngay</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
