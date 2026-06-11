import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pt-16 pb-12">
      <Link href="/(auth)/welcome" asChild>
        <TouchableOpacity className="mb-8">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
      </Link>

      <Text className="text-3xl font-bold text-gray-900 mb-1">Đăng ký</Text>
      <Text className="text-gray-400 mb-8">Tạo tài khoản mới</Text>

      <View className="gap-4 mb-6">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Họ và tên</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            placeholder="Nguyễn Văn A"
            placeholderTextColor="#9ca3af"
          />
        </View>

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
            placeholder="Tối thiểu 8 ký tự"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl items-center mb-8">
        <Text className="text-white font-semibold text-base">Tạo tài khoản</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-gray-400">Đã có tài khoản? </Text>
        <Link href="/(auth)/login">
          <Text className="text-blue-500 font-medium">Đăng nhập</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
