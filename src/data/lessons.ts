import type { State } from '../state'
import { presets } from '../state'
import type { Derived } from '../model'

export interface Quiz {
  question: string
  unit: string
  min: number
  max: number
  step: number
  /** Correct answer from the state before and after this step's patch. */
  answer: (before: Derived, after: Derived) => number
  explain: (before: Derived, after: Derived) => string
}

export interface LessonStep {
  title: string
  body: string[]
  /** State changes applied when the step is entered. */
  patch: (s: State) => Partial<State>
  /** Optional predict-then-reveal question asked before the patch is applied. */
  quiz?: Quiz
}

const form = (s: State, name: keyof typeof presets) => s.crew.map((c, i) => ({ ...c, ...presets[name](i) }))

export const LESSONS: LessonStep[] = [
  {
    title: 'The boat on its own',
    body: [
      'Everyone below. Heel the boat and the keel and hull push back with a righting moment: RM = Δ·g·GZ. The navy curve on the moment chart is the boat\'s own righting moment against heel angle — steep at first (that slope is GM), peaking around 55–60°.',
      'On this Xp 44 the ORC certificate gives RM ≈ 260 kg·m per degree of heel near upright, so GM ≈ 1.5 m. Note the certificate already counts the crew\'s weight — on the centreline, about 1 m up. Where they sit is what we can change.',
    ],
    patch: (s) => ({ tws: 10, twa: 40, flat: 1, autoTrim: false, zPenalty: true, sailMode: 'j1', targetAngle: true, crew: form(s, 'All below') }),
  },
  {
    title: 'Wind pushes, the boat settles',
    body: [
      'The red curve is the heeling moment: sail force × the arm from centre of effort down to the keel (about 10 m). It falls as the boat heels because the sails present less area to the wind (cos²φ).',
      'Where red meets amber is the equilibrium — the heel angle the boat settles at with the sails sheeted at full power (no depowering yet). Drag the wind slider: more wind lifts the red curve and the crossing slides to the right.',
    ],
    patch: () => ({ tws: 10 }),
  },
  {
    title: 'Now put the crew on the rail',
    body: [
      'Ten people at ~85 kg is 850 kg — nearly 9% of the boat\'s displacement. Sitting them on the windward side deck, ~1.8 m off the centreline, adds their own righting moment: each person contributes m·g·y·cosφ, so the whole rail is worth roughly 11–12 kN·m here — a fifth to a quarter of what the hull and keel provide.',
      'Watch the amber band open up between the hull curve and the total, the equilibrium heel drop by a few degrees (your reveal above has the exact number), and G slide to windward in the stern view.',
    ],
    patch: (s) => ({ crew: form(s, 'Racing: rail sitting') }),
    quiz: {
      question: 'Everyone comes up from below and sits on the windward rail (helm and trimmer to their spots). How many degrees less heel?',
      unit: '°', min: 0, max: 12, step: 0.5,
      answer: (b, a) => b.phiDeg - a.phiDeg,
      explain: (b, a) => `${b.phiDeg.toFixed(1)}° → ${a.phiDeg.toFixed(1)}°: 850 kg at ~1.8 m adds ${(a.rmCrewEq / 1e3).toFixed(1)} kN·m of righting moment — about ${Math.round((100 * a.rmCrewEq) / a.rmHullEq)}% of what the hull and keel give.`,
    },
  },
  {
    title: 'Hike out — the lever arm is everything',
    body: [
      'Legs over the lifelines moves each person\'s centre of gravity ~0.2 m outboard of sitting; a full legal hike (sitting facing out, waist inside the lower lifeline, upper body outside the upper one — RRS 49.2) is ~0.4 m outboard of sitting. That is roughly a fifth more lever arm for the same people — the exact numbers are in the "Sitting vs hiking" panel.',
      'The "Sitting vs hiking" panel below shows what that buys in moment, heel and wind. Tap a selected windward-rail crew member on the deck plan to cycle sitting → legs over → full hike, or use the crew table.',
    ],
    patch: (s) => ({ crew: form(s, 'Racing: rail hiking') }),
    quiz: {
      question: 'Same people, same wind: they go from sitting to a full legal hike (+0.4 m each). How much more crew righting moment, in kN·m?',
      unit: 'kN·m', min: 0, max: 8, step: 0.25,
      answer: (b, a) => (a.rmCrewEq - b.rmCrewEq) / 1e3,
      explain: (b, a) => `${(b.rmCrewEq / 1e3).toFixed(1)} → ${(a.rmCrewEq / 1e3).toFixed(1)} kN·m (+${Math.round((100 * (a.rmCrewEq - b.rmCrewEq)) / b.rmCrewEq)}%). Heel ${b.phiDeg.toFixed(1)}° → ${a.phiDeg.toFixed(1)}°. Nobody got heavier — the arm did.`,
    },
  },
  {
    title: 'Height costs a little as you heel',
    body: [
      'A rail crew\'s centre of gravity sits ~0.4 m higher than where the certificate already assumes them. As the boat heels that extra height swings to leeward: the term −(z − z₀)·sinφ. At 20° it costs under 10% of the gain; the crew would only stop helping around 75–80° — well past anything you sail at. Going below actually adds a touch, because the bunks are lower than the reference.',
      'Toggle the crew height term off to see the pure lever-arm figure. Then try the leeward-rail preset: in drifting conditions weight to leeward heels the boat to shape the sails — the same physics, opposite sign.',
    ],
    patch: () => ({ tws: 12 }),
  },
  {
    title: 'Hiking is free wind',
    body: [
      'The wind sweep chart answers the practical question: at what true wind speed does this formation reach a given heel? Compare the amber line (this formation) with the grey (everyone inboard).',
      'The gap at your target heel is the "free wind": with everyone hiking hard the boat carries about 2 kn more breeze before it is heeled the same amount as with the crew inboard — and each person who goes below gives back roughly 0.4°.',
    ],
    patch: () => ({ tws: 14, targetHeel: 20 }),
    quiz: {
      question: 'At 20° of heel, how many more knots of true wind can this hiking crew carry compared with everyone sitting inboard on the centreline?',
      unit: 'kn', min: 0, max: 6, step: 0.25,
      answer: (_b, a) => a.freeWind ?? 0,
      explain: (_b, a) => `Free wind ≈ ${(a.freeWind ?? 0).toFixed(1)} kn: the amber curve reaches 20° at ${(a.freeWind ?? 0).toFixed(1)} kn more breeze than the grey one. Every body that goes below hands back roughly 0.4°.`,
    },
  },
  {
    title: 'Or: hike, and the trimmers give you power',
    body: [
      'In practice you don\'t sail at 30° — the trimmers depower (flatten, twist, traveller down) to hold ~20°. Switch on "trimmers hold a target heel". Now the payoff of hiking shows up as sail power (flat) and drive force rather than heel angle.',
      'Move crew off the rail and watch the required depower and the drive force fall — hiking hard vs everyone inboard is worth roughly 15–20% more drive at the same heel. That drive is boat speed.',
    ],
    patch: () => ({ autoTrim: true, targetHeel: 20, tws: 14 }),
  },
  {
    title: 'The puff — why you hike before it hits',
    body: [
      'A gust does not just move you to a new steady heel — the boat rolls past it. The keel and hull are heavy and slow (roll period about 4 s), so the heeling moment wins for a couple of seconds before the righting moment catches up: several degrees of overshoot, right when the helm loads up.',
      'Press Puff! in the panel below and watch the stern view and the heel trace. Then pin this formation as A, send two people below, and puff again: the crew that was already out has margin; the crew that reacts after the puff is already at the rail rounding up.',
    ],
    patch: (s) => ({ tws: 12, autoTrim: false, flat: 0.85, crew: form(s, 'Racing: rail hiking') }),
  },
  {
    title: 'Reaching, and the fine print',
    body: [
      'Ease to a reach: the apparent wind goes aft and C_H falls, so the boat stands up — but each body on the rail is still worth about half a degree, sometimes more, because you are now on the stiff, low-heel part of the GZ curve where degrees are cheap. What changes is the payoff: reaching, drive comes from C_R and boat speed, not from holding heel. Hoist the Code 0 and the loads come straight back.',
      'Fine print: ORC crew weight is declared and rated — extra bodies on the rail change your rating; RRS 49 sets the posture limits; and this is a static model (no gusts, waves or dynamics). Now play — everything stays live.',
    ],
    patch: () => ({ twa: 75, tws: 14, autoTrim: false, flat: 1, targetAngle: false }),
  },
]

/** Cumulative patch: fold every step up to and including `step`, so jumping straight to a step lands on its scenario. */
export const lessonStateAt = (s: State, step: number): Partial<State> =>
  LESSONS.slice(0, step + 1).reduce<State>((acc, l) => ({ ...acc, ...l.patch(acc) }), s)
