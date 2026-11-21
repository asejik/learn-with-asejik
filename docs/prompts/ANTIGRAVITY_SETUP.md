# ANTIGRAVITY SETUP

How to set up Google Antigravity so the suite's rules are enforced, not just
requested. Do this once per machine (global settings) and once per project
(workspace files). P04 checks it.

Antigravity changes quickly. These steps were checked against the official
docs (antigravity.google/docs) in November 2026. If a setting has moved or
been renamed, follow the current docs and tell the AI what you found.

---

## 1. Files in each project (workspace)

| File or folder | What it does |
|----------------|--------------|
| AGENTS.md (repo root) | Project rules, from AGENTS_TEMPLATE.md. Always on, no frontmatter. Keep well under 24 KB (larger rule files are cut off). |
| .agents/rules/*.md (optional) | Extra topic rules. Each needs YAML frontmatter with trigger: always_on, model_decision (needs a description), glob (needs globs), or manual (@-mention). A file without valid frontmatter is silently ignored. Only files directly in rules/ are read. |
| .agents/skills/<name>/SKILL.md | The suite's skills (copy the whole skills/ folder from this edition). Type /p06-safe-change-protocol, /p08-security-audit, etc. to run a prompt. |
| .agents/mcp_config.json | Project MCP servers, if any. Database servers: read-only or a dev project only. |
| docs/prompts/ | This edition's prompts/ folder: the prompts, AUDIT_STANDARD.md, templates, supplements, and this guide. The skills read the prompts from here. |

Antigravity also reads AGENTS.md and .agents/ in parent folders up to the
repo root, and older .agent/ folders. Use .agents/ for new projects.

Workflows (.agents/workflows/) are deprecated in favour of skills. This
edition uses skills only.

## 2. Global settings (once per machine)

Settings > General:
- **Permission preset**:
  - Default (commands run in the terminal sandbox) for LIGHT and STANDARD
    projects.
  - Request Review (every command needs approval) for STRICT projects and
    anything touching a client's production.
  - Never Turbo on a real project: it removes the sandbox and allows
    everything.
  - Projects can override the global preset (Settings > Projects).
- **Plan Review Policy**: Request review ("Always Ask"). Implementation
  plans then wait for your comments and Proceed. P06 relies on this.
- **Deny list** (rules are written as action(target); Deny beats Ask beats
  Allow). Suggested entries, adjusted to your machine:
  - read_file for .env files and any folder holding production keys
  - command(rm -rf)
  - command(git push --force) and command(git reset --hard)
  - command(sudo)
- **Allow list** (optional, to cut approval prompts): read-only commands
  such as command(git status), command(git diff), and your test and lint
  commands, e.g. command(regex:npm run (build|lint|test)).
- **Non-workspace file access**: off.

Settings > Browser:
- **Browser actuation rules**: Allow your localhost ports and preview
  domains; Ask for production domains; Deny anything the agent has no
  reason to visit. Rules match domains, not paths.
- If you use the Chrome DevTools MCP instead of the built-in browser, keep
  the **Browser JavaScript execution policy** on Request Review.
- The built-in browser always blocks sign-in providers, payment processors,
  and CAPTCHAs, and asks you to sign in yourself. Use test accounts.

The app may not keep a settings file you can commit, so record what you set
in docs/SETUP.md (P04).

## 3. How the suite maps onto Antigravity

| Suite step | In Antigravity |
|------------|----------------|
| P06 Phase 1 plan, then STOP for approval | Planning mode (or /plan): the implementation plan artifact. Comment on it inline, then click Proceed. |
| P06 fast lane (TRIVIAL) | Fast mode |
| P06 Phase 3 UI check | The browser subagent, with screenshots saved to the walkthrough |
| P06 Phase 3 independent review | A NEW conversation running /p06-independent-review, ideally on a different model from the one that wrote the code |
| P06 Phase 4 report | The walkthrough artifact |
| Audit reports | Saved to docs/audits/ and shown as an artifact |
| Rules (P06-A) | AGENTS.md |
| Running a prompt | /p00-project-triage ... /p14-launch-gate, or "Follow docs/prompts/P08_security_audit.md" |

## 4. Models

Antigravity lets you choose the model per conversation, including Gemini
and Claude models (check the current list; it changes often).
- Plans, audits, and P00/P02: the strongest reasoning model you have, in
  Planning mode.
- TRIVIAL changes: a fast model in Fast mode.
- Independent review: a different model from the one that wrote the code.
  A second model catches different mistakes.

## 5. Verify it works (5 minutes)

1. Ask the agent to show the contents of .env: it should be blocked or ask.
2. Ask for a small change in Planning mode: it should stop at an
   implementation plan and wait for Proceed.
3. Type /p00-project-triage: the skill should start and read
   docs/prompts/P00_project_triage.md.
4. Ask the agent to open your production site and click a button: it
   should ask first (actuation rule set to Ask).
