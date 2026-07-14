# Stitch Prompt — Create Trip Screen Redesign

Design a "Create Trip" multi-step screen for a Vietnamese travel app (Viloca).
The app uses a nature/nomad color palette: primary green #5B7C3A,
light green containers, warm off-white backgrounds, dark text on light surfaces.
Font style: clean sans-serif, weights 400/600/800.

---

## OVERALL FLOW

3 steps shown by a dot + line progress indicator at the top.
Remove the intermediate "choose method" step — instead, place
two CTA buttons at the bottom of Step 1:
- Primary filled button: "✨ Tạo với AI"
- Secondary outlined button: "✏ Tự lên lịch"

---

## STEP 1 — Destination & Title

**TOP (above the fold):**
- Full-width destination photo hero, 220px tall, rounded bottom corners.
- Dark gradient overlay (bottom 60% of image).
- City name overlaid at bottom-left of the image in white bold text.
- If no destination selected yet, show a soft placeholder with a
  map-pin icon and text "Chọn điểm đến" centered on a muted green background.

**BELOW HERO:**
- "Điểm đến" label + tappable row (shows selected city or placeholder),
  with a chevron-down icon. Tapping opens a bottom sheet province picker.
- "Tên chuyến đi" label + text input field below it.
  Placeholder: "VD: Hội An cuối tuần"

**BOTTOM (fixed):**
- Two stacked buttons:
  - `[✨ Tạo lịch trình với AI]` ← primary filled green
  - `[✏ Tự lên lịch]` ← outlined, secondary

---

## STEP 2 (AI path) — Trip Preferences

Replace all dropdown/select fields with inline visual components:

**1. "Đi cùng ai?"**
→ 4 horizontal icon-chip buttons in a single row:
`[🧍 Solo]` `[💑 Cặp đôi]` `[👨‍👩‍👧 Gia đình]` `[👫 Nhóm bạn]`
Selected chip: filled green background, white text.
Unselected: outlined, muted text.

**2. "Phong cách chuyến đi" (required)**
→ Always-visible wrap chip grid (no dropdown), 6 chips:
`[Bình yên]` `[Cổ kính]` `[Hoang sơ]` `[Ẩm thực]` `[Mạo hiểm]` `[Văn hóa]`
Multi-select. Active chips: green fill.

**3. "Số người" + "Số ngày"**
→ Two stepper controls side-by-side in a card row:
`[ − ] 2 người [ + ]`     `[ − ] 3 ngày [ + ]`

**4. "Ngân sách / người / ngày" (required)**
→ 4 tappable budget cards in a 2×2 grid:

```
┌──────────────┐  ┌──────────────┐
│  Tiết kiệm   │  │  Trung bình  │
│ < 300k/ngày  │  │ 300–700k/ngày│
└──────────────┘  └──────────────┘
┌──────────────┐  ┌──────────────┐
│  Thoải mái   │  │   Cao cấp    │
│700k–1.5M/ngày│  │  1.5M+/ngày  │
└──────────────┘  └──────────────┘
```

Selected card: green border + green tint background + checkmark.

**5. "Lưu trú", "Phương tiện", "Mức độ hoạt động"**
→ Each is a horizontal scrollable chip row (3 options each):
- `[Homestay]` `[Khách sạn]` `[Camping]`
- `[Xe máy]` `[Thuê ô tô]` `[Xe khách]`
- `[Thư giãn]` `[Vừa phải]` `[Năng động]`

Single-select chips. Selected: green fill.

**BOTTOM (fixed):**
`[✨ Tạo lịch trình AI]` ← primary filled button

---

## STEP 2 (Manual path) — Pick Dates

Simple screen:
- "Ngày đi" date picker row
- "Ngày về" date picker row
- Small info hint text below: "Ngày đi có thể thêm sau"

**BOTTOM:**
`[Tạo Trip]` ← primary button

---

## AI LOADING STATE

Full-screen centered loading view:
- Large sparkles icon in a soft green circle (96×96px)
- Bold title: "AI đang tạo lịch trình"
- Subtitle: trip name · destination · N ngày
- Small activity spinner
- Progress log box (card with mono-style log lines,
  green checkmarks for success, red for errors)
- "Huỷ" text button at the bottom

---

## DESIGN NOTES

| Token | Value |
|---|---|
| Background | `#F8F6F1` warm off-white |
| Card / input surface | `#F2EFE8` |
| Primary | `#5B7C3A` dark green |
| Secondary / accent | `#8DAF5A` medium green |
| Error | `#DC2626` red |
| Border radius (chips/cards) | 10–12px |
| Horizontal padding | 16px throughout |

- No dropdowns anywhere in the redesigned form — every selection is visible inline (chips or cards)
- Consistent spacing and elevation across all interactive elements
