import type { Boat, CrewPoint } from './types'
import { G } from './types'
import { rmCrew, rmHull } from './stability'
import { apparentWind, heelingMoment } from './aero'
import { equilibrium } from './solve'

export interface RollParams {
  inertia: number // kg·m², roll inertia incl. added mass (rig + keel + hull + entrained water)
  zeta: number // damping ratio (keel + sails ≈ 0.3–0.5)
}
/** Roll inertia I = Δ·k² with roll gyradius k ≈ 0.61·B ≈ 2.5 m (rig, keel bulb and entrained water all sit far from the roll axis) → T_roll ≈ 4 s for the Xp 44 (typical 40–45 ft: 3–5 s). */
export const defaultRoll = (b: Boat): RollParams => ({ inertia: (0.61 * b.json.hull.beam) ** 2 * b.disp, zeta: 0.35 })

export const rollPeriod = (b: Boat, p: RollParams) => 2 * Math.PI * Math.sqrt(p.inertia / (b.disp * G * b.gm))

/** Gust profile: ramp up, hold, ramp down (kn above base). */
export const puffProfile = (t: number, dTws: number, up = 1.5, hold = 5, down = 2.5) =>
  t < 0 ? 0 : t < up ? (dTws * t) / up : t < up + hold ? dTws : t < up + hold + down ? dTws * (1 - (t - up - hold) / down) : 0

export interface Trajectory { t: number[]; phi: number[]; tws: number[]; phiStaticPuff: number; phiStaticBase: number; peak: number; peakT: number; baseOver: boolean; puffOver: boolean }

/**
 * Integrate I·φ̈ = HM(φ, V(t)) − RM_total(φ) − c·φ̇ (φ positive to leeward) from the base equilibrium through a puff.
 * Semi-implicit Euler at dt; sails/trim/crew held fixed (the crew's reaction is what the lesson is about).
 */
export function simulatePuff(
  boat: Boat, crew: CrewPoint[], zPenalty: boolean, flat: number,
  tws: number, twa: number, bsp: number, dTws: number,
  params: RollParams = defaultRoll(boat), duration = 14, dt = 1 / 60,
  /** optional crew reaction: crew move from `crew` to `crewAfter` starting reactAt s after the puff begins, taking `moveTime` s (default 1.5) */
  react?: { crewAfter: CrewPoint[]; reactAt: number; moveTime?: number },
): Trajectory {
  const wind0 = apparentWind(tws, twa, bsp)
  const eq0 = equilibrium({ boat, crew, wind: wind0, flat, zPenalty })
  const eqP = equilibrium({ boat, crew, wind: apparentWind(tws + dTws, twa, bsp), flat, zPenalty })
  const K = boat.disp * G * boat.gm
  const c = 2 * params.zeta * Math.sqrt(params.inertia * K)
  let phi = eq0.phi, omega = 0, peak = phi, peakT = 0
  const out: Trajectory = { t: [], phi: [], tws: [], phiStaticPuff: eqP.phi, phiStaticBase: eq0.phi, peak, peakT, baseOver: eq0.overpowered, puffOver: eqP.overpowered }
  const n = Math.round(duration / dt)
  for (let i = 0; i <= n; i++) {
    const t = i * dt
    const v = tws + puffProfile(t - 1, dTws) // puff starts at t = 1 s
    const w = apparentWind(v, twa, bsp)
    let crewNow = crew
    if (react) {
      const f = Math.min(1, Math.max(0, (t - 1 - react.reactAt) / (react.moveTime ?? 1.5)))
      if (f >= 1) crewNow = react.crewAfter
      else if (f > 0) crewNow = crew.map((p, k) => ({ ...p, y: p.y + f * (react.crewAfter[k].y - p.y), z: p.z + f * (react.crewAfter[k].z - p.z) }))
    }
    const M = heelingMoment(boat, w, flat, phi) - rmHull(boat, phi) - rmCrew(crewNow, phi, boat.zCrew0, zPenalty) - c * omega
    omega += (M / params.inertia) * dt
    phi += omega * dt
    if (phi > peak) { peak = phi; peakT = t }
    if (i % 2 === 0) { out.t.push(t); out.phi.push(phi); out.tws.push(v) } // 30 Hz samples
  }
  out.peak = peak; out.peakT = peakT
  return out
}
