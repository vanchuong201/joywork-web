# Phase 2 — Build & Wire HomepageHero

## Context Links

- Plan: [`plan.md`](./plan.md)
- Depends on: [`phase-1-asset-and-contract.md`](./phase-1-asset-and-contract.md)
- Brainstorm (source of truth): [`plans/reports/260811-0116-homepage-hero-brainstorm.md`](../reports/260811-0116-homepage-hero-brainstorm.md)

## Overview

Build `HomepageHero` as a self-contained client component and mount it on `/` above the feed. Translate the demo's structure into a React component using the JoyWork design system. No backend, no carousel, single static banner.

## Key Insights

- Homepage default export currently wraps everything in `FeedLayout` (`src/app/(app)/page.tsx:238-255`), and `FeedLayout` renders `children` + `RightRail` in a `flex gap-8` (`src/app/(app)/feed-layout.tsx:8-15`). Mounting hero **inside** `FeedLayout` would trap it in the narrow left column.
- Correct placement: render `<HomepageHero />` **before** `<FeedLayout>` in the default export so it spans full main width and `RightRail` still begins at feed content (brainstorm Risk #4).
- `page.tsx` is already `"use client"` — hero can use hooks/`useRouter` freely; keep hero import at top.
- `router.push` (not `replace`) is correct for a navigation from home → jobs (preserve back button). `/jobs` reads params on mount via `useSearchParams`.
- Do not reuse the demo's inline `<select>` of hardcoded cities; use `ProvinceSelect` so codes match `/jobs`.

## Requirements

- Headline (two lines, brainstorm §Recommended Design): "Nền tảng tuyển dụng của" / "những doanh nghiệp có môi trường làm việc tốt".
- Search row: keyword `Input` + `ProvinceSelect` + submit `Button`.
- Body row: left CTA panel (2 role buttons) + right static banner (`next/image`).
- Submit + CTA behavior exactly as Phase 1 contract.
- Styling: CSS var tokens only; brand gradient background; responsive first-class.

## Architecture

Data flow:

```
user types keyword ─┐
user picks province ┼─(submit)→ trim + URLSearchParams(q?,location?) → router.push('/jobs?...') → JobsPage reads sp.get('q'|'location')
                    ┘
CTA click → <Link href="/companies/new" | "/companies">  (plain navigation)
```

Component tree (new): `HomepageHero` → header text, `SearchRow` (Input + ProvinceSelect + Button), `HeroBody` (CtaPanel + `next/image` banner). All in one file for v1 (KISS); split later only if reused.

Mount edit in `page.tsx` default export:

```tsx
return (
  <>
    <HomepageHero />
    <FeedLayout>
      <Suspense fallback={...}><FeedPageContent /></Suspense>
    </FeedLayout>
  </>
);
```

## Related Code Files

- `src/components/feed/HomepageHero.tsx` — **new** component.
- `src/app/(app)/page.tsx` — mount point (edit default export only; leave `FeedPageContent` untouched).
- `src/components/ui/province-select.tsx` — province input.
- `src/components/ui/button.tsx`, `src/components/ui/input.tsx` — primitives (match existing usage in jobs page).
- `src/lib/provinces.ts` — codes/labels.
- `public/banner/banner_100dn.png` — from Phase 1.
- `src/app/globals.css` — token reference.

## Implementation Steps

1. Create `HomepageHero.tsx` (`"use client"`): local `keyword`, `province` state; `handleSubmit` builds params and `router.push`.
2. Build headline + search row (Input, ProvinceSelect, Button) with brand-gradient container using tokens.
3. Build hero body: CTA panel (`Link` employer `/companies/new`, candidate `/companies`) + banner `next/image` (width/height from Phase 1, responsive `sizes`, `alt="100 doanh nghiệp có môi trường làm việc tốt"`).
4. Wire responsive layout: desktop = search full-width + `flex` body (CTA fixed width, banner flex-1); mobile = stacked, full-width fields, banner keeps aspect ratio.
5. Edit `page.tsx` default export to render `<HomepageHero />` above `<FeedLayout>`; add import.
6. Manual sanity: submit with keyword only / province only / both / neither; verify resulting URLs.

## Todo List

- [ ] Create `HomepageHero.tsx` with submit → `/jobs` param logic.
- [ ] Headline + search row using design-system primitives + tokens.
- [ ] CTA panel links to `/companies/new` and `/companies`.
- [ ] Banner via `next/image`.
- [ ] Mount above `FeedLayout` in `page.tsx`.
- [ ] Verify all four search permutations produce correct `/jobs` URLs.

## Success Criteria

- Hero renders on `/` under header, above composer/feed; feed + right rail unchanged.
- keyword→`/jobs?q=`, province→`/jobs?location=<code>`, both→combined, neither→`/jobs`.
- Employer→`/companies/new`, candidate→`/companies`; banner loads via `next/image`.

## Risk Assessment

- **Province value mismatch** (Med/High): if not using `ProvinceSelect` code, `/jobs` filter breaks → mitigate by reusing `ProvinceSelect` `onChange` code directly (brainstorm Risk #1).
- **Placement regression** (Med/Med): wrong mount collapses hero into left column or breaks right rail → mitigate with the "outside FeedLayout" pattern above; verify on desktop.
- **Vertical crowding on mobile** (Low/Med): compact spacing between hero and composer (brainstorm Risk #3).

## Security Considerations

- Keyword is user input but only serialized into `URLSearchParams` (encoded) for client navigation — no HTML injection, no `dangerouslySetInnerHTML`, no direct DOM write.
- No auth/permission surface touched; CTAs are public routes. No API calls added.

## Next Steps

Proceed to [`phase-3-validate-responsive-and-lint.md`](./phase-3-validate-responsive-and-lint.md).

### Unresolved Questions

- Final CTA button copy/casing (demo uses "Đăng tin tuyển dụng miễn phí" / "Xem hồ sơ các doanh nghiệp tốt") — confirm exact wording with product before/at implementation.
