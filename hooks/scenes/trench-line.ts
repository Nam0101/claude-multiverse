import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Trench Line: a field radio operator in a timber-lined dugout at the edge of a rain-soaked no-man's-land at night.
// Shattered trees and coils of wire stand in the mud, a parachute flare drifts down over the field. When a command
// runs, flares climb from the trench and light the field warm; an error slumps the dugout's wall in a mudslide;
// done stops the rain, breaks the dawn and lands a small bird on the wire over the dugout.
const GOLD = '#d9c27a'
const FLARE = '#fff3c8'
const OLIVE = '#3a3d28'
const OLIVE_EDGE = '#5a5d3e'
const TIMBER = '#251c12'
const TIMBER_EDGE = '#3b2d1c'
const BAG = '#2b2719'
const BAG_EDGE = '#14120b'
const BAG_LIT = '#4f4832'
const MUD = '#4e3b22'
const MUD_WET = '#a88a5a'
const SIL = '#060605'

/** A whole number, for the long generated paths. */
const n = (value: number): string => String(Math.round(value))

/** One sandbag as a pillow: pinched ends, bulging top and bottom. */
const pillow = (x: number, y: number, w: number, h: number): string =>
  `M${n(x)} ${n(y + h / 2)}Q${n(x + w / 2)} ${n(y - h * 0.35)} ${n(x + w)} ${n(y + h / 2)}Q${n(x + w / 2)} ${n(y + h * 1.35)} ${n(x)} ${n(y + h / 2)}Z`

/** Rows of sandbags laid like bricks, half a bag over each row: one path of bags, one of their wet top edges. */
function bags(next: () => number, x0: number, x1: number, y: number, rows: number, w: number, h: number): { body: string; lit: string } {
  let body = ''
  let lit = ''

  for (let r = 0; r < rows; r += 1) {
    const top = y + r * h * 0.86

    for (let x = x0 - (r % 2) * w * 0.5; x < x1; x += w * 0.94) {
      const bw = w * (0.92 + next() * 0.16)
      const by = top + (next() - 0.5) * h * 0.12

      body += pillow(x, by, bw, h)
      lit += `M${n(x + bw * 0.2)} ${n(by + h * 0.18)}Q${n(x + bw / 2)} ${n(by)} ${n(x + bw * 0.8)} ${n(by + h * 0.18)}`
    }
  }

  return { body, lit }
}

const bagWall = (b: { body: string; lit: string }, fill: string, lit: string): string =>
  `<path d="${b.body}" fill="${fill}" stroke="${BAG_EDGE}" stroke-width="2"/>` +
  `<path d="${b.lit}" fill="none" stroke="${lit}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`

/** Rain that loops without a seam, as one path per layer: each streak falls `slant` sideways per 1000 down. */
function drizzle(seed: number, count: number, length: readonly [number, number], slant: number, seconds: number, stroke: string, opacity: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const len = length[0] + next() * (length[1] - length[0])

    d += `M${n(-100 + next() * 1900)} ${n(next() * 1000)}l${n((len * slant) / 1000)} ${n(len)}`
  }

  return (
    `<g stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2" stroke-linecap="round">` +
    `<g class="tl-fall" style="--sx:${slant}px;animation-duration:${seconds}s"><path d="${d}"/><path transform="translate(${-slant} -1000)" d="${d}"/></g></g>`
  )
}

/** A concertina of wire seen from the side: loops of radius `r`, one every `gap`. */
function coil(x0: number, x1: number, y: number, r: number, gap: number, steps = 8): string {
  const a = gap / (Math.PI * 2)
  const count = Math.ceil((x1 - x0) / gap) * steps
  const points: string[] = []

  for (let i = 0; i <= count; i += 1) {
    const t = (i / steps) * Math.PI * 2

    points.push(`${n(x0 + a * t + r * 0.62 * Math.sin(t))} ${n(y - r * 0.9 * Math.cos(t))}`)
  }

  return `M${points.join('L')}`
}

/** A strand of barbed wire sagging between two posts, with its barbs. */
function strand(x0: number, y0: number, x1: number, y1: number, sag: number, every: number): string {
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2 + sag * 2
  let d = `M${x0} ${y0}Q${f(mx)} ${f(my)} ${x1} ${y1}`
  const barbs = Math.floor(Math.abs(x1 - x0) / every)

  for (let i = 1; i < barbs; i += 1) {
    const t = i / barbs
    const px = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1
    const py = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1

    d += `M${f(px - 3)} ${f(py - 3)}l6 6m0 -6l-6 6`
  }

  return d
}

/** A shell-shattered tree: a tapering trunk, a splintered top, broken stubs; and a rim on the side the flares light. */
function tree(x: number, base: number, top: number, w: number, lean: number, seed: number, stubs: number, rimRight: boolean): { body: string; rim: string } {
  const next = random(seed)
  const h = base - top
  const left: string[] = []
  const right: string[] = []
  let topLeft = 0
  let topRight = 0

  for (let i = 0; i <= 6; i += 1) {
    const t = i / 6
    const c = x + lean * h * t
    const hw = (w / 2) * (i === 0 ? 1.7 : 1 - 0.42 * t)
    const wob = (next() - 0.5) * w * 0.12

    left.push(`${f(c - hw + wob)} ${f(base - h * t)}`)
    right.push(`${f(c + hw + wob)} ${f(base - h * t)}`)
    topLeft = c - hw + wob
    topRight = c + hw + wob
  }

  const teeth = [1, 2, 3, 4].map(k => `${f(topLeft + ((topRight - topLeft) * k) / 5)} ${f(top - (k % 2 ? 22 + next() * 48 : 2 + next() * 10))}`)
  let body = `M${left.join('L')}L${teeth.join('L')}L${right.slice().reverse().join('L')}Z`

  for (let s = 0; s < stubs; s += 1) {
    const t = 0.42 + next() * 0.4
    const side = s % 2 ? 1 : -1
    const y = base - h * t
    const ex = x + lean * h * t + side * w * 0.3
    const len = 34 + next() * 50

    body += `M${f(ex)} ${f(y + 7)}L${f(ex + side * len)} ${f(y - len * 0.72)}L${f(ex + side * (len - 8))} ${f(y - len * 0.72 + 9)}L${f(ex)} ${f(y - 6)}Z`
  }

  return { body, rim: `M${(rimRight ? right : left).slice(1).join('L')}` }
}

/** A parachute flare hung from its canopy's apex at (0, 0): canopy, shrouds, smoke, the burning flare and its halo. */
function flareBody(pop: string): string {
  return (
    '<path d="M0 -4c-7 -20 9 -36 0 -58s7 -36 -2 -62" fill="none" stroke="#7d7a66" stroke-opacity=".2" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M-15 8C-13 -5 13 -5 15 8Z" fill="#cfc7a4" fill-opacity=".55"/>' +
    '<path d="M-15 8L0 30M0 8V30M15 8L0 30" stroke="#cfc7a4" stroke-opacity=".45" stroke-width="1"/>' +
    `<g class="tl-flk"><circle class="${pop}" cy="32" r="30" fill="url(#tl-halo)"/><circle cy="32" r="4.6" fill="${FLARE}"/></g>`
  )
}

/** One flare fired while a command runs: its streak climbs from the trench, then it hangs and drifts down, lighting the field. */
function runFlare(x: number, from: number, at: number, dx: number, dy: number, delay: number): string {
  return (
    `<g style="--t:${delay}s"><g transform="translate(${x} ${from})"><g class="tl-up" style="--h:${at + 32 - from}px">` +
    `<path d="M0 0V48" stroke="url(#tl-trail)" stroke-width="3" stroke-linecap="round"/><circle r="3.6" fill="${FLARE}"/></g></g>` +
    `<g transform="translate(${x} ${at})"><g class="tl-fl" style="--dx:${dx}px;--dy:${dy}px">` +
    '<circle class="tl-big" cy="32" r="400" fill="url(#tl-fglow)"/>' +
    `<g class="tl-sw"><g transform="scale(1.25)">${flareBody('tl-pop')}</g></g></g></g></g>`
  )
}

/** The field radio on the desk: an olive set with dial, meter and handset, a rugged laptop, and a telegraph key. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'responding' || activity === 'tool' || activity === 'web' || activity === 'run' ? ' tl-busy' : ''
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const waves =
    activity === 'web'
      ? [0, 0.5, 1].map(d => `<circle class="tl-wave" style="animation-delay:${d}s" cx="411" cy="156" r="16" fill="none" stroke="${light}" stroke-width="2"/>`).join('')
      : ''

  return (
    // The whip antenna, the set's case and its face: a tuning dial, two knobs, a lit meter.
    `<g transform="translate(408 250)"><g class="tl-whip"><path d="M0 0L3 -92" stroke="#7a7650" stroke-width="2.4"/><circle cx="3" cy="-94" r="3.2" fill="${light}"/></g></g>` +
    waves +
    `<rect x="352" y="248" width="64" height="82" rx="4" fill="${OLIVE}" stroke="${OLIVE_EDGE}" stroke-width="2"/>` +
    '<rect x="357" y="254" width="54" height="70" rx="2" fill="none" stroke="#22241a" stroke-width="2"/>' +
    '<circle cx="384" cy="274" r="12" fill="#11120c" stroke="#7a7650" stroke-width="2"/>' +
    `<path d="M384 265v3M375 274h3M393 274h-3M378 268l2 2M390 268l-2 2" stroke="${light}" stroke-opacity=".6" stroke-width="1.4"/>` +
    `<g transform="translate(384 274)"><path class="tl-ndl${busy}" d="M0 0V-9" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/></g>` +
    '<g fill="#17180f" stroke="#7a7650" stroke-width="1.4"><circle cx="404" cy="266" r="3.6"/><circle cx="404" cy="282" r="3.6"/></g>' +
    '<rect x="370" y="292" width="38" height="18" rx="2" fill="#1a1a10" stroke="#7a7650" stroke-width="1.4"/>' +
    `<rect x="372" y="294" width="34" height="14" fill="${light}" fill-opacity=".3"/>` +
    `<g transform="translate(389 308)"><path class="tl-mt${busy}" d="M0 0L-5 -12" stroke="#14140c" stroke-width="1.8"/></g>` +
    // The handset on its cradle along the top, its cord curling down the side.
    '<path d="M354 246C354 238 362 236 368 240H402C408 236 416 238 416 246Z" fill="#1c1d14" stroke="#4a4a34" stroke-width="1.6"/>' +
    '<path d="M416 256c6 4 -5 8 1 12s-5 8 1 12s-5 8 1 12s-5 8 1 12" fill="none" stroke="#1c1d14" stroke-width="2.2"/>' +
    // The rugged laptop.
    `<rect x="246" y="323" width="96" height="7" rx="2" fill="${OLIVE}"/><rect x="244" y="322" width="6" height="9" rx="2" fill="#22241a"/>` +
    keys +
    `<path d="M334 327L360 238L370 240L344 329Z" fill="${OLIVE}" stroke="${OLIVE_EDGE}" stroke-width="1.2"/>` +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The telegraph key in front of the set.
    '<rect x="360" y="322" width="58" height="8" rx="1.5" fill="#2c2215" stroke="#4a3a24" stroke-width="1.4"/>' +
    '<rect x="401" y="314" width="6" height="9" fill="#a08a4a"/>' +
    `<g transform="translate(404 316)"><g class="tl-key${busy}"><path d="M-30 0H12" stroke="#b39c5c" stroke-width="3" stroke-linecap="round"/>` +
    '<ellipse cx="-30" cy="-2" rx="6" ry="3.4" fill="#141510" stroke="#b39c5c" stroke-width="1.4"/></g></g>'
  )
}

export function trenchLineWorld(): World {
  const next = random(1916)

  // The sky's low clouds, in two banks that drift apart at dawn.
  const clouds = (x0: number): string =>
    Array.from({ length: 6 }, (_, i) => {
      const x = x0 + i * 150 + next() * 60
      const y = 10 + next() * 170
      const rx = 190 + next() * 120
      const ry = 56 + next() * 40

      return (
        `<ellipse cx="${f(x)}" cy="${f(y + 10)}" rx="${f(rx * 0.92)}" ry="${f(ry)}" fill="#14140e"/>` +
        `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${i % 2 ? '#0a0b08' : '#0c0d0a'}"/>`
      )
    }).join('')

  // The far edge of no-man's-land: low mounds and the stumps of a wood.
  let horizon = 'M-40 604'
  for (let x = -40; x <= 1680; x += 80) horizon += `L${f(x + 40)} ${f(588 + next() * 18)}`
  horizon += 'L1680 1000H-40Z'
  let stumps = ''
  for (let i = 0; i < 18; i += 1) {
    const x = 440 + i * 46 + next() * 24
    const h = 14 + next() * 40

    stumps += `M${f(x)} 600L${f(x + 2)} ${f(600 - h)}L${f(x + 4)} ${f(606 - h)}L${f(x + 6)} 600Z`
  }

  // Shell holes, each with a puddle that catches the flare light, and ripples in the rain.
  const craters = ([
    [130, 724, 74], [520, 688, 48], [760, 742, 70], [1010, 702, 56], [300, 650, 40],
  ] as const)
    .map(
      ([cx, cy, rx]) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * 0.24)}" fill="#050504"/>` +
        `<ellipse cx="${cx}" cy="${f(cy + 2)}" rx="${f(rx * 0.7)}" ry="${f(rx * 0.13)}" fill="#1b1b15"/>` +
        `<path class="tl-gl" d="M${f(cx - rx * 0.45)} ${f(cy + 1)}h${f(rx * 0.5)}" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`,
    )
    .join('')
  const ripples = ([
    [120, 726, 0], [150, 728, -0.6], [520, 690, -1.1], [780, 744, -0.3], [300, 652, -0.5],
  ] as const)
    .map(([x, y, d]) => `<ellipse class="tl-rip" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="12" ry="3" fill="none" stroke="#9aa08a" stroke-width="1.2"/>`)
    .join('')

  // The wire belt across the field: pickets, two strands, and a concertina coil.
  let pickets = ''
  let belt = ''
  let lastX = -30
  let lastTop = 0
  for (let x = -30; x <= 1660; x += 76) {
    const lean = (next() - 0.5) * 12
    const base = 714 + (next() - 0.5) * 10
    const top = base - 56 - next() * 14

    pickets += `M${f(x)} ${f(base)}L${f(x + lean)} ${f(top)}`
    if (x > -30) belt += `M${f(lastX)} ${f(lastTop + 6)}Q${f((lastX + x) / 2)} ${f((lastTop + top) / 2 + 16)} ${f(x + lean)} ${f(top + 6)}`
    lastX = x + lean
    lastTop = top
  }

  // The shattered wood: three trees on the left, two at the far right.
  const treeA = tree(214, 694, 150, 52, -0.04, 3, 3, true)
  const treeB = tree(66, 722, 312, 32, 0.12, 5, 2, true)
  const treeC = tree(372, 684, 476, 24, -0.14, 9, 1, false)
  const treeD = tree(1496, 600, 160, 40, 0.05, 13, 3, false)
  const treeE = tree(1330, 610, 402, 20, -0.12, 17, 1, false)
  const trees = (list: { body: string; rim: string }[]): string =>
    `<path d="${list.map(t => t.body).join('')}" fill="${SIL}"/>` +
    `<path class="tl-rim" d="${list.map(t => t.rim).join('')}" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2.4" stroke-linejoin="round"/>`

  // The parapet in front: sandbags stepping down from the left, a low wall across the middle.
  const parapetHigh = bags(next, -40, 300, 752, 5, 72, 34)
  const parapetLow = bags(next, 280, 520, 798, 5, 64, 32)
  const middle = bags(next, 500, 1160, 900, 2, 80, 34)

  // Done: poppies open on the parapet.
  const poppies = ([
    [54, 750, 0.9], [138, 744, 1.3], [236, 756, 1.1], [420, 800, 1.6],
  ] as const)
    .map(
      ([x, y, d]) =>
        `<g transform="translate(${x} ${y})"><g class="tl-bloom" style="animation-delay:${d}s"><path d="M0 0Q-3 -12 1 -24" fill="none" stroke="#3f4a26" stroke-width="2.4"/>` +
        '<g fill="#b8432c"><circle cx="-5" cy="-27" r="6"/><circle cx="6" cy="-28" r="6"/><circle cx="1" cy="-33" r="6"/></g><circle cx="1" cy="-28" r="2.4" fill="#120c08"/></g></g>',
    )
    .join('')

  // The signpost by the parapet, its boards painted with marks of nobody's alphabet.
  const signpost =
    '<path d="M300 800V668" stroke="#1d160d" stroke-width="9"/>' +
    '<path d="M232 676H300V696H232L222 686Z" fill="#2e2416" stroke="#4a3a24" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M300 704H372L382 714L372 724H300Z" fill="#2e2416" stroke="#4a3a24" stroke-width="2" stroke-linejoin="round"/>' +
    '<g fill="#bfb08a" fill-opacity=".45"><circle cx="246" cy="686" r="3"/><rect x="256" y="681" width="4" height="10"/><rect x="266" y="684" width="18" height="4"/>' +
    '<rect x="312" y="712" width="14" height="4"/><circle cx="336" cy="714" r="3"/><rect x="346" y="709" width="4" height="10"/><circle cx="360" cy="714" r="2"/></g>'

  // The field telephone wire from the dugout along the trench.
  const wire = 'M1160 862C960 904 720 882 520 852S220 798 -30 812'

  // The searchlight's beam, swept over the sky while a tool runs, from behind the dugout.
  const beam =
    '<g transform="translate(1380 598)"><g class="tl-beam"><path d="M0 0L-80 -900H80Z" fill="url(#tl-beamg)"/></g></g>'

  // The dugout's planks and its outer sandbag pile.
  let seams = ''
  let joints = ''
  for (let y = 94; y < 440; y += 24) {
    seams += `M-28 ${y}H430`
    for (let x = -28 + next() * 120; x < 430; x += 120 + next() * 120) joints += `M${f(x)} ${y}v24`
  }
  const pile = bags(next, -176, -60, 300, 5, 62, 34)
  const roof = bags(next, -116, 440, -32, 2, 76, 36)
  const roofTop = bags(next, -40, 300, -62, 1, 80, 30)
  const planks = ([
    [104, 18, 300, 28, 0.05], [150, 26, 240, -22, 0.15], [196, 10, 172, 14, 0.24], [242, 22, 112, -30, 0.3], [288, 8, 62, 18, 0.38], [334, 14, 24, -10, 0.44],
  ] as const)
    .map(
      ([y, x, dy, r, d]) =>
        `<g transform="translate(24 ${y})"><g class="tl-pl" style="--x:${x}px;--y:${dy}px;--r:${r}deg;--d:${d}s">` +
        `<rect x="-52" y="-20" width="104" height="40" rx="3" fill="#3a2c1c" stroke="#54412a" stroke-width="2"/>` +
        '<path d="M-44 -6H40M-40 8H30" stroke="#17110a" stroke-width="1.4"/></g></g>',
    )
    .join('')
  const clods = ([
    [-10, 0, 7, 10], [14, 0.18, 9, 24], [40, 0.36, 6, 4], [-2, 0.55, 8, 30], [26, 0.74, 6, 16], [56, 0.92, 7, 8],
  ] as const)
    .map(
      ([x, d, r, dx]) =>
        `<g transform="translate(${x} 78)"><ellipse class="tl-clod" style="--d:${d}s;--x:${dx}px" rx="${r}" ry="${f(r * 0.75)}" fill="#5a4428" stroke="#7a6240" stroke-width="1.4"/></g>`,
    )
    .join('')
  const drips = [-66, -40, 412]
    .map((x, i) => `<rect class="tl-drip" style="animation-delay:${f(-i * 0.45)}s" x="${x}" y="72" width="2" height="9" rx="1" fill="#b8bea6"/>`)
    .join('')
  const duckboard = Array.from({ length: 31 }, (_, i) => `M${-44 + i * 15} 440h10v16h-10z`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#060604',
      furniture: TIMBER,
      metal: OLIVE,
      paper: '#d8d0b0',
      light: { idle: '#8a7c4a', work: GOLD, bright: '#f2e4b0' },
      headTop: 226,
      glowAt: [345, 284],
      device,
      wear: {
        // The rain cape hangs from the shoulders and flares out past the body on both sides.
        behind:
          '<path d="M56 262C58 250 98 246 150 246C202 246 242 250 244 262L256 358C226 368 74 368 44 358Z" fill="#2d301f" stroke="#454832" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M50 300L46 352M250 300L254 352" stroke="#7a7e62" stroke-opacity=".45" stroke-width="2"/>',
        // The cape's front drape stays below the eyes; the brimmed steel helmet stays above them.
        front:
          '<path d="M64 320C100 330 200 330 236 320L246 358C204 366 96 366 54 358Z" fill="#33361f" stroke="#4a4d33" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M98 332L94 360M150 334V364M202 332L206 360" stroke="#1f2114" stroke-width="2"/>' +
          '<path d="M72 327C112 335 188 335 228 327" fill="none" stroke="#8a8e6e" stroke-opacity=".4" stroke-width="1.6"/>' +
          '<path d="M88 240C90 214 116 200 150 200C184 200 210 214 212 240Z" fill="#3b3e29" stroke="#585b3d" stroke-width="2"/>' +
          '<path d="M44 243C70 235 230 235 256 243C257 247 253 250 248 251C200 246 100 246 52 251C47 250 43 247 44 243Z" fill="#30331f" stroke="#5f6242" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M120 210C134 204 150 203 166 205" fill="none" stroke="#a3a27a" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M196 214C204 222 208 230 209 238" fill="none" stroke="#a3a27a" stroke-opacity=".3" stroke-width="2"/>' +
          '<circle class="tl-drop" cx="48" cy="253" r="2" fill="#c8ccb4"/><circle class="tl-drop" style="animation-delay:-1.2s" cx="252" cy="253" r="2" fill="#c8ccb4"/>',
      },
      seatArt:
        // A stack of sandbags, the top one under the critter.
        `<path d="${pillow(100, 348, 104, 28)}${pillow(90, 372, 64, 30)}${pillow(148, 372, 64, 30)}${pillow(96, 398, 110, 30)}${pillow(88, 424, 62, 32)}${pillow(146, 424, 66, 32)}" ` +
        'fill="#3a3524" stroke="#17140d" stroke-width="2"/>' +
        '<path d="M118 356Q152 346 186 356M104 380Q122 374 140 380M162 380Q180 374 198 380M110 406Q150 398 192 406" fill="none" stroke="#615a40" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M100 362l-6 -3M100 362l-6 4M204 362l6 -3M204 362l6 4" stroke="#615a40" stroke-width="1.6"/>',
      tableArt:
        // A plank on a stake and a supply crate.
        `<rect x="166" y="330" width="304" height="12" rx="1.5" fill="#2a2015" stroke="${TIMBER_EDGE}" stroke-width="1.6"/>` +
        '<path d="M176 336H300M320 337H460" stroke="#1a130b" stroke-width="1.2"/><g fill="#7a6a4a"><circle cx="174" cy="336" r="1.6"/><circle cx="462" cy="336" r="1.6"/></g>' +
        `<path d="M180 342H194L192 456H182Z" fill="${TIMBER}" stroke="${TIMBER_EDGE}" stroke-width="1.4"/>` +
        `<rect x="364" y="342" width="102" height="114" fill="#2a2015" stroke="${TIMBER_EDGE}" stroke-width="2"/>` +
        `<path d="M364 380H466M364 418H466" stroke="${TIMBER_EDGE}" stroke-width="2"/>` +
        '<g fill="#a89a6a" fill-opacity=".45"><circle cx="398" cy="399" r="6"/><rect x="410" y="393" width="4" height="12"/><rect x="420" y="397" width="16" height="4"/></g>',
    },
    style:
      // The clouds drift, and part at dawn.
      '.tl-cl{animation:tl-drift 60s ease-in-out infinite alternate}.tl-cl2{animation-direction:alternate-reverse}@keyframes tl-drift{to{transform:translateX(40px)}}' +
      '.st-done .tl-cl{animation:tl-part-l 3.6s ease-out both}.st-done .tl-cl2{animation-name:tl-part-r}' +
      '@keyframes tl-part-l{to{transform:translateX(-340px);opacity:.45}}@keyframes tl-part-r{to{transform:translateX(340px);opacity:.45}}' +
      '@keyframes tl-show{to{opacity:1}}@keyframes tl-off{to{opacity:0}}' +
      // The flare that always hangs over the field: it drifts down, swaying under its canopy, and burns unevenly.
      '.tl-if{animation:tl-if 20s linear -8s infinite}' +
      '@keyframes tl-if{0%{opacity:0;transform:translate(0,0)}5%,88%{opacity:1}100%{opacity:0;transform:translate(70px,380px)}}' +
      '.st-done .tl-ifo{animation:tl-off 1.6s ease-out both}' +
      '.tl-sw{animation:tl-sw 3.4s ease-in-out infinite alternate}@keyframes tl-sw{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.tl-flk{animation:tl-flk .8s ease-in-out infinite alternate}@keyframes tl-flk{from{opacity:.8}to{opacity:1}}' +
      // Run: flares climb from the trench one after another, catch and drift down; the field warms under them.
      '.tl-up,.tl-fl,.tl-big{opacity:0}' +
      '.st-run .tl-up{animation:tl-up 10s ease-out var(--t) infinite}' +
      '@keyframes tl-up{0%{opacity:0;transform:translateY(0)}1%{opacity:1}7%{opacity:1;transform:translateY(var(--h))}7.6%,100%{opacity:0;transform:translateY(var(--h))}}' +
      '.st-run .tl-fl{animation:tl-fl 10s linear var(--t) infinite}' +
      '@keyframes tl-fl{0%,6.8%{opacity:0;transform:translate(0,0)}8.8%{opacity:1;transform:translate(0,6px)}86%{opacity:1;transform:translate(var(--dx),var(--dy))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-run .tl-big{animation:tl-big 10s linear var(--t) infinite}@keyframes tl-big{0%,7%{opacity:0}20%{opacity:1}80%{opacity:.8}100%{opacity:0}}' +
      '.tl-pop{transform-box:fill-box;transform-origin:center}.st-run .tl-pop{animation:tl-pop 10s ease-out var(--t) infinite}' +
      '@keyframes tl-pop{0%,6.8%{transform:scale(.2)}9%{transform:scale(1.3)}12%,100%{transform:scale(1)}}' +
      '.tl-lit{opacity:0}.st-run .tl-lit{animation:tl-show 2s ease-in-out .9s both}' +
      '.tl-rim,.tl-gl{opacity:.3}.st-run .tl-rim,.st-run .tl-gl{animation:tl-show 2s ease-out 1s both}' +
      // Mist over the field, thicker while thinking; ripples in the puddles.
      '.tl-mist{opacity:.6;animation:tl-mist 24s ease-in-out infinite alternate}@keyframes tl-mist{to{transform:translateX(60px)}}' +
      '.st-thinking .tl-mist{opacity:1}' +
      '.tl-rip{transform-box:fill-box;transform-origin:center;opacity:0;animation:tl-rip 1.6s ease-out infinite}' +
      '@keyframes tl-rip{0%{opacity:.6;transform:scale(.2)}100%{opacity:0;transform:scale(1)}}' +
      // The rain: harder on an error, gone at dawn.
      '.tl-fall{animation:tl-fall 1s linear infinite}@keyframes tl-fall{to{transform:translate(var(--sx),1000px)}}' +
      '.tl-heavy{opacity:0}.st-error .tl-heavy{animation:tl-show .8s ease-out both}' +
      '.st-done .tl-rain{animation:tl-off 2.2s ease-out both}.st-done .tl-rip,.st-done .tl-drip{animation:none;opacity:0}' +
      '.tl-drip{opacity:0;animation:tl-drip 1.3s ease-in infinite}' +
      '@keyframes tl-drip{0%{opacity:0;transform:translateY(0)}10%,90%{opacity:.8}90%{transform:translateY(370px)}100%{opacity:0;transform:translateY(378px)}}' +
      '.tl-drop{opacity:0;animation:tl-drop 2.4s ease-in infinite}@keyframes tl-drop{0%,40%{opacity:0;transform:translateY(0)}50%{opacity:.85}100%{opacity:0;transform:translateY(26px)}}' +
      // Tool: a searchlight sweeps the clouds. Web: signals run down the field telephone wire.
      '.tl-beam{opacity:0;transform:rotate(-30deg)}.st-tool .tl-beam{animation:tl-show .6s ease-out both,tl-sweep 3.4s ease-in-out infinite alternate}' +
      '@keyframes tl-sweep{from{transform:rotate(-40deg)}to{transform:rotate(-6deg)}}' +
      '.tl-pulse{opacity:0;stroke-dasharray:16 184}.st-web .tl-pulse{opacity:1;animation:tl-pulse 1.4s linear infinite}@keyframes tl-pulse{to{stroke-dashoffset:200}}' +
      '.tl-wave{transform-box:fill-box;transform-origin:center;opacity:0;animation:tl-wave 1.5s ease-out infinite}' +
      '@keyframes tl-wave{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}' +
      // The radio: the key taps, the needles hunt, the whip sways.
      '.tl-busy.tl-key{animation:tl-tap .5s ease-in-out infinite}@keyframes tl-tap{0%,55%,100%{transform:rotate(0)}68%,86%{transform:rotate(-6deg)}}' +
      '.st-tool .tl-key,.st-web .tl-key{animation-duration:.34s}' +
      '.tl-ndl{animation:tl-ndl 5s ease-in-out infinite alternate}@keyframes tl-ndl{from{transform:rotate(-50deg)}to{transform:rotate(40deg)}}' +
      '.tl-busy.tl-ndl{animation-duration:1.3s}' +
      '.tl-mt{animation:tl-mt 3s ease-in-out infinite alternate}@keyframes tl-mt{from{transform:rotate(-14deg)}to{transform:rotate(30deg)}}' +
      '.tl-busy.tl-mt{animation-duration:.4s}' +
      '.tl-whip{animation:tl-whip 3.8s ease-in-out infinite alternate}@keyframes tl-whip{from{transform:rotate(-3deg)}to{transform:rotate(4deg)}}' +
      // The lantern swings on its hook; it swings hard and gutters when the wall goes, and pales at dawn.
      '.tl-lamp{--a:5deg;animation:tl-lamp 3.6s ease-in-out infinite alternate}@keyframes tl-lamp{from{transform:rotate(calc(var(--a) * -1))}to{transform:rotate(var(--a))}}' +
      '.st-error .tl-lamp{--a:24deg;animation-duration:.8s}' +
      '.tl-lglow{animation:tl-flk 2.2s ease-in-out infinite alternate}.st-error .tl-lglow{animation:tl-gut .5s ease-in-out infinite alternate}@keyframes tl-gut{from{opacity:.5}to{opacity:1}}' +
      '.st-done .tl-lglow{animation:tl-dim 2.4s ease-out both}@keyframes tl-dim{to{opacity:.45}}' +
      // Read: a route is pencilled across the trench map.
      '.tl-route{stroke-dasharray:1;stroke-dashoffset:1}.st-read .tl-route{animation:tl-draw 1.4s ease-out .2s both}@keyframes tl-draw{to{stroke-dashoffset:0}}' +
      // Error: the revetment gives way: the post leans, the planks fall, the mud slides in and a sandbag drops.
      '.tl-jamb{transform-box:fill-box;transform-origin:50% 100%}.st-error .tl-jamb{animation:tl-jamb .6s ease-out .1s both}@keyframes tl-jamb{to{transform:rotate(-5deg)}}' +
      '.st-error .tl-pl{animation:tl-pl .7s cubic-bezier(.5,0,.9,.6) var(--d) both}@keyframes tl-pl{to{transform:translate(var(--x),var(--y)) rotate(var(--r))}}' +
      '.tl-mud{transform-box:fill-box;transform-origin:50% 0;transform:scale(.6,0)}.st-error .tl-mud{animation:tl-mud 1.3s cubic-bezier(.3,.1,.4,1) .15s both}' +
      '@keyframes tl-mud{from{transform:scale(.6,0)}to{transform:scale(1,1)}}' +
      '.tl-clod{opacity:0}.st-error .tl-clod{animation:tl-clod 1.1s cubic-bezier(.5,0,1,1) var(--d) infinite}' +
      '@keyframes tl-clod{0%{opacity:0;transform:translate(0,0)}8%,85%{opacity:1}85%{transform:translate(var(--x),360px)}100%{opacity:0;transform:translate(var(--x),372px)}}' +
      '.tl-bag{transform-box:fill-box;transform-origin:center}.st-error .tl-bag{animation:tl-bag .9s cubic-bezier(.5,0,1,.6) .1s both}' +
      '@keyframes tl-bag{to{transform:translate(36px,412px) rotate(48deg)}}' +
      '.tl-pool{transform:scaleX(0)}.st-error .tl-pool{animation:tl-pool 1s ease-out .6s both}@keyframes tl-pool{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
      // Done: dawn comes up behind the wood, poppies open, and a small bird flies in to the wire over the dugout.
      '.tl-dawn{opacity:0}.st-done .tl-dawn{animation:tl-show 3s ease-out .2s both}' +
      '.tl-bloom{transform-box:fill-box;transform-origin:50% 100%;transform:scale(0)}.st-done .tl-bloom{animation:tl-bloom 1s ease-out both}' +
      '@keyframes tl-bloom{from{transform:scale(0)}to{transform:scale(1)}}' +
      '.tl-bird{opacity:0}.st-done .tl-bird{animation:tl-bird 2.2s cubic-bezier(.3,.5,.4,1) .2s both}' +
      '@keyframes tl-bird{0%{opacity:0;transform:translate(300px,-250px)}6%{opacity:1}72%{transform:translate(0,-8px)}82%{transform:translate(0,2px)}90%,100%{opacity:1;transform:translate(0,0)}}' +
      '.tl-wing{transform-box:fill-box;transform-origin:50% 100%}.st-done .tl-wing{animation:tl-wing .18s ease-in-out .2s 9 alternate}' +
      '@keyframes tl-wing{to{transform:scaleY(-1.5)}}' +
      '.st-done .tl-perch{animation:tl-perch 2.6s ease-in-out 2.4s infinite}@keyframes tl-perch{0%,70%,100%{transform:rotate(0)}78%,90%{transform:rotate(-12deg)}}' +
      '.tl-perch{transform-box:fill-box;transform-origin:50% 100%}',
    scenery:
      '<defs>' +
      '<linearGradient id="tl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050605"/><stop offset=".4" stop-color="#0a0b08"/>' +
      '<stop offset=".56" stop-color="#15150e"/><stop offset=".6" stop-color="#1c1b12"/><stop offset=".66" stop-color="#0f0e0a"/><stop offset="1" stop-color="#0a0907"/></linearGradient>' +
      '<linearGradient id="tl-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13120b"/><stop offset=".35" stop-color="#0d0c08"/><stop offset="1" stop-color="#080705"/></linearGradient>' +
      '<radialGradient id="tl-mistg"><stop offset="0" stop-color="#3c3a2a" stop-opacity=".4"/><stop offset="1" stop-color="#3c3a2a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="tl-fglow"><stop offset="0" stop-color="${GOLD}" stop-opacity=".26"/><stop offset=".35" stop-color="${GOLD}" stop-opacity=".09"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="tl-halo"><stop offset="0" stop-color="#fff6d6"/><stop offset=".25" stop-color="#ffe8a0" stop-opacity=".6"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="tl-trail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="48"><stop offset="0" stop-color="${FLARE}" stop-opacity=".9"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="tl-pool"><stop offset="0" stop-color="${GOLD}" stop-opacity=".16"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="tl-beamg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8e2c4" stop-opacity=".2"/><stop offset="1" stop-color="#e8e2c4" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="tl-dawng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4656" stop-opacity=".22"/><stop offset=".5" stop-color="#6a5a40" stop-opacity=".26"/>' +
      '<stop offset=".8" stop-color="#d8a868" stop-opacity=".34"/><stop offset="1" stop-color="#d8a868" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="tl-sun"><stop offset="0" stop-color="#f6d896" stop-opacity=".35"/><stop offset=".4" stop-color="#e0b070" stop-opacity=".16"/><stop offset="1" stop-color="#e0b070" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="tl-lampg"><stop offset="0" stop-color="${GOLD}" stop-opacity=".34"/><stop offset=".45" stop-color="${GOLD}" stop-opacity=".1"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#tl-sky)"/>' +
      // Dawn, behind everything that stands on the field.
      '<g class="tl-dawn"><rect width="1600" height="740" fill="url(#tl-dawng)"/><ellipse cx="250" cy="604" rx="420" ry="180" fill="url(#tl-sun)"/></g>' +
      '<ellipse cx="280" cy="330" rx="440" ry="330" fill="url(#tl-pool)"/>' +
      `<g class="tl-cl">${clouds(-120)}</g><g class="tl-cl tl-cl2">${clouds(760)}</g>` +
      // The flare over the field.
      '<g class="tl-ifo"><g transform="translate(280 30)"><g class="tl-if"><circle cy="32" r="420" fill="url(#tl-fglow)"/>' +
      `<g class="tl-sw"><g transform="scale(1.4)">${flareBody('')}</g></g></g></g></g>` +
      `<g class="mv-r">${beam}</g>` +
      // The field.
      `<path d="${horizon}" fill="url(#tl-gnd)"/><path d="${stumps}" fill="#0b0b08"/>` +
      '<ellipse class="tl-mist" cx="300" cy="628" rx="560" ry="64" fill="url(#tl-mistg)"/><ellipse class="tl-mist" cx="900" cy="652" rx="620" ry="52" fill="url(#tl-mistg)"/>' +
      '<g class="mv-r"><ellipse class="tl-mist" cx="1400" cy="620" rx="420" ry="56" fill="url(#tl-mistg)"/></g>' +
      '<ellipse cx="320" cy="700" rx="380" ry="110" fill="url(#tl-pool)"/>' +
      '<g class="tl-lit"><ellipse cx="250" cy="720" rx="520" ry="160" fill="url(#tl-pool)"/><ellipse cx="250" cy="630" rx="460" ry="70" fill="url(#tl-pool)"/><ellipse cx="240" cy="360" rx="480" ry="380" fill="url(#tl-pool)"/></g>' +
      craters +
      ripples +
      `<path d="${pickets}" stroke="#14130d" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${belt}" fill="none" stroke="#34322a" stroke-width="1.4"/>` +
      `<path d="${coil(-40, 1680, 700, 20, 40, 5)}" fill="none" stroke="#34322a" stroke-opacity=".85" stroke-width="1.3"/>` +
      trees([treeA, treeB, treeC]) +
      `<g class="mv-r">${trees([treeD, treeE])}<g class="tl-lit"><ellipse cx="1400" cy="640" rx="320" ry="100" fill="url(#tl-pool)"/></g></g>` +
      // The flares a command sends up.
      runFlare(150, 760, 150, 40, 330, 0) +
      runFlare(330, 780, 224, 30, 270, 0.8) +
      `<g class="mv-r">${runFlare(1300, 600, 108, -30, 300, 0.35)}${runFlare(1470, 600, 186, -40, 260, 1.2)}</g>` +
      // The trench's near side: the parapet, its wire, the signpost, the telephone wire.
      '<g class="mv-b">' +
      '<path d="M-40 770H300L310 812H530L540 906H1170V1000H-40Z" fill="#0d0b07"/>' +
      `<path d="${middle.body}" fill="#1b180f" stroke="${BAG_EDGE}" stroke-width="2"/>` +
      bagWall(parapetLow, BAG, BAG_LIT) +
      bagWall(parapetHigh, BAG, BAG_LIT) +
      signpost +
      `<path d="${coil(-40, 470, 740, 30, 28, 8)}" fill="none" stroke="#5a553f" stroke-opacity=".6" stroke-width="1.7" stroke-linejoin="round"/>` +
      '<path d="M-10 772L-14 700M96 768L100 694M204 772L200 698M310 806L314 734M420 810L416 744" stroke="#0b0a06" stroke-width="6" stroke-linecap="round"/>' +
      poppies +
      `<path d="${wire}" fill="none" stroke="#141209" stroke-width="2.4"/>` +
      `<path class="tl-pulse" d="${wire}" pathLength="1000" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
      '</g>' +
      // The rain, and the harder rain of an error.
      `<g class="tl-rain">${drizzle(31, 64, [24, 46], 140, 0.8, '#a7ad96', 0.13)}${drizzle(32, 30, [44, 80], 170, 0.55, '#c9ccb8', 0.11)}</g>` +
      `<g class="tl-heavy">${drizzle(33, 44, [40, 72], 220, 0.45, '#c4c9b2', 0.22)}</g>`,
    nook:
      // The sandbag pile outside the entrance.
      bagWall(pile, BAG, BAG_LIT) +
      // The dugout: planked walls, the trench map pinned up, the duckboards.
      '<rect x="-28" y="70" width="460" height="386" fill="#100d09"/>' +
      `<path d="${seams}" stroke="#070504" stroke-width="2"/><path d="${joints}" stroke="#070504" stroke-width="2"/>` +
      '<path d="M-28 96H430M-28 168H430M-28 240H430M-28 312H430M-28 384H430" stroke="#2a2014" stroke-opacity=".5"/>' +
      '<rect x="262" y="96" width="130" height="100" fill="#bfb592" fill-opacity=".4" stroke="#6a5f40" stroke-width="1.4"/>' +
      '<path d="M274 120C296 108 320 128 344 114S376 112 384 122M270 142C300 134 330 150 360 138M280 178C300 168 330 182 352 170" fill="none" stroke="#6a5f40" stroke-width="1.4"/>' +
      '<path d="M268 158l8 -8l8 8l8 -8l8 8l8 -8l8 8l8 -8l8 8l8 -8l8 8l8 -8l8 8l8 -8l8 8" fill="none" stroke="#2e2618" stroke-width="2.2"/>' +
      '<path class="tl-route" pathLength="1" d="M286 188C300 172 318 178 330 152C340 130 360 130 378 110" fill="none" stroke="#8a3a24" stroke-width="2.4"/>' +
      '<g fill="#8a7a50"><circle cx="266" cy="100" r="2.4"/><circle cx="388" cy="100" r="2.4"/></g>' +
      `<path d="M-44 438H432V442H-44ZM-44 452H432V456H-44Z" fill="#1c150d"/><path d="${duckboard}" fill="#2a2015" stroke="#120d08"/>` +
      // The wall that slumps: mud behind the planks of its revetment.
      `<g class="tl-mud"><path d="M-28 70C20 64 70 74 88 100C104 160 80 220 104 280C124 336 170 380 250 414C290 430 312 446 318 456H-28Z" fill="${MUD}"/>` +
      `<path d="M0 92C30 102 50 122 60 152M20 200C40 230 60 262 90 300M130 384C170 402 220 422 280 444" fill="none" stroke="${MUD_WET}" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>` +
      '<g fill="#6a5a40"><ellipse cx="40" cy="250" rx="8" ry="5"/><ellipse cx="160" cy="400" rx="10" ry="6"/><ellipse cx="70" cy="360" rx="6" ry="4"/></g></g>' +
      planks +
      // The entrance: the post, the lintel, the iron sheet, the roof's sandbags and its wire.
      `<rect class="tl-jamb" x="-54" y="40" width="26" height="416" fill="${TIMBER}" stroke="${TIMBER_EDGE}" stroke-width="2"/>` +
      `<rect x="-82" y="44" width="520" height="26" fill="${TIMBER}" stroke="${TIMBER_EDGE}" stroke-width="2"/>` +
      '<g fill="#6a5a3a"><circle cx="-41" cy="57" r="2"/><circle cx="120" cy="57" r="2"/><circle cx="300" cy="57" r="2"/></g>' +
      `<path d="M-92 44q8 -12 16 0${'t16 0'.repeat(33)}V30H-92Z" fill="#26261e" stroke="#3e3d30" stroke-width="1.4"/>` +
      bagWall(roof, BAG, BAG_LIT) +
      bagWall(roofTop, BAG, BAG_LIT) +
      `<g class="tl-dawn"><path d="${roof.lit}${roofTop.lit}" fill="none" stroke="#e0b070" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/></g>` +
      `<path class="tl-bag" d="${pillow(-104, 10, 66, 32)}" fill="${BAG}" stroke="${BAG_EDGE}" stroke-width="2"/>` +
      '<path d="M-20 -40L-24 -118M300 -44L304 -122" stroke="#120f09" stroke-width="6" stroke-linecap="round"/>' +
      `<path d="${strand(-22, -110, 302, -114, 6, 22)}${strand(-21, -80, 301, -84, 4, 26)}" fill="none" stroke="#4a4634" stroke-width="1.6"/>` +
      // The bird that comes at dawn.
      '<g transform="translate(150 -100) scale(1.7)"><g class="tl-bird"><g class="tl-perch">' +
      '<path d="M-3 -3v4M3 -3v4" stroke="#2a2418" stroke-width="1.6"/>' +
      '<path d="M12 -12L25 -18L23 -9Z" fill="#2e281e"/><ellipse cx="0" cy="-12" rx="13" ry="10" fill="#3a3326"/>' +
      '<circle cx="-11" cy="-21" r="7" fill="#3a3326"/><path d="M-17 -23l-6 2l6 2Z" fill="#c8a060"/>' +
      '<path d="M-17 -17C-16 -8 -8 -3 0 -4C-6 -10 -8 -15 -12 -18Z" fill="#c45a36"/><circle cx="-13" cy="-23" r="1.4" fill="#050403"/>' +
      '<path class="tl-wing" d="M-4 -15C4 -21 12 -16 14 -10C6 -9 0 -10 -4 -15Z" fill="#2a251b"/></g></g></g>' +
      // The lantern on its hook, and its light.
      '<g class="tl-lglow"><circle cx="20" cy="126" r="210" fill="url(#tl-lampg)"/></g>' +
      '<g transform="translate(20 70)"><g class="tl-lamp"><path d="M0 0V32" stroke="#14120c" stroke-width="2"/>' +
      '<path d="M-10 32H10L12 38H-12Z" fill="#2a2a1e" stroke="#55553e" stroke-width="1.4"/>' +
      `<ellipse cx="0" cy="52" rx="11" ry="15" fill="${GOLD}" fill-opacity=".75"/><path d="M0 44Q5 52 0 60Q-5 52 0 44Z" fill="#fff6d0"/>` +
      '<path d="M-11 52H11M0 37V67" stroke="#2a2a1e" stroke-width="1.6"/><path d="M-12 66H12L10 74H-10Z" fill="#2a2a1e" stroke="#55553e" stroke-width="1.4"/></g></g>' +
      // Clods off the slumping wall, and drips off the lintel.
      clods +
      drips,
    front:
      '<g transform="translate(-64 452)"><g class="tl-pool">' +
      `<path d="M0 0C40 -14 160 -18 252 -6C272 -2 272 8 252 10C160 16 40 14 0 6Z" fill="${MUD}"/>` +
      `<path d="M30 -4C90 -10 160 -10 222 -4" fill="none" stroke="${MUD_WET}" stroke-opacity=".5" stroke-width="2"/></g></g>`,
  }
}
