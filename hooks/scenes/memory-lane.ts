import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Memory Lane: a projectionist in a beret and a knitted scarf, sitting on a stack of old suitcases in a warm dark
// void. A river of light runs down the left third with picture frames drifting over it like leaves, each holding a
// small faded scene; a film reel hangs in the top-left; a projector on the desk throws its beam onto a floating
// screen. A command flips the frames and unspools a film strip across the sky; an error burns a hole through the
// projected picture and curls its corner; done pulls the frames together into one mosaic of light.
const PEACH = '#f2c49b'
const GILT = '#b08752'
const WOOD = '#3a2a24'
const WOOD_EDGE = '#5a4234'
const PAPER = '#efe6da'
const DARK = '#110d10'

type Pt = readonly [number, number]
type Scene = 'beach' | 'dusk' | 'house' | 'stars' | 'cake' | 'peaks' | 'tree' | 'kite' | 'snow'
type Look = 'gild' | 'wood' | 'pola'

function dots(seed: number, count: number, height: number, size: number): string {
  const next = random(seed)

  return Array.from({ length: count }, () => `M${f(4 + next() * 92)} ${f(3 + next() * height)}h${size}v${size}h-${size}z`).join('')
}

const STARS = dots(5, 12, 44, 1.8)
const SNOW = dots(9, 14, 56, 1.6)

/** Each memory, drawn in a 100×80 box and never past its edges, so a frame needs no clip. */
const SCENES: Record<Scene, string> = {
  beach:
    '<rect width="100" height="46" fill="#e0a982"/><circle cx="70" cy="30" r="11" fill="#fff0d6"/>' +
    '<rect y="46" width="100" height="14" fill="#5f8299"/><rect y="60" width="100" height="20" fill="#d2b08a" stroke="#f6eadb" stroke-width="1.6"/>',
  dusk:
    '<rect width="100" height="52" fill="url(#ml-gd)"/><circle cx="50" cy="52" r="16" fill="#ffd49a"/>' +
    '<rect y="52" width="100" height="28" fill="#2a2236"/><path d="M30 60h40M38 67h24M44 74h12" stroke="#ffd49a" stroke-opacity=".7" stroke-width="2"/>',
  house:
    '<rect width="100" height="80" fill="#26304a"/><circle cx="78" cy="18" r="7" fill="#f4e6c6"/>' +
    '<rect y="62" width="100" height="18" fill="#171b26"/><path d="M28 62V40L48 24L68 40V62Z" fill="#3e2e2c"/>' +
    '<rect x="42" y="44" width="12" height="10" fill="#ffd08a"/>',
  stars:
    `<rect width="100" height="80" fill="#141a32"/><path d="${STARS}" fill="#f4ecd8"/>` +
    '<path d="M74 10a14 14 0 1 0 12 22a11 11 0 1 1 -12 -22z" fill="#f2dfb4"/><path d="M0 66Q30 52 56 64T100 60V80H0Z" fill="#0b0f1e"/>',
  cake:
    '<rect width="100" height="80" fill="#2e1a1c"/><circle cx="50" cy="42" r="34" fill="url(#ml-cg)"/>' +
    '<rect x="26" y="50" width="48" height="20" rx="3" fill="#c48674" stroke="#f6e0d0" stroke-width="2"/>' +
    '<path d="M36 50v-12h3v12zM48.5 50v-14h3v14zM61 50v-12h3v12z" fill="#efe2d4"/>' +
    '<path d="M37.5 37q-3 -4 0 -8q3 4 0 8zM50 35q-3 -4 0 -8q3 4 0 8zM62.5 37q-3 -4 0 -8q3 4 0 8z" fill="#ffd27a"/>',
  peaks:
    '<rect width="100" height="80" fill="#c4928a"/><circle cx="32" cy="34" r="9" fill="#ffe4c2"/>' +
    '<path d="M0 64L22 40L36 52L58 26L80 50L100 38V80H0Z" fill="#664656"/><path d="M0 72L30 56L52 66L76 54L100 64V80H0Z" fill="#382838"/>',
  tree:
    '<rect width="100" height="80" fill="#d4c29a"/><path d="M0 60Q50 48 100 58V80H0Z" fill="#76865a"/>' +
    '<rect x="56" y="34" width="5" height="22" fill="#4a3a2a"/><circle cx="58" cy="30" r="16" fill="#546c48"/>',
  kite:
    '<rect width="100" height="80" fill="#98b2c4"/><ellipse cx="26" cy="22" rx="15" ry="5" fill="#eef0ea" fill-opacity=".8"/>' +
    '<path d="M62 12L74 25L62 40L50 25Z" fill="#df7e68"/><path d="M62 40Q55 56 66 64T58 80" fill="none" stroke="#33364a" stroke-width="1.4"/>' +
    '<rect y="70" width="100" height="10" fill="#76865a"/>',
  snow:
    '<rect width="100" height="80" fill="#28324e"/><path d="M28 64L40 30L52 64ZM58 64L68 40L78 64Z" fill="#1a3636"/>' +
    `<rect y="62" width="100" height="18" fill="#cdd4de"/><path d="${SNOW}" fill="#eef2f8"/>`,
}

const RIM: Record<Look, string> = { gild: GILT, wood: '#4a3024', pola: '#e4dbcb' }

/** A picture frame centred on its origin, 5:4, holding scene `a` and, after a flip, scene `b`. */
function picture(w: number, look: Look, a: Scene, b: Scene, dim: number): string {
  const h = w * 0.8
  const bw = w * 0.075
  const bb = look === 'pola' ? w * 0.19 : bw
  const iw = w - 2 * bw
  const ih = h - bw - bb
  const x = -w / 2
  const y = -h / 2
  const edge = `x="${f(x + bw / 2)}" y="${f(y + bw / 2)}" width="${f(w - bw)}" height="${f(h - bw)}"`
  const rim =
    look === 'pola'
      ? `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="1.5" fill="${RIM.pola}" fill-opacity=".88"/>` +
        `<rect x="${f(x + bw)}" y="${f(y + bw)}" width="${f(iw)}" height="${f(ih)}" fill="${DARK}"/>`
      : `<rect ${edge} fill="${DARK}" stroke="${RIM[look]}" stroke-width="${f(bw)}"/>`
  const fit = `translate(${f(x + bw)} ${f(y + bw)}) scale(${(iw / 100).toFixed(3)} ${(ih / 80).toFixed(3)})`

  return rim + `<g class="ml-pic" transform="${fit}" opacity="${dim}"><g class="ml-sa">${SCENES[a]}</g><g class="ml-sb">${SCENES[b]}</g></g>`
}

type Float = { x: number; y: number; w: number; r: number; look: Look; a: Scene; b: Scene; dim: number; tile?: Pt }

// The mosaic the frames gather into when the work is done: 3 × 4 tiles in the left third.
const TILE = 112
const COL = [96, 218, 340] as const
const ROW = [205, 305, 405, 505] as const

const FLOATS: readonly Float[] = [
  { x: 300, y: 72, w: 60, r: -3, look: 'pola', a: 'kite', b: 'house', dim: 0.45, tile: [COL[2], ROW[0]] },
  { x: 345, y: 235, w: 70, r: 5, look: 'wood', a: 'beach', b: 'snow', dim: 0.5, tile: [COL[2], ROW[1]] },
  { x: 34, y: 452, w: 72, r: -10, look: 'gild', a: 'snow', b: 'beach', dim: 0.5, tile: [COL[0], ROW[2]] },
  { x: 215, y: 150, w: 78, r: -6, look: 'gild', a: 'stars', b: 'kite', dim: 0.5, tile: [COL[1], ROW[0]] },
  { x: 370, y: 505, w: 84, r: 8, look: 'pola', a: 'tree', b: 'cake', dim: 0.6, tile: [COL[2], ROW[2]] },
  { x: 300, y: 360, w: 96, r: -4, look: 'gild', a: 'cake', b: 'peaks', dim: 0.64, tile: [COL[1], ROW[1]] },
  { x: 80, y: 262, w: 100, r: 6, look: 'pola', a: 'house', b: 'beach', dim: 0.6, tile: [COL[0], ROW[0]] },
  { x: 372, y: 842, w: 104, r: 9, look: 'gild', a: 'house', b: 'stars', dim: 0.72, tile: [COL[2], ROW[3]] },
  { x: 292, y: 665, w: 116, r: -6, look: 'wood', a: 'stars', b: 'dusk', dim: 0.7, tile: [COL[1], ROW[2]] },
  { x: 150, y: 435, w: 118, r: -8, look: 'wood', a: 'peaks', b: 'house', dim: 0.64, tile: [COL[0], ROW[1]] },
  { x: 82, y: 605, w: 128, r: 4, look: 'gild', a: 'dusk', b: 'tree', dim: 0.72, tile: [COL[0], ROW[3]] },
  { x: 160, y: 805, w: 148, r: -3, look: 'pola', a: 'cake', b: 'kite', dim: 0.76, tile: [COL[1], ROW[3]] },
]

/** A frame afloat: it drifts like a leaf, flips on a run and flies to its mosaic tile when done. */
function floating(p: Float, i: number, next: () => number, extra = ''): string {
  const vars = [
    `--r:${p.r}deg`,
    `--wx:${f((next() - 0.5) * 18)}px`,
    `--t:${f(7 + next() * 6)}s`,
    `--dl:${f(-next() * 9)}s`,
    `--fd:${f(0.1 + (i % 6) * 0.24 + next() * 0.1)}s`,
  ]

  if (p.tile !== undefined) {
    vars.push(`--dx:${f(p.tile[0] - p.x)}px`, `--dy:${f(p.tile[1] - p.y)}px`, `--s:${(TILE / p.w).toFixed(3)}`, `--td:${f((i % 6) * 0.07)}s`)
  }

  return (
    `<g transform="translate(${p.x} ${p.y})"><g class="ml-fr${extra}" style="${vars.join(';')}">` +
    `<circle class="ml-halo" r="${f(p.w * 0.95)}" fill="url(#ml-halo)" opacity="${f(p.dim * 0.7)}"/>` +
    `<g class="ml-fl">${picture(p.w, p.look, p.a, p.b, p.dim)}</g></g></g>`
  )
}

/** A Catmull-Rom curve through the points, sampled `steps` times per span. */
function spline(points: readonly Pt[], steps: number): Pt[] {
  const out: Pt[] = []

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!

    for (let s = 0; s < steps; s += 1) {
      const t = s / steps
      const at = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)

      out.push([at(0), at(1)])
    }
  }

  out.push(points[points.length - 1]!)

  return out
}

const RIVER: readonly Pt[] = [
  [340, -40],
  [272, 120],
  [190, 300],
  [252, 480],
  [182, 660],
  [214, 830],
  [250, 1050],
]
const LANE = spline(RIVER, 5)
const across = (t: number) => 14 + 290 * Math.pow(t, 1.7)

/** Where the river's centreline is offset sideways by `by` of its width, at each sample. */
function offset(by: number): Pt[] {
  return LANE.map((p, i) => {
    const a = LANE[Math.max(0, i - 1)]!
    const b = LANE[Math.min(LANE.length - 1, i + 1)]!
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const half = (across(i / (LANE.length - 1)) * by) / 2

    return [p[0] - (dy / len) * half, p[1] + (dx / len) * half]
  })
}

const line = (points: readonly Pt[]) => 'M' + points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')

/** The river at `scale` of its width, as one closed shape. */
function riverShape(scale: number): string {
  const left = offset(-scale)
  const right = offset(scale).reverse()

  return `${line(left)}L${right.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`
}

/** A loose film strip along a curve: the base, sprockets punched along both edges, and lit frames between them. */
function ribbon(d: string, delay: number): string {
  return (
    `<g class="ml-rib" style="animation-delay:${delay}s" fill="none"><path d="${d}" stroke="#1c1412" stroke-width="26"/>` +
    `<path class="ml-rb" d="${d}" stroke="#7a6656" stroke-width="24" stroke-dasharray="3 5"/>` +
    `<path d="${d}" stroke="#1c1412" stroke-width="15"/>` +
    `<path class="ml-rb" d="${d}" stroke="#e2ae86" stroke-opacity=".42" stroke-width="12" stroke-dasharray="19 6"/></g>`
  )
}

const ring = (cx: number, cy: number, r: number) =>
  `M${f(cx + r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0Z`

/** A film reel's plate: the disc, its windows and the hub hole, as one even-odd path. */
function reelPath(r: number, holes: number): string {
  const windows = Array.from({ length: holes }, (_, i) => {
    const a = (i * Math.PI * 2) / holes - Math.PI / 2

    return ring(Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, r * 0.22)
  }).join('')

  return ring(0, 0, r) + windows + ring(0, 0, r * 0.13)
}

/** The film strip that unspools across the sky on a run: one dashed line per colour, the pattern three frames long. */
function strip(): string {
  const run = (y: number, attrs: string) => `<path d="M-300 ${y}H1700" ${attrs}/>`
  const dash = (pattern: string, shift: number) => `stroke-dasharray="${pattern}" stroke-dashoffset="${-shift}"`

  return (
    '<rect x="-300" y="12" width="2000" height="56" fill="#191210" stroke="#4a3a30" stroke-width="1.5"/>' +
    run(18, `stroke="#5e4c42" stroke-width="5" ${dash('7 11', 0)}`) +
    run(62, `stroke="#5e4c42" stroke-width="5" ${dash('7 11', 0)}`) +
    // Three kinds of frame, each one window in three: a sunset over the sea, a house at night, a birthday.
    run(40, `stroke="#d39a78" stroke-width="32" ${dash('60 156', 0)}`) +
    run(40, `stroke="#4e6688" stroke-width="32" ${dash('60 156', 72)}`) +
    run(40, `stroke="#a8806a" stroke-width="32" ${dash('60 156', 144)}`) +
    run(51, `stroke="#50708a" stroke-width="10" ${dash('60 156', 0)}`) +
    run(33, `stroke="#fff0d4" stroke-width="11" stroke-linecap="round" ${dash('0.1 215.9', 30)}`) +
    run(47, `stroke="#1e1a24" stroke-width="18" ${dash('22 194', 91)}`) +
    run(46, `stroke="#ffd08a" stroke-width="6" ${dash('6 210', 99)}`) +
    run(30, `stroke="#f4e6c6" stroke-width="7" stroke-linecap="round" ${dash('0.1 215.9', 120)}`) +
    run(49, `stroke="#7a4e44" stroke-width="12" ${dash('30 186', 159)}`) +
    run(37, `stroke="#ffd27a" stroke-width="5" stroke-linecap="round" ${dash('0.1 9.9 0.1 9.9 0.1 195.9', 164)}`) +
    // The same frames in other light, fading in and out: the scenes change as the strip runs.
    '<g class="ml-alt">' +
    run(40, `stroke="#7a96aa" stroke-opacity=".8" stroke-width="32" ${dash('60 156', 0)}`) +
    run(40, `stroke="#c98a5a" stroke-opacity=".8" stroke-width="32" ${dash('60 156', 72)}`) +
    run(40, `stroke="#6c8a5c" stroke-opacity=".8" stroke-width="32" ${dash('60 156', 144)}`) +
    '</g>'
  )
}

/**
 * The projector Claude works at: it stands on two film tins behind a keyboard deck, its reels on top, a lit viewer
 * window in its side (the screen's light) and its lens tilted up at the floating screen. All of it left of x 410,
 * where the desk box meets the window's edge.
 */
function device(light: string, activity: Activity): string {
  const speed =
    activity === 'tool' || activity === 'run' || activity === 'web'
      ? ' ml-fast'
      : activity === 'responding' || activity === 'read' || activity === 'thinking'
        ? ' ml-slow'
        : ''
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${251 + i * 13}" y="323" width="8" height="3" fill="${light}" fill-opacity=".6"/>`).join('')
  const reel = (x: number, y: number, r: number) =>
    `<g transform="translate(${x} ${y})"><g class="ml-rl${speed}"><path d="${reelPath(r, 3)}" fill="#3a2e28" fill-rule="evenodd" stroke="#9a7a5e" stroke-width="1.8"/></g>` +
    '<circle r="3" fill="#d8b890"/></g>'
  const film = 'M322 204L378 188M406 216Q410 236 398 252'

  return (
    // Two film tins, the reels' arms and the reels, the film running between them.
    '<rect x="294" y="316" width="112" height="14" rx="4" fill="#4a3a30" stroke="#7a6250" stroke-width="1.4"/>' +
    '<rect x="300" y="302" width="100" height="14" rx="4" fill="#3a2e28" stroke="#6a5444" stroke-width="1.4"/>' +
    '<path d="M296 323H404M302 309H398" stroke="#9a8068" stroke-opacity=".5" stroke-width="1.2"/>' +
    '<path d="M322 252V226M378 252V216" stroke="#1e1816" stroke-width="4"/>' +
    reel(322, 226, 22) +
    reel(378, 216, 28) +
    `<path d="${film}" fill="none" stroke="#140f0d" stroke-width="2.4"/>` +
    `<path class="ml-film${speed}" d="${film}" fill="none" stroke="${PEACH}" stroke-opacity=".4" stroke-width="1.4" stroke-dasharray="3 4"/>` +
    // The body: brass trim, vents, the crank, the viewer window lit in Claude's light.
    '<rect x="298" y="250" width="104" height="52" rx="6" fill="#2a221e" stroke="#7a6250" stroke-width="1.8"/>' +
    `<rect x="330" y="260" width="54" height="30" rx="3" fill="${light}"/><rect x="330" y="260" width="54" height="30" rx="3" fill="none" stroke="#120e0c" stroke-width="2"/>` +
    '<path d="M302 296H398" stroke="#c9a46a" stroke-opacity=".7" stroke-width="2"/><path d="M310 262v24M316 262v24" stroke="#120e0c" stroke-width="2"/>' +
    '<circle cx="394" cy="276" r="4" fill="#c9a46a"/>' +
    '<g transform="translate(302 262) rotate(42)"><rect x="-24" y="-8" width="24" height="16" rx="2" fill="#1e1816" stroke="#7a6250" stroke-width="1.4"/>' +
    '<rect x="-29" y="-10" width="6" height="20" rx="1.5" fill="#3a2e28"/></g>' +
    '<circle cx="281" cy="243" r="13" fill="#ffe6c4" fill-opacity=".24"/><circle cx="281" cy="243" r="5" fill="#ffe9cc"/>' +
    // The keyboard deck in front of it.
    '<rect x="244" y="319" width="94" height="11" rx="2" fill="#2e2622" stroke="#5a4636" stroke-width="1.2"/>' +
    keys
  )
}

export function memoryLaneWorld(): World {
  const next = random(5150)
  const frames = FLOATS.map((p, i) => floating(p, i, next)).join('')
  const specks = Array.from({ length: 46 }, () => {
    const x = next() * 1600
    const y = next() * 900
    const s = f(1 + next() * 1.4)

    return `M${f(x)} ${f(y)}h${s}v${s}h-${s}z`
  }).join('')
  const twinkles = Array.from({ length: 5 }, (_, i) => {
    const x = i % 2 ? 1200 + next() * 400 : next() * 420

    return `<circle class="ml-tw" style="animation-delay:${f(-next() * 4)}s" cx="${f(x)}" cy="${f(20 + next() * 520)}" r="${f(1.2 + next())}"/>`
  }).join('')
  // Glints riding the river.
  const glints = Array.from({ length: 4 }, (_, i) => {
    const at = 6 + Math.floor(next() * (LANE.length - 8))
    const [x, y] = offset((next() - 0.5) * 0.8)[at]!

    return `<circle class="ml-tw" style="animation-delay:${f(-i * 0.6)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + next() * 1.4)}"/>`
  }).join('')
  const bokeh = Array.from({ length: 12 }, (_, i) => {
    const side = i % 3
    const x = side === 0 ? next() * 420 : side === 1 ? 1180 + next() * 420 : 440 + next() * 720
    const y = side === 1 ? 40 + next() * 480 : 40 + next() * 900
    const o = side === 2 ? 0.1 + next() * 0.1 : 0.22 + next() * 0.3
    const style = `--bx:${f((next() - 0.5) * 40)}px;--bt:${f(9 + next() * 9)}s;--bd:${f(-next() * 12)}s`

    return `<circle class="ml-bo" style="${style}" cx="${f(x)}" cy="${f(y)}" r="${f(6 + next() * 20)}" opacity="${f(o)}"/>`
  }).join('')
  const distant = Array.from({ length: 6 }, (_, i) => {
    const x = i < 3 ? 30 + next() * 380 : 1210 + next() * 360
    const y = i < 3 ? 30 + next() * 900 : 40 + next() * 280
    const w = 10 + next() * 12

    return `<rect class="ml-df" style="--k:${f(i * 0.29)}s" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w * 0.8)}"/>`
  }).join('')
  // Threads of light running down the river, each with its own uneven rhythm.
  const streaks = [
    [-0.4, '3 26 9 42', 3.4],
    [-0.15, '14 30 4 32', 4.6],
    [0.05, '6 22 18 34', 2.8],
    [0.28, '2 34 10 34', 3.9],
    [0.42, '8 46 3 23', 5.2],
  ]
    .map(([by, dash, s], i) => `<path class="ml-flow" style="--fs:${s}s;stroke-dasharray:${dash}" d="${line(offset(Number(by)))}" stroke-width="${f(1.2 + (i % 3) * 0.5)}"/>`)
    .join('')

  // The nook: a string of lights with polaroids clipped to it, sagging between two points off the wall.
  const cord = (t: number): Pt => {
    const u = 1 - t

    return [u * u * 8 + 2 * u * t * 220 + t * t * 436, u * u * 64 + 2 * u * t * 168 + t * t * 34]
  }
  const bulbs = [0.1, 0.3, 0.5, 0.7, 0.9]
    .map((t, i) => {
      const [x, y] = cord(t)

      return `<circle class="ml-bulb" style="--k:${f(-i * 0.7)}s" cx="${f(x)}" cy="${f(y + 6)}" r="16" fill="url(#ml-bulb)"/><circle cx="${f(x)}" cy="${f(y + 6)}" r="3.6" fill="#ffd9a8"/>`
    })
    .join('')
  // Each polaroid is a tiny memory: a sky and one bright thing in it.
  const polaroids = [
    ['#b98a6e', '#fff0d6', 8, 9, 4],
    ['#26304a', '#f4e6c6', 17, 8, 3],
    ['#3a2220', '#ffd27a', 12, 17, 4],
    ['#a99c78', '#546c48', 12, 14, 6],
  ]
    .map(([sky, sun, cx, cy, r], i) => {
      const [x, y] = cord(0.2 + i * 0.2)

      return (
        `<g transform="translate(${f(x)} ${f(y)})"><g class="ml-sw" style="--k:${f(-i * 1.1)}s">` +
        `<rect x="-15" y="3" width="30" height="35" fill="#e4dbcb" fill-opacity=".86"/><rect x="-12" y="6" width="24" height="22" fill="${sky}"/>` +
        `<circle cx="${Number(cx) - 12}" cy="${Number(cy) + 6}" r="${r}" fill="${sun}"/><rect x="-3" y="-3" width="6" height="8" rx="1" fill="#8a6a4a"/></g></g>`
      )
    })
    .join('')
  const nookFrame = floating({ x: 350, y: -130, w: 66, r: 8, look: 'gild', a: 'beach', b: 'cake', dim: 0.58 }, 2, next, ' ml-nf')
  const motes = Array.from({ length: 5 }, (_, i) => {
    const t = 0.15 + next() * 0.75
    const side = next()
    const x = 281 + (22 + side * 233 - 281) * t
    const y = 243 + (-4 - side * 176 - 243) * t

    return `<circle class="ml-tw" style="animation-delay:${f(-i * 0.6)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1 + next() * 1.3)}" fill="#ffe8cc" fill-opacity=".8"/>`
  }).join('')
  const hole = (() => {
    const pts = Array.from({ length: 15 }, (_, i) => {
      const a = (i / 15) * Math.PI * 2
      const r = 40 + next() * 14

      return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r * 0.86)}`
    })

    return `M${pts.join('L')}Z`
  })()
  const embers = Array.from({ length: 7 }, (_, i) => {
    const edge = i % 3 === 0
    const x = edge ? 80 + next() * 36 : -10 + next() * 70
    const y = edge ? 20 + next() * 60 : -40 + next() * 50

    return `<circle class="ml-em" style="--k:${f(i * 0.24)}s;--ex:${f((next() - 0.5) * 30)}px" cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + next() * 1.4)}" fill="#ffb45a"/>`
  }).join('')
  const wisp = 'c-6 -10 6 -18 0 -28c-6 -10 6 -18 0 -28'
  const smoke = [
    [20, -30, 0],
    [48, -40, 1],
    [96, -84, 0.5],
  ]
    .map(([x, y, k]) => `<path class="ml-smk" style="--k:${k}s" d="M${x} ${y}${wisp}" fill="none" stroke="#9a8a86" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`)
    .join('')
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const p = (r: number, d: number) => `${f(Math.cos(a + d) * r)} ${f(Math.sin(a + d) * r * 0.7)}`

    return `M0 0L${p(104, -0.1)}L${p(104, 0.1)}Z`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#0a0709',
      furniture: WOOD,
      metal: '#2e2622',
      paper: PAPER,
      light: { idle: '#c99a72', work: PEACH, bright: '#ffe6c8' },
      headTop: 205,
      glowAt: [357, 275],
      device,
      wear: {
        front:
          // A plum beret over the top row, clear of the eyes; a knitted scarf just under them, its tail over the seat.
          '<path d="M56 246C48 222 92 204 150 203C210 202 252 222 246 244C226 236 88 236 56 246Z" fill="#6e3446" stroke="#41182a" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M82 225C112 212 170 210 214 218" fill="none" stroke="#9e5468" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M60 244C96 236 210 234 244 242" fill="none" stroke="#41182a" stroke-width="3"/><rect x="146" y="195" width="7" height="9" rx="2" fill="#41182a"/>' +
          '<rect x="68" y="318" width="164" height="15" fill="#d9a46a"/><path d="M80 331L76 371H96L98 331Z" fill="#d9a46a"/>' +
          '<path d="M68 322H232M68 329H232M77 359H97M76 366H96" stroke="#7a4a32" stroke-opacity=".6" stroke-width="2"/>' +
          '<path d="M78 371v5M84 371v5M90 371v5M95 371v5" stroke="#d9a46a" stroke-width="2"/>',
      },
      seatArt:
        // Two old suitcases, strapped, with faded travel stickers.
        '<rect x="98" y="402" width="106" height="54" rx="6" fill="#5a3a2c" stroke="#7a5240" stroke-width="1.6"/>' +
        '<path d="M122 402v54M180 402v54" stroke="#2e1e16" stroke-width="6"/><g fill="#c9a46a"><rect x="118" y="422" width="8" height="7" rx="1"/><rect x="176" y="422" width="8" height="7" rx="1"/></g>' +
        '<rect x="106" y="352" width="90" height="50" rx="6" fill="#7a4a3c" stroke="#9a6450" stroke-width="1.6"/><path d="M106 377H196" stroke="#e8d6bc" stroke-opacity=".55" stroke-width="4"/>' +
        '<circle cx="124" cy="392" r="6" fill="#6f8f9a" fill-opacity=".85"/><ellipse cx="180" cy="390" rx="8" ry="5" fill="#e0b080" fill-opacity=".85"/><circle cx="150" cy="441" r="7" fill="#c0806a" fill-opacity=".8"/>',
      tableArt:
        // A writing desk with a drawer cabinet under the projector.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="13" rx="2"/><rect x="176" y="343" width="216" height="10"/>` +
        '<path d="M180 353H194L192 456H182Z"/><rect x="392" y="343" width="72" height="113"/></g>' +
        '<g fill="none" stroke="#6e5240" stroke-width="1.6"><rect x="398" y="352" width="60" height="44" rx="2"/><rect x="398" y="404" width="60" height="44" rx="2"/></g>' +
        '<g fill="#c9a46a"><circle cx="428" cy="374" r="3"/><circle cx="428" cy="426" r="3"/></g>' +
        `<path d="M166 331H470" stroke="${PEACH}" stroke-opacity=".22" stroke-width="1.6"/>`,
    },
    style:
      // Ambient: frames drift like leaves, the river flows, motes rise, loose film creeps along its curls.
      '.ml-fr{animation:ml-drift var(--t) ease-in-out var(--dl) infinite alternate}' +
      '@keyframes ml-drift{from{transform:translate(0,0) rotate(var(--r)) scale(1)}to{transform:translate(var(--wx),-12px) rotate(calc(var(--r) + 3deg)) scale(1)}}' +
      '.ml-flow{animation:ml-flow var(--fs) linear infinite}@keyframes ml-flow{to{stroke-dashoffset:-80}}' +
      '.st-thinking .ml-flow{animation-duration:1.8s}' +
      '.ml-core{opacity:.7}' +
      '.ml-bo{animation:ml-bo var(--bt) ease-in-out var(--bd) infinite alternate}@keyframes ml-bo{to{transform:translate(var(--bx),-44px)}}' +
      '.ml-tw{animation:ml-tw 3.6s ease-in-out infinite alternate}@keyframes ml-tw{to{opacity:.15}}' +
      '.ml-rib{animation:ml-sway 9s ease-in-out infinite alternate}@keyframes ml-sway{to{transform:translate(8px,-10px)}}' +
      '.ml-rb{animation:ml-rb 16s linear infinite}@keyframes ml-rb{to{stroke-dashoffset:-200}}' +
      '.st-tool .ml-rb,.st-run .ml-rb{animation-duration:4s}' +
      '.ml-reel{animation:mv-spin-back 60s linear infinite}' +
      '.ml-bulb{animation:ml-bulb 3.4s ease-in-out var(--k) infinite alternate}@keyframes ml-bulb{from{opacity:.55}to{opacity:1}}' +
      '.ml-sw{animation:ml-sw 5s ease-in-out var(--k) infinite alternate}@keyframes ml-sw{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      // The projector: its reels and film turn while Claude works, its beam breathes, the screen changes picture.
      '.ml-rl.ml-slow{animation:mv-spin 5s linear infinite}.ml-rl.ml-fast{animation:mv-spin 1.1s linear infinite}' +
      '.ml-film.ml-slow{animation:ml-film 1.6s linear infinite}.ml-film.ml-fast{animation:ml-film .5s linear infinite}@keyframes ml-film{to{stroke-dashoffset:-14}}' +
      '.ml-beam{animation:ml-flk 2.6s ease-in-out infinite}@keyframes ml-flk{0%,100%{opacity:.8}45%{opacity:1}70%{opacity:.88}}' +
      '.st-tool .ml-beam,.st-run .ml-beam{animation-duration:.9s}' +
      '.st-thinking .ml-beam{animation:none;opacity:.55}' +
      '.ml-p2,.ml-p3{opacity:0}' +
      '.ml-p2{animation:ml-p2 18s ease-in-out infinite}.ml-p3{animation:ml-p3 18s ease-in-out infinite}' +
      '@keyframes ml-p2{0%,28%,72%,100%{opacity:0}36%,64%{opacity:1}}@keyframes ml-p3{0%,61%,100%{opacity:0}69%,94%{opacity:1}}' +
      '.st-responding .ml-p2,.st-responding .ml-p3,.st-tool .ml-p2,.st-tool .ml-p3,.st-run .ml-p2,.st-run .ml-p3{animation-duration:6s}' +
      // Thinking: the memories' halos swell. Read: the polaroids are leafed through. Web: far-off frames light up.
      '.st-thinking .ml-halo{animation:ml-up 3s ease-in-out infinite alternate}@keyframes ml-up{to{opacity:.85}}' +
      '.st-read .ml-sw{animation-duration:1.1s}' +
      '.ml-df{opacity:.22}.st-web .ml-df{animation:ml-df 2.4s ease-in-out var(--k) infinite}@keyframes ml-df{0%,100%{opacity:.22}50%{opacity:1}}' +
      // Run: every frame turns over to another memory, and a film strip unspools from the reel across the sky.
      '.ml-sb{opacity:0}' +
      '.st-run .ml-fl{animation:ml-flip 6.4s ease-in-out var(--fd) infinite}' +
      '@keyframes ml-flip{0%,15%,50%,65%,100%{transform:scaleX(1)}7.5%,57.5%{transform:scaleX(.04)}}' +
      '.st-run .ml-sa{animation:ml-sa 6.4s linear var(--fd) infinite}.st-run .ml-sb{animation:ml-sb 6.4s linear var(--fd) infinite}' +
      '@keyframes ml-sa{0%,7.4%,57.6%,100%{opacity:1}7.6%,57.4%{opacity:0}}@keyframes ml-sb{0%,7.4%,57.6%,100%{opacity:0}7.6%,57.4%{opacity:1}}' +
      '.ml-strip{display:none}.st-run .ml-strip{display:inline}' +
      '.st-run .ml-un{animation:ml-un 2.4s cubic-bezier(.3,.55,.35,1) .1s both}@keyframes ml-un{from{transform:translateX(-1800px)}to{transform:translateX(0)}}' +
      '.st-run .ml-sc{animation:ml-sc 6s linear 2.5s infinite}@keyframes ml-sc{to{transform:translateX(216px)}}' +
      '.ml-alt{opacity:0}.st-run .ml-alt{animation:ml-alt 3.6s ease-in-out 1.2s infinite alternate}@keyframes ml-alt{to{opacity:.9}}' +
      '.st-run .ml-reel{animation-duration:1.4s}' +
      // Error: the projected picture burns through from the middle, its corner curls, embers and smoke rise.
      '.ml-burn,.ml-curl{transform:scale(0)}' +
      '.st-error .ml-burn{animation:ml-grow 2.4s cubic-bezier(.2,.6,.4,1) .1s both}.st-error .ml-curl{animation:ml-grow 1.6s ease-out .2s both}' +
      '@keyframes ml-grow{from{transform:scale(.06)}to{transform:scale(1)}}' +
      '.ml-edge{opacity:0}.st-error .ml-edge{opacity:1;animation:ml-edge 2.2s ease-out both}@keyframes ml-edge{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.ml-tint{opacity:0}.st-error .ml-tint{animation:ml-in .9s ease-out both}@keyframes ml-in{to{opacity:1}}' +
      '.st-error .ml-beam{animation:ml-stut 1s ease-in-out infinite}@keyframes ml-stut{0%,100%{opacity:.9}25%{opacity:.4}50%{opacity:.8}75%{opacity:.5}}' +
      '.ml-em,.ml-smk{opacity:0}' +
      '.st-error .ml-em{animation:ml-em 1.9s ease-out var(--k) infinite}' +
      '@keyframes ml-em{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--ex),-70px)}}' +
      '.st-error .ml-smk{animation:ml-smk 3s ease-out var(--k) infinite}' +
      '@keyframes ml-smk{0%{opacity:0;transform:translate(0,0)}25%{opacity:.6}100%{opacity:0;transform:translate(-14px,-80px)}}' +
      // Done: the frames fly into one mosaic and it fills with light; the screen opens onto a sunrise.
      '.st-done .ml-fr{animation:ml-tile 1.6s cubic-bezier(.55,0,.25,1) var(--td) both}' +
      '@keyframes ml-tile{from{transform:translate(0,0) rotate(var(--r)) scale(1)}to{transform:translate(var(--dx),var(--dy)) rotate(0deg) scale(var(--s))}}' +
      '.st-done .ml-nf{animation:ml-level 1.4s ease-out both}' +
      '@keyframes ml-level{from{transform:translate(0,0) rotate(var(--r)) scale(1)}to{transform:translate(0,-6px) rotate(0deg) scale(1.08)}}' +
      '.ml-mos,.ml-mos2,.ml-sun{opacity:0}' +
      '.st-done .ml-mos{animation:ml-in 1.8s ease-out .9s both}.st-done .ml-mos2{animation:ml-in 1.2s ease-out 1.5s both}' +
      '.st-done .ml-sun{animation:ml-in 1.4s ease-out .5s both}.st-done .ml-core{animation:ml-in 2s ease-out .6s both}' +
      '.st-done .ml-halo{animation:ml-up 1.4s ease-out 1s both}.st-done .ml-pic{animation:ml-in 1.2s ease-out 1.2s both}' +
      '.ml-shine{opacity:0}.st-done .ml-shine{animation:ml-shine 1.6s ease-in-out 1.9s both}' +
      '@keyframes ml-shine{0%{opacity:0;transform:translateX(0)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translateX(720px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ml-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a080c"/><stop offset=".55" stop-color="#110e13"/><stop offset="1" stop-color="#171217"/></linearGradient>' +
      `<radialGradient id="ml-haze"><stop offset="0" stop-color="${PEACH}" stop-opacity=".16"/><stop offset="1" stop-color="${PEACH}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ml-rose"><stop offset="0" stop-color="#c98a9a" stop-opacity=".09"/><stop offset="1" stop-color="#c98a9a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="ml-bk"><stop offset="0" stop-color="#ffdcb4" stop-opacity=".55"/><stop offset=".6" stop-color="${PEACH}" stop-opacity=".18"/><stop offset="1" stop-color="${PEACH}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="ml-halo"><stop offset="0" stop-color="${PEACH}" stop-opacity=".3"/><stop offset=".5" stop-color="${PEACH}" stop-opacity=".08"/><stop offset="1" stop-color="${PEACH}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="ml-rv0" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#f6a872" stop-opacity=".03"/><stop offset=".4" stop-color="#f6a872" stop-opacity=".06"/><stop offset="1" stop-color="#f6a872" stop-opacity=".1"/></linearGradient>' +
      '<linearGradient id="ml-rv1" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#f6b080" stop-opacity=".06"/><stop offset=".45" stop-color="#f6b080" stop-opacity=".1"/><stop offset="1" stop-color="#f6b080" stop-opacity=".16"/></linearGradient>' +
      '<linearGradient id="ml-rv2" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#ffc898" stop-opacity=".1"/><stop offset=".5" stop-color="#ffc898" stop-opacity=".16"/><stop offset="1" stop-color="#ffc898" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="ml-rv3" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#fff0dc" stop-opacity=".2"/><stop offset=".5" stop-color="#fff0dc" stop-opacity=".34"/><stop offset="1" stop-color="#fff0dc" stop-opacity=".4"/></linearGradient>' +
      '<clipPath id="ml-mc"><rect x="40" y="160" width="356" height="390"/></clipPath>' +
      '<linearGradient id="ml-gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a5a"/><stop offset="1" stop-color="#f0a070"/></linearGradient>' +
      '<radialGradient id="ml-cg"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="ml-mg"><stop offset="0" stop-color="#ffe2bc" stop-opacity=".5"/><stop offset=".5" stop-color="${PEACH}" stop-opacity=".16"/><stop offset="1" stop-color="${PEACH}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ml-wg"><stop offset="0" stop-color="#fff0dc" stop-opacity=".34"/><stop offset="1" stop-color="#fff0dc" stop-opacity=".08"/></radialGradient>' +
      '<linearGradient id="ml-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff4e4" stop-opacity="0"/><stop offset=".5" stop-color="#fff4e4" stop-opacity=".4"/><stop offset="1" stop-color="#fff4e4" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ml-sky)"/>' +
      '<circle cx="320" cy="40" r="380" fill="url(#ml-haze)"/><circle cx="1420" cy="220" r="380" fill="url(#ml-rose)"/>' +
      `<path d="${specks}" fill="#f2dcc4" fill-opacity=".32"/>` +
      `<g fill="#ffe8cc">${twinkles}</g>` +
      `<g fill="${PEACH}" fill-opacity=".14" stroke="${PEACH}" stroke-opacity=".7" stroke-width="1.4">${distant}</g>` +
      `<g fill="url(#ml-bk)">${bokeh}</g>` +
      // The river of light, coming from far off at the top and widening toward the viewer.
      '<g class="mv-b">' +
      `<path d="${riverShape(2.3)}" fill="url(#ml-rv0)"/><path d="${riverShape(1)}" fill="url(#ml-rv1)"/><path d="${riverShape(0.55)}" fill="url(#ml-rv2)"/>` +
      `<path class="ml-core" d="${riverShape(0.2)}" fill="url(#ml-rv3)"/>` +
      `<g fill="none" stroke="#fff1de" stroke-opacity=".5" stroke-linecap="round">${streaks}</g><g fill="#fff4e4">${glints}</g></g>` +
      // Loose film drifting behind the frames, and the mosaic's glow, waiting.
      ribbon('M-30 372C60 322 130 410 214 384S350 300 432 330', 0) +
      ribbon('M-30 930C90 892 170 966 262 940S392 872 436 896', -4) +
      '<g class="ml-mos"><circle cx="218" cy="355" r="330" fill="url(#ml-mg)"/></g>' +
      frames +
      '<g class="ml-mos2"><rect x="40" y="160" width="356" height="390" fill="url(#ml-wg)"/>' +
      '<rect x="34" y="154" width="368" height="402" fill="none" stroke="#f6d6b2" stroke-opacity=".75" stroke-width="3"/></g>' +
      '<g clip-path="url(#ml-mc)"><path class="ml-shine" d="M-160 160h130l-90 390h-130z" fill="url(#ml-sh)"/></g>' +
      // The reel in the top-left, and the strip a run unspools from under it.
      '<g transform="translate(70 92) rotate(-3)"><g class="ml-strip"><g class="ml-un"><g class="ml-sc">' +
      strip() +
      '</g></g></g></g>' +
      '<g transform="translate(70 92)"><circle r="46" fill="none" stroke="#140e0c" stroke-width="30"/>' +
      `<g class="ml-reel"><path d="${reelPath(66, 5)}" fill="#2a211c" fill-rule="evenodd" stroke="#6e5846" stroke-width="1.6"/></g>` +
      `<path d="M-50 -42A66 66 0 0 1 40 -52" fill="none" stroke="${PEACH}" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/></g>`,
    nook:
      '<defs>' +
      '<linearGradient id="ml-beam" gradientUnits="userSpaceOnUse" x1="281" y1="243" x2="140" y2="-92"><stop offset="0" stop-color="#ffe2bc" stop-opacity=".34"/><stop offset=".5" stop-color="#ffe2bc" stop-opacity=".12"/><stop offset="1" stop-color="#ffe2bc" stop-opacity=".05"/></linearGradient>' +
      '<radialGradient id="ml-vig"><stop offset="0" stop-color="#fff3e0" stop-opacity=".14"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>' +
      '<radialGradient id="ml-sg"><stop offset="0" stop-color="#fff0d0"/><stop offset=".35" stop-color="#f6c08a"/><stop offset="1" stop-color="#8a4a5a"/></radialGradient>' +
      '<radialGradient id="ml-bulb"><stop offset="0" stop-color="#ffd9a8" stop-opacity=".5"/><stop offset="1" stop-color="#ffd9a8" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="ml-pool"><stop offset="0" stop-color="${PEACH}" stop-opacity=".16"/><stop offset="1" stop-color="${PEACH}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      // The beam from the lens to the screen, and dust turning in it.
      '<g class="ml-beam"><path d="M281 243L25 -4L19 -172L255 -180Z" fill="url(#ml-beam)"/>' +
      motes +
      '</g>' +
      nookFrame +
      // The screen: a gilt frame afloat, three memories taking turns on it.
      '<g transform="translate(140 -92) rotate(-2)"><circle r="190" fill="url(#ml-halo)" opacity=".6"/>' +
      `<rect x="-112" y="-78" width="224" height="156" fill="${DARK}" stroke="${GILT}" stroke-width="12"/>` +
      '<rect x="-112" y="-78" width="224" height="156" fill="none" stroke="#6a4a26" stroke-width="1.4"/>' +
      `<g transform="translate(-106 -72) scale(2.12 1.8)"><g opacity=".82">${SCENES.beach}</g><g class="ml-p2">${SCENES.house}</g><g class="ml-p3">${SCENES.cake}</g></g>` +
      '<rect x="-106" y="-72" width="212" height="144" fill="url(#ml-vig)"/>' +
      '<rect class="ml-tint" x="-106" y="-72" width="212" height="144" fill="#ff7a3a" fill-opacity=".2"/>' +
      `<g class="ml-sun"><rect x="-106" y="-72" width="212" height="144" fill="url(#ml-sg)" fill-opacity=".85"/><path d="${rays}" fill="#fff0d8" fill-opacity=".28"/></g>` +
      `<g transform="translate(24 -8)"><g class="ml-burn"><path d="${hole}" transform="scale(1.28)" fill="#2a1208"/>` +
      `<path d="${hole}" transform="scale(1.12)" fill="#e0702a"/><path d="${hole}" fill="#fff0d8" fill-opacity=".9"/></g></g>` +
      '<g transform="translate(118 -84)"><g class="ml-curl"><path d="M0 0H-66L0 54Z" fill="#0a0708"/>' +
      '<path d="M-66 0Q-50 30 -40 40Q-18 46 0 54Q-30 28 -66 0Z" fill="#d6bc98"/>' +
      '<path d="M-66 0Q-50 30 -40 40Q-18 46 0 54" fill="none" stroke="#ff8a3a" stroke-width="2.6"/></g></g>' +
      // The frame's edge catching: an ember line creeping down the right side and along the bottom.
      '<path class="ml-edge" d="M118 -28V84H-60" fill="none" stroke="#2a1208" stroke-width="12" pathLength="1" stroke-dasharray="1 1"/>' +
      '<path class="ml-edge" d="M118 -28V84H-60" fill="none" stroke="#ff9a4a" stroke-width="3.4" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>' +
      embers +
      smoke +
      '</g>' +
      // The string of lights with its polaroids.
      '<path d="M8 64Q220 168 436 34" fill="none" stroke="#1e1614" stroke-width="2"/>' +
      bulbs +
      polaroids +
      // Photo albums stacked by the seat, a little frame on top; the rug and the pool of light under the desk.
      '<ellipse cx="250" cy="456" rx="300" ry="54" fill="url(#ml-pool)"/>' +
      `<ellipse cx="262" cy="456" rx="220" ry="13" fill="#24181e" stroke="${PEACH}" stroke-opacity=".22" stroke-width="2"/>` +
      '<ellipse cx="262" cy="456" rx="180" ry="8" fill="none" stroke="#c98a6a" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="6 5"/>' +
      '<g stroke="#1a1214" stroke-width="1.4"><rect x="12" y="438" width="76" height="18" rx="2" fill="#5a3436"/><rect x="18" y="421" width="66" height="17" rx="2" fill="#34444e"/>' +
      '<rect x="14" y="405" width="72" height="16" rx="2" fill="#6a5434"/></g>' +
      '<path d="M86 442V452M82 425V434M84 409V417" stroke="#efe6da" stroke-opacity=".6" stroke-width="3"/>' +
      `<rect x="30" y="378" width="30" height="27" fill="#2a3048" stroke="${GILT}" stroke-width="3"/><rect x="42" y="390" width="6" height="5" fill="#ffd08a" fill-opacity=".8"/>`,
  }
}
