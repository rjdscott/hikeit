import { Component, lazy, Suspense, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { decodeHash, encodeHash, initialState, loadLocal, reducer, saveLocal, type State } from './state'
import { BOAT_JSON, useDerived } from './model'
import { resolveBoat } from './physics/boat'
import { LESSONS } from './data/lessons'
import DeckPlan from './ui/DeckPlan'
import HeelSection from './ui/HeelSection'
import { MomentChart, WindSweepChart } from './ui/Charts'
import Controls from './ui/Controls'
import { CrewTable, Stats } from './ui/Readouts'
import Advanced from './ui/Advanced'
import Lesson from './ui/Lesson'
import PosturePanel from './ui/Posture'

const Equations = lazy(() => import('./ui/Equations'))
const SLOTS = resolveBoat(BOAT_JSON, 'upwind').slotById

function fromHash(hash: string, base: State): State {
  const s0 = decodeHash(hash, base, SLOTS)
  const step = s0.lessonStep
  if (step === null) return s0
  if (!Number.isInteger(step) || !LESSONS[step]) return { ...s0, lessonStep: null }
  // lesson step supplies defaults; anything explicit in the URL wins
  return decodeHash(hash, { ...base, ...LESSONS[step].patch(base) }, SLOTS)
}
const init = (): State => fromHash(typeof location !== 'undefined' ? location.hash : '', loadLocal(initialState()))

class Boundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (this.state.err) return <div className="app"><div className="panel"><h2>Something broke</h2><p className="small">{String(this.state.err.message)}</p><button className="btn" onClick={() => { location.hash = ''; location.reload() }}>Reset and reload</button></div></div>
    return this.props.children
  }
}

function App() {
  const [s, dispatch] = useReducer(reducer, undefined, init)
  const d = useDerived(s)
  const [hover, setHover] = useState<number | null>(null)
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
  const startLesson = () => dispatch({ type: 'lesson', step: 0, patch: LESSONS[0].patch(s) })

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

      <div className="grid">
        {s.lessonStep !== null && <section className="panel area-lesson"><Lesson s={s} dispatch={dispatch} /></section>}
        <section className="panel area-deck">
          <div className="panel-head"><h2>Deck plan</h2><span className="hint">wind from the red arrow (windward side) · drag crew to slots</span></div>
          <DeckPlan boat={d.boat} crew={s.crew} hover={hover} onHover={setHover}
            onMove={(id, slot) => dispatch({ type: 'moveCrew', id, slot })}
            onPosture={(id, posture) => dispatch({ type: 'setCrew', id, patch: { posture } })} />
        </section>
        <section className="panel area-section">
          <div className="panel-head"><h2>Stern view at equilibrium</h2><span className="hint">two couples: weight/buoyancy vs sail/keel</span></div>
          <HeelSection d={d} hover={hover} railPosture={railPosture} />
        </section>
        <section className="panel area-stats"><Stats d={d} s={s} /></section>
        <section className="panel area-posture"><PosturePanel s={s} d={d} dispatch={dispatch} /></section>
        <section className="panel area-controls"><Controls s={s} d={d} dispatch={dispatch} /></section>
        <section className="panel area-readouts"><CrewTable s={s} d={d} hover={hover} onHover={setHover} dispatch={dispatch} /></section>
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
        <section className="panel area-advanced"><Advanced s={s} d={d} dispatch={dispatch} /></section>
      </div>
      <footer className="footer">
        <p>Educational model for crew briefings — not a stability certificate. Physics, sources and assumptions: <a href="https://github.com/rjdscott/hikeit">github.com/rjdscott/hikeit</a>. Boat data from builder specs and public ORC certificates of Xp 44 sisterships.</p>
      </footer>
    </div>
  )
}

export default function Root() {
  return <Boundary><App /></Boundary>
}
