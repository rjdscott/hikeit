import type { Posture, Slot } from './physics/types'
import xp44 from './data/xp44.json'

export interface Crew { id: number; name: string; kg: number; slot: string; posture: Posture }

export interface State {
  tws: number
  twa: number
  flat: number
  autoTrim: boolean
  targetHeel: number // deg
  targetAngle: boolean // TWA follows the boat's target-speed card for the current TWS
  sailMode: string
  crew: Crew[]
  prevCrew: Crew[] | null // ghost formation for comparison
  zPenalty: boolean
  overrides: { gm?: number; avsDeg?: number; n?: number; chScale?: number }
  lessonStep: number | null
}

export type Action =
  | { type: 'patch'; patch: Partial<State> }
  | { type: 'moveCrew'; id: number; slot: string }
  | { type: 'setCrew'; id: number; patch: Partial<Crew> }
  | { type: 'preset'; name: PresetName }
  | { type: 'railPosture'; posture: Posture; railSlots: Set<string> }
  | { type: 'lesson'; step: number | null; patch?: Partial<State> }
  | { type: 'reset' }

export const CREW_N = 10

export const defaultCrew = (): Crew[] =>
  Array.from({ length: CREW_N }, (_, i) => ({ id: i, name: `Crew ${i + 1}`, kg: 85, slot: 'below', posture: 'sit' }))

/** Presets return the slot id for crew index i (posture optional). */
export const presets = {
  'Racing: rail hiking': (i: number) => ({ slot: i < 8 ? `rail-w-${i}` : i === 8 ? 'helm-w' : 'trim-w', posture: 'hike' as Posture }),
  'Racing: rail sitting': (i: number) => ({ slot: i < 8 ? `rail-w-${i}` : i === 8 ? 'helm-w' : 'trim-w', posture: 'sit' as Posture }),
  'Cruising: cockpit': (i: number) => ({ slot: ['helm-w', 'trim-w', 'pit-w', 'helm-l', 'trim-l', 'pit-l', 'below', 'below', 'below', 'below'][i], posture: 'sit' as Posture }),
  'All below': () => ({ slot: 'below', posture: 'sit' as Posture }),
  'Light air: leeward': (i: number) => ({ slot: i < 8 ? `rail-l-${i}` : i === 8 ? 'helm-w' : 'trim-l', posture: 'sit' as Posture }),
}
export type PresetName = keyof typeof presets

export const initialState = (): State => ({
  tws: 10,
  twa: 40,
  flat: 1,
  autoTrim: false,
  targetHeel: 20,
  targetAngle: true,
  sailMode: 'auto',
  crew: defaultCrew().map((c, i) => ({ ...c, ...presets['Racing: rail sitting'](i) })),
  prevCrew: null,
  zPenalty: true,
  overrides: {},
  lessonStep: null,
})

/** Slots that can hold more than one person. */
export const MULTI = new Set(['below', 'bow'])

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'patch':
      return { ...s, ...a.patch }
    case 'moveCrew': {
      const mover = s.crew.find((c) => c.id === a.id)
      if (!mover || mover.slot === a.slot) return s
      const occupant = MULTI.has(a.slot) ? undefined : s.crew.find((c) => c.slot === a.slot)
      const crew = s.crew.map((c) =>
        c.id === a.id ? { ...c, slot: a.slot } : occupant && c.id === occupant.id ? { ...c, slot: mover.slot } : c,
      )
      return { ...s, crew, prevCrew: s.crew }
    }
    case 'setCrew':
      return { ...s, crew: s.crew.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)) }
    case 'railPosture':
      return { ...s, prevCrew: s.crew, crew: s.crew.map((c) => (a.railSlots.has(c.slot) ? { ...c, posture: a.posture } : c)) }
    case 'preset':
      return { ...s, prevCrew: s.crew, crew: s.crew.map((c, i) => ({ ...c, ...presets[a.name](i) })) }
    case 'lesson':
      return { ...s, ...(a.patch ?? {}), lessonStep: a.step, prevCrew: a.patch?.crew ? s.crew : s.prevCrew }
    case 'reset':
      return { ...initialState(), crew: initialState().crew.map((c, i) => ({ ...c, name: s.crew[i]?.name ?? c.name, kg: s.crew[i]?.kg ?? c.kg })) }
  }
}

// ---- persistence: URL hash (shareable scenario) + localStorage (names/weights) ----
const LS_KEY = 'hikeit.v1'
const POST: Posture[] = ['sit', 'legs', 'hike']

export function encodeHash(s: State): string {
  const crew = s.crew.map((c) => `${c.slot}.${POST.indexOf(c.posture)}`).join(',')
  const p = new URLSearchParams({
    tws: String(s.tws), twa: String(s.twa), flat: s.flat.toFixed(2), at: s.autoTrim ? '1' : '0', th: String(s.targetHeel),
    sm: s.sailMode, z: s.zPenalty ? '1' : '0', ta: s.targetAngle ? '1' : '0', crew,
  })
  if (s.lessonStep !== null) p.set('step', String(s.lessonStep))
  return '#' + p.toString()
}

export function decodeHash(hash: string, base: State, validSlots: Record<string, Slot>): State {
  if (!hash || hash.length < 2) return base
  const p = new URLSearchParams(hash.slice(1))
  const num = (k: string, d: number, lo: number, hi: number) => {
    const v = Number(p.get(k)); return Number.isFinite(v) && p.has(k) ? Math.min(hi, Math.max(lo, v)) : d
  }
  const s: State = {
    ...base,
    tws: num('tws', base.tws, 0, 40), twa: num('twa', base.twa, 30, 180), flat: num('flat', base.flat, 0.42, 1),
    autoTrim: p.has('at') ? p.get('at') === '1' : base.autoTrim, targetHeel: num('th', base.targetHeel, 0, 45),
    sailMode: p.get('sm') === 'auto' || xp44.sailModes.some((m) => m.id === p.get('sm')) ? p.get('sm')! : base.sailMode,
    zPenalty: p.has('z') ? p.get('z') !== '0' : base.zPenalty,
    targetAngle: p.has('ta') ? p.get('ta') === '1' : base.targetAngle,
    lessonStep: p.has('step') ? num('step', 0, 0, 20) : null,
  }
  const crewStr = p.get('crew')
  if (crewStr) {
    const parts = crewStr.split(',')
    s.crew = base.crew.map((c, i) => {
      const [slot, po] = (parts[i] ?? '').split('.')
      return validSlots[slot] ? { ...c, slot, posture: POST[Number(po)] ?? 'sit' } : c
    })
  }
  return s
}

export function loadLocal(base: State): State {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return base
    const d = JSON.parse(raw) as { crew?: { name?: unknown; kg?: unknown }[] }
    return {
      ...base,
      crew: base.crew.map((c, i) => {
        const n = d.crew?.[i]?.name, k = d.crew?.[i]?.kg
        return {
          ...c,
          name: typeof n === 'string' && n.trim() ? n.slice(0, 40) : c.name,
          kg: typeof k === 'number' && Number.isFinite(k) ? Math.min(150, Math.max(40, Math.round(k))) : c.kg,
        }
      }),
    }
  } catch { return base }
}

export function clearLocal() { try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ } }

export function saveLocal(s: State) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ crew: s.crew.map((c) => ({ name: c.name, kg: c.kg })) })) } catch { /* ignore */ }
}
