import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/src/theme/colors';

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;
const AGES = Array.from({ length: 100 }, (_, i) => i + 1);
const DEFAULT_INDEX = 19; // age 20

export default function AgeSelectScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [selectedAge, setSelectedAge] = useState(AGES[DEFAULT_INDEX]);
  const scrollY = useRef(new Animated.Value(DEFAULT_INDEX * ITEM_HEIGHT)).current;
  const scrollRef = useRef<Animated.LegacyRef<Animated.ScrollView>>(null);
  const paddingVertical = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(Math.round(y / ITEM_HEIGHT), AGES.length - 1));
    setSelectedAge(AGES[index]);
    (scrollRef.current as any)?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  }

  function handleContinue() {
    router.push({
      pathname: '/(auth)/register',
      params: { name: name ?? '', age_range: String(selectedAge) },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.nomad.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ paddingTop: 40, paddingBottom: 32 }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.nomad.surfaceContainer }}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.nomad.onSurfaceVariant, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-10">
          <View style={{ width: 64, height: 64, backgroundColor: colors.nomad.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.nomad.onPrimary, fontSize: 30, fontWeight: 'bold' }}>V</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.nomad.onSurface }}>Độ tuổi của bạn?</Text>
          <Text style={{ color: colors.nomad.onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            Giúp chúng tôi gợi ý hành trình phù hợp hơn
          </Text>
        </View>

        {/* Wheel Picker */}
        <View className="items-center mb-6">
          <View
            style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: 160, overflow: 'hidden' }}
          >
            {/* Top fade */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: ITEM_HEIGHT * 2, zIndex: 10,
                background: 'transparent',
              }}
            />

            {/* Center highlight */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                left: 0, right: 0,
                height: ITEM_HEIGHT,
                borderTopWidth: 2, borderBottomWidth: 2,
                borderColor: colors.nomad.primary,
                zIndex: 10,
              }}
            />

            <Animated.ScrollView
              ref={scrollRef as any}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onMomentumScrollEnd={onScrollEnd}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              contentContainerStyle={{ paddingVertical }}
              contentOffset={{ x: 0, y: DEFAULT_INDEX * ITEM_HEIGHT }}
            >
              {AGES.map((age, i) => {
                const inputRange = [
                  (i - 2) * ITEM_HEIGHT,
                  (i - 1) * ITEM_HEIGHT,
                  i * ITEM_HEIGHT,
                  (i + 1) * ITEM_HEIGHT,
                  (i + 2) * ITEM_HEIGHT,
                ];

                const opacity = scrollY.interpolate({
                  inputRange,
                  outputRange: [0.15, 0.4, 1, 0.4, 0.15],
                  extrapolate: 'clamp',
                });

                const scale = scrollY.interpolate({
                  inputRange,
                  outputRange: [0.65, 0.8, 1, 0.8, 0.65],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={age}
                    style={{
                      height: ITEM_HEIGHT,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity,
                      transform: [{ scale }],
                    }}
                  >
                    <Text style={{ fontSize: 26, fontWeight: '700', color: colors.nomad.onSurface }}>
                      {age}
                    </Text>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>

          <Text style={{ color: colors.nomad.onSurfaceVariant, fontSize: 14, marginTop: 8 }}>tuổi</Text>
        </View>

        <TouchableOpacity
          style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, backgroundColor: colors.nomad.primary }}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={{ color: colors.nomad.onPrimary, fontWeight: '600', fontSize: 16 }}>Tiếp tục</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(auth)/register', params: { name: name ?? '' } })}
        >
          <Text style={{ color: colors.nomad.onSurfaceVariant, fontSize: 14, textAlign: 'center' }}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
