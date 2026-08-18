import { useEffect, useState, useSyncExternalStore } from 'react'
import type { Derived } from '../model'
import { DEG } from '../physics/types'
import { defaultRoll, rollPeriod, simulatePuff, type Trajectory } from '../physics/dynamics'
import { fmt, linePath, scale, useWidth } from './svg'

export interface PuffState { traj: Trajectory; late: Trajectory | null; reactAt: number; t: number; dTws: number }

// Tiny external store so the 60 fps playback clock only re-renders the subscribers (stern view + puff panel), not the whole app.
let puffState: PuffState | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const getSnap = () => puffState
let raf = 0

export const usePuffState = () => useSyncExternalStore(subscribe, getSnap, getSnap)

/** The same people caught inboard (cockpit / pit) when the puff hits, reaching their current positions after `reactAt` s. */
export function caughtInboard(d: Derived) {
  const pit = d.boat.slotById['pit-w']
  return d.crewPts.map((p) => (p.y > 1.0 ? { ...p, y: pit.y, z: pit.z } : p))
}

export function startPuff(d: Derived, dTws: number, reactAt: number | null) {
  const roll = defaultRoll(d.boat)
  const traj = simulatePuff(d.boat, d.crewPts, d.zPenalty, d.flat, d.wind.tws, d.wind.twa, d.wind.bsp, dTws, roll)
  const late = reactAt !== null
    ? simulatePuff(d.boat, caughtInboard(d), d.zPenalty, d.flat, d.wind.tws, d.wind.twa, d.wind.bsp, dTws, roll, 14, 1 / 60, { crewAfter: d.crewPts, reactAt })
    : null
  const t0 = performance.now()
  cancelAnimationFrame(raf)
  const tick = () => {
    const t = (performance.now() - t0) / 1000
    const end = traj.t[traj.t.length - 1]
    puffState = { traj, late, reactAt: reactAt ?? 0, t: Math.min(t, end), dTws }; emit()
    if (t < end) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
export function stopPuff() { cancelAnimationFrame(raf); puffState = null; emit() }
/** Any change to the model invalidates a finished trace's context; keep it (it is a record) but stop playback. */
export function usePuffCleanup() { useEffect(() => () => { cancelAnimationFrame(raf) }, []) }

export const sampleAt = (tr: Trajectory, t: number) => {
  const i = Math.min(tr.t.length - 1, Math.max(0, Math.round((t / tr.t[tr.t.length - 1]) * (tr.t.length - 1))))
  return { phi: tr.phi[i], tws: tr.tws[i] }
}

/** Puff controls + heel trace (rendered inside the stern-view panel). */
export default function PuffPanel({ d }: { d: Derived }) {
  const puff = usePuffState()
  const [compare, setCompare] = useState(true)
  const [reactAt, setReactAt] = useState(2)
  const onStart = (x: number) => startPuff(d, x, compare ? reactAt : null)
  const onStop = stopPuff
  const [dTws, setDTws] = useState(5)
  const [ref, w] = useWidth<HTMLDivElement>()
  const narrow = w < 480
  const H = narrow ? 170 : 120, M = { l: 34, r: 10, t: 10, b: 20 }
  const tr = puff?.traj
  const T = rollPeriod(d.boat, defaultRoll(d.boat))
  const late = puff?.late ?? null
  const yMax = tr ? Math.max(40, Math.ceil((Math.max(tr.peak, late?.peak ?? 0) / DEG + 3) / 5) * 5) : 40
  const sx = scale(0, 14, M.l, w - M.r), sy = scale(0, yMax, H - M.b, M.t)
  const cur = tr && puff ? sampleAt(tr, puff.t) : null
  const done = !!(tr && puff && puff.t >= tr.t[tr.t.length - 1] - 0.05)
  const over = d.eq.overpowered
  return (
    <div ref={ref}>
      <div className="panel-head">
        <h2>Puff</h2>
        <span className="hint">roll period ≈ {fmt(T, 1)} s · sails & crew held as they are</span>
        <div className="chips" style={{ alignItems: 'center' }}>
          <label className="small muted">+<input type="range" min={2} max={10} step={1} value={dTws} onChange={(e) => setDTws(Number(e.target.value))} style={{ width: 90, verticalAlign: 'middle', accentColor: 'var(--c-sail)' }} aria-label="puff strength" /> <b className="num">{dTws} kn</b></label>
          <button className="btn sm primary" onClick={() => onStart(dTws)} disabled={over} title={over ? 'Already overpowered — reef or change down first' : ''}>{puff && !done ? 'Again' : 'Puff!'}</button>
          {puff && <button className="btn sm" onClick={onStop}>Clear</button>}
        </div>
      </div>
      <div className="toggle" style={{ marginTop: 0, flexWrap: 'wrap', rowGap: 4 }}>
        <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare with the same crew caught in the cockpit,</label>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', opacity: compare ? 1 : 0.5 }}>starting to move after <input type="range" min={0.5} max={3} step={0.5} value={reactAt} onChange={(e) => setReactAt(Number(e.target.value))} style={{ width: 80, accentColor: 'var(--c-sail)' }} aria-label="reaction time" disabled={!compare} /> <b className="num">{reactAt} s</b></span>
      </div>
      {over && <p className="small muted">The boat is already overpowered at this wind and trim — no steady heel to puff from. Reef, change down or hike first.</p>}
      {!tr ? (
        !over && <p className="small muted">A gust hits harder than its steady-state heel: the boat rolls past the new equilibrium before the keel catches it. Press <b>Puff!</b> and watch the boat above — then pin A/B and send two people below: the crew that is already out has the margin.</p>
      ) : (
        <>
          <svg width="100%" viewBox={`0 0 ${w} ${H}`} style={{ display: 'block' }} aria-label="Heel angle during the puff">
            <g className="grid">{[0, 10, 20, 30, 40, 50, 60].filter((v) => v <= yMax).map((v) => <line key={v} x1={M.l} x2={w - M.r} y1={sy(v)} y2={sy(v)} />)}</g>
            <g className="axis">{[0, 10, 20, 30, 40, 50, 60].filter((v) => v <= yMax).map((v) => <text key={v} x={M.l - 6} y={sy(v) + 4} textAnchor="end">{v}°</text>)}
              {[0, 5, 10].map((v) => <text key={v} x={sx(v)} y={H - 4} textAnchor="middle">{v} s</text>)}</g>
            {/* puff window */}
            <rect x={sx(1)} y={M.t} width={sx(1 + 1.5 + 5 + 2.5) - sx(1)} height={H - M.b - M.t} fill="var(--c-sail)" opacity={0.06} />
            <line x1={M.l} x2={w - M.r} y1={sy(tr.phiStaticBase / DEG)} y2={sy(tr.phiStaticBase / DEG)} stroke="var(--c-ghost)" strokeDasharray="4 3" />
            {!tr.puffOver && <line x1={M.l} x2={w - M.r} y1={sy(tr.phiStaticPuff / DEG)} y2={sy(tr.phiStaticPuff / DEG)} stroke="var(--c-sail)" strokeDasharray="2 3" />}
            {!narrow && <text x={w - M.r - 4} y={(tr.puffOver ? M.t + 12 : sy(tr.phiStaticPuff / DEG) - 4)} textAnchor="end" fontSize={10.5} fill="var(--c-sail)">{tr.puffOver ? `+${puff!.dTws} kn: overpowered — no steady heel` : `static at +${puff!.dTws} kn: ${fmt(tr.phiStaticPuff / DEG, 1)}°`}</text>}
            {late && <path d={linePath(late.t.filter((t) => t <= puff!.t), late.phi.filter((_, i) => late.t[i] <= puff!.t).map((p) => p / DEG), sx, sy)} fill="none" stroke="var(--c-sail)" strokeWidth={2} strokeDasharray="5 3" />}
            {late && <line x1={sx(1 + puff!.reactAt)} x2={sx(1 + puff!.reactAt)} y1={M.t} y2={H - M.b} stroke="var(--c-sail)" strokeDasharray="2 3" opacity={0.6} />}
            {late && !narrow && <text x={sx(1 + puff!.reactAt) + 3} y={H - M.b - 4} fontSize={10} fill="var(--c-sail)">crew start moving</text>}
            <path d={linePath(tr.t.filter((t) => t <= puff!.t), tr.phi.filter((_, i) => tr.t[i] <= puff!.t).map((p) => p / DEG), sx, sy)} fill="none" stroke="var(--c-hull)" strokeWidth={2} />
            {cur && <circle cx={sx(puff!.t)} cy={sy(cur.phi / DEG)} r={4} fill="var(--c-hull)" stroke="#fff" strokeWidth={1.5} />}
            {done && !tr.puffOver && !narrow && (
              <g>
                <circle cx={sx(tr.peakT)} cy={sy(tr.peak / DEG)} r={3.5} fill="var(--c-hull)" />
                <text x={sx(tr.peakT) + 6} y={sy(tr.peak / DEG) + (late ? 15 : -6)} fontSize={11} fontWeight={600} fill="var(--c-hull)" className="num" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}>peak {fmt(tr.peak / DEG, 1)}° (+{fmt((tr.peak - tr.phiStaticPuff) / DEG, 1)}° overshoot)</text>
                {late && <text x={M.l + 6} y={M.t + 12} fontSize={11} fontWeight={600} fill="var(--c-sail)" className="num" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}>caught inboard: peak {fmt(late.peak / DEG, 1)}° ({late.peak >= tr.peak ? '+' : '−'}{fmt(Math.abs(late.peak - tr.peak) / DEG, 1)}° vs in place)</text>}
              </g>
            )}
          </svg>
          {done && !tr.puffOver && narrow && (
            <div className="small" style={{ marginTop: 4 }}>
              <div><b className="num" style={{ color: 'var(--c-hull)' }}>Peak {fmt(tr.peak / DEG, 1)}°</b> (+{fmt((tr.peak - tr.phiStaticPuff) / DEG, 1)}° overshoot over the steady {fmt(tr.phiStaticPuff / DEG, 1)}° in the puff)</div>
              {late && <div><b className="num" style={{ color: 'var(--c-sail)' }}>Caught inboard: peak {fmt(late.peak / DEG, 1)}°</b> ({late.peak >= tr.peak ? '+' : '−'}{fmt(Math.abs(late.peak - tr.peak) / DEG, 1)}° vs in place)</div>}
            </div>
          )}
          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--c-hull)' }} />this formation, already in place</span>
            {late && <span><i className="sw dash" style={{ color: 'var(--c-sail)' }} />same crew caught in the cockpit, starting to move {puff!.reactAt} s after the puff (≈1.5 s to get out)</span>}
            <span><i className="sw dash" style={{ color: 'var(--c-ghost)' }} />steady heel before ({fmt(tr.phiStaticBase / DEG, 1)}°)</span>
            <span><i className="sw dash" style={{ color: 'var(--c-sail)' }} />steady heel in the puff{tr.puffOver ? ' (overpowered)' : ` (${fmt(tr.phiStaticPuff / DEG, 1)}°)`}</span>
          </div>
        </>
      )}
    </div>
  )
}
