import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

export default function MapScreenWeb() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
      </TouchableOpacity>
      <Ionicons name="map-outline" size={64} color={colors.nomad.outlineVariant} />
      <Text style={styles.title}>Bản đồ chỉ hỗ trợ trên thiết bị di động</Text>
      <Text style={styles.sub}>Mở ứng dụng trên Android hoặc iOS để sử dụng tính năng này.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.nomad.surface, padding: 32 },
  backBtn:   { position: 'absolute', top: 52, left: 20, padding: 8 },
  title:     { fontSize: 17, fontWeight: '700', color: colors.nomad.onSurface, textAlign: 'center' },
  sub:       { fontSize: 14, color: colors.nomad.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
});
