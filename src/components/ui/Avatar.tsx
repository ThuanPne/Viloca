import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

interface Props {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function Avatar({ uri, name, size = 48 }: Props) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, style]} />;
  }
  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {name ? initials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image:    { resizeMode: 'cover' },
  fallback: { backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primary600, fontWeight: '700' },
});
