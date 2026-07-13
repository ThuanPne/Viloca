## 1. Tab Bar Styles

- [x] 1.1 Trong `app/(app)/_layout.tsx`, cập nhật `tabBarStyle`: đổi `backgroundColor` sang `colors.nomad.surface`, `borderTopColor` sang `colors.nomad.outlineVariant`
- [x] 1.2 Đổi `tabBarActiveTintColor` sang `colors.nomad.onPrimary` (#ffffff)
- [x] 1.3 Đổi `tabBarInactiveTintColor` sang `colors.nomad.onSurfaceVariant` (#44483c)
- [x] 1.4 Thêm `tabBarActiveLabelStyle` với màu `colors.nomad.primary` để label active đúng màu

## 2. Pill Icon Active

- [x] 2.1 Tạo helper component hoặc inline wrapper trong `tabBarIcon` của từng tab: khi `focused === true`, bọc icon trong `<View>` với `backgroundColor: colors.nomad.primary`, `borderRadius: 12`, `paddingHorizontal: 16`, `paddingVertical: 6`
- [x] 2.2 Áp dụng wrapper pill cho tab "Trang chủ" (index)
- [x] 2.3 Áp dụng wrapper pill cho tab "Khám phá" (explore)
- [x] 2.4 Áp dụng wrapper pill cho tab "Chuyến đi" (workspace)
- [x] 2.5 Áp dụng wrapper pill cho tab "Hồ sơ" (profile)

## 3. Nền Màn Hình

- [x] 3.1 Trong `src/components/ui/ScreenWrapper.tsx`, đổi `backgroundColor` từ `colors.bgScreen` sang `colors.nomad.background`
