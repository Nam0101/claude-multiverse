import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Ink Wash: a living ink painting turned for the night, pale grey ink on near-black paper, the red of a seal its only
// colour. A scholar in a winged hat codes at a flanged table on a rock ledge, bamboo and an incense burner beside
// it. A huge waterfall pours through a gorge at the left, misty peaks fade off to the right, and gusts of dry-brush
// strokes sweep the sky. A command brings a giant brush that paints a new mountain into being while ink birds fly;
// an error drops a blot that bleeds across the paper; done writes the inscription again and stamps the red seal.
const PAPER = '#0b0a09'
const INK = '#ddd7cb'
const INK2 = '#a49e93'
const STONE = '#1a1815'
const WOOD = '#1d1a16'
const EDGE = '#b8b1a4'
const SEAL = '#b3322a'

type Pt = readonly [number, number]

// Whole units: the curves are long and soft, and this keeps the markup small.
const pts = (list: readonly Pt[]): string => list.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L')

/** Points along a Catmull-Rom curve through `points`, `per` to each span. */
function spline(points: readonly Pt[], per: number): Pt[] {
  const out: Pt[] = []

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!

    for (let k = 0; k < per; k += 1) {
      const t = k / per
      const c = (a: number, b: number, d: number, e: number) =>
        0.5 * (2 * b + (d - a) * t + (2 * a - 5 * b + 4 * d - e) * t * t + (3 * b - a - 3 * d + e) * t * t * t)

      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])])
    }
  }

  out.push(points[points.length - 1]!)

  return out
}

function normal(list: readonly Pt[], i: number): Pt {
  const a = list[Math.max(0, i - 1)]!
  const b = list[Math.min(list.length - 1, i + 1)]!
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1

  return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len]
}

const shift = (list: readonly Pt[], d: number): Pt[] =>
  list.map((p, i) => {
    const [nx, ny] = normal(list, i)

    return [p[0] + nx * d, p[1] + ny * d]
  })

/** A brush stroke along `list` as one filled shape: pressed in, swelling, lifted off to a point. */
function taper(list: readonly Pt[], width: number): string {
  const a: Pt[] = []
  const b: Pt[] = []

  list.forEach((p, i) => {
    const t = i / (list.length - 1)
    const w = (width / 2) * (t < 0.15 ? 0.5 + 0.5 * Math.sin((t / 0.15) * (Math.PI / 2)) : 0.08 + 0.92 * Math.pow(1 - (t - 0.15) / 0.85, 0.6))
    const [nx, ny] = normal(list, i)

    a.push([p[0] + nx * w, p[1] + ny * w])
    b.push([p[0] - nx * w, p[1] - ny * w])
  })

  return `M${pts(a)}L${pts(b.reverse())}Z`
}

function inside(poly: readonly Pt[], x: number, y: number): boolean {
  let hit = false

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }

  return hit
}

/** Texture strokes inside a shape, as two paths: brighter ones above `split`, dimmer ones below. */
function texture(next: () => number, poly: readonly Pt[], count: number, split: number, slant: number, long: number): [string, string] {
  const xs = poly.map(p => p[0])
  const ys = poly.map(p => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  let hi = ''
  let lo = ''

  for (let n = 0, tries = 0; n < count && tries < count * 20; tries += 1) {
    const x = x0 + next() * (x1 - x0)
    const y = y0 + Math.pow(next(), 1.6) * (y1 - y0)

    if (!inside(poly, x, y)) continue
    n += 1

    const mark = `M${Math.round(x)} ${Math.round(y)}l${Math.round(-slant * (0.5 + next()))} ${Math.round(long * (0.6 + next() * 0.8))}`

    if (y < split) hi += mark
    else lo += mark
  }

  return [hi, lo]
}

// The inscription's invented marks, in a 30-unit box: a stroke winding down through four bends (never a
// single chevron), then one dot or one long slanted cut beside it (never paired ticks). [x, y] offsets from the centre.
const GLYPHS: { wave: number[]; dot?: Pt; cut?: [Pt, Pt] }[] = [
  { wave: [0, 3, -1, 3, -2, 1], dot: [10, -4] },
  { wave: [-3, 0, -3, 1, -2, 2], cut: [[7, -13], [14, -5]] },
  { wave: [2, -1, 2, -2, 1, -3], dot: [-10, 7] },
  { wave: [3, 0, 3, -1, 2, -2], cut: [[15, -13], [9, -4]] },
  { wave: [-1, 2, -1, 3, -1, 2], dot: [-9, -9] },
  { wave: [1, -2, 1, -2, 0, -3], dot: [9, 9] },
]

function glyph(i: number, cx: number, cy: number): string {
  const g = GLYPHS[i % GLYPHS.length]!
  const n = g.wave.length
  const flow = spline(g.wave.map((x, k): Pt => [cx + x, cy - 14 + (k / (n - 1)) * 28]), 4)
  const mark = g.dot
    ? `M${cx + g.dot[0]} ${cy + g.dot[1]}l1.2 1.8`
    : `M${cx + g.cut![0][0]} ${cy + g.cut![0][1]}L${cx + g.cut![1][0]} ${cy + g.cut![1][1]}`

  // Tenths, not whole units: the waves are small and rounding would kink them.
  return `M${flow.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}${mark}`
}

/** The seal: a red block with invented marks cut into it, 116 across, centred on its origin. */
function seal(): string {
  return (
    `<path d="M-57 -56L-20 -58L22 -57L58 -58L57 -18L58 24L57 58L18 57L-24 58L-58 57L-57 20L-58 -22Z" fill="${SEAL}"/>` +
    `<g fill="none" stroke="${PAPER}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round">` +
    '<path d="M-49 -49H49V49H-49Z" stroke-width="2.6"/>' +
    '<path d="M-40 -40H-10V-10H-34V-32H-18V-20"/>' +
    '<path d="M-42 16Q-36 9 -30 16T-18 16T-6 16M-42 32Q-36 25 -30 32T-18 32T-6 32"/>' +
    '<path d="M12 36C10 16 40 12 40 28C40 38 26 40 25 30C24 24 32 22 33 28"/></g>' +
    // A mountain cut as a solid: a tall summit, a lower shoulder, a moon dot. A picture, not a letter.
    `<g fill="${PAPER}"><path d="M3 -8L12 -22L17 -19L29 -41L36 -30L40 -32L45 -8Z" stroke="${PAPER}" stroke-width="2" stroke-linejoin="round"/><circle cx="10" cy="-36" r="4"/><circle cx="-30" cy="46" r="2.4"/><circle cx="44" cy="-46" r="2"/><circle cx="-2" cy="-2" r="1.8"/><circle cx="52" cy="10" r="1.6"/></g>`
  )
}

/** An ink bird: two wing strokes from the body, flapping. */
const bird = (x: number, y: number, s: number, extra: string, style: string): string =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><g class="${extra}" style="${style}"><path class="iw-wing" d="M-18 3C-12 -6 -6 -8 0 0C6 -8 12 -6 18 3C12 -2 6 -2 0 4C-6 -2 -12 -2 -18 3Z" fill="${INK}" fill-opacity=".8"/></g></g>`

/** The laptop, an inkstone with its stick and a pot of brushes. Self-contained: the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const spill =
    activity === 'error'
      ? `<path class="iw-spill" d="M130 330C140 326 176 326 214 328C214 331 180 333 150 333C138 333 130 332 130 330Z" fill="${INK}" fill-opacity=".75"/>` +
        `<g class="iw-drip" fill="${INK}" fill-opacity=".7"><rect x="146" y="331" width="4" height="26" rx="2"/><rect x="163" y="331" width="3" height="40" rx="1.5"/><rect x="181" y="331" width="4" height="18" rx="2"/></g>`
      : ''

  return (
    // The inkstone, its pool of pale ink and the ink stick.
    `<rect x="172" y="321" width="44" height="9" rx="2" fill="${STONE}" stroke="${EDGE}" stroke-opacity=".6"/>` +
    `<ellipse cx="186" cy="323.5" rx="9" ry="2" fill="${INK}" fill-opacity="${activity === 'error' ? '.15' : '.6'}"/>` +
    `<rect x="203" y="302" width="7" height="20" rx="1" fill="#2a2622" stroke="${EDGE}" stroke-opacity=".5"/>` +
    spill +
    // The laptop.
    `<rect x="244" y="323" width="98" height="7" rx="2" fill="#24211c" stroke="${EDGE}" stroke-opacity=".55"/>` +
    keys +
    `<path d="M334 327L360 240L369 242L344 329Z" fill="#24211c" stroke="${EDGE}" stroke-opacity=".55" stroke-width="1.5"/>` +
    `<path d="M335 324L359 243L363 244L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 243L346 247L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The brush pot with three brushes, their pale tips up.
    `<g stroke="#3a352e" stroke-width="3.5" stroke-linecap="round"><path d="M386 302L379 262M392 302L395 254M398 302L411 264"/></g>` +
    `<g fill="${INK}" fill-opacity=".85"><path d="M379 262l-3 -14l5 -1Z"/><path d="M395 254l-1 -15l5 1Z"/><path d="M411 264l2 -14l4 2Z"/></g>` +
    `<path d="M380 330V298H404V330Z" fill="${STONE}" stroke="${EDGE}" stroke-opacity=".65" stroke-width="1.5"/>` +
    `<path d="M380 306H404" stroke="${EDGE}" stroke-opacity=".4" stroke-width="2"/>`
  )
}

export function inkWashWorld(): World {
  const next = random(1606)

  // The two masses of the gorge at the left, the waterfall pouring between them.
  const left: Pt[] = [
    [-80, 1000], [-70, 760], [-44, 600], [-20, 480], [4, 380], [30, 300], [58, 232], [88, 170], [116, 118], [142, 74], [160, 56],
    [180, 66], [194, 98], [214, 120], [232, 150], [246, 190], [252, 260], [246, 340], [254, 440], [248, 560], [256, 680],
    [250, 800], [262, 1000],
  ]
  const right: Pt[] = [
    [308, 1000], [314, 820], [310, 700], [318, 580], [312, 460], [318, 330], [326, 256], [340, 222], [356, 210], [372, 214],
    [388, 240], [398, 286], [410, 330], [416, 400], [420, 480], [414, 560], [408, 640], [416, 760], [410, 1000],
  ]
  // The farther cliff the water leaves from, between the two.
  const back: Pt[] = [[196, 420], [206, 220], [228, 150], [252, 116], [278, 102], [302, 110], [326, 134], [348, 176], [362, 232], [370, 420]]
  // Fissures down the faces.
  const cracks = (
    [
      [[[122, 128], [112, 220], [98, 330], [86, 460]], 11],
      [[[192, 108], [198, 220], [188, 340], [194, 450]], 9],
      [[[62, 246], [52, 380], [32, 520]], 9],
      [[[356, 232], [364, 330], [378, 460]], 8],
    ] as [Pt[], number][]
  )
    .map(([at, w]) => taper(spline(at, 2), w))
    .join('')
  // A gust that sweeps up over the summit and curls in on itself.
  const curl: Pt[] = [
    [-60, 262], [60, 206], [160, 152], [250, 112],
    ...Array.from({ length: 8 }, (_, k): Pt => {
      const a = Math.PI - 0.1 + (k + 1) * 0.78
      const r = 50 - k * 5

      return [304 + Math.cos(a) * r, 98 + Math.sin(a) * r * 0.8]
    }),
  ]
  // The pinnacles at the far right.
  const peaks: Pt[] = [
    [1150, 760], [1180, 600], [1204, 520], [1230, 450], [1256, 396], [1284, 360], [1302, 352], [1320, 372], [1338, 430],
    [1352, 470], [1368, 420], [1386, 350], [1404, 300], [1422, 272], [1440, 280], [1456, 318], [1470, 380], [1486, 440],
    [1500, 470], [1516, 440], [1532, 412], [1550, 404], [1570, 420], [1596, 470], [1640, 560], [1660, 760],
  ]
  const outline = (list: readonly Pt[], from: number, to: number, width: number, opacity: number): string =>
    `<path d="${taper(spline(list.slice(from, to), 2), width)}" fill="${INK}" fill-opacity="${opacity}"/>`
  // A fainter contour inside a face: the layered rock of an ink painting.
  const inner = (list: readonly Pt[], from: number, to: number, by: number, width: number, opacity: number): string =>
    `<path d="${taper(shift(spline(list.slice(from, to), 2), by), width)}" fill="${INK}" fill-opacity="${opacity}"/>`
  const [leftHi, leftLo] = texture(next, left, 52, 430, 9, 16)
  const [rightHi, rightLo] = texture(next, right, 26, 430, 8, 15)
  const [peakHi, peakLo] = texture(next, peaks, 26, 470, 6, 13)
  const moss = [...left.slice(4, 16), ...right.slice(6, 13), ...peaks.slice(4, 23)]
    .map(([x, y]) => `M${Math.round(x + (next() - 0.5) * 16)} ${Math.round(y + 6 + next() * 10)}h.1`)
    .join('')

  // The far and middle ranges, dissolving into the mist.
  const range = (y: number, a: number, b: number, step: number): Pt[] => {
    const out: Pt[] = []

    for (let x = -60; x <= 1660; x += step) {
      out.push([x, y - a * Math.max(0, Math.sin(x / 150 + 0.8)) - b * Math.sin(x / 83 + 2) - next() * 26])
    }

    return out
  }
  const far = range(480, 80, 36, 50)
  const mid = range(620, 70, 28, 56)

  // The waterfall: streaks of falling water on a pale sheet, stepping over a ledge halfway, spray at its foot.
  const falls = Array.from({ length: 18 }, (_, i) => {
    const x = Math.round(258 + i * 2.8 + (next() - 0.5) * 2)
    const dash = 110 + next() * 60
    const fan = Math.round((x - 283) * 0.7)

    return (
      `<path class="iw-fl" style="--t:${f(0.55 + next() * 0.35)}s;animation-delay:${f(-next())}s" d="M${x - 3} ${Math.round(146 + next() * 14)}Q${x} 154 ${x} 180V420Q${x} 440 ${x + 6} 452V${Math.round(770 + next() * 40)}Q${x + 6} 836 ${x + 6 + fan} 868" ` +
      `stroke-width="${f(1.4 + next() * 2.8)}" stroke-opacity="${f(0.3 + next() * 0.45)}" stroke-dasharray="${f(dash)} ${f(200 - dash)}"/>`
    )
  }).join('')
  const spray = Array.from({ length: 6 }, (_, i) =>
    `<circle class="iw-spr" style="--dx:${f((next() - 0.5) * 80)}px;animation-delay:${f(-i * 0.55)}s" cx="${f(240 + next() * 70)}" cy="${f(840 + next() * 20)}" r="${f(16 + next() * 14)}" fill="url(#iw-spray)"/>`,
  ).join('')

  // The pine on the right cliff's summit, leaning out against the sky.
  const trunk = spline([[352, 218], [368, 200], [388, 192], [406, 176], [426, 164]], 3)
  const clusters: Pt[] = [[378, 190], [402, 172], [428, 158], [414, 198], [390, 210], [356, 196]]
  const needles = clusters
    .map(([cx, cy]) =>
      Array.from({ length: 9 }, (_, k) => {
        const a = Math.PI * (1.08 + (k / 8) * 0.84)
        const l = 15 + next() * 8

        return `M${cx} ${cy}l${Math.round(Math.cos(a) * l)} ${Math.round(Math.sin(a) * l)}`
      }).join(''),
    )
    .join('')

  // The gusts of dry-brush strokes across the sky: a few bristle lines along each curve.
  const GUSTS: { at: Pt[]; t: number; d: number }[] = [
    { at: [[-80, 150], [120, 96], [330, 120], [520, 74], [690, 98], [716, 122], [694, 136]], t: 10, d: 0 },
    { at: curl, t: 8, d: -2.4 },
    { at: [[880, 108], [1060, 62], [1260, 96], [1460, 52], [1680, 86]], t: 11, d: -3.5 },
    { at: [[-60, 330], [110, 286], [260, 316], [400, 262]], t: 9, d: -6 },
    { at: [[1160, 300], [1300, 240], [1440, 262], [1560, 212], [1600, 226], [1586, 248]], t: 12, d: -1.5 },
    { at: [[330, 214], [470, 174], [620, 198], [760, 152], [880, 168]], t: 13, d: -8 },
    { at: [[20, 560], [160, 520], [300, 548], [430, 502]], t: 10.5, d: -4.8 },
    { at: [[1230, 540], [1350, 488], [1480, 512], [1610, 462]], t: 9.5, d: -7.2 },
  ]
  const BRISTLES: [number, number, number][] = [
    [-4, 1.8, 0.26],
    [2, 5, 0.4],
  ]
  const gusts = GUSTS.map(g => {
    const curve = spline(g.at, 3)

    return (
      `<g style="--t:${g.t}s;--d:${g.d}s">` +
      BRISTLES.map(([o, w, a]) => `<path class="iw-gl" pathLength="1" d="M${pts(shift(curve, o))}" stroke-width="${w}" stroke-opacity="${a}"/>`).join('') +
      '</g>'
    )
  }).join('')
  const wisps = (
    [
      [[[-60, 92], [150, 70], [380, 96], [560, 82]], 26, 0.09],
      [[[980, 64], [1200, 42], [1420, 72], [1660, 52]], 24, 0.1],
      [[[40, 214], [260, 192], [420, 216]], 18, 0.08],
      [[[1120, 254], [1340, 232], [1520, 258]], 18, 0.08],
    ] as [Pt[], number, number][]
  )
    .map(([at, w, a], i) => `<path class="iw-cw" style="--t:${30 + i * 7}s" d="${taper(spline(at, 3), w)}" fill="${INK}" fill-opacity="${a}"/>`)
    .join('')

  // The new mountain the giant brush paints when a command runs, and the brush's path along its ridge.
  const RIDGE: Pt[] = [
    [392, 530], [440, 470], [486, 430], [520, 372], [556, 330], [590, 270], [622, 222], [648, 196], [676, 222], [700, 250],
    [726, 238], [756, 270], [790, 300], [826, 262], [862, 226], [898, 204], [930, 236], [962, 280], [1000, 318], [1046, 362],
    [1096, 412], [1150, 470], [1200, 520],
  ]
  const ridge = spline(RIDGE, 2)
  const lengths = ridge.map(() => 0)

  for (let i = 1; i < ridge.length; i += 1) {
    lengths[i] = lengths[i - 1]! + Math.hypot(ridge[i]![0] - ridge[i - 1]![0], ridge[i]![1] - ridge[i - 1]![1])
  }

  const total = lengths[lengths.length - 1]!
  const along = (s: number): Pt => {
    const goal = s * total
    let i = 1

    while (i < ridge.length - 1 && lengths[i]! < goal) i += 1

    const a = ridge[i - 1]!
    const b = ridge[i]!
    const u = (goal - lengths[i - 1]!) / Math.max(1e-6, lengths[i]! - lengths[i - 1]!)

    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
  }
  const first = ridge[0]!
  const last = ridge[ridge.length - 1]!
  const brushKeys =
    `@keyframes iw-br{0%{opacity:0;transform:translate(${f(first[0] - 150)}px,${f(first[1] - 220)}px)}` +
    Array.from({ length: 13 }, (_, k) => {
      const [x, y] = along(k / 12)

      return `${f(4 + (k / 12) * 36)}%{${k === 0 || k === 12 ? 'opacity:1;' : ''}transform:translate(${f(x)}px,${f(y)}px)}`
    }).join('') +
    `48%,100%{opacity:0;transform:translate(${f(last[0] + 120)}px,${f(last[1] - 250)}px)}}`
  const fibres = Array.from({ length: 24 }, () => {
    const [x, y] = along(0.04 + next() * 0.92)

    return `M${Math.round(x)} ${Math.round(y + 10)}q${Math.round((next() - 0.5) * 10)} ${Math.round(20 + next() * 16)} ${Math.round((next() - 0.5) * 6)} ${Math.round(36 + next() * 44)}`
  }).join('')
  const brush =
    `<g class="iw-br"><g transform="rotate(26)">` +
    `<rect x="-11" y="-430" width="22" height="336" rx="7" fill="#1f1c18" stroke="${INK}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M-11 -330H11M-11 -210H11" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/>` +
    `<circle cy="-442" r="10" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="2.4"/>` +
    `<rect x="-15" y="-100" width="30" height="16" rx="3" fill="#2c2924" stroke="${INK}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M-14 -86C-16 -54 -10 -22 0 2C10 -22 16 -54 14 -86Z" fill="${INK}" fill-opacity=".8"/>` +
    `<path d="M-5 -82C-5 -52 -2 -26 0 -4M5 -80C5 -56 3 -34 1 -14" fill="none" stroke="${PAPER}" stroke-opacity=".4" stroke-width="2"/></g></g>`
  const flick = Array.from({ length: 7 }, () =>
    `<circle class="iw-sp" style="--dx:${f(30 + next() * 120)}px;--dy:${f(-40 - next() * 120)}px" cx="${f(last[0])}" cy="${f(last[1])}" r="${f(2.5 + next() * 4)}" fill="${INK}"/>`,
  ).join('')

  // The blot an error drops: a core, its bleeding rim and tendrils, a halo, droplets thrown out.
  const coreRing = Array.from({ length: 26 }, (_, k): Pt => {
    const a = (k / 26) * Math.PI * 2
    const r = 100 + (next() - 0.5) * 34 + 12 * Math.sin(a * 3 + 1)

    return [Math.cos(a) * r, Math.sin(a) * r * 0.9]
  })
  const core = `M${pts(spline([...coreRing, coreRing[0]!], 2))}Z`
  const tendrils = Array.from({ length: 12 }, () => {
    const a = next() * Math.PI * 2
    const r0 = 78
    const len = 70 + next() * 110
    const bend = (next() - 0.5) * 0.5
    const at = (r: number, da: number): Pt => [Math.cos(a + da) * r, Math.sin(a + da) * r * 0.9]

    return taper([at(r0, 0), at(r0 + len * 0.4, bend * 0.4), at(r0 + len * 0.75, bend), at(r0 + len, bend * 1.4)], 12 + next() * 12)
  }).join('')
  const droplets = Array.from({ length: 14 }, () => {
    const a = next() * Math.PI * 2
    const d = 160 + next() * 140

    return `<circle class="iw-dr" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d * 0.85)}px" r="${f(3 + next() * 6)}" fill="${INK}"/>`
  }).join('')

  // The inscription down the right edge, and the small seal under it.
  const marks = Array.from({ length: 6 }, (_, i) =>
    `<path class="iw-gx" pathLength="1" style="--d:${f(i * 0.08)}s" d="${glyph(i, 1572, 132 + i * 38)}"/>`,
  ).join('')

  // The bamboo behind the desk: stalks in segments with nodes, leaves at the twigs, each swaying from its foot.
  const stalk = (x0: number, x1: number, top: number, w: number, side: number[]): string => {
    const n = 11
    const at = (t: number): Pt => [x0 + (x1 - x0) * t * t, 456 + (top - 456) * t]
    let segs = ''
    let nodes = ''
    let twigs = ''
    let leaves = ''

    for (let k = 0; k < n; k += 1) {
      const a = at(k / n)
      const b = at((k + 1) / n)

      segs += `M${f(a[0])} ${f(a[1] - 3)}L${f(b[0])} ${f(b[1] + 3)}`
      nodes += `M${f(b[0] - w * 0.7)} ${f(b[1] + 2)}q${f(w * 0.7)} -4 ${f(w * 1.4)} 0`
    }

    side.forEach((s, j) => {
      const [nx, ny] = at((n - 1 - j * 2) / n)
      const tx = nx + s * (36 + next() * 26)
      const ty = ny - 18 - next() * 20

      twigs += `M${f(nx)} ${f(ny)}Q${f((nx + tx) / 2)} ${f(ny - 4)} ${f(tx)} ${f(ty)}`

      for (let l = 0; l < 4; l += 1) {
        const ang = s > 0 ? 0.25 + l * 0.32 + next() * 0.2 : Math.PI - 0.25 - l * 0.32 - next() * 0.2
        const len = 40 + next() * 18
        const tip: Pt = [tx + Math.cos(ang) * len, ty + Math.sin(ang) * len]
        const midp: Pt = [tx + Math.cos(ang) * len * 0.5 + Math.sin(ang) * 4, ty + Math.sin(ang) * len * 0.5 - Math.cos(ang) * 4]

        leaves += taper([[tx, ty], midp, tip], 9)
      }
    })

    return (
      `<g class="iw-bam" style="transform-origin:${x0}px 456px;animation-delay:${f(-next() * 6)}s">` +
      `<path d="${segs}" stroke="${INK2}" stroke-opacity=".55" stroke-width="${w}"/>` +
      `<path d="${nodes}" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="${twigs}" fill="none" stroke="${INK2}" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="${leaves}" fill="${INK2}" fill-opacity=".55"/></g>`
    )
  }

  const ringR = 88
  const arc = (r: number): string => {
    const a0 = (200 * Math.PI) / 180
    const a1 = (520 * Math.PI) / 180

    return `M${f(Math.cos(a0) * r)} ${f(Math.sin(a0) * r)}A${r} ${r} 0 1 1 ${f(Math.cos(a1) * r)} ${f(Math.sin(a1) * r)}`
  }
  const ripples = Array.from({ length: 10 }, (_, i) =>
    `<path class="iw-rp" style="animation-delay:${f(-i * 0.7)}s" d="M${f(-20 + next() * 420)} ${f(896 + next() * 80)}h${f(20 + next() * 40)}" stroke="${INK}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>`,
  ).join('')
  const idleBirds = [0, 1, 2]
    .map(i => bird(-40 - i * 30, 300 + i * 22, 0.7 - i * 0.1, 'iw-ib', `--d:${f(-i * 9)}s`))
    .join('')
  const flock = Array.from({ length: 9 }, (_, i) =>
    bird(1660 + (i % 3) * 50 + next() * 40, 120 + i * 22 + next() * 20, 0.9 + next() * 0.8, i < 4 ? 'iw-b iw-b4' : 'iw-b', `--d:${f(i * 0.18)}s;--dy:${f((next() - 0.5) * 120)}px`),
  ).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#050504',
      furniture: WOOD,
      metal: '#2b2823',
      paper: '#e6e0d4',
      light: { idle: '#a39d92', work: '#e4ddd0', bright: '#fbf6ec' },
      headTop: 204,
      glowAt: [350, 284],
      device,
      wear: {
        // The wings of the scholar's hat, gauze paddles on rods behind the cap.
        behind:
          `<g class="iw-wl"><path d="M112 208L70 201" stroke="#16140f" stroke-width="6"/><path d="M112 208L70 201" stroke="${EDGE}" stroke-opacity=".55" stroke-width="1.6"/>` +
          `<ellipse cx="50" cy="198" rx="24" ry="11" transform="rotate(-8 50 198)" fill="${INK}" fill-opacity=".3" stroke="${EDGE}" stroke-width="2.2"/><path d="M29 200L70 196" stroke="${EDGE}" stroke-opacity=".5" stroke-width="1.4"/></g>` +
          `<g class="iw-wr"><path d="M188 208L230 201" stroke="#16140f" stroke-width="6"/><path d="M188 208L230 201" stroke="${EDGE}" stroke-opacity=".55" stroke-width="1.6"/>` +
          `<ellipse cx="250" cy="198" rx="24" ry="11" transform="rotate(8 250 198)" fill="${INK}" fill-opacity=".3" stroke="${EDGE}" stroke-width="2.2"/><path d="M230 196L271 200" stroke="${EDGE}" stroke-opacity=".5" stroke-width="1.4"/></g>`,
        // The cap: a tall crown on a low band; it ends at y 247, above the eyes.
        front:
          `<path d="M108 226V194C108 182 116 176 128 176H172C184 176 192 182 192 194V226Z" fill="#16140f" stroke="${EDGE}" stroke-width="2"/>` +
          `<path d="M80 247C80 234 92 226 108 224H192C208 226 220 234 220 247Z" fill="#16140f" stroke="${EDGE}" stroke-width="2"/>` +
          `<path d="M86 240H214M114 194H186" stroke="${EDGE}" stroke-opacity=".4" stroke-width="1.6"/>`,
      },
      seatArt:
        // A scholar's rock, worn through with holes.
        `<path d="M112 352C104 346 118 340 132 344C146 338 166 340 176 346C188 342 198 350 194 362C204 380 196 396 202 414C208 434 200 450 206 456H98C104 440 96 426 104 410C98 392 110 380 104 366C102 358 106 354 112 352Z" fill="${STONE}" stroke="${EDGE}" stroke-opacity=".6" stroke-width="2"/>` +
        `<g fill="#070706" stroke="${EDGE}" stroke-opacity=".45" stroke-width="1.5"><ellipse cx="128" cy="394" rx="9" ry="13"/><ellipse cx="176" cy="422" rx="7" ry="10"/><ellipse cx="152" cy="376" rx="5" ry="6"/></g>` +
        `<path d="M116 430l-4 12M190 380l-3 10M146 410l-5 14M168 446l-3 8" stroke="${EDGE}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
      tableArt:
        // A scholar's table: the top board turns up at both ends, splayed legs, a stretcher.
        `<path d="M160 316C164 326 172 330 184 330H436C447 330 454 326 457 316C456 328 450 338 438 340H182C168 338 162 328 160 316Z" fill="${WOOD}" stroke="${EDGE}" stroke-opacity=".7" stroke-width="1.6"/>` +
        `<path d="M186 340H434V350H186Z" fill="${WOOD}" stroke="${EDGE}" stroke-opacity=".45"/>` +
        `<path d="M196 350L188 456H198L206 350ZM414 350L422 456H432L424 350Z" fill="${WOOD}" stroke="${EDGE}" stroke-opacity=".5"/>` +
        `<path d="M206 350Q214 364 230 350M414 350Q406 364 390 350" fill="none" stroke="${EDGE}" stroke-opacity=".45" stroke-width="1.6"/>` +
        `<path d="M192 420H426" stroke="${WOOD}" stroke-width="5"/><path d="M192 418H426" stroke="${EDGE}" stroke-opacity=".3" stroke-width="1.2"/>`,
    },
    style:
      brushKeys +
      '.iw-ms{animation:iw-ms var(--t,24s) ease-in-out infinite alternate}@keyframes iw-ms{from{transform:translateX(-46px)}to{transform:translateX(46px)}}' +
      '.iw-cw{animation:iw-ms var(--t,36s) ease-in-out infinite alternate-reverse}' +
      '.iw-mn{animation:iw-mn 8s ease-in-out infinite alternate}@keyframes iw-mn{from{opacity:.75}to{opacity:1}}' +
      // The waterfall, faster while a command or a tool runs.
      '.iw-fl{animation:iw-fl var(--t) linear infinite}@keyframes iw-fl{to{stroke-dashoffset:-200}}' +
      '.st-run .iw-fl,.st-tool .iw-fl{animation-duration:calc(var(--t) * .6)}' +
      '.iw-sb{transform-box:fill-box;transform-origin:center;animation:iw-sb 3.4s ease-in-out infinite alternate}@keyframes iw-sb{from{transform:scale(.9,.85);opacity:.75}to{transform:scale(1.08,1.12);opacity:1}}' +
      '.iw-spr{transform-box:fill-box;transform-origin:center;opacity:0;animation:iw-spr 3.3s ease-out infinite}' +
      '@keyframes iw-spr{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),-90px) scale(1.8)}}' +
      '.iw-pn{transform-origin:352px 218px;animation:iw-pn 7s ease-in-out infinite alternate}@keyframes iw-pn{from{transform:rotate(-1.3deg)}to{transform:rotate(1.5deg)}}' +
      '.st-error .iw-pn,.st-run .iw-pn{animation-duration:1.8s}' +
      // The gusts: each stroke is drawn on, held, then wiped off along its length.
      '.iw-gl{stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0;animation:iw-gl var(--t) cubic-bezier(.35,0,.25,1) var(--d) infinite}' +
      '@keyframes iw-gl{0%{stroke-dashoffset:1;opacity:0}6%{opacity:1}38%{stroke-dashoffset:0}62%{opacity:1;stroke-dashoffset:0}100%{opacity:0;stroke-dashoffset:-.8}}' +
      '.st-run .iw-gl{animation-duration:calc(var(--t) * .42)}.st-error .iw-gl{animation-duration:calc(var(--t) * .32)}' +
      '.st-tool .iw-gl,.st-responding .iw-gl{animation-duration:calc(var(--t) * .7)}.st-done .iw-gl,.st-thinking .iw-gl{animation-duration:calc(var(--t) * 1.6)}' +
      // Birds: a few drift over the gorge; a flock crosses the sky when a command runs, a few on the web.
      '.iw-wing{transform-box:fill-box;transform-origin:center;animation:iw-wing .42s ease-in-out infinite alternate}@keyframes iw-wing{to{transform:scaleY(.3)}}' +
      '.iw-ib{opacity:0;animation:iw-ib 28s linear var(--d) infinite}@keyframes iw-ib{0%{opacity:0;transform:translate(0,0)}8%,86%{opacity:.55}100%{opacity:0;transform:translate(560px,-90px)}}' +
      '.iw-b{opacity:0}.st-run .iw-b,.st-web .iw-b4{animation:iw-b 6.6s linear var(--d) infinite}' +
      '@keyframes iw-b{0%{opacity:0;transform:translate(0,0)}5%,90%{opacity:.9}100%{opacity:0;transform:translate(-2050px,var(--dy))}}' +
      '.iw-bt{animation:iw-bt 4.2s ease-in-out infinite alternate}@keyframes iw-bt{from{transform:translateY(-2px) rotate(-1.5deg)}to{transform:translateY(3px) rotate(1.5deg)}}' +
      '.iw-rp{animation:iw-rp 5s ease-in-out infinite alternate}@keyframes iw-rp{from{transform:translateX(-14px);opacity:.4}to{transform:translateX(14px);opacity:1}}' +
      // Run: the giant brush rides the ridge as its stroke goes down, the wash fills in, flecks fly as it lifts.
      '.iw-br{opacity:0}.st-run .iw-br{animation:iw-br 7.5s linear infinite}' +
      '.iw-nr{stroke-dasharray:1 1;stroke-dashoffset:1}.st-run .iw-nr{animation:iw-nr 7.5s linear infinite}' +
      '@keyframes iw-nr{0%,4%{stroke-dashoffset:1;opacity:1}40%{stroke-dashoffset:0}86%{opacity:1;stroke-dashoffset:0}97%,100%{opacity:0;stroke-dashoffset:0}}' +
      '.iw-nm{opacity:0}.st-run .iw-nm{animation:iw-nm 7.5s linear infinite}@keyframes iw-nm{0%,24%{opacity:0}48%,86%{opacity:1}97%,100%{opacity:0}}' +
      '.iw-sp{opacity:0}.st-run .iw-sp{animation:iw-sp 7.5s ease-out infinite}' +
      '@keyframes iw-sp{0%,40%{opacity:0;transform:translate(0,0)}42%{opacity:.85}56%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Error: a drop falls, splats and bleeds out into the paper.
      '.iw-blot{opacity:0}.st-error .iw-blot{opacity:1}' +
      '.st-error .iw-drop{animation:iw-drop .42s cubic-bezier(.5,0,1,1) both}' +
      '@keyframes iw-drop{0%{transform:translateY(-580px) scale(.8,1.2)}90%{opacity:1;transform:translateY(0) scale(.8,1.2)}100%{opacity:0;transform:translateY(0) scale(2,.5)}}' +
      '.st-error .iw-core{animation:iw-core 1.5s cubic-bezier(.15,.85,.3,1) .38s both}@keyframes iw-core{from{transform:scale(.06)}to{transform:scale(1)}}' +
      '.st-error .iw-halo{animation:iw-halo 2.8s ease-out .42s both}@keyframes iw-halo{from{opacity:0;transform:scale(.25)}to{opacity:1;transform:scale(1.1)}}' +
      '.st-error .iw-ten{animation:iw-ten 2.4s cubic-bezier(.2,.7,.3,1) .45s both}@keyframes iw-ten{0%{opacity:0;transform:scale(.3)}25%{opacity:1}100%{opacity:1;transform:scale(1)}}' +
      '.iw-dr{opacity:0}.st-error .iw-dr{animation:iw-dr .9s cubic-bezier(.2,.8,.4,1) .4s both}' +
      '@keyframes iw-dr{0%{opacity:0;transform:translate(0,0) scale(.3)}20%{opacity:.85}100%{opacity:.85;transform:translate(var(--dx),var(--dy)) scale(1)}}' +
      '.iw-spill{transform-box:fill-box;transform-origin:100% 50%;animation:iw-spill 1.4s cubic-bezier(.2,.8,.3,1) .2s both}@keyframes iw-spill{from{transform:scaleX(.05)}to{transform:scaleX(1)}}' +
      '.iw-drip{transform-box:fill-box;transform-origin:50% 0;animation:iw-drip 1.6s ease-in .7s both}@keyframes iw-drip{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      // Done: the inscription writes itself again and the big seal stamps down beside it.
      '.iw-gx{stroke-dasharray:1 1;stroke-dashoffset:0}.st-done .iw-gx{animation:iw-gx .34s ease-out var(--d) both}@keyframes iw-gx{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.iw-seal{opacity:0}.st-done .iw-seal{animation:iw-seal .55s .45s both}' +
      '@keyframes iw-seal{0%{opacity:0;transform:translateY(-90px) scale(1.55);animation-timing-function:cubic-bezier(.55,0,.9,.4)}55%{opacity:1;transform:translateY(0) scale(.95);animation-timing-function:ease-out}75%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}' +
      '.iw-bloom{opacity:0}.st-done .iw-bloom{animation:iw-bloom 1.8s ease-out .76s forwards}@keyframes iw-bloom{0%{opacity:.7;transform:scale(.9)}100%{opacity:0;transform:scale(2.3)}}' +
      // Thinking: a brush ring draws itself round the moon.
      '.iw-en{stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0}.st-thinking .iw-en{animation:iw-en 2.6s cubic-bezier(.4,0,.2,1) both}' +
      '@keyframes iw-en{0%{opacity:1;stroke-dashoffset:1}100%{opacity:1;stroke-dashoffset:0}}' +
      // The nook: bamboo sways, incense smoke rises; the hat's wings bob.
      '.iw-bam{animation:iw-bam 6s ease-in-out infinite alternate}@keyframes iw-bam{from{transform:rotate(-1.4deg)}to{transform:rotate(1.2deg)}}' +
      '.st-run .iw-bam,.st-error .iw-bam{animation-duration:1.6s}' +
      '.iw-smk{stroke-dasharray:.3 .7;animation:iw-smk 6s linear infinite}@keyframes iw-smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.iw-wl,.iw-wr{transform-box:fill-box;animation:iw-wg 2.6s ease-in-out infinite alternate}.iw-wl{transform-origin:100% 80%}.iw-wr{transform-origin:0 80%;animation-direction:alternate-reverse}' +
      '@keyframes iw-wg{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-run .iw-wl,.st-run .iw-wr,.st-done .iw-wl,.st-done .iw-wr{animation-duration:.5s}',
    scenery:
      '<defs>' +
      `<radialGradient id="iw-pp" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#16140f"/><stop offset=".6" stop-color="#0d0c0a"/><stop offset="1" stop-color="#060505"/></radialGradient>` +
      `<linearGradient id="iw-pk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".34"/><stop offset=".35" stop-color="${INK2}" stop-opacity=".14"/><stop offset="1" stop-color="${INK2}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="iw-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".18"/><stop offset=".35" stop-color="${INK2}" stop-opacity=".06"/><stop offset=".7" stop-color="${INK2}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="iw-cl" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#77726a" stop-opacity=".95"/><stop offset=".22" stop-color="#3d3a35" stop-opacity=".92"/><stop offset=".62" stop-color="#191714" stop-opacity=".9"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="iw-mist"><stop offset="0" stop-color="#d8d2c6" stop-opacity=".14"/><stop offset="1" stop-color="#d8d2c6" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="iw-fallx"><stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset=".3" stop-color="${INK}" stop-opacity=".24"/><stop offset=".7" stop-color="${INK}" stop-opacity=".2"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="iw-spray"><stop offset="0" stop-color="${INK}" stop-opacity=".42"/><stop offset=".5" stop-color="${INK}" stop-opacity=".14"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="iw-moon"><stop offset="0" stop-color="#e8e2d4" stop-opacity=".24"/><stop offset="1" stop-color="#e8e2d4" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="iw-halo"><stop offset="0" stop-color="${INK2}" stop-opacity=".3"/><stop offset=".55" stop-color="${INK2}" stop-opacity=".16"/><stop offset="1" stop-color="${INK2}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="iw-veil"><stop offset="0" stop-color="${PAPER}" stop-opacity=".8"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="iw-red"><stop offset="0" stop-color="${SEAL}" stop-opacity=".34"/><stop offset="1" stop-color="${SEAL}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#iw-pp)"/>' +
      // The moon at the top right and the brush ring that thinking draws round it.
      '<g class="mv-r"><g class="mv-t"><g transform="translate(1330 160)"><g class="iw-mn"><circle r="140" fill="url(#iw-moon)"/>' +
      '<circle r="46" fill="#e4ded2" fill-opacity=".5"/><path d="M-40 10Q-10 0 30 8" stroke="#0b0a09" stroke-opacity=".35" stroke-width="6" fill="none"/></g>' +
      `<g fill="none" stroke="${INK}" stroke-linecap="round"><path class="iw-en" pathLength="1" d="${arc(ringR)}" stroke-width="11" stroke-opacity=".42"/>` +
      `<path class="iw-en" pathLength="1" d="${arc(ringR - 7)}" stroke-width="2.5" stroke-opacity=".28"/><path class="iw-en" pathLength="1" d="${arc(ringR + 7)}" stroke-width="2" stroke-opacity=".22"/></g></g></g></g>` +
      wisps +
      // The ranges, the pinnacles at the right, the mist.
      `<path d="M-60 1010L${pts(far)}L1660 1010Z" fill="url(#iw-far)" stroke="${INK}" stroke-opacity=".14" stroke-width="2"/>` +
      `<path d="M-60 1010L${pts(mid)}L1660 1010Z" fill="url(#iw-pk)" fill-opacity=".7" stroke="${INK}" stroke-opacity=".18" stroke-width="2.4"/>` +
      '<g class="mv-r">' +
      `<path d="M${pts(peaks)}Z" fill="url(#iw-pk)"/>` +
      outline(peaks, 1, 25, 6, 0.42) +
      `<path d="${peakHi}" stroke="${INK}" stroke-opacity=".26" stroke-width="2" stroke-linecap="round"/><path d="${peakLo}" stroke="${INK}" stroke-opacity=".12" stroke-width="2" stroke-linecap="round"/>` +
      '</g>' +
      [
        [300, 640, 420, 50, 22],
        [1000, 600, 500, 46, 27],
        [720, 770, 540, 60, 31],
        [1360, 690, 380, 52, 25],
        [140, 480, 300, 40, 19],
      ]
        .map(([x, y, rx, ry, t]) => `<ellipse class="iw-ms" style="--t:${t}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#iw-mist)"/>`)
        .join('') +
      // The new mountain, painted while a command runs.
      `<g class="iw-nm"><path d="M${pts(ridge)}L1200 640L392 640Z" fill="url(#iw-pk)" fill-opacity=".85"/>` +
      `<path d="${fibres}" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="2" stroke-linecap="round"/></g>` +
      `<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">` +
      `<path class="iw-nr" pathLength="1" d="M${pts(ridge)}" stroke-width="9" stroke-opacity=".5"/>` +
      `<path class="iw-nr" pathLength="1" d="M${pts(shift(ridge, 7))}" stroke-width="2.4" stroke-opacity=".32"/>` +
      `<path class="iw-nr" pathLength="1" d="M${pts(shift(ridge, -6))}" stroke-width="1.6" stroke-opacity=".26"/></g>` +
      // The gorge: two masses with their brush outlines, texture and moss dots, the waterfall between them.
      `<path d="M${pts(back)}Z" fill="url(#iw-cl)" fill-opacity=".6"/>` +
      outline(back, 1, 9, 5, 0.3) +
      `<path d="M${pts(right)}Z" fill="url(#iw-cl)"/>` +
      outline(right, 5, 17, 6, 0.5) +
      inner(right, 6, 14, 24, 4, 0.18) +
      `<path d="M${pts(left)}Z" fill="url(#iw-cl)"/>` +
      outline(left, 3, 18, 8, 0.55) +
      inner(left, 4, 15, 26, 5, 0.22) +
      inner(left, 3, 9, 52, 4, 0.15) +
      `<path d="${cracks}" fill="#050504" fill-opacity=".5"/>` +
      `<g stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="${leftHi}${rightHi}" stroke-opacity=".34"/><path d="${leftLo}${rightLo}" stroke-opacity=".14"/></g>` +
      `<path d="${moss}" stroke="${INK}" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>` +
      // The ledge the falls step over, behind the water.
      `<path d="M226 446L238 432L254 436L266 424L290 430L304 422L322 432L340 428L348 446L336 462L312 456L288 466L262 458L240 464Z" fill="#24211d" stroke="${INK}" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round"/>` +
      '<path d="M252 150H314V430H252ZM256 446H322L342 868H236Z" fill="url(#iw-fallx)"/>' +
      `<g fill="none" stroke="${INK}" stroke-linecap="round">${falls}</g>` +
      `<path d="${taper([[246, 146], [266, 142], [290, 144], [314, 150]], 10)}" fill="${INK}" fill-opacity=".6"/>` +
      '<ellipse class="iw-sb" cx="283" cy="862" rx="134" ry="46" fill="url(#iw-spray)"/><ellipse class="iw-sb" cx="288" cy="450" rx="74" ry="20" fill="url(#iw-spray)"/>' +
      // A veil of mist across the lower drop.
      '<ellipse class="iw-ms" style="--t:20s" cx="290" cy="650" rx="110" ry="30" fill="url(#iw-veil)"/>' +
      spray +
      // The pine.
      `<g class="iw-pn"><path d="${taper(trunk, 12)}" fill="#26231f" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/>` +
      `<path d="M388 192Q398 180 402 172M406 176Q412 188 414 198" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="3"/>` +
      `<path d="${needles}" stroke="${INK}" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/></g>` +
      // The river out of the pool, ripples and a fisherman's boat.
      '<g class="mv-b">' +
      '<path d="M-60 900Q150 868 300 878Q420 886 470 904L470 1010L-60 1010Z" fill="#131210"/>' +
      `<path d="M-60 900Q150 868 300 878Q420 886 470 904" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width="2"/>` +
      ripples +
      '<g transform="translate(150 928)"><g class="iw-bt">' +
      `<path d="M-46 -6Q0 14 46 -8Q40 8 0 10Q-38 8 -46 -6Z" fill="#1d1a16" stroke="${INK}" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="M-14 -22Q-8 -28 -2 -22Z" fill="${INK}" fill-opacity=".7"/><path d="M-8 -21V-4" stroke="${INK}" stroke-opacity=".55" stroke-width="4"/>` +
      `<path d="M-6 -16L54 -66" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/><path d="M54 -66V-2" stroke="${INK}" stroke-opacity=".25" stroke-width="1"/></g></g>` +
      '</g>' +
      `<g fill="none" stroke="${INK}" stroke-linecap="round">${gusts}</g>` +
      idleBirds +
      flock +
      // The blot an error drops on the gorge.
      '<g class="iw-blot"><g transform="translate(226 500) scale(1.2)">' +
      '<g class="iw-halo"><circle r="250" fill="url(#iw-halo)"/></g>' +
      `<g class="iw-ten"><path d="${tendrils}" fill="${INK2}" fill-opacity=".45"/></g>` +
      `<g class="iw-core"><path d="${core}" fill="#6e6960" fill-opacity=".85" stroke="${INK}" stroke-opacity=".55" stroke-width="5"/>` +
      '<ellipse cx="-8" cy="-6" rx="58" ry="50" fill="#8f897f" fill-opacity=".35"/></g>' +
      droplets +
      `<ellipse class="iw-drop" rx="13" ry="18" fill="${INK}" fill-opacity=".9"/></g></g>` +
      // The giant brush, with the flecks it throws as it lifts.
      brush +
      flick +
      // The inscription and seals at the right.
      '<g class="mv-r"><g class="mv-t">' +
      `<g fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${marks}</g>` +
      `<g transform="translate(1572 368) scale(.32)">${seal()}</g></g>` +
      '<g transform="translate(1430 440) rotate(-4) scale(1.4)"><circle class="iw-bloom" r="90" fill="url(#iw-red)"/>' +
      `<g class="iw-bloom"><rect x="-64" y="-64" width="128" height="128" rx="8" fill="none" stroke="${SEAL}" stroke-opacity=".5" stroke-width="3"/></g>` +
      `<g class="iw-seal">${seal()}</g></g></g>`,
    nook:
      // The rock ledge Claude works on.
      `<path d="M-140 470V450Q-60 436 20 444Q120 452 220 446Q330 438 480 448V470Z" fill="#121110"/>` +
      `<path d="${taper(spline([[-140, 450], [-60, 437], [20, 444], [120, 452], [220, 446], [330, 438], [480, 448]], 3), 6)}" fill="${INK}" fill-opacity=".4"/>` +
      // The bamboo behind the desk.
      stalk(6, -36, -330, 11, [-1, 1]) +
      stalk(36, 52, -420, 13, [1, -1, 1]) +
      stalk(26, 66, -250, 9, [1]) +
      // The incense burner on the ledge and its smoke.
      `<g fill="none" stroke="${INK}" stroke-linecap="round"><path class="iw-smk" pathLength="1" d="M10 402C-4 370 22 344 6 312C-8 284 18 258 2 226C-10 200 8 178 -4 150" stroke-opacity=".32" stroke-width="2.5"/>` +
      `<path class="iw-smk" pathLength="1" style="animation-delay:-3s" d="M10 402C24 376 0 352 14 322C26 296 4 272 16 244" stroke-opacity=".22" stroke-width="2"/></g>` +
      `<path d="M10 404V430" stroke="${INK2}" stroke-opacity=".7" stroke-width="2"/><circle cx="10" cy="402" r="2.4" fill="${INK}"/>` +
      `<path d="M-10 428H30Q30 446 10 446Q-10 446 -10 428Z" fill="${STONE}" stroke="${EDGE}" stroke-opacity=".6" stroke-width="1.6"/>` +
      `<path d="M-14 428H34" stroke="${EDGE}" stroke-opacity=".6" stroke-width="2.4"/><path d="M-4 444L-8 452M24 444L28 452M10 446V452" stroke="${EDGE}" stroke-opacity=".5" stroke-width="2"/>`,
    front: `<ellipse class="iw-ms" style="--t:18s" cx="200" cy="452" rx="300" ry="22" fill="url(#iw-mist)"/>`,
  }
}
