import '../global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import supabase from '@/src/lib/supabase';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@/store/authStore';
import { loadIconFontWithRetry } from '@/src/lib/icon-font';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [fontsSettled, setFontsSettled] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const segments = useSegments();

  // Load the icon font once, up front, before any <Ionicons> can mount. Each of
  // the ~200 icon call sites would otherwise race to download it on its own, and
  // because expo-font forgets failed loads, one hiccup repeats without bound.
  // See src/lib/icon-font.ts for the full mechanism.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadIconFontWithRetry(() => Ionicons.loadFont(), {
        onError: (error, attempt) =>
          console.warn(`[icon-font] Ionicons attempt ${attempt} failed:`, error),
      });

      if (!loaded) {
        console.warn(
          '[icon-font] Gave up loading Ionicons; icons will render blank but the app ' +
            'stays usable. The usual cause is low free storage on the device — Android ' +
            'purges the downloaded font straight out of the app cache directory.'
        );
      }

      if (!cancelled) setFontsSettled(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isReady || !fontsSettled ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.nomad.background }}>
          <ActivityIndicator size="large" color={colors.nomad.primary} />
        </View>
      ) : (
        <>
          <StatusBar style="dark" translucent />
          <Stack screenOptions={{ headerShown: false }} />
        </>
      )}
    </GestureHandlerRootView>
  );
}
