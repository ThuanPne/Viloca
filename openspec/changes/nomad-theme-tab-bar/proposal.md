## Why

Tab bar và nền các trang hiện đang dùng màu trắng/cam (`bgCard`, `primary600`) không đồng nhất với Nomad palette (xanh lá đậm + kem) đã được áp dụng ở phần lớn màn hình chính. Cần đồng bộ toàn bộ UI theo một hệ màu duy nhất.

## What Changes

- Tab bar nền đổi từ `#FFFFFF` (bgCard) sang `#fafaf0` (nomad.surface)
- Border top tab bar đổi sang `#c4c8b7` (nomad.outlineVariant)
- Icon active: thêm pill nền `#45611b` (nomad.primary) bọc quanh icon, icon đổi sang màu trắng
- Icon inactive: đổi từ cam sang `#44483c` (nomad.onSurfaceVariant)
- Label active: đổi từ cam sang `#45611b` (nomad.primary)
- Nền tất cả màn hình dùng `ScreenWrapper`: đổi từ `#FAF7F2` (bgScreen) sang `#fafaf0` (nomad.background)

## Capabilities

### New Capabilities

- `nomad-tab-bar`: Tab bar với pill indicator xanh lá đậm cho icon active, nền kem đồng nhất

### Modified Capabilities

- (none — đây là thay đổi implementation, không phải thay đổi spec-level behavior)

## Impact

- `app/(app)/_layout.tsx` — tab bar styles + custom `tabBarIcon` renderer
- `src/components/ui/ScreenWrapper.tsx` — background color
- Không ảnh hưởng đến API, data layer, hay navigation logic
