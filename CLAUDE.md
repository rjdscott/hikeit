# hikeit — Claude guide

Interactive educational sim: how crew position (rail / hiking / cockpit / below) changes the righting moment of an X-Yachts Xp 44, vs wind. React 18 + Vite + TypeScript, no chart/drag/state libraries. Deployed to GitHub Pages at https://rjdscott.github.io/hikeit/ by `.github/workflows/deploy.yml` on push to `main`.

## Commands
- `npm run dev` — Vite dev server (`/hikeit/` base path)
- `npm test` — vitest (physics, state, perf); CI gate before deploy
- `npm run build` — `tsc --noEmit && eslint . && vite build`
- `npm run e2e` — Playwright drag/tap/sheet/quiz/puff flows + axe (needs `CHROME=<chromium binary>` locally)
- Screenshot: `CHROME=<headless-shell> node scripts/shot.mjs out.png "http://localhost:5173/hikeit/#tws=14" 1380`

## Layout
- `src/physics/` pure functions, all unit-tested: `boat.ts` (resolve boat.json, GM from ORC RM1, slots, polar), `stability.ts` (GZ, RM_hull, RM_crew), `aero.ts` (apparent wind, ORC-style C_L/C_D → C_H, heeling moment, drive), `solve.ts` (curves, equilibrium bisection, auto-trim flat, wind sweep).
- `src/model.ts` — `derive(state)` = whole compute pipeline; `src/state.ts` — reducer, presets, URL-hash + localStorage.
- `src/ui/` — DeckPlan (drag/snap/posture), HeelSection (stern view), Charts (moment vs heel, heel vs TWS), Controls, Readouts, Equations (KaTeX, lazy), Advanced, Lesson. `src/data/xp44.json` boat config; `src/data/lessons.ts` lesson steps.
- `docs/research/` research reports · `docs/plans/` plans · `docs/adr/` decisions. Keep these current: new research → `/research`, new plan → `/plan`, new decision → `/adr` (project skills in `.claude/skills/`).

## Conventions
- Physics: SI internally (rad, m, kg, N); UI shows deg, kn, kN·m. Boat frame: x aft from bow, y windward +, z up from DWL. Sign: righting +.
- Boat data lives in `xp44.json` only — never hard-code hull/rig numbers in components. Adding a sail/mode/polar = JSON edit (see ADR 0006).
- Colour vocabulary is fixed (CSS vars): hull/RM navy, crew amber, buoyancy teal, sail/HM red, ghost grey. Reuse; don't invent.
- Every physics change: update/extend `src/physics/physics.test.ts`, keep worked numbers in `docs/research/02-physics-model.md` consistent, run an adversarial review for non-trivial changes.
- Minimal deps. Prefer deleting over adding.
