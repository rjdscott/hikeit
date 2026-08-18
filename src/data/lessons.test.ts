import { describe, expect, it } from 'vitest'
import { LESSONS, lessonStateAt } from './lessons'
import { initialState } from '../state'
import { resolveBoat } from '../physics/boat'
import xp44 from './xp44.json'
import type { BoatJson } from '../physics/types'

const boat = resolveBoat(xp44 as unknown as BoatJson, 'upwind')

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
