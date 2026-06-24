# BodyForme Pilates Studio — Project Brief

## Context
Pilates studio at 132 Ayr Street, Doncaster VIC 3108. Custom-built web platform. Active members, production build.

## Owner
Jerome. Australian developer, PM background, beginner coder. Solo. Plain English preferred. Australian English, AUD, metric. Always default to automation over manual.

## Stack
- **Framework**: Next.js 14 (App Router) + Tailwind — all code in this repo
- **Database**: Supabase Postgres — `@supabase/supabase-js` client only (no `postgres` pkg)
- **Auth**: JWT cookies — `bf_member` (7d/30d) + `bf_admin` (7d). `lib/session.ts` + `lib/adminSession.ts`
- **Payments**: Stripe — BECS Direct Debit (Australian bank accounts) + card. Live keys in production.
- **Email**: Resend — `lib/email.ts`. Domain `bodyforme.com.au` verified. 100 emails/day free tier.
- **Deployment**: Vercel — auto-deploys on push to `main`

## Environment variables (all set in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
JWT_SECRET
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
ADMIN_CREDENTIALS          # JSON array of { email, passwordHash, name, role }
NEXT_PUBLIC_BASE_URL       # https://bodyforme.com.au
STUDIO_EMAIL               # info@bodyforme.com.au
INTERNAL_EMAIL_KEY         # shared secret for /api/email/send
MIGRATE_SECRET             # one-time DB migration auth
MEMBER_PLACEHOLDER_PASSWORD
```

## Database tables
`members`, `services`, `sessions`, `bookings`, `memberships`, `schedule_template`, `waitlist`, `stripe_events`, `admin_password_resets`, `admin_password_overrides`

Schema defined in `lib/db.ts` → `initDb()`. Migrations in `supabase/migrations/`.

## What's built

### Public site (`app/`)
Homepage, Classes (template-based weekly view — not date-sensitive), Memberships, Free Trial, About, Contact, Terms, Sign-up

### Member app (`app/app/`) — PWA
Login (email + password), Schedule (book/cancel/waitlist), Bookings history, Membership (plan status + Stripe direct debit setup), Profile, Forgot/Reset password, PWA install guide

### Admin dashboard (`app/admin/`)
| Page | Status | Notes |
|------|--------|-------|
| Schedule | ✅ Built | Week view, fill rate, attendee drawer with inline instructor editing |
| Clients | ✅ Built | Full table, filters, drawer with Bookings / Membership / Notes tabs |
| Memberships | ✅ Built | Plan overview, expiry tracking, status tabs |
| Classes | ✅ Built | Weekly recurring template — edit once, propagates to all future sessions |
| Check In | ✅ Built | Search members, mark attendance |
| Marketing | ✅ Built | Broadcast email to segments, automations tab |
| Insights | ✅ Built | Analytics by month, plan breakdown, class performance |
| POS | ✅ Built | In-studio one-off payments only (Casual, 10/20/50 pack, 3/6/12 month) |
| Settings | ✅ Built | Admin preferences |
| Dashboard | 🔲 Stub | Today's counts, quick links |
| Staff | 🔲 Stub | Staff list |

### Key API routes
- `POST /api/admin/create-setup-link` — creates Stripe subscription (`send_invoice`), emails member the hosted invoice URL via Resend
- `POST /api/admin/cancel-subscription` — cancels all active Stripe subscriptions, marks member inactive
- `POST /api/admin/create-subscription` — creates BECS subscription after setup intent
- `POST /api/webhooks/stripe` — handles `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created/updated/deleted`, `setup_intent.succeeded`, `checkout.session.completed`
- `POST /api/admin/schedule-template` — CRUD for weekly class template with 12-week session propagation
- `POST /api/admin/broadcast` — batch email to member segments

### Key library files
- `lib/db.ts` — all Supabase queries, type definitions
- `lib/email.ts` — all Resend email templates (booking, welcome, payment, reset, etc.)
- `lib/content.ts` — pricing plans (`signupPlans`), plan key↔name mapping, business content
- `lib/session.ts` — member JWT cookie helpers
- `lib/adminSession.ts` — admin JWT cookie helpers

## Membership pricing (from `lib/content.ts`)
| Plan | Key | Price | Type |
|------|-----|-------|------|
| 3 Per Week | `weekly-3` | $45/wk | BECS recurring |
| 4 Per Week | `weekly-4` | $55/wk | BECS recurring |
| Unlimited Classes | `weekly-unlimited` | $62/wk | BECS recurring |
| Monthly Unlimited | `monthly-unlimited` | $239/mo | BECS recurring |
| 7-Day Unlimited | `intro-offer` | $49 | One-off (new members) |
| Casual Class | `casual` | $32 | Per session |
| 10 Class Pack | `10pack` | $280 | One-off |
| 20 Class Pack | `20pack` | $500 | One-off |
| 50 Class Pass | `50pack` | $999 | One-off |
| 3 Month Unlimited | `3month` | $669 | One-off |
| 6 Month Unlimited | `6month` | $1,199 | One-off |
| 1 Year Unlimited | `12month` | $2,199 | One-off |

**No Bronze or Silver plans — these do not exist.**

## Stripe subscription flow
1. Admin opens client drawer → Membership tab → picks plan → "Send to [email]"
2. API creates Stripe subscription with `collection_method: send_invoice` + `days_until_due: 7`
3. Stripe creates the invoice. API grabs `hosted_invoice_url` from `latest_invoice`.
4. Resend emails the client a branded email with "Pay my invoice" CTA linking to `invoice.stripe.com`
5. Client opens Stripe-hosted page → enters BSB/account (BECS) or card → pays
6. `invoice.paid` webhook fires → switches subscription to `charge_automatically` → future bills are silent auto-debits

## Design tokens
Espresso `#2a1506` · Brown `#7a4a2a` · Linen `#f4ede1` · Muted `#a08568` · Rule `#d8ccba` · Canvas `#fdfaf6`
Cormorant Garamond (headings) · DM Sans (body)

## Working rules
1. **Australian English, AUD, metric** throughout.
2. **Automation over manual** — webhooks, scripts, API calls before manual steps.
3. **Plain English** — no jargon. Short analogies welcome.
4. **Never hardcode secrets** — always `process.env.X`. Never commit `.env`.
5. **Mobile-first** — test public pages, member app, AND admin dashboard at 390px. Admin is fully mobile-optimised.
6. **Commit and push every change automatically** — no confirmation needed.
7. **Read files before editing** — don't rely on memory of what's there.
8. **Lazy Stripe import** — `const { default: Stripe } = await import('stripe')` inside handlers. Module-level import crashes Next.js build.
9. **Supabase JS client only** — `supabase.from(...)` or `getSupabase().from(...)`. No raw SQL tagged templates, no `postgres` pkg.

## Known gotchas
- **`\n` in env vars** — Vercel CLI sometimes injects trailing `\n`. Apply `.replace(/\\n|\n/g, '').trim()` to sensitive env vars (JWT secret, Stripe key, base URL).
- **Melbourne timezone** — sessions stored as naive Melbourne time in UTC. Use `getUTCDay()`, `getUTCHours()` when processing times. Use `Intl.DateTimeFormat` with `timeZone: 'Australia/Melbourne'` when displaying.
- **Lazy Stripe import** — see rule 8 above. Use `apiVersion: '2024-04-10' as never` in the constructor.
- **`planOverride` stores human-readable name** — "3 Per Week", not "weekly-3". Use `signupPlans[planKey].name` to resolve.
- **`invoice.paid` fires 2–3 days after BECS debit** — for immediate DB updates on subscription creation, use `customer.subscription.created` (fires instantly).
- **Stripe subscriptions API `price_data`** — requires `product: existingProductId`, NOT inline `product_data`. Find or create the product first.
- **Resend batch response** — shape is `{ data: [{ id }] }`, not a top-level array.
- **`ADMIN_CREDENTIALS` JSON** — must be valid JSON with no trailing whitespace. Parsing errors silently return no admins.
- **Session `service_id` must match title** — the schedule display uses `scheduleToName[session.service_id]`, NOT the session title. If a session is renamed without updating `service_id`, the old service name shows (bracket details like "(Core)" disappear). Run `scripts/fix-service-ids.ts` or use `scripts/resync-schedule.ts` (which now updates service_id automatically).
- **POS allowlist** — `/api/admin/pos/products/route.ts` has a hardcoded `ALLOWED_PLAN_NAMES` set. Adding a new POS product requires both creating it in Stripe with `pos: true` metadata AND adding its `planName` to the allowlist.
- **"New" badge on clients** — defaults to 3 days (72h). Configurable in admin Settings (`newMemberDays`).
- **Public classes page** — uses `schedule_template` table directly, not live sessions. No date sensitivity. Update `getScheduleTemplate()` in `lib/db.ts` if schema changes.

## What NOT to do
- Don't use Wix — this project has no dependency on Wix whatsoever.
- Don't use the `postgres` npm package — Supabase JS client only.
- Don't add module-level Stripe imports.
- Don't hardcode API keys or secrets anywhere.
