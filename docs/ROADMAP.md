# Viloca — Feature Roadmap: Retention & Growth

## Context

MVP hiện tại có core loop: discover → plan → journal. Vấn đề là loop này **không có trigger để quay lại**: user tạo trip, lên kế hoạch xong thì không có lý do mở app thêm lần nữa trừ khi đang đi du lịch.

Retention thực sự cần ít nhất một trong ba:
- **Variable reward** — mỗi lần mở app có thứ gì đó mới
- **Commitment device** — user đã đầu tư công sức nên tiếp tục quay lại
- **Social obligation** — người khác đang nhìn vào hoặc chờ hành động từ user

---

## Phase 1 — MVP Core (P0)

### 1.1 Trip Journal nâng cao
Thêm ảnh (camera roll), mood icon, weather tag cho mỗi ngày journal.
- **Cơ chế:** Zeigarnik Effect — đã ghi ngày 1, tâm lý cảm thấy chưa xong nếu bỏ ngày 2
- **Supabase:** `alter table trip_journals add column photos text[], mood text, weather text`
- **Độ phức tạp:** Medium | **Ưu tiên:** P0

### 1.2 Experience Bookmarks
Nút bookmark trên card, 3 trạng thái: "Muốn đi" → "Đã đi" → "Đã review"
- **Cơ chế:** Collection cá nhân trong app → switching cost cao
- **Supabase:** table `bookmarks (user_id, experience_id, status)`
- **Độ phức tạp:** Low | **Ưu tiên:** P0

### 1.3 Trip Lifecycle + Completion Screen
Trip tự chuyển `planning → active → completed` theo ngày. Khi xong hiện "Trip Summary" với stats + prompt journal tổng kết.
- **Cơ chế:** Closing the loop — cue → routine → reward
- **Supabase:** `alter table trips add column summary_note text`
- **Độ phức tạp:** Medium | **Ưu tiên:** P0

---

## Phase 2 — Retention Features

### 2.1 Daily Discovery Streak (P1)
Mỗi ngày 1 "Experience of the Day" cá nhân hóa theo travel style. 7 ngày liên tiếp → badge "Curious Explorer".
- **Cơ chế:** Streak (Duolingo model) + Variable Reward
- **Supabase:** table `user_streaks`, `daily_discovery_log`
- **Độ phức tạp:** Medium

### 2.2 Trip Memory Cards — "On This Day" (P1)
Push notification vào ngày kỷ niệm 1 tuần/1 tháng/1 năm sau trip. Card đẹp kèm quote từ journal của user.
- **Cơ chế:** Nostalgia Trigger (Google Photos Memories model)
- **Supabase:** table `memory_cards`, Supabase Edge Function cron daily
- **Độ phức tạp:** Medium

### 2.3 Personal Review System (P1)
Sau khi trip complete, prompt rate experiences (1–5 sao + text). Private trước, public ở Phase 3.
- **Cơ chế:** Data Lock-in (Letterboxd model) — library không di chuyển được
- **Supabase:** table `user_reviews (user_id, experience_id, trip_id, rating, content, is_public)`
- **Độ phức tạp:** Low

### 2.4 Seasonal Collections (P1)
Collections theo mùa/sự kiện: "Tết ở Hà Nội", "Mùa hoa Sa Pa tháng 9". Có `valid_until` date.
- **Cơ chế:** FOMO + Scarcity — time-limited content
- **Supabase:** table `collections`, `collection_experiences`
- **Độ phức tạp:** Low

### 2.5 Smart Trip Nudges — Push Notifications (P1)
Trip còn 7 ngày → nudge về timeline. Trip active → nhắc ghi journal hôm nay.
- **Cơ chế:** External Trigger + Progress Nudge
- **Supabase:** `alter table profiles add column push_token text, notification_prefs jsonb`
- **Độ phức tạp:** Medium

### 2.6 Travel Stats Dashboard (P2)
Heat map 63 tỉnh thành đã đến, tổng km, category breakdown, top experiences.
- **Cơ chế:** Progress Visualization + Identity (Pokémon model)
- **Supabase:** table `user_stats (provinces_visited[], total_trips, total_experiences)`
- **Độ phức tạp:** Medium

### 2.7 Badges & Milestones (P2)
"Phượt Thủ Tây Bắc" (Sa Pa + Mù Cang Chải), "Foodie Sài Gòn" (5 food_tour), "Nhà Thám Hiểm" (7 ngày streak).
- **Cơ chế:** Identity Reinforcement — badges có social value
- **Supabase:** table `badge_definitions`, `user_badges`
- **Độ phức tạp:** Medium

---

## Phase 3 — Growth Features

### 3.1 Public Trip Stories (P1) ⭐
User toggle trip sang public → deeplink URL chia sẻ. Xem không cần tài khoản. CTA: "Tạo Trip Story của bạn".
- **Cơ chế:** Viral Loop (Canva/Notion model) — mỗi share = 1 acquisition event
- **Supabase:** `alter table trips add column is_public bool, share_slug text unique, view_count int`
- **Độ phức tạp:** High

### 3.2 Follow Local Guides (P2)
Guides trở thành user profiles thực sự. Traveler follow guide, nhận notification khi có experience mới.
- **Cơ chế:** Creator Economy — guides tự marketing, travelers có lý do quay lại
- **Supabase:** table `guide_follows`, `guide_posts`; `alter table profiles add column is_guide bool`
- **Độ phức tạp:** High

### 3.3 Group Trip — "Đi cùng nhau" (P2)
Nhiều user cùng edit trip. Suggest + vote experiences. Real-time qua Supabase Realtime.
- **Cơ chế:** Network Effect — khi A invite B, B phải download app
- **Supabase:** table `trip_members`, `trip_suggestions`, `suggestion_votes`
- **Độ phức tạp:** High

### 3.4 Community Feed & Reviews (P2)
Reviews public, tab "Cộng đồng" hiển thị nội dung của user khác. Like, save, comment 1 dòng.
- **Cơ chế:** Social Proof + UGC — content mới mỗi lần mở app
- **Supabase:** table `review_likes`, `review_comments`, `feed_events`
- **Độ phức tạp:** High

### 3.5 Referral "Rủ bạn đi" (P2)
Referral code riêng. Bạn đăng ký + tạo trip → cả hai nhận badge + unlock exclusive collection.
- **Cơ chế:** Incentivized Referral + Exclusivity
- **Supabase:** table `referral_rewards`; `alter table profiles add column referral_code text unique`
- **Độ phức tạp:** Medium

---

## Thứ tự triển khai

| Sprint | Nội dung |
|---|---|
| 1–2 | Hoàn thiện 5 màn hình MVP (Splash, Onboarding, Home, Workspace, Profile) |
| 3 | Bookmarks + Trip Lifecycle + Reviews → data gravity |
| 4 | Daily Streak + Seasonal Collections → daily open habit |
| 5 | Public Trip Stories → growth engine chính |
| 6+ | Group Trip, Guides, Community Feed |

---

## Supabase schema mới cần thêm (ngoài MVP)

```
bookmarks, user_streaks, daily_discovery_log, memory_cards,
user_reviews, collections, collection_experiences, user_stats,
badge_definitions, user_badges, trip_views, guide_follows,
guide_posts, trip_members, trip_suggestions, suggestion_votes,
review_likes, review_comments, feed_events, referral_rewards
```
