## ADDED Requirements

### Requirement: Route polyline màu xanh Google với viền trắng
Route SHALL được vẽ bằng kỹ thuật double polyline: một polyline trắng dày hơn ở dưới (casing) và một polyline xanh `#4285F4` ở trên — tạo hiệu ứng border trông như Google Maps.

#### Scenario: Route hiển thị màu xanh với viền trắng
- **WHEN** OSRM trả về route thành công
- **THEN** route hiển thị màu xanh `#4285F4` nổi bật với viền trắng bao quanh, thay vì đường xanh lá đơn thuần

#### Scenario: Fallback dashed line cũng có màu xanh
- **WHEN** OSRM request thất bại và fallback polyline thẳng được vẽ
- **THEN** dashed polyline cũng dùng màu xanh `#4285F4` thay vì xanh lá
