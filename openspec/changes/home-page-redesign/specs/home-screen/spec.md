## ADDED Requirements

### Requirement: Tab được đổi tên và icon
Tab "Khám phá" SHALL được đổi thành "Trang Chủ" với icon `home-outline`.

#### Scenario: Hiển thị tab đúng tên
- **WHEN** user mở app và vào màn hình chính
- **THEN** tab bar hiển thị "Trang Chủ" với icon home

### Requirement: Header trang chủ
Trang chủ SHALL hiển thị header gồm tên app "Viloca" và nút thông báo (bell icon). Không hiển thị greeting hay avatar ở header.

#### Scenario: Hiển thị header
- **WHEN** user ở màn hình Trang Chủ
- **THEN** header hiển thị "Viloca" bên trái và icon thông báo bên phải

### Requirement: Layout scroll content
Trang chủ SHALL có ScrollView dọc với 3 section theo thứ tự: Sự kiện sắp diễn ra → Nhóm địa điểm → Địa điểm nổi bật. ScrollView SHALL có `paddingBottom` đủ để không bị sticky search bar che.

#### Scenario: Scroll qua các section
- **WHEN** user scroll xuống trang chủ
- **THEN** lần lượt thấy Sự kiện → Nhóm địa điểm → Địa điểm nổi bật

### Requirement: Áp dụng Organic Nomad design tokens
Trang chủ SHALL dùng màu nền `#fafaf0` (cream), primary `#45611b` (green), cards không có border, shadow blur mờ. Heading dùng Plus Jakarta Sans, body dùng Be Vietnam Pro.

#### Scenario: Nền cream được áp dụng
- **WHEN** user mở Trang Chủ
- **THEN** màn hình có nền cream `#fafaf0`, không phải trắng thuần
