import { useEffect, useRef, useState } from 'react'
import type { Derived } from '../model'
import { DEG } from '../physics/types'
import { defaultRoll, rollPeriod, simulatePuff, type Trajectory } from '../physics/dynamics'
import { fmt, linePath, scale, useWidth } from './svg'

export interface PuffState { traj: Trajectory; t: number; dTws: number }

/** Drives a puff playback with requestAnimationFrame; returns current playback state. */
export function usePuff(d: Derived) {
  const [puff, setPuff] = useState<PuffState | null>(null)
  const raf = useRef<number>(0)
  const start = (dTws: number) => {
    const traj = simulatePuff(d.boat, d.crewPts, d.zPenalty, d.flat, d.wind.tws, d.wind.twa, d.wind.bsp, dTws, defaultRoll(d.boat))
    const t0 = performance.now()
    cancelAnimationFrame(raf.current)
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      if (t >= traj.t[traj.t.length - 1]) { setPuff({ traj, t: traj.t[traj.t.length - 1], dTws }); return }
      setPuff({ traj, t, dTws })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const stop = () => { cancelAnimationFrame(raf.current); setPuff(null) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return { puff, start, stop }
}

export const sampleAt = (tr: Trajectory, t: number) => {
  const i = Math.min(tr.t.length - 1, Math.max(0, Math.round((t / tr.t[tr.t.length - 1]) * (tr.t.length - 1))))
  return { phi: tr.phi[i], tws: tr.tws[i] }
}

/** Puff controls + heel trace. */
export default function PuffPanel({ d, puff, onStart, onStop }: { d: Derived; puff: PuffState | null; onStart: (dTws: number) => void; onStop: () => void }) {
  const [dTws, setDTws] = useState(5)
  const [ref, w] = useWidth<HTMLDivElement>()
  const H = 120, M = { l: 34, r: 10, t: 10, b: 20 }
  const tr = puff?.traj
  const T = rollPeriod(d.boat, defaultRoll(d.boat))
  const yMax = tr ? Math.max(40, Math.ceil((tr.peak / DEG + 3) / 5) * 5) : 40
  const sx = scale(0, 14, M.l, w - M.r), sy = scale(0, yMax, H - M.b, M.t)
  const cur = tr && puff ? sampleAt(tr, puff.t) : null
  const done = !!(tr && puff && puff.t >= tr.t[tr.t.length - 1] - 0.05)
  return (
    <div ref={ref}>
      <div className="panel-head">
        <h2>Puff</h2>
        <span className="hint">roll period ≈ {fmt(T, 1)} s · sails & crew held as they are</span>
        <div className="chips" style={{ alignItems: 'center' }}>
          <label className="small muted">+<input type="range" min={2} max={10} step={1} value={dTws} onChange={(e) => setDTws(Number(e.target.value))} style={{ width: 90, verticalAlign: 'middle', accentColor: 'var(--c-sail)' }} aria-label="puff strength" /> <b className="num">{dTws} kn</b></label>
          <button className="btn sm primary" onClick={() => onStart(dTws)}>{puff && !done ? 'Again' : 'Puff!'}</button>
          {puff && <button className="btn sm" onClick={onStop}>Clear</button>}
        </div>
      </div>
      {!tr ? (
        <p className="small muted">A gust hits harder than its steady-state heel: the boat rolls past the new equilibrium before the keel catches it. Press <b>Puff!</b> to watch the stern view — then compare formations with A/B: the crew that is already hiked has the margin.</p>
      ) : (
        <>
          <svg width="100%" viewBox={`0 0 ${w} ${H}`} style={{ display: 'block' }} aria-label="Heel angle during the puff">
            <g className="grid">{[0, 10, 20, 30, 40, 50, 60].filter((v) => v <= yMax).map((v) => <line key={v} x1={M.l} x2={w - M.r} y1={sy(v)} y2={sy(v)} />)}</g>
            <g className="axis">{[0, 10, 20, 30, 40, 50, 60].filter((v) => v <= yMax).map((v) => <text key={v} x={M.l - 6} y={sy(v) + 4} textAnchor="end">{v}°</text>)}
              {[0, 5, 10].map((v) => <text key={v} x={sx(v)} y={H - 4} textAnchor="middle">{v} s</text>)}</g>
            {/* puff window */}
            <rect x={sx(1)} y={M.t} width={sx(1 + 1.5 + 5 + 2.5) - sx(1)} height={H - M.b - M.t} fill="var(--c-sail)" opacity={0.06} />
            <line x1={M.l} x2={w - M.r} y1={sy(tr.phiStaticBase / DEG)} y2={sy(tr.phiStaticBase / DEG)} stroke="var(--c-ghost)" strokeDasharray="4 3" />
            <line x1={M.l} x2={w - M.r} y1={sy(tr.phiStaticPuff / DEG)} y2={sy(tr.phiStaticPuff / DEG)} stroke="var(--c-sail)" strokeDasharray="2 3" />
            <text x={w - M.r - 4} y={sy(tr.phiStaticPuff / DEG) - 4} textAnchor="end" fontSize={10.5} fill="var(--c-sail)">static at +{puff!.dTws} kn: {fmt(tr.phiStaticPuff / DEG, 1)}°</text>
            <path d={linePath(tr.t.filter((t) => t <= puff!.t), tr.phi.filter((_, i) => tr.t[i] <= puff!.t).map((p) => p / DEG), sx, sy)} fill="none" stroke="var(--c-hull)" strokeWidth={2} />
            {cur && <circle cx={sx(puff!.t)} cy={sy(cur.phi / DEG)} r={4} fill="var(--c-hull)" stroke="#fff" strokeWidth={1.5} />}
            {done && (
              <g>
                <circle cx={sx(tr.peakT)} cy={sy(tr.peak / DEG)} r={3.5} fill="var(--c-sail)" />
                <text x={sx(tr.peakT) + 6} y={sy(tr.peak / DEG) - 6} fontSize={11} fontWeight={600} fill="var(--c-sail)" className="num">peak {fmt(tr.peak / DEG, 1)}° (+{fmt((tr.peak - tr.phiStaticPuff) / DEG, 1)}° overshoot)</text>
              </g>
            )}
          </svg>
          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--c-hull)' }} />heel during the puff</span>
            <span><i className="sw dash" style={{ color: 'var(--c-ghost)' }} />steady heel before ({fmt(tr.phiStaticBase / DEG, 1)}°)</span>
            <span><i className="sw dash" style={{ color: 'var(--c-sail)' }} />steady heel in the puff</span>
          </div>
        </>
      )}
    </div>
  )
}
