import type { Derived } from '../model'
import type { Action, State } from '../state'
import { POSTURE_LABEL } from '../physics/types'
import { initials } from './CrewSheet'
import { fmt, kNm } from './svg'

export function Stats({ d, s }: { d: Derived; s: State }) {
  const over = d.eq.overpowered
  const crewShare = d.rmHullEq > 0 ? (100 * d.rmCrewEq) / d.rmHullEq : 0
  return (
    <div className="stats">
      <div className={`stat ${over ? 'warn' : ''}`}><div className="k">Heel</div><div className="v">{over ? 'over' : fmt(d.phiDeg, 1)}<span className="u">{over ? 'powered' : '°'}</span></div></div>
      <div className="stat hull"><div className="k">RM hull + keel</div><div className="v">{kNm(d.rmHullEq)}<span className="u">kN·m</span></div></div>
      <div className="stat crew"><div className="k">RM crew</div><div className="v">{d.rmCrewEq >= 0 ? '+' : ''}{kNm(d.rmCrewEq)}<span className="u">kN·m</span></div><div className="small muted">{fmt(crewShare, 0)}% of hull</div></div>
      <div className="stat crew"><div className="k">RM total</div><div className="v">{kNm(d.rmTotalEq)}<span className="u">kN·m</span></div></div>
      <div className="stat sail"><div className="k">Heeling moment</div><div className="v">{kNm(d.hmEq)}<span className="u">kN·m</span></div><div className="small muted">F_H {fmt(d.heelForceEq / 1e3, 1)} kN × {fmt(d.arm, 1)} m</div></div>
      <div className="stat sail"><div className="k">Drive force</div><div className="v">{fmt(d.driveEq / 1e3, 2)}<span className="u">kN</span></div><div className="small muted">flat {fmt(d.flat, 2)} · C_H {fmt(d.coeffs.ch, 2)}</div></div>
      <div className="stat crew"><div className="k">Free wind</div><div className="v">{d.freeWind === null ? '–' : (d.freeWind >= 0 ? '+' : '') + fmt(d.freeWind, 1)}<span className="u">kn</span></div><div className="small muted">at {s.targetHeel}° vs inboard</div></div>
      <div className="stat hull"><div className="k">GM · G shift</div><div className="v">{fmt(d.boat.gm, 2)}<span className="u">m</span></div><div className="small muted">G {fmt(d.cg.yG * 100, 0)} cm to windward</div></div>
    </div>
  )
}

export function CrewList({ s, d, hover, selected, onHover, onSelect }: { s: State; d: Derived; hover: number | null; selected: number | null; onHover: (id: number | null) => void; onSelect: (id: number) => void }) {
  const total = d.perCrew.reduce((a, p) => a + p.moment, 0)
  const maxAbs = Math.max(1, ...d.perCrew.map((p) => Math.abs(p.moment)))
  return (
    <div>
      <div className="panel-head"><h2>Crew</h2><span className="hint">tap a person to move them · Σ {total >= 0 ? '+' : ''}{kNm(total, 1)} kN·m at φ = {fmt(d.phiDeg, 1)}°</span></div>
      <ul className="crew-list">
        {s.crew.map((c) => {
          const p = d.perCrew.find((x) => x.id === c.id)!
          const slot = d.boat.slotById[c.slot]
          const wRail = slot?.kind === 'rail' && slot.side === 'w'
          return (
            <li key={c.id} className={`${hover === c.id ? 'hover' : ''} ${selected === c.id ? 'on' : ''}`} onPointerEnter={() => onHover(c.id)} onPointerLeave={() => onHover(null)} onClick={() => onSelect(c.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c.id) } }} aria-label={`${c.name}, ${slot?.label}, ${kNm(p.moment, 2)} kilonewton metres`}>
              <span className="avatar">{initials(c.name, c.id)}</span>
              <div className="who"><b>{c.name} <span className="num">{c.kg} kg</span></b><span>{slot?.label}{wRail ? ` · ${POSTURE_LABEL[c.posture]}` : ''} · arm {p.y >= 0 ? '+' : ''}{fmt(p.y, 2)} m</span></div>
              <span className="val" style={{ color: p.moment < 0 ? 'var(--c-sail)' : 'var(--c-crew)', fontWeight: 600 }}>{p.moment >= 0 ? '+' : ''}{kNm(p.moment, 2)}</span>
              <span className="bar"><i style={{ width: `${(100 * Math.abs(p.moment)) / maxAbs}%`, background: p.moment < 0 ? 'var(--c-sail)' : 'var(--c-crew)' }} /></span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
