## 1. State & Validation Logic

- [x] 1.1 Thêm state: `name`, `email`, `password`, `showPassword`, `loading`, `error`
- [x] 1.2 Viết hàm `getPasswordConditions(password)` trả về 5 boolean (minLength, hasUpper, hasLower, hasNumber, hasSpecial)
- [x] 1.3 Viết hàm `getPasswordStrength(conditions)` trả về 0-4 dựa trên số điều kiện đạt
- [x] 1.4 Viết hàm `validateEmail(email)` dùng regex đơn giản

## 2. UI Components

- [x] 2.1 Thêm password strength bar (4 đoạn màu, cập nhật realtime)
- [x] 2.2 Thêm checklist 5 điều kiện password ngay dưới strength bar (✓ xanh / ✗ đỏ)
- [x] 2.3 Thêm show/hide toggle trong password field
- [x] 2.4 Thêm inline error box màu đỏ nhạt (ẩn khi không có lỗi)
- [x] 2.5 Disable nút "Tạo tài khoản" khi chưa đủ 5 điều kiện password hoặc email chưa hợp lệ

## 3. Submit & Supabase

- [x] 3.1 Viết hàm `handleRegister()`: validate → gọi `supabase.auth.signUp()` → xử lý kết quả
- [x] 3.2 Xử lý case `data.user` có ngay → `setUser()` → `router.replace('/(app)')`
- [x] 3.3 Xử lý case cần xác nhận email → hiện thông báo, redirect về login
- [x] 3.4 Xử lý error từ Supabase → hiện inline error box
