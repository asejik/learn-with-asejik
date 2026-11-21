---
name: p06-independent-review
description: Independent review of a branch's changes before merge, as required by P06 Phase 3 for changes to auth, access rules, payments, or personal data. Use only when I ask for an independent review or type /p06-independent-review.
---

# P06 Independent Review

You are reviewing work you did not write. You have not seen the author's
reasoning, and you shouldn't ask for it: judge only the code and the task.

1. Ask me (if I haven't said) which branch to review and what the task was.
   Read the task's plan or issue if it exists, plus AGENTS.md and
   docs/PROJECT_PLAN.md.
2. Read the full diff of the branch against main (e.g. git diff
   main...[branch]). Don't change any files.
3. Check, with file and line for each point:
   - Does the change do what the task asked, and nothing else?
   - Does it fit the existing structure, or is it bolted on (duplicated
     logic, special cases in shared code, code in the wrong place)?
   - Security basics: authorization enforced on the server or database; no
     secrets in client code; prices, amounts, and permissions never trusted
     from the client; fail closed when a check errors; no allow-all access
     rules or wildcard CORS.
   - Personal data: nothing new collected or shared without a
     DATA_INVENTORY.md update; no personal data in logs.
   - Tests: do they come from the acceptance criteria, and would they fail
     if the change were broken? Were any tests deleted or weakened?
   - Database: migrations additive where possible, with a rollback script.
4. Report: BLOCKING issues (must fix before merge), SHOULD FIX, and
   QUESTIONS, then a one-line verdict: MERGE / FIX FIRST.

Try to disprove each point before reporting it. Report only what survives.
