import type { Activity } from '../../types'
import { f, gear, random } from './kit'
import type { World } from './world'

// Rust Belt: a graveyard of machines at dusk. A colossal robot sits slumped and dead across the left third, its head
// lolling, one huge hand lying open in its lap; car cubes and junk heaps all around, another giant's hand reaching out
// of the scrap on the far right. Claude is a scavenger at a desk built from scrap, typing on a monitor made from a
// small robot's head. When a command runs the giant's eye flickers on and its hand creaks up and back down; an error
// brings the junk pile beside the desk down; done gets a slow nod and a warm eye before it sleeps again.
const RUST = '#c8693a'
const RUST_D = '#8a4325'
const IRON = '#24160f'
const IRON_D = '#140c08'
const EDGE = '#4e3a2c'
const PATINA = '#3f8f80'
const DARK = '#080504'
const RIM = '#d98048'

type P = [number, number]
type Kind = 'tire' | 'gear' | 'pipe' | 'sheet' | 'barrel' | 'rim' | 'beam'
const KINDS: readonly Kind[] = ['tire', 'gear', 'pipe', 'sheet', 'barrel', 'rim', 'beam']

/** One piece of junk centered on its own origin, painted by the group around it (`paint`). */
function piece(kind: Kind): string {
  switch (kind) {
    case 'tire':
      return '<circle r="22" fill="none" stroke="currentColor" stroke-width="13"/><circle r="28.5" fill="none"/>'
    case 'gear':
      // The teeth are a dashed ring.
      return '<circle r="21" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="6 5"/><circle r="17"/><circle r="5" fill="#080504"/>'
    case 'pipe':
      return '<rect x="-46" y="-7" width="92" height="14" rx="7"/>'
    case 'sheet':
      return '<path d="M-40 -16L34 -22L42 14L-34 20Z"/><path d="M-24 -17L-18 18M0 -19L6 17M20 -21L26 15"/>'
    case 'barrel':
      return '<rect x="-17" y="-23" width="34" height="46" rx="4"/><path d="M-17 -8H17M-17 8H17"/>'
    case 'rim':
      return '<circle r="19"/><circle r="8" fill="none"/><path d="M0 -19V-8M0 8V19M-19 0H-8M8 0H19"/>'
    case 'beam':
      return '<path d="M-58 -10H58V10H-58Z"/><path d="M-58 -5H58M-58 5H58"/>'
  }
}

/** The group attributes that paint the pieces inside it: their metal and the edge that catches the light. */
function paint(fill: string, edge: string): string {
  return `color="${fill}" fill="${fill}" stroke="${edge}" stroke-width="1.4"`
}

/** A heap of junk: a lumpy mound with pieces sticking out of its slopes. */
function heap(next: () => number, x0: number, x1: number, base: number, peak: number, count: number, fill: string, pieceFill: string, edge: string): string {
  const top = (t: number): number => base - peak * Math.pow(Math.sin(Math.PI * t), 0.7)
  let d = `M${x0} ${base}`

  for (let i = 1; i < 16; i += 1) {
    const t = i / 16

    d += `L${f(x0 + (x1 - x0) * t)} ${f(base - (base - top(t)) * (0.82 + next() * 0.3))}`
  }

  let out = `<path d="${d}L${x1} ${base}Z" fill="${fill}"/><g ${paint(pieceFill, edge)}>`

  for (let i = 0; i < count; i += 1) {
    const t = 0.05 + next() * 0.9
    const y = top(t) + 8 + next() * (base - top(t)) * 0.5
    const kind = KINDS[Math.floor(next() * KINDS.length)] ?? 'tire'

    out += `<g transform="translate(${f(x0 + (x1 - x0) * t)} ${f(y)}) rotate(${f(next() * 360)}) scale(${f(0.6 + next() * 0.8)})">${piece(kind)}</g>`
  }

  return `${out}</g>`
}

/** A ragged skyline of scrap with girders sticking out of it. */
function ridge(next: () => number, base: number, amp: number, fill: string, spikes: number): string {
  let d = `M-40 ${base + 500}V${base}`

  for (let x = -40; x <= 1640; x += 26 + next() * 34) {
    const y = base - amp * (0.25 + next() * 0.75)

    d += `L${f(x)} ${f(y)}`

    if (next() < spikes) {
      const h = 18 + next() * 54
      const lean = (next() - 0.5) * 24

      d += `L${f(x + lean)} ${f(y - h)}L${f(x + lean + 5)} ${f(y - h)}L${f(x + 6)} ${f(y)}`
    }
  }

  return `<path d="${d}L1640 ${base}V${base + 500}Z" fill="${fill}"/>`
}

/** A crushed car, pressed into a block: creases, a dusk-lit top edge, a rust bloom. */
function cube(next: () => number, x: number, y: number, w: number, h: number, tilt: number, paint: string): string {
  const creases = [0.2, 0.42, 0.63, 0.84]
    .map(at => {
      const yy = h * at

      return `M0 ${f(yy + (next() - 0.5) * 6)}L${f(w * 0.32)} ${f(yy + (next() - 0.5) * 12)}L${f(w * 0.66)} ${f(yy + (next() - 0.5) * 12)}L${w} ${f(yy + (next() - 0.5) * 8)}`
    })
    .join('')

  return (
    `<g transform="translate(${x} ${y}) rotate(${tilt})"><rect width="${w}" height="${h}" rx="3" fill="${paint}" stroke="#0a0605" stroke-width="2"/>` +
    `<path d="${creases}" fill="none" stroke="#0a0605" stroke-opacity=".75" stroke-width="3"/>` +
    `<path d="M3 2H${w - 3}" stroke="#8a5434" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M${f(w * 0.18)} ${f(h * 0.48)}q12 -9 26 0q6 11 -9 15q-15 2 -17 -15z" fill="${RUST_D}" fill-opacity=".5"/>` +
    `<rect x="${f(w * 0.62)}" y="${f(h * 0.26)}" width="${f(w * 0.2)}" height="5" rx="2" fill="#9ab0a8" fill-opacity=".14"/></g>`
  )
}

/** A thick finger or thumb: an outline stroke, the metal over it, and a rim of dusk light. */
function digit(d: string, width: number): string {
  return (
    `<path d="${d}" fill="none" stroke="${DARK}" stroke-width="${width + 6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#2c1a12" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${RIM}" stroke-opacity=".32" stroke-width="3" stroke-linecap="round" transform="translate(-3 -4)"/>`
  )
}

/** A small crow: perched by default; on a run it takes off from the giant's head. */
function crow(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="rb-perch" style="animation-delay:${delay}s">` +
    '<path d="M-10 0Q-4 -10 6 -8L13 -10L10 -5Q9 3 -1 4L-13 8Z" fill="#050302"/>' +
    '<path class="rb-wing" d="M-2 -5Q-12 -22 -26 -18M2 -5Q10 -24 24 -22" fill="none" stroke="#050302" stroke-width="3.4" stroke-linecap="round"/></g></g>'
  )
}

/** A crow circling the sky on its own slow orbit, staying upright. */
function circling(cx: number, cy: number, r: number, secs: number, s: number, reverse: boolean): string {
  const dir = reverse ? 'animation-direction:reverse' : ''

  return (
    `<g transform="translate(${cx} ${cy})"><g class="rb-orb" style="--t:${secs}s;${dir}"><g transform="translate(${r} 0)">` +
    `<g class="rb-orbb" style="--t:${secs}s;${dir}"><g transform="scale(${s})"><path class="rb-flap" d="M-13 0Q-6 -8 0 0Q6 -8 13 0" fill="none" stroke="#060403" stroke-width="3" stroke-linecap="round"/></g></g></g></g></g>`
  )
}

/** The giant's head, drawn up from its neck at the origin. */
function giantHead(): string {
  const ear = (x: number) =>
    `<g transform="translate(${x} -108)"><circle r="34" fill="${IRON}" stroke="${EDGE}" stroke-width="4"/><circle r="15" fill="${IRON_D}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M-25 -20A32 32 0 0 1 20 -25" fill="none" stroke="${PATINA}" stroke-opacity=".55" stroke-width="5"/></g>`
  const slots = Array.from({ length: 6 }, (_, i) => `M${-46 + i * 18} -62V-32`).join('')
  const glow = (cls: string, grad: string, mid: string, core: string, wash: string) =>
    `<g class="${cls}"><circle cx="50" cy="-105" r="140" fill="url(#${grad})"/>` +
    `<rect x="-104" y="-130" width="208" height="50" rx="16" fill="${wash}" fill-opacity=".14"/>` +
    `<circle cx="50" cy="-105" r="19" fill="${mid}"/><circle cx="50" cy="-105" r="8" fill="${core}"/></g>`

  return (
    // The neck: three thick pipes and a snapped cable.
    `<g stroke="${IRON_D}" stroke-width="24" stroke-linecap="round"><path d="M-36 14L-42 -30M0 18V-30M36 14L42 -30"/></g>` +
    `<g stroke="${EDGE}" stroke-width="2"><path d="M-50 4L-55 -24M-12 8V-24M24 6L29 -24"/></g>` +
    `<g transform="translate(62 -22)"><path class="rb-cab" d="M0 0C12 30 2 54 20 82" fill="none" stroke="${IRON_D}" stroke-width="7" stroke-linecap="round"/></g>` +
    // The helmet, rim-lit by the sun behind.
    `<path d="M-128 -60V-150Q-128 -238 0 -242Q128 -238 128 -150V-60Q128 -18 84 -12H-84Q-128 -18 -128 -60Z" fill="url(#rb-iron)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M-127 -70V-150Q-127 -236 0 -240Q84 -238 112 -204" fill="none" stroke="${RIM}" stroke-opacity=".55" stroke-width="3"/>` +
    `<path d="M-18 -240L-8 -292L12 -284L8 -270L22 -264L20 -241Z" fill="${IRON}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M86 -222L106 -262L138 -270" fill="none" stroke="${IRON}" stroke-width="7" stroke-linecap="round"/>` +
    ear(-130) +
    ear(130) +
    // Rust blooms and verdigris on the dome.
    `<path d="M-98 -204q16 -12 30 0q8 14 -8 20q-18 4 -22 -20zM58 -214q12 -8 22 2q4 10 -8 12q-12 0 -14 -14z" fill="${RUST_D}" fill-opacity=".6"/>` +
    `<path d="M-30 -226q20 -6 34 4q-4 14 -20 12q-14 -4 -14 -16z" fill="${PATINA}" fill-opacity=".35"/>` +
    `<rect x="-32" y="-212" width="5" height="52" fill="url(#rb-pt)"/><rect x="66" y="-200" width="5" height="40" fill="url(#rb-st)"/>` +
    // The brow, the visor, the eyes: one smashed, one that still has something in it.
    `<path d="M-124 -160H124L114 -134H-114Z" fill="#1a100b"/><path d="M-124 -160H124" stroke="${RUST}" stroke-opacity=".45" stroke-width="2"/>` +
    `<rect x="-108" y="-134" width="216" height="58" rx="18" fill="${DARK}"/>` +
    `<circle cx="-50" cy="-105" r="23" fill="#120b08" stroke="#3a2a20" stroke-width="3"/>` +
    '<path d="M-64 -118L-50 -104L-38 -115M-50 -104L-55 -88M-50 -104L-33 -98" fill="none" stroke="#6a5444" stroke-width="1.6"/>' +
    `<circle cx="50" cy="-105" r="25" fill="#130b08" stroke="${EDGE}" stroke-width="3"/>` +
    '<path d="M37 -116Q46 -125 59 -120" fill="none" stroke="#8a6a52" stroke-opacity=".6" stroke-width="2"/>' +
    `<circle class="rb-ember" cx="50" cy="-105" r="7" fill="${RUST}"/>` +
    glow('rb-wake', 'rb-eyeT', '#8ff2e0', '#effffb', '#7ff0dc') +
    glow('rb-warm', 'rb-eyeW', '#ffc27a', '#fff2dc', '#ffb466') +
    // The mouth grille and the rust that ran down from the eyes.
    `<rect x="-62" y="-68" width="124" height="42" rx="8" fill="#120a07" stroke="${EDGE}" stroke-width="2"/><path d="${slots}" stroke="${DARK}" stroke-width="8"/>` +
    '<rect x="-80" y="-80" width="6" height="58" fill="url(#rb-st)"/><rect x="74" y="-80" width="5" height="46" fill="url(#rb-st)"/>' +
    // Crows perched on the dome.
    crow(-70, -238, 1.7, 0.2) +
    crow(40, -244, 1.45, 0.42)
  )
}

/** The giant's chest plate, around its own center: a dead core, vents, a torn hole, rivets weeping rust. */
function giantChest(next: () => number): string {
  const rivets: string[] = []
  const streaks: string[] = []

  for (let i = 0; i < 10; i += 1) {
    const x = -224 + i * 44
    const y = -166 - i * 2

    rivets.push(`M${f(x + 4)} ${f(y)}a4 4 0 1 0 -8 0a4 4 0 1 0 8 0Z`)

    if (next() < 0.6) {
      streaks.push(`<rect x="${f(x - 2)}" y="${f(y + 4)}" width="4" height="${f(40 + next() * 70)}" fill="url(#rb-st)"/>`)
    }
  }

  for (let i = 0; i < 7; i += 1) {
    const y = -150 + i * 46

    rivets.push(`M${f(-26 + i * 1.3)} ${f(y)}a3.5 3.5 0 1 0 -7 0a3.5 3.5 0 1 0 7 0Z`)
  }

  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4

    return `M${f(20 + 50 * Math.cos(a))} ${f(-40 + 50 * Math.sin(a))}L${f(20 + 66 * Math.cos(a))} ${f(-40 + 66 * Math.sin(a))}`
  }).join('')

  return (
    `<path d="M-250 -172L190 -194L262 -84L248 150L-226 188L-274 -40Z" fill="url(#rb-iron2)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M-250 -172L190 -194L262 -84" fill="none" stroke="${RIM}" stroke-opacity=".45" stroke-width="3"/>` +
    `<path d="M-132 -180L130 -192L108 -226L-112 -216Z" fill="${IRON}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M-30 -190L-20 186M-268 34L256 16" stroke="${DARK}" stroke-width="4"/>` +
    // The core: a ring of spokes around a dead lens, verdigris gone round it.
    `<circle cx="20" cy="-40" r="72" fill="#1c110c" stroke="${EDGE}" stroke-width="6"/>` +
    `<path d="${spokes}" stroke="${DARK}" stroke-width="5"/>` +
    `<circle cx="20" cy="-40" r="48" fill="#0b0705" stroke="#3a2a20" stroke-width="3"/>` +
    `<circle cx="20" cy="-40" r="60" fill="none" stroke="${PATINA}" stroke-opacity=".45" stroke-width="6" stroke-dasharray="34 20 12 26"/>` +
    '<circle class="rb-core" cx="20" cy="-40" r="56" fill="url(#rb-coreT)"/><circle class="rb-coreu" cx="20" cy="-40" r="60" fill="url(#rb-coreU)"/>' +
    // Vents on the left, a torn hole on the right with its ribs and a hanging cable.
    `<path d="M-226 -118l72 -6v13l-72 6zM-224 -84l72 -6v13l-72 6zM-222 -50l72 -6v13l-72 6zM-220 -16l72 -6v13l-72 6z" fill="${DARK}"/>` +
    `<path d="M120 50L170 30L214 56L206 112L150 122L118 92Z" fill="${DARK}" stroke="${RUST_D}" stroke-opacity=".7" stroke-width="2"/>` +
    `<path d="M136 46V116M160 36V120M184 40V118" stroke="#24160f" stroke-width="6"/>` +
    `<g transform="translate(176 110)"><path class="rb-cab" style="animation-delay:-2s" d="M0 0C-6 24 8 40 0 66" fill="none" stroke="${IRON_D}" stroke-width="6" stroke-linecap="round"/></g>` +
    // Rust and verdigris.
    `<path d="M-180 60q30 -16 56 4q10 26 -22 30q-34 2 -34 -34zM80 120q20 -10 40 4q-2 20 -24 18q-18 -4 -16 -22z" fill="${RUST_D}" fill-opacity=".55"/>` +
    `<path d="M-120 110q40 -14 66 8q-12 26 -40 22q-28 -6 -26 -30z" fill="${PATINA}" fill-opacity=".3"/>` +
    `<path d="${rivets.join('')}" fill="#0c0705" stroke="${EDGE}" stroke-width="1.2"/>` +
    streaks.join('')
  )
}

/** The giant's near arm: a pauldron on the shoulder, the upper arm down to the elbow. */
function giantShoulder(): string {
  return (
    `<path d="M368 676L442 662L470 846L400 864Z" fill="url(#rb-iron)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M372 712L448 698M380 770L456 756M390 822L464 808" stroke="${DARK}" stroke-width="6"/>` +
    `<path d="M368 676L400 864" stroke="${RIM}" stroke-opacity=".35" stroke-width="3"/>` +
    '<g transform="translate(408 618) rotate(14)">' +
    `<path d="M-98 48Q-102 -66 0 -80Q102 -66 100 48Q50 62 0 64Q-50 62 -98 48Z" fill="url(#rb-iron)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M-94 2Q0 -24 96 2M-94 28Q0 4 98 28" fill="none" stroke="${DARK}" stroke-width="5"/>` +
    `<path d="M-98 40Q-102 -66 0 -80Q60 -72 86 -40" fill="none" stroke="${RIM}" stroke-opacity=".5" stroke-width="3"/>` +
    `<path d="M-40 -60q26 -10 46 6q-6 18 -28 14q-18 -4 -18 -20z" fill="${PATINA}" fill-opacity=".38"/>` +
    `<path d="M30 10q18 -8 32 4q-2 14 -18 12q-14 -2 -14 -16z" fill="${RUST_D}" fill-opacity=".6"/>` +
    // A scavenger's rag tied to a pole stuck in the plates.
    `<path d="M40 -66L60 -190" stroke="#1a100b" stroke-width="5" stroke-linecap="round"/>` +
    '<g transform="translate(59 -186)"><path class="rb-tarp" d="M0 0L62 6L54 22L66 34L4 38Z" fill="#3a5a52" fill-opacity=".8"/></g></g>' +
    `<circle cx="434" cy="868" r="44" fill="${IRON}" stroke="${EDGE}" stroke-width="4"/><circle cx="434" cy="868" r="18" fill="${IRON_D}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M402 840A44 44 0 0 1 452 828" fill="none" stroke="${PATINA}" stroke-opacity=".5" stroke-width="5"/>`
  )
}

/** The forearm and the huge open hand, drawn around the elbow at the origin so it can lift. */
function giantHand(): string {
  // Four jointed fingers, open and a little curled, the far ones first.
  const fingers: { k: P; s: P[]; w: number }[] = [
    { k: [-290, -8], s: [[-46, -14], [-34, -26], [-14, -30]], w: 24 },
    { k: [-296, 8], s: [[-52, -6], [-38, -22], [-16, -30]], w: 25 },
    { k: [-298, 26], s: [[-50, 2], [-36, -16], [-18, -28]], w: 24 },
    { k: [-292, 44], s: [[-42, 8], [-30, -10], [-16, -24]], w: 22 },
  ]
  const joints = fingers
    .map(({ k, s }) => {
      let [x, y] = k

      return s
        .slice(0, 2)
        .map(([dx, dy]) => {
          x += dx
          y += dy

          return `M${x + 4} ${y}a4 4 0 1 0 -8 0a4 4 0 1 0 8 0Z`
        })
        .join('')
    })
    .join('')
  const crumbs = Array.from({ length: 5 }, (_, i) => `<rect class="rb-crumb" style="--dx:${(i - 2) * 6}px;animation-delay:${f(0.5 + i * 0.12)}s" x="${-330 + i * 12}" y="${-60 + (i % 2) * 14}" width="6" height="5" fill="#6a3a22"/>`).join('')

  return (
    `<path d="M12 -40L-170 -20L-174 52L8 40Z" fill="url(#rb-iron2)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M-46 -34L-50 46M-108 -27L-112 49" stroke="${DARK}" stroke-width="6"/>` +
    `<path d="M12 -40L-170 -20" stroke="${RIM}" stroke-opacity=".45" stroke-width="3"/>` +
    `<path d="M-90 0q14 -10 30 0q4 14 -10 16q-16 0 -20 -16z" fill="${RUST_D}" fill-opacity=".6"/>` +
    `<circle cx="-180" cy="16" r="30" fill="${IRON}" stroke="${EDGE}" stroke-width="3"/>` +
    digit('M-206 -18l-10 -38l-26 -16', 26) +
    `<path d="M-192 -24Q-256 -32 -296 -6L-302 54Q-254 70 -190 56Z" fill="url(#rb-iron)" stroke="${EDGE}" stroke-width="3"/>` +
    `<path d="M-200 -22Q-256 -30 -294 -6" fill="none" stroke="${RIM}" stroke-opacity=".4" stroke-width="3"/>` +
    `<path d="M-250 4q14 -8 26 2q0 14 -14 14q-12 -2 -12 -16z" fill="${PATINA}" fill-opacity=".4"/>` +
    fingers.map(({ k, s, w }) => digit(`M${k[0]} ${k[1]}${s.map(([dx, dy]) => `l${dx} ${dy}`).join('')}`, w)).join('') +
    `<path d="${joints}" fill="${DARK}"/>` +
    crumbs
  )
}

/** The far giant: a half-sunk head and a hand reaching up out of the scrap. Silhouettes, lit at the rim. */
function farGiant(): string {
  const fill = '#150c08'

  return (
    '<g transform="translate(1150 612) rotate(-9)">' +
    `<path d="M-96 0V-50Q-96 -120 0 -124Q96 -120 96 -50V0Z" fill="${fill}"/>` +
    '<path d="M-96 -50Q-96 -120 0 -124" fill="none" stroke="#a04a22" stroke-opacity=".7" stroke-width="2.6"/>' +
    '<rect x="-74" y="-80" width="148" height="30" rx="12" fill="#0a0605"/><circle cx="-32" cy="-65" r="10" fill="#1f130d"/>' +
    '<circle class="rb-bcn" cx="32" cy="-65" r="8" fill="#7ff0dc"/>' +
    `<path d="M42 -120L54 -160L74 -166" fill="none" stroke="${fill}" stroke-width="7" stroke-linecap="round"/></g>` +
    '<g transform="translate(1478 616) rotate(7)">' +
    `<path d="M-28 0L-22 -170L24 -172L32 0Z" fill="${fill}"/>` +
    `<path d="M-44 -166Q-48 -232 -12 -238L28 -236Q48 -228 44 -166Z" fill="${fill}"/>` +
    `<path d="M-32 -226L-48 -292M-12 -236L-16 -312M12 -236L18 -300M34 -222L50 -258M-42 -188L-76 -222" stroke="${fill}" stroke-width="17" stroke-linecap="round"/>` +
    '<path d="M-28 0L-22 -170M-44 -166Q-48 -232 -12 -238M-48 -292L-32 -226M-16 -312L-12 -236" fill="none" stroke="#a04a22" stroke-opacity=".6" stroke-width="2.6"/></g>'
  )
}

/** The robot-head monitor on a car battery, a rusty keyboard, a tin of bolts. Self-contained: no gradients. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 12 }, (_, i) => `<rect x="${250 + (i % 6) * 13}" y="${320 + Math.floor(i / 6) * 4}" width="9" height="2.6" fill="${light}" fill-opacity="${i % 4 === 1 ? 0.2 : 0.45}"/>`).join('')
  const sparks =
    activity === 'tool' || activity === 'run'
      ? Array.from({ length: 6 }, (_, i) => `<rect class="rb-spk" style="--dx:${-18 - i * 7}px;--dy:${-10 - (i % 3) * 12}px;animation-delay:${f(-i * 0.14)}s" x="345" y="293" width="3" height="3" fill="${i % 2 ? '#ffe2a0' : '#ffb456'}"/>`).join('')
      : ''

  return (
    // The keyboard, its wire to the battery.
    '<rect x="244" y="317" width="90" height="12" rx="2" fill="#2e231b" stroke="#4e3a2c" stroke-width="1.4"/>' +
    keys +
    '<path d="M332 323C344 326 336 312 350 304" fill="none" stroke="#0e0a08" stroke-width="3"/>' +
    // The car battery, two terminals.
    '<rect x="334" y="300" width="82" height="30" rx="3" fill="#1b1714" stroke="#3a302a" stroke-width="2"/>' +
    `<rect x="340" y="312" width="70" height="6" fill="${PATINA}" fill-opacity=".45"/>` +
    '<rect x="342" y="293" width="10" height="8" fill="#7a3420"/><rect x="398" y="293" width="10" height="8" fill="#2a2420"/>' +
    // The monitor: a small robot's head, its face the screen.
    '<path d="M394 206L400 186L414 182" fill="none" stroke="#5a4232" stroke-width="3.4" stroke-linecap="round"/>' +
    `<circle cx="414" cy="182" r="4" fill="${light}" fill-opacity=".8"/>` +
    '<circle cx="321" cy="252" r="8" fill="#2a1d15" stroke="#5a4232" stroke-width="2"/><circle cx="421" cy="252" r="8" fill="#2a1d15" stroke="#5a4232" stroke-width="2"/>' +
    '<rect x="324" y="204" width="94" height="92" rx="14" fill="#3a2a20" stroke="#6a4c38" stroke-width="2.4"/>' +
    '<rect x="330" y="206" width="82" height="9" rx="4" fill="#4a3628"/>' +
    `<path d="M398 218q8 -4 14 4q-2 10 -10 8q-6 -4 -4 -12zM330 270q8 -4 10 6q-4 8 -10 4z" fill="${RUST_D}"/>` +
    `<path d="M326 258h4v32h-4z" fill="${PATINA}" fill-opacity=".6"/>` +
    '<rect x="334" y="220" width="74" height="60" rx="8" fill="#0c0806"/>' +
    `<rect x="334" y="220" width="74" height="60" rx="8" fill="${light}" fill-opacity=".22"/>` +
    `<g stroke="${light}" stroke-width="3" stroke-linecap="round"><path d="M344 236H384M344 248H372M352 260H396M344 270H364" stroke-opacity=".85"/></g>` +
    '<path d="M396 222L388 236L398 242L392 252" fill="none" stroke="#f0e0cc" stroke-opacity=".35" stroke-width="1.4"/>' +
    '<g fill="#1a110c"><rect x="338" y="284" width="8" height="6"/><rect x="352" y="284" width="8" height="6"/><rect x="366" y="284" width="8" height="6"/><rect x="380" y="284" width="8" height="6"/><rect x="394" y="284" width="8" height="6"/></g>' +
    sparks +
    // A tin of bolts with a wrench in it.
    '<path d="M430 309H452V330H430Z" fill="#4a3e34" stroke="#6a5a4a" stroke-width="1.4"/><path d="M430 316H452M430 323H452" stroke="#2e261f" stroke-width="1.4"/>' +
    '<path d="M444 309L452 280" stroke="#6a5a4a" stroke-width="4" stroke-linecap="round"/><path d="M448 282a7 7 0 1 1 10 -6l-5 1l-2 5z" fill="#6a5a4a"/>'
  )
}

export function rustBeltWorld(): World {
  const next = random(4127)
  const clouds = Array.from({ length: 9 }, (_, i) => {
    const y = 90 + i * 40 + next() * 24
    const x = (i % 2 ? 1180 : 200) + (next() - 0.5) * 500

    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(220 + next() * 220)}" ry="${f(6 + next() * 9)}" fill="url(#rb-cl)"/>`
  }).join('')
  const motes = Array.from({ length: 14 }, (_, i) => `<circle class="rb-mote" style="animation-delay:${f(-i * 0.8)}s;animation-duration:${f(9 + next() * 6)}s" cx="${f(20 + next() * 440)}" cy="${f(380 + next() * 420)}" r="${f(1.3 + next() * 1.8)}" fill="#e09a62"/>`).join('')
  const gusts = Array.from({ length: 6 }, (_, i) => `<ellipse class="rb-gust" style="animation-delay:${f(-i * 0.55)}s" cx="-180" cy="${f(850 + next() * 120)}" rx="${f(90 + next() * 90)}" ry="3" fill="#a0683e" fill-opacity=".16"/>`).join('')
  const midLeft = heap(next, -140, 820, 792, 210, 10, '#110a07', '#1a100b', '#3a2416')
  const midRight = heap(next, 700, 1720, 770, 150, 9, '#110a07', '#180f0a', '#352014')
  const frontLeft = heap(next, -90, 600, 1012, 120, 12, '#0c0705', '#150d09', '#3e2618')
  const frontMid = heap(next, 520, 1260, 1020, 80, 8, '#0a0605', '#120b08', '#2e1c12')
  const pile = heap(next, -196, 98, 456, 286, 10, '#140d09', '#2c1b11', '#4a3020')
  const falls = [
    { k: 'tire', at: [-40, 168], to: [-150, 266], r: -280, d: 0 },
    { k: 'sheet', at: [-6, 180], to: [-196, 252], r: -200, d: 0.12 },
    { k: 'rim', at: [26, 196], to: [-120, 244], r: -360, d: 0.2 },
    { k: 'pipe', at: [-70, 190], to: [-180, 240], r: -120, d: 0.06 },
    { k: 'gear', at: [4, 210], to: [-236, 222], r: -300, d: 0.3 },
    { k: 'barrel', at: [-30, 214], to: [-86, 216], r: -90, d: 0.24 },
    { k: 'beam', at: [-50, 150], to: [-150, 280], r: -160, d: 0.16 },
    { k: 'tire', at: [40, 226], to: [-270, 206], r: -420, d: 0.36 },
  ] as const
  const avalanche = falls
    .map(
      p =>
        `<g transform="translate(${p.at[0]} ${p.at[1]})"><g class="rb-fall" style="--x:${p.to[0]}px;--y:${p.to[1]}px;--r:${p.r}deg;--d:${p.d}s">` +
        `<g transform="scale(1.2)" ${paint('#3a2416', '#6a4028')}>${piece(p.k)}</g></g></g>`,
    )
    .join('')
  const puffs = [
    [-120, 410, 0.5],
    [-210, 428, 0.65],
    [-50, 392, 0.4],
    [-260, 436, 0.85],
    [-10, 300, 0.25],
    [-150, 330, 0.55],
  ]
    .map(([x, y, d]) => `<circle class="rb-puff" style="--d:${d}s" cx="${x}" cy="${y}" r="92" fill="url(#rb-dustg)"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'dust',
      ink: '#0a0604',
      furniture: '#2a1d15',
      metal: '#3a2a20',
      paper: '#e6d7c3',
      light: { idle: '#b0662f', work: '#f0a050', bright: '#ffd9a6' },
      headTop: 236,
      glowAt: [371, 250],
      device,
      wear: {
        behind:
          // A canvas pack with a bedroll on top and a wrench sticking out.
          '<path d="M28 264Q28 252 40 252H72V340H38Q28 340 28 328Z" fill="#3e3022" stroke="#5a4632" stroke-width="2"/>' +
          '<rect x="24" y="240" width="54" height="16" rx="8" fill="#5a3a26" stroke="#7a5236" stroke-width="1.5"/>' +
          '<path d="M30 290H70" stroke="#2a1d14" stroke-width="4"/>',
        front:
          // Welding goggles pushed up on the head, their strap round it; a dust bandana over the lower face.
          // The strap runs across the forehead, the goggles sit on it with dark welding glass; both stop above row 1.
          '<path d="M68 236H232V247H68Z" fill="#3a2418"/><path d="M68 238H232" stroke="#6a4630" stroke-width="1.4"/>' +
          '<rect x="140" y="235" width="20" height="7" rx="2" fill="#1a120c"/>' +
          '<g fill="#16241f" stroke="#1a120c" stroke-width="5"><circle cx="124" cy="238" r="11"/><circle cx="176" cy="238" r="11"/></g>' +
          '<g fill="none" stroke="#b08850" stroke-width="1.8"><circle cx="124" cy="238" r="14"/><circle cx="176" cy="238" r="14"/></g>' +
          `<path d="M117 236q3 -6 10 -6M169 236q3 -6 10 -6" fill="none" stroke="${PATINA}" stroke-width="2.6" stroke-linecap="round"/>` +
          '<circle cx="129" cy="242" r="1.6" fill="#e6fff8"/><circle cx="181" cy="242" r="1.6" fill="#e6fff8"/>' +
          '<path d="M68 320H232V336C204 340 182 344 152 362C122 344 98 340 68 336Z" fill="#2f6a62"/>' +
          '<path d="M68 322H232" stroke="#5fa898" stroke-opacity=".6" stroke-width="2"/>' +
          '<g fill="#a8d8cc" fill-opacity=".55"><circle cx="96" cy="330" r="2"/><circle cx="124" cy="334" r="2"/><circle cx="152" cy="344" r="2"/><circle cx="180" cy="334" r="2"/><circle cx="208" cy="330" r="2"/></g>' +
          '<g transform="translate(68 326)"><path class="rb-tail" d="M0 0L-22 8L-14 13L-28 24L-4 12Z" fill="#2f6a62"/></g>',
      },
      seatArt:
        // Two old tires stacked.
        '<rect x="100" y="404" width="102" height="52" rx="22" fill="#141010" stroke="#2e2420" stroke-width="2"/>' +
        '<rect x="98" y="352" width="104" height="52" rx="22" fill="#171211" stroke="#2e2420" stroke-width="2"/>' +
        '<path d="M114 360V396M128 358V398M142 357V399M158 357V399M172 358V398M186 360V396M116 412V448M132 410V450M148 409V451M164 409V451M180 410V450" stroke="#0a0707" stroke-width="3"/>' +
        '<ellipse cx="150" cy="354" rx="50" ry="7" fill="#221a17" stroke="#3a2e28" stroke-width="1.6"/><ellipse cx="150" cy="354" rx="24" ry="3.4" fill="#060404"/>',
      tableArt:
        // A corrugated sheet laid on an oil drum and a stack of cinder blocks.
        '<rect x="216" y="342" width="30" height="36" fill="#2a2420" stroke="#3e3530" stroke-width="1.4"/><rect x="218" y="380" width="30" height="36" fill="#262020" stroke="#3e3530" stroke-width="1.4"/><rect x="216" y="418" width="30" height="38" fill="#2a2420" stroke="#3e3530" stroke-width="1.4"/>' +
        '<rect x="392" y="342" width="70" height="114" rx="4" fill="#2a1d15" stroke="#4a3426" stroke-width="2"/>' +
        '<path d="M392 372H462M392 426H462" stroke="#4a3426" stroke-width="4"/>' +
        `<path d="M402 384q14 -8 26 2q2 14 -12 14q-14 -2 -14 -16z" fill="${RUST_D}" fill-opacity=".7"/>` +
        `<path d="M444 342v44q-3 9 -6 0v-44z" fill="${PATINA}" fill-opacity=".6"/>` +
        '<path d="M164 330H472V342H164Z" fill="#3a2a1f" stroke="#5a4030" stroke-width="1.4"/>' +
        `<path d="${Array.from({ length: 30 }, (_, i) => `M${170 + i * 10} 331V341`).join('')}" stroke="#20160f" stroke-width="2"/>` +
        `<path d="M164 342H472" stroke="${RUST_D}" stroke-opacity=".7" stroke-width="2"/>`,
    },
    style:
      '@keyframes rb-spin{to{transform:rotate(360deg)}}@keyframes rb-spinb{to{transform:rotate(-360deg)}}' +
      // Ambient: crows circle, dust drifts in the low sun, cables and the rag sway.
      '.rb-orb{animation:rb-spin var(--t,30s) linear infinite}.rb-orbb{animation:rb-spinb var(--t,30s) linear infinite}' +
      '.rb-flap{transform-box:fill-box;transform-origin:50% 100%;animation:rb-flap .7s ease-in-out infinite alternate}@keyframes rb-flap{to{transform:scaleY(-.5)}}' +
      '.rb-mote{opacity:0;animation:rb-mote 11s linear infinite}' +
      '@keyframes rb-mote{0%{opacity:0;transform:translate(0,0)}20%{opacity:.5}80%{opacity:.35}100%{opacity:0;transform:translate(80px,-90px)}}' +
      '.rb-cab{transform-box:fill-box;transform-origin:0 0;animation:rb-sway 4.6s ease-in-out infinite alternate}@keyframes rb-sway{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}' +
      '.rb-tarp{transform-box:fill-box;transform-origin:0 0;animation:rb-tarp 2.6s ease-in-out infinite alternate}' +
      '@keyframes rb-tarp{from{transform:skewY(-5deg) scaleX(.94)}to{transform:skewY(6deg) scaleX(1.04)}}' +
      '.rb-tail{transform-box:fill-box;transform-origin:100% 0;animation:rb-tarp 1.8s ease-in-out infinite alternate}' +
      '.st-responding .rb-tarp,.st-responding .rb-tail{animation-duration:.8s}' +
      // Wind in the yard while Claude writes.
      '.rb-gust{opacity:0}.st-responding .rb-gust{animation:rb-gust 3.2s linear infinite}' +
      '@keyframes rb-gust{0%{opacity:0;transform:translateX(0)}15%,80%{opacity:1}100%{opacity:0;transform:translateX(1800px)}}' +
      // The giant's eye: an ember in idle, a dream while thinking.
      '.rb-ember{opacity:.14}.st-thinking .rb-ember{animation:rb-dream 3.2s ease-in-out infinite alternate}@keyframes rb-dream{from{opacity:.12}to{opacity:.6}}' +
      '.rb-wake,.rb-warm,.rb-core,.rb-coreu{opacity:0}' +
      // Run: the eye flickers on (three flickers in about a second), the core warms, the crows leave, the hand lifts.
      '.st-run .rb-wake{animation:rb-flick 1.3s linear both,rb-hum 2.6s ease-in-out 1.3s infinite alternate}' +
      '@keyframes rb-flick{0%,10%{opacity:0}16%{opacity:.75}26%{opacity:.08}48%{opacity:.85}58%{opacity:.15}80%,100%{opacity:1}}' +
      '@keyframes rb-hum{from{opacity:1}to{opacity:.78}}' +
      '.st-run .rb-core{animation:rb-on 2s ease-in .9s both}@keyframes rb-on{to{opacity:.8}}' +
      '.ultra .rb-coreu{animation:rb-hum 1.6s ease-in-out infinite alternate}' +
      '.st-run .rb-perch{animation:rb-flee 2.8s ease-in both}' +
      '@keyframes rb-flee{0%{transform:translate(0,0)}100%{transform:translate(-260px,-320px) scale(.5);opacity:0}}' +
      '.rb-wing{opacity:0}.st-run .rb-wing{opacity:1;transform-box:fill-box;transform-origin:50% 100%;animation:rb-flap .22s ease-in-out infinite alternate}' +
      '.st-run .rb-nod{animation:rb-look 2.4s ease-in-out .9s both}@keyframes rb-look{to{transform:rotate(-5deg)}}' +
      '.st-run .rb-arm{animation:rb-lift 5.6s ease-in-out .5s infinite}' +
      '@keyframes rb-lift{0%{transform:rotate(0)}38%{transform:rotate(19deg)}46%{transform:rotate(18deg)}50%{transform:rotate(19.5deg)}58%{transform:rotate(15deg)}' +
      '61%{transform:rotate(15.8deg)}70%{transform:rotate(10deg)}73%{transform:rotate(10.6deg)}90%,100%{transform:rotate(0)}}' +
      '.rb-crumb{opacity:0}.st-run .rb-crumb{animation:rb-crumb 5.6s ease-in infinite}' +
      '@keyframes rb-crumb{0%,22%{opacity:0;transform:translate(0,0)}26%{opacity:.9}44%{opacity:.8;transform:translate(var(--dx),120px)}46%,100%{opacity:0;transform:translate(var(--dx),130px)}}' +
      '.rb-thud{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .rb-thud{animation:rb-thud 5.6s ease-out .5s infinite}' +
      '@keyframes rb-thud{0%,88%{opacity:0;transform:scale(.4)}92%{opacity:.55}100%{opacity:0;transform:scale(1.5)}}' +
      // Done: the eye warms, the head gives a slow nod, the dusk warms with it, then it all goes back to sleep.
      '.st-done .rb-warm{animation:rb-warm 4.8s ease-in-out both}@keyframes rb-warm{0%{opacity:0}14%,62%{opacity:1}100%{opacity:.1}}' +
      '.st-done .rb-nod{animation:rb-nod 2.8s ease-in-out .5s both}' +
      '@keyframes rb-nod{0%{transform:rotate(0) translateY(0)}38%{transform:rotate(-5deg) translateY(18px)}70%{transform:rotate(1deg) translateY(-3px)}100%{transform:rotate(0) translateY(0)}}' +
      '.rb-dusk{opacity:0}.st-done .rb-dusk{animation:rb-dusk 4.5s ease-in-out .3s both}@keyframes rb-dusk{0%{opacity:0}45%{opacity:.3}100%{opacity:.18}}' +
      // Error: the junk pile by the desk comes down in a cloud of rust, a hubcap rolls off, the lamp jolts.
      '.rb-fall{transform-box:fill-box;transform-origin:center}' +
      '.st-error .rb-fall{animation:rb-fall 1.3s cubic-bezier(.55,0,.85,.55) var(--d,0s) both}' +
      '@keyframes rb-fall{0%{transform:translate(0,0) rotate(0)}72%{transform:translate(var(--x),var(--y)) rotate(var(--r))}' +
      '84%{transform:translate(calc(var(--x) - 18px),calc(var(--y) - 16px)) rotate(var(--r))}100%{transform:translate(calc(var(--x) - 30px),var(--y)) rotate(var(--r))}}' +
      '.rb-puff{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .rb-puff{animation:rb-puff 2.2s ease-out var(--d,.5s) both}' +
      '@keyframes rb-puff{0%{opacity:0;transform:scale(.3)}25%{opacity:.7}100%{opacity:0;transform:scale(1.7) translateY(-30px)}}' +
      '.rb-roll{opacity:0}.st-error .rb-roll{animation:rb-roll 2.2s cubic-bezier(.2,.6,.4,1) .7s both}@keyframes rb-roll{0%{opacity:1;transform:translateX(0)}100%{opacity:1;transform:translateX(-230px)}}' +
      '.rb-turn{transform-box:fill-box;transform-origin:center}.st-error .rb-turn{animation:rb-turn 2.2s cubic-bezier(.2,.6,.4,1) .7s both}@keyframes rb-turn{to{transform:rotate(-800deg)}}' +
      '.rb-lamp{animation:rb-lamp 5s ease-in-out infinite alternate}@keyframes rb-lamp{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-tool .rb-lamp{animation-duration:1.6s}.st-read .rb-lamp{animation-duration:9s}' +
      '.st-error .rb-lamp{animation:rb-jolt 2.6s ease-out both}' +
      '@keyframes rb-jolt{0%{transform:rotate(0)}12%{transform:rotate(18deg)}32%{transform:rotate(-13deg)}52%{transform:rotate(8deg)}72%{transform:rotate(-4deg)}100%{transform:rotate(0)}}' +
      '.rb-bulb{animation:rb-glow 3.4s ease-in-out infinite alternate}@keyframes rb-glow{from{opacity:.75}to{opacity:1}}' +
      '.st-error .rb-bulb{animation:rb-fk 1.4s linear both}@keyframes rb-fk{0%,8%{opacity:1}14%{opacity:.25}24%{opacity:1}46%{opacity:.35}56%,100%{opacity:1}}' +
      // Tool: sparks off the battery terminal. Web: the far giant's eye pings.
      '.rb-spk{opacity:0;animation:rb-spk .8s ease-out infinite}@keyframes rb-spk{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.rb-bcn{opacity:.12}.st-web .rb-bcn{animation:rb-bcn 1.5s ease-in-out infinite}@keyframes rb-bcn{0%,100%{opacity:.12}50%{opacity:.9}}',
    scenery:
      '<defs>' +
      '<linearGradient id="rb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090605"/><stop offset=".3" stop-color="#110a07"/><stop offset=".48" stop-color="#1f110a"/><stop offset=".6" stop-color="#3a1b0e"/><stop offset=".66" stop-color="#4a230f"/><stop offset=".74" stop-color="#2a140b"/></linearGradient>' +
      '<linearGradient id="rb-cl" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#6a3018" stop-opacity=".8"/><stop offset=".26" stop-color="#4a2212" stop-opacity=".6"/><stop offset=".45" stop-color="#1e0f09" stop-opacity=".5"/><stop offset=".7" stop-color="#1e0f09" stop-opacity=".5"/><stop offset="1" stop-color="#4a2414" stop-opacity=".6"/></linearGradient>' +
      '<radialGradient id="rb-sun"><stop offset="0" stop-color="#f0a060" stop-opacity=".55"/><stop offset=".18" stop-color="#d47a44" stop-opacity=".32"/><stop offset=".5" stop-color="#c8693a" stop-opacity=".1"/><stop offset="1" stop-color="#c8693a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rb-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140b07"/><stop offset="1" stop-color="#0a0604"/></linearGradient>' +
      '<radialGradient id="rb-hz2"><stop offset="0" stop-color="#a0502a" stop-opacity=".3"/><stop offset="1" stop-color="#a0502a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rb-dk"><stop offset="0" stop-color="#ffb070" stop-opacity=".55"/><stop offset="1" stop-color="#ff9050" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rb-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2818"/><stop offset=".45" stop-color="#2a1710"/><stop offset="1" stop-color="#170d09"/></linearGradient>' +
      '<linearGradient id="rb-iron2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#502a18"/><stop offset=".5" stop-color="#26150e"/><stop offset="1" stop-color="#120a07"/></linearGradient>' +
      '<linearGradient id="rb-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8602e" stop-opacity=".75"/><stop offset="1" stop-color="#b8602e" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rb-pt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa595" stop-opacity=".7"/><stop offset="1" stop-color="#4fa595" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="rb-eyeT"><stop offset="0" stop-color="#7ff0dc" stop-opacity=".7"/><stop offset=".25" stop-color="#3fc8b4" stop-opacity=".3"/><stop offset="1" stop-color="#3fc8b4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rb-eyeW"><stop offset="0" stop-color="#ffc27a" stop-opacity=".75"/><stop offset=".25" stop-color="#ff9a4a" stop-opacity=".32"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rb-coreT"><stop offset="0" stop-color="#9ff6e6" stop-opacity=".8"/><stop offset=".6" stop-color="#3fc8b4" stop-opacity=".35"/><stop offset="1" stop-color="#3fc8b4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rb-coreU"><stop offset="0" stop-color="#c8b0ff" stop-opacity=".85"/><stop offset=".6" stop-color="#7d5cf0" stop-opacity=".4"/><stop offset="1" stop-color="#7d5cf0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rb-dustg"><stop offset="0" stop-color="#b07a52" stop-opacity=".7"/><stop offset=".55" stop-color="#8a5634" stop-opacity=".3"/><stop offset="1" stop-color="#7a4a30" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#rb-sky)"/>' +
      // The low sun, hazy, right behind the giant's head; on done the whole dusk warms.
      '<circle cx="250" cy="300" r="470" fill="url(#rb-sun)"/><circle class="rb-dusk" cx="250" cy="300" r="440" fill="url(#rb-dk)"/>' +
      '<circle cx="250" cy="300" r="92" fill="#e07a40" fill-opacity=".6"/><circle cx="250" cy="300" r="74" fill="#f6ac6c" fill-opacity=".45"/>' +
      '<ellipse cx="236" cy="268" rx="170" ry="4" fill="#160b07" fill-opacity=".8"/><ellipse cx="262" cy="330" rx="150" ry="6" fill="#160b07" fill-opacity=".7"/>' +
      clouds +
      circling(250, 210, 90, 28, 1.1, false) +
      circling(360, 290, 54, 19, 0.9, true) +
      circling(1240, 150, 70, 24, 0.8, false) +
      '<g class="mv-b">' +
      // The dusk along the horizon.
      '<ellipse cx="1480" cy="620" rx="520" ry="150" fill="url(#rb-hz2)"/>' +
      ridge(next, 628, 34, '#1d100a', 0.16) +
      `<g class="mv-r">${farGiant()}</g>` +
      ridge(next, 668, 40, '#140b07', 0.1) +
      '<rect y="690" width="1600" height="510" fill="url(#rb-gnd)"/>' +
      midLeft +
      midRight +
      // The giant: chest, head on its neck, the shoulder and arm, the hand that can still lift.
      `<g transform="translate(176 742) rotate(-6)">${giantChest(next)}</g>` +
      `<g transform="translate(232 566) rotate(10)"><g class="rb-nod">${giantHead()}</g></g>` +
      giantShoulder() +
      `<g transform="translate(434 868)"><g class="rb-arm">${giantHand()}</g></g>` +
      '<ellipse class="rb-thud" cx="190" cy="930" rx="130" ry="26" fill="url(#rb-dustg)"/>' +
      frontLeft +
      frontMid +
      gusts +
      motes +
      '</g>',
    nook:
      '<defs><radialGradient id="rb-lampg"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".32"/><stop offset=".45" stop-color="#ffaa5a" stop-opacity=".1"/><stop offset="1" stop-color="#ffaa5a" stop-opacity="0"/></radialGradient></defs>' +
      // The car cubes stacked behind the desk.
      cube(next, 250, 340, 124, 116, 0, '#1f2624') +
      cube(next, 374, 336, 124, 120, 0, '#2a1a16') +
      cube(next, 262, 228, 120, 112, -1.5, '#29231a') +
      cube(next, 382, 232, 120, 104, 1, '#1e2024') +
      cube(next, 300, 122, 120, 106, 3, '#2a1c17') +
      cube(next, 334, 22, 110, 100, -5, '#1f2725') +
      // The girder across the top of the stack and the work lamp hanging from it.
      '<rect x="110" y="4" width="390" height="16" fill="#1e140e" stroke="#3a281c" stroke-width="1.6"/><path d="M110 9H500M110 15H500" stroke="#2e2016" stroke-width="1.4"/>' +
      `<path d="M150 20H500" stroke="${RUST_D}" stroke-opacity=".6" stroke-width="2"/>` +
      '<g transform="translate(176 20)"><g class="rb-lamp">' +
      '<g class="rb-bulb"><circle cy="74" r="160" fill="url(#rb-lampg)"/><circle cy="74" r="9" fill="#ffd79a"/></g>' +
      '<path d="M0 0V50" stroke="#2a1d15" stroke-width="2.4"/><path d="M-10 50H10L16 62V82Q0 96 -16 82V62Z" fill="none" stroke="#4a3628" stroke-width="3"/>' +
      '<path d="M-12 56H12M-16 70H16M0 52V92" stroke="#4a3628" stroke-width="2"/></g></g>' +
      // The junk pile beside the desk, and what slides off it on an error.
      pile +
      avalanche +
      puffs,
    front:
      '<g transform="translate(-70 438)"><g class="rb-roll"><g class="rb-turn"><circle r="17" fill="#2a2018" stroke="#7a6048" stroke-width="2"/><circle r="6" fill="#120c08"/>' +
      '<path d="M0 -15V-7M0 7V15M-15 0H-7M7 0H15" stroke="#7a6048" stroke-width="2"/></g></g></g>',
  }
}
