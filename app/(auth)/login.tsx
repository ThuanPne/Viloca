import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function LoginScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pt-16 pb-12">
      <TouchableOpacity className="mb-8">
        <Text className="text-2xl">←</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-gray-900 mb-1">Đăng nhập</Text>
      <Text className="text-gray-400 mb-8">Chào mừng bạn trở lại</Text>

      <View className="gap-4 mb-6">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            placeholder="email@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
          <TouchableOpacity className="mt-2 self-end">
            <Text className="text-blue-500 text-sm">Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl items-center mb-6">
        <Text className="text-white font-semibold text-base">Đăng nhập</Text>
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-4 text-gray-400 text-sm">hoặc</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <View className="gap-3 mb-8">
        <TouchableOpacity className="border border-gray-200 py-3.5 rounded-2xl flex-row items-center justify-center gap-2">
          <Text className="text-base">G</Text>
          <Text className="font-medium text-gray-700">Tiếp tục với Google</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-blue-600 py-3.5 rounded-2xl flex-row items-center justify-center gap-2">
          <Text className="text-white text-base">f</Text>
          <Text className="font-medium text-white">Tiếp tục với Facebook</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center">
        <Text className="text-gray-400">Chưa có tài khoản? </Text>
        <Link href="/(auth)/register">
          <Text className="text-blue-500 font-medium">Đăng ký</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
