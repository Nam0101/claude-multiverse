import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Sky Temple: dusk turning to night over a sea of clouds. A thousand stone steps zigzag up a sheer peak to a red
// temple lit by lanterns, its great bronze bell hanging in the bright central bay; cranes cross the afterglow. Claude
// keeps the archive at a desk on a landing halfway up, in a monk's hood. When a command runs the striker swings, the
// bell rings and its sound ripples out across the clouds; an error snaps a lantern string and the lanterns tumble down
// the steps; done sends sky lanterns up from the temple into the night.

type Pt = readonly [number, number]

const GOLD = '#d8a24a'
const GOLD_DIM = '#9a6e34'
const PILLAR = '#9a2620'
const LACQUER = '#5a1614'
const TILE = '#1a0e11'
const WOOD = '#2e1a14'
const WOOD_EDGE = '#4a2c1e'
const PAPER = '#eadcc0'
const HOOD = '#5c4236'
const HOOD_DARK = '#33241d'
const TRIM = '#a8322a'
const CRIMSON = '#8a2a26'
const OCHRE = '#c8913e'

// The switchbacks up the main peak, from the clouds to the temple terrace; the lantern string hangs over S5..S6.
const S2: Pt = [400, 674]
const S3: Pt = [92, 592]
const S4: Pt = [386, 514]
const S5: Pt = [122, 444]
const S6: Pt = [318, 382]
const PEAK_STEPS: readonly Pt[] = [[300, 862], [72, 762], S2, S3, S4, S5, S6, [262, 348]]
/** The steps up the cliff behind the landing, in the desk box. */
const NOOK_STEPS: readonly Pt[] = [[452, 196], [176, 124], [430, 34], [200, -62], [420, -160], [262, -250], [452, -336]]
// The lantern string: a sagging rope from post to post above the top flight.
const ROPE: readonly [Pt, Pt, Pt] = [[126, 382], [220, 376], [314, 320]]

function pairs(points: readonly Pt[]): [Pt, Pt][] {
  const out: [Pt, Pt][] = []

  for (let i = 1; i < points.length; i += 1) {
    out.push([points[i - 1] as Pt, points[i] as Pt])
  }

  return out
}

const at = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const pt = (p: Pt): string => `${f(p[0])} ${f(p[1])}`

/** Flights of steps through the points: the stone strip, its shadowed edge and a sawtooth of treads. */
function steps(points: readonly Pt[], width: number, rise: number): string {
  let mass = ''
  let edge = ''
  let tread = ''

  for (const [a, b] of pairs(points)) {
    mass += `M${pt(a)}L${pt(b)}`
    edge += `M${f(a[0])} ${f(a[1] + width * 0.55)}L${f(b[0])} ${f(b[1] + width * 0.55)}`
    const n = Math.max(2, Math.round(Math.abs(b[1] - a[1]) / rise))
    tread += `M${f(a[0])} ${f(a[1] + width * 0.3)}` + `v${f((b[1] - a[1]) / n)}h${f((b[0] - a[0]) / n)}`.repeat(n)
  }

  return (
    `<g fill="none" stroke-linejoin="round"><path d="${edge}" stroke="#060304" stroke-width="3"/>` +
    `<path d="${mass}" stroke="#2c1e1c" stroke-width="${width}" stroke-linecap="round"/>` +
    `<path d="${tread}" stroke="#86624f" stroke-opacity=".8" stroke-width="1.3"/></g>`
  )
}

/**
 * Lanterns on posts along the flights, numbered `--i` from the top, from `first`: they flicker; while Claude writes a
 * wave of light climbs them, and when the bell rings each flares as its sound comes down to it.
 */
function lights(points: readonly Pt[], gap: number, r: number, lift: number, first: number, skip = -1): string {
  const spots: Pt[] = []

  pairs(points).forEach(([a, b], seg) => {
    if (seg === skip) {
      return
    }

    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / gap))

    for (let k = 0; k < n; k += 1) {
      const p = at(a, b, (k + 0.5) / n)
      spots.push([p[0], p[1] + lift])
    }
  })

  return spots
    .map(
      (p, i) =>
        `<circle class="tp-sl" style="--i:${first + spots.length - 1 - i}" cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="url(#tp-sl)"/>`,
    )
    .join('')
}

/** A red paper lantern hanging from its string at (0, 0), its body centred 14 below. */
function lantern(glow = true): string {
  return (
    (glow ? '<circle cy="14" r="26" fill="url(#tp-lg)"/>' : '') +
    `<path d="M0 0V4" stroke="${GOLD}" stroke-width="1.4"/><rect x="-5" y="3" width="10" height="2.6" fill="${GOLD}"/>` +
    '<ellipse cy="14" rx="9.5" ry="10" fill="url(#tp-rl)"/>' +
    `<path d="M0 4.6V23.4M-5 5.6Q-8 14 -5 22.4M5 5.6Q8 14 5 22.4" fill="none" stroke="${GOLD}" stroke-opacity=".4" stroke-width="1"/>` +
    `<rect x="-5" y="23" width="10" height="2.6" fill="${GOLD}"/><path d="M0 25.6V33" stroke="#c4302a" stroke-width="1.6"/>`
  )
}

/** The great bell in the central bay and the log that strikes it, each hung from its own pivot. */
function bell(): string {
  return (
    '<circle class="tp-bg" cx="230" cy="262" r="96" fill="url(#tp-bgl)"/>' +
    '<g transform="translate(230 212)"><g class="tp-bell">' +
    '<path d="M-3 0V12M3 0V12" stroke="#2a1a10" stroke-width="3"/><path d="M-7 12a7 6 0 0 1 14 0Z" fill="#3a2414"/>' +
    '<path d="M-18 16Q-18 10 0 10Q18 10 18 16L22 76Q24 86 32 90H-32Q-24 86 -22 76Z" fill="url(#tp-bz)"/>' +
    `<path d="M-19 26H19M-21 62H21" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2"/>` +
    `<path d="M-6 30V58M6 30V58" stroke="${GOLD_DIM}" stroke-opacity=".7" stroke-width="1.6"/>` +
    `<circle cy="72" r="6" fill="none" stroke="${GOLD}" stroke-opacity=".8" stroke-width="2"/>` +
    '<path d="M-32 89H32" stroke="#e8b860" stroke-opacity=".8" stroke-width="3"/></g></g>' +
    '<g transform="translate(172 214)"><g class="tp-log">' +
    '<path d="M-14 0V46M14 0V46" stroke="#8a6a44" stroke-width="1.6"/>' +
    '<rect x="-32" y="44" width="64" height="12" rx="6" fill="#4a2a18" stroke="#24120a"/>' +
    '<ellipse cx="31" cy="50" rx="3" ry="6" fill="#a87a4a"/></g></g>'
  )
}

/** The temple on the summit: terrace, the lit bell hall, two curved roofs with gold edges, lanterns at the eaves. */
function temple(): string {
  const lattice = (x: number) =>
    [224, 240, 256, 272, 288, 304].map(y => `M${x} ${y}h36`).join('') + `M${x + 12} 212v108M${x + 24} 212v108`
  const tiles = (x0: number, x1: number, y0: number, y1: number) => {
    let d = ''

    for (let x = x0; x <= x1; x += 8) {
      d += `M${x} ${y0}V${y1}`
    }

    return d
  }
  const posts = Array.from({ length: 13 }, (_, i) => `M${112 + i * 20} 312v10`).join('')
  const windows = Array.from({ length: 6 }, (_, i) => `M${166 + i * 22} 152h12v16h-12z`).join('')
  const eaves = ([[78, 184, -0.4], [382, 184, -1.6], [108, 130, -2.4], [352, 130, -0.9]] as const)
    .map(([x, y, d]) => `<g transform="translate(${x} ${y})"><g class="tp-sw" style="--d:${d}s">${lantern()}</g></g>`)
    .join('')

  return (
    '<circle class="tp-halo" cx="230" cy="236" r="320" fill="url(#tp-halo)"/>' +
    '<path d="M90 350L102 322H358L372 350Z" fill="#231716" stroke="#4a3430" stroke-width="1.5"/>' +
    `<path d="M106 312H354${posts}" stroke="#5a3e36" stroke-width="2.4" fill="none"/>` +
    '<ellipse cx="230" cy="332" rx="124" ry="9" fill="#ff9a4a" fill-opacity=".16"/>' +
    '<rect class="tp-win" x="122" y="210" width="216" height="112" fill="url(#tp-in)"/>' +
    `<path d="${lattice(134)}${lattice(290)}" stroke="#3a0e0c" stroke-width="2.2"/>` +
    `<path d="M122 208h12v114h-12zM170 208h12v114h-12zM278 208h12v114h-12zM326 208h12v114h-12z" fill="${PILLAR}"/>` +
    '<path d="M131 210v110M179 210v110M287 210v110M335 210v110" stroke="#d0583e" stroke-opacity=".45" stroke-width="2"/>' +
    `<rect x="110" y="200" width="240" height="11" fill="${LACQUER}"/>` +
    `<path d="M114 205.5H346" stroke="${GOLD}" stroke-opacity=".75" stroke-width="2" stroke-dasharray="6 6"/>` +
    bell() +
    `<path d="M74 178Q104 204 150 204H310Q356 204 386 178Q350 190 306 174H154Q110 190 74 178Z" fill="${TILE}"/>` +
    `<path d="${tiles(160, 300, 178, 200)}" stroke="#2e1b20" stroke-width="2"/>` +
    `<path d="M74 178Q104 204 150 204H310Q356 204 386 178" fill="none" stroke="${GOLD}" stroke-opacity=".85" stroke-width="2.4"/>` +
    `<rect x="156" y="146" width="148" height="30" fill="${LACQUER}"/>` +
    `<path class="tp-win" d="${windows}" fill="#ffb050" fill-opacity=".85"/>` +
    `<path d="M104 124Q132 152 172 152H288Q328 152 356 124Q326 136 290 118H170Q134 136 104 124Z" fill="${TILE}"/>` +
    `<path d="${tiles(176, 284, 122, 148)}" stroke="#2e1b20" stroke-width="2"/>` +
    `<path d="M104 124Q132 152 172 152H288Q328 152 356 124" fill="none" stroke="${GOLD}" stroke-opacity=".85" stroke-width="2.4"/>` +
    '<rect x="166" y="108" width="128" height="11" rx="2" fill="#24100f"/>' +
    `<path d="M168 110q-12 -2 -12 -16q8 4 14 -2M292 110q12 -2 12 -16q-8 4 -14 -2" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M226 108V88H234V108Z" fill="${GOLD}"/><circle cx="230" cy="82" r="6" fill="#ffd27a"/>` +
    eaves
  )
}

/** A pine clinging to a ledge, its flat pads reaching out from (0, 0). */
function pine(x: number, y: number, sx: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${sx * s} ${s})" fill="#0b0709">` +
    '<path d="M0 0Q-10 -4 -16 -14Q-22 -22 -34 -24" fill="none" stroke="#0b0709" stroke-width="3.4"/>' +
    '<ellipse cx="-34" cy="-26" rx="20" ry="5.5"/><ellipse cx="-20" cy="-34" rx="13" ry="4.5"/><ellipse cx="-12" cy="-16" rx="11" ry="4"/></g>'
  )
}

/** The main peak: a sheer pillar of rock, lit by the afterglow on its left, cracked, pines on its ledges. */
function peak(): string {
  const next = random(23)
  const left: Pt[] = [[-70, 1000], [-48, 900], [-30, 820], [-12, 742], [6, 668], [22, 600], [38, 534], [56, 474], [74, 420], [92, 374], [104, 350]]
  const right: Pt[] = [[384, 340], [394, 362], [402, 410], [410, 470], [420, 530], [432, 600], [446, 670], [462, 740], [482, 820], [506, 900], [540, 1000]]
  const rough = (p: Pt, i: number): Pt => (i === 0 || i === 10 ? p : [p[0] + (next() - 0.5) * 12, p[1]])
  const l = left.map(rough)
  const r = right.map(rough)
  const outline = [...l, [116, 338] as Pt, [180, 334] as Pt, [250, 333] as Pt, [330, 336] as Pt, ...r]
  let cracks = ''

  for (let k = 0; k < 9; k += 1) {
    let x = 60 + next() * 330
    let y = 400 + next() * 380

    cracks += `M${f(x)} ${f(y)}`
    for (let s = 0; s < 3; s += 1) {
      x += (next() - 0.5) * 18
      y += 30 + next() * 40
      cracks += `L${f(x)} ${f(y)}`
    }
  }

  return (
    `<path d="M${outline.map(pt).join('L')}Z" fill="url(#tp-pk)"/>` +
    `<path d="M${l.map(pt).join('L')}" fill="none" stroke="#e0704e" stroke-opacity=".38" stroke-width="2.5"/>` +
    `<path d="M${cracks}" fill="none" stroke="#050203" stroke-opacity=".75" stroke-width="2"/>` +
    pine(36, 536, 1, 1) +
    pine(72, 424, 1, 0.8) +
    pine(422, 532, -1, 0.9) +
    pine(446, 672, -1, 0.7)
  )
}

/** The lantern string over the top flight, and how each lantern tumbles down the switchbacks when it snaps. */
function lanternString(): { markup: string; keys: string } {
  const [a, c, b] = ROPE
  const stairY = (x: number) => S5[1] + ((x - S5[0]) / (S6[0] - S5[0])) * (S6[1] - S5[1])
  const onRope = (t: number): Pt => {
    const u = 1 - t

    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]
  }
  let markup =
    '<path d="M126 444V378M314 382V316" stroke="#2a1a12" stroke-width="4"/>' +
    `<path class="tp-rope" d="M${pt(a)}Q${pt(c)} ${pt(b)}" fill="none" stroke="#8a6a44" stroke-width="1.6"/>` +
    '<path class="tp-dang" d="M126 382q5 14 -1 30M314 320q-6 14 0 30" fill="none" stroke="#8a6a44" stroke-width="1.6"/>'
  let keys = ''

  ;[0.18, 0.34, 0.5, 0.66, 0.82].forEach((t, k) => {
    const hang = onRope(t)
    const start: Pt = [hang[0], hang[1] + 18]
    const land: Pt = [hang[0] + 3, stairY(hang[0] + 3) - 15]
    const route: Pt[] = [land, [S5[0] + 8, S5[1] - 15], [S4[0] - 8, S4[1] - 15], [S3[0] + 8, S3[1] - 15], at([S3[0], S3[1] - 15], [S2[0], S2[1] - 15], 0.5)]
    // Each roll down a flight hops once on the way; time follows the distance, the spin the direction.
    const legs: { p: Pt; d: number }[] = []

    for (const [p, q] of pairs(route)) {
      const mid = at(p, q, 0.5)
      legs.push({ p: [mid[0], mid[1] - 10], d: Math.hypot(q[0] - p[0], q[1] - p[1]) / 2 })
      legs.push({ p: q, d: Math.hypot(q[0] - p[0], q[1] - p[1]) / 2 })
    }

    const total = legs.reduce((sum, leg) => sum + leg.d, 0)
    const move = (p: Pt, turn: number) =>
      `transform:translate(${Math.round(p[0] - start[0])}px,${Math.round(p[1] - start[1])}px) rotate(${Math.round(turn)}deg)`
    let time = 16
    let turn = -30
    let prev = land
    let frames = `0%{transform:translate(0,0) rotate(0)}6%{transform:translate(0,0) rotate(16deg)}16%{${move(land, turn)}}`

    legs.forEach((leg, i) => {
      const last = i === legs.length - 1
      time = last ? 100 : time + (leg.d / total) * 84
      turn += Math.sign(leg.p[0] - prev[0]) * leg.d * 3.6
      prev = leg.p
      frames += `${Math.round(time)}%{${move(leg.p, turn)};opacity:${last ? 0 : 1}}`
    })

    keys += `@keyframes tp-f${k}{${frames}}.st-error .tp-f${k}{animation:tp-f${k} 3.4s linear ${f(k * 0.08)}s both}`
    markup +=
      `<g transform="translate(${pt(hang)})"><g class="tp-fall tp-f${k}">` +
      `<g class="tp-sw tp-rs" style="--d:${f(-k * 0.7)}s"><g transform="scale(1.3)">${lantern()}</g></g></g></g>`
  })

  return { markup, keys }
}

/** A crane flying left, centred on its body: far wing, legs, body, neck and head, near wing. */
function crane(delay: number): string {
  return (
    `<g class="tp-cb" style="--f:${delay}s">` +
    '<g class="tp-wg"><path d="M-5 -1C-3 -18 9 -30 26 -35C18 -23 12 -11 8 -1Z" fill="#bdb2ae"/><path d="M14 -22C18 -28 22 -32 26 -35C23 -27 19 -19 15 -13Z"/></g>' +
    '<path d="M11 1L36 4M11 2.4L35 6.4M-35 -7L-45 -5" stroke="#8a7e78" stroke-width="1.4"/>' +
    '<ellipse rx="13" ry="4.4" fill="#ece3dd"/><path d="M-10 -1Q-23 -10 -34 -7" fill="none" stroke="#ece3dd" stroke-width="2.8" stroke-linecap="round"/>' +
    '<circle cx="-35" cy="-8.2" r="1.4" fill="#d0402a"/>' +
    '<g class="tp-wg"><path d="M-2 -1C2 -14 14 -22 28 -24C20 -14 14 -7 10 -1Z" fill="#ece3dd"/><path d="M18 -18C22 -21 25 -23 28 -24C25 -18 22 -14 19 -10Z"/></g>' +
    '</g>'
  )
}

/** A band of cloud with a lumpy top that repeats every `period`, so it can drift one period without a seam. */
function cloudBand(seed: number, y: number, period: number, low: number, high: number): string {
  const next = random(seed)
  let one = ''
  let left = period

  // Whole-unit widths that add up to the period exactly, so the drift never shows a seam.
  while (left > 0) {
    const w = left < 190 ? left : 50 + Math.round(next() * 90)
    one += `a${w / 2} ${Math.round(low + next() * (high - low))} 0 0 1 ${w} 0`
    left -= w
  }

  // A short flat lead-in keeps the band's closing edge off the left of the picture.
  return `M${-period - 40} ${y}h40${one.repeat(Math.ceil(1600 / period) + 2)}`
}

/** Stars as one path of dots. */
function stars(seed: number, count: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const x = next() * 1600
    const y = next() ** 1.7 * 560
    const r = 0.8 + next() * 1.1

    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`
  }

  return d
}

// Invented marks for the scroll screen: short strokes in columns, never letters.
const MARKS = (() => {
  const next = random(9)
  let d = ''

  for (const x of [330, 342, 354, 366]) {
    for (let y = 239; y < 298; y += 9) {
      const k = Math.floor(next() * 5)
      d +=
        k === 0 ? `M${x} ${y}h7` : k === 1 ? `M${x + 3} ${y - 2}v6` : k === 2 ? `M${x} ${y - 2}h4v4` : k === 3 ? `M${x + 1} ${y + 2}l5 -5` : `M${x} ${y}h7M${x + 3} ${y}v4`
    }
  }

  return d
})()

/** The archivist's machine: a lit hanging scroll for a screen on a wooden stand, a slim keyboard, a hand bell. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 5 }, (_, i) => `<rect x="${251 + i * 12}" y="324" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<rect x="244" y="322" width="70" height="8" rx="2" fill="#3a2418" stroke="${GOLD_DIM}" stroke-opacity=".6"/>` +
    keys +
    '<path d="M318 330V224M384 330V224" stroke="#3a2418" stroke-width="4"/>' +
    '<rect x="322" y="230" width="58" height="80" fill="#1a0f0c"/>' +
    `<rect x="322" y="230" width="58" height="80" fill="${light}" fill-opacity=".8"/>` +
    `<path d="${MARKS}" fill="none" stroke="#2a1810" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"/>` +
    '<rect x="312" y="222" width="78" height="8" rx="4" fill="#5a3420"/>' +
    `<circle cx="312" cy="226" r="5" fill="${GOLD}"/><circle cx="390" cy="226" r="5" fill="${GOLD}"/>` +
    '<rect x="316" y="308" width="70" height="7" rx="3.5" fill="#5a3420"/>' +
    `<circle cx="316" cy="311.5" r="4" fill="${GOLD_DIM}"/><circle cx="386" cy="311.5" r="4" fill="${GOLD_DIM}"/>` +
    `<g transform="translate(398 228)"><g class="tp-mb"><path d="M0 0V6" stroke="${GOLD_DIM}" stroke-width="1.4"/>` +
    `<path d="M-5 16Q-5 6 0 6Q5 6 5 16Z" fill="${GOLD}"/><circle cy="17" r="1.6" fill="${GOLD}"/></g></g>`
  )
}

/** The cliff behind the landing with its own switchbacks, the landing, a lantern post with a hanging scroll. */
function nook(): string {
  const next = random(41)
  const edge: Pt[] = [[350, -470], [296, -420], [262, -350], [236, -280], [210, -200], [188, -120], [168, -40], [150, 40], [136, 120], [122, 200], [110, 280], [98, 360], [86, 456]]
  const rough = edge.map((p, i): Pt => (i === edge.length - 1 ? p : [p[0] + (next() - 0.5) * 14, p[1]]))
  const posts = Array.from({ length: 7 }, (_, i) => `M${-266 + i * 40} 404h9v42h-9z`).join('')
  const marks = [38, 54]
    .map(x => Array.from({ length: 12 }, (_, i) => (next() > 0.5 ? `M${x - 4} ${24 + i * 11}h8` : `M${x} ${21 + i * 11}v7`)).join(''))
    .join('')

  return (
    `<path d="M480 -500L${rough.map(pt).join('L')}L480 456Z" fill="url(#tp-nk)"/>` +
    `<path d="M${rough.map(pt).join('L')}" fill="none" stroke="#c0604a" stroke-opacity=".3" stroke-width="2.5"/>` +
    '<path d="M180 -150q60 8 130 -4t150 6M150 70q80 6 150 -6t170 4M240 -320q60 6 120 -2" fill="none" stroke="#050304" stroke-opacity=".6" stroke-width="2"/>' +
    steps(NOOK_STEPS, 14, 4.2) +
    lights(NOOK_STEPS, 80, 12, -13, 30) +
    // The landing and its balustrade.
    '<rect x="-300" y="446" width="780" height="26" fill="#1c1413"/><path d="M-300 446.5H480" stroke="#4a3430" stroke-width="2"/>' +
    '<path d="M-230 448v20M-140 448v20M-50 448v20M40 448v20M130 448v20" stroke="#0c0808" stroke-width="2"/>' +
    `<path d="${posts}" fill="#2a1e1d"/><rect x="-274" y="396" width="254" height="9" rx="2" fill="#352725"/>` +
    // The lantern post, its arm, the hanging scroll that unrolls to be read, and the red lantern.
    '<path d="M-4 446V-44H4V446Z" fill="#2a1a12"/><path d="M-78 -52Q-74 -44 -66 -44H130Q138 -44 142 -52V-36H-78Z" fill="#2a1a12"/>' +
    '<path d="M46 -36L18 -14M46 -36L74 -14" stroke="#8a6a44" stroke-width="1.4"/>' +
    `<g class="tp-scr"><rect x="20" y="-9" width="52" height="180" fill="#d8c8a6" fill-opacity=".82"/><rect x="20" y="-9" width="52" height="14" fill="${CRIMSON}"/>` +
    `<rect x="20" y="158" width="52" height="13" fill="${CRIMSON}"/><path d="${marks}" stroke="#2a1810" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/></g>` +
    '<rect x="12" y="-16" width="68" height="7" rx="3.5" fill="#5a3420"/>' +
    `<g class="tp-rod"><rect x="14" y="170" width="64" height="7" rx="3.5" fill="#5a3420"/><circle cx="14" cy="173.5" r="4" fill="${GOLD_DIM}"/><circle cx="78" cy="173.5" r="4" fill="${GOLD_DIM}"/></g>` +
    `<g transform="translate(112 -36)"><g class="tp-sw" style="--d:-1.3s"><path d="M0 0V16" stroke="#8a6a44" stroke-width="1.6"/>` +
    `<g transform="translate(0 16) scale(1.5)">${lantern()}</g></g></g>`
  )
}

export function skyTempleWorld(): World {
  const next = random(2049)
  const fall = lanternString()
  const clouds = [
    { y: 712, p: 620, lo: 18, hi: 38, fill: 'url(#tp-cf)', rim: '.07', secs: 130 },
    { y: 800, p: 780, lo: 26, hi: 52, fill: 'url(#tp-cf2)', rim: '.08', secs: 96 },
    { y: 902, p: 960, lo: 34, hi: 66, fill: 'url(#tp-cf3)', rim: '.09', secs: 74 },
  ].map((c, i) => {
    const d = cloudBand(11 + i, c.y, c.p, c.lo, c.hi)

    return {
      keys: `@keyframes tp-c${i}{to{transform:translateX(${c.p}px)}}`,
      markup:
        `<g style="animation:tp-c${i} ${c.secs}s linear infinite"><path d="${d}V1100H${-c.p - 40}Z" fill="${c.fill}" ` +
        `stroke="#e8b0aa" stroke-opacity="${c.rim}" stroke-width="2"/></g>`,
    }
  })
  const skyLanterns = Array.from({ length: 16 }, (_, i) => {
    const high = i < 10
    const x = high ? 116 + next() * 240 : 70 + next() * 320
    const y = high ? 280 + next() * 50 : 430 + next() * 230
    const s = 1.2 + next() * 0.9
    const dx = Math.round((-150 + next() * 380) / s)
    const dy = Math.round(-(y + 140 + next() * 160) / s)
    const style = `--dx:${dx}px;--dy:${dy}px;--t:${f(6.5 + next() * 4)}s;--l:${f(i * 0.07 + next() * 0.2)}s`

    return (
      `<g transform="translate(${Math.round(x)} ${Math.round(y)}) scale(${f(s)})"><g class="tp-sk" style="${style}">` +
      '<circle cy="-3" r="24" fill="url(#tp-lg)"/><path d="M-7 -13H7L9 6H-9Z" fill="#f29a48"/>' +
      '<path d="M-9 6H9" stroke="#ffe0a0" stroke-width="2.4"/></g></g>'
    )
  }).join('')
  const mist = [
    [210, 566, 190, 0],
    [300, 648, 230, -7],
    [150, 700, 260, -13],
  ]
    .map(([x, y, rx, d]) => `<ellipse class="tp-mi" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="${rx}" ry="13" fill="#d8c0c4" fill-opacity=".07"/>`)
    .join('')
  const wind = Array.from(
    { length: 7 },
    (_, i) => `<path class="tp-wnd" style="--d:${f(-i * 0.16)}s" d="M${Math.round(60 + next() * 320)} ${Math.round(380 + next() * 320)}h${Math.round(70 + next() * 80)}"/>`,
  ).join('')
  const rings = [0, 0.22, 0.44]
    .map(d => `<circle class="tp-ring" style="--d:${d}s" cx="230" cy="264" r="50" fill="none" stroke="#ffd27a" stroke-width="3" vector-effect="non-scaling-stroke"/>`)
    .join('')
  const ripples = [0, 0.35]
    .map(d => `<ellipse class="tp-rip" style="--d:${d}s" cx="240" cy="764" rx="70" ry="12" fill="none" stroke="#ffcf8a" stroke-width="2" vector-effect="non-scaling-stroke"/>`)
    .join('')
  const flockA = ([[720, 488, 0.9, 0], [770, 514, 0.78, -0.3], [814, 470, 0.7, -0.55]] as const)
    .map(([x, y, s, d]) => `<g transform="translate(${x} ${y}) scale(${s})">${crane(d)}</g>`)
    .join('')
  const flockB = ([[1720, 214, 0.72, -0.2], [1784, 248, 0.6, -0.5]] as const)
    .map(([x, y, s, d]) => `<g transform="translate(${x} ${y}) scale(${s})">${crane(d)}</g>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'tea',
      thought: 'smoke',
      ink: '#0a0606',
      furniture: WOOD,
      metal: '#4a2c1e',
      paper: PAPER,
      light: { idle: '#b8844a', work: '#ffbf6a', bright: '#ffe0a0' },
      headTop: 204,
      glowAt: [351, 270],
      device,
      wear: {
        // The hood's back falls behind the far side.
        behind: `<path d="M74 214Q40 236 42 304Q56 290 72 288Z" fill="${HOOD_DARK}"/>`,
        // A cowl: its crown above row 1, its sides outside the columns the eyes use, the mantle below row 5.
        front:
          `<path d="M52 312V256C50 232 60 212 84 188C108 192 180 194 222 212C238 222 246 240 246 258V312H216V258C204 252 180 250 150 250C120 250 96 252 90 258V312Z" fill="${HOOD}"/>` +
          `<path d="M50 306Q150 340 250 306V350H50Z" fill="${HOOD}"/>` +
          `<path d="M92 200C124 212 172 214 216 210M98 328q8 10 2 22M202 328q-8 10 -2 22" fill="none" stroke="${HOOD_DARK}" stroke-width="2.6"/>` +
          '<path d="M238 228C244 240 246 256 246 304" fill="none" stroke="#d8a070" stroke-opacity=".5" stroke-width="3"/>' +
          `<path d="M90 312V258C96 252 120 250 150 250C180 250 204 252 216 258V312M50 306Q150 340 250 306" fill="none" stroke="${TRIM}" stroke-width="2.6"/>`,
      },
      seatArt:
        '<path d="M112 362H190L196 456H106Z" fill="#2a201f" stroke="#4a3832" stroke-width="1.6"/>' +
        '<path d="M110 398H192M108 432H194" stroke="#171111" stroke-width="2.4"/>' +
        '<path d="M127 416q8 -8 16 0q8 -8 16 0q8 -8 16 0" fill="none" stroke="#4a3832" stroke-width="1.8"/>' +
        `<ellipse cx="151" cy="356" rx="47" ry="9" fill="${CRIMSON}" stroke="${OCHRE}" stroke-width="1.6"/>` +
        '<ellipse cx="151" cy="352" rx="36" ry="4" fill="#a8463a" fill-opacity=".55"/>',
      tableArt:
        `<path d="M158 321Q162 330 172 330H464Q474 330 478 321L480 333Q476 342 466 342H170Q160 342 156 333Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<path d="M182 342H454V352Q438 360 422 352H214Q198 360 182 352Z" fill="#24140f" stroke="${WOOD_EDGE}" stroke-width="1.4"/>` +
        `<path d="M184 350H198L196 456H186ZM438 350H452L450 456H440Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.4"/>` +
        '<rect x="196" y="424" width="244" height="6" fill="#24140f"/>' +
        `<path d="M226 349q10 -6 20 0q10 -6 20 0M370 349q10 -6 20 0q10 -6 20 0" fill="none" stroke="${GOLD_DIM}" stroke-width="1.6"/>` +
        // A basket of scrolls under the table and two more on its far end.
        '<path d="M300 420H386L380 456H306Z" fill="#3a2616" stroke="#5a3c22" stroke-width="1.4"/>' +
        '<path d="M302 432H384M304 444H382" stroke="#5a3c22" stroke-width="1.4"/>' +
        `<g fill="${PAPER}" fill-opacity=".85"><rect x="312" y="394" width="9" height="34" rx="4.5" transform="rotate(-14 316 411)"/>` +
        '<rect x="330" y="388" width="9" height="40" rx="4.5" transform="rotate(-4 334 408)"/><rect x="348" y="392" width="9" height="36" rx="4.5" transform="rotate(8 352 410)"/>' +
        '<rect x="364" y="398" width="9" height="30" rx="4.5" transform="rotate(16 368 413)"/></g>' +
        `<rect x="404" y="320" width="60" height="10" rx="5" fill="${PAPER}" fill-opacity=".88"/><rect x="410" y="311" width="50" height="9" rx="4.5" fill="#d2c09c"/>` +
        '<path d="M432 320v10M442 311v9" stroke="#a8261f" stroke-width="3"/>',
    },
    style:
      clouds.map(c => c.keys).join('') +
      fall.keys +
      '.tp-st{opacity:.5}.tp-st1{animation:tp-tw 3.4s ease-in-out infinite alternate}.tp-st2{animation:tp-tw 4.6s ease-in-out -1.7s infinite alternate}' +
      '.tp-st3{animation:tp-tw 2.8s ease-in-out -.9s infinite alternate}@keyframes tp-tw{from{opacity:.25}to{opacity:.85}}' +
      '.st-done .tp-st{animation:tp-up 2.4s ease-out both}@keyframes tp-up{from{opacity:.4}to{opacity:1}}' +
      // The stair lanterns: a candle flicker, a slow breath while thinking, a climbing wave while writing, a flare as the bell's sound passes.
      '.tp-sl{transform-box:fill-box;transform-origin:center;animation:tp-fl 2.6s ease-in-out calc(var(--i) * -.37s) infinite alternate}' +
      '@keyframes tp-fl{from{opacity:.7}to{opacity:1}}' +
      '.st-thinking .tp-sl{animation:tp-br 3.2s ease-in-out infinite alternate}@keyframes tp-br{from{opacity:.45}to{opacity:1}}' +
      '.st-responding .tp-sl{animation:tp-wv 2.2s ease-in-out calc(var(--i) * -.09s) infinite}@keyframes tp-wv{0%,100%{opacity:.5}50%{opacity:1}}' +
      '.st-run .tp-sl{animation:tp-pl 2.8s ease-out calc(.3s + var(--i) * .03s) infinite}' +
      '@keyframes tp-pl{0%{transform:scale(1);opacity:.8}10%{transform:scale(1.7);opacity:1}40%,100%{transform:scale(1);opacity:.8}}' +
      // Hanging lanterns sway; a tool brings a gust, an error a gale.
      '.tp-sw{animation:tp-sw 4.4s ease-in-out var(--d,0s) infinite alternate}@keyframes tp-sw{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.st-tool .tp-sw{animation:tp-sw2 1.3s ease-in-out var(--d,0s) infinite alternate}@keyframes tp-sw2{from{transform:rotate(-15deg)}to{transform:rotate(15deg)}}' +
      '.st-error .tp-sw{animation:tp-sw3 .9s ease-in-out infinite alternate}@keyframes tp-sw3{from{transform:rotate(-26deg)}to{transform:rotate(22deg)}}' +
      '.st-error .tp-rs{animation:none}' +
      '.tp-mb{animation:tp-sw 2.6s ease-in-out infinite alternate}.st-run .tp-mb,.st-tool .tp-mb{animation:tp-sw2 .5s ease-in-out infinite alternate}' +
      // The bell: the log is drawn back and swings in, the bell rocks, a glow and rings of sound go out, ripples cross the clouds.
      '.st-run .tp-log{animation:tp-log 2.8s ease-in-out infinite}' +
      '@keyframes tp-log{0%{transform:rotate(0)}15%{transform:rotate(18deg)}20%{transform:rotate(-6deg)}26%{transform:rotate(3deg)}36%{transform:rotate(-1deg)}46%,100%{transform:rotate(0)}}' +
      '.st-run .tp-bell{animation:tp-bell 2.8s ease-out infinite}' +
      '@keyframes tp-bell{0%,20%{transform:rotate(0)}25%{transform:rotate(-4deg)}33%{transform:rotate(3deg)}41%{transform:rotate(-2deg)}50%{transform:rotate(1.2deg)}60%{transform:rotate(-.6deg)}70%,100%{transform:rotate(0)}}' +
      '.tp-bg{opacity:0}.st-run .tp-bg{animation:tp-bg 2.8s ease-out infinite}@keyframes tp-bg{0%,17%{opacity:0}23%{opacity:.8}60%,100%{opacity:0}}' +
      '.tp-ring,.tp-rip{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .tp-ring{animation:tp-ring 2.8s ease-out var(--d) infinite}' +
      '@keyframes tp-ring{0%,20%{opacity:0;transform:scale(.5)}22%{opacity:.8;transform:scale(.7)}100%{opacity:0;transform:scale(8)}}' +
      '.st-run .tp-rip{animation:tp-rip 2.8s ease-out var(--d) infinite}' +
      '@keyframes tp-rip{0%,30%{opacity:0;transform:scale(.5)}36%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(10)}}' +
      '.st-run .tp-cq{animation:tp-cq 2.8s ease-out infinite}@keyframes tp-cq{0%,26%{transform:translateY(0)}32%{transform:translateY(5px)}42%{transform:translateY(-3px)}54%,100%{transform:translateY(0)}}' +
      // The temple's light: dimmed by the gale on an error, brighter when done.
      '.tp-halo,.tp-win{opacity:.85}.st-done .tp-halo,.st-done .tp-win{animation:tp-hal 2.6s ease-out both}@keyframes tp-hal{from{opacity:.85}to{opacity:1}}' +
      '.st-error .tp-halo{animation:tp-dim .8s ease-out both}@keyframes tp-dim{to{opacity:.5}}' +
      // The lantern string snaps.
      '.tp-fall{transform-box:fill-box;transform-origin:center}' +
      '.tp-dang{opacity:0}.st-error .tp-dang{animation:tp-in .3s ease-out .1s both}@keyframes tp-in{to{opacity:1}}' +
      '.st-error .tp-rope{animation:tp-out .25s ease-out .05s both}@keyframes tp-out{to{opacity:0}}' +
      // Sky lanterns rise from the temple.
      '.tp-sk{opacity:0}.st-done .tp-sk{animation:tp-rise var(--t) cubic-bezier(.25,.6,.45,1) var(--l) both}' +
      '@keyframes tp-rise{0%{opacity:0;transform:translate(0,0)}8%{opacity:.95}75%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // The hanging scroll unrolls to be read.
      '.tp-scr{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-read .tp-scr{animation:tp-unroll 1.2s ease-out both}' +
      '@keyframes tp-unroll{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      '.tp-rod{transform:translateY(-178px)}.st-read .tp-rod{animation:tp-rod 1.2s ease-out both}@keyframes tp-rod{from{transform:translateY(-178px)}to{transform:translateY(0)}}' +
      // Cranes, clouds and mist.
      '.tp-wg{transform-box:fill-box;transform-origin:50% 100%;animation:tp-wg .95s ease-in-out var(--f,0s) infinite alternate}@keyframes tp-wg{from{transform:scaleY(1)}to{transform:scaleY(-.55)}}' +
      '.tp-cb{animation:tp-cb 3.2s ease-in-out calc(var(--f,0s) * 2) infinite alternate}@keyframes tp-cb{to{transform:translateY(-6px)}}' +
      '.tp-crA{animation:tp-crA 36s linear -12s infinite}' +
      '@keyframes tp-crA{0%{opacity:0;transform:translateX(0)}26%{opacity:.8}90%{opacity:.8}100%{opacity:0;transform:translateX(-1100px)}}' +
      '.tp-crB{animation:tp-crB 28s linear -8s infinite}' +
      '@keyframes tp-crB{0%{opacity:0;transform:translateX(0)}12%{opacity:.7}70%{opacity:.6}90%{opacity:0}100%{opacity:0;transform:translateX(-640px)}}' +
      '.tp-msg{opacity:0}.st-web .tp-msg{animation:tp-msg 4.5s linear infinite}' +
      '@keyframes tp-msg{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}75%{opacity:.9}100%{opacity:0;transform:translate(-400px,-50px)}}' +
      '.tp-wnd{opacity:0}.st-tool .tp-wnd{animation:tp-wnd 1.1s linear var(--d) infinite}' +
      '@keyframes tp-wnd{0%{opacity:0;transform:translateX(140px)}25%{opacity:1}100%{opacity:0;transform:translateX(-240px)}}' +
      '.tp-mi{animation:tp-mi 20s ease-in-out infinite alternate}@keyframes tp-mi{from{transform:translateX(-30px)}to{transform:translateX(30px)}}',
    scenery:
      '<defs><linearGradient id="tp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05050e"/><stop offset=".35" stop-color="#0b0918"/>' +
      '<stop offset=".6" stop-color="#170c1a"/><stop offset=".78" stop-color="#2a1019"/><stop offset="1" stop-color="#2e0f14"/></linearGradient>' +
      '<radialGradient id="tp-dusk" gradientUnits="userSpaceOnUse" cx="140" cy="820" r="860"><stop offset="0" stop-color="#d0502e" stop-opacity=".34"/>' +
      '<stop offset=".35" stop-color="#a03224" stop-opacity=".15"/><stop offset=".7" stop-color="#601c22" stop-opacity=".05"/><stop offset="1" stop-color="#601c22" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tp-pk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a1a1a"/><stop offset=".45" stop-color="#170d10"/><stop offset="1" stop-color="#0b0608"/></linearGradient>' +
      '<linearGradient id="tp-nk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1418"/><stop offset=".3" stop-color="#140b0e"/><stop offset="1" stop-color="#090506"/></linearGradient>' +
      '<radialGradient id="tp-halo"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".3"/><stop offset=".5" stop-color="#e0502a" stop-opacity=".1"/><stop offset="1" stop-color="#e0502a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tp-in" cy=".55" r=".7"><stop offset="0" stop-color="#ffc070" stop-opacity=".95"/><stop offset=".55" stop-color="#e8702e" stop-opacity=".78"/><stop offset="1" stop-color="#7a1e12" stop-opacity=".9"/></radialGradient>' +
      '<radialGradient id="tp-sl"><stop offset="0" stop-color="#fff0c8"/><stop offset=".14" stop-color="#ffc060" stop-opacity=".95"/>' +
      '<stop offset=".32" stop-color="#ff9a40" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tp-rl" cx=".42" cy=".4"><stop offset="0" stop-color="#ff7a4a"/><stop offset="1" stop-color="#8e1a18"/></radialGradient>' +
      '<radialGradient id="tp-lg"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".45"/><stop offset=".5" stop-color="#e8502a" stop-opacity=".14"/><stop offset="1" stop-color="#e8502a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tp-bz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e130c"/><stop offset=".42" stop-color="#6a4420"/><stop offset=".55" stop-color="#8a5c2c"/><stop offset="1" stop-color="#1e130c"/></linearGradient>' +
      '<radialGradient id="tp-bgl"><stop offset="0" stop-color="#ffe6a0" stop-opacity=".8"/><stop offset=".45" stop-color="#ffb84a" stop-opacity=".3"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tp-moon"><stop offset="0" stop-color="#f0e0c8" stop-opacity=".18"/><stop offset="1" stop-color="#f0e0c8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tp-haze" gradientUnits="userSpaceOnUse" cx="200" cy="900" r="720"><stop offset="0" stop-color="#c0432b" stop-opacity=".16"/><stop offset="1" stop-color="#c0432b" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tp-cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e2433"/><stop offset=".3" stop-color="#24151f"/><stop offset="1" stop-color="#0f0910"/></linearGradient>' +
      '<linearGradient id="tp-cf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36212b"/><stop offset=".3" stop-color="#1d1118"/><stop offset="1" stop-color="#0b0709"/></linearGradient>' +
      '<linearGradient id="tp-cf3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e1b23"/><stop offset=".35" stop-color="#150c12"/><stop offset="1" stop-color="#090507"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#tp-sky)"/><rect width="1600" height="1000" fill="url(#tp-dusk)"/>' +
      `<g class="tp-st tp-st1"><path d="${stars(3, 16)}" fill="#f3e6d6"/></g>` +
      `<g class="tp-st tp-st2"><path d="${stars(4, 14)}" fill="#f3e6d6"/></g>` +
      `<g class="tp-st tp-st3"><path d="${stars(5, 12)}" fill="#e8d8f0"/></g>` +
      // A thin new moon high on the right.
      '<g class="mv-r"><g class="mv-t"><circle cx="1320" cy="120" r="110" fill="url(#tp-moon)"/>' +
      '<path d="M1320 86A34 34 0 0 0 1320 154A22 34 0 0 1 1320 86Z" fill="#f1e4cc" fill-opacity=".9"/></g></g>' +
      // Far peaks through the clouds, one with its own small shrine and steps.
      '<g class="mv-b"><g class="tp-cq">' +
      '<path d="M520 760L540 690L556 640L572 612L590 606L604 626L620 668L640 760ZM760 770L776 720L792 700L810 712L826 770Z' +
      'M940 760L962 680L980 618L1000 590L1030 586L1052 610L1070 660L1094 760ZM1180 780L1196 700L1214 660L1240 650L1262 690L1280 780Z" fill="#130b14"/>' +
      '<path d="M540 690L556 640L572 612M776 720L792 700M962 680L980 618L1000 590M1196 700L1214 660L1240 650" fill="none" stroke="#9a4438" stroke-opacity=".3" stroke-width="1.5"/>' +
      '<path d="M1002 588L1016 576L1030 588ZM1006 588h20v7h-20z" fill="#0a0609"/>' +
      '<g fill="#ffb45a" fill-opacity=".55"><circle cx="1016" cy="592" r="1.8"/><circle cx="1006" cy="612" r="1.3"/><circle cx="1032" cy="632" r="1.3"/><circle cx="1010" cy="652" r="1.3"/><circle cx="1036" cy="674" r="1.3"/></g>' +
      `${clouds[0]?.markup ?? ''}</g></g>` +
      // The peak, its steps, the lantern string, the temple, and what rises from it.
      '<g class="mv-t">' +
      peak() +
      steps(PEAK_STEPS, 10, 2.6) +
      lights(PEAK_STEPS, 56, 13, -10, 0, 5) +
      mist +
      fall.markup +
      `<g transform="translate(230 346) scale(1.12) translate(-230 -346)">${temple()}${rings}</g>` +
      `<g stroke="#ecdcd4" stroke-opacity=".24" stroke-width="1.6" stroke-linecap="round">${wind}</g>` +
      skyLanterns +
      '</g>' +
      `<g class="mv-b"><g class="tp-cq">${clouds[1]?.markup ?? ''}${clouds[2]?.markup ?? ''}${ripples}` +
      '<rect y="560" width="1600" height="440" fill="url(#tp-haze)"/></g></g>' +
      `<g class="tp-crA">${flockA}</g>` +
      `<g class="mv-r"><g class="mv-t"><g class="tp-crB">${flockB}</g></g></g>`,
    nook: nook(),
    front: `<g transform="translate(480 -230) scale(1.3)"><g class="tp-msg">${crane(0)}</g></g>`,
  }
}
