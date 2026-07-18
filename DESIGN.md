# Design

The visual system for **aakriti** (आकृति, "form / shape"). Source of truth for tokens is `src/app/globals.css`; this document explains the intent so future work stays coherent. Register: **product**. Platform: **web** (desktop-first; a full-screen gate blocks sub-desktop viewports).

## Theme

Warm-monochrome, editorial, mild-brutalist. A calm paper/ink ground carries ~95% of every surface; **marigold is a rare accent** reserved for focus rings, the running state, and the आ mark. Structure is drawn with 1px hairlines, not shadows — surfaces rest flat and earn only a whisper of elevation on hover. Both light and dark are first-class; dark is a neutral near-black (no yellow cast), with warmth surviving in the off-white ink and the marigold accent.

Color strategy: **Restrained** — tinted neutrals + one accent. A single loud moment is permitted where it means something (a running execution).

## Color

Semantic tokens flip automatically between light and `.dark`. Never hardcode raw Tailwind palette colors (`text-green-600`, `bg-neutral-800`, `bg-black`); always route through a token so both themes and future retints stay correct.

### Core roles
- `--background` / `--foreground`: warm bone `#faf6ee` / warm charcoal `#1a1714` (light). Never pure black or pure white — ink is `#1a1714`, paper is `#faf6ee`.
- `--card`, `--popover`: white (light) / `#161618` (dark).
- `--primary`: ink (light) / off-white (dark). The monochrome CTA. Inverts by theme.
- `--secondary`, `--muted`, `--accent`: deeper-bone neutral surfaces / neutral hover washes.
- `--muted-foreground`: `#7a6f5d` (light, ~4.6:1 on paper) / `#989791` (dark). Watch this on tinted surfaces — it rides the AA line; bump toward ink if it lands on anything lighter than paper.
- `--border`: hairline `#e7e0d2` (light) / `#3b3b3f` (dark). `--border-strong` for rare emphasis.
- `--ring`: **marigold** `#ffb200` — the focus accent, in both themes.

### Accent & semantic
- `--highlight`: marigold `#ffb200`. The one accent; use once or twice per view, never as chrome.
- `--destructive`: `#c0392b` (light) / `#e8645a` (dark). Darkened so it clears AA as both text and white-on-red button.
- `--warning`: deep saffron `#9a6700` (light) / `#e6b64a` (dark). A real caution role, distinct from the marigold accent. Used by badge/alert/sonner warning variants and inline constraint hints.
- Status: `--status-idle` (stone), `--status-running` (marigold), `--status-completed` (leaf `#2f8f5b`), `--status-failed` (red).

### Canvas data spectrum (canvas only)
`--data-string` indigo · `--data-image` vermilion · `--data-video` marigold · `--data-number` peacock · `--data-boolean` leaf · `--data-json` rani · `--data-file` sky · `--data-any` stone. These encode connection/handle type on the canvas and appear nowhere else. **Never rely on these colors alone** — pair with a handle label so color-blind users aren't excluded.

## Typography

Three families, paired on a contrast axis (serif + geometric + mono), never two similar sans:
- `--font-display` — **Instrument Serif** (editorial serif). Reserved for hero/display moments only: dashboard/section headings (`font-display`), empty-state headlines, the desktop-gate headline, the wordmark. Not for UI labels or body.
- `--font-sans` — **Space Grotesk** (medium, tight tracking). Carries all UI: headings default to this, buttons, labels, body, data.
- `--font-mono` — **Space Mono**, UPPERCASE, wide tracking. Meta labels and eyebrows via the `ak-eyebrow` utility. Section labels ("Nodes", "Quick Access", "Execution history"), timestamps, and file meta are mono.
- `--font-devanagari` — **Tiro Devanagari Hindi**, for the आ glyph only.

Headings default to Space Grotesk 600 at `--tracking-tight` (-0.015em), line-height 1.2. Product-register scale is fixed rem, not fluid clamp.

## Spacing, radii, elevation

- Radii: soft, minimalist — `--radius` 8px base; `sm` 5px … `3xl` 28px. Not pill.
- Shadows: ultra-diffuse, low-opacity (`--shadow-xs` … `2xl`). Surfaces are flat; hover earns `shadow-sm`/`md`. No hard slabs, no glow.
- Borders: `--border-1` 1px is the hairline standard. 1.5px/2px are rare emphasis.

## Components

Every interactive component ships default / hover / focus / active / disabled / loading / error — don't ship half. Consistent affordances: same button shape, same form-control vocabulary, same icon style across surfaces. Never fake an affordance (no `Badge` styled as a clickable button with no handler).

- **Button** (`cva`): monochrome ink `default`/`primary`; rare marigold `brand`/`highlight`; `secondary`, `outline`, `ghost`, `link`, plus canvas/sidebar variants. Press feedback: `active:scale-[0.97]`. Focus ring is marigold with offset.
- **Card**: 1px hairline, soft radius, flat by default. `pressable`/`file-item`/`image-thumbnail` add border+`shadow-sm` on hover; `node` for canvas; `selected` adds a marigold ring.
- **Badge**: solid `default`/`secondary`; **status/semantic badges use quiet tints** (`bg-<hue>/12` + `text-foreground` + hued icon) so they clear AA and color is never the sole signal. Running execution is the one loud badge (marigold + ink).
- **Skeletons** for loading (not spinners mid-content), and they must mirror the real component's footprint to avoid layout shift.
- **Empty states** teach the surface: brand-relevant icon (muted), editorial serif headline, muted subcopy — not "nothing here."
- Clerk auth is themed to these tokens (`AuthProvider` appearance) — hairline borders, mono dividers, serif title, ink CTA.

## Motion

Motion conveys state; it is never decoration. 90/150/240ms durations (`--dur-fast`/`--dur`/`--dur-slow`); UI transitions stay under 300ms. Easing: `--ease-snap` (`cubic-bezier(0.2,0,0,1)`) for most UI, `--ease-out` for progress. Never `transition-all` — name the properties. Never `ease-in` on UI.

- **Execution is the motion budget.** Running nodes get a marigold ring pulse (`node-pulse`); edges march their sparkle (`edge-march`) **only while part of an active run** (`animated` driven by running node ids) — idle edges rest static so the live path stands out. This is the core "trust through visibility" signal.
- Buttons scale on press. Accordion chevrons rotate. Theme toggle crossfades sun/moon.
- `prefers-reduced-motion: reduce` is honored globally (durations collapse to ~0). Every animation must degrade to a crossfade/instant state.

## Accessibility

Target **WCAG AA**. Body text ≥ 4.5:1, large/bold ≥ 3:1. Verified: destructive and status colors darkened/tinted to clear AA; `muted-foreground` passes on paper (watch it on tinted surfaces). Focus is always visible (2px marigold ring, 2px offset). Canvas data-spectrum colors are always paired with a text label — color is never the sole signal. Reduced-motion has full alternatives.
