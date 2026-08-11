# Report 01 — Context & Approach

Date: 2026-08-11 · Branch: develop

## Current state (verified)

- Hero banner is a single external link + image: `src/components/feed/HomepageHero.tsx:173-188`
  (`<a href="https://doanhnghieptot.joywork.vn/" target="_blank" rel="noopener noreferrer">` →
  `<Image src="/banner/banner_100dn.png" width={1942} height={809} priority ... object-cover />`).
- Banner sits in right cell of grid `lg:grid-cols-[220px_minmax(0,1fr)]` (`:136`); CTAs on left (`:137-171`).
- Component is already `"use client"` (`:1`).
- Deps present: `embla-carousel-react@^8.6.0`, `embla-carousel-autoplay@^8.6.0` (`package.json:46-47`).
- Existing Embla usages (no Autoplay yet): `src/app/(app)/jobs/page.tsx:91-148` (SimpleCarousel;
  `useEmblaCarousel`, `select`/`reInit`, `scrollPrev/Next`), and
  `src/components/company/profile/CompanyProfileContent.tsx:938-961` (SectionCarousel).
- Asset: `public/banner/banner_100dn.png` = 2,448,096 bytes (~2.4MB), 1942×809.

## Approach

- Extract `HERO_BANNER_SLIDES` config (`{ src, alt, href }`) — 3 demo entries reusing the same image
  URL and href. No binary duplication (same URL cached once).
- Build an Embla carousel (`loop: true` + `Autoplay(~4.5s)`, dots-only, per-slide external `<a>`),
  reusing the repo's established `select`/`reInit` + `scrollTo` dot pattern. This is the first
  `embla-carousel-autoplay` integration in the repo → pass plugin as 2nd arg array.
- Preserve layout (grid, `rounded-[10px]`, min-heights, `object-cover`) and link security
  (`_blank` + `rel="noopener noreferrer"`).
- Accessibility: dot `aria-label`s + `prefers-reduced-motion` disables autoplay.
- Perf: only first slide keeps `priority`; others lazy.

## Trade-offs

- Config colocated in `HomepageHero.tsx` (KISS) vs separate file — separate file only if the carousel
  is split into `HeroBannerCarousel.tsx`. Either is fine; recommend split component for readability.
- Dots-only (recommended) vs arrows — dots keep the hero clean; arrows optional.

## Unresolved questions

- Autoplay delay exact value (4000 vs 4500 vs 5000ms)? Plan assumes ~4500ms.
- Distinct alt text per slide, or identical for the demo? (All same image.)
- Keep config inline in `HomepageHero.tsx` or new `HeroBannerCarousel.tsx`? (Plan recommends split.)
