# RUNBOOK: Learn with Asejik

For the owner, to follow when something is wrong. Written 2026-11-24 (P13 Part A, LIGHT). Never put passwords, keys or the webhook URL in this file.
Items marked **UNTESTED** have not been tried on the live site yet; try each once when nothing is wrong (see the drill at the end).

## 1. What runs where

| Part | Where | Owner account | Notes |
|---|---|---|---|
| Code and content | GitHub repo `asejik/learn-with-asejik` | owner GitHub (2FA on) | `main` deploys to production |
| Build and hosting | Cloudflare Workers Builds, Worker `learn-with-asejik` | owner Cloudflare (2FA on) | builds `out/` and serves it as static files |
| Signup endpoint | the same Worker, `/api/*` only | same | secret `PILOT_SIGNUP_WEBHOOK_URL` lives in the Cloudflare dashboard only |
| Pilot roster | Google Sheet + Apps Script web app | owner Google account | the only store of learner personal data |
| Domain | `asejik.com`, subdomain `learn.asejik.com` | owner registrar and Cloudflare DNS (2FA on) | |
| Mail to privacy@asejik.com | ImprovMX forwards to the owner's inbox | ImprovMX account | |
| Logs | Cloudflare Workers Logs (on) | same Cloudflare | holds request metadata, not names or emails |
| Uptime monitor | UptimeRobot (to be set up, see section 5) | owner UptimeRobot | |

Learner progress lives only on each learner's phone. There is no database to restore.

Support: Cloudflare (dash.cloudflare.com, Help), GitHub (support.github.com), Google Workspace or Google Account help, ImprovMX (improvmx.com). Privacy regulator: NDPC (ndpc.gov.ng). Cyber incidents: ngCERT. Fill in your own phone and a backup contact here: ______

## 2. How do I...

**Roll back a bad release (site broken or wrong content)**
1. Fastest and safest: in GitHub, open the merged pull request and press Revert, merge the revert pull request. Cloudflare rebuilds and deploys `main` (about 2 to 4 minutes). Check https://learn.asejik.com afterwards.
2. Quicker still, UNTESTED: Cloudflare dashboard, Workers & Pages, `learn-with-asejik`, Deployments, pick the last good version and roll back. Cloudflare says a rollback keeps your current secret values. It is not confirmed whether the static files roll back with it, so after a dashboard rollback check the page content, and follow it with step 1 anyway so git matches production.
3. Learners' phones keep the old copy until the service worker updates; the worker is `no-cache` so this takes one or two visits.

**Switch signup off (kill switch)**: in Cloudflare, Worker `learn-with-asejik`, Settings, Variables and Secrets, delete `PILOT_SIGNUP_WEBHOOK_URL`. Signup then answers 503 and lessons keep working. Put it back to switch signup on. UNTESTED on live.

**Rotate the webhook URL** (if it leaked or you changed the script)
1. Apps Script: Deploy, Manage deployments, create a new deployment, copy the new `/exec` URL. Archive the old deployment (the old URL stops working).
2. Cloudflare: set the secret `PILOT_SIGNUP_WEBHOOK_URL` to the new URL. Signup fails between step 1 and step 2, so do them together.
3. Check with `wrangler dev` or a test signup you can delete afterwards; confirm one row arrives.

**Show a maintenance message**: not available. There is no switch for it. To warn learners, change the text of the catalog heading in a pull request. GAP (P16-O03).

**Find logs for a time window**: Cloudflare dashboard, Workers & Pages, `learn-with-asejik`, Logs; filter by time. Success and failure lines of signup are logged without names or emails. For live viewing from your computer: `npx wrangler tail` (needs `wrangler login`).

**Check a signup worked**: open the Google Sheet; a new row has `receivedAt` within seconds.

**Deploy a content fix**: edit the lesson JSON, push a branch, open a pull request, merge when CI passes; live within minutes.

## 3. Severity and first steps

- **SEV1**: site down for everyone, learner data exposed, or the webhook URL leaked.
- **SEV2**: signup broken, or a lesson unusable.
- **SEV3**: a wrong word or a visual glitch.

SEV1 or SEV2: (1) write down the time you noticed, what you see, and what you did, as you go; (2) contain: roll back, switch signup off, or rotate the URL (section 2); (3) do not delete logs or sheet history; (4) decide whether personal data could be involved (section 4); (5) fix with a normal branch and a regression test; (6) within a week write what happened, the cause and what will prevent it, in `docs/incidents/<date>_<name>.md`.

## 4. If learner data may have leaked (DRAFT for a DPCO or DPO to review)

Personal data here is the roster: full name, email, consent time, 18+ flag. A breach is any access, loss, change or disclosure you did not intend: the sheet shared by mistake, the webhook URL leaked and used, your Google or Cloudflare account taken over, the sheet deleted.
1. **Write down the moment you became aware.** The NDPC expects notice within 72 hours of that moment. (Confirm this and the form with your DPCO.)
2. Contain: rotate the URL, remove sheet sharing, change the account password, end other sessions.
3. Count the people affected: the number of roster rows (the Worker keeps no copy).
4. Gather: what happened, when, what data, the risk of harm, how many people, what you did to reduce harm, how you will tell them, a named contact.
5. Tell affected people straight away if harm is likely (for example scam emails), with what to do.
6. Notify the NDPC; also ngCERT for a cyber incident. Draft every message and read it before sending; send nothing you have not approved.
Template for learners: "On [date] we found that [what]. The data involved is [name and email]. It does not include [passwords, payment details, lesson progress]. We have [action]. What you can do: [watch for suspicious email, do not click unexpected links]. Contact privacy@asejik.com."

## 5. Monitoring (set up by you; nothing below is live yet)

| Check | Tool | How |
|---|---|---|
| Site up | UptimeRobot keyword monitor | `https://learn.asejik.com/`, keyword `Learn with Asejik`, every 5 minutes |
| A lesson page up | UptimeRobot keyword monitor | `https://learn.asejik.com/courses/how-apis-work/01-what-is-an-api`, keyword `The Digital Waiter` |
| Signup endpoint alive | UptimeRobot keyword monitor | `https://learn.asejik.com/api/pilot-signup`; a GET answers 405 JSON, so look for the keyword `Method not allowed` (the live body was checked on 2026-11-24). Never use a POST. If UptimeRobot counts a 405 reply as down, drop this monitor |
| Worker errors and usage | Cloudflare notifications | Notifications, add a Workers usage or error alert (check what the free plan offers) |
| Domain renewal | registrar | turn on auto-renew and an expiry email; note the date here: ______ |
| Certificates | Cloudflare | managed automatically; no action |

Alerts must reach a place you see: add your phone number or the UptimeRobot app as an alert contact, not only email. The free UptimeRobot plan checks every 5 minutes (50 monitors); whether app push is free is unconfirmed, so check in the account.

## 6. Maintenance calendar

| When | What |
|---|---|
| Weekly (5 min) | Look at UptimeRobot; skim Cloudflare Workers Logs for errors and 4xx/5xx spikes; look at the roster for rows that look fake |
| Monthly | Merge Dependabot pull requests (after CI passes); Cloudflare and GitHub security notices; check who has access to GitHub, Cloudflare, Google and the sheet; check Worker request usage |
| Quarterly | Run the drill below; re-run the security audit (P08); read this runbook for stale steps; rotate the webhook URL |
| Yearly | Re-run the privacy audit (P03); review the privacy notice and DPIA; renew the domain; 2FA and recovery codes still valid on every account; check ndpc.gov.ng for rule changes; decide whether the project changed shape and needs re-triage (P00) |

## 7. Drill (once a quarter, 20 minutes, nothing is broken)
1. Switch signup off and on again; confirm 503 then a working signup with a test row you delete.
2. Roll back with the dashboard, check what the page serves, then roll forward. Write down whether the static files rolled back.
3. Find the last signup in the logs by time.
4. Time how long a revert pull request takes from merge to live.
Record the results at the end of this file and update any wrong step above.

## Drill results
(none yet)
