## ADDED Requirements

### Requirement: Sticky search bar phía trên tab bar
Trang chủ SHALL có search bar cố định phía trên tab bar, luôn hiển thị khi user scroll. Bar SHALL có blur backdrop effect và hiển thị placeholder "Tìm địa điểm, lễ hội, vibe...".

#### Scenario: Search bar luôn hiển thị khi scroll
- **WHEN** user scroll xuống bất kỳ vị trí nào trên trang chủ
- **THEN** search bar vẫn hiển thị ở cuối màn hình phía trên tab bar

#### Scenario: Content không bị che bởi search bar
- **WHEN** user scroll đến cuối trang
- **THEN** content cuối cùng không bị search bar che khuất

### Requirement: Filter chips dưới search bar
Dưới search input SHALL hiển thị 5 filter chips ngang: `#Hashtag`, `🏙 TP`, `✨ Vibe`, `📍 Địa điểm`, `🎯 Nhóm HĐ`. Chips SHALL scroll ngang nếu không vừa màn hình.

#### Scenario: Hiển thị filter chips
- **WHEN** user nhìn vào search bar area
- **THEN** thấy 5 chips filter bên dưới search input

### Requirement: Tap search bar mở filter sheet
Khi user tap vào search bar hoặc bất kỳ filter chip nào, SHALL hiển thị bottom sheet với các option filter tương ứng. Filter sheet SHALL có thể dismiss bằng cách swipe down hoặc tap ngoài vùng sheet.

#### Scenario: Tap search bar mở sheet
- **WHEN** user tap vào search input
- **THEN** bottom sheet filter xuất hiện với input tập trung

#### Scenario: Tap filter chip mở sheet đúng tab
- **WHEN** user tap chip "🏙 TP"
- **THEN** bottom sheet mở và focus vào tab/section chọn thành phố

#### Scenario: Dismiss sheet
- **WHEN** user swipe down hoặc tap backdrop
- **THEN** sheet đóng lại, search bar trở về trạng thái resting
