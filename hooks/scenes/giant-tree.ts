import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Giant Tree: a tree as big as a mountain. Its trunk climbs out of frame at the right with rope-ladder villages on
// it, its branches roof the sky, and its roots run off to the left as ridges with forests and climbers' lanterns on
// them. Claude works in a treehouse office carved into the trunk. A command drops a giant leaf and hauls a basket
// lift up; an error snaps a branch and swings the ladders; done makes the tree bloom and its petals drift down.
const LIME = '#c6d96a'
const GLOW = '#e8f4ae'
const WARM = '#f0b45a'
const BARK = '#15120b'
const BARK_LIT = '#2c2716'
const RIM = '#a4b85a'
const ROOT = '#0a0c07'
const LEAF_FRONT = '#132010'
const FRINGE = '#182812'
const WOOD = '#3a2c18'
const WOOD_LIT = '#6a5232'
const WOOD_DARK = '#1a130a'
const ROPE = '#5a4c30'
const PAPER = '#e4e0c2'
const PETAL = '#f2f7d2'

type Pt = readonly [number, number]
type Seg = readonly [Pt, Pt, Pt, Pt]

/** Whole units, for the big shapes where a tenth would only cost characters. */
const n = (value: number): string => String(Math.round(value))

const circle = (x: number, y: number, r: number): string =>
  `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`

const bell = (x: number, at: number, width: number): number => Math.exp(-(((x - at) / width) ** 2))

function bez([a, b, c, d]: Seg, t: number): Pt {
  const u = 1 - t
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const

  return [k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0], k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1]]
}

function quad(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t

  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
}

/** A big leaf from (x, y) along angle `a`, `l` long. */
function leaf(x: number, y: number, l: number, w: number, a: number): string {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const p = (u: number, v: number) => `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`

  return `M${p(0, 0)}C${p(l * 0.3, w)} ${p(l * 0.75, w * 0.7)} ${p(l, 0)}C${p(l * 0.75, -w * 0.7)} ${p(l * 0.3, -w)} ${p(0, 0)}Z`
}

/** A small leaf in two curves, `w` its bulge. */
function leaflet(x: number, y: number, l: number, w: number, a: number): string {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const v = (u: number, k: number) => `${n(u * c - k * s)} ${n(u * s + k * c)}`

  return `M${n(x)} ${n(y)}q${v(l / 2, w)} ${v(l, 0)}q${v(-l / 2, -w)} ${v(-l, 0)}Z`
}

/** Firs along a ridge: the forests on the roots are what tell how big the roots are. */
function firs(rows: readonly (readonly [Seg, number, number, number])[], size: Pt, next: () => number): string {
  let d = ''

  for (const [seg, t0, t1, count] of rows) {
    for (let k = 0; k < count; k += 1) {
      const [x, y] = bez(seg, t0 + ((k + next() * 0.8) / count) * (t1 - t0))
      const h = size[0] + next() * (size[1] - size[0])

      d += `M${n(x)} ${n(y - h)}l${n(h * 0.3)} ${n(h + 3)}h${n(-h * 0.6)}z`
    }
  }

  return d
}

/** A rope ladder from (x, y): two ropes, and rungs as one dashed stroke. It sways from its top. */
const ladder = (x: number, y: number, len: number, delay: number, cls = 'gt-lad'): string =>
  `<g class="${cls}" style="animation-delay:${f(delay)}s" fill="none" stroke="${ROPE}"><path d="M${n(x)} ${n(y)}v${len}m8 0v${-len}" stroke-width="1.6"/>` +
  `<path d="M${n(x + 4)} ${n(y + 8)}v${len - 8}" stroke-width="8" stroke-dasharray="1.4 7.6"/></g>`

/** Leaf masses along the canopy's lower edge: three layers of round clumps, a fringe of leaves, a lit rim under them. */
function canopy(x0: number, x1: number, edge: (x: number) => number, next: () => number): string {
  let back = ''
  let front = ''
  let rim = ''
  let fringe = ''

  for (let x = x0; x < x1; x += 58 + next() * 26) {
    const r = 44 + next() * 30
    const ye = edge(x) + (next() - 0.5) * 16
    const fx = x - r * 0.2
    const fy = ye - r * 0.3
    const fr = r * 0.7

    back += circle(x + r * 0.2, ye - r * 0.9, r * 1.2)
    front += circle(fx, fy, fr)
    rim += `M${n(fx - fr)} ${n(fy)}a${n(fr)} ${n(fr)} 0 0 0 ${n(2 * fr)} 0`

    for (let k = 0; k < 2; k += 1) {
      const a = 0.8 + (k + next() * 0.8) * 0.8

      fringe += leaflet(fx + Math.cos(a) * fr * 0.85, fy + Math.sin(a) * fr * 0.85, 16 + next() * 10, 11, a + (next() - 0.5) * 0.6)
    }
  }

  return (
    `<path d="${back}" fill="#0d150a"/><path d="${front}" fill="${LEAF_FRONT}"/>` +
    `<path d="${fringe}" fill="${FRINGE}"/><path d="${rim}" fill="none" stroke="${LIME}" stroke-opacity=".14" stroke-width="2"/>`
  )
}

/** A flower that opens when the work is done: a glow, five round petals as one dotted ring, a golden heart. */
const blossom = (x: number, y: number, r: number, delay: number): string =>
  `<g class="gt-bl" style="animation-delay:${f(delay)}s"><circle cx="${x}" cy="${y}" r="${f(r * 2.6)}" fill="url(#gt-blg)"/>` +
  `<circle class="gt-pe" cx="${x}" cy="${y}" r="${f(r * 0.66)}" stroke-width="${f(r * 0.66)}" pathLength="5"/></g>`

/** Little houses on a platform: walls, a thatch of leaves, a lit window. */
function huts(list: readonly (readonly [number, number, number])[], windows: string): string {
  let body = ''
  let roof = ''
  let win = ''

  for (const [x, y, s] of list) {
    body += `M${n(x - 9 * s)} ${n(y)}v${f(-13 * s)}h${f(18 * s)}v${f(13 * s)}Z`
    roof += `M${n(x - 13 * s)} ${n(y - 11 * s)}l${f(13 * s)} ${f(-16 * s)}l${f(13 * s)} ${f(16 * s)}Z`
    win += `M${f(x - 3 * s)} ${f(y - 9 * s)}h${f(5 * s)}v${f(5 * s)}h${f(-5 * s)}Z`
  }

  return (
    `<path d="${body}" fill="#1f180d" stroke="#3e321c" stroke-width="1.2"/>` +
    `<path d="${roof}" fill="${LEAF_FRONT}" stroke="${LIME}" stroke-opacity=".22" stroke-width="1.2"/><path class="${windows}" d="${win}" fill="${WARM}"/>`
  )
}

/** A gourd house hanging on a rope from the branch, its ladder dangling under it. */
const pod = (x: number, y: number, len: number, s: number, delay: number): string =>
  `<g class="gt-pod" style="animation-delay:${f(delay)}s"><path d="M${x} ${y}v${len}" stroke="${ROPE}" stroke-width="1.4"/>` +
  `<g transform="translate(${x} ${f(y + len + 14 * s)}) scale(${s})"><circle cy="4" r="34" fill="url(#gt-lgl)"/>` +
  '<path d="M0 -14C12 -14 16 0 14 10S6 24 0 24S-12 20 -14 10S-12 -14 0 -14Z" fill="#2a2112" stroke="#4a3a20" stroke-width="1.5"/>' +
  `<path d="M-17 -5L0 -25L17 -5Z" fill="${LEAF_FRONT}" stroke="${LIME}" stroke-opacity=".25" stroke-width="1.2"/>` +
  `<circle class="gt-win" cy="5" r="3.6" fill="${WARM}"/>${ladder(-4, 24, 34, delay)}</g></g>`

const PLATFORMS: readonly { a: Pt; c: Pt; b: Pt; huts: readonly Pt[] }[] = [
  { a: [1140, 132], c: [1340, 160], b: [1580, 124], huts: [[0.3, 1], [0.64, 0.9]] },
  { a: [1160, 272], c: [1380, 306], b: [1640, 258], huts: [[0.22, 1.15], [0.5, 1], [0.8, 0.95]] },
  { a: [1150, 392], c: [1360, 426], b: [1640, 380], huts: [[0.36, 1.2], [0.7, 1.05]] },
]

// The great root's crest, from the trunk round to its far foot, and the underside of the arch it throws.
const CREST: readonly [Seg, Seg, Seg, Seg] = [
  [[840, 810], [740, 822], [640, 760], [560, 660]],
  [[560, 660], [480, 560], [420, 505], [330, 505]],
  [[330, 505], [220, 505], [120, 570], [60, 700]],
  [[60, 700], [30, 770], [0, 830], [-40, 870]],
]
const UNDER: Seg = [[300, 640], [350, 610], [420, 618], [480, 668]]
const FAR: readonly [Seg, Seg] = [
  [[1240, 640], [1080, 596], [880, 596], [720, 652]],
  [[720, 652], [650, 676], [600, 694], [520, 704]],
]

/** The laptop: a slice of log on a forked branch, its rings round the screen, a sprout and a jar of fireflies. */
function device(light: string, activity: Activity): string {
  const keys = [0, 1, 2, 3, 4, 5].map(i => `M${254 + i * 13} 321h8v3h-8z`).join('')
  const bud =
    activity === 'done'
      ? `<circle cx="-4" cy="-26" r="4.5" fill="none" stroke="${PETAL}" stroke-width="4.5" stroke-dasharray="0 1" stroke-linecap="round" pathLength="5"/><circle cx="-4" cy="-26" r="2" fill="#f0c860"/>`
      : '<circle cx="-4" cy="-26" r="3" fill="#9fc24a"/>'

  return (
    `<rect x="244" y="318" width="92" height="12" rx="3" fill="${WOOD_LIT}" stroke="#2e2214" stroke-width="1.5"/><path d="${keys}" fill="${light}" fill-opacity=".55"/>` +
    `<path d="M352 330V304M352 316L340 304M352 314L364 305" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>` +
    `<circle cx="352" cy="262" r="50" fill="#2e2214" stroke="${WOOD_DARK}" stroke-width="2"/><circle cx="352" cy="262" r="44" fill="#7a6040"/>` +
    '<circle cx="352" cy="262" r="40" fill="none" stroke="#5a4428" stroke-width="1.6"/>' +
    `<circle cx="352" cy="262" r="35" fill="#0b1208"/><circle cx="352" cy="262" r="35" fill="${light}" fill-opacity=".2"/>` +
    `<path d="M330 248H362M330 258H374M334 268H356M330 278H366" stroke="${light}" stroke-width="3" stroke-linecap="round" stroke-opacity=".9"/>` +
    `<g transform="translate(378 220)"><g class="gt-spr"><path d="M0 0C0 -10 -2 -18 -4 -24" fill="none" stroke="#5f7d2a" stroke-width="2.6"/>` +
    `<path d="${leaflet(-1, -10, 16, 11, -0.4)}${leaflet(-2, -15, 14, 10, -2.6)}" fill="#8fb444"/>${bud}</g></g>` +
    '<path d="M428 330V306Q428 300 434 300H450Q456 300 456 306V330Z" fill="#c6d96a" fill-opacity=".1" stroke="#b8c49a" stroke-opacity=".6" stroke-width="1.6"/>' +
    '<rect x="430" y="294" width="24" height="7" rx="2" fill="#5a4426"/>' +
    `<g class="gt-jf" fill="${GLOW}"><circle cx="437" cy="320" r="2.2"/><circle cx="447" cy="312" r="2"/><circle cx="443" cy="324" r="1.6"/></g>`
  )
}

export function giantTreeWorld(): World {
  const next = random(23)
  const edge = (x: number): number =>
    110 + 80 * bell(x, 150, 140) + 30 * bell(x, 640, 110) + 50 * bell(x, 980, 120) + 70 * bell(x, 1400, 170) + 12 * Math.sin(x / 41)

  // The far sky between the canopy and the horizon: stars, and a low range of mountains the roots tower over.
  const stars = ['', '']

  for (let i = 0; i < 24; i += 1) {
    stars[i % 2] += `M${n(next() * 1600)} ${n(200 + next() * 360)}h2.4v2.4h-2.4z`
  }

  let range = 'M-20 720'

  for (let x = -20; x <= 1640; x += 40) {
    range += `L${x} ${n(652 - 30 * bell(x, 760, 150) - 38 * bell(x, 1020, 120) - 22 * bell(x, 220, 160) - Math.abs(Math.sin(x / 61)) * 12 - next() * 6)}`
  }

  // The trunk: bark grooves that follow its lean, knots, glowing shelf fungi, and the villages up its face.
  let grooves = ''

  for (let i = 0; i < 12; i += 1) {
    const x0 = 1140 + i * 44 + next() * 10
    const fade = Math.max(0, 1 - i / 11)
    const end = 560 + next() * 60

    for (let y = -40; y <= end; y += 65) {
      const lean = 30 * Math.sin((Math.PI * (y + 40)) / 560) * fade - (y > 420 ? ((y - 420) / 200) ** 2 * 70 * fade : 0)

      grooves += `${y === -40 ? 'M' : 'L'}${n(x0 + lean + 4 * Math.sin(y / 60 + i * 2.1))} ${y}`
    }
  }

  const shelf = (spots: readonly Pt[]) =>
    `<g class="gt-fun">${spots.map(([x, y]) => `<circle cx="${x + 12}" cy="${y + 2}" r="25" fill="url(#gt-fg)"/>`).join('')}` +
    `<path d="${spots.map(([x, y]) => `M${x} ${y}h24a12 6 0 0 1 -24 0Z`).join('')}" fill="${LIME}" fill-opacity=".6"/></g>`
  let platforms = ''
  const hutsA: [number, number, number][] = []
  const hutsB: [number, number, number][] = []
  let strings = ''

  for (const { a, c, b, huts: on } of PLATFORMS) {
    const d = `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`

    platforms +=
      `<path d="${d}" stroke="#4a3a22" stroke-width="5"/>` +
      `<path d="${d}" stroke="#4a3a22" stroke-width="9" stroke-dasharray="1.6 22" transform="translate(0 -4)"/>`

    let last: Pt | undefined

    on.forEach(([t, s], index) => {
      const [x, y] = quad(a, c, b, t)

      ;(index % 2 === 0 ? hutsA : hutsB).push([x, y - 2, s])

      if (last !== undefined) {
        strings += `M${n(last[0] + 8)} ${n(last[1] - 16)}Q${n((last[0] + x) / 2)} ${n((last[1] + y) / 2 + 4)} ${n(x - 8)} ${n(y - 16)}`
      }

      last = [x, y]
    })
  }

  const samara = (x: number, y: number) =>
    `<g transform="translate(${x} ${y})"><g class="gt-sm"><g class="gt-sms">` +
    `<path d="M4 -4C30 -24 80 -26 104 -8C84 4 34 8 4 4Z" fill="#5e5c2a" fill-opacity=".92" stroke="${LIME}" stroke-opacity=".4" stroke-width="1.5"/>` +
    `<path d="M10 0C40 -8 70 -12 96 -8" fill="none" stroke="${LIME}" stroke-opacity=".3" stroke-width="1.2"/>` +
    `<circle r="8" fill="#3e3218" stroke="${LIME}" stroke-opacity=".5" stroke-width="1.5"/></g></g></g>`
  const trunkEdge = 'M1085 -40C1096 60 1112 160 1124 250C1134 340 1126 430 1102 520C1090 580 1070 650 1050 720'
  const trunk =
    '<g class="mv-r">' +
    `<path d="${trunkEdge}V1040H2200V-40Z" fill="url(#gt-trk)"/>` +
    `<g fill="none"><path d="${grooves}" stroke="#070604" stroke-opacity=".9" stroke-width="6"/>` +
    `<path d="${grooves}" stroke="#463e25" stroke-opacity=".6" stroke-width="2.2" transform="translate(6 0)"/>` +
    `<path d="${trunkEdge}" stroke="${RIM}" stroke-opacity=".4" stroke-width="3.5"/>${platforms}` +
    `<path class="gt-win" d="${strings}" stroke="${WARM}" stroke-opacity=".75" stroke-width="2.6" stroke-dasharray="0 9" stroke-linecap="round"/></g>` +
    `<g fill="#0a0806" stroke="${BARK_LIT}" stroke-width="3"><ellipse cx="1262" cy="200" rx="15" ry="24"/><ellipse cx="1500" cy="470" rx="12" ry="19"/></g>` +
    shelf([[1172, 210], [1192, 226], [1356, 356], [1546, 214], [1226, 488], [1600, 330]]) +
    huts(hutsA, 'gt-win') +
    huts(hutsB, 'gt-win gt-win2') +
    ladder(1440, -40, 168, 0) +
    ladder(1330, 150, 110, -1.2) +
    ladder(1250, 285, 90, -2.3) +
    ladder(1514, 280, 84, -0.6) +
    // Two little lifts that run between the platforms while a tool works.
    `<path d="M1182 134V276M1592 252V388" stroke="${ROPE}" stroke-width="1.4"/>` +
    `<g class="gt-ml" style="--up:-112px"><rect x="1176" y="256" width="13" height="10" rx="2" fill="${WOOD_LIT}"/><circle cx="1182" cy="254" r="2.4" fill="${WARM}"/></g>` +
    `<g class="gt-ml gt-ml2" style="--up:-110px"><rect x="1586" y="368" width="13" height="10" rx="2" fill="${WOOD_LIT}"/><circle cx="1592" cy="366" r="2.4" fill="${WARM}"/></g>` +
    // A cloud bank across the trunk's middle: the trunk goes up through the weather.
    '<g class="gt-ms gt-ms2" fill="url(#gt-mist)" opacity=".75"><ellipse cx="1250" cy="340" rx="220" ry="42"/><ellipse cx="1440" cy="318" rx="260" ry="54"/>' +
    '<ellipse cx="1620" cy="350" rx="220" ry="44"/></g>' +
    samara(1330, -60) +
    samara(1490, -150) +
    // A messenger bird with a rolled leaf while Claude is on the web.
    '<g transform="translate(1570 440)"><g class="gt-msg"><path class="gt-wing" d="M-12 0Q-6 -9 0 0Q6 -9 12 0" fill="none" stroke="#dfe6c8" stroke-width="2.6" stroke-linecap="round"/>' +
    `<rect x="-3" y="1" width="7" height="4" rx="2" fill="${PAPER}"/></g></g>` +
    // A buttress root, where the trunk runs down into the great root.
    '<path d="M1104 470C1092 590 1010 690 840 790L860 840C1040 800 1150 710 1210 600Z" fill="#0d0e08"/>' +
    `<path d="M1104 470C1092 590 1010 690 840 790M1150 560C1120 640 1060 700 960 760" fill="none" stroke="${RIM}" stroke-opacity=".3" stroke-width="2.4"/>` +
    '</g>'

  // The canopy: leaf masses roofing the sky, the great limbs under them, vines, and the branch with its gourd houses.
  const vine = (x: number, y: number, len: number, delay: number) => {
    let leaves = ''

    for (let k = 18; k < len; k += 26) {
      leaves += leaflet(x + Math.sin(k / 14) * 4, y + k, 13, 9, k % 52 === 18 ? 0.5 : 2.6)
    }

    return `<g class="gt-vn" style="animation-delay:${f(delay)}s"><path d="M${x} ${y}c6 ${n(len * 0.3)} -6 ${n(len * 0.6)} 2 ${len}${leaves}"/></g>`
  }
  const branchLeaves = [[-150, 10, 30], [-206, -16, 22], [-240, 46, 26], [-300, 78, 20], [-96, -6, 20], [-50, 22, 14]] as const
  let branchFringe = ''

  for (const [x, y, r] of branchLeaves) {
    for (let k = 0; k < 3; k += 1) {
      const a = 0.4 + k * 0.9 + next() * 0.3

      branchFringe += leaflet(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 13 + next() * 8, 9, a)
    }
  }

  const splinters = Array.from({ length: 5 }, (_, i) => {
    const a = -2.6 + i * 1.05 + next() * 0.3
    const reach = 50 + next() * 50

    return `<rect class="gt-spl" x="296" y="205" width="${n(7 + next() * 6)}" height="3" style="--dx:${n(Math.cos(a) * reach)}px;--dy:${n(Math.sin(a) * reach + 30)}px;animation-delay:${f(0.14 + i * 0.02)}s"/>`
  }).join('')
  const blossoms = (list: readonly (readonly [number, number, number])[]) => list.map(([x, y, r]) => blossom(x, y, r, 0.1 + next() * 1.4)).join('')

  // The great root: its body, the arch it throws over the valley, the forest along its crest, the climbers' lanterns.
  let rootlets = ''

  for (let k = 0; k < 9; k += 1) {
    const [x, y] = bez(UNDER, (k + 0.5) / 9)
    const len = 18 + next() * 34

    rootlets += `M${n(x)} ${n(y - 4)}q${n(4 + next() * 4)} ${n(len / 2)} ${n(-2 + next() * 4)} ${n(len)}`
  }

  const [s1, s2, s3, s4] = CREST
  const rootHuts = [0.12, 0.4, 0.62].map(t => {
    const [x, y] = bez(s3, t)

    return [x, y + 2, 0.95] as [number, number, number]
  })
  const crestFirs = firs([[s1, 0.5, 1, 6], [s2, 0, 0.86, 14], [s3, 0.18, 1, 15], [s4, 0, 0.4, 4]], [7, 17], next)
  const farFirs = firs([[FAR[0], 0.12, 1, 16], [FAR[1], 0, 0.7, 4]], [4, 8], next)
  const farLights = [0.34, 0.62].map(t => bez(FAR[0], t)).map(([x, y]) => `M${n(x)} ${n(y + 8)}h2.2v2.2h-2.2z`).join('')

  const flies = (count: number, box: readonly [number, number, number, number]) =>
    Array.from({ length: count }, () => {
      const style = `--x:${n((next() - 0.5) * 60)}px;--y:${n(-20 - next() * 40)}px;animation-delay:${n(-next() * 8)}s`

      return `<circle class="gt-ff${next() > 0.5 ? ' gt-ff2' : ''}" cx="${n(box[0] + next() * box[1])}" cy="${n(box[2] + next() * box[3])}" r="2" style="${style}"/>`
    }).join('')
  const flyGroup = (inner: string, extra = '') => `<g fill="${GLOW}" stroke="${LIME}" stroke-opacity=".25" stroke-width="5"${extra}>${inner}</g>`
  const shower = Array.from({ length: 16 }, (_, i) => {
    const style = `--dx:${n((next() - 0.5) * 160)}px;--r:${n(200 + next() * 300)}deg;animation-delay:${f(next() * 0.8)}s`

    return `<path class="gt-shw" d="${leaflet(20 + i * 46 + next() * 30, 160 + next() * 100, 32, 20, next() * 3)}" style="${style}"/>`
  }).join('')
  const flock = Array.from(
    { length: 5 },
    (_, i) =>
      `<g class="gt-flk" style="--dx:${n(-120 + i * 60 + next() * 40)}px;--dy:${n(-120 - next() * 80)}px;animation-delay:${f(0.15 + i * 0.06)}s">` +
      `<path class="gt-wing" d="M${123 + i * 16} ${150 + (i % 2) * 10}q3.5 -5 7 0q3.5 -5 7 0"/></g>`,
  ).join('')
  const petal = (x: number, y: number, i: number) =>
    `<ellipse class="gt-pt${i % 2 ? ' gt-pt2' : ''}" cx="${n(x)}" cy="${n(y)}" rx="6" ry="3" style="--dx:${n((next() - 0.4) * 140)}px;animation-delay:${f(0.2 + next() * 2.8)}s"/>`
  const petals = (count: number, x: number, w: number, y: number, h: number) =>
    Array.from({ length: count }, (_, i) => petal(x + next() * w, y + next() * h, i)).join('')

  // The office: the hollow carved into the trunk, rings in its walls, a round window, a leaf map, a shelf, a lantern.
  const archEdge = 'M10 470V40C10 -36 96 -84 212 -86C330 -88 432 -40 452 30'
  const rings = [24, 50, 78]
    .map(i => `M${10 + i} 470V${n(40 + i * 0.4)}C${10 + i} ${i - 36} ${n(96 + i * 0.4)} ${i - 84} 212 ${i - 86}C${n(330 - i * 0.2)} ${i - 88} ${432 - i} ${i - 40} ${452 - i} ${n(30 + i * 0.4)}`)
    .join('')
  const mapPoint = (u: number, v: number) => `${f(288 + u * Math.cos(-0.28) - v * Math.sin(-0.28))} ${f(62 + u * Math.sin(-0.28) + v * Math.cos(-0.28))}`
  const veins = [`M${mapPoint(0, 0)}L${mapPoint(123, 0)}`].concat(
    [0.25, 0.45, 0.65, 0.82].flatMap(k => [1, -1].map(side => `M${mapPoint(128 * k, 0)}L${mapPoint(128 * (k + 0.12), side * 22 * (1 - k * 0.6))}`)),
  )
  const shingles = (y: number, x0: number, angle: number, fill: string) =>
    `<path d="${Array.from({ length: 10 }, (_, i) => leaflet(x0 + i * 52, y, 66, 34, angle)).join('')}" fill="${fill}" stroke="${LIME}" stroke-opacity=".18" stroke-width="1.4"/>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'acorn',
      thought: 'spores',
      ink: '#060704',
      furniture: WOOD,
      metal: '#4a3a22',
      paper: PAPER,
      light: { idle: '#8fa64a', work: LIME, bright: '#eef7b4' },
      headTop: 208,
      glowAt: [352, 262],
      device,
      wear: {
        // A cap made of one big leaf, its tip trailing behind and a sprout on top; it ends at 252, above the eyes.
        front:
          '<path d="M66 238C50 232 36 236 24 246C40 251 54 250 66 247Z" fill="#4c6b20" stroke="#2c4012" stroke-width="2"/>' +
          '<path d="M60 252C58 228 92 208 150 206C206 206 240 226 240 252Z" fill="#5b7d27" stroke="#2c4012" stroke-width="2.5" stroke-linejoin="round"/>' +
          '<path d="M60 246H240V253H60Z" fill="#3f5a1a"/>' +
          '<path d="M30 245C80 226 120 214 166 212C196 211 222 218 236 230" fill="none" stroke="#b9d36a" stroke-opacity=".75" stroke-width="2.4"/>' +
          '<path d="M90 226L100 245M120 218L130 245M150 214L157 245M180 213L184 245M208 216L208 245" stroke="#a8c45a" stroke-opacity=".45" stroke-width="1.6"/>' +
          '<path d="M170 208C168 196 174 186 186 184C194 183 196 192 189 194" fill="none" stroke="#5a4426" stroke-width="3.5" stroke-linecap="round"/>' +
          '<path d="M186 184C192 172 206 168 214 172C208 182 196 186 186 184Z" fill="#9fc24a"/>',
      },
      seatArt:
        // A tree stump, its cut top ringed, roots flaring at its foot and a little glowing mushroom on its side.
        `<path d="M110 352C108 390 104 430 94 456H208C198 430 194 390 192 352Z" fill="#2e2214" stroke="${WOOD_DARK}" stroke-width="2"/>` +
        `<path d="M124 358C122 392 120 424 114 454M146 358V456M168 358C170 392 172 424 180 454" fill="none" stroke="${WOOD_DARK}" stroke-width="2.4"/>` +
        `<path d="M94 456C98 446 104 440 112 438M208 456C204 446 198 440 190 438" fill="none" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>` +
        `<ellipse cx="151" cy="352" rx="42" ry="7" fill="#7a6040" stroke="${WOOD}" stroke-width="1.6"/>` +
        '<g fill="none" stroke="#5a4428" stroke-width="1.2"><ellipse cx="151" cy="352" rx="30" ry="4.6"/><ellipse cx="151" cy="352" rx="16" ry="2.4"/></g>' +
        `<path d="M196 404C196 397 207 397 207 404Z" fill="${LIME}" fill-opacity=".75"/><path d="M201.5 404V410" stroke="#cfc8a0" stroke-width="2"/>`,
      tableArt:
        // A split log for a desk, its cut face up and bark under it, on two forked branches lashed with rope.
        '<path d="M196 350L188 456M196 350L214 392M440 350L450 456M440 350L424 390" fill="none" stroke="#2e2214" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M184 366H202M436 366H452" stroke="#a08a5a" stroke-width="3"/>' +
        `<rect x="166" y="329" width="304" height="8" rx="2" fill="${WOOD_LIT}"/>` +
        `<path d="M166 336H470C468 346 462 352 452 352H184C174 352 168 346 166 336Z" fill="#2e2214" stroke="${WOOD_DARK}" stroke-width="1.5"/>` +
        `<path d="M190 344H250M280 346H360M390 343H440" stroke="${WOOD_DARK}" stroke-width="2"/>` +
        '<path d="M166 330H470" stroke="#8a7050" stroke-width="1.5" stroke-opacity=".8"/>',
    },
    style:
      // Things that turn about their own box: CSS pivots instead of wrapper groups.
      '.gt-lad,.gt-vn,.gt-pod{transform-box:fill-box;transform-origin:50% 0}' +
      '.gt-bl,.gt-pt,.gt-shw,.gt-spl,.gt-wing,.gt-dl{transform-box:fill-box;transform-origin:center}' +
      '.gt-pe{fill:none;stroke:#f2f7d2;stroke-dasharray:0 1;stroke-linecap:round}' +
      // Ambient: the canopy breathes, vines and ladders sway, fireflies wander, the climbers' lanterns move up the root.
      '.gt-sw{animation:gt-sw 9s ease-in-out infinite alternate}.gt-sw2{animation-duration:12s;animation-delay:-5s}' +
      '@keyframes gt-sw{from{transform:translate(-5px,0)}to{transform:translate(6px,3px)}}' +
      '.st-responding .gt-sw,.st-run .gt-sw{animation-duration:2.6s}' +
      '.st-error .gt-sw{animation:gt-shk .36s ease-in-out 8 alternate}@keyframes gt-shk{from{transform:translate(-5px,-2px)}to{transform:translate(5px,3px)}}' +
      '.gt-vn{animation:gt-vn 5.5s ease-in-out infinite alternate}@keyframes gt-vn{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-responding .gt-vn,.st-run .gt-vn{animation-duration:1.8s}.st-error .gt-vn{animation:gt-ladx .9s ease-in-out infinite alternate}' +
      '.gt-lad{animation:gt-lad 4.6s ease-in-out infinite alternate}@keyframes gt-lad{from{transform:rotate(-1.8deg)}to{transform:rotate(1.8deg)}}' +
      '.st-error .gt-lad{animation:gt-ladx .95s ease-in-out infinite alternate}@keyframes gt-ladx{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
      '.gt-lad3{transform-box:fill-box;transform-origin:50% 0;animation:gt-lad3 5s ease-in-out infinite alternate}@keyframes gt-lad3{from{transform:rotate(-.3deg)}to{transform:rotate(.3deg)}}' +
      '.st-error .gt-lad3{animation:gt-lad3x 1.1s ease-in-out infinite alternate}@keyframes gt-lad3x{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}' +
      '.gt-pod{animation:gt-pod 5.2s ease-in-out infinite alternate}@keyframes gt-pod{from{transform:rotate(-3.5deg)}to{transform:rotate(3.5deg)}}' +
      '.gt-ff{animation:gt-ff 6s ease-in-out infinite alternate}.gt-ff2{animation-duration:8.5s}' +
      '@keyframes gt-ff{from{opacity:.25;transform:translate(0,0)}to{opacity:1;transform:translate(var(--x),var(--y))}}' +
      '.st-thinking .gt-ff,.st-done .gt-ff{animation-duration:2.6s}' +
      '.gt-win{animation:gt-win 4.2s ease-in-out infinite alternate}.gt-win2{animation-duration:5.6s;animation-delay:-2.4s}' +
      '@keyframes gt-win{from{opacity:.5}to{opacity:1}}.st-done .gt-win{animation:none;opacity:1}' +
      '.gt-trail{stroke-dasharray:0 18;animation:gt-march 4s linear infinite}@keyframes gt-march{to{stroke-dashoffset:-36}}' +
      '.st-run .gt-trail{animation-duration:1.5s}' +
      '.gt-fun{animation:gt-fun 5s ease-in-out infinite alternate}@keyframes gt-fun{from{opacity:.35}to{opacity:.9}}.st-thinking .gt-fun{animation-duration:1.4s}' +
      '.gt-ms{animation:gt-ms 28s ease-in-out infinite alternate}.gt-ms2{animation-duration:36s;animation-delay:-14s}' +
      '@keyframes gt-ms{from{transform:translateX(-50px)}to{transform:translateX(60px)}}' +
      '.gt-bd{animation:gt-bd 80s linear infinite}@keyframes gt-bd{to{transform:translateX(-1900px)}}' +
      '.gt-dl{animation:gt-dl 14s linear infinite}' +
      '@keyframes gt-dl{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.8}90%{opacity:.6}100%{opacity:0;transform:translate(130px,680px) rotate(420deg)}}' +
      '.gt-tw{animation:gt-tw 3.6s ease-in-out infinite alternate}.gt-tw2{animation-duration:2.8s;animation-delay:-1.4s}@keyframes gt-tw{from{opacity:.3}to{opacity:.9}}' +
      '.gt-wing{animation:gt-wing .32s ease-in-out infinite alternate}@keyframes gt-wing{to{transform:scaleY(.3)}}' +
      '.gt-lan{animation:gt-lan 4.4s ease-in-out infinite alternate}@keyframes gt-lan{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .gt-lan{animation:gt-ladx .8s ease-in-out infinite alternate}' +
      '.gt-spr{animation:gt-spr 3.4s ease-in-out infinite alternate}@keyframes gt-spr{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.gt-jf{animation:gt-jf 2.2s ease-in-out infinite alternate}@keyframes gt-jf{to{transform:translate(3px,-5px)}}' +
      '.gt-ck,.gt-spl,.gt-chk,.gt-shw,.gt-flk,.gt-gl,.gt-sm,.gt-msg,.gt-pt,.gt-cg{opacity:0}' +
      // Tools and the web: the little lifts run, the pulley turns, a messenger bird flies off with a rolled leaf.
      '.st-tool .gt-ml,.st-run .gt-ml{animation:gt-ml 1.8s ease-in-out infinite alternate}@keyframes gt-ml{to{transform:translateY(var(--up))}}.gt-ml2{animation-delay:-.9s}' +
      '.st-tool .gt-pul{animation:mv-spin 1.8s linear infinite}.st-run .gt-pul{animation:mv-spin 1s linear infinite}' +
      '.st-web .gt-msg{animation:gt-msg 4s ease-in-out infinite}' +
      '@keyframes gt-msg{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate(-540px,-250px)}}' +
      // Reading: the veins of the leaf map on the office wall light up.
      '.gt-mv{opacity:0;stroke-dasharray:1 1;stroke-dashoffset:1}.st-read .gt-mv{animation:gt-draw 1.4s ease-out both}' +
      '@keyframes gt-draw{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      // A command: a giant leaf glides down past the root, seeds spin down the trunk, the basket lift hauls up.
      '.st-run .gt-gl{animation:gt-fall 6.4s linear both}' +
      '@keyframes gt-fall{0%{opacity:0;transform:translateY(0)}5%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateY(920px)}}' +
      '.st-run .gt-gls{animation:gt-glide 1.7s ease-in-out infinite alternate}' +
      '@keyframes gt-glide{from{transform:translateX(-80px) rotate(-30deg)}to{transform:translateX(70px) rotate(26deg)}}' +
      '.st-run .gt-sm{animation:gt-smf 5.6s linear both}' +
      '@keyframes gt-smf{0%{opacity:0;transform:translate(0,0)}5%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translate(-70px,660px)}}' +
      '.st-run .gt-sms{animation:mv-spin .85s linear infinite}' +
      '.st-run .gt-bk{animation:gt-haul 4.4s cubic-bezier(.3,.2,.4,1) both}@keyframes gt-haul{to{transform:translateY(-236px)}}' +
      '.st-run .gt-cw{animation:gt-cw 4.4s cubic-bezier(.3,.2,.4,1) both}@keyframes gt-cw{to{transform:translateY(236px)}}' +
      '.gt-bkl{opacity:.5}.st-run .gt-bkl{opacity:1}' +
      // An error: the branch cracks and drops on its last fibres, splinters fly, leaves shower, the ladders swing.
      '.st-error .gt-snap{animation:gt-snap 2.8s ease-out both}' +
      '@keyframes gt-snap{0%{transform:rotate(0)}6%{transform:rotate(-4deg)}11%{transform:rotate(-2deg)}32%{transform:rotate(-36deg)}48%{transform:rotate(-25deg)}' +
      '64%{transform:rotate(-32deg)}80%{transform:rotate(-27deg)}100%{transform:rotate(-30deg)}}' +
      '.st-error .gt-snap .gt-pod{animation:gt-podx 1.05s ease-in-out infinite alternate}@keyframes gt-podx{from{transform:rotate(10deg)}to{transform:rotate(46deg)}}' +
      '.st-error .gt-ck{animation:gt-on .25s ease-out .12s both}@keyframes gt-on{to{opacity:1}}' +
      '.gt-dust{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .gt-dust{animation:gt-dust 2s ease-out .12s both}' +
      '@keyframes gt-dust{0%{opacity:0;transform:scale(.3)}15%{opacity:.9}100%{opacity:0;transform:scale(2.2) translateY(30px)}}' +
      '.st-error .gt-spl{animation:gt-spl 1.3s ease-out both}' +
      '@keyframes gt-spl{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(260deg)}}' +
      '.gt-chk{transform-box:fill-box;transform-origin:center}.st-error .gt-chk{animation:gt-chk 1.9s cubic-bezier(.5,0,.9,.5) .2s both}' +
      '@keyframes gt-chk{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),640px) rotate(-220deg)}}' +
      '.st-error .gt-shw{animation:gt-shw 3.4s linear both}' +
      '@keyframes gt-shw{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),620px) rotate(var(--r))}}' +
      '.st-error .gt-flk{animation:gt-flk 2.6s ease-out both}' +
      '@keyframes gt-flk{0%{opacity:0;transform:translate(0,0)}8%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Done: the whole tree blooms, the canopy glows softly, petals drift down.
      '.gt-bl{transform:scale(0)}.st-done .gt-bl{animation:gt-bloom 1.3s cubic-bezier(.3,1.5,.5,1) both}' +
      '@keyframes gt-bloom{from{transform:scale(0) rotate(-60deg)}to{transform:scale(1) rotate(0)}}' +
      '.st-done .gt-cg{animation:gt-on 2.4s ease-out .3s both}' +
      '.st-done .gt-pt{animation:gt-pt 7s linear infinite}.st-done .gt-pt2{animation-duration:8.4s}' +
      '@keyframes gt-pt{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:.9}85%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),560px) rotate(320deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="gt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050704"/><stop offset=".42" stop-color="#090d07"/>' +
      '<stop offset=".63" stop-color="#111b0f"/><stop offset=".7" stop-color="#172512"/><stop offset=".8" stop-color="#0e150b"/><stop offset="1" stop-color="#070906"/></linearGradient>' +
      '<radialGradient id="gt-hz"><stop offset="0" stop-color="#9cbc5c" stop-opacity=".26"/><stop offset=".5" stop-color="#6f8f44" stop-opacity=".1"/><stop offset="1" stop-color="#6f8f44" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gt-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb48a" stop-opacity="0"/><stop offset=".5" stop-color="#9fb48a" stop-opacity=".1"/><stop offset="1" stop-color="#9fb48a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="gt-mist"><stop offset="0" stop-color="#b4c49c" stop-opacity=".32"/><stop offset="1" stop-color="#b4c49c" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gt-trk" gradientUnits="userSpaceOnUse" x1="1080" y1="0" x2="1640" y2="0"><stop offset="0" stop-color="#2c2816"/><stop offset=".12" stop-color="#221e12"/>' +
      '<stop offset=".38" stop-color="#15120b"/><stop offset=".75" stop-color="#0e0c07"/><stop offset="1" stop-color="#0a0805"/></linearGradient>' +
      '<radialGradient id="gt-fg"><stop offset="0" stop-color="#c6d96a" stop-opacity=".3"/><stop offset="1" stop-color="#c6d96a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gt-lgl"><stop offset="0" stop-color="#f0b45a" stop-opacity=".34"/><stop offset="1" stop-color="#f0b45a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gt-blg"><stop offset="0" stop-color="#eef7b8" stop-opacity=".55"/><stop offset=".4" stop-color="#c6d96a" stop-opacity=".18"/><stop offset="1" stop-color="#c6d96a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gt-cg"><stop offset="0" stop-color="#dcef8a" stop-opacity=".3"/><stop offset="1" stop-color="#dcef8a" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#gt-sky)"/>' +
      `<g fill="#dfe8c8" fill-opacity=".6"><path class="gt-tw" d="${stars[0]}"/><path class="gt-tw gt-tw2" d="${stars[1]}"/></g>` +
      '<ellipse cx="330" cy="650" rx="540" ry="210" fill="url(#gt-hz)"/>' +
      `<path d="${range}L1640 720Z" fill="#0d140b"/><rect y="610" width="1600" height="120" fill="url(#gt-band)"/>` +
      `<g fill="none" stroke="#3c4832" stroke-width="1.6">${[0, 1, 2]
        .map(i => `<path class="gt-bd" style="animation-delay:${-12 - i * 23}s" d="M${1654 + i * 90} ${430 + i * 22}q3 -4 6 0q3 -4 6 0"/>`)
        .join('')}</g>` +
      // A far root, out past the mountains, with forests and a village's lights on it.
      '<path d="M1240 640C1080 596 880 596 720 652C650 676 600 694 520 704L520 730C640 726 760 716 900 712C1020 708 1140 712 1240 720Z" fill="#0d120a"/>' +
      `<path d="${farFirs}" fill="#0d120a"/><path d="M1240 640C1080 596 880 596 720 652C650 676 600 694 520 704" fill="none" stroke="${RIM}" stroke-opacity=".1" stroke-width="2"/>` +
      `<path d="${farLights}" fill="${WARM}" fill-opacity=".6"/>` +
      '<ellipse class="gt-ms" cx="860" cy="694" rx="380" ry="40" fill="url(#gt-mist)" opacity=".5"/>' +
      trunk +
      // The canopy.
      '<rect x="-200" y="-100" width="2400" height="150" fill="#0a1108"/>' +
      `<g class="gt-sw">${canopy(-120, 470, edge, next)}</g>` +
      `<g class="gt-sw gt-sw2">${canopy(470, 1060, edge, next)}</g>` +
      `<g fill="${BARK}">` +
      '<path d="M1250 60C1100 30 960 0 860 -60L820 -60C940 30 1080 70 1250 110Z"/>' +
      '<path d="M660 140C620 90 600 40 560 -20L530 -20C570 40 600 100 620 146Z"/><path d="M200 174C170 120 150 60 120 -20L96 -20C130 60 150 120 168 178Z"/>' +
      '<path d="M1250 150C1000 118 700 126 400 160C240 180 90 176 -80 150L-80 196C90 222 240 226 400 210C700 180 1000 186 1250 240Z"/></g>' +
      `<path d="M-80 196C90 222 240 226 400 210C700 180 1000 186 1250 240" fill="none" stroke="${RIM}" stroke-opacity=".2" stroke-width="2.5"/>` +
      '<path d="M-60 176C100 196 260 194 420 182C700 156 980 160 1200 196" fill="none" stroke="#0a0806" stroke-width="3"/>' +
      `<g class="mv-r"><g class="gt-sw gt-sw2">${canopy(1060, 1800, edge, next)}</g>` +
      '<ellipse class="gt-cg" cx="1400" cy="190" rx="380" ry="210" fill="url(#gt-cg)"/>' +
      blossoms([[1150, 204, 15], [1240, 236, 14], [1330, 180, 16], [1420, 222, 14], [1520, 192, 15], [1590, 250, 13], [1470, 140, 12], [1380, 266, 12], [1200, 150, 11], [1560, 330, 11]]) +
      `<g fill="${PETAL}" fill-opacity=".9">${petals(7, 1190, 400, 160, 120)}</g></g>` +
      `<g fill="none" stroke="#1c2c14" stroke-width="2.2">${vine(530, 202, 150, 0)}${vine(640, 196, 90, -2)}${vine(780, 190, 190, -3.4)}` +
      `${vine(905, 190, 120, -1.1)}${vine(1030, 206, 160, -4.2)}${vine(460, 206, 70, -2.7)}</g>` +
      // The branch that breaks, with its gourd houses.
      '<g transform="translate(300 206)"><g class="gt-snap">' +
      `<path d="M-150 22L-196 -14M-230 52L-262 30" stroke="${BARK}" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M0 -16C-90 -6 -190 30 -300 72L-310 98C-200 62 -96 28 0 22Z" fill="${BARK}"/>` +
      `<path d="M0 22C-96 28 -200 62 -310 98" fill="none" stroke="${RIM}" stroke-opacity=".32" stroke-width="2.5"/>` +
      `<path d="${branchLeaves.map(([x, y, r]) => circle(x, y, r)).join('')}" fill="#0e170b"/><path d="${branchFringe}" fill="${FRINGE}"/>` +
      pod(-70, 12, 50, 1, 0) +
      pod(-176, 38, 72, 1.15, -1.8) +
      pod(-262, 72, 40, 0.9, -3.1) +
      '</g></g>' +
      '<circle class="gt-dust" cx="296" cy="210" r="70" fill="url(#gt-mist)"/>' +
      '<path class="gt-ck" d="M302 188l-9 6 6 5-8 6 7 4-7 7 11 2z" fill="#d9c08a"/>' +
      `<g fill="#cdb27a">${splinters}</g>` +
      `<g fill="${BARK_LIT}" stroke="#d9c08a" stroke-opacity=".4">${[[-50, 0], [10, 0.25], [-110, 0.45]]
        .map(([dx, delay]) => `<path class="gt-chk" style="--dx:${dx}px;animation-delay:${delay}s" d="M276 204h30l-6 12h-22z"/>`)
        .join('')}</g>` +
      '<ellipse class="gt-cg" cx="190" cy="190" rx="380" ry="200" fill="url(#gt-cg)"/>' +
      blossoms([[60, 196, 14], [150, 236, 16], [236, 178, 13], [330, 214, 15], [404, 176, 12], [22, 262, 12], [110, 140, 11], [290, 140, 10], [560, 150, 8], [760, 132, 8], [1000, 176, 9], [536, 300, 7], [786, 340, 7]]) +
      // The basket lift, from a pulley under the limb down to a landing on the root.
      `<path d="M372 212V224" stroke="${BARK_LIT}" stroke-width="4"/><path d="M362 232V506M382 232V506" stroke="${ROPE}" stroke-width="1.6"/>` +
      `<g transform="translate(372 232)"><g class="gt-pul"><circle r="10" fill="#2a2214" stroke="${WOOD_LIT}" stroke-width="3"/><path d="M-8 0H8M0 -8V8" stroke="${WOOD_LIT}" stroke-width="2"/></g></g>` +
      `<ellipse class="gt-cw" cx="362" cy="258" rx="7" ry="10" fill="#3a3018" stroke="${ROPE}"/>` +
      '<g class="gt-bk"><circle class="gt-bkl" cx="382" cy="484" r="30" fill="url(#gt-lgl)"/>' +
      `<path d="M382 466L370 480M382 466L394 480M370 488H394M371 496H393" stroke="${ROPE}" stroke-width="1.4"/><path d="M368 480H396L392 504H372Z" fill="#5a4426" stroke="#2e2214" stroke-width="1.5"/>` +
      `<circle cx="382" cy="477" r="3" fill="${WARM}"/></g>` +
      // The great root.
      '<path d="M1300 700C1150 720 1000 790 840 810C740 822 640 760 560 660C480 560 420 505 330 505C220 505 120 570 60 700C30 770 0 830 -40 870V1040H120' +
      `C140 900 200 720 300 640C350 610 420 618 480 668C560 730 610 840 650 1040H1320V700Z" fill="${ROOT}"/>` +
      `<path d="M-40 870C0 830 30 770 60 700C120 570 220 505 330 505C420 505 480 560 560 660C640 760 740 822 840 810" fill="none" stroke="${RIM}" stroke-opacity=".24" stroke-width="2.4"/>` +
      `<path d="${crestFirs}" fill="${ROOT}"/>` +
      '<path d="M-20 940C30 860 80 790 120 736C180 640 260 590 340 588C410 588 450 610 500 660M10 900C60 800 110 700 190 620C240 572 290 552 360 548" fill="none" stroke="#1a1c10" stroke-width="4"/>' +
      `<path d="${rootlets}" fill="none" stroke="${ROOT}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M350 507H400" stroke="${WOOD_LIT}" stroke-width="4"/>` +
      huts(rootHuts, 'gt-win gt-win2') +
      `<path class="gt-trail" d="M-40 892C0 852 30 792 60 722C120 592 220 527 330 527C420 527 480 582 560 682" fill="none" stroke="${WARM}" stroke-opacity=".8" stroke-width="3.2" stroke-linecap="round"/>` +
      ladder(318, 632, 210, -1.6) +
      shelf([[90, 720], [128, 778], [66, 812]]) +
      '<ellipse class="gt-ms" cx="380" cy="770" rx="300" ry="55" fill="url(#gt-mist)" opacity=".6"/>' +
      '<ellipse class="gt-ms gt-ms2" cx="150" cy="900" rx="240" ry="45" fill="url(#gt-mist)" opacity=".4"/>' +
      // Nearer roots along the foot of the picture.
      '<g class="mv-b"><path d="M-60 1040V930C60 890 200 905 330 960C380 982 420 1010 440 1040ZM600 1040C700 975 860 940 1040 948C1140 952 1220 980 1280 1040Z" fill="#060704"/>' +
      `<path d="M-60 930C60 890 200 905 330 960C380 982 420 1010 440 1040M600 1040C700 975 860 940 1040 948C1140 952 1220 980 1280 1040" fill="none" stroke="${RIM}" stroke-opacity=".11" stroke-width="2"/></g>` +
      flyGroup(flies(7, [20, 380, 300, 560]) + flies(2, [460, 680, 560, 220]), '') +
      `<g class="mv-r">${flyGroup(flies(5, [1196, 384, 160, 360]))}</g>` +
      `<g fill="#4a6a22" stroke="${LIME}" stroke-opacity=".5">` +
      [0, 1].map(i => `<path class="gt-dl" style="animation-duration:${14 + i * 3}s;animation-delay:${-3 - i * 6}s" d="${leaflet(74 + i * 220, 240 + i * 20, 16, 10, 0)}"/>`).join('') +
      `${shower}</g>` +
      `<g fill="none" stroke="#9aa88a" stroke-width="1.8">${flock}</g>` +
      // The giant leaf of a command.
      '<g transform="translate(210 40)"><g class="gt-gl"><g class="gt-gls">' +
      `<path d="${leaf(-100, 0, 200, 74, 0)}" fill="#2a3a14" stroke="${LIME}" stroke-opacity=".45" stroke-width="2"/>` +
      `<path d="M-114 4L-100 0L96 0M-50 0L-22 -28M-50 0L-22 28M0 0L28 -28M0 0L28 28M50 0L72 -18M50 0L72 18" fill="none" stroke="${LIME}" stroke-opacity=".4" stroke-width="2"/>` +
      '</g></g></g>' +
      `<g fill="${PETAL}" fill-opacity=".9">${petals(8, 10, 400, 150, 110)}<g opacity=".5">${petals(2, 500, 600, 140, 60)}</g></g>`,
    nook:
      '<defs><linearGradient id="gt-hol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f08"/><stop offset="1" stop-color="#0b0805"/></linearGradient>' +
      '<radialGradient id="gt-wv" cy=".8"><stop offset="0" stop-color="#3e5a26"/><stop offset="1" stop-color="#0d1a10"/></radialGradient></defs>' +
      // The ladder down the trunk from the villages, beside the door.
      ladder(-26, -412, 866, -0.8, 'gt-lad3') +
      `<path d="${archEdge}V470Z" fill="url(#gt-hol)"/>` +
      `<path d="${rings}" fill="none" stroke="#1e170c" stroke-width="3"/>` +
      `<path d="${archEdge}" fill="none" stroke="#2a2414" stroke-width="18"/>` +
      `<path d="${archEdge}" fill="none" stroke="${RIM}" stroke-opacity=".2" stroke-width="2" transform="translate(-9 -6)"/>` +
      // The round window, looking out at a root ridge.
      '<circle cx="96" cy="76" r="38" fill="url(#gt-wv)"/><path d="M61.5 92C80 82 104 80 130.5 92A38 38 0 0 1 61.5 92Z" fill="#0a0f08"/>' +
      '<rect x="112" y="56" width="2.4" height="2.4" fill="#dfe8c8"/>' +
      `<path d="M96 38V114M58 76H134" stroke="${WOOD}" stroke-width="4"/><circle cx="96" cy="76" r="38" fill="none" stroke="${WOOD}" stroke-width="8"/>` +
      // The leaf map pinned to the wall.
      `<path d="${leaf(288, 62, 128, 42, -0.28)}" fill="#2c3a16" stroke="#4a5e22" stroke-width="1.5"/>` +
      `<g fill="none" stroke-width="2.2"><path d="${veins.join('')}" stroke="#5e7a2a" stroke-width="1.4"/>` +
      veins.map(d => `<path class="gt-mv" pathLength="1" d="${d}" stroke="${LIME}"/>`).join('') +
      `</g><circle cx="300" cy="58" r="3" fill="${WARM}"/>` +
      // The shelf: seed jars, a rolled leaf, a potted sprout.
      `<rect x="250" y="146" width="200" height="8" fill="${WOOD}"/><path d="M262 154L272 168M430 154L420 168" stroke="${WOOD}" stroke-width="4"/>` +
      '<path d="M272 146V126H286V146ZM294 146V132H306V146Z" fill="#2a3a1c" stroke="#6a7a40" stroke-width="1.4"/><path d="M270 126H288M292 132H308" stroke="#5a4426" stroke-width="4"/>' +
      `<rect x="318" y="134" width="38" height="12" rx="6" fill="${PAPER}" fill-opacity=".7"/><path d="M372 146L369 130H389L386 146Z" fill="#6a4a2a"/>` +
      `<path d="${leaflet(379, 130, 16, 11, -2.2)}${leaflet(379, 130, 14, 10, -0.9)}" fill="#7fa040"/>` +
      // The leaf roof over the door.
      `<path d="M-50 -114H476" stroke="${WOOD}" stroke-width="9"/>` +
      shingles(-124, -4, 1.65, LEAF_FRONT) +
      shingles(-114, -30, 1.75, FRINGE) +
      // The lantern, a jar of fireflies hanging in the doorway.
      `<g transform="translate(196 -70)"><g class="gt-lan"><path d="M0 0V80" stroke="${ROPE}" stroke-width="1.6"/><circle cy="98" r="60" fill="url(#gt-lgl)"/>` +
      '<path d="M-9 80H9V85H-9Z" fill="#5a4426"/><path d="M-10 85H10V110Q10 114 6 114H-6Q-10 114 -10 110Z" fill="#f0b45a" fill-opacity=".3" stroke="#b8a070" stroke-width="1.4"/>' +
      '<g class="gt-jf" fill="#fff0c0"><circle cx="-3" cy="102" r="2"/><circle cx="4" cy="95" r="1.8"/></g></g></g>' +
      // The platform, at the floor.
      `<rect x="-90" y="455" width="560" height="12" fill="#2a2012"/><path d="M-90 456H470" stroke="${WOOD_LIT}" stroke-width="2"/>` +
      '<path d="M-40 456v10M40 456v10M120 456v10M200 456v10M280 456v10M360 456v10" stroke="#120d07" stroke-width="2"/>',
    front: `<g fill="${PETAL}" fill-opacity=".9">${petals(4, -20, 360, -120, 60)}</g>`,
  }
}
