## Why

Bản đồ hiện dùng CartoDB Positron (nền trắng tối giản) nhưng trông khác xa Google Maps. Người dùng đã quen với Google Maps nên cần cải thiện màu sắc để dễ nhìn và quen thuộc hơn: đường phố có màu, route màu xanh với viền trắng, marker hình teardrop.

## What Changes

- Đổi tile từ CartoDB Positron → CartoDB Voyager (có màu đường, công viên xanh, nước xanh)
- Route polyline: đổi màu xanh lá → xanh Google (#4285F4) với white casing (2 polylines chồng nhau)
- Marker shape: đổi từ hình tròn → teardrop/pin (border-radius CSS trick)
- Cập nhật màu constants: `START_BG`, `END_BG`, `PRIMARY` theo palette Google Maps

## Capabilities

### New Capabilities
- `map-google-style-tile`: Tile CartoDB Voyager thay Positron — đường màu, công viên xanh, nước xanh dương
- `map-route-blue-casing`: Route polyline màu xanh Google (#4285F4) với viền trắng (double polyline)
- `map-teardrop-marker`: Marker hình teardrop/pin thay circle, số thứ tự ở trung tâm

### Modified Capabilities

## Impact

- `app/trip/[id].tsx`: Sửa trong `buildLeafletHtml` — tile URL, CSS marker, JS polyline drawing
- Không thay đổi React state hay component structure
- Không cần package mới
