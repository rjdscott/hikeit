import { useMemo } from 'react'
import type { Derived } from '../model'
import { DEG, G } from '../physics/types'
import { fmt } from './svg'

interface Props { d: Derived; hover: number | null; railPosture: 'sit' | 'legs' | 'hike' | null }

/** Stick figure of a rail crew member at the windward deck edge, boat frame (y outboard+, z up). */
function Figure({ posture, y0, z0 }: { posture: 'sit' | 'legs' | 'hike'; y0: number; z0: number }) {
  const st = { stroke: 'var(--c-crew)', strokeWidth: 0.11, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  if (posture === 'sit') {
    // bum inboard of the rail, feet on deck, torso upright
    const b = { y: y0 - 0.35, z: z0 }
    return (
      <g>
        <path d={`M${b.y},${b.z} L${b.y - 0.55},${b.z + 0.25} L${b.y - 0.75},${b.z}`} {...st} />
        <path d={`M${b.y},${b.z} L${b.y - 0.05},${b.z + 0.7}`} {...st} />
        <circle cx={b.y - 0.06} cy={b.z + 0.88} r={0.15} fill="var(--c-crew)" />
      </g>
    )
  }
  const b = { y: y0 - 0.02, z: z0 } // bum on the deck edge
  const legs = `M${b.y},${b.z} L${b.y + 0.42},${b.z + 0.22} L${b.y + 0.5},${b.z - 0.32}`
  if (posture === 'legs') {
    return (
      <g>
        <path d={legs} {...st} />
        <path d={`M${b.y},${b.z} L${b.y + 0.02},${b.z + 0.7}`} {...st} />
        <circle cx={b.y + 0.02} cy={b.z + 0.88} r={0.15} fill="var(--c-crew)" />
      </g>
    )
  }
  return (
    <g>
      <path d={legs} {...st} />
      <path d={`M${b.y},${b.z} L${b.y + 0.62},${b.z + 0.42}`} {...st} />
      <circle cx={b.y + 0.76} cy={b.z + 0.55} r={0.15} fill="var(--c-crew)" />
    </g>
  )
}

/** Stern view: hull section heeled to equilibrium, with the two force couples that fight each other. */
export default function HeelSection({ d, hover, railPosture }: Props) {
  const { boat, phiDeg, crewPts, cg, eq } = d
  const phi = eq.phi
  const hull = boat.json.hull
  const half = hull.section
  const secPath = useMemo(() => {
    const right = half.map(([y, z]) => `${y},${z}`).join(' L')
    const left = [...half].reverse().map(([y, z]) => `${-y},${z}`).join(' L')
    return `M${right} L${left} Z`
  }, [half])
  const deckZ = half[0][1], deckY = half[0][0]
  const k = hull.keel
  const zce = d.arm - 0.43 * boat.draft
  const zclr = -0.43 * boat.draft
  const cos = Math.cos(phi), sin = Math.sin(phi)
  // boat frame (y windward+, z up) → screen (x right = leeward, y down)
  const S = (y: number, z: number) => ({ x: -y * cos + z * sin, y: -(y * sin + z * cos) })
  const gTot = S(cg.yG, cg.zG)
  const gBoat = S(0, boat.zG)
  const gzTot = d.rmTotalEq / (cg.total * G) // effective righting arm incl. crew
  const B = { x: gTot.x + gzTot, y: 0.45 } // buoyancy acts on the vertical that gives GZ_total
  const ce = S(0, zce), clr = S(0, zclr)
  const top = S(0, deckZ), mastTop = S(0, 10.6)
  const fixed = 1.5, fixedS = 1.15 // arrow lengths, m (fixed: magnitudes shown as numbers)
  const vb = { x0: -5.6, y0: -10.9, w: 11.2, h: 14.3 }
  const heavy = eq.overpowered

  return (
    <div>
      <svg viewBox={`${vb.x0} ${vb.y0} ${vb.w} ${vb.h}`} style={{ width: '100%', height: 'auto', maxHeight: 560, display: 'block' }} aria-label="Stern view of the heeled hull with forces">
        <defs>
          <marker id="ah-hull" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-hull)" /></marker>
          <marker id="ah-buoy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-buoy)" /></marker>
          <marker id="ah-sail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-sail)" /></marker>
          <clipPath id="clip-sec"><rect x={vb.x0} y={vb.y0} width={vb.w} height={vb.h} /></clipPath>
        </defs>
        <g clipPath="url(#clip-sec)">
          {/* water */}
          <rect x={vb.x0} y={0} width={vb.w} height={4} fill="var(--c-water)" />
          <line x1={vb.x0} y1={0} x2={vb.x0 + vb.w} y2={0} stroke="var(--c-water-line)" strokeWidth={0.04} />
          {/* wind */}
          <g transform="translate(-5.2,-9.9)">
            <line x1={0} y1={0} x2={1.6} y2={0} stroke="var(--c-sail)" strokeWidth={0.06} markerEnd="url(#ah-sail)" />
            <text x={0} y={-0.25} className="ml" fontSize={0.36} fill="var(--c-sail)" fontWeight={600}>WIND {fmt(d.wind.aws, 0)} kn app.</text>
          </g>
          {/* boat: draw in boat frame then rotate. screen = rotate(phi) ∘ mirror(y→-x, z→-y) */}
          <g transform={`rotate(${phiDeg}) scale(-1,-1)`}>
            <line x1={0} y1={deckZ} x2={0} y2={22} stroke="var(--ink)" strokeWidth={0.07} />
            {/* sail (mainsail silhouette, cropped) */}
            <path d={`M0,${deckZ + 1.775} L0,${deckZ + 1.775 + boat.json.rig.P} Q${-2.6},8 ${-boat.json.rig.E * 0.95},${deckZ + 1.775} Z`} fill="rgba(200,66,58,0.06)" stroke="var(--c-sail)" strokeWidth={0.02} />
            <path d={secPath} fill="#fbfaf6" stroke="var(--ink)" strokeWidth={0.06} strokeLinejoin="round" />
            <line x1={-deckY} y1={deckZ} x2={deckY} y2={deckZ} stroke="var(--ink)" strokeWidth={0.06} />
            <path d={`M-1.25,${deckZ} L-1.1,${deckZ + 0.55} L1.1,${deckZ + 0.55} L1.25,${deckZ} Z`} fill="#f1efe8" stroke="var(--line-strong)" strokeWidth={0.03} />
            {/* lifelines */}
            {[-1, 1].map((s) => <g key={s}><line x1={s * deckY} y1={deckZ} x2={s * deckY} y2={deckZ + 0.62} stroke="var(--line-strong)" strokeWidth={0.03} /><circle cx={s * deckY} cy={deckZ + 0.62} r={0.03} fill="var(--line-strong)" /></g>)}
            {/* keel + bulb */}
            <path d={`M-0.09,${k.rootZ} L0.09,${k.rootZ} L0.06,${k.tipZ + 0.1} L-0.06,${k.tipZ + 0.1} Z`} fill="var(--c-hull)" />
            <ellipse cx={0} cy={k.tipZ + k.bulbHeight / 2} rx={0.24} ry={k.bulbHeight / 2} fill="var(--c-hull)" />
            {/* crew CG points + one figure showing the rail posture */}
            {crewPts.map((p) => (
              <circle key={p.id} cx={p.y} cy={p.z} r={hover === p.id ? 0.24 : 0.14} fill="var(--c-crew)" stroke="#fff" strokeWidth={0.04} />
            ))}
            {railPosture && <Figure posture={railPosture} y0={deckY} z0={deckZ} />}
          </g>
          {/* G (hull only) and G (with crew) */}
          <circle cx={gBoat.x} cy={gBoat.y} r={0.11} fill="none" stroke="var(--c-hull)" strokeWidth={0.04} />
          {Math.abs(gTot.x - gBoat.x) > 0.02 && <line x1={gBoat.x} y1={gBoat.y} x2={gTot.x} y2={gTot.y} stroke="var(--c-crew)" strokeWidth={0.05} markerEnd="url(#ah-hull)" />}
          <circle cx={gTot.x} cy={gTot.y} r={0.13} fill="var(--c-hull)" />
          <text x={gTot.x + 0.22} y={gTot.y - 0.15} className="ml strong" fontSize={0.34} fill="var(--c-hull)">G</text>
          {/* weight ↓ from G, buoyancy ↑ from B */}
          <line x1={gTot.x} y1={gTot.y} x2={gTot.x} y2={gTot.y + fixed} stroke="var(--c-hull)" strokeWidth={0.07} markerEnd="url(#ah-hull)" />
          <text x={gTot.x + 0.22} y={gTot.y + fixed - 0.05} className="ml num" fontSize={0.32} fill="var(--c-hull)">Δg {fmt((cg.total * G) / 1e3, 0)} kN</text>
          <circle cx={B.x} cy={B.y} r={0.11} fill="var(--c-buoy)" />
          <text x={B.x + 0.2} y={B.y + 0.42} className="ml strong" fontSize={0.34} fill="var(--c-buoy)">B</text>
          <line x1={B.x} y1={B.y} x2={B.x} y2={B.y - fixed} stroke="var(--c-buoy)" strokeWidth={0.07} markerEnd="url(#ah-buoy)" />
          {/* GZ dimension */}
          <line x1={gTot.x} y1={gTot.y} x2={gTot.x} y2={3.0} stroke="var(--c-hull)" strokeWidth={0.02} strokeDasharray="0.12 0.1" />
          <line x1={B.x} y1={B.y} x2={B.x} y2={3.0} stroke="var(--c-buoy)" strokeWidth={0.02} strokeDasharray="0.12 0.1" />
          <line x1={gTot.x} y1={2.9} x2={B.x} y2={2.9} stroke="var(--ink)" strokeWidth={0.04} />
          <text x={(gTot.x + B.x) / 2} y={3.35} className="ml strong num" fontSize={0.34} textAnchor="middle">GZ {fmt(gzTot, 2)} m → RM {fmt(d.rmTotalEq / 1e3, 1)} kN·m</text>
          {/* sail force at CE (leeward), hydro force at CLR (windward) */}
          <circle cx={ce.x} cy={ce.y} r={0.1} fill="var(--c-sail)" />
          <line x1={ce.x} y1={ce.y} x2={ce.x + fixedS} y2={ce.y} stroke="var(--c-sail)" strokeWidth={0.07} markerEnd="url(#ah-sail)" />
          <text x={ce.x + 0.25} y={ce.y + 0.5} className="ml num" fontSize={0.32} fill="var(--c-sail)">F_H {fmt(d.heelForceEq / 1e3, 1)} kN</text>
          <text x={ce.x - 0.2} y={ce.y + 0.12} className="ml" fontSize={0.3} textAnchor="end" fill="var(--c-sail)">CE</text>
          <circle cx={clr.x} cy={clr.y} r={0.1} fill="var(--c-sail)" />
          <line x1={clr.x} y1={clr.y} x2={clr.x - fixedS} y2={clr.y} stroke="var(--c-sail)" strokeWidth={0.07} markerEnd="url(#ah-sail)" />
          <text x={clr.x - fixedS - 0.15} y={clr.y + 0.12} className="ml" fontSize={0.3} textAnchor="end" fill="var(--c-sail)">keel</text>
          {/* heeling arm dimension */}
          <line x1={ce.x} y1={ce.y} x2={5.35} y2={ce.y} stroke="var(--c-sail)" strokeWidth={0.02} strokeDasharray="0.12 0.1" />
          <line x1={clr.x} y1={clr.y} x2={5.35} y2={clr.y} stroke="var(--c-sail)" strokeWidth={0.02} strokeDasharray="0.12 0.1" />
          <line x1={5.25} y1={ce.y} x2={5.25} y2={clr.y} stroke="var(--c-sail)" strokeWidth={0.04} />
          <text x={5.1} y={(ce.y + clr.y) / 2} className="ml num" fontSize={0.32} textAnchor="end" fill="var(--c-sail)" transform={`rotate(-90 5.1 ${(ce.y + clr.y) / 2})`}>h {fmt(d.arm, 1)} m → HM {fmt(d.hmEq / 1e3, 1)} kN·m</text>
          {/* heel angle arc */}
          <path d={`M0,-2.2 A2.2,2.2 0 0 1 ${2.2 * Math.sin(phi)},${-2.2 * Math.cos(phi)}`} fill="none" stroke="var(--ink)" strokeWidth={0.03} />
          <line x1={0} y1={0} x2={0} y2={-2.4} stroke="var(--ink)" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
          <line x1={0} y1={0} x2={top.x} y2={top.y} stroke="var(--ink)" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
          <text x={2.9 * Math.sin(phi / 2) + 0.15} y={-2.9 * Math.cos(phi / 2)} className="ml strong num" fontSize={0.4}>φ {fmt(phiDeg, 1)}°</text>
          {heavy && <text x={0} y={-10.3} textAnchor="middle" fontSize={0.45} fontWeight={700} fill="var(--c-sail)">OVERPOWERED — no static equilibrium: reef or depower</text>}
          <text x={mastTop.x} y={mastTop.y} className="ml" fontSize={0.28} textAnchor="middle" opacity={0}>{' '}</text>
        </g>
      </svg>
      <div className="legend">
        <span><i className="sw" style={{ background: 'var(--c-hull)' }} />weight at G · GZ</span>
        <span><i className="sw" style={{ background: 'var(--c-buoy)' }} />buoyancy at B</span>
        <span><i className="sw" style={{ background: 'var(--c-sail)' }} />sail / keel forces · arm h</span>
        <span><i className="sw" style={{ background: 'var(--c-crew)' }} />crew (G shift {fmt(cg.yG * 100, 0)} cm to windward)</span>
        <span className="muted">arrows fixed length; magnitudes labelled</span>
      </div>
    </div>
  )
}
