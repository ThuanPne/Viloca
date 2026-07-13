## 1. Chuẩn bị trong buildLeafletHtml

- [x] 1.1 Bỏ dòng `L.polyline(lls, ...).addTo(map)` đường thẳng hiện tại
- [x] 1.2 Thêm `<div id="route-status">` vào HTML template để hiển thị loading text

## 2. OSRM fetch và vẽ route

- [x] 2.1 Build OSRM URL từ markers: `router.project-osrm.org/route/v1/driving/{lon,lat;...}?overview=full&geometries=geojson` (chú ý thứ tự lon,lat)
- [x] 2.2 Hiển thị "Đang tải lộ trình..." vào `#route-status` trước khi fetch
- [x] 2.3 Fetch OSRM, parse `data.routes[0].geometry.coordinates`, đảo thứ tự `[lon,lat]` → `[lat,lng]` cho Leaflet
- [x] 2.4 Vẽ `L.polyline(routeCoords, { color, weight, opacity })` từ geometry OSRM trả về
- [x] 2.5 Ẩn `#route-status` sau khi vẽ xong

## 3. Fallback

- [x] 3.1 Trong `catch` block của fetch: vẽ `L.polyline(lls, ...)` đường thẳng như cũ, ẩn `#route-status`

## 4. Kiểm thử

- [ ] 4.1 Test với ngày có 2+ địa điểm có coordinates: route vẽ theo đường phố thực
- [ ] 4.2 Test với 1 địa điểm: không fetch OSRM, không vẽ polyline
- [ ] 4.3 Test fallback: tắt internet → đường thẳng xuất hiện, không crash
- [ ] 4.4 Kiểm tra thứ tự lon,lat đúng (Hà Nội: lon=105.8, lat=21.0)
