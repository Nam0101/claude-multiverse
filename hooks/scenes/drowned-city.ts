import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Drowned City: a flooded metropolis at night. Skyscrapers stand in black water under a clouded moon, their lit
// windows streaking down the reflections; the drowned streets show only as a traffic light, a sign and a car roof.
// Claude works on a raft under a tarp, in a sou'wester and rain boots, the laptop in a hard case. Run rolls a huge
// swell between the towers that lifts the raft; error throws water over the desk and the towers' lights fail; done
// brings a ferry gliding in and the windows light up again, one after another.
const TEAL = '#5fb3c9'
const PALE = '#bfe6ef'
const WARM = '#f2c46b'
const HAT = '#e0ac34'
const HAT_DARK = '#7d5a12'
const NEAR = '#060e12'
const MID = '#08141a'
const FAR = '#0c1b22'
const LEAF = '#0e2a1e'
const DRUM = '#1d4656'
const DRUM_EDGE = '#2f6476'
const WOOD = '#2a2319'
const WOOD_EDGE = '#3d3324'
const POLE = '#0a1418'

type Tower = {
  x: number
  w: number
  top: number
  base: number
  fill: string
  /** The body's outline, when it is not a plain box. */
  shape?: string
  /** Where the window grid starts. */
  wtop?: number
  cols: number
  fh: number
  lit: number
  on: number
  bands: number
  seed: number
  glow: string
  onGlow: string
  dim: number
  /** Whether its lights fail on an error. */
  fails: boolean
  /** When done starts lighting it, floor band by floor band from the bottom. */
  d0: number
  crown: string
  /** A band that flickers now and then, or -1. */
  flicker: number
}

/** A tower: its body, a dim window grid, lit windows in floor bands, and its reflection with streaks for the lights. */
function tower(t: Tower): { body: string; refl: string } {
  const next = random(t.seed)
  const mx = t.w * 0.12
  const step = (t.w - 2 * mx) / t.cols
  const ww = f(step * 0.5)
  const wh = Math.round(t.fh * 0.5)
  const y0 = t.wtop ?? t.top + t.fh
  const floors = Math.floor((t.base - 6 - y0) / t.fh)
  const lit: string[][] = Array.from({ length: t.bands }, () => [])
  const on: string[][] = Array.from({ length: t.bands }, () => [])
  let grid = ''
  let rl = ''
  let ro = ''

  for (let c = 0; c < t.cols; c += 1) {
    const cx = Math.round(t.x + mx + (c + 0.5) * step)

    grid += `M${cx} ${f(y0)}V${f(y0 + floors * t.fh)}`

    for (let k = 0; k < floors; k += 1) {
      const r = next()
      const y = y0 + k * t.fh
      const band = Math.min(t.bands - 1, Math.floor(((floors - 1 - k) / floors) * t.bands))
      const seg = `M${cx} ${y}v${wh}`
      const ry = Math.round(t.base + (t.base - y - wh) * 0.82)
      const rseg = ry < 900 ? `M${cx} ${ry}v${Math.round(wh * 2.4)}` : ''

      if (r < t.lit) {
        lit[band]?.push(seg)
        rl += rseg
      } else if (r < t.lit + t.on) {
        on[band]?.push(seg)
        ro += rseg
      }
    }
  }

  const fail = (i: number) => f(t.d0 * 0.6 + (t.bands - 1 - i) * 0.08)
  const litPaths = lit
    .map((segs, i) => {
      if (segs.length === 0) return ''
      const cls = t.fails ? ' class="dc-lit"' : i === t.flicker ? ' class="dc-flk"' : ''

      return `<path${cls}${t.fails ? ` style="--e:${fail(i)}s"` : ''} d="${segs.join('')}" stroke="${t.glow}"/>`
    })
    .join('')
  const onPaths = on
    .map((segs, i) => (segs.length === 0 ? '' : `<path class="dc-on" style="--d:${f(t.d0 + i * 0.16)}s" d="${segs.join('')}" stroke="${t.onGlow}"/>`))
    .join('')
  const reach = Math.min(1100 - t.base, (t.base - t.top) * 0.82)

  return {
    body:
      (t.shape === undefined ? `<rect x="${t.x}" y="${t.top}" width="${t.w}" height="${t.base - t.top}" fill="${t.fill}"/>` : `<path d="${t.shape}" fill="${t.fill}"/>`) +
      t.crown +
      `<g fill="none" stroke-width="${ww}"><path d="${grid}" stroke="#14303a" stroke-opacity=".5" stroke-dasharray="${f(wh)} ${f(t.fh - wh)}"/>` +
      `<g stroke-opacity="${t.dim}">${litPaths}${onPaths}</g></g>`,
    refl:
      `<rect x="${t.x}" y="${t.base}" width="${t.w}" height="${f(reach)}" fill="${t.fill}" fill-opacity=".72"/>` +
      `<g fill="none" stroke-width="${ww}" stroke-opacity="${f(t.dim * 0.42)}">` +
      `<path class="dc-sh${t.fails ? ` dc-rlit" style="--e:${fail(t.bands - 1)}s` : ''}" d="${rl}" stroke="${t.glow}"/>` +
      (t.dim < 0.4 ? '' : `<path class="dc-ron" style="--d:${f(t.d0 + t.bands * 0.08)}s" d="${ro}" stroke="${t.onGlow}"/>`) +
      '</g>',
  }
}

const CLOUD = 'M-120 18C-132 -2 -104 -18 -82 -10C-74 -34 -36 -42 -12 -22C4 -46 52 -44 66 -16C92 -24 122 -4 114 18Z'

/** A cloud bank, moonlit along its top where `rim` > 0. */
function cloud(x: number, y: number, s: number, rim: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    (rim > 0 ? `<path d="${CLOUD}" fill="#6f98a3" fill-opacity="${rim}" transform="translate(-3 -5)"/>` : '') +
    `<path d="${CLOUD}" fill="#0a151a"/></g>`
  )
}

/** The laptop sitting in an open hard case, a handheld radio and a thermos. Self-contained for the portals. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 12}" y="314" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const led = activity === 'web' || activity === 'tool' ? 'dc-led dc-ledq' : 'dc-led'

  return (
    // The case's lid, tipped back behind the screen, with its foam.
    '<path d="M350 326L384 220L399 224L366 328Z" fill="#1f3940" stroke="#335a64" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M362 318L388 234" stroke="#2a4a52" stroke-width="5" stroke-dasharray="3 3"/>' +
    // The tray, the laptop in it, a clear sleeve over the keys.
    '<rect x="236" y="314" width="132" height="16" rx="3" fill="#1f3940" stroke="#335a64" stroke-width="2"/>' +
    '<rect x="244" y="310" width="100" height="6" rx="2" fill="#2a3a40"/>' +
    keys +
    '<path d="M330 314L354 234L364 236L340 316Z" fill="#2a3a40"/>' +
    `<path d="M331 312L354 238L358 239L335 314Z" fill="${light}"/>` +
    `<path d="M331 312L354 238L342 242L322 312Z" fill="${light}" fill-opacity=".16"/>` +
    '<path d="M240 308H348" stroke="#e6f6fa" stroke-opacity=".3" stroke-width="1.4"/>' +
    `<rect x="250" y="320" width="11" height="7" rx="1.5" fill="${HAT}"/><rect x="340" y="320" width="11" height="7" rx="1.5" fill="${HAT}"/>` +
    // The radio.
    '<path d="M414 292V258" stroke="#1a262b" stroke-width="4" stroke-linecap="round"/>' +
    '<rect x="398" y="290" width="22" height="40" rx="4" fill="#1a262b" stroke="#34505a" stroke-width="2"/>' +
    '<path d="M403 310H415M403 316H415M403 322H415" stroke="#34505a" stroke-width="1.6"/>' +
    `<circle class="${led}" cx="405" cy="299" r="2.4" fill="#ff6a5a"/>` +
    // The thermos.
    '<rect x="430" y="300" width="17" height="30" rx="4" fill="#355f53" stroke="#4f8a78" stroke-width="1.6"/><rect x="428" y="295" width="21" height="7" rx="2" fill="#22403a"/>'
  )
}

const WAVE40 = (x: number, y: number, n: number, amp: number) => `M${x} ${y}q10 ${-amp} 20 0${'t20 0'.repeat(n)}`

export function drownedCityWorld(): World {
  const next = random(5150)

  // The far skyline: one path of boxes, faint windows, and their reflection.
  let farBody = ''
  let farRefl = ''
  let farWin = ''

  for (let x = -20; x < 1620; ) {
    const w = 40 + next() * 70
    const top = 440 + next() * 120

    farBody += `M${f(x)} 606V${f(top)}h${f(w)}V606Z`
    farRefl += `M${f(x)} 600h${f(w)}v${f((606 - top) * 0.7)}h${f(-w)}Z`

    for (let k = 0; k < 3; k += 1) {
      if (next() < 0.55) farWin += `M${f(x + 6 + next() * (w - 12))} ${f(top + 10 + next() * (585 - top))}h3v4h-3Z`
    }

    if (next() < 0.25) farBody += `M${f(x + w / 2 - 1.5)} ${f(top)}v-26h3v26Z`
    x += w + next() * 16 - 6
  }

  const towers = {
    left: tower({
      x: -40, w: 240, top: 40, base: 700, wtop: 118, cols: 7, fh: 18, lit: 0.15, on: 0.25, bands: 9, seed: 11,
      glow: WARM, onGlow: WARM, dim: 0.82, fails: true, d0: 0.15, flicker: -1, fill: NEAR,
      shape: 'M-40 700V60L-6 44L22 70L52 36L84 62L110 92L140 78L170 110L200 104V700Z',
      crown: '',
    }),
    right: tower({
      x: 1380, w: 230, top: 150, base: 690, cols: 7, fh: 18, lit: 0.16, on: 0.25, bands: 9, seed: 23,
      glow: PALE, onGlow: WARM, dim: 0.72, fails: true, d0: 0.35, flicker: -1, fill: NEAR,
      crown:
        `<g fill="${NEAR}"><rect x="1406" y="122" width="178" height="30"/><rect x="1440" y="96" width="110" height="28"/>` +
        '<path d="M1380 372H1328L1336 384L1322 392L1332 400H1380Z"/></g>' +
        `<path d="M1495 96V44" stroke="${NEAR}" stroke-width="5"/>` +
        '<path d="M1382 152V690" stroke="#1b3540" stroke-width="3"/>' +
        `<path d="M1334 398C1328 430 1340 452 1332 486" fill="none" stroke="${POLE}" stroke-width="2"/>`,
    }),
  }
  const mids = [
    tower({
      x: 212, w: 118, top: 340, base: 632, cols: 5, fh: 13, lit: 0.12, on: 0.22, bands: 4, seed: 31,
      glow: WARM, onGlow: WARM, dim: 0.6, fails: false, d0: 0.6, flicker: 2, fill: MID,
      crown:
        `<g fill="${MID}"><path d="M236 341V316M262 341V316M288 341V316" stroke="${MID}" stroke-width="4"/><rect x="230" y="288" width="64" height="30" rx="4"/>` +
        '<path d="M226 290L262 268L298 290Z"/></g>' +
        `<g fill="${LEAF}"><circle cx="306" cy="332" r="12"/><circle cx="320" cy="328" r="10"/><circle cx="296" cy="336" r="8"/></g>` +
        `<path d="M302 340C308 380 298 420 304 470C308 500 300 520 304 548" fill="none" stroke="${LEAF}" stroke-width="4"/>`,
    }),
    tower({
      x: 520, w: 84, top: 420, base: 632, cols: 4, fh: 12, lit: 0.07, on: 0.12, bands: 3, seed: 37,
      glow: PALE, onGlow: WARM, dim: 0.32, fails: false, d0: 1.1, flicker: -1, fill: MID,
      crown: `<path d="M555 420L562 352L569 420Z" fill="${MID}"/>`,
    }),
    tower({
      x: 690, w: 136, top: 466, base: 632, wtop: 504, cols: 6, fh: 12, lit: 0.06, on: 0.11, bands: 3, seed: 41,
      glow: WARM, onGlow: WARM, dim: 0.32, fails: false, d0: 1.5, flicker: -1, fill: MID,
      shape: 'M690 632V482L716 466L740 490L770 472L800 502L826 478V632Z',
      crown: '<path d="M740 490L748 470M800 502L810 480" stroke="#132a32" stroke-width="3"/>',
    }),
    tower({
      x: 905, w: 104, top: 392, base: 632, cols: 5, fh: 12, lit: 0.08, on: 0.12, bands: 3, seed: 43,
      glow: PALE, onGlow: WARM, dim: 0.32, fails: false, d0: 1.3, flicker: 1, fill: MID,
      crown: `<g fill="${MID}"><rect x="925" y="364" width="64" height="30"/><rect x="946" y="342" width="22" height="24"/></g>`,
    }),
    tower({
      x: 1100, w: 124, top: 300, base: 632, cols: 5, fh: 13, lit: 0.1, on: 0.16, bands: 4, seed: 47,
      glow: WARM, onGlow: WARM, dim: 0.5, fails: false, d0: 0.9, flicker: 1, fill: MID,
      crown:
        `<g fill="${MID}"><rect x="1128" y="282" width="68" height="20"/><path d="M1134 280a13 13 0 0 1 22 -13z"/></g>` +
        `<path d="M1176 282V214" stroke="${MID}" stroke-width="4"/>`,
    }),
    tower({
      x: 1240, w: 100, top: 440, base: 632, cols: 4, fh: 12, lit: 0.1, on: 0.16, bands: 3, seed: 53,
      glow: PALE, onGlow: WARM, dim: 0.45, fails: false, d0: 0.7, flicker: -1, fill: MID,
      crown: '',
    }),
  ]

  // Ripples on the water, finer far off and longer near, in three layers that sway out of step.
  const ripples = (count: number, y0: number, y1: number, len: number) => {
    let d = ''

    for (let i = 0; i < count; i += 1) {
      const y = y0 + next() * (y1 - y0)
      const l = len * (0.5 + (y - 600) / 400) * (0.6 + next() * 0.8)

      d += `M${f(-40 + next() * 1680)} ${f(y)}h${f(l)}`
    }

    return d
  }

  // The moon's path on the water: glints that widen toward the viewer.
  const glints = [0, 1].map(g => {
    let d = ''

    for (let i = g; i < 18; i += 2) {
      const y = 612 + i * 20 + next() * 6
      const half = 5 + (y - 600) * 0.14 + next() * 10
      const x = 300 + (next() - 0.5) * (10 + (y - 600) * 0.22)

      d += `M${f(x - half)} ${f(y)}h${f(half * 2)}`
    }

    return `<path class="dc-gl${g ? ' dc-gl2' : ''}" d="${d}" stroke="#d8ecf0" stroke-opacity=".42" stroke-width="2.2"/>`
  }).join('')

  // Dark bands across the water, closer together far off, that break the reflections into streaks.
  let stripes = ''

  for (let k = 0, y = 606; y < 1000; k += 1) {
    stripes += `M-200 ${f(y)}H1800`
    y += 5 + k * 0.55
  }

  // Rain rings where drops hit the water.
  const rings = ([
    [120, 860], [330, 940], [60, 760], [470, 900], [260, 780], [380, 830], [720, 950], [1050, 890], [600, 820], [160, 960],
  ] as [number, number][])
    .map(([x, y], i) => `<ellipse class="dc-ring" style="animation-delay:${f(-i * 0.53)}s" cx="${x}" cy="${y}" rx="12" ry="3.4"/>`)
    .join('')

  // Floating debris: each rides the swell as it passes, timed by where it floats.
  const ride = (x: number) => f((x + 230) / 520 - 2.5)
  const bob = (x: number, y: number, secs: number, inner: string) =>
    `<g transform="translate(${x} ${y})"><g class="dc-bob" style="--b:${secs}s;--t:${ride(x)}s;--i:${f(-x / 300)}s">${inner}</g></g>`
  const barrel =
    `<rect x="-20" y="-14" width="40" height="22" rx="6" fill="${DRUM}" stroke="${DRUM_EDGE}" stroke-width="2"/>` +
    '<path d="M-8 -14V8M8 -14V8" stroke="#123240" stroke-width="2.4"/>'
  const crate = '<rect x="-18" y="-12" width="36" height="16" rx="2" fill="#1a1712" stroke="#332b1e" stroke-width="2"/><path d="M-18 -4H18" stroke="#332b1e" stroke-width="2"/>'
  const tire = '<ellipse rx="20" ry="6" fill="none" stroke="#0b1114" stroke-width="7"/><ellipse rx="20" ry="6" fill="none" stroke="#2a3a40" stroke-width="1.4"/>'
  const plank = '<rect x="-34" y="-4" width="68" height="7" rx="2" fill="#1d1810" stroke="#30281b" stroke-width="1.6" transform="rotate(-6)"/>'
  const collar = (x: number, y: number, rx: number) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${f(rx * 0.22)}" fill="none" stroke="${PALE}" stroke-opacity=".26" stroke-width="1.6"/>`

  const street =
    // A tree from a drowned park, only its crown above the water.
    `<g fill="${LEAF}"><circle cx="486" cy="700" r="26"/><circle cx="514" cy="688" r="30"/><circle cx="540" cy="704" r="22"/><circle cx="504" cy="712" r="22"/></g>` +
    collar(512, 724, 46) +
    // A road sign on its posts, its marks invented.
    `<g transform="rotate(-4 626 700)"><path d="M592 724V770M660 724V770" stroke="${POLE}" stroke-width="5"/>` +
    '<rect x="566" y="680" width="122" height="46" rx="4" fill="#0e2822" stroke="#2c5a4c" stroke-width="2"/>' +
    '<path d="M580 703H616L607 694M616 703L607 712M632 709q5 -7 10 0t10 0t10 0t10 0M638 693h4M654 693h4M670 693h4" fill="none" stroke="#9fc8b8" stroke-opacity=".32" stroke-width="3"/></g>' +
    collar(626, 768, 50) +
    // A car's roof just breaking the surface.
    '<path d="M752 836C762 816 784 808 812 808C842 808 860 818 870 836Z" fill="#0b1519" stroke="#21404a" stroke-width="2"/>' +
    '<path d="M780 824C786 815 798 812 812 812V828H776Z" fill="#14303a" fill-opacity=".8"/><path d="M790 806H836" stroke="#21404a" stroke-width="3"/>' +
    collar(811, 836, 66) +
    // The traffic light still blinking amber.
    `<path d="M404 772V612" stroke="${POLE}" stroke-width="6"/>` +
    '<rect x="392" y="596" width="24" height="58" rx="4" fill="#0b1519" stroke="#22404a" stroke-width="2"/>' +
    '<circle cx="404" cy="609" r="5" fill="#2a1414"/><circle cx="404" cy="625" r="5" fill="#2a2210"/><circle cx="404" cy="641" r="5" fill="#0f2418"/>' +
    '<circle class="dc-amb" cx="404" cy="625" r="5" fill="#ffb648"/><circle class="dc-amb" cx="404" cy="625" r="14" fill="#ffb648" fill-opacity=".2"/>' +
    '<circle class="dc-grn" cx="404" cy="641" r="5" fill="#4fe09a"/><circle class="dc-grn" cx="404" cy="641" r="14" fill="#4fe09a" fill-opacity=".2"/>' +
    '<rect class="dc-amb" x="401" y="866" width="6" height="22" fill="#ffb648" fill-opacity=".25"/>' +
    collar(404, 772, 18) +
    bob(330, 902, 4.6, barrel) +
    bob(1010, 944, 5.4, barrel) +
    bob(140, 930, 4.2, crate) +
    bob(640, 884, 5, tire) +
    bob(230, 852, 6, plank) +
    bob(930, 800, 5.6, plank)

  const ferry =
    '<g transform="translate(222 812) scale(1.25)"><g class="dc-ferry"><g class="dc-fb">' +
    '<ellipse cx="-10" cy="-50" rx="200" ry="96" fill="url(#dc-warm)"/>' +
    `<path class="dc-wake" d="M-150 2L-340 8M-140 8L-300 26M-120 12L-250 40" fill="none" stroke="${PALE}" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M-100 8v34M-70 8v44M-40 8v30M-10 8v46M20 8v34M50 8v40M80 8v28" stroke="${WARM}" stroke-opacity=".26" stroke-width="6"/>` +
    '<path d="M-150 -30H128Q152 -30 162 -14L148 4H-138Z" fill="#0b161a" stroke="#2c4c56" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="M-146 -18H156" stroke="${PALE}" stroke-opacity=".45" stroke-width="2"/>` +
    '<rect x="-122" y="-60" width="226" height="30" rx="3" fill="#13252b" stroke="#2c4c56" stroke-width="1.6"/>' +
    `<path d="M-110 -45H98" stroke="${WARM}" stroke-width="11" stroke-dasharray="14 8"/>` +
    '<rect x="-86" y="-88" width="150" height="28" rx="3" fill="#152a30" stroke="#2c4c56" stroke-width="1.6"/>' +
    `<path d="M-76 -74H56" stroke="${WARM}" stroke-width="10" stroke-dasharray="12 8"/>` +
    '<path d="M-122 -66H104M-80 -66V-60M-38 -66V-60M4 -66V-60M46 -66V-60M88 -66V-60" stroke="#3a5a64" stroke-width="1.4"/>' +
    '<rect x="22" y="-110" width="46" height="22" rx="3" fill="#183036" stroke="#2c4c56" stroke-width="1.6"/>' +
    `<rect x="30" y="-104" width="30" height="9" fill="${PALE}" fill-opacity=".75"/>` +
    '<path d="M-20 -88V-136" stroke="#2c4c56" stroke-width="3"/>' +
    `<circle cx="-20" cy="-138" r="4" fill="${WARM}"/><circle cx="-20" cy="-138" r="12" fill="${WARM}" fill-opacity=".25"/>` +
    '<circle cx="-134" cy="-44" r="7" fill="none" stroke="#c85a48" stroke-width="3.5"/><circle cx="-134" cy="-44" r="7" fill="none" stroke="#e8efe9" stroke-width="3.6" stroke-dasharray="5.5 5.5"/>' +
    '</g></g></g>'

  const swell =
    '<g transform="translate(0 772)"><g class="dc-swell">' +
    '<path d="M-700 30C-480 26 -250 -130 80 -142C280 -148 460 -36 700 30Z" fill="url(#dc-swg)"/>' +
    `<path d="M200 -124C330 -104 450 -44 610 12" fill="none" stroke="${TEAL}" stroke-opacity=".16" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M-470 -24C-280 -100 -70 -142 80 -142C280 -148 460 -36 690 26" fill="none" stroke="${TEAL}" stroke-opacity=".45" stroke-width="3"/>` +
    `<path d="M130 -143C280 -142 420 -62 620 4" fill="none" stroke="${PALE}" stroke-opacity=".55" stroke-width="2.6" stroke-dasharray="16 14" stroke-linecap="round"/>` +
    '<path d="M-330 -62C-170 -116 0 -132 66 -132" fill="none" stroke="#bfe0e8" stroke-opacity=".12" stroke-width="12" stroke-linecap="round"/>' +
    `<g fill="${PALE}" fill-opacity=".45"><circle cx="150" cy="-156" r="3"/><circle cx="182" cy="-160" r="2.4"/><circle cx="214" cy="-152" r="3"/><circle cx="244" cy="-146" r="2"/><circle cx="118" cy="-158" r="2"/></g>` +
    '</g></g>'

  const vines =
    `<g fill="none" stroke="${LEAF}" stroke-width="5" stroke-linecap="round">` +
    '<path d="M10 66C16 120 4 170 14 240C20 290 10 330 16 380"/><path d="M96 72C102 130 90 180 98 250"/>' +
    '<path d="M150 86C156 150 146 210 154 300C158 340 150 380 156 430"/><path d="M60 46C64 90 56 120 62 160"/></g>' +
    `<g fill="${LEAF}"><circle cx="15" cy="240" r="6"/><circle cx="98" cy="250" r="7"/><circle cx="154" cy="300" r="6"/><circle cx="156" cy="430" r="8"/><circle cx="16" cy="380" r="7"/><circle cx="62" cy="160" r="5"/></g>`
  const brokenTop =
    '<path d="M110 92L124 60M140 78L150 50M170 110L188 84M52 36L58 12" stroke="#132b33" stroke-width="4"/>' +
    `<path d="M184 108C190 150 178 180 186 220" fill="none" stroke="${POLE}" stroke-width="2"/>` +
    '<path d="M200 106V700" stroke="#1b3540" stroke-width="3"/>'
  const beacon =
    '<circle class="dc-bcn" cx="1495" cy="42" r="14" fill="#ff5a4a" fill-opacity=".25"/><circle class="dc-bcn" cx="1495" cy="42" r="4" fill="#ff6a5a"/>' +
    [0, 0.6, 1.2].map(d => `<circle class="dc-sig" style="animation-delay:${d}s" cx="1495" cy="42" r="16" fill="none" stroke="${TEAL}" stroke-width="2"/>`).join('')

  const lift = (inner: string) => `<g class="dc-lift">${inner}</g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#03080b',
      furniture: '#1c2b2f',
      metal: '#26363d',
      paper: '#d6e6ea',
      light: { idle: '#3f8fa3', work: TEAL, bright: '#c4eef8' },
      headTop: 214,
      glowAt: [346, 276],
      device,
      wear: {
        front:
          // The sou'wester: a long back flap, a short front brim, the eyes clear below it.
          `<path d="M40 270C50 252 72 240 100 236L200 233C226 233 246 238 256 247C242 252 222 250 202 250L104 252C84 254 62 262 40 270Z" fill="${HAT}" stroke="${HAT_DARK}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M84 238C84 212 112 200 150 200C188 200 216 212 216 238Z" fill="${HAT}" stroke="${HAT_DARK}" stroke-width="2"/>` +
          `<path d="M85 229C120 225 182 225 215 229V237H85Z" fill="${HAT_DARK}" fill-opacity=".5"/>` +
          '<path d="M104 216C120 206 140 204 160 205" fill="none" stroke="#fff3c8" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="M60 259C76 249 92 245 108 244M196 242C214 242 232 243 244 246" fill="none" stroke="${HAT_DARK}" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="4 3"/>` +
          `<path d="M228 250C232 276 232 300 226 322" fill="none" stroke="${HAT_DARK}" stroke-width="2.4" stroke-opacity=".85"/>` +
          '<g fill="#d8f0f6" fill-opacity=".8"><circle cx="70" cy="261" r="1.8"/><circle cx="130" cy="244" r="1.6"/><circle cx="182" cy="242" r="1.8"/><circle cx="236" cy="245" r="1.5"/></g>' +
          // Rain boots over the legs.
          `<g fill="${HAT}" stroke="${HAT_DARK}" stroke-width="1.6">${[86, 118, 166, 198].map(x => `<rect x="${x - 2}" y="354" width="20" height="22" rx="2"/>`).join('')}</g>` +
          `<g fill="${HAT_DARK}">${[86, 118, 166, 198].map(x => `<rect x="${x - 3}" y="373" width="22" height="4" rx="1"/>`).join('')}</g>`,
      },
      seatArt:
        // An upturned crate.
        '<rect x="106" y="350" width="90" height="88" rx="4" fill="#1a3a44" stroke="#2c5866" stroke-width="2"/>' +
        '<path d="M110 372H192M110 394H192M110 416H192" stroke="#0e242b" stroke-width="3"/>' +
        '<rect x="134" y="356" width="34" height="8" rx="4" fill="#0b1c22"/>',
      tableArt:
        // Two drums under an old door, on a raft of planks lashed with rope, the water lapping at it.
        `<g fill="${DRUM}" stroke="${DRUM_EDGE}" stroke-width="2"><rect x="192" y="342" width="52" height="96" rx="5"/><rect x="398" y="342" width="52" height="96" rx="5"/></g>` +
        '<path d="M194 366H242M194 414H242M400 366H448M400 414H448" stroke="#123240" stroke-width="3"/>' +
        `<rect x="164" y="330" width="308" height="13" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<path d="M180 336.5H448" stroke="${WOOD_EDGE}" stroke-width="1.4" stroke-dasharray="40 6"/><circle cx="460" cy="336.5" r="3" fill="#b08a3a"/>` +
        '<rect x="26" y="438" width="444" height="16" rx="3" fill="#241d15" stroke="#3a2f21" stroke-width="1.6"/>' +
        '<path d="M90 438V454M160 438V454M240 438V454M320 438V454M400 438V454" stroke="#16110b" stroke-width="2"/>' +
        '<path d="M60 435V457M250 435V457M440 435V457" stroke="#8a7a52" stroke-width="3"/>' +
        `<path d="${WAVE40(24, 452, 21, 5)}V460H24Z" fill="#0c2730" fill-opacity=".92"/>` +
        `<path d="${WAVE40(24, 452, 21, 5)}" fill="none" stroke="${PALE}" stroke-opacity=".3" stroke-width="1.4"/>`,
    },
    style:
      // Ambient: clouds drift over the moon, the water ripples and glints, debris bobs, rain rings spread.
      '.dc-cl{animation:dc-drift 44s ease-in-out infinite alternate}@keyframes dc-drift{from{transform:translateX(-30px)}to{transform:translateX(40px)}}' +
      '.dc-cl2{animation-direction:alternate-reverse;animation-duration:56s}' +
      '.dc-halo{animation:dc-halo 9s ease-in-out infinite alternate}@keyframes dc-halo{from{opacity:.75}to{opacity:1}}' +
      '.dc-rip{animation:dc-rip 5s ease-in-out infinite alternate}@keyframes dc-rip{from{transform:translateX(-12px)}to{transform:translateX(12px)}}' +
      '.dc-rip2{animation-duration:7s;animation-direction:alternate-reverse}.dc-rip3{animation-duration:3.6s}' +
      '.dc-gl{animation:dc-gl 2.8s ease-in-out infinite alternate}.dc-gl2{animation-delay:-1.4s}@keyframes dc-gl{from{opacity:.25}to{opacity:.85}}' +
      '.dc-glw{opacity:.7}' +
      '.dc-sh{animation:dc-sh 3.4s ease-in-out infinite alternate}@keyframes dc-sh{from{opacity:.55}to{opacity:1}}' +
      '.dc-bob{transform-box:fill-box;transform-origin:center;animation:dc-bob var(--b,5s) ease-in-out var(--i,0s) infinite alternate}' +
      '@keyframes dc-bob{from{transform:translateY(-3px) rotate(-3deg)}to{transform:translateY(3px) rotate(3deg)}}' +
      '.dc-amb{animation:dc-amb 2.4s ease-in-out infinite}@keyframes dc-amb{0%,100%{opacity:.12}40%,60%{opacity:.95}}' +
      '.dc-grn,.dc-on,.dc-ron,.dc-ferry,.dc-lampon,.dc-swell,.dc-surge,.dc-spray,.dc-sig{opacity:0}' +
      '.dc-bcn{animation:dc-bcn 2.2s ease-in-out infinite}@keyframes dc-bcn{0%,100%{opacity:.2}50%{opacity:1}}' +
      `.dc-rings{fill:none;stroke:${PALE};stroke-opacity:.5;stroke-width:1.2}` +
      '.dc-ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:dc-ring 2.6s ease-out infinite}' +
      '@keyframes dc-ring{0%{opacity:0;transform:scale(.2)}15%{opacity:1}100%{opacity:0;transform:scale(1.6)}}' +
      '.dc-drip{opacity:0;animation:dc-drip 1.9s ease-in infinite}@keyframes dc-drip{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(var(--dy,40px))}}' +
      '.dc-lan{animation:dc-lan 4.4s ease-in-out infinite alternate}@keyframes dc-lan{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '@keyframes dc-lanw{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
      '.dc-lg{animation:dc-lg 3s ease-in-out infinite alternate}@keyframes dc-lg{from{opacity:.7}to{opacity:1}}' +
      '.dc-fw{animation:dc-fw 3.2s linear infinite}@keyframes dc-fw{to{transform:translateX(-40px)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: two short dips per 7 s, in a few windows.
      '.dc-flk{animation:dc-flk 7s linear infinite}@keyframes dc-flk{0%,86%,100%{opacity:1}88%{opacity:.3}91%{opacity:1}94%{opacity:.35}97%{opacity:1}}' +
      '.dc-fog{opacity:.45;animation:dc-fog 30s ease-in-out infinite alternate}@keyframes dc-fog{to{transform:translateX(-120px)}}' +
      '.dc-led{animation:dc-led 3s ease-in-out infinite}.dc-ledq{animation-duration:.8s}@keyframes dc-led{0%,100%{opacity:.25}50%{opacity:1}}' +
      '.dc-wake{stroke-dasharray:18 12;animation:dc-wake 1s linear infinite}@keyframes dc-wake{to{stroke-dashoffset:30}}' +
      '.dc-fb{animation:dc-fb 3s ease-in-out infinite alternate}@keyframes dc-fb{to{transform:translateY(3px)}}' +
      '.dc-tarp{transform-box:fill-box;transform-origin:0 50%}' +
      // Thinking: mist rolls in over the water and the rain thickens.
      '.st-thinking .dc-fog{opacity:1}.st-thinking .dc-ring{animation-duration:1.3s}' +
      // Responding: the lantern burns brighter.
      '.st-responding .dc-lg{animation-duration:1.1s}' +
      // Tool: a gust: the tarp lifts, the lantern swings wide, the rain slants.
      '.st-tool .dc-tarp{animation:dc-tarp .9s ease-in-out infinite alternate}@keyframes dc-tarp{from{transform:skewY(0)}to{transform:skewY(-2.4deg)}}' +
      '.st-tool .dc-lan{animation:dc-lanw 1.2s ease-in-out infinite alternate}' +
      '.st-tool .dc-rainw{transform:skewX(-12deg)}' +
      // Read: the clouds thin and the moon's path brightens.
      '.st-read .dc-cls{animation:dc-thin 1.6s ease-out both}@keyframes dc-thin{to{opacity:.45}}' +
      '.st-read .dc-glw,.st-done .dc-glw{animation:dc-up 1.6s ease-out both}@keyframes dc-up{to{opacity:1}}' +
      // Web: the tower's beacon sends rings out.
      '.st-web .dc-sig{transform-box:fill-box;transform-origin:center;animation:dc-sig 1.8s ease-out infinite}' +
      '@keyframes dc-sig{0%{opacity:0;transform:scale(.4)}25%{opacity:.8}100%{opacity:0;transform:scale(2.8)}}' +
      // Run: a huge swell rolls between the towers; as it reaches the raft the city sinks away below it.
      '.st-run .dc-swell{animation:dc-swell 5s linear infinite}' +
      '@keyframes dc-swell{0%{opacity:0;transform:translateX(-300px)}6%{opacity:1}100%{opacity:1;transform:translateX(2300px)}}' +
      '.dc-lift{transform-origin:1380px 1000px}' +
      '.st-run .dc-lift{animation:dc-lift 5s ease-in-out infinite}@keyframes dc-lift{0%,40%{transform:translateY(0)}64%{transform:translateY(30px)}88%,100%{transform:translateY(0)}}' +
      '.st-run .dc-fwy{animation:dc-fwy 5s ease-in-out infinite}@keyframes dc-fwy{0%,40%{transform:translateY(0)}64%{transform:translateY(16px)}88%,100%{transform:translateY(0)}}' +
      '.st-run .dc-bob{animation:dc-ride 5s ease-in-out var(--t) infinite}' +
      '@keyframes dc-ride{0%,32%{transform:translateY(0)}50%{transform:translateY(-74px) rotate(-8deg)}68%,100%{transform:translateY(0)}}' +
      '.st-run .dc-lan{animation:dc-lanw 1.6s ease-in-out infinite alternate}.st-run .dc-rip{animation-duration:1.6s}' +
      // Error: the raft pitches, water surges over the desk, the towers' lights fail floor by floor.
      '.st-error .dc-lift{animation:dc-rock 1.7s ease-in-out infinite alternate}@keyframes dc-rock{from{transform:rotate(-1.1deg)}to{transform:rotate(1.1deg)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: each band of windows dips twice in under a second, then stays dark.
      '.st-error .dc-lit,.st-error .dc-rlit{animation:dc-fail 1.3s ease-in var(--e,0s) both}' +
      '@keyframes dc-fail{0%{opacity:1}22%{opacity:.2}34%{opacity:.9}58%,100%{opacity:0}}' +
      '.st-error .dc-bcn{animation:dc-off .5s ease-out .9s both}.st-error .dc-amb{animation:dc-off .4s ease-out .3s both}@keyframes dc-off{to{opacity:0}}' +
      '.st-error .dc-lg{animation:dc-dim 1.4s ease-in .3s both}@keyframes dc-dim{0%{opacity:1}25%{opacity:.35}40%{opacity:.9}70%,100%{opacity:.3}}' +
      '.st-error .dc-lan{animation:dc-lanw 1s ease-in-out infinite alternate}' +
      '.st-error .dc-surge{animation:dc-surge 3.4s cubic-bezier(.3,.6,.4,1) infinite}' +
      '@keyframes dc-surge{0%{opacity:0;transform:translateY(230px)}8%{opacity:.95}34%{transform:translateY(0)}52%{opacity:.9;transform:translateY(-6px)}82%{opacity:0;transform:translateY(200px)}100%{opacity:0;transform:translateY(230px)}}' +
      '.st-error .dc-spray{animation:dc-spray 3.4s ease-out var(--s,0s) infinite}' +
      '@keyframes dc-spray{0%,22%{opacity:0;transform:translate(0,0)}30%{opacity:.9}64%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Done: the ferry glides in, the windows light up one after another, the clouds part, the light turns green.
      '.st-done .dc-on,.st-done .dc-ron{animation:dc-on .7s ease-out var(--d,0s) both}@keyframes dc-on{from{opacity:0}to{opacity:1}}' +
      '.st-done .dc-ferry{animation:dc-ferry 3.6s cubic-bezier(.25,.6,.35,1) both}' +
      '@keyframes dc-ferry{0%{opacity:0;transform:translateX(-420px)}8%{opacity:1}100%{opacity:1;transform:translateX(0)}}' +
      '.st-done .dc-lampon{animation:dc-on 1s ease-out .5s both}' +
      '.st-done .dc-grn{animation:dc-on .5s ease-out .4s both}.st-done .dc-amb{animation:dc-off .4s both}' +
      '.st-done .dc-cl{animation:dc-partl 3.2s ease-out both}.st-done .dc-cl2{animation-name:dc-partr}' +
      '@keyframes dc-partl{to{transform:translateX(-260px)}}@keyframes dc-partr{to{transform:translateX(260px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03080b"/><stop offset=".4" stop-color="#08141a"/><stop offset=".58" stop-color="#10252d"/><stop offset="1" stop-color="#0a171c"/></linearGradient>' +
      '<linearGradient id="dc-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f252d"/><stop offset=".3" stop-color="#0a1a20"/><stop offset="1" stop-color="#04090c"/></linearGradient>' +
      '<linearGradient id="dc-deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04090c" stop-opacity="0"/><stop offset=".25" stop-color="#04090c" stop-opacity=".35"/><stop offset="1" stop-color="#04090c" stop-opacity=".85"/></linearGradient>' +
      '<linearGradient id="dc-fogg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a6470" stop-opacity="0"/><stop offset=".55" stop-color="#3a6470" stop-opacity=".16"/><stop offset="1" stop-color="#3a6470" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="dc-swg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f5664"/><stop offset=".5" stop-color="#123440" stop-opacity=".95"/><stop offset="1" stop-color="#0b1f26" stop-opacity="0"/></linearGradient><linearGradient id="dc-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6c78" stop-opacity=".32"/><stop offset="1" stop-color="#3f6c78" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="dc-halo"><stop offset="0" stop-color="#d6eaee" stop-opacity=".3"/><stop offset=".35" stop-color="#9fc3cc" stop-opacity=".1"/><stop offset="1" stop-color="#9fc3cc" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="dc-warm"><stop offset="0" stop-color="${WARM}" stop-opacity=".24"/><stop offset="1" stop-color="${WARM}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect x="-100" y="-100" width="1800" height="1200" fill="url(#dc-sky)"/>' +
      // The moon behind the clouds.
      '<g class="mv-t"><g class="dc-halo"><circle cx="300" cy="150" r="210" fill="url(#dc-halo)"/></g>' +
      '<circle cx="300" cy="150" r="44" fill="#dcecef" fill-opacity=".85"/><circle cx="286" cy="138" r="9" fill="#b7cdd2" fill-opacity=".5"/><circle cx="316" cy="160" r="6" fill="#b7cdd2" fill-opacity=".45"/>' +
      `<g class="dc-cls"><g class="dc-cl">${cloud(250, 190, 1.25, 0.35)}${cloud(80, 92, 1.4, 0.2)}${cloud(560, 70, 1.6, 0.18)}${cloud(940, 124, 1.3, 0.1)}</g>` +
      `<g class="dc-cl dc-cl2">${cloud(460, 96, 1, 0.3)}${cloud(760, 170, 1.2, 0.1)}${cloud(1200, 70, 1.5, 0.08)}${cloud(1460, 150, 1.2, 0.08)}</g></g></g>` +
      lift(
        '<g class="mv-b">' +
          `<path d="${farBody}" fill="${FAR}"/><path d="${farWin}" fill="${PALE}" fill-opacity=".22"/>` +
          '<rect x="-200" y="600" width="2000" height="600" fill="url(#dc-water)"/>' +
          `<path d="${farRefl}" fill="${FAR}" fill-opacity=".5"/>` +
          '<path d="M-200 600.5H1800" stroke="#3a6470" stroke-opacity=".35" stroke-width="1.4"/>' +
          mids.map(m => m.body).join('') +
          mids.map(m => m.refl).join('') +
          `<g transform="rotate(2.2 80 700)">${towers.left.refl}</g>` +
          '</g>' +
          `<g class="mv-r"><g class="mv-b">${towers.right.refl}</g></g>` +
          `<g class="mv-b"><path d="${stripes}" stroke="#07141a" stroke-opacity=".6" stroke-width="2.2"/>` +
          '<rect x="-200" y="600" width="2000" height="600" fill="url(#dc-deep)"/><rect x="-200" y="601" width="2000" height="30" fill="url(#dc-sheen)"/>' +
          `<g fill="none" stroke="${PALE}">` +
          `<path class="dc-rip" d="${ripples(34, 606, 760, 60)}" stroke-opacity=".12" stroke-width="1"/>` +
          `<path class="dc-rip dc-rip2" d="${ripples(26, 700, 1000, 70)}" stroke-opacity=".1" stroke-width="1.6"/>` +
          `<path class="dc-rip dc-rip3" d="${ripples(18, 620, 980, 50)}" stroke-opacity=".08" stroke-width="1.2"/>` +
          `<g class="dc-glw">${glints}</g></g>` +
          '<rect class="dc-fog" x="-100" y="530" width="1900" height="170" fill="url(#dc-fogg)"/></g>',
      ) +
      `<g class="mv-b">${swell}</g>` +
      lift(
        '<g class="mv-b">' +
          `<g transform="rotate(-2.2 80 700)">${towers.left.body}${brokenTop}${vines}</g>` +
          collar(80, 702, 140) +
          street +
          `<g class="dc-rings">${rings}</g>` +
          ferry +
          '</g>' +
          `<g class="mv-r"><g class="mv-b">${towers.right.body}${beacon}${collar(1495, 692, 130)}</g></g>`,
      ) +
      `<g class="dc-rainw">${rain({ seed: 31, count: 22, length: [18, 34], slant: 120, seconds: 1.1, stroke: PALE, opacity: 0.12 })}</g>`,
    nook:
      '<defs><radialGradient id="dc-lant"><stop offset="0" stop-color="#f2c46b" stop-opacity=".42"/><stop offset=".45" stop-color="#f2c46b" stop-opacity=".1"/><stop offset="1" stop-color="#f2c46b" stop-opacity="0"/></radialGradient></defs>' +
      // The lamp post the raft is moored to, its lamp dead until done.
      `<path d="M-74 470V114" stroke="${POLE}" stroke-width="7"/><path d="M-74 118Q-74 94 -50 94H-26" fill="none" stroke="${POLE}" stroke-width="5"/>` +
      '<path d="M-34 90H-10L-14 100H-30Z" fill="#0d1a1f" stroke="#2a4650" stroke-width="1.6"/>' +
      '<g class="dc-lampon"><circle cx="-22" cy="104" r="70" fill="url(#dc-lant)"/><path d="M-30 100H-14L-10 106H-34Z" fill="#ffe2a0"/></g>' +
      `<path d="M-120 444C-104 452 -88 440 -74 420" fill="none" stroke="#8a7a52" stroke-width="2.4"/>` +
      // The tarp, tied to the lamp post and to a pole off the right edge, dripping.
      '<g class="dc-tarp"><path d="M-70 112Q190 190 540 56L546 84Q196 222 -66 140Z" fill="#173332" stroke="#2e5654" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-68 116Q190 194 540 60" fill="none" stroke="#4f8484" stroke-opacity=".5" stroke-width="2.4"/>' +
      '<path d="M-62 130Q192 210 542 72" fill="none" stroke="#0f2222" stroke-width="2" stroke-dasharray="12 16"/>' +
      '<path d="M-66 138L-80 160M-60 114L-78 104" stroke="#8a7a52" stroke-width="2"/></g>' +
      [
        [128, 170, 30, 0],
        [160, 171, 26, -0.7],
        [196, 169, 28, -1.3],
        [290, 162, 62, -0.4],
      ]
        .map(([x, y, dy, d]) => `<circle class="dc-drip" style="--dy:${dy}px;animation-delay:${d}s" cx="${x}" cy="${y}" r="2.4" fill="${PALE}"/>`)
        .join('') +
      // The lantern hanging from the tarp.
      '<g transform="translate(68 164)"><g class="dc-lan"><path d="M0 0V18" stroke="#0a1418" stroke-width="2"/>' +
      '<g class="dc-lg"><circle cx="0" cy="34" r="120" fill="url(#dc-lant)"/></g>' +
      '<path d="M-8 18H8L11 24H-11Z" fill="#141c1e" stroke="#4a5a50"/>' +
      `<rect x="-10" y="24" width="20" height="22" rx="2" fill="${WARM}" fill-opacity=".85" stroke="#2a3430" stroke-width="2"/>` +
      '<path d="M-10 35H10M0 24V46" stroke="#2a3430" stroke-width="1.6"/><path d="M-11 46H11L8 50H-8Z" fill="#141c1e"/></g></g>' +
      // The raft runs on past the desk: a jerrycan, a bucket, a sprout in a tin.
      '<rect x="-130" y="438" width="170" height="16" rx="3" fill="#241d15" stroke="#3a2f21" stroke-width="1.6"/>' +
      '<path d="M-70 438V454M-10 438V454" stroke="#16110b" stroke-width="2"/>' +
      '<path d="M-122 440V408H-100L-94 414V440Z" fill="#3a5a3a" stroke="#4f7a4f" stroke-width="1.6"/><path d="M-118 408V402H-108V408" fill="none" stroke="#4f7a4f" stroke-width="2"/>' +
      '<path d="M-84 418H-56L-60 440H-80Z" fill="#2a4a56" stroke="#3f6a78" stroke-width="1.6"/><path d="M-84 418Q-70 404 -56 418" fill="none" stroke="#3f6a78" stroke-width="1.6"/>' +
      `<rect x="-40" y="426" width="16" height="14" fill="#3a4a4e"/><path d="M-32 426C-34 416 -40 412 -44 410M-32 426C-30 414 -24 410 -20 408" fill="none" stroke="#5fae6a" stroke-width="2.4" stroke-linecap="round"/>` +
      '<ellipse cx="-2" cy="446" rx="16" ry="6" fill="none" stroke="#0b1114" stroke-width="6"/>',
    front:
      // The water in front of the raft.
      '<g class="dc-fwy"><g class="dc-fw">' +
      `<path d="${WAVE40(-560, 449, 54, 6)}V492H-560Z" fill="#0a1c23" fill-opacity=".94"/>` +
      `<path d="${WAVE40(-560, 449, 54, 6)}" fill="none" stroke="${PALE}" stroke-opacity=".22" stroke-width="1.6"/></g></g>` +
      // The surge that comes over the desk on an error.
      '<g transform="translate(-36 0)"><g class="dc-surge">' +
      '<path d="M100 480C150 440 214 404 258 382C290 364 300 332 296 300C292 270 302 242 332 228C364 214 408 218 434 236C456 252 472 270 492 280V480Z" fill="#1f5868" fill-opacity=".62"/>' +
      '<path d="M180 480C220 436 270 410 310 388C336 372 340 336 346 306C352 280 376 262 410 262C440 262 466 280 490 300V480Z" fill="#2f7a8e" fill-opacity=".42"/>' +
      `<path d="M140 450C190 414 236 396 262 380C292 362 300 332 296 300C292 270 302 242 332 228C364 214 408 218 434 236C456 252 472 270 492 280M332 228C308 236 290 254 292 278C294 292 306 298 314 290" fill="none" stroke="${PALE}" stroke-opacity=".8" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="M318 360C322 320 334 290 360 274M400 300C412 280 430 272 452 276" fill="none" stroke="${PALE}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="8 10"/>` +
      '</g></g>' +
      [
        [330, 232, -40, -60, 0],
        [360, 222, 0, -80, 0.05],
        [396, 220, 34, -74, 0.1],
        [430, 236, 60, -50, 0.04],
        [304, 250, -60, -36, 0.12],
        [462, 258, 72, -30, 0.08],
        [376, 220, -18, -96, 0.15],
        [414, 224, 20, -90, 0.02],
        [346, 226, -30, -100, 0.18],
      ]
        .map(([x, y, dx, dy, s]) => `<circle class="dc-spray" style="--dx:${dx}px;--dy:${dy}px;--s:${s}s" cx="${(x ?? 0) - 36}" cy="${y}" r="${4 + ((x ?? 0) % 3)}" fill="${PALE}"/>`)
        .join(''),
  }
}
