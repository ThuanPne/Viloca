## Why

Home screen dùng bảng màu xanh lá (`colors.nomad.*`, `#45611b`) trong khi Workspace và Trip Detail dùng màu cam terra-cotta (`colors.primary600`, `#C8602E`). Sự mâu thuẫn màu sắc này làm app bị vỡ phong cách nhìn thấy rõ khi chuyển tab.

## What Changes

- Thay toàn bộ `colors.primary600` → `colors.nomad.primary` trong Workspace, Trip Detail, Create Trip
- Thay `colors.primary100/400` (nền nhạt) → `colors.nomad.primaryContainer` / `#e8f0d8` trong cùng các file trên
- Giữ nguyên `src/theme/colors.ts` — chỉ đổi chỗ sử dụng, không xóa token

## Capabilities

### New Capabilities

<!-- Không có capability mới — đây là refactor UI thuần túy -->

### Modified Capabilities

- `app-color-scheme`: Accent color của Workspace, Trip Detail, Create Trip đổi từ cam → xanh lá để đồng bộ với Home

## Impact

- **Files sửa**: `app/(app)/workspace.tsx`, `app/trip/[id].tsx`, `app/create-trip.tsx`
- **Không ảnh hưởng**: Home screen, auth screens, migrations, Edge Functions
- **Visual**: Buttons, FAB, active chips, tab indicators, AI badge trên 3 screens trên sẽ đổi sang xanh lá
