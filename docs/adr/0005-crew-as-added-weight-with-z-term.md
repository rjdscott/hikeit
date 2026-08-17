# ADR-0005 — Crew modelled as added point masses with transverse and vertical terms

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The lesson is about how crew position changes righting moment. ORC's VPP credits crew as `(CARM·CREW_RW + …) cos(heel)` and ignores crew height. Physically, crew sitting ~1.4 m above the boat's VCG also incur a `−(z − z_G) sin φ` penalty that grows with heel — roughly a third of the gross gain at 25°, and a break-even near 55° for hiked crew. Rule 49.2 limits how far outboard a torso may go.

## Decision
`RM_crew(φ) = Σ mᵢ g (yᵢ cos φ − (zᵢ − z_G) sin φ)`, added to the bare-hull RM (no re-float of displacement). Crew occupy discrete **snap slots** defined in `xp44.json` (windward/leeward rail slots generated from the hull outline with a 0.35 m inset, plus helm at 0.7·half-beam, main trimmer, pit, bow, below-decks). Rail crew have a **posture**: sit (+0), legs over lifelines (+0.2 m), full hike (+0.4 m) — the RRS 49.2 legal maximum. A toggle "ORC-style (ignore crew height)" drops the z term for comparison. Crew are named and individually weighted (default 85 kg × 10 ≈ ORC default crew weight).

## Consequences
- Every drag or posture change produces a visible, attributable change in RM; the per-crew table shows each person's contribution.
- The z-term makes the 55° break-even a teachable moment and shows why coachroof seating is doubly bad.
- Fore/aft position affects only the achievable arm (hull taper); pitch/trim are explicitly out of scope.
- ~35 mm sinkage from crew mass is ignored (<2 % on GZ).
