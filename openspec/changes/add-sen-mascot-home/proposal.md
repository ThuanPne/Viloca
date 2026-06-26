## Why

App Viloca chưa có điểm nhấn cảm xúc — màn hình Home hiện tại chỉ có text và card ảnh, thiếu nhân vật đại diện gắn kết người dùng. Thêm mascot Sen vào Home screen tạo bản sắc riêng cho app, giúp người dùng cảm thấy được chào đón mỗi khi mở app, tương tự cách Duolingo dùng owl để tạo sự gắn bó.

## What Changes

- Thêm `MascotAvatar` component: hiển thị PNG Sen với floating animation lên xuống nhẹ (idle breathing)
- Thêm `MascotBubble` component: speech bubble reusable hiển thị lời chào phía trên đầu Sen
- Thêm `useMascot` hook: logic chọn greeting text theo giờ trong ngày (sáng/chiều/tối)
- Thêm `types/mascot.ts`: định nghĩa `MascotEmotion` và `MascotState`
- Chỉnh sửa `heroSection` trong `app/(app)/index.tsx`: Sen đứng cạnh phải greeting text, bubble nổi trên đầu

## Capabilities

### New Capabilities

- `mascot-avatar`: Hiển thị PNG mascot Sen với Reanimated floating animation, hỗ trợ nhiều emotion states
- `mascot-bubble`: Speech bubble reusable với fade-in animation, hỗ trợ nhiều kiểu message
- `mascot-greeting`: Logic chọn greeting text động theo giờ trong ngày, tích hợp vào Home screen

### Modified Capabilities

<!-- Không có capability nào thay đổi requirements -->

## Impact

- **Files mới**: `components/Mascot/MascotAvatar.tsx`, `components/Mascot/MascotBubble.tsx`, `hooks/useMascot.ts`, `types/mascot.ts`
- **Files chỉnh sửa**: `app/(app)/index.tsx` (thêm Sen vào heroSection)
- **Assets cần chuẩn bị**: `assets/mascot/sen-happy.png`, `assets/mascot/sen-idle.png` (user crop từ mascot.jpg)
- **Dependencies mới**: Không cần — dùng `react-native-reanimated` đã có sẵn
- **Không ảnh hưởng**: Auth, Supabase, navigation, các màn hình khác
