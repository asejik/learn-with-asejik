# PROMPT PLAN: Interactive Learning Platform

Created: 2026-11-21 | Rigor level: STANDARD (provisional) | Archetype: Web App / Offline-First PWA (Education & Data Collection)

---

## 1. Quick Facts & Classification

- **What it is**: A fast, mobile-first, low-data interactive learning platform delivering short tutorials and multi-chapter courses via text, diagrams, and interactive widgets.
- **Audience**: Initially piloted with a known private group (friends, select learners); ultimately released to the public. Target users primarily on mid-range Android phones and metered mobile data in Nigeria.
- **Platform**: Web App / PWA (Next.js App Router, TypeScript, Tailwind CSS, Lucide, Zod, IndexedDB via `idb`, PWA service worker). Hosted on Vercel or Cloudflare Pages free tier.
- **Ownership**: Solo builder product, fully owned and maintained by the creator.
- **Personal data**: Collects learner names and emails. Users located in Nigeria (governed by the Nigeria Data Protection Act 2023 / GAID 2025).
- **Money**: Free for initial pilot. Paid courses and payment gateway (Paystack/Flutterwave) planned for Phase 2.
- **AI features**: Phase 1 AI Tutor uses pre-authored contextual hints from lesson JSON or client-side heuristics (no live paid LLM API calls). Live AI API calls reserved for Phase 2.
- **Destructive actions**: None.
- **Initial scale**: 2 to 3 pilot courses.
- **Risk drivers**: Personal data: SOME | Money: NONE (Phase 1) | Legal status: SOME (NDPA) | Destructive actions: NONE | Public exposure: SOME | AI: NONE (Phase 1) | Silent failure: SOME
- **Provisional rigor level**: **STANDARD** (driven by ordinary personal data collection and planned public release; scaled to essential checks for Phase 1 pilot).

---

## 2. Run Order

Follow these steps sequentially from project inception to pilot release and public launch.

| Step | Prompt / Task | Mode & Scope | When | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **1** | [P02: Project Blueprint](file:///d:/dev/e-learning/docs/prompts/P02_project_blueprint.md) | **USE** (Full Blueprint: scope, data model, content schema, architecture, build plan) | **Now** (before coding) | With AI |
| **2** | [P03: Privacy & Data Protection](file:///d:/dev/e-learning/docs/prompts/P03_privacy_data_protection.md) | **DESIGN mode** (Scope: Section A Data Inventory, Section B Lawful Basis & Consent, Section C Privacy Notice draft, Section D Client-side IndexedDB storage) | Right after P02 | With AI |
| **3** | [P04: Project Setup & Guardrails](file:///d:/dev/e-learning/docs/prompts/P04_project_setup_guardrails.md) | **USE** (Git repo, CI typecheck/lint/build, branch protection, secret scanning) | Milestone 1 (Project scaffold) | With AI + Solo steps |
| — | *Turn on 2FA / MFA on GitHub, Vercel/Cloudflare, and domain accounts* | — | Milestone 1 | **Solo (no AI)** |
| **4** | [P05: UI Design Direction](file:///d:/dev/e-learning/docs/prompts/P05_ui_design_direction.md) | **P05-B (Design Direction)** (Mobile-first design tokens, tap targets >=44px, color + icon accessibility, bottom sheets) | Milestone 1 (Design tokens & shell) | With AI |
| **5** | [P06: Safe Change Protocol](file:///d:/dev/e-learning/docs/prompts/P06_safe_change_protocol.md) | **USE** (Every single code change on branches with verification) | Throughout build | With AI |
| **6** | [P07: Production Readiness Audit](file:///d:/dev/e-learning/docs/prompts/P07_production_readiness_audit.md) | **MID mode** (Scope: Section 1 Data, Section 2 Business Logic, Section 4 Reliability & Recovery, Section 5 Code Health, Section 7 PWA Readiness) | Mid-project (after core player works) | With AI |
| **7** | [pwa_offline_low_data.md](file:///d:/dev/e-learning/docs/prompts/project/pwa_offline_low_data.md) | **USE** (Supplement: Service worker caching, <200KB payload check, click-to-play media guardrails, offline IndexedDB sync) | Alongside P07 | With AI |
| **8** | [P08: Security Audit](file:///d:/dev/e-learning/docs/prompts/P08_security_audit.md) | **LIGHT** (Scope: Section 1 Accounts, Section 3 Secrets, Section 5 Input validation/Zod, Section 11 Headers/CSP, Section 12 Dependencies) | Pre-pilot release | With AI |
| **9** | [P03: Privacy & Data Protection](file:///d:/dev/e-learning/docs/prompts/P03_privacy_data_protection.md) | **AUDIT mode** (Verify privacy notice is live, consent checkbox exists on email capture, NDPA compliance basics) | Pre-pilot release | With AI |
| **10** | [P09: Architecture & Quality Review](file:///d:/dev/e-learning/docs/prompts/P09_architecture_quality_review.md) | **USE** (Maintainability, mobile 375px UX audit, accessibility, zero console errors) | Pre-pilot release | With AI |
| **11** | [P13: Live Operations](file:///d:/dev/e-learning/docs/prompts/P13_live_operations.md) | **LIGHT** (Part A: basic error logging, simple runbook for rollback/redeploy) | Pre-pilot release | With AI |
| **12** | [P14: Launch Gate](file:///d:/dev/e-learning/docs/prompts/P14_launch_gate.md) | **USE** (Formal GO / NO-GO review before releasing pilot to learners) | Before sharing with pilot group | With AI |
| **13** | [P11: SEO & Discoverability](file:///d:/dev/e-learning/docs/prompts/P11_seo_discoverability_audit.md) | **USE** (Metadata, Open Graph cards, sitemap, structured course data) | Before public launch | With AI |

---

## 3. Decisions Table

| ID | Prompt | Decision | Reason & Trigger |
| :--- | :--- | :--- | :--- |
| **P01** | Idea Refinement | **SKIP** | Idea and core constraints already validated in conversation and codified in `AGENTS.md`. Proceed directly to P02. |
| **P02** | Project Blueprint | **USE** | Essential architecture, data model, content schema, and build plan needed before coding. |
| **P03** | Privacy & Data Protection | **USE** | Collecting learner names and emails in Nigeria triggers NDPA 2023 / GAID 2025 duties. Design mode early; audit mode before launch. |
| **P04** | Project Setup & Guardrails | **USE** | Critical CI checks, linting, build-time Zod validation, and secret protection for a long-lived project. |
| **P05** | UI Design Direction | **USE (P05-B)** | High-judgment mobile-first UI with strict 44x44px tap targets, accessible color states, and bottom-sheet feedback. |
| **P06** | Safe Change Protocol | **USE** | Mandatory for every code change, feature addition, and refactor. |
| **P07** | Production Readiness Audit | **USE** | Evaluates build health, performance, Zod schema validation, PWA foundation, and Section 4 Reliability & Recovery (IndexedDB failure handling, SW cache update traps, silent error prevention). |
| **P08** | Security Audit | **LIGHT** | Phase 1 has no custom backend auth or payments. Scoped to secrets, dependencies, headers, and input handling. (*Follow docs/prompts/P08_security_audit.md, SCOPE: sections 1, 3, 5, 11, 12*). |
| **P09** | Architecture & Quality Review | **USE** | Verifies widget modularity in `components/widgets/`, 375px mobile UX, accessibility, and clean bundle sizes. |
| **P10** | AI Feature Review | **LATER** | Phase 1 uses pre-authored hints/heuristics without paid AI APIs. **Trigger**: When live LLM API calls are added in Phase 2. |
| **P11** | SEO & Discoverability Audit | **LATER** | Pilot is closed/unindexed. **Trigger**: Before public web release of the platform. |
| **P12** | Egress & Efficiency Audit | **LIGHT** | Metered data and payload budget are primary constraints. Scoped to media delivery and bundle sizes. (*Follow docs/prompts/P12_egress_efficiency_audit.md, SCOPE: sections A, E, F*). |
| **P13** | Live Operations | **LIGHT** | Solo builder needs basic uptime alert and a 1-page rollback runbook. (*Follow docs/prompts/P13_live_operations.md, SCOPE: Part A sections 1, 2*). |
| **P14** | Launch Gate | **USE** | Mandatory go/no-go verification before releasing to pilot students and again before public launch. |
| **P15** | Independent Project Review | **SKIP** | Solo build with single agent; no third-party legacy handover. |

---

## 4. Supplements

| Supplement | Path | What It Covers | When It Runs | Add to Suite Library? |
| :--- | :--- | :--- | :--- | :--- |
| **PWA & Low-Data Mobile** | [`docs/prompts/project/pwa_offline_low_data.md`](file:///d:/dev/e-learning/docs/prompts/project/pwa_offline_low_data.md) | Service worker caching, offline IndexedDB sync, <200KB payload ceiling, click-to-play media guardrails, and 375px thumb reach. | Alongside P07 before pilot release | Yes (valuable for all emerging-market / offline-first web apps) |

---

## 5. Check-Only Items

Attach these single-line checks to the respective prompts:
* **P04 (Setup)**: Confirm that `node_modules`, `.next`, and `.env*` are strictly excluded in `.gitignore` before first commit.
* **P07 (Production Readiness)**: Confirm build-time Zod schema validation script aborts `next build` if any lesson JSON violates the schema.
* **P09 (Quality Review)**: Confirm that course summaries in lesson cards never truncate mid-sentence and respect the 140-character limit.
* **P14 (Launch Gate)**: Confirm with browser developer tools on throttled mobile network that an interactive lesson loads with zero media requests until user explicitly clicks play.
* **Every Milestone (P06 Done Check)**: Run an automated or manual failure-path test for the milestone's primary feature (e.g., IndexedDB failure/fallback, service worker cache desync, network drops during offline navigation, pilot signup timeout).

---

## 6. Minimum If Short on Time

If time is constrained, these non-negotiable steps prevent shipping broken or insecure software:
1. **P02**: Project Blueprint (establishes architecture and data model).
2. **P04**: Version control, CI build, and secret push protection.
3. **P06**: Safe change protocol for each feature branch.
4. **P03**: Data inventory & minimal privacy notice for email capture.
5. **Supplement (`pwa_offline_low_data.md`)**: Offline test & 200KB payload verification.
6. **P14**: Light launch gate check before sharing the pilot link.

---

## 7. Re-Triage Triggers (Run P00 Again When Hit)

Re-run P00 to update the prompt plan if any of these events occur:
1. **Adding User Authentication & Cloud Sync**: Migrating from local IndexedDB to Supabase/Firebase user accounts.
2. **Adding Payments**: Integrating Paystack, Flutterwave, or Stripe for paid course purchases.
3. **Connecting Live AI Models**: Upgrading the AI Tutor from pre-authored hints to live LLM streaming APIs.
4. **Crossing 200 Registered Users**: Moving into formal NDPC Data Controller of Major Importance obligations.
5. **Transitioning from Private Pilot to Public Launch**: Unlocking SEO (P11) and full marketing distribution.

---

## 8. Revisions & Updates

- **2026-11-21 (Silent Failure Alignment)**: Rated Question 9 (Silent Failure) as **SOME** due to unattended client-side storage risks (silent IndexedDB write failures, service-worker update desyncs, and background webhook timeouts). Added P07 Section 4 (Reliability and Recovery) to the audit scope and mandated a failure-path test per milestone during P06 Done Checks per the P00 decision rule.
