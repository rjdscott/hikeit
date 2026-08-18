import { describe, expect, it } from 'vitest'
import { derive } from '../model'
import { initialState, reducer } from '../state'
import { BOAT_JSON } from '../model'

describe('auto sail selection', () => {
  it('changes down monotonically as TWS rises (hiking crew, target 20°)', () => {
    let s = reducer(initialState(), { type: 'preset', name: 'Racing: rail hiking' })
    s = { ...s, sailMode: 'auto', targetHeel: 20, autoTrim: true }
    const rank = (id: string) => BOAT_JSON.sailModes.find((m) => m.id === id)!.rank!
    let prev = -1
    const picks: string[] = []
    for (const tws of [6, 10, 14, 18, 22, 26, 30]) {
      const d = derive({ ...s, tws })
      picks.push(`${tws}:${d.sailModeId}`)
      expect(rank(d.sailModeId)).toBeGreaterThanOrEqual(prev)
      prev = rank(d.sailModeId)
    }
    expect(picks[0]).toBe('6:j1')
    expect(rank(picks[picks.length - 1].split(':')[1])).toBeGreaterThan(0)
  })
  it('crew on the rail lets the boat carry more sail than crew below at the same TWS', () => {
    const rank = (id: string) => BOAT_JSON.sailModes.find((m) => m.id === id)!.rank!
    const base = { ...initialState(), sailMode: 'auto', targetHeel: 20, tws: 18, autoTrim: true }
    const hike = derive(reducer(base, { type: 'preset', name: 'Racing: rail hiking' }))
    const below = derive(reducer(base, { type: 'preset', name: 'All below' }))
    expect(rank(hike.sailModeId)).toBeLessThanOrEqual(rank(below.sailModeId))
  })
})

describe('auto without auto-trim', () => {
  it('flies the biggest ranked combination when power is manual (selection assumes trimming)', () => {
    const d = derive({ ...initialState(), sailMode: 'auto', autoTrim: false, tws: 25 })
    expect(d.sailModeId).toBe('j1')
  })
})
