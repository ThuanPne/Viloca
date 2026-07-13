## Context

`buildLeafletHtml` trong `app/trip/[id].tsx` hiện tạo HTML string với Leaflet.js + OSM tiles. Route giữa các markers được vẽ bằng `L.polyline(lls, ...)` — đường thẳng nối tọa độ, không theo đường phố thực.

OSRM (Open Source Routing Machine) cung cấp public demo server miễn phí tại `router.project-osrm.org` trả về GeoJSON geometry theo đường phố thực cho driving profile.

## Goals / Non-Goals

**Goals:**
- Fetch route từ OSRM bên trong JS của WebView sau khi map load
- Vẽ polyline theo geometry GeoJSON trả về thay vì đường thẳng
- Hiển thị trạng thái loading ("Đang tải lộ trình...") trong khi fetch
- Fallback về đường thẳng nếu OSRM thất bại (lỗi network, timeout, server down)

**Non-Goals:**
- Walking hay cycling profile
- Turn-by-turn navigation / chỉ đường từng bước
- Self-host OSRM server
- Caching route response
- Thay đổi UI ngoài `buildLeafletHtml`

## Decisions

### D1: Fetch OSRM trong JS của WebView, không phải từ React Native

**Quyết định**: Toàn bộ logic fetch và vẽ route nằm trong JS string của `buildLeafletHtml`.

**Lý do**: Không cần postMessage hay bridge RN↔WebView. Route chỉ phục vụ hiển thị trên map — không cần data này trong RN state. Giữ thay đổi minimal, chỉ sửa 1 function.

### D2: OSRM API format

Request:
```
GET https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2};...
    ?overview=full&geometries=geojson
```

**Lưu ý**: OSRM dùng thứ tự **lon,lat** (ngược với Leaflet dùng lat,lng).

Response parse:
```js
data.routes[0].geometry.coordinates  // [[lon,lat], [lon,lat], ...]
// Đảo thành [lat,lng] cho Leaflet
coords.map(c => [c[1], c[0]])
```

### D3: Fallback về đường thẳng

**Quyết định**: Nếu fetch thất bại (bất kỳ lý do), vẽ `L.polyline` đường thẳng như hiện tại.

**Lý do**: Bản đồ vẫn dùng được dù OSRM không phản hồi. Markers và popup không bị ảnh hưởng.

### D4: Loading indicator dạng text nhỏ, không block map

**Quyết định**: Thêm `<div id="route-status">` nhỏ góc dưới bản đồ, hiển thị "Đang tải lộ trình..." khi đang fetch, ẩn đi sau khi xong.

**Lý do**: Không che map, không cần thêm CSS phức tạp. User vẫn thấy markers trong khi route đang load.

## Risks / Trade-offs

- **OSRM demo server rate limit** → Mitigation: fallback đường thẳng; cho app cá nhân không ảnh hưởng
- **Latency fetch OSRM** (~200–500ms) → Mitigation: loading indicator, markers đã hiển thị ngay, route xuất hiện sau
- **OSRM không hỗ trợ route trong khu vực thiếu data OSM** → Mitigation: fallback đường thẳng
- **lon,lat vs lat,lng confusion** → Mitigation: comment rõ ràng trong code, test case với tọa độ thực
