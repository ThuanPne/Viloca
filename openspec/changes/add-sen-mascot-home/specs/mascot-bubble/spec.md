## ADDED Requirements

### Requirement: Hiển thị speech bubble phía trên đầu Sen
Component `MascotBubble` SHALL hiển thị một hộp thoại dạng bubble với đuôi tam giác trỏ xuống phía Sen, chứa text message, và fade in khi mount.

#### Scenario: Fade in khi mount
- **WHEN** `MascotBubble` được render lần đầu
- **THEN** bubble xuất hiện với animation opacity từ 0 lên 1 trong 300ms

#### Scenario: Hiển thị text message
- **WHEN** prop `message` được truyền vào
- **THEN** text được hiển thị bên trong bubble, tối đa 2 dòng, font size 13

#### Scenario: Đuôi bubble trỏ xuống Sen
- **WHEN** bubble đang hiển thị
- **THEN** có một tam giác nhỏ ở cạnh dưới giữa bubble, màu trùng với nền bubble, tạo cảm giác lời thoại từ Sen nói lên
