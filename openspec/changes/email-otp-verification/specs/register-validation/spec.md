## MODIFIED Requirements

### Requirement: Submit đăng ký thành công
Sau khi `signUp()` thành công, hệ thống SHALL redirect sang màn hình verify-email thay vì login.

#### Scenario: signUp thành công, cần verify email
- **WHEN** `supabase.auth.signUp()` trả về không có lỗi và `data.user` chưa có session
- **THEN** router redirect sang `/(auth)/verify-email?email=<email_vừa_nhập>` thay vì `/(auth)/login`

#### Scenario: signUp thất bại
- **WHEN** `supabase.auth.signUp()` trả về lỗi
- **THEN** hiện inline error như cũ, không redirect
