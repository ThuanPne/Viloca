import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { signInWithGoogle } from '@/lib/useGoogleAuth';

export default function WelcomeScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) setError(err);
    // on success: onAuthStateChange in _layout.tsx handles redirect
  }

  return (
    <View className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center gap-3">
        <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-4">
          <Text className="text-white text-4xl font-bold">V</Text>
        </View>
        <Text className="text-4xl font-bold text-gray-900">Viloca</Text>
        <Text className="text-gray-400 text-center text-base">
          Khám phá hành trình của bạn
        </Text>
      </View>

      <View className="pb-12 gap-3">
        {error ? (
          <Text className="text-red-500 text-sm text-center">{error}</Text>
        ) : null}

        <Link href="/(auth)/onboarding" asChild>
          <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl items-center">
            <Text className="text-white font-semibold text-base">Bắt đầu chuyến đi</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          className="border border-gray-200 py-4 rounded-2xl items-center flex-row justify-center gap-3"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#4b5563" />
          ) : (
            <>
              <Text className="text-xl">G</Text>
              <Text className="text-gray-700 font-semibold text-base">Tiếp tục với Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="border border-gray-200 py-4 rounded-2xl items-center">
            <Text className="text-gray-700 font-semibold text-base">Đăng nhập</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
