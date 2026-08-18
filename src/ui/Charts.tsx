import { memo, useState } from 'react'
import type { Derived } from '../model'
import { DEG } from '../physics/types'
import { crewMoment } from '../physics/stability'
import { fmt, linePath, niceTicks, scale, useWidth } from './svg'

const H = 280
const M = { l: 52, r: 16, t: 28, b: 38 }

function Frame({ w, xTicks, yTicks, sx, sy, xLabel, yLabel, children }: {
  w: number; xTicks: number[]; yTicks: number[]; sx: (v: number) => number; sy: (v: number) => number; xLabel: string; yLabel: string; children: React.ReactNode
}) {
  return (
    <>
      <g className="grid">{yTicks.map((t) => <line key={t} x1={M.l} x2={w - M.r} y1={sy(t)} y2={sy(t)} />)}</g>
      <g className="axis">
        <line x1={M.l} x2={w - M.r} y1={H - M.b} y2={H - M.b} />
        {xTicks.map((t) => <text key={t} x={sx(t)} y={H - M.b + 16} textAnchor="middle">{t}</text>)}
        {yTicks.map((t) => <text key={t} x={M.l - 8} y={sy(t) + 4} textAnchor="end">{t}</text>)}
        <text x={(M.l + w - M.r) / 2} y={H - 6} textAnchor="middle" fill="var(--muted)" fontSize={11}>{xLabel}</text>
        <text x={M.l - 44} y={14} fill="var(--muted)" fontSize={11}>{yLabel}</text>
      </g>
      {children}
    </>
  )
}

/** Righting vs heeling moment against heel angle; the crossing is the equilibrium. */
export const MomentChart = memo(function MomentChart({ d, hover }: { d: Derived; hover: number | null }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hx, setHx] = useState<number | null>(null)
  const { curves: c, ghost } = d
  const xMax = 70
  const rmMax = Math.max(...c.rmTotal.slice(0, xMax + 1), ...c.rmHull.slice(0, xMax + 1)) / 1e3
  const yMax = Math.max(rmMax * 1.2, Math.min(c.hm[0] / 1e3, rmMax * 2.2))
  const sx = scale(0, xMax, M.l, w - M.r), sy = scale(0, yMax, H - M.b, M.t)
  const yTicks = niceTicks(0, yMax, 5), xTicks = niceTicks(0, xMax, 7)
  const k = (a: number[]) => a.slice(0, xMax + 1).map((v) => Math.min(v / 1e3, yMax * 1.05))
  const phi = c.phi.slice(0, xMax + 1)
  const hull = k(c.rmHull), tot = k(c.rmTotal), hm = k(c.hm)
  const band = linePath(phi, hull, sx, sy) + linePath([...phi].reverse(), [...tot].reverse(), sx, sy).replace('M', 'L') + 'Z'
  const eqX = d.phiDeg, eqY = d.rmTotalEq / 1e3
  const hov = hover !== null ? d.perCrew.find((p) => p.id === hover) : null
  const hovLine = hov ? phi.map((deg, i) => hull[i] + crewMoment(hov, deg * DEG, d.boat.zCrew0, d.zPenalty) / 1e3) : null
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * w
    const deg = Math.round(((x - M.l) / (w - M.r - M.l)) * xMax)
    setHx(deg >= 0 && deg <= xMax ? deg : null)
  }
  const i = hx
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} style={{ display: 'block' }} onPointerMove={onMove} onPointerLeave={() => setHx(null)} aria-label="Righting and heeling moment versus heel angle">
        <Frame w={w} xTicks={xTicks} yTicks={yTicks} sx={sx} sy={sy} xLabel="heel angle φ (°)" yLabel="moment (kN·m)">
          <path d={band} fill="var(--c-crew)" opacity={0.16} />
          {ghost && <path d={linePath(phi, k(ghost.curves.rmTotal), sx, sy)} fill="none" stroke="var(--c-ghost)" strokeWidth={2} strokeDasharray="5 4" />}
          <path d={linePath(phi, hull, sx, sy)} fill="none" stroke="var(--c-hull)" strokeWidth={2} />
          <path d={linePath(phi, tot, sx, sy)} fill="none" stroke="var(--c-crew)" strokeWidth={2.2} />
          {hovLine && <path d={linePath(phi, hovLine, sx, sy)} fill="none" stroke="var(--c-crew)" strokeWidth={1.2} strokeDasharray="3 3" />}
          <path d={linePath(phi, hm, sx, sy)} fill="none" stroke="var(--c-sail)" strokeWidth={2} />
          {ghost && !ghost.eq.overpowered && (
            <circle cx={sx(ghost.eq.phi / DEG)} cy={sy(Math.min(yMax, (ghost.curves.rmTotal[Math.round(ghost.eq.phi / DEG)] ?? 0) / 1e3))} r={4} fill="#fff" stroke="var(--c-ghost)" strokeWidth={2} />
          )}
          {!d.eq.overpowered && (
            <g>
              <line x1={sx(eqX)} x2={sx(eqX)} y1={sy(0)} y2={sy(eqY)} stroke="var(--c-eq)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={sx(eqX)} cy={sy(eqY)} r={5.5} fill="var(--c-eq)" stroke="#fff" strokeWidth={2} />
              <text x={sx(eqX) + 6} y={H - M.b - 8} fontSize={12} fontWeight={600} fill="var(--c-eq)" className="num" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}>φ = {fmt(eqX, 1)}°</text>
            </g>
          )}
          {d.eq.overpowered && <text x={w - M.r - 4} y={M.t + 14} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--c-sail)">Overpowered — HM above max RM</text>}
          {i !== null && (
            <g>
              <line x1={sx(i)} x2={sx(i)} y1={M.t} y2={H - M.b} stroke="var(--line-strong)" strokeWidth={1} />
              {[[hull[i], 'var(--c-hull)'], [tot[i], 'var(--c-crew)'], [hm[i], 'var(--c-sail)']].map(([v, col], j) => (
                <circle key={j} cx={sx(i)} cy={sy(v as number)} r={3.5} fill={col as string} stroke="#fff" strokeWidth={1.5} />
              ))}
              <g transform={`translate(${sx(i) + (i > xMax * 0.6 ? -170 : 12)}, ${M.t + 4})`}>
                <rect width={158} height={64} rx={6} fill="#fff" stroke="var(--line)" />
                <text x={8} y={16} fontSize={11} fill="var(--muted)">at φ = {i}°</text>
                <text x={8} y={31} fontSize={11.5} fill="var(--c-hull)" className="num">RM hull {fmt(hull[i], 1)}</text>
                <text x={8} y={45} fontSize={11.5} fill="var(--c-crew-ink)" className="num">RM hull+crew {fmt(tot[i], 1)}</text>
                <text x={8} y={59} fontSize={11.5} fill="var(--c-sail)" className="num">HM {fmt(c.hm[i] / 1e3, 1)}</text>
              </g>
            </g>
          )}
        </Frame>
      </svg>
      <div className="legend">
        <span><i className="sw" style={{ background: 'var(--c-hull)' }} />RM hull + keel</span>
        <span><i className="sw" style={{ background: 'var(--c-crew)' }} />RM incl. crew (band = crew)</span>
        <span><i className="sw" style={{ background: 'var(--c-sail)' }} />heeling moment</span>
        {ghost && <span><i className="sw dash" style={{ color: 'var(--c-ghost)' }} />previous formation</span>}
        <span><i className="sw" style={{ background: 'var(--c-eq)' }} />equilibrium</span>
      </div>
    </div>
  )
})

/** Equilibrium heel vs true wind: current formation vs everyone inboard. */
export const WindSweepChart = memo(function WindSweepChart({ d, tws, targetHeel }: { d: Derived; tws: number; targetHeel: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hx, setHx] = useState<number | null>(null)
  const yMax = 50
  const xs = d.sweep.map((p) => p.tws)
  const sx = scale(4, 30, M.l, w - M.r), sy = scale(-5, yMax, H - M.b, M.t)
  const deg = (p: { phi: number; overpowered: boolean }) => (p.overpowered || p.phi / DEG > yMax ? NaN : p.phi / DEG)
  const cur = d.sweep.map(deg), base = d.sweepBase.map(deg)
  const overFrom = d.sweep.find((p) => p.overpowered)?.tws ?? null
  const ta = xs.map((_, i) => i).find((i) => cur[i] >= targetHeel), tb = xs.map((_, i) => i).find((i) => base[i] >= targetHeel)
  const lerpX = (arr: number[], i: number | undefined) => (i === undefined || i === 0 ? null : xs[i - 1] + ((targetHeel - arr[i - 1]) / (arr[i] - arr[i - 1] || 1)) * (xs[i] - xs[i - 1]))
  const xa = lerpX(cur, ta), xb = lerpX(base, tb)
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * w
    const t = Math.round(4 + ((x - M.l) / (w - M.r - M.l)) * 26)
    setHx(t >= 4 && t <= 30 ? t : null)
  }
  const i = hx !== null ? hx - 4 : null
  const fw = d.freeWind
  return (
    <div ref={ref}>
      <svg width="100%" viewBox={`0 0 ${w} ${H}`} style={{ display: 'block' }} onPointerMove={onMove} onPointerLeave={() => setHx(null)} aria-label="Equilibrium heel versus true wind speed">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--c-sail)" strokeWidth="1" opacity="0.35" /></pattern></defs>
        <Frame w={w} xTicks={niceTicks(4, 30, 7)} yTicks={niceTicks(-5, yMax, 6)} sx={sx} sy={sy} xLabel="true wind speed (kn)" yLabel="equilibrium heel (°)">
          <line x1={M.l} x2={w - M.r} y1={sy(targetHeel)} y2={sy(targetHeel)} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 4" />
          <text x={w - M.r - 4} y={sy(targetHeel) - 5} textAnchor="end" fontSize={11} fill="var(--muted)">target heel {targetHeel}°</text>
          <line x1={sx(tws)} x2={sx(tws)} y1={M.t} y2={H - M.b} stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="4 3" />
          {overFrom !== null && (
            <g>
              <rect x={sx(overFrom)} y={M.t} width={Math.max(0, w - M.r - sx(overFrom))} height={H - M.b - M.t} fill="url(#hatch)" opacity={0.6} />
              <text x={sx(overFrom) > w - M.r - 90 ? w - M.r - 4 : sx(overFrom) + 6} y={M.t + 14} textAnchor={sx(overFrom) > w - M.r - 90 ? 'end' : 'start'} fontSize={11} fill="var(--c-sail)" fontWeight={600}>overpowered {sx(overFrom) > w - M.r - 90 ? '' : '→'}</text>
            </g>
          )}
          <path d={linePath(xs, base, sx, sy)} fill="none" stroke="var(--c-ghost)" strokeWidth={2} strokeDasharray="5 4" />
          <path d={linePath(xs, cur, sx, sy)} fill="none" stroke="var(--c-crew)" strokeWidth={2.4} />
          {xa !== null && xb !== null && (
            <g>
              <line x1={sx(xb)} x2={sx(xa)} y1={sy(targetHeel)} y2={sy(targetHeel)} stroke="var(--c-crew)" strokeWidth={4} strokeLinecap="round" />
              <circle cx={sx(xb)} cy={sy(targetHeel)} r={3.5} fill="var(--c-ghost)" /><circle cx={sx(xa)} cy={sy(targetHeel)} r={3.5} fill="var(--c-crew)" />
            </g>
          )}
          {fw !== null && (
            <g>
              <text x={w - M.r - 4} y={H - M.b - 22} textAnchor="end" fontSize={12.5} fontWeight={600} fill="var(--c-crew-ink)" className="num" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}>free wind: {fw >= 0 ? '+' : ''}{fmt(fw, 1)} kn</text>
              <text x={w - M.r - 4} y={H - M.b - 8} textAnchor="end" fontSize={11} fill="var(--muted)" style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 3 }}>extra TWS at {targetHeel}° heel vs. all crew inboard</text>
            </g>
          )}
          {i !== null && (
            <g>
              <line x1={sx(hx!)} x2={sx(hx!)} y1={M.t} y2={H - M.b} stroke="var(--line-strong)" strokeWidth={1} />
              {!Number.isNaN(cur[i]) && <circle cx={sx(hx!)} cy={sy(cur[i])} r={3.5} fill="var(--c-crew)" stroke="#fff" strokeWidth={1.5} />}
              {!Number.isNaN(base[i]) && <circle cx={sx(hx!)} cy={sy(base[i])} r={3.5} fill="var(--c-ghost)" stroke="#fff" strokeWidth={1.5} />}
              <g transform={`translate(${sx(hx!) + (hx! > 20 ? -150 : 12)}, ${H - M.b - 66})`}>
                <rect width={140} height={50} rx={6} fill="#fff" stroke="var(--line)" />
                <text x={8} y={16} fontSize={11} fill="var(--muted)">TWS {hx} kn</text>
                <text x={8} y={31} fontSize={11.5} fill="var(--c-crew-ink)" className="num">this formation {d.sweep[i].overpowered ? 'overpowered' : fmt(cur[i], 1) + '°'}</text>
                <text x={8} y={45} fontSize={11.5} fill="var(--c-ghost)" className="num">all inboard {d.sweepBase[i].overpowered ? 'overpowered' : fmt(base[i], 1) + '°'}</text>
              </g>
            </g>
          )}
        </Frame>
      </svg>
      <div className="legend">
        <span><i className="sw" style={{ background: 'var(--c-crew)' }} />this formation</span>
        <span><i className="sw dash" style={{ color: 'var(--c-ghost)' }} />all crew inboard (centreline)</span>
        <span className="muted">at current sail power (flat = {fmt(d.flat, 2)}); lines stop above {yMax}°; hatched = no static equilibrium (overpowered)</span>
      </div>
    </div>
  )
})
