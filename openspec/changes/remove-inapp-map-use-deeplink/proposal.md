## Why

`react-native-maps` yêu cầu Google Maps API key trên Android, và key này bắt buộc phải có thẻ tín dụng để xác thực Google Cloud — không khả thi trong context hiện tại. Thay vì dùng WebView-based map (chậm, gesture conflict), hướng tối ưu hơn là xóa in-app `MapView` và để Google Maps app xử lý toàn bộ navigation qua deep-link.

## What Changes

- Xóa `MapView`, `Marker`, `Callout`, `PROVIDER_GOOGLE` khỏi `app/trip/[id].tsx`
- FAB bản đồ nhấn → gọi `Linking.openURL(buildGoogleMapsUrl(...))` trực tiếp, không mở Modal
- Xóa Map Modal (full-screen modal chứa MapView) khỏi render tree
- Xóa `react-native-maps` plugin khỏi `app.json`
- Xóa `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` khỏi `.env.local`
- Xóa `showMapModal` state và `mapRef` ref
- Giữ nguyên hàm `buildGoogleMapsUrl` và logic FAB hiển thị có điều kiện
- Giữ nguyên tất cả coordinates data đã seed vào Supabase (vẫn hữu ích sau này)

## Capabilities

### New Capabilities

- `map-deeplink`: FAB bản đồ trong Timeline tab mở Google Maps app với đầy đủ waypoints theo sort_order

### Modified Capabilities

*(không có — đây là xóa in-app map, không thay đổi spec hành vi nào đã tồn tại)*

## Impact

- **`app/trip/[id].tsx`**: Xóa MapView block, Modal, state, ref, styles liên quan đến map
- **`app.json`**: Xóa `react-native-maps` plugin entry
- **`.env.local`**: Xóa `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- **`react-native-maps`**: Vẫn còn trong `node_modules` / `package.json` (có thể uninstall sau nếu muốn)
- **Build**: Sau khi xóa plugin khỏi `app.json`, cần chạy `npx expo prebuild --platform android --clean` để regenerate native files không còn Google Maps SDK
