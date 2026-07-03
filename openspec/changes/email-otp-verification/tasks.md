## Tasks

### Bug fixes (thực hiện trước)

- [x] Sửa `app/(auth)/register.tsx`: đổi điều kiện từ `if (data.user)` sang `if (data.session)` — khi email confirmation ON, `data.user` luôn truthy nhưng `data.session = null`, nên code hiện tại redirect nhầm vào `/(app)` trước khi verify
- [x] Cập nhật `app/_layout.tsx`: thêm `useSegments()` vào auth guard, chỉ redirect về `/(auth)/welcome` khi không có session VÀ không đang ở `verify-email`

### New feature

- [x] Tạo `app/(auth)/verify-email.tsx` với layout cơ bản (tiêu đề, hiển thị email nhận OTP)
- [x] Thêm 6 ô OTP input với refs array và auto-advance khi gõ
- [x] Xử lý Backspace: focus về ô trước và xóa giá trị
- [x] Xử lý paste: nếu paste 6 chữ số thì điền cả 6 ô
- [x] Gọi `supabase.auth.verifyOtp()` khi đủ 6 số; hiện loading state trong lúc chờ; xử lý lỗi inline và clear OTP
- [x] Thêm countdown 60s và nút "Gửi lại" gọi `supabase.auth.resend()`
