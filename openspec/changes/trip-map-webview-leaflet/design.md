## Context

Trip Detail (`app/trip/[id].tsx`) đã có:
- Coordinates (`lat`, `lng`) được lưu trong bảng `locations` và được fetch theo `trip_items`
- Hàm `buildGoogleMapsUrl()` tạo deep-link Directions cho ngày đang chọn
- Tab Timeline hiển thị các địa điểm theo slot sáng/chiều/tối với `sort_order`

Hiện tại không có cách xem bản đồ trong app — user phải rời sang Google Maps app. Yêu cầu: bản đồ in-app, không cần API key.

## Goals / Non-Goals

**Goals:**
- Hiển thị bản đồ tương tác (pan/zoom) với markers và polyline route trong modal
- Dùng OpenStreetMap tiles — hoàn toàn miễn phí, không cần API key hay đăng ký
- Leaflet.js nhúng trong WebView — HTML/CSS/JS được inject dưới dạng string, không cần file tĩnh
- Camera tự fit bounds toàn bộ markers khi mở modal
- Tap marker → callout hiện tên địa điểm + số thứ tự
- Giữ nút "Mở Google Maps" để navigate thực tế

**Non-Goals:**
- Offline map / tile caching
- Turn-by-turn navigation trong app
- Custom tile server hay self-hosted tiles
- Map trên các tab khác (journal, info)

## Decisions

### D1: WebView + Leaflet.js thay vì react-native-maps

**Quyết định**: Dùng `react-native-webview` với Leaflet.js inlined.

**Lý do**: react-native-maps trên Android bắt buộc Google Maps SDK (cần API key). MapLibre cần key từ tile provider. WebView + Leaflet + OSM là con đường duy nhất hoàn toàn không cần key.

**Alternatives considered**:
- `react-native-maps` với OSM tile overlay → vẫn cần Google Play Services / API key trên Android
- `@maplibre/maplibre-react-native` → cần key từ MapTiler/Protomaps
- Static image từ OSM staticmap.php → không interactive

### D2: HTML inject dưới dạng string (không dùng file .html)

**Quyết định**: Build HTML string trong component, inject qua prop `source={{ html }}` của WebView.

**Lý do**: Expo managed workflow không serve static assets qua WebView `uri` trên Android dễ dàng. Inline HTML tránh mọi vấn đề path resolution, bundle tốt hơn, và dễ truyền data từ RN xuống Leaflet qua string interpolation.

### D3: Truyền data RN → WebView qua string interpolation, không qua postMessage

**Quyết định**: Nhúng JSON coordinates trực tiếp vào HTML string khi build.

**Lý do**: Data (markers, route) đã có sẵn trong RN state khi mở modal, không cần async messaging. postMessage cần thêm event listener 2 chiều và phức tạp hơn không cần thiết.

### D4: Modal full-screen, không phải bottom sheet hay inline

**Quyết định**: `Modal` (React Native built-in) full-screen với header đóng và nút Google Maps ở bottom.

**Lý do**: Bản đồ cần không gian tối đa. Inline trong scroll view sẽ conflict với pan gesture. Bottom sheet sẽ che mất phần lớn bản đồ.

## Risks / Trade-offs

- **OSM tile rate limit** → OSM có usage policy, heavy load có thể bị throttle. Mitigation: app travel không có traffic đủ lớn để trigger; nếu cần scale, swap tile URL sang CARTO free tier
- **WebView startup time** → Lần đầu mở modal có thể lag 200-400ms. Mitigation: thêm `ActivityIndicator` overlay cho đến khi WebView fire `onLoad`
- **Leaflet CDN** → Leaflet.js mặc định load từ CDN (cần internet). Mitigation: inline Leaflet JS/CSS vào HTML string (bundle ~150KB) để hoạt động offline và tránh phụ thuộc CDN
- **Android WebView vs iOS WKWebView** → Khác nhau về font rendering và touch behavior. Mitigation: test trên cả 2 platform, dùng CSS `touch-action: none` nếu cần

## Open Questions

_(không có — đủ rõ để implement)_
