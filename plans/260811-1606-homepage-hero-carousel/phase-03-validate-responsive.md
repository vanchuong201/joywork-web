# Phase 03 — Validate + responsive + a11y

## Context links

- Plan: [plan.md](./plan.md)
- Depends on: [phase-02](./phase-02-embla-banner-carousel.md)
- Source under test: `src/components/feed/HomepageHero.tsx`

## Overview

- Date: 2026-08-11
- Description: Verify the carousel works across breakpoints, is accessible, preserves external-link
  behavior, and passes lint on touched files.
- Priority: P2
- Implementation status: pending
- Review status: not reviewed

## Key Insights

- The hero grid collapses to single column on mobile (`lg:grid-cols-[220px_minmax(0,1fr)]`,
  `HomepageHero.tsx:136`); the banner cell stacks under the CTAs. Carousel must keep `min-h-[180px]`
  mobile / `lg:min-h-[230px]` and full-width slides.
- No test harness assumed for this component; validation is manual + lint/type-check (repo AGENTS note:
  ESLint is the primary gate for web; `npm run lint`).

## Requirements

- Works at mobile (~375px), tablet (~768px), desktop (~1280px).
- Autoplay advances ~every 4.5s and loops; hover/focus pause behaves.
- Dots keyboard-accessible (Tab + Enter/Space), visible focus, correct `aria-label`s.
- `prefers-reduced-motion: reduce` disables/stops autoplay (manual toggle in OS/devtools).
- Each slide click opens `https://doanhnghieptot.joywork.vn/` in a new tab.

## Architecture

- Validation only — no new runtime code. Optionally add lightweight checks if a test setup exists.

## Related code files

- `src/components/feed/HomepageHero.tsx` — target of validation.

## Implementation Steps

1. `npm run lint` (scope to touched files if possible) — fix any new warnings/errors.
2. `npm run type-check` (or `tsc --noEmit`) — ensure no type regressions.
3. Run `npm run dev`, open homepage; verify slides, autoplay, loop, dots, hover-pause.
4. Toggle reduced-motion (DevTools Rendering → emulate CSS `prefers-reduced-motion`) → autoplay stops.
5. Resize to mobile/tablet/desktop; confirm heights, radius, no overflow/layout shift.
6. Click a slide → confirm new tab to external URL; inspect anchor has `rel="noopener noreferrer"`.
7. Keyboard: Tab to dots, activate with Enter/Space; confirm focus ring + slide change.

## Todo list

- [ ] Lint clean on touched files
- [ ] Type-check clean
- [ ] Manual: autoplay + loop + hover pause
- [ ] Manual: reduced-motion disables autoplay
- [ ] Manual: responsive at 375/768/1280
- [ ] Manual: click opens external `_blank`
- [ ] Manual: dot keyboard a11y + focus ring

## Success Criteria

- All todo checks pass; hero visually matches previous single-banner layout aside from added dots.
- No new lint/type errors; no console errors/warnings in dev.

## Risk Assessment

- Low: validation phase. Main risk is missed edge case (reduced-motion / tabnabbing) — covered by explicit steps.

## Security Considerations

- Confirm every rendered slide anchor includes `rel="noopener noreferrer"` and `target="_blank"`.

## Next steps

- Update `plan.md` progress checkboxes; commit on `develop` (conventional commit, e.g.
  `feat(homepage): add hero banner carousel`). No DB/deploy impact.
