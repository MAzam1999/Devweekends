# LMS Platform

A full-stack Learning Management System built with Next.js 16, Prisma, Clerk, Stripe, and Mux.

**Live demo:** _deploy to Vercel and add URL here_  
**GitHub:** https://github.com/MAzam1999/Devweekends

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

## Docker & Deployment (AWS EC2)

This repo also ships as a self-hosted Docker deployment on AWS, running
**in parallel** with the Vercel deployment above — same codebase, same
external services (Neon / Clerk / Stripe / Mux / Blob), two independent URLs.

> **Note on "MERN":** this project is React + Node.js + **PostgreSQL**
> (Next.js 16 / Prisma / Neon), not MongoDB. The containerization, CI/CD,
> and cloud-deployment work is stack-independent — swapping Postgres for
> Mongo would change a connection string, not any of the DevOps steps
> demonstrated here.

### Architecture

```
git push to main
      │
      ▼
GitHub Actions runner
  ├─ checkout
  ├─ docker build  (NEXT_PUBLIC_* injected as build args)
  ├─ push image → Amazon ECR
  └─ SSH to EC2 ─────────────┐
                             ▼
                    EC2 (t3.micro, Amazon Linux 2023)
                      ├─ nginx  :80  ──reverse proxy──┐
                      └─ docker run :3000 ◄───────────┘
                          (--env-file /opt/lms/.env)
                                    ↕
                    Neon · Clerk · Stripe · Mux · Blob
```

The external services are unchanged and shared between the Vercel and EC2
deployments. The container is stateless — no volumes, no local database,
no uploaded files on disk.

### Local build & run

```bash
# Build (build args come from .env.local; see docker-compose.yml)
docker compose build

# Run
docker compose up
```

Or directly with `docker build`/`docker run`:

```bash
docker build \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="$NEXT_PUBLIC_CLERK_SIGN_IN_URL" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="$NEXT_PUBLIC_CLERK_SIGN_UP_URL" \
  -t lms-platform:local .

docker run -p 3000:3000 --env-file .env.local lms-platform:local
```

`NEXT_PUBLIC_*` values are compiled into the client bundle at **build time**
— passing them to `docker run` instead has no effect. See the build-arg vs
runtime-env table below.

### Build-time vs runtime configuration

| Variable | Needed at | Mechanism |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Build | `--build-arg` |
| `NEXT_PUBLIC_APP_URL` | Build | `--build-arg` (EC2 URL, not Vercel's) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `_SIGN_UP_URL` | Build | `--build-arg` |
| `DATABASE_URL` | Build *and* runtime | build arg + `--env-file` |
| `DIRECT_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MUX_*`, `BLOB_READ_WRITE_TOKEN` | Runtime only | `--env-file` |

### Required GitHub Actions secrets

Set these in **Settings → Secrets and variables → Actions** on the repo:

| Secret | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM deploy user (ECR push + nothing else) |
| `AWS_REGION` | e.g. `us-east-1` |
| `ECR_REPOSITORY` | ECR repo name, e.g. `lms-platform` |
| `EC2_HOST` | Elastic IP / public DNS of the EC2 instance |
| `EC2_USER` | SSH user (`ec2-user` on Amazon Linux) |
| `EC2_SSH_KEY` | Full private key (PEM), including header/footer lines |
| `DATABASE_URL` | Neon pooled connection string (build arg, per R1) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_APP_URL` | Public EC2 URL (differs from the Vercel value) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk routes |

Runtime-only secrets (`CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `MUX_*`, etc.)
are **not** GitHub secrets — they live only in `/opt/lms/.env` on the EC2
host (see below), loaded via `docker run --env-file`.

### EC2 bootstrap (one-time, manual)

1. Launch a `t3.micro` (Amazon Linux 2023), attach an Elastic IP.
2. Security group: `22` (SSH, your IP only), `80` and `443` (all). Port
   `3000` stays private — nginx fronts it.
3. Install Docker, enable on boot, install nginx, reverse-proxy `:80 → 127.0.0.1:3000`.
4. Create `/opt/lms/.env` (`chmod 600`) with the runtime-only secrets above.
5. Create the ECR repo (`lms-platform`) and an IAM user scoped to ECR push only.
6. Point Stripe's and Mux's webhook endpoints at the EC2 URL (separate
   signing secrets from the Vercel deployment), and add the EC2 origin in
   Clerk's dashboard.

### CI/CD pipeline

`.github/workflows/deploy.yml` runs on every push to `main` (and manually via
`workflow_dispatch`): typecheck → build → push to ECR (tagged `:latest` and
`:<sha>`) → SSH into EC2 → pull, restart the container, prune old images →
smoke-check the public URL.

### Rollback

Every image is also tagged with its commit SHA. To roll back, SSH into the
host and run the previous SHA's image:

```bash
docker run -d --name lms-platform --restart unless-stopped \
  --env-file /opt/lms/.env -p 3000:3000 \
  <ecr-registry>/lms-platform:<previous-sha>
```

**Live EC2 demo:** http://13.51.5.126

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
