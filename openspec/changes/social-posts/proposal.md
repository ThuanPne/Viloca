## Why

App hiện tại chỉ phục vụ lập kế hoạch du lịch cá nhân, thiếu tính năng xã hội để người dùng chia sẻ trải nghiệm với cộng đồng. Thêm feed công khai giúp tạo nội dung do người dùng tạo ra (UGC), tăng engagement và giữ chân người dùng quay lại app.

## What Changes

- Thêm tab "Cộng đồng" vào bottom navigation
- Tạo feed công khai hiển thị bài viết từ tất cả users (mới nhất trước)
- Cho phép viết bài kèm text và ảnh (tối đa 5 ảnh)
- Cho phép bình luận trên bài viết
- Cho phép like bài viết
- Chia sẻ bài viết qua native share sheet (iOS/Android)
- Upload ảnh lên Supabase Storage bucket `post-images`

## Capabilities

### New Capabilities

- `post-feed`: Feed hiển thị bài viết công khai, infinite scroll, sắp xếp theo thời gian
- `post-create`: Form tạo bài viết — text + ảnh (expo-image-picker), gắn trip tùy chọn
- `post-detail`: Màn hình chi tiết bài viết + danh sách comment + like + share
- `post-comments`: Thêm/xem comment trên bài viết

### Modified Capabilities

<!-- Không có -->

## Impact

- **Schema mới**: 3 bảng (`posts`, `post_comments`, `post_likes`) + RLS policies
- **Storage**: Supabase bucket `post-images`
- **Files mới**: `app/(app)/feed.tsx`, `app/post/[id].tsx`, `app/post/create.tsx`
- **Files sửa**: `app/(app)/_layout.tsx` (thêm tab), `src/types/index.ts` (thêm types)
- **Dependencies mới**: `expo-image-picker` (Expo SDK, không cần native config thêm)
