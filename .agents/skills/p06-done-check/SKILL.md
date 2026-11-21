---
name: p06-done-check
description: The P06 DONE CHECK, with evidence, before any task or milestone is called done. Use whenever you are about to say a task, feature, fix, or milestone is done or complete, and when I type /p06-done-check.
---

# P06: DONE CHECK

Read the DONE CHECK section of docs/prompts/P06_safe_change_protocol.md and
run all five items on the current task (or on the milestone I name). If I
give no task, use the latest task in docs/PROGRESS.md and its acceptance
criteria in docs/PROJECT_PLAN.md.

Rules:
- Show evidence for each item: file and line, test name with real output,
  browser screenshots, or host docs. Don't summarise.
- Run the tests and checks yourself now. Don't rely on earlier runs or on
  what the walkthrough says.
- Treat your own earlier claims as unverified until you've checked them
  again.
- End with DONE (everything VERIFIED) or NOT DONE plus the list of what's
  left. Never answer "mostly done".

If docs/prompts/P06_safe_change_protocol.md doesn't exist, stop and tell me
to copy the suite's antigravity/prompts/ folder into docs/prompts/ first.
