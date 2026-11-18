import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Clay Town: a plasticine town at night, shot like stop-motion: twelve frames a second and a pixel of boil in every
// shape. Chunky houses with warm windows, a clay moon and stars hung on threads, a railway along the foot of the
// picture running into a tunnel. A command sends a clay train chugging through town, puffing balls of clay smoke; an
// error is the animator's giant thumb squashing a house flat; done pops clay fireworks and lights every window.
type Pt = readonly [number, number]

const INK = '#0c0806'
const TERRA = '#8e3c16'
const MUSTARD = '#7a5a1e'
const CREAM = '#6e5a42'
const TEAL = '#21484a'
const PLUM = '#432a38'
const PINK = '#6a3a44'
const BRICK = '#6a2a1e'
const MOSS = '#2a4222'
const BARK = '#38251a'
const SHEEN = '#fff1d8'
const THREAD = '#a8967a'

/** Numbers for a path, a minus sign doubling as the gap. */
const join = (values: readonly number[]) => values.map((v, i) => (i > 0 && v >= 0 ? ' ' : '') + v).join('')

/** A soft outline through the midpoints of a ring of points, each point bending it: rolled clay, never a sharp corner. */
function smooth(points: readonly Pt[]): string {
  const count = points.length
  const at = (i: number): Pt => points[i % count]!
  const mid = (i: number): Pt => [Math.round((at(i)[0] + at(i + 1)[0]) / 2), Math.round((at(i)[1] + at(i + 1)[1]) / 2)]
  let [px, py] = mid(0)
  let d = `M${px} ${py}`

  for (let i = 1; i <= count; i += 1) {
    const [mx, my] = mid(i)
    d += `q${join([Math.round(at(i)[0]) - px, Math.round(at(i)[1]) - py, mx - px, my - py])}`
    px = mx
    py = my
  }

  return `${d}Z`
}

/** A hand-pressed slab through these corners: each side cut into short steps, every point nudged, every bend rounded. */
function lump(corners: readonly Pt[], next: () => number, wobble = 2, step = 24): string {
  const points: Pt[] = []

  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length]!
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))

    for (let k = 0; k < n; k += 1) {
      const t = k / n
      points.push([a[0] + (b[0] - a[0]) * t + (next() - 0.5) * 2 * wobble, a[1] + (b[1] - a[1]) * t + (next() - 0.5) * 2 * wobble])
    }
  })

  return smooth(points)
}

/** A rolled ball of clay: an ellipse with its edge pushed in and out. */
function blob(cx: number, cy: number, rx: number, ry: number, next: () => number, wobble = 0.08, n = 9): string {
  return smooth(
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      const k = 1.08 * (1 + (next() - 0.5) * 2 * wobble)

      return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as const
    }),
  )
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
]

const n = (v: number) => String(Math.round(v))

/** A thumbprint left in the clay: three nested arcs. The rig's own prints carry their look inline, for the portals. */
function print(x: number, y: number, r: number, turn: number, opacity = 0.3, inline = false): string {
  const arc = (k: number) => `M${f(-r * k)} 0a${f(r * k)} ${f(r * k * 0.8)} 0 0 1 ${f(r * k * 2)} 0`
  const look = inline
    ? ` fill="none" stroke="${INK}" stroke-opacity="${opacity}" stroke-width="1.4" stroke-linecap="round"`
    : ` class="ct-pr"${opacity === 0.3 ? '' : ` stroke-opacity="${opacity}"`}`

  return `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(turn)})" d="${arc(1)}${arc(0.64)}${arc(0.3)}"${look}/>`
}

/** A window: lit, with a warm halo, or dark until done lights it `on` seconds in. Its cross of bars goes in `bars`. */
const bars = (windows: readonly Win[]) =>
  `<path class="ct-wb" d="${windows.map(([x, y, w, h]) => `M${n(x + w / 2)} ${y + 2}v${h - 4}M${x + 2} ${n(y + h / 2)}h${w - 4}`).join('')}"/>`

type Win = readonly [number, number, number, number, number?]

function pane([x, y, w, h, on]: Win): string {
  const box = `x="${x}" y="${y}" width="${w}" height="${h}" rx="5"`
  const lit = `<circle class="ct-wg" cx="${n(x + w / 2)}" cy="${n(y + h / 2)}" r="${n(Math.max(w, h) * 1.25)}"/><rect class="ct-wn" ${box}/>`

  return on === undefined ? `<g class="ct-lit">${lit}</g>` : `<rect class="ct-wd" ${box}/><g class="ct-off" style="--d:${on}s">${lit}</g>`
}

type House = {
  x: number
  base: number
  w: number
  h: number
  roof: number
  wall: string
  top: string
  seed: number
  windows: readonly Win[]
  door?: readonly [number, string]
  chimney?: Pt
}

/** A chunky clay house: a lumpy wall with a shadow side and a moonlit edge, a rounded roof, a chimney that smokes. */
function house(o: House): string {
  const next = random(o.seed)
  const t = o.base - o.h
  const c = o.chimney
  const chimney =
    c === undefined
      ? ''
      : `<path d="${lump(rect(c[0] - 11, c[1], 22, t - c[1] + 10), next, 1.4, 22)}" fill="${o.top}"/>` +
        `<path d="${lump(rect(c[0] - 14, c[1] - 6, 28, 10), next, 1, 14)}" fill="${BRICK}"/>` +
        `<g transform="translate(${c[0]} ${c[1] - 6})">` +
        [0, 1].map(k => `<circle class="ct-cp" style="--k:${f(-k * 1.5 - next())}s" r="7"/>`).join('') +
        '</g>'
  const door =
    o.door === undefined
      ? ''
      : `<path d="M${o.door[0]} ${o.base}V${o.base - 28}a13 13 0 0 1 26 0V${o.base}Z" fill="${o.door[1]}"/>` +
        `<circle cx="${o.door[0] + 20}" cy="${o.base - 15}" r="2.4" fill="${MUSTARD}"/>`

  return (
    chimney +
    `<path d="${lump(rect(o.x, t, o.w, o.h), next, 3.2, 36)}" fill="${o.wall}"/>` +
    `<path class="ct-sh" d="${lump(rect(o.x + o.w * 0.74, t + 6, o.w * 0.24, o.h - 10), next, 1.2, 44)}"/>` +
    `<path class="ct-sn" d="M${o.x + 9} ${t + 16}Q${o.x + 6} ${n(t + o.h / 2)} ${o.x + 10} ${o.base - 14}"/>` +
    `<path d="${lump(
      [
        [o.x - 16, t + 8],
        [o.x + o.w / 2, t - o.roof],
        [o.x + o.w + 16, t + 8],
      ],
      next,
      3.6,
      38,
    )}" fill="${o.top}"/>` +
    `<path class="ct-sn" d="M${o.x - 2} ${t - 1}L${n(o.x + o.w / 2 - 6)} ${n(t - o.roof + 20)}"/>` +
    door +
    o.windows.map(pane).join('') +
    bars(o.windows) +
    print(o.x + o.w * (0.2 + next() * 0.5), t + o.h * (0.3 + next() * 0.4), 7 + next() * 4, next() * 360)
  )
}

/** A lollipop tree: a stubby trunk and a ball of moss-green clay. */
function tree(x: number, base: number, trunk: number, r: number, seed: number): string {
  const next = random(seed)
  const cy = base - trunk - r * 0.7

  return (
    `<path d="${lump(rect(x - 7, base - trunk - 12, 14, trunk + 14), next, 1.2, 18)}" fill="${BARK}"/>` +
    `<path d="${blob(x, cy, r, r * 0.92, next, 0.07, 10)}" fill="${MOSS}"/>` +
    `<path d="${blob(x - r * 0.28, cy - r * 0.32, r * 0.44, r * 0.3, next, 0.1, 7)}" fill="#3f5f31" fill-opacity=".7"/>` +
    print(x + r * 0.25, cy + r * 0.2, r * 0.22, next() * 360)
  )
}

/** A star rolled from clay, hung from the top of the set on a thread. */
function hanging(x: number, y: number, r: number, seed: number): string {
  const next = random(seed)
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const k = (i % 2 === 1 ? 0.5 : 1.3) * (1 + (next() - 0.5) * 0.12)

    return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k] as const
  })

  return (
    `<path d="M${x} -20V${f(y - r)}" stroke="${THREAD}" stroke-opacity=".42" stroke-width="1.3"/>` +
    `<g class="ct-hs"><path d="${smooth(points)}" fill="url(#ct-gs)"/></g>`
  )
}

/** A flat pancake of a cloud with two bumps, hung on its own thread. */
function cloud(cx: number, cy: number, rx: number, seed: number, cls: string): string {
  const next = random(seed)

  return (
    `<g class="${cls}"><path d="M${f(cx + rx * 0.16)} -20V${f(cy - rx * 0.6)}" stroke="${THREAD}" stroke-opacity=".28" stroke-width="1.2"/>` +
    `<path d="${blob(cx, cy, rx * 0.92, rx * 0.26, next, 0.05, 10)}${(
      [
        [-0.6, 0.06, 0.3],
        [-0.26, -0.06, 0.44],
        [0.16, -0.12, 0.5],
        [0.56, 0.04, 0.32],
      ] as const
    )
      .map(([dx, dy, r]) => blob(cx + rx * dx, cy - rx * (0.06 - dy), rx * r, rx * r * 0.9, next, 0.06, 8))
      .join('')}" fill="#261c1f"/>` +
    `<path d="${blob(cx - rx * 0.22, cy - rx * 0.42, rx * 0.22, rx * 0.12, next, 0.1, 7)}${blob(cx + rx * 0.2, cy - rx * 0.56, rx * 0.24, rx * 0.12, next, 0.1, 7)}" fill="#3e3036" fill-opacity=".8"/>` +
    `${print(cx + rx * 0.4, cy + 2, 7, next() * 360, 0.45)}</g>`
  )
}

/** One clay firework: a ball climbs, pops, and its pieces fly out and droop, `delay` seconds into each 2.8 s. */
function burst(cx: number, cy: number, r: number, a: string, b: string, delay: number, seed: number): string {
  const next = random(seed)
  const pieces = (half: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const inner = i >= 5
      const angle = inner ? ((i - 5) * 2 + half + 0.5) * (Math.PI / 2) + next() * 0.4 : ((i * 2 + half) / 10) * Math.PI * 2 + next() * 0.3
      const d = r * (inner ? 0.42 : 0.78 + next() * 0.22)

      return `<circle class="ct-fp" style="--dx:${n(Math.cos(angle) * d)}px;--dy:${n(Math.sin(angle) * d)}px" r="${n((inner ? 6 : 8) + next() * 5)}"/>`
    }).join('')

  return (
    `<g transform="translate(${cx} ${cy})" style="--fd:${delay}s"><circle class="ct-fg" r="${n(r * 1.4)}" fill="url(#ct-fgw)"/>` +
    `<g fill="url(#ct-${a})"><circle class="ct-fr" r="6"/>${pieces(0)}</g><g fill="url(#ct-${b})">${pieces(1)}</g></g>`
  )
}

/** A train wheel with a cross of spokes, turning on its own hub. */
function wheel(x: number, r: number): string {
  return (
    `<g transform="translate(${x} ${-r})"><g class="ct-wh"><circle class="ct-wr" r="${r}"/>` +
    `<path class="ct-ws" d="M${5 - r} 0H${r - 5}M0 ${5 - r}V${r - 5}"/><circle class="ct-wc" r="${n(r * 0.28)}"/></g></g>`
  )
}

/** The clay train, its nose at x 0 and its wheels on y 0: a red engine with a teal cab, two carriages, a smoking funnel. */
function train(next: () => number): string {
  const carriage = (ox: number, body: string): string =>
    `<path d="${lump(rect(ox - 188, -42, 186, 12), next, 1, 60)}" fill="#1e140f"/>` +
    `<path d="${lump(rect(ox - 190, -112, 190, 76), next, 1.8, 40)}" fill="${body}"/>` +
    `<path d="${lump(rect(ox - 198, -126, 206, 20), next, 1.4, 50)}" fill="#24180f"/>` +
    `<path class="ct-sn" d="M${ox - 180} -48H${ox - 10}"/>` +
    [0, 1, 2].map(i => `<rect class="ct-wn" x="${ox - 172 + i * 58}" y="-100" width="40" height="34" rx="9"/>`).join('') +
    print(ox - 40, -58, 7, next() * 360) +
    wheel(ox - 160, 15) +
    wheel(ox - 30, 15) +
    `<rect x="${ox}" y="-46" width="16" height="7" rx="3" fill="#1e140f"/>`
  const puffs = Array.from(
    { length: 7 },
    (_, k) =>
      `<circle class="ct-pf" style="--k:${f(-k * 0.27)}s;--dx:${n(-250 - next() * 110)}px;--dy:${n(-160 - next() * 80)}px" r="14"/>`,
  ).join('')

  return (
    '<path d="M-2 -117L330 -165V-30Z" fill="url(#ct-beam)"/>' +
    carriage(-460, '#285a50') +
    carriage(-250, MUSTARD) +
    `<path d="${lump(rect(-236, -48, 240, 16), next, 1, 60)}" fill="#1e140f"/>` +
    `<path d="${lump(rect(-172, -104, 160, 58), next, 1.8, 40)}" fill="#7a2a1c"/>` +
    '<path d="M-164 -96H-34" stroke="#c0604a" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M-124 -100V-52M-74 -100V-52" stroke="#a07a2a" stroke-width="5" stroke-linecap="round"/>' +
    `<path d="${lump(rect(-30, -106, 26, 62), next, 1.2, 16)}" fill="#2e1d17"/>` +
    `<path d="${lump(
      [
        [-62, -100],
        [-58, -138],
        [-72, -152],
        [-24, -152],
        [-38, -138],
        [-34, -100],
      ],
      next,
      1.2,
      14,
    )}" fill="#2e1d17"/>` +
    `<path d="${blob(-104, -104, 15, 11, next, 0.06, 8)}" fill="#a07a2a"/>` +
    `<path d="${lump(rect(-236, -150, 70, 104), next, 1.6, 36)}" fill="${TEAL}"/>` +
    `<path d="${lump(rect(-246, -162, 88, 18), next, 1.2, 44)}" fill="#24180f"/>` +
    '<rect class="ct-wn" x="-222" y="-136" width="40" height="34" rx="9"/>' +
    `<path d="${lump(
      [
        [-8, -46],
        [16, -6],
        [-14, -6],
      ],
      next,
      1,
      12,
    )}" fill="#3a2a20"/>` +
    '<rect x="-10" y="-126" width="16" height="16" rx="4" fill="#2e1d17"/><circle cx="2" cy="-117" r="8" fill="#ffd890"/>' +
    print(-140, -76, 8, next() * 360) +
    wheel(-200, 15) +
    wheel(-142, 24) +
    wheel(-86, 24) +
    wheel(-30, 15) +
    '<path d="M-142 -20H-86" stroke="#cdb48e" stroke-width="5" stroke-linecap="round"/>' +
    `<g transform="translate(-48 -152)">${puffs}</g>`
  )
}

/** Claude's clay laptop and, beside it, a little clay house it modelled, its window lit by the screen. */
function device(light: string, activity: Activity): string {
  const next = random(5)
  const squashed = activity === 'error' ? ' scale(1.3 .58)' : ''

  return (
    // Two balls of spare clay.
    '<circle cx="184" cy="323" r="7" fill="#7a3a50"/><circle cx="182" cy="320" r="2.6" fill="#b06a80" fill-opacity=".6"/>' +
    '<circle cx="199" cy="325" r="5" fill="#2e6b66"/>' +
    // The laptop: a lumpy base with fat keys, a chunky lid, the lit screen toward Claude.
    '<path d="M244 331Q242 321 254 320L338 318Q350 318 349 326L349 330Q348 334 340 334L251 334Q244 334 244 331Z" fill="#3b5260"/>' +
    `<path d="M254 325h7M267 325h7M280 324h7M293 324h7M306 324h7M319 323h7" stroke="${light}" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>` +
    '<path d="M334 327Q330 319 333 311L352 244Q355 234 365 236L370 237Q379 240 376 250L357 322Q354 332 344 331Z" fill="#3b5260"/>' +
    `<path d="M334 320L353 246L328 256L314 322Z" fill="${light}" fill-opacity=".16"/>` +
    `<path d="M336 320L355 247Q357 241 362 242L345 323Z" fill="${light}"/>` +
    `<path d="M370 250L354 314" stroke="${SHEEN}" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>` +
    print(364, 286, 8, 74, 0.4, true) +
    // The model house.
    `<g transform="translate(400 331)${squashed}">` +
    `<path d="${lump(rect(-17, -26, 34, 26), next, 0.8, 12)}" fill="${MUSTARD}"/>` +
    `<path d="${lump(
      [
        [-24, -23],
        [0, -47],
        [24, -23],
      ],
      next,
      0.8,
      12,
    )}" fill="${TERRA}"/>` +
    `<rect x="-6" y="-19" width="12" height="11" rx="3" fill="${light}"/>` +
    `<path d="M0 -19v11M-6 -13.5h12" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/>` +
    (activity === 'done' ? '<path d="M0 -66l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#e0b048"/>' : '') +
    '</g>'
  )
}

/** Where the far hills run, and the town on the near one. */
const ridge1 = (x: number) => 612 - 24 * Math.sin(x * 0.004 + 2) - 11 * Math.sin(x * 0.013 + 1)
const ridge2 = (x: number) => 690 - 16 * Math.sin(x * 0.006 + 1) - 9 * Math.sin(x * 0.017 + 0.5)

function hill(ridge: (x: number) => number, fill: string): string {
  const points: Pt[] = [[-80, 1060]]

  for (let x = -80; x <= 1680; x += 60) points.push([x, ridge(x)])
  points.push([1680, 1060])

  return `<path d="${smooth(points)}" fill="${fill}"/>`
}

export function clayTownWorld(): World {
  const next = random(23)
  const dim: string[][] = [[], [], []]
  const twinkles: string[] = []

  for (let i = 0; i < 40; i += 1) {
    let x = next() * 1600
    const y = 20 + next() * 500

    if (Math.hypot(x - 250, y - 178) < 110) x += 260

    const r = f(1.2 + next() * 2)
    const level = Math.min(2, Math.floor(next() * 3) + (x > 420 && x < 1180 ? 0 : 1))

    if (i % 5 === 0) twinkles.push(`<circle class="ct-tw" style="animation-delay:${f(-next() * 3)}s" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`)
    else dim[level]!.push(`M${n(x)} ${n(y)}m-${r} 0a${r} ${r} 0 1 0 ${Number(r) * 2} 0a${r} ${r} 0 1 0 -${Number(r) * 2} 0`)
  }

  const stars = dim.map((d, k) => `<path d="${d.join('')}" opacity="${[0.22, 0.4, 0.62][k]}"/>`).join('') + twinkles.join('')

  // The far town on the second hill: tiny houses, some windows lit, the rest waiting for done.
  const bodies: string[] = []
  const roofs: string[] = []
  const lit: string[] = []
  const later: string[][] = [[], [], []]
  const crowns: string[] = []

  for (let i = 0; i < 9; i += 1) {
    const x = 446 + i * 82 + next() * 24
    const w = 22 + next() * 14
    const h = 16 + next() * 10
    const base = ridge2(x + w / 2) + 7
    const rh = 11 + next() * 8
    bodies.push(`M${n(x)} ${n(base)}v${n(-h)}h${n(w)}v${n(h)}Z`)
    roofs.push(`M${n(x - 3)} ${n(base - h)}l${n(w / 2 + 3)} ${n(-rh)}l${n(w / 2 + 3)} ${n(rh)}Z`)
    const win = `M${n(x + w / 2 - 2.5)} ${n(base - h + 5)}h5v6h-5Z`
    ;(i % 3 === 1 ? later[i % 3]! : next() > 0.45 ? lit : later[(i + 1) % 3]!).push(win)
    const tx = x + w + 16 + next() * 20
    const ty = ridge2(tx) + 2
    crowns.push(`M${n(tx)} ${n(ty)}v-14m-7 -4a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`)
  }

  const farTown =
    `<path d="${crowns.join('')}" fill="#140c09" stroke="#140c09" stroke-width="2"/>` +
    `<path d="${bodies.join('')}" fill="#24170f"/>` +
    `<path d="${roofs.join('')}" fill="#2e1a10" stroke="#2e1a10" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${lit.join('')}" fill="#d08a4a" fill-opacity=".7"/>` +
    later.map((d, k) => `<g class="ct-off" style="--d:${0.4 + k * 0.45}s"><path d="${d.join('')}" fill="#d08a4a" fill-opacity=".7"/></g>`).join('')

  const moon =
    '<g transform="translate(250 -20)"><g class="ct-moon"><g transform="translate(-250 20)"><g class="ct-boil ct-b2">' +
    `<path d="M250 -20V110" stroke="${THREAD}" stroke-opacity=".5" stroke-width="1.6"/>` +
    '<circle cx="250" cy="178" r="240" fill="url(#ct-mh)"/>' +
    `<path d="${blob(250, 178, 70, 68, next, 0.035, 11)}" fill="url(#ct-mo)"/>` +
    [
      [226, 158, 13, 10],
      [278, 196, 16, 12],
      [236, 214, 9, 7],
      [286, 150, 8, 6],
      [208, 192, 6, 5],
    ]
      .map(([x, y, rx, ry]) => `<path d="${blob(x!, y!, rx!, ry!, next, 0.12, 7)}" fill="#8a6c42" fill-opacity=".5"/>`)
      .join('') +
    print(262, 170, 12, 30, 0.22) +
    '</g></g></g></g>'

  const bushes = (
    [
      [-10, 800, 34, 20],
      [152, 806, 24, 14],
      [354, 804, 30, 18],
      [440, 810, 22, 13],
    ] as const
  )
    .map(([x, y, rx, ry]) => blob(x, y, rx, ry, next, 0.1, 9))
    .join('')
  const pine = (x: number, base: number): string =>
    `<path d="${lump(rect(x - 6, base - 40, 12, 40), next, 1, 14)}" fill="${BARK}"/>` +
    [
      [44, 30, 110],
      [36, 80, 150],
      [26, 124, 188],
    ]
      .map(([w, y0, y1]) => `<path d="${lump([[x - w!, base - y0!], [x, base - y1!], [x + w!, base - y0!]], next, 1.5, 22)}" fill="#22381e"/>`)
      .join('')

  const owl =
    '<g transform="translate(392 680)">' +
    '<path d="M-14 4Q-18 -20 -10 -26L-12 -37L-4 -29Q0 -30 4 -29L12 -37L10 -26Q18 -20 14 4Q0 10 -14 4Z" fill="#4a3628"/>' +
    '<path d="M-8 -2Q0 6 8 -2Q6 -12 0 -12Q-6 -12 -8 -2Z" fill="#6e5440"/>' +
    '<path class="ct-owlc" d="M-9 -19q3 2 6 0M3 -19q3 2 6 0" fill="none" stroke="#1a100a" stroke-width="2" stroke-linecap="round"/>' +
    '<g class="ct-owlo"><circle cx="-5.5" cy="-19" r="5" fill="#e8d6a8"/><circle cx="5.5" cy="-19" r="5" fill="#e8d6a8"/>' +
    '<g class="ct-owlp" fill="#1a100a"><circle cx="-5.5" cy="-18" r="2.2"/><circle cx="5.5" cy="-18" r="2.2"/></g></g>' +
    '<path d="M-1.5 -14L0 -10L1.5 -14Z" fill="#c99a3a"/></g>'

  const hero = house({
    x: 170,
    base: 800,
    w: 170,
    h: 150,
    roof: 120,
    wall: CREAM,
    top: TERRA,
    seed: 11,
    door: [243, TEAL],
    chimney: [304, 552],
    windows: [
      [190, 670, 34, 30],
      [286, 670, 34, 30, 0.5],
      [190, 732, 34, 30],
      [286, 732, 34, 30, 1.1],
    ],
  })
  const crumbs = (
    [
      [178, 794, -70, CREAM],
      [196, 798, -40, TERRA],
      [314, 796, 46, CREAM],
      [334, 792, 80, TERRA],
      [250, 798, -14, MUSTARD],
    ] as const
  )
    .map(([x, y, dx, color]) => `<circle class="ct-crumb" style="--dx:${dx}px" cx="${x}" cy="${y}" r="5" fill="${color}"/>`)
    .join('')

  const leftTown =
    '<g class="ct-boil">' +
    house({ x: 118, base: 772, w: 88, h: 120, roof: 64, wall: TEAL, top: MUSTARD, seed: 13, windows: [[144, 672, 20, 24, 0.6]] }) +
    pine(14, 806) +
    house({
      x: 40,
      base: 800,
      w: 100,
      h: 220,
      roof: 90,
      wall: PINK,
      top: PLUM,
      seed: 17,
      door: [54, BRICK],
      windows: [
        [56, 600, 26, 30],
        [100, 600, 26, 30, 0.3],
        [56, 660, 26, 30, 0.9],
        [100, 660, 26, 30],
        [100, 724, 26, 30],
      ],
    }) +
    `<g transform="translate(255 800)"><g class="ct-hero"><g transform="translate(-255 -800)"><g class="ct-boil ct-b3">${hero}` +
    `<g class="ct-dent">${print(255, 560, 24, 0, 0.6)}</g></g></g></g></g>` +
    crumbs +
    tree(392, 806, 60, 42, 19) +
    owl +
    `<path d="${bushes}" fill="#22381c"/>` +
    '</g>'

  const cat =
    '<g transform="translate(1298 412)" fill="#0e0907">' +
    '<path d="M-13 0Q-16 -22 -6 -30Q8 -32 12 -18Q16 -4 13 0Z"/><circle cx="0" cy="-36" r="10"/>' +
    '<path d="M-9 -40L-8 -52L-1 -45ZM9 -40L8 -52L1 -45Z"/>' +
    '<g transform="translate(11 -3)"><path class="ct-tail" d="M0 0Q16 -2 18 -18Q19 -28 12 -32" fill="none" stroke="#0e0907" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g class="ct-ceye" fill="#d8b050"><circle cx="-4" cy="-37" r="1.8"/><circle cx="4" cy="-37" r="1.8"/></g></g>'
  const clock =
    '<g transform="translate(1454 410)"><circle r="22" fill="#9c8458" stroke="#2a1a14" stroke-width="5"/>' +
    '<path d="M0 -16V-13M16 0H13M0 16V13M-16 0H-13" stroke="#2a1a14" stroke-width="3" stroke-linecap="round"/>' +
    '<g class="ct-hh"><path d="M0 2V-10" stroke="#2a1a14" stroke-width="4" stroke-linecap="round"/></g>' +
    '<g class="ct-hm"><path d="M0 3V-16" stroke="#2a1a14" stroke-width="3" stroke-linecap="round"/></g><circle r="3" fill="#2a1a14"/></g>'

  const rightTown =
    '<g class="mv-r"><g class="mv-t">' +
    hanging(1330, 112, 13, 31) +
    hanging(1540, 60, 15, 37) +
    burst(1290, 165, 110, 'g3', 'g1', 0.3, 41) +
    burst(1515, 120, 90, 'g2', 'g3', 0.65, 43) +
    '</g><g class="ct-boil ct-b2">' +
    `<path d="${smooth([
      [1110, 1060],
      [1130, 760],
      [1170, 660],
      [1230, 620],
      [1340, 606],
      [1460, 600],
      [1580, 604],
      [1690, 620],
      [1700, 1060],
    ])}" fill="#1d130e"/>` +
    '<path d="M1180 642Q1260 614 1340 608T1660 606" fill="none" stroke="#3a2a20" stroke-opacity=".6" stroke-width="3"/>' +
    tree(1196, 648, 30, 34, 29) +
    house({
      x: 1225,
      base: 614,
      w: 145,
      h: 118,
      roof: 82,
      wall: CREAM,
      top: BRICK,
      seed: 21,
      door: [1284, TEAL],
      chimney: [1340, 430],
      windows: [
        [1244, 516, 30, 28],
        [1318, 516, 30, 28, 0.7],
      ],
    }) +
    house({
      x: 1408,
      base: 610,
      w: 92,
      h: 236,
      roof: 104,
      wall: PLUM,
      top: TEAL,
      seed: 25,
      door: [1441, BRICK],
      windows: [
        [1424, 456, 24, 30],
        [1462, 456, 24, 30, 1.3],
        [1424, 520, 24, 30, 0.4],
        [1462, 520, 24, 30],
      ],
    }) +
    clock +
    house({
      x: 1528,
      base: 616,
      w: 132,
      h: 138,
      roof: 72,
      wall: MUSTARD,
      top: PLUM,
      seed: 27,
      chimney: [1562, 424],
      windows: [
        [1546, 502, 30, 30],
        [1600, 502, 30, 30],
        [1546, 562, 30, 28, 0.9],
      ],
    }) +
    cat +
    '</g></g>'

  const arch = 'M1046 1010V880A64 64 0 0 1 1174 880V1010Z'
  const stones = [
    ...Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI + (i / 8) * Math.PI

      return [1110 + Math.cos(a) * 72, 880 + Math.sin(a) * 72] as const
    }),
    [1040, 930],
    [1040, 976],
    [1180, 930],
    [1180, 976],
  ]
    .map(([x, y], i) => {
      const r = 10 + (i % 3) * 1.5

      return `M${n(x - r)} ${n(y)}a${r} ${r - 2} 0 1 0 ${r * 2} 0a${r} ${r - 2} 0 1 0 ${-r * 2} 0`
    })
    .join('')

  const thumb =
    '<g class="ct-thumb"><g class="ct-th">' +
    `<path d="${lump(
      [
        [190, -300],
        [320, -300],
        [324, 440],
        [306, 512],
        [255, 532],
        [204, 512],
        [186, 440],
      ],
      next,
      2,
      70,
    )}" fill="#8e6450"/>` +
    `<path d="M202 -280V430Q204 480 224 506" fill="none" stroke="${SHEEN}" stroke-opacity=".14" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="${lump(
      [
        [222, 436],
        [288, 436],
        [294, 492],
        [255, 514],
        [216, 492],
      ],
      next,
      1.4,
      16,
    )}" fill="#c49884" fill-opacity=".55"/>` +
    `<path d="M208 340Q255 356 302 340M214 357Q255 371 296 357" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>` +
    '</g></g>'

  const pigeon =
    '<g class="ct-pg"><g transform="translate(1720 140)"><g class="ct-pgf"><g class="ct-boil">' +
    `<path d="${blob(0, 0, 22, 12, next, 0.06, 9)}" fill="#4c4650"/>` +
    '<circle cx="-20" cy="-8" r="9" fill="#5a5460"/><path d="M-29 -9L-36 -6L-29 -3Z" fill="#c99a3a"/>' +
    `<circle cx="-22" cy="-10" r="1.8" fill="${INK}"/><path d="M18 -2L34 -8L30 4Z" fill="#3e3842"/>` +
    '<g class="ct-wing"><path d="M-6 -4Q4 -30 20 -26Q14 -10 8 -2Z" fill="#6a6470"/></g></g></g></g></g>'

  const ball = (id: string, light: string, base: string, dark: string) =>
    `<radialGradient id="ct-${id}" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="${light}"/><stop offset=".6" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>`

  const pickets = Array.from({ length: 15 }, (_, i) => {
    const x = -34 + i * 32

    return `M${x} 448V374Q${x + 11} 356 ${x + 22} 374V448Z`
  }).join('')
  const nookNext = random(51)
  const cobbles = Array.from({ length: 10 }, (_, i) => blob(-36 + i * 50 + nookNext() * 12, 458 + nookNext() * 8, 15, 5, nookNext, 0.12, 5)).join('')
  const desk = random(9)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: INK,
      furniture: '#5c4220',
      metal: '#3b5260',
      paper: '#eadcc4',
      light: { idle: '#c8874e', work: '#ffb36b', bright: '#ffd9a6' },
      headTop: 194,
      glowAt: [346, 282],
      device,
      wear: {
        // A clay beanie: a teal dome, a ribbed brim that stops above the eyes, a mustard pompom.
        front:
          '<path d="M70 238C68 202 104 186 150 186C196 186 232 202 230 238Z" fill="#2e6b66"/>' +
          '<path d="M92 216Q108 198 138 193" fill="none" stroke="#5fa59c" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>' +
          print(190, 212, 8, 20, 0.35, true) +
          '<path d="M64 236Q150 228 236 236V249Q150 257 64 249Z" fill="#3d8279"/>' +
          `<path d="${Array.from({ length: 14 }, (_, i) => `M${74 + i * 12} 238v11`).join('')}" stroke="#24524d" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>` +
          '<circle cx="150" cy="180" r="15" fill="#c9973a"/><circle cx="145" cy="175" r="6" fill="#e8c274" fill-opacity=".7"/>' +
          print(154, 184, 6, 200, 0.3, true),
      },
      // A squat clay pouf.
      seatArt:
        '<path d="M106 352Q98 404 102 452Q151 462 200 452Q204 404 196 352Q151 344 106 352Z" fill="#4a2c3a"/>' +
        '<path d="M116 366Q110 404 114 440" fill="none" stroke="#74506a" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="151" cy="351" rx="46" ry="7" fill="#5e3a4c"/>' +
        print(172, 404, 9, 40, 0.35, true) +
        print(132, 432, 6, 160, 0.3, true),
      // A lumpy slab of a desk on two rolled legs.
      tableArt:
        `<path d="${lump(rect(164, 330, 308, 17), desk, 1.2, 28)}" fill="#5c4220"/>` +
        '<path d="M172 333Q310 329 464 333" fill="none" stroke="#94723a" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M186 345Q181 400 178 452Q195 460 212 452Q206 400 205 345ZM432 345Q431 400 426 452Q443 460 460 452Q456 400 451 345Z" fill="#4e381c"/>' +
        print(250, 340, 6, 10, 0.35, true) +
        print(196, 400, 6, 90, 0.3, true) +
        print(444, 410, 6, 270, 0.3, true),
    },
    style:
      `.ct-pr{fill:none;stroke:${INK};stroke-opacity:.3;stroke-width:1.4;stroke-linecap:round}` +
      `.ct-sn{fill:none;stroke:${SHEEN};stroke-opacity:.2;stroke-width:7;stroke-linecap:round}.ct-sh{fill:${INK};fill-opacity:.3}` +
      `.ct-wg{fill:url(#ct-wg)}.ct-wn{fill:url(#ct-win)}.ct-wd{fill:#1c120d}.ct-wb{fill:none;stroke:${INK};stroke-opacity:.55;stroke-width:2.4}` +
      `.ct-wr{fill:${MUSTARD};stroke:#140c08;stroke-width:3}.ct-ws{stroke:#140c08;stroke-opacity:.6;stroke-width:3;stroke-linecap:round}.ct-wc{fill:#e0c690;fill-opacity:.45}` +
      '.ct-cp,.ct-pf{fill:url(#ct-gp)}' +
      // Stop-motion boil: every shape shivers a pixel, three frames to a quarter second; the train rattles it harder.
      '.ct-boil{animation:ct-boil .25s steps(1) infinite}.ct-b2{animation-delay:-.08s}.ct-b3{animation-delay:-.17s}' +
      '@keyframes ct-boil{0%{transform:translate(0,0)}33%{transform:translate(1px,-.8px)}67%{transform:translate(-.8px,.9px)}}' +
      '.st-run .ct-boil{animation-name:ct-rattle}@keyframes ct-rattle{0%{transform:translate(0,0)}33%{transform:translate(1.8px,-1.4px)}67%{transform:translate(-1.6px,1.2px)}}' +
      '@keyframes ct-spin{to{transform:rotate(360deg)}}@keyframes ct-on{to{opacity:1}}@keyframes ct-out{to{opacity:0}}' +
      // Windows: a candle's wobble; the dark ones pop on one by one when done.
      '.ct-lit{animation:ct-cand 2.6s steps(1) infinite}@keyframes ct-cand{0%{opacity:1}40%{opacity:.84}70%{opacity:.94}}' +
      '.ct-off{opacity:0}.st-done .ct-off{animation:ct-on .1s steps(1) var(--d) both}' +
      // The sky: twinkles, the moon and stars on their threads, the clouds sliding a frame at a time.
      '.ct-tw{animation:ct-tw 1.6s steps(1) infinite}@keyframes ct-tw{50%{opacity:.25}}' +
      '.ct-moon{animation:ct-sway 6s steps(18) infinite alternate}@keyframes ct-sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}' +
      '.st-thinking .ct-moon{animation:ct-sway2 2.4s steps(10) infinite alternate}@keyframes ct-sway2{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.ct-hs{transform-box:fill-box;transform-origin:50% 0;animation:ct-twist 4s steps(8) infinite alternate}@keyframes ct-twist{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.st-done .ct-hs{transform-origin:center;animation:ct-spin 1.5s steps(12) infinite}' +
      '.ct-cl{animation:ct-cl 26s steps(78) infinite alternate}.ct-cl2{animation-direction:alternate-reverse}@keyframes ct-cl{to{transform:translateX(46px)}}' +
      // Chimney smoke, the cat on the roof, the owl, the tower clock.
      '.ct-cp{opacity:0;animation:ct-cp 3s steps(30) var(--k) infinite}' +
      '@keyframes ct-cp{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.8}100%{opacity:0;transform:translate(-26px,-90px) scale(2)}}' +
      '.st-responding .ct-cp,.st-tool .ct-cp{animation-duration:1.8s}' +
      '.ct-tail{transform-box:fill-box;transform-origin:0 100%;animation:ct-tail 2.4s steps(8) infinite alternate}@keyframes ct-tail{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}' +
      '.st-responding .ct-tail{animation-duration:1.2s}' +
      '.ct-ceye{animation:ct-blink 5s steps(1) infinite}@keyframes ct-blink{93%,97%{opacity:0}}' +
      '.ct-owlo{opacity:0}.st-read .ct-owlo{opacity:1}.st-read .ct-owlc{opacity:0}' +
      '.st-read .ct-owlp{animation:ct-look 1.6s steps(4) infinite alternate}@keyframes ct-look{from{transform:translate(-1.5px,.5px)}to{transform:translate(1.5px,1.5px)}}' +
      '.ct-hm{animation:ct-spin 60s steps(60) infinite}.ct-hh{animation:ct-spin 720s steps(60) infinite}' +
      '.st-tool .ct-hm{animation-duration:1.2s;animation-timing-function:steps(12)}.st-tool .ct-hh{animation-duration:14.4s}' +
      // Web: a clay pigeon flaps across the top.
      '.ct-pg{display:none}.st-web .ct-pg{display:inline}.ct-pgf{animation:ct-pgf 8s steps(96) infinite}@keyframes ct-pgf{to{transform:translateX(-1900px)}}' +
      '.ct-wing{transform-box:fill-box;transform-origin:50% 100%;animation:ct-flap .34s linear infinite}@keyframes ct-flap{0%,49%{transform:none}50%,100%{transform:scaleY(-.6)}}' +
      // Run: the signal drops to clear, and the train chugs through town into the tunnel, frame by frame.
      '.ct-train{display:none}.st-run .ct-train{display:inline}' +
      '.ct-go{transform:translateX(560px);animation:ct-go 8.5s steps(102) infinite}@keyframes ct-go{from{transform:translateX(60px)}to{transform:translateX(1830px)}}' +
      '.ct-chug{animation:ct-chug .25s steps(1) infinite}@keyframes ct-chug{0%{transform:translate(0,0)}33%{transform:translate(.8px,-2.2px)}67%{transform:translate(-.6px,-.8px)}}' +
      '.ct-wh{animation:ct-spin .5s steps(6) infinite}' +
      '.ct-pf{opacity:0;animation:ct-pf 1.9s steps(23) var(--k) infinite}' +
      '@keyframes ct-pf{0%{opacity:.95;transform:translate(0,0) scale(.45)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.7)}}' +
      '.st-run .ct-arm{animation:ct-arm .5s steps(5) .1s both}@keyframes ct-arm{to{transform:rotate(40deg)}}' +
      '.ct-clear{opacity:0}.st-run .ct-clear{animation:ct-on .1s steps(1) .55s both}.st-run .ct-stop{animation:ct-out .1s steps(1) .55s both}' +
      // Error: the animator's thumb comes down and squashes the house flat; its windows go out, crumbs fly.
      '.ct-thumb{display:none}.st-error .ct-thumb{display:inline}' +
      '.ct-th{animation:ct-th 2.6s both}' +
      '@keyframes ct-th{0%{transform:translateY(-780px);animation-timing-function:steps(5)}16%{transform:translateY(0);animation-timing-function:steps(4)}' +
      '30%,50%{transform:translateY(140px);animation-timing-function:steps(6)}72%{transform:translateY(-150px);animation-timing-function:steps(9)}100%{transform:translateY(-820px)}}' +
      '.st-error .ct-hero{animation:ct-squash 2.6s both}' +
      '@keyframes ct-squash{0%,16%{transform:scale(1,1);animation-timing-function:steps(4)}30%,50%{transform:scale(1.3,.5);animation-timing-function:steps(3)}62%,100%{transform:scale(1.22,.58)}}' +
      '.st-error .ct-hero .ct-lit{animation:ct-dim .4s steps(2) .75s both}@keyframes ct-dim{to{opacity:.12}}' +
      '.ct-dent{opacity:0}.st-error .ct-dent{animation:ct-on .1s steps(1) 1.25s both}' +
      '.ct-crumb{opacity:0}.st-error .ct-crumb{animation:ct-crumb 1.1s steps(11) .75s both}' +
      '@keyframes ct-crumb{0%{opacity:1;transform:translate(0,0)}55%{opacity:1;transform:translate(var(--dx),-34px)}100%{opacity:0;transform:translate(calc(var(--dx) * 1.4),6px)}}' +
      // Done: clay fireworks climb and pop, small and soft, each every 2.8 s.
      '.ct-fp,.ct-fr,.ct-fg{opacity:0}' +
      '.st-done .ct-fr{animation:ct-fr 2.8s var(--fd) infinite}' +
      '@keyframes ct-fr{0%{opacity:1;transform:translateY(300px);animation-timing-function:steps(9)}30%{opacity:1;transform:translateY(0)}31%,100%{opacity:0;transform:translateY(0)}}' +
      '.st-done .ct-fp{animation:ct-fp 2.8s var(--fd) infinite}' +
      '@keyframes ct-fp{0%,30%{opacity:0;transform:translate(0,0) scale(.4)}31%{opacity:1;transform:translate(0,0) scale(.5);animation-timing-function:steps(11)}' +
      '68%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(1);animation-timing-function:steps(9)}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 46px)) scale(.55)}}' +
      '.st-done .ct-fg{animation:ct-fg 2.8s var(--fd) infinite}@keyframes ct-fg{0%,30%{opacity:0}36%{opacity:1}78%,100%{opacity:0}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ct-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090607"/><stop offset=".5" stop-color="#140c0b"/><stop offset=".7" stop-color="#2a1912"/></linearGradient>' +
      '<radialGradient id="ct-tg"><stop offset="0" stop-color="#c8662a" stop-opacity=".18"/><stop offset="1" stop-color="#c8662a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ct-mh"><stop offset="0" stop-color="#ecd49c" stop-opacity=".24"/><stop offset=".45" stop-color="#ecd49c" stop-opacity=".07"/><stop offset="1" stop-color="#ecd49c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ct-mo" cx=".4" cy=".36" r=".72"><stop offset="0" stop-color="#e8d2a0"/><stop offset=".6" stop-color="#bd9c64"/><stop offset="1" stop-color="#7c6038"/></radialGradient>' +
      '<radialGradient id="ct-wg"><stop offset="0" stop-color="#ffae5a" stop-opacity=".42"/><stop offset="1" stop-color="#ffae5a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ct-win" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#ffdc9a"/><stop offset="1" stop-color="#e8903e"/></radialGradient>' +
      ball('gp', '#b8a898', '#7f7064', '#4a3e37') +
      ball('gs', '#ffe6a8', '#d6ac5c', '#8a6a2e') +
      ball('g1', '#ffe08a', '#dca23a', '#8a5e1a') +
      ball('g2', '#ffc0cc', '#e07a8e', '#8e4256') +
      ball('g3', '#b0f0e2', '#4cae9e', '#24645a') +
      ball('g4', '#ffbc94', '#d4733a', '#8a3a16') +
      '<radialGradient id="ct-fgw"><stop offset="0" stop-color="#ffd8a0" stop-opacity=".3"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ct-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd890" stop-opacity=".3"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ct-dark" gradientUnits="userSpaceOnUse" x1="1046" y1="0" x2="1174" y2="0"><stop offset="0" stop-color="#050302" stop-opacity=".1"/><stop offset=".7" stop-color="#050302" stop-opacity=".96"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ct-sky)"/>' +
      '<ellipse cx="220" cy="720" rx="540" ry="250" fill="url(#ct-tg)"/><ellipse cx="1440" cy="560" rx="380" ry="200" fill="url(#ct-tg)"/>' +
      `<g fill="#f0d8a0">${stars}</g>` +
      hanging(96, 92, 14, 33) +
      hanging(470, 50, 10, 35) +
      cloud(640, 112, 140, 61, 'ct-cl') +
      moon +
      cloud(330, 246, 104, 63, 'ct-cl ct-cl2') +
      cloud(1040, 262, 120, 65, 'ct-cl ct-cl2') +
      burst(410, 120, 100, 'g1', 'g4', -0.6, 45) +
      burst(100, 372, 84, 'g2', 'g1', 1, 47) +
      hill(ridge1, '#1c120e') +
      hill(ridge2, '#160e0b') +
      farTown +
      `<path d="${smooth([
        [-60, 1060],
        [-60, 800],
        [200, 792],
        [460, 800],
        [700, 780],
        [960, 790],
        [1200, 776],
        [1660, 790],
        [1660, 1060],
      ])}" fill="#110a08"/>` +
      leftTown +
      rightTown +
      thumb +
      '<g class="mv-b">' +
      '<rect x="-60" y="962" width="1250" height="30" rx="14" fill="#22160f"/>' +
      '<path d="M-40 986H1180" stroke="#3a2618" stroke-width="10" stroke-dasharray="10 18"/>' +
      '<path d="M-40 975H1180" stroke="#5e5046" stroke-width="5" stroke-linecap="round"/><path d="M-40 973H1180" stroke="#b09a7e" stroke-opacity=".35" stroke-width="1.5"/>' +
      `<path d="${arch}" fill="#050302"/>` +
      // The signal post: its arm drops to clear when a command runs.
      '<path d="M470 975V772" stroke="#2a1c16" stroke-width="8" stroke-linecap="round"/>' +
      `<g transform="translate(470 788)"><g class="ct-arm"><path d="${lump(rect(-74, -7, 74, 14), next, 1, 16)}" fill="${TERRA}"/>` +
      '<path d="M-60 0H-44" stroke="#e8d6b0" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/></g>' +
      '<circle class="ct-stop" cy="-15" r="6" fill="#d0503a"/><circle class="ct-clear" cy="-15" r="6" fill="#6ac46a"/></g>' +
      `<g class="ct-train"><g transform="translate(0 972)"><g class="ct-go"><g class="ct-chug">${train(next)}</g></g></g></g>` +
      // The hill the line runs into, the dark that swallows the train, the stones of the portal.
      `<path fill-rule="evenodd" d="M1040 1010V870Q1020 820 1050 790Q1110 735 1230 728Q1380 735 1470 830Q1520 900 1530 1010Z${arch}" fill="#1b120d"/>` +
      `<path d="${arch}" fill="url(#ct-dark)"/>` +
      `<path d="${stones}" fill="#3e2d22"/>` +
      print(1110, 800, 9, 0, 0.4) +
      '</g>' +
      pigeon,
    nook:
      // A picket fence and a cobbled pavement behind the desk, and a stack of spare clay slabs underneath it.
      `<path d="${pickets}" fill="#203a38"/>` +
      `<path d="${Array.from({ length: 15 }, (_, i) => `M${-29 + i * 32} 378V440`).join('')}" stroke="#3a6460" stroke-opacity=".4" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="${lump(rect(-44, 392, 490, 11), nookNext, 1.2, 70)}${lump(rect(-44, 424, 490, 11), nookNext, 1.2, 70)}" fill="#1a302e"/>` +
      `<path d="${lump(rect(-60, 446, 530, 30), nookNext, 1.6, 70)}" fill="#33251c"/>` +
      `<path d="${cobbles}" fill="#43311f" fill-opacity=".8"/>` +
      `<path d="${lump(rect(300, 436, 84, 20), nookNext, 1.2, 20)}" fill="${TEAL}"/>` +
      `<path d="${lump(rect(308, 418, 68, 20), nookNext, 1.2, 20)}" fill="${MUSTARD}"/>` +
      `<path d="${lump(rect(318, 402, 50, 18), nookNext, 1.2, 18)}" fill="${TERRA}"/>` +
      print(340, 446, 6, 0, 0.4) +
      '<path d="M352 404L380 372" stroke="#a07a4a" stroke-width="4" stroke-linecap="round"/><circle cx="382" cy="369" r="5" fill="none" stroke="#a07a4a" stroke-width="2.4"/>',
  }
}
