import type { State } from '../state'
import { presets } from '../state'

export interface LessonStep {
  title: string
  body: string[]
  /** State changes applied when the step is entered. */
  patch: (s: State) => Partial<State>
}

const form = (s: State, name: keyof typeof presets) => s.crew.map((c, i) => ({ ...c, ...presets[name](i) }))

export const LESSONS: LessonStep[] = [
  {
    title: 'The boat on its own',
    body: [
      'Everyone below. Heel the boat and the keel and hull push back with a righting moment: RM = Δ·g·GZ. The navy curve on the moment chart is the boat\'s own righting moment against heel angle — steep at first (that slope is GM), peaking around 55–60°.',
      'On this Xp 44 the ORC certificate gives RM ≈ 260 kg·m per degree of heel near upright, so GM ≈ 1.5 m.',
    ],
    patch: (s) => ({ tws: 10, twa: 40, flat: 1, autoTrim: false, zPenalty: true, sailMode: 'upwind', crew: form(s, 'All below') }),
  },
  {
    title: 'Wind pushes, the boat settles',
    body: [
      'The red curve is the heeling moment: sail force × the arm from centre of effort down to the keel (about 10 m). It falls as the boat heels because the sails present less area to the wind (cos²φ).',
      'Where red meets amber is the equilibrium — the heel angle you actually sail at. Drag the wind slider: more wind lifts the red curve and the crossing slides to the right.',
    ],
    patch: () => ({ tws: 12 }),
  },
  {
    title: 'Now put the crew on the rail',
    body: [
      'Ten people at ~85 kg is 850 kg — nearly 9% of the boat\'s displacement. Sitting them on the windward rail ~1.8 m off centreline adds their own righting moment: each person contributes m·g·y·cosφ.',
      'Watch the amber band open up between the hull curve and the total, the equilibrium point drop several degrees, and G slide to windward in the stern view.',
    ],
    patch: (s) => ({ crew: form(s, 'Racing: rail sitting') }),
  },
  {
    title: 'Hike out — the lever arm is everything',
    body: [
      'Legs over the lifelines moves each person\'s centre of gravity another ~0.2 m outboard; a full legal hike (torso outside the upper lifeline, waist inside the lower — RRS 49.2) another ~0.4 m. That is +20% on the arm for free.',
      'Tap a rail crew member twice on the deck plan to cycle sitting → legs over → full hike, or use the crew table.',
    ],
    patch: (s) => ({ crew: form(s, 'Racing: rail hiking') }),
  },
  {
    title: 'Why height costs you as you heel',
    body: [
      'Crew sit ~1.4 m above the boat\'s centre of gravity. As the boat heels that height swings to leeward: the term −(z − z_G)·sinφ. At 20° it eats a quarter of the gain; the crew stop helping altogether around 55°.',
      'Toggle the crew height term off to see the simpler ORC-style figure (arm only). Also try the leeward-rail preset: in drifting conditions weight to leeward heels the boat to shape the sails — the same physics, opposite sign.',
    ],
    patch: () => ({ tws: 14 }),
  },
  {
    title: 'Hiking is free wind',
    body: [
      'The wind sweep chart answers the practical question: at what true wind speed does this formation reach a given heel? Compare the amber line (this formation) with the grey (everyone inboard).',
      'The gap at your target heel is the "free wind": with everyone hiking hard the boat carries roughly 2–3 kn more breeze before it is heeled the same amount.',
    ],
    patch: () => ({ tws: 16, targetHeel: 20 }),
  },
  {
    title: 'Or: hike, and the trimmers give you power',
    body: [
      'In practice you don\'t sail at 30° — the trimmers depower (flatten, twist, traveller down) to hold ~20°. Switch on "trimmers hold a target heel". Now the payoff of hiking shows up as sail power (flat) and drive force rather than heel angle.',
      'Move crew off the rail and watch the required depower and the drive force fall. That drive is boat speed.',
    ],
    patch: () => ({ autoTrim: true, targetHeel: 20, tws: 16 }),
  },
  {
    title: 'Reaching, and the fine print',
    body: [
      'Ease to a reach: the apparent wind goes aft, C_H drops and the heeling arm changes, so hiking matters less than upwind — until you hoist a Code 0.',
      'Fine print: ORC crew weight is declared and rated — extra bodies on the rail change your rating; RRS 49 sets the posture limits; and this is a static model (no gusts, waves or dynamics). Now play — everything stays live.',
    ],
    patch: () => ({ twa: 75, tws: 14, autoTrim: false, flat: 1 }),
  },
]
