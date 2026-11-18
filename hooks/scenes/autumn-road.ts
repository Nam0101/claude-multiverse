import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Autumn Road: a tree-lined lane at dusk in the first cool wind of autumn. Rust and gold crowns arch over the road,
// old lamp posts light it, leaves drift down and a flower seller in a conical hat cycles past with baskets of daisies.
// Claude sits on a park bench at a little wooden table by the road, in a beret and a knitted scarf, a glass of tea and
// a leaf parcel of green rice beside the laptop. A command whips the leaves into a towering whirl; an error is a gust
// that blows the scarf away and buries the desk corner in leaves; done sets the crowns glowing gold and lets the
// leaves come down in a slow cascade.

const WOOD = '#5a3820'
const WOOD_EDGE = '#8a5a32'
const IRON = '#140c08'
const BARK = '#0d0705'
const MUSTARD = '#c98a2c'

const LEAF = 'M0 -7C5 -4 5 3 0 7C-5 3 -5 -4 0 -7Z'
const MAPLE = 'M0 -9L2 -4L7 -6L5 -1L9 1L4 3L5 8L0 5L-5 8L-4 3L-9 1L-5 -1L-7 -6L-2 -4Z'
const GOLDS = ['#e0a03a', '#d0702a', '#b4501e', '#e8c050']
// The crowns, from the shadowed tops to the leaves the lamps catch.
const TONES = ['#1d0e09', '#381a0d', '#5a2811', '#7e3a16']
const WIDTHS = [10, 16, 24, 36, 52, 74, 100]

const n0 = (n: number): string => String(Math.round(n))
/** A dot: a zero-length line that its round cap turns into a disc as wide as the stroke. */
const dot = (x: number, y: number): string => `M${n0(x)} ${n0(y)}h0`
const nearest = (w: number): number => WIDTHS.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a))

type Layer = Map<string, string[]>

function put(layer: Layer, tone: number, width: number, d: string): void {
  const key = `${tone}|${width}`

  layer.set(key, [...(layer.get(key) ?? []), d])
}

/** Every dot of a layer, one path per tone and width, dark tones first so the lit ones sit on top. */
function paint(layer: Layer, tones: readonly string[] = TONES): string {
  const keys = [...layer.keys()].sort((a, b) => {
    const [ta, wa] = a.split('|').map(Number)
    const [tb, wb] = b.split('|').map(Number)

    return ta! - tb! || wb! - wa!
  })

  return (
    '<g fill="none" stroke-linecap="round">' +
    keys.map(key => `<path d="${layer.get(key)!.join('')}" stroke="${tones[Number(key.split('|')[0])]}" stroke-width="${key.split('|')[1]}"/>`).join('') +
    '</g>'
  )
}

/** One crown: clumps of foliage in an ellipse, smaller toward its rim, lit from below, dim inside the chat column. */
function crown(next: () => number, layer: Layer, cx: number, cy: number, rx: number, ry: number, count: number): void {
  const big = 0.26 * Math.max(rx, ry)

  for (let i = 0; i < count; i += 1) {
    const a = next() * Math.PI * 2
    const d = Math.sqrt(next())
    const x = cx + Math.cos(a) * rx * d
    const y = cy + Math.sin(a) * ry * d
    const width = nearest(2 * big * (0.5 + next() * 0.6) * (1 - 0.5 * d))
    const lit = (y - cy) / ry + (next() - 0.5) * 0.8
    const quiet = x + width / 2 > 430 && x - width / 2 < 1170
    const tone = Math.max(0, (lit > 0.45 ? 3 : lit > -0.1 ? 2 : lit > -0.6 ? 1 : 0) - (quiet ? 2 : 0))

    put(layer, tone, width, dot(x, y))
  }
}

/** The far crowns along one row, tapering into the end of the road. */
function ridge(next: () => number, layer: Layer, from: [number, number], to: [number, number], count: number): void {
  for (let i = 0; i < count; i += 1) {
    const s = i / (count - 1)
    const size = 96 * Math.pow(1 - s, 1.4) + 8
    const x = from[0] + (to[0] - from[0]) * s + (next() - 0.5) * size * 0.5
    const y = from[1] + (to[1] - from[1]) * s + (next() - 0.7) * size * 0.6

    put(layer, next() < 0.3 ? 1 : 0, nearest(size * (0.8 + next() * 0.5)), dot(x, y))
  }
}

/** Lit leaves: small bright dots in the lower part of a crown. */
function specks(next: () => number, cx: number, cy: number, rx: number, ry: number, count: number): string[] {
  const out: string[] = []

  for (let i = 0; i < count; i += 1) {
    const a = next() * Math.PI * 2
    const d = Math.sqrt(next())
    const y = cy + Math.sin(a) * ry * d

    if (y > cy - ry * 0.3) out.push(dot(cx + Math.cos(a) * rx * d, y))
  }

  return out
}

/** A trunk on the ground at (x, base), leaning toward the road, with three limbs up into its crown. */
function trunk(x: number, base: number, t: number, side: number, rim: boolean): string {
  const w = 80 * t
  const top = base - 1000 * t
  const tx = x - side * 40 * t
  const at = `M${f(tx)} ${f(top + 30 * t)}`

  if (!rim) {
    // A far trunk: a plain taper and two limbs.
    return (
      `<path d="M${f(x - w / 2)} ${f(base)}L${f(tx - w * 0.36)} ${f(top)}H${f(tx + w * 0.36)}L${f(x + w / 2)} ${f(base)}Z" fill="${BARK}"/>` +
      `<path d="${at}l${f(-70 * t)} ${f(-150 * t)}${at}l${f(70 * t)} ${f(-150 * t)}" stroke="${BARK}" stroke-width="${f(Math.max(1.5, 15 * t))}"/>`
    )
  }

  return (
    `<path d="M${f(x - w / 2 - 8 * t)} ${f(base)}L${f(x - w / 2)} ${f(base - 30 * t)}L${f(tx - w * 0.36)} ${f(top)}H${f(tx + w * 0.36)}L${f(x + w / 2)} ${f(base - 30 * t)}L${f(x + w / 2 + 8 * t)} ${f(base)}Z" fill="${BARK}"/>` +
    `<path d="${at}l${f(-70 * t)} ${f(-150 * t)}${at}l${f(10 * t)} ${f(-190 * t)}${at}l${f(80 * t)} ${f(-140 * t)}" stroke="${BARK}" stroke-width="${f(Math.max(1.5, 15 * t))}" stroke-linecap="round"/>` +
    (side < 0
      ? `<path d="M${f(x + w * 0.4)} ${f(base - 40 * t)}L${f(tx + w * 0.28)} ${f(top + 80 * t)}" stroke="#9a5226" stroke-opacity=".3" stroke-width="${f(4 * t)}" stroke-linecap="round"/>`
      : '')
  )
}

/** An old street lamp: a plinth, a slim post, a four-paned lantern under a pointed cap, and its pool of light. */
function lamp(x: number, y: number, s: number, k: number, dim: number, cls = ''): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${s.toFixed(2)})">` +
    `<ellipse cy="4" rx="160" ry="28" fill="url(#au-lg)" opacity="${f(dim * 0.8)}"/>` +
    `<g opacity="${f(dim)}"><circle class="au-lmp au-ch${cls}" style="--k:${k}" cy="-322" r="130" fill="url(#au-lg)"/></g>` +
    `<path d="M-10 0V-24H10V0ZM-3.5 -24V-298H3.5V-24ZM-8 -296H8V-304H-8ZM-20 -342L0 -362L20 -342Z" fill="${IRON}"/>` +
    `<path d="M-10 -304L-14 -342H14L10 -304Z" fill="#ffc46a" fill-opacity=".92"${s > 0.7 ? ` stroke="${IRON}" stroke-width="3"` : ''}/></g>`
  )
}

/** A falling leaf: the fall carries it down and sideways, the tumble turns it over. */
function faller(next: () => number, x: number, y: number, s: number, fill: string, cls: string, secs: number): string {
  return (
    `<g transform="translate(${n0(x)} ${n0(y)}) scale(${f(s)})"><g class="${cls}" style="--d:${f(secs)}s;--l:${f(-next() * secs)}s">` +
    `<path class="au-tb${next() > 0.5 ? ' au-t2' : ''}" d="${next() > 0.5 ? MAPLE : LEAF}" fill="${fill}"/></g></g>`
  )
}

/** The flower seller on an old step-through bicycle, conical hat, a rear basket heaped with daisies. */
function cyclist(next: () => number): string {
  const wheel = (cx: number): string =>
    `<g transform="translate(${cx} -30)"><circle r="29" fill="none" stroke="#24160e" stroke-width="5"/><circle r="29" fill="none" stroke="#c07a40" stroke-opacity=".35" stroke-width="1.4"/>` +
    '<g class="au-wh"><path d="M-27 0H27M0 -27V27M-19 -19L19 19M-19 19L19 -19" stroke="#4a3020" stroke-width="1.4"/></g></g>'
  const blooms: Layer = new Map()
  const heap = (x0: number, x1: number, y0: number, h: number, count: number): void => {
    for (let i = 0; i < count; i += 1) {
      const u = next()
      const kind = next() < 0.6 ? 0 : next() < 0.75 ? 1 : 2

      put(blooms, kind, next() < 0.5 ? 10 : 16, dot(x0 + u * (x1 - x0), y0 - Math.sin(u * Math.PI) * h * (0.4 + next() * 0.6)))
    }
  }

  heap(-104, -26, -72, 46, 26)
  heap(44, 74, -86, 16, 8)

  const leg = (cls: string, color: string): string =>
    `<g transform="translate(-22 -86)"><g class="${cls}"><path d="M0 0L26 16L18 56" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g></g>`

  return (
    leg('au-leg au-leg2', '#140c08') +
    wheel(-50) +
    wheel(52) +
    '<path d="M-50 -30L-6 -28L-22 -80M-6 -28Q8 -58 36 -72L52 -30M-50 -30L-24 -72M36 -72L40 -88M40 -88L30 -93M40 -88L50 -92M-24 -72H-98" fill="none" stroke="#3a2416" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="M-36 -84H-12L-16 -78H-32Z" fill="#1a100a"/>' +
    '<path d="M-106 -72H-28L-36 -34H-98ZM42 -88H76L71 -64H47Z" fill="#5a3a1e" stroke="#2a1a0e" stroke-width="2"/>' +
    '<path d="M-102 -60H-32M-100 -47H-34M-86 -72L-82 -34M-67 -72V-34M-48 -72L-50 -34" stroke="#2a1a0e" stroke-width="1.5" stroke-opacity=".8"/>' +
    paint(blooms, ['#efe4c8', '#e8b440', '#c0582a']) +
    // The rider: torso, the near arm to the bars, head under the hat; the near leg in front.
    '<path d="M-36 -86C-38 -112 -24 -140 -4 -142C10 -140 12 -124 4 -104L-6 -84Z" fill="#2a1a14"/>' +
    '<path d="M-8 -128L22 -102L38 -90" fill="none" stroke="#2a1a14" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="-2" cy="-151" r="10" fill="#1a100a"/>' +
    '<path d="M-36 -151L-2 -182L32 -151Q-2 -145 -36 -151Z" fill="#9a7444"/>' +
    '<path d="M-36 -151Q-2 -145 32 -151M-2 -182L-24 -158M-2 -182L12 -156" fill="none" stroke="#e8b878" stroke-opacity=".5" stroke-width="1.6"/>' +
    leg('au-leg', '#22150e')
  )
}

/** The laptop facing Claude, a glass of tea with its steam, and green rice wrapped in a lotus leaf. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const steam = activity === 'error' ? '' : '<path class="au-stm" pathLength="1" d="M365 302c-6 -10 6 -16 0 -26c-5 -8 5 -14 1 -22" fill="none" stroke="#efe2c8" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>'

  return (
    '<rect x="244" y="323" width="98" height="7" rx="2" fill="#2e221c"/>' +
    keys +
    '<path d="M336 327L360 240L370 242L346 329Z" fill="#2e221c"/>' +
    `<path d="M337 324L359 244L363 245L341 326Z" fill="${light}"/>` +
    `<path d="M337 324L359 244L348 248L328 324Z" fill="${light}" fill-opacity=".16"/>` +
    `<path d="${MAPLE}" transform="translate(358 290) rotate(18) scale(.8)" fill="#e8893a" fill-opacity=".85"/>` +
    // The tea glass and its steam.
    '<path d="M356 330L354 304H376L374 330Z" fill="#a8641e" fill-opacity=".75" stroke="#efe2c8" stroke-opacity=".4" stroke-width="1.5"/>' +
    '<path d="M355 309H375" stroke="#efe2c8" stroke-opacity=".35" stroke-width="1.5"/>' +
    steam +
    // The leaf parcel, tied with straw, a few grains spilled.
    '<path d="M377 330L382 315Q395 305 408 315L413 330Z" fill="#3f5a26" stroke="#24361a" stroke-width="1.5"/>' +
    '<path d="M385 314Q395 320 405 314M395 306V330" fill="none" stroke="#c8a860" stroke-width="2"/>' +
    '<path d="M376 329h0M415 328h0M418 329h0" stroke="#9ab84a" stroke-width="3" stroke-linecap="round"/>'
  )
}

const leftAt = (t: number): [number, number] => [800 - 950 * t, 520 + 480 * t]
const rightAt = (t: number): [number, number] => [800 + 900 * t, 520 + 480 * t]

// The whirl: rings of leaves around one axis, wider toward the top.
const VX = 222
const RINGS = Array.from({ length: 10 }, (_, i) => ({
  y: 880 - i * 76,
  x: VX + Math.sin(i * 0.9) * 14,
  rx: 40 + i * 16,
  ry: (40 + i * 16) * 0.27,
  secs: 0.5 + i * 0.07,
}))

export function autumnRoadWorld(): World {
  const next = random(23)

  // The crowns: a dark ceiling and the far rows tapering into the end of the road, then the near crowns.
  const back: Layer = new Map()
  const midL: Layer = new Map()
  const nearL: Layer = new Map()
  const midR: Layer = new Map()
  const nearR: Layer = new Map()

  crown(next, back, 800, -30, 600, 90, 30)
  ridge(next, back, [430, 236], [790, 476], 44)
  ridge(next, back, [1150, 246], [810, 476], 40)
  crown(next, midL, 350, 200, 180, 110, 50)
  crown(next, nearL, 120, 70, 330, 220, 96)
  crown(next, midR, 1196, 228, 160, 100, 46)
  crown(next, nearR, 1500, 60, 330, 220, 96)

  const speckL = [...specks(next, 120, 90, 320, 200, 64), ...specks(next, 350, 210, 170, 100, 24)].join('')
  const speckR = [...specks(next, 1500, 80, 320, 200, 64), ...specks(next, 1196, 238, 150, 90, 20)].join('')
  const glints = (d: string, cls: string): string =>
    `<path class="${cls}" d="${d}" fill="none" stroke="#e08a32" stroke-opacity=".75" stroke-width="5" stroke-linecap="round"/>` +
    `<g class="au-gd"><path d="${d}" fill="none" stroke="#ffd27a" stroke-width="8" stroke-linecap="round"/></g>`

  // The leaf carpet on both pavements, thicker near the viewer, spilling a little onto the road.
  const carpet: Layer = new Map()

  for (let i = 0; i < 120; i += 1) {
    const left = next() < 0.6
    const t = 0.06 + 0.94 * Math.sqrt(next())
    const u = -0.2 + next() * 1.45
    const tree = left ? 800 - 1000 * t : 800 + 950 * t
    const curb = left ? 800 - 550 * t : 800 + 550 * t
    const width = t < 0.35 ? 3 : t < 0.65 ? 5 : 8
    const len = width * (0.8 + next())

    put(carpet, t < 0.3 ? 0 : Math.floor(next() * 4), width, `M${n0(tree + (curb - tree) * u)} ${n0(520 + 480 * t + (next() - 0.5) * 14 * t)}h${f(len)}`)
  }

  // Wisps of the cool wind, curling as they blow from the right.
  const wisps = [
    [400, 540, 0],
    [330, 300, -2],
    [1560, 430, -4],
    [1420, 640, -1],
    [260, 760, -3],
    [1530, 250, -5],
  ]
    .map(([x, y, d]) => `<path class="au-wi" pathLength="1" style="animation-delay:${d}s" d="M${x} ${y}c-50 -6 -90 10 -140 0c-40 -8 -50 -40 -24 -44c22 -2 22 26 -6 34c-40 10 -80 0 -130 8"/>`)
    .join('')

  // Leaves falling all the time: from the left crowns, the right ones and, dim, a few over the road.
  const fall = (x0: number, x1: number, y0: number, y1: number, count: number, s0: number, color: (i: number) => string, cls: (i: number) => string, secs: number, rng = next): string =>
    Array.from({ length: count }, (_, i) => faller(rng, x0 + rng() * (x1 - x0), y0 + rng() * (y1 - y0), s0 + rng() * 0.7, color(i), cls(i), secs + rng() * 4)).join('')
  const ab = (i: number): string => (i % 2 ? 'au-fa' : 'au-fb')
  const gold = (i: number): string => GOLDS[i % 4]!
  const golden = (i: number): string => (i % 3 ? '#f0b848' : '#e8893a')

  // Run: clumps whirling on each ring, the rings of wind-blown leaves, the dust at the foot.
  const whirl = RINGS.map(
    (ring, i) =>
      `<g transform="translate(${f(ring.x)} ${ring.y})" style="--rx:${f(ring.rx)}px;--ry:${f(ring.ry)}px;--s:${f(ring.secs)}s">` +
      Array.from({ length: 2 }, (_, j) => `<g class="au-ox" style="--p:${f(j / 2 + next() * 0.15)}"><g class="au-oy"><path class="au-tb au-t3" d="${j ? MAPLE : LEAF}" fill="${GOLDS[(i + j) % 4]}"/></g></g>`).join('') +
      '</g>',
  ).join('')
  const rings = RINGS.map(
    (ring, i) =>
      `<ellipse class="au-rg" pathLength="1" style="--s:${f(ring.secs * 1.6)}s" cx="${f(ring.x)}" cy="${ring.y}" rx="${f(ring.rx + 8)}" ry="${f(ring.ry + 3)}" stroke="${GOLDS[i % 4]}" stroke-width="${f(5 + i * 0.4)}"/>`,
  ).join('')

  // Error: the gust streaks, and the leaves it throws across the picture.
  const streaks = Array.from({ length: 16 }, () => `M${n0(next() * 1600)} ${n0(120 + next() * 780)}h${n0(-60 - next() * 120)}`).join('')
  const blown = Array.from({ length: 9 }, (_, i) => {
    const quiet = i % 3 === 0

    return (
      `<g transform="translate(${n0(1640 + next() * 120)} ${n0(140 + next() * 720)}) scale(${f(1 + next() * 0.7)})"><g class="au-bl" style="--dy:${n0((next() - 0.3) * 260)}px;animation-delay:${f(next() * 1.4)}s">` +
      `<path class="au-tb au-t3" d="${i % 2 ? MAPLE : LEAF}" fill="${quiet ? '#7a3818' : GOLDS[i % 4]}"/></g></g>`
    )
  }).join('')

  // Web: geese flying south over the lane, in a V.
  const geese = [
    [0, 0],
    [22, -12],
    [44, -24],
    [66, -36],
    [22, 12],
    [44, 24],
    [66, 36],
  ]
    .map(([x, y]) => `<path class="au-wg" d="M${x! - 11} ${y}q5 -7 11 0q6 -7 11 0"/>`)
    .join('')

  // The error's leaf pile: a mound, and the leaves heaped on it.
  const heap: Layer = new Map()

  for (let i = 0; i < 70; i += 1) {
    const x = 150 + next() * 330
    const top = x < 300 ? 456 - (x - 130) * 0.25 : 414 - (x - 300) * 0.62
    const y = top + next() * (460 - top)

    put(heap, Math.floor(next() * 3), next() < 0.5 ? 10 : 16, `M${n0(x)} ${n0(y)}h${n0(3 + next() * 5)}`)
  }

  const twinkle = random(7)
  const stars = Array.from({ length: 14 }, () => dot(560 + twinkle() * 520, 70 + twinkle() * 240)).join('')
  const lampsL = [0.66, 0.43, 0.28, 0.18, 0.115].map((t, k) => {
    const [x, y] = leftAt(t)

    return lamp(x, y, t * 1.9, k, x > 420 ? 0.45 : 1, k === 0 ? ' au-fk' : '')
  })
  const lampsR = [0.39, 0.255, 0.165, 0.105].map((t, k) => lamp(...rightAt(t), t * 1.9, k, 0.45))
  const farTrees =
    [0.09, 0.14, 0.22, 0.34].map(t => trunk(...leftAt(t), t, -1, false)).join('') +
    [0.085, 0.13, 0.2, 0.31].map(t => trunk(...rightAt(t), t, 1, false)).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0c0705',
      furniture: WOOD,
      metal: '#2e221c',
      paper: '#efe2c8',
      light: { idle: '#c9893f', work: '#f0a24e', bright: '#ffd8a0' },
      headTop: 204,
      glowAt: [348, 284],
      device,
      wear: {
        front:
          // The beret, cocked a little, its band above the eyes.
          '<path d="M58 244C50 224 96 204 150 202C206 200 252 214 248 234C246 244 70 252 58 244Z" fill="#5a1c22" stroke="#2e0c10" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M88 222C116 210 160 206 200 212" fill="none" stroke="#8a343a" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M62 242C120 250 200 248 248 232V238C200 252 120 253 62 248Z" fill="#2e0c10"/>' +
          '<path d="M150 203l3 -10" stroke="#2e0c10" stroke-width="5" stroke-linecap="round"/>' +
          // The knitted scarf: a band below the eyes, one end hanging, one streaming in the wind.
          '<g class="au-scarf">' +
          '<g class="au-tail"><path d="M68 326C58 324 46 332 36 328L34 346C44 350 56 342 68 344Z" fill="#b07624"/>' +
          '<path d="M37 330l-7 -3M36 338l-7 0M35 345l-6 3" stroke="#b07624" stroke-width="2.5" stroke-linecap="round"/></g>' +
          `<rect x="62" y="318" width="176" height="18" rx="6" fill="${MUSTARD}"/>` +
          '<path d="M78 320v14M94 320v14M110 320v14M126 320v14M142 320v14M158 320v14M174 320v14M190 320v14M206 320v14M222 320v14" stroke="#8e5c1c" stroke-width="2" stroke-opacity=".7"/>' +
          `<path d="M84 332H108V394H84Z" fill="${MUSTARD}"/><path d="M84 352H108V358H84ZM84 371H108V377H84Z" fill="#ecdcb8"/>` +
          `<path d="M87 394v7M93 394v7M99 394v7M105 394v7" stroke="${MUSTARD}" stroke-width="2.5"/>` +
          '</g>',
      },
      seatArt:
        // A park bench: two back slats, the seat, iron uprights and scrolled legs, an armrest; a leaf on the seat.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"><rect x="32" y="270" width="232" height="11" rx="2"/><rect x="32" y="292" width="232" height="11" rx="2"/>` +
        '<rect x="28" y="348" width="240" height="9" rx="2"/><rect x="32" y="359" width="232" height="7" rx="2"/></g>' +
        `<g fill="none" stroke="${IRON}" stroke-width="6" stroke-linecap="round"><path d="M40 262V366M256 262V366M48 366C38 392 58 412 40 452M248 366C258 392 238 412 256 452"/>` +
        '<path d="M40 318C28 318 26 334 35 339C41 341 44 335 40 332" stroke-width="5"/></g>' +
        `<path d="${LEAF}" transform="translate(50 345) rotate(70) scale(1.1)" fill="#d0702a"/>`,
      tableArt:
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"/><path d="M170 336H466" stroke="#2e1c10" stroke-width="1.5"/>` +
        `<g fill="none" stroke="${IRON}" stroke-width="7" stroke-linecap="round"><path d="M196 344C188 380 208 410 190 452M440 344C448 380 428 410 446 452"/><path d="M202 402H434" stroke-width="5"/></g>` +
        `<path d="${MAPLE}" transform="translate(214 327) rotate(-20)" fill="#e0a03a"/><path d="${LEAF}" transform="translate(394 338) rotate(60) scale(1.1)" fill="#b4501e"/>`,
    },
    style:
      // The crowns sway in the wind; a command shakes them, the gust bends them hard.
      '.au-cl{transform-origin:60px 900px;animation:au-cl 7s ease-in-out infinite alternate}.au-cm{transform-origin:300px 780px;animation:au-cl 5.6s ease-in-out -2s infinite alternate}' +
      '.au-cr{transform-origin:1560px 930px;animation:au-cl 8s ease-in-out -3s infinite alternate-reverse}.au-cn{transform-origin:1220px 750px;animation:au-cl 6s ease-in-out -1s infinite alternate-reverse}' +
      '@keyframes au-cl{from{transform:rotate(-.5deg)}to{transform:rotate(.7deg)}}' +
      '.st-run :is(.au-cl,.au-cm,.au-cr,.au-cn){animation:au-cl2 1.1s ease-in-out infinite alternate}' +
      '.st-error :is(.au-cl,.au-cm,.au-cr,.au-cn){animation:au-cl2 .7s ease-in-out infinite alternate}' +
      '@keyframes au-cl2{from{transform:rotate(-1.4deg)}to{transform:rotate(1.2deg)}}' +
      '.st-thinking :is(.au-cl,.au-cm,.au-cr,.au-cn){animation-duration:12s}' +
      // The wind, the lamps, the lit leaves, the falling leaves.
      '.au-wi{fill:none;stroke:#f0d2a8;stroke-opacity:.2;stroke-width:2;stroke-linecap:round;stroke-dasharray:.22 .78;animation:au-wi 6s linear infinite}@keyframes au-wi{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.st-responding .au-wi,.st-run .au-wi{animation-duration:2.6s}.st-error .au-wi{animation-duration:1.1s}' +
      '.au-stm{stroke-dasharray:.35 .65;animation:au-wi 3.4s linear infinite}' +
      '.au-st{animation:au-sp 3.6s ease-in-out infinite alternate-reverse}' +
      '.au-sp{animation:au-sp 4s ease-in-out infinite alternate}.au-sp2{animation-delay:-2s}@keyframes au-sp{from{opacity:.55}to{opacity:1}}' +
      '.au-lmp{transform-box:fill-box;transform-origin:center;animation:au-lmp 5s ease-in-out infinite alternate}@keyframes au-lmp{from{opacity:.8}to{opacity:1}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the near lamp dips twice a second at most in the gust, a small area.
      '.st-error .au-fk{animation:au-fk 1s steps(1) infinite}@keyframes au-fk{0%,32%,64%,100%{opacity:1}20%{opacity:.45}52%{opacity:.6}}' +
      '.st-done .au-lmp{animation:au-lup 2.4s ease-out both}@keyframes au-lup{from{opacity:.8;transform:scale(1)}to{opacity:1;transform:scale(1.22)}}' +
      '.st-web .au-ch{animation:au-ch 1.8s ease-in-out infinite;animation-delay:calc(var(--k) * .22s)}@keyframes au-ch{0%,100%{opacity:.8;transform:scale(1)}35%{opacity:1;transform:scale(1.3)}}' +
      '.au-fa{animation:au-fa var(--d) ease-in-out var(--l) infinite}.au-fb{animation:au-fb var(--d) ease-in-out var(--l) infinite}' +
      '@keyframes au-fa{0%{transform:translate(0,0);opacity:0}8%{opacity:1}30%{transform:translate(-60px,170px)}55%{transform:translate(-20px,310px)}80%{transform:translate(-110px,450px)}92%{opacity:1}100%{transform:translate(-90px,560px);opacity:0}}' +
      '@keyframes au-fb{0%{transform:translate(0,0);opacity:0}8%{opacity:1}25%{transform:translate(30px,140px)}50%{transform:translate(-50px,290px)}75%{transform:translate(-10px,430px)}92%{opacity:1}100%{transform:translate(-80px,560px);opacity:0}}' +
      '.au-tb{transform-box:fill-box;transform-origin:center;animation:au-tb 3.4s linear infinite}.au-t2{animation-duration:2.3s;animation-direction:reverse}.au-t3{animation-duration:.9s}' +
      '@keyframes au-tb{0%{transform:rotate(0) scaleX(1)}50%{transform:rotate(180deg) scaleX(-.55)}100%{transform:rotate(360deg) scaleX(1)}}' +
      // The leaves only shown in run, error and done tumble only then.
      '.au-vx .au-tb,.au-gs .au-tb,.au-cas .au-tb{animation-name:none}.st-run .au-vx .au-tb,.st-error .au-gs .au-tb,.st-done .au-cas .au-tb{animation-name:au-tb}' +
      // The flower seller rides in along the near pavement and turns off down the lane, staying out of the chat.
      '.au-ride{animation:au-ride 26s linear -11s infinite}' +
      '@keyframes au-ride{0%{transform:translate(-240px,0) scale(1);opacity:1}55%{transform:translate(208px,0) scale(1)}72%{transform:translate(272px,-110px) scale(.68);opacity:1}86%,100%{transform:translate(390px,-190px) scale(.46);opacity:0}}' +
      '.au-wh{animation:mv-spin 1.3s linear infinite}' +
      '.au-leg{animation:au-leg .65s ease-in-out infinite alternate}.au-leg2{animation-delay:-.65s}@keyframes au-leg{from{transform:rotate(-16deg)}to{transform:rotate(14deg)}}' +
      // The scarf's loose end flutters; the gust tears the scarf away.
      '.au-tail{transform-box:fill-box;transform-origin:100% 30%;animation:au-flut 1.5s ease-in-out infinite alternate}@keyframes au-flut{from{transform:skewY(-7deg) scaleX(.92)}to{transform:skewY(6deg) scaleX(1.05)}}' +
      '.st-error .au-scarf{transform-box:fill-box;transform-origin:center;animation:au-off 2.4s cubic-bezier(.2,.6,.4,1) .1s both}' +
      '@keyframes au-off{0%{transform:translate(0,0) rotate(0)}10%{transform:translate(8px,-10px) rotate(4deg)}35%{transform:translate(-30px,-190px) rotate(-8deg)}55%{opacity:1;transform:translate(-80px,-320px) rotate(6deg)}100%{transform:translate(-170px,-480px) rotate(-14deg);opacity:0}}' +
      // Run: the whirl rises out of the leaves and spins: each clump swings across and back round its ring.
      '.au-vx{opacity:0;transform-origin:222px 900px}.st-run .au-vx{animation:au-vin .9s ease-out both}@keyframes au-vin{from{opacity:0;transform:scale(.5,.15)}to{opacity:1;transform:scale(1,1)}}' +
      '.au-vs{transform-origin:222px 900px}.st-run .au-vs{animation:au-vs 2.2s ease-in-out infinite alternate}@keyframes au-vs{from{transform:skewX(-5deg)}to{transform:skewX(4deg)}}' +
      '.st-run .au-ox{animation:au-ox var(--s) ease-in-out calc(var(--p) * var(--s) * -2) infinite alternate}' +
      '.st-run .au-oy{animation:au-oy var(--s) ease-in-out calc((var(--p) * -2 - .5) * var(--s)) infinite alternate}' +
      '@keyframes au-ox{from{transform:translateX(calc(var(--rx) * -1))}to{transform:translateX(var(--rx))}}' +
      '@keyframes au-oy{from{transform:translateY(calc(var(--ry) * -1)) scale(1.2)}to{transform:translateY(var(--ry)) scale(2.2)}}' +
      '.au-rg{fill:none;stroke-linecap:round;stroke-opacity:.85;stroke-dasharray:.014 .05}.st-run .au-rg{animation:au-rg var(--s) linear infinite}@keyframes au-rg{to{stroke-dashoffset:-1}}' +
      // Error: the gust streaks across and throws leaves; the pile drifts up over the desk's corner.
      '.au-gs,.au-bl,.au-pile,.au-pl{opacity:0}.st-error .au-gs{animation:au-in .3s ease-out both}@keyframes au-in{to{opacity:1}}' +
      '.st-error .au-gm{animation:au-gm .9s linear infinite}@keyframes au-gm{to{transform:translateX(-1600px)}}' +
      '.st-error .au-bl{animation:au-bl 1.8s linear infinite}@keyframes au-bl{0%{opacity:0;transform:translate(0,0)}6%,94%{opacity:1}100%{opacity:0;transform:translate(-2000px,var(--dy))}}' +
      '.st-error .au-pile{transform-box:fill-box;transform-origin:50% 100%;animation:au-pile 1.3s cubic-bezier(.2,.7,.3,1) .15s both}@keyframes au-pile{from{opacity:1;transform:scaleY(0)}to{opacity:1;transform:scaleY(1)}}' +
      '.st-error .au-pl{animation:au-pl .9s ease-out both}@keyframes au-pl{from{opacity:0;transform:translate(260px,-220px) rotate(-200deg)}20%{opacity:1}to{opacity:1;transform:translate(0,0) rotate(0)}}' +
      // Done: the crowns glow gold and the leaves come down slowly.
      '.au-gd,.au-cas{opacity:0}.st-done .au-gd{animation:au-in 1.2s ease-out .1s both}' +
      '.st-done .au-cas{animation:au-fc var(--d) ease-in-out var(--l) infinite}' +
      '@keyframes au-fc{0%{transform:translate(0,0);opacity:0}6%{opacity:1}25%{transform:translate(34px,220px)}50%{transform:translate(-26px,450px)}75%{transform:translate(30px,680px)}94%{opacity:1}100%{transform:translate(-10px,900px);opacity:0}}' +
      // Web: geese go over; thinking: a leaf twirls down; read: one lands on the page; tool: leaves skitter.
      '.au-gz,.au-tl,.au-rl,.au-sk{opacity:0}.st-web .au-gz{animation:au-gz 10s linear -.8s infinite}' +
      '@keyframes au-gz{0%{opacity:0;transform:translateX(0)}4%,96%{opacity:1}100%{opacity:0;transform:translateX(-2200px)}}' +
      '.au-wg{fill:none;stroke:#c89060;stroke-width:2.6;stroke-linecap:round;transform-box:fill-box;transform-origin:50% 100%}.st-web .au-wg{animation:au-wg .45s ease-in-out infinite alternate}@keyframes au-wg{to{transform:scaleY(.3)}}' +
      '.st-thinking .au-tl{animation:au-tl 3.4s ease-in-out infinite}' +
      '@keyframes au-tl{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:1}30%{transform:translate(40px,80px) rotate(140deg)}55%{transform:translate(-10px,170px) rotate(260deg)}80%{opacity:1;transform:translate(36px,250px) rotate(380deg)}100%{opacity:0;transform:translate(10px,320px) rotate(470deg)}}' +
      '.st-read .au-rl{animation:au-rl 2.6s ease-out both}' +
      '@keyframes au-rl{0%{opacity:0;transform:translate(150px,-300px) rotate(0)}10%{opacity:1}35%{transform:translate(60px,-200px) rotate(130deg)}65%{transform:translate(110px,-90px) rotate(220deg)}100%{opacity:1;transform:translate(0,0) rotate(340deg)}}' +
      '.st-tool .au-sk{animation:au-sk 1.2s linear infinite}@keyframes au-sk{0%{opacity:0;transform:translate(0,0) rotate(0)}15%,80%{opacity:1}100%{opacity:0;transform:translate(-170px,-8px) rotate(-320deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="au-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0710"/><stop offset=".3" stop-color="#140b15"/><stop offset=".46" stop-color="#271319"/><stop offset=".52" stop-color="#3a1d18"/></linearGradient>' +
      '<linearGradient id="au-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1610"/><stop offset=".3" stop-color="#170d09"/><stop offset="1" stop-color="#110906"/></linearGradient>' +
      '<linearGradient id="au-rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1610"/><stop offset=".3" stop-color="#140b08"/><stop offset="1" stop-color="#0e0705"/></linearGradient>' +
      '<radialGradient id="au-mh"><stop offset="0" stop-color="#f0dcc0" stop-opacity=".14"/><stop offset="1" stop-color="#f0dcc0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au-mist"><stop offset="0" stop-color="#6a3422" stop-opacity=".45"/><stop offset="1" stop-color="#6a3422" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au-lg"><stop offset="0" stop-color="#ffc870" stop-opacity=".55"/><stop offset=".35" stop-color="#ff9a40" stop-opacity=".2"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au-gg"><stop offset="0" stop-color="#ffc860" stop-opacity=".32"/><stop offset=".55" stop-color="#ffa840" stop-opacity=".13"/><stop offset="1" stop-color="#ffa840" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="au-dg"><stop offset="0" stop-color="#b06a3a" stop-opacity=".55"/><stop offset="1" stop-color="#b06a3a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="au-vg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8904a" stop-opacity="0"/><stop offset=".5" stop-color="#d8904a" stop-opacity=".2"/><stop offset="1" stop-color="#d8904a" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="530" fill="url(#au-sky)"/>' +
      // A thin moon and the first stars in the gap over the road.
      `<path class="au-st" d="${stars}" stroke="#f0dcc0" stroke-width="2.6" stroke-linecap="round"/>` +
      '<circle cx="1012" cy="160" r="70" fill="url(#au-mh)"/><path d="M1012 138a22 22 0 1 0 0 44a30 30 0 0 1 0 -44Z" fill="#f0dcc0" fill-opacity=".6"/>' +
      '<rect y="518" width="1600" height="482" fill="url(#au-gnd)"/>' +
      // The road between its kerbs and the leaves lying on the pavements.
      '<path d="M800 518L250 1000H1350Z" fill="url(#au-rd)"/>' +
      '<path d="M800 518L250 1000M800 518L1350 1000" stroke="#8a4a24" stroke-opacity=".3" stroke-width="3"/>' +
      paint(carpet, ['#3e1a0c', '#6a2c14', '#8a4218', '#a8622a']) +
      farTrees +
      '<ellipse cx="800" cy="500" rx="320" ry="110" fill="url(#au-mist)"/>' +
      paint(back) +
      lampsL.slice(2).join('') +
      lampsR.slice(1).join('') +
      // The middle left tree and its crown, then the near one at the edge.
      `<g class="au-cm">${trunk(...leftAt(0.52), 0.52, -1, true)}${paint(midL)}</g>` +
      lampsL[1] +
      `<g class="au-cl">${trunk(...leftAt(0.8), 0.8, -1, true)}${paint(nearL)}${glints(speckL, 'au-sp')}` +
      '<g class="au-gd"><circle cx="150" cy="130" r="480" fill="url(#au-gg)"/></g></g>' +
      lampsL[0] +
      wisps +
      fall(-20, 440, 40, 420, 10, 0.9, gold, ab, 10) +
      fall(470, 1150, 60, 360, 3, 0.7, () => '#7a3818', ab, 12) +
      fall(-20, 440, -40, 160, 6, 1.7, golden, () => 'au-cas', 7) +
      fall(-30, 420, -60, 240, 8, 2, golden, () => 'au-cas', 6.5, random(41)) +
      fall(470, 1150, -40, 160, 2, 1.1, () => '#8a5020', () => 'au-cas', 8) +
      // The flower seller, along the near pavement.
      `<g class="mv-b"><g transform="translate(0 958) scale(1.25)"><g class="au-ride">${cyclist(next)}</g></g></g>` +
      // The right rows: the nearest lamp, the tree just behind the bench and the great tree at the edge.
      '<g class="mv-r">' +
      lampsR[0] +
      `<g class="au-cn">${trunk(...rightAt(0.47), 0.47, 1, true)}${paint(midR)}</g>` +
      `<g class="au-cr">${trunk(1565, 1000, 0.92, 1, true)}<g class="mv-t">${paint(nearR)}${glints(speckR, 'au-sp au-sp2')}` +
      '<g class="au-gd"><circle cx="1460" cy="120" r="480" fill="url(#au-gg)"/></g></g></g>' +
      fall(1200, 1640, 20, 420, 8, 0.9, gold, ab, 10) +
      fall(1180, 1640, -40, 160, 6, 1.7, golden, () => 'au-cas', 7) +
      '</g>' +
      // Run: the whirl of leaves in the left third.
      `<g class="au-vx"><g class="au-vs"><ellipse cx="${VX}" cy="896" rx="190" ry="40" fill="url(#au-dg)"/>` +
      `<path d="M182 900L36 150H408L262 900Z" fill="url(#au-vg)"/>${rings}${whirl}</g></g>` +
      // Error: the gust.
      `<g class="au-gs"><g class="au-gm" stroke="#f2dcc0" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"><path d="${streaks}" transform="translate(1600 0)"/>` +
      `<path d="${streaks}"/></g>${blown}</g>` +
      // Web: the geese.
      `<g class="mv-r"><g class="mv-t"><g transform="translate(1720 300) scale(1.5)"><g class="au-gz">${geese}</g></g></g></g>`,
    nook:
      // The pavement round the bench, leaves drifted against its legs.
      '<path d="M-150 462Q-60 438 40 430Q140 422 260 428T470 426V470H-150Z" fill="#1a0f0a"/>' +
      '<path d="M-10 456Q20 432 52 442T100 456Z" fill="#5a2610"/>' +
      '<path d="M-14 448h8M12 444h6M40 446h8M70 450h6M130 450h8M220 448h6M300 452h8M380 449h6M-4 438h5M30 438h6" stroke="#a8521c" stroke-width="7" stroke-linecap="round"/>',
    front:
      // Thinking: a leaf twirls down beside Claude.
      `<g transform="translate(-40 40)"><g class="au-tl"><path d="${MAPLE}" transform="scale(1.4)" fill="#e0a03a"/></g></g>` +
      // Read: a leaf lands on the page.
      `<g transform="translate(216 316)"><g class="au-rl"><path d="${LEAF}" transform="rotate(80) scale(1.2)" fill="#e8b440"/></g></g>` +
      // Tool: leaves skitter along the ground.
      [40, 130, 220, 310, 400]
        .map((x, i) => `<g transform="translate(${x} ${448 + (i % 2) * 5})"><path class="au-sk" style="animation-delay:${f(-i * 0.26)}s" d="${i % 2 ? MAPLE : LEAF}" fill="${GOLDS[i % 4]}"/></g>`)
        .join('') +
      // Error: the pile that buries the desk's corner, and the leaves landing on it.
      '<g class="au-pile"><path d="M130 462C190 446 250 432 300 414C350 396 400 340 430 312C450 298 470 296 480 300V462Z" fill="#6e2e12"/>' +
      paint(heap, ['#9a4418', '#c86e24', '#e8a440']) +
      '</g>' +
      [
        [440, 304, 20],
        [404, 330, 80],
        [370, 362, 140],
        [330, 392, 200],
        [290, 412, 40],
        [200, 444, 120],
        [460, 298, 250],
      ]
        .map(
          ([x, y, r], i) =>
            `<g transform="translate(${x} ${y}) rotate(${r}) scale(1.4)"><path class="au-pl" style="animation-delay:${f(0.15 + i * 0.09)}s" d="${i % 2 ? MAPLE : LEAF}" fill="${GOLDS[i % 4]}"/></g>`,
        )
        .join(''),
  }
}
