## ADDED Requirements

### Requirement: Greeting text thay đổi theo giờ trong ngày
Hook `useMascot` SHALL trả về greeting message phù hợp với giờ hiện tại và tên người dùng, cập nhật mỗi lần component mount.

#### Scenario: Buổi sáng (5:00 - 11:59)
- **WHEN** `useMascot` được gọi và giờ hiện tại nằm trong khoảng 5:00–11:59
- **THEN** trả về message chứa từ ngữ buổi sáng, ví dụ: "Chào buổi sáng! Hôm nay khám phá đâu nào? ☀️"

#### Scenario: Buổi chiều (12:00 - 17:59)
- **WHEN** `useMascot` được gọi và giờ hiện tại nằm trong khoảng 12:00–17:59
- **THEN** trả về message buổi chiều, ví dụ: "Chiều rồi, đi dạo đâu đó không? 🌿"

#### Scenario: Buổi tối (18:00 - 21:59)
- **WHEN** `useMascot` được gọi và giờ hiện tại nằm trong khoảng 18:00–21:59
- **THEN** trả về message buổi tối, ví dụ: "Tối rồi, tìm chỗ ăn ngon thôi! 🍜"

#### Scenario: Đêm khuya (22:00 - 4:59)
- **WHEN** `useMascot` được gọi và giờ hiện tại nằm trong khoảng 22:00–4:59
- **THEN** trả về message đêm, ví dụ: "Khuya rồi, lên kế hoạch chuyến đi ngày mai nhé 🌙"

### Requirement: Tích hợp Sen vào heroSection của Home screen
`app/(app)/index.tsx` SHALL hiển thị `MascotAvatar` và `MascotBubble` cạnh phải greeting text trong heroSection, không làm thay đổi layout hiện có của phần còn lại màn hình.

#### Scenario: Layout ngang trong heroSection
- **WHEN** Home screen render
- **THEN** heroSection hiển thị greeting text bên trái và Sen (avatar + bubble) bên phải trong cùng một hàng ngang (`flexDirection: 'row'`)

#### Scenario: Sen không đè lên content khác
- **WHEN** Home screen render trên màn hình nhỏ (320px width)
- **THEN** greeting text chiếm tối đa 60% chiều rộng, Sen chiếm 40%, không bị tràn ra ngoài
