import type { Boat, BoatJson, Slot, StabilityOverrides } from './types'
import { DEG } from './types'

export function lerpTable(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) return ys[0]
  const last = xs.length - 1
  if (x >= xs[last]) return ys[last]
  let i = 1
  while (xs[i] < x) i++
  const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
  return ys[i - 1] + t * (ys[i] - ys[i - 1])
}

/** GM from ORC "RM at 1°" (kg·m/deg): GM = RM1 / (Δ · sin 1°). */
export const gmFromRm1 = (rm1: number, disp: number) => rm1 / (disp * Math.sin(DEG))
export const rm1FromGm = (gm: number, disp: number) => gm * disp * Math.sin(DEG)

export function buildSlots(json: BoatJson, halfbeamAt: (x: number) => number): Slot[] {
  const { rail, slots } = json.deck
  const out: Slot[] = []
  const x0 = json.rig.mastX + rail.fromMast
  for (let i = 0; i < rail.count; i++) {
    const x = x0 + i * rail.spacing
    const y = halfbeamAt(x) - rail.inset
    out.push({ id: `rail-w-${i}`, label: `Rail ${i + 1}`, kind: 'rail', side: 'w', x, y, z: rail.z })
    out.push({ id: `rail-l-${i}`, label: `Lee rail ${i + 1}`, kind: 'rail', side: 'l', x, y: -y, z: rail.z })
  }
  for (const s of slots) {
    const y = s.y ?? (s.yFrac ?? 0) * halfbeamAt(s.x)
    if (s.side === 'centre') out.push({ id: s.id, label: s.label, kind: 'centre', side: 'c', x: s.x, y: 0, z: s.z })
    else {
      out.push({ id: `${s.id}-w`, label: s.label, kind: 'work', side: 'w', x: s.x, y, z: s.z })
      out.push({ id: `${s.id}-l`, label: `Lee ${s.label.toLowerCase()}`, kind: 'work', side: 'l', x: s.x, y: -y, z: s.z })
    }
  }
  return out
}

export function resolveBoat(json: BoatJson, sailModeId: string, ov: StabilityOverrides = {}): Boat {
  const xs = json.deck.outline.map((p) => p[0])
  const hb = json.deck.outline.map((p) => p[1])
  const halfbeamAt = (x: number) => lerpTable(xs, hb, x)
  const slots = buildSlots(json, halfbeamAt)
  const mode = json.sailModes.find((m) => m.id === sailModeId) ?? json.sailModes[0]
  const sails = mode.sails.map((id) => json.sails.find((s) => s.id === id)!).filter(Boolean)
  const area = sails.reduce((a, s) => a + s.area, 0)
  const zce = sails.reduce((a, s) => a + s.area * s.ce, 0) / area
  const disp = json.hull.dispSailing
  const { rig } = json
  return {
    json,
    disp,
    gm: ov.gm ?? gmFromRm1(json.stability.rm1, disp),
    avs: (ov.avsDeg ?? json.stability.avsDeg) * DEG,
    n: ov.n ?? json.stability.n,
    zG: json.stability.zG,
    zCrew0: json.stability.zCrew0,
    draft: json.hull.draft,
    halfbeamAt,
    slots,
    slotById: Object.fromEntries(slots.map((s) => [s.id, s])),
    sails,
    area,
    zce,
    frac: rig.IG / (rig.P + rig.BAS),
    // ORC eq 5.42: effective span = geometric span × 1.1 (eff_span_corr) × kheff(AWA) — kheff applied in aero.sailCoeffs
    hEff: 1.1 * (rig.P + rig.BAS + json.hull.freeboard),
    chScale: ov.chScale ?? 1,
    polar: json.polar,
  }
}

/** Bilinear interpolation of boat speed (kn) from the polar table; clamps outside the grid. */
export function boatSpeed(polar: { tws: number[]; twa: number[]; bsp: number[][] }, tws: number, twa: number): number {
  const rows = polar.tws.map((_, i) => lerpTable(polar.twa, polar.bsp[i], twa))
  return lerpTable(polar.tws, rows, tws)
}
