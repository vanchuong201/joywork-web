# Phase 01 — Slides config + assets

## Context links

- Plan: [plan.md](./plan.md)
- Context report: [reports/01-context-and-approach.md](./reports/01-context-and-approach.md)
- Source to edit: `src/components/feed/HomepageHero.tsx`
- Asset: `public/banner/banner_100dn.png`

## Overview

- Date: 2026-08-11
- Description: Extract a small typed `HERO_BANNER_SLIDES` config (src, alt, href) that will drive the
  carousel, decoupling banner data from render markup. Demo uses 3 entries all pointing to the same
  existing image.
- Priority: P2
- Implementation status: pending
- Review status: not reviewed

## Key Insights

- Current banner is hardcoded inline: `src="/banner/banner_100dn.png"`, `alt`, and external `href`
  `https://doanhnghieptot.joywork.vn/` (`HomepageHero.tsx:173-188`).
- The image is 2.4MB (`public/banner/banner_100dn.png`, 1942×809). Reuse the same `src` string in
  the config array; do NOT copy the binary 3× — same URL is cached once by the browser and Next image
  optimizer, which is ideal for a demo.
- No CMS/API this iteration → config is a module-level constant, not fetched.

## Requirements

- Type-safe slide shape: `{ src: string; alt: string; href: string }` (add `id` if a stable key is wanted).
- Exactly 3 demo slides, all `src: "/banner/banner_100dn.png"`, all `href: "https://doanhnghieptot.joywork.vn/"`.
- Distinct `alt` text per slide is acceptable (or same alt) — keep descriptive Vietnamese alt.

## Architecture

- Define `HERO_BANNER_SLIDES` near the top of `HomepageHero.tsx` (sibling to `MIN_KEYWORD_LENGTH`,
  `GOOD_COMPANIES_URL`). Keeping it in the same file honors KISS/YAGNI for a 3-item static list; a
  separate `hero-banner-slides.ts` is optional and only worth it if reused elsewhere (not now).
- Export decision: keep as a local `const` (not exported) unless Phase 02 splits the carousel into a
  sibling component that imports it — in that case export it or co-locate both in one file.

## Related code files

- `src/components/feed/HomepageHero.tsx` — add config constant; consumed in Phase 02.

## Implementation Steps

1. Add a `type HeroBannerSlide = { id: string; src: string; alt: string; href: string }`.
2. Add `const HERO_BANNER_SLIDES: HeroBannerSlide[]` with 3 entries reusing the same image + href.
3. Leave existing render untouched in this phase (config only), or wire in Phase 02.

## Todo list

- [ ] Add `HeroBannerSlide` type
- [ ] Add `HERO_BANNER_SLIDES` (3 demo entries, shared src/href)
- [ ] Confirm alt text is descriptive and Vietnamese

## Success Criteria

- `HERO_BANNER_SLIDES` exists with 3 typed entries; no binary duplication under `public/banner/`.
- `npm run type-check` (or IDE) shows no type errors from the new config.

## Risk Assessment

- Low. Pure data addition, no behavior change until Phase 02.
- Mitigation: keep config colocated to avoid premature abstraction.

## Security Considerations

- `href` targets an external JoyWork subdomain; Phase 02 must preserve `target="_blank"` +
  `rel="noopener noreferrer"`. No user input involved, no XSS surface.

## Next steps

- Proceed to [phase-02](./phase-02-embla-banner-carousel.md) to render the config in an Embla carousel.
