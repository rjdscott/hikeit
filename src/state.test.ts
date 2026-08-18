import { describe, expect, it } from 'vitest'
import { decodeHash, encodeHash, initialState, loadLocal, presets, reducer } from './state'
import { resolveBoat } from './physics/boat'
import xp44 from './data/xp44.json'
import type { BoatJson } from './physics/types'

const boat = resolveBoat(xp44 as unknown as BoatJson, 'upwind')

describe('reducer', () => {
  it('moveCrew swaps occupant on single slots, stacks on multi slots, records ghost', () => {
    let s = initialState()
    const a = s.crew[0].slot, b = s.crew[1].slot
    s = reducer(s, { type: 'moveCrew', id: 0, slot: b })
    expect(s.crew[0].slot).toBe(b); expect(s.crew[1].slot).toBe(a); expect(s.prevCrew).not.toBeNull()
    s = reducer(s, { type: 'moveCrew', id: 0, slot: 'below' })
    s = reducer(s, { type: 'moveCrew', id: 1, slot: 'below' })
    expect(s.crew.filter((c) => c.slot === 'below')).toHaveLength(2)
  })
  it('presets place all crew in valid slots', () => {
    for (const name of Object.keys(presets) as (keyof typeof presets)[]) {
      const s = reducer(initialState(), { type: 'preset', name })
      for (const c of s.crew) expect(boat.slotById[c.slot], `${name}: ${c.slot}`).toBeDefined()
    }
  })
  it('reset keeps names/weights', () => {
    let s = reducer(initialState(), { type: 'setCrew', id: 3, patch: { name: 'Rob', kg: 92 } })
    s = reducer(s, { type: 'patch', patch: { tws: 25 } })
    s = reducer(s, { type: 'reset' })
    expect(s.tws).toBe(10); expect(s.crew[3].name).toBe('Rob'); expect(s.crew[3].kg).toBe(92)
  })
})

describe('URL hash', () => {
  it('round-trips state', () => {
    let s = reducer(initialState(), { type: 'preset', name: 'Racing: rail hiking' })
    s = reducer(s, { type: 'patch', patch: { tws: 18.5, twa: 60, flat: 0.77, autoTrim: true, zPenalty: false, lessonStep: 3 } })
    const d = decodeHash(encodeHash(s), initialState(), boat.slotById)
    expect(d.tws).toBe(18.5); expect(d.twa).toBe(60); expect(d.flat).toBe(0.77); expect(d.autoTrim).toBe(true)
    expect(d.zPenalty).toBe(false); expect(d.lessonStep).toBe(3)
    expect(d.crew.map((c) => c.slot + c.posture)).toEqual(s.crew.map((c) => c.slot + c.posture))
  })
  it('ignores garbage safely', () => {
    const d = decodeHash('#tws=abc&crew=nope.9,zzz&twa=999', initialState(), boat.slotById)
    expect(d.tws).toBe(10); expect(d.twa).toBe(180); expect(d.crew[0].slot).toBe(initialState().crew[0].slot)
  })
})

describe('railPosture + helpers', () => {
  it('railPosture sets posture only for crew on rail slots and records ghost', () => {
    let s = reducer(initialState(), { type: 'preset', name: 'Racing: rail sitting' })
    const railSlots = new Set(boat.slots.filter((x) => x.kind === 'rail').map((x) => x.id))
    s = reducer(s, { type: 'railPosture', posture: 'hike', railSlots })
    for (const c of s.crew) expect(c.posture).toBe(railSlots.has(c.slot) ? 'hike' : 'sit')
    expect(s.prevCrew).not.toBeNull()
  })
})

describe('round-2 review fixes', () => {
  it('decodeHash keeps base autoTrim/zPenalty when the params are absent (lesson deep links)', () => {
    const base = { ...initialState(), autoTrim: true, zPenalty: false }
    const d = decodeHash('#step=6', base, boat.slotById)
    expect(d.autoTrim).toBe(true); expect(d.zPenalty).toBe(false); expect(d.lessonStep).toBe(6)
  })
  it('loadLocal ignores tampered payloads', () => {
    const g = globalThis as unknown as { localStorage?: Storage }
    const store: Record<string, string> = { 'hikeit.v1': JSON.stringify({ crew: [{ name: 5, kg: 'abc' }, { name: 'Rob', kg: 92.4 }, { name: '', kg: 9999 }] }) }
    g.localStorage = { getItem: (k: string) => store[k] ?? null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 } as unknown as Storage
    const s = loadLocal(initialState())
    expect(s.crew[0].name).toBe('Crew 1'); expect(s.crew[0].kg).toBe(85)
    expect(s.crew[1].name).toBe('Rob'); expect(s.crew[1].kg).toBe(92)
    expect(s.crew[2].name).toBe('Crew 3'); expect(s.crew[2].kg).toBe(150)
    delete g.localStorage
  })
})
