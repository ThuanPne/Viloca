## ADDED Requirements

### Requirement: Hiển thị mascot Sen với floating animation
Component `MascotAvatar` SHALL hiển thị ảnh PNG của Sen và tự động chạy animation float lên xuống liên tục (idle breathing) ngay khi mount, không cần trigger từ bên ngoài.

#### Scenario: Mount component với pose mặc định
- **WHEN** `MascotAvatar` được render mà không truyền prop `emotion`
- **THEN** component hiển thị ảnh `sen-happy.png` và bắt đầu floating animation

#### Scenario: Floating animation chạy liên tục
- **WHEN** component đang hiển thị
- **THEN** Sen nổi lên 8px rồi xuống về vị trí ban đầu, lặp vô hạn, thời gian mỗi chu kỳ khoảng 2 giây, easing mượt (ease-in-out)

#### Scenario: Truyền emotion prop
- **WHEN** prop `emotion` được truyền vào (vd: `"happy"`, `"idle"`, `"excited"`)
- **THEN** component hiển thị ảnh PNG tương ứng với emotion đó

#### Scenario: Asset không tìm thấy
- **WHEN** file PNG của emotion được yêu cầu chưa có trong `assets/mascot/`
- **THEN** component fallback về `sen-happy.png` mà không crash

#### Scenario: Reduced motion
- **WHEN** thiết bị bật chế độ "Reduce Motion" trong accessibility settings
- **THEN** floating animation bị tắt, Sen hiển thị tĩnh không chuyển động
