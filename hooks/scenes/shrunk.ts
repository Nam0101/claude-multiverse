import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Shrunk: Claude, ant-sized, codes on a giant human desk at night. A desk lamp burns like a low sun over a towering
// coffee mug, a pencil lies like a fallen log, crumbs sit like boulders, a paperclip stands like an arch and the edge
// of a giant keyboard rises like a cliff of blocks. Claude's desk is a matchbox, its seat a bottle cap on a thread
// spool, its machine a propped-up phone. When a command runs a giant fingertip presses a key and the desk quakes; an
// error drops a splash of coffee beside Claude; done has the friendly ant hoist a crumb while the lamp warms.
const AMBER = '#ffb347'
const WARM = '#ffd9a0'
const ANT = '#1e120b'
const COFFEE = '#3d1f0c'
const RIM = '#2a221b'
const RIM_EDGE = '#5a4a38'

/** A coral starburst, Claude's emblem: `n` rays between two radii. */
function star(cx: number, cy: number, outer: number, inner: number, n: number): string {
  const points: string[] = []

  for (let i = 0; i < n * 2; i += 1) {
    const a = (i * Math.PI) / n - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner

    points.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`)
  }

  return `M${points.join('L')}Z`
}

/** A crumb the size of a boulder: a jagged crust, its lamp-lit face, pores, and a shadow that stays put when it hops. */
function crumb(x: number, y: number, r: number, seed: number, lit: number, hop = 0): string {
  const next = random(seed)
  const outline: string[] = []
  const face: string[] = []

  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2 + next() * 0.3
    const k = 0.78 + next() * 0.3
    const px = Math.cos(a) * r * k * 1.15
    const py = Math.min(Math.sin(a) * r * k * 0.85, r * 0.45)

    outline.push(`${f(x + px)} ${f(y + py)}`)
    face.push(`${f(x + px * 0.62 - r * 0.16)} ${f(y + py * 0.55 - r * 0.26)}`)
  }

  const pores = [0, 1, 2].map(() => `<circle cx="${f(x + (next() - 0.5) * r)}" cy="${f(y + (next() - 0.4) * r * 0.5)}" r="${f(r * 0.07 + next() * r * 0.05)}"/>`).join('')
  const body =
    `<path d="M${outline.join('L')}Z" fill="#3a2212" stroke="#5a3a1e" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M${face.join('L')}Z" fill="#7a4e26" fill-opacity="${lit}"/><g fill="#1e1008" fill-opacity=".8">${pores}</g>`

  return (
    `<ellipse cx="${f(x + r * 0.35)}" cy="${f(y + r * 0.42)}" rx="${f(r * 1.3)}" ry="${f(r * 0.2)}" fill="#050302" fill-opacity=".7"/>` +
    (hop > 0 ? `<g class="ti-hop" style="--h:${hop}px;animation-delay:${f(next() * 0.06)}s">${body}</g>` : body)
  )
}

// The pencil lies from the near left (its eraser end) toward the middle, getting smaller as it recedes.
const PX0 = -10
const PX1 = 470
const TIP = 600

/** A point on the pencil at x: k runs -1 (its top edge) to 1 (its bottom edge). */
function at(x: number, k: number): number {
  const t = (x - PX0) / (PX1 - PX0)

  return 915 - 143 * t + k * (72 - 28 * t)
}

function band(xa: number, xb: number, k1: number, k2: number): string {
  return `M${f(xa)} ${f(at(xa, k1))}L${f(xb)} ${f(at(xb, k1))}L${f(xb)} ${f(at(xb, k2))}L${f(xa)} ${f(at(xa, k2))}Z`
}

function pencil(): string {
  const tipY = at(TIP, 0)
  const mid = at(PX1, 0)
  const ridges = [44, 58, 86, 100].map(x => `M${x} ${f(at(x, -1))}L${x} ${f(at(x, 1))}`).join('')
  const scallop = (k1: number, k2: number, bulge: number, fill: string) =>
    `<path d="M${PX1} ${f(at(PX1, k1))}Q${PX1 + bulge} ${f((at(PX1, k1) + at(PX1, k2)) / 2)} ${PX1} ${f(at(PX1, k2))}Z" fill="${fill}"/>`

  return (
    // Its shadow on the desk, cast away from the lamp.
    `<path d="M-10 ${f(at(-10, 1) + 4)}L${PX1} ${f(at(PX1, 1) + 6)}L${TIP} ${f(tipY + 8)}L${TIP + 30} ${f(tipY + 26)}L${PX1 + 20} ${f(at(PX1, 1) + 34)}L-10 1010Z" fill="#030201" fill-opacity=".55"/>` +
    // The sharpened wood and the lead.
    `<path d="M${PX1} ${f(at(PX1, -1))}L${TIP} ${f(tipY)}L${PX1} ${f(mid)}Z" fill="#7a5a3a"/>` +
    `<path d="M${PX1} ${f(mid)}L${TIP} ${f(tipY)}L${PX1} ${f(at(PX1, 1))}Z" fill="#46301c"/>` +
    `<path d="M562 731.7L${TIP} ${f(tipY)}L562 757.5Z" fill="#26231f"/><path d="M562 733L598 733.6" stroke="#9a948a" stroke-opacity=".45" stroke-width="2"/>` +
    // The painted body in three facets, lit from above, with the paint's scalloped edge.
    `<path d="${band(110, PX1, -1, -0.5)}" fill="#8a6420"/>` +
    `<path d="${band(110, PX1, -0.5, 0.5)}" fill="#67491a"/>` +
    `<path d="${band(110, PX1, 0.5, 1)}" fill="#3a280e"/>` +
    scallop(-1, -0.5, 16, '#8a6420') +
    scallop(-0.5, 0.5, 22, '#67491a') +
    scallop(0.5, 1, 14, '#3a280e') +
    `<path d="M110 ${f(at(110, -1) + 1)}L430 ${f(at(430, -1) + 1)}" stroke="${AMBER}" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M110 ${f(at(110, -0.5))}L${PX1} ${f(at(PX1, -0.5))}M110 ${f(at(110, 0.5))}L${PX1} ${f(at(PX1, 0.5))}" stroke="#2a1c08" stroke-opacity=".6" stroke-width="1.6"/>` +
    // The metal ferrule and the eraser at the near end.
    `<path d="${band(30, 110, -1, 1)}" fill="#4e4a44"/><path d="${band(30, 110, -0.85, -0.45)}" fill="#9a948a" fill-opacity=".4"/>` +
    `<path d="${ridges}" stroke="#24211e" stroke-width="3"/>` +
    `<path d="${band(-10, 30, -1, 1)}" fill="#6a3430"/><path d="${band(-10, 30, -1, -0.5)}" fill="#8a4a44" fill-opacity=".7"/>`
  )
}

/** The friendly ant, side on and facing right, its feet at y 0. Walking swings its legs; cheering raises the front pair. */
function ant(walk: boolean, cheer: boolean): string {
  const leg = (hx: number, hy: number, d: string, cls: string, far: boolean) =>
    `<g transform="translate(${hx} ${hy})"><path${walk ? ` class="${cls}"` : ''} d="${d}" fill="none" stroke="${far ? '#0e0805' : ANT}" ` +
    `stroke-width="${far ? 4 : 5}" stroke-linecap="round" stroke-linejoin="round"/></g>`
  const legs = (far: boolean): string => {
    const o = far ? 7 : 0
    const y = far ? -30 : -28

    return (
      (cheer ? '' : leg(14 + o, y, 'M0 0L18 -10L30 28', far ? 'ti-lb' : 'ti-la', far)) +
      leg(4 + o, y, 'M0 0L6 -12L4 28', far ? 'ti-la' : 'ti-lb', far) +
      leg(-6 + o, y, 'M0 0L-16 -10L-30 28', far ? 'ti-lb' : 'ti-la', far)
    )
  }
  const eye = cheer
    ? '<circle cx="44" cy="-55" r="5.5" fill="#f2e4cc"/><circle cx="45" cy="-58" r="2.6" fill="#0a0604"/>'
    : '<circle cx="45" cy="-52" r="5.5" fill="#f2e4cc"/><circle cx="47" cy="-52" r="2.6" fill="#0a0604"/>'

  return (
    legs(true) +
    `<g${walk ? ' class="ti-abob"' : ''}>` +
    `<g fill="${ANT}" stroke="${AMBER}" stroke-opacity=".34" stroke-width="2">` +
    '<ellipse cx="-50" cy="-38" rx="32" ry="23" transform="rotate(-14 -50 -38)"/><circle cx="-16" cy="-33" r="6"/>' +
    '<ellipse cx="4" cy="-37" rx="20" ry="11"/><circle cx="38" cy="-48" r="16"/></g>' +
    '<ellipse cx="-56" cy="-50" rx="14" ry="6" fill="#6a4424" fill-opacity=".55" transform="rotate(-14 -56 -50)"/>' +
    eye +
    '<path d="M42 -38q6 4 11 -2" fill="none" stroke="#0a0604" stroke-width="2" stroke-linecap="round"/>' +
    `<path d="M32 -62L38 -88L60 -94M42 -62L52 -84L72 -84" fill="none" stroke="${ANT}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    '</g>' +
    legs(false)
  )
}

/** One giant keycap: a front face, a slanted top, a lamp-lit edge, an invented legend and a glint for typing. */
function keycap(cx: number, base: number, w: number, h: number, face: string, top: string, mark: string, i: number): string {
  const lip = base - h * 0.7

  return (
    `<path d="M${f(cx - w / 2)} ${base}L${f(cx - w * 0.42)} ${f(lip)}H${f(cx + w * 0.42)}L${f(cx + w / 2)} ${base}Z" fill="${face}" stroke="${face}" stroke-width="8" stroke-linejoin="round"/>` +
    `<path d="M${f(cx - w * 0.42)} ${f(lip)}L${f(cx - w * 0.36)} ${base - h}H${f(cx + w * 0.36)}L${f(cx + w * 0.42)} ${f(lip)}Z" fill="${top}" stroke="${top}" stroke-width="8" stroke-linejoin="round"/>` +
    `<path d="M${f(cx - w / 2 - 3)} ${base}L${f(cx - w * 0.42 - 3)} ${f(lip)}L${f(cx - w * 0.36 - 3)} ${base - h}" fill="none" stroke="${AMBER}" stroke-opacity=".3" stroke-width="2"/>` +
    `<path d="M${f(cx - w * 0.42)} ${f(lip)}H${f(cx + w * 0.42)}" stroke="#6a4e34" stroke-opacity=".7" stroke-width="2"/>` +
    `<path transform="translate(${f(cx - w * 0.2)} ${f(base - h * 0.46)}) scale(${f(w / 150)})" d="${mark}" fill="none" stroke="#a07a52" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
    `<path class="ti-kg" style="--i:${i}" d="M${f(cx - w * 0.4)} ${f(lip)}H${f(cx + w * 0.4)}" stroke="${WARM}" stroke-width="3" stroke-linecap="round"/>`
  )
}

// Invented legends, none of them a letter or a keyboard character: a hollow diamond, a dot in a ring, three dots, two
// stepped bars.
const MARKS = ['M0 -6l6 6l-6 6l-6 -6Z', 'M-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0M0 0v.1', 'M-8 0v.1M0 0v.1M8 0v.1', 'M-9 -3h8M1 3h8']

function keyboard(): string {
  const rows = [
    { base: 286, w: 124, h: 92, xs: [1250, 1394, 1538, 1682], face: '#18110b', top: '#2a1f15' },
    { base: 362, w: 150, h: 110, xs: [1186, 1358, 1530, 1702], face: '#20170f', top: '#35271a' },
    { base: 448, w: 178, h: 130, xs: [1172, 1372, 1572], face: '#291d12', top: '#3e2e1e' },
  ]
  let i = 0
  const keys = rows
    .map((row, r) =>
      row.xs
        .map(cx => {
          const cap = keycap(cx, row.base, row.w, row.h, row.face, row.top, MARKS[(i + r) % 4]!, i)

          i += 1

          return r === 2 && cx === 1372 ? `<g class="ti-key">${cap}</g>` : cap
        })
        .join(''),
    )
    .join('')

  return (
    '<path d="M1080 446L1150 196H1700V446Z" fill="#0b0806"/>' +
    keys +
    // The fingertip, from the giant's hand above: the back of the finger, its nail toward us.
    '<ellipse class="ti-fsh" cx="1372" cy="336" rx="96" ry="13" fill="#000"/>' +
    '<g class="ti-fg"><g transform="rotate(9 1372 318) translate(1372 318) scale(1.5) translate(-1372 -318)">' +
    '<path d="M1306 -560V256C1306 296 1336 322 1372 322C1408 322 1438 296 1438 256V-560Z" fill="url(#ti-skin)"/>' +
    '<path d="M1318 20Q1372 36 1426 20M1322 40Q1372 54 1422 40" fill="none" stroke="#2e1a12" stroke-opacity=".7" stroke-width="3"/>' +
    '<path d="M1336 192C1336 172 1408 172 1408 192V264C1408 292 1336 292 1336 264Z" fill="#c9957a" fill-opacity=".5" stroke="#e3b9a0" stroke-opacity=".35" stroke-width="2"/>' +
    '<path d="M1340 272C1354 288 1390 288 1404 272" fill="none" stroke="#f0d8c4" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M1312 -560V250" stroke="#d8a07a" stroke-opacity=".28" stroke-width="5"/></g></g>' +
    // The case's front edge: the cliff.
    '<path d="M1098 436H1700V652H1098Q1080 652 1080 634V454Q1080 436 1098 436Z" fill="url(#ti-kb)"/>' +
    '<path d="M1096 438H1700" stroke="#5a412a" stroke-opacity=".75" stroke-width="2.5"/>' +
    '<path d="M1081 452V632" stroke="#ffb347" stroke-opacity=".12" stroke-width="3"/>' +
    '<g fill="#080504">' +
    [1150, 1340, 1530].map(x => `<rect x="${x}" y="470" width="90" height="6" rx="3"/>`).join('') +
    '</g>' +
    '<rect x="1070" y="650" width="640" height="16" rx="8" fill="#030201" fill-opacity=".7"/>' +
    [1130, 1250, 1400, 1520].map((x, k) => `<ellipse class="ti-puf" style="animation-delay:${f(k * 0.03)}s" cx="${x}" cy="652" rx="44" ry="16" fill="#5a4a3a"/>`).join('')
  )
}

/** The giant mug: its body, handle, coffee with the lamp's reflection, ripples, a sticky note and a cobweb in the handle. */
function mug(): string {
  const strands = [[60, 382], [46, 430], [42, 480], [48, 540], [70, 586]] as const
  const hub = [104, 364] as const
  const radials = strands.map(([x, y]) => `M${hub[0]} ${hub[1]}L${x} ${y}`).join('')
  const spiral = [0.35, 0.6, 0.85]
    .map(k => 'M' + strands.map(([x, y]) => `${f(hub[0] + (x - hub[0]) * k)} ${f(hub[1] + (y - hub[1]) * k)}`).join('L'))
    .join('')
  const scribbles = [0, 1, 2, 3]
    .map(i => `<path class="ti-ln" style="--i:${i}" pathLength="1" d="M286 ${462 + i * 16}q8 -6 16 0t16 0t16 0${i === 3 ? '' : 't16 0'}"/>`)
    .join('')

  return (
    // The handle and the web strung inside it.
    '<path d="M108 320C30 320 2 370 2 470C2 580 34 630 108 630V592C64 592 42 556 42 470C42 394 62 360 108 360Z" fill="#163032" stroke="#2c5050" stroke-width="2"/>' +
    `<g class="ti-web" fill="none" stroke="#e8dcc8" stroke-width="1.4"><path d="${radials}"/><path d="${spiral}"/>` +
    `<path class="ti-wg" pathLength="1" d="${radials}" stroke="${WARM}" stroke-width="2"/><path class="ti-wg" pathLength="1" d="${spiral}" stroke="${WARM}" stroke-width="2"/></g>` +
    // The body, a glaze stripe, a highlight.
    '<path d="M108 250V840H392V250Z" fill="url(#ti-mug)"/>' +
    '<path d="M108 600Q250 630 392 600V626Q250 656 108 626Z" fill="#3c6a68" fill-opacity=".55"/>' +
    '<rect x="322" y="276" width="22" height="520" fill="#e8f4f0" fill-opacity=".06"/>' +
    // The sticky note on its side, with invented scribbles.
    '<g transform="rotate(-5 320 480)"><rect x="272" y="430" width="100" height="100" fill="#c8913a" fill-opacity=".6"/>' +
    '<rect x="272" y="430" width="100" height="14" fill="#a8742a" fill-opacity=".6"/>' +
    '<rect class="ti-nlit" x="272" y="430" width="100" height="100" fill="#ffd9a0" fill-opacity=".28"/>' +
    `<g fill="none" stroke="#3a2410" stroke-opacity=".8" stroke-width="3" stroke-linecap="round">${scribbles}</g>` +
    '<path d="M352 530L372 510V530Z" fill="#e8b860" fill-opacity=".55"/></g>' +
    // The rim and the coffee, the lamp shining back off it, the ripples a key press sends across it.
    '<ellipse cx="250" cy="250" rx="142" ry="28" fill="#2c5050"/>' +
    '<ellipse cx="250" cy="252" rx="128" ry="22" fill="#120804"/>' +
    '<g clip-path="url(#ti-cf)">' +
    [0, 1, 2].map(k => `<ellipse class="ti-rip" style="animation-delay:${f(k * 0.16)}s" cx="250" cy="252" rx="118" ry="20" fill="none" stroke="${WARM}" stroke-opacity=".7" stroke-width="2.4"/>`).join('') +
    '</g>' +
    `<ellipse class="ti-refl" cx="262" cy="248" rx="34" ry="6" fill="${WARM}" fill-opacity=".5"/>` +
    '<path d="M112 248Q250 214 388 248" fill="none" stroke="#5a8a86" stroke-opacity=".6" stroke-width="3"/>'
  )
}

/** The desk lamp's head, burning like a low sun: the shade, its lit inside, the bulb. In its own frame, axis down. */
function lampHead(): string {
  return (
    '<g transform="translate(250 120) rotate(-28)">' +
    '<path d="M-46 -112H46L134 -2H-134Z" fill="#1a130e" stroke="#3a2c20" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M-30 -108L-96 -10" stroke="#6a5038" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>' +
    '<rect x="-24" y="-130" width="48" height="20" rx="6" fill="#120d09" stroke="#3a2c20" stroke-width="2"/>' +
    '<ellipse cx="0" cy="-2" rx="134" ry="34" fill="url(#ti-shade)"/>' +
    '<g class="ti-bulb"><circle cx="0" cy="-12" r="40" fill="#ffe8c4" fill-opacity=".55"/><circle cx="0" cy="-12" r="26" fill="#fff4de"/></g>' +
    '</g>'
  )
}

/** Claude's phone, propped on a wire stand, and the little keyboard it types on. */
function device(light: string, _activity: Activity): string {
  const lines = [30, 22, 36, 18, 28, 34, 24]
    .map((w, i) => `<rect x="${340 + (i % 3 === 2 ? 6 : 0)}" y="${222 + i * 12}" width="${w}" height="4" rx="1"/>`)
    .join('')
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${244 + i * 13}" y="324" width="8" height="3"/>`).join('')

  return (
    '<path d="M382 252L410 322" stroke="#8a8278" stroke-width="2.6" stroke-linecap="round"/>' +
    '<g transform="rotate(5 361 322)">' +
    '<rect x="332" y="204" width="58" height="118" rx="10" fill="#16110d" stroke="#4a3c30" stroke-width="2"/>' +
    `<rect x="336" y="214" width="50" height="98" rx="5" fill="${light}" fill-opacity=".22"/>` +
    `<g fill="${light}" fill-opacity=".85">${lines}</g>` +
    '<circle cx="361" cy="209" r="1.8" fill="#6a5a4c"/><path d="M354 317H368" stroke="#6a5a4c" stroke-width="2" stroke-linecap="round"/></g>' +
    '<rect x="236" y="322" width="92" height="8" rx="2" fill="#241b14"/>' +
    `<g fill="${light}" fill-opacity=".5">${keys}</g>`
  )
}

export function shrunkWorld(): World {
  const next = random(4242)

  // The desk's wood grain, running away toward the far edge.
  const grain = Array.from({ length: 18 }, (_, i) => {
    const xb = -900 + i * 200 + (next() - 0.5) * 60
    const xv = 800 + (xb - 800) * 0.08
    const bend = (next() - 0.5) * 40

    return `M${f(xb)} 1000Q${f((xb + xv) / 2 + bend)} 760 ${f(xv)} 596`
  }).join('')

  // Dust motes in the lamp's light.
  const motes = Array.from({ length: 26 }, () => {
    const y = 190 + next() * 440
    const left = 138 - (98 * (y - 178)) / 662 + 24
    const right = Math.min(362 + (198 * (y - 62)) / 698 - 24, 440)
    const x = left + next() * (right - left)
    const style = `--dx:${f((next() - 0.5) * 60)}px;--dy:${f(-20 - next() * 50)}px;--s:${f(5 + next() * 5)}s;animation-delay:${f(-next() * 8)}s`

    return `<circle class="ti-mote" style="${style}" cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + next() * 2)}"/>`
  }).join('')
  const halos = Array.from({ length: 8 }, () => {
    const y = 220 + next() * 360
    const x = 150 + next() * 250
    const style = `--dx:${f((next() - 0.5) * 50)}px;--dy:${f(-30 - next() * 40)}px;--s:${f(4 + next() * 3)}s;animation-delay:${f(-next() * 6)}s`

    return `<circle class="ti-mote" style="${style}" cx="${f(x)}" cy="${f(y)}" r="${f(9 + next() * 8)}" fill="url(#ti-mg)"/>`
  }).join('')

  const steam = [196, 236, 276, 316]
    .map(
      (x, i) =>
        `<path class="ti-st" style="--sx:${f((next() - 0.5) * 40)}px;animation-delay:${f(-i * 1.6)}s" d="M${x} 244c-18 -30 18 -50 0 -80c-16 -26 14 -44 2 -70" fill="none" stroke="#f2e6d2" stroke-opacity=".3" stroke-width="${12 - i}" stroke-linecap="round"/>`,
    )
    .join('')

  const books =
    '<g stroke="#24170e" stroke-width="2"><rect x="590" y="544" width="350" height="46" rx="4" fill="#150d08"/>' +
    '<rect x="616" y="506" width="300" height="40" rx="4" fill="#120b07"/><rect x="600" y="474" width="292" height="34" rx="4" fill="#160e09"/></g>' +
    '<path d="M612 552V582M920 552V582M638 514V538M896 514V538M622 480V502M872 480V502" stroke="#2c1d12" stroke-width="3"/>' +
    `<path d="M602 475H890" stroke="${AMBER}" stroke-opacity=".08" stroke-width="2"/>`

  const clip = 'M30 -80V-190A22 22 0 0 1 74 -190V-40A37 37 0 0 1 0 -40V-200A46 46 0 0 1 92 -200V-60'
  const paperclip =
    `<g transform="translate(1000 652) rotate(-10) scale(1.2)"><path d="${clip}" fill="none" stroke="#2e2a26" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="${clip}" fill="none" stroke="#a89880" stroke-opacity=".22" stroke-width="2" stroke-linecap="round" transform="translate(-2 -2)"/>` +
    `<path d="M0 -200A46 46 0 0 1 92 -200" fill="none" stroke="${AMBER}" stroke-opacity=".2" stroke-width="2.5" transform="translate(-2 -3)"/></g>`

  const sparkles = [
    [-14, -150, 0.9],
    [94, -142, 1.1],
    [70, -184, 1.35],
    [8, -190, 1.6],
    [108, -100, 1.9],
  ]
    .map(([x, y, d]) => `<g transform="translate(${x} ${y})"><path class="ti-spk" style="--d:${d}s" d="${star(0, 0, 12, 3, 4)}" fill="#fff0c8"/></g>`)
    .join('')

  // The ant walks the pencil's top edge, smaller as it goes farther.
  const walkFrom = [-130, at(-130, -1) + 3] as const
  const walkTo = [440, at(440, -1) + 3] as const
  const champAt = [220, at(220, -1) + 3] as const

  // The splash: where the drop lands beside Claude, in the desk's own box.
  const crownSpikes = 7
  let crownPath = 'M-46 0'
  const droplets: string[] = []

  for (let i = 0; i < crownSpikes; i += 1) {
    const x0 = -46 + (i * 92) / crownSpikes
    const x1 = x0 + 92 / crownSpikes
    const xm = (x0 + x1) / 2
    const h = 34 + ((i * 3) % 5) * 5

    crownPath += `Q${f(x0 + 2)} ${f(-h * 0.5)} ${f(xm)} ${f(-h)}Q${f(x1 - 2)} ${f(-h * 0.5)} ${f(x1)} ${i === crownSpikes - 1 ? 0 : -8}`
    droplets.push(`<circle class="ti-dl" style="--dx:${f((xm / 46) * (xm < 0 ? 10 : 26))}px" cx="${f(xm)}" cy="${f(-h - 8)}" r="${f(3.5 + (i % 3))}" fill="#5a2e12" stroke="${WARM}" stroke-opacity=".6" stroke-width="1"/>`)
  }

  crownPath += 'Z'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#060403',
      furniture: '#2a1c12',
      metal: '#2b2622',
      paper: '#eadfc8',
      light: { idle: '#b07a3a', work: AMBER, bright: '#ffe2b0' },
      headTop: 196,
      glowAt: [361, 262],
      device,
      wear: {
        front:
          // The shrink-suit helmet: a glass dome over the crown and a lit ring at the brow, both above the eyes.
          '<path d="M66 242C66 204 104 186 150 186C196 186 234 204 234 242Z" fill="#ffe2b0" fill-opacity=".07" stroke="#ffd9a0" stroke-opacity=".5" stroke-width="2.5"/>' +
          '<path d="M90 224C96 206 116 196 138 194" fill="none" stroke="#fff3dc" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="60" y="233" width="180" height="15" rx="7.5" fill="${RIM}" stroke="${RIM_EDGE}" stroke-width="2"/>` +
          `<g fill="${AMBER}" fill-opacity=".85">${[86, 108, 130, 152, 174, 196].map(x => `<rect x="${x}" y="238" width="12" height="4" rx="2"/>`).join('')}</g>` +
          [62, 238]
            .map(x => `<circle cx="${x}" cy="244" r="11" fill="${RIM}" stroke="${RIM_EDGE}" stroke-width="2"/><circle cx="${x}" cy="244" r="4.5" fill="${AMBER}"/>`)
            .join('') +
          // The suit's belt, its round shrink button wearing Claude's starburst.
          `<rect x="70" y="321" width="160" height="8" fill="${RIM}"/><circle cx="118" cy="325" r="10" fill="${RIM}" stroke="${RIM_EDGE}" stroke-width="2"/>` +
          `<path d="${star(118, 325, 7.5, 2.4, 8)}" fill="#d97757"/>`,
      },
      seatArt:
        // A bottle cap, crimped skirt and all, on a spool of thread.
        '<rect x="112" y="368" width="78" height="10" rx="3" fill="#6a4a2c" stroke="#8a6440" stroke-width="1.5"/>' +
        '<rect x="122" y="378" width="58" height="66" fill="#2e6660"/>' +
        `<path d="${Array.from({ length: 12 }, (_, i) => `M122 ${382 + i * 5.2}H180`).join('')}" stroke="#4a8a82" stroke-opacity=".55" stroke-width="1.4"/>` +
        '<path d="M126 386Q150 392 176 384" fill="none" stroke="#7ab8ae" stroke-opacity=".5" stroke-width="1.4"/>' +
        '<rect x="110" y="444" width="82" height="12" rx="3" fill="#6a4a2c" stroke="#8a6440" stroke-width="1.5"/>' +
        `<path d="M106 352V362${Array.from({ length: 11 }, () => 'l4 5l4 -5').join('')}V352Z" fill="#5d5a55" stroke="#8a857c" stroke-width="1.4" stroke-linejoin="round"/>` +
        '<ellipse cx="151" cy="352" rx="45" ry="6.5" fill="#77736c" stroke="#9a958c" stroke-width="1.5"/>' +
        '<ellipse cx="151" cy="352" rx="34" ry="4" fill="none" stroke="#4a4742" stroke-width="1.5"/>',
      tableArt:
        // A matchbox: its sleeve, the label with Claude's starburst, the striker at its end, a match beside it.
        '<rect x="166" y="330" width="304" height="126" rx="3" fill="#5a2216" stroke="#7a3424" stroke-width="2"/>' +
        '<path d="M168 332H468" stroke="#a0503a" stroke-opacity=".6" stroke-width="2"/>' +
        '<rect x="236" y="346" width="172" height="94" rx="4" fill="#c89a58" fill-opacity=".85"/>' +
        '<rect x="243" y="353" width="158" height="80" rx="3" fill="none" stroke="#5a2216" stroke-width="2"/>' +
        `<circle cx="322" cy="386" r="27" fill="#5a2216"/><path d="${star(322, 386, 22, 7, 8)}" fill="#d97757"/>` +
        '<path d="M262 418H382M282 426H362" stroke="#5a2216" stroke-width="2.4" stroke-linecap="round"/>' +
        '<rect x="424" y="340" width="34" height="108" rx="2" fill="#2a140c"/>' +
        `<g fill="#6a4a36" fill-opacity=".7">${Array.from({ length: 14 }, (_, i) => `<circle cx="${430 + (i % 3) * 11}" cy="${348 + Math.floor(i / 3) * 21 + (i % 2) * 6}" r="1.6"/>`).join('')}</g>` +
        '<rect x="186" y="448" width="250" height="7" rx="2" fill="#b08a5a" stroke="#6a4e30" stroke-width="1"/>' +
        '<ellipse cx="444" cy="451.5" rx="11" ry="7" fill="#9a2e1e" stroke="#c04a30" stroke-width="1.2"/>',
    },
    style:
      // Ambient: steam rises, motes drift in the lamp, the lamp hums, the ant walks the pencil now and then.
      '.ti-st{opacity:0;animation:ti-steam 6.4s ease-in-out infinite}' +
      '@keyframes ti-steam{0%{opacity:0;transform:translate(0,24px)}30%{opacity:1}100%{opacity:0;transform:translate(var(--sx),-110px)}}' +
      '.ti-mote{animation:ti-drift var(--s) ease-in-out infinite alternate}@keyframes ti-drift{to{transform:translate(var(--dx),var(--dy))}}' +
      '.ti-motes{opacity:.3}.ti-halos{opacity:0}' +
      '.ti-lg{animation:ti-hum 5s ease-in-out infinite alternate}@keyframes ti-hum{from{opacity:.84}to{opacity:1}}' +
      '.ti-cone{opacity:.7}' +
      '.ti-refl{animation:ti-hum 3s ease-in-out infinite alternate}' +
      '.ti-walk{opacity:0;animation:ti-walk 26s linear -8s infinite}' +
      `@keyframes ti-walk{0%{opacity:0;transform:translate(0,0) scale(1.05)}3%,67%{opacity:1}70%,100%{opacity:0;transform:translate(${f(walkTo[0] - walkFrom[0])}px,${f(walkTo[1] - walkFrom[1])}px) scale(.8)}}` +
      '.ti-la{animation:ti-leg .42s ease-in-out infinite alternate}.ti-lb{animation:ti-leg .42s ease-in-out -.42s infinite alternate}' +
      '@keyframes ti-leg{from{transform:rotate(-13deg)}to{transform:rotate(13deg)}}' +
      '.ti-abob{animation:ti-abob .42s ease-in-out infinite alternate}@keyframes ti-abob{to{transform:translateY(-2px)}}' +
      '@keyframes ti-in{to{opacity:1}}' +
      // Thinking: the motes gather and glow in the lamp light.
      '.st-thinking .ti-motes{opacity:1}.st-thinking .ti-halos{animation:ti-in 1.2s ease-out both}.st-thinking .ti-cone{opacity:1}' +
      '.st-thinking .ti-mote{animation-duration:3.2s}' +
      // Responding: a glint runs along the giant keycaps.
      '.ti-kg{opacity:0}.st-responding .ti-kg{animation:ti-kg 2s ease-in-out infinite;animation-delay:calc(var(--i) * .18s)}' +
      '@keyframes ti-kg{0%,100%{opacity:0}30%{opacity:.85}}' +
      // Tool: the lamp swings its beam across the desk.
      '.ti-lsw,.ti-lq{transform-origin:198px 21px}' +
      '.st-tool .ti-lsw{animation:ti-sweep 2.4s ease-in-out infinite alternate}@keyframes ti-sweep{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      // Read: the scribbles on the sticky note write themselves out under a brighter light.
      '.ti-ln{stroke-dasharray:1;stroke-dashoffset:0;opacity:.55}' +
      '.st-read .ti-ln{opacity:1;animation:ti-write .8s ease-out both;animation-delay:calc(.2s + var(--i) * .4s)}' +
      '@keyframes ti-write{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.ti-nlit{opacity:0}.st-read .ti-nlit{animation:ti-in 1s ease-out both}' +
      // Web: the cobweb in the handle shines and its spider lets itself down.
      '.ti-web{opacity:.2}.st-web .ti-web{opacity:.8}' +
      '.ti-wg{stroke-dasharray:.12 .88;opacity:0}.st-web .ti-wg{opacity:1;animation:ti-wg 1.6s linear infinite}' +
      '@keyframes ti-wg{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.ti-spd{transform:translateY(-560px)}.st-web .ti-spd{animation:ti-spd 1.8s cubic-bezier(.3,.7,.4,1) both}' +
      '@keyframes ti-spd{from{transform:translateY(-560px)}to{transform:translateY(0)}}' +
      '.ti-swing{animation:ti-swing 2.2s ease-in-out infinite alternate}@keyframes ti-swing{to{transform:translateY(-10px)}}' +
      // Run: a giant fingertip comes down and presses a key; the desk quakes, the coffee ripples, the crumbs hop.
      '.ti-fg{transform:translateY(-760px)}.st-run .ti-fg{animation:ti-fg 3.6s infinite}' +
      '@keyframes ti-fg{0%{transform:translateY(-760px);animation-timing-function:ease-out}12%{transform:translateY(-280px);animation-timing-function:ease-in-out}' +
      '30%{transform:translateY(-16px);animation-timing-function:ease-in}34%{transform:translateY(14px)}60%{transform:translateY(14px);animation-timing-function:ease-in}100%{transform:translateY(-760px)}}' +
      '.st-run .ti-key{animation:ti-key 3.6s infinite}@keyframes ti-key{0%,33%{transform:translateY(0)}35%,60%{transform:translateY(14px)}66%,100%{transform:translateY(0)}}' +
      '.ti-fsh{opacity:0}.st-run .ti-fsh{animation:ti-fsh 3.6s infinite}@keyframes ti-fsh{0%,4%{opacity:0}30%,60%{opacity:.6}78%,100%{opacity:0}}' +
      '.st-run .ti-qk{animation:ti-qk 3.6s linear infinite}' +
      '@keyframes ti-qk{0%,34%{transform:translate(0,0)}36%{transform:translate(-7px,3px)}38%{transform:translate(7px,-3px)}40%{transform:translate(-5px,2px)}42%{transform:translate(4px,-2px)}44%{transform:translate(-2px,1px)}47%,100%{transform:translate(0,0)}}' +
      '.st-run .ti-hop{animation:ti-hop 3.6s ease-out infinite}' +
      '@keyframes ti-hop{0%,34%{transform:translateY(0)}39%{transform:translateY(calc(var(--h) * -1))}44%{transform:translateY(0)}47%{transform:translateY(calc(var(--h) * -.3))}50%,100%{transform:translateY(0)}}' +
      '.ti-rip{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .ti-rip{animation:ti-rip 3.6s ease-out infinite}' +
      '@keyframes ti-rip{0%,34%{opacity:0;transform:scale(.15)}37%{opacity:.9}78%,100%{opacity:0;transform:scale(1.15)}}' +
      '.ti-puf{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-run .ti-puf{animation:ti-puf 3.6s ease-out infinite}' +
      '@keyframes ti-puf{0%,34%{opacity:0;transform:scale(.3)}38%{opacity:.5}74%,100%{opacity:0;transform:scale(1.8,1.3)}}' +
      '.st-run .ti-lq{animation:ti-lq 3.6s ease-out infinite}' +
      '@keyframes ti-lq{0%,34%{transform:rotate(0)}37%{transform:rotate(2.4deg)}41%{transform:rotate(-1.8deg)}45%{transform:rotate(1deg)}49%,100%{transform:rotate(0)}}' +
      // Error: a drop of coffee falls beside Claude and splashes up a crown.
      '.ti-drop{opacity:0}.st-error .ti-drop{animation:ti-drop 3.6s infinite}' +
      '@keyframes ti-drop{0%{opacity:1;transform:translateY(-420px);animation-timing-function:cubic-bezier(.55,0,1,.6)}15%{opacity:1;transform:translateY(0)}16%,100%{opacity:0;transform:translateY(0)}}' +
      '.ti-crown,.ti-dl,.ti-pud,.ti-ring{opacity:0}' +
      '.ti-crown{transform-box:fill-box;transform-origin:50% 100%}.st-error .ti-crown{animation:ti-crown 3.6s ease-out infinite}' +
      '@keyframes ti-crown{0%,15%{opacity:0;transform:scale(.5,.05)}17%{opacity:1;transform:scale(.7,.5)}27%{transform:scale(1,1)}45%{opacity:.8;transform:scale(1.15,.55)}62%,100%{opacity:0;transform:scale(1.3,.1)}}' +
      '.st-error .ti-dl{animation:ti-dl 3.6s infinite}' +
      '@keyframes ti-dl{0%,15%{opacity:0;transform:translate(0,0)}17%{opacity:1}30%{transform:translate(var(--dx),-64px);animation-timing-function:ease-in}' +
      '48%{opacity:1;transform:translate(calc(var(--dx) * 1.7),14px)}52%,100%{opacity:0;transform:translate(calc(var(--dx) * 1.7),14px)}}' +
      '.ti-pud,.ti-ring{transform-box:fill-box;transform-origin:center}' +
      '.st-error .ti-pud{animation:ti-pud 3.6s ease-out infinite}@keyframes ti-pud{0%,15%{opacity:0;transform:scale(.2)}20%{opacity:.95;transform:scale(.7)}45%,100%{opacity:.95;transform:scale(1)}}' +
      '.st-error .ti-ring{animation:ti-ring 3.6s ease-out infinite}@keyframes ti-ring{0%,15%{opacity:0;transform:scale(.4)}18%{opacity:.8}50%,100%{opacity:0;transform:scale(1.4)}}' +
      // Done: the ant hoists a crumb overhead and the lamp warms.
      '.st-done .ti-walk{display:none}' +
      '.ti-champ{opacity:0}.st-done .ti-champ{animation:ti-in .4s ease-out both}' +
      '.st-done .ti-lift{animation:ti-lift 2.8s ease-out .3s both}' +
      '@keyframes ti-lift{0%{transform:translateY(34px)}22%{transform:translateY(-8px)}32%{transform:translateY(0)}48%{transform:translateY(-14px)}58%{transform:translateY(0)}74%{transform:translateY(-14px)}84%,100%{transform:translateY(0)}}' +
      '.st-done .ti-cheer{animation:ti-cheer .62s ease-in-out 1s 3}@keyframes ti-cheer{50%{transform:translateY(-12px)}}' +
      '.ti-spk{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .ti-spk{animation:ti-spk 1.3s ease-out both;animation-delay:var(--d)}' +
      '@keyframes ti-spk{0%{opacity:0;transform:scale(.2)}30%{opacity:.95;transform:scale(1.15)}100%{opacity:0;transform:scale(.6) rotate(45deg)}}' +
      '.ti-warm{opacity:0}.st-done .ti-warm{animation:ti-in 1.8s ease-out .3s both}' +
      '.ti-bulb{transform-box:fill-box;transform-origin:center}.st-done .ti-bulb{animation:ti-bulb 1.8s ease-out .3s both}@keyframes ti-bulb{to{transform:scale(1.2)}}' +
      // Small moments: asleep, the lamp dims and the ant stays home.
      '.st-sleeping .ti-lg{animation:none;opacity:.5}.st-sleeping .ti-walk{display:none}',
    scenery:
      '<defs>' +
      '<linearGradient id="ti-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060403"/><stop offset=".59" stop-color="#110a06"/><stop offset=".6" stop-color="#140d08"/><stop offset="1" stop-color="#22160c"/></linearGradient>' +
      '<radialGradient id="ti-lgr" cx="240" cy="104" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe0b0" stop-opacity=".42"/><stop offset=".18" stop-color="#ffb347" stop-opacity=".2"/><stop offset=".5" stop-color="#ff9a30" stop-opacity=".06"/><stop offset="1" stop-color="#ff9a30" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ti-wrm" cx="240" cy="104" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".3"/><stop offset=".35" stop-color="#ffa040" stop-opacity=".12"/><stop offset="1" stop-color="#ff9030" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ti-cn" gradientUnits="userSpaceOnUse" x1="240" y1="104" x2="400" y2="820"><stop offset="0" stop-color="#ffc878" stop-opacity=".2"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ti-pool"><stop offset="0" stop-color="#ffb347" stop-opacity=".2"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ti-shade" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff0d4"/><stop offset=".45" stop-color="#ffc878"/><stop offset="1" stop-color="#c8741e"/></radialGradient>' +
      '<radialGradient id="ti-mg"><stop offset="0" stop-color="#ffe6c0" stop-opacity=".6"/><stop offset="1" stop-color="#ffe6c0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ti-mug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1819"/><stop offset=".55" stop-color="#1d3a3b"/><stop offset=".8" stop-color="#2c5352"/><stop offset="1" stop-color="#172e2e"/></linearGradient>' +
      '<linearGradient id="ti-kb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c130c"/><stop offset="1" stop-color="#0b0705"/></linearGradient>' +
      '<linearGradient id="ti-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6448"/><stop offset=".5" stop-color="#744634"/><stop offset="1" stop-color="#40261c"/></linearGradient>' +
      '<clipPath id="ti-cf"><ellipse cx="250" cy="252" rx="128" ry="22"/></clipPath>' +
      '</defs>' +
      // The dark room and the giant desk running off to its far edge.
      '<rect x="-40" y="-40" width="1680" height="1080" fill="url(#ti-sky)"/>' +
      '<path d="M-40 596H1640" stroke="#3a2716" stroke-opacity=".7" stroke-width="2"/>' +
      `<path d="${grain}" fill="none" stroke="#3a2616" stroke-opacity=".4" stroke-width="2"/>` +
      '<ellipse cx="330" cy="840" rx="420" ry="150" fill="url(#ti-pool)"/>' +
      `<g class="mv-t"><g class="ti-lq"><g class="ti-lsw"><circle class="ti-lg" cx="240" cy="104" r="560" fill="url(#ti-lgr)"/></g></g></g>` +
      '<g class="ti-qk">' +
      books +
      crumb(540, 700, 16, 1, 0.35) +
      crumb(712, 652, 11, 2, 0.3) +
      crumb(868, 630, 8, 3, 0.3) +
      crumb(980, 694, 13, 4, 0.3) +
      paperclip +
      '</g>' +
      // The keyboard cliff at the far right, and the finger that comes down on it.
      `<g class="mv-r"><g class="ti-qk">${keyboard()}${crumb(1110, 676, 22, 5, 0.6, 16)}${crumb(1186, 698, 13, 6, 0.6, 12)}${crumb(1572, 690, 26, 7, 0.55, 14)}</g></g>` +
      // The mug, its steam, the lamp's beam over it, the lamp itself, the motes and the spider: one top-pinned group, so the
      // lamp never dips into the coffee when a wide window shifts it.
      `<g class="mv-t"><g class="ti-qk">${mug()}<g>${steam}</g></g>` +
      `<g class="ti-lq"><g class="ti-lsw">` +
      '<path class="ti-cone" d="M138 178L362 62L560 760L40 840Z" fill="url(#ti-cn)"/>' +
      '<path d="M198 21L150 -120" stroke="#120d09" stroke-width="16" stroke-linecap="round"/><path d="M212 14L168 -120" stroke="#3a2c20" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 4"/>' +
      lampHead() +
      '</g></g>' +
      `<g fill="#ffe2b8"><g class="ti-motes">${motes}</g><g class="ti-halos">${halos}</g></g>` +
      // The spider that comes down on the web beat.
      '<g class="ti-spd"><g class="ti-swing"><path d="M76 -160V410" stroke="#e8dcc8" stroke-opacity=".4" stroke-width="1.2"/>' +
      `<g transform="translate(76 420)" fill="none" stroke="${ANT}" stroke-width="2.4" stroke-linecap="round"><path d="M-6 -2L-18 -10L-22 2M-6 2L-20 4L-22 14M6 -2L18 -10L22 2M6 2L20 4L22 14M-4 6L-12 16M4 6L12 16"/>` +
      `<circle r="8" fill="${ANT}" stroke="${AMBER}" stroke-opacity=".4" stroke-width="1.5"/><circle cy="-11" r="6" fill="${ANT}"/><circle cx="-2.5" cy="2" r="1.6" fill="#f2e4cc" stroke="none"/><circle cx="2.5" cy="2" r="1.6" fill="#f2e4cc" stroke="none"/></g></g></g></g>` +
      // The pencil, the near crumbs, and the ant.
      `<g class="mv-b"><g class="ti-qk">${pencil()}${crumb(60, 800, 26, 8, 0.8, 18)}${crumb(474, 884, 30, 9, 0.7, 20)}` +
      `<g transform="translate(${f(walkFrom[0])} ${f(walkFrom[1])})"><g class="ti-walk">${ant(true, false)}</g></g>` +
      `<g transform="translate(${f(champAt[0])} ${f(champAt[1])}) scale(1.6)"><g class="ti-champ"><g class="ti-cheer">${ant(false, true)}` +
      `<g class="ti-lift"><path d="M14 -28L26 -66L38 -102M20 -30L40 -64L52 -100" fill="none" stroke="${ANT}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="44" cy="-124" r="52" fill="url(#ti-mg)"/>${crumb(44, -122, 26, 10, 1)}</g></g>${sparkles}</g></g></g></g>` +
      // The lamp warms when the work is done.
      '<ellipse class="ti-warm" cx="330" cy="840" rx="470" ry="170" fill="url(#ti-pool)"/>' +
      `<g class="mv-t"><circle class="ti-warm" cx="240" cy="104" r="760" fill="url(#ti-wrm)"/></g>`,
    nook:
      // The matchbox and the spool's shadow, a crumb by the seat, and where the drop of coffee lands.
      '<ellipse cx="290" cy="456" rx="230" ry="9" fill="#030201" fill-opacity=".7"/>' +
      crumb(8, 432, 22, 11, 0.7, 14) +
      '<g transform="translate(135 130) scale(2.24)">' +
      `<ellipse class="ti-pud" rx="56" ry="13" fill="#2e1708" stroke="${AMBER}" stroke-opacity=".45" stroke-width="1.5"/>` +
      `<ellipse class="ti-ring" rx="44" ry="10" fill="none" stroke="${WARM}" stroke-opacity=".6" stroke-width="2"/>` +
      `<path class="ti-crown" d="${crownPath}" fill="#5a2e12" stroke="${WARM}" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>` +
      droplets.join('') +
      `<g class="ti-drop"><path d="M0 -50C8 -34 16 -24 16 -14C16 -4 9 2 0 2C-9 2 -16 -4 -16 -14C-16 -24 -8 -34 0 -50Z" fill="${COFFEE}" stroke="${AMBER}" stroke-opacity=".6" stroke-width="2"/>` +
      `<ellipse cx="-6" cy="-16" rx="3" ry="6" fill="${WARM}" fill-opacity=".6"/></g>` +
      '</g>',
  }
}
