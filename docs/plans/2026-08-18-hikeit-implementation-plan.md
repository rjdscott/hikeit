# hikeit implementation plan

**Status:** Approved 2026-08-18 (plan mode); implementation in progress. Source of truth for decisions: [ADRs](../adr/README.md).

---

# hikeit — Crew Weight & Righting Moment Simulator (X-Yachts Xp 44)

## Context
Rob wants an interactive, beautiful, educational web app to teach a 10-person crew how crew position (rail, hiking out, cockpit, below, leeward) changes the righting moment of their Xp 44, and how that trades against wind strength (heel, depowering, "hiking = free wind"). Live equations + net forces/moments always visible; drag crew around a deck plan. Free deploy, shareable link. Later: import real ORC polars + spinnaker modes.

Repo `rjdscott/hikeit` is empty (Python .gitignore only — it ignores `lib/`, `build/`, `dist/`; add `node_modules/`, never name a folder `src/lib`).

## Decisions (user-confirmed)
| Topic | Decision |
|---|---|
| Scenario | Upwind + reaching: TWS 4–30 kn, TWA 35–110°; AW from TW + boat speed. |
| Crew | 10 named crew (default "Crew 1–10", 85 kg), edit name/kg; drag to **snap slots** on top-down deck; posture per rail crew: sit / legs-over / full-hike; presets. Persist in localStorage; scenario share via URL hash. |
| Format | Dashboard + guided lesson stepper (~8 steps) + sandbox. Audience: experienced club racers, light maths. |
| Stack | React 18 + Vite + TypeScript. Deps: react, react-dom, katex; dev: vitest. **No** chart/drag/state libs — hand-rolled SVG, PointerEvents, useReducer/useMemo. |
| Look | Clean light editorial (paper bg, navy/teal), one colour per concept reused everywhere (sail/HM=orange, buoyancy=teal, gravity/hull RM=navy, crew=amber, equilibrium=red, ghost=grey). |
| Physics | Parametric GZ curve calibrated to real Xp44 ORC certificate data; clearly labelled approximate; Advanced panel to tune. |
| Extensibility | `src/data/xp44.json` boat config: hull, stability, rig, deck slots, `sails[]` w/ CL/CD-vs-AWA tables, `sailModes[]`, optional `polar` (TWS×TWA→BSP[,heel]). Add spinnaker = JSON entry + sailMode. |
| Deploy | GitHub Pages via Actions → `https://rjdscott.github.io/hikeit/`. |
| Units | Metric + knots. |
| Verification | vitest physics tests + adversarial multi-agent (Fable) review of physics + code + UX before ship (user requested). |

## Research findings that anchor the model (sources in agent reports; cite in-app "About/Assumptions")
**Xp 44 hull/rig** (builder + ORC certs of sisterships HEART OF GOLD, PHANTOM, XAR, ADRENALINA, ANTELOPE, X-MEN):
LOA 13.29 m, LWL 11.89, Bmax 4.07 (ORC 4.052), draft 2.30 std / 2.65 deep, light disp 8650 kg, ORC sailing disp 9654–10382 kg, ballast 3850 kg (T-bulb, iron fin + lead bulb). Rig (ORC): P 17.405, E 5.940, IG 18.215, J 4.983, BAS 1.775, ISP 19.18, SPL 5.863; main 63.9 m², jib 48.2 m², Code0 103.8 m², A2 192 m². Freeboard ≈1.2–1.4 m (derived).
**Stability (ORC certs)**: RM@1° = 248.6–272.7 kg·m/deg (class), LPS/AVS 119.6–125.2°, Stability Index 126–137. → GM = 57.3·RM1/Δ ≈ 1.37–1.54 m. Full GZ table exists only in paid per-boat ORC Stability Datasheet (open item: Rob may obtain his own cert → drop-in RM1/GZ).
**Crew**: ORC default crew wt for Xp44 = 911–932 kg (formula 25.8·LSM0^1.4262), declared 915 kg → 10–11 crew @85–89 kg. ✔ premise.
**Rules**: RRS 49.2 — torso inside lifelines except briefly; with upper+lower lifelines, sitting facing outboard w/ waist inside lower lifeline, upper body may be outside upper lifeline (= legal max hike, caps y ≈ +0.4 m over sitting). ORC: hiking devices credit +0.5 m outboard on sportboats (context only). Lifelines ≥600 mm.
**Prior art**: none does crew-placement RM interactively. Quality bar: ciechanow.ski/naval-architecture (arrow vocabulary, direct manipulation). Formula sanity: Seldén RM calculator (crew-on-rail input).

## Physics model (pure functions, `src/physics/`, all unit-tested)
Conventions: φ heel (rad internally, +ve leeward), y transverse (+windward), z up from DWL, g 9.81, ρair 1.225.

1. **Hull GZ (parametric)**: `GZ(φ) = GM·sinφ·[1 − (φ/φv)^n]`, GM from cert: `GM = 57.3·RM1/Δs`. Defaults **RM1 = 260 kg·m/deg, Δs = 9700 kg → GM ≈ 1.536 m, φv = 120°, n = 1.6**. Validated vs ORC-published CAL-39 curve (GM 1.08, φv 113°, n 1.6): GZ 10/20/25/30/40/60° = 0.184/0.348/0.416/0.478/0.563/0.597 vs published 0.186/0.349/0.416/0.475/0.565/0.574 (≤2% to 40°). `RM_hull = Δs·g·GZ(φ)`.
2. **Crew**: `RM_crew = Σ m_i g (y_i cosφ − (z_i − z_G) sinφ)`; z_G ≈ −0.1 m, rail crew z ≈ 1.4 m (deck ~1.05 + 0.35), below-decks z ≈ 0.4. Toggle "ORC-style (ignore z term)" for teaching. Break-even angle `arctan(y/(z−z_G))` ≈ 55° — lesson point. Slot y from hull halfbeam(x) − 0.35 inset; posture +0 / +0.2 / +0.4 m; helm/trimmer at 0.7·halfbeam (ORC eq 4.30); leeward slots negative y.
3. **Aero**: `HM = ½ρ V_aw² A_ref C_H(β) h cos²φ`, `C_H = C_L cosβ + C_D sinβ` from per-sail CL/CD tables vs AWA β (area-weighted over active sail mode; ORC 2-D style tables — starting values transcribed from ORC VPP Table 5.1/5.4; reviewer must check), + induced drag `C_L² A/(π h_eff²)`. Upwind full-power C_H,max ≈ 1.35 (β≈27°). Depower `flat ∈ [0.42,1]`: C_L·flat, ORC twist `Z_CE·[1 − 0.406(1−flat) − 0.902(1−flat)(1−frac)]`, frac = IG/(P+BAS). Heeling arm `h = Z_CE + 0.43·T`; Z_CE area-weighted (main CE = BAS+0.4P above sheer, jib 0.38·IG above tack) ≈ 9.3 m above WL → h ≈ 10.2 m. `A_ref` = Σ active sail areas (main 63.9 + jib 48.2).
4. **Wind**: `V_aw² = V_tw² + V_b² − 2 V_tw V_b cos(TWA)`; AWA from vector. Boat speed: bilinear interp of coarse polar table in xp44.json (seed with plausible Xp44 numbers e.g. upwind 5.5/7.0/7.6 kn @ 8/12/18 TWS, reaching higher) — one code path; real ORC polar replaces the table later.
5. **Equilibrium**: bisection on `f(φ)=RM_total−HM` over `[−φ_GZmax, φ_GZmax]`, 40 iters; no root → `overpowered` state (shown, not clamped). Auto-trim mode: closed-form `flat_req` for target heel (default 20°), clamp + "trim-limited" flag. Wind sweep: φ_eq vs TWS 4–30 for current formation vs baseline (all in cockpit) → "free wind Δ kn at target heel". Boat-speed proxy penalty past φ_opt (labelled heuristic).
6. **Worked sanity (RM1 260, Δs 9700)**: RM_hull(20°) ≈ 47 kN·m; 10×85 kg hiked y≈2.0 → RM_crew(20°) ≈ +11.7 kN·m (ORC-style +15.7); crew centreline→rail swing ≈ 15 kN·m ≈ 22–30% of hull RM; ≈0.4° heel per crew member; hiking harder +0.3 m ≈ −0.6°.
7. **Assumptions list** (shown in app): parametric GZ; GM ±15% between sisterships; crew as added weight (no re-float); static (no RM_V dynamic, no waves); cos²φ sail reduction; single C_H per AWA; constant boat speed per TWS/TWA; no pitch/leeway; not a safety tool.

## Architecture (≈21 files)
```
.github/workflows/deploy.yml   npm ci → test → build → upload-pages-artifact → deploy-pages
index.html, package.json, tsconfig.json, vite.config.ts (base '/hikeit/', vitest node)
src/main.tsx, src/index.css      tokens (CSS vars), grid layout, media queries
src/App.tsx                       useReducer + memoised pipeline + grid; hover state; lazy Equations
src/state.ts                      State/Action/reducer, presets, URL-hash encode/decode, localStorage
src/data/xp44.json                boat config (hull, stability, rig, deck outline+slots, sails[], sailModes[], polar)
src/data/lessons.ts               LessonStep[] {title, body, patch(state), focus}
src/physics/boat.ts               resolveBoat(json, overrides): GM from RM1, halfbeamAt(x), generated+mirrored slots, sails for mode, polar interp
src/physics/stability.ts          gz, rmHull, crewPositions, rmCrew
src/physics/aero.ts               apparentWind, cH(sails,awa,flat), zceEff, hm, solveFlat
src/physics/solve.ts              curves(0..90°), equilibrium (bisection), windSweep
src/physics/physics.test.ts       vitest
src/ui/svg.ts                     scale, linePath, niceTicks, usePointerDrag, useSize
src/ui/DeckPlan.tsx               top-down SVG, drag/snap/tap-to-place, posture toggle, ghost
src/ui/HeelSection.tsx            stern-view heeled section w/ forces
src/ui/Charts.tsx                 <Chart> frame + MomentChart + WindSweepChart
src/ui/Controls.tsx               TWS/TWA/flat/auto-trim/target heel, sail mode, presets, crew table
src/ui/Readouts.tsx               numbers + per-crew contribution table
src/ui/Equations.tsx              KaTeX live equations (lazy chunk)
src/ui/Advanced.tsx               GM/RM1, AVS, n, C_H scale, z-penalty toggle, boat.json view
src/ui/Lesson.tsx                 stepper strip
```
**State** `{tws, twa, flat, autoTrim, targetHeel, sailMode, crew[{id,name,kg,slot,posture}], prevCrew, zPenalty, overrides, lessonStep}`; actions `patch | moveCrew (swap if occupied, sets prevCrew) | setCrew | preset | lesson`. Derived chain (useMemo): boat → crewPts → bsp/aw → flatEff → curves (1° res) → equilibrium (+ghost) → sweep → readouts. Cost sub-ms.
**Components** pure, narrow props: DeckPlan, HeelSection, MomentChart, WindSweepChart, Controls, Readouts, Equations({values}), Advanced, Lesson. Colours via CSS vars in SVG (`stroke="var(--c-rm)"`).
**Geometry**: boat frame in metres; `deck.outline=[[x,halfbeam]…]` ~8 pts, halfbeamAt(x) linear; rail slots generated (`fromMast 1 m, count 8, spacing 0.53, inset 0.35, z 1.4`) both sides; explicit helm/trimmer/pit (mirrored), bow, below (centre). DeckPlan viewBox in metres, rotate −90° bow-up on phone with crop from mast aft; drag via `getScreenCTM().inverse()` + `DOMPoint`; `touch-action:none; user-select:none`; `setPointerCapture`; snap nearest slot ≤0.9 m else revert; tap-crew-then-tap-slot fallback; deck ≤70vh on phone. HeelSection: earth frame origin at WL, `scale(1,-1)`; hull half-section points from json (deck edge (2.03,0.95) → bilge → keel root), keel fin to −2.3, bulb ellipse; hull+deck+mast+crew+G in `rotate(−φ)`; water rect; B, GZ bar, weight↓ at G, buoyancy↑ at B, sail force → at CE, hydro ← at −0.43T; arrow length ∝ force one shared scale.
**Charts**: hand-rolled; `useSize` ResizeObserver → px viewBox (12px text on phone); MomentChart: RM_hull, RM_total, HM lines, crew band fill, equilibrium marker, ghost dashed, hovered-crew line; WindSweep: heel vs TWS current vs baseline, target-heel line, "free wind +X kn" annotation, overpowered hatch.
**KaTeX**: `memo(Eq)` w/ `katex.renderToString` into `dangerouslySetInnerHTML`; tex strings built with toFixed → memo skips unless digits change; `lazy(() => import('./ui/Equations'))`, css imported inside → separate chunk.
**Layout**: grid ≥900px `deck|section / controls|readouts / moment|sweep / eq|advanced`; <900px single column (lesson, deck, controls, section, readouts, moment, sweep, eq, advanced); Advanced + per-crew table in `<details>`; native range/select/input.
**Lesson steps** (patch state + prose, sailing language): 1 boat alone (GZ, GM) → 2 wind & equilibrium → 3 crew all cockpit vs rail (RM_crew) → 4 posture/lever y·cosφ → 5 z-penalty & 55° break-even → 6 wind sweep "free wind" → 7 auto-trim: hike vs flatten (power/speed) → 8 reaching TWA 90 (C_H drops) + RRS 49 + ORC crew-weight note → sandbox.
**Deploy**: deploy.yml (push main + dispatch; permissions pages:write id-token:write; setup-node 22; `npm ci && npm test && npm run build`; upload `dist`; deploy-pages). Manual once: repo Settings → Pages → Source "GitHub Actions". `base:'/hikeit/'` (classic blank-page trap). No router → no 404 fallback.

## Verification
1. **vitest** (`src/physics/physics.test.ts`): CAL-39 GZ table ±0.025 m; GM from RM1 = 1.536; RM_hull(20°) ≈ 47 kN·m ±5%; RM_crew hiked ≈ 12 kN·m ±10%, leeward negative, zPenalty off ≥ on; AW (TWS10/TWA90/BSP7 → AWS≈12.2, AWA≈55°); C_H,max upwind ≈1.35; HM monotone in φ; equilibrium unique on bracket, overpowered at TWS30/flat1/all-below; solveFlat round-trip ±0.2°; sweep monotone; snap/swap pure fn.
2. **CI**: `tsc --noEmit` + vitest on every push before deploy.
3. **Adversarial multi-agent review** (user opt-in "agent teams … adversarial reviews"): after P5, run a Workflow: parallel reviewers — (a) physics/units/signs re-derivation vs ORC VPP eqs, (b) sailor's realism (heel vs TWS table, crew Δ°), (c) React perf/a11y/mobile drag, (d) UX/design consistency; each finding adversarially verified by 2 refuters; fix confirmed items; re-run tests. Report findings + fixes.
4. **Manual**: `npm run dev` desktop drag/resize; iPhone Safari drag + tap-to-place; deployed URL loads at `/hikeit/`; lesson steps walk through; URL-hash share round-trip.

## Implementation order (each step verifiable)
P0 scaffold (Vite React-TS, deps, tsconfig, vite base, deploy.yml, .gitignore node_modules) → push, enable Pages, "hello" live.
P1 xp44.json + physics modules + tests green.
P2 state.ts (reducer, presets, hash/localStorage) + Controls + Readouts (numbers match worked values).
P3 DeckPlan drag/snap/posture/presets/ghost (desktop + phone).
P4 Charts (moment + wind sweep).
P5 HeelSection with forces.
P6 Equations (lazy KaTeX) + Advanced panel.
P7 Lesson stepper, About/Assumptions, responsive polish.
P8 Adversarial review workflow → fixes → deploy → share link.

## Open items / risks
- GM is the weakest input (cert spread ±15%; agent heel-calibration suggested 1.9 vs cert-derived 1.54) → default cert value, exposed slider; if Rob gets his own ORC cert, paste RM1 (and polar) into xp44.json.
- Sail CL/CD tables approximate → adversarial reviewer to check vs ORC VPP doc; scaled to C_H,max≈1.35 upwind.
- Deck dims (cockpit length, side-deck width) not published → stylised outline from LOA/beam; slot arms are the physics-relevant part.
- Mobile: touch-action:none blocks scroll over deck plan → cap height + tap fallback.
- KaTeX ~100 kB gz → lazy chunk.
