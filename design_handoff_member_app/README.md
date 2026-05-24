# Handoff: Bodyforme Member App (iOS)

## Overview
Native-feeling iOS member app for **Bodyforme**, a premium Bikram & Pilates studio in Collingwood, Melbourne. Members use the app to browse the schedule, book/cancel classes, manage their membership and payment methods, and track their attendance streak.

The design comprises **9 screens** across 4 tabs (Schedule · Bookings · Membership · Profile), plus a Schedule variant for A/B comparison.

## About the Design Files
The files in this bundle are **design references created in HTML** — high-fidelity prototypes built with React + inline JSX inside a single HTML host, scaled into a 402×874 iOS frame (iPhone 15 Pro / 16 logical viewport). They show intended look and behaviour; **they are not production code to ship**.

Your job: **recreate these screens in the target codebase's environment** — most likely SwiftUI for a native iOS app, or React Native / Expo if a cross-platform stack is in use — using the codebase's established patterns, navigation primitives and component library. If no app environment exists yet, choose the most appropriate framework (SwiftUI is the default recommendation for a native experience) and implement there.

The HTML/JSX is faithful pixel-for-pixel reference for layout, type, colour and spacing; it is **not** a structural template for component decomposition in your target framework.

## Fidelity
**High-fidelity.** All colours, typography, spacing, borders and copy are final. The mocks were built from the same Bodyforme design system used on the marketing site (see `../design_handoff_bodyforme/README.md` if available). Recreate pixel-perfectly.

---

## Files

| File | Description |
|---|---|
| `Bodyforme Member App.html` | Host page — boots React + Babel, renders all 9 screens inside a `DesignCanvas` of 402×874 iOS frames |
| `app/ios-frame.jsx` | iOS 26 device frame primitives (`IOSDevice`, status bar, glass pills, keyboard). **Reference only — replace with your platform's native chrome.** |
| `app/design-canvas.jsx` | Pan/zoom canvas wrapper used to lay out artboards side-by-side. **Not part of the app — it is the presentation surface.** |
| `app/screens.jsx` | Shared design tokens (`window.BFP`) + shared atoms (`Lbl`, `H1`, `Body`, `Brand`, `StatusBar`, `TabBar`, `AppHeader`, `CTA`, `ClassDot`, `Rule`) |
| `app/screen-schedule.jsx` | **Schedule A** — day-pill list (default direction) |
| `app/screen-schedule-b.jsx` | **Schedule B** — agenda card stack variant |
| `app/screen-book.jsx` | Class detail / booking screen |
| `app/screen-cancel.jsx` | Cancel-booking bottom sheet |
| `app/screen-bookings.jsx` | My Bookings (upcoming + past) |
| `app/screen-membership.jsx` | Membership home (current plan + manage) |
| `app/screen-change-plan.jsx` | Change plan (3 plan cards + billing toggle) |
| `app/screen-payment.jsx` | Payment methods (Stripe) |
| `app/screen-profile.jsx` | Profile + account settings |

To preview: open `Bodyforme Member App.html` in a browser. Use the canvas pan/zoom or click any artboard to focus.

---

## Design System

### Frame
- **Device:** iPhone 15 Pro logical viewport — **402 × 874 pt**
- **Corner radius (device):** 48 — handled by your platform; do not mimic in views
- **Status bar:** 50pt tall, custom (we render our own; on device, use the system bar)
- **Home indicator zone:** ~34pt safe-area at bottom — tab bar adds 28pt internal bottom padding
- **Tab bar:** absolute-positioned, `padding: 10px 0 28px`, top border `1px var(--rule)`

### Colour Tokens (`window.BFP`)
```
linen     #f4ede1   App background (default)
l2        #ede4d4   Hover tints, secondary surface, booked-row tint
l3        #e4d8c6   Avatar bg, deeper linen
esp       #2a1506   Espresso — primary dark surface, dark CTA, sheet backdrop
esp2      #3d2210   Hover espresso
brown     #7a4a2a   Primary accent — links, active tab text, italic em
blt       #a0724e   Light accent — "Most popular" badge
sand      #c4a882   Sand — em on dark backgrounds
text      #2a1506   Primary text (== esp)
mid       #6b4e36   Body copy, secondary text
muted     #a08568   Tertiary text, labels, placeholders
rule      #d8ccba   All borders, hairlines, dividers
ruleD     rgba(255,255,255,0.10)   Borders on dark surfaces
canvas    #fdfaf6   Card / surface white
rust      #9a5a3a   Bikram dot, low-spots warning, danger
sage      #7a9478   Pilates dot, success
blue      #8a9ab0   Sculpt dot
amber     #b0906a   Special dot
```
SwiftUI: declare as a `Color` extension or asset catalog set; React Native: a `tokens.ts` export.

### Typography
Two Google fonts. iOS: ship the TTFs in the app bundle and register in Info.plist.

```
Display:  Cormorant Garamond     weights 300, 400, 500 — italic variants used heavily
Body/UI:  DM Sans                weights 300, 400, 500
Fallback: -apple-system, system-ui (display falls back to Times New Roman)
```

#### Type Scale
| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Hero numeral (Today, Profile streak) | Cormorant | 64 / 44 | 400 | line-height 1 |
| Screen title (`AppHeader`) | Cormorant | 22 | 500 | italic |
| Plan price | Cormorant | 44 / 38 / 30 | 300–400 | italic on dark featured cards |
| H1 body (e.g. "Cancel Bikram 90…") | Cormorant | 26 | 400 | italic em in `--brown` |
| Class name | Cormorant | 19–22 | 400 | italic |
| Avatar initials | Cormorant | 32 | 400 | italic, in `--brown` |
| Detail label `Lbl` | DM Sans | 9.5 | 500 | 0.18em tracking, uppercase, `--muted` |
| Tab bar label | DM Sans | 9 | 500 | 0.14em, uppercase |
| CTA button | DM Sans | 11 | 500 | 0.14em, uppercase |
| Body row title | DM Sans | 13 | 400–500 | line-height 1.55 |
| Body copy | DM Sans | 13 | 300 | line-height 1.55 |
| Secondary / sub | DM Sans | 11–12 | 300 | |
| Micro (badges, time abbrev) | DM Sans | 8.5–10 | 500 | 0.14–0.20em, uppercase |

Tracking convention: ALL uppercase labels carry letter-spacing between 0.14em and 0.20em — never UPPERCASE without tracking.

### Spacing
- Screen edge padding: **20pt** (most screens), 24pt for editorial / hero areas
- Section vertical rhythm: 18pt between sections, 14pt between rows inside a card
- Card padding: 18pt × 20pt (compact rows) / 22pt × 22pt (plan cards) / 28pt × 24pt (featured dark plan)
- Grid gaps: 1pt where hairline dividers between cells (`background: --rule` trick)
- Sticky CTA footer: `padding: 16px 20px 32px` (the 32pt bottom clears the home indicator)

### Borders, Radius, Shadow
- All borders: `1px solid var(--rule)` on light, `1px solid rgba(255,255,255,0.10)` on dark
- **Most surfaces have `border-radius: 0`** — sharp corners are intentional. Exceptions:
  - Bottom sheet (`screen-cancel`): `border-radius: 20px 20px 0 0`
  - Avatar circles, day-pill highlights: `border-radius: 4px` for pills, `50%` for avatars
  - CTA button: `border-radius: 4px`
  - Drag handle: `border-radius: 2px`
- **No drop shadows on surfaces.** Depth is conveyed through colour contrast (canvas vs linen vs espresso).

---

## Navigation Architecture

```
Root: Tab bar (4 tabs, persistent across primary screens)

  📅 Schedule  ─── ScheduleScreen (or variant B)
                    └─ tap class → BookScreen (push or sheet)
                                    └─ Confirm → returns to Schedule, row marked "Booked"

  🔖 Bookings  ─── BookingsScreen
                    ├─ tap upcoming → BookScreen in "manage" mode
                    │                  └─ Cancel → CancelBookingScreen (bottom sheet)
                    └─ tap past → read-only detail

  🪪 Membership ── MembershipScreen
                    ├─ Change plan → ChangePlanScreen (push)
                    ├─ Pause membership → confirmation sheet (TODO — not designed)
                    ├─ Cancel membership → confirmation flow (TODO)
                    ├─ Payment methods → PaymentMethodsScreen (push)
                    └─ Invoices & receipts → list (TODO)

  👤 Profile     ── ProfileScreen
                    └─ each row pushes a settings detail (TODO — not designed)
```

The four tab IDs (`schedule | bookings | membership | profile`) are fixed in `TabBar`. Active state changes the icon + label colour to `--brown` on light backgrounds, `--sand` on dark.

---

## Screens

> **Coordinate convention:** all positions/sizes below are in 402-wide CSS px, equivalent to iPhone 15 Pro pt. Translate 1:1 to SwiftUI / React Native.

### 1. Schedule A — Day-pill list  (`screen-schedule.jsx`) — DEFAULT
**Purpose:** Member browses the week's classes by day, sees which are booked / full / low on spots, taps to book.

**Layout (top → bottom):**
1. **Status bar** (50pt)
2. **AppHeader** — Brand wordmark left, screen title "Schedule" centre (italic Cormorant 22), search icon right (1.4-stroke magnifier, 18×18). Background `--linen`, bottom border `--rule`.
3. **Week intro** (`padding: 20 20 12`) — left: tiny `Week of` label + Cormorant 26 "*March* 4–10" with `March` as italic em in `--brown`. Right: filter trigger "All ↓" in DM Sans 10 uppercase `--brown`.
4. **Day pills** — flex row, 7 equal pills, height 64, gap 6, side padding 16. Each pill:
   - Inactive: transparent bg, 1px `--rule` border. Day abbrev (DM Sans 9 uppercase 0.14em `--muted`) over date number (Cormorant 22 `--text`).
   - **Active** (Wed): `background: --esp`, day text `rgba(244,237,225,0.6)`, number `--linen`, no border.
   - **Today indicator** (Thu, when not active): 4×4 brown dot below the number.
5. **Class list** — fills remaining height. Background `--canvas`, top border `--rule`, bottom padding 90 (clears tab bar).
   - **Section header** (`padding: 14 20 8`): "Wednesday · 7 classes" left, "1 booked" right in `--brown`. DM Sans 9.5 uppercase 0.18em.
   - **Class row** (`padding: 18 20`, bottom border `--rule`):
     - **Time column** (56pt fixed): Cormorant 22 time, DM Sans 10 `--muted` duration below
     - **Body**: row of `ClassDot` (8pt circle, type colour) + type/heat label (DM Sans 9.5 uppercase 0.16em); class name Cormorant 19 italic; "w/ Teacher" DM Sans 12 `--mid`
     - **Status column** (70pt right-aligned): one of:
       - Available: spots count (DM Sans 11 — `--rust` if ≤3, else `--text`) + "left" caption
       - Full: "Waitlist" label + "+3 ahead"
       - Booked: "Booked" label in `--brown` + "Tap to manage"
   - **Booked row treatment:** background `--l2`, 3pt `--brown` left rail (absolute, full-height)
   - **Full row treatment:** opacity 0.55
6. **TabBar** — active=`schedule`

### 2. Schedule B — Agenda cards  (`screen-schedule-b.jsx`) — VARIANT
Same data, alternative direction. Single day focus rather than week strip.

- Background `--l2` (warmer, more editorial)
- Hero block (24pt × 22pt): tiny "Wednesday" label, then huge "**6**" Cormorant 64 next to "*March*" Cormorant 28 italic `--brown`
- Sub-row: "5 classes · 1 booked" left, two 32-square nav buttons right (prev = outlined, next = filled `--esp`)
- **Agenda card** per class (`padding: 20 22`, gap 10):
  - Left rail (76pt): Cormorant 28 time, DM Sans 10 duration, optional `--brown` heat tag (e.g. "40°C")
  - Right body: type chip → italic class name (Cormorant 22) → teacher → spots count + outlined CTA ("Book" / "Manage" / "Join list")
  - Booked card: full `--esp` background, all text inverts to `--linen` / `rgba(244,237,225,0.6)`, "✓ Booked" in `--sand`
  - Full card: opacity 0.55

**Choose ONE direction** for production. Default is Schedule A. Schedule B is provided so the team can A/B; do not ship both.

### 3. Class detail / Book  (`screen-book.jsx`)
**Purpose:** Confirm a class booking with full context (teacher, room, cancellation policy) and optional add-ons.

**Layout:**
1. **Image header** (280pt tall) — placeholder gradient `linear-gradient(135deg, --rust 0%, --esp 100%)` with diagonal-line SVG texture at 0.15 opacity, fading darker at the bottom. **In production: replace with a class hero photo** (Bikram = warm hues, Pilates = cool hues, Sculpt = blue-grey, Special = amber).
   - Top controls (top: 56, side: 16): two 36pt circular glass buttons — back chevron left, heart-favourite right. `background: rgba(244,237,225,0.85)` with `backdropFilter: blur(6px)`.
   - Title block (bottom: 24, sides: 24): type chip (white-tinted) → "Bikram **90**" with `90` as italic `--sand` em (Cormorant 36) → "Wednesday, 6 March · 9:30 AM" in `rgba(244,237,225,0.7)`
2. **Scroll body** (`padding: 20 24 130`):
   - **Teacher row** (44pt avatar with initials + name in italic + "View →" link, bottom border)
   - **About this class** — `Lbl` + body paragraph
   - **Detail rows** — 4 label-value rows (Studio, Spots left, Cancellation, Mat hire), 14pt vertical, hairline dividers
   - **Add-on card** (`border 1px --rule`, `bg --canvas`, padding `14 16`): pre-checked square brown checkbox + "Mat & towel hire" with subline + "$3" Cormorant 18 right
3. **Sticky CTA bar** — absolute bottom, `padding: 16 20 32`, top border `--rule`, `bg --linen`. Left: "From plan / 1 credit + $3" stack. Right: filled "Confirm booking" CTA, flex-grow.

### 4. Cancel booking  (`screen-cancel.jsx`)
**Purpose:** Bottom-sheet confirm before cancelling. Always shows cutoff status so the member knows whether they'll lose a credit.

Rendered as a full-screen with **dimmed espresso backdrop** (the schedule shows through behind in production — use a translucent modal). Status bar uses dark variant.

**Sheet** (anchored to bottom, `border-radius: 20 20 0 0`, padding `14 24 36`):
- 44×4 grey drag handle, centred, 22pt below
- `Lbl` "Cancel booking" + Cormorant 26 H1 "Cancel **Bikram 90** on Wednesday at 9:30 AM?" with class name as italic `--brown` em
- **Cutoff status card** (`bg --canvas`, `border 1px --rule`, padding `14 16`):
  - Sage circle-with-check icon (18×18, 1.6-stroke)
  - "Free cancellation" + helper sentence
  - **States** (driver: `hoursUntilClass`):
    - `≥ 4h`: sage check + "Free cancellation. Your credit will be returned."
    - `< 4h`: rust ⚠ icon + "Late cancel — credit will be forfeited."
- **Reason chips** (optional) — wrap row of 5 chips (`padding: 8 14`, `border 1px --rule`, `bg --canvas`): Schedule conflict / Unwell / Travel / Switching class / Other
- **Actions:**
  - Filled `--esp` "Confirm cancellation" CTA (full width)
  - Ghost "Keep booking" centred text below

### 5. My Bookings  (`screen-bookings.jsx`)
**Purpose:** See upcoming bookings + past attendance, jump to manage/cancel.

**Layout:**
1. AppHeader "Bookings"
2. **Stats strip** (`margin: 20 20 0`, 3-col grid with 1pt `--rule` gap, full border): three centred stat cells — `12 / This month`, `47 / This year`, `8 / Streak · weeks`. Numerals Cormorant 26.
3. **Tab toggle** (Upcoming · Past) — DM Sans 11 uppercase 0.16em, active gets 2px `--brown` bottom underline, inactive `--muted`. "Upcoming · 3" includes count.
4. **Booking cards** (each `border 1px --rule`, `bg --canvas`, padding 18, marginBottom 12, flex row):
   - Date column (56pt, right border `--rule`): tiny `Mon` abbrev → Cormorant 30 day number → DM Sans 10 time
   - Body: type chip → italic class name (Cormorant 19) → teacher → cutoff pill ("Cancel by 5:30 AM" in `--brown` on `--l2` chip) **for upcoming**, or "✓ Attended" / "— Missed" status **for past**
   - Past cards: opacity 0.7, `bg: transparent`
5. "Recent" subheading + past-card list below. Tab bar active=`bookings`.

### 6. Membership home  (`screen-membership.jsx`)
**Purpose:** Hub for the member's plan + billing.

**Layout:**
1. AppHeader "Membership"
2. **Featured plan card** (`margin: 20 20 0`, `bg --esp`, padding `28 24 24`, position-relative with subtle 0.06-opacity diagonal-line grain):
   - `Lbl` "Current plan" in dimmed linen
   - "*Immersion*" Cormorant 38 italic, em in `--sand`
   - "Unlimited classes · 7 days a week" body
   - Big price "**$59** / week" (44 / 12)
   - Hairline divider (`rgba(255,255,255,0.12)`)
   - 2-col footer: Renews date | Member since
3. **Plan section** (`Lbl` "Plan" + grouped card on `--canvas`):
   - ActionRow "Change plan" → ChangePlanScreen
   - ActionRow "Pause membership" (sub: "Up to 4 weeks per year")
   - ActionRow "Cancel membership" — danger, label colour `--rust`
4. **Billing section:**
   - Card row (Visa pill 38×26 `--esp`/linen + last4 + exp + "Default" + Manage link)
   - ActionRow "Payment methods" → PaymentMethodsScreen
   - ActionRow "Invoices & receipts" (sub: last billed amount + date)
5. **Refer-a-friend promo** — dashed border (`1px dashed --rule`), 32×32 outlined `%` glyph in italic `--brown`, headline + code, "Share" link right

`ActionRow`: 32×32 outlined icon square + label/sub stack + 6×11 `--muted` chevron.

### 7. Change plan  (`screen-change-plan.jsx`)
**Purpose:** Compare plans, switch billing cadence.

**Layout:**
1. Custom nav bar (no AppHeader): back chevron · italic title "Change plan" · spacer
2. Intro (`Lbl` "3 plans" + Cormorant 24 "Find the rhythm *that fits*" with em in `--brown`)
3. **Billing cadence segment** (3-segment row, full border `--rule`): Weekly · Fortnightly · Annual · save 12%. Active segment `bg --esp`, `color --linen`. DM Sans 10 uppercase 0.16em.
4. **3 plan cards** in order:
   - Foundation — $39/wk — 4 classes/wk
   - **Immersion** — $59/wk — Unlimited (current + selected, dark `--esp` body, "Most popular" `--blt` badge top-right corner)
   - Casual — $32/class — pay as you go
   - Each: header row (label + name) | divider | feature list with sand/brown check ticks (1.5-stroke)
5. **Change summary** (`bg --l2`, padding `14 16`): "Changes apply on your next billing date **11 March 2025**…"
6. Sticky footer CTA — text changes by selection: "Stay on Immersion" / "Switch to Foundation" / etc.

### 8. Payment methods  (`screen-payment.jsx`)
**Purpose:** Manage cards on file + add a new one. Wire to **Stripe Elements** in production.

**Layout:**
1. Custom back nav · italic "Payment" title
2. Trust note (shield icon · "Secured by Stripe · we never store your card details")
3. **Cards on file** — grouped surface, two `PMRow`s:
   - Card brand pill (Visa: navy w/ italic VISA wordmark; Mastercard: dual circle with mix-blend) + `•••• 4242` + "Default" outlined badge in `--brown` + holder/exp + 14×4 ellipsis menu
4. **Add new card** form — editorial single-column (no boxes, bottom-border-only inputs, identical pattern to marketing site):
   - Card number row — 16pt mono-feel digits + 20×14 card-stripe placeholder
   - Two-col: Expires `MM / YY` | CVC `•••`
   - Name on card
   - "Set as default" — 22×22 brown checked box + label
5. **Or pay with** — full-width split: solid black "Apple Pay" + outlined "G Pay" (replace with platform-native PaymentRequest / Apple Pay sheet)
6. Sticky footer CTA "Save card"

**Production note:** the visible inputs are illustrative. **Replace the entire form with Stripe Elements / PaymentSheet** so card data never touches your server. Style the Stripe iframe to match: bottom-border-only, DM Sans 16 input, `--rule` border, `--brown` focus.

### 9. Profile  (`screen-profile.jsx`)
**Purpose:** Account hub, attendance heatmap, settings entry.

**Layout:**
1. AppHeader "Profile"
2. **Hero block** (`padding: 32 24 28`, centred, bottom border): 80pt `--l3` avatar circle with "AH" italic Cormorant 32 `--brown` initials → "Ava Hartley" Cormorant 26 italic → email + member-since DM Sans 12 `--muted` → small `--esp` chip "Immersion · 8-week streak" with `--sand` text
3. **This week strip** (`padding: 20 24`): `Lbl` "This week" + "4 / 5 goal" in `--brown`. Below: 7-column flex of 36pt-tall vertical bars — `--brown` filled for attended days, `--l3` 0.5-opacity for missed. Day-letter labels below (M T W T F S S, 9.5pt `--muted`).
4. **Sections** (Account · Studio · Support) — each is a `Lbl` heading + grouped surface on `--canvas` with full-bleed top/bottom `--rule` borders. Each `NavRow` (`padding: 16 20`) is title + optional sub + chevron.
   - Account: Personal details · Notifications · Health & preferences
   - Studio: Studio info · QR check-in · Refer a friend
   - Support: Help centre · Terms & privacy · Sign out
5. App version footer (32 24, centred, 10pt `--muted`)

---

## Reusable Components (shared atoms in `screens.jsx`)

| Component | Spec |
|---|---|
| `Lbl` | DM Sans 9.5 / 500 / 0.18em / uppercase / `--muted` (color overridable). Use for ALL section labels. |
| `H1` | Cormorant configurable size (default 30) / 400 / line-height 1.05 / `-0.005em` tracking. Italic optional. |
| `Body` | DM Sans 13 / 300 / line-height 1.55 / `--mid`. |
| `Brand` | Wordmark — Cormorant 22 / 500 — "Body" + italic `<em>forme</em>` in `--brown`. |
| `StatusBar` | 50pt mock iOS status bar (9:41 + signal/battery). Use real OS bar in production. |
| `TabBar` | Bottom nav, 4 tabs, glyph + 9pt uppercase label. Light or `dark`. Active tint `--brown` / `--sand`. |
| `AppHeader` | 56pt tall, leading slot · italic Cormorant 22 title · trailing slot · bottom border. |
| `CTA` | Full-width filled button: `--esp` bg / `--canvas` text / DM Sans 11 / 500 / 0.14em / uppercase / `padding: 14 22` / `radius 4`. `dark={false}` flips to outline. |
| `ClassDot` | Small filled circle by class type — Bikram=`rust`, Pilates=`sage`, Sculpt=`blue`, Special=`amber`, Yin=`#8a7da0`. |
| `Rule` | 1px hairline divider (`--rule`). |

When porting: implement these as the corresponding native primitives in your stack — e.g. SwiftUI `View`s with computed properties for tokens, or React Native components consuming a theme object.

---

## Class Type System
The studio runs five class types. Each carries a **dot colour** (used in chips, dividers and accents) and an associated **hero gradient** for the booking screen image header:

| Type | Dot colour | Heat | Hero gradient (135°) |
|---|---|---|---|
| Bikram | `--rust` `#9a5a3a` | 40°C | `--rust` → `--esp` |
| Pilates | `--sage` `#7a9478` | — | `--sage` → `--esp` |
| Sculpt | `--blue` `#8a9ab0` | 32°C | `--blue` → `--esp` |
| Special | `--amber` `#b0906a` | — | `--amber` → `--esp` |
| Yin | `#8a7da0` | — | `#8a7da0` → `--esp` |

---

## Sample Data Shape
```ts
type ClassSession = {
  id: string;
  time: string;        // "9:30"
  duration: string;    // "90 min"
  name: string;        // "Bikram 90"
  teacher: string;     // "James T."
  spots: number;       // remaining
  type: 'Bikram' | 'Pilates' | 'Sculpt' | 'Special' | 'Yin';
  heat?: string;       // "40°C"
  booked?: boolean;
  date: string;        // ISO
};

type Booking = ClassSession & {
  cutoff?: string;     // "5:30 AM" (client-format the actual deadline)
  attended?: boolean;  // past only
};

type Plan = {
  id: 'foundation' | 'immersion' | 'casual';
  name: string;
  price: string;       // "$59"
  per: string;         // "per week"
  features: string[];
  popular?: boolean;
};
```

---

## Interactions & Behaviour

| Interaction | Behaviour |
|---|---|
| Tab switch | Standard native tab transition; persistent across primary screens |
| Schedule day pill tap | Switches active day, refetches/refilters classes for that date |
| Class row tap | Push BookScreen (or sheet — designer's choice; push is the default) |
| Heart icon (book screen) | Toggle favourite; persist on user |
| Add-on checkbox | Toggle inclusion + recompute price below |
| Confirm booking | POST → success → pop back to schedule, mark row `booked: true` |
| Booked row left-rail | Visual only — taps still open detail (in "manage" mode with cancel option) |
| Cancel booking sheet | Slides up over dimmed schedule. **Cutoff status driven by `hoursUntilClass`** — sage/free vs. rust/forfeit. Reason chips toggle (single select). |
| Bookings tab toggle (Upcoming · Past) | Filter list; counts shown next to active label |
| Change plan card tap | Selects plan; CTA text + selected styling update; segment selection drives prices shown |
| Billing cadence segment | Switches displayed prices ($59/wk → ~$118/fortnight → ~$2,990/yr with 12% saving) |
| Add card form | Replace with **Stripe PaymentSheet** or **Stripe Elements** — never collect raw PAN |
| Apple/Google pay buttons | Wire to `PKPaymentRequest` (iOS) / Google Pay API (Android) via Stripe |
| QR check-in | Generate user-token QR client-side; fullscreen modal with brightness boost |
| Sign out | Standard auth flow + clear local state |

### Animations
- All screen pushes: standard platform navigation transition (no custom)
- Bottom sheet: spring-in from below, dim backdrop fade 0 → 0.4
- Day pill / segment selection: 150ms ease colour transition
- Booking confirm: success haptic + brief checkmark overlay before pop
- Streak bars / stats: count-up on first appearance (300ms, ease-out) — optional polish

---

## State Management
Suggested slices (Redux / Zustand / SwiftUI `@Observable`):

- **Auth** — user profile, member-since date, plan tier
- **Schedule** — `ClassSession[]` keyed by date; bookmarks; filter (`type`, `time`)
- **Bookings** — upcoming + past lists; mutate on book/cancel
- **Membership** — current plan, renewal date, billing cadence; payment methods array; default card id
- **Streak** — week heatmap (7 booleans), this-week count, all-time streak
- **UI** — active tab, modal/sheet visibility, toast queue

Server contract (per-feature):
- `GET /schedule?from=YYYY-MM-DD&days=7`
- `POST /bookings { sessionId, addons }`
- `DELETE /bookings/:id { reason? }`
- `GET /me/bookings?scope=upcoming|past`
- `GET /me/membership`
- `PATCH /me/membership { planId, cadence }`
- `GET/POST/DELETE /me/payment-methods` — proxy to Stripe
- `GET /me/streak` — `{ thisWeek: boolean[7], current: number, longest: number }`

---

## Assets

No raw image assets are bundled. Production needs:
- **App icon** — Bodyforme wordmark on `--linen`
- **Splash screen** — `--linen` with centred italic "Bodyforme" wordmark
- **Class hero photos** — one landscape per class type (Bikram, Pilates, Sculpt, Special, Yin), warm-toned, ~3:2 ratio. Mocks use a gradient + diagonal-line texture as placeholder; replace with real photography.
- **Teacher avatars** — square headshots; placeholder shows initials on `--l3` background.
- **Fonts** — bundle `CormorantGaramond-{Light,Regular,Medium,LightItalic,Italic,MediumItalic}.ttf` and `DMSans-{Light,Regular,Medium}.ttf` via your platform's font registration mechanism.

---

## Accessibility
- Min hit target 44×44pt — verify tab-bar items, day pills (currently 64pt tall ✓), reason chips (`padding: 8 14` → may need padding bumped to 12 to clear 44pt), card row meta-buttons (Manage, View → links — wrap in larger tap area)
- Dynamic Type — type scale uses pt-equivalents; respect user's text-size setting and let layouts reflow (rows should wrap, not truncate)
- VoiceOver — every class row, booking card, plan card needs an aggregated label: "Bikram 90, 9:30 AM, with James T., 8 spots remaining, double-tap to book"
- Colour contrast — `--mid` on `--linen` = 5.6:1 ✓; `--muted` on `--canvas` = 3.4:1 (passes for ≥18pt only — check usage; uppercase labels are 9.5pt, the small size is acceptable for tracked uppercase but flag if shipping to a strict-AA standard)
- Reduce Motion — disable count-up animations and sheet spring; fall back to fade

---

## What's NOT designed (build with judgement)
- Onboarding / sign-in / account creation flows
- Sub-screens behind every Profile NavRow (Personal details, Notifications, Health & preferences, Studio info, QR check-in, Help centre, Terms & privacy)
- Pause membership confirmation flow
- Cancel membership full retention flow
- Invoices list + receipt detail
- Waitlist join confirmation + push notification when spot opens
- Push-notification permission primer
- Empty states (no bookings yet, no payment methods, etc.)
- Error states (network failure, payment declined, fully booked)
- Search results screen (the search icon on Schedule is a stub)
- Filter sheet (the "All ↓" trigger on Schedule is a stub)

For each of the above, follow the established design system: `--linen` background, sharp corners, hairline `--rule` borders, italic Cormorant titles with em in `--brown`, DM Sans body, full-width filled `--esp` CTAs.

---

## Quick reference — hand to the implementer

> **Stack recommendation:** SwiftUI for native iOS. Define `Theme` enum with all 16 colour tokens, type styles via custom `ViewModifier`s. Use `NavigationStack` for pushes, `.sheet` for bottom sheets, `TabView` for tabs. Drop in Stripe iOS SDK (`StripePaymentSheet`) for the payment screen.
>
> **Cross-platform alternative:** Expo + React Native + Reanimated. `tokens.ts` for the palette, `Inter`-style font loader for Cormorant + DM Sans, `@stripe/stripe-react-native` for payments, `expo-router` for navigation.

Build the screens in this order:
1. Tokens + atoms (`Lbl`, `Body`, `Brand`, `CTA`, `ClassDot`, `Rule`)
2. Layout primitives (`AppHeader`, `TabBar`)
3. Schedule A → BookScreen → CancelSheet (the core booking loop — most user value)
4. Bookings list
5. Membership + ChangePlan
6. Payment methods (with Stripe)
7. Profile + settings stubs

Re-open the HTML alongside your implementation as a pixel reference.
