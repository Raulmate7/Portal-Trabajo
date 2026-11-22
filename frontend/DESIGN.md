---
name: Portal Trabajo IT
description: The Engineering Compensation & Career Ledger — precision technical typography, cool stone paper, and cobalt blueprint accents.
colors:
  cobalt-blueprint: "#1f2de6"
  cobalt-hover: "#1722b8"
  cobalt-tint: "#e6e8fc"
  cool-paper: "#eef0f3"
  stone-subtle: "#e2e5ea"
  pure-surface: "#ffffff"
  carbon-ink: "#0b0c0e"
  slate-secondary: "#383e4a"
  slate-muted: "#555c69"
  pine-salary: "#0f7d45"
  pine-tint: "#e3f3ea"
  ochre-featured: "#9a5b13"
  ochre-tint: "#f9efe2"
  signal-crimson: "#c81e1e"
  signal-tint: "#fbe9e9"
  night-canvas: "#0a0d14"
  night-surface: "#131824"
  night-elevated: "#1a2130"
  silver-ink: "#e9edf3"
  cornflower-accent: "#5ab9fc"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  2xl: "72px"
  3xl: "120px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-blueprint}"
    textColor: "{colors.pure-surface}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-hover}"
  button-secondary:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 24px"
  card-ledger:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
---

# Design System: Portal Trabajo IT

## Overview

**Creative North Star: "The Engineering Compensation & Career Ledger"**

Portal Trabajo IT replaces the generic indigo/violet SaaS template look with the authority of a precision technical publication and real-time compensation ledger. Every screen is built on cool architectural paper (`#eef0f3`) and crisp white data sheets (`#ffffff`), structured by 1px hairline rules (`rgba(11, 12, 14, 0.12)`) and tabular monospace figures.

On **Persuade** surfaces (Home, Employer & Pricing landings), the layout follows strict one-section-per-screen discipline (`100svh` / `--h: 1` or `2`), opening with a live interactive `app-frame` of the job and salary engine rather than marketing decoration. On **Operate** surfaces (Job Search, Salary Calculators, Comparisons, Recruiter Dashboards), the world lends its typography, high-contrast neutral palette, compact density, and one signature visual move: the **Salary Percentile Ledger Bar** (`P25 · P50 · P75`). On **Read** surfaces (Career Guides, Blog, Market Reports, Glossary), the world owns the masthead and wayfinding rail while keeping the 65ch reading column calm and distraction-free.

**Key Characteristics:**
- **92% Neutral Architectural Canvas:** Cool paper grounds, white ledger sheets, and near-black carbon ink (`#0b0c0e`) let real company icons, salary badges, and data distributions carry the visual signal.
- **Zero Violet/Lavender:** The entire 270°–330° OKLCH hue range is permanently banned. Cobalt Blueprint (`#1f2de6`) is the sole action accent.
- **Size & Tracking over Boldness:** Headlines never use weights 700, 800, or 900. Weight 500 with tight negative tracking (`-0.035em` to `-0.045em`) creates sharp editorial authority.
- **Tabular Monospace Data:** Every salary, count, percentile, date, and technology tag is set in `Geist Mono` with `tabular-nums`.

## Colors

A high-contrast, light-first technical paper palette with an optional evening slate grade (`dark`) for night reading.

### Primary
- **Cobalt Blueprint** (`#1f2de6` light / `#5ab9fc` dark): Reserved exclusively for the primary action button, active navigation indicators, `:focus-visible` rings, and one inverted closing band.

### Secondary
- **Pine Salary** (`#0f7d45` light / `#34d399` dark): Semantic indicator for verified salary ranges, positive compensation deltas, and active status dots.
- **Ochre Featured** (`#9a5b13` light / `#f59e0b` dark): Semantic indicator for featured vacancies (`3px` left ledger bar) and sponsored educational resources.
- **Signal Crimson** (`#c81e1e` light / `#f87171` dark): Urgent hiring tags, destructive actions, and inline form validation errors.

### Neutral
- **Cool Paper** (`#eef0f3` light / `#0a0d14` dark): Main page ground (`--bg-canvas`).
- **Stone Subtle** (`#e2e5ea` light / `#1a2130` dark): Secondary ground for filter rails, code blocks, and table headers (`--bg-subtle`).
- **Pure Surface** (`#ffffff` light / `#131824` dark): Primary card, table, and `app-frame` surface (`--bg-surface`).
- **Carbon Ink** (`#0b0c0e` light / `#e9edf3` dark): Primary text and structural icons (`>15:1` contrast).
- **Slate Secondary** (`#383e4a` light / `#b4bece` dark): Body copy, snippets, and secondary cells (`>9:1` contrast).
- **Slate Muted** (`#555c69` light / `#8b95a7` dark): Timestamps, breadcrumbs, and helper labels (`≥5.2:1` contrast, passing WCAG AA at 13px).

### Named Rules
**The One Accent Rule.** Cobalt Blueprint (`#1f2de6`) occupies under 3% of any viewport outside an intentional inverted brand band. Never tint card backgrounds or section gradients with the accent color.
**The No-Violet Rule.** Any color token or Tailwind utility in the `indigo`, `violet`, or `purple` families is a build-blocking defect.

## Typography

**Display Font:** Geist (with `system-ui, -apple-system, sans-serif` fallback)
**Body Font:** Geist (with `system-ui, -apple-system, sans-serif` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace, SFMono-Regular, Menlo, monospace` fallback)

**Character:** Engineered, open, and unpretentious. `Geist` delivers crisp geometric legibility at 16px while looking architectural at 72px when set at weight 500 with tight tracking; `Geist Mono` turns salary tables and stack tags into scannable technical specifications.

### Hierarchy
- **Display** (`500`, `4.5rem / 72px` desktop · `2.375rem / 38px` mobile, `1.02` line-height, `-0.045em` tracking): Persuade hero `h1` only (max 3 lines, 45 characters).
- **Headline** (`500`, `3rem / 48px` desktop · `1.875rem / 30px` mobile, `1.08` line-height, `-0.035em` tracking): Persuade section `h2` and primary Read/Operate page `h1`.
- **Subheadline / H3** (`500`, `1.75rem / 28px` desktop · `1.375rem / 22px` mobile, `1.2` line-height, `-0.025em` tracking): Section subdivisions and major data card headers.
- **Title / Card Lead** (`500`, `1.125rem / 18px` to `1.25rem / 20px`, `1.35` line-height, `-0.015em` tracking): Job card titles, article titles, and lead paragraphs.
- **Body** (`400`, `1rem / 16px`, `1.625` line-height, max `62ch`–`68ch` measure): All readable descriptions, editorial prose, FAQ answers, and form inputs.
- **Small Meta** (`400`, `0.875rem / 14px`, `1.45` line-height): Company location line, table cells, and form labels.
- **Label / Mono** (`500`, `0.8125rem / 13px`, `1.25` line-height, `tabular-nums`, sentence case): Technology tags, salary pills, timestamps, and table column headers.

### Named Rules
**The 13px Floor Rule.** No text anywhere in the DOM—including legal notices, ad labels, badges, or keyboard shortcuts—may render below `13px` (`0.8125rem`).
**The Sentence Case & Weight 500 Rule.** Headings and labels use sentence case (except proper acronyms like `AWS`, `SQL`, `IT`, `RGPD`). Weights `700`, `800`, and `900` are banned on headings.

## Layout

- **Container (`.wrap`):** `width: min(100% - 2 * var(--gut), 1280px)` where `--gut` is `80px` on desktop (`≥1024px`), `48px` on tablet (`640px–1023px`), and `24px` on mobile (`<640px`). Equal left and right content edges on every section.
- **12-Column Grid (`.grid-12`):** 12 columns with a `24px` gap on desktop/tablet and `12px` gap on mobile.
- **Two Text Lines:** Every page establishes two vertical text alignments: the left `.wrap` line and the split line (column 6 start on 5/7 splits, or column 7 start on 6/6 splits). Centered text blocks wider than 6 columns are forbidden.
- **Mode-Specific Section Rhythm:**
  - **Persuade Surfaces:** Strict one-section-per-screen (`height: calc(var(--h, 1) * 100svh)` on desktop, growing naturally on mobile if stacked content exceeds 1 screen). Top padding `--padt: 120px` (`96px` mobile), bottom padding `--padb: 72px` (`48px` mobile).
  - **Operate & Read Surfaces:** Task-driven continuous vertical flow with `24px` grid gaps, sticky filter/TOC rails (`top: 88px`), and `48px` section breaks parted by full-width ground shifts (`--bg-canvas` to `--bg-surface`) or `1px` hairlines.

## Elevation & Depth

Surfaces are **flat by default**, separated by tonal ground steps (`#eef0f3` → `#ffffff` → `#e2e5ea`) and crisp `1px` borders (`rgba(11, 12, 14, 0.12)`). Decorative drop shadows, colored glows, and blurred glass panels are excluded.

### Shadow Vocabulary
- **Rest (`--shadow-none`):** `none`. All cards, tables, and inputs sit flat at rest with a `1px` border.
- **Interactive Lift (`--shadow-lift`):** `0 4px 12px -2px rgba(11, 12, 14, 0.08), 0 1px 2px 0 rgba(11, 12, 14, 0.04)`. Applied only on `@media (hover: hover) and (pointer: fine)` when a linked card lifts `translateY(-2px)`.
- **Overlay / Popover (`--shadow-overlay`):** `0 12px 32px -4px rgba(11, 12, 14, 0.16), 0 2px 6px -1px rgba(11, 12, 14, 0.08)`. Applied only to floating autocomplete menus, user profile popovers, and command menus.

### Named Rules
**The Two-Box Depth Rule.** Never nest more than two bordered containers deep (e.g., a section card holding an inner metric box). If a card holds an inner UI panel, the inner panel runs flush or drops its border.

## Shapes

Sharp technical geometry (`data-radius="sharp"`):
- **Small Controls & Badges (`--r-sm`):** `4px` (technology chips, salary badges, keyboard `<kbd>` hints).
- **Buttons, Inputs & Popovers (`--r-md`, `--r-btn`):** `6px` (all `44px` buttons and `48px` form fields).
- **Cards, Tables & App Frames (`--r-lg`):** `8px` (`JobCard`, `app-frame`, data tables, drawers).
- **Full Pills:** Banned on buttons and cards; allowed only on `6px` status indicator dots (`border-radius: 9999px`).

## Components

### Buttons
One button pair across the entire portal, minimum `44px` height (`48px` in mobile action bars and forms), `16px` label at weight `500`, `24px` horizontal padding, verb + object copy ("Explorar vacantes", "Publicar oferta", "Calcular percentil").
- **Primary (`.btn-primary`):** Solid Cobalt Blueprint (`#1f2de6`) background, `#ffffff` text, `6px` radius. Hover steps to `#1722b8`; `:active` scales to `scale(0.97)` in `120ms var(--ease-out)`.
- **Secondary (`.btn-secondary`):** `#ffffff` background (`#131824` dark), `1px solid var(--border-strong)`, `#0b0c0e` text. Hover shifts background to `--bg-subtle` (`#e2e5ea`).
- **Text Link (`.link-arrow`):** `#0b0c0e` or `#1f2de6` text at weight `500` with a `1px` underline that draws from left to right on hover and an inline `→` glyph.

### Chips & Badges
- **Technology Chip:** `Geist Mono` `13px/500`, `4px` radius, `1px solid var(--border-subtle)`, `--bg-subtle` fill, `min-height: 28px` inside cards (`44px` tap target when standalone in filter bars).
- **Salary Badge:** `Geist Mono` `13px/500`, `tabular-nums`, `4px` radius. When salary is known: `--status-emerald-tint` (`#e3f3ea`) background, `#0f7d45` text, `1px solid rgba(15, 125, 69, 0.28)`. When unknown ("Consultar"): `--bg-subtle` background, `--text-muted` text.

### Cards / Containers (`JobCard` & Ledger Rows)
- **Corner Style:** `8px` (`--r-lg`).
- **Background:** `--bg-surface` (`#ffffff` light / `#131824` dark).
- **Border:** `1px solid var(--border-subtle)`, shifting to `--border-strong` on hover with `translateY(-2px)` (gated by `@media (hover: hover) and (pointer: fine)`).
- **Featured / Sponsored Variant:** Adds a `3px` solid left border bar in `--status-amber` (`#9a5b13`) and a `13px` `Geist Mono` label `Destacada` or `Patrocinado · [Proveedor]`.

### Inputs / Fields
- **Style:** `48px` height, `6px` radius, `1px solid var(--border-strong)`, `--bg-surface` background, `16px` font size (prevents iOS auto-zoom).
- **Labels:** Visible `<label>` above every field at `14px/500` in `--text-primary`. Placeholders never replace labels.
- **Focus:** Instant `2px` outline in `--accent-primary` (`#1f2de6`) with `offset: 1px`; never animated.
- **Error:** Checked on submit; `1px solid var(--status-danger)` with `.field-error` message at `13px` directly beneath the field via `aria-describedby`.

### Navigation (`header.nav`)
- **Fixed Top Bar:** `position: fixed`, `height: 72px` desktop (`56px` mobile), opaque `--bg-surface` ground (no glass blur), `1px solid var(--border-subtle)` bottom hairline from first paint.
- **Items:** Logo mark + wordmark on the left `.wrap` line; 5 one-word nouns (`Empleos`, `Remoto`, `Salarios`, `Empresas`, `Recursos`) in the center at `15px/500`; account trigger + 1 primary button (`Publicar oferta`, `44px`) on the right `.wrap` line.
- **Mobile (`<640px`):** `44×44px` menu toggle opens a full-screen `100dvh` sheet with `56px` rows. Fixed bottom `nav.actionbar` (`64px + env(safe-area-inset-bottom)`) appears on Job Detail and Persuade pages once the hero CTA scrolls out of view.

### Signature Component: Salary Percentile Ledger Bar
Used across `salarios/`, `comparar/`, `job/[id]`, and `app-frame` previews. A flat `8px`-tall horizontal track in `--bg-subtle` showing the `P25` to `P75` interquartile band filled in `--status-emerald` (`#0f7d45`), a `2px` vertical carbon marker at the `P50` median (or the specific job's offered salary), and `Geist Mono` `13px` tabular figures aligned below the `Min`, `P25`, `Mediana`, `P75`, and `Max` ticks.

## Do's and Don'ts

### Do:
- **Do** use `Geist Mono` with `font-variant-numeric: tabular-nums` for every number, salary, percentage, date, and count.
- **Do** keep every interactive control at a minimum `44×44px` hit area (`48px` height on form inputs) and `16px` input font size.
- **Do** gate all `:hover` transforms and style shifts behind `@media (hover: hover) and (pointer: fine)`.
- **Do** render all monetization units (`AdBanner`, `AffiliateCourseCard`, `AmazonBooksWidget`) using the unified neutral ledger card with a `2px` ochre left rule and explicit `min-height` reservation.

### Don't:
- **Don't** use `indigo`, `violet`, or `purple` hues anywhere in CSS variables, Tailwind classes, or SVG illustrations.
- **Don't** place emojis (`📊`, `🚀`, `🔥`, `💼`, `🏆`, `⚖️`) inside headings, badges, table cells, or button labels.
- **Don't** animate keyboard-triggered actions (`/` search focus, autocomplete lists, instant filter toggles) or use scroll-triggered fade-ins (`whileInView`) on cards and rows.
- **Don't** nest bordered boxes more than 2 levels deep or render any text smaller than `13px`.
