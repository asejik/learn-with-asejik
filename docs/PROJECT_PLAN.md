# PROJECT BLUEPRINT: Learn with Asejik

Last updated: 2026-11-21 | Status: APPROVED | Target launch: Private Pilot

---

## 0. Project Profile

| Attribute | Specification |
| :--- | :--- |
| **Name** | Learn with Asejik |
| **Type** | Public Product / Educational Platform |
| **Owner** | Asejik (asejik.com) — Solo builder and maintainer |
| **Platform** | Mobile-first Web App / PWA |
| **Public Pages** | Yes (`/` catalog, `/learn/[courseSlug]/[lessonSlug]`) |
| **Users & Scale** | Initial private pilot: 15–50 learners. 12-month target: 5,000+ public learners |
| **User Locations & Laws** | Primarily Nigeria; global reach. Governed by the **Nigeria Data Protection Act (NDPA 2023)** and **GAID 2025** |
| **Languages** | English |
| **Personal Data Collected** | Learner Full Name, Email Address (Ordinary personal data) |
| **Data Protection Role** | Data Controller (Asejik) |
| **Major-Importance Status** | Tier: Ordinary (pilot < 200 users; transitions to major importance when scaling above 200 users in education) |
| **Data Hosting Regions** | Cloudflare Global Edge CDN; Google Sheets / Serverless Webhook for pilot roster |
| **Payments** | None in Phase 1 (100% free pilot). Phase 2: Paystack / Flutterwave integration for premium courses |
| **AI Features** | Phase 1: Pre-authored contextual hints and recaps inside JSON (zero API cost). Phase 2: Live LLM streaming API |
| **Tech Stack** | Next.js 16 (App Router) with React 19, TypeScript, Tailwind CSS, Lucide React, Zod, IndexedDB (`idb`), PWA Service Worker |
| **Key Integrations** | Web App Manifest, Service Worker, Serverless Pilot Signup Webhook |
| **Environments** | Local (`localhost:3000`), Preview (Cloudflare branch previews), Production (`learn.asejik.com` / Cloudflare Pages) |
| **Recovery Targets** | Max tolerable data loss: 24 hours (content is version-controlled in Git). Max downtime: 4 hours |
| **Rigor Level** | **STANDARD** |

---

## 1. Problem and Outcomes

### Problem Statement
Traditional online learning relies overwhelmingly on passive video lectures (Udemy, YouTube, Coursera). In emerging markets like Nigeria, this creates three critical barriers:
1. **Bandwidth Friction**: Video streaming consumes 300–800 MB per hour, rapidly exhausting metered mobile data packages.
2. **Connectivity Fragility**: High latency and network drops cause constant buffering and lesson abandonment.
3. **Passive Disengagement**: Watching video promotes superficial familiarity rather than active retention and cognitive recall.

### Target Outcome & Success Criteria
Build an interactive, active-recall learning platform where learners read bite-sized concept cards, physically manipulate interactive widgets, and test understanding at every step.
* **Payload Budget**: Every interactive lesson transfers **under 200 KB** (excluding optional click-to-play media).
* **Offline Resilience**: Learners can load a lesson once and complete it fully with zero network connection.
* **Mobile Ergonomics**: 100% usable with one thumb on a 375px wide mid-range Android screen with zero horizontal scroll and minimum 44x44px tap targets.
* **Authoring Speed**: Course creators can write and update lessons in structured JSON/Markdown and redeploy in under 60 seconds.

### User Stories
* **US-01 (Learner - Low Data Navigation)**: *As a learner on a metered mobile plan in Nigeria*, I want to browse the course catalog and see the estimated data size (in KB) and duration before starting, so that I can budget my mobile data.
  - *Acceptance Criteria*: Catalog cards display KB size badge; initial page transfer is under 200 KB.
* **US-02 (Learner - Active Learning)**: *As an engaged learner*, I want to answer inline cloze blanks and swipeable true/false cards with immediate visual feedback, so that I immediately know if I understood the concept.
  - *Acceptance Criteria*: Continue button remains disabled until interaction completes; correct answers show green card + bonus fact; incorrect answers show amber card + explanation.
* **US-03 (Learner - Spaced Retrieval)**: *As a learner who makes a mistake*, I want the question I missed to re-test me a few screens later, so that the correct concept sticks in my memory.
  - *Acceptance Criteria*: Answering a widget incorrectly queues the question ID to automatically re-appear 3 screens later.
* **US-04 (Learner - Offline Retention)**: *As a learner commuting with unstable mobile data*, I want my progress and completed screens to be saved on my phone, so that I never lose my place when my connection drops.
  - *Acceptance Criteria*: Progress is stored in IndexedDB (`idb`); reopening the app offline resumes at the exact screen.
* **US-05 (Creator - Fast Authoring)**: *As Asejik (course author)*, I want to edit course prose and quiz questions in modular JSON files and push to Git, so that updates are live in under 1 minute without touching UI code.
  - *Acceptance Criteria*: Zod schema validates content at build time; build fails with clear error messages if required fields or tags are malformed.

### Out of Scope for Phase 1
* Live paid LLM API calls (AI Tutor is pre-authored in Phase 1).
* User passwords and complex database authentication (Supabase deferred to Phase 2).
* Payment gateways, subscriptions, or paywalled chapters.
* Native iOS/Android app store packages (PWA covers mobile).

---

## 2. Features and Scope (MVP vs. Later)

```
┌─────────────────────────────────────────────────────────────┐
│                    LEARN WITH ASEJIK                        │
├──────────────────────────────┬──────────────────────────────┤
│       MVP (Phase 1)          │       Next (Phase 2)         │
├──────────────────────────────┼──────────────────────────────┤
│ • Course Catalog & Tag Filter│ • Supabase Cloud Auth        │
│ • PWA Offline Service Worker │ • Cross-device Cloud Sync    │
│ • IndexedDB Local Progress   │ • Paystack Payment Gateway   │
│ • Modular Player Shell       │ • Live LLM Streaming Tutor   │
│ • 6 Core Interactive Widgets │ • Automated Email Reminders  │
│ • 3-Screen Retry Queue       │ • Student Discussion Forum   │
│ • Delayed Email/Name Capture │ • Creator Analytics Dashboard│
│ • Demo Seed Tutorial         │ • Multi-Author CMS          │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 3. Users, Roles and Permissions

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Learner (Anonymous/Pilot)** | Browse catalog, read lessons, interact with widgets, save local progress in IndexedDB, submit pilot name/email upon course completion. |
| **Course Author (Asejik)** | Create, edit, and publish course and lesson JSON files under `content/courses/` via Git. Inspect pilot signup roster via private Google Sheet. |

---

## 4. Data Model & Storage

### 4.1 Content Schemas (`lib/schema.ts` via Zod)

```
Course (course.json)
 ├── slug (string, url-safe)
 ├── title (string)
 ├── summary (string, max 140 chars)
 ├── mode ("tutorial" | "course")
 ├── estimatedMinutes (number)
 ├── approxKbSize (number)
 ├── canonicalTags (array of normalized strings)
 └── chapters (array of Chapter items)
      ├── id (string)
      ├── title (string)
      └── lessons (array of Lesson references)
           ├── slug (string)
           └── title (string)

Lesson (lessons/<lesson-slug>.json)
 ├── slug (string)
 ├── title (string)
 ├── chapterId (optional string)
 ├── keyTerms (array of strings)
 └── screens (array of Screen items)
      ├── id (string, unique within lesson)
      ├── widgetType ("reading" | "cloze" | "choice" | "swipeDeck" | "diagramExplorer" | "matchPairs")
      ├── title (string)
      ├── aiTutor (object: { recap?: string, explain?: string, review?: string })
      └── widgetData (discriminated union based on widgetType)
```

### 4.2 Client-Side Storage Schema (IndexedDB via `idb`)

* **Database Name**: `asejik_learning_db` (Version 1)
* **Object Store 1: `user_profile`**
  - Key: `current_user`
  - Fields: `{ fullName: string, email: string, consentedAt: string, syncedToCloud: boolean }`
* **Object Store 2: `course_progress`**
  - Key: `courseSlug`
  - Fields: `{ completedLessonSlugs: string[], activeLessonSlug: string, lastActiveAt: number, percentage: number }`
* **Object Store 3: `lesson_state`**
  - Key: `${courseSlug}_${lessonSlug}`
  - Fields: `{ currentScreenIndex: number, completedScreenIds: string[], retryQueue: string[], sequence?: string[], positionSavedAt?: number, completedAt?: number, rating?: "thumbs-up" | "thumbs-down" }`
  - `sequence` (screen order including retry repeats) and `positionSavedAt` are written after every step so the player resumes mid-lesson (US-04). Saved state that no longer matches the lesson content starts the lesson fresh.

---

## 5. Tech Stack & Trade-offs

| Layer | Chosen Technology | Justification & Free Tier Limits | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) with React 19 | Native Server Components, static generation for ultra-low payload, edge API routes. | Astro (great static sites, but Next.js simplifies seamless Phase 2 full-stack expansion). |
| **Styling** | Tailwind CSS | Utility-first, zero runtime overhead, purges unused styles to produce a tiny ~12 KB CSS file. | Vanilla CSS / CSS Modules (slower authoring, harder design-token standardization). |
| **Icons** | Lucide React | Tree-shakable SVG icons; accessible and lightweight. | FontAwesome (bulky asset bundles). |
| **Validation** | Zod | Runtime and build-time content validation ensuring zero malformed lessons reach production. | Yup, Joi (less native TypeScript inference). |
| **Client Storage** | IndexedDB via `idb` | Asynchronous, 50+ MB storage capacity on mobile Android without blocking the UI thread. | LocalStorage (synchronous, 5 MB limit, prone to mobile data eviction). |
| **Hosting** | Cloudflare Pages | Global edge CDN, unlimited bandwidth on free tier, edge deployment in Lagos/Africa, zero server maintenance. | Vercel (alternative). |

---

## 6. System Architecture

```mermaid
flowchart TD
    subgraph Client [Learner Mobile / Desktop Browser]
        UI[Player UI Shell & Widgets]
        SW[Service Worker Cache]
        IDB[(IndexedDB Storage: Progress & Profile)]
    end

    subgraph Content [Static Content Layer]
        CourseJSON[content/courses/<course>/course.json]
        LessonJSON[content/courses/<course>/lessons/<lesson>.json]
    end

    subgraph Server [Cloudflare Global Edge]
        NextApp[Next.js App Router Static Engine]
        API[/api/pilot-signup Edge Route]
    end

    subgraph Storage [Roster Data Sync]
        Roster[(Private Google Sheet / Webhook)]
    end

    Content -->|Build-time Zod Validation| NextApp
    NextApp -->|Pre-rendered < 200KB Shell| Client
    Client <-->|Offline Reads & Writes| IDB
    Client <-->|Asset & Lesson Cache| SW
    Client -->|Delayed Email Signup| API
    API -->|Append Pilot Lead| Roster
```

---

## 7. Error Handling & Reliability

* **Malformed Content JSON**: Build-time Zod validation halts `npm run build` immediately with the exact file, line, and schema violation.
* **Offline Network State**: When network is lost, the service worker intercepts requests and serves previously cached lessons. The UI displays an unobtrusive subtle pill: *"Offline Mode — Progress saved locally"*.
* **IndexedDB Failure / Incognito**: If IndexedDB is blocked or quota exceeded, the player falls back gracefully to in-memory session state and informs the user: *"Private browsing detected; progress will not persist after tab close"*.
* **Empty / 404 Routes**: Custom branded `not-found.tsx` with a single action button: *"Return to Course Catalog"*.

---

## 8. Security, Privacy and Compliance (NDPA 2023 by Design)

* **Data Minimization**: Only collects Full Name and Email upon first course completion. Zero tracking of location, device IDs, or phone numbers in Phase 1.
* **Explicit Consent**: Email capture form includes an un-ticked, explicit checkbox: *"I consent to Asejik storing my name and email to save my progress and contact me for pilot feedback under the NDPA."*
* **Zero Client Secrets**: No third-party API secret keys are embedded in client bundles.
* **Security Headers**: Production deployment enforces strict `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 9. Non-Functional Requirements

* **Performance Budget**: Initial lesson payload strictly **< 200 KB**.
* **Mobile Viewport**: 100% usable on 375px screens with 0 horizontal scroll.
* **Tap Ergonomics**: Minimum tap target size of **44x44px** for all interactive buttons, cards, and dropdowns.
* **Accessibility**: Color states paired with icons (`CheckCircle2`, `AlertTriangle`, `Info`). Text contrast meets WCAG 2.2 AA (minimum 4.5:1 ratio).

---

## 10. Build Plan & Milestones

### Milestone 1: Foundation & Content Engine
* **Goal**: Walking skeleton with Next.js, Tailwind, Zod schemas, and content validator.
* **Tasks**:
  1. Initialize Next.js project with TypeScript, Tailwind CSS, Lucide React, and Zod.
  2. Implement strict course and lesson Zod schemas in `lib/schema.ts`.
  3. Create content loader utility in `lib/content.ts` with build-time schema validation.
  4. Create seed tutorial files in `content/courses/how-apis-work/`.
* **Done When**: `npm run build` statically validates the seed tutorial with zero errors.

### Milestone 2: Course Catalog (`/`)
* **Goal**: Responsive, filterable catalog listing tutorials and courses.
* **Tasks**:
  1. Build header with "Learn with Asejik" brand and clean typography.
  2. Implement multi-select topic tag filter bar and alphabetical/topic grouping toggle.
  3. Render course cards showing Mode badge, estimated minutes, KB size, and progress bar.
  4. Add catalog footer with links to Privacy Notice (`/privacy`) and self-service "Clear Local Data" button.
* **Done When**: Catalog loads in under 1 second on mobile preview with working filters and visible privacy controls.

### Milestone 3: Player Shell & Active Recall State Machine
* **Goal**: Modular player interface at `/learn/[courseSlug]/[lessonSlug]`.
* **Tasks**:
  1. Build top navigation bar with progress dots and back-to-catalog button.
  2. Build active recall state machine (disabling Continue until completion, 3-screen retry queue for incorrect answers).
  3. Implement persistent AI Tutor button with dynamic labels ("Recap", "Explain", "Review") opening a slide-over drawer showing pre-authored JSON hints.
  4. Implement inline dotted-underline glossary popovers and reference slide-over drawers.
* **Done When**: Navigation through a mock 6-screen flow works smoothly with functional retry queuing.

### Milestone 4: Six Core Interactive Widgets
* **Goal**: Implement all 6 modular widgets in `components/widgets/`.
* **Tasks**:
  1. `ReadingWidget`: Structured typography, optional inline SVG, click-to-play media button.
  2. `ClozeWidget`: Fill-in-the-blank with tapable word tiles and instant feedback.
  3. `ChoiceWidget`: Single and multi-select scenario checks with green/amber panels.
  4. `SwipeDeckWidget`: Animated True/False flashcard stack with tap/swipe mechanics.
  5. `DiagramExplorerWidget`: Interactive SVG nodes that unlock Continue once all definitions are read.
  6. `MatchPairsWidget`: Two-column concept-to-implication matching.
* **Done When**: All 6 widgets function with accessible feedback on both 1280px desktop and 375px mobile screens.

### Milestone 5: Offline PWA & Value-First Onboarding
* **Goal**: Local IndexedDB persistence, PWA service worker, and delayed email capture.
* **Tasks**:
  1. Implement IndexedDB helper (`lib/db.ts`) using `idb` to store lesson progress and completion state.
  2. Configure PWA manifest (`manifest.json`) and service worker for offline caching.
  3. Build Lesson Completion screen featuring key terms learned, feedback rating, and Delayed Name/Email signup modal with un-ticked NDPA consent checkbox.
  4. Create `/api/pilot-signup` route to sync pilot learners to private Google Sheet webhook, ensuring personal data is stripped from console server logs.
* **Done When**: User can complete a course in Airplane Mode, reconnect, and submit name/email on the completion screen with verified consent logging.

### Milestone 6: Verification & Polish
* **Goal**: End-to-end audit and quality verification.
* **Tasks**:
  1. Audit payload sizes: ensure total transfer remains under 200 KB on throttled network.
  2. Verify 375px mobile thumb ergonomics and zero console errors.
  3. Run P07, `pwa_offline_low_data`, P08 (LIGHT), and P14 Launch Gate.
* **Done When**: P14 Launch Gate outputs a formal **GO** decision.

---

## 11. Decisions Log

* **Decision 1: Delayed Onboarding over Upfront Gate**: Let learners complete their first lesson before prompting for name/email to maximize conversion and respect NDPA data minimization.
* **Decision 2: Modular JSON over Monolithic Course Files**: Keep each lesson in its own file under `lessons/<lesson-slug>.json` to ensure payload transfer remains under 200 KB and enable sub-minute text updates.
* **Decision 3: IndexedDB (`idb`) over LocalStorage**: Asynchronous IndexedDB handles complex progress trees and works reliably across PWA sessions without blocking the UI thread.
* **Decision 4: Static Pre-Authored AI Tutor over Paid LLM API in Phase 1**: Delivers instant contextual guidance and recaps with zero recurring token cost and zero latency.
