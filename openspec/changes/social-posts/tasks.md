## 1. Schema & Storage

- [x] 1.1 Tạo migration `supabase/migrations/20260627000010_create_posts.sql` — 3 bảng posts, post_comments, post_likes + triggers cập nhật counts + RLS policies
- [x] 1.2 Thêm `Post` và `PostComment` interface vào `src/types/index.ts`
- [ ] 1.3 Hướng dẫn tạo Storage bucket `post-images` trong Supabase Dashboard (public read, authenticated write)

## 2. Dependencies

- [x] 2.1 Chạy `expo install expo-image-picker` để add package

## 3. Feed Screen (`app/(app)/feed.tsx`)

- [x] 3.1 Tạo `app/(app)/feed.tsx` — FlatList bài viết public, query `posts` join `profiles`, sắp xếp `created_at DESC`
- [x] 3.2 Implement `PostCard` component inline — avatar + tên user, ảnh scroll ngang (nếu có), content text, counts like/comment, nút share
- [x] 3.3 Implement infinite scroll — `onEndReached` load thêm 10 bài (Supabase `.range()`)
- [x] 3.4 Thêm nút tạo bài (FAB hoặc header icon) navigate sang `/post/create`

## 4. Create Post Screen (`app/post/create.tsx`)

- [x] 4.1 Tạo `app/post/create.tsx` — TextInput multiline + nút chọn ảnh + nút Đăng
- [x] 4.2 Implement chọn ảnh với `expo-image-picker` (tối đa 5 ảnh, mediaTypes: Images)
- [x] 4.3 Implement upload ảnh lên Supabase Storage (`post-images/{user_id}/{timestamp}.jpg`)
- [x] 4.4 Insert post vào DB sau khi upload xong, navigate back về feed

## 5. Post Detail Screen (`app/post/[id].tsx`)

- [x] 5.1 Tạo `app/post/[id].tsx` — hiển thị full bài viết + ảnh lớn hơn
- [x] 5.2 Hiển thị danh sách comments, query `post_comments` join `profiles`
- [x] 5.3 Thêm TextInput comment + nút gửi — insert vào `post_comments`
- [x] 5.4 Implement like toggle — insert/delete `post_likes`, cập nhật UI optimistically
- [x] 5.5 Implement nút Share — `Share.share({ message: 'Xem bài viết trên Viloca: viloca://post/{id}' })`

## 6. Navigation

- [x] 6.1 Thêm tab "Cộng đồng" (icon `people-outline`) vào `app/(app)/_layout.tsx`
- [x] 6.2 Kiểm tra route `app/post/[id].tsx` accessible từ feed (tap PostCard → navigate)

## 7. Kiểm tra

- [ ] 7.1 Chạy migration SQL trong Supabase Studio, xác nhận 3 bảng được tạo
- [ ] 7.2 `npx expo start` → tab Cộng đồng hiển thị
- [ ] 7.3 Tạo bài viết có text + ảnh → bài xuất hiện trên feed
- [ ] 7.4 Tap bài → vào detail → comment thành công
- [ ] 7.5 Nút share → native share sheet mở ra
