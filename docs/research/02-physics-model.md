# Research 02 — Physics model for the crew-weight righting-moment simulator

Date: 2026-08-18. Target: X-Yachts Xp 44 (standard 2.3 m keel). Educational fidelity, not engineering-grade. Primary source: [ORC VPP Documentation 2023](https://orc.org/uploads/files/ORC-VPP-Documentation-2023.pdf) (eqs. 4.28–4.33, 5.7, 5.47–5.57, Tables 5.1/5.4).

> **Implementation note.** The research agent proposed a heel-calibrated GM of 1.9 m. The implementation instead defaults to the ORC-certificate class median (**RM₁ = 260 kg·m/deg, Δs = 9700 kg → GM ≈ 1.54 m**) because it is measured data, and exposes GM/RM₁ as an Advanced-panel slider. Boat speed uses a seed polar table (bilinear interpolation, replaceable by a real ORC polar) and the payoff of hiking is shown as **drive force** (C_R from the same sail coefficients) rather than the heel-penalty speed heuristic in §5.2 below.

## 0. Conventions

- φ = heel angle, positive to leeward; radians internally, degrees in UI.
- Boat frame: y transverse (+ windward), z vertical up, origin at waterline on centreline.
- Roll moments about the longitudinal axis; righting positive, heeling negative.
- g = 9.81 m/s², ρ_air = 1.225 kg/m³, ρ_water = 1025 kg/m³.

## 1. Righting moment fundamentals

### 1.1 Core relations

RM(φ) = Δ · g · GZ(φ)

Small angles (< ~10°): GZ ≈ GM · sin φ → RM ≈ Δ g GM sin φ.

Wall-sided (to deck-edge immersion, ~15–20° on a modern beamy hull):
GZ(φ) = (GM + ½ BM tan²φ) sin φ, BM = I_T / ∇. Beyond deck-edge immersion the tan² term diverges — the parametric curve takes over.

### 1.2 ORC "RM" and the unit trap

ORC certificates publish **Righting Moment at 1°** in **kg·m per degree**.

GM = 57.3 · RM₁[kg·m/deg] / Δ[kg]  RM₁[N·m/deg] = 9.81 · RM₁[kg·m/deg]

Verified against the ORC datasheet example (CAL 39): RM₁ = 159.4 kg·m/deg, Δ_sailing = 8459 kg, published GZ(2°) = 0.038 m → 8459 × 0.038 / 2 = 160.7 kg·m/deg ✓; GM = 57.3 × 159.4 / 8459 = 1.08 m.

Typical magnitudes: 12 m cruiser-racer 150–250; 13–14 m racer-cruiser 280–400; Class 40 ~230–300 kg·m/deg on 4600 kg.

### 1.3 Parametric GZ curve

Two knobs (initial slope GM, vanishing angle φ_v) plus a shape exponent n:

**GZ(φ) = GM · sin φ · [1 − (φ/φ_v)ⁿ]**  (φ, φ_v in radians; implementation uses |φ| so the curve is odd)

Properties: GZ(0) = 0; dGZ/dφ|₀ = GM; GZ(φ_v) = 0; single peak (n ≈ 1.6 → peak at ~0.48 φ_v).

Validation against the ORC-published CAL 39 curve (GM 1.08, φ_v 113°, n 1.6):

| φ | 10° | 20° | 25° | 30° | 40° | 60° | 90° | 120° |
|---|---|---|---|---|---|---|---|---|
| ORC published GZ (m) | 0.186 | 0.349 | 0.416 | 0.475 | 0.565 | 0.574 | 0.325 | −0.102 |
| Model (m) | 0.184 | 0.348 | 0.416 | 0.478 | 0.563 | 0.597 | 0.330 | −0.095 |

Within 1–2 % to 40°, ~4 % at the peak; degrades past 130° (irrelevant here). Tuning: n ∈ [1.5, 1.8] for bulb-keel racer-cruisers.

### 1.4 Xp 44 defaults (agent proposal — see implementation note above)

| Parameter | Agent default | Justification |
|---|---|---|
| Δ_light | 8650 kg | builder |
| Ballast | 3850 kg (44.5 %) | builder |
| Δ_sailing (ORC sailing trim, **includes** default crew ~930 kg on the centreline at z ≈ 0.98 m) | 9700 kg (implemented) | ORC sistership ~9654 kg — see correction note below |
| B_max | 4.07 m | builder |
| T | 2.30 m | builder (deep 2.65 m) |
| GM | 1.9 m (agent) / **1.54 m (implemented, from RM₁ 260)** | see note |
| RM₁ | 320 kg·m/deg (agent) / **260 (implemented)** | = Δ_s GM / 57.3 |
| φ_v (AVS) | 120° | 44 ft, 45 % ballast, bulb keel; certs 119.6–125.2° |
| n | 1.6 | CAL-39 fit |
| VCG | ~ −0.1 m rel. WL | mass budget: ballast @ −1.75 m, hull/interior @ +0.6 m, rig @ +7 m |

Agent-derived (GM 1.9): GZ_max ≈ 1.11 m at ~56°, RM_max ≈ 105 kN·m, GZ(25°) = 0.738 m, RM_hull(25°) = 69.9 kN·m.

GM uncertainty range 1.55–2.5 m from three estimates: unverified ORC cert "Born to Run" RM₁ 260.4 → GM ≈ 1.55; ORC default-RM regression (eq. 4.33) ≈ 350 → scaled ≈ 285; crude hydrostatics (I_T ≈ 0.048 L_wl B_wl³) → GM ≈ 2.5 (over-estimate). Agent's calibration: full power, Xp 44 heels 20–22° upwind in 12–14 kn TWS → GM 1.9 with C_H 1.35 reproduces 20° at 12.5 kn.

Sources: [ORC VPP 2023](https://orc.org/uploads/files/ORC-VPP-Documentation-2023.pdf) §4.4; [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard); [sailboatdata](https://sailboatdata.com/sailboat/xp-44/); [Marsh Design — stability curves](https://marine.marsh-design.com/content/understanding-monohull-sailboat-stability-curves).

## 2. Crew righting moment

### 2.1 Equation

Crew as an added-weight perturbation on the bare-boat GZ curve (transverse shift d changes GZ by +w·d/Δ · cos φ; vertical rise h by −w·h/Δ · sin φ):

**RM_crew(φ) = Σᵢ mᵢ g (yᵢ cos φ − (zᵢ − z_G) sin φ)**

RM_total(φ) = Δ_s g GZ(φ) + RM_crew(φ)

- yᵢ cos φ — the useful term; decays as cos φ (91 % kept at 25°, 71 % at 45°).
- −(zᵢ − z_G) sin φ — the penalty; crew ~1.4 m above VCG; at 25° costs ~4.9 kN·m (a third of the gross gain).
- Break-even: yᵢ = (zᵢ − z_G) tan φ → φ = arctan(2.0/1.4) ≈ **55°** for hiked crew.
- ORC's VPP omits the z term (eq. 4.30: (CARM·CREW_RW + 0.7·2·(B_max/2)·bodywt) cos(heel)); offer as a toggle ("ORC-style, ignore crew height").

### 2.2 Transverse arm defaults

ORC: crew occupy 0.53 m of side deck each; arm = average half-beam over occupied length; helm and main trimmer at 70 % of max half-beam.

| Position | y (m) | Basis |
|---|---|---|
| Below / centreline | 0.0 | |
| Sitting leeward | −1.85 | negative |
| Sitting on side deck, feet inboard | 1.85 | ORC deck-edge arm minus taper |
| Legs over lifelines, torso upright | 2.05 | +0.2 m |
| Full hike, upper body outside upper lifeline | 2.25 | +0.4 m; ORC sportboat hiking-strap credit +0.5 m; trapeze +1.2 m |
| Helm / trimmer | 0.7 × 2.035 = 1.42 | ORC eq. 4.30 |

Effective 10-crew arm (8 rail + 2 working) ≈ 1.83 m; headline default y_eff = 2.0 m for "everyone hiking".

zᵢ: seated on rail, crew CG ≈ 0.35 m above side deck; deck ≈ 1.05 m above WL → zᵢ ≈ 1.4 m. Legs-over hiking lowers z ~0.1 m.

Crew mass 85 kg default (75–95). ORC assumes 89 kg/person; default CW = 25.8·LSM0^1.4262 ≈ 935 kg for the Xp 44 → 10.5 crew, so 10 × 85 kg = 850 kg matches the ORC default.

### 2.3 Fore/aft position

Irrelevant to transverse RM in the model. Caveats: achievable y depends on station (hull narrows at ends); fore/aft governs pitch/trim — out of scope.

Sources: ORC VPP §4.4.3; [Hiking (sailing) — Wikipedia](https://en.wikipedia.org/wiki/Hiking_(sailing)); [SailZing — Hike Harder and Smarter](https://sailzing.com/hike-harder-and-smarter/).

## 3. Equivalent CG formulation

y_G = Σ mᵢ yᵢ / Δ_total, z_G' = (Δ_s z_G + Σ mᵢ zᵢ) / Δ_total, Δ_total = Δ_s + Σ mᵢ

RM_total(φ) = Δ_total g [GZ(φ) + y_G cos φ − (z_G' − z_G) sin φ]

For 850 kg at y = 2.0 m on 10,500 kg: y_G = 0.162 m; z_G rises 0.113 m. Crew add +8.8 % displacement (sinks ~35 mm; ignored). Do not mix the two formulations.

## 4. Heeling moment from wind

### 4.1 Equation

**HM(φ, V_aw) = ½ ρ_air V_aw² A_ref C_H h cos²φ**

C_H = C_L cos β + C_D sin β, C_R = C_L sin β − C_D cos β (ORC eqs. 5.50–5.51); HM_A = ½ ρ V_a² A_REF C_H (HBI + Z_CE·REEF) (eq. 5.57). The cos²φ factor is the textbook simplification (ORC resolves the full heeled apparent-wind vector instead); cos^1.3 is an empirical alternative.

### 4.2 Coefficient defaults (ORC 2-D tables at β = 27°)

- Main (high set): C_L 1.427, C_D0 0.026
- Jib/genoa (high set): C_L 1.50, C_D0 0.037
- Area-weighted: C_L ≈ 1.46, C_D0 ≈ 0.031; induced C_Di = C_L² A_ref/(π h_eff²) ≈ 0.080 (h_eff ≈ 30 m); C_D ≈ 0.11
- **C_H = 1.46 cos 27° + 0.11 sin 27° ≈ 1.35**, C_R ≈ 0.56 → the oft-quoted "C_H ≈ 1.0–1.2" is a depowered number.

### 4.3 Heeling arm

h = Z_CE + 0.43 T_max (0.43 T = ORC hydrodynamic centre of pressure, eq. 4.29).

Rig CE (main CE = 0.40 P above boom per ORC eq. 5.7; genoa CE ≈ 0.38 I above tack): area-weighted **Z_CE ≈ 9.2–9.3 m** above WL → h ≈ 10.2 m (use ~10 m). The 7–8 m rule of thumb is the mainsail-only geometric CE, not CE-to-CLR.

### 4.4 Depowering — the ORC `flat` parameter

flat ∈ [0.42, 1.0] (0.42 = wind-tunnel floor, 58 % lift reduction).

C_H(flat) = flat·C_L cos β + (C_D0·f_cd + C_E C_L² flat²) sin β ≈ flat·C_H,max

ORC twist (eq. 5.49) lowers the CE as you flatten:
Z_CE = Z_CE|flat=1 · [1 − 0.406(1−flat) − 0.902(1−flat)(1−frac)], frac = I/(P+BAS) ≈ 0.89–0.95.
At flat = 0.5, Z_CE × 0.75 → HM ≈ 37 % of full. Reefing: reduce A_ref and Z_CE together (REEF ∈ [0.5, 1]).

### 4.5 Wind input

V_aw² = V_tw² + V_b² + 2 V_tw V_b cos(TWA) (TWA measured from the bow, boat speed adds headwind; ORC VPP eq. 7.3 — an earlier draft of this note had the sign wrong). Close-hauled TWA 40°, V_b 7 kn → V_aw/V_tw ≈ 1.45 over 8–20 kn. Do not couple V_b to heel; use a lookup (5.5 kn @ 8, 7.0 @ 12, 7.6 @ 18 kn TWS) — implemented as a seed polar table.

Sources: ORC VPP §§4.4.2, 5.1.3, 5.2.1–5.2.2, 5.4.4, 5.5; [Principles of Yacht Design](https://books.google.com/books/about/Principles_of_Yacht_Design.html?id=cafDAQAAQBAJ).

## 5. Equilibrium solve

f(φ) = RM_total(φ) − HM(φ, V_aw) = 0. Bisection on [0°, φ_GZmax] (~56°), 40 iterations, tol 0.01°. No root → **overpowered / knocked down** — report as a state.

Inverse solves (closed form):
V_aw|φ_t = √( RM_total(φ_t) / (½ρ A C_H h cos²φ_t) ), flat_req = min(1, RM_total(φ_t) / (½ρ V_aw² A C_H,max h cos²φ_t)) — the implementation solves flat by bisection because C_H and Z_CE are both flat-dependent.

### 5.1 Worked headline numbers (agent defaults, GM 1.9)

At 12.5 kn TWS / 18.4 kn AWS, flat = 1:

| Crew state | RM_crew @20° | Equilibrium heel |
|---|---|---|
| 10 crew hiking, y = 2.0 m | +11.7 kN·m | 20.0° |
| 10 crew on centreline | −4.0 kN·m | 25.0° |
| 10 crew on leeward rail | −19.7 kN·m | ~31° |

Moving 850 kg from centreline to the windward rail ≈ **5° of heel**. Same-heel framings at 20°: +29 % allowable sail force; +2.5 kn true wind "free"; at 15 kn TWS inboard crew need flat 0.78 vs 1.0 hiked.

Sensitivities: hiking harder +0.3 m → −0.6° (+2.4 kN·m); two crew below → +0.8° (≈0.4°/crew); one crew leeward ≈ two crew leaving the rail.

### 5.2 Boat-speed proxy (agent proposal — not implemented; replaced by drive-force readout)

V_b(φ) = V_b,target [1 − k max(0, φ − φ_opt)²], φ_opt = 18°, k = 4×10⁻⁴ deg⁻². Sources: [Yachting World heel angles](https://www.yachtingworld.com/5-tips/5-expert-tips-to-help-you-better-understand-sailing-heel-angles-159205), [Sailing Virgins](https://info.sailingvirgins.com/blog/balancing-heel-and-helm-on-keelboats-crew-positioning-sail-trim-keel-management-techniques).

## 6. Sanity numbers at 25° heel (GM 1.9 basis)

| Term | Value | % of hull RM |
|---|---|---|
| Hull + keel: 9650 × 9.81 × 0.738 | 69.9 kN·m | 100 % |
| Crew gross (ORC-style, no z): 850 × 9.81 × 2.0 cos 25° | 15.1 kN·m | +21.6 % |
| Crew net (z penalty, z − z_G = 1.4 m) | 10.2 kN·m | +14.6 % |
| Swing centreline → rail | 15.1 kN·m | +21.6 % |
| ORC dynamic RM_V (ignored) | ~+5–8 % | — |

With cert-derived GM 1.55: hull RM(25°) ≈ 57 kN·m and crew contribution rises to ~18 % / 26 %. Dinghy equivalent 50 %+; hard vs relaxed hiking ≈ +15 % RM ([SailZing](https://sailzing.com/hike-harder-and-smarter/)).

## 7. Rule constraints (UI limits, not physics)

- **RRS 49.1** — no devices to position bodies outboard other than hiking straps/stiffeners under thighs.
- **RRS 49.2** — torso inside lifelines except briefly; with upper and lower lifelines, sitting facing outboard with waist inside the lower lifeline, the upper body may be outside the upper lifeline — the legal max-hike pose, capping y ≈ 2.25 m. Sources: [RRS 2025–2028](https://www.asiansailing.org/wp-content/uploads/2024/07/RRS-2025-2028-Final.pdf), [rule 49 commentary](https://www.racingrulesofsailing.org/posts/1751-about-rule-49), [WS Case on 49.2](https://sailing.org/tools/documents/16618RacingRulesofSailingRule49.2-[24349].pdf).
- **ORC crew weight** — declared max; min = max − max(15 % of max, 130 kg) (2026); default CW = 25.8·LSM0^1.4262 ≈ 935 kg (89 kg/person). Extra rail weight re-rates the boat. [ORC Rating Systems 2026 §102](https://orc.org/uploads/files/Rules-Regulations/2026/ORC-Rating-Systems-2026.pdf).

## 8. Assumptions & simplifications (shown in app)

1. Hull GZ is parametric (GM, AVS, n), validated ~2 % to 40° on one ORC curve; unreliable past ~130°.
2. GM is the weakest input (±15 % between sisterships) — exposed slider.
3. Crew as added weight, no re-float (~35 mm sinkage ignored, <2 % on GZ).
4. Static equilibrium: no gusts, roll inertia, waves, or ORC RM_V (+5–8 %).
5. cos²φ sail-force reduction (textbook); under-predicts force at large heel.
6. Rigid sail coefficients; `flat` is the only shape freedom.
7. Crew as point masses at slot (y, z); no body geometry or dynamic hiking.
8. Constant boat speed per TWS/TWA (polar lookup); no coupled VPP.
9. No pitch, trim, yaw, leeway; CLR fixed at 0.43 T.
10. Air/water density and g fixed.
11. Symmetric hull, no free surface.
12. Not a safety tool — AVS/STIX/downflooding out of scope.

## Sources

- [ORC VPP Documentation 2023](https://orc.org/uploads/files/ORC-VPP-Documentation-2023.pdf)
- [ORC Rating Systems 2026](https://orc.org/uploads/files/Rules-Regulations/2026/ORC-Rating-Systems-2026.pdf)
- [ORC Stability & Hydrostatics Datasheet Explanation](https://www.ussailing.org/wp-content/uploads/2018/01/Stability-and-Hydrostatics-Datasheet-Explanation.pdf)
- [ORC — VPP](https://orc.org/organization/velocity-prediction-program-vpp)
- [Boat-Specs Xp 44](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) / [deep](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft)
- [Sailboatdata XP 44](https://sailboatdata.com/sailboat/xp-44/)
- [Cruising World review](https://www.cruisingworld.com/sailboats/xp-44-sailors-sailboat/)
- [Marsh Design stability curves](https://marine.marsh-design.com/content/understanding-monohull-sailboat-stability-curves)
- [Good Old Boat — Is Your Boat Stable?](https://goodoldboat.com/is-your-boat-stable/)
- [Kasten Marine design calcs](http://www.kastenmarine.com/design_calcs.htm)
- [Principles of Yacht Design](https://books.google.com/books/about/Principles_of_Yacht_Design.html?id=cafDAQAAQBAJ)
- [Wikipedia — Hiking (sailing)](https://en.wikipedia.org/wiki/Hiking_(sailing))
- [SailZing — Hike Harder and Smarter](https://sailzing.com/hike-harder-and-smarter/)
- [Yachting World — heel angles](https://www.yachtingworld.com/5-tips/5-expert-tips-to-help-you-better-understand-sailing-heel-angles-159205)
- [Sailing Virgins — heel and helm](https://info.sailingvirgins.com/blog/balancing-heel-and-helm-on-keelboats-crew-positioning-sail-trim-keel-management-techniques)
- [RRS 2025–2028](https://www.asiansailing.org/wp-content/uploads/2024/07/RRS-2025-2028-Final.pdf) · [rule 49 commentary](https://www.racingrulesofsailing.org/posts/1751-about-rule-49) · [WS Case 49.2](https://sailing.org/tools/documents/16618RacingRulesofSailingRule49.2-[24349].pdf)


---

## Correction after adversarial review (2026-08-18)

Two independent reviewers verified against ORC VPP Documentation 2023 §4.2.2 / §4.4.1 that the certificate **sailing-trim displacement, VCG, RM at 1° and GZ curve already include the ORC default crew weight** (CW = 25.8·LSM0^1.4262 ≈ 932 kg for the Xp 44) placed on the centreline at `crewv = 0.05·LSM0 + 0.36 ≈ 0.98 m` above the waterplane (CAL 39 datasheet in the same PDF: measurement trim 7 525 kg / VCG 0.056 m → sailing trim 8 459 kg / VCG 0.146 m).

Consequences, as implemented:

- `Δ = 9700 kg` (from certificates) is used as-is and labelled "ORC sailing displacement (incl. default crew)"; crew mass is **not** added again.
- Crew moments are pure weight shifts from that reference: `RM_crew = Σ mᵢ g (yᵢ cos φ − (zᵢ − z₀) sin φ)` with `z₀ = 0.98 m` (`stability.zCrew0` in `xp44.json`), not `z_G`.
- The height penalty is therefore ~⅓ of the earlier estimate (z − z₀ ≈ 0.4 m instead of 1.5 m): at 20° it costs < 10 % of the gross gain, and the crew break-even angle is ≈ 75–80°, beyond GZ_max. Crew below decks (z ≈ 0.4 m) add a *small positive* moment because they sit lower than the reference.
- Combined CG: `y_G = Σ mᵢ yᵢ / Δ`, `z_G' = z_G + Σ mᵢ (zᵢ − z₀) / Δ`.
- Effective rig span now includes ORC's `kheff(AWA)` factor (≈1.45 at 20° → 0.80 at 80°) in the induced-drag term.
- Rail seat arm: deck-edge half-beam minus 0.2 m (≈ 1.8 m sitting; +0.2 legs over; +0.4 full hike ≈ 2.2 m), matching §2.2 and ORC's deck-edge crew arm.

Worked numbers after the correction (TWA 40°, flat = 1, 10 × 85 kg): 12 kn TWS — full hike 23.6°, sitting 24.6°, everyone below 27.8°; RM_crew (hike, at equilibrium) ≈ 14 kN·m ≈ 26 % of RM_hull. Auto-trim to 20° at 12 kn: flat 0.90 (hike) vs 0.76 (below), drive +18 %; "free wind" ≈ +2 kn.
