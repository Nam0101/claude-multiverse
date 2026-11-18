import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Casino Spy: gala night on a casino terrace high over a Riviera bay. On the left the casino's great arched window
// glows around a crystal chandelier, a white cat sits on the villain's turned-away velvet chair, and a roulette wheel
// turns on its table. Out in the bay a dressed-up yacht sweeps its searchlight. Claude, in a tuxedo and bow tie,
// works at a baize card table on a laptop disguised as a cigarette case. A command spins the wheel to a blur, sets the
// chips hopping and the chandelier swaying while a thin hidden scanner sweeps the terrace; an error trips the alarm
// and the yacht's light finds Claude; done drops the ball, pays out a cascade of chips and blooms fireworks over the
// water and the dome.
const GOLD = '#f0d38a'
const GOLD_D = '#b0904c'
const GOLD_DD = '#5e4a26'
const VELVET = '#5a1424'
const VELVET_D = '#33091a'
const BAIZE = '#0f4c34'
const LASER = '#ff2d55'
const SILVER = '#80808f'
const CREAM = '#f1ece0'

// The roulette wheel: its centre on the table, how flat it looks from the terrace, the radii the ball runs and lands at.
const WX = 188
const WY = 884
const K = 0.42
const TRACK = 152
const POCKET = 116
const POCKETS = 37
const STEP = 360 / POCKETS
// The casino's arched window.
const WIN = 'M82 790V340A116 116 0 0 1 314 340V790Z'

const rad = (deg: number) => (deg * Math.PI) / 180
const polar = (r: number, deg: number) => `${f(r * Math.cos(rad(deg)))} ${f(r * Math.sin(rad(deg)))}`
/** The ball's offset on screen at radius `r` and angle `deg` of the flattened wheel. */
const onWheel = (r: number, deg: number) => `translate(${f(r * Math.cos(rad(deg)))}px,${f(K * r * Math.sin(rad(deg)))}px)`

/** The ball going round the wheel at radius `r`, once per animation, from the front; `dir` 1 turns with the wheel. */
function orbit(name: string, r: number, dir: number, steps: number): string {
  let out = ''

  for (let i = 0; i <= steps; i += 1) {
    out += `${f((i / steps) * 100)}%{transform:${onWheel(r, 90 + (dir * 360 * i) / steps)}}`
  }

  return `@keyframes ${name}{${out}}`
}

/** Done: the wheel coasts to a stop while the ball runs the other way, drops in and rides the green pocket. */
function landing(): string {
  const T = 3
  const land = 0.6
  const phi = (t: number) => 300 * (1 - (1 - Math.min(1, t / T)) ** 3)
  const times: number[] = []

  for (let t = 0; t < land - 0.01; t += 0.05) times.push(t)
  for (let t = land; t < T - 0.01; t += 0.2) times.push(t)
  times.push(T)

  const at = (t: number) => `${f((t / T) * 100)}%`
  const wheel = times.map(t => `${at(t)}{transform:rotate(${f(phi(t))}deg)}`).join('')
  const ball = times
    .map(t => {
      if (t >= land) return `${at(t)}{transform:${onWheel(POCKET, 90 + phi(t))}}`

      const u = t / land
      const r = u < 0.5 ? TRACK : TRACK - (TRACK - POCKET) * ((u - 0.5) / 0.5) ** 1.6

      return `${at(t)}{transform:${onWheel(r, 90 + phi(land) + 560 * (land - t))}}`
    })
    .join('')

  return `@keyframes cy-wdone{${wheel}}@keyframes cy-bdone{${ball}}`
}

/** The wheel in its bowl, flattened by perspective; the spindle stands up from the hub and the ball sits on top. */
function wheel(): string {
  const off = 90 - STEP / 2
  const reds: string[] = []
  const blacks: string[] = []
  // Whole units are plenty for the wheel's own geometry, and keep it short.
  const p = (r: number, deg: number) => `${Math.round(r * Math.cos(rad(deg)))} ${Math.round(r * Math.sin(rad(deg)))}`
  let green = ''
  let frets = ''

  for (let i = 0; i < POCKETS; i += 1) {
    const a0 = off + i * STEP
    const a1 = a0 + STEP
    const d = `M${p(133, a0)}L${p(133, a1)}L${p(100, a1)}L${p(100, a0)}Z`

    if (i === 0) green = d
    else (i % 2 ? reds : blacks).push(d)
    frets += `M${p(98, a0)}L${p(135, a0)}`
  }

  const spokes = [0, 90, 180, 270].map(a => `M${p(26, a)}L${p(96, a)}`).join('')
  const handle = [45, 135, 225, 315].map(a => `M0 0L${p(46, a)}`).join('')
  const knobs = [45, 135, 225, 315].map(a => `M${p(46, a)}h.1`).join('')

  return (
    `<ellipse cx="${WX}" cy="${WY + 12}" rx="174" ry="80" fill="#120806"/>` +
    `<g transform="translate(${WX} ${WY}) scale(1 ${K})">` +
    `<circle r="170" fill="url(#cy-wood)" stroke="${GOLD_D}" stroke-width="6"/>` +
    // Run: two gold glints race round the rim.
    '<g class="cy-rg"><circle r="168" fill="none" stroke="#fff6d8" stroke-width="10" pathLength="360" stroke-dasharray="36 84"/></g>' +
    '<circle r="158" fill="#1c0f09" stroke="#4a2c18" stroke-width="2"/><circle r="144" fill="#0e0705"/>' +
    '<g class="cy-wh">' +
    `<path d="${reds.join('')}" fill="#8e1626"/><path d="${blacks.join('')}" fill="#0b0a10"/><path d="${green}" fill="#10804a"/>` +
    `<path d="${frets}" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2.4"/>` +
    `<circle r="134" fill="none" stroke="${GOLD_D}" stroke-width="3"/><circle r="99" fill="url(#cy-cone)" stroke="${GOLD_D}" stroke-width="3"/>` +
    `<path d="${spokes}" stroke="${GOLD_DD}" stroke-width="4"/>` +
    `<path d="${handle}" stroke="${GOLD_D}" stroke-width="7" stroke-linecap="round"/><path d="${knobs}" stroke="${GOLD}" stroke-width="15" stroke-linecap="round"/>` +
    `<circle r="22" fill="${GOLD_D}" stroke="${GOLD}" stroke-width="2"/></g>` +
    // Run: the pockets blur into a ring with gold streaks, and the wheel glows.
    '<g class="cy-blur"><circle r="116" fill="none" stroke="#5a1420" stroke-opacity=".8" stroke-width="34"/>' +
    `<g fill="none" stroke="${GOLD}" stroke-opacity=".6" stroke-width="2.4"><circle r="104"/><circle r="117"/><circle r="129"/></g>` +
    '<circle r="240" fill="url(#cy-wg)"/></g></g>' +
    `<path d="M${WX - 3} ${WY}V${WY - 22}H${WX + 3}V${WY}Z" fill="${GOLD_D}"/><circle cx="${WX}" cy="${WY - 24}" r="5.5" fill="${GOLD}"/>` +
    `<g transform="translate(${WX} ${WY})"><g class="cy-ball" transform="translate(0 ${f(K * POCKET)})">` +
    '<circle r="6.2" fill="#f6f1e6" stroke="#2a1a10" stroke-width=".8"/><circle cx="-1.8" cy="-2" r="2" fill="#fff"/></g></g>'
  )
}

const CHIP_COLORS: readonly (readonly [string, string])[] = [
  ['#9a1a2e', '#5a0e1a'],
  ['#22222c', '#0c0c12'],
  ['#e6dec8', '#9a8e72'],
  ['#d0aa52', '#7a5a22'],
]

/** One casino chip, seen from above the table, its top face at `y - 4`; its parent strokes the edge spots. */
function chip(x: number, y: number, c: number): string {
  const [top, side] = CHIP_COLORS[c % 4]!

  return `<path d="M${x - 15} ${y - 4}v4a15 5.5 0 0 0 30 0v-4Z" fill="${side}" stroke="none"/><ellipse cx="${x}" cy="${y - 4}" rx="15" ry="5.5" fill="${top}"/>`
}

/** The chip stacks by the wheel, and the payout that rains onto them when done. */
function chips(): string {
  const stacks: readonly (readonly [number, number, number])[] = [
    [322, 978, 3],
    [362, 958, 2],
    [404, 982, 3],
  ]

  return `<g stroke="${CREAM}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="4 5">${stacks
    .map(([x, y, n], s) => {
      let out = `<g class="cy-hop" style="--d:${f(-s * 0.17)}s">`

      for (let i = 0; i < n - 1; i += 1) out += chip(x, y - i * 4, s + i)
      out += `<g class="cy-leap">${chip(x, y - (n - 1) * 4, s + n - 1)}</g></g>`
      for (let i = 0; i < 5; i += 1) {
        out += `<g class="cy-pay" style="--d:${f(0.5 + s * 0.12 + i * 0.2)}s">${chip(x, y - (n + i) * 4, s + i + 1)}</g>`
      }

      return out
    })
    .join('')}</g>`
}

// One firework's rays, tips and inner sparks at radius 100; each burst scales it.
const BURST = (() => {
  const p = (r: number, deg: number) => `${Math.round(r * Math.cos(rad(deg)))} ${Math.round(r * Math.sin(rad(deg)))}`
  let rays = ''
  let tips = ''
  let inner = ''

  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * 360 + 6

    rays += `M${p(24, a)}L${p(100, a)}`
    tips += `M${p(108, a)}h.1`
    inner += `M${p(50, a + 10)}h.1`
  }

  return { rays, tips, inner }
})()

/** A firework over the bay: a spark climbs from the water, then a ring of rays opens and fades. */
function burst(x: number, y: number, r: number, color: string, delay: number): string {
  const s = r / 100
  const w = (n: number) => f(n / s)

  return (
    `<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})" stroke-linecap="round">` +
    `<g class="cy-rise" style="--d:${delay}s;--h:${f((560 - y) / s)}px"><path d="M0 0v20" stroke="${color}" stroke-width="${w(3.4)}"/></g>` +
    `<g class="cy-fw" style="--d:${delay}s"><circle r="80" fill="url(#cy-fwg)"/>` +
    `<path d="${BURST.rays}" stroke="${color}" stroke-width="${w(4)}"/><path d="${BURST.tips}" stroke="#fff8e8" stroke-width="${w(6)}"/>` +
    `<path d="${BURST.inner}" stroke="#fff3c4" stroke-width="${w(5)}"/></g></g>`
  )
}

/** A thin scanner from the emitter hidden in the right pier: four beams sweeping low over the terrace floor. */
function scanner(): string {
  let d = ''

  for (let i = 0; i < 4; i += 1) d += `M0 0L${polar(1200, 154 + i * 5)}`

  return `<g transform="translate(1180 748)"><g class="cy-fan"><g class="cy-swa"><path d="${d}" stroke="url(#cy-lz)" stroke-width="1.2"/></g></g></g>`
}

/** The yacht in the bay, bow to the left, dressed with lights from bow to masthead to stern; its searchlight. */
function yacht(): string {
  const portholes = Array.from({ length: 12 }, (_, i) => `M${1252 + i * 26} ${f(541 - i * 0.25)}h.1`).join('')

  return (
    `<g class="cy-ref"><path d="M1232 566h300M1252 579h262M1282 593h212M1306 609h156" stroke="${GOLD}" stroke-opacity=".18" stroke-width="3" stroke-dasharray="14 10"/></g>` +
    '<path d="M1192 528L1580 518L1588 538L1568 556H1240Q1210 550 1192 528Z" fill="url(#cy-hull)"/>' +
    '<path d="M1210 536L1584 527" stroke="#151726" stroke-width="5"/>' +
    `<path d="M1206 531L1584 522" stroke="${GOLD}" stroke-opacity=".45" stroke-width="1.2"/>` +
    `<path d="${portholes}" stroke="#ffd98a" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>` +
    '<path d="M1262 520L1294 498H1544L1556 518Z" fill="#9a9eb0"/><path d="M1300 503H1538L1541 513H1294Z" fill="#141624"/>' +
    '<path d="M1318 498L1342 480H1500L1508 497Z" fill="#a8acbd"/><path d="M1346 484H1496L1499 492H1340Z" fill="#141624"/>' +
    '<path d="M1360 480L1376 467H1452L1458 479Z" fill="#b6b9c8"/>' +
    '<g class="cy-win" fill="#ffd27a" fill-opacity=".75"><path d="M1306 505h40v6h-40zM1356 505h52v6h-52zM1420 505h50v6h-50zM1482 505h50v6h-50zM1352 486h34v4h-34zM1396 486h44v4h-44zM1450 486h40v4h-40z"/></g>' +
    '<path d="M1430 467L1434 428H1440L1442 467Z" fill="#8a8ea2"/><path d="M1418 440H1456" stroke="#8a8ea2" stroke-width="2.4"/>' +
    '<g transform="translate(1437 426)"><g class="cy-radar"><rect x="-14" y="-2" width="28" height="4" rx="2" fill="#c4c7d4"/></g></g>' +
    '<circle class="cy-nav" cx="1437" cy="420" r="2.6" fill="#ff6a78"/>' +
    '<path class="cy-dress" d="M1196 526L1437 422L1582 516" fill="none" stroke="#ffe2a0" stroke-opacity=".8" stroke-width="3" stroke-linecap="round" stroke-dasharray=".1 11"/>' +
    [0, 0.5, 1].map(d => `<g transform="translate(1437 420)"><circle class="cy-ring" style="animation-delay:${d}s" r="20" fill="none" stroke="${GOLD}" stroke-width="2"/></g>`).join('') +
    '<g transform="translate(1366 470)"><g class="cy-beam"><path d="M0 -4L-880 -76V76L0 4Z" fill="url(#cy-bm)"/></g></g>' +
    '<circle cx="1366" cy="470" r="16" fill="url(#cy-lamp)"/><rect x="1362" y="465" width="10" height="9" rx="2" fill="#d8dae6"/>'
  )
}

/** A palm on the terrace's far corner, leaning in over the yacht. */
function palm(): string {
  const tips: readonly (readonly [number, number])[] = [
    [-150, 40],
    [-120, -30],
    [-70, -78],
    [10, -86],
    [80, -40],
    [120, 30],
    [-40, 70],
  ]
  const fronds = tips
    .map(([dx, dy]) => {
      const mx = dx * 0.5
      const my = dy * 0.5 - 30

      return `M0 0Q${f(mx - 10)} ${f(my - 10)} ${dx} ${dy}Q${f(mx + 10)} ${f(my + 14)} 0 0Z`
    })
    .join('')

  return (
    '<path d="M1606 790C1594 640 1574 420 1530 246L1544 242C1590 420 1612 640 1626 790Z" fill="#08080d" stroke="#26232f" stroke-width="2"/>' +
    `<g transform="translate(1536 244)"><g class="cy-palm"><path d="${fronds}" fill="#06060a" stroke="#2a2734" stroke-width="2.4"/></g></g>`
  )
}

/** The chandelier hanging inside the casino's window: gilt arms, candle bulbs, crystal swags and drops, glints. */
function chandelier(): string {
  const drops = [118, 136, 156, 178, 198, 218, 240, 260, 278]
    .map(x => `M${x} ${f(388 + 12 * Math.sqrt(Math.max(0, 1 - ((x - 198) / 84) ** 2)))}l3 7l-3 7l-3 -7Z`)
    .join('')
  const sparkles = [
    [118, 404],
    [156, 422],
    [198, 444],
    [240, 422],
    [278, 404],
    [174, 358],
    [222, 358],
    [198, 306],
  ]
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y})"><path class="cy-sp" style="animation-delay:${f(-i * 0.43)}s" d="M0 -9L1.8 -1.8L9 0L1.8 1.8L0 9L-1.8 1.8L-9 0L-1.8 -1.8Z" fill="#fffaf0"/></g>`,
    )
    .join('')

  return (
    '<circle class="cy-glow" cx="198" cy="372" r="190" fill="url(#cy-chg)"/>' +
    `<path d="M198 226V300" stroke="${GOLD_D}" stroke-width="3" stroke-dasharray="5 2"/>` +
    `<ellipse cx="198" cy="306" rx="26" ry="6" fill="none" stroke="${GOLD_D}" stroke-width="3"/>` +
    '<path d="M198 300V424M198 330C176 346 156 342 150 326M198 330C220 346 240 342 246 326M198 384C168 402 126 398 114 372M198 384C228 402 270 398 282 372' +
    `M198 384C184 398 162 396 156 380M198 384C212 398 234 396 240 380" fill="none" stroke="${GOLD_D}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<ellipse cx="198" cy="388" rx="84" ry="12" fill="none" stroke="${GOLD}" stroke-opacity=".75" stroke-width="2.4"/>` +
    `<path d="M148 312h4v14h-4zM244 312h4v14h-4zM112 358h4v14h-4zM154 366h4v14h-4zM238 366h4v14h-4zM280 358h4v14h-4z" fill="${CREAM}" fill-opacity=".85"/>` +
    '<path d="M150 308h.1M246 308h.1M114 354h.1M156 362h.1M240 362h.1M282 354h.1" stroke="#fff4d2" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M114 392Q156 420 198 408Q240 420 282 392M150 342Q174 362 198 354Q222 362 246 342" fill="none" stroke="#f1ecff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" stroke-dasharray=".1 6"/>' +
    `<path d="${drops}M198 424l7 12l-7 14l-7 -14Z" fill="#ece8ff" fill-opacity=".85"/>` +
    sparkles
  )
}

/** The casino's terrace front: a dome over a balustraded roof, a cornice hung with lights, the great arched window. */
function facade(): string {
  const urn = (x: number) => `M${x - 10} 150h20l-2 -4c6 -4 7 -14 0 -20h-16c-7 6 -6 16 0 20Z`
  const drapes =
    'M82 790V300Q86 236 150 228Q118 270 122 340Q126 440 104 530Q124 580 116 790Z' +
    'M314 790V300Q310 236 246 228Q278 270 274 340Q270 440 292 530Q272 580 280 790Z'

  return (
    // The dome with its ribs, lit oculi and lantern.
    '<path d="M72 176A120 120 0 0 1 312 176Z" fill="#0f0d16"/>' +
    `<path d="M192 56V176M140 70Q162 110 164 176M244 70Q222 110 220 176M96 104Q118 140 122 176M288 104Q266 140 262 176" fill="none" stroke="${GOLD_DD}" stroke-opacity=".55" stroke-width="2"/>` +
    '<path d="M150 140h.1M192 128h.1M234 140h.1" stroke="#7a5826" stroke-opacity=".8" stroke-width="12" stroke-linecap="round"/>' +
    `<path d="M180 30h24v28h-24ZM176 32Q192 14 208 32Z" fill="#0f0d16" stroke="${GOLD_DD}" stroke-width="1.5"/><path d="M192 16V0" stroke="${GOLD_DD}" stroke-width="3"/>` +
    // The roof's balustrade, its urns, the cornice and the lights strung under it.
    `<path d="M-60 150h480v8h-480ZM-60 178h480v6h-480Z${urn(20)}${urn(380)}" fill="#17141f"/>` +
    '<path d="M-52 168H420" stroke="#17141f" stroke-width="20" stroke-dasharray="7 9"/>' +
    '<rect x="-60" y="184" width="480" height="22" fill="#1d1926"/>' +
    `<path d="M-60 206H420M-60 188H420" stroke="${GOLD_DD}" stroke-opacity=".7" stroke-width="2"/>` +
    // The wall, two fluted pilasters with gilt capitals.
    '<rect x="-60" y="206" width="468" height="600" fill="url(#cy-wall)"/>' +
    `<path d="M24 222h36v584h-36ZM340 222h36v584h-36Z" fill="#1a1622"/><path d="M18 206h48v16h-48ZM334 206h48v16h-48Z" fill="#241f2e" stroke="${GOLD_DD}" stroke-width="1.5"/>` +
    '<path d="M34 230V800M42 230V800M50 230V800M350 230V800M358 230V800M366 230V800" stroke="#0f0c15" stroke-width="2"/>' +
    '<path d="M396 206V806" stroke="#0a0910" stroke-width="24"/>' +
    // Inside the window: the salon's glow, a gallery rail, two far chandeliers, the drapes, the chandelier.
    `<g clip-path="url(#cy-wc)"><path d="${WIN}" fill="url(#cy-winf)"/>` +
    '<circle cx="128" cy="560" r="44" fill="url(#cy-chg)"/><circle cx="268" cy="560" r="44" fill="url(#cy-chg)"/>' +
    '<path d="M118 560h.1M128 566h.1M138 560h.1M258 560h.1M268 566h.1M278 560h.1" stroke="#fff0c8" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M82 612H314M82 622H314M100 622v28M124 622v28M148 622v28M172 622v28M196 622v28M220 622v28M244 622v28M268 622v28M292 622v28" stroke="#2a1a0a" stroke-width="3"/>' +
    `<path d="${drapes}" fill="url(#cy-vel)"/>` +
    `<path d="M96 300Q100 420 92 520M104 560Q108 680 100 790M300 300Q296 420 304 520M292 560Q288 680 296 790" fill="none" stroke="#1e040c" stroke-opacity=".7" stroke-width="2.4"/>` +
    `<path d="M96 532a12 5 0 1 0 24 0a12 5 0 1 0 -24 0ZM276 532a12 5 0 1 0 24 0a12 5 0 1 0 -24 0Z" fill="${GOLD_D}"/>` +
    '<rect class="cy-gala" x="82" y="224" width="232" height="566" fill="url(#cy-gal)"/>' +
    `<g class="cy-chand">${chandelier()}</g>` +
    '<g class="cy-alw"><rect class="cy-alarm" x="82" y="224" width="232" height="566" fill="url(#cy-red)"/></g></g>' +
    // The window's bars and frame, its keystone; the alarm lamp on the pilaster.
    '<path d="M82 470H314M82 640H314M140 470V790M198 470V790M256 470V790" stroke="#1c120a" stroke-width="5"/>' +
    '<path d="M82 790V340A116 116 0 0 1 314 340V790" fill="none" stroke="#2e2416" stroke-width="10"/>' +
    `<path d="M88 790V340A110 110 0 0 1 308 340V790" fill="none" stroke="${GOLD_DD}" stroke-width="2"/>` +
    `<path d="M188 212h20l-3 24h-14Z" fill="#2a2430" stroke="${GOLD_DD}" stroke-width="1.5"/>` +
    '<g class="cy-halo"><circle cx="358" cy="252" r="80" fill="url(#cy-hal)"/></g>' +
    '<circle cx="358" cy="252" r="7" fill="#3a0c14" stroke="#5a4a40" stroke-width="2"/>' +
    '<g class="cy-halo"><circle cx="358" cy="252" r="5" fill="#ff8a96"/></g>' +
    '<path class="cy-tw cy-chase" d="M-40 214H410" stroke="#ffd98a" stroke-opacity=".8" stroke-width="4" stroke-linecap="round" stroke-dasharray=".1 9"/>'
  )
}

/** The villain's wingback chair, turned away with smoke curling up from behind it, and the white cat on top. */
function chairAndCat(): string {
  let buttons = ''

  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 5; col += 1) buttons += `M${160 + col * 24 + (row % 2) * 12} ${640 + row * 26}h.1`
  }

  return (
    `<path class="cy-smk" pathLength="1" d="M196 612c-12 -22 14 -36 2 -60c-10 -20 12 -34 2 -58" fill="none" stroke="#bab2c8" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>` +
    `<path class="cy-smk" style="animation-delay:-2.5s" pathLength="1" d="M204 612c12 -20 -12 -38 0 -62c10 -20 -10 -32 0 -54" fill="none" stroke="#bab2c8" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M142 652Q118 660 120 716L144 728ZM280 652Q304 660 302 716L278 728Z" fill="${VELVET_D}" stroke="${GOLD_DD}" stroke-width="2"/>` +
    `<path d="M146 800L142 650Q140 612 180 608H242Q282 612 280 650L276 800Z" fill="url(#cy-vel)" stroke="${GOLD_DD}" stroke-width="3"/>` +
    `<path d="${buttons}" stroke="${GOLD_D}" stroke-opacity=".75" stroke-width="3.6" stroke-linecap="round"/>` +
    // The cat: its tail hangs down the chair's back and swishes.
    '<g transform="translate(266 606)"><path class="cy-tail" d="M0 0C16 6 20 30 12 54C8 68 16 78 26 72" fill="none" stroke="#e2e0ea" stroke-width="9" stroke-linecap="round"/></g>' +
    '<path d="M226 610Q218 584 230 566Q240 552 250 552Q260 552 270 566Q282 584 274 610Z" fill="url(#cy-cat)"/>' +
    '<path d="M240 576Q250 592 260 576Q256 600 250 604Q244 600 240 576Z" fill="#fbfaff" fill-opacity=".8"/>' +
    '<path d="M235 540L232 520L246 533ZM265 540L268 520L254 533Z" fill="#e8e7f0"/><path d="M236 535L235 525L242 532ZM264 535L265 525L258 532Z" fill="#d49aae"/>' +
    '<ellipse cx="250" cy="546" rx="19" ry="15" fill="#eceaf3"/>' +
    '<path d="M231 550q-7 3 -3 9M269 550q7 3 3 9" fill="none" stroke="#eceaf3" stroke-width="3"/>' +
    '<g class="cy-cglow"><circle cx="243" cy="545" r="10" fill="url(#cy-eyeg)"/><circle cx="257" cy="545" r="10" fill="url(#cy-eyeg)"/></g>' +
    '<g class="cy-ceye"><ellipse cx="243" cy="545" rx="3.6" ry="2.4" fill="#9fdc62"/><ellipse cx="257" cy="545" rx="3.6" ry="2.4" fill="#9fdc62"/>' +
    '<path d="M243 543v4M257 543v4" stroke="#0c0c10" stroke-width="1.4"/></g>' +
    '<path d="M248 551h4l-2 2.4Z" fill="#c98a9e"/>'
  )
}

/** The cigarette case that is really a laptop: engraved silver, a gilt clasp, Claude's starburst; its tricks by activity. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `M${f(252 + i * 9.6)} 321h6v2h-6z`).join('')
  // Claude's starburst engraved on the case's front edge.
  const star = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 1.3 : 3.6
    const a = rad(i * 22.5 - 90)

    return `${f(284.5 + r * Math.cos(a))} ${f(326.5 + r * Math.sin(a) * 0.8)}`
  }).join('L')
  const cards =
    activity === 'thinking'
      ? Array.from(
          { length: 7 },
          (_, i) =>
            `<g transform="translate(353 316)" style="--k:${f((-i * 0.96) / 7)}s"><g class="cy-cx"><g class="cy-cy">` +
            `<rect class="cy-cr" x="-6.5" y="-9" width="13" height="18" rx="1.6" fill="${CREAM}" stroke="#8a1a2a" stroke-width="1.4"/></g></g></g>`,
        ).join('')
      : ''
  const periscope =
    activity === 'tool'
      ? '<g transform="translate(336 260)"><g class="cy-peri"><path d="M0 0V-22" stroke="#a4a4b4" stroke-width="2.6"/><g class="cy-swiv">' +
        `<path d="M-9 -34h13v-7h-13z" fill="#2a2a36" stroke="${GOLD_D}" stroke-width="1.2"/>` +
        `<path d="M-10 -37.5L-130 -58V-44Z" fill="${LASER}" fill-opacity=".16"/><circle cx="-9" cy="-37.5" r="2.2" fill="${LASER}"/></g></g></g>`
      : ''

  return (
    `<rect x="246" y="320" width="76" height="10" rx="3" fill="${SILVER}"/><rect x="248" y="320" width="72" height="2" rx="1" fill="#c4c4d2"/>` +
    '<path d="M251 325.5h27M291 325.5h27M251 328h27M291 328h27" stroke="#55556a" stroke-width="1"/>' +
    `<path d="M${star}Z" fill="#d97757"/>` +
    `<path d="${keys}" fill="${light}" fill-opacity=".6"/>` +
    `<path d="M317 329L332 262L340 264L326 330Z" fill="${SILVER}"/>` +
    `<path d="M318 326L332 266L335 267L322 327Z" fill="${light}"/><path d="M318 326L332 266L322 268L309 326Z" fill="${light}" fill-opacity=".16"/>` +
    '<path d="M336 272L331 294M339 276L334 300" stroke="#5a5a6e" stroke-width="1"/>' +
    `<rect x="331" y="259" width="10" height="4" rx="1.5" fill="${GOLD_D}"/>` +
    cards +
    periscope
  )
}

/** A small deck of cards lying on the baize, `n` cards high. */
const deck = (x: number, n: number) =>
  `<rect x="${x}" y="${f(329 - n * 1.6)}" width="16" height="${f(n * 1.6 + 1)}" fill="${CREAM}"/>` +
  `<rect x="${x}" y="${f(326.5 - n * 1.6)}" width="16" height="3" fill="#8a1a2a"/>`

export function casinoSpyWorld(): World {
  const next = random(4807)
  const starPath = (n: number) =>
    Array.from({ length: n }, () => `M${f(next() * 1600)} ${f(next() * 420)}h.1`).join('')
  const top = (x: number) =>
    x < 1190 ? 547 - ((x - 960) / 230) * 91 : x < 1392 ? 456 - ((x - 1190) / 202) * 72 : 384 + ((x - 1392) / 268) * 36
  const lights = (n: number) =>
    Array.from({ length: n }, () => {
      const x = 1090 + next() * 520
      const y = top(x) + 14 + next() * (532 - top(x) - 14)

      return `M${f(x)} ${f(Math.min(538, y))}h.1`
    }).join('')
  const glints = Array.from({ length: 9 }, (_, i) => {
    const x = i < 3 ? 40 + next() * 380 : i < 5 ? 480 + next() * 640 : 1180 + next() * 400
    const dim = i >= 3 && i < 5

    return (
      `<ellipse class="cy-gl" style="animation-delay:${f(-next() * 4)}s" cx="${f(x)}" cy="${f(566 + next() * 128)}" rx="${f(16 + next() * 22)}" ry="1.8" ` +
      `fill="#cfc4a0" fill-opacity="${dim ? 0.12 : 0.3}"/>`
    )
  }).join('')
  const floor =
    Array.from({ length: 17 }, (_, i) => `M${800 + (i - 8) * 46} 782L${800 + (i - 8) * 170} 1010`).join('') +
    [800, 826, 862, 912, 976].map(y => `M0 ${y}H1600`).join('')
  const piers = [432, 806, 1180, 1556]
  const pier = (x: number) => `M${x - 16} 690h32v96h-32ZM${x - 20} 684h40v8h-40Z`
  const urn = (x: number) => `M${x - 14} 684h28l-4 -6c8 -6 10 -20 0 -28h-20c-10 8 -8 22 0 28Z`
  const emitter = (x: number) =>
    `<circle cx="${x}" cy="748" r="4.5" fill="#22080e" stroke="#3a3040" stroke-width="1.5"/>` +
    `<g class="cy-elens"><circle cx="${x}" cy="748" r="16" fill="url(#cy-eg)"/><circle cx="${x}" cy="748" r="3" fill="#ffa0b0"/></g>`

  const style =
    orbit('cy-ride', POCKET, 1, 16) +
    orbit('cy-orb', TRACK, -1, 16) +
    landing() +
    '@keyframes cy-in{to{opacity:1}}' +
    // Ambient: stars and coast lights twinkle, the salon glows, the chandelier glints, smoke curls, the cat's tail swishes.
    '.cy-tw{animation:cy-tw 3.6s ease-in-out infinite alternate}@keyframes cy-tw{from{opacity:.25}to{opacity:1}}' +
    '.cy-glow{animation:cy-glow 5s ease-in-out infinite alternate}@keyframes cy-glow{from{opacity:.78}to{opacity:1}}' +
    '.cy-sp{opacity:0;transform-box:fill-box;transform-origin:center;animation:cy-sp 3.4s ease-in-out infinite}' +
    '@keyframes cy-sp{0%,62%,100%{opacity:0;transform:scale(.3)}78%{opacity:1;transform:scale(1)}}' +
    '.cy-smk{stroke-dasharray:.3 .7;animation:cy-smk 5s linear infinite}@keyframes cy-smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
    '.cy-tail{animation:cy-tail 3s ease-in-out infinite alternate}@keyframes cy-tail{from{transform:rotate(-7deg)}to{transform:rotate(10deg)}}' +
    '.cy-ceye{transform-box:fill-box;transform-origin:center;animation:cy-blink 5.2s steps(1) infinite}@keyframes cy-blink{0%,92%{transform:scaleY(1)}93%,97%{transform:scaleY(.1)}}' +
    '.cy-palm{animation:cy-palm 6s ease-in-out infinite alternate}@keyframes cy-palm{from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}}' +
    '.cy-gl{animation:cy-gl 3.4s ease-in-out infinite alternate}@keyframes cy-gl{from{opacity:.3;transform:translateX(-5px)}to{opacity:1;transform:translateX(5px)}}' +
    '.cy-ref{animation:cy-gl 4s ease-in-out infinite alternate}' +
    '.cy-nav{animation:cy-nav 2.4s steps(1) infinite}@keyframes cy-nav{0%,70%{opacity:.25}71%,100%{opacity:1}}' +
    '.cy-beam{animation:cy-sweep 11s ease-in-out infinite alternate}@keyframes cy-sweep{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
    '.cy-wh{animation:cy-spin 60s linear infinite}@keyframes cy-spin{to{transform:rotate(360deg)}}' +
    '.cy-ball{animation:cy-ride 60s linear infinite}' +
    '.cy-cglow,.cy-alw,.cy-halo,.cy-pool,.cy-fan,.cy-fw,.cy-rise,.cy-pay,.cy-ring,.cy-elens{opacity:0}' +
    // Thinking: a spring of cards arcs from one half-deck to the other over the glass.
    '.cy-cx{animation:cy-cx .96s linear var(--k) infinite}@keyframes cy-cx{to{transform:translateX(52px)}}' +
    '.cy-cy{animation:cy-cy .96s var(--k) infinite}@keyframes cy-cy{0%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}' +
    '50%{transform:translateY(-84px);animation-timing-function:cubic-bezier(.6,0,.8,.3)}100%{transform:translateY(0)}}' +
    '.cy-cr{transform-box:fill-box;transform-origin:center;animation:cy-cr .96s linear var(--k) infinite}@keyframes cy-cr{to{transform:rotate(320deg)}}' +
    // Responding: the gala warms up: the salon brightens, the crystals shimmer, the lights chase along the cornice.
    '.st-responding .cy-wh,.st-responding .cy-ball{animation-duration:16s}.st-responding .cy-sp{animation-duration:1.6s}' +
    '.cy-gala{opacity:0}.st-responding .cy-gala{animation:cy-in 1s ease-out both}' +
    '.st-responding .cy-chase{animation:cy-chase .6s linear infinite}@keyframes cy-chase{to{stroke-dashoffset:-9.1}}' +
    '.st-responding .cy-dress{animation:cy-dress 1.2s linear infinite}' +
    // Tool: a periscope lens pops out of the case and swivels; the emitters in the balustrade arm and blink.
    '.cy-peri{transform-box:fill-box;transform-origin:50% 100%;animation:cy-peri .5s ease-out both}@keyframes cy-peri{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
    '.cy-swiv{transform-box:fill-box;transform-origin:100% 50%;animation:cy-swiv 1s ease-in-out infinite alternate}@keyframes cy-swiv{from{transform:rotate(-10deg)}to{transform:rotate(12deg)}}' +
    '.st-tool .cy-elens{animation:cy-arm .9s ease-in-out infinite alternate}@keyframes cy-arm{from{opacity:.1}to{opacity:.9}}' +
    // Read: the white cat wakes and stares.
    '.st-read .cy-cglow{animation:cy-in .8s ease-out both}.st-read .cy-ceye{animation:cy-wide .8s ease-out both}@keyframes cy-wide{to{transform:scale(1.3,1.6)}}' +
    '.st-read .cy-tail{animation-duration:7s}' +
    // Web: the yacht's radar turns, rings pulse from its mast, its lights chase from bow to stern.
    '.st-web .cy-radar{animation:cy-radar 1.2s ease-in-out infinite}@keyframes cy-radar{50%{transform:scaleX(-1)}}' +
    '.cy-ring{transform-box:fill-box;transform-origin:center}' +
    '.st-web .cy-ring{animation:cy-ring 1.5s ease-out infinite}@keyframes cy-ring{0%{opacity:0;transform:scale(.4)}25%{opacity:.85}100%{opacity:0;transform:scale(2.6)}}' +
    '.st-web .cy-dress{animation:cy-dress 1s linear infinite}@keyframes cy-dress{to{stroke-dashoffset:-22.2}}' +
    // Run: the wheel spins to a blur with gold glints racing round its rim, the ball runs the other way, the chips hop,
    // the chandelier sways, and a thin scanner sweeps low over the terrace from the right pier.
    '.st-run .cy-wh{animation:cy-spin 1.2s linear infinite}.st-run .cy-ball{animation:cy-orb .72s linear infinite}' +
    '.cy-rg,.cy-blur{opacity:0}.st-run .cy-blur{animation:cy-in .5s ease-out both}.st-run .cy-rg{opacity:1;animation:cy-spin .8s linear infinite}' +
    '.st-run .cy-hop{animation:cy-hop .5s ease-out var(--d) infinite}@keyframes cy-hop{0%,70%,100%{transform:translateY(0)}30%{transform:translateY(-12px)}}' +
    '.cy-leap{transform-box:fill-box;transform-origin:center}.st-run .cy-leap{animation:cy-leap 1s ease-in-out var(--d) infinite}' +
    '@keyframes cy-leap{0%,80%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-34px) rotate(-30deg)}}' +
    '.cy-chand{transform-origin:198px 226px}.st-run .cy-chand{animation:cy-swing 1.3s ease-in-out infinite alternate}@keyframes cy-swing{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}.st-run .cy-sp{animation-duration:1.2s}' +
    '.st-run .cy-fan{animation:cy-in .5s ease-out .4s both}.st-run .cy-elens{animation:cy-in .3s ease-out both}' +
    '.st-run .cy-swa{animation:cy-swa 2.2s ease-in-out infinite alternate}@keyframes cy-swa{from{transform:rotate(-12deg)}to{transform:rotate(10deg)}}' +
    // Error: the alarm turns the salon red, the yacht's searchlight sweeps over the terrace and pins Claude; the cat glares.
    '.st-error .cy-wh,.st-error .cy-ball{animation:none}' +
    '.st-error .cy-alw{animation:cy-in .3s ease-out both}.st-error .cy-alarm{animation:cy-alarm 2.2s ease-in-out infinite}@keyframes cy-alarm{0%,100%{opacity:.35}50%{opacity:.85}}' +
    '.st-error .cy-halo{animation:cy-halo 2.2s ease-in-out infinite}@keyframes cy-halo{0%,100%{opacity:.3}50%{opacity:1}}' +
    '.st-error .cy-beam{animation:cy-catch 2.4s cubic-bezier(.45,0,.25,1) both}' +
    '@keyframes cy-catch{0%{transform:rotate(0)}55%{transform:rotate(-78deg)}75%{transform:rotate(-89deg)}100%{transform:rotate(-85deg)}}' +
    '.st-error .cy-pool{animation:cy-pool 2.4s ease-out both}@keyframes cy-pool{0%,50%{opacity:0}75%,100%{opacity:1}}' +
    '.st-error .cy-cglow{animation:cy-in .4s ease-out both}.st-error .cy-tail{animation:cy-tail .4s ease-in-out infinite alternate}' +
    // Done: the ball drops into the green pocket, chips cascade onto the stacks, fireworks bloom over the bay.
    '.st-done .cy-wh{animation:cy-wdone 3s linear both}.st-done .cy-ball{animation:cy-bdone 3s linear both}' +
    '.cy-pay{transform-box:fill-box;transform-origin:center}' +
    '.st-done .cy-pay{animation:cy-pay .8s cubic-bezier(.55,0,.85,.4) var(--d) both}' +
    '@keyframes cy-pay{0%{opacity:0;transform:translateY(-320px) rotate(-50deg)}12%{opacity:1}78%{transform:translateY(0) rotate(0)}88%{transform:translateY(-7px)}100%{opacity:1;transform:translateY(0)}}' +
    '.st-done .cy-rise{animation:cy-rise 2.6s ease-out infinite;animation-delay:var(--d)}' +
    '@keyframes cy-rise{0%{opacity:0;transform:translateY(var(--h))}4%{opacity:.9}22%{opacity:.9;transform:translateY(0)}26%,100%{opacity:0;transform:translateY(0)}}' +
    '.st-done .cy-fw{animation:cy-fw 2.6s ease-out infinite;animation-delay:var(--d)}' +
    '@keyframes cy-fw{0%,22%{opacity:0;transform:scale(.15)}32%{opacity:.95;transform:scale(.8)}60%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.08) translateY(12px)}}' +
    // The searchlight goes dark, then comes back pointing up into the sky like a premiere's.
    '.st-done .cy-beam{animation:cy-up 2.6s ease-in-out both}' +
    '@keyframes cy-up{0%{opacity:1;transform:rotate(0)}18%{opacity:0;transform:rotate(0)}19%{opacity:0;transform:rotate(86deg)}55%{opacity:1;transform:rotate(80deg)}100%{opacity:1;transform:rotate(90deg)}}' +
    '.st-done .cy-dress{animation:cy-dress 1.4s linear infinite}'

  const scenery =
    '<defs>' +
    '<linearGradient id="cy-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05050a"/><stop offset=".7" stop-color="#0b0b17"/><stop offset="1" stop-color="#191832"/></linearGradient>' +
    '<linearGradient id="cy-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11122a"/><stop offset="1" stop-color="#07070e"/></linearGradient>' +
    '<linearGradient id="cy-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a4a8ba"/><stop offset="1" stop-color="#3e4256"/></linearGradient>' +
    '<linearGradient id="cy-bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3d6" stop-opacity="0"/><stop offset=".7" stop-color="#fff3d6" stop-opacity=".1"/><stop offset="1" stop-color="#fff3d6" stop-opacity=".34"/></linearGradient>' +
    '<radialGradient id="cy-lamp"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="cy-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e0c14"/><stop offset=".5" stop-color="#18141f"/><stop offset="1" stop-color="#0d0b12"/></linearGradient>' +
    '<radialGradient id="cy-winf" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#7a5824"/><stop offset=".5" stop-color="#4a3014"/><stop offset="1" stop-color="#1e1208"/></radialGradient>' +
    '<radialGradient id="cy-chg"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset=".35" stop-color="#ffc870" stop-opacity=".22"/><stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="cy-vel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#701c30"/><stop offset="1" stop-color="#2e0814"/></linearGradient>' +
    '<linearGradient id="cy-cat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b6b4c6"/><stop offset=".5" stop-color="#eceaf3"/><stop offset="1" stop-color="#d6d4e2"/></linearGradient>' +
    '<radialGradient id="cy-eyeg"><stop offset="0" stop-color="#c8ff8a" stop-opacity=".9"/><stop offset="1" stop-color="#9fdc62" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="cy-red" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ff3048" stop-opacity=".7"/><stop offset="1" stop-color="#a0101c" stop-opacity=".45"/></radialGradient>' +
    '<radialGradient id="cy-hal"><stop offset="0" stop-color="#ff3048" stop-opacity=".55"/><stop offset="1" stop-color="#ff3048" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="cy-wood"><stop offset=".6" stop-color="#3e2214"/><stop offset="1" stop-color="#1a0c07"/></radialGradient>' +
    '<radialGradient id="cy-cone"><stop offset="0" stop-color="#7a5a28"/><stop offset="1" stop-color="#2e1c0c"/></radialGradient>' +
    `<linearGradient id="cy-felt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BAIZE}"/><stop offset="1" stop-color="#082a1c"/></linearGradient>` +
    '<radialGradient id="cy-spill"><stop offset="0" stop-color="#ffc870" stop-opacity=".2"/><stop offset="1" stop-color="#ffc870" stop-opacity="0"/></radialGradient>' +
    `<linearGradient id="cy-lz" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${LASER}" stop-opacity=".8"/><stop offset=".5" stop-color="${LASER}" stop-opacity=".3"/><stop offset="1" stop-color="${LASER}" stop-opacity="0"/></linearGradient>` +
    '<radialGradient id="cy-gal" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".6"/><stop offset=".5" stop-color="#ffc870" stop-opacity=".3"/><stop offset="1" stop-color="#ffb050" stop-opacity=".1"/></radialGradient>' +
    `<radialGradient id="cy-eg"><stop offset="0" stop-color="${LASER}" stop-opacity=".8"/><stop offset="1" stop-color="${LASER}" stop-opacity="0"/></radialGradient>` +
    '<radialGradient id="cy-moon"><stop offset=".25" stop-color="#e8dcc0" stop-opacity=".2"/><stop offset="1" stop-color="#e8dcc0" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="cy-wg"><stop offset="0" stop-color="#ffe6a0" stop-opacity=".42"/><stop offset=".6" stop-color="#ffc860" stop-opacity=".2"/><stop offset="1" stop-color="#ffc860" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="cy-fwg"><stop offset="0" stop-color="#fff4dc" stop-opacity=".32"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient>' +
    `<clipPath id="cy-wc"><path d="${WIN}"/></clipPath>` +
    '</defs>' +
    // The night sky and its stars.
    '<rect width="1600" height="560" fill="url(#cy-sky)"/>' +
    `<path d="${starPath(14)}" stroke="#dcd8f0" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>` +
    `<path class="cy-tw" d="${starPath(16)}" stroke="#ece8ff" stroke-opacity=".8" stroke-width="2.2" stroke-linecap="round"/>` +
    // Fireworks over the bay, behind the headland and the dome.
    // Over the dome too, so done still shows fireworks while the helpers' portals cover the right.
    `<g class="mv-t">${burst(100, 58, 70, GOLD, -0.4)}${burst(350, 94, 62, '#ffb8cc', 1)}${burst(236, 28, 50, GOLD, 1.9)}</g>` +
    '<g class="mv-r"><g class="mv-t">' +
    // The moon behind the palm.
    '<circle cx="1486" cy="176" r="130" fill="url(#cy-moon)"/><circle cx="1486" cy="176" r="38" fill="#efe6cf" fill-opacity=".82"/>' +
    '<circle cx="1474" cy="166" r="9" fill="#d8ccb0" fill-opacity=".5"/><circle cx="1496" cy="190" r="6" fill="#d8ccb0" fill-opacity=".45"/>' +
    `${burst(1282, 150, 92, GOLD, 0.3)}${burst(1400, 296, 74, '#b8e0ff', 1.3)}</g></g>` +
    // The far shore, low on the horizon, and the headland at the right with its village climbing the slope.
    '<path d="M430 547C520 538 620 530 720 534C800 537 880 542 960 547Z" fill="#0d0d1a"/>' +
    '<path d="M560 540h.1M640 536h.1M700 537h.1M790 540h.1" stroke="#e8b86a" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>' +
    '<g class="mv-r">' +
    '<path d="M900 547C980 536 1050 516 1120 504C1190 494 1250 470 1300 462L1300 547Z" fill="#0e0e1b"/>' +
    '<path d="M960 547C1040 530 1110 486 1190 456C1260 428 1320 392 1392 384C1470 378 1560 396 1660 420V547Z" fill="#09090f"/>' +
    `<path d="${lights(18)}" stroke="#f2c27a" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path class="cy-tw" d="${lights(16)}" stroke="#ffd690" stroke-opacity=".8" stroke-width="2.6" stroke-linecap="round"/>` +
    '<path d="M980 543L1660 541" stroke="#f2c27a" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round" stroke-dasharray=".1 9"/></g>' +
    // The bay: dark water, glints, the shore lights' reflections.
    '<rect y="547" width="1600" height="240" fill="url(#cy-sea)"/>' +
    glints +
    '<g class="mv-r"><path d="M1000 552v18M1060 552v14M1130 552v20M1210 552v12M1590 552v16" stroke="#f2c27a" stroke-opacity=".16" stroke-width="3" stroke-dasharray="3 3"/>' +
    yacht() +
    '</g>' +
    // The terrace: its marble floor, the balustrade along the cliff edge with its piers and urns.
    '<rect y="782" width="1600" height="228" fill="#0a0910"/>' +
    `<path d="${floor}" stroke="${GOLD_DD}" stroke-opacity=".22" stroke-width="1.4" fill="none"/>` +
    '<path d="M410 742H1640" stroke="#16131d" stroke-width="56" stroke-dasharray="9 15"/>' +
    `<path d="M408 702h1232v12h-1232ZM408 770h1232v12h-1232Z${piers.map(pier).join('')}${urn(432)}${urn(1180)}" fill="#16131d"/>` +
    `<path d="M408 702H1640M412 684H452M786 684H826M1160 684H1200M1536 684H1576" stroke="${GOLD_D}" stroke-opacity=".28" stroke-width="2"/>` +
    emitter(432) +
    emitter(1180) +
    // The hidden laser grid.
    scanner() +
    '<g class="mv-r">' +
    palm() +
    '</g>' +
    // The casino, the villain's chair and cat, the roulette table.
    facade() +
    chairAndCat() +
    '<g class="mv-b">' +
    '<ellipse cx="200" cy="836" rx="280" ry="70" fill="url(#cy-spill)"/>' +
    '<path d="M-60 792H452Q466 792 466 806V816H-60Z" fill="#2a1610"/>' +
    `<path d="M-60 804H462" stroke="${GOLD_D}" stroke-opacity=".5" stroke-width="2"/>` +
    '<path d="M-60 816H444Q458 816 460 832L472 1010H-60Z" fill="url(#cy-felt)"/>' +
    `<path d="M-60 828H448" stroke="${GOLD_D}" stroke-opacity=".3" stroke-width="1.6"/>` +
    wheel() +
    chips() +
    '</g>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#050509',
      furniture: '#2a1610',
      metal: SILVER,
      paper: CREAM,
      light: { idle: '#a08850', work: GOLD, bright: '#fff0c8' },
      headTop: 238,
      glowAt: [326, 292],
      device,
      wear: {
        front:
          // A dinner jacket whose sides rise past the arms while its front stays below the eyes, satin lapels, a dress
          // shirt with studs, the black bow tie, a pocket square, and a spy's earpiece with its coiled wire.
          '<path d="M70 296H98V318H128L150 350H70ZM230 296H202V318H172L150 350H230Z" fill="#0c0c13"/>' +
          '<path d="M98 297V318H128L150 348M202 297V318H172L150 348" fill="none" stroke="#3a3a48" stroke-width="3"/>' +
          '<path d="M128 318H172L150 350Z" fill="#ecebe6"/>' +
          '<path d="M150 337h.1M150 344h.1" stroke="#15151c" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M134 319L148 324V328L134 333ZM166 319L152 324V328L166 333Z" fill="#08080c"/><rect x="146" y="322" width="8" height="8" rx="2" fill="#20202a"/>' +
          '<path d="M78 304L84 298L90 304Z" fill="#ecebe6"/>' +
          '<rect x="227" y="262" width="6" height="9" rx="3" fill="#15151c"/>' +
          '<path d="M230 271c4 3 -4 5 0 8c4 3 -4 5 0 8c4 3 -4 5 0 8" fill="none" stroke="#15151c" stroke-width="1.6"/>',
      },
      seatArt:
        // A crimson velvet chair: a tufted medallion back peeking out behind Claude, the cushion, gilt cabriole legs.
        `<ellipse cx="74" cy="286" rx="34" ry="62" fill="${VELVET}" stroke="${GOLD_D}" stroke-width="4"/>` +
        `<path d="M58 262h.1M90 262h.1M74 286h.1M58 310h.1M90 310h.1" stroke="${GOLD_D}" stroke-width="4" stroke-linecap="round"/>` +
        '<rect x="98" y="346" width="106" height="16" rx="8" fill="#6e1a2e"/>' +
        `<path d="M104 362H198L194 394H108Z" fill="${VELVET_D}" stroke="${GOLD_D}" stroke-width="2"/>` +
        `<path d="M112 394C104 416 120 430 110 454M190 394C198 416 182 430 192 454" fill="none" stroke="${GOLD_D}" stroke-width="5" stroke-linecap="round"/>`,
      tableArt:
        // A baize card table: the felt, a padded rail with a gilt line, the apron, two turned legs; a martini glass
        // between two half-decks of cards.
        `<path d="M170 323H462L468 331H164Z" fill="${BAIZE}"/>` +
        '<rect x="160" y="329" width="314" height="14" rx="7" fill="#2a1610"/><path d="M168 332H466" stroke="#5a3420" stroke-width="2"/>' +
        `<path d="M166 338H468" stroke="${GOLD_D}" stroke-opacity=".6" stroke-width="1.4"/>` +
        '<path d="M174 343H460L452 362H182Z" fill="#170c08"/>' +
        `<path d="M190 352H446" stroke="${GOLD_D}" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="6 5"/>` +
        '<path d="M186 362h14v12c-6 8 -6 18 0 26v46h-14v-46c6 -8 6 -18 0 -26ZM432 362h14v12c-6 8 -6 18 0 26v46h-14v-46c6 -8 6 -18 0 -26Z" fill="#1e100b"/>' +
        `<path d="M184 448h18v8h-18zM430 448h18v8h-18z" fill="${GOLD_D}"/>` +
        deck(345, 5) +
        deck(398, 3) +
        '<path d="M362 292H390L376 310Z" fill="#e8e6f6" fill-opacity=".14" stroke="#dcdcec" stroke-opacity=".75" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M366 295H386L376 306Z" fill="#e6d79a" fill-opacity=".35"/>' +
        '<path d="M376 310V327M369 329H383" stroke="#dcdcec" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M370 288L384 304" stroke="#c9a24a" stroke-width="1.2"/><circle cx="380" cy="299" r="3" fill="#7a9a32"/>',
    },
    style,
    scenery,
    nook:
      // A champagne bucket on its stand beside the card table.
      `<path d="M14 456L20 372M38 456L32 372M6 456L26 400M46 456L26 400" stroke="${GOLD_DD}" stroke-width="3" stroke-linecap="round"/>` +
      '<path d="M20 334L28 296L36 298L30 336Z" fill="#0f2a1c"/><path d="M27 300L29 290L36 291L35 302Z" fill="#b0904c"/>' +
      '<path d="M2 334H44L38 372H8Z" fill="#8a8a9a"/><path d="M0 330h46v6h-46Z" fill="#b8b8c8"/>' +
      '<path d="M10 344l4 -4l4 4M26 348l4 -4l4 4" fill="none" stroke="#e8eef8" stroke-opacity=".7" stroke-width="1.6"/>',
    front:
      // The searchlight's pool when it finds Claude.
      '<defs><radialGradient id="cy-pg"><stop offset="0" stop-color="#fff6e0" stop-opacity=".26"/><stop offset=".5" stop-color="#fff6e0" stop-opacity=".1"/><stop offset="1" stop-color="#fff6e0" stop-opacity="0"/></radialGradient></defs>' +
      '<g class="cy-pool"><circle cx="230" cy="300" r="250" fill="url(#cy-pg)"/><ellipse cx="230" cy="452" rx="210" ry="22" fill="#fff4d8" fill-opacity=".12"/></g>',
  }
}
