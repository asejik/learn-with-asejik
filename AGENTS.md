# Project rules for interactive learning platform

## Product goal
Build a fast, mobile-first, low-data interactive learning platform that supports both short standalone tutorials and full multi-chapter courses. All course content lives in structured files separate from the player UI so lessons can be edited as text and redeployed in under a minute.

## Tech stack
- Use Next.js (App Router), TypeScript, Tailwind CSS, lucide-react, and zod.
- Use browser IndexedDB (via idb) and a PWA service worker for offline chapter caching and local progress storage.
- Target deployment on the Vercel or Cloudflare Pages free tier, with the Supabase free tier reserved for Phase 2.
- Do not add paid APIs, paid UI kits, or heavy third-party video players.

## Low-data and mobile constraints
- Target users are often on mid-range Android phones and metered mobile data in Nigeria.
- Keep a single interactive lesson payload under 200 KB (excluding optional media).
- Use text and inline SVGs for diagrams. Do not require video for core instruction.
- Any optional audio clip (Opus) or short video clip (WebM, under 60 seconds) must load only after the learner taps play. Never preload or autoplay media.
- All interactive tap targets must be at least 44x44px and usable with one thumb on a 375px screen.

## Content schema hygiene
- Store all courses under `content/courses/<course-slug>/`. Course structure and metadata are defined in JSON, with lesson prose and explanation fields supporting inline Markdown formatting.
- Validate every course and lesson JSON file against a strict Zod schema at build time.
- Normalize topic tags (trimmed, canonical casing) and reject duplicate tag variants at build time.
- Parse inline formatting cleanly so raw Markdown characters (such as `*word*` or `` `code` ``) never render as literal text in UI cards.
- Enforce a 140-character limit on every course summary so card text never truncates mid-sentence with ellipses.

## Lesson player behavior
- Hide the primary Continue button on interactive screens until the learner completes the required input.
- Display immediate right-hand (desktop) or bottom-sheet (mobile) feedback panels after every answer:
  - Green with a `CheckCircle2` icon for correct answers (accompanied by a short bonus fact).
  - Amber with an `AlertTriangle` icon for incorrect answers (with a clear explanation).
  - Blue with an `Info` icon for clickable diagram definitions.
  - Always pair color states with iconography to ensure full accessibility for colorblind learners.
- When a learner answers a check incorrectly, queue that same question ID to reappear three screens later as a quick retry check.
- Open glossary definitions and external reference links inside a slide-over drawer. Do not open new browser tabs that pull learners out of the lesson.
- For Phase 1, the AI Tutor component will render pre-authored contextual hints from the lesson JSON or client-side heuristics. Do not wire up live paid LLM API calls until Phase 2.

## Engineering workflow
- Keep widget components modular inside `components/widgets/` so new discipline-specific widgets (such as a Python code runner or formula builder) can be added later without modifying the core player shell.
- After completing any feature, start the dev server and use the built-in browser to verify desktop (1280px) and mobile (375px) layouts with zero console errors.
