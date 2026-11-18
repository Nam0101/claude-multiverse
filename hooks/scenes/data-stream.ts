import type { Activity } from '../../types'
import { f, random } from './kit'
import { cell } from './rig'
import type { World } from './world'

// Data Stream: inside the machine. A towering CPU stands on the motherboard wall at the left, a column of light rising
// out of its core; a five-lane bus crosses the top into its pins, traces climb off the board floor into it from below,
// memory sticks stand at the far right. Green packets ride the traces like trains and faint invented glyphs fall
// behind it all. Claude sits on a chip at a terminal, jacked in by a cable. Run floods every trace into the core; an
// error sends a corrupt red packet down one lane that glitches the chip and burns the trace out; done races green
// light out of the core along every trace, turns every LED green and pulses the core.
const G = '#39ff6a'
const G_HI = '#c4ffd4'
const G_MID = '#1fae4a'
const G_DIM = '#0e3a1d'
const CHIP = '#050a07'
const CHIP_EDGE = '#1d3427'
const PIN = '#3a4c41'
const RED = '#ff3b3b'
const AMBER = '#ffb02e'
const GOLD = '#a3863a'
const OFF = '#173322'

/** The board floor: its horizon, and the seam where the wall meets it. Floor traces run toward the horizon's center. */
const VPY = 330
const SEAM = 640
const toBottom = (x0: number): number => 800 + ((x0 - 800) * (1000 - VPY)) / (SEAM - VPY)

/** The five bus lanes, from off the right edge into the CPU's top pins, with a 45° jog on the way. */
const BUS = [0, 1, 2, 3, 4].map(k => `M1700 ${70 + 16 * k}H${700 + 16 * k}l-28 28H${314 + 19 * k}l-18 18V215`)
/** Floor traces that climb the wall into the CPU's bottom pins, and three that run under the desk to the memory. */
const UP = [125, 182, 239, 296, 353].map(x => `M${f(toBottom(x))} 1000L${x} ${SEAM}V585`)
const UNDER = [1200, 1270, 1340].map(x => `M${f(toBottom(x))} 1000L${x} ${SEAM}`)
/** The stretch of lane 2 that burns out when the corrupt packet reaches the chip. */
const BURN = 'M404 130H352l-18 18V215'
/** Claude's cable, from the socket on the floor up into the jack on its head. */
const CABLE = 'M30 456C30 300 32 252 40 226C52 190 86 172 132 170C172 168 206 186 206 218'

// Packets: a three-car train every quarter of a lane, or the dense flood a command sends. One period is 250 of 1000.
const TRAIN = '8 5 8 5 8 216'
const FLOOD = '36 18 36 160'

/** Invented 3×3 marks, one octal digit per row: never letters. */
const GLYPHS = [0o524, 0o613, 0o251, 0o432, 0o306, 0o165, 0o605, 0o516]

/** One falling column: three lines of pixels whose dashes spell twelve marks, 20 px apart. */
function column(next: () => number): string {
  const lanes: boolean[][] = [[], [], []]

  for (let g = 0; g < 12; g += 1) {
    const glyph = GLYPHS[Math.floor(next() * GLYPHS.length)] ?? 0

    for (let row = 0; row < 4; row += 1) {
      for (let c = 0; c < 3; c += 1) {
        const on = row < 3 && ((glyph >> (8 - row * 3 - c)) & 1) === 1

        for (let p = 0; p < 5; p += 1) lanes[c]?.push(on && p < 4)
      }
    }
  }

  return lanes
    .map((bits, c) => {
      const runs: number[] = []
      let state = true
      let length = 0

      for (const bit of bits) {
        if (bit === state) {
          length += 1
        } else {
          runs.push(length)
          state = bit
          length = 1
        }
      }
      runs.push(length)

      return `<path d="M${c * 5} 0V240" stroke-dasharray="${runs.join(' ')}"/>`
    })
    .join('')
}

/** A status light, and the green one that covers it when the work is done. */
function ledPair(x: number, y: number, color: string, i: number, blink: boolean): string {
  return (
    `<circle${blink ? ` class="ds-bk" style="animation-delay:${f(-i * 0.41)}s"` : ''} cx="${x}" cy="${y}" r="3.6" fill="${color}" stroke="${color}" stroke-opacity=".25" stroke-width="7"/>` +
    `<circle class="ds-lg" style="--i:${i}" cx="${x}" cy="${y}" r="3.8" fill="${G}" stroke="${G}" stroke-opacity=".3" stroke-width="8"/>`
  )
}

/** The CPU: pins on four sides, the package, the heat spreader, the die with nine cores, the center one the brightest. */
function cpu(): string {
  const pins: string[] = []

  for (let i = 0; i < 16; i += 1) {
    const a = 83 + 19 * i

    pins.push(`M${a} 215h8v20h-8zM${a} 565h8v20h-8zM45 ${a + 170}h20v8h-20zM395 ${a + 170}h20v8h-20z`)
  }

  const order = [0, 1, 2, 5, 8, 7, 6, 3, 4]
  const base: string[] = []
  const inner: string[] = []
  const lit: string[] = []

  order.forEach((at, i) => {
    const x = 154 + 53 * (at % 3)
    const y = 324 + 53 * Math.floor(at / 3)

    base.push(`M${x} ${y}h46v46h-46z`)
    inner.push(`M${x + 12} ${y + 12}h22v22h-22z`)
    lit.push(`<rect class="ds-cell" style="--i:${i}" x="${x}" y="${y}" width="46" height="46"/>`)
  })

  const stubs = [1, 3, 6, 9, 12, 14].map(i => `M415 ${257 + 19 * i}h24`).join('')
  const stubPads = [1, 3, 6, 9, 12, 14].map(i => `M439 ${253 + 19 * i}h8v8h-8z`).join('')

  return (
    `<path d="${stubs}" stroke="${G_DIM}" stroke-width="3"/><path d="${stubPads}" fill="#0f3a1e"/>` +
    `<path d="${pins.join('')}" fill="${PIN}"/>` +
    `<rect x="65" y="235" width="330" height="330" rx="10" fill="${CHIP}" stroke="${CHIP_EDGE}" stroke-width="3"/>` +
    `<rect x="70" y="240" width="320" height="320" rx="8" fill="none" stroke="${G}" stroke-opacity=".16" stroke-width="1.5"/>` +
    '<path d="M80 250h22l-22 22z" fill="#163022"/>' +
    '<rect x="100" y="270" width="260" height="260" rx="6" fill="#09150e" stroke="#22402d" stroke-width="2"/>' +
    '<path d="M112 506h34M112 516h20M320 284h28M330 294h18" stroke="#1d3a28" stroke-width="3"/>' +
    `<circle class="ds-ring" cx="230" cy="400" r="118" fill="none" stroke="${G}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="4 10"/>` +
    `<rect x="146" y="316" width="168" height="168" fill="#020905" stroke="${G}" stroke-opacity=".4" stroke-width="2"/>` +
    `<path d="${base.join('')}" fill="#072412" stroke="${G}" stroke-opacity=".22" stroke-width="1.5"/>` +
    `<path d="${inner.join('')}" fill="none" stroke="${G}" stroke-opacity=".18" stroke-width="1.5"/>` +
    `<g fill="${G}" fill-opacity=".8">${lit.join('')}</g>` +
    `<rect class="ds-core" x="215" y="385" width="30" height="30" fill="${G_HI}" fill-opacity=".85"/>` +
    `<rect class="ds-cred" x="207" y="377" width="46" height="46" fill="${RED}" fill-opacity=".75"/>` +
    [0, 1]
      .map(i => `<circle class="ds-wave" style="--i:${i}" cx="230" cy="400" r="120" fill="none" stroke="${G}" stroke-width="5"/>`)
      .join('') +
    // The glitch: bars of the chip torn sideways for a moment.
    `<g class="ds-glx"><rect x="38" y="296" width="392" height="12" fill="${RED}" fill-opacity=".5"/>` +
    `<rect x="58" y="352" width="350" height="7" fill="${G}" fill-opacity=".55"/>` +
    `<rect x="30" y="428" width="404" height="16" fill="${RED}" fill-opacity=".35"/>` +
    `<rect x="80" y="506" width="300" height="6" fill="${G_HI}" fill-opacity=".5"/></g>`
  )
}

/** The memory sticks standing at the far right, in their slots on the floor, wired up into the bus. */
function memory(led: (x: number, y: number, color: string, blink: boolean) => string): string {
  let bodies = ''
  let chips = ''
  let gold = ''
  let slots = ''
  let links = ''
  let pads = ''
  let scans = ''
  let lights = ''

  for (let i = 0; i < 4; i += 1) {
    const x = 1236 + 86 * i

    bodies += `M${x} 190h60v424h-60z`
    for (let j = 0; j < 5; j += 1) chips += `M${x + 8} ${206 + 78 * j}h44v58h-44z`
    for (let t = 0; t < 10; t += 1) gold += `M${f(x + 4 + 5.4 * t)} 598h3.2v12h-3.2z`
    slots += `M${x - 6} 608h72v32h-72z`
    links += `M${x + 20} 190V152M${x + 40} 190V152`
    pads += `M${x + 16.5} 146h7v7h-7zM${x + 36.5} 146h7v7h-7z`
    scans += `<rect class="ds-scan" style="--i:${i}" x="${x}" y="206" width="60" height="40"/>`
    lights += led(x + 14, 199, i % 2 ? AMBER : G_MID, i % 2 === 0) + led(x + 46, 199, i === 2 ? '#c8463a' : OFF, false)
  }

  return (
    `<path d="${links}" stroke="${G_DIM}" stroke-width="3"/><path d="${pads}" fill="#0f3a1e"/>` +
    `<path d="${bodies}" fill="#081d10" stroke="#1a4428" stroke-width="2"/>` +
    `<path d="${chips}" fill="${CHIP}" stroke="#17291d" stroke-width="1.5"/>` +
    `<path d="${gold}" fill="${GOLD}" fill-opacity=".8"/>` +
    `<g fill="${G}" fill-opacity=".3">${scans}</g>` +
    `<path d="${slots}" fill="#030805" stroke="#16301f" stroke-width="2"/>` +
    lights
  )
}

/** The terminal on the desk: a keyboard, a slim panel of green code on a stand, and a chip with three lights. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web'
  const rows: readonly (readonly [number, number, number])[] = [
    [306, 224, 44],
    [306, 234, 62],
    [314, 244, 36],
    [314, 254, 52],
    [306, 264, 28],
    [306, 274, 50],
    [314, 284, 34],
  ]
  const code = rows
    .map(([x, y, w], i) => `<rect${busy ? ` class="ds-ln" style="animation-delay:${f(-i * 0.27)}s"` : ''} x="${x}" y="${y}" width="${w}" height="3"/>`)
    .join('')
  const dots = activity === 'error' ? RED : activity === 'done' ? G : light
  const screen = 'M300 219L384 212V292L300 297Z'

  return (
    '<rect x="242" y="322" width="74" height="8" rx="2" fill="#122219" stroke="#24412e"/>' +
    `<g fill="${light}" fill-opacity=".55">${[248, 258, 268, 278, 288, 298].map(x => `<rect x="${x}" y="324" width="6" height="3"/>`).join('')}</g>` +
    '<rect x="336" y="296" width="10" height="27" fill="#122219"/><rect x="310" y="322" width="62" height="8" rx="1" fill="#122219" stroke="#24412e"/>' +
    '<path d="M294 213L390 205V298L294 304Z" fill="#0d1a12" stroke="#2a4a35" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="${screen}" fill="#021006"/><path d="${screen}" fill="${light}" fill-opacity=".16"/>` +
    `<g fill="${light}" fill-opacity=".9" transform="translate(0 26.2) skewY(-5)">${code}<rect class="cur" x="352" y="284" width="6" height="7"/></g>` +
    `<path d="M295 214V303" stroke="${light}" stroke-width="2.5" stroke-opacity=".8"/>` +
    '<path d="M390 290C402 300 404 314 400 318" fill="none" stroke="#0a140d" stroke-width="3"/>' +
    `<rect x="378" y="317" width="38" height="13" rx="1.5" fill="${CHIP}" stroke="${CHIP_EDGE}" stroke-width="1.5"/>` +
    `<g fill="${dots}">${[386, 397, 408]
      .map((x, i) => `<circle${busy ? ` class="ds-tb" style="animation-delay:${f(-i * 0.3)}s"` : ''} cx="${x}" cy="323.5" r="2.2"/>`)
      .join('')}</g>`
  )
}

export function dataStreamWorld(): World {
  const next = random(4021)
  let leds = 0
  const led = (x: number, y: number, color: string, blink: boolean): string => ledPair(x, y, color, leds++, blink)

  // Faint traces on the wall behind everything, each with a 45° jog and a pad at both ends.
  const traces: string[] = []
  const tracePads: string[] = []
  const region = (count: number, x0: number, x1: number, y0: number, y1: number) => {
    for (let i = 0; i < count; i += 1) {
      const x = x0 + next() * (x1 - x0)
      const y = y0 + next() * (y1 - y0)
      const a = 40 + next() * 130
      const d = 18 + next() * 28
      const s = next() < 0.5 ? -1 : 1
      const b = 40 + next() * 130

      traces.push(`M${f(x)} ${f(y)}h${f(a)}l${f(d)} ${f(s * d)}h${f(b)}`)
      tracePads.push(`M${f(x - 4)} ${f(y - 4)}h8v8h-8zM${f(x + a + d + b - 4)} ${f(y + s * d - 4)}h8v8h-8z`)
    }
  }
  region(14, 430, 1100, 190, 520)
  region(4, 0, 160, 20, 190)
  region(4, 1180, 1500, 170, 600)

  // Components standing along the foot of the wall: capacitors, chips and coils, dim.
  const parts: string[] = []
  const rims: string[] = []
  for (let x = 432; x < 1170; ) {
    const t = next()

    if (t < 0.4) {
      const w = 30 + next() * 12
      const h = 60 + next() * 60

      parts.push(`M${f(x)} ${SEAM}v${f(-h + 6)}q0 -6 6 -6h${f(w - 12)}q6 0 6 6v${f(h - 6)}z`)
      rims.push(`M${f(x)} ${f(SEAM - h + 12)}h${f(w)}`)
      x += w + 8 + next() * 18
    } else if (t < 0.75) {
      const w = 60 + next() * 50
      const h = 26 + next() * 22

      parts.push(`M${f(x)} ${SEAM}v${f(-h)}h${f(w)}v${f(h)}z`)
      rims.push(`M${f(x + 5)} ${f(SEAM - h + 6)}h${f(w - 10)}`)
      x += w + 8 + next() * 18
    } else {
      const w = 44 + next() * 16
      const r = w * 0.3

      parts.push(`M${f(x)} ${SEAM}v${f(-w * 0.9)}h${f(w)}v${f(w * 0.9)}z`)
      rims.push(`M${f(x + w / 2 - r)} ${f(SEAM - w * 0.45)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`)
      x += w + 8 + next() * 18
    }
  }

  // The falling glyph columns, a third larger than drawn: brighter at the sides, faint over the chat.
  const columns = (
    [
      [10, 0.75],
      [52, 0.7],
      [98, 0.65],
      [332, 0.65],
      [378, 0.65],
      [476, 0.28],
      [596, 0.25],
      [716, 0.28],
      [856, 0.25],
      [986, 0.28],
      [1112, 0.28],
      [1200, 0.65],
      [1244, 0.6],
      [1300, 0.65],
      [1352, 0.7],
      [1404, 0.6],
      [1446, 0.65],
      [1500, 0.7],
      [1550, 0.65],
      [1584, 0.75],
    ] as const
  )
    .map(
      ([x, o]) =>
        `<g transform="translate(${x} 0) scale(1.35)" opacity="${o}"><g class="ds-fall" style="--d:${f(4.5 + next() * 4)}s;animation-delay:${f(-next() * 10)}s">${column(next)}</g></g>`,
    )
    .join('')

  // The board floor: traces running off toward the horizon, cross links and vias.
  const rays = Array.from({ length: 27 }, (_, i) => -280 + i * 80)
  const along = (x0: number, t: number): [number, number] => [x0 + (toBottom(x0) - x0) * t, SEAM + (1000 - SEAM) * t]
  let floor = rays.map(x0 => `M${x0} ${SEAM}L${f(toBottom(x0))} 1000`).join('')
  let vias = ''
  for (let i = 0; i < 12; i += 1) {
    const k = Math.floor(next() * (rays.length - 1))
    const t = 0.08 + next() * 0.7
    const [ax, ay] = along(rays[k] ?? 0, t)
    const [bx] = along(rays[k + 1] ?? 0, t)

    floor += `M${f(ax)} ${f(ay)}H${f(bx)}`
  }
  for (let i = 0; i < 22; i += 1) {
    const t = 0.06 + next() * 0.85
    const [x, y] = along(rays[Math.floor(next() * rays.length)] ?? 0, t)
    const s = 3 + t * 7

    vias += `M${f(x - s / 2)} ${f(y - s / 3)}h${f(s)}v${f((s * 2) / 3)}h${f(-s)}z`
  }

  const lane = (d: string, delay: number, halo: boolean, extra: string): string => {
    const at = `d="${d}" pathLength="1000" style="animation-delay:${f(delay)}s" stroke-dasharray="${TRAIN}"`

    return (halo ? `<path class="ds-pk${extra}" ${at} stroke-width="12" stroke-opacity=".2"/>` : '') + `<path class="ds-pk${extra}" ${at} stroke-width="4"/>`
  }
  const traffic =
    BUS.map((d, k) => lane(d, -next() * 8, true, k === 2 ? ' ds-k2' : '')).join('') +
    UP.map(d => lane(d, -next() * 8, false, '')).join('') +
    UNDER.map(d => lane(d, -next() * 8, false, '')).join('')
  const every = [...BUS, ...UP, ...UNDER]
  const flood = every.map(d => `<path d="${d}" pathLength="1000" stroke-dasharray="${FLOOD}"/>`).join('')
  const lit = every.map(d => `<path d="${d}" pathLength="1000"/>`).join('')

  const sparks = [
    [-46, -30],
    [-30, -58],
    [38, -44],
    [52, -12],
    [-58, 6],
    [24, -70],
  ]
    .map(([dx, dy], i) => `<rect class="ds-spk" style="--dx:${dx}px;--dy:${dy}px" x="${332 + (i % 3)}" y="196" width="4" height="4"/>`)
    .join('')
  const smoke = [
    [0, -14],
    [1, 16],
    [2, -6],
  ]
    .map(([i, dx]) => `<circle class="ds-smk" style="--i:${i};--dx:${dx}px" cx="${334 + (i ?? 0) * 6}" cy="170" r="11"/>`)
    .join('')

  const cpuLights =
    led(84, 196, AMBER, true) + led(106, 196, G_MID, false) + led(128, 196, OFF, false) + led(150, 196, AMBER, true) +
    led(36, 606, G_MID, true) + led(58, 606, '#c8463a', false) + led(80, 606, AMBER, false)
  const sticks = memory(led)
  const portLights = led(1586, 66, AMBER, true) + led(1586, 146, OFF, false)
  const nookLights = led(16, 444, AMBER, true) + led(54, 444, OFF, false)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'holo',
      cup: 'none',
      thought: 'bits',
      ink: '#020604',
      furniture: '#0a1a10',
      metal: '#122219',
      paper: '#cfeedd',
      light: { idle: '#2bbf58', work: G, bright: '#b8ffcc' },
      headTop: 215,
      glowAt: [330, 256],
      device,
      wear: {
        // The cable runs from the floor socket up behind Claude into the jack on its head.
        behind:
          `<path d="${CABLE}" fill="none" stroke="#08120b" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="${CABLE}" fill="none" stroke="${G}" stroke-opacity=".28" stroke-width="2"/>` +
          `<path class="ds-pk ds-cab" d="${CABLE}" pathLength="1000" fill="none" stroke="${G}" stroke-width="3.5" stroke-dasharray="10 6 10 224"/>`,
        // A headband of lights over the brow, well above the eyes, and the jack with its gold collar.
        front:
          `<g fill="#0b150e">${cell(1.75, -0.2, 10.5, 0.85)}</g>` +
          `<g fill="#24452f">${cell(1.75, 0.45, 10.5, 0.2)}</g>` +
          `<g fill="${G}">${[0, 1, 2, 3].map(i => `<rect class="ds-hb" style="animation-delay:${f(-i * 0.6)}s" x="${92 + i * 24}" y="239" width="5" height="4"/>`).join('')}</g>` +
          '<rect x="195" y="220" width="22" height="17" fill="#132219" stroke="#2f5a3c" stroke-width="1.5"/>' +
          `<rect x="200" y="215" width="12" height="6" fill="${GOLD}"/>`,
      },
      // A chip standing on its pins.
      seatArt:
        `<g fill="#46584c">${[110, 128, 146, 164, 182].map(x => `<path d="M${x - 5} 388h10v9h-3v59h-4v-59h-3z"/>`).join('')}</g>` +
        `<rect x="100" y="350" width="102" height="40" rx="3" fill="${CHIP}" stroke="${CHIP_EDGE}" stroke-width="2"/>` +
        `<path d="M100 362a8 8 0 0 1 0 16" fill="none" stroke="${CHIP_EDGE}" stroke-width="2"/>` +
        '<circle cx="112" cy="382" r="2.5" fill="#1f3a29"/><path d="M128 368h44M134 377h30" stroke="#16291d" stroke-width="2.5"/>',
      // A board slab with gold fingers, on two capacitors.
      tableArt:
        `<g fill="#0c1912" stroke="${CHIP_EDGE}" stroke-width="2"><rect x="180" y="342" width="26" height="114" rx="6"/><rect x="430" y="342" width="26" height="114" rx="6"/></g>` +
        '<g fill="#2a4a36"><rect x="184" y="352" width="5" height="96"/><rect x="434" y="352" width="5" height="96"/></g>' +
        '<rect x="166" y="330" width="304" height="13" rx="2" fill="#0a2414" stroke="#1f4c2e" stroke-width="1.5"/>' +
        `<path d="M167 331H469" stroke="${G}" stroke-opacity=".35" stroke-width="1.5"/>` +
        `<path d="M176 337h36l4 3h50M280 337h60l4 3h60" fill="none" stroke="${G}" stroke-opacity=".3" stroke-width="1.2"/>` +
        `<path d="${Array.from({ length: 23 }, (_, i) => `M${236 + i * 8} 343h5v5h-5z`).join('')}" fill="${GOLD}" fill-opacity=".75"/>`,
    },
    style:
      // Ambient: glyphs fall, packets crawl, the core breathes, the ring turns, lights blink slowly.
      '.ds-fall{animation:ds-fall var(--d) linear infinite}' +
      '@keyframes ds-fall{0%{transform:translateY(-247px);opacity:0}6%{opacity:1}80%{opacity:1}100%{transform:translateY(293px);opacity:0}}' +
      '.st-run .ds-fall{animation-duration:calc(var(--d) * .5)}.st-error .ds-fall{animation-duration:calc(var(--d) * 2.4)}' +
      '.ds-pk{animation:ds-pk var(--s,8s) linear infinite}@keyframes ds-pk{to{stroke-dashoffset:-250}}' +
      '.st-thinking .ds-pk{--s:14s}.st-responding .ds-pk{--s:3s;animation-direction:reverse}.st-tool .ds-pk{--s:2.2s}' +
      '.st-read .ds-pk{--s:3.4s}.st-web .ds-pk{--s:2.6s}.st-run .ds-pk{--s:2s}.st-error .ds-pk{--s:10s}.st-done .ds-pk{--s:4s}' +
      '.st-run .ds-cab{--s:.9s}' +
      '.ds-up{animation:ds-pk 2.6s linear infinite}.st-run .ds-up{animation-duration:.8s}.st-done .ds-up{animation-duration:1.4s}' +
      '.ds-aura,.ds-beam{animation:ds-br 4.5s ease-in-out infinite alternate}@keyframes ds-br{from{opacity:.55}to{opacity:.85}}' +
      '.st-thinking .ds-aura{animation-duration:2.2s}' +
      '.st-run .ds-aura,.st-run .ds-beam{animation:ds-full 2.4s ease-in .2s both}@keyframes ds-full{from{opacity:.55}to{opacity:1}}' +
      '.st-done .ds-aura,.st-done .ds-beam{animation:ds-full .8s ease-out both}' +
      '.ds-core{animation:ds-core 2.8s ease-in-out infinite alternate}@keyframes ds-core{from{opacity:.5}to{opacity:1}}' +
      '.st-run .ds-core{animation-duration:.7s}' +
      '.ds-ring{transform-box:fill-box;transform-origin:center;animation:mv-spin 50s linear infinite}' +
      '.st-thinking .ds-ring{animation-duration:9s}.st-run .ds-ring{animation-duration:4s}' +
      '.ds-bk,.ds-hb{animation:ds-bk 2.8s ease-in-out infinite}@keyframes ds-bk{0%,100%{opacity:.3}50%{opacity:1}}' +
      '.st-error .ds-bk{animation-duration:1.1s}' +
      // Thinking and tools: the cores take turns.
      '.ds-cell{opacity:0}' +
      '.st-thinking .ds-cell{animation:ds-think 2.7s ease-in-out infinite;animation-delay:calc(var(--i) * .3s)}' +
      '.st-tool .ds-cell{animation:ds-think 1.2s ease-in-out infinite;animation-delay:calc(var(--i) * -.13s)}' +
      '@keyframes ds-think{0%,60%,100%{opacity:0}25%{opacity:.55}}' +
      // Read: a scan runs down each memory stick. Web: the port at the edge glows.
      '.ds-scan{opacity:0}.st-read .ds-scan{animation:ds-scan 1.8s ease-in-out infinite;animation-delay:calc(var(--i) * .3s)}' +
      '@keyframes ds-scan{0%{opacity:0;transform:translateY(0)}15%,80%{opacity:1}100%{opacity:0;transform:translateY(330px)}}' +
      '.ds-port{opacity:0}.st-web .ds-port{animation:ds-bk 1.4s ease-in-out infinite}' +
      // The terminal.
      '.ds-ln{transform-box:fill-box;transform-origin:0 50%;animation:ds-type 1.1s ease-in-out infinite alternate}' +
      '@keyframes ds-type{from{transform:scaleX(.3)}to{transform:scaleX(1)}}' +
      '.ds-tb{animation:ds-bk .9s ease-in-out infinite}' +
      // Run: every trace floods into the core, the cores light one by one, waves leave the die, the beam climbs.
      '.ds-fl,.ds-lit,.ds-lg,.ds-wave{opacity:0}' +
      '.st-run .ds-fl{animation:ds-pk .9s linear infinite,ds-in .5s ease-out .15s both}@keyframes ds-in{from{opacity:0}to{opacity:1}}' +
      '.st-run .ds-cell{animation:ds-on .3s ease-out both;animation-delay:calc(.3s + var(--i) * .3s)}@keyframes ds-on{from{opacity:0}to{opacity:.8}}' +
      '.ds-wave{transform-box:fill-box;transform-origin:center}' +
      '.st-run .ds-wave{animation:ds-wave 1.6s ease-out infinite;animation-delay:calc(.8s + var(--i) * .8s)}' +
      '@keyframes ds-wave{0%{opacity:0;transform:scale(.7)}12%{opacity:.45}100%{opacity:0;transform:scale(3)}}' +
      // Error: a corrupt packet runs down lane 2 into the chip; the chip glitches, the core goes red, the trace burns.
      '.ds-rp,.ds-burn,.ds-emb,.ds-glx,.ds-smk,.ds-spk,.ds-cred{opacity:0}.st-error .ds-k2{display:none}' +
      '.st-error .ds-rp{animation:ds-rp 1.3s cubic-bezier(.45,0,.85,.7) both,ds-rpo 1.4s linear both}' +
      '@keyframes ds-rp{from{stroke-dashoffset:29}to{stroke-dashoffset:-971}}@keyframes ds-rpo{0%,90%{opacity:1}100%{opacity:0}}' +
      '.st-error .ds-burn{animation:ds-in .2s ease-out 1.3s both}' +
      '.st-error .ds-emb{animation:ds-emb 2.6s ease-out 1.3s both}@keyframes ds-emb{0%{opacity:0}10%{opacity:1}45%{opacity:.45}65%{opacity:.7}100%{opacity:.35}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the glitch shows twice in 0.8 s, then never again in this state.
      '.st-error .ds-glx{animation:ds-glx 1.1s steps(1,end) 1.3s forwards}' +
      '@keyframes ds-glx{0%{opacity:.9;transform:translateX(-16px)}15%{opacity:.9;transform:translateX(12px)}30%{opacity:0}60%{opacity:.7;transform:translateX(7px)}70%,100%{opacity:0}}' +
      '.st-error .ds-jolt{animation:ds-jolt .5s steps(1,end) 1.3s forwards}' +
      '@keyframes ds-jolt{0%{transform:translate(-7px,2px)}25%{transform:translate(6px,-2px)}50%{transform:translate(-3px,1px)}75%,100%{transform:none}}' +
      '.st-error .ds-cred{animation:ds-in .4s ease-out 1.35s both}' +
      '.st-error .ds-traf,.st-error .ds-aura,.st-error .ds-beam{animation:ds-dim .6s ease-out 1.3s both}@keyframes ds-dim{to{opacity:.3}}' +
      '.ds-smk{transform-box:fill-box;transform-origin:center}' +
      '.st-error .ds-smk{animation:ds-smk 2.4s ease-out infinite;animation-delay:calc(1.4s + var(--i) * .8s)}' +
      '@keyframes ds-smk{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.55}100%{opacity:0;transform:translate(var(--dx),-110px) scale(2)}}' +
      '.st-error .ds-spk{animation:ds-spk .8s ease-out 1.3s forwards}' +
      '@keyframes ds-spk{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Done: green light races out of the core along every trace, every LED turns green, the core pulses.
      '.ds-lit{stroke-dasharray:1000 1000}.st-done .ds-lit{opacity:1;animation:ds-lit 1.4s cubic-bezier(.3,.6,.4,1) .2s both}' +
      '@keyframes ds-lit{from{stroke-dashoffset:-1000}to{stroke-dashoffset:0}}' +
      '.st-done .ds-lg{animation:ds-in .3s ease-out both;animation-delay:calc(.3s + var(--i) * .07s)}' +
      '.st-done .ds-cell{animation:ds-on .3s ease-out both;animation-delay:calc(var(--i) * .07s)}' +
      '.st-done .ds-wave{animation:ds-wave 2.4s ease-out infinite;animation-delay:calc(.25s + var(--i) * 1.2s)}',
    scenery:
      '<defs>' +
      '<linearGradient id="ds-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010503"/><stop offset=".6" stop-color="#030f08"/><stop offset="1" stop-color="#04120a"/></linearGradient>' +
      '<linearGradient id="ds-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020c06"/><stop offset="1" stop-color="#061a0d"/></linearGradient>' +
      `<linearGradient id="ds-sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G}" stop-opacity="0"/><stop offset="1" stop-color="${G}" stop-opacity=".06"/></linearGradient>` +
      `<linearGradient id="ds-gr" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="240"><stop offset="0" stop-color="${G}" stop-opacity="0"/><stop offset=".55" stop-color="${G}" stop-opacity=".4"/><stop offset=".9" stop-color="${G}" stop-opacity=".85"/><stop offset="1" stop-color="${G_HI}"/></linearGradient>` +
      `<linearGradient id="ds-pkg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset=".23" stop-color="${G}"/><stop offset=".29" stop-color="${G}" stop-opacity=".3"/><stop offset=".71" stop-color="${G}" stop-opacity=".3"/><stop offset=".77" stop-color="${G}"/></linearGradient>` +
      `<radialGradient id="ds-cg"><stop offset="0" stop-color="${G}" stop-opacity=".42"/><stop offset=".35" stop-color="${G}" stop-opacity=".14"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="ds-bm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${G}" stop-opacity=".34"/><stop offset=".55" stop-color="${G}" stop-opacity=".1"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="ds-pg"><stop offset="0" stop-color="${G}" stop-opacity=".3"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ds-sc"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ds-bg)"/>' +
      `<path d="${traces.join('')}" fill="none" stroke="#0a2414" stroke-width="2.5"/><path d="${tracePads.join('')}" fill="#0d2c18"/>` +
      `<path d="${parts.join('')}" fill="#051209" stroke="#0d2816" stroke-width="2"/><path d="${rims.join('')}" fill="none" stroke="#123520" stroke-width="2"/>` +
      // The floor.
      `<rect y="${SEAM}" width="1600" height="${1000 - SEAM}" fill="url(#ds-fl)"/>` +
      `<path d="${floor}" fill="none" stroke="#0b2a16" stroke-width="2"/><path d="${vias}" fill="#0f3a1e"/>` +
      `<rect y="596" width="1600" height="44" fill="url(#ds-sg)"/><path d="M0 ${SEAM}H1600" stroke="${G}" stroke-opacity=".16" stroke-width="2"/>` +
      // The core's glow and the column of light rising out of it.
      '<circle class="ds-aura" cx="230" cy="400" r="330" fill="url(#ds-cg)"/>' +
      '<g class="ds-beam"><rect x="176" y="-20" width="108" height="256" fill="url(#ds-bm)" opacity=".75"/><rect x="210" y="-20" width="40" height="256" fill="url(#ds-bm)"/>' +
      `<path d="M230 236V-20" stroke="${G_HI}" stroke-opacity=".5" stroke-width="3"/></g>` +
      `<path class="ds-up" d="M230 236V-20" stroke="${G}" stroke-width="7" stroke-dasharray="20 42 20 42 20 42 20 44"/>` +
      // The traces, their packets, the flood a command sends and the light that answers when it's done.
      `<path d="${BUS.join('')}" fill="none" stroke="${G_DIM}" stroke-width="4"/>` +
      `<path d="${[...UP, ...UNDER].join('')}" fill="none" stroke="${G_DIM}" stroke-width="3"/>` +
      `<path d="${[1200, 1270, 1340].map(x => `M${x - 5} ${SEAM - 3}h10v6h-10z`).join('')}" fill="#0f3a1e"/>` +
      `<g class="ds-traf" fill="none" stroke="url(#ds-pkg)">${traffic}</g>` +
      `<g class="ds-fl" fill="none" stroke="url(#ds-pkg)" stroke-width="5">${flood}</g>` +
      `<g class="ds-lit" fill="none" stroke="url(#ds-pkg)" stroke-width="3.5" stroke-opacity=".85">${lit}</g>` +
      // The corrupt packet and the trace it burns out.
      `<g fill="none" stroke="${RED}"><path class="ds-rp" d="${BUS[2]}" pathLength="1000" stroke-width="22" stroke-opacity=".32" stroke-dasharray="6 3 12 2 6 1100"/>` +
      `<path class="ds-rp" d="${BUS[2]}" pathLength="1000" stroke-width="8" stroke-dasharray="6 3 12 2 6 1100"/></g>` +
      `<g class="ds-burn"><ellipse cx="338" cy="168" rx="30" ry="46" fill="url(#ds-sc)"/><path d="${BURN}" fill="none" stroke="#1a0604" stroke-width="7"/></g>` +
      `<g class="ds-emb" fill="none"><path d="${BURN}" stroke="#ff5a2a" stroke-opacity=".3" stroke-width="12"/><path d="${BURN}" stroke="${AMBER}" stroke-width="2" stroke-dasharray="7 5"/></g>` +
      `<g fill="#4a5a50" fill-opacity=".7">${smoke}</g><g fill="${AMBER}">${sparks}</g>` +
      // The CPU, which jolts when the corrupt packet lands.
      `<g class="ds-jolt">${cpu()}</g>` +
      cpuLights +
      // The far right: the port the bus leaves through, the memory sticks.
      '<g class="mv-r">' +
      '<circle class="ds-port" cx="1566" cy="106" r="180" fill="url(#ds-pg)"/>' +
      `<path d="${[0, 1, 2, 3, 4].map(k => `M1542 ${66 + 16 * k}h8v8h-8z`).join('')}" fill="${GOLD}"/>` +
      '<rect x="1550" y="48" width="80" height="116" rx="4" fill="#060d08" stroke="#22402c" stroke-width="2"/>' +
      portLights +
      sticks +
      '</g>' +
      // The glyph rain falls in front of it all, clear of the die.
      `<g fill="none" stroke="url(#ds-gr)" stroke-width="4">${columns}</g>`,
    nook:
      // The socket Claude's cable plugs into, and two parts on the board under the desk.
      `<rect x="6" y="432" width="58" height="24" rx="2" fill="${CHIP}" stroke="${CHIP_EDGE}" stroke-width="2"/>` +
      `<rect x="23" y="426" width="14" height="8" fill="${GOLD}"/>` +
      nookLights +
      '<g fill="#071209" stroke="#1a3324"><rect x="238" y="446" width="24" height="10" rx="1"/><rect x="292" y="448" width="18" height="8" rx="1"/></g>' +
      `<g fill="${GOLD}" fill-opacity=".7"><rect x="238" y="446" width="5" height="10"/><rect x="257" y="446" width="5" height="10"/></g>`,
  }
}
