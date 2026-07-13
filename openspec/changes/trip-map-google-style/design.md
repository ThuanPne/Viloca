## Context

`buildLeafletHtml` trong `app/trip/[id].tsx` nhận `LeafletMarker[]` + `userLocation` và trả về HTML string với Leaflet.js. Hiện dùng:
- Tile: CartoDB Positron (`light_all`) — nền trắng tối giản
- Route: polyline xanh lá `#45611b`, weight 5
- Markers: `L.divIcon` hình tròn 36px với `border-radius: 50%`
- Constants: `PRIMARY = '#45611b'`, `START_BG = '#1a5c1a'`, `END_BG = '#c0392b'`

Tất cả thay đổi nằm bên trong `buildLeafletHtml` — không ảnh hưởng React state hay component.

## Goals / Non-Goals

**Goals:**
- CartoDB Voyager tile thay Positron
- Route double polyline (white casing + blue fill)
- Marker teardrop shape bằng CSS
- Cập nhật màu constants

**Non-Goals:**
- Thay đổi logic OSRM routing
- Thay đổi user location flow
- Thay đổi day switcher
- Custom tile server

## Decisions

### D1: CartoDB Voyager tile URL

```
https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
```

Chỉ đổi `light_all` → `rastertiles/voyager`. Attribution giữ nguyên: `© OpenStreetMap contributors © CARTO`. Voyager có đường màu vàng/cam giống Google Maps, miễn phí không cần key.

### D2: Double polyline cho route (white casing)

Vẽ 2 polylines chồng nhau:
```js
L.polyline(coords, { color: '#ffffff', weight: 9, opacity: 1 }).addTo(map);     // casing
L.polyline(coords, { color: '#4285F4', weight: 5, opacity: 0.95 }).addTo(map);  // fill
```

`PolylineDecorator` arrows vẫn áp dụng lên polyline fill (trên cùng). Casing và fill cần được lưu vào biến riêng để decorator có thể reference đúng polyline.

**Alternative xem xét**: SVG stroke-outline trên 1 polyline → Leaflet không hỗ trợ native CSS stroke outline trên polyline, phải hack canvas renderer. Double polyline là cách standard.

### D3: Teardrop marker bằng pure CSS

CSS trick: hình vuông với `border-radius: 50% 50% 50% 0` (bo 3 góc, nhọn góc dưới-trái), rồi `transform: rotate(-45deg)` để nhọn hướng xuống-giữa. Số thứ tự bên trong cần `transform: rotate(45deg)` ngược lại để hiển thị thẳng.

```css
.mk-pin {
  width: 32px; height: 32px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex; align-items: center; justify-content: center;
}
.mk-pin .num {
  transform: rotate(45deg);
  font-size: 13px; font-weight: 700; color: #fff;
}
```

DivIcon `iconSize` cần tính thêm vùng nhọn bên dưới. `iconAnchor` phải điều chỉnh để marker point vào đúng tọa độ.

### D4: Màu constants cập nhật

```js
const PRIMARY   = '#4285F4'  // Google blue — route fill
const START_BG  = '#34A853'  // Google green — start marker
const END_BG    = '#EA4335'  // Google red — end marker
const USER_BG   = '#1a73e8'  // giữ nguyên (đã là Google blue)
```

## Risks / Trade-offs

- **Teardrop iconAnchor** → nếu tính sai anchor, marker sẽ lệch tọa độ. Test kỹ với 1 địa điểm trước.
- **Double polyline z-order** → casing (trắng) phải được add vào map TRƯỚC fill (xanh). Leaflet render theo thứ tự add.
- **Voyager tile ở vùng ngoài VN** → Voyager có đủ dữ liệu toàn cầu từ OSM, không vấn đề.
- **Arrow decorator trên casing** → PolylineDecorator phải reference fill polyline, không phải casing — nếu nhầm sẽ hiện mũi tên trắng trên nền trắng.
