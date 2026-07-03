## ADDED Requirements

### Requirement: Bảng `places` trong Supabase
Hệ thống SHALL có bảng `places` với các cột: `id` (uuid PK), `name` (text), `slug` (text unique), `region` (enum: `north`/`central`/`south`), `cover_image` (text), `description` (text), `experience_types` (text[]). Bảng SHALL được seed với ít nhất 10 địa điểm phổ biến.

#### Scenario: Tạo migration thành công
- **WHEN** migration được chạy
- **THEN** bảng `places` tồn tại với đúng schema và index trên `slug`

### Requirement: TypeScript type `Place`
Hệ thống SHALL export type `Place` từ `src/types/index.ts` phản ánh đúng schema DB.

#### Scenario: Type được sử dụng trong component
- **WHEN** component nhận data từ Supabase
- **THEN** TypeScript không báo lỗi type khi assign vào `Place`

### Requirement: `trips.place_id` nullable FK
Bảng `trips` SHALL có thêm cột `place_id UUID REFERENCES places(id) ON DELETE SET NULL` nullable. Cột `destination` text giữ nguyên để backward compat.

#### Scenario: Trip cũ không bị ảnh hưởng
- **WHEN** query trips cũ không có place_id
- **THEN** `place_id` trả về null, `destination` text vẫn có giá trị

#### Scenario: Trip mới có thể liên kết place
- **WHEN** tạo trip mới với place_id hợp lệ
- **THEN** trip được lưu với place_id và có thể JOIN với bảng places

### Requirement: Query "Địa điểm nổi bật"
Hệ thống SHALL cung cấp query trả về danh sách places được sắp xếp theo số trip có `status IN ('active', 'completed')` liên kết, giới hạn 6 kết quả.

#### Scenario: Trả về places có nhiều trip nhất
- **WHEN** gọi query featured places
- **THEN** place có nhiều trip active/completed nhất xuất hiện đầu tiên

#### Scenario: Fallback khi chưa có trip data
- **WHEN** chưa có trip nào liên kết với places
- **THEN** trả về 6 places đầu tiên theo thứ tự alphabetical
