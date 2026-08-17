# ADR-0006 — Data-driven boat configuration (`src/data/xp44.json`)

**Status:** Accepted  
**Date:** 2026-08-18

## Context
The owner wants to add real ORC polars and spinnaker/downwind modes later without rewriting physics or UI. All boat-specific numbers (hull, stability, rig, deck geometry, sails, polar) should live in one place that a sailor can edit.

## Decision
One JSON file per boat with sections: `hull` (dimensions, displacement, ballast, half-section points, keel), `stability` (rm1, avsDeg, n, zG), `rig` (P, E, IG, J, BAS, ISP, SPL, mastX), `deck` (outline points, cockpit/coachroof, rail slot generator params, explicit slots), `sails[]` (id, type, area, CE height, CL/CD tables vs AWA), `sailModes[]` (id, label, sail ids, TWA range), and optional `polar` (`tws[]`, `twa[]`, `bsp[][]`). `resolveBoat(json, overrides)` derives GM, half-beam(x), generated/mirrored slots and the active sail set; physics functions are agnostic of sail names.

## Consequences
- Adding a spinnaker = one `sails[]` entry (area, CE, coefficient table) + one `sailModes[]` entry; a downwind polar row set replaces the seed table.
- Replacing the boat entirely = a new JSON file.
- Coefficient tables are ORC-VPP-style approximations and are flagged for review; the seed polar is labelled as such in the file.
- Type-checked via `resolveJsonModule` in TypeScript.
