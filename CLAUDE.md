# Doncaster Pilates Studio — Project Brief

## Project context
Building a website + booking system for a Pilates studio in Doncaster, Melbourne (Australia). The studio is migrating from Mind Body to Wix. Client is a real business with active members; this is a production build, not a prototype.

## Owner
Australian-based developer (beginner coder, project manager background). Working solo. Tight 7-day timeline, fixed budget. Plain English explanations preferred. Australian English, AUD, metric. Always default to automation over manual workflows.

## Stack (final, verified)
- **Platform**: Wix Studio (Business plan, paid)
- **Booking engine**: Wix Bookings (native)
- **Memberships/packs**: Wix Pricing Plans (native, integrated with Bookings)
- **Payments**: Stripe (Wix Payments not available in Australia). BECS Direct Debit applied for, recurring memberships use it.
- **ClassPass**: Official Wix App Market integration. Submitted to ClassPass partner support for approval (5–10 business day clock).
- **Database**: Wix Collections (native). NOT Supabase. Earlier plan included Supabase — dropped. Wix Bookings already stores everything needed.
- **Frontend hosting**: Wix Studio (NOT Wix Headless / NOT Next.js). Headless was considered and rejected due to ClassPass uncertainty + timeline.
- **Code workflow**: GitHub-synced repo. Wix editor is read-only. ALL code changes happen via Claude Code locally and push to GitHub. Wix syncs from default branch.
- **Email**: Resend (free tier, 3,000/mo). Sending domain verified.
- **Custom logic**: Velo (Wix's JS layer)
- **MCP**: Wix MCP server connected to Claude Code. Use it before web search for Wix-specific questions.

## What the client wants

### Public site (5–6 pages)
- Homepage: hero, social proof, "Book Free Trial" CTA, classes preview, membership CTA
- Classes page: schedule widget + class type descriptions
- Memberships page: pricing comparison (2–3 tiers, recommended highlight)
- Free trial landing page: single CTA, what to expect, location, parking
- About page: studio story, instructor bios (real photos coming post-renovation)
- Contact page: form, embedded Google Map, hours

Optimised for mobile (app-style feel). Stock images initially with consistent colour grading; real photos swap in post-reno.

### Admin dashboard (locked to Staff member role)
- **Class Schedule** view: each class shows attendance count (e.g. "19/25"), click to see attendee list. Filter by date (Day/Week/Month), class type, instructor.
- **Customer Profiles**: table with search, filters, "+ New Customer" button. Customer details from website bookings populate automatically (this is native Wix Bookings behaviour, no custom code needed for population).
- **Reports**: visual data — website views, membership sales, class attendance, financial. Date range toggle (7/30/90 days, all time). Build only what Wix's native analytics doesn't already cover; lean on Wix's built-in reports first.
- **Custom view bridging Wix Pricing Plans + Stripe**: shows membership status with payment health (last successful debit, failed payment retry status) so the studio doesn't have to bounce between two dashboards.

### Email automation (via Wix Automations → Velo HTTP function → Resend)
- Trigger: First class attended +7 days → Google review request (one-time per customer)
- Trigger: No bookings in 30 days → re-engagement template
- Trigger: No bookings in 90 days → re-engagement template
- (Skip 7-day inactive trigger initially — too noisy, captures people on holiday)

## Pricing structure (configured in Wix Pricing Plans, attached to Bookings services)
- Casual drop-in: ~$35 (set on the service itself)
- 5-class pack: ~$160, expires 2 months (One-time payment, Limited sessions = 5)
- 10-class pack: ~$300, expires 3 months (One-time payment, Limited sessions = 10)
- Bronze: 4 classes/month, $120/mo (Recurring monthly, Limited sessions = 4)
- Silver: 8 classes/month, $200/mo (Recurring monthly, Limited sessions = 8) — visually recommended tier
- Unlimited: $260/mo (Recurring monthly, Unlimited sessions)
- Free trial: $0 service, max 1 booking per customer

**IMPORTANT** about Pricing Plans:
- Build Booking Services FIRST, then create Pricing Plans from inside each service (Booking Services → service → Price & Payment → Pricing Plans → Create New Plan). The session-limit options only appear via this path, not via the standalone Pricing Plans dashboard.
- Sessions don't roll over between billing cycles (Wix limitation). Group bookings deduct one session per attendee.
- Once a plan has active subscribers, you can't change its payment type. Cancel + recreate.

## Build sequence (in order)

### Phase 1: Foundation [DONE per user]
- Wix Studio Business plan purchased
- Stripe connected, BECS approval applied for
- ClassPass app installed, partner integration request submitted
- Resend account created, domain verified
- GitHub connected to Wix Studio (Wix editor now read-only, code via Claude Code only)
- Mind Body data export obtained from client
- Wix Bookings configured: services, staff, recurring sessions, pricing plans (recurring + one-time), free trial service
- Staff member role created in Wix Members. User assigned to it.
- "Admin - Schedule" page created in Wix Studio editor:
  - Hidden from menu
  - Search engine indexing disabled
  - Permissions: Site Members → Specific members → Members with roles → Staff
  - Layout: No header & footer
  - Currently blank, needs Custom Element

### Phase 2: Admin pages [CURRENT — start here]

Build order:
1. **Admin - Schedule** page (Class Schedule view) — already created, needs Custom Element + Velo code
2. **Admin - Customers** page (customer table)
3. **Admin - Memberships** page (Wix Pricing Plans + Stripe payment health combined view)
4. **Admin - Reports** page (only what Wix native analytics doesn't cover)

For each admin page, use this pattern:
- Page is created in Wix Studio editor (already done for Schedule, repeat the steps for the others)
- Drop ONE Custom Element on the page, set it to fill the page
- Custom Element points to a Velo file under `src/public/custom-elements/`
- Web Component (the Custom Element file) renders the entire UI — sidebar, table, filters, modals, etc.
- Velo backend functions (`src/backend/`) query Wix Bookings, Pricing Plans, Members, Stripe via SDK
- Page-level Velo code passes data into the Custom Element via attributes
- Custom Element communicates back via custom events

Constraints to remember:
- Custom Elements render in a sandboxed iFrame. No access to cookies, localStorage, or IndexedDB inside the element. State management via attributes + custom events only.
- Tag names must be at least two words separated by dash (e.g. `admin-schedule`, `admin-customers`).
- Velo file lives in `src/public/custom-elements/` directory.
- For sensitive data (Stripe keys, Resend API key), use Wix Secrets Manager. Never hardcode.

### Phase 3: Public pages
Use Wix Studio's native elements (drag-and-drop) for these — NOT Custom Elements. Reasons:
- Wix's responsive design system handles mobile breakpoints natively
- Visual design iteration is faster in Wix's editor than via code prompts
- These pages don't need pixel-perfect bespoke design
- Faster to ship

Embed the native Wix Bookings widget for the schedule. Use Wix's Pricing Plans display widget for the memberships page.

### Phase 4: Email automation
- Build three Resend templates: Google review request, 30-day re-engagement, 90-day re-engagement
- Velo HTTP function (`src/backend/http-functions.js`) accepts customer email + template ID + variables, POSTs to Resend
- Wix Automations → triggers (session attended +7 days, no bookings 30/90 days) → "Send Webhook" action → points to Velo HTTP function URL
- Stripe webhook → Velo HTTP function for failed payment alerts (`invoice.payment_failed`, `customer.subscription.deleted`)

### Phase 5: Migration & launch
- Import Mind Body customer CSV via Wix Contacts
- Test every flow: free trial booking, paid drop-in, membership purchase, recurring debit, ClassPass booking (only after ClassPass approves)
- Custom domain → DNS → publish
- Final client sign-off

## Design references
The user has created Claude design mockups for the admin Class Schedule view. Visual style:
- Warm earthy palette (browns, cream, soft accents — NOT Mind Body green)
- Clean typography
- Sidebar nav: Dashboard, Classes, Courses, Rooms, Check In, Clients, Point of Sale, Insights, Marketing, Services & Products, Staff, Settings
- Header: search bar, notification bell, profile avatar
- Class rows: time, "Sign In (X/25)", class name with coloured pill icon, instructor checkbox + name, three-dot menu

Match the palette and information hierarchy from these mockups when building admin pages.

## Working rules

1. **Always check Wix docs via the Wix MCP server before assuming API behaviour.** The user has explicitly asked for verification over guessing. If MCP is unavailable for a query, web search official Wix docs.

2. **Use prior conversation/repo context before asking the user to repeat info.** The user has limited patience for repeated questions.

3. **Plain English, short analogies, no jargon unless asked.** User is a beginner coder.

4. **One terminal command at a time** when giving CLI instructions. Wait for confirmation before next.

5. **Australian English, AUD, metric.**

6. **Default to automation over manual workflows.** If something can be triggered by a webhook or automation, prefer that over manual admin steps.

7. **When in doubt about a Wix-specific detail, use the Wix MCP first.** Don't guess.

## Known gotchas (verified)
- Wix Studio editor is read-only after GitHub connection. All code via Claude Code.
- Custom Elements run in sandboxed iFrame — no browser storage APIs. Pass data via attributes.
- Pricing Plan session limits ONLY appear when creating from inside a Booking Service. Always create plans from this path.
- BECS Direct Debit needs Stripe approval (5–10 business days). Apply early.
- ClassPass partner integration approval is 5–10 business days. Submitted already.
- Wix Pricing Plans doesn't roll over unused sessions. Workaround needs custom Velo logic if required.
- Wix's "My Subscriptions" page lets customers self-cancel — only if "Allow customers to cancel" is toggled on each plan.
- Wix Bookings session capacity reads as `totalCapacity` and `remainingCapacity`. Display "X/Y" as `(totalCapacity - remainingCapacity)/totalCapacity`.
- The official Wix Bookings ClassPass connector has a 1.6/5 rating on Wix App Market. Functional but rough — flag any odd ClassPass behaviour to user.

## What NOT to do
- Don't suggest Supabase, Next.js, or Wix Headless — these were ruled out for this build.
- Don't write code in the Wix IDE — only via Claude Code through GitHub.
- Don't hardcode API keys — use Wix Secrets Manager.
- Don't reproduce Mind Body's exact UI for the admin (the user designed a warmer custom version).
- Don't suggest reproducing copyrighted Mind Body templates or branding.
- Don't add 7-day inactive email automation initially.
- Don't build from-scratch booking UI when Wix Bookings widgets work fine — only customise where genuinely needed.
- Don't begin work without verifying the current state via Wix MCP.

## First action
Before writing any code, run via the Wix MCP:
1. List the connected Wix site's available business solutions (confirm Bookings + Pricing Plans + Members are installed).
2. Query existing Booking Services to confirm what the user has already set up.
3. Query existing Pricing Plans to confirm the membership/pack structure matches the brief.
4. Query the Members collection to confirm the Staff role exists and the user is assigned.
5. Confirm the "Admin - Schedule" page exists, is hidden, and has Staff-only permissions.

Report findings before suggesting next steps. If anything is missing, list it for the user to fix in the Wix dashboard before code work begins.

Then build the Class Schedule admin page first (Phase 2 step 1), following the Custom Element pattern described above.
