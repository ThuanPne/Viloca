## MODIFIED Requirements

### Requirement: Map Modal hiển thị bản đồ Leaflet
Khi mở, Map Modal SHALL hiển thị bản đồ tương tác dùng Leaflet.js với tile OpenStreetMap, chứa markers và polyline route cho các địa điểm của **ngày đang chọn trong modal** (`mapDay`). Route SHALL được fetch từ OSRM public API (driving profile) và vẽ theo đường phố thực tế. Nếu OSRM thất bại, SHALL fallback về polyline đường thẳng.

#### Scenario: Bản đồ load thành công
- **WHEN** Map Modal mở
- **THEN** WebView hiển thị bản đồ OSM với ActivityIndicator cho đến khi load xong

#### Scenario: Camera fit toàn bộ markers
- **WHEN** bản đồ load xong
- **THEN** camera tự động zoom và pan để hiển thị toàn bộ markers trong viewport với padding hợp lý

#### Scenario: Markers hiển thị theo thứ tự sort_order
- **WHEN** bản đồ load
- **THEN** mỗi địa điểm có coordinates được hiển thị bằng một marker đánh số theo `sort_order` (1, 2, 3, …)

#### Scenario: Route thực theo đường phố hiển thị sau khi fetch
- **WHEN** có từ 2 markers trở lên và OSRM trả về thành công
- **THEN** polyline theo đường phố thực tế (driving) được vẽ nối các markers theo thứ tự sort_order

#### Scenario: Loading indicator hiển thị khi đang fetch route
- **WHEN** bản đồ đã load xong và đang fetch route từ OSRM
- **THEN** text "Đang tải lộ trình..." hiển thị nhỏ ở góc dưới bản đồ

#### Scenario: Fallback đường thẳng khi OSRM thất bại
- **WHEN** OSRM request thất bại (lỗi mạng, timeout, server error)
- **THEN** polyline đường thẳng được vẽ nối các markers, loading indicator ẩn đi

#### Scenario: Tap marker hiện callout tên địa điểm
- **WHEN** user tap một marker trên bản đồ
- **THEN** popup/callout hiển thị tên địa điểm (`locations.name`)

#### Scenario: Map reload khi đổi ngày trong modal
- **WHEN** user tap chip ngày khác trong day switcher
- **THEN** WebView remount và hiển thị markers + route của ngày mới, ActivityIndicator xuất hiện trong lúc load

---

### Requirement: Day switcher trong Map Modal
Map Modal SHALL hiển thị chip bar chọn ngày bên dưới header khi chuyến đi có từ 2 ngày trở lên có địa điểm với coordinates hợp lệ. Chip SHALL chỉ hiển thị những ngày có ít nhất 1 địa điểm có coordinates.

#### Scenario: Chip bar hiển thị khi có nhiều ngày
- **WHEN** Map Modal mở và có từ 2 ngày trở lên có địa điểm với coordinates
- **THEN** chip bar hiển thị bên dưới header với các chip "Ngày X" tương ứng

#### Scenario: Chip bar ẩn khi chỉ có 1 ngày
- **WHEN** Map Modal mở và chỉ có 1 ngày có địa điểm với coordinates
- **THEN** chip bar không hiển thị

#### Scenario: Chip ngày hiện tại được highlight
- **WHEN** chip bar hiển thị
- **THEN** chip tương ứng với `mapDay` đang chọn có style active (màu primary)

#### Scenario: Tap chip đổi ngày
- **WHEN** user tap chip "Ngày X"
- **THEN** `mapDay` cập nhật thành X, WebView remount với data ngày X, title header đổi thành label ngày X

---

### Requirement: Nút "Mở Google Maps" theo ngày trong modal
Map Modal SHALL có nút "Mở Google Maps" dùng `mapDay` (ngày đang chọn trong modal) để build URL directions, không phải `selectedDay` của Timeline.

#### Scenario: Tap nút mở Google Maps đúng ngày
- **WHEN** user tap "Mở Google Maps" sau khi đã đổi sang ngày khác trong modal
- **THEN** `Linking.openURL` mở directions cho ngày `mapDay` đang hiển thị trong modal
