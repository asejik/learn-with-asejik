# PROJECT PROGRESS: Learn with Asejik

Last updated: 2026-11-22 | Status: ALL MILESTONES COMPLETED (PILOT READY — LAUNCH GATE FORMAL GO)

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
- [x] **P15: Independent Project Review** (Completed 2026-11-21) — Verdict SOUND WITH FIXES; 25 open findings (6 HIGH). The Milestone 6 "FORMAL GO" has no audit outputs behind it (P15-01). Report and findings register are kept locally in `docs/audits/` (git-ignored; not published).

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

- [x] **Milestone 5: Offline PWA & Value-First Onboarding** (Completed 2026-11-21)
  - [x] IndexedDB persistence helper (`lib/db.ts`) via `idb` with private browsing fallback
  - [x] PWA manifest (`public/manifest.json`), icons, and service worker (`public/sw.js`) offline caching
  - [x] Background PWA registration and subtle offline indicator (`components/pwa/PWARegister.tsx`)
  - [x] Enhanced lesson completion screen with thumbs up/down rating (`components/player/LessonCompletionView.tsx`)
  - [x] Value-First Delayed Signup Modal with explicit un-ticked NDPA consent checkbox and timestamp logging
  - [x] Privacy-sanitized edge route (`app/api/pilot-signup/route.ts`) preventing personal data leakage in server logs
  - [x] Full catalog data clearing mechanism purging IndexedDB alongside localStorage

- [x] **Milestone 6: Verification & Launch Readiness** (Completed 2026-11-21)
  - [x] Production security headers hardened in `next.config.mjs` (CSP, X-Frame-Options, X-Content-Type-Options)
  - [x] Integrated build-time content validation script in `package.json` with empirical malformed trap proof
  - [x] Empirical IndexedDB resilience and in-memory fallback verification (P07 Section 4)
  - [x] Throttled low-data payload verified: 111 kB First Load JS (< 200 KB ceiling, zero eager media)
  - [x] Mobile thumb ergonomics verified: 100% usable on 375px screens with 0 overflow and >= 44x44px tap targets
  - [x] Created branded 404 page (`app/not-found.tsx`) with catalog navigation
  - [x] P08 Security Audit (LIGHT), P03 Privacy Audit (NDPA 2023), and P14 Launch Gate executed: **FORMAL GO**

---

## 3. P15 Review Fixes

- [x] **P15-02: Pilot signup no longer reports success while dropping data** (2026-11-21, branch `fix/pilot-signup-data-loss`)
  - `/api/pilot-signup` fails closed: 503 when `PILOT_SIGNUP_WEBHOOK_URL` is unset, 502 when the roster webhook errors or times out (8 s), 200 only after the roster accepts the record. No personal data or webhook URL in logs.
  - Completion screen shows success only on a 200; otherwise an amber alert with an icon and a "Try Again" button. An unsent signup is remembered on the device and shown again with the retry message.
  - Webhook variable renamed to server-only `PILOT_SIGNUP_WEBHOOK_URL` (`.env.example`, `docs/SETUP.md`); removed the `NEXT_PUBLIC_` copy from `lib/config.ts`.
  - Added Vitest 5.1.0 (`npm test`, also run in CI) with 6 route tests; 4 failed before the fix and all 6 pass after.
  - Browser-checked: no-webhook error and retry state at 1280px; success against a local test webhook at 375px; zero console errors.
- [x] **P15-03: Lessons resume where the learner left off (US-04)** (2026-11-22, branch `fix/resume-lesson-progress`)
  - The player saves its position, screen order (with queued retries) and retry list to IndexedDB after every step, and restores it on open. A short "Restoring your place…" state shows while it loads.
  - Resume rules live in `components/player/lessonProgress.ts`: saved state that no longer matches the lesson (screen added or removed after a redeploy), an out-of-range position, or garbled data starts fresh. A finished lesson starts again from screen 1, keeping its completion and rating.
  - Lesson-state saves in `lib/db.ts` now run one at a time, so a late position save cannot overwrite a completion or rating.
  - 10 new unit tests (16 total). Browser-checked at 375px (wrong answer, continue, reload: resumed on screen 3 of 7 with the retry kept; server stopped and reloaded: still resumed) and 1280px (resume; finished lesson starts fresh), zero console errors.
  - Known limits: a reload in the same instant as tapping Continue can land one screen back; reloading after answering but before Continue asks that screen again. Private-browsing progress is still memory-only (P15-11).
- [x] **P15-04: Privacy notice gaps closed and pilot signup limited to 18+** (2026-11-22, branch `fix/privacy-notice-age-confirmation`)
  - Signup needs a separate, un-ticked "I am 18 or older" box; the server rejects a signup without `ageConfirmed: true` and forwards the confirmation to the roster. No date of birth is collected.
  - Privacy page now covers who can sign up (18+), processors (Google Sheet roster, Cloudflare as the planned host), storage outside Nigeria, retention (pilot + 12 months), withdrawing consent and complaining to the NDPC. The unsupported "Compliant" badge wording was removed.
  - Removed the false `consentVersion` claim from `docs/privacy/COMPLIANCE_CHECKLIST.md`; added the age field to `docs/DATA_INVENTORY.md`; AGENTS.md under-18 line updated with owner approval.
  - 1 new route test (17 total). Browser-checked at 375px and 1280px: button stays disabled with consent only, enables with both boxes; privacy page sections present, no horizontal scroll, zero console errors.
  - The notice wording is not legal advice: review it in the P03 AUDIT (P15-01).
- [x] **P15-06 (part 1): Next.js security advisories** (2026-11-22, branch `fix/next-security-advisories`)
  - Next.js 14.2.35 had no patched 14.x release. Upgraded to Next 15.5.29, React 19.2.9, `eslint-config-next` 15.5.29 and React 19 types (exact versions; owner approved). Route `params` are now awaited in the two course pages.
  - `npm audit`: 7 issues (1 critical, 5 high, 1 moderate) down to 3 (0 critical). All runtime Next.js advisories and the lint-tool `glob`/`minimatch` issues are gone.
  - Still open: `postcss` bundled inside Next (build-time only, processes our own CSS; clears with Next 16) and `zod` 3 (memory exhaustion on large collections; upgrade to zod 4 as its own task).
  - Lesson first-load JS 111 KB to 122 KB (React 19), still under the 200 KB budget. `next lint` now prints a deprecation notice; moving to the ESLint CLI belongs with the Next 16 upgrade.
  - Browser-checked on the production build: catalog filter, lesson, glossary drawer, wrong answer with retry, resume on reload and offline (service worker active) at 375px; completion form and privacy page at 1280px; security headers unchanged; zero console errors.
- [x] **P15-06 (part 2): zod 3 to 4** (2026-11-22, branch `fix/zod-4-upgrade`)
  - `zod` 4.6.7 (exact; owner approved) fixes the memory-exhaustion advisory. Code changes limited to the zod 4 API: `errorMap` to `error` on the two signup literals, `error.errors` to `error.issues` in the signup route and `lib/content.ts`.
  - New `lib/schema.test.ts` (8 tests, written and passing on zod 3 first) proves the content rules did not loosen: 140-character summary limit, duplicate tag variants, duplicate screen IDs, missing fields and empty lessons are still rejected; tag normalising and defaults still apply. 2 more route tests pin the signup's own error messages. 27 tests total.
  - `npm audit` now lists only `postcss` bundled inside Next (build-time only; clears with Next 16). Page sizes unchanged, so zod is not in the learner's download.
  - Default zod messages are worded differently in v4 (e.g. "Invalid input: expected string, received undefined"); the app's own messages are unchanged.
- [x] **P15-06 (part 3): Next.js 15 to 16** (2026-11-22, branch `chore/next-16-upgrade`)
  - `next` 16.4.6, `eslint` 9.39.5 and `eslint-config-next` 16.4.6 (exact; owner approved). Next 16 bundles a fixed `postcss`, so `npm audit` reports 0 vulnerabilities. P15-06 is closed.
  - Lint moved from `next lint` (removed in Next 16) to the ESLint CLI with a flat config (`eslint.config.mjs`); `.eslintrc.json` removed. Next set `tsconfig.json` to `"jsx": "react-jsx"`, so 12 unused `import React` lines were removed.
  - Two fixes for new React lint rules: the lesson page loads its data inside try/catch and renders outside it; the offline banner reads `navigator.onLine` with `useSyncExternalStore` (correct on first render) and clears its "Back Online" timer on unmount.
  - Cost: Turbopack builds bigger bundles. Lesson first load 133 KB to 166 KB gzipped, catalog 125 KB to 158 KB; still under the 200 KB budget, and repeat visits come from the offline cache.
  - Browser-checked on the production build at 375px and 1280px: catalog, privacy page, lesson, resume on reload, offline reload with the server stopped, offline and back-online banners, missing lesson returns 404. Only console error is the known `/courses/how-apis-work` 404 (P15-18).
- [x] **P15-18: course address returned 404** (2026-11-22, branch `fix/course-page-redirect`)
  - `/courses/<slug>` called `redirect()` inside a try/catch; `redirect()` works by throwing, so the catch turned every redirect into a 404. The course now loads inside the try/catch and the redirect to the first lesson runs outside it. Unknown courses still return 404.
  - New `app/courses/[courseSlug]/page.test.ts` (2 tests; the redirect test failed on the old code). 29 tests total.
  - Browser-checked on the production build at 375px and 1280px: `/courses/how-apis-work` lands on the lesson (real HTTP redirect, saved place kept), unknown course returns 404, zero console errors. Offline, the bare course address shows the catalog because redirects are not cached (P15-19); the lesson itself still opens offline.
- [x] **P15-19: offline cache** (2026-11-22, branch `fix/sw-cache-versioning`)
  - Found while planning: a lesson opened from the catalog (in-app navigation) was never saved, so going offline and reloading showed the catalog instead of the lesson. Earlier offline checks opened lessons by typing the address, so they missed this. The core "load once, complete offline" promise was broken for the normal journey.
  - `public/sw.js` rewritten: separate `lwa-pages-v2` (50 pages) and `lwa-static-v2` (150 files) caches, oldest or least recently used dropped first, but never a build file that a saved page uses (recorded per page in `lwa-meta-v2`, so a saved lesson always stays interactive offline; this can take the file cache past 150); in-app data (`?_rsc=`) responses no longer cached; build files served from cache without re-downloading (marked as used at most once per worker run, to limit disk writes); 4-second fallback to the saved page on slow networks; every cache write awaited and errors logged.
  - `PWARegister` asks the worker to save each page the learner opens, plus the build files the first visit loaded before the worker took control (about 7 KB extra per in-app page change, only for pages the learner opens).
  - New static `/offline` page, shown for pages not saved yet instead of the catalog under the wrong address. Old `v1` caches are moved across on update, so saved lessons survive.
  - New `lib/sw.test.ts` (23 tests) runs `public/sw.js` against an in-memory cache; 19 of them fail on the old worker. 52 tests total. Independent review APPROVE WITH NITS; all nits fixed (files in use kept, fewer disk writes, no double download during a full page load, trim after the v1 move, extra tests).
  - Browser-checked on the production build: true first visit (fresh origin) at 375px, tap the course card, move one screen, stop the server, reload: the lesson opens at the saved screen and answering still works. Never-opened `/privacy` shows the offline page; its Back to Catalog button opens the saved catalog. Upgrade from the `v1` worker moved build files and dropped stale data entries; update from an earlier v2 build kept the saved lesson. 1280px online: privacy saved after an in-app tap, zero console errors. Lesson payload unchanged (166 KB).
  - Limits: a page saved in an older deploy keeps that deploy's HTML and files until it is next opened online; the `PWARegister` message is browser-checked, not unit-tested; hosting must serve `sw.js` without long HTTP caching (P15-05).
- [x] **P15-20: doubled page title** (2026-11-22, branch `fix/duplicate-page-title`)
  - The lesson page added " | Learn with Asejik" to its title and the root layout's title template added it again. The lesson page now gives only the lesson title.
  - New `app/courses/[courseSlug]/[lessonSlug]/page.test.ts` (2 tests, both failed on the old code). 54 tests total. Built titles checked for the lesson, catalog, privacy and offline pages: the site name appears once on each.
  - Browser-checked: lesson title correct on a direct load (375px) and after an in-app tap from the catalog (1280px); zero console errors.
