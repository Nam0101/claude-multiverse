import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Pixel Quest: an 8-bit side-scroller at night. A horned pixel boss looms on a stone ledge before a huge dim moon on
// the left, a tiny knight waits on floating brick platforms under it, and a pixel castle with its pennant rises on a
// floating island behind Claude's own floating platform on the right. When a command runs the level scrolls and the
// knight runs and jumps for coins; an error costs a heart and a skull pops; done topples the boss and pixel fireworks
// burst over the castle flag.
const GOLD = '#ffd23f'
const GOLD_D = '#c8941e'
const GOLD_L = '#fff1a8'
const CORAL = '#ff6b57'
const TEAL = '#3fd0b8'
const VIOLET = '#b48cff'
const STONE = '#2c2a4c'
const STONE_L = '#4a4680'
const STONE_D = '#191830'
const MOSS = '#2f9e6a'
const MOSS_L = '#5fd69a'
const NIGHT = '#08081a'

type Palette = Readonly<Record<string, string>>
type Box = readonly [number, number, number, number]

/** Pixel art from rows of characters: one path per colour, a rectangle per run along a row; '.' stays empty. */
function sprite(rows: readonly string[], palette: Palette, s: number, x0 = 0, y0 = 0, attrs = ''): string {
  const runs = new Map<string, string>()

  rows.forEach((row, r) => {
    let c = 0

    while (c < row.length) {
      const ch = row.charAt(c)
      let e = c + 1

      while (e < row.length && row.charAt(e) === ch) {
        e += 1
      }

      if (palette[ch] !== undefined) {
        runs.set(ch, (runs.get(ch) ?? '') + `M${f(x0 + c * s)} ${f(y0 + r * s)}h${f((e - c) * s)}v${f(s)}h${f(-(e - c) * s)}z`)
      }

      c = e
    }
  })

  return [...runs].map(([ch, d]) => `<path d="${d}" fill="${palette[ch] ?? ''}"${attrs}/>`).join('')
}

/** Rows given as their left halves, mirrored into whole symmetric rows. */
const mirrored = (rows: readonly string[]): string[] => rows.map(row => row + [...row].reverse().join(''))

/** Rectangles as one path's data. */
const rects = (list: readonly Box[]): string => list.map(([x, y, w, h]) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`).join('')

/** A disc on a pixel grid: one rectangle per row. */
function disc(cx: number, cy: number, r: number, s: number): string {
  const rows: Box[] = []

  for (let y = -r; y < r; y += s) {
    const mid = y + s / 2
    const half = Math.round(Math.sqrt(Math.max(0, r * r - mid * mid)) / s) * s

    if (half > 0) {
      rows.push([cx - half, cy + y, 2 * half, s])
    }
  }

  return rects(rows)
}

/** `n` square sparks of `size` on a ring of radius `r` around the origin. */
function ring(n: number, r: number, size: number, turn = 0): string {
  return rects(
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + turn

      return [Math.round((Math.cos(a) * r) / 2) * 2 - size / 2, Math.round((Math.sin(a) * r) / 2) * 2 - size / 2, size, size] as const
    }),
  )
}

/** A stepped hill silhouette that repeats every `period`, wide enough to slide one period left. */
function hills(base: number, amp: number, step: number, period: number, phase: number): string {
  const tau = Math.PI * 2
  const at = (x: number) =>
    Math.round(
      (base -
        amp *
          (0.55 * Math.sin((tau * x) / period + phase) +
            0.3 * Math.sin((tau * 2 * x) / period + 1.3 + phase) +
            0.15 * Math.sin((tau * 5 * x) / period + 0.4))) /
        step,
    ) * step
  let top = `M0 ${at(0)}`

  for (let x = 0; x < 1600 + period; x += step) {
    top += `V${at(x)}H${x + step}`
  }

  return `${top}V1000H0Z`
}

const CLOUD = ['....cccc......', '..cccccccc.cc.', '.ccccccccccccc', 'cccccccccccccc', '.ssssssssssss.']

const HERO = ['...HHH...', '..HHHHH..', '..hHvve..', '..hhhhh..', 'sssTTtt..', '.s.TTttg.', '...TTtt..']
const LEGS_A = ['...b..b..', '..bb..bb.']
const LEGS_B = ['....bb...', '....bb...']
const HERO_PAL: Palette = { H: '#c4d0ea', h: '#7a88a8', v: '#0b0b18', e: GOLD, s: '#ff5a4a', T: '#3fb8a8', t: '#2a8478', g: '#c4d0ea', b: '#7a4a30' }


// The boss: a horned brute, drawn as its left half. Its eye sockets are empty; the glowing pupils go over them.
const BOSS = mirrored([
  'h..........',
  'hh.........',
  '.hh........',
  '.Hhh.......',
  '..Hhh..kkkk',
  '...Hhhkbbbb',
  '....HHkbllb',
  '.....kbkbbb',
  '.....kbbkkk',
  '.....kbmmmk',
  '.....kbmmmb',
  '.....kdbbbb',
  '.....kdmmmm',
  '....kkdtmtm',
  '..kkbbddmmm',
  '.kbllbbbddd',
  'kblbbbbbbbg',
  'kbbbkbbbbgg',
  'kbbbkbbbggg',
  'kdbbkbbbbgG',
  'cdbdkdbbbbG',
  'ccd.kddbbbb',
  '....kdbbk..',
  '...kkkkkk..',
])
const BOSS_PAL: Palette = {
  h: '#d9cfb6',
  H: '#8f846c',
  k: '#0d0716',
  b: '#40215e',
  l: '#6a3c94',
  d: '#26133a',
  m: '#050309',
  t: '#ece4d2',
  g: GOLD,
  G: GOLD_D,
  c: '#d9cfb6',
}
const BX = 34
const BY = 200
const BU = 16

const SKULL = ['..BBBBBB..', '.BBBBBBBB.', 'BBBBBBBBBB', 'BkkkBBkkkB', 'BkekBBkekB', 'BBBBkkBBBB', '.BBBBBBBB.', '..BkBBkB..', '...BBBB...']
const HEART = ['.rr.rr.', 'rWrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']
const HEART_PAL: Palette = { r: '#ff4a5a', W: '#ffd0d0' }
const CRATE = ['ooooooooo', 'oggggggGo', 'ogvvWvvGo', 'ogvWvWvGo', 'ogWvvvWGo', 'ogvWvWvGo', 'ogvvWvvGo', 'oGGGGGGGo', 'ooooooooo']
const CRATE_PAL: Palette = { o: '#120c06', g: GOLD, G: GOLD_D, v: '#2a1a40', W: GOLD_L }
const BAT_UP = ['kk.k.k.kk', '.kkekekk.', '...kkk...']
const BAT_DOWN = ['...k.k...', '.kkekekk.', 'kk.kkk.kk']
const CROWN = ['Y.....YY.....Y', 'YY...YyyY...YY', 'YyY.YyyyyY.YyY', 'YyyYyyyyyyYyyY', 'YrYyyYttYyyYrY', 'oooooooooooooo']

// The level strip: three platforms a period, a knight who stays put while they scroll under him, six coins on his
// path. The knight stands at picture x HX; the period's own x 0 sits at SX.
const PERIOD = 480
const SECS = 3.2
const SX = 130
const PLATFORMS = [
  { x: -20, w: 160, top: 880, deep: 64 },
  { x: 180, w: 120, top: 820, deep: 32 },
  { x: 340, w: 90, top: 760, deep: 32 },
] as const
// Each coin: its x in the period, its y, and the fraction of the loop at which the knight reaches it.
const COINS = [
  [80, 852],
  [160, 758],
  [240, 795],
  [320, 688],
  [390, 735],
  [455, 712],
].map(([x, y]) => ({ x: x ?? 0, y: y ?? 0, at: ((x ?? 0) - 42.5) / PERIOD }))

const pct = (u: number): string => f(u * 100) + '%'

/** One coin, five pixels by seven of size `s`, its top-left at (x, y), spinning: gold, a shaded slot, a glint. */
const coin = (x: number, y: number, s = 4): string =>
  `<g class="pq-cs"><path d="${rects([
    [x + s, y, 3 * s, 7 * s],
    [x, y + s, 5 * s, 5 * s],
  ])}" fill="${GOLD}"/><path d="${rects([
    [x + 2 * s, y + 2 * s, s, 3 * s],
    [x + 4 * s, y + 2 * s, s, 4 * s],
    [x + 2 * s, y + 6 * s, 2 * s, s],
  ])}" fill="${GOLD_D}"/><path d="${rects([[x + s, y + s, s, 4 * s]])}" fill="${GOLD_L}"/></g>`

/** The platforms, coins and crates of three periods, for a strip that slides one period left and loops. */
function strip(): { body: string; style: string } {
  const fill: Box[] = []
  const grass: Box[] = []
  const lit: Box[] = []
  let mortar = ''
  let coins = ''
  let style = ''

  for (const k of [-1, 0, 1]) {
    const ox = SX + k * PERIOD

    for (const p of PLATFORMS) {
      const x = ox + p.x

      fill.push([x, p.top + 8, p.w, p.deep])
      grass.push([x, p.top, p.w, 8])
      lit.push([x, p.top, p.w, 2])
      grass.push([x + 8, p.top - 4, 4, 4], [x + p.w - 20, p.top - 4, 4, 4])

      for (let y = p.top + 24; y < p.top + 8 + p.deep; y += 16) {
        mortar += `M${x} ${y}H${x + p.w}`
      }

      for (let y = p.top + 8, row = 0; y < p.top + 8 + p.deep; y += 16, row += 1) {
        for (let bx = x + (row % 2 ? 16 : 32); bx < x + p.w; bx += 32) {
          mortar += `M${bx} ${y}V${y + 16}`
        }
      }
    }

    if (k === -1) {
      continue
    }

    COINS.forEach((c, i) => {
      if (k === 0) {
        coins +=
          `<g class="pq-g${i}">${coin(ox + c.x - 10, c.y - 14)}</g>` +
          `<path class="pq-k pq-k${i}" d="M${ox + c.x - 2} ${c.y - 14}h4v28h-4zM${ox + c.x - 14} ${c.y - 2}h28v4h-28z" fill="${GOLD_L}"/>`
        style +=
          `.st-run .pq-g${i}{animation:pq-g${i} ${SECS}s steps(1) infinite}@keyframes pq-g${i}{0%{opacity:1}${pct(c.at)},100%{opacity:0}}` +
          `.st-run .pq-k${i}{animation:pq-k${i} ${SECS}s steps(1) infinite}@keyframes pq-k${i}{0%{opacity:0}${pct(c.at)}{opacity:1}${pct(c.at + 0.06)},100%{opacity:0}}`
      } else {
        coins += coin(ox + c.x - 10, c.y - 14)
      }
    })

    coins += `<g${k === 0 ? ' class="pq-crate"' : ''}>${sprite(CRATE, CRATE_PAL, 5, ox + 20, 763)}</g>`
  }

  return {
    body:
      `<path d="${rects(fill)}" fill="${STONE}"/><path d="${rects(grass)}" fill="${MOSS}"/><path d="${rects(lit)}" fill="${MOSS_L}"/>` +
      `<path d="${mortar}" stroke="${STONE_D}" stroke-width="2" fill="none"/>` +
      coins,
    style,
  }
}

/** A firework: a shell climbing to (x, y), then two rings of square sparks opening. */
function firework(x: number, y: number, color: string, delay: number): string {
  return (
    `<g transform="translate(${x} ${y})"><rect class="pq-sh" style="--d:${delay}s" x="-3" y="-6" width="6" height="12" fill="${GOLD_L}"/>` +
    `<g class="pq-fw" style="--d:${delay}s"><circle r="96" fill="url(#pq-fwg)"/><path d="${ring(16, 74, 10)}" fill="${color}"/>` +
    `<path d="${ring(10, 42, 10, 0.31)}" fill="${GOLD_L}"/><path d="${ring(16, 104, 6, 0.2)}" fill="${color}" fill-opacity=".65"/></g></g>`
  )
}

/** The castle on its floating island, far right: two towers, the keep, a turret and its pennant. */
function castle(): string {
  const body: Box[] = [
    [1290, 360, 80, 300],
    [1514, 360, 80, 300],
    [1370, 300, 144, 360],
    [1418, 200, 48, 100],
    ...[1290, 1322, 1354, 1514, 1546, 1578].map(x => [x, 336, 16, 24] as const),
    ...[1370, 1402, 1466, 1498].map(x => [x, 276, 16, 24] as const),
  ]
  const light: Box[] = [
    [1290, 336, 6, 324],
    [1370, 276, 6, 84],
    [1418, 200, 6, 76],
    [1514, 336, 6, 324],
  ]
  const shade: Box[] = [
    [1362, 360, 8, 300],
    [1506, 300, 8, 360],
    [1460, 200, 6, 100],
    [1588, 360, 6, 300],
  ]
  const roof: Box[] = [
    [1410, 188, 64, 12],
    [1418, 176, 48, 12],
    [1426, 164, 32, 12],
    [1434, 152, 16, 12],
  ]
  const windows: Box[] = [
    [1322, 396, 16, 24],
    [1322, 480, 16, 24],
    [1546, 396, 16, 24],
    [1546, 480, 16, 24],
    [1394, 340, 12, 24],
    [1478, 340, 12, 24],
    [1436, 224, 12, 20],
    [1436, 420, 12, 24],
  ]
  let courses = ''

  for (let y = 380; y < 660; y += 20) {
    courses += `M1290 ${y}H1594`
  }

  for (let y = 320; y < 360; y += 20) {
    courses += `M1370 ${y}H1514`
  }

  for (let y = 220; y < 300; y += 20) {
    courses += `M1418 ${y}H1466`
  }

  const island = rects([
    [1250, 660, 360, 20],
    [1266, 680, 336, 20],
    [1290, 700, 290, 20],
    [1322, 720, 230, 20],
    [1362, 740, 160, 20],
    [1402, 760, 90, 16],
    [1430, 776, 36, 16],
  ])
  const glows = windows
    .map(([x, y, w, h]) => `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="30" fill="url(#pq-wg)"/>`)
    .join('')
  const pennant = (rows: readonly Box[]) => `<path d="${rects(rows)}" fill="${CORAL}"/>`
  const flagA: Box[] = [
    [1444, 100, 40, 8],
    [1444, 108, 32, 8],
    [1444, 116, 40, 8],
  ]
  const flagB: Box[] = [
    [1444, 100, 36, 8],
    [1444, 108, 28, 8],
    [1444, 116, 44, 4],
    [1444, 120, 36, 8],
  ]

  return (
    `<path d="${island}" fill="#141228"/><path d="M1250 660h360v4h-360z" fill="${MOSS}" fill-opacity=".6"/>` +
    `<path d="${rects([
      [1282, 700, 4, 24],
      [1346, 740, 4, 30],
      [1398, 760, 4, 26],
      [1502, 760, 4, 34],
      [1560, 720, 4, 28],
    ])}" fill="${MOSS}" fill-opacity=".45"/>` +
    `<path d="${rects(body)}" fill="#262443"/><path d="${rects(light)}" fill="#37345e"/><path d="${rects(shade)}" fill="#18172c"/>` +
    `<path d="${courses}" stroke="#17162c" stroke-opacity=".8" stroke-width="2"/>` +
    `<path d="${rects(roof)}" fill="#3b2045"/><path d="M1410 188h64v4h-64z" fill="#5a3366"/>` +
    // The gate, stepped into an arch.
    `<path d="${rects([
      [1418, 584, 48, 76],
      [1426, 576, 32, 8],
      [1434, 568, 16, 8],
    ])}" fill="#07060f"/>` +
    `<g class="pq-win">${glows}<path d="${rects(windows)}" fill="${GOLD}" fill-opacity=".82"/></g>` +
    // The pole, its gold knob and the pennant, which climbs the pole when the boss falls.
    `<path d="M1440 96h4v60h-4z" fill="#8a8aa8"/><path d="M1438 90h8v6h-8z" fill="${GOLD}"/>` +
    `<g class="pq-flag"><g class="pq-fa">${pennant(flagA)}</g><g class="pq-fb2">${pennant(flagB)}</g>` +
    `<path d="M1456 108h8v4h-8zM1452 112h4v4h-4zM1464 112h4v4h-4z" fill="${GOLD}"/></g>`
  )
}

/** The retro computer: a keyboard unit with a cartridge plugged in, and a chunky CRT showing a tiny level. */
function device(light: string, activity: Activity): string {
  const keys = rects(
    Array.from({ length: 16 }, (_, i) => [244 + (i % 8) * 11, i < 8 ? 318 : 324, 8, 3] as const),
  )
  let mini: string

  if (activity === 'error') {
    mini = sprite(['.www.', 'wwwww', 'w.w.w', 'wwwww', '.w.w.'], { w: light }, 4, 358, 246)
  } else if (activity === 'done') {
    mini = `<path d="M366 244h3v46h-3zM369 244h16v4h-4v4h4v4h-16z" fill="${light}"/>`
  } else {
    mini =
      `<path d="M330 286h76v6h-76zM380 266h20v4h-20z" fill="${light}" fill-opacity=".85"/>` +
      `<path d="M368 250h6v8h-6z" fill="${light}"/><path class="pq-mh" d="M342 276h8v10h-8z" fill="${light}"/>`
  }

  return (
    // The monitor on its stand.
    '<path d="M352 312h32v10h-32zM340 322h56v8h-56z" fill="#211c38"/>' +
    '<path d="M318 212h100v100h-100z" fill="#2a2444"/><path d="M318 212h100v6h-100zM318 218h6v94h-6z" fill="#3d3662"/>' +
    '<path d="M412 218h6v94h-6zM324 306h88v6h-88z" fill="#1a162c"/>' +
    '<path d="M330 224h76v70h-76z" fill="#07060f"/>' +
    `<path d="M330 224h76v70h-76z" fill="${light}" fill-opacity=".14"/>` +
    mini +
    `<path d="M330 228H406M330 236H406M330 244H406M330 252H406M330 260H406M330 268H406M330 276H406M330 284H406" stroke="#000" stroke-opacity=".28" stroke-width="2"/>` +
    `<path d="M398 300h8v4h-8z" fill="${light}"/>` +
    // The keyboard unit and its cartridge.
    '<path d="M286 296h30v20h-30z" fill="#4a3a70"/><path d="M290 300h22v8h-22z" fill="' + GOLD + '" fill-opacity=".85"/>' +
    '<path d="M240 314h94v4h-94z" fill="#3d3662"/><path d="M236 318h102v12h-102z" fill="#2a2444"/>' +
    `<path d="${keys}" fill="${light}" fill-opacity=".55"/>`
  )
}

export function pixelQuestWorld(): World {
  const next = random(8128)

  // The sky in flat bands, darkest at the top.
  const bands = Array.from({ length: 10 }, (_, i) => `<rect y="${i * 72}" width="1600" height="73" fill="${mix(NIGHT, '#1d1b36', i / 9)}"/>`).join('')

  // Stars in four twinkle groups; the ones over the chat column are smaller and dimmer.
  const stars = [0, 1, 2, 3]
    .map(g => {
      const list: Box[] = []

      for (let i = 0; i < 14; i += 1) {
        const x = next() * 1600
        const y = 20 + next() * 520
        const inColumn = x > 420 && x < 1180
        const s = inColumn ? 2 : next() > 0.6 ? 6 : 4

        list.push([Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s])
      }

      return `<path class="pq-tw" style="animation-delay:${f(-g * 0.65)}s" d="${rects(list)}" fill="#e8e6ff" fill-opacity=".7"/>`
    })
    .join('')

  const clouds = [
    [40, 70, 1, 1],
    [560, 92, 0.42, 0.8],
    [930, 150, 0.36, 0.7],
    [1210, 46, 1, 1],
    [250, 600, 0.6, 0.8],
  ]
    .map(([x = 0, y = 0, o = 1, sc = 1], i) => {
      const s = 12 * sc

      return (
        `<g class="pq-cl" style="animation-delay:${f(-i * 7)}s;opacity:${o}">` +
        sprite(CLOUD, { c: '#2c2a52', s: '#211f40' }, s, x, y) +
        '</g>'
      )
    })
    .join('')

  // Dim floating islands far off behind the chat column, each with a faint coin.
  const isles = [
    [560, 336, 96],
    [820, 262, 64],
    [1020, 404, 80],
  ]
    .map(
      ([x = 0, y = 0, w = 0], i) =>
        `<g class="pq-isle" style="animation-delay:${f(-i * 1.1)}s"><path d="M${x} ${y}h${w}v12h-${w}zM${x + 8} ${y + 12}h${w - 16}v8h-${w - 16}zM${x + 24} ${y + 20}h${w - 48}v8h-${w - 48}z" fill="#18172e"/>` +
        `<path d="M${x} ${y}h${w}v3h-${w}z" fill="#2a3e48"/>` +
        `<g opacity=".3">${coin(x + w / 2 - 6, y - 26, 2.4)}</g></g>`,
    )
    .join('')

  const far = hills(600, 46, 16, 800, 0.4)
  const near = hills(730, 40, 16, 800, 2.1)

  const level = strip()

  // The boss's ledge, in chunks that fall apart when it is beaten.
  const ledge = Array.from({ length: 7 }, (_, i) => {
    const x = i * 60
    const dx = f((next() - 0.5) * 80)
    const r = f((next() - 0.5) * 60)

    return (
      `<g class="pq-ld" style="--d:${f(1 + i * 0.07)}s;--x:${dx}px;--r:${r}deg">` +
      `<path d="M${x} 584h60v36h-60z" fill="${STONE}"/><path d="M${x} 584h60v4h-60z" fill="${STONE_L}"/>` +
      `<path d="M${x} 602H${x + 60}M${x + 30} 588V602M${x + 14} 602V620M${x + 46} 602V620M${x + 59} 584V620" stroke="${STONE_D}" stroke-width="2"/></g>`
    )
  }).join('')

  // The boss's health bar: twelve segments that drain when it is beaten.
  const hp =
    `<path d="M60 160h300v28h-300z" fill="#0d0716"/><path d="M60 160h300v2h-300zM60 186h300v2h-300zM60 160h2v28h-2zM358 160h2v28h-2z" fill="${GOLD_D}"/>` +
    Array.from({ length: 12 }, (_, i) => `<rect class="pq-hp" style="--d:${f(0.1 + (11 - i) * 0.06)}s" x="${68 + i * 24}" y="167" width="20" height="14" fill="#ff4a5a"/>`).join('')

  const pupils = (x: number) =>
    `<path d="M${x} 350h28v20h-28z" fill="#ff4a5a"/><path d="M${x + 4} 352h8v8h-8z" fill="#ffd0a0"/>`

  const boss =
    `<g class="pq-bf"><g class="pq-bs">` +
    sprite(BOSS.slice(22), BOSS_PAL, BU, BX, BY + 22 * BU) +
    `<g class="pq-bb">` +
    `<circle cx="210" cy="496" r="70" fill="url(#pq-gem)"/>` +
    sprite(BOSS.slice(0, 22), BOSS_PAL, BU, BX, BY) +
    `<g class="pq-eg"><circle cx="172" cy="360" r="54" fill="url(#pq-eye)"/><circle cx="248" cy="360" r="54" fill="url(#pq-eye)"/></g>` +
    `<g class="pq-pu">${pupils(158)}${pupils(234)}</g>` +
    // The roar: the maw drops open on a glowing throat.
    `<g class="pq-roar"><path d="M146 392h128v64h-128z" fill="#050309"/><path d="M170 420h80v28h-80z" fill="#ff7a2a" fill-opacity=".75"/>` +
    `<path d="M150 392h12v14h-12zM182 392h12v14h-12zM226 392h12v14h-12zM258 392h12v14h-12zM166 442h12v14h-12zM242 442h12v14h-12z" fill="#ece4d2"/></g>` +
    `</g></g></g>`

  const hero =
    `<g transform="translate(${SX + 20} 835)"><g class="pq-hy"><g class="pq-hurt">` +
    sprite(HERO, HERO_PAL, 5) +
    `<g class="pq-la">${sprite(LEGS_A, HERO_PAL, 5, 0, 35)}</g><g class="pq-lb">${sprite(LEGS_B, HERO_PAL, 5, 0, 35)}</g>` +
    `</g></g></g>`

  // The heads-up display, top left: three hearts and a tally of coins that fills while the knight runs.
  const heart = (x: number) => sprite(HEART, HEART_PAL, 3, x, 14)
  const hud =
    `<g class="mv-t"><g class="pq-p">${heart(24)}${heart(52)}` +
    sprite(HEART, { r: '#2e1a30', W: '#2e1a30' }, 3, 80, 14) +
    `<g class="pq-hl">${sprite(HEART.map(row => row.slice(0, 4)), HEART_PAL, 3, 80, 14)}</g>` +
    `<g class="pq-hr">${sprite(HEART.map(row => row.slice(4)), HEART_PAL, 3, 92, 14)}</g>` +
    coin(116, 12, 3).replace('pq-cs', 'pq-hc') +
    `<path d="${rects(Array.from({ length: 10 }, (_, i) => [138 + i * 11, 16, 8, 14] as const))}" fill="#26244a"/>` +
    Array.from({ length: 10 }, (_, i) => {
      const c = COINS[i % 6]
      const at = SECS * (Math.floor(i / 6) + (c?.at ?? 0))

      return `<rect class="pq-pip" style="--d:${f(at)}s" x="${138 + i * 11}" y="16" width="8" height="14" fill="${GOLD}"/>`
    }).join('') +
    '</g></g>'

  // Bats that pour out of the turret while Claude searches the web.
  const bats = [0, 1, 2, 3]
    .map(i => {
      const y = 230 + (i % 2) * 34 - i * 12

      return (
        `<g class="pq-bat" style="--d:${f(-i * 1.25)}s"><g transform="translate(${1436 + (i % 2) * 18} ${y})">` +
        `<g class="pq-wu">${sprite(BAT_UP, { k: '#3a2f5e', e: '#ff4a5a' }, 4)}</g>` +
        `<g class="pq-wd">${sprite(BAT_DOWN, { k: '#3a2f5e', e: '#ff4a5a' }, 4)}</g></g></g>`
      )
    })
    .join('')

  // The coins the beaten boss spills.
  const spill = Array.from({ length: 6 }, (_, i) => {
    const dx = f((i - 2.5) * 54 + (next() - 0.5) * 20)
    const dy = f(-150 - next() * 90)

    return `<g class="pq-cb" style="--dx:${dx}px;--dy:${dy}px">${coin(200, 540, 4)}</g>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'bits',
      ink: '#07060f',
      furniture: '#2f2c50',
      metal: '#2a2444',
      paper: '#e8dcc0',
      light: { idle: '#c9a63a', work: GOLD, bright: '#fff2b0' },
      headTop: 192,
      glowAt: [368, 260],
      device,
      wear: {
        // A pixel crown well above the eyes, its three points and two gems.
        front:
          `<g class="cr">${sprite(CROWN, { Y: GOLD, y: '#ffe27a', o: GOLD_D, r: '#ff4a5a', t: TEAL }, 8, 94, 192)}` +
          `<path d="M102 216h4v4h-4zM150 208h4v4h-4zM198 216h4v4h-4z" fill="${GOLD_L}"/></g>`,
      },
      // A treasure chest for a seat.
      seatArt:
        '<g class="cr"><path d="M110 350h82v4h-82zM106 354h90v70h-90z" fill="#3a2430"/>' +
        '<path d="M106 372h90v6h-90zM118 354h8v70h-8zM176 354h8v70h-8z" fill="#d9a62a"/>' +
        '<path d="M106 388H196M106 406H196" stroke="#22141c" stroke-width="2"/>' +
        `<path d="M144 366h14v18h-14z" fill="${GOLD}"/><path d="M150 372h2v8h-2z" fill="#22141c"/>` +
        '<path d="M110 350h82v2h-82z" fill="#5a3a46"/></g>',
      // A desk of stone bricks on two block pillars.
      tableArt:
        `<g class="cr"><path d="M166 330h304v16h-304zM182 346h32v78h-32zM426 346h32v78h-32z" fill="${STONE}"/>` +
        `<path d="M166 330h304v3h-304zM182 346h4v78h-4zM426 346h4v78h-4z" fill="${STONE_L}"/>` +
        `<path d="M198 330V346M230 330V346M262 330V346M294 330V346M326 330V346M358 330V346M390 330V346M422 330V346M454 330V346` +
        `M182 362H214M182 378H214M182 394H214M182 410H214M426 362H458M426 378H458M426 394H458M426 410H458M198 362V378M198 394V410M442 362V378M442 394V410" stroke="${STONE_D}" stroke-width="2"/></g>`,
    },
    style:
      '.pq-p{shape-rendering:crispEdges}' +
      // Ambient: stars, clouds, coins, the boss breathing, the pennant, the windows.
      '.pq-tw{animation:pq-tw 2.6s steps(1) infinite}@keyframes pq-tw{0%{opacity:.3}50%{opacity:1}}' +
      '.st-thinking .pq-tw{animation-duration:1.3s}' +
      '.pq-cl{animation:pq-cl 36s steps(36) infinite alternate}@keyframes pq-cl{to{transform:translateX(60px)}}' +
      '.pq-isle{animation:pq-isle 4s steps(2) infinite alternate}@keyframes pq-isle{to{transform:translateY(-8px)}}' +
      '.pq-cs{transform-box:fill-box;transform-origin:center;animation:pq-cs .9s steps(1) infinite}' +
      '@keyframes pq-cs{0%{transform:scaleX(1)}25%{transform:scaleX(.55)}50%{transform:scaleX(.16)}75%{transform:scaleX(.55)}}' +
      '.pq-bb{animation:pq-bb 1.8s steps(1) infinite}@keyframes pq-bb{50%{transform:translateY(4px)}}' +
      '.pq-eg{animation:pq-eg 2.4s ease-in-out infinite alternate}@keyframes pq-eg{from{opacity:.45}to{opacity:.9}}' +
      '.pq-pu{transform-box:fill-box;transform-origin:center;animation:pq-blink 4.8s steps(1) infinite}' +
      '@keyframes pq-blink{0%,93%{transform:scaleY(1)}94%,98%{transform:scaleY(.2)}}' +
      '.pq-roar{opacity:0}' +
      '.pq-fa{animation:pq-a .7s steps(1) infinite}.pq-fb2{opacity:0;animation:pq-b .7s steps(1) infinite}' +
      '@keyframes pq-a{50%{opacity:0}}@keyframes pq-b{0%{opacity:0}50%{opacity:1}}' +
      '.pq-win{animation:pq-win 2.2s steps(1) infinite}@keyframes pq-win{0%{opacity:.9}40%{opacity:.62}60%{opacity:.82}}' +
      '.pq-lb{opacity:0}.pq-k,.pq-pip,.pq-pop,.pq-fb,.pq-hit,.pq-sk,.pq-bat,.pq-wd,.pq-cb,.pq-fw,.pq-sh{opacity:0}' +
      '.pq-hy{animation:pq-idle 1.6s steps(1) infinite}@keyframes pq-idle{50%{transform:translateY(-2px)}}' +
      // Responding and running: the knight's legs go, the hills slide by.
      '.st-run .pq-la,.st-responding .pq-la{animation:pq-a .26s steps(1) infinite}' +
      '.st-run .pq-lb,.st-responding .pq-lb{animation:pq-b .26s steps(1) infinite}' +
      '.st-responding .pq-h1{animation:pq-h 48s steps(400) infinite}.st-responding .pq-h2{animation:pq-h 24s steps(400) infinite}' +
      '@keyframes pq-h{to{transform:translateX(-800px)}}' +
      // Thinking: the boss looks about.
      '.st-thinking .pq-pu{animation:pq-look 2.4s steps(1) infinite}' +
      '@keyframes pq-look{0%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(0)}75%{transform:translateX(8px)}}' +
      // Tool: the knight butts the crate and a coin pops out.
      '.st-tool .pq-hy{animation:pq-hop 1.1s -.8s infinite}' +
      '@keyframes pq-hop{0%{transform:translateY(0);animation-timing-function:steps(3)}22%,28%{transform:translateY(-27px);animation-timing-function:steps(3)}46%,100%{transform:translateY(0)}}' +
      '.st-tool .pq-crate{animation:pq-bump 1.1s steps(1) -.8s infinite}@keyframes pq-bump{0%,22%{transform:translateY(0)}24%{transform:translateY(-8px)}34%,100%{transform:translateY(0)}}' +
      '.st-tool .pq-pop{animation:pq-pop 1.1s -.8s infinite}' +
      '@keyframes pq-pop{0%,23%{opacity:0;transform:translateY(0)}25%{opacity:1;transform:translateY(0);animation-timing-function:steps(6)}70%{opacity:1;transform:translateY(-60px)}72%,100%{opacity:0;transform:translateY(-60px)}}' +
      // Read: the level map unrolls by the desk.
      '.pq-map{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-read .pq-map{animation:pq-unroll .9s steps(6) both}@keyframes pq-unroll{to{transform:scaleY(1)}}' +
      '.pq-route{stroke-dasharray:6 6;animation:pq-march 1.2s steps(4) infinite}@keyframes pq-march{to{stroke-dashoffset:-12}}' +
      // Web: bats pour out of the turret.
      '.st-web .pq-bat{animation:pq-bat 5s linear infinite;animation-delay:var(--d)}' +
      '@keyframes pq-bat{0%{opacity:0;transform:translate(0,0)}6%,88%{opacity:1}100%{opacity:0;transform:translate(-1120px,-70px)}}' +
      '.st-web .pq-wu{animation:pq-a .3s steps(1) infinite}.st-web .pq-wd{animation:pq-b .3s steps(1) infinite}' +
      // Run: the level scrolls, the knight runs and jumps, coins vanish into the tally.
      `.st-run .pq-strip{animation:pq-scroll ${SECS}s steps(40) infinite}@keyframes pq-scroll{to{transform:translateX(-${PERIOD}px)}}` +
      `.st-run .pq-hy{animation:pq-jump ${SECS}s linear infinite}` +
      // Feet over each platform in turn: A until 17%, B from 33 to 50%, C from 66 to 79%, A again from 91%.
      '@keyframes pq-jump{0%,17.2%{transform:translateY(0)}21%{transform:translateY(-92px)}25%{transform:translateY(-110px)}29%{transform:translateY(-96px)}32.8%,50.5%{transform:translateY(-60px)}' +
      '54.5%{transform:translateY(-152px)}58.3%{transform:translateY(-170px)}62.2%{transform:translateY(-158px)}66.1%,78.6%{transform:translateY(-120px)}' +
      '81%{transform:translateY(-144px)}83%{transform:translateY(-150px)}85.5%{transform:translateY(-140px)}88%{transform:translateY(-100px)}89.5%{transform:translateY(-58px)}90.7%,100%{transform:translateY(0)}}' +
      '.st-run .pq-h1{animation:pq-h 16s steps(200) infinite}.st-run .pq-h2{animation:pq-h 7s steps(200) infinite}' +
      // The boss stomps on its ledge while the knight runs, and its eyes burn.
      '.st-run .pq-bs{animation:pq-stomp 1.6s infinite}' +
      '@keyframes pq-stomp{0%,20%{transform:translateY(0);animation-timing-function:steps(3)}36%{transform:translateY(-22px);animation-timing-function:steps(2)}44%,100%{transform:translateY(0)}}' +
      '.st-run .pq-eg{animation:none;opacity:1}' +
      '.pq-dust{opacity:0}.st-run .pq-dust{animation:pq-dust 1.6s steps(4) infinite}' +
      '@keyframes pq-dust{0%,43%{opacity:0;transform:translate(0,0)}45%{opacity:.8;transform:translate(0,0)}80%,100%{opacity:0;transform:translate(var(--x),-16px)}}' +
      '.st-run .pq-pip{animation:pq-on .01s steps(1) both;animation-delay:var(--d)}@keyframes pq-on{to{opacity:1}}' +
      '.st-run .pq-mh{animation:pq-mh .5s steps(1) infinite}@keyframes pq-mh{50%{transform:translateY(-10px)}}' +
      level.style +
      // Error: the boss roars and spits a fireball, the knight is hit, a heart breaks, a skull pops.
      '.st-error .pq-roar{animation:pq-on .01s steps(1) .05s both}' +
      '.st-error .pq-bs{animation:pq-sh .16s steps(2) 10}@keyframes pq-sh{from{transform:translateX(-5px)}to{transform:translateX(5px)}}' +
      '.st-error .pq-pu{animation:none;transform:scale(1.25)}.st-error .pq-eg{animation:none;opacity:1}' +
      '.st-error .pq-fb{animation:pq-fb .7s steps(7) .15s both}' +
      '@keyframes pq-fb{0%{opacity:1;transform:translate(0,0)}99%{opacity:1;transform:translate(-38px,430px)}100%{opacity:0;transform:translate(-38px,430px)}}' +
      '.pq-hit,.pq-sk,.pq-hl,.pq-hr,.pq-pd{transform-box:fill-box;transform-origin:center}' +
      '.st-error .pq-hit{animation:pq-hit .5s steps(4) .85s both}@keyframes pq-hit{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(1.4)}}' +
      '.st-error .pq-hurt{animation:pq-hurt .4s steps(1) .85s 2}@keyframes pq-hurt{50%{opacity:.15}}' +
      '.st-error .pq-hy{animation:pq-die 1.3s 1.7s both}' +
      '@keyframes pq-die{0%{transform:translateY(0);animation-timing-function:steps(3)}25%{transform:translateY(-56px);animation-timing-function:steps(8)}100%{transform:translateY(260px)}}' +
      '.st-error .pq-sk{animation:pq-sk .5s steps(4) .9s both}@keyframes pq-sk{0%{opacity:1;transform:scale(.2)}60%{opacity:1;transform:scale(1.18)}100%{opacity:1;transform:scale(1)}}' +
      '.st-error .pq-skb{animation:pq-skb .8s steps(1) 1.4s infinite}@keyframes pq-skb{50%{transform:translateY(-6px)}}' +
      '.st-error .pq-hl{animation:pq-hl .9s steps(6) .85s both}@keyframes pq-hl{to{opacity:0;transform:translate(-10px,30px) rotate(-35deg)}}' +
      '.st-error .pq-hr{animation:pq-hr .9s steps(6) .85s both}@keyframes pq-hr{to{opacity:0;transform:translate(10px,30px) rotate(35deg)}}' +
      // Done: the bar drains, the boss shakes and topples off its crumbling ledge, coins spill, the pennant climbs
      // the pole and fireworks open over it.
      '.st-done .pq-hp{animation:pq-off .01s steps(1) both;animation-delay:var(--d)}@keyframes pq-off{to{opacity:0}}' +
      '.st-done .pq-bs{animation:pq-sh .16s steps(2) .5s 6}' +
      '.st-done .pq-pu{animation:pq-off .01s steps(1) .9s both}.st-done .pq-eg{animation:pq-off .01s steps(1) .9s both}' +
      '.pq-bf{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-done .pq-bf{animation:pq-fall 1.3s steps(10) 1s both}@keyframes pq-fall{to{transform:translate(-30px,720px) rotate(-28deg);opacity:0}}' +
      '.pq-ld{transform-box:fill-box;transform-origin:center}' +
      '.st-done .pq-ld{animation:pq-ld 1s steps(6) both;animation-delay:var(--d)}@keyframes pq-ld{to{transform:translate(var(--x),420px) rotate(var(--r));opacity:0}}' +
      '.st-done .pq-cb{animation:pq-cb 1.5s steps(10) 1.9s both}' +
      '@keyframes pq-cb{0%{opacity:1;transform:translate(0,0)}45%{opacity:1;transform:translate(calc(var(--dx) * .6),var(--dy))}100%{opacity:0;transform:translate(var(--dx),160px)}}' +
      '.st-done .pq-hy{animation:pq-joy .6s steps(3) .3s infinite alternate}@keyframes pq-joy{to{transform:translateY(-30px)}}' +
      '.st-done .pq-flag{animation:pq-raise 1.2s steps(7) .2s both}@keyframes pq-raise{from{transform:translateY(46px)}}' +
      '.st-done .pq-win{animation:none;opacity:1}' +
      '.st-done .pq-sh{animation:pq-shell 2.4s infinite;animation-delay:var(--d)}' +
      '@keyframes pq-shell{0%{opacity:1;transform:translateY(150px);animation-timing-function:steps(6)}28%{opacity:1;transform:translateY(0)}29%,100%{opacity:0;transform:translateY(0)}}' +
      '.pq-fw{transform-box:fill-box;transform-origin:center}' +
      '.st-done .pq-fw{animation:pq-fw 2.4s infinite;animation-delay:var(--d)}' +
      '@keyframes pq-fw{0%,28%{opacity:0;transform:scale(.25)}30%{opacity:1;transform:scale(.45);animation-timing-function:steps(5)}72%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.12)}}' +
      '.pq-fl{animation:pq-fl 2.4s steps(2) infinite alternate}@keyframes pq-fl{to{transform:translateY(-6px)}}',
    scenery:
      '<defs>' +
      '<radialGradient id="pq-moon"><stop offset=".5" stop-color="#3a3470" stop-opacity=".22"/><stop offset="1" stop-color="#3a3470" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pq-eye"><stop offset="0" stop-color="#ff4a5a" stop-opacity=".55"/><stop offset="1" stop-color="#ff4a5a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="pq-gem"><stop offset="0" stop-color="${GOLD}" stop-opacity=".4"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="pq-wg"><stop offset="0" stop-color="${GOLD}" stop-opacity=".3"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="pq-fwg"><stop offset="0" stop-color="#fff1a8" stop-opacity=".22"/><stop offset="1" stop-color="#fff1a8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pq-fire"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".6"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="pq-clip"><rect x="0" y="600" width="436" height="400"/></clipPath>' +
      '</defs>' +
      bands +
      `<g class="pq-p">${stars}` +
      // The moon behind the boss, rim-lit at its upper left.
      '<circle cx="210" cy="360" r="330" fill="url(#pq-moon)"/>' +
      `<path d="${disc(202, 352, 192, 16)}" fill="#2b2752"/><path d="${disc(210, 360, 192, 16)}" fill="#211e3e"/>` +
      `<path d="${disc(110, 300, 28, 8)}${disc(320, 260, 20, 8)}${disc(330, 470, 34, 8)}" fill="#1b1936"/>` +
      clouds +
      isles +
      `<g class="pq-h1"><path d="${far}" fill="#131230" stroke="#24224a" stroke-width="4"/></g>` +
      `<g class="pq-h2"><path d="${near}" fill="#0c0b1e" stroke="#1b1a3a" stroke-width="4"/></g>` +
      `<g class="mv-r">${castle()}` +
      firework(1442, 112, GOLD, 0.1) +
      firework(1322, 196, TEAL, 0.6) +
      firework(1554, 180, CORAL, 1.2) +
      firework(1376, 96, VIOLET, 1.8) +
      bats +
      '</g>' +
      hp +
      boss +
      ledge +
      // Dust kicked off the ledge when the boss stomps.
      [-1, 1]
        .map(side => `<g transform="translate(${210 + side * 120} 580)"><path class="pq-dust" style="--x:${side * 34}px" d="${rects([
          [-12, -8, 8, 8],
          [4, -14, 6, 6],
          [-2, -24, 6, 6],
        ])}" fill="#8a84b8"/></g>`)
        .join('') +
      // The level: platforms scrolling under the knight, a crate that pays out, the fireball and the skull.
      `<g class="mv-b"><g clip-path="url(#pq-clip)"><g class="pq-strip">${level.body}</g>` +
      hero +
      `<g class="pq-pop">${coin(162, 744)}</g>` +
      `<g transform="translate(172 852)"><path class="pq-hit" d="${ring(8, 26, 8)}" fill="#ff9a3a"/></g></g>` +
      `<g class="pq-sk"><g class="pq-skb">${sprite(SKULL, { B: '#e8e0cc', k: '#0b0716', e: '#ff4a5a' }, 10, 122, 646)}</g></g>` +
      '</g>' +
      `<g class="pq-fb"><circle cx="210" cy="420" r="40" fill="url(#pq-fire)"/><path d="M202 386h12v12h-12z" fill="#ff7a2a" fill-opacity=".6"/><path d="M206 372h8v8h-8z" fill="#ff7a2a" fill-opacity=".35"/>` +
      sprite(['.oo.', 'oyyo', 'oyyo', '.oo.'], { o: '#ff7a2a', y: GOLD_L }, 8, 194, 404) +
      '</g>' +
      spill +
      hud +
      '</g>',
    nook:
      '<g class="pq-p">' +
      // Claude's floating platform: a mossy brick slab with a stepped underside, bits of rock drifting beside it.
      `<path d="M6 432h474v80h-410v-20h-32v-20h-32z" fill="#241f3a"/>` +
      `<path d="M6 448H480M38 464H480M70 480H480M40 432V448M104 432V448M168 432V448M232 432V448M296 432V448M360 432V448M424 432V448M72 448V464M136 448V464M200 448V464M264 448V464M328 448V464M392 448V464" stroke="#15122a" stroke-width="2"/>` +
      `<path d="M6 424h474v8h-474zM20 420h4v4h-4zM60 418h4v6h-4zM228 420h4v4h-4zM300 418h4v6h-4zM404 420h4v4h-4z" fill="${MOSS}"/>` +
      `<path d="M6 424h474v2h-474z" fill="${MOSS_L}"/>` +
      `<g class="pq-fl"><path d="M-38 400h18v18h-18zM-66 432h12v12h-12z" fill="${STONE}"/><path d="M-38 400h18v3h-18zM-66 432h12v3h-12z" fill="${STONE_L}"/></g>` +
      `<g class="pq-fl" style="animation-delay:-1.2s"><path d="M-22 450h10v10h-10z" fill="${STONE}"/></g>` +
      // The level map, unrolled while Claude reads: invented marks, a dotted route between stages.
      '<path d="M236 -22h148v8h-148z" fill="#3a2430"/>' +
      '<g class="pq-map"><path d="M242 -14h136v136h-136z" fill="#e8dcc0" fill-opacity=".92"/>' +
      '<path d="M242 -14h136v4h-136zM242 118h136v4h-136z" fill="#b8a888"/>' +
      '<path class="pq-route" d="M260 100H300V60H340V20H364" fill="none" stroke="#7a5a40" stroke-width="4"/>' +
      '<path d="M254 92h12v12h-12zM294 52h12v12h-12zM334 12h12v12h-12z" fill="#5a3a66"/>' +
      `<path d="M356 4h16v20h-16zM352 0h4v4h-4zM372 0h4v4h-4zM360 -4h8v4h-8z" fill="${CORAL}"/>` +
      '<path d="M250 6h8v4h-8zM262 6h16v4h-16zM250 18h20v4h-20zM312 92h24v4h-24zM312 104h16v4h-16z" fill="#7a6a58"/></g>' +
      '</g>',
  }
}
