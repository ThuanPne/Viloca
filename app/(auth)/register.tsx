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
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
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
  { label: 'Yếu', color: 'bg-red-500' },
  { label: 'Yếu', color: 'bg-red-500' },
  { label: 'Trung bình', color: 'bg-orange-400' },
  { label: 'Mạnh', color: 'bg-yellow-400' },
  { label: 'Rất mạnh', color: 'bg-green-500' },
];

const CONDITION_LABELS = [
  { key: 'minLength' as const, label: 'Ít nhất 8 ký tự' },
  { key: 'hasUpper' as const, label: 'Có chữ hoa (A-Z)' },
  { key: 'hasLower' as const, label: 'Có chữ thường (a-z)' },
  { key: 'hasNumber' as const, label: 'Có số (0-9)' },
  { key: 'hasSpecial' as const, label: 'Có ký tự đặc biệt (!@#...)' },
];

function mapAuthError(message: string): string {
  if (/rate limit/i.test(message)) return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
  if (/already registered/i.test(message)) return 'Email này đã được đăng ký. Vui lòng đăng nhập.';
  if (/invalid email/i.test(message)) return 'Địa chỉ email không hợp lệ.';
  if (/password/i.test(message)) return 'Mật khẩu không đáp ứng yêu cầu bảo mật.';
  return message; // TODO: map to Vietnamese before release
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  const conditions = getPasswordConditions(password);
  const strength = password.length > 0 ? getPasswordStrength(conditions) : 0;
  const allConditionsMet = Object.values(conditions).every(Boolean);
  const isFormValid = name.trim().length > 0 && validateEmail(email) && allConditionsMet;

  function handleFieldChange(setter: (v: string) => void) {
    return (value: string) => {
      setError('');
      setter(value);
    };
  }

  async function handleRegister() {
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);

    if (authError) {
      setError(mapAuthError(authError.message));
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      // Email exists but unverified — resend OTP and let them verify
      await supabase.auth.resend({ email, type: 'signup' });
      router.replace({ pathname: '/(auth)/verify-email', params: { email } });
      return;
    }

    if (data.session) {
      setUser(data.session.user);
      router.replace('/(app)');
    } else if (data.user) {
      router.replace({ pathname: '/(auth)/verify-email', params: { email } });
    }
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
          <View className="pt-4 pb-8">
            <Link href="/(auth)/welcome" asChild>
              <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-gray-600 text-lg">←</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Tạo tài khoản</Text>
            <Text className="text-gray-400 text-sm mt-1">Bắt đầu hành trình của bạn</Text>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Họ và tên</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-gray-50"
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={handleFieldChange(setName)}
              />
            </View>

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
                onChangeText={handleFieldChange(setEmail)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-gray-50 pr-14"
                  placeholder="Mật khẩu của bạn"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handleFieldChange(setPassword)}
                />
                <TouchableOpacity
                  className="absolute right-4 top-0 bottom-0 justify-center"
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Text className="text-gray-400 text-sm">{showPassword ? 'Ẩn' : 'Hiện'}</Text>
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View className="mt-3">
                  <View className="flex-row gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        className={`flex-1 h-1.5 rounded-full ${
                          strength >= level ? STRENGTH_CONFIG[strength].color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </View>
                  <Text className={`text-xs font-medium ${
                    strength <= 1 ? 'text-red-500' :
                    strength === 2 ? 'text-orange-400' :
                    strength === 3 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {STRENGTH_CONFIG[strength].label}
                  </Text>
                </View>
              )}

              {password.length > 0 && (
                <View className="mt-3 gap-1">
                  {CONDITION_LABELS.map(({ key, label }) => (
                    <View key={key} className="flex-row items-center gap-2">
                      <Text className={conditions[key] ? 'text-green-500' : 'text-red-400'}>
                        {conditions[key] ? '✓' : '✗'}
                      </Text>
                      <Text className={`text-xs ${conditions[key] ? 'text-green-600' : 'text-gray-400'}`}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-8 ${
              isFormValid && !loading ? 'bg-blue-500' : 'bg-blue-200'
            }`}
            onPress={handleRegister}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Tạo tài khoản</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-400">Đã có tài khoản? </Text>
            <Link href="/(auth)/login">
              <Text className="text-blue-500 font-semibold">Đăng nhập</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
