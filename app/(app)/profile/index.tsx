import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-16 pb-6 items-center">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900">Nguyễn Văn A</Text>
        <Text className="text-gray-400 mt-1">email@example.com</Text>

        <Link href="/(app)/profile/edit" asChild>
          <TouchableOpacity className="mt-4 border border-blue-500 px-6 py-2 rounded-full">
            <Text className="text-blue-500 font-medium">Chỉnh sửa</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="px-6 mt-6 gap-3">
        {[
          { label: 'Chuyến đi của tôi', value: '12 chuyến', icon: '✈️' },
          { label: 'Địa điểm yêu thích', value: '8 nơi', icon: '❤️' },
          { label: 'Đánh giá', value: '24 đánh giá', icon: '⭐' },
        ].map((item) => (
          <View key={item.label} className="bg-white rounded-2xl px-4 py-4 flex-row items-center">
            <Text className="text-2xl mr-4">{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-gray-500 text-sm">{item.label}</Text>
              <Text className="text-gray-900 font-semibold">{item.value}</Text>
            </View>
            <Text className="text-gray-300">›</Text>
          </View>
        ))}
      </View>

      <View className="px-6 mt-6 mb-12">
        <TouchableOpacity className="bg-red-50 py-4 rounded-2xl items-center">
          <Text className="text-red-500 font-medium">Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
