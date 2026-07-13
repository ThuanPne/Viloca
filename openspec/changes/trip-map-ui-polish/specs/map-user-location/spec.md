## ADDED Requirements

### Requirement: Xin location permission khi mở Map Modal
Khi user tap FAB 🗺, hệ thống SHALL xin foreground location permission trước khi mở Map Modal. Nếu permission granted, SHALL lấy vị trí hiện tại và truyền vào map. Nếu denied, SHALL mở map bình thường không có blue dot.

#### Scenario: Permission granted lần đầu
- **WHEN** user tap FAB 🗺 và chưa có location permission
- **THEN** dialog xin permission hiển thị; nếu user chấp nhận, map mở với blue dot vị trí hiện tại

#### Scenario: Permission đã có sẵn
- **WHEN** user tap FAB 🗺 và permission đã được cấp từ trước
- **THEN** map mở ngay với blue dot vị trí hiện tại (không hỏi lại)

#### Scenario: Permission bị từ chối
- **WHEN** user từ chối permission hoặc permission đã bị revoke
- **THEN** map mở bình thường không có blue dot, không hiển thị lỗi

---

### Requirement: Blue dot vị trí người dùng trên map
Khi có location data, Map SHALL hiển thị blue dot tại vị trí người dùng với hiệu ứng pulse để phân biệt với markers lịch trình.

#### Scenario: Blue dot hiển thị đúng vị trí
- **WHEN** map load với location data hợp lệ
- **THEN** circle marker màu xanh dương xuất hiện tại tọa độ người dùng với animation pulse

#### Scenario: Blue dot không ảnh hưởng camera fitBounds
- **WHEN** map load với cả markers lịch trình và blue dot
- **THEN** camera fit bounds CHỈ theo markers lịch trình, không bao gồm vị trí người dùng (tránh zoom out quá xa nếu user ở xa)

#### Scenario: Không có location data
- **WHEN** map load mà không có location data (permission denied hoặc GPS lỗi)
- **THEN** bản đồ hiển thị bình thường chỉ với markers lịch trình, không có blue dot
