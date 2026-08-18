export interface SailDef {
  id: string
  name: string
  type: 'main' | 'jib' | 'code0' | 'spinnaker'
  area: number // m²
  ce: number // height of centre of effort above waterline, m
  awa: number[] // deg, ascending
  cl: number[]
  cd: number[] // parasitic drag coefficient
  kpp?: number // ORC quadratic parasite drag constant (default 0.016)
}

export interface SailMode {
  id: string
  label: string
  sails: string[]
  twa: [number, number]
}

export interface Polar {
  tws: number[]
  twa: number[]
  bsp: number[][] // [twsIdx][twaIdx] knots
}

export interface SlotDef {
  id: string
  label: string
  x: number
  y?: number
  yFrac?: number // fraction of local half-beam
  z: number
  side: 'both' | 'centre'
}

export interface BoatJson {
  name: string
  hull: {
    loa: number; lwl: number; beam: number; draft: number
    dispSailing: number; ballast: number; freeboard: number
    section: [number, number][]
    keel: { rootZ: number; tipZ: number; chordRoot: number; chordTip: number; bulbLength: number; bulbHeight: number }
  }
  stability: { rm1: number; avsDeg: number; n: number; zG: number; zCrew0: number }
  rig: { P: number; E: number; IG: number; J: number; BAS: number; ISP: number; SPL: number; mastX: number }
  deck: {
    outline: [number, number][]
    cockpit: { from: number; to: number; halfWidth: number }
    coachroof: { from: number; to: number; halfWidth: number }
    rail: { fromMast: number; count: number; spacing: number; inset: number; z: number }
    slots: SlotDef[]
  }
  sails: SailDef[]
  sailModes: SailMode[]
  targets?: { upwind: Targets; downwind: Targets }
  polar: Polar
}

export interface Targets { tws: number[]; twa: number[]; bsp: number[]; bspProvisional?: boolean }

/** A concrete place a crew member can occupy. y > 0 = windward. */
export interface Slot {
  id: string
  label: string
  kind: 'rail' | 'work' | 'centre'
  side: 'w' | 'l' | 'c'
  x: number
  y: number
  z: number
}

export type Posture = 'sit' | 'legs' | 'hike'
export const POSTURE_OFFSET: Record<Posture, number> = { sit: 0, legs: 0.2, hike: 0.4 }
export const POSTURE_LABEL: Record<Posture, string> = { sit: 'Sitting', legs: 'Legs over', hike: 'Full hike' }

export interface CrewPoint { id: number; name: string; m: number; y: number; z: number }

export interface StabilityOverrides { gm?: number; avsDeg?: number; n?: number; chScale?: number }

/** Resolved, ready-to-compute boat. */
export interface Boat {
  json: BoatJson
  disp: number // sailing displacement without crew, kg
  gm: number
  avs: number // rad
  n: number
  zG: number
  zCrew0: number // ORC default-crew reference height (crew already inside disp/RM1)
  draft: number
  halfbeamAt: (x: number) => number
  slots: Slot[]
  slotById: Record<string, Slot>
  sails: SailDef[] // active for the selected mode
  area: number // total active sail area
  zce: number // area-weighted CE height above WL at full power
  frac: number // IG/(P+BAS) for twist function
  hEff: number // effective rig span for induced drag
  chScale: number
  targets?: { upwind: Targets; downwind: Targets }
  polar: Polar
}

export interface Targets { tws: number[]; twa: number[]; bsp: number[]; bspProvisional?: boolean }

export const G = 9.81
export const RHO_AIR = 1.225
export const KN = 0.514444 // m/s per knot
export const DEG = Math.PI / 180
