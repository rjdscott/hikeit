import type { Boat, CrewPoint, Posture, Slot } from './types'
import { G, POSTURE_OFFSET } from './types'

/** Parametric righting arm: GZ = GM·sinφ·[1 − (|φ|/φv)^n]. Odd in φ. φ in rad. */
export function gz(phi: number, gm: number, avs: number, n: number): number {
  return gm * Math.sin(phi) * (1 - Math.pow(Math.abs(phi) / avs, n))
}

export const rmHull = (b: Boat, phi: number) => b.disp * G * gz(phi, b.gm, b.avs, b.n)

/** Heel angle of maximum GZ (rad), by coarse scan then refinement. */
const gzMaxCache = new Map<string, number>()
export function phiGzMax(gm: number, avs: number, n: number): number {
  const key = `${gm}|${avs}|${n}`
  const hit = gzMaxCache.get(key)
  if (hit !== undefined) return hit
  let best = 0, bestV = -Infinity
  for (let p = 0; p <= avs; p += 0.002) {
    const v = gz(p, gm, avs, n)
    if (v > bestV) { bestV = v; best = p }
  }
  gzMaxCache.set(key, best)
  return best
}

export interface CrewInput { id: number; name: string; kg: number; slot: string; posture: Posture }

/** Map crew to point masses in the boat frame. Posture only applies on rail slots (RRS 49.2 legal hike). */
export function crewPositions(crew: CrewInput[], slotById: Record<string, Slot>): CrewPoint[] {
  return crew.map((c) => {
    const s = slotById[c.slot] ?? Object.values(slotById)[0]
    // posture (legs over / hiking) only means something on the windward rail
    const off = s.kind === 'rail' && s.side === 'w' ? POSTURE_OFFSET[c.posture] : 0
    const y = s.y + off
    // legs-over / hiking drops the CG slightly (torso outboard, hips lower)
    const z = s.z - off * 0.25
    return { id: c.id, name: c.name, m: c.kg, y, z }
  })
}

/**
 * Moment from moving one crew member from the certificate reference position (centreline, z = zRef)
 * to (y, z): m·g·(y·cosφ − (z − zRef)·sinφ). The ORC sailing-trim displacement and RM already
 * contain the default crew on the centreline, so this is a pure weight-shift term.
 */
export const crewMoment = (p: CrewPoint, phi: number, zRef: number, zPenalty: boolean) =>
  p.m * G * (p.y * Math.cos(phi) - (zPenalty ? (p.z - zRef) * Math.sin(phi) : 0))

export const rmCrew = (pts: CrewPoint[], phi: number, zRef: number, zPenalty: boolean) =>
  pts.reduce((a, p) => a + crewMoment(p, phi, zRef, zPenalty), 0)

/** Combined CG of the boat (crew mass already inside disp) after shifting the crew from the centreline reference. */
export function combinedCg(b: Boat, pts: CrewPoint[]) {
  const total = b.disp
  const yG = pts.reduce((a, p) => a + p.m * p.y, 0) / total
  const zG = b.zG + pts.reduce((a, p) => a + p.m * (p.z - b.zCrew0), 0) / total
  return { yG, zG, total }
}
