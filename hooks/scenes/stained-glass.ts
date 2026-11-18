import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Stained Glass: a dark nave built of coloured light. A giant rose window burns on the left wall and throws coloured
// beams down onto the stone floor; a glass tree grows under it with glass birds on its crown; a pair of tall lancets
// with flower medallions glows at the far right. Claude works at a glazier's bench below them: an arched leaded screen,
// lead strips, a soldering iron, a rack of sheet glass. A command lights the rose pane by pane and sets it turning; an
// error cracks one pane and drops its shards to the floor; done sweeps the window's coloured light across the floor.
const LEAD = '#08060d'
const INK = '#07050b'
const STONE = '#110c19'
const STONE_HI = '#2a2138'
const WOOD = '#2a1c24'
const WOOD_EDGE = '#46303c'
const METAL = '#2d2836'
const PAPER = '#e4dac8'
const RUBY = '#d8344f'
const SAPPHIRE = '#3a6ce8'
const EMERALD = '#25b07c'
const AMBER = '#ffb000'
const VIOLET = '#9a5ce6'
const TEAL = '#2fbac6'
const LIME = '#8cc63f'
const CREAM = '#fff1d0'

const at = (list: readonly string[], i: number): string => list[i % list.length] ?? LEAD

/** A point at radius `r`, `deg` degrees clockwise from the right, around (cx, cy). */
function pt(r: number, deg: number, cx = 0, cy = 0): string {
  const a = (deg * Math.PI) / 180

  return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`
}

/** Circles as one path, for dots and rings that never move apart. */
function dots(list: readonly (readonly [number, number, number])[]): string {
  return list.map(([x, y, r]) => `M${f(x + r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0Z`).join('')
}

/** An almond leaf or petal centred on (x, y), pointing along `deg`. */
function leaf(x: number, y: number, deg: number, len: number, w: number): string {
  const a = (deg * Math.PI) / 180
  const ux = (Math.cos(a) * len) / 2
  const uy = (Math.sin(a) * len) / 2
  const px = -Math.sin(a) * w
  const py = Math.cos(a) * w

  return `M${f(x - ux)} ${f(y - uy)}Q${f(x + px)} ${f(y + py)} ${f(x + ux)} ${f(y + uy)}Q${f(x - px)} ${f(y - py)} ${f(x - ux)} ${f(y - uy)}Z`
}

// The rose window, in its own coordinates around its centre.
const ROSE = [220, 290] as const
/** The outer petal pointing straight down: the pane an error knocks out. */
const BROKEN = 3
const petalA = (a: number): string =>
  `M${pt(42, a - 8)}L${pt(96, a - 12)}Q${pt(114, a - 10)} ${pt(121, a)}Q${pt(114, a + 10)} ${pt(96, a + 12)}L${pt(42, a + 8)}Z`
const petalB = (b: number): string =>
  `M${pt(116, b)}C${pt(126, b - 13)} ${pt(168, b - 13.5)} ${pt(186, b - 6)}Q${pt(193, b)} ${pt(186, b + 6)}C${pt(168, b + 13.5)} ${pt(126, b + 13)} ${pt(116, b)}Z`

function rose(): string {
  const glassA = [AMBER, RUBY]
  const glassB = [SAPPHIRE, VIOLET, EMERALD]
  const glassR = [RUBY, AMBER, TEAL, EMERALD, VIOLET, AMBER]
  const lead = `stroke="${LEAD}" stroke-width="3.5" stroke-linejoin="round"`
  let panes = ''
  let lit = ''
  let roundels = ''

  for (let i = 0; i < 12; i += 1) {
    const a = i * 30 + 15
    const b = i * 30
    const ca = at(glassA, i)
    const cb = at(glassB, i)

    panes += `<path d="${petalA(a)}" fill="${ca}" fill-opacity=".8"/>`
    panes +=
      i === BROKEN
        ? `<path d="${petalB(b)}" fill="#030207"/><path class="sg-out" d="${petalB(b)}" fill="${cb}" fill-opacity=".8"/>`
        : `<path d="${petalB(b)}" fill="${cb}" fill-opacity=".8"/>`
    lit += `<path class="sg-lit sg-la" style="--d:${f(0.1 + i * 0.2)}s" d="${petalA(a)}" fill="${mix(ca, CREAM, 0.3)}"/>`
    lit += `<path class="sg-lit sg-lb" style="--d:${f(0.2 + i * 0.2)}s" d="${petalB(b)}" fill="${mix(cb, CREAM, 0.3)}"/>`
  }

  for (let i = 0; i < 24; i += 1) {
    const a = (i * 15 * Math.PI) / 180

    roundels += `<circle class="sg-rd" style="--d:${f(i * 0.1)}s" cx="${f(201 * Math.cos(a))}" cy="${f(201 * Math.sin(a))}" r="11" fill="${at(glassR, i)}"/>`
  }

  const spandrels = dots(Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 + 15) * Math.PI) / 180

    return [172 * Math.cos(a), 172 * Math.sin(a), 7] as const
  }))
  const cusps = dots(Array.from({ length: 24 }, (_, i) => {
    const a = ((i * 15 + 7.5) * Math.PI) / 180

    return [217 * Math.cos(a), 217 * Math.sin(a), 8] as const
  }))
  const bosses = dots(Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30) * Math.PI) / 180

    return [231 * Math.cos(a), 231 * Math.sin(a), 4.5] as const
  }))
  const quarry =
    Array.from({ length: 24 }, (_, i) => `M${pt(36, i * 15)}L${pt(216, i * 15)}`).join('') + dots([[0, 0, 114], [0, 0, 156], [0, 0, 194]])
  const mullions = Array.from({ length: 12 }, (_, i) => `M${pt(36, i * 30)}L${pt(113, i * 30)}`).join('')
  const core = Array.from({ length: 6 }, (_, k) => `M${pt(8, k * 60)}Q${pt(21, k * 60 - 30)} ${pt(31, k * 60)}Q${pt(21, k * 60 + 30)} ${pt(8, k * 60)}Z`).join('')
  const cracks = [
    'M6 146L-12 130L-24 122',
    'M6 146L20 126L24 116',
    'M6 146L-18 160L-24 174',
    'M6 146L24 164',
    'M6 146L2 124L-6 116',
    'M6 146L10 172L6 184',
  ]
    .map((d, i) => `<path class="sg-ck" pathLength="1" style="--d:${f(0.1 + i * 0.06)}s" d="${d}"/>`)
    .join('')
  // The crack runs on into the two neighbouring outer panes, which stay cracked after the broken one falls.
  const spread = ['M52 130L66 127L82 135L96 141', 'M66 127L74 113L82 110', 'M82 135L88 152']
    .flatMap(d => [d, d.replace(/(\d+(?:\.\d+)?) /g, '-$1 ')])
    .map((d, i) => `<path class="sg-ck2" pathLength="1" style="--d:${f(0.3 + i * 0.05)}s" d="${d}"/>`)
    .join('')
  const ripples = [0.2, 0.9, 1.6].map(d => `<circle class="sg-rip" style="--d:${d}s" r="200" fill="none" stroke="#ffd47a" stroke-width="14"/>`).join('')

  return (
    `<g transform="translate(${ROSE[0]} ${ROSE[1]})"><g class="sg-jolt"><g class="sg-spin">` +
    '<circle r="216" fill="url(#sg-rb)"/>' +
    `<path d="${quarry}" fill="none" stroke="${LEAD}" stroke-width="2.5"/>` +
    `<g ${lead}>${panes}<path d="${spandrels}" fill="${TEAL}" fill-opacity=".75"/></g>` +
    `<g stroke="${LEAD}" stroke-width="3">${roundels}</g>` +
    `<circle r="36" fill="${AMBER}" fill-opacity=".85"/>` +
    `<g class="sg-core"><path d="${core}" fill="${RUBY}" fill-opacity=".9" stroke="${LEAD}" stroke-width="2"/><circle r="7" fill="${CREAM}" fill-opacity=".9"/></g>` +
    `<g ${lead}>${lit}</g>` +
    `<circle r="36" fill="none" stroke="${LEAD}" stroke-width="4"/>` +
    `<path d="${mullions}" stroke="#1c1528" stroke-width="6" stroke-linecap="round"/>` +
    '</g>' +
    `<g fill="none" stroke="#f6eefc" stroke-opacity=".95" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${cracks}${spread}</g>` +
    '</g>' +
    // Done: rings of light run out from the centre across the glass.
    ripples +
    // The stone ring stays still while the glass turns.
    `<circle r="231" fill="none" stroke="${STONE}" stroke-width="30"/>` +
    `<path d="${cusps}" fill="${STONE}"/><path d="${bosses}" fill="${STONE_HI}"/>` +
    `<circle r="246" fill="none" stroke="${STONE_HI}" stroke-width="2.5"/><circle r="216.5" fill="none" stroke="${STONE_HI}" stroke-width="1.6"/>` +
    // The rim fades where it meets the chat column.
    '<circle class="sg-rim" r="246" fill="none" stroke="url(#sg-rg)" stroke-width="5"/>' +
    '<circle class="sg-cg" r="84" fill="url(#sg-cg)"/>' +
    '<circle class="sg-flr" cx="6" cy="150" r="96" fill="url(#sg-cg)"/>' +
    `<g transform="translate(6 146)"><g class="sg-hit"><circle r="26" fill="${CREAM}" fill-opacity=".35"/><path d="M0 -20L4 -4L20 0L4 4L0 20L-4 4L-20 0L-4 -4Z" fill="#fff"/></g></g></g>`
  )
}

/** A pointed lancet between xl and xr, from the sill at 594 to its apex near 196; `inset` shrinks it all round. */
function lancet(xl: number, xr: number, inset = 0): string {
  const cx = (xl + xr) / 2
  const l = xl + inset
  const r = xr - inset
  const top = 196 + inset * 1.5
  const bottom = 594 - inset
  const spring = 300

  return (
    `M${f(l)} ${f(bottom)}V${spring}C${f(l)} ${f(spring - 46 + inset * 0.4)} ${f(cx - 30 + inset * 0.4)} ${f(top + 20)} ${f(cx)} ${f(top)}` +
    `C${f(cx + 30 - inset * 0.4)} ${f(top + 20)} ${f(r)} ${f(spring - 46 + inset * 0.4)} ${f(r)} ${spring}V${f(bottom)}Z`
  )
}

/** The far-right window: two lancets of blue quarry glass with flower medallions, an oculus over them. */
function lancets(): string {
  const pairs = [
    [1284, 1404, [RUBY, EMERALD, AMBER, VIOLET]],
    [1448, 1568, [AMBER, VIOLET, RUBY, EMERALD]],
  ] as const
  let lattice = ''

  for (let i = 0; i < 20; i += 1) {
    const x = 1250 + i * 28

    lattice += `M${x} 180L${x - 200} 660M${x - 200} 180L${x} 660`
  }

  let glass = ''
  let borders = ''
  let meds = ''
  let heads = ''

  for (const [xl, xr, colors] of pairs) {
    const cx = (xl + xr) / 2

    glass += lancet(xl, xr)
    borders += lancet(xl, xr, 9)
    heads += `<path d="${leaf(cx, 244, -90, 54, 20)}"/><path d="M${cx} 222V266" fill="none"/>`

    colors.forEach((color, k) => {
      const y = 540 - k * 78
      const flower = dots(Array.from({ length: 5 }, (_, p) => {
        const a = ((p * 72 - 90) * Math.PI) / 180

        return [cx + 13 * Math.cos(a), y + 13 * Math.sin(a), 8] as const
      }))

      meds +=
        `<circle cx="${cx}" cy="${y}" r="30" fill="${color}" fill-opacity=".8"/>` +
        `<path d="${flower}" fill="${mix(at(colors, k + 2), CREAM, 0.35)}" fill-opacity=".9" stroke-width="1.6"/>` +
        `<circle cx="${cx}" cy="${y}" r="5" fill="${AMBER}"/>` +
        `<circle class="sg-ml" style="--d:${f(k * 0.3 + (xl > 1400 ? 0.15 : 0))}s;--e:${f(1 + k * 0.25 + (xl > 1400 ? 0.12 : 0))}s" cx="${cx}" cy="${y}" r="30" fill="${CREAM}" stroke="none"/>`
    })
  }

  const daisy = Array.from({ length: 8 }, (_, k) => leaf(1426 + 24 * Math.cos((k * Math.PI) / 4), 122 + 24 * Math.sin((k * Math.PI) / 4), k * 45, 34, 12)).join('')

  return (
    '<circle class="sg-halo2" cx="1426" cy="380" r="330" fill="url(#sg-h2)"/>' +
    `<path d="M1262 612V262C1262 150 1340 72 1426 34C1512 72 1590 150 1590 262V612Z" fill="${STONE}" stroke="${STONE_HI}" stroke-width="2.5"/>` +
    `<path d="M1248 624V262C1248 140 1332 58 1426 18C1520 58 1604 140 1604 262V624" fill="none" stroke="${STONE_HI}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="${glass}" fill="url(#sg-lq)"/>` +
    `<path d="${lattice}" clip-path="url(#sg-lc)" fill="none" stroke="${LEAD}" stroke-width="2"/>` +
    // The border: solid ruby and amber panes, split by lead ticks; a tool sets them marching.
    `<path class="sg-bd" d="${borders}" fill="none" stroke="${RUBY}" stroke-opacity=".85" stroke-width="9" stroke-dasharray="22 22"/>` +
    `<path class="sg-bd2" d="${borders}" fill="none" stroke="${AMBER}" stroke-opacity=".8" stroke-width="9" stroke-dasharray="22 22" stroke-dashoffset="22"/>` +
    `<path class="sg-bd3" d="${borders}" fill="none" stroke="${LEAD}" stroke-width="11" stroke-dasharray="2.5 19.5" stroke-dashoffset="1.25"/>` +
    `<path d="${lancet(1284, 1404, 14) + lancet(1448, 1568, 14)}" fill="none" stroke="${LEAD}" stroke-width="2"/>` +
    `<g stroke="${LEAD}" stroke-width="3" fill="${EMERALD}" fill-opacity=".8">${heads}</g>` +
    `<g stroke="${LEAD}" stroke-width="3.5">${meds}</g>` +
    `<path d="${glass}" fill="none" stroke="${LEAD}" stroke-width="4"/>` +
    // The oculus: a daisy that turns very slowly.
    `<circle cx="1426" cy="122" r="48" fill="${SAPPHIRE}" fill-opacity=".75" stroke="${LEAD}" stroke-width="4"/>` +
    `<g transform="translate(1426 122)"><g class="sg-dz"><g transform="translate(-1426 -122)"><path d="${daisy}" fill="${AMBER}" fill-opacity=".85" stroke="${LEAD}" stroke-width="2.5"/></g></g></g>` +
    `<circle cx="1426" cy="122" r="9" fill="${RUBY}" stroke="${LEAD}" stroke-width="2.5"/>` +
    `<rect x="1252" y="594" width="348" height="14" fill="#1a1424"/><path d="M1252 594H1600" stroke="${STONE_HI}" stroke-width="2"/>`
  )
}

// Coloured shafts of light from the lower half of the rose down to the floor, with the pools they leave.
const BEAMS = [
  { c: RUBY, x0: 116, x1: 160, y0: 490, b0: 184, b1: 262 },
  { c: AMBER, x0: 168, x1: 210, y0: 504, b0: 270, b1: 338 },
  { c: SAPPHIRE, x0: 216, x1: 254, y0: 505, b0: 348, b1: 406 },
  { c: EMERALD, x0: 258, x1: 296, y0: 498, b0: 416, b1: 466 },
] as const

function beams(next: () => number): { defs: string; body: string } {
  const defs = BEAMS.map(
    (b, k) =>
      `<linearGradient id="sg-b${k}" gradientUnits="userSpaceOnUse" x1="0" y1="490" x2="0" y2="962">` +
      `<stop offset="0" stop-color="${b.c}" stop-opacity=".14"/><stop offset=".14" stop-color="${b.c}" stop-opacity=".3"/>` +
      `<stop offset=".6" stop-color="${b.c}" stop-opacity=".11"/><stop offset="1" stop-color="${b.c}" stop-opacity=".2"/></linearGradient>`,
  ).join('')
  const shafts = BEAMS.map((b, k) => `<path class="sg-k${k}" d="M${b.x0} ${b.y0}H${b.x1}L${b.b1} 962H${b.b0}Z" fill="url(#sg-b${k})"/>`).join('')
  const pools = BEAMS.map((b, k) => {
    const cx = (b.b0 + b.b1) / 2
    const rx = (b.b1 - b.b0) / 2 + 16

    return `<g class="sg-k${k}" fill="${b.c}"><ellipse cx="${cx}" cy="962" rx="${rx}" ry="13" fill-opacity=".22"/><ellipse cx="${cx}" cy="962" rx="${f(rx * 0.55)}" ry="6" fill-opacity=".32"/></g>`
  }).join('')
  const motes = Array.from({ length: 18 }, () => {
    const t = next()
    const y = 530 + t * 390
    const left = 116 + ((y - 492) / 470) * 60
    const right = 300 + ((y - 492) / 470) * 176
    const x = left + next() * (right - left)

    return `<circle class="sg-mote" style="--dx:${f((next() - 0.5) * 40)}px;--dy:${f(-20 - next() * 50)}px;--t:${f(6 + next() * 6)}s;--d:${f(-next() * 10)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.3 + next() * 1.4)}"/>`
  }).join('')

  return {
    defs,
    body:
      '<g class="sg-beams">' +
      '<path d="M116 492H300L476 962H176Z" fill="url(#sg-bh)"/>' +
      shafts +
      pools +
      `<g fill="#ffe9c0">${motes}</g></g>`,
  }
}

/** A glass bird facing right: a tail, a body, a head with a beak, and one wing (`wingCls` says how it moves). */
function bird(body: string, wing: string, wingPath: string, wingCls: string): string {
  return (
    `<g stroke="${LEAD}" stroke-width="2" stroke-linejoin="round">` +
    `<path d="M-14 0L-30 -8L-27 5Z" fill="${wing}" fill-opacity=".85"/>` +
    `<path d="M-16 0Q-6 -10 10 -6Q16 -4 18 2Q4 10 -16 0Z" fill="${body}" fill-opacity=".85"/>` +
    `<circle cx="14" cy="-6" r="6" fill="${body}" fill-opacity=".9"/><path d="M19 -8L27 -5L19 -3Z" fill="${AMBER}"/>` +
    `<path class="${wingCls}" d="${wingPath}" fill="${wing}" fill-opacity=".9"/></g>` +
    `<circle cx="15" cy="-7" r="1.4" fill="${LEAD}"/>`
  )
}

/** The sheet glass in the bench's rack: colour and height. */
const RACK = [
  [RUBY, 82],
  [AMBER, 62],
  [SAPPHIRE, 90],
  [EMERALD, 70],
  [VIOLET, 86],
  [TEAL, 58],
  [AMBER, 76],
] as const

const WING_UP = 'M-8 -3L4 -24L10 -4Z'
const WING_FOLDED = 'M-10 -3L8 -12L10 -2Z'

/** The glass tree under the rose: an amber trunk, lead branches and a crown of leaf panes. */
function tree(next: () => number): string {
  const cx = 128
  const cy = 698
  const colors = [EMERALD, LIME, TEAL, EMERALD, '#e0b030', LIME]
  let leaves = ''
  let n = 0

  for (const [r, count, len] of [
    [0, 1, 34],
    [38, 7, 36],
    [78, 12, 40],
    [116, 16, 42],
  ] as const) {
    for (let k = 0; k < count; k += 1) {
      const ang = (k / count) * 360 - 90 + (r === 78 ? 15 : 0)
      const norm = ((ang % 360) + 360) % 360

      // The trunk comes up through the bottom of the crown.
      if (r > 70 && norm > 56 && norm < 124) {
        continue
      }

      const a = (ang * Math.PI) / 180
      const twinkle = n % 3 === 0 ? ` class="sg-tw" style="--d:${f(-next() * 4)}s"` : ''

      leaves += `<path${twinkle} d="${leaf(cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.92, r === 0 ? -90 : ang, len, 30)}" fill="${at(colors, n)}" fill-opacity=".66"/>`
      n += 1
    }
  }

  return (
    `<circle cx="${cx}" cy="${cy}" r="175" fill="url(#sg-tg)"/>` +
    `<path d="M106 906L119 786H137L152 906Z" fill="#b8742c" fill-opacity=".62" stroke="${LEAD}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M110 862H148M114 822H143" stroke="${LEAD}" stroke-width="2.5"/>` +
    `<path d="M128 788L94 712M128 788L164 716M128 788V700M94 712L64 668M164 716L196 676M128 700L106 650M128 700L152 652" fill="none" stroke="${LEAD}" stroke-width="5" stroke-linecap="round"/>` +
    `<g stroke="${LEAD}" stroke-width="2.5" stroke-linejoin="round">${leaves}</g>` +
    `<path d="M70 906H190" stroke="${STONE_HI}" stroke-width="3" stroke-linecap="round"/>`
  )
}

/** The floor of the nave in perspective: stone flags running to the far end. */
function floor(): string {
  const left = (y: number) => 690 - (y - 640) * 2.833
  const right = (y: number) => 910 + (y - 640) * 2.833
  const across = [656, 680, 714, 762, 830, 924].map(y => `M${f(left(y))} ${y}H${f(right(y))}`).join('')
  const along = Array.from({ length: 19 }, (_, i) => {
    const x = -500 + i * 145

    return `M${f(800 + (x - 800) * 0.087)} 640L${x} 1060`
  }).join('')

  return (
    '<path d="M690 640H910L2100 1060H-500Z" fill="url(#sg-fl)"/>' +
    `<path d="${across}${along}" stroke="#1d1729" stroke-opacity=".85" stroke-width="1.5"/>` +
    `<path d="M690 640L-500 1060M910 640L2100 1060" stroke="${STONE_HI}" stroke-opacity=".6" stroke-width="2"/>`
  )
}

/** A clustered stone pillar from the floor to its capital, where the vault ribs spring. */
function pillar(x: number, foot: number): string {
  return (
    `<rect x="${x - 27}" y="232" width="54" height="${foot - 232}" fill="#0b0812"/>` +
    `<path d="M${x - 15} 252V${foot}M${x} 252V${foot}M${x + 15} 252V${foot}" stroke="#1c1628" stroke-width="2"/>` +
    `<path d="M${x - 35} 232H${x + 35}L${x + 27} 252H${x - 27}Z" fill="#161021" stroke="${STONE_HI}" stroke-width="1.5"/>` +
    `<rect x="${x - 33}" y="${foot - 18}" width="66" height="18" fill="#161021" stroke="${STONE_HI}" stroke-width="1.5"/>`
  )
}

/** The glazier's arched screen, lead strips, a few cut pieces and the soldering iron in its coil stand. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${251 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const hot = activity === 'tool' || activity === 'run'
  const wisps = hot
    ? [0, 0.7, 1.4].map((d, i) => `<circle class="sg-wisp" style="--d:${d}s;--dx:${(i - 1) * 9}px" cx="380" cy="314" r="4" fill="#cfc4dc" fill-opacity=".5"/>`).join('')
    : ''

  return (
    // The lead strips, laid out ready on the bench.
    `<path d="M174 321H236M172 325H232M176 328.5H240" stroke="#6a6474" stroke-width="2"/><path d="M174 321H236" stroke="#9a94a6" stroke-opacity=".6" stroke-width=".8"/>` +
    // The screen: a leaded lancet on a little stand, its panes lit by the light.
    `<path d="M324 330L332 316H348L356 330Z" fill="${METAL}"/>` +
    `<path d="M292 320V262C292 238 314 218 340 205C366 218 388 238 388 262V320Z" fill="#0c0a12" stroke="${METAL}" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="M299 316V264C299 245 318 229 340 216C362 229 381 245 381 264V316Z" fill="${light}" fill-opacity=".72"/>` +
    `<rect x="299" y="264" width="41" height="28" fill="${SAPPHIRE}" fill-opacity=".3"/><rect x="340" y="292" width="41" height="24" fill="${RUBY}" fill-opacity=".26"/>` +
    `<rect x="299" y="292" width="41" height="24" fill="${EMERALD}" fill-opacity=".22"/>` +
    `<path d="M304 272H330M304 280H324M346 272H374M346 280H364M304 300H332M346 300H370M304 308H320M346 308H360" stroke="${INK}" stroke-opacity=".55" stroke-width="2.5"/>` +
    `<path d="M340 216V316M299 264H381M299 292H381" stroke="${LEAD}" stroke-width="3"/>` +
    `<circle cx="340" cy="242" r="9" fill="${AMBER}" fill-opacity=".75" stroke="${LEAD}" stroke-width="3"/>` +
    // The keyboard, in front of the screen's foot.
    `<rect x="246" y="322" width="84" height="8" rx="2" fill="${METAL}"/>` +
    keys +
    // Two cut pieces waiting.
    `<g stroke="${LEAD}" stroke-width="1.5" stroke-linejoin="round"><path d="M357 330L365 319L374 330Z" fill="${RUBY}" fill-opacity=".75"/><path d="M367 330L373 323L379 330Z" fill="${TEAL}" fill-opacity=".75"/></g>` +
    // The soldering iron in its coil, its tip hot; it ends by x 408, inside the picture's right edge.
    `<rect x="376" y="325" width="30" height="5" rx="2" fill="${METAL}"/>` +
    `<path d="M386 324L392 317L389 313L396 308L393 304L400 299L397 295L404 290" fill="none" stroke="#5a5466" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M381 320L394 304" stroke="#8a8494" stroke-width="3" stroke-linecap="round"/><path d="M394 304L404 291" stroke="#3a2a20" stroke-width="7" stroke-linecap="round"/>` +
    `<g class="sg-tip"><circle cx="380" cy="321" r="11" fill="${AMBER}" fill-opacity=".12"/><circle cx="380" cy="321" r="6" fill="${AMBER}" fill-opacity=".3"/></g>` +
    `<circle cx="380" cy="321" r="2.6" fill="#ffd98a"/>` +
    wisps
  )
}

export function stainedGlassWorld(): World {
  const next = random(1248)
  const light = beams(next)
  const flock = (
    [
      [1700, 132, 1.1, SAPPHIRE, AMBER],
      [1790, 186, 0.9, RUBY, TEAL],
      [1880, 110, 1, EMERALD, AMBER],
      [1990, 214, 0.8, VIOLET, LIME],
      [2080, 152, 0.95, TEAL, RUBY],
    ] as const
  )
    .map(
      ([x, y, s, body, wing], i) =>
        `<g transform="translate(${x} ${y}) scale(${f(-s * 1.7)} ${f(s * 1.7)})"><g class="sg-fly" style="animation-delay:${f(-i * 0.15)}s"><g class="sg-flap" style="animation-delay:${f(-i * 0.13)}s">${bird(body, wing, WING_UP, 'sg-wing')}</g></g></g>`,
    )
    .join('')
  const perched = (
    [
      [92, 556, 1, -260, -640, SAPPHIRE, AMBER],
      [170, 562, -1, -120, -720, RUBY, TEAL],
    ] as const
  )
    .map(
      ([x, y, dir, ax, ay, body, wing], i) =>
        `<g transform="translate(${x} ${y}) scale(${dir * 1.4} 1.4)"><g class="sg-perch" style="--ax:${ax * dir}px;--ay:${ay}px;animation-delay:${f(0.3 + i * 0.25)}s">` +
        `<g class="sg-bob" style="animation-delay:${f(-i * 1.3)}s">${bird(body, wing, WING_FOLDED, 'sg-wing2')}</g></g></g>`,
    )
    .join('')
  const sweepColors = [RUBY, AMBER, SAPPHIRE, EMERALD, VIOLET, TEAL]
  const sweep = Array.from({ length: 12 }, (_, k) => `<path d="M0 0L${pt(214, k * 30)}A214 214 0 0 1 ${pt(214, k * 30 + 30)}Z" fill="${at(sweepColors, k)}"/>`).join('')
  // Error: the broken pane falls out as 13 big shards that tumble to the floor around the tree's foot.
  const chip = random(77)
  const shardMarkup = Array.from({ length: 13 }, (_, i) => {
    const size = 40 + chip() * 26
    const ox = (chip() - 0.5) * 60
    const oy = (chip() - 0.5) * 50
    const a0 = chip() * 360
    const d =
      'M' +
      [0, 1, 2].map(k => pt(size * (0.42 + chip() * 0.16), a0 + k * 120 + (chip() - 0.5) * 40, ox, oy)).join('L') +
      'Z'
    // Spread order is shuffled against the stagger so the shards fall as a burst, not a line.
    const dx = (((i * 5) % 13) / 12 - 0.5) * 230 + (chip() - 0.5) * 30
    const dy = 400 + chip() * 50
    const r = (chip() > 0.5 ? 1 : -1) * (160 + chip() * 180)
    const fill = i % 3 === 2 ? mix(SAPPHIRE, CREAM, 0.3) : SAPPHIRE

    return `<path class="sg-sh" style="--dx:${f(dx)}px;--dy:${f(dy)}px;--r:${f(r)}deg;animation-delay:${f(i * 0.035)}s" d="${d}" fill="${fill}" fill-opacity=".85"/>`
  }).join('')
  const catcher = Array.from({ length: 8 }, (_, k) => `<path d="M0 0L${pt(24, k * 45)}A24 24 0 0 1 ${pt(24, k * 45 + 45)}Z" fill="${k % 2 ? RUBY : AMBER}" fill-opacity=".7"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: INK,
      furniture: WOOD,
      metal: METAL,
      paper: PAPER,
      light: { idle: '#c8963a', work: AMBER, bright: '#ffd98a' },
      headTop: 220,
      glowAt: [340, 266],
      device,
      wear: {
        // A glazier's leather cap with a flip-up loupe; the cap's band ends at 252, above the eyes.
        front:
          '<path d="M70 252C70 226 104 210 150 210C192 210 222 222 230 242L256 246V252Z" fill="#3a2433" stroke="#57394b" stroke-width="2" stroke-linejoin="round"/>' +
          `<path d="M72 245H230" stroke="${AMBER}" stroke-opacity=".8" stroke-width="4"/>` +
          `<path d="M124 220L132 228L124 236L116 228Z" fill="${RUBY}" stroke="${LEAD}" stroke-width="1.5"/>` +
          `<path d="M230 243L238 228" stroke="${METAL}" stroke-width="3"/>` +
          `<circle cx="241" cy="221" r="9" fill="${AMBER}" fill-opacity=".5" stroke="#1a1520" stroke-width="3"/>` +
          '<path d="M237 217Q241 214 245 217" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>',
      },
      seatArt:
        // A carved stool: three pointed arches cut in its apron.
        `<path d="M114 376L108 456M188 376L194 456" stroke="${WOOD}" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M112 420H190" stroke="${WOOD_EDGE}" stroke-width="4"/>` +
        `<rect x="104" y="348" width="94" height="10" rx="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M110 358H192V378H110Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        '<path d="M120 378V370Q126 361 132 370V378ZM145 378V370Q151 361 157 370V378ZM170 378V370Q176 361 182 370V378Z" fill="#0c0810"/>',
      tableArt:
        // The glazier's bench, with a rack of sheet glass standing in it.
        `<rect x="166" y="330" width="304" height="14" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M170 333.5H466" stroke="#5a3e4a" stroke-opacity=".6" stroke-width="1.5"/>' +
        `<rect x="178" y="344" width="14" height="112" fill="${WOOD}"/><rect x="446" y="344" width="14" height="112" fill="${WOOD}"/>` +
        // Sheets of glass leaning on the back rail, overlapping, with diagonal glare.
        `<path d="M192 378H446" stroke="${WOOD_EDGE}" stroke-width="4"/>` +
        `<g stroke-width="1.5" stroke-linejoin="round">${RACK.map(([c, h], i) => {
          const x = 206 + i * 31

          return `<path d="M${x} 452L${x + 16} ${452 - h}H${x + 50}L${x + 34} 452Z" fill="${c}" fill-opacity=".5" stroke="${mix(c, CREAM, 0.45)}" stroke-opacity=".6"/>`
        }).join('')}</g>` +
        `<path d="${RACK.map(([, h], i) => {
          const x = 206 + i * 31

          return `M${f(x + 9)} ${f(452 - h * 0.28)}L${f(x + 36)} ${f(452 - h * 0.62)}M${f(x + 18)} ${f(452 - h * 0.7)}L${f(x + 34)} ${f(452 - h * 0.86)}`
        }).join('')}" stroke="#fff" stroke-opacity=".3" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M192 452H446" stroke="${WOOD_EDGE}" stroke-width="5"/>`,
    },
    style:
      // The rose: its glow breathes; a command lights it pane by pane and sets it turning.
      '.sg-halo{opacity:.75;animation:sg-br 7s ease-in-out infinite alternate}.sg-halo2{opacity:.8;animation:sg-br 9s ease-in-out -3s infinite alternate}' +
      '@keyframes sg-br{from{opacity:.62}to{opacity:.9}}' +
      '.sg-halo{transform-box:fill-box;transform-origin:center}.st-run .sg-halo{animation:sg-up 2.8s ease-in-out both}@keyframes sg-up{from{opacity:.75}to{opacity:1;transform:scale(1.1)}}' +
      '.sg-rim{opacity:0}.st-run .sg-rim{animation:sg-rim 2.6s ease-in .2s both}@keyframes sg-rim{to{opacity:.7}}' +
      '.sg-hit{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .sg-hit{animation:sg-hit .7s ease-out .05s both}' +
      '@keyframes sg-hit{0%{opacity:0;transform:scale(.3)}25%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}' +
      '.st-run .sg-spin{animation:mv-spin 28s linear infinite}' +
      '.sg-lit{opacity:0}.st-run .sg-lit{animation:sg-lit .5s ease-out var(--d) both}@keyframes sg-lit{to{opacity:.72}}' +
      // Done lights the rose from the inside out: the inner panes, then the outer, then the roundels, while rings of
      // light run outwards across the glass.
      '.st-done .sg-la{animation:sg-wave 1.8s ease-out .2s both}.st-done .sg-lb{animation:sg-wave 1.8s ease-out .65s both}' +
      '@keyframes sg-wave{0%{opacity:0}35%{opacity:.62}100%{opacity:.3}}' +
      '.sg-rip{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .sg-rip{animation:sg-rip 2.1s ease-out var(--d) infinite both}' +
      '@keyframes sg-rip{0%{opacity:0;transform:scale(.18)}25%{opacity:.6}100%{opacity:0;transform:scale(1)}}' +
      '.sg-rd{opacity:.8}.st-read .sg-rd{transform-box:fill-box;transform-origin:center;animation:sg-rd 2.4s ease-in-out var(--d) infinite}' +
      '@keyframes sg-rd{0%,40%,100%{opacity:.8;transform:scale(1)}20%{opacity:1;transform:scale(1.25)}}' +
      '.st-run .sg-rd{animation:sg-on .8s ease-out 2.5s both}.st-done .sg-rd{animation:sg-on 1.2s ease-out 1s both}@keyframes sg-on{to{opacity:1}}' +
      '.st-thinking .sg-core{animation:mv-spin 9s linear infinite}' +
      '.sg-cg{opacity:0}.st-thinking .sg-cg{animation:sg-cg 3.2s ease-in-out infinite alternate}@keyframes sg-cg{from{opacity:.25}to{opacity:.9}}' +
      '.st-run .sg-cg{animation:sg-on 2.2s ease-in .4s both}' +
      // Error: one pane cracks, the rose jolts, the pane falls out in shards and its beam goes dark.
      '.sg-ck,.sg-ck2{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}' +
      '.st-error .sg-ck{animation:sg-ck .45s ease-out var(--d) both,sg-gone .15s linear .74s forwards}.st-error .sg-ck2{animation:sg-ck .5s ease-out var(--d) both}' +
      // The rest of the rose dims for a moment; a soft flare blooms where the pane falls out.
      '.st-error .sg-spin{animation:sg-dr 2.6s ease-in-out .75s both}@keyframes sg-dr{0%{opacity:1}18%,55%{opacity:.6}100%{opacity:.85}}' +
      '.sg-flr{opacity:0}.st-error .sg-flr{animation:sg-flr 1.3s ease-out .72s both}@keyframes sg-flr{0%{opacity:0}16%{opacity:.35}100%{opacity:0}}' +
      '@keyframes sg-ck{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.st-error .sg-out{animation:sg-gone .15s linear .74s both}@keyframes sg-gone{to{opacity:0}}' +
      '.st-error .sg-jolt{animation:sg-jolt .5s ease-out .7s}@keyframes sg-jolt{0%,100%{transform:translate(0,0)}25%{transform:translate(-4px,2px)}60%{transform:translate(3px,-1px)}}' +
      '.sg-sh{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .sg-sh{animation:sg-sh 2.6s both}' +
      '@keyframes sg-sh{0%,28%{opacity:0;transform:translate(0,0) rotate(0);animation-timing-function:cubic-bezier(.45,0,.9,.6)}30%{opacity:1}' +
      '72%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(var(--r));animation-timing-function:ease-out}' +
      '80%{transform:translate(calc(var(--dx) * 1.1),calc(var(--dy) - 14px)) rotate(var(--r))}88%,100%{opacity:.7;transform:translate(calc(var(--dx) * 1.15),var(--dy)) rotate(var(--r))}}' +
      '.st-error .sg-k2{animation:sg-dim 1s ease-out .8s both}@keyframes sg-dim{to{opacity:.12}}' +
      '.st-error .sg-halo{animation:sg-dim2 1.2s ease-out .8s both}@keyframes sg-dim2{to{opacity:.5}}' +
      // The beams and the dust in them.
      '.sg-beams{animation:sg-bm 9s ease-in-out infinite alternate}@keyframes sg-bm{from{opacity:.72}to{opacity:.95}}' +
      '.st-run .sg-beams{animation:sg-bup 2.6s ease-out both}@keyframes sg-bup{from{opacity:.8}to{opacity:1}}' +
      '.st-done .sg-beams{transform-origin:220px 500px;animation:sg-swing 4.2s ease-in-out both}' +
      '@keyframes sg-swing{0%{transform:skewX(0)}45%{transform:skewX(13deg)}100%{transform:skewX(-4deg)}}' +
      '.sg-mote{animation:sg-mote var(--t) ease-in-out var(--d) infinite alternate}' +
      '@keyframes sg-mote{from{transform:translate(0,0);opacity:.15}to{transform:translate(var(--dx),var(--dy));opacity:.75}}' +
      '.st-thinking .sg-mote{animation-duration:16s}' +
      // Done: the window's light spreads across the floor as a turning wheel, kept in the left strip.
      '.sg-sweep{opacity:0}.st-done .sg-sweep{animation:sg-sw 4.2s ease-out .2s both}' +
      '@keyframes sg-sw{0%{opacity:0;transform:scale(.1)}16%{opacity:1}52%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(1.04)}}' +
      '.st-done .sg-swr{animation:mv-spin 6s linear infinite}' +
      // The lancets: medallions glow in turn while Claude answers, light up after the rose on a command.
      '.sg-ml{opacity:0}.st-responding .sg-ml{animation:sg-ml 2.4s ease-in-out var(--d) infinite}@keyframes sg-ml{0%,100%{opacity:0}40%{opacity:.32}}' +
      '.st-run .sg-ml{animation:sg-mlon .6s ease-out var(--e) both}.st-done .sg-ml{animation:sg-mlon 1.4s ease-out .4s both}@keyframes sg-mlon{to{opacity:.3}}' +
      '.st-tool .sg-bd{animation:sg-m1 1.2s linear infinite}.st-tool .sg-bd2{animation:sg-m2 1.2s linear infinite}.st-tool .sg-bd3{animation:sg-m3 1.2s linear infinite}' +
      '@keyframes sg-m1{to{stroke-dashoffset:-44}}@keyframes sg-m2{from{stroke-dashoffset:22}to{stroke-dashoffset:-22}}@keyframes sg-m3{from{stroke-dashoffset:1.25}to{stroke-dashoffset:-42.75}}' +
      '.sg-dz{animation:mv-spin 90s linear infinite}.st-run .sg-dz{animation-duration:14s}' +
      // The tree and its birds.
      '.sg-tw{animation:sg-tw 3.6s ease-in-out var(--d) infinite alternate}@keyframes sg-tw{from{opacity:.55}to{opacity:1}}' +
      '.sg-bob{transform-box:fill-box;transform-origin:50% 100%;animation:sg-bob 2.8s ease-in-out infinite alternate}@keyframes sg-bob{from{transform:rotate(0)}to{transform:rotate(-7deg)}}' +
      '.sg-wing,.sg-wing2{transform-box:fill-box;transform-origin:50% 100%}.sg-wing{animation:sg-wing .42s ease-in-out infinite alternate}@keyframes sg-wing{to{transform:scaleY(-.55)}}' +
      '.st-done .sg-wing2{animation:sg-wing .22s ease-in-out infinite alternate}' +
      '.st-done .sg-perch{animation:sg-away 3.2s cubic-bezier(.4,0,.7,1) both}@keyframes sg-away{to{transform:translate(var(--ax),var(--ay)) rotate(-12deg)}}' +
      '.sg-fly{opacity:0}.st-web .sg-fly{animation:sg-fly 8s linear infinite}' +
      '@keyframes sg-fly{0%{opacity:0;transform:translateX(0)}6%,92%{opacity:.95}100%{opacity:0;transform:translateX(2300px)}}' +
      '.sg-flap{animation:sg-flap 1.6s ease-in-out infinite alternate}@keyframes sg-flap{from{transform:translateY(-6px)}to{transform:translateY(8px)}}' +
      // The workshop: the iron's tip, its smoke, the suncatcher.
      '.sg-tip{animation:sg-tip 2.8s ease-in-out infinite alternate}@keyframes sg-tip{from{opacity:.45}to{opacity:1}}' +
      '.st-tool .sg-tip,.st-run .sg-tip{animation-duration:.7s}' +
      '.sg-wisp{opacity:0;transform-box:fill-box;transform-origin:center;animation:sg-wisp 2.1s ease-out var(--d) infinite}' +
      '@keyframes sg-wisp{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:.55}100%{opacity:0;transform:translate(var(--dx),-64px) scale(1.8)}}' +
      '.sg-cat{animation:sg-cat 5s ease-in-out infinite alternate}@keyframes sg-cat{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .sg-cat{animation-duration:.9s}',
    scenery:
      '<defs>' +
      '<linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08060f"/><stop offset=".55" stop-color="#0e0a17"/><stop offset="1" stop-color="#0a0710"/></linearGradient>' +
      '<linearGradient id="sg-fl" x1="0" y1="640" x2="0" y2="1060" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#08060d"/><stop offset="1" stop-color="#151020"/></linearGradient>' +
      '<radialGradient id="sg-halo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".34"/><stop offset=".6" stop-color="#e08a5a" stop-opacity=".13"/><stop offset=".8" stop-color="#7a4ac0" stop-opacity=".05"/><stop offset="1" stop-color="#7a4ac0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sg-h2"><stop offset="0" stop-color="#6a7aff" stop-opacity=".18"/><stop offset=".6" stop-color="#5a3ac0" stop-opacity=".06"/><stop offset="1" stop-color="#5a3ac0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sg-rb"><stop offset="0" stop-color="#3a3282"/><stop offset=".55" stop-color="#261e62"/><stop offset="1" stop-color="#16103c"/></radialGradient>' +
      '<radialGradient id="sg-cg"><stop offset="0" stop-color="#fff3d0" stop-opacity=".6"/><stop offset=".45" stop-color="#ffc85a" stop-opacity=".25"/><stop offset="1" stop-color="#ffc85a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sg-tg"><stop offset="0" stop-color="#9ee07a" stop-opacity=".2"/><stop offset="1" stop-color="#9ee07a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sg-rg" gradientUnits="userSpaceOnUse" x1="-246" y1="0" x2="246" y2="0"><stop offset=".78" stop-color="#ffb000"/><stop offset=".9" stop-color="#ffb000" stop-opacity=".3"/></linearGradient>' +
      '<linearGradient id="sg-lq" x1="0" y1="196" x2="0" y2="594" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3454c0" stop-opacity=".85"/><stop offset=".55" stop-color="#3a2c8a" stop-opacity=".75"/><stop offset="1" stop-color="#4a2470" stop-opacity=".65"/></linearGradient>' +
      '<linearGradient id="sg-bh" x1="0" y1="490" x2="0" y2="962" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe9c0" stop-opacity=".1"/><stop offset="1" stop-color="#ffe9c0" stop-opacity=".02"/></linearGradient>' +
      '<linearGradient id="sg-far" x1="0" y1="326" x2="0" y2="640" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6a4ab0" stop-opacity=".28"/><stop offset="1" stop-color="#3a2a70" stop-opacity=".06"/></linearGradient>' +
      `<clipPath id="sg-lc"><path d="${lancet(1284, 1404) + lancet(1448, 1568)}"/></clipPath>` +
      light.defs +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#sg-sky)"/>' +
      // The vault over the nave and the far end of it, very dim behind the chat.
      '<path d="M419 232C430 90 600 8 798 -20C996 8 1166 90 1177 232Q1000 120 798 100Q596 120 419 232Z" fill="#0d0915"/>' +
      '<path d="M419 232C430 90 600 8 798 -20C996 8 1166 90 1177 232M419 232Q596 120 798 100Q1000 120 1177 232M798 100V-20" fill="none" stroke="#130e1d" stroke-width="20"/>' +
      '<path d="M419 232C430 90 600 8 798 -20C996 8 1166 90 1177 232M419 232Q596 120 798 100Q1000 120 1177 232" fill="none" stroke="#2a2140" stroke-opacity=".6" stroke-width="2"/>' +
      '<ellipse cx="800" cy="480" rx="170" ry="230" fill="#4a3a90" fill-opacity=".06"/>' +
      '<path d="M712 640V420C712 384 730 362 740 352C750 362 768 384 768 420V640ZM772 640V400C772 362 790 338 800 328C810 338 828 362 828 400V640ZM832 640V420C832 384 850 362 860 352C870 362 888 384 888 420V640Z" fill="url(#sg-far)"/>' +
      floor() +
      pillar(419, 736) +
      pillar(1177, 734) +
      // The rose window on the left wall, its glow, its beams.
      '<circle class="sg-halo" cx="220" cy="290" r="400" fill="url(#sg-halo)"/>' +
      rose() +
      light.body +
      // Done: the rose's light, thrown flat on the floor, spreads out of the beam pools as a turning wheel under the tree.
      `<g class="mv-b"><g transform="translate(226 892)"><g class="sg-sweep"><g transform="scale(1 .26)"><g class="sg-swr" fill-opacity=".4" stroke="${INK}" stroke-opacity=".7" stroke-width="5">` +
      `${sweep}<circle r="46" fill="${AMBER}" fill-opacity=".55"/></g></g></g></g></g>` +
      tree(next) +
      perched +
      // Error: the shards of the broken pane.
      `<g transform="translate(226 436)" stroke="${LEAD}" stroke-width="2" stroke-linejoin="round">${shardMarkup}</g>` +
      // The far-right window.
      `<g class="mv-r"><g class="mv-t">${lancets()}</g></g>` +
      // Web: a flock of glass birds crosses the top.
      flock,
    nook:
      // Sheet glass leaning on the wall behind the stool.
      '<g stroke-width="1.5" stroke-linejoin="round">' +
      `<path d="M4 456L24 296L50 299L32 456Z" fill="${SAPPHIRE}" fill-opacity=".3" stroke="#7a9af0" stroke-opacity=".45"/>` +
      `<path d="M28 456L56 288L82 293L56 456Z" fill="${EMERALD}" fill-opacity=".3" stroke="#6ad8a8" stroke-opacity=".45"/>` +
      `<path d="M54 456L88 306L110 312L78 456Z" fill="${RUBY}" fill-opacity=".3" stroke="#f07a90" stroke-opacity=".45"/></g>` +
      // A finished suncatcher hanging on its chain by the pillar.
      `<g transform="translate(40 -330)"><g class="sg-cat"><path d="M0 0V274" stroke="${METAL}" stroke-width="2" stroke-dasharray="4 2"/>` +
      `<g transform="translate(0 300)"><g stroke="${LEAD}" stroke-width="2">${catcher}</g><circle r="8" fill="${TEAL}" stroke="${LEAD}" stroke-width="2"/>` +
      `<circle r="26" fill="none" stroke="${METAL}" stroke-width="4"/></g></g></g>`,
  }
}
