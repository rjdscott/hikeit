import type { Boat, CrewPoint, Posture, Slot } from './types'
import { G, POSTURE_OFFSET } from './types'

/** Parametric righting arm: GZ = GM·sinφ·[1 − (|φ|/φv)^n]. Odd in φ. φ in rad. */
export function gz(phi: number, gm: number, avs: number, n: number): number {
  return gm * Math.sin(phi) * (1 - Math.pow(Math.abs(phi) / avs, n))
}

export const rmHull = (b: Boat, phi: number) => b.disp * G * gz(phi, b.gm, b.avs, b.n)

/** Heel angle of maximum GZ (rad), by coarse scan then refinement. */
export function phiGzMax(gm: number, avs: number, n: number): number {
  let best = 0, bestV = -Infinity
  for (let p = 0; p <= avs; p += 0.002) {
    const v = gz(p, gm, avs, n)
    if (v > bestV) { bestV = v; best = p }
  }
  return best
}

export interface CrewInput { id: number; name: string; kg: number; slot: string; posture: Posture }

/** Map crew to point masses in the boat frame. Posture only applies on rail slots (RRS 49.2 legal hike). */
export function crewPositions(crew: CrewInput[], slotById: Record<string, Slot>): CrewPoint[] {
  return crew.map((c) => {
    const s = slotById[c.slot] ?? Object.values(slotById)[0]
    const off = s.kind === 'rail' ? POSTURE_OFFSET[c.posture] : 0
    const y = s.y + Math.sign(s.y) * off
    // legs-over / hiking drops the CG slightly (torso outboard, hips lower)
    const z = s.z - (s.kind === 'rail' ? off * 0.25 : 0)
    return { id: c.id, name: c.name, m: c.kg, y, z }
  })
}

/** Moment from a single crew member: m·g·(y·cosφ − (z − zG)·sinφ). */
export const crewMoment = (p: CrewPoint, phi: number, zG: number, zPenalty: boolean) =>
  p.m * G * (p.y * Math.cos(phi) - (zPenalty ? (p.z - zG) * Math.sin(phi) : 0))

export const rmCrew = (pts: CrewPoint[], phi: number, zG: number, zPenalty: boolean) =>
  pts.reduce((a, p) => a + crewMoment(p, phi, zG, zPenalty), 0)

/** Combined CG offset of boat + crew, for the "watch G slide to windward" view. */
export function combinedCg(b: Boat, pts: CrewPoint[]) {
  const mc = pts.reduce((a, p) => a + p.m, 0)
  const total = b.disp + mc
  const yG = pts.reduce((a, p) => a + p.m * p.y, 0) / total
  const zG = (b.disp * b.zG + pts.reduce((a, p) => a + p.m * p.z, 0)) / total
  return { yG, zG, total }
}
