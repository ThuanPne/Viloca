---
name: "Analyze Requirements"
description: Phân tích yêu cầu người dùng, hỏi làm rõ, rồi lưu spec hoàn chỉnh để Claude code theo. Tự động chạy trước mỗi coding request.
category: Workflow
tags: [requirements, spec, planning]
---

Phân tích yêu cầu của người dùng, hỏi các câu làm rõ cần thiết, rồi tạo file spec chi tiết để Claude code theo đúng mong đợi.

## Bước 1 — Đánh giá độ phức tạp

Đọc yêu cầu từ user. Chấm điểm **complexity** từ 1–5:

| Điểm | Loại | Ví dụ |
|------|------|-------|
| 1 | Trivial | Sửa text, màu sắc, style nhỏ |
| 2 | Simple | Thêm 1 field, fix 1 bug rõ ràng |
| 3 | Medium | Thêm component mới, sửa 1 screen |
| 4 | Complex | Tính năng mới có nhiều state/flow |
| 5 | Major | Tính năng end-to-end, có DB + UI |

Nếu complexity ≤ 2 → **bỏ qua hỏi clarification**, tạo spec ngay với thông tin đã có.

## Bước 2 — Hỏi làm rõ (nếu complexity ≥ 3)

Dùng **AskUserQuestion** để hỏi. Số câu hỏi theo complexity:
- Score 3 → tối đa **3 câu**
- Score 4 → tối đa **5 câu**
- Score 5 → tối đa **8 câu**

Chỉ hỏi những gì **thực sự chưa rõ**. Đừng hỏi điều đã hiển nhiên trong request.

**Ngân hàng câu hỏi** (chọn theo từng request, không hỏi tất cả):

**User Flow**
- "Luồng người dùng từ đầu đến cuối là gì? (vd: tap X → thấy Y → nhấn Z)"
- "Sau khi hoàn thành action, chuyển đến đâu?"

**Data & State**
- "Dữ liệu lấy từ đâu? Mock data hay Supabase thật?"
- "Có data nào cần lưu lại (persist) khi user thoát app không?"
- "Fields/columns nào cần hiển thị hoặc lưu?"

**UI Behavior**
- "Trạng thái loading, rỗng, lỗi cần hiển thị như thế nào?"
- "Có animation hoặc transition đặc biệt không?"
- "Responsive: portrait only hay cả landscape?"

**Scope**
- "Những gì KHÔNG cần làm trong request này?"
- "Có screen/component nào khác bị ảnh hưởng không?"

**Edge Cases**
- "Khi không có dữ liệu hiển thị gì?"
- "Khi mạng yếu hoặc lỗi API xử lý thế nào?"
- "Quyền truy cập: tất cả user hay chỉ một số?"

## Bước 3 — Tạo spec file

Sau khi đã đủ thông tin, tạo file spec tại:
`.claude/specs/YYYYMMDD-HHMM-{slug}.md`

Trong đó:
- `YYYYMMDD-HHMM` = thời gian hiện tại (dùng `date` command hoặc ước tính từ context)
- `{slug}` = tên tính năng viết thường nối gạch, ví dụ: `tour-card-info`, `auth-login-flow`

**Template bắt buộc:**

```markdown
# Spec: {Tên tính năng}
**Ngày:** {date}
**Request gốc:** "{câu request của user}"
**Complexity:** {1-5} — {Trivial/Simple/Medium/Complex/Major}

---

## Mô tả
{1-3 câu giải thích rõ tính năng cần build}

## User Flow
{Liệt kê step-by-step hành động người dùng}
1. User ...
2. System hiển thị ...
3. User tap/nhập ...
4. ...

## Behavior & Edge Cases
- **Loading:** {mô tả}
- **Empty state:** {mô tả hoặc "N/A"}
- **Lỗi:** {mô tả hoặc "N/A"}
- **Edge cases:** {liệt kê}

## Data
- **Nguồn:** Mock data / Supabase (table: `{tên}`)
- **Fields cần:** {liệt kê field hoặc "N/A"}
- **Persist:** {có/không, lý do}

## Scope
**IN (cần làm):**
- ...

**OUT (không làm lần này):**
- ...

## Style & Convention
- Dùng `colors.nomad.*` palette
- Reuse components: {liệt kê component sẽ dùng: Badge, Card, EmptyState...}
- StyleSheet.create() — không dùng inline styles

## Acceptance Criteria
- [ ] {tiêu chí 1 — có thể verify được}
- [ ] {tiêu chí 2}
- [ ] {tiêu chí 3}
- [ ] {thêm nếu cần}
```

Tạo thư mục nếu chưa có:
```bash
mkdir -p .claude/specs
```

Ghi file spec bằng Write tool.

## Bước 4 — Xác nhận và bàn giao

Sau khi lưu file, output:

```
Spec đã lưu: .claude/specs/{filename}

Tóm tắt:
- Tính năng: {tên}
- Complexity: {điểm}/5
- Acceptance criteria: {số} tiêu chí

Sẵn sàng code theo spec này.
```

Sau đó **tiến hành code ngay** theo spec vừa tạo — không cần user xác nhận thêm.

## Guardrails

- Không hỏi quá số câu tối đa theo complexity
- Không hỏi điều đã rõ trong request ban đầu
- Không tạo spec quá dài — mỗi section tối đa 5-7 dòng
- Complexity 1-2: tạo spec nhanh, bỏ qua section "Data" và "Edge Cases" nếu không liên quan
- Luôn dùng tiếng Việt trong spec (phù hợp với team)
- File spec là source of truth — QA agent sẽ đọc file này để verify
