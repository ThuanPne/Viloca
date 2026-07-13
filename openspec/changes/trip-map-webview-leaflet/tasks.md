## 1. Dependency

- [x] 1.1 Cài `react-native-webview` nếu chưa có: `npm install react-native-webview`

## 2. Leaflet HTML Builder

- [x] 2.1 Tạo helper function `buildLeafletHtml(markers: {lat, lng, name, order}[])` trả về HTML string với Leaflet.js + OSM tiles được inline
- [x] 2.2 Inline Leaflet CSS và JS vào HTML string (không dùng CDN) để hoạt động offline
- [x] 2.3 Implement logic fit bounds (`map.fitBounds`) cho toàn bộ markers với padding
- [x] 2.4 Thêm numbered markers (DivIcon với số thứ tự theo sort_order)
- [x] 2.5 Thêm polyline nối các markers theo thứ tự sort_order
- [x] 2.6 Thêm popup tên địa điểm khi tap marker

## 3. Map Modal

- [x] 3.1 Thêm state `mapModalVisible: boolean` vào Trip Detail
- [x] 3.2 Build `<Modal>` full-screen với header (title "Bản đồ lịch trình" + nút ✕ đóng)
- [x] 3.3 Render `<WebView source={{ html: buildLeafletHtml(...) }}` bên trong modal
- [x] 3.4 Thêm `ActivityIndicator` overlay hiển thị cho đến khi WebView fire `onLoad`
- [x] 3.5 Thêm nút "Mở Google Maps" ở bottom bar của modal, gọi `buildGoogleMapsUrl` + `Linking.openURL`

## 4. FAB

- [x] 4.1 Tính `dayHasCoordinates`: lọc items của ngày đang chọn, kiểm tra ít nhất 1 item có `locations.coordinates` hợp lệ
- [x] 4.2 Render FAB 🗺 ở góc dưới phải tab Timeline, chỉ khi `dayHasCoordinates === true`
- [x] 4.3 Tap FAB set `mapModalVisible = true`

## 5. Kiểm thử

- [ ] 5.1 Test trên Android: map load, markers hiện đúng, polyline đúng thứ tự
- [ ] 5.2 Test trên iOS: pan/zoom hoạt động, callout hiện khi tap marker
- [ ] 5.3 Test ngày không có coordinates: FAB không hiện
- [ ] 5.4 Test nút "Mở Google Maps": mở đúng app với đúng waypoints
- [ ] 5.5 Test đóng modal: quay lại Timeline đúng trạng thái
