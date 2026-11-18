import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Museum Night: Claude is the night guard of a natural history museum's great hall, at a security desk with a camera
// monitor and a flashlight. A big theropod skeleton stands on its plinth on the left, a whale skeleton hangs under the
// moonlit skylight, a stone guardian stands on its pedestal behind the desk. When a command runs the exhibits come
// alive: the skeleton walks, the guardian waves, the whale swims; an error makes a vase wobble and freezes everyone
// guiltily mid-pose; done brings a bow.
type P = [number, number]

const BONE = '#b2bfd3'
const BONE_D = '#5c697f'
const GAP = '#0a0d13'
const WHALE = '#8a9cb7'
const STONE = '#3b4454'
const STONE_HI = '#55606f'
const STONE_D = '#252c39'
const GOLD = '#d4b05a'
const BRASS = '#7a6842'
const CORAL = '#d97757'
const WARM = '#ffdc8a'
const ACCENT = '#9cc8ff'
const SIDE = 'url(#mu-sd)'

/** Inner drawn in its parent's coordinates, turned and moved by the class's animation about (x, y). */
function pv(x: number, y: number, cls: string, inner: string, style = ''): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)})"><g class="${cls}"${style ? ` style="${style}"` : ''}>` +
    `<g transform="translate(${f(-x)} ${f(-y)})">${inner}</g></g></g>`
  )
}

function bez(a: P, b: P, c: P, d: P, t: number): P {
  const u = 1 - t

  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ]
}

function samples(curve: [P, P, P, P], n: number): P[] {
  return Array.from({ length: n + 1 }, (_, i) => bez(curve[0], curve[1], curve[2], curve[3], i / n))
}

const line = (ps: P[]): string => ps.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('')

const ell = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`

/** A run of vertebrae: a bone stroke cut into segments, spines off its upper side and chevrons off its lower. */
function vertebrae(ps: P[], width: number, color: string, spine: (t: number) => number, chevron: (t: number) => number, cut = 10): string {
  const d = line(ps)
  let ticks = ''

  for (let i = 1; i < ps.length - 1; i += 1) {
    const t = i / (ps.length - 1)
    const [x0, y0] = ps[i - 1]!
    const [x1, y1] = ps[i + 1]!
    const len = Math.hypot(x1 - x0, y1 - y0) || 1
    let nx = (y1 - y0) / len
    let ny = -(x1 - x0) / len

    if (ny > 0) {
      nx = -nx
      ny = -ny
    }

    const [x, y] = ps[i]!
    const s = spine(t)
    const c = chevron(t)

    if (s > 0) {
      ticks += `M${f(x + nx * width * 0.4)} ${f(y + ny * width * 0.4)}l${f(nx * s)} ${f(ny * s)}`
    }

    if (c > 0) {
      ticks += `M${f(x - nx * width * 0.4)} ${f(y - ny * width * 0.4)}l${f(-nx * c + 2)} ${f(-ny * c)}`
    }
  }

  return (
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${GAP}" stroke-width="${width + 3}" stroke-dasharray="2.4 ${cut}"/>` +
    (ticks ? `<path d="${ticks}" stroke="${color}" stroke-width="${f(Math.max(2.4, width * 0.34))}" stroke-linecap="round"/>` : '')
  )
}

/** Claude's own emblem: a coral starburst. */
function starburst(cx: number, cy: number, r: number, color: string, opacity = 1): string {
  const rays = Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4

    return `M${f(cx + Math.cos(a) * r * 0.18)} ${f(cy + Math.sin(a) * r * 0.18)}L${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`
  }).join('')

  return `<path d="${rays}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${f(Math.max(1.8, r * 0.28))}" stroke-linecap="round"/>`
}

/** The theropod's skull in its own frame, facing right from the neck joint, with a jaw that opens. */
function skull(): string {
  const head =
    'M-6 -4C4 -32 38 -40 70 -31C92 -25 108 -17 118 -7L121 3L112 10L30 12C14 14 -2 10 -6 -4Z' +
    ell(34, -18, 7, 7) +
    ell(63, -10, 15, 7.5) +
    ell(105, -6, 5, 3) +
    ell(9, -6, 7, 10)
  const upper = Array.from({ length: 10 }, (_, i) => `M${36 + i * 8} 11l3 8l3 -8Z`).join('')
  const lower = Array.from({ length: 7 }, (_, i) => `M${42 + i * 9} 12l3 -7l3 7Z`).join('')
  const jaw = 'M2 6L110 11L106 17C80 30 40 32 10 25C2 21 0 14 2 6Z' + ell(46, 19, 11, 4)

  return (
    pv(2, 8, 'mu-jaw', `<path d="${lower}" fill="${BONE}"/><path d="${jaw}" fill="${BONE}" fill-rule="evenodd"/>`) +
    `<path d="${upper}" fill="${BONE}"/><path d="${head}" fill="${BONE}" fill-rule="evenodd"/>` +
    '<circle class="mu-glint" cx="34" cy="-18" r="2.8" fill="#e8f1ff"/>'
  )
}

/** One leg from the hip: thigh, then shin and foot turning at the knee. */
function leg(hip: P, knee: P, ankle: P, foot: P, color: string, thigh: string, shin: string): string {
  const [kx, ky] = knee
  const [ax, ay] = ankle
  const [mx, my] = foot

  return pv(
    hip[0],
    hip[1],
    thigh,
    `<path d="M${hip[0]} ${hip[1]}L${kx} ${ky}" stroke="${color}" stroke-width="15" stroke-linecap="round"/>` +
      pv(
        kx,
        ky,
        shin,
        `<path d="M${kx} ${ky}L${ax} ${ay}M${mx} ${my}L${ax} ${ay}" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<path d="M${kx - 7} ${ky + 6}L${ax - 5} ${ay - 6}" stroke="${color}" stroke-width="4"/>` +
          `<path d="M${mx} ${my}L${mx + 33} ${my + 6}M${mx} ${my}L${mx + 16} ${my + 8}M${ax + 2} ${ay + 14}L${ax - 8} ${ay + 34}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>` +
          `<circle cx="${ax}" cy="${ay}" r="7.5" fill="${color}"/>`,
      ) +
      `<circle cx="${kx}" cy="${ky}" r="9.5" fill="${color}"/>`,
  )
}

/** The theropod skeleton on the left, facing right toward the desk. */
function dino(): string {
  const tail = samples([[190, 556], [120, 566], [40, 586], [-96, 604]], 18)
  const trunkCurve: [P, P, P, P] = [[190, 556], [228, 540], [270, 502], [300, 470]]
  const trunk = samples(trunkCurve, 8)
  const neck = samples([[300, 470], [322, 456], [312, 426], [334, 404]], 6)
  const ribEnds: P[] = []
  const ribs = Array.from({ length: 7 }, (_, i) => {
    const t = 0.16 + i * 0.12
    const [x, y] = bez(trunkCurve[0], trunkCurve[1], trunkCurve[2], trunkCurve[3], t)
    const len = 30 + 70 * Math.sin(Math.PI * t * 0.85)

    ribEnds.push([x + 12, y + 4 + len])

    return `M${f(x)} ${f(y + 4)}q30 ${f(len * 0.45)} 12 ${f(len)}`
  }).join('')
  const body =
    pv(
      190,
      556,
      'mu-tail',
      vertebrae(tail.slice(0, 8), 13, BONE, t => 15 - t * 4, t => 11 - t * 2) +
        vertebrae(tail.slice(7, 14), 9, BONE, t => 9 - t * 3, t => 7 - t * 2) +
        vertebrae(tail.slice(13), 5.5, BONE, t => 4 - t * 3, () => 0, 8),
    ) +
    // The pelvis: the blade over the hip, the pubis with its boot, the ischium.
    `<path d="M200 560L232 648M182 566L146 626" stroke="${BONE}" stroke-width="8" stroke-linecap="round"/>` +
    `<ellipse cx="238" cy="652" rx="20" ry="7" fill="${BONE}"/>` +
    `<path d="M148 548C156 522 222 518 234 540C232 558 166 568 148 548Z" fill="${BONE}"/>` +
    vertebrae(trunk, 14, BONE, t => 24 - t * 10, () => 0, 11) +
    `<path d="${ribs}" fill="none" stroke="${BONE}" stroke-opacity=".88" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${line(ribEnds)}" fill="none" stroke="${BONE}" stroke-opacity=".55" stroke-width="3.5" stroke-dasharray="6 4"/>` +
    // The tiny arms with their two fingers.
    `<path d="M298 500L314 528L330 520M330 520l8 -6M330 520l7 6" fill="none" stroke="${BONE}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    pv(
      300,
      470,
      'mu-neck',
      vertebrae(neck, 11, BONE, () => 7, () => 0, 8) + `<g transform="translate(334 404) rotate(8)">${skull()}</g>`,
    )

  return (
    '<g class="mu-walk"><g class="mu-bob">' +
    leg([190, 556], [204, 652], [160, 744], [176, 792], BONE_D, 'mu-thf', 'mu-shf') +
    pv(190, 556, 'mu-bow', body) +
    leg([190, 556], [220, 656], [190, 748], [210, 793], BONE, 'mu-thn', 'mu-shn') +
    '</g></g>' +
    // Two guilty drops for the error.
    ([[402, 366, 0], [420, 380, 0.5]] as const)
      .map(([x, y, d]) => `<path class="mu-drop" style="animation-delay:${d}s" d="M${x} ${y - 6}c3 4 4 7 0 10c-4 -3 -3 -6 0 -10Z" fill="#cfe2ff"/>`)
      .join('')
  )
}

/** The whale skeleton hanging under the skylight, facing left, with a faint ghost of its body around the bones. */
function whale(): string {
  const sp = samples([[322, 190], [470, 164], [700, 176], [990, 208]], 22)
  const [tx, ty] = sp[14]!
  const ribs = sp
    .slice(1, 11)
    .map((p, i) => `M${f(p[0])} ${f(p[1] + 4)}q16 ${f((86 - i * 5) * 0.5)} 4 ${f(86 - i * 5)}`)
    .join('')
  const ghost = `fill="${ACCENT}" fill-opacity=".06"`
  const rim = `fill="none" stroke="${ACCENT}" stroke-opacity=".24" stroke-width="1.8"`
  const tail = pv(
    tx,
    ty,
    'mu-fluke',
    `<path class="mu-ghost" d="M${f(tx)} 156C820 170 920 190 984 202L984 214C920 226 820 240 ${f(tx)} 262Z" ${ghost}/>` +
      `<path class="mu-ghost" d="M${f(tx)} 156C820 170 920 190 984 202M984 214C920 226 820 240 ${f(tx)} 262" ${rim}/>` +
      `<path class="mu-ghost" d="M984 206C1004 190 1016 168 1040 158C1038 178 1026 196 1008 208C1026 218 1038 238 1040 258C1016 248 1002 226 984 212Z" ${ghost} stroke="${ACCENT}" stroke-opacity=".24" stroke-width="1.8"/>` +
      vertebrae(sp.slice(14), 7, WHALE, t => 5 - t * 3.5, t => 6 - t * 4, 7),
  )
  const flipper = pv(
    350,
    222,
    'mu-flip',
    `<path class="mu-ghost" d="M346 218C376 232 410 270 406 314C392 322 366 312 356 262Z" ${ghost} stroke="${ACCENT}" stroke-opacity=".24" stroke-width="1.8"/>` +
      `<path d="M350 222L370 262" stroke="${WHALE}" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M370 262L374 304M370 262L384 310M370 262L394 308M370 262L402 298" stroke="${WHALE}" stroke-width="3.5" stroke-linecap="round"/>`,
  )
  const songs = [0, 0.8, 1.6]
    .map(d => `<circle class="mu-song" style="animation-delay:${d}s" cx="200" cy="204" r="56" fill="none" stroke="${ACCENT}" stroke-opacity=".85" stroke-width="3"/>`)
    .join('')

  return (
    `<g class="mu-cab" stroke="#2c3850" stroke-width="1.6">${[sp[2]!, sp[11]!, sp[19]!].map(([x, y]) => `<path d="M${f(x)} 140L${f(x)} ${f(y - 6)}"/>`).join('')}</g>` +
    pv(
      560,
      140,
      'mu-hang',
      pv(
        560,
        205,
        'mu-swim',
        pv(900, 205, 'mu-wbow', '<g opacity=".86">' +
          `<path class="mu-ghost" d="M128 196C210 148 480 126 ${f(tx)} 156L${f(tx)} 262C560 296 400 312 300 268C230 250 170 236 132 212Z" ${ghost}/>` +
          `<path class="mu-ghost" d="M132 212C112 206 112 200 128 196C210 148 480 126 ${f(tx)} 156M${f(tx)} 262C560 296 400 312 300 268C230 250 170 236 132 212" ${rim}/>` +
          tail +
          `<path d="${ribs}" fill="none" stroke="${WHALE}" stroke-opacity=".85" stroke-width="4" stroke-linecap="round"/>` +
          vertebrae(sp.slice(0, 15), 11, WHALE, t => 9 - t * 4, () => 0, 9) +
          flipper +
          `<path d="M142 208Q226 258 316 232" fill="none" stroke="${WHALE}" stroke-width="8" stroke-linecap="round"/>` +
          `<path d="M328 170C290 166 226 176 140 194L138 203C222 206 290 212 328 218Z" fill="${WHALE}"/>` +
          `<ellipse cx="308" cy="194" rx="34" ry="28" fill="${WHALE}"/>` +
          `<circle cx="296" cy="208" r="5" fill="${GAP}"/><ellipse cx="262" cy="189" rx="9" ry="2.5" fill="${GAP}"/>` +
          '</g>') +
          songs,
      ),
    )
  )
}

/** The amphora on its own pedestal at the front left, and the rope barrier. */
function vase(): string {
  const posts = [140, 270, 400]
    .map(x => `<rect x="${x - 3}" y="878" width="6" height="62" fill="${BRASS}"/><circle cx="${x}" cy="876" r="6" fill="${BRASS}"/><ellipse cx="${x}" cy="942" rx="15" ry="4.5" fill="#4a3f27"/>`)
    .join('')

  return (
    '<rect x="20" y="788" width="92" height="12" fill="#1d2432"/><rect x="32" y="800" width="68" height="132" fill="url(#mu-col)"/>' +
    '<rect x="22" y="930" width="88" height="14" fill="#1d2432"/>' +
    pv(
      66,
      788,
      'mu-vase',
      '<g transform="translate(66 788) scale(1.3) translate(-66 -788)">' +
        '<path d="M54 788L78 788L76 780C100 762 102 722 84 704L80 696L82 686L50 686L52 696L48 704C30 722 32 762 56 780Z" fill="#7a4934"/>' +
        '<rect x="46" y="682" width="40" height="6" rx="2" fill="#8a5640"/>' +
        '<path d="M52 692C38 690 36 708 44 714M80 692C94 690 96 708 88 714" fill="none" stroke="#6a4030" stroke-width="4.5"/>' +
        '<path d="M40 726H92M38 748H94" stroke="#22140e" stroke-width="6"/>' +
        '<path d="M42 737l5 -5l5 5l5 -5l5 5l5 -5l5 5l5 -5l5 5l5 -5" fill="none" stroke="#d0a070" stroke-opacity=".7" stroke-width="1.6"/>' +
        '<path d="M50 716C44 730 44 752 52 768" fill="none" stroke="#e8c8a0" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/></g>',
    ) +
    '<path class="mu-shk" d="M8 690q-10 26 0 52M124 690q10 26 0 52M-6 700q-10 18 0 36M138 700q10 18 0 36" fill="none" stroke="#cfe2ff" stroke-width="2.6" stroke-linecap="round"/>' +
    posts +
    '<path d="M140 880Q205 910 270 880Q335 910 400 880" fill="none" stroke="#5a1d29" stroke-width="5" stroke-linecap="round"/>'
  )
}

/** The stone guardian on its pedestal behind the desk, in the desk's box: a robed figure with a staff and a free arm. */
function statue(): string {
  const arm = pv(
    326,
    -132,
    'mu-armup',
    pv(
      326,
      -132,
      'mu-arm',
      `<path d="M326 -132L318 -72" stroke="${STONE_HI}" stroke-width="13" stroke-linecap="round"/><circle cx="317" cy="-66" r="8" fill="${STONE_HI}"/>`,
    ),
  )
  const upper =
    '<g class="mu-upper">' +
    `<path d="M318 -140Q360 -162 402 -140L406 -110Q360 -98 314 -110Z" fill="${STONE_HI}"/>` +
    `<rect x="352" y="-154" width="16" height="16" fill="${STONE}"/>` +
    `<circle cx="360" cy="-174" r="22" fill="${STONE_HI}"/>` +
    `<path d="M337 -177Q360 -214 383 -177Z" fill="${STONE}"/><rect x="337" y="-181" width="46" height="7" rx="2" fill="${STONE_D}"/>` +
    '<path d="M346 -166h10v4h-10zM364 -166h10v4h-10z" fill="#080a10"/>' +
    `<path d="M345 -157H375L369 -137H351Z" fill="${STONE}"/>` +
    `<path d="M392 -132L398 -86" stroke="${STONE_HI}" stroke-width="13" stroke-linecap="round"/><circle cx="399" cy="-80" r="8.5" fill="${STONE_HI}"/>` +
    arm +
    '</g>'

  return (
    // The pedestal with a small plaque of invented marks.
    '<rect x="306" y="80" width="108" height="380" fill="#121822"/><rect x="296" y="66" width="128" height="16" fill="#1d2432" stroke="#2c3546" stroke-width="2"/>' +
    '<rect x="320" y="98" width="82" height="104" fill="none" stroke="#1f2735" stroke-width="2"/>' +
    '<rect x="340" y="128" width="42" height="16" fill="#4e4430" stroke="#6e5f3e" stroke-width="1.5"/><path d="M346 134h12M362 134h8M346 139h18" stroke="#2a2418" stroke-width="2"/>' +
    `<rect x="314" y="54" width="92" height="12" fill="${STONE_D}"/>` +
    pv(
      360,
      54,
      'mu-stat',
      `<path d="M400 -236V54" stroke="#2a303c" stroke-width="6"/><path d="M400 -262L408 -246L400 -236L392 -246Z" fill="${STONE_HI}"/>` +
        `<path d="M332 -136L388 -136L404 54L316 54Z" fill="${STONE}"/>` +
        `<path d="M346 -120L338 52M360 -126V54M374 -120L382 52" stroke="${STONE_D}" stroke-width="2.5"/>` +
        `<path d="M330 -80H390L391 -68H329Z" fill="${STONE_D}"/>` +
        upper,
    )
  )
}

/** The glass case of fossils above Claude's head, in the desk's box. */
function displayCase(): string {
  const spiral = Array.from({ length: 50 }, (_, i): P => {
    const a = i * 0.36
    const r = 21 * Math.exp(-a * 0.12)

    return [128 + r * Math.cos(a), 116 + r * Math.sin(a)]
  })

  return (
    '<path d="M96 160V300M218 160V300" stroke="#16130f" stroke-width="6"/>' +
    '<rect x="80" y="148" width="154" height="14" fill="#241d16" stroke="#342a1f" stroke-width="1.5"/>' +
    '<rect class="mu-caseg" x="86" y="40" width="142" height="108" fill="url(#mu-cg)"/>' +
    '<rect x="118" y="138" width="20" height="10" fill="#262c38"/>' +
    pv(128, 116, 'mu-amm', `<circle cx="128" cy="116" r="22" fill="#5e5242"/><path d="${line(spiral)}" fill="none" stroke="#a8926e" stroke-width="1.8"/>`) +
    '<path d="M174 140L210 137" stroke="#a9a493" stroke-width="5" stroke-linecap="round"/><g fill="#a9a493"><circle cx="173" cy="137" r="4"/><circle cx="173" cy="143" r="4"/><circle cx="211" cy="134" r="4"/><circle cx="211" cy="140" r="4"/></g>' +
    '<rect x="184" y="122" width="22" height="8" fill="#d8dde6" fill-opacity=".4"/>' +
    `<rect x="86" y="40" width="142" height="108" fill="${ACCENT}" fill-opacity=".05" stroke="${ACCENT}" stroke-opacity=".28" stroke-width="2"/>` +
    '<path d="M100 46L124 142M112 46L130 116" stroke="#dcebff" stroke-opacity=".12" stroke-width="3"/>' +
    '<rect x="80" y="32" width="154" height="10" fill="#1d2432"/>'
  )
}

/** The security monitor with four camera feeds, the keyboard and the guard's flashlight standing on the desk. */
function device(light: string, activity: Activity): string {
  const tiles = [
    [296, 222],
    [340, 222],
    [296, 262],
    [340, 262],
  ]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="40" height="36" fill="${light}" fill-opacity=".13"/>`)
    .join('')
  const keys = Array.from({ length: 5 }, (_, i) => `<rect x="${242 + i * 12}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')

  return (
    `<rect x="236" y="322" width="70" height="8" rx="2" fill="#1d2330"/>${keys}` +
    '<rect x="326" y="314" width="24" height="10" fill="#171c27"/><rect x="312" y="324" width="52" height="6" rx="2" fill="#1d2330"/>' +
    '<rect x="288" y="214" width="100" height="102" rx="8" fill="#1d2330" stroke="#2e3747" stroke-width="2"/>' +
    '<rect x="294" y="220" width="88" height="82" rx="3" fill="#04070b"/>' +
    tiles +
    // The feeds: the skull, the whale, the guardian, the vase.
    `<g fill="${light}" fill-opacity=".78"${activity === 'run' ? ' class="mu-jig"' : ''}>` +
    '<path d="M302 246L310 236L324 237L332 243L326 247L310 249ZM310 251L328 249L324 253Z"/>' +
    '<path d="M346 240C352 234 366 234 372 238L378 233L377 245L372 242C366 246 352 246 346 240Z"/>' +
    '<path d="M308 294L311 277Q316 271 321 277L324 294Z"/><circle cx="316" cy="272" r="4.5"/><rect x="304" y="262" width="2" height="32"/><path d="M305 258l3 4l-3 4l-3 -4Z"/>' +
    '<path d="M356 292h8l-1 -3c6 -4 6 -12 1 -16v-3h3v-2h-14v2h3v3c-5 4 -5 12 1 16Z"/></g>' +
    (activity === 'error' ? `<rect x="341" y="263" width="38" height="34" fill="none" stroke="${light}" stroke-width="2.4"/>` : '') +
    `<rect class="mu-scan" x="294" y="220" width="88" height="2" fill="${light}" fill-opacity=".32"/>` +
    '<circle class="mu-rec" cx="375" cy="227" r="2.2" fill="#ff6a5e"/>' +
    `<g fill="#3a4456"><circle cx="300" cy="309" r="2.4"/><circle cx="310" cy="309" r="2.4"/></g><circle cx="374" cy="309" r="2.4" fill="${light}" fill-opacity=".8"/>` +
    // The flashlight, standing on its tail, a coral switch on its grip.
    '<path d="M394 274H415L411 290H398Z" fill="#353b48"/><rect x="399" y="289" width="11" height="41" rx="3" fill="#2b303b" stroke="#3c4352"/>' +
    '<path d="M400 300H409M400 306H409M400 312H409M400 318H409" stroke="#181c24" stroke-width="1.6"/>' +
    `<rect x="402" y="293" width="5" height="4" fill="${CORAL}"/><rect x="395" y="271" width="19" height="4" rx="2" fill="${WARM}"/>`
  )
}

export function museumNightWorld(): World {
  const next = random(1931)
  const columnAt = [10, 290, 570, 1030, 1310, 1590]
  const columns = columnAt
    .map(x => {
      const dim = x > 420 && x < 1180 ? ' opacity=".5"' : ''

      return (
        `<g${dim}><rect x="${x - 23}" y="150" width="46" height="650" fill="url(#mu-col)"/>` +
        `<path d="M${x - 11} 166V786M${x + 1} 166V786M${x + 12} 166V786" stroke="#080b11" stroke-opacity=".55" stroke-width="2"/>` +
        `<rect x="${x - 31}" y="140" width="62" height="18" fill="${SIDE}"/><rect x="${x - 31}" y="784" width="62" height="18" fill="${SIDE}"/></g>`
      )
    })
    .join('')
  const arch = (cx: number, w: number): string => `M${cx - w} 800V600A${w} ${w} 0 0 1 ${cx + w} 600V800Z`
  const arches = arch(150, 90) + arch(430, 90) + arch(800, 150) + arch(1170, 90) + arch(1450, 90)
  const balusters = Array.from({ length: 100 }, (_, i) => `M${i * 16 + 4} 380h7v34h-7z`).join('')
  const mullions =
    Array.from({ length: 17 }, (_, i) => {
      const top = -60 + i * 107.5

      return `M${f(top)} -30L${f(800 + (top - 800) * 0.86)} 124`
    }).join('') +
    [24, 78].map(y => `M${f(-60 + ((y + 30) / 154) * 120)} ${y}H${f(1660 - ((y + 30) / 154) * 120)}`).join('')
  const floorLines =
    Array.from({ length: 25 }, (_, i) => `M${800 + (i - 12) * 70} 804L${800 + (i - 12) * 190} 1000`).join('') +
    [822, 848, 884, 934].map(y => `M0 ${y}H1600`).join('')
  const motes = Array.from({ length: 12 }, (_, i) => {
    const t = 0.08 + next() * 0.84
    const b = i % 2
    const x = b ? 290 + t * 110 : 203 + t * 72 + (next() - 0.5) * 40
    const y = 124 + t * 676

    return `<circle class="mu-mote" style="animation-delay:${f(-i * 1.7)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.6)}" fill="#d4e4ff"/>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'dust',
      ink: '#04060a',
      furniture: '#1a2030',
      metal: '#1d2330',
      paper: '#d8dde6',
      light: { idle: '#5d8cc4', work: ACCENT, bright: '#dcecff' },
      headTop: 212,
      glowAt: [338, 262],
      device,
      wear: {
        front:
          // The night guard's peaked cap: a flared crown, a band with a gold cord, the starburst badge, the visor
          // toward the screen. It ends at y 250, above the eyes.
          '<path d="M58 228C82 206 218 206 242 228L232 240H68Z" fill="#1b2436" stroke="#2e3a52" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M92 214C122 208 178 208 208 214" fill="none" stroke="#35425e" stroke-width="2"/>' +
          '<rect x="66" y="238" width="168" height="12" fill="#0e131d"/>' +
          `<rect x="66" y="241" width="168" height="2.5" fill="${GOLD}" fill-opacity=".75"/>` +
          `<circle cx="150" cy="225" r="9" fill="${GOLD}"/>` +
          starburst(150, 225, 6.5, CORAL) +
          '<path d="M190 246L258 250Q263 256 255 260L188 254Z" fill="#06080c" stroke="#222b3d" stroke-width="1.5"/>' +
          '<path d="M200 250L246 253" stroke="#4a5a7a" stroke-opacity=".6" stroke-width="1.5"/>' +
          // The chest badge, the belt and its buckle, a ring of keys that jingles while a tool runs.
          `<path d="M199 321H215V331Q207 339 199 331Z" fill="${GOLD}" fill-opacity=".9"/><circle cx="207" cy="328" r="2.4" fill="${CORAL}"/>` +
          `<rect x="70" y="338" width="160" height="8" fill="#121826"/><rect x="144" y="336.5" width="13" height="11" fill="none" stroke="${GOLD}" stroke-width="2"/>` +
          pv(
            86,
            344,
            'mu-keys',
            `<path d="M86 344V350" stroke="${GOLD}" stroke-width="1.6"/><circle cx="86" cy="355" r="5" fill="none" stroke="${GOLD}" stroke-width="1.8"/>` +
              '<path d="M84 360l-3 9M88 360l2 10M86 360v8" stroke="#aab4c4" stroke-width="2.2" stroke-linecap="round"/>',
          ),
      },
      seatArt:
        // The guard's swivel chair.
        '<rect x="50" y="244" width="30" height="104" rx="9" fill="#1a2030" stroke="#2a3244" stroke-width="2"/><path d="M68 350H104" stroke="#2a3244" stroke-width="6"/>' +
        '<rect x="102" y="348" width="98" height="14" rx="6" fill="#1a2030" stroke="#2a3244" stroke-width="2"/><rect x="146" y="362" width="10" height="58" fill="#262d3c"/>' +
        '<path d="M151 422L112 444M151 422L190 444M151 422V448" stroke="#262d3c" stroke-width="6" stroke-linecap="round"/>' +
        '<g fill="#0c0f16"><circle cx="112" cy="449" r="6"/><circle cx="190" cy="449" r="6"/><circle cx="151" cy="451" r="5"/></g>',
      tableArt:
        // The security desk: a walnut top with a brass edge, a paneled front with the starburst.
        '<rect x="166" y="330" width="304" height="12" rx="2" fill="#2a2119" stroke="#3b2f22" stroke-width="1.5"/>' +
        `<path d="M168 343H470" stroke="${GOLD}" stroke-opacity=".45" stroke-width="2"/>` +
        '<rect x="178" y="344" width="292" height="112" fill="#111620" stroke="#232b3a" stroke-width="1.6"/>' +
        '<g fill="none" stroke="#1f2736" stroke-width="2"><rect x="192" y="358" width="112" height="84" rx="3"/><rect x="318" y="358" width="140" height="84" rx="3"/></g>' +
        starburst(388, 400, 14, CORAL, 0.55),
    },
    style:
      // Ambient: the whale sways on its cables, dust drifts in the moonbeams, the flashlight beam breathes, the
      // feeds roll.
      '.mu-hang{animation:mu-hang 11s ease-in-out infinite alternate}@keyframes mu-hang{from{transform:rotate(-.7deg)}to{transform:rotate(.7deg)}}' +
      '.mu-mote{opacity:.22;animation:mu-mote 14s ease-in-out infinite alternate}@keyframes mu-mote{to{transform:translate(18px,-46px)}}' +
      '.mu-mg{animation:mu-mg 9s ease-in-out infinite alternate}@keyframes mu-mg{from{opacity:.75}to{opacity:1}}' +
      '.mu-beam{animation:mu-sweep 8s ease-in-out infinite alternate}@keyframes mu-sweep{from{transform:rotate(-2.5deg)}to{transform:rotate(2deg)}}' +
      '.mu-scan{animation:mu-scan 2.8s linear infinite}@keyframes mu-scan{to{transform:translateY(78px)}}' +
      '.mu-rec{animation:mu-rec 1.6s steps(1) infinite}@keyframes mu-rec{50%{opacity:.15}}' +
      '.mu-glint,.mu-song,.mu-drop,.mu-pool,.mu-caseg,.mu-shk{opacity:0}.mu-ghost{opacity:.75}' +
      '.mu-jig{animation:mu-jig .5s ease-in-out infinite alternate}@keyframes mu-jig{to{transform:translate(2px,-2px)}}' +
      // Thinking: the skull slowly turns down toward Claude, the jaw parts, a glint in the eye socket.
      '.st-thinking .mu-neck{animation:mu-turn 2.8s ease-in-out .1s both}@keyframes mu-turn{to{transform:rotate(17deg)}}' +
      '.st-thinking .mu-jaw{animation:mu-part 2.4s ease-in-out .6s both}@keyframes mu-part{to{transform:rotate(9deg)}}' +
      '.st-thinking .mu-glint{animation:mu-on 1.6s ease-in-out 1.2s both}@keyframes mu-on{to{opacity:1}}' +
      // Responding: the whale paddles its flipper and curls its tail.
      '.st-responding .mu-flip{animation:mu-pad 2.4s ease-in-out infinite alternate}@keyframes mu-pad{from{transform:rotate(-8deg)}to{transform:rotate(14deg)}}' +
      '.st-responding .mu-fluke{animation:mu-flap 2.8s ease-in-out infinite alternate}@keyframes mu-flap{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      // Tool: the skeleton's tail swishes, the guard's keys jingle.
      '.st-tool .mu-tail{animation:mu-swish 1.4s ease-in-out infinite alternate}@keyframes mu-swish{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      '.mu-keys{animation:none}.st-tool .mu-keys{animation:mu-jingle .32s ease-in-out infinite alternate}@keyframes mu-jingle{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
      // Read: the flashlight searches the guardian, the fossil case lights up.
      '.st-read .mu-beam{animation:mu-look 3.2s ease-in-out infinite alternate}@keyframes mu-look{from{transform:rotate(-10deg)}to{transform:rotate(6deg)}}' +
      '.st-read .mu-caseg{animation:mu-on 1s ease-out both}' +
      // Web: the whale sings, rings spreading from its skull, and paddles.
      '.mu-song{transform-box:fill-box;transform-origin:center}' +
      '.st-web .mu-song{animation:mu-song 2.4s ease-out infinite}@keyframes mu-song{0%{opacity:0;transform:scale(.3)}15%{opacity:.6}100%{opacity:0;transform:scale(1.9)}}' +
      '.st-web .mu-flip{animation:mu-pad 1.6s ease-in-out infinite alternate}' +
      // Run: the hall comes alive. The skeleton walks off its marks, the guardian hops and waves, the whale swims.
      '.st-run .mu-walk{animation:mu-walk 3.6s ease-in-out both}@keyframes mu-walk{to{transform:translateX(38px)}}' +
      '.st-run .mu-bob{animation:mu-bob .6s ease-in-out infinite alternate}@keyframes mu-bob{to{transform:translateY(-7px)}}' +
      '.st-run .mu-thn{animation:mu-thigh 1.2s ease-in-out infinite}.st-run .mu-thf{animation:mu-thigh 1.2s ease-in-out -.6s infinite}' +
      '@keyframes mu-thigh{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(14deg)}}' +
      '.st-run .mu-shn{animation:mu-shin 1.2s ease-in-out infinite}.st-run .mu-shf{animation:mu-shin 1.2s ease-in-out -.6s infinite}' +
      '@keyframes mu-shin{0%,100%{transform:rotate(26deg)}50%{transform:rotate(0deg)}}' +
      '.st-run .mu-jaw{animation:mu-chomp .6s ease-in-out infinite alternate}@keyframes mu-chomp{from{transform:rotate(2deg)}to{transform:rotate(16deg)}}' +
      '.st-run .mu-neck{animation:mu-nod 1.2s ease-in-out infinite alternate}@keyframes mu-nod{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      '.st-run .mu-tail{animation:mu-swish .6s ease-in-out infinite alternate}' +
      '.st-run .mu-stat{animation:mu-hop 1.2s ease-in-out infinite}@keyframes mu-hop{0%,100%{transform:translateY(0)}30%{transform:translateY(-10px)}55%{transform:translateY(0)}}' +
      '.st-run .mu-armup{animation:mu-raise .45s ease-out both}@keyframes mu-raise{to{transform:rotate(150deg)}}' +
      '.st-run .mu-arm{animation:mu-wave .4s ease-in-out .45s infinite alternate}@keyframes mu-wave{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}' +
      '.st-run .mu-swim{animation:mu-swim 3.4s ease-in-out infinite}' +
      '@keyframes mu-swim{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-50px,-12px) rotate(2.5deg)}50%{transform:translate(-90px,0) rotate(0)}75%{transform:translate(-50px,12px) rotate(-2.5deg)}}' +
      '.st-run .mu-fluke{animation:mu-flap2 .8s ease-in-out infinite alternate}@keyframes mu-flap2{from{transform:rotate(-10deg)}to{transform:rotate(10deg)}}' +
      '.st-run .mu-flip{animation:mu-pad .8s ease-in-out infinite alternate}.st-run .mu-ghost{opacity:1}' +
      '.st-run .mu-amm{animation:mv-spin 2.2s linear infinite}.st-run .mu-cab,.st-error .mu-cab{opacity:.3}' +
      // Error: the vase wobbles; everyone freezes guiltily mid-pose, and time stops in the hall.
      '.st-error .mu-vase{animation:mu-wob 2.6s ease-in-out .1s both}' +
      '@keyframes mu-wob{0%,100%{transform:rotate(0)}10%{transform:rotate(9deg)}22%{transform:rotate(-8deg)}34%{transform:rotate(6deg)}46%{transform:rotate(-4deg)}58%{transform:rotate(2deg)}70%{transform:rotate(-1deg)}}' +
      '.st-error .mu-shk{animation:mu-shk .45s ease-in-out .1s 6 alternate}@keyframes mu-shk{to{opacity:.8}}' +
      '.st-error .mu-thn{animation:mu-fz1 .25s ease-out both}@keyframes mu-fz1{to{transform:rotate(-30deg)}}' +
      '.st-error .mu-shn{animation:mu-fz2 .25s ease-out both}@keyframes mu-fz2{to{transform:rotate(42deg)}}' +
      '.st-error .mu-bow{animation:mu-fz3 .25s ease-out both}@keyframes mu-fz3{to{transform:rotate(-5deg)}}' +
      '.st-error .mu-neck{animation:mu-fz4 .25s ease-out both}@keyframes mu-fz4{to{transform:rotate(15deg)}}' +
      '.st-error .mu-jaw{animation:mu-fz5 .25s ease-out both}@keyframes mu-fz5{to{transform:rotate(12deg)}}' +
      '.st-error .mu-tail{animation:mu-fz6 .25s ease-out both}@keyframes mu-fz6{to{transform:rotate(-8deg)}}' +
      '.st-error .mu-armup{animation:mu-fz7 .25s ease-out both}@keyframes mu-fz7{to{transform:rotate(112deg)}}' +
      '.st-error .mu-stat{animation:mu-fz8 .25s ease-out both}@keyframes mu-fz8{to{transform:translateY(-6px) rotate(-3deg)}}' +
      '.st-error .mu-swim{animation:mu-fz9 .25s ease-out both}@keyframes mu-fz9{to{transform:translate(-30px,0) rotate(2deg)}}' +
      '.st-error .mu-fluke{animation:mu-fz10 .25s ease-out both}@keyframes mu-fz10{to{transform:rotate(7deg)}}' +
      '.st-error .mu-flip{animation:mu-fz11 .25s ease-out both}@keyframes mu-fz11{to{transform:rotate(22deg)}}' +
      '.st-error .mu-glint{opacity:1}.st-error .mu-hang,.st-error .mu-mote{animation-play-state:paused}' +
      '.st-error .mu-drop{animation:mu-drop 1.3s ease-in .3s infinite}@keyframes mu-drop{0%{opacity:0;transform:translate(0,0)}25%{opacity:.85}100%{opacity:0;transform:translate(4px,18px)}}' +
      '.st-error .mu-beam{animation:mu-jit .5s ease-in-out 4 alternate}@keyframes mu-jit{from{transform:rotate(-5deg)}to{transform:rotate(4deg)}}' +
      // Done: a curtain call. The skeleton bows low, the guardian bows with a hand to its chest, the whale dips its nose.
      '.st-done .mu-bow{animation:mu-bow 1s ease-in-out .3s both}@keyframes mu-bow{to{transform:rotate(15deg)}}' +
      '.st-done .mu-neck{animation:mu-bown 1s ease-in-out .4s both}@keyframes mu-bown{to{transform:rotate(12deg)}}' +
      '.mu-upper{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-done .mu-upper{animation:mu-sbow 1s ease-in-out .5s both}@keyframes mu-sbow{to{transform:translateY(12px) scaleY(.88)}}' +
      '.st-done .mu-armup{animation:mu-chest .8s ease-in-out .3s both}@keyframes mu-chest{to{transform:rotate(-45deg)}}' +
      '.st-done .mu-wbow{animation:mu-wbow 1s ease-in-out .4s both}@keyframes mu-wbow{to{transform:rotate(-4deg)}}' +
      '.st-done .mu-flip{animation:mu-dflip .8s ease-in-out .5s both}@keyframes mu-dflip{to{transform:rotate(-24deg)}}' +
      '.st-done .mu-pool{animation:mu-on 1.2s ease-out .4s both}' +
      // The finer moments: the guard dozes and the beam sags; the skeleton sneaks a look; a startled guardian jumps.
      '.st-sleeping .mu-beam{animation:none;opacity:.3}.st-sleeping .mu-neck{animation:mu-turn 3s ease-in-out .5s both}' +
      '.st-asking .mu-neck{animation:mu-tilt 1.4s ease-in-out both}@keyframes mu-tilt{to{transform:rotate(-8deg)}}' +
      '.st-startled .mu-stat{animation:mu-hop .7s ease-out 1}' +
      '.ultra .mu-glint{opacity:1}',
    scenery:
      '<defs>' +
      '<linearGradient id="mu-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070b"/><stop offset=".5" stop-color="#0a0d13"/><stop offset="1" stop-color="#0b0e15"/></linearGradient>' +
      '<linearGradient id="mu-gl" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#0f1828"/><stop offset=".18" stop-color="#16243c"/><stop offset=".4" stop-color="#0b111c"/><stop offset=".7" stop-color="#0a0f19"/><stop offset="1" stop-color="#0d1422"/></linearGradient>' +
      '<radialGradient id="mu-mgl"><stop offset="0" stop-color="#bcd6ff" stop-opacity=".3"/><stop offset=".4" stop-color="#bcd6ff" stop-opacity=".1"/><stop offset="1" stop-color="#bcd6ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mu-mb" gradientUnits="userSpaceOnUse" x1="0" y1="124" x2="0" y2="800"><stop offset="0" stop-color="#a9c8ff" stop-opacity=".11"/><stop offset="1" stop-color="#a9c8ff" stop-opacity=".015"/></linearGradient>' +
      '<linearGradient id="mu-sd" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#1e2738"/><stop offset=".25" stop-color="#171e2c"/><stop offset=".36" stop-color="#0f141e"/><stop offset=".64" stop-color="#0f141e"/><stop offset=".75" stop-color="#171e2c"/><stop offset="1" stop-color="#1e2738"/></linearGradient>' +
      '<linearGradient id="mu-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07090e"/><stop offset="1" stop-color="#0c1019"/></linearGradient>' +
      '<linearGradient id="mu-col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#090c13"/><stop offset=".35" stop-color="#1b2231"/><stop offset=".6" stop-color="#121825"/><stop offset="1" stop-color="#07090e"/></linearGradient>' +
      '<linearGradient id="mu-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f141e"/><stop offset="1" stop-color="#06080c"/></linearGradient>' +
      '<radialGradient id="mu-pl"><stop offset="0" stop-color="#ffe3a8" stop-opacity=".2"/><stop offset=".5" stop-color="#ffe3a8" stop-opacity=".07"/><stop offset="1" stop-color="#ffe3a8" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#mu-bg)"/>' +
      // The skylight: the moon behind the glass, the iron ribs converging, the cornice under it.
      '<path d="M-60 -30H1660L1540 124H60Z" fill="url(#mu-gl)"/>' +
      '<circle class="mu-mg" cx="290" cy="80" r="170" fill="url(#mu-mgl)"/>' +
      '<circle cx="290" cy="80" r="26" fill="#dfeaff" fill-opacity=".85"/><circle cx="282" cy="74" r="5" fill="#c2d0e6" fill-opacity=".6"/><circle cx="298" cy="89" r="3.5" fill="#c2d0e6" fill-opacity=".6"/>' +
      `<path d="${mullions}" fill="none" stroke="#1a2334" stroke-width="5"/>` +
      `<rect y="124" width="1600" height="18" fill="${SIDE}"/>` +
      // The back wall: the gallery's balustrade, the arches below, the giant columns.
      '<rect y="150" width="1600" height="650" fill="url(#mu-wall)"/>' +
      `<path d="M0 150H1600" stroke="${SIDE}" stroke-width="8" stroke-dasharray="8 8"/>` +
      `<rect y="366" width="1600" height="14" fill="${SIDE}"/><path d="${balusters}" fill="${SIDE}" opacity=".8"/><rect y="414" width="1600" height="16" fill="${SIDE}"/>` +
      `<path d="${arches}" fill="#05070b" stroke="${SIDE}" stroke-width="3"/>` +
      '<path d="M720 800V620A80 80 0 0 1 880 620V800Z" fill="#030407"/>' +
      columns +
      // The marble floor and its reflections.
      '<rect y="800" width="1600" height="400" fill="url(#mu-fl)"/>' +
      `<rect y="796" width="1600" height="8" fill="${SIDE}"/>` +
      `<path d="${floorLines}" stroke="#161d2a" stroke-opacity=".8" stroke-width="1.4"/>` +
      `<ellipse cx="300" cy="884" rx="230" ry="20" fill="${ACCENT}" fill-opacity=".045"/>` +
      // Moonbeams falling on the skeleton, dust in them.
      '<path d="M170 124H236L330 800H214ZM262 124H318L452 800H346Z" fill="url(#mu-mb)"/>' +
      motes +
      whale() +
      // The plinth with its plaque, the skeleton, the vase and the rope.
      '<rect x="-40" y="800" width="460" height="52" fill="#121823" stroke="#212a3a" stroke-width="2"/><rect x="-40" y="798" width="460" height="6" fill="#1f2838"/>' +
      '<rect x="180" y="816" width="70" height="22" fill="#4e4430" stroke="#6e5f3e" stroke-width="1.5"/><path d="M190 823h14M210 823h8M190 830h22M216 830h10" stroke="#2a2418" stroke-width="2"/>' +
      '<circle class="mu-pool" cx="230" cy="620" r="320" fill="url(#mu-pl)"/>' +
      dino() +
      vase(),
    nook:
      '<defs>' +
      `<linearGradient id="mu-bm" gradientUnits="userSpaceOnUse" x1="0" y1="274" x2="0" y2="-250"><stop offset="0" stop-color="${WARM}" stop-opacity=".3"/><stop offset=".55" stop-color="${WARM}" stop-opacity=".1"/><stop offset="1" stop-color="${WARM}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="mu-hs"><stop offset="0" stop-color="${WARM}" stop-opacity=".18"/><stop offset="1" stop-color="${WARM}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="mu-cg"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".28"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      displayCase() +
      statue() +
      '<circle class="mu-pool" cx="360" cy="-70" r="170" fill="url(#mu-pl)"/>' +
      pv(404, 274, 'mu-beam', '<path d="M398 274L410 274L436 -250L300 -250Z" fill="url(#mu-bm)"/><circle cx="360" cy="-110" r="110" fill="url(#mu-hs)"/>') +
      '<path class="mu-drop" d="M392 -202c3 4 4 7 0 10c-4 -3 -3 -6 0 -10Z" fill="#cfe2ff"/>',
  }
}
