---
title: "Homepage Hero Banner Carousel"
description: "Convert the single hero banner into an Embla image carousel (loop + autoplay, dots) reusing existing deps, no CMS."
status: pending
priority: P2
effort: 3h
branch: develop
tags: [frontend, homepage, embla, carousel, ui]
created: 2026-08-11
---

## Overview

The homepage hero currently renders a single `Next/Image` banner wrapped in an external link
(`src/components/feed/HomepageHero.tsx:173-188`). This plan converts that banner slot into an
image carousel using the already-installed `embla-carousel-react` + `embla-carousel-autoplay`,
driven by a small `HERO_BANNER_SLIDES` config. For this iteration slides are static (no CMS/API);
demo uses 3 entries that all point to the same `/banner/banner_100dn.png` (no binary duplication).

Constraints preserved: existing hero grid layout (CTAs left, banner right), `rounded-[10px]`,
min-heights, and each slide's click opens its external URL in a new tab with
`rel="noopener noreferrer"`. Accessibility: dot `aria-label`s + `prefers-reduced-motion` disables
autoplay.

## Phases

| # | Phase | Effort | Status | Link |
|---|-------|--------|--------|------|
| 01 | Slides config + assets | 0.5h | pending | [phase-01](./phase-01-slides-config-and-assets.md) |
| 02 | Embla banner carousel component | 1.5h | pending | [phase-02](./phase-02-embla-banner-carousel.md) |
| 03 | Validate + responsive + a11y | 1h | pending | [phase-03](./phase-03-validate-responsive.md) |

## Context report

- [reports/01-context-and-approach.md](./reports/01-context-and-approach.md)

## Progress

- [ ] Phase 01 — Slides config + assets
- [ ] Phase 02 — Embla banner carousel component
- [ ] Phase 03 — Validate + responsive + a11y

## Dependency graph

- Phase 01 → Phase 02 (component consumes the config) → Phase 03 (validation of rendered result).

## Success criteria (rollup)

- Hero shows 3 looping slides with autoplay ~4–5s, dots navigation, click opens external URL `_blank`.
- Layout/visual parity with current hero; lint clean on touched files; reduced-motion respected.
