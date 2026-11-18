import { f, random } from './kit'
import type { World } from './world'

// Marigold Bridge: a festival-of-the-dead night, drawn as an original homage. A bridge of glowing marigold petals
// climbs out of a candlelit village into a spirit city of stacked, colourful towers floating on violet mist, and
// papel-picado banners with invented cut patterns sway across the top. Claude, in a marigold crown, codes on a
// painted wooden laptop at a family altar (candles, marigolds, plain bread, empty photo frames) under a marigold
// arch. A command makes the bridge blaze and petals stream up it into the city; an error is a gust that scatters
// petals off the bridge; done blooms the city's windows and sets off gentle fireworks.

type P = readonly [number, number]
type Sub = readonly [number, number, string]

const MARI = '#ffa726'
const DEEP = '#ef6c00'
const GOLD = '#ffd180'
const WOOD = '#5a3320'
const WOOD_EDGE = '#7a4a2c'
const CLAY = '#8a3f1e'
const LEAF = '#3c6b28'
const PAPEL = ['#e0347a', '#ff8f1f', '#25b8a8', '#ffd23f', '#8f5cf0', '#7cc84a'] as const
const BACK = ['#24112f', '#0e2a33', '#33102a', '#161f40', '#33200f'] as const
const FRONT = ['#43195a', '#124750', '#571a45', '#233373', '#58361a', '#2e4a1e'] as const

const add = (list: string[], at: number, d: string): void => {
  list[at] = (list[at] ?? '') + d
}

/** A circle as one subpath, so a crowd of dots shares one element. */
const ring = (x: number, y: number, r: number): string =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`

/** A petal as one subpath: an almond reaching `s` from its middle to each tip, turned `a` radians. */
function petal(x: number, y: number, s: number, a: number): string {
  const c = Math.cos(a) * s
  const n = Math.sin(a) * s

  return (
    `M${f(x - c)} ${f(y - n)}q${f(c - n * 0.6)} ${f(n + c * 0.6)} ${f(2 * c)} ${f(2 * n)}` +
    `q${f(n * 0.6 - c)} ${f(-n - c * 0.6)} ${f(-2 * c)} ${f(-2 * n)}Z`
  )
}

/** A candle flame as one subpath: a teardrop `h` tall standing on (x, y). */
const flame = (x: number, y: number, h: number): string =>
  `M${f(x)} ${f(y - h)}q${f(h * 0.45)} ${f(h * 0.62)} 0 ${f(h)}q${f(-h * 0.45)} ${f(-h * 0.38)} 0 ${f(-h)}Z`

// The bridge: one cubic from its near end in the village's corner up to the city's gate, climbing more steeply as it
// recedes; it narrows with distance but keeps a blunt far end that lands on the gate.
const BRIDGE = [
  [40, 1040],
  [140, 880],
  [250, 650],
  [300, 478],
] as const

const AXIS = `M${BRIDGE[0].join(' ')}C${BRIDGE.slice(1).map(p => p.join(' ')).join(' ')}`

type Span = { x: number; y: number; nx: number; ny: number; w: number }

function span(t: number): Span {
  const [a, b, c, d] = BRIDGE
  const u = 1 - t
  const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0]
  const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
  const len = Math.hypot(dx, dy) || 1

  return { x, y, nx: -dy / len, ny: dx / len, w: 150 * u + 30 }
}

/** A point at `side` of the bridge's width (±.5 the edges); `out` 1 is the foot of its dark side, down and right. */
function at(s: Span, side: number, out = 0): P {
  const k = (s.w * 0.12 + 4) * out

  return [s.x + s.nx * s.w * side + k * 0.8, s.y + s.ny * s.w * side + k * 0.6]
}
const xy = ([x, y]: P): string => `${Math.round(x)} ${Math.round(y)}`

/** Points along one line of the bridge, near end first. */
const edge = (side: number, out = 0): string[] => Array.from({ length: 13 }, (_, i) => xy(at(span(i / 12), side, out)))

/** The railing along one edge: posts that shrink with distance and the rail across their tops. */
function railing(side: number): { posts: string; rail: string } {
  let posts = ''
  const tops: string[] = []

  for (let i = 0; i < 11; i += 1) {
    const s = span(0.03 + i * 0.094)
    const [x, y] = at(s, side)
    const h = s.w * 0.3 + 6

    posts += `M${xy([x, y])}v${Math.round(-h)}`
    tops.push(xy([x, y - h]))
  }

  return { posts, rail: `M${tops.join('L')}` }
}

/** Bands of petals across the deck, closer together as it recedes, so it reads as a road into the distance. */
const bands = (): string =>
  Array.from({ length: 11 }, (_, i) => {
    const s = span(1 - (1 - i / 11) ** 1.6)

    return `M${xy(at(s, -0.5))}L${xy(at(s, 0.5))}`
  }).join('')

/** Petals pouring off the foot of the bridge's dark side, a stream every so often along it. */
const cascades = (): string =>
  [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82].map(t => `M${xy(at(span(t), 0.5, 1))}v${f(40 + span(t).w * 1.1)}`).join('')

/** Somewhere on the bridge's deck, with a size that shrinks with distance. */
function onDeck(next: () => number, from: number): { x: number; y: number; size: number } {
  const s = span(from + next() * (0.97 - from))
  const side = (next() - 0.5) * 0.85

  return { x: s.x + s.nx * s.w * side, y: s.y + s.ny * s.w * side, size: 1.8 + s.w * 0.045 }
}

type City = { body: string; lit: string; bloom: string; peak: P }

/**
 * A spirit city: columns of stacked blocks in jewel tones, a tall back row and a low front row, some capped with
 * round tops; rows of windows (some twinkling, more that light up when done) and strings of lights between tops.
 */
function city(seed: number, x0: number, x1: number, base: number, top: number, mid: number, spread: number, k: number): City {
  const next = random(seed)
  const n = Math.round
  const fills: string[] = []
  const rows: string[] = []
  const lights: string[] = []
  let peak: P = [mid, base]

  for (const layer of [0, 1]) {
    const tones = layer === 0 ? BACK.length : FRONT.length
    let x = x0 + layer * 12 * k
    let last: P | undefined

    while (x < x1) {
      const cw = ((layer === 0 ? 50 : 36) + next() * 28) * k
      const centre = x + cw / 2
      const shape = Math.exp(-(((centre - mid) / spread) ** 2))
      const topY = base - (base - top) * (layer === 0 ? 1 : 0.42) * (0.22 + 0.78 * shape) * (0.8 + 0.3 * next())
      let y = base + layer * 16 * k
      let level = 0

      while (y > topY) {
        const bh = (30 + next() * 36) * k
        const bw = cw * Math.max(0.5, 1 - 0.09 * level - next() * 0.18)
        const bx = x + (cw - bw) * next()
        const roof = y - bh
        const round = level > 0 && roof <= topY && next() < 0.45
        add(
          fills,
          layer * 10 + Math.floor(next() * tones),
          round
            ? `M${n(bx)} ${n(y)}V${n(roof + bw / 2)}a${n(bw / 2)} ${n(bw / 2)} 0 0 1 ${n(bw)} 0V${n(y)}Z`
            : `M${n(bx)} ${n(roof)}h${n(bw)}v${n(bh)}h${n(-bw)}Z`,
        )

        for (let wy = roof + (round ? bw / 2 + 4 * k : 9 * k); wy < y - 6 * k; wy += 14 * k) {
          const r = next()
          const group = r < 0.15 ? 0 : r < 0.2 ? 1 : r < 0.24 ? 2 : r < 0.29 ? 3 : r < 0.34 ? 4 : r < 0.38 ? 5 : r < 0.6 ? 6 : -1

          if (group >= 0) add(rows, group, `M${n(bx + 4 * k)} ${n(wy)}h${n(bw - 8 * k)}`)
        }

        y = roof
        level += 1
      }

      if (layer === 0 && y < peak[1]) peak = [centre, y]
      const hang: P = [centre, y + 10 * k]
      if (last !== undefined && Math.abs(last[1] - hang[1]) < 46 * k && next() < 0.8) {
        add(lights, layer, `M${n(last[0])} ${n(last[1])}Q${n((last[0] + hang[0]) / 2)} ${n(Math.max(last[1], hang[1]) + 16 * k)} ${n(hang[0])} ${n(hang[1])}`)
      }
      last = hang
      x += cw + (2 + next() * 6) * k
    }
  }

  const paint = (layer: number): string =>
    `<g stroke="#f0d8ff" stroke-opacity=".12" stroke-width="${f(1.5 * k)}">` +
    (layer === 0 ? BACK : FRONT)
      .map((tone, i) => {
        const d = fills[layer * 10 + i]

        return d === undefined ? '' : `<path d="${d}" fill="${tone}"/>`
      })
      .join('') +
    `</g><path d="${lights[layer] ?? ''}" fill="none" stroke="#ffd98a" stroke-opacity=".8" stroke-width="${f(2.6 * k)}" stroke-dasharray="0 ${f(7 * k)}" stroke-linecap="round"/>`
  const windows: readonly (readonly [string, string])[] = [
    ['#ffcf70', ' stroke-opacity=".75"'],
    ['#ff8fc8', ' stroke-opacity=".7"'],
    ['#7ff3e4', ' stroke-opacity=".6"'],
    ['#ffd98a', ' class="mg-tw"'],
    ['#ffd98a', ' class="mg-tw mg-t2"'],
    ['#ffb0d8', ' class="mg-tw mg-t3"'],
  ]
  const dash = `stroke-width="${f(5 * k)}" stroke-dasharray="${f(3.6 * k)} ${f(6.4 * k)}"`

  return {
    body: paint(0) + paint(1),
    lit: `<g fill="none" ${dash}>${windows.map(([tone, extra], i) => `<path${extra} d="${rows[i] ?? ''}" stroke="${tone}"/>`).join('')}</g>`,
    bloom: `<path class="mg-bloom" d="${rows[6] ?? ''}" fill="none" stroke="#ffe7a8" ${dash}/>`,
    peak,
  }
}

/** A far tower stack adrift in the sky, as a faint silhouette with a few lit windows. */
const distant = (x: number, y: number, s: number): string =>
  `<g transform="translate(${x} ${y}) scale(${s})" opacity=".45"><ellipse cx="34" cy="2" rx="52" ry="9" fill="#2a1540"/>` +
  '<path d="M0 0V-30h12V-52h14V-40h10V-74a6 6 0 0 1 12 0V-34h12V-20h8V0Z" fill="#1e1028"/>' +
  '<path d="M16 -44h4M16 -30h4M38 -62h4M38 -46h4M50 -26h4M4 -18h4" stroke="#ffcf70" stroke-opacity=".8" stroke-width="5"/></g>'

// Papel picado: a tissue flag 40 wide with a zigzag hem and invented cut patterns (diamonds, dots, zigzags, rings).
const dotCut = (x: number, y: number, r: number): Sub => [x - r, y, `a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`]
const diamondCut = (x: number, y: number, rx: number, ry: number): Sub => [x, y - ry, `l${rx} ${ry} ${-rx} ${ry} ${-rx} ${-ry}z`]
const zigCut = (x: number, y: number): Sub => [x, y, 'l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4v4l-4-4-4 4-4-4-4 4-4-4-4 4-4-4-4 4z']
const SHEET: Sub = [0, 0, 'h40v36l-5 8-5-8-5 8-5-8-5 8-5-8-5 8-5-8z']
const CUTS: readonly (readonly Sub[])[] = [
  [SHEET, diamondCut(20, 18, 10, 12), diamondCut(20, 18, 4.5, 5.5), dotCut(7, 8, 2.2), dotCut(33, 8, 2.2)],
  [SHEET, dotCut(20, 18, 4.5), diamondCut(11, 9, 2.6, 3.2), diamondCut(29, 9, 2.6, 3.2), diamondCut(11, 27, 2.6, 3.2), diamondCut(29, 27, 2.6, 3.2)],
  [SHEET, zigCut(4, 12), zigCut(4, 26)],
  [SHEET, dotCut(20, 18, 11), dotCut(20, 18, 7), diamondCut(20, 18, 3, 4)],
]
const QUIET: readonly Sub[] = [SHEET, diamondCut(20, 18, 6, 8)]

/** One flag's path at (x, y): the first subpath absolute, the cuts relative, so the shape is written once. */
function sheet(x: number, y: number, cuts: readonly Sub[]): string {
  let out = ''
  let px = 0
  let py = 0

  cuts.forEach(([sx, sy, body], i) => {
    out += (i === 0 ? `M${f(x + sx)} ${f(y + sy)}` : `m${f(sx - px)} ${f(sy - py)}`) + body
    px = sx
    py = sy
  })

  return out
}

/** A string of flags hung on a sagging cord from `a` to `b`; over the chat column they are faint, plain and sparse. */
function strand(a: P, c: P, b: P, count: number, shift: number): string {
  const loud: string[] = []
  const quiet: string[] = []

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count
    const u = 1 - t
    const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0]
    const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]
    const hush = x > 400 && x < 1200
    if (hush && i % 2) continue
    const cuts = hush ? QUIET : (CUTS[(i * 3 + shift) % CUTS.length] ?? QUIET)

    ;(hush ? quiet : loud).push(`<path class="mg-sw" d="${sheet(x - 20, y - 1, cuts)}" fill="${PAPEL[(i + shift) % PAPEL.length] ?? MARI}"/>`)
  }

  return (
    `<g class="mg-pp" fill-rule="evenodd"><path d="M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}" fill="none" stroke="#e8d2b8" stroke-opacity=".4" stroke-width="1.4"/>` +
    `<g fill-opacity=".82">${loud.join('')}</g><g fill-opacity=".36">${quiet.join('')}</g></g>`
  )
}

/** A soft firework: a trail rising, then two rings of dots opening out and fading. Inside a group that sets the dots. */
function burst(x: number, y: number, r: number, a: string, b: string, delay: number): string {
  const at = `style="animation-delay:${delay}s"`

  return (
    `<path class="mg-tr" ${at} d="M${x} ${y + 12}v22" stroke="${a}"/>` +
    `<g class="mg-fw" ${at}><circle cx="${x}" cy="${y}" r="${f(r * 0.4)}" fill="${a}" fill-opacity=".16" stroke="none"/>` +
    `<circle cx="${x}" cy="${y}" r="${r}" pathLength="14" stroke="${a}" stroke-width="8"/>` +
    `<circle cx="${x}" cy="${y}" r="${f(r * 0.58)}" pathLength="9" stroke="${b}" stroke-width="6"/></g>`
  )
}
const FIREWORK = 'fill="none" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0 1"'

/** Petals drifting down slowly, turning as they go; their colour and opacity come from the group. */
function drift(next: () => number, count: number, box: readonly [number, number, number, number]): string {
  return Array.from({ length: count }, () => {
    const x = box[0] + next() * box[2]
    const y = box[1] + next() * box[3]

    return `<path class="mg-dr" style="--t:${f(11 + next() * 7)}s;animation-delay:${f(-next() * 15)}s" d="${petal(x, y, 3.4 + next() * 1.6, next() * 3)}"/>`
  }).join('')
}

/** Petals that a gust tears loose: each flies off up and to the left; delays and spin come from the CSS. */
function torn(next: () => number, spots: readonly P[], size: number): string {
  return spots
    .map(([x, y]) => `<path class="mg-sc" style="--dx:${f(-130 - next() * 230)}px;--dy:${f(-40 - next() * 200)}px" d="${petal(x, y, size, next() * 3)}"/>`)
    .join('')
}

/** Wind lines for the gust: a stroke that races along each path, right to left. */
function gust(paths: readonly string[]): string {
  return (
    '<g fill="none" stroke="#ffe6c8" stroke-width="3" stroke-linecap="round">' +
    paths.map(d => `<path class="mg-gust" pathLength="1" d="${d}"/>`).join('') +
    '</g>'
  )
}

// Claude's marigold crown: a vine across the top of the head with seven blooms, clear above the eyes (row 1 at 254).
const BLOOMS = [
  [72, 244, 8],
  [97, 239, 10],
  [123, 235.5, 10.5],
  [150, 234, 12.5],
  [177, 235.5, 10.5],
  [203, 239, 10],
  [228, 244, 8],
] as const
const blooms = (scale: number): string => BLOOMS.map(([x, y, r]) => ring(x, y, r * scale)).join('')
const CROWN =
  `<path d="M62 249Q150 222 238 249" fill="none" stroke="${LEAF}" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="${petal(62, 250, 8, 0.4)}${petal(238, 250, 8, -0.4)}${petal(110, 244, 5.5, -0.6)}${petal(190, 244, 5.5, 0.6)}" fill="#5a9a36"/>` +
  `<path d="${blooms(1)}" fill="${DEEP}"/>` +
  `<path d="${blooms(0.78)}" fill="none" stroke="#ffc46a" stroke-width="2.6" stroke-dasharray="2.2 2.2"/>` +
  `<path d="${blooms(0.5)}" fill="${MARI}"/><path d="${blooms(0.18)}" fill="#8a3300"/>` +
  `<path d="${ring(85, 248, 3.6)}${ring(215, 248, 3.6)}" fill="#ff4f9a"/>`

/** The painted wooden laptop, a marigold in a clay vase and a candle on the desk. */
function device(light: string): string {
  const keys = Array.from({ length: 6 }, (_, i) => `M${252 + i * 13} 324h8v3h-8Z`).join('')
  const paint = (tone: string, from: number) =>
    `<path d="${[0, 1, 2].map(i => ring(250 + (from + i * 3) * 10.5, 328.6, 1.5)).join('')}" fill="${tone}"/>`
  const vine = [0.14, 0.38, 0.62, 0.86].map(t => [370 - 24 * t, 242 + 85 * t] as const)

  return (
    '<rect x="242" y="322" width="102" height="8" rx="2" fill="#6d3f22" stroke="#3a1f10" stroke-width="1.2"/>' +
    `<path d="${keys}" fill="${light}" fill-opacity=".55"/>` +
    paint('#ff4f9a', 0) +
    paint('#2ec4b6', 1) +
    paint('#ffd23f', 2) +
    '<path d="M336 328L362 236L377 240L351 330Z" fill="#6d3f22" stroke="#3a1f10" stroke-width="1.5" stroke-linejoin="round"/>' +
    `<path d="M337 325L361 242L365 243L341 327Z" fill="${light}"/>` +
    `<path d="M337 325L361 242L348 246L328 325Z" fill="${light}" fill-opacity=".16"/>` +
    // Painted on the lid's back: a teal vine and four flowers.
    '<path d="M370 242L346 327" stroke="#2ec4b6" stroke-width="1.4"/>' +
    `<path d="${vine.map(([x, y], i) => (i % 2 ? '' : ring(x, y, 3))).join('')}" fill="#ff4f9a"/>` +
    `<path d="${vine.map(([x, y], i) => (i % 2 ? ring(x, y, 3) : '')).join('')}" fill="#ffd23f"/>` +
    `<path d="${vine.map(([x, y]) => ring(x, y, 1)).join('')}" fill="#3a1f10"/>` +
    // The marigold in its vase.
    `<path d="M398 317l-3-10M402 317l3-12" stroke="${LEAF}" stroke-width="1.8"/>` +
    `<path d="${ring(395, 306, 5.5)}${ring(405, 303, 6)}" fill="${DEEP}"/><path d="${ring(395, 306, 3)}${ring(405, 303, 3.3)}" fill="${MARI}"/>` +
    `<path d="M392 330l2-13h12l2 13Z" fill="${CLAY}"/><path d="M393 318h14" stroke="#b3582a" stroke-width="2"/>` +
    // The candle.
    '<rect x="440" y="300" width="11" height="30" rx="1.5" fill="#efe2c6"/><path d="M442 302q2 6 0 11" fill="none" stroke="#d6c4a2" stroke-width="2"/>' +
    '<circle cx="445.5" cy="291" r="16" fill="#ffb74d" fill-opacity=".13"/><circle cx="445.5" cy="291" r="7" fill="#ffd27a" fill-opacity=".2"/>' +
    `<g class="mg-fla"><path d="${flame(445.5, 299, 13)}" fill="#ffd27a"/><path d="${flame(445.5, 298, 6)}" fill="#fff4d6"/></g>`
  )
}

const SEAT =
  `<path d="M116 360L110 456M186 360L192 456" stroke="${WOOD}" stroke-width="8" stroke-linecap="round"/>` +
  `<path d="M117 418H185" stroke="${WOOD}" stroke-width="5"/>` +
  '<path d="M109.5 396h8M184.5 396h8M108 436h8M186 436h8" stroke="#2ec4b6" stroke-width="3"/>' +
  '<rect x="106" y="348" width="90" height="13" rx="4" fill="#7a3a22" stroke="#3a1a0e" stroke-width="1.5"/>' +
  '<path d="M112 354.5H190" stroke="#ffd23f" stroke-opacity=".8" stroke-width="2" stroke-dasharray="5 4"/>'

const TABLE =
  `<path d="M190 360V456M446 360V456" stroke="${WOOD}" stroke-width="12"/><path d="M196 420H440" stroke="${WOOD}" stroke-width="6"/>` +
  `<rect x="166" y="329" width="304" height="10" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.4"/>` +
  `<path d="M170 337H470V360${'q-6 8-12 0'.repeat(25)}Z" fill="#6e1544"/>` +
  '<path d="M170 343H470M170 353H470" stroke="#2ec4b6" stroke-opacity=".75" stroke-width="2.4"/>' +
  '<path d="M170 348H470" stroke="#ffb300" stroke-width="2" stroke-dasharray="6 4"/>' +
  '<path d="M166 330H470" stroke="#c98a5a" stroke-opacity=".5" stroke-width="1.6"/>'

/** A cloth hem cut like papel picado: a scalloped strip with a round hole in each scallop. */
function hem(x: number, y: number, scallops: number, tone: string, shelf: string): string {
  return (
    `<path d="M${x} ${y}h${scallops * 16}v10${'q-8 10-16 0'.repeat(scallops)}Z" fill="${tone}" fill-opacity=".85"/>` +
    `<path d="M${x + 8} ${y + 6}h${scallops * 16 - 16}" stroke="${shelf}" stroke-width="4.4" stroke-dasharray="0 16" stroke-linecap="round"/>`
  )
}

// The altar's candles: x, the shelf or floor they stand on, height. The tall three stand at the altar's foot.
const CANDLES: readonly (readonly [number, number, number])[] = [
  [322, 122, 40],
  [310, 122, 16],
  [300, 197, 30],
  [352, 197, 24],
  [332, 456, 56],
  [346, 456, 68],
  [361, 456, 50],
]
// Empty frames for the family's photos (no faces): x, y, w, h, and when each warms while Claude reads.
const FRAMES: readonly (readonly [number, number, number, number, number])[] = [
  [278, 80, 24, 42, 0.1],
  [332, 86, 24, 36, 0.45],
  [270, 160, 22, 37, 0.8],
]
// The marigold arch standing on the lower shelf over the top tier, as two staggered rows of blooms on a leafy garland.
// Its bloom rows span x 237..417: clear of the window's right edge and of the Zzz rising from the head (x 200..247).
const ARCH_IN = 'M259 197V150A68 118 0 0 1 395 150V197'
const ARCH_OUT = 'M245 197V150A82 132 0 0 1 409 150V197'
const ARCH = 'M252 197V150A75 125 0 0 1 402 150V197'

export function marigoldBridgeWorld(): World {
  const next = random(29)
  const left = city(11, -40, 425, 470, 172, 185, 170, 1)
  const right = city(23, 1340, 1640, 420, 200, 1490, 130, 0.85)

  // The sky's stars, in three brightnesses.
  const stars: string[] = []
  for (let i = 0; i < 45; i += 1) {
    const s = 1 + Math.round(next() * 1.4)

    add(stars, i % 3, `M${Math.round(next() * 1600)} ${Math.round(next() * 620)}h${s}v${s}h-${s}Z`)
  }

  // The bridge: its glow, its thickness, the petal deck and its rims; the blaze, the lanes and the petals that fly.
  const hi = edge(0.5)
  const lo = edge(-0.5)
  const deck = `M${[...hi, ...[...lo].reverse()].join('L')}Z`
  const face = `M${[...hi, ...edge(0.5, 1).reverse()].join('L')}Z`
  const rims = `M${hi.join('L')}M${lo.join('L')}`
  const railR = railing(0.5)
  const railL = railing(-0.5)
  const rails = railR.posts + railR.rail + railL.posts + railL.rail
  const texture: string[] = []
  for (let i = 0; i < 26; i += 1) {
    const spot = onDeck(next, 0)

    add(texture, i % 2, petal(spot.x, spot.y, spot.size, next() * Math.PI))
  }
  const lane = (side: number, cls: string) => `<path class="mg-lane ${cls}" d="M${edge(side).join('L')}"/>`
  const deckSpots = Array.from({ length: 14 }, () => {
    const spot = onDeck(next, 0.12)

    return [spot.x, spot.y] as const
  })
  const rising = Array.from({ length: 6 }, (_, i) => `<path class="mg-rs" style="--dx:${(i - 2.5) * 16}px" d="${petal(290 + i * 4, 474, 3.6, i)}"/>`).join('')

  // The village under the bridge: houses with lit doors and windows, a far row of roofs, and candles on the ground.
  const tones = ['#2b1020', '#36142a', '#24122e']
  const walls: string[] = []
  let lit = ''
  let parapets = ''
  const houses: readonly (readonly [number, number, number, number, number])[] = [
    [-34, 792, 100, 0, 1],
    [118, 760, 78, 2, 0],
    [44, 862, 80, 1, 1],
    [258, 806, 86, 1, 1],
    [334, 866, 104, 0, 1],
    [430, 918, 120, 2, 0],
  ]
  for (const [x, top, w, tone, door] of houses) {
    add(walls, tone, `M${x} ${top}h${w}V1000H${x}Z`)
    parapets += `M${x - 3} ${top}h${w + 6}v6h${-w - 6}Z`
    lit += `M${f(x + w * (door ? 0.62 : 0.22))} ${top + 34}v-9a6 6 0 0 1 12 0v9Z`
    lit += door ? `M${f(x + w * 0.22)} 1000V962a9 9 0 0 1 18 0V1000Z` : `M${f(x + w * 0.62)} ${top + 34}v-9a6 6 0 0 1 12 0v9Z`
  }
  let roofs = 'M540 1000V950'
  let windows = ''
  for (let x = 540; x < 1190; ) {
    const w = Math.round(34 + next() * 46)
    const h = Math.round(926 + next() * 24)

    roofs += `V${h}h${w}`
    if (next() < 0.6) windows += `M${x + Math.round(w / 2) - 2} ${h + 9}h4v5h-4Z`
    x += w
  }
  roofs += 'V1000Z'
  const flames = ['', '', '']
  let bodies = ''
  let halos = ''
  const spots: readonly (readonly [number, number, number])[] = [
    [18, 978, 1],
    [36, 988, 0.8],
    [88, 992, 0.9],
    [130, 960, 0.7],
    [238, 984, 1.1],
    [270, 992, 0.8],
    [300, 976, 1],
    [352, 988, 0.9],
    [396, 980, 1],
    [430, 992, 0.8],
    [640, 992, 0.6],
    [880, 995, 0.6],
    [1100, 992, 0.6],
  ]
  spots.forEach(([x, y, s], i) => {
    bodies += `M${f(x - 2.5 * s)} ${y}h${f(5 * s)}v${f(-12 * s)}h${f(-5 * s)}Z`
    add(flames, i % 3, flame(x, y - 12 * s - 1, 9 * s))
    if (s > 0.6) halos += ring(x, y - 16 * s, 12 * s)
  })
  const trail = 'M1190 984C900 970 640 996 150 982'

  // The spirit orbs that float up while Claude thinks.
  const orbs = (
    [
      [60, 900],
      [150, 860],
      [300, 880],
      [380, 820],
      [230, 760],
      [100, 700],
      [340, 640],
    ] as const
  )
    .map(
      ([x, y], i) =>
        `<g class="mg-orb" style="--dx:${f((next() - 0.5) * 80)}px;animation-delay:${f(-i * 0.63)}s"><circle cx="${x}" cy="${y}" r="10" fill-opacity=".22"/>` +
        `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff0d0"/></g>`,
    )
    .join('')
  const [px, py] = left.peak

  // The altar in the nook: two shelves dressed in cut-paper hems, candles, frames, bread and marigolds.
  const candleBodies = CANDLES.map(([x, base, h]) => `M${x - 4} ${base}V${base - h}h8V${base}Z`).join('')
  const candleLights = CANDLES.map(
    ([x, base, h], i) =>
      `<circle class="mg-cg" cx="${x}" cy="${base - h - 7}" r="24" fill="url(#mg-cg)"/>` +
      `<path class="mg-fla${i % 2 ? ' mg-f2' : ''}" d="${flame(x, base - h - 1, 11)}" fill="#ffd27a"/>`,
  ).join('')
  const frames = FRAMES.map(
    ([x, y, w, h, delay]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a1a10" stroke="#d1a65a" stroke-width="2.4"/>` +
      `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="#0d060b"/>` +
      `<rect class="mg-ph" style="animation-delay:${delay}s" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="#ffcf88"/>`,
  ).join('')
  const vase = (x: number, base: number) =>
    `<path d="M${x - 3} ${base - 14}l-3-10M${x + 3} ${base - 14}l3-13" stroke="${LEAF}" stroke-width="2"/>` +
    `<path d="${ring(x - 6, base - 25, 6.5)}${ring(x + 6, base - 28, 7)}${ring(x, base - 20, 5)}" fill="${DEEP}"/>` +
    `<path d="${ring(x - 6, base - 25, 3.6)}${ring(x + 6, base - 28, 3.8)}${ring(x, base - 20, 2.8)}" fill="${MARI}"/>` +
    `<path d="M${x - 8} ${base}l2-15h12l2 15Z" fill="${CLAY}"/>`
  const floorPetals = Array.from({ length: 12 }, () => petal(250 + next() * 180, 449 + next() * 6, 3 + next() * 2, next() * 3)).join('')
  const row = (d: string, offset: number) =>
    `<path d="${d}" stroke="${DEEP}" stroke-width="16" stroke-dashoffset="${offset}"/>` +
    `<path class="mg-arc" d="${d}" stroke="${MARI}" stroke-width="10" stroke-dashoffset="${offset}"/>` +
    `<path d="${d}" stroke="#ffd54f" stroke-width="3.5" stroke-dashoffset="${offset}"/>`
  const archSpots = Array.from({ length: 5 }, (_, i) => {
    const a = Math.PI * (0.9 - i * 0.14)

    return [327 + 75 * Math.cos(a), 150 - 125 * Math.sin(a)] as const
  })

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#0a0508',
      furniture: WOOD,
      metal: '#6d3f22',
      paper: '#f3e6cf',
      light: { idle: '#d98a3a', work: '#ffb74d', bright: '#ffe2a8' },
      headTop: 221,
      glowAt: [352, 282],
      device,
      wear: { front: CROWN },
      seatArt: SEAT,
      tableArt: TABLE,
    },
    style:
      // Ambient: the banners sway, candles flicker, petals drift down, the bridge shimmers, the city twinkles.
      '.mg-sw{transform-box:fill-box;transform-origin:50% 0;animation:mg-sw 3.8s ease-in-out infinite alternate}' +
      '.mg-pp path:nth-child(3n){animation-delay:-1.3s}.mg-pp path:nth-child(3n+1){animation-delay:-2.5s}' +
      '@keyframes mg-sw{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-run .mg-sw{animation-duration:2.2s}.st-tool .mg-sw{animation-duration:1.3s}' +
      '.mg-fla{transform-box:fill-box;transform-origin:50% 100%;animation:mg-fla 1.3s ease-in-out infinite alternate}.mg-f2{animation-duration:1.7s;animation-delay:-.6s}' +
      '@keyframes mg-fla{from{transform:scale(.88,.82);opacity:.8}to{transform:scale(1.04,1.08);opacity:1}}' +
      '.mg-flk{animation:mg-flk 1.1s ease-in-out infinite alternate}.mg-k2{animation-duration:1.5s;animation-delay:-.4s}.mg-k3{animation-duration:.9s;animation-delay:-.7s}' +
      '@keyframes mg-flk{from{opacity:.6}to{opacity:1}}' +
      '.mg-cg{animation:mg-cg 2.8s ease-in-out infinite alternate}@keyframes mg-cg{from{opacity:.55}to{opacity:1}}' +
      '.st-sleeping .mg-cg{animation-duration:7s}' +
      '.mg-dr{opacity:0;transform-box:fill-box;transform-origin:center;animation:mg-dr var(--t,13s) linear infinite}.mg-dr:nth-child(2n){animation-name:mg-dr2}' +
      '@keyframes mg-dr{0%{opacity:0;transform:translate(0,0) rotate(0)}12%,86%{opacity:1}50%{transform:translate(34px,150px) rotate(220deg)}100%{opacity:0;transform:translate(0,300px) rotate(440deg)}}' +
      '@keyframes mg-dr2{0%{opacity:0;transform:translate(0,0) rotate(0)}12%,86%{opacity:1}50%{transform:translate(-30px,140px) rotate(-200deg)}100%{opacity:0;transform:translate(6px,290px) rotate(-400deg)}}' +
      '.mg-shim{animation:mg-shim 4.6s ease-in-out infinite alternate}@keyframes mg-shim{from{opacity:.8}to{opacity:1}}' +
      '.mg-arc{animation:mg-shim 4s ease-in-out infinite alternate}.st-thinking .mg-arc,.st-run .mg-arc{animation-duration:1.4s}' +
      '.mg-tw{animation:mg-tw 4.2s ease-in-out infinite alternate}.mg-t2{animation-delay:-1.4s}.mg-t3{animation-delay:-2.8s}' +
      '@keyframes mg-tw{from{opacity:.2}to{opacity:1}}.st-thinking .mg-tw{animation-duration:1.5s}' +
      '.mg-bea{animation:mg-shim 2.6s ease-in-out infinite alternate}' +
      '@keyframes mg-in{from{opacity:0}to{opacity:1}}@keyframes mg-half{from{opacity:0}to{opacity:.45}}@keyframes mg-thin{to{opacity:.4}}' +
      // Thinking: spirit lights float up from the village toward the city.
      '.mg-orb{opacity:0}.st-thinking .mg-orb{animation:mg-orb 4.4s ease-in-out infinite}' +
      '@keyframes mg-orb{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}80%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-280px)}}' +
      // Petals flow up the bridge: a trickle while responding, two lanes for a tool, three and a blaze on a run.
      '.mg-lane{opacity:0;stroke-dasharray:1.5 16.5}@keyframes mg-flow{to{stroke-dashoffset:-180}}' +
      '.st-responding .mg-l2{animation:mg-flow 2.4s linear infinite,mg-half .8s ease-out both}' +
      '.st-tool .mg-l1,.st-tool .mg-l3{animation:mg-flow 1.5s linear infinite,mg-half .6s ease-out both}' +
      '.st-run .mg-lane{animation:mg-flow .9s linear infinite,mg-in .5s ease-out both}' +
      '.mg-hot{opacity:0}.st-run .mg-hot{animation:mg-up .7s ease-out both,mg-pulse 1.9s ease-in-out .7s infinite alternate}' +
      '.st-done .mg-hot{animation:mg-half 2s ease-out both}' +
      '@keyframes mg-up{from{opacity:0}to{opacity:.8}}@keyframes mg-pulse{from{opacity:.8}to{opacity:.5}}' +
      '.mg-rs{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .mg-rs{animation:mg-rs 1.8s ease-out infinite}' +
      '.mg-rs:nth-child(2n){animation-delay:.6s}.mg-rs:nth-child(3n){animation-delay:1.2s}' +
      '@keyframes mg-rs{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-170px) rotate(260deg)}}' +
      '.mg-trl{opacity:0;stroke-dasharray:2 16}.st-run .mg-trl{animation:mg-flow 1.1s linear infinite,mg-in .6s ease-out both}' +
      '.st-run .mg-flk{animation-duration:.7s}' +
      '.mg-fall{stroke-dasharray:1.5 10;animation:mg-fall 1.6s linear infinite}@keyframes mg-fall{to{stroke-dashoffset:-115}}.st-run .mg-fall{animation-duration:.8s}' +
      // Error: a gust races across, the bridge thins and its petals scatter, the banners whip, candles lean and dim.
      '.st-error .mg-br{animation:mg-thin 1.3s ease-out both}' +
      '.mg-sc{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .mg-sc{animation:mg-sc 3s cubic-bezier(.25,.6,.4,1) infinite}' +
      '.mg-sc:nth-child(3n){animation-delay:.18s}.mg-sc:nth-child(3n+1){animation-delay:.36s}.mg-sc:nth-child(4n){--r:-380deg}' +
      '@keyframes mg-sc{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}70%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r,420deg))}}' +
      '.mg-gust{opacity:0;stroke-dasharray:.4 1}.st-error .mg-gust{animation:mg-gust 1.6s ease-in-out infinite}' +
      '.mg-gust:nth-child(2n){animation-delay:.25s}.mg-gust:nth-child(3n){animation-delay:.5s}' +
      '@keyframes mg-gust{0%{opacity:0;stroke-dashoffset:.4}15%,80%{opacity:.7}100%{opacity:0;stroke-dashoffset:-1}}' +
      '.st-error .mg-sw{animation:mg-whip .45s ease-in-out infinite alternate}' +
      '@keyframes mg-whip{from{transform:rotate(-15deg) skewX(-10deg)}to{transform:rotate(9deg) skewX(6deg)}}' +
      '.st-error .mg-fla{animation:mg-lean .5s ease-in-out infinite alternate}' +
      '@keyframes mg-lean{from{transform:skewX(-26deg) scale(.8,.66);opacity:.5}to{transform:skewX(-12deg) scale(.9,.84);opacity:.72}}' +
      '.st-error .mg-cg,.st-error .mg-flk{animation:mg-thin 1s ease-out both}' +
      // Done: the city's windows bloom, a warm halo rises behind it and soft fireworks open over both cities.
      '.mg-bloom{opacity:0}.st-done .mg-bloom,.st-done .mg-tw{animation:mg-in 1.5s ease-out .15s both}' +
      '.mg-halo{opacity:0}.st-done .mg-halo{animation:mg-in 2.2s ease-out both}' +
      '.mg-fw{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .mg-fw{animation:mg-fw 3.4s ease-out infinite}' +
      '@keyframes mg-fw{0%,24%{opacity:0;transform:scale(.15)}32%{opacity:1}62%{opacity:.85;transform:scale(1)}88%,100%{opacity:0;transform:scale(1.08)}}' +
      '.mg-tr{opacity:0}.st-done .mg-tr{animation:mg-tr 3.4s ease-out infinite}' +
      '@keyframes mg-tr{0%{opacity:0;transform:translateY(150px)}5%,22%{opacity:.85}24%{transform:translateY(0)}28%,100%{opacity:0;transform:translateY(0)}}' +
      // Web: the tallest tower's beacon sends rings over the city. Read: the empty frames on the altar warm.
      '.mg-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .mg-ring{animation:mg-ring 1.8s ease-out infinite}' +
      '@keyframes mg-ring{0%{opacity:0;transform:scale(.4)}15%{opacity:.85}100%{opacity:0;transform:scale(3.4)}}' +
      '.mg-ph{opacity:0}.st-read .mg-ph{animation:mg-ph 1.1s ease-out both}@keyframes mg-ph{to{opacity:.6}}',
    scenery:
      '<defs>' +
      '<linearGradient id="mg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0510"/><stop offset=".55" stop-color="#150a1c"/>' +
      '<stop offset=".85" stop-color="#22102a"/><stop offset="1" stop-color="#2a1220"/></linearGradient>' +
      '<radialGradient id="mg-warm"><stop offset="0" stop-color="#ff8a1a" stop-opacity=".2"/><stop offset="1" stop-color="#ff8a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mg-spirit"><stop offset="0" stop-color="#8a3fd0" stop-opacity=".2"/><stop offset="1" stop-color="#8a3fd0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mg-halo"><stop offset="0" stop-color="#ffcf70" stop-opacity=".3"/><stop offset=".5" stop-color="#ffaa50" stop-opacity=".1"/>' +
      '<stop offset="1" stop-color="#ffaa50" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mg-mist"><stop offset="0" stop-color="#b46cff" stop-opacity=".26"/><stop offset="1" stop-color="#b46cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mg-gate"><stop offset="0" stop-color="#fff0c0" stop-opacity=".85"/><stop offset=".45" stop-color="#ffb74d" stop-opacity=".3"/>' +
      '<stop offset="1" stop-color="#ffb74d" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mg-deck" gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="0" y2="470"><stop offset="0" stop-color="#e85d00"/>' +
      '<stop offset=".5" stop-color="#ff9420"/><stop offset="1" stop-color="#ffc46a" stop-opacity=".8"/></linearGradient>' +
      '<linearGradient id="mg-hotg" gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="0" y2="470"><stop offset="0" stop-color="#ffc247"/>' +
      '<stop offset=".6" stop-color="#ffd978"/><stop offset="1" stop-color="#fff0c0" stop-opacity=".9"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#mg-sky)"/>' +
      '<circle cx="230" cy="880" r="540" fill="url(#mg-warm)"/><circle cx="190" cy="330" r="400" fill="url(#mg-spirit)"/>' +
      `<path d="${stars[0] ?? ''}" fill="#f4e6ff" fill-opacity=".3"/><path d="${stars[1] ?? ''}" fill="#f4e6ff" fill-opacity=".55"/>` +
      `<path class="mg-tw" d="${stars[2] ?? ''}" fill="#fff4dc" fill-opacity=".6"/>` +
      // Far towers adrift in the middle of the sky, faint.
      distant(620, 300, 0.9) +
      distant(950, 210, 0.7) +
      // The spirit city on the left: its done halo, the towers, the windows and the beacon on the tallest.
      '<circle class="mg-halo" cx="190" cy="300" r="380" fill="url(#mg-halo)"/>' +
      left.body +
      left.lit +
      left.bloom +
      `<path d="M${f(px)} ${f(py)}v-18" stroke="#4a3050" stroke-width="2.4"/><circle class="mg-bea" cx="${f(px)}" cy="${f(py - 21)}" r="3.6" fill="#7ff3e4"/>` +
      `<g fill="none" stroke="#7ff3e4" stroke-width="2.4">${[0, 0.6, 1.2]
        .map(d => `<circle class="mg-ring" style="animation-delay:${d}s" cx="${f(px)}" cy="${f(py - 21)}" r="13"/>`)
        .join('')}</g>` +
      // The hills and the village behind the bridge.
      '<g class="mv-b"><path d="M-20 905C140 860 300 885 460 858C640 828 800 872 980 850C1160 828 1320 866 1480 842C1560 832 1620 846 1640 842V1010H-20Z" fill="#110818"/>' +
      `<path d="${roofs}" fill="#170a16"/><path d="${windows}" fill="#ffb05a" fill-opacity=".28"/>` +
      '<rect x="-20" y="956" width="1660" height="60" fill="#0b0408"/>' +
      tones.map((tone, i) => `<path d="${walls[i] ?? ''}" fill="${tone}"/>`).join('') +
      `<path d="${parapets}" fill="#4a2034"/><path d="${lit}" fill="#ffb05a" fill-opacity=".6"/></g>` +
      // The mist the city floats on, and the gate at its foot where the bridge lands.
      '<ellipse cx="190" cy="500" rx="300" ry="80" fill="url(#mg-mist)"/>' +
      '<g fill="#2a1540"><ellipse cx="-10" cy="480" rx="110" ry="26"/><ellipse cx="130" cy="488" rx="125" ry="30"/><ellipse cx="290" cy="482" rx="120" ry="26"/>' +
      '<ellipse cx="420" cy="476" rx="70" ry="18"/></g>' +
      '<g fill="#4b2a6e" fill-opacity=".45"><ellipse cx="60" cy="464" rx="120" ry="12"/><ellipse cx="260" cy="468" rx="130" ry="12"/></g>' +
      `<path d="M265 480V440a35 35 0 0 1 70 0V480Z" fill="#4a1838" stroke="${GOLD}" stroke-opacity=".8" stroke-width="2.5"/>` +
      '<path d="M281 480V446a19 19 0 0 1 38 0V480Z" fill="#ffcf70" fill-opacity=".85"/>' +
      `<path d="M269 440a31 31 0 0 1 62 0" fill="none" stroke="${MARI}" stroke-width="7" stroke-dasharray="0 8.5" stroke-linecap="round"/>` +
      '<rect x="253" y="474" width="94" height="8" rx="2" fill="#ffb74d" fill-opacity=".55"/>' +
      // The bridge: its glow, its dark side with petals pouring off it, the petal deck and its rims, the railings.
      `<g fill="none" stroke="#ff8a00" stroke-linecap="round">${[110, 76, 44]
        .map(w => `<path d="${AXIS}" stroke-opacity=".035" stroke-width="${w}"/>`)
        .join('')}</g>` +
      `<path d="${face}" fill="#5c1a04"/>` +
      `<path class="mg-fall" d="${cascades()}" fill="none" stroke="${MARI}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` +
      `<g class="mg-br"><g class="mg-shim"><path d="${deck}" fill="url(#mg-deck)"/>` +
      `<path d="${texture[0] ?? ''}" fill="#b54400" fill-opacity=".55"/><path d="${texture[1] ?? ''}" fill="#ffe1a6" fill-opacity=".5"/></g>` +
      `<g fill="none"><path d="${bands()}" stroke="#b54400" stroke-opacity=".8" stroke-width="3"/>` +
      `<path d="${rims}" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.6"/>` +
      `<path d="${rims}" stroke="#fff0c8" stroke-opacity=".75" stroke-width="3.4" stroke-dasharray="0 11" stroke-linecap="round"/></g></g>` +
      `<path class="mg-hot" d="${deck}" fill="url(#mg-hotg)"/>` +
      `<g fill="none" stroke-linecap="round"><path d="${rails}" stroke="#4a1404" stroke-opacity=".8" stroke-width="6"/>` +
      `<path d="${rails}" stroke="${GOLD}" stroke-width="3"/><path d="${railR.rail}" stroke="#ffeec4" stroke-width="3.4"/></g>` +
      `<g fill="none" stroke="#fff6de" stroke-width="4" stroke-linecap="round">${lane(-0.22, 'mg-l1')}${lane(0, 'mg-l2')}${lane(0.22, 'mg-l3')}</g>` +
      // On a run the gate glows and petals fly up through it.
      '<ellipse class="mg-hot" cx="300" cy="462" rx="120" ry="56" fill="url(#mg-gate)"/>' +
      `<g fill="${GOLD}">${rising}</g>` +
      // Candles along the ground and the petal trail that leads from the altar to the bridge.
      `<g class="mv-b"><path d="${halos}" fill="#ff9f30" fill-opacity=".14"/><path d="${bodies}" fill="#e8d8bc" fill-opacity=".8"/>` +
      `<g fill="#ffd27a"><path class="mg-flk" d="${flames[0] ?? ''}"/><path class="mg-flk mg-k2" d="${flames[1] ?? ''}"/><path class="mg-flk mg-k3" d="${flames[2] ?? ''}"/></g>` +
      `<g fill="none" stroke-linecap="round"><path d="${trail}" stroke="${MARI}" stroke-opacity=".6" stroke-width="8" stroke-dasharray="0 10"/>` +
      `<path d="M1190 994C900 982 640 1004 160 992" stroke="${DEEP}" stroke-opacity=".5" stroke-width="6" stroke-dasharray="0 13"/>` +
      `<path class="mg-trl" d="${trail}" stroke="#fff0c8" stroke-width="4.5"/></g></g>` +
      // The papel picado.
      strand([-30, -2], [800, 38], [1630, -2], 21, 0) +
      strand([-30, 64], [200, 160], [430, 44], 6, 3) +
      // Drifting petals, the spirit orbs, the gust and the fireworks on the left.
      `<g fill="${MARI}" fill-opacity=".85">${drift(next, 6, [20, 80, 400, 560])}</g>` +
      `<g fill="${DEEP}" fill-opacity=".35">${drift(next, 3, [470, 90, 660, 480])}</g>` +
      `<g fill="#ffd9a0">${orbs}</g>` +
      `<g fill="${GOLD}">${torn(next, deckSpots, 6)}</g>` +
      gust([
        'M440 260C340 240 240 290 120 262S-10 250-40 262',
        'M440 410C330 392 250 432 130 410S0 400-40 410',
        'M450 560C350 540 260 600 140 570S0 560-40 575',
        'M430 760C330 740 230 790 110 770S0 760-40 770',
      ]) +
      `<g ${FIREWORK}>${burst(100, 620, 84, '#ffd54f', '#ff8fc8', -0.6)}${burst(64, 250, 76, '#7ff3e4', '#ffd54f', -0.2)}` +
      `${burst(362, 232, 52, '#ff8fc8', '#ffd54f', 1.1)}</g>` +
      // The far right: a second, fainter city, its banners, its fireworks and petals.
      `<g class="mv-r"><g class="mv-t"><circle cx="1480" cy="300" r="260" fill="url(#mg-spirit)"/><g opacity=".8">${right.body}${right.lit}${right.bloom}</g>` +
      '<g fill="#2a1540"><ellipse cx="1400" cy="428" rx="100" ry="20"/><ellipse cx="1550" cy="432" rx="110" ry="22"/></g>' +
      strand([1166, 50], [1400, 160], [1634, 56], 6, 1) +
      `<g ${FIREWORK}>${burst(1270, 468, 50, '#ffd54f', '#7ff3e4', -0.2)}${burst(1545, 452, 42, '#ff8fc8', '#ffd54f', 1.7)}</g>` +
      `<g fill="${MARI}" fill-opacity=".85">${drift(next, 4, [1200, 80, 380, 420])}</g>` +
      gust(['M1610 380C1500 362 1420 400 1300 384S1220 376 1190 382', 'M1610 620C1500 600 1420 640 1300 620S1220 610 1190 618']) +
      '</g></g>',
    nook:
      '<defs><radialGradient id="mg-cg"><stop offset="0" stop-color="#ffc061" stop-opacity=".55"/><stop offset="1" stop-color="#ffc061" stop-opacity="0"/></radialGradient></defs>' +
      // The altar's two shelves.
      '<path d="M236 456V204H432V456Z" fill="#220b1e"/><rect x="232" y="197" width="204" height="8" fill="#3c1732"/>' +
      hem(236, 205, 12, '#e8731c', '#220b1e') +
      '<path d="M270 197V129H382V197Z" fill="#2b0f2e"/><rect x="269" y="122" width="114" height="8" fill="#43183e"/>' +
      hem(270, 130, 7, '#d6336c', '#2b0f2e') +
      frames +
      vase(368, 122) +
      vase(372, 197) +
      // Plain round bread on a plate.
      '<ellipse cx="326" cy="197" rx="18" ry="3" fill="#d8c3a0" fill-opacity=".6"/><path d="M311 196Q312 178 326 177Q340 178 341 196Z" fill="#b5763d"/>' +
      `<path d="${ring(326, 176, 4)}" fill="#c98a4b"/><path d="M315 188Q326 181 337 188" fill="none" stroke="#e3a96a" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="${candleBodies}" fill="#efe2c6"/>` +
      candleLights +
      // The marigold arch.
      `<path d="${ARCH}" fill="none" stroke="#1d3016" stroke-width="28"/>` +
      `<g fill="none" stroke-linecap="round" stroke-dasharray="0 20"><path d="${ARCH}" stroke="#3f6e2a" stroke-width="9" stroke-dasharray="0 14" stroke-dashoffset="7"/>` +
      row(ARCH_OUT, 0) +
      row(ARCH_IN, 10) +
      '</g>' +
      // Petals and a pot of marigolds on the floor.
      `<path d="${floorPetals}" fill="${DEEP}" fill-opacity=".7"/>` +
      `<path d="M386 456l-5-28h42l-5 28Z" fill="${CLAY}"/><path d="M380 428h44" stroke="#b3582a" stroke-width="3"/>` +
      `<path d="${ring(390, 420, 7)}${ring(402, 413, 8)}${ring(414, 420, 7)}" fill="${DEEP}"/><path d="${ring(390, 420, 3.8)}${ring(402, 413, 4.4)}${ring(414, 420, 3.8)}" fill="${MARI}"/>`,
    front:
      `<g fill="${MARI}" fill-opacity=".85">${drift(next, 3, [8, -60, 40, 140])}${drift(next, 2, [384, -40, 30, 120])}</g>` +
      `<g fill="${GOLD}">${torn(next, archSpots, 5.5)}</g>`,
  }
}
