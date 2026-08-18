import type { Boat, SailDef } from './types'
import { DEG, KN, RHO_AIR } from './types'
import { lerpTable } from './boat'

export const FLAT_MIN = 0.42

export interface Wind { tws: number; twa: number; bsp: number; aws: number; awa: number } // kn / deg

/** Apparent wind from true wind + boat speed (all kn, deg). AWA measured from bow. */
export function apparentWind(tws: number, twa: number, bsp: number): Wind {
  const t = twa * DEG
  const ax = tws * Math.cos(t) + bsp // along the boat, from ahead
  const ay = tws * Math.sin(t)
  const aws = Math.hypot(ax, ay)
  const awa = Math.atan2(ay, ax) / DEG
  return { tws, twa, bsp, aws, awa }
}

export interface SailCoeffs { cl: number; cd: number; ch: number; cr: number }

/** Area-weighted lift/drag + ORC-style induced drag, resolved into heeling (C_H) and driving (C_R) coefficients. */
export function sailCoeffs(sails: SailDef[], area: number, hEff: number, awa: number, flat: number, chScale = 1): SailCoeffs {
  let cl = 0, cd0 = 0, kpp = 0
  for (const s of sails) {
    cl += (s.area / area) * lerpTable(s.awa, s.cl, awa)
    cd0 += (s.area / area) * lerpTable(s.awa, s.cd, awa)
    kpp += (s.area / area) * (s.kpp ?? 0.016) // ORC quadratic parasite drag (kpmm 0.0138 main, kpj 0.016 jib)
  }
  cl *= flat
  // ORC kheff: effective-span factor vs AWA (≈1.45 at 20° → 0.80 at 80°)
  const kheff = Math.max(0.8, Math.min(1.45, 1.45 - ((awa - 20) / 60) * 0.65))
  const ar = (hEff * kheff) ** 2 / area
  const cdi = cl * cl * (1 / (Math.PI * ar) + kpp) // ORC eq 5.46: CE = KPP + Aref/(π heff²)
  const cd = cd0 + cdi
  const b = awa * DEG
  return { cl, cd, ch: chScale * (cl * Math.cos(b) + cd * Math.sin(b)), cr: cl * Math.sin(b) - cd * Math.cos(b) }
}

/** ORC twist function: CE lowers as the sail plan is flattened/twisted. */
export const zceEff = (zce: number, flat: number, frac: number) =>
  zce * (1 - 0.406 * (1 - flat) - 0.902 * (1 - flat) * (1 - frac))

/**
 * Heeling arm: CE height above WL + hydrodynamic centre of lateral resistance at 0.43·T below WL.
 * ORC eq 5.57: HBI + Z_CE·twist — only the sail plan above the sheer twists; the freeboard does not.
 */
export const heelingArm = (b: Boat, flat: number) => {
  const fb = b.json.hull.freeboard
  return zceEff(b.zce - fb, flat, b.frac) + fb + 0.43 * b.draft
}

export const dynPressure = (awsKn: number) => 0.5 * RHO_AIR * (awsKn * KN) ** 2

/** Aerodynamic heeling force normal to the mast plane (N), reduced by cos²φ for heel. */
export function heelForce(b: Boat, wind: Wind, flat: number, phi: number): number {
  const c = sailCoeffs(b.sails, b.area, b.hEff, wind.awa, flat, b.chScale)
  return dynPressure(wind.aws) * b.area * c.ch * Math.cos(phi) ** 2
}

export const heelingMoment = (b: Boat, wind: Wind, flat: number, phi: number) =>
  heelForce(b, wind, flat, phi) * heelingArm(b, flat)

/** Driving force along track (N), same cos²φ reduction. */
export function driveForce(b: Boat, wind: Wind, flat: number, phi: number): number {
  const c = sailCoeffs(b.sails, b.area, b.hEff, wind.awa, flat, b.chScale)
  return dynPressure(wind.aws) * b.area * c.cr * Math.cos(phi) ** 2
}
