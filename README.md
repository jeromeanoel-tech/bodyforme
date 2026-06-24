# BodyForme Pilates Studio

Production website, PWA member app, and admin dashboard for BodyForme Pilates, 132 Ayr Street Doncaster VIC 3108.

Live at **bodyforme.com.au**

## Stack

- **Next.js 14** (App Router) — all code in this repo
- **Supabase Postgres** — `@supabase/supabase-js` for all DB queries
- **Stripe** — BECS Direct Debit + card payments
- **Resend** — transactional email
- **Vercel** — deployment (auto-deploys on push to `main`)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Required env vars are documented in `CLAUDE.md`.

## Project structure

```
app/
  (public)/         Public site — homepage, classes, memberships, about, contact
  app/              Member PWA — schedule, bookings, membership, profile
  admin/            Admin dashboard — schedule, clients, memberships, classes, etc.
  api/              API routes
lib/
  db.ts             All Supabase queries and type definitions
  email.ts          Resend email templates
  content.ts        Pricing plans, business content
  session.ts        Member JWT helpers
  adminSession.ts   Admin JWT helpers
scripts/
  import-members.ts Mind Body xlsx → Supabase importer
  seed-schedule.ts  CSV timetable → Supabase sessions
supabase/
  migrations/       DB schema migrations
```

## Full project docs

See `CLAUDE.md` for the complete project brief, stack details, working rules, and gotchas.
See `LAUNCH.md` for the pre-launch checklist.
