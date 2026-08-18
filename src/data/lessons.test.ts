import { describe, expect, it } from 'vitest'
import { LESSONS, lessonStateAt } from './lessons'
import { initialState } from '../state'
import { derive } from '../model'
import { resolveBoat } from '../physics/boat'
import xp44 from './xp44.json'
import type { BoatJson } from '../physics/types'

const boat = resolveBoat(xp44 as unknown as BoatJson, 'j1')

describe('lessons', () => {
  it('every step patch yields valid slots and the cumulative state for step 6 has auto-trim on', () => {
    let s = initialState()
    for (let i = 0; i < LESSONS.length; i++) {
      s = { ...s, ...LESSONS[i].patch(s) }
      for (const c of s.crew) expect(boat.slotById[c.slot], `step ${i} slot ${c.slot}`).toBeDefined()
    }
    const at6 = { ...initialState(), ...lessonStateAt(initialState(), 6) }
    expect(at6.autoTrim).toBe(true)
    expect(at6.crew.filter((c) => c.slot.startsWith('rail-w')).length).toBe(8)
  })
})

describe('quiz answers are same-sail and sensible', () => {
  it('crew-to-rail quiz answer is positive for TWS 10–18 from the step-2 state', () => {
    for (const tws of [10, 12, 14, 16, 18]) {
      const before = { ...initialState(), ...lessonStateAt(initialState(), 1), tws }
      const q = LESSONS[2].quiz!
      const after = { ...before, ...LESSONS[2].patch(before) }
      const ans = q.answer(derive(before), derive(after))
      expect(ans, `tws ${tws}`).toBeGreaterThan(0.5)
      expect(before.sailMode).toBe('j1')
    }
  })
})
