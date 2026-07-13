## Why

Người dùng đã lên lịch trình chi tiết theo từng ngày nhưng không có cách nào xem nhanh vị trí các địa điểm trên bản đồ, khiến việc hình dung lộ trình và điều hướng thực tế bị gián đoạn. Tính năng này giúp user xem toàn bộ markers ngày đang chọn trong app và chuyển thẳng sang Google Maps để navigate.

## What Changes

- Thêm FAB bản đồ (🗺) ở góc dưới bên trái tab Timeline trong màn hình Trip Detail, chỉ hiển thị khi ngày đang chọn có ít nhất 1 địa điểm
- Thêm Map Modal full-screen hiển thị `MapView` với markers cho các địa điểm của ngày đang chọn (theo `sort_order`), camera tự fit toàn bộ markers, mỗi marker có callout tên địa điểm
- Thêm nút "Mở Google Maps" trong modal tạo deep-link Directions với các địa điểm làm waypoints theo thứ tự lịch trình
- Populate `coordinates (lat, lng)` vào migration SQL cho locations SG, HN, ĐN hiện có
- Cài `react-native-maps` qua Expo config plugin
- Update select query và TypeScript type để fetch và expose `coordinates` từ joined `locations`

## Capabilities

### New Capabilities

- `trip-map-view`: Xem bản đồ markers các địa điểm trong một ngày của chuyến đi, với khả năng mở Google Maps directions

### Modified Capabilities

_(không có thay đổi yêu cầu cấp spec cho capability hiện có)_

## Impact

- **app/trip/[id].tsx**: Thêm FAB, Map Modal, update query select
- **src/types/index.ts**: Update `TripItem.locations` joined type thêm `coordinates`
- **supabase/migrations/**: Migration mới update coordinates cho existing locations
- **package.json / app.json**: Thêm `react-native-maps` dependency + Expo plugin config
- **Không breaking**: Locations không có coordinates sẽ bị bỏ qua marker, không crash
