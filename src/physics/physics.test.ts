import { describe, expect, it } from 'vitest'
import xp44 from '../data/xp44.json'
import type { BoatJson } from './types'
import { DEG, G } from './types'
import { boatSpeed, gmFromRm1, lerpTable, resolveBoat, rm1FromGm } from './boat'
import { crewPositions, gz, phiGzMax, rmCrew, rmHull } from './stability'
import { apparentWind, heelingArm, heelingMoment, sailCoeffs, zceEff } from './aero'
import { curves, equilibrium, solveFlat, twsAtHeel, windSweep } from './solve'

const json = xp44 as unknown as BoatJson
const boat = resolveBoat(json, 'upwind')
const crew = (slot: (i: number) => string, posture: 'sit' | 'legs' | 'hike' = 'sit', kg = 85) =>
  Array.from({ length: 10 }, (_, i) => ({ id: i, name: `C${i}`, kg, slot: slot(i), posture }))
const railHike = crew((i) => (i < 8 ? `rail-w-${i}` : i === 8 ? 'helm-w' : 'trim-w'), 'hike')
const allBelow = crew(() => 'below')
const wind = (tws: number, twa = 40) => apparentWind(tws, twa, boatSpeed(json.polar, tws, twa))
const model = (c: ReturnType<typeof crew>, tws: number, flat = 1, twa = 40, zPenalty = true) => ({
  boat, crew: crewPositions(c, boat.slotById), wind: wind(tws, twa), flat, zPenalty,
})

describe('lerpTable', () => {
  it('interpolates and clamps', () => {
    expect(lerpTable([0, 10], [0, 100], 5)).toBe(50)
    expect(lerpTable([0, 10], [0, 100], -1)).toBe(0)
    expect(lerpTable([0, 10], [0, 100], 11)).toBe(100)
  })
})

describe('GZ parametric curve', () => {
  it('matches ORC-published CAL 39 curve (GM 1.08, AVS 113°, n 1.6) within 0.025 m to 60°', () => {
    const pub: [number, number][] = [[10, 0.186], [20, 0.349], [25, 0.416], [30, 0.475], [40, 0.565], [60, 0.574]]
    for (const [d, v] of pub) expect(Math.abs(gz(d * DEG, 1.08, 113 * DEG, 1.6) - v)).toBeLessThan(0.025)
  })
  it('is odd, zero at 0 and AVS, slope GM at origin', () => {
    expect(gz(0, 1.5, 2, 1.6)).toBe(0)
    expect(gz(2, 1.5, 2, 1.6)).toBeCloseTo(0, 10)
    expect(gz(-0.3, 1.5, 2, 1.6)).toBeCloseTo(-gz(0.3, 1.5, 2, 1.6), 12)
    expect(gz(1e-4, 1.5, 2, 1.6) / 1e-4).toBeCloseTo(1.5, 3)
  })
  it('peaks around 55–60° for the Xp44 defaults', () => {
    const p = phiGzMax(boat.gm, boat.avs, boat.n) / DEG
    expect(p).toBeGreaterThan(50); expect(p).toBeLessThan(62)
  })
})

describe('Xp44 stability defaults', () => {
  it('GM from ORC RM1 260 kg·m/deg at 9700 kg ≈ 1.536 m and round-trips', () => {
    expect(boat.gm).toBeCloseTo(1.536, 2)
    expect(rm1FromGm(gmFromRm1(260, 9700), 9700)).toBeCloseTo(260, 9)
  })
  it('RM_hull(20°) ≈ 47 kN·m (±5%)', () => {
    expect(rmHull(boat, 20 * DEG) / 1e3).toBeGreaterThan(44.6)
    expect(rmHull(boat, 20 * DEG) / 1e3).toBeLessThan(49.4)
  })
  it('RM_hull at 1° ≈ 260 kg·m', () => {
    expect(rmHull(boat, DEG) / G).toBeCloseTo(260, 0)
  })
})

describe('crew moments', () => {
  const zG = boat.zCrew0 // reference: ORC default crew on the centreline at 0.98 m
  it('slots exist for 8 rail per side + work + centre', () => {
    expect(boat.slots.filter((s) => s.kind === 'rail' && s.side === 'w')).toHaveLength(8)
    expect(boat.slotById['helm-w']).toBeDefined()
    expect(boat.slotById['below'].y).toBe(0)
    expect(boat.slotById['helm-w'].y).toBeCloseTo(0.7 * boat.halfbeamAt(11.7), 6)
  })
  it('rail arms are ~1.75–2.05 m sitting; hiking adds 0.4 m; leeward mirrors (no posture offset to leeward)', () => {
    const w = boat.slotById['rail-w-4'], l = boat.slotById['rail-l-4']
    expect(w.y).toBeGreaterThan(1.75); expect(w.y).toBeLessThan(2.05)
    expect(l.y).toBeCloseTo(-w.y, 12)
    const [sit] = crewPositions([{ id: 0, name: 'a', kg: 85, slot: 'rail-w-4', posture: 'sit' }], boat.slotById)
    const [hike] = crewPositions([{ id: 0, name: 'a', kg: 85, slot: 'rail-w-4', posture: 'hike' }], boat.slotById)
    expect(hike.y - sit.y).toBeCloseTo(0.4, 12)
    const [lh] = crewPositions([{ id: 0, name: 'a', kg: 85, slot: 'rail-l-4', posture: 'hike' }], boat.slotById)
    expect(lh.y).toBeCloseTo(-sit.y, 12) // nobody hikes to leeward
    // posture ignored off the rail
    const [helmHike] = crewPositions([{ id: 0, name: 'a', kg: 85, slot: 'helm-w', posture: 'hike' }], boat.slotById)
    expect(helmHike.y).toBeCloseTo(boat.slotById['helm-w'].y, 12)
  })
  it('10 × 85 kg hiked ≈ +13.5–16.5 kN·m at 20°, ORC-style (no z) larger, leeward negative, below decks slightly positive (lower than cert crew)', () => {
    const pts = crewPositions(railHike, boat.slotById)
    const withZ = rmCrew(pts, 20 * DEG, zG, true) / 1e3
    const noZ = rmCrew(pts, 20 * DEG, zG, false) / 1e3
    expect(withZ).toBeGreaterThan(13.5); expect(withZ).toBeLessThan(16.5)
    expect(noZ).toBeGreaterThan(withZ)
    const lee = crewPositions(crew((i) => `rail-l-${i % 8}`, 'hike'), boat.slotById)
    expect(rmCrew(lee, 20 * DEG, zG, true)).toBeLessThan(0)
    expect(rmCrew(crewPositions(allBelow, boat.slotById), 20 * DEG, zG, true)).toBeGreaterThan(0)
  })
  it('crew contribution crosses zero near arctan(y/(z−zCrew0)) ≈ 75–82° — beyond the sailing range', () => {
    const [p] = crewPositions([{ id: 0, name: 'a', kg: 85, slot: 'rail-w-4', posture: 'hike' }], boat.slotById)
    const brk = Math.atan(p.y / (p.z - zG))
    expect(rmCrew([p], brk - 0.01, zG, true)).toBeGreaterThan(0)
    expect(rmCrew([p], brk + 0.01, zG, true)).toBeLessThan(0)
    expect(brk / DEG).toBeGreaterThan(74); expect(brk / DEG).toBeLessThan(83)
  })
})

describe('aero', () => {
  it('apparent wind: TWS 10 / TWA 90 / BSP 7 → AWS ≈ 12.2, AWA ≈ 55°', () => {
    const w = apparentWind(10, 90, 7)
    expect(w.aws).toBeCloseTo(12.21, 1); expect(w.awa).toBeCloseTo(55, 0)
  })
  it('polar seed: upwind 12 kn ≈ 7.3 kn boat speed, clamps outside grid', () => {
    expect(boatSpeed(json.polar, 12, 40)).toBeCloseTo(7.3, 1)
    expect(boatSpeed(json.polar, 100, 40)).toBe(boatSpeed(json.polar, 30, 40))
  })
  it('C_H upwind at full power ≈ 1.35 (β≈27°) and drops well below on a beam reach', () => {
    const up = sailCoeffs(boat.sails, boat.area, boat.hEff, 27, 1)
    expect(up.ch).toBeGreaterThan(1.25); expect(up.ch).toBeLessThan(1.45)
    expect(up.cr).toBeGreaterThan(0.4)
    const reach = sailCoeffs(boat.sails, boat.area, boat.hEff, 90, 1)
    expect(reach.ch).toBeLessThan(up.ch)
    expect(reach.cr).toBeGreaterThan(up.cr) // more drive reaching
  })
  it('flat scales lift and lowers CE (ORC twist)', () => {
    const a = sailCoeffs(boat.sails, boat.area, boat.hEff, 27, 1), b = sailCoeffs(boat.sails, boat.area, boat.hEff, 27, 0.5)
    expect(b.cl).toBeCloseTo(a.cl / 2, 9)
    expect(zceEff(10, 0.5, boat.frac)).toBeLessThan(10 * 0.8)
    expect(zceEff(10, 1, boat.frac)).toBe(10)
  })
  it('heeling arm ≈ 10 m at full power; HM decreases with heel', () => {
    expect(heelingArm(boat, 1)).toBeGreaterThan(9.5); expect(heelingArm(boat, 1)).toBeLessThan(11)
    const w = wind(12)
    let prev = Infinity
    for (let d = 0; d <= 60; d += 5) { const h = heelingMoment(boat, w, 1, d * DEG); expect(h).toBeLessThan(prev); prev = h }
  })
})

describe('equilibrium', () => {
  it('hiked crew heel less than all-below by ~3–8° at 12 kn full power', () => {
    const a = equilibrium(model(railHike, 12)), b = equilibrium(model(allBelow, 12))
    expect(a.overpowered).toBe(false); expect(b.overpowered).toBe(false)
    const d = (b.phi - a.phi) / DEG
    expect(d).toBeGreaterThan(3); expect(d).toBeLessThan(8)
    expect(a.phi / DEG).toBeGreaterThan(12); expect(a.phi / DEG).toBeLessThan(30)
  })
  it('root is a genuine zero of net moment', () => {
    const m = model(railHike, 14)
    const e = equilibrium(m)
    const c = curves(m)
    expect(c.phi).toHaveLength(91)
    const rmAt = rmHull(boat, e.phi) + rmCrew(m.crew, e.phi, boat.zCrew0, true)
    expect(Math.abs(rmAt - heelingMoment(boat, m.wind, 1, e.phi)) / rmAt).toBeLessThan(1e-6)
  })
  it('overpowered at 30 kn, full power, crew below', () => {
    expect(equilibrium(model(allBelow, 30)).overpowered).toBe(true)
  })
  it('light air with crew to windward gives windward (negative) heel', () => {
    expect(equilibrium(model(railHike, 4)).phi).toBeLessThan(0)
  })
  it('auto-trim: solveFlat(target) then equilibrium(flat) ≈ target', () => {
    const base = { boat, crew: crewPositions(railHike, boat.slotById), wind: wind(18), zPenalty: true }
    const r = solveFlat(base, 20 * DEG)
    expect(r.trimLimited).toBe(false); expect(r.underpowered).toBe(false)
    expect(equilibrium({ ...base, flat: r.flat }).phi / DEG).toBeCloseTo(20, 1)
    expect(solveFlat({ ...base, wind: wind(5) }, 20 * DEG).flat).toBe(1)
    expect(solveFlat({ ...base, wind: wind(40) }, 20 * DEG).trimLimited).toBe(true)
  })
  it('wind sweep is monotone; hiked crew reach 20° at higher TWS than crew below ("free wind" > 1 kn)', () => {
    const tws = [6, 8, 10, 12, 14, 16, 18, 20, 24, 30]
    const sw = (c: typeof railHike) => windSweep({ boat, crew: crewPositions(c, boat.slotById), flat: 1, zPenalty: true }, (t) => wind(t), tws)
    const a = sw(railHike), b = sw(allBelow)
    for (let i = 1; i < a.length; i++) expect(a[i].phi).toBeGreaterThanOrEqual(a[i - 1].phi)
    const ta = twsAtHeel(a, 20 * DEG)!, tb = twsAtHeel(b, 20 * DEG)!
    expect(ta - tb).toBeGreaterThan(1)
  })
})

describe('round-2 review fixes', () => {
  it('twist only lowers the sail plan above the sheer: heelingArm at flat=0.42 ≈ 8.1 m (freeboard not twisted)', () => {
    const fb = json.hull.freeboard
    const expected = zceEff(boat.zce - fb, 0.42, boat.frac) + fb + 0.43 * boat.draft
    expect(heelingArm(boat, 0.42)).toBeCloseTo(expected, 9)
    expect(heelingArm(boat, 0.42)).toBeGreaterThan(8.0); expect(heelingArm(boat, 0.42)).toBeLessThan(8.3)
    expect(heelingArm(boat, 1)).toBeCloseTo(boat.zce + 0.43 * boat.draft, 9)
  })
  it('ORC KPP parasite term is area-weighted (~0.0147 upwind), C_R still > 0.4', () => {
    const c = sailCoeffs(boat.sails, boat.area, boat.hEff, 26, 1)
    expect(c.cd).toBeGreaterThan(0.13); expect(c.cr).toBeGreaterThan(0.4)
  })
})
