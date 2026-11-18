import type { Activity } from '../../types'
import { f, random } from './kit'
import { CORAL } from './rig'
import type { World } from './world'

// Carrier Deck: a fighter pilot at a flight-ops panel on a carrier's flight deck at sunset. The sun sits on the horizon
// where the deck runs out, a jet waits on the catapult with its nozzles glowing, folded-wing jets stand along the deck,
// crew silhouettes hold lit wands and the island tower rises behind the desk. A command launches the jet off the
// catapult in a burst of steam and it climbs away through the sun; an error waves off a landing jet under blinking red
// lights; done sends a formation over the sunset, leaving contrails.
const ORANGE = '#ff8c42'
const SIL = '#08070c'
const WAND = '#ffb347'
const HELMET = '#a39dab'
const AMBER = '#c8922a'
const CASE = '#24212c'
const CASE_EDGE = '#3d3949'
const RIM = `stroke="${ORANGE}" stroke-opacity=".4" stroke-width="1.6" stroke-linejoin="round"`

/**
 * A jet seen from behind, wheels at y 0: canted twin fins, two nozzles, its wings spread or folded up at the hinge.
 * `unfold` gives the folded panels their hinge motion and wingtip lights (the jet that spreads its wings on tool).
 */
function rearJet(folded: boolean, running: boolean, unfold = false): string {
  const side = (s: number): string => {
    const m = (x: number): string => f(x * s)
    const panel = `<path d="M${m(1)} 2L${m(-2)} -58H${m(3)}L${m(5)} 2Z"/>`
    const nav =
      `<g class="cd-nav" stroke="none"><circle cy="-56" r="20" fill="url(#${s > 0 ? 'cd-rg' : 'cd-gg'})"/>` +
      `<circle cy="-56" r="4.6" fill="${s > 0 ? '#ff4a3a' : '#5cf59a'}"/></g>`
    const wing = folded
      ? `<path d="M${m(-30)} -46L${m(-84)} -43V-38L${m(-30)} -36Z"/>` +
        `<g transform="translate(${m(-84)} -41)">` +
        (unfold ? `<g class="cd-fl" style="--u:${-88 * s}deg">${panel}${nav}</g>` : panel) +
        '</g>'
      : `<path d="M${m(-30)} -46L${m(-142)} -40V-35L${m(-30)} -36Z"/>`
    const stab = running ? ` class="cd-wag" style="transform-origin:${s > 0 ? '100%' : '0'} 50%"` : ''

    return (
      wing +
      `<path${stab} d="M${m(-24)} -30L${m(-80)} -27V-23L${m(-24)} -22Z"/>` +
      `<path d="M${m(-12)} -54L${m(-21)} -56L${m(-46)} -128L${m(-36)} -130Z"/>` +
      `<rect x="${s > 0 ? -44 : 36}" y="-14" width="8" height="14" rx="2"/>`
    )
  }
  const nozzles = [-13, 13]
    .map(
      x =>
        `<circle cx="${x}" cy="-24" r="10" fill="#120e14" stroke="#4a3e48" stroke-width="2"/>` +
        (running ? `<circle class="cd-noz" cx="${x}" cy="-24" r="7" fill="url(#cd-ab)" stroke="none"/>` : ''),
    )
    .join('')

  return (
    (running ? '<circle class="cd-abg" cy="-24" r="58" fill="url(#cd-ab)"/>' : '') +
    `<g fill="${SIL}" ${RIM}>${side(1)}${side(-1)}` +
    '<path d="M-34 -16C-40 -38 -26 -58 0 -60C26 -58 40 -38 34 -16Z"/><path d="M-12 -57C-12 -72 12 -72 12 -57Z"/>' +
    `${nozzles}</g>`
  )
}

// A jet from below, nose to +x; and from the side, nose to -x.
const PLAN = 'M54 0L34 -5L12 -7L-4 -36H-16L-12 -8H-30L-42 -22H-52L-47 -6L-54 -4V4L-47 6L-52 22H-42L-30 8H-12L-16 36H-4L12 7L34 5Z'

function topJet(x: number, y: number, s: number, nose: number): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * nose)} ${f(s)})">` +
    `<circle cx="-60" r="9" fill="url(#cd-ab)"/><path d="${PLAN}" fill="${SIL}" stroke="${ORANGE}" stroke-opacity=".45" stroke-width="2.4"/></g>`
  )
}

function sideJet(): string {
  return (
    '<circle class="cd-wvab" cx="110" cy="-3" r="30" fill="url(#cd-ab)"/>' +
    `<g fill="${SIL}" ${RIM}>` +
    '<path d="M-104 2L-80 -6L-52 -10L-42 -12C-32 -27 -10 -28 0 -15L50 -14L68 -52H84L84 -14L104 -10V4L64 8L-60 9Z"/>' +
    '<path d="M-24 6H28L66 24L46 26Z"/><path d="M58 4L98 2L104 10L78 12Z"/></g>' +
    `<g stroke="${SIL}" stroke-width="3.4" stroke-linecap="round"><path d="M-70 8L-72 26M18 8L22 28M88 6L104 24"/></g>` +
    `<g fill="${SIL}"><circle cx="-72" cy="28" r="4.5"/><circle cx="22" cy="30" r="5.5"/></g>` +
    '<g class="cd-ll"><circle cx="-70" cy="14" r="14" fill="#fff0dc" fill-opacity=".22"/><circle cx="-70" cy="14" r="3.2" fill="#fff6e8"/></g>'
  )
}

/** Claude's emblem: an eight-point starburst. */
function star(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const k = i % 2 ? r * 0.4 : r

    return `${f(cx + k * Math.cos(a))} ${f(cy + k * Math.sin(a))}`
  })

  return `M${points.join('L')}Z`
}

type Arm = { r: number; cls: string; delay?: number }

/** A deck crew silhouette, feet at 0: a cranial helmet and float vest, an arm on each side holding a lit wand. */
function crew(x: number, y: number, s: number, left: Arm, right: Arm, wands: boolean): string {
  const arm = (side: number, a: Arm): string =>
    `<g transform="translate(${15 * side} -106)${side > 0 ? ' scale(-1 1)' : ''}">` +
    `<g class="${a.cls}" style="--r:${a.r}deg${a.delay === undefined ? '' : `;animation-delay:${a.delay}s`}">` +
    `<path d="M0 0V44" stroke="${SIL}" stroke-width="9" stroke-linecap="round"/>` +
    (wands ? `<circle cy="66" r="22" fill="url(#cd-wg)"/><path d="M0 46V84" stroke="${WAND}" stroke-width="4.5" stroke-linecap="round"/>` : '') +
    '</g></g>'

  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">` +
    `<g fill="${SIL}" stroke="${ORANGE}" stroke-opacity=".22" stroke-width="1.5"><path d="M-10 -60L-13 0H-4L0 -38L4 0H13L10 -60Z"/>` +
    '<path d="M-18 -114H18L13 -58H-13Z"/><circle cy="-126" r="11"/></g>' +
    `<g fill="${SIL}"><circle cx="-11" cy="-124" r="4.5"/><circle cx="11" cy="-124" r="4.5"/></g>` +
    arm(-1, left) +
    arm(1, right) +
    '</g>'
  )
}

/** The catapult officer, kneeling beside the jet: one hand on a knee, the other giving the launch signal. */
function shooter(x: number, y: number): string {
  return (
    `<g transform="translate(${x} ${y})">` +
    `<g fill="${SIL}" stroke="${ORANGE}" stroke-opacity=".22" stroke-width="1.5">` +
    '<path d="M-14 -40L-28 -22L-26 0H-16V-18L-2 -34Z"/><path d="M2 -40L22 -6H46V4H16L-4 -34Z"/>' +
    '<path d="M-18 -90H16L12 -38H-14Z"/><circle cx="-2" cy="-102" r="11"/></g>' +
    `<g fill="${SIL}"><circle cx="-13" cy="-100" r="4.5"/><circle cx="9" cy="-100" r="4.5"/></g>` +
    `<path d="M-16 -84L-26 -50" stroke="${SIL}" stroke-width="9" stroke-linecap="round"/>` +
    '<g transform="translate(14 -84) scale(-1 1)"><g class="cd-pt" style="--r:168deg">' +
    `<path d="M0 0V44" stroke="${SIL}" stroke-width="9" stroke-linecap="round"/>` +
    `<circle cy="66" r="24" fill="url(#cd-wg)"/><path d="M0 46V84" stroke="${WAND}" stroke-width="4.5" stroke-linecap="round"/></g></g>` +
    '</g>'
  )
}

/** The landing lens on the deck's edge: the amber ball between green datum lights, red wave-off lights beside it. */
function lens(): string {
  const cells = Array.from({ length: 5 }, (_, i) => `<rect x="-6" y="${-58 + i * 7}" width="12" height="5"/>`).join('')
  const datum = [-1, 1].flatMap(s => [0, 1, 2].map(i => `<circle cx="${s * (18 + i * 7)}" cy="-37" r="2.6"/>`)).join('')

  return (
    '<g transform="translate(196 708) scale(1.4)">' +
    '<path d="M-3 0V-22H3V0Z" fill="#100d14"/><rect x="-14" y="-62" width="28" height="42" rx="2" fill="#120f16" stroke="#3a3040" stroke-width="1.4"/>' +
    `<g fill="#4a2e18">${cells}</g><rect class="cd-ball" x="-6" y="-44" width="12" height="5" fill="${WAND}"/>` +
    `<g class="cd-dat" fill="#5cf59a">${datum}</g>` +
    '<g class="cd-red"><circle cx="-19" cy="-52" r="12" fill="url(#cd-rg)"/><circle cx="19" cy="-52" r="12" fill="url(#cd-rg)"/>' +
    '<g fill="#ff3b30"><rect x="-22" y="-60" width="6" height="16" rx="1"/><rect x="16" y="-60" width="6" height="16" rx="1"/></g></g></g>'
  )
}

/** The flight-ops panel: a rugged case with a glare hood, the deck plan on its screen, switches and a radio. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const led = activity === 'error' ? '#ff4a3a' : activity === 'done' ? '#5cf59a' : WAND
  const blip = activity === 'run' ? ' class="cd-go"' : ''
  const screen = 'M318 318L326 246H396L393 318Z'

  return (
    `<path d="M302 328L312 236H408L404 328Z" fill="${CASE}" stroke="${CASE_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M306 238L318 222H416L408 238Z" fill="#17151d" stroke="${CASE_EDGE}" stroke-width="1.6" stroke-linejoin="round"/>` +
    '<path d="M302 252H293V306H300M407 252H416V306H406" fill="none" stroke="#4a4556" stroke-width="4" stroke-linejoin="round"/>' +
    `<path d="${screen}" fill="#0a0810"/><path d="${screen}" fill="${light}" fill-opacity=".1"/>` +
    `<g fill="none" stroke="${light}" stroke-width="1.6" stroke-linejoin="round"><path d="M346 312L342 266L350 254H366L374 266L372 312Z" stroke-opacity=".75"/>` +
    '<path d="M348 304L370 270M352 284V258M362 284V258" stroke-opacity=".45" stroke-dasharray="3 3"/></g>' +
    `<g fill="${light}"><path${blip} d="M349 292l3 -7l3 7z"/><path d="M361 302l3 -7l3 7z" fill-opacity=".6"/><path d="M332 268l3 -6l3 6z" fill-opacity=".5"/></g>` +
    `<circle class="cd-led" cx="402" cy="230" r="3" fill="${led}"/><circle cx="390" cy="230" r="2.4" fill="#5cf59a" fill-opacity=".55"/>` +
    '<rect x="244" y="321" width="166" height="9" rx="2" fill="#2c2935"/>' +
    keys +
    `<g fill="#ff4a3a" fill-opacity=".8"><rect x="338" y="315" width="7" height="6" rx="1"/><rect x="352" y="315" width="7" height="6" rx="1"/><rect x="366" y="315" width="7" height="6" rx="1"/></g>` +
    `<rect x="418" y="290" width="16" height="40" rx="3" fill="#1e1c25" stroke="${CASE_EDGE}" stroke-width="1.5"/>` +
    '<path d="M430 290V266" stroke="#2c2935" stroke-width="4" stroke-linecap="round"/>' +
    `<rect x="421" y="297" width="10" height="7" fill="${light}" fill-opacity=".5"/><path d="M422 312H430M422 318H430" stroke="#3d3949" stroke-width="2"/>`
  )
}

// Clouds low in the sky: a dark band with its underside lit by the sun, brighter the nearer it is.
const CLOUDS: readonly (readonly [number, number, number, number])[] = [
  [130, 470, 270, 10],
  [390, 522, 200, 7],
  [40, 545, 170, 6],
  [310, 428, 330, 12],
  [760, 470, 300, 9],
  [990, 524, 240, 7],
  [1260, 440, 330, 11],
  [1470, 506, 220, 8],
  [860, 396, 260, 7],
]

export function carrierDeckWorld(): World {
  const next = random(4242)
  const stars = Array.from({ length: 34 }, () => `M${f(next() * 1600)} ${f(8 + next() * 300)}h2v2h-2z`).join('')
  const clouds = CLOUDS.map(([cx, cy, rx, ry]) => {
    const lit = 0.5 * Math.max(0.12, 1 - Math.abs(cx - 250) / 800)

    return (
      `<ellipse cx="${cx}" cy="${f(cy + ry * 0.6)}" rx="${f(rx * 0.92)}" ry="${ry}" fill="${ORANGE}" fill-opacity="${f(lit)}"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#170d1a" fill-opacity=".94"/>`
    )
  }).join('')
  const glints = Array.from({ length: 9 }, (_, i) => {
    const y = 606 + i * 9
    const w = 8 + i * 4

    return `<ellipse class="cd-gl" style="animation-delay:${f(-i * 0.6)}s" cx="${f(250 + (next() - 0.5) * (30 + i * 12))}" cy="${y}" rx="${f(w)}" ry="1.6" fill="#ffc890"/>`
  }).join('')
  // Pad eyes over the deck, bigger as they come nearer.
  const pads = Array.from({ length: 80 }, () => {
    const y = 700 + Math.pow(next(), 0.8) * 300
    const left = Math.max(-100, 250 - 2.111 * (y - 600))
    const right = y < 760 ? 1066 + 9.06 * (y - 690) : 1700
    const x = left + next() * (right - left)
    const s = 1.2 + (y - 690) / 110

    return `M${f(x)} ${f(y)}h${f(s)}v${f(s * 0.5)}h${f(-s)}z`
  }).join('')
  // Arresting wires across the landing area, raised on their sheaves.
  const wires = [800, 830, 862, 896]
    .map(y => {
      const a = 250 + (y - 600) * 1.4
      const b = 250 + (y - 600) * 3

      return (
        `<path d="M${f(a)} ${y}H${f(b)}" stroke="#5a4a54" stroke-width="2.4"/><path d="M${f(a)} ${y - 1}H${f(b)}" stroke="${ORANGE}" stroke-opacity=".2" stroke-width="1"/>` +
        `<path d="M${f(a - 6)} ${y + 3}h12v-6h-12zM${f(b - 6)} ${y + 3}h12v-6h-12z" fill="#1c161e"/>`
      )
    })
    .join('')
  // Centreline lights on the catapult track, then deck-edge lights along the port side and the bow: they chase toward
  // the bow while Claude writes.
  const edge = (
    [
      [357, 990],
      [346, 952],
      [336, 914],
      [-80, 756],
      [-40, 737],
      [0, 718],
      [40, 700],
      [96, 690],
      [156, 690],
      [212, 690],
      [338, 690],
      [392, 690],
    ] as const
  )
    .map(([x, y], i) => `<g class="cd-ch" style="--i:${i}"><circle cx="${x}" cy="${y}" r="${i < 3 ? 32 : 15}" fill="url(#${i < 3 ? 'cd-cg' : 'cd-wg'})"/><circle cx="${x}" cy="${y}" r="${i < 3 ? 6 : 3.8}" fill="${i < 3 ? '#ffe0a8' : WAND}"/></g>`)
    .join('')
  // Steam: a few wisps leak from the catapult track; a launch blows a burst all along it.
  const trackX = (y: number): number => 250 + (y - 600) * 0.275
  const wisps = [0, 1, 2, 3]
    .map(i => {
      const y = 846 + i * 28

      return `<ellipse class="cd-wsp" style="animation-delay:${f(-i * 1.15)}s" cx="${f(trackX(y) + 8)}" cy="${y}" rx="${18 + i * 5}" ry="${10 + i * 3}" fill="url(#cd-st)"/>`
    })
    .join('')
  const burst = Array.from({ length: 13 }, (_, i) => {
    const y = 982 - i * 23
    const x = trackX(y) + (next() - 0.5) * 16
    const r = 14 + (y - 690) * 0.12
    const d = y >= 800 ? 0.16 + next() * 0.1 : 0.25 + ((800 - y) / 110) * 0.6
    const dx = (next() - 0.3) * 56

    return `<circle class="cd-sb" style="--d:${f(d)}s;--dx:${f(dx)}px;--dx2:${f(dx * 1.6)}px" cx="${f(x)}" cy="${y}" r="${f(r)}" fill="url(#cd-st)"/>`
  }).join('')
  const parked = (
    [
      [604, 714, 0.42],
      [792, 744, 0.58],
      [1010, 792, 0.8],
    ] as const
  )
    .map(([x, y, s], i) => `<g transform="translate(${x} ${y}) scale(${s})">${rearJet(true, false, i === 2)}</g>`)
    .join('')
  const still = (r: number): Arm => ({ r, cls: 'cd-st' })
  // The formation for done: four jets in echelon and the contrail each one draws behind it.
  const FORM = [
    [0, 0],
    [-64, 30],
    [-128, 60],
    [-64, -30],
  ] as const
  const formation = FORM.map(([ox, oy]) => topJet(ox, 190 + oy, 0.55, 1)).join('')
  const contrails = FORM.map(([ox, oy]) => {
    const y = 190 + oy
    const vars = `--a:${2180 - ox};--b:${80 - ox}`

    return (
      `<path class="cd-ct" style="${vars}" d="M-300 ${y + 14}L1900 ${y - 30}" stroke="#f3d6c0" stroke-opacity=".16" stroke-width="10"/>` +
      `<path class="cd-ct" style="${vars}" d="M-300 ${y + 14}L1900 ${y - 30}" stroke="#f8e4d4" stroke-opacity=".5" stroke-width="2.6"/>`
    )
  }).join('')
  const trail = 'M275 690C268 640 262 610 255 585S228 450 205 400S150 250 115 180S80 110 65 80'
  const portholes = [0, 1, 2, 3, 4]
    .map(i => `<rect x="${236 + (i % 3) * 58}" y="${30 + Math.floor(i / 3) * 70}" width="14" height="9" rx="2"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'puffs',
      ink: '#05040a',
      furniture: '#1d1a24',
      metal: '#2c2935',
      paper: '#e8e0d8',
      light: { idle: '#c27a3e', work: '#ffa45c', bright: '#ffd8b0' },
      headTop: 203,
      glowAt: [356, 282],
      device,
      wear: {
        front:
          // Ear shells down the sides and the dome over the top, all clear of the eyes; a shade on the far side.
          `<path d="M64 250V294Q64 304 74 304H88V250Z" fill="${HELMET}"/><path d="M212 250V304H226Q236 304 236 294V250Z" fill="${HELMET}"/>` +
          `<path d="M62 256C60 216 100 190 150 190C200 190 240 216 238 256Z" fill="${HELMET}"/>` +
          '<path d="M62 256C60 216 100 190 150 190C120 196 96 220 94 256Z" fill="#05040a" fill-opacity=".22"/>' +
          '<path d="M64 247H236V253H64Z" fill="#3a3540"/><path d="M64 300H88M212 300H236" stroke="#3a3540" stroke-width="4"/>' +
          // The visor, raised: tinted, see-through, catching the sunset.
          `<path d="M74 242C80 216 112 202 150 202C188 202 220 216 226 242C200 235 176 232 150 232C124 232 100 235 74 242Z" fill="${ORANGE}" fill-opacity=".42" stroke="#ffd2a8" stroke-opacity=".55" stroke-width="1.6"/>` +
          '<path d="M98 222C118 212 140 209 162 210" fill="none" stroke="#fff3e6" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="M146 191H154V201H146Z" fill="${ORANGE}"/>` +
          `<path d="${star(76, 276, 9)}" fill="${CORAL}"/>` +
          // The oxygen mask, unclipped, hanging from the near side.
          '<path d="M234 262L248 270" stroke="#2a2732" stroke-width="3"/>' +
          '<path d="M244 268C256 264 264 274 262 288C260 300 248 304 242 298C238 290 238 276 244 268Z" fill="#3a3644" stroke="#5a5466" stroke-width="1.6"/>' +
          '<circle cx="252" cy="286" r="3.5" fill="#1b1922"/>',
      },
      seatArt:
        // The ejection seat: its back and guide rails, the head box with the striped firing handle, the lower handle.
        '<path d="M54 354V196Q54 186 64 186H236Q246 186 246 196V354Z" fill="#1b1922" stroke="#34303d" stroke-width="2"/>' +
        '<path d="M58 352V180M242 352V180" stroke="#3e3a48" stroke-width="5"/>' +
        '<rect x="96" y="166" width="108" height="26" rx="5" fill="#1b1922" stroke="#34303d" stroke-width="2"/>' +
        `<path d="M126 168Q150 146 174 168" fill="none" stroke="#e0b032" stroke-width="5"/><path d="M126 168Q150 146 174 168" fill="none" stroke="#141218" stroke-width="5" stroke-dasharray="4 4"/>` +
        '<rect x="98" y="350" width="106" height="14" rx="4" fill="#23202b" stroke="#34303d" stroke-width="2"/>' +
        '<path d="M140 362V376H162V362" fill="none" stroke="#e0b032" stroke-width="4"/><path d="M140 362V376H162V362" fill="none" stroke="#141218" stroke-width="4" stroke-dasharray="3 3"/>' +
        '<path d="M116 364L104 456M186 364L198 456M151 364V456" stroke="#24212c" stroke-width="7" stroke-linecap="round"/><path d="M108 420H194" stroke="#34303d" stroke-width="5"/>',
      tableArt:
        // A steel deck console with a hazard-striped lip.
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="#1d1a24" stroke="#3a3542" stroke-width="1.6"/>` +
        '<rect x="178" y="343" width="282" height="113" fill="#121017" stroke="#2c2834" stroke-width="1.6"/>' +
        `<rect x="178" y="343" width="282" height="10" fill="${AMBER}" fill-opacity=".8"/>` +
        `<path d="${Array.from({ length: 16 }, (_, i) => `M${180 + i * 18} 353l9 -10h8l-9 10z`).join('')}" fill="#121017"/>` +
        '<rect x="196" y="370" width="110" height="66" rx="3" fill="none" stroke="#2c2834" stroke-width="2"/>' +
        '<g fill="#3a3542"><circle cx="204" cy="378" r="2.4"/><circle cx="298" cy="378" r="2.4"/><circle cx="204" cy="428" r="2.4"/><circle cx="298" cy="428" r="2.4"/></g>' +
        '<path d="M330 376H440M330 388H440M330 400H440" stroke="#2c2834" stroke-width="3"/>',
    },
    style:
      // Ambient: the sun breathes, the sea glitters, steam leaks, the radar turns, the beacon blinks, wands sway.
      '.cd-glow{transform-box:fill-box;transform-origin:center;animation:cd-br 7s ease-in-out infinite alternate}@keyframes cd-br{from{opacity:.86}to{opacity:1}}' +
      '.st-done .cd-glow{animation:cd-warm 3s ease-out both}@keyframes cd-warm{from{opacity:.86}to{opacity:1;transform:scale(1.1)}}' +
      '.cd-cl{animation:cd-drift 70s ease-in-out infinite alternate}@keyframes cd-drift{to{transform:translateX(46px)}}' +
      '.cd-sk{opacity:.3;animation:cd-tw 3.4s ease-in-out infinite alternate}' +
      '.cd-gl{opacity:.12;animation:cd-tw 2.4s ease-in-out infinite alternate}@keyframes cd-tw{to{opacity:.55}}' +
      '.cd-wsp{opacity:0;transform-box:fill-box;transform-origin:center;animation:cd-wsp 4.6s ease-out infinite}' +
      '@keyframes cd-wsp{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:.26}100%{opacity:0;transform:translate(26px,-56px) scale(1.7)}}' +
      '.cd-noz{animation:cd-noz 1.3s ease-in-out infinite alternate}@keyframes cd-noz{from{opacity:.5}to{opacity:.8}}' +
      '.cd-abg{opacity:.22}' +
      '.cd-rad{transform-box:fill-box;transform-origin:center;animation:cd-rad 4s linear infinite}' +
      '@keyframes cd-rad{0%,50%,100%{transform:scaleX(1)}25%,75%{transform:scaleX(.06)}}' +
      '.st-web .cd-rad{animation-duration:1.1s}' +
      '.cd-bcn{animation:cd-bcn 2.4s ease-in-out infinite}@keyframes cd-bcn{0%,55%,100%{opacity:.2}18%{opacity:1}}' +
      '.st-error .cd-bcn{animation-duration:1s}' +
      '.cd-win{opacity:.75}.st-sleeping .cd-win{opacity:.3}' +
      '.cd-led{animation:cd-led 2s steps(1) infinite}@keyframes cd-led{50%{opacity:.25}}' +
      // Jets streak high overhead now and then: first 9 s into a state, so a quick state change never shows them,
      // and never over done's formation.
      '.cd-ov{animation:cd-ov 15s linear 9s infinite}@keyframes cd-ov{0%{transform:translateX(0)}22%,100%{transform:translateX(-2200px)}}' +
      '.st-done .cd-ov{opacity:0}' +
      // The crew's arms: each holds an angle and sways; states change the signal.
      '.cd-al,.cd-pt,.cd-st{transform:rotate(var(--r))}' +
      '.cd-al,.cd-pt{animation:cd-sway 4.4s ease-in-out infinite alternate}' +
      '@keyframes cd-sway{from{transform:rotate(calc(var(--r) - 7deg))}to{transform:rotate(calc(var(--r) + 7deg))}}' +
      // Thinking: the crew signal, wands swinging up and down out of step.
      '.st-thinking .cd-al{animation:cd-sig 1.2s ease-in-out infinite alternate}@keyframes cd-sig{from{transform:rotate(92deg)}to{transform:rotate(168deg)}}' +
      // Responding: the deck-edge lights chase toward the bow.
      '.cd-ch{opacity:.2}.st-responding .cd-ch{animation:cd-ch 1.6s ease-out infinite;animation-delay:calc(var(--i) * .12s)}' +
      '@keyframes cd-ch{0%,100%{opacity:.2}8%{opacity:1}36%{opacity:.2}}' +
      // Tool: a control check: the crew sweep their wands side to side, the catapult jet wags its stabilators, and
      // the nearest parked jet spreads its wings with its wingtip lights on.
      '.st-tool .cd-al{animation:cd-wipe .7s ease-in-out infinite alternate}@keyframes cd-wipe{from{transform:rotate(58deg)}to{transform:rotate(118deg)}}' +
      '.st-tool .cd-wag{transform-box:fill-box;animation:cd-wag .8s ease-in-out infinite alternate}@keyframes cd-wag{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}' +
      '.st-tool .cd-fl{animation:cd-unf 1.8s ease-in-out infinite alternate}@keyframes cd-unf{0%,12%{transform:rotate(0)}88%,100%{transform:rotate(var(--u))}}' +
      '.cd-nav{opacity:.15}.st-tool .cd-nav{opacity:1}' +
      // Read: the landing lens comes on, its ball riding up and down between the datum lights; the island scans.
      '.cd-ball{opacity:.35}.st-read .cd-ball{opacity:1;animation:cd-ball 1.5s ease-in-out infinite alternate}@keyframes cd-ball{from{transform:translateY(-14px)}to{transform:translateY(12px)}}' +
      '.cd-dat{opacity:.3}.st-read .cd-dat{opacity:1}' +
      '.st-read .cd-win{animation:cd-scan 1.2s ease-in-out infinite alternate}.st-read .cd-w2{animation-delay:-.6s}@keyframes cd-scan{from{opacity:.4}to{opacity:1}}' +
      // Web: the radars spin up and the mast sends out rings.
      '.cd-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .cd-ring{animation:cd-ring 1.8s ease-out infinite}' +
      '@keyframes cd-ring{0%{opacity:.7;transform:scale(.2)}100%{opacity:0;transform:scale(1)}}' +
      // Run: the shooter signals, the nozzles flare, the catapult throws the jet down the deck in a burst of steam,
      // and it climbs away through the sun, leaving a trail.
      '.st-run .cd-pt{animation:cd-pt 4.2s ease-in-out both}@keyframes cd-pt{0%,4%{transform:rotate(172deg)}11%{transform:rotate(38deg)}18%,100%{transform:rotate(112deg)}}' +
      '.st-run .cd-cat{animation:cd-cat 4.2s linear both}' +
      '@keyframes cd-cat{0%,6%{transform:translate(0,0) scale(1);animation-timing-function:cubic-bezier(.5,0,.9,.7)}' +
      '20%{transform:translate(-23.8px,-87.5px) scale(.19);animation-timing-function:ease-out}33%{transform:translate(-37.5px,-153px) scale(.14)}' +
      '52%{transform:translate(-67.5px,-269px) scale(.094)}76%{transform:translate(-124px,-406px) scale(.056);opacity:1}' +
      '90%,100%{transform:translate(-155px,-469px) scale(.038);opacity:0}}' +
      '.st-run .cd-abg{animation:cd-abg 4.2s ease-out both}@keyframes cd-abg{0%{opacity:.22}5%,80%{opacity:1}100%{opacity:.5}}' +
      '.st-run .cd-noz{animation:none;opacity:1;transform-box:fill-box;transform-origin:center;transform:scale(1.35)}' +
      '.st-responding .cd-noz{animation-duration:.45s}' +
      '.cd-sb{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .cd-sb{animation:cd-sb 3.4s ease-out var(--d) both}' +
      '@keyframes cd-sb{0%{opacity:0;transform:translate(0,0) scale(.3)}10%{opacity:.62;transform:translate(0,-6px) scale(.9)}' +
      '55%{opacity:.32;transform:translate(var(--dx),-34px) scale(1.7)}100%{opacity:0;transform:translate(var(--dx2),-70px) scale(2.3)}}' +
      '.cd-trl{stroke-dasharray:1 2;stroke-dashoffset:1;opacity:0}' +
      '.st-run .cd-trl{animation:cd-trl 4.2s linear both,cd-trf 5s ease-out 3.8s both}' +
      '@keyframes cd-trl{0%,20%{opacity:1;stroke-dashoffset:1}33%{stroke-dashoffset:.83}52%{stroke-dashoffset:.54}76%{stroke-dashoffset:.17}90%,100%{opacity:1;stroke-dashoffset:0}}' +
      '@keyframes cd-trf{from{opacity:1}to{opacity:.35}}' +
      '.cd-go{animation:cd-go 1.6s ease-in infinite}@keyframes cd-go{0%{transform:translateY(0);opacity:1}70%{transform:translateY(-30px);opacity:1}100%{transform:translateY(-34px);opacity:0}}' +
      // Error: a jet on approach is waved off: the red lights blink twice a second, the crew cross their wands
      // overhead, and the jet pulls up hard and climbs away on afterburner.
      '.cd-red{opacity:0}.st-error .cd-red{animation:cd-red .5s steps(1) infinite}@keyframes cd-red{0%{opacity:1}50%{opacity:.08}}' +
      '.st-error .cd-ball{opacity:0}.st-error .cd-dat{opacity:1}' +
      '.st-error .cd-al{animation:cd-off .5s ease-in-out infinite alternate}@keyframes cd-off{from{transform:rotate(148deg)}to{transform:rotate(206deg)}}' +
      '.cd-wv{opacity:0}.st-error .cd-wv{animation:cd-wv 3.4s both}' +
      // The approach crosses the chat column dark: its landing light stays dim and the afterburner off until it is
      // past x 420, where it pulls up beside the sun.
      '@keyframes cd-wv{0%{opacity:0;transform:translate(1060px,380px) scale(.5) rotate(0);animation-timing-function:linear}6%{opacity:1}' +
      '40%{transform:translate(420px,540px) scale(.85) rotate(0);animation-timing-function:ease-in-out}' +
      '50%{transform:translate(330px,522px) scale(.88) rotate(24deg);animation-timing-function:ease-in}' +
      '72%{transform:translate(180px,320px) scale(.75) rotate(32deg);animation-timing-function:linear}92%{opacity:1}' +
      '100%{opacity:0;transform:translate(-140px,40px) scale(.6) rotate(34deg)}}' +
      '.cd-wvab{opacity:0}.st-error .cd-wvab{animation:cd-wvab 3.4s ease-out both}@keyframes cd-wvab{0%,42%{opacity:0}50%,100%{opacity:1}}' +
      '.st-error .cd-ll{animation:cd-ll 3.4s linear both}@keyframes cd-ll{0%,36%{opacity:.12}42%,100%{opacity:1}}' +
      // Done: a formation crosses the sunset drawing contrails, the crew raise their wands, the sun warms.
      '.st-done .cd-al{animation:cd-v .8s ease-in-out infinite alternate}@keyframes cd-v{from{transform:rotate(136deg)}to{transform:rotate(158deg)}}' +
      '.cd-fm{opacity:0}.st-done .cd-fm{animation:cd-fm 3.4s linear .2s both}' +
      '@keyframes cd-fm{0%{opacity:1;transform:translate(-250px,13px)}100%{opacity:1;transform:translate(1850px,-29px)}}' +
      '.cd-ct{opacity:0;stroke-dasharray:2200 2400}.st-done .cd-ct{animation:cd-ct 3.4s linear .2s both,cd-ctf 5s ease-out 3.6s both}' +
      '@keyframes cd-ct{from{opacity:1;stroke-dashoffset:var(--a)}to{opacity:1;stroke-dashoffset:var(--b)}}@keyframes cd-ctf{from{opacity:1}to{opacity:.5}}',
    scenery:
      '<defs>' +
      '<linearGradient id="cd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a12"/><stop offset=".3" stop-color="#110d1b"/>' +
      '<stop offset=".52" stop-color="#1b1222"/><stop offset=".7" stop-color="#2c1525"/><stop offset=".84" stop-color="#461c23"/>' +
      '<stop offset=".94" stop-color="#622720"/><stop offset="1" stop-color="#763020"/></linearGradient>' +
      '<radialGradient id="cd-sg"><stop offset="0" stop-color="#ffcf98" stop-opacity=".62"/><stop offset=".14" stop-color="#ffa25c" stop-opacity=".4"/>' +
      '<stop offset=".4" stop-color="#ff7a3a" stop-opacity=".15"/><stop offset="1" stop-color="#ff6a30" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cd-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a20"/><stop offset=".35" stop-color="#1d1119"/><stop offset="1" stop-color="#0e0a12"/></linearGradient>' +
      '<linearGradient id="cd-dk" gradientUnits="userSpaceOnUse" x1="0" y1="690" x2="0" y2="1000"><stop offset="0" stop-color="#2a1b1f"/><stop offset=".2" stop-color="#18121a"/><stop offset="1" stop-color="#08070c"/></linearGradient>' +
      '<radialGradient id="cd-ab"><stop offset="0" stop-color="#fff0c8"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".8"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cd-wg"><stop offset="0" stop-color="#ffc070" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cd-st"><stop offset="0" stop-color="#f2e4da" stop-opacity=".7"/><stop offset=".6" stop-color="#d8c4ba" stop-opacity=".3"/><stop offset="1" stop-color="#c8b0a8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cd-rg"><stop offset="0" stop-color="#ff3b30" stop-opacity=".6"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cd-gg"><stop offset="0" stop-color="#5cf59a" stop-opacity=".6"/><stop offset="1" stop-color="#5cf59a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cd-cg"><stop offset="0" stop-color="#ffe0a8" stop-opacity=".9"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cd-tr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6dcc6" stop-opacity=".55"/><stop offset="1" stop-color="#f6dcc6" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cd-isl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c1b1d"/><stop offset=".1" stop-color="#151118"/><stop offset="1" stop-color="#0b0a10"/></linearGradient>' +
      '</defs>' +
      // The sky, the first stars, the sun's glow and the clouds it lights from below.
      '<rect width="1600" height="610" fill="url(#cd-sky)"/>' +
      `<path class="cd-sk" d="${stars}" fill="#e8dcf0"/>` +
      '<circle class="cd-glow" cx="250" cy="600" r="480" fill="url(#cd-sg)"/>' +
      `<g class="cd-cl">${clouds}</g>` +
      // The sun on the horizon, two strands of cloud across it.
      '<circle cx="250" cy="600" r="58" fill="#ffb27a"/><circle cx="250" cy="600" r="46" fill="#ffd4a6"/>' +
      '<path d="M140 571H370M190 588H330" stroke="#2a1222" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>' +
      // Jets streaking high overhead, their trails fading behind them.
      '<g class="cd-ov">' +
      topJet(1760, 118, 0.3, -1) +
      '<rect x="1777" y="117" width="280" height="2" fill="url(#cd-tr)"/>' +
      topJet(1840, 148, 0.26, -1) +
      '<rect x="1855" y="147" width="240" height="2" fill="url(#cd-tr)"/></g>' +
      // The sea, the sun's path on it, a far escort on the horizon.
      '<rect y="600" width="1600" height="220" fill="url(#cd-sea)"/>' +
      '<ellipse cx="250" cy="606" rx="280" ry="42" fill="url(#cd-sg)" opacity=".75"/>' +
      glints +
      '<path d="M-50 600H1650" stroke="#ff9a5a" stroke-opacity=".2" stroke-width="2"/>' +
      '<path d="M1110 600L1116 594H1140L1144 587H1152L1156 594H1186L1192 600Z" fill="#120c14"/><circle cx="1150" cy="585" r="1.6" fill="#fff0dc" fill-opacity=".6"/>' +
      // The flight deck running out toward the sun: its sunlit edge, pad eyes, the catapult tracks, the landing
      // area's centreline and the arresting wires.
      '<path d="M60 690H1066L1700 760V1010H-100V766Z" fill="url(#cd-dk)"/>' +
      `<path d="M-100 766L60 690H1066L1700 760" fill="none" stroke="${ORANGE}" stroke-opacity=".35" stroke-width="2.5"/>` +
      `<path d="${pads}" fill="#2e2430" fill-opacity=".7"/>` +
      '<path d="M275 690L360 1000M396 690L900 1000" stroke="#050408" stroke-width="4"/>' +
      '<path d="M278 690L364 1000M399 690L904 1000" stroke="#4a3236" stroke-opacity=".5" stroke-width="1.2"/>' +
      '<path d="M448 690L1130 1000" stroke="#e8dcd4" stroke-opacity=".13" stroke-width="2" stroke-dasharray="18 16"/>' +
      '<path d="M520 690L1450 1000" stroke="#e8dcd4" stroke-opacity=".07" stroke-width="2"/>' +
      wires +
      edge +
      lens() +
      // Jets parked with their wings folded, and two crew among them.
      parked +
      crew(698, 728, 0.3, still(20), still(20), false) +
      crew(900, 766, 0.38, still(28), still(14), false) +
      // The launch: its trail, the steam and the jet on the catapult.
      `<path class="cd-trl" pathLength="1" d="${trail}" fill="none" stroke="#f3d6c0" stroke-opacity=".16" stroke-width="10"/>` +
      `<path class="cd-trl" pathLength="1" d="${trail}" fill="none" stroke="#f8e4d4" stroke-opacity=".55" stroke-width="3"/>` +
      wisps +
      `<g transform="translate(313 830) scale(1.6)"><g class="cd-cat">${rearJet(false, true)}</g></g>` +
      burst +
      // The crew: a director with wands out ahead of the jet, and the shooter beside it.
      crew(112, 736, 0.74, { r: 50, cls: 'cd-al' }, { r: 50, cls: 'cd-al', delay: -0.6 }, true) +
      shooter(176, 944) +
      // The wave-off.
      `<g class="cd-wv">${sideJet()}</g>` +
      // The formation and its contrails.
      `<g fill="none">${contrails}</g><g class="cd-fm">${formation}</g>`,
    nook:
      // The island behind the desk: the hull block lit along its sunward edge, the flight control and bridge
      // levels with their slanted windows, the mast with two radars and the beacon, Claude's emblem on its side.
      '<path d="M196 470V-150H440V470Z" fill="url(#cd-isl)"/>' +
      '<path d="M156 -150L140 -238H440V-150Z" fill="#110e16"/>' +
      '<path class="cd-win" d="M148 -228L158 -166H440V-228Z" fill="#ffae66" fill-opacity=".2"/>' +
      '<path d="M174 -230L180 -164M206 -230V-164M238 -230V-164M270 -230V-164M302 -230V-164M334 -230V-164M366 -230V-164M398 -230V-164" stroke="#08070c" stroke-width="4"/>' +
      '<path d="M178 -238L168 -302H440V-238Z" fill="#0e0c13"/>' +
      '<path class="cd-win cd-w2" d="M172 -294L177 -254H440V-294Z" fill="#ffae66" fill-opacity=".14"/>' +
      '<path d="M196 -296V-252M228 -296V-252M260 -296V-252M292 -296V-252M324 -296V-252M356 -296V-252M388 -296V-252" stroke="#08070c" stroke-width="4"/>' +
      '<path d="M214 -302V-340H440V-302Z" fill="#0c0a11"/>' +
      '<path d="M276 -340L295 -530H305L324 -340" fill="none" stroke="#0b0a10" stroke-width="5"/>' +
      '<path d="M280 -384L318 -404L284 -432L314 -452L288 -480L310 -500M240 -470H360M236 -340V-404" fill="none" stroke="#0b0a10" stroke-width="4"/>' +
      '<rect class="cd-rad" x="262" y="-514" width="76" height="11" rx="2" fill="#0e0c13" stroke="#3a3442" stroke-width="1.5"/>' +
      '<ellipse class="cd-rad" style="animation-delay:-1.3s" cx="236" cy="-412" rx="18" ry="9" fill="#0e0c13" stroke="#3a3442" stroke-width="1.5"/>' +
      '<g fill="#5cf59a" fill-opacity=".7"><circle cx="244" cy="-466" r="2.4"/><circle cx="356" cy="-466" r="2.4"/></g>' +
      '<circle class="cd-bcn" cx="300" cy="-536" r="16" fill="url(#cd-rg)"/><circle class="cd-bcn" cx="300" cy="-536" r="4" fill="#ff4a3a"/>' +
      `<g fill="none" stroke="${ORANGE}" stroke-width="2">${[0, 0.6, 1.2].map(d => `<circle class="cd-ring" style="animation-delay:${d}s" cx="300" cy="-536" r="60"/>`).join('')}</g>` +
      `<path d="M196 470V-150M156 -150L140 -238M178 -238L168 -302M214 -302V-340" fill="none" stroke="${ORANGE}" stroke-opacity=".42" stroke-width="2.5"/>` +
      `<path d="${star(306, -62, 42)}" fill="${CORAL}" fill-opacity=".6"/>` +
      `<g class="cd-win" fill="#ffae66" fill-opacity=".3">${portholes}</g>` +
      // A crew member on the deck beside the desk.
      crew(30, 340, 0.95, { r: 40, cls: 'cd-al' }, { r: 40, cls: 'cd-al', delay: -0.6 }, true),
  }
}
