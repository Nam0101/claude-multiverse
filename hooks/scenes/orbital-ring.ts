import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Orbital Ring: a crew member at a workstation in a white space-station corridor during its night cycle. The panels
// are dimmed, blue guide lights run along the floor, and huge windows look out on a planet's night side, its cities
// lit, with a vast orbital ring arching over the sky from behind its limb. A command docks a shuttle at the module
// outside while a segment of the ring sweeps past; an error is a depressurisation alarm: shutters drop, the blue
// lights pulse slowly and loose papers float off the desk; done brings an orbital sunrise along the planet's limb.
const BLUE = '#2f6fed'
const GUIDE = '#5b8cff'
const ICE = '#cfe0ff'
const CITY = '#ffcf7a'
const DAWN = '#ffd9a0'
const SUIT = '#b9c3d3'
const SHELL = '#2c3648'
const SHELL_EDGE = '#4d5a74'
const FRAME = '#1c2331'

// The planet, low in the left third, and the ring: one ellipse whose top arches over the sky.
const PX = -260
const PY = 860
const PR = 700
const SUN_AT = 32
const RCX = 820
const RCY = 1180
type Ellipse = readonly [number, number]
const OUTER: Ellipse = [1100, 1020]
const INNER: Ellipse = [1070, 982]
const MID: Ellipse = [1085, 1001]

/** A point `r` from the planet's centre, `deg` degrees up from due right. */
function onPlanet(deg: number, r = PR): [number, number] {
  const a = (deg * Math.PI) / 180

  return [PX + r * Math.cos(a), PY - r * Math.sin(a)]
}

/** A run of a circle round the planet's centre, from `from` to `to` degrees. */
function limb(from: number, to: number, r: number): string {
  const [x1, y1] = onPlanet(from, r)
  const [x2, y2] = onPlanet(to, r)

  return `M${f(x1)} ${f(y1)}A${r} ${r} 0 0 ${to > from ? 0 : 1} ${f(x2)} ${f(y2)}`
}

function ringY(x: number, [rx, ry]: Ellipse): number {
  const u = (x - RCX) / rx

  return RCY - ry * Math.sqrt(Math.max(0, 1 - u * u))
}

function ringArc(x1: number, x2: number, e: Ellipse): string {
  return `M${f(x1)} ${f(ringY(x1, e))}A${e[0]} ${e[1]} 0 0 1 ${f(x2)} ${f(ringY(x2, e))}`
}

/** One stretch of the ring: the band, its segment joints, its lit rim and the lights that creep along it. */
function ring(x1: number, x2: number, lit: number): string {
  const band = `${ringArc(x1, x2, OUTER)}L${f(x2)} ${f(ringY(x2, INNER))}A${INNER[0]} ${INNER[1]} 0 0 0 ${f(x1)} ${f(ringY(x1, INNER))}Z`

  return (
    `<path d="${band}" fill="#111b2e"/>` +
    `<path d="${ringArc(x1, x2, MID)}" fill="none" stroke="#060a12" stroke-width="30" stroke-dasharray="3 61"/>` +
    `<path d="${ringArc(x1, x2, OUTER)}" fill="none" stroke="#7aa4ff" stroke-opacity="${f(0.7 * lit)}" stroke-width="2.4"/>` +
    `<path d="${ringArc(x1, x2, INNER)}" fill="none" stroke="#3a5590" stroke-opacity="${f(0.6 * lit)}" stroke-width="1.6"/>` +
    `<path class="or-rl" d="${ringArc(x1, x2, MID)}" fill="none" stroke="${ICE}" stroke-opacity="${f(0.95 * lit)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 32"/>`
  )
}

/** A tether from the ring's underside down to the planet's horizon, with a climber riding it. */
function tether(x: number, delay: number): string {
  const y = ringY(x, INNER)
  const len = Math.hypot(x - PX, y - PY)
  const ex = PX + ((x - PX) * (PR + 2)) / len
  const ey = PY + ((y - PY) * (PR + 2)) / len
  const d = `M${f(x)} ${f(y)}L${f(ex)} ${f(ey)}`

  return (
    `<path d="${d}" stroke="#8fb0ff" stroke-opacity=".4" stroke-width="1.6"/>` +
    `<path class="or-cl" style="animation-delay:${delay}s" d="${d}" stroke="${ICE}" stroke-width="3.4" stroke-linecap="round"/>`
  )
}

/** A habitat pod riding on top of the ring, turned to its curve. */
function pod(x: number): string {
  const u = (x - RCX) / MID[0]
  const a = (Math.atan((MID[1] * u) / (MID[0] * Math.sqrt(1 - u * u))) * 180) / Math.PI

  return (
    `<g transform="translate(${f(x)} ${f(ringY(x, MID))}) rotate(${f(a)})"><rect x="-16" y="-34" width="32" height="16" rx="4" fill="#1f2a40" stroke="#5a7ab8" stroke-width="1.6"/>` +
    `<path d="M-10 -26h6M-1 -26h6M8 -26h4" stroke="#bcd2ff" stroke-opacity=".8" stroke-width="3"/></g>`
  )
}

/** A concave corner where a window frame meets the ceiling or the sill: (x, y) the corner, dx/dy the open sides. */
function fillet(x: number, y: number, dx: number, dy: number, r = 28): string {
  return `M${x + dx * r} ${y}L${x} ${y}L${x} ${y + dy * r}A${r} ${r} 0 0 ${dx === dy ? 1 : 0} ${x + dx * r} ${y}Z`
}

/** A guide light in its groove: a soft glow and a bright dot, chasing down the corridor. */
function guide(x: number, y: number): string {
  return (
    `<circle class="or-gd" style="--d:${f(-((1600 - x) / 64) * 0.11)}s" cx="${f(x)}" cy="${y}" r="13" fill="url(#or-gl)"/>`
  )
}

/** A solar array: a panel with its cell grid. */
function array(x: number, y: number, w: number, h: number): string {
  let grid = ''

  for (let gx = x + w / 3; gx < x + w - 1; gx += w / 3) grid += `M${f(gx)} ${y}v${h}`
  for (let gy = y + 22; gy < y + h - 1; gy += 22) grid += `M${x} ${f(gy)}h${w}`

  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b1830" stroke="#2c4678" stroke-opacity=".8" stroke-width="2"/>` +
    `<path d="${grid}" stroke="#20365f" stroke-width="1.4"/>`
  )
}

/** Shutter slats from `top` down to `bottom`, with a hazard edge and a lit lip at the bottom. */
function shutter(x: number, w: number, top: number, bottom: number): string {
  let slats = ''
  let stripes = ''

  for (let y = top; y < bottom; y += 30) slats += `M${x} ${y}h${w}v26h${-w}z`
  for (let sx = x + 4; sx < x + w - 12; sx += 28) stripes += `M${sx + 10} ${bottom}h12l-10 16h-12z`

  return (
    `<path d="${slats}" fill="#121925" stroke="#2a3448" stroke-width="1.5"/>` +
    `<rect x="${x}" y="${bottom}" width="${w}" height="16" fill="#0b0f17"/><path d="${stripes}" fill="#d9a441" fill-opacity=".55"/>` +
    `<path d="M${x} ${bottom + 17}h${w}" stroke="${GUIDE}" stroke-opacity=".7" stroke-width="2"/>`
  )
}

/** The shuttle, nose at the origin pointing right, its engine glowing at the back. */
function shuttle(): string {
  return (
    '<circle class="or-eng" cx="-134" cy="0" r="30" fill="url(#or-eng)"/>' +
    '<path d="M-46 6L-104 34H-122L-112 8Z" fill="#3d4960" stroke="#7d8ba6" stroke-opacity=".6" stroke-width="1.4"/>' +
    '<path d="M0 0C-8 -11 -28 -17 -58 -17H-116L-128 -9V9L-116 17H-58C-28 17 -8 11 0 0Z" fill="#76839c" stroke="#b9c6dc" stroke-opacity=".55" stroke-width="1.5"/>' +
    '<path d="M0 0C-8 11 -28 17 -58 17H-116L-128 9V2H-2Z" fill="#283246" fill-opacity=".75"/>' +
    '<path d="M-98 -16L-114 -38H-124L-120 -16Z" fill="#5b6882" stroke="#8d9ab4" stroke-opacity=".5"/>' +
    '<path d="M-12 -6L-22 -11H-36L-34 -4Z" fill="#9fc4ff" fill-opacity=".9"/>' +
    `<path d="M-112 -2H-42" stroke="${BLUE}" stroke-width="3"/>` +
    '<circle class="or-nav" cx="-120" cy="32" r="2.4" fill="#7fe8d0"/>'
  )
}

/** The console: a touch deck and a framed screen on a stem, showing the planet and its ring with a craft in orbit. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${250 + i * 11}" y="324" width="7" height="3" rx="1" fill="${light}" fill-opacity=".6"/>`).join('')
  let face: string

  if (activity === 'error') {
    face =
      `<path d="M350 240L374 284H326Z" fill="none" stroke="${light}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M342 266Q350 259 358 266" fill="none" stroke="${light}" stroke-width="2.4"/><circle cx="350" cy="276" r="3" fill="${light}"/>`
  } else if (activity === 'done') {
    face = `<path d="M328 266L344 281L374 248" fill="none" stroke="${light}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`
  } else {
    face =
      `<circle cx="328" cy="262" r="12" fill="${light}" fill-opacity=".3" stroke="${light}" stroke-width="1.6"/>` +
      `<ellipse cx="328" cy="262" rx="25" ry="7.5" fill="none" stroke="${light}" stroke-opacity=".9" stroke-width="1.8" transform="rotate(-16 328 262)"/>` +
      `<g transform="translate(328 262) rotate(-16) scale(1 .3)"><g class="or-orb"><circle cx="25" r="4.2" fill="${ICE}"/></g></g>` +
      `<path d="M362 244H392M362 254H384M362 264H394M362 274H380" stroke="${light}" stroke-opacity=".55" stroke-width="3"/>`
  }

  return (
    '<rect x="242" y="321" width="78" height="9" rx="3" fill="#2c3648" stroke="#4d5a74" stroke-width="1.2"/>' +
    keys +
    '<rect x="344" y="306" width="12" height="20" fill="#232c3d"/><rect x="322" y="324" width="56" height="6" rx="3" fill="#2c3648"/>' +
    '<rect x="290" y="220" width="120" height="88" rx="9" fill="#232c3d" stroke="#5a6884" stroke-width="2"/>' +
    '<rect x="297" y="227" width="106" height="74" rx="5" fill="#04080f"/>' +
    `<rect x="297" y="227" width="106" height="74" rx="5" fill="${light}" fill-opacity=".12"/>` +
    face +
    (activity === 'run'
      ? `<rect x="306" y="290" width="88" height="4" fill="${light}" fill-opacity=".25"/><rect class="or-prog" x="306" y="290" width="88" height="4" fill="${light}"/>`
      : '') +
    '<path d="M300 230H336L316 298H300Z" fill="#ffffff" fill-opacity=".04"/>' +
    `<circle cx="402" cy="314" r="2.4" fill="${light}"/>` +
    // A drink pouch with its straw.
    '<path d="M430 330V312Q430 305 437 305H449Q456 305 456 312V330Z" fill="#c9d3e3" fill-opacity=".8"/>' +
    `<path d="M446 305V292H453" fill="none" stroke="${BLUE}" stroke-width="2.4"/><path d="M434 318H452" stroke="#7d8ba6" stroke-width="2"/>`
  )
}

export function orbitalRingWorld(): World {
  const next = random(4242)

  // Stars, kept off the planet.
  const starA: string[] = []
  const starB: string[] = []

  for (let i = 0; i < 96; i += 1) {
    const x = next() * 1600
    const y = 74 + next() * 720
    const s = next() < 0.18 ? 2.8 : 1.8

    if (Math.hypot(x - PX, y - PY) > PR + 26) (i % 2 === 0 ? starA : starB).push(`M${f(x)} ${f(y)}h${s}v${s}h${-s}z`)
  }

  // The cities on the night side: clusters of lights, the roads between near ones, a soft glow over each.
  const hubs: [number, number][] = []

  for (let i = 0; i < 120 && hubs.length < 24; i += 1) {
    const [x, y] = onPlanet(8 + next() * 78, 220 + next() * 450)

    if (x > -100 && x < 400 && y > 210 && y < 850) hubs.push([x, y])
  }

  const cityA: string[] = []
  const cityB: string[] = []

  for (const [hx, hy] of hubs) {
    const n = 7 + Math.floor(next() * 10)

    for (let j = 0; j < n; j += 1) {
      const x = hx + (next() - 0.5) * 46
      const y = hy + (next() - 0.5) * 24
      const s = 1.6 + next() * 2

      if (Math.hypot(x - PX, y - PY) < PR - 8) (j % 2 === 0 ? cityA : cityB).push(`M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${f(-s)}z`)
    }
  }

  let roads = ''

  for (let i = 1; i < hubs.length; i += 1) {
    const a = hubs[i - 1]
    const b = hubs[i]

    if (a !== undefined && b !== undefined && Math.hypot(a[0] - b[0], a[1] - b[1]) < 190) {
      roads += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`
    }
  }

  const clouds = [520, 575, 625, 668]
    .map((r, i) => {
      const c = (2 * Math.PI * r * 80) / 360
      const dash = Array.from({ length: 6 }, () => f(c * (0.03 + next() * 0.09))).join(' ')

      return `<path d="${limb(4, 84, r)}" fill="none" stroke="#1c2b45" stroke-opacity="${f(0.22 + i * 0.04)}" stroke-width="${16 + i * 4}" stroke-linecap="round" stroke-dasharray="${dash}"/>`
    })
    .join('')

  const [sx, sy] = onPlanet(SUN_AT)
  const planet =
    `<circle cx="${PX}" cy="${PY}" r="${PR}" fill="url(#or-pl)"/>` +
    `<g class="or-city"><g fill="url(#or-cg)">${hubs.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="40"/>`).join('')}</g>` +
    `<path d="${roads}" fill="none" stroke="${CITY}" stroke-opacity=".3" stroke-width="1.4"/>` +
    `<path class="or-ct1" d="${cityA.join('')}" fill="${CITY}" fill-opacity=".95"/>` +
    `<path class="or-ct2" d="${cityB.join('')}" fill="#ffe2a8" fill-opacity=".75"/></g>` +
    clouds +
    `<circle cx="${f(sx)}" cy="${f(sy)}" r="150" fill="url(#or-pre)"/>` +
    `<circle cx="${PX}" cy="${PY}" r="${PR}" fill="none" stroke="#7aa8ff" stroke-opacity=".8" stroke-width="2.6"/>` +
    `<circle cx="${PX}" cy="${PY}" r="742" fill="url(#or-atm)"/>` +
    tether(318, 0) +
    tether(360, -1.1) +
    tether(398, -2.2) +
    // The sunrise: the rim warms, light runs both ways along the limb from where the sun comes up, and the sun itself.
    `<circle class="or-warm" cx="${PX}" cy="${PY}" r="742" fill="url(#or-atw)"/>` +
    `<path class="or-limb" pathLength="1" d="${limb(SUN_AT, 80, 706)}" fill="none" stroke="#ffb46a" stroke-opacity=".24" stroke-width="22"/>` +
    `<path class="or-limb" pathLength="1" d="${limb(SUN_AT, 2, 706)}" fill="none" stroke="#ffb46a" stroke-opacity=".24" stroke-width="22"/>` +
    `<path class="or-limb" pathLength="1" d="${limb(SUN_AT, 80, 701)}" fill="none" stroke="#fff0cc" stroke-width="3.5"/>` +
    `<path class="or-limb" pathLength="1" d="${limb(SUN_AT, 2, 701)}" fill="none" stroke="#fff0cc" stroke-width="3.5"/>` +
    `<g transform="translate(${f(sx)} ${f(sy)})"><g class="or-sun"><circle r="240" fill="url(#or-sun)"/><ellipse rx="260" ry="5" fill="url(#or-sun)" transform="rotate(-58)"/>` +
    '<path d="M0 -64L5 -5L64 0L5 5L0 64L-5 5L-64 0L-5 -5Z" fill="#fff8e6" fill-opacity=".8"/><circle r="9" fill="#fffaf0"/></g></g>'

  // The ring's far side: thinner and fainter, out from behind the planet and low across the sky to meet the near
  // side past the right edge.
  const far = 'M380 720Q1100 470 1760 610'
  const rings =
    `<path d="${far}" fill="none" stroke="#0c1424" stroke-width="12"/>` +
    `<path d="${far}" fill="none" stroke="#5f8cff" stroke-opacity=".32" stroke-width="1.6" transform="translate(0 -6)"/>` +
    `<path class="or-rl" d="${far}" fill="none" stroke="${ICE}" stroke-opacity=".4" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0 32"/>` +
    ring(-140, 420, 1) +
    ring(420, 1180, 0.55) +
    ring(1180, 1740, 1) +
    pod(286) +
    pod(1262) +
    pod(1452) +
    `<path class="or-rsun" pathLength="1" d="${ringArc(-140, 1740, OUTER)}" fill="none" stroke="${DAWN}" stroke-opacity=".55" stroke-width="2.6"/>`

  // The ring segment that sweeps past while a command runs: a long car with its ribs and a row of lit windows.
  let ribs = ''
  let segWindows = ''

  for (let x = 75; x < 1500; x += 150) ribs += `M${x} 88V192`
  for (let x = 30; x < 1470; x += 24) if ((x - 75) % 150 > 14) segWindows += `M${x} 126h10v6h-10z`

  const segment =
    '<g class="mv-t"><g class="or-seg">' +
    '<path d="M0 116L34 88H1466L1500 116V164L1466 192H34L0 164Z" fill="#121a28" stroke="#344058" stroke-width="2"/>' +
    '<path d="M34 92H1466" stroke="#7fa2e6" stroke-opacity=".6" stroke-width="2"/>' +
    `<path d="${ribs}" stroke="#1f2a3c" stroke-width="12"/><path d="${segWindows}" fill="#bcd2ff" fill-opacity=".7"/>` +
    `<path d="M0 152H1500" stroke="${BLUE}" stroke-opacity=".5" stroke-width="3"/>` +
    '<circle cx="12" cy="140" r="4" fill="#7fe8d0"/><circle cx="1488" cy="140" r="4" fill="#7fe8d0"/>' +
    '</g></g>'

  // The docking module outside the right window: solar arrays, the hull, a collar, a dish, an arm and the shuttle.
  let hullSeams = ''

  for (let x = 1450; x < 1720; x += 46) hullSeams += `M${x} 141V229`

  const station =
    '<g class="mv-r">' +
    '<path d="M1560 -80V460" stroke="#1f2838" stroke-width="6"/>' +
    array(1522, -50, 76, 168) +
    array(1522, 252, 76, 186) +
    '<path d="M1418 140H1720V230H1418Z" fill="url(#or-mod)" stroke="#3a465e" stroke-width="2"/>' +
    `<path d="${hullSeams}" stroke="#0c1019" stroke-width="2"/>` +
    `<path d="M1418 206H1720" stroke="${BLUE}" stroke-opacity=".6" stroke-width="3"/>` +
    '<path d="M1446 164h14v8h-14zM1474 164h14v8h-14zM1502 164h14v8h-14z" fill="#bcd2ff" fill-opacity=".55"/>' +
    '<rect x="1398" y="150" width="22" height="70" rx="5" fill="#344058" stroke="#5a6884" stroke-width="2"/>' +
    '<rect x="1392" y="160" width="8" height="50" rx="2" fill="#1a2130"/>' +
    '<g class="or-clamp" fill="#7fe8d0"><circle cx="1409" cy="156" r="3.2"/><circle cx="1409" cy="214" r="3.2"/></g>' +
    '<circle class="or-dk" cx="1394" cy="185" r="22" fill="none" stroke="#7fe8d0" stroke-width="2.4"/>' +
    `<circle class="or-nav" cx="1540" cy="140" r="3" fill="${ICE}"/><circle class="or-nav" style="animation-delay:-1s" cx="1596" cy="230" r="3" fill="#7fe8d0"/>` +
    // The comm dish, and the signal it sends to the ring.
    '<path d="M1462 140V124" stroke="#3a465e" stroke-width="4"/>' +
    '<g transform="translate(1462 120)"><g class="or-dish"><path d="M-20 -4Q0 16 20 -4Z" fill="#3a465e" stroke="#6a7894" stroke-width="1.6"/>' +
    `<path d="M0 6V-12" stroke="#6a7894" stroke-width="2"/><circle cy="-13" r="2.6" fill="${ICE}"/></g></g>` +
    [0, 0.6, 1.2].map(d => `<circle class="or-sig" style="animation-delay:${d}s" cx="1462" cy="104" r="22" fill="none" stroke="${ICE}" stroke-width="2"/>`).join('') +
    // The maintenance arm under the hull, its tip welding while a tool runs.
    '<path d="M1452 230L1422 282" stroke="#3a465e" stroke-width="8" stroke-linecap="round"/><circle cx="1452" cy="230" r="6" fill="#4a5770"/>' +
    '<g transform="translate(1422 282)"><g class="or-arm"><path d="M0 0L-54 10" stroke="#4a5770" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M-54 10l-9 -7M-54 10l-9 7" stroke="#8a97b0" stroke-width="2.4"/>' +
    '<g class="or-spk"><circle cx="-66" cy="10" r="14" fill="url(#or-gg)"/><circle cx="-66" cy="10" r="3" fill="#eef4ff"/></g></g>' +
    '<circle r="5" fill="#5a6884"/></g>' +
    `<g transform="translate(1392 185)"><g class="or-sh">${shuttle()}</g></g>` +
    '</g>'

  // The frame: a pillar at each edge, mullions between the panes, the ceiling with its night lights, the sill, the
  // handrail and the guide lights along the floor.
  const mullion = (x: number, w: number, strip: number): string =>
    `<rect x="${x}" y="-320" width="${w}" height="1640" fill="url(#or-mul)"/>` +
    `<path d="M${x + w - 1} -320V1320${x > 0 ? `M${x + 1} -320V1320` : ''}" stroke="#3a4660" stroke-opacity=".7" stroke-width="2"/>` +
    `<path d="M${strip} 110V760" stroke="${BLUE}" stroke-opacity=".55" stroke-width="2.4"/>`
  let ceilSeams = ''

  for (let x = 0; x < 1700; x += 160) ceilSeams += `M${x} -320V56`

  const ceilLights = [80, 480, 840, 1240]
    .map(
      x =>
        `<rect x="${x}" y="16" width="280" height="24" rx="4" fill="#0f141d" stroke="#2a3446" stroke-width="2"/>` +
        `<rect x="${x + 6}" y="21" width="268" height="14" rx="2" fill="#bcd0f5" fill-opacity=".2"/>` +
        `<path d="M${x + 12} 28H${x + 268}" stroke="#dce8ff" stroke-opacity=".35" stroke-width="2"/>`,
    )
    .join('')
  let brackets = ''

  for (let x = 60; x < 1600; x += 180) brackets += `M${x} 829h8v18h-8z`

  let floorSeams = ''

  for (let k = -9; k <= 9; k += 1) floorSeams += `M${800 + k * 90} 876L${800 + k * 300} 1000`
  floorSeams += 'M-100 912H1700M-100 958H1700'

  const side: string[] = []
  const middle: string[] = []

  for (let i = 0; i < 25; i += 1) {
    const x = 24 + i * 64

    ;(x > 420 && x < 1180 ? middle : side).push(guide(x, 867))
  }

  const chevrons = (x: number): string =>
    `<path d="M${x} 936l16 12l-16 12M${x + 28} 936l16 12l-16 12M${x + 56} 936l16 12l-16 12" fill="none" stroke="${GUIDE}" stroke-opacity=".4" stroke-width="4" stroke-linejoin="round"/>`

  const frameArt =
    mullion(-240, 280, 30) +
    mullion(400, 40, 420) +
    `<g class="mv-r">${mullion(1160, 40, 1180)}${mullion(1560, 280, 1570)}</g>` +
    // The ceiling.
    '<g class="mv-t">' +
    '<rect x="-100" y="-320" width="1800" height="390" fill="url(#or-ceil)"/>' +
    `<path d="${ceilSeams}" stroke="#0a0e15" stroke-width="2"/>` +
    '<rect x="-100" y="56" width="1800" height="14" fill="#222b3c"/><path d="M-100 57H1700" stroke="#4a5874" stroke-opacity=".8" stroke-width="2"/>' +
    `<path d="M-100 69H1700" stroke="${BLUE}" stroke-opacity=".5" stroke-width="2"/>` +
    `<g class="or-ceil">${ceilLights}</g>` +
    `<path d="${fillet(40, 70, 1, 1)}${fillet(400, 70, -1, 1)}${fillet(440, 70, 1, 1)}" fill="${FRAME}"/>` +
    '</g>' +
    `<g class="mv-r"><g class="mv-t"><path d="${fillet(1160, 70, -1, 1)}${fillet(1200, 70, 1, 1)}${fillet(1560, 70, -1, 1)}" fill="${FRAME}"/></g></g>` +
    // The sill, the handrail, the guide lights and the floor.
    '<g class="mv-b">' +
    '<rect x="-100" y="800" width="1800" height="60" fill="url(#or-sill)"/>' +
    '<rect x="-100" y="796" width="1800" height="10" fill="#273145"/><path d="M-100 797H1700" stroke="#55637f" stroke-opacity=".8" stroke-width="2"/>' +
    `<path d="${fillet(40, 796, 1, -1)}${fillet(400, 796, -1, -1)}${fillet(440, 796, 1, -1)}" fill="${FRAME}"/>` +
    `<path d="${brackets}" fill="#1c2433"/>` +
    '<rect x="-100" y="820" width="1800" height="9" rx="4" fill="#2e384c"/><path d="M-100 821H1700" stroke="#6a7894" stroke-opacity=".6" stroke-width="1.6"/>' +
    '<rect x="-100" y="858" width="1800" height="18" fill="#060910"/>' +
    '<rect x="-100" y="876" width="1800" height="380" fill="url(#or-floor)"/>' +
    `<path d="${floorSeams}" stroke="#18202e" stroke-width="2"/>` +
    '<rect x="-100" y="876" width="1800" height="44" fill="url(#or-refl)"/>' +
    side.join('') +
    `<g opacity=".45">${middle.join('')}</g>` +
    chevrons(120) +
    // Sunlight through the left window, on the floor and the rail.
    '<g class="or-warm"><path d="M60 876H330L560 1000H170Z" fill="url(#or-shf)"/><path d="M360 876H398L610 1000H556Z" fill="url(#or-shf)"/>' +
    `<path d="M40 821H400M40 797H400" stroke="${DAWN}" stroke-opacity=".55" stroke-width="2"/></g>` +
    '</g>' +
    `<g class="mv-r"><g class="mv-b"><path d="${fillet(1160, 796, -1, -1)}" fill="${FRAME}"/></g></g>`

  // The depressurisation alarm: a blue edge that swells and fades, and two beacons turning on the ceiling.
  const beacon = (x: number): string =>
    `<g transform="translate(${x} 74)"><g class="or-wedge"><path d="M0 0L520 -110V110Z" fill="url(#or-wg)"/><path d="M0 0L-520 110V-110Z" fill="url(#or-wg)"/></g>` +
    `<circle r="22" fill="${GUIDE}" fill-opacity=".22"/><circle r="8" fill="#9fc0ff"/></g>`
  const alarm =
    '<g class="or-alarm"><rect width="1600" height="1000" fill="url(#or-vig)"/></g>' +
    `<g class="or-bcn"><g class="mv-t">${beacon(220)}</g><g class="mv-r"><g class="mv-t">${beacon(1380)}</g></g></g>`

  // Loose papers and a pen lifting off the desk when the pressure drops.
  const papers = (
    [
      [404, 298, -70, -270, 40, 0],
      [430, 310, -140, -210, -55, -0.8],
      [372, 304, -30, -310, 70, -1.6],
      [446, 292, -100, -340, -30, -2.4],
      [330, 312, -40, -250, 50, -1.2],
      [392, 316, -120, -290, -70, -2],
    ] as const
  )
    .map(
      ([x, y, dx, dy, r, d]) =>
        `<g class="or-pp" style="--x:${dx}px;--y:${dy}px;--r:${r}deg;--d:${d}s"><rect x="${x}" y="${y}" width="20" height="26" fill="#dfe6f2" fill-opacity=".85"/>` +
        `<path d="M${x + 4} ${y + 7}h12M${x + 4} ${y + 13}h9M${x + 4} ${y + 19}h11" stroke="#7d8ba6" stroke-width="1.6"/></g>`,
    )
    .join('')

  let portStars = ''

  for (let i = 0; i < 9; i += 1) portStars += `M${f(262 + next() * 76)} ${f(-8 + next() * 70)}h2v2h-2z`

  const bolts = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + 0.39

    return `<circle cx="${f(300 + 54 * Math.cos(a))}" cy="${f(30 + 54 * Math.sin(a))}" r="2.6"/>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'orbs',
      ink: '#03050b',
      furniture: SHELL,
      metal: '#232c3d',
      paper: '#dfe6f2',
      light: { idle: '#4a7fe0', work: '#6fa0ff', bright: '#d6e4ff' },
      headTop: 228,
      glowAt: [350, 264],
      device,
      wear: {
        // A comm headset over the top, an earpiece and boom mic on the near side, and a light flight suit from the
        // collar down: all clear of the eyes, which never go below row 5.
        front:
          '<path d="M76 256C76 236 104 226 150 226C196 226 224 236 224 256" fill="none" stroke="#3a465e" stroke-width="5" stroke-linecap="round"/>' +
          '<rect x="216" y="246" width="20" height="30" rx="6" fill="#d4dceb" stroke="#3a465e" stroke-width="2"/>' +
          `<circle cx="226" cy="256" r="2.6" fill="${GUIDE}"/>` +
          '<path d="M230 274Q242 300 224 312" fill="none" stroke="#3a465e" stroke-width="3"/><circle cx="223" cy="312" r="4" fill="#1d2534"/>' +
          `<path d="M70 322H230V350H70Z" fill="${SUIT}"/>` +
          `<g fill="${SUIT}"><rect x="86" y="350" width="16" height="16"/><rect x="118" y="350" width="16" height="16"/><rect x="166" y="350" width="16" height="16"/><rect x="198" y="350" width="16" height="16"/></g>` +
          '<g fill="#1d2534"><rect x="86" y="366" width="16" height="8"/><rect x="118" y="366" width="16" height="8"/><rect x="166" y="366" width="16" height="8"/><rect x="198" y="366" width="16" height="8"/></g>' +
          '<rect x="70" y="322" width="48" height="44" fill="#03050b" fill-opacity=".22"/>' +
          '<rect x="70" y="319" width="160" height="7" fill="#33405a"/>' +
          `<rect x="70" y="326" width="160" height="2.5" fill="${BLUE}"/>` +
          '<path d="M150 329V350" stroke="#7d889c" stroke-width="1.6"/><rect x="224" y="322" width="6" height="28" fill="#e6ecf6" fill-opacity=".5"/>' +
          '<circle cx="104" cy="339" r="7" fill="#1d2a44" stroke="#7fa6ff" stroke-width="1.4"/>' +
          '<ellipse cx="104" cy="339" rx="10" ry="3" fill="none" stroke="#cfe0ff" stroke-width="1.2" transform="rotate(-20 104 339)"/>' +
          '<rect x="176" y="334" width="34" height="6" rx="1" fill="#7d889c"/>',
      },
      seatArt:
        // A pod chair: a pale shell back with a blue edge light, the cushion, one pedestal with a lit ring, a base.
        `<path d="M58 352V232C58 214 72 204 90 204H100C118 204 128 214 128 230V352Z" fill="${SHELL}" stroke="${SHELL_EDGE}" stroke-width="2"/>` +
        `<path d="M63 340V234C63 220 74 210 90 210" fill="none" stroke="${GUIDE}" stroke-opacity=".75" stroke-width="2.4"/>` +
        `<rect x="100" y="348" width="104" height="12" rx="6" fill="#323d52" stroke="${SHELL_EDGE}" stroke-width="1.6"/>` +
        '<path d="M144 360H160L164 442H140Z" fill="#1d2534"/>' +
        `<rect x="140" y="396" width="24" height="4" fill="${GUIDE}" fill-opacity=".75"/>` +
        '<ellipse cx="152" cy="449" rx="44" ry="7" fill="#1d2534" stroke="#3a465c" stroke-width="1.6"/>',
      tableArt:
        // A white console desk: the slab, a blue light under its lip, one leg, and a cabinet at the far end.
        `<path d="M166 330H462Q470 330 470 338V343H166Z" fill="#2f3a4e" stroke="${SHELL_EDGE}" stroke-width="1.6"/>` +
        `<path d="M172 344H466" stroke="${GUIDE}" stroke-opacity=".8" stroke-width="2.4"/>` +
        '<rect x="180" y="345" width="10" height="111" fill="#1b2230"/>' +
        '<rect x="390" y="346" width="76" height="110" rx="4" fill="#1b2230" stroke="#323d52" stroke-width="1.6"/>' +
        '<path d="M394 384H462M394 420H462" stroke="#0e131c" stroke-width="2"/>' +
        `<circle cx="452" cy="364" r="3" fill="${GUIDE}"/><rect x="404" y="362" width="30" height="4" rx="2" fill="#3a465e"/>`,
    },
    style:
      // Ambient: stars and cities twinkle, the ring's lights creep along it, the guide lights chase down the floor.
      '.or-tw1{animation:or-tw 4.6s ease-in-out infinite alternate}.or-tw2{animation:or-tw 3.4s ease-in-out -1.7s infinite alternate}' +
      '@keyframes or-tw{from{opacity:.3}to{opacity:1}}' +
      '.or-ct1{animation:or-ct 3.8s ease-in-out infinite alternate}.or-ct2{animation:or-ct 2.9s ease-in-out -1.2s infinite alternate}' +
      '@keyframes or-ct{from{opacity:.55}to{opacity:1}}' +
      '.or-cl{stroke-dasharray:4 76;animation:or-cl 3.3s linear infinite}@keyframes or-cl{to{stroke-dashoffset:-80}}' +
      '.or-rl{animation:or-rl 7s linear infinite}@keyframes or-rl{to{stroke-dashoffset:-32}}' +
      '.st-thinking .or-rl{animation-duration:16s}.st-run .or-rl{animation-duration:.9s}' +
      '.or-gd{opacity:.35;animation:or-gd 2.8s ease-in-out infinite;animation-delay:var(--d)}@keyframes or-gd{0%,100%{opacity:.35}35%{opacity:1}}' +
      '.st-responding .or-gd,.st-tool .or-gd,.st-run .or-gd{animation-duration:1.4s}' +
      '.or-ceil{opacity:.8}.st-thinking .or-ceil{animation:or-br 3.2s ease-in-out infinite alternate}@keyframes or-br{from{opacity:.45}to{opacity:.95}}' +
      '.or-nav{animation:or-nav 2s steps(1) infinite}@keyframes or-nav{0%{opacity:1}12%{opacity:.15}}' +
      '.or-orb{animation:mv-spin 3.2s linear infinite}.st-tool .or-orb,.st-run .or-orb{animation-duration:1.2s}' +
      '.or-prog{transform-box:fill-box;transform-origin:0 50%;animation:or-prog 2.6s ease-in-out both}@keyframes or-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
      // Tool: the arm outside works and its tip glows. Web: the dish swings and pings the ring. Read: the log scrolls.
      '.st-tool .or-arm{animation:or-arm 1.5s ease-in-out infinite alternate}@keyframes or-arm{from{transform:rotate(-14deg)}to{transform:rotate(18deg)}}' +
      '.or-spk{opacity:0}.st-tool .or-spk{animation:or-spk .7s ease-out infinite}@keyframes or-spk{0%{opacity:0}15%{opacity:1}60%,100%{opacity:0}}' +
      '.st-web .or-dish{animation:or-dish 2.4s ease-in-out infinite alternate}@keyframes or-dish{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}' +
      '.or-sig{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .or-sig{animation:or-sig 1.8s ease-out infinite}' +
      '@keyframes or-sig{0%{opacity:.8;transform:scale(.2)}100%{opacity:0;transform:scale(1.8)}}' +
      '.st-read .or-scr{animation:or-scr 1.2s linear infinite}@keyframes or-scr{to{transform:translateY(-16px)}}' +
      '.or-pnl{opacity:.55}.st-read .or-pnl{opacity:1}' +
      // Run: the shuttle comes in and docks, its clamps light; a segment of the ring sweeps past, its lights racing.
      '.or-sh{opacity:0}.st-run .or-sh{animation:or-sh 3s cubic-bezier(.25,.6,.35,1) both}' +
      '@keyframes or-sh{0%{opacity:0;transform:translate(-560px,-120px) scale(.42)}12%{opacity:1}78%,100%{opacity:1;transform:translate(0,0) scale(1)}}' +
      '.st-run .or-eng{animation:or-eng 3s ease-out both}@keyframes or-eng{0%,60%{opacity:1}85%,100%{opacity:0}}' +
      '.or-clamp{opacity:.2}.st-run .or-clamp{animation:or-on .35s ease-out 2.3s both}@keyframes or-on{to{opacity:1}}' +
      '.or-dk{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .or-dk{animation:or-dk 1s ease-out 2.3s both}' +
      '@keyframes or-dk{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(2.2)}}' +
      '.or-seg{transform:translateX(1700px)}.st-run .or-seg{animation:or-seg 6s linear infinite}' +
      '@keyframes or-seg{from{transform:translateX(1700px)}to{transform:translateX(-1900px)}}' +
      // Error: shutters drop over the side windows, the blue lights pulse slowly together, the beacons turn, the
      // pressure needle falls and the papers float.
      '.or-shut{transform:translateY(-800px)}.st-error .or-shut{animation:or-shut 1.1s cubic-bezier(.3,0,.25,1) both}' +
      '@keyframes or-shut{from{transform:translateY(-800px)}to{transform:translateY(0)}}' +
      '.or-alarm{opacity:0}.st-error .or-alarm{animation:or-alarm 2.6s ease-in-out infinite alternate}@keyframes or-alarm{from{opacity:.05}to{opacity:.62}}' +
      '.st-error .or-gd,.st-error .or-ceil{animation:or-pz 2.6s ease-in-out infinite alternate}@keyframes or-pz{from{opacity:.2}to{opacity:1}}' +
      '.or-bcn{opacity:0}.st-error .or-bcn{opacity:1}.st-error .or-wedge{animation:mv-spin 4s linear infinite}' +
      '.or-pp{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .or-pp{animation:or-pp 3.2s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes or-pp{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.9}80%{opacity:.75}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}' +
      '.or-ndl{transform:rotate(40deg)}.st-error .or-ndl{animation:or-ndl 1.4s cubic-bezier(.4,0,.6,1) both}@keyframes or-ndl{from{transform:rotate(40deg)}to{transform:rotate(-120deg)}}' +
      '.or-warn{opacity:.2}.st-error .or-warn{animation:or-pz 1.3s ease-in-out infinite alternate}' +
      // Done: the orbital sunrise. The sun clears the limb, light runs along it and the ring, the cities pale.
      '.or-sun{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .or-sun{animation:or-sun 2.4s ease-out .1s both}' +
      '@keyframes or-sun{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:scale(1)}}' +
      '.or-limb,.or-rsun{stroke-dasharray:1 1;stroke-dashoffset:1}.st-done .or-limb{animation:or-draw 2.4s cubic-bezier(.3,.5,.3,1) .1s both}' +
      '.st-done .or-rsun{animation:or-draw 2.6s ease-in-out .7s both}@keyframes or-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.or-warm{opacity:0}.st-done .or-warm{animation:or-on 2.4s ease-out .5s both}' +
      '.st-done .or-city{animation:or-dim 3s ease-out both}@keyframes or-dim{to{opacity:.4}}',
    scenery:
      '<defs>' +
      '<linearGradient id="or-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040a"/><stop offset=".6" stop-color="#050913"/><stop offset="1" stop-color="#080d1a"/></linearGradient>' +
      '<radialGradient id="or-pl" cx=".62" cy=".32" r=".75"><stop offset="0" stop-color="#0b1628"/><stop offset=".7" stop-color="#060b16"/><stop offset="1" stop-color="#04070d"/></radialGradient>' +
      '<radialGradient id="or-atm"><stop offset=".925" stop-color="#2f6fed" stop-opacity="0"/><stop offset=".944" stop-color="#5a8eff" stop-opacity=".55"/><stop offset=".968" stop-color="#2f6fed" stop-opacity=".2"/><stop offset="1" stop-color="#2f6fed" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="or-atw"><stop offset=".93" stop-color="#ffb46a" stop-opacity="0"/><stop offset=".945" stop-color="#ffd08a" stop-opacity=".5"/><stop offset=".975" stop-color="#ff9f5a" stop-opacity=".14"/><stop offset="1" stop-color="#ff9f5a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="or-mw"><stop offset="0" stop-color="#9fb2e0" stop-opacity=".09"/><stop offset=".6" stop-color="#7f94c8" stop-opacity=".04"/><stop offset="1" stop-color="#7f94c8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="or-pre"><stop offset="0" stop-color="#7fa8ff" stop-opacity=".16"/><stop offset="1" stop-color="#7fa8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="or-sun"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset=".1" stop-color="#ffe0a0" stop-opacity=".6"/><stop offset=".38" stop-color="#ffb060" stop-opacity=".16"/><stop offset="1" stop-color="#ff9050" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="or-cg"><stop offset="0" stop-color="${CITY}" stop-opacity=".16"/><stop offset="1" stop-color="${CITY}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="or-gl"><stop offset="0" stop-color="#f0f6ff"/><stop offset=".2" stop-color="${ICE}" stop-opacity=".9"/><stop offset=".26" stop-color="${GUIDE}" stop-opacity=".55"/><stop offset="1" stop-color="${GUIDE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="or-gg"><stop offset="0" stop-color="${GUIDE}" stop-opacity=".7"/><stop offset="1" stop-color="${GUIDE}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="or-eng"><stop offset="0" stop-color="#e6f0ff" stop-opacity=".95"/><stop offset=".35" stop-color="#6fa0ff" stop-opacity=".5"/><stop offset="1" stop-color="#2f6fed" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="or-mod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d374c"/><stop offset=".5" stop-color="#1a2130"/><stop offset="1" stop-color="#0c1019"/></linearGradient>' +
      '<linearGradient id="or-mul" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#151b27"/><stop offset=".45" stop-color="#2b3548"/><stop offset="1" stop-color="#19202d"/></linearGradient>' +
      '<linearGradient id="or-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e15"/><stop offset=".8" stop-color="#151c28"/><stop offset="1" stop-color="#1f2737"/></linearGradient>' +
      '<linearGradient id="or-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232c3e"/><stop offset="1" stop-color="#111722"/></linearGradient>' +
      '<linearGradient id="or-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d121b"/><stop offset=".4" stop-color="#090d14"/><stop offset="1" stop-color="#05070b"/></linearGradient>' +
      `<linearGradient id="or-refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GUIDE}" stop-opacity=".14"/><stop offset="1" stop-color="${GUIDE}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="or-shf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DAWN}" stop-opacity=".2"/><stop offset="1" stop-color="${DAWN}" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="or-vig" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#2f6fed" stop-opacity="0"/><stop offset="1" stop-color="#3f7cff" stop-opacity=".5"/></radialGradient>' +
      `<radialGradient id="or-wg" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="520"><stop offset="0" stop-color="${GUIDE}" stop-opacity=".22"/><stop offset="1" stop-color="${GUIDE}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#or-sky)"/>' +
      '<ellipse cx="960" cy="420" rx="760" ry="110" fill="url(#or-mw)" transform="rotate(-24 960 420)"/>' +
      `<path class="or-tw1" d="${starA.join('')}" fill="${ICE}" fill-opacity=".6"/><path class="or-tw2" d="${starB.join('')}" fill="#e6eeff" fill-opacity=".5"/>` +
      rings +
      planet +
      segment +
      station +
      // A faint sheen on the glass of the side panes.
      '<path d="M40 560L250 80H330L40 740Z" fill="#dfe8ff" fill-opacity=".025"/><g class="mv-r"><path d="M1200 420L1340 80H1400L1200 520Z" fill="#dfe8ff" fill-opacity=".025"/></g>' +
      // The shutters, up inside the ceiling until the alarm drops them.
      `<g class="mv-t"><g class="or-shut">${shutter(40, 360, -360, 430)}</g></g>` +
      `<g class="mv-r"><g class="mv-t"><g class="or-shut">${shutter(1200, 360, -360, 430)}</g></g></g>` +
      frameArt +
      alarm,
    nook:
      '<defs>' +
      '<linearGradient id="or-bh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#182030"/><stop offset="1" stop-color="#0e131c"/></linearGradient>' +
      `<linearGradient id="or-ns" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GUIDE}" stop-opacity=".22"/><stop offset="1" stop-color="${GUIDE}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="or-pd"><stop offset="0" stop-color="${DAWN}" stop-opacity=".6"/><stop offset="1" stop-color="${DAWN}" stop-opacity="0"/></radialGradient>` +
      '<clipPath id="or-pc"><circle cx="300" cy="30" r="46"/></clipPath>' +
      '<clipPath id="or-sc"><rect x="36" y="10" width="88" height="46" rx="3"/></clipPath>' +
      '</defs>' +
      // The bulkhead behind the desk, with its lit top edge, seams, handrail and guide-light groove.
      '<path d="M-20 336V-70H480V336Z" fill="url(#or-bh)"/>' +
      `<path d="${fillet(20, -70, 1, -1)}" fill="${FRAME}"/>` +
      '<path d="M-20 -69H480" stroke="#4a5874" stroke-opacity=".8" stroke-width="2"/>' +
      `<path d="M-20 -60H480" stroke="${GUIDE}" stroke-opacity=".6" stroke-width="3"/>` +
      '<rect x="-20" y="-58" width="500" height="44" fill="url(#or-ns)"/>' +
      '<path d="M-20 130H480M-20 250H480M150 -56V130M150 250V318M400 130V318" stroke="#0a0e15" stroke-width="2.4"/>' +
      '<path d="M-20 132H480M-20 252H480" stroke="#26303f" stroke-width="1.4"/>' +
      '<rect x="-20" y="279" width="500" height="9" rx="4" fill="#2e384c"/><path d="M-20 280H480" stroke="#6a7894" stroke-opacity=".6" stroke-width="1.6"/>' +
      '<rect x="-20" y="318" width="500" height="18" fill="#060910"/>' +
      [1204, 1268, 1332, 1396, 1460, 1524, 1588].map(x => guide(x - 1180, 327)).join('') +
      // The porthole: stars, a stretch of the ring, and the dawn when it comes.
      '<circle cx="300" cy="30" r="60" fill="#232c3d" stroke="#4a5874" stroke-width="2"/>' +
      '<circle cx="300" cy="30" r="48" fill="#03060c" stroke="#0a0e15" stroke-width="4"/>' +
      `<g clip-path="url(#or-pc)"><path d="${portStars}" fill="${ICE}" fill-opacity=".7"/>` +
      '<path d="M248 56Q300 12 352 22" fill="none" stroke="#6f9cff" stroke-opacity=".5" stroke-width="5"/>' +
      '<circle class="or-warm" cx="262" cy="70" r="56" fill="url(#or-pd)"/></g>' +
      '<path d="M268 6A40 40 0 0 1 318 -6" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"/>' +
      `<g fill="#5a6884">${bolts}</g>` +
      // The status panel: a log that scrolls, a hazard mark that lights, the cabin pressure gauge.
      '<rect x="26" y="0" width="108" height="108" rx="8" fill="#121823" stroke="#3e4a62" stroke-width="2"/>' +
      '<rect x="36" y="10" width="88" height="46" rx="3" fill="#040810"/>' +
      `<g class="or-pnl" clip-path="url(#or-sc)"><g class="or-scr"><path d="M42 18h56M42 26h40M42 34h66M42 42h48M42 50h60M42 58h36M42 66h54M42 74h44" stroke="${GUIDE}" stroke-opacity=".75" stroke-width="3"/></g></g>` +
      '<g class="or-warn"><path d="M56 68L72 96H40Z" fill="none" stroke="#ffb547" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M50 82Q56 76 62 82" fill="none" stroke="#ffb547" stroke-width="2"/><circle cx="56" cy="89" r="2.6" fill="#ffb547"/></g>' +
      '<circle cx="108" cy="82" r="16" fill="#070b12" stroke="#5a6884" stroke-width="2"/>' +
      '<path d="M96 92A15 15 0 1 1 120 92" fill="none" stroke="#2f6fed" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 4"/>' +
      `<g transform="translate(108 82)"><g class="or-ndl"><path d="M0 2V-12" stroke="${ICE}" stroke-width="2.4" stroke-linecap="round"/></g></g>` +
      // A sector plate with invented marks.
      '<rect x="178" y="148" width="74" height="32" rx="4" fill="#d5ddea" fill-opacity=".12" stroke="#5a6884" stroke-width="1.6"/>' +
      '<g fill="none" stroke="#9fb4d8" stroke-width="2"><circle cx="194" cy="164" r="7"/><path d="M212 156V172M212 160h6M212 168h-5"/></g>' +
      '<g fill="#9fb4d8"><circle cx="194" cy="164" r="2"/><circle cx="230" cy="164" r="2.4"/><circle cx="240" cy="164" r="2.4"/></g>',
    front: papers + '<g class="or-pp" style="--x:-90px;--y:-230px;--r:160deg;--d:-.5s"><rect x="410" y="320" width="30" height="3" rx="1.5" fill="#9aa6bc"/></g>',
  }
}
