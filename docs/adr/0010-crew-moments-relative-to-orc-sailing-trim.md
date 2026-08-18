# 0010. Crew moments are weight shifts from the ORC sailing-trim reference

Status: Accepted (amends 0005)
Date: 2026-08-18

## Context
The hull GZ curve is calibrated from ORC certificate values (RM at 1°, sailing displacement). ORC VPP Documentation 2023 §4.2.2 / §4.4.1 states that sailing trim — the condition of the certificate GZ curve, RM at 1° and LPS — already includes the default crew weight (≈ 932 kg for the Xp 44) on the centreline at `crewv = 0.05·LSM0 + 0.36 ≈ 0.98 m` above the waterplane. The first implementation added the 850 kg of crew as extra masses referenced to the bare-hull VCG (z_G ≈ −0.1 m), which double-counted crew mass and overstated the height penalty ≈ 4×. Two adversarial verifiers confirmed this against the ORC PDF and by recomputation.

## Decision
- Keep Δ = ORC sailing displacement (9700 kg) and RM₁ = 260 kg·m/° unchanged; label Δ as including the default crew.
- Model crew as **weight shifts** from the reference position (0, z₀ = 0.98 m): `RM_crew = Σ mᵢ g (yᵢ cos φ − (zᵢ − z₀) sin φ)`; `z₀` lives in `xp44.json` as `stability.zCrew0`.
- Combined CG shifts by `Σ mᵢ yᵢ / Δ` and `Σ mᵢ (zᵢ − z₀) / Δ`; total mass = Δ.
- Keep the "include crew height term" toggle (ORC's VPP ignores it entirely).
- Related calibration changes from the same review: ORC `kheff(AWA)` factor in induced drag; rail seat inset 0.2 m (sit ≈ 1.8 m, legs-over 2.0 m, full hike 2.2 m); posture offsets apply on the windward rail only.

## Consequences
- Height penalty at 20° is < 10 % of the gross crew gain; crew break-even ≈ 75–80° (was 55°). Lesson step 5 rewritten accordingly. Crew below decks contribute slightly positively (lower than the reference).
- If a boat's own inclining/measurement-trim data are used instead of certificate sailing-trim values, `zCrew0` must be replaced by the bare-hull VCG and Δ by the crewless displacement — one JSON edit each; the formula is unchanged.
