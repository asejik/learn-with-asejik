# P06: SAFE CHANGE PROTOCOL

Stage: Build | Run: EVERY task (features, bug fixes, refactors, database
changes, config, audit fixes)
Output: a working change on its own branch + report + updated
docs/PROGRESS.md

Two parts:
- P06-A: permanent rules. They live in AGENTS.md (see AGENTS_TEMPLATE.md) so
  the AI loads them in every session. P04 enforces the critical ones with
  CI, branch protection, and tool permissions.
- P06-B: this protocol. Paste it (or say "Follow docs/prompts/P06") with each
  task.

---

## P06-B: SAFE CHANGE PROTOCOL

TASK: [describe the change]
TYPE: [TRIVIAL / FEATURE / BUG FIX / REFACTOR / DATABASE / CONFIG /
AUDIT FIX: finding ID]

Follow the project rules (AGENTS.md, or the rules above if there is none)
and these phases in order. Do not skip phases.

FAST LANE (TYPE: TRIVIAL only)
Copy or text changes, or styling inside one component, with no logic, data,
auth, payment, or dependency changes. Skip the Phase 1 approval stop: state
the plan in 2-3 lines, make the change on a branch, then do Phase 3 and a
short Phase 4. If it turns out not to be trivial, stop and switch to the
full protocol.
In Antigravity, Fast mode is fine for the fast lane.

HOW THIS MAPS TO ANTIGRAVITY
- Phase 1 is your implementation plan: work in Planning mode (or start with
  /plan), put everything Phase 1 asks for in the plan, and wait for my
  comments and Proceed. Don't start Phase 2 before that, whatever the Plan
  Review Policy says.
- Phase 4 is your walkthrough artifact, using the format below, with
  screenshots of UI changes.

PHASE 1 - PLAN (then STOP for my approval)
- Confirm the working tree is clean and create a branch for this task (e.g.
  fix/login-redirect). If it isn't clean, remind me to commit a checkpoint
  first and give me the git commands.
- Find the commands for type check, lint, build, and tests (from AGENTS.md
  or package files). Run them BEFORE changing anything and report the
  baseline. List existing failures; don't hide or fix them silently.
- Restate the task, and check it against docs/PROJECT_PLAN.md if it exists.
  Flag conflicts. Client projects: flag if the task is outside the agreed
  scope (it may need a change request).
- List:
  - Files you will create or modify, and why
  - Existing features that could be affected (impact analysis)
  - Any database, configuration, or dependency changes needed
  - Tests you will add or update. Tests for critical journeys come from the
    acceptance criteria in the plan, not from reading your own code.
- Fit check: say where this change belongs in the current structure (which
  module, component, or service owns this job) and why. If there is no
  clean place for it (it would need duplicated logic, special cases in
  shared code, an already-large file growing further, or code where it
  doesn't belong), STOP and propose a preparatory refactor as a separate
  task first (TYPE: REFACTOR, behaviour unchanged, its own branch), then
  this task on top of it. Don't refactor without approval, and don't force
  a bad fit.
- Privacy check: does this collect new personal data, send data to a new
  third party, or change who can see data? If yes, list the data inventory
  updates (docs/DATA_INVENTORY.md, if the project has one) and whether a
  privacy re-check (P03) is needed.
- Size check: if the task touches more than about 8 files or more than one
  feature, propose splitting it.
- Re-triage check: does this change hit a re-triage trigger in
  docs/PROMPT_PLAN.md, if it exists (e.g. adds logins, new personal data,
  payments, AI, public pages, a new platform)? If yes, say so: P00 should be
  re-run.
- Risk check: does it touch auth, access rules, payments, or personal data?
  If yes, mark it for INDEPENDENT REVIEW in Phase 3.
- BUG FIX tasks, additionally:
  - Reproduce the bug first (exact steps, or a failing test)
  - Find the root cause with evidence (code, logs, data). Explain it in
    plain language BEFORE proposing a fix. No guess-and-patch.
  - Propose the fix, and a test that fails now and will pass after the fix
- DATABASE tasks, additionally:
  - Inspect the live schema with read-only queries: affected tables,
    columns, types, constraints, access policies, and any views,
    functions, or triggers that reference them
  - The migration (or rules-file change), marked ADDITIVE or DESTRUCTIVE,
    with every existing table, query, policy, or feature it affects
  - Rollback script to undo it
  - Whether a backup is recommended before running it
  - Never change the production schema directly; dev first if a dev
    database exists

PHASE 2 - IMPLEMENT (after my approval)
- Make only the approved changes.
- Apply database changes only in the way I approve (dev first if a dev
  database exists).
- Regenerate database types after schema changes, and fix any type errors
  they reveal (these usually mean a query no longer matches the schema).
- If the same error survives two fix attempts, STOP and explain what you've
  learned instead of trying a third workaround.

PHASE 3 - VERIFY (show real output for each)
- Type check (with unused checks on), lint, build, tests
- New tests: a bug-fix test fails without the fix and passes with it (show
  both runs)
- Unused-code tool (e.g. knip) on changed files. List removals for my
  approval; never delete silently.
- Compare with the Phase 1 baseline: nothing that passed before may fail now
- Every query in changed files matches the regenerated types
- UI changes: use the browser subagent on a local or preview URL at 360px
  and desktop width, click through the changed journey, check the console
  for errors, and save the screenshots to the walkthrough.
- Bug fixes: the reproduction steps no longer produce the bug
- INDEPENDENT REVIEW (if marked in Phase 1): stop and tell me to open a NEW
  conversation, ideally with a different model than the one that wrote the
  code, and run /p06-independent-review on this branch. It reviews the diff
  against the task, AGENTS.md, and the security basics, without seeing your
  reasoning. Fix or explain each point it raises.

- Push the branch. The automated checks (CI) must pass. Give me the preview
  URL to test, if there is one.
- If you cannot run a check, say so and give me the exact command.

DONE CHECK (required before you call anything done; show evidence, don't
summarise. TRIVIAL tasks: items 1 and 5 only.)
1. Requirements: list every acceptance criterion for this task. For each,
   give the file and line that implements it AND the test or browser check
   that proves it, with real output. A criterion without both is NOT DONE.
2. Failure paths: for every outside call the change touches (API, database,
   file, email, SMS, message send, payment), show what the code does when
   it fails, times out, or returns an error object instead of throwing.
   Run a test for the most important one. Silently carrying on is a
   failure, not a pass.
3. Restarts and state: where is each piece of state stored (memory, local
   disk, database, browser)? Show evidence (the host's docs or config) that
   it survives a restart and a redeploy on this host. Free tiers often wipe
   local disks.
4. Warning signs: search the changed code for:
   - hardcoded true/false, sample values, or placeholder logic
   - return values that are ignored
   - empty catch blocks, or errors that are logged and then ignored
   - settings or options that are read but never used
   - TODO, FIXME, "for now", or "temporary"
   - outside or user content inserted into HTML without escaping
   - endpoints that change data or settings without a permission check
   List every hit and what you did about it.
5. Claims: list every claim in your summary (or walkthrough). Mark each
   VERIFIED, with its evidence, or UNVERIFIED. Only VERIFIED items may be
   called done.
If anything is UNVERIFIED or failing, the answer is NOT DONE, followed by
what's left.

PHASE 4 - REPORT (use exactly this format)
1. Summary: what changed, in plain language
2. Branch and files changed: list with one line each
3. Database changes: what was applied (yes/no, where) and the rollback
   script location
4. Check results: pass/fail for each with output, CI status, and the
   independent review result if one ran
4a. DONE CHECK: the five items above, with evidence. The task is DONE only
   if every acceptance criterion and every claim is VERIFIED.
5. Privacy: DATA_INVENTORY.md updated? (yes, or not needed and why)
6. ACTIONS FOR ME: env variables to add (and where, e.g. Vercel),
   migrations to run, settings to change, packages to install, the pull
   request to merge after I test the preview, anything to tell the client.
   Write "None" if none.
7. MANUAL TEST CHECKLIST: step-by-step things to click through to confirm
   the change works AND that nearby features still work
8. Risks and follow-ups: anything uncertain, skipped, or worth watching
9. Update docs/PROGRESS.md: date, task, what changed, what's next, known
   issues (keep recent entries; summarise older ones). If the change alters
   a planned decision, update the Decisions Log in docs/PROJECT_PLAN.md.
   If this was an AUDIT FIX, mark the finding FIXED in
   docs/audits/FINDINGS.md.

ONE-TIME SETUP: see P04 (Project Setup & Guardrails).
