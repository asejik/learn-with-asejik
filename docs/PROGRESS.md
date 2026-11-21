# PROJECT PROGRESS: Learn with Asejik

Last updated: 2026-11-21 | Status: MILESTONE 4 COMPLETED (READY FOR MILESTONE 5: OFFLINE PWA & ONBOARDING)

---

## 1. Prompt Suite & Governance Checklist

- [x] **P00: Project Triage** (Completed 2026-11-21) — Created [`docs/PROMPT_PLAN.md`](file:///d:/dev/e-learning/docs/PROMPT_PLAN.md) and [`pwa_offline_low_data.md`](file:///d:/dev/e-learning/docs/prompts/project/pwa_offline_low_data.md)
- [x] **P02: Project Blueprint** (Completed 2026-11-21) — Created [`docs/PROJECT_PLAN.md`](file:///d:/dev/e-learning/docs/PROJECT_PLAN.md)
- [x] **P03: Privacy & Data Protection (DESIGN Mode)** (Completed 2026-11-21) — Created [`docs/DATA_INVENTORY.md`](file:///d:/dev/e-learning/docs/DATA_INVENTORY.md), [`docs/privacy/PRIVACY_NOTICE_DRAFT.md`](file:///d:/dev/e-learning/docs/privacy/PRIVACY_NOTICE_DRAFT.md), and [`docs/privacy/COMPLIANCE_CHECKLIST.md`](file:///d:/dev/e-learning/docs/privacy/COMPLIANCE_CHECKLIST.md)
- [x] **P04: Project Setup & Guardrails** (Completed 2026-11-21) — Git repository initialized, `.gitignore`, `.env.example`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, and [`docs/SETUP.md`](file:///d:/dev/e-learning/docs/SETUP.md) created.
- [x] **P05: UI Design Direction** (Completed 2026-11-21) — Direction A (Vibrant Editorial Studio) selected and [`docs/DESIGN.md`](file:///d:/dev/e-learning/docs/DESIGN.md) created with WCAG 2.2 AA tokens, 44px tap targets, and low-data constraints.
- [ ] **P07: Production Readiness Audit (MID)** (Scheduled mid-build)
- [ ] **P08: Security Audit (LIGHT)** (Scheduled before pilot release)
- [ ] **P03: Privacy & Data Protection (AUDIT Mode)** (Scheduled before pilot release)
- [ ] **P09: Architecture & Quality Review** (Scheduled before pilot release)
- [ ] **P13: Live Operations (LIGHT)** (Scheduled before pilot release)
- [ ] **P14: Launch Gate** (Scheduled before pilot release)

---

## 2. Technical Build Milestones

- [x] **Milestone 1: Foundation & Content Engine** (Completed 2026-11-21)
  - [x] Initialize Next.js 14+ project (TypeScript, Tailwind, Lucide, Zod, idb)
  - [x] Implement course and lesson Zod schemas in `lib/schema.ts`
  - [x] Create content loader in `lib/content.ts` with build-time schema validation
  - [x] Author 6-screen seed tutorial in `content/courses/how-apis-work/`
  - [x] Verify `npx tsx scripts/validate-content.ts` and `npm run build` pass with zero errors

- [x] **Milestone 2: Course Catalog (`/`)** (Completed 2026-11-21)
  - [x] Header & branding ("Learn with Asejik") with Direction A tokens
  - [x] Multi-select topic tag filter bar ($\ge 44 \times 44\text{ px}$ tap targets)
  - [x] Alphabetical vs. Grouped-by-topic toggle
  - [x] Course cards with Mode badge, KB size, duration, and progress bar
  - [x] Catalog footer with Privacy Notice link and "Clear Local Data" button with confirmation modal
  - [x] Safe client-side progress loading & failure-path resilience (try/catch fallback)

- [x] **Milestone 3: Player Shell & Active Recall State Machine** (Completed 2026-11-21)
  - [x] Lesson navigation bar with progress dots & catalog link (`PlayerNavBar.tsx`)
  - [x] Active recall engine (gated Continue button, 3-screen retry queue in `usePlayerMachine.ts`)
  - [x] Dynamic AI Tutor drawer (pre-authored JSON hints in `AITutorDrawer.tsx`)
  - [x] Inline dotted-underline glossary terms and slide-over reference drawer (`GlossaryDrawer.tsx`)
  - [x] Responsive layout reflow (bottom sheet on mobile, right-docked on desktop) in `FeedbackPanel.tsx`
  - [x] Lesson player routing (`/courses/[courseSlug]/[lessonSlug]`) with SSG pre-rendering

- [x] **Milestone 4: Six Core Interactive Widgets** (Completed 2026-11-21)
  - [x] `ReadingWidget` (prose typography, inline SVG illustration, click-to-play Opus media)
  - [x] `ClozeWidget` (interactive blank slot, tapable word tiles, instant check)
  - [x] `ChoiceWidget` (single/multi-select scenario checks with accessible radio/checkbox indicators)
  - [x] `SwipeDeckWidget` (True/False card stack with drag gestures and 44px tap targets)
  - [x] `DiagramExplorerWidget` (interactive SVG node inspection with gated discovery unlocking)
  - [x] `MatchPairsWidget` (two-column concept pairing with randomized column and connection states)
  - [x] Refactored `PlayerShell.tsx` to delegate screen rendering to modular `components/widgets/`

- [ ] **Milestone 5: Offline PWA & Value-First Onboarding**
  - [ ] IndexedDB persistence helper (`lib/db.ts`) via `idb`
  - [ ] PWA manifest and service worker offline caching
  - [ ] Lesson completion screen with key terms, feedback rating, and Delayed Signup Modal
  - [ ] Explicit un-ticked NDPA consent checkbox and timestamp logging
  - [ ] Create `/api/pilot-signup` route to sync to private Google Sheet webhook with log sanitization

- [ ] **Milestone 6: Verification & Launch Readiness**
  - [ ] Verify lesson transfer payload under 200 KB on throttled connection
  - [ ] Verify 375px mobile thumb ergonomics and zero console errors
  - [ ] Run P07, `pwa_offline_low_data`, P08 (LIGHT), and P03 (AUDIT)
  - [ ] Execute P14 Launch Gate for formal pilot GO decision
