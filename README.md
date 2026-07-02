# LMS Platform

A full-stack Learning Management System built with Next.js 16, Prisma, Clerk, Stripe, and Mux.

**Live demo:** _deploy to Vercel and add URL here_  
**GitHub:** _add repo URL here_

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Database | Neon Postgres via Prisma ORM |
| Auth | Clerk |
| Payments | Stripe Checkout + Webhooks |
| Video | Mux (upload + signed playback) |
| File storage | Vercel Blob |
| Hosting | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd lms-platform
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string (pooled) |
| `DIRECT_URL` | Neon dashboard → Connection string (direct) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI or Stripe dashboard → Webhooks |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your Vercel URL |
| `MUX_TOKEN_ID` | Mux dashboard → Settings → API Access Tokens |
| `MUX_TOKEN_SECRET` | Mux dashboard → Settings → API Access Tokens |
| `MUX_SIGNING_KEY` | Mux dashboard → Settings → Signing Keys |
| `MUX_PRIVATE_KEY` | Mux dashboard → Settings → Signing Keys (base64) |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → Blob |

### 3. Database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

> **No Stripe account?** Stripe does not currently support account creation from Pakistan (or several other countries). If you can't get `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`, see [Testing without live Stripe keys](#testing-without-live-stripe-keys) below — the payment code can be fully exercised without them.

---

## Testing

```bash
npm test          # run once
npm run test:watch
```

Tests live next to the route they cover (`*.test.ts`), using Vitest.

### Testing without live Stripe keys

`app/api/stripe/checkout/route.test.ts` and `app/api/webhooks/stripe/route.test.ts` mock `@/lib/stripe`, `@/lib/db`, `@clerk/nextjs/server`, and `next/headers` — no network calls are made and no `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are read, so `npm test` passes with zero Stripe configuration. They cover:

- checkout: auth required, input validation, course-not-found/unpublished, duplicate-purchase guard, Stripe customer creation vs. reuse, checkout session metadata
- webhook: missing/invalid signature rejection, malformed metadata, idempotent purchase upsert (replayed events don't duplicate), unrelated event types are acknowledged without side effects

This verifies the integration logic (auth, ownership, idempotency, signature verification branching) is correct even without a Stripe account. It does **not** verify Stripe's real API contract — once you have a test-mode account (your own, or borrowed test keys from someone in a supported country, per CLAUDE.md's account-scoped `STRIPE_SECRET_KEY`), run through an actual checkout with a [Stripe test card](https://docs.stripe.com/testing) and confirm the webhook fires end-to-end.

---

## Roles

Set roles in Clerk's **public metadata** for each user:

```json
{ "role": "student" }    // default
{ "role": "instructor" }
{ "role": "admin" }
```

Or use the **Admin → Users** page to change roles after signing in with an admin account.

---

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard (or via `vercel env add`).

After deploying:
1. Add your Vercel URL as `NEXT_PUBLIC_APP_URL`
2. Add the Vercel URL to Stripe's webhook endpoints
3. Add the Vercel URL to Mux's allowed origins

---

## Project structure

```
app/
  (auth)/          # Clerk sign-in/up
  (course)/        # Student-facing catalog, detail, lesson player
  (dashboard)/     # My Learning page
  teacher/         # Instructor course CRUD
  admin/           # Admin dashboard
  api/
    upload/        # Vercel Blob image upload
    mux/           # Mux signed upload URL
    stripe/        # Stripe Checkout session
    webhooks/      # Stripe + Mux webhooks
lib/               # Prisma client, auth helpers, SDK singletons
components/        # Shared UI components
prisma/
  schema.prisma    # Data model
  seed.ts          # Category seed data
```
