# Research 01 — X-Yachts Xp 44 specifications & stability data

Date: 2026-08-18. Purpose: gather every numeric datum needed for a physically plausible righting-moment simulator of an Xp 44. Metric throughout. Values marked *derived* are our arithmetic, not published.

## 1. Hull

| Item | Value | Source |
|---|---|---|
| LOA (builder) | 13.29 m (43'7") | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft) |
| LOA (ORC measured) | 13.290 m | [ORC cert X-MEN](https://data.orc.org/public/WPub.dll/CC/04590003FO4.pdf) |
| LWL | 11.89 m | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft) |
| IMS L (rated length) | 12.409 / 12.519 m | [ORC PHANTOM](https://data.orc.org/public/WPub.dll/CC/04560003PM3), [ORC HEART OF GOLD](https://data.orc.org/public/WPub.dll/CC/04560003MSQ) |
| LSM0 | 12.370 m | [ORC HEART OF GOLD](https://data.orc.org/public/WPub.dll/CC/04560003MSQ) |
| Beam max | 4.07 m builder / **4.052 m ORC measured** | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard), ORC certs |
| Draft standard | 2.30 m | [boat-specs standard](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) |
| Draft deep | 2.65 m; ORC measured 2.694 m | [boat-specs deep](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft), [ORC X-MEN](https://data.orc.org/public/WPub.dll/CC/04590003FO4.pdf) |
| Draft (shoal boat, ORC measured) | 2.377 m | [ORC HEART OF GOLD](https://data.orc.org/public/WPub.dll/CC/04560003MSQ) |
| Displacement light (builder) | 8,650 kg | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) |
| Displacement sailing (ORC) | 9,654 / 9,751 / 10,382 kg (three boats) | X-MEN, PHANTOM, HEART OF GOLD certs |
| Ballast | 3,850 kg (45 % ratio) | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) |
| Keel type | Cast-iron fin + lead bulb (T-keel) | [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft) |
| Wetted area | 38.05 / 38.11 m² | ORC HoG / PHANTOM |
| D/L ratio | 146 | boat-specs |
| Tanks | fuel 200 L, water 350 L | boat-specs |
| CE category | A | boat-specs |

## 2. Rig (ORC-measured, HEART OF GOLD unless noted)

| Item | Value | Notes |
|---|---|---|
| P (main luff) | 17.405 m | PHANTOM 17.922 (taller carbon rig) |
| E (main foot) | 5.940 m | |
| IG (foretriangle height) | 18.215 m | PHANTOM 18.178 |
| ISP (spin halyard) | 19.180 m | PHANTOM 19.874 |
| J | 4.983 m | |
| BAS (boom above sheer) | 1.775 m | |
| SPL (pole/sprit) | 5.863 m | |
| Other | MDT 10.150, MDL 10.245, MDT2 0.150, MDL2 0.195, FSD 0.042, SFJ 0.280 | verbatim |
| Mainsail rated area | 63.87 m² | brochure 59.6 m²; X-Yachting 62 m² |
| Headsail (jib) | 48.17 m² | brochure 106 % genoa 47.2 m²; jib #3.5 = 41 m² |
| Headsail flying (Code 0) | 103.80 m² | X-Yachting A0 118 m² |
| Spinnaker | 192.01 m² (A2); A5 heavy 153 m²; brochure symmetric 170 m² | |
| Upwind total (brochure) | 106.8 m² | |
| Downwind total (brochure) | 229.6 m² | |
| Air draft (*derived*) | ISP 19.18 + freeboard ≈1.4 → **≈20.6 m** (carbon ≈21.3 m) | not published |

Consistency check: P + BAS = 17.405 + 1.775 = 19.18 = ISP.

Sources: [ORC HoG](https://data.orc.org/public/WPub.dll/CC/04560003MSQ), [ORC PHANTOM](https://data.orc.org/public/WPub.dll/CC/04560003PM3), [boat-specs](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard), [x-yachting](https://x-yachting.com/fleet/x-yachts-xp44).

## 3. Stability — ORC certificates, Xp 44 class

| Boat | RM rated (kg·m/deg @1°) | Stability Index | LPS/AVS | Displ (kg) | Crew wt (kg) | GPH |
|---|---|---|---|---|---|---|
| HEART OF GOLD (USA) | 248.6 | 125.9 | **119.6°** | 10,382 | 932 def / 915 decl | — |
| PHANTOM (USA 60711) | 261.4 | 130.6 | **125.2°** | 9,751 | 911 def / 915 decl | — |
| XAR (SWE 129) | 262.8 | 137.5 | — | — | — | — |
| ADRENALINA (ITA 17897) | 272.7 | 133.3 | — | — | — | 544.5 |
| ANTELOPE (DK) | 254.4 | 131.6 | — | — | — | — |
| XUBERANCE | — | — | — | — | — | 549.3 |
| Xtra Staerk | — | — | — | — | — | 541.7 |
| X-41 (comparable) | 195.2 | 128.1 | — | — | — | — |

VCG offsets vs ORC-assumed VCG (not absolute): PHANTOM VCGD −0.109 / VCGM −0.098 m; HEART OF GOLD VCGD 0.034 / VCGM 0.019 m.

Cert links: [HoG](https://data.orc.org/public/WPub.dll/CC/04560003MSQ), [PHANTOM](https://data.orc.org/public/WPub.dll/CC/04560003PM3), [XAR](https://data.orc.org/public/WPub.dll/CC/032000026FQ.pdf), [ADRENALINA](https://data.orc.org/public/WPub.dll/CC/189122), [ANTELOPE](https://data.orc.org/public/WPub.dll/CC/03420002PBB.pdf), [XUBERANCE](https://data.orc.org/public/WPub.dll/CC/03330002OW0), [Xtra Staerk](https://data.orc.org/public/WPub.dll/CC/032900023P6.pdf), [X-41 OD](https://data.orc.org/public/od/2021/x41.od.html?nav=1).

*Derived*:
- RM(1°) 248.6 kg·m = 2,438 N·m/deg; 272.7 kg·m = 2,674 N·m/deg.
- GM = RM₁ / (Δ·sin 1°): HoG 248.6/(10382×0.017452) = **1.37 m**; PHANTOM 261.4/(9751×0.017452) = **1.54 m**.
- Bare-hull RM at 25° is not on the certificate face; the full righting-arm table (2°–165°) lives in the per-boat ORC Stability & Hydrostatics Datasheet (ordered from ORC/MNA). See [ORC stability](https://orc.org/measurements/stability), [datasheet explanation](https://www.ussailing.org/wp-content/uploads/2018/01/Stability-and-Hydrostatics-Datasheet-Explanation.pdf).

IRC: Xp 44 TCC ≈ 1.124–1.125 ([Fastnet 2019 entry list](https://www.rolexfastnetrace.com/files/downloads/2019_docs/2019_rolex_fastnet_race_entry_list_190719.pdf)).

## 4. Deck geometry

| Item | Value | Source |
|---|---|---|
| Max beam → half-beam | 4.052 m → 2.026 m (rail limit for crew CG) | ORC certs |
| Upper lifeline height | ≥600 mm above working deck (OSR 3.14.1); intermediate 230 mm | [WS OSR Mo3 2024-25](https://www.sailing.ca/wp-content/uploads/2024/02/sc_osr2024-2025_mo3.pdf) |
| Cockpit | twin wheels, recessed traveller coaming-to-coaming, German mainsheet under deck, jib tracks tight to coachroof | [Cruising World review](https://www.cruisingworld.com/sailboats/xp-44-sailors-sailboat/) |
| Deck plan / GA images | brochure (blocks scraping; view in browser) | [NauticExpo brochure](https://pdf.nauticexpo.com/pdf/x-yachts/xp-44/20312-41829.html), [X-Yachting fleet page](https://x-yachting.com/fleet/x-yachts-xp44) |

No published cockpit length, side-deck width or hiking dimensions. Modelling assumption: rail crew CG ~1.80–1.90 m off centreline, spread from ~1 m aft of the mast to the forward cockpit coaming (≈4–6 m of rail).

## 5. Crew weight

| Item | Value | Source |
|---|---|---|
| ORC default crew weight (Xp 44) | 911–932 kg | ORC certs |
| ORC declared crew weight (US boats) | 915 kg | ORC certs |
| ORC default formula | `CW = 25.8 · LSM0^1.4262 · cwmult`, `cwmult = 1.0625 − 0.00125·DSP0/1000` bounded [0.3, 1.0] | [ORCsy VPP doc](https://www.readkong.com/page/orcsy-vpp-2021-documentation-offshore-racing-congress-7279525) |
| Formula check | LSM0 12.370 → 25.8×12.370^1.4262 = **932 kg** (matches HoG exactly) | derived |
| Implied crew count | 915 / 85 ≈ 10.8 → **10–11 crew** | derived |
| IRC | records crew number, not weight | [IRC FAQ](https://ircrating.org/irc-certificate/faqs/) |

## 6. Gaps / uncertainties

1. **No GZ curve published** — only RM@1° + LPS. Model with GM 1.37–1.54 m at small angles, force LPS ≈ 120–125°, shape the middle to a GZmax at ~55–60°.
2. **Absolute VCG unknown** — only ±0.1 m deltas vs ORC-assumed VCG.
3. **Bulb depth / keel VCG not published** — assume bulb CG ~0.88–0.92 × draft; calibrate to RM@1°.
4. **Freeboards not extractable** (image-only PDFs); ~1.3–1.5 m at mast estimated.
5. **Air draft never published** — ~20.6 m derived.
6. **Two rigs exist** (alloy vs taller carbon); RM spread 248.6–272.7 kg·m/deg reflects rig/keel/interior variation.
7. **Displacement spread is large**: 8,650 light vs 9,654–10,382 kg ORC sailing trim; use ~9.7–10.4 t for simulation.
8. **No deck dimensions** — stylised outline from LOA/beam.

## All sources

[boat-specs deep](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-deep-draft) · [boat-specs standard](https://www.boat-specs.com/sailing/sailboats/x-yachts/xp-44-standard) · [X-Yachting](https://x-yachting.com/fleet/x-yachts-xp44) · [sailboatdata](https://sailboatdata.com/sailboat/xp-44/) · [Cruising World](https://www.cruisingworld.com/sailboats/xp-44-sailors-sailboat/) · [Yachting World test](https://www.yachtingworld.com/news/xp44-boat-test-5329) · [ORC stability](https://orc.org/measurements/stability) · [ORC VPP 2023](https://orc.org/uploads/files/ORC-VPP-Documentation-2023.pdf) · [ORCsy VPP crew weight](https://www.readkong.com/page/orcsy-vpp-2021-documentation-offshore-racing-congress-7279525) · [WS OSR Mo3](https://www.sailing.ca/wp-content/uploads/2024/02/sc_osr2024-2025_mo3.pdf) · [IRC FAQ](https://ircrating.org/irc-certificate/faqs/) · [Fastnet 2019 entries](https://www.rolexfastnetrace.com/files/downloads/2019_docs/2019_rolex_fastnet_race_entry_list_190719.pdf)
