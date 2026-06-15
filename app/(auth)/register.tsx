import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 8 ký tự');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Đăng ký thất bại', error.message);
      return;
    }
    if (data.user) {
      setUser(data.user);
      router.replace('/(app)');
    } else {
      Alert.alert('Kiểm tra email', 'Vui lòng xác nhận email trước khi đăng nhập');
      router.replace('/(auth)/login');
    }
  }

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
            value={name}
            onChangeText={setName}
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
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
            placeholder="Tối thiểu 8 ký tự"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
      </View>

      <TouchableOpacity
        className="bg-blue-500 py-4 rounded-2xl items-center mb-8"
        onPress={handleRegister}
        disabled={loading}
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
          <Text className="text-blue-500 font-medium">Đăng nhập</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
