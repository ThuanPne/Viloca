## Why

Người dùng đã có lịch trình chi tiết với tọa độ địa điểm, nhưng hiện tại chỉ có thể mở Google Maps app bên ngoài — không thể xem tổng quan lộ trình ngay trong app. Tính năng này giúp user hình dung toàn bộ lộ trình theo ngày bằng bản đồ tương tác ngay trong Trip Detail, không cần rời khỏi app.

## What Changes

- Thêm **Map Modal full-screen** trong tab Timeline của Trip Detail, hiển thị bản đồ tương tác dùng WebView + Leaflet.js + OpenStreetMap (không cần API key)
- Thêm **FAB 🗺** ở góc dưới phải tab Timeline, chỉ hiển thị khi ngày đang chọn có ít nhất 1 địa điểm có coordinates
- Bản đồ hiển thị **markers** cho từng địa điểm trong ngày, **polyline route** nối theo thứ tự `sort_order`, **callout** tên địa điểm khi tap marker
- Camera tự động **fit bounds** toàn bộ markers khi mở
- Giữ lại nút **"Mở Google Maps"** trong modal để navigate thực tế
- Tile bản đồ dùng **OpenStreetMap** — hoàn toàn miễn phí, không cần API key

## Capabilities

### New Capabilities

- `trip-map-webview`: Bản đồ in-app dùng WebView + Leaflet + OSM hiển thị markers và route lịch trình theo ngày

### Modified Capabilities

_(không có)_

## Impact

- **app/trip/[id].tsx**: Thêm Map Modal (WebView), FAB, HTML template Leaflet
- **package.json**: Thêm `react-native-webview` (nếu chưa có)
- **Không breaking**: FAB chỉ hiện khi có coordinates, modal đóng được, deep-link Google Maps vẫn còn
