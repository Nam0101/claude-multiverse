import { f, random } from './kit'
import type { World } from './world'

// Christmas Eve: a cosy living room late on Christmas Eve, lit by the fire and the tree. A tall tree hung with
// chasing lights and crowned with Claude's own coral starburst stands beside a brick fireplace with stockings on the
// mantel; at the right a curtained, frosty window looks out on a snowy town under a full moon. Claude codes in a knit
// beanie at a laptop with a mug of cocoa. A command sends a sleigh and its team streaking across the moon while the
// tree lights chase; an error blows the lights' fuse (they fizzle out and the plug sparks); done brings presents
// under the tree, the mantel clock strikes midnight and the snow glitters.
const TX = 410
const CREAM = '#efe4d2'
const RED = '#b4383e'
const PINE = '#143a24'
const PINE_HI = '#24583a'
const SIL = '#060912'
const BULB = ['#ffcf6a', '#ff6464', '#62dc8c', '#6cb0ff']
const BULB_OFF = ['#3a2c14', '#3a1618', '#12301e', '#142640']
const GLASS = 'M1222 470V206A158 110 0 0 1 1538 206V470Z'
const MX = 1300
const MY = 214

const dot = (x: number, y: number, r: number): string =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`

/** A point for `spots`: a zero-length stroke, which a round cap draws as a dot. */
const spot = (x: number, y: number): string => `M${Math.round(x)} ${Math.round(y)}h0`

/** Many dots of one size and colour as a single path. */
const spots = (d: string, r: number, color: string, extra = ''): string =>
  d === '' ? '' : `<path d="${d}" stroke="${color}" stroke-width="${f(r * 2)}" stroke-linecap="round"${extra}/>`

/** A four-pointed glint: glitter, not a star of any faith. */
const glint = (x: number, y: number, s: number): string => {
  const k = f(s * 0.22)
  const m = f(s * 0.78)

  return `M${Math.round(x)} ${Math.round(y - s)}l${k} ${m} ${m} ${k} -${m} ${k} -${k} ${m} -${k} -${m} -${m} -${k} ${m} -${k}z`
}

/** A flame tongue standing on (x, 0). */
const tongue = (x: number, w: number, h: number): string =>
  `M${f(x - w / 2)} 0C${f(x - w / 2)} ${f(-h * 0.4)} ${f(x - w * 0.1)} ${f(-h * 0.7)} ${f(x)} ${f(-h)}` +
  `C${f(x + w * 0.1)} ${f(-h * 0.7)} ${f(x + w / 2)} ${f(-h * 0.4)} ${f(x + w / 2)} 0Z`

type Tier = { top: number; bottom: number; a: number; w: number }
/** The tree's tiers, lowest first: each tucks its top under the tier above and flares to a scalloped hem. */
const TIERS: readonly Tier[] = [
  { top: 560, bottom: 846, a: 92, w: 150 },
  { top: 410, bottom: 664, a: 66, w: 130 },
  { top: 262, bottom: 492, a: 40, w: 114 },
  { top: 150, bottom: 330, a: 0, w: 78 },
]

function tier({ top, bottom, a, w }: Tier): { body: string; hem: string } {
  const n = Math.max(4, Math.round(w / 21))
  const step = (2 * w) / n
  const bend = a + (w - a) * 0.35
  const mid = f(top + (bottom - top) * 0.6)
  let hem = `M${f(TX - w)} ${bottom}`

  for (let i = 1; i <= n; i += 1) {
    hem += `Q${f(TX - w + (i - 0.5) * step)} ${bottom + 14} ${f(TX - w + i * step)} ${bottom}`
  }

  return {
    body: `M${f(TX - a)} ${top}Q${f(TX - bend)} ${mid} ${f(TX - w)} ${bottom}${hem.slice(hem.indexOf('Q'))}Q${f(TX + bend)} ${mid} ${f(TX + a)} ${top}Z`,
    hem,
  }
}

function tierHalf({ top, bottom, a, w }: Tier, y: number): number {
  if (y < top || y > bottom) {
    return 0
  }

  const bend = a + (w - a) * 0.35
  const mid = top + (bottom - top) * 0.6

  for (let i = 0; i <= 40; i += 1) {
    const s = i / 40

    if ((1 - s) * (1 - s) * top + 2 * (1 - s) * s * mid + s * s * bottom >= y) {
      return (1 - s) * (1 - s) * a + 2 * (1 - s) * s * bend + s * s * w
    }
  }

  return w
}

const halfWidth = (y: number): number => Math.max(...TIERS.map(t => tierHalf(t, y)))

/** Short needle strokes inside a tier: dark ones for depth, firelit ones on its left. */
function needles(t: Tier, next: () => number): string {
  let dark = ''
  let lit = ''

  for (let i = 0; i < 12; i += 1) {
    const y = t.top + (t.bottom - t.top) * (0.3 + next() * 0.66)
    const x = TX + (next() * 2 - 1) * tierHalf(t, y) * 0.84
    const len = 7 + next() * 9
    const side = x < TX ? -1 : 1
    const seg = `M${Math.round(x)} ${Math.round(y)}l${Math.round(side * len * 0.75)} ${Math.round(len * 0.5)}`

    if (x < TX - 24 && next() < 0.7) {
      lit += seg
    } else {
      dark += seg
    }
  }

  return `<path d="${dark}" stroke="#04100a" stroke-opacity=".75"/><path d="${lit}" stroke="#336e48" stroke-opacity=".5"/>`
}

type Bulb = { x: number; y: number; c: number; g: number }
const STRANDS: readonly (readonly [number, number])[] = [
  [262, 3],
  [390, 6],
  [524, 8],
  [658, 10],
  [792, 12],
]

/** Five strands draped across the tree, a bulb every ~22 px; each bulb belongs to one of three chasing sets. */
function strands(): { wires: string; bulbs: Bulb[] } {
  let wires = ''
  const bulbs: Bulb[] = []

  STRANDS.forEach(([y, n], k) => {
    const yr = y + 38
    const xl = TX - halfWidth(y) * 0.84
    const xr = TX + halfWidth(yr) * 0.84
    const cx = (xl + xr) / 2
    const cy = (y + yr) / 2 + 22

    wires += `M${f(xl)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(xr)} ${f(yr)}`

    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n

      bulbs.push({
        x: (1 - t) * (1 - t) * xl + 2 * (1 - t) * t * cx + t * t * xr,
        y: (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * yr,
        c: (i + k) % 4,
        g: i % 3,
      })
    }
  })

  return { wires, bulbs }
}

/** Dark glass for every bulb, and over it three interleaved sets that light up in turn. */
function lights(bulbs: readonly Bulb[]): string {
  const layer = (list: readonly Bulb[], r: number, color: (c: number) => string, extra = ''): string =>
    BULB.map((_, c) =>
      spots(
        list
          .filter(b => b.c === c)
          .map(b => spot(b.x, b.y))
          .join(''),
        r,
        color(c),
        extra,
      ),
    ).join('')
  const sets = [0, 1, 2]
    .map(g => {
      const mine = bulbs.filter(b => b.g === g)

      return (
        `<g class="xm-c xm-c${g}">` +
        layer(mine, 9, c => BULB[c] ?? CREAM, ' stroke-opacity=".18"') +
        layer(mine, 3.8, c => BULB[c] ?? CREAM) +
        spots(mine.map(b => spot(b.x - 1, b.y - 1)).join(''), 1.2, '#fffaf0', ' stroke-opacity=".8"') +
        '</g>'
      )
    })
    .join('')

  return layer(bulbs, 3.8, c => BULB_OFF[c] ?? SIL) + `<g class="xm-lit">${sets}</g>`
}

function baubles(next: () => number, avoid: readonly Bulb[]): string {
  const colors = ['#9a2a34', '#b08a2e', '#5a7898', '#c0604a']
  const placed: (readonly [number, number, number])[] = []
  const r = 7.5

  for (let guard = 0; placed.length < 18 && guard < 800; guard += 1) {
    const y = Math.round(210 + next() * 620)
    const reach = halfWidth(y) * 0.76
    const x = Math.round(TX + (next() * 2 - 1) * reach)

    if (reach < 16 || avoid.some(b => Math.hypot(b.x - x, b.y - y) < r + 8) || placed.some(([px, py]) => Math.hypot(px - x, py - y) < r * 2 + 12)) {
      continue
    }

    placed.push([x, y, placed.length % 4])
  }

  return (
    colors.map((color, c) => spots(placed.filter(p => p[2] === c).map(p => spot(p[0], p[1])).join(''), r, color)).join('') +
    spots(placed.map(p => spot(p[0] - 2.6, p[1] - 2.6)).join(''), 2.2, '#fff4e0', ' stroke-opacity=".45"') +
    `<path d="${placed.map(p => `M${p[0] - 2} ${p[1] - 10}h4v3h-4Z`).join('')}" fill="#c9a24a"/>`
  )
}

/** Claude's coral starburst on the tip: twelve rays of uneven length, never a five- or six-pointed star. */
function topper(next: () => number): string {
  let rays = ''

  for (let i = 0; i < 12; i += 1) {
    const at = (i / 12) * Math.PI * 2 + 0.13 + (next() - 0.5) * 0.14
    const len = 16 + next() * 13

    rays += `M${f(Math.cos(at) * 4)} ${f(Math.sin(at) * 4)}L${f(Math.cos(at) * len)} ${f(Math.sin(at) * len)}`
  }

  return (
    `<g transform="translate(${TX} 136)"><circle class="xm-th" r="78" fill="url(#xm-thg)"/>` +
    `<g class="xm-top"><path d="${rays}" stroke="#ef8660" stroke-width="5.6" stroke-linecap="round"/></g><circle r="6" fill="#ffc4a2"/></g>`
  )
}

function gift(x: number, base: number, w: number, h: number, box: string, rib: string, delay: number): string {
  const top = base - h
  const cx = x + w / 2

  return (
    `<g class="xm-gift" style="animation-delay:${delay}s"><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${box}"/>` +
    `<rect x="${x + w - 9}" y="${top}" width="9" height="${h}" fill="#000" fill-opacity=".28"/>` +
    `<rect x="${x - 2}" y="${top - 7}" width="${w + 4}" height="9" rx="1.5" fill="${box}"/>` +
    `<path d="M${x - 2} ${top - 6}h${w + 4}" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>` +
    `<path d="M${f(cx - 3)} ${top - 7}h6V${base}h-6ZM${x} ${f(top + h * 0.45)}h${w}v5h-${w}Z" fill="${rib}"/>` +
    `<path d="M${f(cx)} ${top - 7}c-6 -12 -18 -10 -14 -2c3 4 9 3 14 2Zm0 0c6 -12 18 -10 14 -2c-3 4 -9 3 -14 2Z" fill="${rib}"/></g>`
  )
}

/** A stocking hung from (x, 580), toe to the left, with its own trim. */
function stocking(x: number, body: string, kind: 'stripes' | 'dots' | 'burst', delay: number): string {
  const trim =
    kind === 'stripes'
      ? `<path d="M-13 38H13M-13 52H13M-13 66H13" stroke="${CREAM}" stroke-opacity=".75" stroke-width="5"/>`
      : kind === 'dots'
        ? `<path d="${dot(-5, 40, 2.6)}${dot(6, 54, 2.6)}${dot(-5, 68, 2.6)}${dot(4, 88, 2.6)}${dot(-22, 92, 2.6)}" fill="${CREAM}" fill-opacity=".8"/>`
        : `<path d="${Array.from({ length: 8 }, (_, i) => {
            const at = (i / 8) * Math.PI * 2 + 0.3
            const len = i % 2 === 0 ? 9 : 7

            return `M${f(Math.cos(at) * 2)} ${f(54 + Math.sin(at) * 2)}L${f(Math.cos(at) * len)} ${f(54 + Math.sin(at) * len)}`
          }).join('')}" stroke="${CREAM}" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round"/>`

  return (
    `<g transform="translate(${x} 580)"><g class="xm-stk" style="animation-delay:-${delay}s">` +
    '<path d="M0 -6V4" stroke="#8a6a3a" stroke-width="2"/>' +
    `<path d="M-13 16H13V84Q13 102 -5 102H-36Q-49 102 -49 91Q-49 80 -36 80H-13Z" fill="${body}"/>` +
    trim +
    `<path d="M-36 80Q-49 80 -49 91Q-49 102 -36 102Z" fill="${CREAM}" fill-opacity=".8"/>` +
    `<rect x="-17" y="2" width="34" height="18" rx="6" fill="#ddd2be"/>` +
    `<rect x="-17" y="2" width="34" height="18" rx="6" fill="none" stroke="#f4ece0" stroke-width="3" stroke-dasharray="2 3"/></g></g>`
  )
}

/** Snow falling in the window without a seam: one field of flakes and its copy a field's height above. */
function snow(seed: number, count: number, r: number, seconds: number, drift: number, opacity: number): string {
  const next = random(seed)
  const h = 374
  const flakes = spots(Array.from({ length: count }, () => spot(1210 + next() * 340, 96 + next() * h)).join(''), r, '#eef4ff', ` stroke-opacity="${opacity}"`)

  return `<g class="xm-snow" style="--sx:${drift}px;--sy:${h}px;animation-duration:${seconds}s">${flakes}<g transform="translate(${-drift} ${-h})">${flakes}</g></g>`
}

/** A frost fern growing from a pane's corner, up and to one side. */
function fern(x: number, y: number, dir: number): string {
  const points: [number, number][] = []

  for (let i = 1; i <= 6; i += 1) {
    const s = i / 6

    points.push([x + dir * (s * 34 + s * s * 14), y - s * 66])
  }

  const r = Math.round

  return (
    `M${x} ${y}` +
    points.map(([px, py]) => `L${r(px)} ${r(py)}`).join('') +
    points
      .slice(0, 5)
      .map(([px, py], i) => {
        const l = 13 - i * 2

        return `M${r(px)} ${r(py)}l${r(dir * l)} ${r(-l * 0.25)}M${r(px)} ${r(py)}l${r(-dir * l * 0.45)} ${r(-l * 0.85)}`
      })
      .join('')
  )
}

// The sleigh's flight on a run, relative to the moon: [time, x, y, angle], linear between the keys.
const FLIGHT: readonly (readonly [number, number, number, number])[] = [
  [0, -170, 80, -10],
  [0.38, 0, 0, -6],
  [0.72, 250, -40, -3],
]

function flightAt(p: number): readonly [number, number, number] {
  for (let i = 1; i < FLIGHT.length; i += 1) {
    const a = FLIGHT[i - 1]
    const b = FLIGHT[i]

    if (a !== undefined && b !== undefined && p <= b[0]) {
      const t = (p - a[0]) / (b[0] - a[0])

      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]
    }
  }

  return [250, -40, -3]
}

/** The sleigh and its team of four in silhouette, flying right; drawn around the team's middle. */
function sleigh(): string {
  const deer = [
    [-14, 2],
    [14, -1],
    [42, 2],
    [70, -1],
  ]
  const bodies = deer
    .map(([x = 0, y = 0]) => `M${x - 12} ${y - 1}q0 -5 8 -5h10q5 0 6 4q0 5 -6 6h-12q-6 0 -6 -5zM${x + 7} ${y - 4}l6 -8l6 -1l3 3l-6 2l-4 7zM${x - 11} ${y - 4}l-5 -3l2 5z`)
    .join('')
  const limbs = deer
    .map(([x = 0, y = 0]) => `M${x + 7} ${y + 3}l8 6M${x + 4} ${y + 3}l6 8M${x - 7} ${y + 3}l-9 5M${x - 4} ${y + 3}l-6 7M${x + 15} ${y - 12}l-4 -7l-3 1M${x + 13} ${y - 16}l2 -4M${x + 17} ${y - 12}l1 -8l3 -2`)
    .join('')
  const sled =
    'M-98 0V-24q0 -4 4 -4t4 4v8h24q8 0 12 8l2 8zM-90 -16q-4 -14 6 -18q10 -2 8 10l-2 8zM-76 -16q-2 -14 7 -16q8 0 8 16zM-72 -39q4 -8 12 -10l-3 9z' +
    dot(-68, -36, 4.6) +
    dot(-59, -49, 2)
  const rails = 'M-102 5H-52q8 0 10 -6q1 -5 -4 -5M-92 0v5M-62 0v5'

  return (
    '<g>' +
    `<path d="${bodies}${sled}" fill="${SIL}" stroke="#9fb6dc" stroke-opacity=".4" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="${limbs}${rails}" fill="none" stroke="${SIL}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M-64 -24L-26 -4" stroke="${SIL}" stroke-width="1"/>` +
    `<path d="${dot(-48, -12, 8)}" fill="#ffd27a" fill-opacity=".3"/><path d="${dot(-48, -12, 2.4)}" fill="#ffe2a0"/></g>`
  )
}

const HOUSES: readonly (readonly [number, number, number])[] = [
  [1232, 40, 30],
  [1282, 32, 24],
  [1326, 50, 38],
  [1392, 40, 28],
  [1444, 48, 36],
  [1502, 34, 26],
]

/** The snowy town in the window: houses with snowy roofs and warm windows, snowy pines, chimney smoke. */
function town(): string {
  const base = 456
  let walls = ''
  let roofs = ''
  let snow = ''
  let chimneys = ''
  let windows = ''
  let smoke = ''
  let k = 0

  HOUSES.forEach(([x, w, h], i) => {
    const top = base - h
    const peak = top - h * 0.55
    const cx = x + w * 0.68

    walls += `M${x} ${base}V${top}H${x + w}V${base}Z`
    chimneys += `M${f(cx)} ${f(top - h * 0.1)}V${f(top - h * 0.6)}h7V${f(top - h * 0.1)}Z`
    roofs += `M${x - 5} ${top}L${f(x + w / 2)} ${f(peak)}L${x + w + 5} ${top}Z`
    snow += `M${x - 5} ${top}L${f(x + w / 2)} ${f(peak)}L${x + w + 5} ${top}M${f(cx)} ${f(top - h * 0.6)}h7`

    if (i === 2 || i === 4) {
      smoke += `<path class="xm-chs" style="animation-delay:-${i * 1.1}s" d="M${f(cx + 3.5)} ${f(top - h * 0.66)}c-6 -9 6 -16 0 -26c-5 -8 4 -14 -1 -22"/>`
    }

    for (let j = 0; j < (w > 38 ? 2 : 1); j += 1) {
      const wx = w > 38 ? x + w * (j === 0 ? 0.2 : 0.62) : x + w / 2 - 3

      windows += `<rect class="xm-tw" style="--k:${k}" x="${f(wx)}" y="${f(top + h * 0.3)}" width="6" height="7" fill="#ffc46a"${k % 3 === 1 ? ' opacity=".2"' : ''}/>`
      k += 1
    }
  })

  const pine = (x: number, b: number, h: number) =>
    `M${x} ${b - h}L${f(x + h * 0.3)} ${f(b - h * 0.45)}H${f(x + h * 0.16)}L${f(x + h * 0.38)} ${b}H${f(x - h * 0.38)}L${f(x - h * 0.16)} ${f(b - h * 0.45)}H${f(x - h * 0.3)}Z`
  const pineSnow = (x: number, b: number, h: number) =>
    `M${f(x - h * 0.2)} ${f(b - h * 0.66)}L${x} ${b - h}L${f(x + h * 0.2)} ${f(b - h * 0.66)}M${f(x - h * 0.3)} ${f(b - h * 0.2)}L${x} ${f(b - h * 0.52)}L${f(x + h * 0.3)} ${f(b - h * 0.2)}`
  const pines: readonly (readonly [number, number, number])[] = [
    [1250, 460, 42],
    [1368, 458, 34],
    [1482, 460, 46],
    [1530, 458, 30],
  ]

  return (
    '<path d="M1210 420Q1270 388 1330 404T1450 396T1570 404V470H1210Z" fill="#141f36"/>' +
    '<path d="M1210 420Q1270 388 1330 404T1450 396T1570 404" fill="none" stroke="#7890b8" stroke-opacity=".35" stroke-width="2"/>' +
    `<path d="${chimneys}" fill="#0a0e1a"/><path d="${walls}" fill="#0b1120"/><path d="${roofs}" fill="#0a0e1a"/>` +
    `<path d="${snow}" fill="none" stroke="#c6d4ea" stroke-opacity=".85" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    windows +
    `<g fill="none" stroke="#8a9cbc" stroke-opacity=".3" stroke-width="4" stroke-linecap="round">${smoke}</g>` +
    `<path d="${pines.map(([x, b, h]) => pine(x, b, h)).join('')}" fill="#08161a"/>` +
    `<path d="${pines.map(([x, b, h]) => pineSnow(x, b, h)).join('')}" fill="none" stroke="#b8c8e0" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
    '<path d="M1210 452Q1290 440 1380 450T1560 446V480H1210Z" fill="#3a4c6c"/>' +
    '<path d="M1210 452Q1290 440 1380 450T1560 446" fill="none" stroke="#a8bcd8" stroke-opacity=".5" stroke-width="2"/>'
  )
}

/** The beanie: a red knit dome with a cream stripe, a ribbed cuff above the eyes, a pompom and a sprig of holly. */
const BEANIE =
  `<path d="M70 236C70 200 104 184 150 184C196 184 230 200 230 236Z" fill="${RED}"/>` +
  `<path d="M77 213Q150 199 223 213V222Q150 208 77 222Z" fill="${CREAM}" fill-opacity=".9"/>` +
  '<path d="M88 200Q150 186 212 200M74 231Q150 217 226 231" fill="none" stroke="#8e2a30" stroke-width="2" stroke-dasharray="3 3"/>' +
  '<rect x="64" y="228" width="172" height="24" rx="8" fill="#a3323a"/>' +
  `<path d="${Array.from({ length: 16 }, (_, i) => `M${74 + i * 10} 232V249`).join('')}" stroke="#7a2026" stroke-width="2.4"/>` +
  '<path d="M70 230H230" stroke="#d65a5a" stroke-opacity=".6" stroke-width="2"/>' +
  `<circle cx="152" cy="176" r="15" fill="${CREAM}"/><circle cx="152" cy="176" r="15" fill="none" stroke="${CREAM}" stroke-width="6" stroke-dasharray="2 3"/>` +
  '<circle cx="147" cy="171" r="5" fill="#fff" fill-opacity=".35"/>' +
  '<path d="M206 236q8 -10 20 -6q-4 4 -2 8q-8 2 -18 -2ZM206 236q-4 -12 4 -20q2 5 6 5q2 8 -10 15Z" fill="#2a6a3e"/>' +
  `<path d="${dot(204, 238, 3)}${dot(211, 241, 3)}${dot(199, 243, 2.6)}" fill="#e03a3a"/>`

/** The laptop, and a mug of cocoa with marshmallows and a candy cane, steaming. */
function device(light: string): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${252 + i * 11}" y="323.5" width="7" height="2.6" fill="${light}" fill-opacity=".5"/>`).join('')

  return (
    '<path d="M242 330L248 321H340L346 330Z" fill="#2e2428" stroke="#4e3e42" stroke-width="1.4"/>' +
    keys +
    '<path d="M334 324L362 236L373 239L345 327Z" fill="#2e2428" stroke="#4e3e42" stroke-width="1.4"/>' +
    `<path d="M338 321L364 241L369 242L343 323Z" fill="${light}"/>` +
    `<path d="M338 321L364 241L354 245L328 321Z" fill="${light}" fill-opacity=".14"/>` +
    `<rect x="380" y="302" width="26" height="28" rx="4" fill="${RED}"/><rect x="380" y="312" width="26" height="5" fill="${CREAM}" fill-opacity=".85"/>` +
    `<path d="M406 308q9 0 9 8t-9 8" fill="none" stroke="${RED}" stroke-width="3.6"/>` +
    '<ellipse cx="393" cy="303" rx="12" ry="3" fill="#4a2616"/>' +
    `<path d="M384 300h5v4h-5zM391 299h5v4h-5z" fill="${CREAM}"/>` +
    '<path d="M402 304V282q0 -7 6 -7t6 6" fill="none" stroke="#f2ece4" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M402 304V282q0 -7 6 -7t6 6" fill="none" stroke="#d8343c" stroke-width="4" stroke-dasharray="3 3.5"/>' +
    `<g fill="none" stroke="${CREAM}" stroke-width="2.2" stroke-linecap="round">` +
    '<path class="xm-stm" opacity=".35" d="M386 296c-5 -8 5 -12 0 -20c-4 -6 3 -10 0 -15"/>' +
    '<path class="xm-stm xm-stm2" opacity=".2" d="M394 296c-4 -7 5 -11 1 -18"/></g>'
  )
}

export function christmasEveWorld(): World {
  const next = random(1224)
  const { wires, bulbs } = strands()
  const mantelBulbs: Bulb[] = Array.from({ length: 7 }, (_, i) => ({ x: 38 + i * 40, y: 576, c: (i + 1) % 4, g: i % 3 }))
  const treeBody = TIERS.map((t, i) => {
    const { body, hem } = tier(t)
    const shadow = i === 0 ? '' : `<path d="${hem}" transform="translate(0 7)" fill="none" stroke="#020a05" stroke-opacity=".55" stroke-width="12"/>`

    return (
      shadow +
      `<path d="${body}" fill="url(#xm-tree)"/><g stroke-width="2" stroke-linecap="round">${needles(t, next)}</g>` +
      `<path d="${hem}" fill="none" stroke="#2c6040" stroke-opacity=".5" stroke-width="2.2"/>`
    )
  }).join('')
  const beads = [330, 462, 596, 730]
    .map(y => {
      const yr = y + 34
      const xl = TX - halfWidth(y) * 0.8
      const xr = TX + halfWidth(yr) * 0.8

      return `M${f(xl)} ${y}Q${f((xl + xr) / 2)} ${f((y + yr) / 2 + 20)} ${f(xr)} ${yr}`
    })
    .join('')
  const flames = (
    [
      [-46, 26, 48, 0.8],
      [-24, 30, 74, 1.1],
      [0, 34, 92, 0.9],
      [24, 30, 70, 1.25],
      [46, 24, 46, 0.7],
    ] as const
  )
    .map(([x, w, h, d], i) => `<path class="xm-fl" style="animation-duration:${d}s;animation-delay:-${f(i * 0.37)}s" d="${tongue(x, w, h)}" fill="url(#xm-flm)"/>`)
    .join('')
  const cores = (
    [
      [-20, 16, 40, 0.7],
      [4, 18, 54, 0.95],
      [26, 14, 36, 0.8],
    ] as const
  )
    .map(([x, w, h, d], i) => `<path class="xm-fl" style="animation-duration:${d}s;animation-delay:-${f(i * 0.29)}s" d="${tongue(x, w, h)}" fill="#ffe08a" fill-opacity=".9"/>`)
    .join('')
  const embers = Array.from(
    { length: 6 },
    (_, i) => `<circle class="xm-em" style="--dx:${f((next() - 0.5) * 50)}px;animation-delay:-${f(i * 0.57)}s" cx="${f(130 + next() * 60)}" cy="852" r="1.8" fill="#ffb050"/>`,
  ).join('')
  let garland = 'M18 562'

  for (let i = 0; i < 7; i += 1) {
    garland += `Q${38 + i * 40} 586 ${58 + i * 40} 562`
  }

  const candle = (x: number, delay: number) =>
    `<circle class="xm-cg" cx="${x}" cy="496" r="30" fill="url(#xm-cgl)"/><rect x="${x - 6}" y="506" width="12" height="36" rx="2" fill="#bfb196"/>` +
    `<path class="xm-cd" style="animation-delay:-${delay}s" d="M${x} 489q5 8 3.5 12q-1 4 -3.5 4q-2.5 0 -3.5 -4q-1.5 -4 3.5 -12z" fill="#ffd27a"/>`
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const at = -Math.PI * (0.06 + (i / 11) * 0.88)
    const reach = 40 + next() * 60

    return `<circle class="xm-sp" style="--dx:${f(Math.cos(at) * reach)}px;--dy:${f(Math.sin(at) * reach + 10)}px;animation-delay:${f(0.1 + (i % 4) * 0.03)}s" cx="324" cy="900" r="${f(1.6 + next() * 1.4)}" fill="${i % 2 ? '#fff2c0' : '#ffc050'}"/>`
  }).join('')
  const roomGlitter = [0, 1, 2]
    .map(g => {
      const d = Array.from({ length: 4 }, () => glint(250 + next() * 160, 560 + next() * 340, 4 + next() * 4)).join('')

      return `<path class="xm-gs xm-gs${g}" d="${d}" fill="#fff6dc"/>`
    })
    .join('')
  const skyGlitter = [0, 1, 2]
    .map(g => {
      const d = Array.from({ length: 4 }, (_, i) => glint(1232 + next() * 296, i < 2 ? 140 + next() * 240 : 420 + next() * 46, 3.5 + next() * 3.5)).join('')

      return `<path class="xm-gs xm-gs${g}" d="${d}" fill="#f4f8ff"/>`
    })
    .join('')
  // Where the sleigh's runners end at a moment of the flight, in the picture.
  const rear = (p: number): readonly [number, number] => {
    const [x, y, angle] = flightAt(p)
    const rad = (angle * Math.PI) / 180

    return [MX + x - 98 * Math.cos(rad) - 2 * Math.sin(rad), MY + y - 98 * Math.sin(rad) + 2 * Math.cos(rad)]
  }
  const streak = 'M' + Array.from({ length: 13 }, (_, i) => rear((i / 12) * 0.72).map(Math.round).join(' ')).join('L')
  // Glints only where the runners pass over the glass (from p .42 on; earlier the sleigh is left of the window).
  const trail = Array.from({ length: 7 }, (_, i) => {
    const p = 0.42 + i * 0.047
    const [rx, ry] = rear(p)
    const px = rx + (next() - 0.5) * 10
    const py = ry + (next() - 0.5) * 10
    const look = i % 2 === 0 ? `d="${glint(px, py, 4.5)}" fill="#ffe7a8"` : `d="${spot(px, py)}" stroke="#ffe7a8" stroke-width="3.6" stroke-linecap="round"`

    return `<path class="xm-tr" style="animation-delay:${f(p * 4.5 + 0.15)}s" ${look}/>`
  }).join('')
  const stars = Array.from({ length: 30 }, () => {
    let x = 0
    let y = 0

    for (let tries = 0; tries < 20; tries += 1) {
      x = 1230 + next() * 300
      y = 120 + next() * 260

      if (Math.hypot(x - MX, y - MY) > 74) {
        break
      }
    }

    return spot(x, y)
  })
  const scallops = Array.from({ length: 6 }, (_, i) => `Q${f(1166 + i * 71.3 + 35.7)} 90 ${f(1166 + (i + 1) * 71.3)} 70`).join('')
  const swags = Array.from({ length: 7 }, (_, i) => `Q${-10 + i * 170 + 85} 72 ${-10 + (i + 1) * 170} 24`).join('')
  const topBulbs = Array.from({ length: 21 }, (_, i) => {
    const swag = Math.floor(i / 3)
    const t = ((i % 3) + 1) / 4
    const x0 = -10 + swag * 170

    return { x: x0 + 170 * t, y: 24 + 2 * (1 - t) * t * 48, c: i % 4, g: i % 2 }
  })
  const topLights = [0, 1]
    .map(
      g =>
        `<g class="${g === 0 ? 'xm-tga' : 'xm-tgb'}">` +
        BULB.map((color, c) =>
          spots(
            topBulbs
              .filter(b => b.g === g && b.c === c)
              .map(b => spot(b.x, b.y + 4))
              .join(''),
            2.6,
            color,
          ),
        ).join('') +
        '</g>',
    )
    .join('')
  const panels = Array.from({ length: 12 }, (_, i) => `M${8 + i * 132} 662h116v190h-116Z`).join('')
  const seams = Array.from({ length: 16 }, () => {
    const row = Math.floor(next() * 4)
    const y = [886, 906, 930, 958][row] ?? 886
    const h = [20, 24, 28, 30][row] ?? 20

    return `M${f(next() * 1600)} ${y}v${h}`
  }).join('')
  const ties = Array.from({ length: 22 }, (_, i) => `M${136 + i * 23} 921v5`).join('')
  const wheels = [10, 28, 47, 72, 88, 103].map(x => dot(x, -4, 5)).join('')
  const puffs = [0, 1, 2].map(i => `<circle class="xm-pf" style="animation-delay:${f(i * 0.4)}s" cx="101" cy="-48" r="6" fill="#e8e0d4"/>`).join('')
  const ferns = (
    [
      [1226, 468, 1],
      [1376, 468, -1],
      [1384, 468, 1],
      [1534, 468, -1],
    ] as const
  )
    .map(([x, y, dir]) => `<path class="xm-fern" style="transform-origin:${dir > 0 ? '0%' : '100%'} 100%" d="${fern(x, y, dir)}"/>`)
    .join('')
  const leaves = Array.from({ length: 8 }, (_, i) => {
    const at = (i / 8) * Math.PI * 2 + 0.2 + (next() - 0.5) * 0.3
    const len = 15 + next() * 8
    const tip = [1500 + Math.cos(at) * len, 438 + Math.sin(at) * len * 0.7]
    const side = (by: number) => `${f(1500 + Math.cos(at + by) * len * 0.5)} ${f(438 + Math.sin(at + by) * len * 0.36)}`

    return `M1500 438Q${side(0.45)} ${f(tip[0] ?? 0)} ${f(tip[1] ?? 0)}Q${side(-0.45)} 1500 438Z`
  }).join('')
  const curtain = (mirror: boolean) => {
    const x = (v: number) => (mirror ? 2760 - v : v)

    return (
      `<path d="M${x(1176)} 40H${x(1262)}C${x(1254)} 150 ${x(1242)} 236 ${x(1228)} 316C${x(1240)} 396 ${x(1250)} 480 ${x(1258)} 568H${x(1170)}C${x(1172)} 480 ${x(1180)} 396 ${x(1190)} 316C${x(1182)} 236 ${x(1176)} 150 ${x(1176)} 40Z" fill="#3a0f17"/>` +
      `<path d="M${x(1196)} 44C${x(1196)} 150 ${x(1202)} 236 ${x(1206)} 314M${x(1220)} 44C${x(1218)} 150 ${x(1214)} 236 ${x(1214)} 314M${x(1204)} 330C${x(1198)} 420 ${x(1192)} 500 ${x(1190)} 564M${x(1222)} 330C${x(1228)} 420 ${x(1234)} 500 ${x(1240)} 564" fill="none" stroke="#22070c" stroke-width="3"/>` +
      `<path d="M${x(1262)} 40C${x(1254)} 150 ${x(1242)} 236 ${x(1228)} 316C${x(1240)} 396 ${x(1250)} 480 ${x(1258)} 568" fill="none" stroke="#6a2a34" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="M${x(1186)} 310Q${x(1210)} 322 ${x(1234)} 310V320Q${x(1210)} 332 ${x(1186)} 320Z" fill="#a8823a"/>`
    )
  }

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#0a0507',
      furniture: '#3a2418',
      metal: '#2e2428',
      paper: CREAM,
      light: { idle: '#d9a86a', work: '#ffd08a', bright: '#fff0d0' },
      headTop: 196,
      glowAt: [350, 282],
      device,
      wear: { front: BEANIE },
      seatArt:
        '<ellipse cx="154" cy="454" rx="70" ry="5" fill="#000" fill-opacity=".35"/>' +
        '<path d="M92 352Q92 344 102 344H206Q216 344 216 352V366H92Z" fill="#6a1c24"/><path d="M98 346H210" stroke="#8e3a42" stroke-opacity=".8" stroke-width="2"/>' +
        '<path d="M94 366H214L210 430H98Z" fill="#4e1620"/><path d="M124 368V428M154 368V430M184 368V428" stroke="#3a0e16" stroke-width="2"/>' +
        '<path d="M90 348L142 354L134 440L98 446Q86 400 90 348Z" fill="#23402e"/>' +
        '<path d="M90 372L139 378M90 400L137 405M92 428L135 432M104 350L101 444M122 352L118 442" stroke="#c84a4a" stroke-opacity=".55" stroke-width="2.6"/>' +
        `<path d="M91 386L138 391M113 351L110 443" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.4"/>` +
        '<path d="M100 446v6M106 445v6M112 445v6M118 444v6M124 444v6M130 443v6" stroke="#23402e" stroke-width="2"/>' +
        '<path d="M100 430h12l-2 22h-8zM196 430h12l-2 22h-8z" fill="#2a1a12"/>',
      tableArt:
        '<rect x="164" y="326" width="310" height="8" rx="2" fill="#3a2418"/>' +
        `<path d="M162 330H474V364${Array.from({ length: 13 }, (_, i) => `Q${462 - i * 24} 374 ${450 - i * 24} 364`).join('')}Z" fill="#1d3a2a"/>` +
        `<path d="M474 356${Array.from({ length: 13 }, (_, i) => `Q${462 - i * 24} 366 ${450 - i * 24} 356`).join('')}" fill="none" stroke="${RED}" stroke-width="3"/>` +
        `<path d="M168 347H470" stroke="${CREAM}" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 8"/>` +
        '<path d="M162 331H474" stroke="#2e5a40" stroke-width="2"/>' +
        '<path d="M186 370h12v86h-12zM436 370h12v86h-12z" fill="#2e1c12"/><path d="M184 394h16M184 422h16M434 394h16" stroke="#4a3020" stroke-width="3"/>',
    },
    style:
      // The tree lights: three interleaved sets along every strand. Calm: each set breathes on its own clock.
      '.xm-c{animation:xm-tw 3.4s ease-in-out infinite alternate}.xm-c1{animation-duration:4.2s;animation-delay:-1.4s}.xm-c2{animation-duration:5s;animation-delay:-2.8s}' +
      '@keyframes xm-tw{from{opacity:.5}to{opacity:1}}' +
      '.st-thinking .xm-c{animation:xm-tw 2.6s ease-in-out infinite alternate}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: on a run the sets chase in turn; each small bulb lights once per 1.2 s
      // with ~.15 s ramps.
      '.st-run .xm-c{animation:xm-chase 1.2s linear infinite}.st-run .xm-c1{animation-delay:-.8s}.st-run .xm-c2{animation-delay:-.4s}' +
      '@keyframes xm-chase{0%,26%{opacity:1}38%,88%{opacity:.14}100%{opacity:1}}' +
      // The fuse blows: two slow flickers (under two a second), then dark.
      '.st-error .xm-c{animation:xm-fizz 2.2s ease-in-out both}.st-error .xm-c1{animation-delay:.14s}.st-error .xm-c2{animation-delay:.28s}' +
      '@keyframes xm-fizz{0%{opacity:1}14%{opacity:.2}28%{opacity:.85}44%{opacity:.1}58%{opacity:.4}72%,100%{opacity:.04}}' +
      '.st-done .xm-c{animation:xm-full 1.4s ease-out both}@keyframes xm-full{from{opacity:.5}to{opacity:1}}' +
      '.st-sleeping .xm-lit{opacity:.5}' +
      '.xm-tga{animation:xm-tw 4.6s ease-in-out infinite alternate}.xm-tgb{animation:xm-tw 5.4s ease-in-out -2s infinite alternate}' +
      '.st-error .xm-tgar{animation:xm-out 1.4s ease-in .5s both}' +
      '@keyframes xm-out{to{opacity:.1}}@keyframes xm-in{to{opacity:1}}' +
      // The tree's glow and its starburst.
      '.xm-tgl{opacity:.8}.st-error .xm-tgl{animation:xm-out 1.6s ease-in .3s both}.st-done .xm-tgl{animation:xm-in 2s ease-out both}' +
      '.xm-th{animation:xm-th 5s ease-in-out infinite alternate}@keyframes xm-th{from{opacity:.6}to{opacity:1}}' +
      '.st-done .xm-th{animation:xm-thd 2.4s ease-out both}@keyframes xm-thd{0%{opacity:.7;transform:scale(1)}45%{opacity:1;transform:scale(1.45)}100%{opacity:1;transform:scale(1.25)}}' +
      '.st-error .xm-th{animation:xm-out 1.4s ease-in .3s both}' +
      '.st-run .xm-top{animation:xm-rot 5s linear infinite}@keyframes xm-rot{to{transform:rotate(360deg)}}' +
      // Done: presents pop up under the tree, the clock's hand reaches midnight, glitter twinkles.
      '.xm-gift{transform-box:fill-box;transform-origin:50% 100%;transform:scale(0)}' +
      '.st-done .xm-gift{animation:xm-pop .8s cubic-bezier(.3,1.6,.5,1) both}@keyframes xm-pop{from{transform:scale(0)}to{transform:scale(1)}}' +
      '.xm-gs{opacity:0}.st-done .xm-gs{animation:xm-gs 1.5s ease-in-out infinite}.st-done .xm-gs1{animation-delay:-.5s}.st-done .xm-gs2{animation-delay:-1s}' +
      '@keyframes xm-gs{0%,100%{opacity:0}50%{opacity:.95}}' +
      '.st-done .xm-min{animation:xm-min 1.2s ease-in-out .4s both}@keyframes xm-min{to{transform:rotate(30deg)}}' +
      // The fire, the candles, the stockings.
      '.xm-fl{transform-box:fill-box;transform-origin:50% 100%;animation:xm-fl .9s ease-in-out infinite alternate}' +
      '@keyframes xm-fl{from{transform:scale(1,.84) skewX(-4deg)}to{transform:scale(.9,1.06) skewX(4deg)}}' +
      '.xm-fg{animation:xm-fg 3s ease-in-out infinite alternate}@keyframes xm-fg{from{opacity:.7}to{opacity:1}}' +
      '.st-responding .xm-flg{animation:xm-roar 1.4s ease-out both}@keyframes xm-roar{to{transform:scale(1.12,1.4)}}' +
      '.st-responding .xm-fg{animation-duration:1.2s}' +
      '.xm-em{opacity:0;animation:xm-em 3.4s ease-out infinite}@keyframes xm-em{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-130px)}}' +
      '.st-responding .xm-em{animation-duration:1.8s}' +
      '.xm-cd{transform-box:fill-box;transform-origin:50% 100%;animation:xm-cd 1.8s ease-in-out infinite alternate}' +
      '@keyframes xm-cd{from{transform:scale(.9,.92) rotate(-4deg)}to{transform:scale(1.06,1.08) rotate(4deg)}}' +
      '.xm-cg{animation:xm-fg 2.6s ease-in-out infinite alternate}' +
      '.xm-stk{animation:xm-sw 6s ease-in-out infinite alternate}@keyframes xm-sw{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
      '.st-responding .xm-stk{animation:xm-sw2 1.6s ease-in-out infinite alternate}@keyframes xm-sw2{from{transform:rotate(-4deg)}to{transform:rotate(3deg)}}' +
      // Tool: the toy train chugs round the front of the tree.
      '.st-tool .xm-train{animation:xm-chug 3.6s linear infinite}' +
      '@keyframes xm-chug{0%{transform:translateX(0)}84%{opacity:1}92%{opacity:0;transform:translateX(340px)}93%{opacity:0;transform:translateX(-10px)}100%{opacity:1;transform:translateX(0)}}' +
      '.st-tool .xm-tb{animation:xm-tb .28s ease-in-out infinite alternate}@keyframes xm-tb{to{transform:translateY(-1.5px)}}' +
      '.xm-pf{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .xm-pf{animation:xm-pf 1.2s ease-out infinite}' +
      '@keyframes xm-pf{0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:.55}100%{opacity:0;transform:translate(-22px,-34px) scale(1.8)}}' +
      // Error: the plug sparks (small, once per 1.3 s) and smokes.
      '.xm-sp{opacity:0}.st-error .xm-sp{animation:xm-sp 1.3s ease-out infinite}' +
      '@keyframes xm-sp{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}55%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.xm-zap{opacity:0}.st-error .xm-zap{animation:xm-zap 1.3s ease-out .1s infinite}@keyframes xm-zap{0%,100%{opacity:0}8%{opacity:.8}36%{opacity:0}}' +
      '.xm-smo{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-error .xm-smo{animation:xm-smo 2.6s ease-out .5s infinite}' +
      '@keyframes xm-smo{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:.5}100%{opacity:0;transform:translate(-10px,-70px) scale(1.6)}}' +
      // The window: moon, stars, chimney smoke; web lights the town's windows in a ripple; read grows the frost.
      '.xm-mh{animation:xm-mh 7s ease-in-out infinite alternate}@keyframes xm-mh{from{opacity:.65}to{opacity:1}}' +
      '.st-read .xm-mh{animation:xm-in 2s ease-out both}' +
      '.xm-st{animation:xm-st 3s ease-in-out infinite alternate}@keyframes xm-st{from{opacity:.2}to{opacity:.9}}.st-web .xm-st{animation-duration:1.1s}' +
      '.st-web .xm-tw{animation:xm-rip 2.4s ease-in-out infinite;animation-delay:calc(var(--k) * .16s)}@keyframes xm-rip{0%,100%{opacity:.25}30%{opacity:1}}' +
      '.xm-chs{animation:xm-chs 5s ease-out infinite}@keyframes xm-chs{0%{opacity:0;transform:translate(0,0)}30%{opacity:.6}100%{opacity:0;transform:translate(10px,-26px)}}' +
      '.st-web .xm-chs{animation-duration:2s}' +
      '.xm-fern{transform-box:fill-box;transform:scale(.55);opacity:.45}.st-read .xm-fern{animation:xm-fern 2.4s ease-out both}@keyframes xm-fern{to{transform:scale(1);opacity:.95}}' +
      '.xm-fv{transform-box:fill-box;transform-origin:50% 100%;opacity:.7}.st-read .xm-fv{animation:xm-fv 2.6s ease-out both}@keyframes xm-fv{to{transform:scaleY(2.3);opacity:1}}' +
      // Run: the sleigh and its team streak across the moon, leaving a trail of glints.
      '.xm-sl{opacity:0}.st-run .xm-sl{animation:xm-sl 4.5s linear infinite}' +
      '@keyframes xm-sl{0%{opacity:0;transform:translate(-170px,80px) rotate(-10deg)}4%{opacity:1}38%{transform:translate(0,0) rotate(-6deg)}' +
      '72%{opacity:1;transform:translate(250px,-40px) rotate(-3deg)}73%,100%{opacity:0;transform:translate(250px,-40px) rotate(-3deg)}}' +
      '.xm-tr{opacity:0}.st-run .xm-tr{animation:xm-tr 4.5s ease-out infinite}@keyframes xm-tr{0%{opacity:0}3%{opacity:.95}24%,100%{opacity:0}}' +
      // The streak draws in behind the runners on the sleigh's own clock, then fades.
      '.xm-strk{stroke-dasharray:1 1;stroke-dashoffset:1;opacity:0}.st-run .xm-strk{animation:xm-strk 4.5s linear infinite}' +
      '@keyframes xm-strk{0%{stroke-dashoffset:1;opacity:1}38%{stroke-dashoffset:.57}72%{stroke-dashoffset:0;opacity:1}96%,100%{stroke-dashoffset:0;opacity:0}}' +
      '.st-run .xm-mh{animation:xm-in 1.2s ease-out both}' +
      '.xm-snow{animation:xm-snow 10s linear infinite}@keyframes xm-snow{to{transform:translate(var(--sx),var(--sy))}}' +
      // The cocoa steams.
      '.xm-stm{animation:xm-stm 3.4s ease-out infinite}.xm-stm2{animation-delay:-1.7s}' +
      '@keyframes xm-stm{0%{opacity:0;transform:translateY(4px)}30%{opacity:.55}100%{opacity:0;transform:translateY(-20px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="xm-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0709"/><stop offset=".6" stop-color="#110b0d"/><stop offset="1" stop-color="#150d0e"/></linearGradient>' +
      '<pattern id="xm-wp" width="64" height="96" patternUnits="userSpaceOnUse"><rect width="30" height="96" fill="#1b1114"/><path d="M47 34l5 14-5 14-5-14z" fill="#1f1418"/></pattern>' +
      '<pattern id="xm-brick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#2c1613"/><path d="M0 9.5H40M0 19.5H40M10 0V9.5M30 10V20" stroke="#170b09" stroke-width="2"/></pattern>' +
      '<linearGradient id="xm-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170e0a"/><stop offset="1" stop-color="#0c0605"/></linearGradient>' +
      '<linearGradient id="xm-tree" gradientUnits="userSpaceOnUse" x1="236" y1="0" x2="584" y2="0"><stop offset="0" stop-color="#1e4a31"/><stop offset=".45" stop-color="#123320"/><stop offset="1" stop-color="#071710"/></linearGradient>' +
      '<radialGradient id="xm-fg"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".3"/><stop offset=".45" stop-color="#ff8a3a" stop-opacity=".1"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xm-fi"><stop offset="0" stop-color="#ffb050" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="xm-fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070303"/><stop offset=".6" stop-color="#1a0805"/><stop offset="1" stop-color="#4a1a08"/></linearGradient>' +
      '<linearGradient id="xm-flm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".95"/><stop offset=".45" stop-color="#ff9a3a" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="xm-cgl"><stop offset="0" stop-color="#ffd27a" stop-opacity=".38"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xm-tg"><stop offset="0" stop-color="#ffc070" stop-opacity=".16"/><stop offset=".5" stop-color="#ff9a6a" stop-opacity=".06"/><stop offset="1" stop-color="#ff9a6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xm-thg"><stop offset="0" stop-color="#ffb08a" stop-opacity=".55"/><stop offset=".35" stop-color="#ef8660" stop-opacity=".2"/><stop offset="1" stop-color="#ef8660" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xm-zg"><stop offset="0" stop-color="#fff2c0" stop-opacity=".9"/><stop offset=".35" stop-color="#ffb040" stop-opacity=".4"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="xm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081022"/><stop offset="1" stop-color="#1a2a4a"/></linearGradient>' +
      '<radialGradient id="xm-mg" cx=".42" cy=".4"><stop offset="0" stop-color="#fffaea"/><stop offset="1" stop-color="#e6d8b8"/></radialGradient>' +
      '<radialGradient id="xm-mhg"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".32"/><stop offset=".4" stop-color="#cfe0ff" stop-opacity=".1"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xm-ml"><stop offset="0" stop-color="#8fb0e8" stop-opacity=".08"/><stop offset="1" stop-color="#8fb0e8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="xm-fvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f0ff" stop-opacity="0"/><stop offset="1" stop-color="#e6f0ff" stop-opacity=".32"/></linearGradient>' +
      `<clipPath id="xm-win"><path d="${GLASS}"/></clipPath>` +
      '</defs>' +
      // The room: wallpaper, the chair rail and panelling, the floor and a braided rug.
      '<rect width="1600" height="1000" fill="url(#xm-wall)"/><rect y="22" width="1600" height="616" fill="url(#xm-wp)" fill-opacity=".75"/>' +
      '<rect y="646" width="1600" height="224" fill="#100a0c"/>' +
      `<path d="${panels}" fill="none" stroke="#1c1215" stroke-width="3"/>` +
      '<rect y="636" width="1600" height="10" fill="#22161a"/><path d="M0 636H1600" stroke="#3a262a" stroke-width="1.6"/>' +
      '<rect y="868" width="1600" height="18" fill="#191013"/><path d="M0 869H1600" stroke="#2a1a1c" stroke-width="2"/>' +
      '<rect y="886" width="1600" height="160" fill="url(#xm-floor)"/>' +
      `<path d="M0 906H1600M0 930H1600M0 958H1600M0 988H1600${seams}" stroke="#0a0504" stroke-width="2"/>` +
      '<ellipse cx="430" cy="950" rx="400" ry="40" fill="#2a0e12" fill-opacity=".85"/>' +
      '<ellipse cx="430" cy="950" rx="360" ry="33" fill="none" stroke="#3e161c" stroke-width="5" stroke-dasharray="12 5"/>' +
      '<ellipse cx="430" cy="950" rx="290" ry="25" fill="none" stroke="#24402e" stroke-opacity=".6" stroke-width="5" stroke-dasharray="10 6"/>' +
      // The warm light of the fire and the tree.
      '<circle class="xm-fg" cx="160" cy="790" r="420" fill="url(#xm-fg)"/>' +
      `<circle class="xm-tgl" cx="${TX}" cy="520" r="340" fill="url(#xm-tg)"/>` +
      // The crown moulding and a garland of small lights under it.
      `<g class="mv-t"><rect width="1600" height="22" fill="#1a1113"/><path d="M0 22H1600" stroke="#2e1e20" stroke-width="2"/>` +
      `<g class="xm-tgar"><path d="M-10 24${swags}" fill="none" stroke="#12301e" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M-10 24${swags}" fill="none" stroke="#1f4a30" stroke-width="3.5" stroke-dasharray="3 6"/>${topLights}</g></g>` +
      // The chimney breast and its wreath.
      '<rect x="40" y="22" width="240" height="524" fill="#171012"/><path d="M40 22V546M280 22V546" stroke="#0a0607" stroke-width="3"/>' +
      '<path d="M160 24V264" stroke="#8e2a32" stroke-width="5"/>' +
      '<circle cx="160" cy="330" r="57" fill="none" stroke="#0e2a1a" stroke-width="30"/>' +
      `<circle cx="160" cy="330" r="57" fill="none" stroke="${PINE_HI}" stroke-width="16" stroke-dasharray="5 8" stroke-opacity=".8"/>` +
      `<circle cx="160" cy="330" r="70" fill="none" stroke="${PINE}" stroke-width="7" stroke-dasharray="3 6"/>` +
      `<circle cx="160" cy="330" r="44" fill="none" stroke="${PINE}" stroke-width="6" stroke-dasharray="3 6"/>` +
      spots(
        Array.from({ length: 10 }, (_, i) => {
          const at = (i / 10) * Math.PI * 2 - 1.2
          const r = i % 2 === 0 ? 62 : 50

          return spot(160 + Math.cos(at) * r, 330 + Math.sin(at) * r)
        }).join(''),
        3.4,
        '#b02a34',
      ) +
      '<path d="M157 388l-8 26l7 -4l4 6ZM163 388l8 26l-7 -4l-4 6Z" fill="#a8323a"/>' +
      '<path d="M160 386c-14 -12 -30 -4 -22 6c6 6 16 0 22 -6Zm0 0c14 -12 30 -4 22 6c-6 6 -16 0 -22 -6Z" fill="#c8424a"/><circle cx="160" cy="386" r="4.5" fill="#8e2a32"/>' +
      // The fireplace: brick surround, the fire on its logs, the hearth.
      '<rect x="40" y="566" width="240" height="306" fill="url(#xm-brick)"/>' +
      '<path d="M80 872V744Q80 692 160 692Q240 692 240 744V872Z" fill="url(#xm-fb)"/>' +
      '<path d="M80 872V744Q80 692 160 692Q240 692 240 744" fill="none" stroke="#3a1c14" stroke-width="6"/>' +
      '<path d="M96 760H224M90 790H230M88 820H232M120 744V760M170 760V790M140 790V820M200 790V820" stroke="#000" stroke-opacity=".35" stroke-width="2"/>' +
      `<g transform="translate(160 862)"><g class="xm-flg"><ellipse class="xm-fg" cx="0" cy="-24" rx="74" ry="62" fill="url(#xm-fi)"/>${flames}${cores}</g></g>` +
      embers +
      '<path d="M100 848L214 862L210 872L96 860Z" fill="#2e180e"/><path d="M220 846L106 862L110 872L224 858Z" fill="#3a2012"/>' +
      `<path d="${dot(98, 854, 6)}${dot(222, 852, 6)}" fill="#5a3420"/>` +
      '<path d="M98 868Q160 858 222 868V872H98Z" fill="#ff7a2a" fill-opacity=".85"/>' +
      '<path d="M90 872V852h6v20ZM224 872V852h6v20Z" fill="#1a1210"/>' +
      '<rect x="14" y="872" width="292" height="20" rx="2" fill="#2a1c1a"/><path d="M14 873H306" stroke="#4a3430" stroke-width="2"/>' +
      '<ellipse class="xm-fg" cx="160" cy="906" rx="240" ry="38" fill="url(#xm-fg)"/>' +
      // The mantel: shelf, the clock a few minutes to midnight, two candles, stockings and a lit garland.
      '<rect x="20" y="542" width="280" height="18" rx="2" fill="#3b2418"/><path d="M20 543H300" stroke="#6a4228" stroke-width="2"/>' +
      '<rect x="34" y="560" width="252" height="8" fill="#2a180f"/><path d="M44 568h14l-4 18h-6ZM262 568h14l-4 18h-6Z" fill="#2a180f"/>' +
      '<path d="M140 542V518Q140 498 160 498Q180 498 180 518V542Z" fill="#2c1a10" stroke="#5a3a22" stroke-width="2"/>' +
      '<circle cx="160" cy="520" r="12" fill="#d8c8a4" fill-opacity=".7"/><path d="M160 520V512" stroke="#1a0e08" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g transform="translate(160 520)"><path class="xm-min" d="M0 0L-5 -8.7" stroke="#1a0e08" stroke-width="1.6" stroke-linecap="round"/></g>' +
      candle(46, 0.6) +
      candle(274, 1.3) +
      stocking(78, '#8e2630', 'stripes', 0) +
      stocking(158, '#24603e', 'dots', 2.1) +
      stocking(238, '#c0604c', 'burst', 4.2) +
      `<path d="${garland}" fill="none" stroke="${PINE}" stroke-width="12" stroke-linecap="round"/>` +
      `<path d="${garland}" fill="none" stroke="${PINE_HI}" stroke-width="5" stroke-dasharray="3 6" stroke-opacity=".8"/>` +
      spots(Array.from({ length: 8 }, (_, i) => spot(18 + i * 40, 563)).join(''), 3, '#b02a34') +
      // The tree: tiers, needles, wires and beads, baubles, the lights and the starburst; its skirt and stand.
      `<rect x="${TX - 12}" y="836" width="24" height="36" fill="#2a170e"/>` +
      treeBody +
      `<path d="${wires}" fill="none" stroke="#06120a" stroke-width="1.6"/>` +
      `<path d="${beads}" fill="none" stroke="#d9b45c" stroke-opacity=".5" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 7"/>` +
      baubles(next, bulbs) +
      lights([...bulbs, ...mantelBulbs]) +
      topper(next) +
      `<ellipse cx="${TX}" cy="874" rx="150" ry="15" fill="#5a1820"/>` +
      `<ellipse cx="${TX}" cy="876" rx="150" ry="15" fill="none" stroke="#e6d8c0" stroke-opacity=".45" stroke-width="3" stroke-dasharray="2 6"/>` +
      gift(270, 880, 50, 40, '#8e2630', '#e0b048', 0.15) +
      gift(324, 880, 34, 56, '#24603e', '#d84a4a', 0.45) +
      gift(446, 880, 50, 34, '#b05a48', '#f0e2c8', 0.75) +
      gift(500, 880, 40, 48, '#34528c', '#c8d4e4', 1.05) +
      gift(366, 888, 54, 26, '#a8842c', '#a0283a', 1.35) +
      // The lights' cord to a power strip on the floor: its plug sparks on an error.
      '<path d="M402 870C392 892 350 900 330 903" fill="none" stroke="#0c0806" stroke-width="3"/>' +
      '<rect x="298" y="898" width="34" height="10" rx="2" fill="#2a2224" stroke="#4a3e40" stroke-width="1.2"/><rect x="322" y="899" width="6" height="5" fill="#5a4a44"/>' +
      '<circle class="xm-zap" cx="324" cy="900" r="76" fill="url(#xm-zg)"/>' +
      sparks +
      '<path class="xm-smo" d="M322 894c-6 -8 4 -14 -2 -22c-5 -7 3 -12 0 -18" fill="none" stroke="#9a9090" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
      // The toy train on its track in front of the tree.
      '<path d="M130 919H650" stroke="#3a2c26" stroke-width="3"/>' +
      `<path d="${ties}" stroke="#241814" stroke-width="5"/>` +
      '<g transform="translate(140 919)"><g class="xm-train"><g transform="scale(1.35)"><g class="xm-tb">' +
      '<rect x="0" y="-22" width="34" height="16" rx="2" fill="#24603e"/><rect x="5" y="-31" width="24" height="10" rx="1.5" fill="#b05a48"/><path d="M17 -31v10M5 -26h24" stroke="#e0b048" stroke-width="2"/>' +
      '<rect x="38" y="-24" width="22" height="18" rx="2" fill="#3a2a22"/><path d="M34 -10h4M60 -10h4" stroke="#1a1210" stroke-width="2"/>' +
      '<path d="M64 -6V-38H82V-26H106Q112 -26 112 -17Q112 -8 106 -6Z" fill="#9a2e2e"/><rect x="62" y="-42" width="22" height="5" rx="1" fill="#2a1a16"/>' +
      '<path d="M97 -26V-38H95V-42H107V-38H105V-26Z" fill="#2a1a16"/><path d="M108 -8L118 -2H108Z" fill="#c9a24a"/>' +
      '<rect x="68" y="-34" width="9" height="8" fill="#ffcf7a" fill-opacity=".8"/><path d="M82 -20H106" stroke="#c9a24a" stroke-width="2"/>' +
      `<circle cx="112" cy="-18" r="2.4" fill="#ffe2a0"/></g><path d="${wheels}" fill="#1a1210" stroke="#c9a24a" stroke-opacity=".6" stroke-width="1.4"/>${puffs}</g></g></g>` +
      roomGlitter +
      // The window at the right: moonlight on the wall, the casing, the night outside, frost, frame, sill, drapes.
      '<g class="mv-r"><g class="mv-t">' +
      '<circle cx="1380" cy="280" r="340" fill="url(#xm-ml)"/>' +
      '<path d="M1206 488V204A174 124 0 0 1 1554 204V488Z" fill="#1c1315"/>' +
      '<g clip-path="url(#xm-win)"><rect x="1210" y="90" width="340" height="390" fill="url(#xm-sky)"/>' +
      spots(stars.slice(6).join(''), 0.9, '#e8eeff', ' stroke-opacity=".55"') +
      `<path class="xm-st" d="${stars.slice(0, 6).join('')}" stroke="#f4f8ff" stroke-width="2.6" stroke-linecap="round"/>` +
      `<circle class="xm-mh" cx="${MX}" cy="${MY}" r="150" fill="url(#xm-mhg)"/><circle cx="${MX}" cy="${MY}" r="56" fill="url(#xm-mg)"/>` +
      `<path d="${dot(MX - 16, MY - 10, 10)}${dot(MX + 18, MY + 14, 7)}${dot(MX + 8, MY - 24, 5)}${dot(MX - 20, MY + 22, 6)}" fill="#c8bb9e" fill-opacity=".35"/>` +
      `<path class="xm-strk" pathLength="1" d="${streak}" stroke="#ffe7a8" stroke-opacity=".22" stroke-width="8" stroke-linecap="round" fill="none"/>` +
      `<path class="xm-strk" pathLength="1" d="${streak}" stroke="#fff4d0" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" fill="none"/>` +
      `<g transform="translate(${MX} ${MY})"><g class="xm-sl">${sleigh()}</g></g>` +
      trail +
      town() +
      snow(61, 30, 1.3, 11, 34, 0.75) +
      snow(62, 14, 2, 7, 56, 0.85) +
      skyGlitter +
      '<rect class="xm-fv" x="1222" y="392" width="316" height="78" fill="url(#xm-fvg)"/>' +
      `<g fill="none" stroke="#e8f2ff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round">${ferns}</g></g>` +
      `<path d="${GLASS}" fill="none" stroke="#2e2022" stroke-width="12"/>` +
      '<path d="M1380 96V470M1222 290H1538M1222 384H1538" stroke="#2e2022" stroke-width="7"/>' +
      '<rect x="1200" y="468" width="360" height="16" rx="2" fill="#2e1e1a"/><path d="M1200 469H1560" stroke="#4a3228" stroke-width="2"/>' +
      // A snow globe and a poinsettia on the sill.
      '<path d="M1246 468L1249 458H1275L1278 468Z" fill="#3a2418"/>' +
      '<circle cx="1262" cy="444" r="15" fill="#8fb0d8" fill-opacity=".16" stroke="#c8dcf0" stroke-opacity=".5" stroke-width="1.4"/>' +
      `<path d="M1262 432L1256 452H1268Z" fill="#2a6040"/><path d="${dot(1256, 438, 1.2)}${dot(1268, 442, 1.2)}${dot(1260, 448, 1.2)}" fill="#fff" fill-opacity=".8"/>` +
      '<path d="M1253 436q4 -6 10 -7" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M1486 468L1483 448H1517L1514 468Z" fill="#6a2a22"/><rect x="1483" y="448" width="34" height="4" fill="#b08a3a"/>' +
      '<path d="M1486 446q-14 -4 -16 -14q12 0 18 10ZM1514 446q14 -4 16 -14q-12 0 -18 10Z" fill="#1f4a2e"/>' +
      `<path d="${leaves}" fill="#a8202e"/><path d="${dot(1498, 437, 1.8)}${dot(1503, 439, 1.8)}${dot(1500, 434, 1.6)}" fill="#e8c040"/>` +
      curtain(false) +
      curtain(true) +
      `<path d="M1166 26H1594V70${Array.from({ length: 6 }, (_, i) => `Q${f(1594 - i * 71.3 - 35.7)} 90 ${f(1594 - (i + 1) * 71.3)} 70`).join('')}Z" fill="#46121b"/>` +
      `<path d="M1166 70${scallops}" fill="none" stroke="#b08a3a" stroke-opacity=".5" stroke-width="2.4"/>` +
      '<path d="M1166 30H1594" stroke="#6a2a32" stroke-opacity=".6" stroke-width="2"/>' +
      '</g></g>',
    nook:
      // A knitting basket by the armchair: where the beanie came from.
      '<path d="M22 425Q40 458 96 452" fill="none" stroke="#a8323a" stroke-width="1.6"/>' +
      '<path d="M30 412L12 372M46 408L70 370" stroke="#c9a24a" stroke-width="2.4" stroke-linecap="round"/>' +
      `<path d="${dot(12, 371, 3)}${dot(70, 369, 3)}" fill="#c9a24a"/>` +
      `<circle cx="22" cy="414" r="11" fill="#a8323a"/><circle cx="44" cy="410" r="12" fill="#d8ccb4" fill-opacity=".85"/><circle cx="62" cy="416" r="9" fill="#24603e"/>` +
      '<path d="M14 408q8 6 16 0M36 402q8 8 16 0M56 412q6 6 12 0" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.6"/>' +
      '<path d="M4 420H72L66 456H10Z" fill="#4a3220"/>' +
      '<path d="M6 432H70M8 444H68M18 420V456M32 420V456M46 420V456M60 420V456" stroke="#2e1e12" stroke-width="2"/>' +
      '<rect x="2" y="417" width="72" height="6" rx="3" fill="#5a3e28"/>',
  }
}
