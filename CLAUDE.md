# BodyForme Pilates Studio — Project Brief

## Context
Pilates studio in Doncaster, Melbourne. Migrating from Mind Body to Wix. Active members, production build.

## Owner
Australian developer, PM background, beginner coder. Solo. Plain English preferred. Australian English, AUD, metric. Always default to automation over manual.

## Stack (current, in use)
- **Admin dashboard**: Next.js (App Router) + Tailwind — built in this repo under `app/admin/`
- **Public site**: Next.js pages — to be built in this repo under `app/` (public-facing routes)
- **Deployment**: Vercel — env vars `WIX_API_KEY` and `WIX_SITE_ID` required
- **Booking engine**: Wix Bookings (customers book through Wix; we read data via Wix REST API)
- **Memberships**: Wix Pricing Plans (read via Wix REST API)
- **Payments**: Stripe — BECS Direct Debit applied for; recurring memberships use it
- **ClassPass**: Wix App Market integration — partner approval submitted (5–10 business days)
- **Email**: Resend (free tier, 3,000/mo). Sending domain verified. Emails sent via Next.js API routes calling Resend directly.
- **Wix REST API layer**: `lib/wix.ts` — all Wix data fetching goes here

## What's built

### Admin (`app/admin/`)
- Layout with sidebar nav + header
- `/admin/schedule` — week view, session rows with fill rate, attendee drawer
- `/admin/clients` — full client table, filters, column picker, client drawer with bookings/memberships/notes tabs
- `/admin/memberships` — membership table, status tabs, expiry tracking, plan breakdown, detail drawer
- `/admin/insights` — analytics: new clients/orders by month, plan breakdown, class performance table
- `/admin/settings` — admin preferences (new member days, expiry threshold, fill rate warning, show cancelled classes)
- `/admin` (dashboard), `/admin/checkin`, `/admin/staff` — stubs, not yet built

### API routes (`app/api/admin/`)
- `/api/admin/session-bookings` — bookings for a given session (used by schedule attendee drawer)
- `/api/admin/contact-bookings` — booking history for a given contact (used by client drawer)

### Wix API functions (`lib/wix.ts`)
- `getStaff`, `getServices`, `getSessions`, `getMemberships`, `getContacts`, `getContactBookings`, `getSessionBookings`

## What's next (build order)

### 1. Vercel deployment
- Add `WIX_API_KEY` and `WIX_SITE_ID` to Vercel env vars
- Deploy — this is blocking real testing

### 2. Admin stubs
- **Dashboard** (`/admin`) — today's class count, active members, recent signups; quick-action links
- **Check In** (`/admin/checkin`) — search clients by name, mark attendance against today's sessions
- **Staff** (`/admin/staff`) — staff list from Wix, read-only for now

### 3. Public site (`app/`)
Pages to build (Next.js, mobile-first, Tailwind):
- **Homepage** — hero, "Book Free Trial" CTA, classes preview, membership CTA, social proof
- **Classes** — live schedule pulled from Wix (read-only display), class type descriptions
- **Memberships** — pricing comparison table (Bronze/Silver/Unlimited + packs), recommended highlight on Silver
- **Free Trial** — single CTA, what to expect, location + parking
- **About** — studio story, instructor bios (placeholder images until post-reno photos)
- **Contact** — contact form (Resend), embedded Google Map, hours

For booking CTAs: link to the Wix Bookings booking URL (don't rebuild the booking flow — Wix handles it).

### 4. Email automation (Next.js API routes + Resend + Wix webhooks)
- Three Resend templates: Google review request, 30-day re-engagement, 90-day re-engagement
- Next.js API route at `/api/email/send` accepts `{ to, template, vars }` → POSTs to Resend
- Wix webhook (Automation → Send Webhook) fires on: first session attended +7 days, no bookings 30 days, no bookings 90 days
- Stripe webhook → `/api/webhooks/stripe` for `invoice.payment_failed` alerts
- Skip 7-day inactive trigger (too noisy)

### 5. Migration & launch
- Import Mind Body CSV via Wix Contacts (manual — Wix dashboard)
- Test all booking flows: free trial, drop-in, membership purchase, recurring debit
- ClassPass test booking (only after approval confirmed)
- Custom domain → DNS → publish

## Pricing structure (reference)
| Plan | Price | Type |
|------|-------|------|
| Casual drop-in | ~$35 | Per session |
| 5-class pack | ~$160, 2-month expiry | One-time |
| 10-class pack | ~$300, 3-month expiry | One-time |
| Bronze | $120/mo, 4 classes | Recurring |
| Silver ★ | $200/mo, 8 classes | Recurring |
| Unlimited | $260/mo | Recurring |
| Free trial | $0 | One-time, max 1 per customer |

Sessions don't roll over. ClassPass uses the Wix connector.

## Working rules
1. **Australian English, AUD, metric** throughout.
2. **Automation over manual** — if it can be a webhook, API call, or script, do that instead of manual steps.
3. **Plain English** — no jargon unless asked. Short analogies welcome.
4. **Wix MCP first** for any Wix API questions. Web search if MCP can't answer.
5. **Never hardcode secrets** — use Vercel env vars (`process.env.X`). Never commit `.env`.
6. **Mobile-first** on public pages — test at 390px width.

## Known gotchas
- Wix session capacity: `totalCapacity` and `remainingCapacity` — display as `(totalCapacity - remainingCapacity)/totalCapacity`.
- Wix Pricing Plans session limits only appear when creating a plan from inside a Booking Service (not the standalone Plans dashboard).
- Once a plan has active subscribers, payment type can't be changed — cancel + recreate.
- ClassPass connector rated 1.6/5 on Wix App Market — functional but rough. Flag odd behaviour.
- BECS Direct Debit still pending Stripe approval — test with card payments until approved.
- Wix "My Subscriptions" self-cancel only works if toggled on per plan.
- Resend free tier: 3,000 emails/mo, 100/day. Don't batch-send to all contacts at once.

## What NOT to do
- Don't rebuild the Wix booking flow — link to Wix's booking URL instead.
- Don't reproduce Mind Body's UI or branding.
- Don't add the 7-day inactive email trigger (too noisy, revisit later).
- Don't hardcode API keys anywhere.
- Don't use Wix Velo / Custom Elements — all code lives in this Next.js repo.
