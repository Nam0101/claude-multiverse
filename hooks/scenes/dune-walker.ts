import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Dune Walker: a desert traveller in goggles and a wrapped scarf, typing in a goat-hair tent at dusk. Endless dunes
// roll to a burnt-orange horizon where a fierce low sun sits, and a camel caravan climbs a ridge in front of it.
// When a command runs a towering haboob rolls in over the left and the top; an error tears the tent flap loose and
// pours sand over the keyboard; done lets the storm pass, the sun sink, the stars out, and the caravan crest the dune.
const SIL = '#0b0503'
const RIM = '#ff9a42'
const SAND = '#d9a560'
const CLOTH = '#d8c49a'
const CLOTH_EDGE = '#a88f60'
const RUST = '#a8432a'
const RUST_DARK = '#8a3420'
const INDIGO = '#3a2c46'
const BRASS = '#c08a32'
const WOOD = '#3a2414'
const WOOD_EDGE = '#55361e'
const PAPER = '#e2d2b0'
const SUN = { x: 238, y: 600, r: 92 } as const

type Pt = readonly [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const pt = (p: Pt): string => `${f(p[0])} ${f(p[1])}`
const curve = (c: readonly Pt[]): string => `C${pt(c[1]!)} ${pt(c[2]!)} ${pt(c[3]!)}`

/** A cubic cut at `t`: the part before and the part after. */
function split(c: readonly Pt[], t: number): [Pt[], Pt[]] {
  const [p0, p1, p2, p3] = c as readonly [Pt, Pt, Pt, Pt]
  const a = lerp(p0, p1, t)
  const b = lerp(p1, p2, t)
  const e = lerp(p2, p3, t)
  const d = lerp(a, b, t)
  const g = lerp(b, e, t)
  const m = lerp(d, g, t)

  return [
    [p0, a, d, m],
    [m, g, e, p3],
  ]
}

/** The ridge the caravan climbs: a long, faintly convex windward face that rounds over a soft crest near (448, 597). */
const RIDGE: readonly (readonly Pt[])[] = [
  [[-160, 782], [0, 724], [230, 650], [372, 612]],
  [[372, 612], [404, 603], [426, 597], [448, 597]],
]
/** Its lee flank, rolling off the crest and steepening into the slip face, down under the near dunes. */
const FLANK: readonly (readonly Pt[])[] = [
  [[448, 597], [470, 597], [496, 608], [528, 632]],
  [[528, 632], [568, 662], [612, 728], [684, 800]],
  [[684, 800], [744, 860], [846, 900], [966, 916]],
]
const back = (c: readonly Pt[]): string => `C${pt(c[2]!)} ${pt(c[1]!)} ${pt(c[0]!)}`

function ridgeY(x: number): number {
  const seg = RIDGE.find(c => x <= c[3]![0]) ?? RIDGE[RIDGE.length - 1]!
  const at = (t: number, axis: 0 | 1) => {
    const u = 1 - t

    return u * u * u * seg[0]![axis] + 3 * u * u * t * seg[1]![axis] + 3 * u * t * t * seg[2]![axis] + t * t * t * seg[3]![axis]
  }
  let lo = 0
  let hi = 1

  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2

    if (at(mid, 0) < x) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return at((lo + hi) / 2, 1)
}

/**
 * One dune, lit from the low sun on the left: a gentle windward face up to a sharp crest, the slip face beyond it in
 * shadow, a glowing rim along the crest and a few ripples on the lit face. The slip face is a closed crescent: a soft S
 * from the crest down to the foot, a curve along the foot to the right toe, and back up the lee slope, so no straight
 * seam ever drops below the dune.
 */
function dune(x0: number, x1: number, cx: number, cy: number, base: number, lit: string, shade: string, rim: number, ripples = 0): string {
  const h = base - cy
  const left: Pt[] = [[x0, base], [x0 + (cx - x0) * 0.5, base], [cx - (cx - x0) * 0.28, cy], [cx, cy]]
  const right: Pt[] = [[cx, cy], [cx + (x1 - cx) * 0.12, cy + h * 0.08], [cx + (x1 - cx) * 0.5, base], [x1, base]]
  const sx = cx - (cx - x0) * 0.16
  const seam = `C${f(cx + (x1 - cx) * 0.04)} ${f(cy + h * 0.45)} ${f(sx + (cx - sx) * 0.1)} ${f(base - h * 0.25)} ${f(sx)} ${f(base)}`
  const foot = `C${f(sx + (x1 - sx) * 0.2)} ${f(base + h * 0.22)} ${f(sx + (x1 - sx) * 0.55)} ${f(base + h * 0.16)} ${pt(right[3]!)}`
  const [, top] = split(left, 0.45)
  const [down] = split(right, 0.16)
  const [part] = split(split(left, 0.25)[1], 0.75)
  let lines = ''

  for (let k = 1; k <= ripples; k += 1) {
    const shifted = part.map(p => [p[0] + k * 12, p[1] + k * 15] as Pt)

    lines += `M${pt(shifted[0]!)}${curve(shifted)}`
  }

  return (
    `<path d="M${pt(left[0]!)}${curve(left)}${curve(right)}V1240H${f(x0)}Z" fill="${lit}"/>` +
    `<path d="M${pt([cx, cy])}${seam}${foot}${back(right)}Z" fill="${shade}"/>` +
    (lines === '' ? '' : `<path d="${lines}" fill="none" stroke="#e09050" stroke-opacity=".09" stroke-width="2"/>`) +
    `<path class="dw-rim" d="M${pt(top[0]!)}${curve(top)}${curve(down)}" fill="none" stroke="${RIM}" stroke-opacity="${rim}" stroke-width="2" stroke-linecap="round"/>`
  )
}

/** Tiny squares as one path. */
function dots(points: readonly Pt[], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** A dromedary walking right, its feet at the origin: a pack camel, a rider, or the leader with a lamp on a staff. */
function camel(kind: 'pack' | 'rider' | 'lead', delay: number): string {
  const legs = ([
    [-18, ''],
    [-11, ' dw-lg2'],
    [11, ' dw-lg2'],
    [17, ''],
  ] as const)
    .map(([x, phase]) => `<path class="dw-lg${phase}" d="M${x} -28L${x + 1} -13L${x} 0"/>`)
    .join('')
  const rider = '<path d="M-9 -55C-11 -64 -8 -71 -3 -72C2 -71 5 -64 4 -55Z"/><circle cx="-2.5" cy="-76" r="4.6"/><path class="dw-rt" d="M-6 -78L-17 -72L-7 -74Z"/>'
  const load =
    kind === 'pack'
      ? '<rect x="-17" y="-64" width="24" height="10" rx="3"/><ellipse cx="-5" cy="-67" rx="9" ry="5"/><rect x="-22" y="-52" width="8" height="13" rx="2"/>'
      : kind === 'rider'
        ? rider
        : rider + '<path d="M1 -64L16 -96" stroke="#0b0503" stroke-width="2.4"/>'

  return (
    `<g class="dw-cb" style="--d:${f(delay)}s">` +
    `<g fill="none" stroke="${SIL}" stroke-width="3.4" stroke-linecap="round">${legs}<path d="M-25 -34Q-31 -30 -29 -21" stroke-width="2.4"/>` +
    '<path d="M13 -38Q29 -30 35 -47" stroke-width="8"/></g>' +
    `<g fill="${SIL}"><path d="M-26 -31C-27 -45 -15 -57 -3 -56C8 -55 13 -46 18 -40C22 -36 22 -30 17 -27L-21 -26C-25 -27 -27 -28 -26 -31Z" stroke="${RIM}" stroke-opacity=".3" stroke-width="1.2"/>` +
    '<path d="M31 -52C35 -56 44 -55 49 -50C51 -48 50 -45 47 -45L35 -44C32 -45 30 -49 31 -52Z"/><path d="M34 -53L33 -58L37 -54Z"/>' +
    load +
    '</g>' +
    (kind === 'lead'
      ? '<g class="dw-lamp"><circle cx="16" cy="-97" r="16" fill="url(#dw-lp)"/><circle cx="16" cy="-97" r="2.6" fill="#ffe2a0"/></g>'
      : '') +
    '</g>'
  )
}

/** A circling vulture's orbit, as keyframes: an ellipse in twelve steps. */
function orbit(name: string, rx: number, ry: number): string {
  const steps = 12

  return (
    `@keyframes ${name}{` +
    Array.from({ length: steps + 1 }, (_, k) => {
      const a = (k / steps) * Math.PI * 2

      return `${f((k / steps) * 100)}%{transform:translate(${f(rx * Math.cos(a))}px,${f(ry * Math.sin(a))}px)}`
    }).join('') +
    '}'
  )
}

/** The haboob: a towering wall of dust that rolls in from the left, and the cap it throws over the top. */
function haboob(next: () => number): { wall: string; cap: string } {
  const front = (y: number): number => 470 + Math.max(0, y - 120) * 0.22
  const edge = Array.from({ length: 12 }, (_, i) => -160 + i * 84).map(y => `${f(front(y))} ${y}`)
  const ball = (x: number, y: number, r: number, boil: boolean) =>
    `<circle${boil ? ` class="dw-bl" style="animation-delay:${f(-next() * 2.4)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`
  let high = ''
  let low = ''
  let cap = ''

  // Swells all through the body, so it reads as one lumpy mass of dust.
  for (let i = 0; i < 12; i += 1) {
    const y = -60 + next() * 780
    const b = ball(-420 + next() * 860, y, 70 + next() * 80, false)

    if (y < 330) {
      high += b
    } else {
      low += b
    }
  }

  // The front: an uneven cauliflower edge, each swell with a smaller one bulging out of it.
  for (let i = 0; i < 15; i += 1) {
    const y = -150 + i * 62 + (next() - 0.5) * 24
    const r = 36 + next() * 90
    const x = front(y) - r * 0.5 + (next() - 0.5) * 50
    const b = ball(x, y, r, i % 2 === 0) + ball(x + r * 0.6, y - r * 0.5, r * (0.35 + next() * 0.3), false)

    if (y < 330) {
      high += b
    } else {
      low += b
    }
  }

  // The cap it throws over the top: thick on the left, thinning to the right, a bulging leading edge.
  for (let i = 0; i < 23; i += 1) {
    const x = -420 + i * 100 + (next() - 0.5) * 40
    const thick = Math.max(0, 600 - x) * 0.14

    cap += ball(x, 112 + next() * 46 + thick, 64 + next() * 52 + thick * 0.4, i % 2 === 0)
  }

  for (let i = 0; i < 10; i += 1) {
    cap += ball(-200 + i * 210 + next() * 80, 176 + next() * 40 - i * 6, 26 + next() * 26, false)
  }

  return {
    wall:
      `<path d="M-560 -200H${f(front(-200))}L${edge.join('L')}L620 800H-560Z" fill="url(#dw-hbg)"/>` +
      `<g fill="url(#dw-pd)">${low}</g><g fill="url(#dw-pl)">${high}</g>` +
      // A low haze of dust rolling ahead of the wall's foot.
      '<ellipse cx="380" cy="640" rx="560" ry="74" fill="url(#dw-gs)"/>',
    cap:
      // The body ends inside a soft head swell, so the leading edge never shows a straight cut while it slides in.
      '<rect x="-500" y="-240" width="2260" height="370" fill="url(#dw-cg)"/><rect x="-500" y="96" width="2260" height="250" fill="url(#dw-vl)"/>' +
      '<ellipse cx="1760" cy="-40" rx="250" ry="200" fill="url(#dw-ch)"/>' +
      `<g fill="url(#dw-pc)">${cap}${ball(1830, -20, 140, true)}${ball(1790, 110, 100, false)}${ball(1870, 200, 70, false)}</g>`,
  }
}

/** The rugged laptop, a brass teapot with a glass of tea, and a felt-covered canteen. No gradients: portals draw it alone. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const steam =
    activity === 'error'
      ? ''
      : [0, 1]
          .map(i => `<path class="dw-stm" style="animation-delay:${-i * 1.5}s" d="M${399 + i * 6} 292q-5 -7 0 -13q5 -6 0 -12" fill="none" stroke="#efe2c8" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`)
          .join('')

  return (
    '<rect x="244" y="322" width="100" height="8" rx="2" fill="#5c4630"/>' +
    '<rect x="244" y="322" width="9" height="8" rx="2" fill="#a07a40"/><rect x="335" y="322" width="9" height="8" rx="2" fill="#a07a40"/>' +
    keys +
    '<path d="M334 327L360 236L373 239L347 330Z" fill="#4a3826"/>' +
    '<path d="M357 246L360 236L373 239L370 249ZM336 322L339 313L351 316L347 330Z" fill="#a07a40"/>' +
    `<path d="M337 322L360 243L364 244L341 324Z" fill="${light}"/>` +
    `<path d="M337 322L360 243L346 247L326 322Z" fill="${light}" fill-opacity=".16"/>` +
    `<path d="M386 330C382 318 389 306 403 306C417 306 424 318 420 330Z" fill="${BRASS}"/>` +
    `<path d="M395 306Q403 295 411 306Z" fill="#9a6a24"/><circle cx="403" cy="297" r="2.6" fill="${BRASS}"/>` +
    `<path d="M389 318Q378 312 373 299L377 297Q385 308 392 311Z" fill="${BRASS}"/>` +
    `<path d="M419 312Q431 314 425 327" fill="none" stroke="${BRASS}" stroke-width="3"/>` +
    '<path d="M391 321Q394 311 402 309" fill="none" stroke="#ffe2a0" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>' +
    steam +
    '<rect x="430" y="315" width="10" height="15" rx="1.5" fill="#b8602a" fill-opacity=".85" stroke="#efe2c8" stroke-opacity=".45" stroke-width="1.4"/>' +
    '<circle cx="448" cy="320" r="9.5" fill="#6b5838" stroke="#3a2c18" stroke-width="2"/><rect x="444" y="306" width="8" height="5" fill="#3a2c18"/>' +
    '<path d="M440 315Q448 311 456 315" fill="none" stroke="#8a7650" stroke-width="1.6"/>'
  )
}

export function duneWalkerWorld(): World {
  const next = random(5309)

  // The sky: evening stars in the east, the full field when done, high cirrus lit from below near the sun.
  const east: Pt[] = Array.from({ length: 18 }, () => [900 + next() * 700, 10 + next() * 300] as Pt)
  const starsA: Pt[] = []
  const starsB: Pt[] = []

  for (let i = 0; i < 56; i += 1) {
    ;(i % 2 ? starsA : starsB).push([next() * 1600, 8 + next() * 420])
  }

  const cirrus = Array.from({ length: 9 }, (_, i) => {
    const x = 40 + i * 175 + next() * 60
    const warm = x < 700

    return `<ellipse cx="${f(x)}" cy="${f(90 + next() * 230)}" rx="${f(130 + next() * 140)}" ry="${f(5 + next() * 9)}" fill="${warm ? '#c0682e' : '#5a3040'}" fill-opacity="${warm ? 0.2 : 0.14}"/>`
  }).join('')
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const w = 0.045
    const p = (r: number, da: number) => `${f(SUN.x + r * Math.cos(a + da))} ${f(SUN.y + r * Math.sin(a + da))}`

    return `M${p(100, -w)}L${p(440, -w * 0.4)}L${p(440, w * 0.4)}L${p(100, w)}Z`
  }).join('')
  const bands = [574, 588, 598, 606]
    .map((y, i) => `<rect x="${SUN.x - 110}" y="${y}" width="220" height="${3 + i}" fill="#7a3414" fill-opacity="${f(0.35 + i * 0.1)}"/>`)
    .join('')

  // The caravan, walking up the ridge toward its crest, a rope from each nose to the saddle ahead.
  // Each camel leans with the slope under its feet, a little less than the slope itself.
  const kinds = ['pack', 'rider', 'pack', 'rider', 'lead'] as const
  const size = 1.25
  const place = kinds.map((_, i) => {
    const x = -100 + i * 100

    return [x, ridgeY(x)] as Pt
  })
  const tilts = place.map(([x]) => f((Math.atan2(ridgeY(x + 4) - ridgeY(x - 4), 8) * 180 * 0.78) / Math.PI))
  const rotate = (p: Pt, [ox, oy]: Pt, tilt: number): Pt => {
    const a = (tilt * Math.PI) / 180

    return [ox + size * (p[0] * Math.cos(a) - p[1] * Math.sin(a)), oy + size * (p[0] * Math.sin(a) + p[1] * Math.cos(a))]
  }
  const ropes = place
    .slice(0, -1)
    .map((at, i) => {
      const nose = rotate([48, -47], at, Number(tilts[i]))
      const tail = rotate([-22, -40], place[i + 1]!, Number(tilts[i + 1]))

      return `M${pt(nose)}Q${f((nose[0] + tail[0]) / 2)} ${f((nose[1] + tail[1]) / 2 + 9)} ${pt(tail)}`
    })
    .join('')
  const caravan =
    `<path d="${ropes}" fill="none" stroke="${SIL}" stroke-width="1.4"/>` +
    kinds.map((kind, i) => `<g transform="translate(${f(place[i]![0])} ${f(place[i]![1] + 2)}) rotate(${tilts[i]}) scale(${size})">${camel(kind, -i * 0.31)}</g>`).join('')

  // Sand streaming off the crest rims, downwind: thin streaks, thick at the crest and tapering away from it.
  const spindrift = ([
    [446, 597],
    [412, 600],
    [720, 626],
    [640, 716],
    [1000, 700],
    [150, 838],
    [860, 890],
  ] as const)
    .map(([x, y], i) =>
      [0, 1]
        .map(k => {
          const len = 46 + k * 18

          return `<path class="dw-sd" style="animation-delay:${f(-(i * 0.43 + k * 1.1))}s" d="M${x} ${f(y - 2.6 - k)}c${f(len * 0.3)} -.8 ${f(len * 0.65)} -.2 ${len} 2.2c${f(-len * 0.4)} .2 ${f(-len * 0.75)} .6 ${-len} .8z" fill="${SAND}"/>`
        })
        .join(''),
    )
    .join('')

  // The dust devil that spins up while Claude thinks.
  const devil = Array.from({ length: 9 }, (_, k) => {
    const rx = 6 + k * 5

    return `<ellipse class="dw-ddr" style="--a:${f(rx * 0.35)}px;animation-delay:${f(-k * 0.13)}s" cx="96" cy="${852 - k * 24}" rx="${rx}" ry="${f(3 + k * 0.9)}"/>`
  }).join('')

  const storm = haboob(next)
  const vultures = [0, 1]
    .map(
      i =>
        `<g transform="translate(${250 + i * 40} ${372 - i * 26})"><g class="dw-vu${i}"><path class="dw-wf" d="M-13 0Q-7 -6 0 -1Q7 -6 13 0" fill="none" stroke="#1a0b05" stroke-width="2.6" stroke-linecap="round"/></g></g>`,
    )
    .join('')

  // In the tent: a woven band of invented marks and the valance fringe.
  const band = Array.from({ length: 24 }, (_, i) => `M${-140 + i * 26} 156l13 -24l13 24Z`).join('')
  const diamonds = Array.from({ length: 24 }, (_, i) => `M${-127 + i * 26} 136l5 6l-5 6l-5 -6Z`).join('')
  const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ]
  const fringe = [
    ...Array.from({ length: 6 }, (_, i) => quad([-150, 78], [-60, 70], [30, 60], i / 6)),
    ...Array.from({ length: 16 }, (_, i) => quad([30, 60], [222, 104], [412, 60], i / 16)),
  ]
    .map(([x, y]) => `M${f(x)} ${f(y)}v9`)
    .join('')
  const grains = Array.from({ length: 12 }, (_, i) => `<circle class="dw-gr" style="animation-delay:${f(0.3 + i * 0.046)}s" cx="${f(290 + next() * 22)}" cy="${f(86 + next() * 14)}" r="${f(1.4 + next() * 1.4)}"/>`).join('')
  const splash = [-26, -16, -8, 10, 18, 28]
    .map((dx, i) => `<circle class="dw-spl" style="--dx:${dx}px;animation-delay:${f(0.6 + i * 0.13)}s" cx="300" cy="314" r="2.2" fill="#f0c890"/>`)
    .join('')
  // The pour itself: a ragged stream about 24 wide, with loose grains riding its sides.
  const edgeL: string[] = []
  const edgeR: string[] = []

  for (let y = 84; y <= 318; y += 13) {
    const w = 8 + ((y - 84) / 234) * 4

    edgeL.push(`${f(300 - w - next() * 2.6)} ${y}`)
    edgeR.unshift(`${f(300 + w + next() * 2.6)} ${y}`)
  }

  const pour =
    `<path d="M${edgeL.join('L')}L${edgeR.join('L')}Z" fill="url(#dw-sg)"/>` +
    `<path d="${dots(Array.from({ length: 14 }, (_, i) => [i % 2 ? 314 + next() * 4 : 282 + next() * 4, 100 + i * 15 + next() * 8] as Pt), 2)}" fill="#f0c890" fill-opacity=".7"/>`
  // The error gust: a few fast sand streaks racing over the dunes.
  const gusts = Array.from({ length: 9 }, (_, i) => {
    const len = 120 + next() * 130

    return `<path class="dw-gk" style="animation-delay:${f(0.05 + i * 0.1)}s" d="M${f(-440 + next() * 380)} ${f(640 + next() * 250)}c${f(len * 0.3)} -2.2 ${f(len * 0.7)} -2.2 ${f(len)} 0c${f(-len * 0.3)} 2.2 ${f(-len * 0.7)} 2.2 ${f(-len)} 0z"/>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0a0503',
      furniture: WOOD,
      metal: '#4a3826',
      paper: PAPER,
      light: { idle: '#b8843a', work: '#ffc65a', bright: '#ffe9b0' },
      headTop: 198,
      glowAt: [352, 282],
      device,
      wear: {
        // A loose end of the head wrap, streaming behind in the wind.
        behind: `<path class="dw-tail" d="M74 232C57 237 41 251 31 268C38 263 48 259 59 257C50 268 46 282 42 298C56 282 66 264 78 250Z" fill="#c8b38a"/>`,
        front:
          // The head wrap, its rust stripe ending above the eyes; goggles pushed up on it; a scarf wrapped low.
          `<path d="M62 250C58 214 98 194 150 194C202 194 242 214 238 250C206 242 94 242 62 250Z" fill="${CLOTH}" stroke="${CLOTH_EDGE}" stroke-width="1.6"/>` +
          `<path d="M80 228C110 210 170 206 218 216M70 241C110 230 190 228 232 239M118 199C140 213 170 218 202 205" fill="none" stroke="${CLOTH_EDGE}" stroke-width="2" stroke-opacity=".8"/>` +
          `<path d="M63 247C96 239 204 239 237 247" fill="none" stroke="${RUST}" stroke-width="4"/>` +
          '<path d="M62 224C100 214 200 214 238 224" fill="none" stroke="#3a2414" stroke-width="6"/><rect x="134" y="216" width="32" height="8" rx="3" fill="#3a2414"/>' +
          `<g stroke="${BRASS}" stroke-width="3.4" fill="#e8b04a" fill-opacity=".6"><circle cx="118" cy="220" r="14"/><circle cx="182" cy="220" r="14"/></g>` +
          '<g fill="#fff4e0" fill-opacity=".75"><path d="M109 215a9 9 0 0 1 9 -6v3a6 6 0 0 0 -6 4Z"/><path d="M173 215a9 9 0 0 1 9 -6v3a6 6 0 0 0 -6 4Z"/></g>' +
          `<path d="M68 318C110 327 190 327 232 318V336C190 345 110 345 68 336Z" fill="${RUST}"/>` +
          `<path d="M70 327C110 335 190 335 230 327" fill="none" stroke="${CLOTH}" stroke-opacity=".55" stroke-width="2.4"/>` +
          `<circle cx="80" cy="330" r="8" fill="${RUST_DARK}"/><path class="dw-tail2" d="M78 334L56 360L66 357L60 376L84 340Z" fill="${RUST_DARK}"/>`,
      },
      seatArt:
        // Two woven floor cushions on a brass-studded chest.
        '<rect x="104" y="414" width="94" height="42" rx="3" fill="#2e1c10" stroke="#4a301a" stroke-width="2"/>' +
        `<g fill="${BRASS}"><circle cx="112" cy="422" r="2.4"/><circle cx="190" cy="422" r="2.4"/><circle cx="112" cy="448" r="2.4"/><circle cx="190" cy="448" r="2.4"/></g>` +
        `<rect x="94" y="378" width="114" height="38" rx="12" fill="${RUST_DARK}"/><path d="M100 390H202M100 404H202" stroke="${SAND}" stroke-opacity=".55" stroke-width="3"/>` +
        `<rect x="100" y="346" width="102" height="36" rx="11" fill="${INDIGO}"/><path d="M104 357H198" stroke="#8a7aa8" stroke-opacity=".75" stroke-width="3"/>` +
        `<path d="M106 370${'l6 -5l6 5'.repeat(7)}" fill="none" stroke="#efe2c8" stroke-opacity=".45" stroke-width="2"/>` +
        `<g fill="${SAND}"><circle cx="101" cy="348" r="3.4"/><circle cx="201" cy="348" r="3.4"/><circle cx="101" cy="380" r="3.4"/><circle cx="201" cy="380" r="3.4"/></g>`,
      tableArt:
        // A folding camp table on crossed legs, a woven runner over its edge.
        `<path d="M220 342L266 454M266 342L220 454M400 342L446 454M446 342L400 454" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M243 398H423" stroke="${WOOD_EDGE}" stroke-width="4"/><g fill="${BRASS}"><circle cx="243" cy="398" r="3.4"/><circle cx="423" cy="398" r="3.4"/></g>` +
        `<rect x="166" y="330" width="304" height="12" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<rect x="238" y="330" width="104" height="36" fill="${INDIGO}"/><path d="M238 340H342M238 357H342" stroke="${SAND}" stroke-opacity=".6" stroke-width="2.4"/>` +
        `<path d="M242 350${'l8 -5l8 5'.repeat(6)}" fill="none" stroke="#efe2c8" stroke-opacity=".45" stroke-width="1.6"/>` +
        `<path d="${Array.from({ length: 13 }, (_, i) => `M${242 + i * 8} 366v7`).join('')}" stroke="${SAND}" stroke-opacity=".6" stroke-width="1.6"/>`,
    },
    style:
      orbit('dw-o', 110, 30) +
      // The sun breathes, its rays turn, haze bands drift across it; the cirrus drifts; the east stars twinkle.
      '.dw-hp{animation:dw-hp 6s ease-in-out infinite alternate}@keyframes dw-hp{from{opacity:.84}to{opacity:1}}' +
      `.dw-rays{transform-origin:${SUN.x}px ${SUN.y}px;animation:mv-spin 180s linear infinite}` +
      '.dw-band{animation:dw-band 5s ease-in-out infinite alternate}@keyframes dw-band{from{transform:translate(-9px,1px)}to{transform:translate(9px,-2px)}}' +
      '.st-thinking .dw-band{animation-duration:1.8s}' +
      '.dw-ci{animation:dw-ci 60s ease-in-out infinite alternate}@keyframes dw-ci{to{transform:translateX(44px)}}' +
      '.dw-tw{animation:dw-tw 3.4s ease-in-out infinite alternate}.dw-tw2{animation-duration:2.6s;animation-delay:-1.3s}@keyframes dw-tw{from{opacity:.3}to{opacity:.9}}' +
      '.dw-moon{opacity:.55}' +
      // The caravan walks: bodies sway, legs swing, riders' cloth streams.
      '.dw-cb{animation:dw-cb .9s ease-in-out var(--d) infinite alternate}@keyframes dw-cb{to{transform:translateY(-1.8px)}}' +
      '.dw-lg{transform-box:fill-box;transform-origin:50% 0;animation:dw-lg .9s ease-in-out var(--d) infinite alternate}@keyframes dw-lg{from{transform:rotate(-15deg)}to{transform:rotate(15deg)}}' +
      '.dw-lg2{animation-delay:calc(var(--d) - .9s)}' +
      '.dw-rt{transform-box:fill-box;transform-origin:100% 50%;animation:dw-rt .7s ease-in-out var(--d) infinite alternate}@keyframes dw-rt{to{transform:scaleY(.4) rotate(8deg)}}' +
      '.dw-lamp{opacity:0}' +
      '.dw-vu0,.dw-vu1{animation:dw-o 16s linear infinite}.dw-vu1{animation-duration:21s;animation-delay:-8s}' +
      '.dw-wf{transform-box:fill-box;transform-origin:50% 100%;animation:dw-wf 1.6s ease-in-out infinite alternate}@keyframes dw-wf{to{transform:scaleY(.55)}}' +
      // Sand blows off the crests and in streaks over the ground; the wind rises with the work.
      '.dw-sd{opacity:0;transform-box:fill-box;transform-origin:0 50%;animation:dw-sd 2.8s ease-out infinite}' +
      '@keyframes dw-sd{0%{opacity:0;transform:translate(0,0) scaleX(.15)}30%{opacity:.5;transform:translate(4px,-1px) scaleX(1)}100%{opacity:0;transform:translate(var(--dx,46px),-5px) scaleX(1.4)}}' +
      '.st-responding .dw-sd,.st-tool .dw-sd{animation-duration:1.5s}.st-tool .dw-sdg{--dx:100px}' +
      '.st-run .dw-sd,.st-error .dw-sd{animation-duration:1s}.st-run .dw-sdg,.st-error .dw-sdg{--dx:150px}' +
      '.dw-wind{opacity:.55}.st-responding .dw-wind,.st-tool .dw-wind,.st-run .dw-wind,.st-error .dw-wind{opacity:1}' +
      '.st-thinking .dw-wind,.st-read .dw-wind{opacity:.3}' +
      '.dw-storm{opacity:0}.st-run .dw-storm{animation:dw-in 1.4s ease-out .4s both}.st-error .dw-storm{animation:dw-in .5s ease-out both}' +
      '.st-tool .dw-storm{opacity:.35}' +
      '@keyframes dw-in{to{opacity:1}}' +
      // Thinking: a dust devil spins up on the near dune.
      '.dw-dd{opacity:0}.st-thinking .dw-dd{animation:dw-in 1.4s ease-out both}' +
      '.st-thinking .dw-ddr{animation:dw-ddr .8s ease-in-out infinite alternate}@keyframes dw-ddr{from{transform:translateX(calc(var(--a) * -1))}to{transform:translateX(var(--a))}}' +
      // Web: a falcon glides across the sky.
      '.dw-fal{opacity:0}.st-web .dw-fal{animation:dw-fal 4.6s linear infinite}' +
      '@keyframes dw-fal{0%{opacity:0;transform:translate(0,0)}6%{opacity:.9}90%{opacity:.9}100%{opacity:0;transform:translate(-1900px,-70px)}}' +
      '.dw-fw{transform-box:fill-box;transform-origin:50% 100%;animation:dw-fw .42s ease-in-out infinite alternate}@keyframes dw-fw{to{transform:scaleY(.25)}}' +
      // Run: the haboob towers in from the left, its cap rolling over the top; the sun drowns in dust.
      '.dw-hb,.dw-cap{display:none}.st-run .dw-hb,.st-run .dw-cap{display:inline}' +
      '.st-run .dw-hb{animation:dw-roll 3s cubic-bezier(.22,.62,.32,1) both}@keyframes dw-roll{from{transform:translateX(-780px)}to{transform:translateX(0)}}' +
      '.st-run .dw-cap{animation:dw-capr 3.4s cubic-bezier(.22,.62,.32,1) both}@keyframes dw-capr{from{transform:translateX(-2100px)}to{transform:translateX(0)}}' +
      '.st-run .dw-bl{transform-box:fill-box;transform-origin:center;animation:dw-bl 2.4s ease-in-out infinite alternate}@keyframes dw-bl{from{transform:scale(.92)}to{transform:scale(1.08)}}' +
      '.st-run .dw-sun{animation:dw-dim 1.6s ease-in .5s both}@keyframes dw-dim{to{opacity:.3}}' +
      '.dw-dust{opacity:0}.st-run .dw-dust{animation:dw-dusty 1.6s ease-out .8s both}@keyframes dw-dusty{to{opacity:.12}}' +
      // Error: a gust of sand sweeps over the dunes.
      '.dw-gust{opacity:0}.st-error .dw-gust{animation:dw-gust 2.2s cubic-bezier(.2,.6,.3,1) both}' +
      '@keyframes dw-gust{0%{opacity:0;transform:translateX(-1300px)}25%{opacity:.85}100%{opacity:.6;transform:translateX(0)}}' +
      '.dw-gk{opacity:0}.st-error .dw-gk{animation:dw-gk .9s cubic-bezier(.3,.5,.6,1) infinite}' +
      '@keyframes dw-gk{0%{opacity:0;transform:translateX(0)}15%{opacity:.5}70%{opacity:.3}100%{opacity:0;transform:translateX(1150px)}}' +
      // Done: the night comes down, the sun sinks, stars come out, a meteor, the caravan crests the dune with its lamp lit.
      '.dw-night,.dw-stars,.dw-shoot{opacity:0}' +
      '.st-done .dw-night{animation:dw-in 2.8s ease-out both}.st-done .dw-stars{animation:dw-in 2.2s ease-out .6s both}' +
      '.st-done .dw-sun{animation:dw-set 3.2s ease-in both}@keyframes dw-set{to{transform:translateY(150px);opacity:.6}}' +
      '.st-done .dw-cv{animation:dw-crest 3.4s ease-in-out both}@keyframes dw-crest{to{transform:translate(100px,-30px)}}' +
      '.st-done .dw-lamp{animation:dw-in 1s ease-out 1.2s both}' +
      '.st-done .dw-moon{animation:dw-moon 2.4s ease-out both}@keyframes dw-moon{to{opacity:1}}' +
      '.st-done .dw-shoot{animation:dw-shoot 1.3s ease-out 1.1s both}@keyframes dw-shoot{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(-280px,120px)}}' +
      '.st-done .dw-sd{animation:none}.st-done .dw-wind{opacity:.12}' +
      '.st-done .dw-rw{animation:dw-out 1.6s ease-in both}@keyframes dw-out{to{opacity:0}}' +
      '.st-done .dw-rim{animation:dw-rimd 2.4s ease-out both}@keyframes dw-rimd{to{opacity:.22}}' +
      // The tent: the flap breathes in the wind, the lantern sways and glows, the roof shudders.
      '.dw-flap{transform-box:fill-box;transform-origin:0 0;animation:dw-flap 3.8s ease-in-out infinite alternate}' +
      '@keyframes dw-flap{from{transform:skewY(-1.5deg) rotate(-1deg)}to{transform:skewY(1.5deg) rotate(1.5deg)}}' +
      '.st-responding .dw-flap,.st-tool .dw-flap{animation-duration:1.1s}' +
      '.st-run .dw-flap{animation:dw-flap2 .45s ease-in-out infinite alternate}@keyframes dw-flap2{from{transform:rotate(-3deg) skewY(-3deg)}to{transform:rotate(4deg) skewY(4deg)}}' +
      '.st-error .dw-flap{animation:dw-tear 2.4s cubic-bezier(.45,0,.6,.6) both}' +
      '@keyframes dw-tear{0%{transform:none}5%{transform:rotate(-12deg)}10%{transform:rotate(5deg)}17%{opacity:1;transform:translate(60px,-90px) rotate(-36deg)}75%{opacity:.75}100%{opacity:0;transform:translate(520px,-660px) rotate(-200deg) scale(.5)}}' +
      '.dw-torn,.dw-rip{opacity:0}.st-error .dw-torn{animation:dw-in .2s ease-out .3s both}.st-error .dw-rip{animation:dw-in .3s ease-out .1s both}' +
      '.st-error .dw-roof{animation:dw-shake .3s ease-in-out infinite alternate}@keyframes dw-shake{from{transform:translateY(-1.5px)}to{transform:translateY(1.5px)}}' +
      '.dw-lan{animation:dw-lan 3.6s ease-in-out infinite alternate}@keyframes dw-lan{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-run .dw-lan,.st-error .dw-lan{animation:dw-lan2 .9s ease-in-out infinite alternate}@keyframes dw-lan2{from{transform:rotate(-15deg)}to{transform:rotate(13deg)}}' +
      '.dw-lgl{animation:dw-lgl 2.6s ease-in-out infinite alternate}@keyframes dw-lgl{from{opacity:.72}to{opacity:1}}' +
      '.dw-tail{transform-box:fill-box;transform-origin:100% 0;animation:dw-tail 1.8s ease-in-out infinite alternate}@keyframes dw-tail{from{transform:rotate(-6deg)}to{transform:rotate(9deg)}}' +
      '.dw-tail2{transform-box:fill-box;transform-origin:100% 0;animation:dw-tail 1.4s ease-in-out -.5s infinite alternate}' +
      '.st-run .dw-tail,.st-run .dw-tail2{animation-duration:.35s}' +
      '.dw-stm{opacity:0;animation:dw-stm 3s ease-out infinite}@keyframes dw-stm{0%{opacity:0;transform:translate(0,0)}30%{opacity:.45}100%{opacity:0;transform:translate(-6px,-26px)}}' +
      // Read: a hide map unrolls from the ridge pole.
      '.dw-map{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-read .dw-map{animation:dw-unroll 1.2s ease-out both}@keyframes dw-unroll{to{transform:scaleY(1)}}' +
      '.dw-route{stroke-dasharray:5 5;animation:dw-march 1.4s linear infinite}@keyframes dw-march{to{stroke-dashoffset:-10}}' +
      // Error at the desk: sand pours through the torn roof onto the keys and piles up.
      '.dw-pour{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-error .dw-pour{animation:dw-pour .5s ease-in .3s both}@keyframes dw-pour{to{transform:scaleY(1)}}' +
      '.dw-gr,.dw-spl,.dw-puff{opacity:0}' +
      '.st-error .dw-gr{animation:dw-gr .55s linear infinite}@keyframes dw-gr{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:.9;transform:translateY(228px)}}' +
      '.dw-pile{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}.st-error .dw-pile{animation:dw-pile 1.6s ease-out .55s both}@keyframes dw-pile{to{transform:scaleY(1)}}' +
      '.st-error .dw-spl{animation:dw-spl .8s ease-out infinite}' +
      '@keyframes dw-spl{0%{opacity:0;transform:translate(0,0)}25%{opacity:.85;transform:translate(calc(var(--dx) * .4),-12px)}100%{opacity:0;transform:translate(var(--dx),4px)}}' +
      '.st-error .dw-puff{animation:dw-in .8s ease-out .5s both}',
    scenery:
      '<defs>' +
      '<linearGradient id="dw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0710"/><stop offset=".35" stop-color="#140b0d"/><stop offset=".55" stop-color="#26120c"/><stop offset=".64" stop-color="#3c1b0d"/><stop offset="1" stop-color="#3c1b0d"/></linearGradient>' +
      '<radialGradient id="dw-halo"><stop offset="0" stop-color="#ffc062" stop-opacity=".6"/><stop offset=".14" stop-color="#ff9a42" stop-opacity=".4"/><stop offset=".34" stop-color="#e0682a" stop-opacity=".18"/><stop offset=".62" stop-color="#9a3a16" stop-opacity=".07"/><stop offset="1" stop-color="#9a3a16" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-ray"><stop offset="0" stop-color="#ffb04a" stop-opacity=".16"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-cor"><stop offset=".64" stop-color="#ffb04a" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-disc" cx=".42" cy=".4" r=".66"><stop offset="0" stop-color="#ffe0a0"/><stop offset=".6" stop-color="#ffb44e"/><stop offset="1" stop-color="#f2842e"/></radialGradient>' +
      '<radialGradient id="dw-hz"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".36"/><stop offset=".5" stop-color="#c0501e" stop-opacity=".12"/><stop offset="1" stop-color="#c0501e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dw-ngt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05071a" stop-opacity=".92"/><stop offset=".6" stop-color="#070a1e" stop-opacity=".74"/><stop offset="1" stop-color="#070a1e" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="dw-hbg" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="800"><stop offset="0" stop-color="#5a2e14"/><stop offset=".45" stop-color="#4c2612"/><stop offset="1" stop-color="#2a1408"/></linearGradient>' +
      // Each swell of dust is lit on its upper left and feathers out to nothing at its rim, so the mass billows.
      '<radialGradient id="dw-pl" fx=".42" fy=".38"><stop offset="0" stop-color="#76441f"/><stop offset=".5" stop-color="#68381a" stop-opacity=".95"/><stop offset=".8" stop-color="#62341a" stop-opacity=".5"/><stop offset="1" stop-color="#62341a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-pd" fx=".42" fy=".38"><stop offset="0" stop-color="#5a3016"/><stop offset=".5" stop-color="#4e2813" stop-opacity=".95"/><stop offset=".8" stop-color="#4a2612" stop-opacity=".5"/><stop offset="1" stop-color="#4a2612" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-pc" fx=".44" fy=".4"><stop offset="0" stop-color="#543017"/><stop offset=".5" stop-color="#4a2612" stop-opacity=".95"/><stop offset=".8" stop-color="#462411" stop-opacity=".5"/><stop offset="1" stop-color="#462411" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dw-cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e0f07"/><stop offset=".6" stop-color="#2e170b"/><stop offset=".86" stop-color="#3e2010" stop-opacity=".85"/><stop offset="1" stop-color="#3e2010" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="dw-ch"><stop offset="0" stop-color="#2c160a"/><stop offset=".55" stop-color="#2e170b" stop-opacity=".95"/><stop offset="1" stop-color="#2e170b" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dw-vl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e2010" stop-opacity=".5"/><stop offset=".5" stop-color="#3a1e0e" stop-opacity=".2"/><stop offset="1" stop-color="#3a1e0e" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="dw-sf" gradientUnits="userSpaceOnUse" x1="0" y1="597" x2="0" y2="900"><stop offset="0" stop-color="#140a05"/><stop offset="1" stop-color="#0e0603"/></linearGradient>' +
      '<radialGradient id="dw-gs"><stop offset="0" stop-color="#9a5e2c" stop-opacity=".6"/><stop offset=".6" stop-color="#6a3a1a" stop-opacity=".28"/><stop offset="1" stop-color="#6a3a1a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dw-rg" gradientUnits="userSpaceOnUse" x1="0" y1="600" x2="0" y2="900"><stop offset="0" stop-color="#2e160a"/><stop offset="1" stop-color="#0e0603"/></linearGradient>' +
      '<radialGradient id="dw-lp"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dw-mg"><stop offset="0" stop-color="#f4e6c8" stop-opacity=".22"/><stop offset="1" stop-color="#f4e6c8" stop-opacity="0"/></radialGradient>' +
      `<clipPath id="dw-sc"><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#dw-sky)"/>' +
      // The fierce low sun on the horizon, with its halo, slow rays and the haze bands across its face.
      '<g class="mv-b"><g class="dw-sun">' +
      '<ellipse cx="300" cy="612" rx="900" ry="130" fill="url(#dw-hz)"/>' +
      `<circle class="dw-hp" cx="${SUN.x}" cy="${SUN.y}" r="470" fill="url(#dw-halo)"/>` +
      `<g class="dw-rw"><path class="dw-rays" d="${rays}" fill="url(#dw-ray)"/></g>` +
      `<circle cx="${SUN.x}" cy="${SUN.y}" r="132" fill="url(#dw-cor)"/><circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" fill="url(#dw-disc)"/>` +
      `<g clip-path="url(#dw-sc)"><g class="dw-band">${bands}</g></g>` +
      '</g></g>' +
      // Night, which only falls when the work is done, and its stars.
      '<rect class="dw-night" y="-200" width="1600" height="880" fill="url(#dw-ngt)"/>' +
      `<path class="dw-tw" d="${dots(east, 2.6)}" fill="#e8dcc8" fill-opacity=".7"/>` +
      `<g class="dw-stars"><path class="dw-tw" d="${dots(starsA, 3)}" fill="#f2e8d6"/><path class="dw-tw dw-tw2" d="${dots(starsB, 2.4)}" fill="#d8dcff"/></g>` +
      '<g class="dw-shoot"><path d="M640 70L700 44" stroke="#fff4e0" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/></g>' +
      '<g class="mv-r"><g class="mv-t"><g class="dw-moon"><circle cx="1468" cy="132" r="70" fill="url(#dw-mg)"/>' +
      '<path d="M1468 108A24 24 0 1 0 1468 156A19 24 0 1 1 1468 108Z" fill="#f4e6c8" fill-opacity=".85"/></g></g></g>' +
      `<g class="dw-ci">${cirrus}</g>` +
      vultures +
      // The falcon, out on the web.
      '<g transform="translate(1660 250)"><g class="dw-fal"><path d="M-4 0L10 -2L-2 3Z" fill="#c88a50"/>' +
      '<path class="dw-fw" d="M-16 -1Q-6 -14 4 -2Q12 -16 22 -10Q12 -6 4 0Z" fill="#c88a50"/></g></g>' +
      // The land: far dunes, the haboob behind the ridge, middle dunes, the caravan's ridge, the near dunes.
      '<g class="mv-b">' +
      '<path d="M-40 616Q140 594 300 606T620 600T940 606T1260 596T1580 604T1900 600V1240H-40Z" fill="#3a1b0d"/>' +
      '<path d="M-40 630Q60 606 160 618T360 614T560 608T760 616T960 604T1160 614T1360 602T1560 612T1760 606V1240H-40Z" fill="#231109"/>' +
      '<path class="dw-rim" d="M-40 630Q60 606 160 618T360 614T560 608T760 616T960 604T1160 614" fill="none" stroke="#ff9a42" stroke-opacity=".22" stroke-width="1.6"/>' +
      `<g class="dw-hb">${storm.wall}</g>` +
      // Each dune's left toe starts where the ridge or a nearer dune hides it.
      dune(300, 1080, 720, 626, 690, '#2c170c', '#150b06', 0.34) +
      dune(540, 1700, 1180, 606, 680, '#2a160b', '#140a06', 0.3) +
      dune(380, 1160, 640, 716, 800, '#221209', '#100804', 0.3, 2) +
      dune(600, 1700, 1000, 700, 790, '#211109', '#0f0704', 0.26, 2) +
      '<g class="dw-hb" fill="url(#dw-gs)"><ellipse cx="420" cy="700" rx="300" ry="70"/><ellipse cx="120" cy="670" rx="360" ry="90"/><ellipse cx="560" cy="760" rx="200" ry="60"/></g>' +
      // The ridge, backlit: a dark body rounding over a soft crest, its slip face sweeping down the lee in an S, ripples.
      `<path d="M${pt(RIDGE[0]![0]!)}${RIDGE.map(curve).join('')}${FLANK.map(curve).join('')}V1240H-160Z" fill="url(#dw-rg)"/>` +
      `<path d="M448 597C458 636 514 676 546 724C574 766 600 846 660 940L760 1240H966V916${[...FLANK].reverse().map(back).join('')}Z" fill="url(#dw-sf)"/>` +
      `<path d="${[1, 2, 3].map(k => {
        const part = split(split(RIDGE[0]!, 0.35)[1], 0.9)[0].map(p => [p[0] + k * 18, p[1] + k * 30] as Pt)

        return `M${pt(part[0]!)}${curve(part)}`
      }).join('')}" fill="none" stroke="#e09050" stroke-opacity=".08" stroke-width="2"/>` +
      `<path class="dw-rim" d="M${pt(RIDGE[0]![0]!)}${RIDGE.map(curve).join('')}" fill="none" stroke="${RIM}" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path class="dw-rim" d="M${pt(FLANK[0]![0]!)}${curve(FLANK[0]!)}" fill="none" stroke="${RIM}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>` +
      `<g class="dw-cv">${caravan}</g>` +
      `<g class="dw-dd"><path d="M90 852C80 780 60 700 46 636H150C130 700 110 780 102 852Z" fill="${SAND}" fill-opacity=".11"/>` +
      `<g fill="none" stroke="#c88a50" stroke-opacity=".24" stroke-width="3">${devil}</g></g>` +
      dune(-240, 1000, 150, 838, 930, '#170c06', '#0a0503', 0.3, 3) +
      dune(480, 1660, 860, 890, 975, '#140a05', '#090402', 0.2, 2) +
      `<g class="dw-sdg">${spindrift}</g>` +
      '<g class="dw-gust" fill="url(#dw-gs)"><ellipse cx="160" cy="760" rx="420" ry="110"/><ellipse cx="560" cy="730" rx="360" ry="80"/>' +
      '<ellipse cx="900" cy="800" rx="380" ry="90"/><ellipse cx="380" cy="860" rx="480" ry="80"/><ellipse cx="40" cy="680" rx="260" ry="120"/></g>' +
      `<g fill="#e8bc7c">${gusts}</g>` +
      '</g>' +
      `<g class="mv-t"><g class="dw-cap">${storm.cap}</g></g>` +
      // Sand streaks: a light breeze always, a storm when it blows.
      `<g class="dw-wind"><g transform="rotate(-90)">${rain({ seed: 41, count: 14, length: [30, 90], slant: 30, seconds: 3.2, stroke: SAND, opacity: 0.12, box: [-1000, -100, 440, 1800] })}</g></g>` +
      `<g class="dw-storm"><g transform="rotate(-90)">${rain({ seed: 43, count: 22, length: [50, 140], slant: 60, seconds: 1.1, stroke: '#e0b070', opacity: 0.2, box: [-1000, -100, 700, 1800] })}</g></g>`,
    nook:
      '<defs><linearGradient id="dw-wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d110a"/><stop offset="1" stop-color="#120a06"/></linearGradient>' +
      '<radialGradient id="dw-lng"><stop offset="0" stop-color="#ffc060" stop-opacity=".34"/><stop offset=".45" stop-color="#ffa040" stop-opacity=".1"/><stop offset="1" stop-color="#ffa040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="dw-sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8bc7c" stop-opacity=".3"/><stop offset="1" stop-color="#d8a060" stop-opacity=".8"/></linearGradient>' +
      '<radialGradient id="dw-pf"><stop offset="0" stop-color="#e0b070" stop-opacity=".4"/><stop offset="1" stop-color="#e0b070" stop-opacity="0"/></radialGradient></defs>' +
      // The back wall of woven goat hair, its band of invented marks, the sand floor and a rug.
      '<rect x="-140" y="40" width="620" height="420" fill="url(#dw-wl)"/>' +
      `<g fill="#22140b">${[96, 196, 286, 376].map(y => `<rect x="-140" y="${y}" width="620" height="8"/>`).join('')}</g>` +
      `<rect x="-140" y="128" width="620" height="30" fill="#24130a"/><path d="${band}" fill="#6a2e16" fill-opacity=".55"/><path d="${diamonds}" fill="#a08660" fill-opacity=".35"/>` +
      '<path d="M-150 440Q100 428 480 438V470H-150Z" fill="#2a180d"/>' +
      '<path d="M40 440H420L452 466H6Z" fill="#4a1c10"/><path d="M30 448H430M20 457H440" stroke="#8a4a22" stroke-opacity=".6" stroke-width="3"/>' +
      // The poles.
      '<g fill="#2e1c10"><rect x="26" y="-60" width="8" height="516"/><rect x="408" y="-72" width="8" height="402"/></g>' +
      // The flap, tied back to the pole: it tears loose on an error.
      '<g class="dw-flap"><path d="M-130 66L30 58L30 456L-12 456C-2 384 6 310 16 268C-22 236 -90 160 -130 66Z" fill="#3e2616" stroke="#6a4226" stroke-width="2"/>' +
      '<path d="M-90 70C-54 160 -20 230 10 262M-50 68C-26 150 -4 220 16 262M14 300C10 360 4 410 -2 456" fill="none" stroke="#5c3a20" stroke-width="5"/>' +
      `<path d="M-112 68C-74 160 -30 232 8 264M-28 66C-12 150 4 218 18 262M22 300C20 360 18 410 16 456" fill="none" stroke="${RUST}" stroke-opacity=".8" stroke-width="3"/></g>` +
      '<ellipse cx="22" cy="266" rx="10" ry="4" fill="none" stroke="#8a6a3a" stroke-width="2.4"/><path d="M24 270Q28 290 22 306" fill="none" stroke="#8a6a3a" stroke-width="2"/>' +
      // The roof and its valance fringe; the guy ropes; the torn edge and the rip.
      '<g class="dw-roof"><path d="M-150 78L-136 14L30 -54Q222 -22 412 -66L486 -4V70Q448 62 412 60Q222 104 30 60Q-60 70 -150 78Z" fill="#120a06" stroke="#2a190e" stroke-width="2"/>' +
      '<path d="M-140 44Q-60 24 30 -10Q222 24 412 -22L480 22M-144 62Q-60 46 30 24Q222 58 412 18L482 46" fill="none" stroke="#21130b" stroke-width="6"/>' +
      '<path d="M-150 78Q-60 70 30 60Q222 104 412 60Q448 62 486 70" fill="none" stroke="#5a2a16" stroke-width="4"/>' +
      `<path d="${fringe}" stroke="${SAND}" stroke-opacity=".4" stroke-width="2"/>` +
      `<g fill="#4a301a"><circle cx="30" cy="-62" r="6"/><circle cx="412" cy="-74" r="6"/></g>` +
      '<path class="dw-rip" d="M286 70L294 78L289 84L300 88L295 96L306 92L312 80Z" fill="#050302"/></g>' +
      '<path d="M-136 16L-262 460M30 -58L-176 460" stroke="#2a1a10" stroke-opacity=".85" stroke-width="2"/><g fill="#3a2414"><rect x="-268" y="448" width="6" height="12"/><rect x="-182" y="448" width="6" height="12"/></g>' +
      '<path class="dw-torn" d="M-150 78L-138 92L-128 80L-116 96L-104 82L-92 94L-80 76" fill="none" stroke="#2e1c10" stroke-width="2.4"/>' +
      // The map that unrolls when Claude reads.
      '<path d="M150 84H252" stroke="#3a2414" stroke-width="5" stroke-linecap="round"/>' +
      `<g class="dw-map"><rect x="154" y="86" width="94" height="88" fill="${PAPER}" fill-opacity=".88" stroke="#8a6a3a" stroke-width="2"/>` +
      '<path d="M160 120Q180 108 200 118T240 112M160 146Q184 134 206 144T244 138" fill="none" stroke="#8a6a3a" stroke-opacity=".7" stroke-width="1.6"/>' +
      '<circle cx="226" cy="102" r="6" fill="#3a8a7a" fill-opacity=".7"/><path class="dw-route" d="M164 166C180 150 196 160 206 136C214 118 220 110 226 102" fill="none" stroke="#a03a1e" stroke-width="2.2"/></g>' +
      // The lantern on its cord.
      '<g transform="translate(386 72)"><g class="dw-lan"><circle class="dw-lgl" cx="0" cy="52" r="120" fill="url(#dw-lng)"/><path d="M0 0V30" stroke="#2a1a0e" stroke-width="2"/>' +
      `<path d="M-8 30H8L11 38H-11Z" fill="${BRASS}"/><rect x="-9" y="38" width="18" height="26" fill="#ffcf70" fill-opacity=".85" stroke="${BRASS}" stroke-width="2"/>` +
      `<path d="M-4 41V61M4 41V61" stroke="#7a5420" stroke-width="1.4"/><path d="M0 44Q5 52 0 60Q-5 52 0 44Z" fill="#fff2c8"/><path d="M-11 64H11L8 70H-8Z" fill="${BRASS}"/></g></g>` +
      // Dust from the haboob hazing the tent's air.
      '<rect class="dw-dust" x="26" y="64" width="460" height="396" fill="#8a5a2e"/>',
    front:
      // Sand pouring through the rip onto the keyboard, the pile it makes, its splashes and dust.
      '<circle class="dw-puff" cx="300" cy="318" r="40" fill="url(#dw-pf)"/>' +
      `<g class="dw-pour">${pour}</g>` +
      `<g fill="#f0c890">${grains}</g>` +
      '<g class="dw-pile"><path d="M222 331C248 326 276 316 300 315C326 316 352 325 376 331Z" fill="#c8945a"/>' +
      '<path d="M300 315C326 316 352 325 376 331H322C318 324 310 318 300 315Z" fill="#9a6a3a"/><path d="M252 326Q280 317 298 317" fill="none" stroke="#f0d09a" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M226 331H240L237 352L231 352Z" fill="#c8945a" fill-opacity=".8"/></g>' +
      splash,
  }
}
