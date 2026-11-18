import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Armored Genius: a cliffside workshop at night, a tall window onto a dark sea. An original powered suit, gunmetal
// and teal plates with Claude's coral starburst for its chest core, hangs in a gantry while robot arms hold its last
// plates. Claude works at a holographic bench under a turning wireframe of the suit. A command snaps the plates on,
// the boot and palm thrusters light and the suit lifts off the gantry; an error drops a plate in a spray of sparks;
// done lights the eye slits and the suit gives a thumbs-up.

type P = readonly [number, number]

const TEAL = '#2ee6d6'
const TEAL_HI = '#b8fff7'
const CORAL = '#d97757'
const STEEL = '#10171c'
const STEEL_HI = '#25323b'
const ARM = '#161e24'
const ARM_HI = '#2c3942'
const SPARK = '#ffe2a6'

// The suit's own coordinates have the chest at the origin; it stands in the picture here, at this size.
const SX = 270
const SY = 420
const SS = 0.9
const pic = (x: number, y: number): P => [SX + SS * x, SY + SS * y]

// The plates the arms bring last, each around its own center: the right pauldron, the left forearm guard, the left
// shin guard.
const PAULDRON = 'M-34 -30L2 -34L26 -16L34 14L24 38L4 30L-6 2L-28 -10Z'
const GUARD = 'M-17 -30L11 -32L17 18L5 34L-13 30Z'
const SHIN = 'M-15 -30L15 -30L13 28L1 40L-11 30Z'
// The helm's single V visor band, under a brow that dips to the crest.
const VISOR = 'M-29 -138L0 -125L29 -138V-131L0 -117L-29 -131Z'

const plate = (d: string, kind: 'g' | 't' | 'd'): string => `<path class="ag-q" d="${d}" fill="url(#ag-p${kind})"/>`
const mirror = (inner: string): string => `<g transform="scale(-1 1)">${inner}</g>`
const flame = (x: number, y: number, w: number, h: number, glow: number): string =>
  `<g class="ag-thr"><ellipse cx="${x}" cy="${y + 4}" rx="${glow}" ry="${f(glow * 0.8)}" fill="url(#ag-tg)"/>` +
  `<path class="ag-fl" d="M${x - w / 2} ${y}Q${f(x - w * 0.3)} ${f(y + h * 0.45)} ${x} ${y + h}Q${f(x + w * 0.3)} ${f(y + h * 0.45)} ${x + w / 2} ${y}Z" fill="url(#ag-fl)"/></g>`

/** One of the suit's arms, drawn as its right; the left is the same mirrored, with the guard an arm brings and a fist. */
function suitArm(left: boolean): string {
  const k = left ? 'l' : 'r'
  const guard = `<g transform="translate(3 42)">${plate(GUARD, 't')}</g>`

  return (
    `<g transform="translate(102 -44)"><g class="ag-u ag-u${k}">` +
    plate('M-14 4L16 2L20 92L-4 96Z', 'g') +
    '<path d="M9 12L16 11L18 78L12 80Z" fill="url(#ag-pt)"/>' +
    '<circle r="17" fill="#0d1317" stroke="#2a363f" stroke-width="2"/>' +
    `<g transform="translate(8 98)"><g class="ag-fa${k}">` +
    `<circle r="12" fill="#0d1317" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2"/>` +
    plate('M-12 6L14 6L18 82L-8 84Z', 'g') +
    (left ? `<g class="ag-seat" style="--sw:.6s">${guard}</g>` : guard) +
    `<g class="ag-hand${left ? ' ag-hl' : ''}">` +
    plate('M-10 84L18 84L22 110L14 128L-4 128L-12 110Z', 'd') +
    '<path d="M-6 112L-2 126M3 113L4 127M10 112L9 126" stroke="#070b0e" stroke-width="1.5"/>' +
    `<ellipse class="ag-noz" cx="5" cy="129" rx="9" ry="3.5" fill="${TEAL}"/>` +
    flame(5, 131, 20, 76, 26) +
    '</g>' +
    (left
      ? `<g class="ag-fist"><circle class="ag-pop" cx="4" cy="112" r="40" fill="url(#ag-eg)"/>${plate('M-17 78L23 78L26 112L-15 115Z', 'g')}` +
        `<path d="M-13 90H22M-13 101H24" stroke="#0a0f13" stroke-width="1.6"/>${plate('M4 106L20 106L21 146Q12 154 5 146Z', 't')}</g>`
      : '') +
    '</g></g></g></g>'
  )
}

function leg(left: boolean): string {
  const shin = `<g transform="translate(37 306)">${plate(SHIN, 't')}</g>`

  return (
    plate('M10 148L50 140L58 208L52 250L20 252L12 204Z', 'g') +
    '<path d="M34 154L52 150L56 204L44 212Z" fill="url(#ag-pt)"/>' +
    plate('M18 272L54 272L58 340L50 356L24 356L18 340Z', 'g') +
    (left ? `<g class="ag-seat" style="--sw:.8s">${shin}</g>` : shin) +
    plate('M16 246L54 246L58 268L38 282L16 268Z', 't') +
    plate('M16 352L58 352L66 372L66 386L12 386L12 372Z', 'd') +
    `<path d="M22 366H58" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2"/>` +
    `<ellipse class="ag-noz" cx="39" cy="388" rx="18" ry="4" fill="${TEAL}"/>` +
    flame(39, 390, 30, 124, 42)
  )
}

/** The suit: angular gunmetal plates, teal accents, the coral starburst core, a crested helm with one V visor. */
function suit(): string {
  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = ((k * 30 + 15) * Math.PI) / 180
    const r = k % 2 === 1 ? 13 : 17

    return `M${f(5 * Math.cos(a))} ${f(-28 + 5 * Math.sin(a))}L${f(r * Math.cos(a))} ${f(-28 + r * Math.sin(a))}`
  }).join('')
  const under = plate('M84 -26L118 -12L120 8L98 6Z', 'g')

  return (
    suitArm(false) +
    mirror(suitArm(true)) +
    leg(false) +
    mirror(leg(true)) +
    // Belt, abdomen, flanks.
    plate('M-52 106L52 106L56 126L22 150L-22 150L-56 126Z', 'g') +
    `<path d="M-51 112H51L52 118H-52Z" fill="${TEAL}" fill-opacity=".5"/>` +
    plate('M-12 120L12 120L7 146L-7 146Z', 'd') +
    plate('M-26 48L26 48L30 66L-30 66Z', 'd') +
    plate('M-29 70L29 70L30 88L-30 88Z', 'd') +
    plate('M-29 92L29 92L27 110L-27 110Z', 'd') +
    plate('M58 32L32 50L32 106L50 100Z', 'g') +
    mirror(plate('M58 32L32 50L32 106L50 100Z', 'g')) +
    // The chest and its two teal shields.
    plate('M-60 -80L-20 -86L20 -86L60 -80L84 -52L80 -4L60 28L24 46L-24 46L-60 28L-80 -4L-84 -52Z', 'g') +
    plate('M14 -76L56 -72L72 -48L64 -20L30 -12L16 -30Z', 't') +
    mirror(plate('M14 -76L56 -72L72 -48L64 -20L30 -12L16 -30Z', 't')) +
    `<path d="M-30 30L0 40L30 30" fill="none" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2"/>` +
    // The core: Claude's starburst in a hex bezel.
    `<circle class="ag-core" cx="0" cy="-28" r="64" fill="url(#ag-cg)"/>` +
    `<path d="M0 -52L21 -40V-16L0 -4L-21 -16V-40Z" fill="#0a0f13" stroke="${TEAL}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="${rays}" stroke="${CORAL}" stroke-width="4.2" stroke-linecap="round"/><circle cx="0" cy="-28" r="4.5" fill="#ffd9c8"/>` +
    '<circle class="ag-wave" cx="0" cy="-28" r="30" fill="none" stroke="#ff9a76" stroke-width="3"/>' +
    // Shoulders: the left pauldron on, the right one bare until its arm brings it.
    under +
    mirror(under) +
    mirror(plate('M58 -80L94 -84L118 -66L126 -36L116 -12L96 -20L86 -48L64 -60Z', 't')) +
    '<circle cx="100" cy="-46" r="16" fill="#0d1317" stroke="#2a363f" stroke-width="2"/>' +
    `<g class="ag-seat" style="--sw:.4s"><g transform="translate(92 -50)">${plate(PAULDRON, 't')}</g></g>` +
    // The helm.
    plate('M-15 -92H15V-80H-15Z', 'd') +
    plate('M0 -174L20 -170L33 -156L37 -132L35 -112L27 -96L12 -88L-12 -88L-27 -96L-35 -112L-37 -132L-33 -156L-20 -170Z', 'g') +
    plate('M-31 -146L0 -132L31 -146L32 -118L22 -100L8 -93L-8 -93L-22 -100L-32 -118Z', 'g') +
    plate('M0 -177L7 -170L5 -142L0 -132L-5 -142L-7 -170Z', 't') +
    plate('M-35 -124L-46 -134L-41 -106Z', 't') +
    plate('M35 -124L46 -134L41 -106Z', 't') +
    `<path d="${VISOR}" fill="#050a0d"/>` +
    '<path d="M-4 -110V-100M4 -110V-100M-12 -108V-102M12 -108V-102" stroke="#060a0d" stroke-width="2"/>' +
    `<g class="ag-eyes"><ellipse cx="0" cy="-127" rx="46" ry="28" fill="url(#ag-eg)"/><path d="${VISOR}" fill="#e6fffc"/></g>`
  )
}

type ArmSpec = { id: string; base: P; l1: number; l2: number; elbow: number; held: P; seat: P; away: P; miss?: P; plate: string; flip: boolean; sw: number }

/** The two joint angles, in degrees, that put a two-link arm's tip on a point. */
function ik(a: ArmSpec, at: P): [number, number] {
  const dx = at[0] - a.base[0]
  const dy = at[1] - a.base[1]
  const d = Math.min(Math.hypot(dx, dy), a.l1 + a.l2 - 1)
  const c = Math.max(-1, Math.min(1, (d * d - a.l1 * a.l1 - a.l2 * a.l2) / (2 * a.l1 * a.l2)))
  const a2 = a.elbow * Math.acos(c)
  const a1 = Math.atan2(dy, dx) - Math.atan2(a.l2 * Math.sin(a2), a.l1 + a.l2 * Math.cos(a2))

  return [(a1 * 180) / Math.PI, (a2 * 180) / Math.PI]
}

const ARMS: readonly ArmSpec[] = [
  { id: 'A', base: [424, 160], l1: 130, l2: 120, elbow: 1, held: [398, 330], seat: pic(92, -50), away: [452, 252], plate: PAULDRON, flip: false, sw: 0.4 },
  { id: 'C', base: [102, 404], l1: 78, l2: 74, elbow: -1, held: [134, 536], seat: pic(-113, 96), away: [72, 542], miss: [150, 524], plate: GUARD, flip: true, sw: 0.6 },
  { id: 'B', base: [52, 772], l1: 150, l2: 125, elbow: 1, held: [178, 690], seat: pic(-37, 306), away: [92, 640], plate: SHIN, flip: true, sw: 0.8 },
]

/** A welding robot arm holding its plate; the CSS that moves it in each state. */
function robotArm(a: ArmSpec): { markup: string; css: string } {
  const [h1, h2] = ik(a, a.held)
  const [s1, s2] = ik(a, a.seat)
  const [r1, r2] = ik(a, a.away)
  const rot = -(s1 + s2)
  const L = a.l2
  const deg = (v: number) => `transform:rotate(${f(v)}deg)`
  // A command: hold, reach the seat by `sw`, let go, fold away.
  const T = 3
  const at = (t: number) => f((Math.max(0, t) / T) * 100)
  const run = (h: number, s: number, r: number) =>
    `0%,${at(a.sw - 0.36)}%{${deg(h)}}${at(a.sw)}%,${at(a.sw + 0.18)}%{${deg(s)}}${at(a.sw + 0.85)}%,100%{${deg(r)}}`
  let css =
    `.ag-${a.id}1{${deg(h1)};animation:ag-${a.id}w1 3.2s ease-in-out infinite alternate}@keyframes ag-${a.id}w1{to{${deg(h1 + 1.4)}}}` +
    `.ag-${a.id}2{${deg(h2)};animation:ag-${a.id}w2 3.2s ease-in-out infinite alternate}@keyframes ag-${a.id}w2{to{${deg(h2 - 2.2)}}}` +
    `.st-tool .ag-${a.id}1,.st-tool .ag-${a.id}2{animation-duration:.7s}` +
    `.st-run .ag-${a.id}1{animation:ag-${a.id}r1 ${T}s ease-in-out both}@keyframes ag-${a.id}r1{${run(h1, s1, r1)}}` +
    `.st-run .ag-${a.id}2{animation:ag-${a.id}r2 ${T}s ease-in-out both}@keyframes ag-${a.id}r2{${run(h2, s2, r2)}}` +
    `.st-done .ag-${a.id}1{animation:none;${deg(r1)}}.st-done .ag-${a.id}2{animation:none;${deg(r2)}}`
  let drop = ''

  if (a.miss !== undefined) {
    // The error: it reaches, misses, jerks and lets the plate fall.
    const [m1, m2] = ik(a, a.miss)
    const E = 2.4
    const e = (t: number) => f((t / E) * 100)
    css +=
      `.st-error .ag-${a.id}1{animation:ag-${a.id}e1 ${E}s ease-in-out both}` +
      `@keyframes ag-${a.id}e1{0%,${e(0.18)}%{${deg(h1)}}${e(0.5)}%{${deg(m1)}}${e(0.58)}%{${deg(m1 - 5)}}${e(0.7)}%{${deg(m1 + 3)}}${e(0.82)}%{${deg(m1 - 2)}}${e(1.3)}%,100%{${deg(h1 - 4)}}}` +
      `.st-error .ag-${a.id}2{animation:ag-${a.id}e2 ${E}s ease-in-out both}` +
      `@keyframes ag-${a.id}e2{0%,${e(0.18)}%{${deg(h2)}}${e(0.5)}%{${deg(m2)}}${e(0.58)}%{${deg(m2 + 9)}}${e(0.7)}%{${deg(m2 - 5)}}${e(0.82)}%{${deg(m2 + 3)}}${e(1.3)}%,100%{${deg(h2 + 6)}}}`
    drop =
      `<g transform="translate(${f(a.miss[0])} ${f(a.miss[1])})"><g class="ag-drop"><g transform="rotate(${f(m1 + m2 + rot)}) scale(${a.flip ? -SS : SS} ${SS})">` +
      `${plate(a.plate, 't')}</g></g></g>`
  }

  const markup =
    `<g transform="translate(${a.base[0]} ${a.base[1]})"><g class="ag-${a.id}1">` +
    `<rect x="-12" y="-12" width="${a.l1 + 24}" height="24" rx="12" fill="${ARM}" stroke="${ARM_HI}" stroke-width="2"/>` +
    `<path d="M16 -5H${a.l1 - 16}" stroke="${TEAL}" stroke-opacity=".28" stroke-width="2"/>` +
    `<g transform="translate(${a.l1} 0)"><g class="ag-${a.id}2">` +
    `<rect x="-9" y="-9" width="${L - 20}" height="18" rx="9" fill="${ARM}" stroke="${ARM_HI}" stroke-width="2"/>` +
    `<rect x="${L - 42}" y="-12" width="14" height="24" rx="3" fill="#1f2930" stroke="${ARM_HI}" stroke-width="1.5"/>` +
    `<g class="ag-grip${a.miss === undefined ? '' : ' ag-gx'}" style="--sw:${a.sw}s"><g transform="translate(${L} 0) rotate(${f(rot)}) scale(${a.flip ? -SS : SS} ${SS})">${plate(a.plate, 't')}</g></g>` +
    `<path d="M${L - 29} -10L${L - 14} -13L${L - 9} -7M${L - 29} 10L${L - 14} 13L${L - 9} 7" fill="none" stroke="#3a4852" stroke-width="3" stroke-linejoin="round"/>` +
    `<circle r="11" fill="#0d1317" stroke="${TEAL}" stroke-opacity=".6" stroke-width="2.5"/></g></g></g>` +
    `<circle r="15" fill="#0d1317" stroke="${TEAL}" stroke-opacity=".6" stroke-width="3"/></g>`

  return { markup: markup + drop, css }
}

/** Sparks from one point: each a short streak on its own arc, given its mid and end points. */
function sparks(seed: number, n: number, at: P, cls: string, extra = ''): string {
  const next = random(seed)
  const parts = Array.from({ length: n }, () => {
    const a = ((-170 + next() * 160) * Math.PI) / 180
    const v = 40 + next() * 80
    const vx = Math.cos(a) * v
    const vy = Math.sin(a) * v
    const g = 150
    const len = 5 + next() * 6

    return (
      `<path class="ag-sp" style="--u:${Math.round(vx / 2)}px;--v:${Math.round(vy / 2 + g * 0.12)}px;--x:${Math.round(vx)}px;--y:${Math.round(vy + g / 2)}px;--d:${f(next() * 0.18)}s" ` +
      `d="M0 0l${Math.round(Math.cos(a) * len)} ${Math.round(Math.sin(a) * len)}"/>`
    )
  }).join('')

  return `<g class="${cls}" transform="translate(${f(at[0])} ${f(at[1])})"${extra} stroke="${SPARK}" stroke-width="2" stroke-linecap="round">${parts}</g>`
}

// The suit's silhouette, half of it, for the hologram and the old prototype in its alcove.
const HALF: readonly P[] = [
  [0, -177], [20, -170], [33, -156], [37, -132], [35, -112], [27, -96], [14, -88], [16, -82], [58, -80], [94, -84],
  [118, -66], [126, -36], [122, -12], [128, 60], [132, 136], [132, 164], [124, 182], [106, 182], [98, 164], [100, 138],
  [96, 62], [90, -6], [80, -2], [60, 28], [54, 104], [56, 126], [58, 208], [56, 268], [58, 340], [66, 372], [66, 386],
  [12, 386], [12, 372], [18, 340], [16, 268], [12, 204], [8, 156], [0, 152],
]

function outline(): string {
  const right = HALF.map(([x, y]) => `${x} ${y}`)
  const left = HALF.slice(1, -1)
    .reverse()
    .map(([x, y]) => `${-x} ${y}`)

  return `M${right.join('L')}L${left.join('L')}Z`
}

/** The holographic bench: an emitter strip, a keyboard of light and floating panels; the main one shows the activity. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${256 + i * 11}" y="318" width="7" height="2.5" fill="${light}" fill-opacity=".7"/>`).join('')
  const line = (d: string, delay: number) => `<path class="ag-ln" style="animation-delay:${delay}s" d="${d}"/>`
  let content: string

  switch (activity) {
    case 'web':
      content =
        `<g fill="none" stroke="${light}" stroke-opacity=".8" stroke-width="1.8"><circle cx="356" cy="260" r="22"/><ellipse cx="356" cy="260" rx="9" ry="22"/>` +
        '<path d="M334 260H378M338 249H374M338 271H374"/></g>'
      break
    case 'error':
      content = `<path d="M356 238L380 280H332Z" fill="${light}" fill-opacity=".2" stroke="${light}" stroke-width="2.4" stroke-linejoin="round"/><path d="M356 252V266" stroke="${light}" stroke-width="3"/><circle cx="356" cy="273" r="2" fill="${light}"/>`
      break
    case 'done':
      content = `<circle cx="356" cy="260" r="21" fill="none" stroke="${light}" stroke-width="2.4"/><path d="M345 260L353 268L368 250" fill="none" stroke="${light}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
      break
    case 'run':
      content =
        `<path d="M344 254L356 244L368 254M344 266L356 256L368 266" fill="none" stroke="${light}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<rect x="318" y="274" width="76" height="7" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="1.5"/><rect class="ag-prog" x="320" y="276" width="72" height="3" fill="${light}"/>`
      break
    case 'tool':
      content = `<g fill="${light}" fill-opacity=".75">${[0, 1, 2, 3, 4, 5].map(i => `<rect class="ag-bar" style="animation-delay:${f(-i * 0.23)}s" x="${318 + i * 13}" y="${246 + (i % 3) * 6}" width="8" height="${38 - (i % 3) * 6}"/>`).join('')}</g>`
      break
    case 'read':
      content =
        `<rect class="ag-hi" x="316" y="246" width="80" height="9" fill="${light}" fill-opacity=".25"/>` +
        `<g stroke="${light}" stroke-opacity=".6" stroke-width="2.2"><path d="M318 240H392M318 251H386M318 262H394M318 273H380M318 284H388"/></g>`
      break
    default:
      content =
        `<g stroke="${light}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round">` +
        line('M316 242H352', 0) + line('M324 253H372', 0.2) + line('M324 264H362', 0.4) + line('M316 275H344', 0.6) + line('M352 275H388', 0.8) +
        '</g>'
  }

  return (
    '<rect x="236" y="324" width="180" height="6" rx="2" fill="#1c262d"/>' +
    `<path d="M240 324.6H412" stroke="${light}" stroke-opacity=".8" stroke-width="1.4"/>` +
    `<path d="M244 323L250 315H340L336 323Z" fill="${light}" fill-opacity=".14" stroke="${light}" stroke-opacity=".5"/>` +
    keys +
    `<path d="M318 324L306 298M400 324L405 292M424 324L430 298" stroke="${light}" stroke-opacity=".22"/>` +
    `<g class="ag-pan"><path d="M302 298L406 292L410 220L306 228Z" fill="${light}" fill-opacity=".13" stroke="${light}" stroke-opacity=".85" stroke-width="2" stroke-linejoin="round"/>${content}</g>` +
    `<g class="ag-pan2"><path d="M414 300L446 296L448 252L416 256Z" fill="${light}" fill-opacity=".1" stroke="${light}" stroke-opacity=".6" stroke-width="1.5"/>` +
    `<circle cx="431" cy="276" r="9" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="40 17"/></g>`
  )
}

/** A dim niche in the far wall with an earlier prototype standing in it, lit from below. */
function alcove(x: number, inner: string): string {
  return (
    `<rect x="${x}" y="84" width="94" height="162" fill="#05090c" stroke="#1b262d" stroke-width="3"/>` +
    `<rect x="${x}" y="190" width="94" height="56" fill="url(#ag-al)"/>${inner}` +
    `<path d="M${x + 10} 242H${x + 84}" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2"/>` +
    `<path d="M${x + 70} 90L${x + 34} 240" stroke="#dffcf8" stroke-opacity=".04" stroke-width="12"/>`
  )
}

export function armoredGeniusWorld(): World {
  const next = random(23)
  const arms = ARMS.map(robotArm)
  const seatAt = (id: string): P => ARMS.find(a => a.id === id)!.seat

  // The hologram turns: its width follows cos, the core marker slides with sin and fades round the back.
  const STEPS = 16
  const turnKeys = Array.from({ length: STEPS + 1 }, (_, k) => `${f((k / STEPS) * 100)}%{transform:scaleX(${Math.cos((k / STEPS) * Math.PI * 2).toFixed(2)})}`).join('')
  const markKeys = Array.from({ length: STEPS + 1 }, (_, k) => {
    const t = (k / STEPS) * Math.PI * 2

    return `${f((k / STEPS) * 100)}%{transform:translateX(${f(46 * Math.sin(t))}px);opacity:${Math.cos(t) > 0 ? 1 : 0.2}}`
  }).join('')

  // The window: stars, the moon's path on the sea, slow swells.
  const top = (x: number) => 62 + ((x - 18) * 46) / 390
  const stars: [number, number][] = []

  for (let i = 0; i < 30; i += 1) {
    const x = 26 + next() * 376
    stars.push([x, top(x) + 12 + next() * (470 - top(x))])
  }

  const dots = (points: [number, number][], s: number) => points.map(([x, y]) => `M${f(x)} ${f(y)}h${s}v${s}h${-s}z`).join('')
  const glitter = (phase: number) =>
    Array.from({ length: 9 }, (_, i) => {
      const k = i * 3 + phase
      const y = 534 + k * 8.6
      const w = 5 + k * 1.3

      return `M${f(348 + (next() - 0.5) * (12 + k * 3.4) - w / 2)} ${f(y)}h${f(w)}`
    }).join('')
  const swells = [548, 578, 612, 650, 694, 742]
    .map((y, i) => `<path class="ag-wv" style="animation-duration:${8 + i * 1.6}s;animation-delay:${f(-i * 1.7)}s" d="M-20 ${y}q60 -${3 + i} 120 0t120 0t120 0t120 0" fill="none" stroke="#5fb3bd" stroke-opacity="${f(0.1 + i * 0.025)}" stroke-width="${f(1.2 + i * 0.3)}"/>`)
    .join('')

  // The floor: seams running to a far point, and plain cross seams.
  const rays = Array.from({ length: 14 }, (_, i) => {
    const x = -500 + i * 200

    return `M${f(820 + (x - 820) * 0.27)} 780L${x} 1000`
  }).join('')

  // Ceiling downlights over the room, their cones faint.
  const downlights = [520, 680, 840, 1000, 1160]
    .map(x => `<path d="M${x - 14} 58L${x - 90} 300H${x + 90}L${x + 14} 58Z" fill="url(#ag-cone)"/><rect x="${x - 18}" y="52" width="36" height="5" rx="2" fill="#cffaf5" fill-opacity=".4"/>`)
    .join('')

  const proto =
    // An early, boxy prototype.
    `<path d="M1270 112H1296L1298 134H1268ZM1248 140H1318L1314 192H1252ZM1240 142H1248V204H1236ZM1318 142H1326L1330 204H1318ZM1256 196H1278V242H1254ZM1288 196H1310L1312 242H1288Z" fill="#0b1216" stroke="${TEAL}" stroke-opacity=".3" stroke-width="1.5"/>` +
    `<path d="M1274 122H1292" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2"/>`
  const proto2 =
    `<g transform="translate(1393 152) scale(.235)"><path d="${outline()}" fill="#0b1216" stroke="${TEAL}" stroke-opacity=".4" stroke-width="5"/>` +
    `<circle cx="0" cy="-28" r="16" fill="${CORAL}" fill-opacity=".35"/></g>`

  const hoist =
    `<g class="ag-hoist"><path d="M262 140V336M278 140V336" stroke="#1d272e" stroke-width="4"/>` +
    `<rect x="196" y="334" width="148" height="12" rx="4" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="184" y="328" width="16" height="28" rx="3" fill="#1b252c" stroke="${STEEL_HI}" stroke-width="2"/><rect x="340" y="328" width="16" height="28" rx="3" fill="#1b252c" stroke="${STEEL_HI}" stroke-width="2"/></g>`

  const gantry =
    // Columns with their light strips, the top beam with its truss, the beacon.
    `<g fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"><rect x="70" y="132" width="26" height="672"/><rect x="444" y="132" width="26" height="672"/>` +
    '<rect x="56" y="118" width="428" height="30"/></g>' +
    `<path d="M94 160V780M446 160V780" stroke="${TEAL}" stroke-opacity=".3" stroke-width="2"/>` +
    '<path class="ag-warn" d="M94 160V780M446 160V780" stroke="#ffb84d" stroke-width="3"/>' +
    `<path d="M70 120L100 146L130 120L160 146L190 120L220 146M320 146L350 120L380 146L410 120L440 146L470 120" fill="none" stroke="#1d2930" stroke-width="2"/>` +
    `<path d="M96 148L136 148L96 188ZM444 148L404 148L444 188Z" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="248" y="146" width="44" height="20" rx="3" fill="#141c22" stroke="${STEEL_HI}" stroke-width="2"/>` +
    '<circle class="ag-bcn" cx="270" cy="108" r="62" fill="url(#ag-bc)"/>' +
    '<path d="M260 118Q260 104 270 104Q280 104 280 118Z" fill="#3a2a10"/><path class="ag-bcl" d="M260 118Q260 104 270 104Q280 104 280 118Z" fill="#ffb84d"/>' +
    // Mounts for the three arms.
    `<path d="M404 146H444L438 166H410Z" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="86" y="388" width="26" height="32" rx="3" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<path d="M14 810H90L78 784H26Z" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2"/><rect x="38" y="764" width="28" height="22" fill="#141c22"/>`

  const dais =
    '<path d="M90 790V810A180 26 0 0 0 450 810V790Z" fill="#0a0f13"/>' +
    `<ellipse cx="270" cy="790" rx="180" ry="26" fill="#121a20" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<ellipse class="ag-ring" cx="270" cy="790" rx="150" ry="19" fill="none" stroke="${TEAL}" stroke-width="2.5"/>` +
    `<ellipse cx="270" cy="790" rx="112" ry="13" fill="none" stroke="${TEAL}" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="10 8"/>` +
    '<ellipse class="ag-fglow" cx="270" cy="790" rx="170" ry="40" fill="url(#ag-fg)"/>' +
    `<ellipse class="ag-shock" cx="270" cy="790" rx="70" ry="10" fill="none" stroke="${TEAL_HI}" stroke-width="3"/>`

  // Floating schematics beside the suit: a helm study and a part plan.
  const schematics =
    `<g class="ag-sch" fill="none" stroke="${TEAL}">` +
    '<path d="M24 296L150 304V392L24 384Z" fill="#2ee6d6" fill-opacity=".06" stroke-opacity=".55" stroke-width="1.5"/>' +
    '<path d="M60 316L72 314L80 322L82 338L76 352L66 356L56 352L50 338L52 322Z M56 334L66 337L76 334" stroke-opacity=".75" stroke-width="1.5"/>' +
    '<path d="M96 326H136M96 338H128M96 350H140M34 372H110" stroke-opacity=".5" stroke-width="2"/>' +
    '<circle class="ag-dial" cx="124" cy="370" r="10" stroke-opacity=".7" stroke-width="2" stroke-dasharray="44 19"/>' +
    '</g>' +
    `<g class="ag-sch ag-sch2" fill="none" stroke="${TEAL}">` +
    '<path d="M128 176L226 182V240L128 234Z" fill="#2ee6d6" fill-opacity=".06" stroke-opacity=".5" stroke-width="1.5"/>' +
    `<path d="${'M140 222L150 200L160 214L172 192L184 206L196 198L212 220'}" stroke-opacity=".7" stroke-width="1.8"/>` +
    '<path d="M140 228H214" stroke-opacity=".35" stroke-width="1.5"/></g>'

  const scanner =
    '<g transform="translate(0 252)"><g class="ag-scan"><rect x="132" y="-16" width="272" height="32" fill="url(#ag-scg)"/>' +
    `<path d="M132 0H404" stroke="${TEAL_HI}" stroke-opacity=".7" stroke-width="2"/></g></g>`

  const seatSparks =
    sparks(31, 7, seatAt('A'), 'ag-sk ag-swA', ' style="--sw:.4s"') +
    sparks(32, 7, seatAt('C'), 'ag-sk ag-swC', ' style="--sw:.6s"') +
    sparks(33, 7, seatAt('B'), 'ag-sk ag-swB', ' style="--sw:.8s"') +
    ARMS.map(a => `<circle class="ag-snap" style="--sw:${a.sw}s" cx="${f(a.seat[0])}" cy="${f(a.seat[1])}" r="16" fill="none" stroke="#d8fffb" stroke-width="3"/>`).join('')
  const missAt = ARMS.find(a => a.miss !== undefined)!.miss!

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'holo',
      cup: 'none',
      thought: 'orbs',
      ink: '#05090c',
      furniture: '#1a2329',
      metal: '#2a353d',
      paper: '#cfe9e6',
      light: { idle: '#1f9e95', work: TEAL, bright: TEAL_HI },
      headTop: 238,
      glowAt: [352, 262],
      device,
      wear: {
        // A heads-up visor of teal glass over the eyes, which show through it, and an earpiece on the near side.
        front:
          '<path d="M60 254L100 247H200L240 254V300L226 316H164L150 308L136 316H74L60 300Z" fill="#2ee6d6" fill-opacity=".12" stroke="#7ff7ee" stroke-opacity=".75" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M64 256L100 250H200L236 256" fill="none" stroke="#e0fffb" stroke-opacity=".7" stroke-width="2"/>' +
          '<path d="M72 270V262H80M228 270V262H220M72 298V306H80" fill="none" stroke="#b8fff7" stroke-opacity=".6" stroke-width="1.5"/>' +
          '<circle cx="196" cy="300" r="5" fill="none" stroke="#b8fff7" stroke-opacity=".55" stroke-width="1.3"/>' +
          '<rect x="228" y="260" width="14" height="24" rx="4" fill="#2a353d" stroke="#3d4b55" stroke-width="1.5"/>' +
          `<circle class="ag-led" cx="235" cy="267" r="2.2" fill="${TEAL}"/>`,
      },
      seatArt:
        '<rect x="108" y="350" width="86" height="11" rx="5" fill="#1a2329" stroke="#2f3c45" stroke-width="1.5"/>' +
        `<path d="M114 351.5H188" stroke="${TEAL}" stroke-opacity=".45" stroke-width="1.5"/>` +
        '<rect x="145" y="361" width="12" height="60" fill="#141b21"/>' +
        `<rect x="143" y="382" width="16" height="5" fill="${TEAL}" fill-opacity=".5"/>` +
        '<path d="M151 421L110 444M151 421L192 444M151 421L134 450M151 421L168 450" stroke="#1a2329" stroke-width="6" stroke-linecap="round"/>' +
        '<g fill="#0c1115"><circle cx="110" cy="449" r="5"/><circle cx="192" cy="449" r="5"/><circle cx="134" cy="452" r="4"/><circle cx="168" cy="452" r="4"/></g>',
      tableArt:
        '<path d="M166 330H470L466 344H170Z" fill="#1a2329" stroke="#2f3c45" stroke-width="1.5" stroke-linejoin="round"/>' +
        `<path d="M168 330.6H468" stroke="${TEAL}" stroke-opacity=".5" stroke-width="1.5"/>` +
        '<path d="M182 344H198L192 456H178Z" fill="#141b21"/><path d="M192 420H334M426 400H462V456H452" fill="none" stroke="#141b21" stroke-width="5"/>' +
        '<rect x="334" y="344" width="92" height="104" fill="#121a1f" stroke="#26323a" stroke-width="1.5"/>' +
        // A lit case in the cabinet with a small crested helm in it, the suit's own.
        `<rect x="340" y="348" width="80" height="62" fill="#0a1317" stroke="${TEAL}" stroke-opacity=".35" stroke-width="1.5"/>` +
        `<path d="M344 406H416" stroke="${TEAL}" stroke-opacity=".6" stroke-width="2"/><rect x="372" y="397" width="16" height="9" fill="#0c1115"/>` +
        '<g transform="translate(380 442) scale(.5)" stroke="#0a0f13" stroke-width="3" stroke-linejoin="round">' +
        '<path d="M0 -174L20 -170L33 -156L37 -132L35 -112L27 -96L12 -88L-12 -88L-27 -96L-35 -112L-37 -132L-33 -156L-20 -170Z" fill="#3a4752"/>' +
        '<path d="M0 -174L-20 -170L-33 -156L-37 -132L-35 -112L-27 -96L-12 -88L0 -88Z" fill="#4d5b66" stroke="none"/>' +
        `<path d="M-35 -124L-46 -134L-41 -106ZM35 -124L46 -134L41 -106Z" fill="#137269"/><path d="M0 -177L7 -170L5 -142L0 -132L-5 -142L-7 -170Z" fill="${TEAL}"/>` +
        `<path d="${VISOR}" fill="${TEAL}" stroke="none"/></g>` +
        `<path d="M334 412H426" stroke="#26323a" stroke-width="1.5"/><rect x="370" y="427" width="20" height="3" rx="1" fill="${TEAL}" fill-opacity=".55"/>` +
        '<rect x="332" y="448" width="96" height="8" fill="#0c1115"/>',
    },
    style:
      arms.map(a => a.css).join('') +
      `@keyframes ag-turn{${turnKeys}}@keyframes ag-cm{${markKeys}}` +
      '@keyframes ag-on{to{opacity:1}}@keyframes ag-off{to{opacity:0}}.ag-q{stroke:#091014;stroke-width:1.6px;stroke-linejoin:round}' +
      // The window.
      '.ag-tw1{animation:ag-tw 3.4s ease-in-out infinite alternate}.ag-tw2{animation:ag-tw 2.6s ease-in-out -1.3s infinite alternate}.ag-tw3{animation:ag-tw 3s ease-in-out -2.1s infinite alternate}' +
      '@keyframes ag-tw{from{opacity:.2}to{opacity:1}}' +
      '.ag-wv{animation:ag-wv 9s ease-in-out infinite alternate}@keyframes ag-wv{from{transform:translateX(-24px)}to{transform:translateX(24px)}}' +
      '.ag-sat{opacity:0}.st-web .ag-sat{animation:ag-sat 5s linear infinite}@keyframes ag-sat{0%{opacity:0;transform:translate(0,0)}10%,90%{opacity:.9}100%{opacity:0;transform:translate(330px,30px)}}' +
      // The suit: its core breathes, its eyes wait.
      '.ag-core{transform-box:fill-box;transform-origin:center;animation:ag-pulse 4s ease-in-out infinite alternate}@keyframes ag-pulse{from{opacity:.5}to{opacity:1}}' +
      '.st-error .ag-core{animation:ag-flk .5s steps(2) infinite}@keyframes ag-flk{from{opacity:1}to{opacity:.2}}' +
      '.st-done .ag-core{animation:ag-flare 1.6s ease-out .15s both}@keyframes ag-flare{0%{opacity:.6;transform:scale(1)}35%{opacity:1;transform:scale(1.7)}100%{opacity:1;transform:scale(1.25)}}' +
      '.ag-eyes{opacity:0}.ultra .ag-eyes{opacity:1}.st-done .ag-eyes{animation:ag-on .45s ease-out .15s both}.st-run .ag-eyes{animation:ag-on .45s ease-out 1.1s both}' +
      '.ag-noz{opacity:.3}.st-run .ag-noz{animation:ag-on .3s ease-out 1.25s both}' +
      // The plates: held by the arms until a command seats them; all on when done.
      '.ag-seat{opacity:0}.st-done .ag-seat{opacity:1}.st-run .ag-seat{animation:ag-on .01s linear var(--sw) both}' +
      '.st-done .ag-grip{opacity:0}.st-run .ag-grip{animation:ag-off .01s linear var(--sw) both}.st-error .ag-gx{animation:ag-off .01s linear .5s both}' +
      '.ag-drop{opacity:0}.st-error .ag-drop{animation:ag-drop 1.5s linear .5s both}' +
      '@keyframes ag-drop{0%{opacity:1;transform:translate(0,0) rotate(0);animation-timing-function:cubic-bezier(.5,0,1,1)}' +
      `36%{transform:translate(-22px,${f(784 - missAt[1])}px) rotate(150deg);animation-timing-function:ease-out}` +
      `48%{transform:translate(-30px,${f(764 - missAt[1])}px) rotate(170deg);animation-timing-function:ease-in}` +
      `60%,100%{opacity:1;transform:translate(-34px,${f(786 - missAt[1])}px) rotate(178deg)}}` +
      // Launch: the thrusters light, the hoist lets go, the suit lifts and hovers.
      '.ag-thr{opacity:0}.st-run .ag-thr{animation:ag-on .35s ease-out 1.25s both}' +
      '.ag-fl{transform-box:fill-box;transform-origin:50% 0}.st-run .ag-fl{animation:ag-fl .17s ease-in-out infinite alternate}@keyframes ag-fl{from{transform:scaleY(.88)}to{transform:scaleY(1.06)}}' +
      '.st-run .ag-hoist{animation:ag-hoist .8s ease-in 1s both}@keyframes ag-hoist{to{transform:translateY(-40px)}}' +
      '.st-run .ag-u{animation:ag-out .5s ease-out 1.3s both}@keyframes ag-out{to{transform:rotate(-14deg)}}' +
      '.st-run .ag-rise{animation:ag-rise 1.3s cubic-bezier(.45,0,.25,1) 1.7s both}@keyframes ag-rise{to{transform:translateY(-92px)}}' +
      '.st-run .ag-hov{animation:ag-hov 1.6s ease-in-out 3s infinite alternate}@keyframes ag-hov{to{transform:translateY(-7px)}}' +
      '.ag-fglow{opacity:0}.st-run .ag-fglow{animation:ag-on .8s ease-out 1.25s both}' +
      '.ag-shock{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .ag-shock{animation:ag-shock 1.1s ease-out 1.3s infinite}' +
      '@keyframes ag-shock{0%{opacity:.7;transform:scale(.6)}100%{opacity:0;transform:scale(2.6)}}' +
      '.ag-snap{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .ag-snap{animation:ag-snap .5s ease-out var(--sw) both}' +
      '@keyframes ag-snap{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(2.2)}}' +
      // Done: the thumbs-up, with the fist swapped in as the forearm swings up.
      '.ag-fist{opacity:0}.st-done .ag-fist{animation:ag-on .01s linear .75s both}.st-done .ag-hl{animation:ag-off .01s linear .75s both}' +
      '.st-done .ag-ul{animation:ag-ul .7s cubic-bezier(.3,1.3,.5,1) .4s both}@keyframes ag-ul{to{transform:rotate(-40deg)}}' +
      '.st-done .ag-fal{animation:ag-fal 1.2s ease-out .4s both}' +
      '@keyframes ag-fal{0%{transform:rotate(0)}50%{transform:rotate(-148deg)}66%{transform:rotate(-128deg)}82%,100%{transform:rotate(-135deg)}}' +
      '.ag-ring{animation:ag-br 5s ease-in-out infinite alternate}@keyframes ag-br{from{opacity:.3}to{opacity:.75}}.st-done .ag-ring{animation:ag-on .6s ease-out both}' +
      // Sparks: welding while it works, a burst as each plate seats, a spray when one falls.
      '.ag-sp{opacity:0}@keyframes ag-sp{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}45%{transform:translate(var(--u),var(--v))}100%{opacity:0;transform:translate(var(--x),var(--y))}}' +
      '@keyframes ag-spw{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}12%{transform:translate(var(--u),var(--v))}26%,100%{opacity:0;transform:translate(var(--x),var(--y))}}' +
      '.st-idle .ag-swB .ag-sp{animation:ag-spw 4.6s ease-out infinite;animation-delay:var(--d)}' +
      '.st-responding .ag-swA .ag-sp,.st-responding .ag-swB .ag-sp{animation:ag-spw 2.6s ease-out infinite;animation-delay:var(--d)}.st-responding .ag-swB .ag-sp{animation-delay:calc(var(--d) - 1.3s)}' +
      '.st-tool .ag-sk .ag-sp{animation:ag-spw 1.4s ease-out infinite;animation-delay:var(--d)}.st-tool .ag-swC .ag-sp{animation-delay:calc(var(--d) - .5s)}.st-tool .ag-swB .ag-sp{animation-delay:calc(var(--d) - .9s)}' +
      '.st-run .ag-sk .ag-sp{animation:ag-sp .7s ease-out both;animation-delay:calc(var(--sw) + var(--d))}' +
      '.st-error .ag-se .ag-sp{animation:ag-sp 1.2s ease-out infinite;animation-delay:calc(.5s + var(--d))}' +
      '.st-error .ag-sl .ag-sp{animation:ag-sp .6s ease-out both;animation-delay:calc(1.04s + var(--d))}' +
      // Error: the beacon on the beam turns.
      '.ag-bcn,.ag-bcl{opacity:0}.st-error .ag-bcn{animation:ag-bcn 1s ease-in-out infinite}.st-error .ag-bcl{animation:ag-bcn 1s ease-in-out infinite}' +
      '@keyframes ag-bcn{0%,100%{opacity:.25}50%{opacity:1}}.ag-warn{opacity:0}.st-error .ag-warn{animation:ag-bcn 1s ease-in-out infinite}' +
      '.st-error .ag-hov{animation:ag-jolt 1s ease-out .5s both}@keyframes ag-jolt{0%{transform:rotate(0)}15%{transform:rotate(2.6deg)}35%{transform:rotate(-1.8deg)}55%{transform:rotate(1deg)}75%,100%{transform:rotate(0)}}' +
      '.ag-wave{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .ag-wave{animation:ag-wave 1.8s ease-out .3s both}' +
      '@keyframes ag-wave{0%{opacity:0;transform:scale(.6)}12%{opacity:.35}100%{opacity:0;transform:scale(8)}}' +
      '.ag-pop{opacity:0}.st-done .ag-pop{animation:ag-pop 1s ease-out .95s both}@keyframes ag-pop{0%{opacity:0}25%{opacity:1}100%{opacity:.45}}' +
      // Read: a scan runs down the suit.
      '.ag-scan{opacity:0}.st-read .ag-scan{animation:ag-scan 2.4s ease-in-out infinite}' +
      '@keyframes ag-scan{0%{opacity:0;transform:translateY(0)}12%,88%{opacity:1}100%{opacity:0;transform:translateY(520px)}}' +
      // The schematics and the bench.
      '.ag-sch{animation:ag-sch 5s ease-in-out infinite alternate}.ag-sch2{animation-delay:-2.5s}@keyframes ag-sch{from{opacity:.6}to{opacity:1}}' +
      '.st-thinking .ag-sch{animation:ag-sch 1s ease-in-out infinite alternate}.st-done .ag-sch{animation:ag-off .6s ease-out both}' +
      '.ag-dial{transform-box:fill-box;transform-origin:center;animation:mv-spin 6s linear infinite}.st-thinking .ag-dial,.st-tool .ag-dial{animation-duration:1.5s}' +
      '.ag-pan{animation:ag-bob 4s ease-in-out infinite alternate}.ag-pan2{animation:ag-bob 3.2s ease-in-out -1s infinite alternate}@keyframes ag-bob{to{transform:translateY(-5px)}}' +
      '.ag-ln{animation:ag-ln 1.4s ease-in-out infinite}@keyframes ag-ln{0%,100%{opacity:.35}50%{opacity:1}}' +
      '.ag-bar{transform-box:fill-box;transform-origin:50% 100%;animation:ag-bar .7s ease-in-out infinite alternate}@keyframes ag-bar{from{transform:scaleY(.35)}}' +
      '.ag-prog{transform-box:fill-box;transform-origin:0 50%;animation:ag-prog 1.6s ease-out both}@keyframes ag-prog{from{transform:scaleX(0)}}' +
      '.ag-hi{animation:ag-hi 1.6s ease-in-out infinite alternate}@keyframes ag-hi{to{transform:translateY(28px)}}' +
      '.ag-led{animation:ag-ln 2.4s ease-in-out infinite}' +
      // The hologram over the bench.
      '.ag-holo{opacity:.8}.st-thinking .ag-holo{opacity:1}.st-sleeping .ag-holo{opacity:.3}' +
      '.ag-turn{transform-box:fill-box;transform-origin:center;animation:ag-turn 16s linear infinite}.ag-cm{animation:ag-cm 16s linear infinite}' +
      '.st-thinking .ag-turn,.st-thinking .ag-cm{animation-duration:3.6s}.st-responding .ag-turn,.st-responding .ag-cm,.st-tool .ag-turn,.st-tool .ag-cm{animation-duration:7s}' +
      '.st-sleeping .ag-turn,.st-sleeping .ag-cm{animation-duration:40s}' +
      '.ag-hscan{animation:ag-hscan 3.2s linear infinite}@keyframes ag-hscan{from{transform:translateY(0)}to{transform:translateY(-560px)}}.st-thinking .ag-hscan,.st-read .ag-hscan{animation-duration:1.4s}' +
      '.ag-cring{opacity:0}.st-thinking .ag-cring{animation:ag-cring 1.8s linear infinite}.st-thinking .ag-cring2{animation-delay:-.9s}' +
      '@keyframes ag-cring{0%{opacity:0;transform:translateY(0)}20%{opacity:.8}100%{opacity:0;transform:translateY(-480px)}}' +
      '.ag-dash{animation:ag-dash 8s linear infinite}@keyframes ag-dash{to{stroke-dashoffset:-240}}' +
      '.ag-globe{opacity:0}.st-web .ag-globe{animation:ag-on .4s ease-out both}.st-web .ag-hsuit{animation:ag-off .3s ease-out both}' +
      '.ag-mer{transform-box:fill-box;transform-origin:center}.st-web .ag-mer{animation:ag-turn 6s linear infinite}' +
      '.st-run .ag-hsuit{animation:ag-hup 1.3s ease-in-out 1.7s both}@keyframes ag-hup{to{transform:translateY(-60px)}}' +
      '.st-error .ag-holo{animation:ag-glitch .5s steps(1) infinite}@keyframes ag-glitch{0%{transform:translateX(0);opacity:.85}50%{transform:translateX(5px);opacity:.45}}' +
      '.ag-ok{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-done .ag-ok{animation:ag-ok 1.2s ease-out .2s both}@keyframes ag-ok{to{opacity:1;stroke-dashoffset:0}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ag-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a0d"/><stop offset=".6" stop-color="#0a1115"/><stop offset="1" stop-color="#0b1317"/></linearGradient>' +
      '<linearGradient id="ag-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#061019"/><stop offset="1" stop-color="#123047"/></linearGradient>' +
      '<linearGradient id="ag-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#103042"/><stop offset="1" stop-color="#040b11"/></linearGradient>' +
      '<linearGradient id="ag-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8f98" stop-opacity="0"/><stop offset="1" stop-color="#4aa3ab" stop-opacity=".32"/></linearGradient>' +
      '<radialGradient id="ag-moon"><stop offset="0" stop-color="#d8f3f0" stop-opacity=".32"/><stop offset="1" stop-color="#d8f3f0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ag-flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d151a"/><stop offset="1" stop-color="#04070a"/></linearGradient>' +
      '<linearGradient id="ag-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cffaf5" stop-opacity=".07"/><stop offset="1" stop-color="#cffaf5" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ag-pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c5a64"/><stop offset=".55" stop-color="#252f37"/><stop offset="1" stop-color="#151c22"/></linearGradient>' +
      '<linearGradient id="ag-pt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#28bdb1"/><stop offset=".5" stop-color="#137269"/><stop offset="1" stop-color="#0a3c39"/></linearGradient>' +
      '<linearGradient id="ag-pd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26313a"/><stop offset="1" stop-color="#0c1216"/></linearGradient>' +
      '<radialGradient id="ag-cg"><stop offset="0" stop-color="#ffb08f" stop-opacity=".75"/><stop offset=".35" stop-color="#d97757" stop-opacity=".28"/><stop offset="1" stop-color="#d97757" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ag-eg"><stop offset="0" stop-color="#b8fff7" stop-opacity=".8"/><stop offset=".4" stop-color="#2ee6d6" stop-opacity=".3"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ag-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4fffd"/><stop offset=".25" stop-color="#8ff8ef" stop-opacity=".9"/><stop offset=".6" stop-color="#2ee6d6" stop-opacity=".4"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ag-tg"><stop offset="0" stop-color="#d8fffb" stop-opacity=".7"/><stop offset=".4" stop-color="#2ee6d6" stop-opacity=".25"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ag-fg"><stop offset="0" stop-color="#7ff7ee" stop-opacity=".5"/><stop offset=".5" stop-color="#2ee6d6" stop-opacity=".16"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ag-scg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee6d6" stop-opacity="0"/><stop offset=".5" stop-color="#2ee6d6" stop-opacity=".3"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ag-bc"><stop offset="0" stop-color="#ffb84d" stop-opacity=".55"/><stop offset="1" stop-color="#ffb84d" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ag-al" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2ee6d6" stop-opacity=".22"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="ag-wc"><path d="M18 62L408 108V776H18Z"/></clipPath>' +
      '</defs>' +
      // The room: back wall, panel seams, ceiling with its rail and downlights.
      '<rect width="1600" height="1000" fill="url(#ag-wall)"/>' +
      `<path d="${[520, 680, 840, 1000, 1160, 1320, 1480].map(x => `M${x} 68V780`).join('')}M408 640H1600" stroke="#0f181d" stroke-width="2"/>` +
      '<rect width="1600" height="58" fill="#04070a"/><rect y="58" width="1600" height="10" fill="#0b1115"/>' +
      downlights +
      // The window onto the sea.
      '<g clip-path="url(#ag-wc)">' +
      '<rect x="18" y="60" width="390" height="470" fill="url(#ag-sky)"/><rect x="18" y="470" width="390" height="58" fill="url(#ag-hz)"/>' +
      `<path class="ag-tw1" d="${dots(stars.filter((_, i) => i % 2 === 0), 2.4)}" fill="#dff4f2"/><path class="ag-tw2" d="${dots(stars.filter((_, i) => i % 2 === 1), 2)}" fill="#cfe8f0"/>` +
      '<circle cx="348" cy="196" r="96" fill="url(#ag-moon)"/><circle cx="348" cy="196" r="20" fill="#dff4f1" fill-opacity=".8"/><circle cx="354" cy="190" r="15" fill="#0f2634" fill-opacity=".18"/>' +
      '<g class="ag-sat"><circle cx="40" cy="140" r="2" fill="#e8fffb"/></g>' +
      '<path d="M18 527H408V776H18Z" fill="url(#ag-sea)"/>' +
      '<path d="M232 528L262 512L292 506L322 512L352 500L380 504L408 498V530H232Z" fill="#04090d"/>' +
      `<g stroke="#e6fbf8" stroke-width="2" stroke-linecap="round"><path class="ag-tw1" d="${glitter(0)}" stroke-opacity=".55"/><path class="ag-tw2" d="${glitter(1)}" stroke-opacity=".45"/><path class="ag-tw3" d="${glitter(2)}" stroke-opacity=".5"/></g>` +
      swells +
      '<path d="M18 712L46 700L82 708L116 724L146 748L170 776H18Z" fill="#03070a"/>' +
      '<path class="ag-tw2" d="M100 722h12M124 732h14M144 748h12M160 764h12" stroke="#a8d8de" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M300 70L120 776H190L370 78Z" fill="#dffcf8" fill-opacity=".025"/>' +
      '</g>' +
      '<path d="M18 62L408 108V776H18Z" fill="none" stroke="#141c22" stroke-width="12"/>' +
      '<path d="M148 77V776M278 92V776" stroke="#141c22" stroke-width="8"/><rect x="10" y="772" width="406" height="10" fill="#141c22"/>' +
      // The floor.
      '<rect y="780" width="1600" height="220" fill="url(#ag-flr)"/>' +
      `<path d="${rays}M0 818H1600M0 864H1600M0 924H1600" stroke="#131d23" stroke-width="2"/>` +
      '<path d="M18 782H416L640 1000H90Z" fill="#dffcf8" fill-opacity=".02"/>' +
      // The far wall: two earlier prototypes in their niches.
      `<g class="mv-r"><g class="mv-t">${alcove(1236, proto)}${alcove(1346, proto2)}</g></g>` +
      // The gantry, the hoist, the dais and the suit.
      hoist +
      gantry +
      dais +
      `<g class="ag-rise"><g transform="translate(${SX} ${SY}) scale(${SS})"><g class="ag-hov">${suit()}</g></g></g>` +
      scanner +
      schematics +
      arms.map(a => a.markup).join('') +
      seatSparks +
      sparks(34, 16, missAt, 'ag-se') +
      sparks(35, 7, [missAt[0] - 34, 790], 'ag-sl'),
    nook:
      '<defs><linearGradient id="ag-hc" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2ee6d6" stop-opacity=".1"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></linearGradient></defs>' +
      '<rect x="-60" y="456" width="500" height="14" fill="#070b0e"/>' +
      `<path d="M-60 456.5H440" stroke="${TEAL}" stroke-opacity=".18" stroke-width="1.5"/>` +
      // The projection cone up from the bench, and the turning wireframe of the suit.
      '<path d="M296 322L358 322L384 -34L236 -34Z" fill="url(#ag-hc)"/>' +
      `<g class="ag-holo"><g transform="translate(310 -226) scale(.46)">` +
      `<g fill="none" stroke="${TEAL}"><ellipse cx="0" cy="404" rx="160" ry="24" stroke-opacity=".7" stroke-width="3"/>` +
      '<ellipse class="ag-dash" cx="0" cy="404" rx="196" ry="30" stroke-opacity=".45" stroke-width="3" stroke-dasharray="16 12"/>' +
      `<g class="ag-hsuit"><g class="ag-turn"><path d="${outline()}" fill="#2ee6d6" fill-opacity=".08" stroke-opacity=".95" stroke-width="3.6"/>` +
      '<path d="M-82 -40Q0 -24 82 -40M-54 100Q0 112 54 100M16 220Q37 228 58 220M-16 220Q-37 228 -58 220M18 300Q37 306 58 300M-18 300Q-37 306 -58 300M96 40Q112 46 128 40M-96 40Q-112 46 -128 40M-36 -132Q0 -122 36 -132" stroke-opacity=".5" stroke-width="2.4"/>' +
      '<path d="M0 -170V150" stroke-opacity=".35" stroke-width="2" stroke-dasharray="8 8"/></g>' +
      `<g class="ag-cm"><circle cx="0" cy="-28" r="15" stroke="${CORAL}" stroke-width="4"/><circle cx="0" cy="-28" r="5" fill="${CORAL}" stroke="none"/></g>` +
      '<g class="ag-hscan"><path d="M-150 386H150" stroke-opacity=".6" stroke-width="3"/></g>' +
      '<ellipse class="ag-cring" cx="0" cy="380" rx="150" ry="22" stroke-opacity=".8" stroke-width="3"/><ellipse class="ag-cring ag-cring2" cx="0" cy="380" rx="150" ry="22" stroke-opacity=".8" stroke-width="3"/></g>' +
      '<g class="ag-globe" stroke-opacity=".85" stroke-width="3"><circle cx="0" cy="100" r="170"/><ellipse cx="0" cy="100" rx="170" ry="60"/><path d="M-160 40H160M-160 160H160"/>' +
      '<ellipse class="ag-mer" cx="0" cy="100" rx="170" ry="170"/><ellipse class="ag-mer" style="animation-delay:-2s" cx="0" cy="100" rx="170" ry="170"/><ellipse class="ag-mer" style="animation-delay:-4s" cx="0" cy="100" rx="170" ry="170"/></g>' +
      '<circle class="ag-ok" pathLength="1" cx="0" cy="60" r="190" stroke-width="5" transform="rotate(-90 0 60)"/>' +
      '</g></g></g>' +
      // A spec card floating beside it.
      `<g class="ag-sch" fill="none" stroke="${TEAL}"><path d="M156 -196H226V-140H156Z" fill="#2ee6d6" fill-opacity=".05" stroke-opacity=".45" stroke-width="1.5"/>` +
      '<path d="M164 -184H206M164 -173H218M164 -162H194M164 -151H210" stroke-opacity=".5" stroke-width="2"/><path d="M226 -168H248" stroke-opacity=".3" stroke-width="1.5"/></g>',
  }
}
