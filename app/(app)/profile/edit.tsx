import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function EditProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pt-16 pb-12">
      <View className="flex-row items-center mb-8">
        <Link href="/(app)/profile" asChild>
          <TouchableOpacity>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
        </Link>
        <Text className="text-xl font-bold text-gray-900 ml-4">Chỉnh sửa hồ sơ</Text>
      </View>

      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
          <Text className="text-4xl">👤</Text>
        </View>
        <TouchableOpacity className="mt-2">
          <Text className="text-blue-500 font-medium">Đổi ảnh</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-4 mb-8">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Họ và tên</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            defaultValue="Nguyễn Văn A"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-400 bg-gray-50"
            defaultValue="email@example.com"
            editable={false}
          />
          <Text className="text-xs text-gray-400 mt-1">Email không thể thay đổi</Text>
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            placeholder="0912 345 678"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl items-center">
        <Text className="text-white font-semibold text-base">Lưu thay đổi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
