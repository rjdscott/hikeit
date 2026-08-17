import type { Boat, CrewPoint } from './types'
import { DEG } from './types'
import { phiGzMax, rmCrew, rmHull } from './stability'
import { FLAT_MIN, heelingMoment, type Wind } from './aero'

export interface Curves { phi: number[]; rmHull: number[]; rmCrew: number[]; rmTotal: number[]; hm: number[] }

export interface Model {
  boat: Boat
  crew: CrewPoint[]
  wind: Wind
  flat: number
  zPenalty: boolean
}

export const rmTotal = (m: Model, phi: number) => rmHull(m.boat, phi) + rmCrew(m.crew, phi, m.boat.zG, m.zPenalty)
export const netMoment = (m: Model, phi: number) => rmTotal(m, phi) - heelingMoment(m.boat, m.wind, m.flat, phi)

/** Curves at 1° from 0..maxDeg for charting. */
export function curves(m: Model, maxDeg = 90): Curves {
  const out: Curves = { phi: [], rmHull: [], rmCrew: [], rmTotal: [], hm: [] }
  for (let d = 0; d <= maxDeg; d++) {
    const p = d * DEG
    const h = rmHull(m.boat, p), c = rmCrew(m.crew, p, m.boat.zG, m.zPenalty)
    out.phi.push(d); out.rmHull.push(h); out.rmCrew.push(c); out.rmTotal.push(h + c)
    out.hm.push(heelingMoment(m.boat, m.wind, m.flat, p))
  }
  return out
}

export interface Equilibrium { phi: number; overpowered: boolean } // phi in rad

/**
 * Static equilibrium: RM_total(φ) = HM(φ). Bisection on [−φ_GZmax, φ_GZmax].
 * No root ⇒ overpowered (heeling moment exceeds max righting moment): report φ_GZmax + flag.
 */
export function equilibrium(m: Model): Equilibrium {
  const pmax = phiGzMax(m.boat.gm, m.boat.avs, m.boat.n)
  let lo = -pmax, hi = pmax
  if (netMoment(m, hi) < 0) return { phi: pmax, overpowered: true }
  if (netMoment(m, lo) > 0) return { phi: lo, overpowered: false } // pathological: massive windward moment
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi)
    if (netMoment(m, mid) < 0) lo = mid; else hi = mid
  }
  return { phi: 0.5 * (lo + hi), overpowered: false }
}

/**
 * Auto-trim: flattest setting (max power) that holds heel ≤ target. Bisection on flat ∈ [FLAT_MIN, 1].
 * Returns flat and whether we ran out of depower (trim-limited: heel will exceed target).
 */
export function solveFlat(m: Omit<Model, 'flat'>, targetPhi: number): { flat: number; trimLimited: boolean; underpowered: boolean } {
  const rm = rmTotal({ ...m, flat: 1 }, targetPhi)
  const hmAt = (flat: number) => heelingMoment(m.boat, m.wind, flat, targetPhi)
  if (hmAt(1) <= rm) return { flat: 1, trimLimited: false, underpowered: true }
  if (hmAt(FLAT_MIN) > rm) return { flat: FLAT_MIN, trimLimited: true, underpowered: false }
  let lo = FLAT_MIN, hi = 1
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi)
    if (hmAt(mid) > rm) hi = mid; else lo = mid
  }
  return { flat: 0.5 * (lo + hi), trimLimited: false, underpowered: false }
}

export interface SweepPoint { tws: number; phi: number; overpowered: boolean }

/** Equilibrium heel vs TWS for a given crew formation. windAt builds the Wind for a TWS. */
export function windSweep(m: Omit<Model, 'wind'>, windAt: (tws: number) => Wind, twsList: number[]): SweepPoint[] {
  return twsList.map((tws) => {
    const e = equilibrium({ ...m, wind: windAt(tws) })
    return { tws, phi: e.phi, overpowered: e.overpowered }
  })
}

/** TWS at which the formation reaches targetPhi (linear interp on sweep), or null if never. */
export function twsAtHeel(sweep: SweepPoint[], targetPhi: number): number | null {
  for (let i = 1; i < sweep.length; i++) {
    const a = sweep[i - 1], b = sweep[i]
    if (a.phi <= targetPhi && b.phi >= targetPhi) {
      const t = (targetPhi - a.phi) / (b.phi - a.phi || 1)
      return a.tws + t * (b.tws - a.tws)
    }
  }
  return null
}
