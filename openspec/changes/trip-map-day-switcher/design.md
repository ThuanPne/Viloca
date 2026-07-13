## Context

Map Modal hiện render `buildLeafletHtml(itemsByDay[selectedDay])` một lần khi mở. `selectedDay` là state của Timeline tab, không thay đổi trong khi modal đang mở. WebView nhận `source={{ html }}` — nếu string thay đổi, WebView có thể không tự reload nội dung vì nó giữ state nội bộ.

## Goals / Non-Goals

**Goals:**
- Thêm `mapDay` state riêng trong modal, init từ `selectedDay` khi mở
- Hiện chip bar ngày có coordinates bên dưới header modal
- Dùng `key={mapDay}` trên WebView để force remount khi đổi ngày → OSRM fetch lại tự động
- Nút "Mở Google Maps" dùng `mapDay` thay vì `selectedDay`

**Non-Goals:**
- Animation transition giữa các ngày
- Preload route các ngày khác trước
- Sync `mapDay` ngược lại vào `selectedDay` của Timeline

## Decisions

### D1: `key` prop trên WebView thay vì `webViewRef.reload()`

**Quyết định**: Dùng `<WebView key={mapDay} source={{ html: buildLeafletHtml(...) }} />`.

**Lý do**: Thay đổi `key` buộc React unmount + remount WebView hoàn toàn — sạch hơn và đơn giản hơn so với `ref.reload()` rồi inject JS mới. Không cần ref, không cần postMessage. Mỗi lần đổi ngày = một WebView mới với HTML mới.

**Alternative**: `webViewRef.current?.injectJavaScript(...)` để cập nhật markers mà không reload — phức tạp hơn, cần serialize data và gọi lại OSRM trong JS runtime.

### D2: State `mapDay` độc lập, không dùng `selectedDay`

**Quyết định**: Thêm `const [mapDay, setMapDay] = useState(selectedDay)` được set khi mở modal `onPress={() => { setMapDay(selectedDay); setMapModalVisible(true); }}`.

**Lý do**: `selectedDay` thuộc Timeline tab. Nếu user đổi ngày trong modal rồi đóng, Timeline không bị reset về ngày cũ. Hai state độc lập → không side effect.

### D3: Chỉ hiện chip ngày có ít nhất 1 địa điểm có coordinates

**Quyết định**: Tính `daysWithCoords` = array số ngày mà `itemsByDay[day]` có ít nhất 1 item với `locations.coordinates` hợp lệ.

**Lý do**: Tránh user chọn ngày mà map trống. Chip bar gọn hơn, chỉ hiện những ngày có thể xem được.

### D4: Title modal đổi theo `mapDay`

**Quyết định**: Header modal hiển thị `dayLabel(trip, mapDay)` thay vì string cố định "Bản đồ lịch trình".

**Lý do**: User biết đang xem ngày nào mà không cần nhìn vào chip bar.

## Risks / Trade-offs

- **WebView remount = re-fetch OSRM** → mỗi lần đổi ngày tốn 1 OSRM request và load lại Leaflet (~300ms). Chấp nhận được vì đây là tương tác chủ động của user.
- **Leaflet CDN load mỗi lần remount** → có thể bị cache bởi WebView. Không cần xử lý thêm.
- **Trip 1 ngày**: chip bar chỉ có 1 chip → ẩn chip bar luôn khi `daysWithCoords.length <= 1` để tránh UI thừa.
