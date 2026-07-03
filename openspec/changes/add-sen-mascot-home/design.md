## Context

Home screen hiện tại (`app/(app)/index.tsx`) có `heroSection` chỉ gồm greeting text thuần túy. Không có mascot, không có visual companion. Stack đã có `react-native-reanimated 4.3.1` — animation library mạnh nhất cho RN, chạy trên UI thread. Không có 3D model hay Lottie assets; chỉ có `assets/mascot.jpg` là sheet tổng hợp 2D + 3D renders của Sen.

## Goals / Non-Goals

**Goals:**
- Sen xuất hiện cạnh phải greeting text với floating animation nhẹ
- Speech bubble hiện lời chào theo giờ trong ngày
- Architecture đủ mở rộng để sau thêm màn hình khác, emotion khác
- Không thêm dependency mới

**Non-Goals:**
- Lottie animations, Three.js, WebGL
- Particle effects (hearts, confetti) — để sau
- Tích hợp vào màn hình khác ngoài Home
- Mascot phản ứng với scroll hay gesture

## Decisions

### D1: PNG assets thay vì SVG hay Lottie

**Chọn**: PNG renders crop từ mascot sheet.

**Lý do**: Không có designer để làm Lottie. SVG thuần code mất nhiều thời gian và khó bảo trì. PNG từ sheet đã có sẵn 3D render đẹp, crop ra là dùng được. Motion (float, bounce) làm bằng Reanimated transforms trên View bọc Image — không cần recreate visual trong code.

**Thay thế đã xét**: SVG layers (quá nhiều code cho MVP), react-three-fiber (overkill, rủi ro bundle size + performance), Lottie (cần designer export .json).

**Trade-off**: Mỗi emotion state là một file PNG riêng → cần crop thủ công. Chấp nhận được ở giai đoạn MVP.

---

### D2: Reanimated `useAnimatedStyle` + `withRepeat` cho idle float

**Chọn**: 
```
translateY: withRepeat(
  withSequence(
    withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
    withTiming(0,  { duration: 1000, easing: Easing.inOut(Easing.ease) })
  ),
  -1,   // infinite
  false // không reverse tự động — sequence đã handle
)
```

**Lý do**: Chạy trên UI thread, 60fps, không block JS thread. `withRepeat(-1)` đảm bảo chạy vô hạn mà không cần interval.

**Accessibility**: Kiểm tra `AccessibilityInfo.isReduceMotionEnabled()` trước khi start animation, tắt nếu user bật Reduce Motion.

---

### D3: `useMascot` hook tập trung logic emotion + greeting

**Chọn**: Hook đơn giản trả về `{ emotion, greeting }` dựa trên giờ hiện tại.

```typescript
// types/mascot.ts
type MascotEmotion = 'idle' | 'happy' | 'excited' | 'thinking' | 'surprised' | 'love' | 'winking'

interface MascotState {
  emotion: MascotEmotion
  greeting: string
}
```

**Lý do**: Tách logic ra hook giúp Home screen gọn, dễ test, và sau này các màn hình khác dùng lại hook mà không duplicate logic.

---

### D4: Layout heroSection dùng `flexDirection: 'row'`

Greeting text bên trái (`flex: 1`), Sen container bên phải (`width: 100`, `alignItems: 'center'`). Bubble float absolute phía trên Sen container.

```
┌──────────────────────────────────────────┐
│  heroSection (flexDirection: 'row')      │
│  ┌──────────────────┐  ┌──────────────┐  │
│  │ greeting (flex:1)│  │  Sen (w:100) │  │
│  │ "Minh ơi!"       │  │  [bubble]    │  │
│  │ "Hôm nay..."     │  │  [avatar]↕  │  │
│  └──────────────────┘  └──────────────┘  │
└──────────────────────────────────────────┘
```

Bubble dùng `position: 'absolute'`, `bottom: '100%'` để nổi trên đầu avatar.

## Risks / Trade-offs

- **[Risk] Asset chưa có** → User cần tự crop PNG từ mascot.jpg trước khi chạy. Mitigation: Dùng placeholder màu hồng (View với borderRadius) khi file chưa có, tránh crash.

- **[Risk] heroSection layout thay đổi** → Thêm row layout có thể ảnh hưởng padding/margin hiện tại. Mitigation: Wrap greeting text trong `flex: 1` View, giữ nguyên style text bên trong.

- **[Risk] Reanimated v4 API khác v2/v3** → Project đang dùng v4.3.1, một số API mới (worklets syntax). Mitigation: Dùng `useSharedValue` + `useAnimatedStyle` là API stable xuyên suốt các version.

## Open Questions

- **Kích thước Sen trên Home screen bao nhiêu?** Đề xuất `width: 90, height: 110` — đủ lớn để thấy rõ Sen, không chiếm quá nhiều không gian greeting.
- **Bubble tự ẩn sau bao lâu?** Đề xuất hiển thị mãi — không auto-hide ở MVP. Sau có thể thêm timer 5s.
