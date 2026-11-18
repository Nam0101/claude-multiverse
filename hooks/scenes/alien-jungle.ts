import type { Activity } from '../../types'
import { f, random } from './kit'
import type { P } from './rig'
import type { World } from './world'

// Alien Jungle: a xenobiologist's field dome on a night world lit only by what lives there. A giant spiral fungus
// curls out of the undergrowth on the left under two moons, glowing tendrils hang from an umbrella tree on the right,
// and a potted specimen, a carnivorous plant, sways behind the desk. When a command runs a huge stilt-legged beast
// strides through the background; an error makes the specimen lunge and snap at the desk; done sends a wave of
// blooms and glowing spores across the jungle.
const TEAL = '#3df5d0'
const CYAN = '#8ff8ff'
const VIOLET = '#b07cff'
const PINK = '#ff6ad5'
const AMBER = '#ffcf6a'
const ALARM = '#ff4f6e'
const NIGHT = '#0a0616'
const RIM = '#7048c8'
const METAL = '#251e3e'
const METAL_EDGE = '#463a74'
const PAPER = '#e6e2f7'

/** A whole number, for the big generated outlines where tenths don't show. */
const k = (value: number): string => String(Math.round(value))

type Curl = { body: string; spine: string; dots: [number, number, number][] }

/**
 * A fiddlehead fungus: a spiral cap curling out of a tall stalk, as one tapering outline, its centre line and the
 * photophores along it. The curl's outer end sits on the side `dir` points to, and the stalk falls from there to
 * `base`.
 */
function fiddlehead(c: P, dir: number, r1: number, turns: number, base: P, w1: number, wBase: number, n: number): Curl {
  const pts: P[] = []
  const widths: number[] = []
  const r0 = r1 / 16

  for (let i = 0; i <= n; i += 1) {
    const u = i / n
    const a = -turns * Math.PI * 2 * (1 - u)
    const r = r0 * Math.pow(r1 / r0, u)

    pts.push([c[0] + dir * r * Math.cos(a), c[1] + r * Math.sin(a)])
    widths.push(3 + (w1 - 3) * Math.pow(u, 1.2))
  }

  const ex = c[0] + dir * r1
  const ey = c[1]
  const drop = base[1] - ey
  const c1: P = [ex + dir * r1 * 0.12, ey + drop * 0.35]
  const c2: P = [base[0], base[1] - drop * 0.45]
  const m = Math.max(6, Math.round(n / 4))

  for (let i = 1; i <= m; i += 1) {
    const t = i / m
    const k = 1 - t

    pts.push([
      k * k * k * ex + 3 * k * k * t * c1[0] + 3 * k * t * t * c2[0] + t * t * t * base[0],
      k * k * k * ey + 3 * k * k * t * c1[1] + 3 * k * t * t * c2[1] + t * t * t * base[1],
    ])
    widths.push(w1 + (wBase - w1) * t)
  }

  const left: string[] = []
  const right: string[] = []
  const dots: [number, number, number][] = []

  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)] ?? [x, y]
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)] ?? [x, y]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    const h = (widths[i] ?? 3) / 2

    left.push(`${k(x + nx * h)} ${k(y + ny * h)}`)
    right.push(`${k(x - nx * h)} ${k(y - ny * h)}`)

    if (i > n * 0.22 && i % 3 === 0) {
      const side = (i / 3) % 2 ? 0.45 : -0.45

      dots.push([x + nx * h * side, y + ny * h * side, Math.max(1.8, h * 0.13)])
    }
  })

  return {
    body: `M${left.join('L')}L${right.reverse().join('L')}Z`,
    spine: `M${pts.map(([x, y]) => `${k(x)} ${k(y)}`).join('L')}`,
    dots,
  }
}

/** Tiny squares as one path: stars, far lights. */
function specks(points: readonly [number, number][], size: number): string {
  return points.map(([x, y]) => `M${k(x)} ${k(y)}h${size}v${size}h${-size}z`).join('')
}

/** A row of alien flora on the horizon: umbrella fungi, spires and bulb stalks, as one path and the lights on them. */
function skyline(next: () => number, base: number, x0: number, x1: number, count: number, scale: number): { d: string; lights: [number, number][] } {
  let d = ''
  const lights: [number, number][] = []

  for (let i = 0; i < count; i += 1) {
    const x = x0 + ((x1 - x0) * (i + next() * 0.9)) / count
    const h = (70 + next() * 170) * scale
    const top = base - h
    const lean = (next() - 0.5) * 30 * scale
    const kind = next()
    const tx = x + lean

    if (kind < 0.45) {
      const w = (5 + next() * 7) * scale
      const rx = (20 + next() * 38) * scale
      const ry = (9 + next() * 13) * scale

      d += `M${k(x - w)} ${base}L${k(tx - w * 0.5)} ${k(top)}H${k(tx + w * 0.5)}L${k(x + w)} ${base}Z`
      d += `M${k(tx - rx)} ${k(top + 2)}C${k(tx - rx)} ${k(top - ry * 1.5)} ${k(tx + rx)} ${k(top - ry * 1.5)} ${k(tx + rx)} ${k(top + 2)}Q${k(tx)} ${k(top - ry * 0.3)} ${k(tx - rx)} ${k(top + 2)}Z`
      lights.push([tx - rx * 0.62, top], [tx + rx * 0.6, top])
    } else if (kind < 0.75) {
      const w = (9 + next() * 13) * scale

      d += `M${k(x - w)} ${base}Q${k(x - w * 0.2 + lean)} ${k(base - h * 0.6)} ${k(x + lean * 1.6)} ${k(top - 30 * scale)}Q${k(x + w * 0.2 + lean)} ${k(base - h * 0.6)} ${k(x + w)} ${base}Z`
      lights.push([x + lean * 1.6 - 1, top - 30 * scale])
    } else {
      const r = (9 + next() * 13) * scale

      d += `M${k(x - 3 * scale)} ${base}L${k(tx - 2 * scale)} ${k(top)}H${k(tx + 2 * scale)}L${k(x + 3 * scale)} ${base}Z`
      d += `M${k(tx + r)} ${k(top - r)}a${k(r)} ${k(r)} 0 1 0 ${k(-2 * r)} 0a${k(r)} ${k(r)} 0 1 0 ${k(2 * r)} 0Z`
      lights.push([tx - 1, top - r])
    }
  }

  return { d, lights }
}

/** A leaf blade from its base to its tip, `w` wide at the middle, and its midrib: two path pieces, so many share a path. */
function frond(bx: number, by: number, len: number, deg: number, w: number): [string, string] {
  const a = (deg * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const tx = bx + dx * len
  const ty = by + dy * len
  const mx = bx + dx * len * 0.5
  const my = by + dy * len * 0.5

  return [
    `M${k(bx)} ${k(by)}Q${k(mx - dy * w)} ${k(my + dx * w)} ${k(tx)} ${k(ty)}Q${k(mx + dy * w)} ${k(my - dx * w)} ${k(bx)} ${k(by)}Z`,
    `M${k(bx)} ${k(by)}Q${k(mx - dy * w * 0.15)} ${k(my + dx * w * 0.15)} ${k(tx)} ${k(ty)}`,
  ]
}

/** Leaves from a list of [base x, base y, length, angle, width], as one blade path and one rib path. */
function leaves(list: readonly (readonly number[])[]): [string, string] {
  const parts = list.map(([bx, by, len, deg, w]) => frond(bx ?? 0, by ?? 0, len ?? 0, deg ?? 0, w ?? 0))

  return [parts.map(([blade]) => blade).join(''), parts.map(([, rib]) => rib).join('')]
}

/** Round dots as one path. */
function dotPath(points: readonly (readonly [number, number, number])[]): string {
  return points.map(([x, y, r]) => `M${k(x - r)} ${k(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`).join('')
}

/** A bloom that opens on done: six rounded petals round a bright heart, and a halo that fades in behind it. */
function bloom(x: number, y: number, s: number, color: string, halo: string, delay: number): string {
  const petals = Array.from({ length: 6 }, (_, k) => `M0 0L${f(Math.cos((k * Math.PI) / 3) * s)} ${f(Math.sin((k * Math.PI) / 3) * s)}`).join('')

  return (
    `<g transform="translate(${f(x)} ${f(y)})" style="--d:${f(delay)}s"><circle class="aj-bh" r="${f(s * 2)}" fill="url(#${halo})"/>` +
    `<g class="aj-bl"><path d="${petals}" stroke="${color}" stroke-opacity=".85" stroke-width="${f(s * 0.52)}" stroke-linecap="round"/>` +
    `<circle r="${f(s * 0.26)}" fill="#f4fffc"/></g></g>`
  )
}

/** The stilt-legged beast, facing right: four jointed legs whose knees rise over a glowing jelly bell, filaments hanging under it, a frilled head grazing low on a long neck. */
function beast(next: () => number): string {
  const legs: readonly [P, P, P, number, boolean][] = [
    [[-58, -50], [-118, -236], [-150, 432], -0.8, false],
    [[58, -50], [124, -236], [156, 432], 0, false],
    [[-100, -22], [-240, -180], [-320, 432], 0, true],
    [[100, -22], [244, -176], [324, 432], -0.8, true],
  ]
  const leg = ([hx, hy]: P, [kx, ky]: P, [fx, fy]: P, delay: number, near: boolean): string => {
    const d = `M0 0L${kx - hx} ${ky - hy}L${fx - hx} ${fy - hy}`
    const foot = `M${fx - hx - 18} ${fy - hy + 2}L${fx - hx} ${fy - hy - 12}L${fx - hx + 18} ${fy - hy + 2}`

    return (
      `<g transform="translate(${hx} ${hy})"><g class="aj-leg" style="animation-delay:${delay}s"${near ? '' : ' opacity=".72"'}>` +
      `<path d="${d}${foot}" fill="none" stroke="${NIGHT}" stroke-width="${near ? 15 : 10}" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#9a74f4" stroke-opacity=".8" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<circle class="aj-ph" cx="${kx - hx}" cy="${ky - hy}" r="${near ? 6 : 4.5}" fill="${TEAL}"/></g></g>`
    )
  }
  const filaments = [-98, -66, -36, -6, 24, 54, 86]
    .map((x, i) => {
      const len = 100 + next() * 110

      return (
        `<g class="aj-fil" style="animation-delay:${f(-next() * 2)}s;animation-duration:${f(1.4 + next())}s">` +
        `<path d="M${x} 12c9 ${f(len * 0.35)} -9 ${f(len * 0.65)} 4 ${f(len)}" fill="none" stroke="#8a62e8" stroke-opacity=".55" stroke-width="2.4"/>` +
        `<circle class="aj-ph" cx="${x + 4}" cy="${f(12 + len)}" r="4" fill="${i % 2 ? PINK : TEAL}"/></g>`
      )
    })
    .join('')
  const rimLights = `<path class="aj-ph" d="${dotPath(Array.from({ length: 9 }, (_, i) => [-112 + i * 28, i % 2 ? 6 : 2, 4.4] as const))}" fill="${TEAL}"/>`

  return (
    leg(...legs[0]!) +
    leg(...legs[1]!) +
    filaments +
    '<path d="M-128 6C-128 -70 -66 -112 0 -112C66 -112 128 -70 128 6C92 22 -92 22 -128 6Z" fill="url(#aj-bell)" stroke="#a27cf6" stroke-opacity=".65" stroke-width="2.5"/>' +
    '<path d="M-100 -44C-60 -66 60 -66 100 -44M-120 -14C-70 -34 70 -34 120 -14" fill="none" stroke="#d2b6ff" stroke-opacity=".22" stroke-width="2"/>' +
    `<ellipse cx="-10" cy="-46" rx="44" ry="22" fill="${TEAL}" fill-opacity=".12"/>` +
    rimLights +
    `<g fill="${VIOLET}"><circle cx="-34" cy="-104" r="3"/><circle cx="0" cy="-110" r="3.4"/><circle cx="34" cy="-104" r="3"/></g>` +
    leg(...legs[2]!) +
    leg(...legs[3]!) +
    // The neck and the head with its frill of feelers and a dangling lure.
    `<path d="M112 -24C176 -30 226 -4 252 50" fill="none" stroke="${NIGHT}" stroke-width="17" stroke-linecap="round"/>` +
    '<path d="M112 -24C176 -30 226 -4 252 50" fill="none" stroke="#9a74f4" stroke-opacity=".6" stroke-width="2"/>' +
    '<g transform="translate(254 52) rotate(34)"><g class="aj-head">' +
    '<path d="M8 -12L-8 -56M17 -17L10 -64M27 -19L30 -62M37 -16L46 -52" fill="none" stroke="#8a62e8" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>' +
    `<g fill="${VIOLET}"><circle cx="-8" cy="-56" r="3"/><circle cx="10" cy="-64" r="3"/><circle cx="30" cy="-62" r="3"/><circle cx="46" cy="-52" r="3"/></g>` +
    `<path d="M-10 -4C4 -26 40 -28 60 -8C46 -2 22 6 2 12Z" fill="${NIGHT}" stroke="#a27cf6" stroke-opacity=".65" stroke-width="2"/>` +
    `<circle class="aj-ph" cx="42" cy="-11" r="4" fill="${TEAL}"/><circle class="aj-ph" cx="29" cy="-9" r="2.6" fill="${TEAL}"/>` +
    `<path d="M52 -2q8 20 -2 36" fill="none" stroke="#8a62e8" stroke-opacity=".6" stroke-width="2"/><circle cx="50" cy="35" r="4" fill="${PINK}"/>` +
    '</g></g>'
  )
}

/** The field laptop, the specimen jars beside it and a petri dish. Self-contained: portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'tool' || activity === 'run' || activity === 'thinking'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const bubbles = [0, 1, 2].map(i => `<circle class="aj-bub" style="--d:${f(-i * 0.43)}s" cx="${376 + i * 6}" cy="322" r="${f(2.2 - i * 0.4)}" fill="#c6fff1"/>`).join('')

  return (
    // The laptop, its lid rimmed in the screen's light.
    `<rect x="242" y="323" width="96" height="7" rx="2" fill="${METAL}"/>` +
    keys +
    `<path d="M330 327L352 236L363 238L341 329Z" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="1.5"/>` +
    `<path d="M332 323L353 241L358 242L337 325Z" fill="${light}"/>` +
    `<path d="M332 323L353 241L340 246L322 323Z" fill="${light}" fill-opacity=".16"/>` +
    // The big jar: a curled sprout floating in teal fluid, a scan line while Claude reads.
    `<rect x="362" y="264" width="38" height="10" rx="3" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="1.5"/>` +
    `<rect x="364" y="273" width="34" height="57" rx="7" fill="${TEAL}" fill-opacity=".12" stroke="#a8fff0" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M366 286H396" stroke="${TEAL}" stroke-opacity=".4" stroke-width="1.5"/>` +
    `<path class="aj-jar" d="M381 326C381 310 375 300 383 292C390 287 394 297 387 299C383 300 382 296 385 295" fill="none" stroke="${TEAL}" stroke-width="3" stroke-linecap="round"/>` +
    `<path class="aj-scan" d="M366 278H396" stroke="${light}" stroke-width="2"/>` +
    (busy ? bubbles : '') +
    // The small jar: a pink jelly.
    `<rect x="402" y="290" width="24" height="8" rx="2" fill="${METAL}"/>` +
    `<rect x="403" y="297" width="22" height="33" rx="5" fill="${PINK}" fill-opacity=".1" stroke="#ffc2ee" stroke-opacity=".5" stroke-width="2"/>` +
    `<g class="aj-jar" style="animation-delay:-1.3s"><path d="M407 312Q414 300 421 312Z" fill="${PINK}" fill-opacity=".85"/>` +
    `<path d="M409 312V322M414 312V325M419 312V321" stroke="${PINK}" stroke-opacity=".7" stroke-width="1.5"/></g>` +
    // A petri dish with a few glowing colonies.
    `<ellipse cx="206" cy="328" rx="20" ry="4" fill="${VIOLET}" fill-opacity=".3" stroke="#d6c4ff" stroke-opacity=".6" stroke-width="1.5"/>` +
    `<g fill="${TEAL}"><circle cx="200" cy="327" r="1.8"/><circle cx="210" cy="328" r="1.4"/><circle cx="214" cy="326" r="1.2"/></g>`
  )
}

/** A point on a cubic, for lights along a curve. */
function cubicAt(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const k = 1 - t

  return [
    k * k * k * p0[0] + 3 * k * k * t * p1[0] + 3 * k * t * t * p2[0] + t * t * t * p3[0],
    k * k * k * p0[1] + 3 * k * k * t * p1[1] + 3 * k * t * t * p2[1] + t * t * t * p3[1],
  ]
}

export function alienJungleWorld(): World {
  const next = random(5150)
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)] ?? (items[0] as T)

  // The sky: stars in two twinkling sets, kept off the moons.
  const starA: [number, number][] = []
  const starB: [number, number][] = []

  for (let i = 0; i < 50; i += 1) {
    const p: [number, number] = [next() * 1600, 6 + next() * 520]

    if (Math.hypot(p[0] - 190, p[1] - 150) < 90) continue
    ;(i % 2 === 0 ? starA : starB).push(p)
  }

  const far = skyline(next, 706, -40, 1640, 22, 0.95)
  const mid = skyline(next, 776, 380, 1300, 10, 1.4)
  const hero = fiddlehead([205, 468], 1, 166, 2.5, [330, 1010], 58, 92, 42)
  const sprout = fiddlehead([58, 706], -1, 56, 2.2, [16, 1000], 20, 30, 28)

  // The umbrella tree at the far right: its tendrils, each with beads that run with light.
  const tendrils = Array.from({ length: 12 }, (_, i) => {
    const x = 1270 + i * 29 + next() * 10
    const top = 212 + ((x - 1250) / 390) * 20
    const len = 170 + next() * 260
    const a = (next() - 0.5) * 26
    const p0: P = [x, top]
    const p1: P = [x + a, top + len * 0.3]
    const p2: P = [x - a, top + len * 0.6]
    const p3: P = [x + a * 0.4, top + len]
    const beads = [0.38, 0.7]
      .map((t, k) => {
        const [bx, by] = cubicAt(p0, p1, p2, p3, t)

        return `<circle class="aj-bd" style="--d:${f(-k * 0.45 - i * 0.11)}s" cx="${f(bx)}" cy="${f(by)}" r="2.6" fill="${i % 3 ? TEAL : VIOLET}"/>`
      })
      .join('')

    return (
      `<g class="aj-tn" style="animation-delay:${f(-next() * 5)}s;animation-duration:${f(4.5 + next() * 2.5)}s">` +
      `<path d="M${f(x)} ${f(top)}C${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} ${f(p3[0])} ${f(p3[1])}" fill="none" stroke="#2c1c58" stroke-width="2.8"/>` +
      `${beads}<circle class="aj-ph" cx="${f(p3[0])}" cy="${f(p3[1])}" r="4" fill="${i % 3 ? TEAL : PINK}"/></g>`
    )
  }).join('')
  const canopyLights = Array.from({ length: 9 }, (_, i) => [1290 + i * 40 + next() * 14, 120 - i * 7 + next() * 16, 2.2] as const)

  // Leaves: tall ones up the left edge and round the fungus's foot, low ones along the bottom, and a fringe of
  // canopy leaves hanging from the top, longer at the sides than over the chat column.
  const undergrowth = leaves([
    [-10, 1000, 400, -94, 42],
    [10, 1004, 300, -68, 36],
    [-30, 780, 230, -38, 30],
    [-30, 620, 170, -22, 24],
    [150, 1004, 210, -126, 28],
    [196, 1004, 190, -58, 26],
    [262, 1004, 170, -112, 24],
    [368, 1004, 140, -68, 20],
  ])
  const low = leaves(
    Array.from({ length: 14 }, (_, i) => [420 + i * 56 + next() * 20, 1006, 50 + next() * 50, -60 - next() * 60, 12] as const),
  )
  const fringeAt = [-30, 20, 70, 440, 520, 610, 690, 780, 870, 950, 1040, 1120, 1200, 1262, 1326, 1392, 1456, 1520, 1588]
  const fringeList = fringeAt.map(x => {
    const side = x < 420 || x > 1180
    const len = side ? 110 + next() * 80 : 36 + next() * 50

    return [x, -12, len, x < 420 ? 64 + next() * 20 : 76 + next() * 28, len * 0.2] as const
  })
  const fringe = leaves(fringeList)
  const fringeTips = fringeList
    .filter(([x]) => x < 420 || x > 1180)
    .map(([x, y, len, deg]) => [x + Math.cos((deg * Math.PI) / 180) * len, y + Math.sin((deg * Math.PI) / 180) * len, 3] as const)

  // Glowing mushrooms and lantern pods round the fungus's foot.
  const shrooms = (
    [
      [92, 952, 22, 18, TEAL],
      [124, 962, 14, 10, PINK],
      [178, 946, 34, 24, TEAL],
      [236, 968, 18, 12, VIOLET],
      [396, 958, 20, 12, TEAL],
    ] as const
  )
    .map(
      ([x, y, h, r, c]) =>
        `<circle cx="${x}" cy="${y - h}" r="${f(r * 2.6)}" fill="url(#aj-gt)" opacity=".6"/>` +
        `<path d="M${x - 3} ${y}L${x - 2} ${y - h}H${x + 2}L${x + 3} ${y}Z" fill="#cfc4f5" fill-opacity=".3"/>` +
        `<path class="aj-ph" style="animation-delay:${f(-next() * 3)}s" d="M${x - r} ${y - h}C${x - r} ${y - h - r} ${x + r} ${y - h - r} ${x + r} ${y - h}Q${x} ${f(y - h + r * 0.25)} ${x - r} ${y - h}Z" fill="${c}" fill-opacity=".5" stroke="${c}" stroke-width="1.5"/>`,
    )
    .join('')
  const pods = (
    [
      [40, 1000, 170, TEAL, 'aj-gt'],
      [138, 1004, 120, PINK, 'aj-gp'],
      [262, 1004, 150, TEAL, 'aj-gt'],
    ] as const
  )
    .map(
      ([x, y, h, c, g]) =>
        `<path d="M${x} ${y}q-12 ${f(-h * 0.5)} 4 ${-h}" fill="none" stroke="#2a2050" stroke-width="3"/>` +
        `<circle cx="${x + 4}" cy="${y - h - 10}" r="40" fill="url(#${g})"/>` +
        `<ellipse class="aj-ph" style="animation-delay:${f(-next() * 3)}s" cx="${x + 4}" cy="${y - h - 10}" rx="9" ry="13" fill="${c}" fill-opacity=".55" stroke="${c}" stroke-width="1.6"/>`,
    )
    .join('')
  const mycelium = [812, 846, 884, 926, 962]
    .map((y, i) => {
      const a = 14 + next() * 26

      return `M-20 ${y}C300 ${f(y + a)} 560 ${f(y - a)} ${f(860 + i * 20)} ${y}S1400 ${f(y + a)} 1620 ${f(y - a * 0.6)}`
    })
    .join('')

  // Ambient spores drifting up, dimmer over the chat column; the burst that rises on done, sweeping left to right.
  const spores = Array.from({ length: 20 }, () => {
    const x = next() * 1600
    const y = 300 + next() * 650
    const col = x > 400 && x < 1200

    return `<circle class="aj-sp${col ? ' aj-sc' : ''}" cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + next() * 2.2)}" fill="${pick([TEAL, VIOLET, CYAN])}" style="--dx:${f((next() - 0.5) * 80)}px;--t:${f(9 + next() * 8)}s;--d:${f(-next() * 16)}s"/>`
  }).join('')
  const burst = [
    ...Array.from({ length: 18 }, (_, i) => [-20 + (i / 17) * 440, 780 + next() * 200, -300 - next() * 340] as const),
    ...Array.from({ length: 8 }, (_, i) => [470 + (i / 7) * 690, 900 + next() * 90, -200 - next() * 200] as const),
    ...Array.from({ length: 10 }, (_, i) => [1220 + (i / 9) * 380, 240 + next() * 160, -180 - next() * 160] as const),
  ]
    .map(([x, y, dy]) => {
      const col = x > 400 && x < 1200

      return (
        `<circle class="aj-ds${col ? ' aj-dc' : ''}" cx="${f(x)}" cy="${f(y)}" r="${f(2.6 + next() * 3.2)}" fill="${pick([TEAL, VIOLET, PINK, CYAN, AMBER])}" ` +
        `style="--dx:${f((next() - 0.5) * 120)}px;--dy:${f(dy)}px;--d:${f((Math.max(0, x) / 1600) * 1.1)}s"/>`
      )
    })
    .join('')

  // Blooms: on the fungus's outer curl, in the undergrowth, small ones across the far ground, under the umbrella tree.
  const curlDots = hero.dots.filter(([, y]) => y < 560).slice(-10).filter((_, i) => i % 2 === 0)
  const blooms =
    curlDots.map(([x, y], i) => bloom(x, y, 15 + i * 2, i % 2 ? PINK : TEAL, i % 2 ? 'aj-gp' : 'aj-gt', 0.1 + i * 0.08)).join('') +
    bloom(64, 880, 26, TEAL, 'aj-gt', 0.05) +
    bloom(214, 900, 20, PINK, 'aj-gp', 0.2) +
    bloom(306, 820, 16, VIOLET, 'aj-gp', 0.3) +
    bloom(530, 806, 9, TEAL, 'aj-gt', 0.45) +
    bloom(720, 800, 8, PINK, 'aj-gp', 0.58) +
    bloom(900, 808, 9, VIOLET, 'aj-gp', 0.7) +
    bloom(1070, 802, 8, TEAL, 'aj-gt', 0.82)
  const treeBlooms =
    bloom(1300, 224, 18, PINK, 'aj-gp', 0.95) + bloom(1420, 230, 22, TEAL, 'aj-gt', 1.05) + bloom(1540, 236, 18, VIOLET, 'aj-gp', 1.15)

  // The dome's rib, and the lights along it.
  const rib: [P, P, P, P] = [[-39, 456], [-39, 118], [135, -217], [440, -217]]
  const rivets = dotPath([0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92].map(t => [...cubicAt(...rib, t), 2.8] as const))
  const [netX, netY] = cubicAt(...rib, 0.78)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'spores',
      ink: '#05030b',
      furniture: '#1a1430',
      metal: METAL,
      paper: PAPER,
      light: { idle: '#2a9e8e', work: TEAL, bright: '#c6fff1' },
      headTop: 208,
      glowAt: [342, 284],
      device,
      wear: {
        behind:
          // The air tank on Claude's back, its gauge glowing, and the hose up to the helmet.
          `<rect x="44" y="246" width="24" height="80" rx="10" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="2"/>` +
          `<rect x="50" y="240" width="12" height="9" rx="2" fill="${METAL_EDGE}"/>` +
          `<circle class="aj-ant" cx="56" cy="262" r="3.5" fill="${TEAL}"/>` +
          `<path d="M56 242C32 236 26 276 46 304" fill="none" stroke="${METAL_EDGE}" stroke-width="5" stroke-linecap="round"/>`,
        front:
          // The breathing helmet: a glass dome the eyes show through, a breath that fogs its foot, a collar, and a
          // feeler antenna with a glowing tip.
          `<path d="M58 322C58 236 98 186 150 186C202 186 242 236 242 322Z" fill="${CYAN}" fill-opacity=".09" stroke="#b4f4ff" stroke-opacity=".6" stroke-width="4"/>` +
          '<ellipse class="aj-fog" cx="150" cy="313" rx="60" ry="7" fill="#eafffb"/>' +
          '<path d="M80 268C82 234 102 208 132 198" fill="none" stroke="#ffffff" stroke-opacity=".32" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M196 204C214 212 226 226 232 244" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="52" y="318" width="196" height="12" rx="5" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="2"/>` +
          `<g fill="${TEAL}"><rect x="96" y="322" width="8" height="4" rx="1"/><rect x="146" y="322" width="8" height="4" rx="1"/><rect x="196" y="322" width="8" height="4" rx="1"/></g>` +
          `<path d="M98 198L78 160" stroke="${METAL_EDGE}" stroke-width="3" stroke-linecap="round"/>` +
          `<circle class="aj-ant" cx="77" cy="157" r="5" fill="${TEAL}"/>`,
      },
      seatArt:
        // A fungus stool: a violet cap with glowing spots, gills under it, a pale stalk.
        '<path d="M132 362C130 398 124 430 116 456H186C178 430 172 398 170 362Z" fill="#2a2048" stroke="#4a3c78" stroke-width="2"/>' +
        '<path d="M140 382C142 410 138 436 132 454" fill="none" stroke="#6a5a9a" stroke-opacity=".5" stroke-width="2"/>' +
        '<path d="M94 366C94 346 122 343 151 343C180 343 208 346 208 366C186 361 116 361 94 366Z" fill="#3a2a66" stroke="#6a52a8" stroke-width="2"/>' +
        '<path d="M106 364L118 372M128 363L134 372M151 362V372M174 363L168 372M196 364L184 372" stroke="#7b5fd0" stroke-opacity=".55" stroke-width="1.6"/>' +
        `<g fill="${TEAL}" fill-opacity=".85"><circle cx="104" cy="357" r="2.6"/><circle cx="198" cy="357" r="2.6"/></g>` +
        `<ellipse cx="151" cy="456" rx="46" ry="5" fill="${TEAL}" fill-opacity=".16"/>`,
      tableArt:
        // A folding field bench with a lit edge, and the sample case under it.
        `<rect x="166" y="330" width="304" height="11" rx="3" fill="#1a1430" stroke="#3a2f5c" stroke-width="1.6"/>` +
        `<path d="M172 335H464" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2"/>` +
        '<g stroke="#2c2450" stroke-width="7" stroke-linecap="round"><path d="M200 344L258 452M258 344L200 452M386 344L444 452M444 344L386 452"/></g>' +
        '<g fill="#3a2f5c"><circle cx="229" cy="398" r="4"/><circle cx="415" cy="398" r="4"/></g>' +
        '<rect x="272" y="414" width="76" height="42" rx="5" fill="#130f24" stroke="#3a2f5c" stroke-width="2"/>' +
        '<rect x="294" y="406" width="32" height="10" rx="4" fill="none" stroke="#3a2f5c" stroke-width="3"/>' +
        `<rect x="302" y="428" width="16" height="7" rx="2" fill="${TEAL}" fill-opacity=".55"/>`,
    },
    style:
      // Ambient: stars twinkle, everything that glows breathes, the fungus leans, tendrils sway, spores drift up.
      '.aj-tw{animation:aj-tw 4.6s ease-in-out infinite alternate}.aj-tw2{animation-duration:3.4s;animation-delay:-1.7s}' +
      '@keyframes aj-tw{from{opacity:.3}to{opacity:.95}}' +
      '.aj-ph{animation:aj-ph 3.8s ease-in-out infinite alternate}@keyframes aj-ph{from{opacity:.4}to{opacity:1}}' +
      '.aj-spine{stroke-dasharray:18 14;animation:aj-flow 7s linear infinite}@keyframes aj-flow{to{stroke-dashoffset:-128}}' +
      '.aj-curl{transform-box:fill-box;transform-origin:50% 100%;animation:aj-curl 9s ease-in-out infinite alternate}' +
      '@keyframes aj-curl{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}' +
      '.aj-tn{transform-box:fill-box;transform-origin:50% 0;animation:aj-tn 5.5s ease-in-out infinite alternate}' +
      '@keyframes aj-tn{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}' +
      '.aj-bd{opacity:.3}' +
      '.aj-sp{--o:.75;animation:aj-sp var(--t) linear infinite;animation-delay:var(--d)}.aj-sc{--o:.3}' +
      '@keyframes aj-sp{0%{opacity:0;transform:translate(0,0)}20%,75%{opacity:var(--o)}100%{opacity:0;transform:translate(var(--dx),-240px)}}' +
      '.aj-my{stroke-dasharray:4 22;opacity:.32}' +
      '.aj-moon{animation:aj-tw 9s ease-in-out infinite alternate}' +
      // The rig: the helmet fogs with each breath, the antenna and tank gauge glow, the jars pulse.
      '.aj-fog{animation:aj-fog 4.5s ease-in-out infinite}@keyframes aj-fog{0%,100%{opacity:.05}50%{opacity:.2}}' +
      '.aj-ant{animation:aj-ph 1.8s ease-in-out infinite alternate}' +
      '.aj-jar{animation:aj-ph 2.6s ease-in-out infinite alternate}' +
      '.aj-bub{opacity:0;animation:aj-bub 1.3s ease-in infinite;animation-delay:var(--d)}' +
      '@keyframes aj-bub{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(-40px)}}' +
      '.aj-scan{opacity:0}.st-read .aj-scan,.st-web .aj-scan{opacity:1;animation:aj-scan 1.2s ease-in-out infinite alternate}@keyframes aj-scan{to{transform:translateY(46px)}}' +
      // The specimen sways in its pot, jaws ajar.
      '.aj-pl{animation:aj-sway 6s ease-in-out infinite alternate}@keyframes aj-sway{from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}}' +
      '.aj-hd{animation:aj-hd 5s ease-in-out infinite alternate}@keyframes aj-hd{from{transform:rotate(-5deg)}to{transform:rotate(4deg)}}' +
      '.aj-ju{animation:aj-ju 4s ease-in-out infinite alternate}@keyframes aj-ju{from{transform:rotate(5deg)}to{transform:rotate(12deg)}}' +
      '.aj-jl{animation:aj-jl 4s ease-in-out infinite alternate}@keyframes aj-jl{from{transform:rotate(-5deg)}to{transform:rotate(-12deg)}}' +
      '.aj-th{opacity:.45}' +
      // Thinking and responding: light flows along the fungus; responding runs the tendril beads.
      '.st-thinking .aj-spine,.st-responding .aj-spine{animation-duration:2.2s}' +
      '.st-responding .aj-bd,.st-done .aj-bd{animation:aj-bd 1.4s ease-in-out infinite;animation-delay:var(--d)}@keyframes aj-bd{0%,100%{opacity:.25}50%{opacity:1}}' +
      // Tool: spores whirl faster, the specimen twitches.
      '.st-tool .aj-sp{animation-duration:3.6s}' +
      '.st-tool .aj-pl{animation:aj-twitch 1.3s ease-in-out infinite}@keyframes aj-twitch{0%,100%{transform:rotate(0)}40%{transform:rotate(-4deg)}55%{transform:rotate(1deg)}}' +
      // Web: the mycelium under the jungle carries signals.
      '.st-web .aj-my{opacity:1;animation:aj-my 1.4s linear infinite}@keyframes aj-my{to{stroke-dashoffset:-52}}' +
      // Run: the beast strides through the background, the ground shudders under each step.
      '.aj-bst{display:none}.st-run .aj-bst{display:inline}' +
      '.aj-walk{animation:aj-walk 14s linear both}' +
      '@keyframes aj-walk{0%{opacity:0;transform:translateX(110px)}4%{opacity:1}93%{opacity:1}100%{opacity:0;transform:translateX(1480px)}}' +
      '.aj-bob{animation:aj-bob .8s ease-in-out infinite alternate}@keyframes aj-bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
      '.aj-leg{animation:aj-leg 1.6s ease-in-out infinite alternate}@keyframes aj-leg{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.aj-fil{transform-box:fill-box;transform-origin:50% 0;animation:aj-tn 1.6s ease-in-out infinite alternate}' +
      '.aj-head{animation:aj-head 1.6s ease-in-out infinite alternate}@keyframes aj-head{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      '.st-run .aj-curl{animation:aj-shudder .8s ease-in-out infinite}@keyframes aj-shudder{0%,100%{transform:rotate(0)}12%{transform:rotate(.7deg)}30%{transform:rotate(-.4deg)}}' +
      '.st-run .aj-ph{animation-duration:.8s}' +
      // Error: the jungle's lights turn to warning, the tendrils curl up, the specimen lunges and snaps at the desk.
      `.st-error .aj-ph{fill:${ALARM}}.st-error .aj-spine{stroke:${ALARM}}` +
      '.st-error .aj-tn{animation:aj-curlup 1.2s cubic-bezier(.3,.7,.3,1) both}@keyframes aj-curlup{to{transform:scaleY(.45)}}' +
      '.st-error .aj-pl{animation:aj-lunge 3.2s ease-in-out infinite}' +
      '@keyframes aj-lunge{0%{transform:rotate(0)}14%{transform:rotate(-23deg)}24%{transform:rotate(-21deg)}29%{transform:rotate(-25deg)}40%{transform:rotate(-18deg)}50%{transform:rotate(-20deg)}78%{transform:rotate(-5deg)}100%{transform:rotate(0)}}' +
      '.st-error .aj-hd{animation:aj-hde 3.2s ease-in-out infinite}@keyframes aj-hde{0%{transform:rotate(0)}14%,24%{transform:rotate(-10deg)}29%{transform:rotate(-4deg)}100%{transform:rotate(0)}}' +
      '.st-error .aj-ju{animation:aj-jue 3.2s ease-in-out infinite}@keyframes aj-jue{0%{transform:rotate(8deg)}14%,24%{transform:rotate(42deg)}29%,62%{transform:rotate(0)}82%{transform:rotate(16deg)}100%{transform:rotate(8deg)}}' +
      '.st-error .aj-jl{animation:aj-jle 3.2s ease-in-out infinite}@keyframes aj-jle{0%{transform:rotate(-8deg)}14%,24%{transform:rotate(-30deg)}29%,62%{transform:rotate(0)}82%{transform:rotate(-14deg)}100%{transform:rotate(-8deg)}}' +
      '.st-error .aj-th{opacity:1}' +
      // Done: blooms open in a wave from left to right, spores burst up, a glow rolls across the ground.
      '.aj-bl{transform:scale(.22);opacity:.6}' +
      '.st-done .aj-bl{animation:aj-bl 1.3s cubic-bezier(.2,.9,.3,1.25) both;animation-delay:var(--d)}@keyframes aj-bl{to{transform:scale(1) rotate(30deg);opacity:1}}' +
      '.aj-fl{opacity:0}.st-done .aj-fl{animation:aj-fade 1.4s ease-out both}' +
      '.aj-bh{opacity:0}.st-done .aj-bh{animation:aj-fade 1.4s ease-out both;animation-delay:var(--d)}@keyframes aj-fade{to{opacity:1}}' +
      '.aj-ds{--o:.95;opacity:0}.aj-dc{--o:.42}.st-done .aj-ds{animation:aj-ds 2.8s cubic-bezier(.2,.6,.4,1) infinite;animation-delay:var(--d)}' +
      '@keyframes aj-ds{0%{opacity:0;transform:translate(0,0) scale(.4)}12%,70%{opacity:var(--o)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}' +
      '.aj-wv{opacity:0}.st-done .aj-wv{animation:aj-wv 2.8s ease-in-out both}' +
      '@keyframes aj-wv{0%{opacity:0;transform:translateX(-300px)}15%,80%{opacity:1}100%{opacity:0;transform:translateX(1900px)}}' +
      '.st-done .aj-ph{animation:none;opacity:1}.st-done .aj-spine{animation-duration:1.6s}',
    scenery:
      '<defs>' +
      '<linearGradient id="aj-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04020a"/><stop offset=".45" stop-color="#0a0620"/><stop offset=".72" stop-color="#170b33"/><stop offset="1" stop-color="#120829"/></linearGradient>' +
      '<radialGradient id="aj-neb"><stop offset="0" stop-color="#5a2aa0" stop-opacity=".34"/><stop offset="1" stop-color="#5a2aa0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-neb2"><stop offset="0" stop-color="#1f8f8a" stop-opacity=".2"/><stop offset="1" stop-color="#1f8f8a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-hz"><stop offset="0" stop-color="#7a3cc8" stop-opacity=".3"/><stop offset="1" stop-color="#7a3cc8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-mh"><stop offset="0" stop-color="#9ff5e6" stop-opacity=".24"/><stop offset="1" stop-color="#9ff5e6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-mh2"><stop offset="0" stop-color="#f0a0ff" stop-opacity=".24"/><stop offset="1" stop-color="#f0a0ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-m1" cx=".4" cy=".38"><stop offset="0" stop-color="#e8fffa"/><stop offset=".7" stop-color="#9fe8dc"/><stop offset="1" stop-color="#4fa6a6"/></radialGradient>' +
      '<linearGradient id="aj-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e0822"/><stop offset="1" stop-color="#05030b"/></linearGradient>' +
      '<linearGradient id="aj-fd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2274"/><stop offset=".55" stop-color="#1c1040"/><stop offset="1" stop-color="#0c0720"/></linearGradient>' +
      '<radialGradient id="aj-hg"><stop offset="0" stop-color="#3df5d0" stop-opacity=".16"/><stop offset=".5" stop-color="#7a3cc8" stop-opacity=".12"/><stop offset="1" stop-color="#7a3cc8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-bell" cx=".5" cy=".35"><stop offset="0" stop-color="#6a3cc0"/><stop offset=".7" stop-color="#2e185e"/><stop offset="1" stop-color="#140a2c"/></radialGradient>' +
      '<radialGradient id="aj-gt"><stop offset="0" stop-color="#3df5d0" stop-opacity=".42"/><stop offset="1" stop-color="#3df5d0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-gp"><stop offset="0" stop-color="#ff6ad5" stop-opacity=".4"/><stop offset="1" stop-color="#ff6ad5" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-flg"><stop offset="0" stop-color="#3df5d0" stop-opacity=".26"/><stop offset=".5" stop-color="#9a5cf0" stop-opacity=".12"/><stop offset="1" stop-color="#9a5cf0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="aj-wvg"><stop offset="0" stop-color="#3df5d0" stop-opacity=".3"/><stop offset="1" stop-color="#3df5d0" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#aj-sky)"/>' +
      '<ellipse cx="300" cy="260" rx="640" ry="320" fill="url(#aj-neb)"/><ellipse cx="1380" cy="170" rx="460" ry="240" fill="url(#aj-neb2)"/>' +
      `<path class="aj-tw" d="${specks(starA, 2.6)}" fill="#e6e2f7"/><path class="aj-tw aj-tw2" d="${specks(starB, 2)}" fill="#bfeee6"/>` +
      // Two moons: a teal gibbous with craters, a small rose crescent.
      '<g class="aj-moon"><circle cx="190" cy="150" r="230" fill="url(#aj-mh)"/><circle cx="352" cy="70" r="80" fill="url(#aj-mh2)"/></g>' +
      '<circle cx="190" cy="150" r="64" fill="url(#aj-m1)" fill-opacity=".85"/>' +
      '<g fill="#2a7f86" fill-opacity=".35"><circle cx="168" cy="128" r="12"/><circle cx="206" cy="174" r="8"/><circle cx="198" cy="118" r="5"/><circle cx="156" cy="170" r="6"/></g>' +
      '<path d="M190 86A64 64 0 0 1 190 214A38 64 0 0 0 190 86Z" fill="#05030c" fill-opacity=".55"/>' +
      '<circle cx="352" cy="70" r="22" fill="#f4c2ff" fill-opacity=".8"/><circle cx="361" cy="64" r="19" fill="#07040f" fill-opacity=".88"/>' +
      // The horizon: a violet glow behind far flora.
      '<ellipse cx="800" cy="700" rx="980" ry="230" fill="url(#aj-hz)"/>' +
      `<path d="${far.d}" fill="#170d2f"/><rect y="704" width="1600" height="60" fill="#170d2f"/>` +
      `<path class="aj-ph" d="${specks(far.lights, 3)}" fill="${VIOLET}" fill-opacity=".6"/>` +
      // The beast, only while a command runs.
      `<g class="aj-bst"><g class="aj-walk"><g transform="translate(0 292) scale(.95)"><g class="aj-bob">${beast(next)}</g></g></g></g>` +
      // Nearer flora and the ground, with its mycelium.
      `<path d="${mid.d}" fill="#0b0619"/><rect y="772" width="1600" height="240" fill="url(#aj-gnd)"/>` +
      `<path class="aj-ph" d="${specks(mid.lights, 3)}" fill="${TEAL}" fill-opacity=".5"/>` +
      `<path class="aj-my" d="${mycelium}" fill="none" stroke="${TEAL}" stroke-opacity=".55" stroke-width="1.6"/>` +
      '<ellipse class="aj-wv" cx="0" cy="900" rx="360" ry="110" fill="url(#aj-wvg)"/>' +
      // The canopy fringe hanging from the top.
      `<g class="mv-t"><path d="${fringe[0]}" fill="#0a0617" stroke="${RIM}" stroke-opacity=".3" stroke-width="1.5"/>` +
      `<path class="aj-ph" d="${dotPath(fringeTips)}" fill="${VIOLET}" fill-opacity=".7"/></g>` +
      // The umbrella tree at the far right.
      '<g class="mv-r">' +
      `<path d="M1498 1000C1488 800 1528 560 1498 420C1484 340 1494 250 1518 196H1556C1534 250 1530 340 1546 420C1574 560 1540 800 1562 1000Z" fill="#0b0719" stroke="${RIM}" stroke-opacity=".35" stroke-width="2"/>` +
      tendrils +
      `<path d="M1250 214C1270 120 1400 52 1640 52V236C1560 214 1420 204 1250 214Z" fill="#110a26" stroke="${RIM}" stroke-opacity=".55" stroke-width="2"/>` +
      `<path d="M1280 206Q1310 180 1350 202M1360 200Q1400 172 1440 202M1450 204Q1500 176 1550 210" fill="none" stroke="${TEAL}" stroke-opacity=".22" stroke-width="2"/>` +
      `<path class="aj-ph" d="${dotPath(canopyLights)}" fill="${TEAL}" fill-opacity=".8"/>` +
      treeBlooms +
      '<ellipse class="aj-fl" style="animation-delay:.8s" cx="1440" cy="230" rx="280" ry="200" fill="url(#aj-flg)"/>' +
      '</g>' +
      // The giant spiral fungus on the left, its photophores and the light that flows along it.
      '<ellipse cx="205" cy="500" rx="320" ry="300" fill="url(#aj-hg)"/><ellipse class="aj-fl" cx="205" cy="500" rx="340" ry="330" fill="url(#aj-flg)"/>' +
      '<g class="aj-curl">' +
      `<path d="${hero.body}" fill="url(#aj-fd)" stroke="#5ff0d0" stroke-opacity=".42" stroke-width="3"/>` +
      `<path class="aj-spine" d="${hero.spine}" fill="none" stroke="${TEAL}" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/>` +
      `<path class="aj-ph" d="${dotPath(hero.dots.filter((_, i) => i % 5 !== 4))}" fill="${TEAL}"/>` +
      `<path class="aj-ph" style="animation-delay:-1.9s" d="${dotPath(hero.dots.filter((_, i) => i % 5 === 4))}" fill="${PINK}"/>` +
      '</g>' +
      `<path d="${sprout.body}" fill="url(#aj-fd)" stroke="#5ff0d0" stroke-opacity=".35" stroke-width="2"/>` +
      `<path class="aj-spine" d="${sprout.spine}" fill="none" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2"/>` +
      pods +
      shrooms +
      `<g class="mv-b"><path d="${undergrowth[0]}${low[0]}" fill="#0c0720" stroke="${RIM}" stroke-opacity=".35" stroke-width="1.5"/>` +
      `<path d="${undergrowth[1]}" fill="none" stroke="${TEAL}" stroke-opacity=".34" stroke-width="1.6"/></g>` +
      blooms +
      spores +
      burst,
    nook:
      // The field dome: a dark tinted interior, pane seams, the rib with its lights, the floor.
      '<path d="M-16 456C-16 132 146 -196 440 -196V456Z" fill="#05030c" fill-opacity=".55"/>' +
      '<path d="M80 456C80 200 200 -90 440 -120M190 456C196 240 290 0 440 -40M-8 250C80 250 240 200 440 120M34 70C140 60 300 20 440 -30" fill="none" stroke="#6f58b8" stroke-opacity=".16" stroke-width="2"/>' +
      '<path d="M-62 456C-62 104 124 -238 440 -238V-196C146 -196 -16 132 -16 456Z" fill="#120d26" stroke="#3a2f66" stroke-width="2"/>' +
      `<path class="aj-ph" d="${rivets}" fill="${TEAL}"/>` +
      '<rect x="-60" y="452" width="500" height="10" fill="#120d26"/>' +
      // A net of glowing seed pods hanging from the rib.
      `<path d="M${f(netX)} ${f(netY)}V-64" stroke="#3a2f66" stroke-width="2.4"/>` +
      `<g transform="translate(${f(netX)} -40)"><path d="M-22 -26Q-26 8 0 22Q26 8 22 -26Z" fill="none" stroke="#5a4a8a" stroke-width="1.6"/>` +
      '<path d="M-22 -26L14 18M22 -26L-14 18M-24 -6H24" stroke="#5a4a8a" stroke-opacity=".6" stroke-width="1.2"/>' +
      `<circle class="aj-ph" cx="-8" cy="-6" r="6" fill="${TEAL}" fill-opacity=".7"/><circle class="aj-ph" style="animation-delay:-1.4s" cx="8" cy="2" r="5" fill="${VIOLET}" fill-opacity=".7"/><circle class="aj-ph" style="animation-delay:-2.2s" cx="0" cy="-14" r="4" fill="${PINK}" fill-opacity=".7"/></g>` +
      // A specimen sheet pinned to the glass: a sketched curl and notes in invented marks.
      `<rect x="16" y="150" width="54" height="68" fill="${PAPER}" fill-opacity=".42" transform="rotate(-4 43 184)"/>` +
      '<g fill="none" stroke="#2a2046" stroke-width="1.6" transform="rotate(-4 43 184)"><path d="M34 180c-8 -10 6 -18 12 -8c4 8 -6 12 -8 4"/><path d="M24 200h14M42 200h6M24 208h22"/></g>' +
      '<circle cx="43" cy="152" r="3" fill="#ff6ad5"/>' +
      // The specimen: a carnivorous plant in its pot. Its jaws snap toward the desk on an error.
      '<path d="M346 400H426L416 456H356Z" fill="#191230" stroke="#3a2f5c" stroke-width="2"/><rect x="342" y="392" width="88" height="11" rx="3" fill="#221a3e"/>' +
      `<rect x="372" y="418" width="26" height="13" rx="2" fill="${PAPER}" fill-opacity=".55"/><path d="M377 424h8M388 424h5" stroke="#2a2046" stroke-width="1.6"/>` +
      '<g transform="translate(386 396)"><g class="aj-pl"><g transform="translate(-386 -396)">' +
      `<path d="M384 392C362 376 330 384 312 360C338 350 368 362 384 382Z" fill="#123430" stroke="${TEAL}" stroke-opacity=".35" stroke-width="1.5"/>` +
      `<path d="M390 392C410 370 432 372 446 350C420 346 398 362 390 384Z" fill="#123430" stroke="${TEAL}" stroke-opacity=".35" stroke-width="1.5"/>` +
      '<path d="M386 396C378 330 420 252 400 172C390 128 368 96 354 72" fill="none" stroke="#163f3a" stroke-width="15" stroke-linecap="round"/>' +
      `<path d="M386 396C378 330 420 252 400 172C390 128 368 96 354 72" fill="none" stroke="${TEAL}" stroke-opacity=".35" stroke-width="2"/>` +
      bloom(406, 250, 13, PINK, 'aj-gp', 1.4) +
      '<g transform="translate(352 70) scale(1.35)"><g class="aj-hd">' +
      `<ellipse class="aj-th" cx="-44" cy="0" rx="40" ry="9" fill="${PINK}" fill-opacity=".55"/>` +
      '<g class="aj-ju"><path d="M0 0C-8 -32 -58 -40 -92 -8C-62 -14 -26 -10 0 0Z" fill="#1a4a44" stroke="#5ff0d0" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M-84 -9V3M-70 -12V1M-56 -13V0M-42 -12V0M-28 -9V2M-14 -5V4" stroke="#d8fff6" stroke-opacity=".85" stroke-width="2" stroke-linecap="round"/>' +
      `<g fill="${TEAL}"><circle cx="-30" cy="-24" r="2.6"/><circle cx="-54" cy="-26" r="2.2"/></g></g>` +
      '<g class="aj-jl"><path d="M0 0C-8 32 -58 40 -92 8C-62 14 -26 10 0 0Z" fill="#163f3a" stroke="#5ff0d0" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M-84 9V-3M-70 12V-1M-56 13V0M-42 12V0M-28 9V-2M-14 5V-4" stroke="#d8fff6" stroke-opacity=".85" stroke-width="2" stroke-linecap="round"/></g>' +
      '<circle cx="2" cy="0" r="8" fill="#163f3a" stroke="#5ff0d0" stroke-opacity=".5" stroke-width="2"/>' +
      '</g></g></g></g></g>' +
      bloom(-6, 432, 16, TEAL, 'aj-gt', 1.3),
    front:
      // Glowing moss on the hut floor.
      `<g fill="${TEAL}" fill-opacity=".55"><circle cx="-30" cy="452" r="3"/><circle cx="-18" cy="449" r="2.2"/><circle cx="-6" cy="453" r="2.6"/><circle cx="404" cy="452" r="2.4"/></g>` +
      `<path d="M-40 456q6 -14 10 0M-26 456q4 -10 8 0M-12 456q5 -12 9 0" fill="none" stroke="${TEAL}" stroke-opacity=".35" stroke-width="2"/>`,
  }
}
