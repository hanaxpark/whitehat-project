---
name: DevTalk Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#005b7c'
  on-tertiary: '#ffffff'
  tertiary-container: '#00759f'
  on-tertiary-container: '#e1f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 48px
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  code-snippet:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system serves a modern, developer-centric knowledge exchange and community platform. The visual aesthetic is pragmatic, highly legible, structured, and engineering-grade—prioritizing content legibility, fast scanability, and predictable interaction models.

Drawing from modern technical documentation and contemporary developer hubs, the aesthetic combines a high-contrast dark navy global shell (`#0F172A`) with a crisp, low-fatigue slate light canvas (`#F8FAFC`). Vibrant royal blue (`#2563EB`) acts as the focal accent for primary actions, current navigation states, and code/tag badges, creating immediate visual affordance across dense listings and threaded technical discussions.

## Colors

The palette balances utility and clarity across structured data interfaces:

- **Primary (`#2563EB`)**: Emphasizes active links, call-to-action buttons, key interactive icons, and focused states. Light tint surfaces (`#EFF6FF`) paired with primary text establish category badges and metadata chips.
- **Secondary (`#0F172A`)**: The foundational dark slate tone used for the top navigation header bar, primary headline text, and modal header anchors. Provides firm visual weight without the harshness of pure black.
- **Surface & Backgrounds**: The main canvas runs on neutral canvas `#F8FAFC`, against which modules and cards pop in pure white `#FFFFFF` bounded by crisp slate borders `#E2E8F0`.
- **Neutrals & Typography hierarchy**:
  - `Title / Primary Text`: `#0F172A`
  - `Body / Subtitle Text`: `#334155`
  - `Muted / Secondary Text`: `#64748B`
  - `Placeholder / Border Inactive`: `#94A3B8` / `#E2E8F0`
- **Functional Semantics**:
  - `Success`: `#16A34A`
  - `Warning / Notice`: `#EA580C`
  - `Danger / Destructive`: `#DC2626`
  - `Tag Background`: `#EFF6FF` with text `#2563EB`

## Typography

The typographic hierarchy is optimized for mixed Korean and English technical content. The primary sans-serif family provides clarity across tiny metadata tokens (such as timestamps, like counts, and view counters) as well as long-form technical explanations and multi-tier headings.

- **Headlines & Article Titles**: Set in weights 600 to 800 with tight line-height to guarantee high readability and instant scanning within thread cards.
- **Body Content**: Set in weight 400 with a relaxed line height (`1.6x` ratio) to support lengthy reading during architectural tutorials or bug troubleshooting.
- **Metadata & Tags**: Condensed 11–13px sizes in medium weight (500) prevent UI clutter while maintaining legibility against light-tint pill containers.

## Layout & Spacing

The layout is built upon an adaptive 12-column grid anchored inside a maximum container width of `1200px` for standard pages, and `1440px` for expanded viewports:

- **Desktop (1024px+)**: Employs a dual or triple-column layout:
  - Left navigation sidebar: fixed `220px` to `240px` for category taxonomy.
  - Center feed: flex-1 fluid column for card lists or article reading.
  - Right peripheral: optional `280px` for trending topics, author bios, or table of contents.
- **Tablet (768px – 1023px)**: Left navigation collapses into an off-canvas drawer or a horizontal scrolling filter rail; content area expands to full-width minus margins.
- **Mobile (< 768px)**: Single column with `1rem` outer canvas padding. Action buttons, header search triggers, and tabs compress into sticky top/bottom bars.
- **Rhythm**: Element spacing uses the standard 4px/8px modular scale (`0.25rem` to `2rem`), maintaining clean vertical rhythm inside card bodies and form field groupings.

## Elevation & Depth

This design system uses a flat, structural border-first approach paired with subtle, low-intensity ambient depth:

- **Level 0 (Flat Surface)**: Background canvas `#F8FAFC` and standard card resting states. Cards are articulated by a 1px border (`#E2E8F0`) rather than drop shadows.
- **Level 1 (Card / Container Resting)**: Background `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.05)`. Used for article summary items, comment boxes, and profile stats blocks.
- **Level 2 (Hover & Floating Elements)**: Border transitions to `#CBD5E1`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`. Applied to interactive cards on hover, tooltips, and filter popovers.
- **Level 3 (Modals & Overlays)**: Shadow `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, bounded by a 1px border (`#E2E8F0`) and supported by a dark backdrop overlay (`#0F172A` at 60% opacity).

## Shapes

The geometric framework uses **Soft (`roundedness: 1`)** geometry:
- Standard elements (inputs, standard buttons, code blocks, cards): `0.25rem` (4px) to `0.375rem` (6px) border-radius.
- Cards, modal panels, and rich-text containers: `rounded-lg` (`0.5rem` / 8px).
- Badges, category tag pills, and user avatar shapes: small pills maintain a compact `9999px` fully rounded radius, while user avatars follow circular `50%` curvature to establish warm human anchors against rectilinear forum cards.

## Components

### Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, radius `4px` (`0.25rem`), horizontal padding `1rem`, height `38px` (`sm` 32px, `lg` 44px). Hover state `#1D4ED8`. Active state `#1E40AF`.
- **Secondary / Ghost**: White background `#FFFFFF`, border `1px solid #CBD5E1`, text `#334155`. Hover background `#F1F5F9`.
- **Top Bar Action**: Inside the dark header (`#0F172A`), primary buttons keep the `#2563EB` fill, while secondary auth buttons display transparent backgrounds with white text.

### Tags & Chips
- **Category & Hash Tags**: Background `#EFF6FF`, border `transparent`, text `#2563EB`, weight `500`, font size `12px`, padding `3px 8px`, radius `4px` or pill. On hover, background shifts to `#DBEAFE`.

### Form Fields & Inputs
- **Text Inputs & Selects**: Height `40px`, border `1px solid #CBD5E1`, background `#FFFFFF`, padding `0 12px`, placeholder color `#94A3B8`.
- **Focus State**: 1px border `#2563EB` with an ambient outer focus ring `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15)`.
- **Search Bar (Global Header)**: Dark tint background `#1E293B`, border `1px solid #334155`, text `#F8FAFC`, placeholder `#64748B`, icon embedded inside left margin.

### Feed & Article Cards
- **Post Item Card**: Background `#FFFFFF`, 1px border `#E2E8F0`, padding `1rem 1.25rem`, border-radius `6px`.
- Structure: Author avatar (32px circular) + author name + timestamp row on top or integrated; bold post title (`#0F172A`); compact tags container; footer row with interactive like and comment counts right-aligned (`#64748B`).

### Checkbox & Radio Controls
- Square checkbox (`16px x 16px`) with `3px` corner radius. Unchecked border `#CBD5E1`. Checked background `#2563EB` displaying a crisp white SVG check icon.

### Technical Elements & Code Blocks
- Inline code: background `#F1F5F9`, text `#0F172A`, font-size `0.875em`, padding `2px 5px`, radius `3px`.
- Code Snippet Box / Pre-formatted View: Background `#0F172A`, text `#E2E8F0`, syntax accent colors, border-radius `6px`, padding `1rem`.