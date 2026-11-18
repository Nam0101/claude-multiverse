import type { Activity } from '../../types'
import { f, random } from './kit'
import { CORAL } from './rig'
import type { World } from './world'

// Mothership: a signal operator in big headphones at a field receiver on a desert plain at night. A colossal saucer
// fills the top-left of the sky, its underside a terraced disc of light rings around a glowing port, five coloured
// tone panels round it, a radio dish listening on the right, scout craft hovering, a far town. When a command runs
// Claude plays five coloured keys, the ship answers panel by panel and lowers a beam onto the landing ring; an error
// browns out the town, the beam sputters out and the ship pulls away; done is the greeting: every panel glows, rings
// of light roll across the underside, the rim turns to colours and the scouts dance.
const SX = 220
const SY = 150
const RX = 900
const RY = 205
const PX = SX
const PY = SY + 16
const TONES = ['#ff7a9c', '#ffb54a', '#a6e36b', '#5fd3ff', '#b48cff']
const VIOLET = '#b48cff'
const LAV = '#e2d4ff'
const WARM = '#ffecc8'
const HULL = '#0c0a17'
const METAL = '#231e38'
const EDGE = '#3a3258'
const NIGHT = '#06050c'
/** When each tone sounds in a run: three a second at most. */
const toneAt = (i: number): number => 0.15 + i * 0.34

/** An ellipse of the underside, `s` of the way out from the port. */
const ring = (s: number, attrs: string): string =>
  `<ellipse cx="${SX}" cy="${f(SY + (1 - s) * 14)}" rx="${f(RX * s)}" ry="${f(RY * s)}" ${attrs}/>`

/** Claude's own emblem: the coral starburst. */
function star(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const k = i % 2 ? r * 0.38 : r

    return `${f(cx + k * Math.cos(a))} ${f(cy + k * Math.sin(a))}`
  })

  return `<path d="M${pts.join('L')}Z" fill="${CORAL}" fill-opacity=".9"/>`
}

/** The underside of the ship: silhouette, terraces, ribs, rings of lights, the rim's running lights, the port. */
function shipBack(): string {
  const ribs = Array.from({ length: 20 }, (_, k) => {
    const a = (k * Math.PI) / 10 + 0.12
    const p = (s: number) => `${f(SX + RX * s * Math.cos(a))} ${f(SY + (1 - s) * 14 + RY * s * Math.sin(a))}`

    return `M${p(0.33)}L${p(0.97)}`
  }).join('')
  const scales = [0.8, 0.62, 0.45, 0.3]
  const terraces = scales
    .map(s => ring(s, 'fill="none" stroke="#05040a" stroke-opacity=".75" stroke-width="7"') + ring(s - 0.008, 'fill="none" stroke="#3a2f62" stroke-opacity=".55" stroke-width="1.6"'))
    .join('')
  const lights = scales
    .map((s, i) => ring(s - 0.02, `class="ms-rl" style="animation-delay:${f(-0.9 + i * 0.3)}s" pathLength="1000" fill="none" stroke="url(#ms-fade)" stroke-width="${f(5 - i * 0.5)}" stroke-linecap="round" stroke-dasharray="0 14"`))
    .join('')
  const rainbow = TONES.map(
    (tone, i) =>
      `<ellipse class="ms-chase" cx="${SX}" cy="${SY}" rx="${f(RX * 0.975)}" ry="${f(RY * 0.955)}" pathLength="1000" fill="none" stroke="${tone}" ` +
      `stroke-width="7" stroke-linecap="round" stroke-dasharray="0 45" stroke-dashoffset="${-i * 9}"/>`,
  ).join('')

  return (
    // The near lip of the hull, a band of portholes along it, then the underside over it.
    `<ellipse cx="${SX}" cy="${SY + 26}" rx="${RX}" ry="${RY}" fill="#141026" stroke="#463a74" stroke-width="2.5"/>` +
    `<ellipse class="ms-lights" cx="${SX}" cy="${SY + 14}" rx="${RX}" ry="${RY}" pathLength="1000" fill="none" stroke="url(#ms-fade)" stroke-opacity=".5" stroke-width="5" stroke-dasharray="2 6"/>` +
    `<ellipse cx="${SX}" cy="${SY}" rx="${RX}" ry="${RY}" fill="${HULL}" stroke="#4a3c78" stroke-width="3"/>` +
    `<ellipse cx="${SX}" cy="${SY + 8}" rx="${f(RX * 0.94)}" ry="${f(RY * 0.88)}" fill="url(#ms-und)"/>` +
    `<ellipse cx="${SX}" cy="${SY}" rx="${f(RX * 0.975)}" ry="${f(RY * 0.955)}" fill="none" stroke="#1c1733" stroke-width="16"/>` +
    terraces +
    `<path d="${ribs}" stroke="${NIGHT}" stroke-opacity=".7" stroke-width="5"/>` +
    `<g class="ms-lights">${lights}` +
    `<ellipse class="ms-chase ms-wh" cx="${SX}" cy="${SY}" rx="${f(RX * 0.975)}" ry="${f(RY * 0.955)}" pathLength="1000" fill="none" stroke="url(#ms-fade)" ` +
    'stroke-width="6.5" stroke-linecap="round" stroke-dasharray="0 9"/></g>' +
    `<g class="ms-rb">${rainbow}</g>` +
    `<ellipse class="ms-scan" cx="${SX}" cy="${SY}" rx="${f(RX * 0.975)}" ry="${f(RY * 0.955)}" pathLength="1000" fill="none" stroke="url(#ms-fade)" stroke-width="7" stroke-linecap="round" stroke-dasharray="70 180"/>` +
    // The port: a soft halo, the bright core.
    `<g class="ms-port"><ellipse cx="${PX}" cy="${PY}" rx="330" ry="92" fill="url(#ms-halo)"/>` +
    `<ellipse cx="${PX}" cy="${PY}" rx="104" ry="25" fill="url(#ms-core)"/><ellipse cx="${PX}" cy="${PY}" rx="46" ry="10" fill="#fbf8ff" fill-opacity=".85"/></g>` +
    // The greeting: rings of light rolling out across the underside.
    [0, -1.3]
      .map(
        d =>
          `<ellipse class="ms-wave" style="animation-delay:${d}s" cx="${PX}" cy="${PY}" rx="190" ry="40" fill="none" stroke="${LAV}" stroke-width="4" vector-effect="non-scaling-stroke"/>`,
      )
      .join('')
  )
}

/** What hangs nearer than the beam: the five tone panels round the port and the spires under the front rim. */
function shipFront(): string {
  const panels = TONES.map((tone, i) => {
    const a = ((160 - i * 35) * Math.PI) / 180
    const x = PX + 188 * Math.cos(a)
    const y = PY + 56 * Math.sin(a)
    let rot = (Math.atan2(56 * Math.cos(a), -188 * Math.sin(a)) * 180) / Math.PI

    if (rot > 90) rot -= 180
    if (rot < -90) rot += 180

    return (
      `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">` +
      `<ellipse rx="34" ry="12.5" fill="${NIGHT}" stroke="${EDGE}" stroke-width="2"/><ellipse rx="28" ry="9" fill="${tone}" fill-opacity=".2"/>` +
      `<g class="ms-pn" style="--d:${f(toneAt(i))}s;--t:${f(-i * 0.6)}s"><ellipse rx="74" ry="36" fill="url(#ms-t${i})"/>` +
      `<ellipse rx="28" ry="9" fill="${tone}"/><ellipse cx="-6" cy="-3" rx="11" ry="2.6" fill="#fff" fill-opacity=".6"/></g></g>`
    )
  }).join('')
  const spires = [80, 84, 88, 92, 96, 100, 104]
    .map((deg, i) => {
      const a = (deg * Math.PI) / 180
      const x = SX + RX * 0.99 * Math.cos(a)
      const y = SY + 26 + RY * 0.99 * Math.sin(a) - 2
      const len = 22 + ((i * 37) % 5) * 9

      return (
        `<path d="M${f(x - 4)} ${f(y)}L${f(x)} ${f(y + len)}L${f(x + 4)} ${f(y)}Z" fill="${NIGHT}" stroke="${EDGE}" stroke-width="1.4"/>` +
        `<g class="ms-tip" style="animation-delay:${f(-i * 0.45)}s"><circle cx="${f(x)}" cy="${f(y + len)}" r="9" fill="${WARM}" fill-opacity=".18"/>` +
        `<circle cx="${f(x)}" cy="${f(y + len)}" r="2.8" fill="${WARM}"/></g>`
      )
    })
    .join('')

  return `<g class="ms-lights">${spires}</g>${panels}`
}

/** A small saucer in profile: a wide flat lens, a low dome, a row of coloured lights round the rim, a glow under. */
function saucer(): string {
  const lights = [-24, -16, -8, 0, 8, 16, 24].map((x, i) => `<circle cx="${x}" cy="1.5" r="2.3" fill="${i % 2 ? WARM : TONES[(i / 2) % 5]}"/>`).join('')

  return (
    '<path d="M-34 1C-26 -4 -16 -5 -11 -5C-9 -11 -4 -13 0 -13C4 -13 9 -11 11 -5C16 -5 26 -4 34 1C22 7 -22 7 -34 1Z" ' +
    'fill="#1b1730" stroke="#9a88e0" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M-9 -6C-7 -10 -3 -11 0 -11C3 -11 7 -10 9 -6Z" fill="#3a3170"/>' +
    `${lights}<ellipse cy="6.5" rx="12" ry="2.4" fill="${LAV}" fill-opacity=".55"/>`
  )
}

/** A scout craft hovering under its own soft glow. */
function scout(x: number, y: number, n: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="ms-sc ms-s${n}" style="animation-delay:${f(-n * 1.7)}s">` +
    `<ellipse rx="58" ry="24" fill="url(#ms-scg)"/><path d="M-10 7L-26 44H26L10 7Z" fill="${LAV}" fill-opacity=".07"/>${saucer()}</g></g>`
  )
}

/** A searchlight on the ground, its beam swinging up toward the ship. */
function searchlight(x: number, y: number, from: number, to: number, aim: number): string {
  return (
    `<g transform="translate(${x} ${y})"><g class="ms-sl" style="--a0:${from}deg;--a1:${to}deg;--aim:${aim}deg">` +
    '<path class="ms-slb" d="M-5 0L5 0L46 -620L-46 -620Z" fill="url(#ms-slg)"/></g>' +
    `<path d="M-9 6L-13 20M9 6L13 20" stroke="#1d1832" stroke-width="3"/><rect x="-11" y="-6" width="22" height="13" rx="4" fill="#15111f" stroke="${EDGE}"/>` +
    `<circle class="ms-slb" cy="-2" r="4" fill="#f4eeff"/></g>`
  )
}

/** A watcher at the landing ring, a silhouette against the light; the first one waves when it's done. */
function watcher(x: number, y: number, s: number, waves: boolean): string {
  const arm = waves
    ? `<rect class="ms-arm" x="3" y="-30" width="3" height="13" rx="1.5"/>`
    : '<rect x="3.5" y="-16" width="2.6" height="11" rx="1.3"/>'

  return (
    `<g transform="translate(${x} ${y}) scale(${s})" fill="#040308"><circle cy="-21" r="4"/><path d="M-5 -16H5L6 -4H3L2 8H-2L-3 -4H-6Z"/>` +
    `${arm}<rect x="-6" y="-16" width="2.6" height="11" rx="1.3"/></g>`
  )
}

/** The oscilloscope's trace, which shows what the receiver hears. */
function trace(activity: Activity): string {
  if (activity === 'run') {
    return 'M328 278H337V270H346V262H355V254H364V266H372V258H379'
  }

  const next = random(5)
  const amp = activity === 'done' ? 13 : activity === 'thinking' ? 4 : activity === 'idle' ? 6 : 9
  const pts = Array.from({ length: 22 }, (_, i) => {
    const y = activity === 'error' ? 264 + (next() - 0.5) * 30 : 264 + amp * Math.sin(i * (activity === 'done' ? 0.6 : 0.95))

    return `${f(328 + i * 2.4)} ${f(y)}`
  })

  return `M${pts.join('L')}`
}

/** The field receiver with its oscilloscope, a little dish on top, the five tone keys, and a small visitor. */
function device(light: string, activity: Activity): string {
  const keys = TONES.map(
    (tone, i) =>
      `<rect x="${243 + i * 17}" y="313" width="14" height="7" rx="2" fill="${tone}" fill-opacity=".32"/>` +
      `<rect class="ms-kl" style="--k:${f(toneAt(i) - 0.1)}s" x="${243 + i * 17}" y="313" width="14" height="7" rx="2" fill="${tone}" opacity="0"/>`,
  ).join('')
  const vu = [0, 1, 2, 3, 4]
    .map(i => `<rect x="${386 + i * 4.5}" y="292" width="3" height="5" fill="${i > 2 ? '#ff7a9c' : light}" fill-opacity="${activity === 'idle' && i > 1 ? '.2' : '.8'}"/>`)
    .join('')

  return (
    // The headphone cable from the near cup to the jack.
    '<path d="M240 296C250 312 278 318 300 318C310 318 316 322 322 323" fill="none" stroke="#120f20" stroke-width="3"/>' +
    // The receiver.
    `<rect x="318" y="232" width="94" height="98" rx="5" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    `<rect x="324" y="240" width="58" height="48" rx="7" fill="${NIGHT}" stroke="${EDGE}" stroke-width="2"/>` +
    `<rect x="326" y="242" width="54" height="44" rx="6" fill="${light}" fill-opacity=".12"/>` +
    `<path d="M326 264H380M353 242V286M326 253H380M326 275H380M339 242V286M367 242V286" stroke="${light}" stroke-opacity=".16"/>` +
    `<path d="${trace(activity)}" fill="none" stroke="${light}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<g fill="#151126" stroke="#4a3f70" stroke-width="2"><circle cx="397" cy="252" r="7"/><circle cx="397" cy="274" r="5"/></g>` +
    `<path d="M397 252L393 246M397 274L400 270" stroke="${LAV}" stroke-width="1.6"/>` +
    vu +
    '<path d="M328 300H378M328 306H378M328 312H378M328 318H378" stroke="#151126" stroke-width="3"/>' +
    '<circle cx="322" cy="323" r="2.6" fill="#4a3f70"/>' +
    // The little dish on top, tipped toward the sky.
    `<path d="M398 232V214" stroke="${EDGE}" stroke-width="3"/>` +
    `<g transform="translate(395 211) rotate(-35)"><path d="M-16 0Q0 11 16 0Z" fill="#2a2446" stroke="#5a4c8c" stroke-width="1.5"/>` +
    `<path d="M0 5V-11" stroke="#5a4c8c" stroke-width="1.5"/><circle cy="-12" r="2.2" fill="${light}"/></g>` +
    // The tone keys.
    `<path d="M234 330L240 318H330L336 330Z" fill="${METAL}" stroke="${EDGE}" stroke-width="1.5"/>` +
    keys +
    // A scout come down to look at the desk.
    '<g transform="translate(268 176)"><g class="ms-vis">' +
    `<ellipse rx="32" ry="13" fill="${LAV}" fill-opacity=".07"/><ellipse rx="22" ry="8" fill="${LAV}" fill-opacity=".1"/>` +
    `<g transform="scale(.62)">${saucer()}</g></g></g>`
  )
}

/** Keyframes for a loop around a circle, for the dancing scouts. */
function loopKeys(name: string, r: number): string {
  const frames = Array.from({ length: 13 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2

    return `${f((k / 12) * 100)}%{transform:translate(${f(r * Math.sin(a))}px,${f(r * 0.45 * (1 - Math.cos(a)) * -1)}px)}`
  }).join('')

  return `@keyframes ${name}{${frames}}`
}

export function mothershipWorld(): World {
  const next = random(23)
  const starsA: string[] = []
  const starsB: string[] = []

  for (let i = 0; i < 110; i += 1) {
    const x = next() * 1600
    const y = next() * 620
    const s = 1.6 + next() * 1.8
    const under = ((x - SX) / (RX + 20)) ** 2 + ((y - SY) / (RY + 20)) ** 2 < 1

    if (!under) {
      ;(i % 2 ? starsB : starsA).push(`M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${f(-s)}z`)
    }
  }

  // The far town on the right: low houses, a water tower, lit windows that go out in a brownout.
  let houses = ''
  const windows = ['', '', '']

  for (let i = 0; i < 9; i += 1) {
    const x = 1196 + i * 22 + next() * 6
    const w = 14 + next() * 8
    const h = 7 + next() * 9

    houses += `M${f(x)} 653V${f(653 - h)}L${f(x + w / 2)} ${f(649 - h - 4)}L${f(x + w)} ${f(653 - h)}V653Z`
    windows[i % 3] += `M${f(x + 3 + next() * (w - 7))} ${f(649 - h * 0.5)}h3v3h-3z`
  }

  const clouds = Array.from({ length: 7 }, (_, i) => {
    const x = 900 + i * 80 + next() * 40
    const y = 120 + next() * 160

    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(90 + next() * 70)}" ry="${f(16 + next() * 14)}" fill="${i % 2 ? '#0e0b1b' : '#120e22'}" fill-opacity=".92"/>`
  }).join('')
  const motes = Array.from({ length: 9 }, (_, i) => {
    const x = 210 + next() * 140
    const y = 520 + next() * 200

    return `<circle class="ms-mote" style="animation-delay:${f(2.2 + i * 0.37)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.6 + next() * 1.8)}" fill="${LAV}"/>`
  }).join('')
  const toneDefs = TONES.map(
    (tone, i) =>
      `<radialGradient id="ms-t${i}"><stop offset="0" stop-color="${tone}" stop-opacity=".75"/><stop offset=".45" stop-color="${tone}" stop-opacity=".22"/>` +
      `<stop offset="1" stop-color="${tone}" stop-opacity="0"/></radialGradient>`,
  ).join('')
  const tilt = (inner: string) => `<g class="ms-shipst"><g class="ms-ship"><g transform="rotate(-3 ${SX} ${SY})">${inner}</g></g></g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'orbs',
      ink: '#05040a',
      furniture: '#1d1832',
      metal: METAL,
      paper: '#ddd6f0',
      light: { idle: '#7a5fc0', work: VIOLET, bright: LAV },
      headTop: 228,
      glowAt: [353, 264],
      device,
      wear: {
        // Big over-ear headphones: the band rests on the head, the cups sit at its sides, clear of the eyes.
        front:
          `<path d="M61 254V240Q61 230 72 230H228Q239 230 239 240V252" fill="none" stroke="#2a2440" stroke-width="8"/>` +
          '<path d="M72 228H228" stroke="#4a3f70" stroke-width="2"/>' +
          `<rect x="48" y="250" width="26" height="44" rx="10" fill="#1d1830" stroke="${EDGE}" stroke-width="2"/>` +
          `<rect x="224" y="248" width="30" height="48" rx="11" fill="#241e3a" stroke="#4a3f70" stroke-width="2"/>` +
          `<rect class="ms-led" x="232" y="260" width="14" height="24" rx="6" fill="none" stroke="${VIOLET}" stroke-width="2.5"/>` +
          `<circle cx="239" cy="272" r="2.4" fill="${LAV}"/>`,
      },
      seatArt:
        // A folding camp chair: the canvas sling and its crossed legs.
        `<g stroke="${EDGE}" stroke-width="5" stroke-linecap="round"><path d="M114 362L188 452M188 362L114 452M104 452H124M178 452H198"/></g>` +
        `<path d="M104 348H200L196 364H108Z" fill="#2b2446" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M107 356H197" stroke="${VIOLET}" stroke-opacity=".45" stroke-width="2"/>`,
      tableArt:
        // A folding field table, and the road case the kit came in, with Claude's starburst on it.
        `<rect x="166" y="329" width="304" height="9" rx="2" fill="#1d1832" stroke="#30284c" stroke-width="1.5"/>` +
        '<rect x="172" y="338" width="292" height="5" fill="#141024"/>' +
        '<path d="M184 343L196 456M452 343L440 456" stroke="#2a2342" stroke-width="7"/><path d="M190 404H446" stroke="#1a1530" stroke-width="4"/>' +
        `<rect x="268" y="382" width="156" height="74" rx="4" fill="#151122" stroke="#2e2748" stroke-width="2"/><path d="M268 402H424" stroke="#2e2748" stroke-width="2"/>` +
        `<g fill="${EDGE}"><rect x="268" y="382" width="11" height="11"/><rect x="413" y="382" width="11" height="11"/><rect x="268" y="445" width="11" height="11"/>` +
        '<rect x="413" y="445" width="11" height="11"/><rect x="306" y="397" width="10" height="9" rx="1"/><rect x="376" y="397" width="10" height="9" rx="1"/></g>' +
        '<rect x="326" y="375" width="40" height="6" rx="3" fill="#2e2748"/>' +
        star(346, 430, 12),
    },
    style:
      loopKeys('ms-loop', 46) +
      loopKeys('ms-vloop', 12) +
      // The ship: a slow hover; it lowers for a command and pulls away on an error.
      '.ms-ship{animation:ms-bob 9s ease-in-out infinite alternate}@keyframes ms-bob{from{transform:translateY(-6px)}to{transform:translateY(6px)}}' +
      '.st-run .ms-shipst{animation:ms-lower 3s ease-in-out both}@keyframes ms-lower{to{transform:translateY(18px)}}' +
      '.st-error .ms-shipst{animation:ms-rise 2.4s ease-out both}@keyframes ms-rise{to{transform:translateY(-30px)}}' +
      // The rim's running lights, the rings of lights and their ripple.
      '.ms-chase{animation:ms-chase 40s linear infinite}@keyframes ms-chase{to{stroke-dashoffset:-1000}}' +
      '.st-responding .ms-chase{animation-duration:14s}.st-tool .ms-chase,.st-run .ms-chase,.st-done .ms-chase{animation-duration:7s}.st-thinking .ms-chase{animation-duration:70s}' +
      '.ms-rl{opacity:.55}.st-thinking .ms-rl{animation:ms-rip 2.4s ease-in-out infinite}@keyframes ms-rip{0%,100%{opacity:.08}35%{opacity:1}}' +
      '.ms-scan{opacity:0}.st-tool .ms-scan{opacity:1;animation:ms-chase 1.8s linear infinite}.st-tool .ms-port{animation-duration:1.2s}' +
      '.st-error .ms-lights{animation:ms-dim 1.8s ease-in both}@keyframes ms-dim{to{opacity:.12}}' +
      '.st-sleeping .ms-lights{opacity:.5}' +
      '.ms-rb{opacity:0}.st-done .ms-rb{animation:ms-on .8s ease-out .3s both}.st-done .ms-wh{animation:ms-off .8s ease-out .3s both}' +
      '.ultra .ms-rb{opacity:.7}' +
      '@keyframes ms-on{from{opacity:0}to{opacity:1}}@keyframes ms-off{to{opacity:0}}' +
      '.ms-tip{animation:ms-tw 2.2s ease-in-out infinite alternate}' +
      // The port.
      '.ms-port{animation:ms-glow 5s ease-in-out infinite alternate}@keyframes ms-glow{from{opacity:.55}to{opacity:.8}}' +
      '.st-run .ms-port{animation:ms-flare 1.4s ease-out 1.2s both}@keyframes ms-flare{from{opacity:.7}to{opacity:1}}' +
      '.st-error .ms-port{animation:ms-dim 1.6s ease-in both}.st-done .ms-port{animation:ms-flare .4s ease-out both}' +
      // The five tones: one by one on a run (each panel once, a third of a second apart), all together when done.
      '.ms-pn{opacity:0}' +
      '.st-run .ms-pn{animation:ms-on .3s ease-out var(--d) both,ms-hum 2.4s ease-in-out calc(var(--d) + 2.2s) infinite alternate}' +
      '@keyframes ms-hum{from{opacity:1}to{opacity:.6}}' +
      '.st-done .ms-pn{animation:ms-on .7s ease-out .2s both}' +
      '.st-thinking .ms-pn{animation:ms-soft 3s ease-in-out var(--t) infinite}@keyframes ms-soft{0%,100%{opacity:0}50%{opacity:.4}}' +
      '.ultra .ms-pn{opacity:.7}' +
      // The beam: it comes down after the fifth tone, sputters out on an error, stays soft when done.
      '.ms-beam{opacity:0;transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-run .ms-beam{animation:ms-beam 1.2s cubic-bezier(.3,.6,.4,1) 1.45s both}' +
      '@keyframes ms-beam{from{opacity:.25;transform:scaleY(0)}to{opacity:1;transform:scaleY(1)}}' +
      '.st-done .ms-beam{transform:scaleY(1);animation:ms-soft-in .35s ease-out both}@keyframes ms-soft-in{from{opacity:0}to{opacity:.55}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the beam dips under two flickers a second, each ramped over .25 s+.
      '.st-error .ms-beam{transform:scaleY(1);animation:ms-flick 2s ease-in-out both}' +
      '@keyframes ms-flick{0%{opacity:0}8%{opacity:.75}18%{opacity:.25}30%{opacity:.6}46%{opacity:.12}60%{opacity:.35}80%,100%{opacity:0}}' +
      '.ms-mote{opacity:0}.st-run .ms-mote,.st-done .ms-mote{animation:ms-mote 3.3s linear infinite}' +
      '@keyframes ms-mote{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(-280px)}}' +
      '.st-done .ms-mote{animation-delay:-1s}' +
      // The landing ring and the light on the ground.
      '.ms-gl{opacity:.35}.st-run .ms-gl{animation:ms-up 1s ease-out 2s both}@keyframes ms-up{to{opacity:1}}' +
      '.st-done .ms-gl{animation:ms-gl-in .35s ease-out both}@keyframes ms-gl-in{from{opacity:.35}to{opacity:.85}}.st-error .ms-gl{animation:ms-dim 1.4s ease-in both}' +
      '.ms-pad{opacity:.45;animation:ms-chase 30s linear infinite}.st-run .ms-pad{animation-duration:6s;opacity:1}.st-done .ms-pad{animation-duration:9s;opacity:1}' +
      '.st-error .ms-pad{opacity:.12}' +
      // The searchlights sweep; they lock on while reading and cut out on an error.
      '.ms-sl{animation:ms-sweep 9s ease-in-out infinite alternate}' +
      '@keyframes ms-sweep{from{transform:rotate(var(--a0))}to{transform:rotate(var(--a1))}}' +
      '.st-tool .ms-sl{animation-duration:2.2s}.st-read .ms-sl{animation:none;transform:rotate(var(--aim))}' +
      '.st-error .ms-slb{animation:ms-off .5s ease-in .35s both}' +
      // The scouts hover, zip about on the web, flee on an error, dance when done.
      '.ms-sc{animation:ms-hov 5s ease-in-out infinite alternate}@keyframes ms-hov{from{transform:translate(0,-6px)}to{transform:translate(9px,7px)}}' +
      '.st-web .ms-sc{animation:ms-zip 1.4s ease-in-out infinite alternate}@keyframes ms-zip{from{transform:translate(-70px,12px)}to{transform:translate(70px,-12px)}}' +
      '.st-error .ms-sc{animation:ms-flee 2s ease-in both}@keyframes ms-flee{to{transform:translate(70px,-100px) scale(.5);opacity:.15}}' +
      '.st-done .ms-sc{animation:ms-loop 2.2s linear infinite}' +
      // The stars, the clouds, the town.
      '.ms-tw1{animation:ms-tw 3.6s ease-in-out infinite alternate}.ms-tw2{animation:ms-tw 2.8s ease-in-out -1.4s infinite alternate}' +
      '@keyframes ms-tw{from{opacity:.35}to{opacity:1}}' +
      '.ms-cl{animation:ms-drift 34s ease-in-out infinite alternate}@keyframes ms-drift{to{transform:translateX(-46px)}}' +
      '.st-error .ms-w0{animation:ms-off .3s ease-in .3s both}.st-error .ms-w1{animation:ms-off .3s ease-in .65s both}.st-error .ms-w2{animation:ms-off .3s ease-in 1s both}' +
      '.st-error .ms-lamp{animation:ms-off .3s ease-in .5s both}' +
      // The dish tracks; signals come in while reading and go out on the web.
      '.ms-dish{animation:ms-track 14s ease-in-out infinite alternate}@keyframes ms-track{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}' +
      '.st-tool .ms-dish{animation-duration:2.4s}' +
      '.ms-in,.ms-out{opacity:0}' +
      '.st-read .ms-in{animation:ms-in 1.5s linear infinite}@keyframes ms-in{0%{opacity:0;transform:translateY(-150px)}25%{opacity:.85}100%{opacity:0;transform:translateY(-10px)}}' +
      '.st-web .ms-out{animation:ms-out 1.5s linear infinite}@keyframes ms-out{0%{opacity:0;transform:translateY(-10px)}20%{opacity:.85}100%{opacity:0;transform:translateY(-170px)}}' +
      '.ms-df{opacity:.5}.st-run .ms-df,.st-done .ms-df{animation:ms-up 1.2s ease-out 1.6s both}.st-error .ms-df{opacity:.2}' +
      // The greeting rings.
      '.ms-wave{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-done .ms-wave{animation:ms-wave 2.6s ease-out infinite}@keyframes ms-wave{0%{opacity:0;transform:scale(.3)}10%{opacity:.8}100%{opacity:0;transform:scale(3.8)}}' +
      // A watcher waves.
      '.ms-arm{transform-box:fill-box;transform-origin:50% 100%;transform:rotate(-20deg)}.st-done .ms-arm{animation:ms-wv .5s ease-in-out infinite alternate}' +
      '@keyframes ms-wv{from{transform:rotate(-30deg)}to{transform:rotate(30deg)}}' +
      // The desk: the tone keys, the headphone light, the visitor.
      '.ms-kl{opacity:0}.st-run .ms-kl{animation:ms-key .6s ease-out var(--k) both}@keyframes ms-key{0%{opacity:0}30%{opacity:1}100%{opacity:.6}}' +
      '.st-done .ms-kl{animation:ms-on .7s ease-out .2s both}' +
      '.ms-led{animation:ms-led 2.4s ease-in-out infinite alternate}@keyframes ms-led{from{opacity:.35}to{opacity:1}}' +
      '.st-listening .ms-led,.st-read .ms-led{animation-duration:.8s}' +
      '.ms-vis{animation:ms-vis 3.4s ease-in-out infinite alternate}@keyframes ms-vis{from{transform:translateY(-4px)}to{transform:translateY(5px)}}' +
      '.st-done .ms-vis{animation:ms-vloop 1.6s linear infinite}' +
      '.st-error .ms-vis{animation:ms-vdrop 1.2s ease-in both}@keyframes ms-vdrop{to{transform:translate(4px,12px) rotate(16deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050409"/><stop offset=".45" stop-color="#0a0816"/><stop offset=".85" stop-color="#160f2b"/><stop offset="1" stop-color="#21173d"/></linearGradient>' +
      '<linearGradient id="ms-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#160f26"/><stop offset=".22" stop-color="#0d0a17"/><stop offset="1" stop-color="#060509"/></linearGradient>' +
      '<radialGradient id="ms-haze"><stop offset="0" stop-color="#7a5ec8" stop-opacity=".3"/><stop offset=".55" stop-color="#5a3fa0" stop-opacity=".1"/><stop offset="1" stop-color="#5a3fa0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ms-und"><stop offset="0" stop-color="#2e2354"/><stop offset=".25" stop-color="#1c1636"/><stop offset=".6" stop-color="#120e24"/><stop offset="1" stop-color="#0d0a1a"/></radialGradient>' +
      '<radialGradient id="ms-halo"><stop offset="0" stop-color="#efe6ff" stop-opacity=".6"/><stop offset=".35" stop-color="#b48cff" stop-opacity=".22"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ms-core"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e2d4ff" stop-opacity=".85"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="ms-fade" gradientUnits="userSpaceOnUse" x1="-400" y1="0" x2="1300" y2="0"><stop offset="0" stop-color="${WARM}"/><stop offset=".46" stop-color="${WARM}"/>` +
      `<stop offset=".55" stop-color="${WARM}" stop-opacity=".38"/><stop offset=".72" stop-color="${WARM}" stop-opacity=".22"/><stop offset="1" stop-color="${WARM}" stop-opacity=".2"/></linearGradient>` +
      toneDefs +
      '<linearGradient id="ms-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe6ff" stop-opacity=".42"/><stop offset=".7" stop-color="#c8b0ff" stop-opacity=".16"/><stop offset="1" stop-color="#b48cff" stop-opacity=".08"/></linearGradient>' +
      '<linearGradient id="ms-bc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#e2d4ff" stop-opacity=".12"/></linearGradient>' +
      '<radialGradient id="ms-gl"><stop offset="0" stop-color="#e2d4ff" stop-opacity=".5"/><stop offset=".45" stop-color="#b48cff" stop-opacity=".18"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ms-slg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e2d4ff" stop-opacity=".3"/><stop offset=".7" stop-color="#e2d4ff" stop-opacity=".07"/><stop offset="1" stop-color="#e2d4ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ms-scg"><stop offset="0" stop-color="#e2d4ff" stop-opacity=".45"/><stop offset=".4" stop-color="#b48cff" stop-opacity=".14"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ms-back"><stop offset="0" stop-color="#6a50b8" stop-opacity=".22"/><stop offset=".6" stop-color="#4a3590" stop-opacity=".1"/><stop offset="1" stop-color="#4a3590" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ms-lampg"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".4"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The night sky and its stars.
      '<rect width="1600" height="660" fill="url(#ms-sky)"/>' +
      `<path class="ms-tw1" d="${starsA.join('')}" fill="#e6dcff" fill-opacity=".8"/><path class="ms-tw2" d="${starsB.join('')}" fill="#cfc2f0" fill-opacity=".7"/>` +
      '<ellipse cx="270" cy="470" rx="640" ry="330" fill="url(#ms-haze)"/><ellipse cx="560" cy="140" rx="880" ry="330" fill="url(#ms-back)"/>' +
      // The land: far ranges, a mesa under the ship, a butte behind the town, the plain.
      '<path d="M-20 654L60 640L140 644L260 632L420 640L560 630L700 642L860 634L1000 640L1140 628L1300 638L1460 630L1620 640V660H-20Z" fill="#110d1f"/>' +
      '<path d="M520 656Q620 630 720 641Q820 650 900 637Q980 627 1080 652Z" fill="#0d0a18"/>' +
      '<path d="M-40 656V566L18 560L30 548H318L336 560L352 556L404 612L452 656Z" fill="#100c1d"/>' +
      '<path d="M-40 566L18 560L30 548H318L336 560L352 556" fill="none" stroke="#9a80e8" stroke-opacity=".35" stroke-width="2"/>' +
      '<rect y="652" width="1600" height="420" fill="url(#ms-gnd)"/>' +
      '<ellipse cx="300" cy="652" rx="560" ry="46" fill="url(#ms-haze)"/>' +
      // The track out to the landing ring.
      '<path d="M300 760H340L600 1010H400Z" fill="#100c1b"/><path d="M320 764L500 1010" stroke="#251f3a" stroke-width="3" stroke-dasharray="14 18"/>' +
      // The landing ring and the light on the ground.
      '<ellipse class="ms-gl" cx="270" cy="752" rx="330" ry="70" fill="url(#ms-gl)"/>' +
      '<ellipse cx="270" cy="752" rx="200" ry="28" fill="#0f0b1b" fill-opacity=".8" stroke="#2a2346" stroke-width="2"/>' +
      `<ellipse class="ms-pad" cx="270" cy="752" rx="200" ry="28" pathLength="1000" fill="none" stroke="url(#ms-fade)" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 25"/>` +
      // The searchlights.
      searchlight(78, 730, -16, 2, -8) +
      // The far town, at the right, and its butte.
      '<g class="mv-r"><path d="M1130 656L1180 618L1196 612H1420L1436 604H1560L1580 612L1640 640V656Z" fill="#0f0b1c"/>' +
      '<path d="M1180 618L1196 612H1420L1436 604H1560L1580 612" fill="none" stroke="#6a54b0" stroke-opacity=".25" stroke-width="2"/>' +
      `<path d="${houses}" fill="#07060d"/>` +
      '<path d="M1356 653L1360 628M1376 653L1372 628M1358 640H1374" stroke="#07060d" stroke-width="2.4"/><rect x="1352" y="614" width="28" height="15" rx="5" fill="#07060d"/>' +
      windows.map((d, i) => `<path class="ms-w${i}" d="${d}" fill="#ffcf7a" fill-opacity=".85"/>`).join('') +
      '<g class="ms-lamp"><circle cx="1260" cy="640" r="16" fill="url(#ms-lampg)"/><circle cx="1330" cy="642" r="14" fill="url(#ms-lampg)"/></g>' +
      '</g>' +
      // The mothership: the underside, the beam, then what hangs nearer than the beam.
      tilt(shipBack()) +
      '<g class="ms-beam"><path d="M176 174H264L430 752H110Z" fill="url(#ms-bm)"/><path d="M208 174H232L300 752H240Z" fill="url(#ms-bc)"/></g>' +
      motes +
      tilt(shipFront()) +
      // The watchers at the ring.
      watcher(196, 772, 1, true) +
      watcher(218, 774, 0.92, false) +
      watcher(330, 768, 0.85, false) +
      // Clouds trailing off the ship's far rim.
      `<g class="ms-cl">${clouds}</g>` +
      // The scouts.
      scout(110, 440, 2, 1.1) +
      `<g class="mv-r">${scout(1300, 120, 0, 1.3)}${scout(1490, 260, 1, 1)}</g>`,
    nook:
      '<defs><linearGradient id="ms-dface" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a3c7c"/><stop offset="1" stop-color="#120e22"/></linearGradient></defs>' +
      // The radio dish behind the outpost, tipped up toward the ship.
      '<ellipse cx="300" cy="456" rx="230" ry="12" fill="#000" fill-opacity=".45"/>' +
      `<path d="M300 124L314 30H346L360 124Z" fill="#0f0c1b" stroke="#2e2748" stroke-width="2"/>` +
      '<path d="M312 34L300 -40M348 34L360 -40" stroke="#1a1530" stroke-width="9"/>' +
      '<g transform="translate(330 -50)"><g class="ms-dish"><g transform="rotate(-32)">' +
      '<path d="M-132 0Q0 84 132 0Z" fill="#0d0a18" stroke="#2e2748" stroke-width="2"/>' +
      '<ellipse rx="132" ry="30" fill="url(#ms-dface)" stroke="#5a4c8c" stroke-width="2.5"/>' +
      `<ellipse class="ms-df" rx="100" ry="20" fill="${VIOLET}" fill-opacity=".14"/>` +
      '<path d="M-60 -24L60 24M-60 24L60 -24M0 -30V30" stroke="#2e2748" stroke-opacity=".7" stroke-width="1.5"/>' +
      '<path d="M-118 6L0 -96M118 6L0 -96M0 22L0 -96" stroke="#3a3258" stroke-width="3"/>' +
      `<rect x="-7" y="-108" width="14" height="16" rx="3" fill="${METAL}" stroke="#5a4c8c"/><circle cy="-110" r="2.5" fill="${LAV}"/>` +
      // Signals arriving (read) and leaving (web) along its axis.
      [0, -0.5, -1]
        .map(
          d =>
            `<path class="ms-in" style="animation-delay:${d}s" d="M-44 -96Q0 -118 44 -96" fill="none" stroke="${LAV}" stroke-width="3" stroke-linecap="round"/>` +
            `<path class="ms-out" style="animation-delay:${d}s" d="M-40 -110Q0 -130 40 -110" fill="none" stroke="${VIOLET}" stroke-width="3" stroke-linecap="round"/>`,
        )
        .join('') +
      '</g></g></g>',
  }
}
