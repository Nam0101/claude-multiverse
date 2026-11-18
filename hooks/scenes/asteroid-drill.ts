import type { Activity } from '../../types'
import { f, gear, rain, random } from './kit'
import type { World } from './world'

// Asteroid Drill: a drill crew's camp on a jagged asteroid hurtling toward a big blue planet. In the left third a
// lattice derrick under orange floodlights stands on a plateau beside a needle spire and a parked mining tug; rock
// shards tumble past, star streaks show the speed, and a stack light on the derrick counts down. Claude wears an
// armored space helmet with a lamp and works the drill console. A command spins the drill up: the derrick shakes and
// chips, sparks and dust spray from the bore. An error is a gas-pocket blowout beside the rig with the pressure gauge
// in the red; done glows the buried charge, a calm bright line runs down the fault, the tug lifts off and the asteroid
// splits in two.
const ORANGE = '#ff9d3a'
const HOT = '#ffdcae'
const RED = '#ff5442'
const GREEN = '#5fe39a'
const SIGNAL = '#9fd4ff'
const SUN = '#e2be92'
const METAL = '#2c3038'
const EDGE = '#525866'
const SHELL = '#565c68'
const SHELL_EDGE = '#262a32'

type Pt = readonly [number, number]

const line = (pts: readonly Pt[]): string => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')

/** A rough rock of radius `r` around (cx, cy). */
function rock(next: () => number, r: number, cx = 0, cy = 0, n = 6): string {
  const pts: Pt[] = []

  for (let i = 0; i < n; i += 1) {
    const a = ((i + next() * 0.6) / n) * Math.PI * 2
    const k = r * (0.55 + next() * 0.45)

    pts.push([Math.round(cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k)])
  }

  return line(pts) + 'Z'
}

// The fault the charge splits, from the notch between the spire and the plateau down to the foot of the crag; the
// two halves of the crag on either side of it.
const SEAM: Pt[] = [[258, 452], [270, 500], [262, 560], [284, 620], [300, 700], [296, 770], [316, 840], [310, 920], [330, 1010]]
const LEFT: Pt[] = [[-80, 1010], [-80, 448], [-30, 438], [10, 444], [52, 434], [96, 440], [140, 432], [190, 440], [228, 434], [252, 444]]
// The needle spire rises behind the shelf, so the tug can park in front of its foot.
const SPIRE: Pt[] = [[146, 446], [166, 400], [176, 360], [188, 318], [194, 262], [206, 196], [216, 238], [228, 276], [234, 334], [246, 384], [258, 446]]
const SPIRE_D = line(SPIRE) + 'Z'
const RIGHT: Pt[] = [
  [290, 458], [322, 452], [360, 456], [396, 452], [414, 460], [432, 494], [446, 536], [466, 598], [488, 660], [506, 718],
  [530, 786], [556, 856], [584, 926], [612, 1010],
]
const LEFT_D = line([...LEFT, ...SEAM]) + 'Z'
const RIGHT_D = line([...SEAM.slice(0, 1), ...RIGHT, ...SEAM.slice(1).reverse()]) + 'Z'
const CHARGE: Pt = [300, 700]
/** How far right the tug parks, so a 4:3 window still shows it; its dish then sits at x 74 + TUG_X. */
const TUG_X = 92
const BORE: Pt = [334, 452]

/** The lattice derrick over the bore: legs, braces, crown, the drill string and its top drive, floodlights, beacon. */
function derrick(): string {
  const levels = [452, 396, 340, 284, 228, 172, 118]
  const xl = (y: number) => 282 + (38 * (452 - y)) / 334
  const xr = (y: number) => 386 - (38 * (452 - y)) / 334
  let braces = ''

  levels.forEach((y, i) => {
    braces += `M${f(xl(y))} ${y}H${f(xr(y))}`
    const up = levels[i + 1]

    if (up !== undefined) {
      braces += `M${f(xl(y))} ${y}L${f(xr(up))} ${up}M${f(xr(y))} ${y}L${f(xl(up))} ${up}`
    }
  })

  const lamp = (x: number, flip: number) =>
    `<g transform="translate(${x} 328) scale(${flip} 1)"><path d="M-2 -6H10L14 6H-2Z" fill="#2a2b31" stroke="${EDGE}" stroke-width="1.5"/>` +
    `<path d="M9 4H15L13 8H8Z" fill="${HOT}"/></g>`

  return (
    // The light the floods throw on the plateau.
    `<g class="ad-fl"><path d="M300 334L258 458H334Z" fill="url(#ad-cone)"/><path d="M368 334L334 458H414Z" fill="url(#ad-cone)"/>` +
    `<ellipse cx="${BORE[0]}" cy="458" rx="118" ry="16" fill="url(#ad-pool)"/></g>` +
    `<path d="M334 120V452" stroke="#7a7068" stroke-width="3"/>` +
    `<g class="ad-td"><rect x="322" y="150" width="24" height="34" rx="3" fill="#3a3a42" stroke="${ORANGE}" stroke-opacity=".55" stroke-width="1.5"/>` +
    `<rect x="326" y="158" width="16" height="4" fill="${ORANGE}" fill-opacity=".8"/></g>` +
    `<path d="${braces}" fill="none" stroke="url(#ad-lat)" stroke-width="2.2"/>` +
    '<path d="M282 452L320 118M386 452L348 118" stroke="url(#ad-lat)" stroke-width="5" stroke-linecap="round"/>' +
    `<rect x="308" y="104" width="52" height="16" rx="2" fill="#2a2b31" stroke="${EDGE}" stroke-width="1.5"/><circle cx="334" cy="112" r="5" fill="none" stroke="#8a8490" stroke-width="2"/>` +
    lamp(294, -1) +
    lamp(374, 1) +
    `<rect x="268" y="444" width="132" height="12" rx="2" fill="#1e1d22" stroke="#3a3a42" stroke-width="1.5"/>` +
    `<g transform="translate(${BORE[0]} 446)"><path class="ad-rot" d="${gear(15, 10)}" fill="#4a4650" fill-rule="evenodd"/></g>` +
    // The beacon on the crown: orange, red on an error.
    '<circle class="ad-bcn" cx="334" cy="96" r="30" fill="url(#ad-bk)"/><circle class="ad-red" cx="334" cy="96" r="30" fill="url(#ad-rk)"/>' +
    `<rect x="330" y="92" width="8" height="10" rx="2" fill="${ORANGE}"/>` +
    // The chase lights that climb the legs while the drill works.
    `<circle class="ad-ch" style="--dx:38px" cx="282" cy="452" r="3" fill="${HOT}"/><circle class="ad-ch" style="--dx:-38px;animation-delay:-.8s" cx="386" cy="452" r="3" fill="${HOT}"/>`
  )
}

/** The stack light beside the derrick: six lamps that go out one by one, and turn green when the charge is set. */
function stackLight(): string {
  const lamps = Array.from({ length: 6 }, (_, i) => {
    const y = 364 + i * 12

    return (
      `<rect class="ad-ck ad-ck${i}" x="399" y="${y}" width="10" height="8" rx="1.5" fill="${ORANGE}"/>` +
      `<rect class="ad-ckg" style="--i:${5 - i}" x="399" y="${y}" width="10" height="8" rx="1.5" fill="${GREEN}"/>`
    )
  }).join('')

  return `<path d="M404 456V352" stroke="#2a2b31" stroke-width="4"/><rect x="396" y="358" width="16" height="80" rx="3" fill="#15151a" stroke="#3a3a42" stroke-width="1.5"/>${lamps}`
}

/** The mining tug parked on the shelf: a boxy hull, lit windows, landing legs, a dish on top and thrusters below. */
function tug(): string {
  return (
    '<g class="ad-tug">' +
    '<path class="ad-flame" d="M46 426L57 488L68 426Z" fill="url(#ad-flg)"/><path class="ad-flame" d="M110 426L121 488L132 426Z" fill="url(#ad-flg)"/>' +
    '<path d="M40 412L24 438H40M136 412L152 438H136M88 418V438" fill="none" stroke="#3a3c44" stroke-width="4"/>' +
    '<g fill="#25262c" stroke="#45474f" stroke-width="1.5"><rect x="44" y="412" width="26" height="14" rx="3"/><rect x="108" y="412" width="26" height="14" rx="3"/></g>' +
    '<path d="M18 386L34 362H128L156 378V404L140 418H30L18 404Z" fill="#2b2c33" stroke="#4e515c" stroke-width="2"/>' +
    `<path d="M18 386L34 362H128" fill="none" stroke="${SUN}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M132 368L152 380V392H132Z" fill="${ORANGE}" fill-opacity=".75"/>` +
    `<g fill="${ORANGE}" fill-opacity=".6"><rect x="56" y="380" width="9" height="6" rx="1"/><rect x="74" y="380" width="9" height="6" rx="1"/><rect x="92" y="380" width="9" height="6" rx="1"/><rect x="110" y="380" width="9" height="6" rx="1"/></g>` +
    `<path d="M30 404H140" stroke="${ORANGE}" stroke-opacity=".5" stroke-width="4" stroke-dasharray="6 5"/>` +
    '<path d="M74 362V350" stroke="#6a6e78" stroke-width="2"/>' +
    '<g transform="translate(74 350)"><g class="ad-dish"><path d="M-12 -6Q0 6 12 -6" fill="none" stroke="#8a8f9a" stroke-width="3"/><path d="M0 0V-12" stroke="#8a8f9a" stroke-width="1.6"/>' +
    `<circle cy="-13" r="2" fill="${SIGNAL}"/></g></g>` +
    `<circle class="ad-bcn" cx="112" cy="360" r="3" fill="${ORANGE}"/>` +
    '</g>'
  )
}

/** The blue planet ahead, its day side to the upper left, clouds drifting, a thin bright atmosphere. */
function planet(next: () => number): string {
  const clouds = Array.from({ length: 9 }, () => {
    const x = 1230 + next() * 360
    const y = -40 + next() * 520
    const a = -24 + next() * 30

    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(40 + next() * 90)}" ry="${f(7 + next() * 12)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="#eaf3ff" fill-opacity="${f(0.2 + next() * 0.2)}"/>`
  }).join('')
  const lands =
    '<g fill="#4d7a52" fill-opacity=".5"><path d="M1240 120Q1270 60 1330 80Q1380 70 1370 130Q1350 190 1300 200Q1250 210 1240 120Z"/>' +
    '<path d="M1290 300Q1340 260 1390 290Q1420 340 1380 380Q1330 410 1300 370Q1270 340 1290 300Z"/><path d="M1440 40Q1490 20 1520 60Q1500 100 1460 96Q1430 80 1440 40Z"/></g>'

  return (
    '<g class="mv-r"><g class="mv-t">' +
    '<circle class="ad-atm" cx="1500" cy="230" r="362" fill="url(#ad-halo)"/>' +
    '<circle cx="1500" cy="230" r="310" fill="url(#ad-oc)"/>' +
    `<g clip-path="url(#ad-pc)"><g class="ad-cld">${lands}${clouds}` +
    '<path d="M1352 150a22 22 0 1 1 -18 -26a36 36 0 1 1 26 52" fill="none" stroke="#eaf3ff" stroke-opacity=".32" stroke-width="7" stroke-linecap="round"/></g></g>' +
    '<circle cx="1500" cy="230" r="310" fill="url(#ad-night)"/>' +
    '<circle class="ad-atm" cx="1500" cy="230" r="309" fill="none" stroke="#9fd8ff" stroke-opacity=".4" stroke-width="2.5"/>' +
    '</g></g>'
  )
}

/** The drill console: a screen with a depth bar and a trace, a countdown row, two pressure gauges and a lever. */
function device(light: string, activity: Activity): string {
  // Each needle's class and its resting angle, which a portal without the world's CSS shows.
  const [needle, rest] =
    activity === 'error'
      ? ['ad-spike', 110]
      : activity === 'done'
        ? ['ad-calm', -32]
        : activity === 'run'
          ? ['ad-high', 40]
          : activity === 'tool'
            ? ['ad-busy', 8]
            : ['ad-wob', -30]
  const lamp = activity === 'done' ? GREEN : activity === 'error' ? RED : ORANGE
  const tick = activity === 'done' ? '' : activity === 'error' ? ' class="ad-red"' : ' class="ad-dt"'
  const lamps = Array.from(
    { length: 5 },
    (_, i) => `<rect${tick} style="animation-delay:${f(-i * 0.3)}s" x="${316 + i * 18}" y="286" width="9" height="5" rx="1" fill="${lamp}"/>`,
  ).join('')
  const gauge = (cx: number, delay: number) =>
    `<circle cx="${cx}" cy="312" r="12" fill="#0b0c10" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M${cx + 7.8} 307.5A9 9 0 0 1 ${cx + 7.8} 316.5" fill="none" stroke="${RED}" stroke-width="3"/>` +
    `<path d="M${cx - 7.8} 307.5A9 9 0 0 1 ${cx} 303" fill="none" stroke="${GREEN}" stroke-opacity=".7" stroke-width="2.4"/>` +
    `<g transform="translate(${cx} 312)"><g class="${needle}" transform="rotate(${rest})" style="animation-delay:${delay}s"><path d="M0 2V-10" stroke="#ffe8c8" stroke-width="2" stroke-linecap="round"/></g></g>` +
    `<circle cx="${cx}" cy="312" r="2" fill="#8a919e"/>`
  const bar = activity === 'run' || activity === 'tool' ? ' class="ad-db"' : ''

  return (
    `<rect x="302" y="226" width="110" height="104" rx="6" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M306 232H408" stroke="#ffffff" stroke-opacity=".08" stroke-width="2"/>` +
    `<rect x="310" y="234" width="94" height="46" rx="3" fill="${light}" fill-opacity=".2" stroke="${light}" stroke-opacity=".75" stroke-width="2"/>` +
    `<rect${bar} x="316" y="240" width="6" height="34" fill="${light}" fill-opacity=".85"/>` +
    `<path class="ad-wv" d="M330 258l6 -6l6 10l6 -12l6 8l6 -4l6 9l6 -7l6 5l6 -3l6 2l4 -2" fill="none" stroke="${light}" stroke-width="1.6" stroke-linejoin="round"/>` +
    lamps +
    gauge(330, 0) +
    gauge(386, -0.7) +
    `<rect x="354" y="298" width="6" height="26" rx="2" fill="#0b0c10"/><circle cx="357" cy="${activity === 'run' ? 318 : 304}" r="5" fill="${ORANGE}"/>` +
    // The keys in front.
    `<path d="M236 330L246 312H326L332 330Z" fill="#363b45" stroke="${EDGE}" stroke-width="1.5"/>` +
    `<g fill="${light}" fill-opacity=".5">${[250, 264, 278, 292, 306].map(x => `<rect x="${x}" y="320" width="9" height="3"/>`).join('')}</g>`
  )
}

export function asteroidDrillWorld(): World {
  const next = random(5150)

  // Stars as round dots on zero-length strokes: three paths, the brightest twinkling.
  const stars: string[][] = [[], [], []]

  for (let i = 0; i < 120; i += 1) {
    stars[i % 3]!.push(`M${f(next() * 1600)} ${f(next() * 780)}h0`)
  }

  const shards = Array.from({ length: 12 }, (_, i) => {
    const big = i < 3
    const r = big ? 30 + next() * 20 : 7 + next() * 13
    const d = big ? 50 + next() * 16 : 18 + next() * 18
    const spin = i % 2 ? 'mv-spin' : 'mv-spin-back'

    return (
      `<g transform="translate(${Math.round(1740 + next() * 80)} ${Math.round(30 + next() * 380)})">` +
      `<g class="ad-sh" style="--d:${f(d)}s;--dy:${Math.round(60 + next() * 170)}px;animation-delay:${f(-next() * d)}s">` +
      `<path class="ad-tm" style="animation-name:${spin};animation-duration:${Math.round(7 + next() * 14)}s" d="${rock(next, r)}"/></g></g>`
    )
  }).join('')

  // The near floor: a jagged rim of rock across the foot of the picture, with boulders.
  const floorPts: Pt[] = []

  for (let x = -60; x <= 1680; x += 46) {
    floorPts.push([x + next() * 18, 890 + next() * 26])
  }

  const boulders = [40, 150, 380, 520, 760, 1010, 1240, 1420, 1560].map(x => rock(next, 14 + next() * 22, x, 912 + next() * 30)).join('')

  // Crag details: sunlit facets on the left face, craters, cracks.
  const craters = (
    [
      [60, 600, 34],
      [150, 770, 40],
      [36, 880, 26],
      [392, 610, 32],
      [440, 770, 26],
      [370, 870, 40],
    ] as const
  )
    .map(
      ([x, y, r]) =>
        `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.34)}" fill="#0a080b"/>` +
        `<path d="M${x - r * 0.8} ${f(y + r * 0.14)}Q${x} ${f(y + r * 0.5)} ${x + r * 0.9} ${f(y - r * 0.05)}" fill="none" stroke="${SUN}" stroke-opacity=".22" stroke-width="2"/>`,
    )
    .join('')

  // Thinking: pebbles lift off the ground in the low gravity.
  const pebbles = (
    [
      [300, 452, -30], [352, 454, 24], [392, 450, 40], [276, 450, -50], [40, 438, 20], [120, 436, -24],
      [70, 906, 30], [200, 916, -36], [360, 908, 18], [470, 920, -20],
    ] as const
  )
    .map(([x, y, dx], i) => `<path class="ad-peb" style="--dx:${dx}px;animation-delay:${f(-i * 0.55)}s" d="${rock(next, 4 + next() * 5, x, y, 5)}"/>`)
    .join('')

  // Run: chips and sparks from the bore, cuttings spraying out sideways, dust rising, a ring of grit.
  const chips = Array.from({ length: 20 }, (_, i) => {
    const dx = Math.round((next() - 0.5) * 520)
    const dy = Math.round(-100 - next() * 230)

    return `<path class="ad-chip" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${f(-i * 0.065)}s" d="${rock(next, 4 + next() * 6, 0, 0, 5)}"/>`
  }).join('')
  const sparks = Array.from(
    { length: 12 },
    (_, i) => `<path class="ad-spk" style="--r:${Math.round(-80 + i * 14.5 + next() * 6)}deg;animation-delay:${f(-next() * 0.7)}s" d="M0 -4V-20"/>`,
  ).join('')
  const dust = [0, 1, 2, 3]
    .map(i => `<ellipse class="ad-dust" style="--dx:${(i - 1.5) * 70}px;animation-delay:${f(-i * 0.6)}s" cx="${BORE[0]}" cy="436" rx="66" ry="40"/>`)
    .join('')

  // Error: rocks thrown out of the blowout.
  const thrown = Array.from({ length: 14 }, (_, i) => {
    const dx = Math.round(-200 + next() * 330)
    const dy = Math.round(-180 - next() * 220)

    return `<path class="ad-thr" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${f(0.1 + (i % 7) * 0.14)}s" d="${rock(next, 5 + next() * 8, 0, 0, 5)}"/>`
  }).join('')

  // Outgassing vents: plumes that stream off behind the asteroid as it flies.
  const plume = (x: number, y: number, delay: number) =>
    `<g fill="url(#ad-gas)">${[0, 1].map(k => `<ellipse class="ad-pl" style="animation-delay:${f(delay - k * 2.5)}s" cx="${x}" cy="${y - 20}" rx="15" ry="22"/>`).join('')}</g>`

  const drone = (x: number, y: number, delay: number) =>
    `<g transform="translate(${x} ${y})"><g class="ad-drn" style="animation-delay:${delay}s"><rect x="-8" y="-3" width="16" height="6" rx="2" fill="#2e3038" stroke="${EDGE}"/>` +
    `<path d="M-12 -5H-4M4 -5H12" stroke="#8a8f9a" stroke-width="1.6"/><circle cy="4" r="1.8" fill="${ORANGE}"/></g></g>`

  const seamUp = line([...SEAM.slice(0, 5)].reverse())
  const seamDown = line(SEAM.slice(4))
  const seamAll = line(SEAM)

  const countKeys = Array.from(
    { length: 6 },
    (_, i) => `.ad-ck${i}{animation-name:ad-ck${i}}@keyframes ad-ck${i}{0%{opacity:1}${f(((i + 1) * 100) / 7)}%,100%{opacity:.12}}`,
  ).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'dust',
      ink: '#040507',
      furniture: '#1f1e23',
      metal: METAL,
      paper: '#e6dccb',
      light: { idle: '#c98236', work: ORANGE, bright: '#ffd7a0' },
      headTop: 182,
      glowAt: [356, 258],
      device,
      wear: {
        behind:
          // The life-support pack and its hose into the helmet.
          `<rect x="34" y="232" width="32" height="96" rx="6" fill="#3a3f4a" stroke="${SHELL_EDGE}" stroke-width="2"/>` +
          `<rect x="40" y="244" width="18" height="6" rx="1" fill="${ORANGE}" fill-opacity=".85"/><rect x="40" y="256" width="18" height="3" fill="#6a707c"/>` +
          '<path d="M48 232C48 214 56 206 68 206" fill="none" stroke="#2e323a" stroke-width="5"/>',
        front:
          // The glass: wider than the head, barely tinted, so the face and its eyes show through.
          `<rect x="62" y="204" width="176" height="122" rx="24" fill="#bfe6ff" fill-opacity=".1" stroke="#8a97a8" stroke-opacity=".85" stroke-width="4"/>` +
          '<path d="M208 226C222 230 230 240 232 256M222 270V290" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/>' +
          // The armored dome with its orange band, all above row 1.
          `<path d="M60 236V216C60 186 100 172 150 172C200 172 240 186 240 216V236C206 226 94 226 60 236Z" fill="${SHELL}" stroke="${SHELL_EDGE}" stroke-width="2"/>` +
          `<path d="M61 214C64 196 100 188 150 188C200 188 236 196 239 214" fill="none" stroke="${ORANGE}" stroke-width="6"/>` +
          '<path d="M84 190C100 180 120 177 146 177" fill="none" stroke="#a8b0be" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          // Ear pods beside the glass, the neck ring under the face.
          `<g fill="#4a505c" stroke="${SHELL_EDGE}" stroke-width="2"><rect x="50" y="268" width="14" height="34" rx="4"/><rect x="236" y="268" width="14" height="34" rx="4"/></g>` +
          `<rect x="56" y="318" width="188" height="12" rx="5" fill="#3e434e" stroke="${SHELL_EDGE}" stroke-width="2"/>` +
          `<g fill="#8a919e">${[70, 104, 138, 172, 206].map(x => `<circle cx="${x}" cy="324" r="1.8"/>`).join('')}</g>` +
          // The lamp on the crown, throwing a soft beam at the console.
          `<rect x="188" y="182" width="42" height="18" rx="4" fill="#3a3f4a" stroke="${SHELL_EDGE}" stroke-width="2"/>` +
          `<g class="ad-lamp"><path d="M234 185L300 164V222L234 198Z" fill="${HOT}" fill-opacity=".1"/><rect x="226" y="184" width="8" height="14" rx="2" fill="#fff1d8"/></g>`,
      },
      seatArt:
        // A hard equipment case with a hazard band.
        '<rect x="106" y="350" width="90" height="106" rx="6" fill="#24242a" stroke="#40404a" stroke-width="2"/>' +
        `<rect x="106" y="374" width="90" height="10" fill="${ORANGE}" fill-opacity=".8"/>` +
        `<path d="${Array.from({ length: 7 }, (_, i) => `M${110 + i * 13} 384l6 -10h5l-6 10z`).join('')}" fill="#15151a"/>` +
        '<path d="M106 364H196" stroke="#40404a" stroke-width="2"/><g fill="#6a6e78"><rect x="118" y="358" width="10" height="9" rx="1"/><rect x="174" y="358" width="10" height="9" rx="1"/></g>',
      tableArt:
        // A rugged desk on a crate and a section of drill pipe, a hazard edge, a spare drill bit on top.
        '<rect x="166" y="330" width="304" height="14" rx="2" fill="#1f1e23" stroke="#3a3a42" stroke-width="1.5"/>' +
        `<path d="${Array.from({ length: 15 }, (_, i) => `M${174 + i * 20} 343l5 -8h8l-5 8z`).join('')}" fill="${ORANGE}" fill-opacity=".7"/>` +
        '<rect x="180" y="344" width="32" height="112" fill="#1a191d" stroke="#34343c" stroke-width="1.5"/><path d="M180 372H212M180 428H212" stroke="#34343c" stroke-width="2"/>' +
        '<rect x="438" y="344" width="14" height="112" fill="#3a3a42"/><g fill="#4a4a54"><rect x="434" y="358" width="22" height="8" rx="1"/><rect x="434" y="430" width="22" height="8" rx="1"/></g>' +
        '<rect x="212" y="404" width="226" height="6" fill="#1a191d"/>' +
        '<rect x="438" y="298" width="14" height="12" fill="#6a6470"/><path d="M438 302H452M438 306H452" stroke="#3a3640" stroke-width="1.2"/>' +
        '<g fill="#5a5560" stroke="#8a8490" stroke-width="1.2"><path d="M426 330Q424 314 438 310L444 330Z"/><path d="M464 330Q466 314 452 310L446 330Z"/><path d="M436 330Q436 312 445 310Q454 312 454 330Z"/></g>' +
        `<g fill="${HOT}" fill-opacity=".55"><circle cx="432" cy="322" r="1.4"/><circle cx="445" cy="318" r="1.4"/><circle cx="458" cy="322" r="1.4"/><circle cx="445" cy="326" r="1.4"/></g>`,
    },
    style:
      // Ambient: stars twinkle, shards tumble past, clouds drift on the planet, the beacon breathes, vents puff.
      '.ad-tw{animation:ad-tw 3.4s ease-in-out infinite alternate}@keyframes ad-tw{from{opacity:.25}to{opacity:.85}}' +
      '.ad-sh{animation:ad-fly var(--d) linear infinite}@keyframes ad-fly{to{transform:translate(-1960px,var(--dy))}}' +
      '.ad-tm{animation:mv-spin 12s linear infinite}' +
      '.ad-cld{animation:ad-cld 60s ease-in-out infinite alternate}@keyframes ad-cld{to{transform:translateX(-90px)}}' +
      '.ad-atm{opacity:.6}' +
      '.ad-bcn{animation:ad-bcn 2.4s ease-in-out infinite}@keyframes ad-bcn{0%,100%{opacity:.3}40%{opacity:1}}' +
      '.ad-red{opacity:0}' +
      '.ad-fl{animation:ad-fl 5s ease-in-out infinite alternate}@keyframes ad-fl{from{opacity:.75}to{opacity:1}}' +
      '.ad-pl{transform-box:fill-box;transform-origin:50% 100%;opacity:0;animation:ad-pl 5s ease-out infinite}' +
      '@keyframes ad-pl{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.55}100%{opacity:0;transform:translate(-90px,-46px) scale(1.8,1.3)}}' +
      // The stack light counts down, a lamp at a time; faster while a command runs.
      '.ad-ck{animation:ad-ck0 var(--c,12s) steps(1) infinite}' +
      countKeys +
      '.ad-ckg{opacity:0}' +
      '.ad-dt{animation:ad-dt 1.5s steps(1) infinite}@keyframes ad-dt{0%{opacity:1}20%,100%{opacity:.25}}' +
      '.ad-chip,.ad-spk,.ad-dust,.ad-ring,.ad-heat,.ad-ch,.ad-peb,.ad-scan,.ad-strata,.ad-hint,.ad-sig,.ad-rng,.ad-jet,.ad-thr,.ad-gas,.ad-vent,.ad-chg,.ad-gap,.ad-flame,.ad-drn{opacity:0}' +
      '@keyframes ad-on{to{opacity:1}}' +
      // The console's needles, its depth bar and trace.
      '.ad-wob{animation:ad-wob 3s ease-in-out infinite alternate}@keyframes ad-wob{from{transform:rotate(-46deg)}to{transform:rotate(-18deg)}}' +
      '.ad-busy{animation:ad-busy .9s ease-in-out infinite alternate}@keyframes ad-busy{from{transform:rotate(-10deg)}to{transform:rotate(26deg)}}' +
      '.ad-high{animation:ad-high .22s linear infinite alternate}@keyframes ad-high{from{transform:rotate(34deg)}to{transform:rotate(52deg)}}' +
      '.ad-spike{animation:ad-spike 1.4s ease-out both}' +
      '@keyframes ad-spike{0%{transform:rotate(-20deg)}22%{transform:rotate(114deg)}34%{transform:rotate(96deg)}46%{transform:rotate(116deg)}58%{transform:rotate(102deg)}70%,100%{transform:rotate(110deg)}}' +
      '.ad-calm{animation:ad-calm 1.8s ease-out both}@keyframes ad-calm{from{transform:rotate(100deg)}to{transform:rotate(-32deg)}}' +
      '.ad-db{transform-box:fill-box;transform-origin:50% 100%;animation:ad-db 2.4s ease-in infinite}@keyframes ad-db{from{transform:scaleY(.15)}to{transform:scaleY(1)}}' +
      '.ad-wv{transform-box:fill-box;transform-origin:center}' +
      '.st-tool .ad-wv,.st-run .ad-wv{animation:ad-wv .3s ease-in-out infinite alternate}@keyframes ad-wv{to{transform:scaleY(1.9)}}' +
      '.st-sleeping .ad-lamp{opacity:.25}' +
      // Thinking: debris drifts; the pebbles lift, the shards slow, the floods dim.
      '.ad-peb{transform-box:fill-box;transform-origin:center}' +
      '.st-thinking .ad-peb{animation:ad-peb 5.5s ease-in-out infinite}' +
      '@keyframes ad-peb{0%{opacity:0;transform:translate(0,0) rotate(0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-140px) rotate(220deg)}}' +
      '.st-thinking .ad-sh{animation-duration:calc(var(--d) * 2.4)}' +
      '.st-thinking .ad-fl{animation:none;opacity:.55}' +
      // Responding, tool, run: the drill turns, faster and faster; the top drive feeds pipe down.
      '.st-responding .ad-rot{animation:mv-spin 4s linear infinite}' +
      '.st-tool .ad-rot{animation:mv-spin 1.2s linear infinite}' +
      '.st-run .ad-rot{animation:mv-spin .45s linear infinite}' +
      '.st-tool .ad-td{animation:ad-td 6s linear infinite}.st-run .ad-td{animation:ad-td 2.6s ease-in infinite}' +
      '@keyframes ad-td{0%{transform:translateY(0)}90%{transform:translateY(236px)}100%{transform:translateY(0)}}' +
      '.st-responding .ad-dust{animation:ad-dust 4.2s ease-out infinite}.st-responding .ad-dustg{opacity:.45}' +
      '.st-tool .ad-ch{animation:ad-ch 1.6s linear infinite}' +
      '@keyframes ad-ch{0%{opacity:0;transform:translate(0,0)}10%,90%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-334px)}}' +
      '.st-tool .ad-spk{animation:ad-spk 1.2s ease-out infinite}.st-tool .ad-heat{opacity:.35}' +
      '.st-run .ad-chip{animation:ad-chip 1.3s cubic-bezier(.2,.6,.4,1) infinite}' +
      '@keyframes ad-chip{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}55%{opacity:1;transform:translate(calc(var(--dx) * .6),var(--dy)) rotate(160deg)}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) * .15)) rotate(300deg)}}' +
      '.st-run .ad-spk{animation:ad-spk .7s ease-out infinite}' +
      '@keyframes ad-spk{0%{opacity:0;transform:rotate(var(--r)) translateY(0)}15%{opacity:1}100%{opacity:0;transform:rotate(var(--r)) translateY(-48px)}}' +
      '.ad-dust{transform-box:fill-box;transform-origin:center}.st-run .ad-dust{animation:ad-dust 2.4s ease-out infinite}' +
      '@keyframes ad-dust{0%{opacity:0;transform:translate(0,0) scale(.3)}20%{opacity:.75}100%{opacity:0;transform:translate(var(--dx),-130px) scale(2)}}' +
      '.ad-ring{transform-box:fill-box;transform-origin:center}.st-run .ad-ring{animation:ad-ring 1.3s ease-out infinite}' +
      '@keyframes ad-ring{0%{opacity:0;transform:scale(.3)}15%{opacity:.7}100%{opacity:0;transform:scale(3.4)}}' +
      '.st-run .ad-heat{animation:ad-heat 1.2s ease-in-out infinite alternate}@keyframes ad-heat{from{opacity:.35}to{opacity:.85}}' +
      '.st-run .ad-fl{animation:none;opacity:1}' +
      '.ad-spray{opacity:0;transform-origin:334px 452px}.st-run .ad-spray{animation:ad-spray .4s ease-in-out infinite alternate}' +
      '@keyframes ad-spray{from{opacity:.45;transform:scale(.7)}to{opacity:.9;transform:scale(1.08)}}' +
      '.st-run .ad-R{animation:ad-rum .12s linear infinite alternate}@keyframes ad-rum{from{transform:translate(-1px,0)}to{transform:translate(1.5px,-1px)}}' +
      '.ad-drk{transform-origin:334px 452px}' +
      '.st-run .ad-drk{animation:ad-shk .14s linear infinite alternate}@keyframes ad-shk{from{transform:translate(-1.6px,0)}to{transform:translate(1.6px,-1.2px)}}' +
      '.st-run .ad-ck{--c:3.5s}' +
      '.st-run .ad-stk>g>g{animation-duration:1.5s!important}' +
      // Read: a survey sweep across the crag shows the strata and, faintly, the fault.
      '.st-read .ad-scan{opacity:1;animation:ad-scan 2.6s ease-in-out infinite alternate}@keyframes ad-scan{to{transform:translateX(620px)}}' +
      '.st-read .ad-strata{animation:ad-on .8s ease-out both}.st-read .ad-hint{animation:ad-on 1s ease-out .4s both}' +
      // Web: the tug's dish turns to the planet and a signal runs out to it.
      '.st-web .ad-dish{animation:ad-aim 1s ease-out both}@keyframes ad-aim{to{transform:rotate(40deg)}}' +
      '.st-web .ad-sig{opacity:1;animation:ad-sig 1s linear infinite}@keyframes ad-sig{to{stroke-dashoffset:-44}}' +
      '.ad-rng{transform-box:fill-box;transform-origin:center}.st-web .ad-rng{animation:ad-rng 1.6s ease-out infinite}' +
      '@keyframes ad-rng{0%{opacity:0;transform:scale(.3)}20%{opacity:.8}100%{opacity:0;transform:scale(1.9)}}' +
      // Error: a gas pocket blows out beside the rig, rocks fly, the derrick lurches, the beacon turns red.
      '.ad-jet{transform-box:fill-box;transform-origin:50% 100%}.st-error .ad-jet{animation:ad-jet 1.8s ease-out both}' +
      '@keyframes ad-jet{0%{opacity:0;transform:scaleY(.05)}25%{opacity:.85;transform:scaleY(1)}60%{opacity:.7;transform:scaleY(.92)}100%{opacity:.6;transform:scaleY(1)}}' +
      '.ad-jw{transform-box:fill-box;transform-origin:50% 100%}.st-error .ad-jw{animation:ad-jw .5s ease-in-out infinite alternate}@keyframes ad-jw{from{transform:scaleX(.85)}to{transform:scaleX(1.12)}}' +
      '.st-error .ad-thr{animation:ad-thr 1.9s cubic-bezier(.3,.7,.5,1) infinite}' +
      '@keyframes ad-thr{0%{opacity:0;transform:translate(0,0) rotate(0)}6%{opacity:1}45%{transform:translate(calc(var(--dx) * .55),var(--dy)) rotate(140deg)}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) * -.1 + 60px)) rotate(320deg)}}' +
      '.ad-gas{transform-box:fill-box;transform-origin:center}.st-error .ad-gas{animation:ad-gas 2.4s ease-out .3s both}' +
      '@keyframes ad-gas{0%{opacity:0;transform:scale(.3)}30%{opacity:.6}100%{opacity:.3;transform:scale(1.6)}}' +
      '.st-error .ad-vent{animation:ad-on .3s ease-out both}' +
      '.st-error .ad-drk{animation:ad-lurch 1.1s ease-in-out infinite alternate}@keyframes ad-lurch{from{transform:rotate(-1.4deg)}to{transform:rotate(.8deg)}}' +
      '.st-error .ad-bcn{animation:none;opacity:0}' +
      '.st-error .ad-red{animation:ad-redp 1.2s ease-in-out infinite}@keyframes ad-redp{0%,100%{opacity:.25}50%{opacity:1}}' +
      // Frozen mid-count: the top three already out, the bottom three still lit.
      '.st-error .ad-ck{animation:none}.st-error .ad-ck0,.st-error .ad-ck1,.st-error .ad-ck2{opacity:.12}' +
      // Done: the charge glows, a calm line runs down the fault, the tug lifts off and the asteroid splits in two.
      '.ad-chg{transform-box:fill-box;transform-origin:center}.st-done .ad-chg{animation:ad-chg 3s ease-out both}' +
      '@keyframes ad-chg{0%{opacity:0;transform:scale(.4)}25%{opacity:.85;transform:scale(1)}100%{opacity:.5;transform:scale(1.15)}}' +
      '.ad-sl{stroke-dasharray:1 1;stroke-dashoffset:1}.st-done .ad-sl{animation:ad-sl 1.2s ease-in-out .5s both}@keyframes ad-sl{to{stroke-dashoffset:0}}' +
      '.ad-L{transform-origin:240px 700px}.st-done .ad-L{animation:ad-L 2.6s cubic-bezier(.4,0,.2,1) 1.1s both}@keyframes ad-L{to{transform:translate(-170px,-40px) rotate(-5deg)}}' +
      '.ad-R{transform-origin:330px 700px}.st-done .ad-R{animation:ad-R 2.6s cubic-bezier(.4,0,.2,1) 1.1s both}@keyframes ad-R{to{transform:translate(30px,34px) rotate(1.5deg)}}' +
      '.st-done .ad-gap{animation:ad-on 1.6s ease-out 1s both}' +
      '.ad-tug{transform-box:fill-box;transform-origin:center}.st-done .ad-tug{animation:ad-lift 3.4s cubic-bezier(.5,0,.6,1) .3s both}' +
      '@keyframes ad-lift{0%{transform:translate(0,0)}25%{transform:translate(0,-30px)}100%{transform:translate(-110px,-540px) scale(.6)}}' +
      '.st-done .ad-flame{animation:ad-flame .25s ease-in-out .3s infinite alternate}@keyframes ad-flame{from{opacity:.6}to{opacity:.95}}' +
      '.st-done .ad-ck{animation:none;opacity:.1}.st-done .ad-ckg{animation:ad-on .3s ease-out both;animation-delay:calc(.3s + var(--i) * .18s)}' +
      '.st-done .ad-atm{animation:ad-atm 3s ease-out 1s both}@keyframes ad-atm{to{opacity:1}}' +
      // Subagents: two survey drones hover by the derrick.
      '.helper .ad-drn{opacity:1;animation:ad-drn 6s ease-in-out infinite alternate}@keyframes ad-drn{to{transform:translate(54px,-26px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ad-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04050a"/><stop offset=".7" stop-color="#07080d"/><stop offset="1" stop-color="#0a0a10"/></linearGradient>' +
      '<radialGradient id="ad-sun"><stop offset="0" stop-color="#fff4de" stop-opacity=".55"/><stop offset=".1" stop-color="#ffd9a8" stop-opacity=".22"/><stop offset=".45" stop-color="#ff9d3a" stop-opacity=".05"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-oc" cx=".32" cy=".3" r=".75"><stop offset="0" stop-color="#4d97e6"/><stop offset=".4" stop-color="#2363b8"/><stop offset=".8" stop-color="#12366f"/><stop offset="1" stop-color="#0b2550"/></radialGradient>' +
      '<linearGradient id="ad-night" x1=".15" y1=".1" x2=".95" y2=".9"><stop offset="0" stop-color="#02040a" stop-opacity="0"/><stop offset=".42" stop-color="#02040a" stop-opacity="0"/><stop offset=".6" stop-color="#02040a" stop-opacity=".85"/><stop offset="1" stop-color="#02040a" stop-opacity=".97"/></linearGradient>' +
      '<radialGradient id="ad-halo"><stop offset=".8" stop-color="#6fb6ff" stop-opacity="0"/><stop offset=".86" stop-color="#6fb6ff" stop-opacity=".3"/><stop offset="1" stop-color="#6fb6ff" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="ad-pc"><circle cx="1500" cy="230" r="310"/></clipPath>' +
      `<clipPath id="ad-cc"><path d="${SPIRE_D}"/><path d="${LEFT_D}"/><path d="${RIGHT_D}"/></clipPath>` +
      '<linearGradient id="ad-rock" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="620" y2="0"><stop offset="0" stop-color="#241d21"/><stop offset=".55" stop-color="#151216"/><stop offset="1" stop-color="#0c0a0d"/></linearGradient>' +
      '<linearGradient id="ad-lat" gradientUnits="userSpaceOnUse" x1="0" y1="456" x2="0" y2="104"><stop offset="0" stop-color="#c46c2c"/><stop offset=".45" stop-color="#5a4436"/><stop offset="1" stop-color="#6a6470"/></linearGradient>' +
      '<linearGradient id="ad-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d3a" stop-opacity=".34"/><stop offset="1" stop-color="#ff9d3a" stop-opacity=".04"/></linearGradient>' +
      '<linearGradient id="ad-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9d3a" stop-opacity=".2"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ad-spr" gradientUnits="userSpaceOnUse" cx="334" cy="452" r="200"><stop offset="0" stop-color="#f0d2ae" stop-opacity=".85"/><stop offset=".5" stop-color="#a8968a" stop-opacity=".45"/><stop offset="1" stop-color="#a8968a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-pool"><stop offset="0" stop-color="#ffb35a" stop-opacity=".5"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-bk"><stop offset="0" stop-color="#ffb35a" stop-opacity=".7"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-rk"><stop offset="0" stop-color="#ff5442" stop-opacity=".75"/><stop offset="1" stop-color="#ff5442" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-gas"><stop offset="0" stop-color="#cfd2da" stop-opacity=".5"/><stop offset="1" stop-color="#cfd2da" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-hg"><stop offset="0" stop-color="#ffd9a6" stop-opacity=".8"/><stop offset=".45" stop-color="#ff9d3a" stop-opacity=".3"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ad-cg"><stop offset="0" stop-color="#fff3df" stop-opacity=".95"/><stop offset=".3" stop-color="#ffc27a" stop-opacity=".5"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ad-jetg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd9a6" stop-opacity=".8"/><stop offset=".3" stop-color="#d8d0ca" stop-opacity=".45"/><stop offset="1" stop-color="#b0a8a8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ad-flg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3df"/><stop offset=".35" stop-color="#ff9d3a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9d3a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ad-scg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fd4ff" stop-opacity="0"/><stop offset=".5" stop-color="#9fd4ff" stop-opacity=".5"/><stop offset="1" stop-color="#9fd4ff" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="ad-sigg" gradientUnits="userSpaceOnUse" x1="${74 + TUG_X}" y1="0" x2="1206" y2="0"><stop offset="0" stop-color="#9fd4ff" stop-opacity=".8"/><stop offset="1" stop-color="#9fd4ff" stop-opacity=".25"/></linearGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ad-sky)"/>' +
      '<circle cx="20" cy="10" r="340" fill="url(#ad-sun)"/><circle cx="20" cy="10" r="9" fill="#fff6e6"/>' +
      '<g fill="none" stroke="#dfe8ff" stroke-linecap="round">' +
      `<path d="${stars[0]!.join('')}" stroke-opacity=".35" stroke-width="1.6"/><path d="${stars[1]!.join('')}" stroke-opacity=".6" stroke-width="2"/>` +
      `<path class="ad-tw" d="${stars[2]!.join('')}" stroke-width="2.4"/></g>` +
      planet(next) +
      `<g class="ad-stk" transform="rotate(90 800 500)">${rain({ seed: 61, count: 22, length: [40, 160], slant: 50, seconds: 3.2, stroke: '#a8bde0', opacity: 0.26, box: [300, -300, 1000, 1600] })}</g>` +
      `<g fill="#241e24" stroke="${SUN}" stroke-opacity=".5" stroke-width="1.6">${shards}</g>` +
      // The asteroid's far rim, curving away.
      '<path d="M-20 1010V800Q400 724 800 716Q1200 724 1620 800V1010Z" fill="#0b090c"/>' +
      '<path d="M-20 800Q400 724 800 716Q1200 724 1620 800" fill="none" stroke="#6f9ee0" stroke-opacity=".18" stroke-width="2"/>' +
      // The glow in the fault, seen only once the halves part.
      `<g class="ad-gap" fill="none" stroke-linejoin="round"><path d="${seamAll}" stroke="${ORANGE}" stroke-opacity=".35" stroke-width="80"/>` +
      `<path d="${seamAll}" stroke="${ORANGE}" stroke-opacity=".5" stroke-width="30"/><path d="${seamAll}" stroke="${HOT}" stroke-opacity=".8" stroke-width="8"/></g>` +
      // The left half: the shelf with the tug, the needle spire.
      '<g class="ad-L">' +
      `<path d="${SPIRE_D}" fill="url(#ad-rock)"/><path d="M176 360L206 196L196 300Z" fill="#2b2327" fill-opacity=".75"/>` +
      `<path d="${line(SPIRE.slice(0, 6))}" fill="none" stroke="${SUN}" stroke-opacity=".5" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="${line(SPIRE.slice(5))}" fill="none" stroke="#6f9ee0" stroke-opacity=".28" stroke-width="2"/>` +
      `<path d="${LEFT_D}" fill="url(#ad-rock)"/>` +
      '<g fill="#2b2327" fill-opacity=".75"><path d="M-80 448L52 434L20 520L-80 560Z"/><path d="M60 470L140 432L190 440L120 540Z"/></g>' +
      `<path d="${line(LEFT.slice(1))}L258 452" fill="none" stroke="${SUN}" stroke-opacity=".5" stroke-width="2.5" stroke-linejoin="round"/>` +
      '<path d="M40 640L80 700L70 760M180 520L150 600M120 860L170 920" fill="none" stroke="#070608" stroke-width="2.4"/>' +
      plume(178, 604, 0) +
      `<g transform="translate(${TUG_X} 0)">${tug()}</g>` +
      '</g>' +
      // The right half: the plateau and slope, the derrick and the stack light.
      '<g class="ad-R">' +
      `<path d="${RIGHT_D}" fill="url(#ad-rock)"/>` +
      `<path d="${line([...SEAM.slice(0, 1), ...RIGHT.slice(0, 5)])}" fill="none" stroke="${SUN}" stroke-opacity=".45" stroke-width="2.5"/>` +
      `<path d="${line(RIGHT.slice(4))}" fill="none" stroke="#6f9ee0" stroke-opacity=".26" stroke-width="2"/>` +
      // The floods light the face under the plateau.
      '<path d="M262 456L414 460L440 540L392 600L300 580Z" fill="url(#ad-face)"/>' +
      craters +
      '<path d="M420 560L450 640L440 700M500 820L470 900" fill="none" stroke="#070608" stroke-width="2.4"/>' +
      `<circle class="ad-heat" cx="${BORE[0]}" cy="450" r="110" fill="url(#ad-hg)"/>` +
      `<g class="ad-drk">${derrick()}${stackLight()}</g>` +
      // Cuttings thrown out sideways from the bore.
      '<g fill="url(#ad-spr)"><path class="ad-spray" d="M330 452C290 414 220 392 150 396C210 416 270 440 324 460Z"/>' +
      '<path class="ad-spray" style="animation-delay:-.2s" d="M338 452C384 414 452 398 520 406C462 424 404 444 344 460Z"/></g>' +
      `<g class="ad-dustg" fill="url(#ad-gas)">${dust}</g>` +
      `<ellipse class="ad-ring" cx="${BORE[0]}" cy="452" rx="30" ry="8" fill="none" stroke="${HOT}" stroke-opacity=".8" stroke-width="2.4"/>` +
      `<g transform="translate(${BORE[0]} 450)"><g fill="#3a2a22" stroke="${ORANGE}" stroke-opacity=".7">${chips}</g>` +
      `<g stroke="${HOT}" stroke-width="2.4" stroke-linecap="round">${sparks}</g></g>` +
      '</g>' +
      // Done: the buried charge and the line it draws down the fault.
      `<circle class="ad-chg" cx="${CHARGE[0]}" cy="${CHARGE[1]}" r="110" fill="url(#ad-cg)"/>` +
      `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      `<path class="ad-sl" pathLength="1" d="${seamUp}" stroke="${ORANGE}" stroke-opacity=".4" stroke-width="12"/><path class="ad-sl" pathLength="1" d="${seamUp}" stroke="#fff3df" stroke-width="3"/>` +
      `<path class="ad-sl" pathLength="1" d="${seamDown}" stroke="${ORANGE}" stroke-opacity=".4" stroke-width="12"/><path class="ad-sl" pathLength="1" d="${seamDown}" stroke="#fff3df" stroke-width="3"/></g>` +
      // Read: the survey sweep, the strata, the fault, all on the crag.
      '<g clip-path="url(#ad-cc)">' +
      '<g class="ad-scan"><rect x="-40" y="180" width="80" height="840" fill="url(#ad-scg)"/><rect x="-2" y="180" width="4" height="840" fill="#cfe8ff" fill-opacity=".6"/></g>' +
      `<g class="ad-strata" fill="none" stroke="${SIGNAL}" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="7 6">` +
      '<path d="M-60 520Q120 500 260 530T620 540"/><path d="M-60 620Q140 600 300 640T620 650"/><path d="M-60 740Q160 716 320 760T620 770"/><path d="M-60 860Q180 840 340 880T620 890"/></g>' +
      `<path class="ad-hint" d="${seamAll}" fill="none" stroke="${ORANGE}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 5"/>` +
      '</g>' +
      // Web: the signal from the tug's dish to the planet.
      `<path class="ad-sig" d="M${74 + TUG_X} 338Q760 -60 1206 160" fill="none" stroke="url(#ad-sigg)" stroke-width="2.2" stroke-dasharray="10 12"/>` +
      `<g fill="none" stroke="${SIGNAL}" stroke-width="2"><circle class="ad-rng" cx="${74 + TUG_X}" cy="336" r="14"/>` +
      // The rings where the signal reaches the planet, unpinned like the arc so the two stay together.
      '<circle class="ad-rng" cx="1206" cy="160" r="20"/><circle class="ad-rng" style="animation-delay:.8s" cx="1206" cy="160" r="20"/></g>' +
      // Error: the blowout in the notch beside the derrick.
      '<ellipse class="ad-vent" cx="252" cy="446" rx="46" ry="12" fill="url(#ad-hg)"/>' +
      '<g class="ad-jw"><path class="ad-jet" d="M238 450C230 340 196 200 160 34H344C308 200 274 340 266 450Z" fill="url(#ad-jetg)"/></g>' +
      '<ellipse class="ad-gas" cx="252" cy="70" rx="140" ry="70" fill="url(#ad-gas)"/>' +
      `<g transform="translate(252 440)" fill="#2a2024" stroke="${SUN}" stroke-opacity=".55">${thrown}</g>` +
      `<g fill="#2e262a" stroke="${SUN}" stroke-opacity=".5">${pebbles}</g>` +
      drone(170, 150, 0) +
      drone(236, 84, -3) +
      // The near floor.
      '<g class="mv-b">' +
      `<path d="M-60 1010V${f(floorPts[0]![1])}${line(floorPts).replace('M', 'L')}V1010Z" fill="#0a080a"/>` +
      `<path d="${line(floorPts)}" fill="none" stroke="${SUN}" stroke-opacity=".2" stroke-width="2"/>` +
      `<path d="${boulders}" fill="#120f12" stroke="${SUN}" stroke-opacity=".18" stroke-width="1.5"/>` +
      plume(96, 906, -1.4) +
      '</g>',
    nook:
      // A rock outcrop behind the end of the desk with spare drill pipe leaning on it, and an oxygen cylinder.
      '<path d="M352 456L364 360L376 320L386 236L398 200L408 150L420 132L440 180L440 456Z" fill="#141114"/>' +
      `<path d="M364 360L376 320L386 236L398 200L408 150L420 132" fill="none" stroke="${ORANGE}" stroke-opacity=".28" stroke-width="2"/>` +
      '<g stroke="#3a3a42" stroke-width="7" stroke-linecap="round"><path d="M330 456L380 170M350 456L394 186"/></g>' +
      '<g fill="#4a4a54"><rect x="356" y="250" width="16" height="6" rx="1" transform="rotate(10 364 253)"/><rect x="372" y="290" width="16" height="6" rx="1" transform="rotate(9 380 293)"/></g>' +
      '<rect x="22" y="362" width="30" height="94" rx="12" fill="#2a2d34" stroke="#40444e" stroke-width="2"/>' +
      `<rect x="22" y="384" width="30" height="9" fill="${ORANGE}" fill-opacity=".75"/><rect x="31" y="350" width="12" height="14" rx="2" fill="#4a4e58"/>` +
      // Pebbles that lift while Claude thinks, and grit that pops out of a crack on an error.
      `<g fill="#2e262a" stroke="${SUN}" stroke-opacity=".5">` +
      [
        [8, 452, 16],
        [70, 450, -18],
        [404, 452, -24],
        [96, 454, 22],
      ]
        .map(([x, y, dx], i) => `<path class="ad-peb" style="--dx:${dx}px;animation-delay:${f(-i * 1.2)}s" d="${rock(next, 4 + next() * 3, x!, y!, 5)}"/>`)
        .join('') +
      '</g><path d="M48 456L58 448L70 452L80 446" fill="none" stroke="#070608" stroke-width="2"/>' +
      `<g transform="translate(64 450)" fill="#2a2024" stroke="${SUN}" stroke-opacity=".5">` +
      Array.from(
        { length: 5 },
        (_, i) =>
          `<path class="ad-thr" style="--dx:${-40 + i * 20}px;--dy:${Math.round(-60 - next() * 50)}px;animation-delay:${f(0.2 + i * 0.22)}s" d="${rock(next, 3 + next() * 3, 0, 0, 5)}"/>`,
      ).join('') +
      '</g>',
  }
}
