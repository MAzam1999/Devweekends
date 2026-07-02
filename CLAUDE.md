# CLAUDE.md — LMS Platform

Instructions for Claude Code working in this repo. Keep changes small, typed, and verified.

## Stack
- Next.js 16 (App Router, React Server Components, Server Actions) + React 19 + TypeScript.
- Tailwind CSS + shadcn/ui for all UI. Do not hand-roll components shadcn provides.
- Neon Postgres + Prisma ORM. Clerk for auth. Stripe for payments. Mux for video.
- Vercel Blob for thumbnails/images. Deploy target: Vercel.

## Commands
- Dev: `npm run dev`  ·  Build: `npm run build`  ·  Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- DB: `npx prisma migrate dev` (schema change) · `npx prisma generate` · `npx prisma studio`
- After ANY schema edit: run `prisma generate` before using the client.
- Stripe webhooks local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Architecture rules
- Default to **Server Components**. Add `"use client"` only for interactivity (forms, player, DnD).
- Mutations go through **Server Actions** in `app/**/actions.ts`, never client-side fetch to write.
- Data access lives in `lib/` (e.g. `lib/db.ts` Prisma singleton, `lib/auth.ts`, `lib/mux.ts`, `lib/stripe.ts`). Components import from `lib/`, not raw SDKs.
- API route handlers (`app/api/.../route.ts`) are ONLY for external webhooks (Stripe, Mux).
- Folder layout:
  - `app/(auth)` — Clerk sign-in/up
  - `app/(dashboard)` — student "My Learning"
  - `app/(course)` — catalog, course detail, lesson player
  - `app/teacher` — instructor course CRUD
  - `app/admin` — admin dashboard (admin role only)
  - `components/ui` — shadcn primitives · `components/` — composed components

## Security (non-negotiable)
- Every mutating Server Action MUST verify the Clerk user and their role first.
- Admin routes/actions: gate on `role === "admin"`. Teacher actions: verify ownership of the course.
- Mux playback uses **signed playback tokens** — only enrolled users (or free lessons) get a token.
- Stripe webhook: verify signature with `stripe.webhooks.constructEvent`. Make handlers idempotent.
- Never expose secret keys to the client. Only `NEXT_PUBLIC_*` vars reach the browser.
- Confirm purchase/enrollment server-side before granting lesson access — never trust client state.

## Data model (Prisma — keep names stable)
`User, Category, Course, Chapter, Lesson, Purchase, Progress`. See PRD.md §6 for fields.
- Order Chapters and Lessons with an integer `position`.
- A Lesson stores `muxAssetId` + `muxPlaybackId`; `isFree` flags preview lessons.

## Conventions
- TypeScript strict. No `any` — use generated Prisma types and zod for input validation.
- Validate ALL Server Action / webhook input with **zod** before touching the DB.
- Use `async`/`await`; handle errors and return typed `{ success, error }` results from actions.
- Keep components small; colocate `actions.ts` and `_components/` with their route.
- Use shadcn `toast`/`sonner` for user feedback, not `alert`.
- Format prices in cents (integer) in the DB; convert for display only.

## Environment variables (set in `.env.local` and Vercel)
```
DATABASE_URL=                         # Neon pooled connection
DIRECT_URL=                           # Neon direct (Prisma migrations)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_KEY=
MUX_PRIVATE_KEY=
BLOB_READ_WRITE_TOKEN=
```
- Never commit `.env*`. Pull from Vercel with `vercel env pull .env.local`.

## Workflow expectations
- Before claiming done: run `npm run build` AND `npx tsc --noEmit` — both must pass. Report real output.
- Build features in PRD milestone order: setup → CRUD → video → payments → learning UX → admin.
- Make one milestone work end-to-end before starting the next; verify on a Vercel preview deploy.
- When adding a dependency, prefer the official SDK (`@clerk/nextjs`, `stripe`, `@mux/mux-node`, `@mux/mux-player-react`).
- Do not scaffold quizzes/certificates/live-classes — out of scope for v1.
- Keep README.md updated with setup + env steps; it is part of the deliverable.

## Don'ts
- Don't fetch secrets or call Stripe/Mux/Prisma from Client Components.
- Don't bypass role checks "temporarily." Don't disable webhook signature verification.
- Don't store video files in the repo or Postgres — Mux holds video, Blob holds images.
- Don't introduce a second styling system or component library alongside shadcn/Tailwind.
