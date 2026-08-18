import type { Posture } from '../physics/types'

/** Stick figure of a rail crew member at the windward deck edge, boat frame (y outboard+, z up). */
export function Figure({ posture, y0, z0 }: { posture: Posture; y0: number; z0: number }) {
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
