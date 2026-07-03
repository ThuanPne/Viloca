import { useEffect, useRef, memo } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';

interface Props {
  message: string;
}

function MascotBubble({ message }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <View style={styles.bubble}>
        <Text style={styles.text} numberOfLines={3}>{message}</Text>
      </View>
      {/* Đuôi tam giác trỏ xuống phía Sen */}
      <View style={styles.tail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#FFFBF5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 160,
    borderWidth: 1.5,
    borderColor: '#FFB7C8',
    shadowColor: '#FFB7C8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    color: '#3D3D3D',
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFB7C8',
    marginTop: -1,
  },
});

export default memo(MascotBubble);
