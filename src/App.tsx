import { Component, lazy, Suspense, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { clearLocal, decodeHash, encodeHash, initialState, loadLocal, reducer, saveLocal, type State } from './state'
import { BOAT_JSON, useDerived } from './model'
import { resolveBoat } from './physics/boat'
import { LESSONS, lessonStateAt } from './data/lessons'
import DeckPlan from './ui/DeckPlan'
import HeelSection from './ui/HeelSection'
import { MomentChart, WindSweepChart } from './ui/Charts'
import Controls from './ui/Controls'
import { CrewList, Stats } from './ui/Readouts'
import CrewSheet from './ui/CrewSheet'
import Compare from './ui/Compare'
import Glossary from './ui/Glossary'
import PuffPanel, { usePuffCleanup } from './ui/Puff'
import { derive } from './model'
import { useMemo } from 'react'
import Advanced from './ui/Advanced'
import Lesson from './ui/Lesson'
import PosturePanel from './ui/Posture'

const Equations = lazy(() => import('./ui/Equations'))
const SLOTS = resolveBoat(BOAT_JSON, BOAT_JSON.sailModes[0].id).slotById

function fromHash(hash: string, base: State): State {
  const s0 = decodeHash(hash, base, SLOTS)
  const step = s0.lessonStep
  if (step === null) return s0
  if (!Number.isInteger(step) || !LESSONS[step]) return { ...s0, lessonStep: null }
  // lesson step supplies defaults; anything explicit in the URL wins
  return decodeHash(hash, { ...base, ...lessonStateAt(base, step) }, SLOTS)
}
const init = (): State => fromHash(typeof location !== 'undefined' ? location.hash : '', loadLocal(initialState()))

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (this.state.err) return <div className="app"><div className="panel"><h2>Something broke</h2><p className="small">{String(this.state.err.message)}</p><button className="btn" onClick={() => { clearLocal(); location.hash = ''; location.reload() }}>Reset and reload</button></div></div>
    return this.props.children
  }
}

function App() {
  const [s, dispatch] = useReducer(reducer, undefined, init)
  const d0 = useDerived(s)
  const dA = useMemo(() => (s.pinned ? derive({ ...s, ...s.pinned, pinned: null }) : null), [s.pinned])
  // when A is pinned, the ghost curve/marker is A rather than the previous formation
  const d = useMemo(() => (dA ? { ...d0, ghost: { curves: dA.curves, eq: dA.eq, flat: dA.flat } } : d0), [d0, dA])
  const [hover, setHover] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  usePuffCleanup()
  const [copied, setCopied] = useState(false)

  const sRef = useRef(s); sRef.current = s
  useEffect(() => { saveLocal(s) }, [s.crew])
  // state → URL (debounced: Safari throttles replaceState) and URL → state on hashchange
  useEffect(() => {
    const t = setTimeout(() => { const h = encodeHash(s); if (location.hash !== h) try { history.replaceState(null, '', h) } catch { /* throttled */ } }, 250)
    return () => clearTimeout(t)
  }, [s])
  useEffect(() => {
    const on = () => { if (location.hash !== encodeHash(sRef.current)) dispatch({ type: 'patch', patch: fromHash(location.hash, sRef.current) }) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  const share = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }
  const railCrew = s.crew.filter((c) => d.boat.slotById[c.slot]?.kind === 'rail' && d.boat.slotById[c.slot].side === 'w')
  const railPosture = railCrew.length ? railCrew.map((c) => c.posture).sort((a, b) => railCrew.filter((c) => c.posture === b).length - railCrew.filter((c) => c.posture === a).length)[0] : null
  const startLesson = () => dispatch({ type: 'lesson', step: 0, patch: lessonStateAt(s, 0) })

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>hikeit <span className="muted" style={{ fontWeight: 400 }}>— crew weight & righting moment</span></h1>
          <div className="sub">{BOAT_JSON.name} · 10 crew · move people, change the wind, watch the moments balance</div>
        </div>
        <div className="actions">
          {s.lessonStep === null ? <button className="btn primary" onClick={startLesson}>Start the lesson</button> : <span className="small muted">Lesson mode — every control stays live</span>}
          <button className="btn" onClick={share}>{copied ? 'Link copied ✓' : 'Share this scenario'}</button>
        </div>
      </header>

      <div className="minibar" aria-hidden="true">
        <span>Heel <b className="num">{d.eq.overpowered ? 'over' : d.phiDeg.toFixed(1) + '°'}</b></span>
        <span>Crew <b className="num" style={{ color: 'var(--c-crew)' }}>{d.rmCrewEq >= 0 ? '+' : ''}{(d.rmCrewEq / 1e3).toFixed(1)}</b> kN·m</span>
        <span>Free wind <b className="num">{d.freeWind === null ? '–' : (d.freeWind >= 0 ? '+' : '') + d.freeWind.toFixed(1)}</b> kn</span>
        <span>{d.wind.tws.toFixed(0)} kn · flat <b className="num">{d.flat.toFixed(2)}</b></span>
      </div>
      <div className="grid">
        {s.lessonStep !== null && <section className="panel area-lesson"><Lesson s={s} d={d} dispatch={dispatch} /></section>}
        <section className="panel area-deck">
          <div className="panel-head"><h2>Deck plan</h2><span className="hint">wind from the red arrow (windward side) · drag crew to slots</span></div>
          <DeckPlan boat={d.boat} crew={s.crew} ghostCrew={s.pinned?.crew ?? null} hover={hover} onHover={setHover} selected={selected} onSelect={setSelected}
            onMove={(id, slot) => dispatch({ type: 'moveCrew', id, slot })}
            onPosture={(id, posture) => dispatch({ type: 'setCrew', id, patch: { posture } })} />
        </section>
        <section className="panel area-section">
          <div className="panel-head"><h2>Stern view</h2><span className="hint">at equilibrium — or rolling through a puff · weight/buoyancy vs sail/keel</span></div>
          <HeelSection d={d} hover={hover} railPosture={railPosture} />
          <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}><PuffPanel d={d} /></div>
        </section>
        <section className="panel area-stats"><Stats d={d} s={s} /></section>
        <section className="panel area-compare"><Compare s={s} d={d} dA={dA} dispatch={dispatch} /></section>
        <section className="panel area-posture"><PosturePanel s={s} d={d} dispatch={dispatch} /></section>
        <section className="panel area-controls"><Controls s={s} d={d} dispatch={dispatch} /></section>
        <section className="panel area-readouts"><CrewList s={s} d={d} hover={hover} selected={selected} onHover={setHover} onSelect={setSelected} /></section>
        <section className="panel area-moment">
          <div className="panel-head"><h2>Moments vs heel</h2><span className="hint">hover for values</span></div>
          <MomentChart d={d} hover={hover} />
        </section>
        <section className="panel area-sweep">
          <div className="panel-head"><h2>Heel vs wind strength</h2><span className="hint">how much breeze the formation buys</span></div>
          <WindSweepChart d={d} tws={s.tws} targetHeel={s.targetHeel} />
        </section>
        <section className="panel area-eq">
          <Suspense fallback={<div className="muted small">Loading equations…</div>}><Equations d={d} /></Suspense>
        </section>
        <section className="panel area-glossary"><Glossary /></section>
        <section className="panel area-advanced"><Advanced s={s} d={d} dispatch={dispatch} /></section>
      </div>
      {selected !== null && s.crew.some((c) => c.id === selected) && (
        <CrewSheet id={selected} s={s} d={d} dispatch={dispatch} onClose={() => setSelected(null)} onSelect={setSelected} />
      )}
      <footer className="footer">
        <p>Educational model for crew briefings — not a stability certificate. Physics, sources and assumptions: <a href="https://github.com/rjdscott/hikeit">github.com/rjdscott/hikeit</a>. Boat data from builder specs and public ORC certificates of Xp 44 sisterships.</p>
      </footer>
    </div>
  )
}

export default function Root() {
  return <Boundary><App /></Boundary>
}
