---
name: adr
description: Record an architecture/physics decision for hikeit as an ADR in docs/adr/ (numbered, classic format) and update the index. Use when the user says "/adr <decision>", "write an ADR", "record this decision", or when a plan/research changes a previous decision.
---

# ADR skill

1. Find the next number: `ls docs/adr/ | sort | tail`. File: `docs/adr/NNNN-<slug>.md`.
2. Format:
   ```
   # NNNN. <Title>
   Status: Accepted | Superseded by NNNN | Deprecated
   Date: YYYY-MM-DD
   ## Context   (forces, constraints, research links docs/research/…)
   ## Decision  (what, in one or two paragraphs; key numbers/formulas if physics)
   ## Consequences (positive, negative, follow-ups)
   ```
3. If it supersedes an earlier ADR, set that ADR's Status to "Superseded by NNNN".
4. Add a line to `docs/adr/README.md` index. Keep ADRs short (< 60 lines) and decision-focused; details belong in research/plans.
