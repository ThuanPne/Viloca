## Why

Sau khi đăng ký, user không biết phải làm gì — không có màn hình hướng dẫn verify email và không có cơ chế xác nhận danh tính. OTP 6 số đơn giản hơn magic link vì không cần config deep link, phù hợp với mobile app.

## What Changes

- Thêm màn hình `verify-email` với 6 ô input OTP, auto-advance, hỗ trợ paste
- Thêm countdown 60s cho nút "Gửi lại"
- Gọi `supabase.auth.verifyOtp()` để xác nhận mã
- Cập nhật `register.tsx`: sau signUp thành công redirect sang `verify-email` thay vì `login`
- Cần enable Email OTP trong Supabase Dashboard (manual step, ngoài code)

## Capabilities

### New Capabilities
- `email-otp`: Màn hình nhập OTP 6 số để xác nhận email sau đăng ký

### Modified Capabilities
- `register-validation`: Flow sau signUp thay đổi — redirect sang verify-email thay vì login

## Impact

- `app/(auth)/verify-email.tsx`: File mới
- `app/(auth)/register.tsx`: Thay đổi redirect sau signUp
- Không thêm dependency mới
- Supabase Dashboard: cần bật Email OTP thủ công
