# Viloca — Features & API Endpoints

Supabase tự generate REST API từ schema qua **PostgREST**. Base URL: `https://[project-ref].supabase.co/rest/v1/`

Tất cả request cần header:
```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <user_access_token>   ← khi đã login
Content-Type: application/json
```

Client-side dùng `@supabase/supabase-js` — không gọi REST API trực tiếp.

---

## 1. Auth

Dùng Supabase Auth SDK, không qua REST API thủ công.

| Hành động | SDK Call |
|---|---|
| Đăng ký | `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` |
| Đăng nhập | `supabase.auth.signInWithPassword({ email, password })` |
| Đăng xuất | `supabase.auth.signOut()` |
| Lấy session | `supabase.auth.getSession()` |
| Lắng nghe thay đổi | `supabase.auth.onAuthStateChange(callback)` |
| Refresh token | Tự động qua `autoRefreshToken: true` |

Hook wrapper `src/hooks/useAuth.ts`:
```ts
const useAuth = () => ({
  user,          // từ authStore
  loading,
  signIn(email, password),
  signUp(email, password, fullName),
  signOut(),
})
```

---

## 2. Profiles

### Lấy profile của user hiện tại
```ts
supabase.from('profiles').select('*').eq('id', userId).single()
```
REST tương đương: `GET /rest/v1/profiles?id=eq.{userId}&select=*`

### Cập nhật profile
```ts
supabase.from('profiles').update({ full_name, bio, avatar_url, travel_style }).eq('id', userId)
```
REST: `PATCH /rest/v1/profiles?id=eq.{userId}`

### Upload avatar
```ts
supabase.storage.from('avatars').upload(`${userId}/avatar.jpg`, file)
supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`)
```

---

## 3. Experiences

### Lấy tất cả experiences (có phân trang)
```ts
supabase.from('experiences').select('*').order('created_at', { ascending: false }).range(0, 19)
```
REST: `GET /rest/v1/experiences?select=*&order=created_at.desc&limit=20&offset=0`

### Lọc theo category
```ts
supabase.from('experiences').select('*').eq('category', 'food_tour')
```
REST: `GET /rest/v1/experiences?category=eq.food_tour&select=*`

### Lấy featured experiences
```ts
supabase.from('experiences').select('*').eq('is_featured', true)
```
REST: `GET /rest/v1/experiences?is_featured=eq.true&select=*`

### Tìm kiếm (Phase 2 — dùng Postgres full-text search)
```ts
supabase.from('experiences').select('*').textSearch('title', query, { type: 'websearch' })
```

### Lấy chi tiết 1 experience
```ts
supabase.from('experiences').select('*').eq('id', experienceId).single()
```

---

## 4. Trips

### Lấy danh sách trips của user
```ts
supabase.from('trips').select('*, trip_items(count)').eq('user_id', userId).order('created_at', { ascending: false })
```

### Tạo trip mới
```ts
supabase.from('trips').insert({
  user_id: userId,
  title: 'Hà Nội 3 ngày',
  destination: 'Hà Nội',
  start_date: '2026-07-01',
  end_date: '2026-07-03',
  status: 'planning'
}).select().single()
```

### Cập nhật trip
```ts
supabase.from('trips').update({ title, destination, start_date, end_date, cover_image }).eq('id', tripId)
```

### Xóa trip
```ts
supabase.from('trips').delete().eq('id', tripId)
// trip_items và trip_journals tự xóa theo cascade
```

### Lấy trip chi tiết kèm items và journal
```ts
supabase.from('trips').select(`
  *,
  trip_items(*, experiences(*)),
  trip_journals(*)
`).eq('id', tripId).single()
```

### Chia sẻ trip (toggle public)
```ts
supabase.from('trips')
  .update({ is_public: true, share_slug: nanoid(8) })
  .eq('id', tripId)
```

---

## 5. Trip Items (Timeline)

### Thêm experience vào trip
```ts
supabase.from('trip_items').insert({
  trip_id: tripId,
  experience_id: experienceId,
  day_number: 1,
  time_slot: 'morning',
  sort_order: 0
}).select().single()
```

### Lấy items của 1 trip (sort theo ngày + buổi)
```ts
supabase.from('trip_items')
  .select('*, experiences(*)')
  .eq('trip_id', tripId)
  .order('day_number')
  .order('sort_order')
```

### Cập nhật vị trí (drag-reorder)
```ts
// Batch update sort_order sau khi drag
const updates = items.map((item, index) => ({
  id: item.id,
  sort_order: index,
  day_number: item.day_number,
  time_slot: item.time_slot
}))
supabase.from('trip_items').upsert(updates)
```

### Di chuyển sang ngày/buổi khác
```ts
supabase.from('trip_items').update({ day_number: 2, time_slot: 'afternoon' }).eq('id', itemId)
```

### Xóa khỏi trip
```ts
supabase.from('trip_items').delete().eq('id', itemId)
```

---

## 6. Trip Journals

### Lấy tất cả journal entries của trip
```ts
supabase.from('trip_journals').select('*').eq('trip_id', tripId).order('day_number')
```

### Tạo hoặc cập nhật journal cho 1 ngày
```ts
supabase.from('trip_journals').upsert({
  trip_id: tripId,
  day_number: 1,
  content: 'Hôm nay...',
  mood: 'great',
  weather: 'sunny',
  photos: ['https://...']
}, { onConflict: 'trip_id,day_number' })
```

### Upload ảnh journal
```ts
supabase.storage.from('journal-photos').upload(`${tripId}/${dayNumber}/${filename}`, file)
```

---

## 7. Bookmarks (Phase 1.2)

### Lưu bookmark
```ts
supabase.from('bookmarks').upsert({
  user_id: userId,
  experience_id: experienceId,
  status: 'saved'
}, { onConflict: 'user_id,experience_id' })
```

### Đổi trạng thái bookmark
```ts
supabase.from('bookmarks').update({ status: 'visited' })
  .eq('user_id', userId).eq('experience_id', experienceId)
```

### Lấy danh sách đã lưu
```ts
supabase.from('bookmarks').select('*, experiences(*)').eq('user_id', userId).eq('status', 'saved')
```

### Xóa bookmark
```ts
supabase.from('bookmarks').delete().eq('user_id', userId).eq('experience_id', experienceId)
```

---

## 8. User Reviews (Phase 2.3)

### Tạo review
```ts
supabase.from('user_reviews').insert({
  user_id: userId,
  experience_id: experienceId,
  trip_id: tripId,
  rating: 5,
  content: 'Trải nghiệm tuyệt vời...',
  is_public: false
})
```

### Lấy reviews của user
```ts
supabase.from('user_reviews').select('*, experiences(title, cover_image)').eq('user_id', userId)
```

---

## 9. Daily Streak (Phase 2.1)

### Ghi log xem experience hôm nay
```ts
supabase.from('daily_discovery_log').upsert({
  user_id: userId,
  experience_id: experienceId,
  action: 'viewed',
  logged_date: new Date().toISOString().split('T')[0]
}, { onConflict: 'user_id,logged_date' })
```

### Lấy streak hiện tại
```ts
supabase.from('user_streaks').select('*').eq('user_id', userId).single()
```

---

## 10. Memory Cards (Phase 2.2)

### Lấy memory cards chưa xem
```ts
supabase.from('memory_cards')
  .select('*, trips(title, cover_image, destination)')
  .eq('user_id', userId)
  .eq('is_seen', false)
  .lte('trigger_date', new Date().toISOString().split('T')[0])
```

### Đánh dấu đã xem
```ts
supabase.from('memory_cards').update({ is_seen: true }).eq('id', cardId)
```

---

## 11. Seasonal Collections (Phase 2.4)

### Lấy collections đang active
```ts
const today = new Date().toISOString().split('T')[0]
supabase.from('collections')
  .select('*, collection_experiences(experiences(*))')
  .eq('is_active', true)
  .lte('valid_from', today)
  .gte('valid_until', today)
```

---

## 12. Public Trip Stories (Phase 3.1)

### Xem trip public (không cần auth)
```ts
// Gọi với anon key, không cần user token
supabase.from('trips')
  .select('*, trip_items(*, experiences(*)), trip_journals(*), profiles(full_name, avatar_url)')
  .eq('share_slug', slug)
  .eq('is_public', true)
  .single()
```

### Tăng view count
```ts
supabase.rpc('increment_trip_view', { trip_id: id })
// Hoặc:
supabase.from('trip_views').insert({ trip_id: id, viewer_user_id: userId ?? null })
```

---

## 13. Group Trip (Phase 3.3)

### Invite thành viên
```ts
supabase.from('trip_members').insert({ trip_id: tripId, user_id: friendId, role: 'member' })
```

### Realtime sync
```ts
const channel = supabase
  .channel(`trip:${tripId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trip_suggestions',
    filter: `trip_id=eq.${tripId}`
  }, handleChange)
  .subscribe()
```

### Suggest experience
```ts
supabase.from('trip_suggestions').insert({
  trip_id: tripId,
  suggested_by: userId,
  experience_id: experienceId,
  day_number: 1,
  time_slot: 'morning'
})
```

### Vote suggestion
```ts
supabase.from('suggestion_votes').upsert({
  suggestion_id: suggestionId,
  user_id: userId,
  vote: 'up'
}, { onConflict: 'suggestion_id,user_id' })
```

---

## 14. Push Notifications

Dùng **Expo Push Notification API** kết hợp **Supabase Edge Functions**.

### Client: đăng ký nhận thông báo
```ts
import * as Notifications from 'expo-notifications'

const token = (await Notifications.getExpoPushTokenAsync()).data
supabase.from('profiles').update({ push_token: token }).eq('id', userId)
```

### Server (Edge Function): gửi thông báo
```ts
// supabase/functions/trip-nudge/index.ts
const response = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: pushToken,
    title: 'Chuyến đi Đà Lạt còn 7 ngày 🏔️',
    body: 'Timeline của bạn đã có 3/5 ngày được lên kế hoạch',
    data: { tripId }
  })
})
```

---

## 15. Supabase Storage Buckets

| Bucket | Dùng cho | Access |
|---|---|---|
| `avatars` | Ảnh đại diện user | Public |
| `journal-photos` | Ảnh trong journal entries | Private (theo user) |
| `trip-covers` | Ảnh bìa trip | Public (nếu trip public) |
| `guide-posts` | Ảnh của guide posts | Public |

```ts
// Upload
supabase.storage.from('avatars').upload(path, file, { upsert: true })

// Lấy public URL
supabase.storage.from('avatars').getPublicUrl(path)

// Tạo signed URL (private files)
supabase.storage.from('journal-photos').createSignedUrl(path, 3600)
```

---

## 16. Tóm tắt tất cả Tables

| Table | Mô tả | Phase |
|---|---|---|
| `profiles` | User profile (extends auth.users) | MVP |
| `experiences` | Trải nghiệm địa phương (mock data) | MVP |
| `trips` | Chuyến đi của user | MVP |
| `trip_items` | Experiences trong trip | MVP |
| `trip_journals` | Nhật ký theo ngày | MVP |
| `bookmarks` | Experience đã lưu | P0 |
| `user_reviews` | Đánh giá của user | P1 |
| `user_streaks` | Daily streak | P1 |
| `daily_discovery_log` | Log xem hàng ngày | P1 |
| `memory_cards` | Card kỷ niệm | P1 |
| `collections` | Seasonal collections | P1 |
| `collection_experiences` | Junction: collection ↔ experience | P1 |
| `trip_views` | Analytics view count | P1 |
| `user_stats` | Stats tổng hợp | P2 |
| `badge_definitions` | Định nghĩa badges | P2 |
| `user_badges` | Badges user đạt được | P2 |
| `guide_follows` | Follow guide | P2 |
| `guide_posts` | Posts của guide | P2 |
| `trip_members` | Thành viên group trip | P2 |
| `trip_suggestions` | Gợi ý trong group trip | P2 |
| `suggestion_votes` | Vote cho gợi ý | P2 |
| `review_likes` | Like review | P2 |
| `review_comments` | Comment review | P2 |
| `feed_events` | Events cho community feed | P2 |
| `referral_rewards` | Tracking referral | P2 |
