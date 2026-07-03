# Viloca — UI Design System

## 1. Nguyên tắc thiết kế

- **Warm & Local** — màu sắc lấy cảm hứng từ đất đỏ Tây Nguyên (Terracotta) và rừng núi (Forest Green)
- **60-25-15 Rule** — 60% nền neutral, 25% Terracotta, 15% Forest Green
- **Content-first** — ảnh trải nghiệm là nhân vật chính, UI là khung nền
- **Vietnamese-first** — toàn bộ copy UI bằng tiếng Việt

---

## 2. Color Tokens

Định nghĩa trong `src/theme/colors.ts`. **Không hardcode hex trong component.**

```ts
export const colors = {
  // Primary — Terracotta
  primary600: '#C8602E',   // CTA buttons, active nav, header bar
  primary400: '#E8895C',   // Hover/pressed state, highlight
  primary100: '#F5E4D6',   // Tag background, chip, light badge

  // Secondary — Forest Green
  secondary600: '#3D7A5A', // Secondary action, nature badge, booking confirmed
  secondary400: '#72AA8A', // Icon, indicator, progress bar
  secondary100: '#D8EDE3', // Tag background, success state

  // Neutral
  bgScreen:  '#FAF7F2',    // Screen background (60% of UI)
  bgCard:    '#FFFFFF',    // Cards, bottom sheets, modals
  border:    '#EDE3D8',    // Dividers, input borders

  // Text
  textPrimary:  '#2D1A0E', // Headlines, body copy
  textMuted:    '#8A7060', // Subtitles, placeholder, labels
  textOnDark:   '#FFFFFF', // Text on colored/dark backgrounds

  // Semantic
  error:    '#DC2626',
  warning:  '#F59E0B',
  success:  '#16A34A',
}
```

---

## 3. Typography

Định nghĩa trong `src/theme/typography.ts`.

```ts
export const typography = {
  h1:    { fontSize: 28, fontWeight: '700', color: colors.textPrimary, lineHeight: 36 },
  h2:    { fontSize: 22, fontWeight: '600', color: colors.textPrimary, lineHeight: 30 },
  h3:    { fontSize: 18, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  body:  { fontSize: 15, fontWeight: '400', color: colors.textPrimary, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', color: colors.textMuted,   lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '500', color: colors.textMuted,   letterSpacing: 0.8, textTransform: 'uppercase' },
}
```

Font family: System default (SF Pro trên iOS, Roboto trên Android). Không cần custom font cho MVP.

---

## 4. Spacing & Radius

```ts
// src/theme/spacing.ts
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
}

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
}

export const shadow = {
  card: {
    shadowColor: '#2D1A0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bottom_sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
}
```

---

## 5. Component Library (`src/components/ui/`)

### Button
```tsx
<Button
  label="Đặt ngay"
  variant="primary"   // 'primary' | 'outline' | 'ghost'
  size="md"           // 'sm' | 'md' | 'lg'
  loading={false}
  disabled={false}
  onPress={() => {}}
/>
```
- `primary`: bg `primary600`, text white, border-radius `radius.xl`
- `outline`: border `primary600`, text `primary600`, transparent bg
- `ghost`: text `primary600`, no border, no bg
- Loading state: ActivityIndicator thay label, button disabled

### Tag
```tsx
<Tag label="Ẩm thực" color="terracotta" />
// color: 'terracotta' | 'forest' | 'neutral'
```
- `terracotta`: bg `primary100`, text `primary600`
- `forest`: bg `secondary100`, text `secondary600`
- `neutral`: bg `border`, text `textMuted`

### Avatar
```tsx
<Avatar uri="https://..." name="Nguyễn Văn A" size={48} />
```
- Fallback: initials từ `name`, bg `primary100`, text `primary600`
- Size: số pixel (40, 48, 64, 80)

### Card
```tsx
<Card onPress={() => {}} style={{}}>
  {children}
</Card>
```
- bg `bgCard`, border-radius `radius.lg`, shadow `card`
- pressable với scale animation nhẹ (0.98)

### Badge
```tsx
<Badge label="Đang lên kế hoạch" color="warning" />
// color: 'primary' | 'forest' | 'warning' | 'error' | 'neutral'
```
- Nhỏ hơn Tag, dùng cho status indicators

### SectionHeader
```tsx
<SectionHeader
  title="ĐANG NỔI BẬT"
  actionLabel="Xem tất cả"
  onAction={() => {}}
/>
```
- Title: `typography.label` (uppercase)
- Action link: text `primary600`, phải

### EmptyState
```tsx
<EmptyState
  icon="map-outline"
  title="Chưa có chuyến đi nào"
  body="Tạo trip đầu tiên để bắt đầu hành trình"
  ctaLabel="Tạo Trip"
  onCta={() => {}}
/>
```
- Center layout, icon Ionicons size 64 màu `border`

### ScreenWrapper
```tsx
<ScreenWrapper scrollable={false}>
  {children}
</ScreenWrapper>
```
- SafeAreaView + bg `bgScreen`
- `scrollable`: wrap trong ScrollView với padding chuẩn

---

## 6. Navigation

### Tab Bar
- 3 tabs: Khám phá (compass), Trip (map), Hồ sơ (person)
- Active: `primary600`, Inactive: `textMuted`
- Background: `bgCard`, border top: `border`

### Screen Headers
- Không dùng default React Navigation header
- Tự custom header trong từng screen
- Phần lớn screens dùng `headerShown: false`

---

## 7. Screen-by-screen Layout

### Splash
- Full screen bg `primary600`
- Center: Text "Viloca" — 48pt bold white
- Tagline: "Experience local culture like a local" — white 75%
- Bottom: 3 dots loading animation

### Onboarding (4 slides trong FlatList horizontal)
- Slides 1–3: Image (picsum) full width height 300, title h2, body text, dots indicator
- Slide 4 (Auth Form): Toggle Đăng nhập / Đăng ký, input Email + Password, CTA button primary
- Dots: active `primary600`, inactive `primary100`

### Home — Discovery Feed
```
[Header: Avatar + "Xin chào [tên]" | Bell icon]
[Search Bar — non-functional MVP]
[Category Filter — HorizontalScrollView tags]
  Tất cả · Ẩm thực · Văn hóa · Thiên nhiên · Workshop
[Section: ĐANG NỔI BẬT]
  [FeaturedCard x3 — width 260, height 180, overlay gradient]
[Section: TRẢI NGHIỆM GỢI Ý]
  [ExperienceRow x12 — horizontal card: image 80×80 | info]
```

### Experience Bottom Sheet
```
[Cover Image — full width 200px]
[Title, Location, Rating ⭐, Price 💰, Duration ⏱]
[Description — 3 dòng]
[Tags row]
[Button: "Thêm vào Trip" — primary600]
```

### Trip Workspace
```
[Header: "Trip Workspace" | "+ Trip mới"]
[Empty state hoặc list trip cards]
  TripCard: cover image 160px, title, destination, date range, status badge
```

### Trip Detail — 4 tabs nội tuyến
- **Timeline**: List ngày → buổi → experience slot → drag reorder
- **Map**: react-native-maps, markers `primary600`, fit all markers
- **Journal**: list entries theo ngày, TextInput multiline, ảnh tùy chọn
- **Info**: Edit title, destination, date range, cover image, nút Xóa

### Profile
```
[Avatar 80px | Full name h2 | Bio small]
[Button: "Chỉnh sửa hồ sơ" — outline]
[Stats row: Trips | Trải nghiệm | Địa điểm]
[Travel Style tags — tappable toggle]
[My Trips — horizontal scroll]
[Settings list]
[Nút Đăng xuất — text primary600]
```

---

## 8. Micro-interactions

- Card press: scale 0.97, duration 100ms
- Tab switch: no animation (instant)
- Bottom sheet: slide up 300ms ease-out
- Toast notifications: slide in top, auto-dismiss 3s
- Loading states: skeleton shimmer (bg gradient `border` → `bgCard`)
- Error states: inline text màu `error`, không dùng alert()

---

## 9. Image Handling

- Tất cả experience images: `https://picsum.photos/seed/{keyword}/400/300`
- Avatar fallback: initials component
- Cover images trong trip: ImagePicker hoặc picsum default
- Không download ảnh về local — dùng URL trực tiếp
