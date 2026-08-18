import type { Boat, Posture } from '../physics/types'
import { POSTURE_LABEL, POSTURE_OFFSET } from '../physics/types'
import { Figure } from './Figure'
import { fmt } from './svg'

/** Side-by-side deck-edge sections: where a rail crew's centre of gravity ends up for each posture. */
export function PostureFigures({ boat, current }: { boat: Boat; current: Posture | null }) {
  const slot = boat.slotById['rail-w-4']
  const deckZ = boat.json.hull.section[0][1], deckY = boat.json.hull.section[0][0]
  const panels: Posture[] = ['sit', 'legs', 'hike']
  const W = 3.1, H = 2.3 // m per panel
  return (
    <svg viewBox={`0 0 ${W * 3} ${H}`} style={{ width: '100%', maxWidth: 680, height: 'auto', display: 'block', marginBottom: 8 }} aria-label="Sitting, legs over and full hike: crew centre of gravity distance from centreline">
      {panels.map((po, i) => {
        const y = slot.y + POSTURE_OFFSET[po], z = slot.z - POSTURE_OFFSET[po] * 0.25
        const ox = i * W + 0.15
        // local: x = ox + y (metres from centreline), sy = 1.75 − (z − deckZ) so the deck sits at 1.75
        const X = (yy: number) => ox + yy, Y = (zz: number) => 1.75 - (zz - deckZ)
        const on = current === po
        return (
          <g key={po} opacity={current && !on ? 0.55 : 1}>
            <rect x={i * W + 0.02} y={0.02} width={W - 0.04} height={H - 0.04} rx={0.12} fill={on ? '#fff7ee' : 'transparent'} stroke={on ? 'var(--c-crew)' : 'var(--line)'} strokeWidth={0.02} />
            {/* centreline, deck, hull side, lifelines */}
            <line x1={X(0)} y1={0.35} x2={X(0)} y2={H - 0.15} stroke="var(--line-strong)" strokeWidth={0.02} strokeDasharray="0.08 0.06" />
            <text x={X(0) + 0.05} y={H - 0.4} fontSize={0.15} fill="var(--muted)">centreline</text>
            <path d={`M${X(0)},${Y(deckZ)} L${X(deckY)},${Y(deckZ)} L${X(deckY - 0.03)},${Y(deckZ - 0.5)}`} fill="none" stroke="var(--ink)" strokeWidth={0.04} />
            <path d={`M${X(deckY - 1.2)},${Y(deckZ)} L${X(deckY - 1.1)},${Y(deckZ + 0.4)} L${X(0)},${Y(deckZ + 0.4)}`} fill="#f1efe8" stroke="var(--line-strong)" strokeWidth={0.02} />
            {[0.3, 0.62].map((h) => <line key={h} x1={X(deckY)} y1={Y(deckZ)} x2={X(deckY)} y2={Y(deckZ + h)} stroke="var(--line-strong)" strokeWidth={0.03} />)}
            <circle cx={X(deckY)} cy={Y(deckZ + 0.62)} r={0.03} fill="var(--line-strong)" />
            <circle cx={X(deckY)} cy={Y(deckZ + 0.3)} r={0.03} fill="var(--line-strong)" />
            <g transform={`translate(${ox} ${1.75 + deckZ}) scale(1 -1)`}>
              <Figure posture={po} y0={deckY} z0={deckZ} />
            </g>
            {/* CG + arm dimension */}
            <circle cx={X(y)} cy={Y(z)} r={0.07} fill="var(--c-crew)" stroke="#fff" strokeWidth={0.02} />
            <line x1={X(y)} y1={Y(z)} x2={X(y)} y2={H - 0.3} stroke="var(--c-crew)" strokeWidth={0.02} strokeDasharray="0.06 0.05" />
            <line x1={X(0)} y1={H - 0.32} x2={X(y)} y2={H - 0.32} stroke="var(--c-crew)" strokeWidth={0.04} />
            <text x={X(y / 2)} y={H - 0.1} fontSize={0.19} fontWeight={600} textAnchor="middle" fill="var(--c-crew)" className="num">y = {fmt(y, 2)} m</text>
            <text x={i * W + 0.15} y={0.3} fontSize={0.19} fontWeight={600} fill="var(--ink)">{POSTURE_LABEL[po]}</text>
          </g>
        )
      })}
    </svg>
  )
}
