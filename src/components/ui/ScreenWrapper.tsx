import { ScrollView, StyleSheet, ViewStyle, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

function BgDecor() {
  return (
    <>
      <View style={styles.blobTopRight}   pointerEvents="none" />
      <View style={styles.blobBottomLeft} pointerEvents="none" />
      <Image
        source={require('../../../assets/viloca-logo.png')}
        style={styles.watermark}
        resizeMode="contain"
        pointerEvents="none"
      />
    </>
  );
}

export function ScreenWrapper({ children, scrollable = false, style }: Props) {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.container}>
        <BgDecor />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, style]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.container, style]}>
      <BgDecor />
      {children}
    </SafeAreaView>
  );
}

const N = colors.nomad;
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: N.background, overflow: 'hidden' },
  content:        { paddingBottom: 32 },
  blobTopRight:   {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: N.secondaryContainer, opacity: 0.28,
  },
  blobBottomLeft: {
    position: 'absolute', bottom: 60, left: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: N.primary, opacity: 0.07,
  },
  watermark: {
    position: 'absolute', bottom: 24, right: 20,
    width: 88, height: 88, opacity: 0.05,
  },
});
