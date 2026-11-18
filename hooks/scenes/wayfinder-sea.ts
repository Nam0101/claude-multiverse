import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Wayfinder Sea: a voyager on a double-hulled canoe under a crab-claw sail, far out on a calm night sea. The Milky
// Way arcs overhead, a path of stars rises over one point of the horizon, plankton glows in the swell and a huge
// manta glides below. Claude steers by a star compass of shells and sticks around a small screen. A command fills
// the sail, the canoe surges and the ocean blooms; an error brings a squall with rain and rising waves; done raises
// an island at the foot of the star path with the sunrise behind it.
const TEAL = '#4fe0c8'
const GLOW = '#bff8ee'
const WOOD = '#2b2218'
const WOOD_EDGE = '#4a3826'
const CORD = '#a08660'
const SHELL = '#efe6cf'
const HULL = '#1a130d'

type Pt = readonly [number, number]

/** Round dots as one path: zero-length segments with round caps. */
const dots = (points: readonly Pt[]): string => points.map(([x, y]) => `M${f(x)} ${f(y)}h0`).join('')

/** A circle as a path segment, so several can share one element. */
const disc = (x: number, y: number, r: number): string =>
  `M${f(x + r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0Z`

/** A rolling swell line, one period `p` longer at each end so it slides right by `p` without a seam. */
function swell(y: number, amp: number, p: number, from = -p, to = 1600 + p): string {
  const n = Math.ceil((to - from) / (p / 2))

  return `M${f(from)} ${f(y)}q${f(p / 4)} ${f(-amp * 2)} ${f(p / 2)} 0${`t${f(p / 2)} 0`.repeat(n - 1)}`
}

const cubic = (t: number, a: number, b: number, c: number, d: number): number =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d

// The swell, far to near: the last layer is see-through and lies over the manta.
const SEA = [
  { y: 574, amp: 2.5, p: 240, fill: '#071722', glow: 0.22, secs: 70, bob: 7 },
  { y: 616, amp: 4, p: 340, fill: '#081a26', glow: 0.28, secs: 54, bob: 6 },
  { y: 682, amp: 7, p: 460, fill: '#091d29', glow: 0.34, secs: 42, bob: 7.5 },
  { y: 772, amp: 11, p: 620, fill: '#0a202d', glow: 0.42, secs: 32, bob: 6.5 },
  { y: 884, amp: 16, p: 820, fill: '#0b2431', glow: 0.5, secs: 26, bob: 8 },
]

// The path of stars: each rises over the same point of the horizon, the brightest lowest. The island comes up under it.
const PATH: readonly (readonly [number, number, number])[] = [
  [296, 446, 3.6],
  [288, 386, 2.6],
  [284, 324, 2.4],
  [286, 262, 2.6],
  [294, 202, 2.2],
  [306, 144, 2.4],
  [324, 88, 2.2],
]

// An invented asterism, a seabird with spread wings, that draws itself while Claude reads the sky.
const BIRD_STARS: readonly Pt[] = [[30, 196], [72, 158], [118, 184], [162, 150], [206, 182], [116, 234], [122, 138]]
const BIRD_LINES = 'M30 196L72 158L118 184L162 150L206 182M118 184L116 234M118 184L122 138'

// The manta from above, head up, wings spread: drawn flattened, as seen down through the water.
const MANTA =
  'M0 -50C-10 -52 -20 -62 -26 -80C-34 -74 -36 -60 -40 -50C-90 -44 -170 -22 -226 16C-176 20 -110 34 -56 54' +
  'C-36 62 -14 70 -4 74L0 240L4 74C14 70 36 62 56 54C110 34 176 20 226 16C170 -22 90 -44 40 -50' +
  'C36 -60 34 -74 26 -80C20 -62 10 -52 0 -50Z'

// The crab-claw sail in the desk's box: its foot at the apex, two bowed spars, the deep notch between their tips.
const APEX: Pt = [60, 412]
const TIP_REAR: Pt = [436, -262]
const TIP_FRONT: Pt = [-70, -436]
const NOTCH_C1: Pt = [320, -120]
const NOTCH_C2: Pt = [40, -170]
const SAIL =
  `M60 412C200 280 360 20 436 -262C320 -120 40 -170 -70 -436C-30 -150 30 200 60 412Z`
const TOP_EDGE = 'M436 -262C320 -120 40 -170 -70 -436'
// The free edge when the wind fills the sail: the notch pushed out toward the chord between the tips.
const PUFF = 'M-70 -436C40 -300 300 -220 436 -262'

/** The top edge pulled toward the apex by `s`: the woven bands across the sail. */
function band(s: number): string {
  const at = (p: Pt) => `${f(APEX[0] + s * (p[0] - APEX[0]))} ${f(APEX[1] + s * (p[1] - APEX[1]))}`

  return `M${at(TIP_REAR)}C${at(NOTCH_C1)} ${at(NOTCH_C2)} ${at(TIP_FRONT)}`
}

/** Claude's coral starburst: eight rays, long and short. */
function burst(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2
    const len = i % 2 === 1 ? r * 0.26 : i % 4 === 0 ? r : r * 0.7

    return `${f(cx + Math.cos(a) * len)} ${f(cy + Math.sin(a) * len)}`
  })

  return `M${points.join('L')}Z`
}

/** The star compass: a ring of lashed sticks set with shells, crossed like a stick chart, a small screen inside. */
function device(light: string, activity: Activity): string {
  const cx = 352
  const cy = 256
  const ink = '#06161a'
  const shells = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2

    return (
      `<g transform="translate(${f(cx + Math.cos(a) * 46)} ${f(cy + Math.sin(a) * 46)}) rotate(${i * 45})">` +
      `<ellipse rx="4.6" ry="6.6" fill="${SHELL}"/><path d="M0 -4V4" stroke="#8a7254" stroke-width="1.4"/>` +
      `<ellipse class="wf-sl" style="animation-delay:${f(i * 0.3)}s" rx="6.4" ry="8.4" fill="${TEAL}" opacity="0"/></g>`
    )
  }).join('')
  const glyph =
    activity === 'run'
      ? `<rect class="wf-prog" x="${cx - 14}" y="${cy + 2}" width="28" height="5" fill="${ink}" fill-opacity=".6"/>`
      : activity === 'error'
        ? `<path d="M${cx - 15} ${cy + 3}l6 -7l5 9l6 -10l5 9l6 -6" fill="none" stroke="${ink}" stroke-opacity=".7" stroke-width="2.4"/>`
        : activity === 'done'
          ? `<path d="M${cx - 15} ${cy + 8}q8 -15 16 -3q6 -5 13 3Z" fill="${ink}" fill-opacity=".65"/><circle cx="${cx + 9}" cy="${cy - 6}" r="3.2" fill="${ink}" fill-opacity=".5"/>`
          : activity === 'thinking' || activity === 'read'
            ? `<path d="${dots([[cx - 10, cy - 6], [cx - 3, cy + 1], [cx + 5, cy - 3], [cx + 11, cy + 6]])}" stroke="${ink}" stroke-opacity=".7" stroke-width="3.4" stroke-linecap="round"/>`
            : `<path d="M${cx - 14} ${cy + 3}q3.5 -6 7 0t7 0t7 0t7 0" fill="none" stroke="${ink}" stroke-opacity=".6" stroke-width="2.4"/>`

  return (
    // The keyboard: a lashed slat with shell keys.
    `<rect x="244" y="322" width="86" height="8" rx="2" fill="#3a2c1e" stroke="${WOOD_EDGE}"/>` +
    `<g fill="${light}" fill-opacity=".5">${[252, 264, 276, 288, 300, 312].map(x => `<rect x="${x}" y="324" width="7" height="3" rx="1"/>`).join('')}</g>` +
    // The foot, the sticks and the ring.
    `<path d="M${cx - 24} 330L${cx - 12} ${cy + 50}H${cx + 12}L${cx + 24} 330Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
    `<path d="M${cx - 58} ${cy - 30}L${cx + 58} ${cy + 30}M${cx - 58} ${cy + 30}L${cx + 58} ${cy - 30}M${cx} ${cy - 62}V${cy + 56}" stroke="#6a5236" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="#5a4430" stroke-width="5"/>` +
    `<circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="${CORD}" stroke-opacity=".6" stroke-width="5" stroke-dasharray="2 9"/>` +
    shells +
    // The screen.
    `<rect x="${cx - 20}" y="${cy - 15}" width="40" height="30" rx="4" fill="${light}" stroke="#1a120c" stroke-width="3"/>` +
    `<path d="M${cx - 17} ${cy - 12}h12l-12 10Z" fill="#ffffff" fill-opacity=".16"/>` +
    glyph +
    // A spark that walks round the shells while Claude thinks.
    `<g transform="translate(${cx} ${cy})"><g class="wf-orb"><circle cy="-46" r="7" fill="${GLOW}" opacity="0"/></g></g>`
  )
}

const LEI = 'M72 290C80 316 112 334 150 334C188 334 220 316 228 290'
const HIBISCUS = [0, 1, 2, 3, 4]
  .map(i => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2

    return disc(Math.cos(a) * 5.6, Math.sin(a) * 5.6, 5)
  })
  .join('')

export function wayfinderSeaWorld(): World {
  const next = random(23)
  const stars = (count: number, top: number, bottom: number) =>
    Array.from({ length: count }, (): Pt => [next() * 1600, top + next() * (bottom - top)])
  const small = stars(70, 0, 548)
  const mid = stars(26, 0, 520)
  const big = stars(9, 0, 470)
  const tilt = (-16 * Math.PI) / 180
  const dust = Array.from({ length: 260 }, (): Pt => {
    const u = (next() - 0.5) * 1900
    const v = (next() + next() + next() - 1.5) * 70

    return [760 + u * Math.cos(tilt) - v * Math.sin(tilt), 250 + u * Math.sin(tilt) + v * Math.cos(tilt)]
  })
  const twinkle = Array.from({ length: 12 }, (_, i) => {
    const x = next() * 1600
    const y = next() * 500

    return `<circle class="wf-tw" style="animation-delay:${f(-i * 0.7)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.3 + next() * 0.9)}" fill="#eefbff"/>`
  }).join('')
  const path = PATH.map(([x, y, r], i) => {
    const flare =
      i === 0
        ? `<path d="M${x} ${y - 16}V${y + 16}M${x - 12} ${y}H${x + 12}" stroke="${GLOW}" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>`
        : ''

    return (
      `<g class="wf-sp" style="animation-delay:${f(-(PATH.length - 1 - i) * 0.55)}s">` +
      `<circle cx="${x}" cy="${y}" r="${f(r * 7)}" fill="url(#wf-st)"/>${flare}<circle cx="${x}" cy="${y}" r="${r}" fill="#f2fdff"/></g>`
    )
  }).join('')
  const guide = `M${PATH.map(([x, y]) => `${x} ${y}`).join('L')}`
  const glitter = Array.from({ length: 10 }, (_, i) => {
    const y = 572 + i * 14 + i * i * 1.6
    const w = 6 + i * 3.4

    return `M${f(296 - w + (i % 2) * 4)} ${f(y)}h${f(w * 2 - (i % 3) * 4)}`
  }).join('')
  const gold = Array.from({ length: 9 }, (_, i) => {
    const y = 572 + i * 13 + i * i * 1.8
    const w = 8 + i * 4

    return `M${f(112 - w + (i % 2) * 5)} ${f(y)}h${f(w * 2 - (i % 3) * 5)}`
  }).join('')
  const swells = SEA.map((s, i) => {
    const d = swell(s.y, s.amp, s.p)
    const layer =
      `<g class="wf-bob" style="--b:${s.bob};animation-delay:${f(-i * 1.7)}s"><g class="wf-roll" style="--d:${s.secs};animation-name:wf-r${i}">` +
      `<path d="${d}V1200H${-s.p}Z" fill="${s.fill}"${i === SEA.length - 1 ? ' fill-opacity=".62"' : ''}/>` +
      `<path class="wf-crest" style="animation-delay:${f(-i * 1.1)}s" d="${d}" fill="none" stroke="${TEAL}" stroke-opacity="${s.glow}" stroke-width="2" stroke-dasharray="34 12 6 12"/></g></g>`

    return layer
  })
  const rollKeys = SEA.map((s, i) => `@keyframes wf-r${i}{to{transform:translateX(${s.p}px)}}`).join('')
  const specks = Array.from({ length: 64 }, (): Pt => {
    const y = 590 + next() ** 0.8 * 400
    const x = next() * 1600

    return [x, y]
  })
  const speckTw = Array.from({ length: 10 }, (_, i) => {
    const x = i < 5 ? next() * 420 : 1180 + next() * 420
    const y = 600 + next() * 360

    return `<circle class="wf-tw" style="animation-delay:${f(-i * 0.9)}s" cx="${f(x)}" cy="${f(y)}" r="2.4" fill="${GLOW}"/>`
  }).join('')
  const streaks = Array.from({ length: 14 }, (_, i) => {
    const x = i < 8 ? -120 + next() * 380 : 1020 + next() * 360
    const y = 600 + next() * 380
    const w = 30 + next() * 60

    return `<path class="wf-stk" style="animation-delay:${f(-next() * 1.1)}s" d="M${f(x)} ${f(y)}h${f(w)}"/>`
  }).join('')
  const fish = [0, 1, 2, 3, 4]
    .map(i => {
      const x = 360 + next() * 70
      const y = 640 + i * 16 + next() * 20
      const delay = f(i * 0.28)

      return (
        `<g transform="translate(${f(x)} ${f(y)}) scale(${f(1.5 + next() * 0.5)})"><g class="wf-ffx" style="animation-delay:${delay}s"><g class="wf-ffy" style="animation-delay:${delay}s">` +
        `<path d="M-10 0C-6 -3 4 -3 10 0C4 2 -6 2 -10 0ZM-3 -1L4 -10L6 -1ZM8 0L14 -5L13 4Z" fill="${GLOW}" fill-opacity=".9"/></g></g></g>`
      )
    })
    .join('')
  const gull = (x: number, y: number, s: number, delay: number) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="wf-gull" style="animation-delay:${delay}s"><path class="wf-wing" style="animation-delay:${delay}s" d="M-12 0Q-6 -9 0 0Q6 -9 12 0" fill="none" stroke="#1a1410" stroke-width="2.6" stroke-linecap="round"/></g></g>`
  const clouds = (x0: number, x1: number, base: number, seed: number) => {
    const rnd = random(seed)
    let x = x0
    let top = ''

    while (x < x1) {
      const r = 36 + rnd() * 96
      top += `a${f(r)} ${f(r * 0.8)} 0 0 1 ${f(r * 1.5)} ${f((rnd() - 0.5) * 70)}`
      x += r * 1.5
    }

    const edge = `M${x0} ${base}${top}`

    // Rounded ends, so a bank that stops mid-sky has no wall.
    return (
      `<path d="M${x0 - 60} ${base + 80}q0 -74 60 -80${top}q60 6 60 80Q${f((x0 + x) / 2)} ${base + 130} ${x0 - 60} ${base + 80}Z" fill="url(#wf-cg)"/>` +
      `<path d="${edge}" fill="none" stroke="#4e6270" stroke-opacity=".42" stroke-width="3"/>`
    )
  }
  const bigWave =
    'M-140 1200V820C-60 780 20 716 130 716C220 718 250 770 330 784C420 748 520 700 640 708C740 716 800 780 880 860C940 920 1000 1040 1060 1200Z'
  const bigCrest = 'M-140 820C-60 780 20 716 130 716C220 718 250 770 330 784C420 748 520 700 640 708C700 712 740 740 780 776'
  const foam = dots([[118, 706], [146, 700], [92, 714], [612, 698], [646, 694], [584, 704], [668, 700], [300, 774], [338, 772]])
  const seams = [0.12, 0.26, 0.4, 0.54, 0.68, 0.82]
    .map(t => `M60 392L${f(cubic(t, TIP_REAR[0], NOTCH_C1[0], NOTCH_C2[0], TIP_FRONT[0]))} ${f(cubic(t, TIP_REAR[1], NOTCH_C1[1], NOTCH_C2[1], TIP_FRONT[1]))}`)
    .join('')
  const lap = swell(446, 3, 64, -320, 560)
  const wake = [0, 1, 2, 3, 4, 5]
    .map(i => `<path class="wf-wk" style="animation-delay:${f(-i * 0.3)}s" d="M${-40 + i * 64} ${448 + (i % 3) * 4}h${26 + (i % 2) * 14}"/>`)
    .join('')
  const wind = [0, 1, 2, 3]
    .map(i => `<path class="wf-wind" style="animation-delay:${f(i * 0.33)}s" d="M${440 - (i % 2) * 40} ${-300 + i * 110}q-40 -10 -80 0t-80 0"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'keys',
      cup: 'none',
      thought: 'orbs',
      ink: '#03080e',
      furniture: WOOD,
      metal: '#3a2c1e',
      paper: SHELL,
      light: { idle: '#2a9e8e', work: TEAL, bright: '#b4f6ea' },
      headTop: 236,
      glowAt: [352, 256],
      device,
      wear: {
        // A flower lei across the chest, well below the eyes, and a hibiscus over one corner of the head.
        front:
          '<g shape-rendering="geometricPrecision">' +
          `<path d="${LEI}" fill="none" stroke="#2f6b3a" stroke-width="13" stroke-linecap="round"/>` +
          `<path d="${LEI}" fill="none" stroke="#fff1d6" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 22"/>` +
          `<path d="${LEI}" fill="none" stroke="#ff4f8b" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 22" stroke-dashoffset="-11"/>` +
          `<path d="${LEI}" fill="none" stroke="#ffd25a" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="0 11"/>` +
          `<g transform="translate(222 240)"><path d="${HIBISCUS}" fill="#ff4f8b"/><circle r="3" fill="#ffd25a"/></g></g>`,
      },
      seatArt:
        // A provisions box lashed with cord, a woven mat on top.
        `<path d="M114 354H188L184 456H118Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M120 376L182 430M182 376L120 430" stroke="${CORD}" stroke-opacity=".75" stroke-width="2.4"/>` +
        `<path d="M116 374H186M118 432H184" stroke="${CORD}" stroke-width="3"/>` +
        '<rect x="106" y="345" width="90" height="10" rx="5" fill="#5a4a32"/>' +
        '<path d="M112 350H190" stroke="#8a7350" stroke-width="1.6" stroke-dasharray="4 3"/>',
      tableArt:
        // A plank lashed to two posts.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="12" rx="3"/>` +
        '<rect x="186" y="342" width="12" height="114"/><rect x="440" y="342" width="12" height="114"/></g>' +
        `<path d="M182 338l20 9M182 347l20 -9M436 338l20 9M436 347l20 -9" stroke="${CORD}" stroke-width="2.2"/>` +
        '<path d="M170 331H466" stroke="#8a7050" stroke-opacity=".5" stroke-width="2"/>',
    },
    style:
      rollKeys +
      '@keyframes wf-show{to{opacity:1}}@keyframes wf-on{to{opacity:1}}@keyframes wf-dim{to{opacity:.25}}' +
      '@keyframes wf-draw{to{stroke-dashoffset:0}}@keyframes wf-turn{to{transform:rotate(360deg)}}' +
      // The sky: twinkles, the star path pulsing down to the horizon, a shooting star now and then.
      '.wf-tw{animation:wf-tw 3.4s ease-in-out infinite alternate}@keyframes wf-tw{to{opacity:.15}}' +
      '.wf-sp{opacity:.55;animation:wf-sp 6s ease-in-out infinite}@keyframes wf-sp{0%,40%,100%{opacity:.55}14%{opacity:1}}' +
      '.st-thinking .wf-sp{animation-duration:2.4s}.st-responding .wf-sp{animation-duration:3.6s}' +
      '.wf-guide{stroke-dasharray:1 1;stroke-dashoffset:1}.st-thinking .wf-guide{animation:wf-draw 1.6s ease-out .2s both}' +
      '.wf-cline{stroke-dasharray:1 1;stroke-dashoffset:1}.st-read .wf-cline{animation:wf-draw 1.6s ease-out .1s both}' +
      '.wf-cst{opacity:.5}.st-read .wf-cst{animation:wf-on .8s ease-out both}' +
      '.wf-shoot{opacity:0;animation:wf-shoot 13s ease-in 3s infinite}' +
      '@keyframes wf-shoot{0%,93%{opacity:0;transform:translate(0,0)}94%{opacity:.85}99%,100%{opacity:0;transform:translate(-150px,60px)}}' +
      '.wf-glit{animation:wf-glit 4s ease-in-out infinite alternate}@keyframes wf-glit{from{opacity:.35}to{opacity:.9}}' +
      // The sea rolls under the canoe; a command makes it rush past.
      '.wf-bob{animation:wf-bob calc(var(--b) * 1s) ease-in-out infinite alternate}@keyframes wf-bob{from{transform:translateY(-3px)}to{transform:translateY(3px)}}' +
      '.wf-roll{animation:linear infinite;animation-duration:calc(var(--d) * var(--k, 1) * 1s)}' +
      '.st-run .wf-sea{--k:.28}' +
      '.wf-crest{animation:wf-cr 5s ease-in-out infinite alternate}@keyframes wf-cr{from{opacity:.65}to{opacity:1}}' +
      '.wf-spk{opacity:.5}.st-run .wf-spk{animation:wf-on 1.2s ease-out both}' +
      '.wf-bloom{opacity:0}.st-run .wf-bloom{animation:wf-bloom 2.6s ease-out .2s both}@keyframes wf-bloom{0%{opacity:0}45%{opacity:1}100%{opacity:.8}}' +
      '.wf-stk{opacity:0}.st-run .wf-stk{animation:wf-stk 1.1s linear infinite}' +
      '@keyframes wf-stk{0%{opacity:0;transform:translateX(0)}15%{opacity:.8}100%{opacity:0;transform:translateX(340px)}}' +
      // The manta glides; it rises toward the glow on a command and sinks away from the squall.
      '.wf-glide{animation:wf-glide 30s ease-in-out infinite alternate}@keyframes wf-glide{from{transform:translate(-50px,6px)}to{transform:translate(60px,-8px)}}' +
      '.wf-manta{transform-box:fill-box;transform-origin:center;animation:wf-flex 5.5s ease-in-out infinite alternate}' +
      '@keyframes wf-flex{from{transform:scale(1,1)}to{transform:scale(.94,1.05)}}' +
      '.st-run .wf-manta{animation:wf-up 2.4s ease-out both}@keyframes wf-up{to{transform:translateY(-26px) scale(1.12)}}' +
      '.st-error .wf-manta{animation:wf-down 2.4s ease-in both}@keyframes wf-down{to{transform:translateY(22px) scale(.82);opacity:.35}}' +
      '.wf-mhalo{opacity:.55}.st-run .wf-mhalo{animation:wf-on 1.4s ease-out both}' +
      // Tool: flying fish skip over the swell.
      '.wf-ffx{opacity:0}.st-tool .wf-ffx{animation:wf-ffx 1.8s linear infinite}' +
      '@keyframes wf-ffx{0%{opacity:0;transform:translateX(0)}10%,85%{opacity:1}100%{opacity:0;transform:translateX(-300px)}}' +
      '.st-tool .wf-ffy{animation:wf-ffy 1.8s infinite}' +
      '@keyframes wf-ffy{0%{transform:translateY(0);animation-timing-function:ease-out}50%{transform:translateY(-56px);animation-timing-function:ease-in}100%{transform:translateY(0)}}' +
      // Web: a seabird is sent up to look for land; it circles over the sail, clear of the chat column.
      '.wf-tern{opacity:0}.st-web .wf-tern{animation:wf-tern 5s ease-in-out both}' +
      '@keyframes wf-tern{0%{opacity:0;transform:translate(0,0) scale(.5)}12%{opacity:.9;transform:translate(70px,-60px) scale(.8)}' +
      '35%{transform:translate(250px,-110px) scale(1)}55%{transform:translate(340px,-20px) scale(1)}75%{transform:translate(220px,40px) scale(.9)}' +
      '90%{opacity:.9;transform:translate(90px,-30px) scale(.8)}100%{opacity:0;transform:translate(150px,-130px) scale(.5)}}' +
      '.wf-wing{transform-box:fill-box;transform-origin:50% 100%;animation:wf-wing .6s ease-in-out infinite alternate}@keyframes wf-wing{to{transform:scaleY(.4)}}' +
      // Error: a squall rolls in over the stars, rain slants, the swell heaves, a soft glow in the cloud.
      '.wf-squall{opacity:0}.st-error .wf-squall{animation:wf-show 1.2s ease-out both}' +
      '.st-error .wf-cl{animation:wf-clin 2s cubic-bezier(.2,.7,.3,1) both}@keyframes wf-clin{from{transform:translateX(-320px)}to{transform:translateX(0)}}' +
      '.st-error .wf-cl2{animation-name:wf-clin2}@keyframes wf-clin2{from{transform:translateX(320px)}to{transform:translateX(0)}}' +
      '.wf-rain{opacity:0}.st-error .wf-rain{animation:wf-show 1s ease-out .3s both}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: one soft glow every 4 s, ramping in over 160 ms, a small area.
      '.wf-flash{opacity:0}.st-error .wf-flash{animation:wf-flash 4s ease-in-out .8s infinite}@keyframes wf-flash{0%,100%{opacity:0}4%{opacity:.8}14%{opacity:0}}' +
      '.st-error .wf-stars,.st-error .wf-path,.st-error .wf-crest{animation:wf-dim 1.4s ease-out both}' +
      '.st-error .wf-bob,.st-error .wf-lapy{animation:wf-heave 2.2s ease-in-out infinite alternate}' +
      '@keyframes wf-heave{from{transform:translateY(8px)}to{transform:translateY(-16px)}}' +
      '.wf-big{opacity:0;transform:translateY(260px)}.st-error .wf-big{animation:wf-big 1.8s cubic-bezier(.2,.7,.3,1) .1s both}' +
      '@keyframes wf-big{to{opacity:1;transform:translateY(0)}}' +
      '.wf-bigb{animation:wf-heave 2.6s ease-in-out infinite alternate}' +
      '.wf-sdk{opacity:0}.st-error .wf-sdk{animation:wf-show 1.4s ease-out both}' +
      // Done: the island rises under the star path, dawn glows behind it, birds circle, the stars pale.
      '.wf-dawn{opacity:0}.st-done .wf-dawn{animation:wf-show 2.6s ease-out .1s both}' +
      '.wf-isle{transform:translateY(100px)}.st-done .wf-isle{animation:wf-isle 2.4s cubic-bezier(.2,.75,.3,1) .1s both}@keyframes wf-isle{to{transform:translateY(0)}}' +
      '.wf-sun{transform:translateY(34px)}.st-done .wf-sun{animation:wf-isle 3.2s ease-out .4s both}' +
      '.wf-gold{opacity:0}.st-done .wf-gold{animation:wf-show 2.4s ease-out .6s both}' +
      '.wf-birds{opacity:0}.st-done .wf-birds{animation:wf-show 1.2s ease-out 1s both}' +
      '.wf-gull{animation:wf-gull 5s ease-in-out infinite alternate}@keyframes wf-gull{from{transform:translate(-14px,4px)}to{transform:translate(16px,-6px)}}' +
      '.st-done .wf-stars{animation:wf-fade 3s ease-out both}@keyframes wf-fade{to{opacity:.5}}' +
      // The canoe: the sail breathes, fills on a command and luffs in the squall; the streamer, the wake, the bow spray.
      '.wf-sail{animation:wf-breathe 7s ease-in-out infinite alternate}@keyframes wf-breathe{to{transform:scale(1.012,1.006)}}' +
      '.st-run .wf-sail{animation:wf-fill 1.8s cubic-bezier(.2,.8,.3,1) both}' +
      '@keyframes wf-fill{0%{transform:scale(.98,1)}35%{transform:scale(1.08,1.04)}60%{transform:scale(1.04,1.02)}100%{transform:scale(1.06,1.03)}}' +
      '.st-error .wf-sail{animation:wf-luff .8s ease-in-out infinite alternate}@keyframes wf-luff{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg) scale(.98,1)}}' +
      '.wf-belly{opacity:0}.st-run .wf-belly{animation:wf-show 1s ease-out .1s both}' +
      '.wf-puff{opacity:0}.st-run .wf-puff{animation:wf-puff 1.1s cubic-bezier(.2,.8,.3,1) .1s both}' +
      '@keyframes wf-puff{0%{opacity:0;transform:translateY(46px)}50%{opacity:1}100%{opacity:1;transform:translateY(0)}}' +
      '.st-run .wf-edge{animation:wf-dim .6s ease-out both}' +
      '.wf-flag{transform-box:fill-box;transform-origin:100% 50%;animation:wf-flag 2.2s ease-in-out infinite alternate}' +
      '@keyframes wf-flag{from{transform:rotate(-6deg) scaleX(.9)}to{transform:rotate(5deg) scaleX(1)}}' +
      '.st-run .wf-flag{animation-duration:.4s}.st-error .wf-flag{animation-duration:.3s}' +
      '.wf-wind{opacity:0}.st-run .wf-wind{animation:wf-wind 1.4s ease-in infinite}' +
      '@keyframes wf-wind{0%{opacity:0;transform:translateX(0)}25%{opacity:.6}100%{opacity:0;transform:translateX(-340px)}}' +
      '.wf-lap{animation:wf-lap 3.4s linear infinite}@keyframes wf-lap{to{transform:translateX(64px)}}.st-run .wf-lap{animation-duration:.7s}' +
      '.wf-bow{opacity:0;transform-box:fill-box;transform-origin:100% 100%}.st-run .wf-bow{animation:wf-bow 1.2s ease-out infinite}' +
      '@keyframes wf-bow{0%{opacity:0;transform:scale(.3)}25%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.25)}}' +
      '.wf-wk{opacity:0}.st-responding .wf-wk,.st-run .wf-wk{animation:wf-wk 1.8s linear infinite}.st-run .wf-wk{animation-duration:.8s}' +
      '@keyframes wf-wk{0%{opacity:0;transform:translateX(0)}20%{opacity:.8}100%{opacity:0;transform:translateX(220px)}}' +
      // The star compass: a spark walks the ring while thinking; the shells light in turn while working.
      '.st-thinking .wf-orb{animation:wf-turn 2.4s linear infinite}.st-thinking .wf-orb circle{opacity:.9}' +
      '.st-responding .wf-sl,.st-tool .wf-sl,.st-web .wf-sl,.st-read .wf-sl{animation:wf-sl 2.4s ease-in-out infinite}' +
      '@keyframes wf-sl{0%,45%,100%{opacity:0}15%{opacity:.75}}' +
      '.st-tool .wf-sl,.st-web .wf-sl{animation-duration:1.2s}' +
      '.st-run .wf-sl,.st-done .wf-sl{animation:wf-lit 1s ease-out both}@keyframes wf-lit{to{opacity:.6}}' +
      '.wf-prog{transform-box:fill-box;transform-origin:0 50%;animation:wf-prog 1.8s ease-in-out infinite}@keyframes wf-prog{from{transform:scaleX(.08)}to{transform:scaleX(1)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="wf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02050a"/><stop offset=".42" stop-color="#050f1b"/>' +
      '<stop offset=".56" stop-color="#0c2232"/><stop offset=".6" stop-color="#071824"/></linearGradient>' +
      '<radialGradient id="wf-mw"><stop offset="0" stop-color="#a9c6e8" stop-opacity=".2"/><stop offset=".5" stop-color="#7f9fd0" stop-opacity=".08"/>' +
      '<stop offset="1" stop-color="#7f9fd0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wf-rf"><stop offset="0" stop-color="#02050a" stop-opacity=".55"/><stop offset="1" stop-color="#02050a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="wf-cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a35"/><stop offset=".5" stop-color="#0e1820"/><stop offset="1" stop-color="#070c12"/></linearGradient>' +
      '<linearGradient id="wf-cf" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#d8eef2" stop-opacity=".6"/>' +
      '<stop offset=".22" stop-color="#d8eef2" stop-opacity=".6"/><stop offset=".265" stop-color="#d8eef2" stop-opacity=".12"/><stop offset="1" stop-color="#d8eef2" stop-opacity=".12"/></linearGradient>' +
      '<linearGradient id="wf-wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#174152"/><stop offset=".4" stop-color="#0c2230"/><stop offset="1" stop-color="#071520"/></linearGradient>' +
      `<radialGradient id="wf-st"><stop offset="0" stop-color="#e8fbff" stop-opacity=".7"/><stop offset=".3" stop-color="${GLOW}" stop-opacity=".2"/>` +
      `<stop offset="1" stop-color="${GLOW}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="wf-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1c28"/><stop offset="1" stop-color="#040d15"/></linearGradient>' +
      `<radialGradient id="wf-bl"><stop offset="0" stop-color="${TEAL}" stop-opacity=".34"/><stop offset=".45" stop-color="${TEAL}" stop-opacity=".13"/>` +
      `<stop offset="1" stop-color="${TEAL}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="wf-mg"><stop offset="0" stop-color="${TEAL}" stop-opacity=".28"/><stop offset="1" stop-color="${TEAL}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="wf-dw"><stop offset="0" stop-color="#ffc07a" stop-opacity=".55"/><stop offset=".35" stop-color="#ff8f6a" stop-opacity=".24"/>' +
      '<stop offset=".7" stop-color="#b85a7a" stop-opacity=".08"/><stop offset="1" stop-color="#b85a7a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wf-sh"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wf-lg"><stop offset="0" stop-color="#c8dcf0" stop-opacity=".38"/><stop offset="1" stop-color="#c8dcf0" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#wf-sky)"/>' +
      // The Milky Way, the stars and the bird asterism.
      '<g class="wf-stars">' +
      '<g transform="translate(760 250) rotate(-16)"><ellipse rx="1000" ry="150" fill="url(#wf-mw)"/><ellipse cx="-220" cy="-16" rx="640" ry="74" fill="url(#wf-mw)"/>' +
      '<ellipse cx="60" cy="16" rx="780" ry="40" fill="url(#wf-rf)"/></g>' +
      `<path d="${dots(dust.slice(0, 200))}" stroke="#cfe0ff" stroke-opacity=".32" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="${dots(dust.slice(200))}" stroke="#dfeaff" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/>` +
      `<path d="${dots(small)}" stroke="#e6f2ff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="${dots(mid)}" stroke="#eef8ff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="${dots(big)}" stroke="#f4fcff" stroke-opacity=".85" stroke-width="3.2" stroke-linecap="round"/>` +
      twinkle +
      `<path class="wf-cline" pathLength="1" d="${BIRD_LINES}" fill="none" stroke="${GLOW}" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round"/>` +
      BIRD_STARS.map(([x, y]) => `<circle class="wf-cst" cx="${x}" cy="${y}" r="2.6" fill="#f2fdff"/>`).join('') +
      `<g transform="translate(560 50)"><path class="wf-shoot" d="M0 0l-44 18" stroke="#f2fdff" stroke-width="2" stroke-linecap="round"/></g>` +
      '</g>' +
      // Dawn, the island and the path of stars, all tied to the horizon.
      '<g class="mv-b"><g class="wf-dawn"><ellipse cx="180" cy="562" rx="760" ry="240" fill="url(#wf-dw)"/>' +
      '<circle cx="112" cy="562" r="110" fill="url(#wf-sh)"/></g>' +
      '<g class="wf-sun"><circle cx="112" cy="566" r="22" fill="#ffe0a0"/></g>' +
      '<g class="wf-isle"><path d="M130 563C160 557 180 550 200 540C214 532 222 520 232 516C244 512 252 498 264 488C276 478 290 472 302 470C314 472 324 482 336 494C352 510 372 526 396 540C420 552 444 558 470 563Z" fill="#06100d"/>' +
      '<path d="M200 540C214 532 222 520 232 516C244 512 252 498 264 488C276 478 290 472 302 470C314 472 324 482 336 494" fill="none" stroke="#ffc27a" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M432 560q-2 -14 4 -28M448 561q0 -12 6 -22" fill="none" stroke="#06100d" stroke-width="3"/>' +
      '<path d="M436 532q-10 -2 -16 6M436 532q-8 -8 -16 -6M436 532q8 -6 16 -2M436 532q10 2 14 10M454 539q-8 -3 -13 3M454 539q7 -5 13 -1M454 539q8 2 10 9" fill="none" stroke="#06100d" stroke-width="2.4" stroke-linecap="round"/></g>' +
      `<g class="wf-path"><path class="wf-guide" pathLength="1" d="${guide}" fill="none" stroke="${GLOW}" stroke-opacity=".45" stroke-width="1.6"/>${path}</g></g>` +
      // The squall over the sky.
      '<g class="wf-squall"><rect width="1600" height="600" fill="#020509" fill-opacity=".62"/>' +
      `<g class="wf-flash"><circle cx="330" cy="150" r="200" fill="url(#wf-lg)"/>` +
      '<path d="M344 70l-14 52l14 4l-18 60l10 3l-16 46" fill="none" stroke="#dfe9f2" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round"/></g>' +
      `<g class="wf-cl">${clouds(-240, 1000, 150, 5)}${clouds(-240, 860, 290, 7)}</g><g class="wf-cl wf-cl2">${clouds(780, 1760, 230, 9)}</g></g>` +
      // The sea: swell, plankton, the manta below, the reflections, and what a command or a squall does to it.
      '<g class="mv-b"><g class="wf-sea">' +
      '<rect y="560" width="1600" height="640" fill="url(#wf-sea)"/>' +
      '<path d="M0 561H1600" stroke="#7fd8e8" stroke-opacity=".18" stroke-width="1.5"/>' +
      `<path class="wf-glit" d="${glitter}" stroke="${GLOW}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>` +
      `<g class="wf-gold"><ellipse cx="180" cy="574" rx="520" ry="24" fill="url(#wf-dw)"/><path d="${gold}" stroke="#ffcf8a" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/></g>` +
      swells.slice(0, 4).join('') +
      '<g transform="translate(272 830)"><g class="wf-glide"><g class="wf-manta">' +
      '<ellipse class="wf-mhalo" rx="330" ry="120" fill="url(#wf-mg)"/>' +
      `<g transform="scale(1.22 .66)"><path d="${MANTA}" fill="#123a4a" fill-opacity=".92"/>` +
      '<path d="M-150 4C-100 -12 -60 -22 -30 -26L-40 -6ZM150 4C100 -12 60 -22 30 -26L40 -6Z" fill="#d8f2ee" fill-opacity=".22"/>' +
      `<path d="${MANTA}" fill="none" stroke="${TEAL}" stroke-opacity=".6" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` +
      `<path d="M-200 14L-150 22M200 14L150 22M-110 -24L-70 -34M110 -24L70 -34" stroke="${GLOW}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round" vector-effect="non-scaling-stroke"/></g>` +
      '</g></g></g>' +
      swells[4] +
      `<g class="wf-spk"><path d="${dots(specks)}" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2.2" stroke-linecap="round"/>${speckTw}</g>` +
      '<g class="wf-bloom"><ellipse cx="300" cy="820" rx="460" ry="220" fill="url(#wf-bl)"/><ellipse cx="1380" cy="900" rx="420" ry="180" fill="url(#wf-bl)"/></g>' +
      `<g stroke="${GLOW}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round">${streaks}</g>` +
      fish +
      '<rect class="wf-sdk" y="560" width="1600" height="640" fill="#01040a" fill-opacity=".4"/>' +
      `<g class="wf-big"><g class="wf-bigb"><path d="${bigWave}" fill="url(#wf-wv)"/>` +
      `<path d="${bigCrest}" fill="none" stroke="url(#wf-cf)" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="${foam}" stroke="url(#wf-cf)" stroke-width="5" stroke-linecap="round"/></g></g>` +
      '</g></g>' +
      `<g class="wf-rain">${rain({ seed: 21, count: 46, length: [26, 48], slant: -220, seconds: 0.9, stroke: '#9fb8c4', opacity: 0.3 })}</g>` +
      // Done: birds over the island. Web: a tern sent off from the mast toward the horizon.
      `<g class="mv-b"><g class="wf-birds">${gull(150, 500, 1.3, 0)}${gull(186, 482, 1, -1.4)}${gull(116, 476, 1.1, -2.6)}</g></g>`,
    nook:
      '<defs>' +
      '<linearGradient id="wf-sg" gradientUnits="userSpaceOnUse" x1="-70" y1="-436" x2="436" y2="412"><stop offset="0" stop-color="#46352a"/><stop offset="1" stop-color="#1e1712"/></linearGradient>' +
      '<radialGradient id="wf-bg"><stop offset="0" stop-color="#e0b47e" stop-opacity=".62"/><stop offset=".45" stop-color="#b08458" stop-opacity=".34"/><stop offset="1" stop-color="#7a6648" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="wf-rim" gradientUnits="userSpaceOnUse" x1="-70" y1="0" x2="436" y2="0"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".1"/>' +
      '<stop offset=".16" stop-color="#ffe2b0" stop-opacity=".1"/><stop offset=".3" stop-color="#ffe2b0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe2b0" stop-opacity=".85"/></linearGradient>' +
      `<clipPath id="wf-sc"><path d="${SAIL}"/></clipPath>` +
      '</defs>' +
      // The far hull's prow, peeking over the near one.
      '<path d="M-64 326C-54 342 -48 370 -34 392C-18 406 20 408 60 408H420V430H-30C-52 420 -66 380 -64 326Z" fill="#100b07" stroke="#3a2a1c" stroke-width="2"/>' +
      // The sail, hung from its apex: cloth, woven bands and seams, the starburst, the belly that fills, the spars.
      `<g transform="translate(${APEX[0]} ${APEX[1]})"><g class="wf-sail"><g transform="translate(${-APEX[0]} ${-APEX[1]})">` +
      `<path d="${SAIL}" fill="url(#wf-sg)" fill-opacity=".96"/>` +
      `<g clip-path="url(#wf-sc)"><ellipse class="wf-belly" cx="170" cy="20" rx="160" ry="240" transform="rotate(20 170 20)" fill="url(#wf-bg)"/></g>` +
      `<path d="${seams}${band(0.38)}${band(0.62)}${band(0.84)}" fill="none" stroke="#5e4a36" stroke-opacity=".7" stroke-width="1.6"/>` +
      `<path d="${burst(176, -40, 36)}" fill="#d97757" fill-opacity=".36"/>` +
      `<path class="wf-edge" d="${TOP_EDGE}" fill="none" stroke="${TEAL}" stroke-opacity=".32" stroke-width="2.4"/>` +
      `<g class="wf-puff"><path d="${PUFF}${TOP_EDGE.replace('M436 -262', '')}Z" fill="url(#wf-sg)"/>` +
      `<path d="${PUFF}" fill="none" stroke="url(#wf-rim)" stroke-width="3" stroke-linecap="round"/></g>` +
      '<g fill="none" stroke-linecap="round"><path d="M58 414C200 280 360 20 438 -264q10 -14 2 -32M60 414C30 200 -30 -150 -72 -440q-8 -14 6 -32" stroke="#120c08" stroke-width="8"/>' +
      '<path d="M58 414C200 280 360 20 438 -264M60 414C30 200 -30 -150 -72 -440" stroke="#6a5438" stroke-opacity=".55" stroke-width="2"/></g>' +
      '</g></g></g>' +
      // The mast, its stays and a streamer at the top.
      '<path d="M64 420L40 -330" stroke="#140e09" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M40 -330L-118 344M40 -330L440 404" stroke="#0c0906" stroke-width="2"/>' +
      '<g transform="translate(40 -330)"><g class="wf-flag"><path d="M0 0C-20 -4 -36 4 -58 0C-42 8 -20 10 0 8Z" fill="#c9a46a" fill-opacity=".85"/></g></g>' +
      `<g stroke="${GLOW}" stroke-width="2" stroke-linecap="round" fill="none">${wind}</g>` +
      // Web: a tern sent up from the masthead circles the canoe, out over the sail and back.
      '<g transform="translate(70 -350)"><g class="wf-tern"><path class="wf-wing" d="M-34 2Q-18 -18 0 0Q18 -18 34 2" fill="none" stroke="#eef8f6" stroke-width="4" stroke-linecap="round"/></g></g>',
    front:
      // The near hull with its upswept prow, the lashings along the gunwale, the water lapping and the bow spray.
      `<path d="M-124 340C-110 352 -100 382 -84 402C-66 416 -30 420 30 420H480V470H-70C-100 450 -118 400 -124 340Z" fill="${HULL}"/>` +
      `<path d="M-118 352C-104 380 -80 408 -30 414H480" fill="none" stroke="${WOOD_EDGE}" stroke-width="3"/>` +
      `<path d="M-10 427H470" stroke="${CORD}" stroke-opacity=".5" stroke-width="9" stroke-dasharray="3 31"/>` +
      `<g fill="${WOOD}" stroke="${WOOD_EDGE}"><rect x="-14" y="404" width="22" height="12" rx="2"/><rect x="296" y="404" width="22" height="12" rx="2"/></g>` +
      `<g class="wf-lapy"><g class="wf-lap"><path d="${lap}V480H-320Z" fill="#071822"/>` +
      `<path d="${lap}" fill="none" stroke="${TEAL}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="10 8"/></g>` +
      `<g stroke="${GLOW}" stroke-width="2.4" stroke-linecap="round">${wake}</g></g>` +
      '<g transform="translate(-104 446)"><g class="wf-bow">' +
      `<path d="M0 0C-14 -20 -34 -30 -58 -30M4 -2C-4 -30 -22 -48 -44 -56M10 -2C8 -32 -2 -56 -20 -70" fill="none" stroke="${GLOW}" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="${dots([[-62, -40], [-52, -64], [-30, -82], [-68, -20], [-12, -84]])}" stroke="${GLOW}" stroke-width="4" stroke-linecap="round"/></g></g>`,
  }
}
