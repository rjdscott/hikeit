import type { Derived } from '../model'
import { BOAT_JSON } from '../model'
import type { Action, State } from '../state'
import { fmt } from './svg'

const Row = ({ k, a, b, unit, better, na = '–' }: { k: string; a: number | null; b: number | null; unit: string; better?: 'up' | 'down'; na?: string }) => {
  const digits = unit === 'cm' ? 0 : unit === '°' || unit === 'kn' || unit === 'kN·m' ? 1 : 2
  const has = a !== null && b !== null
  const dlt = has ? b - a : 0
  const same = has && Math.abs(dlt) < 0.05
  const good = has && !same && better ? (better === 'up' ? dlt > 0 : dlt < 0) : null
  const show = (v: number | null) => (v === null ? na : fmt(v, digits))
  return (
    <div className="cmp-row">
      <span className="k">{k}</span>
      <span className="num a">{show(a)}</span>
      <span className="arrow">→</span>
      <span className="num b">{show(b)}<small> {unit}</small></span>
      <span className={`num d ${good === null ? '' : good ? 'good' : 'bad'}`}>{!has ? '' : same ? '=' : `${dlt > 0 ? '+' : '−'}${fmt(Math.abs(dlt), digits)}`}</span>
    </div>
  )
}

/** Formation A (pinned) vs B (live). */
export default function Compare({ s, d, dA, dispatch }: { s: State; d: Derived; dA: Derived | null; dispatch: React.Dispatch<Action> }) {
  if (!dA || !s.pinned) {
    return (
      <div className="cmp-empty">
        <span className="small muted">Pin the current formation as <b>A</b>, then change anything — heel, moments, power and free wind are compared side by side.</span>
        <button className="btn sm primary" onClick={() => dispatch({ type: 'pin' })}>Pin as A</button>
      </div>
    )
  }
  const modeName = (id: string) => BOAT_JSON.sailModes.find((m) => m.id === id)?.label ?? id
  const railA = s.pinned.crew.filter((c) => c.slot.startsWith('rail-w')).length, railB = s.crew.filter((c) => c.slot.startsWith('rail-w')).length
  return (
    <div>
      <div className="panel-head">
        <h2>A vs B</h2>
        <span className="hint">A: {railA} on rail · {fmt(s.pinned.tws, 0)} kn · {modeName(dA.sailModeId)} — B: {railB} on rail · {fmt(s.tws, 0)} kn · {modeName(d.sailModeId)}</span>
        <div className="chips">
          <button className="btn sm" onClick={() => dispatch({ type: 'restorePinned' })}>Back to A</button>
          <button className="btn sm" onClick={() => dispatch({ type: 'pin' })}>Re-pin as A</button>
          <button className="btn sm" onClick={() => dispatch({ type: 'unpin' })}>Unpin</button>
        </div>
      </div>
      <div className="cmp">
        <Row k="Heel" a={dA.eq.overpowered ? null : dA.phiDeg} b={d.eq.overpowered ? null : d.phiDeg} unit="°" better="down" na="over" />
        <Row k="RM crew" a={dA.rmCrewEq / 1e3} b={d.rmCrewEq / 1e3} unit="kN·m" better="up" />
        <Row k="RM total" a={dA.rmTotalEq / 1e3} b={d.rmTotalEq / 1e3} unit="kN·m" better="up" />
        <Row k="Sail power (flat)" a={dA.flat} b={d.flat} unit="" better="up" />
        <Row k="Drive force" a={dA.driveEq / 1e3} b={d.driveEq / 1e3} unit="kN" better="up" />
        <Row k="Free wind" a={dA.freeWind} b={d.freeWind} unit="kn" better="up" />
        <Row k="G to windward" a={dA.cg.yG * 100} b={d.cg.yG * 100} unit="cm" better="up" />
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>Ghost markers on the deck plan and the dashed grey curve show A. Green = B is better for holding the boat up / going faster.</p>
    </div>
  )
}
