## 1. Cập nhật app/trip/[id].tsx

- [x] 1.1 Xóa import `MapView, Marker, Callout, PROVIDER_GOOGLE` từ `react-native-maps`
- [x] 1.2 Xóa `const [showMapModal, setShowMapModal] = useState(false)`
- [x] 1.3 Xóa `const mapRef = useRef<MapView>(null)`
- [x] 1.4 Cập nhật FAB bản đồ: đổi `onPress` từ `setShowMapModal(true)` thành `Linking.openURL(buildGoogleMapsUrl(itemsByDay[selectedDay] ?? []))`
- [x] 1.5 Xóa toàn bộ `<Modal visible={showMapModal} ...>...</Modal>` block chứa MapView
- [x] 1.6 Xóa các StyleSheet entries liên quan đến map modal: `mapModalContainer`, `mapModalHeader`, `mapModalCloseBtn`, `mapModalTitle`, `mapOpenGMapsBtn`, `mapOpenGMapsText`, `mapEmptyWrap`, `mapEmptyText`, `mapEmptySubText`, `mapCallout`, `mapCalloutNum`, `mapCalloutName`

## 2. Cập nhật config và environment

- [x] 2.1 Xóa entry `["react-native-maps", { "googleMapsApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" }]` khỏi `plugins` array trong `app.json`
- [x] 2.2 Xóa dòng `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE` khỏi `.env.local`

## 3. Kiểm thử

- [x] 3.1 TypeScript check: `npx tsc --noEmit` không báo lỗi
- [ ] 3.2 Test FAB hiển thị đúng điều kiện: chỉ hiện khi `tab === 'timeline'` và ngày có địa điểm
- [ ] 3.3 Test FAB nhấn mở Google Maps với đúng waypoints
- [ ] 3.4 Chạy prebuild sau khi xóa plugin: `npx expo prebuild --platform android --clean`

