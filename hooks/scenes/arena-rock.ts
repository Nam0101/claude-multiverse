import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Arena Rock: Claude is the sound engineer at the mixing desk at the back of a stadium. A huge stage fills the left
// two thirds: a guitarist, a singer and a drummer in silhouette between speaker stacks, light beams sweeping slowly
// over a sea of raised arms and phone lights. Beats: pyro columns and a jumping crowd (run), a blown amp and the
// lights cut to dim red (error), confetti cannons (done), dancing meters and faders (tool), a camera crane (web),
// swaying phone lights (thinking). Nothing here flashes: beams sweep, flames ramp, the cut is a slow fade.
const MAG = '#ff3fa4'
const CYAN = '#3fd4ff'
const AMBER = '#ffb02e'
const VIOLET = '#9a5cff'
const FIG = '#030108'
const RIM = '#ff6fc0'

const BEAMS: readonly { x: number; y: number; c: string; a0: number; a1: number; d: number; w: number; o: number }[] = [
  { x: 110, y: 90, c: 'm', a0: -16, a1: 12, d: 11, w: 70, o: 0.9 },
  { x: 250, y: 168, c: 'a', a0: 10, a1: -14, d: 9, w: 52, o: 0.8 },
  { x: 300, y: 90, c: 'c', a0: -22, a1: 8, d: 13, w: 80, o: 0.85 },
  { x: 430, y: 168, c: 'v', a0: 14, a1: -10, d: 10, w: 56, o: 0.6 },
  { x: 500, y: 90, c: 'a', a0: -10, a1: 20, d: 14, w: 80, o: 0.5 },
  { x: 650, y: 168, c: 'c', a0: -14, a1: 16, d: 12, w: 60, o: 0.4 },
  { x: 720, y: 90, c: 'v', a0: 8, a1: -20, d: 15, w: 84, o: 0.4 },
  { x: 880, y: 168, c: 'm', a0: 18, a1: -12, d: 11, w: 60, o: 0.4 },
  { x: 960, y: 90, c: 'c', a0: -18, a1: 10, d: 13, w: 76, o: 0.4 },
  { x: 1260, y: 90, c: 'a', a0: -12, a1: 14, d: 12, w: 70, o: 0.3 },
  { x: 1480, y: 90, c: 'm', a0: 10, a1: -16, d: 14, w: 70, o: 0.34 },
]
const BEAM_COLOR: Record<string, string> = { m: MAG, c: CYAN, a: AMBER, v: VIOLET }

const ROWS = [
  { y: 654, s: 0.5, step: 48, fill: '#120a26', jump: 8, bob: 3.1 },
  { y: 708, s: 0.68, step: 56, fill: '#0c061c', jump: 11, bob: 2.7 },
  { y: 772, s: 0.9, step: 62, fill: '#0b0518', jump: 15, bob: 3.4 },
  { y: 858, s: 1.2, step: 74, fill: '#070312', jump: 20, bob: 2.9 },
  { y: 958, s: 1.6, step: 100, fill: '#03010a', jump: 26, bob: 3.6 },
]

const n = (value: number): string => String(Math.round(value))

/** One row of the crowd: heads and shoulders, raised arms, and two sets of arms holding phones that sway apart. */
function crowdRow(index: number): string {
  const row = ROWS[index]!
  const next = random(40 + index)
  const { y, s, step, fill } = row
  const xEnd = index > 2 ? 1150 : 1660
  const bodies: string[] = []
  const still: string[] = []
  const sets = [
    { arm: [] as string[], phone: [] as string[], halo: [] as string[] },
    { arm: [] as string[], phone: [] as string[], halo: [] as string[] },
  ]
  let x = -20 + next() * step * 0.5

  while (x < xEnd) {
    const px = x + (next() - 0.5) * step * 0.3
    const py = y + (next() - 0.5) * s * 12
    const r = 9 * s
    const w = 22 * s

    bodies.push(
      `M${n(px - r)} ${n(py)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0` +
        `M${n(px - w)} ${n(py + 70 * s)}V${n(py + 28 * s)}Q${n(px - w)} ${n(py + 11 * s)} ${n(px)} ${n(py + 11 * s)}T${n(px + w)} ${n(py + 28 * s)}V${n(py + 70 * s)}Z`,
    )

    const roll = next()

    if (roll < 0.6) {
      const side = next() < 0.5 ? -1 : 1
      const hx = px + side * (22 + next() * 16) * s
      const hy = py - (26 + next() * 22) * s
      const arm = `M${n(px + side * 16 * s)} ${n(py + 28 * s)}L${n(hx)} ${n(hy)}`
      const both = next() < 0.45 ? `M${n(px - side * 16 * s)} ${n(py + 28 * s)}L${n(px - side * (20 + next() * 14) * s)} ${n(py - (24 + next() * 22) * s)}` : ''

      if (roll < 0.18 && s > 0.45) {
        const set = sets[roll < 0.09 ? 0 : 1]!

        set.arm.push(arm)
        set.phone.push(`M${n(hx - 3.2 * s)} ${n(hy - 9 * s)}h${n(6.4 * s)}v${n(10 * s)}h${n(-6.4 * s)}Z`)
        set.halo.push(`M${n(hx - 15 * s)} ${n(hy - 4 * s)}a${n(15 * s)} ${n(15 * s)} 0 1 0 ${n(30 * s)} 0a${n(15 * s)} ${n(15 * s)} 0 1 0 ${n(-30 * s)} 0`)
        still.push(both)
      } else {
        still.push(arm + both)
      }
    }

    x += step * (0.8 + next() * 0.4)
  }

  const stroke = `fill="none" stroke="${fill}" stroke-width="${n(7 * s)}" stroke-linecap="round"`
  const phoneSet = (set: (typeof sets)[number], cls: string, color: string, delay: number) =>
    `<g class="ar-ph ${cls}" style="--sw:${n(7 * s + 3)}px;animation-delay:${delay}s">` +
    `<path d="${set.arm.join('')}" ${stroke}/><path d="${set.halo.join('')}" fill="${color}" fill-opacity=".16"/>` +
    `<path d="${set.phone.join('')}" fill="${color}" fill-opacity=".92"/></g>`

  return (
    `<g class="ar-row" style="--j:-${row.jump}px;--bd:${row.bob}s;animation-delay:${n(-index * 0.8)}s">` +
    `<path d="${bodies.join('')}" fill="${fill}"/><path d="${still.join('')}" ${stroke}/>` +
    phoneSet(sets[0]!, 'ar-pa', '#d6f4ff', -0.4) +
    phoneSet(sets[1]!, 'ar-pb', '#ffe3a8', -1.5) +
    '</g>'
  )
}

/** A speaker stack: cabinets with two cones each, on the stage floor. */
function stack(x: number, width: number): string {
  const cab = (i: number) => `M${x} ${420 + i * 58}h${width}v58h${-width}Z`
  const cones = [0, 1, 2]
    .map(i => {
      const cy = 449 + i * 58
      const r = width * 0.26

      return [0.27, 0.73]
        .map(k => `M${f(x + width * k - r)} ${cy}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`)
        .join('')
    })
    .join('')

  return (
    `<path d="${[0, 1, 2].map(cab).join('')}" fill="#0a0614" stroke="#33205a" stroke-width="2"/>` +
    `<path d="${cones}" fill="#150b26" stroke="${RIM}" stroke-opacity=".3" stroke-width="2"/>` +
    `<path d="${[0, 1, 2].map(i => `M${x + width * 0.27} ${449 + i * 58}h${f(width * 0.46)}`).join('')}" stroke="${RIM}" stroke-opacity=".12" stroke-width="2"/>`
  )
}

/** A hanging line array: a column of boxes on a rigging chain. */
function lineArray(x: number, top: number, count: number): string {
  const boxes = Array.from({ length: count }, (_, i) => {
    const w = 38 - i * 0.6
    const y = top + i * 38

    return `M${f(x - w / 2)} ${y}h${f(w)}l${f(-1.2)} 36h${f(-w + 2.4)}Z`
  }).join('')

  return (
    `<path d="M${x} -10V${top}" stroke="#1a1030" stroke-width="3"/>` +
    `<path d="${boxes}" fill="#0a0614" stroke="#33205a" stroke-width="1.6"/>` +
    `<path d="${Array.from({ length: count }, (_, i) => `M${x - 12} ${top + 18 + i * 38}h24`).join('')}" stroke="${RIM}" stroke-opacity=".2" stroke-width="2"/>`
  )
}

/** The hanging truss with its zigzag and lamp cans. */
function truss(x0: number, x1: number, y: number, lamps: readonly number[]): string {
  const zig = Array.from({ length: Math.ceil((x1 - x0) / 36) }, (_, i) => `${i % 2 === 0 ? 'L' : 'L'}${x0 + i * 36 + 18} ${y + (i % 2 === 0 ? 20 : 0)}`).join('')

  return (
    `<path d="M${x0} ${y}H${x1}M${x0} ${y + 20}H${x1}M${x0} ${y}${zig}" fill="none" stroke="#1c1236" stroke-width="2.4"/>` +
    `<path d="${lamps.map(l => `M${l - 9} ${y + 20}h18l-4 14h-10Z`).join('')}" fill="#0a0614" stroke="#33205a" stroke-width="1.5"/>`
  )
}

const person = (cx: number, cy: number): string => `<circle cx="${cx}" cy="${cy}" r="13"/>`

function band(): string {
  const body = `fill="${FIG}" stroke="${RIM}" stroke-opacity=".38" stroke-width="1.5" stroke-linejoin="round"`
  const limb = (extra: string) => `fill="none" stroke="${FIG}" stroke-linecap="round" stroke-linejoin="round" ${extra}`

  const guitarist =
    `<g transform="translate(220 592)" ${body}>` +
    '<path d="M-22 -100L-4 -100L-8 0L-30 0ZM8 -100L26 -100L42 0L18 0Z"/><path d="M-20 -168L20 -168L26 -98L-26 -98Z"/>' +
    '<g class="ar-head"><circle cx="2" cy="-186" r="13"/><path d="M-12 -192L-24 -212L-8 -202L-6 -222L4 -204L14 -216L14 -194Z"/></g>' +
    '<ellipse cx="14" cy="-104" rx="30" ry="20" transform="rotate(-24 14 -104)"/>' +
    '<path d="M30 -112L128 -170" stroke-width="8"/><path d="M124 -176L146 -190L150 -180L130 -166Z"/>' +
    `<path d="M18 -162L72 -150L112 -166" ${limb('stroke-width="11"')}/>` +
    `<g class="ar-strum"><path d="M16 -160L28 -118L12 -102" ${limb('stroke-width="11"')}/></g></g>`
  const singer =
    `<g transform="translate(345 592)" ${body}><g class="ar-sing">` +
    '<path d="M-18 -96L-2 -96L-4 0L-22 0ZM4 -96L20 -96L26 0L8 0Z"/><path d="M-18 -166L18 -166L22 -94L-22 -94Z"/>' +
    '<path d="M-13 -194Q-30 -150 -16 -136L-6 -170Z"/>' +
    `<g class="ar-head2">${person(0, -186)}</g>` +
    `<g class="ar-fist"><path d="M-14 -160L-40 -196L-46 -226" ${limb('stroke-width="10"')}/><circle cx="-47" cy="-232" r="7"/></g>` +
    `<path d="M14 -160L34 -178L32 -190" ${limb('stroke-width="10"')}/>` +
    `<path d="M46 0V-176M46 -12L30 0M46 -12L62 0" fill="none" stroke="${FIG}" stroke-width="3"/>` +
    '<rect x="36" y="-200" width="11" height="17" rx="5" transform="rotate(14 41 -190)"/></g></g>'
  const kit =
    `<g transform="translate(510 592)" ${body}>` +
    '<rect x="-104" y="-50" width="208" height="50"/>' +
    `<rect x="-104" y="-50" width="208" height="3" fill="${MAG}" fill-opacity=".55" stroke="none"/>` +
    '<path d="M-96 -50V-172M74 -50V-188M-130 -50V-134" fill="none" stroke="#150b26" stroke-width="3"/>' +
    '<g transform="translate(0 -50)"><circle cy="-34" r="36"/><circle cy="-34" r="14" fill="#150b26"/>' +
    '<circle cx="-42" cy="-84" r="20"/><circle cx="30" cy="-88" r="20"/><circle cx="88" cy="-46" r="25"/></g>' +
    '<path d="M-18 -122L18 -122L24 -56L-24 -56Z"/>' +
    `<circle cx="0" cy="-136" r="12"/><g class="ar-hit" style="transform-origin:-14px -118px"><path d="M-14 -118L-40 -98L-46 -94" ${limb('stroke-width="9"')}/><path d="M-46 -94L-60 -112" ${limb('stroke-width="3"')}/></g>` +
    `<g class="ar-hit ar-hit2" style="transform-origin:14px -118px"><path d="M14 -118L36 -98L42 -96" ${limb('stroke-width="9"')}/><path d="M42 -96L56 -114" ${limb('stroke-width="3"')}/></g>` +
    '<g class="ar-cym"><ellipse cx="-96" cy="-172" rx="34" ry="6"/></g><g class="ar-cym ar-cym2"><ellipse cx="74" cy="-188" rx="36" ry="6"/></g>' +
    '<g class="ar-cym"><ellipse cx="-130" cy="-134" rx="24" ry="5"/></g></g>'
  const amp =
    `<g class="ar-amp"><g ${body}><rect x="96" y="506" width="62" height="86"/><rect x="100" y="490" width="54" height="16"/></g>` +
    `<path d="M104 524H150M104 534H150M104 544H150M104 554H150M104 564H150M104 574H150" stroke="${RIM}" stroke-opacity=".2" stroke-width="2"/>` +
    `<g fill="${AMBER}" fill-opacity=".8"><circle cx="110" cy="498" r="2.2"/><circle cx="122" cy="498" r="2.2"/><circle cx="134" cy="498" r="2.2"/><circle cx="146" cy="498" r="2.2"/></g></g>`
  const wedges = [300, 430]
    .map(x => `<path d="M${x - 24} 592L${x + 24} 592L${x + 18} 576L${x - 12} 570Z" ${body}/>`)
    .join('')

  return amp + wedges + guitarist + singer + kit
}

/** The pyro columns along the stage front: soft gradient flames, each a few moments after the last. */
function pyro(): string {
  const xs = [60, 178, 290, 420, 570, 712, 850]

  return xs
    .map((x, i) => {
      const dim = x > 400 ? 0.55 : 1

      return (
        `<g style="opacity:${dim}"><circle class="ar-fg" style="animation-delay:${f(i * 0.42)}s" cx="${x}" cy="500" r="150" fill="url(#ar-fgl)"/>` +
        `<g transform="translate(${x} 598)"><path class="ar-fl" style="animation-delay:${f(i * 0.42)}s" d="M-22 0C-30 -60 -14 -110 -4 -170C0 -200 -2 -232 0 -262C4 -232 4 -200 8 -170C16 -110 30 -60 22 0Z" fill="url(#ar-flame)"/></g></g>`
      )
    })
    .join('')
}

/** Confetti: a burst out of each cannon, then sheets of it falling over the crowd. */
function confetti(): string {
  const next = random(91)
  const colors = [MAG, CYAN, AMBER, VIOLET, '#5dffb0', '#fff1d8']
  const piece = (cx: number, cy: number, spread: number, size: number) => {
    const x = cx + (next() - 0.5) * spread
    const y = cy + (next() - 0.5) * spread

    return `M${n(x)} ${n(y)}h${n(size * (0.8 + next()))}v${n(size * (0.6 + next() * 0.5))}h${n(-size)}Z`
  }
  const bursts = [
    { x: 96, y: 598, bx: 70 },
    { x: 640, y: 598, bx: -60 },
  ]
    .map(({ x, y, bx }, ci) =>
      colors
        .slice(0, 4)
        .map((color, k) => {
          const d = Array.from({ length: 9 }, () => piece(0, 0, 44, 5)).join('')

          return (
            `<g transform="translate(${x} ${y})"><path class="ar-bu" style="--bx:${bx + (k - 1.5) * 34}px;animation-delay:${f(ci * 0.18 + k * 0.07)}s" d="${d}" fill="${color}"/></g>`
          )
        })
        .join(''),
    )
    .join('')
  const sheets = Array.from({ length: 7 }, (_, i) => {
    const color = colors[i % colors.length]!
    const d = Array.from({ length: 10 }, () => piece(40 + next() * 1050, 120 + next() * 380, 0, 7)).join('')

    return `<g class="ar-cf" style="--fy:${n(480 + next() * 160)}px;animation-delay:${f(0.7 + i * 0.3)}s"><g class="ar-cs" style="animation-delay:${f(-next() * 2)}s"><path d="${d}" fill="${color}"/></g></g>`
  }).join('')
  const cannon = (x: number, tilt: number) =>
    `<g transform="translate(${x} 598) rotate(${tilt})"><path d="M-12 0L-8 -46H8L12 0Z" fill="${FIG}" stroke="${RIM}" stroke-opacity=".4" stroke-width="1.5"/><rect x="-10" y="-52" width="20" height="8" rx="2" fill="${AMBER}" fill-opacity=".6"/></g>`

  return cannon(96, 24) + cannon(640, -24) + bursts + sheets
}

const BARS = Array.from({ length: 22 }, (_, i) => i)

function crane(): string {
  return (
    '<g class="ar-crane"><g transform="translate(120 985)">' +
    `<path d="M-40 20L0 -30L40 20M-60 20H60" fill="none" stroke="${FIG}" stroke-width="7"/>` +
    '<g transform="rotate(-31)"><g class="ar-boom">' +
    `<g fill="${FIG}" stroke="${RIM}" stroke-opacity=".4" stroke-width="1.5"><path d="M-130 -7H860V7H-130Z"/><rect x="-176" y="-20" width="54" height="40" rx="3"/>` +
    '<path d="M850 0V44"/><rect x="820" y="42" width="74" height="38" rx="5"/><rect x="892" y="50" width="18" height="22" rx="3"/></g>' +
    `<path d="M-60 -7L200 -52L600 -7M200 -52L860 0" fill="none" stroke="${FIG}" stroke-width="3"/>` +
    `<circle cx="911" cy="61" r="4" fill="${CYAN}" fill-opacity=".9"/><circle cx="831" cy="50" r="3" fill="#ff7a7a" fill-opacity=".8"/>` +
    '</g></g></g></g>'
  )
}

/** The desk's own gear: a laptop and a small mixer with meters and faders. */
function device(light: string, activity: Activity): string {
  const meter = (x: number, k: number) =>
    [0, 1, 2, 3, 4, 5]
      .map(i => {
        const color = i < 3 ? '#4cff9a' : i < 5 ? '#ffc93c' : '#ff7a8a'

        return `<rect class="ar-vu" style="--d:${f(1.6 + ((i + k) % 4) * 0.45)}s;animation-delay:${f(-i * 0.37 - k)}s" x="${x + i * 6}" y="268" width="4" height="14" fill="${color}"/>`
      })
      .join('')
  const faders = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const x = 387 + i * 14
      const travel = (i % 2 === 0 ? 1 : -1) * (7 + (i % 3) * 2)

      return (
        `<rect x="${x}" y="298" width="3" height="24" rx="1.5" fill="#05030c"/>` +
        `<rect class="ar-fd" style="--t:${travel}px;--d:${f(5 + i * 0.9)}s;animation-delay:${f(-i * 1.1)}s" x="${x - 3}" y="307" width="9" height="5" rx="1.5" fill="${i % 2 ? CYAN : MAG}"/>` +
        `<circle cx="${x + 1.5}" cy="291" r="2.6" fill="${i % 3 === 0 ? AMBER : '#8a78b8'}"/>`
      )
    })
    .join('')
  const lit = activity === 'idle' ? '.55' : '.8'

  return (
    '<path d="M240 330L346 330L346 322L246 322Z" fill="#241a38"/>' +
    `<g fill="${light}" fill-opacity=".5">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${252 + i * 13}" y="324" width="8" height="3"/>`).join('')}</g>` +
    '<path d="M334 325L356 236L368 238L346 327Z" fill="#241a38"/>' +
    `<path d="M338 322L356 241L363 243L344 324Z" fill="${light}"/><path d="M338 322L356 241L340 246L322 322Z" fill="${light}" fill-opacity=".16"/>` +
    '<rect x="376" y="284" width="96" height="46" rx="4" fill="#1a1230" stroke="#3b2a62" stroke-width="2"/>' +
    '<rect x="383" y="262" width="82" height="24" rx="3" fill="#120b24" stroke="#3b2a62" stroke-width="2"/>' +
    '<rect x="386" y="265" width="36" height="18" fill="#05030c"/><rect x="426" y="265" width="36" height="18" fill="#05030c"/>' +
    `<g fill-opacity="${lit}">${meter(388, 0)}${meter(428, 2)}</g>` +
    faders +
    `<rect x="376" y="326" width="96" height="3" fill="${MAG}" fill-opacity=".5"/>`
  )
}

export function arenaRockWorld(): World {
  const next = random(5)
  const beams = BEAMS.map(
    b =>
      `<g transform="translate(${b.x} ${b.y})"><path class="ar-bm" style="--a0:${b.a0}deg;--a1:${b.a1}deg;--d:${b.d}s;animation-delay:-${Math.round(b.d * 0.37)}s;opacity:${b.o}" ` +
      `d="M-5 0L5 0L${b.w} 760L${-b.w} 760Z" fill="url(#ar-bm-${b.c})"/></g>`,
  ).join('')
  const lamps = BEAMS.map(b => `<circle cx="${b.x}" cy="${b.y + 30}" r="5" fill="${BEAM_COLOR[b.c]}" fill-opacity=".85"/><circle cx="${b.x}" cy="${b.y + 30}" r="20" fill="url(#ar-lg-${b.c})"/>`).join('')
  const bars = BARS.map(i => {
    const s0 = 0.22 + next() * 0.3
    const s1 = 0.5 + next() * 0.5

    return `<rect class="ar-eq" style="--s0:${f(s0)};--s1:${f(s1)};--d:${f(2.2 + next() * 2.4)}s;animation-delay:${f(-next() * 3)}s" x="${150 + i * 34}" y="306" width="26" height="260" fill="url(#ar-eq)"/>`
  }).join('')
  const stars = Array.from({ length: 16 }, () => `<circle cx="${n(next() * 1600)}" cy="${n(next() * 120)}" r="1.2" fill="#c9b8ff" fill-opacity=".35"/>`).join('')
  const rings = (x: number, y: number) =>
    [0, 0.47, 0.94].map(d => `<g transform="translate(${x} ${y})"><circle class="ar-fb" style="animation-delay:${d}s" r="14" fill="none" stroke="#ffd0ec" stroke-width="2.6"/></g>`).join('')
  const puffs = [0, 1, 2, 3, 4]
    .map(i => `<circle class="ar-sm" style="--dx:${f(-22 + i * 14)}px;animation-delay:${f(i * 0.22)}s" cx="${f(126 + (i % 3) * 7)}" cy="486" r="${f(14 + (i % 3) * 5)}" fill="url(#ar-smoke)"/>`)
    .join('')
  const rack = [352, 372, 392, 412].map(y => `<rect x="304" y="${y}" width="162" height="14" fill="#140c26" stroke="#2c1d4d" stroke-width="1.5"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'mug',
      thought: 'orbs',
      ink: '#05020c',
      furniture: '#171026',
      metal: '#2a2040',
      paper: '#e8dcff',
      light: { idle: '#8a63d8', work: '#ff5fb8', bright: '#ffd36a' },
      headTop: 222,
      glowAt: [334, 280],
      device,
      wear: {
        front:
          // Big over-ear headphones: a headband over the top and a cup on each side, clear of the eyes.
          `<path d="M62 262C58 196 242 196 238 262" fill="none" stroke="#150e26" stroke-width="10"/>` +
          `<path d="M66 260C64 206 236 206 234 260" fill="none" stroke="${MAG}" stroke-opacity=".55" stroke-width="2"/>` +
          '<rect x="46" y="254" width="30" height="56" rx="10" fill="#150e26" stroke="#3b2a62" stroke-width="2"/>' +
          `<rect x="52" y="266" width="18" height="32" rx="6" fill="${MAG}" fill-opacity=".45"/>` +
          '<rect x="224" y="254" width="30" height="56" rx="10" fill="#150e26" stroke="#3b2a62" stroke-width="2"/>' +
          `<rect x="230" y="266" width="18" height="32" rx="6" fill="${MAG}" fill-opacity=".45"/>`,
      },
      seatArt:
        '<rect x="106" y="352" width="90" height="98" rx="4" fill="#120c20" stroke="#33205a" stroke-width="2"/>' +
        `<rect x="104" y="346" width="94" height="8" rx="3" fill="#2a1e44"/><path d="M106 380H196M106 424H196" stroke="${RIM}" stroke-opacity=".2" stroke-width="2"/>` +
        '<g fill="#33205a"><rect x="104" y="352" width="10" height="10"/><rect x="188" y="352" width="10" height="10"/><rect x="104" y="440" width="10" height="10"/><rect x="188" y="440" width="10" height="10"/></g>' +
        '<g fill="#05030c"><circle cx="118" cy="454" r="6"/><circle cx="184" cy="454" r="6"/></g>',
      tableArt:
        '<rect x="166" y="330" width="304" height="14" rx="2" fill="#171026" stroke="#33205a" stroke-width="1.6"/>' +
        `<rect x="166" y="330" width="304" height="2" fill="${MAG}" fill-opacity=".4"/><rect x="178" y="344" width="12" height="112" fill="#171026"/>` +
        '<rect x="296" y="344" width="176" height="112" rx="3" fill="#0b0716" stroke="#33205a" stroke-width="2"/>' +
        rack +
        '<path d="M310 438H462M310 444H462" stroke="#2c1d4d" stroke-width="2"/>' +
        `<g fill="#4cff9a" fill-opacity=".8"><circle cx="316" cy="359" r="2.4"/><circle cx="316" cy="379" r="2.4"/></g><g fill="${AMBER}" fill-opacity=".85"><circle cx="328" cy="359" r="2.4"/><circle cx="328" cy="399" r="2.4"/></g>` +
        `<g fill="${MAG}" fill-opacity=".8"><circle cx="316" cy="419" r="2.4"/></g>`,
    },
    style:
      // The sweep of the beams: slow, never faster than a few degrees a second.
      '.ar-bm{animation:ar-sw var(--d,12s) ease-in-out infinite alternate}@keyframes ar-sw{from{transform:rotate(var(--a0))}to{transform:rotate(var(--a1))}}' +
      '.st-error .ar-lights{animation:ar-cutl 4.2s ease-in-out both}@keyframes ar-cutl{0%{opacity:1}24%,68%{opacity:.08}100%{opacity:1}}' +
      '.ar-cut,.ar-red{opacity:0}.st-error .ar-cut{animation:ar-cutk 4.2s ease-in-out both}.st-error .ar-red{animation:ar-redk 4.2s ease-in-out both}' +
      '@keyframes ar-cutk{0%{opacity:0}24%,68%{opacity:.62}100%{opacity:0}}@keyframes ar-redk{0%{opacity:0}24%,68%{opacity:.34}100%{opacity:0}}' +
      '.ar-eq{transform-box:fill-box;transform-origin:50% 100%;animation:ar-eqk var(--d,3s) ease-in-out infinite alternate}' +
      '@keyframes ar-eqk{from{transform:scaleY(var(--s0))}to{transform:scaleY(var(--s1))}}' +
      '.st-tool .ar-eq,.st-run .ar-eq{animation-duration:calc(var(--d) * .32)}' +
      '.ar-spot{opacity:.1}.st-read .ar-spot{animation:ar-spot 1.4s ease-out both}@keyframes ar-spot{to{opacity:.5}}' +
      // The crowd breathes, and jumps when a command runs and when it is done.
      '.ar-row{animation:ar-bob var(--bd,3s) ease-in-out infinite alternate}@keyframes ar-bob{to{transform:translateY(3px)}}' +
      '.st-run .ar-row{animation:ar-jump .68s ease-in-out infinite}.st-done .ar-row{animation:ar-jump .9s ease-in-out 4}' +
      '@keyframes ar-jump{0%,100%{transform:translateY(0)}42%{transform:translateY(var(--j))}}' +
      '.ar-ph{animation:ar-tw 3.2s ease-in-out infinite alternate}@keyframes ar-tw{from{opacity:.7}to{opacity:1}}' +
      '.ar-pb{animation-duration:4.1s}' +
      '.st-thinking .ar-ph{animation:ar-swaying 1.9s ease-in-out infinite alternate}.st-thinking .ar-pb{animation-duration:2.4s}' +
      '@keyframes ar-swaying{from{transform:translateX(calc(var(--sw) * -1))}to{transform:translateX(var(--sw))}}' +
      // The band.
      '.ar-strum{transform-origin:16px -160px;animation:ar-str .7s ease-in-out infinite alternate}@keyframes ar-str{from{transform:rotate(-9deg)}to{transform:rotate(13deg)}}' +
      '.st-run .ar-strum,.st-responding .ar-strum{animation-duration:.34s}' +
      '.ar-head,.ar-head2{transform-origin:0 -172px;animation:ar-nod 1.6s ease-in-out infinite alternate}@keyframes ar-nod{from{transform:rotate(-3deg)}to{transform:rotate(5deg)}}' +
      '.st-run .ar-head{animation-duration:.5s;animation-name:ar-bang}@keyframes ar-bang{from{transform:rotate(-8deg)}to{transform:rotate(16deg)}}' +
      '.ar-sing{animation:ar-swy 2.4s ease-in-out infinite alternate}@keyframes ar-swy{from{transform:rotate(-2deg)}to{transform:rotate(2.4deg)}}' +
      '.st-run .ar-sing{animation:ar-hop .68s ease-in-out infinite}@keyframes ar-hop{0%,100%{transform:translateY(0)}42%{transform:translateY(-16px)}}' +
      '.ar-fist{transform-origin:-14px -160px;animation:ar-fst 1.3s ease-in-out infinite alternate}@keyframes ar-fst{from{transform:rotate(-6deg)}to{transform:rotate(9deg)}}' +
      '.ar-hit{animation:ar-hitk .95s ease-in-out infinite alternate}.ar-hit2{animation-duration:.8s;animation-delay:-.3s}' +
      '@keyframes ar-hitk{from{transform:rotate(-11deg)}to{transform:rotate(9deg)}}' +
      '.st-run .ar-hit,.st-responding .ar-hit{animation-duration:.4s}' +
      '.ar-cym{transform-box:fill-box;transform-origin:center;animation:ar-cymk 1.1s ease-in-out infinite alternate}.ar-cym2{animation-delay:-.5s}' +
      '@keyframes ar-cymk{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      // Pyro: each column ramps up, burns and fades, a moment after the last. Soft light, never a strobe.
      '.ar-fl,.ar-fg{opacity:0}' +
      '.st-run .ar-fl{transform-box:fill-box;transform-origin:50% 100%;animation:ar-fire 3.8s ease-out infinite}' +
      '.st-run .ar-fg{animation:ar-fglow 3.8s ease-out infinite}' +
      '@keyframes ar-fire{0%{opacity:0;transform:scaleY(.05)}9%{opacity:.95;transform:scale(.8,.7)}18%{opacity:.95;transform:scale(1,1)}44%{opacity:.8;transform:scale(.92,.92)}68%{opacity:0;transform:scale(.7,.6)}100%{opacity:0}}' +
      '@keyframes ar-fglow{0%{opacity:0}14%{opacity:.5}50%{opacity:.3}72%,100%{opacity:0}}' +
      // The amp blows: smoke, and rings of feedback.
      '.ar-sm{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ar-sm{animation:ar-smk 3.4s ease-out both}' +
      '@keyframes ar-smk{0%{opacity:0;transform:translate(0,0) scale(.4)}14%{opacity:.75}100%{opacity:0;transform:translate(var(--dx),-180px) scale(2.8)}}' +
      '.st-error .ar-amp{animation:ar-amp .16s ease-in-out 8 alternate}@keyframes ar-amp{to{transform:translateX(2px)}}' +
      '.ar-fb{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ar-fb{animation:ar-fbk 1.5s ease-out infinite}' +
      '@keyframes ar-fbk{0%{opacity:0;transform:scale(.3)}12%{opacity:.85}100%{opacity:0;transform:scale(4.6)}}' +
      // Confetti.
      '.ar-bu,.ar-cf{opacity:0}' +
      '.st-done .ar-bu{animation:ar-burst 2.6s ease-out both}' +
      '@keyframes ar-burst{0%{opacity:0;transform:translate(0,0) scale(.2)}8%{opacity:1}50%{opacity:1;transform:translate(var(--bx),-330px) scale(3.4)}100%{opacity:0;transform:translate(var(--bx),-150px) scale(4.2)}}' +
      '.st-done .ar-cf{animation:ar-fall 6.6s linear both}' +
      '@keyframes ar-fall{0%{opacity:0;transform:translateY(-40px)}8%{opacity:.95}88%{opacity:.9}100%{opacity:0;transform:translateY(var(--fy))}}' +
      '.ar-cs{animation:ar-cws 1.9s ease-in-out infinite alternate}@keyframes ar-cws{from{transform:translateX(-18px)}to{transform:translateX(18px)}}' +
      // Meters and faders.
      '.ar-vu{transform-box:fill-box;transform-origin:50% 100%;animation:ar-vuk var(--d,2s) ease-in-out infinite alternate}' +
      '@keyframes ar-vuk{from{transform:scaleY(.25)}to{transform:scaleY(1)}}' +
      '.st-tool .ar-vu,.st-run .ar-vu{animation-duration:calc(var(--d) * .3)}' +
      '.ar-fd{animation:ar-fdk var(--d,6s) ease-in-out infinite alternate}@keyframes ar-fdk{to{transform:translateY(var(--t))}}' +
      '.st-tool .ar-fd{animation-duration:calc(var(--d) * .12)}' +
      // The camera crane swings over the crowd.
      '.ar-crane{opacity:0}.st-web .ar-crane{animation:ar-cin 1s ease-out both}@keyframes ar-cin{to{opacity:.96}}' +
      '.st-web .ar-boom{animation:ar-bm 4.6s ease-in-out infinite alternate}@keyframes ar-bm{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}',
    scenery:
      '<defs><linearGradient id="ar-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03010a"/><stop offset=".55" stop-color="#0c0520"/><stop offset="1" stop-color="#1c0b36"/></linearGradient>' +
      '<radialGradient id="ar-hz"><stop offset="0" stop-color="#ff3fa4" stop-opacity=".34"/><stop offset=".5" stop-color="#9a5cff" stop-opacity=".12"/><stop offset="1" stop-color="#9a5cff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ar-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0c3a"/><stop offset="1" stop-color="#3a1260"/></linearGradient>' +
      '<linearGradient id="ar-eq" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3fa4" stop-opacity=".62"/><stop offset=".6" stop-color="#9a5cff" stop-opacity=".45"/><stop offset="1" stop-color="#3fd4ff" stop-opacity=".3"/></linearGradient>' +
      ['m', 'c', 'a', 'v']
        .map(
          k =>
            `<linearGradient id="ar-bm-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BEAM_COLOR[k]}" stop-opacity=".5"/><stop offset=".7" stop-color="${BEAM_COLOR[k]}" stop-opacity=".12"/><stop offset="1" stop-color="${BEAM_COLOR[k]}" stop-opacity="0"/></linearGradient>` +
            `<radialGradient id="ar-lg-${k}"><stop offset="0" stop-color="${BEAM_COLOR[k]}" stop-opacity=".6"/><stop offset="1" stop-color="${BEAM_COLOR[k]}" stop-opacity="0"/></radialGradient>`,
        )
        .join('') +
      '<linearGradient id="ar-spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3fa4" stop-opacity=".26"/><stop offset=".45" stop-color="#7a35d0" stop-opacity=".1"/><stop offset="1" stop-color="#2a0f50" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ar-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0b0" stop-opacity=".98"/><stop offset=".3" stop-color="#ffb02e" stop-opacity=".9"/><stop offset=".7" stop-color="#ff6a1c" stop-opacity=".5"/><stop offset="1" stop-color="#ff4a2a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ar-fgl"><stop offset="0" stop-color="#ffb04a" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ar-smoke"><stop offset="0" stop-color="#b9a8d8" stop-opacity=".7"/><stop offset="1" stop-color="#6a5a8a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ar-redw" cx=".4" cy=".6" r=".8"><stop offset="0" stop-color="#8a1230"/><stop offset="1" stop-color="#3a0618" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ar-vl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05030c" stop-opacity="0"/><stop offset=".16" stop-color="#05030c" stop-opacity=".78"/><stop offset=".88" stop-color="#05030c" stop-opacity=".78"/><stop offset="1" stop-color="#05030c" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ar-spotg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff0d8" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#ar-sky)"/>' +
      stars +
      '<ellipse cx="520" cy="420" rx="760" ry="420" fill="url(#ar-hz)"/>' +
      // The LED wall behind the band, with a spectrum along its foot.
      '<rect x="146" y="196" width="766" height="372" rx="6" fill="url(#ar-wall)" fill-opacity=".8" stroke="#3a2468" stroke-width="3"/>' +
      `<circle cx="290" cy="290" r="64" fill="none" stroke="${MAG}" stroke-opacity=".4" stroke-width="5"/><circle cx="290" cy="290" r="36" fill="none" stroke="${CYAN}" stroke-opacity=".3" stroke-width="3"/>` +
      `<path d="M290 214V196M290 366V386M214 290H196M366 290H386M236 236L222 222M344 236L358 222" stroke="${MAG}" stroke-opacity=".35" stroke-width="4"/>` +
      bars +
      '<rect x="146" y="196" width="766" height="372" fill="none"/>' +
      // The trusses, the line arrays and the lamps.
      truss(-20, 1700, 64, BEAMS.filter(b => b.y === 90).map(b => b.x)) +
      truss(70, 990, 142, BEAMS.filter(b => b.y === 168).map(b => b.x)) +
      lineArray(86, 60, 10) +
      lineArray(952, 60, 10) +
      `<g class="ar-lights">${beams}${lamps}</g>` +
      '<path class="ar-spot" d="M335 150L355 150L430 592L262 592Z" fill="url(#ar-spotg)"/>' +
      // The stage.
      '<path d="M-20 566H1050L1074 600H-20Z" fill="#150a2a"/>' +
      `<rect x="-20" y="598" width="1100" height="5" fill="${MAG}" fill-opacity=".55"/><rect x="-20" y="603" width="1100" height="16" fill="#0a0518"/>` +
      stack(-18, 82) +
      stack(960, 82) +
      band() +
      pyro() +
      `<g class="ar-fx">${rings(130, 530)}${rings(300, 586)}${rings(430, 586)}${puffs}</g>` +
      '<rect x="400" y="0" width="880" height="620" fill="url(#ar-vl)"/>' +
      '<rect class="ar-cut" x="-20" y="0" width="1100" height="620" fill="#080208"/>' +
      '<rect class="ar-red" x="-20" y="0" width="1100" height="620" fill="url(#ar-redw)"/>' +
      // The crowd, with the stage light spilling over their heads.
      '<rect x="-20" y="610" width="1700" height="330" fill="url(#ar-spill)"/>' +
      '<rect x="400" y="610" width="880" height="330" fill="url(#ar-vl)" fill-opacity=".7"/>' +
      ROWS.map((_, i) => crowdRow(i)).join('') +
      confetti() +
      crane() +
      // The far right: a line array and a truss with a lamp or two.
      '<g class="mv-r">' +
      lineArray(1420, 60, 8) +
      `<circle cx="1400" cy="96" r="4" fill="${CYAN}" fill-opacity=".7"/>` +
      '</g>',
    nook:
      // The platform, its barrier and a delay tower behind the desk.
      '<defs><radialGradient id="ar-lamp"><stop offset="0" stop-color="#ffb02e" stop-opacity=".3"/><stop offset="1" stop-color="#ffb02e" stop-opacity="0"/></radialGradient></defs>' +
      lineArray(392, -300, 7) +
      `<circle cx="392" cy="-312" r="60" fill="url(#ar-lamp)"/>` +
      '<g fill="#0a0614" stroke="#2a1c4a" stroke-width="2"><rect x="-40" y="436" width="470" height="30"/><rect x="-30" y="368" width="64" height="68" rx="3"/><rect x="-24" y="318" width="52" height="50" rx="3"/></g>' +
      `<rect x="-40" y="436" width="470" height="2" fill="${MAG}" fill-opacity=".4"/>` +
      '<g fill="#0e0820"><rect x="-4" y="330" width="6" height="106"/><rect x="60" y="330" width="6" height="106"/><rect x="124" y="330" width="6" height="106"/><rect x="-40" y="332" width="170" height="5"/></g>' +
      '<g fill="#33205a"><rect x="-26" y="376" width="48" height="4"/><rect x="-26" y="398" width="48" height="4"/></g>',
    front:
      '<path d="M436 336q14 56 -22 88q-40 28 -92 20" fill="none" stroke="#05030c" stroke-width="4" stroke-linecap="round"/>' +
      `<path d="M452 336q18 70 -30 100" fill="none" stroke="#05030c" stroke-width="3" stroke-linecap="round"/><rect x="168" y="341" width="130" height="3" fill="${AMBER}" fill-opacity=".35"/>`,
  }
}
