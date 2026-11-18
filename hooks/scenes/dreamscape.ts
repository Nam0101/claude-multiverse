import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Dreamscape: a dream with its own idea of gravity. A city hangs upside down from the top of the violet sky, doors
// float in the air with light leaking round their edges, and a switchback stair climbs to a moon that is a round
// door, ajar on a crescent of light. Claude sits on a stair landing in a nightcap, typing into a little door. When a
// command runs gravity flips: loose things fall upward, an island turns over and a floating flight rolls into a new
// position. An error folds the stairs and slams every door; done swings them all open and the light spills out.
const PINK = '#ff9ecf'
const INK = '#07040c'
const PLUM = '#2a1d3c'
const PLUM_EDGE = '#5a4580'
const METAL = '#3b2c52'
const BRASS = '#e0b870'
const PALE = '#f1e4f8'

type Tone = { back: string; tread: string; front: string; edge: string }
const STONE: Tone = { back: '#170f29', tread: '#56426f', front: '#2d2146', edge: '#9a7cc0' }
const DIM: Tone = { back: '#0f0a1b', tread: '#261c3a', front: '#170f27', edge: '#4a3a68' }

/**
 * A flight of `n` steps seen from the side, from its foot at (x, y): each step `run` across and `rise` up, its
 * width pushed back by `depth`. A negative rise hangs it upside down, the treads facing the ground. `nose` is the
 * line along the step edges, foot first, for the light that climbs it.
 */
function flight(x: number, y: number, n: number, run: number, rise: number, depth: [number, number], tone: Tone): { body: string; nose: string } {
  const t = rise * 1.15
  const top: [number, number][] = [[x, y]]

  for (let i = 0; i < n; i += 1) {
    top.push([x + i * run, y - (i + 1) * rise], [x + (i + 1) * run, y - (i + 1) * rise])
  }

  const [ex, ey] = top[top.length - 1] ?? [x, y]
  const [dx, dy] = depth
  const outline = (ox: number, oy: number): string =>
    'M' + [...top, [ex, ey + t], [x, y + t]].map(([px, py]) => `${f(px! + ox)} ${f(py! + oy)}`).join('L') + 'Z'
  let treads = ''

  for (let i = 0; i < n; i += 1) {
    treads += `M${f(x + i * run)} ${f(y - (i + 1) * rise)}h${f(run)}l${dx} ${dy}h${f(-run)}Z`
  }

  return {
    body:
      `<path d="${outline(dx, dy)}" fill="${tone.back}"/><path d="${treads}" fill="${tone.tread}"/>` +
      `<path d="${outline(0, 0)}" fill="${tone.front}" stroke="${tone.edge}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>`,
    nose: 'M' + top.map(([px, py]) => `${f(px)} ${f(py)}`).join('L'),
  }
}

/** The faint runner along a flight, the light that chases up it on a tool call and the glow that climbs it when done. */
function lights(nose: string, delay: number): string {
  return (
    `<path d="${nose}" fill="none" stroke="${PINK}" stroke-opacity=".3" stroke-width="1.6"/>` +
    `<path class="dr-chase" pathLength="1" d="${nose}" fill="none" stroke="#ffe6f3" stroke-width="3.4" stroke-linecap="round" style="animation-delay:${-delay}s"/>` +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="dr-path" pathLength="1" d="${nose}" stroke="${PINK}" stroke-opacity=".35" stroke-width="10" style="animation-delay:${delay}s"/>` +
    `<path class="dr-path" pathLength="1" d="${nose}" stroke="#ffe3f1" stroke-width="3" style="animation-delay:${delay}s"/></g>`
  )
}

/** A floating island: a domed top with a lit rim over a jagged rock that tapers to a point, roots trailing below. */
function island(cx: number, cy: number, w: number, next: () => number): string {
  const depth = w * 0.62
  const under: string[] = []
  let roots = ''

  for (let k = 0; k <= 8; k += 1) {
    const u = k / 8
    const px = cx + w / 2 - u * w
    const py = cy + 6 + depth * Math.pow(Math.sin(Math.PI * u), 1.5) * (0.78 + next() * 0.36)

    under.push(`${f(px)} ${f(py)}`)

    if (k % 2 === 1) {
      roots += `M${f(px)} ${f(py - 4)}q${f((next() - 0.5) * 16)} ${f(14 + next() * 10)} ${f((next() - 0.5) * 8)} ${f(26 + next() * 18)}`
    }
  }

  const rim = `M${f(cx - w / 2)} ${f(cy)}Q${f(cx)} ${f(cy - 14)} ${f(cx + w / 2)} ${f(cy)}`

  return (
    `<path d="${roots}" fill="none" stroke="#2c1f45" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="${rim}L${under.join('L')}Z" fill="#1c1330" stroke="#3e2d5a" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${rim}" fill="none" stroke="#8a68b8" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`
  )
}

/** A door standing in the air, its sill at (0, 0): the light behind it, the frame, the leaf hung on its left edge. */
function door(w: number, h: number): string {
  const l = -w / 2
  const motes = [-0.3, 0.05, 0.35]
    .map((k, i) => `<circle class="dr-mote" cx="${f(k * w)}" cy="${f(-h * 0.5)}" r="2.6" fill="#ffe6f3" style="--x:${f(k * 70)}px;animation-delay:${f(0.9 + i * 0.6)}s"/>`)
    .join('')

  return (
    `<ellipse class="dr-halo" cx="0" cy="${f(-h / 2)}" rx="${f(w * 1.5)}" ry="${f(h * 0.95)}" fill="url(#dr-dg)"/>` +
    `<path class="dr-spill" d="M${f(l)} 0H${f(-l)}L${f(w * 1.7)} ${f(h)}H${f(-w * 1.7)}Z" fill="url(#dr-sp)"/>` +
    `<rect x="${f(l - 6)}" y="${f(-h - 6)}" width="${f(w + 12)}" height="${f(h + 8)}" rx="2" fill="#0e0918" stroke="#6e5394" stroke-opacity=".8" stroke-width="2"/>` +
    `<rect class="dr-in" x="${f(l)}" y="${-h}" width="${w}" height="${h}" fill="url(#dr-dl)"/>` +
    `<g class="dr-leaf"><rect x="${f(l)}" y="${-h}" width="${w}" height="${h}" fill="#2e2149" stroke="#57437c" stroke-width="1.5"/>` +
    `<g fill="none" stroke="#4b3970" stroke-width="2"><rect x="${f(l + 7)}" y="${f(-h + 8)}" width="${f(w - 14)}" height="${f(h * 0.4)}" rx="2"/>` +
    `<rect x="${f(l + 7)}" y="${f(-h * 0.5)}" width="${f(w - 14)}" height="${f(h * 0.42)}" rx="2"/></g>` +
    `<circle cx="${f(-l - 8)}" cy="${f(-h * 0.5)}" r="3.4" fill="${BRASS}"/></g>` +
    motes +
    `<rect x="${f(l - 10)}" y="0" width="${f(w + 20)}" height="6" rx="2" fill="#1d1430" stroke="#6e5394" stroke-opacity=".6"/>`
  )
}

/** A door afloat at (x, y), turned `a` degrees: it sways in the air, jolts when it slams. */
function floating(x: number, y: number, a: number, w: number, h: number, delay: number): string {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><g class="dr-sway" style="animation-delay:${delay}s"><g class="dr-jolt">${door(w, h)}</g></g></g>`
}

/** The moon that is a door: a round leaf hinged on its left, ajar on a crescent of the light behind it. */
function moonDoor(): string {
  const craters = (
    [
      [-34, -36, 15],
      [22, -52, 9],
      [-8, 30, 18],
      [40, 30, 10],
      [-58, 6, 8],
    ] as const
  )
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
    .join('')

  return (
    '<circle class="dr-mhalo" r="250" fill="url(#dr-mh)"/>' +
    '<circle class="dr-mopen" r="95" fill="url(#dr-mo)"/>' +
    '<circle r="98" fill="none" stroke="#f6dff0" stroke-opacity=".3" stroke-width="3"/>' +
    '<g class="dr-ml"><circle r="95" fill="url(#dr-mf)"/>' +
    `<g fill="#a385c2" fill-opacity=".32">${craters}</g>` +
    '<circle r="80" fill="none" stroke="#a487c0" stroke-opacity=".45" stroke-width="2"/>' +
    '<g fill="#6d5290"><rect x="-96" y="-48" width="16" height="10" rx="2"/><rect x="-96" y="38" width="16" height="10" rx="2"/></g>' +
    `<circle cx="70" cy="4" r="7" fill="${BRASS}"/><circle cx="68" cy="2" r="2.4" fill="#fff3d0" fill-opacity=".8"/></g>`
  )
}

type Skyline = { shape: string; pink: string; amber: string; dim: string; masts: string }

/** A row of buildings hanging from the top of the sky, roofs and spires pointing down: taller at the sides. */
function skyline(next: () => number, tall: number, mid: number, windows: boolean): Skyline {
  const out: Skyline = { shape: '', pink: '', amber: '', dim: '', masts: '' }

  for (let x = -30; x < 1630; ) {
    const w = 28 + next() * 52
    const side = x + w < 420 || x > 1180
    const h = side ? tall * (0.45 + next() * 0.55) : mid * (0.35 + next() * 0.65)
    const roof = next()
    const left = f(x)
    const low = f(h)

    out.shape += `M${left} -40H${f(x + w)}V${low}`

    if (roof < 0.3) {
      out.shape += `H${left}Z`
    } else if (roof < 0.55) {
      out.shape += `L${f(x + w / 2)} ${f(h + w * 0.9)}L${left} ${low}Z`
      out.masts += `M${f(x + w / 2)} ${f(h + w * 0.9)}v${f(10 + next() * 16)}`
    } else if (roof < 0.8) {
      out.shape += `A${f(w / 2)} ${f(w * 0.42)} 0 0 1 ${left} ${low}Z`
    } else {
      out.shape += `H${f(x + w * 0.78)}V${f(h + 14)}H${f(x + w * 0.22)}V${low}H${left}Z`
    }

    if (windows) {
      for (let wy = 12; wy < h - 14; wy += 19) {
        for (let wx = x + 6; wx < x + w - 11; wx += 13) {
          const p = next()
          const pane = `M${f(wx)} ${f(wy)}h6v9h-6z`

          if (!side) {
            if (p < 0.05) out.dim += pane
          } else if (p < 0.11) {
            out.pink += pane
          } else if (p < 0.2) {
            out.amber += pane
          }
        }
      }
    }

    x += w + (next() < 0.3 ? 4 + next() * 16 : -3)
  }

  return out
}

// The loose things of the dream, each resting on its foot at (0, 0): when gravity flips they fall up and away.
const THINGS = {
  book: `<path d="M-13 0V-9H13V0Z" fill="#6b3f86"/><path d="M-13 -9H13" stroke="${PALE}" stroke-opacity=".55" stroke-width="2"/><path d="M-10 -4.5H10" stroke="#d58fc0" stroke-opacity=".6"/>`,
  cup: `<path d="M-7 -12H7L5.5 -3H-5.5Z" fill="${PALE}" fill-opacity=".8"/><path d="M7 -10q6 0 5 4q-1 3 -6 2" fill="none" stroke="${PALE}" stroke-opacity=".7" stroke-width="2"/><rect x="-10" y="-3" width="20" height="3" rx="1.5" fill="${PALE}" fill-opacity=".7"/>`,
  chair: '<path d="M-9 0V-11H9V0M-9 -11V-27" fill="none" stroke="#b294d0" stroke-width="3" stroke-linecap="round"/>',
  umbrella: '<path d="M-15 -18Q0 -34 15 -18Q7.5 -21 0 -18Q-7.5 -21 -15 -18Z" fill="#c45a98"/><path d="M0 -18V-2Q0 2 -4 2" fill="none" stroke="#d8c4e8" stroke-width="2"/>',
  pillow: '<rect x="-14" y="-10" width="28" height="10" rx="5" fill="#d8c0ec" fill-opacity=".8"/>',
  pebble: '<ellipse cx="0" cy="-4" rx="7" ry="4" fill="#5a4680" stroke="#8a6db0" stroke-opacity=".5"/>',
  bed:
    '<path d="M-36 0V-30M34 0V-14" stroke="#4a3868" stroke-width="5" stroke-linecap="round"/><rect x="-36" y="-16" width="70" height="10" rx="3" fill="#3b2c52"/>' +
    '<path d="M-14 -16H34V-8H-14Z" fill="#c45a98"/><rect x="-32" y="-24" width="18" height="9" rx="4" fill="#efe4fa"/>',
  slipper: '<path d="M-12 0Q-13 -7 -4 -7H6Q13 -7 12 0Z" fill="#d86aa6"/><path d="M-2 -7Q4 -12 10 -6" fill="none" stroke="#f3d6ea" stroke-width="2"/>',
} as const

/** One loose thing at (x, y); on run it falls `up` units upward, drifting `dx` and turning `turn` degrees. */
function thing(kind: keyof typeof THINGS, x: number, y: number, delay: number, up: number, turn: number, dx = 0, scale = 1.5): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})"><g class="dr-up" style="--d:${delay}s;--h:${f(-up / scale)}px;--r:${turn}deg;--x:${f(dx / scale)}px">` +
    `${THINGS[kind]}</g></g>`
  )
}

/** Streaks of dust falling up through a strip of the sky, two copies a picture apart so the loop has no seam. */
function rising(seed: number, x0: number, width: number, count: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    d += `M${f(x0 + next() * width)} ${f(next() * 1000)}v${f(24 + next() * 40)}`
  }

  return `<g class="dr-rise"><path d="${d}"/><path d="${d}" transform="translate(0 1000)"/></g>`
}

/** A four-pointed sparkle. */
function sparkle(x: number, y: number, s: number): string {
  const k = s * 0.28

  return `M${f(x)} ${f(y - s)}L${f(x + k)} ${f(y - k)}L${f(x + s)} ${f(y)}L${f(x + k)} ${f(y + k)}L${f(x)} ${f(y + s)}L${f(x - k)} ${f(y + k)}L${f(x - s)} ${f(y)}L${f(x - k)} ${f(y - k)}Z`
}

/**
 * The keyboard, and the screen: a little arched door on the desk whose doorway is the light, its leaf swung toward
 * Claude (slammed nearly shut on an error, flung wide when done). A teacup floats over the keys, its tea pouring upward.
 * Self-contained: the portals draw the rig alone.
 */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const leaf =
    activity === 'error' ? 'M357 250L396 254V325H357Z' : activity === 'done' ? 'M357 250L326 236V336L357 325Z' : 'M357 250L338 240V332L357 325Z'
  const knob = activity === 'error' ? [390, 290] : activity === 'done' ? [331, 288] : [343, 288]

  return (
    `<rect x="244" y="321" width="92" height="9" rx="3" fill="${METAL}"/>` +
    keys +
    `<rect x="342" y="325" width="76" height="5" rx="2" fill="${METAL}"/>` +
    `<path d="M350 326V248Q350 218 380 218Q410 218 410 248V326Z" fill="${METAL}" stroke="#5e4a80" stroke-width="1.5"/>` +
    `<path d="M357 326V250Q357 226 380 226Q403 226 403 250V326Z" fill="${light}" fill-opacity=".9"/>` +
    `<path d="M366 252H392M366 264H386M370 276H396M366 288H382M370 300H394M366 312H384" stroke="${INK}" stroke-opacity=".32" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="${leaf}" fill="#4a3868" stroke="#6a5490" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<circle cx="${knob[0]}" cy="${knob[1]}" r="2.6" fill="${BRASS}"/>` +
    '<g class="dr-cup">' +
    `<path d="M282 268H306L303 279Q294 285 285 279Z" fill="${PALE}" fill-opacity=".85"/>` +
    `<path d="M306 271q7 0 6 5q-1 4 -7 3" fill="none" stroke="${PALE}" stroke-opacity=".85" stroke-width="2.2"/>` +
    `<rect x="278" y="285" width="32" height="3.5" rx="1.75" fill="${PALE}" fill-opacity=".7"/>` +
    `<path class="dr-tea" pathLength="1" d="M294 268C288 254 302 246 296 232C291 220 302 212 298 200" fill="none" stroke="${PINK}" stroke-opacity=".75" stroke-width="3.2" stroke-linecap="round"/>` +
    '</g>'
  )
}

export function dreamscapeWorld(): World {
  const next = random(5150)
  const far = skyline(next, 300, 165, false)
  const near = skyline(next, 225, 112, true)

  // Stars below the city: fewer and fainter over the chat column.
  let starA = ''
  let starB = ''

  for (let i = 0; i < 64; i += 1) {
    const x = next() * 1600
    const y = 150 + next() * 760
    const column = x > 420 && x < 1180

    if (column && next() < 0.6) continue

    const s = column ? 1.8 : 2.6
    const dot = `M${f(x)} ${f(y)}h${s}v${s}h-${s}z`

    if (i % 2 === 0) starA += dot
    else starB += dot
  }

  const sparkles = [
    [80, 470, 7],
    [390, 180, 6],
    [1230, 560, 7],
    [1560, 230, 6],
    [30, 300, 5],
    [1340, 420, 5],
  ]
    .map(([x, y, s]) => sparkle(x!, y!, s!))
    .join('')

  const wisps = (
    [
      [200, 520, 220, 22, 0.9],
      [90, 980, 260, 30, 0.8],
      [1420, 640, 240, 24, 0.85],
      [1480, 120, 200, 20, 0.6],
      [780, 560, 300, 26, 0.35],
      [820, 860, 360, 34, 0.4],
      [640, 330, 220, 18, 0.3],
    ] as const
  )
    .map(([x, y, rx, ry, o], i) => `<ellipse class="dr-cl" style="animation-delay:${-i * 5}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#dr-wp)" opacity="${o}"/>`)
    .join('')

  // The switchback stair to the moon: a long flight up from an island to a landing, a steep one on to the moon's sill.
  const fa = flight(400, 900, 9, -36, 200 / 9, [-9, -7], STONE)
  const fb = flight(107, 700, 8, 21, 34.375, [9, -7], STONE)
  // A flight hanging upside down from the city, and a loose one at the far right that turns over when gravity flips.
  const hang = flight(520, 34, 7, 30, -27, [10, 7], DIM)
  const loose = flight(1330, 392, 8, 30, 26, [11, -8], STONE)
  // The flight on up from Claude's landing, behind the desk, to a door.
  const onward = flight(440, 300, 8, -30, 36, [-10, -7], STONE)

  const tree =
    '<path d="M128 832V800" stroke="#2a1d3c" stroke-width="5" stroke-linecap="round"/>' +
    '<g fill="#2f2150" stroke="#4e3a76" stroke-width="1.2"><circle cx="128" cy="786" r="19"/><circle cx="113" cy="798" r="13"/><circle cx="143" cy="797" r="14"/></g>' +
    `<g fill="${PINK}" fill-opacity=".75"><circle cx="120" cy="780" r="2.4"/><circle cx="136" cy="790" r="2.4"/><circle cx="114" cy="800" r="2"/><circle cx="130" cy="772" r="2"/><circle cx="146" cy="800" r="2"/></g>`

  const fish = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2
    const r = 128 + (i % 3) * 22
    const x = 1430 + r * Math.cos(a)
    const y = 330 + r * Math.sin(a)

    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f((a * 180) / Math.PI + 90)})"><path d="M20 0Q5 -11 -10 0Q5 11 20 0ZM-9 0L-21 -9V9Z"/></g>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'orbs',
      ink: INK,
      furniture: PLUM,
      metal: METAL,
      paper: PALE,
      light: { idle: '#b08ad6', work: PINK, bright: '#ffe1f1' },
      headTop: 176,
      glowAt: [380, 276],
      device,
      wear: {
        // A nightcap: a soft cone flopping over to the back with a pom-pom, stars on it, a fur cuff that ends at
        // y 250, above the eyes.
        front:
          '<path d="M70 236C74 210 88 196 106 188C86 186 58 190 40 202C56 172 98 152 142 152C190 152 226 190 230 236Z" fill="#5a3f8e" stroke="#7a5cb0" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M106 188C120 183 136 183 150 187" fill="none" stroke="#3e2a66" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="${sparkle(122, 214, 5)}${sparkle(172, 200, 5.5)}${sparkle(208, 222, 4)}${sparkle(148, 176, 4)}${sparkle(92, 222, 3.5)}" fill="#ffc6e6"/>` +
          '<rect x="60" y="230" width="180" height="20" rx="10" fill="#efe4fa"/>' +
          '<path d="M74 240H226" stroke="#c9b6e2" stroke-width="2" stroke-dasharray="3 7"/>' +
          '<circle cx="38" cy="204" r="11" fill="#f6ecfd"/><circle cx="35" cy="200" r="4" fill="#ffffff" fill-opacity=".6"/>',
      },
      // Claude sits on the top step of a little carpeted stair.
      seatArt:
        '<path d="M108 344H208V450H108ZM60 380H108V450H60ZM16 416H60V450H16Z" fill="#150e25"/>' +
        '<path d="M100 350h100l8 -6h-100ZM52 386h48l8 -6h-48ZM8 422h44l8 -6h-44Z" fill="#47365f"/>' +
        '<path d="M100 350H200V456H100ZM52 386H100V456H52ZM8 422H52V456H8Z" fill="#271c3e" stroke="#8a6db0" stroke-opacity=".5" stroke-width="1.5"/>' +
        '<path d="M100 350H200V357H100ZM52 386H100V393H52ZM8 422H52V429H8Z" fill="#a35a8c" fill-opacity=".85"/>',
      // The desk is a door laid flat, its knob on the end, held up by a leg and a little flight of steps.
      tableArt:
        '<path d="M440 337h26v-6h-26ZM412 374h20v-6h-20ZM384 412h20v-6h-20Z" fill="#150e25"/>' +
        '<path d="M432 343H466V456H432ZM404 380H432V456H404ZM376 418H404V456H376Z" fill="#271c3e" stroke="#8a6db0" stroke-opacity=".5" stroke-width="1.5"/>' +
        '<path d="M404 380h28l6 -5h-28ZM376 418h28l6 -5h-28Z" fill="#47365f"/>' +
        `<rect x="182" y="343" width="12" height="113" fill="${PLUM}" stroke="${PLUM_EDGE}" stroke-width="1.2"/>` +
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${PLUM}" stroke="${PLUM_EDGE}" stroke-width="1.6"/>` +
        '<path d="M178 336.5H450" stroke="#6a5490" stroke-width="1.2" stroke-dasharray="64 8"/>' +
        `<path d="M167 330.5H469" stroke="${PINK}" stroke-opacity=".4" stroke-width="1.6"/>` +
        `<circle cx="460" cy="336.5" r="3.6" fill="${BRASS}"/>`,
    },
    style:
      // Ambient: islands bob, doors sway in the air, light breathes round their leaves, stars twinkle, wisps drift.
      '.dr-bob{animation:dr-bob 7s ease-in-out infinite alternate}@keyframes dr-bob{from{transform:translateY(-9px)}to{transform:translateY(9px)}}' +
      '.dr-sway{transform-box:fill-box;transform-origin:center;animation:dr-sway 9s ease-in-out infinite alternate}' +
      '@keyframes dr-sway{from{transform:rotate(-3deg) translateY(-6px)}to{transform:rotate(3deg) translateY(6px)}}' +
      '.dr-leaf{transform-box:fill-box;transform-origin:0 50%;animation:dr-ajar 6s ease-in-out infinite alternate}' +
      '@keyframes dr-ajar{from{transform:scaleX(.86)}to{transform:scaleX(.78)}}' +
      '.dr-in{animation:dr-pulse 4s ease-in-out infinite alternate}@keyframes dr-pulse{from{opacity:.65}to{opacity:1}}' +
      '.dr-halo{opacity:.4}.dr-spill,.dr-mray,.dr-mote,.dr-fish,.dr-streak,.dr-chase{opacity:0}' +
      '.dr-ml{transform-box:fill-box;transform-origin:0 50%;animation:dr-majar 8s ease-in-out infinite alternate}' +
      '@keyframes dr-majar{from{transform:scaleX(.93)}to{transform:scaleX(.87)}}' +
      '.dr-mhalo{animation:dr-pulse 6s ease-in-out infinite alternate}' +
      '.dr-tw{animation:dr-tw 3.6s ease-in-out infinite alternate}.dr-tw2{animation-duration:2.8s;animation-delay:-1.4s}' +
      '@keyframes dr-tw{from{opacity:.25}to{opacity:.9}}' +
      '.dr-cl{animation:dr-cl 34s ease-in-out infinite alternate}@keyframes dr-cl{to{transform:translateX(60px)}}' +
      '.dr-win{animation:dr-win 5s ease-in-out infinite alternate}@keyframes dr-win{from{opacity:.55}to{opacity:1}}' +
      '.dr-cup{transform-box:fill-box;transform-origin:center;animation:dr-hover 3.6s ease-in-out infinite alternate}@keyframes dr-hover{from{transform:translateY(-3px)}to{transform:translateY(3px)}}' +
      '.dr-tea{stroke-dasharray:.3 .7;animation:dr-tea 2.4s linear infinite}@keyframes dr-tea{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.dr-path{stroke-dasharray:1;stroke-dashoffset:1}.dr-chase{stroke-dasharray:.07 .93}' +
      '.dr-s4,.dr-flip,.dr-up,.dr-moon{transform-box:fill-box;transform-origin:center}' +
      '.dr-hs{transform-box:fill-box;transform-origin:50% 0}.dr-fb{transform-origin:107px 700px}' +
      // Thinking: the loose flight rocks, the moon door breathes on its hinges.
      '.st-thinking .dr-s4{animation:dr-rock 3.2s ease-in-out infinite alternate}@keyframes dr-rock{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}' +
      '.st-thinking .dr-ml{animation-duration:2.4s}' +
      // Responding: the wind of the dream picks up.
      '.st-responding .dr-cl{animation-duration:9s}.st-responding .dr-sway{animation-duration:3.6s}.st-responding .dr-tw{animation-duration:1.6s}' +
      // Tool: a light runs up every stair.
      '.st-tool .dr-chase{opacity:1;animation:dr-chase 1.1s linear infinite}@keyframes dr-chase{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      // Read: the doors open halfway to peek, the windows of the city brighten and dim.
      '.st-read .dr-leaf{animation:dr-peek 1.2s ease-out both}@keyframes dr-peek{from{transform:scaleX(.82)}to{transform:scaleX(.5)}}' +
      '.st-read .dr-halo{opacity:.7}.st-read .dr-win{animation-duration:1s}' +
      // Web: a school of fish swims round the loose flight.
      '.st-web .dr-fish{opacity:1}.st-web .dr-school{transform-origin:1430px 330px;animation:mv-spin 8s linear infinite}.st-web .dr-in{animation-duration:1.2s}' +
      // Run: gravity flips. Loose things fall upward, dust streams up, an island turns over, the loose flight rolls.
      '.st-run .dr-up{animation:dr-up 2.4s cubic-bezier(.5,0,.9,.5) var(--d) infinite}' +
      '@keyframes dr-up{0%{transform:translate(0,0) rotate(0)}12%{transform:translate(0,5px) rotate(0)}100%{transform:translate(var(--x),var(--h)) rotate(var(--r))}}' +
      '.st-run .dr-streak{opacity:1}.dr-rise{animation:dr-rise 1.3s linear infinite}@keyframes dr-rise{to{transform:translateY(-1000px)}}' +
      '.st-run .dr-s4{animation:dr-turn 1.5s cubic-bezier(.6,-.3,.3,1.3) .2s both}@keyframes dr-turn{to{transform:rotate(180deg)}}' +
      '.st-run .dr-flip{animation:dr-turn 1.4s cubic-bezier(.6,-.3,.3,1.3) .45s both}' +
      '.st-run .dr-moon{animation:dr-turn 1.6s cubic-bezier(.6,-.3,.3,1.3) .3s both}' +
      '.dr-bed{opacity:0}.st-run .dr-bed{animation:dr-bed 3.6s cubic-bezier(.35,0,.75,.9) .05s infinite}' +
      '@keyframes dr-bed{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:1;transform:translate(60px,-1260px) rotate(-40deg)}}' +
      '.st-run .dr-cup{animation:dr-lift 1.2s ease-in-out infinite alternate}@keyframes dr-lift{from{transform:translateY(-2px)}to{transform:translateY(-16px) rotate(-8deg)}}' +
      // Error: the stairs fold, every door slams shut and jolts, the light behind them goes out.
      '.st-error .dr-leaf{animation:dr-slam .32s cubic-bezier(.6,0,1,1) both}@keyframes dr-slam{from{transform:scaleX(.82)}to{transform:scaleX(1)}}' +
      '.st-error .dr-in,.st-error .dr-halo,.st-error .dr-mopen{animation:dr-dark .5s ease-in .2s both}@keyframes dr-dark{to{opacity:.08}}' +
      '.st-error .dr-jolt{animation:dr-jolt .5s ease-out .3s both}' +
      '@keyframes dr-jolt{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,2px)}45%{transform:translate(5px,-2px)}70%{transform:translate(-2px,1px)}}' +
      '.st-error .dr-ml{animation:dr-mslam .36s cubic-bezier(.6,0,1,1) both}@keyframes dr-mslam{from{transform:scaleX(.9)}to{transform:scaleX(1)}}' +
      '.st-error .dr-mhalo{animation:dr-dim .6s ease-in both}@keyframes dr-dim{to{opacity:.35}}' +
      '.st-error .dr-fb{animation:dr-fold 1.3s cubic-bezier(.55,0,.4,1) .15s both}' +
      '@keyframes dr-fold{0%{transform:rotate(0)}70%{transform:rotate(98deg)}85%{transform:rotate(89deg)}100%{transform:rotate(92deg)}}' +
      '.st-error .dr-s4{animation:dr-squash .8s cubic-bezier(.5,0,.3,1.3) .1s both}@keyframes dr-squash{to{transform:scale(1.1,.12)}}' +
      '.st-error .dr-hs{animation:dr-hfold 1s cubic-bezier(.5,0,.3,1.2) .2s both}@keyframes dr-hfold{to{transform:scaleY(.14)}}' +
      // Done: every door swings wide, the light spills out, a glow climbs the stair to the open moon.
      '.st-done .dr-leaf{animation:dr-open 1.4s cubic-bezier(.3,0,.2,1) .2s both}@keyframes dr-open{from{transform:scaleX(.82)}to{transform:scaleX(.1)}}' +
      '.st-done .dr-in{animation:none;opacity:1}' +
      '.st-done .dr-halo{animation:dr-bright 1.4s ease-out .4s both}@keyframes dr-bright{from{opacity:.4}to{opacity:1}}' +
      '.st-done .dr-spill,.st-done .dr-mray{animation:dr-spill 1.6s ease-out .6s both}@keyframes dr-spill{to{opacity:.34}}' +
      '.st-done .dr-ml{animation:dr-mopen 1.8s cubic-bezier(.3,0,.2,1) .3s both}@keyframes dr-mopen{from{transform:scaleX(.9)}to{transform:scaleX(.1)}}' +
      '.st-done .dr-path{animation:dr-draw 1.5s ease-in-out .4s both}@keyframes dr-draw{to{stroke-dashoffset:0}}' +
      '.st-done .dr-mote{transform-box:fill-box;animation:dr-mote 2.6s ease-out infinite}' +
      '@keyframes dr-mote{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--x),-110px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="dr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0613"/><stop offset=".45" stop-color="#130c22"/><stop offset=".8" stop-color="#1b1130"/><stop offset="1" stop-color="#24163a"/></linearGradient>' +
      `<radialGradient id="dr-hz"><stop offset="0" stop-color="${PINK}" stop-opacity=".16"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="dr-cg"><stop offset="0" stop-color="#7a3a90" stop-opacity=".72"/><stop offset="1" stop-color="#6a3384" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dr-wp"><stop offset="0" stop-color="#6a3a80" stop-opacity=".5"/><stop offset="1" stop-color="#6a3a80" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dr-mh"><stop offset="0" stop-color="#ffd6ee" stop-opacity=".34"/><stop offset=".45" stop-color="#c99be0" stop-opacity=".13"/><stop offset="1" stop-color="#c99be0" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="dr-mo"><stop offset="0" stop-color="#fffaf0"/><stop offset=".55" stop-color="#ffd9e8"/><stop offset="1" stop-color="${PINK}"/></radialGradient>` +
      '<radialGradient id="dr-mf" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#f8eefa"/><stop offset=".7" stop-color="#dcc6e8"/><stop offset="1" stop-color="#b597ce"/></radialGradient>' +
      `<linearGradient id="dr-mr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8f4" stop-opacity=".85"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="dr-dl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1e0"/><stop offset=".55" stop-color="#ffc8e2"/><stop offset="1" stop-color="${PINK}"/></linearGradient>` +
      `<radialGradient id="dr-dg"><stop offset="0" stop-color="${PINK}" stop-opacity=".5"/><stop offset=".5" stop-color="${PINK}" stop-opacity=".16"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="dr-sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0ef" stop-opacity=".9"/><stop offset="1" stop-color="#ffe0ef" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#dr-sky)"/>' +
      '<ellipse cx="240" cy="900" rx="460" ry="280" fill="url(#dr-hz)"/><ellipse cx="1500" cy="720" rx="380" ry="320" fill="url(#dr-hz)"/>' +
      `<path class="dr-tw" d="${starA}" fill="#e8dcf8"/><path class="dr-tw dr-tw2" d="${starB}" fill="#d8c8f0"/>` +
      `<path class="dr-tw dr-tw2" d="${sparkles}" fill="#ffd0ea" fill-opacity=".8"/>` +
      // The glow under the hanging city, strongest at the sides.
      '<ellipse cx="170" cy="200" rx="430" ry="210" fill="url(#dr-cg)"/><ellipse cx="1440" cy="210" rx="430" ry="210" fill="url(#dr-cg)"/>' +
      '<ellipse cx="800" cy="150" rx="520" ry="130" fill="url(#dr-cg)" opacity=".35"/>' +
      wisps +
      // The moon that is a door.
      `<g transform="translate(275 330)"><g class="dr-moon">${moonDoor()}</g></g>` +
      // The upside-down city, pinned to the top of the window, and the flight hanging from it.
      '<g class="mv-t">' +
      `<path d="${far.shape}" fill="#1f1234"/>` +
      `<g class="dr-hs">${hang.body}</g>` +
      `<path d="${near.shape}" fill="#0b0713" stroke="#4a2c66" stroke-width="1.4"/>` +
      `<path d="${near.masts}" stroke="#2a1a40" stroke-width="2"/>` +
      `<g class="dr-win"><path d="${near.pink}" fill="${PINK}" fill-opacity=".7"/><path d="${near.amber}" fill="#ffcf8a" fill-opacity=".6"/></g>` +
      `<path d="${near.dim}" fill="#ffcf8a" fill-opacity=".22"/>` +
      '</g>' +
      // The island at the stair's foot, the landing, the two flights; a small island with a tree below.
      island(330, 906, 250, next) +
      `<g fill="${PINK}" fill-opacity=".7"><circle cx="232" cy="898" r="2.2"/><circle cx="356" cy="896" r="2.2"/><circle cx="280" cy="894" r="1.8"/></g>` +
      thing('umbrella', 250, 899, 0.1, 990, -200, 30) +
      thing('book', 304, 895, 0.5, 990, 260, -20) +
      fa.body +
      lights(fa.nose, 0.4) +
      thing('cup', 310, 834, 0.3, 920, 300, 16) +
      thing('chair', 202, 767, 0.75, 860, -240, -10) +
      '<path d="M38 700H114V712L100 726L76 738L52 724L38 712Z" fill="#271c3e" stroke="#8a6db0" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>' +
      `<path d="M38 700H114" stroke="${PINK}" stroke-opacity=".35" stroke-width="2"/>` +
      thing('pillow', 66, 700, 0.2, 790, 160, 20) +
      `<g class="dr-fb">${fb.body}${lights(fb.nose, 1.5)}${thing('pebble', 180, 563, 0.6, 640, 220)}</g>` +
      `<g class="dr-bob" style="animation-duration:6s;animation-delay:-2s"><g class="dr-flip">${island(128, 836, 104, next)}${tree}</g></g>` +
      floating(345, 640, 9, 54, 100, -3) +
      `<g transform="translate(170 1060) scale(2)"><g class="dr-bed" style="transform-box:fill-box;transform-origin:center">${THINGS.bed}</g></g>` +
      // The light the open moon spills down the stair.
      '<g transform="translate(275 330)"><path class="dr-mray" d="M-50 85L55 85L120 590L-260 590Z" fill="url(#dr-mr)"/></g>' +
      // The far right: the loose flight, things adrift, and a door hanging upside down under the city.
      '<g class="mv-r">' +
      `<g class="dr-bob" style="animation-duration:8s"><g class="dr-s4">${loose.body}${lights(loose.nose, 0.8)}</g></g>` +
      thing('book', 1545, 470, 0.35, 560, 300, -30) +
      thing('pebble', 1238, 430, 0.15, 520, -180) +
      thing('pebble', 1580, 620, 0.55, 710, 140) +
      `<g class="dr-fish"><g class="dr-school" fill="#ffc2e4" fill-opacity=".85">${fish}</g></g>` +
      `<g class="mv-t">${floating(1262, 236, 186, 50, 92, -6)}</g>` +
      '</g>' +
      // Dust falling up while gravity is flipped, at both sides.
      '<g class="dr-streak" stroke="#ffd6ee" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round">' +
      rising(61, 0, 410, 40) +
      `<g class="mv-r">${rising(62, 1190, 410, 40)}</g></g>`,
    nook:
      // The landing: the floor of the stair, its broken underside showing in a wide window.
      '<path d="M-10 456H440V486L380 500L330 540L260 556L200 600L150 560L90 548L40 512L-10 494Z" fill="#160f27" stroke="#3e2d5a" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M-10 456H440" stroke="#8a6db0" stroke-opacity=".5" stroke-width="2"/>' +
      // The flight on up past the desk, to a door on its own little landing.
      onward.body +
      lights(onward.nose, 0.6) +
      '<path d="M150 12H240V26H150Z" fill="#271c3e" stroke="#8a6db0" stroke-opacity=".55" stroke-width="1.5"/>' +
      `<g transform="translate(196 12)"><g class="dr-jolt">${door(60, 112)}</g></g>`,
    front: thing('book', 236, 456, 0.25, 1060, 280, -20, 1.3) + thing('slipper', 300, 456, 0.6, 1060, -320, 24, 1.3) + thing('pillow', 350, 456, 0.9, 1060, 200, -10, 1.3),
  }
}
