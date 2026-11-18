import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Titan Steps: a valley of colossal ruined statues in an invented ancient style, under dust, stars and a small moon. A
// toppled head with a crown of stone pillars lies half-buried at the left, a giant arm reaches in from the top-left,
// two broken legs stand like towers on their plinth at the right, and giant steps climb the valley to a far seated
// colossus. Claude, a hooded traveller, codes on a stone tablet in the palm of a giant open hand. A command wakes the
// head: it stirs and lifts, its lids open, its stone eyes turn and glow and dust pours from its cracks. An error snaps
// the raised forearm, which crashes down in a cloud of dust. Done brings dawn up between the legs, onto the head's face.
const SAND = '#c9b48a'
const GOLD = '#f2d08a'
const STONE = '#322b24'
const STONE_LIT = '#4d4133'
const MOON = '#9aa7b5'
const FAR = '#110e0b'
const BACK = '#18140f'
const RIM = '#30291f'
const HAND = '#3a332b'
const HAND_LIT = '#554939'
const HAND_DARK = '#29231d'
const CREASE = '#17130f'
const HOOD = '#6e5a3e'
const HOOD_DARK = '#3b2e21'
const SCARF = '#3d6461'
const LEATHER = '#3b3128'

/** Where the head's eye line is centred in the picture, and how far the toppled head leans. */
const HEAD = { x: 236, y: 650, tilt: -20 }

/** A point in the head's own frame, in the picture. */
function onHead(x: number, y: number): [number, number] {
  const a = (HEAD.tilt * Math.PI) / 180

  return [HEAD.x + x * Math.cos(a) - y * Math.sin(a), HEAD.y + x * Math.sin(a) + y * Math.cos(a)]
}

/** The dune's crest around the head, as straight runs between points on its curve. */
function crest(x: number): number {
  const points: readonly (readonly [number, number])[] = [
    [-40, 792],
    [88, 771],
    [236, 766],
    [372, 780],
    [520, 812],
  ]
  let [x0, y0] = [-40, 792]

  for (const [x1, y1] of points) {
    if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    ;[x0, y0] = [x1, y1]
  }

  return y0
}

/** Dots as one path of tiny squares. */
function dots(points: readonly (readonly [number, number])[], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** A tapered limb from one point to another, `w1` wide at the start and `w2` at the end. */
function limb(x1: number, y1: number, x2: number, y2: number, w1: number, w2: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const nx = -Math.sin(a)
  const ny = Math.cos(a)

  return (
    `M${f(x1 + (nx * w1) / 2)} ${f(y1 + (ny * w1) / 2)}L${f(x2 + (nx * w2) / 2)} ${f(y2 + (ny * w2) / 2)}` +
    `L${f(x2 - (nx * w2) / 2)} ${f(y2 - (ny * w2) / 2)}L${f(x1 - (nx * w1) / 2)} ${f(y1 - (ny * w1) / 2)}Z`
  )
}

const OUTLINE = 'M-142 -186H142L144 -112L128 -100L140 -84L148 -36L150 40L126 138L62 198H-62L-126 138L-150 40L-148 -36Z'

// Invented marks carved on the tablet, none a letter or numeral: stairs, a ringed tick, a bar under two dots, an almond
// eye, a tailed lozenge, a rayed disc, a wave over a bar; past the gap, falling stairs, an arc over two dots, a lozenge.
const MARKS =
  'M184 342h3v-3h3v-3h3v-3M198 338a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M202 334v3.5M211 341h9M212.5 336h1.6M217.5 336h1.6' +
  'M226 338q5 -5 10 0q-5 5 -10 0zM230.2 338h1.6M244 338h3l3 -4l3 4l-3 4l-3 -4M253 338h3' +
  'M264 338a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M266 333.5v1.5M266 341v1.5M261.5 338h1.5M269 338h1.5M276 336q2.5 -3 5 0t5 0M276 341h10' +
  'M420 334h3v3h3v3h3v3M434 337q5 -5 10 0M436 341h1.6M441 341h1.6M448 338h3l3 -4l3 4l-3 4l-3 -4M457 338h3'

/** The crown: five stone pillars on a headband, all but the middle one snapped off. */
function crown(): { body: string; detail: string } {
  const base = -190
  const pillars: readonly (readonly [number, number, number, boolean])[] = [
    [-104, 34, 70, true],
    [-56, 38, 110, true],
    [0, 44, 132, false],
    [56, 38, 92, true],
    [104, 34, 52, true],
  ]
  let body = ''
  let flutes = ''
  let drums = ''
  let lit = ''

  for (const [cx, w, h, broken] of pillars) {
    const x0 = cx - w / 2
    const x1 = cx + w / 2
    const top = base - h

    body += broken
      ? `M${f(x0)} ${base}V${top + 8}L${f(x0 + w * 0.3)} ${top}L${f(x0 + w * 0.55)} ${top + 11}L${f(x0 + w * 0.8)} ${top + 3}L${f(x1)} ${top + 13}V${base}Z`
      : `M${f(x0)} ${base}V${top}H${f(x1)}V${base}Z`
    flutes += `M${f(cx - w * 0.2)} ${base - 6}V${top + 18}M${f(cx + w * 0.2)} ${base - 6}V${top + 18}`

    // The stone drums each pillar is stacked from.
    for (let y = base - 34; y > top + 16; y -= 34) {
      drums += `M${f(x0)} ${y}H${f(x1)}`
      lit += `M${f(x0)} ${y + 3}H${f(x1)}`
    }
  }

  const top = base - 132

  return {
    body,
    detail:
      `<path d="${flutes}" stroke="#16120f" stroke-width="3"/>` +
      `<path d="${drums}" stroke="#0e0b09" stroke-width="3"/><path d="${lit}" stroke="#4a3f31" stroke-width="1.5"/>` +
      `<rect x="-28" y="${top - 10}" width="56" height="12" rx="2" fill="#3b3229"/>` +
      `<circle cy="${top - 31}" r="17" fill="none" stroke="#352d25" stroke-width="8"/>` +
      `<path d="M-148 ${base}H148" stroke="${MOON}" stroke-width="2.5" stroke-opacity=".5"/>` +
      `<path d="M58 ${base}L52 -232L64 -262" fill="none" stroke="#080605" stroke-width="3"/>`,
  }
}

/** One eye: a socket, a stone eyeball whose iris can turn, a heavy lid that can lift, and the glow it wakes with. */
function eye(cx: number, id: string): { eye: string; halo: string } {
  const socket = `M${cx - 46} 2Q${cx} -30 ${cx + 46} 2Q${cx} 28 ${cx - 46} 2Z`

  return {
    eye:
      `<clipPath id="${id}"><path d="${socket}"/></clipPath><path d="${socket}" fill="#0a0807"/>` +
      `<g clip-path="url(#${id})"><ellipse cx="${cx}" cy="4" rx="40" ry="17" fill="#221d18"/>` +
      `<g class="ts-ir"><circle cx="${cx}" cy="7" r="13" fill="#15110e" stroke="#56493a" stroke-width="3"/><circle cx="${cx}" cy="7" r="5" fill="#050403"/>` +
      `<circle class="ts-eg" cx="${cx}" cy="7" r="17" fill="url(#ts-eye)"/></g>` +
      `<g class="ts-lid"><path d="M${cx - 50} -34H${cx + 50}V2Q${cx} 12 ${cx - 50} 2Z" fill="${STONE}"/>` +
      `<path d="M${cx - 50} 2Q${cx} 12 ${cx + 50} 2" fill="none" stroke="#0e0b09" stroke-width="3"/></g></g>` +
      `<path d="M${cx - 48} 0Q${cx} -35 ${cx + 48} 0" fill="none" stroke="#4d4234" stroke-width="4"/>` +
      `<path d="M${cx - 44} 5Q${cx} 31 ${cx + 44} 5" fill="none" stroke="#17130f" stroke-width="3"/>`,
    halo: `<circle class="ts-eh" cx="${cx}" cy="2" r="110" fill="url(#ts-eh)"/>`,
  }
}

/** The colossal head in its own frame: the eye line at y 0, the chin at 198. */
function head(): string {
  const c = crown()
  const left = eye(-60, 'ts-cl')
  const right = eye(60, 'ts-cr')
  const discs = [-120, -72, -24, 24, 72, 120]
  const channels = [42, 58, 74].flatMap(x => [`M${x} 26L${x + 4} 114`, `M${-x} 26L${-x - 4} 114`]).join('')

  return (
    // The crown and its headband, moonlit from above, the glyph discs on the band waking with the eyes.
    `<path d="${c.body}" fill="#2e2821" stroke="${RIM}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${c.body}" fill="url(#ts-mn)"/>` +
    `<path class="ts-lit" d="${c.body}" fill="url(#ts-face)"/>` +
    c.detail +
    '<rect x="-154" y="-190" width="308" height="40" rx="4" fill="#332c24" stroke="#1a1612" stroke-width="2"/>' +
    discs.map(x => `<circle cx="${x}" cy="-170" r="9" fill="#1c1814" stroke="#5a4c3b" stroke-width="2"/>`).join('') +
    discs.map((x, i) => `<circle class="ts-ag" style="animation-delay:${f(0.5 + i * 0.12)}s" cx="${x}" cy="-170" r="6" fill="${GOLD}"/>`).join('') +
    // Ears, the face with moonlight on its brow and its rim of starlight, the shadowed left half.
    `<path d="M146 -34H166Q172 -34 172 -26V58Q172 66 164 66H148ZM-146 -34H-166Q-172 -34 -172 -26V58Q-172 66 -164 66H-148Z" fill="#241f19" stroke="${RIM}" stroke-width="2"/>` +
    '<path d="M158 -20V52M-158 -20V52" stroke="#120f0c" stroke-width="3"/>' +
    `<path d="${OUTLINE}" fill="${STONE}"/>` +
    `<path d="${OUTLINE}" fill="url(#ts-mn)"/>` +
    `<path class="ts-lit ts-lh" d="${OUTLINE}" fill="url(#ts-face)"/>` +
    `<path d="M142 -186L144 -112M140 -84L148 -36L150 40L126 138L62 198" fill="none" stroke="${STONE_LIT}" stroke-width="3"/>` +
    '<path d="M-148 -36L-150 40L-126 138L-62 198L-44 130L-96 40L-100 -30Z" fill="#000" fill-opacity=".3"/>' +
    // The brow, the mark on the forehead that stirs while Claude thinks.
    '<path d="M-136 -44Q-68 -66 0 -48Q68 -66 136 -44L136 -32Q68 -52 0 -36Q-68 -52 -136 -32Z" fill="#3e352b"/>' +
    `<path d="M-134 -45Q-68 -67 0 -49Q68 -67 134 -45" fill="none" stroke="${MOON}" stroke-width="2.5" stroke-opacity=".45"/>` +
    '<path d="M-130 -32Q-68 -50 0 -34Q68 -50 130 -32L128 -22Q68 -38 0 -24Q-68 -38 -128 -22Z" fill="#000" fill-opacity=".3"/>' +
    `<path d="M-122 36Q-92 22 -62 36M62 36Q92 22 122 36" fill="none" stroke="${MOON}" stroke-width="3" stroke-opacity=".22"/>` +
    '<path d="M0 -118L11 -98L0 -78L-11 -98Z" fill="#1a1511" stroke="#4a3f32" stroke-width="2"/>' +
    `<g class="ts-3e"><circle cy="-98" r="34" fill="url(#ts-eh)"/><path d="M0 -112L7 -98L0 -84L-7 -98Z" fill="${GOLD}"/></g>` +
    left.eye +
    right.eye +
    // The nose with its broken tip, the tear channels carved down the cheeks, the closed mouth.
    '<path d="M-12 -40H12L28 78L16 88L8 80L-2 94L-18 92L-30 80Z" fill="#3a3229"/>' +
    `<path d="M-12 -40H12L18 4" fill="none" stroke="${MOON}" stroke-width="2" stroke-opacity=".3"/>` +
    '<path d="M-12 -40H0V94H-2L-18 92L-30 80Z" fill="#000" fill-opacity=".28"/>' +
    '<path d="M-20 88Q-12 96 -4 92M6 90Q14 94 20 86" fill="none" stroke="#0d0b09" stroke-width="3"/>' +
    `<path d="${channels}" stroke="#0e0b09" stroke-width="5" stroke-linecap="round"/>` +
    `<path class="ts-rd" d="${channels}" stroke="${SAND}" stroke-width="2" stroke-linecap="round"/>` +
    '<path d="M-50 134Q0 124 50 134" fill="none" stroke="#0d0b09" stroke-width="5"/><path d="M-40 142Q0 156 40 142" fill="none" stroke="#433a2f" stroke-width="4"/>' +
    '<path d="M-26 -190L-32 -152L-18 -124L-38 -88L-26 -64L-50 -26M98 20L84 56L106 90L92 130L104 174" fill="none" stroke="#080605" stroke-width="3" stroke-linejoin="round"/>' +
    left.halo +
    right.halo
  )
}

/** A stone leg standing on the plinth, broken off at `brk`; `inner` is the side the dawn lights. */
function leg(cx: number, brk: number, inner: 1 | -1): string {
  const shin = `M${cx - 34} 518C${cx - 42} 452 ${cx - 46} 402 ${cx - 38} 344H${cx + 38}C${cx + 44} 402 ${cx + 40} 456 ${cx + 34} 518Z`
  const thigh =
    `M${cx - 44} 336C${cx - 52} 262 ${cx - 50} ${brk + 60} ${cx - 44} ${brk + 14}L${cx - 30} ${brk}L${cx - 16} ${brk + 16}L${cx} ${brk - 6}` +
    `L${cx + 14} ${brk + 12}L${cx + 28} ${brk - 2}L${cx + 46} ${brk + 16}C${cx + 52} ${brk + 60} ${cx + 50} 262 ${cx + 44} 336Z`
  const snap = `M${cx - 44} ${brk + 14}L${cx - 30} ${brk}L${cx - 16} ${brk + 16}L${cx} ${brk - 6}L${cx + 14} ${brk + 12}L${cx + 28} ${brk - 2}L${cx + 46} ${brk + 16}`
  // The foot seen from the front: a broad block with its five toes along the plinth's edge.
  const foot = `M${cx - 52} 600V584Q${cx - 52} 566 ${cx - 34} 562L${cx - 26} 552H${cx + 26}L${cx + 34} 562Q${cx + 52} 566 ${cx + 52} 584V600Z`
  const toes = [-38, -19, 0, 19, 38].map((dx, i) => `<ellipse cx="${cx + dx}" cy="592" rx="${i === 0 ? 11 : 9}" ry="9"/>`).join('')
  const edge = inner * 46
  const rim =
    `M${cx + edge} ${brk + 16}C${cx + inner * 52} ${brk + 60} ${cx + inner * 50} 262 ${cx + inner * 44} 336` +
    `C${cx + inner * 44} 402 ${cx + inner * 40} 456 ${cx + inner * 34} 518`
  const star = `M${cx + 46} ${brk + 16}C${cx + 52} ${brk + 60} ${cx + 50} 262 ${cx + 44} 336C${cx + 44} 402 ${cx + 40} 456 ${cx + 34} 518`

  return (
    `<g fill="#2f2821" stroke="${RIM}" stroke-width="2" stroke-linejoin="round"><path d="${thigh}"/><path d="${shin}"/><path d="${foot}"/></g>` +
    `<path d="${thigh}" fill="url(#ts-mn)"/>` +
    `<path d="M${cx - 44} ${brk + 14}C${cx - 50} ${brk + 60} ${cx - 52} 262 ${cx - 44} 336C${cx - 46} 402 ${cx - 42} 452 ${cx - 34} 518H${cx - 14}C${cx - 18} 440 ${cx - 20} 300 ${cx - 14} ${brk + 12}Z" fill="#000" fill-opacity=".32"/>` +
    `<path d="${snap}" fill="none" stroke="${MOON}" stroke-width="2.5" stroke-opacity=".55" stroke-linejoin="round"/>` +
    `<ellipse cx="${cx + 2}" cy="334" rx="40" ry="32" fill="#332c24" stroke="${RIM}" stroke-width="2"/><ellipse cx="${cx + 8}" cy="326" rx="20" ry="13" fill="#3e3529"/>` +
    `<path d="M${cx - 30} 316Q${cx + 2} 296 ${cx + 34} 316" fill="none" stroke="${MOON}" stroke-width="2" stroke-opacity=".3"/>` +
    `<g fill="#332c24" stroke="#17130f" stroke-width="2">${toes}</g>` +
    `<path d="${star}" fill="none" stroke="#4e4334" stroke-width="3"/>` +
    `<path d="M${cx - 34} 364Q${cx} 356 ${cx + 34} 364M${cx + 8} ${brk + 40}L${cx + 18} ${brk + 90}L${cx + 6} ${brk + 140}" fill="none" stroke="#0c0a08" stroke-width="3"/>` +
    `<rect x="${cx - 37}" y="516" width="74" height="30" rx="5" fill="#2c261f" stroke="#4a3f31" stroke-width="2"/>` +
    [-22, 0, 22].map(dx => `<circle cx="${cx + dx}" cy="531" r="5.5" fill="#15120e" stroke="#5a4c3b" stroke-width="1.5"/>`).join('') +
    [-22, 0, 22]
      .map((dx, i) => `<circle class="ts-ag" style="animation-delay:${f(0.9 + i * 0.15 + (inner > 0 ? 0 : 0.45))}s" cx="${cx + dx}" cy="531" r="4" fill="${GOLD}"/>`)
      .join('') +
    `<path class="ts-lit" d="${rim}" fill="none" stroke="#f6c27a" stroke-opacity=".7" stroke-width="4"/>`
  )
}

/** The traveller's laptop, strapped shut for the road between uses, and a little cairn of stones beside it. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<rect x="244" y="322" width="98" height="8" rx="2" fill="${LEATHER}"/>` +
    keys +
    `<path d="M334 327L358 238L369 240L345 329Z" fill="${LEATHER}"/>` +
    `<path d="M336 324L358 243L362 244L340 326Z" fill="${light}"/>` +
    `<path d="M336 324L358 243L346 247L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The strap around the lid and its buckle.
    '<path d="M343 292L370 298" stroke="#5a4632" stroke-width="5"/><rect x="352" y="291" width="7" height="9" fill="none" stroke="#c9b48a" stroke-width="2"/>' +
    // The cairn.
    '<ellipse cx="404" cy="326" rx="17" ry="5" fill="#4a4034"/><ellipse cx="402" cy="318" rx="13" ry="4.5" fill="#5a4e3e"/>' +
    '<ellipse cx="405" cy="311" rx="8" ry="3.6" fill="#6c5e49"/><ellipse cx="404" cy="305" rx="4.5" ry="2.6" fill="#82725a"/>'
  )
}

/** A finger of the giant hand behind Claude: a stone column with two creases, leaning `tilt` from its base. */
function finger(cx: number, w: number, top: number, tilt: number): string {
  const x = cx - w / 2

  return (
    `<g transform="rotate(${tilt} ${cx} 336)"><rect x="${x}" y="${top}" width="${w}" height="${336 - top}" rx="${w / 2}" fill="${HAND}" stroke="${CREASE}" stroke-width="2"/>` +
    `<rect x="${x + 2}" y="${top + 10}" width="${f(w * 0.3)}" height="${326 - top}" rx="${f(w * 0.15)}" fill="#000" fill-opacity=".22"/>` +
    `<ellipse cx="${cx + 4}" cy="${top + 17}" rx="${w / 2 - 9}" ry="10" fill="${HAND_LIT}" fill-opacity=".6"/>` +
    `<path d="M${x + 5} ${top + 38}q${w / 2 - 5} 6 ${w - 10} 0M${x + 5} ${top + 76}q${w / 2 - 5} 6 ${w - 10} 0" fill="none" stroke="${CREASE}" stroke-width="2.5"/></g>`
  )
}

export function titanStepsWorld(): World {
  const next = random(54)

  // The stars: two twinkling sets at the sides and the top, a dim one over the chat column.
  const starA: [number, number][] = []
  const starB: [number, number][] = []
  const starC: [number, number][] = []

  for (let i = 0; i < 96; i += 1) {
    const p: [number, number] = [next() * 1600, 6 + next() * 560]

    ;(p[0] > 430 && p[0] < 1170 ? starC : i % 2 === 0 ? starA : starB).push(p)
  }

  // The giant steps, climbing from the foot of the picture to the far colossus.
  const steps = (() => {
    const n = 9
    const yAt = (t: number) => 662 + 338 * Math.pow(1 - t, 1.7)
    const hw = (y: number) => 40 + (y - 662) * 1.45
    const quad = (ya: number, yb: number) => `M${f(800 - hw(yb))} ${f(yb)}L${f(800 + hw(yb))} ${f(yb)}L${f(800 + hw(ya))} ${f(ya)}L${f(800 - hw(ya))} ${f(ya)}Z`
    let risers = ''
    let treads = ''
    let noses = ''

    for (let i = 0; i < n; i += 1) {
      const bottom = yAt(i / n)
      const top = yAt((i + 1) / n)
      const mid = top + (bottom - top) * 0.3

      treads += quad(mid, top)
      risers += quad(bottom, mid)
      noses += `M${f(800 - hw(mid))} ${f(mid)}H${f(800 + hw(mid))}`
    }

    return (
      `<path d="${risers}" fill="#110e0b"/><path d="${treads}" fill="#1e1a15"/>` +
      `<path d="${noses}" stroke="#3a3126" stroke-opacity=".55" stroke-width="2"/>`
    )
  })()

  // Dust in the air: three drifting veils of motes.
  const motes = [0, 1, 2]
    .map(g => {
      const parts = Array.from({ length: 7 }, () => {
        const side = next()
        const x = side < 0.45 ? next() * 420 : side < 0.8 ? 1180 + next() * 420 : 420 + next() * 760
        const y = 120 + next() * 760

        return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.6)}"/>`
      }).join('')

      return `<g class="ts-mote" style="animation-delay:${f(-g * 5.3)}s">${parts}</g>`
    })
    .join('')

  // The dust that pours from the head's cracks while a command runs, down to the dune: a faint wide veil, two dashed
  // streams of grains, and a pool where each lands. Drawn in the picture's frame inside the head's turning group, so
  // the streams stay on their cracks as the head stirs.
  const pour = (
    [
      [-50, -26, true],
      [-38, -88, true],
      [138, -96, true],
      [-104, -258, false],
      [96, 40, true],
    ] as const
  )
    .map(([x, y, ground], i) => {
      const [px, py] = onHead(x, y)
      const len = ground ? crest(px) - py : 66
      const d = `M${f(px)} ${f(py)}v${f(len)}`

      return (
        `<path d="${d}" stroke-width="13" stroke-opacity=".22"/>` +
        `<path class="ts-grain" style="animation-delay:${f(-i * 0.13)}s" d="${d}"/>` +
        `<path class="ts-grain" style="animation-delay:${f(-i * 0.13 - 0.2)}s" d="M${f(px + 3)} ${f(py + 4)}v${f(len - 6)}" stroke-width="1.6"/>` +
        (ground ? `<ellipse cx="${f(px + 2)}" cy="${f(py + len)}" rx="26" ry="8" fill="url(#ts-dust)" stroke="none"/>` : '')
      )
    })
    .join('')
  const [trX, trY] = onHead(138, -96)
  const trickle = `<path class="ts-trk" d="M${f(trX)} ${f(trY)}v${f(crest(trX) - trY)}" stroke="${SAND}" stroke-opacity=".45" stroke-width="2"/>`
  const crownPuffs = [-80, 0, 80]
    .map((x, i) => {
      const [px, py] = onHead(x, -200)

      return `<circle class="ts-cp" style="animation-delay:${f(0.4 + i * 0.35)}s" cx="${f(px)}" cy="${f(py)}" r="34" fill="url(#ts-dust)"/>`
    })
    .join('')
  // The dust the stirring head throws up from its dune.
  const plumes = [
    [150, 770, 0.5],
    [270, 772, 0.75],
    [380, 786, 1],
  ]
    .map(([x, y, d]) => `<ellipse class="ts-pl" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="96" ry="26" fill="url(#ts-cloud)"/>`)
    .join('')

  // Where the broken forearm lands: the dust it throws up and the chips that fly.
  const puffs = [
    [420, 792, 84, -70],
    [490, 806, 100, 0],
    [570, 826, 84, 60],
    [360, 780, 70, -110],
    [630, 842, 66, 100],
    [500, 770, 76, 20],
    [450, 826, 60, -40],
  ]
    .map(([x, y, r, dx], i) => `<circle class="ts-puff" style="--dx:${dx}px;animation-delay:${f(1.22 + i * 0.05)}s" cx="${x}" cy="${y}" r="${r}" fill="url(#ts-cloud)"/>`)
    .join('')
  const chips = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * (1.05 + (i / 9) * 0.9)
    const d = 130 + next() * 110

    return `<path class="ts-chip" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d * 0.8)}px" d="M${f(490 + (i - 4.5) * 14)} 806l${f(6 + next() * 5)} -5l4 8l-8 4z" fill="#4a4034"/>`
  }).join('')
  // Tool: stones that tumble off the broken legs and kick up a little dust on the plinth.
  const pebbles = [
    [1316, 180, -0.6],
    [1340, 176, 0],
    [1324, 184, -1.1],
    [1516, 244, -0.3],
    [1538, 248, 0.4],
  ]
    .map(
      ([x = 0, y = 0, d = 0]) =>
        `<rect class="ts-peb" style="animation-delay:${d}s;--fall:${f(588 - y)}px" x="${x}" y="${y}" width="12" height="10" rx="3" fill="#5a4e3e"/>` +
        `<ellipse class="ts-pp" style="animation-delay:${f(d + 1.5)}s" cx="${x - 2}" cy="598" rx="26" ry="9" fill="url(#ts-dust)"/>`,
    )
    .join('')
  const beacons = [
    [796, 505],
    [804, 505],
    [562, 588],
    [1066, 612],
  ]
    .map(([x, y], i) => `<circle class="ts-bc" style="animation-delay:${f(i * 0.45)}s" cx="${x}" cy="${y}" r="2.4" fill="${GOLD}"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0b0908',
      furniture: '#2e2720',
      metal: LEATHER,
      paper: '#e3d6b8',
      light: { idle: '#9a8558', work: '#e8cf96', bright: '#fff0c8' },
      headTop: 203,
      glowAt: [348, 284],
      device,
      wear: {
        // The hood's back, wider than the body, so it shows around the head.
        behind: `<path d="M58 330V248C58 222 74 204 98 198C84 190 72 176 64 156C92 170 118 188 140 196C196 194 242 216 242 248V330Z" fill="${HOOD_DARK}"/>`,
        // The hood's front frames the face inside the body's own columns, so the raised arms stay clear; its opening
        // starts at row 1 and spans cols 4..10, where the eyes are. The scarf wraps below the eyes' lowest row.
        front:
          `<path d="M70 336V250C70 222 104 204 150 204C196 204 230 222 230 250V336ZM88 336V266C88 257 94 252 104 252H210C219 252 225 257 225 266V336Z" fill="${HOOD}" fill-rule="evenodd"/>` +
          `<path d="M88 336V266C88 257 94 252 104 252H210C219 252 225 257 225 266V336" fill="none" stroke="${HOOD_DARK}" stroke-width="3"/>` +
          `<path d="M84 222C104 208 126 206 150 206" fill="none" stroke="${SAND}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 4"/>` +
          `<path d="M196 214C214 222 226 236 228 252" fill="none" stroke="#a48c62" stroke-width="3"/>` +
          `<path class="ts-tail" d="M76 328C58 340 42 358 26 372L36 381C52 368 64 354 82 338Z" fill="${SCARF}"/>` +
          `<path d="M66 319Q150 313 234 319L236 337Q150 343 64 337Z" fill="${SCARF}"/>` +
          `<path d="M68 325Q150 319 232 325M68 331Q150 325 233 331" fill="none" stroke="${SAND}" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 5"/>` +
          `<circle cx="76" cy="330" r="9" fill="#34544f"/>`,
      },
      seatArt:
        // Four stone fingers behind Claude and the thumb at the left: Claude sits in a giant open hand. All of it
        // stays inside the prompt band's crop (x 24.., y 150..).
        finger(112, 46, 184, -9) +
        finger(160, 50, 158, -4) +
        finger(212, 52, 152, 1) +
        finger(262, 48, 166, 6) +
        `<g transform="rotate(-6 44 352)"><rect x="20" y="230" width="46" height="128" rx="23" fill="${HAND}" stroke="${CREASE}" stroke-width="2"/>` +
        `<rect x="24" y="236" width="24" height="28" rx="10" fill="${HAND_LIT}" fill-opacity=".7"/><path d="M25 288q18 6 36 0" fill="none" stroke="${CREASE}" stroke-width="2.5"/></g>` +
        // The palm's top and its rounded edge, with the carved band at the wrist.
        `<path d="M-24 356C-26 340 -10 330 14 330C60 328 120 334 200 334H476V354H-24Z" fill="${HAND_LIT}"/>` +
        `<path d="M-24 354H476V470H-6C-30 440 -34 390 -24 354Z" fill="${HAND_DARK}"/>` +
        `<path d="M-16 366C40 376 120 374 200 368M-6 400C40 414 100 418 180 414" fill="none" stroke="${CREASE}" stroke-width="2.5"/>` +
        `<path d="M330 352H368V470H330Z" fill="#332c24" stroke="${CREASE}" stroke-width="2"/>` +
        [382, 408, 434].map(y => `<circle cx="349" cy="${y}" r="7" fill="#1c1814" stroke="#5a4c3b" stroke-width="2"/>`).join('') +
        [382, 408, 434].map((y, i) => `<circle class="ts-ag" style="animation-delay:${f(0.3 + i * 0.15)}s" cx="349" cy="${y}" r="4.5" fill="${GOLD}"/>`).join('') +
        // The traveller's staff, leaning on the thumb, with a ring charm on a cord.
        '<path d="M22 458L58 162" stroke="#4a3826" stroke-width="7" stroke-linecap="round"/>' +
        `<path d="M55.6 182L58 163" stroke="${SAND}" stroke-opacity=".75" stroke-width="10"/>` +
        `<path d="M57 172q10 8 8 22" fill="none" stroke="#6a5a44" stroke-width="2"/><circle cx="65" cy="199" r="5" fill="none" stroke="${SAND}" stroke-width="2"/>`,
      tableArt:
        // A broken stone tablet laid across the palm, carved with invented marks, on two stones.
        '<path d="M250 346H280V356H250ZM404 346H444V356H404Z" fill="#3a3229"/>' +
        '<path d="M164 330H472V346H164Z" fill="#4a4034" stroke="#2a231c" stroke-width="1.5"/>' +
        '<path d="M166 331H470" stroke="#6c5e49" stroke-width="1.5"/>' +
        `<path class="ts-sg0" d="${MARKS}" fill="none" stroke="#2a231c" stroke-width="1.8"/>` +
        `<path class="ts-rd" d="${MARKS}" fill="none" stroke="${GOLD}" stroke-width="1.8"/>`,
    },
    style:
      // The sky.
      '.ts-tw1{animation:ts-tw 3.6s ease-in-out infinite alternate}.ts-tw2{animation:ts-tw 2.8s ease-in-out -1.4s infinite alternate}' +
      '@keyframes ts-tw{from{opacity:.3}to{opacity:1}}' +
      '.st-done .ts-stars,.st-done .ts-moon{animation:ts-fade 3s ease-out both}@keyframes ts-fade{to{opacity:.2}}' +
      '.ts-haze{animation:ts-drift 46s ease-in-out infinite alternate}.ts-h2{animation-duration:34s;animation-direction:alternate-reverse}' +
      '@keyframes ts-drift{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
      '.ts-mote{animation:ts-mote 16s linear infinite}.st-responding .ts-mote,.st-tool .ts-mote{animation-duration:7s}.st-thinking .ts-mote{animation-duration:26s}' +
      '@keyframes ts-mote{0%{opacity:0;transform:translate(0,0)}15%,85%{opacity:1}100%{opacity:0;transform:translate(280px,-70px)}}' +
      // The hawk wheeling over the legs.
      '.ts-hx{animation:ts-hx 9s ease-in-out infinite alternate}@keyframes ts-hx{from{transform:translateX(-120px)}to{transform:translateX(120px)}}' +
      '.ts-hy{animation:ts-hy 4.5s ease-in-out -2.2s infinite alternate}@keyframes ts-hy{from{transform:translateY(-26px)}to{transform:translateY(26px)}}' +
      '.st-web .ts-hx{animation-duration:3.6s}.st-web .ts-hy{animation-duration:1.8s}' +
      '.ts-wing{transform-box:fill-box;transform-origin:50% 100%;animation:ts-flap 2.6s ease-in-out infinite alternate}@keyframes ts-flap{to{transform:scaleY(.5)}}' +
      // Sand trickling from the head's broken temple, always; the scarf in the wind.
      '.ts-trk{stroke-dasharray:1 3;animation:ts-grain .6s linear infinite}' +
      '.ts-tail{transform-box:fill-box;transform-origin:100% 0;animation:ts-tail 2.2s ease-in-out infinite alternate}@keyframes ts-tail{from{transform:rotate(-7deg)}to{transform:rotate(9deg)}}' +
      // Thinking stirs the mark on the forehead; reading lights the carved channels and the tablet's marks.
      '.ts-3e{opacity:0}.st-thinking .ts-3e{animation:ts-pulse 2.4s ease-in-out infinite alternate}@keyframes ts-pulse{from{opacity:.15}to{opacity:.85}}' +
      '.ts-rd{opacity:0}.st-read .ts-rd{animation:ts-rdon 1.2s ease-out both}@keyframes ts-rdon{to{opacity:.7}}' +
      // Web: lights wink on the far statues, one after another.
      '.ts-bc{opacity:0}.st-web .ts-bc{animation:ts-bc 1.8s ease-in-out infinite}@keyframes ts-bc{0%,100%{opacity:0}40%{opacity:.9}}' +
      // Tool: stones tumble down the broken legs and land in a puff of dust.
      '.ts-peb{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .ts-peb{animation:ts-peb 1.5s ease-in infinite}' +
      '@keyframes ts-peb{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}100%{opacity:.8;transform:translate(-8px,var(--fall)) rotate(300deg)}}' +
      '.ts-pp{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .ts-pp{animation:ts-pp 1.5s ease-out infinite}' +
      '@keyframes ts-pp{0%{opacity:.9;transform:scale(.5)}45%,100%{opacity:0;transform:scale(2.2)}}' +
      // Run: the head wakes. It stirs and lifts, its lids open, its eyes turn to Claude and glow, warm light spreads on
      // its face, dust pours from its cracks and plumes off its dune, the glyphs light.
      '@keyframes ts-on{to{opacity:1}}' +
      '.ts-eg,.ts-eh,.ts-ag,.ts-pour{opacity:0}' +
      '.st-run .ts-lid{animation:ts-open 1.3s ease-out .2s both}@keyframes ts-open{to{transform:translateY(-17px)}}' +
      '.st-run .ts-ir{animation:ts-look 2.6s ease-in-out .3s both}@keyframes ts-look{to{transform:translate(15px,6px)}}' +
      '.st-run .ts-eg{animation:ts-on 1.4s ease-out .3s both}.st-run .ts-eh{animation:ts-eh 2s ease-out .4s both}@keyframes ts-eh{to{opacity:.85}}' +
      '.st-run .ts-lh{animation:ts-wk 1.8s ease-out .4s both}@keyframes ts-wk{to{opacity:.3}}' +
      '.st-run .ts-hd{animation:ts-turn 3.2s ease-in-out both}@keyframes ts-turn{to{transform:rotate(7deg)}}' +
      '.st-run .ts-pour{animation:ts-on .5s ease-out .5s both}' +
      '.st-run .ts-grain{animation:ts-grain .45s linear infinite}.ts-grain{stroke-dasharray:1 3}@keyframes ts-grain{to{stroke-dashoffset:-4}}' +
      '.st-run .ts-ag{animation:ts-on .7s ease-out both}' +
      '.ts-cp,.ts-pl{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .ts-cp{animation:ts-cp 2.2s ease-out both}' +
      '@keyframes ts-cp{0%{opacity:0;transform:scale(.4)}25%{opacity:.8}100%{opacity:0;transform:translateY(-50px) scale(2)}}' +
      '.st-run .ts-pl{animation:ts-pl 3s ease-out both}' +
      '@keyframes ts-pl{0%{opacity:0;transform:scale(.5)}30%{opacity:.6}100%{opacity:.3;transform:translateY(-36px) scale(1.5)}}' +
      // Error: the raised forearm cracks at the elbow, falls and crashes beside the head in a cloud of dust.
      '.ts-crk{opacity:0}.st-error .ts-crk{animation:ts-crk 1.2s ease-out both}@keyframes ts-crk{0%{opacity:0}12%{opacity:.9}100%{opacity:0}}' +
      '.st-error .ts-fa{animation:ts-fall 1.2s linear .1s both}' +
      '@keyframes ts-fall{0%{transform:translate(0,0) rotate(0)}12%{transform:translate(2px,4px) rotate(5deg)}22%{transform:translate(6px,18px) rotate(8deg)}' +
      '40%{transform:translate(26px,113px) rotate(14deg)}58%{transform:translate(57px,258px) rotate(22deg)}76%{transform:translate(99px,446px) rotate(30deg)}' +
      '90%{transform:translate(135px,620px) rotate(30deg)}94%{transform:translate(146px,660px) rotate(22deg)}97%{transform:translate(146px,649px) rotate(20deg)}100%{transform:translate(146px,660px) rotate(19deg)}}' +
      '.ts-puff{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ts-puff{animation:ts-puff 2.8s ease-out both}' +
      '@keyframes ts-puff{0%{opacity:0;transform:translate(0,0) scale(.3)}10%{opacity:1}100%{opacity:.4;transform:translate(var(--dx),-100px) scale(2)}}' +
      '.ts-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ts-ring{animation:ts-ring 1.6s ease-out 1.22s both}' +
      '@keyframes ts-ring{0%{opacity:0;transform:scale(.4)}4%{opacity:.8;transform:scale(.55)}100%{opacity:0;transform:scale(5)}}' +
      '.ts-chip{opacity:0}.st-error .ts-chip{animation:ts-chip 1.1s ease-out 1.24s both}' +
      '@keyframes ts-chip{0%{opacity:0;transform:translate(0,0)}4%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-error .ts-qk{animation:ts-qk .55s ease-in-out 1.22s 1}' +
      '@keyframes ts-qk{0%,100%{transform:translate(0,0)}20%{transform:translate(-4px,3px)}45%{transform:translate(4px,-2px)}70%{transform:translate(-2px,2px)}}' +
      // Done: dawn comes up between the legs, and its light falls on the head's face.
      '.ts-sun,.ts-dawn,.ts-lit{opacity:0}' +
      '.st-done .ts-sun{animation:ts-rise 3.2s ease-out both}@keyframes ts-rise{0%{opacity:0;transform:translateY(70px)}25%{opacity:1}100%{opacity:1;transform:translateY(0)}}' +
      '.st-done .ts-dawn{animation:ts-dawn 3s ease-out both}@keyframes ts-dawn{to{opacity:.35}}' +
      '.st-done .ts-lit{animation:ts-on 2.6s ease-out .2s both}',
    scenery:
      '<defs>' +
      '<linearGradient id="ts-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07070a"/><stop offset=".42" stop-color="#0d0c10"/><stop offset=".64" stop-color="#1c1814"/><stop offset="1" stop-color="#14110e"/></linearGradient>' +
      '<linearGradient id="ts-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1712"/><stop offset="1" stop-color="#0a0807"/></linearGradient>' +
      '<linearGradient id="ts-dune" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262019"/><stop offset="1" stop-color="#0c0a08"/></linearGradient>' +
      `<linearGradient id="ts-mn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MOON}" stop-opacity=".22"/><stop offset=".3" stop-color="${MOON}" stop-opacity=".07"/><stop offset=".62" stop-color="${MOON}" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="ts-mh"><stop offset="0" stop-color="#c3ccd6" stop-opacity=".2"/><stop offset=".3" stop-color="#c3ccd6" stop-opacity=".06"/><stop offset="1" stop-color="#c3ccd6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-mw"><stop offset="0" stop-color="#b9a88a" stop-opacity=".12"/><stop offset="1" stop-color="#b9a88a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-hz"><stop offset="0" stop-color="#6b553c" stop-opacity=".3"/><stop offset="1" stop-color="#6b553c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-eye"><stop offset="0" stop-color="#fff4cc"/><stop offset=".45" stop-color="#f6c862" stop-opacity=".85"/><stop offset="1" stop-color="#e09a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-eh"><stop offset="0" stop-color="#f6c862" stop-opacity=".7"/><stop offset=".35" stop-color="#e0a048" stop-opacity=".26"/><stop offset="1" stop-color="#e0a048" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-dust"><stop offset="0" stop-color="#8f7d60" stop-opacity=".6"/><stop offset=".6" stop-color="#6a5b46" stop-opacity=".28"/><stop offset="1" stop-color="#6a5b46" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-cloud"><stop offset="0" stop-color="#ad9a7b" stop-opacity=".8"/><stop offset=".55" stop-color="#7d6c54" stop-opacity=".4"/><stop offset="1" stop-color="#6a5b46" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-sung"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".85"/><stop offset=".25" stop-color="#f6b866" stop-opacity=".4"/><stop offset="1" stop-color="#e08a48" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-dw"><stop offset="0" stop-color="#f4b06a"/><stop offset=".45" stop-color="#b8683c" stop-opacity=".45"/><stop offset="1" stop-color="#8a4a30" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ts-face" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffcf86" stop-opacity=".6"/><stop offset=".55" stop-color="#f0a85e" stop-opacity=".24"/><stop offset="1" stop-color="#f0a85e" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ts-sky)"/>' +
      '<ellipse cx="820" cy="220" rx="980" ry="120" transform="rotate(-14 820 220)" fill="url(#ts-mw)"/>' +
      `<g class="ts-stars"><path class="ts-tw1" d="${dots(starA, 3.2)}" fill="#ece4d2"/><path class="ts-tw2" d="${dots(starB, 2.6)}" fill="#e0d6c2"/>` +
      `<path d="${dots(starC, 2)}" fill="#d8cdb8" fill-opacity=".45"/></g>` +
      // A small cool moon above the raised hand, the light that picks out the statues' tops, and its wash on the left.
      '<ellipse cx="190" cy="420" rx="420" ry="460" fill="url(#ts-mh)" fill-opacity=".5"/>' +
      '<g class="mv-t"><g class="ts-moon"><circle cx="330" cy="60" r="120" fill="url(#ts-mh)"/><circle cx="330" cy="60" r="21" fill="#d3d8d4" fill-opacity=".75"/>' +
      '<path d="M320 52a6 5 0 1 0 12 0a6 5 0 1 0 -12 0M334 68a4 3 0 1 0 8 0a4 3 0 1 0 -8 0" fill="#aab1b2" fill-opacity=".55"/></g></g>' +
      // Dawn and the sun, behind the far right.
      '<g class="mv-r"><g class="mv-b"><ellipse class="ts-dawn" cx="1430" cy="630" rx="880" ry="420" fill="url(#ts-dw)"/>' +
      '<g class="ts-sun"><circle cx="1430" cy="612" r="240" fill="url(#ts-sung)"/><circle cx="1430" cy="612" r="44" fill="#ffe2a8"/></g></g></g>' +
      // The arm that reaches in from a colossus beyond the left edge: shoulder and upper arm; the forearm is drawn last.
      `<path d="M-70 30C10 20 96 62 104 142C110 214 66 262 -70 272Z" fill="${BACK}" stroke="${RIM}" stroke-width="2"/>` +
      '<path d="M-40 54C22 52 74 92 80 148M-50 86C8 86 52 116 56 160" fill="none" stroke="#28211a" stroke-width="3"/>' +
      `<path d="${limb(70, 150, 252, 132, 86, 66)}" fill="${BACK}" stroke="${RIM}" stroke-width="2"/>` +
      `<circle cx="252" cy="132" r="33" fill="${BACK}" stroke="${RIM}" stroke-width="2"/>` +
      `<path d="M-70 31C10 21 94 62 102 130M66 108L249 100M226 112A33 33 0 0 1 280 116" fill="none" stroke="${MOON}" stroke-opacity=".32" stroke-width="2.5"/>` +
      '<path d="M262 101L276 114L267 126L283 138L270 151L279 163L256 165Z" fill="#2c251c"/>' +
      '<path class="ts-crk" d="M262 101L276 114L267 126L283 138L270 151L279 163" fill="none" stroke="#f2d08a" stroke-width="3" stroke-linejoin="round"/>' +
      `<path d="M120 112L160 128L150 150M200 122L214 140" fill="none" stroke="#0a0807" stroke-width="2.5"/>` +
      // The valley: far ridge, haze, far statues, the ground and the steps, the toppled head in its dune.
      '<g class="mv-b"><g class="ts-qk">' +
      '<path d="M-20 664V606C80 590 180 612 300 598C420 586 520 612 640 604C760 596 860 618 980 606C1100 594 1200 616 1320 602C1440 590 1540 610 1620 600V664Z" fill="#100d0b"/>' +
      '<ellipse cx="800" cy="650" rx="840" ry="120" fill="url(#ts-hz)"/>' +
      `<g fill="${FAR}"><path d="M736 662V628H864V662ZM752 628V590Q752 578 764 578H836Q848 578 848 590V628ZM772 580V536Q772 524 784 522H816Q828 524 828 536V580ZM788 522V500Q788 490 800 490Q812 490 812 500V522ZM790 491V478H796V491ZM797 491V470H803V491ZM804 491V478H810V491Z"/>` +
      '<path d="M546 662V602H542V586L550 580L560 588L570 578L582 586V602H578V662ZM606 662Q608 646 624 646Q640 646 642 662Z"/>' +
      '<path d="M1010 662A56 56 0 0 1 1076 607L1072 626A36 36 0 0 0 1030 662ZM1088 612A56 56 0 0 1 1122 662H1102A36 36 0 0 0 1082 630Z"/></g>' +
      beacons +
      '<rect y="660" width="1600" height="400" fill="url(#ts-gnd)"/>' +
      steps +
      `<g class="ts-haze"><ellipse cx="330" cy="690" rx="520" ry="46" fill="#7a6650" fill-opacity=".08"/><ellipse cx="1250" cy="650" rx="460" ry="40" fill="#7a6650" fill-opacity=".07"/></g>` +
      `<g transform="translate(${HEAD.x} ${HEAD.y}) rotate(${HEAD.tilt})"><g class="ts-hd">${head()}` +
      `<g transform="rotate(${-HEAD.tilt}) translate(${-HEAD.x} ${-HEAD.y})">${trickle}` +
      `<g class="ts-pour" stroke="${SAND}" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round" fill="none">${pour}</g>${crownPuffs}</g></g></g>` +
      '<path d="M-40 1000V792C40 774 130 762 236 766C330 770 410 784 520 812C600 834 660 872 700 1000Z" fill="url(#ts-dune)"/>' +
      '<path d="M-40 792C40 774 130 762 236 766C330 770 410 784 520 812C600 834 660 872 700 1000" fill="none" stroke="#4a4031" stroke-width="2"/>' +
      plumes +
      `<g class="ts-haze ts-h2"><ellipse cx="760" cy="790" rx="560" ry="50" fill="#7a6650" fill-opacity=".06"/></g>` +
      '</g></g>' +
      // The legs on their plinth at the far right, and the hawk wheeling between them.
      '<g class="mv-r"><g class="mv-b"><g class="ts-qk">' +
      '<path d="M1236 600H1640V640H1236Z" fill="#1d1914"/><path d="M1206 640H1640V700H1206Z" fill="#15120e"/>' +
      '<path d="M1236 600.5H1640M1206 640.5H1640" stroke="#40362a" stroke-width="2"/>' +
      `<path d="${Array.from({ length: 11 }, (_, i) => `M${1226 + i * 38} 656h18v14h-18z`).join('')}" fill="none" stroke="#2a231b" stroke-width="2"/>` +
      leg(1330, 176, 1) +
      leg(1530, 240, -1) +
      pebbles +
      '</g>' +
      '<g transform="translate(1440 200)"><g class="ts-hx"><g class="ts-hy"><path class="ts-wing" d="M-22 0Q-11 -12 0 0Q11 -12 22 0" fill="none" stroke="#7a6e5a" stroke-width="3" stroke-linecap="round"/></g></g></g></g></g>' +
      // The forearm, after the head, so it falls in front of it.
      '<g transform="translate(252 132)"><g class="ts-fa"><g transform="rotate(-10)">' +
      `<path d="M-4 -31L146 -25V25L-4 31Z" fill="#1b1713" stroke="${RIM}" stroke-width="2"/>` +
      `<path d="M-4 -31L146 -25" stroke="${MOON}" stroke-opacity=".32" stroke-width="2.5"/>` +
      `<rect x="128" y="-28" width="20" height="56" rx="3" fill="#1d1813" stroke="#3a3126" stroke-width="2"/>` +
      `<path d="M150 -24L196 -28Q208 -28 208 -16V20Q208 26 198 26L150 24Z" fill="#1b1713" stroke="${RIM}" stroke-width="2"/>` +
      `<g fill="#1b1713" stroke="${RIM}" stroke-width="2"><rect x="168" y="-58" width="12" height="36" rx="6"/><rect x="181" y="-64" width="12" height="42" rx="6"/><rect x="194" y="-58" width="12" height="36" rx="6"/>` +
      '<rect x="146" y="-50" width="12" height="30" rx="6" transform="rotate(-24 152 -24)"/></g>' +
      '<path d="M40 -28L56 -6L44 12" fill="none" stroke="#0a0807" stroke-width="2.5"/>' +
      '</g></g></g>' +
      // The crash, pinned with the dune it lands on.
      '<g class="mv-b"><ellipse class="ts-ring" cx="490" cy="820" rx="70" ry="13" fill="none" stroke="#9a8768" stroke-opacity=".22" stroke-width="8"/>' +
      `${puffs}${chips}</g>` +
      `<g fill="#cdbb94" fill-opacity=".5">${motes}</g>`,
    nook:
      // A dark hollow behind the hand, so the fingers stand out from the plinth.
      '<defs><radialGradient id="ts-vig"><stop offset="0" stop-color="#050403" stop-opacity=".65"/><stop offset="1" stop-color="#050403" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="190" cy="250" rx="280" ry="220" fill="url(#ts-vig)"/>',
    front:
      // Sand drifted against the hand.
      '<path d="M-80 470V452C-30 442 40 448 110 454C190 460 260 446 330 448C390 450 430 442 480 446V470Z" fill="#17130f"/>' +
      '<path d="M-80 452C-30 442 40 448 110 454C190 460 260 446 330 448C390 450 430 442 480 446" fill="none" stroke="#3a3126" stroke-width="2"/>',
  }
}
