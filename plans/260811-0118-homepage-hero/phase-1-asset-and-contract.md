# Phase 1 — Prepare Asset & Component Contract

## Context Links

- Plan: [`plan.md`](./plan.md)
- Brainstorm (source of truth): [`plans/reports/260811-0116-homepage-hero-brainstorm.md`](../reports/260811-0116-homepage-hero-brainstorm.md)
- Demo reference: `documents/banner/joywork_banner_demo.html`
- Banner asset: `documents/banner/banner_100dn.png`

## Overview

Foundation phase: bring the banner asset into the web app and lock the `HomepageHero` component contract (props, behavior, routing/tokens) so Phase 2 is pure implementation with no open design questions. No UI is built here.

## Key Insights

- `documents/` is a **separate workspace/repo**, not shipped by `joywork-web`. The banner must be **copied** into `joywork-web/public`, not referenced across repos.
- Local `public/` images render with `next/image` by default — no `next.config.ts` `remotePatterns` change needed (verified `next.config.ts:14-41` only lists remote hosts).
- `/jobs` filter contract is stable: `q` and `location` are read via `sp.get("q")` / `sp.get("location")` (`src/app/(app)/jobs/page.tsx:175-176`). `location` must be a province **code** (slug), not a display label.
- `ProvinceSelect.onChange` already returns `province.code` (`src/components/ui/province-select.tsx:52`); codes are slugs like `ha-noi`, `tp-ho-chi-minh` (`src/lib/provinces.ts:13-48`). This is exactly the value `/jobs` expects — reuse it, do not build a custom dropdown.
- All needed color tokens exist in `src/app/globals.css` (`--brand` #1347cd, `--brand-dark` #0d2f8a, `--brand-secondary` #bd026b, plus `--background/--foreground/--border/--muted-foreground/--card/--muted`). The demo's dark-blue gradient can be expressed with `--brand-dark`; the pink accent with `--brand-secondary`.

## Requirements

- Copy banner into `public/banner/banner_100dn.png` (keep original filename).
- Define final `HomepageHero` prop/behavior contract (below) — no props needed for v1 (self-contained).
- Confirm token list to be used; no new global tokens, no Tailwind arbitrary color values, no undefined tokens.

## Architecture

Component contract for Phase 2:

- File: `src/components/feed/HomepageHero.tsx`, `"use client"`, `export default function HomepageHero()`.
- No props (v1 static). Internal state: `keyword: string`, `province: string | null`.
- Behavior: on submit → trim keyword; build `URLSearchParams`; set `q` only if non-empty; set `location` only if province selected; `router.push('/jobs' + (qs ? '?'+qs : ''))` via `next/navigation`.
- CTAs: `next/link` → employer `/companies/new`, candidate `/companies`.
- Banner: `next/image` with fixed intrinsic size + responsive `sizes`; `priority` optional (above the fold).

## Related Code Files

- `src/app/(app)/page.tsx` — homepage host (Phase 2 wiring target).
- `src/app/(app)/layout.tsx` — global shell (read-only; do NOT modify).
- `src/app/(app)/feed-layout.tsx` — two-column feed+RightRail wrapper (placement reference).
- `src/app/(app)/jobs/page.tsx` — `q`/`location` contract source.
- `src/components/ui/province-select.tsx` — reuse for province input.
- `src/lib/provinces.ts` — province codes/labels helpers.
- `src/components/feed/CompanySearch.tsx` — existing feed search pattern (style reference only).
- `src/components/common/Header.tsx` — confirm hero does not duplicate header nav.
- `documents/banner/joywork_banner_demo.html`, `documents/banner/banner_100dn.png` — visual + asset source.

## Implementation Steps

1. Create `joywork-web/public/banner/` and copy `documents/banner/banner_100dn.png` into it.
2. Record the banner's real pixel dimensions (for `next/image` width/height) — inspect the copied file.
3. Freeze the component contract above in this phase file (done) so Phase 2 has zero ambiguity.
4. Confirm CSS tokens to use; note gradient recipe (`--brand-dark` → darker) for Phase 2.

## Todo List

- [ ] Copy `banner_100dn.png` → `public/banner/banner_100dn.png`.
- [ ] Note banner width/height for `next/image`.
- [ ] Confirm `/jobs` param names (`q`, `location`) unchanged.
- [ ] Confirm token list from `globals.css`.

## Success Criteria

- `public/banner/banner_100dn.png` exists and loads at `/banner/banner_100dn.png` in dev.
- Documented contract (props, submit behavior, routes, tokens) requires no further decisions in Phase 2.

## Risk Assessment

- **Asset size / LCP** (Med likelihood, Low impact): banner may be large → accept for v1, `next/image` optimizes; revisit if Lighthouse flags (brainstorm Risk #2).
- **Cross-repo drift** (Low/Low): asset lives in `documents`; copying decouples web build from it.

## Security Considerations

- Static local image only; no untrusted input, no remote host, no `dangerouslySetInnerHTML`. No new secrets or env.

## Next Steps

Proceed to [`phase-2-build-and-wire.md`](./phase-2-build-and-wire.md).

### Unresolved Questions

- Exact banner intrinsic dimensions (resolve by inspecting copied PNG in step 2).
