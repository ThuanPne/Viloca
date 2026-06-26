## ADDED Requirements

### Requirement: Bảng `festivals` trong Supabase
Hệ thống SHALL có bảng `festivals` với các cột: `id` (uuid PK), `name` (text), `location` (text), `cover_image` (text), `month` (int 1-12), `start_date` (date nullable), `end_date` (date nullable), `description` (text), `tags` (text[]).

#### Scenario: Migration tạo bảng thành công
- **WHEN** migration được chạy
- **THEN** bảng `festivals` tồn tại với index trên `month`

### Requirement: Logic hiển thị festival theo tháng
Section "Sự kiện sắp diễn ra" SHALL chỉ hiển thị festivals chưa qua, theo logic:
- `month < currentMonth` → ẩn
- `month > currentMonth` → hiển thị badge "X tháng nữa"
- `month == currentMonth` và `start_date == null` → hiển thị badge "Coming Soon"
- `month == currentMonth` và `start_date >= today` → hiển thị badge "X ngày nữa"
- `month == currentMonth` và `start_date < today` → ẩn

#### Scenario: Festival tháng đã qua bị ẩn
- **WHEN** festival có `month` nhỏ hơn tháng hiện tại
- **THEN** festival không xuất hiện trong danh sách

#### Scenario: Festival tháng tương lai hiển thị countdown tháng
- **WHEN** festival có `month` lớn hơn tháng hiện tại
- **THEN** card hiển thị badge "X tháng nữa"

#### Scenario: Festival tháng này chưa có ngày
- **WHEN** `month == currentMonth` và `start_date == null`
- **THEN** card hiển thị badge "Coming Soon"

#### Scenario: Festival tháng này có ngày chưa tới
- **WHEN** `month == currentMonth` và `start_date >= today`
- **THEN** card hiển thị badge "X ngày nữa"

#### Scenario: Festival tháng này đã qua ngày
- **WHEN** `month == currentMonth` và `start_date < today`
- **THEN** festival không xuất hiện trong danh sách

### Requirement: Festival cards horizontal scroll
Festivals SHALL được hiển thị dưới dạng horizontal scroll cards với ảnh cover, tên, địa điểm, và badge trạng thái.

#### Scenario: Hiển thị card đúng thông tin
- **WHEN** festival được hiển thị
- **THEN** card có cover image, tên lễ hội, địa điểm tổ chức, và badge thời gian
