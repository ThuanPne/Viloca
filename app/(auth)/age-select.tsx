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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        <View className="pt-10 pb-8">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
          >
            <Text className="text-gray-600 text-lg">←</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">V</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">Độ tuổi của bạn?</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
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
                borderColor: '#3b82f6',
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
                    <Text style={{ fontSize: 26, fontWeight: '700', color: '#1e293b' }}>
                      {age}
                    </Text>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>

          <Text className="text-gray-400 text-sm mt-2">tuổi</Text>
        </View>

        <TouchableOpacity
          className="py-4 rounded-2xl items-center mb-4 bg-blue-500"
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">Tiếp tục</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(auth)/register', params: { name: name ?? '' } })}
        >
          <Text className="text-gray-400 text-sm text-center">Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
