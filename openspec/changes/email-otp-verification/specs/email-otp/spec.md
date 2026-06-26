## ADDED Requirements

### Requirement: OTP input với 6 ô riêng biệt
Màn hình verify-email SHALL hiển thị 6 ô input riêng biệt để nhập mã OTP.

#### Scenario: Auto-advance khi gõ
- **WHEN** user gõ 1 digit vào ô thứ N
- **THEN** focus tự động chuyển sang ô thứ N+1

#### Scenario: Auto-advance đến cuối
- **WHEN** user gõ digit vào ô thứ 6
- **THEN** focus không chuyển đi đâu, form sẵn sàng submit

#### Scenario: Backspace xóa và lùi
- **WHEN** user nhấn Backspace trên ô trống
- **THEN** focus chuyển về ô trước và xóa giá trị ô đó

#### Scenario: Paste 6 số
- **WHEN** user paste chuỗi 6 chữ số vào bất kỳ ô nào
- **THEN** 6 ô được điền đầy đủ tương ứng

---

### Requirement: Xác nhận OTP với Supabase
Màn hình SHALL gọi `supabase.auth.verifyOtp()` khi đủ 6 số.

#### Scenario: Mã đúng
- **WHEN** user nhập đúng mã OTP 6 số
- **THEN** session được tạo, user được redirect vào `/(app)`

#### Scenario: Mã sai
- **WHEN** user nhập sai mã OTP
- **THEN** hiện inline error, 6 ô bị clear để nhập lại

#### Scenario: Mã hết hạn
- **WHEN** user nhập mã đã hết hạn (sau 10 phút)
- **THEN** hiện inline error "Mã đã hết hạn, vui lòng gửi lại"

---

### Requirement: Gửi lại OTP với countdown
Màn hình SHALL có nút "Gửi lại" với countdown 60 giây.

#### Scenario: Countdown khi mới vào màn hình
- **WHEN** màn hình verify-email vừa được mở
- **THEN** countdown bắt đầu từ 60s, nút "Gửi lại" bị disabled

#### Scenario: Nút active sau countdown
- **WHEN** countdown về 0
- **THEN** nút "Gửi lại" được enable

#### Scenario: Gửi lại thành công
- **WHEN** user nhấn "Gửi lại"
- **THEN** `supabase.auth.resend()` được gọi, countdown reset về 60s

---

### Requirement: Hiển thị email nhận OTP
Màn hình SHALL hiển thị rõ địa chỉ email mà OTP được gửi đến.

#### Scenario: Email được truyền qua params
- **WHEN** màn hình verify-email mở với param `email`
- **THEN** email được hiển thị trên màn hình để user xác nhận
