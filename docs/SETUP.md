# SETUP & GUARDRAILS: Learn with Asejik

Last updated: 2026-11-22 | Status: CONFIGURED (hosting code ready; first deploy pending) | Rigor: STANDARD

---

## 1. Setup Status Matrix

| Checklist Item | Status | Where Configured | How to Verify |
| :--- | :--- | :--- | :--- |
| **1. Version control** | `DONE` | Local git repo (`.git`), [`.gitignore`](file:///d:/dev/e-learning/.gitignore) | Run `git status`; verify ignored files (`node_modules`, `.next`, `docs/videos/*.mp4`) are not tracked. |
| **2. Protected main branch** | `DONE` | GitHub repo: `asejik/learn-with-asejik` ruleset | Try pushing directly to `main` without PR or with broken check; GitHub blocks the push. |
| **3. Automated checks (CI)** | `DONE` | [`.github/workflows/ci.yml`](file:///d:/dev/e-learning/.github/workflows/ci.yml) | GitHub Actions tab; runs `npm ci`, `tsc --noEmit`, `npm run lint`, `npm run build`, and `gitleaks`. |
| **4. Secret protection** | `DONE` | [`.env.example`](file:///d:/dev/e-learning/.env.example), `.gitignore`, CI Gitleaks step | Ask AI to read production secrets (refused); Gitleaks scans git history on PR. |
| **5. Dependency hygiene** | `DONE` | [`.github/dependabot.yml`](file:///d:/dev/e-learning/.github/dependabot.yml), `package-lock.json` | Dependabot opens grouped weekly update PRs; lockfile is frozen in CI. |
| **6. Environments & keys** | `DONE` | Phase 1 zero secrets architecture | No server secrets or database passwords in client bundles. |
| **7. AI tool guardrails** | `DONE` | [`AGENTS.md`](file:///d:/dev/e-learning/AGENTS.md) and [`.agents/skills/`](file:///d:/dev/e-learning/.agents/skills/) | Rules enforce 200 KB payload, 44x44px tap targets, 3-screen retry queue, and zero paid API calls. |
| **8. Strictness** | `DONE` | `tsconfig.json` (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`) | Run `npx tsc --noEmit`; unused variables and loose types trigger compile errors. |
| **9. Monitoring from day one** | `DEFERRED` | Cloudflare Workers dashboard & uptime monitor | Set up free UptimeRobot or Better Stack monitor on live URL once deployed. |
| **10. Accounts & 2FA** | `DONE` | GitHub and Cloudflare accounts | Two-factor authentication (MFA) enabled by owner. |
| **11. Backups** | `DONE` | Git repository + client IndexedDB | Course content is version-controlled in Git; student progress is saved locally in IndexedDB. |
| **12. Docs seeded** | `DONE` | `docs/` directory | All suite prompts, blueprints, data inventory, and findings register initialized. |

---

## 2. Infrastructure & Hosting Details

* **Repository**: `https://github.com/asejik/learn-with-asejik.git`
* **Hosting**: **Cloudflare Workers with static assets** (see PROJECT_PLAN Decision 5). Pages are a static export in `out/`; only `/api/*` runs the Worker in `worker/index.ts`. Config: [`wrangler.jsonc`](../wrangler.jsonc).
* **Custom Domain**: `learn.asejik.com` (Apex domain managed on `asejik.com`)
* **Build Command**: `npm run build` (validates content, exports to `out/`, then `scripts/finish-export.ts` writes `_redirects` and fails the build if a required file is missing)
* **Deploy Command**: `npx wrangler deploy`
* **Headers and redirects**: [`public/_headers`](../public/_headers) (CSP and security headers, `no-cache` for `sw.js`, long caching for `/_next/static/*`); `out/_redirects` is generated from the course files.
* **Run the production setup locally**: `npm run build`, then `npm run start` (runs `wrangler dev` on port 3000). Without the secret, signups fail closed with 503.
* **Environment Variables (Names only)**:
  - `NEXT_PUBLIC_SITE_URL`
  - `PILOT_SIGNUP_WEBHOOK_URL` (server-only, required for pilot signup; set as a Cloudflare **Secret**, never prefix with `NEXT_PUBLIC_`)

---

## 3. First Deploy on Cloudflare Workers (owner steps)

1. Log in to the Cloudflare dashboard (2FA on).
2. **Workers & Pages → Create → Workers → Import a repository**. Choose the GitHub account and `asejik/learn-with-asejik`; give Cloudflare access to this repository only.
3. Build settings: project name `learn-with-asejik` (must match `name` in `wrangler.jsonc`), build command `npm run build`, deploy command `npx wrangler deploy`, production branch `main`. Turn on builds for non-production branches so each PR gets a preview URL.
4. In the Worker: **Settings → Variables and Secrets → Add**, type **Secret**, name `PILOT_SIGNUP_WEBHOOK_URL`, value the Google Apps Script URL.
5. Deploy and open the `*.workers.dev` URL. Ask the AI agent to run the read-only checks (pages, security headers, `sw.js` caching, course redirect, offline reload), then make one real test signup yourself and confirm the row reaches the roster.
6. **Settings → Domains & Routes → Add → Custom domain** → `learn.asejik.com`. If `asejik.com` is not on Cloudflare DNS, add the domain to Cloudflare first or create the record your DNS provider asks for.
7. Add a free uptime monitor on the live URL (item 9), and record the hosting processor check in the P03 audit.
8. Optional, your decision: **Settings → Observability → Workers Logs** keeps the Worker's error lines (no names, emails or webhook URL) in Cloudflare for a few days. Off by default; without it, use `npx wrangler tail` to watch live logs. If you turn it on, add it to the P03 data inventory.
