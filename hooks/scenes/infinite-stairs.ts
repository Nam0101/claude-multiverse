import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Infinite Stairs: Claude in a bowler hat on a landing of an impossible staircase, at night in violet space. A Penrose
// loop of stairs floats on the left with its towers, tiny lantern-carriers climbing it forever; an upside-down loop
// hangs far off in the sky and a stair winds up a tower at the far right into the haze. When a command runs a light
// races round the loop, the climbers run and everything turns; an error crumbles steps out from under a climber; done
// lights the loop step by step.
const VIOLET = '#6c5ce7'
const LILAC = '#ab9eff'
const PALE = '#e6e0ff'
const NIGHT = '#06040b'
const TREAD = '#3a3262'
const EDGE = '#7f72d6'
const STONE = '#1f1a33'
const C30 = Math.cos(Math.PI / 6)

type Pt = readonly [number, number]
type Proj = (i: number, j: number, k: number) => Pt
type Box = { i0: number; i1: number; j0: number; j1: number; kb: number; kt: number }
type Step = { side: number; box: Box; at: Pt }

/** An isometric view: i runs down-left, j down-right, k up. */
const projector =
  (ox: number, oy: number, s: number): Proj =>
  (i, j, k) => [ox + (j - i) * C30 * s, oy + ((i + j) / 2 - k) * s]
const poly = (pts: readonly Pt[]): string => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`

/** The three faces of a block the viewer sees: its top and the two that face down-left and down-right. */
function faces(p: Proj, b: Box): { top: string; left: string; right: string } {
  return {
    top: poly([p(b.i0, b.j0, b.kt), p(b.i1, b.j0, b.kt), p(b.i1, b.j1, b.kt), p(b.i0, b.j1, b.kt)]),
    left: poly([p(b.i1, b.j0, b.kt), p(b.i1, b.j1, b.kt), p(b.i1, b.j1, b.kb), p(b.i1, b.j0, b.kb)]),
    right: poly([p(b.i0, b.j1, b.kt), p(b.i1, b.j1, b.kt), p(b.i1, b.j1, b.kb), p(b.i0, b.j1, b.kb)]),
  }
}

const depthOf = (b: Box): number => (b.i0 + b.i1) / 2 + (b.j0 + b.j1) / 2 + b.kt

/**
 * A square loop of stairs that climbs on every step and still comes back to where it began. A rise looks the same, in
 * this view, as a move toward the viewer along both i and j, so the two flights that come toward the viewer are
 * longer than the two that go away by exactly the height the loop climbs.
 */
function penrose(p: Proj, perSide: number, far: number, rise: number, width: number, depth: number): Step[] {
  const near = far + 4 * rise
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ] as const
  const steps: Step[] = []
  const half = width / 2
  let ci = 0
  let cj = 0

  for (let side = 0; side < 4; side += 1) {
    const [di, dj] = dirs[side]!
    const run = side < 2 ? near : far

    for (let m = 0; m < perSide; m += 1) {
      const kt = steps.length * rise
      const a = m * run
      const b = (m + 1) * run + (m === perSide - 1 ? half : 0)
      const mid = (a + (m + 1) * run) / 2
      const box: Box =
        di !== 0
          ? { i0: Math.min(ci + di * a, ci + di * b), i1: Math.max(ci + di * a, ci + di * b), j0: cj - half, j1: cj + half, kb: kt - depth, kt }
          : { i0: ci - half, i1: ci + half, j0: Math.min(cj + dj * a, cj + dj * b), j1: Math.max(cj + dj * a, cj + dj * b), kb: kt - depth, kt }

      steps.push({ side, box, at: p(ci + di * mid, cj + dj * mid, kt) })
    }

    ci += di * perSide * run
    cj += dj * perSide * run
  }

  return steps
}

const backToFront = (steps: readonly Step[]) => steps.map((st, index) => ({ st, index })).sort((a, b) => depthOf(a.st.box) - depthOf(b.st.box))

/** A tower behind the loop: a square shaft, a pointed roof and slits that light up. */
function tower(p: Proj, i0: number, j0: number, size: number, kt: number, roof: number, slits: number, w0: number): string {
  const b: Box = { i0, i1: i0 + size, j0, j1: j0 + size, kb: kt - 12, kt }
  const fc = faces(p, b)
  const ci = i0 + size / 2
  const cj = j0 + size / 2
  const apex = p(ci, cj, kt + roof)
  let windows = ''

  for (let w = 0; w < slits; w += 1) {
    const k0 = kt - 1.2 - w * 1.4
    const left = poly([p(b.i1, cj - 0.14, k0), p(b.i1, cj + 0.14, k0), p(b.i1, cj + 0.14, k0 - 0.7), p(b.i1, cj - 0.14, k0 - 0.7)])
    const right = poly([p(ci - 0.14, b.j1, k0), p(ci + 0.14, b.j1, k0), p(ci + 0.14, b.j1, k0 - 0.7), p(ci - 0.14, b.j1, k0 - 0.7)])

    windows += `<path d="${left}${right}" fill="#0b0816"/><path class="ix-win" style="--w:${w0 + w}" d="${left}${right}" fill="${LILAC}"/>`
  }

  return (
    `<path d="${fc.left}" fill="url(#ix-twl)"/><path d="${fc.right}" fill="url(#ix-twr)"/>` +
    `<path d="${poly([apex, p(b.i1, b.j0, kt), p(b.i1, b.j1, kt)])}" fill="#2f2850"/>` +
    `<path d="${poly([apex, p(b.i1, b.j1, kt), p(b.i0, b.j1, kt)])}" fill="#1b1631"/>` +
    `<path d="${poly([apex, p(b.i1, b.j0, kt), p(b.i1, b.j1, kt), p(b.i0, b.j1, kt)])}M${f(p(b.i1, b.j1, kt)[0])} ${f(p(b.i1, b.j1, kt)[1])}V${f(p(b.i1, b.j1, kt - 5)[1])}" ` +
    `fill="none" stroke="${EDGE}" stroke-opacity=".55" stroke-width="1.4" stroke-linejoin="round"/>` +
    windows
  )
}

/** An arch standing across a flight, in the plane where i is constant: its back face, then its front. */
function arch(p: Proj, i0: number, i1: number, jc: number, spring: number, ro: number, ri: number, foot: number): string {
  const face = (i: number): string => {
    const pts: Pt[] = [p(i, jc - ro, foot)]

    for (let a = 0; a <= 12; a += 1) {
      const t = Math.PI - (a * Math.PI) / 12
      pts.push(p(i, jc + ro * Math.cos(t), spring + ro * Math.sin(t)))
    }

    pts.push(p(i, jc + ro, foot), p(i, jc + ri, foot))

    for (let a = 0; a <= 12; a += 1) {
      const t = (a * Math.PI) / 12
      pts.push(p(i, jc + ri * Math.cos(t), spring + ri * Math.sin(t)))
    }

    pts.push(p(i, jc - ri, foot))

    return poly(pts)
  }

  return (
    `<path d="${face(i0)}" fill="#151027"/>` +
    `<path d="${face(i1)}" fill="#332b55" stroke="${EDGE}" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/>`
  )
}

/** A short straight flight going up and away, its risers toward the viewer: a stray piece of stair in the sky. */
function flight(count: number, s: number, tone: number): string {
  const p = projector(0, 0, s)
  const blocks: string[] = []

  for (let m = count - 1; m >= 0; m -= 1) {
    const fc = faces(p, { i0: -(m + 1), i1: -m, j0: 0, j1: 1.7, kb: -0.7, kt: (m + 1) * 0.5 })

    blocks.push(
      `<path d="${fc.left}" fill="${tone ? '#1a152d' : '#151126'}"/><path d="${fc.right}" fill="#0f0c1c"/>` +
        `<path d="${fc.top}" fill="${tone ? '#29223f' : '#221c37'}" stroke="#41376e" stroke-width="1"/>`,
    )
  }

  return blocks.join('')
}

/** A tiny hooded climber with a lantern held out ahead, feet at its origin. */
function climber(): string {
  return (
    '<g transform="scale(1.6)"><path class="ix-hd" d="M-5.5 0L-4 -11.5Q0 -16.5 4 -11.5L5.5 0ZM4.5 -16.5A3.5 3.5 0 1 1 -2.5 -16.5A3.5 3.5 0 1 1 4.5 -16.5Z"/>' +
    '<path class="ix-arm" d="M3 -9L8 -6.5"/><circle class="ix-lg" cx="8.6" cy="-4.6" r="5.5"/><circle class="ix-lp" cx="8.6" cy="-4.6" r="1.8"/></g>'
  )
}

// The loop, in the picture, and the point its climbers circle. Placed so its left landing clears the picture's edge and
// the tall tower's roof clears a 16:9 crop.
const LY = 400
const LS = 45
const LOOP = projector(345, LY, LS)
const STEPS = penrose(LOOP, 5, 0.7, 0.15, 1.1, 6)
const HUB: Pt = [STEPS.reduce((sum, st) => sum + st.at[0], 0) / STEPS.length, STEPS.reduce((sum, st) => sum + st.at[1], 0) / STEPS.length]
// The steps of the near-left flight that crumble on an error, in the order they go.
const DROPS = [7, 8, 9]

// The model of the loop that hovers over Claude's laptop, in the desk's box.
const MINI = projector(359, 168, 9)
const MINI_STEPS = penrose(MINI, 3, 0.7, 0.15, 1.1, 0.8)

/** Keyframes that walk a figure round a loop's treads, a little hop between steps, facing the way it goes. */
function walkKeys(name: string, steps: readonly Step[], hop: number, turn: boolean): string {
  const n = steps.length
  const at = (x: number, y: number, side: number) =>
    `{transform:translate(${f(x)}px,${f(y)}px)${turn ? ` scale(${side === 0 || side === 3 ? -1 : 1},1)` : ''}}`
  let keys = ''

  steps.forEach((st, index) => {
    const next = steps[(index + 1) % n]!.at

    keys += `${f((index / n) * 100)}%${at(st.at[0], st.at[1], st.side)}`
    if (hop > 0) {
      keys += `${f(((index + 0.5) / n) * 100)}%${at((st.at[0] + next[0]) / 2, (st.at[1] + next[1]) / 2 - hop, st.side)}`
    }
  })

  return `@keyframes ${name}{${keys}100%${at(steps[0]!.at[0], steps[0]!.at[1], 0)}}`
}

function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const model = backToFront(MINI_STEPS)
    .map(({ st }) => {
      const fc = faces(MINI, st.box)

      return `<path d="${fc.left}" fill="#2a2345"/><path d="${fc.right}" fill="#1b1631"/><path d="${fc.top}" fill="#4a4080"/>`
    })
    .join('')
  const lit = MINI_STEPS.map(st => faces(MINI, st.box).top).join('')
  const pace = activity === 'run' ? 2.4 : activity === 'idle' ? 14 : 7

  return (
    // The laptop.
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2b2542"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2b2542"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The model loop hovering over the lid, lit by the screen, a speck of light walking round it; a pool of light under it.
    `<ellipse cx="352" cy="218" rx="34" ry="6" fill="${light}" fill-opacity=".18"/>` +
    '<g class="ix-hov">' +
    model +
    `<path d="${lit}" fill="${light}" fill-opacity=".38"/>` +
    `<g class="ix-md" style="animation-duration:${pace}s;transform:translate(${f(MINI_STEPS[0]!.at[0])}px,${f(MINI_STEPS[0]!.at[1])}px)"><circle r="2.2" fill="${PALE}"/></g></g>`
  )
}

export function infiniteStairsWorld(): World {
  const next = random(5309)
  const n = STEPS.length

  // Stars: fewer and dimmer over the chat column.
  const stars = Array.from({ length: 62 }, (_, i) => {
    const x = next() * 1600
    const y = next() * 1000
    const column = x > 420 && x < 1180
    const o = column ? 0.12 + next() * 0.18 : 0.25 + next() * 0.45
    const r = 0.7 + next() * (column ? 0.8 : 1.4)

    return `<circle${i % 6 === 0 ? ` class="ix-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#d8d0ff" fill-opacity="${f(o)}"/>`
  }).join('')

  // Stray flights in the sky, upside down and sideways.
  const strays = [
    [520, 330, 180, 1, 4, 0],
    [700, 360, 70, 0.8, 3, 1],
    [1060, 300, 205, 0.9, 4, 0],
    [1180, 90, 140, 0.75, 3, 1],
    [470, 60, 30, 0.8, 3, 1],
  ]
    .map(
      ([x, y, rot, sc, count, tone], i) =>
        `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><g class="ix-fr" style="animation-delay:${f(-i * 2.3)}s">${flight(count!, 15, tone!)}</g></g>`,
    )
    .join('')

  // A second loop far off, hanging upside down in the sky: its walls in one shape, its treads in another.
  const farP = projector(0, 0, 25)
  const far = penrose(farP, 5, 0.7, 0.15, 1.1, 1.3)
  const farHub = [far.reduce((sum, st) => sum + st.at[0], 0) / n, far.reduce((sum, st) => sum + st.at[1], 0) / n]
  const farWalls = far.map(st => faces(farP, st.box)).map(fc => fc.left + fc.right).join('')
  const farTops = far.map(st => faces(farP, st.box).top).join('')
  const farLoop =
    `<g transform="translate(810 150)"><g class="ix-far"><g transform="rotate(180) translate(${f(-farHub[0]!)} ${f(-farHub[1]!)})">` +
    `<path d="${farWalls}" fill="#100c1d"/><path d="${farTops}" fill="#1a1530" stroke="#342c5c" stroke-width="1" stroke-linejoin="round"/></g></g></g>`

  // The loop's blocks, back to front; each step that drops on an error leaves a shaft into the dark.
  const blocks = backToFront(STEPS)
    .map(({ st, index }) => {
      const fc = faces(LOOP, st.box)
      const fall = DROPS.indexOf(index)
      const body =
        `<path d="${fc.left}" fill="url(#ix-wl)"/><path d="${fc.right}" fill="url(#ix-wr)"/>` +
        `<path class="ix-tp" d="${fc.top}"/><path class="ix-tl" style="--n:${index}" d="${fc.top}"/>`

      return fall >= 0 ? `<path d="${fc.left}${fc.right}${fc.top}" fill="url(#ix-pit)"/><g class="ix-drop" style="--d:${fall}">${body}</g>` : body
    })
    .join('')
  const trail = `M${STEPS.map(st => `${f(st.at[0])} ${f(st.at[1] - 3)}`).join('L')}Z`
  const climbers = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const start = STEPS[Math.round((i / 6) * n) % n]!.at
      // Where each stands frozen while the steps fall: well clear of the flight that breaks.
      const safe = [10.5, 12.5, 15, 17.5, 19.5, 2.5][i]! / n

      return `<g class="ix-cl" style="--p:${f(i / 6)};--e:${Math.round(safe * 1000) / 1000};transform:translate(${f(start[0])}px,${f(start[1])}px)">${climber()}</g>`
    })
    .join('')
  const [s4, s5, s6] = [STEPS[4]!.at, STEPS[5]!.at, STEPS[6]!.at]
  const drop = STEPS[DROPS[1]!]!.at
  const crumbs = DROPS.map((step, d) => {
    const at = STEPS[step]!.at

    return [-12, -3, 7, 15]
      .map(
        (dx, i) =>
          `<rect class="ix-cr" style="--dx:${dx * 2}px;animation-delay:${f(0.3 + d * 0.22 + i * 0.07)}s" x="${f(at[0] + dx)}" y="${f(at[1] + 4)}" width="6" height="6" fill="#4a4080"/>`,
      )
      .join('')
  }).join('')

  // The orbit of stone chips round the loop, split so its near half passes in front.
  const chips = Array.from({ length: 16 }, (_, i) => {
    const t = (i / 16) * Math.PI * 2 + next() * 0.2
    const r = (5 + next() * 0.52) * LS
    const size = 7 + next() * 7
    const [x, y] = [r * Math.cos(t), r * Math.sin(t)]

    return `<rect x="${f(x - size / 2)}" y="${f(y - size / 2)}" width="${f(size)}" height="${f(size)}" transform="rotate(45 ${f(x)} ${f(y)})"/>`
  }).join('')
  const orbitAt = `translate(${f(HUB[0])} ${f(HUB[1] + 10)}) rotate(-9)`
  const orbit = (clip: string) =>
    `<g clip-path="url(#${clip})"><g transform="${orbitAt} scale(1 .3)"><circle r="${f(5.24 * LS)}" fill="none" stroke="${LILAC}" stroke-opacity=".14" stroke-width="5"/>` +
    `<circle class="ix-obr" r="${f(5.24 * LS)}" fill="none" stroke="${LILAC}" stroke-opacity=".5" stroke-width="5"/><g class="ix-orb" fill="${LILAC}" fill-opacity=".6">${chips}</g></g></g>`

  // The stair round the far tower: steps on a helix that slides down one turn and repeats, so it seems to turn.
  const helixSteps = (front: boolean) => {
    const parts: string[] = []

    // 38 steps keep the picture's top filled through the whole one-turn slide.
    for (let q = 0; q < 38; q += 1) {
      const t = (q / 10) * Math.PI * 2
      const cos = Math.cos(t)
      const sin = Math.sin(t)

      if (cos >= -0.05 !== front) {
        continue
      }

      const y = 480 - q * 18
      const corner = (r: number, w: number): Pt => [1500 + r * sin + w * cos, y + (r * cos - w * sin) * 0.28]

      parts.push(
        `<path d="${poly([corner(44, -13), corner(96, -13), corner(96, 13), corner(44, 13)])}" fill="${front ? '#3a3160' : '#1a152d'}" ` +
          `stroke="${front ? '#100c1c' : '#0a0812'}" stroke-width="5" paint-order="stroke"/>`,
      )
      if (front && q % 5 === 2) {
        parts.push(`<circle cx="${f(1500 + 80 * sin)}" cy="${f(y + 80 * cos * 0.28 - 8)}" r="2.4" fill="${PALE}" fill-opacity=".85"/>`)
      }
    }

    return `<g clip-path="url(#ix-hc)"><g class="ix-hx">${parts.join('')}</g></g>`
  }
  const base = [0, 1, 2, 3]
    .map(i => `<rect x="${1448 + i * 13}" y="${478 + i * 22}" width="${104 - i * 26}" height="22" fill="${i % 2 ? '#14102a' : '#1d1833'}" stroke="#463c78" stroke-opacity=".6"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#05040a',
      furniture: STONE,
      metal: '#2b2542',
      paper: '#e6e2f0',
      light: { idle: '#5a4fb0', work: '#8d7dff', bright: '#d8d2ff' },
      headTop: 232,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // A bowler hat with a violet band; the brim stops above the eyes.
          '<path d="M98 234C96 204 114 188 150 188C186 188 204 204 202 234Z" fill="#0d0a16" stroke="#30285a" stroke-width="2"/>' +
          `<path d="M98 222H202V232H98Z" fill="${VIOLET}"/>` +
          '<path d="M114 202C124 195 136 193 148 193" fill="none" stroke="#40367a" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M56 240C78 228 222 228 244 240C226 248 74 248 56 240Z" fill="#0d0a16" stroke="#30285a" stroke-width="2"/>',
      },
      // A three-step stair to sit on.
      seatArt:
        '<path d="M106 350H196V456H106ZM66 386H106V456H66ZM26 421H66V456H26Z" fill="#1b1630"/>' +
        '<path d="M196 350L204 344V450L196 456Z" fill="#110e1f"/>' +
        '<path d="M106 350L114 344H204L196 350ZM66 386L74 380H114L106 386ZM26 421L34 415H74L66 421Z" fill="#3a3160"/>' +
        `<path d="M106 350H196M66 386H106M26 421H66" stroke="${EDGE}" stroke-opacity=".7" stroke-width="1.4"/>`,
      // A slab desk held up under the laptop by a little flight of stairs, its far end hanging over nothing.
      tableArt:
        '<path d="M162 330L170 322H474L466 330Z" fill="#3a3160"/>' +
        '<rect x="162" y="330" width="304" height="14" fill="#1f1a33"/><path d="M466 330L474 322V336L466 344Z" fill="#141027"/>' +
        `<path d="M162 330H466" stroke="${EDGE}" stroke-opacity=".7" stroke-width="1.4"/>` +
        '<rect x="178" y="344" width="12" height="112" fill="#1b1630"/>' +
        '<path d="M296 456V433.6H316V411.2H336V388.8H356V366.4H376V344H396V456Z" fill="#1b1630"/>' +
        `<path d="M296 433.6H316M316 411.2H336M336 388.8H356M356 366.4H376" stroke="${EDGE}" stroke-opacity=".7" stroke-width="1.4"/>`,
    },
    style:
      walkKeys('ix-walk', STEPS, 8, true) +
      walkKeys('ix-mini', MINI_STEPS, 0, false) +
      // The loop's treads and its climbers' paint.
      `.ix-tp{fill:${TREAD};stroke:${EDGE};stroke-opacity:.7;stroke-width:1.3;stroke-linejoin:round}.ix-tl{fill:${LILAC}}` +
      `.ix-hd{fill:#07050d;stroke:#5d51a0;stroke-width:.9}.ix-arm{stroke:#07050d;stroke-width:2;stroke-linecap:round}` +
      `.ix-lg{fill:${LILAC};fill-opacity:.25}.ix-lp{fill:${PALE}}` +
      // Ambient: the climbers walk, the chips orbit, the far stair turns, the far loop sways, strays bob, stars breathe.
      '.ix-cl{animation:ix-walk 36s linear infinite;animation-delay:calc(var(--p) * -36s)}' +
      '.st-responding .ix-cl,.st-thinking .ix-cl{animation-duration:24s;animation-delay:calc(var(--p) * -24s)}' +
      '.st-tool .ix-cl,.st-web .ix-cl,.st-read .ix-cl{animation-duration:16s;animation-delay:calc(var(--p) * -16s)}' +
      '.ix-md{animation:ix-mini 9s linear infinite}' +
      '.ix-hov{animation:ix-hov 4.4s ease-in-out infinite alternate}@keyframes ix-hov{from{transform:translateY(3px)}to{transform:translateY(-5px)}}' +
      '.ix-orb{animation:mv-spin 90s linear infinite}.st-tool .ix-orb{animation-duration:24s}' +
      '.ix-hx{animation:ix-hx 20s linear infinite}@keyframes ix-hx{to{transform:translateY(180px)}}' +
      '.st-tool .ix-hx,.st-web .ix-hx{animation-duration:8s}' +
      '.ix-far{animation:ix-sway 22s ease-in-out infinite alternate}@keyframes ix-sway{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.ix-fr{animation:ix-bob 9s ease-in-out infinite alternate}@keyframes ix-bob{to{transform:translateY(-16px)}}' +
      '.st-thinking .ix-fr{animation:ix-drift 4s ease-in-out infinite alternate}@keyframes ix-drift{to{transform:translate(10px,-26px) rotate(6deg)}}' +
      '.ix-tw{animation:ix-tw 4s ease-in-out infinite alternate}@keyframes ix-tw{from{opacity:.2}to{opacity:1}}' +
      '.ix-neb{animation:ix-neb 9s ease-in-out infinite alternate}@keyframes ix-neb{from{opacity:.8}to{opacity:1}}' +
      // Read: the towers' slits light one by one. Web: the short tower sends rings out.
      '.ix-win,.ix-tl,.ix-sig,.ix-tr,.ix-ring,.ix-halo,.ix-cr,.ix-stum,.ix-hurt,.ix-rise,.ix-obr{opacity:0}' +
      '.st-read .ix-win{animation:ix-on .5s ease-out both;animation-delay:calc(var(--w) * .22s)}' +
      '@keyframes ix-on{to{opacity:.85}}' +
      '.ix-sig{transform-box:fill-box;transform-origin:center}' +
      '.st-web .ix-sig{animation:ix-sig 1.8s ease-out infinite}@keyframes ix-sig{0%{opacity:0;transform:scale(.3)}25%{opacity:.7}100%{opacity:0;transform:scale(3)}}' +
      // Run: a light races round the loop, a wave of steps runs with it, the climbers run, everything turns.
      '.st-run .ix-cl{animation-duration:7s;animation-delay:calc(var(--p) * -7s)}' +
      '.st-run .ix-orb{animation-duration:5s}.st-run .ix-hx{animation-duration:2.2s}' +
      '.st-run .ix-far{animation:ix-turn 6s cubic-bezier(.45,0,.3,1) infinite}@keyframes ix-turn{from{transform:rotate(-5deg)}to{transform:rotate(355deg)}}' +
      '.st-run .ix-tr{opacity:1}.st-run .ix-obr{animation:ix-on .8s ease-out both}' +
      '.st-run .ix-halo{animation:ix-pulse 2.4s ease-in-out .3s infinite alternate}@keyframes ix-pulse{from{opacity:.05}to{opacity:.32}}' +
      '.ix-dash{stroke-dasharray:.13 .37;animation:ix-dash 1.8s linear infinite}@keyframes ix-dash{to{stroke-dashoffset:-1}}' +
      '.st-run .ix-tl{animation:ix-wave 1.8s linear infinite;animation-delay:calc(var(--n) * .09s - 1.8s)}' +
      '@keyframes ix-wave{0%{opacity:0}8%{opacity:.62}40%,100%{opacity:0}}' +
      // Error: three steps crumble out one after another, the climber before them stumbles back down, the rest freeze.
      '.ix-drop{transform-box:fill-box;transform-origin:center}' +
      '.st-error .ix-drop{animation:ix-fall 1.7s cubic-bezier(.5,0,.9,.6) both;animation-delay:calc(.25s + var(--d) * .22s)}' +
      '@keyframes ix-fall{to{transform:translate(-40px,380px) rotate(-16deg);opacity:0}}' +
      '.st-error .ix-cl{animation-play-state:paused;animation-delay:calc(var(--e) * -36s)}' +
      '.st-error .ix-stum{opacity:1;animation:ix-stum 1.6s ease-out .2s both}' +
      `@keyframes ix-stum{0%{transform:translate(${f(s6[0])}px,${f(s6[1])}px) rotate(0)}` +
      `18%{transform:translate(${f(s6[0] + 3)}px,${f(s6[1] - 2)}px) rotate(10deg)}` +
      `42%{transform:translate(${f((s5[0] + s6[0]) / 2)}px,${f((s5[1] + s6[1]) / 2 - 16)}px) rotate(-28deg)}` +
      `60%{transform:translate(${f(s5[0])}px,${f(s5[1])}px) rotate(-46deg)}` +
      `80%{transform:translate(${f(s4[0] + 6)}px,${f(s4[1] - 2)}px) rotate(-78deg)}` +
      `100%{transform:translate(${f(s4[0] + 8)}px,${f(s4[1])}px) rotate(-84deg)}}` +
      '.st-error .ix-cr{animation:ix-cr 1.5s ease-in both}@keyframes ix-cr{0%{opacity:0}15%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),260px)}}' +
      '.st-error .ix-hurt{animation:ix-hurt 1s ease-out .3s both}@keyframes ix-hurt{to{opacity:.6}}' +
      '.st-error .ix-hx,.st-error .ix-orb,.st-error .ix-far{animation-play-state:paused}' +
      '.st-error .ix-loop{animation:ix-jolt .45s ease-out .25s 2}@keyframes ix-jolt{30%{transform:translate(-3px,2px)}60%{transform:translate(3px,-1px)}}' +
      // Done: the loop lights up step by step, the ring closes, a light climbs the far tower.
      '.st-done .ix-tl{animation:ix-lit .6s ease-out both;animation-delay:calc(var(--n) * .09s)}@keyframes ix-lit{to{opacity:.62}}' +
      '.st-done .ix-ring{animation:ix-on 1s ease-out 1.6s both}' +
      '.st-done .ix-halo{animation:ix-halo 2s ease-out .4s both}@keyframes ix-halo{to{opacity:.5}}' +
      '.st-done .ix-win{animation:ix-on .5s ease-out both;animation-delay:calc(.3s + var(--w) * .15s)}' +
      '.st-done .ix-rise{animation:ix-rise 2.8s ease-in-out both}@keyframes ix-rise{0%{opacity:0;transform:translateY(0)}20%{opacity:.75}100%{opacity:.5;transform:translateY(-400px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ix-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06040c"/><stop offset=".55" stop-color="#0b0817"/><stop offset="1" stop-color="#110b1f"/></linearGradient>' +
      `<radialGradient id="ix-neb"><stop offset="0" stop-color="${VIOLET}" stop-opacity=".42"/><stop offset=".45" stop-color="#4a3aa8" stop-opacity=".16"/><stop offset="1" stop-color="#2a1f6a" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="ix-wl" gradientUnits="userSpaceOnUse" x1="0" y1="${LY}" x2="0" y2="${f(LY + 8.2 * LS)}"><stop offset="0" stop-color="#2a2348"/><stop offset=".45" stop-color="#1a152f"/><stop offset="1" stop-color="#0a0714" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="ix-wr" gradientUnits="userSpaceOnUse" x1="0" y1="${LY}" x2="0" y2="${f(LY + 8.2 * LS)}"><stop offset="0" stop-color="#1c1733"/><stop offset=".45" stop-color="#120e23"/><stop offset="1" stop-color="#08060f" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="ix-pit" gradientUnits="userSpaceOnUse" x1="0" y1="${LY}" x2="0" y2="${f(LY + 8.2 * LS)}"><stop offset=".3" stop-color="${NIGHT}"/><stop offset="1" stop-color="${NIGHT}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="ix-twl" gradientUnits="userSpaceOnUse" x1="0" y1="${f(LY - 6.4 * LS)}" x2="0" y2="${f(LY + 6 * LS)}"><stop offset="0" stop-color="#2a2348"/><stop offset=".55" stop-color="#1d1835"/><stop offset="1" stop-color="#110d20" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="ix-twr" gradientUnits="userSpaceOnUse" x1="0" y1="${f(LY - 6.4 * LS)}" x2="0" y2="${f(LY + 6 * LS)}"><stop offset="0" stop-color="#1c1733"/><stop offset=".55" stop-color="#141027"/><stop offset="1" stop-color="#0b0816" stop-opacity="0"/></linearGradient>` +
      '<linearGradient id="ix-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0918"/><stop offset=".35" stop-color="#262043"/><stop offset="1" stop-color="#0a0814"/></linearGradient>' +
      '<linearGradient id="ix-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06040c"/><stop offset="1" stop-color="#06040c" stop-opacity="0"/></linearGradient>' +
      `<radialGradient id="ix-up"><stop offset="0" stop-color="${PALE}" stop-opacity=".7"/><stop offset=".4" stop-color="${LILAC}" stop-opacity=".35"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="ix-hal"><stop offset="0" stop-color="${LILAC}" stop-opacity=".45"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ix-hrt"><stop offset="0" stop-color="#e0508a" stop-opacity=".55"/><stop offset="1" stop-color="#e0508a" stop-opacity="0"/></radialGradient>' +
      `<clipPath id="ix-ob"><rect x="-500" y="-700" width="1500" height="700" transform="${orbitAt}"/></clipPath>` +
      `<clipPath id="ix-of"><rect x="-500" y="0" width="1500" height="700" transform="${orbitAt}"/></clipPath>` +
      '<clipPath id="ix-hc"><rect x="1380" y="-60" width="260" height="560"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ix-sky)"/>' +
      '<g class="ix-neb"><circle cx="295" cy="575" r="560" fill="url(#ix-neb)"/><circle cx="1440" cy="220" r="340" fill="url(#ix-neb)" opacity=".55"/></g>' +
      stars +
      farLoop +
      strays +
      // The far tower and its stair.
      '<g class="mv-r">' +
      helixSteps(false) +
      '<rect x="1454" y="-60" width="92" height="540" fill="url(#ix-cyl)"/>' +
      '<g fill="#07050d"><rect x="1476" y="120" width="5" height="12"/><rect x="1500" y="250" width="5" height="12"/><rect x="1486" y="380" width="5" height="12"/></g>' +
      helixSteps(true) +
      base +
      '<ellipse class="ix-rise" cx="1500" cy="470" rx="90" ry="80" fill="url(#ix-up)"/>' +
      '<rect x="1360" y="-40" width="300" height="190" fill="url(#ix-haze)"/>' +
      '</g>' +
      // The loop and everything on it.
      '<g class="ix-loop">' +
      orbit('ix-ob') +
      tower(LOOP, -2, -2, 1.4, 4.3, 1.5, 3, 0) +
      tower(LOOP, 3.4, -1.9, 1, 3.2, 1.1, 2, 3) +
      `<g transform="translate(${f(LOOP(3.9, -1.4, 4.6)[0])} ${f(LOOP(3.9, -1.4, 4.6)[1])})"><circle class="ix-sig" r="16" fill="none" stroke="${LILAC}" stroke-width="2"/>` +
      `<circle class="ix-sig" style="animation-delay:.6s" r="16" fill="none" stroke="${LILAC}" stroke-width="2"/></g>` +
      `<ellipse class="ix-halo" cx="${f(HUB[0])}" cy="${f(HUB[1])}" rx="${5 * LS}" ry="${f(2.6 * LS)}" fill="url(#ix-hal)"/>` +
      blocks +
      arch(LOOP, 4.45, 4.75, 6.5, 3, 0.95, 0.66, 1.3) +
      `<circle class="ix-hurt" cx="${f(drop[0])}" cy="${f(drop[1] + 24)}" r="110" fill="url(#ix-hrt)"/>` +
      `<g class="ix-tr" fill="none" stroke-linejoin="round"><path class="ix-dash" pathLength="1" d="${trail}" stroke="${LILAC}" stroke-opacity=".4" stroke-width="22"/>` +
      `<path class="ix-dash" pathLength="1" d="${trail}" stroke="${PALE}" stroke-opacity=".9" stroke-width="4"/></g>` +
      `<path class="ix-ring" d="${trail}" fill="none" stroke="${LILAC}" stroke-opacity=".7" stroke-width="3" stroke-linejoin="round"/>` +
      climbers +
      `<g class="ix-stum" style="transform:translate(${f(s6[0])}px,${f(s6[1])}px)">${climber()}</g>` +
      crumbs +
      orbit('ix-of') +
      '</g>',
    nook:
      // The landing Claude works on: a broad step of the stair, the next one down to the left.
      '<defs><linearGradient id="ix-lf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171329"/><stop offset="1" stop-color="#07050d"/></linearGradient></defs>' +
      '<path d="M-150 490L-130 476H-20L-40 490Z" fill="#221c38"/><rect x="-150" y="490" width="110" height="60" fill="url(#ix-lf)"/>' +
      '<path d="M-40 466L-10 436H480V466Z" fill="#241e3c"/>' +
      '<rect x="-40" y="466" width="520" height="80" fill="url(#ix-lf)"/>' +
      `<path d="M-40 466H480M-40 466L-10 436" stroke="${EDGE}" stroke-opacity=".6" stroke-width="1.4" fill="none"/>`,
  }
}
