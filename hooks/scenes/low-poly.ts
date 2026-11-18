import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Low Poly: a valley at dusk where everything is flat-shaded triangles. A faceted moon over a triangulated sky,
// faceted mountain ranges, a polygon lake that mirrors them, triangle pines. Claude works at a faceted desk on a
// hill in an origami hat. When a command runs the great mountain on the left shatters into its facets, which swirl
// and reassemble into a huge low-poly bird; an error breaks the hill's facets apart around the desk; done raises a
// faceted sun whose bloom of triangles spreads across the sky.
type Pt = { x: number; y: number; z: number }
type Tri = readonly [Pt, Pt, Pt]
type XY = readonly [number, number]

const pt = (x: number, y: number, z = 0): Pt => ({ x, y, z })
const LIGHT = [-0.5, -0.62, 0.6] as const
const TEAL = '#5b8c85'
const PASTEL = ['#f2b79c', '#9fd3c7', '#c8b6e2', '#f0d08a'] as const
const METAL = '#34484a'
const METAL_LIT = '#5d7c78'

/** Whole numbers for path data, a space only where no minus sign already parts them. */
const join = (values: readonly number[]): string => values.map((v, i) => (i > 0 && v >= 0 ? ' ' : '') + String(v)).join('')

/** A point on the whole-number grid that facets are drawn on, so neighbours share corners exactly. */
const snap = (v: XY | Pt): XY => ('x' in v ? [Math.round(v.x), Math.round(v.y)] : [Math.round(v[0]), Math.round(v[1])])

/** One triangle as a short relative path segment. */
function tri(t: readonly (XY | Pt)[]): string {
  const [a, b, c] = t.map(snap) as [XY, XY, XY]

  return `M${join(a)}l${join([b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1]])}Z`
}

const mid = (t: Tri): XY => [(t[0].x + t[1].x + t[2].x) / 3, (t[0].y + t[1].y + t[2].y) / 3]

/** How much a facet faces the light from the upper left: 0 in shadow, 1 full on. */
function lum(t: Tri): number {
  const [a, b, c] = t
  const ux = b.x - a.x
  const uy = b.y - a.y
  const uz = b.z - a.z
  const vx = c.x - a.x
  const vy = c.y - a.y
  const vz = c.z - a.z
  let nx = uy * vz - uz * vy
  let ny = uz * vx - ux * vz
  let nz = ux * vy - uy * vx

  if (nz < 0) {
    nx = -nx
    ny = -ny
    nz = -nz
  }

  const dot = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / (Math.hypot(nx, ny, nz) || 1)

  return Math.min(1, Math.max(0, (dot - 0.12) / 0.8))
}

/**
 * Facets merged into one path per colour, each stroked in its own colour so no seams show between them (the stroke's
 * width and joins come from the wrapper round the whole picture).
 */
function merged(items: readonly { d: string; fill: string }[]): string {
  const by = new Map<string, string>()

  for (const item of items) by.set(item.fill, (by.get(item.fill) ?? '') + item.d)

  return [...by].map(([fill, d]) => `<path d="${d}" fill="${fill}" stroke="${fill}"/>`).join('')
}

const SEAMS = '<g stroke-width=".9" stroke-linejoin="round">'

/** A grid of jittered points cut into triangles, the low-poly way. */
function lattice(x0: number, y0: number, cols: number, rows: number, dx: number, dy: number, jit: number, seed: number): Tri[] {
  const next = random(seed)
  const grid: Pt[][] = []

  for (let j = 0; j <= rows; j += 1) {
    const row: Pt[] = []

    for (let i = 0; i <= cols; i += 1) {
      const jx = i > 0 && i < cols ? (next() - 0.5) * dx * jit : 0
      const jy = j > 0 && j < rows ? (next() - 0.5) * dy * jit : 0

      row.push(pt(x0 + i * dx + jx, y0 + j * dy + jy))
    }

    grid.push(row)
  }

  const tris: Tri[] = []

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = grid[j]![i]!
      const b = grid[j]![i + 1]!
      const c = grid[j + 1]![i + 1]!
      const d = grid[j + 1]![i]!

      if ((i + j) % 2 === 0) tris.push([a, b, c], [a, c, d])
      else tris.push([a, b, d], [b, c, d])
    }
  }

  return tris
}

/** A mountain as a triangular lattice over a cone, so each facet gets a true slope to shade by. */
function cone(px: number, py: number, w: number, base: number, rows: number, seed: number): Tri[] {
  const next = random(seed)
  const grid: Pt[][] = []

  for (let k = 0; k <= rows; k += 1) {
    const half = (w * k) / rows
    const row: Pt[] = []

    for (let i = 0; i <= k; i += 1) {
      const edge = i === 0 || i === k
      const step = k === 0 ? 0 : (2 * half) / k
      const x = px + (k === 0 ? 0 : -half + step * i + (next() - 0.5) * step * (edge ? 0.3 : 0.55))
      const y = py + ((base - py) * k) / rows + (k === 0 || k === rows ? 0 : (next() - 0.5) * ((base - py) / rows) * 0.45)
      const reach = (w * (y - py)) / (base - py)
      const z = edge ? 0 : Math.sqrt(Math.max(0, reach * reach - (x - px) * (x - px))) * (0.75 + next() * 0.5)

      row.push(pt(x, y, z))
    }

    grid.push(row)
  }

  const tris: Tri[] = []

  for (let k = 0; k < rows; k += 1) {
    for (let i = 0; i <= k; i += 1) {
      tris.push([grid[k]![i]!, grid[k + 1]![i]!, grid[k + 1]![i + 1]!])
      if (i < k) tris.push([grid[k]![i]!, grid[k + 1]![i + 1]!, grid[k]![i + 1]!])
    }
  }

  return tris
}

type Tone = { shadow: string; lit: string; glow: string }

/** A facet's colour: shadow to lit by its slope, the lit tops warmed by the last of the dusk. */
function shade(t: Tri, tone: Tone, top: number, base: number, steps = 6): string {
  const b = Math.round(lum(t) * steps) / steps
  const h = (mid(t)[1] - top) / (base - top)
  const g = Math.round(Math.max(0, 1 - h * 2.2) * b * 3) / 3
  const c = mix(tone.shadow, tone.lit, b)

  return g > 0 ? mix(c, tone.glow, g * 0.6) : c
}

function range(peaks: readonly (readonly [number, number, number])[], base: number, rows: number, tone: Tone, seed: number): { d: string; fill: string }[] {
  return peaks.flatMap(([x, y, w], i) => cone(x, y, w, base, rows, seed + i).map(t => ({ d: tri(t), fill: shade(t, tone, y, base) })))
}

/** A round faceted body (the moon, the sun): a pentagon inside a decagon over a sphere, lit from the upper left. */
function orb(cx: number, cy: number, r: number, seed: number): Tri[] {
  const next = random(seed)
  const outer = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + (next() - 0.5) * 0.25

    return pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  })
  const inner = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5 + (next() - 0.5) * 0.3
    const rr = r * 0.55

    return pt(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.sqrt(r * r - rr * rr))
  })
  const core = pt(cx - r * 0.08, cy - r * 0.06, r)
  const tris: Tri[] = []

  for (let i = 0; i < 5; i += 1) {
    const a = inner[i]!
    const b = inner[(i + 1) % 5]!
    const o0 = outer[2 * i]!
    const o1 = outer[2 * i + 1]!
    const o2 = outer[(2 * i + 2) % 10]!

    tris.push([core, a, b], [a, o0, o1], [a, o1, o2], [a, o2, b])
  }

  return tris
}

/** Triangle pines: three tiers, each split into a lit half and a shadow half, merged across a whole stand. */
function pines(list: readonly (readonly [number, number, number, number])[]): { lit: string; dark: string; trunk: string } {
  let lit = ''
  let dark = ''
  let trunk = ''

  for (const [x, base, h, w] of list) {
    trunk += `M${Math.round(x - w * 0.06)} ${Math.round(base)}v${Math.round(-h * 0.22)}h${Math.max(2, Math.round(w * 0.12))}V${Math.round(base)}Z`

    for (let k = 0; k < 3; k += 1) {
      const half = (w / 2) * (1 - k * 0.24)
      const bottom = base - h * 0.16 - k * h * 0.25
      const top = bottom - h * (0.46 - k * 0.04)

      lit += tri([[x - half, bottom], [x, top], [x, bottom + 4]])
      dark += tri([[x, top], [x + half, bottom], [x, bottom + 4]])
    }
  }

  return { lit, dark, trunk }
}

function stand(list: readonly (readonly [number, number, number, number])[], lit: string, dark: string, attrs = ''): string {
  const p = pines(list)

  return `<g${attrs}><path d="${p.trunk}" fill="#14110f"/><path d="${p.dark}" fill="${dark}"/><path d="${p.lit}" fill="${lit}"/></g>`
}

/** A flat-bottomed low-poly cloud: a bumpy top cut into a strip of triangles, lighter on top. */
function cloud(x: number, y: number, w: number, h: number, seed: number): string {
  const next = random(seed)
  const n = 7
  const top: XY[] = Array.from({ length: n }, (_, i) => [x - w / 2 + (w * i) / (n - 1), y - h * Math.sin((Math.PI * i) / (n - 1)) * (0.55 + next() * 0.6)])
  const low: XY[] = top.map(([px], i) => [px + (i % 2 ? 6 : -6), y])
  let upper = ''
  let lower = ''

  for (let i = 0; i < n - 1; i += 1) {
    upper += tri([top[i]!, top[i + 1]!, low[i + 1]!])
    lower += tri([top[i]!, low[i + 1]!, low[i]!])
  }

  return `<path d="${lower}" fill="#1a1d30" stroke="#1a1d30"/><path d="${upper}" fill="#272a42" stroke="#272a42"/>`
}

// The great bird the mountain becomes: points and facets in its own frame, flying right with both wings raised.
const BP: Record<string, XY> = {
  A: [172, -40], H1: [128, -56], H2: [108, -38], H3: [136, -26], N1: [88, -28], N2: [104, -6], S: [50, -24], C: [72, 14],
  B: [10, 30], K: [0, -14], R: [-64, 2], Rb: [-54, 22], T1: [-172, -34], T2: [-184, 4], T3: [-150, 36],
  W1: [56, -98], W2: [22, -178], W3: [-44, -238], W4: [-60, -180], W5: [-104, -170], W6: [-74, -122], W7: [-110, -98], W8: [-48, -62],
  F1: [100, -92], F2: [128, -152], F3: [116, -200], F4: [86, -144], F5: [68, -82],
}
const BIRD_TONES = ['#8fc7bb', '#5f9a90', '#33605b', '#e2b09a', '#b88296', '#264846', '#3d6d67'] as const
/** Facets as three point names, a tone, and the part: far wing, body, near wing. */
const BIRD: readonly (readonly [string, string, string, number, 'f' | 'b' | 'n'])[] = [
  ['S', 'F1', 'F5', 6, 'f'], ['F1', 'F2', 'F4', 5, 'f'], ['F1', 'F4', 'F5', 5, 'f'], ['F2', 'F3', 'F4', 6, 'f'],
  ['A', 'H1', 'H3', 0, 'b'], ['H1', 'H2', 'H3', 1, 'b'], ['H2', 'N2', 'H3', 2, 'b'], ['H2', 'N1', 'N2', 1, 'b'],
  ['N1', 'S', 'N2', 0, 'b'], ['N2', 'S', 'C', 3, 'b'], ['S', 'K', 'C', 1, 'b'], ['K', 'B', 'C', 3, 'b'], ['K', 'R', 'B', 1, 'b'],
  ['R', 'Rb', 'B', 2, 'b'], ['R', 'T1', 'T2', 0, 'b'], ['R', 'T2', 'Rb', 4, 'b'], ['Rb', 'T2', 'T3', 2, 'b'],
  ['S', 'W1', 'K', 0, 'n'], ['W1', 'W8', 'K', 1, 'n'], ['W1', 'W2', 'W8', 0, 'n'], ['W2', 'W6', 'W8', 1, 'n'], ['W2', 'W4', 'W6', 2, 'n'],
  ['W2', 'W3', 'W4', 0, 'n'], ['W4', 'W5', 'W6', 1, 'n'], ['W6', 'W7', 'W8', 2, 'n'], ['W8', 'R', 'K', 2, 'n'],
]
const BIRD_AT: XY = [292, 330]
const BIRD_SCALE = 1.2
const SWIRL: XY = [290, 300]
const toPicture = ([x, y]: XY): XY => [BIRD_AT[0] + x * BIRD_SCALE, BIRD_AT[1] + y * BIRD_SCALE]
/** Where each wing meets the body: the wings beat from there. */
const NEAR_ROOT = toPicture([24, -18])
const FAR_ROOT = toPicture([56, -40])
const origin = ([x, y]: XY): string => `transform-origin:${f(x)}px ${f(y)}px`

/** A triangle's corners in turning order around its centre. */
function turning(p: readonly XY[]): XY[] {
  const cx = (p[0]![0] + p[1]![0] + p[2]![0]) / 3
  const cy = (p[0]![1] + p[1]![1] + p[2]![1]) / 3

  return [...p].sort((u, v) => Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx))
}

const num = (v: number): string => String(Number(v.toFixed(3))).replace(/^(-?)0\./, '$1.')
const matrix = (m: readonly number[]): string => `matrix(${num(m[0]!)},${num(m[1]!)},${num(m[2]!)},${num(m[3]!)},${Math.round(m[4]!)},${Math.round(m[5]!)})`

/** The affine map that carries triangle p onto triangle q, corner for corner, picking the pairing that turns least. */
function carry(pIn: readonly XY[], qIn: readonly XY[]): number[] {
  const p = turning(pIn)
  const q0 = turning(qIn)
  const pc = [(p[0]![0] + p[1]![0] + p[2]![0]) / 3, (p[0]![1] + p[1]![1] + p[2]![1]) / 3]
  const qc = [(q0[0]![0] + q0[1]![0] + q0[2]![0]) / 3, (q0[0]![1] + q0[1]![1] + q0[2]![1]) / 3]
  let best = 0
  let cost = Infinity

  for (let r = 0; r < 3; r += 1) {
    let sum = 0

    for (let i = 0; i < 3; i += 1) {
      const a = p[i]!
      const b = q0[(i + r) % 3]!
      sum += (b[0] - qc[0]! - (a[0] - pc[0]!)) ** 2 + (b[1] - qc[1]! - (a[1] - pc[1]!)) ** 2
    }

    if (sum < cost) {
      cost = sum
      best = r
    }
  }

  const q = [0, 1, 2].map(i => q0[(i + best) % 3]!)
  const [p0, p1, p2] = p as [XY, XY, XY]
  const [r0, r1, r2] = q as [XY, XY, XY]
  const a11 = p1[0] - p0[0]
  const a12 = p2[0] - p0[0]
  const a21 = p1[1] - p0[1]
  const a22 = p2[1] - p0[1]
  const det = a11 * a22 - a12 * a21
  const b11 = r1[0] - r0[0]
  const b12 = r2[0] - r0[0]
  const b21 = r1[1] - r0[1]
  const b22 = r2[1] - r0[1]
  const a = (b11 * a22 - b12 * a21) / det
  const c = (-b11 * a12 + b12 * a11) / det
  const b = (b21 * a22 - b22 * a21) / det
  const d = (-b21 * a12 + b22 * a11) / det

  return [a, b, c, d, r0[0] - a * p0[0] - c * p0[1], r0[1] - b * p0[0] - d * p0[1]]
}

/** A facet flung out of the mountain: turned about its own centre, shrunk, set down on a ring round the swirl. */
function fling(c: XY, angle: number, radius: number, turn: number, scale: number): number[] {
  const t: XY = [SWIRL[0] + Math.cos(angle) * radius, SWIRL[1] + Math.sin(angle) * radius]
  const cos = Math.cos(turn) * scale
  const sin = Math.sin(turn) * scale

  return [cos, sin, -sin, cos, t[0] - (cos * c[0] - sin * c[1]), t[1] - (sin * c[0] + cos * c[1])]
}

/** The great mountain on the left, facet by facet, each one ready to fly into the bird. */
function greatMountain(): string {
  const next = random(53)
  const tone: Tone = { shadow: '#0f1920', lit: '#41646a', glow: '#8a6478' }
  const facets = cone(190, 250, 290, 700, 6, 41)
    .map(t => ({ t, c: mid(t) }))
    .sort((u, v) => u.c[1] - v.c[1] || u.c[0] - v.c[0])
  const bird = BIRD.map(([a, b, c, tone, part]) => {
    const q = [BP[a]!, BP[b]!, BP[c]!].map(toPicture)

    return { q, tone, part, y: (q[0]![1] + q[1]![1] + q[2]![1]) / 3 }
  }).sort((u, v) => u.y - v.y)
  const parts: Record<'f' | 'b' | 'n' | 'x', string> = { f: '', b: '', n: '', x: '' }
  let wire = ''

  facets.forEach(({ t, c }, i) => {
    const d = tri(t)
    const fill = shade(t, tone, 250, 700, 7)
    const away = Math.atan2(c[1] - SWIRL[1], c[0] - SWIRL[0]) + (next() - 0.5) * 0.9
    const burst = fling(c, away, 130 + next() * 110, (next() - 0.5) * 5, 0.5 + next() * 0.3)
    const target = bird[i]
    const body = `<path d="${d}" fill="${fill}" stroke="${fill}"/>`

    wire += d

    if (target === undefined) {
      const far = fling(c, away + 0.9, 300 + next() * 120, (next() - 0.5) * 9, 0.2)

      parts.x += `<g class="lp-du" style="--p:${matrix(burst)};--q:${matrix(far)}">${body}</g>`

      return
    }

    const color = BIRD_TONES[target.tone]!

    parts[target.part] +=
      `<g class="lp-sh" style="--p:${matrix(burst)};--q:${matrix(carry(t.map(snap), target.q))}">${body}` +
      `<path class="lp-tn" d="${d}" fill="${color}" stroke="${color}"/></g>`
  })

  const eye = toPicture([122, -42])

  return (
    `<g class="lp-qk"><g class="lp-gd"><circle class="lp-bg" cx="${BIRD_AT[0]}" cy="${BIRD_AT[1] - 60}" r="300" fill="url(#lp-bgl)"/>` +
    `<g class="lp-sw"><g class="lp-wf">${parts.f}</g>${parts.b}<g class="lp-wn">${parts.n}</g>${parts.x}</g>` +
    `<g class="lp-be"><circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="4.4" fill="#0b1513"/><circle cx="${f(eye[0] + 1.4)}" cy="${f(eye[1] - 1.4)}" r="1.4" fill="#fff2e6"/></g></g>` +
    `<path class="lp-wire" d="${wire}" fill="none" stroke="#bff0e4" stroke-width="1.6" stroke-linejoin="round"/></g>`
  )
}

/** The rising sun's bloom: rings of triangles round its centre, two warm tones a ring, each ring fainter. */
function bloom(): string {
  const next = random(71)
  const radii = [64, 160, 290, 460, 680, 860]
  const counts = [5, 7, 9, 11, 13]
  const levels = [0.34, 0.28, 0.22, 0.16, 0.11]
  const tones = [
    ['#ffd2b0', '#f2a58e'],
    ['#f6b89c', '#e0909e'],
    ['#eaa496', '#c9879f'],
    ['#d89aa4', '#a98bb8'],
    ['#b894b6', '#8c86b8'],
  ]

  return counts
    .map((n, k) => {
      const r0 = radii[k]!
      const r1 = radii[k + 1]!
      const skew = next() * Math.PI
      let a = ''
      let b = ''

      for (let i = 0; i < n; i += 1) {
        const t0 = skew + (i / n) * Math.PI * 2
        const t1 = skew + ((i + 1) / n) * Math.PI * 2
        const tm = (t0 + t1) / 2 + (next() - 0.5) * 0.2
        const p0: XY = [Math.cos(t0) * r0, Math.sin(t0) * r0]
        const p1: XY = [Math.cos(t1) * r0, Math.sin(t1) * r0]
        const q: XY = [Math.cos(tm) * r1, Math.sin(tm) * r1]
        const q1: XY = [Math.cos(tm + Math.PI * 2 / n) * r1, Math.sin(tm + Math.PI * 2 / n) * r1]

        a += tri([p0, q, p1])
        b += tri([p1, q, q1])
      }

      const [ta, tb] = tones[k] as [string, string]

      return (
        `<g class="lp-bl" style="animation-delay:${f(0.7 + k * 0.28)}s"><path d="${a}" fill="${ta}" fill-opacity="${levels[k]}"/>` +
        `<path d="${b}" fill="${tb}" fill-opacity="${num(levels[k]! * 0.75)}"/></g>`
      )
    })
    .join('')
}

/** The laptop on the desk and a faceted gem hovering on a stand beside it. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 13}" y="323" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const busy = activity === 'tool' || activity === 'run' || activity === 'web'

  return (
    // The laptop: a faceted wedge and a lid leaning back toward the window.
    `<path d="M238 330L250 320H348L356 330Z" fill="${METAL}"/><path d="M250 320H348L332 325H264Z" fill="${METAL_LIT}" fill-opacity=".7"/>` +
    keys +
    `<path d="M338 324L370 235L385 239L353 328Z" fill="${METAL}"/><path d="M353 328L385 239L369 290Z" fill="${METAL_LIT}" fill-opacity=".45"/>` +
    `<path d="M342 321L372 241L378 243L348 323Z" fill="${light}"/>` +
    // The gem: an octahedron, its facets lit by the screen, turning over a little stand.
    '<path d="M392 330L396 319H406L410 330Z" fill="#2a3a3b"/><path d="M392 330L396 319H401V330Z" fill="#3c5352"/>' +
    `<g transform="translate(401 266)"><g class="lp-gb"><circle class="lp-gh" r="${busy ? 30 : 24}" fill="${light}" fill-opacity=".14"/><g class="lp-gm">` +
    `<path d="M0 -21L12 0L0 25L-12 0Z" fill="${light}" fill-opacity=".4"/><path d="M0 -21L-12 0H0Z" fill="#f4fffb" fill-opacity=".8"/>` +
    `<path d="M0 -21L12 0H0Z" fill="${light}" fill-opacity=".85"/><path d="M-12 0H0V25Z" fill="${light}" fill-opacity=".6"/></g></g></g>`
  )
}

export function lowPolyWorld(): World {
  const next = random(11)
  const SKY: readonly (readonly [number, string])[] = [
    [0, '#060b11'],
    [0.45, '#0a1220'],
    [0.75, '#141629'],
    [1, '#2a1f33'],
  ]
  const ramp = (t: number): string => {
    for (let i = 1; i < SKY.length; i += 1) {
      const [t1, c1] = SKY[i]!
      const [t0, c0] = SKY[i - 1]!

      if (t <= t1) return mix(c0, c1, Math.max(0, (t - t0) / (t1 - t0)))
    }

    return SKY[SKY.length - 1]![1]
  }
  const sky = merged(
    lattice(-60, 0, 9, 5, 192, 132, 0.7, 3).map(t => {
      const [cx, cy] = mid(t)
      const depth = Math.round(Math.min(1, cy / 660) * 6) / 6
      const grain = Math.floor(next() * 3)
      const near = cx > 420 && cx < 1180 ? 0.5 : 1

      return { d: tri(t), fill: mix(ramp(depth), '#4a4468', grain * 0.05 * near) }
    }),
  )

  let starsSide = ''
  let starsMid = ''
  let twinkles = ''

  for (let i = 0; i < 24; i += 1) {
    const x = next() * 1600
    const y = next() * 420
    const s = 0.9 + next() * 1.4
    const h = s * 1.7
    const d = `M${f(x)} ${f(y - h)}l${f(s)} ${f(h)}${f(-s)} ${f(h)}${f(-s)} ${f(-h)}Z`

    if (i % 6 === 0) twinkles += `<path class="lp-tw" style="animation-delay:${f(-next() * 4)}s" d="${d}" fill="#f0e8f4"/>`
    else if (x > 420 && x < 1180) starsMid += d
    else starsSide += d
  }

  const moon = merged(orb(330, 140, 56, 23).map(t => ({ d: tri(t), fill: mix('#4c4668', '#ece0ec', Math.round(lum(t) * 6) / 6) })))
  const sun = merged(orb(0, 0, 52, 29).map(t => ({ d: tri(t), fill: mix('#e8866a', '#ffe8c6', Math.round(lum(t) * 5) / 5) })))
  const farPeaks = [[-20, 470, 200], [180, 500, 170], [420, 446, 230], [700, 486, 200], [930, 436, 240], [1160, 476, 190], [1380, 456, 230]] as const
  const far = range(
    farPeaks,
    656,
    3,
    { shadow: '#111526', lit: '#2a2e46', glow: '#4c3a58' },
    60,
  )
  const right = range(
    [[1270, 404, 170], [1610, 400, 190], [1452, 322, 230]],
    668,
    4,
    { shadow: '#0c1620', lit: '#2c4854', glow: '#6e5672' },
    80,
  )
  const lake = merged(
    lattice(-40, 656, 8, 3, 210, 60, 0.6, 9).map(t => {
      const tier = Math.floor(next() * 3)

      return { d: tri(t), fill: mix(['#0b171c', '#0e1e24', '#12272d'][tier]!, '#1c3a40', mid(t)[1] < 690 ? 0.35 : 0) }
    }),
  )
  // The far range mirrored in the lake, as one soft silhouette.
  const reflection = `<path d="${farPeaks.map(([x, y, w]) => tri([[x - w, 656], [x, 1312 - y], [x + w, 656]])).join('')}" fill="#262a44" fill-opacity=".5"/>`
  // Glints on the lake: slivers of light in three sets that shimmer out of step.
  const glints = [0, 1, 2]
    .map(k => {
      const d = Array.from({ length: 4 }, () => {
        const x = 380 + next() * 1140
        const y = 668 + next() * 130
        const w = 18 + next() * 34

        return tri([[x, y], [x + w, y + 1], [x + w * 0.4, y + 4]])
      }).join('')

      return `<path class="lp-gl" style="animation-delay:${f(-k * 1.2)}s" d="${d}" fill="#a8dcd2"/>`
    })
    .join('')
  const shore = merged(
    lattice(-60, 694, 6, 1, 106, 74, 0.5, 15).map(t => ({ d: tri(t), fill: next() > 0.5 ? '#0c1716' : '#0f1c1a' })),
  )
  const shorePines = Array.from({ length: 12 }, (_, i) => [-10 + i * 44 + next() * 22, 706 + next() * 34, 52 + next() * 60, 30 + next() * 16] as const)
  const rightPines = Array.from({ length: 7 }, (_, i) => [1200 + i * 60 + next() * 24, 672 + next() * 16, 40 + next() * 42, 24 + next() * 12] as const)
  const ground = merged(
    lattice(-60, 832, 9, 2, 196, 88, 0.5, 13).map(t => ({ d: tri(t), fill: ['#08100f', '#0b1513', '#0e1917'][Math.floor(next() * 3)]! })),
  )
  const flock = Array.from({ length: 5 }, (_, i) => {
    const x = 1660 + (i % 3) * 46 + next() * 30
    const y = 80 + i * 16 + next() * 30
    const s = 1.1 + next() * 0.7

    return (
      `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><g class="lp-fk" style="animation-delay:${f(i * 0.18)}s">` +
      `<path class="lp-wg" style="animation-delay:${f(-next())}s" d="M-14-2 0 2-3 6ZM14-2 0 2 3 6Z" fill="#cdeee6"/></g></g>`
    )
  }).join('')
  const motes = Array.from({ length: 8 }, (_, i) => {
    const x = i < 5 ? 40 + next() * 360 : 1220 + next() * 340
    const y = 600 + next() * 180
    const s = 3 + next() * 3

    return `<path class="lp-mt" style="--dx:${f((next() - 0.5) * 70)}px;animation-delay:${f(-next() * 9)}s" d="${tri([[x, y - s], [x + s, y + s * 0.7], [x - s, y + s * 0.7]])}" fill="${PASTEL[i % 4]}"/>`
  }).join('')
  // The sun's rays: thin triangles from its centre, long and short in turn, fading outward.
  const ray = (i: number, length: number): string => {
    const a = ((i * 22.5 + 6) * Math.PI) / 180
    const side = (k: number): XY => [Math.cos(a + k * 1.5708) * 9, Math.sin(a + k * 1.5708) * 9]

    return tri([side(-1), [Math.cos(a) * length, Math.sin(a) * length], side(1)])
  }
  const rays =
    `<path class="lp-ry" d="${[0, 2, 4, 6, 8, 10, 12, 14].map(i => ray(i, 560)).join('')}" fill="url(#lp-ryg)"/>` +
    `<path class="lp-ry" style="animation-delay:.25s" d="${[1, 3, 5, 7, 9, 11, 13, 15].map(i => ray(i, 380)).join('')}" fill="url(#lp-ryg)"/>`
  const sunGlints = [0, 1, 2, 3, 4]
    .map(i => {
      const w = 64 - i * 10 + next() * 16
      const x = 1440 - w / 2 + (next() - 0.5) * 40

      return tri([[x, 668 + i * 22], [x + w, 669 + i * 22], [x + w * (0.3 + next() * 0.4), 671 + i * 22]])
    })
    .join('')
  const constellation = [[1262, 92], [1318, 50], [1376, 104], [1432, 60], [1496, 112], [1548, 66], [1376, 104], [1318, 50]] as const
  const hill = hillFacets()

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#081011',
      furniture: '#263736',
      metal: METAL,
      paper: '#e6efe9',
      light: { idle: '#5f9a92', work: '#8fd6c8', bright: '#d0f4ec' },
      headTop: 225,
      glowAt: [356, 282],
      device,
      wear: {
        // A folded paper hat worn at a tilt, its crease and flap catching the screen; faint facets on the body.
        front:
          '<path d="M74 248L118 170L226 238Z" fill="#4f7e77"/><path d="M74 248L118 170L140 242Z" fill="#94cbbf"/>' +
          '<path d="M118 170L226 238L140 242Z" fill="#679d94"/><path d="M112 244L150 206L188 240Z" fill="#7fb4aa"/>' +
          '<path d="M150 206L188 240L160 241Z" fill="#4f7e77"/><path d="M70 246L228 236L230 246L72 254Z" fill="#2f5550"/>' +
          '<path d="M118 170L112 160L124 158Z" fill="#e0ae96"/>' +
          '<path d="M70 350V320L124 350Z" fill="#081011" fill-opacity=".16"/><path d="M230 316V350H170Z" fill="#ffffff" fill-opacity=".07"/>',
      },
      // A faceted boulder for a seat.
      seatArt:
        '<path d="M102 360L120 349H182L200 358L206 402L198 456H106L96 404Z" fill="#22302f"/>' +
        '<path d="M102 360L120 349H182L200 358L152 366Z" fill="#557370"/><path d="M102 360L152 366L96 404Z" fill="#3a5250"/>' +
        '<path d="M96 404L152 366L136 456H106Z" fill="#2e4241"/><path d="M152 366L200 358L206 402Z" fill="#33494a"/>' +
        '<path d="M152 366L206 402L198 456H136Z" fill="#1c2928"/>',
      // A slab desk with a faceted front edge and angular legs.
      tableArt:
        '<path d="M162 330H474L468 343H168Z" fill="#263736"/><path d="M162 330H474L471 334H165Z" fill="#5d7c78"/>' +
        `<path d="${Array.from({ length: 10 }, (_, i) => `M${168 + i * 30} 343L${183 + i * 30} 334L${198 + i * 30} 343Z`).join('')}" fill="#3a5250"/>` +
        '<path d="M182 343H206L198 456H188Z" fill="#1f2d2c"/><path d="M182 343H194L193 456H188Z" fill="#33494a"/>' +
        '<path d="M430 343H454L448 456H438Z" fill="#1f2d2c"/><path d="M430 343H442L443 456H438Z" fill="#33494a"/>' +
        '<path d="M198 392L438 380V388L198 400Z" fill="#1f2d2c"/>',
    },
    style:
      // Ambient: stars twinkle, clouds drift, the lake glints, pastel motes rise, the front pines sway.
      '.lp-tw{animation:lp-tw 3.4s ease-in-out infinite alternate}@keyframes lp-tw{from{opacity:.12}to{opacity:.85}}' +
      '.lp-cl{animation:lp-cl 70s ease-in-out infinite alternate}@keyframes lp-cl{to{transform:translateX(110px)}}' +
      '.lp-cl2{animation-duration:54s;animation-direction:alternate-reverse}' +
      '.lp-gl{opacity:.05;animation:lp-gl 3.6s ease-in-out infinite alternate}@keyframes lp-gl{to{opacity:.42}}' +
      '.st-responding .lp-gl{animation-duration:1.6s}' +
      '.lp-mt{opacity:0;animation:lp-mt 9s ease-in-out infinite}' +
      '@keyframes lp-mt{0%{opacity:0;transform:translate(0,0)}20%{opacity:.75}80%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),-130px)}}' +
      '.lp-sway{transform-box:fill-box;transform-origin:50% 100%;animation:lp-sway 7s ease-in-out infinite alternate}@keyframes lp-sway{from{transform:rotate(-1.1deg)}to{transform:rotate(1.1deg)}}' +
      '.lp-mh{animation:lp-mh 6s ease-in-out infinite alternate}@keyframes lp-mh{from{opacity:.75}to{opacity:1}}' +
      // The gem on the desk turns, faster while tools run; it pulses while Claude thinks.
      '.lp-gm{transform-box:fill-box;transform-origin:center;animation:lp-gm 5s ease-in-out infinite}@keyframes lp-gm{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.22)}}' +
      '.st-tool .lp-gm,.st-run .lp-gm,.st-web .lp-gm{animation-duration:1.1s}.st-responding .lp-gm{animation-duration:2.4s}' +
      '.lp-gb{animation:lp-gb 3.6s ease-in-out infinite alternate}@keyframes lp-gb{to{transform:translateY(-7px)}}' +
      '.st-thinking .lp-gh{transform-box:fill-box;transform-origin:center;animation:lp-gp 1.4s ease-in-out infinite alternate}@keyframes lp-gp{from{transform:scale(.8)}to{transform:scale(1.5)}}' +
      // Web: a flock of folded birds crosses the top. Read: a triangle constellation draws itself.
      '.lp-fk{opacity:0}.st-web .lp-fk{animation:lp-fk 8s linear infinite}' +
      '@keyframes lp-fk{0%{opacity:0;transform:translateX(0)}8%,88%{opacity:.8}100%{opacity:0;transform:translateX(-1960px)}}' +
      '.lp-wg{transform-box:fill-box;transform-origin:50% 60%;animation:lp-wg .45s ease-in-out infinite alternate}@keyframes lp-wg{to{transform:scaleY(.3)}}' +
      '.lp-cn{stroke-dasharray:1;stroke-dashoffset:1;opacity:.25}.st-read .lp-cn{animation:lp-cn 1.6s ease-out .1s both}@keyframes lp-cn{0%{opacity:.25;stroke-dashoffset:1}100%{opacity:.75;stroke-dashoffset:0}}' +
      '.lp-cs{opacity:.3}.st-read .lp-cs{animation:lp-tw .8s ease-in-out infinite alternate}' +
      // Run: the mountain shudders and shows its wireframe, its facets fly out on a swirl and settle as the bird.
      '.st-run .lp-qk{animation:lp-qk .42s linear both}.st-error .lp-qk{animation:lp-qk .5s linear 3 both}' +
      '@keyframes lp-qk{0%,100%{transform:translate(0,0)}20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-3px,1px)}80%{transform:translate(3px,0)}}' +
      '.lp-wire{opacity:0}.st-run .lp-wire{animation:lp-wire .9s ease-out both}@keyframes lp-wire{0%{opacity:0}20%{opacity:.8}100%{opacity:0}}' +
      '.st-run .lp-sh{animation:lp-mx 2.3s cubic-bezier(.45,0,.25,1) .3s both}@keyframes lp-mx{0%{transform:none}34%{transform:var(--p)}100%{transform:var(--q)}}' +
      '.st-run .lp-du{animation:lp-du 2.3s cubic-bezier(.45,0,.25,1) .3s both}@keyframes lp-du{0%{transform:none}34%{transform:var(--p);opacity:1}100%{transform:var(--q);opacity:0}}' +
      '.lp-tn{opacity:0}.st-run .lp-tn{animation:lp-tn 2.3s ease-in-out .3s both}@keyframes lp-tn{0%,38%{opacity:0}86%,100%{opacity:1}}' +
      '.st-run .lp-sw{transform-origin:290px 300px;animation:lp-sw 2.3s cubic-bezier(.5,0,.4,1) .3s both}@keyframes lp-sw{from{transform:rotate(0)}to{transform:rotate(360deg)}}' +
      '.st-run .lp-gd{animation:lp-gd 3s ease-in-out 2.6s infinite alternate}@keyframes lp-gd{to{transform:translate(12px,-16px)}}' +
      `.st-run .lp-wn{${origin(NEAR_ROOT)};animation:lp-fl 1.3s ease-in-out 2.6s infinite alternate}` +
      `.st-run .lp-wf{${origin(FAR_ROOT)};animation:lp-fl 1.3s ease-in-out 2.6s infinite alternate}@keyframes lp-fl{to{transform:scale(1,.55)}}` +
      '.lp-bg,.lp-be{opacity:0}.st-run .lp-bg{animation:lp-in 1.4s ease-out 1.9s both}.st-run .lp-be{animation:lp-in .5s ease-out 2.5s both}' +
      '@keyframes lp-in{to{opacity:1}}' +
      // Error: the hill's facets break apart round the desk over a rose glow, and hang there; the pines lean.
      '.lp-gs{transform-box:fill-box;transform-origin:center}' +
      '.st-error .lp-gs{animation:lp-gs 1.1s cubic-bezier(.2,.9,.3,1.15) .12s both}@keyframes lp-gs{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.st-error .lp-gf{animation:lp-gf 2s ease-in-out 1.25s infinite alternate}@keyframes lp-gf{to{transform:translateY(-7px)}}' +
      '.lp-rg{opacity:0}.st-error .lp-rg{animation:lp-in .9s ease-out .2s both}' +
      '.lp-pn{transform-box:fill-box;transform-origin:50% 100%}.st-error .lp-pn{animation:lp-lean 1.3s ease-out .15s both}' +
      '@keyframes lp-lean{0%{transform:rotate(0)}30%{transform:rotate(-7deg)}55%{transform:rotate(3deg)}100%{transform:rotate(-4deg)}}' +
      // Done: a faceted sun rises behind the right peak, its rays and rings of triangles bloom; the moon and stars fade.
      '.lp-sun{opacity:0}.st-done .lp-sun{animation:lp-rise 2.4s cubic-bezier(.2,.7,.3,1) .1s both}' +
      '@keyframes lp-rise{from{opacity:0;transform:translateY(210px)}30%{opacity:1}to{opacity:1;transform:translateY(0)}}' +
      '.lp-ry{opacity:0}.st-done .lp-ry{animation:lp-ry 1.6s ease-out .6s both}@keyframes lp-ry{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}' +
      '.st-done .lp-rs{animation:mv-spin 120s linear infinite}' +
      '.lp-bl{opacity:0}.st-done .lp-bl{animation:lp-bl 1.2s ease-out both}@keyframes lp-bl{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}' +
      '.lp-sr{opacity:0}.st-done .lp-sr{animation:lp-in 1.8s ease-out 1s both}' +
      '.st-done .lp-mn,.st-done .lp-st{animation:lp-dim 2.6s ease-in-out both}@keyframes lp-dim{to{opacity:.3}}' +
      '.lp-pt{opacity:0}.st-done .lp-pt{transform-box:fill-box;transform-origin:center;animation:lp-pt 3.2s ease-out both}' +
      '@keyframes lp-pt{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}',
    scenery:
      '<defs>' +
      '<linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060b11"/><stop offset=".5" stop-color="#0c1322"/><stop offset=".68" stop-color="#1f1a2e"/><stop offset="1" stop-color="#0b171c"/></linearGradient>' +
      '<radialGradient id="lp-mhg"><stop offset="0" stop-color="#d9c8e6" stop-opacity=".3"/><stop offset=".35" stop-color="#b8a4d0" stop-opacity=".1"/><stop offset="1" stop-color="#b8a4d0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lp-bgl"><stop offset="0" stop-color="#8fd6c8" stop-opacity=".3"/><stop offset=".5" stop-color="#5b8c85" stop-opacity=".1"/><stop offset="1" stop-color="#5b8c85" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lp-sg"><stop offset="0" stop-color="#ffd8b8" stop-opacity=".5"/><stop offset=".4" stop-color="#f2a58e" stop-opacity=".16"/><stop offset="1" stop-color="#f2a58e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lp-ryg" gradientUnits="userSpaceOnUse" r="560"><stop offset="0" stop-color="#ffe0c2" stop-opacity=".5"/><stop offset="1" stop-color="#ffe0c2" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#lp-sky)"/>' +
      SEAMS +
      sky +
      `<g class="lp-st"><path d="${starsSide}" fill="#f0e8f4" fill-opacity=".6"/><path d="${starsMid}" fill="#f0e8f4" fill-opacity=".3"/>${twinkles}</g>` +
      `<g class="lp-mn"><circle class="lp-mh" cx="330" cy="140" r="250" fill="url(#lp-mhg)"/>${moon}</g>` +
      `<g class="lp-cl">${cloud(700, 130, 280, 54, 5)}${cloud(170, 330, 220, 40, 6)}</g>` +
      `<g class="lp-cl lp-cl2">${cloud(1040, 214, 240, 44, 7)}${cloud(560, 300, 180, 34, 8)}</g>` +
      merged(far) +
      // The sun, its rays and its bloom, at the far right behind the right peak.
      '<g class="mv-r"><g transform="translate(1440 250)">' +
      `<g class="lp-rs">${rays}</g>${bloom()}` +
      `<g class="lp-sun"><circle r="300" fill="url(#lp-sg)"/>${sun}</g></g>` +
      merged(right) +
      '</g>' +
      lake +
      reflection +
      '<path d="M-40 656H1640" stroke="#5b8c85" stroke-opacity=".35" stroke-width="2"/>' +
      glints +
      `<g class="mv-r"><path class="lp-sr" d="${sunGlints}" fill="#f8c8a6" fill-opacity=".6"/>${stand(rightPines, '#1f3a36', '#0d1b19')}</g>` +
      greatMountain() +
      shore +
      stand(shorePines, '#24413b', '#0f1f1c') +
      `<g class="mv-b">${ground}` +
      stand([[60, 1012, 400, 124]], '#1d3732', '#0a1614', ' class="lp-sway"') +
      stand([[178, 1024, 300, 96]], '#1d3732', '#0a1614', ' class="lp-sway" style="animation-delay:-3s"') +
      stand([[336, 1010, 220, 78], [-10, 990, 260, 90]], '#1b332f', '#0a1614') +
      '</g>' +
      `<g class="mv-r"><g class="mv-t"><path class="lp-cn" pathLength="1" d="M${constellation.map(([x, y]) => `${x} ${y}`).join('L')}" fill="none" stroke="#bfe6dc" stroke-width="1.6"/>` +
      `<g class="lp-cs" fill="#f0e8f4">${constellation.slice(0, 6).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g></g></g>` +
      flock +
      motes +
      '</g>',
    nook:
      '<defs><radialGradient id="lp-rgg"><stop offset="0" stop-color="#f08aa2" stop-opacity=".7"/><stop offset=".5" stop-color="#c25a7a" stop-opacity=".28"/><stop offset="1" stop-color="#c25a7a" stop-opacity="0"/></radialGradient></defs>' +
      // The pines on the hill, behind the desk.
      stand([[4, 424, 330, 112]], '#21403a', '#0c1a18', ' class="lp-pn"') +
      stand([[88, 410, 150, 62]], '#21403a', '#0c1a18', ' class="lp-pn" style="animation-delay:.12s"') +
      stand([[452, 384, 210, 76]], '#1d3833', '#0b1816', ' class="lp-pn" style="animation-delay:.2s"') +
      // Under the hill: the rose glow and the cracks that show when its facets lift.
      `<g class="lp-rg"><ellipse cx="180" cy="410" rx="340" ry="120" fill="url(#lp-rgg)"/><path d="${hill.wire}" fill="none" stroke="#f39ab0" stroke-opacity=".8" stroke-width="2.2" stroke-linejoin="round"/></g>` +
      `${SEAMS}<g class="lp-gf">${hill.facets}</g></g>` +
      // The petals of the bloom, rising off the hill when the work is done.
      Array.from({ length: 12 }, (_, i) => {
        const x = -40 + next() * 480
        const y = 360 + next() * 90
        const s = 8 + next() * 8

        return (
          `<path class="lp-pt" style="--dx:${Math.round((next() - 0.6) * 220)}px;--dy:${Math.round(-260 - next() * 260)}px;--r:${Math.round(180 + next() * 360)}deg;animation-delay:${f(0.2 + next() * 1.2)}s" ` +
          `d="${tri([[x, y - s], [x + s, y + s * 0.8], [x - s * 0.9, y + s * 0.5]])}" fill="${PASTEL[i % 4]}"/>`
        )
      }).join(''),
    front:
      // Tufts of triangle grass at the foot of the seat and the desk.
      `<path d="${[92, 116, 212, 228, 300, 418, 462]
        .map(x => `M${x - 6} 458L${x - 2} 444L${x + 1} 458ZM${x} 458L${x + 5} 448L${x + 7} 458Z`)
        .join('')}" fill="#2f5049"/>`,
  }
}

/** The hill under the desk: three rows of facets, each free to lift away on an error, and their seams as cracks. */
function hillFacets(): { facets: string; wire: string } {
  const next = random(97)
  const crest: XY[] = [[-260, 470], [-170, 438], [-80, 404], [20, 376], [120, 360], [220, 350], [320, 336], [440, 320]]
  const mid2: XY[] = crest.map(([x, y], i) => [x + (i % 2 ? 18 : -18), (y + 476) / 2 + (next() - 0.5) * 16])
  const low: XY[] = crest.map(([x]) => [x, 476])
  const tones = [['#2a4a44', '#33574f', '#24423c'], ['#1a302c', '#1f3833', '#162a26']] as const
  let facets = ''
  let wire = ''

  for (let i = 0; i < crest.length - 1; i += 1) {
    const bands: [XY[], XY[]][] = [
      [crest, mid2],
      [mid2, low],
    ]

    bands.forEach(([upper, lower], band) => {
      for (const t of [
        [upper[i]!, upper[i + 1]!, lower[i + 1]!],
        [upper[i]!, lower[i + 1]!, lower[i]!],
      ]) {
        const cx = (t[0]![0] + t[1]![0] + t[2]![0]) / 3
        const near = Math.max(0.3, 1 - Math.abs(cx - 230) / 420)
        const fill = tones[band]![Math.floor(next() * 3)]!
        const d = tri(t)

        wire += d
        facets +=
          `<path class="lp-gs" style="--dx:${Math.round((cx - 200) * 0.22 + (next() - 0.5) * 30)}px;--dy:${Math.round(-(40 + next() * 110) * near - band * 10)}px;--r:${Math.round((next() - 0.5) * 80)}deg" ` +
          `d="${d}" fill="${fill}" stroke="${fill}"/>`
      }
    })
  }

  return { facets, wire }
}
