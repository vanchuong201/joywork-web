# Phase 02 — Embla banner carousel component

## Context links

- Plan: [plan.md](./plan.md)
- Depends on: [phase-01](./phase-01-slides-config-and-assets.md)
- Source to edit: `src/components/feed/HomepageHero.tsx`
- Reference patterns: `src/app/(app)/jobs/page.tsx:91-148` (SimpleCarousel), `src/components/company/profile/CompanyProfileContent.tsx:938-961` (SectionCarousel)

## Overview

- Date: 2026-08-11
- Description: Replace the single-`<a><Image></a>` banner slot with an Embla carousel that renders
  `HERO_BANNER_SLIDES` as looping, autoplaying slides with dot navigation, preserving the hero grid
  layout and per-slide external link behavior.
- Priority: P2
- Implementation status: pending
- Review status: not reviewed

## Key Insights

- Existing Embla usages instantiate `useEmblaCarousel(options)` and subscribe to `select`/`reInit`
  events (`jobs/page.tsx:98-111`). No `Autoplay` plugin usage exists yet → this is the first, so import
  `Autoplay from "embla-carousel-autoplay"` and pass it as the 2nd arg: `useEmblaCarousel(opts, [Autoplay(...)])`.
- The banner slot to replace is `HomepageHero.tsx:173-188` — an `<a>` wrapping one `<Image>` inside the
  right grid cell of `grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]` (`HomepageHero.tsx:136`).
- Each slide needs its OWN external link (config carries per-slide `href`), so the `<a>` must live
  INSIDE each slide, not around the whole carousel.
- Autoplay plugin exposes `plugins()`/`.play()/.stop()` via `emblaApi.plugins().autoplay` for
  pause-on-hover; simplest robust approach is `stopOnInteraction: false` + optional
  `stopOnMouseEnter: true` (built into the plugin) rather than manual handlers.

## Requirements

- Loop enabled (`loop: true`), autoplay delay ~4000–5000ms.
- Dots under/over banner, one per slide, active dot highlighted, `aria-label` per dot
  (e.g. `Chuyển tới banner ${i+1}`), keyboard-focusable buttons.
- Arrows optional — default to dots-only for a clean hero (document arrows as a toggle if desired).
- Each slide: `<a href={slide.href} target="_blank" rel="noopener noreferrer">` wrapping the `<Image>`.
- First slide image keeps `priority`; subsequent slides use lazy loading (drop `priority`) to avoid
  triple eager 2.4MB fetches.
- Preserve outer container classes: `min-h-[180px] ... lg:min-h-[230px]`, `rounded-[10px]`,
  `border border-white/10`, `object-cover`.

## Architecture

- Prefer a dedicated `HeroBannerCarousel` client component (sibling in same file OR new
  `src/components/feed/HeroBannerCarousel.tsx`) that receives `slides: HeroBannerSlide[]` and
  encapsulates Embla state; `HomepageHero` stays mostly declarative. `HomepageHero` is already
  `"use client"` so either location works.
- Embla structure mirrors existing code: `ref={emblaRef}` on `overflow-hidden` viewport → flex track →
  each slide `flex-[0_0_100%]`.
- Reduced-motion: compute `prefers-reduced-motion` (via `window.matchMedia`); if reduced, either skip
  the Autoplay plugin entirely or set `playOnInit: false` and never start. Guard for SSR (Next) by
  reading matchMedia inside `useEffect`.
- Dots: track `selectedIndex` and `scrollSnaps` from `emblaApi.scrollSnapList()` + `select` event,
  `scrollTo(i)` on click — same event pattern as `jobs/page.tsx:104-111`.

## Related code files

- `src/components/feed/HomepageHero.tsx` — replace banner slot (`:173-188`), consume config.
- `src/app/(app)/jobs/page.tsx:91-148` — reference for Embla ref/track/dots wiring.
- `src/components/company/profile/CompanyProfileContent.tsx:938-961` — reference for select/reInit.

## Implementation Steps

1. Import `useEmblaCarousel` and `Autoplay`; add `useEffect`/`useState`/`useCallback` as needed.
2. Build autoplay options: `Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })`.
3. Instantiate `useEmblaCarousel({ loop: true, align: "start" }, reducedMotion ? [] : [autoplay])`.
4. Render viewport/track; map `slides` → slide `<a>` + `<Image>` (first slide `priority`, rest lazy).
5. Add dots row (absolute over banner or below) with active state + `aria-label` per dot.
6. Wire `select`/`reInit` listeners to update `selectedIndex`; `scrollTo` on dot click.
7. Replace the old single-banner `<a>` block in `HomepageHero` with the carousel (or `<HeroBannerCarousel slides={HERO_BANNER_SLIDES} />`).

## Todo list

- [ ] Import Embla + Autoplay
- [ ] Create carousel viewport/track from config
- [ ] Per-slide external `<a>` with `_blank` + `rel="noopener noreferrer"`
- [ ] Autoplay (loop, ~4.5s, pause on hover)
- [ ] Dots with aria-labels + active state
- [ ] Reduced-motion guard disables autoplay
- [ ] First-slide `priority`, rest lazy
- [ ] Remove/replace old single banner block

## Success Criteria

- 3 slides loop and autoplay; hovering pauses; dots reflect and control current slide.
- Clicking a slide opens its `href` in a new tab; layout matches previous hero (grid, radius, heights).
- No console warnings; `next/image` renders without layout shift.

## Risk Assessment

- Medium: first Autoplay integration in the repo — plugin API misuse could break build.
  Mitigation: follow official `embla-carousel-autoplay` v8 API (plugin as 2nd arg array).
- Medium: 3× 2.4MB image eager load hurts LCP.
  Mitigation: only first slide `priority`, others lazy; same URL is cached once.
- Low: SSR `window`/`matchMedia` access.
  Mitigation: read matchMedia inside `useEffect`, default to motion-on until effect resolves.

## Security Considerations

- Keep `rel="noopener noreferrer"` on every slide link (reverse-tabnabbing protection).
- Slide data is static/trusted (no user input, no `dangerouslySetInnerHTML`).

## Next steps

- Proceed to [phase-03](./phase-03-validate-responsive.md) for responsive + a11y validation.
