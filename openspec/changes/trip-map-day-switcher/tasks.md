## 1. State và computed values

- [x] 1.1 Thêm state `mapDay: number` vào component (init 1, sẽ được set khi mở modal)
- [x] 1.2 Tính `daysWithCoords`: array số ngày mà `itemsByDay[day]` có ít nhất 1 item với `locations.coordinates` hợp lệ, sort tăng dần
- [x] 1.3 Cập nhật FAB `onPress` để set `mapDay = selectedDay` trước khi `setMapModalVisible(true)`

## 2. WebView — key prop và mapDay

- [x] 2.1 Thêm `key={mapDay}` vào `<WebView>` trong Map Modal để force remount khi đổi ngày
- [x] 2.2 Thay `itemsByDay[selectedDay]` bằng `itemsByDay[mapDay]` trong `buildLeafletHtml(...)` call
- [x] 2.3 Reset `mapWebViewLoading = true` mỗi khi `mapDay` thay đổi (trong onPress chip, trước setMapDay)

## 3. Day switcher UI

- [x] 3.1 Thêm `ScrollView` horizontal chip bar bên dưới header của Map Modal, chỉ render khi `daysWithCoords.length > 1`
- [x] 3.2 Render chip "Ngày X" cho mỗi ngày trong `daysWithCoords`, style active khi `day === mapDay`
- [x] 3.3 Tap chip: set `mapWebViewLoading = true` rồi `setMapDay(day)`

## 4. Cập nhật header và Google Maps button

- [x] 4.1 Đổi title header modal từ "Bản đồ lịch trình" thành `dayLabel(trip, mapDay)`
- [x] 4.2 Cập nhật nút "Mở Google Maps": dùng `itemsByDay[mapDay]` thay vì `itemsByDay[selectedDay]`

## 5. Styles

- [x] 5.1 Thêm styles cho chip bar: `mapDayBar`, `mapDayChip`, `mapDayChipActive`, `mapDayChipText`, `mapDayChipTextActive`

## 6. Kiểm thử

- [ ] 6.1 Trip nhiều ngày: chip bar hiển thị, tap chip đổi ngày → map reload đúng ngày
- [ ] 6.2 Trip 1 ngày có coordinates: chip bar ẩn, map hiển thị bình thường
- [ ] 6.3 Nút "Mở Google Maps" sau khi đổi ngày → mở đúng route ngày đó
- [ ] 6.4 Đóng modal rồi mở lại: modal khởi tạo đúng `selectedDay` hiện tại của Timeline
