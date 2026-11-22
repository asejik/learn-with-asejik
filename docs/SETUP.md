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
4. In the Worker: **Settings → Variables and Secrets → Add**, type **Secret**, name `PILOT_SIGNUP_WEBHOOK_URL`, value the Google Apps Script URL (section 4). You can deploy without it first: signup then fails closed with "isn't available right now" and lessons work normally.
5. Deploy and open the `*.workers.dev` URL. Ask the AI agent to run the read-only checks (pages, security headers, `sw.js` caching, course redirect, offline reload), then make one real test signup yourself and confirm the row reaches the roster.
6. **Custom domain** (`learn.asejik.com`). Cloudflare can only attach a custom domain whose DNS it manages; a CNAME to `*.workers.dev` at another DNS host does not work, and partial (CNAME) setup is not on the free plan. As of 2026-11-22, `asejik.com` DNS is at WhoGoHost, the main site points to Vercel and email runs through ImprovMX. So:
   1. Cloudflare dashboard → **Add a domain** → `asejik.com` → **Free** plan. Let it scan the existing records.
   2. Before switching, check the imported records match the current ones exactly, and add any that are missing: the `A` record for `@` to Vercel (`216.198.79.1`), `www`, both **MX** records (`mx1.improvmx.com` priority 10, `mx2.improvmx.com` priority 20) and the **SPF TXT** record. Set the Vercel records to **DNS only** (grey cloud), as Vercel recommends. A missing MX record stops email to @asejik.com.
   3. At WhoGoHost, replace the nameservers `nsa.whogohost.com` / `nsb.whogohost.com` with the two Cloudflare gives you. Wait until Cloudflare shows the domain as **Active** (usually under an hour, up to 24 hours).
   4. In the Worker: **Domains → Add Domain** → `learn.asejik.com`. Cloudflare creates the DNS record and HTTPS certificate.
   5. Check `https://asejik.com` and email still work, and ask the AI agent to re-run the read-only checks on `https://learn.asejik.com`.
7. Add a free uptime monitor on the live URL (item 9), and record the hosting processor check in the P03 audit.
8. Optional, your decision: **Settings → Observability → Workers Logs** keeps the Worker's error lines (no names, emails or webhook URL) in Cloudflare for a few days. Off by default; without it, use `npx wrangler tail` to watch live logs. If you turn it on, add it to the P03 data inventory.

---

## 4. Pilot Roster (Google Sheet + Apps Script, owner steps)

The signup handler (`lib/pilotSignup.ts`) POSTs `{ fullName, email, consentedAt, ageConfirmed, source }` and only reports success when the script answers **JSON `{"ok": true}`**. Apps Script answers HTTP 200 even on failure, so any other reply is treated as "not recorded" and the learner is asked to try again.

1. In your Google account (2FA on), create a sheet named `Learn with Asejik – Pilot Roster`. Rename the first tab to `Roster`; row 1 headers: `receivedAt | fullName | email | consentedAt | ageConfirmed | source`. Keep it private.
2. **Extensions → Apps Script**, replace the code with the script below, save.
3. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** (Cloudflare calls it without a Google login; the long URL is the credential). Authorize, copy the URL ending in `/exec`.
4. Store it only as the Cloudflare secret `PILOT_SIGNUP_WEBHOOK_URL` (and in `.env.local` for local testing). Never in code, chat or a `NEXT_PUBLIC_` variable.
   - **Changing the script later:** use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL. A *new deployment* gets a new URL, and the secret would still point at the old code.
   - **If the URL leaks:** create a new deployment, update the secret to the new URL, then **archive the old deployment** in Manage deployments. A new deployment does not switch off the old URL.
5. Make one real test signup on the deployed site and confirm the row appears.
6. Retention: delete rows after the pilot plus 12 months, as the privacy notice promises.
7. Duplicates: if the roster is slow, a learner can see "couldn't save" even though the row was written, and their retry adds a second row. Before contacting learners, remove duplicate rows by email (**Data → Data cleanup → Remove duplicates** on the email column).

```javascript
// Learn with Asejik pilot roster: receives signups from the Cloudflare Worker.
const SHEET_NAME = "Roster";

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);
    // Same limits as the website's checks, in case the URL is ever used directly.
    const valid =
      data.source === "learn-with-asejik-pilot" &&
      data.ageConfirmed === true &&
      isText(data.fullName, 100) &&
      isText(data.email, 100) &&
      data.email.indexOf("@") > 0 &&
      isText(data.consentedAt, 40);
    if (!valid) return reply({ ok: false, error: "invalid" });

    SpreadsheetApp.getActive()
      .getSheetByName(SHEET_NAME)
      .appendRow([
        new Date().toISOString(),
        safeCell(data.fullName),
        safeCell(data.email),
        safeCell(data.consentedAt),
        true,
        data.source,
      ]);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: "server" });
  } finally {
    lock.releaseLock();
  }
}

function isText(value, maxLength) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

// Stop text like "=HYPERLINK(...)" from being run as a spreadsheet formula.
function safeCell(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```
