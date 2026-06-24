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
  if (/sending confirmation email|confirmation email/i.test(message)) return 'Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email.';
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { email, emailPending } = useLocalSearchParams<{ email: string; emailPending?: string }>();
  const pending = emailPending === 'true';
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    if (digits.length === OTP_LENGTH) {
      handleVerify(digits);
    }
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

          {pending ? (
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-yellow-700 text-sm text-center">
                Email có thể chưa đến. Nhấn "Gửi lại mã" để thử lại.
              </Text>
            </View>
          ) : null}

          {/* Hidden input captures all typing/backspace natively */}
          <TextInput
            ref={inputRef}
            value={otpValue}
            onChangeText={handleChangeText}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            autoFocus
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />

          {/* Visual OTP boxes — tap to focus hidden input */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            <View className="flex-row justify-center gap-3 mb-6">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const filled = digits[index] !== undefined;
                const active = index === digits.length;
                return (
                  <View
                    key={index}
                    className={`w-12 h-14 border-2 rounded-xl items-center justify-center ${
                      active ? 'border-blue-500 bg-blue-50' :
                      filled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Text className="text-xl font-bold text-gray-900">
                      {digits[index] ?? ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-6 ${
              otpValue.length === OTP_LENGTH && !loading ? 'bg-blue-500' : 'bg-blue-200'
            }`}
            onPress={() => handleVerify(otpValue)}
            disabled={otpValue.length < OTP_LENGTH || loading}
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
