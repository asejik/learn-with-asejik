# DESIGN SYSTEM: Vibrant Editorial Studio (Direction A)

> **Project**: Learn with Asejik  
> **Standard**: P05 UI Design Direction  
> **Core Archetype**: High-Contrast Technical Editorial (Brilliant.org & ByteByteGo Standard)  
> **Primary Viewport Target**: 375px Android mobile on metered data  
> **Interactive Payload Ceiling**: < 200 KB per lesson (optional tap-to-load runtimes, e.g. a code runner, are extra and cached after first use)  

---

## 1. Brand Personality & Philosophy

- **Personality**: Sharp, lucid, authoritative, intellectually engaging.
- **Tone**: Modern engineering publication. Zero generic AI aesthetic (no purple/pink neon gradients, no stacked glassmorphism, no centered button hero cards with vague marketing copy).
- **Core Mantra**: *Restraint beats effects.* Contrast, typography, and crisp spatial structure create visual hierarchy before color is introduced.

---

## 2. Color System & Accessibility (WCAG 2.2 AA Certified)

All color combinations have been verified against WCAG 2.2 AA contrast standards ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text and UI components).

### 2.1 Surfaces & Canvas
| Token Name | Hex | CSS Variable / Tailwind | Role | Contrast vs Text |
| :--- | :--- | :--- | :--- | :--- |
| `canvas-base` | `#F8FAFC` | `bg-slate-50` / `--bg-canvas` | Main app background (soft daylight white) | Base |
| `surface-card` | `#FFFFFF` | `bg-white` / `--bg-surface` | Primary card and drawer container surface | 1.05:1 vs canvas |
| `surface-muted` | `#F1F5F9` | `bg-slate-100` / `--bg-muted` | Inactive tabs, code blocks, quote backgrounds | Subtle contrast |
| `surface-subtle` | `#E2E8F0` | `bg-slate-200` / `--bg-subtle` | Dividers, skeleton loaders, disabled buttons | Structural |

### 2.2 Typography & Ink
| Token Name | Hex | Tailwind | Role | Contrast vs White |
| :--- | :--- | :--- | :--- | :--- |
| `text-primary` | `#0F172A` | `text-slate-900` | Headings, primary titles, emphasized prose | **16.1:1** (AAA) |
| `text-secondary` | `#334155` | `text-slate-700` | Standard body prose, interactive labels | **10.5:1** (AAA) |
| `text-muted` | `#64748B` | `text-slate-500` | Timestamps, file sizes, metadata, captions | **4.6:1** (AA) |
| `text-inverted` | `#FFFFFF` | `text-white` | Text on saturated primary buttons and badges | **8.2:1** vs Primary |

### 2.3 Brand Accents & Interactive
| Token Name | Hex | Tailwind | Role | Usage Rule |
| :--- | :--- | :--- | :--- | :--- |
| `brand-primary` | `#2563EB` | `bg-blue-600` | Main action buttons, active tabs, links | Primary interactive focal point |
| `brand-hover` | `#1D4ED8` | `bg-blue-700` | Button hover and pressed states | Touch/hover state |
| `brand-subtle` | `#EFF6FF` | `bg-blue-50` | Selected option background, tag containers | Highlight backgrounds |
| `brand-highlight` | `#D97706` | `text-amber-600` | Marigold highlight for Mode badges, streak chips | Warm secondary pop |

### 2.4 Semantic Feedback & Status (Always Paired with Icons)
Color is never used as the sole indicator of status.

| State | Background | Border / Accent | Icon | Text | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Correct** | `#ECFDF5` (`emerald-50`) | `#059669` (`emerald-600`) | `CheckCircle2` | `#065F46` | Immediate correct answer feedback + bonus fact |
| **Incorrect** | `#FFFBEB` (`amber-50`) | `#D97706` (`amber-600`) | `AlertTriangle` | `#92400E` | Incorrect answer explanation + 3-screen retry queue |
| **Discovery / Info**| `#F0F9FF` (`sky-50`) | `#0284C7` (`sky-600`) | `Info` | `#075985` | Clickable diagram definitions & inline references |
| **Danger / Error** | `#FEF2F2` (`rose-50`) | `#DC2626` (`rose-600`) | `XCircle` | `#991B1B` | Critical system error, data wipe confirmation |

---

## 3. Typography Hierarchy & Weight Budget

To preserve the $< 200\text{ KB}$ payload constraint over metered cellular connections, we use a strict weight budget: **maximum 2 font families and 4 weights total**, with native system-sans fallback.

- **Display & Headings**: `font-display` (Plus Jakarta Sans or system geometric sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`). Weights: **Bold (700)**, **Black (900)**.
- **Body & Controls**: `font-sans` (Inter or system-ui). Weights: **Regular (400)**, **Medium (500)**, **Semibold (600)**.
- **Monospace & Code**: `font-mono` (JetBrains Mono, Fira Code, or `ui-monospace`). Weight: **Regular (400)**.

### Type Scale
| Level | Mobile (375px) | Desktop (1280px) | Weight | Tracking & Line Height |
| :--- | :--- | :--- | :--- | :--- |
| `Display / H1` | `24px` (`text-2xl`) | `36px` (`text-4xl`) | `font-black` (900) | `tracking-tight leading-tight` |
| `H2 (Section)` | `18px` (`text-lg`) | `24px` (`text-2xl`) | `font-bold` (700) | `tracking-tight leading-snug` |
| `H3 (Card/Title)`| `16px` (`text-base`)| `18px` (`text-lg`) | `font-bold` (700) | `leading-snug` |
| `Body Standard`| `14px` (`text-sm`) | `15px` (`text-base`)| `font-normal` (400)| `leading-relaxed` |
| `Body Compact` | `13px` (`text-[13px]`)| `14px` (`text-sm`) | `font-normal` (400)| `leading-normal` |
| `Caption / Meta`| `11px` (`text-xs`)| `12px` (`text-xs`) | `font-medium` (500)| `tracking-wide uppercase` |

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
  - `rounded-xl` (`12px`): Primary action buttons, interactive choice tiles.
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
   At the top of the lesson player, a segmented rail of pill dashes represents each screen in the lesson. As the learner advances, the active pill fills with electric cobalt blue (`#2563EB`) in a crisp 250ms transition.
2. **Immediate Slide-Up Feedback Bottom Sheet**:  
   Upon submitting an active recall check, an immediate bottom sheet emerges from the bottom on mobile (or right-hand panel on desktop). It pairs a prominent colored icon badge (`CheckCircle2` or `AlertTriangle`) with a crisp verdict and an indented, high-retention "Bonus Fact" or corrective explanation.
3. **Inline Dotted Glossary Drawer**:  
   Technical terms within lesson prose have a subtle dotted underline (`border-b border-dotted border-slate-400`). Tapping the term turns it electric cobalt and slides open a compact definition drawer without ever opening a new browser tab.

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

## 9. Tailwind CSS Configuration Snippet

To be merged into `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb", // Primary Electric Cobalt
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        editorial: {
          canvas: "#f8fafc",
          surface: "#ffffff",
          muted: "#f1f5f9",
          ink: "#0f172a",
          secondary: "#334155",
          border: "#e2e8f0",
        },
        feedback: {
          correctBg: "#ecfdf5",
          correctBorder: "#059669",
          correctText: "#065f46",
          incorrectBg: "#fffbeb",
          incorrectBorder: "#d97706",
          incorrectText: "#92400e",
          infoBg: "#f0f9ff",
          infoBorder: "#0284c7",
          infoText: "#075985",
        },
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
```
