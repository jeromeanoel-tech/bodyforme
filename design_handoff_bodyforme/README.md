# Bodyforme — Complete Site Handoff

## Overview
Full 5-page marketing website + studio management dashboard for Bodyforme, a premium Bikram yoga and Pilates studio in Collingwood, Melbourne.

All files are **high-fidelity HTML prototypes**. Recreate them in your target framework (React, Next.js, etc.) using the exact tokens, patterns and copy documented here.

---

## Files

| File | Page | Description |
|---|---|---|
| `Bodyforme Home.html` | Home | Main marketing landing page |
| `Bodyforme Classes.html` | Classes | Weekly schedule, class cards, booking modal |
| `Bodyforme About.html` | About Us | Founder story, team profiles, gallery, timeline |
| `Bodyforme Memberships.html` | Memberships | Plan cards, comparison table, FAQ, sign-up form |
| `Bodyforme Contact.html` | Contact | Map, enquiry form, hours, social links |
| `Bodyforme.html` | Dashboard | Studio management app (classes schedule) |

---

## Design System

### Color Tokens
```css
--linen:   #f4ede1   /* Primary background */
--l2:      #ede4d4   /* Secondary bg, hover tints, day headers */
--l3:      #e4d8c6   /* Deeper linen, map bg */
--esp:     #2a1506   /* Espresso — sidebar, dark sections, buttons */
--esp2:    #3d2210   /* Hover espresso, footer */
--brown:   #7a4a2a   /* Primary accent — links, underlines, hovers */
--blt:     #a0724e   /* Light accent — badges, dots, sand tones */
--text:    #2a1506   /* Primary text */
--mid:     #6b4e36   /* Secondary text, body copy */
--muted:   #a08568   /* Tertiary — labels, captions, placeholders */
--rule:    #d8ccba   /* All borders */
--canvas:  #fdfaf6   /* Near-white — cards, form bg, floating elements */
```

### Typography
```
Display:  Cormorant Garamond (Google Fonts)
          Weights: 300, 400, 500 — with italic variants
Body/UI:  DM Sans (Google Fonts)
          Weights: 300, 400, 500

Import URL:
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap
```

#### Type Scale
| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| H1 Hero | Cormorant | clamp(52px, 6vw, 84px) | 400 | Italic em in --brown |
| H2 Section | Cormorant | clamp(36px, 4vw, 54px) | 400 | Italic em in --brown |
| H3 Card | Cormorant | 22–32px | 400 | |
| Section label | DM Sans | 9.5px | 500 | 0.18em, uppercase, + rule line |
| Nav | DM Sans | 10.5px | 400 | 0.13em, uppercase |
| Body | DM Sans | 13.5–14px | 300 | line-height 1.75–1.8 |
| Small | DM Sans | 12–12.5px | 300 | |
| Micro label | DM Sans | 9–9.5px | 400–500 | 0.14–0.18em, uppercase |

### Spacing
```
Max content width:  1280px (centered, margin: 0 auto)
Page padding:       0 48px
Section padding:    88px 48px
Card padding:       32–40px
Grid gaps:          1px (background: --rule creates hairline dividers)
```

### Borders & Radius
- All borders: `1px solid var(--rule)`
- Dark bg borders: `1px solid rgba(255,255,255,0.08)`
- **No border-radius anywhere** — all corners are sharp (0px)
- No box shadows — depth through background contrast only

---

## Components

### Header (shared across all pages)
- Sticky, 64px tall, `background: --linen`, `border-bottom: 1px solid --rule`
- 3-column layout: `nav-left | brand (centered, absolute) | nav-right`
- Links: 10.5px DM Sans, 400, 0.13em tracking, uppercase, `--mid`
- Hover: color → `--text`, `::after` underline animates width 0→100% in `--brown`
- Active page: underline at full width
- Brand: Cormorant 21px 500, italic `em` in `--brown`
- CTA "Book a Class": filled `--esp`, 9px 20px, 10px uppercase

### Buttons
```
Dark filled:   bg --esp | color --canvas | hover bg --brown
               font: 10.5px DM Sans 500, 0.14em, uppercase | padding: 14px 32px

Ghost:         color --mid | border-bottom 1px --rule
               hover: color --text, border --text

Outline:       border 1px --esp | color --esp
               hover: filled --esp

Small (table): 10px, padding 10px 20px
```

### Section Label Pattern
```html
<div class="slbl">Label text</div>
```
- DM Sans 9.5px 500, 0.18em, uppercase, `--muted`
- `::after`: 56px wide `1px solid --rule` trailing line

### Cards (hover-fill pattern)
- 4 or 3-col grid with `gap: 1px; background: --rule; border: 1px solid --rule`
- On hover: `background → --esp`; all text inverts to `rgba(244,237,225,0.8)`
- Card number: Cormorant 12px 300, `--muted`

### Membership Cards
- Featured card: `background: --esp`, all text inverted
- "Most popular" badge: absolute top-right, `--blt` bg
- Price: Cormorant 56px 300

### Forms (editorial input style)
- Bottom-border only: `border-bottom: 1px solid --rule`
- No box, no border-radius, transparent background
- Label: 9.5px uppercase, `--muted`, above input
- Focus: border-bottom-color → `--brown`

### Dark Sections
- `background: --esp`
- H2: `--linen` with italic em in `#c4a882` (sand)
- Body text: `rgba(244,237,225,0.55)`
- Borders: `rgba(255,255,255,0.08)`
- Section label: `rgba(244,237,225,0.3)`

### Scroll Reveal
```css
.reveal { opacity: 0; transform: translateY(12px); transition: opacity .55s ease, transform .55s ease; }
.reveal.visible { opacity: 1; transform: none; }
```
```js
const io = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.08 }
);
document.querySelectorAll('.reveal').forEach(r => io.observe(r));
```

### Animated Ticker
```css
animation: tick 30s linear infinite;
@keyframes tick { from { transform:translateX(0) } to { transform:translateX(-50%) } }
```
Duplicate content for seamless loop. `background: --l2`, `border-bottom: 1px solid --rule`.

---

## Page-by-Page Specs

### 1. Home (`Bodyforme Home.html`)
**Sections:**
1. Announce bar — `--esp` bg, sand link
2. Sticky header
3. **Hero** — 2-col grid, serif H1 with italic, body copy, 2 CTAs, right: 480px image with two floating stat/quote cards
4. Animated ticker strip
5. **Classes** — `s-header` (h2 left, intro text right), 4-col hover-fill card grid
6. **Benefits** — dark `--esp` section, 2-col: copy+list left, tall image right
7. **Philosophy** — 2-col: italic pull-quote + copy left, 4 stat facts right
8. **Memberships** — 3-col cards, featured center card dark
9. **Contact** — 2-col: address/details left, bottom-border form right
10. Footer — 4-col dark grid

### 2. Classes (`Bodyforme Classes.html`)
**Sections:**
1. Dark hero with 3 stats
2. **Sticky filter bar** (top: 64px) — All/Bikram/Pilates/Sculpt/Special tabs + week nav
3. **7-day timetable** — JS-rendered, 7-col grid, colour-coded left borders per type
   - Bikram: `--rust` (#9a5a3a) | Pilates: `--sage` (#7a9478) | Sculpt: #8a9ab0 | Special: #b0906a
   - Spots: default `--muted` | low (≤3): `--rust` | full: line-through
4. **Class detail cards** — 2×2 grid, each card 2-col (image left, content right)
5. **Booking modal** — overlay with class image, 4-item detail strip, form, price + confirm
6. Dark CTA strip
7. Footer

**JS Data:** `schedule` array — 7 days × 3 classes each. Filter by `type`. Week nav is cosmetic.

**Modal:** `openModal(name, meta, price)` — updates title/meta/price, sets image gradient by type, opens overlay.

### 3. About (`Bodyforme About.html`)
**Sections:**
1. Split hero — dark left (H1), linen right (quote + 3 stats)
2. **Founder story** — 2-col: image with caption overlay left, content right
3. **Values** — dark `--esp`, 3×2 grid of 6 values
4. **Instructors** — 4-col grid, 8 cards with image, name, role, bio, tag chips
5. **Gallery** — asymmetric CSS grid: `2fr 1fr 1fr` × 2 rows, first cell spans both rows
6. **Timeline** — 2-col: heading left, 6 milestone rows right
7. CTA strip + footer

### 4. Memberships (`Bodyforme Memberships.html`)
**Sections:**
1. Dark hero with trust signals (4 checkmarks)
2. Trial banner — `--l2` bg, claim CTA scrolls to sign-up
3. **Plan cards** — 3-col grid: Foundation / Immersion (featured) / Casual
4. **Comparison table** — full feature matrix, featured column highlighted
5. **How it works** — 4-step grid
6. **Testimonials** — 3 cards, `--canvas` bg on `--l2` section
7. **FAQ accordion** — 2-col: heading left, items right. Toggle via JS `classList.add('open')`
8. **Sign-up form** — dark `--esp` section, form on right in semi-transparent box
9. Footer

### 5. Contact (`Bodyforme Contact.html`)
**Sections:**
1. Split hero — dark left (H1), linen right (4 contact detail rows)
2. **Map** — 380px placeholder with grid overlay, floating address card
3. **Contact form + info** — 2-col: form left, info + social links right
   - Form: submits to JS handler, hides form, shows success message
4. **Hours table** — JS dynamically highlights today's row
5. Team strip — links to About + Classes
6. Footer

---

## Navigation Structure
```
Header (all pages):
  Left:  Classes → Bodyforme Classes.html
         Memberships → Bodyforme Memberships.html
  Brand: Bodyforme → Bodyforme Home.html
  Right: About Us → Bodyforme About.html
         Contact → Bodyforme Contact.html
         [CTA] Book a Class → Bodyforme Classes.html

Footer (all pages):
  Studio: Classes, Memberships, About
  Visit: address, phone, email
  Account: Sign In, Create Account, Gift Cards
```

---

## Dashboard (`Bodyforme.html`)
Separate app — studio staff view.

**Layout:** Fixed sidebar (200px) + scrollable main

**Sidebar:** `--esp` bg, Cormorant wordmark, uppercase spaced nav items, active = left border accent `--blt`, animated AI pulse dot

**Top bar (48px):** bottom-border-only search, icon buttons, notification badge, avatar

**Calendar toolbar (46px):** serif date, underline view tabs, outlined filter chips

**Schedule:** sticky day headers on `--l2` bg (today: warmer `oklch(0.94 0.018 42)`), 5-col grid rows, Cormorant class names in `--brown`, custom checkboxes

---

## Interaction Reference

| Component | Behaviour |
|---|---|
| Nav links | Underline animates `width: 0 → 100%` on hover |
| Class/plan cards | `background → --esp`, text inverts on hover |
| FAQ items | `max-height: 0 → 200px` on `.open` class |
| Ticker | CSS `translateX(-50%)` infinite loop |
| Booking modal | `opacity: 0 + pointer-events: none` → `.open` |
| Hours table | JS `new Date().getDay()` highlights today |
| Form submit | JS prevents default, shows success div |
| Scroll sections | IntersectionObserver adds `.visible` class |
| Schedule filter | Re-renders grid via JS with filtered data |
