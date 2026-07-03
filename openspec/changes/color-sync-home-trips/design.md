## Context

App Viloca có 2 bảng màu đang tồn tại song song:
- **nomad palette** (`colors.nomad.*`): forest green `#45611b` — dùng trên Home screen
- **primary palette** (`colors.primary*`): terra-cotta cam `#C8602E` — dùng trên Workspace, Trip Detail, Create Trip

Cả 2 đều được định nghĩa trong `src/theme/colors.ts`. Vấn đề là chúng được dùng không nhất quán, tạo ra 2 accent color khác nhau khi user điều hướng giữa các màn hình.

## Goals / Non-Goals

**Goals:**
- Tất cả interactive elements (FAB, primary buttons, active chips, tab indicators, AI badge) dùng `colors.nomad.primary` trên mọi màn hình
- Không thay đổi layout hay logic, chỉ thay màu

**Non-Goals:**
- Không xóa token `primary600` khỏi `colors.ts` (các screen khác có thể dùng)
- Không đổi màu auth screens (login, register)
- Không tạo theme system động (dark mode, custom theme)

## Decisions

**Thay trực tiếp trong từng file thay vì tạo shared constant mới**

Lý do: 3 files cần sửa, pattern thay thế đơn giản (`primary600` → `nomad.primary`). Tạo thêm layer abstraction không cần thiết cho scope này.

**Giữ nguyên `colors.ts`**

Token `primary600` vẫn tồn tại để tránh ảnh hưởng screens khác. Chỉ đổi nơi sử dụng trong 3 files mục tiêu.

**Background nhạt**: `colors.primary100` (`#F5E4D6`) → `#e8f0d8` (green tint nhạt tương đương)

`colors.nomad` không có token `*100` tương đương nên dùng hex literal nhất quán với palette xanh lá.

## Risks / Trade-offs

- [Risk] Một số chỗ dùng `primary600` có thể bị bỏ sót → Mitigation: dùng search `primary600` để kiểm tra sau khi sửa
- [Trade-off] Dùng hex literal `#e8f0d8` thay vì token → Có thể refactor sau nếu cần thêm token vào `colors.ts`
