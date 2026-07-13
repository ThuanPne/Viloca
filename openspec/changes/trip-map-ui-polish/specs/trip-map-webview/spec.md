## MODIFIED Requirements

### Requirement: Map Modal hiển thị bản đồ Leaflet
Khi mở, Map Modal SHALL hiển thị bản đồ tương tác dùng Leaflet.js với tile **CartoDB Positron** (nền trắng tối giản), chứa markers có label tên, polyline route OSRM với mũi tên hướng, info bar km/phút, và blue dot vị trí người dùng nếu permission được cấp.

#### Scenario: Bản đồ load với CartoDB Positron tile
- **WHEN** Map Modal mở
- **THEN** bản đồ hiển thị nền trắng CartoDB Positron thay vì OSM mặc định

#### Scenario: Camera fit toàn bộ markers
- **WHEN** bản đồ load xong
- **THEN** camera tự động zoom và pan để hiển thị toàn bộ markers trong viewport với padding hợp lý

#### Scenario: Marker hiển thị số thứ tự và tên địa điểm
- **WHEN** bản đồ load
- **THEN** mỗi địa điểm hiển thị marker 36px đánh số, kèm label tên địa điểm bên dưới; marker đầu và cuối có style khác biệt

#### Scenario: Route với mũi tên hướng đi
- **WHEN** OSRM trả về thành công và có từ 2 markers trở lên
- **THEN** polyline 5px vẽ theo đường phố thực, có mũi tên chỉ hướng di chuyển dọc theo route

#### Scenario: Info bar hiển thị km và thời gian
- **WHEN** OSRM fetch thành công
- **THEN** info bar ở góc dưới bản đồ hiển thị tổng quãng đường (km) và thời gian ước tính (phút)

#### Scenario: Fallback khi OSRM thất bại
- **WHEN** OSRM request thất bại
- **THEN** polyline đường thẳng dashed được vẽ, info bar không hiển thị

#### Scenario: Tap marker hiện popup tên địa điểm
- **WHEN** user tap marker
- **THEN** popup hiển thị tên địa điểm

#### Scenario: Map reload khi đổi ngày trong modal
- **WHEN** user tap chip ngày khác
- **THEN** WebView remount với markers và route của ngày mới
