import { useEffect, useRef, useState } from 'react'
import type { Derived } from '../model'
import { POSTURE_LABEL, POSTURE_OFFSET, type Posture, type Slot } from '../physics/types'
import { crewMoment } from '../physics/stability'
import type { Action, State } from '../state'
import { MULTI } from '../state'
import { fmt, kNm } from './svg'

export const initials = (name: string, id: number) =>
  /^crew\s*\d+$/i.test(name.trim()) ? String(id + 1) : (name.trim().split(/\s+/).length > 1 ? name.trim().split(/\s+/).map((w) => w[0]).join('') : name.trim().slice(0, 2)).slice(0, 2).toUpperCase() || String(id + 1)

const GROUPS: { title: string; match: (s: Slot) => boolean }[] = [
  { title: 'Windward rail', match: (s) => s.kind === 'rail' && s.side === 'w' },
  { title: 'Cockpit & deck', match: (s) => s.kind === 'work' && s.side === 'w' || s.kind === 'centre' },
  { title: 'Leeward', match: (s) => s.side === 'l' },
]

/** One place per person: name, weight, where they are, how they sit, what they're worth. */
export default function CrewSheet({ id, s, d, dispatch, onClose, onSelect }: {
  id: number; s: State; d: Derived; dispatch: React.Dispatch<Action>; onClose: () => void; onSelect: (id: number) => void
}) {
  const c = s.crew.find((x) => x.id === id)!
  const p = d.perCrew.find((x) => x.id === id)!
  const slot = d.boat.slotById[c.slot]
  const wRail = slot?.kind === 'rail' && slot.side === 'w'
  const maxAbs = Math.max(1, ...d.perCrew.map((x) => Math.abs(x.moment)))
  const rootRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<Element | null>(null)
  const [kgDraft, setKgDraft] = useState<{ id: number; txt: string } | null>(null)
  const kg = kgDraft && kgDraft.id === id ? kgDraft.txt : null
  const setKg = (txt: string | null) => setKgDraft(txt === null ? null : { id, txt })
  // focus management: move focus into the dialog on open, restore to the opener on close
  useEffect(() => {
    openerRef.current = document.activeElement
    rootRef.current?.focus()
    return () => { (openerRef.current as HTMLElement | null)?.focus?.() }
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [onClose])
  const occupant = (sl: Slot) => (MULTI.has(sl.id) ? null : s.crew.find((x) => x.slot === sl.id && x.id !== id) ?? null)
  const postureDelta = (po: Posture) => {
    if (!wRail) return 0
    const y0 = slot.y, z0 = slot.z
    const q = { ...p, y: y0 + POSTURE_OFFSET[po], z: z0 - POSTURE_OFFSET[po] * 0.25 }
    return crewMoment(q, d.eq.phi, d.boat.zCrew0, d.zPenalty) - crewMoment({ ...p, y: y0, z: z0 }, d.eq.phi, d.boat.zCrew0, d.zPenalty)
  }
  const idx = s.crew.findIndex((x) => x.id === id)
  return (
    <div className="sheet" role="dialog" aria-label={`${c.name}`} ref={rootRef} tabIndex={-1}>
      <div className="sheet-head">
        <button className="btn sm" onClick={() => onSelect(s.crew[(idx + s.crew.length - 1) % s.crew.length].id)} aria-label="previous crew">‹</button>
        <span className="avatar">{initials(c.name, c.id)}</span>
        <input className="sheet-name" value={c.name} onChange={(e) => dispatch({ type: 'setCrew', id, patch: { name: e.target.value } })} aria-label="name" />
        <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input className="sheet-kg" type="number" inputMode="numeric" min={40} max={150} value={kg ?? c.kg} aria-label="weight kg"
            onChange={(e) => setKg(e.target.value)}
            onBlur={() => { const v = Number(kg); if (kg !== null && Number.isFinite(v) && kg.trim()) dispatch({ type: 'setCrew', id, patch: { kg: Math.min(150, Math.max(40, Math.round(v))) } }); setKg(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />kg
        </span>
        <button className="btn sm" onClick={() => onSelect(s.crew[(idx + 1) % s.crew.length].id)} aria-label="next crew">›</button>
        <button className="btn sm" onClick={onClose} aria-label="close">✕</button>
      </div>
      <div className="sheet-now">
        <span><b>{slot?.label}</b>{wRail ? ` · ${POSTURE_LABEL[c.posture]}` : ''} · arm {p.y >= 0 ? '+' : ''}{fmt(p.y, 2)} m</span>
        <span className="num" style={{ color: p.moment < 0 ? 'var(--c-sail)' : 'var(--c-crew-ink)', fontWeight: 600 }}>{p.moment >= 0 ? '+' : ''}{kNm(p.moment, 2)} kN·m</span>
        <span className="bar"><i style={{ width: `${(100 * Math.abs(p.moment)) / maxAbs}%`, background: p.moment < 0 ? 'var(--c-sail)' : 'var(--c-crew)' }} /></span>
      </div>
      {wRail && (
        <div className="seg" role="radiogroup" aria-label="posture">
          {(Object.keys(POSTURE_LABEL) as Posture[]).map((po) => {
            const dm = postureDelta(po)
            return (
              <button key={po} role="radio" aria-checked={c.posture === po} className={c.posture === po ? 'on' : ''} onClick={() => dispatch({ type: 'setCrew', id, patch: { posture: po } })}>
                <span>{POSTURE_LABEL[po]}</span>
                <small className="num">+{fmt(POSTURE_OFFSET[po], 1)} m</small><small className="num">{dm >= 0 ? '+' : ''}{kNm(dm, 2)} kN·m</small>
              </button>
            )
          })}
        </div>
      )}
      <div className="small muted" style={{ margin: '2px 0 4px' }}>Move to… (⇄ = occupied, tap to swap)</div>
      {GROUPS.map((g) => {
        const slots = d.boat.slots.filter(g.match)
        return (
          <div key={g.title} className="sheet-group">
            <div className="k">{g.title}</div>
            <div className="chips">
              {slots.map((sl) => {
                const occ = occupant(sl)
                const here = sl.id === c.slot
                return (
                  <button key={sl.id} className={`btn sm${here ? ' active' : ''}${occ ? ' occupied' : ''}`} onClick={() => !here && dispatch({ type: 'moveCrew', id, slot: sl.id })} aria-label={`${sl.label}${occ ? `, occupied by ${occ.name} — swap` : ''}`}>
                    {sl.kind === 'rail' ? sl.label.replace('Lee rail', 'Lee').replace('Rail ', '') : sl.label}
                    {occ && <span className="occ" title={`swap with ${occ.name}`}>⇄ {initials(occ.name, occ.id)}</span>}
                    {MULTI.has(sl.id) && !here && s.crew.some((x) => x.slot === sl.id) && <span className="occ">{s.crew.filter((x) => x.slot === sl.id).length}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
