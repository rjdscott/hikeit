import { useMemo } from 'react'
import xp44 from './data/xp44.json'
import type { State } from './state'
import type { BoatJson, CrewPoint, Posture } from './physics/types'
import { DEG } from './physics/types'
import { boatSpeed, resolveBoat } from './physics/boat'
import { combinedCg, crewMoment, crewPositions, rmCrew, rmHull } from './physics/stability'
import { apparentWind, driveForce, heelForce, heelingArm, heelingMoment, sailCoeffs, type Wind } from './physics/aero'
import { curves, equilibrium, solveFlat, twsAtHeel, windSweep, type Curves, type Equilibrium, type SweepPoint } from './physics/solve'

export const BOAT_JSON = xp44 as unknown as BoatJson
export const SWEEP_TWS = Array.from({ length: 27 }, (_, i) => 4 + i) // 4..30 kn

export interface Derived {
  boat: ReturnType<typeof resolveBoat>
  crewPts: CrewPoint[]
  wind: Wind
  flat: number
  zPenalty: boolean
  trimLimited: boolean
  underpowered: boolean
  curves: Curves
  eq: Equilibrium
  phiDeg: number
  ghost: { curves: Curves; eq: Equilibrium; flat: number } | null
  sweep: SweepPoint[]
  sweepBase: SweepPoint[]
  freeWind: number | null // kn of extra TWS at target heel vs all-inboard baseline
  rmHullEq: number; rmCrewEq: number; rmTotalEq: number; hmEq: number
  heelForceEq: number; driveEq: number; arm: number
  coeffs: ReturnType<typeof sailCoeffs>
  perCrew: { id: number; name: string; m: number; y: number; z: number; moment: number }[]
  cg: ReturnType<typeof combinedCg>
  /** What-if: every rail crew in each posture (same wind/trim). */
  postures: Record<Posture, { rmCrew: number; phiDeg: number; overpowered: boolean; freeWind: number | null; flatReq: number | null; drive: number | null }>
  railCount: number
}

/** Pure compute pipeline from state → everything the UI shows. */
export function derive(s: State): Derived {
  const boat = resolveBoat(BOAT_JSON, s.sailMode, s.overrides)
  const crewPts = crewPositions(s.crew, boat.slotById)
  const windAt = (tws: number) => apparentWind(tws, s.twa, boatSpeed(boat.polar, tws, s.twa))
  const wind = windAt(s.tws)
  const base = { boat, crew: crewPts, wind, zPenalty: s.zPenalty }
  const trim = s.autoTrim ? solveFlat(base, s.targetHeel * DEG) : { flat: s.flat, trimLimited: false, underpowered: false }
  const m = { ...base, flat: trim.flat }
  const cv = curves(m)
  const eq = equilibrium(m)
  let ghost: Derived['ghost'] = null
  if (s.prevCrew) {
    const gp = crewPositions(s.prevCrew, boat.slotById)
    const gb = { boat, crew: gp, wind, zPenalty: s.zPenalty }
    const gflat = s.autoTrim ? solveFlat(gb, s.targetHeel * DEG).flat : s.flat
    const gm = { ...gb, flat: gflat }
    ghost = { curves: curves(gm), eq: equilibrium(gm), flat: gflat }
  }
  const sweepFlat = trim.flat
  const sweep = windSweep({ boat, crew: crewPts, flat: sweepFlat, zPenalty: s.zPenalty }, windAt, SWEEP_TWS)
  const inboard = crewPts.map((p) => ({ ...p, y: 0, z: 1.3 }))
  const sweepBase = windSweep({ boat, crew: inboard, flat: sweepFlat, zPenalty: s.zPenalty }, windAt, SWEEP_TWS)
  const ta = twsAtHeel(sweep, s.targetHeel * DEG), tb = twsAtHeel(sweepBase, s.targetHeel * DEG)
  const phi = eq.phi
  const perCrew = crewPts.map((p) => ({ ...p, moment: crewMoment(p, phi, boat.zCrew0, s.zPenalty) }))
  const rmHullEq = rmHull(boat, phi), rmCrewEq = rmCrew(crewPts, phi, boat.zCrew0, s.zPenalty)
  const isWRail = (slot: string) => { const x = boat.slotById[slot]; return !!x && x.kind === 'rail' && x.side === 'w' }
  const railCount = s.crew.filter((c) => isWRail(c.slot)).length
  const postures = Object.fromEntries((['sit', 'legs', 'hike'] as Posture[]).map((po) => {
    const pts = crewPositions(s.crew.map((c) => (isWRail(c.slot) ? { ...c, posture: po } : c)), boat.slotById)
    const pm = { boat, crew: pts, wind, flat: trim.flat, zPenalty: s.zPenalty }
    const e = equilibrium(pm)
    const sw = windSweep({ boat, crew: pts, flat: trim.flat, zPenalty: s.zPenalty }, windAt, SWEEP_TWS)
    const t = twsAtHeel(sw, s.targetHeel * DEG)
    // in auto-trim mode the payoff is power, not heel: what flat (and drive) does this posture allow at the target heel?
    const tr = s.autoTrim ? solveFlat({ boat, crew: pts, wind, zPenalty: s.zPenalty }, s.targetHeel * DEG) : null
    const drive = tr ? driveForce(boat, wind, tr.flat, s.targetHeel * DEG) : null
    return [po, { rmCrew: rmCrew(pts, e.phi, boat.zCrew0, s.zPenalty), phiDeg: e.phi / DEG, overpowered: e.overpowered, freeWind: t !== null && tb !== null ? t - tb : null, flatReq: tr?.flat ?? null, drive }]
  })) as Derived['postures']
  return {
    boat, crewPts, wind, flat: trim.flat, zPenalty: s.zPenalty, trimLimited: trim.trimLimited, underpowered: trim.underpowered,
    curves: cv, eq, phiDeg: phi / DEG, ghost, sweep, sweepBase,
    freeWind: ta !== null && tb !== null ? ta - tb : null,
    rmHullEq, rmCrewEq, rmTotalEq: rmHullEq + rmCrewEq, hmEq: heelingMoment(boat, wind, trim.flat, phi),
    heelForceEq: heelForce(boat, wind, trim.flat, phi), driveEq: driveForce(boat, wind, trim.flat, phi),
    arm: heelingArm(boat, trim.flat),
    coeffs: sailCoeffs(boat.sails, boat.area, boat.hEff, wind.awa, trim.flat, boat.chScale),
    perCrew, cg: combinedCg(boat, crewPts), postures, railCount,
  }
}

export const useDerived = (s: State) => useMemo(() => derive(s), [s])
