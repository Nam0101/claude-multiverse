import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Savanna Dawn: a safari ranger in a khaki bandana, binoculars on its chest, at a camp table on the tip of a jutting
// rock under an acacia, typing on a laptop charged by a fold-out solar panel. Below, the savanna at first light: a
// huge sun half over the horizon behind two giraffes, elephants and an acacia, a waterhole holding its reflection,
// zebras grazing on the right, tall grass swaying. A command sends a herd galloping across the plain in a dust
// cloud; an error rolls a wall of dust in over the plain and swallows the sun; done lifts the sun clear of the
// horizon in a burst of rays and sends the birds up across it.
const SUN = '#ffb84d'
const SIL = '#0a0604'
const OLIVE = '#8c8648'
const WOOD = '#4a301a'
const WOOD_EDGE = '#6a4826'
const BRASS = '#b88a3c'
const SX = 290
const SY = 660

// The animals face right with their feet at the origin; a negative x scale turns them round.
const GIRAFFE_BODY = 'M-42 -78C-20 -88 4 -94 24 -98L40 -74C38 -64 34 -60 28 -58H-34C-42 -60 -44 -70 -42 -78Z'
const GIRAFFE_LEGS = 'M-36 -60L-38 0M-27 -60L-26 0M24 -60L22 0M33 -62L35 0M-42 -76L-47 -46'
// The neck and head, drawn around the withers (30, -86) so they can bow from there.
const GIRAFFE_NECK = 'M-10 -10L26 -64L28 -72L31 -72L32 -66L36 -67L38 -74L41 -73L40 -65L54 -57L54 -51L40 -49L12 10L0 4Z'
const ELEPHANT =
  'M-50 -50C-48 -66 -28 -76 0 -76C20 -76 34 -70 42 -62C50 -70 64 -68 68 -56C72 -44 70 -30 72 -16C73 -8 77 -4 80 -6L81 -2' +
  'C74 2 66 -2 64 -14C63 -24 60 -30 54 -32L50 -30V0H39L38 -22H30V0H20L19 -24H-24L-26 0H-36V-22H-40L-42 0H-52V-34Z'
const EAR = 'M38 -62C26 -60 24 -38 34 -32C44 -36 48 -52 44 -62Z'
const ZEBRA_LEGS = 'L30 0H25L24 -20H16L15 0H10L9 -22H-18L-19 0H-24L-25 -20L-27 0H-32V-24C-35 -28 -35 -36 -32 -40Z'
const ZEBRA = `M-32 -40C-30 -48 -10 -48 10 -46C18 -46 22 -48 26 -52L38 -66L40 -72L43 -66L50 -60L58 -50C60 -46 56 -44 52 -46L42 -50C38 -44 34 -36 30 -28${ZEBRA_LEGS}`
const ZEBRA_GRAZE = `M-32 -40C-30 -48 -10 -48 10 -46C18 -46 22 -48 26 -52C34 -44 42 -30 48 -14L52 -4L45 -2L38 -12C34 -20 32 -24 30 -26${ZEBRA_LEGS}`
const STRIPES = 'M-24 -44L-22 -24M-14 -46L-13 -24M-4 -47V-24M6 -47V-24M16 -46L15 -26M24 -12H30M9 -12H15M-24 -12H-19'
// The running zebras keep only the body stripes.
const RUN_STRIPES = 'M-22 -38L-20 -25M-12 -40V-25M-2 -41L-3 -25M8 -41L7 -25M16 -40L14 -26'
// Galloping: legs flung forward and back, drawn as strokes on the same path.
const ZEBRA_RUN =
  'M-30 -36C-18 -42 8 -42 20 -40L34 -56C36 -62 40 -62 42 -58L52 -44L48 -40L40 -46L30 -32C30 -28 28 -26 24 -25H-22C-30 -27 -33 -32 -30 -36Z' +
  'M24 -26L44 -12M18 -26L30 -4M-20 -25L-40 -12M-14 -25L-24 -3M-30 -34L-40 -24'
const GNU_RUN =
  'M-30 -30C-22 -38 4 -46 16 -46C26 -46 30 -40 34 -34L46 -22L50 -14L44 -12L34 -20L28 -22C20 -18 -10 -18 -24 -20C-30 -22 -32 -26 -30 -30Z' +
  'M32 -36C26 -44 36 -48 40 -42M24 -21L42 -8M18 -20L28 0M-18 -20L-38 -10M-12 -20L-22 0M-30 -28L-42 -22'

const circle = (cx: number, cy: number, r: number): string =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`

/** A flat-topped acacia: a forked trunk and two layers of umbrella crown. */
function acacia(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})" fill="${SIL}">` +
    '<path d="M-5 0L-3 -40L-36 -92L-30 -95L0 -52L10 -74L42 -100L47 -96L14 -70L5 -44L5 0Z"/>' +
    '<path d="M-100 -92C-84 -114 -40 -120 0 -118C44 -122 86 -114 104 -98C86 -90 44 -88 0 -90C-40 -86 -76 -86 -100 -92Z"/>' +
    '<path d="M-62 -112C-40 -128 30 -130 64 -114C30 -108 -30 -106 -62 -112Z"/></g>'
  )
}

function giraffe(x: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} 606) scale(${s} ${Math.abs(s)})" fill="${SIL}">` +
    `<path d="${GIRAFFE_LEGS}" stroke="${SIL}" stroke-width="5" stroke-linecap="round"/><path d="${GIRAFFE_BODY}"/>` +
    `<g transform="translate(30 -86)"><g class="sv-neck" style="animation-delay:${delay}s"><path d="${GIRAFFE_NECK}"/></g></g></g>`
  )
}

function elephant(x: number, s: number): string {
  return (
    `<g transform="translate(${x} 607) scale(${-s} ${s})"><path d="${ELEPHANT}" fill="${SIL}"/><path d="${EAR}" fill="#1c120c"/>` +
    '<path d="M-51 -46L-56 -24" stroke="#0a0604" stroke-width="3"/><path d="M63 -24C66 -18 72 -17 75 -21" fill="none" stroke="#d8c0a0" stroke-opacity=".4" stroke-width="2.4"/></g>'
  )
}

function zebra(x: number, y: number, s: number, graze: boolean): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s} ${Math.abs(s)})"><path d="${graze ? ZEBRA_GRAZE : ZEBRA}" fill="#3a2e26"/>` +
    `<path d="${STRIPES}${graze ? 'M30 -46L36 -40M38 -34L44 -30' : 'M28 -50L33 -44M33 -58L39 -54'}M-33 -38C-38 -32 -38 -24 -36 -16" fill="none" stroke="${SIL}" stroke-width="3.6"/>` +
    `<path d="${graze ? 'M26 -52L40 -38' : 'M26 -52L38 -66'}" stroke="${SIL}" stroke-width="4" stroke-linecap="round"/></g>`
  )
}

/** A bird in flight; its parent gives the stroke (BIRDS). */
const bird = (x: number, y: number, s: number, fast = false): string =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path class="sv-wing${fast ? ' sv-wf' : ''}" d="M-12 0Q-6 -9 0 0Q6 -9 12 0"/></g>`
const BIRDS = `fill="none" stroke="${SIL}" stroke-width="2.6" stroke-linecap="round"`

/** Grass blades as one path: thin curved wedges, some topped with a seed head. */
function blades(seed: number, x0: number, x1: number, count: number, base: number, low: number, high: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const x = x0 + next() * (x1 - x0)
    const h = low + next() * (high - low)
    const lean = (next() - 0.5) * 36
    const w = 3 + next() * 3
    const tx = x + lean
    const ty = base - h

    d += `M${f(x)} ${base}Q${f(x + lean * 0.4)} ${f(base - h * 0.6)} ${f(tx)} ${f(ty)}Q${f(x + lean * 0.4 + w)} ${f(base - h * 0.6)} ${f(x + w)} ${base}Z`
    if (next() < 0.35) d += `M${f(tx - 2.6)} ${f(ty)}a2.6 9 0 1 0 5.2 0a2.6 9 0 1 0 -5.2 0Z`
  }

  return d
}

/** The herd that gallops across on a run: zebras and wildebeest in a lit dust cloud, running left toward the sun. */
function herd(): string {
  const next = random(23)
  const dust = Array.from(
    { length: 10 },
    (_, i) => `<ellipse cx="${f(i * 160 + next() * 60)}" cy="${f(728 + next() * 26)}" rx="${f(160 + next() * 70)}" ry="${f(70 + next() * 30)}" fill="url(#sv-dust)"/>`,
  ).join('')
  const puffs = Array.from(
    { length: 8 },
    (_, i) =>
      `<circle class="sv-puff" style="animation-delay:${f(-next() * 1.8)}s" cx="${f(60 + i * 190 + next() * 80)}" cy="${f(772 + next() * 22)}" r="${f(22 + next() * 16)}" fill="#7a4a26" fill-opacity=".45"/>`,
  ).join('')
  const beasts = Array.from({ length: 16 }, (_, i) => {
    const depth = next()
    const isZebra = next() < 0.45

    return {
      y: 726 + depth * 74,
      markup:
        `<g transform="translate(${f(i * 92 + next() * 46)} ${f(726 + depth * 74)}) scale(${f(-(0.62 + depth * 0.5))} ${f(0.62 + depth * 0.5)})">` +
        `<g class="sv-gal" style="animation-delay:${f(-next() * 0.8)}s"><path d="${isZebra ? ZEBRA_RUN : GNU_RUN}"/>` +
        (isZebra ? `<path d="${RUN_STRIPES}" fill="none" stroke="#c8a888" stroke-opacity=".38" stroke-width="2.4"/>` : '') +
        '</g></g>',
    }
  })
    .sort((a, b) => a.y - b.y)
    .map(beast => beast.markup)
    .join('')
  const ground = Array.from(
    { length: 6 },
    (_, i) => `<ellipse cx="${f(80 + i * 280 + next() * 80)}" cy="${f(806 + next() * 10)}" rx="${f(130 + next() * 60)}" ry="16" fill="#6a3e1e" fill-opacity=".3"/>`,
  ).join('')

  return (
    `<g class="sv-hin"><g class="sv-herd">${dust}${puffs}` +
    `<g fill="${SIL}" stroke="${SIL}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">${beasts}</g>${ground}</g></g>`
  )
}

/** The dust storm: a towering wall of billows, lit on the side that faces the sun, with dust blown flat ahead of it. */
function storm(): string {
  const next = random(41)
  let body = ''
  let tops = ''

  for (let i = 0; i < 18; i += 1) {
    const t = i / 17
    const cx = 400 + i * 92 + next() * 30
    const r = 92 + t * 60 + next() * 30
    const cy = 610 - (150 + t * 330 + next() * 50)

    body += circle(cx, cy, r)
    tops += circle(cx - r * 0.24, cy - r * 0.26, r * 0.6)
  }

  for (let i = 0; i < 14; i += 1) body += circle(370 + i * 120 + next() * 30, 600 + next() * 30, 80 + next() * 30)
  for (let i = 0; i < 9; i += 1) body += circle(410 + (i % 3) * 110 + next() * 30, 700 + Math.floor(i / 3) * 120, 90 + next() * 20)

  const streaks = Array.from({ length: 16 }, () => `M${f(next() * 800)} ${f(120 + next() * 820)}h${f(60 + next() * 120)}`).join('')

  return (
    `<g class="sv-storm"><g class="sv-churn"><path d="${body}" fill="url(#sv-wall)"/><path d="${tops}" fill="#6a4426" fill-opacity=".3"/></g>` +
    '<rect x="600" y="600" width="1500" height="420" fill="url(#sv-wall)"/></g>' +
    `<g class="sv-streak" fill="none" stroke="#c89060" stroke-opacity=".24" stroke-width="2" stroke-linecap="round"><g class="sv-blow">` +
    [0, 800, 1600].map(x => `<path transform="translate(${x} 0)" d="${streaks}"/>`).join('') +
    '</g></g>' +
    '<rect class="sv-veil" width="1600" height="1000" fill="#0c0705" fill-opacity=".38"/>'
  )
}

/** The jutting rock: a granite prow rising past the desk to a point over the plain, two boulders on its back. */
function granite(): string {
  const next = random(71)
  // Its upper edge from the tip back to the desk; the lit top face lies between it and the same line a little lower.
  const edge: readonly (readonly [number, number])[] = [
    [-322, 328], [-300, 331], [-282, 339], [-250, 346], [-214, 358], [-176, 370], [-140, 382],
    [-112, 392], [-76, 404], [-40, 416], [-10, 426], [40, 443], [110, 456],
  ]
  const line = (dy: number) => edge.map(([x, y], i) => `${x} ${y + (i === 0 ? dy / 3 : dy)}`)
  const top = `M${line(0).join('L')}`
  const edgeAt = (x: number) => {
    const i = edge.findIndex(([ex]) => ex >= x)
    const [x0, y0] = edge[Math.max(0, i - 1)]!
    const [x1, y1] = edge[Math.max(0, i)]!

    return x1 === x0 ? y0 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
  }
  const specks = Array.from({ length: 18 }, () => {
    const x = -250 + next() * 340

    return `M${f(x)} ${f(edgeAt(x) + 24 + next() * 30)}h2.4v2.4h-2.4Z`
  }).join('')
  const lump = (shape: string, lit: string) => `<path d="M${shape}Z" fill="#2c2a25"/><path d="M${lit}Z" fill="#6e6452"/>`

  return (
    '<g fill="#24221e" stroke="#8a7c64" stroke-opacity=".3" stroke-width="2"><path d="M-70 462C-70 428 -36 408 8 410C52 410 76 436 76 462Z"/><path d="M226 462C230 436 262 422 296 426C324 430 338 446 338 462Z"/></g>' +
    `<path d="${top}H480V480H-210L-214 452L-232 440L-240 416L-262 404L-270 384L-292 372L-300 352L-314 340Z" fill="url(#sv-rk)"/>` +
    '<path d="M-314 340L-300 352L-292 372L-270 384L-262 404L-240 416L-232 440L-214 452L-210 470" fill="none" stroke="#0a0908" stroke-opacity=".85" stroke-width="8" stroke-linejoin="bevel"/>' +
    `<path d="${top}L${line(16).reverse().join('L')}Z" fill="#5c5444"/>` +
    `<path d="${specks}" fill="#a49a88" fill-opacity=".35"/>` +
    lump('-236 354L-230 334L-214 324L-196 326L-182 340L-178 368', '-236 354L-230 334L-214 324L-208 334L-220 358') +
    lump('-74 408L-66 392L-50 384L-32 388L-22 402L-20 420', '-74 408L-66 392L-50 384L-46 394L-58 410') +
    `<path d="${top}H300M-230 334L-214 324L-196 326M-66 392L-50 384L-32 388" fill="none" stroke="#e8a45a" stroke-opacity=".6" stroke-width="2.4" stroke-linejoin="round"/>` +
    // Cracks run down across the edge, through the lit face into the rock.
    '<path d="M-268 343L-262 362L-266 384M-194 362L-188 388L-194 408M-146 380L-140 400L-146 420L-142 438M-96 397L-92 418L-98 434M-8 425L-4 444L-8 456M64 447L68 460" ' +
    'fill="none" stroke="#0e0c0a" stroke-opacity=".8" stroke-width="2"/>'
  )
}

/** The laptop and, behind it, a fold-out solar panel leaning back toward the dawn; its cells charge as Claude works. */
function device(light: string, activity: Activity): string {
  const cells = [0, 1, 2, 3, 4, 5].map(k => [3 + (k % 2) * 20, 3 + Math.floor(k / 2) * 22.5] as const)
  const charged = activity === 'done' ? '1' : '0'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<path d="M404 262L420 330" stroke="#2a221a" stroke-width="4"/>' +
    '<path d="M358 316L357 330M392 316L392 330" stroke="#2a2620" stroke-width="4"/>' +
    '<g transform="translate(366 246) skewX(-12)"><rect width="46" height="72" rx="2" fill="#2a2620" stroke="#7a6444" stroke-width="2"/>' +
    cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="18" height="20.5" fill="#16263a"/>`).join('') +
    '<path d="M6 20L18 6M26 64L40 50M24 34L38 22" stroke="#9cc0dc" stroke-opacity=".3" stroke-width="2"/>' +
    cells
      .map(([x, y], k) => `<rect class="sv-cell" style="--k:${k}" opacity="${charged}" x="${x}" y="${y}" width="18" height="20.5" fill="${SUN}" fill-opacity=".72"/>`)
      .join('') +
    '</g>' +
    '<path d="M376 318C374 332 358 334 340 328" fill="none" stroke="#1a140e" stroke-width="2.5"/>' +
    '<rect x="244" y="323" width="96" height="7" rx="2" fill="#2e2a24"/>' +
    keys +
    `<circle class="sv-led${activity === 'run' || activity === 'tool' ? ' sv-fast' : ''}" cx="332" cy="326.5" r="1.8" fill="${SUN}"/>` +
    '<path d="M330 327L350 240L359 242L339 329Z" fill="#2e2a24"/>' +
    `<path d="M331 324L350 244L354 245L335 326Z" fill="${light}"/>` +
    `<path d="M331 324L350 244L338 248L320 324Z" fill="${light}" fill-opacity=".16"/>`
  )
}

export function savannaDawnWorld(): World {
  const next = random(11)
  const stars = Array.from({ length: 24 }, (_, i) => {
    const y = next() * next() * 380
    const tw = i % 5 === 0 ? ` class="sv-tw" style="animation-delay:${f(-next() * 4)}s"` : ''

    return `<circle${tw} cx="${f(next() * 1600)}" cy="${f(y)}" r="${f(0.6 + next() * 1.1)}" fill="#f4e6d8" fill-opacity="${f((0.2 + next() * 0.5) * (1 - y / 460))}"/>`
  }).join('')
  const clouds = [
    [160, 330, 170, 11],
    [440, 378, 120, 8],
    [70, 418, 110, 7],
    [720, 300, 150, 9],
    [1010, 246, 130, 8],
    [1350, 196, 180, 11],
    [1480, 330, 120, 7],
  ]
    .map(([x, y, rx, ry]) => {
      const lit = Math.max(0.12, 0.6 - Math.abs(x! - SX) / 1500)

      return (
        `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#120a0e" fill-opacity=".9"/>` +
        `<path class="sv-cg" d="M${x! - rx! * 0.85} ${y! + ry! * 0.55}Q${x} ${y! + ry! * 1.25} ${x! + rx! * 0.85} ${y! + ry! * 0.55}" fill="none" stroke="#e8823e" stroke-opacity="${f(lit)}" stroke-width="2.4" stroke-linecap="round"/>`
      )
    })
    .join('')
  const rays = Array.from({ length: 7 }, (_, i) => {
    const a = ((198 + i * 24) * Math.PI) / 180
    const w = (6.5 * Math.PI) / 180

    return `M0 0L${f(820 * Math.cos(a - w))} ${f(820 * Math.sin(a - w))}L${f(820 * Math.cos(a + w))} ${f(820 * Math.sin(a + w))}Z`
  }).join('')
  const kopje = (x: number, at: number, w: number, h: number) => h * Math.max(0, 1 - ((x - at) / w) ** 2)
  const ridge: string[] = []
  for (let x = -20; x <= 1640; x += 40) {
    ridge.push(`${x} ${f(596 - next() * 5 - kopje(x, 600, 90, 22) - kopje(x, 900, 60, 14) - kopje(x, 1090, 110, 30))}`)
  }
  const ticks = Array.from({ length: 40 }, () => {
    const y = 630 + next() * next() * 260

    return `M${f(next() * 1600)} ${f(y)}v${f(-2 - (y - 600) / 40)}`
  }).join('')
  const idleBirds = [
    [140, 452, 1.2],
    [186, 432, 0.9],
    [470, 470, 1.1],
    [530, 444, 0.85],
  ]
    .map(([x, y, s]) => bird(x!, y!, s!))
    .join('')
  const vee = [0, 1, 2, 3, 4, 5, 6].map(i => bird(-60 - Math.ceil(i / 2) * 50, 440 + (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 24, 1.25, true)).join('')
  // A flock bursts up off the waterhole and out of the acacia, across the face of the rising sun.
  const lift = Array.from({ length: 16 }, (_, i) => {
    const fromTree = i < 5
    const x = fromTree ? 20 + next() * 130 : 150 + next() * 280
    const y = fromTree ? 480 + next() * 20 : 676 + next() * 24
    const style = `--dx:${f((fromTree ? 160 : -60) + next() * 300)}px;--dy:${f(-(fromTree ? 240 : 380) - next() * 200)}px;animation-delay:${f(next() * 0.6)}s`

    return `<g class="sv-lift" style="${style}">${bird(x, y, 1.6 + next() * 0.8, true)}</g>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0a0604',
      furniture: WOOD,
      metal: '#2e2a24',
      paper: '#efe2c8',
      light: { idle: '#c98a3e', work: SUN, bright: '#ffe0a0' },
      headTop: 226,
      glowAt: [346, 282],
      device,
      wear: {
        front:
          // The binoculars hang low on the chest; their strap runs down the body's sides, clear of the eyes.
          '<path d="M73 254V318L120 332M227 254V318L154 332" fill="none" stroke="#3a2414" stroke-width="3" stroke-linejoin="round"/>' +
          '<g fill="#1c1510" stroke="#4a3a2a" stroke-width="1.5"><rect x="116" y="330" width="15" height="19" rx="3"/><rect x="141" y="330" width="15" height="19" rx="3"/></g>' +
          '<rect x="130" y="334" width="12" height="6" fill="#1c1510"/><g fill="#7a9aa8" fill-opacity=".6"><rect x="118" y="344" width="11" height="4" rx="2"/><rect x="143" y="344" width="11" height="4" rx="2"/></g>' +
          // The bandana: a flat olive wrap knotted at the far side, its tails in the wind, its hem clear of the eyes.
          `<g transform="translate(70 240)"><path class="sv-tail" d="M0 0L-22 18L-12 18L-20 34L2 8Z" fill="${OLIVE}" stroke="#4a4420" stroke-width="1.4" stroke-linejoin="round"/></g>` +
          `<path d="M64 252C64 236 76 228 100 226H200C224 228 236 236 236 252C208 245 92 245 64 252Z" fill="${OLIVE}" stroke="#4a4420" stroke-width="1.6"/>` +
          '<path d="M90 229L116 243M148 227L168 243M196 228L214 242" stroke="#4a4420" stroke-opacity=".45" stroke-width="2"/>' +
          '<path d="M66 250C94 243 206 243 234 250" fill="none" stroke="#4a4420" stroke-width="4"/>' +
          `<g fill="#ece0b0" fill-opacity=".75">${[84, 104, 124, 144, 164, 184, 204, 222].map(x => `<circle cx="${x}" cy="${x < 100 || x > 210 ? 247.5 : 246}" r="1.3"/>`).join('')}</g>` +
          '<path d="M58 238L74 234L76 250L60 252Z" fill="#7a7440" stroke="#4a4420" stroke-width="1.4"/>',
      },
      seatArt:
        `<g stroke="${WOOD}" stroke-width="7" stroke-linecap="round"><path d="M120 360L184 452M184 360L120 452"/></g>` +
        `<path d="M112 452H128M176 452H192" stroke="${WOOD_EDGE}" stroke-width="5" stroke-linecap="round"/><circle cx="152" cy="406" r="4.5" fill="${BRASS}"/>` +
        '<path d="M106 349Q151 358 196 349V360Q151 368 106 360Z" fill="#8a6c40" stroke="#5a4426" stroke-width="1.5"/>',
      tableArt:
        `<g stroke="${WOOD}" stroke-width="7" stroke-linecap="round"><path d="M188 344L214 452M214 344L188 452M428 344L454 452M454 344L428 452"/></g>` +
        `<path d="M201 398H441" stroke="${WOOD_EDGE}" stroke-width="3.5"/>` +
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M232 331V342M300 331V342M368 331V342M432 331V342" stroke="#2a1a0e" stroke-width="1.6"/>' +
        `<g fill="${BRASS}"><circle cx="201" cy="398" r="3"/><circle cx="441" cy="398" r="3"/></g>`,
    },
    style:
      '@keyframes sv-in{to{opacity:1}}' +
      '@keyframes sv-breathe{from{opacity:.84}to{opacity:1}}' +
      '.sv-tw{animation:sv-tw 4s ease-in-out infinite alternate}@keyframes sv-tw{to{opacity:.2}}' +
      '.st-done .sv-stars{animation:sv-out 2.4s ease-out both}@keyframes sv-out{to{opacity:.15}}' +
      '.sv-cg{opacity:.55}.st-done .sv-cg{animation:sv-in 2.2s ease-out .3s both}' +
      // The sun breathes; an error's dust dims it; done lifts it clear of the horizon in a fan of rays.
      '.sv-disk{animation:sv-breathe 6s ease-in-out infinite alternate}' +
      '.sv-halo{animation:sv-breathe 8s ease-in-out infinite alternate}.st-responding .sv-halo{animation-duration:1.8s}' +
      '.st-error .sv-sun{animation:sv-dim 2.6s ease-in both}@keyframes sv-dim{to{opacity:.38}}' +
      '.st-done .sv-up{animation:sv-rise 2.8s cubic-bezier(.2,.7,.3,1) both}@keyframes sv-rise{to{transform:translateY(-120px)}}' +
      '.sv-rays{opacity:0}.st-done .sv-rays{animation:sv-rays 3.2s ease-out .15s both}' +
      '@keyframes sv-rays{0%{opacity:0;transform:scale(.45) rotate(-10deg)}40%{opacity:1}100%{opacity:.9;transform:scale(1) rotate(0)}}' +
      '.sv-wash{opacity:0}.st-done .sv-wash{animation:sv-in 1.6s ease-out .4s both}' +
      '.sv-glint{animation:sv-breathe 3s ease-in-out infinite alternate}' +
      // The giraffes sway their necks, and bow to browse while Claude reads; the elephants amble.
      '.sv-neck{animation:sv-neck 6s ease-in-out infinite alternate}@keyframes sv-neck{from{transform:rotate(-5deg)}to{transform:rotate(4deg)}}' +
      '.st-read .sv-neck{animation:sv-browse 1.5s ease-in-out infinite alternate}@keyframes sv-browse{from{transform:rotate(-4deg)}to{transform:rotate(32deg)}}' +
      '.sv-ele{animation:sv-walk 36s ease-in-out infinite alternate}@keyframes sv-walk{to{transform:translateX(-70px)}}' +
      // Birds: a few drift by the sun; a hawk circles while Claude thinks; a skein flies out on the web.
      '.sv-wing{transform-box:fill-box;transform-origin:50% 100%;animation:sv-flap .5s ease-in-out infinite alternate}.sv-wf{animation-duration:.28s}@keyframes sv-flap{to{transform:scaleY(.3)}}' +
      '.sv-drift{animation:sv-drift 50s linear infinite alternate}@keyframes sv-drift{to{transform:translateX(240px)}}' +
      '.sv-raptor{opacity:0}.st-thinking .sv-raptor{animation:sv-in 1.2s ease-out both}.st-thinking .sv-orbit{animation:mv-spin 10s linear infinite}' +
      '.sv-vee{opacity:0}.st-web .sv-vee{animation:sv-vee 6s linear infinite}' +
      '@keyframes sv-vee{0%{opacity:0;transform:translate(0,0)}6%,90%{opacity:1}100%{opacity:0;transform:translate(1900px,-160px)}}' +
      // Run: the herd gallops across in its dust.
      // It loops from wholly off the right edge to wholly off the left; a second in, faded up, so it shows at once.
      '.sv-hin{opacity:0}.st-run .sv-hin{animation:sv-in .5s ease-out both}.st-run .sv-herd{animation:sv-herd 8.5s linear -1s infinite}' +
      '@keyframes sv-herd{from{transform:translateX(1850px)}to{transform:translateX(-1800px)}}' +
      '.sv-gal{transform-box:fill-box;transform-origin:50% 100%}.st-run .sv-gal{animation:sv-gal .4s ease-in-out infinite alternate}' +
      '@keyframes sv-gal{from{transform:translateY(0) rotate(2deg)}to{transform:translateY(-7px) rotate(-4deg)}}' +
      '.sv-puff{transform-box:fill-box;transform-origin:center;opacity:0}.st-run .sv-puff{animation:sv-puff 1.8s ease-out infinite}' +
      '@keyframes sv-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.8}100%{opacity:0;transform:translate(60px,-60px) scale(1.8)}}' +
      '.sv-haze{opacity:0}.st-run .sv-haze{animation:sv-in 1.4s ease-out both}' +
      // Tall grass sways; a gale flattens it toward the sun.
      '.sv-gr,.sv-tuft{transform-box:fill-box;transform-origin:50% 100%;animation:sv-sway 5s ease-in-out infinite alternate}' +
      '@keyframes sv-sway{from{transform:skewX(-3deg)}to{transform:skewX(3.5deg)}}' +
      '.sv-gr2{animation-duration:6.2s;animation-delay:-2s}.sv-gr3{animation-duration:4.4s;animation-delay:-3.4s}' +
      '.st-error .sv-gr,.st-error .sv-tuft{animation:sv-gale .7s ease-in-out infinite alternate}@keyframes sv-gale{from{transform:skewX(8deg)}to{transform:skewX(15deg)}}' +
      // Done: birds burst up out of the acacia and off the waterhole.
      '.sv-lift{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .sv-lift{animation:sv-lift 3.4s cubic-bezier(.3,.6,.4,1) both}' +
      '@keyframes sv-lift{0%{opacity:0;transform:translate(0,0) scale(.5)}12%,80%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.1)}}' +
      // Error: the dust wall rolls in from the right, streaks blow flat, the light goes brown.
      '.sv-storm{opacity:0}.st-error .sv-storm{animation:sv-storm 3.4s cubic-bezier(.25,.6,.35,1) both}' +
      '@keyframes sv-storm{0%{opacity:0;transform:translateX(1300px)}14%{opacity:1}100%{opacity:1;transform:translateX(0)}}' +
      '.st-error .sv-churn{animation:sv-churn 2.2s ease-in-out infinite alternate}@keyframes sv-churn{to{transform:translate(-18px,-10px)}}' +
      '.sv-veil{opacity:0}.st-error .sv-veil{animation:sv-in 2.6s ease-in both}' +
      '.sv-streak{opacity:0}.st-error .sv-streak{animation:sv-in .9s ease-out .3s both}' +
      '.st-error .sv-blow{animation:sv-blow 1.4s linear infinite}@keyframes sv-blow{to{transform:translateX(-800px)}}' +
      // The acacia over the desk: its crown sways, trembles as the herd passes, thrashes in the storm.
      '.sv-crown{transform-box:fill-box;transform-origin:50% 100%;animation:sv-crown 7s ease-in-out infinite alternate}' +
      '@keyframes sv-crown{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}' +
      '.st-run .sv-crown{animation-duration:.3s}' +
      '.st-error .sv-crown{animation:sv-thrash .5s ease-in-out infinite alternate}@keyframes sv-thrash{from{transform:rotate(-1deg) translateX(-4px)}to{transform:rotate(-3deg) translateX(-12px)}}' +
      '.sv-nest{transform-box:fill-box;transform-origin:50% 0;animation:sv-nest 3s ease-in-out infinite alternate}@keyframes sv-nest{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.sv-leaf,.sv-fd{opacity:0}.st-error .sv-leaf{animation:sv-leaf 2s ease-in infinite}' +
      '@keyframes sv-leaf{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:.9}100%{opacity:0;transform:translate(-420px,120px) rotate(400deg)}}' +
      '.st-error .sv-fd{animation:sv-fd 2.4s linear infinite}@keyframes sv-fd{0%{opacity:0;transform:translateX(0)}20%{opacity:.55}100%{opacity:0;transform:translateX(-360px)}}' +
      // The rig: the bandana's tails, the solar cells charging, the charge light.
      '.sv-tail{transform-box:fill-box;transform-origin:100% 0;animation:sv-tail 2.6s ease-in-out infinite alternate}@keyframes sv-tail{from{transform:rotate(-6deg)}to{transform:rotate(10deg)}}' +
      '.st-error .sv-tail{animation-duration:.4s}' +
      '.sv-cell{opacity:0}' +
      '.st-responding .sv-cell{animation:sv-chg 2.4s ease-in-out infinite;animation-delay:calc(var(--k) * .3s)}' +
      '.st-tool .sv-cell,.st-run .sv-cell{animation:sv-chg 1s ease-in-out infinite;animation-delay:calc(var(--k) * .12s)}' +
      '@keyframes sv-chg{0%,100%{opacity:0}40%{opacity:.8}}' +
      '.st-done .sv-cell{animation:sv-in 1.2s ease-out .5s both}' +
      '.sv-led{animation:sv-breathe 3s ease-in-out infinite alternate}.sv-fast{animation:sv-blink .5s steps(1) infinite}@keyframes sv-blink{50%{opacity:.2}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sv-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600"><stop offset="0" stop-color="#05040a"/><stop offset=".45" stop-color="#0d0810"/><stop offset=".8" stop-color="#1c100f"/><stop offset="1" stop-color="#2c160e"/></linearGradient>' +
      '<radialGradient id="sv-hg"><stop offset="0" stop-color="#f08a3a" stop-opacity=".5"/><stop offset=".3" stop-color="#c4602a" stop-opacity=".26"/><stop offset=".7" stop-color="#6a2c14" stop-opacity=".08"/><stop offset="1" stop-color="#6a2c14" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sv-sh"><stop offset="0" stop-color="#ffb060" stop-opacity=".55"/><stop offset=".3" stop-color="#ff9040" stop-opacity=".25"/><stop offset=".65" stop-color="#c05a24" stop-opacity=".08"/><stop offset="1" stop-color="#c05a24" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sv-sd"><stop offset="0" stop-color="#ffe2a4"/><stop offset=".5" stop-color="#ffb860"/><stop offset=".85" stop-color="#ff9038"/><stop offset="1" stop-color="#f07828"/></radialGradient>' +
      '<radialGradient id="sv-ray" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="820"><stop offset="0" stop-color="#ffd890" stop-opacity=".45"/><stop offset=".3" stop-color="#ffb050" stop-opacity=".15"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="sv-wash" gradientUnits="userSpaceOnUse" cx="${SX}" cy="560" r="900"><stop offset="0" stop-color="#ffb860" stop-opacity=".3"/><stop offset=".5" stop-color="#ff9a40" stop-opacity=".1"/><stop offset="1" stop-color="#ff9a40" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="sv-pl" gradientUnits="userSpaceOnUse" x1="0" y1="598" x2="0" y2="1000"><stop offset="0" stop-color="#2a150b"/><stop offset=".12" stop-color="#1f100a"/><stop offset=".5" stop-color="#140b07"/><stop offset="1" stop-color="#0a0604"/></linearGradient>' +
      '<radialGradient id="sv-dust"><stop offset="0" stop-color="#8a5228" stop-opacity=".5"/><stop offset=".6" stop-color="#6a3c1c" stop-opacity=".24"/><stop offset="1" stop-color="#6a3c1c" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sv-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a1a" stop-opacity="0"/><stop offset=".55" stop-color="#6a3a1a" stop-opacity=".34"/><stop offset="1" stop-color="#6a3a1a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sv-wall" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="1000"><stop offset="0" stop-color="#4a2e1a"/><stop offset=".4" stop-color="#36210f"/><stop offset="1" stop-color="#1e120a"/></linearGradient>' +
      '<linearGradient id="sv-gl" gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="0" y2="830"><stop offset="0" stop-color="#0a0604"/><stop offset=".6" stop-color="#2a170c"/><stop offset="1" stop-color="#5a3418"/></linearGradient>' +
      '<linearGradient id="sv-gd" gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="0" y2="860"><stop offset="0" stop-color="#050302"/><stop offset="1" stop-color="#24140a"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#sv-sky)"/>' +
      `<g class="sv-stars">${stars}</g>` +
      `<ellipse cx="${SX}" cy="600" rx="820" ry="300" fill="url(#sv-hg)"/>` +
      clouds +
      `<circle class="sv-wash" cx="${SX}" cy="560" r="900" fill="url(#sv-wash)"/>` +
      // The sun, half over the horizon.
      `<g class="sv-sun"><g class="sv-up"><circle class="sv-halo" cx="${SX}" cy="${SY}" r="360" fill="url(#sv-sh)"/>` +
      `<g transform="translate(${SX} ${SY})"><g class="sv-rays"><path d="${rays}" fill="url(#sv-ray)"/></g></g>` +
      `<circle class="sv-disk" cx="${SX}" cy="${SY}" r="150" fill="url(#sv-sd)" fill-opacity=".95"/></g></g>` +
      `<g class="sv-drift" ${BIRDS}>${idleBirds}</g>` +
      '<g transform="translate(300 390)"><g class="sv-raptor"><g class="sv-orbit"><g transform="translate(96 0) scale(1.5)">' +
      `<path d="M0 12C-4 6 -6 2 -6 -4L-40 -10C-28 -2 -16 2 -6 4L-3 12L-8 20H8L3 12L6 4C16 2 28 -2 40 -10L6 -4C6 2 4 6 0 12Z" fill="${SIL}"/></g></g></g></g>` +
      `<g class="sv-vee" ${BIRDS}>${vee}</g>` +
      // The far hills on the right, the horizon ridge with its rocky kopjes, the plain.
      '<g class="mv-r"><path d="M1150 600L1230 562L1300 542L1360 510L1420 502L1470 514L1540 540L1620 572L1700 600Z" fill="#170e12"/>' +
      '<path d="M1230 562L1300 542L1360 510L1420 502" fill="none" stroke="#b0603a" stroke-opacity=".22" stroke-width="2"/></g>' +
      `<path d="M${ridge.join('L')}V620H-20Z" fill="#130a07"/>` +
      '<rect y="598" width="1600" height="402" fill="url(#sv-pl)"/>' +
      `<ellipse cx="${SX}" cy="604" rx="380" ry="30" fill="url(#sv-hg)"/>` +
      `<path d="${ticks}" stroke="#3a2010" stroke-opacity=".6" stroke-width="1.6"/>` +
      // The waterhole holds the sun.
      '<ellipse cx="300" cy="690" rx="170" ry="15" fill="#0e0705"/>' +
      '<ellipse class="sv-glint" cx="292" cy="689" rx="80" ry="4.5" fill="#ffa852" fill-opacity=".38"/><ellipse cx="320" cy="694" rx="40" ry="2" fill="#ffc070" fill-opacity=".3"/>' +
      // Silhouettes against the sun: an acacia, two giraffes, elephants ambling, more acacias along the horizon.
      acacia(60, 606, 1.1) +
      acacia(660, 603, 0.5) +
      acacia(930, 600, 0.36) +
      acacia(1120, 602, 0.48) +
      giraffe(150, 1.05, 0) +
      giraffe(330, -0.88, -2.6) +
      `<g class="sv-ele">${elephant(430, 0.95)}${elephant(478, 0.5)}${elephant(560, 0.78)}</g>` +
      // Zebras grazing on the right, all facing the sun, spaced so each reads on its own.
      `<g class="mv-r">${zebra(1236, 650, -0.95, true)}${zebra(1350, 648, -1, false)}${zebra(1462, 652, -0.95, true)}</g>` +
      '<rect class="sv-haze" y="640" width="1600" height="200" fill="url(#sv-hz)"/>' +
      herd() +
      // Tall grass in the foreground, lit at the tips.
      '<g class="mv-b">' +
      `<path class="sv-gr sv-gr2" d="${blades(51, -40, 440, 20, 1004, 70, 160)}" fill="url(#sv-gl)"/>` +
      `<path class="sv-gr" d="${blades(52, -40, 400, 16, 1004, 50, 130)}" fill="url(#sv-gd)"/>` +
      `<path class="sv-gr sv-gr3" d="${blades(53, -40, 300, 10, 1004, 40, 90)}" fill="${SIL}"/></g>` +
      `<g ${BIRDS}>${lift}</g>` +
      storm(),
    nook:
      '<defs><linearGradient id="sv-rk" gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="470"><stop offset="0" stop-color="#4a463d"/><stop offset="1" stop-color="#151411"/></linearGradient></defs>' +
      // The acacia over the camp: trunk from the rock, limbs, a flat crown with weaver nests.
      `<path d="M428 460C420 360 400 220 370 100" fill="none" stroke="${SIL}" stroke-width="13" stroke-linecap="round"/>` +
      `<path d="M370 100C330 30 280 -20 200 -66M372 104C390 40 420 0 470 -60M362 70C350 10 330 -30 300 -70" fill="none" stroke="${SIL}" stroke-width="6" stroke-linecap="round"/>` +
      `<g class="sv-crown"><g fill="${SIL}"><path d="M120 -70C150 -100 240 -116 330 -114C420 -118 520 -104 570 -76C500 -64 420 -62 330 -64C240 -60 170 -62 120 -70Z"/>` +
      '<path d="M190 -104C240 -128 300 -136 360 -134C430 -132 480 -122 510 -104C440 -98 380 -96 340 -98C280 -96 230 -98 190 -104Z"/></g>' +
      '<path d="M120 -70C170 -62 240 -60 330 -64C420 -62 500 -64 570 -76" fill="none" stroke="#c06a30" stroke-opacity=".45" stroke-width="2.4"/>' +
      [
        [200, -64],
        [236, -62],
        [290, -63],
      ]
        .map(
          ([x, y], i) =>
            `<g class="sv-nest" style="animation-delay:${-i * 0.9}s"><path d="M${x} ${y}V${y! + 8}" stroke="${SIL}" stroke-width="1.5"/><ellipse cx="${x}" cy="${y! + 16}" rx="6" ry="9" fill="#24160c"/></g>`,
        )
        .join('') +
      '</g>' +
      [0, 1, 2, 3, 4, 5]
        .map(i => `<ellipse class="sv-leaf" style="animation-delay:${f(i * 0.33)}s" cx="${220 + i * 50}" cy="${-70 + (i % 2) * 8}" rx="4" ry="2" fill="#3a2a14"/>`)
        .join('') +
      granite(),
    front:
      // Grass on the rock, and the storm's dust blowing past the desk.
      [
        [-270, 344, 30],
        [-150, 380, 34],
        [10, 428, 30],
      ]
        .map(([x, y, h], i) => `<path class="sv-tuft" style="animation-delay:${-i * 1.2}s" d="${blades(60 + i, x! - 16, x! + 16, 5, y!, h! * 0.5, h!)}" fill="#1a0f08"/>`)
        .join('') +
      [0, 1, 2, 3, 4]
        .map(i => `<ellipse class="sv-fd" style="animation-delay:${f(i * 0.48)}s" cx="${380 - i * 30}" cy="${410 + (i % 3) * 16}" rx="${60 + i * 8}" ry="14" fill="#6a4428" fill-opacity=".5"/>`)
        .join(''),
  }
}
