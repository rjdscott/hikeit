import { describe, expect, it } from 'vitest'
import xp44 from '../data/xp44.json'
import type { BoatJson } from './types'
import { DEG } from './types'
import { resolveBoat } from './boat'
import { crewPositions } from './stability'
import { defaultRoll, puffProfile, rollPeriod, simulatePuff } from './dynamics'
import { presets, defaultCrew } from '../state'

const boat = resolveBoat(xp44 as unknown as BoatJson, 'j1')
const crew = crewPositions(defaultCrew().map((c, i) => ({ ...c, ...presets['Racing: rail hiking'](i) })), boat.slotById)

describe('roll dynamics', () => {
  it('natural roll period is 3–5 s', () => {
    const T = rollPeriod(boat, defaultRoll(boat))
    expect(T).toBeGreaterThan(3); expect(T).toBeLessThan(5)
  })
  it('puff profile ramps, holds, decays', () => {
    expect(puffProfile(-1, 4)).toBe(0); expect(puffProfile(0.75, 4)).toBeCloseTo(2, 9); expect(puffProfile(3, 4)).toBe(4); expect(puffProfile(20, 4)).toBe(0)
  })
  it('a +5 kn puff overshoots the new static heel, then returns to the base equilibrium', () => {
    const tr = simulatePuff(boat, crew, true, 1, 12, 40, 7.3, 5)
    expect(tr.peak).toBeGreaterThan(tr.phiStaticPuff) // overshoot
    expect(tr.peak - tr.phiStaticPuff).toBeLessThan(8 * DEG) // but bounded (damped)
    const last = tr.phi[tr.phi.length - 1]
    expect(Math.abs(last - tr.phiStaticBase)).toBeLessThan(0.5 * DEG)
    // during the hold the boat sits near the puff equilibrium
    const iHold = tr.t.findIndex((t) => t > 5.5)
    expect(Math.abs(tr.phi[iHold] - tr.phiStaticPuff)).toBeLessThan(2 * DEG)
  })
  it('zero puff stays put', () => {
    const tr = simulatePuff(boat, crew, true, 1, 12, 40, 7.3, 0)
    expect(Math.max(...tr.phi) - Math.min(...tr.phi)).toBeLessThan(0.05 * DEG)
  })
})

describe('crew reaction', () => {
  it('hiking 3 s after the puff peaks higher than being hiked already, and both settle', () => {
    const sit = crewPositions(defaultCrew().map((c, i) => ({ ...c, ...presets['Racing: rail sitting'](i) })), boat.slotById)
    const early = simulatePuff(boat, crew, true, 0.85, 12, 40, 7.3, 5)
    const late = simulatePuff(boat, sit, true, 0.85, 12, 40, 7.3, 5, undefined, 14, 1 / 60, { crewAfter: crew, reactAt: 3 })
    expect(late.peak).toBeGreaterThan(early.peak + 0.5 * DEG)
    expect(Math.abs(late.phi[late.phi.length - 1] - early.phi[early.phi.length - 1])).toBeLessThan(1.5 * DEG)
  })
})

describe('crew reaction ramp', () => {
  it('peak heel is monotone in reaction time (early movers do better) and never below the in-place crew', () => {
    const sit = crewPositions(defaultCrew().map((c, i) => ({ ...c, ...presets['Racing: rail sitting'](i) })), boat.slotById)
    const pit = boat.slotById['pit-w']
    const caught = crew.map((p) => (p.y > 1 ? { ...p, y: pit.y, z: pit.z } : p))
    const inPlace = simulatePuff(boat, crew, true, 0.85, 12, 40, 7.3, 5)
    const peaks = [1, 1.5, 2, 2.5, 3].map((r) => simulatePuff(boat, caught, true, 0.85, 12, 40, 7.3, 5, undefined, 14, 1 / 60, { crewAfter: crew, reactAt: r }).peak)
    for (let k = 1; k < peaks.length; k++) expect(peaks[k]).toBeGreaterThanOrEqual(peaks[k - 1] - 0.05 * DEG)
    expect(peaks[peaks.length - 1] - peaks[0]).toBeGreaterThan(1 * DEG) // late movers pay ≥ 1°
    for (const pk of peaks) expect(pk).toBeGreaterThan(inPlace.peak - 0.5 * DEG)
    void sit
  })
})
