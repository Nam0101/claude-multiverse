import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Ocean Liner: a grand four-funnel liner steams at night across a glassy, ice-strewn sea under a sky full of stars,
// a huge iceberg looming on the left. Claude is the wireless operator in a cutaway cabin at the desk corner, cap and
// headphones on, tapping a telegraph key beside a spark-gap set. A command makes the funnels puff and the wake
// stream; an error slides the iceberg close and ice scrapes past the cabin; done steams clear under two soft flares.
const GOLD = '#e8c27a'
const BRASS = '#b08a48'
const WOOD = '#2a1810'
const WOOD_TOP = '#3a2416'
const WOOD_EDGE = '#4e301c'
const PAPER = '#e9dfc8'
const LAMP = '#ffd890'

type Pt = readonly [number, number]

/** Many small marks as one path of short strokes `w` long: drawn with a stroke as wide as each mark is tall. */
function dots(points: readonly Pt[], w: number): string {
  return points.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h${w}`).join('')
}

/** A four-pointed glint around (x, y). */
function glint(x: number, y: number, r: number): string {
  const s = r * 0.22

  return `M${f(x)} ${f(y - r)}L${f(x + s)} ${f(y - s)}L${f(x + r)} ${f(y)}L${f(x + s)} ${f(y + s)}L${f(x)} ${f(y + r)}L${f(x - s)} ${f(y + s)}L${f(x - r)} ${f(y)}L${f(x - s)} ${f(y - s)}Z`
}

/** A flat floe of sea ice seen from low over the water. */
function floe(x: number, y: number, w: number, next: () => number): { body: string; edge: string } {
  const h = w * (0.16 + next() * 0.08)
  const pts = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2
    const r = 0.75 + next() * 0.35

    return `${Math.round(x + Math.cos(a) * w * 0.5 * r)} ${Math.round(y + Math.sin(a) * h * 0.5 * r)}`
  })

  return { body: `M${pts.join('L')}Z`, edge: `M${f(x - w * 0.4)} ${f(y - h * 0.25)}L${f(x + w * 0.3)} ${f(y - h * 0.4)}` }
}

// The iceberg, around the middle of its waterline (180, 600): its outline and its faces, lit from the upper left by
// the stars, the right flank in shadow with a faint warm rim from the liner's lights.
const BERG =
  'M-270 0L-244 -74L-210 -112L-188 -180L-158 -228L-132 -282L-104 -338L-76 -386L-52 -440L-20 -502L4 -474L24 -430L50 -440' +
  'L74 -402L106 -368L138 -378L164 -344L190 -288L216 -212L240 -130L272 0Z'
const FACES: readonly (readonly [string, string])[] = [
  ['M-60 -250L-30 -330L10 -300L40 -330L110 -260L130 -240L120 0L-150 0L-110 -150Z', '#203850'],
  ['M-20 -502L-52 -440L-76 -386L-30 -330Z', '#5c829e'],
  ['M-76 -386L-104 -338L-132 -282L-60 -250L-30 -330Z', '#44677f'],
  ['M-132 -282L-158 -228L-188 -180L-110 -150L-60 -250Z', '#37586f'],
  ['M-188 -180L-210 -112L-244 -74L-270 0L-150 0L-110 -150Z', '#2a465c'],
  ['M-20 -502L4 -474L24 -430L10 -300L-30 -330Z', '#1c3248'],
  ['M24 -430L50 -440L74 -402L40 -330L10 -300Z', '#4a6c84'],
  ['M74 -402L106 -368L138 -378L110 -260L40 -330Z', '#2e4c62'],
  ['M138 -378L164 -344L130 -240L110 -260Z', '#41637a'],
  ['M164 -344L190 -288L216 -212L240 -130L272 0L120 0L130 -240Z', '#15273b'],
]
const RIDGE = 'M-188 -180L-158 -228L-132 -282L-104 -338L-76 -386L-52 -440L-20 -502L4 -474L24 -430L50 -440L74 -402L106 -368L138 -378L164 -344'

// The liner, from its bow at the waterline (0, 0) back to the stern at x 590; its stern waterline (556, 0) sits at
// picture (1560, 566) and it is drawn 1.15 times its own size from there.
const STERN_X = 1560
const SHIP_Y = 566
const SHIP_SCALE = 1.15
// Lights left of this (in the ship's own x) sit inside the chat column and burn dimmer.
const IN_COLUMN = 556 - (STERN_X - 1180) / SHIP_SCALE
const FUNNELS = [130, 250, 370, 490]
const AERIAL = 'M46 -276Q302 -260 558 -272'

/**
 * The early wireless set: a mahogany cabinet with lit dials, a spark gap and a tuning coil on top, a telegraph key.
 * Portals and other universes' bands draw it without this world's style, so whatever rests hidden or turned says so
 * in its own attributes; the style only animates it.
 */
function device(light: string, activity: Activity): string {
  const marks =
    activity === 'thinking'
      ? [0, 1, 2, 3, 4, 5]
          .map(i => {
            const style = `--mx:${f((i % 3) * 14 - 14)}px;--my:-190px;animation-delay:${f(-i * 0.5)}s`
            const x = 266 + (i % 3) * 14

            return i % 2
              ? `<rect class="ol-mk" style="${style}" x="${x}" y="292" width="11" height="4" rx="2" fill="${GOLD}" opacity="0"/>`
              : `<circle class="ol-mk" style="${style}" cx="${x + 4}" cy="294" r="2.6" fill="${GOLD}" opacity="0"/>`
          })
          .join('')
      : ''

  return (
    // The telegraph key on its board; the lever rocks on its pivot.
    `<rect x="238" y="321" width="60" height="9" rx="2" fill="${WOOD_TOP}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
    `<rect x="268" y="312" width="6" height="10" fill="${BRASS}"/><circle cx="292" cy="318" r="3" fill="#6a5230"/>` +
    `<g transform="translate(271 313)"><g class="ol-key"><path d="M-25 -1L23 -5V-1L-25 3Z" fill="${BRASS}"/>` +
    '<ellipse cx="-25" cy="-3" rx="8" ry="4" fill="#0e0b08" stroke="#3a2c20"/></g></g>' +
    // The headphone cord, down to the set.
    '<path d="M240 280C252 304 270 288 292 298" fill="none" stroke="#120e0a" stroke-width="2.4"/>' +
    // The cabinet and its black panel: two dials, a lamp, three knobs.
    `<rect x="292" y="244" width="88" height="86" rx="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
    '<rect x="298" y="252" width="76" height="60" rx="2" fill="#0d0a08" stroke="#3a2618" stroke-width="1.5"/>' +
    `<g fill="${light}" fill-opacity=".3" stroke="${BRASS}" stroke-width="2.5"><circle cx="316" cy="272" r="11"/><circle cx="354" cy="272" r="11"/></g>` +
    [316, 354]
      .map((x, i) => `<g transform="translate(${x} 272)"><g class="ol-dial" transform="rotate(-24)"${i ? ' style="animation-delay:-.7s"' : ''}><path d="M0 0V-9" stroke="#f4e6c0" stroke-width="2"/></g></g>`)
      .join('') +
    `<circle cx="335" cy="298" r="5" fill="${light}"/><circle cx="335" cy="298" r="9" fill="${light}" fill-opacity=".22"/>` +
    `<g fill="${BRASS}"><circle cx="308" cy="300" r="3.5"/><circle cx="362" cy="300" r="3.5"/><circle cx="350" cy="300" r="2.6"/></g>` +
    `<path d="M296 318H376" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
    // The spark gap: two brass balls on posts, a small spark that crackles between them while a command runs.
    '<rect x="304" y="236" width="56" height="8" rx="2" fill="#0d0a08" stroke="#3a2618"/>' +
    `<path d="M312 236V215M352 236V215M312 216H322M352 216H342" fill="none" stroke="${BRASS}" stroke-width="2.6"/>` +
    `<g fill="#d8b46a"><circle cx="326" cy="216" r="5"/><circle cx="338" cy="216" r="5"/></g>` +
    '<g class="ol-spk" opacity="0"><circle cx="332" cy="216" r="10" fill="#d4ccff" fill-opacity=".28"/>' +
    '<path d="M330 212L334 215L330 218L334 221" fill="none" stroke="#f4f0ff" stroke-width="1.6"/></g>' +
    // The tuning coil, its copper winding and slider.
    '<rect x="364" y="204" width="13" height="32" rx="2" fill="#2e2016"/>' +
    `<path d="${Array.from({ length: 9 }, (_, i) => `M364 ${207 + i * 3.2}l13 2`).join('')}" stroke="#c87a3a" stroke-width="1.3"/>` +
    `<path d="M381 202V238" stroke="${BRASS}" stroke-width="2"/><rect x="377" y="214" width="8" height="6" rx="1" fill="${BRASS}"/>` +
    marks
  )
}

export function oceanLinerWorld(): World {
  const next = random(1912)

  // Stars: fewer and fainter over the chat column, two twinkling sets and a still one, a few bright glints.
  const stars: Pt[][] = [[], [], []]

  for (let i = 0; i < 230; i += 1) {
    const x = next() * 1600
    const y = next() * 540
    const inColumn = x > 420 && x < 1180

    if (inColumn && next() < 0.45) {
      continue
    }

    stars[inColumn ? 2 : i % 2]!.push([x, y])
  }

  const band: Pt[] = Array.from({ length: 70 }, (): Pt => {
    const u = next()
    const x = -60 + u * 1720
    const y = 330 - u * 420 + (next() - 0.5) * 70

    return [x, y]
  }).filter(([x]) => x < 420 || x > 1180)
  const bright: Pt[] = [
    [70, 52],
    [300, 34],
    [1236, 44],
    [1352, 168],
    [1478, 36],
    [1566, 226],
    [1120, 120],
  ]

  // The sea: ripples, the stars' reflections, floes thicker near the iceberg.
  const ripples = Array.from({ length: 28 }, () => {
    const y = 560 + next() * 430
    const x = -40 + next() * 1640

    return `M${f(x)} ${f(y)}h${f(40 + next() * 140)}`
  }).join('')
  const glints: Pt[] = Array.from({ length: 44 }, (): Pt => [next() * 1600, 556 + next() * 300])
  const floes = { near: '', nearEdge: '', far: '' }

  for (let i = 0; i < 14; i += 1) {
    const one = floe(-40 + next() * 500, 620 + next() * 360, 30 + next() * 60, next)

    floes.near += one.body
    floes.nearEdge += one.edge
  }

  for (let i = 0; i < 9; i += 1) {
    floes.far += floe(470 + next() * 640, 566 + next() * 300, 14 + next() * 28, next).body
  }

  // The liner's lights: three rows of portholes, the promenade and boat-deck windows, the bridge.
  const lit: Pt[] = []
  const dim: Pt[] = []
  const blink: Pt[] = []
  const place = (p: Pt, on: number) => {
    const r = next()

    if (r > on) {
      return
    }

    ;(p[0] < IN_COLUMN ? dim : r < 0.06 ? blink : lit).push(p)
  }

  for (const y of [-20, -32, -44]) {
    for (let x = 14; x < 552; x += 8) {
      place([x, y], 0.6)
    }
  }

  const deck: Pt[] = []
  const deckDim: Pt[] = []

  for (let x = 44; x < 552; x += 7) {
    if (next() < 0.72) {
      ;(x < IN_COLUMN ? deckDim : deck).push([x, -82])
    }
  }

  for (let x = 80; x < 516; x += 9) {
    if (next() < 0.66 && !FUNNELS.some(c => Math.abs(x - c) < 16)) {
      ;(x < IN_COLUMN ? deckDim : deck).push([x, -97])
    }
  }

  const boats = [118, 146, 180, 212, 268, 300, 332, 388, 420, 452, 506]
    .map(x => `M${x} -106h14a2.5 2.5 0 0 1 0 5h-14a2.5 2.5 0 0 1 0 -5z`)
    .join('')
  const davits = [118, 146, 180, 212, 268, 300, 332, 388, 420, 452, 506].map(x => `M${x - 1} -101v-6M${x + 15} -101v-6`).join('')
  const reflections = (from: number, to: number) =>
    Array.from({ length: Math.round((to - from) / 13) }, (_, i) => `M${f(from + i * 13 + next() * 6)} 6v${f(10 + next() * 46)}`).join('')

  // The funnels as single paths: slate bodies, rims, dark slate tops, an invented gold band, steam pipes.
  const funnelBody = FUNNELS.map(c => `M${c - 14} -100L${c + 4} -226H${c + 32}L${c + 14} -100Z`).join('')
  const funnelRim = FUNNELS.map(c => `M${c - 13} -100L${c + 2} -212`).join('')
  const funnelTop = FUNNELS.map(c => `M${c + 2.3} -214L${c + 4} -226H${c + 32}L${c + 30.3} -214Z`).join('')
  const funnelBand = FUNNELS.map(c => `M${c + 0.6} -202L${c + 1.1} -206H${c + 29.1}L${c + 28.6} -202Z`).join('')
  const funnelPipe = FUNNELS.map(c => `M${c - 19} -100L${c - 4} -208`).join('')
  const plumes = FUNNELS.map(
    (c, i) =>
      `<g class="ol-plume ol-pl" style="animation-delay:${f(-i * 1.6)}s">` +
      [0, 1, 2, 3]
        .map(k => `<ellipse cx="${f(c + 44 + k * 40)}" cy="${f(-240 - k * 28)}" rx="${22 + k * 14}" ry="${12 + k * 8}" fill="url(#ol-smk)" fill-opacity="${f(0.95 - k * 0.18)}"/>`)
        .join('') +
      '</g>',
  ).join('')
  const puffs = FUNNELS.map(c =>
    [0, 1, 2].map(k => `<circle class="ol-puff" style="animation-delay:${f(-k * 0.5 - c / 400)}s" cx="${c + 18}" cy="-236" r="20" fill="url(#ol-pf)"/>`).join(''),
  ).join('')
  // Dots and dashes leaving the aerial while Claude thinks; rings when it sends.
  const aerialMarks = [100, 190, 280, 370, 460, 520]
    .map((x, i) => {
      const style = `--mx:${f((next() - 0.5) * 30)}px;--my:-120px;animation-delay:${f(-i * 0.55)}s`

      return i % 2
        ? `<rect class="ol-mk" style="${style}" x="${x}" y="-278" width="15" height="5" rx="2.5" fill="${GOLD}"/>`
        : `<circle class="ol-mk" style="${style}" cx="${x}" cy="-276" r="3.6" fill="${GOLD}"/>`
    })
    .join('')
  const rings = [0, 0.8, 1.6].map(d => `<circle class="ol-rw" style="animation-delay:${-d}s" cx="302" cy="-268" r="24" fill="none" stroke="${GOLD}" stroke-width="1.6"/>`).join('')

  // Two flares for the done beat: each rises from the deck, then bursts into a slow ring of sparks.
  const flares = (
    [
      [300, -100, -14, -179, 0.3],
      [470, -100, 26, -205, 0.8],
    ] as const
  )
    .map(([x, y, fx, fy, d]) => {
      const burst = d + 1.15
      const sparks = Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2 + 0.3
        const r = 46 + (k % 2) * 20

        return `<circle class="ol-bu" style="--bx:${f(Math.cos(a) * r)}px;--by:${f(Math.sin(a) * r + 30)}px;--d:${f(burst)}s" r="3" fill="#fff1c8"/>`
      }).join('')

      return (
        `<g transform="translate(${x} ${y})"><g class="ol-fl" style="--fx:${fx}px;--fy:${fy}px;--d:${d}s">` +
        '<path d="M0 2V30" stroke="#ffe6b0" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>' +
        '<circle r="30" fill="url(#ol-flg)"/><circle r="4" fill="#fff6dc"/></g></g>' +
        `<g transform="translate(${x + fx} ${y + fy})"><circle class="ol-bg" style="--d:${f(burst)}s" r="76" fill="url(#ol-flg)"/>${sparks}</g>`
      )
    })
    .join('')

  // The berg's pieces that break away and splash while the scrape goes on.
  const calves = (
    [
      [196, -236, 34, 236, 0.25, 14],
      [222, -168, 26, 168, 0.45, 11],
      [176, -300, 46, 300, 0.6, 10],
      [236, -110, 22, 110, 0.35, 8],
      [150, -350, 60, 350, 0.15, 9],
    ] as const
  )
    .map(
      ([x, y, cx, cy, d, s]) =>
        `<path class="ol-cv" style="--cx:${cx}px;--cy:${cy}px;--d:${d}s" d="M${x - s} ${y}L${x - s * 0.2} ${y - s}L${x + s} ${y - s * 0.3}L${x + s * 0.6} ${y + s * 0.8}L${x - s * 0.5} ${y + s * 0.7}Z" fill="#9fc2d8"/>` +
        `<ellipse class="ol-spl" style="--d:${f(d + 1.15)}s" cx="${x + cx}" cy="2" rx="${s * 3}" ry="${f(s * 0.7)}" fill="none" stroke="#cfe4f0" stroke-opacity=".7" stroke-width="1.6"/>`,
    )
    .join('')

  // Ice falling past the cabin's open side on the error beat, and crystals spraying off the porthole.
  const ice = (
    [
      [-24, 40, 10, 404, 200, 0.15, 1.6],
      [-4, 18, -6, 428, -160, 0.35, 1.3],
      [22, 60, 14, 386, 120, 0.55, 1.1],
      [-36, 12, 28, 438, 90, 0.75, 1],
      [6, 30, 4, 412, -120, 0.95, 1.2],
      [392, 30, -10, 418, -220, 0.25, 1.6],
      [414, 52, 6, 398, 180, 0.5, 1.2],
      [370, 72, -18, 378, 150, 0.85, 1],
      [404, 16, 8, 424, 240, 1, 1.3],
    ] as const
  )
    .map(
      ([x, y, ix, iy, ir, d, s]) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path class="ol-ice" style="--ix:${f(ix / s)}px;--iy:${f(iy / s)}px;--ib:${f((iy - 14) / s)}px;--ir:${ir}deg;--d:${d}s" ` +
        'd="M-7 -4L1 -9L8 -3L6 6L-3 7L-9 1Z" fill="#d6eaf4" fill-opacity=".92" stroke="#8fb0c8" stroke-width="1.2"/></g>',
    )
    .join('')
  const crystals = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * (0.15 + (i / 9) * 0.95)
    const r = 40 + next() * 50

    return `<path class="ol-cry" style="--kx:${f(Math.cos(a) * r * 1.2)}px;--ky:${f(Math.sin(a) * r)}px;--d:${f(0.3 + i * 0.04)}s" d="${glint(318, 140, 3)}" fill="#eef8ff"/>`
  }).join('')
  const rivets: Pt[] = [
    ...Array.from({ length: 36 }, (_, i): Pt => [-54 + i * 14, 75]),
    ...Array.from({ length: 26 }, (_, i): Pt => [-52, 94 + i * 14]),
  ]

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'keys',
      cup: 'tea',
      thought: 'none',
      ink: '#04060a',
      furniture: WOOD,
      metal: '#3a2c20',
      paper: PAPER,
      light: { idle: '#a8823f', work: GOLD, bright: '#fff0c8' },
      headTop: 198,
      glowAt: [335, 280],
      device,
      wear: {
        front:
          // An officer's cap: navy crown, black band with a gold strap, the coral starburst badge, the peak toward
          // the set. Radio headphones over it, the earpieces at the sides, clear of the eyes.
          '<path d="M72 236L60 216C62 205 100 197 150 197C200 197 238 205 240 216L228 236Z" fill="#141d33" stroke="#2a3654" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M66 211C92 204 208 204 234 211" fill="none" stroke="#3a4a6e" stroke-width="2"/>' +
          '<rect x="72" y="234" width="156" height="15" fill="#090c14"/>' +
          `<path d="M76 245H222" stroke="${GOLD}" stroke-width="2.4"/><circle cx="222" cy="245" r="2.6" fill="${GOLD}"/>` +
          `<path d="M198 236Q204 244 212 244M222 236Q216 244 210 244" fill="none" stroke="${GOLD}" stroke-width="2"/>` +
          `<path d="${glint(210, 226, 9)}" fill="#d97757"/><path d="${glint(210, 226, 6)}" fill="#d97757" transform="rotate(45 210 226)"/>` +
          '<path d="M220 243L264 246C264 252 254 256 222 252Z" fill="#05070b" stroke="#1e2638" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<path d="M228 247L258 248" stroke="#3a4560" stroke-width="1.4"/>' +
          '<path d="M60 260C48 164 252 164 240 260" fill="none" stroke="#5e5a52" stroke-width="4"/>' +
          `<g fill="#14110e" stroke="${BRASS}" stroke-width="2.5"><circle cx="60" cy="270" r="11"/><circle cx="240" cy="270" r="11"/></g>` +
          '<g fill="#2a241c"><circle cx="60" cy="270" r="4"/><circle cx="240" cy="270" r="4"/></g>',
      },
      seatArt:
        // A bentwood swivel chair.
        `<path d="M56 352V282C56 264 66 255 82 253" fill="none" stroke="${WOOD_TOP}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M70 352V292" stroke="${WOOD}" stroke-width="5"/>` +
        `<ellipse cx="148" cy="352" rx="50" ry="7" fill="${WOOD_TOP}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<rect x="104" y="353" width="88" height="8" rx="3" fill="${WOOD}"/>` +
        `<rect x="143" y="360" width="10" height="52" fill="#1e140c"/><rect x="138" y="406" width="20" height="8" rx="2" fill="${BRASS}" fill-opacity=".6"/>` +
        `<path d="M148 414L104 450M148 414L192 450M148 414V452" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>` +
        '<g fill="#0e0a07"><circle cx="102" cy="452" r="4.5"/><circle cx="194" cy="452" r="4.5"/><circle cx="148" cy="454" r="4.5"/></g>',
      tableArt:
        // A mahogany desk: a turned leg on the left, a drawer pedestal with brass pulls on the right.
        `<rect x="164" y="330" width="308" height="12" rx="2" fill="${WOOD_TOP}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        `<path d="M168 332H468" stroke="${GOLD}" stroke-opacity=".2" stroke-width="1.5"/>` +
        `<path d="M178 342H194L190 372L196 396L190 456H182L176 396L182 372Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        `<rect x="372" y="342" width="96" height="114" fill="#24150d" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        `<path d="M372 380H468M372 418H468" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        `<g fill="${BRASS}" fill-opacity=".75"><rect x="410" y="358" width="20" height="4" rx="2"/><rect x="410" y="396" width="20" height="4" rx="2"/><rect x="410" y="434" width="20" height="4" rx="2"/></g>`,
    },
    style:
      // Ambient: stars twinkle, a meteor now and then, the sea glints, smoke drifts, foam slides along the hull.
      '.ol-tw1{animation:ol-tw 3.6s ease-in-out infinite alternate}.ol-tw2{animation:ol-tw 2.8s ease-in-out -1.4s infinite alternate}' +
      '@keyframes ol-tw{from{opacity:.35}to{opacity:1}}' +
      '.ol-gl{transform-box:fill-box;transform-origin:center;animation:ol-gl 4.6s ease-in-out infinite}' +
      '@keyframes ol-gl{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:.9;transform:scale(1)}}' +
      '.ol-shoot{opacity:0;animation:ol-shoot 13s linear 2s infinite}' +
      '@keyframes ol-shoot{0%,91%{opacity:0;transform:translate(0,0)}92%{opacity:.8}97%,100%{opacity:0;transform:translate(-140px,56px)}}' +
      '.ol-mw{opacity:.7}.ultra .ol-mw{opacity:1}.st-done .ol-mw{animation:ol-on 3s ease-out both}@keyframes ol-on{to{opacity:1}}' +
      '.ol-rip{animation:ol-rip 14s ease-in-out infinite alternate}@keyframes ol-rip{to{transform:translateX(18px)}}' +
      '.ol-floe{animation:ol-floe 7s ease-in-out infinite alternate}@keyframes ol-floe{to{transform:translateY(3px)}}' +
      '.ol-drift{animation:ol-drift 26s ease-in-out infinite alternate}@keyframes ol-drift{to{transform:translateX(8px)}}' +
      '.ol-bob{animation:ol-bob 7s ease-in-out infinite alternate}@keyframes ol-bob{from{transform:translateY(-1.2px)}to{transform:translateY(1.2px)}}' +
      '.ol-plume{animation:ol-plume 6s ease-in-out infinite alternate}@keyframes ol-plume{from{transform:translate(-4px,2px)}to{transform:translate(8px,-4px)}}' +
      '.ol-foam{opacity:.55;stroke-dasharray:14 22;animation:ol-foam 3.2s linear infinite}@keyframes ol-foam{to{stroke-dashoffset:-36}}' +
      '.ol-kel{opacity:.5}' +
      '.ol-shim{animation:ol-shim 2.6s ease-in-out infinite alternate}@keyframes ol-shim{from{opacity:.55}to{opacity:1}}' +
      '.ol-win{animation:ol-win 9s steps(1) infinite}@keyframes ol-win{0%,40%{opacity:1}41%,70%{opacity:.15}71%{opacity:1}}' +
      '.ol-sec{animation:mv-spin 60s steps(60) infinite}' +
      // The telegraph key sends a word in dots and dashes: slow while thinking, quick while answering.
      '.ol-key{transform:rotate(0)}' +
      '.st-thinking .ol-key{animation:ol-morse 2.4s steps(1,end) infinite}.st-responding .ol-key{animation:ol-morse 1.1s steps(1,end) infinite}' +
      '.st-tool .ol-key,.st-web .ol-key{animation:ol-morse 1.5s steps(1,end) infinite}.st-sleeping .ol-key{animation:none}' +
      '@keyframes ol-morse{0%{transform:rotate(-6deg)}4%{transform:rotate(0)}8%{transform:rotate(-6deg)}12%{transform:rotate(0)}16%{transform:rotate(-6deg)}' +
      '30%{transform:rotate(0)}34%{transform:rotate(-6deg)}48%{transform:rotate(0)}56%{transform:rotate(-6deg)}60%,100%{transform:rotate(0)}}' +
      '.ol-mk{opacity:0}.st-thinking .ol-mk{animation:ol-mk 3s ease-out infinite}' +
      '@keyframes ol-mk{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(var(--mx),var(--my))}}' +
      '.ol-wr{animation:ol-tw 1.6s ease-in-out infinite alternate}' +
      // Sending: rings off the aerial; on the web a far ship's lamp blinks back over the horizon.
      '.ol-rw{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-responding .ol-rw,.helper .ol-rw{animation:ol-rw 2.4s ease-out infinite}.st-web .ol-rw{--rs:5;animation:ol-rw 1.4s ease-out infinite}' +
      '@keyframes ol-rw{0%{opacity:0;transform:scale(.4)}15%{opacity:.6}100%{opacity:0;transform:scale(var(--rs,3.4))}}' +
      '.ol-lamp{opacity:0}.st-web .ol-lamp{animation:ol-lamp 2s steps(1,end) infinite}' +
      '@keyframes ol-lamp{0%{opacity:.9}10%{opacity:0}20%{opacity:.9}45%{opacity:0}60%{opacity:.9}70%{opacity:0}}' +
      // Tools: the dials swing, a pulse runs up the lead-in and along the aerial, the gap sparks now and then.
      '.st-tool .ol-dial,.st-run .ol-dial{animation:ol-dial 1.6s ease-in-out infinite alternate}' +
      '@keyframes ol-dial{from{transform:rotate(-55deg)}to{transform:rotate(60deg)}}' +
      '.ol-pulse{opacity:0;stroke-dasharray:10 150}.st-tool .ol-pulse,.st-run .ol-pulse,.st-web .ol-pulse{opacity:.9;animation:ol-pulse 1.1s linear infinite}' +
      '@keyframes ol-pulse{from{stroke-dashoffset:160}to{stroke-dashoffset:0}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the spark is tiny and lights at most twice a second.
      '.ol-spk{opacity:0}.st-run .ol-spk{animation:ol-spk 1s steps(1,end) infinite}.st-tool .ol-spk{animation:ol-spk 1.7s steps(1,end) infinite}' +
      '@keyframes ol-spk{0%{opacity:.95}12%{opacity:0}50%{opacity:.75}60%{opacity:0}}' +
      // Reading: the top message slip on the clipboard lifts and falls.
      '.ol-slip{transform-box:fill-box;transform-origin:50% 0}.st-read .ol-slip{animation:ol-slip 1.1s ease-in-out infinite alternate}@keyframes ol-slip{to{transform:scaleY(-.5)}}' +
      // Run: the funnels puff, the wake streams, the bow wave builds, the liner gathers way.
      '.ol-puff{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .ol-puff{animation:ol-puff 1.8s ease-out infinite}' +
      '.st-done .ol-puff{animation:ol-puff 2.8s ease-out infinite}' +
      '@keyframes ol-puff{0%{opacity:0;transform:translate(0,0) scale(.5)}12%{opacity:1}100%{opacity:0;transform:translate(90px,-150px) scale(3.2)}}' +
      '.ol-pl{opacity:.75}.st-run .ol-pl{opacity:1}' +
      '.ol-wake{opacity:0}.st-run .ol-wake{animation:ol-wake 1.2s ease-out both}.st-done .ol-wake{animation:ol-wake 2s ease-out both}' +
      '@keyframes ol-wake{from{opacity:0}to{opacity:1}}' +
      '.st-run .ol-foam{opacity:1;animation-duration:.8s}.st-responding .ol-foam,.st-done .ol-foam{animation-duration:1.6s}.st-run .ol-kel{opacity:1}' +
      '.ol-bw{transform-box:fill-box;transform-origin:0 100%}.st-run .ol-bw{animation:ol-bw .9s ease-in-out infinite alternate}@keyframes ol-bw{from{transform:scale(1.4,1.3)}to{transform:scale(2.1,1.9)}}' +
      '.st-run .ol-sail{animation:ol-surge 3.2s ease-out both}@keyframes ol-surge{to{transform:translateX(-28px)}}' +
      '.st-sleeping .ol-lit{opacity:.55}' +
      // Error: the iceberg slides close, ice breaks off it, the liner judders and rights itself at once;
      // in the cabin a wall of ice grinds past the porthole and chunks of it tumble down the open side.
      '.st-error .ol-berg{animation:ol-loom 1.6s cubic-bezier(.3,.1,.3,1) both}@keyframes ol-loom{to{transform:translateX(120px) scale(1.1)}}' +
      '.ol-cv,.ol-spl,.ol-ice,.ol-cry{opacity:0}' +
      '.ol-cv,.ol-ice{transform-box:fill-box;transform-origin:center}.ol-spl,.ol-cry{transform-box:fill-box;transform-origin:center}' +
      '.st-error .ol-cv{animation:ol-cv 1.2s ease-in var(--d) both}' +
      '@keyframes ol-cv{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}90%{opacity:1;transform:translate(var(--cx),var(--cy)) rotate(140deg)}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(150deg)}}' +
      '.st-error .ol-spl{animation:ol-spl 1.2s ease-out var(--d) both}@keyframes ol-spl{0%{opacity:0;transform:scale(.2)}20%{opacity:.8}100%{opacity:0;transform:scale(1.8)}}' +
      '.st-error .ol-sail{animation:ol-list 2.4s ease-out both}' +
      '@keyframes ol-list{0%,60%,100%{transform:translateX(0) rotate(0)}8%{transform:translateX(3px) rotate(0)}16%{transform:translateX(-2px) rotate(.3deg)}' +
      '26%{transform:translateX(2px) rotate(-.3deg)}38%{transform:translateX(-1px) rotate(.15deg)}50%{transform:translateX(0) rotate(-.08deg)}}' +
      '.st-error .ol-room{animation:ol-shake .7s ease-out both}' +
      '@keyframes ol-shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-3px,1px)}30%{transform:translate(3px,-1px)}45%{transform:translate(-2px,1px)}60%{transform:translate(2px,0)}80%{transform:translate(-1px,0)}}' +
      '.ol-scr{transform:translateX(-80px)}.st-error .ol-scr{animation:ol-scr 2.2s ease-in-out .15s both}' +
      '@keyframes ol-scr{0%{transform:translateX(-80px)}25%{transform:translateX(-8px)}100%{transform:translateX(92px)}}' +
      '.st-error .ol-lr{animation:ol-swing 2.4s ease-out both}' +
      '@keyframes ol-swing{0%,100%{transform:rotate(0)}12%{transform:rotate(16deg)}30%{transform:rotate(-11deg)}50%{transform:rotate(7deg)}70%{transform:rotate(-4deg)}}' +
      '.st-error .ol-ice{animation:ol-ice 1.5s cubic-bezier(.5,0,.9,.6) var(--d) both}' +
      '@keyframes ol-ice{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:.95}72%{transform:translate(var(--ix),var(--iy)) rotate(var(--ir))}' +
      '84%{transform:translate(var(--ix),var(--ib)) rotate(var(--ir))}94%,100%{opacity:.9;transform:translate(var(--ix),var(--iy)) rotate(var(--ir))}}' +
      '.st-error .ol-cry{animation:ol-cry 1s ease-out var(--d) both}' +
      '@keyframes ol-cry{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.95}100%{opacity:0;transform:translate(var(--kx),var(--ky)) scale(1)}}' +
      // Done: the iceberg falls astern into the haze, the liner steams clear, two soft flares rise and burst.
      '.st-done .ol-berg{animation:ol-recede 3.4s ease-in-out both}@keyframes ol-recede{to{transform:translate(-70px,4px) scale(.9);opacity:.75}}' +
      '.st-done .ol-sail{animation:ol-clear 3.4s ease-in-out both}@keyframes ol-clear{to{transform:translateX(-36px)}}' +
      '.ol-dg,.ol-frf,.ol-pfl{opacity:0}.st-done .ol-dg{animation:ol-on 2.4s ease-out .4s both}' +
      '.st-done .ol-frf{animation:ol-frf 2.4s ease-out 1.6s both}@keyframes ol-frf{0%{opacity:0}30%{opacity:1}100%{opacity:.5}}' +
      '.st-done .ol-pfl{animation:ol-frf 2.4s ease-out 1.5s both}' +
      '.ol-fl,.ol-bu,.ol-bg{opacity:0}.ol-bg{transform-box:fill-box;transform-origin:center}' +
      '.st-done .ol-fl{animation:ol-fl 1.3s cubic-bezier(.2,.7,.4,1) var(--d) both}' +
      '@keyframes ol-fl{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}88%{opacity:1;transform:translate(var(--fx),var(--fy))}100%{opacity:0;transform:translate(var(--fx),var(--fy))}}' +
      '.st-done .ol-bu{animation:ol-bu 2.6s ease-out var(--d) both}' +
      '@keyframes ol-bu{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--bx),var(--by))}}' +
      '.st-done .ol-bg{animation:ol-bg 2.6s ease-out var(--d) both}@keyframes ol-bg{0%{opacity:0;transform:scale(.3)}14%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ol-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070d"/><stop offset=".5" stop-color="#070d18"/><stop offset=".86" stop-color="#0c1626"/><stop offset="1" stop-color="#132236"/></linearGradient>' +
      '<linearGradient id="ol-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3350" stop-opacity="0"/><stop offset="1" stop-color="#1c3350" stop-opacity=".35"/></linearGradient>' +
      '<linearGradient id="ol-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1828"/><stop offset=".3" stop-color="#08111e"/><stop offset="1" stop-color="#04070d"/></linearGradient>' +
      '<radialGradient id="ol-mwg"><stop offset="0" stop-color="#a8b8d8" stop-opacity=".1"/><stop offset="1" stop-color="#a8b8d8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ol-uw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7090" stop-opacity=".26"/><stop offset="1" stop-color="#3d7090" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ol-mist"><stop offset="0" stop-color="#a8c8e0" stop-opacity=".16"/><stop offset="1" stop-color="#a8c8e0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ol-smk"><stop offset="0" stop-color="#6c7484" stop-opacity=".42"/><stop offset=".6" stop-color="#4c5464" stop-opacity=".2"/><stop offset="1" stop-color="#4c5464" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ol-pf"><stop offset="0" stop-color="#a4acba" stop-opacity=".62"/><stop offset=".55" stop-color="#7a8290" stop-opacity=".3"/><stop offset="1" stop-color="#7a8290" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ol-dgl"><stop offset="0" stop-color="#ffd890" stop-opacity=".2"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ol-halo"><stop offset="0" stop-color="#ffcf80" stop-opacity=".1"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ol-flg"><stop offset="0" stop-color="#fff4d0" stop-opacity=".7"/><stop offset=".35" stop-color="#ffd890" stop-opacity=".3"/><stop offset="1" stop-color="#ffc060" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The night sky, the Milky Way, the stars.
      '<rect width="1600" height="560" fill="url(#ol-sky)"/><rect y="440" width="1600" height="110" fill="url(#ol-hz)"/>' +
      '<g class="ol-mw"><ellipse cx="800" cy="170" rx="980" ry="80" fill="url(#ol-mwg)" transform="rotate(-14 800 170)"/>' +
      '<ellipse cx="760" cy="180" rx="700" ry="30" fill="url(#ol-mwg)" transform="rotate(-14 800 170)"/>' +
      `<path d="${dots(band, 1.6)}" stroke="#c8d4ec" stroke-opacity=".45" stroke-width="1.6"/></g>` +
      `<path class="ol-tw1" d="${dots(stars[0]!, 2.6)}" stroke="#e4ecff" stroke-width="2.6"/><path class="ol-tw2" d="${dots(stars[1]!, 2.2)}" stroke="#cddcff" stroke-width="2.2"/>` +
      `<path d="${dots(stars[2]!, 1.6)}" stroke="#c8d4ec" stroke-opacity=".5" stroke-width="1.6"/>` +
      bright.map(([x, y], i) => `<path class="ol-gl" style="animation-delay:${f(-i * 0.7)}s" d="${glint(x, y, x > 420 && x < 1180 ? 4 : 7)}" fill="#f2f6ff"/>`).join('') +
      '<g transform="translate(392 44)"><g class="ol-shoot"><path d="M0 0L-34 13" stroke="#eef4ff" stroke-width="1.6" stroke-linecap="round"/></g></g>' +
      // The sea: glassy and still, ripples and starlight on it, floes of ice, a far ship's lamp on the horizon.
      '<rect y="548" width="1600" height="452" fill="url(#ol-sea)"/><path d="M0 548H1600" stroke="#2a4262" stroke-opacity=".5" stroke-width="1.2"/>' +
      `<path class="ol-rip" d="${ripples}" stroke="#3a5a7c" stroke-opacity=".22" stroke-width="1.2"/>` +
      `<path class="ol-tw2" d="${dots(glints, 6)}" stroke="#cfe0ff" stroke-opacity=".3" stroke-width="1.2"/>` +
      `<g class="ol-floe"><path d="${floes.far}" fill="#3a5670" fill-opacity=".28"/><path d="${floes.near}" fill="#5f8098" fill-opacity=".55"/>` +
      `<path d="${floes.nearEdge}" stroke="#b4d2e4" stroke-opacity=".4" stroke-width="1.4"/></g>` +
      '<rect x="628" y="545" width="22" height="3" fill="#0d1624"/><g class="ol-lamp"><circle cx="644" cy="544" r="6" fill="#ffe8b0" fill-opacity=".22"/><circle cx="644" cy="544" r="1.8" fill="#ffe8b0"/></g>' +
      // The iceberg: a ghostly mass under the water, the faces above it, ridges catching starlight, the mist at
      // its foot. It looms closer on an error and falls back on done.
      '<g class="ol-drift"><g transform="translate(180 600)"><g class="ol-berg">' +
      '<path d="M-270 0L-330 110L-300 230L-120 320L120 300L330 190L370 80L272 0Z" fill="url(#ol-uw)"/>' +
      `<path d="${BERG}" fill="#122236"/>` +
      FACES.map(([d, c]) => `<path d="${d}" fill="${c}"/>`).join('') +
      `<path d="${RIDGE}" fill="none" stroke="#b4d4e6" stroke-opacity=".5" stroke-width="2" stroke-linejoin="round"/>` +
      '<path d="M-30 -330L-60 -250L-110 -150L-150 0M10 -300L40 -330M110 -260L130 -240L120 0" fill="none" stroke="#8fb4cc" stroke-opacity=".18" stroke-width="1.5"/>' +
      `<path d="M164 -344L190 -288L216 -212L240 -130L272 0" fill="none" stroke="${GOLD}" stroke-opacity=".14" stroke-width="2.4"/>` +
      ([[-20, -502], [-104, -338], [50, -440], [138, -378], [-188, -180]] as const)
        .map(([x, y], i) => `<path class="ol-gl" style="animation-delay:${f(-i * 0.9)}s" d="${glint(x, y, 6)}" fill="#e8f6ff"/>`)
        .join('') +
      calves +
      '<path d="M-270 0H272" stroke="#9fc4da" stroke-opacity=".35" stroke-width="1.5"/><ellipse cx="0" cy="2" rx="380" ry="20" fill="url(#ol-mist)"/>' +
      '</g></g></g>' +
      // The liner, pinned with the desk to the right: it lists around its stern on an error.
      `<g class="mv-r"><g transform="translate(${STERN_X} ${SHIP_Y})"><g class="ol-sail"><g class="ol-bob"><g transform="scale(${SHIP_SCALE}) translate(-556 0)">` +
      '<ellipse cx="300" cy="-80" rx="340" ry="70" fill="url(#ol-halo)"/><ellipse class="ol-dg" cx="290" cy="-46" rx="330" ry="54" fill="url(#ol-dgl)"/>' +
      `<path class="ol-shim" d="${reflections(10, IN_COLUMN)}" stroke="${LAMP}" stroke-opacity=".08" stroke-width="2.4"/>` +
      `<path class="ol-shim" style="animation-delay:-1.3s" d="${reflections(IN_COLUMN, 556)}" stroke="${LAMP}" stroke-opacity=".16" stroke-width="2.4"/>` +
      plumes +
      puffs +
      // Masts, stays, the wireless aerial and its lead-in.
      '<path d="M36 -70L46 -286M548 -62L558 -282" stroke="#161a22" stroke-width="4"/><rect x="37" y="-200" width="10" height="8" fill="#161a22"/>' +
      `<path d="M46 -286L-14 -72M558 -282L586 -66" stroke="#222833" stroke-width="1.2"/>` +
      `<path d="${AERIAL}M46 -270Q302 -254 558 -266M190 -270L196 -100" fill="none" stroke="#7a705e" stroke-opacity=".55" stroke-width="1.1"/>` +
      `<path class="ol-pulse" d="${AERIAL}" fill="none" stroke="${GOLD}" stroke-width="2"/>` +
      '<circle class="ol-tw1" cx="44" cy="-238" r="2.4" fill="#fff4dc"/><circle cx="44" cy="-238" r="8" fill="#fff4dc" fill-opacity=".14"/>' +
      // The upperworks: promenade deck, boat-deck houses, the bridge, a row of lifeboats.
      '<rect x="40" y="-88" width="516" height="30" fill="#2b2925"/><rect x="72" y="-100" width="448" height="13" fill="#34322e"/>' +
      '<rect x="52" y="-110" width="44" height="23" fill="#3a3834"/><path d="M40 -100H560" stroke="#4a4842" stroke-width="1.4"/>' +
      `<path d="${boats}" fill="#8f8b80" fill-opacity=".55"/><path d="${davits}" stroke="#4a4842" stroke-width="1.2"/>` +
      `<path d="${funnelBody}" fill="#2a3240"/>` +
      `<path d="${funnelRim}" stroke="#5f6d84" stroke-opacity=".7" stroke-width="2"/><path d="${funnelPipe}" stroke="#1c222c" stroke-width="2"/>` +
      `<path d="${funnelTop}" fill="#171e2a"/><path d="${funnelBand}" fill="${GOLD}" fill-opacity=".7"/>` +
      // The hull: black, a dark red boot-top, the sheer line catching a little light.
      '<path d="M0 0L-14 -72Q140 -58 300 -58T586 -66Q594 -44 578 -22L556 0Z" fill="#05070b"/>' +
      '<path d="M1 -7H564L558 0H0Z" fill="#3a1612" fill-opacity=".8"/>' +
      '<path d="M-14 -72Q140 -58 300 -58T586 -66" fill="none" stroke="#4a5262" stroke-opacity=".6" stroke-width="1.6"/>' +
      `<g class="ol-lit" stroke="${LAMP}"><path d="${dots(lit, 2.4)}" stroke-opacity=".88" stroke-width="2.4"/><path d="${dots(deck, 3)}" stroke-opacity=".88" stroke-width="4"/>` +
      `<path d="${dots(dim, 2.4)}" stroke-opacity=".3" stroke-width="2.4"/><path d="${dots(deckDim, 3)}" stroke-opacity=".3" stroke-width="4"/>` +
      `<path class="ol-win" d="${dots(blink, 2.4)}" stroke-opacity=".88" stroke-width="2.4"/>` +
      `<path d="${dots([[58, -104], [65, -104], [72, -104], [79, -104], [86, -104]], 4)}" stroke-opacity=".45" stroke-width="3"/>` +
      `<rect class="ol-wr" x="192" y="-98" width="10" height="4" fill="${GOLD}"/></g>` +
      '<circle cx="54" cy="-100" r="2" fill="#ff5a48" fill-opacity=".85"/>' +
      // The water at the hull: bow wave, foam streaming aft, the bow's spreading wave line.
      '<path class="ol-wake" d="M-6 1Q24 -3 70 2H556Q640 4 720 12V20Q630 13 556 9H50Q10 9 -6 4Z" fill="#d8eaf4" fill-opacity=".38"/>' +
      '<path class="ol-bw" d="M-8 -3Q16 -14 54 -2Q24 3 -8 2Z" fill="#cfe2ee" fill-opacity=".5"/>' +
      '<path class="ol-foam" d="M6 2H556M30 5H556M556 3Q640 8 760 16" fill="none" stroke="#a8c8dc" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<path class="ol-kel" d="M2 4L170 44" stroke="#8fb0c8" stroke-opacity=".3" stroke-width="1.6"/>' +
      `<g class="ol-frf" fill="${LAMP}" fill-opacity=".3"><ellipse cx="286" cy="16" rx="44" ry="5"/><ellipse cx="496" cy="16" rx="44" ry="5"/></g>` +
      aerialMarks +
      rings +
      flares +
      '</g></g></g></g></g>',
    nook:
      '<defs><clipPath id="ol-pc"><circle cx="318" cy="140" r="25"/></clipPath>' +
      '<radialGradient id="ol-pgl"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="ol-room">' +
      // The wireless room, cut out of the ship: panelled walls, a pipe under the deckhead, the steel all round.
      '<rect x="-42" y="86" width="482" height="370" fill="#1a0f09"/>' +
      '<path d="M66 100V296M190 100V296M266 100V296M396 100V296M-42 100H440M-42 370H440M60 302V440M200 302V440M340 302V440" stroke="#26160d" stroke-width="3"/>' +
      '<rect x="-42" y="294" width="482" height="7" fill="#2e1c10"/><rect x="-42" y="440" width="482" height="16" fill="#120a06"/>' +
      '<rect x="-42" y="88" width="482" height="8" fill="#1e1915"/><path d="M20 86V98M140 86V98M260 86V98M380 86V98" stroke="#2e2822" stroke-width="5"/>' +
      '<path d="M-60 62H440V464H-60ZM-42 86V456H440V86Z" fill="#0b0e13" fill-rule="evenodd"/>' +
      '<path d="M-60 62H440" stroke="#4a3a28" stroke-opacity=".7" stroke-width="2"/>' +
      '<path d="M-42 456V86H440" fill="none" stroke="#323a46" stroke-width="2"/>' +
      `<path d="${dots(rivets, 2.4)}" stroke="#2c3440" stroke-width="2.4"/>` +
      // The porthole over the desk: night sea outside, an ice wall that grinds past on the error beat.
      '<g clip-path="url(#ol-pc)"><rect x="290" y="112" width="56" height="56" fill="#0c182a"/><rect x="290" y="146" width="56" height="22" fill="#060c16"/>' +
      `<path d="${dots([[304, 124], [326, 120], [336, 134], [312, 136]], 1.6)}" stroke="#dfe8ff" stroke-opacity=".8" stroke-width="1.6"/>` +
      '<path d="M296 152h10M318 156h14" stroke="#cfe0ff" stroke-opacity=".3" stroke-width="1.2"/>' +
      '<circle class="ol-pfl" cx="328" cy="126" r="30" fill="url(#ol-pgl)"/>' +
      '<g class="ol-scr"><path d="M280 180L286 126L300 106L314 118L324 100L340 116L352 180Z" fill="#bcd6e6" fill-opacity=".92"/>' +
      '<path d="M292 150L300 124M312 160L318 128M330 156L336 126" stroke="#ffffff" stroke-opacity=".55" stroke-width="1.6"/></g></g>' +
      `<circle cx="318" cy="140" r="29" fill="none" stroke="#8a6a36" stroke-width="8"/>` +
      `<path d="${dots(Array.from({ length: 8 }, (_, i): Pt => [317 + Math.cos(i * 0.785) * 29, 140 + Math.sin(i * 0.785) * 29]), 2.4)}" stroke="#d8b46a" stroke-opacity=".7" stroke-width="2.4"/>` +
      '<path d="M299 128A23 23 0 0 1 320 117" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="3"/>' +
      // The lead-in from the set up to the aerial, through a porcelain insulator.
      '<path d="M372 204C380 170 404 150 404 120" fill="none" stroke="#120e0a" stroke-width="4"/>' +
      `<path class="ol-pulse" d="M372 204C380 170 404 150 404 120" fill="none" stroke="${GOLD}" stroke-width="2.4"/>` +
      '<g fill="#b8ae98" fill-opacity=".6"><rect x="398" y="98" width="12" height="5" rx="2"/><rect x="396" y="104" width="16" height="5" rx="2"/><rect x="398" y="110" width="12" height="5" rx="2"/></g>' +
      // The ship's clock, its second hand ticking.
      `<circle cx="40" cy="132" r="17" fill="#d8ccb0" fill-opacity=".45" stroke="${BRASS}" stroke-width="3"/>` +
      '<path d="M40 132V121M40 132L47 136" stroke="#1a120c" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g transform="translate(40 132)"><g class="ol-sec"><path d="M0 3V-14" stroke="#8a2e24" stroke-width="1.2"/></g></g>' +
      // Message forms on a clipboard, marked in an invented hand.
      `<rect x="206" y="104" width="34" height="46" rx="2" fill="${WOOD_TOP}"/><rect x="210" y="110" width="26" height="36" fill="${PAPER}" fill-opacity=".55"/>` +
      '<path d="M213 118h18M213 124h12M213 130h16M213 136h9M213 142h14" stroke="#5a4a32" stroke-width="1.6" stroke-dasharray="3 2"/>' +
      `<rect class="ol-slip" x="210" y="110" width="26" height="14" fill="${PAPER}" fill-opacity=".7"/><rect x="217" y="101" width="12" height="5" rx="1" fill="${BRASS}"/>` +
      // A life ring on its hook.
      '<g transform="translate(-8 300)"><g class="ol-lr"><path d="M0 0V9" stroke="#3a2c20" stroke-width="2"/>' +
      '<circle cy="32" r="22" fill="none" stroke="#cfc6b4" stroke-opacity=".7" stroke-width="10"/>' +
      '<circle cy="32" r="22" fill="none" stroke="#8e2c22" stroke-width="10" stroke-dasharray="17.3 17.3"/>' +
      '<circle cy="32" r="28" fill="none" stroke="#8a7a5a" stroke-opacity=".45" stroke-width="1.6" stroke-dasharray="4 5"/></g></g>' +
      '</g>',
    front: ice + crystals,
  }
}
