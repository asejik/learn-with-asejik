# DESIGN SYSTEM: Warm Editorial Studio (Direction B, adopted 2026-11-25)

> **Project**: Learn with Asejik  
> **Standard**: P05 UI Design Direction  
> **Core Archetype**: Warm editorial publication (cream paper, ink text, one terracotta accent, serif headlines, small monospace labels). Reference sites: The Neuron Academy and System Design Tutorial.  
> **Primary Viewport Target**: 375px Android mobile on metered data  
> **Interactive Payload Ceiling**: < 200 KB per lesson (optional tap-to-load runtimes, e.g. a code runner, are extra and cached after first use)  
> **Replaces**: Direction A (cold slate and cobalt). The mock the owner approved is the private Design artifact "Learn with Asejik: Design Mock".

---

## 1. Brand Personality & Philosophy

- **Personality**: Warm, clear, confident, practical. A good magazine, not a dashboard.
- **Tone**: Plain words, short sentences. No marketing filler, no invented numbers, no testimonials or logos we do not have.
- **Never**: purple or pink neon gradients, glassmorphism, stock photos, emoji as decoration, centred hero cards with vague copy.
- **Core Mantra**: *Restraint beats effects.* Type, spacing and one accent colour carry the design.

---

## 2. Color System & Accessibility (WCAG 2.2 AA)

Colours live in `tailwind.config.ts`; that file is the source of truth. The existing class names stay (`slate-*`, `brand-*`, `white`), and the config maps them to the warm palette, so components do not change when the palette does:

- `white` = warm card paper `#FBF7EF` (not pure white).
- `slate-*` = the warm neutral scale below.
- `brand-*` = terracotta.

### 2.1 Surfaces & Ink (measured contrast against page paper `#F6EFE3`)
| Token | Hex | Use | Contrast on paper |
| :--- | :--- | :--- | :--- |
| `slate-50` | `#F6EFE3` | Page paper | Base |
| `white` | `#FBF7EF` | Cards, drawers, sheets | Lighter than paper |
| `slate-100` | `#EFE6D6` | Muted fills, inactive chips | Subtle |
| `slate-200` | `#D9CDBB` | Hairline borders and dividers | Structural |
| `slate-300` | `#C4B6A1` | Disabled borders | Structural |
| `slate-400` | `#8F8070` | Icons only, never text | 3.35:1 |
| `slate-500` | `#6B5E52` | Muted text, metadata | 5.49:1 |
| `slate-700` | `#4A4037` | Body text | 8.84:1 |
| `slate-900` | `#1B1612` | Headings, ink, dark bands | 15.7:1 |

### 2.2 Accent: Terracotta
| Token | Hex | Use | Contrast |
| :--- | :--- | :--- | :--- |
| `brand-50` | `#FBEBDD` | Selected option fill, tag fill | with `brand-800` text 8.4:1 |
| `brand-100` | `#F6D5BD` | Soft highlights | |
| `brand-500` | `#C65F2B` | Large display accents and illustration only | not for small text |
| `brand-600` | `#A94A1C` | Primary buttons, links, active states | 4.99:1 on paper; cream text on it 5.34:1 |
| `brand-700` | `#8F3C14` | Link hover, eyebrow labels | 6.51:1 on paper |

Rule: terracotta is the only accent. Small text uses `brand-600` or darker. `brand-500` is for big headline words and shapes.

### 2.3 Semantic Feedback & Status (Always Paired with Icons)
Unchanged and kept apart from the accent so correct, wrong and info never look like branding. Color is never the only signal.

| State | Background | Border / Accent | Icon | Text |
| :--- | :--- | :--- | :--- | :--- |
| **Correct** | `emerald-50` | `emerald-600` | `CheckCircle2` | `emerald-800` |
| **Incorrect** | `amber-50` | `amber-600` | `AlertTriangle` | `amber-800` |
| **Discovery / Info** | `sky-50` | `sky-600` | `Info` | `sky-800` |
| **Danger / Error** | `rose-50` | `rose-600` | `XCircle` | `rose-800` |

---

## 3. Typography Hierarchy & Weight Budget

Weight budget: **one downloaded family**. Headlines use Fraunces (serif), Bold 700, upright and italic (two latin files, about 41 KB, cached after the first visit). Body, controls and everything else use the system UI font (no download). Labels use the system monospace. This is smaller than the old Inter file (48 KB), so fonts cost less than before.

- **Display & Headings**: `font-display` (Fraunces 700). One word of a headline may be italic and terracotta (`brand-500` at display sizes only).
- **Body & Controls**: `font-sans` (system UI). Regular 400, Medium 500, Semibold 600.
- **Labels & Metadata**: `font-mono` (system mono), small, uppercase, wide tracking. Used for eyebrows, lesson counts and times.

### Type Scale
| Level | Mobile (375px) | Desktop (1280px) | Font | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Display / H1` | `40px` | `64px` | display | `leading-[1.04] tracking-tight` |
| `H2 (Section)` | `30px` | `42px` | display | `leading-tight tracking-tight` |
| `H3 (Card/Title)` | `22px` | `26px` | display | `leading-snug` |
| `Body Standard` | `16px` | `18px` | sans | `leading-relaxed` |
| `Body Compact` | `14px` | `15px` | sans | |
| `Label / Meta` | `11px` | `12px` | mono | `uppercase tracking-[0.12em]` |

---

## 4. Spacing, Ergonomics & Touch Targets

### 4.1 The 44px Thumb-First Rule
Every interactive touch target (buttons, choice options, tag pills, drawer toggles, pagination dots) has a **minimum hit area of $44 \times 44\text{ px}$**.

```css
/* Tailwind touch utility */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### 4.2 Spacing Scale
- `space-1` = `4px` (micro gaps, icon-to-label)
- `space-2` = `8px` (button internal padding, pill gaps)
- `space-3` = `12px` (card content separation, compact rows)
- `space-4` = `16px` (standard container mobile padding)
- `space-6` = `24px` (major section gaps, desktop padding)
- `space-8` = `32px` (screen top/bottom margins)

---

## 5. Shape, Depth & Elevation

- **Borders**: Sharp, crisp 1px borders (`border border-slate-200`) define surfaces rather than diffuse colorful shadows.
- **Radii**:
  - `rounded-lg` (`8px`): Small badges, code chips, tag buttons.
  - `rounded-full`: Primary and secondary action buttons (pills), nav call-to-action.
  - `rounded-xl` (`12px`): Interactive choice tiles and text inputs.
  - `rounded-2xl` (`16px`): Catalog cards, lesson content containers, bottom sheets.
  - `rounded-full`: Stepper indicator dots, avatar badges.
- **Shadows**:
  - Subtle crisp elevation: `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
  - Floating sheets/drawers: `shadow-xl` (`0 20px 25px -5px rgb(0 0 0 / 0.1)`).

---

## 6. Motion Philosophy & Durations

- **Constraint**: Zero ambient or looping animations. Scrolling must maintain 60fps on low-end Mali/Adreno GPUs.
- **Transitions**: Pure CSS hardware-accelerated transforms (`transform: translateY(...)`, `opacity`).
- **Scale**:
  - `duration-150` (`150ms`, `ease-out`): Button taps, radio option selection, checkbox ticks.
  - `duration-250` (`250ms`, `ease-out`): Bottom-sheet slide-up, glossary drawer expansion.
  - `duration-300` (`300ms`, `ease-in-out`): Horizontal progress bar width fill.
- **Accessibility**: All animations automatically collapse when `prefers-reduced-motion: reduce` is detected.

---

## 7. Signature Moments (The 3 Defining Details)

1. **Segmented Progress Rail**:  
   At the top of the lesson player, a segmented rail of pill dashes represents each screen in the lesson. As the learner advances, the active pill fills with terracotta (`brand-600`) in a crisp 250ms transition.
2. **Immediate Slide-Up Feedback Bottom Sheet**:  
   Upon submitting an active recall check, an immediate bottom sheet emerges from the bottom on mobile (or right-hand panel on desktop). It pairs a prominent colored icon badge (`CheckCircle2` or `AlertTriangle`) with a crisp verdict and an indented, high-retention "Bonus Fact" or corrective explanation.
3. **Inline Dotted Glossary Drawer**:  
   Technical terms within lesson prose have a subtle dotted underline (`border-b border-dotted border-slate-400`). Tapping the term turns it terracotta and slides open a compact definition drawer without ever opening a new browser tab.

---

## 8. Compliance, Trust & Data Protection Components

1. **Explicit Consent Checkbox (NDPA 2023 / GAID 2025)**:  
   - Never pre-ticked.
   - Checkbox hit target: minimum $44 \times 44\text{ px}$.
   - Accompanied by a clean direct link: `"I consent to the processing of my email under the [Privacy Notice](/privacy)"`.
2. **Clear Local Data Button**:  
   - Located in the catalog footer and lesson drawer.
   - Clear warning modal before clearing IndexedDB progress.
3. **Click-to-Play Media Gate**:  
   - Any audio/video placeholder renders a crisp poster card with a prominent play icon and exact file size badge (e.g. `▶ Play audio clip (48 KB)`).
   - Zero preload or autoplay under any circumstances.

---

## 9. Tailwind CSS Configuration

The palette, font family and tap-size tokens are defined in `tailwind.config.ts`, which is the source of truth (a copy here would drift). The headline font is loaded in `app/layout.tsx` with `next/font` and exposed as the `--font-display` variable.
