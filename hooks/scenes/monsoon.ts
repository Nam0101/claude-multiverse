import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Monsoon: a ranger post in the rainforest on a monsoon night. Sheets of rain sweep across the jungle, a red dirt
// road runs off a little plank bridge over a swollen river, huge leaves bow under the downpour, and Claude works under
// a tarp in a poncho and a leaf hat. When a command runs a flash flood bursts over the bridge and surges down the
// road to the post; an error sags the tarp until it dumps its water by the desk and a big leaf slaps down; done
// stops the rain, and mist, frogs and fireflies come out.
const ACCENT = '#4fd18b'
const RAIN = '#c4e4d3'
const TARP = '#163533'
const TARP_HEM = '#2c5c55'
const BAMBOO = '#3a3416'
const BAMBOO_HI = '#5c5428'
const MUD_WATER = '#4a3c24'
const FOAM = '#cbbf9e'
const WOOD = '#1e150c'
const WOOD_EDGE = '#3a2a18'
const FROG = '#1c4a2c'

/** A number rounded to whole units, for the big repeated shapes where a tenth is invisible. */
const n = (value: number): string => String(Math.round(value))

// The road from the bridge to the foot of the picture, where the post is.
const ROAD = 'M418 705C520 703 640 724 770 780C900 836 1040 918 1180 1012L560 1012C548 930 522 822 472 760C454 738 438 724 418 721Z'
// The river bends in from the far left and runs toward the front, so its far reach lies flat like water does.
const RIVER =
  'M-80 604C60 602 230 604 320 612C380 620 408 664 404 720C400 772 382 812 380 860C378 912 354 952 340 1012L-240 1012L-60 860C10 800 64 760 120 724C176 690 214 660 206 642C196 632 60 630 -80 632Z'
// The banks as (y, x) stops, for the crests and rings that sit on the water.
const RIGHT_BANK = [[604, 300], [620, 352], [660, 398], [720, 404], [860, 380], [1012, 340]] as const
const LEFT_BANK = [[604, -80], [636, -80], [640, 204], [724, 120], [860, -60], [1012, -240]] as const

function bank(stops: readonly (readonly [number, number])[], y: number): number {
  for (let i = 1; i < stops.length; i += 1) {
    const [y0, x0] = stops[i - 1]!
    const [y1, x1] = stops[i]!

    if (y <= y1) {
      return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0)
    }
  }

  return stops[stops.length - 1]![1]
}

/** Wave crests across the river at these heights, wavier and wider toward the front. */
function crests(rows: readonly number[]): string {
  return rows
    .map(y => {
      const l = Math.max(-60, bank(LEFT_BANK, y)) + 8
      const w = bank(RIGHT_BANK, y) - 8 - l

      return `M${n(l)} ${y}q${n(w / 4)} ${n(-3 - (y - 600) / 60)} ${n(w / 2)} 0t${n(w / 2)} 0`
    })
    .join('')
}

/** A seamless layer of rain: the streaks twice, one picture-height apart, sliding down one height per loop. */
function downpour(seed: number, count: number, len: [number, number], slant: number, secs: number, stroke: string, opacity: number, width: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const x = -220 + next() * 2000
    const y = next() * 1000
    const l = len[0] + next() * (len[1] - len[0])

    d += `M${n(x)} ${n(y)}l${n((l * slant) / 1000)} ${n(l)}`
  }

  const dx = n(slant)

  return (
    `<g stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round" fill="none">` +
    `<g class="mo-fall" style="--fx:${dx}px;animation-duration:${secs}s"><path d="${d}"/><path d="${d}" transform="translate(-${dx} -1000)"/></g></g>`
  )
}

type Kind = 'banana' | 'ear'

/** A leaf pointing along +x from its stem at (0, 0), its tip `D` below the line: the outline and its ribs. */
function leafShape(kind: Kind, L: number, W: number, D: number): { outline: string; ribs: string } {
  if (kind === 'banana') {
    const top = `M0 0C${f(L * 0.15)} ${f(-W * 1.2)} ${f(L * 0.7)} ${f(-W * 1.05 + D * 0.4)} ${f(L)} ${f(D)}`
    const mid = (t: number) => 2 * (1 - t) * t * (-W * 0.15) + t * t * D
    let ribs = `M0 0Q${f(L * 0.5)} ${f(-W * 0.15)} ${f(L)} ${f(D)}`

    for (const t of [0.18, 0.32, 0.46, 0.6, 0.74]) {
      const reach = W * 0.62 * Math.pow(Math.sin(Math.PI * t), 0.7)

      ribs += `M${n(t * L)} ${n(mid(t))}l${n(L * 0.06)} ${n(-reach)}m${n(-L * 0.06)} ${n(reach)}l${n(L * 0.06)} ${n(reach * 0.92)}`
    }

    return { outline: `${top}C${f(L * 0.72)} ${f(W * 0.85 + D * 0.7)} ${f(L * 0.2)} ${f(W * 1.05)} 0 0Z`, ribs }
  }

  const top = `M0 0C${f(-L * 0.14)} ${f(-W * 0.5)} ${f(L * 0.04)} ${f(-W * 1.04)} ${f(L * 0.45)} ${f(-W * 0.9)}C${f(L * 0.75)} ${f(-W * 0.78)} ${f(L * 0.95)} ${f(-W * 0.25 + D)} ${f(L)} ${f(D)}`
  let ribs = `M0 0Q${f(L * 0.5)} ${f(D * 0.2)} ${f(L)} ${f(D)}`

  for (const [t, a] of [[0.12, 0.62], [0.3, 0.7], [0.5, 0.6], [0.7, 0.4]] as const) {
    ribs += `M${n(t * L)} ${n(t * t * D * 0.8)}q${n(L * 0.1)} ${n(-W * a * 0.5)} ${n(L * 0.2)} ${n(-W * a)}m${n(-L * 0.2)} ${n(W * a)}q${n(L * 0.1)} ${n(W * a * 0.5)} ${n(L * 0.2)} ${n(W * a)}`
  }

  return {
    outline: `${top}C${f(L * 0.9)} ${f(W * 0.35 + D)} ${f(L * 0.65)} ${f(W * 0.85)} ${f(L * 0.4)} ${f(W * 0.9)}C${f(L * 0.04)} ${f(W * 0.98)} ${f(-L * 0.14)} ${f(W * 0.5)} 0 0Z`,
    ribs,
  }
}

type Leaf = { x: number; y: number; a: number; m: boolean; kind: Kind; L: number; W: number; D: number; tone: 0 | 1; hit: number; sway: number }

/** A big leaf on its stem: it sways with the wind and dips each time a heavy drop hits it. */
function leaf(p: Leaf, delay: number): string {
  const s = leafShape(p.kind, p.L, p.W, p.D)

  return (
    `<g transform="translate(${p.x} ${p.y}) rotate(${p.a})${p.m ? ' scale(-1 1)' : ''}">` +
    `<g class="mo-sw" style="--s:${p.sway}s;animation-delay:${f(-delay * 1.7)}s"><g class="mo-hit" style="--h:${p.hit}s;animation-delay:${f(-delay)}s">` +
    `<path d="${s.outline}" fill="url(#mo-lf${p.tone})" stroke="#8fe0b4" stroke-opacity=".2" stroke-width="1.8"/>` +
    `<path d="${s.ribs}" fill="none" stroke="#04100a" stroke-opacity=".75" stroke-width="2.2"/></g></g></g>`
  )
}

/** Where a leaf's tip hangs in the picture, for the drop that falls from it. */
function tipOf(p: Leaf): [number, number] {
  const a = (p.a * Math.PI) / 180
  const lx = p.m ? -p.L : p.L

  return [p.x + lx * Math.cos(a) - p.D * Math.sin(a), p.y + lx * Math.sin(a) + p.D * Math.cos(a)]
}

/** A palm's crown: every frond's midrib and its hanging leaflets in one path. */
function fronds(): string {
  let d = ''

  for (const [deg, len, droop] of [[198, 190, 60], [222, 210, 40], [248, 180, 20], [282, 170, 20], [312, 200, 34], [340, 210, 60], [8, 190, 80], [168, 170, 90]] as const) {
    const a = (deg * Math.PI) / 180
    const ex = len * Math.cos(a)
    const ey = len * Math.sin(a) + droop
    const cx = len * 0.5 * Math.cos(a)
    const cy = len * 0.5 * Math.sin(a) - len * 0.18
    const side = Math.cos(a) < 0 ? -1 : 1

    d += `M0 0Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`

    for (let t = 0.2; t <= 1; t += 0.16) {
      const px = 2 * (1 - t) * t * cx + t * t * ex
      const py = 2 * (1 - t) * t * cy + t * t * ey
      const drop = 30 * (1 - t * 0.55)

      d += `M${n(px)} ${n(py)}l${n(side * 7)} ${n(drop)}m${n(-side * 7)} ${n(-drop)}l${n(-side * 4)} ${n(drop * 0.8)}`
    }
  }

  return d
}

/** A small frog that hops into place when the rain stops and starts to call. */
function frog(x: number, y: number, s: number, delay: number, flip: boolean): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="mo-frog" style="--d:${delay}s">` +
    `<path d="M-15 0C-17 -9 -11 -15 -3 -15H4C12 -15 17 -9 15 0Z" fill="${FROG}" stroke="#3f8a56" stroke-width="1.4"/>` +
    `<path d="M-14 -1Q-24 -3 -22 2H-10M14 -1Q24 -3 22 2H10" fill="none" stroke="${FROG}" stroke-width="3.4" stroke-linecap="round"/>` +
    '<ellipse class="mo-croak" cx="7" cy="-5" rx="6.5" ry="5" fill="#c8e09a" fill-opacity=".8"/>' +
    `<g fill="${FROG}" stroke="#3f8a56" stroke-width="1.2"><circle cx="-4" cy="-15" r="4.4"/><circle cx="7" cy="-15" r="4.4"/></g>` +
    '<g fill="#e4f07a"><circle cx="-3.4" cy="-15.6" r="1.8"/><circle cx="7.6" cy="-15.6" r="1.8"/></g></g></g>'
  )
}

/** Fireflies that come out once the rain stops: each wanders on its own path and glows slowly on and off. */
function fireflies(points: readonly (readonly [number, number])[], seed: number): string {
  const next = random(seed)

  return points
    .map(
      ([x, y]) =>
        `<g class="mo-ff" style="--d:${f(0.25 + next() * 1.3)}s;--w:${f(3.5 + next() * 3.5)}s;--x:${n(-46 + next() * 92)}px;--y:${n(-60 + next() * 70)}px">` +
        `<circle class="mo-fb" style="animation-delay:-${f(next() * 2.4)}s" cx="${x}" cy="${y}" r="28"/></g>`,
    )
    .join('')
}

/** A crown of spray where a drop lands, drawn where it sits so one element both places and animates it. */
function splash(x: number, y: number, s: number, t: number, delay: number): string {
  const p = (dx: number, dy: number) => `${n(x + dx * s)} ${n(y + dy * s)}`

  return `<path class="mo-sp" style="--t:${f(t)}s;animation-delay:${f(-delay)}s" d="M${p(-7, 0)}Q${p(-7, -6)} ${p(-3, -4)}M${p(7, 0)}Q${p(7, -6)} ${p(3, -4)}M${p(0, -3)}L${p(0, -10)}"/>`
}

/** The laptop in its yellow dry bag, a rain gauge that fills, and the ranger's radio. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 12}" y="318" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    // The dry bag lies open on the desk with the laptop in it, its rolled end and buckle behind the hinge.
    '<path d="M238 331L242 315H350L354 331Z" fill="#7a6420" stroke="#a48a34" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M246 325H346" stroke="#5e4c18" stroke-width="1.2"/>' +
    '<rect x="346" y="304" width="18" height="27" rx="7" fill="#8e7526" stroke="#b09434" stroke-width="1.5"/>' +
    '<path d="M352 306V329M358 305V330" stroke="#5e4c18" stroke-width="1.3"/><rect x="343" y="314" width="24" height="5" rx="1" fill="#101612"/>' +
    '<rect x="248" y="314" width="90" height="5" rx="2" fill="#24302a"/>' +
    keys +
    '<path d="M330 318L356 234L366 236L340 320Z" fill="#24302a"/>' +
    `<path d="M331 315L355 238L359 239L335 317Z" fill="${light}"/>` +
    `<path d="M331 315L355 238L342 242L322 315Z" fill="${light}" fill-opacity=".18"/>` +
    // The bag's clear window over the screen, beaded with rain.
    '<path d="M326 320L352 228L372 232L346 322Z" fill="#cfe8dc" fill-opacity=".05" stroke="#cfe8dc" stroke-opacity=".3" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<g fill="#dff2e7" fill-opacity=".5"><circle cx="362" cy="250" r="1.6"/><circle cx="356" cy="276" r="1.3"/><circle cx="350" cy="300" r="1.5"/></g>' +
    // The rain gauge: a funnel over a marked tube, filling while a command runs.
    '<path d="M379 256H405L397 266H387Z" fill="#24302a"/>' +
    `<rect class="mo-gauge" x="386" y="300" width="12" height="29" fill="${ACCENT}" fill-opacity=".4"/>` +
    '<rect x="384" y="264" width="16" height="66" rx="3" fill="#cfe8dc" fill-opacity=".08" stroke="#cfe8dc" stroke-opacity=".5" stroke-width="1.5"/>' +
    '<path d="M384 276h5M384 288h5M384 300h5M384 312h5" stroke="#cfe8dc" stroke-opacity=".55" stroke-width="1.2"/>' +
    // The radio, its light calling while Claude is on the web.
    '<path d="M430 296V264" stroke="#1a221e" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="412" y="294" width="24" height="36" rx="4" fill="#1a221e" stroke="#34443a" stroke-width="1.6"/>' +
    `<rect x="416" y="303" width="16" height="5" fill="${light}" fill-opacity=".5"/>` +
    '<path d="M417 315H431M417 320H431M417 325H431" stroke="#34443a" stroke-width="1.6"/>' +
    `<circle class="mo-led${activity === 'web' ? ' mo-led-on' : ''}" cx="419" cy="299" r="2" fill="#ff7a52"/>`
  )
}

export function monsoonWorld(): World {
  const next = random(5309)

  // The jungle wall: rows of tree crowns as one scalloped edge each, the farther ones paler in the rain.
  const crowns = (y0: number, y1: number, step: number, base: number): string => {
    let d = `M-80 ${base}V${n(y1)}`

    for (let x = -80; x < 1700; ) {
      const w = step * (0.7 + next() * 0.6)

      x += w
      d += `A${n(w * 0.56)} ${n(w * 0.5)} 0 0 1 ${n(x)} ${n(y0 + next() * (y1 - y0))}`
    }

    return `${d}V${base}Z`
  }
  const clouds = Array.from({ length: 9 }, (_, i) => {
    const x = -120 + i * 210 + next() * 60

    return `<ellipse cx="${f(x)}" cy="${f(40 + next() * 150)}" rx="${f(190 + next() * 110)}" ry="${f(54 + next() * 40)}" fill="${i % 2 ? '#0b1813' : '#0e1d17'}"/>`
  }).join('')

  // Rings where the rain hits the river, bigger toward the front.
  const riverRings = Array.from({ length: 11 }, (_, i) => {
    const y = 650 + next() * 320
    const u = (y - 600) / 400
    const left = Math.max(10, bank(LEFT_BANK, y))
    const x = left + next() * (bank(RIGHT_BANK, y) - left)
    const s = 0.5 + u * 1.3

    return `<ellipse class="mo-rp" style="--t:${f(1.1 + (i % 4) * 0.2)}s;animation-delay:${f(-next() * 1.5)}s" cx="${n(x)}" cy="${n(y)}" rx="${n(13 * s)}" ry="${f(3.2 * s)}"/>`
  }).join('')

  // Splashes on the road, the bridge and the ground, their crowns bigger toward the front.
  const roadAt = (u: number, v: number): [number, number, number] => {
    const x = (1 - u) * (1 - u) * 418 + 2 * (1 - u) * u * 640 + u * u * 870
    const y = (1 - u) * (1 - u) * 712 + 2 * (1 - u) * u * 760 + u * u * 1010
    const w = 16 + u * 600

    return [x + v * w * 0.7, y, 0.6 + u * 1.4]
  }
  const splashes = [
    ...Array.from({ length: 7 }, () => roadAt(0.1 + next() * 0.88, next() - 0.5)),
    [150, 712, 0.8],
    [262, 709, 0.8],
    [372, 706, 0.8],
    [60, 790, 1.2],
    [1010, 930, 1.6],
    [1110, 880, 1.4],
    [380, 930, 1.5],
  ]
    .map(([x, y, s], i) => splash(x!, y!, s!, 0.7 + (i % 5) * 0.14, next()))
    .join('')
  const puddles = (
    [
      [522, 752, 22, 4],
      [592, 792, 46, 7],
      [706, 872, 72, 11],
      [858, 962, 110, 16],
    ] as const
  )
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`)
    .join('')
  const puddleRings = (
    [
      [592, 792, 1],
      [700, 872, 1.5],
      [716, 870, 1.3],
      [840, 960, 2.2],
      [880, 966, 2],
    ] as const
  )
    .map(([x, y, s], i) => `<ellipse class="mo-rp" style="--t:${f(1 + i * 0.17)}s;animation-delay:${f(-i * 0.37)}s" cx="${x}" cy="${y}" rx="${f(14 * s)}" ry="${f(3 * s)}"/>`)
    .join('')

  // The tufts along the banks and the road's edges.
  let tufts = ''

  for (let i = 0; i < 20; i += 1) {
    const side = i % 2
    const u = next()
    const [x, y] = side ? roadAt(u, -0.55) : [400 - u * 90 + Math.sin(u * 6) * 10, 640 + u * 360]
    const s = 0.7 + u * 1.4

    tufts += `M${n(x)} ${n(y)}l${n(-5 * s)} ${n(-14 * s)}m${n(5 * s)} ${n(14 * s)}l${n(1 * s)} ${n(-19 * s)}m${n(-s)} ${n(19 * s)}l${n(7 * s)} ${n(-12 * s)}`
  }

  const leaves: Leaf[] = [
    { x: 40, y: 30, a: 38, m: false, kind: 'banana', L: 360, W: 64, D: 46, tone: 0, hit: 2.6, sway: 5.2 },
    { x: 190, y: -40, a: 58, m: false, kind: 'banana', L: 240, W: 46, D: 30, tone: 1, hit: 2.1, sway: 4.4 },
    { x: 330, y: -30, a: 84, m: false, kind: 'banana', L: 300, W: 56, D: -30, tone: 0, hit: 3.1, sway: 6 },
    { x: -30, y: 170, a: 14, m: false, kind: 'ear', L: 250, W: 100, D: 30, tone: 1, hit: 2.4, sway: 5.6 },
  ]
  const rightLeaves: Leaf[] = [
    { x: 1650, y: 20, a: -34, m: true, kind: 'banana', L: 340, W: 66, D: 44, tone: 0, hit: 2.8, sway: 5 },
    { x: 1630, y: 250, a: -18, m: true, kind: 'ear', L: 230, W: 96, D: 24, tone: 1, hit: 2.2, sway: 6.4 },
  ]
  const frontLeaves: Leaf[] = [
    { x: -40, y: 1050, a: -48, m: false, kind: 'ear', L: 300, W: 120, D: -20, tone: 1, hit: 2.5, sway: 5.8 },
    { x: 250, y: 1060, a: -100, m: false, kind: 'banana', L: 220, W: 44, D: 30, tone: 1, hit: 1.9, sway: 4.8 },
  ]
  const tipDrip = (p: Leaf, i: number): string => {
    const [x, y] = tipOf(p)

    return `<path class="mo-td" style="--t:${f(1.3 + i * 0.3)}s;animation-delay:${f(-i * 0.6)}s" d="M${f(x)} ${f(y)}q-3 6 0 9q3 -3 0 -9Z"/>`
  }

  // The bridge: a plank deck on posts over the river, a rope rail, and one bay of it that the flood tears away.
  const deckY = (x: number) => 712 - (x - 94) * 0.0271
  const planks = Array.from({ length: 12 }, (_, i) => {
    const x = 112 + i * 26

    return `M${x} ${n(deckY(x))}v13`
  }).join('')
  const posts = [130, 200, 270, 340, 405].map(x => `<rect x="${x - 5}" y="${n(deckY(x) + 10)}" width="10" height="30"/>`).join('')
  const rail = (x: number) => `<rect x="${x - 3.5}" y="${n(deckY(x) - 34)}" width="7" height="35"/>`
  const rope = (a: number, b: number) => `M${a} ${n(deckY(a) - 31)}Q${(a + b) / 2} ${n(deckY((a + b) / 2) - 16)} ${b} ${n(deckY(b) - 31)}`
  const wakes = [130, 200, 270, 340].map(x => `M${x - 16} ${n(deckY(x) + 46)}L${x} ${n(deckY(x) + 38)}L${x + 16} ${n(deckY(x) + 46)}`).join('')
  const spray = [128, 178, 228, 280, 330, 384]
    .map(
      (x, i) =>
        `<path class="mo-spray" style="--d:${f(i * 0.13)}s;--sx:${f((i - 2.5) * 6)}px" d="M${x - 28} ${f(deckY(x) - 2)}C${x - 32} ${f(deckY(x) - 36)} ${x - 10} ${f(deckY(x) - 60)} ${x} ${f(deckY(x) - 70)}C${x + 10} ${f(deckY(x) - 60)} ${x + 32} ${f(deckY(x) - 36)} ${x + 28} ${f(deckY(x) - 2)}Z"/>`,
    )
    .join('')

  const lit = [[60, 420], [140, 560], [214, 470], [330, 520], [96, 650], [262, 640], [384, 590], [160, 330], [300, 400], [230, 770], [30, 540], [400, 460]] as const
  const litRight = [[1240, 330], [1330, 430], [1452, 470], [1560, 390], [1290, 520]] as const
  const litNook = [[300, 40], [380, 120], [250, -60]] as const

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#030806',
      furniture: '#2e2a16',
      metal: '#24302a',
      paper: '#d8e6dc',
      light: { idle: '#3a9a6a', work: ACCENT, bright: '#c8f5dc' },
      headTop: 211,
      glowAt: [347, 280],
      device,
      wear: {
        front:
          // A green rain poncho over the shoulders, open around the face, then a leaf hat whose brim stops above the eyes.
          '<path d="M60 250C58 296 56 328 54 352H246C244 328 242 296 240 250Z M88 254H212V314C212 320 207 324 200 324H100C93 324 88 320 88 314Z" fill="#2c5a3c" fill-opacity=".88" fill-rule="evenodd" stroke="#4a8a5c" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M236 262C238 298 240 326 242 346M64 270C62 300 61 324 60 344" fill="none" stroke="#9fe0b8" stroke-opacity=".4" stroke-width="2"/>' +
          '<g fill="#dff2e7" fill-opacity=".55"><circle cx="72" cy="300" r="1.8"/><circle cx="228" cy="284" r="1.6"/><circle cx="150" cy="338" r="1.8"/><circle cx="210" cy="342" r="1.4"/></g>' +
          '<path d="M38 249L150 174L262 249Q150 258 38 249Z" fill="#8a7744"/>' +
          '<path d="M150 174L262 249Q206 255 150 254Z" fill="#a8935a"/>' +
          '<path d="M66 231Q150 240 234 231M94 212Q150 219 206 212M122 193Q150 197 178 193" fill="none" stroke="#5e5030" stroke-width="1.6" stroke-opacity=".85"/>' +
          '<path d="M38 249Q150 258 262 249" fill="none" stroke="#3e3420" stroke-width="2.4"/>' +
          '<path d="M162 184L240 236" stroke="#eef4dc" stroke-opacity=".35" stroke-width="2"/><circle cx="150" cy="175" r="3" fill="#5e5030"/>' +
          '<g fill="#cfe8dc"><path class="mo-hd" d="M40 252q-2.5 4 0 7q2.5 -3 0 -7Z"/><path class="mo-hd" style="animation-delay:-.8s" d="M260 252q-2.5 4 0 7q2.5 -3 0 -7Z"/></g>',
      },
      seatArt:
        // A bamboo stool.
        `<g stroke="${BAMBOO}" stroke-width="8" stroke-linecap="round"><path d="M118 360L110 452M184 360L192 452"/></g>` +
        `<path d="M114 410H188" stroke="${BAMBOO}" stroke-width="5"/>` +
        `<g stroke="${BAMBOO_HI}" stroke-width="2"><path d="M108 388h14M180 388h14M106 426h14M182 426h14"/></g>` +
        `<rect x="104" y="348" width="94" height="10" rx="4" fill="#4a4220" stroke="#6a5e2c" stroke-width="1.5"/>`,
      tableArt:
        // A plank top on bamboo legs, with sandbags stacked under it against the flood.
        `<g stroke="${BAMBOO}" stroke-width="10" stroke-linecap="round"><path d="M190 344V452M446 344V452"/></g>` +
        `<path d="M192 398H444" stroke="${BAMBOO}" stroke-width="5"/>` +
        `<g stroke="${BAMBOO_HI}" stroke-width="2.4"><path d="M183 376h14M183 416h14M439 376h14M439 416h14"/></g>` +
        '<rect x="166" y="330" width="304" height="13" rx="3" fill="#2e2a16" stroke="#4e4624" stroke-width="1.6"/><path d="M170 337H466" stroke="#4e4624" stroke-width="1.2"/>' +
        '<g fill="#3e3a26" stroke="#5c5636" stroke-width="1.6"><path d="M318 456C316 440 322 432 346 432H404C430 432 436 440 434 456Z"/><path d="M362 434C360 420 366 412 388 412H426C448 412 454 420 452 434Z"/><path d="M398 456C396 444 400 436 418 436H446C462 436 468 444 466 456Z"/></g>' +
        '<path d="M350 444h8M396 422h8M424 446h8" stroke="#24221a" stroke-width="2.4"/>',
    },
    style:
      // The rain falls in layers, sheets of it sweep across, drops splash and ring the water.
      '.mo-fall{animation:mo-fall 1s linear infinite}@keyframes mo-fall{to{transform:translate(var(--fx),1000px)}}' +
      '.mo-sh{animation:mo-sh var(--sd,10s) linear infinite}@keyframes mo-sh{from{transform:translateX(-620px)}to{transform:translateX(1900px)}}' +
      '.st-tool .mo-sh{animation-duration:calc(var(--sd,10s) * .4)}' +
      '.mo-wind{transform-origin:800px 0}.st-tool .mo-wind{animation:mo-gust 1.4s ease-in-out infinite alternate}@keyframes mo-gust{from{transform:skewX(-2deg)}to{transform:skewX(-11deg)}}' +
      '.st-thinking .mo-rn{opacity:.7}' +
      '.mo-sp{transform-box:fill-box;transform-origin:50% 100%;opacity:0;animation:mo-sp var(--t,1s) ease-out infinite}' +
      '@keyframes mo-sp{0%{opacity:0;transform:scale(.3)}12%{opacity:.85}55%,100%{opacity:0;transform:scale(1.15)}}' +
      '.mo-rp{transform-box:fill-box;transform-origin:center;opacity:0;animation:mo-rp var(--t,1.4s) ease-out infinite}' +
      '@keyframes mo-rp{0%{opacity:.7;transform:scale(.15)}100%{opacity:0;transform:scale(1)}}' +
      '.mo-td{opacity:0;animation:mo-td var(--t,1.5s) ease-in infinite}@keyframes mo-td{0%{opacity:0;transform:translateY(0)}10%{opacity:.85}100%{opacity:0;transform:translateY(150px)}}' +
      '.mo-dr{opacity:0;animation:mo-dr var(--t,1.3s) ease-in infinite}@keyframes mo-dr{0%{opacity:0;transform:translateY(0)}15%{opacity:.8}100%{opacity:0;transform:translateY(52px)}}' +
      '.mo-hd{animation:mo-hd 1.6s ease-in infinite}@keyframes mo-hd{0%{opacity:0;transform:translateY(0)}20%{opacity:.85}100%{opacity:0;transform:translateY(26px)}}' +
      '.mo-str{stroke-dasharray:26 12;animation:mo-str .32s linear infinite}@keyframes mo-str{to{stroke-dashoffset:-38}}' +
      // Leaves sway and dip under the drops; the wind bends them hard while a tool works.
      '.mo-sw{animation:mo-sw var(--s,5s) ease-in-out infinite alternate}@keyframes mo-sw{from{transform:rotate(-2.5deg)}to{transform:rotate(3deg)}}' +
      '.st-tool .mo-sw{animation:mo-bend 1.3s ease-in-out infinite alternate}@keyframes mo-bend{from{transform:rotate(-8deg)}to{transform:rotate(7deg)}}' +
      '.mo-hit{animation:mo-hit var(--h,2.6s) ease-out infinite}' +
      '@keyframes mo-hit{0%,100%{transform:rotate(0)}6%{transform:rotate(7deg)}22%{transform:rotate(-2.4deg)}40%{transform:rotate(1.2deg)}60%{transform:rotate(0)}}' +
      '.st-run .mo-hit{animation-duration:calc(var(--h,2.6s) * .5)}' +
      // The river runs, mist drifts, the far mast blinks, and soft lightning lights the clouds now and then.
      '.mo-fm{stroke-dasharray:22 38;animation:mo-fm 1.5s linear infinite}@keyframes mo-fm{to{stroke-dashoffset:60}}' +
      '.st-run .mo-fm{animation-duration:.5s}' +
      '.mo-mb{animation:mo-mb 28s ease-in-out infinite alternate}@keyframes mo-mb{to{transform:translateX(70px)}}' +
      '.mo-cl{animation:mo-mb 60s ease-in-out infinite alternate}' +
      '.mo-vine{animation:mo-sw 6s ease-in-out infinite alternate}' +
      '.mo-ml{animation:mo-ml 2.6s ease-in-out infinite}@keyframes mo-ml{0%,100%{opacity:.2}50%{opacity:1}}.st-web .mo-ml{animation-duration:1.1s}' +
      '.mo-sig{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .mo-sig{animation:mo-sig 1.6s ease-out infinite}' +
      '@keyframes mo-sig{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: one soft glow every 4.5 s, ramping over ~.4 s, never above .3.
      '.mo-lt{opacity:0;animation:mo-lt 9s ease-in-out infinite}.mo-lt2{animation-delay:-4.5s}' +
      '@keyframes mo-lt{0%,85%{opacity:0}90%{opacity:1}100%{opacity:0}}' +
      '.st-done .mo-lt{display:none}' +
      // The desk.
      '.mo-gauge{transform-box:fill-box;transform-origin:50% 100%}.st-run .mo-gauge{animation:mo-gu 3s ease-out both}@keyframes mo-gu{to{transform:scaleY(2.1)}}' +
      '.mo-led{opacity:.3}.mo-led-on{animation:mo-led .8s steps(1) infinite}@keyframes mo-led{50%{opacity:1}}' +
      // Run: the rain doubles, a surge comes down the river, bursts over the bridge and floods the road to the post.
      '.mo-heavy,.mo-surge,.mo-swell,.mo-over,.mo-spray,.mo-fls,.mo-pool{opacity:0}' +
      '.st-run .mo-heavy{animation:mo-on .6s ease-out both}@keyframes mo-on{to{opacity:1}}' +
      '.st-run .mo-surge{animation:mo-surge 1.5s cubic-bezier(.5,0,.8,.6) .1s both}' +
      '@keyframes mo-surge{0%{opacity:0;transform:translate(48px,-104px) scale(.24)}10%{opacity:1}88%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(0,4px) scale(1.05)}}' +
      '.st-run .mo-swell{animation:mo-on 1s ease-out .8s both}' +
      '.st-run .mo-over{animation:mo-on .4s ease-out 1.35s both}' +
      '.mo-spray{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .mo-spray{animation:mo-spray 1.7s ease-out infinite;animation-delay:calc(1.35s + var(--d))}' +
      '@keyframes mo-spray{0%{opacity:0;transform:scale(.3)}15%{opacity:.85}70%,100%{opacity:0;transform:translate(var(--sx),-12px) scale(1.3)}}' +
      '.st-run .mo-br{animation:mo-shake .16s ease-in-out 1.35s 10 alternate}@keyframes mo-shake{from{transform:translate(-2px,1px)}to{transform:translate(2px,-1px)}}' +
      '.mo-rail{transform-box:fill-box;transform-origin:center}.st-run .mo-rail{animation:mo-rail 2.2s ease-in 1.5s both}' +
      '@keyframes mo-rail{to{transform:translate(-240px,250px) rotate(-56deg);opacity:0}}' +
      '.mo-fl{transform:translateX(-30px)}.st-run .mo-fls{opacity:1}' +
      '.st-run .mo-fl{animation:mo-flood 2.6s cubic-bezier(.2,.5,.5,1) 1.35s both}@keyframes mo-flood{from{transform:translateX(-30px)}to{transform:translateX(1000px)}}' +
      '.mo-pool{transform-box:fill-box;transform-origin:50% 100%}.st-run .mo-pool{animation:mo-pool 1s ease-out 2.2s both}' +
      '@keyframes mo-pool{from{opacity:0;transform:scaleY(.1)}to{opacity:1;transform:scaleY(1)}}' +
      '.mo-fstr{stroke-dasharray:46 26;animation:mo-pf .5s linear infinite}.mo-pf{stroke-dasharray:20 14;animation:mo-pf .7s linear infinite}@keyframes mo-pf{to{stroke-dashoffset:-72}}' +
      // Error: the tarp sags, fills, and dumps its load beside the desk; the big leaf slaps down.
      '.mo-pouch{transform:scaleY(0)}.st-error .mo-pouch{animation:mo-pouch 1.15s ease-in both}' +
      '@keyframes mo-pouch{0%{transform:scaleY(0)}55%{transform:scaleY(1)}66%{transform:scaleY(1.08)}100%{transform:scaleY(.12)}}' +
      '.st-error .mo-tarp{animation:mo-sag 1.3s ease-in-out both}@keyframes mo-sag{0%{transform:translateY(0)}50%{transform:translateY(8px)}78%{transform:translateY(-3px)}100%{transform:translateY(0)}}' +
      '.mo-gush,.mo-bsp,.mo-fly,.mo-lsp{opacity:0}' +
      '.mo-gush{transform-box:fill-box;transform-origin:50% 0}.st-error .mo-gush{animation:mo-gush 1.9s ease-out .62s both}' +
      '@keyframes mo-gush{0%{opacity:0;transform:scaleY(.05)}8%{opacity:.9}20%{transform:scaleY(1)}70%{opacity:.75;transform:scaleY(1)}100%{opacity:0;transform:scaleY(1)}}' +
      '.mo-bsp{transform-box:fill-box;transform-origin:50% 100%}.st-error .mo-bsp{animation:mo-bsp 1.3s ease-out .85s both}' +
      '@keyframes mo-bsp{0%{opacity:0;transform:scale(.2)}20%{opacity:.9}100%{opacity:0;transform:scale(1.5)}}' +
      '.st-error .mo-fly{animation:mo-fly 1.1s ease-out both;animation-delay:calc(.85s + var(--d))}' +
      '.st-error .mo-lsp{animation:mo-fly .9s ease-out both;animation-delay:calc(.4s + var(--d))}' +
      '@keyframes mo-fly{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(var(--x),var(--y))}}' +
      '.st-error .mo-big{animation:mo-slap 1.1s cubic-bezier(.55,0,.6,1) .12s both}' +
      '@keyframes mo-slap{0%{transform:rotate(0)}28%{transform:rotate(70deg)}44%{transform:rotate(56deg)}62%{transform:rotate(65deg)}80%{transform:rotate(60deg)}100%{transform:rotate(62deg)}}' +
      // Done: the rain stops, the stream off the tarp dries to drips, mist rises, frogs call and fireflies come out.
      '.st-done .mo-rn,.st-done .mo-stream{animation:mo-off 1.2s ease-out both}@keyframes mo-off{to{opacity:0}}' +
      '.st-done .mo-sp{animation:none}.st-done .mo-hit{animation:none}.st-done .mo-fm{animation-duration:3.2s}' +
      '.st-done .mo-rp{animation-duration:3.4s}.st-done .mo-dr{animation-duration:3.2s}.st-done .mo-td{animation-duration:2.8s}' +
      '.mo-mist{opacity:0}.st-done .mo-mist{animation:mo-mist 3.4s ease-out both;animation-delay:var(--d)}' +
      '@keyframes mo-mist{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(-26px)}}' +
      '.mo-ff{opacity:0}.st-done .mo-ff{animation:mo-on 1s ease-out var(--d) both,mo-ffw var(--w) ease-in-out var(--d) infinite alternate}' +
      '@keyframes mo-ffw{from{transform:translate(0,0)}to{transform:translate(var(--x),var(--y))}}' +
      '.mo-fb{fill:url(#mo-ffg);animation:mo-fb 2.4s ease-in-out infinite}@keyframes mo-fb{0%,100%{opacity:.2}50%{opacity:1}}' +
      '.mo-frog{opacity:0}.st-done .mo-frog{animation:mo-hop .7s cubic-bezier(.3,.7,.4,1) var(--d) both}' +
      '@keyframes mo-hop{0%{opacity:0;transform:translate(-30px,10px)}50%{opacity:1;transform:translate(-14px,-26px)}100%{opacity:1;transform:translate(0,0)}}' +
      '.mo-croak{transform-box:fill-box;transform-origin:30% 20%;animation:mo-croak 1.5s ease-in-out infinite}' +
      '@keyframes mo-croak{0%,38%,100%{transform:scale(.35)}52%{transform:scale(1.15)}66%{transform:scale(.4)}80%{transform:scale(1)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="mo-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a07"/><stop offset=".45" stop-color="#08140f"/><stop offset="1" stop-color="#11251c"/></linearGradient>' +
      '<radialGradient id="mo-lg"><stop offset="0" stop-color="#d4f0e2" stop-opacity=".3"/><stop offset=".5" stop-color="#bfe4d0" stop-opacity=".1"/><stop offset="1" stop-color="#bfe4d0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mo-sheet" cy=".62" r=".5"><stop offset="0" stop-color="#cfe8dc" stop-opacity=".12"/><stop offset=".55" stop-color="#cfe8dc" stop-opacity=".05"/><stop offset="1" stop-color="#cfe8dc" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mo-river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2620"/><stop offset="1" stop-color="#262818"/></linearGradient>' +
      '<linearGradient id="mo-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1008"/><stop offset=".5" stop-color="#3a170c"/><stop offset="1" stop-color="#2c1109"/></linearGradient>' +
      '<linearGradient id="mo-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07110c"/><stop offset="1" stop-color="#0a130d"/></linearGradient>' +
      '<linearGradient id="mo-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdccb" stop-opacity="0"/><stop offset=".5" stop-color="#bcdccb" stop-opacity=".07"/><stop offset="1" stop-color="#bcdccb" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="mo-mist"><stop offset="0" stop-color="#a8cdb9" stop-opacity=".36"/><stop offset="1" stop-color="#a8cdb9" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mo-ffg"><stop offset="0" stop-color="#f4ffd0"/><stop offset=".12" stop-color="#d6ff8a" stop-opacity=".95"/><stop offset=".35" stop-color="#a8f070" stop-opacity=".3"/><stop offset="1" stop-color="#a8f070" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mo-lf0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a2015"/><stop offset="1" stop-color="#17442b"/></linearGradient>' +
      '<linearGradient id="mo-lf1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07170e"/><stop offset="1" stop-color="#11341e"/></linearGradient>' +
      '<linearGradient id="mo-gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff2e7" stop-opacity=".6"/><stop offset="1" stop-color="#bfe0cf" stop-opacity=".3"/></linearGradient>' +
      `<clipPath id="mo-rc"><path d="${ROAD}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#mo-sky)"/>' +
      `<g class="mo-cl">${clouds}</g>` +
      '<circle class="mo-lt" cx="240" cy="230" r="300" fill="url(#mo-lg)"/>' +
      // The far ridge, its radio mast, and the jungle wall in rows with mist between them.
      '<path d="M-60 520C100 420 220 400 360 440C480 470 560 380 720 400C860 420 940 350 1100 380C1240 410 1320 330 1460 360C1560 380 1620 420 1660 430V640H-60Z" fill="#0c1c16"/>' +
      '<g class="mv-r"><circle class="mo-lt mo-lt2" cx="1380" cy="210" r="280" fill="url(#mo-lg)"/>' +
      '<path d="M1330 372L1338 286L1346 372M1332 352H1344M1334 330H1342M1336 308H1340M1331 368L1343 330M1345 368L1333 330" fill="none" stroke="#07110c" stroke-width="2.4"/>' +
      '<g class="mo-ml"><circle cx="1338" cy="284" r="9" fill="#ff6a4a" fill-opacity=".2"/><circle cx="1338" cy="284" r="2.6" fill="#ff7a52"/></g>' +
      '<circle class="mo-sig" cx="1338" cy="284" r="20" fill="none" stroke="#9fe0b8" stroke-width="2"/><circle class="mo-sig" style="animation-delay:.8s" cx="1338" cy="284" r="20" fill="none" stroke="#9fe0b8" stroke-width="2"/></g>' +
      `<path d="${crowns(420, 500, 110, 640)}" fill="#0a1813"/>` +
      '<ellipse class="mo-mb" cx="300" cy="500" rx="520" ry="42" fill="url(#mo-mist)"/><ellipse class="mo-mb" style="animation-delay:-9s" cx="1240" cy="510" rx="560" ry="46" fill="url(#mo-mist)"/>' +
      `<path d="${crowns(500, 566, 90, 650)}" fill="#07130e"/>` +
      '<ellipse class="mo-mb" style="animation-delay:-14s" cx="760" cy="586" rx="720" ry="40" fill="url(#mo-mist)"/>' +
      `<path d="${crowns(578, 614, 64, 660)}" fill="#050e09"/>` +
      '<rect y="606" width="1600" height="400" fill="url(#mo-gnd)"/>' +
      // The swollen river, its flow, its rings; while a command runs it swells and a surge comes down it.
      `<path d="${RIVER}" fill="url(#mo-river)"/>` +
      '<path d="M336 624C300 720 220 840 80 1012" fill="none" stroke="#8fb8a6" stroke-opacity=".07" stroke-width="44" stroke-linecap="round"/>' +
      `<g fill="none" stroke="${FOAM}" stroke-opacity=".32" stroke-linecap="round">` +
      `<path class="mo-fm" stroke-width="1.6" d="${crests([612, 622, 650, 672, 696])}"/>` +
      `<path class="mo-fm" style="animation-delay:-.7s" stroke-width="2.8" d="${crests([748, 778, 812, 852, 898, 950, 1000])}"/></g>` +
      `<g class="mo-swell"><path d="${RIVER}" fill="#3a3020"/>` +
      `<path class="mo-fm" d="${crests([608, 618, 628, 646, 660, 676, 692, 742, 762, 786, 812, 842, 876, 914, 956, 998])}" fill="none" stroke="${FOAM}" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/></g>` +
      `<g fill="none" stroke="#b8c8b0" stroke-opacity=".5" stroke-width="1.2">${riverRings}</g>` +
      `<g transform="translate(260 724)"><g class="mo-surge"><path d="M-150 8C-120 -26 -60 -42 0 -38C60 -44 120 -28 150 8Z" fill="#4a3b22"/>` +
      `<path d="M-150 8C-120 -26 -60 -42 0 -38C60 -44 120 -28 150 8" fill="none" stroke="${FOAM}" stroke-opacity=".85" stroke-width="6" stroke-linecap="round"/>` +
      `<g fill="${FOAM}" fill-opacity=".6"><circle cx="-90" cy="-30" r="9"/><circle cx="-20" cy="-42" r="11"/><circle cx="50" cy="-42" r="10"/><circle cx="110" cy="-24" r="8"/></g></g></g>` +
      // The rock on the near bank.
      '<path d="M384 822C380 806 396 794 416 796C434 798 444 810 440 824Z" fill="#0b130e" stroke="#26382c" stroke-width="1.6"/>' +
      // The red dirt road, its ruts and puddles, and the stub on the far side of the bridge.
      `<path d="${ROAD}" fill="url(#mo-road)"/>` +
      '<path d="M100 714C60 712 20 708 -20 704V716C20 720 60 724 100 728Z" fill="#2a1008"/>' +
      '<path d="M432 711C560 724 660 770 780 850S960 960 1020 1012M426 716C520 740 580 800 650 880S720 980 740 1012" fill="none" stroke="#1a0805" stroke-opacity=".7" stroke-width="5"/>' +
      `<g fill="#0b1512" stroke="#5e8a76" stroke-opacity=".28" stroke-width="1.5">${puddles}</g>` +
      `<g fill="none" stroke="#b8d8c6" stroke-opacity=".45" stroke-width="1.2">${puddleRings}</g>` +
      // The flash flood, kept to the road, rushing from the bridge toward the post.
      `<g class="mo-fls" clip-path="url(#mo-rc)"><g transform="translate(418 712) rotate(24)"><g class="mo-fl">` +
      `<path d="M-1500 -500H0C-14 -380 14 -250 -4 -120C-18 0 12 120 -6 240C-16 360 10 470 0 600H-1500Z" fill="${MUD_WATER}" fill-opacity=".95"/>` +
      `<path d="M0 -500C-14 -380 14 -250 -4 -120C-18 0 12 120 -6 240C-16 360 10 470 0 600" fill="none" stroke="${FOAM}" stroke-opacity=".5" stroke-width="7"/>` +
      `<path class="mo-fstr" d="M-190 -150h130M-320 -40h220M-210 60h160M-320 170h190M-440 -90h200M-540 110h240M-400 -220h180M-460 250h220M-620 10h260" stroke="${FOAM}" stroke-opacity=".38" stroke-width="3.4" stroke-linecap="round"/>` +
      '<rect x="-120" y="16" width="70" height="10" rx="5" fill="#1a120a" stroke="#3a2a18" stroke-width="1.4" transform="rotate(-14 -85 21)"/></g></g></g>' +
      // The bridge, the water bursting over it, the spray.
      `<g class="mo-br"><g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6">${posts}` +
      `<path d="M94 712L426 703L426 717L94 727Z"/>${rail(104)}${rail(184)}${rail(264)}${rail(418)}</g>` +
      `<path d="${planks}" stroke="#0e0905" stroke-width="1.6"/><path d="M94 712L426 703" stroke="#8a7656" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="${rope(104, 184)}${rope(184, 264)}" fill="none" stroke="#6a5838" stroke-width="2.6"/>` +
      `<g class="mo-rail"><g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6">${rail(344)}</g><path d="${rope(264, 344)}${rope(344, 418)}" fill="none" stroke="#6a5838" stroke-width="2.6"/></g>` +
      `<path d="${wakes}" fill="none" stroke="${FOAM}" stroke-opacity=".45" stroke-width="2"/>` +
      `<g class="mo-over"><path d="M90 710Q260 690 430 698L430 722Q260 734 90 734Z" fill="${MUD_WATER}" fill-opacity=".94"/>` +
      `<path d="M90 710Q260 690 430 698" fill="none" stroke="${FOAM}" stroke-opacity=".8" stroke-width="5"/></g>` +
      `<g fill="#d8ccb0" fill-opacity=".5">${spray}</g></g>` +
      `<path d="${tufts}" fill="none" stroke="#0e2416" stroke-width="2.6" stroke-linecap="round"/>` +
      // Rain splashing on the road, the deck and the ground, and a haze of spray over everything near the ground.
      `<g fill="none" stroke="#d6eee0" stroke-width="1.4" stroke-linecap="round">${splashes}</g>` +
      '<rect y="640" width="1600" height="140" fill="url(#mo-haze)"/>' +
      // The vines, and the canopy and leaves hanging over the top.
      '<g class="mv-t">' +
      '<g class="mo-vine" style="transform-origin:250px 0"><path d="M120 40C130 160 100 260 116 380M250 20C270 140 240 220 262 330M398 10C408 120 394 200 408 280" fill="none" stroke="#0b1f13" stroke-width="3"/></g>' +
      '<g fill="#030806"><ellipse cx="40" cy="-30" rx="300" ry="110"/><ellipse cx="330" cy="-60" rx="200" ry="90"/><ellipse cx="800" cy="-70" rx="460" ry="96"/></g>' +
      leaves.map((p, i) => leaf(p, i * 0.7)).join('') +
      `<g fill="#cfe8dc">${leaves.map((p, i) => tipDrip(p, i)).join('')}</g>` +
      '</g>' +
      // The far right: a palm, and two big leaves hanging in from the top-right corner.
      '<g class="mv-r">' +
      '<path d="M1560 1012C1560 700 1530 380 1478 74" fill="none" stroke="#060d09" stroke-width="26"/>' +
      '<path d="M1560 1012C1560 700 1530 380 1478 74" fill="none" stroke="#12241a" stroke-width="26" stroke-dasharray="3 24"/>' +
      `<g transform="translate(1478 74)"><g class="mo-sw" style="--s:6.6s"><path d="${fronds()}" fill="none" stroke="#0b2015" stroke-width="3.2" stroke-linecap="round"/></g></g>` +
      '<g class="mv-t"><g fill="#030806"><ellipse cx="1560" cy="-40" rx="300" ry="110"/><ellipse cx="1290" cy="-70" rx="220" ry="90"/></g>' +
      rightLeaves.map((p, i) => leaf(p, i * 0.9 + 0.3)).join('') +
      `<g fill="#cfe8dc">${tipDrip(rightLeaves[0]!, 4)}</g></g></g>` +
      // The rain itself: far, middle and near streaks, the sheets the wind drives across, and the heavier rain of a run.
      '<g class="mo-rn"><g class="mo-wind">' +
      downpour(31, 84, [16, 30], 170, 0.95, '#9cc4b0', 0.2, 1.2) +
      [
        [-80, 220, 11, 0],
        [0, 160, 9, -3.4],
        [0, 300, 13, -7.2],
        [0, 200, 10, -5.6],
        [0, 260, 12, -9.6],
      ]
        .map(([x, w, sd, delay]) => `<path class="mo-sh" style="--sd:${sd}s;animation-delay:${delay}s" d="M${x} -60h${w}l240 1120h-${w}Z" fill="url(#mo-sheet)"/>`)
        .join('') +
      downpour(32, 62, [30, 56], 190, 0.62, RAIN, 0.28, 1.8) +
      downpour(33, 30, [70, 120], 210, 0.44, '#dff2e7', 0.3, 2.8) +
      `<g class="mo-heavy">${downpour(34, 64, [40, 80], 210, 0.5, RAIN, 0.26, 2)}</g>` +
      '</g></g>' +
      // The leaves in front, over the near bank.
      `<g class="mv-b">${frontLeaves.map((p, i) => leaf(p, i * 1.1 + 0.4)).join('')}</g>` +
      // When it is done: mist rising off the ground, frogs on the bridge, the rock and a leaf, and the fireflies.
      '<g fill="url(#mo-mist)">' +
      '<ellipse class="mo-mist" style="--d:.1s" cx="220" cy="700" rx="380" ry="80"/><ellipse class="mo-mist" style="--d:.4s" cx="300" cy="880" rx="440" ry="90"/>' +
      '<ellipse class="mo-mist" style="--d:.6s" cx="800" cy="780" rx="520" ry="60" fill-opacity=".45"/><ellipse class="mo-mist" style="--d:.3s" cx="1050" cy="900" rx="420" ry="70" fill-opacity=".6"/>' +
      '<g class="mv-r"><ellipse class="mo-mist" style="--d:.2s" cx="1420" cy="640" rx="380" ry="80"/></g></g>' +
      frog(412, 798, 1.5, 0.7, true) +
      `<g class="mv-b">${frog(96, 904, 1.8, 1.2, false)}</g>` +
      fireflies(lit, 71) +
      `<g class="mv-r">${fireflies(litRight, 72)}</g>`,
    nook:
      // The muddy floor, a pallet under the desk, and a puddle by the bucket.
      '<rect x="-140" y="450" width="620" height="24" fill="#090f0b"/>' +
      '<rect x="70" y="451" width="400" height="9" fill="#1e1a0e" stroke="#3a3218" stroke-width="1.4"/><path d="M150 451V460M230 451V460M310 451V460M390 451V460" stroke="#0e0c06" stroke-width="2"/>' +
      '<ellipse cx="-74" cy="458" rx="50" ry="5" fill="#0b1512" stroke="#5e8a76" stroke-opacity=".25" stroke-width="1.2"/>' +
      '<g fill="none" stroke="#b8d8c6" stroke-opacity=".45" stroke-width="1.2"><ellipse class="mo-rp" style="--t:1.2s" cx="-80" cy="458" rx="26" ry="3"/><ellipse class="mo-rp" style="--t:1.5s;animation-delay:-.6s" cx="-56" cy="459" rx="20" ry="2.6"/></g>' +
      // The bamboo poles and the tie-down rope.
      `<g stroke="${BAMBOO}" stroke-width="8" stroke-linecap="round"><path d="M16 456V142M408 456V-164"/></g>` +
      `<g stroke="${BAMBOO_HI}" stroke-width="2"><path d="M10 230h12M10 330h12M402 0h12M402 120h12M402 240h12M402 360h12"/></g>` +
      '<path d="M0 152L-92 452" stroke="#0c1410" stroke-width="2.4"/>' +
      // The tarp, seen from below, with the belly it grows when it fills.
      '<g class="mo-tarp">' +
      `<path d="M0 152L66 -40L440 -160L440 18Z" fill="${TARP}"/>` +
      '<path d="M118 116L170 -73M246 77L290 -112M360 42L392 -145" stroke="#0f2725" stroke-width="2"/>' +
      `<path d="M0 152L440 18" stroke="${TARP_HEM}" stroke-width="4"/><path d="M0 152L66 -40L440 -160" fill="none" stroke="#21474a" stroke-width="2"/>` +
      `<g fill="#0c1a18" stroke="${TARP_HEM}" stroke-width="1.4"><circle cx="2" cy="150" r="3.4"/><circle cx="148" cy="107" r="2.6"/><circle cx="296" cy="62" r="2.6"/></g>` +
      `<g transform="translate(110 118.5) rotate(-16.9)"><g class="mo-pouch"><path d="M0 0C40 76 190 86 230 0Z" fill="#1c403d" stroke="${TARP_HEM}" stroke-width="2"/>` +
      '<path d="M40 16C80 50 160 54 196 16" fill="none" stroke="#8fd0b8" stroke-opacity=".38" stroke-width="3"/></g></g>' +
      '</g>' +
      // Rain bouncing off the top of the tarp.
      `<g fill="none" stroke="#d6eee0" stroke-width="1.4" stroke-linecap="round">${splash(120, -79, 1, 0.8, 0.1)}${splash(220, -112, 1, 0.95, 0.5)}${splash(320, -144, 1, 0.75, 0.3)}${splash(52, 4, 1, 0.9, 0.7)}</g>` +
      // The post's sign: a leaf and waves on a board, hung from the tarp.
      '<path d="M326 54V98M392 34V98" stroke="#0c1410" stroke-width="2"/>' +
      '<rect x="316" y="96" width="86" height="44" rx="4" fill="#2a2414" stroke="#4e4426" stroke-width="2"/>' +
      `<path d="M334 130C334 112 348 104 360 104C360 122 348 130 334 130Z" fill="${ACCENT}" fill-opacity=".5"/><path d="M336 128L356 108" stroke="#2a2414" stroke-width="1.6"/>` +
      '<path d="M368 112q5 -4 10 0t10 0M368 123q5 -4 10 0t10 0" fill="none" stroke="#cfe8dc" stroke-opacity=".45" stroke-width="2"/>' +
      // The big leaf over the post, which slaps down onto the tarp on an error, throwing its water off.
      `<g transform="translate(452 -330) rotate(20) scale(-1 1)"><g class="mo-big"><g class="mo-hit" style="--h:2.9s">` +
      (() => {
        const s = leafShape('banana', 340, 72, 40)

        return (
          `<path d="${s.outline}" fill="url(#mo-lf0)" stroke="#8fe0b4" stroke-opacity=".22" stroke-width="2"/>` +
          `<path d="${s.ribs}" fill="none" stroke="#04100a" stroke-opacity=".75" stroke-width="2.4"/>`
        )
      })() +
      '</g></g></g>' +
      `<g fill="#cfe8dc">${[[-40, -30], [-10, -70], [30, -50], [50, -10], [-60, 10], [10, -90]]
        .map(([x, y], i) => `<ellipse class="mo-lsp" style="--x:${x}px;--y:${y}px;--d:${f(i * 0.03)}s" cx="${226 + (i % 3) * 14}" cy="${-80 + (i % 2) * 10}" rx="3" ry="4"/>`)
        .join('')}</g>` +
      // The stream pouring off the tarp's low corner into a bucket.
      '<g class="mo-stream"><path d="M0 154V418" stroke="#cfe8dc" stroke-opacity=".18" stroke-width="3"/><path class="mo-str" d="M0 154V418" stroke="#dff2e7" stroke-opacity=".42" stroke-width="4.4"/>' +
      `<g fill="none" stroke="#d6eee0" stroke-width="1.4" stroke-linecap="round">${splash(0, 419, 1.2, 0.5, 0.2)}</g></g>` +
      '<path d="M-22 420L-18 456H18L22 420Z" fill="#1c2420" stroke="#3a4a42" stroke-width="2"/><path d="M-20 432H20M-19 446H19" stroke="#2e3a34" stroke-width="2"/>' +
      '<ellipse cx="0" cy="420" rx="22" ry="4" fill="#0e1613" stroke="#4a5a52" stroke-width="2"/>' +
      fireflies(litNook, 73) +
      frog(-4, 418, 1, 1.4, false),
    front:
      // Drips off the tarp's front edge.
      `<g fill="#cfe8dc">${[50, 105, 160, 215, 270, 325, 380, 425]
        .map((x, i) => `<path class="mo-dr" style="--t:${f(1 + (i % 3) * 0.25)}s;animation-delay:${f(-i * 0.41)}s" d="M${x} ${f(154 - 0.3045 * x)}q-2.6 5 0 8q2.6 -3 0 -8Z"/>`)
        .join('')}</g>` +
      // The tarp's load coming down beside the desk.
      '<path class="mo-gush" d="M-8 146H8L30 420H-30Z" fill="url(#mo-gw)"/>' +
      '<g class="mo-bsp"><path d="M-62 420C-58 392 -42 372 -32 366M62 420C58 392 42 372 32 366M-30 420C-30 382 -14 358 -6 346M30 420C30 382 14 358 6 346" fill="none" stroke="#dff2e7" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="420" rx="48" ry="8" fill="#cfe8dc" fill-opacity=".3"/></g>' +
      `<g fill="#cfe8dc">${[[-90, -60], [-60, -110], [-30, -140], [40, -120], [80, -70], [120, -30], [60, -150], [-110, -20]]
        .map(([x, y], i) => `<ellipse class="mo-fly" style="--x:${x}px;--y:${y}px;--d:${f(i * 0.04)}s" cx="0" cy="404" rx="3.4" ry="4.4"/>`)
        .join('')}</g>` +
      // The flood reaching the post while a command runs.
      `<g class="mo-pool"><path d="M-140 444C-60 438 40 446 140 440C240 434 340 446 470 440V472H-140Z" fill="${MUD_WATER}" fill-opacity=".82"/>` +
      `<path class="mo-pf" d="M-140 444C-60 438 40 446 140 440C240 434 340 446 470 440" fill="none" stroke="${FOAM}" stroke-opacity=".5" stroke-width="3"/></g>`,
  }
}
