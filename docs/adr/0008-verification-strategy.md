# ADR-0008 — Verification strategy

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The tool will be used to teach; wrong numbers or signs would mis-teach. The owner explicitly asked for a good test suite, testing as we go, and adversarial multi-agent (Fable) review of calculations and code.

## Decision
1. **Unit tests (vitest)** on the pure physics: GZ model vs ORC CAL-39 table (±0.025 m); GM from RM₁; RM_hull(20°) ≈ 47 kN·m; RM_crew hiked ≈ 12 kN·m, leeward negative, ORC-style ≥ z-penalised; apparent-wind vector cases; upwind C_H,max ≈ 1.35; HM monotone in φ; equilibrium root existence/uniqueness on the bracket and overpowered flag; auto-trim round-trip; wind sweep monotone; snap/swap pure functions.
2. **CI gate**: `tsc --noEmit` + vitest run before every GitHub Pages deploy.
3. **Adversarial multi-agent review** before shipping: parallel reviewers for (a) physics/units/signs re-derived against ORC VPP equations, (b) sailing realism (heel vs TWS, per-crew Δ°), (c) React performance/accessibility/mobile drag, (d) UX/design consistency; each finding challenged by independent refuters; only confirmed findings are fixed; tests re-run.
4. **Manual checks**: desktop drag/resize; iPhone Safari drag and tap-to-place; deployed URL under `/hikeit/`; lesson walk-through; URL-hash share round-trip.

## Consequences
- Physics regressions are caught before deploy; reviewers focus on model realism rather than arithmetic.
- Multi-agent review costs tokens; run it at milestones, not on every commit.
