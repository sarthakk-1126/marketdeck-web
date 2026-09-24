# MarketDeck Design System v1

Status: LOCKED FOR IMPLEMENTATION

MarketDeck must feel like one premium financial research platform with several workspaces, not several unrelated websites.

## Approved visual direction

- Dark navy / charcoal chrome
- Restrained electric-blue primary accent
- Compact, crisp, Linear-like control discipline
- High information density without clutter
- Thin borders and quiet surface elevation instead of heavy shadows
- Product-specific colors only when they communicate data meaning
- No random gradients, glassmorphism, giant pills, oversized SaaS controls, or decorative glow

## Canonical palette

bg: #0b0f14
bg-elevated: #0d131b
surface-1: #111720
surface-2: #161e29
surface-3: #1c2633
border: #263241
border-subtle: #1d2733
border-strong: #33445a
text: #f3f6fa
text-secondary: #b3bfce
text-muted: #7f8c9d
text-faint: #5e6b7b
primary: #3b82f6
primary-hover: #60a5fa
primary-active: #2563eb
primary-soft: rgba(59,130,246,.12)
primary-border: rgba(96,165,250,.35)
positive: #22c55e
negative: #ef4444
warning: #f59e0b
info: #22d3ee
focus: #60a5fa

Primary blue is for selected navigation, primary buttons, links, focus rings, and important interactive highlights. Positive/negative colors remain semantic. Product-specific accents may appear inside charts, badges, and data visualizations, but must not recolor the global shell.

## Typography

Preferred stack: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif.

Use a Linear-like discipline: compact, neutral, legible, mostly 400-600 weight.

- xs: 12/16
- sm: 13/18
- body: 14/20
- body-lg: 15/22
- h4: 16/22, 600
- h3: 18-20/26, 600
- h2: 24-28/34, 600
- h1: 32-40/44, 600
- marketing hero only: 48-64, 600-700

## Spacing

Canonical scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
Desktop page gutter: 24-32px. Tablet: 20-24px. Mobile: 16px.

## Radius

- small control: 6px
- standard control: 8px
- card: 10px
- large panel: 12px
- pill: 999px only for actual pills, tags, and status chips

## Controls

- standard button height: 36px
- compact button height: 30-32px
- large CTA: 42px
- standard input height: 38px
- focus: 2px solid #60a5fa with 2px offset

Primary buttons use the canonical blue. Secondary buttons use transparent or surface backgrounds with subtle borders. Hover/active states should be obvious but restrained.

## Cards and panels

Use surface-1/surface-2, a 1px subtle border, 10-12px radius, and no heavy drop shadow. Hero/workspace panels may use a subtle blue border tint and dark overlay over approved imagery.

## Icons

Typical sizes: 14px inline, 16px controls, 18px navigation, 20-24px feature tiles. Use a consistent outline style per repo where practical.

## Motion

Use 120-180ms functional transitions. Respect prefers-reduced-motion. Avoid continuous decorative animation in product workspaces.

## Data visualization

Charts may retain domain-specific colors. Positive remains green, negative red, and primary/neutral comparison blue/cyan. Do not destroy financial meaning for brand consistency.

## Responsive baseline

Required QA widths: 320, 375, 390, 430, 768, 1024, 1440+.
No horizontal page overflow. Intentional scroll inside navigation rails or dense data components is allowed.

## Non-negotiables

- Do not invent another product-wide palette.
- Do not hide the five-product switcher only behind a menu on mobile.
- Do not alter business logic to achieve a visual redesign.
- Do not replace meaningful chart colors with brand blue.
- Do not add unnecessary React/Next/Vite dependencies to legacy Django products.
- Do not redesign authentication semantics.
- Do not add oversized rounded SaaS controls.

The approved MarketDeck mockups are the visual reference. This document is the implementation contract.