import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Canyon Wind: Claude camps in an alcove high on a red canyon wall at dusk, a wide-brim hat with dust goggles on and
// a long scarf streaming in the wind. Across the canyon a great stone arch stands against the setting sun, hoodoos
// below it, wind streaks and tumbleweeds racing down the wash. A command whips up a giant dust devil under the arch;
// an error shakes a rockfall loose from the wall above the camp; done sends the last sun through the arch and a big
// bird soars across it.
const EMBER = '#e8744a'
const GLOW = '#ff9d62'
const SAND = '#f0b080'
const ROCK = '#3a1a12'
const ROCK_EDGE = '#5a2a1a'
const SHELL = '#4a3122'

type Pt = [number, number]

// The sun, low on the horizon inside the arch.
const SX = 210
const SY = 636

// The arch, a natural span: a massive left leg, a thinner right one, a lumpy top and a wide, leaning opening.
const OUTER: Pt[] = [
  [-34, 736], [-24, 650], [-8, 566], [14, 492], [38, 420], [74, 352], [112, 300], [150, 268], [196, 246], [232, 232],
  [262, 238], [300, 244], [332, 262], [358, 292], [376, 332], [388, 380], [392, 436], [392, 500], [396, 580], [404, 660], [416, 736],
]
const INNER: Pt[] = [
  [96, 736], [98, 660], [104, 588], [114, 520], [132, 452], [158, 394], [190, 350], [226, 322], [262, 310], [294, 318],
  [318, 344], [334, 388], [342, 442], [346, 512], [348, 600], [352, 736],
]

// The dust devil's foot and height, in the picture.
const BX = 250
const BY = 905
const BH = 690
const ddX = (t: number): number => BX - 46 * Math.pow(t, 1.4) + 7 * Math.sin(t * 7)
const ddHalf = (t: number): number => 12 + 132 * Math.pow(t, 1.7)

/** A point in whole units: the big generated shapes don't need finer. */
const at = (p: Pt): string => `${Math.round(p[0])} ${Math.round(p[1])}`

/** From the first point on, a smooth line through the rest (quadratic joins at the midpoints). */
function through(points: Pt[]): string {
  let d = ''

  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i]!
    const q = points[i + 1]!

    d += `Q${at(p)} ${at([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2])}`
  }

  return `${d}L${at(points[points.length - 1]!)}`
}

const closed = (p: Pt[]): string => `M${at(p[0]!)}${through(p)}Z`
const ARCH_OUT = closed(OUTER)
const ARCH_IN = closed(INNER)
// The same edges left open, so a rim of light never runs along the foot.
const RIM_OUT = `M${at(OUTER[0]!)}${through(OUTER)}`
const RIM_IN = `M${at(INNER[0]!)}${through(INNER)}`

/** A hoodoo: a column of stacked bulges and narrow necks under a wider cap rock, a rim of sunset round it. */
function hoodoo(x: number, base: number, h: number, w: number, seed: number, fill: string, rim: number, n = 8): string {
  const next = random(seed)
  const left: Pt[] = []
  const right: Pt[] = []

  for (let i = 0; i <= n; i += 1) {
    const t = i / n
    const bead = n > 4 ? 0.62 + 0.38 * Math.abs(Math.sin(t * Math.PI * 2.6 + seed)) : 1 + 0.2 * Math.sin(t * 9 + seed)
    const half = (w / 2) * (1 - 0.3 * t) * bead * (i === n ? 0.6 : 1)

    left.push([x - half + (next() - 0.5) * w * 0.06, base - t * h])
    right.push([x + half + (next() - 0.5) * w * 0.06, base - t * h])
  }

  const top = base - h
  const cw = w * 0.62
  const ch = Math.max(7, w * 0.3)
  const bands = [0.3, 0.66]
    .map(t => `M${f(x - (w / 2) * (1 - 0.3 * t) * 0.8)} ${f(base - t * h)}h${f(w * (1 - 0.3 * t) * 0.8)}`)
    .join('')

  return (
    `<path d="M${at(left[0]!)}${through(left)}L${at(right[n]!)}${through(right.slice().reverse())}Z" fill="${fill}" stroke="${EMBER}" stroke-opacity="${rim}" stroke-width="1.6"/>` +
    `<path d="${bands}" stroke="#0a0303" stroke-opacity=".5" stroke-width="${f(Math.max(2, w * 0.05))}"/>` +
    `<path d="M${f(x - cw)} ${f(top + 2)}C${f(x - cw)} ${f(top - ch)} ${f(x + cw)} ${f(top - ch)} ${f(x + cw)} ${f(top + 2)}C${f(x + cw * 0.5)} ${f(top + ch * 0.45)} ${f(x - cw * 0.5)} ${f(top + ch * 0.45)} ${f(x - cw)} ${f(top + 2)}Z" fill="${fill}" stroke="${EMBER}" stroke-opacity="${rim}" stroke-width="1.6"/>`
  )
}

/** A tumbleweed: a loose ball of twigs. */
function weed(r: number, seed: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < 7; i += 1) {
    const a = next() * Math.PI * 2
    const b = a + 1 + next() * 2.2
    const r1 = r * (0.45 + next() * 0.55)
    const r2 = r * (0.45 + next() * 0.55)

    d += `M${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)}Q${f((next() - 0.5) * r)} ${f((next() - 0.5) * r)} ${f(Math.cos(b) * r2)} ${f(Math.sin(b) * r2)}`
  }

  return (
    `<circle r="${r}" fill="#1a0c08" fill-opacity=".4"/>` +
    `<path d="${d}" fill="none" stroke="#8a5634" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle r="${r}" fill="none" stroke="#6a3e24" stroke-width="1.4" stroke-dasharray="5 4"/>`
  )
}

/** A big soaring bird, flying right: fingered wings, a fan of tail, a rim of sunset along its edges. */
function bird(): string {
  const wing = (s: number) =>
    `M${-4 * s} -2C${-26 * s} -14 ${-52 * s} -20 ${-72 * s} -16L${-86 * s} -14L${-78 * s} -8L${-92 * s} -6L${-80 * s} -1L${-90 * s} 3L${-78 * s} 5L${-84 * s} 10L${-70 * s} 9C${-48 * s} 12 ${-26 * s} 12 ${-4 * s} 8Z`

  return (
    `<g class="cw-bw"><path d="${wing(1)}${wing(-1)}" fill="#0b0507" stroke="#ffb070" stroke-opacity=".55" stroke-width="1.4" stroke-linejoin="round"/></g>` +
    '<path d="M-16 2L-30 -3L-31 9Z" fill="#0b0507"/><ellipse cx="0" cy="3" rx="17" ry="5" fill="#0b0507"/>' +
    '<circle cx="18" cy="1" r="4.5" fill="#1a0c0c" stroke="#ffb070" stroke-opacity=".4"/>'
  )
}

/** Movement around an ellipse, the near side a little bigger. */
function orbit(name: string, rx: number, ry: number, ph: number): string {
  const frames = Array.from({ length: 9 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + ph

    return `${f((k / 8) * 100)}%{transform:translate(${f(rx * Math.cos(a))}px,${f(ry * Math.sin(a))}px) scale(${f(1 + 0.25 * Math.sin(a))})}`
  }).join('')

  return `@keyframes ${name}{${frames}}`
}

/** A wind streak: a long faint dash that runs along a gentle curve, right to left. */
function streak(x: number, y: number, len: number, sag: number, op: number, w: number, s: number, d: number): string {
  return (
    `<path class="cw-ws" pathLength="1" style="--s:${f(s)}s;--d:${f(d)}s" ` +
    `d="M${f(x)} ${f(y)}c${f(-len * 0.3)} ${f(sag)} ${f(-len * 0.7)} ${f(-sag * 0.5)} ${f(-len)} ${f(sag * 0.4)}" stroke-opacity="${op}" stroke-width="${w}"/>`
  )
}

/** The rugged field laptop and an anemometer on the slab. Self-contained, since the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const spin =
    activity === 'tool' || activity === 'run' || activity === 'web'
      ? 0.45
      : activity === 'error'
        ? 0.3
        : activity === 'responding'
          ? 1
          : activity === 'thinking' || activity === 'done'
            ? 5
            : 2.2
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const cups = [0, 120, 240]
    .map(a => `<g transform="rotate(${a})"><path d="M0 0H19" stroke="#8a6a48" stroke-width="2.6"/><circle cx="22" r="6.5" fill="#c89a68"/></g>`)
    .join('')

  return (
    `<rect x="244" y="322" width="98" height="8" rx="2" fill="${SHELL}"/>` +
    keys +
    `<path d="M332 327L352 238L364 240L344 329Z" fill="${SHELL}"/>` +
    `<path d="M335 324L354 244L359 245L340 326Z" fill="${light}"/>` +
    `<path d="M335 324L354 244L342 248L324 324Z" fill="${light}" fill-opacity=".16"/>` +
    // Rubber corner bumpers and a carry strap.
    `<path d="M334 325L337 313M353 241L350 253M246 326H256" stroke="${EMBER}" stroke-width="6" stroke-linecap="round"/>` +
    '<path d="M360 246C374 250 378 270 370 290" fill="none" stroke="#2a1a12" stroke-width="3"/>' +
    // The anemometer on its little mast.
    '<rect x="390" y="323" width="20" height="7" rx="2" fill="#3a2a20"/><path d="M400 324V264" stroke="#3a2a20" stroke-width="3"/>' +
    `<g transform="translate(400 262) scale(1 .38)"><g class="cw-cup" style="--c:${spin}s">${cups}</g></g>` +
    '<circle cx="400" cy="262" r="3.4" fill="#8a6a48"/>'
  )
}

export function canyonWindWorld(): World {
  const next = random(83)

  // Stars: only a few at dusk, fainter over the chat column.
  const side: Pt[] = []
  const mid: Pt[] = []

  for (let i = 0; i < 36; i += 1) {
    const p: Pt = [next() * 1600, 8 + next() * 250]

    ;(p[0] > 420 && p[0] < 1180 ? mid : side).push(p)
  }

  const dots = (points: Pt[], size: number) => points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')

  // Wind-combed cirrus, lit from below by the sun.
  const cirrus = Array.from({ length: 8 }, (_, i) => {
    const x = -80 + i * 215 + next() * 60
    const y = 70 + next() * 260
    const w = 320 + next() * 300
    const h = 5 + next() * 7

    return (
      `<path d="M${f(x)} ${f(y)}q${f(w * 0.5)} ${f(-h)} ${f(w)} ${f(-h * 0.2)}q${f(-w * 0.45)} ${f(h * 1.1)} ${f(-w)} ${f(h * 0.2)}Z" fill="#2e1419" fill-opacity=".85"/>` +
      (i > 1 && i < 6 ? '' : `<path d="M${f(x + w * 0.1)} ${f(y + h * 0.15)}q${f(w * 0.4)} ${f(h * 0.5)} ${f(w * 0.85)} ${f(-h * 0.3)}" fill="none" stroke="#d0704a" stroke-opacity=".3" stroke-width="1.6"/>`)
    )
  }).join('')

  // Rays of the last sun, fanning up from inside the arch.
  const rays = [-172, -154, -136, -118, -101, -85, -71]
    .map(a => {
      const r = (Math.PI / 180) * a
      const s = (Math.PI / 180) * 2.4
      const l = 900

      return `M${SX} ${SY}L${f(SX + Math.cos(r - s) * l)} ${f(SY + Math.sin(r - s) * l)}L${f(SX + Math.cos(r + s) * l)} ${f(SY + Math.sin(r + s) * l)}Z`
    })
    .join('')

  // Strata through the arch and the butte.
  const archBands = Array.from({ length: 13 }, (_, i) => {
    const y = Math.round(226 + i * 40 + next() * 8)
    const t = Math.round(14 + next() * 12)

    return `<path d="M-40 ${y}C100 ${y - 8} 300 ${y + 10} 440 ${y - 4}V${y + t}C300 ${y + t + 12} 100 ${y + t - 6} -40 ${y + t}Z" fill="${i % 2 ? '#3c1c10' : '#200d0a'}"/>`
  }).join('')
  const butteLines = Array.from({ length: 6 }, (_, i) => {
    const y = 500 + i * 42

    return `M460 ${y}C700 ${y + 8} 900 ${y - 6} 1260 ${y + 4}`
  }).join('')

  const ripples = Array.from({ length: 18 }, () => {
    const x = -20 + next() * 1640
    const y = 830 + next() * 160
    const w = 40 + next() * 70

    return `M${f(x)} ${f(y)}q${f(w / 2)} -5 ${f(w)} 0`
  }).join('')
  const field = [
    [470, 806, 74, 20],
    [548, 802, 124, 28],
    [700, 800, 96, 24],
    [1000, 800, 136, 30],
    [1090, 806, 64, 20],
  ]
    .map(([x, b, h, w], i) => hoodoo(x!, b!, h!, w!, 30 + i, '#170908', 0.16, 4))
    .join('')

  // Tumbleweeds: start off the right edge and roll down the wash to the left.
  const weeds = [
    { y: 930, r: 24, s: 15, d: -3, b: 0.75, h: -26 },
    { y: 962, r: 16, s: 19, d: -11, b: 0.6, h: -16 },
    { y: 900, r: 32, s: 12, d: -7.5, b: 0.9, h: -34 },
  ]
    .map(
      (w, i) =>
        `<g transform="translate(1700 ${w.y})"><g class="cw-tx" style="--s:${w.s}s;--d:${w.d}s"><g class="cw-ty" style="--b:${w.b}s;--h:${w.h}px">` +
        `<g class="cw-tr" style="--r:${f(w.r / 22)}s">${weed(w.r, 50 + i)}</g></g></g></g>`,
    )
    .join('')

  // Sand blown off the top of the arch.
  const drift = Array.from({ length: 10 }, (_, i) => {
    const [x, y] = OUTER[7 + (i % 6)]!

    return `<circle class="cw-sd" style="--s:${f(2.4 + next() * 1.6)}s;--d:${f(-next() * 3)}s;--x:${f(-90 - next() * 80)}px;--y:${f(-6 - next() * 22)}px" cx="${f(x + next() * 20)}" cy="${f(y + 2)}" r="${f(1.2 + next() * 1.4)}" fill="${SAND}"/>`
  }).join('')

  const winds =
    streak(470, 150, 420, 18, 0.3, 1.8, 3.6, -0.4) +
    streak(430, 260, 380, -12, 0.26, 1.4, 4.2, -2.1) +
    streak(400, 420, 360, 16, 0.24, 1.6, 3.2, -1.2) +
    streak(460, 560, 420, -10, 0.22, 1.4, 4.6, -3.3) +
    streak(420, 690, 360, 12, 0.26, 1.8, 3.4, -0.9) +
    streak(380, 820, 340, -14, 0.24, 1.6, 3.9, -2.6) +
    streak(1250, 40, 820, 20, 0.1, 1.4, 6, -1.5) +
    streak(1140, 110, 700, -16, 0.09, 1.2, 7, -4.2) +
    streak(1320, 190, 600, 14, 0.12, 1.4, 5.4, -2.8)

  // The dust devil: a veil and a core, bands sliding across them to spin it, wisps off the top, debris around it.
  const edge = (k: number, sideOf: number): Pt[] =>
    Array.from({ length: 13 }, (_, i) => {
      const t = i / 12

      return [ddX(t) + sideOf * ddHalf(t) * k * (1 + 0.06 * Math.sin(i * 2.3)), BY - t * BH]
    })
  const column = (k: number) => {
    const l = edge(k, -1)
    const r = edge(k, 1).reverse()

    return `M${at(l[0]!)}${through(l)}L${at(r[0]!)}${through(r)}Z`
  }
  const ddBand = (dark: boolean) =>
    Array.from({ length: 12 }, (_, i) => {
      const t = (i + 0.6) / 12.4
      const y = BY - t * BH + (dark ? 4 + t * 5 : 0)
      const c = ddX(t)
      const h = ddHalf(t)

      return `<path class="cw-bd" style="--a:${f(h * 0.4)}px;animation-delay:${f(-i * 0.16 - (dark ? 0.25 : 0))}s" d="M${at([c - h * 0.9, y])}Q${at([c, y + h * 0.24])} ${at([c + h * 0.9, y])}" stroke-width="${f(1.8 + t * 3.2)}"/>`
    }).join('')
  const ddBands = `<g stroke="${SAND}" stroke-opacity=".3">${ddBand(false)}</g><g stroke="#2a1009" stroke-opacity=".35">${ddBand(true)}</g>`
  const top = BY - BH
  const tipL = ddX(1) - ddHalf(1)
  const wisps =
    `<path class="cw-ws" pathLength="1" style="--s:1.6s;--d:-.3s" d="M${f(tipL + 20)} ${top + 6}c-40 -14 -70 -44 -130 -34" stroke-opacity=".5" stroke-width="3"/>` +
    `<path class="cw-ws" pathLength="1" style="--s:1.9s;--d:-1.1s" d="M${f(tipL + 60)} ${top - 4}c-50 -20 -90 -30 -150 -8" stroke-opacity=".4" stroke-width="2.4"/>` +
    `<path class="cw-ws" pathLength="1" style="--s:1.4s;--d:-.8s" d="M${f(ddX(1) + ddHalf(1) - 20)} ${top + 4}c-40 -26 -90 -36 -160 -30" stroke-opacity=".4" stroke-width="2.4"/>`
  const debris = [
    { t: 0.22, secs: 1.1, ph: 0, shape: weed(9, 71) },
    { t: 0.6, secs: 1.5, ph: 4.1, shape: weed(12, 72) },
    { t: 0.76, secs: 1.7, ph: 1.1, shape: '<path d="M-7 -5L6 -6L8 4L-5 6Z" fill="#4a2216" stroke="#8a4a2a"/>' },
  ]
  const debrisMarks = debris
    .map((d, i) => `<g transform="translate(${f(ddX(d.t))} ${f(BY - d.t * BH)})"><g class="cw-o cw-o${i}"><g class="cw-sp" style="--sp:${f(d.secs * 0.6)}s">${d.shape}</g></g></g>`)
    .join('')
  const orbitCss = debris
    .map((d, i) => orbit(`cw-o${i}`, ddHalf(d.t) * 1.2 + 14, (ddHalf(d.t) * 1.2 + 14) * 0.17, d.ph) + `.st-run .cw-o${i}{animation:cw-o${i} ${d.secs}s linear infinite}`)
    .join('')
  const hawkCss = orbit('cw-hko', 70, 24, 0)

  // ---- The nook: the canyon wall towering over the camp, its alcove, and the rockfall. Desk-box coordinates. ----
  const WALL =
    'M470 -1300L96 -1300L94 -560C88 -520 100 -490 86 -462L58 -452C54 -436 66 -426 70 -404C80 -350 62 -300 70 -258L44 -248' +
    'C40 -230 54 -220 52 -196C50 -170 30 -150 8 -138L-56 -126C-70 -122 -74 -110 -64 -100C-30 -150 60 -190 200 -194C320 -196 420 -176 470 -160Z'
  const WALL_EDGE =
    'M94 -560C88 -520 100 -490 86 -462L58 -452C54 -436 66 -426 70 -404C80 -350 62 -300 70 -258L44 -248C40 -230 54 -220 52 -196C50 -170 30 -150 8 -138L-56 -126C-70 -122 -74 -110 -64 -100'
  const tones = ['#4a1d14', '#5a2517', '#3c170f', '#66301b', '#46200f', '#52221a']
  let wallBands = ''

  for (let y = -780, i = 0; y < -90; i += 1) {
    const t = Math.round(18 + next() * 34)
    const a = Math.round((next() - 0.5) * 24)

    wallBands += `<path d="M-90 ${y}C80 ${y + a} 260 ${y - a} 480 ${y + 6}V${y + t + 6}C260 ${y + t - a} 80 ${y + t + a} -90 ${y + t}Z" fill="${tones[i % tones.length]}"/>`
    y += t
  }

  const varnish = Array.from({ length: 10 }, (_, i) => {
    const from = i % 3 === 0 ? -452 : i % 3 === 1 ? -248 : -640
    const x = 90 + next() * 360

    return `<rect x="${f(x)}" y="${from}" width="${f(5 + next() * 14)}" height="${f(50 + next() * 170)}" fill="#0e0504" fill-opacity="${f(0.35 + next() * 0.3)}"/>`
  }).join('')
  const ledge = (x: number, y: number) =>
    `<path d="M${x} ${y}C200 ${y + 6} 340 ${y - 6} 480 ${y + 2}" fill="none" stroke="#120505" stroke-opacity=".75" stroke-width="7"/>` +
    `<path d="M${x} ${y - 5}C200 ${y + 1} 340 ${y - 11} 480 ${y - 3}" fill="none" stroke="${EMBER}" stroke-opacity=".28" stroke-width="1.6"/>`
  const wallWind =
    streak(470, -420, 420, 14, 0.2, 1.6, 3.4, -1.3) + streak(460, -300, 380, -10, 0.18, 1.4, 4.1, -2.9) + streak(480, -180, 300, 10, 0.18, 1.4, 3.7, -0.6)
  const ledgeDrift = Array.from({ length: 8 }, (_, i) => {
    const y = i % 2 ? -456 : -252

    return `<circle class="cw-sd" style="--s:${f(2.2 + next() * 1.6)}s;--d:${f(-next() * 3)}s;--x:${f(-70 - next() * 70)}px;--y:${f(-4 - next() * 16)}px" cx="${f(70 + next() * 120)}" cy="${y}" r="${f(1.2 + next() * 1.3)}" fill="${SAND}"/>`
  }).join('')

  // The rockfall: rocks break off the cornice, hit the ledge, then the lip of the overhang, and drop past the camp.
  const rocks = [
    { x: 220, y: -456, r: 40, d: 0, t: 2.4, dx: 1, dy: 1, rot: 420 },
    { x: 172, y: -444, r: 24, d: 0.14, t: 2.2, dx: 0.82, dy: 1.04, rot: -540 },
    { x: 266, y: -448, r: 32, d: 0.3, t: 2.5, dx: 1.22, dy: 0.96, rot: 380 },
    { x: 240, y: -464, r: 54, d: 0.62, t: 2.6, dx: 1.1, dy: 1, rot: 300 },
    { x: 150, y: -450, r: 16, d: 0.8, t: 2.1, dx: 0.9, dy: 1.06, rot: 700 },
    { x: 290, y: -440, r: 22, d: 1, t: 2.3, dx: 1.3, dy: 0.98, rot: -460 },
  ]
    .map((k, i) => {
      const n = random(90 + i)
      const pts = Array.from({ length: 7 }, (_, j) => {
        const a = (j / 7) * Math.PI * 2 + n() * 0.5
        const rr = k.r * (0.72 + n() * 0.36)

        return `${Math.round(Math.cos(a) * rr)} ${Math.round(Math.sin(a) * rr)}`
      })

      return (
        `<g transform="translate(${k.x} ${k.y})"><g class="cw-rk" style="--t:${k.t}s;--d:${k.d}s;--dx:${k.dx};--dy:${k.dy}">` +
        `<g class="cw-rr" style="--t:${k.t}s;--d:${k.d}s;--rot:${k.rot}deg"><path d="M${pts.join('L')}Z" fill="#6a2e1a" stroke="#2a0e08" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M${pts[3]}L${pts[4]}L${pts[5]}L0 0Z" fill="#a8502c"/><path d="M${pts[4]}L${pts[5]}L${pts[6]}" fill="none" stroke="#f0965a" stroke-width="2.4"/></g></g></g>`
      )
    })
    .join('')
  const puffs = [
    [220, -452, 34, 0.05],
    [166, -244, 44, 0.86],
    [196, -236, 36, 1.3],
    [34, -150, 56, 1.5],
    [-20, -118, 74, 1.75],
    [60, -160, 40, 2.05],
  ]
    .map(([x, y, r, d]) => `<circle class="cw-pf" style="--d:${d}s" cx="${x}" cy="${y}" r="${r}" fill="url(#cw-dust)"/>`)
    .join('')
  const grit = Array.from({ length: 9 }, (_, i) => `<rect class="cw-pb" style="--d:${f(0.2 + i * 0.17)}s" x="${f(-64 + next() * 70)}" y="-104" width="${f(3 + next() * 3)}" height="${f(3 + next() * 3)}" fill="#7a3a22"/>`).join('')
  const cracks =
    '<path class="cw-ck" pathLength="1" style="--d:.02s" d="M168 -470L190 -458L184 -444L206 -432L200 -418" fill="none" stroke="#ffb070" stroke-opacity=".7" stroke-width="2"/>' +
    '<path class="cw-ck" pathLength="1" style="--d:.12s" d="M300 -476L284 -460L292 -446L270 -430" fill="none" stroke="#ffb070" stroke-opacity=".6" stroke-width="2"/>'
  const echoes = [0, 0.7, 1.4]
    .map(d => `<path class="cw-ec" style="--d:${d}s" d="M0 -200A200 200 0 0 0 0 200" fill="none" stroke="${GLOW}" stroke-opacity=".5" stroke-width="3"/>`)
    .join('')
  const sock = [0, 1, 2, 3, 4]
    .map(i => {
      const x0 = 404 - i * 21
      const x1 = x0 - 21
      const h0 = 15 - i * 1.8
      const h1 = 15 - (i + 1) * 1.8

      return `<path class="cw-rip" style="animation-delay:${f(-i * 0.12)}s" d="M${x0} ${f(-52 - h0)}L${x1} ${f(-52 - h1)}V${f(-52 + h1)}L${x0} ${f(-52 + h0)}Z" fill="${i % 2 ? '#ead2bc' : '#d0603a'}" fill-opacity=".9"/>`
    })
    .join('')
  const grains = Array.from({ length: 8 }, (_, i) => {
    const y = i % 2 ? 150 + next() * 90 : 350 + next() * 100

    return `<circle class="cw-gr" style="--s:${f(0.9 + next() * 0.6)}s;--d:${f(-next())}s" cx="${f(470 + next() * 40)}" cy="${f(y)}" r="${f(1.4 + next() * 1.4)}" fill="${SAND}"/>`
  }).join('')
  const piers = [184, 412]
    .map(x =>
      [344, 370, 397, 425]
        .map((y, j) => `<rect x="${x + (j % 2 ? 3 : -2)}" y="${y}" width="${42 - (j % 2) * 4}" height="${j === 3 ? 31 : 27}" rx="7" fill="${j % 2 ? '#351810' : '#40200f'}" stroke="${ROCK_EDGE}" stroke-width="1.5"/>`)
        .join(''),
    )
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0a0406',
      furniture: ROCK,
      metal: SHELL,
      paper: '#efd9c4',
      light: { idle: '#b8653c', work: GLOW, bright: '#ffdcb6' },
      headTop: 234,
      glowAt: [346, 284],
      device,
      wear: {
        // The scarf's two tails stream out behind, under the far arm.
        behind:
          '<g class="cw-tail"><path d="M72 322C56 316 40 320 26 312C30 322 32 328 28 336C44 337 58 335 72 334Z" fill="#a84a28"/></g>' +
          '<g class="cw-tail cw-tail2"><path d="M72 332C58 337 44 345 30 347C36 353 40 357 38 364C52 358 62 350 72 341Z" fill="#8e3c20"/></g>',
        // A wide-brim hat with dust goggles on its band, and the scarf wrapped low: the eyes stay clear between them.
        front:
          '<g class="cw-hat">' +
          '<path d="M28 242C52 230 104 236 150 236C196 236 248 230 272 242C258 253 204 251 150 251C96 251 42 253 28 242Z" fill="#6e4a2e" stroke="#2e1c12" stroke-width="2"/>' +
          '<path d="M36 242C60 235 104 240 150 240C196 240 240 235 264 242" fill="none" stroke="#a87650" stroke-opacity=".6" stroke-width="2"/>' +
          '<path d="M94 240C92 214 104 198 150 198C196 198 208 214 206 240Z" fill="#7a5434" stroke="#2e1c12" stroke-width="2"/>' +
          '<path d="M118 206C134 212 166 212 182 206" fill="none" stroke="#4a3020" stroke-width="2.5"/>' +
          '<path d="M94 229H206V240H94Z" fill="#3a2216"/><path d="M136 226H162" stroke="#1e120c" stroke-width="3"/>' +
          '<g fill="#e8a060" fill-opacity=".6" stroke="#1e120c" stroke-width="3"><circle cx="125" cy="226" r="10"/><circle cx="173" cy="226" r="10"/></g>' +
          '<path d="M119 222Q123 218 128 219M167 222Q171 218 176 219" fill="none" stroke="#fff4e0" stroke-opacity=".7" stroke-width="1.6"/>' +
          '</g>' +
          '<path d="M66 320C100 316 200 316 234 320L232 338C200 342 100 342 68 338Z" fill="#b5542e"/>' +
          '<path d="M70 329C110 333 190 333 230 329" fill="none" stroke="#7a3018" stroke-width="2"/>' +
          '<g fill="#f0d2b4" fill-opacity=".55"><path d="M96 324l3 3l-3 3l-3 -3z"/><path d="M130 326l3 3l-3 3l-3 -3z"/><path d="M166 326l3 3l-3 3l-3 -3z"/><path d="M200 324l3 3l-3 3l-3 -3z"/></g>' +
          '<circle cx="70" cy="330" r="8" fill="#9a4424"/>',
      },
      seatArt:
        // A sandstone boulder with a folded camp blanket on top.
        `<path d="M102 352C94 380 92 424 98 456H206C212 424 210 380 200 352C178 344 124 344 102 352Z" fill="${ROCK}" stroke="${ROCK_EDGE}" stroke-width="2"/>` +
        '<path d="M97 382C130 377 170 386 205 379M95 410C130 404 172 414 208 406M96 436C140 431 172 440 209 433" fill="none" stroke="#22100b" stroke-width="3"/>' +
        '<path d="M201 356C209 382 211 420 207 452" fill="none" stroke="#8a4428" stroke-opacity=".55" stroke-width="3"/>' +
        '<path d="M106 346H198V356H106Z" fill="#8a3a22"/><path d="M106 349H198M106 353H198" stroke="#e0c09a" stroke-opacity=".6" stroke-width="1.2"/>',
      tableArt:
        // A slab of sandstone on two piers of stacked flat stones, a canteen and a coil of rope under it, a lizard on it.
        piers +
        '<path d="M164 336C164 331 168 330 176 330L462 330C470 330 474 333 472 340L468 348H168Z" fill="#4c2318" stroke="#6e3420" stroke-width="2"/>' +
        '<path d="M172 332.5H464" stroke="#9a5030" stroke-opacity=".55" stroke-width="2"/><path d="M168 341C260 339 380 343 470 340" fill="none" stroke="#2a110b" stroke-width="2"/>' +
        '<circle cx="300" cy="434" r="17" fill="#5a4632" stroke="#2e2218" stroke-width="2"/><rect x="295" y="412" width="10" height="7" fill="#2e2218"/>' +
        '<path d="M284 430C284 410 316 410 316 430" fill="none" stroke="#2e2218" stroke-width="2"/>' +
        '<g fill="none" stroke="#8a6a48" stroke-width="3"><ellipse cx="370" cy="449" rx="26" ry="6"/><ellipse cx="370" cy="444" rx="20" ry="5"/></g>' +
        '<g fill="#8a7a44"><ellipse cx="446" cy="327" rx="10" ry="3"/><circle cx="457" cy="326" r="3"/>' +
        '<path d="M437 327Q428 326 424 322" fill="none" stroke="#8a7a44" stroke-width="2"/><path d="M440 329l-3 3M450 329l3 3M442 325l-3 -3M451 325l2 -3" stroke="#8a7a44" stroke-width="1.6"/></g>',
    },
    style:
      orbitCss +
      hawkCss +
      // Ambient: the sky drifts, stars come out, the sun glows, the wind combs the canyon.
      '.cw-cl{animation:cw-drift 70s ease-in-out infinite alternate}@keyframes cw-drift{to{transform:translateX(-70px)}}' +
      '.cw-tw1{animation:cw-tw 3.6s ease-in-out infinite alternate}.cw-tw2{animation:cw-tw 2.8s ease-in-out -1.4s infinite alternate}@keyframes cw-tw{from{opacity:.3}to{opacity:1}}' +
      '.cw-sunp{animation:cw-sunp 6s ease-in-out infinite alternate}@keyframes cw-sunp{from{opacity:.82}to{opacity:1}}' +
      '.cw-ws{fill:none;stroke:#f0c09a;stroke-linecap:round;stroke-dasharray:.3 1;animation:cw-ws var(--s,4s) linear var(--d,0s) infinite}' +
      '@keyframes cw-ws{from{stroke-dashoffset:1.3}to{stroke-dashoffset:0}}' +
      '.st-responding .cw-wg .cw-ws{animation-duration:calc(var(--s,4s) * .6)}' +
      '.st-run .cw-wg .cw-ws,.st-error .cw-wg .cw-ws{animation-duration:calc(var(--s,4s) * .35)}' +
      '.st-thinking .cw-wg .cw-ws,.st-read .cw-wg .cw-ws{animation-duration:calc(var(--s,4s) * 1.8)}' +
      '.cw-wg{opacity:.8}.st-run .cw-wg{opacity:1}.st-done .cw-wg{animation:cw-calm 2.5s ease-out both}@keyframes cw-calm{to{opacity:.15}}' +
      '.cw-sd{opacity:0;animation:cw-sd var(--s,3s) ease-out var(--d,0s) infinite}' +
      '@keyframes cw-sd{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(var(--x,-120px),var(--y,-14px))}}' +
      '.st-run .cw-sd,.st-tool .cw-sd{animation-duration:1.3s}.st-done .cw-sd{display:none}' +
      '.cw-tx{animation:cw-tx var(--s,16s) linear var(--d,0s) infinite}@keyframes cw-tx{to{transform:translateX(-1960px)}}' +
      '.st-run .cw-tx,.st-responding .cw-tx{animation-duration:calc(var(--s,16s) * .45)}.st-done .cw-tx,.st-thinking .cw-tx{animation-duration:calc(var(--s,16s) * 2.4)}' +
      '.cw-ty{animation:cw-ty var(--b,.8s) infinite}' +
      '@keyframes cw-ty{0%,100%{transform:translateY(0);animation-timing-function:ease-out}50%{transform:translateY(var(--h,-22px));animation-timing-function:ease-in}}' +
      '.cw-tr{transform-box:fill-box;transform-origin:center;animation:mv-spin-back var(--r,1.2s) linear infinite}' +
      // Claude's hat and scarf in the wind; the windsock; the lantern; the anemometer.
      '.cw-hat{transform-box:fill-box;transform-origin:50% 92%;animation:cw-hat 2.6s ease-in-out infinite alternate}@keyframes cw-hat{from{transform:rotate(-1.2deg)}to{transform:rotate(1.4deg)}}' +
      '.cw-tail{transform-box:fill-box;transform-origin:100% 40%;animation:cw-tail .9s ease-in-out infinite alternate}' +
      '@keyframes cw-tail{from{transform:rotate(-7deg) scaleX(.9)}to{transform:rotate(8deg) scaleX(1.06)}}.cw-tail2{animation-duration:.7s;animation-delay:-.3s}' +
      '.st-run .cw-tail,.st-error .cw-tail{animation-duration:.32s}.st-done .cw-tail{animation-duration:2.2s}' +
      '.cw-sock{transform-box:fill-box;transform-origin:100% 50%;animation:cw-sock 1.3s ease-in-out infinite alternate}' +
      '@keyframes cw-sock{from{transform:rotate(-16deg) scaleX(.9)}to{transform:rotate(-6deg) scaleX(.97)}}' +
      '.st-run .cw-sock,.st-tool .cw-sock{animation:cw-sockf .3s ease-in-out infinite alternate}@keyframes cw-sockf{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}' +
      '.st-error .cw-sock{animation:cw-whip .36s ease-in-out infinite alternate}@keyframes cw-whip{from{transform:rotate(-26deg) scaleX(.85)}to{transform:rotate(14deg)}}' +
      '.st-done .cw-sock{animation:cw-slack 2.4s ease-in-out both}@keyframes cw-slack{to{transform:rotate(-62deg) scaleX(.8)}}' +
      '.cw-rip{animation:cw-rip .5s ease-in-out infinite alternate}@keyframes cw-rip{from{transform:translateY(-1.5px)}to{transform:translateY(1.5px)}}' +
      '.cw-lsw{animation:cw-lsw 3.4s ease-in-out infinite alternate}@keyframes cw-lsw{from{transform:rotate(-7deg)}to{transform:rotate(9deg)}}' +
      '.st-run .cw-lsw,.st-error .cw-lsw{animation-duration:1s}' +
      '.cw-lg{opacity:.16}.st-read .cw-lg{animation:cw-lon 1s ease-out both}@keyframes cw-lon{to{opacity:1}}' +
      '.cw-cup{animation:mv-spin var(--c,2.2s) linear infinite}' +
      '.cw-pl{opacity:0;transform-box:fill-box;transform-origin:100% 50%}.st-tool .cw-pl,.st-run .cw-pl{animation:cw-pl 1.2s ease-in-out infinite alternate}' +
      '@keyframes cw-pl{from{opacity:.55;transform:scaleX(.8) skewY(2deg)}to{opacity:1;transform:scaleX(1.06) skewY(-2deg)}}' +
      '.cw-dc{opacity:0;transform-box:fill-box;transform-origin:50% 30%}.st-error .cw-dc{animation:cw-dc 2.4s ease-out 1.1s infinite}' +
      '@keyframes cw-dc{0%{opacity:0;transform:scale(.2)}15%{opacity:.6}100%{opacity:0;transform:scale(1.5) translateY(60px)}}' +
      // Thinking: a hawk circles high over the arch.
      '.cw-hk{opacity:0}.st-thinking .cw-hk{animation:cw-fi 1s ease-out both}@keyframes cw-fi{to{opacity:1}}' +
      '.cw-hko{animation:cw-hko 7s linear infinite}' +
      // Responding: gusts of sand sweep down the wash.
      '.cw-gust{opacity:0}.st-responding .cw-gust{animation:cw-gust 3.2s ease-in-out infinite}.cw-gust2{animation-delay:-1.6s!important}' +
      '@keyframes cw-gust{0%{opacity:0;transform:translateX(900px)}30%,70%{opacity:.4}100%{opacity:0;transform:translateX(-1200px)}}' +
      // Web: calls echo off the canyon.
      '.cw-ec{opacity:0;transform-box:view-box}.st-web .cw-ec{animation:cw-ec 2.1s ease-out var(--d,0s) infinite}' +
      '@keyframes cw-ec{0%{opacity:0;transform:scale(.15)}15%{opacity:.7}100%{opacity:0;transform:scale(1)}}' +
      // Run: the dust devil rises under the arch, spins, wanders and throws debris around.
      '.cw-dd{opacity:0}.st-run .cw-dd{animation:cw-fi .5s ease-out both}' +
      '.st-run .cw-ddm{animation:cw-ddm 5s ease-in-out both}@keyframes cw-ddm{from{transform:translateX(-90px)}to{transform:translateX(70px)}}' +
      `.cw-ddg{transform-origin:${BX}px ${BY}px}.st-run .cw-ddg{animation:cw-ddg 1.7s cubic-bezier(.2,.7,.3,1) both}` +
      '@keyframes cw-ddg{from{transform:scale(.3,.06)}to{transform:scale(1,1)}}' +
      `.cw-dds{transform-origin:${BX}px ${BY}px;animation:cw-dds 1.8s ease-in-out infinite alternate}@keyframes cw-dds{from{transform:rotate(-3deg)}to{transform:rotate(3.5deg)}}` +
      '.cw-bd{fill:none;stroke-linecap:round;animation:cw-bd .5s ease-in-out infinite alternate}' +
      '@keyframes cw-bd{from{transform:translateX(calc(var(--a) * -1))}to{transform:translateX(var(--a))}}' +
      '.cw-sk{transform-box:fill-box;transform-origin:center;animation:cw-sk 1.1s ease-in-out infinite alternate}@keyframes cw-sk{from{transform:scale(.85,.9)}to{transform:scale(1.15,1.1)}}' +
      '.cw-sp{transform-box:fill-box;transform-origin:center;animation:mv-spin var(--sp,.8s) linear infinite}' +
      '.cw-gr{opacity:0}.st-run .cw-gr{animation:cw-gr var(--s,1.2s) linear var(--d,0s) infinite}' +
      '@keyframes cw-gr{0%{opacity:0;transform:translateX(0)}10%,85%{opacity:.75}100%{opacity:0;transform:translateX(-600px)}}' +
      // Error: the wall rumbles, a crack opens, rocks tumble down past the camp, dust bursts where they land.
      '.st-error .cw-shk{animation:cw-shk .3s ease-in-out 5}@keyframes cw-shk{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}75%{transform:translate(2px,-1px)}}' +
      '.cw-rk{opacity:0}.st-error .cw-rk{animation:cw-fall var(--t,2.4s) var(--d,0s) infinite}' +
      '@keyframes cw-fall{0%{opacity:0;transform:translate(0,0)}4%{opacity:1;transform:translate(0,0)}' +
      '10%{transform:translate(calc(var(--dx) * -6px),calc(var(--dy) * 14px));animation-timing-function:ease-in}' +
      '34%{transform:translate(calc(var(--dx) * -60px),calc(var(--dy) * 210px));animation-timing-function:ease-out}' +
      '44%{transform:translate(calc(var(--dx) * -112px),calc(var(--dy) * 160px));animation-timing-function:ease-in}' +
      '60%{transform:translate(calc(var(--dx) * -190px),calc(var(--dy) * 318px));animation-timing-function:ease-out}' +
      '68%{transform:translate(calc(var(--dx) * -236px),calc(var(--dy) * 290px));animation-timing-function:ease-in}' +
      '96%{opacity:1}100%{opacity:0;transform:translate(calc(var(--dx) * -360px),calc(var(--dy) * 1000px))}}' +
      '.cw-rr{transform-box:fill-box;transform-origin:center}.st-error .cw-rr{animation:cw-rot var(--t,2.4s) linear var(--d,0s) infinite}@keyframes cw-rot{to{transform:rotate(var(--rot,400deg))}}' +
      '.cw-pf{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .cw-pf{animation:cw-pf 2.4s ease-out var(--d,0s) infinite}' +
      '@keyframes cw-pf{0%{opacity:0;transform:scale(.3)}8%{opacity:.6}60%,100%{opacity:0;transform:scale(2)}}' +
      '.cw-ck{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .cw-ck{animation:cw-ck .5s ease-out var(--d,.05s) both}' +
      '@keyframes cw-ck{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.cw-scar{opacity:0}.st-error .cw-scar{animation:cw-fi .4s ease-out .2s both}' +
      '.cw-pb{opacity:0}.st-error .cw-pb{animation:cw-pb 1.2s ease-in var(--d,0s) infinite}@keyframes cw-pb{0%{opacity:0;transform:translateY(0)}10%{opacity:.9}100%{opacity:.5;transform:translateY(560px)}}' +
      // Done: the last sun pours through the arch, the wall glows, the wind drops and a big bird soars across.
      '.cw-ray,.cw-lit,.cw-alp{opacity:0}.st-done .cw-ray{animation:cw-fi 2s ease-out .2s both}' +
      `.cw-rayr{transform-origin:${SX}px ${SY}px;animation:cw-rayr 9s ease-in-out infinite alternate}@keyframes cw-rayr{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}` +
      '.st-done .cw-lit{animation:cw-fi 1.8s ease-out .1s both}.st-done .cw-alp{animation:cw-fi 2.4s ease-out .3s both}' +
      '.st-done .cw-sun{animation:cw-set 4s ease-in-out both}@keyframes cw-set{to{transform:translateY(12px)}}' +
      '.cw-bird{opacity:0}.st-done .cw-bird{animation:cw-bird 6s cubic-bezier(.35,.15,.6,1) .1s both}' +
      '@keyframes cw-bird{0%{opacity:0;transform:translate(0,0) rotate(8deg) scale(.8)}6%{opacity:1}35%{transform:translate(330px,170px) rotate(3deg) scale(1)}' +
      '60%{transform:translate(560px,90px) rotate(-6deg) scale(1.05)}94%{opacity:1}100%{opacity:0;transform:translate(1100px,-160px) rotate(-12deg) scale(.9)}}' +
      '.cw-bw{transform-box:fill-box;transform-origin:50% 60%;animation:cw-bw 1.3s ease-in-out infinite alternate}@keyframes cw-bw{to{transform:scaleY(.8)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="cw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08050e"/><stop offset=".3" stop-color="#150912"/><stop offset=".5" stop-color="#271015"/>' +
      '<stop offset=".6" stop-color="#461a17"/><stop offset=".645" stop-color="#6a2c1c"/><stop offset=".7" stop-color="#2a1110"/><stop offset="1" stop-color="#140807"/></linearGradient>' +
      '<radialGradient id="cw-sg"><stop offset="0" stop-color="#ffb070" stop-opacity=".6"/><stop offset=".22" stop-color="#f07a40" stop-opacity=".3"/><stop offset=".6" stop-color="#a03a20" stop-opacity=".1"/><stop offset="1" stop-color="#a03a20" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cw-sun"><stop offset="0" stop-color="#fff0d0"/><stop offset=".6" stop-color="#ffc080"/><stop offset="1" stop-color="#f08a50"/></radialGradient>' +
      `<radialGradient id="cw-rg" gradientUnits="userSpaceOnUse" cx="${SX}" cy="${SY}" r="900"><stop offset="0" stop-color="#ffc080" stop-opacity=".5"/><stop offset=".45" stop-color="#ff9a5a" stop-opacity=".16"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="cw-lt" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".15"/><stop offset=".6" stop-color="#ffa860" stop-opacity=".42"/><stop offset="1" stop-color="#ffd090" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="cw-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e0d0a"/><stop offset="1" stop-color="#0b0504"/></linearGradient>' +
      '<radialGradient id="cw-dust"><stop offset="0" stop-color="#b0683e" stop-opacity=".7"/><stop offset=".6" stop-color="#7a4028" stop-opacity=".3"/><stop offset="1" stop-color="#7a4028" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cw-ddv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8784a" stop-opacity="0"/><stop offset=".3" stop-color="#c8784a" stop-opacity=".2"/><stop offset=".55" stop-color="#e0a070" stop-opacity=".3"/><stop offset=".8" stop-color="#a0583a" stop-opacity=".18"/><stop offset="1" stop-color="#a0583a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cw-ddc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d89060" stop-opacity="0"/><stop offset=".45" stop-color="#e8a878" stop-opacity=".32"/><stop offset=".7" stop-color="#8a4a2c" stop-opacity=".3"/><stop offset="1" stop-color="#8a4a2c" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cw-plg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0b080" stop-opacity="0"/><stop offset="1" stop-color="#f0b080" stop-opacity=".42"/></linearGradient>' +
      `<linearGradient id="cw-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GLOW}" stop-opacity=".12"/><stop offset=".55" stop-color="${GLOW}" stop-opacity=".35"/><stop offset="1" stop-color="#ffc080" stop-opacity=".85"/></linearGradient>` +
      '<linearGradient id="cw-hg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a2416"/><stop offset=".45" stop-color="#2a100b"/><stop offset="1" stop-color="#120606"/></linearGradient>' +
      '<linearGradient id="cw-gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c07a4a" stop-opacity="0"/><stop offset=".5" stop-color="#c07a4a" stop-opacity=".45"/><stop offset="1" stop-color="#c07a4a" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="cw-ac"><path d="${ARCH_OUT}${ARCH_IN}" clip-rule="evenodd"/></clipPath>` +
      '<clipPath id="cw-bc"><path id="cw-butte" d="M470 790L478 540L494 528L506 486L556 476L598 480L640 462L760 458L800 468L852 466L864 488L904 492L924 512L1010 516L1030 532L1120 536L1150 560L1260 564V790Z"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#cw-sky)"/>' +
      `<path class="cw-tw1" d="${dots(side, 2.6)}" fill="#f6dcd2"/><path class="cw-tw2" d="${dots(mid, 2.2)}" fill="#f6dcd2" fill-opacity=".35"/>` +
      `<g class="cw-cl">${cirrus}</g>` +
      // The sun and its glow, and the rays that come with done.
      `<circle class="cw-sunp" cx="${SX}" cy="${SY - 20}" r="400" fill="url(#cw-sg)"/>` +
      `<g class="cw-sun"><circle cx="${SX}" cy="${SY}" r="44" fill="url(#cw-sun)" fill-opacity=".92"/></g>` +
      `<g class="cw-ray"><g class="cw-rayr"><path d="${rays}" fill="url(#cw-rg)"/></g></g>` +
      // Far mesas on the horizon, the sun sitting in their low gap.
      '<path d="M-20 700V600L40 598L52 612L96 614L110 646L330 647L350 610L420 604L436 590L560 588L572 600L700 602L720 575L860 572L876 590L980 592L1000 560L1120 556L1136 580L1260 582L1280 600L1620 600V700Z" fill="#2c1216" stroke="#c0603a" stroke-opacity=".22" stroke-width="1.6"/>' +
      // The big butte down the canyon, its strata faint.
      '<path d="M470 790L478 540L494 528L506 486L556 476L598 480L640 462L760 458L800 468L852 466L864 488L904 492L924 512L1010 516L1030 532L1120 536L1150 560L1260 564V790Z" fill="#1d0b0c" stroke="#c0603a" stroke-opacity=".16" stroke-width="2"/>' +
      `<path clip-path="url(#cw-bc)" d="${butteLines}" fill="none" stroke="#2c1214" stroke-width="7"/>` +
      // The fin and the arch on it: strata, a rim of sunset round the opening, and the gold of done.
      '<path d="M-40 770C-20 736 20 724 60 726C120 732 160 718 220 720C300 722 360 712 420 724C462 734 486 754 496 780V820H-40Z" fill="#1e0c0a" stroke="#c0603a" stroke-opacity=".25" stroke-width="2"/>' +
      `<path d="${ARCH_OUT}${ARCH_IN}" fill="#2a110d" fill-rule="evenodd"/>` +
      `<g clip-path="url(#cw-ac)">${archBands}</g>` +
      `<path d="${RIM_IN}" fill="none" stroke="url(#cw-rim)" stroke-width="3.4"/>` +
      `<path d="${RIM_OUT}" fill="none" stroke="${EMBER}" stroke-opacity=".3" stroke-width="2"/>` +
      `<g class="cw-lit"><path d="${ARCH_OUT}${ARCH_IN}" fill="url(#cw-lt)" fill-rule="evenodd"/><path d="${RIM_IN}" fill="none" stroke="#ffd09a" stroke-opacity=".8" stroke-width="5"/></g>` +
      `<g class="cw-pl"><path d="M262 238C190 214 100 190 -60 176C40 204 130 232 236 252ZM300 246C220 230 150 228 40 236C140 244 210 252 290 262Z" fill="url(#cw-plg)"/></g>` +
      drift +
      // The thinking hawk, small and high.
      '<g class="cw-hk"><g transform="translate(250 130)"><g class="cw-hko"><g transform="scale(.7)">' +
      bird() +
      '</g></g></g></g>' +
      // The canyon floor: the wash, ripples, stones, the hoodoo field, the near hoodoos and the tumbleweeds.
      '<g class="mv-b">' +
      '<path d="M-40 800C200 780 480 788 800 792C1100 796 1320 780 1640 790V1100H-40Z" fill="url(#cw-fl)"/>' +
      '<path d="M1300 830C1000 850 700 880 400 900C200 914 60 930 -40 950" fill="none" stroke="#2c140e" stroke-opacity=".7" stroke-width="40" stroke-linecap="round"/>' +
      `<path d="${ripples}" fill="none" stroke="#3a1a12" stroke-opacity=".8" stroke-width="2"/>` +
      field +
      `<g class="cw-gust"><ellipse cx="550" cy="890" rx="560" ry="30" fill="url(#cw-gs)"/></g><g class="cw-gust cw-gust2"><ellipse cx="760" cy="936" rx="460" ry="22" fill="url(#cw-gs)"/></g>` +
      hoodoo(52, 1010, 300, 84, 11, 'url(#cw-hg)', 0.4, 6) +
      hoodoo(142, 1000, 190, 54, 12, 'url(#cw-hg)', 0.34, 6) +
      hoodoo(392, 1010, 258, 66, 13, 'url(#cw-hg)', 0.4, 6) +
      weeds +
      '</g>' +
      // The dust devil.
      '<g class="cw-dd"><g class="cw-ddm">' +
      `<ellipse class="cw-sk" cx="${BX}" cy="${BY}" rx="140" ry="36" fill="url(#cw-dust)"/>` +
      `<g class="cw-ddg"><g class="cw-dds"><path d="${column(1.25)}" fill="url(#cw-ddv)"/><path d="${column(0.62)}" fill="url(#cw-ddc)"/>` +
      ddBands +
      wisps +
      debrisMarks +
      '</g></g></g></g>' +
      `<g class="cw-wg">${winds}</g>` +
      // The big bird of done, coming in from the left over the arch.
      '<g transform="translate(-120 200) scale(1.3)"><g class="cw-bird">' +
      bird() +
      '</g></g>',
    nook:
      '<defs>' +
      `<clipPath id="cw-wc"><path d="${WALL}"/></clipPath>` +
      '<linearGradient id="cw-wsh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0303" stop-opacity="0"/><stop offset=".45" stop-color="#0a0303" stop-opacity=".15"/><stop offset="1" stop-color="#0a0303" stop-opacity=".6"/></linearGradient>' +
      '<linearGradient id="cw-alg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a50" stop-opacity=".4"/><stop offset="1" stop-color="#ff9a50" stop-opacity=".06"/></linearGradient>' +
      '<radialGradient id="cw-lan"><stop offset="0" stop-color="#ffb060" stop-opacity=".5"/><stop offset=".5" stop-color="#ff9040" stop-opacity=".15"/><stop offset="1" stop-color="#ff9040" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<g class="cw-shk">' +
      // The wall: layered rock, desert varnish, ledges, its sunlit edge and the alpenglow of done.
      `<path d="${WALL}" fill="#3a170f"/>` +
      `<g clip-path="url(#cw-wc)">${wallBands}${varnish}<rect x="-90" y="-1300" width="560" height="1210" fill="url(#cw-wsh)"/></g>` +
      '<path d="M190 -760L184 -690L196 -610L188 -530L198 -460M330 -720L338 -640L326 -560L334 -470L322 -400L330 -250M410 -560L404 -470L414 -380L406 -250" fill="none" stroke="#120505" stroke-opacity=".7" stroke-width="3"/>' +
      ledge(58, -452) +
      ledge(44, -248) +
      `<path d="${WALL_EDGE}" fill="none" stroke="${GLOW}" stroke-opacity=".12" stroke-width="16"/>` +
      `<path d="${WALL_EDGE}" fill="none" stroke="${GLOW}" stroke-opacity=".5" stroke-width="3"/>` +
      `<path class="cw-alp" d="${WALL}" fill="url(#cw-alg)"/>` +
      '<path class="cw-scar" d="M176 -470L214 -480L292 -474L298 -446L250 -436L190 -440Z" fill="#8a4226" stroke="#1a0806" stroke-width="4"/>' +
      cracks +
      // The alcove: its back wall, the overhang's shadow, the ledge floor.
      '<path d="M-62 470C-58 300 -54 100 -64 -100C-30 -150 60 -190 200 -194C320 -196 420 -176 470 -160V470Z" fill="#160807"/>' +
      '<path d="M-64 -100C-30 -150 60 -190 200 -194C320 -196 420 -176 470 -160" fill="none" stroke="#070202" stroke-opacity=".7" stroke-width="12"/>' +
      '<path d="M-56 120C60 116 200 124 470 118M-58 300C80 296 220 304 470 298" fill="none" stroke="#1f0b08" stroke-width="5"/>' +
      '<path d="M-104 470L-100 446C-60 436 40 438 470 440V470Z" fill="#2a120c"/>' +
      '<path d="M-100 446C-60 436 40 438 210 440" fill="none" stroke="#d0683e" stroke-opacity=".35" stroke-width="2"/>' +
      // Camp: a coil of rope on a peg, a pack with a bedroll, a hiking pole, the lantern, the windsock.
      '<path d="M8 110H22" stroke="#2a1a12" stroke-width="4"/><g fill="none" stroke="#8a6a48" stroke-width="3"><ellipse cx="15" cy="142" rx="13" ry="24"/><ellipse cx="17" cy="144" rx="9" ry="19"/></g>' +
      '<path d="M-58 456L-18 296" stroke="#4a3a2e" stroke-width="3"/>' +
      '<rect x="-40" y="392" width="52" height="64" rx="10" fill="#3a2418" stroke="#5a3a26" stroke-width="2"/><path d="M-36 400H8V418H-36Z" fill="#4a2e1e"/>' +
      '<rect x="-46" y="378" width="64" height="18" rx="9" fill="#5a3424"/><path d="M-30 378V396M2 378V396" stroke="#2a1a12" stroke-width="2"/>' +
      '<g transform="translate(120 -186)"><g class="cw-lsw"><path d="M0 0V142" stroke="#2a1a12" stroke-width="2"/><g transform="translate(0 84)">' +
      '<g class="cw-lg"><circle cy="76" r="110" fill="url(#cw-lan)"/><path d="M-6 66H6V86H-6Z" fill="#ffc070" fill-opacity=".8"/></g>' +
      '<path d="M-10 58H10L12 64H-12ZM-12 88H12L9 94H-9Z" fill="#2a1a12"/><path d="M-9 64V88M9 64V88" stroke="#2a1a12" stroke-width="2.4"/></g></g></g>' +
      '<path d="M404 456V-64" stroke="#2a1a12" stroke-width="5"/><circle cx="404" cy="-66" r="4" fill="#5a3a26"/>' +
      `<g class="cw-sock">${sock}<path d="M404 -67V-37" stroke="#8a6a48" stroke-width="3"/></g>` +
      `<g class="cw-wg">${wallWind}</g>` +
      ledgeDrift +
      // Web: the call echoes out across the canyon.
      `<g transform="translate(206 154)">${echoes}</g>` +
      // The rockfall.
      '<ellipse class="cw-dc" cx="30" cy="-120" rx="160" ry="120" fill="url(#cw-dust)"/>' +
      rocks +
      puffs +
      grit +
      '</g>',
    front: grains,
  }
}
