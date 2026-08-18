# hikeit — crew weight & righting moment

Interactive, educational simulator of how crew position on the rail changes the righting moment of a monohull — built for a crew briefing on an X-Yachts Xp 44 with 10 crew.

**Live:** https://rjdscott.github.io/hikeit/

Drag crew around a deck plan (rail, hiking out, cockpit, below, leeward), set true wind speed/angle and sail power (or let the "trimmers" hold a target heel), and watch — all live — the heeled stern view with force couples, righting vs heeling moment curves and their equilibrium, heel vs wind ("free wind"), and the equations with real numbers substituted. A guided 8-step lesson runs on top of the sandbox. Scenarios are shareable by URL.

## Model in one paragraph
Hull GZ is a parametric curve `GZ = GM·sinφ·[1−(φ/φv)^n]` calibrated to public ORC certificate data for Xp 44 sisterships (RM@1° ≈ 260 kg·m/°, AVS ≈ 120°). Crew are point masses: `RM_crew = Σ m g (y cosφ − (z−z_G) sinφ)`. Heeling moment `HM = ½ρV²A·C_H·h·cos²φ` with ORC-style lift/drag tables, induced drag, ORC "flat" + twist depower, `h = Z_CE + 0.43T`; apparent wind from true wind + a seed polar. Equilibrium by bisection. Details, sources and assumptions: [docs/research](docs/research), decisions: [docs/adr](docs/adr).

## What's in it
- Drag crew on a deck plan or tap a person for their card (position, posture, weight, kN·m); presets; pin A/B to compare formations.
- Stern view with the two force couples, animated **puff** mode (roll dynamics, overshoot, crew caught inboard vs in place).
- Righting/heeling moment vs heel, heel vs wind ("free wind"), live equations, sitting-vs-hiking figures.
- 9-step lesson with predict-then-reveal quizzes; presenter mode (P); glossary; PWA (works offline).
- Sail inventory J1–J4 + reefs with auto selection; cockpit target-speed card; deep keel + carbon rig data from ORC certificates.

## Develop
```
npm install
npm run dev      # http://localhost:5173/hikeit/
npm test         # vitest: physics, state, lessons, dynamics, sail selection
npm run lint
npm run e2e      # Playwright + axe (set CHROME to a Chromium/headless-shell binary, or `npx playwright install chromium`)
npm run build
```
CI runs lint → unit → e2e/axe against the production build → deploys to GitHub Pages on push to `main`. Decisions: [docs/adr](docs/adr); reviews: [docs/reviews](docs/reviews).

## Use your own boat
Edit `src/data/xp44.json`: hull/stability (paste your ORC `RM at 1°`, AVS), rig, deck slots, sails (area, CE height, C_L/C_D vs AWA), sail modes, and the polar table (`bsp[tws][twa]` in knots). Adding a spinnaker mode is a JSON entry.

*Educational tool for briefings — not a stability certificate.*
