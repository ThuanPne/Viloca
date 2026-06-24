import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  const [name, setName] = useState('');

  function handleContinue() {
    router.push({ pathname: '/(auth)/age-select', params: { name: name.trim() } });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6">
          <View className="pt-18 pb-8">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              onPress={() => router.back()}
            >
              <Text className="text-gray-600 text-lg">←</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">V</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">Chào mừng!</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              Bạn muốn chúng tôi gọi bạn là gì?
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Tên của bạn</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-gray-50"
              placeholder="Nguyễn Văn A"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mb-4 ${
              name.trim() ? 'bg-blue-500' : 'bg-blue-200'
            }`}
            onPress={handleContinue}
            disabled={!name.trim()}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">Tiếp tục</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/age-select')}>
            <Text className="text-gray-400 text-sm text-center">Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
