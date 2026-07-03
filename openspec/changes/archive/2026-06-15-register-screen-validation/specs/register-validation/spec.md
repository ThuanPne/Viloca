## ADDED Requirements

### Requirement: Email validation
Form đăng ký SHALL kiểm tra email hợp lệ trước khi submit.

#### Scenario: Email rỗng
- **WHEN** user nhấn nút đăng ký mà email trống
- **THEN** hiện inline error "Vui lòng nhập email"

#### Scenario: Email sai format
- **WHEN** user nhập email không có @ hoặc domain (vd: "abc", "abc@")
- **THEN** hiện inline error "Email không hợp lệ"

#### Scenario: Email hợp lệ
- **WHEN** user nhập email đúng format (vd: "user@example.com")
- **THEN** không hiện lỗi email

---

### Requirement: Password strength rules
Form đăng ký SHALL bắt buộc password đáp ứng đủ 5 điều kiện trước khi submit.

#### Scenario: Password thiếu điều kiện
- **WHEN** user nhập password không đủ 5 điều kiện (ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt)
- **THEN** nút đăng ký bị disabled và checklist hiển thị điều kiện nào chưa đạt (màu đỏ)

#### Scenario: Password đủ điều kiện
- **WHEN** user nhập password đáp ứng đủ 5 điều kiện
- **THEN** tất cả checklist chuyển xanh, nút đăng ký được enable

---

### Requirement: Password strength bar
Form đăng ký SHALL hiển thị thanh strength bar cập nhật realtime theo từng ký tự user nhập.

#### Scenario: Password yếu (0-1 điều kiện)
- **WHEN** user nhập password đáp ứng 0-1 điều kiện
- **THEN** strength bar hiển thị 1/4, màu đỏ, label "Yếu"

#### Scenario: Password trung bình (2-3 điều kiện)
- **WHEN** user nhập password đáp ứng 2-3 điều kiện
- **THEN** strength bar hiển thị 2/4, màu cam, label "Trung bình"

#### Scenario: Password mạnh (4 điều kiện)
- **WHEN** user nhập password đáp ứng 4 điều kiện
- **THEN** strength bar hiển thị 3/4, màu vàng, label "Mạnh"

#### Scenario: Password rất mạnh (5 điều kiện)
- **WHEN** user nhập password đáp ứng đủ 5 điều kiện
- **THEN** strength bar hiển thị 4/4, màu xanh lá, label "Rất mạnh"

---

### Requirement: Show/hide password toggle
Field password SHALL có nút toggle để ẩn/hiện ký tự mật khẩu.

#### Scenario: Mặc định ẩn
- **WHEN** màn hình vừa mở
- **THEN** password field ở chế độ `secureTextEntry` (hiện dấu •)

#### Scenario: Toggle hiện
- **WHEN** user nhấn nút "Hiện"
- **THEN** password field chuyển sang text thường, nút đổi thành "Ẩn"

#### Scenario: Toggle ẩn
- **WHEN** user nhấn nút "Ẩn"
- **THEN** password field quay lại `secureTextEntry`, nút đổi thành "Hiện"

---

### Requirement: Inline error messages
Form đăng ký SHALL hiển thị lỗi inline thay vì dùng Alert.

#### Scenario: Lỗi từ Supabase
- **WHEN** `signUp()` trả về lỗi (email đã tồn tại, v.v.)
- **THEN** hiện error box màu đỏ nhạt ngay trên nút đăng ký, không dùng Alert

#### Scenario: Xóa lỗi khi user sửa
- **WHEN** user bắt đầu chỉnh sửa bất kỳ field nào sau khi có lỗi
- **THEN** error box tự động ẩn đi
