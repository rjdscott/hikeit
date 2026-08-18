# ADR-0012 — Puff mode: 1-DOF roll dynamics on top of the static model

**Status:** Accepted  
**Date:** 2026-08-18

## Context
Everything in v1 is static equilibrium. The reflex a crew briefing actually wants to teach — hike *before* the puff, not after — depends on the boat rolling past its new steady heel when a gust hits. Rob chose "puff button + animated heel" over a full wind timeline.

## Decision
- One degree of freedom in roll: `I·φ̈ = HM(φ, V(t)) − RM_total(φ) − c·φ̇`, φ positive to leeward, using the existing static `heelingMoment`, `rmHull` and `rmCrew` functions unchanged.
- Roll inertia `I = 6.2·Δ` kg·m² (≈ 60 t·m² for the Xp 44, i.e. hull + keel + rig + entrained water) tuned so the natural roll period `T = 2π√(I/(Δ g GM)) ≈ 4 s` — typical 3–5 s for a 40–45 ft keelboat. Damping ratio `ζ = 0.35` (keel + sails), `c = 2ζ√(I·Δ g GM)`. Both are `RollParams` and can be exposed later.
- Gust profile: base TWS plus a ramp (1.5 s) – hold (5 s) – decay (2.5 s) of `+ΔTWS` (user slider 2–10 kn), starting 1 s into a 14 s window. Apparent wind is recomputed each step from the gust TWS at fixed boat speed.
- Sails, `flat` and crew positions are **held fixed** through the puff — stated in the panel — because the point is what happens before anyone reacts.
- The trajectory is integrated up front (semi-implicit Euler, dt = 1/60 s, sampled at 30 Hz) and then played back with `requestAnimationFrame`; the stern view takes a `dyn` override (instantaneous heel, gust wind) and the Puff panel draws the heel trace with the steady-before and steady-in-puff lines and the peak/overshoot annotation. Charts are memoised so the 60 fps playback re-renders only the stern view and trace.

## Consequences
- Overshoot of ~3° for a +5 kn puff from 20°, settling to the new static heel within ~2 roll periods — the "why hike early" story is visible, and A/B pinning lets a crew compare formations under the same puff.
- Deterministic and unit-tested (period band, profile, overshoot > 0 and bounded, return to base, zero puff = no motion). No wave forcing, no gust-induced apparent-wind angle change, no dynamic sail response, no crew reaction — all deliberate; the first candidates for a later "timeline" mode.
- Inertia and damping are educated defaults, not measured; treat overshoot magnitude as indicative (±1–2°).
