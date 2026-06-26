## Context

Stack hiện tại: Expo SDK 56 + React Native + expo-router + Supabase (auth/DB/Storage) + NativeWind + Zustand. Auth pattern dùng `supabase.auth.getSession()` và Zustand `useAuthStore`. Pattern query Supabase: gọi trực tiếp trong component với `useEffect` hoặc async function.

## Goals / Non-Goals

**Goals:**
- Feed public đơn giản, load được trên mobile
- CRUD posts (tạo, xem, xóa của mình)
- Comment + like + share cơ bản
- Upload ảnh lên Supabase Storage

**Non-Goals:**
- Không có follow/unfollow (tất cả bài đều hiển thị trên feed)
- Không có push notification khi có like/comment mới
- Không có video upload
- Không có report/moderation

## Decisions

**Database: denormalized counts (`likes_count`, `comments_count`) thay vì COUNT subquery**

Tránh N+1 query khi render feed. Dùng Postgres trigger tự động cập nhật counts khi insert/delete likes/comments.

**Image upload: client-side trực tiếp lên Supabase Storage**

Đơn giản, không cần Edge Function riêng. Path: `post-images/{user_id}/{timestamp}-{random}.jpg`. RLS policy cho phép user upload vào folder của mình.

**Feed pagination: Supabase `.range()` với offset**

Đủ đơn giản cho MVP. Load thêm khi scroll đến cuối (FlatList `onEndReached`).

**Share: React Native built-in `Share` API**

Không cần thêm dependency. Share nội dung text + link deep (format: `viloca://post/{id}`).

## Risks / Trade-offs

- [Risk] Không có moderation → bài viết không phù hợp → Mitigation: thêm sau, scope hiện tại là MVP
- [Trade-off] Denormalized counts có thể lệch nếu trigger fail → trigger đơn giản, ít rủi ro
- [Risk] Ảnh upload lớn làm chậm → Mitigation: compress ảnh trước upload với `expo-image-manipulator` (có thể thêm sau)

## Migration Plan

1. Chạy SQL migration trong Supabase Studio (tạo 3 bảng + triggers + RLS)
2. Tạo Storage bucket `post-images` trong Supabase Dashboard (Public access cho read)
3. `expo install expo-image-picker`
4. Deploy code
