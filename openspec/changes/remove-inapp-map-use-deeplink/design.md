## Context

`maps-trip-detail` change đã implement in-app `MapView` (react-native-maps) với `PROVIDER_GOOGLE`. Tuy nhiên Google Maps SDK on Android yêu cầu API key, và key này bắt buộc gắn với thẻ tín dụng trên Google Cloud — không khả thi hiện tại.

Code hiện tại đã có hàm `buildGoogleMapsUrl()` tạo Google Maps Directions URL với waypoints — đây là đủ để navigation. In-app map chỉ là "preview" còn lại.

## Goals / Non-Goals

**Goals:**
- Xóa dependency vào Google Maps SDK (và API key) khỏi app
- Giữ lại FAB bản đồ trong Timeline tab với behavior hữu ích
- Đơn giản hóa code: bỏ Modal phức tạp, bỏ state/ref không cần thiết

**Non-Goals:**
- Không thêm map library khác (WebView/Leaflet, Mapbox)
- Không thay đổi logic `buildGoogleMapsUrl` hay thứ tự waypoints
- Không xóa coordinates data đã seed vào Supabase

## Decisions

### FAB bản đồ: mở Google Maps trực tiếp thay vì Modal

**Quyết định:** FAB `onPress` gọi `Linking.openURL(buildGoogleMapsUrl(...))` trực tiếp.

**Lý do:** Modal chứa MapView là thứ duy nhất cần Google Maps SDK. Nếu bỏ Modal, FAB vẫn hữu ích và behavior navigation thực ra tốt hơn (dùng Google Maps app thật).

**Alternatives considered:**
- WebView + Leaflet: Không cần key nhưng gesture conflict với `react-native-gesture-handler`, tiles chậm, thêm dependency
- Mapbox: Cũng cần payment method cho free tier

### Giữ react-native-maps trong package.json

**Quyết định:** Không uninstall `react-native-maps`, chỉ xóa plugin khỏi `app.json` và không import nó nữa.

**Lý do:** Uninstall thêm rủi ro nếu có code khác import nó. Ưu tiên minimal change. Có thể uninstall sau khi verify build sạch.

### Xóa hoàn toàn Map Modal

**Quyết định:** Xóa `Modal` chứa MapView, không thay thế bằng gì.

**Lý do:** Không có alternative map library → không có gì để render trong Modal. Giữ Modal rỗng làm UX xấu hơn.

## Risks / Trade-offs

- **Mất in-app map preview** → Chấp nhận được: navigation use case phục vụ tốt hơn bởi Google Maps app
- **Cần prebuild sau khi xóa plugin** → Documented trong tasks, không ảnh hưởng development flow
- **Styles orphan** → Xóa các StyleSheet entries liên quan đến map để tránh dead code

## Migration Plan

1. Xóa import `MapView, Marker, Callout, PROVIDER_GOOGLE` khỏi `[id].tsx`
2. Xóa `showMapModal` state và `mapRef` ref
3. Cập nhật FAB `onPress` → gọi `Linking.openURL` trực tiếp
4. Xóa `<Modal>` block chứa MapView
5. Xóa các styles liên quan đến map modal
6. Xóa plugin `react-native-maps` khỏi `app.json`
7. Xóa `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` khỏi `.env.local`
8. Chạy `npx expo prebuild --platform android --clean` để regenerate native files

**Rollback:** Git revert. Không có DB change, không có breaking API change.
