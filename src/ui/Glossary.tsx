/** Every symbol, unit and acronym used in the app, in one place. */
const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Moments & stability',
    items: [
      ['RM (righting moment)', 'The turning effect that stands the boat back up, in kN·m. Hull + keel part = Δ·g·GZ; crew part = their weight × lever arm.'],
      ['HM (heeling moment)', 'The turning effect of the wind on the sails trying to lay the boat over, in kN·m. HM = ½ρV²·A·C_H·h·cos²φ.'],
      ['φ (phi) — heel angle', 'How far the boat is leaning, degrees. Positive to leeward. The boat settles where RM = HM (equilibrium).'],
      ['GZ — righting arm', 'Horizontal distance (m) between the weight acting down through G and the buoyancy acting up through B. RM = Δ·g·GZ.'],
      ['GM — metacentric height', 'Initial stiffness: GZ ≈ GM·sin φ at small angles. Xp 44 ≈ 1.5 m (from the ORC certificate’s RM at 1°).'],
      ['G, B', 'G = centre of gravity of boat + crew; B = centre of buoyancy (centre of the underwater volume). Heeling moves B to leeward; that gap is GZ.'],
      ['Δ (delta) — displacement', 'Mass of the boat in sailing trim, kg (9 750 kg incl. the ORC default crew on the centreline). Δ·g is its weight in newtons.'],
      ['AVS / LPS', 'Angle (Limit) of Vanishing Stability: heel beyond which the boat no longer rights itself (~124° for this Xp 44).'],
      ['RM at 1°', 'ORC certificate figure: righting moment per degree of heel near upright, kg·m/°. Sets GM.'],
      ['y — lever arm', 'Sideways distance (m) of a crew member from the centreline; + = windward. Their moment ∝ y·cos φ.'],
      ['z, z₀', 'Height above the waterline (m). z₀ = 0.98 m is where the ORC certificate already assumes the crew; extra height costs (z − z₀)·sin φ.'],
      ['Overpowered', 'HM exceeds the maximum RM at any angle — no static equilibrium; the boat keeps heeling until something changes (reef, ease, round up).'],
    ],
  },
  {
    title: 'Wind & sails',
    items: [
      ['TWS / TWA', 'True wind speed (kn) and true wind angle (° off the bow) — the wind over the water.'],
      ['AWS / AWA (β)', 'Apparent wind speed and angle — what the sails feel: true wind plus the boat’s own speed. β is the AWA in the equations.'],
      ['VMG', 'Velocity made good towards the wind (or away from it). The target card lists the TWA that maximises it.'],
      ['Target card', 'The cockpit table of target boat speed and TWA per TWS. "Sail the target angle" locks TWA to it.'],
      ['Polar', 'Table of boat speed vs TWS and TWA (seed values here; replace with your ORC polar).'],
      ['C_L, C_D', 'Lift and drag coefficients of the sail plan at the current AWA (ORC-style tables). Dimensionless.'],
      ['C_H, C_R', 'Heeling and driving coefficients: C_H = C_L cos β + C_D sin β (side force), C_R = C_L sin β − C_D cos β (forward force).'],
      ['F_H — heeling force', 'Side force on the sails, kN. Multiply by the arm h to get HM.'],
      ['Drive force', 'Forward force from the sails, kN — the payoff of carrying more power at the same heel.'],
      ['flat (sail power)', 'ORC depower factor 0.42–1.0: 1 = full power, lower = flatter/twisted sails. "Trimmers hold a target heel" solves for it.'],
      ['CE, CLR, h', 'Centre of effort of the sails (~9 m up) and centre of lateral resistance of the keel (~1 m down); h = CE-to-CLR arm (~10 m).'],
      ['A — sail area', 'Total area of the sails set, m² (main 66 + J1 48).'],
      ['J1…J4, reef', 'Headsails from largest (J1, 106 %) to smallest (J4); reef 1/2 = mainsail reduced. "Auto" picks the biggest set that holds the target heel.'],
      ['Code 0', 'Large light-air reaching sail on the sprit.'],
      ['ρ (rho)', 'Air density, 1.225 kg/m³.'],
    ],
  },
  {
    title: 'Crew & rules',
    items: [
      ['Sitting / legs over / full hike', 'Rail postures: bum on the side deck; legs over the lifelines; torso outside the upper lifeline. Each step is +0.2 m of lever arm.'],
      ['RRS 49', 'Racing Rule 49: no hiking devices except straps; torso inside the lifelines except briefly — unless sitting facing outboard with waist inside the lower lifeline (that is the legal "full hike").'],
      ['ORC', 'Offshore Racing Congress — the rating system whose VPP and certificates supply the boat’s stability and sail data used here.'],
      ['Free wind', 'Extra true wind (kn) this formation can carry at the target heel compared with everyone sitting inboard on the centreline.'],
      ['Formation A / B', 'Pin the current setup as A, change things, and the app compares A → B.'],
    ],
  },
  {
    title: 'Puff & dynamics',
    items: [
      ['Puff', 'A gust: ramps up over 1.5 s, holds 5 s, dies over 2.5 s. Sails and trim are held; the optional comparison moves the crew from the cockpit to their positions after a reaction time.'],
      ['Roll period', 'Natural time for one roll oscillation (~4 s here). The boat overshoots the new steady heel because it cannot respond instantly.'],
      ['Overshoot', 'Peak heel in the puff minus the steady heel at the puff wind.'],
      ['ζ (zeta)', 'Damping ratio of the roll (0.35): keel, hull and sails resist the rolling motion.'],
    ],
  },
  {
    title: 'Units',
    items: [
      ['kn', 'Knots — nautical miles per hour (1 kn = 0.514 m/s).'],
      ['kN, kN·m', 'Kilonewtons (force, ≈ 102 kg-force) and kilonewton-metres (moment). 10 kN·m ≈ 1 tonne pushing at 1 m.'],
      ['m, °, kg', 'Metres, degrees, kilograms.'],
    ],
  },
]

export default function Glossary() {
  return (
    <details>
      <summary>Glossary — every symbol, unit and acronym on this page</summary>
      <div className="gloss">
        {GROUPS.map((g) => (
          <div key={g.title} className="gloss-group">
            <h3>{g.title}</h3>
            <dl>
              {g.items.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>
  )
}
