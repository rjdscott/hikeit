import { describe, expect, it } from 'vitest'
import { linePath, niceTicks, scale } from './svg'

describe('svg helpers', () => {
  it('niceTicks covers the range with round steps', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(4, 30, 7)).toEqual([5, 10, 15, 20, 25, 30])
    expect(niceTicks(0, 0)).toEqual([0])
  })
  it('linePath lifts the pen over NaN gaps', () => {
    const id = (v: number) => v
    expect(linePath([0, 1, 2, 3], [0, 1, NaN, 3], id, id)).toBe('M0.0,0.0L1.0,1.0M3.0,3.0')
  })
  it('scale maps domain to range linearly', () => {
    expect(scale(0, 10, 100, 0)(2.5)).toBe(75)
  })
})
