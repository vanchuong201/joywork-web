# JoyWork Web Agent Guide

This repo is a Next.js App Router frontend for JoyWork.

Follow `.cursor/rules/*.mdc` first. Use this file as the short default guide:

- Match existing frontend style: `double quotes`, semicolons, and `@/` alias imports for cross-folder code.
- Keep `src/app` route files thin; move reusable UI, forms, mutations, and business logic into `src/components`, `src/hooks`, `src/lib`, `src/store`, or `src/contexts`.
- Prefer `default export` for `page.tsx`, `layout.tsx`, screen components, and large modals; prefer named exports for hooks, utilities, stores, and UI primitives.
- Use `src/lib/api.ts` for HTTP calls and preserve the current auth flow based on `accessToken`, refresh interception, and `useAuthStore`.
- New forms should default to `react-hook-form` + `zodResolver` and always keep loading, disabled, inline error, and toast states aligned.
- Treat uploads, rich text, and any HTML rendering as untrusted input; sanitize before send or render and preserve file restrictions.
- Do not hardcode public runtime config like OAuth client IDs; use `NEXT_PUBLIC_*` env variables instead.
- Before finishing meaningful frontend work, run the most relevant validation available, usually `npm run lint`, because build does not enforce ESLint here.
