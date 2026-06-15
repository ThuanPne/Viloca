import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!isReady) setIsReady(true);
      if (session?.user) {
        router.replace('/(app)');
      } else if (
        !segments.includes('verify-email' as never) &&
        !segments.includes('onboarding' as never)
      ) {
        router.replace('/(auth)/welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
