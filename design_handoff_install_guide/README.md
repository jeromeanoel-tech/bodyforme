# Handoff: Bodyforme — Member App Install Guide

## Overview
A single-page guide that teaches Bodyforme members how to add the Bodyforme web member app to their phone's home screen. The page is designed to be:

- **Web-friendly** — readable in any modern desktop or mobile browser, single page, no auth.
- **Print-friendly** — paginates cleanly to A4 / Letter so the studio can print copies for the front desk.
- **Self-explanatory** — a member who has never heard "PWA" or "add to home screen" can finish the install on their own.

Two parallel install paths are documented side-by-side: **iPhone (Safari)** on the left and **Android (Chrome)** on the right. Each path is exactly **5 numbered steps**, each step pairs short instructional copy with a small phone mock-up that illustrates the tap target.

A copyable URL block sits above the steps so the member (or a staff member helping them) can grab the link in one click.

---

## About the Design Files
The files in this bundle are **design references created in HTML** — a static prototype showing intended look, copy, and behaviour. They are **not production code to ship as-is**.

The task is to **recreate this design in the target codebase's existing environment** (the Bodyforme website / CMS / static-site generator — whatever stack the marketing site uses) using its established patterns, components, and design tokens. If no environment exists yet, choose the most appropriate framework for a content page (a static HTML page, an Astro/Eleventy page, a Next.js route, etc.) and implement there.

The HTML is monolithic on purpose — it's easier to read end-to-end as a reference. Production should split it into components / partials matching the host codebase's conventions.

---

## Fidelity
**High fidelity.** Final colours, typography, spacing, and copy. The phone mock-ups are illustrative cartoons (intentionally simplified — they are not pixel-faithful screenshots of iOS / Android) but the brand chrome around them (header, hero, step cards, footer) is final.

---

## Page structure

The page is a single column constrained to `max-width: 1280px`, centred, with `64px 56px 80px` padding. From top to bottom:

1. **Brand bar** — Bodyforme wordmark (left) + caption "MEMBER APP · INSTALL GUIDE" (right). Bottom rule.
2. **Hero** — two-column grid (`1.05fr 0.95fr`, 56px gap):
   - Left: serif H1 "Add Bodyforme to your *home screen*." (the "*home screen*" phrase is in italic brown)
   - Right: short paragraph + the **URL card** (espresso background, linen text, "Copy link" button)
3. **Platform columns** — two-column grid (`1fr 1fr`, 56px gap) with a vertical rule between:
   - Each column has a header strip (platform name + small device pictogram)
   - 5 numbered steps stacked vertically
4. **Footer** — help line + sign-off. Top rule.

On viewports ≤ 900px, the platform grid collapses to one column and the vertical rule is hidden. The hero grid also collapses.

---

## Design tokens

### Colours

| Token        | Hex       | Usage                                                  |
|--------------|-----------|--------------------------------------------------------|
| `--linen`    | `#f4ede1` | Page background                                        |
| `--l2`       | `#ede4d4` | Subtle alternate surface                               |
| `--l3`       | `#e4d8c6` | Disabled / placeholder fills (e.g. empty home-screen tiles) |
| `--esp`      | `#2a1506` | Espresso — URL card bg, dark surfaces                  |
| `--esp2`     | `#3d2210` | Hover variant of espresso                              |
| `--brown`    | `#7a4a2a` | Primary accent — italic emphasis, button text          |
| `--blt`      | `#a0724e` | Brown light                                            |
| `--sand`     | `#c4a882` | Sand — secondary tone                                  |
| `--text`     | `#2a1506` | Body text                                              |
| `--mid`      | `#6b4e36` | Secondary body text                                    |
| `--muted`    | `#a08568` | Captions / metadata                                    |
| `--rule`     | `#d8ccba` | 1px dividers                                           |
| `--canvas`   | `#fdfaf6` | Cards / step containers                                |
| `--rust`     | `#9a5a3a` | Tap-pulse indicator (animated dot)                     |
| `--sage`     | `#7a9478` | Success state                                          |

All values defined as CSS custom properties on `:root`.

### Typography

Three families, loaded from Google Fonts:

- **Display:** `Cormorant Garamond` — used for H1, step numbers, hero H1's italic emphasis. Loaded weights: 300, 400, 500 (regular + italic).
- **Body:** `DM Sans` — all paragraph copy, labels, buttons, captions. Loaded weights: 300, 400, 500.
- **Mono:** `JetBrains Mono` — only for the URL string inside the URL card.

Type scale (page-specific, not a generic scale):

| Element                | Family   | Size  | Weight | Line-height | Letter-spacing | Notes                       |
|------------------------|----------|-------|--------|-------------|----------------|-----------------------------|
| H1                     | Display  | 76px  | 400    | 1.0         | -0.01em        | em = brown italic           |
| Step number            | Display  | 56px  | 400    | 1.0         | -0.02em        | brown italic                |
| Step H3                | Display  | 22px  | 500    | 1.2         | -0.005em       |                             |
| Body paragraph         | Body     | 14px  | 300    | 1.7         | normal         | colour: --mid               |
| Step body              | Body     | 13px  | 300    | 1.6         | normal         | colour: --mid               |
| Label (eyebrow)        | Body     | 10px  | 500    | 1           | 0.18em         | uppercase, --muted          |
| URL string             | Mono     | 16px  | 500    | 1           | 0              | inside URL card             |
| Copy button            | Body     | 11px  | 500    | 1           | 0.12em         | uppercase                   |
| Footer caption         | Body     | 11px  | 400    | 1.55        | 0.04em         | --muted                     |

### Spacing

Page padding `64px 56px 80px`, hero vertical padding `56px 0 48px`, platform columns vertical padding `48px 0`, step gap `40px`, step inner gap `20px`. No formal spacing scale — values are layout-specific.

### Other tokens

- **Border radius:** the design is mostly **squared** (radius `0`). Only the URL pill in the phone-chrome mocks (radius `999px`) and the home-screen app icons (radius `8px` / `7px` for Android `26%`) use rounding.
- **Borders / rules:** `1px solid var(--rule)`. The vertical rule between platform columns is also 1px `var(--rule)`.
- **Shadows:** none on cards. The home-screen app icon uses a 2px brown ring + soft drop shadow: `box-shadow: 0 0 0 2px var(--brown), 0 6px 14px rgba(42,21,6,0.25);`.

---

## Components in detail

### Brand bar
- `display: flex; justify-content: space-between; align-items: center;`
- Padding-bottom 14px, 1px bottom rule.
- Logo: `<img>` of `assets/bodyforme-wordmark.png`, height 22px, width auto.
- Caption: 10px DM Sans 500, uppercase, `0.18em` tracking, colour `--muted`.

### Hero
- 2-column grid, gap 56px.
- H1 forces a manual `<br/>` after "Bodyforme" to control wrap.
- The phrase "home screen" is wrapped in `<em>` and styled `color: var(--brown); font-weight: 400;` (Cormorant's italic does the visual heavy-lifting).

### URL card
- `background: var(--esp); color: var(--linen);`
- Padding `22px 24px`, flex row with 18px gap.
- Left column: small label "OPEN IN YOUR BROWSER" (10px / 500 / 0.2em / colour `--sand`), then the URL in JetBrains Mono 16px / 500. The `/app` segment is wrapped in `<em>` and tinted `--sand`.
- Right: "Copy link" button — outline style, 1px solid `--sand`, padding `10px 16px`, no radius, 11px DM Sans 500, uppercase, 0.12em tracking, colour `--linen`.
- Button hover: `background: var(--sand); color: var(--esp);`
- Click behaviour copies `https://bodyforme.com.au/app` via `navigator.clipboard.writeText` then changes the button text to "Copied ✓" for 2 seconds. Class `.done` adds the success styling (sage background, espresso text).

### Platform column header
- Eyebrow label (e.g. "iPhone · iOS 16+") + small device pictogram (an SVG outline of the phone).
- Bottom rule.

### Step
- 2-column grid: text 1fr / phone-mock 240px wide.
- Step number is large display digit (56px Cormorant italic in `--brown`), positioned top-left of the text column.
- H3 (22px Cormorant 500) immediately under the number.
- Body paragraph below.
- **Tap-pulse indicator** — a 12px circle with `--rust` fill that pulses via `@keyframes pulse` on the element the user should tap. Class `.tap`, position absolute. Animation: `pulse 1.4s ease-in-out infinite`, scaling from 1 → 1.6 with opacity 0.9 → 0.

### Phone mock
- Outer: rounded "phone" shell (242×488, radius 36px, espresso background, 8px linen inner padding).
- Inner: linen viewport (radius 28px) containing:
  - **Status bar (`.sb`)** — 18px high strip with "9:41" left, signal/wifi/battery glyphs right.
  - **Browser chrome (`.chrome`)** — only present on browser-based steps. Back/forward buttons (8×8 SVG) flanking a `.url-pill` showing `🔒 bodyforme.com.au/app`. The pill is `--l2` background, 999px radius, 9px text in DM Sans.
  - **Webpage area** — a generic webpage placeholder, `--canvas` background, with stripes hinting at content. Some steps overlay an iOS share sheet, an "Add to Home Screen" row, a Chrome menu, or the install dialog.
  - **Home screen** — replaces the webpage on the final step. 4-column grid of `.home-app` tiles (each 40×40, radius 9px, `--l3` background). The Bodyforme tile (`.home-app.bf`) uses `assets/bodyforme-app-icon.png` as a `background-image`, `cover`, with the brown ring + drop shadow tokens above. Tap-pulse indicator anchored to top-right.

The Android variant of the mock is identical except:
- Status bar shows the time on the right.
- Browser chrome has Chrome's icon order (back arrow, URL pill, kebab menu).
- Home-screen tiles render slightly larger (44×44).
- The Chrome install dialog (step 4) is a bottom-sheet card with the app icon, name, URL, "Cancel" and "Install" buttons.

---

## Step content (verbatim)

### iPhone column (header: "iPhone · iOS 16+")

| # | H3                                                         | Body                                                                                                                                                                                                                          | Mock highlights                                            |
|---|------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| 1 | Open the link in Safari.                                   | Type or paste **bodyforme.com.au/app** into Safari's address bar. The browser must be Safari — not Chrome, not the in-app browser inside Instagram or Facebook.                                                              | Safari with URL pill highlighted (tap-pulse on URL).       |
| 2 | Tap the share button.                                      | At the bottom of Safari, tap the **share icon** — a square with an arrow pointing up out of it.                                                                                                                              | Bottom toolbar; tap-pulse on share icon.                   |
| 3 | Choose "Add to Home Screen".                                | Scroll down in the share sheet until you see **Add to Home Screen**. Tap it.                                                                                                                                                  | Share sheet with that row highlighted.                     |
| 4 | Tap "Add" in the top corner.                                | You'll see the Bodyforme icon and name — feel free to keep it as is, then tap **Add** in the top-right.                                                                                                                       | Confirmation dialog with app icon row and Cancel / Add.    |
| 5 | Open Bodyforme any time.                                    | The app icon now sits on your home screen. Tap it to launch — the browser chrome is hidden, just like a regular app.                                                                                                          | Home screen grid with Bodyforme tile pulsing.              |

### Android column (header: "Android · Chrome")

| # | H3                                                         | Body                                                                                                                                                                            | Mock highlights                                          |
|---|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| 1 | Open the link in Chrome.                                   | Type or paste **bodyforme.com.au/app** into Chrome's address bar. Chrome works best — Samsung Internet and Edge also support installing.                                       | Chrome with URL pill highlighted.                        |
| 2 | Tap the menu (⋮).                                           | In the top-right of Chrome, tap the **three vertical dots** to open the menu.                                                                                                   | Tap-pulse on the kebab.                                  |
| 3 | Choose "Install app" or "Add to Home Screen".              | A long menu opens — scroll until you see **Install app** (or on some phones, **Add to Home screen**). Tap it.                                                                  | Menu sheet with that row highlighted.                    |
| 4 | Confirm with "Install".                                    | A small dialog will pop up showing the Bodyforme icon. Tap **Install** (or **Add**) to confirm.                                                                                | Bottom-sheet install dialog with app icon + Install btn. |
| 5 | Open Bodyforme any time.                                    | The Bodyforme icon now sits with your other apps. Tap it to launch — full-screen, no browser bars.                                                                              | App drawer / home grid with Bodyforme tile pulsing.      |

### Footer
- Help: "Stuck? Email *hello@bodyforme.com.au* — or ask at the front desk — we'll get you sorted in a minute." (em = brown italic)
- Sign-off: "Bodyforme · Collingwood / Member App v1.0"

---

## Interactions & behaviour

- **Copy link button:** on click, write `https://bodyforme.com.au/app` to the clipboard, swap label to "Copied ✓", apply `.done` styling, revert after 2000ms. Falls back gracefully if `navigator.clipboard` is unavailable (try/catch, no error to user).
- **Tap-pulse animations:** pure CSS, infinite. No JS needed.
- **Hover states:** Copy link button hover swaps colours (sand bg, espresso text). No other hover states — the page is primarily mobile-consumed.
- **No navigation, no forms, no auth.** The page is purely informational.

### Print
- Use `@media print` to:
  - Hide the "Copy link" button (it's useless on paper).
  - Force `--linen` background to white-equivalent for ink savings, OR keep linen if the studio wants warm prints.
  - Page-break the platform columns so iPhone fills page 1 and Android fills page 2 if total height exceeds A4.
  - Currently the prototype prints in colour, single page per platform on A3, two pages on A4.

### Responsive
- Hero grid stacks below 900px.
- Platform grid stacks below 900px; vertical rule hidden.
- Phone mocks scale to a fixed 240px wide regardless of viewport (they read fine on phones).
- Page padding reduces to `40px 24px 56px` below 700px.

---

## State management
None. Static page, single ephemeral piece of state (the "Copied ✓" flash) handled with a setTimeout in vanilla JS.

---

## Assets

Both PNG assets are owned by Bodyforme and provided by the client:

| File                              | Origin / use                                                       | Size                |
|-----------------------------------|--------------------------------------------------------------------|---------------------|
| `assets/bodyforme-wordmark.png`   | Brand wordmark, transparent BG. Used in the page header.           | 8400×1187 (≈7.08:1) |
| `assets/bodyforme-app-icon.png`   | Square app icon, opaque grey BG with linen wordmark. Used in install-dialog rows + home-screen tile. | 12506×12506 (1:1)   |

Both files should be **downsized for production** — current sizes are master copies. Recommended exports:

- `bodyforme-wordmark.png` → 880×124 @1×, 1760×248 @2× (or SVG if available).
- `bodyforme-app-icon.png` → 192×192 + 512×512 PWA icons, plus a `180×180` `apple-touch-icon` for iOS Safari "Add to Home Screen".

When implementing the actual member app PWA, ship a proper `manifest.webmanifest` with these icons so the install flow shows the brand asset (which is what the guide is teaching).

---

## Files in this bundle

- `Bodyforme Install Guide.html` — the design reference. Open in any browser to view the prototype.
- `assets/bodyforme-wordmark.png` — header logo.
- `assets/bodyforme-app-icon.png` — app icon.
- `README.md` — this document.

---

## Suggested implementation notes

- This is a content page; React / Vue is overkill unless the host codebase already uses them. A static HTML / Astro / Eleventy page is ideal.
- The "Copy link" interaction can be inlined as ~10 lines of vanilla JS — no framework needed.
- Wire the Google Fonts import once at the page level; if the host site already loads Cormorant Garamond / DM Sans / JetBrains Mono, reuse those.
- Consider replacing the cartoon SVG phone mocks with real annotated screenshots once the actual PWA is live and screenshots can be captured. The mocks are placeholders that age — real iOS / Android UI shifts every release.
- The URL `bodyforme.com.au/app` is currently a placeholder; confirm the production URL with the client before publishing.
