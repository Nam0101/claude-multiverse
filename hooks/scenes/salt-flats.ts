import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Salt Flats: the timing officer's desk under a canopy on a salt flat at blue hour turning to night. A film of water
// turns the flat into a mirror: the stars, the milky way and the far ranges hang upside down in it, and the salt
// crust shows through as pale hexagons. A land-speed rocket car waits at the start line on the left. When a command
// runs it blasts off along the course with a glowing trail and a plume of salt spray, all mirrored below; an error
// spins it out in a cloud of salt; done fires a record flare while the car coasts in on its chute and the trail
// lingers in the mirror.
const HZ = 590
const GY = 668
const CX = 110
const RUN = 1720
const ACCENT = '#3e7cb1'
const SALT = '#d6e2ec'
const GLOW = '#a8d4ff'
const FRAME = '#56677a'
const FABRIC = '#22384f'
const FABRIC_EDGE = '#35506c'

/** The same markup upside down under the line it stands on: the flat is a mirror. */
const mirror = (markup: string, y: number, opacity: number): string =>
  `<g transform="translate(0 ${2 * y}) scale(1 -1)" opacity="${opacity}">${markup}</g>`

/** Dots as one path of tiny squares, on whole units to keep the markup small. */
function dots(points: [number, number][], size: number): string {
  return points.map(([x, y]) => `M${Math.round(x)} ${Math.round(y)}h${size}v${size}h${-size}z`).join('')
}

/** A mountain range standing on the horizon: peaks and saddles in turn, tapering at both ends. */
function ridge(next: () => number, x0: number, x1: number, step: number, high: number): string {
  let d = `M${x0} ${HZ}`
  let i = 0

  for (let x = x0 + step * 0.5; x < x1; x += step * (0.6 + next() * 0.8), i += 1) {
    const env = Math.pow(Math.sin((Math.PI * (x - x0)) / (x1 - x0)), 0.6)
    const h = high * env * (i % 2 === 0 ? 0.6 + next() * 0.4 : 0.25 + next() * 0.3)

    d += `L${f(x)} ${f(HZ - h)}`
  }

  return `${d}L${x1} ${HZ}Z`
}

/** The salt crust in the foreground: hexagonal plates on the ground plane, seen in perspective. */
function crust(): string {
  const r = 0.42
  const w = 1.5 * r
  const h = Math.sqrt(3) * r
  const at = (x: number, z: number) => `${Math.round(800 + (400 * x) / z)} ${Math.round(HZ + 400 / z)}`
  let d = ''

  for (let i = -16; i <= 16; i += 1) {
    for (let j = 0; j < 6; j += 1) {
      const x = i * w
      const z = 1 + j * h + (i & 1 ? h / 2 : 0)
      const sx = 800 + (400 * x) / z

      if (z < 1.05 || z > 3.5 || sx < -140 || sx > 1740) {
        continue
      }

      d += 'M' + [0, 1, 2, 3, 4, 5].map(k => at(x + r * Math.cos((k * Math.PI) / 3), z + r * Math.sin((k * Math.PI) / 3))).join('L') + 'Z'
    }
  }

  return d
}

/**
 * The rocket car in its own frame: tail at 0, nose at 272, wheels on y 0. Its plume, flame, vapour and chute ride
 * with it. The reflection leaves out the small things (vapour, puffs, the canopy's glint).
 */
function car(reflected: boolean): string {
  const puffs = reflected ? '' : [
    [-70, -12, 12],
    [-140, -24, 16],
    [-215, -36, 20],
    [-290, -46, 22],
  ]
    .map(([x, y, r], i) => `<circle class="sf-pf" style="animation-delay:${-i * 0.3}s" cx="${x}" cy="${y}" r="${r}" fill="${SALT}" fill-opacity=".16"/>`)
    .join('')
  // Cold vapour venting from under the car while it is readied.
  const vapour = reflected
    ? ''
    : [0, 1, 2, 3].map(i => `<circle class="sf-vap" style="animation-delay:${f(-i * 0.55)}s" cx="${20 + i * 56}" cy="-3" r="12" fill="#d8e6f2" fill-opacity=".45"/>`).join('')

  return (
    `<g transform="translate(${CX} ${GY})"><g class="sf-car"><g class="sf-shk">` +
    // The salt spray thrown up behind the rear wheel.
    `<g transform="translate(44 0)"><g class="sf-plm"><path d="M0 0C-50 -6 -150 -44 -330 -74C-344 -50 -344 -24 -330 -6C-200 -2 -80 0 0 0Z" fill="url(#sf-plg)"/>${puffs}</g></g>` +
    // The hot streak and the flame with its shock diamonds.
    '<g transform="translate(0 -25)"><g class="sf-fl"><rect x="-300" y="-12" width="300" height="24" fill="url(#sf-hot)" opacity=".35"/>' +
    '<rect x="-320" y="-3" width="320" height="6" fill="url(#sf-hot)"/>' +
    '<g class="sf-flk"><path d="M0 -9C-40 -10 -90 -4 -130 0C-90 4 -40 10 0 9Z" fill="url(#sf-flo)"/>' +
    '<path d="M0 -5C-20 -5 -40 -2 -58 0C-40 2 -20 5 0 5Z" fill="#f4fbff" fill-opacity=".9"/>' +
    '<path d="M-14 0l5 -4l5 4l-5 4zM-30 0l5 -3.5l5 3.5l-5 3.5zM-46 0l4 -3l4 3l-4 3z" fill="#fff" fill-opacity=".75"/></g></g></g>' +
    // The drag chute, out only at the end of a record run.
    '<g transform="translate(4 -26)"><g class="sf-chu"><g class="sf-chf"><path d="M0 0L-62 -20M0 0L-62 20" stroke="#aab8c6" stroke-width="1.2"/>' +
    '<path d="M-60 -24C-78 -30 -104 -22 -108 0C-104 22 -78 30 -60 24C-66 8 -66 -8 -60 -24Z" fill="#cbd7e2" fill-opacity=".85" stroke="#8fa3b6" stroke-width="1.2"/>' +
    `<path d="M-80 -27C-88 -10 -88 10 -80 27" fill="none" stroke="${ACCENT}" stroke-width="5"/></g></g></g>` +
    // The car itself, inside a pivot at its middle so it can spin out.
    '<g transform="translate(135 0)"><g class="sf-yaw"><g transform="translate(-135 0)">' +
    '<path d="M2 -32L12 -35V-15L2 -18Z" fill="#141b24" stroke="#4a5a6c" stroke-width="1.5"/>' +
    '<ellipse class="sf-noz" cx="4" cy="-25" rx="2.5" ry="6" fill="#9fd0ff"/>' +
    '<path d="M12 -36L4 -88H26L64 -38Z" fill="url(#sf-bdy)" stroke="#9fb4c8" stroke-opacity=".5" stroke-width="1.2" stroke-linejoin="round"/>' +
    `<path d="M14 -82L44 -42" stroke="${ACCENT}" stroke-width="4"/>` +
    '<path d="M12 -12V-36L54 -38C132 -38 198 -32 272 -17C228 -8 132 -6 12 -12Z" fill="url(#sf-bdy)" stroke="#0b1119" stroke-width="1.2"/>' +
    '<path d="M40 -35C120 -36 190 -31 252 -20" fill="none" stroke="#dbe8f2" stroke-opacity=".55" stroke-width="2"/>' +
    `<path d="M30 -22C120 -20 200 -18 262 -17" fill="none" stroke="${ACCENT}" stroke-width="3"/>` +
    '<path d="M16 -24L-4 -18L34 -19Z" fill="#3a4a5c"/>' +
    '<path d="M140 -35C148 -50 176 -50 188 -34Z" fill="#8ec0ea" fill-opacity=".6" stroke="#cfe4f4" stroke-opacity=".6" stroke-width="1.2"/>' +
    '<g fill="#070b11" stroke="#5f748a" stroke-width="2"><circle cx="46" cy="-8" r="8"/><circle cx="216" cy="-8" r="8"/></g>' +
    '<path d="M32 -12Q46 -24 60 -12M202 -12Q216 -24 230 -12" fill="none" stroke="#2a3644" stroke-width="3"/>' +
    (reflected ? '' : '<g transform="translate(170 -44)"><path class="sf-gln" d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="#fff"/></g>') +
    `</g></g></g>${vapour}</g></g></g>`
  )
}

/**
 * The timing console with its speed trace, and a stopwatch clipped on top of its sun hood (well inside the window's
 * right edge at x 420). Self-contained: portals draw the rig alone.
 */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${252 + i * 12}" y="325" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6

    return `M${f(372 + 9 * Math.sin(a))} ${f(192 - 9 * Math.cos(a))}L${f(372 + 11.5 * Math.sin(a))} ${f(192 - 11.5 * Math.cos(a))}`
  }).join('')
  const lit = activity === 'done' ? '#7dffb0' : light

  return (
    '<rect x="244" y="322" width="140" height="9" rx="2" fill="#27323f"/>' +
    keys +
    // The rugged console under its sun hood.
    '<path d="M300 326L316 228L404 232L396 326Z" fill="#1d2733" stroke="#3a4a5c" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M312 232L316 214L412 218L406 236Z" fill="#141c26" stroke="#3a4a5c" stroke-width="1.5" stroke-linejoin="round"/>' +
    `<path d="M314 316L326 242L392 245L387 316Z" fill="#03080f"/><path d="M314 316L326 242L392 245L387 316Z" fill="${light}" fill-opacity=".12"/>` +
    `<g fill="${lit}" fill-opacity=".85"><rect x="331" y="251" width="14" height="5"/><rect x="349" y="251" width="8" height="5"/><rect x="361" y="251" width="20" height="5"/></g>` +
    `<path d="M322 306H386M322 306V262" fill="none" stroke="${light}" stroke-opacity=".3"/>` +
    `<path class="sf-trace" pathLength="1" d="M322 305C342 304 352 296 360 282S376 263 386 261" fill="none" stroke="${light}" stroke-width="2.2"/>` +
    // The stopwatch on its clip: crown and ring on top, a pusher at one o'clock.
    '<path d="M364 217L367 205H377L380 217Z" fill="#27323f" stroke="#3a4a5c" stroke-width="1.2"/>' +
    '<rect x="368.5" y="171" width="7" height="6" fill="#8da2b6"/><circle cx="372" cy="167.5" r="3" fill="none" stroke="#8da2b6" stroke-width="1.8"/>' +
    '<path d="M381 178.5L384.5 175L388.5 179L385 182.5Z" fill="#8da2b6"/>' +
    '<circle cx="372" cy="192" r="15" fill="#2a3542" stroke="#8da2b6" stroke-width="2.2"/><circle cx="372" cy="192" r="12.5" fill="#0a1018"/>' +
    `<path d="${ticks}" stroke="${light}" stroke-opacity=".7" stroke-width="1.5"/>` +
    '<g transform="translate(372 192)"><g class="sf-sw"><path d="M0 2.5V-10" stroke="#f0f4f8" stroke-width="2" stroke-linecap="round"/></g></g>' +
    '<circle cx="372" cy="192" r="1.8" fill="#f0f4f8"/>'
  )
}

export function saltFlatsWorld(): World {
  const next = random(5309)

  // Stars: two twinkling sets outside the chat column, a faint one inside it, a few bright ones with glints.
  const starA: [number, number][] = []
  const starB: [number, number][] = []
  const starC: [number, number][] = []

  // The scattered field, then a denser drift along the milky way (which runs at -22° through (760, 250)).
  for (let i = 0; i < 120; i += 1) {
    const band = i >= 84
    const along = (next() - 0.5) * 1700
    const across = (next() - 0.5) * 150
    const x = band ? 760 + along * 0.927 + across * 0.375 : -40 + next() * 1680
    const y = band ? 250 - along * 0.375 + across * 0.927 : 6 + next() * (HZ - 50)

    if (y > HZ - 12 || y < 0) {
      continue
    }

    ;(x > 400 && x < 1200 ? starC : i % 2 === 0 ? starA : starB).push([x, y])
  }

  const glints = [
    [92, 64, 1],
    [1290, 96, 0.9],
    [1520, 236, 1.1],
    [196, 420, 0.8],
  ]
    .map(
      ([x, y, s], i) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path class="sf-gs" style="animation-delay:${f(-i * 0.9)}s" d="M0 -9L1.4 -1.4L9 0L1.4 1.4L0 9L-1.4 1.4L-9 0L-1.4 -1.4Z" fill="#eaf2ff"/></g>`,
    )
    .join('')
  // What the mirror shows of the sky: all but one set of stars.
  const sky =
    `<path class="sf-tw1" d="${dots(starA, 3)}" fill="#dce8ff"/>` +
    `<path d="${dots(starC, 1.8)}" fill="#c8dcff" fill-opacity=".45"/>` +
    glints +
    // The milky way: a soft band, its bright core rising out of the left horizon, a soft dust lane.
    `<g clip-path="url(#sf-up)"><g transform="rotate(-22 760 250)"><ellipse cx="760" cy="250" rx="1000" ry="130" fill="url(#sf-mw)"/>` +
    '<ellipse cx="270" cy="250" rx="300" ry="80" fill="url(#sf-mw)"/><ellipse cx="300" cy="254" rx="150" ry="38" fill="url(#sf-mw)"/>' +
    '<ellipse cx="640" cy="258" rx="620" ry="26" fill="url(#sf-lane)"/></g></g>'

  const ranges =
    `<g stroke-linejoin="round" stroke-width="1.4"><path d="${ridge(next, -60, 660, 58, 92)}" fill="#0c192c" stroke="#36597f" stroke-opacity=".45"/>` +
    `<path d="${ridge(next, 920, 1700, 60, 128)}" fill="#0d1b30" stroke="#3e6690" stroke-opacity=".5"/>` +
    `<path d="${ridge(next, 560, 1080, 80, 16)}" fill="#0a1626" stroke="#2a4566" stroke-opacity=".4"/>` +
    `<g fill="#070e1a" stroke="#1f3552" stroke-opacity=".5"><path d="${ridge(next, -80, 400, 48, 58)}"/><path d="${ridge(next, 1180, 1700, 52, 70)}"/></g></g>`

  const camp = `<path d="${dots([[150, 585], [166, 586], [188, 584], [232, 586], [246, 585]], 2.4)}" fill="#ffc27a" fill-opacity=".75"/>`

  const ripples = Array.from({ length: 6 }, (_, i) => {
    const y = 604 + i * i * 9 + next() * 6

    return `<ellipse class="sf-rp" style="animation-delay:${f(-next() * 9)}s" cx="${Math.round(200 + next() * 1200)}" cy="${Math.round(y)}" rx="${Math.round(260 + next() * 340)}" ry="1.2" fill="url(#sf-dim)"/>`
  }).join('')

  // Marker lamps along the course, and the start gate with its light curtain.
  const lampX = Array.from({ length: 11 }, (_, i) => 130 + i * 145)
  const posts = `<path d="${lampX.map(x => `M${x} ${GY - 6}V${GY - 17}`).join('')}" stroke="#0b121c" stroke-width="3"/>`
  const lamps = lampX
    .map((x, i) => {
      const dim = x > 420 && x < 1180

      return `<circle class="sf-lp" style="--i:${i}" cx="${x}" cy="${GY - 19}" r="${dim ? 1.8 : 3.2}" fill="#ffc27a"${dim ? ' fill-opacity=".45"' : ''}/>`
    })
    .join('')
  const gate =
    '<path d="M398 660V548H402V660Z" fill="#0b121c" stroke="#2a3d55"/><rect x="388" y="538" width="24" height="12" rx="2" fill="#101a27" stroke="#34506e" stroke-width="1.5"/>' +
    '<rect class="sf-cur" x="398.5" y="552" width="3" height="108" fill="url(#sf-cur)"/><circle cx="400" cy="552" r="2.6" fill="#bfe0ff"/>' +
    '<circle class="sf-wl" cx="400" cy="530" r="4.5" fill="#ff5a4a"/>'
  const sock =
    '<path d="M70 648V512" stroke="#4a5d74" stroke-width="3"/><circle cx="70" cy="511" r="3" fill="#6a8099"/>' +
    '<g transform="translate(70 516)"><g class="sf-sock"><path d="M0 -8L64 -4V4L0 8Z" fill="#d97a3a" fill-opacity=".8"/>' +
    '<path d="M16 -7.2V7.2M32 -6.2V6.2M48 -5.2V5.2" stroke="#e8eef4" stroke-opacity=".8" stroke-width="6"/></g></g>'

  // The trail the car leaves: a wide soft glow, a band and a hot core, revealed behind it as it goes.
  const trail = (
    [
      [26, 0.1],
      [10, 0.22],
      [3, 0.95],
    ] as const
  )
    .map(([w, o]) => `<line class="sf-tr" pathLength="1" x1="${CX}" y1="${GY - 25}" x2="${CX + RUN}" y2="${GY - 25}" stroke="url(#sf-trg)" stroke-opacity="${o}" stroke-width="${w}"/>`)
    .join('')

  // The salt cloud of a spin-out, and the chunks it throws.
  const cloud = Array.from({ length: 10 }, (_, i) => {
    const x = 310 + (next() - 0.6) * 220
    const y = GY - 16 - next() * 56

    return (
      `<ellipse class="sf-cl" style="--dx:${Math.round(-90 + next() * 100)}px;--dy:${Math.round(-20 - next() * 60)}px;--d:${f(0.3 + i * 0.11)}s" ` +
      `cx="${Math.round(x)}" cy="${Math.round(y)}" rx="${Math.round(76 + next() * 50)}" ry="${Math.round(40 + next() * 26)}" fill="url(#sf-clg)"/>`
    )
  }).join('')
  const chunks = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.1 + next() * 0.8)

    return `<rect class="sf-ch" style="--dx:${Math.round(Math.cos(a) * (110 + next() * 120))}px;--dy:${Math.round(-Math.sin(a) * (40 + next() * 70))}px;--d:${f(0.4 + i * 0.07)}s" x="330" y="${GY - 10}" width="4" height="4" fill="${SALT}"/>`
  }).join('')

  // The record flare: it climbs from the far start area and bursts over the left of the flat.
  const ray = (count: number, from: number, to: number) =>
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + from * 0.01
      const len = to * (0.75 + next() * 0.4)

      return `M${Math.round(Math.cos(a) * from)} ${Math.round(Math.sin(a) * from)}L${Math.round(Math.cos(a) * len)} ${Math.round(Math.sin(a) * len)}`
    }).join('')
  const rays = ray(18, 16, 140)
  const spokes = ray(12, 10, 70)
  const embers = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    const d = 50 + next() * 70

    return `<circle class="sf-fp" style="animation-delay:${f(1.3 + next() * 0.4)}s" cx="${Math.round(Math.cos(a) * d)}" cy="${Math.round(Math.sin(a) * d)}" r="2.6" fill="#ffe2a0"/>`
  }).join('')
  const flare = (sparks: string) =>
    '<line class="sf-fr" pathLength="1" x1="236" y1="604" x2="250" y2="300" stroke="url(#sf-frg)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<g transform="translate(250 300)"><circle class="sf-fb" r="170" fill="url(#sf-flg)"/>' +
    `<g class="sf-fs"><path d="${rays}" stroke="#ffe2a0" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${spokes}" stroke="#dff0ff" stroke-width="2" stroke-linecap="round"/><circle r="8" fill="#fff6dc"/></g>${sparks}</g>`

  // A relay mast on the far left range: it sends while Claude is on the web.
  const mast =
    `<path d="M300 ${HZ}V${HZ - 68}M294 ${HZ - 40}H306M295 ${HZ - 22}H305" stroke="#2a3b50" stroke-width="3"/>` +
    `<circle class="sf-avl" cx="300" cy="${HZ - 70}" r="2.6" fill="#ff7a5a"/>` +
    [0, 0.6, 1.2].map(d => `<circle class="sf-rg" style="animation-delay:${d}s" cx="300" cy="${HZ - 70}" r="20" fill="none" stroke="${GLOW}" stroke-width="2"/>`).join('')

  const valance =
    'M-44 6H452V22' + Array.from({ length: 12 }, () => 'q-20.7 12 -41.3 0').join('') + 'Z'
  const crustFoot = 'M-60 458' + Array.from({ length: 18 }, (_, i) => `q${f(10 + (i % 3) * 3)} ${-5 - (i % 2) * 3} ${f(30 + (i % 3) * 2)} 0`).join('') + 'V462H-60Z'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#04070d',
      furniture: '#2c3846',
      metal: '#27323f',
      paper: '#d8e2ea',
      light: { idle: ACCENT, work: '#6fb4ff', bright: '#d4ecff' },
      headTop: 198,
      glowAt: [356, 278],
      device,
      wear: {
        // A wide-brimmed desert hat with an accent band, and the timing headset over it. All of it ends above
        // y 254, where the eyes begin; the ear cups sit outside the eye columns.
        front:
          '<path d="M50 244C62 234 96 230 150 230C204 230 238 234 250 244C232 249 196 247 150 247C104 247 68 249 50 244Z" fill="#4c4a3e" stroke="#6b6854" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M88 234C88 207 112 197 150 197C188 197 212 207 212 234Z" fill="#5a5747" stroke="#6b6854" stroke-width="2"/>' +
          `<path d="M88 225H212V234H88Z" fill="${ACCENT}" fill-opacity=".85"/>` +
          '<path d="M80 252C80 197 112 188 150 188C188 188 220 197 220 252" fill="none" stroke="#1a2029" stroke-width="5"/>' +
          '<rect x="64" y="246" width="16" height="32" rx="5" fill="#1a2029" stroke="#3a4656" stroke-width="1.5"/>' +
          '<rect x="220" y="246" width="18" height="34" rx="5" fill="#1a2029" stroke="#3a4656" stroke-width="1.5"/>' +
          '<path d="M232 276C246 288 252 296 254 303" fill="none" stroke="#1a2029" stroke-width="4" stroke-linecap="round"/>' +
          `<circle cx="254" cy="305" r="4" fill="#2a3442" stroke="${ACCENT}" stroke-width="1.2"/>`,
      },
      seatArt:
        // A folding camp chair: the back sling, the seat sling, the crossed legs.
        `<path d="M66 254L84 250L110 352L92 354Z" fill="${FABRIC}" stroke="${FABRIC_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
        `<g stroke="${FRAME}" stroke-width="5" stroke-linecap="round"><path d="M98 362L198 452M198 362L98 452M76 250L100 356"/></g>` +
        `<path d="M90 350Q150 366 208 350L206 360Q150 376 92 360Z" fill="${FABRIC}" stroke="${FABRIC_EDGE}" stroke-width="2"/>` +
        `<path d="M86 453H112M184 453H210" stroke="${FRAME}" stroke-width="4" stroke-linecap="round"/>`,
      tableArt:
        // A folding camp table, a cooler under it, salt crusted round the feet.
        `<g stroke="${FRAME}" stroke-width="4" stroke-linecap="round"><path d="M194 340L256 452M256 340L194 452M394 340L456 452M456 340L394 452"/></g>` +
        '<rect x="166" y="329" width="304" height="10" rx="2" fill="#2c3846" stroke="#4a5b6e" stroke-width="1.5"/>' +
        `<path d="${Array.from({ length: 11 }, (_, i) => `M${192 + i * 26} 331V337`).join('')}" stroke="#1d2733" stroke-width="1.5"/>` +
        '<rect x="292" y="404" width="84" height="52" rx="5" fill="#24425f" stroke="#3a5d80" stroke-width="2"/>' +
        '<rect x="288" y="398" width="92" height="10" rx="3" fill="#b9c8d6" fill-opacity=".75"/>' +
        '<path d="M318 398V391H350V398" fill="none" stroke="#b9c8d6" stroke-opacity=".7" stroke-width="3"/>' +
        `<path d="M150 456q12 -7 26 0q10 -6 22 0M282 456q14 -8 30 0q12 -6 26 0q12 -7 26 0M428 456q12 -6 24 0" fill="${SALT}" fill-opacity=".22"/>`,
    },
    style:
      // Ambient: stars twinkle, the mirror ripples, the windsock and the canopy move, beacons glow, now and then a meteor.
      '.sf-tw1{animation:sf-tw 3.6s ease-in-out infinite alternate}.sf-tw2{animation:sf-tw 2.7s ease-in-out -1.3s infinite alternate}' +
      '@keyframes sf-tw{from{opacity:.3}to{opacity:1}}' +
      '.st-done .sf-tw1,.st-done .sf-tw2{animation-duration:1.4s}' +
      '.sf-gs{transform-box:fill-box;transform-origin:center;animation:sf-gs 4s ease-in-out infinite alternate}' +
      '@keyframes sf-gs{from{transform:scale(.55);opacity:.45}to{transform:scale(1.1);opacity:1}}' +
      '.sf-rp{animation:sf-rp 10s ease-in-out infinite alternate}@keyframes sf-rp{from{transform:translateX(-30px);opacity:.4}to{transform:translateX(30px);opacity:1}}' +
      '.st-read .sf-rp{animation-duration:30s}' +
      '.sf-sock{animation:sf-sock 3.2s ease-in-out infinite alternate}@keyframes sf-sock{from{transform:rotate(4deg) scaleX(.84)}to{transform:rotate(-3deg) scaleX(1)}}' +
      '.st-tool .sf-sock,.st-run .sf-sock,.st-error .sf-sock{animation-duration:.8s}' +
      '.sf-val{transform-box:fill-box;transform-origin:50% 0;animation:sf-val 3.8s ease-in-out infinite alternate}@keyframes sf-val{from{transform:skewX(-2deg)}to{transform:skewX(2deg)}}' +
      '.sf-bcn{animation:sf-bcn 2.6s ease-in-out infinite}@keyframes sf-bcn{0%,100%{opacity:.2}50%{opacity:.85}}' +
      '.st-error .sf-bcn{animation-duration:.8s}' +
      '.sf-avl{animation:sf-bcn 2.2s ease-in-out infinite}' +
      '.sf-gln{animation:sf-gln 5s ease-in-out infinite}@keyframes sf-gln{0%,70%,100%{opacity:0}80%{opacity:.9}}' +
      '.sf-met{opacity:0;animation:sf-met 12s linear infinite}.sf-m2{animation-delay:-6s}.sf-m3{animation-delay:-3s}' +
      '@keyframes sf-met{0%,88%{opacity:0;transform:translate(0,0)}90%{opacity:.9}96%,100%{opacity:0;transform:translate(-240px,120px)}}' +
      // Thinking: meteors streak over the flat, and through the mirror.
      '.st-thinking .sf-met{animation:sf-mt2 2.4s linear infinite}.st-thinking .sf-m2{animation-delay:-1.2s}.st-thinking .sf-m3{animation-delay:-.6s}' +
      '@keyframes sf-mt2{0%{opacity:0;transform:translate(0,0)}8%{opacity:.95}40%,100%{opacity:0;transform:translate(-240px,120px)}}' +
      // Responding: the course lamps chase toward the far end.
      '.sf-lp{opacity:.5}.st-responding .sf-lp{animation:sf-lp 1.5s ease-in-out infinite;animation-delay:calc(var(--i) * .1s)}' +
      '@keyframes sf-lp{0%,100%{opacity:.3}15%{opacity:1}}.st-done .sf-lp{opacity:1}' +
      // Read: the water goes still and a sheen reads across the mirror.
      '.sf-sh{opacity:0}.st-read .sf-sh{animation:sf-sh 4s ease-in-out infinite}' +
      '@keyframes sf-sh{0%{opacity:0;transform:translateX(-300px)}15%,85%{opacity:1}100%{opacity:0;transform:translateX(1700px)}}' +
      // Web: the relay mast on the range sends.
      '.sf-rg{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .sf-rg{animation:sf-rg 1.8s ease-out infinite}' +
      '@keyframes sf-rg{0%{opacity:.8;transform:scale(.2)}100%{opacity:0;transform:scale(1.6)}}' +
      // Tool: the car warms up, its nozzle glowing and venting.
      '.sf-noz{opacity:.35}.st-tool .sf-noz{animation:sf-noz .9s ease-in-out infinite alternate}@keyframes sf-noz{from{opacity:.3}to{opacity:1}}' +
      '.sf-vap{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .sf-vap{animation:sf-vap 2.1s ease-out infinite}' +
      '@keyframes sf-vap{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translate(-50px,-34px) scale(2.6)}}' +
      // The stopwatch and the speed trace on the console.
      '.sf-sw{animation:mv-spin 60s linear infinite}.st-responding .sf-sw{animation-duration:10s}' +
      '.st-tool .sf-sw,.st-web .sf-sw,.st-read .sf-sw{animation-duration:4s}.st-run .sf-sw{animation-duration:1s}' +
      '.st-done .sf-sw{animation:none;transform:rotate(132deg)}' +
      '.st-error .sf-sw{animation:sf-jit .25s ease-in-out infinite alternate}@keyframes sf-jit{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}' +
      '.sf-trace{stroke-dasharray:1 1;stroke-dashoffset:.35}.st-done .sf-trace{stroke-dashoffset:0}' +
      '.st-run .sf-trace{animation:sf-trace 5s linear infinite}' +
      '@keyframes sf-trace{0%,12%{stroke-dashoffset:1;animation-timing-function:cubic-bezier(.55,0,.95,.55)}52%,100%{stroke-dashoffset:0}}' +
      // Run: ignition, then the car blasts off along the course, its trail drawn out behind it.
      '.sf-fl,.sf-plm,.sf-chu,.sf-cl,.sf-ch,.sf-wl,.sf-fr,.sf-fb,.sf-fs,.sf-fp{opacity:0}' +
      '.sf-tr{stroke-dasharray:1 1;stroke-dashoffset:1}' +
      '.st-run .sf-car{animation:sf-go 5s linear infinite}' +
      '@keyframes sf-go{0%,12%{transform:translateX(0);opacity:1;animation-timing-function:cubic-bezier(.55,0,.95,.55)}' +
      `52%{transform:translateX(${RUN}px);opacity:1}53%,88%{transform:translateX(${RUN}px);opacity:0}89%{transform:translateX(0);opacity:0}100%{transform:translateX(0);opacity:1}}` +
      '.st-run .sf-shk{animation:sf-shk .09s linear infinite alternate}@keyframes sf-shk{from{transform:translateY(-.8px)}to{transform:translateY(.8px)}}' +
      '.st-run .sf-fl{animation:sf-ign 5s linear infinite}' +
      '@keyframes sf-ign{0%,2%{opacity:0;transform:scaleX(.1)}12%{opacity:1;transform:scaleX(1)}52%{opacity:1;transform:scaleX(1.35)}53%,100%{opacity:0;transform:scaleX(.1)}}' +
      '.sf-flk{animation:sf-flk .18s ease-in-out infinite alternate}@keyframes sf-flk{from{transform:scaleX(.86)}to{transform:scaleX(1.06)}}' +
      '.st-run .sf-plm{animation:sf-plm 5s linear infinite}' +
      '@keyframes sf-plm{0%,12%{opacity:0;transform:scale(.15,.3)}30%{opacity:1;transform:scale(1)}52%{opacity:1;transform:scale(1.1)}53%,100%{opacity:0}}' +
      '.sf-pf{transform-box:fill-box;transform-origin:center;animation:sf-pf 1.2s ease-in-out infinite alternate}@keyframes sf-pf{from{transform:scale(.8)}to{transform:scale(1.15)}}' +
      '.st-run .sf-tr{animation:sf-tr 5s linear infinite}' +
      '@keyframes sf-tr{0%,12%{stroke-dashoffset:1;opacity:1;animation-timing-function:cubic-bezier(.55,0,.95,.55)}52%{stroke-dashoffset:0;opacity:1}' +
      '78%{stroke-dashoffset:0;opacity:.8}88%{stroke-dashoffset:0;opacity:0}89%,100%{stroke-dashoffset:1;opacity:0}}' +
      '.sf-cur{opacity:.4}.st-run .sf-cur{animation:sf-cur 5s linear infinite}@keyframes sf-cur{0%,15%{opacity:.4}17%{opacity:1}26%,100%{opacity:.4}}' +
      // Error: the flame chokes, the car lurches and spins out in a cloud of salt; the gate lamp warns.
      '.st-error .sf-car{animation:sf-lur 1.8s cubic-bezier(.2,.7,.3,1) both}@keyframes sf-lur{to{transform:translateX(90px)}}' +
      '.st-error .sf-yaw{animation:sf-yaw 2.6s ease-out .4s both}' +
      '@keyframes sf-yaw{0%{transform:scaleX(1) rotate(0)}18%{transform:scaleX(.1) rotate(-4deg)}36%{transform:scaleX(-1) rotate(3deg)}' +
      '56%{transform:scaleX(-.1) rotate(-3deg)}76%{transform:scaleX(.8) rotate(1deg)}100%{transform:scaleX(.4) rotate(-2deg)}}' +
      '.st-error .sf-fl{animation:sf-cut 1s ease-out both}@keyframes sf-cut{0%{opacity:0;transform:scaleX(.2)}30%{opacity:1;transform:scaleX(.9)}55%,100%{opacity:0;transform:scaleX(.3)}}' +
      '.sf-cl{transform-box:fill-box;transform-origin:center}.st-error .sf-cl{animation:sf-cl 4s ease-out var(--d) both}' +
      '@keyframes sf-cl{0%{opacity:0;transform:translate(0,0) scale(.25)}22%{opacity:1}100%{opacity:.45;transform:translate(var(--dx),var(--dy)) scale(1.5)}}' +
      '.st-error .sf-ch{animation:sf-ch 1.3s cubic-bezier(.2,.6,.4,1) var(--d) both}' +
      '@keyframes sf-ch{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-error .sf-wl{animation:sf-wl .8s ease-in-out infinite}@keyframes sf-wl{0%,100%{opacity:.15}50%{opacity:1}}' +
      // Done: the car coasts in on its chute, the trail lingers (longest in the mirror), a record flare bursts.
      '.st-done .sf-car{animation:sf-cst 2.4s cubic-bezier(.15,.7,.3,1) both}@keyframes sf-cst{from{transform:translateX(840px)}to{transform:translateX(1090px)}}' +
      '.st-done .sf-chu{animation:sf-chu 1.1s ease-out .25s both}@keyframes sf-chu{0%{opacity:0;transform:scale(.1,.2)}35%{opacity:1}100%{opacity:1;transform:scale(1)}}' +
      '.sf-chf{animation:sf-chf .45s ease-in-out infinite alternate}@keyframes sf-chf{from{transform:scaleY(.92)}to{transform:scaleY(1.05)}}' +
      '.st-done .sf-tr{animation:sf-lnd 2.4s cubic-bezier(.15,.7,.3,1) both,sf-lng 7s ease-out both}' +
      '@keyframes sf-lnd{from{stroke-dashoffset:.51}to{stroke-dashoffset:.366}}@keyframes sf-lng{to{opacity:.25}}' +
      '.st-done .sf-trm .sf-tr{animation-name:sf-lnd,sf-lngm}@keyframes sf-lngm{to{opacity:.9}}' +
      '.sf-fr{stroke-dasharray:1 1;stroke-dashoffset:1}.st-done .sf-fr{animation:sf-fr 1.6s ease-out .15s both}' +
      '@keyframes sf-fr{0%{opacity:1;stroke-dashoffset:1}50%{opacity:1;stroke-dashoffset:0}100%{opacity:0;stroke-dashoffset:0}}' +
      '.sf-fb,.sf-fs{transform-box:fill-box;transform-origin:center}' +
      '.st-done .sf-fb{animation:sf-fb 4s ease-out .9s both}@keyframes sf-fb{0%{opacity:0;transform:scale(.2)}15%{opacity:1;transform:scale(1)}100%{opacity:.35;transform:scale(1.25)}}' +
      '.st-done .sf-fs{animation:sf-fs 3.6s cubic-bezier(.2,.7,.3,1) .9s both}' +
      '@keyframes sf-fs{0%{opacity:0;transform:scale(.15)}10%{opacity:1}55%{opacity:.85;transform:scale(1.15)}100%{opacity:0;transform:scale(1.3)}}' +
      '.st-done .sf-fp{animation:sf-fp 3.2s ease-in both}' +
      '@keyframes sf-fp{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(110px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060f"/><stop offset=".5" stop-color="#061025"/><stop offset=".84" stop-color="#0c2142"/><stop offset="1" stop-color="#1a3a5f"/></linearGradient>' +
      '<linearGradient id="sf-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3c60"/><stop offset=".08" stop-color="#11284a"/><stop offset=".45" stop-color="#081530"/><stop offset="1" stop-color="#050b1b"/></linearGradient>' +
      '<radialGradient id="sf-twl"><stop offset="0" stop-color="#4a7eac" stop-opacity=".6"/><stop offset=".4" stop-color="#2c5682" stop-opacity=".26"/><stop offset="1" stop-color="#1c3c64" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sf-mw"><stop offset="0" stop-color="#b4c8ec" stop-opacity=".18"/><stop offset=".5" stop-color="#8aa4d4" stop-opacity=".07"/><stop offset="1" stop-color="#8aa4d4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sf-lane"><stop offset="0" stop-color="#02050c" stop-opacity=".4"/><stop offset="1" stop-color="#02050c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sf-mh"><stop offset="0" stop-color="#cfe0f6" stop-opacity=".22"/><stop offset="1" stop-color="#cfe0f6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sf-hzl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bcd6ee" stop-opacity=".32"/><stop offset=".3" stop-color="#bcd6ee" stop-opacity=".16"/><stop offset=".7" stop-color="#bcd6ee" stop-opacity=".2"/><stop offset="1" stop-color="#bcd6ee" stop-opacity=".62"/></linearGradient>' +
      '<linearGradient id="sf-dim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#bcd2e4" stop-opacity=".26"/><stop offset=".24" stop-color="#bcd2e4" stop-opacity=".22"/><stop offset=".34" stop-color="#bcd2e4" stop-opacity=".07"/><stop offset=".66" stop-color="#bcd2e4" stop-opacity=".07"/><stop offset=".76" stop-color="#bcd2e4" stop-opacity=".22"/><stop offset="1" stop-color="#bcd2e4" stop-opacity=".26"/></linearGradient>' +
      `<linearGradient id="sf-trg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="${GLOW}"/><stop offset=".24" stop-color="${GLOW}"/><stop offset=".34" stop-color="${GLOW}" stop-opacity=".4"/><stop offset=".7" stop-color="${GLOW}" stop-opacity=".4"/><stop offset=".78" stop-color="${GLOW}"/><stop offset="1" stop-color="${GLOW}"/></linearGradient>` +
      '<linearGradient id="sf-bdy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#abbdcd"/><stop offset=".4" stop-color="#72889d"/><stop offset="1" stop-color="#27333f"/></linearGradient>' +
      '<linearGradient id="sf-plg" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#e8f0f6" stop-opacity=".68"/><stop offset=".45" stop-color="#c8d8e6" stop-opacity=".3"/><stop offset="1" stop-color="#c8d8e6" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="sf-hot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${GLOW}" stop-opacity="0"/><stop offset=".7" stop-color="${GLOW}" stop-opacity=".4"/><stop offset="1" stop-color="#e8f6ff" stop-opacity=".95"/></linearGradient>` +
      '<linearGradient id="sf-flo" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff6e0" stop-opacity=".95"/><stop offset=".3" stop-color="#ffc070" stop-opacity=".8"/><stop offset=".7" stop-color="#ff8a3a" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a30" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="sf-clg"><stop offset="0" stop-color="#e2eaf2" stop-opacity=".55"/><stop offset=".6" stop-color="#c8d6e2" stop-opacity=".24"/><stop offset="1" stop-color="#c8d6e2" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sf-flg"><stop offset="0" stop-color="#fff0c8" stop-opacity=".35"/><stop offset=".4" stop-color="#ffcf6a" stop-opacity=".14"/><stop offset="1" stop-color="#ffb040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sf-frg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffcf6a" stop-opacity="0"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>' +
      '<linearGradient id="sf-cur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".7"/><stop offset="1" stop-color="#bfe0ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="sf-bcg"><stop offset="0" stop-color="#ffc46a" stop-opacity=".45"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sf-shg"><stop offset="0" stop-color="#cfe2f4" stop-opacity=".18"/><stop offset="1" stop-color="#cfe2f4" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sf-mtg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#bcd6ff" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="sf-up"><rect x="-200" y="-200" width="2000" height="${HZ + 200}"/></clipPath>` +
      '</defs>' +
      // The sky and its reflection.
      `<rect width="1600" height="${HZ}" fill="url(#sf-sky)"/><rect y="${HZ}" width="1600" height="${1000 - HZ}" fill="url(#sf-sea)"/>` +
      sky +
      `<path class="sf-tw2" d="${dots(starB, 2.4)}" fill="#c8dcff"/>` +
      mirror(sky, HZ, 0.62) +
      // The moon, and two meteors (one low enough to show in the mirror).
      '<circle cx="180" cy="118" r="80" fill="url(#sf-mh)"/><path d="M180 96a22 22 0 1 0 0 44a16 22 0 1 1 0 -44Z" fill="#e6eef8" fill-opacity=".85"/>' +
      '<g transform="translate(330 380)"><line class="sf-met" x1="0" y1="0" x2="48" y2="-24" stroke="url(#sf-mtg)" stroke-width="2.2"/></g>' +
      `<g transform="translate(0 ${2 * HZ}) scale(1 -1)" opacity=".5"><g transform="translate(330 380)"><line class="sf-met" x1="0" y1="0" x2="48" y2="-24" stroke="url(#sf-mtg)" stroke-width="2.2"/></g></g>` +
      '<g transform="translate(1360 150)"><line class="sf-met sf-m2" x1="0" y1="0" x2="60" y2="-30" stroke="url(#sf-mtg)" stroke-width="2.2"/></g>' +
      '<g transform="translate(1560 330)"><line class="sf-met sf-m3" x1="0" y1="0" x2="60" y2="-30" stroke="url(#sf-mtg)" stroke-width="2.2"/></g>' +
      // The last of the blue hour over the far right, the ranges, and the horizon line between them and their reflections.
      `<g class="mv-r"><ellipse cx="1340" cy="${HZ}" rx="900" ry="270" fill="url(#sf-twl)"/></g>` +
      ranges +
      mirror(ranges, HZ, 0.8) +
      camp +
      mirror(camp, HZ - 1, 0.5) +
      mast +
      mirror(mast, HZ, 0.45) +
      `<rect x="-20" y="${HZ - 1}" width="1640" height="2" fill="url(#sf-hzl)"/>` +
      // The mirror's surface: slow ripples, then the salt crust in the foreground and the black course line.
      ripples +
      `<path d="${crust()}" fill="none" stroke="url(#sf-dim)" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M-20 ${GY + 1}H1620" stroke="#02040a" stroke-opacity=".85" stroke-width="3"/>` +
      `<ellipse class="sf-sh" cx="160" cy="${HZ + 120}" rx="220" ry="110" fill="url(#sf-shg)"/>` +
      // The windsock, the start gate, the course lamps, all standing in their own reflections.
      sock +
      mirror(sock, 648, 0.45) +
      gate +
      mirror(gate, 660, 0.45) +
      posts +
      lamps +
      mirror(lamps, GY - 6, 0.45) +
      // The run: the trail, the car and its reflection.
      mirror(`<g class="sf-trm">${trail}</g>`, GY, 0.55) +
      trail +
      mirror(car(true), GY, 0.5) +
      car(false) +
      // The spin-out cloud.
      mirror(cloud, GY, 0.45) +
      cloud +
      chunks +
      // The record flare.
      mirror(flare(''), 604, 0.45) +
      flare(embers),
    nook:
      // The timing canopy: a guy rope, two poles, the roof, a fluttering valance and an amber beacon on top.
      '<path d="M-14 8L-96 456" stroke="#1c2a3a" stroke-width="1.5"/>' +
      '<rect x="-18" y="0" width="6" height="456" fill="#2a3644"/><rect x="402" y="0" width="6" height="456" fill="#2a3644"/>' +
      '<path d="M-44 6L44 -40H366L452 6Z" fill="#0e1a29" stroke="#26394f" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M44 -40L-10 6M366 -40L420 6M206 -40V6" stroke="#1b2b3e" stroke-width="2"/>' +
      `<g class="sf-val"><path d="${valance}" fill="#132437" stroke="#26394f" stroke-width="1.5"/><path d="M-44 12H452" stroke="${ACCENT}" stroke-opacity=".7" stroke-width="2.5"/></g>` +
      '<rect x="196" y="-48" width="20" height="8" rx="2" fill="#2a3644"/><path d="M199 -48a7 7 0 0 1 14 0Z" fill="#ffb347" fill-opacity=".55"/>' +
      '<g class="sf-bcn"><circle cx="206" cy="-50" r="28" fill="url(#sf-bcg)"/><circle cx="206" cy="-50" r="3.6" fill="#ffd28a"/></g>',
    front: `<path d="${crustFoot}" fill="${SALT}" fill-opacity=".14"/>`,
  }
}
