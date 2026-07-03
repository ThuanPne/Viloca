## ADDED Requirements

### Requirement: Map FAB hiển thị trong Timeline khi có địa điểm

Tab Timeline SHALL hiển thị một FAB bản đồ ở góc dưới bên trái khi ngày đang chọn có ít nhất một địa điểm.

#### Scenario: FAB xuất hiện khi có địa điểm trong ngày

- **WHEN** user đang ở tab Timeline và ngày đang chọn (`selectedDay`) có ít nhất 1 `TripItem`
- **THEN** FAB bản đồ hiển thị ở `bottom: 24, left: 24`

#### Scenario: FAB ẩn khi không có địa điểm

- **WHEN** ngày đang chọn không có `TripItem` nào, hoặc user đang ở tab khác (Nhật ký / Thông tin)
- **THEN** FAB bản đồ không hiển thị

---

### Requirement: Map Modal hiển thị markers địa điểm trong ngày

Khi user nhấn FAB bản đồ, hệ thống SHALL mở modal full-screen chứa `MapView` với markers cho tất cả địa điểm của ngày đang chọn có `coordinates` hợp lệ.

#### Scenario: Mở modal với markers

- **WHEN** user nhấn FAB bản đồ
- **THEN** modal full-screen mở ra với `MapView`, mỗi `TripItem` của `selectedDay` có `coordinates` được render thành `Marker` tại vị trí `{ latitude: lat, longitude: lng }`

#### Scenario: Camera tự fit toàn bộ markers

- **WHEN** modal mở và có ít nhất 2 markers
- **THEN** camera tự động điều chỉnh vùng hiển thị (`fitToCoordinates`) để toàn bộ markers hiện trong màn hình với padding 60px

#### Scenario: Marker có callout tên địa điểm

- **WHEN** user nhấn vào một marker
- **THEN** callout hiển thị số thứ tự (theo `sort_order`) và tên địa điểm (`locations.name`)

#### Scenario: Location không có coordinates bị bỏ qua

- **WHEN** một `TripItem` có `locations.coordinates === null`
- **THEN** item đó không tạo marker, app không crash, các markers hợp lệ vẫn hiển thị bình thường

#### Scenario: Tất cả locations trong ngày không có coordinates

- **WHEN** toàn bộ `TripItem` của `selectedDay` đều không có `coordinates`
- **THEN** modal vẫn mở, `MapView` hiển thị ở vị trí mặc định, và có text thông báo "Chưa có tọa độ cho các địa điểm này"

---

### Requirement: Mở Google Maps Directions từ lịch trình ngày

Map Modal SHALL có nút "Mở Google Maps" tạo deep-link Google Maps Directions với các địa điểm của ngày theo thứ tự `sort_order` làm waypoints.

#### Scenario: Mở Google Maps với đủ waypoints

- **WHEN** user nhấn nút "Mở Google Maps" và có ít nhất 2 địa điểm trong ngày
- **THEN** hệ thống mở URL `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving` với các điểm theo thứ tự `sort_order`

#### Scenario: Fallback dùng address khi không có coordinates

- **WHEN** một địa điểm không có `coordinates` nhưng có `address`
- **THEN** `address` (encode URI) được dùng thay cho `lat,lng` trong URL

#### Scenario: Chỉ có 1 địa điểm trong ngày

- **WHEN** `selectedDay` chỉ có 1 `TripItem`
- **THEN** nút "Mở Google Maps" mở location đó dưới dạng search (không phải directions)
