# Product Requirements Document — LMS Platform

**Project:** Full-Stack Learning Management System
**Program:** Dev Weekends
**Owner:** Muhammad Azam
**Start:** 2026-06-15 · **Due:** 2026-06-28 · **Budget:** 15–20 days (7-day core minimum)
**Deliverable:** Live demo URL + public GitHub repo

---

## 1. Summary

A web-based Learning Management System where **instructors/admins** create and sell
video courses, and **students** browse, purchase, enroll, and watch lessons with
progress tracking. Built on Next.js, deployed on Vercel.

## 2. Goals & Non-Goals

**Goals**
- Course CRUD with categories, chapters, and lessons.
- Secure video upload and adaptive streaming.
- Paid enrollment via a real payment provider (test mode acceptable for demo).
- Admin dashboard to manage users, courses, and revenue.

**Non-Goals (v1)**
- Live classes / video conferencing.
- Quizzes, certificates, gamification (nice-to-have, post-v1).
- Mobile native apps. Native AI tutoring.

## 3. Personas

| Persona | Needs |
|---------|-------|
| **Student** | Discover courses, pay, watch, resume where left off, track progress. |
| **Instructor** | Create/edit courses, upload videos, set price, publish. |
| **Admin** | Oversee all users & courses, moderate content, view revenue. |

## 4. Tech Stack (decided defaults)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 16 (App Router, RSC, Server Actions)** + React 19 | Fullstack, deploys cleanly to Vercel. |
| Language | **TypeScript** | Type safety across data layer. |
| UI | **Tailwind CSS + shadcn/ui** | Fast, accessible, consistent. |
| DB | **Neon Postgres** (Vercel Marketplace) | Serverless Postgres, branching for previews. |
| ORM | **Prisma** | Schema-first, migrations, type-safe queries. |
| Auth | **Clerk** | Drop-in auth, roles/orgs, Next.js middleware. |
| Payments | **Stripe** (Checkout + webhooks) | Standard, well-documented, test mode. |
| Video | **Mux** (`@mux/mux-player-react`) | Best Next.js DX, signed playback, HLS, analytics. |
| File/Image storage | **Vercel Blob** | Course thumbnails, attachments. |
| Hosting | **Vercel** | Fluid Compute, preview deploys, env management. |

> Cost-sensitive alternative for video: **Cloudflare Stream** (cheaper at scale,
> 1080p cap, fewer analytics). Default to Mux for DX unless budget dictates.

## 5. Functional Requirements

### 5.1 Auth & Roles
- Sign-up / sign-in via Clerk (email + OAuth).
- Roles: `student` (default), `instructor`, `admin` (Clerk public metadata).
- Route protection via middleware; admin routes gated to `admin`.

### 5.2 Course Management (CRUD)
- Course: title, description, thumbnail, price, category, published flag.
- Chapters (ordered) → Lessons (ordered, each with a Mux video + optional notes).
- Drag-to-reorder chapters and lessons.
- Draft vs. Published states; publish requires title, description, price, ≥1 lesson.
- Categories: CRUD, assignable to courses, used for filtering.

### 5.3 Video Upload & Streaming
- Direct upload to Mux (signed upload URL from a Server Action).
- Show processing state via Mux webhook (`video.asset.ready`).
- Playback with `@mux/mux-player-react` using **signed playback tokens** so only
  enrolled users can stream.

### 5.4 Enrollment & Payments
- Free preview lessons flag; paid courses require purchase.
- Stripe Checkout session per course purchase.
- Webhook (`checkout.session.completed`) creates a `Purchase`/enrollment record.
- Enrolled students get full course access and progress tracking.

### 5.5 Learning Experience
- Course catalog with search + category filter.
- Course detail page (syllabus, price, enroll/buy CTA).
- Lesson player page; mark lesson complete; per-course progress %.
- "My Learning" dashboard listing enrolled courses with progress.

### 5.6 Admin Dashboard
- Metrics: total users, total courses, total revenue, recent sales.
- User management: list, search, change role, deactivate.
- Course management: list all, toggle publish, delete.
- Charts for sales over time (revenue per course/month).

## 6. Data Model (high level)

```
User(id, clerkId, email, name, role, createdAt)
Category(id, name)
Course(id, title, description, imageUrl, price, isPublished, categoryId, instructorId)
Chapter(id, title, position, courseId)
Lesson(id, title, description, position, muxAssetId, muxPlaybackId, isFree, chapterId)
Purchase(id, userId, courseId, stripeChargeId, amount, createdAt)
Progress(id, userId, lessonId, isCompleted, updatedAt)
```

## 7. Non-Functional Requirements
- **Security:** secrets server-only; signed Mux playback; Stripe webhook signature
  verification; role checks on every mutating Server Action.
- **Performance:** RSC for catalog, cache course lists, lazy-load player.
- **Accessibility:** shadcn/ui defaults, keyboard nav, captions support via Mux.
- **Reliability:** idempotent webhook handlers.

## 8. Milestones

| Phase | Days | Output |
|-------|------|--------|
| 0 — Setup | 1 | Repo, Next.js 16, Tailwind/shadcn, Clerk, Neon+Prisma, Vercel deploy. |
| 1 — Core CRUD | 2–4 | Courses/chapters/lessons CRUD, categories, instructor UI. |
| 2 — Video | 2–3 | Mux upload, processing webhook, signed playback. |
| 3 — Payments | 2–3 | Stripe Checkout, webhook, enrollment, access gating. |
| 4 — Learning UX | 2 | Catalog, course/lesson pages, progress tracking. |
| 5 — Admin | 2 | Dashboard metrics, user & course management, charts. |
| 6 — Polish/Deploy | 1–2 | QA, responsive, seed data, README, live demo. |

## 9. Acceptance Criteria (definition of done)
- [ ] Course CRUD with categories, chapters, and lessons working end-to-end.
- [ ] Video upload + streaming functional and access-gated.
- [ ] Stripe purchase flow grants enrollment via verified webhook.
- [ ] Admin dashboard manages users and courses with live metrics.
- [ ] Deployed to a public Vercel URL; GitHub repo with README + setup steps.

## 10. Risks
- **Video pipeline** (upload→webhook→playback) is the hardest path — build first after CRUD.
- **Webhook testing** locally: use Stripe CLI + Mux test events; verify on a preview URL.
- **Secrets/role gaps** could leak paid content — gate every mutation and playback token.
