# Confetti — Design System Brief for Claude Design

> Paste this entire document into Claude Design as context so every page, component, and screen stays visually consistent.

---

## App Identity

- **Name:** Confetti
- **What it is:** AI-powered lifestyle concierge for dining, nightlife, and experiences. Users describe a vibe ("date night, rooftop drinks, dive bar crawl") and Confetti builds a complete itinerary with real venues, reservations, walking + Lyft routes, and rewards.
- **Core metaphor:** Boarding pass — itineraries feel like airline boarding passes with Departure → Layover → Destination stops, airport-style neighborhood codes (GTN = Georgetown, CPH = Capitol Hill), and itinerary codes like CNFT-MOM-0510.
- **Gamification:** Users earn "Confetti" (the reward currency) by completing itineraries.
- **Personality:** Warm, editorial, opinionated, celebratory. Think a travel magazine meets a best friend who always knows where to go.

---

## Visual Philosophy

**"Cream paper + ink" — editorial, warm, opinionated.**

The entire app sits on warm cream paper (`oklch(0.97 0.022 88)`) with near-black ink text (`oklch(0.16 0.02 50)`). Cards are white, raised surfaces are slightly tinted cream. The feel is a beautifully printed magazine, not a cold tech product.

Key design principles:
- **Warm over cold** — cream backgrounds, gold accents, coral primary. Never blue-gray or sterile white.
- **Brutalist touches** — hard box shadows (`4px 4px 0 0 var(--ink)`) on key CTAs give punchy editorial energy.
- **Glass effects** — frosted glass panels (`backdrop-filter: blur(20px)`) for overlays and nav elements.
- **Grain texture** — subtle SVG noise overlay on hero sections for print-like texture.
- **3D tilt cards** — venue/experience cards lift and rotate on hover with colored glow halos.
- **Confetti animations** — particle bursts for celebrations (booking confirmed, itinerary completed).

---

## Color Palette

### Brand Colors (oklch values)
| Token | oklch | Hex approx | Usage |
|-------|-------|------------|-------|
| `--coral` | `oklch(0.68 0.22 32)` | #FF6B6B | **Primary** — CTAs, links, active states, the signature Confetti red-coral |
| `--pink` | `oklch(0.66 0.24 12)` | #EE5A9D | Gradient partner to coral, romantic/celebration vibes |
| `--purple` | `oklch(0.45 0.18 285)` | #8B5CF6 | **Accent** — secondary actions, nightlife/evening mood |
| `--teal` | `oklch(0.72 0.14 200)` | #06D6A0 | Success states, "booked" confirmations, EV/eco |
| `--gold` | `oklch(0.84 0.17 85)` | #FFD166 | Rewards, premium, time badges, warmth accents |

### Semantic Aliases
| Token | Maps to | Usage |
|-------|---------|-------|
| `--sun` | gold | Time/schedule elements |
| `--magenta` | pink | Romantic/celebration contexts |
| `--tangerine` | coral | Energy/action contexts |
| `--grape` | purple | Evening/nightlife contexts |

### Surface System
| Token | oklch | Purpose |
|-------|-------|---------|
| `--surface-0` | `oklch(0.97 0.022 88)` | Page background (cream) |
| `--surface-1` | `oklch(1 0 0)` | Card background (white) |
| `--surface-2` | `oklch(0.95 0.008 88)` | Raised/nested background |
| `--surface-3` | `oklch(0.92 0.012 88)` | Input/well background |

### UI Tokens
| Token | oklch | Purpose |
|-------|-------|---------|
| `--background` | `oklch(0.97 0.022 88)` | Warm cream page bg |
| `--foreground` | `oklch(0.16 0.02 50)` | Near-black ink text |
| `--ink` | `oklch(0.16 0.02 50)` | Alias for foreground |
| `--cream` | `oklch(0.97 0.022 88)` | Alias for background |
| `--border` | `oklch(0.88 0.012 88)` | Subtle warm borders |
| `--input` | `oklch(0.91 0.012 88)` | Input field backgrounds |
| `--ring` | `oklch(0.68 0.22 32)` | Focus ring (coral) |
| `--muted-foreground` | `oklch(0.45 0.02 280)` | Secondary/caption text |
| `--destructive` | `oklch(0.6 0.24 25)` | Error/danger states |

---

## Typography

### Font Stack
| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| **Display** | Bricolage Grotesque | Arial | Headlines (h1–h4), hero text, nav logo |
| **Serif** | Instrument Serif | Times New Roman | Italic accent text, taglines, editorial quotes |
| **Sans** | Inter | system-ui | Body text, UI labels, buttons, inputs |
| **Mono** | JetBrains Mono | ui-monospace | Codes, itinerary IDs, technical details |

### Type Scale (mobile-first)
| Token | Size | Usage |
|-------|------|-------|
| `--text-2xs` | 10px | Micro labels |
| `--text-xs` | 11px | Timestamps, badges |
| `--text-sm` | 13px | Captions, metadata |
| `--text-base` | 15px | Body text |
| `--text-lg` | 17px | Subheadings, card titles |
| `--text-xl` | 20px | h3 headings |
| `--text-2xl` | 24px | h2 headings |
| `--text-3xl` | 30px | Section headers |
| `--text-4xl` | 36px | h1 / hero headlines |
| `--text-5xl` | 48px | Display / splash text |

### Heading Style
- Font: `var(--font-display)` (Bricolage Grotesque)
- Weight: 700
- Letter spacing: -0.02em
- Line height: 1.15

### Body Style
- Font: `var(--font-sans)` (Inter)
- Size: 15px base
- Line height: 1.6
- Font features: `"ss01", "cv11"` (stylistic alternates)
- Antialiasing: webkit + moz smoothing enabled

---

## Gradients

| Name | CSS | Usage |
|------|-----|-------|
| `--gradient-hero` | `linear-gradient(135deg, coral, pink 60%, purple)` | Hero sections, splash backgrounds |
| `--gradient-vibe` | `linear-gradient(135deg, coral, pink)` | Vibe cards, mood indicators |
| `--gradient-warm` | `linear-gradient(135deg, coral, gold)` | Warm accent areas, rewards |
| `--gradient-cool` | `linear-gradient(135deg, purple, teal)` | Evening/nightlife elements |
| `--gradient-text` | `linear-gradient(90deg, coral, pink)` | Gradient text effect on headlines |
| `--gradient-gold` | `linear-gradient(135deg, gold, coral)` | Premium/reward badges |
| `--gradient-subtle` | `linear-gradient(180deg, cream 0%, slightly-darker-cream 100%)` | Subtle section separators |

### Hero Background Gradient
The landing hero uses a special animated multi-stop gradient that slowly shifts position:
```
linear-gradient(120deg, cream 0%, warm-peach 30%, warm-coral 55%, warm-gold 80%, cream 100%)
background-size: 300% 300%
animation: hero-shift 18s ease-in-out infinite
```

---

## Shadows

| Token | Style | Usage |
|-------|-------|-------|
| `--shadow-xs` | Minimal 1px drop | Inline elements |
| `--shadow-sm` | Light double-layer | Buttons, chips |
| `--shadow-md` | Medium depth | Cards at rest |
| `--shadow-lg` | Strong depth | Elevated cards |
| `--shadow-xl` | Deep float | Modals, popovers |
| `--shadow-pop` | Coral-tinted 20px glow | Featured/CTA cards |
| `--shadow-soft` | 8px subtle | Gentle card lift |
| `--shadow-card` | Double-layer editorial | Default card style |
| `--shadow-card-hover` | Enhanced card on hover | Card hover state |
| **`--shadow-brut`** | `4px 4px 0 0 var(--ink)` | **Brutalist CTA buttons** |
| **`--shadow-brut-lg`** | `6px 6px 0 0 var(--ink)` | **Prominent brutalist elements** |
| **`--shadow-brut-xl`** | `10px 10px 0 0 var(--ink)` | **Hero brutalist elements** |

---

## Border Radius

Base: `--radius: 1rem` (16px)

| Token | Size |
|-------|------|
| `--radius-sm` | 12px |
| `--radius-md` | 14px |
| `--radius-lg` | 16px |
| `--radius-xl` | 22px |
| `--radius-2xl` | 28px |
| `--radius-3xl` | 36px |

---

## Glass / Frosted Effect

```css
background: oklch(1 0 0 / 0.72);
border-color: oklch(1 0 0 / 0.2);
backdrop-filter: blur(20px);
```
Use for: navigation bars, floating panels, overlays, bottom sheets.

---

## Animations & Motion

### Easing Curves
| Token | Curve | Feel |
|-------|-------|------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Snappy exit |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy pop |
| `--ease-smooth` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Gentle ease |

### Transition Presets
| Token | Duration + Easing | Usage |
|-------|-------------------|-------|
| `--transition-pop` | 0.35s spring | Hover/press feedback |
| `--transition-fast` | 0.15s smooth | Quick state changes |
| `--transition-normal` | 0.25s expo | Standard transitions |

### Key Animations
- **`tap-press`**: Scale to 0.97 on `:active` (120ms) — all tappable elements
- **`reveal-up`**: Fade in + slide up 28px (0.7s) — scroll reveal for sections
- **`float`**: Gentle 8px vertical bob (5–8s loop) — decorative elements
- **`confetti-burst`**: Particle explosion with random X/Y offsets — celebration moments
- **`confetti-fall`**: Particles fall 360px with rotation (2.4s) — background confetti
- **`glow-pulse`**: Rotating conic gradient border (3s loop) — featured cards
- **`wiggle`**: ±2° rotation (4s loop) — playful accent elements
- **`blob`**: Organic border-radius morph (14s loop) — background shapes
- **`shine-sweep`**: Diagonal light sweep across cards (3s) — premium shimmer
- **`hero-shift`**: Background position shift (18s) — hero gradient movement
- **`pulse-glow`**: Box-shadow pulse with gold glow (2.4s) — attention-grabbing CTAs

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce` — they are disabled or set to `duration: 0.001ms`.

---

## Component Patterns

### Buttons
- **Primary CTA**: Coral background, white text, brutalist shadow (`shadow-brut`), `tap-press` active state, rounded corners (`radius-xl`)
- **Secondary**: Cream/transparent bg, ink border, ink text
- **Ghost**: No background, coral text, hover bg tint

### Cards
- White background (`surface-1`)
- `shadow-card` at rest → `shadow-card-hover` on hover
- `radius-xl` corners
- Optional: `tilt-3d` class for 3D hover lift with colored glow (`.glow-coral`, `.glow-gold`, `.glow-purple`, `.glow-teal`, `.glow-pink`)
- Optional: `grain` class for subtle print-texture overlay

### Navigation
- Glass effect background
- Logo in `font-display` (Bricolage Grotesque), lowercase "confetti"
- Pill-shaped active indicator with coral dot
- `nav-underline` hover effect (ink underline scales in from left)

### Boarding Pass (Itinerary)
- White card with dashed border separators
- Airport-style codes in `font-mono`
- Time badges with colored backgrounds (coral, purple, gold)
- Status badges: "RESY", "WALK-IN", "LYFT" in uppercase mono
- Bottom stats bar: stops count, duration, estimated cost
- "BOOKED ✓" badge in teal
- CTA: Full-width coral button "Try this plan →"

### Badges & Pills
- Small rounded pills
- Background: brand color at reduced opacity
- Text: matching brand color, `text-xs` or `text-sm`, uppercase tracking

### Input Fields
- Background: `surface-3`
- Border: `--border` color
- Focus: 2px coral ring with 2px offset
- Rounded: `radius-md`

---

## Spacing

4px base grid system:
- `--space-1`: 4px (micro gaps)
- `--space-2`: 8px (tight padding)
- `--space-3`: 12px (compact spacing)
- `--space-4`: 16px (standard padding)
- `--space-6`: 24px (section gaps)
- `--space-8`: 32px (card padding)
- `--space-12`: 48px (section margins)
- `--space-16`: 64px (major sections)
- `--space-20`: 80px (hero spacing)

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default content |
| `--z-card` | 1 | Cards, raised elements |
| `--z-sticky` | 10 | Sticky headers |
| `--z-nav` | 20 | Navigation bar |
| `--z-overlay` | 30 | Overlays, drawers |
| `--z-modal` | 40 | Modals, dialogs |
| `--z-toast` | 50 | Toast notifications |

---

## Accessibility

The design system includes built-in support for:
- **High contrast mode** (`.a11y-high-contrast`): Removes all warmth, pure black-on-white, 3px focus outlines
- **Colorblind-friendly mode** (`.a11y-colorblind`): Okabe-Ito palette mapped to brand slots, safe for all types of color vision deficiency
- **Reduced motion**: All animations disabled, scroll-behavior set to auto
- **Focus visible**: 2px coral outline with 2px offset on all interactive elements
- **Selection**: Gold tint on text selection

---

## Do's and Don'ts

### DO
- Use cream (`surface-0`) as the default page background, never pure white
- Use brutalist shadows on primary CTAs for editorial punch
- Use `font-display` (Bricolage Grotesque) for all headings
- Use `font-serif` (Instrument Serif) italic for taglines and editorial quotes
- Use the `tap-press` class on all tappable elements
- Use `reveal-up` animation for scroll-triggered section entrances
- Apply `grain` texture on hero/feature sections for print feel
- Use colored time badges (coral/purple/gold) in itinerary cards
- Keep the boarding pass metaphor consistent: Departure → Layover → Destination

### DON'T
- Don't use cold blues, grays, or sterile whites as backgrounds
- Don't use flat/material design shadows — use the layered editorial shadows
- Don't use system fonts — always load Bricolage Grotesque, Instrument Serif, and Inter
- Don't skip the warm cream tint on backgrounds
- Don't use sharp corners (minimum radius-md / 14px on cards)
- Don't reference Heritage Power Group anywhere in Confetti materials
- Don't use generic list-style itineraries — always use the boarding pass format
