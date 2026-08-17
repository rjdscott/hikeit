---
name: research
description: Run and record a research investigation for hikeit — web/first-principles research on sailing physics, boat data, UI tech, etc. — writing one markdown report per element into docs/research/ with sources. Use when the user says "/research <topic>", "research X", "look into X and document it".
---

# Research skill

Goal: answer a question rigorously and leave a durable, sourced report in `docs/research/`.

1. Clarify the question in one line; list the sub-elements (each becomes a file). If ≥2 independent elements, launch parallel Explore/general-purpose agents (WebSearch/WebFetch) — one per element — with a terse "structured report + source URLs + gaps" brief.
2. For each element write `docs/research/NN-<slug>.md` (next free NN): title, date, question, findings (tables of numbers with units and source links), derived values (flag as derived), gaps/uncertainties, sources list. Prose normal, tight.
3. Update `docs/research/README.md` index (one line per file).
4. If findings change a decision → write/update an ADR via `/adr`. If they change model numbers → update `src/data/xp44.json` and tests, and note it in the report.
5. Reply with a 5-line summary + file list.
