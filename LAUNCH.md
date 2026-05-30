# BodyForme — Pre-Launch Checklist

## 🔴 Blocking

### Content
- [x] Real phone number — (03) 9850 2221
- [ ] Opening hours — verify hours in `lib/content.ts` are correct

### Infrastructure
- [x] Custom domain purchased and configured in Vercel
- [x] DNS propagated — bodyforme.com.au pointing to Vercel (was still on Wix as of last check)
- [x] `NEXT_PUBLIC_SUPABASE_URL` set on Vercel
- [x] `SUPABASE_SECRET_KEY` set on Vercel
- [x] `JWT_SECRET` set on Vercel
- [x] `STRIPE_SECRET_KEY` set on Vercel (confirm it's the **live** key, not test)
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set on Vercel (confirm **live** key)
- [x] `STRIPE_WEBHOOK_SECRET` set on Vercel
- [x] `RESEND_API_KEY` set on Vercel
- [x] `ADMIN_CREDENTIALS` set on Vercel
- [x] `MIGRATE_SECRET` set on Vercel
- [x] `NEXT_PUBLIC_BASE_URL` set to `https://bodyforme.com.au`

### Database
- [x] Supabase tables created (members, services, sessions, bookings, memberships, waitlist)
- [x] Timetable seeded — 244 sessions across 12 weeks (21 classes/week)
- [ ] Mind Body member import — run `npx tsx scripts/import-members.ts "Members Report - as of 09-May-2026 (1).xlsx"` once Supabase keys are in `.env.local`

### Payments
- [x] Confirm Stripe keys are **live** ✓
- [x] Update Stripe webhook URL to `https://bodyforme.com.au/api/webhooks/stripe` once DNS is live
- [ ] BECS Direct Debit — submit request in Stripe Dashboard → Settings → Payment methods → BECS Direct Debit → Request access. Launch with cards in the meantime.

---

## 🟡 Important — fix before soft launch

### Testing
- [ ] Full sign-up → Stripe checkout → member app flow (end-to-end with real card)
- [ ] Booking confirmation email — book a class, confirm email arrives
- [ ] Waitlist email — fill a class, join waitlist, cancel booking, confirm promotion email fires
- [ ] Pause request email — submit pause, confirm both studio + member emails arrive
- [ ] Admin check-in — mark attendance, confirm it saves
- [ ] Stripe webhook — trigger test `invoice.payment_failed` from Stripe dashboard, confirm alert email fires

### Mobile
- [ ] iOS Safari — test member app at 390px, test PWA install flow
- [ ] Android Chrome — test PWA install flow

---

## 🟢 Nice-to-have

- [ ] Google Maps embed on contact page — confirm correct address pin
- [ ] Google review link — confirm correct Google Business Profile URL in re-engagement email template
- [ ] ClassPass — pending Wix App Market approval, not blocking
- [ ] Admin session management UI — add/edit/cancel sessions without touching DB directly
- [x] Forgot password flow — needed for Mind Body members on first login
- [ ] Instructor photos — deferred until post-reno

---

## ✅ Done

- [x] Vercel deployment — builds green, auto-deploys on push
- [x] All public pages — homepage, classes, memberships, free trial, about, contact, terms, sign-up
- [x] Member app — schedule, bookings, membership, profile, PWA install guide
- [x] Admin dashboard — schedule, clients, memberships, insights, marketing, settings, staff, check-in
- [x] Booking confirmation + cancellation emails (Resend)
- [x] Waitlist system with auto-promotion email
- [x] Membership pause self-service (sends email to studio)
- [x] Skeleton loading states
- [x] Profile attendance stats
- [x] Conversion funnel in Insights
- [x] Bulk client select + CSV export in admin
- [x] Real testimonials (Michelle, Tina, Annabel) — homepage cards + full stories on About page
- [x] Profile app links updated from old Wix URLs to `/contact`
- [x] `scripts/import-members.ts` — Mind Body xlsx → Supabase importer
- [x] `scripts/seed-schedule.ts` — CSV timetable → Supabase sessions
