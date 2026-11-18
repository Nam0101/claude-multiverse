import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Mirror Maze: Claude at a glass desk in a hall of mirrors. Framed panes line both walls and run off to a far mirror
// that repeats itself forever; every pane holds coral reflections of Claude at its desk, smaller and dimmer into the
// distance, and they copy what Claude does. When a command runs the panes revolve on their pivots, the reflections
// ripple and multiply and the far mirror falls away into itself; an error cracks the great mirror on the left and
// its shards slide out of the frame; done has every reflection wave in sync.
const ICE = '#b8e1ff'
const PALE = '#e8f6ff'
const BODY = mix('#d97757', '#2b3f52', 0.2)
const STEEL = '#3a4a5c'
const FRAME = '#1b242e'
const SEATS = '#17202a'

// One-point perspective: the hall runs to (VX, VY). At depth `s` (1 near, smaller farther) the walls stand at
// VX ∓ K·s; the left mirrors run down to the skirting, the right ones stop at a wainscot above the desk.
const VX = 800
const VY = 462
const K = 1100
const lx = (s: number): number => VX - K * s
const rx = (s: number): number => VX + K * s
const yCeil = (s: number): number => VY - 600 * s
const yFloor = (s: number): number => VY + 560 * s
const yTop = (s: number): number => VY - 556 * s
const yLow = (s: number): number => VY + 500 * s
const yRail = (s: number): number => VY + 170 * s

type Pt = readonly [number, number]
type Quad = readonly [Pt, Pt, Pt, Pt]
const k3 = (value: number): string => String(Math.round(value * 1000) / 1000)
const poly = (points: readonly Pt[]): string => `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`
const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]

// A reflection: Claude on its stool at its desk as flat shapes, in the real critter's cells with the foot of its body
// at 0 0 (its floor 6.6 cells below). Eye holes let the glass show through.
const SIL_FLOOR = 6.6
const SIL_BODY = 'M-5 -7h10v7h-10zM-1 -5v2h1v-2zM2 -5v2h1v-2zM-4 0h1v1.5h-1zM-2 0h1v1.5h-1zM1 0h1v1.5h-1zM3 0h1v1.5h-1z'
const SIL_ARMS = 'M-7 -3h2v2h-2zM5 -3h2v2h-2z'
const SIL_SEAT = 'M-2.6 .1h5.2v.6h-5.2zM-.25 .7h.5v5.6h-.5zM-1.9 6.2h3.8v.4h-3.8zM1.1 -1.25h10v.5h-10zM10.2 -.75h.6v7.4h-.6z'
const SIL_SCR = 'M8.3 -7.6h.8v6.35h-.8z'
const SIL_SCREEN = `<path class="mm-scr" d="${SIL_SCR}"/>`

/** A reflection's path moved `dx` cells, mirrored first when `flip`: two figures can then share one path. */
const moved = (d: string, dx: number, flip: boolean): string =>
  d.replace(/([Mh])(-?[\d.]+)/g, (_, c: string, n: string) =>
    c === 'M' ? `M${k3((flip ? -1 : 1) * Number(n) + dx)}` : `h${flip ? k3(-Number(n)) : n}`,
  )

/** A reflection standing on the floor at (x, y), `sc` the real critter's size. */
function sil(x: number, y: number, sc: number, flip: boolean, opacity: number, d: number, lite = false): string {
  const u = sc * 16
  const inner = lite
    ? `<path class="mm-sb" d="${SIL_BODY}" fill-rule="evenodd"/>${SIL_SCREEN}`
    : `<path d="${SIL_SEAT}" fill="#4a5f74"/><path class="mm-sb" d="${SIL_BODY}" fill-rule="evenodd"/>` +
      `<path class="mm-sb mm-arm" d="${SIL_ARMS}"/>${SIL_SCREEN}`

  return (
    `<g transform="translate(${f(x)} ${f(y - SIL_FLOOR * u)}) scale(${k3(flip ? -u : u)} ${k3(u)})" opacity="${k3(opacity)}">` +
    `<g class="mm-sil" style="--d:${f(d)}s">${inner}</g></g>`
  )
}

// A pane's edge at `t` (0 its near side, 1 its far side): screen x, the glass's top and foot, and the depth there.
type Edge = readonly [x: number, top: number, low: number, s: number]
type Pane = { n: number; side: -1 | 1; dim: number; nest: readonly number[]; count: number; delay: number; free?: true; at: (t: number) => Edge }

const SPANS: readonly (readonly [number, number, number, readonly number[], number])[] = [
  [0.713, 0.409, 1, [0.7, 0.48, 0.32], 3],
  [0.398, 0.3, 0.55, [0.62, 0.38], 2],
  [0.292, 0.236, 0.36, [0.55], 1],
  [0.23, 0.205, 0.26, [], 1],
]
const wallAt =
  (side: -1 | 1, a: number, b: number) =>
  (t: number): Edge => {
    const s = a + (b - a) * t

    return [side < 0 ? lx(s) : rx(s), yTop(s), side < 0 ? yLow(s) : yRail(s), s]
  }
// The maze's turn: a free-standing mirror at 45° across the left half of the hall, a passage open between it and the
// wall, hiding the wall's far end and a slice of the far mirror. Depth s is 1/z, so it is spaced in z to stay a
// straight panel in perspective.
const partAt = (t: number): Edge => {
  const s = 1 / (1 / 0.295 + (1 / 0.261 - 1 / 0.295) * t)

  return [VX + (-960 + 440 * t) * s, VY - 560 * s, VY + 548 * s, s]
}
const PANES: readonly Pane[] = [
  ...([-1, 1] as const).flatMap((side, k) =>
    SPANS.filter((_, i) => side > 0 || i < 3).map(([a, b, dim, nest, count], i) => ({
      n: k * 4 + i,
      side,
      dim: side > 0 && i === 1 ? 0.62 : dim,
      nest,
      count,
      delay: i * 0.2,
      at: wallAt(side, a, b),
    })),
  ),
  { n: 8, side: -1, dim: 0.45, nest: [0.6, 0.36], count: 2, delay: 0.5, free: true, at: partAt },
]

function quadOf(p: Pane): Quad {
  const [ax, aTop, aLow] = p.at(0)
  const [bx, bTop, bLow] = p.at(1)

  return [
    [ax, aTop],
    [bx, bTop],
    [bx, bLow],
    [ax, aLow],
  ]
}

/** Reflections inside the chat column stay a step quieter. */
const hush = (x: number): number => (x > 420 && x < 1180 ? 0.7 : 1)

/** One framed mirror: its glass, the panes it repeats inside itself, and the reflections in it. */
function pane(p: Pane): { def: string; body: string } {
  const quad = quadOf(p)
  const d = poly(quad)
  const [ax, aTop, aLow] = p.at(0)
  const [bx, bTop, bLow] = p.at(1)
  const x0 = Math.min(ax, bx)
  const x1 = Math.max(ax, bx)
  const y0 = aTop
  const y1 = aLow
  const w = x1 - x0
  const h = y1 - y0
  const hero = p.dim >= 1
  const flip = p.side > 0
  // The point the mirror's own copies of itself shrink toward: toward the hall's end and a little up.
  const c: Pt = [p.at(0.68)[0], (bTop + bLow) / 2 - 8]
  const nested = p.nest.map(k => poly(quad.map(q => lerp(c, q, k)))).join('')
  // The queue of reflections along the mirror's floor, sized by depth; the farthest drawn first.
  const at = p.count === 3 ? [0.22, 0.52, 0.8] : p.count === 2 ? [0.25, 0.75] : [0.5]
  const main = at.map(t => {
    const [sx, , low, s] = p.at(t)

    return [sx, low - 22 * s, s * 0.82] as const
  })
  const lite = (sc: number) => sc < 0.16 || p.dim < 0.4
  const people = main
    .map(([sx, sy, sc], j) => sil(sx, sy, sc, flip, p.dim * (0.92 - 0.14 * j) * hush(sx), -(j * 0.18 + p.n * 0.07), lite(sc)))
    .reverse()
    .join('')
  // On a run the reflections of reflections crowd in: copies of the queue, deeper into the glass and higher up.
  const up: Pt = [p.at(0.6)[0], bTop + (bLow - bTop) * 0.36]
  const layer = (k: number) =>
    p.dim < 0.4
      ? ''
      : main
          .map(([sx, sy, sc], i) => {
            const [ex, ey] = lerp(up, [sx, sy], k)

            return sil(ex, ey, sc * k, flip, p.dim * 0.75 * k * hush(ex), -(0.3 + i * 0.2), lite(sc * k))
          })
          .reverse()
          .join('')
  const band = (width: number, at: number): string => {
    const sx = x0 + w * at
    const slant = h * 0.32

    return poly([
      [sx, y0 - 40],
      [sx + width, y0 - 40],
      [sx + width - slant, y1 + 40],
      [sx - slant, y1 + 40],
    ])
  }
  // The lamps of the opposite cornice, caught in the great mirrors and running off into them.
  const glints = [0, 0.24, 0.43, 0.58, 0.7, 0.79]
    .map(t => {
      const [gx, gy] = lerp([ax - p.side * 26, aTop + 50], c, t)
      const r = 3.6 * (1 - t * 0.75)

      return `M${f(gx - r)} ${f(gy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`
    })
    .join('')
  const bw = Math.max(12, w * 0.14)
  const sweep = `--w:${f(w * 1.25)}px`

  return {
    def: `<clipPath id="mm-c${p.n}"><path d="${d}"/></clipPath>`,
    body:
      `<g class="mm-pan" style="--d:${f(p.delay)}s;transform-origin:${f((x0 + x1) / 2)}px ${f((y0 + y1) / 2)}px">` +
      `<g clip-path="url(#mm-c${p.n})">${hero && p.side < 0 ? '<g class="mm-p1">' : ''}` +
      `<path d="${d}" fill="url(#mm-glass)"/>` +
      (nested === '' ? '' : `<path d="${nested}" fill="none" stroke="${ICE}" stroke-opacity="${k3(0.24 * p.dim)}" stroke-width="1.4"/>`) +
      (hero ? `<path d="${glints}" fill="${PALE}" fill-opacity=".5"/>` : '') +
      (hero ? `<g class="mm-ex mm-ex2">${layer(0.42)}</g>` : '') +
      (p.dim < 0.4 ? '' : `<g class="mm-ex">${layer(0.66)}</g>`) +
      people +
      `<path class="mm-sh" style="${sweep};animation-delay:${f(-p.n * 2.3)}s" d="${band(bw, 0.3)}" fill="${PALE}" fill-opacity="${k3(0.07 * p.dim)}"/>` +
      (hero ? `<path class="mm-sh" style="${sweep};animation-delay:${f(-p.n * 2.3 - 1.4)}s" d="${band(5, 0.52)}" fill="${PALE}" fill-opacity=".09"/>` : '') +
      `<path class="mm-gl" style="${sweep}" d="${band(bw * 1.8, 0.2)}" fill="${PALE}" fill-opacity="${k3(0.34 * p.dim)}"/>` +
      (hero ? `<rect class="mm-scan" x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="28" fill="url(#mm-scg)" style="--h:${f(h - 28)}px"/>` : '') +
      (hero && p.side < 0 ? '</g>' : '') +
      '</g>' +
      `<path d="${d}" fill="none" stroke="${FRAME}" stroke-width="9" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${ICE}" stroke-opacity="${k3(0.62 * p.dim)}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path class="mm-rg" d="${d}" fill="none" stroke="${PALE}" stroke-opacity="${k3(0.55 * p.dim)}" stroke-width="4" stroke-linejoin="round"/>` +
      // A free-standing pane shows the thickness of its glass along its near edge.
      (p.free ? `<path d="M${f(ax - 6)} ${f(aTop + 4)}V${f(aLow - 4)}" stroke="${PALE}" stroke-opacity=".3" stroke-width="3"/>` : '') +
      '</g>',
  }
}

/** The great mirror's break: cracks out from the blow, and the glass in wedges that slide out of the frame. */
function shatter(quad: Quad, at: Pt, next: () => number): string {
  const [A, B, C, D] = quad
  const rim: Pt[] = [A, lerp(A, B, 0.5), B, lerp(B, C, 0.34), lerp(B, C, 0.68), C, lerp(C, D, 0.5), D, lerp(D, A, 0.33), lerp(D, A, 0.66)]
  const mid = rim.map(p => lerp(at, p, 0.38 + next() * 0.2))
  const pt = ([x, y]: Pt) => `${f(x)} ${f(y)}`
  const cracks = rim.map((p, i) => `M${pt(at)}L${pt(mid[i] ?? at)}L${pt(p)}`).join('')
  const shards = rim
    .map((p, i) => {
      const q = rim[(i + 1) % rim.length] ?? p
      const m = mid[i] ?? at
      const n = mid[(i + 1) % rim.length] ?? at
      const piece = (points: Pt[], wait: number) => {
        const cx = points.reduce((sum, [px]) => sum + px, 0) / points.length

        return (
          `<path class="mm-shd" style="--f:${f(wait)}s;--x:${f((cx - at[0]) * 0.22 + (next() - 0.5) * 40)}px;--r:${f((next() - 0.5) * 56)}deg" ` +
          `d="${poly(points)}"/>`
        )
      }

      return piece([m, p, q, n], 0.72 + next() * 0.34) + piece([at, m, n], 1.02 + next() * 0.34)
    })
    .join('')

  return (
    `<circle class="mm-imp" cx="${f(at[0])}" cy="${f(at[1])}" r="110" fill="url(#mm-impg)"/>` +
    `<g fill="#223244" fill-opacity=".34" stroke="${ICE}" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round">${shards}</g>` +
    `<g fill="none" stroke="${PALE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">` +
    `<path class="mm-ck" pathLength="1" style="--c:0s" d="${cracks}" stroke-opacity=".9"/>` +
    `<path class="mm-ck" pathLength="1" style="--c:.22s" d="${poly(mid)}" stroke-opacity=".7"/></g>`
  )
}

/** A glass keyboard and a cheval mirror that is the screen: an oval on two posts with Claude in it. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 5 }, (_, i) => `<rect x="${243 + i * 11}" y="325" width="7" height="3" fill="${light}" fill-opacity=".6"/>`).join('')
  const busy = activity === 'run' || activity === 'tool' ? ' class="mm-dz"' : ''

  // Everything stays left of x 412: the desk box's x 420 is the picture's right edge.
  return (
    `<rect x="236" y="322" width="68" height="8" rx="2" fill="${light}" fill-opacity=".14" stroke="${STEEL}" stroke-width="1.6"/>` +
    keys +
    // The posts, their pivots and splayed feet.
    `<path d="M318 330V236M402 330V236" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M310 330L318 318L326 330M394 330L402 318L410 330" fill="none" stroke="${STEEL}" stroke-width="3.4"/>` +
    `<path d="M318 256H324M396 256H402" stroke="#6f8aa2" stroke-width="4"/><circle cx="318" cy="234" r="4" fill="#6f8aa2"/><circle cx="402" cy="234" r="4" fill="#6f8aa2"/>` +
    `<ellipse cx="360" cy="256" rx="36" ry="52" fill="#0a1118" stroke="#5d7488" stroke-width="4"/>` +
    `<ellipse cx="360" cy="256" rx="36" ry="52" fill="${light}" fill-opacity=".12"/>` +
    `<ellipse cx="360" cy="256" rx="28" ry="43" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="2"/>` +
    // Claude in the glass, facing back out at itself.
    `<g${busy}><path d="M346 252h28v20h-28zM348 272h3v5h-3zM354 272h3v5h-3zM363 272h3v5h-3zM369 272h3v5h-3zM374 263h5v5h-5z" fill="#c98a6e" fill-opacity=".9"/>` +
    `<path d="M352 257h3v6h-3zM360 257h3v6h-3z" fill="#05070a"/></g>` +
    `<path d="M338 286L380 220" stroke="${PALE}" stroke-opacity=".3" stroke-width="2.4" stroke-linecap="round"/>` +
    `<ellipse cx="360" cy="256" rx="36" ry="52" fill="none" stroke="${PALE}" stroke-opacity=".5" stroke-width="1"/>`
  )
}

export function mirrorMazeWorld(): World {
  const next = random(5150)
  const panes = PANES.map(pane)
  const far0 = 0.2
  const fx0 = lx(far0)
  const fx1 = rx(far0)
  const fy0 = yCeil(far0)
  const fy1 = yFloor(far0)
  const fw = fx1 - fx0 - 24
  const fh = fy1 - fy0 - 24
  const fcy = (fy0 + fy1) / 2

  // The far mirror, repeating itself: each copy carries two small Claudes facing each other at the foot of its frame,
  // so the copies line up into a corridor of selves running into the glass.
  const tu = 0.24 * 16
  const off = 50 / tu
  const pair = (d: string) => moved(d, -off, false) + moved(d, off, true)
  const tunnel = Array.from({ length: 6 }, (_, i) => {
    const k = Math.pow(0.7, i)
    const foot = fcy + fh / 2 - 6

    return (
      `<g class="mm-zf" style="--k:${k3(k)};--z:${k3(i / 6)}">` +
      `<rect x="${f(VX - fw / 2)}" y="${f(fcy - fh / 2)}" width="${f(fw)}" height="${f(fh)}" fill="none" stroke="${ICE}" stroke-opacity=".32" stroke-width="2.4"/>` +
      `<g transform="translate(${VX} ${f(foot - SIL_FLOOR * tu)}) scale(${k3(tu)})" opacity=".24"><g class="mm-sil" style="--d:${f(-i * 0.2)}s">` +
      `<path class="mm-sb" d="${pair(SIL_BODY)}" fill-rule="evenodd"/><path class="mm-scr" d="${pair(SIL_SCR)}"/></g></g></g>`
    )
  }).join('')

  const seamS = [0.205, 0.236, 0.3, 0.409, 0.713, 1]
  const lanes = [-1100, -550, 0, 550, 1100]
  const ceiling =
    lanes.map(L => `M${f(VX + L * 0.2)} ${f(yCeil(0.2))}L${f(VX + L * 1.3)} ${f(yCeil(1.3))}`).join('') +
    seamS.map(s => `M${f(lx(s))} ${f(yCeil(s))}H${f(rx(s))}`).join('')
  const floorLines =
    [-1100, -825, -550, -275, 0, 275, 550, 825, 1100].map(L => `M${f(VX + L * 0.2)} ${f(yFloor(0.2))}L${f(VX + L * 1.3)} ${f(yFloor(1.3))}`).join('') +
    seamS.map(s => `M${f(lx(s))} ${f(yFloor(s))}H${f(rx(s))}`).join('')
  const wall = (x: (s: number) => number) =>
    poly([
      [x(1.3), yCeil(1.3)],
      [x(far0), yCeil(far0)],
      [x(far0), yFloor(far0)],
      [x(1.3), yFloor(1.3)],
    ])
  const strip = (x: (s: number) => number, top: (s: number) => number) =>
    poly([
      [x(1.3), top(1.3)],
      [x(far0), top(far0)],
      [x(far0), yFloor(far0)],
      [x(1.3), yFloor(1.3)],
    ])
  const edges =
    `M${f(lx(1.3))} ${f(yCeil(1.3))}L${f(fx0)} ${f(fy0)}H${f(fx1)}L${f(rx(1.3))} ${f(yCeil(1.3))}` +
    `M${f(lx(1.3))} ${f(yFloor(1.3))}L${f(fx0)} ${f(fy1)}H${f(fx1)}L${f(rx(1.3))} ${f(yFloor(1.3))}`
  const reflect = (p: Pane) => {
    const [ax, , , sa] = p.at(0)
    const [bx, , , sb] = p.at(1)

    return poly([
      [ax, yFloor(sa)],
      [bx, yFloor(sb)],
      [bx, yFloor(sb) + 230 * sb],
      [ax, yFloor(sa) + 230 * sa],
    ])
  }
  const glows: string[] = []
  const bulbs: string[] = []

  for (const side of [-1, 1] as const) {
    // The left cornice's farthest lamp is behind the free-standing mirror.
    ;[0.66, 0.55, 0.46, 0.385, 0.325, 0.275, 0.235].filter(s => side > 0 || s > 0.25).forEach((s, i) => {
      const x = (side < 0 ? lx(s) : rx(s)) - side * 5
      const y = VY - 578 * s
      const inColumn = x > 400 && x < 1200

      glows.push(
        `<circle class="mm-lamp" style="animation-delay:${f(-i * 0.9 - (side + 1) * 1.7)}s" cx="${f(x)}" cy="${f(y)}" r="${f(24 + 110 * s)}" fill="url(#mm-lmp)" opacity="${inColumn ? 0.45 : 1}"/>`,
      )
      bulbs.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(2 + 6 * s)}" fill-opacity="${inColumn ? 0.5 : 0.95}"/>`)
    })
  }

  const motes = Array.from({ length: 12 }, (_, i) => {
    const left = i % 2 === 0
    const x = left ? 30 + next() * 330 : 1250 + next() * 330
    const y = 120 + next() * (left ? 640 : 400)

    return `<circle class="mm-mote" style="animation-delay:${f(-next() * 12)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.6)}"/>`
  }).join('')
  const star = (x: number, y: number, r: number, delay: number) =>
    `<path class="mm-gt" style="animation-delay:${f(delay)}s" d="M${f(x)} ${f(y - r)}L${f(x + r * 0.22)} ${f(y - r * 0.22)}L${f(x + r)} ${f(y)}L${f(x + r * 0.22)} ${f(y + r * 0.22)}L${f(x)} ${f(y + r)}L${f(x - r * 0.22)} ${f(y + r * 0.22)}L${f(x - r)} ${f(y)}L${f(x - r * 0.22)} ${f(y - r * 0.22)}Z"/>`
  const beamL: Pt[] = [
    [36, 132],
    [334, 292],
    [52, 452],
    [326, 594],
    [74, 744],
  ]
  const beamR: Pt[] = [
    [1586, 104],
    [1258, 252],
    [1574, 382],
    [1296, 508],
  ]
  const trace = (points: readonly Pt[]) => `M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`
  const beams =
    `<g class="mm-web" fill="none" stroke-linejoin="round" stroke-linecap="round">` +
    [beamL, beamR]
      .map(
        (points, i) =>
          `<path d="${trace(points)}" stroke="${ICE}" stroke-opacity=".16" stroke-width="2"/>` +
          `<path class="mm-bm" style="animation-delay:${f(-i * 0.5)}s" pathLength="1" d="${trace(points)}" stroke="${PALE}" stroke-opacity=".8" stroke-width="3"/>`,
      )
      .join('') +
    `<g fill="${PALE}" stroke="none">${[...beamL.slice(1, -1), ...beamR.slice(1, -1)].map(([x, y], i) => star(x, y, 13, -i * 0.35)).join('')}</g></g>`
  const left0 = PANES[0]
  const breakAt: Pt = [198, 416]

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'orbs',
      ink: '#05070a',
      furniture: SEATS,
      metal: STEEL,
      paper: '#dfe8f0',
      light: { idle: '#6e9cc0', work: ICE, bright: '#e6f5ff' },
      headTop: 231,
      glowAt: [360, 256],
      device,
      wear: {
        // A crown of mirror shards on a steel band, all of it above the eyes. Every shard holds a coral glint of Claude,
        // the middle one a whole small Claude, and the larger ones catch a streak of glare.
        front:
          `<path d="M72 250L76 238H224L228 250Z" fill="${STEEL}"/><path d="M76 239H224" stroke="${PALE}" stroke-opacity=".55" stroke-width="1.2"/>` +
          '<path d="M76 239L86 216L92 239ZM100 239L116 200L116 239ZM132 239L150 180L150 239ZM170 239L186 198L186 239ZM202 239L214 214L214 239Z" fill="#d4ecff" fill-opacity=".82"/>' +
          '<path d="M92 239L86 216L98 239ZM116 239L116 200L130 239ZM150 239L150 180L168 239ZM186 239L186 198L200 239ZM214 239L214 214L224 239Z" fill="#6a8fae" fill-opacity=".85"/>' +
          `<path d="M76 239L86 216L98 239M100 239L116 200L130 239M132 239L150 180L168 239M170 239L186 198L200 239M202 239L214 214L224 239" fill="none" stroke="${PALE}" stroke-opacity=".75" stroke-width="1.2" stroke-linejoin="round"/>` +
          '<path d="M143 213h14v10h-14zM141 217h2v3h-2zM157 217h2v3h-2zM145 223h2v3h-2zM153 223h2v3h-2zM108 226h6v4h-6zM184 226h6v4h-6zM84 229h4v3h-4zM211 229h4v3h-4z" fill="#d97757" fill-opacity=".9"/>' +
          '<path d="M146 215.5h2v3.5h-2zM152 215.5h2v3.5h-2z" fill="#05070a"/>' +
          `<path d="M143 209L149 195M110 220L114 210M184 221L188 211" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round"/>`,
      },
      seatArt:
        // A chrome stool with a mirrored seat.
        `<rect x="147" y="358" width="8" height="88" fill="${STEEL}"/><ellipse cx="151" cy="410" rx="22" ry="3.5" fill="none" stroke="${STEEL}" stroke-width="3"/>` +
        `<ellipse cx="151" cy="450" rx="32" ry="5" fill="${SEATS}" stroke="#6f8aa2" stroke-width="1.5"/>` +
        `<ellipse cx="151" cy="354" rx="44" ry="7" fill="#1f2b38" stroke="#8fb4d4" stroke-width="2"/>` +
        `<path d="M118 352Q151 347 184 352" fill="none" stroke="${PALE}" stroke-opacity=".55" stroke-width="1.5"/>`,
      tableArt:
        // A glass desk on chrome trestles, the mirror's light lying on its top.
        `<path d="M186 338L204 456M204 338L186 456M432 338L450 456M450 338L432 456" stroke="${STEEL}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M200 344H436V408H200Z" fill="${ICE}" fill-opacity=".05" stroke="${ICE}" stroke-opacity=".2"/>` +
        `<path d="M238 346L218 406M266 346L250 406M392 346L374 406" stroke="${PALE}" stroke-opacity=".1" stroke-width="3"/>` +
        `<rect x="166" y="330" width="304" height="8" rx="1.5" fill="${ICE}" fill-opacity=".2" stroke="${ICE}" stroke-opacity=".6" stroke-width="1.4"/>` +
        `<path d="M170 331H466" stroke="${PALE}" stroke-opacity=".75" stroke-width="1.2"/><path d="M344 332H402L406 337H340Z" fill="${ICE}" fill-opacity=".25"/>`,
    },
    style:
      `.mm-sb{fill:${BODY}}.ultra .mm-sb{fill:#7d5cf0}` +
      '.mm-scr{fill:#7fb0d6}.st-thinking .mm-scr,.st-responding .mm-scr{fill:#b8e1ff}' +
      '.st-tool .mm-scr,.st-run .mm-scr,.st-web .mm-scr,.st-read .mm-scr,.ultra .mm-scr{fill:#e6f5ff}' +
      '.st-error .mm-scr{fill:#e5484d}.st-done .mm-scr{fill:#3fbf6f}' +
      // Ambient: light slides over the glass, the lamps breathe, dust drifts, the far mirror keeps falling into itself.
      '.mm-sh{animation:mm-sh 16s linear infinite}@keyframes mm-sh{from{transform:translateX(calc(var(--w) * -1))}to{transform:translateX(var(--w))}}' +
      '.st-responding .mm-sh,.st-tool .mm-sh{animation-duration:6s}.st-thinking .mm-sh{animation-duration:26s}' +
      '.mm-lamp{transform-box:fill-box;transform-origin:center;animation:mm-lamp 5s ease-in-out infinite alternate}@keyframes mm-lamp{from{opacity:.62}to{opacity:1}}' +
      '.mm-mote{fill:#cfe9ff;opacity:.3;animation:mm-mote 12s ease-in-out infinite alternate}@keyframes mm-mote{to{transform:translate(14px,-56px);opacity:.08}}' +
      '.mm-zf{transform-origin:800px 462px;transform:scale(var(--k));animation:mm-zoom 30s linear infinite;animation-delay:calc(var(--z) * -30s)}' +
      '@keyframes mm-zoom{0%{transform:scale(.12);opacity:0}20%{transform:scale(.2);opacity:1}40%{transform:scale(.33)}60%{transform:scale(.55)}80%{transform:scale(.9);opacity:.8}100%{transform:scale(1.3);opacity:0}}' +
      '.st-run .mm-zf{animation-duration:2.4s;animation-delay:calc(var(--z) * -2.4s)}.st-done .mm-zf{animation-duration:12s;animation-delay:calc(var(--z) * -12s)}' +
      '.st-error .mm-zf{animation-play-state:paused}' +
      '.mm-hz{animation:mm-hz 7s ease-in-out infinite alternate}@keyframes mm-hz{from{opacity:.55}to{opacity:1}}' +
      // The reflections copy Claude: they breathe, sway, type, ripple, flinch and hop with it.
      '.st-idle .mm-sil{animation:mm-br 4.5s ease-in-out infinite}@keyframes mm-br{50%{transform:scale(1.015,1.03)}}' +
      '.st-thinking .mm-sil{animation:mm-sway 3.2s ease-in-out infinite alternate,mm-echo 2.4s ease-in-out var(--d) infinite}' +
      '@keyframes mm-sway{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}@keyframes mm-echo{0%,100%{opacity:1}50%{opacity:.4}}' +
      '.st-responding .mm-arm{animation:mm-tap .34s ease-in-out infinite alternate}' +
      '.st-tool .mm-arm,.st-web .mm-arm{animation:mm-tap .15s ease-in-out infinite alternate}@keyframes mm-tap{to{transform:translateY(-.6px)}}' +
      '.st-run .mm-sil{animation:mm-rip .9s ease-in-out var(--d) infinite alternate}' +
      '@keyframes mm-rip{from{transform:skewX(-11deg) scaleY(1.03)}to{transform:skewX(11deg) scaleY(.94)}}' +
      '.st-error .mm-sil{animation:mm-shake .5s ease-in-out infinite}@keyframes mm-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-.45px)}75%{transform:translateX(.45px)}}' +
      // Done: every reflection throws its hands up and the whole crowd rocks side to side on its feet, in sync.
      '.st-done .mm-sil{animation:mm-hop 1.4s ease-in-out infinite}' +
      '@keyframes mm-hop{0%,100%{transform:rotate(-7deg)}25%,75%{transform:translateY(-2.4px)}50%{transform:rotate(7deg)}}' +
      '.st-done .mm-arm{animation:mm-raise .3s ease-out both,mm-wv .35s ease-in-out .3s infinite alternate}' +
      '@keyframes mm-raise{to{transform:translate(-1.6px,-6px)}}@keyframes mm-wv{from{transform:translate(-1.6px,-6px)}to{transform:translate(1.6px,-6.8px)}}' +
      // Run: the mirrors revolve on their pivots, more reflections crowd in.
      '.st-run .mm-pan{animation:mm-rev 3.4s ease-in-out var(--d) infinite}' +
      '@keyframes mm-rev{0%,6%{transform:scaleX(1)}30%{transform:scaleX(.04)}44%,58%{transform:scaleX(-1)}82%{transform:scaleX(.04)}96%,100%{transform:scaleX(1)}}' +
      '.mm-ex{opacity:.3}.mm-ex2{opacity:0}.helper .mm-ex{opacity:.55}' +
      '.st-run .mm-ex,.st-done .mm-ex{animation:mm-fi 1s ease-out .35s both}.st-run .mm-ex2,.st-done .mm-ex2{animation-delay:1.1s}@keyframes mm-fi{to{opacity:1}}' +
      '.mm-dz{transform-origin:360px 262px;animation:mm-dz 1.4s ease-in-out infinite alternate}@keyframes mm-dz{from{transform:scale(.7)}to{transform:scale(1.05)}}' +
      // Tool: the mirrors tilt as if being set.
      '.st-tool .mm-pan{animation:mm-tilt 1.3s ease-in-out var(--d) infinite alternate}@keyframes mm-tilt{to{transform:scaleX(.84)}}' +
      // Read: a line of light scans down the two great mirrors.
      '.mm-scan{opacity:0}.st-read .mm-scan{animation:mm-scan 1.8s ease-in-out infinite}' +
      '@keyframes mm-scan{0%{opacity:0;transform:translateY(0)}12%,88%{opacity:1}100%{opacity:0;transform:translateY(var(--h))}}' +
      // Web: a beam of light bounces from mirror to mirror.
      '.mm-web{opacity:0}.st-web .mm-web{animation:mm-fi .4s ease-out both}' +
      '.mm-bm{stroke-dasharray:.16 .84;animation:mm-bm 1.4s linear infinite}@keyframes mm-bm{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.mm-gt{transform-box:fill-box;transform-origin:center;animation:mm-gt 1.4s ease-in-out infinite}@keyframes mm-gt{0%,100%{opacity:.15;transform:scale(.5)}50%{opacity:.95;transform:scale(1.1)}}' +
      // Error: the great mirror cracks from the blow, its glass falls out in wedges, the lamps sag.
      '.mm-imp{opacity:0}.st-error .mm-imp{animation:mm-imp 1.3s ease-out both}@keyframes mm-imp{0%{opacity:0}15%{opacity:.5}100%{opacity:0}}' +
      '.mm-ck{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .mm-ck{animation:mm-ck 1.6s ease-out var(--c) both}' +
      '@keyframes mm-ck{0%{opacity:1;stroke-dashoffset:1}30%{stroke-dashoffset:0}62%{opacity:1}100%{opacity:0;stroke-dashoffset:0}}' +
      '.mm-shd{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .mm-shd{animation:mm-fall 1.3s cubic-bezier(.55,0,.9,.55) var(--f) both}' +
      '@keyframes mm-fall{0%{opacity:1;transform:translate(0,0) rotate(0deg)}75%{opacity:.85}100%{opacity:0;transform:translate(var(--x),480px) rotate(var(--r))}}' +
      '.st-error .mm-p1{animation:mm-dark .5s ease-in .8s both}@keyframes mm-dark{to{opacity:.06}}' +
      '.st-error .mm-lamp{animation:mm-dip 1.4s ease-in-out infinite}@keyframes mm-dip{0%,100%{opacity:.9}50%{opacity:.3}}' +
      // Done: a gleam runs over every mirror and the lamps come up.
      '.mm-gl{opacity:0}.st-done .mm-gl{animation:mm-gl 3s ease-in-out .2s infinite both}' +
      '@keyframes mm-gl{0%{opacity:0;transform:translateX(calc(var(--w) * -.36))}12%,52%{opacity:1}70%,100%{opacity:0;transform:translateX(calc(var(--w) * .9))}}' +
      '.mm-rg{opacity:0}.st-done .mm-rg{animation:mm-rg 1.8s ease-out var(--d) both}@keyframes mm-rg{0%{opacity:0}30%{opacity:1}100%{opacity:.4}}' +
      '.st-done .mm-lamp{animation:mm-lup 1.4s ease-out both}@keyframes mm-lup{from{opacity:.7}to{opacity:1;transform:scale(1.25)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="mm-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070a"/><stop offset=".46" stop-color="#0a0e14"/><stop offset="1" stop-color="#05070a"/></linearGradient>' +
      '<linearGradient id="mm-glass" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#18232f"/><stop offset=".5" stop-color="#0d141c"/><stop offset="1" stop-color="#080c11"/></linearGradient>' +
      '<linearGradient id="mm-flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1219"/><stop offset="1" stop-color="#05070a"/></linearGradient>' +
      `<linearGradient id="mm-ref" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity=".12"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="mm-scg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity="0"/><stop offset=".5" stop-color="${PALE}" stop-opacity=".4"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="mm-lmp"><stop offset="0" stop-color="${PALE}" stop-opacity=".4"/><stop offset=".3" stop-color="${ICE}" stop-opacity=".14"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="mm-impg"><stop offset="0" stop-color="${PALE}" stop-opacity=".6"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="mm-hzg"><stop offset="0" stop-color="${ICE}" stop-opacity=".09"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      panes.map(p => p.def).join('') +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#mm-bg)"/>' +
      // The far mirror at the end of the hall, and the haze of light there.
      `<rect x="${f(fx0)}" y="${f(fy0)}" width="${f(fx1 - fx0)}" height="${f(fy1 - fy0)}" fill="#0a0f15" stroke="${FRAME}" stroke-width="6"/>` +
      `<ellipse class="mm-hz" cx="${VX}" cy="${f(fcy)}" rx="420" ry="250" fill="url(#mm-hzg)"/>` +
      tunnel +
      `<rect x="${f(fx0 + 6)}" y="${f(fy0 + 6)}" width="${f(fx1 - fx0 - 12)}" height="${f(fy1 - fy0 - 12)}" fill="none" stroke="${ICE}" stroke-opacity=".22" stroke-width="1.4"/>` +
      // Ceiling, floor and the two walls.
      `<path d="${poly([
        [lx(1.3), yCeil(1.3)],
        [rx(1.3), yCeil(1.3)],
        [fx1, fy0],
        [fx0, fy0],
      ])}" fill="#06080c"/>` +
      `<path d="${ceiling}" fill="none" stroke="${ICE}" stroke-opacity=".06" stroke-width="1.4"/>` +
      `<path d="${poly([
        [lx(1.3), yFloor(1.3)],
        [rx(1.3), yFloor(1.3)],
        [fx1, fy1],
        [fx0, fy1],
      ])}" fill="url(#mm-flr)"/>` +
      `<path d="${floorLines}" fill="none" stroke="${ICE}" stroke-opacity=".07" stroke-width="1.4"/>` +
      PANES.filter(p => p.side < 0 && p.dim > 0.5)
        .map(p => `<path d="${reflect(p)}" fill="url(#mm-ref)" opacity="${k3(p.dim)}"/>`)
        .join('') +
      `<path d="${wall(lx)}" fill="#0a0d12"/><path d="${wall(rx)}" fill="#0a0d12"/>` +
      `<path d="${strip(lx, s => yLow(s) + 10 * s)}" fill="#07090d"/><path d="${strip(rx, s => yRail(s) + 16 * s)}" fill="#07090c"/>` +
      `<path d="M${f(lx(1.3))} ${f(yLow(1.3) + 13)}L${f(fx0)} ${f(yLow(far0) + 2)}" stroke="${ICE}" stroke-opacity=".14" stroke-width="2"/>` +
      `<path d="M${f(rx(1.3))} ${f(yRail(1.3) + 21)}L${f(fx1)} ${f(yRail(far0) + 3)}" stroke="${ICE}" stroke-opacity=".3" stroke-width="2"/>` +
      `<path d="${seamS.map(s => `M${f(rx(s))} ${f(yRail(s) + 16 * s)}V${f(yFloor(s))}`).join('')}" stroke="${ICE}" stroke-opacity=".06" stroke-width="2"/>` +
      `<path d="${edges}" fill="none" stroke="${ICE}" stroke-opacity=".12" stroke-width="1.6"/>` +
      panes.map(p => p.body).join('') +
      // The lamps along the cornices.
      glows.join('') +
      `<g fill="${PALE}">${bulbs.join('')}</g>` +
      (left0 === undefined ? '' : shatter(quadOf(left0), breakAt, next)) +
      beams +
      motes,
    nook:
      `<defs><radialGradient id="mm-pool"><stop offset="0" stop-color="${ICE}" stop-opacity=".14"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient></defs>` +
      '<ellipse cx="300" cy="456" rx="210" ry="14" fill="url(#mm-pool)"/>' +
      `<path d="M-80 456H470" stroke="${ICE}" stroke-opacity=".16" stroke-width="1.5"/>`,
  }
}
