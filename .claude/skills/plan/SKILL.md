---
name: plan
description: Write an implementation plan for a hikeit feature or change into docs/plans/ (context, decisions, approach, files, verification, phases). Use when the user says "/plan <feature>", "plan out X", "write a plan for X".
---

# Plan skill

1. Understand first: read CLAUDE.md, relevant `src/` files, `docs/adr/README.md`, and any `docs/research/` that applies. Ask the user only about choices that materially change the work (use AskUserQuestion, ≤4 questions).
2. Write `docs/plans/YYYY-MM-DD-<slug>.md` with sections: **Status** (Draft/Approved/Done), **Context** (why), **Decisions** (table), **Approach** (architecture, files to add/change with one-line purpose, reuse of existing functions with paths), **Physics/data changes** (if any, with worked numbers), **Verification** (tests to add, manual checks, adversarial review if physics), **Phases** (each independently verifiable), **Risks/open items**.
3. Keep it scannable (< ~150 lines). Prefer the laziest design that works; note deferred items explicitly.
4. When executed, flip Status to Done and link the commit(s).
