import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome');
    }
  }, [user]);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: () => null }} />
      <Tabs.Screen name="explore" options={{ title: 'Khám phá', tabBarIcon: () => null }} />
      <Tabs.Screen name="trips" options={{ title: 'Chuyến đi', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Hồ sơ', tabBarIcon: () => null }} />
    </Tabs>
  );
}
