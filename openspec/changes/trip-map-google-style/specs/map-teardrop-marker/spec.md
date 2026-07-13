## ADDED Requirements

### Requirement: Marker hình teardrop/pin thay circle
Các marker địa điểm SHALL hiển thị hình teardrop/pin (CSS `border-radius: 50% 50% 50% 0` + rotate) thay vì hình tròn, để trông giống Google Maps pin hơn. Số thứ tự SHALL hiển thị ở trung tâm marker.

#### Scenario: Marker hình teardrop
- **WHEN** bản đồ load với markers địa điểm
- **THEN** mỗi marker có hình teardrop (nhọn ở đáy, tròn ở trên) với số thứ tự ở giữa và label tên bên dưới

#### Scenario: Marker đầu màu xanh, marker cuối màu đỏ
- **WHEN** bản đồ load với từ 2 markers trở lên
- **THEN** marker đầu tiên (order=1) màu xanh lá đậm, marker cuối cùng màu đỏ — cả hai đều giữ hình teardrop

#### Scenario: Label tên vẫn hiển thị bên dưới marker
- **WHEN** bản đồ load
- **THEN** tên địa điểm hiển thị bên dưới marker teardrop, không bị che khuất bởi hình dạng mới
