# SETUP & GUARDRAILS: Learn with Asejik

Last updated: 2026-11-21 | Status: CONFIGURED | Rigor: STANDARD

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
| **9. Monitoring from day one** | `DEFERRED` | Cloudflare Pages dashboard & uptime monitor | Set up free UptimeRobot or Better Stack monitor on live URL once deployed. |
| **10. Accounts & 2FA** | `DONE` | GitHub and Cloudflare accounts | Two-factor authentication (MFA) enabled by owner. |
| **11. Backups** | `DONE` | Git repository + client IndexedDB | Course content is version-controlled in Git; student progress is saved locally in IndexedDB. |
| **12. Docs seeded** | `DONE` | `docs/` directory | All suite prompts, blueprints, data inventory, and findings register initialized. |

---

## 2. Infrastructure & Hosting Details

* **Repository**: `https://github.com/asejik/learn-with-asejik.git`
* **Hosting**: **Cloudflare Pages** (Static Output / Edge Network)
* **Custom Domain**: `learn.asejik.com` (Apex domain managed on `asejik.com`)
* **Build Command**: `npm run build`
* **Output Directory**: `.next` (or `out` if fully static export)
* **Environment Variables (Names only)**:
  - `NEXT_PUBLIC_SITE_URL`
  - `PILOT_SIGNUP_WEBHOOK_URL` (server-only, required for pilot signup; never prefix with `NEXT_PUBLIC_`)
