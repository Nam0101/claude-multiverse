import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Old Quarter: Hanoi's old streets at night. Tube houses with tile roofs, louvred shutters and caged balconies, a
// tangle of cables on every pole, silk and star lanterns, parked motorbikes, and Claude in a conical hat on a tiny
// plastic stool at a sidewalk tea stall, a glass of iced tea by the laptop. On the left the train street runs off
// between the houses: when a command runs a train squeezes down it toward us, its headlight sweeping the walls. A
// busy tool brings a flood of motorbikes; an error sparks the wires and a block goes dark; done lights every lantern.
const AMBER = '#f2b544'
const HOT = '#ffe2a6'
const WIRE = '#070504'
const NIGHT = '#0b0705'

// The facing row of houses stands on y 880: a ground floor of 140 and upper floors of 118 (45 px to the metre).
const BASE = 880
const GF = 140
const FL = 118

// The train street in its own one-point view: the vanishing point, the eye's height and the street's half width, in
// metres, with the mouth of the street 8 m off.
const VX = 248
const HY = 826
const EYE = 1.2
const AW = 2.2
const k = (d: number): number => 360 / (8 + d)
const ax = (x: number, d: number): number => VX + x * k(d)
const ay = (y: number, d: number): number => HY + (EYE - y) * k(d)
const ap = (x: number, y: number, d: number): string => `${f(ax(x, d))} ${f(ay(y, d))}`
const quad = (a: string, b: string, c: string, e: string): string => `M${a}L${b}L${c}L${e}Z`
const pick = <T>(list: readonly T[], next: () => number): T => list[Math.floor(next() * list.length)] as T
const n2 = (value: number): string => String(Math.round(value * 100) / 100)
const dot = (x: number, y: number, r: number): string => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`

// How big the train is along its 7.5 s run, at each share of the way: far off, then looming, then gone to the left.
const TRAIN: readonly [number, number][] = [
  [0, 0.3],
  [10, 0.5],
  [22, 0.86],
  [34, 1.3],
  [44, 1.8],
  [52, 2.2],
  [60, 2.6],
  [66, 2.75],
]

const WALLS = ['#2a1e0e', '#241a10', '#2e2110', '#221a12', '#291d0c'] as const
const BOARDS = ['#6a2418', '#1d3a5a', '#25503a', '#7a5214', '#4a2550', '#8a4012'] as const
const SILKS = ['#f2a83a', '#e8743a', '#f6c64a', '#d8506a', '#3aa89a', '#f2b544', '#e0902e'] as const

// Invented marks for the shop signs: a solid body (diamond, dome, cup, wedge, leaf, drop, crescent), many with a small
// solid tone mark above or below. No script is written in filled shapes, so none of them is a letter.
const BODIES = [
  'M0 4.5l3 -3.5l3 3.5l-3 3.5z',
  'M0 7.5q0 -6 3 -6t3 6z',
  'M0 1.5q0 6 3 6t3 -6z',
  'M0 1.5h6l-3 6.5z',
  'M0 7.5q1 -6.5 6 -6.5q-1 6.5 -6 6.5z',
  'M3 .5q4 6 0 7.5q-4 -1.5 0 -7.5z',
  'M0 6q3 -6 6 0q-3 -3 -6 0z',
] as const
const TONES = ['M2.2 -1.6l.8 -.9l.8 .9l-.8 .9z', 'M1 -1.6l.7 -.8l.7 .8l-.7 .8zm2.6 0l.7 -.8l.7 .8l-.7 .8z', 'M1.8 -2.8l2.4 .9v1l-2.4 -.9z'] as const
const BELOW = 'M2.4 9.4l.6 -.7l.6 .7l-.6 .7z'

/** One shape moved to (x, y) and scaled: its start is absolute, the rest relative. */
function place(d: string, x: number, y: number, s: number): string {
  let i = 0

  return d.replace(/-?\d*\.?\d+/g, m => {
    i += 1
    const v = Number(m) * s

    return f(i === 1 ? x + v : i === 2 ? y + v : v)
  })
}

/** A row or a column of invented marks from (x, y), each 6 by 8 at scale 1, on a 10 (13 down a column) grid. */
function marks(next: () => number, count: number, column: boolean, x: number, y: number, s: number): string {
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const gx = x + (column ? 0 : i * 10 * s)
    const gy = y + (column ? i * 13 * s : 0) + 3 * s
    d += place(pick(BODIES, next), gx, gy, s)
    if (next() < 0.25) d += place(BELOW, gx, gy, s)
    if (next() < 0.45) d += place(pick(TONES, next), gx, gy, s)
  }

  return d
}

/** A silk lantern hung from (x, y): its dark silk always, its light on top, lit now ('on') or only when done ('off'). */
function lantern(x: number, y: number, s: number, color: string, lit: 'on' | 'off', delay: number): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${n2(s)})"><g class="oq-sw" style="animation-delay:${f(-((x * 7) % 40) / 10)}s">` +
    '<path d="M0 0V9M-6 8.5H6M-6 35.5H6M0 36V48" stroke="#3a2a14" stroke-width="2.4"/>' +
    (lit === 'off' ? `<ellipse cy="22" rx="12" ry="13" fill="${mix(color, '#120a06', 0.72)}"/>` : '') +
    `<g class="oq-${lit}"${lit === 'off' ? ` style="--d:${f(delay)}s"` : ''}><circle cy="22" r="40" fill="url(#oq-lg)"/><ellipse cy="22" rx="12" ry="13" fill="${color}"/></g></g></g>`
  )
}

/** A star lantern of coloured paper on a bamboo frame, the five-pointed kind carried at the mid-autumn festival. */
function star(x: number, y: number, s: number, color: string, lit: 'on' | 'off', delay: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? 17 : 7

    return `${f(Math.cos(a) * r)} ${f(26 + Math.sin(a) * r)}`
  }).join('L')

  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${n2(s)})"><g class="oq-sw" style="animation-delay:${f(-delay * 3)}s">` +
    `<path d="M0 0V9M-5 42Q0 50 -2 58M5 42Q2 52 4 60" fill="none" stroke="${mix(color, '#120a06', 0.4)}" stroke-width="1.6"/>` +
    `<path d="M${points}Z" fill="${mix(color, '#120a06', 0.7)}" stroke="#3a2010" stroke-width="1.4"/>` +
    `<g class="oq-${lit}" style="--d:${f(delay)}s"><circle cy="26" r="34" fill="url(#oq-lg)"/><path d="M${points}Z" fill="${color}"/></g></g></g>`
  )
}

// A motorbike from the side, facing right, at 50 units to the metre with its wheels on y 0: one path of shapes that
// all wind the same way, so they merge. The rider leans on the bars in a half-shell helmet.
const BIKE =
  'M-48 -24L-46 -38Q-42 -48 -30 -48H-2L4 -30H14L22 -62H30L34 -52L28 -30L33 -14H-38Q-48 -16 -48 -24Z' +
  'M18 -66h16v3h-16Z' +
  dot(-30, -12, 12) +
  dot(31, -12, 12)
const RIDER =
  'M-24 -48Q-24 -70 -14 -94L-2 -92Q2 -72 4 -50ZM-20 -54H8L12 -42H-18ZM4 -46L15 -26L8 -24L-2 -40Z' +
  'M-10 -88Q6 -78 20 -68L24 -62Q6 -70 -6 -80Z' +
  dot(-6, -103, 9)
const PILLION = `M-44 -46Q-44 -70 -34 -90L-22 -88Q-20 -70 -18 -46Z${dot(-29, -99, 8.5)}`
const CRATES = '<path d="M-60 -76h36v-24h-36ZM-57 -100h36v-24h-36ZM-60 -124h36v-24h-36ZM-57 -148h36v-24h-36ZM-58 -170L-26 -52M-24 -170L-58 -52" fill="#22180e" stroke="#4a3420" stroke-width="2"/>'

function bike(kind: number, lights: boolean): string {
  return (
    (kind === 2 ? CRATES : '') +
    `<path d="${BIKE}${kind === 3 ? '' : RIDER}${kind === 1 ? PILLION : ''}" fill="#0b0806"/>` +
    (lights ? `<path d="M34 -56L200 -26V-92Z" fill="url(#oq-hb)"/><path d="${dot(33, -57, 3.6)}" fill="${HOT}"/><rect x="-50" y="-38" width="4" height="5" fill="#ff5a3a"/>` : '')
  )
}

type Block = 'L' | 'C' | 'R'
type Layers = Record<string, string>

/** One house of the facing row, drawn into the shared layers: walls, shops, windows by block, rails, roofs. */
function house(row: Layers, x: number, w: number, kind: 'tube' | 'colo' | 'old', floors: number, next: () => number): void {
  const mid = x + w / 2
  const block: Block = mid < 420 ? 'L' : mid > 1180 ? 'R' : 'C'
  const top = BASE - GF - (floors - 1) * FL
  const add = (layer: string, d: string): void => {
    row[layer] = (row[layer] ?? '') + d
  }

  add('body', `<rect x="${f(x)}" y="${top}" width="${w}" height="${BASE - top}" fill="${pick(WALLS, next)}"/>`)

  // The shop on the ground floor: open and lit, shuttered, or shuttered halfway. The ones behind the desk are shut,
  // so Claude stands out against them.
  const shop = x > 1200 ? 'shut' : pick(['open', 'open', 'shut', 'half'] as const, next)
  const sx = x + 8
  const sy = BASE - GF + 30
  const sw = w - 16
  const sh = GF - 30

  if (shop === 'shut') {
    add('roll', `M${f(sx)} ${sy}h${sw}v${sh}h${-sw}Z`)
  } else {
    add('shop', `M${f(sx)} ${sy}h${sw}v${sh}h${-sw}Z`)
    add('goods', `M${f(sx)} ${sy + 38}h${sw}v4h${-sw}ZM${f(sx)} ${sy + 72}h${sw}v4h${-sw}Z`)
    for (let i = 0; i < 4; i += 2) add('goods', `M${f(sx + 6 + (i * sw) / 4)} ${f(sy + 46 + next() * 8)}h${f(sw / 6)}v${f(16 + next() * 10)}h${f(-sw / 6)}Z`)
    add(block === 'C' ? 'bulbC' : 'bulb', dot(sx + sw / 2, sy + 9, 3.2))
    if (shop === 'half') add('roll', `M${f(sx)} ${sy}h${sw}v${f(sh * 0.62)}h${-sw}Z`)
  }

  // The sign board above it, with a line of invented marks.
  const board = pick(BOARDS, next)
  const count = block === 'C' ? 3 : 5

  add('body', `<rect x="${f(x + 4)}" y="${BASE - GF + 4}" width="${w - 8}" height="22" fill="${block === 'C' ? mix(board, NIGHT, 0.45) : board}"/>`)
  add(`sign${block}`, marks(next, count, false, x + w / 2 - count * 5 + 2, BASE - GF + 5, 1))

  // The upper floors.
  for (let i = 1; i < floors; i += 1) {
    const yb = BASE - GF - (i - 1) * FL

    if (kind === 'colo') {
      for (const at of [0.15, 0.59]) {
        const wx = x + w * at
        const ww = w * 0.26
        const wy = yb - 100

        add(next() < 0.42 ? `lit${block}` : 'shut', `M${f(wx)} ${wy + 78}V${wy + 14}Q${f(wx + ww / 2)} ${wy - 6} ${f(wx + ww)} ${wy + 14}V${wy + 78}Z`)
        add('ledge', `M${f(wx - 5)} ${yb - 22}h${f(ww + 10)}v4h${f(-ww - 10)}Z`)
        add('rail', `M${f(wx - 3)} ${yb - 38}h${f(ww + 6)}v16h${f(-ww - 6)}Z`)
      }
    } else if (kind === 'tube') {
      const dx = x + w * 0.16
      const dw = w * 0.68

      add(next() < 0.48 ? `lit${block}` : 'shut', `M${f(dx)} ${yb - 102}h${f(dw)}v82h${f(-dw)}Z`)
      add('ledge', `M${f(x - 4)} ${yb - 20}h${w + 8}v6h${-w - 8}Z`)
      add('rail', `M${f(x)} ${yb - 38}h${w}v18h${-w}Z`)
      if (next() < 0.5) add('cage', `M${f(x + 2)} ${yb - 112}h${w - 4}v92h${-(w - 4)}Z`)
      add('plants', `M${f(x + 12 + next() * 20)} ${yb - 42}h${f(w * 0.3 + next() * w * 0.3)}`)
    } else {
      for (const at of [0.18, 0.6]) {
        const ww = w * 0.22

        add(next() < 0.45 ? `lit${block}` : 'shut', `M${f(x + w * at)} ${yb - 92}h${f(ww)}v60h${f(-ww)}Z`)
      }
    }
  }

  // The top: a tiled roof on the old houses, a cornice and balustrade on the colonial ones, a water tank and an
  // antenna on the tall thin ones.
  if (kind === 'old') {
    add('tile', `M${f(x - 10)} ${top}H${f(x + w + 10)}L${f(x + w - 6)} ${top - 62}H${f(x + 6)}Z`)
    add('ridge', `M${f(x + 2)} ${top - 70}h${w - 4}v9h${-(w - 4)}ZM${f(x - 10)} ${top - 2}h${w + 20}v3h${-(w + 20)}Z`)
  } else if (kind === 'colo') {
    add('ledge', `M${f(x - 6)} ${top - 8}h${w + 12}v9h${-(w + 12)}ZM${f(x - 3)} ${top - 30}h${w + 6}v5h${-(w + 6)}Z`)
    add('bal', `M${f(x)} ${top - 26}h${w}v18h${-w}Z`)
  } else {
    const tx = x + 12 + next() * (w - 80)

    add('ledge', `M${f(x - 2)} ${top - 10}h${w + 4}v10h${-(w + 4)}Z`)
    add('tank', `M${f(tx + 11)} ${top - 44}h34a11 11 0 0 1 0 22h-34a11 11 0 0 1 0 -22Z`)
    add('mast', `M${f(tx + 8)} ${top - 10}v-14M${f(tx + 46)} ${top - 10}v-14M${f(x + w - 18)} ${top - 10}v-70M${f(x + w - 32)} ${top - 66}h28M${f(x + w - 30)} ${top - 54}h24M${f(x + w - 28)} ${top - 42}h20`)
    add('shine', `M${f(tx + 10)} ${top - 39}h36`)
  }

  // A lantern hung in front of the shop: those near the desk light first when the work is done.
  const lx = x + w * 0.5

  if (block === 'C' && next() < 0.45) return
  add(`lamp${block}`, lantern(lx, BASE - GF + 26, 0.62, pick(SILKS, next), block !== 'C' && next() < 0.5 ? 'on' : 'off', ((1600 - lx) / 1600) * 1.1))
}

/** The train street: walls of houses down both sides, signs and balconies, lanterns over the tracks, the rails. */
function trainStreet(next: () => number): { floor: string; walls: string; lights: string } {
  let walls = ''
  let lit = ''
  let dark = ''
  let shops = ''
  let spill = ''
  let balcony = ''
  let edge = ''
  let glyphs = ''
  const signs: [number, string][] = []

  for (const side of [-1, 1]) {
    const X = side * AW
    const segs: [number, number, number][] = []

    for (let d = 0, i = 0; d < 72; i += 1) {
      const len = (3.4 + next() * 2.4) * (1 + d / 30)

      segs.push([d, d + len, i === 0 ? (side < 0 ? 11 : 8.4) : 7.5 + next() * 5])
      d += len
    }

    for (const [d0, d1, h] of segs) {
      const L = d1 - d0

      walls += `<path d="${quad(ap(X, 0, d0), ap(X, h, d0), ap(X, h, d1), ap(X, 0, d1))}" fill="${mix(pick(WALLS, next), '#120c08', Math.min(0.8, d0 / 40))}"/>`

      for (let y = 4.5; d0 < 36 && y + 1.6 < h - 0.4; y += 3.2) {
        const w0 = d0 + L * 0.22
        const w1 = d1 - L * 0.22
        const pane = quad(ap(X, y, w0), ap(X, y + 1.6, w0), ap(X, y + 1.6, w1), ap(X, y, w1))

        if (next() < 0.45) lit += pane
        else dark += pane

        // A balcony juts out from some floors, its rail facing down the street.
        if (next() < 0.35) {
          const bx = X - side * 0.6

          balcony += quad(ap(bx, y - 0.9, d0 + 0.3), ap(bx, y + 0.2, d0 + 0.3), ap(bx, y + 0.2, d1 - 0.3), ap(bx, y - 0.9, d1 - 0.3))
          edge += `M${ap(bx, y + 0.2, d0 + 0.3)}L${ap(bx, y + 0.2, d1 - 0.3)}`
        }
      }

      const s0 = d0 + 0.3
      const s1 = d1 - 0.3

      if (next() < 0.62) {
        shops += quad(ap(X, 0, s0), ap(X, 2.9, s0), ap(X, 2.9, s1), ap(X, 0, s1))
        spill += quad(ap(X, 0, s0), ap(X - side * 1.4, 0, s0), ap(X - side * 1.4, 0, s1), ap(X, 0, s1))
      } else {
        dark += quad(ap(X, 0, s0), ap(X, 2.9, s0), ap(X, 2.9, s1), ap(X, 0, s1))
      }

      // A vertical sign sticks out into the street, facing us, its marks running down it.
      if (next() < 0.75) {
        const ds = d0 + 0.35
        const x1 = Math.min(ax(X - side * 0.05, ds), ax(X - side * 0.65, ds))
        const x2 = Math.max(ax(X - side * 0.05, ds), ax(X - side * 0.65, ds))
        const y1 = ay(6, ds)
        const y2 = ay(3.8, ds)
        const sc = ((y2 - y1) * 0.8) / 39

        signs.push([ds, `<rect x="${f(x1)}" y="${f(y1)}" width="${f(x2 - x1)}" height="${f(y2 - y1)}" fill="${pick(BOARDS, next)}"/>`])
        if (ds < 26) glyphs += marks(next, ds > 14 ? 2 : 3, true, (x1 + x2) / 2 - 3 * sc, y1 + (y2 - y1) * 0.06, sc)
      }
    }
  }

  // Lanterns on wires across the tracks, row after row into the distance: the far rows light last when done.
  let cross = ''
  let rows = ''

  ;[0.8, 3, 6, 10, 15, 22, 32, 46].forEach((d, r) => {
    const s = 0.015 * k(d)
    const color = SILKS[r % SILKS.length] as string
    let silk = ''
    let glow = ''

    cross += `M${ap(-AW, 7.3, d)}Q${ap(0, 5.7, d)} ${ap(AW, 7.3, d)}`
    for (const x of r % 2 === 0 ? [-1.3, 0, 1.3] : [-0.65, 0.65]) {
      const lx = ax(x, d)
      const ly = ay(6.5 + 0.8 * (x / AW) ** 2, d)

      cross += `M${f(lx)} ${f(ly)}v${f(9 * s)}`
      silk += `M${f(lx - 12 * s)} ${f(ly + 22 * s)}a${f(12 * s)} ${f(13 * s)} 0 1 1 ${f(24 * s)} 0a${f(12 * s)} ${f(13 * s)} 0 1 1 ${f(-24 * s)} 0Z`
      glow += dot(lx, ly + 22 * s, 40 * s)
    }

    rows +=
      `<path d="${silk}" fill="${mix(color, '#120a06', 0.72)}"/>` +
      `<g class="oq-${r % 4 === 2 ? 'on' : 'off'}" style="--d:${f(0.95 + r * 0.13)}s"><path d="${glow}" fill="${color}" fill-opacity=".2"/><path d="${silk}" fill="${color}"/></g>`
  })

  for (let i = 0; i < 4; i += 1) {
    const d = 2 + i * 7 + next() * 4

    cross += `M${ap(-AW, 6.6 + next(), d)}Q${ap(0, 5.6, d + 2)} ${ap(AW, 6.4 + next(), d + 4)}`
  }

  const along = [-2.05, 2.05].map(x => [7.3, 7.8, 8.4].map(y => `M${ap(x, y, -1.5)}L${ap(x, y, 70)}`).join('')).join('')
  let rails = ''
  let ties = ''

  for (const x of [-0.5, 0.5]) rails += quad(ap(x - 0.04, 0, -5.6), ap(x + 0.04, 0, -5.6), ap(x + 0.04, 0, 90), ap(x - 0.04, 0, 90))
  for (let d = -5.4; d < 32; d += 1 + (d + 6) * 0.07) ties += quad(ap(-0.78, 0, d), ap(0.78, 0, d), ap(0.78, 0, d + 0.24), ap(-0.78, 0, d + 0.24))

  return {
    floor:
      `<path d="${quad(ap(-AW, 0, 0), ap(AW, 0, 0), ap(AW, 0, 95), ap(-AW, 0, 95))}" fill="#0d0906"/>` +
      `<path d="${ties}" fill="#1e160d"/><path d="${rails}" fill="#6a5236"/>`,
    walls: walls + `<path d="${dark}" fill="url(#oq-lv)"/><circle cx="${VX}" cy="${HY - 30}" r="120" fill="url(#oq-vp)"/>`,
    lights:
      `<path d="${lit}" fill="${AMBER}" fill-opacity=".62"/><path d="${shops}" fill="#d89a48" fill-opacity=".55"/>` +
      `<path d="${spill}" fill="${AMBER}" fill-opacity=".1"/>` +
      `<path d="${balcony}" fill="#0d0907" fill-opacity=".92"/><path d="${edge}" stroke="#4a3a24" stroke-width="1.2"/>` +
      signs
        .sort((a, b) => b[0] - a[0])
        .map(item => item[1])
        .join('') +
      `<path d="${glyphs}" fill="#fff0cc"/>` +
      `<path d="${along}${cross}" fill="none" stroke="${WIRE}" stroke-width="1.4"/>` +
      rows,
  }
}

/** The train's face coming down the street, at 45 units to the metre, its wheels on y 54 below the vanishing point. */
function train(): string {
  return (
    '<g class="oq-rk">' +
    '<path d="M-66 50V-90Q-66 -117 -40 -121H40Q66 -117 66 -90V50Z" fill="#16252b"/>' +
    '<path d="M-66 -90Q-66 -117 -40 -121H40Q66 -117 66 -90M-70 -80V20M70 -80V20" fill="none" stroke="#4a6a74" stroke-width="2"/>' +
    '<path d="M-58 -96H-5V-60H-60ZM5 -96H58L60 -60H5Z" fill="#0a1114"/><path d="M-30 -86H-12V-66H-34Z" fill="#3a2a14" fill-opacity=".7"/>' +
    '<path d="M-50 -92L-32 -64M14 -92L32 -64" stroke="#6a8a96" stroke-opacity=".3" stroke-width="3"/>' +
    '<path d="M-66 -30h132v11h-132ZM-66 -14h132v4h-132Z" fill="#c8902e"/>' +
    // The number plate: a fleet number of dots and bars, never figures.
    '<rect x="-16" y="-52" width="32" height="14" rx="2" fill="#d6c7a0"/>' +
    '<path d="M-12.5 -46.5h3v3h-3ZM-7.5 -46.5h7v3h-7ZM2 -46.5h3v3h-3ZM6.5 -46.5h6v3h-6Z" fill="#1a1a18"/>' +
    '<path d="M-70 22h140v14h-140ZM-60 36H60L52 54H-52ZM-9 -130h18v8h-18Z" fill="#0b0f11"/>' +
    '<path d="M-62 12h14v10h-14ZM48 12h14v10h-14ZM-40 38L-34 54M-20 38L-17 54M0 38V54M20 38L17 54M40 38L34 54" fill="#2a2f30" stroke="#2a2f30" stroke-width="2"/>' +
    `<circle cy="-108" r="10" fill="#2a2e2e"/><circle cx="-50" cy="2" r="14" fill="url(#oq-glare)"/><circle cx="50" cy="2" r="14" fill="url(#oq-glare)"/>` +
    `<path d="${dot(0, -108, 7)}" fill="#fff6dc"/><path d="${dot(-50, 2, 4.6)}${dot(50, 2, 4.6)}" fill="#ffe6a8"/></g>` +
    // Its headlight's beam, sweeping side to side ahead of it.
    '<g transform="translate(0 -108)"><g class="oq-bm"><path d="M-5 0L-96 220H96L5 0Z" fill="url(#oq-beam)"/></g></g>'
  )
}

/** The iced tea in a ribbed glass, pale tea and two cubes of ice; a saucer of sunflower seeds and their husks. */
const TEA =
  '<g transform="translate(396 330)"><path d="M-9 -30H9L7.4 0H-7.4Z" fill="#b8903a" fill-opacity=".62"/>' +
  '<path d="M-6 -28h6v6h-6ZM1 -25h5v5h-5Z" fill="#fff3dc" fill-opacity=".48"/>' +
  '<path d="M-9.6 -33H9.6L7.8 0H-7.8Z" fill="#fff3dc" fill-opacity=".08" stroke="#efe0c2" stroke-opacity=".6" stroke-width="1.4"/>' +
  '<path d="M-5 -31V-2M0 -32V-1M5 -31V-2" stroke="#fff3dc" stroke-opacity=".2"/></g>' +
  '<ellipse cx="428" cy="329" rx="17" ry="4" fill="#d8cdb8" fill-opacity=".7"/>' +
  '<path d="M415 326h6v2.6h-6ZM422 324h6v2.6h-6ZM429 326h6v2.6h-6ZM425 321h6v2.6h-6ZM370 327h5v2.4h-5ZM380 328h5v2.4h-5Z" fill="#2a2420"/>'

function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `M${252 + i * 13} 325h8v3h-8Z`).join('')

  return (
    `<rect x="244" y="322" width="98" height="8" rx="2" fill="#2e2924"/><path d="${keys}" fill="${light}" fill-opacity=".5"/>` +
    // The lid, turned a little toward us: its rim, the lit screen with a few lines of code, and the spill toward Claude.
    '<path d="M324 330L349 236L377 229L352 323Z" fill="#2e2924"/>' +
    `<path d="M329 325L352 241L372 235L348 320Z" fill="${light}" fill-opacity=".9"/>` +
    '<path d="M337 304l12 -3.4M340 292l14 -4M343 280l9 -2.6M346 268l13 -3.7M349 256l8 -2.3" stroke="#0a0604" stroke-opacity=".4" stroke-width="2"/>' +
    `<path d="M329 325L352 241L338 247L318 326Z" fill="${light}" fill-opacity=".16"/>`
  )
}

export function oldQuarterWorld(): World {
  // Seeded with the year the city was founded.
  const next = random(1010)
  const row: Layers = {}
  const HOUSES: readonly ['tube' | 'colo' | 'old', number, number][] = [
    ['tube', 193, 4],
    ['colo', 142, 3],
    ['old', 128, 2],
    ['tube', 150, 5],
    ['colo', 140, 3],
    ['old', 132, 2],
    ['tube', 146, 4],
    ['colo', 150, 3],
    ['old', 134, 2],
    ['tube', 152, 5],
  ]
  let hx = -44

  HOUSES.forEach(([kind, w, floors], i) => {
    house(row, hx, w, kind, floors, next)
    // The train street opens between the first house and the second.
    hx = i === 0 ? ax(AW, 0) : hx + w + 4
  })

  const layer = (name: string): string => row[name] ?? ''
  const street = trainStreet(next)

  // The far city over the roofs: a ragged skyline in the haze, one tower with a slow red light.
  let sky = ''

  for (let x = -20; x < 1640; ) {
    const w = 40 + next() * 90

    sky += `M${f(x)} 640V${f(500 - next() * 150)}h${f(w)}V640Z`
    x += w + next() * 20
  }

  const farLit = Array.from({ length: 16 }, () => `M${f(next() * 1600)} ${f(380 + next() * 220)}h4v5h-4Z`).join('')

  // The poles and their tangles: loops of cable wound round each pole, and wires slung from pole to pole.
  const tangle = (cx: number, cy: number, seed: number, count: number): string => {
    const n = random(seed)
    const r = Math.round
    let d = ''

    // Whole pixels: the loops are 12..50 across, so the rounding never shows and the markup stays small.
    for (let i = 0; i < count; i += 1) {
      const rx = 12 + n() * 38
      const ry = 4 + n() * 10
      const ox = cx + (n() - 0.5) * 24
      const oy = cy + (n() - 0.5) * 90
      const a = (n() - 0.5) * 0.7
      const deg = r((a * 180) / Math.PI)
      const ex = r(2 * rx * Math.cos(a))
      const ey = r(2 * rx * Math.sin(a))

      d += `M${r(ox - rx * Math.cos(a))} ${r(oy - rx * Math.sin(a))}a${r(rx)} ${r(ry)} ${deg} 1 0 ${ex} ${ey}a${r(rx)} ${r(ry)} ${deg} 1 0 -${ex} -${ey}`
    }

    for (let i = 0; i < 4; i += 1) d += `M${f(cx + (n() - 0.5) * 50 - 14)} ${f(cy + 30)}q14 ${f(40 + n() * 40)} 28 0`

    return d.replace(/--/g, '')
  }
  const LP = 404
  const RP = 1525
  let spans = ''
  let pulses = ''

  for (let i = 0; i < 9; i += 1) {
    const y1 = 96 + i * 20 + next() * 10
    const y2 = 90 + i * 16 + next() * 12
    const d = `M${LP} ${f(y1)}Q${f((LP + RP) / 2)} ${f((y1 + y2) / 2 + (30 + next() * 120) * 2)} ${RP} ${f(y2)}`

    spans += d
    if (i % 2 === 1) pulses += `<path class="oq-pl" style="animation-delay:${f(-i * 0.3)}s" pathLength="100" d="${d}"/>`
  }

  const wires =
    spans +
    [0, 1, 2, 3].map(i => `M${LP} ${130 + i * 34}Q${250 - i * 20} ${240 + i * 50} -30 ${170 + i * 46}`).join('') +
    [0, 1, 2].map(i => `M${LP} ${210 + i * 20}Q${300 - i * 10} ${380 + i * 30} ${ap(-1.4 + i * 1.4, 7.6, 24 + i * 8)}`).join('') +
    [0, 1].map(i => `M${LP} ${240 + i * 24}Q${470 + i * 40} ${420 + i * 40} ${560 + i * 170} ${600 - i * 90}`).join('') +
    [0, 1, 2, 3].map(i => `M${RP} ${110 + i * 40}Q1600 ${190 + i * 40} 1680 ${130 + i * 50}`).join('') +
    [0, 1].map(i => `M${RP} ${250 + i * 30}Q${1420 - i * 60} ${420 + i * 20} ${1300 - i * 140} ${560 - i * 100}`).join('') +
    `M${LP} 150Q270 290 140 300` +
    [0, 1, 2, 3].map(i => `M-20 ${690 + i * 9}Q190 ${742 + i * 12} ${LP} ${700 + i * 7}M${RP} ${686 + i * 8}Q1350 ${736 + i * 12} 1170 ${700 + i * 7}`).join('')
  const poles =
    `<path d="M${LP - 7} 890L${LP - 4} 40H${LP + 4}L${LP + 7} 890ZM${RP - 9} 1000L${RP - 5} 30H${RP + 5}L${RP + 9} 1000Z" fill="#1c1610"/>` +
    `<path d="M${LP - 7} 890L${LP - 4} 40M${RP - 9} 1000L${RP - 5} 30" stroke="#3a3022" stroke-width="2"/>` +
    `<path d="M${LP - 40} 92H${LP + 42}M${LP - 28} 150H${LP + 30}M${RP - 60} 80H${RP + 60}M${RP - 70} 159H${RP - 4}" stroke="#1c1610" stroke-width="6"/>` +
    `<rect x="${LP + 6}" y="248" width="20" height="30" fill="#14110d"/><circle cx="${LP + 16}" cy="256" r="2" fill="#7fcf7a" fill-opacity=".7"/>` +
    `<path d="M${RP - 64} 111a7 7 0 0 1 7 -7h10a7 7 0 0 1 7 7v45h-24ZM${RP - 36} 119a7 7 0 0 1 7 -7h10a7 7 0 0 1 7 7v37h-24Z" fill="#34322e"/>` +
    `<path d="M${RP - 58} 112V150M${RP - 30} 120V150" stroke="#6a665c" stroke-opacity=".5" stroke-width="2"/>`

  // The star lanterns slung over the mouth of the train street.
  const stars = [0.12, 0.27, 0.42, 0.57, 0.72, 0.87]
    .map((t, i) => {
      const x = (1 - t) ** 2 * LP + 2 * (1 - t) * t * 270 + t * t * 140
      const y = (1 - t) ** 2 * 150 + 2 * (1 - t) * t * 290 + t * t * 300

      return i % 2 === 0
        ? star(x, y, 0.9, i === 2 ? '#e8743a' : AMBER, i === 4 ? 'off' : 'on', 0.8 + i * 0.1)
        : lantern(x, y, 0.75, i === 3 ? '#d8506a' : '#3aa89a', 'off', 0.8 + i * 0.1)
    })
    .join('')

  // Motorbikes: one each way now and then, a flood of them while a tool is busy. Parked ones line the far curb.
  const ride = (kind: number, right: boolean, t: number, delay: number, flood: boolean): string =>
    `<g class="oq-mb${flood ? ' oq-fl' : ''}" style="--a:${right ? -260 : 1860}px;--b:${right ? 1860 : -260}px;animation-duration:${t}s;animation-delay:${f(delay)}s">` +
    `<g transform="translate(0 ${right ? 898 : 924}) scale(${right ? 1.2 : -1.64} ${right ? 1.2 : 1.64})">${bike(kind, true)}</g></g>`
  const traffic =
    ride(2, true, 11, -3, false) +
    ride(1, false, 9, -6.5, false) +
    [0, 1, 0].map((kind, i) => ride(kind, true, 4.4 + i * 0.4, -i * 1.5, true)).join('') +
    ride(0, false, 4.4, -1.6, true)
  const parked = [470, 760, 1120]
    .map((x, i) => `<path transform="translate(${x} 887) scale(${i % 2 ? -1 : 1} 1)" d="${BIKE}" fill="#0b0806"/>`)
    .join('')

  // Error: sparks where the cables are wound tightest, a few falling, and a wisp of smoke.
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.3
    const r = 16 + (i % 3) * 6

    return `M${f(Math.cos(a) * 6)} ${f(Math.sin(a) * 6)}L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`
  }).join('')
  // The burst at the left tangle is the big one: a wider glare and longer rays, and more drops raining off it.
  const spark = (x: number, y: number, delay: number, s: number, drops: number): string =>
    `<g transform="translate(${x} ${y})"><g class="oq-spk" style="animation-delay:${delay}s"><g transform="scale(${s})"><circle r="70" fill="url(#oq-glare)"/>` +
    `<path d="${rays}" stroke="#fff4cf" stroke-width="2" stroke-linecap="round"/></g></g>` +
    `<g class="oq-dr" style="--t:${f(delay + 0.05)}s" fill="#ffd27a">` +
    Array.from({ length: drops }, (_, i) => `<circle style="--dx:${f((i - (drops - 1) / 2) * 17)}px" r="2.4"/>`).join('') +
    '</g></g>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0a0604',
      furniture: '#2a1c10',
      metal: '#2e2924',
      paper: '#efe2c8',
      light: { idle: '#c8954a', work: AMBER, bright: HOT },
      headTop: 204,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // The conical palm-leaf hat, lit from the screen on the near side; the eyes stay clear below its brim.
          '<rect x="70" y="238" width="160" height="7" fill="#000" fill-opacity=".22"/>' +
          '<path d="M150 164L258 242Q150 256 42 242Z" fill="#b99a5c"/>' +
          '<path d="M150 164L42 242Q96 250 150 251Z" fill="#5e4626" fill-opacity=".5"/>' +
          '<path d="M121 185Q150 189 179 185M96 203Q150 209 204 203M70 222Q150 230 230 222" fill="none" stroke="#7a5e34" stroke-opacity=".75" stroke-width="1.6"/>' +
          '<path d="M150 164L258 242" stroke="#ecd49a" stroke-opacity=".55" stroke-width="2"/>' +
          '<path d="M42 242Q150 256 258 242" fill="none" stroke="#6e5530" stroke-width="2"/>',
      },
      seatArt:
        // The little blue plastic stool every sidewalk stall has, with the arch cut out of its legs.
        '<ellipse cx="151" cy="456" rx="60" ry="5" fill="#000" fill-opacity=".35"/>' +
        '<path d="M102 349H200L198 359H104Z" fill="#3e72b6"/>' +
        '<path d="M105 359H197L208 456H192L188 424Q151 390 114 424L110 456H94Z" fill="#25508c"/>' +
        '<path d="M105 359L94 456H104L112 362Z" fill="#183a66"/>' +
        '<path d="M106 366H196" stroke="#4a80c4" stroke-opacity=".5" stroke-width="2"/>',
      tableArt:
        // The low red plastic table, the iced tea and the seeds.
        '<ellipse cx="318" cy="456" rx="150" ry="5" fill="#000" fill-opacity=".3"/>' +
        '<rect x="162" y="328" width="314" height="9" rx="3" fill="#b2402e"/>' +
        '<path d="M166 337H472V347H166ZM238 347H266L262 456H244ZM440 347H470L464 456H448Z" fill="#7e2a1e"/>' +
        '<path d="M166 330H472" stroke="#d8644a" stroke-opacity=".45" stroke-width="2"/>' +
        TEA,
    },
    style:
      // Lanterns sway; the ones lit only for done come on along the street and down the tracks.
      '.oq-sw{animation:oq-sw 4.4s ease-in-out infinite alternate}@keyframes oq-sw{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-run .oq-sw{animation-duration:.9s}' +
      '.oq-off{opacity:0}.st-done .oq-off{animation:oq-on .9s ease-out var(--d) both}@keyframes oq-on{from{opacity:0}to{opacity:1}}' +
      '.oq-win{animation:oq-win 6s ease-in-out infinite alternate}@keyframes oq-win{from{opacity:.75}to{opacity:1}}' +
      '.oq-tv{animation:oq-tv 2.6s ease-in-out infinite}@keyframes oq-tv{0%,100%{opacity:.45}30%{opacity:.85}45%{opacity:.55}70%{opacity:.9}}' +
      '.oq-av{animation:oq-av 2.4s ease-in-out infinite}@keyframes oq-av{0%,60%,100%{opacity:.2}75%{opacity:1}}' +
      '.oq-smk{stroke-dasharray:.3 .7;animation:oq-smk 5s linear infinite}@keyframes oq-smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.oq-hop{animation:oq-hop 2.8s ease-in-out infinite}@keyframes oq-hop{0%,40%,100%{transform:translate(0,0)}48%{transform:translate(5px,-6px)}56%,90%{transform:translate(10px,0)}}' +
      // Motorbikes ride by; a tool's flood fills both lanes; they all stop for the train.
      '.oq-mb{animation:oq-mb 9s linear infinite}@keyframes oq-mb{from{transform:translateX(var(--a))}to{transform:translateX(var(--b))}}' +
      '.oq-fl{opacity:0}.st-tool .oq-fl{opacity:1}.st-run .oq-mb{opacity:0}' +
      // The web: light runs along the cables.
      '.oq-pl{opacity:0}.st-web .oq-pl{opacity:.85;animation:oq-pl 1.8s linear infinite}@keyframes oq-pl{from{stroke-dashoffset:0}to{stroke-dashoffset:-100}}' +
      // The train: it comes down the street growing as it nears, rocking, its beam sweeping, then swings off left.
      '.oq-trw{opacity:0}.st-run .oq-trw{animation:oq-tro 7.5s linear infinite}' +
      '@keyframes oq-tro{0%{opacity:0}3%,67%{opacity:1}73%,100%{opacity:0}}' +
      '.st-run .oq-tr{animation:oq-tr 7.5s linear infinite}' +
      `@keyframes oq-tr{${TRAIN.map(([p, s]) => `${p}%{transform:translate(0,0) scale(${s})}`).join('')}73%,100%{transform:translate(-330px,24px) scale(3)}}` +
      '.st-run .oq-gla{animation:oq-gla 7.5s linear infinite}' +
      `@keyframes oq-gla{${TRAIN.map(([p, s]) => `${p}%{transform:translate(0,${f(-108 * s)}px) scale(${n2(0.6 + 0.6 * s)})}`).join('')}73%,100%{transform:translate(-330px,${f(24 - 108 * 3)}px) scale(2.4)}}` +
      '.oq-rk{animation:oq-rk .24s ease-in-out infinite alternate}@keyframes oq-rk{to{transform:translate(.6px,-1.4px)}}' +
      '.oq-bm{animation:oq-bm 2.4s ease-in-out infinite alternate}@keyframes oq-bm{from{transform:rotate(-13deg)}to{transform:rotate(13deg)}}' +
      '.oq-wash{opacity:0}.st-run .oq-wash{animation:oq-wash 7.5s linear infinite}@keyframes oq-wash{0%,12%{opacity:0}40%,64%{opacity:1}73%,100%{opacity:0}}' +
      // The crossing lights: one lamp then the other, once a second each.
      '.oq-xa,.oq-xb{opacity:.18}.st-run .oq-xa{animation:oq-xl 1s ease-in-out infinite}.st-run .oq-xb{animation:oq-xl 1s ease-in-out -.5s infinite}' +
      '@keyframes oq-xl{0%,45%,100%{opacity:.18}10%,35%{opacity:1}}' +
      // Error: sparks crackle at the tangles, each place once every 1.8 s and never three in one second, and a block of
      // lights goes out with one stutter.
      '.oq-spk,.oq-dr circle,.oq-puff{opacity:0}.oq-spk,.oq-puff{transform-box:fill-box;transform-origin:center}' +
      '.st-error .oq-spk{animation:oq-spk 1.8s ease-out infinite}@keyframes oq-spk{0%{opacity:0;transform:scale(.3)}7%{opacity:1;transform:scale(1)}22%,100%{opacity:0;transform:scale(1.3)}}' +
      '.st-error .oq-dr circle{animation:oq-drop 1.8s ease-in var(--t) infinite}@keyframes oq-drop{0%,6%{opacity:0;transform:translate(0,0)}10%{opacity:1}70%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),380px)}}' +
      '.st-error .oq-puff{animation:oq-puff 2.1s ease-out infinite}@keyframes oq-puff{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.4}100%{opacity:0;transform:translate(-30px,-120px) scale(2.4)}}' +
      '.st-error .oq-blk{animation:oq-dark 3.4s ease-out .3s both}@keyframes oq-dark{0%{opacity:1}10%{opacity:.12}17%{opacity:.6}26%,100%{opacity:.08}}' +
      // Done: the street warms as the lanterns come on, and light shows through the slats of every shutter (oq-lv).
      '.oq-warm{opacity:0}.st-done .oq-warm{animation:oq-on 2.4s ease-out .3s both}',
    scenery:
      '<defs><linearGradient id="oq-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060302"/><stop offset=".16" stop-color="#0e0805"/><stop offset=".33" stop-color="#2c1b0b"/><stop offset=".44" stop-color="#3a2410"/><stop offset=".6" stop-color="#21150a"/></linearGradient>' +
      '<radialGradient id="oq-lg"><stop offset="0" stop-color="#ffc861" stop-opacity=".5"/><stop offset=".45" stop-color="#f2a03a" stop-opacity=".16"/><stop offset="1" stop-color="#f2a03a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="oq-glare"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset=".25" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="oq-vp"><stop offset="0" stop-color="#3a2812" stop-opacity=".95"/><stop offset=".35" stop-color="#22160c" stop-opacity=".8"/><stop offset="1" stop-color="#160e08" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="oq-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c8" stop-opacity=".34"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="oq-hb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".34"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient>' +
      // The web's pulses run at about half strength while they cross the chat column.
      `<linearGradient id="oq-plg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset=".25" stop-color="${AMBER}"/><stop offset=".3" stop-color="${AMBER}" stop-opacity=".53"/><stop offset=".7" stop-color="${AMBER}" stop-opacity=".53"/><stop offset=".75" stop-color="${AMBER}"/></linearGradient>` +
      '<linearGradient id="oq-shop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a20"/><stop offset="1" stop-color="#3a2410"/></linearGradient>' +
      '<linearGradient id="oq-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a03a" stop-opacity="0"/><stop offset="1" stop-color="#f2a03a" stop-opacity=".14"/></linearGradient>' +
      `<linearGradient id="oq-dim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${NIGHT}" stop-opacity="0"/><stop offset=".1" stop-color="${NIGHT}" stop-opacity=".6"/><stop offset=".9" stop-color="${NIGHT}" stop-opacity=".6"/><stop offset="1" stop-color="${NIGHT}" stop-opacity="0"/></linearGradient>` +
      '<pattern id="oq-lv" width="8" height="5" patternUnits="userSpaceOnUse"><rect width="8" height="5" fill="#17231b"/><rect class="oq-off" style="--d:.5s" y="1" width="8" height="2.6" fill="#f2a83a"/><path d="M0 4.5H8" stroke="#2c3e30"/></pattern>' +
      '<pattern id="oq-rl" width="7" height="20" patternUnits="userSpaceOnUse"><rect x="3" width="1.6" height="20" fill="#0d0a07"/></pattern>' +
      '<pattern id="oq-bal" width="12" height="18" patternUnits="userSpaceOnUse"><rect x="3" y="2" width="6" height="16" rx="3" fill="#3a2c18"/></pattern>' +
      '<pattern id="oq-roll" width="10" height="6" patternUnits="userSpaceOnUse"><rect width="10" height="6" fill="#211d19"/><path d="M0 5.5H10" stroke="#332d26"/></pattern>' +
      '<pattern id="oq-tile" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="12" height="10" fill="#2e160e"/><path d="M0 9.5H12" stroke="#170a06"/><path d="M6 0V9" stroke="#43231a"/></pattern>' +
      '<pattern id="oq-cage" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M4.5 0V9" stroke="#0c0907" stroke-width="1.4"/></pattern></defs>' +
      '<rect width="1600" height="1000" fill="url(#oq-sky)"/>' +
      `<path d="${sky}" fill="#170e07"/><path d="${farLit}" fill="${AMBER}" fill-opacity=".22"/>` +
      '<rect x="1352" y="230" width="30" height="400" fill="#140c06"/><circle class="oq-av" cx="1367" cy="226" r="3" fill="#ff5a3a"/>' +
      // The facing row.
      layer('body') +
      `<path d="${layer('shop')}" fill="url(#oq-shop)"/><path d="${layer('goods')}" fill="#24160a"/><path d="${layer('roll')}" fill="url(#oq-roll)"/>` +
      `<path d="${layer('bulb')}" fill="${HOT}"/><path d="${layer('bulbC')}" fill="${HOT}" fill-opacity=".5"/>` +
      `<path d="${layer('shut')}" fill="url(#oq-lv)"/>` +
      `<g class="oq-win"><path d="${layer('litC')}" fill="${AMBER}" fill-opacity=".26"/><path d="${layer('litR')}" fill="${AMBER}" fill-opacity=".74"/></g>` +
      `<g class="oq-blk"><path d="${layer('litL')}" fill="${AMBER}" fill-opacity=".74"/></g>` +
      '<path class="oq-tv" d="M40 520h78v82h-78Z" fill="#8fb0d8" fill-opacity=".3"/>' +
      `<path d="${layer('ledge')}" fill="#4a3a22"/><path d="${layer('rail')}" fill="url(#oq-rl)"/><path d="${layer('cage')}" fill="url(#oq-cage)"/>` +
      `<path d="${layer('plants')}" stroke="#13200f" stroke-width="16" stroke-linecap="round"/><path d="${layer('tile')}" fill="url(#oq-tile)"/><path d="${layer('ridge')}" fill="#1e0f09"/>` +
      `<path d="${layer('bal')}" fill="url(#oq-bal)"/><path d="${layer('tank')}" fill="#5a5650"/>` +
      `<path d="${layer('mast')}" stroke="#0e0b08" stroke-width="3"/><path d="${layer('shine')}" stroke="#a8a49a" stroke-opacity=".5" stroke-width="2"/>` +
      `<g fill="#f3e2b8"><path class="oq-blk" d="${layer('signL')}"/><path d="${layer('signR')}" fill-opacity=".7"/><path d="${layer('signC')}" fill-opacity=".28"/></g>` +
      '<rect y="380" width="1600" height="500" fill="url(#oq-warm)" fill-opacity=".7"/>' +
      // The street, its far curb and the near one where the stall is.
      '<rect y="880" width="1600" height="120" fill="#0c0806"/><rect y="880" width="1600" height="12" fill="#1a120b"/>' +
      '<path d="M0 892H1600" stroke="#2e2418" stroke-width="2"/><path d="M0 958H1600" stroke="#2a2016" stroke-width="3"/><rect y="959" width="1600" height="41" fill="#120c08"/>' +
      // The train street.
      street.floor +
      street.walls +
      `<g class="oq-blk">${street.lights}</g>` +
      `<g class="oq-wash" fill="#ffe6b0"><path d="${quad(ap(-AW, 0, -1), ap(-AW, 9, -1), ap(-AW, 9, 14), ap(-AW, 0, 14))}${quad(ap(AW, 0, -1), ap(AW, 9, -1), ap(AW, 9, 14), ap(AW, 0, 14))}" fill-opacity=".14"/>` +
      `<path d="${quad(ap(-AW, 0, -5), ap(AW, 0, -5), ap(AW, 0, 16), ap(-AW, 0, 16))}" fill-opacity=".18"/></g>` +
      // The crossing post at the mouth, and a grill smoking on the corner.
      '<path d="M370 892V770M352 772H388" stroke="#1a140e" stroke-width="5"/><path d="M349 784a7 7 0 1 1 14 0a7 7 0 1 1 -14 0ZM377 784a7 7 0 1 1 14 0a7 7 0 1 1 -14 0Z" fill="#2a1a14"/>' +
      '<g class="oq-xa"><circle cx="356" cy="784" r="16" fill="url(#oq-glare)"/><circle cx="356" cy="784" r="5.5" fill="#ff7a4a"/></g>' +
      '<g class="oq-xb"><circle cx="384" cy="784" r="16" fill="url(#oq-glare)"/><circle cx="384" cy="784" r="5.5" fill="#ff7a4a"/></g>' +
      '<path d="M44 884L48 858H84L88 884Z" fill="#2a2018"/><rect x="42" y="852" width="48" height="6" fill="#ff8a3a" fill-opacity=".7"/>' +
      '<g fill="none" stroke="#6a6058" stroke-linecap="round"><path class="oq-smk" pathLength="1" d="M66 850c-14 -40 18 -70 0 -110c-14 -34 14 -60 4 -100" stroke-opacity=".4" stroke-width="7"/>' +
      '<path class="oq-smk" style="animation-delay:-2.5s" pathLength="1" d="M60 850c10 -36 -16 -66 2 -104c14 -30 -10 -58 0 -96" stroke-opacity=".32" stroke-width="5"/></g>' +
      // Parked bikes, the lanterns of the row and the riders, dimmed in the middle by the veil behind the chat.
      parked +
      `<g class="oq-blk">${layer('lampL')}</g>${layer('lampC')}${layer('lampR')}` +
      traffic +
      '<rect x="380" width="840" height="1000" fill="url(#oq-dim)"/>' +
      '<rect class="oq-warm" y="560" width="1600" height="440" fill="url(#oq-warm)"/>' +
      `<circle class="oq-warm" cx="${VX}" cy="${HY - 40}" r="110" fill="url(#oq-lg)"/>` +
      // The poles, their tangles and the cables over the street.
      poles +
      `<path d="${wires}" fill="none" stroke="${WIRE}" stroke-width="2"/>` +
      `<path d="${tangle(LP, 220, 5, 14)}${tangle(RP, 262, 9, 12)}" fill="none" stroke="${WIRE}" stroke-width="2.8"/>` +
      `<g fill="none" stroke="url(#oq-plg)" stroke-width="2.6" stroke-dasharray="7 93" stroke-linecap="round">${pulses}</g>` +
      `<g class="oq-blk">${stars}</g>` +
      // The train itself, and the glare of its headlight.
      `<g transform="translate(${VX} ${HY})"><g class="oq-trw"><g class="oq-tr">${train()}</g>` +
      '<g class="oq-gla"><circle r="60" fill="url(#oq-glare)"/></g></g></g>' +
      spark(LP - 4, 206, 0.4, 1.6, 7) +
      spark(LP + 14, 262, 0.9, 1.35, 6) +
      spark(RP - 40, 150, 1.5, 1, 4) +
      [0, 1, 2].map(i => `<circle class="oq-puff" style="animation-delay:${f(0.4 + i * 0.7)}s" cx="${LP + 6}" cy="230" r="14" fill="#5a5048"/>`).join(''),
    nook:
      // A wire slung from the pole over the stall, with lanterns and a star on it, and a songbird's cage.
      // It runs on past the right edge, so it never hangs from mid-air when a narrow window crops the pole.
      '<path d="M480 -376L360 -330Q150 -250 -40 -300M8 -296V-150" fill="none" stroke="#070504" stroke-width="2"/>' +
      star(345, -318, 0.8, AMBER, 'off', 0) +
      lantern(270, -306, 1.05, AMBER, 'on', 0) +
      star(150, -288, 1.1, '#e8743a', 'off', 0.05) +
      lantern(70, -293, 0.95, '#3aa89a', 'off', 0.12) +
      '<g transform="translate(8 -150)"><path d="M-22 70V20Q-22 -4 0 -6Q22 -4 22 20V70Z" fill="#1a1108" fill-opacity=".5"/>' +
      '<path d="M-22 70V20Q-22 -4 0 -6Q22 -4 22 20V70M-11 70V6M0 70V-6M11 70V6M-22 40H22M-16 50H12" fill="none" stroke="#a8844a" stroke-opacity=".7" stroke-width="1.5"/>' +
      '<rect x="-26" y="68" width="52" height="5" rx="2" fill="#5a3a1a"/>' +
      '<g class="oq-hop"><path d="M-12 46Q-12 36 -4 36Q2 36 2 42L6 44L2 45Q0 50 -6 50Z" fill="#c8a040"/><circle cx="-2" cy="40" r="1.2" fill="#0a0604"/></g></g>',
  }
}
