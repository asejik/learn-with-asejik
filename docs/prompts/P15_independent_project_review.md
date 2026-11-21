# P15: INDEPENDENT PROJECT REVIEW

Stage: Review | Run: when a project was built (or partly built) with a
different AI tool or model, before launch or client handover, when taking
over someone else's project, or any time you want a second opinion on the
whole project
Output: docs/audits/P15_[YYYY-MM-DD].md

Follow docs/prompts/AUDIT_STANDARD.md for context loading, rigor level,
evidence, severity, reporting, and fixing.

---

ROLE
Act as a senior engineer brought in to review a project you didn't build.
You've seen AI-built projects where the reports said "done", "fixed", and
"passed" when they weren't. Trust nothing you haven't checked: treat every
claim in the docs, reports, and commit messages as a claim to verify, not a
fact. Be fair: confirm what is genuinely good as clearly as what isn't.

OWNS: verifying other tools' and sessions' claims, tracing the work from
stage to stage, and judging which earlier prompts' outputs can be trusted.
NOT HERE: re-doing every audit in depth. Where an area needs a full audit,
name the prompt to re-run (P03, P07, P08, P09, P10, P11, P12, P13, P14)
instead of repeating it here.

INDEPENDENCE
- Best run with a different AI model from the one that built the project.
  A second model catches different mistakes. If you know you are the same
  model that built it, say so.
- Run it in a fresh session. Don't read earlier chat transcripts. Judge
  from the code, the repo, the docs, and what you can run.
- If the project's rules file was written for a different AI tool than the
  one you are running in, read it anyway: its rules still apply.

---

STEP 0 - INVENTORY
- What exists: the prompt plan, idea brief, project plan, data inventory,
  design file, setup notes, runbook, progress log, audit reports, findings
  register, tests, CI configuration. List each with its date.
- What the prompt plan said would be done (if there is one), and how far the
  project has got (planning, building, pre-launch, live).
- Git history: who and what made the changes (tool names in commit
  messages or co-author lines, if present), and whether work went through
  branches and pull requests or straight to main.

---

REVIEW SECTIONS (mark N/A where a stage hasn't happened yet)

1. Process followed?
   - Each step the prompt plan marked USE or LIGHT has an output, and the
     output is current (not older than significant later changes)
   - Steps skipped without a recorded reason
   - Changes made outside the safe-change process: big mixed commits,
     commits straight to main, no PROGRESS.md entries, no tests added with
     features

2. Ground truth (run it yourself; paste real output)
   - Install from the lockfile, then type check, lint, tests, and build
   - CI configuration exists and runs the same checks; recent CI results
     if you can see them
   - Compare with what the progress log or reports claim ("all tests pass",
     "build green"). Any mismatch is a finding.

3. Claims check (the core of this review)
   - FIXED findings: re-test every CRITICAL and HIGH one, and a sample of
     the rest (at least 5, or all if fewer). Mark each CONFIRMED FIXED, NOT
     FIXED, or CAN'T VERIFY.
   - "Checked and passed" items in the latest audit reports: re-check a
     sample, starting with security and privacy items
   - ACCEPTED RISK items: each has a reason, who accepted it, and a review
     date that hasn't passed
   - The latest walkthroughs or progress entries: pick 3 claimed features
     or fixes and confirm they exist and work (with a browser tool on a
     local or preview URL, test accounts only)
   - Tests: are they real? Look for tests that can't fail, tests that only
     restate the implementation, skipped or deleted tests, and assertions
     loosened to make a run pass.
   - Silenced errors: ts-ignore, "any", eslint-disable, empty catch blocks,
     disabled access rules, allow-all policies, wildcard CORS added to make
     something work

4. Stage-to-stage tracing
   - Idea brief to plan: the plan solves the stated problem; scope cuts and
     changes are recorded in the Decisions Log
   - Plan to code: every MVP feature and user story is built (DONE /
     PARTIAL / MISSING / CHANGED, with evidence). Flag features built that
     were never planned.
   - Acceptance criteria to tests: the critical journeys have end-to-end
     tests that check those criteria
   - Code to data inventory: every piece of personal data the code collects,
     stores, logs, or sends to a third party is in the inventory, and the
     privacy notice matches it
   - Data model to access rules: every table or collection holding user data
     has access rules; spot-check them with the two-account test (log in as
     User A, try to read or change User B's data)
   - Design file to UI: tokens actually used, no drift into one-off values
     (spot-check)
   - Findings to fixes: every finding has a status; nothing CRITICAL or
     HIGH is quietly OPEN

5. Structure and maintainability (a quick pass; P09 goes deeper)
   - Signs of features bolted on rather than fitted: duplicated logic,
     special cases in shared code, oversized files, the same job done in
     several places
   - Dead code, unused dependencies, leftover debug output
   - Could another tool or developer pick this up from the docs and the
     rules file alone?

6. Risk hotspots (re-check directly; these are where AI-built projects most
   often go wrong)
   - Secrets in the code, git history, or client bundle (run a secret
     scanner)
   - Authorization enforced on the server or database, not just in the UI
   - Payments: amounts computed on the server, webhooks verified
   - Personal data in logs or error reports
   - Dependencies that are unknown, abandoned, or lookalike packages
   - Destructive operations (deletes, migrations) with confirmations,
     backups, and rollback

---

TRUST TABLE (required)
One row per earlier prompt that has an output: prompt, date of last output,
verdict, reason.
- TRUSTED: claims checked held up
- PARTLY TRUSTED: some claims didn't hold; re-run the listed sections
- NOT TRUSTED: re-run in full, in a fresh session
- MISSING: should exist per the prompt plan (or the project's stage), but
  doesn't

VERDICT
- SOUND: the work and its claims hold up; minor findings only
- SOUND WITH FIXES: real issues, but the foundations are right
- NEEDS REWORK: important claims didn't hold, or a foundation (data model,
  access rules, structure) needs changing before more is built

ADDITIONAL REPORT SECTIONS (on top of AUDIT_STANDARD)
- Claims that didn't hold up, each with the original claim, where it was
  made, and what you found
- What is genuinely good (so it isn't changed by mistake)
- The re-run plan: which prompts to run next, in order, with SCOPE lines
- Add each finding to docs/audits/FINDINGS.md. Re-open (status REGRESSED)
  any finding marked FIXED that isn't.

RULES
- A claim with no evidence is unverified, not false. Say CAN'T VERIFY and
  what would settle it.
- Don't fix anything during the review. Fixes come after I approve
  findings, one at a time.
- Never sign in with real accounts, submit real forms or payments, or change
  production data. Use test accounts on local or preview URLs.
- Compare the work with its own plan and the suite's rules, not with how
  you would have built it. Different isn't wrong.

QUICK CHECK I CAN DO MYSELF
Pick the three features the project says are finished. Use each one on the
preview site with a test account. Then ask the reviewer to show me the test
that covers each of them, and the line in the progress log or walkthrough
that claimed it was done.
