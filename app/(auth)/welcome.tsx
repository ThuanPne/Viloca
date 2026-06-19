import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
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
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl items-center">
            <Text className="text-white font-semibold text-base">Bắt đầu</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="border border-gray-200 py-4 rounded-2xl items-center">
            <Text className="text-gray-700 font-semibold text-base">Đăng nhập</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
