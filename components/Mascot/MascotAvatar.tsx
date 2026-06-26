import { useEffect, useRef, memo } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import type { MascotEmotion } from '@/types/mascot';

const SOURCES: Partial<Record<MascotEmotion, ReturnType<typeof require>>> = {
  idle:      require('@/assets/mascot/sen-idle.png'),
  happy:     require('@/assets/mascot/sen-happy.png'),
  excited:   require('@/assets/mascot/sen-excited.png'),
  thinking:  require('@/assets/mascot/sen-thinking.png'),
  surprised: require('@/assets/mascot/sen-surprised.png'),
  love:      require('@/assets/mascot/sen-love.png'),
  winking:   require('@/assets/mascot/sen-winking.png'),
  exploring: require('@/assets/mascot/sen-exploring.png'),
};

const FALLBACK = require('@/assets/mascot/sen-happy.png');

interface Props {
  emotion?: MascotEmotion;
  size?: number;
}

function MascotAvatar({ emotion = 'happy', size = 100 }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -7, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [floatAnim]);

  return (
    <Animated.View
      style={[
        { width: size, height: size * 1.1 },
        { transform: [{ translateY: floatAnim }] },
      ]}
    >
      <Image
        source={SOURCES[emotion] ?? FALLBACK}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});

export default memo(MascotAvatar);
