## 1. Chuẩn bị assets

- [x] 1.1 Tạo thư mục `assets/mascot/`
- [x] 1.2 Crop ảnh Sen pose "Happy" (3D version) từ `assets/mascot.jpg` → lưu thành `assets/mascot/sen-happy.png`
- [x] 1.3 Crop ảnh Sen pose "Front" (3D version) từ `assets/mascot.jpg` → lưu thành `assets/mascot/sen-idle.png`

## 2. Types & Hook

- [x] 2.1 Tạo `types/mascot.ts` — định nghĩa `MascotEmotion` union type và `MascotState` interface
- [x] 2.2 Tạo `hooks/useMascot.ts` — logic chọn greeting text theo giờ (sáng/chiều/tối/đêm) và emotion tương ứng

## 3. Components

- [x] 3.1 Tạo `components/Mascot/MascotAvatar.tsx` — hiển thị PNG Sen, floating animation với Reanimated, fallback khi asset thiếu, tắt animation khi Reduce Motion bật
- [x] 3.2 Tạo `components/Mascot/MascotBubble.tsx` — speech bubble với đuôi tam giác, fade-in animation khi mount, prop `message: string`

## 4. Tích hợp Home screen

- [x] 4.1 Chỉnh `app/(app)/index.tsx` — wrap `heroSection` thành `flexDirection: 'row'`, greeting text chiếm `flex: 1` bên trái
- [x] 4.2 Thêm Sen container bên phải heroSection: gọi `useMascot()`, render `MascotAvatar` + `MascotBubble`
- [x] 4.3 Kiểm tra layout trên màn hình nhỏ (320px) — đảm bảo không tràn

## 5. Kiểm tra

- [ ] 5.1 Chạy app, xác nhận Sen hiển thị và floating animation hoạt động trên Home screen
- [ ] 5.2 Xác nhận greeting text thay đổi đúng theo giờ (sáng/chiều/tối)
- [ ] 5.3 Xác nhận bubble hiển thị đúng với đuôi trỏ xuống Sen

- [x] 5.4 Xác nhận không có TypeScript errors
