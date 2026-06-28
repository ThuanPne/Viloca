---
name: "QA Review"
description: Review code implementation against spec file (từ /analyze) hoặc original request. Tự động chạy sau mỗi coding session.
category: Quality
tags: [qa, review, requirements]
---

Review code changes để verify implementation khớp với spec đã thống nhất.

## Input

Không cần input — tự động lấy context từ spec file mới nhất hoặc conversation.

## Bước 1 — Lấy requirements source

**Ưu tiên 1: Spec file**
```bash
ls -t .claude/specs/*.md 2>/dev/null | head -1
```
Nếu có file → đọc toàn bộ nội dung, lấy phần **Acceptance Criteria** và **Scope**.

**Ưu tiên 2: Conversation context**
Nếu không có spec file → lấy yêu cầu từ tin nhắn cuối của user trước khi code.

Lưu ý rõ nguồn đang dùng khi output report.

## Bước 2 — Lấy code changes

```bash
git diff HEAD~1 --name-only
git diff HEAD~1 -- "*.ts" "*.tsx"
git log -1 --format="%s"
```

Nếu chưa commit:
```bash
git diff --name-only
git diff -- "*.ts" "*.tsx"
```

## Bước 3 — Spawn 3 agents song song

Gọi tất cả 3 agents cùng lúc bằng Agent tool. Truyền cho mỗi agent: (a) requirements/spec text, (b) danh sách files thay đổi, (c) full git diff.

---

**Agent 1 — Requirements Coverage**

> Bạn là QA engineer. Yêu cầu/spec:
> [REQUIREMENTS_TEXT]
>
> Code đã thay đổi:
> [DIFF]
>
> Kiểm tra: Implementation có cover đầy đủ các acceptance criteria không?
> Với mỗi tiêu chí trong spec: đánh dấu DONE, PARTIAL, hoặc MISSING.
> Nếu không có spec (dùng conversation context): đánh giá xem request ban đầu có được implement đủ không.
> Trả về bullet points ngắn gọn, tối đa 6 dòng.

---

**Agent 2 — Scope & Side Effects**

> Bạn là QA engineer. Yêu cầu/spec:
> [REQUIREMENTS_TEXT]
>
> Code đã thay đổi:
> [DIFF]
>
> Kiểm tra: Implementation có thay đổi gì ngoài phạm vi yêu cầu không?
> Tìm: tính năng bị xóa, behavior thay đổi ở screen khác, import bị ảnh hưởng, code bị xóa không được yêu cầu.
> Nếu CLEAN thì nói CLEAN. Nếu không: liệt kê vấn đề.
> Trả về bullet points ngắn gọn, tối đa 5 dòng.

---

**Agent 3 — Style & Convention**

> Bạn là QA engineer review React Native / Expo app (Viloca).
> Conventions của project:
> - Dùng colors.nomad.* palette (primary: #45611b, surface: #fafaf0...)
> - Reuse components: Badge, EmptyState, ScreenWrapper, Card từ src/components/ui/
> - StyleSheet.create() — không inline styles
> - Không thêm comment giải thích code (chỉ comment khi WHY không rõ ràng)
> - Không tạo abstraction thừa, giữ code đơn giản
>
> Code đã thay đổi:
> [DIFF]
>
> Kiểm tra: Code có theo đúng conventions không?
> Nếu CLEAN thì nói CLEAN. Nếu không: liệt kê vi phạm.
> Trả về bullet points ngắn gọn, tối đa 5 dòng.

---

## Bước 4 — Tổng hợp verdict

- **PASS** — tất cả criteria DONE, không có side effects, style clean
- **WARN** — criteria đủ nhưng có style issue nhỏ hoặc minor scope creep
- **FAIL** — có criteria MISSING hoặc breaking changes

## Bước 5 — Output report

Dùng đúng format này:

```
─────────────────────────────────────
QA Review
─────────────────────────────────────
Source: Spec file (.claude/specs/xxx.md) | Conversation context
Changed: <danh sách files>

Requirements Coverage
  ✅ <tiêu chí 1>
  ✅ <tiêu chí 2>
  ⚠️  <tiêu chí làm một phần>
  ❌ <tiêu chí chưa làm>

Side Effects
  ✅ CLEAN  (hoặc liệt kê vấn đề)

Style & Convention
  ✅ CLEAN  (hoặc liệt kê vi phạm)

Verdict: PASS ✅ | WARN ⚠️ | FAIL ❌
─────────────────────────────────────
```

Nếu WARN hoặc FAIL → thêm section **Cần sửa:**
```
Cần sửa:
  1. <mô tả cụ thể>
  2. <mô tả cụ thể>
```

## Guardrails

- Chỉ đọc, không sửa code
- Nếu diff trống: báo "Không phát hiện thay đổi code kể từ commit cuối"
- Tập trung vào request hiện tại, không review lịch sử cũ
- Nếu có spec file → spec là source of truth, không dùng conversation
- Mỗi agent tối đa 6 bullet points
