## Context

Màn hình `app/trip/[id].tsx` hiện có 3 tab (Timeline / Nhật ký / Thông tin). Tab Timeline hiển thị danh sách địa điểm theo từng ngày với drag-and-drop reorder, và FAB "+" ở bottom-right để thêm địa điểm. Bảng `locations` trong Supabase có cột `coordinates JSONB` nhưng chưa được populate trong seed migrations. Chưa có map library nào trong project.

## Goals / Non-Goals

**Goals:**
- Hiển thị markers vị trí các địa điểm của ngày đang chọn trong MapView full-screen
- Camera tự động fit toàn bộ markers khi modal mở
- Mỗi marker có callout hiển thị tên + số thứ tự địa điểm
- Nút "Mở Google Maps" deep-link Directions với waypoints theo sort_order
- Populate coordinates cho locations SG, HN, ĐN hiện có

**Non-Goals:**
- Vẽ polyline route trong app (chỉ markers)
- In-app turn-by-turn navigation
- Real-time location tracking của user
- Geocoding tự động từ address

## Decisions

### 1. Map Library: `react-native-maps`

Chọn `react-native-maps` thay vì `expo-maps` (SDK mới, ít doc) hay WebView+Leaflet (không native-feel). `react-native-maps` có Expo config plugin chính thức, hỗ trợ tốt trên cả iOS/Android với `MapView`, `Marker`, `Callout` components.

Cần thêm vào `app.json`:
```json
{
  "plugins": [
    ["react-native-maps", { "googleMapsApiKey": "..." }]
  ]
}
```
Android cần Google Maps API key; iOS dùng Apple Maps mặc định (không cần key).

### 2. Coordinate Data: Migration SQL thủ công

Không dùng Geocoding API (overkill, tốn tiền). Thêm một migration mới `UPDATE locations SET coordinates = '{"lat":...,"lng":...}'::jsonb WHERE name = '...'` cho từng location đã seed. Tra tọa độ từ Google Maps URL đã có sẵn trong data.

### 3. UX Placement: FAB bottom-left + Modal full-screen

FAB bản đồ đặt ở `bottom: 24, left: 24` (đối xứng với FAB "+" ở right). Chỉ hiện khi `tab === 'timeline' && (itemsByDay[selectedDay] ?? []).length > 0`. Tap mở `Modal animationType="slide"` full-screen với MapView.

### 4. Google Maps Deep-link: URL Directions API

```
https://www.google.com/maps/dir/?api=1
  &origin=<lat,lng hoặc address đầu tiên>
  &destination=<lat,lng hoặc address cuối>
  &waypoints=<lat,lng|lat,lng|...> (các điểm giữa)
  &travelmode=driving
```

Fallback: nếu location không có `coordinates`, dùng `address` encode URI. Nếu không có cả hai thì bỏ qua location đó khỏi waypoints.

### 5. Type Safety: Extend `TripItem.locations`

Thêm `coordinates: { lat: number; lng: number } | null` vào inline type trong `TripItem` (không tạo type mới). Update select query trong `trip/[id].tsx` để include `coordinates`.

## Risks / Trade-offs

- **Coordinates thiếu** → Marker bị bỏ qua, map có thể trống nếu tất cả locations của ngày đó không có coordinates. Mitigation: hiển thị empty state thay vì crash, và ưu tiên populate đủ data trước khi release.
- **Android cần Google Maps API key** → Nếu không config, MapView crash trên Android. Mitigation: document rõ trong `.env.local` và README.
- **react-native-maps cần rebuild native** → Không chạy được với Expo Go, cần dùng development build (`npx expo run:android`). Mitigation: ghi rõ trong tasks.
