## Context

App hiện có 2 palette màu trong `src/theme/colors.ts`: Warm (cam/kem, dùng ở tab bar) và Nomad (xanh lá/kem, dùng ở màn hình chính). Tab bar đang dùng `bgCard` (#FFFFFF) và `primary600` (#C8602E) — không nhất quán với Nomad palette đã thống trị UI.

Expo Router Tabs hỗ trợ custom `tabBarIcon` với prop `focused` (boolean), cho phép render khác nhau khi active/inactive mà không cần thư viện ngoài.

## Goals / Non-Goals

**Goals:**
- Tab bar nền kem, icon active có pill xanh lá đậm, icon inactive màu tối
- Nền tất cả màn hình qua `ScreenWrapper` đồng nhất màu kem
- Không thêm dependency mới

**Non-Goals:**
- Không thay đổi màu các component khác (Button, Badge, Card...)
- Không thay đổi navigation structure
- Không dark mode

## Decisions

### D1: Custom pill qua `tabBarIcon` wrapper, không dùng `tabBarBackground`

`tabBarBackground` chỉ thay được nền toàn bar. Pill per-icon cần custom `tabBarIcon` — wrap icon trong `<View>` với `backgroundColor` và `borderRadius` khi `focused`.

Thay thế đã xem xét: thư viện `react-native-tab-bar-interaction` — không cần thiết, tự implement đơn giản hơn.

### D2: Dùng `colors.nomad.*` trực tiếp, không tạo alias mới trong `colors.ts`

Các token Nomad đã đầy đủ và đúng tên. Thêm alias sẽ tạo redundancy. Chỉ cần import `colors.nomad.*` trong `_layout.tsx`.

### D3: Thay `bgScreen` bằng `nomad.background` trong `ScreenWrapper` — không thay đổi `colors.ts`

`colors.bgScreen` (#FAF7F2) và `colors.nomad.background` (#fafaf0) gần nhau nhưng khác nhau. Thay trực tiếp trong `ScreenWrapper.tsx` thay vì cập nhật `colors.ts` để tránh ảnh hưởng ngoài ý muốn đến các component khác đang dùng `bgScreen`.

## Risks / Trade-offs

- [Risk] Màu kem #fafaf0 rất nhạt — trên một số thiết bị Android có thể trông như trắng → **Mitigation**: Chấp nhận, vẫn giữ `nomad.outlineVariant` cho border top để phân tách rõ
- [Risk] `ScreenWrapper` được dùng bởi nhiều màn hình — thay đổi backgroundColor sẽ ảnh hưởng tất cả → **Mitigation**: Đây chính là mục tiêu; màu mới (#fafaf0) gần với màu cũ (#FAF7F2) nên visual diff nhỏ
