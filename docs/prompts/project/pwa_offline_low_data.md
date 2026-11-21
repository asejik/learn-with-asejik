# PWA & LOW-DATA: Offline Caching & Metered Bandwidth (supplement)

Stage: Audit (specialist) / Pre-Launch | Run: alongside P07 before the first release and before each major release | Output: docs/audits/PWA_LOW_DATA_[YYYY-MM-DD].md
Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level, evidence, severity, reporting, and fixing. Fixes go through P06. Reports go in docs/audits/.

---

## ROLE
Act as a mobile web performance and offline-first PWA specialist. Verify that this application delivers a fast, resilient, low-data experience on mid-range Android hardware under metered mobile data conditions in Nigeria.

OWNS: PWA manifest, service worker lifecycle, offline caching strategies (Network-First vs Cache-First for content vs shell), cache invalidation on content redeployment, IndexedDB local progress storage and schema versioning, strict 200 KB interactive lesson payload budget, zero-preload media enforcement, and mobile thumb-zone tap target usability.
NOT HERE: General security (P08), visual design system (P05), general database and code health (P07), privacy law and consent (P03).

---

## TOOLS FIRST
1. Lighthouse CLI / PageSpeed Insights in mobile throttling mode (Simulated 3G/4G, mid-range CPU).
2. Playwright network size recording on lesson routes: record total transferred bytes, request count, and cache hit ratios.
3. Chrome DevTools / Application tab checks: verify manifest validity, service worker registration, and IndexedDB stores.

---

## AUDIT SECTIONS

### 1. PWA Manifest & App Shell
- `manifest.json` / web app manifest is valid: correct name, short_name, start_url, theme_color, background_color, display: standalone, and maskable icons (192x192, 512x512).
- Splash screen and theme color match UI design tokens.
- PWA installs cleanly on Android Chrome without prompt errors or console warnings.

### 2. Service Worker & Offline Cache Invalidation
- Service worker registers reliably on modern mobile browsers.
- Static assets (JS bundles, CSS, icons, fonts) are cached efficiently with a Stale-While-Revalidate or Cache-First strategy.
- Course content updates: When a lesson JSON file is edited and redeployed, the service worker must detect the update and avoid serving stale cached lesson files for more than 1 minute.
- Offline playback: Disconnecting network (airplane mode) allows previously opened chapters/tutorials to load completely with zero broken screens.

### 3. Local Progress Storage (IndexedDB via `idb`)
- Course and lesson progress, active step index, and retry queues are persisted locally in browser IndexedDB.
- Storage quota and error handling: Handling storage errors gracefully if IndexedDB is disabled or quota is exceeded (e.g., Private Browsing / Incognito mode).
- Schema versioning: Clean database upgrade paths when progress schema evolves between releases.

### 4. Low-Data Payload Ceiling (< 200 KB)
- The total transfer size for a single interactive lesson (HTML + JSON content payload + immediate SVGs) must remain under 200 KB over the wire.
- Bundle analysis: Next.js route chunks are split cleanly so unused course widgets are not bundled into initial page loads.
- SVGs and diagrams are inline or optimized (via SVGO) rather than bulky raster images.

### 5. Media Guardrails (Audio/Video click-to-play)
- Zero preload: `<audio>` and `<video>` tags strictly set `preload="none"`.
- Zero autoplay: No video or audio plays without explicit learner tap.
- Codecs and compression: Audio uses Opus / WebM (or high-efficiency AAC fallback); video clips are WebM under 60 seconds and under 2 MB.

### 6. Mobile Usability & Ergonomics (375px viewport)
- All interactive tap targets (buttons, swipe cards, cloze dropdowns, badges) are at least 44x44px.
- One-thumb reach: Critical controls (Continue button, answer choices, bottom-sheet dismiss) are reachable within the natural bottom/middle thumb zone on a 375px wide screen.
- Touch responsiveness: Zero 300ms tap delay, clean touch gesture handling for swipe cards without accidental viewport panning.

---

## SELF-CHECK I CAN DO MYSELF
1. Open the app in Chrome on mobile, turn on Airplane Mode, and confirm you can navigate through an already opened chapter.
2. In Chrome DevTools Network tab with "Slow 4G" and "Disable Cache" turned off, open a lesson and verify transferred bytes remain under 200 KB before playing any media.
3. Tap an audio or video block; verify that zero bytes of media were transferred before you tapped play.

---

## RULES
- A lesson payload exceeding 200 KB is a HIGH severity finding.
- An `<audio>` or `<video>` tag with `preload="auto"` or `preload="metadata"` is a HIGH severity finding.
- A service worker that permanently serves stale course content after a redeployment is a CRITICAL finding.

---

## SOURCES
- MDN Progressive Web Apps & Service Worker API (checked 2026).
- Web.dev PWA checklist & Offline storage best practices (checked 2026).
- Google Lighthouse PWA & Mobile Web Vitals specifications (checked 2026).
