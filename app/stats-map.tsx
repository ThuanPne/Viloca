import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme/colors';
import { spacing, radius } from '@/src/theme/spacing';

type MockPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visits: number;
  category: string;
  lastVisit: string;
};

const MOCK_PINS: MockPin[] = [
  { id: '1',  name: 'Hội An',     lat: 15.8801,  lng: 108.338,   visits: 3, category: 'Văn hóa',    lastVisit: '15/03/2026' },
  { id: '2',  name: 'Hạ Long',    lat: 20.9101,  lng: 107.1839,  visits: 1, category: 'Thiên nhiên', lastVisit: '10/01/2026' },
  { id: '3',  name: 'Đà Lạt',     lat: 11.9465,  lng: 108.4419,  visits: 2, category: 'Thiên nhiên', lastVisit: '20/12/2025' },
  { id: '4',  name: 'Huế',        lat: 16.4637,  lng: 107.5909,  visits: 1, category: 'Di tích',     lastVisit: '05/02/2026' },
  { id: '5',  name: 'Mũi Né',     lat: 10.9432,  lng: 108.287,   visits: 2, category: 'Thiên nhiên', lastVisit: '08/04/2026' },
  { id: '6',  name: 'Sapa',       lat: 22.3364,  lng: 103.844,   visits: 1, category: 'Thiên nhiên', lastVisit: '01/11/2025' },
  { id: '7',  name: 'Ninh Bình',  lat: 20.2539,  lng: 105.9746,  visits: 1, category: 'Di tích',     lastVisit: '14/02/2026' },
  { id: '8',  name: 'Phú Quốc',   lat: 10.2899,  lng: 103.9840,  visits: 2, category: 'Thiên nhiên', lastVisit: '25/05/2026' },
  { id: '9',  name: 'Đà Nẵng',    lat: 16.0544,  lng: 108.2022,  visits: 4, category: 'Văn hóa',    lastVisit: '12/06/2026' },
  { id: '10', name: 'Cần Thơ',    lat: 10.0452,  lng: 105.7469,  visits: 1, category: 'Ẩm thực',    lastVisit: '30/03/2026' },
];

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 100vw; height: 100vh; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .custom-pin {
      width: 28px; height: 28px;
      background: #45611b;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .pin-count {
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      font-family: -apple-system, sans-serif;
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([16.0, 108.0], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  var pins = PINS_PLACEHOLDER;
  pins.forEach(function(p) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="custom-pin"><span class="pin-count">' + p.visits + '</span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    var marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
    marker.on('click', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ id: p.id }));
      }
    });
  });
</script>
</body>
</html>
`.replace('PINS_PLACEHOLDER', JSON.stringify(MOCK_PINS))
  .replace('#45611b', PIN_COLOR);

export default function StatsMapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPin, setSelectedPin] = useState<MockPin | null>(null);
  const slideAnim = useRef(new Animated.Value(200)).current;

  function handleMessage(event: { nativeEvent: { data: string } }) {
    const { id } = JSON.parse(event.nativeEvent.data);
    const pin = MOCK_PINS.find((p) => p.id === id) ?? null;
    setSelectedPin(pin);
    if (pin) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }
  }

  function closeCard() {
    Animated.timing(slideAnim, { toValue: 200, useNativeDriver: true, duration: 200 }).start(() => {
      setSelectedPin(null);
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.nomad.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Bản đồ hành trình</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      <WebView
        style={styles.map}
        source={{ html: MAP_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      {/* Info card */}
      {selectedPin && (
        <Animated.View style={[styles.infoCard, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.pinName}>📍 {selectedPin.name}</Text>
            <TouchableOpacity onPress={closeCard} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.nomad.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <Text style={styles.pinMeta}>{selectedPin.category} · {selectedPin.visits} lần ghé</Text>
          <Text style={styles.pinDate}>Lần cuối: {selectedPin.lastVisit}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const N = colors.nomad;
const PIN_COLOR = N.primary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: N.surface },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: N.surface },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 16, fontWeight: '700', color: N.onSurface },
  map:       { flex: 1 },
  infoCard:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: N.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: spacing.lg, paddingTop: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  closeBtn:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.border },
  pinName:   { fontSize: 18, fontWeight: '800', color: N.onSurface, flex: 1 },
  pinMeta:   { fontSize: 14, color: N.onSurfaceVariant, marginBottom: 4 },
  pinDate:   { fontSize: 13, color: N.primary, fontWeight: '500', marginBottom: spacing.sm },
});
