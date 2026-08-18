# 04 — Cockpit target-speed card (Xp 44)

Photographed 2026-08-18 (`IMG_3858.HEIC`). The card gives VMG-optimal target boat speed and true wind angle per true wind speed — not a full polar, but exactly what the simulator needs to sail "the angle the crew actually sails" and to cross-check the seed polar.

| TWS (kn) | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16 | 20 | 25 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Upwind TWA (°)** | 44 | 43 | 42 | 41 | 40 | 39 | 37 | 36 | 35 | 35 | 35 |
| Upwind VMG band (°) | 41–46 | 38–45 | 36–45 | 36–45 | 36–41 | 36–40 | 35–39 | 33–39 | 33–38 | 31–38 | 31–38 |
| **Upwind speed (kn)** — *provisional* | 5.30 | 6.00 | 6.50 | 6.90 | 7.10 | 7.30 | 7.45 | 7.50 | 7.60 | 7.65 | 7.70 |
| **Downwind speed (kn)** | 5.70 | 6.20 | 6.80 | 7.00 | 7.35 | 7.65 | 8.10 | 8.35 | 8.95 | 10.30 | 13.50 |
| **Downwind TWA (°)** | 137 | 140 | 142 | 147 | 150 | 152 | 157 | 165 | 167 | 165 | 160 |
| Downwind VMG band (°) | 135–140 | 135–142 | 140–145 | 145–150 | 148–155 | 150–160 | 150–165 | 155–170 | 150–175 | 150–175 | 150–170 |

**Provisional:** the upwind SPEED column was hidden behind a sheet in the photo; only trailing digits were legible (6 kn "…00", 12 kn "…5", 20 kn "…5"). The values above are estimates consistent with those digits and typical Xp 44 polars; a re-photo is pending. They live in `src/data/xp44.json` → `targets.upwind.bsp` with `bspProvisional: true`.

**Used in the app:** "Sail the target angle from the cockpit card" (default on for upwind modes) sets TWA from this table for the current TWS and uses the card speed for apparent wind (ADR-0013 / `model.ts effectiveTwa`). Downwind targets are recorded for a future downwind mode.
