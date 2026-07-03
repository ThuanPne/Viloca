## ADDED Requirements

### Requirement: FAB bản đồ mở Google Maps với waypoints
FAB bản đồ trong Timeline tab SHALL gọi `Linking.openURL` với Google Maps Directions URL chứa tất cả địa điểm của ngày đang chọn theo thứ tự `sort_order`, thay vì mở in-app Modal.

#### Scenario: Nhấn FAB với nhiều địa điểm
- **WHEN** user nhấn FAB bản đồ trong Timeline tab khi ngày đang chọn có từ 2 địa điểm trở lên
- **THEN** hệ thống mở Google Maps với URL Directions có `origin`, `destination`, và `waypoints` theo đúng thứ tự `sort_order`

#### Scenario: Nhấn FAB với 1 địa điểm
- **WHEN** user nhấn FAB bản đồ khi ngày đang chọn chỉ có 1 địa điểm
- **THEN** hệ thống mở Google Maps với URL Search cho địa điểm đó

#### Scenario: FAB ẩn khi không có địa điểm
- **WHEN** ngày đang chọn không có địa điểm nào
- **THEN** FAB bản đồ không hiển thị

#### Scenario: Fallback khi thiếu coordinates
- **WHEN** địa điểm không có `coordinates` (lat/lng)
- **THEN** hệ thống dùng `address` của địa điểm đó trong URL thay vì tọa độ
