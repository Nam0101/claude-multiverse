import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Endless Library: the night librarian at a reading desk under a green-shaded lamp, at the near end of a corridor of
// towering shelves that runs to a vanishing point and never ends. Sconces glow on the pilasters, dust drifts, rolling
// ladders lean on the stacks. When a command runs the books fly off the shelves like a flock and swirl away down the
// corridor; an error tips the near bookcase into the aisle and the shelves behind it lean in like dominoes, spilling
// books; done brings every book home and lights the lamps one by one, all the way into the dark.

// One-point perspective: the eye at (VX, VY). A point `lat` from the corridor's axis, `h` from the eye line and `z`
// bays deep is drawn at VX ± lat·s, VY + h·s, with s = 1 / (1 + z / 2).
const VX = 800
const VY = 372
const BACK = 860
const FACE = 840
const PIL = 790
const TOP = -640
const BOT = 628
const ROWS = [-460, -320, -180, -40, 100, 240, 380, 520] as const
const DARK = '#0a0705'
const WOOD = '#3c2716'
const COVERS = ['#7a3026', '#2e5440', '#2e3c5e', '#86642e', '#5a3c28', '#563050'] as const
const PAGE = '#e8d6b4'
const BRASS = '#b8904a'
const AMBER = '#d9a066'
const LEATHER = '#1f3d2c'
const LEATHER_EDGE = '#2f5a40'
const DESK = '#3a2414'
const DESK_EDGE = '#5a3a20'
// An open book on the wing: pages up, covers as the wing edges, the spine at its own origin.
const BIRD = 'M0 6-30-8-28-20 0-6 28-20 30-8Z'
const LEFT_SWIRL: readonly [number, number] = [290, 420]
const RIGHT_SWIRL: readonly [number, number] = [1340, 270]

const sAt = (z: number): number => 1 / (1 + 0.5 * z)
const X = (side: number, lat: number, z: number): number => VX + side * lat * sAt(z)
const Y = (h: number, z: number): number => VY + h * sAt(z)
/** How much of a thing's own colour survives at depth z: the lamps light the near bays, the far ones go dark. */
const lightAt = (z: number): number => Math.min(1, 1.3 * sAt(z)) ** 1.3
const n = (v: number): string => String(Math.round(v))
const cover = (i: number): string => COVERS[i % COVERS.length] ?? COVERS[0]

/** A strip of a wall at lateral `lat`, from depth z1 to z2 and height h1 to h2. */
function quad(side: number, lat: number, z1: number, z2: number, h1: number, h2: number): string {
  const a = X(side, lat, z1)
  const b = X(side, lat, z2)

  return `M${n(a)} ${n(Y(h1, z1))}L${n(b)} ${n(Y(h1, z2))}V${n(Y(h2, z2))}L${n(a)} ${n(Y(h2, z1))}Z`
}

/** The pilaster at bay k's near edge: the face toward the viewer and the face toward the aisle. */
function pilaster(side: number, k: number): { front: string; inner: string } {
  const z = k - 0.05
  const a = X(side, BACK, z)

  return {
    front: `M${n(a)} ${n(Y(TOP - 30, z))}H${n(X(side, PIL, z))}V${n(Y(BOT, z))}H${n(a)}Z`,
    inner: quad(side, PIL, z, k + 0.05, TOP - 30, BOT),
  }
}

/** How lit a lamp is while nothing happens: the near ones glow, the corridor fades into the dark. */
const LAMP_ON = [0, 1, 0.95, 0.85, 0.7, 0.55, 0.4, 0.28, 0.16] as const

/** The sconce on pilaster k: its bracket and shade, and its glow (with a pool on the floor for the near ones). */
function lamp(side: number, k: number): { shade: string; glow: string } {
  const s = sAt(k)
  const cx = X(side, PIL - 34, k)
  const cy = Y(-300, k)
  const wx = X(side, PIL + 20, k)
  const vars = `--k:${k};--o:${LAMP_ON[k] ?? 0}`
  const pool =
    k <= 4
      ? `<ellipse class="lb-lp" style="${vars}" cx="${n(X(side, 690, k))}" cy="${n(Y(BOT - 20, k))}" rx="${n(44 * s)}" ry="${n(120 * s)}" fill="url(#lb-rf)"/>`
      : ''

  return {
    shade: `M${n(wx)} ${n(cy + 3 * s)}H${n(cx)}M${n(cx - 15 * s)} ${n(cy - 16 * s)}h${n(30 * s)}l${n(-7 * s)} ${n(24 * s)}h${n(-16 * s)}Z`,
    glow: `<circle class="lb-lp" style="${vars}" cx="${n(cx)}" cy="${n(cy)}" r="${n(230 * s)}" fill="url(#lb-lg)"/>${pool}`,
  }
}

type Slot = { x: number; y: number; w: number; h: number; ci: number; c: string; z: number; row: number }

/**
 * One bay of shelving, z from k to k + 1: the dark back, the books (vertical spines in perspective, one path per
 * cover and thickness), the boards with their lit edges, and the pilaster with its lamp. `take` claims some books
 * as fliers, which are drawn apart so they can leave.
 */
function bay(side: number, k: number, next: () => number, take?: (slot: Slot) => boolean): string {
  const lit = lightAt(k + 0.5)
  const perZ = FACE * 0.5 * sAt(k + 0.5) ** 2
  const sizes = k < 2 ? [0.055, 0.085] : k < 3 ? [0.065, 0.1] : [0.15]
  // Each cover and thickness is one path of spines, every spine a move from the last one's top.
  const paths = new Map<string, { d: string; x: number; y: number }>()

  ROWS.forEach((hb, row) => {
    let z = k + 0.07

    for (;;) {
      const si = Math.floor(next() * sizes.length)
      const t = sizes[si] ?? 0.1

      if (z + t > k + 0.95) {
        break
      }

      if (next() < 0.06) {
        z += 0.03 + next() * 0.05
        continue
      }

      const zc = z + t / 2
      const ci = Math.floor(next() * COVERS.length)
      const bh = 78 + next() * 44
      const x = X(side, FACE, zc)
      const yb = Y(hb, zc)
      const yt = Y(hb - bh, zc)

      z += t + 0.004

      // Off the picture, or behind the desk on the right.
      if (x < -14 || x > 1614 || yb < -6 || (side > 0 && x > 1250 && yt > 820)) {
        continue
      }

      const c = mix(DARK, cover(ci), lit)

      if (take?.({ x, y: (yb + yt) / 2, w: perZ * t * 0.9, h: yb - yt, ci, c, z: zc, row }) === true) {
        continue
      }

      const key = `${ci} ${si}`
      const [bx, by, ty] = [Math.round(x), Math.round(yb), Math.round(yt)]
      const last = paths.get(key)

      paths.set(key, {
        d: last === undefined ? `M${bx} ${by}v${ty - by}` : `${last.d}m${bx - last.x} ${by - last.y}v${ty - by}`,
        x: bx,
        y: ty,
      })
    }
  })

  let books = ''

  for (const [key, { d }] of paths) {
    const [ci, si] = key.split(' ').map(Number)

    books += `<path d="${d}" stroke="${mix(DARK, cover(ci ?? 0), lit)}" stroke-width="${f(perZ * (sizes[si ?? 0] ?? 0.1) * 0.9)}"/>`
  }

  const cornice = `<path d="${quad(side, FACE, k, k + 1, TOP, TOP + 50)}" fill="${mix(DARK, WOOD, lit)}"/>`
  // Near bays draw their boards as tapering strips; deeper ones as lines of the bay's mean thickness.
  const boards =
    k < 2
      ? `<path d="${ROWS.map(hb => quad(side, FACE, k, k + 1, hb, hb + 13)).join('')}" fill="${mix(DARK, WOOD, lit)}"/>`
      : `<path d="${ROWS.map(hb => `M${n(X(side, FACE, k))} ${n(Y(hb + 6, k))}L${n(X(side, FACE, k + 1))} ${n(Y(hb + 6, k + 1))}`).join('')}" stroke="${mix(DARK, WOOD, lit)}" stroke-width="${f(13 * sAt(k + 0.5))}"/>`

  const edges = k < 2 ? ROWS.map(hb => `M${f(X(side, FACE, k))} ${f(Y(hb, k))}L${f(X(side, FACE, k + 1))} ${f(Y(hb, k + 1))}`).join('') : ''
  let post = ''

  if (k > 0) {
    const p = pilaster(side, k)
    const l = lamp(side, k)
    const pl = lightAt(k)

    post = `<path d="${p.front}" fill="${mix(DARK, '#55392a', pl)}"/><path d="${p.inner}" fill="${mix(DARK, '#26180e', pl)}"/><path d="${l.shade}" fill="#6a4622" stroke="#3a2818" stroke-width="${f(4 * sAt(k))}"/>${l.glow}`
  }

  return (
    `<g fill="none">${books}</g>` +
    boards +
    cornice +
    (edges === '' ? '' : `<path d="${edges}" stroke="${mix(DARK, '#8a6236', lit)}" stroke-width="${f(2.4 * sAt(k))}"/>`) +
    post
  )
}

/** The corridor beyond bay 6: shelves as bands with spines ruled across, pilasters, the lamps, a fade into the dark. */
function farWall(side: number, next: () => number): { wall: string; glows: string } {
  const lit = lightAt(6)
  let bands = ''
  let boards = quad(side, FACE, 6, 60, TOP, TOP + 50) + quad(side, FACE, 6, 60, 532, BOT)
  let seps = ''
  let fronts = ''
  let inners = ''
  let shades = ''
  let glows = ''

  for (const hb of ROWS) {
    bands += quad(side, FACE, 6, 60, hb - 108, hb)
    boards += quad(side, FACE, 6, 60, hb, hb + 13)
  }

  for (let z = 6.06; z < 12; z += 0.1 + next() * 0.14) {
    seps += `M${n(X(side, FACE, z))} ${n(Y(TOP, z))}V${n(Y(BOT, z))}`
  }

  for (let k = 6; k <= 16; k += 1) {
    const p = pilaster(side, k)

    fronts += p.front
    inners += p.inner

    if (k <= 13) {
      const l = lamp(side, k)

      shades += l.shade
      glows += l.glow
    }
  }

  return {
    wall:
      `<path d="${quad(side, FACE, 6, 60, TOP, BOT)}" fill="${mix(DARK, '#170f0a', lit)}"/>` +
      `<path d="${bands}" fill="${mix(DARK, '#4e3024', lit)}"/>` +
      `<path d="${seps}" stroke="${DARK}" stroke-width="1.4"/>` +
      `<path d="${boards}" fill="${mix(DARK, WOOD, lit)}"/>` +
      `<path d="${inners}" fill="${mix(DARK, '#26180e', lit)}"/><path d="${fronts}" fill="${mix(DARK, '#55392a', lit)}"/><path d="${shades}" fill="#4a3018"/>` +
      `<path d="${quad(side, 900, 6, 80, TOP - 60, BOT + 4)}" fill="url(#lb-f${side < 0 ? 'L' : 'R'})"/>`,
    glows,
  }
}

/** A rolling ladder leaning on a wall between depths z1 and z2, its hooks on the brass rail, wheels on the floor. */
function ladder(side: number, z1: number, z2: number): string {
  const at = (z: number, u: number): [number, number] => [X(side, 830 - 140 * u, z), Y(-540 + (BOT + 540) * u, z)]
  const [a0, a1] = [at(z1, 0), at(z1, 1)]
  const [b0, b1] = [at(z2, 0), at(z2, 1)]
  const s = sAt((z1 + z2) / 2)
  let rungs = ''

  for (let u = 0.06; u < 0.96; u += 0.068) {
    const p = at(z1, u)
    const q = at(z2, u)

    rungs += `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`
  }

  return (
    `<g class="lb-lad"><path d="${rungs}" stroke="#4a301c" stroke-width="${f(5 * s)}"/>` +
    `<path d="M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}M${f(b0[0])} ${f(b0[1])}L${f(b1[0])} ${f(b1[1])}" stroke="#5a3a22" stroke-width="${f(9 * s)}" stroke-linecap="round"/>` +
    `<path d="M${f(a0[0])} ${f(a0[1])}L${f(a1[0])} ${f(a1[1])}" stroke="#8a6236" stroke-opacity=".5" stroke-width="${f(2.4 * s)}"/>` +
    `<g fill="#1a110a" stroke="${BRASS}" stroke-opacity=".6" stroke-width="${f(2 * s)}"><circle cx="${f(a1[0])}" cy="${f(a1[1] - 8 * s)}" r="${f(11 * s)}"/><circle cx="${f(b1[0])}" cy="${f(b1[1] - 8 * s)}" r="${f(11 * s)}"/></g>` +
    `<path d="M${f(a0[0])} ${f(a0[1])}l${f(-side * 10 * s)} ${f(-12 * s)}M${f(b0[0])} ${f(b0[1])}l${f(-side * 10 * s)} ${f(-12 * s)}" stroke="${BRASS}" stroke-width="${f(4 * s)}" stroke-linecap="round"/></g>`
  )
}

const rail = (side: number, z1: number, z2: number): string =>
  `<path d="M${f(X(side, 835, z1))} ${f(Y(-552, z1))}L${f(X(side, 835, z2))} ${f(Y(-552, z2))}" stroke="${BRASS}" stroke-opacity=".55" stroke-width="3.4"/>`

/**
 * A flock: the books claimed from the near shelves, each placed in a ring around the swirl's center. At rest each one
 * is shifted back to its slot on the shelf (--gx, --gy). Run lets them fly into the ring, which turns and sinks to the
 * vanishing point; done plays that backwards. Each book also knows where it lands on the floor when it falls.
 */
function flock(slots: readonly Slot[], c: readonly [number, number], tag: 'L' | 'R', next: () => number): string {
  const birds = slots
    .map((b, i) => {
      const a = Math.atan2(b.y - c[1], b.x - c[0]) + (next() - 0.5) * 0.9
      const r = 60 + next() * 150
      const fx = Math.cos(a) * r
      const fy = Math.sin(a) * r
      let style = `--gx:${n(b.x - c[0] - fx)}px;--gy:${n(b.y - c[1] - fy)}px`

      if (tag === 'L') {
        const lx = X(-1, 560 + next() * 220, b.z)
        const ly = Y(BOT, b.z) - 4 - next() * 12

        style +=
          `;--hx:${n(lx - c[0] - fx)}px;--hy:${n(ly - c[1] - fy)}px;--hr:${n(70 + next() * 50)}deg` +
          `;--e:${f(0.25 + (b.z - 0.3) * 0.4 + b.row * 0.035 + next() * 0.12)}s`
      }

      const extra = (tag === 'L' ? ' lb-fall' : '') + (i === 3 ? ' lb-pull' : '')

      return (
        `<g transform="translate(${n(fx)} ${n(fy)})"><g class="lb-u${tag}"><g class="lb-ga lb-w${i % 3}${extra}" style="${style}">` +
        `<rect class="lb-sp" x="${f(-b.w / 2)}" y="${f(-b.h / 2)}" width="${f(b.w)}" height="${f(b.h)}" fill="${b.c}"/>` +
        `<path class="lb-bird" d="${BIRD}" stroke="${cover(b.ci)}"/></g></g></g>`
      )
    })
    .join('')

  return `<g class="lb-d${tag}"><g transform="translate(${c[0]} ${c[1]})"><g class="lb-s${tag}">${birds}</g></g></g>`
}

/** The leaning matrix that tips the left wall into the aisle by `t` radians around its foot on the floor. */
const tip = (t: number): string => `matrix(${(1 - 0.7476 * t).toFixed(3)},0,${(-t).toFixed(3)},1,${f(970.1 * t)},0)`

// The flight: books leave in three waves, gather in the ring, and the ring turns and sinks into the corridor.
const WAVES = [0, 1, 2]
  .map(w => {
    const a = 1 + w * 4
    const b = a + 7

    return (
      `@keyframes lb-g${w}{0%,${a}%{transform:translate(var(--gx),var(--gy));animation-timing-function:cubic-bezier(.4,0,.2,1)}${b}%,100%{transform:translate(0,0)}}` +
      `@keyframes lb-h${w}{0%,${a + 1}%{opacity:1}${a + 2}%,100%{opacity:0}}` +
      `@keyframes lb-v${w}{0%,${a + 1}%{opacity:0}${a + 2}%,100%{opacity:1}}`
    )
  })
  .join('')

const turn = (name: string, deg: number): string =>
  `@keyframes ${name}{0%,14%{transform:rotate(0);animation-timing-function:cubic-bezier(.3,0,.6,1)}100%{transform:rotate(${deg}deg)}}`

function fly(state: string, how: string): string {
  const s = `.st-${state}`

  return (
    `${s} .lb-dL,${s} .lb-dR{animation:lb-dp ${how}}` +
    `${s} .lb-sL{animation:lb-sL ${how}}${s} .lb-uL{animation:lb-uL ${how}}${s} .lb-sR{animation:lb-sR ${how}}${s} .lb-uR{animation:lb-uR ${how}}` +
    [0, 1, 2]
      .map(
        w =>
          `${s} .lb-w${w}{animation:lb-g${w} ${how}}${s} .lb-w${w} .lb-sp{animation:lb-h${w} ${how}}` +
          `${s} .lb-w${w} .lb-bird{animation:lb-v${w} ${how},lb-flap .3s ease-in-out infinite alternate}`,
      )
      .join('')
  )
}

function device(light: string): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${250 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')

  return (
    '<rect x="246" y="323" width="92" height="7" rx="2" fill="#2e1c10"/>' +
    keys +
    // The lid, bound in oxblood leather with gilt corners; the screen faces Claude.
    '<path d="M330 328L354 236L367 239L343 330Z" fill="#5a2418" stroke="#7a3a24" stroke-width="1.2" stroke-linejoin="round"/>' +
    `<path d="M351 251L362 254M335 314L346 317" stroke="${AMBER}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M331 325L353 241L357 242L335 327Z" fill="${light}"/>` +
    `<path d="M331 325L353 241L340 245L321 325Z" fill="${light}" fill-opacity=".16"/>` +
    // Two books under the lamp.
    `<rect x="356" y="319" width="64" height="11" rx="1.5" fill="#24452f"/><path d="M356 322.5H420" stroke="${AMBER}" stroke-opacity=".5" stroke-width="1.4"/>` +
    `<rect x="362" y="309" width="56" height="10" rx="1.5" fill="#6e2a22"/><path d="M368 309V319M410 309V319" stroke="${AMBER}" stroke-opacity=".55" stroke-width="1.6"/>` +
    // The banker's lamp: brass foot and stem, a green glass shade, its warm light on the books.
    '<path d="M366 268H418L428 309H356Z" fill="#ffd890" fill-opacity=".12"/>' +
    `<path d="M378 309Q378 300 392 299Q406 300 406 309Z" fill="${BRASS}"/><rect x="390" y="262" width="4" height="38" fill="${BRASS}"/>` +
    '<path d="M362 268Q364 246 392 244Q420 246 422 268Z" fill="#2f7a4c" stroke="#1d4a2e" stroke-width="1.5"/>' +
    '<path d="M370 258Q378 250 392 249" fill="none" stroke="#9fe0b8" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>' +
    `<path d="M362 268H422" stroke="${BRASS}" stroke-width="2.6"/><path d="M369 270.5H415" stroke="#fff0c8" stroke-opacity=".85" stroke-width="2"/>` +
    `<path d="M410 270V286" stroke="${BRASS}" stroke-width="1.2"/><circle cx="410" cy="288" r="2.2" fill="${BRASS}"/>`
  )
}

export function libraryEndlessWorld(): World {
  const next = random(1913)
  const leftSlots: Slot[] = []
  const rightSlots: Slot[] = []
  const taker = (list: Slot[], max: number, p: number, yMin: number, yMax: number): ((slot: Slot) => boolean) => {
    let rest = false

    return slot => {
      if (rest) {
        rest = false

        return false
      }

      if (list.length >= max || slot.y < yMin || slot.y > yMax || slot.x < 24 || slot.x > 1576 || next() > p) {
        return false
      }

      list.push(slot)
      rest = true

      return true
    }
  }

  const farL = farWall(-1, next)
  const farR = farWall(1, next)
  const backing = [-1, 1]
    .map(side => `<path d="${quad(side, FACE, 0, 6, TOP, BOT)}" fill="#140d09"/><path d="${quad(side, FACE, 0, 6, 532, BOT)}" fill="${mix(DARK, WOOD, 0.6)}"/>`)
    .join('')
  const mid = [5, 4, 3, 2].map(k => `<g class="lb-t${k}">${bay(-1, k, next)}</g>${bay(1, k, next)}`).join('')
  const takeL = taker(leftSlots, 15, 0.13, 70, 930)
  const nearL = bay(-1, 1, next, takeL) + bay(-1, 0, next, takeL)
  const takeR = taker(rightSlots, 12, 0.15, 30, 560)
  const nearR = bay(1, 1, next, takeR) + bay(1, 0, next, takeR)

  const ribs = Array.from({ length: 12 }, (_, i) => {
    const k = i + 1
    const s = sAt(k)
    const y = Y(TOP - 30, k)

    return `<path d="M${n(X(-1, PIL, k))} ${n(y)}Q800 ${n(Y(TOP - 490, k))} ${n(X(1, PIL, k))} ${n(y)}" stroke="${mix(DARK, '#3c2716', lightAt(k))}" stroke-width="${f(30 * s)}"/>`
  }).join('')
  const boards = Array.from({ length: 27 }, (_, i) => `M800 372L${800 + (i - 13) * 64} 1000`).join('')
  const seams = Array.from({ length: 10 }, (_, i) => `M${f(X(-1, PIL, i + 1))} ${f(Y(BOT, i + 1))}H${f(X(1, PIL, i + 1))}`).join('')
  const motes = Array.from({ length: 22 }, (_, i) => {
    const right = i >= 15
    const x = right ? 1200 + next() * 360 : 30 + next() * 370
    const y = right ? 60 + next() * 440 : 60 + next() * 760

    return (
      `<circle class="lb-mt" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.8)}" ` +
      `style="--t:${f(7 + next() * 7)}s;--mx:${f((next() - 0.5) * 60)}px;--my:${f(-20 - next() * 50)}px;animation-delay:${f(-next() * 10)}s"/>`
    )
  }).join('')
  const pages = ([
    [180, 120],
    [330, 60],
    [90, 280],
    [1300, 40],
    [1460, 140],
  ] as const)
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y})"><path class="lb-pg" style="--px:${f((next() - 0.5) * 140)}px;--pr:${f(120 + next() * 160)}deg;animation-delay:${f(-i * 0.9)}s" d="M-8 -11h16v22h-16z"/></g>`,
    )
    .join('')
  const puffs = ([
    [150, 940, 90, 0.75],
    [300, 860, 80, 0.9],
    [420, 770, 64, 1.05],
    [60, 990, 70, 0.8],
  ] as const)
    .map(([x, y, r, d]) => `<circle class="lb-pf" style="--e:${d}s" cx="${x}" cy="${y}" r="${r}" fill="url(#lb-pf)"/>`)
    .join('')
  const pile = ([
    [-2, 440, 58, 16, 2],
    [4, 424, 50, 16, 0],
    [0, 410, 54, 14, 3],
    [6, 396, 46, 14, 1],
    [2, 381, 52, 15, 4],
    [8, 368, 42, 13, 5],
  ] as const)
    .map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${mix(DARK, cover(c), 0.8)}"/><path d="M${x + 6} ${y}v${h}" stroke="${AMBER}" stroke-opacity=".5" stroke-width="1.6"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#070403',
      furniture: '#2a1a10',
      metal: '#2e1c10',
      paper: PAGE,
      light: { idle: '#b08440', work: '#e2ae68', bright: '#ffe2b4' },
      headTop: 238,
      glowAt: [343, 282],
      device,
      wear: {
        // A pencil tucked behind the head.
        behind:
          '<path d="M198 252L222 204L229 208L205 256Z" fill="#d9a63a"/><path d="M222 204L231 190L229 208Z" fill="#e8cfa0"/><path d="M229 193L231 190L230.5 196Z" fill="#2a2420"/>',
        // Half-moon reading glasses on a chain, clear of the eyes' colour, and a knitted scarf.
        front:
          '<path d="M68 318H232V333H68Z" fill="#7a2a26"/><path d="M68 322.5H232M68 329H232" stroke="#c99a4a" stroke-opacity=".55" stroke-width="2"/>' +
          '<path d="M104 331H120L123 376H107Z" fill="#7a2a26"/><path d="M109 376v6M114 376v6M119 376v6" stroke="#7a2a26" stroke-width="2"/>' +
          '<g fill="#fff6e0" fill-opacity=".12" stroke="#e0b878" stroke-width="2.4" stroke-linejoin="round">' +
          '<path d="M128 296H156Q156 312 142 312Q128 312 128 296Z"/><path d="M176 296H204Q204 312 190 312Q176 312 176 296Z"/></g>' +
          '<path d="M156 298Q166 292 176 298M128 297L74 292M204 297L228 294" fill="none" stroke="#e0b878" stroke-width="2.2"/>' +
          '<path d="M74 293Q70 322 92 340" fill="none" stroke="#e0b878" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="2 2.4"/>',
      },
      seatArt:
        // A tall wingback reading chair in bottle-green leather: a camel-back crest well above Claude, flared wings,
        // a buttoned back, brass nails and bun feet.
        `<path d="M44 358V214C44 190 58 176 82 172Q150 152 218 172C242 176 256 190 256 214V358Z" fill="${LEATHER}" stroke="${LEATHER_EDGE}" stroke-width="2.4"/>` +
        '<path d="M64 182Q150 160 236 182" fill="none" stroke="#4a8a62" stroke-opacity=".55" stroke-width="2.4"/>' +
        `<path d="M44 222C24 220 18 246 22 276C26 304 40 314 48 310ZM256 222C276 220 282 246 278 276C274 304 260 314 252 310Z" fill="${LEATHER}" stroke="${LEATHER_EDGE}" stroke-width="2.4"/>` +
        '<path d="M70 190L90 206L110 190L130 206L150 188L170 206L190 190L210 206L230 190M56 230L72 214M244 230L228 214" fill="none" stroke="#0f2318" stroke-opacity=".7" stroke-width="1.6"/>' +
        '<g fill="#0c1c13"><circle cx="90" cy="206" r="2.6"/><circle cx="130" cy="206" r="2.6"/><circle cx="170" cy="206" r="2.6"/><circle cx="210" cy="206" r="2.6"/><circle cx="110" cy="190" r="2.6"/><circle cx="150" cy="188" r="2.6"/><circle cx="190" cy="190" r="2.6"/><circle cx="56" cy="246" r="2.6"/><circle cx="244" cy="246" r="2.6"/></g>' +
        `<rect x="40" y="348" width="222" height="26" rx="9" fill="#24452f" stroke="${LEATHER_EDGE}" stroke-width="2"/>` +
        '<path d="M46 374H256V416H46Z" fill="#17301f"/>' +
        `<path d="M52 381H250" stroke="${BRASS}" stroke-width="2.4" stroke-dasharray="1.5 6" stroke-linecap="round"/>` +
        '<g fill="#2a1a10"><rect x="54" y="416" width="18" height="40" rx="6"/><rect x="232" y="416" width="18" height="40" rx="6"/></g>',
      tableArt:
        // The reading desk: green leather top with a tooled edge, three drawers, turned legs, books stacked beneath.
        '<rect x="158" y="326" width="318" height="7" rx="2" fill="#24452f"/>' +
        `<path d="M164 329.5H470" stroke="${AMBER}" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="5 3"/>` +
        `<rect x="154" y="332" width="326" height="11" rx="2" fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="1.5"/>` +
        '<rect x="166" y="343" width="302" height="36" fill="#28180d" stroke="#4a2f1a" stroke-width="1.5"/>' +
        '<path d="M266 345V377M368 345V377" stroke="#4a2f1a" stroke-width="2"/>' +
        `<g fill="${BRASS}"><rect x="207" y="358" width="18" height="4" rx="2"/><rect x="308" y="358" width="18" height="4" rx="2"/><rect x="409" y="358" width="18" height="4" rx="2"/></g>` +
        `<g fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="1.5"><path d="M174 379H192L188 398Q198 412 188 426L192 456H174L178 426Q168 412 178 398Z"/><path d="M440 379H458L454 398Q464 412 454 426L458 456H440L444 426Q434 412 444 398Z"/></g>` +
        '<rect x="270" y="440" width="96" height="16" rx="2" fill="#2e3c5e"/><rect x="278" y="426" width="82" height="14" rx="2" fill="#7a3026"/><rect x="286" y="414" width="70" height="12" rx="2" fill="#86642e"/>' +
        `<path d="M282 440v16M290 426v14M298 414v12M350 426v14" stroke="${AMBER}" stroke-opacity=".5" stroke-width="1.6"/>`,
    },
    style:
      // The lamps: each holds its own level (--o); idle breathes, thinking dims, web runs a pulse down the corridor,
      // done lights them one by one from the nearest into the dark.
      '.lb-lp{opacity:var(--o);transform-box:fill-box;transform-origin:center}' +
      '.st-idle .lb-lp{animation:lb-br 5s ease-in-out infinite alternate}@keyframes lb-br{to{opacity:calc(var(--o) * .82)}}' +
      '.st-thinking .lb-lp{animation:lb-th 3s ease-in-out infinite alternate}@keyframes lb-th{to{opacity:calc(var(--o) * .6)}}' +
      '.st-web .lb-lp{animation:lb-ws 2s ease-in-out infinite;animation-delay:calc(var(--k) * .1s)}@keyframes lb-ws{0%,60%,100%{opacity:var(--o)}22%{opacity:1}}' +
      '.st-done .lb-lp{animation:lb-on .6s ease-out both;animation-delay:calc(.15s + var(--k) * .15s)}' +
      '@keyframes lb-on{0%{opacity:var(--o)}50%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}' +
      '.lb-inf{opacity:0}.st-done .lb-inf{animation:lb-in 1.6s ease-out 2.3s both}@keyframes lb-in{to{opacity:1}}' +
      // Dust in the lamplight; loose pages fall while Claude writes.
      '.lb-mt{animation:lb-mt var(--t) ease-in-out infinite alternate}@keyframes lb-mt{from{transform:translate(0,0);opacity:.15}to{transform:translate(var(--mx),var(--my));opacity:.6}}' +
      '.st-thinking .lb-mt{animation-duration:3s}' +
      '.lb-pg{opacity:0}.st-responding .lb-pg{animation:lb-pg 4.5s linear infinite}' +
      '@keyframes lb-pg{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.75}50%{transform:translate(var(--px),260px) rotate(var(--pr))}90%{opacity:.6}100%{opacity:0;transform:translate(0,520px) rotate(calc(var(--pr) * 2))}}' +
      // The ladders roll along their rails (deeper into the picture) while a tool works.
      '.lb-lad{transform-origin:800px 372px}.st-tool .lb-lad{animation:lb-roll 2.2s ease-in-out infinite alternate}@keyframes lb-roll{to{transform:scale(.88)}}' +
      // The flock.
      '.lb-ga{transform:translate(var(--gx),var(--gy))}.lb-bird{opacity:0;fill:#e8d6b4;stroke-width:4.5;stroke-linejoin:round}' +
      '.lb-dL,.lb-dR{transform-origin:800px 372px}' +
      '@keyframes lb-dp{0%,14%{transform:scale(1);opacity:1;animation-timing-function:cubic-bezier(.45,0,.85,.6)}100%{transform:scale(.03);opacity:0}}' +
      turn('lb-sL', 400) +
      turn('lb-uL', -400) +
      turn('lb-sR', -400) +
      turn('lb-uR', 400) +
      WAVES +
      '@keyframes lb-flap{from{transform:scaleY(1)}to{transform:scaleY(-.5)}}' +
      fly('run', '5s linear infinite') +
      fly('done', '3.4s linear reverse both') +
      '.st-read .lb-pull{animation:lb-pull 1.2s ease-out both}@keyframes lb-pull{to{transform:translate(calc(var(--gx) - 14px),calc(var(--gy) + 4px)) rotate(-12deg)}}' +
      // The error: the near bookcase tips into the aisle, the bays behind it follow like dominoes, books fall, dust.
      `.st-error .lb-t1{animation:lb-t1 1.5s ease-in .1s both}@keyframes lb-t1{0%{transform:none}28%{transform:${tip(0.15)};animation-timing-function:ease-out}42%{transform:${tip(0.105)}}58%{transform:${tip(0.135)}}76%{transform:${tip(0.118)}}100%{transform:${tip(0.125)}}}` +
      [2, 3, 4, 5]
        .map(k => {
          const a = 0.1 - (k - 2) * 0.012

          return `.st-error .lb-t${k}{animation:lb-t${k} 1.1s ease-in ${f(0.45 + (k - 2) * 0.18)}s both}@keyframes lb-t${k}{0%{transform:none}35%{transform:${tip(a * 1.25)};animation-timing-function:ease-out}62%{transform:${tip(a * 0.85)}}100%{transform:${tip(a)}}}`
        })
        .join('') +
      '.st-error .lb-fall{animation:lb-fall 1s cubic-bezier(.55,0,.9,.6) var(--e) both}' +
      '@keyframes lb-fall{from{transform:translate(var(--gx),var(--gy))}to{transform:translate(var(--hx),var(--hy)) rotate(var(--hr))}}' +
      '.lb-pf{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .lb-pf{animation:lb-pf 1.8s ease-out var(--e) both}' +
      '@keyframes lb-pf{0%{opacity:0;transform:scale(.3)}25%{opacity:.55}100%{opacity:0;transform:scale(1.7)}}',
    scenery:
      '<defs>' +
      `<linearGradient id="lb-cg" gradientUnits="userSpaceOnUse" x1="0" y1="-60" x2="0" y2="372"><stop offset="0" stop-color="#170f0a"/><stop offset="1" stop-color="${DARK}"/></linearGradient>` +
      `<linearGradient id="lb-fg" gradientUnits="userSpaceOnUse" x1="0" y1="372" x2="0" y2="1000"><stop offset="0" stop-color="${DARK}"/><stop offset="1" stop-color="#24170e"/></linearGradient>` +
      '<linearGradient id="lb-cp" gradientUnits="userSpaceOnUse" x1="0" y1="372" x2="0" y2="1000"><stop offset="0" stop-color="#0e0605"/><stop offset="1" stop-color="#3c1510"/></linearGradient>' +
      '<radialGradient id="lb-lg"><stop offset="0" stop-color="#fff0c8" stop-opacity=".95"/><stop offset=".05" stop-color="#ffd890" stop-opacity=".8"/><stop offset=".14" stop-color="#ffb85a" stop-opacity=".3"/><stop offset=".45" stop-color="#e08a3a" stop-opacity=".1"/><stop offset="1" stop-color="#e08a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lb-rf"><stop offset="0" stop-color="#ffb860" stop-opacity=".26"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="lb-vd"><stop offset="0" stop-color="${DARK}"/><stop offset=".5" stop-color="${DARK}" stop-opacity=".85"/><stop offset="1" stop-color="${DARK}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="lb-fL" gradientUnits="userSpaceOnUse" x1="${f(X(-1, FACE, 6))}" y1="0" x2="800" y2="0"><stop offset="0" stop-color="${DARK}" stop-opacity="0"/><stop offset=".5" stop-color="${DARK}" stop-opacity=".7"/><stop offset="1" stop-color="${DARK}"/></linearGradient>` +
      `<linearGradient id="lb-fR" gradientUnits="userSpaceOnUse" x1="${f(X(1, FACE, 6))}" y1="0" x2="800" y2="0"><stop offset="0" stop-color="${DARK}" stop-opacity="0"/><stop offset=".5" stop-color="${DARK}" stop-opacity=".7"/><stop offset="1" stop-color="${DARK}"/></linearGradient>` +
      '<radialGradient id="lb-pf"><stop offset="0" stop-color="#9a8a72" stop-opacity=".5"/><stop offset="1" stop-color="#9a8a72" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lb-ig"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".32"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The vaulted ceiling with its ribs, and the polished floor with the runner down the middle.
      '<rect y="-200" width="1600" height="572" fill="url(#lb-cg)"/><rect y="372" width="1600" height="700" fill="url(#lb-fg)"/>' +
      `<g fill="none">${ribs}</g>` +
      `<path d="${boards}" stroke="#000" stroke-opacity=".32" stroke-width="1.5"/><path d="${seams}" stroke="#000" stroke-opacity=".4" stroke-width="2"/>` +
      '<path d="M556 1000L800 372L1044 1000Z" fill="url(#lb-cp)"/>' +
      `<path d="M588 1000L800 372L1012 1000M612 1000L800 372L988 1000" fill="none" stroke="${AMBER}" stroke-opacity=".16" stroke-width="2"/>` +
      // The corridor far away, the dark where it ends, and the far lamps over it.
      farL.wall +
      farR.wall +
      '<circle cx="800" cy="372" r="190" fill="url(#lb-vd)"/>' +
      '<circle class="lb-inf" cx="800" cy="372" r="140" fill="url(#lb-ig)"/>' +
      farL.glows +
      farR.glows +
      // The middle bays, far to near; the left ones lean in turn on an error.
      backing +
      mid +
      // The near left bookcase with its ladder and its flock, and the near right one behind the desk.
      `<g class="lb-t1">${nearL}${rail(-1, 0, 2.2)}${ladder(-1, 1.2, 1.45)}${flock(leftSlots, LEFT_SWIRL, 'L', next)}</g>` +
      nearR +
      rail(1, 0, 2.2) +
      ladder(1, 0.55, 0.8) +
      flock(rightSlots, RIGHT_SWIRL, 'R', next) +
      puffs +
      `<g fill="#ffd9a0">${motes}</g>` +
      `<g fill="${PAGE}">${pages}</g>`,
    nook:
      // A tottering pile of books on the floor beside the chair.
      pile,
  }
}
