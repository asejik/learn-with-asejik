# PROJECT PROGRESS: Learn with Asejik

Last updated: 2026-11-21 | Status: READY FOR MILESTONE 1 (SCAFFOLDING)

---

## 1. Prompt Suite & Governance Checklist

- [x] **P00: Project Triage** (Completed 2026-11-21) — Created [`docs/PROMPT_PLAN.md`](file:///d:/dev/e-learning/docs/PROMPT_PLAN.md) and [`pwa_offline_low_data.md`](file:///d:/dev/e-learning/docs/prompts/project/pwa_offline_low_data.md)
- [x] **P02: Project Blueprint** (Completed 2026-11-21) — Created [`docs/PROJECT_PLAN.md`](file:///d:/dev/e-learning/docs/PROJECT_PLAN.md)
- [x] **P03: Privacy & Data Protection (DESIGN Mode)** (Completed 2026-11-21) — Created [`docs/DATA_INVENTORY.md`](file:///d:/dev/e-learning/docs/DATA_INVENTORY.md), [`docs/privacy/PRIVACY_NOTICE_DRAFT.md`](file:///d:/dev/e-learning/docs/privacy/PRIVACY_NOTICE_DRAFT.md), and [`docs/privacy/COMPLIANCE_CHECKLIST.md`](file:///d:/dev/e-learning/docs/privacy/COMPLIANCE_CHECKLIST.md)
- [ ] **P04: Project Setup & Guardrails** (Scheduled for Milestone 1: CI, git, push protection)
- [ ] **P05: UI Design Direction** (Scheduled before first UI screens)
- [ ] **P07: Production Readiness Audit (MID)** (Scheduled mid-build)
- [ ] **P08: Security Audit (LIGHT)** (Scheduled before pilot release)
- [ ] **P03: Privacy & Data Protection (AUDIT Mode)** (Scheduled before pilot release)
- [ ] **P09: Architecture & Quality Review** (Scheduled before pilot release)
- [ ] **P13: Live Operations (LIGHT)** (Scheduled before pilot release)
- [ ] **P14: Launch Gate** (Scheduled before pilot release)

---

## 2. Technical Build Milestones

- [ ] **Milestone 1: Foundation & Content Engine**
  - [ ] Initialize Next.js 14+ project (TypeScript, Tailwind, Lucide, Zod)
  - [ ] Implement course and lesson Zod schemas in `lib/schema.ts`
  - [ ] Create content loader in `lib/content.ts` with build-time schema validation
  - [ ] Author seed tutorial in `content/courses/how-apis-work/`
  - [ ] Verify `npm run build` static generation passes with zero errors

- [ ] **Milestone 2: Course Catalog (`/`)**
  - [ ] Header & branding ("Learn with Asejik")
  - [ ] Multi-select topic tag filter bar
  - [ ] Alphabetical vs. Grouped-by-topic toggle
  - [ ] Course cards with Mode, KB size, duration, and progress bar
  - [ ] Catalog footer with Privacy Notice link and "Clear Local Data" button

- [ ] **Milestone 3: Player Shell & Active Recall State Machine**
  - [ ] Lesson navigation bar with progress dots & catalog link
  - [ ] Active recall engine (gated Continue button, 3-screen retry queue)
  - [ ] Dynamic AI Tutor drawer (pre-authored JSON hints)
  - [ ] Inline dotted-underline glossary terms and slide-over reference drawer

- [ ] **Milestone 4: Six Core Interactive Widgets**
  - [ ] `ReadingWidget` (typography, optional SVG, click-to-play media)
  - [ ] `ClozeWidget` (tapable word tiles, instant green/amber feedback)
  - [ ] `ChoiceWidget` (single/multi scenario checks)
  - [ ] `SwipeDeckWidget` (animated Yes/No or True/False card stack)
  - [ ] `DiagramExplorerWidget` (interactive SVG nodes with required definition discovery)
  - [ ] `MatchPairsWidget` (concept-to-outcome matching)

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
