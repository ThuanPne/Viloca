## 1. Setup

- [x] 1.1 Cài `expo-location`: `npx expo install expo-location`
- [x] 1.2 Thêm import `* as Location from 'expo-location'` vào `app/trip/[id].tsx`
- [x] 1.3 Cập nhật type `LeafletMarker` và signature `buildLeafletHtml` để nhận thêm `userLocation?: { lat: number; lng: number }`

## 2. Location permission và GPS flow

- [x] 2.1 Tạo async function `openMapWithLocation()` thay thế inline onPress của FAB
- [x] 2.2 Trong `openMapWithLocation`: gọi `Location.requestForegroundPermissionsAsync()`, nếu granted thì `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`
- [x] 2.3 Lưu kết quả vào state `userLocation: { lat, lng } | null`, set `mapDay`, `mapWebViewLoading`, `mapModalVisible`
- [x] 2.4 Nếu permission denied hoặc GPS lỗi: set `userLocation = null`, vẫn mở modal bình thường

## 3. Tile và CSS trong buildLeafletHtml

- [x] 3.1 Đổi tile URL sang CartoDB Positron: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- [x] 3.2 Cập nhật attribution: `© OpenStreetMap contributors © CARTO`
- [x] 3.3 Cập nhật CSS `.num-icon` lên 36px, thêm `.num-label` cho tên địa điểm bên dưới marker
- [x] 3.4 Thêm CSS và HTML cho `#info-bar` (góc dưới trái bản đồ, ẩn mặc định)
- [x] 3.5 Thêm CSS `.user-dot` với `@keyframes pulse` cho blue dot

## 4. Marker nâng cấp

- [x] 4.1 Cập nhật DivIcon HTML: thêm `<div class="num-label">` tên địa điểm bên dưới số
- [x] 4.2 Marker đầu (order=1): thêm class `num-icon--start` (màu xanh lá đậm hơn hoặc icon khác biệt)
- [x] 4.3 Marker cuối (order=pts.length): thêm class `num-icon--end` (màu đỏ/cam)

## 5. Route nâng cấp và info bar

- [x] 5.1 Thêm `leaflet-polylinedecorator` CDN vào HTML head
- [x] 5.2 Sau khi vẽ polyline OSRM, thêm `L.polylineDecorator` với `L.Symbol.arrowHead` dọc route
- [x] 5.3 Parse `data.routes[0].distance` (m→km) và `data.routes[0].duration` (s→phút) từ OSRM response
- [x] 5.4 Populate và hiển thị `#info-bar` với format `X.X km · ~Y phút`

## 6. Blue dot vị trí người dùng

- [x] 6.1 Trong `buildLeafletHtml`, nhận `userLocation` và inject vào JS string
- [x] 6.2 Nếu `userLocation` có giá trị: vẽ `L.divIcon` với class `.user-dot` tại tọa độ người dùng
- [x] 6.3 Đảm bảo `fitBounds` CHỈ dùng `lls` (markers lịch trình), không include userLocation
- [x] 6.4 Truyền `userLocation` state vào `buildLeafletHtml(...)` call trong Map Modal

## 7. Kiểm thử

- [ ] 7.1 Tile CartoDB hiển thị đúng (nền trắng sạch)
- [ ] 7.2 Marker có label tên, điểm đầu/cuối style khác biệt
- [ ] 7.3 Route có mũi tên hướng đi, info bar hiện km + phút
- [ ] 7.4 Permission flow: granted → blue dot xuất hiện; denied → map vẫn mở bình thường
- [ ] 7.5 Camera fitBounds không bị kéo bởi vị trí người dùng
