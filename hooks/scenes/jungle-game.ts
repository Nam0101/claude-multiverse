import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Jungle Game: game night in an old wooden house, and the antique board on the table has woken up. Giant leaves
// burst out of it around Claude, vines drape the ceiling, a monsoon pours through a hole the jungle has torn in the
// back wall, and two carved drums wait on the floor. When a command runs the dice roll, the board lights its path
// and a stampede thunders out of the hole and across the room; an error sends a vine down to snatch the dice while
// monkeys tumble from the ceiling; done flashes the crystal and the jungle shrinks back into the board.
const WOOD = '#2a1c11'
const WOOD_EDGE = '#4a3320'
const CARVE = '#6a4a2a'
const TONES = ['#0f341a', '#124020', '#0c2c16'] as const
const RIM = '#3f9a5c'
const RIB = '#2f7a42'
const VINE = '#14301a'
const VINE_LIT = '#2d6a36'
const KHAKI = '#b8a274'
const AMBER = '#e8a646'
const SHADOW = '#040504'
const SHADOW_RIM = '#3d3423'
const IVORY = '#e6dcc2'
const ORB: Pt = [327, 250]

type Pt = readonly [number, number]

function turn(x: number, y: number, a: number): Pt {
  const r = (a * Math.PI) / 180

  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
}

/** A pointed leaf, its stalk at (x, y), turned `a` degrees from straight up: the outline, the midrib, the splits. */
function leaf(x: number, y: number, a: number, len: number, w: number, splits = 0): { body: string; rib: string; cuts: string } {
  const p = (px: number, py: number): string => {
    const [rx, ry] = turn(px, py, a)

    return `${Math.round(x + rx)} ${Math.round(y + ry)}`
  }
  let cuts = ''

  for (let i = 0; i < splits; i += 1) {
    const t = 0.3 + (i * 0.42) / Math.max(1, splits - 1)

    cuts += `M${p(-w * 0.5, -len * t)}L${p(-w * 0.1, -len * (t - 0.08))}M${p(w * 0.5, -len * t)}L${p(w * 0.1, -len * (t - 0.08))}`
  }

  return {
    body: `M${p(0, 0)}C${p(w * 0.55, -len * 0.12)} ${p(w * 0.62, -len * 0.7)} ${p(0, -len)}C${p(-w * 0.62, -len * 0.7)} ${p(-w * 0.55, -len * 0.12)} ${p(0, 0)}Z`,
    rib: `M${p(0, -len * 0.04)}L${p(0, -len * 0.9)}`,
    cuts,
  }
}

/**
 * A big leaf that sways around its stalk and thrashes in a stampede. Its delay rides in `--dl`, so a state's own
 * animation (done shrinks the leaves) starts on time. `lit` draws a pale midrib apart from the dark splits.
 */
function swayLeaf(x: number, y: number, a: number, len: number, w: number, splits: number, tone: string, s: number, delay: number, lit: boolean): string {
  const l = leaf(0, 0, 0, len, w, splits)

  return (
    `<g transform="translate(${x} ${y}) rotate(${a})"><g class="jg-sw" style="--s:${f(s)}s;--dl:${f(delay)}s">` +
    `<path d="${l.body}" fill="${tone}" stroke="${RIM}" stroke-opacity=".42" stroke-width="1.6"/>` +
    (lit
      ? `<path d="${l.rib}" stroke="${RIB}" stroke-opacity=".75" stroke-width="2.2"/><path d="${l.cuts}" stroke="#050d07" stroke-width="3.2" stroke-linecap="round"/>`
      : `<path d="${l.rib}${l.cuts}" stroke="#061509" stroke-width="2.8" stroke-linecap="round"/>`) +
    '</g></g>'
  )
}

/** A monkey, arms flung up, its curled tail out to the side; about 64 tall around its own middle. */
function monkey(): string {
  return (
    `<g fill="${SHADOW}" stroke="${SHADOW}" stroke-linecap="round">` +
    '<path d="M-10 -6L-28 -24M10 -6L28 -26M-7 14L-18 30M7 14L18 30" fill="none" stroke-width="6"/>' +
    '<path d="M9 12C34 18 40 -6 28 -12C20 -16 16 -6 23 -4" fill="none" stroke-width="3.6"/>' +
    `<ellipse rx="13" ry="17" stroke="${SHADOW_RIM}" stroke-width="1.6"/>` +
    `<circle cx="-12" cy="-30" r="5"/><circle cx="12" cy="-30" r="5"/><circle cy="-27" r="12" stroke="${SHADOW_RIM}" stroke-width="1.6"/></g>` +
    '<ellipse cy="-23" rx="7" ry="5.5" fill="#6a5236" fill-opacity=".8"/><path d="M-5 -29h3M2 -29h3" stroke="#e8d24a" stroke-width="1.8"/>'
  )
}

/** One stampeding beast, facing right with its feet at the origin: an elephant or a rhino, legs galloping. */
function beast(kind: 'e' | 'r'): string {
  const elephant = kind === 'e'
  const hip = elephant ? -76 : -48
  const len = elephant ? 78 : 50
  const w = elephant ? 26 : 22
  const xs = elephant ? [96, 74, -54, -76] : [68, 50, -52, -70]
  const leg = (x: number, cls: string): string =>
    `<path class="${cls}" d="M${x - w / 2} ${hip - 8}H${x + w / 2}L${x + w / 2 - 2} ${hip + len}H${x - w / 2 + 2}Z"/>`
  const body = elephant
    ? '<path d="M-98 -76C-104 -126 -66 -158 -6 -160C44 -162 82 -150 100 -132C116 -146 140 -140 146 -118C150 -100 140 -86 142 -64C144 -40 152 -22 160 -16C164 -10 156 -4 148 -10C134 -22 128 -46 124 -66C116 -70 106 -76 98 -80C70 -62 -60 -58 -98 -76Z"/>' +
      '<path d="M70 -138C44 -134 40 -94 54 -76C68 -70 86 -86 90 -112C88 -128 80 -136 70 -138Z" fill="#0b0b08"/>' +
      '<path d="M-98 -112Q-114 -96 -108 -70" fill="none" stroke-width="3"/>'
    : '<path d="M-92 -48C-96 -88 -66 -110 -14 -112C26 -114 52 -106 66 -94C84 -96 102 -84 112 -66L124 -62C130 -52 126 -40 114 -38C98 -34 84 -38 74 -42C46 -30 -54 -28 -92 -48Z"/>' +
      '<path d="M110 -64L128 -106L121 -60ZM90 -80L99 -98L99 -76ZM62 -96L58 -116L71 -100Z"/>' +
      '<path d="M-92 -70Q-104 -60 -100 -46" fill="none" stroke-width="3"/>'
  const dust = '<ellipse cx="-160" cy="-16" rx="120" ry="36" fill="url(#jg-dust)"/>'

  return (
    dust +
    `<g class="jg-bod" fill="${SHADOW}" stroke="${SHADOW_RIM}" stroke-width="2" stroke-opacity=".75" stroke-linejoin="round">` +
    leg(xs[1] ?? 0, 'jg-lr') +
    leg(xs[3] ?? 0, 'jg-lf') +
    leg(xs[0] ?? 0, 'jg-lf') +
    leg(xs[2] ?? 0, 'jg-lr') +
    body +
    '</g>' +
    (elephant ? '<path d="M120 -78Q140 -70 150 -84" fill="none" stroke="#c8bc9c" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>' : '')
  )
}

/** A carved floor drum: a waisted body with two zigzag bands, a hide head that glows and rings on the beat. */
function drum(cx: number, top: number, r: number, h: number, delay: number): string {
  const ry = r * 0.26
  const zig = (y: number, half: number): string => {
    let d = `M${f(cx - half)} ${f(y)}`

    for (let k = 1; k <= 10; k += 1) {
      d += `L${f(cx - half + (k * 2 * half) / 10)} ${f(y + (k % 2 ? -6 : 6))}`
    }

    return d
  }
  const beat = `animation-delay:${delay}s`

  return (
    `<circle class="jg-dg" cx="${cx}" cy="${top}" r="${f(r * 2.3)}" fill="url(#jg-dglow)" style="${beat}"/>` +
    `<path d="M${cx - r} ${top}C${f(cx - r * 1.12)} ${f(top + h * 0.3)} ${f(cx - r * 0.86)} ${f(top + h * 0.6)} ${f(cx - r * 0.7)} ${top + h}` +
    `H${f(cx + r * 0.7)}C${f(cx + r * 0.86)} ${f(top + h * 0.6)} ${f(cx + r * 1.12)} ${f(top + h * 0.3)} ${cx + r} ${top}Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
    `<path d="M${f(cx + r * 0.62)} ${f(top + 10)}C${f(cx + r * 0.86)} ${f(top + h * 0.35)} ${f(cx + r * 0.7)} ${f(top + h * 0.7)} ${f(cx + r * 0.55)} ${top + h - 4}" fill="none" stroke="#6a4a2a" stroke-opacity=".5" stroke-width="3"/>` +
    `<path class="jg-carve" d="${zig(top + h * 0.24, r * 1.0)}${zig(top + h * 0.64, r * 0.8)}" fill="none" stroke="${AMBER}" stroke-width="2.4" style="${beat}"/>` +
    `<ellipse cx="${cx}" cy="${top}" rx="${r}" ry="${f(ry)}" fill="#3a2a18" stroke="${WOOD_EDGE}" stroke-width="3"/>` +
    `<ellipse class="jg-skin" cx="${cx}" cy="${top}" rx="${f(r * 0.86)}" ry="${f(ry * 0.78)}" fill="#e2c890" style="${beat}"/>` +
    `<ellipse class="jg-ring" cx="${cx}" cy="${top}" rx="${f(r * 0.86)}" ry="${f(ry * 0.78)}" fill="none" stroke="${AMBER}" stroke-width="2.4" style="${beat}"/>`
  )
}

/** One die in three-quarter view around its own middle; `sx` is how far left it is thrown from when it rolls. */
function die(x: number, y: number, pips: readonly Pt[], sx = 0): string {
  return (
    `<g transform="translate(${x} ${y})"><g${sx === 0 ? '' : ` class="jg-die" style="--sx:${sx}px"`}>` +
    '<path d="M-8 -8L-3 -13H13L8 -8Z" fill="#f3ead6"/><path d="M8 -8L13 -13V3L8 8Z" fill="#b5a684"/>' +
    `<rect x="-8" y="-8" width="16" height="16" rx="2" fill="${IVORY}"/>` +
    `<g fill="#2a1a10">${pips.map(([px, py]) => `<circle cx="${px}" cy="${py}" r="1.7"/>`).join('')}<circle cx="5" cy="-10.5" r="1.4"/></g></g></g>`
  )
}

const THREE: readonly Pt[] = [[-4, -4], [0, 0], [4, 4]]
const FIVE: readonly Pt[] = [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]]

/** Invented marks, waves and dots in rows, as the crystal's riddle: no letters of any script. */
const WAVES = 'M-16 -9q2 -3 4 0t4 0t4 0M3 -9q2 -3 4 0t4 0M-19 0q2 -3 4 0t4 0M-5 0q2 -3 4 0t4 0t4 0t4 0M-13 9q2 -3 4 0t4 0t4 0t4 0'

/**
 * The game board on the table: a carved slab with a ring of path spaces, four pawns, a crystal orb on a pedestal
 * as the screen, two leaves sprouting from its back corner, the dice beside it. Self-contained, for the portals.
 */
function device(light: string, activity: Activity): string {
  const [ox, oy] = ORB
  const ringAt = (i: number): Pt => {
    const a = Math.PI * 0.72 - (i / 16) * Math.PI * 2

    return [ox + 62 * Math.cos(a), 300 + 10 * Math.sin(a)]
  }
  const spaces = Array.from({ length: 16 }, (_, i) => {
    const [x, y] = ringAt(i)

    return `<rect class="jg-sp" style="--i:${i}" x="${f(x - 5)}" y="${f(y - 2)}" width="10" height="4" rx="1" opacity=".3"/>`
  }).join('')
  const pawn = (i: number, color: string): string => {
    const [x, y] = ringAt(i)

    return `<path class="jg-tok" style="animation-delay:${f(-i * 0.11)}s" d="M${f(x - 4)} ${f(y)}h8l-2 -6.5a3.4 3.4 0 1 0 -4 0Z" fill="${color}"/>`
  }
  const sprout = leaf(392, 285, -16, 78, 32, 1)
  const sprout2 = leaf(404, 288, 24, 62, 26)
  let inOrb: string

  if (activity === 'read') {
    inOrb = `<g class="jg-rid"><path d="${WAVES}" fill="none" stroke="#f2fff4" stroke-opacity=".85" stroke-width="1.6" stroke-linecap="round"/>` +
      '<g fill="#f2fff4" fill-opacity=".85"><circle cx="-1" cy="-9" r="1.3"/><circle cx="14" cy="0" r="1.3"/><circle cx="-16" cy="9" r="1.3"/></g></g>'
  } else if (activity === 'responding') {
    inOrb = [0, 1, 2]
      .map(k => `<path class="jg-row" style="animation-delay:${f(-k * 0.6)}s" d="M-15 0q2 -3 4 0t4 0t4 0t4 0t4 0t4 0" fill="none" stroke="#f2fff4" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>`)
      .join('')
  } else {
    inOrb = '<g class="jg-swirl"><path d="M-17 5a17 9 0 0 1 24 -12M15 -3a14 8 0 0 1 -20 12" fill="none" stroke="#f2fff4" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></g>'
  }

  return (
    // The board: the top face, its dark inlay, the carved front.
    '<path d="M258 282H396L418 318H236Z" fill="#3a2614" stroke="#9a6e3a" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M268 286H386L402 314H252Z" fill="#1d130a"/>' +
    '<rect x="236" y="318" width="182" height="12" fill="#26180d" stroke="#7a5630" stroke-width="1.2"/>' +
    `<path d="M238 318H416" stroke="${light}" stroke-opacity=".5" stroke-width="1.6"/>` +
    `<path d="M242 324${'l6 -3l6 3'.repeat(14)}" fill="none" stroke="${CARVE}" stroke-width="1.4"/>` +
    `<g fill="${light}">${spaces}</g>` +
    pawn(3, '#e8dcc0') + pawn(7, '#4fbf7a') + pawn(11, '#e0a040') + pawn(14, '#c8503c') +
    // Two leaves sprouting from the back corner, and a tendril round the pedestal.
    `<path d="${sprout.body}${sprout2.body}" fill="#14401f" stroke="${RIM}" stroke-opacity=".55" stroke-width="1.4"/>` +
    `<path d="${sprout.rib}${sprout2.rib}" stroke="${RIB}" stroke-width="1.6"/>` +
    // The pedestal and the crystal.
    `<path d="M${ox - 18} 300L${ox - 12} 280H${ox + 12}L${ox + 18} 300Z" fill="#4a3219" stroke="#6e5030" stroke-width="1.2"/>` +
    `<ellipse cx="${ox}" cy="280" rx="15" ry="4" fill="#5e4226"/>` +
    `<path d="M${ox - 16} 295Q${ox} 301 ${ox + 15} 293M${ox - 13} 287Q${ox} 292 ${ox + 12} 285" fill="none" stroke="#2f8a48" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="${ox}" cy="${oy}" r="30" fill="#06120a" stroke="#6e5030" stroke-width="2.6"/>` +
    `<circle class="jg-orb" cx="${ox}" cy="${oy}" r="27" fill="${light}" fill-opacity=".42"/>` +
    `<circle cx="${ox}" cy="${oy}" r="12" fill="${light}" fill-opacity=".45"/>` +
    `<g transform="translate(${ox} ${oy})">${inOrb}</g>` +
    (activity === 'error'
      ? `<path d="M${ox} ${oy}l-9 -13l-7 4M${ox} ${oy}l11 -7l3 -12M${ox} ${oy}l3 15l-8 9M${ox} ${oy}l-15 5" fill="none" stroke="#ffd8cc" stroke-opacity=".8" stroke-width="1.4"/>`
      : '') +
    `<path d="M${ox - 17} ${oy - 15}Q${ox - 11} ${oy - 24} ${ox + 2} ${oy - 25}" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>` +
    // The dice, kept out of the band Claude's eyes sweep while reading (x 174..206): one rests on the board, one on
    // the table by Claude's hand for the error's vine to snatch. When a command runs both are thrown from under the
    // hand and tumble across the board.
    (activity === 'run'
      ? die(296, 310, THREE, -50) + die(372, 310, FIVE, -112)
      : `${die(296, 310, THREE)}<g class="jg-dice">${die(216, 322, FIVE)}</g>`)
  )
}

// The hole the jungle has torn in the back wall, from the floor up.
const BREACH: readonly Pt[] = [
  [16, 724], [14, 560], [34, 516], [22, 468], [50, 428], [38, 378], [70, 330], [62, 282], [98, 252], [92, 210],
  [138, 196], [166, 158], [198, 184], [234, 148], [262, 188], [298, 168], [318, 212], [350, 228], [342, 280],
  [372, 318], [358, 370], [388, 420], [374, 478], [400, 528], [384, 588], [406, 640], [394, 724],
]

// Leaves pushing in through the hole: stalk, angle, length, width, splits.
const BURST: readonly (readonly [number, number, number, number, number, number])[] = [
  [392, 600, 78, 170, 84, 2],
  [380, 470, 62, 190, 92, 3],
  [366, 330, 44, 170, 84, 2],
  [300, 176, 16, 150, 74, 2],
  [180, 170, -14, 140, 70, 1],
  [70, 300, -40, 150, 74, 2],
  [30, 520, -64, 130, 64, 1],
  [120, 726, 60, 180, 90, 2],
  [330, 724, 96, 150, 80, 2],
  [250, 728, 82, 200, 96, 3],
]

// Leaves erupting out of the board, in the desk's box.
const ERUPT: readonly (readonly [number, number, number, number, number, number])[] = [
  [410, -230, 4, 150, 76, 1],
  [362, -170, -48, 170, 88, 2],
  [394, -90, -14, 190, 96, 2],
  [318, 10, -72, 190, 96, 2],
  [356, 70, -36, 220, 112, 3],
  [404, 90, 6, 210, 108, 3],
  [330, 170, -62, 200, 100, 2],
  [372, 196, -18, 250, 126, 3],
  [392, 250, 18, 200, 104, 3],
]

// The stampede, far to near: which beast, its size, where its feet run, when it charges.
const HERD: readonly { kind: 'e' | 'r'; z: number; y: number; d: number }[] = [
  { kind: 'e', z: 0.8, y: 714, d: 1.5 },
  { kind: 'r', z: 0.86, y: 720, d: 1.05 },
  { kind: 'e', z: 1.05, y: 732, d: 0.2 },
  { kind: 'r', z: 1, y: 740, d: 0.65 },
  { kind: 'r', z: 1.08, y: 748, d: 2.0 },
]

export function jungleGameWorld(): World {
  const next = random(29)

  // The vine garland along the ceiling: four sags, leaves hanging off each.
  const sags: readonly (readonly [Pt, Pt, Pt])[] = [
    [[-20, 24], [190, 140], [400, 24]],
    [[400, 24], [600, 126], [800, 24]],
    [[800, 24], [1000, 126], [1200, 24]],
    [[1200, 24], [1410, 140], [1620, 24]],
  ]
  let garBody = ''

  for (const [a, c, b] of sags) {
    for (let k = 1; k <= 5; k += 1) {
      const t = k / 6
      const u = 1 - t
      const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0]
      const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]
      const l = leaf(x, y, 180 + (k % 2 ? 26 : -26) + (next() - 0.5) * 20, 30 + next() * 22, 15 + next() * 8)

      garBody += l.body
    }
  }

  const garVine = `M-20 24${sags.map(([, c, b]) => `Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`).join('')}`

  // Lianas hanging from the ceiling, each swinging from its top.
  const liana = (x: number, len: number, s: number, delay: number): string => {
    let d = 'M0 0'
    let leaves = ''

    for (let y = 0; y < len; y += 60) {
      d += `Q${(y / 60) % 2 ? 12 : -12} ${y + 30} 0 ${Math.min(len, y + 60)}`
    }

    for (let y = 70; y < len; y += 80) {
      leaves += leaf(0, y, (y / 80) % 2 < 1 ? 124 : -124, 26 + next() * 12, 14).body
    }

    return (
      `<g transform="translate(${x} 0)"><g class="jg-li" style="--s:${s}s;--dl:${delay}s">` +
      `<path d="${d}" fill="none" stroke="${VINE}" stroke-width="5"/><path d="${leaves}" fill="#0f341a" stroke="${RIM}" stroke-opacity=".3"/></g></g>`
    )
  }

  // Fireflies: each drifts and twinkles on its own.
  const fly = (x: number, y: number): string =>
    `<g class="jg-ff" style="--t:${f(5 + next() * 5)}s;--dx:${f((next() - 0.5) * 70)}px;--dy:${f((next() - 0.5) * 60)}px;animation-delay:${f(-next() * 6)}s">` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="#e8ff9a" stroke="#d8f57a" stroke-opacity=".16" stroke-width="9"/></g>`
  const fliesLeft = Array.from({ length: 5 }, () => fly(40 + next() * 350, 200 + next() * 540)).join('')
  const fliesRight = Array.from({ length: 3 }, () => fly(1230 + next() * 340, 140 + next() * 360)).join('')

  // The jungle outside the hole: three bumpy canopies, trunks, near leaves.
  const canopy = (base: number, amp: number, step: number, fill: string): string => {
    let d = `M-10 ${base}`

    for (let x = -10; x < 430; x += step) {
      d += `q${f(step / 2)} ${f(-amp * (0.5 + next()))} ${step} 0`
    }

    return `<path d="${d}V740H-10Z" fill="${fill}"/>`
  }
  const near = [leaf(40, 740, 20, 200, 90), leaf(150, 740, -10, 240, 110), leaf(262, 740, 14, 220, 100), leaf(362, 740, -20, 190, 90)]
    .map(l => l.body)
    .join('')

  // Vines that climbed out of the hole and up the wall, with small leaves along them.
  let vineLeaves = ''

  for (const [x, y, a] of [
    [380, 150, 50], [420, 112, -40], [456, 70, 60], [92, 200, -50], [80, 120, 40], [96, 50, -40],
  ] as const) {
    vineLeaves += leaf(x, y, a, 30, 16).body
  }

  const herd = HERD.map(
    h => `<g transform="translate(200 ${h.y})"><g class="jg-ani" style="--z:${h.z};--d:${h.d}s">${beast(h.kind)}</g></g>`,
  ).join('')
  const shards = [
    [372, 320, 260, -90, 220],
    [390, 430, 300, 40, -160],
    [380, 560, 240, 120, 300],
    [300, 172, 200, -60, -260],
  ]
    .map(
      ([x, y, dx, dy, r]) =>
        `<rect class="jg-sh" style="--x:${dx}px;--y:${dy}px;--r:${r}deg" x="${x}" y="${y}" width="34" height="9" fill="#3a2716" stroke="#6a4a2a" stroke-width="1.4"/>`,
    )
    .join('')
  const boards = Array.from({ length: 15 }, (_, i) => {
    const x = -40 + i * 120

    return `M${x} 722L${f(800 + (x - 800) * 2.3)} 1000`
  }).join('')
  const panels = Array.from({ length: 8 }, (_, i) => `M${430 + i * 150} 612h124v86h-124Z`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'spores',
      ink: '#030503',
      furniture: WOOD,
      metal: '#3a2716',
      paper: IVORY,
      light: { idle: '#3f9a5c', work: '#6be38b', bright: '#c9ffd8' },
      headTop: 204,
      glowAt: ORB,
      device,
      wear: {
        front:
          // The explorer's pith helmet: brim, dome, band with a tucked leaf. All of it ends above the eyes.
          '<path d="M58 245C82 233 218 233 242 245C220 253 80 253 58 245Z" fill="#8c7a50" stroke="#5e5034" stroke-width="1.6"/>' +
          `<path d="M80 242C80 202 110 186 150 186C190 186 220 202 220 242Z" fill="${KHAKI}" stroke="#6e6040" stroke-width="1.6"/>` +
          '<path d="M80 242C80 202 110 186 150 186C126 192 108 212 106 242Z" fill="#000000" fill-opacity=".2"/>' +
          '<path d="M150 186C140 200 138 222 140 242M150 186C164 200 170 222 172 242" fill="none" stroke="#7d6e48" stroke-width="1.4"/>' +
          '<rect x="81" y="228" width="138" height="10" fill="#4a3a22"/>' +
          '<circle cx="150" cy="186" r="4.5" fill="#8c7a50"/>' +
          '<path d="M196 196C212 206 218 222 219 240" fill="none" stroke="#efe4bc" stroke-opacity=".45" stroke-width="2"/>' +
          '<path d="M204 234C212 216 226 210 238 203C234 218 222 230 206 238Z" fill="#2f8a48"/><path d="M205 235L232 208" stroke="#1d5a2c" stroke-width="1.2"/>',
      },
      seatArt:
        // A carved parlour chair seen side-on: the tall back post with its finial, the seat, a turned front leg.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><path d="M46 456V238H58V456Z"/>` +
        '<path d="M184 362H198L196 386Q204 398 196 410L198 456H184L186 410Q178 398 186 386Z"/>' +
        '<rect x="40" y="350" width="166" height="13" rx="3"/><path d="M58 420H186V428H58Z"/></g>' +
        `<circle cx="52" cy="230" r="8" fill="${CARVE}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<path d="M46 264H58M46 300H58" stroke="${CARVE}" stroke-width="2"/>`,
      tableArt:
        // The game table: a thick top, a scalloped apron, turned legs, a vine wound round the front one.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="160" y="330" width="320" height="11" rx="2"/>` +
        `<path d="M172 341H476V356${Array.from({ length: 12 }, () => 'q-13 12 -25.3 0').join('')}Z"/>` +
        '<path d="M182 360H200L198 382Q208 396 198 410L200 456H182L184 410Q174 396 184 382Z"/>' +
        '<path d="M398 360H416L414 382Q424 396 414 410L416 456H398L400 410Q390 396 400 382Z"/></g>' +
        `<path d="M162 331H478" stroke="${CARVE}" stroke-opacity=".8" stroke-width="1.4"/><path d="M176 348H472" stroke="${CARVE}" stroke-opacity=".5"/>` +
        '<path d="M184 456C204 440 176 426 198 412C214 400 178 390 196 374C206 364 190 354 200 346" fill="none" stroke="#1f5a2c" stroke-width="3.4"/>' +
        `<path d="${leaf(198, 412, 60, 22, 12).body}${leaf(186, 380, -60, 20, 11).body}" fill="#2a7a3e"/>`,
    },
    style:
      // Leaves sway on their stalks, faster while Claude writes, thrashing in a stampede; done shrinks them away.
      '.jg-sw{animation:jg-sw var(--s) ease-in-out var(--dl) infinite alternate}@keyframes jg-sw{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-responding .jg-sw,.st-tool .jg-sw{animation-duration:calc(var(--s) * .45)}' +
      '.st-run .jg-sw,.st-error .jg-sw{animation-name:jg-thrash;animation-duration:calc(var(--s) * .1)}@keyframes jg-thrash{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      '.st-done .jg-sw{animation:jg-shrink 2.4s ease-in-out both}@keyframes jg-shrink{to{transform:scale(.06);opacity:.3}}.st-done .jg-er .jg-sw{animation:none}' +
      '.jg-er{transform-origin:400px 300px}.st-done .jg-er{animation:jg-retreat 2.6s ease-in-out both}@keyframes jg-retreat{to{transform:scale(.04);opacity:.4}}' +
      '.jg-li{animation:jg-li var(--s) ease-in-out var(--dl) infinite alternate}@keyframes jg-li{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}' +
      '.st-done .jg-li{animation:jg-reel 2.4s ease-in both}@keyframes jg-reel{to{transform:scaleY(.08)}}' +
      '.jg-gar{animation:jg-gar 6s ease-in-out infinite alternate}@keyframes jg-gar{to{transform:translateY(5px)}}' +
      '.st-done .jg-gar{animation:jg-up 2.4s ease-in both}@keyframes jg-up{to{transform:translateY(-120px)}}' +
      '.st-done .jg-vn{animation:jg-out 2.4s ease-in both}@keyframes jg-out{to{opacity:.12}}' +
      // Fireflies, brighter while Claude writes.
      '.jg-ff{animation:jg-ff var(--t) ease-in-out infinite alternate,jg-tw 2.2s ease-in-out infinite alternate}' +
      '@keyframes jg-ff{to{transform:translate(var(--dx),var(--dy))}}@keyframes jg-tw{from{opacity:.15}to{opacity:.9}}' +
      '.st-responding .jg-ff{animation-name:jg-ff,jg-tw2}@keyframes jg-tw2{from{opacity:.7}to{opacity:1}}' +
      // The monsoon outside: rain, a soft lightning glow every 9 s, mist, eyes that blink; done clears it to a moon.
      '.jg-lt{opacity:0;animation:jg-lt 9s ease-in-out infinite}@keyframes jg-lt{0%,88%{opacity:0}92%{opacity:.3}100%{opacity:0}}' +
      '.st-done .jg-lt{display:none}.st-done .jg-rain{animation:jg-out 2s ease-out both}' +
      '.jg-moon{opacity:0}.st-done .jg-moon{animation:jg-show 2.6s ease-out .4s both}@keyframes jg-show{to{opacity:1}}' +
      '.jg-mist{animation:jg-mist 14s ease-in-out infinite alternate}@keyframes jg-mist{to{transform:translateX(70px)}}' +
      '.jg-eye{transform-box:fill-box;transform-origin:center;animation:jg-blink 5.2s steps(1) infinite}' +
      '@keyframes jg-blink{0%,90%{transform:scaleY(1)}91%,95%{transform:scaleY(.1)}}.st-done .jg-eyes{animation:jg-out 1.2s both}' +
      // The drums: dim at rest, beating while Claude thinks and while the herd runs.
      '.jg-skin{opacity:.26}.jg-dg{opacity:.18}.jg-carve{opacity:.32}.jg-ring{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-thinking .jg-skin,.st-run .jg-skin{animation:jg-beat .6s ease-in-out infinite alternate}@keyframes jg-beat{from{opacity:.25}to{opacity:.8}}' +
      '.st-thinking .jg-dg,.st-run .jg-dg{animation:jg-dbeat .6s ease-in-out infinite alternate}@keyframes jg-dbeat{from{opacity:.2}to{opacity:.62}}' +
      '.st-thinking .jg-carve,.st-run .jg-carve{animation:jg-beat 1.2s ease-in-out infinite alternate}.st-tool .jg-carve{animation:jg-beat 2s ease-in-out infinite alternate}' +
      '.st-thinking .jg-ring,.st-run .jg-ring{animation:jg-ring 1.2s ease-out infinite}@keyframes jg-ring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(2.3)}}' +
      // The board: the crystal's swirl, the riddle, the rows it writes, the path, the pawns.
      '.jg-orb{animation:jg-orb 3s ease-in-out infinite alternate}@keyframes jg-orb{from{opacity:.6}to{opacity:1}}' +
      '.jg-swirl{animation:mv-spin 9s linear infinite}.st-thinking .jg-swirl{animation-duration:2.2s}.st-tool .jg-swirl,.st-run .jg-swirl,.st-web .jg-swirl{animation-duration:1.1s}' +
      '.jg-rid{opacity:0;animation:jg-show 1s ease-out .2s both}' +
      '.jg-row{opacity:0;animation:jg-row 1.8s linear infinite}@keyframes jg-row{0%{opacity:0;transform:translateY(13px)}25%,75%{opacity:1}100%{opacity:0;transform:translateY(-13px)}}' +
      '.st-run .jg-sp{animation:jg-path .5s ease-out both;animation-delay:calc(.15s + var(--i) * .09s)}@keyframes jg-path{to{opacity:1}}' +
      '.st-tool .jg-sp{animation:jg-chase 1.6s linear infinite;animation-delay:calc(var(--i) * .1s)}@keyframes jg-chase{0%,100%{opacity:.3}6%{opacity:1}22%{opacity:.3}}' +
      '.st-done .jg-sp{opacity:.95}' +
      '.st-tool .jg-tok{animation:jg-hop .45s ease-in-out infinite alternate}@keyframes jg-hop{to{transform:translateY(-6px)}}' +
      '.jg-bur{transform-origin:396px 292px;animation:jg-orb 3.4s ease-in-out infinite alternate}.st-run .jg-bur{animation-duration:.7s}' +
      '.st-responding .jg-bur{animation:jg-swell 1.4s ease-in-out infinite alternate}@keyframes jg-swell{from{opacity:.6;transform:scale(.95)}to{opacity:1;transform:scale(1.2)}}' +
      // Run: the dice roll, the room shakes, planks fly, and the herd charges out of the hole and across.
      '.st-run .jg-die{animation:jg-roll 1.3s ease-out .1s both}' +
      '@keyframes jg-roll{0%{transform:translate(var(--sx),-34px) rotate(-700deg)}35%{transform:translate(calc(var(--sx) * .45),0) rotate(-300deg)}' +
      '50%{transform:translate(calc(var(--sx) * .22),-12px) rotate(-140deg)}68%,100%{transform:translate(0,0) rotate(0)}}' +
      '.st-run .jg-room{animation:jg-quake .22s linear infinite}@keyframes jg-quake{25%{transform:translate(2px,-1px)}50%{transform:translate(-1px,2px)}75%{transform:translate(-2px,-1px)}}' +
      '.st-run .jg-pic{animation:jg-rattle .26s ease-in-out infinite alternate}@keyframes jg-rattle{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.jg-sh{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .jg-sh{animation:jg-sh 1.3s cubic-bezier(.2,.6,.4,1) .15s both}' +
      '@keyframes jg-sh{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}' +
      '.jg-ani{opacity:0}.st-run .jg-ani{animation:jg-charge 4.4s linear var(--d) infinite}' +
      '@keyframes jg-charge{0%{opacity:0;transform:translate(0,-26px) scale(calc(var(--z) * .42))}5%{opacity:1}20%{transform:translate(250px,0) scale(var(--z))}' +
      '100%{opacity:1;transform:translate(1850px,0) scale(var(--z))}}' +
      '.jg-lf,.jg-lr{transform-box:fill-box;transform-origin:50% 0}.st-run .jg-lf{animation:jg-gal .34s ease-in-out infinite alternate}.st-run .jg-lr{animation:jg-gal .34s ease-in-out -.34s infinite alternate}' +
      '@keyframes jg-gal{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}' +
      '.st-run .jg-bod{animation:jg-bob .17s ease-in-out infinite alternate}@keyframes jg-bob{to{transform:translateY(-6px)}}' +
      // Error: a vine whips down, wraps the dice and hauls them up; monkeys drop, swing and cartwheel.
      '.jg-tend{transform:translateY(-1100px)}.st-error .jg-tend{animation:jg-whip 2.6s both}' +
      '@keyframes jg-whip{0%{transform:translate(0,-1100px);animation-timing-function:cubic-bezier(.5,0,.9,.6)}20%{transform:translate(0,10px)}26%{transform:translate(0,0)}36%{transform:translate(0,0);animation-timing-function:cubic-bezier(.55,0,.85,.55)}96%,100%{transform:translate(40px,-1100px)}}' +
      '.st-error .jg-dice{animation:jg-lift 2.6s both}' +
      '@keyframes jg-lift{0%,22%{transform:translate(0,0)}26%{transform:translate(-2px,3px)}36%{transform:translate(0,0);animation-timing-function:cubic-bezier(.55,0,.85,.55)}96%,100%{transform:translate(40px,-1100px)}}' +
      '.jg-mk{opacity:0}' +
      '.st-error .jg-fall{animation:jg-fall 1.9s both}' +
      '@keyframes jg-fall{0%{opacity:0;transform:translate(0,0) rotate(0);animation-timing-function:cubic-bezier(.5,0,1,1)}6%{opacity:1}' +
      '72%{transform:translate(var(--x),var(--y)) rotate(600deg);animation-timing-function:ease-out}84%{transform:translate(calc(var(--x) * 1.15),calc(var(--y) - 36px)) rotate(680deg);animation-timing-function:ease-in}' +
      '100%{opacity:1;transform:translate(calc(var(--x) * 1.3),var(--y)) rotate(720deg)}}' +
      '.st-error .jg-swing{animation:jg-swing 2.4s ease-in-out both}' +
      '@keyframes jg-swing{0%{opacity:0;transform:rotate(-75deg)}12%{opacity:1}45%{transform:rotate(38deg)}70%{transform:rotate(-22deg)}100%{opacity:1;transform:rotate(12deg)}}' +
      '.st-error .jg-wheel{animation:jg-wheel 2.4s ease-in-out .2s both}' +
      '@keyframes jg-wheel{0%{opacity:0;transform:translate(0,0) rotate(0)}10%,88%{opacity:1}100%{opacity:0;transform:translate(640px,24px) rotate(1080deg)}}' +
      // Web: parrots burst out of the leaves and fly off over the room.
      '.jg-bird{opacity:0}.st-web .jg-bird{animation:jg-fly 2.8s ease-in var(--d) infinite}' +
      '@keyframes jg-fly{0%{opacity:0;transform:translate(0,0) scale(.5)}10%,85%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.2)}}' +
      '.jg-wing{transform-box:fill-box;transform-origin:center}.st-web .jg-wing{animation:jg-flap .2s ease-in-out infinite alternate}@keyframes jg-flap{to{transform:scaleY(.35)}}' +
      // Done: the crystal flashes once, softly, and sparks of jungle fly back into it.
      '.jg-flash{opacity:0}.st-done .jg-flash{animation:jg-flash 2s ease-out .2s both}@keyframes jg-flash{0%{opacity:0}18%{opacity:.32}100%{opacity:0}}' +
      '.jg-mote{opacity:0}.st-done .jg-mote{animation:jg-in 1.7s ease-in var(--d) both}' +
      '@keyframes jg-in{0%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.4)}20%{opacity:.9}100%{opacity:0;transform:translate(0,0) scale(.3)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="jg-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070906"/><stop offset=".55" stop-color="#0e0d09"/><stop offset="1" stop-color="#14100b"/></linearGradient>' +
      '<linearGradient id="jg-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150f09"/><stop offset="1" stop-color="#0a0705"/></linearGradient>' +
      '<linearGradient id="jg-outg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07130f"/><stop offset=".6" stop-color="#0b2017"/><stop offset="1" stop-color="#10301d"/></linearGradient>' +
      '<radialGradient id="jg-ltg"><stop offset="0" stop-color="#d4ecff" stop-opacity=".5"/><stop offset="1" stop-color="#d4ecff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="jg-moong"><stop offset="0" stop-color="#e2efe0" stop-opacity=".35"/><stop offset="1" stop-color="#e2efe0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="jg-mistg"><stop offset="0" stop-color="#8fb89a" stop-opacity=".2"/><stop offset="1" stop-color="#8fb89a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="jg-spill"><stop offset="0" stop-color="#3f8a5a" stop-opacity=".16"/><stop offset="1" stop-color="#3f8a5a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="jg-dglow"><stop offset="0" stop-color="${AMBER}" stop-opacity=".42"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="jg-dust"><stop offset="0" stop-color="#5e5038" stop-opacity=".34"/><stop offset="1" stop-color="#5e5038" stop-opacity="0"/></radialGradient>' +
      `<clipPath id="jg-hole"><path d="M${BREACH.map(([x, y]) => `${x} ${y}`).join('L')}Z"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#jg-wall)"/>' +
      '<g class="jg-room">' +
      // The wall: striped paper, the chair rail, panelled wainscot, the skirting; the floorboards.
      `<path d="${Array.from({ length: 25 }, (_, i) => `M${16 + i * 64} 0V590`).join('')}" stroke="#110f0b" stroke-width="22"/>` +
      '<rect y="596" width="1600" height="116" fill="#0d0a07"/>' +
      `<path d="${panels}" fill="none" stroke="#1c140c" stroke-width="3"/>` +
      '<rect y="586" width="1600" height="11" fill="#21170e"/><path d="M0 587H1600" stroke="#3a2a18" stroke-width="1.6"/>' +
      '<rect y="708" width="1600" height="16" fill="#1a120b"/>' +
      '<rect y="722" width="1600" height="300" fill="url(#jg-floor)"/>' +
      `<path d="${boards}" stroke="#1d150d" stroke-opacity=".8" stroke-width="2"/>` +
      // The hole, and the stormy jungle beyond it.
      '<g clip-path="url(#jg-hole)"><rect x="0" y="140" width="420" height="600" fill="url(#jg-outg)"/>' +
      '<g class="jg-lt"><circle cx="230" cy="250" r="230" fill="url(#jg-ltg)"/>' +
      '<path d="M250 170l-14 46l16 4l-20 54l12 4l-16 40" fill="none" stroke="#e6f6ff" stroke-opacity=".6" stroke-width="2.2" stroke-linejoin="round"/></g>' +
      '<g class="jg-moon"><circle cx="250" cy="270" r="90" fill="url(#jg-moong)"/><circle cx="250" cy="270" r="24" fill="#e2efe0" fill-opacity=".55"/></g>' +
      canopy(330, 50, 70, '#0c2117') +
      '<path d="M70 300C64 420 78 560 70 740M160 340C170 460 154 600 164 740M290 280C282 420 300 560 290 740M360 360C366 480 352 620 360 740" fill="none" stroke="#07140d" stroke-width="12"/>' +
      canopy(420, 60, 90, '#09190f') +
      '<ellipse class="jg-mist" cx="160" cy="600" rx="260" ry="60" fill="url(#jg-mistg)"/>' +
      '<g class="jg-eyes" fill="#e8d24a" fill-opacity=".8"><ellipse class="jg-eye" cx="124" cy="560" rx="4" ry="2.6"/><ellipse class="jg-eye" cx="140" cy="560" rx="4" ry="2.6"/>' +
      '<ellipse class="jg-eye" style="animation-delay:-2.3s" cx="294" cy="486" rx="3.4" ry="2.2"/><ellipse class="jg-eye" style="animation-delay:-2.3s" cx="308" cy="486" rx="3.4" ry="2.2"/></g>' +
      canopy(560, 70, 110, '#06120b') +
      `<path d="${near}" fill="#050f08"/>` +
      `<g class="jg-rain">${rain({ seed: 61, count: 24, length: [34, 64], slant: 220, seconds: 0.7, stroke: '#b4dabd', opacity: 0.36, box: [-20, 140, 440, 600] })}` +
      '</g></g>' +
      // The torn edge of the wall, with broken laths sticking into the hole.
      `<path d="M${BREACH.map(([x, y]) => `${x} ${y}`).join('L')}" fill="none" stroke="#1e140b" stroke-width="14" stroke-linejoin="bevel"/>` +
      `<path d="M${BREACH.map(([x, y]) => `${x} ${y}`).join('L')}" fill="none" stroke="#5a3d22" stroke-opacity=".7" stroke-width="2.4"/>` +
      '<path d="M70 330L104 346M166 158L176 196M298 168L286 204M372 318L338 330M388 420L352 412M38 378L74 384M384 588L350 596" stroke="#24180e" stroke-width="7"/>' +
      '<ellipse cx="220" cy="760" rx="440" ry="120" fill="url(#jg-spill)"/>' +
      // The stampede and the planks it knocks loose.
      herd +
      shards +
      // Vines up the wall, and the leaves pushing in through the hole.
      `<g class="jg-vn" fill="none"><path d="M352 236C400 200 380 140 430 110C470 86 452 40 500 24M96 252C70 200 110 150 84 96C70 60 96 30 90 0" stroke="#1a3d20" stroke-width="7"/>` +
      `<path d="${vineLeaves}" fill="#0f341a" stroke="${RIM}" stroke-opacity=".35"/></g>` +
      BURST.map(([x, y, a, len, w, s], i) => swayLeaf(x, y, a, len, w, s, TONES[i % 3] ?? TONES[0], 4 + (i % 4) * 0.7, -i * 0.9, false)).join('') +
      liana(60, 430, 7, 0) +
      liana(330, 300, 6, -2.4) +
      // The carved drums on the floor.
      `<g class="mv-b">${drum(206, 800, 64, 170, 0)}${drum(336, 852, 46, 124, -0.3)}</g>` +
      fliesLeft +
      // The monkeys of an error: one drops from the ceiling, one swings in on a liana, one cartwheels along the vines.
      '<g transform="translate(300 -40)"><g class="jg-mk jg-fall" style="--x:60px;--y:760px"><g transform="scale(1.6)">' + monkey() + '</g></g></g>' +
      `<g transform="translate(220 0)"><g class="jg-mk jg-swing"><path d="M0 0C10 100 -10 200 0 300" fill="none" stroke="${VINE}" stroke-width="5"/>` +
      '<g transform="translate(0 330) scale(1.5)">' + monkey() + '</g></g></g>' +
      '<g class="mv-t"><g transform="translate(420 70)"><g class="jg-mk jg-wheel"><g transform="scale(1.3)">' + monkey() + '</g></g></g></g>' +
      // The ceiling: a dark cornice, and the vine garland along it.
      '<g class="mv-t"><rect y="-200" width="1600" height="220" fill="#120d08"/><path d="M0 20H1600" stroke="#2a1d12" stroke-width="3"/>' +
      `<g class="jg-gar"><path d="${garVine}" fill="none" stroke="${VINE}" stroke-width="6"/><path d="${garVine}" fill="none" stroke="${VINE_LIT}" stroke-opacity=".6" stroke-width="1.6"/>` +
      `<path d="${garBody}" fill="#0e3018" stroke="${RIM}" stroke-opacity=".28" stroke-width="1.2"/></g>` +
      '<g fill="#6a5232"><circle cx="400" cy="24" r="4"/><circle cx="800" cy="24" r="4"/><circle cx="1200" cy="24" r="4"/></g></g>' +
      // The far right: a painting that rattles in the stampede, lianas, fireflies.
      '<g class="mv-r"><g transform="translate(1268 300)"><g class="jg-pic"><path d="M0 0L-50 30M0 0L50 30" stroke="#3a2a18" stroke-width="2"/>' +
      '<rect x="-66" y="30" width="132" height="100" fill="#0b0a07" stroke="#4e3822" stroke-width="7"/><rect x="-58" y="38" width="116" height="84" fill="#0c130f"/>' +
      '<path d="M-58 122V96L-30 74L-6 92L22 66L58 98V122Z" fill="#081009"/><circle cx="30" cy="56" r="8" fill="#a9b89a" fill-opacity=".3"/>' +
      `<path d="M-70 44C-40 30 -10 70 30 40C50 26 64 40 72 30" fill="none" stroke="${VINE}" stroke-width="4"/></g></g>` +
      `<g class="mv-t">${liana(1540, 240, 6.4, -1)}</g>` +
      fliesRight +
      '</g>' +
      '</g>',
    nook:
      '<defs><radialGradient id="jg-burst"><stop offset="0" stop-color="#6be38b" stop-opacity=".22"/><stop offset="1" stop-color="#6be38b" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="jg-fl"><stop offset="0" stop-color="#d8ffe2" stop-opacity=".9"/><stop offset=".4" stop-color="#6be38b" stop-opacity=".4"/><stop offset="1" stop-color="#6be38b" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="jg-bur" cx="396" cy="292" r="200" fill="url(#jg-burst)"/>' +
      // The jungle erupting out of the board: three thick stems, nine giant leaves, a few curls.
      '<g class="jg-er">' +
      `<g fill="none" stroke-linecap="round"><path d="M404 302C398 270 392 262 392 250C390 228 376 212 372 196C366 160 360 110 356 70C352 40 330 22 318 10M412 302C420 240 412 160 404 90C398 30 400 -40 394 -90C390 -130 370 -150 362 -170M394 -90C404 -140 412 -190 410 -230" stroke="${VINE}" stroke-width="10"/>` +
      `<path d="M404 302C398 270 392 262 392 250C390 228 376 212 372 196C366 160 360 110 356 70M412 302C420 240 412 160 404 90C398 30 400 -40 394 -90" stroke="${VINE_LIT}" stroke-width="2.4"/>` +
      `<path d="M372 196C348 190 340 172 352 162C362 156 368 168 360 172M404 90C428 80 434 60 420 54C410 50 406 62 414 66M356 70C332 74 322 60 332 50" stroke="${VINE_LIT}" stroke-width="2.6"/></g>` +
      ERUPT.map(([x, y, a, len, w, s], i) => swayLeaf(x, y, a, len, w, s, TONES[i % 3] ?? TONES[0], 4.6 + (i % 3) * 0.8, -i * 1.1, true)).join('') +
      '</g>' +
      `<circle class="jg-flash" cx="${ORB[0]}" cy="${ORB[1]}" r="300" fill="url(#jg-fl)"/>` +
      // Done: motes of jungle drawn back into the crystal.
      Array.from({ length: 6 }, (_, i) => {
        const a = -Math.PI * (0.15 + (i / 5) * 0.75)
        const r = 220 + (i % 3) * 90

        return `<circle class="jg-mote" style="--x:${f(Math.cos(a) * r)}px;--y:${f(Math.sin(a) * r)}px;--d:${f(0.15 + i * 0.09)}s" cx="${ORB[0]}" cy="${ORB[1]}" r="5" fill="#b8ffcc"/>`
      }).join('') +
      // Web: parrots out of the leaves.
      [
        ['#d9553a', 0, -330, -470],
        ['#e8b23a', 0.35, -290, -520],
        ['#3fbfa0', 0.7, -350, -420],
        ['#4a8fe0', 1.05, -310, -500],
      ]
        .map(
          ([color, d, x, y]) =>
            `<g class="jg-bird" style="--d:${d}s;--x:${x}px;--y:${y}px">` +
            `<path class="jg-wing" d="M342 60Q350 44 360 58Q370 44 378 60Q368 55 360 66Q352 55 342 60Z" fill="${color}"/></g>`,
        )
        .join('') +
      // Error: a monkey tumbles down out of the leaves.
      '<g transform="translate(330 -420)"><g class="jg-mk jg-fall" style="--x:-30px;--y:610px;animation-delay:.15s"><g transform="scale(1.4)">' + monkey() + '</g></g></g>',
    front:
      // Error: the vine that whips down, coils round the dice and hauls them away.
      '<g class="jg-tend" fill="none" stroke-linecap="round">' +
      `<path d="M250 -560C190 -460 280 -360 220 -250C170 -160 260 -70 214 30C186 100 236 170 214 250C210 284 240 292 236 308C234 330 208 336 207 318C206 306 220 300 226 307" stroke="#1d4f26" stroke-width="9"/>` +
      `<path d="${leaf(232, -300, 60, 40, 20).body}${leaf(214, -60, 50, 36, 18).body}${leaf(226, 160, 50, 30, 16).body}" fill="#165024" stroke="${RIM}" stroke-opacity=".5"/>` +
      '</g>',
  }
}
