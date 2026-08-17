# ADR-0004 — Parametric GZ curve calibrated to ORC certificate data

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The Xp 44's full righting-arm table exists only in the paid per-boat ORC Stability & Hydrostatics Datasheet. Public ORC certificates for six sisterships give RM at 1° (248.6–272.7 kg·m/deg), LPS/AVS (119.6–125.2°) and sailing displacement (9.65–10.4 t) — see [research 01](../research/01-xp44-specifications.md). Real hydrostatics would require hull lines that are not public.

## Decision
Model the bare-hull curve as `GZ(φ) = GM · sin φ · [1 − (|φ|/φ_v)^n]` with `GM = 57.3·RM₁/Δs`. Defaults: RM₁ = 260 kg·m/deg (class median), Δs = 9700 kg → GM ≈ 1.54 m; φ_v = 120°; n = 1.6. The form was validated against ORC's published CAL-39 curve to within ~2 % up to 40° ([research 02 §1.3](../research/02-physics-model.md)). GM/RM₁, AVS and n are exposed in an Advanced panel and the app labels the curve as approximate. The research agent's heel-calibrated GM of 1.9 m was rejected in favour of measured certificate data.

## Consequences
- Physics is three numbers, trivially replaceable when Rob obtains his own certificate (paste RM₁/AVS into `xp44.json`).
- Absolute values carry ±15 % uncertainty (sistership spread); relative effects of crew placement — the teaching goal — are robust to it.
- Curve is unreliable past ~130° heel; irrelevant for the sailing range shown.
