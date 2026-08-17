import type { Derived } from '../model'
import type { Action, State } from '../state'
import { POSTURE_LABEL, type Posture } from '../physics/types'
import { fmt, kNm } from './svg'

export function Stats({ d, s }: { d: Derived; s: State }) {
  const over = d.eq.overpowered
  const crewShare = d.rmHullEq > 0 ? (100 * d.rmCrewEq) / d.rmHullEq : 0
  return (
    <div className="stats">
      <div className={`stat ${over ? 'warn' : ''}`}><div className="k">Heel</div><div className="v">{over ? 'over' : fmt(d.phiDeg, 1)}<span className="u">{over ? 'powered' : '°'}</span></div></div>
      <div className="stat hull"><div className="k">RM hull + keel</div><div className="v">{kNm(d.rmHullEq)}<span className="u">kN·m</span></div></div>
      <div className="stat crew"><div className="k">RM crew</div><div className="v">{d.rmCrewEq >= 0 ? '+' : ''}{kNm(d.rmCrewEq)}<span className="u">kN·m</span></div><div className="small muted">{fmt(crewShare, 0)}% of hull</div></div>
      <div className="stat hull"><div className="k">RM total</div><div className="v">{kNm(d.rmTotalEq)}<span className="u">kN·m</span></div></div>
      <div className="stat sail"><div className="k">Heeling moment</div><div className="v">{kNm(d.hmEq)}<span className="u">kN·m</span></div><div className="small muted">F_H {fmt(d.heelForceEq / 1e3, 1)} kN × {fmt(d.arm, 1)} m</div></div>
      <div className="stat sail"><div className="k">Drive force</div><div className="v">{fmt(d.driveEq / 1e3, 2)}<span className="u">kN</span></div><div className="small muted">flat {fmt(d.flat, 2)} · C_H {fmt(d.coeffs.ch, 2)}</div></div>
      <div className="stat crew"><div className="k">Free wind</div><div className="v">{d.freeWind === null ? '–' : (d.freeWind >= 0 ? '+' : '') + fmt(d.freeWind, 1)}<span className="u">kn</span></div><div className="small muted">at {s.targetHeel}° vs inboard</div></div>
      <div className="stat buoy"><div className="k">GM · G shift</div><div className="v">{fmt(d.boat.gm, 2)}<span className="u">m</span></div><div className="small muted">G {fmt(d.cg.yG * 100, 0)} cm to windward</div></div>
    </div>
  )
}

export function CrewTable({ s, d, hover, onHover, dispatch }: { s: State; d: Derived; hover: number | null; onHover: (id: number | null) => void; dispatch: React.Dispatch<Action> }) {
  const total = d.perCrew.reduce((a, p) => a + p.moment, 0)
  return (
    <div>
      <div className="panel-head"><h2>Crew</h2><span className="hint">edit names & weights · contribution at φ = {fmt(d.phiDeg, 1)}°</span></div>
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th className="num">kg</th><th>Position</th><th>Posture</th><th className="num">arm y (m)</th><th className="num">RM (kN·m)</th></tr></thead>
          <tbody>
            {s.crew.map((c) => {
              const p = d.perCrew.find((x) => x.id === c.id)!
              const slot = d.boat.slotById[c.slot]
              return (
                <tr key={c.id} className={hover === c.id ? 'hover' : ''} onPointerEnter={() => onHover(c.id)} onPointerLeave={() => onHover(null)}>
                  <td><input value={c.name} onChange={(e) => dispatch({ type: 'setCrew', id: c.id, patch: { name: e.target.value } })} aria-label="crew name" /></td>
                  <td className="num"><input type="number" min={40} max={150} value={c.kg} onChange={(e) => dispatch({ type: 'setCrew', id: c.id, patch: { kg: Math.min(150, Math.max(40, Number(e.target.value) || 0)) } })} aria-label="crew weight kg" /></td>
                  <td>
                    <select className="sel" value={c.slot} onChange={(e) => dispatch({ type: 'moveCrew', id: c.id, slot: e.target.value })} aria-label="position">
                      {d.boat.slots.map((sl) => <option key={sl.id} value={sl.id}>{sl.label}</option>)}
                    </select>
                  </td>
                  <td>
                    {slot?.kind === 'rail' ? (
                      <select className="sel" value={c.posture} onChange={(e) => dispatch({ type: 'setCrew', id: c.id, patch: { posture: e.target.value as Posture } })} aria-label="posture">
                        {(Object.keys(POSTURE_LABEL) as Posture[]).map((k) => <option key={k} value={k}>{POSTURE_LABEL[k]}</option>)}
                      </select>
                    ) : <span className="muted">–</span>}
                  </td>
                  <td className="num">{p.y >= 0 ? '+' : ''}{fmt(p.y, 2)}</td>
                  <td className="num" style={{ color: p.moment < 0 ? 'var(--c-sail)' : 'var(--c-crew)', fontWeight: 500 }}>{p.moment >= 0 ? '+' : ''}{kNm(p.moment, 2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot><tr><td colSpan={5} className="muted">Σ crew ({s.crew.reduce((a, c) => a + c.kg, 0)} kg)</td><td className="num" style={{ fontWeight: 600 }}>{total >= 0 ? '+' : ''}{kNm(total, 2)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  )
}
