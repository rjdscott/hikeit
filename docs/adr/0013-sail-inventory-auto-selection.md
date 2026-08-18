# ADR-0013 — Sail inventory with ranked modes and automatic sail selection

**Status:** Accepted  
**Date:** 2026-08-18

## Context
v1 depowered only through `flat`; a real crew changes headsail and reefs. Rob confirmed the boat is the deep-keel (2.65 m), carbon-rig configuration and asked for J2/J3/J4 + reefs with automatic selection.

## Decision
- `xp44.json` sail inventory: full main (66 m², carbon rig P 17.92) plus first/second reef variants (55 / 45 m², CE lowered 0.7 / 1.4 m), J1 106 % (48.2 m²), J2 (41), J3 (33), J4 (25), Code 0. Each sail carries its own CE height and ORC `kpp`.
- `sailModes[]` gain an optional `rank` (0 = most sail): J1 → J2 → J3 → reef 1 + J3 → reef 1 + J4 → reef 2 + J4. Code 0 is unranked (reaching only, manual).
- **Auto** (`sailMode: 'auto'`, the default): `selectSailMode` walks the ranked modes and picks the first whose auto-trim solution at the target heel needs `flat ≥ 0.7` and is not trim-limited; otherwise the smallest combination. Threshold 0.7 puts J1→J2 near 14 kn and J3 near 18 kn with a hiking crew — the "change down" point real crews use. Choosing Auto in the UI also switches auto-trim on, because sail selection only makes sense when someone is managing power. The resolved mode is shown ("Flying: Full main + J2").
- Boat data moved to the deep-keel / carbon-rig configuration: draft 2.65 m, Δ 9750 kg, RM1 265 kg·m/°, AVS 124°, P 17.92 / IG 18.18 / ISP 19.87 (ORC PHANTOM / X-MEN sisterships, research 01).
- Wind sweep and "free wind" use the sails currently flying (fixed across the sweep) so the comparison stays about crew.

## Consequences
- The auto-trim/A-B story extends naturally: crew on the rail lets the boat carry a bigger headsail at the same TWS (tested: rank(hike) ≤ rank(below)); the selection is monotone in TWS.
- Auto costs up to six extra `solveFlat` calls per derive (still ~10 ms); the perf test bound covers it.
- Reef/J2–J4 areas and CE heights are typical values, not measured sails; the JSON is the place to correct them.
