# Design — ChineseDict Learning Product

A locked design system for the learning application. Product pages optimize
learning clarity and task completion before visual decoration.

## Genre

Modern-minimal learning product with a warm, encouraging and lightly playful voice.

## Macrostructure family

- Public client pages: app-aligned utility surfaces; no standalone marketing homepage.
- App pages: Workbench — one primary learning task, persistent progress, a desktop learning rail and compact mobile bottom navigation.
- Content pages: Guided document — compact header, readable content column, contextual actions.

## Theme

Warm cream paper is the default background. Sky blue is reserved for selected,
active, progress, and focus states rather than tinting the whole page.

- `--color-paper`: oklch(98.5% 0.009 86)
- `--color-paper-2`: oklch(96.7% 0.012 86)
- `--color-ink`: oklch(23% 0.035 255)
- `--color-ink-2`: oklch(42% 0.035 255)
- `--color-rule`: oklch(89% 0.018 255)
- `--color-accent`: oklch(50% 0.16 235)
- `--color-focus`: oklch(44% 0.18 235)

## Typography

- Display: Trebuchet MS, weight 700, style normal.
- Body: Inter/system UI, weight 400–700.
- Mono: ui-monospace, weight 600.
- Display tracking: -0.025em.
- Type scale anchor: `--text-display = clamp(2rem, 4vw, 3.25rem)`.

## Spacing

Four-point named scale defined in `frontend/tokens.css`. Product pages use
named tokens for new UI and avoid one-off spacing values.

## Motion

- Ease-out: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Reveal pattern: short fade plus a maximum 8px translation.
- Reduced motion: opacity-only, at most 120ms.

## Microinteractions stance

- Silent success; progress changes in place.
- Visible focus rings on every interactive element.
- Minimum 44px touch targets.
- No confirmation for reversible learning actions.

## CTA voice

- Primary: solid accessible azure, compact rounded rectangle, verb-first label.
- Secondary: paper surface with a visible rule, no gradient.

## Per-page allowances

- Marketing pages may use visual enrichment.
- App pages must not use stock or marketing enrichment; learning content carries the page.
- Dashboard may use a restrained CSS-only Chinese-character motif inside the primary lesson panel.
- The dedicated `/beginner` module uses a Narrative Workflow with an F4 six-step sequence and a functional SVG progress path.
- Beginner learning cards use a compact 14–16 px reading scale while preserving 44 px interactive targets.
- Study pages may use only functional diagrams, vocabulary images, and audio controls.
- Auth, pricing, and legal pages remain inside the product system rather than switching to a landing-page theme.

## What pages MUST share

- ChineseDict wordmark.
- Accent blue used mainly for the current task and focus.
- Display/body type pairing.
- Button height, focus treatment, and progress language.
- “Continue next” is visually stronger than browsing alternatives.

## What pages MAY differ on

- Supporting rail placement.
- Whether progress is a horizontal strip or compact summary.
- Density according to browse mode versus active study mode.

## Exports

The canonical CSS export is [`frontend/tokens.css`](frontend/tokens.css).
