## Why

Màn hình đăng ký hiện tại chỉ là skeleton — không có validation, không có feedback về độ mạnh mật khẩu, và không bảo vệ user khỏi việc đặt mật khẩu yếu. Cần hoàn thiện trước khi app ra mắt.

## What Changes

- Thêm validation client-side cho email (format check) và password (5 điều kiện bắt buộc)
- Thêm password strength bar trực quan 4 mức: Yếu / Trung bình / Mạnh / Rất mạnh
- Thêm show/hide password toggle
- Thay thế `Alert` bằng inline error messages
- Wire up `supabase.auth.signUp()` với `full_name` từ input

## Capabilities

### New Capabilities
- `register-validation`: Validation đầy đủ cho form đăng ký — email format, password strength rules, inline errors, strength bar, show/hide toggle

### Modified Capabilities

## Impact

- `app/(auth)/register.tsx`: Viết lại toàn bộ
- Không thêm dependency mới
- Không thay đổi Supabase schema hay API
