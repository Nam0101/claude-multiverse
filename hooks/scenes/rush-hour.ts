import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Rush Hour: Claude at a barricade desk on a traffic island in the middle of a huge city crossing at dusk. Giant
// screens of invented glyphs glow on the corner towers, a commuter train crosses the far viaduct, taxis and a bus pass,
// and a sea of commuters waits under umbrellas at every curb. When a command runs the lights change and the crowd
// surges across in every direction; an error is a gust that turns the umbrellas inside out and sends papers flying;
// done parts the crowd and turns every light green in a wave that runs out from Claude's island.
const RED = '#ff5c5c'
const AMBER = '#ffb23e'
const GREEN = '#52e08a'
const SIL = '#07080c'
const POLE = '#14161c'
const BOX = '#0a0b0f'
const BOX_EDGE = '#2a2c35'

/** Two decimals, for scales. */
const k = (n: number): string => String(Math.round(n * 100) / 100)

// A commuter, feet at 0 and about 100 units tall, and the umbrella over it.
const HEAD = 'M-8-90a8 8 0 1 0 16 0a8 8 0 1 0-16 0'
const COAT = 'M-13-79h26l5 46h-36z'
const LEGS = 'M-10-33h8v33h-8zm12 0h8v33h-8z'
const SHAFT = 'M8-158h2.4v94h-2.4z'
const BODIES = [
  HEAD + COAT + LEGS + SHAFT,
  HEAD + 'M-13-79h26l8 62h-42zM-9-17h7v17h-7zm11 0h7v17h-7z' + SHAFT,
  HEAD + COAT + LEGS + 'M15-47h17v14h-17z',
  HEAD + 'M-12-99h24l4 8h-32z' + COAT + LEGS + 'M-21-76h8v32h-8z',
]
const UMB = 'M-25-122q34-52 68 0q-8-5-17 0q-8-5-17 0q-8-5-17 0q-9-5-17 0z'
const CANOPY = [
  ' fill="#1b1e2a"',
  ' fill="#272a3a"',
  ' fill="#3a1a22"',
  ' fill="#13282c"',
  ' fill="#8a2f34"',
  ' fill="#d0d8e6" fill-opacity=".16"',
  ' fill="#5c4b20"',
  ' fill="#d0d8e6" fill-opacity=".16"',
]

// The walk-signal people, feet at 0 and 24 tall.
const STAND = 'M-2.6-21a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0M-4-17h8v9h-1.5v8h-2.1v-8h-.8v8h-2.1v-8h-1.5z'
const WALK = 'M-1.6-21a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0M-1-17h4l3.5 6-1.6 1-2.6-3.8v5.2l3 9.6-2.2.8-2.8-8.4-2.6 8.4-2.2-.8 2.6-9.6v-5l-2 3.6-1.6-.9z'

type Fig = readonly [x: number, y: number, s: number]

/** How long after done begins a light turns green: the wave runs out from Claude's island at the right. */
const wave = (x: number): number => 0.2 + ((1600 - x) / 1600) * 1.4

/** A lit lamp: its glow and its disc, shown or hidden by the state. */
function lamp(cls: string, x: number, y: number, r: number, color: string, glow: string, w: number, gr: number, extra = ''): string {
  return (
    `<g class="${cls}" style="--w:${f(w)}s"><circle cx="${f(x)}" cy="${f(y)}" r="${gr}" fill="url(#${glow})"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${color}"/>${extra}</g>`
  )
}

/** A pedestrian signal lamp: the walk-signal person, lit, with its glow. */
function walker(cls: string, x: number, y: number, s: number, shape: string, color: string, glow: string, w: number): string {
  return (
    `<g class="${cls}" style="--w:${f(w)}s"><circle cx="${f(x)}" cy="${f(y - 11 * s)}" r="${f(22 * s)}" fill="url(#${glow})"/>` +
    `<path transform="translate(${f(x)} ${f(y)})scale(${k(s)})" d="${shape}" fill="${color}"/></g>`
  )
}

/** A three-lamp traffic signal hung sideways from the mast arm, its lamps reflected on the wet road. */
function head(x: number, y: number): string {
  const w = wave(x)
  const streak = (dx: number, id: string) => `<rect x="${x + dx - 4}" y="640" width="8" height="250" fill="url(#${id})"/>`

  return (
    `<path d="M${x} ${y - 14}V${y}" stroke="${POLE}" stroke-width="4"/>` +
    `<rect x="${x - 34}" y="${y}" width="68" height="24" rx="5" fill="${BOX}" stroke="${BOX_EDGE}" stroke-width="2"/>` +
    `<g fill="#1c1e24"><circle cx="${x - 20}" cy="${y + 12}" r="7.5"/><circle cx="${x}" cy="${y + 12}" r="7.5"/><circle cx="${x + 20}" cy="${y + 12}" r="7.5"/></g>` +
    lamp('rh-lr', x - 20, y + 12, 7.5, RED, 'rh-gR', w, 30, streak(-20, 'rh-kR')) +
    lamp('rh-la', x, y + 12, 7.5, AMBER, 'rh-gA', w, 30, streak(0, 'rh-kA')) +
    lamp('rh-lg', x + 20, y + 12, 7.5, GREEN, 'rh-gG', w, 30, streak(20, 'rh-kG'))
  )
}

/** A crowd that moves as one: its rows further back, then its nearest commuters drawn back to front. */
function crowd(vars: string, figs: readonly Fig[], back: string, next: () => number): string {
  const people = [...figs]
    .sort((a, b) => a[1] - b[1])
    .map(([x, y, s]) => {
      const roll = next()
      const v = roll < 0.74 ? (next() < 0.72 ? 0 : 1) : next() < 0.5 ? 2 : 3
      const canopy =
        v < 2 ? `<path class="rh-u" style="--fd:${f(0.1 + (x / 1600) * 1.1)}s" d="${UMB}"${CANOPY[Math.floor(next() * CANOPY.length)]}/>` : ''

      return `<g transform="translate(${Math.round(x)} ${Math.round(y)})scale(${k(s)})"><path d="${BODIES[v]}"/>${canopy}</g>`
    })
    .join('')

  return `<g class="rh-c" style="${vars}"><g class="rh-st" fill="${SIL}">${back}${people}</g></g>`
}

/**
 * A row of commuters further back, drawn cheaply: legs, coats, heads and umbrella shafts are dashes along horizontal
 * lines, one pattern of a few people repeating along the row. Near enough, the umbrellas are domes in three paths that
 * each turn inside out as one; far off, they are rounded dashes too.
 */
function throng(x0: number, x1: number, g: number, s: number, next: () => number, m = 6): string {
  const n = (v: number) => (s < 0.5 ? f(v) : String(Math.round(v)))
  const gaps = Array.from({ length: m }, () => (30 + next() * 26) * s)
  const period = gaps.reduce((sum, gap) => sum + gap, 0)
  const at = gaps.map((_, j) => 16 * s + gaps.slice(0, j).reduce((sum, gap) => sum + gap, 0))
  const brolly = at.map(() => next() < 0.78)
  const line = (y: number, width: number, span: (p: number, j: number) => [number, number][], extra = '') => {
    const cut: [number, number][] = []

    at.forEach((p, j) => {
      for (const [a, b] of span(p, j)) {
        if (b > period) {
          cut.push([a, period], [0, b - period])
        } else {
          cut.push([a, b])
        }
      }
    })
    cut.sort((u, v) => u[0] - v[0])

    const merged: [number, number][] = []

    for (const [a, b] of cut) {
      const last = merged[merged.length - 1]

      if (last !== undefined && a <= last[1]) {
        last[1] = Math.max(last[1], b)
      } else {
        merged.push([a, b])
      }
    }

    if (merged[0] === undefined) {
      return ''
    }

    const start = merged[0][0]
    const dash = merged.flatMap(([a, b], i) => [b - a, (merged[i + 1]?.[0] ?? start + period) - b])

    return `<path d="M${n(x0 + start)} ${n(y)}H${n(x1)}" stroke-width="${n(width)}" stroke-dasharray="${dash.map(v => (v < 0.5 ? '.1' : n(v))).join(' ')}"${extra}/>`
  }
  const people =
    line(g - 16.5 * s, 33 * s, p => [[p - 10 * s, p - 2 * s], [p + 2 * s, p + 10 * s]]) +
    line(g - 56 * s, 46 * s, p => [[p - 13 * s, p + 13 * s]]) +
    line(g - 90 * s, 16 * s, p => [[p, p + 0.1]], ' stroke-linecap="round"')

  if (s < 0.45) {
    const pills = (c: number, fill: string) =>
      line(g - 128 * s, 20 * s, (p, j) => (brolly[j] && j % 2 === c ? [[p - 14 * s, p + 32 * s]] : []), ` stroke="${fill}" stroke-linecap="round"`)

    return `<g stroke="${SIL}">${people}${pills(0, '#3b4058')}${pills(1, '#7a3440')}</g>`
  }

  const shafts = line(g - 100 * s, 44 * s, (p, j) => (brolly[j] ? [[p + 8 * s, p + 10.4 * s]] : []))
  const domes = ['', '', '']

  for (let base = x0; base < x1; base += period) {
    at.forEach((p, j) => {
      if (brolly[j] && base + p < x1) {
        domes[j % 3] += `M${f(base + p - 25 * s)} ${f(g - (122 + [0, 5, -4][j % 3]!) * s)}q${f(34 * s)} ${f(-52 * s)} ${f(68 * s)} 0z`
      }
    })
  }

  const fd = f(0.1 + ((x0 + x1) / 3200) * 1.1)

  return (
    `<g stroke="${SIL}">${people}${shafts}</g>` +
    domes.map((d, i) => `<path class="rh-u rh-ur" style="--fd:${fd}s" d="${d}" fill="${['#1d2030', '#3a1a24', '#14292e'][i]}"/>`).join('')
  )
}

/** Rows of an invented script: dashed bars, cut through by thinner dashes so the blocks read as glyphs. */
function script(x: number, y: number, w: number, rows: number, pitch: number, size: number, ink: string, cut: string, next: () => number): string {
  let d = ''

  for (let i = 0; i < rows; i += 1) {
    d += `M${f(x)} ${f(y + i * pitch)}h${f(w * (0.55 + next() * 0.45))}`
  }

  const dash = (n: number, lo: number, hi: number) => Array.from({ length: n }, () => f(size * (lo + next() * (hi - lo)))).join(' ')

  return (
    `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(size)}" stroke-dasharray="${dash(10, 0.35, 1.3)}"/>` +
    `<path d="${d}" fill="none" stroke="${cut}" stroke-width="${f(size * 0.28)}" stroke-dasharray="${dash(7, 0.2, 0.9)}"/>`
  )
}

/** What a giant screen shows in the loud states: walk on run, a warning on error, a ring on done, a spinner while thinking. */
function panels(x: number, y: number, w: number, h: number, mirror: boolean): string {
  const cx = x + w / 2
  const cy = y + h / 2
  const s = h / 240
  const bg = (fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
  const chevrons = [0, 1, 2]
    .map(
      i =>
        `<path class="rh-chv" style="animation-delay:${f(i * 0.2)}s" d="M${f(x + w * 0.55 + i * h * 0.17)} ${f(cy - h * 0.17)}l${f(h * 0.14)} ${f(h * 0.17)}l${f(-h * 0.14)} ${f(h * 0.17)}" ` +
        `fill="none" stroke="${GREEN}" stroke-width="${f(11 * s)}" stroke-linejoin="round"/>`,
    )
    .join('')
  const go =
    `<path transform="translate(${f(x + w * 0.3)} ${f(y + h * 0.88)})scale(${k(8 * s)})" d="${WALK}" fill="${GREEN}"/>` + chevrons
  const t = h * 0.33

  return (
    `<g class="rh-srun">${bg('#04200f')}${mirror ? `<g transform="matrix(-1 0 0 1 ${f(2 * cx)} 0)">${go}</g>` : go}</g>` +
    `<g class="rh-serr">${bg('#26070b')}` +
    `<path d="M${f(cx)} ${f(cy - t)}L${f(cx + t * 1.1)} ${f(cy + t * 0.85)}H${f(cx - t * 1.1)}Z" fill="none" stroke="${AMBER}" stroke-width="${f(12 * s)}" stroke-linejoin="round"/>` +
    `<path d="M${f(cx - 5 * s)} ${f(cy - t * 0.45)}h${f(10 * s)}v${f(t * 0.75)}h${f(-10 * s)}zM${f(cx - 5 * s)} ${f(cy + t * 0.42)}h${f(10 * s)}v${f(10 * s)}h${f(-10 * s)}z" fill="${AMBER}"/>` +
    `<g class="rh-glt" fill="${RED}" fill-opacity=".5"><rect x="${x}" y="${f(y + h * 0.18)}" width="${f(w * 0.3)}" height="${f(7 * s)}"/>` +
    `<rect x="${f(x + w * 0.62)}" y="${f(y + h * 0.74)}" width="${f(w * 0.3)}" height="${f(9 * s)}"/></g></g>` +
    `<g class="rh-sdone">${bg('#04200f')}<circle class="rh-ring" cx="${f(cx)}" cy="${f(cy)}" r="${f(t * 1.15)}" fill="none" stroke="${GREEN}" stroke-width="${f(12 * s)}"/>` +
    `<path d="M${f(cx - t * 0.55)} ${f(cy + t * 0.05)}l${f(t * 0.38)} ${f(t * 0.38)}l${f(t * 0.75)} ${f(-t * 0.8)}" fill="none" stroke="#c8ffd8" stroke-width="${f(15 * s)}" stroke-linecap="round" stroke-linejoin="round"/></g>` +
    `<g class="rh-sthk"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#05060a" fill-opacity=".62"/>` +
    `<circle class="rh-load" cx="${f(cx)}" cy="${f(cy)}" r="${f(t * 0.9)}" fill="none" stroke="#e8ecf4" stroke-opacity=".7" stroke-width="${f(9 * s)}" stroke-dasharray="${f(t * 1.6)} ${f(t * 4.1)}" stroke-linecap="round"/></g>`
  )
}

const CAR = 'M-48-8V-20Q-48-26-40-27L-26-40H6L24-27Q46-25 48-16V-8Z'
const wheels = (a: number, b: number, r: number, y: number) =>
  [a, b].map(c => `M${c - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('')

/** A sedan or a taxi facing right, its wheels on 0, its headlight throwing a beam ahead on the wet road. */
function car(taxi: boolean): string {
  return (
    '<path d="M47-18L190-48V12Z" fill="url(#rh-hb)"/>' +
    `<path d="${CAR}" fill="${taxi ? '#5a4a1c' : '#181922'}" stroke="#2c2e3a" stroke-width="1.5"/>` +
    '<path d="M-23-37H-3V-28H-32ZM1-37H5L19-28H1Z" fill="#9fb4d4" fill-opacity=".2"/>' +
    (taxi ? '<rect x="-14" y="-46" width="18" height="6" rx="2" fill="#ffe0a0" fill-opacity=".7"/>' : '') +
    `<path d="${wheels(-22, 24, 8, -8)}" fill="#040406"/>` +
    `<circle cx="45" cy="-18" r="3.2" fill="#fff2cc"/><rect class="rh-tl" x="-49" y="-23" width="4" height="6" fill="${RED}"/>`
  )
}

/** A city bus facing right: a lit window band with riders in it, a blank lit route sign. */
function bus(): string {
  const riders = [-100, -72, -40, -14, 18, 46, 78].map(x => `M${x} -50a6 6 0 1 1 12 0v4h-12z`).join('')

  return (
    '<path d="M128-26L300-58V10Z" fill="url(#rh-hb)"/>' +
    '<path d="M-130-10V-78Q-130-86-122-86H118Q130-86 130-72V-10Z" fill="#17262f" stroke="#2c4050" stroke-width="2"/>' +
    '<path d="M-122-74H112V-44H-122Z" fill="#ffd9a0" fill-opacity=".26"/>' +
    `<path d="${riders}" fill="#0a0e12" fill-opacity=".8"/>` +
    '<path d="M-122-59H112" stroke="#17262f" stroke-width="30" stroke-dasharray="3 26"/>' +
    '<rect x="62" y="-84" width="52" height="7" rx="2" fill="#ffc46a" fill-opacity=".6"/>' +
    `<path d="${wheels(-86, 84, 12, -10)}" fill="#040406"/>` +
    `<circle cx="126" cy="-24" r="4" fill="#fff2cc"/><rect class="rh-tl" x="-131" y="-34" width="5" height="10" fill="${RED}"/>`
  )
}

/** The laptop on the barricade, a paper coffee cup with its lid and sleeve, and a folded transit map. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const steam = activity === 'error' ? '' : ' rh-stm'

  return (
    '<rect x="246" y="323" width="92" height="7" rx="2" fill="#2a2d38"/>' +
    keys +
    '<path d="M330 327L356 238L366 240L340 329Z" fill="#2a2d38"/>' +
    `<path d="M331 324L355 242L359 243L335 326Z" fill="${light}"/>` +
    `<path d="M331 324L355 242L342 246L322 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M373 306H391L388 330H376Z" fill="#d8d2c4"/><path d="M374 313H390L389 321H375Z" fill="#7a4e32"/>' +
    '<rect x="371" y="301" width="22" height="6" rx="2" fill="#eeeae2"/>' +
    `<g fill="none" stroke="#c8ccd6" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"><path class="rh-s${steam}" pathLength="1" d="M379 297C375 288 385 282 380 270"/>` +
    `<path class="rh-s${steam} rh-s2" pathLength="1" d="M385 297C389 288 379 280 385 268"/></g>` +
    '<path d="M398 330L402 322H444L447 330Z" fill="#e6e2d8" fill-opacity=".75"/>' +
    `<path d="M405 327H441" stroke="${RED}" stroke-width="1.6"/><path d="M412 324L426 329L440 324" fill="none" stroke="#5aa0e0" stroke-width="1.6"/>`
  )
}

/** The barricade's red stripes on one board. */
function stripes(x0: number, x1: number, y: number, h: number): string {
  let d = ''

  for (let x = x0; x + 12 + h * 0.6 <= x1; x += 26) {
    d += `M${x} ${y}h12l${f(h * 0.6)} ${h}h-12z`
  }

  return d
}

export function rushHourWorld(): World {
  const next = random(5454)

  // The far towers at the end of the avenue, and the rows their lit windows sit on (clipped to the towers).
  const towers: [number, number, number][] = [
    [392, 70, 360], [458, 56, 318], [508, 92, 392], [596, 46, 170], [638, 82, 350], [714, 64, 420], [772, 96, 330],
    [862, 60, 400], [916, 84, 262], [994, 52, 372], [1040, 88, 410], [1122, 72, 340], [1186, 40, 380],
  ]
  const towerPath = towers.map(([x, w, top]) => `M${x} 600V${top}h${w}V600z`).join('')
  const rows = (from: number, to: number, step: number, x0: number, x1: number, phase: number, every: number) => {
    let d = ''

    for (let y = from, i = 0; y <= to; y += step, i += 1) {
      if (i % every === phase) {
        d += `M${x0} ${y}H${x1}`
      }
    }

    return d
  }
  const lit = (d: string, dash: string, color: string, opacity: number, width: number) =>
    `<path d="${d}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-dasharray="${dash}"/>`

  const clouds = [
    [170, 96, 270, 16], [610, 64, 320, 12], [1010, 128, 340, 18], [1420, 78, 260, 14], [820, 196, 440, 11], [300, 218, 210, 9],
  ]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y! + 5}" rx="${rx}" ry="${ry}" fill="#b8504a" fill-opacity=".3"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#0e0d18"/>`)
    .join('')

  // The crowds, far to near.
  const mid = (xs: number[]): Fig[] => xs.map(x => [x + (next() - 0.5) * 12, 740 + next() * 12, 0.72 + next() * 0.06] as const)
  const farA = crowd('--wx:520px;--px:-170px', [], throng(90, 660, 598, 0.3, next, 4) + throng(100, 650, 607, 0.35, next, 4), next)
  const farB = crowd('--wx:-520px;--px:170px', [], throng(940, 1520, 598, 0.3, next, 4) + throng(950, 1510, 607, 0.35, next, 4), next)
  const farC1 = crowd('--wx:-60px;--wy:170px;--ws:1.8;--px:-300px', [], throng(682, 800, 604, 0.33, next, 4), next)
  const farC2 = crowd('--wx:60px;--wy:170px;--ws:1.8;--px:300px', [], throng(806, 924, 604, 0.33, next, 4), next)
  const midL = crowd('--wx:840px;--px:-150px', mid([58, 196, 326]), throng(-40, 410, 712, 0.55, next) + throng(-30, 420, 726, 0.63, next), next)
  const midR = crowd('--wx:-840px;--px:170px', mid([1250, 1396, 1530]), throng(1184, 1640, 712, 0.55, next) + throng(1190, 1640, 726, 0.63, next), next)
  const nearL = crowd(
    '--wx:620px;--wy:-200px;--ws:.72;--px:-120px',
    [40, 140, 240, 334].map(x => [x + (next() - 0.5) * 16, 984 + next() * 16, 1.2 + next() * 0.12] as const),
    throng(-40, 372, 924, 0.92, next),
    next,
  )

  // Traffic: a far lane rolling right, a near lane rolling left.
  const laneA = [
    [false, 0, 150],
    [true, -3.7, 92],
    [false, -7.4, 34],
  ]
    .map(([taxi, d, q]) => `<g class="rh-va" style="--d:${d}s;--q:${q}px"><g transform="translate(0 672)scale(.5)">${car(taxi as boolean)}</g></g>`)
    .join('')
  const laneB =
    `<g class="rh-vb" style="--d:0s"><g transform="translate(0 842)scale(-.82 .82)">${bus()}</g></g>` +
    `<g class="rh-vb" style="--d:-7.5s"><g transform="translate(0 842)scale(-.82 .82)">${car(true)}</g></g>`

  // The far walk signals along the far curb, and the papers and wind of the gust.
  const farX = [150, 330, 520, 690, 910, 1090, 1270, 1450]
  const farSignals =
    `<path d="${farX.map(x => `M${x - 1.5} 606V548h3v58z`).join('')}" fill="${POLE}"/>` +
    `<path d="${farX.map(x => `M${x - 5} 534h10v22h-10z`).join('')}" fill="${BOX}" stroke="${BOX_EDGE}"/>` +
    [
      ['rh-pr', RED, 540],
      ['rh-pg', GREEN, 550],
    ]
      .map(
        ([cls, c, y]) =>
          `<g fill="${c}" stroke="${c}" stroke-opacity=".22" stroke-width="10">` +
          farX.map(x => `<circle class="${cls}" style="--w:${f(wave(x))}s" cx="${x}" cy="${y}" r="3"/>`).join('') +
          '</g>',
      )
      .join('')
  const papers = Array.from({ length: 9 }, (_, i) => {
    const y = 110 + next() * 640

    return (
      `<g class="rh-pp" style="--d:${f(0.05 + i * 0.22)}s;--m:${f(-60 - next() * 140)}px;--e:${f(-120 + next() * 160)}px">` +
      `<rect class="rh-ps" x="-9" y="${f(y)}" width="${f(14 + next() * 8)}" height="${f(10 + next() * 5)}"/></g>`
    )
  }).join('')
  const gusts = Array.from({ length: 6 }, (_, i) => {
    const y = 140 + i * 110 + next() * 40

    return `<path class="rh-wd" pathLength="1" style="--d:${f(i * 0.23)}s" d="M-40 ${f(y)}C300 ${f(y - 60)} 600 ${f(y + 50)} 900 ${f(y - 20)}S1400 ${f(y - 70)} 1660 ${f(y - 30)}"/>`
  }).join('')

  // The near crosswalk, fanning out toward the viewer.
  let zebra = ''

  for (let x = -40; x < 1660; x += 92) {
    const a = 800 + (x - 800) * 1.0
    const b = 800 + (x - 800) * 1.16

    zebra += `M${f(a)} 906H${f(a + 46)}L${f(b + 53)} 1000H${f(b)}z`
  }


  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#05060a',
      furniture: '#23252e',
      metal: '#2a2d38',
      paper: '#e6e2d8',
      light: { idle: '#5f86c0', work: '#a9cdff', bright: '#e3f1ff' },
      headTop: 214,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // A flat commuter cap, its bill toward the screen, ending above the eyes; a shirt collar and a tie below them.
          '<g class="rh-cap"><path d="M64 250C62 228 98 212 150 212C200 212 230 224 236 240L262 245C267 247 266 253 260 253H236L64 252Z" fill="#3a3530" stroke="#544b42" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M65 243H235V251H65Z" fill="#27231f"/><path d="M98 222C132 215 176 215 206 224" fill="none" stroke="#544b42" stroke-width="2"/>' +
          '<circle cx="150" cy="212" r="4" fill="#27231f"/></g>' +
          '<path d="M133 319L150 330L167 319L162 317L150 324L138 317Z" fill="#e8e6e0"/>' +
          '<path d="M145.5 323H154.5L153 331H147Z" fill="#c22f38"/><path d="M147 331H153L157 346L150 352L143 346Z" fill="#c22f38"/>' +
          '<path d="M147.5 336L155 342M146 343L153 349" stroke="#2a0c10" stroke-opacity=".6" stroke-width="1.6"/>',
      },
      seatArt:
        // A concrete bollard with reflective bands.
        '<path d="M108 352V452Q151 461 194 452V352Z" fill="#30323a"/>' +
        '<path d="M108 378Q151 386 194 378V390Q151 398 108 390Z" fill="#c8404a" fill-opacity=".8"/>' +
        '<path d="M108 404Q151 412 194 404V410Q151 418 108 410Z" fill="#e8eaee" fill-opacity=".4"/>' +
        '<ellipse cx="151" cy="352" rx="43" ry="7" fill="#454852"/>',
      tableArt:
        // A striped road barricade for a desk, with its amber warning lamp.
        '<rect x="166" y="330" width="304" height="16" rx="2" fill="#a29e96"/>' +
        `<path d="${stripes(172, 466, 330, 16)}" fill="#b3363c"/>` +
        '<path d="M232 346L220 456M248 346L260 456M432 346L420 456M448 346L460 456" stroke="#2a2c34" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="226" y="388" width="230" height="12" rx="2" fill="#8e8a83"/>' +
        `<path d="${stripes(230, 452, 388, 12)}" fill="#a3323a"/>` +
        '<rect x="452" y="318" width="14" height="12" rx="3" fill="#2a2c34"/>' +
        `<circle class="rh-bk" cx="459" cy="317" r="15" fill="${AMBER}" fill-opacity=".18"/><circle class="rh-bk" cx="459" cy="317" r="6" fill="${AMBER}"/>`,
    },
    style:
      '@keyframes rh-on{from{opacity:0}to{opacity:1}}@keyframes rh-off{from{opacity:1}to{opacity:0}}' +
      '@keyframes rh-amb{0%,80%{opacity:1}100%{opacity:0}}@keyframes rh-blink{0%,100%{opacity:.1}50%{opacity:1}}' +
      // The signals: green for the traffic and red for walkers while waiting; run turns them; error leaves them blinking
      // amber; done turns them all green, one after another out from the island.
      '.rh-lr,.rh-la,.rh-pg{opacity:0}' +
      '.st-run .rh-lg{animation:rh-off .12s linear .05s both}.st-run .rh-la{animation:rh-amb .4s linear .05s both}' +
      '.st-run .rh-lr{animation:rh-on .15s ease-out .4s both}' +
      '.st-run .rh-pr{animation:rh-off .12s linear .42s both}.st-run .rh-pg{animation:rh-on .15s ease-out .45s both}' +
      '.st-error .rh-lg{opacity:0}.st-error .rh-la{animation:rh-blink 1s ease-in-out infinite}' +
      '.st-error .rh-pr{animation:rh-blink 1s ease-in-out -.5s infinite}' +
      '.st-done .rh-lr,.st-done .rh-pr{animation:rh-off .3s ease-out var(--w) both}' +
      '.st-done .rh-lg,.st-done .rh-pg{animation:rh-on .35s ease-out var(--w) both}' +
      // The giant screens.
      '.rh-sb{animation:rh-xf 12s ease-in-out infinite}@keyframes rh-xf{0%,42%{opacity:0}50%,92%{opacity:1}100%{opacity:0}}' +
      '.rh-srun,.rh-serr,.rh-sdone,.rh-sthk,.rh-rG,.rh-rR{opacity:0}' +
      '.st-run .rh-srun,.st-run .rh-rG{animation:rh-on .3s ease-out .4s both}' +
      '.st-error .rh-serr,.st-error .rh-rR{animation:rh-on .25s ease-out .1s both}' +
      '.st-done .rh-sdone,.st-done .rh-rG{animation:rh-on .4s ease-out .2s both}' +
      '.st-thinking .rh-sthk{animation:rh-on .8s ease-out both}' +
      '.rh-chv{opacity:.25}.st-run .rh-chv{animation:rh-chv .9s ease-in-out infinite}@keyframes rh-chv{0%,100%{opacity:.2}40%{opacity:1}}' +
      '.st-error .rh-glt{animation:rh-glt 1s steps(2) infinite}@keyframes rh-glt{to{transform:translateX(30px)}}' +
      '.rh-ring{transform-box:fill-box;transform-origin:center}.st-done .rh-ring{animation:rh-ring .7s cubic-bezier(.3,1.4,.5,1) .25s both}' +
      '@keyframes rh-ring{from{transform:scale(.3)}to{transform:scale(1)}}' +
      '.rh-load{transform-box:fill-box;transform-origin:center;animation:mv-spin 1.4s linear infinite}' +
      '.rh-wr{animation:rh-wr .8s linear infinite}@keyframes rh-wr{to{stroke-dashoffset:-18}}' +
      '.rh-tk{animation:rh-tk 10s linear infinite}@keyframes rh-tk{to{transform:translateX(-360px)}}' +
      '.st-read .rh-tk,.st-tool .rh-tk{animation-duration:3.4s}' +
      // The city: the aviation light, the commuter train, the clouds.
      '.rh-av{animation:rh-blink 2.8s ease-in-out infinite}' +
      '.rh-tr{animation:rh-tr 26s linear -9s infinite}@keyframes rh-tr{from{transform:translateX(-560px)}to{transform:translateX(1720px)}}' +
      '.st-web .rh-tr{animation-duration:8s}' +
      '.rh-cl{animation:rh-cl 60s ease-in-out infinite alternate}@keyframes rh-cl{to{transform:translateX(40px)}}' +
      // Traffic rolls through while the walkers wait; on run it queues at the stop line, brake lights on.
      '.rh-va{animation:rh-dA 11s linear var(--d) infinite}@keyframes rh-dA{from{transform:translateX(-140px)}to{transform:translateX(1740px)}}' +
      '.rh-vb{animation:rh-dB 15s linear var(--d) infinite}@keyframes rh-dB{from{transform:translateX(1860px)}to{transform:translateX(-280px)}}' +
      '.st-responding .rh-va{animation-duration:7.5s}.st-responding .rh-vb{animation-duration:10s}' +
      '.st-run .rh-va{animation:rh-qA 1.2s cubic-bezier(.2,.7,.3,1) both}' +
      '@keyframes rh-qA{from{transform:translateX(calc(var(--q) - 320px))}to{transform:translateX(var(--q))}}' +
      '.st-run .rh-vb{visibility:hidden}.rh-tl{opacity:.5}.st-run .rh-tl{opacity:1}' +
      // The crowd: it sways while waiting, surges across on run, leans into the gust on error, parts on done.
      '.rh-c,.rh-st,.rh-u{transform-box:fill-box;transform-origin:50% 100%}' +
      '.rh-st{animation:rh-sway 3.4s ease-in-out infinite alternate}@keyframes rh-sway{to{transform:translateY(-1.5px)}}' +
      '.st-run .rh-c{animation:rh-walk 5s cubic-bezier(.45,.05,.55,1) .45s both}' +
      '@keyframes rh-walk{to{transform:translate(var(--wx),var(--wy,0px)) scale(var(--ws,1))}}' +
      '.st-run .rh-st{animation:rh-step .42s ease-in-out infinite alternate}@keyframes rh-step{from{transform:translateY(1px)}to{transform:translateY(-3px)}}' +
      '.st-error .rh-st{animation:rh-lean 1.2s ease-in-out infinite alternate}@keyframes rh-lean{from{transform:skewX(3deg)}to{transform:skewX(8deg)}}' +
      '.st-done .rh-c{animation:rh-part 2.4s cubic-bezier(.3,.6,.3,1) .1s both}@keyframes rh-part{to{transform:translateX(var(--px))}}' +
      '.rh-u{stroke:#ffb59e;stroke-opacity:.3;stroke-width:1.3px;vector-effect:non-scaling-stroke}' +
      '.st-error .rh-u{animation:rh-flip .35s cubic-bezier(.3,1.5,.5,1) var(--fd) both,rh-flap .4s ease-in-out calc(var(--fd) + .35s) infinite alternate}' +
      '@keyframes rh-flip{from{transform:none}to{transform:scaleY(-.7) rotate(9deg)}}' +
      '@keyframes rh-flap{from{transform:scaleY(-.7) rotate(9deg)}to{transform:scaleY(-.5) rotate(16deg)}}' +
      '.st-error .rh-ur{animation-name:rh-rflip,rh-rflap}@keyframes rh-rflip{from{transform:none}to{transform:scaleY(-.7) skewX(-12deg)}}' +
      '@keyframes rh-rflap{from{transform:scaleY(-.7) skewX(-12deg)}to{transform:scaleY(-.5) skewX(-20deg)}}' +
      // Rain, the gust's papers and wind, the green sweep of done.
      '.rh-rn{transform-origin:800px 500px}.st-error .rh-rn{transform:skewX(-14deg)}' +
      '.st-done .rh-rn{animation:rh-fade 2.5s ease-out both}@keyframes rh-fade{to{opacity:.2}}' +
      '.rh-pp{opacity:0}.st-error .rh-pp{animation:rh-fly 2.2s linear var(--d) infinite}' +
      '@keyframes rh-fly{0%{opacity:0;transform:translate(-80px,0)}8%,90%{opacity:.6}50%{transform:translate(800px,var(--m))}100%{opacity:0;transform:translate(1760px,var(--e))}}' +
      '.rh-ps{transform-box:fill-box;transform-origin:center}.st-error .rh-ps{animation:mv-spin .8s linear infinite}' +
      '.rh-wd{opacity:0;fill:none;stroke:#dfe6f2;stroke-width:2;stroke-dasharray:.3 .7}' +
      '.st-error .rh-wd{animation:rh-wd 1.4s linear var(--d) infinite}' +
      '@keyframes rh-wd{0%{opacity:0;stroke-dashoffset:1}20%,80%{opacity:.3}100%{opacity:0;stroke-dashoffset:-.4}}' +
      '.rh-sw{opacity:0}.st-done .rh-sw{animation:rh-sw 2s ease-in-out .2s both}' +
      '@keyframes rh-sw{0%{opacity:0;transform:translateX(1500px)}15%,80%{opacity:1}100%{opacity:0;transform:translateX(-600px)}}' +
      // The desk: the barricade lamp, the coffee's steam, the cap the gust lifts and done tips.
      '.rh-bk{animation:rh-bk 1.6s steps(1) infinite}@keyframes rh-bk{50%{opacity:.15}}.st-error .rh-bk{animation-duration:.7s}' +
      '.rh-stm{stroke-dasharray:.3 .7;animation:rh-stm 3s linear infinite}.rh-s2{animation-delay:-1.5s}' +
      '.rh-s{opacity:0}.rh-stm{opacity:1}@keyframes rh-stm{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.rh-cap{transform-box:fill-box;transform-origin:85% 100%}' +
      '.st-error .rh-cap{animation:rh-cap .45s ease-in-out infinite alternate}' +
      '@keyframes rh-cap{from{transform:translate(4px,-8px) rotate(6deg)}to{transform:translate(8px,-18px) rotate(14deg)}}' +
      '.st-done .rh-cap{animation:rh-tip 1.1s ease-in-out .3s 2}@keyframes rh-tip{0%,100%{transform:none}35%,65%{transform:translateY(-14px) rotate(-6deg)}}' +
      '.rh-btn{opacity:.25}.st-run .rh-btn{animation:rh-on .2s ease-out both}',
    scenery:
      '<defs>' +
      '<linearGradient id="rh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060b"/><stop offset=".42" stop-color="#0c0c18"/><stop offset=".66" stop-color="#22122a"/><stop offset=".86" stop-color="#3e1a26"/><stop offset="1" stop-color="#55222a"/></linearGradient>' +
      '<radialGradient id="rh-sun"><stop offset="0" stop-color="#ff8a50" stop-opacity=".34"/><stop offset=".5" stop-color="#ff5c5c" stop-opacity=".12"/><stop offset="1" stop-color="#ff5c5c" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rh-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0c11"/><stop offset="1" stop-color="#111219"/></linearGradient>' +
      '<linearGradient id="rh-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3028" stop-opacity=".45"/><stop offset="1" stop-color="#6a3028" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rh-shop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb070" stop-opacity="0"/><stop offset="1" stop-color="#ffb070" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="rh-zb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#d8dbe4" stop-opacity=".2"/><stop offset=".27" stop-color="#d8dbe4" stop-opacity=".15"/><stop offset=".37" stop-color="#d8dbe4" stop-opacity=".05"/><stop offset=".63" stop-color="#d8dbe4" stop-opacity=".05"/><stop offset=".73" stop-color="#d8dbe4" stop-opacity=".15"/><stop offset="1" stop-color="#d8dbe4" stop-opacity=".2"/></linearGradient>' +
      [
        ['rh-kR', RED, 0.32],
        ['rh-kA', AMBER, 0.3],
        ['rh-kG', GREEN, 0.3],
      ]
        .map(([id, c, o]) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`)
        .join('') +
      [
        ['rh-gR', RED, 0.6],
        ['rh-gA', AMBER, 0.6],
        ['rh-gG', GREEN, 0.6],
        ['rh-rV', '#e0803a', 0.3],
        ['rh-rG', GREEN, 0.32],
        ['rh-rR', RED, 0.3],
      ]
        .map(([id, c, o]) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset=".35" stop-color="${c}" stop-opacity="${Number(o) / 3}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`)
        .join('') +
      '<linearGradient id="rh-adA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1030"/><stop offset=".55" stop-color="#6a1c30"/><stop offset="1" stop-color="#b0452e"/></linearGradient>' +
      '<radialGradient id="rh-orb"><stop offset="0" stop-color="#ffd8a0" stop-opacity=".85"/><stop offset=".45" stop-color="#ff9a5a" stop-opacity=".55"/><stop offset="1" stop-color="#ff5c5c" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rh-adB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#062630"/><stop offset="1" stop-color="#0e4a54"/></linearGradient>' +
      '<linearGradient id="rh-wx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a34"/><stop offset="1" stop-color="#1a3358"/></linearGradient>' +
      '<radialGradient id="rh-halo"><stop offset="0" stop-color="#ff8a5a" stop-opacity=".2"/><stop offset="1" stop-color="#ff8a5a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rh-hb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff0c8" stop-opacity=".28"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rh-swg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#52e08a" stop-opacity="0"/><stop offset=".5" stop-color="#52e08a" stop-opacity=".3"/><stop offset="1" stop-color="#52e08a" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="rh-twc"><path d="${towerPath}"/></clipPath>` +
      '<clipPath id="rh-tkc"><rect x="40" y="306" width="340" height="20"/></clipPath>' +
      '</defs>' +
      // The dusk sky, the sun gone down at the end of the avenue, a few lit clouds.
      '<rect width="1600" height="620" fill="url(#rh-sky)"/>' +
      '<ellipse cx="800" cy="600" rx="640" ry="210" fill="url(#rh-sun)"/>' +
      `<g class="rh-cl">${clouds}</g>` +
      // The far towers with their lit windows, one with an aviation light.
      `<path d="${towerPath}" fill="#0a0b14"/><path d="M618 170V132" stroke="#0a0b14" stroke-width="3"/>` +
      '<circle class="rh-av" cx="618" cy="130" r="3" fill="#ff5c5c"/>' +
      '<g clip-path="url(#rh-twc)">' +
      lit(rows(178, 590, 18, 392, 1226, 0, 3), '5 23 5 51 5 9 5 37', '#ffc98a', 0.3, 6) +
      lit(rows(178, 590, 18, 392, 1226, 1, 3), '5 9 5 65 5 23 5 23', '#ffd9a8', 0.24, 6) +
      lit(rows(178, 590, 18, 392, 1226, 2, 3), '5 37 5 9 5 79', '#bcd6ff', 0.18, 6) +
      '</g>' +
      // The commuter train on its viaduct.
      '<g class="rh-tr"><path d="M0 472h120v22H0zM126 472h120v22h-120zM252 472h120v22h-120zM378 472h110q14 0 18 22h-128z" fill="#15161e"/>' +
      '<path d="M6 481H114M132 481H240M258 481H366M384 481H486" stroke="#ffd9a0" stroke-opacity=".4" stroke-width="7" stroke-dasharray="10 5"/></g>' +
      '<path d="M380 494H1220V508H380Z" fill="#08090e"/>' +
      '<path d="M440 508V600M600 508V600M760 508V600M920 508V600M1080 508V600" stroke="#08090e" stroke-width="16"/>' +
      '<rect x="380" y="560" width="840" height="40" fill="url(#rh-shop)" fill-opacity=".5"/>' +
      // The corner tower at the left: its giant screen, the ticker under it, windows, the shops at its foot.
      '<path d="M-40 600V40H40V-10H300V40H420V600Z" fill="#0c0d14"/><path d="M-40 40H420" stroke="#1e202a" stroke-width="3"/>' +
      lit(rows(352, 512, 16, -30, 404, 0, 3), '8 24 8 56 8 8 8 40', '#ffcf8a', 0.42, 9) +
      lit(rows(352, 512, 16, -30, 404, 1, 3), '8 40 8 8 8 72', '#ffcf8a', 0.32, 9) +
      lit(rows(352, 512, 16, -30, 404, 2, 3), '8 88 8 24', '#cfe4ff', 0.24, 9) +
      '<ellipse cx="210" cy="180" rx="320" ry="230" fill="url(#rh-halo)"/>' +
      '<rect x="32" y="52" width="356" height="256" rx="4" fill="#06070a" stroke="#22242d" stroke-width="3"/>' +
      '<rect x="40" y="60" width="340" height="240" fill="url(#rh-adA)"/>' +
      '<circle cx="128" cy="182" r="104" fill="url(#rh-orb)"/><circle cx="128" cy="182" r="46" fill="#ffc690" fill-opacity=".72"/>' +
      '<circle cx="128" cy="182" r="66" fill="none" stroke="#ffd0a8" stroke-opacity=".3" stroke-width="2"/>' +
      script(232, 112, 130, 4, 34, 13, '#fff1e6', '#5a1a2a', next) +
      '<rect x="40" y="276" width="340" height="24" fill="#ff5c5c" fill-opacity=".5"/>' +
      script(56, 288, 200, 1, 0, 8, '#2a0a10', '#c04a4a', next) +
      '<g class="rh-sb"><rect x="40" y="60" width="340" height="240" fill="url(#rh-adB)"/>' +
      '<path d="M40 236C120 176 180 262 260 204S350 158 380 176V300H40Z" fill="#5ad8d0" fill-opacity=".32"/>' +
      '<circle cx="306" cy="118" r="34" fill="none" stroke="#bff4ee" stroke-opacity=".7" stroke-width="10"/>' +
      script(66, 104, 170, 3, 30, 14, '#e6fffb', '#0b3a42', next) +
      '</g>' +
      panels(40, 60, 340, 240, false) +
      '<rect x="40" y="306" width="340" height="20" fill="#16080c"/>' +
      '<g clip-path="url(#rh-tkc)"><g class="rh-tk"><path d="M40 316H760" stroke="#ff5c5c" stroke-opacity=".85" stroke-width="10" stroke-dasharray="8 3 5 3 10 6 4 3 7 11"/>' +
      '<path d="M40 314H760" stroke="#16080c" stroke-width="3" stroke-dasharray="3 7 2 9 4 15"/></g></g>' +
      '<rect x="-40" y="524" width="460" height="10" fill="#1a1316"/><rect x="-40" y="534" width="460" height="66" fill="url(#rh-shop)"/>' +
      '<path d="M20 534V600M120 534V600M220 534V600M320 534V600" stroke="#0c0d14" stroke-width="6"/>' +
      // The tower at the right, pinned to the right edge: windows above, a giant weather screen, shops below.
      '<g class="mv-r"><path d="M1186 600V56H1290V8H1560V56H1640V600Z" fill="#0c0d14"/><path d="M1186 56H1640" stroke="#1e202a" stroke-width="3"/>' +
      lit(rows(78, 252, 16, 1206, 1630, 0, 3), '8 40 8 24 8 8 8 56', '#ffcf8a', 0.4, 9) +
      lit(rows(78, 252, 16, 1206, 1630, 1, 3), '8 8 8 72 8 40', '#ffcf8a', 0.3, 9) +
      lit(rows(78, 252, 16, 1206, 1630, 2, 3), '8 56 8 88', '#cfe4ff', 0.24, 9) +
      '<ellipse cx="1391" cy="370" rx="300" ry="190" fill="url(#rh-halo)"/>' +
      '<rect x="1218" y="272" width="346" height="196" rx="4" fill="#06070a" stroke="#22242d" stroke-width="3"/>' +
      '<rect x="1226" y="280" width="330" height="180" fill="url(#rh-wx)"/>' +
      '<path d="M1272 384a24 24 0 0 1 6-46a32 32 0 0 1 60-8a24 24 0 0 1 22 54z" fill="#cfe0f4" fill-opacity=".8"/>' +
      '<path class="rh-wr" d="M1290 396l-7 20M1310 396l-7 20M1330 396l-7 20M1350 396l-7 20" stroke="#8fc0ff" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 10"/>' +
      script(1404, 318, 128, 1, 0, 22, '#e8f2ff', '#13284a', next) +
      script(1404, 362, 130, 3, 24, 10, '#a8c8f0', '#13284a', next) +
      panels(1226, 280, 330, 180, true) +
      '<rect x="1186" y="524" width="454" height="10" fill="#1a1316"/><rect x="1186" y="534" width="454" height="66" fill="url(#rh-shop)"/>' +
      '<path d="M1250 534V600M1350 534V600M1450 534V600M1550 534V600" stroke="#0c0d14" stroke-width="6"/></g>' +
      // The road: the far sidewalk, the wet asphalt and its sheen, the screens reflected, the crosswalks.
      '<rect y="598" width="1600" height="14" fill="#121319"/><path d="M0 611H1600" stroke="#24262f" stroke-width="2"/>' +
      '<rect y="612" width="1600" height="388" fill="url(#rh-road)"/><rect y="612" width="1600" height="70" fill="url(#rh-sh)"/>' +
      '<path d="M150 627H1450" stroke="url(#rh-zb)" stroke-width="26" stroke-dasharray="22 18"/>' +
      '<path d="M250 662L1350 882M1350 662L250 882" stroke="url(#rh-zb)" stroke-width="58" stroke-dasharray="14 17"/>' +
      `<path d="${zebra}" fill="url(#rh-zb)"/>` +
      // The left sidewalk the near crowd waits on, and the right one past the island.
      '<path d="M-40 700H430L350 1000H-40Z" fill="#111219"/><path d="M-40 700H430L350 1000" fill="none" stroke="#2c2e38" stroke-width="3"/>' +
      '<g class="mv-r"><path d="M1170 702H1640V762H1150Z" fill="#111219"/><path d="M1170 702H1640M1170 702L1150 762" fill="none" stroke="#2c2e38" stroke-width="3"/></g>' +
      // The giant screens reflected in the wet street, in the colour they show.
      ['rh-rV', 'rh-rG', 'rh-rR'].map((id, i) => `<ellipse${i ? ` class="${id}"` : ''} cx="210" cy="700" rx="200" ry="190" fill="url(#${id})"/>`).join('') +
      `<g class="mv-r">${['rh-rV', 'rh-rG', 'rh-rR'].map((id, i) => `<ellipse${i ? ` class="${id}"` : ''} cx="1391" cy="690" rx="190" ry="170" fill="url(#${id})"/>`).join('')}</g>` +
      // The far walk signals and the far crowd.
      farSignals +
      farA +
      farB +
      farC1 +
      farC2 +
      laneA +
      midL +
      `<g class="mv-r">${midR}</g>` +
      laneB +
      nearL +
      // The mast arm over the left of the crossing: two signals and a walk signal on the pole.
      `<path d="M14 1000V368h10V1000zM24 368H440v6H24z" fill="${POLE}"/><path d="M24 420L170 374" stroke="${POLE}" stroke-width="5"/>` +
      head(210, 388) +
      head(366, 388) +
      `<rect x="26" y="520" width="26" height="56" rx="3" fill="${BOX}" stroke="${BOX_EDGE}" stroke-width="2"/>` +
      `<path transform="translate(39 546)" d="${STAND}" fill="#2a1416"/><path transform="translate(39 572)" d="${WALK}" fill="#12241a"/>` +
      walker('rh-pr', 39, 546, 1, STAND, RED, 'rh-gR', wave(39)) +
      walker('rh-pg', 39, 572, 1, WALK, GREEN, 'rh-gG', wave(39)) +
      // Drizzle, the gust, the green wave sweeping the road.
      `<g class="rh-rn">${rain({ seed: 54, count: 22, length: [18, 34], slant: 140, seconds: 1.1, stroke: '#b8c4dc', opacity: 0.15 })}</g>` +
      gusts +
      `<g fill="#ddd8cc">${papers}</g>` +
      '<rect class="rh-sw" x="0" y="612" width="460" height="388" fill="url(#rh-swg)"/>',
    nook:
      // The traffic island: its paving, the striped curb along its nose, a keep-left bollard.
      '<path d="M-90 456C-70 432 -30 420 20 418H430V456Z" fill="#17181f"/>' +
      '<path d="M-90 456C-70 432 -30 420 20 418H430" fill="none" stroke="#0a0b0e" stroke-width="8"/>' +
      '<path d="M-90 456C-70 432 -30 420 20 418H430" fill="none" stroke="#d6a52a" stroke-opacity=".6" stroke-width="8" stroke-dasharray="12 12"/>' +
      '<rect x="16" y="384" width="12" height="44" fill="#2a2c34"/>' +
      '<circle cx="22" cy="370" r="15" fill="#2a5ab0" fill-opacity=".6" stroke="#d8dce6" stroke-opacity=".7" stroke-width="2"/>' +
      '<path d="M28 364L16 376M16 368V376H24" fill="none" stroke="#e8ecf4" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      // The signal pole that rises from the island: the traffic signal at its top, the walk signal and its button.
      `<rect x="400" y="-214" width="9" height="636" fill="${POLE}"/>` +
      `<rect x="390" y="-206" width="29" height="88" rx="6" fill="${BOX}" stroke="${BOX_EDGE}" stroke-width="2"/>` +
      '<g fill="#1c1e24"><circle cx="404.5" cy="-186" r="9"/><circle cx="404.5" cy="-162" r="9"/><circle cx="404.5" cy="-138" r="9"/></g>' +
      lamp('rh-lr', 404.5, -186, 9, RED, 'rh-gR', 0.2, 38) +
      lamp('rh-la', 404.5, -162, 9, AMBER, 'rh-gA', 0.2, 38) +
      lamp('rh-lg', 404.5, -138, 9, GREEN, 'rh-gG', 0.2, 38) +
      `<rect x="374" y="116" width="28" height="60" rx="4" fill="${BOX}" stroke="${BOX_EDGE}" stroke-width="2"/>` +
      `<path transform="translate(388 143)scale(.9)" d="${STAND}" fill="#2a1416"/><path transform="translate(388 170)scale(.9)" d="${WALK}" fill="#12241a"/>` +
      walker('rh-pr', 388, 143, 0.9, STAND, RED, 'rh-gR', 0.25) +
      walker('rh-pg', 388, 170, 0.9, WALK, GREEN, 'rh-gG', 0.25) +
      '<rect x="394" y="252" width="20" height="26" rx="3" fill="#1a1c22" stroke="#33363f" stroke-width="1.5"/>' +
      `<circle class="rh-btn" cx="404" cy="262" r="3.5" fill="${AMBER}"/>`,
  }
}
