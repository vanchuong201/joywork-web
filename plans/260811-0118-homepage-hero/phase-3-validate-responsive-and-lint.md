# Phase 3 — Validate Responsive Behavior & Lint

## Context Links

- Plan: [`plan.md`](./plan.md)
- Depends on: [`phase-2-build-and-wire.md`](./phase-2-build-and-wire.md)
- Brainstorm (source of truth): [`plans/reports/260811-0116-homepage-hero-brainstorm.md`](../reports/260811-0116-homepage-hero-brainstorm.md)

## Overview

Verification phase: confirm the hero behaves and renders correctly across breakpoints, does not regress the existing homepage, and passes project checks. No new features.

## Key Insights

- `AGENTS.md` (web): build does **not** enforce ESLint here — run `npm run lint` explicitly before finishing.
- Homepage `/` and `/jobs` are `export const dynamic = 'force-dynamic'` and client-rendered; validation is primarily manual/interaction + lint/type-check, not SSR snapshots.
- Right rail (`RightRail`) content and feed composer must look identical to pre-change (hero is additive, mounted above `FeedLayout`).

## Requirements

- No horizontal scroll at mobile widths; fields become full width; banner keeps aspect ratio.
- Desktop layout preserves left nav (`LeftNav` from layout) and right rail.
- All acceptance-criteria routes work (see brainstorm §Acceptance Criteria).
- No new lint or type errors in changed files (`HomepageHero.tsx`, `page.tsx`).

## Architecture

Validation matrix:

| Check | Method | Expected |
|-------|--------|----------|
| keyword only | submit | `/jobs?q=<kw>` |
| province only | submit | `/jobs?location=<code>` |
| both | submit | `/jobs?q=<kw>&location=<code>` |
| neither | submit | `/jobs` |
| employer CTA | click | `/companies/new` |
| candidate CTA | click | `/companies` |
| mobile ≤375px | resize | stacked, no x-scroll |
| tablet ~768px | resize | search full-width, body adapts |
| desktop ≥1024px | resize | CTA + banner side-by-side, right rail intact |
| banner | load | served via `next/image`, no 404 |

## Related Code Files

- `src/components/feed/HomepageHero.tsx` — component under test.
- `src/app/(app)/page.tsx` — integration point.
- `src/app/(app)/jobs/page.tsx` — destination; confirm params parsed and applied.
- `public/banner/banner_100dn.png` — asset load check.

## Implementation Steps

1. Run dev server; load `/`; visually confirm hero above composer, header/left-nav/right-rail unchanged.
2. Execute the validation matrix (all four search permutations + both CTAs).
3. Resize/DevTools device toolbar at ~375 / 768 / 1024 / 1440px; check no horizontal scroll and banner aspect ratio.
4. On `/jobs`, confirm arriving `q`/`location` populate filters and results (province chip shows via `getProvinceNameByCode`).
5. Run `npm run lint`; then `npm run type-check` (per `AGENTS.md`); fix any new issues in changed files only.
6. (Optional) Lighthouse pass on `/` for banner LCP; note follow-up if flagged (do not optimize prematurely).

## Todo List

- [ ] Manual: all search permutations produce correct URLs.
- [ ] Manual: both CTAs navigate correctly.
- [ ] Responsive: no x-scroll at 375/768/1024/1440.
- [ ] Regression: composer, feed, right rail, left nav unchanged.
- [ ] `npm run lint` clean on changed files.
- [ ] `npm run type-check` clean.

## Success Criteria

- Every row in the validation matrix passes.
- No new lint/type errors introduced.
- No visual regression to existing homepage feed/rails.

## Risk Assessment

- **Lint config drift** (Low/Low): if `npm run lint` errors on config, fall back to `type-check` + targeted manual review and note it (mirrors API repo guidance).
- **Undefined-token styling** (Low/Med): a stray Tailwind arbitrary color would violate web security rule → grep changed files for arbitrary color values before sign-off.

## Security Considerations

- Confirm no secrets, tokens, or env values added; no `dangerouslySetInnerHTML`; keyword only used in encoded query params.
- Confirm no new outbound requests or third-party scripts were introduced (demo's Tabler CDN + slider JS must NOT be ported).

## Next Steps

- Hand off for review/QA on `develop` (staging auto-deploy). Promote to `main` for prod only via ff-only/rebase per JoyWork git workflow.
- Future (out of scope): CMS/admin-managed banner, multi-slide carousel, analytics on hero search/CTAs.

### Unresolved Questions (consolidated)

1. Exact banner intrinsic dimensions — resolved during Phase 1 asset copy.
2. Final CTA button copy/casing — confirm with product (Phase 2).
3. Should hero also show for logged-in users, or only guests? Brainstorm implies always-on for `/`; confirm if a logged-in variant is desired (default: always show).
