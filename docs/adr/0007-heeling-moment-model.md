# ADR-0007 — Heeling moment, depowering, and drive-force payoff

**Status:** Accepted  
**Date:** 2026-08-18

## Context
To show the trade-off between crew righting moment and wind strength, the model needs a plausible aerodynamic heeling moment across upwind and reaching angles, a way to depower, and a metric that expresses *why* extra righting moment helps.

## Decision
- `HM = ½ ρ V_aw² A_ref C_H h cos²φ`, with `C_H = C_L cos β + C_D sin β` from per-sail CL/CD tables vs apparent wind angle β (area-weighted over the active sail mode), plus ORC-style induced drag `C_L²·A/(π h_eff²)`. Full-power upwind `C_H ≈ 1.35`.
- Depowering via ORC's `flat ∈ [0.42, 1]`: `C_L·flat`, induced drag `∝ flat²`, and ORC twist lowering `Z_CE` by `[1 − 0.406(1−flat) − 0.902(1−flat)(1−frac)]`, `frac = IG/(P+BAS)`.
- Heeling arm `h = Z_CE + 0.43·T` (ORC hydrodynamic centre of pressure).
- Apparent wind from true wind + boat speed vector; boat speed from the seed polar table (bilinear interpolation).
- Equilibrium heel by bisection on `RM_total(φ) − HM(φ)`; no root → "overpowered" state. **Auto-trim** mode solves `flat` by bisection so heel equals a target (default 20°) and flags "trim-limited" at the 0.42 floor.
- The payoff of hiking is shown as **drive force** `F_R = ½ ρ V_aw² A C_R`, `C_R = C_L sin β − C_D cos β`, from the same coefficients — instead of a speculative heel-penalty speed heuristic.

## Consequences
- One consistent aerodynamic model gives heel, heeling moment and drive; "hiking = free wind" and "hiking = more power at target heel" both fall out of it.
- `cos²φ` is a textbook simplification; the model under-predicts force at large heel and ignores heel in the apparent-wind vector (documented in the app's assumptions).
- Coefficient tables need adversarial review (ADR-0008); reefing beyond `flat` is out of scope for now.
