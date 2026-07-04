import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Map, Camera, UserLocation, GeoJSONSource, Layer, type CameraRef } from '@maplibre/maplibre-react-native';
import { calculateRoute, distanceKm, formatDistance, getCachedMapStyle, MAP_STYLES, type MapStyleId } from '@/src/services/awsLocation';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { colors } from '@/src/theme/colors';

const MAP_STYLE_STORAGE_KEY = '@viloca/map_style';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    destLat: string;
    destLng: string;
    destName: string;
  }>();

  const destLat = parseFloat(params.destLat ?? '0');
  const destLng = parseFloat(params.destLng ?? '0');
  const destName = params.destName ?? 'Điểm đến';

  const { location, permissionStatus, loading: locLoading, requestPermission } =
    useUserLocation();

  const [routeCoords, setRouteCoords] = useState<Array<[number, number]> | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [mapStyle, setMapStyle] = useState<object | string | null>(null);
  const [styleId, setStyleId] = useState<MapStyleId>('Standard');
  const [pickerOpen, setPickerOpen] = useState(false);
  const cameraRef = useRef<CameraRef>(null);

  // Khôi phục nền bản đồ người dùng chọn lần trước (nếu có)
  useEffect(() => {
    AsyncStorage.getItem(MAP_STYLE_STORAGE_KEY).then((saved) => {
      if (saved && MAP_STYLES.some((s) => s.id === saved)) {
        setStyleId(saved as MapStyleId);
      }
    });
  }, []);

  // Style descriptor được cache trong bộ nhớ theo từng loại nền — đổi qua lại
  // giữa các nền đã xem không cần gọi lại AWS.
  useEffect(() => {
    let cancelled = false;
    setMapStyle(null);
    getCachedMapStyle(styleId)
      .then((style) => { if (!cancelled) setMapStyle(style); })
      .catch(() => { /* Map sẽ hiện trống nếu style không tải được — không crash */ });
    return () => { cancelled = true; };
  }, [styleId]);

  const selectStyle = useCallback((id: MapStyleId) => {
    setStyleId(id);
    setPickerOpen(false);
    AsyncStorage.setItem(MAP_STYLE_STORAGE_KEY, id);
  }, []);

  // Fetch route once we have user location
  useEffect(() => {
    if (!location) return;
    let cancelled = false;

    (async () => {
      setLoadingRoute(true);
      try {
        const coords = await calculateRoute(
          location.lat, location.lng,
          destLat, destLng,
        );
        if (!cancelled) setRouteCoords(coords);
      } catch {
        // Route unavailable — show straight line fallback
        if (!cancelled) {
          setRouteCoords([
            [location.lng, location.lat],
            [destLng, destLat],
          ]);
        }
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    })();

    return () => { cancelled = true; };
  }, [location, destLat, destLng]);

  // Auto-fit camera to show both user and destination
  useEffect(() => {
    if (!location || !cameraRef.current) return;
    const minLng = Math.min(location.lng, destLng) - 0.005;
    const maxLng = Math.max(location.lng, destLng) + 0.005;
    const minLat = Math.min(location.lat, destLat) - 0.005;
    const maxLat = Math.max(location.lat, destLat) + 0.005;
    cameraRef.current.fitBounds(
      [minLng, minLat, maxLng, maxLat],
      { padding: { top: 80, right: 80, bottom: 80, left: 80 }, duration: 600 },
    );
  }, [location, destLat, destLng]);

  const routeGeoJSON = useCallback((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: routeCoords
      ? [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: routeCoords },
          properties: {},
        }]
      : [],
  }), [routeCoords]);

  const destGeoJSON = useCallback((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [destLng, destLat] },
      properties: { name: destName },
    }],
  }), [destLat, destLng, destName]);

  const distance = location
    ? distanceKm(location.lat, location.lng, destLat, destLng)
    : null;

  // Permission not granted yet
  if (permissionStatus !== 'granted' && !locLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="location-outline" size={48} color={colors.textMuted} />
        <Text style={styles.permTitle}>Cần quyền vị trí</Text>
        <Text style={styles.permDesc}>
          Cho phép Viloca truy cập vị trí để hiển thị bản đồ và chỉ đường
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      {mapStyle ? (
        <Map
          style={styles.map}
          mapStyle={mapStyle}
          logo={false}
          attribution={false}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ center: [destLng, destLat], zoom: 13 }}
          />

          {/* User location dot */}
          <UserLocation animated />

          {/* Route polyline */}
          {routeCoords && (
            <GeoJSONSource id="route" data={routeGeoJSON()}>
              <Layer
                id="routeLine"
                type="line"
                style={{
                  lineColor: colors.nomad?.primary ?? '#45611b',
                  lineWidth: 4,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
            </GeoJSONSource>
          )}

          {/* Destination marker */}
          <GeoJSONSource id="destination" data={destGeoJSON()}>
            <Layer
              id="destCircle"
              type="circle"
              style={{
                circleRadius: 10,
                circleColor: colors.nomad?.primary ?? '#45611b',
                circleStrokeWidth: 3,
                circleStrokeColor: '#ffffff',
              }}
            />
          </GeoJSONSource>
        </Map>
      ) : (
        <View style={[styles.map, styles.centered]}>
          <ActivityIndicator size="large" color={colors.nomad?.primary ?? '#45611b'} />
        </View>
      )}

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Map style switcher */}
      <TouchableOpacity
        style={[styles.styleBtn, { top: insets.top + 12 }]}
        onPress={() => setPickerOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Ionicons name="layers-outline" size={21} color={colors.textPrimary} />
      </TouchableOpacity>

      {pickerOpen && (
        <View style={[styles.stylePanel, { top: insets.top + 60 }]}>
          {MAP_STYLES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.styleOption, s.id === styleId && styles.styleOptionActive]}
              onPress={() => selectStyle(s.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={s.icon as any}
                size={18}
                color={s.id === styleId ? colors.nomad?.primary ?? '#45611b' : colors.textMuted}
              />
              <Text style={[styles.styleOptionText, s.id === styleId && styles.styleOptionTextActive]}>
                {s.label}
              </Text>
              {s.id === styleId && (
                <Ionicons name="checkmark" size={16} color={colors.nomad?.primary ?? '#45611b'} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Loading route indicator */}
      {loadingRoute && (
        <View style={[styles.loadingBadge, { top: insets.top + 12 }]}>
          <ActivityIndicator size="small" color={colors.nomad?.primary ?? '#45611b'} />
          <Text style={styles.loadingText}>Đang tìm đường...</Text>
        </View>
      )}

      {/* Bottom info bar */}
      <View style={[styles.infoBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.infoIcon}>
          <Ionicons name="location" size={18} color={colors.nomad?.primary ?? '#45611b'} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoName} numberOfLines={1}>{destName}</Text>
          {distance !== null && (
            <Text style={styles.infoDistance}>
              Cách bạn khoảng {formatDistance(distance)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ede8',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#faf7f2',
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1A0E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 14,
    color: '#8A7060',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permBtn: {
    backgroundColor: '#45611b',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  styleBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  stylePanel: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  styleOptionActive: {
    backgroundColor: '#f0f7e4',
  },
  styleOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#2D1A0E',
  },
  styleOptionTextActive: {
    fontWeight: '700',
  },
  loadingBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingText: {
    fontSize: 13,
    color: '#2D1A0E',
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8ffc2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1A0E',
  },
  infoDistance: {
    fontSize: 13,
    color: '#8A7060',
    marginTop: 2,
  },
});
