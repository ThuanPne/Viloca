## Context

`buildLeafletHtml` trong `app/trip/[id].tsx` nhận `LeafletMarker[]` và trả về HTML string với Leaflet.js. Hiện dùng OSM tile mặc định, DivIcon 28px, polyline 3px từ OSRM. FAB tap mở modal trực tiếp, không có location flow.

`expo-location` chưa được cài. Với Expo managed workflow, cần thêm vào `package.json` và có thể cần config trong `app.json`.

## Goals / Non-Goals

**Goals:**
- CartoDB Positron tile thay OSM mặc định
- Marker 36px với tên địa điểm label bên dưới, style đặc biệt cho điểm đầu/cuối
- Polyline 5px + Leaflet `PolylineDecorator` hoặc CSS arrow pattern cho hướng đi
- Info bar (km + phút) từ `routes[0].distance` và `routes[0].duration` trong OSRM response
- Blue dot vị trí người dùng từ `expo-location`, truyền qua `buildLeafletHtml`
- Permission flow: xin trước khi mở modal, graceful skip nếu denied

**Non-Goals:**
- Real-time location tracking / watchPosition
- "Dẫn đường đến điểm tiếp theo" navigation
- Custom tile server

## Decisions

### D1: CartoDB Positron tile URL

```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```

Attribution: `© OpenStreetMap contributors © CARTO`. Miễn phí, không cần key, trông sạch.

### D2: Leaflet PolylineDecorator vs CSS arrow

**Quyết định**: Dùng `leaflet-polylinedecorator` plugin (CDN) để vẽ mũi tên dọc route.

**Lý do**: CSS arrow trên polyline Leaflet chuẩn rất phức tạp. PolylineDecorator là plugin phổ biến, load được từ CDN unpkg, API đơn giản: `L.polylineDecorator(polyline, { patterns: [{ symbol: L.Symbol.arrowHead(...) }] })`.

**Alternative**: SVG marker trên polyline — phức tạp hơn, không đáng.

### D3: Info bar trong HTML, không phải React Native

**Quyết định**: Vẽ `<div id="info-bar">` trong HTML template, populate từ OSRM response trong JS.

**Lý do**: Distance/duration chỉ có sau khi fetch OSRM (async trong WebView). Đưa lên RN cần postMessage bridge — phức tạp không cần thiết. Info bar nhỏ gọn ở góc dưới map là đủ.

Format: `5.2 km  ·  ~12 phút` (distance / 1000 km, duration / 60 phút).

### D4: User location — expo-location trong RN, truyền vào HTML

**Quyết định**: Trong FAB `onPress`, gọi `expo-location` trước khi mở modal:
1. `Location.requestForegroundPermissionsAsync()`
2. Nếu granted: `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`
3. Truyền `userLocation?: { lat, lng }` vào `buildLeafletHtml`
4. Nếu denied/error: `userLocation = undefined`, map mở bình thường

**Lý do**: Đáng tin cậy hơn `navigator.geolocation` trong WebView (iOS WebView có permission issue). RN lấy GPS → truyền vào string → Leaflet render, không cần bridge.

### D5: Blue dot style — L.circle với pulse animation

Dùng `L.circle([lat,lng], { radius: 20, ... })` + CSS `@keyframes pulse` trên một `L.divIcon` để tạo hiệu ứng nhấp nháy. Trông native hơn marker thông thường.

## Risks / Trade-offs

- **leaflet-polylinedecorator CDN load** → nếu CDN down, arrows không hiện nhưng route vẫn vẽ. Acceptable.
- **Location permission dialog** xuất hiện lần đầu tiên tap FAB → có thể bất ngờ. Mitigation: không block modal nếu user deny — chỉ bỏ qua blue dot.
- **GPS accuracy thấp trong nhà** → `Accuracy.Balanced` nhanh hơn `High` nhưng có thể lệch 50–100m. Đủ để "You are here" approximate.
- **expo-location bundle size** → thêm ~200KB. Chấp nhận được.
