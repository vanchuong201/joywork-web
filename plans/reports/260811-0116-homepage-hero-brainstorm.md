---
type: report
status: approved
created_at: 2026-08-11 01:16
scope: joywork-web homepage
topic: homepage-hero
---

# Homepage Hero Brainstorm

## Summary

Add a new **Homepage Hero** area, also called **Khối khám phá đầu trang**, on the JoyWork web homepage.

Placement: only `/`, immediately below existing header and before current feed/composer content.

Goal: help end users search jobs and discover good workplace companies, without changing global app shell.

## Requirements

- Expected output later: React/Next component for homepage hero.
- Route: `src/app/(app)/page.tsx`, before current `FeedLayout`.
- Component name: `HomepageHero`.
- Suggested location: `src/components/feed/HomepageHero.tsx`.
- Search behavior: keyword + province/city, submit to `/jobs?q=...&location=...`.
- CTA behavior:
  - Employer CTA: `/companies/new`.
  - Candidate CTA: `/companies`.
- Banner: use one static image from `documents/banner/banner_100dn.png` or `documents/banner/banner_100dn.png` equivalent asset copied into `joywork-web/public`.
- Visual direction: keep demo structure, adapt to JoyWork design system.

## Constraints

- No implementation until user explicitly approves implementation.
- No backend, CMS, admin config, new API, analytics, or carousel in first version.
- Do not modify global `Header`, app-wide layout, auth flow, or API contracts.
- Use Tailwind + CSS variables: `--brand`, `--brand-secondary`, `--background`, `--foreground`, `--border`, `--muted-foreground`.
- Use existing location/job filter conventions from `/jobs`.
- Use Next `<Image>` for banner.
- Keep responsive layout first-class.

## Codebase Findings

- `joywork-web` is Next.js App Router + TypeScript + Tailwind.
- Homepage `/` is `src/app/(app)/page.tsx`, currently feed-first.
- App shell lives in `src/app/(app)/layout.tsx`: `Header`, `LeftNav`, `MobileBottomNav`, `AuthPrompt`, `AuthBar`, `ChatWidget`, `ZaloFloatingButton`.
- Current feed page uses `FeedLayout`, `RightRail`, `FeedPostComposer`, `PostCard`, and query filters.
- Jobs page already supports `q` and `location` query params.
- Jobs page imports `ProvinceSelect` and `getProvinceNameByCode`, so hero should reuse existing province data/pattern instead of hardcoded location labels.
- Demo HTML is standalone: inline CSS, vanilla slider JS, Tabler icons, static assets. It should be translated into a React component, not copied as-is.

## Evaluated Approaches

### Approach A: Homepage Hero, One Banner, Functional Search

Recommended.

Pros:
- Smallest useful product slice.
- Matches approved scope.
- Uses existing `/jobs`, `/companies`, `/companies/new` routes.
- Avoids carousel/accessibility/autoplay complexity.
- Low risk to current feed and app shell.

Cons:
- Less visually rich than demo carousel.
- Static banner management until CMS/admin exists.

### Approach B: Static Carousel Like Demo

Pros:
- Closer to demo.
- Can use existing `embla-carousel-react`.

Cons:
- Extra state, mobile, autoplay, controls, accessibility.
- Needs multiple real slides or placeholders.
- Not necessary for first launch.

### Approach C: Full-Width Landing Hero

Pros:
- Stronger first impression.
- More like a marketing landing page.

Cons:
- Conflicts with current app layout and left/right rails.
- Bigger visual regression risk.
- Changes homepage information architecture.

## Recommended Design

Build `HomepageHero` as a client component.

Structure:
- Container card/section with dark blue brand gradient.
- Centered headline:
  - "Nền tảng tuyển dụng của"
  - "những doanh nghiệp có môi trường làm việc tốt"
- Search row:
  - Keyword input.
  - Province select.
  - Submit button.
- Body row:
  - Left CTA panel with 2 role-based actions.
  - Right static banner image.
- Mobile:
  - Stack headline, search, CTA, banner vertically.
  - Search fields become full width.
  - Banner keeps aspect ratio.

Behavior:
- On search submit:
  - Trim keyword.
  - Build `URLSearchParams`.
  - Include `q` only if not empty.
  - Include `location` only if selected.
  - Navigate to `/jobs` with params.
- CTA links:
  - Employer: `<Link href="/companies/new">`.
  - Candidate: `<Link href="/companies">`.

## Risks

- Province values must match `/jobs` filter values, likely province codes, not display labels.
- Static banner image may be large. Accept for first version, optimize later if Lighthouse or UX shows issue.
- Hero may crowd feed composer on small screens. Keep vertical spacing compact.
- If hero is placed outside `FeedLayout`, ensure `RightRail` still starts with feed content and no awkward desktop gap.

## Acceptance Criteria

- Hero visible on `/` directly under header, before composer/feed.
- Desktop layout clean with current left navigation and right rail preserved.
- Mobile layout stacks without horizontal scroll.
- Search with keyword navigates to `/jobs?q=<keyword>`.
- Search with location navigates to `/jobs?location=<provinceCode>`.
- Search with both navigates to `/jobs?q=<keyword>&location=<provinceCode>`.
- Employer CTA opens `/companies/new`.
- Candidate CTA opens `/companies`.
- Banner image renders through Next Image.
- No new lint/type errors in changed files.

## Next Steps

1. Create implementation plan from this report.
2. Implement `HomepageHero`.
3. Wire into `src/app/(app)/page.tsx`.
4. Copy banner asset into `public`.
5. Validate responsive UI and search routing.
6. Run `npm run lint`.

