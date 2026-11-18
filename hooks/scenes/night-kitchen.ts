import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Night Kitchen: a Paris restaurant kitchen in the dinner rush. Copper pans swing on a rack under the ceiling, a range
// roars on the left under an arched window over zinc rooftops and a far iron tower lit gold, order tickets hang over
// the pass at the right, under its heat lamps. Claude, in a tall toque, codes on a tablet on a recipe stand at the
// prep table. A command tosses a pan into a flambé; an error boils the stockpot over; done lifts the cloche.
const COPPER = '#a8582e'
const COPPER_HI = '#e8955a'
const STEEL = '#2e2a28'
const STEEL_EDGE = '#4e4844'
const PAPER = '#e8dccb'
const WOOD = '#3a2a1c'
const WOOD_EDGE = '#5a4230'
const DARK = '#19110d'
const FOOD = ['#c8402c', '#e0b040', '#5a8a3a', '#7a3a6a']

/** A flame tongue standing on its base at (0, 0). */
function tongue(w: number, h: number): string {
  return (
    `M${f(-w / 2)} 0C${f(-w / 2)} ${f(-h * 0.45)} ${f(-w * 0.08)} ${f(-h * 0.62)} 0 ${f(-h)}` +
    `C${f(w * 0.08)} ${f(-h * 0.62)} ${f(w / 2)} ${f(-h * 0.45)} ${f(w / 2)} 0Z`
  )
}

/** One gas ring's flames under a pot, the outer tongues leaning out and licking up its sides. */
function burner(cx: number, span: number, count: number, seed: number, extra: string): string {
  const next = random(seed)

  return Array.from({ length: count }, (_, i) => {
    const x = cx - span / 2 + (span * i) / (count - 1)
    const edge = i === 0 || i === count - 1
    const lean = edge ? (i === 0 ? -16 : 16) : 0
    const h = (edge ? 24 : 12) + next() * 10

    return (
      `<g transform="translate(${f(x)} 683) rotate(${lean})"><path class="nk-fl${extra}" ` +
      `style="animation-duration:${(0.42 + next() * 0.3).toFixed(2)}s;animation-delay:${(-next()).toFixed(2)}s" ` +
      `d="${tongue(9 + next() * 5, h)}" fill="url(#nk-flm)"/></g>`
    )
  }).join('')
}

/** A row of Paris roofs inside the window: mansards, chimney stacks with their pots, and lit windows when `lit`. */
function skyline(seed: number, top: number, spread: number, fill: string, edge: string, lit: boolean): string {
  const next = random(seed)
  const stacks: string[] = []
  const lights: string[] = []
  let x = 36
  let d = 'M36 600'
  let n = 0

  while (x < 392) {
    const w = 46 + next() * 36
    const y = top + (next() - 0.5) * spread
    const r = 12 + next() * 7

    d += `L${f(x)} ${f(y)}L${f(x + 6)} ${f(y - r)}L${f(x + w - 6)} ${f(y - r)}L${f(x + w)} ${f(y)}`

    if (next() > 0.3) {
      const cx = x + 8 + next() * (w - 30)
      const cy = y - r - 8 - next() * 9

      stacks.push(`M${f(cx)} ${f(y - r + 1)}V${f(cy)}H${f(cx + 14)}V${f(y - r + 1)}ZM${f(cx + 2)} ${f(cy)}v-5h4v5ZM${f(cx + 8)} ${f(cy)}v-6h4v6Z`)
    }

    if (lit) {
      for (let k = x + 10; k < x + w - 10; k += 15) {
        const roll = next()
        const wy = roll < 0.5 ? y - r + 4 : y + 8 + Math.floor(next() * 2) * 16

        if (roll < 0.32 || roll > 0.68) {
          lights.push(`<rect class="${n % 3 === 2 ? 'nk-dx' : 'nk-dw'}" style="--i:${n}" x="${f(k)}" y="${f(wy)}" width="6" height="9"/>`)
          n += 1
        }
      }
    }

    x += w
  }

  return (
    `<g fill="${fill}" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round"><path d="${d}L${f(x)} 600Z"/><path d="${stacks.join('')}"/></g>` +
    (lit ? `<g fill="#f2aa58">${lights.join('')}</g>` : '')
  )
}

// A far lattice tower, lit gold for the night: four splayed legs on an arch, two platforms, a mast.
const TOWER =
  'M289.5 262H294.5L297 300H299L303 398H307V404H303.5L314 456H318V462H314.5L344 548H324Q292 494 260 548H240L269.5 462H266V456H270L280.5 404H277V398H281L285 300H287Z'
const TOWER_LIGHTS: readonly (readonly [number, number])[] = [
  [292, 252], [290, 300], [295, 346], [286, 392], [298, 396], [282, 428], [302, 432],
  [272, 470], [312, 470], [258, 512], [326, 512], [250, 536], [334, 536],
]

/** The arched window over the rooftops: sky, moon, the tower and its beacon, two rows of roofs, the frame. */
function windowView(next: () => number): string {
  const stars = Array.from({ length: 7 }, (_, i) =>
    `<circle class="nk-tw" style="animation-delay:${f(-i * 0.7)}s" cx="${f(84 + next() * 272)}" cy="${f(110 + next() * 190)}" r="${f(0.8 + next())}" fill="#e8e0f0"/>`,
  ).join('')
  const sparkle = TOWER_LIGHTS.map(
    ([x, y], i) =>
      `<path class="nk-tsp" style="--d:${f((i * 7) % 13 / 10)}s" d="M${x} ${y - 7}L${x + 1.8} ${y - 1.8}L${x + 7} ${y}L${x + 1.8} ${y + 1.8}L${x} ${y + 7}L${x - 1.8} ${y + 1.8}L${x - 7} ${y}L${x - 1.8} ${y - 1.8}Z" fill="#fff4d8"/>`,
  ).join('')
  const rings = [0, 0.5, 1].map(d => `<circle class="nk-sig" style="animation-delay:${d}s" r="14" fill="none" stroke="#ffd8a0" stroke-width="1.6"/>`).join('')

  return (
    '<g clip-path="url(#nk-wc)">' +
    '<rect x="60" y="86" width="320" height="480" fill="url(#nk-skg)"/>' +
    '<circle cx="128" cy="190" r="92" fill="url(#nk-mhg)"/><circle cx="128" cy="190" r="28" fill="#efe4cc" fill-opacity=".72"/>' +
    '<circle cx="119" cy="183" r="5" fill="#cfc2a8" fill-opacity=".5"/><circle cx="136" cy="200" r="3.5" fill="#cfc2a8" fill-opacity=".45"/>' +
    stars +
    '<ellipse class="nk-tg" cx="292" cy="410" rx="70" ry="180" fill="url(#nk-mhg)" opacity=".5"/>' +
    '<g transform="translate(292 244)"><g class="nk-bm"><path d="M0 -2L340 -26V22Z" fill="url(#nk-bmg)"/></g></g>' +
    '<path d="M292 234V262" stroke="#c8944a" stroke-opacity=".7" stroke-width="1.6"/>' +
    `<path d="${TOWER}" fill="#5a3c1c" fill-opacity=".8" stroke="#d8a458" stroke-opacity=".5" stroke-width="1.2"/>` +
    '<path d="M286 310L298 392M298 310L286 392M281 410L306 454M303 410L278 454M247 538L270 468M337 538L314 468" fill="none" stroke="#e8b468" stroke-opacity=".3" stroke-width="1"/>' +
    '<circle cx="292" cy="236" r="2.4" fill="#ffe0b0"/>' +
    `<g transform="translate(292 240)">${rings}</g>` +
    sparkle +
    skyline(3, 488, 26, '#1e2336', '#56607e', false) +
    skyline(9, 526, 14, '#0c0e18', '#283046', true) +
    '</g>' +
    // The frame: casement, mullions, the fanlight's spokes, the sill with an herb pot.
    '<path d="M64 560V246A156 156 0 0 1 376 246V560Z" fill="none" stroke="#22150e" stroke-width="18"/>' +
    '<g fill="none" stroke="#22150e" stroke-width="8"><path d="M220 90V560M64 340H376M64 452H376M64 246H376M220 246L110 136M220 246L330 136"/></g>' +
    '<path d="M72 556V248A148 148 0 0 1 368 248V556" fill="none" stroke="#6a4630" stroke-opacity=".35" stroke-width="1.6"/>' +
    '<rect x="40" y="556" width="360" height="18" rx="2" fill="#2a1a10" stroke="#4a3020" stroke-width="1.5"/>' +
    '<path d="M42 557H398" stroke="#e8955a" stroke-opacity=".25" stroke-width="1.5"/>' +
    '<path d="M332 534H366L362 556H336Z" fill="#7a3a22"/><rect x="330" y="530" width="38" height="6" rx="2" fill="#8a4428"/>' +
    '<g fill="#3e6a2c"><ellipse cx="342" cy="522" rx="7" ry="10" transform="rotate(-24 342 522)"/><ellipse cx="356" cy="520" rx="7" ry="11" transform="rotate(20 356 520)"/><ellipse cx="349" cy="512" rx="6" ry="10"/></g>'
  )
}

/** One thing on the pot rack, hanging from its hook at (0, 0): a pan face-on, a ladle or a whisk. */
function hanging(kind: 'pan' | 'ladle' | 'whisk', size: number): string {
  const hook = '<path d="M0 -4V8" stroke="#2a1e18" stroke-width="2.6" stroke-linecap="round"/>'

  if (kind === 'pan') {
    const handle = size * 1.1
    const cy = 8 + handle + size
    const r = size * 0.76
    const arc = (a: number) => `${f(r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`

    return (
      hook +
      `<rect x="-5" y="4" width="10" height="${f(handle + 10)}" rx="4" fill="#4a2412" stroke="#7a3e1e" stroke-width="1"/>` +
      `<circle cy="${f(cy)}" r="${size}" fill="url(#nk-cug)" stroke="#1e0c06" stroke-width="3"/>` +
      `<path d="M${arc(3.4)}A${f(r)} ${f(r)} 0 0 1 ${arc(4.6)}M${arc(0.3)}A${f(r)} ${f(r)} 0 0 1 ${arc(1.2)}" fill="none" stroke="#ffc890" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>`
    )
  }

  if (kind === 'ladle') {
    return (
      hook +
      `<path d="M0 8V${f(size)}" stroke="#7a726c" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M-15 ${f(size)}A15 15 0 0 0 15 ${f(size)}Z" fill="#5a524c" stroke="#9a9088" stroke-opacity=".6" stroke-width="1.5"/>`
    )
  }

  const cy = 44 + size * 0.5

  return (
    hook +
    '<rect x="-3" y="8" width="6" height="34" rx="2" fill="#2a2220"/>' +
    `<g fill="none" stroke="#8a8078" stroke-opacity=".8" stroke-width="1.4"><ellipse cy="${f(cy)}" rx="5" ry="${f(size * 0.5)}"/>` +
    `<ellipse cy="${f(cy)}" rx="13" ry="${f(size * 0.5)}"/></g>`
  )
}

const RACK: readonly (readonly [number, 'pan' | 'ladle' | 'whisk', number])[] = [
  [452, 'pan', 46], [560, 'ladle', 84], [660, 'pan', 54], [790, 'whisk', 52], [900, 'pan', 40], [1030, 'ladle', 90],
  [1120, 'pan', 50],
]

/**
 * The pot rack under the ceiling: chains, an iron bar, copper pans and utensils swinging on their hooks. It stops short
 * of the pass, which a wide window lifts toward it.
 */
function potRack(next: () => number): string {
  const items = RACK.map(([x, kind, size], i) => {
    const dim = x > 420 && x < 1180 ? ' opacity=".34"' : ''

    return `<g transform="translate(${x} 52) rotate(${f((next() - 0.5) * 12)})"${dim}><g class="nk-sw" style="animation-delay:${f(-next() * 5 - i * 0.3)}s">${hanging(kind, size)}</g></g>`
  }).join('')

  return (
    '<rect x="-20" y="-40" width="1640" height="52" fill="#0a0605"/>' +
    '<path d="M470 12V48M820 12V48M1140 12V48" stroke="#2a1e18" stroke-width="3" stroke-dasharray="5 3"/>' +
    `<rect x="410" y="46" width="760" height="8" rx="3" fill="#2a1c14" stroke="#4a3020" stroke-width="1.5"/>` +
    `<path d="M412 47H1168" stroke="${COPPER_HI}" stroke-opacity=".22" stroke-width="1.2"/>` +
    items
  )
}

/** The back line in the middle distance, kept dim behind the chat: a shelf of jars and bowls, a counter of pots. */
function backline(next: () => number): string {
  const shelf = Array.from({ length: 11 }, (_, i) => {
    const x = 470 + i * 62 + next() * 16
    const kind = Math.floor(next() * 3)

    if (kind === 0) {
      const h = 28 + next() * 24

      return `M${f(x)} 420V${f(420 - h)}H${f(x + 26)}V420Z`
    }

    if (kind === 1) {
      const h = 46 + next() * 20

      return `M${f(x + 6)} 420V${f(420 - h * 0.6)}Q${f(x + 6)} ${f(420 - h * 0.72)} ${f(x + 10)} ${f(420 - h * 0.78)}V${f(420 - h)}H${f(x + 16)}V${f(420 - h * 0.78)}Q${f(x + 20)} ${f(420 - h * 0.72)} ${f(x + 20)} ${f(420 - h * 0.6)}V420Z`
    }

    return `M${f(x - 4)} 420Q${f(x + 16)} ${f(384 - next() * 8)} ${f(x + 36)} 420Z`
  }).join('')
  const plates = Array.from({ length: 4 }, (_, i) => `M700 ${680 - i * 8}a40 5 0 1 0 80 0a40 5 0 1 0 -80 0`).join('')

  return (
    `<g fill="${DARK}" stroke="#2c1f18" stroke-width="1.4"><path d="${shelf}"/>` +
    '<rect x="440" y="420" width="720" height="8" rx="2"/><path d="M470 428V444L490 428ZM1130 428V444L1110 428Z"/></g>'
    + `<g class="mv-b"><g fill="${DARK}" stroke="#2c1f18" stroke-width="1.4">` +
    '<rect x="494" y="598" width="132" height="8" rx="3"/><rect x="500" y="604" width="120" height="80" rx="5"/>' +
    '<rect x="886" y="626" width="96" height="7" rx="3"/><rect x="892" y="632" width="84" height="52" rx="5"/>' +
    `<path d="${plates}"/><path d="M1060 684V640Q1060 628 1068 624V612H1080V624Q1088 628 1088 640V684Z"/>` +
    '<path d="M1110 684Q1110 650 1146 650Q1182 650 1182 684Z"/></g>' +
    '<rect x="420" y="684" width="780" height="14" fill="#1c1411" stroke="#2c201a" stroke-width="1.4"/>' +
    '<rect x="420" y="698" width="780" height="210" fill="#100a08"/>' +
    '<path d="M560 704V906M720 704V906M880 704V906M1040 704V906" stroke="#1c1411" stroke-width="2"/></g>'
  )
}

/** The range at the left: body, oven, burners, the copper stockpot, the sauté pan and everything they do. */
function range(next: () => number): string {
  const knobs = Array.from({ length: 7 }, (_, i) => `M${21 + i * 60} 722a9 9 0 1 0 18 0a9 9 0 1 0 -18 0`).join('')
  const steam = Array.from({ length: 7 }, (_, i) =>
    `<ellipse class="nk-st" style="--dx:${f(20 + next() * 70)}px;animation-delay:${f(-i)}s" cx="${f(118 + next() * 24)}" cy="560" rx="12" ry="30" fill="url(#nk-stg)"/>`,
  ).join('')
  const smoke = Array.from({ length: 7 }, (_, i) =>
    `<circle class="nk-sk" style="--dx:${f(-30 + next() * 120)}px;animation-delay:${f(i * 0.42 - 0.8)}s" cx="${f(112 + next() * 36)}" cy="570" r="58" fill="url(#nk-smg)"/>`,
  ).join('')
  const embers = Array.from({ length: 7 }, (_, i) =>
    `<circle class="nk-em" style="--dx:${f((next() - 0.5) * 80)}px;animation-delay:${f(-next() * 4)}s" cx="${f(i < 4 ? 270 + next() * 100 : 70 + next() * 120)}" cy="${f(650 + next() * 20)}" r="${f(1.4 + next() * 1.4)}" fill="#ffb050"/>`,
  ).join('')
  const bits = Array.from({ length: 7 }, (_, i) =>
    `<g class="nk-bit" style="--dx:${f((next() - 0.5) * 50)}px;--h:${f(-120 - next() * 90)}px;animation-delay:${f(i * 0.015)}s">` +
    `<circle cx="${f(272 + i * 16 + next() * 5)}" cy="${f(648 - next() * 3)}" r="${f(4.5 + next() * 2.5)}" fill="${FOOD[i % 4]}"/></g>`,
  ).join('')
  const sizzle = Array.from({ length: 6 }, (_, i) =>
    `<circle class="nk-sz" style="--dx:${f((next() - 0.5) * 30)}px;--d:${f(i * 0.15)}s" cx="${f(268 + next() * 110)}" cy="648" r="1.8" fill="#ffe0a0"/>`,
  ).join('')
  const curl = (d: string, delay: number) => `<path class="nk-curl" style="animation-delay:${delay}s" pathLength="1" d="${d}"/>`

  return (
    // The range body and its oven, glowing low.
    '<rect x="-30" y="688" width="470" height="340" fill="#0c0909"/>' +
    `<rect x="-30" y="684" width="470" height="14" rx="2" fill="#34302d" stroke="#5a524c" stroke-width="1.5"/>` +
    '<path d="M-30 685H440" stroke="#a89c90" stroke-opacity=".5" stroke-width="1.5"/>' +
    `<path d="${knobs}" fill="#1e1a18" stroke="#5a524c" stroke-width="1.5"/>` +
    '<rect x="24" y="748" width="386" height="220" rx="4" fill="#110d0c" stroke="#3a3430" stroke-width="2"/>' +
    '<rect x="50" y="760" width="334" height="8" rx="4" fill="#4a4440"/>' +
    '<rect class="nk-ov" x="70" y="800" width="294" height="120" rx="6" fill="#ff7a2a" fill-opacity=".1" stroke="#2a2420" stroke-width="2"/>' +
    '<path d="M76 880H358" stroke="#3a2a20" stroke-width="2"/>' +
    // Grates and flames.
    '<path d="M56 676H204M246 676H396" stroke="#1a1614" stroke-width="4"/>' +
    '<path d="M60 676V684M200 676V684M250 676V684M392 676V684" stroke="#1a1614" stroke-width="3"/>' +
    burner(130, 148, 9, 61, ' nk-f1') +
    burner(321, 150, 8, 62, '') +
    '<ellipse class="nk-hot" cx="130" cy="640" rx="170" ry="150" fill="url(#nk-blg)"/>' +
    // The stockpot, its lid, the foam that boils over, the smoke.
    '<path d="M64 602H52V618H64M196 602H208V618H196" fill="none" stroke="#3a1a0c" stroke-width="5"/>' +
    '<rect x="66" y="584" width="128" height="90" rx="5" fill="url(#nk-cpg)"/>' +
    '<path d="M66 640H194" stroke="#3a1a0c" stroke-opacity=".45" stroke-width="2"/>' +
    '<rect x="62" y="580" width="136" height="8" rx="3" fill="#c87a44"/>' +
    '<g class="nk-fo" fill="#efe6d8" fill-opacity=".88"><path d="M60 586C62 572 84 574 92 578C100 568 122 570 130 576C140 566 166 570 172 578C184 572 200 576 200 588Z"/>' +
    '<path d="M66 584H78V626Q72 636 66 626ZM150 584H162V610Q156 620 150 610ZM184 584H196V640Q190 650 184 640Z"/></g>' +
    '<g class="nk-lid"><path d="M64 582Q130 548 196 582Z" fill="#8a4626" stroke="#c87a44" stroke-width="2"/>' +
    '<path d="M86 574Q108 562 128 560" fill="none" stroke="#ffc890" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>' +
    '<rect x="124" y="556" width="12" height="9" rx="3" fill="#2a1208"/></g>' +
    steam +
    `<g fill="none" stroke="#e8dccb" stroke-opacity=".2" stroke-width="12" stroke-linecap="round" stroke-dasharray=".3 .7">` +
    curl('M130 560C100 500 170 460 140 400C110 340 180 300 150 230C130 180 170 150 160 110', 0) +
    curl('M150 560C190 500 120 450 170 390C210 340 150 290 200 230C230 190 200 160 220 130', -1.2) +
    curl('M112 560C80 490 150 440 100 380C60 330 120 280 90 220C70 180 100 150 92 120', -2.4) +
    '</g>' +
    smoke +
    // The sauté pan, the food it tosses, its sizzle, the flambé.
    '<g class="nk-pan"><path d="M248 652H394L386 674H256Z" fill="#4a2412" stroke="#6a3a20" stroke-width="1.5"/>' +
    `<path d="M246 652H396" stroke="${COPPER_HI}" stroke-opacity=".6" stroke-width="3"/>` +
    '<path d="M394 656L478 640" stroke="#2a1a12" stroke-width="7" stroke-linecap="round"/></g>' +
    bits +
    sizzle +
    '<g transform="translate(321 660)"><g class="nk-fb">' +
    `<path d="${tongue(170, 330)}" fill="url(#nk-fbg)" opacity=".75"/>` +
    `<path d="${tongue(110, 250)}" transform="translate(-22 0) rotate(-9)" fill="url(#nk-fbg)" opacity=".8"/>` +
    `<path d="${tongue(100, 230)}" transform="translate(24 0) rotate(10)" fill="url(#nk-fbg)" opacity=".8"/>` +
    `<path d="${tongue(60, 150)}" fill="#ffe4b0" opacity=".7"/></g></g>` +
    '<circle class="nk-bl" cx="300" cy="540" r="280" fill="url(#nk-blg)"/>' +
    embers
  )
}

/** An order ticket hanging from the rail by its clip, marked in invented strokes. */
function ticket(x: number, i: number): string {
  const next = random(40 + i)
  const marks = [10, 18, 26, 34].map(y => `M-10 ${y}h${f(8 + next() * 12)}`).join('')

  return (
    `<g transform="translate(${x} -286)"><g class="nk-tk" style="animation-delay:${f(-i * 0.7)}s">` +
    `<rect x="-15" width="30" height="50" fill="${PAPER}" fill-opacity=".62"/><rect x="-15" y="-3" width="30" height="5" fill="#5a524c"/>` +
    `<path d="${marks}M4 42h7" stroke="#4a3a2c" stroke-width="2" stroke-linecap="round"/></g></g>`
  )
}

/** A heat lamp hanging over the pass on its cord, from (x, -420), with its cone of warm light. */
function lamp(x: number, delay: number): string {
  return (
    `<g transform="translate(${x} -420)"><g class="nk-lp" style="animation-delay:${delay}s">` +
    '<path d="M0 0V200" stroke="#1a1210" stroke-width="2.5"/>' +
    '<circle class="nk-hc" cy="226" r="46" fill="url(#nk-blg)" opacity=".4"/>' +
    '<path class="nk-hc" d="M-20 226H20L66 352H-66Z" fill="url(#nk-cng)"/>' +
    '<path class="nk-hx" d="M-20 226H20L66 352H-66Z" fill="url(#nk-cng)"/>' +
    '<path d="M-4 200H4V206H-4ZM-24 226L-15 206H15L24 226Z" fill="#2a2220" stroke="#5a4c44" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<ellipse cy="226" rx="17" ry="3.5" fill="#ffc070"/></g></g>'
  )
}

/** The pass above the desk: the ticket rail, the heat lamps, the cloche on its plate, and the recipe scroll. */
function pass(): string {
  const slices = (y: number, from: number, count: number, r: number, shift: number) =>
    FOOD.map((fill, c) => {
      const d = Array.from({ length: count }, (_, i) => i)
        .filter(i => (i + shift) % 4 === c)
        .map(i => `M${f(from + i * 7.5 - r)} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`)
        .join('')

      return `<path d="${d}" fill="${fill}"/>`
    }).join('')
  const sparks = [[248, -108, 0], [338, -116, 0.25], [300, -146, 0.5], [230, -84, 0.75], [354, -88, 1]]
    .map(
      ([x, y, d]) =>
        `<g transform="translate(${x} ${y})"><path class="nk-sp" style="--d:${d}s" d="M0 -9L2 -2L9 0L2 2L0 9L-2 2L-9 0L-2 -2Z" fill="#fff2d0"/></g>`,
    )
    .join('')
  const next = random(77)
  const glyphs = Array.from({ length: 8 }, (_, row) => `M28 ${-288 + row * 14}h${f(10 + next() * 18)}m6 0h${f(8 + next() * 20)}m6 0h${f(4 + next() * 10)}`).join('')

  return (
    '<circle cx="294" cy="-140" r="230" fill="url(#nk-wmg)"/>' +
    '<circle class="nk-pb" cx="292" cy="-110" r="210" fill="url(#nk-blg)"/>' +
    // The recipe scroll on its rod, unrolled while Claude reads.
    `<rect x="10" y="-312" width="100" height="8" rx="4" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
    `<g class="nk-rc"><rect x="18" y="-306" width="84" height="186" fill="${PAPER}" fill-opacity=".82" stroke="#8a7a62" stroke-width="1.5"/>` +
    `<path d="${glyphs}" stroke="#5a4632" stroke-width="2" stroke-linecap="round"/>` +
    '<path d="M40 -172H80V-150Q80 -142 72 -142H48Q40 -142 40 -150Z" fill="none" stroke="#8a4626" stroke-width="2.4"/>' +
    '<path d="M52 -178Q48 -186 54 -192M66 -178Q62 -188 68 -194" fill="none" stroke="#8a7a62" stroke-width="1.6"/>' +
    `<rect x="14" y="-124" width="92" height="8" rx="4" fill="${WOOD}"/></g>` +
    // The ticket rail and its orders.
    `<rect x="124" y="-292" width="300" height="7" rx="2" fill="#3e3a38" stroke="#5a524c" stroke-width="1.2"/>` +
    '<path d="M126 -291.5H422" stroke="#b8aca0" stroke-opacity=".5" stroke-width="1.2"/>' +
    [150, 196, 242, 288].map((x, i) => ticket(x, i)).join('') +
    `<g class="nk-tf">${ticket(334, 4)}</g>` +
    `<g class="nk-nt">${ticket(380, 5)}</g>` +
    lamp(232, 0) +
    lamp(352, -0.7) +
    // The pass shelf: a stack of plates, the dish under its cloche.
    `<rect x="136" y="-70" width="290" height="10" rx="1.5" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="1.5"/>` +
    '<path d="M138 -69.5H424" stroke="#a89c90" stroke-opacity=".55" stroke-width="1.5"/>' +
    '<path d="M160 -60V-34L184 -60ZM400 -60V-34L376 -60Z" fill="#221c1a"/>' +
    '<g fill="#cfc6ba" fill-opacity=".7" stroke="#8a8278" stroke-width="1.2"><ellipse cx="176" cy="-73" rx="24" ry="4"/><ellipse cx="176" cy="-78" rx="24" ry="4"/><ellipse cx="176" cy="-83" rx="24" ry="4"/></g>' +
    '<ellipse cx="292" cy="-72" rx="60" ry="6" fill="#d6cec2" fill-opacity=".85" stroke="#8a8278" stroke-width="1.5"/>' +
    '<ellipse cx="292" cy="-75" rx="40" ry="3.5" fill="#8a2a18"/>' +
    slices(-85, 262, 9, 6.5, 0) +
    slices(-79, 266, 8, 6, 2) +
    '<path d="M290 -92Q294 -100 300 -98Q296 -92 290 -92ZM292 -92Q286 -99 281 -96Q286 -91 292 -92Z" fill="#6aaa3a"/>' +
    '<g fill="none" stroke="#efe6da" stroke-opacity=".42" stroke-width="8" stroke-linecap="round" stroke-dasharray=".4 .6">' +
    '<path class="nk-ds" pathLength="1" d="M282 -92C264 -122 298 -148 278 -180C260 -210 294 -236 274 -270C262 -292 282 -310 272 -336"/>' +
    '<path class="nk-ds" style="animation-delay:-.9s" pathLength="1" d="M304 -92C320 -124 288 -150 308 -184C326 -214 294 -240 314 -276C324 -298 308 -318 318 -344"/>' +
    '<path class="nk-ds" style="animation-delay:-1.8s" pathLength="1" d="M292 -96C300 -128 280 -160 296 -196C310 -230 284 -262 300 -300"/></g>' +
    '<g class="nk-cl"><path d="M240 -73A52 46 0 0 1 344 -73Z" fill="url(#nk-svg)" stroke="#6a6a72" stroke-width="1.5"/>' +
    '<rect x="236" y="-77" width="112" height="6" rx="3" fill="#9a9aa2"/>' +
    '<path d="M258 -98A40 36 0 0 1 284 -114" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
    '<rect x="289" y="-124" width="6" height="6" fill="#7a7a82"/><circle cx="292" cy="-127" r="6" fill="#b8b8c0"/></g>' +
    sparks
  )
}

/** The spice shelf beside the desk, and the little grey mouse that lives behind the tallest jar. */
function spiceShelf(): string {
  const jar = (x: number, y: number, w: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${60 - y}" rx="3" fill="${fill}" stroke="#5a4c44" stroke-width="1.2"/>` +
    `<rect x="${x - 1}" y="${y - 4}" width="${w + 2}" height="5" rx="1" fill="#6a3a22"/>`

  return (
    `<rect x="-6" y="60" width="140" height="6" rx="1" fill="#2a1c14" stroke="#4a3020" stroke-width="1"/>` +
    '<path d="M10 66V80L26 66ZM112 66V80L96 66Z" fill="#1e140e"/>' +
    // Two copper pans on wall pegs, pinned with the pass so a wide window never stacks them on it.
    ([[46, -112, 22, -1.3], [96, -118, 28, -3.1]] as const)
      .map(([x, y, size, delay]) => `<g transform="translate(${x} ${y})"><g class="nk-sw" style="animation-delay:${delay}s">${hanging('pan', size)}</g></g>`)
      .join('') +
    jar(6, 32, 22, '#5a2418') +
    jar(36, 38, 20, '#2e3a1e') +
    '<g transform="translate(108 52)"><g class="nk-ms">' +
    '<path class="nk-tl" d="M9 2C14 -2 10 -10 14 -16" fill="none" stroke="#5a4a40" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="2" cy="0" rx="11" ry="7.5" fill="#5e5046"/><ellipse cx="-9" cy="-3" rx="7" ry="5.5" fill="#6a5a4e"/>' +
    '<path d="M-14 -6L-20 -1L-14 1Z" fill="#6a5a4e"/>' +
    '<circle cx="-7" cy="-10" r="4.5" fill="#6a5a4e"/><circle cx="-7" cy="-10" r="2.4" fill="#8a5a58"/><circle cx="-1" cy="-9" r="4" fill="#5e5046"/>' +
    '<circle cx="-12" cy="-4" r="1.4" fill="#f2e6d4"/><circle cx="-20" cy="-1" r="1.2" fill="#1a1010"/>' +
    '<path d="M-17 -1L-23 -4M-17 0L-23 2" stroke="#8a7a6a" stroke-width=".8"/></g></g>' +
    jar(86, 22, 36, '#4a3a1a')
  )
}

/** The tablet on its recipe stand, a slim keyboard, an espresso, and a board with a knife and a sliced courgette. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const lines = [0.14, 0.26, 0.38, 0.5]
    .map(t => {
      const lx = 359 - 16 * t
      const ly = 242 + 73 * t
      const rx = 395 - 15 * t
      const ry = 249 + 71 * t

      return `<path d="M${f(lx + 5)} ${f(ly + 1)}L${f(lx + (rx - lx) * 0.75)} ${f(ly + (ry - ly) * 0.75)}"/>`
    })
    .join('')
  const chop = activity === 'tool' ? ' class="nk-chop"' : ''

  return (
    '<ellipse cx="190" cy="329" rx="13" ry="2.5" fill="#cfc6ba" fill-opacity=".7"/>' +
    '<path d="M181 318H199L197 328H183Z" fill="#e4dbcf" fill-opacity=".85"/><rect x="181" y="318" width="18" height="3" fill="#3a1e10"/>' +
    '<path d="M199 320Q205 320 205 323.5Q205 327 199 327" fill="none" stroke="#e4dbcf" stroke-opacity=".85" stroke-width="1.6"/>' +
    '<rect x="244" y="322" width="90" height="8" rx="2" fill="#2a2422"/>' +
    keys +
    // The recipe stand's brass back leg, the tablet leaning on it, the lip it rests in.
    '<path d="M392 250L410 330" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M338 320L356 236L400 244L384 326Z" fill="#141010" stroke="#3a3230" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="M343 315L359 242L395 249L380 320Z" fill="${light}" fill-opacity=".55"/>` +
    `<g stroke="#2a1a10" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round">${lines}</g>` +
    '<circle cx="366" cy="298" r="7" fill="none" stroke="#2a1a10" stroke-opacity=".5" stroke-width="2"/>' +
    '<path d="M332 323L390 331" stroke="#8a6a3a" stroke-width="4" stroke-linecap="round"/>' +
    // The board, the slices, the knife (it chops on its own while a tool runs).
    '<rect x="412" y="324" width="58" height="6" rx="1.5" fill="#5a3e26" stroke="#7a5a3a" stroke-width="1"/>' +
    '<g fill="#7aa04a" stroke="#3a5a22" stroke-width="1"><ellipse cx="422" cy="322" rx="3.5" ry="2"/><ellipse cx="430" cy="322.5" rx="3.5" ry="2"/><ellipse cx="438" cy="322" rx="3.5" ry="2"/></g>' +
    `<g${chop}><path d="M412 322L446 316L450 320L412 323Z" fill="#c4c0bc" fill-opacity=".9"/><rect x="448" y="315" width="20" height="6" rx="2" fill="#2a1a12"/></g>`
  )
}

export function nightKitchenWorld(): World {
  const next = random(1803)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#070403',
      furniture: '#2e2420',
      metal: '#3a3432',
      paper: PAPER,
      light: { idle: '#b8794a', work: '#ffb878', bright: '#ffe2bc' },
      headTop: 176,
      glowAt: [368, 282],
      device,
      wear: {
        front:
          // The toque: a pleated puff over a pleated band, clear of the eyes; a red neckerchief under them.
          '<g class="nk-tq" shape-rendering="geometricPrecision">' +
          '<path d="M86 224C60 216 58 178 88 178C88 152 126 144 146 162C160 142 204 148 204 176C234 172 246 214 216 224Z" fill="#e2d8cb" stroke="#8a7e70" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M86 224C60 216 58 178 88 178C88 156 108 148 120 152C104 170 104 200 112 224Z" fill="#000000" fill-opacity=".14"/>' +
          '<path d="M112 222C104 204 104 186 112 172M148 222C146 200 146 182 148 166M184 222C190 204 192 190 190 176" fill="none" stroke="#a89a8a" stroke-width="2"/>' +
          '<path d="M84 222H216L218 248H82Z" fill="#d6ccbe" stroke="#8a7e70" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M100 224V246M118 224V246M136 224V246M154 224V246M172 224V246M190 224V246M206 224V246" stroke="#b0a292" stroke-width="1.5"/>' +
          '<path d="M214 180C232 186 236 210 216 222M216 226L218 246" fill="none" stroke="#ffc890" stroke-opacity=".45" stroke-width="2"/></g>' +
          '<g shape-rendering="geometricPrecision"><rect x="70" y="320" width="160" height="12" fill="#a63a2c"/>' +
          '<path d="M70 320.5H230" stroke="#d0604a" stroke-opacity=".6" stroke-width="1.5"/>' +
          '<path d="M210 318L227 322L225 335L208 332Z" fill="#842a1e"/>' +
          '<path d="M212 333L203 350L213 348L218 336ZM221 334L229 350L221 349Z" fill="#a63a2c"/></g>',
      },
      seatArt:
        // An upturned produce crate.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"><rect x="104" y="350" width="94" height="9" rx="1"/>` +
        '<rect x="104" y="370" width="94" height="12"/><rect x="104" y="394" width="94" height="12"/><rect x="104" y="418" width="94" height="12"/><rect x="104" y="442" width="94" height="12"/>' +
        '<rect x="104" y="350" width="8" height="106"/><rect x="190" y="350" width="8" height="106"/></g>' +
        '<path d="M106 351H196" stroke="#8a6a48" stroke-opacity=".5" stroke-width="1.2"/>',
      tableArt:
        // A steel prep table, a copper pot and a stack of bowls on its undershelf.
        `<g fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="1.5"><rect x="162" y="330" width="310" height="12" rx="1.5"/>` +
        '<rect x="176" y="342" width="10" height="114"/><rect x="448" y="342" width="10" height="114"/><rect x="170" y="404" width="296" height="7"/></g>' +
        '<path d="M164 331H470" stroke="#a89c90" stroke-opacity=".55" stroke-width="1.5"/>' +
        `<path d="M378 404V380H436V404Z" fill="#7a3e1e"/><rect x="374" y="376" width="66" height="5" rx="2" fill="${COPPER}"/>` +
        '<path d="M436 386H448" stroke="#5a2e18" stroke-width="3"/><path d="M390 384V400" stroke="#e8955a" stroke-opacity=".35" stroke-width="3"/>' +
        '<g fill="#4a4442" stroke="#6a625c" stroke-width="1"><path d="M220 404Q250 378 280 404Z"/><path d="M226 392Q250 372 274 392Z"/></g>',
    },
    style:
      // Ambient: flames lick, steam rises, pans swing, the tower's beacon turns, stars and windows glow.
      '.nk-fl{transform-box:fill-box;transform-origin:50% 100%;animation:nk-fl .6s ease-in-out infinite alternate}' +
      '@keyframes nk-fl{from{transform:scaleY(.78)}to{transform:scaleY(1.12)}}' +
      '@keyframes nk-low{from{transform:scaleY(.45)}to{transform:scaleY(.62)}}' +
      '@keyframes nk-mid{from{transform:scaleY(1)}to{transform:scaleY(1.45)}}' +
      '@keyframes nk-roar{from{transform:scale(1.1,1.6)}to{transform:scale(1.25,2.3)}}' +
      '.st-thinking .nk-fl,.st-done .nk-fl,.st-sleeping .nk-fl{animation-name:nk-low}' +
      '.st-responding .nk-fl,.st-tool .nk-fl{animation-name:nk-mid}' +
      '.st-run .nk-fl,.st-error .nk-fl.nk-f1{animation-name:nk-roar}' +
      '.nk-wg{animation:nk-wg 2.4s ease-in-out infinite alternate}@keyframes nk-wg{from{opacity:.7}to{opacity:1}}' +
      '.nk-ov{animation:nk-wg 3.4s ease-in-out infinite alternate}' +
      '.nk-st{opacity:0;transform-box:fill-box;transform-origin:center;animation:nk-st 7s ease-out infinite}' +
      '@keyframes nk-st{0%{opacity:0;transform:translate(0,0) scale(.6,.5)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-380px) scale(2.2,2.8)}}' +
      '.nk-em{opacity:0;animation:nk-em 4s ease-out infinite}' +
      '@keyframes nk-em{0%{opacity:0;transform:translate(0,0)}12%{opacity:.75}100%{opacity:0;transform:translate(var(--dx),-230px)}}' +
      '.nk-sw{animation:nk-sw 5s ease-in-out infinite alternate}@keyframes nk-sw{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}' +
      '.nk-bm{animation:nk-bm 6s ease-in-out infinite alternate}@keyframes nk-bm{from{transform:scaleX(1)}to{transform:scaleX(-1)}}' +
      '.nk-tw{animation:nk-tw 3.6s ease-in-out infinite alternate}@keyframes nk-tw{from{opacity:.25}to{opacity:.9}}' +
      '.nk-dw{opacity:.85}.nk-dx,.nk-sig,.nk-tsp{opacity:0}' +
      '.nk-tk{animation:nk-tk 5s ease-in-out infinite alternate}@keyframes nk-tk{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}' +
      '.nk-hc{animation:nk-hc 3s ease-in-out infinite alternate}@keyframes nk-hc{from{opacity:.75}to{opacity:1}}' +
      '.nk-hx{opacity:0}' +
      // The mouse peeks out from behind the tall jar now and then, its tail flicking.
      '.nk-ms{animation:nk-ms 9s ease-in-out infinite}' +
      '@keyframes nk-ms{0%,38%,82%,100%{transform:translateX(0)}46%,74%{transform:translateX(-24px)}60%{transform:translate(-24px,-2px)}}' +
      '.nk-tl{transform-box:fill-box;transform-origin:0 100%;animation:nk-tl 1.2s ease-in-out infinite alternate}@keyframes nk-tl{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}' +
      '.st-error .nk-ms,.st-startled .nk-ms{animation:none}' +
      '.st-sleeping .nk-hc{animation:none;opacity:.3}' +
      // Thinking: big curls of steam roll up from the stockpot past the window; the flames drop to a simmer.
      '.nk-curl{opacity:0}.st-thinking .nk-curl{opacity:1;animation:nk-curl 3.6s linear infinite}' +
      '@keyframes nk-curl{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.st-thinking .nk-st{animation-duration:4.5s}' +
      // The toque sways now and then, as if someone small under it were steering.
      '.nk-tq{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-thinking .nk-tq{animation:nk-tq 2.6s ease-in-out infinite alternate}.st-tool .nk-tq{animation:nk-tq .9s ease-in-out infinite alternate}' +
      '@keyframes nk-tq{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      // Responding: the tickets flutter in the heat, the pan sizzles.
      '.st-responding .nk-tk{animation:nk-tkf .5s ease-in-out infinite alternate}@keyframes nk-tkf{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      '.nk-sz{opacity:0}.st-responding .nk-sz,.st-tool .nk-sz{animation:nk-sz .9s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes nk-sz{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-34px)}}' +
      '.st-responding .nk-sw{animation-duration:3s}' +
      // Tool: a new order slides onto the rail, the lamps sway, the knife chops by itself, the pans swing.
      '.nk-nt{opacity:0}.st-tool .nk-nt{animation:nk-nt .7s cubic-bezier(.2,.8,.3,1) .2s both}' +
      '@keyframes nk-nt{from{opacity:0;transform:translateX(90px)}to{opacity:1;transform:translateX(0)}}' +
      '.st-tool .nk-lp{animation:nk-lp 1.4s ease-in-out infinite alternate}@keyframes nk-lp{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}' +
      '.st-tool .nk-sw{animation-duration:1.8s}' +
      '.nk-chop{transform-box:fill-box;transform-origin:0 100%;animation:nk-chop .3s ease-in-out infinite alternate}@keyframes nk-chop{to{transform:rotate(-14deg)}}' +
      // Read: the recipe scroll unrolls beside the pass.
      '.nk-rc{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-read .nk-rc{animation:nk-rc 1.2s ease-out both}@keyframes nk-rc{to{transform:scaleY(1)}}' +
      // Web: the tower's beacon sweeps fast and calls out, windows light up across the roofs.
      '.st-web .nk-bm{animation-duration:1.1s}' +
      '.nk-sig{transform-box:fill-box;transform-origin:center}' +
      '.st-web .nk-sig{animation:nk-sig 1.5s ease-out infinite}@keyframes nk-sig{0%{opacity:0;transform:scale(.4)}25%{opacity:.8}100%{opacity:0;transform:scale(2.6)}}' +
      '.st-web .nk-dx{animation:nk-on .4s ease-out both;animation-delay:calc(var(--i) * .1s)}@keyframes nk-on{to{opacity:.9}}' +
      '.st-web .nk-dw{animation:nk-dw 1.6s ease-in-out infinite;animation-delay:calc(var(--i) * .12s)}@keyframes nk-dw{0%,100%{opacity:.4}50%{opacity:1}}' +
      // Run: the pan is tossed, the food arcs up and back, and the pan goes up in a flambé; the burners roar.
      '.nk-pan{transform-box:fill-box;transform-origin:100% 20%}' +
      '.st-run .nk-pan{animation:nk-pan 2.6s ease-in-out infinite}' +
      '@keyframes nk-pan{0%,3%,22%,100%{transform:rotate(0)}9%{transform:translate(-6px,-10px) rotate(9deg)}14%{transform:rotate(-3deg)}}' +
      '.st-run .nk-bit{animation:nk-bit 2.6s infinite}' +
      '@keyframes nk-bit{0%,9%{transform:translate(0,0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}28%{transform:translate(var(--dx),var(--h));animation-timing-function:cubic-bezier(.6,0,.8,.5)}46%,100%{transform:translate(0,0)}}' +
      '.nk-fb{opacity:0;transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .nk-fb{animation:nk-fb 2.6s ease-out infinite}' +
      '@keyframes nk-fb{0%,11%{opacity:0;transform:scale(.4,.05)}18%{opacity:1;transform:scale(1.06,1)}30%{opacity:1;transform:scale(.94,.86)}46%{opacity:.85;transform:scale(1,.66)}72%{opacity:.45;transform:scale(.8,.34)}92%,100%{opacity:0;transform:scale(.6,.1)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the flambé's glow covers ~15% of the picture, so it peaks at .32, ramps
      // in over a quarter second and comes once every 2.6 s.
      '.nk-bl{opacity:0}.st-run .nk-bl{animation:nk-bl 2.6s ease-out infinite}' +
      '@keyframes nk-bl{0%,11%{opacity:0}21%{opacity:.32}55%{opacity:.14}92%,100%{opacity:0}}' +
      '.st-run .nk-em{animation-duration:1.6s}' +
      '.st-run .nk-sw{animation:nk-swb .9s ease-in-out infinite alternate}@keyframes nk-swb{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.st-run .nk-tk{animation:nk-tkf .35s ease-in-out infinite alternate}' +
      // Error: the stockpot boils over: the lid rattles and jumps, foam pours down, smoke billows, the pans rattle.
      '.nk-lid{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-error .nk-lid{animation:nk-lid 2.4s ease-out both}' +
      '@keyframes nk-lid{0%,12%,24%{transform:translate(0,0)}6%{transform:translate(0,-6px) rotate(-3deg)}18%{transform:translate(0,-8px) rotate(4deg)}40%{transform:translate(-14px,-74px) rotate(-22deg)}58%,100%{transform:translate(-22px,2px) rotate(-12deg)}}' +
      '.nk-fo{opacity:0;transform-box:fill-box;transform-origin:50% 0}' +
      '.st-error .nk-fo{animation:nk-fo 1.6s ease-out .7s both}@keyframes nk-fo{0%{opacity:0;transform:scaleY(.1)}25%{opacity:1}100%{opacity:1;transform:scaleY(1)}}' +
      '.nk-sk{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .nk-sk{animation:nk-sk 3s ease-out infinite}' +
      '@keyframes nk-sk{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}60%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),-430px) scale(3.8)}}' +
      '.nk-hot{opacity:0}.st-error .nk-hot{animation:nk-hot 2.4s ease-in-out .3s infinite alternate}@keyframes nk-hot{from{opacity:.1}to{opacity:.3}}' +
      '.st-error .nk-sw{animation:nk-rat .16s linear infinite alternate}@keyframes nk-rat{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}' +
      '.nk-tf{transform-box:fill-box;transform-origin:50% 0}.st-error .nk-tf{animation:nk-tf 1.1s cubic-bezier(.5,0,.8,.6) .5s both}@keyframes nk-tf{to{transform:translate(-26px,206px) rotate(-80deg)}}' +
      // Done: the cloche lifts on the plated dish, steam and sparkles rise, the lamps brighten, the tower glitters.
      '.nk-cl{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-done .nk-cl{animation:nk-cl 1.4s cubic-bezier(.3,.7,.3,1) .2s both}' +
      '@keyframes nk-cl{0%{transform:translate(0,0)}25%{transform:translate(0,-26px)}100%{transform:translate(18px,-104px) rotate(12deg)}}' +
      '.nk-sp{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-done .nk-sp{animation:nk-sp 1.6s ease-out infinite;animation-delay:calc(.6s + var(--d))}' +
      '@keyframes nk-sp{0%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.4) rotate(45deg)}}' +
      '.nk-ds{opacity:0}.st-done .nk-ds{opacity:1;animation:nk-curl 2.6s linear infinite}' +
      // The pass glows warm as the cloche comes up: ~8% of the picture, at most .28, ramping in over half a second.
      '.nk-pb{opacity:0}.st-done .nk-pb{animation:nk-pb 1.4s ease-out .2s both}@keyframes nk-pb{40%{opacity:.28}100%{opacity:.22}}' +
      '.st-done .nk-tg{animation:nk-tg 1s ease-out .3s both}@keyframes nk-tg{to{opacity:1}}' +
      '.st-done .nk-hx{animation:nk-on 1s ease-out .3s both}' +
      '.st-done .nk-tsp{animation:nk-tsp 1.3s ease-in-out infinite;animation-delay:var(--d)}@keyframes nk-tsp{0%,100%{opacity:0}50%{opacity:1}}' +
      '.st-done .nk-ms{animation:nk-msd 1s ease-out .6s both}@keyframes nk-msd{to{transform:translateX(-30px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="nk-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0706"/><stop offset=".35" stop-color="#130d0a"/><stop offset=".75" stop-color="#150e0b"/><stop offset="1" stop-color="#0c0807"/></linearGradient>' +
      '<pattern id="nk-tile" width="48" height="24" patternUnits="userSpaceOnUse"><path d="M0 .5H48M0 12.5H48M.5 0V12M24.5 12V24" fill="none" stroke="#2a1d16" stroke-width="1"/></pattern>' +
      '<clipPath id="nk-wc"><path d="M64 560V246A156 156 0 0 1 376 246V560Z"/></clipPath>' +
      '<linearGradient id="nk-skg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070918"/><stop offset=".5" stop-color="#0f1029"/><stop offset=".82" stop-color="#221a30"/><stop offset="1" stop-color="#3a2430"/></linearGradient>' +
      '<radialGradient id="nk-mhg"><stop offset="0" stop-color="#e8dcc0" stop-opacity=".3"/><stop offset="1" stop-color="#e8dcc0" stop-opacity="0"/></radialGradient>' +
      '' +
      '<linearGradient id="nk-bmg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".3"/><stop offset="1" stop-color="#ffe6b0" stop-opacity="0"/></linearGradient>' +
      '' +
      '<radialGradient id="nk-cug" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#b8703e"/><stop offset=".5" stop-color="#6e3618"/><stop offset="1" stop-color="#2a1208"/></radialGradient>' +
      '<linearGradient id="nk-cpg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1208"/><stop offset=".22" stop-color="#7a3e1e"/><stop offset=".4" stop-color="#d0844a"/><stop offset=".55" stop-color="#8a4626"/><stop offset="1" stop-color="#220e06"/></linearGradient>' +
      '<linearGradient id="nk-flm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a7aff" stop-opacity=".9"/><stop offset=".3" stop-color="#ff8a2a" stop-opacity=".9"/><stop offset=".75" stop-color="#ffc060" stop-opacity=".7"/><stop offset="1" stop-color="#ffe0a0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="nk-fbg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0c0" stop-opacity=".95"/><stop offset=".3" stop-color="#ffb050" stop-opacity=".85"/><stop offset=".7" stop-color="#ff7a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="nk-blg"><stop offset="0" stop-color="#ffc070"/><stop offset=".4" stop-color="#ff9040" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nk-wmg"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".2"/><stop offset=".5" stop-color="#ff6a2a" stop-opacity=".07"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>' +
      '' +
      '<radialGradient id="nk-smg"><stop offset="0" stop-color="#8a807a" stop-opacity=".8"/><stop offset=".55" stop-color="#5a524c" stop-opacity=".5"/><stop offset="1" stop-color="#4a4440" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nk-stg"><stop offset="0" stop-color="#efe6da" stop-opacity=".2"/><stop offset="1" stop-color="#efe6da" stop-opacity="0"/></radialGradient>' +
      '' +
      '<linearGradient id="nk-cng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb868" stop-opacity=".32"/><stop offset="1" stop-color="#ffb868" stop-opacity="0"/></linearGradient>' +
      '' +
      '<linearGradient id="nk-svg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2a30"/><stop offset=".28" stop-color="#8a8a94"/><stop offset=".42" stop-color="#dcdce2"/><stop offset=".58" stop-color="#8a8a92"/><stop offset="1" stop-color="#222228"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#nk-wall)"/><rect width="1600" height="1000" fill="url(#nk-tile)" opacity=".7"/>' +
      windowView(next) +
      '<circle class="nk-wg" cx="230" cy="690" r="400" fill="url(#nk-wmg)"/>' +
      backline(next) +
      '<g class="mv-b"><rect x="-20" y="906" width="1640" height="140" fill="#0a0605"/>' +
      '<path d="M-20 906H1620M-20 934H1620M-20 972H1620" stroke="#1e1410" stroke-opacity=".7" stroke-width="1.5"/>' +
      range(next) +
      '</g>' +
      `<g class="mv-t">${potRack(next)}</g>`,
    nook: pass() + spiceShelf(),
  }
}
