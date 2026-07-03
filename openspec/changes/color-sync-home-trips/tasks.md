## 1. workspace.tsx — Đồng bộ màu

- [x] 1.1 Thay `colors.primary600` → `colors.nomad.primary` cho FAB, AI buttons, step indicators
- [x] 1.2 Thay `colors.primary100` / `colors.primary400` → `#e8f0d8` / `colors.nomad.primaryContainer` cho chip active backgrounds
- [x] 1.3 Thay `colors.primary600` → `colors.nomad.primary` cho vibeChipActive, budgetChipActive borders và text

## 2. create-trip.tsx — Đồng bộ màu

- [x] 2.1 Thay `colors.primary600` → `colors.nomad.primary` cho CTA buttons (đã dùng nomad từ trước, không cần sửa)
- [x] 2.2 Thay `colors.primary600` → `colors.nomad.primary` cho step dot active, province picker (đã nomad)
- [x] 2.3 Thay `colors.primary100` → `#e8f0d8` cho chip/card active background (đã nomad)

## 3. trip/[id].tsx — Đồng bộ màu

- [x] 3.1 Thay `colors.primary600` → `colors.nomad.primary` cho tab active indicator, day pill
- [x] 3.2 Thay `colors.primary600` → `colors.nomad.primary` cho AI banner button, FAB
- [x] 3.3 Thay `colors.primary600` → `colors.nomad.primary` cho setup card icon, freemium banner text/icon
- [x] 3.4 Thay `colors.primary100` → `#e8f0d8` cho active chip backgrounds

## 4. Kiểm tra

- [x] 4.1 Grep toàn bộ 3 file để đảm bảo không còn `primary600` nào sót
- [ ] 4.2 Chạy `npx expo start` → kiểm tra visual trên Workspace, Create Trip, Trip Detail
