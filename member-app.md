# BodyForme Member App — Spec

## What it is

A Progressive Web App (PWA). Members open a link in Safari on their phone, tap **Share → Add to Home Screen**, and it appears as a full-screen app with the BodyForme icon. No App Store. No download. Works on iPhone and Android.

Live at: `bodyforme.vercel.app/app` (or a custom subdomain like `app.bodyforme.com.au` once the domain is live).

---

## Features

### 1. Class schedule & booking
- Shows the live weekly timetable pulled from Wix Bookings (same data as the public classes page)
- Member taps a class → sees: time, instructor, spots remaining, class type
- "Book" button deep-links to the Wix Bookings page for that specific session (Wix handles the actual booking — no rebuild needed)
- Timetable refreshes every 5 minutes

### 2. My membership
- Shows the member's current plan (e.g. "4 Per Week · Active")
- Billing date and amount
- "Manage payment / cancel" → opens **Stripe Customer Portal** (Stripe hosts this, handles card updates, cancellations, invoice history)
- If membership is expired or no plan: prompt to sign up → `/sign-up`

### 3. Push notifications
Sent via **Web Push API** (browser push, works on iPhone iOS 16.4+ added to home screen):
- **Membership expiring soon** — 7 days before end date, auto-triggered
- **Payment failed** — triggered by existing `invoice.payment_failed` Stripe webhook
- **Promotions** — sent manually from admin marketing page (new button: "Send push notification")
- **New class added** — optional, triggered when a new Wix session is created

### 4. Profile
- First name, last name, email (read from sign-up data)
- Log out

---

## Authentication

Simple **email magic link** (no password):
1. Member enters email address
2. App sends a 6-digit OTP code via Resend
3. Member enters code → authenticated
4. Session stored in a secure cookie (7-day expiry, httpOnly)

No Supabase. No third-party auth service. Session data stored in **Wix Collections** (member profile linked to their Wix contact ID).

Alternative if Wix Collections proves awkward: encrypted JWT in a cookie, no database needed for auth.

---

## Tech approach

| Layer | How |
|-------|-----|
| Routes | `app/app/` in this Next.js repo — all member app pages live under `/app/*` |
| PWA shell | `app/app/layout.tsx` sets `display: standalone`, dark viewport, app-style nav |
| Manifest | `public/manifest.json` — app name, icons, theme colour (`#1a1a1a`), `start_url: /app` |
| Service worker | `public/sw.js` — handles push notification subscriptions |
| Push notifications | Web Push API — server sends via `web-push` npm package, subscription stored in Wix Collections |
| Booking | Deep-link to Wix Bookings URL for each session (not rebuilt) |
| Membership data | Wix Pricing Plans API (same as admin memberships page) |
| Payment management | Stripe Customer Portal (Stripe-hosted, zero dev work) |
| Email OTP | Resend — new template `otp` added to `/api/email/send` |
| Session auth | `iron-session` or a signed JWT in a httpOnly cookie |

---

## Pages / routes

```
/app                  → redirect to /app/schedule if logged in, else /app/login
/app/login            → email entry + OTP verify
/app/schedule         → weekly timetable (default view / home tab)
/app/membership       → plan status + Stripe portal link
/app/profile          → name, email, log out
```

Bottom navigation bar: Schedule · Membership · Profile (3 tabs)

---

## Push notification flow

1. On first login, app asks permission for push notifications
2. Browser generates a push subscription (endpoint + keys)
3. Subscription saved to Wix Collections `MemberPushSubscriptions` (contactId, subscription JSON, createdDate)
4. To send a push: Next.js API route `/api/push/send` calls `web-push` library with payload
5. Triggers:
   - Stripe webhook fires `invoice.payment_failed` → send push + email
   - Cron job (Vercel Cron, daily at 9am) → check memberships expiring in 7 days → send push
   - Admin marketing page → "Send push" button → calls `/api/push/send` with segment

---

## Admin additions needed

- Marketing page: add "Send push notification" tab alongside broadcast email
- New API route: `POST /api/push/send` — accepts `{ segment, title, body, url }`
- New API route: `POST /api/push/subscribe` — saves push subscription from member app
- New API route: `POST /api/auth/send-otp` — sends OTP email
- New API route: `POST /api/auth/verify-otp` — checks OTP, sets session cookie

---

## iOS "Add to Home Screen" requirements checklist

- [ ] `public/manifest.json` with `display: "standalone"`, correct icons
- [ ] Icons at 192×192 and 512×512 (PNG, BodyForme logo)
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">` in app layout
- [ ] `<meta name="apple-mobile-web-app-status-bar-style">` set to `black-translucent`
- [ ] `<link rel="apple-touch-icon">` pointing to 180×180 icon
- [ ] HTTPS (Vercel provides this ✓)
- [ ] Push notifications on iOS require iOS 16.4+ AND the app must be added to home screen first

---

## Designs

Designs provided by owner via Claude Design. Import and implement once shared.
Design file location: TBC — owner to share Figma URL or Claude Design link.

---

## Build order

1. PWA shell + manifest + login (OTP auth)
2. Schedule tab (read-only timetable + Wix deep-link booking)
3. Membership tab (plan status + Stripe portal)
4. Profile tab + log out
5. Push notification infrastructure (subscribe, store, send)
6. Admin: push send from marketing page
7. Cron job for expiry alerts
8. Icons + splash screens + full iOS PWA polish

---

## Open questions

- Will members have a Stripe Customer ID? (Yes — created when they sign up via `/sign-up` flow)
- Stripe Customer Portal needs to be enabled in the Stripe dashboard (Settings → Customer Portal)
- Wix Collections: confirm `MemberPushSubscriptions` collection can be created and written via REST API
- Custom domain `app.bodyforme.com.au` vs path `/app` — decide before launch
