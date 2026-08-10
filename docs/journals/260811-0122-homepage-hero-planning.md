# Homepage Hero — Brainstorm & Plan chốt xong, chưa code

**Date**: 2026-08-11 01:22
**Severity**: Low
**Component**: joywork-web / homepage (`src/app/(app)/page.tsx`)
**Status**: Ongoing (chờ implement)

## What Happened

User yêu cầu brainstorm một khối hero cho trang chủ (`/`), đặt ngay dưới header, phía trên feed hiện tại, lấy cảm hứng từ demo tĩnh `documents/banner/joywork_banner_demo.html` và asset trong `documents/banner/`. Đã tạo:

- Report brainstorm: `plans/reports/260811-0116-homepage-hero-brainstorm.md` — đánh giá 3 approach (A: một banner tĩnh + search hoạt động; B: carousel như demo; C: full landing hero), chọn **Approach A**.
- Plan implementation: `plans/260811-0118-homepage-hero/plan.md` — chia 3 phase (asset & contract → build & wire → validate responsive/lint), chưa đụng code.

Không có dòng code sản phẩm nào được viết trong phiên này — đúng theo yêu cầu "brainstorm/plan trước, implement sau khi duyệt".

## The Brutal Truth

Không có drama kỹ thuật ở bước này — cái đáng ghi lại là **rủi ro quy trình git**: plan file có frontmatter `branch: main`, tức là repo đang checkout `main` tại thời điểm brainstorm. Theo `.cursor/rules/git-workflow.mdc`, `main` là production, không commit trực tiếp. Nếu người tiếp theo (kể cả future-me) mở plan này và bắt tay code luôn mà không kiểm tra branch trước, code sẽ nằm sai chỗ và phải cherry-pick lại — mất thời gian oan cho một thứ đáng lẽ chỉ cần 5 giây `git checkout develop`.

## Technical Details

- Scope đã khóa cứng: **không** backend, không CMS, không API mới, không carousel, không analytics — chỉ 1 banner tĩnh (`banner_100dn.png` copy vào `public/banner/`) + form search.
- Search submit build `URLSearchParams`, redirect `/jobs?q=<keyword>&location=<provinceCode>` (province dùng `code`, không phải label — trùng với contract sẵn có của `ProvinceSelect` trên `/jobs`).
- CTA: employer → `/companies/new`, candidate → `/companies`.
- Component mới: `src/components/feed/HomepageHero.tsx`, client component, mount **ngoài** `FeedLayout` trong `page.tsx` để hero full-width nhưng `RightRail` vẫn bắt đầu từ feed content (rủi ro #4 trong report).
- Styling giới hạn trong các CSS var đã có: `--brand`, `--brand-secondary`, `--brand-dark`, `--background`, `--foreground`, `--border`, `--muted-foreground` — không dùng Tailwind arbitrary value hay token chưa định nghĩa (đúng rule bảo mật/kiến trúc frontend).

## What We Tried

Không áp dụng — giai đoạn này chỉ là research + report + plan, chưa có implementation attempt nào để so sánh thành/bại.

## Root Cause Analysis

Không phải sự cố, mà là quyết định chủ động: tách rõ 2 bước "duyệt thiết kế" và "code" để tránh việc phải viết lại UI nếu user đổi ý về approach (đặc biệt giữa A/B/C có khác biệt lớn về effort — carousel kéo theo state, accessibility, mobile controls).

## Lessons Learned

- Ghi `branch` vào frontmatter của plan là tốt, nhưng cần thêm gate rõ ràng: **không bắt đầu Phase 1 nếu chưa `git checkout develop`**, tránh phụ thuộc vào việc đọc kỹ note trong plan.
- Khi tài liệu nguồn là HTML tĩnh demo (`joywork_banner_demo.html` với vanilla JS carousel), nhắc lại rõ trong plan rằng đây **chỉ tham khảo cấu trúc/visual**, không copy nguyên logic slider — đã làm đúng trong report, cần giữ nguyên khi implement.
- Khóa contract search (`q`, `location` bằng province `code`) trước khi code giúp tránh mismatch với `/jobs` filter — nên tiếp tục pattern "xác nhận contract trước khi build UI" cho các feature sau.

## Next Steps

1. **Trước khi code**: `git checkout develop` (hoặc tạo nhánh feature từ `develop`) — không implement trên `main`.
2. Thực hiện theo thứ tự: Phase 1 (asset + contract) → Phase 2 (build & wire `HomepageHero`) → Phase 3 (validate responsive + `npm run lint`).
3. Copy `documents/banner/banner_100dn.png` vào `joywork-web/public/banner/`, render qua `next/image`.
4. Sau khi xong cả 3 phase và lint sạch, push `develop` (auto deploy staging) rồi mới xét promote `main` theo `deploy/GIT_WORKFLOW.md`.
5. Chủ sở hữu: người thực hiện implementation tiếp theo trong phiên làm việc kế tiếp (chưa gán tên cụ thể).

## Publishing Note

AgentWiki publish/share bị bỏ qua: không tìm thấy CLI `agentwiki` trong PATH và không có MCP server nào khớp pattern `agentwiki` trong phiên này. Journal entry này chỉ tồn tại local tại `joywork-web/docs/journals/`.
