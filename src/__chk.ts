import { initialState } from './state'
import { derive, BOAT_JSON } from './model'
const DEG = Math.PI/180
for (const tws of [10, 12, 14, 16, 20, 24]) {
  const s = { ...initialState(), tws }
  const d = derive(s)
  const s2 = { ...s, autoTrim: true }
  const d2 = derive(s2)
  console.log(tws, 'flat1 mode', d.sailModeId, 'heel', (d.eq.phi/DEG).toFixed(1), '| autoTrim mode', d2.sailModeId, 'heel', (d2.eq.phi/DEG).toFixed(1), 'flat', d2.flat.toFixed(2))
}
