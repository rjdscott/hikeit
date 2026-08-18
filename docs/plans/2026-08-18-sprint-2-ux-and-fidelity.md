# Sprint 2 — UX taste, dynamics, sail inventory

**Status:** In progress (2026-08-18). Follows the shipped v1 ([plan](2026-08-18-hikeit-implementation-plan.md), [reviews](../reviews/)).

## Context
v1 is live and physically defensible. Rob's feedback: crew movement and the link between a person and their status feels clunky on phones; the lesson should make people *predict*; hiking timing in puffs is the reflex the static model can't teach; the boat is deep keel + carbon rig; headsail changes/reefs are the real depower path.

## Decisions (user-confirmed)
| Topic | Decision |
|---|---|
| Venue | Phones / iPads first; desktop stays good. |
| Crew interaction | Tap a crew marker → **bottom sheet** (name, kg, position chips, posture segmented control, contribution). Drag retained with bigger targets + snap animation. Crew table becomes a compact list that opens the same sheet. |
| Gust | **Puff button** (+N kn for a few seconds): 1-DOF roll dynamics (inertia, damping, RM(φ)−HM(φ,t)), animated stern view + heel trace; overshoot shown; "hike early" comparison. |
| Quiz | Predict-then-reveal at 3 lesson moments (crew to rail Δheel; sit→hike ΔkN·m; free wind kn). Slider guess → reveal, score kept locally. |
| Compare | **Pin A** freezes a formation (+wind/trim); B is live; tiles show A→B deltas; per-crew contribution bars; ghost curve persists until unpinned. |
| Boat | Deep keel 2.65 m, carbon rig (P 17.92, ISP 19.87, IG 18.18); RM1 ≈ 265 kg·m/°, AVS ≈ 124°, Δ 9750 (from deep-keel/carbon certs PHANTOM/X-MEN). |
| Sails | Inventory: main (reef 0/1/2) + J1 106% / J2 / J3 / J4 + Code 0. **Auto sail selection**: largest combination that holds target heel with flat ≥ 0.6 (else change down/reef); manual override. |
| Housekeeping | MIT license; PWA (manifest + service worker, offline). Slack/domain later. |
| Target card | Target TWA/BSP from cockpit card; upwind speeds provisional until re-photo. |

## Approach
- `src/physics/dynamics.ts`: `stepRoll(state, dt)`: I·φ̈ = RM_total(φ) − HM(φ, V(t)) − c·φ̇; I ≈ Δ·k² with k ≈ 0.35·B (roll gyradius), c from ~15% critical damping (tunable in Advanced). Puff = TWS + ΔTWS ramp up 1 s, hold 4 s, ramp down. `useAnimation` hook drives φ at 60 fps; equilibrium view uses static φ when idle.
- `src/data/xp44.json`: `sails[]` extended (J2 40 m², J3 33 m², J4 25 m², reef1/2 as main variants), `sailModes[]` generated from inventory (main×reef × headsail); `hull.draft` 2.65; `stability` deep-keel values; `rig` carbon.
- `src/physics/sailplan.ts`: `selectSails(boat, wind, crew, targetHeel)` → smallest depower that keeps flat ≥ 0.6 at target heel: order [J1, J2, J3, J4] × [full, reef1, reef2].
- UI: `CrewSheet.tsx` (bottom sheet, `<dialog>`-like fixed panel), `Compare.tsx` (pin/unpin, delta tiles), `Quiz.tsx` (inline in Lesson), `Puff.tsx` (button + heel trace sparkline), PWA files (`public/manifest.webmanifest`, `sw.js` via minimal hand-written cache-first).
- Phone polish: sticky mini-stat bar (heel, RM crew, free wind) under header on mobile; larger hit targets; reduced motion respected.

## Verification
- Tests: dynamics settles to static equilibrium (|φ_dyn−φ_eq| < 0.2° after 20 s), overshoot > 0 for a step gust; sail selection monotone with TWS; deep-keel GM; quiz scoring; A/B delta math.
- e2e: sheet opens on tap, moves crew via chip, posture control; puff button animates and returns.
- Screenshots 400/1380; adversarial review round 3 (UX + physics of dynamics) before shipping.

## Phases
P1 boat data (deep keel/carbon), sail inventory + auto selection, tests → P2 crew bottom sheet + drag polish → P3 A/B compare + per-crew bars → P4 quiz → P5 puff dynamics → P6 PWA + license + mobile polish → P7 review round 3 → deploy.
