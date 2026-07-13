## Why

Map Modal hiện dùng tile OSM mặc định (nặng, bận), marker nhỏ khó nhìn, không có thông tin hành trình (km/phút) và không hiển thị vị trí người dùng. Nâng cấp này giúp map trực quan hơn và thực tế hơn khi dùng ngoài thực địa.

## What Changes

**Giao diện map:**
- Đổi tile sang **CartoDB Positron** (nền trắng sạch, tối giản — không cần API key)
- Marker lớn hơn (36px) với **label tên địa điểm** hiển thị bên dưới
- Marker đầu (①) và cuối dùng style khác biệt để rõ điểm xuất phát/kết thúc
- Route dày hơn (5px) với **mũi tên chỉ hướng** dọc theo đường
- **Info bar** ở dưới bản đồ: tổng km + thời gian ước tính từ OSRM response

**Vị trí người dùng:**
- Cài `expo-location`, xin permission khi FAB được tap
- Nếu permission granted: lấy tọa độ hiện tại, truyền vào `buildLeafletHtml` cùng markers
- Vẽ **blue dot** (circle marker) tại vị trí người dùng kèm vòng pulse
- Nếu permission denied: map mở bình thường, không có blue dot

## Capabilities

### New Capabilities

- `map-user-location`: Hiển thị vị trí người dùng trên map dùng expo-location

### Modified Capabilities

- `trip-map-webview`: UI nâng cấp — tile, marker, route style, info bar

## Impact

- **app/trip/[id].tsx**: Cập nhật `buildLeafletHtml` (tile, marker CSS, info bar, user location dot), thêm logic xin location permission khi mở modal
- **package.json**: Thêm `expo-location`
- **app.json**: Thêm plugin `expo-location` nếu cần
- **Không breaking**: Fallback graceful khi không có permission hoặc GPS không khả dụng
