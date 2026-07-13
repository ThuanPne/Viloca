## Why

Polyline hiện tại trong Map Modal nối các địa điểm bằng đường thẳng, không phản ánh lộ trình thực tế theo đường phố. Thay bằng route thực từ OSRM giúp user hình dung chính xác hành trình di chuyển mà không cần rời app.

## What Changes

- Thay thế `L.polyline(lls, ...)` đường thẳng trong `buildLeafletHtml` bằng route thực fetch từ **OSRM public API** (`router.project-osrm.org`, driving profile)
- Route GeoJSON được vẽ dưới dạng polyline theo đường phố thực tế
- Thêm loading indicator nhỏ ("Đang tải lộ trình...") trong khi fetch OSRM
- Fallback về đường thẳng nếu OSRM request thất bại
- Không cần API key, không thêm dependency mới

## Capabilities

### New Capabilities

_(không có capability mới — đây là cải tiến implementation của `trip-map-webview`)_

### Modified Capabilities

- `trip-map-webview`: Polyline route thay từ đường thẳng sang đường thực theo phố (driving)

## Impact

- **app/trip/[id].tsx**: Chỉ sửa nội dung JS string bên trong `buildLeafletHtml` — không đụng React code
- **Không breaking**: FAB, Modal, markers, popup, nút Google Maps giữ nguyên
- **Runtime dependency**: OSRM public demo server (`router.project-osrm.org`) — cần internet, không cần key
