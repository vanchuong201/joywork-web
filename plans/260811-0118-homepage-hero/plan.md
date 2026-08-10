---
title: "Homepage Hero (Khối khám phá đầu trang)"
description: "Add HomepageHero on / above feed: keyword + province search to /jobs, role CTAs, static banner."
status: pending
priority: P2
effort: 4h
branch: main
tags: [frontend, homepage, hero, nextjs, tailwind]
created: 2026-08-11
---

# Homepage Hero — Implementation Plan

> **Git workflow note:** frontmatter `branch: main` reflects the current checkout only. Per JoyWork git workflow (`.cursor/rules/git-workflow.mdc`), do **not** implement on `main`. Create/switch to `develop` (or a feature branch off `develop`) before writing code; push `develop` → auto staging; promote to `main` via ff-only/rebase for prod.

## Source of Truth

Brainstorm report (approved): [`plans/reports/260811-0116-homepage-hero-brainstorm.md`](../reports/260811-0116-homepage-hero-brainstorm.md). Recommended = **Approach A** (one static banner + functional search). This plan implements only Approach A.

## Goal

Add a `HomepageHero` (a.k.a. Khối khám phá đầu trang) on `/` only, directly under the global header and **above** the current feed, to help users search jobs and discover good-workplace companies — without touching the global app shell.

## Scope Guardrails (explicit non-goals)

- **No backend, no CMS, no admin config, no new API, no analytics, no carousel.** Single static banner image only.
- Do **not** modify global `Header`, `(app)/layout.tsx`, auth flow, or API contracts.
- Reuse existing `/jobs` `q` + `location` query contract and existing `ProvinceSelect` (province `code` values).

## Phases

| # | Phase | File | Depends on |
|---|-------|------|-----------|
| 1 | Prepare asset + component contract | [`phase-1-asset-and-contract.md`](./phase-1-asset-and-contract.md) | — |
| 2 | Build + wire HomepageHero UI/behavior | [`phase-2-build-and-wire.md`](./phase-2-build-and-wire.md) | Phase 1 |
| 3 | Validate responsive + lint | [`phase-3-validate-responsive-and-lint.md`](./phase-3-validate-responsive-and-lint.md) | Phase 2 |

## Key Architecture Decisions

- New client component `src/components/feed/HomepageHero.tsx`.
- Mount **outside** `FeedLayout` in `src/app/(app)/page.tsx` default export so hero spans full main width (feed + right rail), and `RightRail` still starts at feed content (brainstorm Risk #4).
- Banner copied to `public/banner/banner_100dn.png`, rendered via `next/image` (local static — no `next.config.ts` change needed).
- Styling uses only defined CSS var tokens (`--brand`, `--brand-secondary`, `--brand-dark`, `--background`, `--foreground`, `--border`, `--muted-foreground`), verified in `src/app/globals.css`.

## Success Criteria (from brainstorm Acceptance Criteria)

- Hero visible on `/` under header, before composer/feed; desktop left nav + right rail preserved; mobile stacks with no horizontal scroll.
- Search: keyword → `/jobs?q=`; province → `/jobs?location=<code>`; both → combined.
- Employer CTA → `/companies/new`; Candidate CTA → `/companies`; banner via `next/image`.
- No new lint/type errors in changed files.

## Unresolved Questions

See end of each phase file; consolidated in Phase 3.
