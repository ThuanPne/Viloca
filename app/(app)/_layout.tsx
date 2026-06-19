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

  return <Tabs screenOptions={{ headerShown: false }} />;
}
