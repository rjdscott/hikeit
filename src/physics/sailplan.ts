import type { BoatJson, CrewPoint, StabilityOverrides } from './types'
import { resolveBoat } from './boat'
import { solveFlat } from './solve'
import type { Wind } from './aero'

export const AUTO = 'auto'
export const FLAT_CHANGE_DOWN = 0.7 // below this much depower a real crew changes headsail / reefs (J1→J2 ≈ 14 kn, J3 ≈ 18 kn)

/**
 * Auto sail selection: the most sail (lowest rank) that still holds the target heel with flat ≥ FLAT_CHANGE_DOWN.
 * Falls back to the smallest combination. Only ranked (upwind) modes take part.
 */
export function selectSailMode(json: BoatJson, windFor: (json: BoatJson, modeId: string) => Wind, crew: CrewPoint[], targetPhi: number, zPenalty: boolean, ov: StabilityOverrides = {}): string {
  const ranked = json.sailModes.filter((m) => m.rank !== undefined).sort((a, b) => a.rank! - b.rank!)
  if (!ranked.length) return json.sailModes[0].id
  for (const m of ranked) {
    const boat = resolveBoat(json, m.id, ov)
    const r = solveFlat({ boat, crew, wind: windFor(json, m.id), zPenalty }, targetPhi)
    if (!r.trimLimited && r.flat >= FLAT_CHANGE_DOWN) return m.id
  }
  return ranked[ranked.length - 1].id
}
