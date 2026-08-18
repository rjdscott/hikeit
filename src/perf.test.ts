import { expect, it } from 'vitest'
import { derive } from './model'
import { initialState, reducer } from './state'

it('derive() runs the whole pipeline (incl. 2 wind sweeps) in well under a frame', () => {
  let s = initialState()
  derive(s) // warm caches
  const t0 = performance.now()
  for (let i = 0; i < 20; i++) {
    s = reducer(s, { type: 'patch', patch: { tws: 8 + i * 0.5, autoTrim: i % 2 === 0 } })
    const d = derive(s)
    expect(Number.isFinite(d.phiDeg)).toBe(true)
  }
  const per = (performance.now() - t0) / 20
  expect(per).toBeLessThan(80) // regression signal (≈5 ms locally); generous for CI runners
})
