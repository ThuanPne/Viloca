## 1. Tile và màu constants

- [x] 1.1 Đổi tile URL từ `light_all` → `rastertiles/voyager` trong `buildLeafletHtml`
- [x] 1.2 Cập nhật constants: `PRIMARY = '#4285F4'`, `START_BG = '#34A853'`, `END_BG = '#EA4335'`

## 2. Route double polyline (white casing)

- [x] 2.1 Thêm casing polyline trắng (weight:9) trước fill polyline xanh trong OSRM success path
- [x] 2.2 Đổi fill polyline màu sang `#4285F4` (weight:5)
- [x] 2.3 Đảm bảo `PolylineDecorator` arrows reference đúng fill polyline (không phải casing)
- [x] 2.4 Cập nhật fallback dashed polyline sang màu `#4285F4`

## 3. Teardrop marker CSS

- [x] 3.1 Đổi CSS `.mk-wrap` / `.num-icon` từ `border-radius: 50%` (circle) sang teardrop shape (`border-radius: 50% 50% 50% 0; transform: rotate(-45deg)`)
- [x] 3.2 Thêm `transform: rotate(45deg)` cho `.num` bên trong để số hiển thị thẳng
- [x] 3.3 Điều chỉnh `iconAnchor` của DivIcon để điểm nhọn teardrop trỏ đúng vào tọa độ địa điểm
- [x] 3.4 Kiểm tra `.num-icon--start` và `.num-icon--end` vẫn hiển thị đúng màu với hình teardrop mới

## 4. Kiểm thử

- [ ] 4.1 Tile Voyager hiển thị đường màu (vàng/cam cho phố lớn, trắng nhỏ, xanh nước)
- [ ] 4.2 Route xanh `#4285F4` có viền trắng nổi bật, mũi tên arrow vẫn hiện đúng
- [ ] 4.3 Marker teardrop điểm nhọn trỏ chính xác vào vị trí địa điểm
- [ ] 4.4 Marker đầu (xanh lá Google) và cuối (đỏ Google) đúng màu constants mới
