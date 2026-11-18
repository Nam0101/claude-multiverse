import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Void Drift: an astronaut in an EVA helmet at a flight computer on a small work platform drifting in deep space.
// A colossal banded gas giant fills the left and the top, its rings slicing across its face, a great storm turning
// on it, small moons around. A command fires the thrusters, the mast and wing sway and a moon crosses the planet's lit
// face; an error is a micrometeoroid striking the solar wing, a panel tearing off in sparks, papers floating off; done sweeps
// the sunrise along the planet's terminator and runs a glint out along the rings.
const VIOLET = '#9b7bff'
const SUIT = '#d3cde6'
const SUIT_EDGE = '#7f78a0'
const HULL = '#221e38'
const HULL_EDGE = '#433d66'
const GOLD = '#b7974e'

// The planet in the picture: its centre and radius, the tilt of its equator and rings, how open the rings are.
const PX = 150
const PY = 250
const PR = 520
const TILT = -30
const OPEN = 0.28
const COS = Math.cos((TILT * Math.PI) / 180)
const SIN = Math.sin((TILT * Math.PI) / 180)

/** A line of latitude across the face, in the planet's tilted frame: a bow that dips toward the viewer. */
function bow(phi: number, back: boolean): string {
  const r = (phi * Math.PI) / 180
  const y = -PR * Math.sin(r) * Math.sqrt(1 - OPEN * OPEN)
  const s = PR * Math.cos(r) * OPEN
  const w = PR + 80
  const end = y + s * (1 - (w * w) / (PR * PR))
  const mid = 2 * (y + s) - end

  return back ? `L${w} ${f(end)}Q0 ${f(mid)} ${-w} ${f(end)}` : `M${-w} ${f(end)}Q0 ${f(mid)} ${w} ${f(end)}`
}

// The cloud bands from north to south: latitude where each starts and ends, and its colour.
const BANDS: readonly (readonly [number, number, string])[] = [
  [66, 54, '#2a2452'],
  [54, 44, '#3f3572'],
  [44, 37, '#26204a'],
  [37, 28, '#5c4b8e'],
  [28, 21, '#3a3066'],
  [21, 13, '#8770a8'],
  [13, 5, '#ad8fa4'],
  [5, -4, '#7a63a2'],
  [-4, -11, '#4c3e7c'],
  [-11, -20, '#9a7eaa'],
  [-20, -28, '#614f90'],
  [-28, -37, '#342b60'],
  [-37, -47, '#6c5b9a'],
  [-47, -58, '#3b3268'],
  [-58, -70, '#29224e'],
]

// The rings, inside out: radius along the long axis, stroke width, opacity, and which of three tones.
const RINGS: readonly (readonly [number, number, number, number])[] = [
  [612, 4, 0.2, 2],
  [632, 4, 0.22, 2],
  [654, 4, 0.26, 2],
  [674, 4, 0.3, 2],
  [694, 6, 0.55, 0],
  [714, 6, 0.7, 0],
  [736, 6, 0.8, 0],
  [758, 6, 0.68, 0],
  [778, 6, 0.8, 0],
  [800, 6, 0.66, 0],
  [818, 4, 0.5, 0],
  [852, 5, 0.5, 1],
  [870, 6, 0.58, 1],
  [890, 5, 0.52, 1],
  [924, 5, 0.46, 1],
  [942, 4, 0.36, 1],
]

/** The near half of a ring, in the picture: from its far left tip, round the side facing us, to its far right tip. */
function ringArc(rx: number): string {
  return (
    `M${f(PX - rx * COS)} ${f(PY - rx * SIN)}A${f(rx)} ${f(rx * OPEN)} ${TILT} 0 0 ` +
    `${f(PX + rx * COS)} ${f(PY + rx * SIN)}`
  )
}

/** A moon lit from the left: the dark disc, the lit part (k > 0 more than half, k < 0 a crescent), its craters. */
function moon(r: number, k: number, lit: string, dark: string, craters: readonly (readonly [number, number, number])[]): string {
  return (
    `<circle r="${r}" fill="${dark}"/>` +
    `<path d="M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${f(Math.abs(k) * r)} ${r} 0 0 ${k > 0 ? 0 : 1} 0 ${-r}Z" fill="${lit}"/>` +
    `<g fill="#000" fill-opacity=".2">${craters.map(([x, y, c]) => `<circle cx="${f(x * r)}" cy="${f(y * r)}" r="${f(c * r)}"/>`).join('')}</g>` +
    `<circle r="${r}" fill="none" stroke="#e8e0ff" stroke-opacity=".12" stroke-width="1.5"/>`
  )
}

/** Stars as one path of tiny squares. */
function dots(points: readonly (readonly [number, number, number])[]): string {
  return points.map(([x, y, s]) => `M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${f(-s)}z`).join('')
}

/** A four-point star with a soft halo. */
function sparkle(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="vd-t1" style="animation-delay:${delay}s">` +
    '<circle r="7" fill="#d8ccff" fill-opacity=".14"/><path d="M0 -8L1.2 -1.2L8 0L1.2 1.2L0 8L-1.2 1.2L-8 0L-1.2 -1.2Z" fill="#f2eeff"/></g></g>'
  )
}

/** A thruster's plume pointing left from its nozzle at (x, y), turned, stretched and widened, hidden until fired. */
function plume(x: number, y: number, angle: number, len: number, wide: number, cls: string): string {
  return (
    `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${len} ${wide})"><g class="vd-pf ${cls}" opacity="0">` +
    '<path d="M0 -8L-92 -26Q-122 0 -92 26L0 8Z" fill="#a98cff" fill-opacity=".5"/>' +
    '<path d="M0 -6L-70 -14Q-88 0 -70 14L0 6Z" fill="#ddd2ff" fill-opacity=".8"/>' +
    '<path d="M0 -4L-44 -4.5Q-52 0 -44 4.5L0 4Z" fill="#ffffff"/><ellipse cx="-5" rx="5" ry="9" fill="#ffffff" fill-opacity=".9"/></g></g>'
  )
}

/** The keyboard, and the flight computer on its post with an orbit plot, a ship going round, a drink pouch. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const extra =
    activity === 'run'
      ? '<rect class="vd-bar" x="346" y="289" width="52" height="4" fill="#ffffff" fill-opacity=".8"/>'
      : activity === 'error'
        ? '<path d="M372 280L381 295H363Z" fill="none" stroke="#ffc45a" stroke-width="2.4" stroke-linejoin="round"/>'
        : `<path d="M346 291H366M372 290H398" stroke="${light}" stroke-opacity=".6" stroke-width="2.4"/>`

  return (
    '<rect x="244" y="321" width="94" height="9" rx="3" fill="#2a2742" stroke="#4a4570" stroke-width="1.5"/>' +
    keys +
    '<path d="M372 330V304" stroke="#2a2742" stroke-width="8"/>' +
    '<path d="M330 236L412 230L414 304L334 308Z" fill="#1b1830" stroke="#4a4570" stroke-width="2.5" stroke-linejoin="round"/>' +
    `<path d="M337 243L406 238L408 297L340 301Z" fill="${light}" fill-opacity=".2"/>` +
    `<path d="M337 243L340 301" stroke="${light}" stroke-width="2.5"/>` +
    `<g transform="translate(372 264) rotate(-14)"><ellipse rx="25" ry="10.5" fill="none" stroke="${light}" stroke-opacity=".75" stroke-width="1.6"/>` +
    `<circle r="6" fill="${light}" fill-opacity=".9"/><path d="M-11 1H11" stroke="${light}" stroke-opacity=".7" stroke-width="1.4"/>` +
    '<g transform="scale(1 .42)"><g class="vd-sat"><circle cx="25" r="3.6" fill="#ffffff"/></g></g></g>' +
    extra +
    '<path d="M396 330L394 314Q394 309 399 309H406Q411 309 411 314L409 330Z" fill="#cfc7ea" fill-opacity=".55"/>' +
    `<path d="M404 309L410 296" stroke="${VIOLET}" stroke-width="2"/>`
  )
}

const STYLE =
  // Ambient: stars twinkle, the storm turns, spots drift along the bands, the outer ring shimmers, moons drift.
  '.vd-t1{animation:vd-tw 3.8s ease-in-out infinite alternate}.vd-t2{animation:vd-tw 2.7s ease-in-out -1.3s infinite alternate}' +
  '@keyframes vd-tw{from{opacity:.25}to{opacity:.95}}' +
  '.vd-storm{animation:mv-spin 40s linear infinite}.st-thinking .vd-storm{animation-duration:12s}' +
  '.vd-spots{animation:vd-drift 24s ease-in-out infinite alternate}@keyframes vd-drift{from{transform:translateX(-24px)}to{transform:translateX(24px)}}' +
  '.vd-f{stroke-dasharray:26 9 5 14 38 8;animation:vd-f 10s linear infinite}@keyframes vd-f{to{stroke-dashoffset:-100}}' +
  '.st-responding .vd-f{animation-duration:3.4s}' +
  '.vd-ma{animation:vd-ma 11s ease-in-out infinite alternate}@keyframes vd-ma{to{transform:translate(-8px,-5px)}}' +
  '.vd-mb{animation:vd-mb 15s ease-in-out infinite alternate}@keyframes vd-mb{to{transform:translate(-12px,7px)}}' +
  '.vd-mote{opacity:0;animation:vd-mote 20s linear infinite}' +
  '@keyframes vd-mote{0%{opacity:0;transform:translate(0,0)}12%,82%{opacity:.55}100%{opacity:0;transform:translate(-150px,-50px)}}' +
  // The platform floats with Claude (the same drift as the rig's), its nav light breathes, its solar cells glint.
  '.vd-plat{animation:vd-bob 5s ease-in-out infinite alternate}@keyframes vd-bob{to{transform:translateY(-12px)}}' +
  '.vd-nav{animation:vd-nav 2.4s ease-in-out infinite}@keyframes vd-nav{0%,100%{opacity:.2}50%{opacity:1}}' +
  '.st-responding .vd-nav{animation-duration:1.2s}' +
  '.vd-cell{animation:vd-cell 8s ease-in-out infinite}@keyframes vd-cell{0%,72%,100%{opacity:0}84%{opacity:.22}}' +
  '.vd-dish{animation:vd-scan 9s ease-in-out infinite alternate}@keyframes vd-scan{from{transform:rotate(-10deg)}to{transform:rotate(16deg)}}' +
  '.vd-rl{animation:vd-rl 7s ease-in-out infinite alternate}@keyframes vd-rl{to{transform:translate(6px,-5px) rotate(8deg)}}' +
  '.vd-blink{animation:vd-nav 1.8s ease-in-out infinite}' +
  '.vd-sat{animation:mv-spin 6s linear infinite}.st-tool .vd-sat,.st-run .vd-sat,.st-web .vd-sat{animation-duration:1.6s}' +
  '.vd-pf{transform-box:fill-box;transform-origin:100% 50%}' +
  // Thinking: soft lightning in the storms along the dusk line.
  '.vd-blip{opacity:0}.st-thinking .vd-blip{animation:vd-blip 2.6s ease-in-out infinite}' +
  '@keyframes vd-blip{0%,58%,100%{opacity:0}68%{opacity:.6}78%{opacity:.12}88%{opacity:.4}}' +
  // Tool: the pack's thruster puffs to hold station.
  '.st-tool .vd-pk{animation:vd-puff 1.7s ease-out infinite}' +
  '@keyframes vd-puff{0%,100%{opacity:0;transform:scaleX(.2)}9%{opacity:.75;transform:scaleX(.55)}26%{opacity:0;transform:scaleX(.8)}}' +
  // Web: the dish swings onto the relay satellite and signal rings run out to it.
  '.st-web .vd-dish{animation:vd-aim 1s ease-out both}@keyframes vd-aim{to{transform:rotate(-30deg)}}' +
  '.vd-sig{opacity:0}.st-web .vd-sig{animation:vd-sig 1.5s linear infinite}' +
  '@keyframes vd-sig{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(-226px,2px)}}' +
  // Run: the mast, wing and pack thrusters fire in turn, the mast and wing sway, a moon crosses the planet's lit face.
  '.st-run .vd-pu{animation:vd-burn 2.6s ease-out infinite}.st-run .vd-pw{animation:vd-burn 2.6s ease-out .9s infinite}' +
  '.st-run .vd-pk{animation:vd-burn 2.6s ease-out 1.75s infinite}' +
  '.st-run .vd-pg{animation:vd-glo 2.6s ease-out infinite}.st-run .vd-wg{animation:vd-glo 2.6s ease-out .9s infinite}' +
  '@keyframes vd-glo{0%,3%{opacity:0}8%{opacity:1}30%{opacity:.8}38%,100%{opacity:0}}' +
  '@keyframes vd-burn{0%,3%{opacity:0;transform:scaleX(.3)}8%{opacity:1;transform:scaleX(1)}30%{opacity:.85;transform:scaleX(.92)}38%,100%{opacity:0;transform:scaleX(.5)}}' +
  '.st-run .vd-sway{transform-origin:331px 440px;animation:vd-yaw 2.6s ease-in-out infinite}' +
  '@keyframes vd-yaw{0%,5%{transform:rotate(0)}40%{transform:rotate(1.6deg)}70%{transform:rotate(.6deg)}100%{transform:rotate(0)}}' +
  '.st-run .vd-mt{animation:vd-mt 3.2s cubic-bezier(.25,.6,.35,1) both}@keyframes vd-mt{to{transform:translate(90px,-450px)}}' +
  '.vd-bar{transform-box:fill-box;transform-origin:0 50%;animation:vd-fill 1.4s ease-in-out infinite}@keyframes vd-fill{from{transform:scaleX(.05)}to{transform:scaleX(1)}}' +
  // Error: a micrometeoroid streaks in and strikes the solar wing; sparks, chips and a puff of gas; papers float off.
  '.st-error .vd-mm{animation:vd-mm .55s linear both}' +
  '@keyframes vd-mm{0%{opacity:0;transform:translate(330px,-400px)}10%{opacity:1}92%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(0,0)}}' +
  '.st-error .vd-fl{animation:vd-fl 1.1s ease-out .5s both}@keyframes vd-fl{0%{opacity:0}13%{opacity:.8}100%{opacity:0}}' +
  // The struck panel tears off the boom and tumbles away, catching the light as it turns.
  '.vd-tear{transform-box:fill-box;transform-origin:center}.st-error .vd-tear{animation:vd-tear 4.4s cubic-bezier(.3,.55,.45,1) .75s both}' +
  '@keyframes vd-tear{0%{transform:translate(0,0) rotate(0)}7%{transform:translate(-3px,4px) rotate(-10deg)}100%{transform:translate(-120px,-215px) rotate(-300deg)}}' +
  '.st-error .vd-tg{animation:vd-tg 4.4s ease-in-out .75s both}' +
  '@keyframes vd-tg{0%{opacity:0}18%{opacity:.5}34%{opacity:.06}58%{opacity:.42}76%{opacity:.05}100%{opacity:.25}}' +
  '.st-error .vd-sp{animation:vd-sp .9s ease-out .5s both}@keyframes vd-sp{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
  '.vd-db{transform-box:fill-box;transform-origin:center}.st-error .vd-db{animation:vd-db 4s ease-out .5s both}' +
  '@keyframes vd-db{0%{opacity:.9;transform:translate(0,0) rotate(0)}100%{opacity:.45;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
  '.vd-ck{stroke-dasharray:1;stroke-dashoffset:1}.st-error .vd-ck{animation:vd-ck .5s ease-out .52s both}' +
  '@keyframes vd-ck{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
  '.st-error .vd-scar{animation:vd-on .3s ease-out .5s both}@keyframes vd-on{to{opacity:1}}' +
  '.vd-vent{transform-box:fill-box;transform-origin:center}.st-error .vd-vent{animation:vd-vent 2.6s ease-out .55s both}' +
  '@keyframes vd-vent{0%{opacity:0;transform:scale(.3)}15%{opacity:.35}100%{opacity:0;transform:scale(2.8)}}' +
  '.vd-pp{transform-box:fill-box;transform-origin:center}.st-error .vd-pp{animation:vd-pp 4.6s cubic-bezier(.2,.6,.4,1) both}' +
  '@keyframes vd-pp{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:.92}100%{opacity:.82;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
  '.st-error .vd-sway{transform-origin:331px 440px;animation:vd-jolt 1.4s ease-out .5s both}' +
  '@keyframes vd-jolt{0%{transform:rotate(0)}10%{transform:rotate(-1.4deg)}32%{transform:rotate(.8deg)}58%{transform:rotate(-.3deg)}100%{transform:rotate(0)}}' +
  '.st-error .vd-nav{fill:#ff5d73;animation-duration:.7s}' +
  '.vd-warn{opacity:.2}.st-error .vd-warn{animation:vd-warn .7s steps(1) infinite}@keyframes vd-warn{50%{opacity:1}}' +
  // Done: the sunrise sweeps along the terminator, a glint runs out along the rings, the solar wing catches the sun.
  '.st-done .vd-nt{animation:vd-dawn 3.4s ease-in-out .2s both}@keyframes vd-dawn{to{transform:translate(64px,-10px)}}' +
  '.vd-dw{opacity:.35}.st-done .vd-dw{animation:vd-dw 3.4s ease-in-out .2s both}@keyframes vd-dw{0%{opacity:.35}40%{opacity:.85}100%{opacity:.55}}' +
  '.vd-gl{stroke-dasharray:60 2000}.st-done .vd-gl{animation:vd-gl 2.6s ease-in-out .5s both}' +
  '@keyframes vd-gl{0%{opacity:0;stroke-dashoffset:-300}12%{opacity:1}88%{opacity:1}100%{opacity:0;stroke-dashoffset:-880}}' +
  '.st-done .vd-cell{animation:vd-sun 1.8s ease-out 1.2s both}@keyframes vd-sun{to{opacity:.4}}' +
  '.st-done .vd-rise{animation:vd-rise 1.8s ease-out .3s both}@keyframes vd-rise{to{opacity:1}}' +
  '.vd-ray{animation:mv-spin 40s linear infinite}' +
  '.vd-rim{opacity:.75}.st-done .vd-rim{animation:vd-rim 3s ease-out .4s both}@keyframes vd-rim{to{opacity:1}}'

export function voidDriftWorld(): World {
  const next = random(54)

  // Stars: only small dim ones over the chat column, two twinkling sets around it; none behind the planet.
  const dim: [number, number, number][] = []
  const tw1: [number, number, number][] = []
  const tw2: [number, number, number][] = []

  for (let i = 0; i < 170; i += 1) {
    const x = next() * 1600
    const y = next() * 1000
    const s = 1 + next() * 1.5

    if (Math.hypot(x - PX, y - PY) < PR + 3) continue

    if (x > 420 && x < 1180 && y < 900) dim.push([x, y, Math.min(s, 1.4)])
    else if (i % 3 === 0) dim.push([x, y, s])
    else (i % 3 === 1 ? tw1 : tw2).push([x, y, s + 0.3])
  }

  const bands = BANDS.map(([a, b, c]) => `<path d="${bow(a, false)}${bow(b, true)}Z" fill="${c}"/>`).join('')
  const edges = [37, 21, 13, -11, -20, -47]
    .map((p, i) => `<path d="${bow(p, false)}" stroke-dasharray="${30 + i * 7} ${12 + i * 3} ${8 + i} 20"/>`)
    .join('')
  const spots = (
    [
      [-90, 40, 16, 5, '#efe4ff', 0.45],
      [-30, -180, 13, 4, '#efe4ff', 0.35],
      [-170, 280, 14, 5, '#f2e0d8', 0.4],
      [40, 300, 10, 4, '#efe4ff', 0.3],
      [160, 30, 11, 4, '#efe4ff', 0.35],
      [-20, -10, 24, 4, '#1c1638', 0.55],
      [-140, -110, 18, 4, '#1c1638', 0.5],
      [130, -150, 16, 4, '#1c1638', 0.45],
    ] as const
  )
    .map(([x, y, rx, ry, c, o]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" fill-opacity="${o}"/>`)
    .join('')
  const arms = [0, 120, 240]
    .map(a => `<path d="M0 0C18 -18 46 -14 58 8" transform="rotate(${a})" fill="none" stroke="#e0b4cc" stroke-opacity=".45" stroke-width="7" stroke-linecap="round"/>`)
    .join('')
  const storm =
    '<g transform="translate(60 -70)"><ellipse rx="80" ry="32" fill="#e0c0c0" fill-opacity=".3"/><ellipse rx="64" ry="25" fill="#74397a"/>' +
    `<g transform="scale(1 .4)"><g class="vd-storm">${arms}</g></g><ellipse rx="15" ry="6" fill="#c08ab4"/></g>`
  const rings = RINGS.map(
    ([rx, w, o, t]) => `<path d="${ringArc(rx)}" stroke="url(#vd-r${t})" stroke-width="${w}" stroke-opacity="${o}"/>`,
  ).join('')
  const blips = (
    [
      [372, 70],
      [352, 400],
      [352, 610],
    ] as const
  )
    .map(([x, y], i) => `<circle class="vd-blip" style="animation-delay:${f(-i * 0.85)}s" cx="${x}" cy="${y}" r="38" fill="url(#vd-bl)"/>`)
    .join('')
  const motes = (
    [
      [1260, 140],
      [1430, 470],
      [1570, 300],
      [1330, 520],
      [90, 860],
      [270, 950],
      [400, 880],
    ] as const
  )
    .map(([x, y], i) => `<circle class="vd-mote" style="animation-delay:${f(-i * 2.9)}s" cx="${x}" cy="${y}" r="${f(1.2 + (i % 3) * 0.5)}" fill="#d8ccff"/>`)
    .join('')

  // The platform: the solar wing's panels and cell grid, the mast's bracing.
  // The fourth panel, the one the strike hits, is drawn on its own so it can tear off the boom.
  const panel = (i: number): string => `<rect x="${20 + i * 74}" y="-140" width="68" height="56" fill="#1b1747" stroke="#5a52a0" stroke-width="1.5"/>`
  const gridOf = (i: number): string => {
    const x = 20 + i * 74

    return `M${x + 17} -140V-84M${x + 34} -140V-84M${x + 51} -140V-84M${x} -112H${x + 68}`
  }
  const cell = (i: number): string =>
    `<rect class="vd-cell" opacity="0" style="animation-delay:${f(i * 0.35)}s" x="${20 + i * 74}" y="-140" width="68" height="56" fill="#d8ccff"/>`
  const panels = [0, 1, 2].map(panel).join('')
  const grid = [0, 1, 2].map(gridOf).join('')
  const cells = [0, 1, 2].map(cell).join('')
  let brace = 'M322 440'

  for (let k = 1; k <= 17; k += 1) brace += `L${k % 2 ? 340 : 322} ${440 - k * 36}`

  // The strike on the wing: sparks, a wide fan of chips, cracks.
  const hit = [272, -116] as const
  const sparks = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2 + next() * 0.3
    const d = 70 + next() * 130

    return `<rect class="vd-sp" opacity="0" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d)}px" x="${hit[0] - 2.5}" y="${hit[1] - 2.5}" width="5" height="5" fill="${i % 3 ? '#ffd9a0' : '#ffffff'}"/>`
  }).join('')
  const chips = (
    [
      [-150, -60, 200, 1.4],
      [60, -150, -260, 1],
      [-90, 90, 320, 1.2],
      [140, 40, -180, 1.6],
      [-40, -170, 240, 1],
      [170, -90, -300, 1.3],
      [-180, 20, 160, 0.9],
      [100, 120, 280, 1.1],
    ] as const
  )
    .map(
      ([dx, dy, r, s], i) =>
        `<path class="vd-db" opacity="0" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg" d="M${hit[0] + i} ${hit[1]}l${f(7 * s)} ${f(-4 * s)}l${f(5 * s)} ${f(6 * s)}l${f(-7 * s)} ${f(5 * s)}z" fill="${i % 2 ? '#7a72aa' : '#a49cd0'}"/>`,
    )
    .join('')
  const cracks = (
    [
      [-26, -14],
      [18, -22],
      [30, 8],
      [-16, 20],
      [-6, -26],
    ] as const
  )
    .map(([dx, dy]) => `<path class="vd-ck" opacity="0" pathLength="1" d="M${hit[0]} ${hit[1]}l${f(dx * 0.5)} ${f(dy * 0.5 + 2)}l${f(dx * 0.5)} ${f(dy * 0.5 - 2)}"/>`)
    .join('')
  const signals = [0, 1, 2]
    .map(i => `<path class="vd-sig" style="animation-delay:${f(-i * 0.5)}s" d="M4 -12Q-6 0 4 12"/>`)
    .join('')
  const papers = (
    [
      [262, 318, -40, -300, -160],
      [296, 320, 30, -250, 220],
      [318, 316, -10, -340, 120],
      [282, 314, 80, -210, -260],
      [340, 318, 50, -320, 190],
    ] as const
  )
    .map(
      ([x, y, dx, dy, r], i) =>
        `<g transform="translate(${x} ${y})"><g class="vd-pp" opacity="0" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg;animation-delay:${f(0.45 + i * 0.12)}s">` +
        '<path d="M-9 -12H6L9 -9V12H-9Z" fill="#e6e1f4" fill-opacity=".9"/><path d="M-6 -6H5M-6 -1H5M-6 4H2" stroke="#7f78a0" stroke-width="1.2"/></g></g>',
    )
    .join('')

  // The helmet: an opaque shell round a wide visor, so the eyes stay in clear view behind tinted glass.
  const shell = 'M58 326V262C58 222 100 198 150 198C200 198 242 222 242 262V326Z'
  const visor = 'M80 300V258C80 240 98 230 118 230H182C202 230 220 240 220 258V300C220 313 211 322 198 322H102C89 322 80 313 80 300Z'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      floating: true,
      ink: '#05040c',
      furniture: '#1d1a30',
      metal: '#2a2742',
      paper: '#e2ddf2',
      light: { idle: '#6a56c8', work: VIOLET, bright: '#dcd0ff' },
      headTop: 207,
      glowAt: [372, 268],
      device,
      wear: {
        // The life-support pack with its whip antenna, its thruster nozzle and the tether clipped to the deck.
        behind:
          '<path d="M30 226V194" stroke="#8a84a8" stroke-width="2.4"/><circle cx="30" cy="192" r="3" fill="#9b7bff"/>' +
          '<rect x="26" y="224" width="54" height="112" rx="10" fill="#9c96b8" stroke="#5f5980" stroke-width="2"/>' +
          '<rect x="32" y="244" width="20" height="40" rx="3" fill="#847ea2"/><path d="M32 300H74M32 308H74" stroke="#6f6992" stroke-width="2"/>' +
          '<path d="M45 222L42 214H58L55 222Z" fill="#4a4466"/>' +
          plume(50, 214, 90, 0.5, 0.72, 'vd-pk') +
          '<path d="M34 334C28 366 30 410 48 440" fill="none" stroke="#8a84a8" stroke-width="3" stroke-dasharray="7 4"/>',
        front:
          `<path d="${shell}${visor}" fill-rule="evenodd" fill="${SUIT}" stroke="${SUIT_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
          '<path d="M58 326V262C58 236 72 216 96 206C84 222 80 240 80 258V326Z" fill="#000" fill-opacity=".16"/>' +
          `<path d="${visor}" fill="${VIOLET}" fill-opacity=".13" stroke="#5a5480" stroke-width="3"/>` +
          '<path d="M90 262Q94 240 120 236" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M212 288Q214 300 206 312" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="200" cy="245" r="4.5" fill="#d8c8ff" fill-opacity=".4"/>' +
          '<ellipse cx="200" cy="245" rx="10" ry="2.6" fill="none" stroke="#d8c8ff" stroke-opacity=".5" stroke-width="1.2" transform="rotate(-24 200 245)"/>' +
          '<rect x="48" y="246" width="12" height="18" rx="3" fill="#5a5480"/><rect x="51" y="250" width="6" height="10" rx="2" fill="#efe8ff"/>' +
          '<rect x="240" y="246" width="12" height="18" rx="3" fill="#5a5480"/><rect x="243" y="250" width="6" height="10" rx="2" fill="#efe8ff"/>' +
          '<rect x="126" y="192" width="48" height="9" rx="4" fill="#8f88b0"/>' +
          '<rect x="62" y="320" width="176" height="14" rx="6" fill="#4a4466" stroke="#2a2742" stroke-width="2"/>' +
          `<g fill="${VIOLET}"><circle cx="78" cy="327" r="2.4"/><circle cx="222" cy="327" r="2.4"/></g>` +
          '<rect x="92" y="334" width="52" height="14" rx="3" fill="#3a3556" stroke="#5a5480" stroke-width="1.5"/>' +
          '<circle cx="102" cy="341" r="2.4" fill="#62d0ff"/><circle cx="112" cy="341" r="2.4" fill="#ffc45a"/>' +
          `<rect x="120" y="338" width="18" height="6" rx="1" fill="${VIOLET}" fill-opacity=".6"/>`,
      },
      seatArt:
        // A saddle seat on a post bolted to the deck, and two foot loops.
        '<rect x="146" y="360" width="10" height="82" fill="#2a2742"/><path d="M122 446H180L170 436H132Z" fill="#2a2742"/>' +
        '<rect x="104" y="349" width="94" height="13" rx="6" fill="#36314f" stroke="#5a5480" stroke-width="2"/>' +
        `<path d="M110 356H192" stroke="${VIOLET}" stroke-opacity=".45" stroke-width="2"/>` +
        `<path d="M80 444Q92 424 104 444M196 444Q208 424 220 444" fill="none" stroke="${GOLD}" stroke-width="3"/>`,
      tableArt:
        // The console on a strut, with a row of status lights along its lip.
        '<rect x="166" y="330" width="304" height="12" rx="3" fill="#1d1a30" stroke="#3c3760" stroke-width="1.6"/>' +
        `<path d="M168 331H468" stroke="${VIOLET}" stroke-opacity=".35" stroke-width="1.5"/>` +
        '<path d="M312 342L300 440H352L340 342Z" fill="#1a172b" stroke="#3c3760" stroke-width="1.5"/>' +
        '<path d="M206 342L232 440" stroke="#2a2742" stroke-width="6"/>' +
        '<circle class="vd-warn" opacity=".2" cx="186" cy="336" r="2.6" fill="#ff5d73"/>' +
        `<g fill="${VIOLET}" fill-opacity=".7"><rect x="198" y="334" width="10" height="4" rx="1"/><rect x="212" y="334" width="10" height="4" rx="1"/></g>` +
        '<rect x="404" y="334" width="14" height="4" rx="1" fill="#62d0ff" fill-opacity=".6"/>',
    },
    style: STYLE,
    scenery:
      '<defs>' +
      '<radialGradient id="vd-sky" cx=".78" cy=".3" r=".9"><stop offset="0" stop-color="#110e22"/><stop offset=".55" stop-color="#0a0915"/><stop offset="1" stop-color="#06060c"/></radialGradient>' +
      '<radialGradient id="vd-nb"><stop offset="0" stop-color="#5b3fc4" stop-opacity=".16"/><stop offset=".6" stop-color="#3a2a8a" stop-opacity=".06"/><stop offset="1" stop-color="#3a2a8a" stop-opacity="0"/></radialGradient>' +
      `<clipPath id="vd-pc"><circle cx="${PX}" cy="${PY}" r="${PR}"/></clipPath>` +
      '<radialGradient id="vd-sun" gradientUnits="userSpaceOnUse" cx="20" cy="380" r="380"><stop offset="0" stop-color="#ffeadc" stop-opacity=".12"/><stop offset="1" stop-color="#ffeadc" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="vd-lb" gradientUnits="userSpaceOnUse" cx="${PX}" cy="${PY}" r="${PR}"><stop offset="0" stop-color="#06050e" stop-opacity="0"/><stop offset=".55" stop-color="#06050e" stop-opacity="0"/>` +
      '<stop offset=".82" stop-color="#06050e" stop-opacity=".38"/><stop offset=".95" stop-color="#06050e" stop-opacity=".7"/><stop offset="1" stop-color="#06050e" stop-opacity=".85"/></radialGradient>' +
      '<radialGradient id="vd-nn" gradientUnits="userSpaceOnUse" cx="-200" cy="330" r="1200"><stop offset=".48" stop-color="#04030a" stop-opacity="0"/>' +
      '<stop offset=".56" stop-color="#04030a" stop-opacity=".6"/><stop offset=".64" stop-color="#04030a" stop-opacity=".92"/><stop offset="1" stop-color="#04030a" stop-opacity=".96"/></radialGradient>' +
      '<radialGradient id="vd-dn" gradientUnits="userSpaceOnUse" cx="-200" cy="330" r="1200"><stop offset=".45" stop-color="#ffcfa0" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#ffcfa0" stop-opacity=".26"/><stop offset=".54" stop-color="#e89ad0" stop-opacity=".14"/><stop offset=".6" stop-color="#e89ad0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vd-sr" gradientUnits="userSpaceOnUse" cx="210" cy="766" r="320"><stop offset="0" stop-color="#fff4e0"/><stop offset=".35" stop-color="#ffc890" stop-opacity=".7"/><stop offset="1" stop-color="#ffc890" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vd-sg"><stop offset="0" stop-color="#fff6e8" stop-opacity=".75"/><stop offset=".15" stop-color="#ffe0b8" stop-opacity=".45"/><stop offset=".45" stop-color="#ffb070" stop-opacity=".14"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vd-bl"><stop offset="0" stop-color="#e0d4ff" stop-opacity=".6"/><stop offset="1" stop-color="#e0d4ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="vd-rm" gradientUnits="userSpaceOnUse" x1="-370" y1="600" x2="600" y2="0"><stop offset="0" stop-color="#cdb8ff" stop-opacity=".8"/><stop offset=".5" stop-color="#cdb8ff" stop-opacity=".3"/><stop offset=".72" stop-color="#cdb8ff" stop-opacity="0"/></linearGradient>' +
      [
        ['0', '#f2ecff'],
        ['1', '#c8bce8'],
        ['2', '#9a8cc8'],
        ['g', '#fff3e2'],
      ]
        .map(
          ([k, c]) =>
            `<linearGradient id="vd-r${k}" gradientUnits="userSpaceOnUse" x1="280" y1="0" x2="500" y2="0"><stop offset="0" stop-color="${c}"/>` +
            `<stop offset=".6" stop-color="${c}" stop-opacity=".34"/><stop offset="1" stop-color="${c}" stop-opacity=".16"/></linearGradient>`,
        )
        .join('') +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#vd-sky)"/>' +
      '<g class="mv-r"><ellipse cx="1330" cy="290" rx="520" ry="330" fill="url(#vd-nb)"/></g>' +
      `<path d="${dots(dim)}" fill="#cfc8ee" fill-opacity=".42"/>` +
      `<path class="vd-t1" d="${dots(tw1)}" fill="#e6e0ff"/><path class="vd-t2" d="${dots(tw2)}" fill="#d8d0ff"/>` +
      `<g class="mv-r"><g class="mv-t">${sparkle(1548, 58, 1.1, 0)}</g>${sparkle(1380, 360, 0.9, -1.6)}</g>` +
      `<g class="mv-b">${sparkle(300, 940, 0.8, -2.4)}</g>` +
      motes +
      // Two far moons high on the right, above where the subagent portals open.
      `<g class="mv-r"><g class="mv-t"><g transform="translate(1380 112)"><g class="vd-mb">${moon(50, 0.25, '#a49cc2', '#13111d', [
        [-0.45, -0.3, 0.16],
        [-0.15, 0.35, 0.12],
        [-0.6, 0.25, 0.08],
        [0.05, -0.55, 0.09],
      ])}</g></g>` +
      `<g transform="translate(1262 96)">${moon(10, -0.35, '#c9c0e0', '#13111d', [])}</g></g></g>` +
      // The sun, behind the planet's lower limb until done brings it up.
      '<circle class="vd-rise" opacity="0" cx="210" cy="766" r="16" fill="#fff6e8"/>' +
      // The gas giant: bands, spots and the great storm in its tilted frame, the rings' shadow, then the shading.
      `<g clip-path="url(#vd-pc)"><circle cx="${PX}" cy="${PY}" r="${PR}" fill="#221c44"/>` +
      `<g transform="translate(${PX} ${PY}) rotate(${TILT})">${bands}` +
      `<g fill="none" stroke="#efe4ff" stroke-opacity=".13" stroke-width="2.4">${edges}</g>` +
      `<g class="vd-spots">${spots}</g>${storm}` +
      '<path d="M-820 40A820 230 0 0 0 820 40" fill="none" stroke="#06050d" stroke-opacity=".5" stroke-width="80"/></g>' +
      '<g class="mv-b"><g transform="translate(225 937)"><g class="vd-mt"><ellipse rx="62" ry="56" fill="#05040b" fill-opacity=".62"/></g></g></g>' +
      `<circle cx="${PX}" cy="${PY}" r="${PR}" fill="url(#vd-sun)"/><circle cx="${PX}" cy="${PY}" r="${PR}" fill="url(#vd-lb)"/>` +
      '<g class="vd-nt"><rect x="-800" y="-400" width="1700" height="1300" fill="url(#vd-nn)"/><rect class="vd-dw" x="-800" y="-400" width="1700" height="1300" fill="url(#vd-dn)"/></g>' +
      `${blips}</g>` +
      `<g class="vd-rim" fill="none" stroke="url(#vd-rm)"><circle cx="${PX}" cy="${PY}" r="${PR + 1}" stroke-width="3"/><circle cx="${PX}" cy="${PY}" r="${PR + 16}" stroke-width="26" stroke-opacity=".14"/></g>` +
      // The rings, fading where they cross the chat, the outer ring shimmering, and the dawn glint.
      `<g fill="none">${rings}<path class="vd-f" d="${ringArc(970)}" stroke="url(#vd-r0)" stroke-width="1.6" stroke-opacity=".5"/>` +
      `<path class="vd-gl" opacity="0" pathLength="1000" d="${ringArc(880)}" stroke="url(#vd-rg)" stroke-width="7" stroke-linecap="round"/></g>` +
      // The near moon, low in the left and pinned to the foot, that crosses the planet's face when a command runs.
      `<g class="mv-b"><g transform="translate(165 930)"><g class="vd-mt"><g class="vd-ma">${moon(62, 0.3, '#c4bcd8', '#16131f', [
        [-0.4, -0.2, 0.16],
        [-0.1, 0.35, 0.12],
        [-0.55, 0.3, 0.08],
        [-0.3, -0.6, 0.07],
      ])}</g></g></g></g>` +
      // Sunrise: the limb lights up from the sun as it clears the edge, with a glow, slow rays and a lens streak.
      `<g class="vd-rise" opacity="0"><circle cx="${PX}" cy="${PY}" r="${PR + 1}" fill="none" stroke="url(#vd-sr)" stroke-width="5"/>` +
      '<circle cx="210" cy="766" r="160" fill="url(#vd-sg)"/><g transform="translate(210 766)">' +
      '<path d="M-230 0L0 -1.8L190 0L0 1.8Z" fill="#ffe8d0" fill-opacity=".5"/>' +
      `<g class="vd-ray">${[0, 55, 118, 180, 236, 298].map((a, i) => `<path d="M0 -2.4L${110 + (i % 3) * 35} 0L0 2.4Z" transform="rotate(${a})" fill="#ffe6c8" fill-opacity=".42"/>`).join('')}</g></g></g>`,
    nook:
      '<defs><radialGradient id="vd-fx"><stop offset="0" stop-color="#fff3e0" stop-opacity=".8"/><stop offset=".4" stop-color="#c8b0ff" stop-opacity=".28"/><stop offset="1" stop-color="#c8b0ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vd-pgl"><stop offset="0" stop-color="#e6dcff" stop-opacity=".55"/><stop offset=".4" stop-color="#a98cff" stop-opacity=".2"/><stop offset="1" stop-color="#a98cff" stop-opacity="0"/></radialGradient></defs>' +
      // The relay satellite the dish talks to.
      '<g transform="translate(60 -214)"><g class="vd-rl">' +
      '<rect x="-30" y="-4" width="20" height="8" fill="#1b1747" stroke="#5a52a0"/><rect x="10" y="-4" width="20" height="8" fill="#1b1747" stroke="#5a52a0"/>' +
      '<rect x="-7" y="-5" width="14" height="10" rx="2" fill="#3a3556" stroke="#6a6290" stroke-width="1.5"/>' +
      '<path d="M0 -5V-12" stroke="#8a84a8" stroke-width="1.5"/><circle class="vd-blink" cy="-13" r="2.2" fill="#62d0ff"/></g></g>' +
      `<g transform="translate(294 -216)" fill="none" stroke="${VIOLET}" stroke-width="2.4" stroke-linecap="round">${signals}</g>` +
      '<g class="vd-plat"><g class="vd-sway">' +
      // The mast and its bracing.
      `<path d="M322 440V-182M340 440V-182" stroke="#2c2846" stroke-width="5"/><path d="${brace}" fill="none" stroke="#3a3558" stroke-width="2.5"/>` +
      // The solar wing on its boom, with torn brackets hidden behind the fourth panel until it tears away. That panel
      // carries the scar and cracks the strike leaves and a face that catches the light as it tumbles.
      `<path d="M322 -112H14" stroke="#3a3558" stroke-width="4"/><path d="M244 -112l-5 -7M246 -112l-3 8M308 -112l5 -7M306 -112l4 8" stroke="#8a84a8" stroke-width="2"/>` +
      `${panels}<path d="${grid}" stroke="#3b3486" stroke-width="1"/>${cells}` +
      `<g class="vd-tear">${panel(3)}<path d="${gridOf(3)}" stroke="#3b3486" stroke-width="1"/>${cell(3)}` +
      '<rect class="vd-tg" opacity="0" x="242" y="-140" width="68" height="56" fill="#e6dcff"/>' +
      `<circle class="vd-scar" opacity="0" cx="${hit[0]}" cy="${hit[1]}" r="7" fill="#06050c"/>` +
      `<g fill="none" stroke="#ece6ff" stroke-opacity=".85" stroke-width="1.4">${cracks}</g></g>` +
      // The wing-tip thruster block, firing down.
      '<rect x="20" y="-86" width="16" height="9" rx="2" fill="#3a3556" stroke="#5a5480" stroke-width="1.2"/>' +
      '<circle class="vd-wg" opacity="0" cx="30" cy="-30" r="44" fill="url(#vd-pgl)"/>' +
      plume(28, -77, -90, 0.9, 0.9, 'vd-pw') +
      // The mast head: the dish, the up thruster and the nav light.
      `<rect x="310" y="-198" width="42" height="18" rx="3" fill="${HULL}" stroke="${HULL_EDGE}" stroke-width="2"/>` +
      '<g transform="translate(314 -198)"><g class="vd-dish"><path d="M0 0L-12 -16" stroke="#3a3558" stroke-width="4"/>' +
      '<g transform="translate(-12 -16) rotate(-35)"><path d="M-22 -4Q0 16 22 -4Z" fill="#cfc8e6" fill-opacity=".85" stroke="#6a6290" stroke-width="2"/>' +
      '<path d="M0 8V-16" stroke="#8a84a8" stroke-width="2"/><circle cy="-17" r="3" fill="#e8e0ff"/></g></g></g>' +
      '<path d="M326 -198L323 -206H339L336 -198Z" fill="#3a3556"/>' +
      '<circle class="vd-pg" opacity="0" cx="331" cy="-262" r="70" fill="url(#vd-pgl)"/>' +
      plume(331, -206, 90, 1.15, 1.1, 'vd-pu') +
      `<circle class="vd-nav" cx="348" cy="-203" r="11" fill="${VIOLET}" fill-opacity=".25"/><circle class="vd-nav" cx="348" cy="-203" r="3.5" fill="#e8e0ff"/>` +
      // The micrometeoroid, its flash, sparks, chips and the puff of gas, moving with the wing they strike.
      `<g transform="translate(${hit[0]} ${hit[1]})"><g class="vd-mm" opacity="0" stroke-linecap="round">` +
      '<path d="M0 0L110 -133" stroke="#cfc0ff" stroke-opacity=".45" stroke-width="2"/><path d="M0 0L40 -48" stroke="#e6dcff" stroke-opacity=".7" stroke-width="2.5"/><path d="M0 0L16 -19" stroke="#fff" stroke-width="3.4"/></g></g>' +
      `<circle class="vd-fl" opacity="0" cx="${hit[0]}" cy="${hit[1]}" r="150" fill="url(#vd-fx)"/>` +
      `<circle class="vd-vent" opacity="0" cx="${hit[0]}" cy="${hit[1]}" r="16" fill="#e8e4f4"/>` +
      sparks +
      chips +
      '</g>' +
      // The handrail and the deck.
      `<path d="M14 440V398M72 440V398" stroke="${GOLD}" stroke-width="4"/><path d="M8 398H78" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` +
      '<rect x="-30" y="440" width="520" height="30" fill="#16132a"/><path d="M-30 441H490" stroke="#4a4470" stroke-width="2"/>' +
      `<path d="M-20 450H480" stroke="${VIOLET}" stroke-opacity=".3" stroke-width="3" stroke-dasharray="10 14"/>` +
      '</g>',
    front: papers,
  }
}
