# BodyForme Member App — Spec

## What it is

A Progressive Web App (PWA). Members open a link in Safari on their phone, tap **Share → Add to Home Screen**, and it appears as a full-screen app with the BodyForme icon. No App Store. No download. Works on iPhone and Android.

Live at: `bodyforme.com.au/app`

---

## Features (built)

### 1. Class schedule & booking
- Shows the live weekly timetable from the Supabase `sessions` table
- Member taps a class → sees: time, instructor, spots remaining, class type
- "Book" → creates a booking in the `bookings` table, sends confirmation email via Resend
- "Cancel" → cancels booking, frees the spot (triggers waitlist promotion if applicable)
- "Join waitlist" → added to `waitlist` table; auto-promoted and emailed when a spot opens

### 2. My membership
- Shows the member's current plan (e.g. "4 Per Week · Active") from Supabase `memberships` table
- For weekly BECS members: shows direct debit setup form (`MemberBecsForm.tsx`)
- Pause self-service — sends email to studio, admin handles manually
- If no active plan: prompt to visit Sign-up page

### 3. My bookings
- List of upcoming and past bookings from `bookings` table

### 4. Profile
- First name, last name, email (from `members` table)
- Attendance stats
- Log out
- Link to PWA install guide

### 5. Forgot/Reset password
- `/app/forgot-password` → sends reset link via Resend
- `/app/reset-password?token=...` → sets new password

---

## Authentication

Email + password. JWT stored in `bf_member` httpOnly cookie (7 days standard, 30 days with "Remember me").

- `lib/session.ts` — signs/verifies JWT, sets/clears cookie
- `app/app/login/` — login page with Remember me toggle
- `/api/auth/login` — validates credentials, issues cookie
- `/api/auth/logout` — clears cookie

Session data lives in the `members` table (password hash stored server-side).

---

## Tech approach

| Layer | How |
|-------|-----|
| Routes | `app/app/` in this Next.js repo — all member app pages live under `/app/*` |
| PWA shell | `app/app/layout.tsx` sets `display: standalone`, dark viewport, app-style nav |
| Manifest | `public/manifest.json` — app name, icons, theme colour, `start_url: /app` |
| Data | Supabase Postgres via `lib/db.ts` |
| Auth | JWT httpOnly cookie via `lib/session.ts` |
| Email | Resend via `lib/email.ts` |
| Payments | Stripe BECS via `MemberBecsForm.tsx` + `/api/admin/create-subscription` |

---

## Pages / routes

```
/app                    → redirect to /app/schedule if logged in, else /app/login
/app/login              → email + password + remember me
/app/schedule           → weekly timetable (default view / home tab)
/app/bookings           → upcoming + past bookings
/app/membership         → plan status + BECS setup
/app/profile            → name, email, stats, log out
/app/forgot-password    → request reset email
/app/reset-password     → set new password via token
/app/install            → PWA install instructions
```

Bottom navigation bar: Schedule · Bookings · Membership · Profile (4 tabs)

---

## iOS "Add to Home Screen" requirements checklist

- [x] `public/manifest.json` with `display: "standalone"`, correct icons
- [x] Icons at 192×192 and 512×512 (PNG, BodyForme logo)
- [x] `<meta name="apple-mobile-web-app-capable" content="yes">` in app layout
- [x] `<meta name="apple-mobile-web-app-status-bar-style">` set to `black-translucent`
- [x] `<link rel="apple-touch-icon">` pointing to 180×180 icon
- [x] HTTPS (Vercel provides this ✓)

---

## Pending / future

- Push notifications — Web Push API (iOS 16.4+ on home screen). Infrastructure not yet built.
- Admin: "Send push" from marketing page — not yet built.
