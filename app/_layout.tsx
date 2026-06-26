import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (!isReady) setIsReady(true);

      if (event === 'INITIAL_SESSION') {
        router.replace(session?.user ? '/(app)' : '/(auth)/login');
      } else if (event === 'SIGNED_IN') {
        router.replace('/(app)');
      } else if (event === 'SIGNED_OUT') {
        if (!segments.includes('verify-email' as never)) {
          router.replace('/(auth)/login');
        }
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

  return (
    <>
      <StatusBar style="dark" translucent />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
