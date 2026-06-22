import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'INITIAL_SESSION') {
        // First load — go to app if logged in, else onboarding
        router.replace(session?.user ? '/(app)' : '/(auth)/onboarding');
      } else if (event === 'SIGNED_IN') {
        router.replace('/(app)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/onboarding');
      }
      // TOKEN_REFRESHED and others: just update store, don't navigate
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="dark" translucent />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
