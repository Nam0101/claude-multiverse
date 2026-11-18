import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Hologram City: a clean white city of the future at night. Pale towers with ribbon windows and sky gardens, sky
// bridges and a maglev guideway; a giant translucent koi hologram floats between the towers, ads of invented glyphs
// glow on the facades. Claude works in a sky lounge at a holographic keyboard. When a command runs the koi swims
// across the skyline and a maglev zooms by; an error tears the holograms into shifted slices; done blooms hologram
// fireworks.
const CYAN = '#00e5ff'
const GLOW = '#7ff3ff'
const ICE = '#c8f8ff'
const MINT = '#7dffd1'
const PINK = '#ff86b6'
const SHELL = '#7d97a3'
const SHELL_HI = '#d3eef6'
const DESK = '#88a3af'
const BASE = 712
const FOOT = 1010

const KOI_BODY =
  'M150 0C148 -26 118 -46 70 -50C10 -54 -50 -40 -100 -18C-112 -12 -122 -8 -130 -6V6C-122 8 -112 12 -100 18C-50 40 10 52 70 48C118 44 148 26 150 0Z'
const KOI_TAIL = 'M0 -5C-20 -12 -46 -44 -86 -72C-74 -38 -68 -16 -62 0C-68 16 -74 38 -86 72C-46 44 -20 12 0 5Z'
const KOI_DORSAL = 'M46 -49C20 -86 -36 -82 -88 -26C-46 -42 0 -48 46 -49Z'
const KOI_PEC = 'M0 0C-6 30 -34 52 -60 52C-42 38 -22 18 -10 0Z'
const KOI_PELV = 'M0 0C-8 18 -26 30 -42 30C-30 20 -18 10 -10 0Z'

// Strokes an invented glyph is built from, three at a time: where each starts in a 12×14 box, then relative moves.
// There are no stems: stems and bars are what real letters are made of.
type Mark = readonly [number, number, string]
const MARKS: readonly Mark[] = [
  [0, 0, 'h12'], // 0 top bar
  [0, 7, 'h12'], // 1 middle bar
  [0, 14, 'h12'], // 2 bottom bar
  [0, 0, 'l12 14'], // 3 diagonal
  [0, 14, 'a6 6 0 0 1 12 0'], // 4 low arch
  [9, 0.5, 'a2.5 2.5 0 1 0 .1 0z'], // 5 small ring around (9, 3)
  [4, 9, 'h4v4h-4z'], // 6 small box
  [0, 4, 'l6 -4l6 4'], // 7 roof
  [2, 2, 'l8 4l-8 4'], // 8 chevron
]

// Pairs that would spell part of a real character: two bars (二, 三, Ξ), a roof with a bar (ㅈ, 스, 亼), a box with
// a bar (므, 古), the ring over a bar (으), and the box under the arch or the roof (冋, 合).
const CLASH = new Set(['0-1', '0-2', '1-2', '0-7', '1-7', '2-7', '0-6', '1-6', '2-6', '1-5', '2-5', '4-6', '6-7'])

function glyph(next: () => number, x: number, y: number): string {
  const used = new Set<number>()
  let d = ''

  while (used.size < 3) {
    const index = Math.floor(next() * MARKS.length)

    if (used.has(index) || [...used].some(other => CLASH.has(`${Math.min(other, index)}-${Math.max(other, index)}`))) {
      continue
    }

    used.add(index)
    const [dx, dy, rel] = MARKS[index] as Mark
    d += `M${f(x + dx)} ${f(y + dy)}${rel}`
  }

  return d
}

/** The koi's scales: small arcs over the middle of the body, none on the head. */
function koiScales(): string {
  let d = ''

  for (let row = -3; row <= 3; row += 1) {
    const y = row * 11

    for (let col = 0; col < 12; col += 1) {
      const x = -96 + col * 17 + (row % 2 === 0 ? 0 : 8)
      const nx = (x + 5) / 118
      const ny = y / 42

      if (nx * nx + ny * ny <= 0.72 && x <= 92) {
        d += `M${f(x)} ${f(y - 6)}a6 6 0 0 0 0 12`
      }
    }
  }

  return d
}

/** The giant koi hologram, head to the right, in its own coordinates (about 360 long). */
function koiFull(): string {
  const scan = Array.from({ length: 18 }, (_, i) => `M-140 ${-72 + i * 8}H160`).join('')

  return (
    '<ellipse cx="-20" cy="0" rx="250" ry="124" fill="url(#hc-kg)"/>' +
    `<g fill="${CYAN}" stroke="${GLOW}" stroke-linejoin="round">` +
    `<g transform="translate(62 34)"><g class="hc-fin hc-fin2"><path d="${KOI_PEC}" fill-opacity=".06" stroke-opacity=".35" stroke-width="1.5"/></g></g>` +
    `<g transform="translate(-126 0)"><g class="hc-tail"><path d="${KOI_TAIL}" fill-opacity=".1" stroke-opacity=".75" stroke-width="2"/>` +
    '<path d="M-4 -4L-72 -56M-6 0L-62 0M-4 4L-72 56" fill="none" stroke-opacity=".3" stroke-width="1.2"/></g></g>' +
    `<path d="${KOI_DORSAL}" fill-opacity=".08" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="${KOI_BODY}" fill-opacity=".12" stroke-opacity=".9" stroke-width="2.6"/>` +
    `<g fill="${ICE}" stroke="none" fill-opacity=".2"><ellipse cx="26" cy="-22" rx="36" ry="15" transform="rotate(-8 26 -22)"/><ellipse cx="-56" cy="10" rx="30" ry="12"/><ellipse cx="96" cy="12" rx="16" ry="11"/></g>` +
    `<path d="${koiScales()}" fill="none" stroke-opacity=".3" stroke-width="1.2"/>` +
    `<g clip-path="url(#hc-kc)"><path class="hc-scan" d="${scan}" fill="none" stroke="${ICE}" stroke-opacity=".14" stroke-width="1.2"/>` +
    `<rect class="hc-bar" x="-140" y="-6" width="300" height="12" fill="${ICE}" fill-opacity=".16" stroke="none"/></g>` +
    '<path d="M100 -38C90 -14 90 14 100 38" fill="none" stroke-opacity=".45" stroke-width="1.6"/>' +
    '<path d="M142 12C152 26 164 32 180 30M137 18C141 34 150 45 166 52" fill="none" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>' +
    `<circle cx="116" cy="-16" r="6" fill="${ICE}" fill-opacity=".9" stroke="none"/>` +
    `<g transform="translate(-40 38)"><g class="hc-fin"><path d="${KOI_PELV}" fill-opacity=".08" stroke-opacity=".5" stroke-width="1.4"/></g></g>` +
    `<g transform="translate(76 40)"><g class="hc-fin"><path d="${KOI_PEC}" fill-opacity=".1" stroke-opacity=".7" stroke-width="1.8"/></g></g>` +
    '</g>'
  )
}

/** The koi as the glitch tears it: the outline only, drawn once per slice. */
function koiLite(fill: string, line: string): string {
  return (
    `<g fill="${fill}" stroke="${line}" stroke-linejoin="round">` +
    `<g transform="translate(-126 0)"><g class="hc-tail"><path d="${KOI_TAIL}" fill-opacity=".1" stroke-opacity=".75" stroke-width="2"/></g></g>` +
    `<path d="${KOI_DORSAL}" fill-opacity=".08" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="${KOI_BODY}" fill-opacity=".14" stroke-opacity=".9" stroke-width="2.6"/>` +
    `<g fill="${line}" stroke="none" fill-opacity=".22"><ellipse cx="26" cy="-22" rx="36" ry="15"/><ellipse cx="-56" cy="10" rx="30" ry="12"/></g>` +
    `<circle cx="116" cy="-16" r="6" fill="${line}" stroke="none"/>` +
    `<path transform="translate(76 40)" d="${KOI_PEC}" fill-opacity=".1" stroke-opacity=".7" stroke-width="1.8"/></g>`
  )
}

// What a cluster of towers draws in one path each: cyan and white window ribbons, the lit edges, the crown outlines.
type Lights = { cyan: string; white: string; edge: string; crown: string }

/** A pale tower tapering to its crown; its windows, lit edge and crown outline go into `lights`. */
function tower(x: number, w: number, top: number, crown: 'dome' | 'spire' | 'tier' | 'flat', next: () => number, lights: Lights): string {
  const inset = w * 0.08
  const cx = x + w / 2
  let head = ''

  switch (crown) {
    case 'dome':
      head = `M${f(x + inset)} ${top}A${f(w / 2 - inset)} ${f(w * 0.32)} 0 0 1 ${f(x + w - inset)} ${top}Z`
      break
    case 'spire':
      head =
        `M${f(x + inset + 6)} ${top}L${f(cx - 10)} ${top - 50}H${f(cx + 10)}L${f(x + w - inset - 6)} ${top}Z` +
        `M${f(cx - 3)} ${top - 50}L${f(cx)} ${top - 160}L${f(cx + 3)} ${top - 50}Z`
      break
    case 'tier':
      head = `M${f(x + w * 0.2)} ${top}V${top - 40}H${f(x + w * 0.8)}V${top}ZM${f(x + w * 0.34)} ${top - 40}V${top - 72}H${f(x + w * 0.66)}V${top - 40}Z`
      break
    case 'flat':
      head = ''
  }

  for (let y = top + 18; y < FOOT - 30; y += 24) {
    if (next() < 0.3) {
      continue
    }

    const t = (y - top) / (FOOT - top)
    const left = x + inset * (1 - t) + 7
    const right = x + w - inset * (1 - t) - 7
    const a = Math.round(left + next() * (right - left) * 0.25)
    const len = Math.round(right - next() * (right - left) * 0.25) - a
    const seg = `M${a} ${y}h${len}v3h${-len}z`

    if (next() < 0.7) {
      lights.cyan += seg
    } else {
      lights.white += seg
    }
  }

  lights.edge += `M${f(x + inset + 0.8)} ${top}L${f(x + 0.8)} ${FOOT}M${f(cx)} ${top}V${FOOT}`
  lights.crown += `M${f(x + inset)} ${top}H${f(x + w - inset)}${head}`

  return `<path d="M${f(x)} ${FOOT}L${f(x + inset)} ${top}H${f(x + w - inset)}L${f(x + w)} ${FOOT}Z${head}" fill="url(#hc-tw)"/>`
}

/** The lit edges and the white crowns of a cluster, drawn once its towers are in. */
function outline(lights: Lights): string {
  return (
    `<path d="${lights.edge}" fill="none" stroke="${SHELL_HI}" stroke-opacity=".4" stroke-width="1.5"/>` +
    `<path d="${lights.crown}" fill="none" stroke="#e8fbff" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/>`
  )
}

/** A terrace garden on a tower: a pale ledge and a row of round trees. */
function garden(x: number, y: number, w: number, next: () => number): string {
  let d = ''

  for (let at = x + 6; at < x + w - 4; at += 15) {
    const r = 6 + next() * 4
    const cy = y - r + 2

    d += `M${f(at - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`
  }

  return `<path d="${d}" fill="#1b4c43"/><rect x="${x - 4}" y="${y}" width="${w + 8}" height="5" rx="2" fill="${SHELL}"/>`
}

/** A sky bridge: an arched tube with a lit strip, and data that runs along it on a web search. */
function bridge(x1: number, x2: number, y: number, rise: number): string {
  const d = `M${x1} ${y}Q${(x1 + x2) / 2} ${y - rise} ${x2} ${y}`

  return (
    `<path d="${d}" fill="none" stroke="#5c7884" stroke-width="10"/><path d="${d}" fill="none" stroke="${CYAN}" stroke-opacity=".5" stroke-width="2"/>` +
    `<path class="hc-data" d="${d}" fill="none" stroke="${ICE}" stroke-width="3" stroke-dasharray="6 18"/>`
  )
}

/** The rays of a firework, shared by every burst: each one dashes into a long stroke and a dot at its tip. */
const RAYS = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * Math.PI * 2

  return `M${Math.round(Math.cos(a) * 22)} ${Math.round(Math.sin(a) * 22)}L${Math.round(Math.cos(a) * 80)} ${Math.round(Math.sin(a) * 80)}`
}).join('')

/** One firework of hologram light: rays with bright tips, a dotted ring and a soft glow. */
function burst(x: number, y: number, s: number, delay: number, color: string): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="hc-fw" style="animation-delay:${delay}s"><circle r="96" fill="url(#hc-fwg)"/>` +
    `<path d="${RAYS}" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="40 9 2 99"/>` +
    `<circle r="52" fill="none" stroke="${color}" stroke-opacity=".6" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/></g></g>`
  )
}

/** A maglev: a long pale capsule with a window ribbon, nose to the left, 380 long. */
function train(): string {
  const windows = Array.from({ length: 11 }, (_, i) => `M${56 + i * 29} 8h22v6h-22z`).join('')

  return (
    '<ellipse cx="-40" cy="17" rx="56" ry="9" fill="url(#hc-hl)"/>' +
    '<path d="M0 18C2 6 16 0 44 0H380V26H30C12 26 0 24 0 18Z" fill="#5a7581"/>' +
    `<path d="M40 1H380" stroke="${SHELL_HI}" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="${windows}" fill="${CYAN}" fill-opacity=".6"/><path d="M10 13C14 7 24 4 40 4V13Z" fill="${ICE}" fill-opacity=".55"/>` +
    '<path d="M150 0V26M268 0V26" stroke="#2a3f49" stroke-width="2"/>' +
    `<path d="M24 28.5H380" stroke="${CYAN}" stroke-opacity=".7" stroke-width="2"/><circle cx="5" cy="18" r="2.6" fill="#ffffff"/>`
  )
}

/** Claude's holo desk: a projected keyboard, a floating screen over a projector bar, a puck with a tiny koi. */
function device(light: string, activity: Activity): string {
  const next = random(31)
  let screen: string

  switch (activity) {
    case 'run':
      screen =
        `<path d="M314 238l15 17l-15 17M334 238l15 17l-15 17" fill="none" stroke="${light}" stroke-width="5" stroke-linejoin="round"/>` +
        `<rect x="306" y="282" width="66" height="5" fill="${light}" fill-opacity=".25"/><rect class="hc-prog" x="306" y="282" width="66" height="5" fill="${light}"/>`
      break
    case 'error':
      screen = `<path d="M330 236a18 18 0 1 0 22 8M316 282l8 -6l8 6l8 -6l8 6l8 -6" fill="none" stroke="${light}" stroke-width="3.5" stroke-linecap="round"/>`
      break
    case 'done':
      screen = `<path d="M318 256l12 12l24 -26" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
      break
    case 'thinking':
      screen =
        `<g transform="translate(338 258)"><g class="hc-spin" fill="${light}"><circle cx="14" r="4"/><circle cx="-7" cy="12" r="4"/><circle cx="-7" cy="-12" r="4"/></g></g>`
      break
    default: {
      let d = ''

      for (let row = 0; row < 5; row += 1) {
        let x = 306 + (row % 2) * 4

        while (x < 366) {
          const len = 4 + next() * 12

          d += `M${f(x)} ${236 + row * 12}h${f(Math.min(len, 370 - x))}`
          x += len + 4
        }
      }

      screen = `<path d="${d}" stroke="${light}" stroke-opacity=".75" stroke-width="3"/><rect class="hc-cur" x="352" y="280" width="7" height="6" fill="${light}"/>`
    }
  }

  return (
    // The keyboard of light on the desk.
    `<path d="M240 329L338 329L330 317L248 317Z" fill="${light}" fill-opacity=".16" stroke="${light}" stroke-opacity=".7" stroke-width="1.2"/>` +
    `<path d="M252 321H334M250 325H336M264 317L262 329M280 317L279 329M296 317L296 329M312 317L313 329" stroke="${light}" stroke-opacity=".45" stroke-width="1"/>` +
    // The projector bar, its beam and the floating screen.
    `<path d="M302 324L372 324L378 298L296 298Z" fill="${light}" fill-opacity=".07"/>` +
    `<path d="M296 298L378 298L384 218L292 226Z" fill="${light}" fill-opacity=".12" stroke="${light}" stroke-opacity=".8" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M292 226L284 222M384 218L392 214M296 298L288 302M378 298L386 302" stroke="${GLOW}" stroke-opacity=".5" stroke-width="2"/>` +
    screen +
    `<rect x="298" y="324" width="80" height="6" rx="3" fill="#9ab5c1"/><path d="M308 324h12M330 324h12M352 324h12" stroke="${light}" stroke-width="2"/>` +
    // The puck and its tiny koi, circling.
    `<path d="M398 326L410 326L420 296H388Z" fill="${light}" fill-opacity=".1"/>` +
    `<ellipse cx="404" cy="327" rx="12" ry="3.5" fill="#9ab5c1"/><ellipse cx="404" cy="325" rx="5" ry="1.4" fill="${light}"/>` +
    '<g transform="translate(404 298) scale(1 .42)"><g class="hc-mini">' +
    `<g transform="translate(16 0) rotate(90) scale(.11)" fill="${light}" fill-opacity=".45" stroke="${light}" stroke-width="12">` +
    `<path d="${KOI_BODY}"/><path transform="translate(-126 0)" d="${KOI_TAIL}"/></g></g></g>`
  )
}

export function hologramCityWorld(): World {
  const next = random(23)
  const leftLights: Lights = { cyan: '', white: '', edge: '', crown: '' }
  const rightLights: Lights = { cyan: '', white: '', edge: '', crown: '' }
  const dim: Lights = { cyan: '', white: '', edge: '', crown: '' }

  // The far skyline: slender rounded towers across the whole width, a few lit windows each.
  let farA = ''
  let farB = ''
  let farDots = ''

  for (let x = -40, i = 0; x < 1640; i += 1) {
    const w = 34 + next() * 50
    const top = 440 + next() * 190
    const d = `M${f(x)} ${BASE}V${f(top + 10)}Q${f(x + w / 2)} ${f(top - 8)} ${f(x + w)} ${f(top + 10)}V${BASE}Z`

    if (i % 2 === 0) {
      farA += d
    } else {
      farB += d
    }

    for (let k = 0; k < 4; k += 1) {
      farDots += `M${Math.round(x + 6 + next() * (w - 12))} ${Math.round(top + 22 + next() * (BASE - top - 40))}h4v2h-4z`
    }

    x += w + 4 + next() * 18
  }

  // Mid towers behind the chat column: big and dim, few lights.
  const midTowers = [
    [450, 70, 410],
    [560, 96, 470],
    [700, 64, 360],
    [800, 110, 520],
    [950, 80, 400],
    [1070, 90, 480],
  ]
    .map(([x, w, top]) => {
      const t = top as number
      let d = ''

      for (let y = t + 20; y < BASE - 20; y += 26) {
        if (next() < 0.55) {
          d += `M${f((x as number) + 8 + next() * 10)} ${y}h${f((w as number) * 0.5)}v2h${f(-(w as number) * 0.5)}z`
        }
      }

      dim.cyan += d

      return `M${x} ${BASE}V${t + 14}Q${(x as number) + (w as number) / 2} ${t - 6} ${(x as number) + (w as number)} ${t + 14}V${BASE}Z`
    })
    .join('')

  // The white towers on the left, the koi's emitter on the low one.
  const left =
    tower(-40, 110, 170, 'dome', next, leftLights) +
    tower(130, 80, 130, 'spire', next, leftLights) +
    tower(270, 100, 470, 'flat', next, leftLights) +
    outline(leftLights) +
    garden(-30, 430, 96, next) +
    garden(140, 560, 60, next) +
    bridge(70, 130, 330, 16) +
    bridge(210, 270, 560, 12) +
    bridge(70, 130, 610, 10) +
    bridge(210, 270, 820, 10)
  const right =
    tower(1220, 90, 380, 'dome', next, rightLights) +
    tower(1350, 100, 150, 'spire', next, rightLights) +
    tower(1490, 140, 260, 'tier', next, rightLights) +
    outline(rightLights) +
    garden(1500, 520, 120, next) +
    garden(1228, 600, 74, next) +
    bridge(1310, 1350, 470, 10) +
    bridge(1450, 1490, 360, 12) +
    bridge(1450, 1490, 640, 8) +
    bridge(1310, 1350, 790, 8)

  // Stars, faint over the clean air.
  let starA = ''
  let starB = ''

  for (let i = 0; i < 44; i += 1) {
    const d = `M${Math.round(next() * 1600)} ${Math.round(next() * 420)}h2v2h-2z`

    if (i % 2 === 0) {
      starA += d
    } else {
      starB += d
    }
  }

  // Sky traffic: small pods gliding in lanes behind the white towers.
  const pods = [
    [214, 26, 3, false],
    [262, 34, 18, true],
    [300, 22, 9, false],
    [352, 30, 21, true],
    [396, 40, 5, false],
    [236, 46, 30, true],
  ]
    .map(([y, secs, delay, back]) => {
      const pod =
        '<path d="M0 -3h14a3 3 0 0 1 0 6h-14a3 3 0 0 1 0 -6z" fill="#a9c3ce"/>' +
        `<path d="M-30 0H0" stroke="${CYAN}" stroke-opacity=".4" stroke-width="2"/><circle cx="16" r="1.6" fill="#ffffff"/>`

      return (
        `<g transform="translate(0 ${y})"><g class="hc-pod${back === true ? ' hc-rev' : ''}" style="--pd:${secs}s;animation-delay:${-(delay as number)}s">` +
        (back === true ? `<g transform="scale(-1 1)">${pod}</g>` : pod) +
        '</g></g>'
      )
    })
    .join('')

  // The left banner's glyph columns and its page of lines, each twice so the scroll loops.
  let columns = ''
  let page = ''

  for (let row = 0; row < 9; row += 1) {
    columns += glyph(next, 36, 452 + row * 24) + glyph(next, 64, 452 + row * 24)
  }

  for (let row = 0; row < 18; row += 1) {
    page += `M34 ${452 + row * 12}h${f(28 + next() * 28)}`
  }

  const scroll = (d: string, attrs: string) => `<g class="hc-scroll"><path d="${d}" ${attrs}/><path d="${d}" ${attrs} transform="translate(0 216)"/></g>`
  const adRows = Array.from({ length: 6 }, (_, i) => glyph(next, 1316 + i * 17, 428) + glyph(next, 1316 + i * 17, 454)).join('')

  // The glitch: three slices of the koi, each pushed its own way.
  const bands = [
    [-120, 98],
    [-22, 38],
    [16, 104],
  ]
  const clips = bands.map(([y, h], i) => `<clipPath id="hc-c${i}"><rect x="-240" y="${y}" width="450" height="${h}"/></clipPath>`).join('')
  const slices = bands
    .map((_, i) => `<g clip-path="url(#hc-c${i})"><g class="hc-g${i}">${i === 1 ? koiLite(PINK, '#ffc4dc') : koiLite(CYAN, GLOW)}</g></g>`)
    .join('')
  const glitchBars = [
    [-190, -46, 380, 8, CYAN],
    [-80, 24, 300, 6, PINK],
    [-230, 66, 240, 7, CYAN],
    [20, -84, 200, 5, PINK],
    [-160, -10, 140, 10, ICE],
    [60, 50, 160, 5, CYAN],
  ]
    .map(([x, y, w, h, c], i) => `<rect class="hc-gb" style="animation-delay:${f(-(i % 3) / 3)}s" x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" fill-opacity=".45"/>`)
    .join('')
  const pylons = Array.from({ length: 8 }, (_, i) => {
    const x = 60 + i * 220

    return `M${x - 11} 1000L${x - 6} 712H${x + 6}L${x + 11} 1000Z`
  }).join('')
  const lamps = Array.from({ length: 40 }, (_, i) => `M${Math.round(i * 41 + next() * 10)} ${Math.round(748 + (i % 3) * 46 + next() * 8)}h3v3h-3z`).join('')
  const streaks = Array.from({ length: 6 }, (_, i) => `<path class="hc-streak" style="animation-delay:${f(-i * 0.08)}s" d="M${f(200 + next() * 1200)} ${f(674 + i * 4)}h${f(140 + next() * 160)}" stroke="${ICE}" stroke-width="1.6"/>`).join('')
  const motes = Array.from({ length: 6 }, (_, i) => `<rect class="hc-mote" style="--md:${f(4.5 + next() * 3)}s;animation-delay:${f(-next() * 6)}s" x="${f(290 + next() * 120)}" y="${f(200 + next() * 90)}" width="3" height="3" fill="${GLOW}"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'holo',
      cup: 'none',
      thought: 'orbs',
      ink: '#03090d',
      furniture: SHELL,
      metal: '#2a3f4a',
      paper: '#d8eef4',
      light: { idle: '#1fa3b8', work: CYAN, bright: '#a8f4ff' },
      headTop: 210,
      glowAt: [338, 258],
      device,
      wear: {
        // A white shell cap with a cyan strip, an earpiece and a clear AR visor on the near side, and a tiny helper
        // drone hovering up-left, scanning the cap. The cap ends at 253, above the eyes; the visor is translucent.
        front:
          '<path d="M66 253C66 224 104 207 150 207C196 207 234 224 234 253Z" fill="#a3bdc8"/>' +
          '<path d="M90 226C110 214 132 210 150 210" fill="none" stroke="#eefbff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M66 245H234V253H66Z" fill="#1c323c"/>' +
          `<path d="M70 249H230" stroke="${CYAN}" stroke-opacity=".9" stroke-width="2"/>` +
          '<rect x="224" y="242" width="14" height="28" rx="6" fill="#a3bdc8"/>' +
          `<circle cx="231" cy="256" r="2.6" fill="${CYAN}"/>` +
          `<path d="M180 254H240V280Q240 290 230 290H190Q180 290 180 280Z" fill="${CYAN}" fill-opacity=".12" stroke="${GLOW}" stroke-opacity=".6" stroke-width="1.5"/>` +
          '<g class="hc-dr">' +
          `<path d="M76 172L58 226H102L84 172Z" fill="${CYAN}" fill-opacity=".09"/>` +
          `<path d="M60 160h40M64 160v6M96 160v6" fill="none" stroke="${SHELL_HI}" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>` +
          `<ellipse class="hc-rot" cx="64" cy="158" rx="10" ry="1.8" fill="#e8fbff" fill-opacity=".55"/><ellipse class="hc-rot" cx="96" cy="158" rx="10" ry="1.8" fill="#e8fbff" fill-opacity=".55"/>` +
          '<path d="M66 164h28a5 5 0 0 1 0 10h-28a5 5 0 0 1 0 -10z" fill="#c9e2ea"/>' +
          '<path d="M68 167H92" stroke="#1c323c" stroke-width="2.5" stroke-linecap="round"/>' +
          `<circle cx="80" cy="174" r="2.6" fill="${CYAN}"/><ellipse cx="80" cy="177" rx="11" ry="2.2" fill="${CYAN}" fill-opacity=".3"/></g>`,
      },
      seatArt:
        // A white egg-pod lounge chair on one stem.
        `<path d="M60 376C36 330 30 252 62 212C90 178 150 170 192 194C210 205 218 222 214 240L198 242C192 218 158 204 118 208C86 212 72 246 74 300C74 334 78 356 88 376Z" fill="${SHELL}"/>` +
        '<path d="M88 376C78 356 74 334 74 300C72 246 86 212 118 208C158 204 192 218 198 242L208 376Z" fill="#16262e"/>' +
        `<path d="M60 376C36 330 30 252 62 212C90 178 150 170 192 194" fill="none" stroke="${SHELL_HI}" stroke-opacity=".5" stroke-width="2"/>` +
        '<rect x="86" y="346" width="132" height="16" rx="8" fill="#2a4652"/>' +
        `<path d="M96 348H208" stroke="${CYAN}" stroke-opacity=".4" stroke-width="1.5"/>` +
        '<path d="M144 376H160L164 440H140Z" fill="#5b7480"/>' +
        `<ellipse cx="152" cy="450" rx="66" ry="6" fill="${CYAN}" fill-opacity=".12"/><ellipse cx="152" cy="446" rx="52" ry="7" fill="#6f8995"/>`,
      tableArt:
        // A floating white slab desk on one blade leg, a cyan strip under its edge.
        `<path d="M166 330H470L462 342H174Z" fill="${DESK}"/>` +
        '<path d="M168 330.8H468" stroke="#e2f7fc" stroke-opacity=".55" stroke-width="1.6"/>' +
        `<path d="M184 343.5H452" stroke="${CYAN}" stroke-opacity=".6" stroke-width="2"/>` +
        '<path d="M424 342C416 378 410 416 400 452H448C444 416 442 378 446 342Z" fill="#6d8894"/>' +
        `<path d="M424 342C416 378 410 416 400 452" fill="none" stroke="${SHELL_HI}" stroke-opacity=".35" stroke-width="1.5"/>` +
        `<ellipse cx="300" cy="452" rx="150" ry="5" fill="${CYAN}" fill-opacity=".08"/>`,
    },
    style:
      // The koi: drifting, its tail and fins beating, scanlines rolling down it.
      '.hc-kb{animation:hc-kb 7s ease-in-out infinite alternate}@keyframes hc-kb{from{transform:translate(-8px,10px) rotate(2deg)}to{transform:translate(12px,-12px) rotate(-3deg)}}' +
      '.hc-tail{animation:hc-tail 1.6s ease-in-out infinite alternate}@keyframes hc-tail{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
      '.hc-fin{animation:hc-fin 1.9s ease-in-out infinite alternate}.hc-fin2{animation-delay:-.95s}@keyframes hc-fin{from{transform:rotate(-10deg)}to{transform:rotate(14deg)}}' +
      '.hc-scan{animation:hc-scan 1.1s linear infinite}@keyframes hc-scan{to{transform:translateY(8px)}}' +
      '.hc-bar{animation:hc-bar 3.2s linear infinite}@keyframes hc-bar{from{transform:translateY(-64px)}to{transform:translateY(64px)}}' +
      '.hc-cone{animation:hc-pulse 4s ease-in-out infinite alternate}@keyframes hc-pulse{from{opacity:.55}to{opacity:1}}' +
      // City life: beacons, stars, pods, the far train, the rings on the spire, the ad orb.
      '.hc-bc{animation:hc-bc 2.8s ease-in-out infinite alternate}.hc-bc2{animation-delay:-1.4s}@keyframes hc-bc{from{opacity:.2}to{opacity:.9}}' +
      '.hc-st{animation:hc-st 4s ease-in-out infinite alternate}.hc-st2{animation-delay:-2s}@keyframes hc-st{from{opacity:.25}to{opacity:.7}}' +
      '.hc-pod{animation:hc-pod var(--pd) linear infinite}.hc-rev{animation-direction:reverse}@keyframes hc-pod{from{transform:translateX(-160px)}to{transform:translateX(1780px)}}' +
      '.hc-ftr{animation:hc-ftr 16s linear infinite}@keyframes hc-ftr{from{transform:translateX(-260px)}to{transform:translateX(1860px)}}' +
      '.hc-ring{animation:hc-ring 7s linear infinite}@keyframes hc-ring{to{stroke-dashoffset:-176}}' +
      '.hc-mer{transform-box:fill-box;transform-origin:center;animation:hc-mer 3.6s linear infinite}.hc-mer2{animation-delay:-1.8s}@keyframes hc-mer{from{transform:scaleX(1)}to{transform:scaleX(-1)}}' +
      '.hc-scroll{animation:hc-scroll 10s linear infinite}@keyframes hc-scroll{to{transform:translateY(-216px)}}' +
      '.hc-prog{transform-box:fill-box;transform-origin:0 50%;animation:hc-prog 1.4s ease-in-out infinite}@keyframes hc-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
      '.hc-spin{animation:mv-spin 1.6s linear infinite}.hc-mini{animation:mv-spin 5s linear infinite}' +
      '.hc-cur{animation:hc-cur 1.1s steps(1) infinite}@keyframes hc-cur{50%{opacity:0}}' +
      '.hc-dr{animation:hc-dr 3.4s ease-in-out infinite alternate}@keyframes hc-dr{to{transform:translate(3px,-5px)}}' +
      '.hc-rot{transform-box:fill-box;transform-origin:center;animation:hc-rot .35s linear infinite alternate}@keyframes hc-rot{to{transform:scaleX(.3)}}' +
      '.hc-mote{opacity:0;animation:hc-mote var(--md,6s) ease-in-out infinite}@keyframes hc-mote{0%{opacity:0;transform:translateY(0)}30%{opacity:.8}100%{opacity:0;transform:translateY(-60px)}}' +
      // Thinking: the koi slows and the ads load; responding and tools speed the city up.
      '.st-thinking .hc-kb{animation-duration:12s}.st-thinking .hc-tail{animation-duration:2.8s}.st-thinking .hc-scroll{animation-duration:20s}' +
      '.hc-load{opacity:0}.st-thinking .hc-load{opacity:1}.st-thinking .hc-rows{opacity:.25}' +
      '.st-responding .hc-scroll,.st-tool .hc-scroll{animation-duration:3.5s}' +
      '.st-responding .hc-pod,.st-tool .hc-pod{animation-duration:calc(var(--pd) / 3)}' +
      '.hc-sb{opacity:0}.st-tool .hc-sb{opacity:1;animation:hc-sb 2.6s ease-in-out infinite alternate}.hc-sb2{animation-delay:-1.3s!important}' +
      '@keyframes hc-sb{from{transform:rotate(-22deg)}to{transform:rotate(18deg)}}' +
      // Read: the banner turns into a page. Web: the spires broadcast and data runs over the bridges.
      '.hc-page{display:none}.st-read .hc-page{display:inline}.st-read .hc-glyphs{display:none}' +
      '.hc-wv{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .hc-wv{animation:hc-wv 1.8s ease-out infinite}' +
      '@keyframes hc-wv{0%{opacity:.7;transform:scale(.3)}100%{opacity:0;transform:scale(2.6)}}' +
      '.hc-data{opacity:0}.st-web .hc-data{opacity:.8;animation:hc-data .9s linear infinite}@keyframes hc-data{to{stroke-dashoffset:-24}}' +
      // Run: the koi swims across the skyline, a maglev zooms along the guideway.
      // It leaves off the right edge, cuts back to off the left edge while hidden, and swims home, so it never parks.
      '.st-run .hc-kx{animation:hc-cross 9s infinite}@keyframes hc-cross{0%{transform:translate(0,0);animation-timing-function:cubic-bezier(.4,.05,.75,.9)}' +
      '46%{transform:translate(1560px,-130px);animation-timing-function:steps(1,end)}47%{transform:translate(-480px,30px);animation-timing-function:cubic-bezier(.2,.6,.4,1)}100%{transform:translate(0,0)}}' +
      '.st-run .hc-tail{animation-duration:.42s}.st-run .hc-fin{animation-duration:.6s}' +
      '.st-run .hc-cone{animation:hc-fade .6s ease-out both}@keyframes hc-fade{to{opacity:0}}' +
      '.hc-train{opacity:0}.st-run .hc-train{animation:hc-zoom 2.6s cubic-bezier(.3,0,.7,1) .1s infinite}' +
      '@keyframes hc-zoom{0%{opacity:1;transform:translateX(1720px)}48%{opacity:1;transform:translateX(-560px)}49%,100%{opacity:0;transform:translateX(-560px)}}' +
      '.hc-streak{opacity:0}.st-run .hc-streak{animation:hc-streak .5s linear infinite}@keyframes hc-streak{0%{opacity:0;transform:translateX(200px)}30%{opacity:.45}100%{opacity:0;transform:translateX(-400px)}}' +
      '.st-run .hc-ftr{animation-duration:5s}' +
      // Error: the holograms tear into slices that jump three times a second, a pink ghost beside them.
      '.hc-ks,.hc-ghost,.hc-err{display:none}.st-error .hc-ks,.st-error .hc-ghost,.st-error .hc-err{display:inline}.st-error .hc-k1{display:none}' +
      '.st-error .hc-g0{animation:hc-g0 1s steps(1) infinite}.st-error .hc-g1{animation:hc-g1 1s steps(1) infinite}.st-error .hc-g2{animation:hc-g2 1s steps(1) infinite}' +
      '@keyframes hc-g0{0%{transform:translateX(-16px)}33.3%{transform:translateX(-50px)}66.6%{transform:translateX(24px)}}' +
      '@keyframes hc-g1{0%{transform:translateX(46px)}33.3%{transform:translateX(66px)}66.6%{transform:translateX(-48px)}}' +
      '@keyframes hc-g2{0%{transform:translateX(-36px)}33.3%{transform:translateX(40px)}66.6%{transform:translateX(-12px)}}' +
      '.st-error .hc-ks{animation:hc-kf 1s steps(1) infinite}@keyframes hc-kf{0%{opacity:.95}33.3%{opacity:.7}66.6%{opacity:.85}}' +
      '.st-error .hc-ghost{animation:hc-gh 1s steps(1) infinite}@keyframes hc-gh{0%{opacity:.75;transform:translate(22px,-5px)}33.3%{opacity:.45;transform:translate(-18px,4px)}66.6%{opacity:.6;transform:translate(10px,0)}}' +
      '.st-error .hc-gb{animation:hc-gb 1s steps(1) infinite}@keyframes hc-gb{0%{opacity:.9}33.3%{opacity:0}66.6%{opacity:.5}}' +
      '.st-error .hc-ad{animation:hc-jit 1s steps(1) infinite}@keyframes hc-jit{0%{transform:translateX(3px)}33.3%{transform:translateX(-14px)}66.6%{transform:translateX(9px)}}' +
      '.st-error .hc-win{animation:hc-dim 2.4s ease-in-out both}@keyframes hc-dim{0%{opacity:1}25%{opacity:.35}100%{opacity:.75}}' +
      // Done: hologram fireworks bloom one by one and the koi leaps.
      '.hc-fw{opacity:0}.st-done .hc-fw{animation:hc-fw 2.2s ease-out both}@keyframes hc-fw{0%{opacity:0;transform:scale(.2)}12%{opacity:1;transform:scale(.62)}55%{opacity:.85}100%{opacity:0;transform:scale(1.15)}}' +
      '.st-done .hc-kx{animation:hc-leap 2.8s ease-in-out both}' +
      '@keyframes hc-leap{0%{transform:translate(0,0) rotate(0)}35%{transform:translate(50px,-110px) rotate(-24deg)}70%{transform:translate(120px,-40px) rotate(16deg)}100%{transform:translate(0,0) rotate(0)}}' +
      '.hc-yay{display:none}.st-done .hc-yay{display:inline}.st-done .hc-rows{display:none}',
    scenery:
      '<defs>' +
      '<linearGradient id="hc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02080d"/><stop offset=".45" stop-color="#061620"/><stop offset=".72" stop-color="#0a2430"/><stop offset="1" stop-color="#071820"/></linearGradient>' +
      '<radialGradient id="hc-hz"><stop offset="0" stop-color="#2fc6dc" stop-opacity=".16"/><stop offset="1" stop-color="#2fc6dc" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hc-tw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8eacb8"/><stop offset=".2" stop-color="#557482"/><stop offset=".65" stop-color="#263f49"/><stop offset="1" stop-color="#172830"/></linearGradient>' +
      '<radialGradient id="hc-kg"><stop offset="0" stop-color="#00e5ff" stop-opacity=".2"/><stop offset=".55" stop-color="#00e5ff" stop-opacity=".07"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hc-cg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#00e5ff" stop-opacity=".3"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hc-sbg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c8f8ff" stop-opacity=".24"/><stop offset="1" stop-color="#c8f8ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hc-adg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00e5ff" stop-opacity=".2"/><stop offset="1" stop-color="#00e5ff" stop-opacity=".05"/></linearGradient>' +
      '<radialGradient id="hc-fwg"><stop offset="0" stop-color="#c8f8ff" stop-opacity=".45"/><stop offset=".5" stop-color="#00e5ff" stop-opacity=".12"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hc-hl"><stop offset="0" stop-color="#e8fbff" stop-opacity=".5"/><stop offset="1" stop-color="#e8fbff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hc-low" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081820"/><stop offset="1" stop-color="#03090d"/></linearGradient>' +
      `<clipPath id="hc-kc"><path d="${KOI_BODY}"/></clipPath><clipPath id="hc-cb"><rect x="28" y="448" width="66" height="200"/></clipPath>${clips}` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#hc-sky)"/>' +
      `<path class="hc-st" d="${starA}" fill="#d8f6fc"/><path class="hc-st hc-st2" d="${starB}" fill="#bfefff"/>` +
      '<ellipse cx="800" cy="690" rx="1050" ry="230" fill="url(#hc-hz)"/>' +
      // The far skyline and the far guideway with its small train.
      `<path d="${farA}" fill="#0a1c26"/><path d="${farB}" fill="#0c2029"/><path class="hc-win" d="${farDots}" fill="${GLOW}" fill-opacity=".28"/>` +
      `<path d="M-40 588H1640" stroke="#163039" stroke-width="5"/><path d="M-40 586H1640" stroke="${CYAN}" stroke-opacity=".16" stroke-width="1.4"/>` +
      `<g transform="translate(0 574) scale(.45)"><g class="hc-ftr"><path d="M0 18C2 6 16 0 44 0H380V26H30C12 26 0 24 0 18Z" fill="#3f5864"/><path d="M56 8H372" stroke="${CYAN}" stroke-opacity=".5" stroke-width="6" stroke-dasharray="22 7"/></g></g>` +
      pods +
      // Big dim towers behind the chat column.
      `<path d="${midTowers}" fill="#0c212c"/><path class="hc-win" d="${dim.cyan}" fill="${GLOW}" fill-opacity=".16"/>` +
      // The city below the guideway: dark, with rows of small lamps.
      `<rect y="712" width="1600" height="300" fill="url(#hc-low)"/><path d="${lamps}" fill="${GLOW}" fill-opacity=".22"/>` +
      // The left cluster, the koi's emitter on the low tower, beacons on the crowns.
      left +
      `<path class="hc-win" d="${leftLights.cyan}" fill="${GLOW}" fill-opacity=".3"/><path class="hc-win" d="${leftLights.white}" fill="#e6f8fb" fill-opacity=".22"/>` +
      '<rect x="300" y="460" width="40" height="10" rx="3" fill="#4a6672"/>' +
      `<ellipse cx="320" cy="460" rx="18" ry="3.5" fill="${CYAN}" fill-opacity=".8"/>` +
      `<circle class="hc-bc" cx="160" cy="80" r="3" fill="${ICE}"/><circle class="hc-bc hc-bc2" cx="180" cy="80" r="3" fill="${ICE}"/>` +
      `<g transform="translate(15 140)"><path class="hc-sb" d="M-3 0L-64 -660H64L3 0Z" fill="url(#hc-sbg)"/></g>` +
      `<g transform="translate(170 40)"><circle class="hc-wv" r="30" fill="none" stroke="${GLOW}" stroke-width="2"/><circle class="hc-wv" style="animation-delay:.6s" r="30" fill="none" stroke="${GLOW}" stroke-width="2"/></g>` +
      // The right cluster, its rings, its ad panel and its beam.
      '<g class="mv-r">' +
      right +
      `<path class="hc-win" d="${rightLights.cyan}" fill="${GLOW}" fill-opacity=".3"/><path class="hc-win" d="${rightLights.white}" fill="#e6f8fb" fill-opacity=".22"/>` +
      `<g fill="none" stroke="${GLOW}" stroke-width="2" stroke-dasharray="14 8"><ellipse class="hc-ring" cx="1400" cy="112" rx="58" ry="11" stroke-opacity=".55"/>` +
      '<ellipse class="hc-ring" style="animation-direction:reverse" cx="1400" cy="70" rx="38" ry="8" stroke-opacity=".45"/></g>' +
      `<circle class="hc-bc" cx="1386" cy="100" r="3" fill="${ICE}"/><circle class="hc-bc hc-bc2" cx="1414" cy="100" r="3" fill="${ICE}"/>` +
      `<g transform="translate(1400 80)"><circle class="hc-wv" r="34" fill="none" stroke="${GLOW}" stroke-width="2"/><circle class="hc-wv" style="animation-delay:.6s" r="34" fill="none" stroke="${GLOW}" stroke-width="2"/><circle class="hc-wv" style="animation-delay:1.2s" r="34" fill="none" stroke="${GLOW}" stroke-width="2"/></g>` +
      `<g transform="translate(1560 190)"><path class="hc-sb hc-sb2" d="M-3 0L-64 -660H64L3 0Z" fill="url(#hc-sbg)"/></g>` +
      '<g class="hc-ad">' +
      `<rect x="1238" y="414" width="190" height="84" rx="3" fill="url(#hc-adg)" stroke="${GLOW}" stroke-opacity=".55" stroke-width="1.6"/>` +
      `<path d="M1238 426V414H1250M1416 414H1428V426M1428 486V498H1416M1250 498H1238V486" fill="none" stroke="${ICE}" stroke-opacity=".8" stroke-width="2"/>` +
      `<g transform="translate(1276 456)" fill="none" stroke="${GLOW}" stroke-width="1.5"><circle r="26" fill="${CYAN}" fill-opacity=".1" stroke-opacity=".8"/>` +
      '<ellipse rx="26" ry="8" stroke-opacity=".5"/><ellipse class="hc-mer" rx="26" ry="26" stroke-opacity=".6"/><ellipse class="hc-mer hc-mer2" rx="26" ry="26" stroke-opacity=".6"/>' +
      `<g class="hc-load"><g class="hc-spin" fill="${ICE}" stroke="none"><circle cx="0" cy="-34" r="3"/><circle cx="29" cy="17" r="3"/><circle cx="-29" cy="17" r="3"/></g></g></g>` +
      `<path class="hc-rows" d="${adRows}" fill="none" stroke="${GLOW}" stroke-opacity=".8" stroke-width="1.6"/>` +
      `<g class="hc-yay" fill="${ICE}">${[1330, 1366, 1402].map(x => `<path d="M${x} 440l4 12l12 4l-12 4l-4 12l-4 -12l-12 -4l12 -4z"/>`).join('')}</g>` +
      `<rect x="1316" y="482" width="100" height="4" fill="${CYAN}" fill-opacity=".25"/><rect class="hc-prog" x="1316" y="482" width="100" height="4" fill="${GLOW}" fill-opacity=".8"/>` +
      `<rect class="hc-err" x="1238" y="414" width="190" height="84" fill="${PINK}" fill-opacity=".14"/>` +
      `<path class="hc-err" d="M1246 440l20 10l20 -10l20 10l20 -10l20 10l20 -10l20 10l20 -10M1246 472l20 10l20 -10l20 10l20 -10l20 10l20 -10l20 10l20 -10" fill="none" stroke="${PINK}" stroke-opacity=".85" stroke-width="2.5"/>` +
      '</g>' +
      burst(1290, 150, 1.2, 0.5, PINK) +
      burst(1510, 270, 1.3, 1.3, CYAN) +
      burst(1430, 70, 1.05, 2.1, ICE) +
      '</g>' +
      // The left banner: invented glyphs scrolling, a page of lines while reading.
      '<g class="hc-ad">' +
      `<rect x="24" y="404" width="74" height="250" rx="3" fill="url(#hc-adg)" stroke="${GLOW}" stroke-opacity=".55" stroke-width="1.6"/>` +
      `<g transform="translate(61 428)" fill="none" stroke="${ICE}" stroke-width="2"><circle r="13" stroke-opacity=".8"/><path d="M-8 3C-4 -7 4 9 8 -3" stroke-opacity=".9"/></g>` +
      '<g clip-path="url(#hc-cb)">' +
      `<g class="hc-glyphs">${scroll(columns, `fill="none" stroke="${GLOW}" stroke-opacity=".8" stroke-width="1.6"`)}</g>` +
      `<g class="hc-page">${scroll(page, `stroke="${ICE}" stroke-opacity=".7" stroke-width="3"`)}</g></g>` +
      `<rect class="hc-err" x="24" y="404" width="74" height="250" fill="${PINK}" fill-opacity=".14"/>` +
      `<path class="hc-err" d="M30 500l12 8l12 -8l12 8l12 -8l12 8M30 560l12 8l12 -8l12 8l12 -8l12 8M30 610l12 8l12 -8l12 8l12 -8l12 8" fill="none" stroke="${PINK}" stroke-opacity=".85" stroke-width="2.5"/>` +
      '</g>' +
      // The koi, projected from the low tower's roof.
      '<path class="hc-cone" d="M310 460L330 460L410 300L190 300Z" fill="url(#hc-cg)"/>' +
      // On an error the projection tears: scanline bars across the cone, on the same 1 s steps as the slices.
      `<g class="hc-err">${[
        [198, 318, 204, 5, PINK],
        [222, 346, 130, 6, ICE],
        [246, 384, 128, 4, PINK],
        [276, 420, 70, 4, CYAN],
      ]
        .map(([x, y, w, h, c], i) => `<rect class="hc-gb" style="animation-delay:${f(-(i % 3) / 3)}s" x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" fill-opacity=".5"/>`)
        .join('')}</g>` +
      '<g transform="translate(240 236) scale(1.08)"><g class="hc-kx"><g class="hc-kb">' +
      `<g class="hc-k1">${koiFull()}</g>` +
      `<g class="hc-ks"><ellipse cx="-20" cy="0" rx="250" ry="124" fill="url(#hc-kg)"/>${slices}</g>` +
      `<g class="hc-ghost" fill="none" stroke="${PINK}" stroke-width="2"><path d="${KOI_BODY}" stroke-opacity=".7"/><path transform="translate(-126 0)" d="${KOI_TAIL}" stroke-opacity=".5"/></g>` +
      `<g class="hc-err">${glitchBars}</g>` +
      '</g></g></g>' +
      // The maglev guideway on its pylons, the train and its streaks.
      `<path d="${pylons}" fill="#0a1a22"/>` +
      '<rect x="-40" y="700" width="1680" height="12" fill="#112630"/>' +
      `<path d="M-40 700H1640" stroke="${CYAN}" stroke-opacity=".38" stroke-width="2"/>` +
      `<g transform="translate(0 672)"><g class="hc-train">${train()}</g></g>` +
      streaks +
      burst(130, 110, 1.3, 0.2, ICE) +
      burst(350, 70, 1.1, 0.9, MINT) +
      burst(110, 380, 1, 1.6, PINK) +
      burst(310, 350, 0.8, 2.3, CYAN),
    nook:
      // The sky lounge: a tinted glass wall with slim mullions behind the desk, a glass parapet with a pale rail,
      // the floor slab and its lit edge.
      '<path d="M-20 -30H420V286H-20Z" fill="#03101a" fill-opacity=".42"/>' +
      '<path d="M-20 -30H420M150 -30V286M330 -30V286" fill="none" stroke="#cfeff7" stroke-opacity=".14" stroke-width="2"/>' +
      '<path d="M-20 286H420V448H-20Z" fill="#8fe6f5" fill-opacity=".035"/>' +
      '<path d="M-20 286H420" stroke="#cfeff7" stroke-opacity=".3" stroke-width="3"/>' +
      '<path d="M60 288V448M240 288V448" stroke="#cfeff7" stroke-opacity=".1" stroke-width="2"/>' +
      '<path d="M-20 448H440V480H-20Z" fill="#071117"/>' +
      `<path d="M-20 448H440" stroke="${CYAN}" stroke-opacity=".3" stroke-width="2"/>` +
      '<path d="M30 460H190M240 466H400" stroke="#cfeff7" stroke-opacity=".06" stroke-width="2"/>',
    front: motes,
  }
}
