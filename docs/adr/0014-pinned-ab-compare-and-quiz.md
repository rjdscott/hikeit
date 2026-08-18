# ADR-0014 — Pinned A/B comparison, predict-then-reveal quiz, PWA + MIT

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The v1 "ghost" only remembered the previous formation and vanished on the next change. Rob asked for a proper A/B, for the lesson to make people commit to a prediction (PhET research: predicting boosts retention), and for offline use on the boat.

## Decision
- **Pin A**: `snapshot(state)` (crew, wind, trim, sails, toggles, overrides) is stored in `state.pinned`; `derive` runs for A and B; a Compare panel lists heel, RM crew/total, flat, drive, free wind and G-shift as A → B with green/red deltas. While pinned, the ghost curve on the moment chart and hollow ghost markers on the deck plan show A. "Back to A" restores the snapshot (keeping the pin), "Re-pin" replaces it, "Unpin" clears. Pins are not serialised into the URL hash (kept simple).
- **Quiz**: `LessonStep.quiz` (question, unit, slider range, `answer(before, after)`, `explain(before, after)`) on three steps — crew to rail (Δheel), sit → full hike (ΔkN·m), free wind (kn). Pressing "Next: predict →" shows the question before the step's patch is applied; "Reveal" applies it and reports "you said X — it's Y" with an explanation; results and a score (within 15 % of range) persist in `localStorage` (`hikeit.quiz.v1`).
- **PWA**: `manifest.webmanifest`, SVG + PNG icons, OG image, and a hand-written `sw.js` (network-first navigation, cache-first hashed assets, cache purge on activate) registered only in production builds. **MIT** license added; repo already public.

## Consequences
- The briefing can be run as a series of bets: pin A, ask the room, change B, reveal — with the same numbers in every view.
- Quiz answers are computed live from the model, so they can never drift from what the app shows.
- Service-worker cache name is static (`hikeit-v1`); Vite's hashed asset names make stale assets harmless, but a schema change to cached HTML would need a cache-name bump.
