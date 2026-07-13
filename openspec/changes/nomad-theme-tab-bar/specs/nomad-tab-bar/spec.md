## ADDED Requirements

### Requirement: Tab bar dùng Nomad palette
Tab bar SHALL hiển thị nền màu `colors.nomad.surface` (#fafaf0) với border top màu `colors.nomad.outlineVariant` (#c4c8b7).

#### Scenario: Tab bar nền kem
- **WHEN** user mở bất kỳ màn hình nào trong app group
- **THEN** tab bar hiển thị nền màu #fafaf0, không phải trắng

### Requirement: Icon active có pill xanh lá đậm
Khi một tab đang được chọn (focused), icon SHALL được bọc trong pill có `backgroundColor: colors.nomad.primary` (#45611b), `borderRadius: 12`, `paddingHorizontal: 16`, `paddingVertical: 6`. Icon SHALL hiển thị màu trắng (`colors.nomad.onPrimary`). Label SHALL hiển thị màu `colors.nomad.primary`.

#### Scenario: Pill xuất hiện khi tab active
- **WHEN** user tap vào một tab icon
- **THEN** icon đó được bọc trong pill xanh lá đậm, icon màu trắng, label màu xanh lá đậm

#### Scenario: Pill biến mất khi chuyển tab
- **WHEN** user tap sang tab khác
- **THEN** pill của tab cũ biến mất, icon trở về màu `colors.nomad.onSurfaceVariant` (#44483c)

### Requirement: Icon inactive màu tối trung tính
Icon không được chọn SHALL hiển thị màu `colors.nomad.onSurfaceVariant` (#44483c), không dùng màu cam.

#### Scenario: Icon inactive đúng màu
- **WHEN** tab không được chọn
- **THEN** icon hiển thị màu #44483c

### Requirement: Nền màn hình đồng nhất
Tất cả màn hình dùng `ScreenWrapper` SHALL hiển thị nền màu `colors.nomad.background` (#fafaf0).

#### Scenario: Nền màn hình kem Nomad
- **WHEN** user điều hướng đến bất kỳ màn hình nào dùng ScreenWrapper
- **THEN** nền màn hình hiển thị màu #fafaf0
