## Why

Hiện tại Map Modal chỉ hiển thị route của một ngày cố định — để xem ngày khác user phải đóng modal, chuyển ngày, rồi mở lại. Thêm day switcher ngay trong modal giúp user duyệt qua lộ trình từng ngày liền mạch mà không cần thoát ra.

## What Changes

- Thêm **day switcher chip bar** bên dưới header của Map Modal, hiển thị danh sách ngày có địa điểm có coordinates hợp lệ
- Chip ngày đang chọn được highlight theo màu primary
- Khi tap chip ngày khác, WebView reload với route OSRM của ngày đó (dùng `key` prop để force remount)
- Thêm state `mapDay` độc lập trong modal — khởi tạo từ `selectedDay` của Timeline nhưng có thể thay đổi độc lập bên trong modal
- Map Modal header cập nhật title thành "Ngày X · Tên ngày" theo ngày đang chọn trong modal

## Capabilities

### New Capabilities

_(không có capability mới)_

### Modified Capabilities

- `trip-map-webview`: Day switcher trong modal — yêu cầu mới về điều hướng ngày bên trong Map Modal

## Impact

- **app/trip/[id].tsx**: Thêm state `mapDay`, day switcher UI trong Map Modal, `key` prop trên WebView, tính toán danh sách ngày có coordinates
- **Không breaking**: FAB, markers, OSRM routing, nút Google Maps, đóng modal đều giữ nguyên
