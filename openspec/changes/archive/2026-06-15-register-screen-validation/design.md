## Context

Màn hình `app/(auth)/register.tsx` hiện là skeleton không có logic. Cần implement đầy đủ validation và UX cho form đăng ký, sử dụng Supabase Auth đã được cấu hình ở `lib/supabase.ts`.

## Goals / Non-Goals

**Goals:**
- Validation client-side đầy đủ (email format, password 5 điều kiện)
- Password strength bar realtime 4 mức
- Show/hide password toggle
- Inline error messages
- Wire up `supabase.auth.signUp()`

**Non-Goals:**
- Không check rockyou.txt — brute-force chặn ở Supabase server (rate limiting)
- Không làm OAuth (Google/Facebook) — scope riêng
- Không thêm dependency mới

## Decisions

### Password strength tính theo số điều kiện đạt được

Mỗi điều kiện đạt = +1 điểm (tổng 5):
- `0-1` → Yếu (đỏ, 1/4 bar)
- `2-3` → Trung bình (cam, 2/4 bar)
- `4`   → Mạnh (vàng, 3/4 bar)
- `5`   → Rất mạnh (xanh lá, 4/4 bar)

Lý do: Đơn giản, không cần thư viện ngoài, dễ mở rộng sau.

### Checklist điều kiện hiển thị ngay dưới password field

Hiển thị 5 điều kiện dạng checklist (✓/✗) realtime thay vì chỉ hiện lỗi khi submit. Lý do: UX tốt hơn — user biết cần làm gì ngay khi gõ.

### Submit button disabled cho đến khi đủ điều kiện

Thay vì show error khi submit, disable nút ngay từ đầu nếu chưa đủ điều kiện. Lý do: Tránh submit thất bại, UX rõ ràng hơn.

## Risks / Trade-offs

- Regex email đơn giản có thể chấp nhận một số email không thực tế → chấp nhận được, Supabase server sẽ validate lại
- Checklist hiển thị liên tục có thể làm form dài hơn → trade-off chấp nhận được vì UX rõ ràng hơn
