import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

function mapOtpError(message: string): string {
  if (/rate limit/i.test(message)) return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.';
  if (/expired/i.test(message)) return 'Mã đã hết hạn. Vui lòng nhấn "Gửi lại mã".';
  if (/invalid/i.test(message)) return 'Mã không đúng. Vui lòng kiểm tra lại.';
  return 'Xác nhận thất bại. Vui lòng thử lại.';
}

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function updateOtp(index: number, value: string): string[] {
    const next = [...otp];
    next[index] = value;
    return next;
  }

  async function handleVerify(digits: string[]) {
    const token = digits.join('');
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
      setOtp(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    }
    // on success: onAuthStateChange in _layout.tsx handles redirect to /(app)
  }

  function onChangeText(index: number, value: string) {
    setError('');

    // handle paste of 6 digits
    const digits = value.replace(/\D/g, '');
    if (digits.length === OTP_LENGTH) {
      const pasted = digits.split('');
      setOtp(pasted);
      refs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(pasted);
      return;
    }

    const digit = digits.slice(-1);
    const next = updateOtp(index, digit);
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }

    if (digit && index === OTP_LENGTH - 1) {
      handleVerify(next);
    }
  }

  function onKeyPress(index: number, key: string) {
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      const next = updateOtp(index - 1, '');
      setOtp(next);
      refs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    setError('');
    await supabase.auth.resend({ email: email ?? '', type: 'signup' });
    setCountdown(60);
  }

  const isFilled = otp.every((d) => d !== '');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-8"
            onPress={() => router.back()}
          >
            <Text className="text-gray-600 text-lg">←</Text>
          </TouchableOpacity>

          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Xác nhận email</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              Nhập mã 6 số được gửi đến
            </Text>
            <Text className="text-blue-500 text-sm font-medium mt-0.5">{email}</Text>
          </View>

          <View className="flex-row justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(r) => { refs.current[index] = r; }}
                className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold text-gray-900 ${
                  digit ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
                maxLength={OTP_LENGTH}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(v) => onChangeText(index, v)}
                onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-6 ${
              isFilled && !loading ? 'bg-blue-500' : 'bg-blue-200'
            }`}
            onPress={() => handleVerify(otp)}
            disabled={!isFilled || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Xác nhận</Text>
            )}
          </TouchableOpacity>

          <View className="items-center gap-2">
            <Text className="text-gray-400 text-sm">Chưa nhận được mã?</Text>
            {countdown > 0 ? (
              <Text className="text-gray-400 text-sm">
                Gửi lại sau{' '}
                <Text className="text-blue-500 font-medium">{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text className="text-blue-500 font-semibold text-sm">Gửi lại mã</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
