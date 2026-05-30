# BodyForme — Mobile View Audit & Fix List

**Scope:** Homepage (bodyforme.com.au) at mobile widths (≤ 640px). Desktop is fine and should not be touched — every change below should live inside a mobile media query or a mobile-first rule that desktop overrides.

**How to read this:** Each section lists the *likely problem* on mobile and a *recommended fix* with concrete values. Hand this to Claude Code section by section. Start with the **Global rules** and the **Priority quick wins** — those fix ~70% of the "messiness."

> Note: this audit is built from the live page's actual content and section structure. The site blocks iframe embedding, so verify each fix against a real phone (or Chrome DevTools device mode at 390px) as you apply it.

---

## Global rules (apply once, fixes most of the mess)

These are the highest-leverage changes. Most "messy on mobile" sites fail on exactly these.

1. **Kill horizontal scroll.** Add a guard so nothing can push the page wider than the screen:
   ```css
   html, body { overflow-x: hidden; max-width: 100%; }
   *, *::before, *::after { box-sizing: border-box; }
   img, video, svg { max-width: 100%; height: auto; }
   ```
   The most common cause of "messy" mobile is one wide element (a marquee, a fixed-width card, a grid that won't collapse) forcing a sideways scroll. Find it by setting `outline: 1px solid red` on everything temporarily.

2. **One consistent horizontal gutter.** Pick a single side padding for every full-width section and use it everywhere — don't let some sections be flush and others inset:
   ```css
   @media (max-width: 640px) {
     .section, .container { padding-left: 20px; padding-right: 20px; }
   }
   ```
   16px on very small phones, 20–24px is the sweet spot for 390px.

3. **Body text never below 16px.** Anything 14px or smaller becomes a squint on mobile, and `<input>` font-size below 16px makes iOS Safari auto-zoom on focus (a classic "why did my page jump" bug). Set body copy to 16px, form inputs to 16px minimum.

4. **Tap targets ≥ 44px.** Every link, button, nav item, and form control needs a minimum 44×44px hit area. Add vertical padding to nav links and footer links so they aren't 1-line-tall tap traps.

5. **Stack everything that's a row.** Any two- or three-column layout (hero, "Why" section, contact, footer, pricing, classes grid) should become a single column under 640px via `grid-template-columns: 1fr` or `flex-direction: column`. This is the single biggest readability win.

6. **Headline sizes need a mobile step-down.** The big italic display headings ("Movement that finds *your form*", "Classes for every *body*") are sized for desktop. Use `clamp()` so they scale down smoothly instead of wrapping into 4 cramped lines. Example: `font-size: clamp(2rem, 8vw, 4.5rem);`

---

## Priority quick wins (do these first)

| # | Fix | Why |
|---|-----|-----|
| 1 | Add the `overflow-x` + `box-sizing` + `img max-width` guard | Kills the sideways scroll that makes everything feel broken |
| 2 | Force all multi-column grids to 1 column < 640px | Single biggest readability gain |
| 3 | Stack the hero's two CTA buttons full-width | They almost certainly overflow side-by-side at 390px |
| 4 | Convert the 4-up stats row to a 2×2 grid | 4 numbers in a row are unreadable on a phone |
| 5 | Step down all display headings with `clamp()` | Stops 4-line cramped wrapping |
| 6 | Give nav links / footer links 44px tap height | Usability + looks less cramped |

---

## Section-by-section

### 1. Top announcement bar
> *"New members — first class free when you join before 30 June 2026 — Book now"*

**Likely problem:** Long single-line promo text wraps awkwardly or gets clipped; the "Book now" link crowds the date on a narrow screen.

**Fix:**
- Reduce font to ~13px, center the text, allow it to wrap to 2 lines cleanly (`line-height: 1.4`).
- Keep "Book now" as an underlined inline link on its own line if it wraps, or shorten the copy on mobile to *"First class free — book now"*.
- Vertical padding 10–12px so it doesn't feel pinched.

### 2. Header / navigation
**Likely problem:** The page renders both the desktop nav links *and* the hamburger menu. On mobile the inline links (Classes / Memberships / About / Contact) plus "Log in" + "Book a Class" almost certainly overflow or wrap into a messy second row next to the logo.

**Fix:**
- Below 640px: **hide the inline nav links and the "Log in" text link**; show only the **logo (left)**, a single **"Book"** CTA (optional), and the **hamburger ☰ (right)**.
- Put Classes / Memberships / About / Contact / Log in / Book a Class inside the hamburger drawer, stacked vertically, each a 48px-tall tap row.
- Make the header a fixed height (~60px) with the logo vertically centered. Don't let it grow to two rows.
- Ensure the open mobile drawer covers the full viewport (or slides in) with a solid background — half-transparent overlays over text look messy.

### 3. Hero — "Movement that finds *your form*"
**Likely problem:** (a) Heading too large → wraps into 4+ cramped lines or overflows. (b) The two CTAs ("Book a free trial" / "View the schedule") sit side-by-side and overflow. (c) The hero image + "Doncaster, Melbourne" label + icon may overlap or crowd.

**Fix:**
- Heading: `font-size: clamp(2.25rem, 9vw, 5rem); line-height: 1.08;` and `text-wrap: balance;`.
- Buttons: stack vertically, **full-width** (`width: 100%`), 14–16px vertical padding, 12px gap. Primary first.
- Reduce hero vertical padding on mobile (desktop heroes are often 120px+ top/bottom — halve it).
- If the hero image is decorative and competes with text, consider placing it *below* the text block on mobile rather than as a cramped side element.
- Intro paragraph: max ~60ch isn't an issue on mobile, but set `line-height: 1.6`.

### 4. Class-name marquee / ticker
> *Hot Pilates · AAA · Bikram 90 Min · Bikram Express · Hot HIIT · Special Forces · Tabata · Yin Yoga · All Levels Welcome* (scrolling, repeated)

**Likely problem:** A horizontal scrolling marquee is a frequent cause of horizontal-overflow bugs and can look frantic on a small screen.

**Fix:**
- Wrap it in `overflow: hidden` so it never adds page scroll.
- Reduce font size and animation speed on mobile, or consider pausing/hiding it under 640px if it's purely decorative — it adds little on a phone.

### 5. "Hot Yoga & Pilates" image + quote overlay
> *"At BODYFORME, movement is personal."*

**Likely problem:** Text overlaid on the image can become unreadable if the image shrinks; overlay text may overflow its box.

**Fix:**
- Ensure the image uses `object-fit: cover` with a fixed aspect ratio (`aspect-ratio: 4 / 3`).
- Add a dark gradient scrim behind overlay text for contrast.
- Reduce overlay quote font size; keep it within the image bounds with padding.

### 6. Classes grid (8 cards: Hot Pilates → Yin Yoga)
**Likely problem:** A 2- or 3-column card grid squished onto a phone → cramped text, tiny numerals (01–08), and the "45–60 min · All levels" meta row wrapping badly.

**Fix:**
- `grid-template-columns: 1fr;` — **one card per row** under 640px.
- Card padding 20–24px; gap between cards 16px.
- Number (01–08): keep it as a clear label above the title, ~14px, muted color — don't let it shrink into the corner.
- Title with italic accent: ~22–24px.
- Meta row ("45–60 min · All levels"): keep on one line; if tight, use a smaller muted font (14px) and a `·` separator with `white-space: nowrap` on each token.
- "View full schedule" button: full-width or centered, 44px tall.

### 7. "Why BodyForme — Strength and mobility, *together*"
**Likely problem:** Two-column (text + bullet list on one side, image on the other) stays side-by-side and crushes both.

**Fix:**
- Stack to single column: text block first, then the 5-item checklist, then the image (or image first — your call, but one column).
- Checklist: each item full-width with the check icon, 16px text, 10px vertical spacing, 44px tap-free but breathable rows.
- Image: full-width, `border-radius` consistent with the rest, `aspect-ratio` locked.

### 8. Philosophy + stats
> *2026 Founded · < 12 Students per class · 60 Min avg length · 100+ Class types*

**Likely problem:** Four stats in a single row become four tiny cramped columns — the **#1 visual offender** on phones.

**Fix:**
- `grid-template-columns: 1fr 1fr;` → **2×2 grid**. (Single column is also fine but 2×2 reads well for short stats.)
- Big number ~32–40px, label below ~13px uppercase muted. Center each cell.
- Generous row gap (24px) so the four don't blur together.
- The founder quote + attribution: quote ~24px italic, attribution muted below; comfortable line-height.

### 9. Membership plans (3 pricing cards)
**Likely problem:** Three pricing cards side-by-side on mobile = unreadable. The "Most popular" / "Best value" badges may overlap card edges. Price ("$42/ week") may wrap oddly.

**Fix:**
- Stack to **one card per row**, full-width, 16px gap.
- Lead with the popular plan (4 Per Week) or keep source order — but consider visually elevating the "Most popular" card with a border/accent so it still stands out when stacked.
- Badge: position cleanly at the top of the card (inline pill above the plan name), not absolutely positioned half-off the corner.
- Price: keep "$42" large and "/ week" small but on the same line; the "≈ $14 per class" note muted below.
- Feature list: 16px, checkmarks aligned, comfortable spacing.
- "Get started" button: full-width, 48px tall.
- "Compare all plans →": centered link below the stack.

### 10. Testimonials (3 Google review cards)
**Likely problem:** 3 columns squished; long quotes get cut or cramped.

**Fix:**
- One card per row (or a horizontal swipe carousel with snap — but single column is simpler and safer).
- Quote 16px, `line-height: 1.6`; name bold above or below, role muted.
- Keep the "Google reviews" label and "Read the full stories" link centered.

### 11. Contact — "Visit the *studio*"
**Likely problem:** Info column (Address / Hours / Email) + map + form laid out in columns → cramped. Form fields may be too short (tap targets) and inputs under 16px trigger iOS zoom.

**Fix:**
- Stack: heading → address/hours/email block → map → form (single column).
- Address/Hours/Email: each a labeled block, label muted uppercase 13px, value 16px. Make phone/email actual `tel:` / `mailto:` links with 44px tap height.
- Map: full-width, fixed height (~240px), `border-radius` consistent.
- **Form:** inputs full-width, **16px font** (prevents zoom), 48px tall, 12px internal padding, clear labels above each field, 16px gap between fields. "Send message" button full-width, 48px.

### 12. Footer (4 columns: brand / Studio / Visit / Account)
**Likely problem:** Four columns collapse messily — often into uneven widths or an awkward 2+2 with misaligned headings.

**Fix:**
- Single column stack, or a clean 2-column grid for the three link groups with the brand block full-width on top.
- Each link: 44px tap row, 16px, comfortable spacing.
- Brand block ("Body*forme* — Hot Yoga & Hot Pilates. Doncaster. 132 Ayr Street...") full-width, then link groups.
- Phone/email as real `tel:`/`mailto:` links.
- Copyright + bottom "Contact" link centered, muted, 13px, with breathing room above (24px).

---

## Spacing & rhythm (ties it all together)

- **Vertical section padding:** desktop sections are likely 100–160px top/bottom. On mobile, use a consistent **56–72px** between sections — enough to separate, not so much you scroll forever.
- **Consistent vertical gap inside sections:** heading → intro → content should use a predictable scale (e.g. 16 / 24 / 40px).
- **Don't center long body paragraphs** — left-align body copy on mobile for readability; centering is fine for short headings/labels only.
- **Line length** isn't usually an issue on mobile, but ensure paragraphs have `line-height: 1.6`.

## Type scale suggestion (mobile)

| Element | Mobile size |
|---------|-------------|
| Display heading (hero) | `clamp(2.25rem, 9vw, 5rem)` |
| Section heading | `clamp(1.9rem, 7vw, 3rem)` |
| Card / plan title | 22–24px |
| Stat number | 32–40px |
| Body | 16px |
| Muted meta / labels | 13–14px |
| Buttons / nav | 15–16px |

---

## Test checklist (before you call it done)

- [ ] No horizontal scroll at 360px, 390px, 414px widths.
- [ ] Every multi-column section is a single column (or intentional 2×2 for stats).
- [ ] Hero CTAs are full-width and stacked.
- [ ] Hamburger menu opens, covers content with a solid bg, and every nav item is a 44px+ row.
- [ ] All form inputs are 16px font (no iOS zoom on focus) and 48px tall.
- [ ] Stats are a 2×2 grid, not a 4-wide row.
- [ ] Pricing cards, class cards, testimonials each stack one per row.
- [ ] Footer stacks cleanly; phone/email are tappable links.
- [ ] Consistent left/right gutter on every section.
- [ ] Tap targets everywhere ≥ 44px.

---

## Implementation note for Claude Code

Wrap all of this in a single mobile breakpoint block so desktop is untouched:

```css
@media (max-width: 640px) {
  /* all mobile overrides here */
}
```

If the codebase is mobile-first (base styles = mobile, `min-width` queries add desktop), then instead **move** these values into the base styles and let the existing `@media (min-width: …)` rules restore the desktop layout. Either way: **do not change any desktop rule** — every fix here is mobile-only.
