## ADDED Requirements

### Requirement: FAB bản đồ trên tab Timeline
Tab Timeline SHALL hiển thị một FAB (Floating Action Button) 🗺 ở góc dưới phải khi ngày đang chọn có ít nhất 1 địa điểm có coordinates hợp lệ (`lat` và `lng` khác null).

#### Scenario: FAB hiển thị khi có địa điểm có coordinates
- **WHEN** user đang ở tab Timeline và ngày đang chọn có ít nhất 1 địa điểm với coordinates hợp lệ
- **THEN** FAB 🗺 hiển thị ở góc dưới phải màn hình

#### Scenario: FAB ẩn khi không có coordinates
- **WHEN** ngày đang chọn không có địa điểm nào hoặc không có địa điểm nào có coordinates
- **THEN** FAB không hiển thị

#### Scenario: Tap FAB mở Map Modal
- **WHEN** user tap FAB 🗺
- **THEN** Map Modal full-screen mở với animation

---

### Requirement: Map Modal hiển thị bản đồ Leaflet
Khi mở, Map Modal SHALL hiển thị bản đồ tương tác dùng Leaflet.js với tile OpenStreetMap, chứa markers và polyline route cho các địa điểm của ngày đang chọn.

#### Scenario: Bản đồ load thành công
- **WHEN** Map Modal mở
- **THEN** WebView hiển thị bản đồ OSM với ActivityIndicator cho đến khi load xong

#### Scenario: Camera fit toàn bộ markers
- **WHEN** bản đồ load xong
- **THEN** camera tự động zoom và pan để hiển thị toàn bộ markers trong viewport với padding hợp lý

#### Scenario: Markers hiển thị theo thứ tự sort_order
- **WHEN** bản đồ load
- **THEN** mỗi địa điểm có coordinates được hiển thị bằng một marker đánh số theo `sort_order` (1, 2, 3, …)

#### Scenario: Polyline nối các markers theo thứ tự
- **WHEN** có từ 2 markers trở lên
- **THEN** một polyline màu primary của app nối các markers theo thứ tự sort_order

#### Scenario: Tap marker hiện callout tên địa điểm
- **WHEN** user tap một marker trên bản đồ
- **THEN** popup/callout hiển thị tên địa điểm (`locations.name`)

---

### Requirement: Nút "Mở Google Maps" trong modal
Map Modal SHALL có nút "Mở Google Maps" ở phía dưới mở deep-link Directions với các địa điểm của ngày đang chọn làm waypoints.

#### Scenario: Tap nút mở Google Maps app
- **WHEN** user tap "Mở Google Maps"
- **THEN** `Linking.openURL` được gọi với URL directions Google Maps (logic từ `buildGoogleMapsUrl` đã có)

---

### Requirement: Đóng Map Modal
Map Modal SHALL có nút đóng (✕) ở header để quay lại Trip Detail.

#### Scenario: Tap nút đóng
- **WHEN** user tap nút ✕ trên header của modal
- **THEN** modal đóng, user quay lại Trip Detail tab Timeline
