import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Synthwave Highway: Claude rides in the bed of an open pickup, a synth and a retro monitor on a speaker-stack desk
// bolted down behind the cab. The neon grid highway runs to a giant striped sun on the left horizon, wireframe
// mountains and palm silhouettes around it, neon lamp posts whipping past. When a command runs sports cars blast past
// with long light trails and the grid races; an error blows a tyre in sparks and smoke while the grid stutters and
// the sun tears like a worn tape; done lights the sun's stripes and sends a chrome wave across the grid.
const PINK = '#ff6ad5'
const HOT = '#ff3f7e'
const CYAN = '#5ce1ff'
const NIGHT = '#06020c'
const PAINT = '#1b0d30'
const FURN = '#1d0f33'
const METAL = '#2a1a44'
const EDGE = '#3a2456'
const CHROME = '#cdbcf5'

// The vanishing point sits on the horizon under the sun's center.
const VX = 265
const VY = 520
const SUN_R = 195

/** A scale to three decimals, for the zoom keyframes. */
const s3 = (v: number): string => String(Math.round(v * 1000) / 1000)

/** Where a ray from the vanishing point to `xb` at the foot of the picture crosses height `y`. */
const rayX = (xb: number, y: number): number => VX + ((xb - VX) * (y - VY)) / (1000 - VY)

/**
 * One period of travel toward the viewer, scaled about the vanishing point: depth falls linearly from z0 to z1 and
 * the scale is 1/z, sampled where it changes fastest. Things past `fadeAt` fade as they rush by. A `flat` zoom scales
 * only the height, for lines that already span the picture.
 */
function zoomKeys(name: string, z0: number, z1: number, steps: number, fadeAt = Infinity, flat = false): string {
  const frames: string[] = []

  for (let k = 0; k <= steps; k += 1) {
    const z = z0 * Math.pow(z1 / z0, k / steps)
    const t = (z0 - z) / (z0 - z1)
    const s = 1 / z
    const op = k === 0 ? 0 : s > fadeAt ? Math.max(0, 1 - (s - fadeAt) / 0.8) : 1

    frames.push(`${f(t * 100)}%{transform:scale(${flat ? '1,' : ''}${s3(s)});opacity:${s3(op)}}`)
  }

  return `@keyframes ${name}{${frames.join('')}}`
}

/** A car overtaking: it slides out from under the picture and accelerates away to the horizon, then waits. */
function carKeys(): string {
  const z0 = 0.62
  const z1 = 14
  const steps = 14
  const frames: string[] = []

  for (let k = 0; k <= steps; k += 1) {
    const z = z0 * Math.pow(z1 / z0, k / steps)
    const u = Math.pow((z - z0) / (z1 - z0), 1 / 2.2)
    const op = u > 0.85 ? Math.max(0, (1 - u) / 0.15) : 1

    frames.push(`${f(u * 72)}%{transform:scale(${s3(1 / z)});opacity:${s3(op)}}`)
  }

  return `@keyframes sy-car{${frames.join('')}72.1%,100%{transform:scale(.07);opacity:0}}`
}

/** The part of the sun's disc between two heights, as one path. */
function slice(y0: number, y1: number): string {
  const half = (y: number) => Math.sqrt(Math.max(0, SUN_R * SUN_R - (VY - y) ** 2))
  const a = half(y0)
  const b = half(y1)

  return (
    `M${f(VX - a)} ${f(y0)}H${f(VX + a)}A${SUN_R} ${SUN_R} 0 0 1 ${f(VX + b)} ${f(y1)}` +
    `H${f(VX - b)}A${SUN_R} ${SUN_R} 0 0 1 ${f(VX - a)} ${f(y0)}Z`
  )
}

// The sun's gaps, widening toward the horizon: where each starts and how tall it is.
const GAPS: readonly (readonly [number, number])[] = [
  [426, 3],
  [444, 5],
  [462, 7],
  [480, 9],
  [498, 11],
]

function sun(): string {
  const edges = [VY - SUN_R, ...GAPS.flatMap(([y, h]) => [y, y + h]), VY]
  let bands = ''
  let gaps = ''

  for (let i = 0; i < edges.length; i += 2) {
    const o = i % 4 === 0 ? -12 : 10

    bands += `<path class="sy-b" style="--o:${o}px" d="${slice(edges[i]!, edges[i + 1]!)}"/>`
  }

  GAPS.forEach(([y, h], i) => {
    gaps += `<path class="sy-gap" style="animation-delay:${f((GAPS.length - 1 - i) * 0.14)}s" d="${slice(y - 0.5, y + h + 0.5)}"/>`
  })

  return (
    `<g class="sy-halo"><circle cx="${VX}" cy="470" r="470" fill="url(#sy-halo)"/></g>` +
    `<g class="sy-sun" fill="url(#sy-sunf)" fill-opacity=".86">${bands}</g>` +
    `<g fill="#ffd8f0">${gaps}</g>`
  )
}

/** A wireframe range on the horizon: a dark body, contour lines and ridge lines, and its lit outline. */
function range(points: readonly (readonly [number, number])[], wire: string, op: number, fill: string): string {
  const line = (c: number) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${f(y + (VY - y) * c)}`).join('')
  const first = points[0]!
  const last = points[points.length - 1]!
  let mesh = line(0.33) + line(0.66)

  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i]!
    const [nx, ny] = points[i + 1]!

    mesh += `M${x} ${y}V${VY}M${x} ${y}L${f((x + nx) / 2)} ${f((y + ny) / 2 + (VY - (y + ny) / 2) * 0.66)}`
  }

  return (
    `<path d="${line(0)}L${last[0]} ${VY}L${first[0]} ${VY}Z" fill="${fill}"/>` +
    `<path class="sy-wire" d="${mesh}" fill="none" stroke="${wire}" stroke-opacity="${f(op * 0.5)}" stroke-width="1.2"/>` +
    `<path class="sy-wire" d="${line(0)}" fill="none" stroke="${wire}" stroke-opacity="${op}" stroke-width="2.2" stroke-linejoin="round"/>`
  )
}

/** A palm silhouette from its foot to its crown, its fronds backlit by the sun and swaying from the crown. */
function palm(bx: number, by: number, cx: number, cy: number, reach: number, seed: number, trunk: number): string {
  const next = random(seed)
  const mx = bx + (cx - bx) * 0.3 + (cx < bx ? 36 : -36)
  const my = (by + cy) / 2
  const w1 = trunk * 0.4
  const body =
    `M${bx - trunk} ${by}Q${f(mx - (trunk + w1) / 2)} ${f(my)} ${cx - w1} ${cy}L${cx + w1} ${cy}` +
    `Q${f(mx + (trunk + w1) / 2)} ${f(my)} ${bx + trunk} ${by}Z`
  let leaves = ''
  let leaflets = ''

  for (let i = 0; i < 9; i += 1) {
    const a = Math.PI + (i / 8) * Math.PI + (next() - 0.5) * 0.22
    const len = reach * (0.78 + next() * 0.32)
    const side = Math.abs(Math.cos(a))
    const tx = cx + Math.cos(a) * len
    const ty = cy + Math.sin(a) * len * 0.45 + len * (0.28 + 0.3 * side)
    const qx = cx + Math.cos(a) * len * 0.55
    const qy = cy + Math.sin(a) * len * 0.5 - len * 0.12
    const nl = Math.hypot(ty - cy, tx - cx)
    const wx = (-(ty - cy) / nl) * len * 0.08
    const wy = ((tx - cx) / nl) * len * 0.08

    leaves += `M${cx} ${cy}Q${f(qx + wx)} ${f(qy + wy)} ${f(tx)} ${f(ty)}Q${f(qx - wx * 0.4)} ${f(qy - wy * 0.4)} ${cx} ${cy}Z`

    for (let k = 1; k <= 5; k += 1) {
      const t = 0.22 + k * 0.14
      const px = (1 - t) ** 2 * cx + 2 * (1 - t) * t * qx + t * t * tx
      const py = (1 - t) ** 2 * cy + 2 * (1 - t) * t * qy + t * t * ty

      leaflets += `M${f(px)} ${f(py)}l${f(Math.cos(a) * 8)} ${f(10 + len * 0.05)}`
    }
  }

  return (
    `<path d="${body}" fill="${NIGHT}" stroke="${PINK}" stroke-opacity=".16" stroke-width="1.4"/>` +
    `<path d="M${bx} ${by}Q${f(mx)} ${f(my)} ${cx} ${cy}" fill="none" stroke="#24103a" stroke-width="${f(trunk * 1.3)}" stroke-dasharray="2.5 11"/>` +
    `<g class="sy-frond" style="transform-origin:${cx}px ${cy}px;animation-delay:${f(-next() * 4)}s">` +
    `<path d="${leaves}" fill="${NIGHT}"/>` +
    `<path class="sy-rim" d="${leaves}" fill="none" stroke="${PINK}" stroke-opacity=".5" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${leaflets}" fill="none" stroke="${NIGHT}" stroke-width="3.2" stroke-linecap="round"/></g>`
  )
}

/** A sports car seen from behind, drawn full size at the foot of the picture, and its two light trails. */
function car(xc: number, round: boolean, delay: number): string {
  const trail = (x: number) => {
    const xe = VX + (x - VX) * ((2600 - VY) / (944 - VY))

    return `M${x - 7} 944L${x + 7} 944L${f(xe + 34)} 2600L${f(xe - 34)} 2600Z`
  }
  const lights = round
    ? '<g fill="#ff3f7e"><circle cx="-122" cy="-56" r="9"/><circle cx="-98" cy="-56" r="9"/><circle cx="98" cy="-56" r="9"/><circle cx="122" cy="-56" r="9"/></g>' +
      '<rect x="-84" y="-58" width="168" height="4" fill="#ff3f7e" fill-opacity=".5"/>'
    : '<rect x="-138" y="-62" width="276" height="12" rx="2" fill="#ff3f7e"/><rect x="-132" y="-58" width="264" height="3" fill="#ffc6dc"/>'

  return (
    `<g class="sy-car" style="animation-delay:${delay}s">` +
    `<path d="${trail(xc - 132)}${trail(xc + 132)}" fill="url(#sy-trail)"/>` +
    `<g transform="translate(${xc} 1000)">` +
    '<ellipse cx="0" cy="-56" rx="200" ry="44" fill="url(#sy-tlg)"/>' +
    `<path d="M-150 -16V-58Q-148 -72 -128 -76L-92 -80L-62 -112H62L92 -80L128 -76Q148 -72 150 -58V-16Z" fill="#0b0517" stroke="${round ? CYAN : PINK}" stroke-opacity=".4" stroke-width="2" stroke-linejoin="round"/>` +
    '<path d="M-54 -106H54L78 -84H-78Z" fill="#1e1236"/><path d="M-40 -104L-20 -104L-44 -86H-62Z" fill="#fff" fill-opacity=".08"/>' +
    `<rect x="-158" y="-90" width="316" height="7" rx="3" fill="#120a22" stroke="${EDGE}"/>` +
    lights +
    `<rect x="-24" y="-44" width="48" height="13" rx="2" fill="#05020a" stroke="${EDGE}"/>` +
    '<g fill="#05020a"><rect x="-142" y="-18" width="36" height="18" rx="3"/><rect x="106" y="-18" width="36" height="18" rx="3"/></g>' +
    `<rect x="-112" y="-7" width="224" height="4" rx="2" fill="${round ? PINK : CYAN}" fill-opacity=".6"/>` +
    '</g></g>'
  )
}

/** A neon lamp post on the left shoulder, full size near the viewer; it rushes past with the ground. */
function post(k: number): string {
  return (
    `<g class="sy-p" style="--k:${s3(-k)}">` +
    '<circle cx="214" cy="392" r="64" fill="url(#sy-lamp)"/>' +
    `<path d="M115 1000L118 384H124L127 1000Z" fill="#221034" stroke="#4a2d78" stroke-width="1.5"/>` +
    `<path d="M121 392Q150 376 208 380" fill="none" stroke="#221034" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M121 1000V400" stroke="${PINK}" stroke-opacity=".35" stroke-width="1.5"/>` +
    '<rect x="196" y="377" width="38" height="9" rx="4" fill="#ffd2f2"/></g>'
  )
}

/** The synth, a retro monitor showing a tiny sunset, and a cassette. Self-contained: portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const whites = Array.from({ length: 11 }, (_, i) => `M${240 + i * 8} 318h7v10h-7z`).join('')
  const blacks = [0, 1, 3, 4, 5, 7, 8].map(i => `M${245 + i * 8} 318h4v6h-4z`).join('')
  const rays = [316, 335, 354, 373, 392].map(x => `M354 276L${x} 296`).join('')
  const busy = activity === 'tool' || activity === 'run' || activity === 'web' || activity === 'responding'

  return (
    // The synth's wedge case, its ivory keys lit by the screen, and two knobs.
    `<path d="M232 331L237 314H333L338 331Z" fill="${METAL}" stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${whites}" fill="#efe2ff" fill-opacity=".82"/><path d="${whites}" fill="${light}" fill-opacity=".25"/>` +
    `<path d="${blacks}" fill="#120822"/>` +
    // The monitor on its stand.
    `<path d="M344 306H368L374 326H338Z" fill="${METAL}"/><rect x="332" y="325" width="48" height="5" rx="2" fill="${METAL}"/>` +
    `<rect x="300" y="226" width="108" height="80" rx="8" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    '<rect x="308" y="234" width="92" height="64" rx="5" fill="#07030f"/>' +
    `<rect x="308" y="234" width="92" height="64" rx="5" fill="${light}" fill-opacity=".14"/>` +
    // The code above the tiny sunset, and a cursor while busy.
    `<path d="M316 243H352M316 249H340M346 249H364M316 255H330" stroke="${light}" stroke-opacity=".7" stroke-width="2.2"/>` +
    (busy ? `<rect class="sy-cur" x="334" y="252" width="5" height="6" fill="${light}"/>` : '') +
    `<path d="M337 276A17 17 0 0 1 371 276Z" fill="${light}" fill-opacity=".9"/>` +
    '<path d="M336 266H372V268H336ZM336 271H372V273.5H336Z" fill="#07030f"/>' +
    `<path d="M310 276H398${rays}M322 281H386M314 288H394" fill="none" stroke="${light}" stroke-opacity=".55" stroke-width="1.3"/>` +
    '<path d="M386 236L398 236L370 296H358Z" fill="#fff" fill-opacity=".05"/>' +
    `<circle cx="398" cy="301" r="1.8" fill="${light}"/>` +
    // The cassette.
    `<rect x="382" y="321" width="36" height="9" rx="1.5" fill="#120822" stroke="${EDGE}"/><rect x="386" y="322" width="28" height="3" fill="${PINK}" fill-opacity=".75"/>` +
    '<g fill="#efe2ff" fill-opacity=".6"><circle cx="393" cy="327.5" r="1.6"/><circle cx="407" cy="327.5" r="1.6"/></g>'
  )
}

export function synthwaveHighwayWorld(): World {
  const next = random(84)

  // The stars, kept off the sun.
  const starA: string[] = []
  const starB: string[] = []

  for (let i = 0; i < 64; i += 1) {
    const x = next() * 1600
    const y = 6 + next() * 340

    if (Math.hypot(x - VX, y - VY) < SUN_R + 30) {
      continue
    }

    ;(i % 2 ? starA : starB).push(`M${f(x)} ${f(y)}h2.6v2.6h-2.6z`)
  }

  // The grid: rays to the vanishing point, and cross lines that ride toward the viewer.
  const rays = Array.from({ length: 33 }, (_, i) => `M${VX} ${VY}L${VX + (i - 16) * 120} 1000`).join('')
  const cross = Array.from({ length: 12 }, (_, i) => `<path class="sy-x" style="--k:${s3(-i / 12)}" d="M-200 1000H1800"/>`).join('')
  // The lane dashes, drawn full size near the viewer.
  const dash = (xb: number): string => {
    const top = 860
    const wb = 9
    const wt = (wb * (top - VY)) / (1000 - VY)

    return `M${f(rayX(xb, top) - wt / 2)} ${top}L${f(rayX(xb, top) + wt / 2)} ${top}L${f(rayX(xb, 1000) + wb / 2)} 1000L${f(rayX(xb, 1000) - wb / 2)} 1000Z`
  }
  const dashes = Array.from({ length: 7 }, (_, i) => `<path class="sy-z" style="--k:${s3(-i / 7)}" d="${dash(740)}${dash(1120)}"/>`).join('')
  const posts = [0, 0.25, 0.5, 0.75].map(post).join('')

  // The tyre's sparks, rubber and smoke, from the back of the wheel arch.
  const sparks = Array.from({ length: 20 }, (_, i) => {
    const a = (-24 - next() * 128) * (Math.PI / 180)
    const v = 90 + next() * 190
    const dx = Math.cos(a) * v
    const dy = Math.sin(a) * v

    return `<path class="sy-sp" style="--dx:${f(dx)}px;--dy:${f(dy)}px;animation-delay:${f(i * 0.05)}s" d="M0 0l${f(dx * 0.18)} ${f(dy * 0.18)}" stroke="${i % 3 ? '#ffd27a' : PINK}" stroke-width="2.8" stroke-linecap="round"/>`
  }).join('')
  const shreds = [
    [120, -150, 260],
    [200, -60, -320],
    [70, -110, 400],
  ]
    .map(([dx, dy, r], i) => `<path class="sy-sh" style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg;animation-delay:${f(0.12 + i * 0.08)}s" d="M${-8 + i * 4} ${-10 + i * 3}h18l6 8l-14 8h-12z" fill="#0d0718" stroke="#5a3a8a" stroke-width="1.5"/>`)
    .join('')
  const smoke = [0, 1, 2, 3]
    .map(i => `<circle class="sy-sm" style="--dx:${f(-30 + i * 22)}px;animation-delay:${f(0.1 + i * 0.35)}s" cx="${-10 + i * 6}" cy="-8" r="${26 + i * 6}" fill="#9a88b8"/>`)
    .join('')
  const wind = Array.from({ length: 7 }, (_, i) => `<path class="sy-wd" style="animation-delay:${f(-i * 0.19)}s" d="M${f(-60 + next() * 160)} ${f(-280 + i * 54 + next() * 20)}h${f(90 + next() * 80)}" stroke="#f3e6ff" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>`).join('')
  const spokes = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2
    const p = (r: number, off: number) => `${f(r * Math.cos(a) - off * Math.sin(a))} ${f(r * Math.sin(a) + off * Math.cos(a))}`

    return `M${p(7, -3)}L${p(26, -6)}L${p(26, 6)}L${p(7, 3)}Z`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'bits',
      ink: '#06020c',
      furniture: FURN,
      metal: METAL,
      paper: '#efe2ff',
      light: { idle: '#b968e0', work: PINK, bright: '#ffc2ec' },
      headTop: 238,
      glowAt: [354, 266],
      device,
      wear: {
        front:
          // The jacket over the lower body: dark satin, a popped collar, a zip and two neon chest stripes.
          '<path d="M120 320H180L162 350H138Z" fill="#efe2ff" fill-opacity=".9"/>' +
          '<path d="M70 320H122L140 350H70Z M230 320H178L160 350H230Z" fill="#22113a" stroke="#4a2d78" stroke-width="1.5" stroke-linejoin="round"/>' +
          `<path d="M70 331H128.6V335H70Z M230 331H171.4V335H230Z" fill="${PINK}" fill-opacity=".9"/><path d="M70 339H133.3V341H70Z M230 339H166.7V341H230Z" fill="${CYAN}" fill-opacity=".7"/>` +
          '<path d="M64 296L90 318L116 320L104 330L78 326L64 334Z M236 296L210 318L184 320L196 330L222 326L236 334Z" fill="#2c1748" stroke="#5a3a8a" stroke-width="1.5" stroke-linejoin="round"/>' +
          // The shades: a dark brow bar and two pink lenses the eyes show through.
          '<path d="M84 252H226V266Q226 292 200 293Q176 294 166 280L162 276H148L144 280Q134 294 110 293Q84 292 84 266Z" fill="#ff6ad5" fill-opacity=".2" stroke="#1a0b2e" stroke-opacity=".8" stroke-width="1.5"/>' +
          '<path d="M98 282Q110 290 128 288L140 280Q134 291 110 292Q94 290 88 280Z M170 282Q180 290 198 290Q216 290 222 278Q218 292 200 292Q178 293 170 282Z" fill="#ffb36a" fill-opacity=".22"/>' +
          '<path d="M82 247H228V253H82Z" fill="#1a0b2e"/><path d="M84 247.5H226" stroke="#ff6ad5" stroke-opacity=".9" stroke-width="1.6"/>' +
          '<path d="M70 249H84V253H70Z M226 249H232V253H226Z" fill="#1a0b2e"/>' +
          '<path d="M89 258L97 258L90 270Z M206 258L218 258L210 272Z" fill="#fff" fill-opacity=".55"/>',
      },
      seatArt:
        // A bucket seat with a headrest and pink piping, bolted to the bed on a chrome post.
        `<path d="M60 352V232Q60 214 78 212H222Q240 214 240 232V352Z" fill="${FURN}" stroke="${EDGE}" stroke-width="2"/>` +
        `<path d="M66 350V234Q66 220 80 218H220Q234 220 234 234V350" fill="none" stroke="${PINK}" stroke-opacity=".55" stroke-width="2"/>` +
        `<path d="M96 350H206Q212 350 212 358V366H90V358Q90 350 96 350Z" fill="#26143f" stroke="${EDGE}" stroke-width="1.5"/>` +
        `<path d="M96 368H206" stroke="${CYAN}" stroke-opacity=".6" stroke-width="2"/>` +
        `<rect x="144" y="368" width="16" height="74" fill="${METAL}"/><path d="M148 370V440" stroke="${CHROME}" stroke-opacity=".4" stroke-width="2"/>` +
        `<rect x="116" y="440" width="72" height="12" rx="3" fill="${METAL}" stroke="${EDGE}"/>` +
        `<g fill="${CHROME}" fill-opacity=".7"><circle cx="125" cy="446" r="2.6"/><circle cx="179" cy="446" r="2.6"/></g>`,
      tableArt:
        // A chrome-edged slab with a neon underglow, over a speaker cabinet.
        `<rect x="166" y="330" width="304" height="12" rx="2" fill="${FURN}"/>` +
        `<path d="M167 331H469" stroke="${CHROME}" stroke-opacity=".55" stroke-width="1.6"/><path d="M172 344H466" stroke="${PINK}" stroke-opacity=".75" stroke-width="2.4"/>` +
        `<rect x="180" y="345" width="10" height="111" fill="${FURN}"/>` +
        `<rect x="292" y="346" width="132" height="110" rx="3" fill="#140a24" stroke="${EDGE}" stroke-width="2"/>` +
        `<g fill="#2a1a44" stroke="#6a4fa0" stroke-width="1.5"><circle cx="318" cy="362" r="7"/><circle cx="398" cy="362" r="7"/></g>` +
        `<g class="sy-spk" style="transform-origin:358px 392px"><circle cx="358" cy="392" r="27" fill="#0a0514" stroke="#4a3070" stroke-width="3"/>` +
        '<circle cx="358" cy="392" r="18" fill="#1d1030"/><circle cx="358" cy="392" r="7" fill="#3a2460"/></g>' +
        '<rect x="342" y="434" width="32" height="8" rx="4" fill="#05020a"/>',
    },
    style:
      zoomKeys('sy-z', 16, 0.66, 16) +
      zoomKeys('sy-zx', 16, 0.66, 16, Infinity, true) +
      zoomKeys('sy-pz', 16, 0.3, 18, 1.25) +
      carKeys() +
      // The ground's speed: one period of the zoom per --T.
      '.sy-gnd{--T:5s}.st-thinking .sy-gnd{--T:6.5s}.st-read .sy-gnd{--T:5.5s}.st-responding .sy-gnd{--T:2.6s}' +
      '.st-tool .sy-gnd,.st-web .sy-gnd{--T:1.6s}.st-run .sy-gnd{--T:.7s}.st-error .sy-gnd{--T:3.2s}.st-done .sy-gnd{--T:2.4s}' +
      '.sy-z{transform-origin:265px 520px;animation:sy-z var(--T) linear infinite;animation-delay:calc(var(--T) * var(--k))}' +
      '.sy-p{transform-origin:265px 520px;animation:sy-pz var(--T) linear infinite;animation-delay:calc(var(--T) * var(--k))}' +
      '.sy-x{transform-origin:265px 520px;animation:sy-zx var(--T) linear infinite;animation-delay:calc(var(--T) * var(--k))}' +
      // The stutter: the ground jolts, under three jumps a second.
      '.st-error .sy-gnd{animation:sy-stut 1.1s steps(1) infinite}' +
      // The fishtail as the tyre goes: the world lurches and settles, scaled up a little so no edge shows.
      '.sy-world{transform-origin:800px 520px}.st-error .sy-world{animation:sy-lurch 3s ease-in-out both}' +
      '@keyframes sy-lurch{0%,100%{transform:none}8%{transform:rotate(-2.6deg) scale(1.07)}22%{transform:rotate(2deg) scale(1.07)}38%{transform:rotate(-1.6deg) scale(1.06)}' +
      '54%{transform:rotate(1.2deg) scale(1.05)}72%{transform:rotate(-.6deg) scale(1.03)}88%{transform:rotate(.2deg) scale(1.01)}}' +
      '@keyframes sy-stut{0%{transform:translateY(0)}30%{transform:translateY(6px)}55%{transform:translateY(-3px)}80%{transform:translateY(0)}}' +
      // The sun: a slow breath in its halo, a tape tear on an error, the stripes lit when done.
      '.sy-halo{animation:sy-br 7s ease-in-out infinite alternate}@keyframes sy-br{from{opacity:.78}to{opacity:.95}}' +
      '.st-done .sy-halo{animation:sy-hdone 2.2s ease-out both}@keyframes sy-hdone{from{opacity:.8}to{opacity:1}}' +
      '.st-error .sy-b{animation:sy-tear 1.2s steps(1) infinite}' +
      '@keyframes sy-tear{0%{transform:translateX(0)}12%{transform:translateX(var(--o))}40%{transform:translateX(calc(var(--o) * -.5))}64%,100%{transform:translateX(0)}}' +
      '.sy-gap{opacity:0}.st-done .sy-gap{animation:sy-gap 1.4s ease-out both}@keyframes sy-gap{0%{opacity:0}45%{opacity:.85}100%{opacity:.6}}' +
      '.st-done .sy-sun{animation:sy-sunup 1.8s ease-out both}@keyframes sy-sunup{to{transform:translateY(-6px)}}' +
      '.sy-cl{animation:sy-cl 34s ease-in-out infinite alternate}.sy-cl2{animation-direction:alternate-reverse}@keyframes sy-cl{to{transform:translateX(46px)}}' +
      '.sy-tw1{animation:sy-tw 3.4s ease-in-out infinite alternate}.sy-tw2{animation:sy-tw 2.6s ease-in-out -1.2s infinite alternate}@keyframes sy-tw{from{opacity:.3}to{opacity:.9}}' +
      '.sy-wire{opacity:.7}.st-done .sy-wire{animation:sy-lit 1.6s ease-out .3s both}@keyframes sy-lit{to{opacity:1}}' +
      // Palms.
      '.sy-frond{animation:sy-sway 5.6s ease-in-out infinite alternate}@keyframes sy-sway{from{transform:rotate(-2deg)}to{transform:rotate(2.6deg)}}' +
      '.st-run .sy-frond{animation-duration:1.3s}' +
      '.sy-rim{opacity:.55}.st-done .sy-rim{animation:sy-lit 1.6s ease-out .5s both}' +
      // Shooting stars while thinking.
      '.sy-shoot{opacity:0}.st-thinking .sy-shoot{animation:sy-shoot 3s ease-in infinite}' +
      '@keyframes sy-shoot{0%{opacity:0;transform:translate(0,0)}8%{opacity:.85}36%,100%{opacity:0;transform:translate(-280px,130px)}}' +
      // The radio mast on the right horizon.
      '.sy-bcn{animation:sy-bcn 2s steps(1) infinite}@keyframes sy-bcn{0%{opacity:1}50%{opacity:.2}}' +
      '.sy-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .sy-ring{animation:sy-ring 1.8s ease-out infinite}' +
      '@keyframes sy-ring{0%{opacity:.8;transform:scale(.2)}100%{opacity:0;transform:scale(1.7)}}' +
      // The cars overtaking.
      '.sy-car{opacity:0;transform-origin:265px 520px}.st-run .sy-car{animation:sy-car 2.4s linear infinite}' +
      // The chrome wave across the grid.
      '.sy-wave{opacity:0;transform-origin:265px 520px}.st-done .sy-wave{animation:sy-wave 2.8s cubic-bezier(.35,.4,.65,1) both}' +
      '@keyframes sy-wave{0%{opacity:0;transform:scale(.05)}12%{opacity:.75}70%{opacity:.4}100%{opacity:0;transform:scale(3.6)}}' +
      // The truck: speakers, light bar, whip antenna, wheel, wind.
      '.sy-spk{animation:sy-thump 1.1s ease-out infinite}.st-responding .sy-spk{animation-duration:.52s}' +
      '.st-tool .sy-spk,.st-run .sy-spk,.st-web .sy-spk{animation-duration:.38s}.st-done .sy-spk{animation-duration:.45s}' +
      '.st-thinking .sy-spk,.st-read .sy-spk,.st-error .sy-spk{animation:none}' +
      '@keyframes sy-thump{0%{transform:scale(1.08)}100%{transform:scale(1)}}' +
      '.sy-pod{opacity:.45}.st-tool .sy-pod,.st-run .sy-pod,.st-web .sy-pod{opacity:.8}' +
      '.st-done .sy-pod{animation:sy-pod 2s ease-out both}@keyframes sy-pod{0%{opacity:.45}30%{opacity:1}100%{opacity:.85}}' +
      '.sy-whip{transform-origin:402px 404px;animation:sy-whip 2.2s ease-in-out infinite alternate}@keyframes sy-whip{from{transform:rotate(1deg)}to{transform:rotate(6deg)}}' +
      '.st-run .sy-whip{animation:sy-whipr .3s ease-in-out infinite alternate}@keyframes sy-whipr{from{transform:rotate(12deg)}to{transform:rotate(17deg)}}' +
      '.sy-whl{animation:mv-spin 1.4s linear infinite}' +
      '.st-responding .sy-whl{animation-duration:.8s}.st-tool .sy-whl,.st-web .sy-whl,.st-done .sy-whl{animation-duration:.6s}.st-run .sy-whl{animation-duration:.3s}' +
      '.st-thinking .sy-whl,.st-read .sy-whl{animation-duration:1.8s}.st-error .sy-whl{animation-duration:2.6s}' +
      '.sy-wd{opacity:0}.st-run .sy-wd{animation:sy-wd .7s linear infinite}@keyframes sy-wd{0%{opacity:0;transform:translateX(-160px)}20%{opacity:.55}100%{opacity:0;transform:translateX(520px)}}' +
      '.sy-cur{animation:sy-cur 1s steps(1) infinite}@keyframes sy-cur{50%{opacity:0}}' +
      // The blowout: sparks, rubber, smoke, a jolt, a sagging tyre, the hazard light.
      '.sy-sp{opacity:0}.st-error .sy-sp{animation:sy-sp .7s ease-out infinite}' +
      '@keyframes sy-sp{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.sy-sh{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .sy-sh{animation:sy-sh 1.5s cubic-bezier(.2,.6,.4,1) both}' +
      '@keyframes sy-sh{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.sy-sm{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .sy-sm{animation:sy-sm 2.2s ease-out infinite}' +
      '@keyframes sy-sm{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.55}100%{opacity:0;transform:translate(var(--dx),-120px) scale(2.4)}}' +
      '.sy-pop{opacity:0}.st-error .sy-pop{animation:sy-pop .6s ease-out .05s both}@keyframes sy-pop{0%{opacity:0;transform:scale(.3)}20%{opacity:.85}100%{opacity:0;transform:scale(1.4)}}' +
      '.st-error .sy-bed{animation:sy-jolt .5s ease-out 3}@keyframes sy-jolt{0%,100%{transform:translateY(0)}25%{transform:translateY(4px)}60%{transform:translateY(-1px)}}' +
      '.sy-tire{transform-box:fill-box;transform-origin:50% 100%}.st-error .sy-tire{animation:sy-flat .4s ease-out .1s both}@keyframes sy-flat{to{transform:scale(1.05,.86)}}' +
      '.sy-hz{opacity:0}.st-error .sy-hz{animation:sy-hz 1s steps(1) infinite}@keyframes sy-hz{0%{opacity:.95}50%{opacity:0}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sy-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08020f"/><stop offset=".45" stop-color="#140629"/><stop offset=".76" stop-color="#290b43"/><stop offset=".93" stop-color="#461152"/><stop offset="1" stop-color="#62185c"/></linearGradient>' +
      '<linearGradient id="sy-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e0733"/><stop offset=".18" stop-color="#11041e"/><stop offset="1" stop-color="#07020d"/></linearGradient>' +
      `<linearGradient id="sy-sunf" gradientUnits="userSpaceOnUse" x1="0" y1="${VY - SUN_R}" x2="0" y2="${VY}"><stop offset="0" stop-color="#f9c35c"/><stop offset=".38" stop-color="#f98a5c"/><stop offset=".68" stop-color="#f2528e"/><stop offset="1" stop-color="#c93cb4"/></linearGradient>` +
      '<radialGradient id="sy-halo"><stop offset="0" stop-color="#ff5fb0" stop-opacity=".5"/><stop offset=".3" stop-color="#d23aa8" stop-opacity=".24"/><stop offset=".65" stop-color="#8a2a9a" stop-opacity=".08"/><stop offset="1" stop-color="#8a2a9a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sy-refl"><stop offset="0" stop-color="#ff6ad5" stop-opacity=".32"/><stop offset="1" stop-color="#ff6ad5" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="sy-rg" gradientUnits="userSpaceOnUse" x1="0" y1="${VY}" x2="0" y2="1000"><stop offset="0" stop-color="#ff4fd0" stop-opacity="0"/><stop offset=".12" stop-color="#ff4fd0" stop-opacity=".3"/><stop offset="1" stop-color="#ff4fd0" stop-opacity=".7"/></linearGradient>` +
      `<linearGradient id="sy-ec" gradientUnits="userSpaceOnUse" x1="0" y1="${VY}" x2="0" y2="1000"><stop offset="0" stop-color="${CYAN}" stop-opacity=".1"/><stop offset=".2" stop-color="${CYAN}" stop-opacity=".6"/><stop offset="1" stop-color="${CYAN}" stop-opacity=".95"/></linearGradient>` +
      `<linearGradient id="sy-ep" gradientUnits="userSpaceOnUse" x1="0" y1="${VY}" x2="0" y2="1000"><stop offset="0" stop-color="${PINK}" stop-opacity=".1"/><stop offset=".2" stop-color="${PINK}" stop-opacity=".5"/><stop offset="1" stop-color="${PINK}" stop-opacity=".85"/></linearGradient>` +
      '<linearGradient id="sy-hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8ad8" stop-opacity=".6"/><stop offset=".166" stop-color="#ffd0f0" stop-opacity=".95"/><stop offset=".4" stop-color="#ff6ad5" stop-opacity=".45"/><stop offset="1" stop-color="#ff6ad5" stop-opacity=".35"/></linearGradient>' +
      '<linearGradient id="sy-hzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6ad5" stop-opacity="0"/><stop offset=".5" stop-color="#ff6ad5" stop-opacity=".16"/><stop offset="1" stop-color="#ff6ad5" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sy-trail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7ab0" stop-opacity=".9"/><stop offset=".22" stop-color="#ff3f7e" stop-opacity=".45"/><stop offset="1" stop-color="#ff3f7e" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="sy-tlg"><stop offset="0" stop-color="#ff3f7e" stop-opacity=".42"/><stop offset="1" stop-color="#ff3f7e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sy-lamp"><stop offset="0" stop-color="#ff9ae0" stop-opacity=".5"/><stop offset=".4" stop-color="#ff6ad5" stop-opacity=".16"/><stop offset="1" stop-color="#ff6ad5" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sy-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5ce1ff"/><stop offset=".3" stop-color="#f3e6ff"/><stop offset=".55" stop-color="#ff6ad5"/><stop offset=".8" stop-color="#f3e6ff"/><stop offset="1" stop-color="#5ce1ff"/></linearGradient>' +
      '<linearGradient id="sy-shoot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs><g class="sy-world">' +
      // The sky, its stars, two shooting stars, the sun and its cloud streaks.
      `<rect width="1600" height="${VY}" fill="url(#sy-sky)"/>` +
      `<path class="sy-tw1" d="${starA.join('')}" fill="#f3e6ff"/><path class="sy-tw2" d="${starB.join('')}" fill="#d9c8ff"/>` +
      '<g class="sy-shoot"><path d="M380 70l90 -3v2z" fill="url(#sy-shoot)" transform="rotate(-25 380 70)"/></g>' +
      '<g class="sy-shoot" style="animation-delay:1.4s"><path d="M1500 110l90 -3v2z" fill="url(#sy-shoot)" transform="rotate(-25 1500 110)"/></g>' +
      sun() +
      '<g class="sy-cl" fill="#2c0c44" fill-opacity=".9"><ellipse cx="210" cy="404" rx="250" ry="5"/><ellipse cx="150" cy="472" rx="170" ry="3.5"/></g>' +
      '<g class="sy-cl sy-cl2" fill="#2c0c44" fill-opacity=".9"><ellipse cx="330" cy="444" rx="190" ry="4"/><ellipse cx="80" cy="372" rx="160" ry="3"/></g>' +
      // The ranges on the horizon.
      range([[560, 520], [620, 500], [690, 507], [760, 488], [840, 501], [920, 484], [1000, 499], [1080, 489], [1150, 505], [1210, 520]], PINK, 0.32, '#12052a') +
      range([[350, 520], [392, 499], [440, 474], [480, 493], [522, 482], [570, 520]], PINK, 0.5, '#13062b') +
      range([[-60, 520], [-20, 478], [22, 494], [72, 444], [118, 486], [152, 468], [204, 520]], PINK, 0.55, '#13062b') +
      // The ground: the grid, the highway, its lane dashes, lamp posts, the cars and the chrome wave.
      `<rect y="${VY}" width="1600" height="${1000 - VY}" fill="url(#sy-gnd)"/>` +
      `<ellipse cx="${VX}" cy="566" rx="180" ry="120" fill="url(#sy-refl)"/>` +
      '<g class="sy-gnd">' +
      `<path d="${rays}" fill="none" stroke="url(#sy-rg)" stroke-width="1.6"/>` +
      `<g fill="none" stroke="#ff4fd0" stroke-opacity=".7" stroke-width="4">${cross}</g>` +
      `<path d="M${VX} ${VY}L360 1000H1500Z" fill="#0a0416" fill-opacity=".8"/>` +
      `<path d="M${VX} ${VY}L360 1000" stroke="${CYAN}" stroke-opacity=".14" stroke-width="10"/><path d="M${VX} ${VY}L360 1000" stroke="url(#sy-ec)" stroke-width="3"/>` +
      `<path d="M${VX} ${VY}L1500 1000" stroke="${PINK}" stroke-opacity=".1" stroke-width="10"/><path d="M${VX} ${VY}L1500 1000" stroke="url(#sy-ep)" stroke-width="3"/>` +
      `<path d="M${VX} ${VY}L740 1000M${VX} ${VY}L1120 1000" stroke="#ffd6f4" stroke-opacity=".08" stroke-width="1.4"/>` +
      `<g fill="#ffd6f4" fill-opacity=".62">${dashes}</g>` +
      posts +
      '</g>' +
      car(930, false, 0) +
      car(550, true, 0.4) +
      car(930, true, 0.8) +
      car(550, false, 1.2) +
      car(930, false, 1.6) +
      car(550, true, 2) +
      `<path class="sy-wave" d="M${VX - 500} ${VY}A500 130 0 0 0 ${VX + 500} ${VY}" fill="none" stroke="url(#sy-chrome)" stroke-width="6"/>` +
      `<path class="sy-wave" style="animation-delay:.55s" d="M${VX - 500} ${VY}A500 130 0 0 0 ${VX + 500} ${VY}" fill="none" stroke="url(#sy-chrome)" stroke-width="3.6"/>` +
      `<rect y="${VY - 30}" width="1600" height="60" fill="url(#sy-hzg)"/><rect y="${VY - 1.5}" width="1600" height="3" fill="url(#sy-hz)"/>` +
      // The foreground palm on the left, framing the sun.
      palm(170, 1010, 44, 292, 190, 3, 17) +
      // The far right: a big wireframe range, a radio mast and a palm.
      '<g class="mv-r">' +
      range([[1130, 520], [1200, 490], [1258, 470], [1300, 438], [1350, 462], [1420, 394], [1480, 356], [1532, 386], [1580, 372], [1640, 420], [1700, 520]], CYAN, 0.5, '#0f0628') +
      `<path d="M1278 520L1288 378H1292L1302 520" fill="none" stroke="${NIGHT}" stroke-width="3"/>` +
      `<path d="M1281 490H1299M1284 455H1296M1286 420H1294M1281 490L1296 455M1299 490L1284 455M1284 455L1294 420M1296 455L1286 420" stroke="${NIGHT}" stroke-width="2"/>` +
      '<circle class="sy-bcn" cx="1290" cy="376" r="3.4" fill="#ff4f6a"/>' +
      [0, 0.6, 1.2].map(d => `<ellipse class="sy-ring" style="animation-delay:${d}s" cx="1290" cy="376" rx="34" ry="20" fill="none" stroke="${CYAN}" stroke-width="2"/>`).join('') +
      palm(1550, 760, 1478, 318, 160, 9, 13) +
      '</g></g>',
    nook:
      '<defs><radialGradient id="sy-podg"><stop offset="0" stop-color="#ffd9b0" stop-opacity=".55"/><stop offset=".4" stop-color="#ff9ad8" stop-opacity=".18"/><stop offset="1" stop-color="#ff9ad8" stop-opacity="0"/></radialGradient></defs>' +
      // The cab's back and its rear window, the roll bar and its light bar, the bed floor, the whip antenna.
      `<path d="M-250 404V250Q-250 222 -226 214L-150 196Q-120 190 -96 196L-72 204Q-60 208 -60 222V404Z" fill="#120822" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
      '<path d="M-232 238L-156 222Q-126 216 -104 222L-80 230V300H-232Z" fill="#1c0d33"/>' +
      `<path d="M-226 292L-140 226M-196 296L-112 232" stroke="${PINK}" stroke-opacity=".18" stroke-width="5"/>` +
      '<path d="M-200 290A26 26 0 0 1 -148 290Z" fill="#f98a5c" fill-opacity=".35"/><path d="M-202 278H-146V281H-202ZM-202 285H-146V288H-202Z" fill="#1c0d33"/>' +
      `<path d="M-50 404L-40 196Q-38 178 -20 178H24Q42 178 44 196L52 404" fill="none" stroke="#2c1a48" stroke-width="10" stroke-linejoin="round"/>` +
      `<path d="M-46 400L-36 198Q-34 184 -20 184H22" fill="none" stroke="${CHROME}" stroke-opacity=".3" stroke-width="2"/>` +
      `<rect x="-46" y="160" width="94" height="16" rx="5" fill="#160b26" stroke="${EDGE}"/>` +
      `<g class="sy-pod"><circle cx="-26" cy="168" r="44" fill="url(#sy-podg)"/><circle cx="26" cy="168" r="44" fill="url(#sy-podg)"/></g>` +
      '<g fill="#ffe2c4"><circle cx="-26" cy="168" r="5.5"/><circle cx="0" cy="168" r="5.5" fill-opacity=".7"/><circle cx="26" cy="168" r="5.5"/></g>' +
      '<g class="sy-hz" fill="#ffb347"><circle cx="-26" cy="168" r="7"/><circle cx="26" cy="168" r="7"/><circle cx="-26" cy="168" r="22" fill-opacity=".25"/><circle cx="26" cy="168" r="22" fill-opacity=".25"/></g>' +
      '<rect x="-60" y="444" width="530" height="16" fill="#0b0516"/>' +
      `<g class="sy-whip"><path d="M402 404L390 92" stroke="#2c1a48" stroke-width="3"/><circle cx="390" cy="90" r="4" fill="${CYAN}" fill-opacity=".8"/></g>` +
      wind,
    front:
      '<defs><radialGradient id="sy-pop"><stop offset="0" stop-color="#fff2c8" stop-opacity=".9"/><stop offset=".35" stop-color="#ffb36a" stop-opacity=".4"/><stop offset="1" stop-color="#ff6ad5" stop-opacity="0"/></radialGradient></defs>' +
      // The wheel in its arch, then the bed's side panel with its chrome rail, pinstripes, taillight and underglow.
      '<path d="M274 460A56 56 0 0 1 386 460Z" fill="#05020a"/>' +
      `<g transform="translate(330 462)"><g class="sy-tire"><circle r="50" fill="#07030d" stroke="#1c1030" stroke-width="4"/>` +
      '<circle r="41" fill="none" stroke="#130a22" stroke-width="3" stroke-dasharray="6 6"/>' +
      `<g class="sy-whl"><circle r="28" fill="#1e1236" stroke="${CHROME}" stroke-opacity=".55" stroke-width="2"/><path d="${spokes}" fill="#a898d8" fill-opacity=".7"/><circle r="6" fill="${PINK}" fill-opacity=".8"/></g></g></g>` +
      '<g class="sy-bed">' +
      `<path d="M-260 404H470V460H386A56 56 0 0 0 274 460H-260Z" fill="${PAINT}"/>` +
      `<rect x="-260" y="398" width="730" height="8" fill="${CHROME}" fill-opacity=".5"/><rect x="-260" y="406" width="730" height="2" fill="#0a0514"/>` +
      `<path d="M-260 420H293M367 420H470" stroke="${PINK}" stroke-opacity=".6" stroke-width="2"/><path d="M-260 428H285M375 428H470" stroke="${CYAN}" stroke-opacity=".4" stroke-width="2"/>` +
      '<path d="M386 460A56 56 0 0 0 274 460" fill="none" stroke="#2c1a48" stroke-width="6"/>' +
      `<rect x="404" y="410" width="14" height="36" rx="2" fill="${HOT}"/><rect class="sy-hz" x="404" y="410" width="14" height="15" rx="2" fill="#ffb347"/>` +
      `<rect x="-260" y="455" width="534" height="5" fill="${PINK}" fill-opacity=".5"/>` +
      '</g>' +
      `<g transform="translate(300 452)"><circle class="sy-pop" r="70" fill="url(#sy-pop)"/>${smoke}${shreds}${sparks}</g>`,
  }
}
