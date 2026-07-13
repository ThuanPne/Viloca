## 1. Dữ liệu: Populate coordinates cho locations

- [x] 1.1 Tạo migration SQL mới populate `coordinates` cho tất cả locations SG (tra tọa độ từ `google_maps_url` hoặc địa chỉ)
- [x] 1.2 Tạo migration SQL mới populate `coordinates` cho tất cả locations HN
- [x] 1.3 Tạo migration SQL mới populate `coordinates` cho tất cả locations ĐN
- [x] 1.4 Chạy migration lên Supabase và verify dữ liệu

## 2. Cài đặt thư viện

- [x] 2.1 Cài `react-native-maps` (`npm install react-native-maps`)
- [x] 2.2 Thêm Expo config plugin vào `app.json` (mục `plugins`) với Google Maps API key cho Android
- [x] 2.3 Thêm `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` vào `.env.local` và tài liệu hoá trong CLAUDE.md

## 3. Type & Query

- [x] 3.1 Thêm `coordinates: { lat: number; lng: number } | null` vào inline type `TripItem.locations` trong `src/types/index.ts`
- [x] 3.2 Update select query trong `app/trip/[id].tsx` (2 chỗ: initial load + useFocusEffect refresh) thêm `coordinates` vào phần `locations(...)`

## 4. UI: Map FAB

- [x] 4.1 Thêm state `showMapModal: boolean` vào `TripDetailScreen`
- [x] 4.2 Thêm FAB bản đồ (Ionicons `map-outline`) ở `bottom: 24, left: 24` với điều kiện hiển thị `tab === 'timeline' && (itemsByDay[selectedDay] ?? []).length > 0`
- [x] 4.3 Style FAB bản đồ đồng bộ màu sắc với FAB "+" hiện có (`colors.nomad.primary`)

## 5. UI: Map Modal

- [x] 5.1 Tạo component `MapModal` (có thể inline trong file) nhận props `items: TripItem[], dayLabel: string, onClose: () => void`
- [x] 5.2 Render `MapView` full-screen với `provider={PROVIDER_GOOGLE}` trên Android
- [x] 5.3 Render `Marker` cho mỗi item có `locations.coordinates` hợp lệ, title = `${sort_order + 1}. ${locations.name}`
- [x] 5.4 Implement `fitToCoordinates` sau khi MapView mount để camera fit toàn bộ markers (padding 60px)
- [x] 5.5 Hiển thị empty state "Chưa có tọa độ cho các địa điểm này" khi không có marker nào hợp lệ
- [x] 5.6 Thêm header modal với tên ngày (`dayLabel`) và nút đóng (X)

## 6. Google Maps Deep-link

- [x] 6.1 Implement hàm `buildGoogleMapsUrl(items: TripItem[]): string` tạo URL Directions với `origin`, `destination`, `waypoints` theo thứ tự `sort_order`, fallback dùng `address` khi không có coordinates
- [x] 6.2 Handle edge case: chỉ 1 địa điểm → mở Google Maps Search thay vì Directions
- [x] 6.3 Thêm nút "Mở Google Maps" trong modal, gọi `Linking.openURL(buildGoogleMapsUrl(...))` khi nhấn

## 7. Kiểm thử & hoàn thiện

- [ ] 7.1 Test modal mở/đóng, markers hiển thị đúng ngày đang chọn
- [ ] 7.2 Test edge case: location không có coordinates không crash app
- [ ] 7.3 Test deep-link Google Maps mở đúng với thứ tự waypoints
- [ ] 7.4 Test trên Android (cần development build: `npx expo run:android`, không chạy với Expo Go)
