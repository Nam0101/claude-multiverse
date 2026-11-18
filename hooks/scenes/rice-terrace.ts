import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Rice Terrace: a highland valley in the flooding season, by moonlight. Curved paddies step down the hills, full of
// water that mirrors the sky; mist lies in the valley, a bamboo waterwheel turns, stilt houses glow on the ridges.
// Claude sits on a stilt-house porch in a conical hat. A command sends water cascading down the terraces paddy by
// paddy; an error breaks a terrace wall and the water rushes out; done clears the moon so it shines in every paddy
// while a water buffalo ambles along the dike.
const STRAW = '#a8966a'
const BAMBOO = '#34281a'
const BAMBOO_EDGE = '#56442a'
const LIP = '#a7c4ba'
const GLINT = '#eaf8f0'
const MUD = '#7a6040'
const MOON_X = 300
/** A firefly: a bright point in a soft halo of its own stroke. */
const FLY = 'fill="#eaff9c" stroke="#d9f27e" stroke-opacity=".16" stroke-width="10"'

type Pt = readonly [number, number]
type Terrace = { inner: (x: number) => number; lip: (x: number) => number; water: string; edge: string; foot: string; from: number; to: number }

/** x stops from `from` to `to`, both ends included. */
function span(from: number, to: number, step: number): number[] {
  const xs: number[] = []

  for (let x = from; x < to - step * 0.3; x += step) xs.push(x)
  xs.push(to)

  return xs
}

/** Numbers the short way: a minus sign needs no space before it. */
function nums(values: readonly number[]): string {
  return values.map((v, i) => (i > 0 && v >= 0 ? ' ' : '') + v).join('')
}

/** A polyline as one move and relative steps in whole units; rounding the points first keeps it from drifting. */
function poly(points: readonly Pt[]): string {
  const r = points.map(([x, y]) => [Math.round(x), Math.round(y)] as const)
  const steps: number[] = []

  for (let i = 1; i < r.length; i += 1) steps.push(r[i]![0] - r[i - 1]![0], r[i]![1] - r[i - 1]![1])

  return `M${r[0]![0]} ${r[0]![1]}l${nums(steps)}`
}

/** A paddy's water between the wall's foot and the dike's lip (they meet at the narrow end), and the lip alone. */
function terrace(from: number, to: number, inner: (x: number) => number, lip: (x: number) => number, closesAtEnd: boolean): Terrace {
  const xs = span(from, to, 40)
  const top = xs.map(x => [x, inner(x)] as const)
  const low = [...xs].reverse().map(x => [x, lip(x)] as const)

  return { inner, lip, from, to, water: `${poly([...top, ...(closesAtEnd ? low.slice(1) : low)])}Z`, edge: poly(xs.map(x => [x, lip(x)] as const)), foot: poly(top) }
}

/** A stilt house on a ridge: thatched hip roof, plank walls, a lit window, the posts it stands on. */
function stiltHouse(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    '<path d="M-28 0V-20M-10 0V-20M10 0V-20M28 0V-20" stroke="#0a0f0a" stroke-width="3.4"/>' +
    '<rect x="-36" y="-22" width="72" height="5" fill="#0c120c"/><rect x="-30" y="-42" width="60" height="21" fill="#0f130c"/>' +
    `<circle class="rt-win" style="animation-delay:${delay}s" cx="-2" cy="-32" r="17" fill="#f0b060" fill-opacity=".14"/>` +
    `<rect class="rt-win" style="animation-delay:${delay}s" x="-9" y="-37" width="14" height="9" fill="#f2b466"/>` +
    '<path d="M-50 -40L-22 -68H22L50 -40Z" fill="#141810"/><path d="M-50 -40L-22 -68H22" fill="none" stroke="#7a8a74" stroke-opacity=".35" stroke-width="2"/></g>'
  )
}

/** The water buffalo, walking right with an egret on its back; feet at 0. */
function buffalo(): string {
  const leg = (x: number, cls: string) => `<g transform="translate(${x} -28)"><rect class="${cls}" x="-4.5" y="0" width="9" height="28" rx="3" fill="#0f1612"/></g>`

  return (
    leg(-38, 'rt-leg') +
    leg(30, 'rt-leg rt-leg2') +
    '<path d="M-56 -30C-62 -52 -42 -68 -10 -66C22 -68 46 -64 54 -50C60 -38 56 -26 46 -24C20 -18 -20 -18 -48 -22Z" fill="#17221c"/>' +
    '<path d="M-56 -36C-56 -60 18 -72 48 -56" fill="none" stroke="#a8c0b4" stroke-opacity=".7" stroke-width="2.2"/>' +
    '<path d="M-56 -40Q-66 -24 -62 -8" fill="none" stroke="#121a15" stroke-width="3"/><path d="M-62 -10L-66 -2L-58 -4Z" fill="#121a15"/>' +
    '<g class="rt-nod"><path d="M44 -54C58 -60 72 -50 76 -38L80 -22C78 -15 66 -15 62 -22L52 -36Z" fill="#141c17"/>' +
    '<path d="M52 -54C38 -74 10 -74 0 -60C18 -66 36 -62 48 -48Z" fill="#2a2c22" stroke="#9aa890" stroke-opacity=".45" stroke-width="1.6"/>' +
    '<path d="M60 -56C70 -78 48 -88 30 -82C48 -78 58 -68 56 -52Z" fill="#22241c"/>' +
    '<circle cx="66" cy="-40" r="2" fill="#030605"/></g>' +
    leg(-26, 'rt-leg rt-leg2') +
    leg(42, 'rt-leg') +
    // The egret riding along.
    '<g fill="#e2ebe4" fill-opacity=".92"><ellipse cx="-12" cy="-72" rx="10" ry="6"/><path d="M-4 -74Q4 -78 0 -86Q-2 -92 4 -94L6 -92Q2 -88 4 -84Q8 -76 -2 -70Z"/></g>' +
    '<path d="M5 -93L14 -91" stroke="#d9b45a" stroke-width="1.6"/><path d="M-22 -72L-30 -68" stroke="#e2ebe4" stroke-width="2"/>'
  )
}

/** The buffalo's outline alone (body, head, horns, legs), for its reflection in the paddy. */
const SHADOW =
  'M-56 -30C-62 -52 -42 -68 -10 -66C22 -68 46 -64 54 -50L76 -38L80 -22L62 -22C20 -18 -20 -18 -48 -22Z' +
  'M52 -54C38 -74 10 -74 0 -60C18 -66 36 -62 48 -48ZM-42 -24h9v24h-9ZM-30 -24h9v24h-9ZM26 -24h9v24h-9ZM38 -24h9v24h-9Z'

/** The laptop on the bamboo desk, a tea bowl beside it, and a kerosene lantern hung from a hook under the window. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${256 + i * 12}" y="323" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const flame = activity === 'error' ? 'M402 197Q400 194 402 189Q404 194 402 197Z' : 'M402 197Q397 190 402 180Q407 190 402 197Z'

  return (
    '<path d="M240 330L250 320H352L358 330Z" fill="#1c2620" stroke="#3c5044" stroke-width="2"/>' +
    keys +
    '<path d="M344 322L378 228L392 232L360 324Z" fill="#1c2620" stroke="#3c5044" stroke-width="2.4"/>' +
    `<path d="M349 320L379 234L386 236L357 321Z" fill="${light}"/>` +
    `<path d="M349 320L379 234L368 238L340 320Z" fill="${light}" fill-opacity=".16"/>` +
    // The lantern, all of it inside x 386..418: hook and wire bail, vented cap, glass globe with its flame, the tank.
    `<g class="rt-flk"><circle cx="402" cy="190" r="16" fill="#ffc35a" fill-opacity=".09"/><circle cx="402" cy="190" r="10" fill="#ffc35a" fill-opacity=".16"/>` +
    `<path d="${flame}" fill="#ffd27a"/></g>` +
    '<path d="M402 155V162M393 176Q393 162 402 162Q411 162 411 176" fill="none" stroke="#7a7a5a" stroke-width="1.4"/>' +
    '<path d="M395 176L398 169H406L409 176Z" fill="#3a4a36" stroke="#6a7a5a" stroke-width="1.2"/>' +
    '<ellipse cx="402" cy="189" rx="9" ry="13" fill="#e6efd8" fill-opacity=".14" stroke="#cfdcc4" stroke-opacity=".5" stroke-width="1.4"/>' +
    '<path d="M392 176V204M412 176V204" stroke="#3a4a36" stroke-width="2"/>' +
    '<path d="M391 202H413L411 212H393Z" fill="#3a4a36" stroke="#6a7a5a" stroke-width="1.2"/><rect x="393" y="205" width="18" height="3" fill="#8a7030" fill-opacity=".7"/>'
  )
}

export function riceTerraceWorld(): World {
  const next = random(23)

  // The left hill: nine paddies stepping down toward the foreground, each wider and deeper than the one above.
  const bases = [352, 392, 436, 484, 538, 598, 664, 738, 818, 898]
  const left = bases.slice(0, 9).map((base, i) => {
    // The paddies reach further out toward the foot, the hill's shoulder rounding as it falls.
    const r = 330 + 120 * (1 - (1 - i / 8) ** 2)
    // The water takes a bigger share of each step lower down, where the paddies are nearer and seen more from above.
    const hw = (bases[i + 1]! - base) * (0.36 + i * 0.02)
    const amp = 3 + i * 0.9
    const drop = 18 + i * 4
    const inner = (x: number) => base + amp * Math.sin(x * 0.014 + i * 0.9) + drop * Math.max(0, (x - (r - 150)) / 150) ** 2
    const lip = (x: number) => inner(x) + hw * Math.max(0, Math.min(1, (r - x) / 60))

    return terrace(-60, r, inner, lip, true)
  })
  const lastLeft = left[8]!
  const hill =
    `M-60 1000V312C20 296 120 292 200 306C270 318 330 340 ${f(left[0]!.to + 10)} ${f(left[0]!.inner(left[0]!.to) - 8)}` +
    left.map(t => `L${f(t.to + 12)} ${f(t.inner(t.to) - 3)}L${f(t.to + 15)} ${f(t.inner(t.to) + 4)}`).join('') +
    `L${f(lastLeft.to + 46)} 898L${f(lastLeft.to + 60)} 1000Z`
  const footOf = (i: number) => (i < 8 ? left[i + 1]!.inner : () => 897)

  // The right hill behind the porch, its paddies ending before the chat column.
  const rightStarts = [1312, 1236, 1188, 1188, 1188, 1188, 1188]
  const right = rightStarts.map((l, j) => {
    const base = 420 + j * 56
    const hw = 5 + j
    const drop = 14 + j * 3
    const inner = (x: number) => base + 3.5 * Math.sin(x * 0.018 + j * 1.3) + drop * Math.max(0, (l + 140 - x) / 140) ** 2
    const lip = (x: number) => inner(x) + hw * Math.max(0, Math.min(1, (x - l) / 50))

    return terrace(l, 1640, inner, lip, false)
  })

  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = Math.round(next() * 1600)
    const y = Math.round(next() * 330)

    return `<circle${i % 5 === 0 ? ` class="rt-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${x}" cy="${y}" r="${f(0.6 + next())}" fill-opacity="${f(0.2 + next() * 0.4)}"/>`
  }).join('')
  // Three ranges, palest and highest behind; they stay low under the moon.
  const back = poly([[-40, 236], [40, 206], [110, 228], [170, 214], [240, 250], [300, 262], [360, 236], [430, 190], [480, 206], [540, 176], [610, 224], [680, 240], [760, 200], [830, 214], [900, 170], [960, 186], [1030, 140], [1090, 196], [1160, 214], [1240, 150], [1290, 118], [1350, 160], [1420, 132], [1480, 92], [1550, 140], [1620, 120], [1660, 130]])
  const far = poly([[-40, 306], [60, 280], [130, 300], [200, 286], [280, 318], [350, 296], [420, 270], [500, 312], [580, 262], [650, 290], [720, 306], [800, 258], [860, 274], [940, 236], [1010, 280], [1080, 300], [1150, 252], [1220, 236], [1300, 278], [1380, 240], [1450, 214], [1530, 258], [1600, 236], [1660, 250]])
  const mid = poly([[-40, 410], [60, 376], [150, 404], [240, 392], [330, 350], [400, 384], [480, 410], [560, 366], [640, 340], [720, 382], [800, 404], [880, 360], [960, 336], [1040, 378], [1120, 410], [1200, 382], [1300, 356], [1400, 404], [1500, 384], [1660, 410]])
  const mist = [
    [700, 520, 560, 58, 46],
    [1040, 610, 420, 44, 38],
    [240, 640, 340, 30, 52],
    [880, 740, 600, 66, 60],
    [430, 470, 380, 34, 42],
  ]
    .map(([x, y, rx, ry, s], i) => `<ellipse class="rt-mi" style="animation-duration:${s}s;animation-delay:${f(-i * 7)}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#rt-mist)"/>`)
    .join('')
  const clouds = [
    [720, 92, 230, 10],
    [1110, 58, 180, 8],
    [560, 214, 160, 7],
    [1380, 150, 200, 9],
  ]
    .map(([x, y, rx, ry], i) => `<ellipse class="rt-cl" style="animation-delay:${-i * 13}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#0e1c1b" fill-opacity=".85"/>`)
    .join('')

  // Paddy walls cut the bands into fields; young rice stands in the lowest ones.
  const dikes = left
    .flatMap((t, i) =>
      [0, 1].map(k => {
        const x = (t.to - 40) * (0.16 + k * 0.42) + next() * 30 + (i % 2) * 20

        return poly([[x, t.inner(x)], [x - 5, t.lip(x - 5)]])
      }),
    )
    .join('')
  // Each row of seedlings is one dashed line: every short dash on a thick stroke stands as a shoot.
  const seedlings = left
    .slice(5)
    .flatMap(t => {
      const a = 10 + next() * 90

      return [0.38, 0.78].map(at => poly(span(a + at * 4, a + 130, 26).map(x => [x, t.inner(x) + (t.lip(x) - t.inner(x)) * at] as const)))
    })
    .join('')

  // Run: water spills over every lip in turn, falls down the wall, and the paddy below brightens as it fills.
  const step = (i: number) => f(0.1 + i * 0.26)
  const sheens: string[] = []
  const lips: string[] = []
  const spills: string[] = []

  left.forEach((t, i) => {
    const foot = footOf(i)
    // Water spills through a few notches in each lip: small falls of two or three strands, at uneven places, each
    // strand starting a little below the lip so the dashes don't line up in rows.
    const xs: number[] = []
    const notches = 3 + Math.floor(next() * 3)

    for (let s = 0; s < notches; s += 1) {
      const at = -40 + ((t.to - 90) * (s + 0.15 + next() * 0.7)) / notches

      for (let k = 0; k < 2 + Math.floor(next() * 2); k += 1) xs.push(Math.round(at + k * 4))
    }
    const tops = xs.map(x => Math.round(t.lip(x) + 1 + next() * 9))
    const feet = xs.map(x => Math.round(foot(x) - 1))
    // Each fall a relative hop from the foot of the last one.
    const falls =
      `M${xs[0]} ${tops[0]}v${feet[0]! - tops[0]!}` +
      xs
        .slice(1)
        .map((x, k) => `m${nums([x - xs[k]!, tops[k + 1]! - feet[k]!])}v${feet[k + 1]! - tops[k + 1]!}`)
        .join('')

    sheens.push(`<path class="rt-sh" style="animation-delay:${step(i)}s" d="${t.water}"/>`)
    lips.push(`<path class="rt-lg" style="animation-delay:${step(i)}s" d="${t.edge}"/>`)
    spills.push(`<path class="rt-fl" style="animation-delay:${step(i + 0.4)}s" d="${falls}" stroke-opacity="${f(0.55 + next() * 0.3)}" stroke-width="${f(1.6 + next() * 0.8)}"/>`)
  })
  const cascade = `<g fill="#d6efe6">${sheens.join('')}</g><g fill="none" stroke="${GLINT}" stroke-width="2.4">${lips.join('')}</g>${spills.join('')}`
  const rightGlow = `<g fill="none" stroke="${GLINT}" stroke-width="2.6">${right.map((t, j) => `<path class="rt-lg" style="animation-delay:${step(j + 0.6)}s" d="${t.edge}"/>`).join('')}</g>`

  // Done: the moon in every paddy, one under another, straight below the moon.
  const moons = left
    .map((t, i) => {
      const y = (t.inner(MOON_X) + t.lip(MOON_X)) / 2
      const depth = t.lip(MOON_X) - t.inner(MOON_X)

      return (
        `<g class="rt-mr" style="animation-delay:${f(0.25 + i * 0.17)}s"><ellipse cx="${MOON_X}" cy="${f(y)}" rx="${f(30 + i * 3)}" ry="${f(depth * 0.5)}" fill="url(#rt-rf)"/>` +
        `<ellipse cx="${MOON_X}" cy="${f(y)}" rx="${f(8 + i * 1.3)}" ry="${f(Math.min(depth * 0.28, 2.4 + i * 0.5))}" fill="#f2f5e2"/></g>`
      )
    })
    .join('')

  // Error: the fifth dike from the top bursts.
  const burst = left[4]!
  const bx = 230
  const by = burst.lip(bx)
  // The torrent steps down the hill: it pours down each wall, spreads across the paddy below, and pours on, wider.
  // It leans toward the hill's long side, so it never stands as a symmetric tier.
  const below = left.slice(5)
  const half = [12, ...below.map((_, k) => 30 + k * 22)]
  const reach = (dir: number, k: number) => half[k]! * (dir > 0 ? 0.72 : 1.2)
  // Ragged edges: two points jittered sideways along each stretch.
  const ragged = (pts: readonly Pt[], dir: number): Pt[] =>
    pts.flatMap((p, i): Pt[] => {
      const q = pts[i - 1]

      return q === undefined
        ? [p]
        : [
            [q[0] + (p[0] - q[0]) / 3 + dir * (next() - 0.3) * 14, q[1] + (p[1] - q[1]) / 3],
            [q[0] + ((p[0] - q[0]) * 2) / 3 + dir * (next() - 0.3) * 14, q[1] + ((p[1] - q[1]) * 2) / 3],
            p,
          ]
    })
  const side = (dir: number): Pt[] =>
    ragged(
      [
        [bx + dir * 12, by],
        ...below.flatMap((t, k): Pt[] => [
          [bx + dir * (reach(dir, k) + 4), t.inner(bx + dir * reach(dir, k))],
          [bx + dir * reach(dir, k + 1), t.lip(bx + dir * reach(dir, k + 1)) - 2],
        ]),
        [bx + dir * (reach(dir, 4) + 12), 898],
      ],
      dir,
    )
  const gush = `${poly([...side(1), ...side(-1).reverse()])}Z`
  // Broken foam along each lip the torrent spills over.
  const foam = below.map((t, k) => poly(span(bx - reach(-1, k + 1), bx + reach(1, k + 1), 12).map(x => [x, t.lip(x) - 1] as const))).join('')
  const streaks = [-0.7, -0.15, 0.4]
    .map(k => poly([[bx + k * 10, by + 2], ...below.map((t): Pt => [bx + k * 40, t.inner(bx)]), [bx + k * 120, 896]]))
    .join('')
  const spray = Array.from({ length: 7 }, (_, i) => {
    const dx = (next() - 0.4) * 90
    const dy = -16 - next() * 40

    return `<circle class="rt-spr" style="--dx:${f(dx)}px;--dy:${f(dy)}px;animation-delay:${f(0.2 + i * 0.12)}s" cx="${bx}" cy="${f(by)}" r="${f(1.8 + next() * 1.8)}" fill="#e6dcc0"/>`
  }).join('')
  // Mud runs along each lower paddy both ways from the torrent, following the paddy's curve.
  const muddy = below
    .map((t, k) => {
      const a = bx - 96 - k * 34
      const b = bx + 44 + k * 14
      const xs = span(a, b, 20)
      // Thickest at the torrent, tapering to a point at each end.
      const at = (x: number, s: number): Pt => {
        const u = x < bx ? (bx - x) / (bx - a) : (x - bx) / (b - bx)
        const mid = (t.inner(x) + t.lip(x)) / 2

        return [x, mid + s * ((t.lip(x) - t.inner(x)) / 2 - 1) * Math.sqrt(Math.max(0, 1 - u * u))]
      }
      const band = `${poly([...xs.map(x => at(x, -1)), ...[...xs].reverse().slice(1, -1).map(x => at(x, 1))])}Z`

      return `<path class="rt-mud" style="animation-delay:${f(0.55 + k * 0.22)}s;transform-origin:${Math.round(((bx - a) / (b - a)) * 100)}% 50%" d="${band}" fill="${MUD}"/>`
    })
    .join('')

  // The bamboo waterwheel by the foot of the hill: tubes on the rim lift water into the lowest paddy.
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6

    return `M0 0L${f(70 * Math.cos(a))} ${f(70 * Math.sin(a))}`
  }).join('')
  const tubes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6 + 0.26
    const cx = 74 * Math.cos(a)
    const cy = 74 * Math.sin(a)

    return `<rect x="${f(cx - 4)}" y="${f(cy - 10)}" width="8" height="20" rx="3" transform="rotate(${f((a * 180) / Math.PI)} ${f(cx)} ${f(cy)})"/>`
  }).join('')
  const drops = [0, 1, 2, 3]
    .map(i => `<path class="rt-dr" style="animation-delay:${f(i * 0.22)}s" d="M${196 - i * 6} ${806 + i * 14}v8" stroke="#cfe8e0" stroke-width="2" stroke-linecap="round"/>`)
    .join('')

  const fireflies = (count: number, box: readonly number[], cls: string): string =>
    Array.from({ length: count }, () => {
      const x = box[0]! + next() * box[2]!
      const y = box[1]! + next() * box[3]!
      const style = `--dx:${f((next() - 0.5) * 60)}px;--dy:${f(-10 - next() * 30)}px;animation-duration:${f(3.4 + next() * 2.6)}s;animation-delay:${f(-next() * 5)}s`

      return `<circle class="${cls}" style="${style}" cx="${Math.round(x)}" cy="${Math.round(y)}" r="2"/>`
    }).join('')
  const egret = (x: number, y: number, s: number, delay: number): string =>
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="rt-eg" style="animation-delay:${delay}s">` +
    `<path class="rt-wing" style="animation-delay:${f(delay * 0.7)}s" d="M-17 -2Q-8 -13 0 -1Q8 -13 17 -2Q8 -5 0 2Q-8 -5 -17 -2Z" fill="#e2ebe4"/>` +
    '<path d="M1 1Q9 0 13 -4M0 2L-14 5" fill="none" stroke="#e2ebe4" stroke-width="1.6"/></g></g>'
  const canes: readonly (readonly [number, number, number, number])[] = [
    [178, 302, 196, 2],
    [192, 304, 172, -3],
    [206, 306, 214, 4],
    [222, 308, 236, -2],
    [234, 312, 258, 3],
  ]
  const bamboo = canes
    .map(([x, y, top, lean], i) => {
      const tx = x + lean * 6
      const leaves = [0, 1, 2]
        .map(k => {
          const ly = top + k * 16
          const side = k % 2 ? 1 : -1

          return `<path d="M${f(tx + lean * (k * 0.5))} ${ly}q${side * 14} -2 ${side * 26} 8q${-side * 14} -10 ${-side * 26} -8Z"/>`
        })
        .join('')

      return `<g class="rt-bam" style="animation-delay:${-i * 1.3}s"><path d="M${x} ${y}Q${x + lean * 2} ${f((y + top) / 2)} ${tx} ${top}" fill="none" stroke="#060d09" stroke-width="3.4"/>${leaves}</g>`
    })
    .join('')
  // The wall's weave: two sets of steep diagonals across the panel x 196..456, y -58..456.
  const weave = [1, -1]
    .flatMap(dir =>
      span(dir > 0 ? -40 : 160, dir > 0 ? 490 : 690, 16).map(c => {
        // Lines x = c + dir * y / 2, cut to the panel.
        const ys = dir > 0 ? [2 * (196 - c), 2 * (456 - c)] : [2 * (c - 456), 2 * (c - 196)]
        const y0 = Math.max(-58, ys[0]!)
        const y1 = Math.min(456, ys[1]!)

        return y1 - y0 > 6 ? `M${f(c + (dir * y0) / 2)} ${f(y0)}L${f(c + (dir * y1) / 2)} ${f(y1)}` : ''
      }),
    )
    .join('')
  const balusters = span(-330, 96, 22)
    .map(x => `M${f(x)} 358V452`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'tea',
      thought: 'orbs',
      ink: '#030806',
      furniture: BAMBOO,
      metal: '#26342a',
      paper: '#e8e4cc',
      light: { idle: '#78a868', work: '#a8dc7e', bright: '#dcf4c0' },
      headTop: 211,
      glowAt: [366, 276],
      device,
      wear: {
        // The conical leaf hat: its brim stops above the eyes, the ribbon ties fall down the sides of the body.
        front:
          `<path d="M36 247L150 176L264 247Q150 258 36 247Z" fill="${STRAW}"/>` +
          '<path d="M36 247L150 176L142 253Q84 254 36 247Z" fill="#000" fill-opacity=".24"/>' +
          `<path d="${[0.3, 0.55, 0.8].map(t => `M${f(150 - 114 * t)} ${f(176 + 71 * t)}Q150 ${f(176 + 80 * t)} ${f(150 + 114 * t)} ${f(176 + 71 * t)}`).join('')}" ` +
          'fill="none" stroke="#6e5f3e" stroke-opacity=".85" stroke-width="1.5"/>' +
          '<path d="M150 176L264 247" stroke="#efe2b8" stroke-opacity=".5" stroke-width="2"/>' +
          '<path d="M36 247Q150 258 264 247" fill="none" stroke="#5a4c30" stroke-width="2.2"/>' +
          '<path d="M77 252L73 294M223 252L227 294" stroke="#b25e6c" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/>',
      },
      seatArt:
        // A rattan stool, waisted like an hourglass.
        `<path d="M112 352Q132 404 120 456H182Q170 404 190 352Z" fill="#3a2c16" stroke="${BAMBOO_EDGE}" stroke-width="2"/>` +
        `<path d="M118 372Q151 380 184 372M126 392Q151 398 176 392M126 414Q151 420 176 414M122 436Q151 442 180 436" fill="none" stroke="${BAMBOO_EDGE}" stroke-opacity=".8" stroke-width="1.6"/>` +
        '<path d="M130 360L172 446M172 360L130 446" stroke="#24190c" stroke-opacity=".7" stroke-width="1.4"/>' +
        '<ellipse cx="151" cy="352" rx="41" ry="6" fill="#4a3a20" stroke="#6a5630" stroke-width="1.4"/>',
      tableArt:
        // A bamboo desk: a top of laid canes, two poles with their nodes, a brace.
        `<g fill="${BAMBOO}" stroke="${BAMBOO_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="13" rx="5"/>` +
        '<rect x="182" y="343" width="11" height="113" rx="5"/><rect x="444" y="343" width="11" height="113" rx="5"/><rect x="193" y="404" width="251" height="7" rx="3.5"/></g>' +
        '<path d="M172 335H464M172 339H464" stroke="#1f160b" stroke-width="1"/>' +
        '<g fill="#6a5634"><rect x="181" y="372" width="13" height="3"/><rect x="181" y="430" width="13" height="3"/><rect x="443" y="372" width="13" height="3"/><rect x="443" y="430" width="13" height="3"/></g>' +
        '<path d="M166 330.5H470" stroke="#8a7a52" stroke-opacity=".5" stroke-width="1.4"/>',
    },
    style:
      '.rt-tw{animation:rt-tw 3.8s ease-in-out infinite alternate}@keyframes rt-tw{to{opacity:.15}}' +
      '.rt-cl{animation:rt-cl 70s ease-in-out infinite alternate}@keyframes rt-cl{to{transform:translateX(90px)}}' +
      '.rt-mi{animation:rt-mi 40s ease-in-out infinite alternate}@keyframes rt-mi{from{transform:translateX(-60px);opacity:.6}to{transform:translateX(60px);opacity:1}}' +
      '.rt-bam{transform-box:fill-box;transform-origin:50% 100%;animation:rt-bam 6s ease-in-out infinite alternate}@keyframes rt-bam{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}' +
      '.rt-smk{stroke-dasharray:.3 .7;animation:rt-smk 9s linear infinite}@keyframes rt-smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.rt-ff{animation:rt-ff 4s ease-in-out infinite}@keyframes rt-ff{0%,100%{opacity:.08;transform:translate(0,0)}50%{opacity:1;transform:translate(var(--dx),var(--dy))}}' +
      '.rt-ffx{opacity:0}.st-thinking .rt-ffx,.ultra .rt-ffx,.st-done .rt-ffx{animation:rt-ff 3s ease-in-out infinite}' +
      '.st-thinking .rt-ff{animation-duration:2.4s}' +
      '.rt-win{animation:rt-win 6s ease-in-out infinite alternate}@keyframes rt-win{from{opacity:.7}to{opacity:1}}' +
      '.helper .rt-win{animation:rt-win 1.8s ease-in-out infinite alternate}' +
      '.rt-flk{animation:rt-flk 2.2s ease-in-out infinite alternate}@keyframes rt-flk{from{opacity:.78}to{opacity:1}}' +
      // The moon behind its veil of cloud, and the dim moons in the paddies.
      '.rt-veil{animation:rt-cl 50s ease-in-out infinite alternate}' +
      '.st-done .rt-veil{animation:rt-veil 2.6s ease-in-out both}@keyframes rt-veil{to{opacity:0;transform:translateX(260px)}}' +
      '.rt-mh{transform-box:fill-box;transform-origin:center;opacity:.7}.st-done .rt-mh{animation:rt-mh 2.4s ease-out both}@keyframes rt-mh{to{opacity:1;transform:scale(1.14)}}' +
      '.rt-mr{transform-box:fill-box;transform-origin:center;opacity:.16}.st-done .rt-mr{animation:rt-mr 1.4s ease-out both}' +
      '@keyframes rt-mr{0%{opacity:.16;transform:scaleX(.3)}45%{opacity:1;transform:scaleX(1.15)}100%{opacity:.92;transform:scaleX(1)}}' +
      '.rt-fr{opacity:.32}.st-done .rt-fr{animation:rt-fr 2s ease-out .5s both}@keyframes rt-fr{to{opacity:1}}' +
      // The waterwheel turns slowly, fast while a tool or a command works; it drips and its trough runs.
      '.rt-wh{animation:mv-spin 32s linear infinite}.st-tool .rt-wh,.st-run .rt-wh{animation-duration:6s}' +
      '.rt-dr{opacity:0}.st-tool .rt-dr,.st-run .rt-dr{animation:rt-dr .9s ease-in infinite}@keyframes rt-dr{0%{opacity:0;transform:translateY(0)}20%{opacity:.8}100%{opacity:0;transform:translateY(56px)}}' +
      '.rt-tr{opacity:.3;stroke-dasharray:6 8;animation:rt-fl 1.4s linear infinite}.st-tool .rt-tr,.st-run .rt-tr{opacity:.85;animation-duration:.5s}' +
      '.rt-sp{stroke-dasharray:5 9;animation:rt-fl 1.2s linear infinite}' +
      '.rt-sg{opacity:0}.st-run .rt-sg{animation:rt-in .4s ease-out both}@keyframes rt-in{to{opacity:1}}' +
      // Run: the cascade.
      '.rt-sh,.rt-lg,.rt-fl{opacity:0}.rt-fl{stroke:#d8eee6;stroke-dasharray:9 5}' +
      '.st-run .rt-sh{animation:rt-sh 1.6s ease-out both}@keyframes rt-sh{0%{opacity:0}30%{opacity:.34}100%{opacity:.17}}' +
      '.st-run .rt-lg{animation:rt-lg 1.6s ease-out both}@keyframes rt-lg{0%{opacity:0}25%{opacity:.95}100%{opacity:.5}}' +
      '.st-run .rt-fl{animation:rt-in .5s ease-out both,rt-fl .45s linear infinite}@keyframes rt-fl{to{stroke-dashoffset:-14}}' +
      // Error: the dike bursts and the paddy below drowns in mud.
      '.rt-chunk{transform-box:fill-box;transform-origin:center;opacity:0}.st-error .rt-chunk{animation:rt-chunk 1.1s ease-in .1s both}' +
      '@keyframes rt-chunk{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx,30px),var(--dy,230px)) rotate(var(--r,110deg))}}' +
      '.rt-notch{opacity:0}.st-error .rt-notch{animation:rt-in .3s ease-out .15s both}' +
      '.rt-gush{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-error .rt-gush{animation:rt-gush 1.2s cubic-bezier(.3,.6,.4,1) .15s both}' +
      '@keyframes rt-gush{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      '.st-error .rt-gf{animation:rt-gf .5s linear infinite}@keyframes rt-gf{to{stroke-dashoffset:-22}}' +
      '.rt-drain,.rt-mud,.rt-plume{opacity:0}' +
      '.st-error .rt-drain{animation:rt-drain 1.6s ease-in .3s both}@keyframes rt-drain{to{opacity:.88}}' +
      '.rt-mud{transform-box:fill-box}.st-error .rt-mud{animation:rt-mud 1.3s ease-out both}@keyframes rt-mud{from{opacity:0;transform:scaleX(.15)}to{opacity:.55;transform:scaleX(1)}}' +
      '.rt-plume{transform-box:fill-box;transform-origin:center}.st-error .rt-plume{animation:rt-plume 2.4s ease-out .9s both}' +
      '@keyframes rt-plume{0%{opacity:0;transform:scaleX(.2)}30%{opacity:.6}100%{opacity:.45;transform:scaleX(1.5)}}' +
      '.rt-spr{opacity:0}.st-error .rt-spr{animation:rt-spr 1.2s ease-out infinite}' +
      '@keyframes rt-spr{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 70px))}}' +
      // Done: the buffalo walks the dike.
      '.rt-buf{opacity:0}.st-done .rt-buf{animation:rt-buf 9s linear both}@keyframes rt-buf{0%{opacity:0;transform:translateX(0)}7%{opacity:1}100%{opacity:1;transform:translateX(290px)}}' +
      '.rt-leg{transform-box:fill-box;transform-origin:50% 0}.st-done .rt-leg{animation:rt-leg .9s ease-in-out infinite alternate}.st-done .rt-leg2{animation-delay:-.9s}' +
      '@keyframes rt-leg{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
      '.st-done .rt-nod{animation:rt-nod 1.8s ease-in-out infinite}@keyframes rt-nod{50%{transform:translateY(3px)}}' +
      // Web: egrets fly past the moon. Read: a fish jumps in the near paddy. Responding: rings on the water.
      '.rt-eg{opacity:0}.st-web .rt-eg{animation:rt-eg 9s linear infinite}@keyframes rt-eg{0%{opacity:0;transform:translateX(0)}6%,92%{opacity:.85}100%{opacity:0;transform:translateX(1800px)}}' +
      '.rt-wing{transform-box:fill-box;transform-origin:center;animation:rt-wing .55s ease-in-out infinite alternate}@keyframes rt-wing{to{transform:scaleY(.3)}}' +
      '.rt-fish{opacity:0}.st-read .rt-fish{animation:rt-fish 2.2s ease-in-out infinite}' +
      '@keyframes rt-fish{0%{opacity:0;transform:translate(0,0) rotate(-50deg)}8%{opacity:1}50%{transform:translate(26px,-46px) rotate(0)}88%{opacity:1}100%{opacity:0;transform:translate(52px,0) rotate(50deg)}}' +
      '.rt-rip{transform-box:fill-box;transform-origin:center;opacity:0}.st-read .rt-rip,.st-responding .rt-rip{animation:rt-rip 2.2s ease-out infinite}' +
      '@keyframes rt-rip{0%{opacity:0;transform:scale(.2)}15%{opacity:.7}100%{opacity:0;transform:scale(2.4)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="rt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020605"/><stop offset=".34" stop-color="#051010"/><stop offset=".6" stop-color="#0b1c1b"/><stop offset="1" stop-color="#071210"/></linearGradient>' +
      '<radialGradient id="rt-mhg"><stop offset="0" stop-color="#e2ead2" stop-opacity=".36"/><stop offset=".28" stop-color="#b8c8b8" stop-opacity=".12"/><stop offset="1" stop-color="#b8c8b8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rt-wt" gradientUnits="userSpaceOnUse" cx="300" cy="560" r="520"><stop offset="0" stop-color="#628688"/><stop offset=".55" stop-color="#34524f"/><stop offset="1" stop-color="#1c3230"/></radialGradient>' +
      '<radialGradient id="rt-mist"><stop offset="0" stop-color="#a9c2ba" stop-opacity=".16"/><stop offset="1" stop-color="#a9c2ba" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rt-rf"><stop offset="0" stop-color="#eef4e0" stop-opacity=".7"/><stop offset=".45" stop-color="#d8e4d0" stop-opacity=".22"/><stop offset="1" stop-color="#d8e4d0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rt-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25403c"/><stop offset="1" stop-color="#0e1d1b"/></linearGradient>' +
      '<linearGradient id="rt-gu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ae8654" stop-opacity=".62"/><stop offset=".5" stop-color="#7c5a34" stop-opacity=".58"/><stop offset="1" stop-color="#5a4026" stop-opacity=".5"/></linearGradient>' +
      '<radialGradient id="rt-vg"><stop offset="0" stop-color="#0a1717" stop-opacity=".7"/><stop offset=".6" stop-color="#0a1717" stop-opacity=".45"/><stop offset="1" stop-color="#0a1717" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rt-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a4440" stop-opacity="0"/><stop offset=".6" stop-color="#2a4440" stop-opacity=".2"/><stop offset="1" stop-color="#2a4440" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#rt-sky)"/>' +
      `<g fill="#e6f0e2">${stars}</g>` +
      // The moon behind a thin haze of cloud.
      `<circle class="rt-mh" cx="${MOON_X}" cy="150" r="210" fill="url(#rt-mhg)"/>` +
      `<circle cx="${MOON_X}" cy="150" r="38" fill="#e4ead2" fill-opacity=".92"/>` +
      `<g fill="#b8c0a8" fill-opacity=".35"><circle cx="${MOON_X - 12}" cy="140" r="9"/><circle cx="${MOON_X + 10}" cy="160" r="6"/><circle cx="${MOON_X + 14}" cy="136" r="4"/></g>` +
      `<ellipse class="rt-veil" cx="${MOON_X + 14}" cy="156" rx="104" ry="40" fill="url(#rt-vg)"/>` +
      clouds +
      `<path d="${back}V1000H-40Z" fill="#0e1c1c"/><path d="${back}" fill="none" stroke="#4a6a64" stroke-opacity=".2" stroke-width="1.4"/>` +
      `<path d="${far}V1000H-40Z" fill="#0b1817"/><path d="${far}" fill="none" stroke="#41605a" stroke-opacity=".24" stroke-width="1.5"/>` +
      '<rect y="240" width="1600" height="320" fill="url(#rt-hz)"/>' +
      `<path d="${mid}V1000H-40Z" fill="#081311"/><path d="${mid}" fill="none" stroke="#3a5650" stroke-opacity=".2" stroke-width="1.4"/>` +
      // The right hill, its paddies and the village on its crest.
      '<path d="M1020 1000L1040 640C1090 560 1170 500 1250 450C1330 400 1420 356 1500 338C1560 326 1610 322 1640 322V1000Z" fill="#0a1511"/>' +
      right.map(t => `<path d="${t.water}" fill="#2c4a46" fill-opacity=".85"/>`).join('') +
      `<path d="${right.map(t => t.edge).join('')}" fill="none" stroke="${LIP}" stroke-opacity=".26" stroke-width="1.2"/>` +
      rightGlow +
      stiltHouse(1330, 414, 0.7, 0) +
      stiltHouse(1446, 368, 0.85, -2) +
      stiltHouse(1566, 334, 0.7, -4) +
      mist +
      // The left hill: the house and the bamboo on its crown, the paddies down its face.
      `<path d="${hill}" fill="#0a150f"/>` +
      stiltHouse(96, 308, 1, -1) +
      '<path class="rt-smk" pathLength="1" d="M112 240C104 220 124 206 116 188C108 170 128 158 122 138" fill="none" stroke="#8a9a94" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>' +
      `<g fill="#060d09">${bamboo}</g>` +
      left.map(t => `<path d="${t.water}" fill="url(#rt-wt)"/>`).join('') +
      // Under each wall the water mirrors the wall: a dark strip along the paddy's inner edge.
      `<path d="${left.map(t => t.foot).join('')}" fill="none" stroke="#07120c" stroke-opacity=".75" stroke-width="6" transform="translate(0 2)"/>` +
      `<path d="${left.map(t => t.edge).join('')}" fill="none" stroke="${LIP}" stroke-opacity=".34" stroke-width="1.3"/>` +
      `<path d="${dikes}" fill="none" stroke="#0e1a12" stroke-width="2.6"/>` +
      `<path d="${seedlings}" fill="none" stroke="#4a8a2c" stroke-opacity=".6" stroke-width="4" stroke-dasharray="1.4 7.6"/>` +
      moons +
      // The spring's bamboo pipe at the top, trickling into the highest paddy.
      '<path d="M-50 326L156 347" stroke="#22200f" stroke-width="7" stroke-linecap="round"/><path d="M-50 323L156 344" stroke="#7a8a6a" stroke-opacity=".35" stroke-width="1.6"/>' +
      '<path class="rt-sp" d="M158 348Q164 351 164 360" fill="none" stroke="#cfe8e0" stroke-opacity=".5" stroke-width="2"/>' +
      '<path class="rt-sg" d="M157 346Q168 350 168 362" fill="none" stroke="#e6f6f0" stroke-width="5" stroke-linecap="round"/>' +
      cascade +
      // The burst dike: the drained paddy, the notch, the torrent and its spray, the mud below.
      `<path class="rt-drain" d="${burst.water}" fill="#141a10"/>` +
      muddy +
      `<g class="rt-gush"><path d="${gush}" fill="url(#rt-gu)"/><path class="rt-gf" d="${streaks}" fill="none" stroke="#e8d6b0" stroke-opacity=".4" stroke-width="2" stroke-dasharray="15 7"/>` +
      `<path d="${foam}" fill="none" stroke="#efe6cc" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 3 2 5 5 7"/></g>` +
      `<ellipse class="rt-notch" cx="${bx}" cy="${f(by + 1)}" rx="13" ry="5" fill="#050806"/>` +
      `<g fill="#2a2418" stroke="#5a5040" stroke-width="1.4"><path class="rt-chunk" d="M${bx - 13} ${f(by - 3)}h26l-3 10h-20Z"/>` +
      `<path class="rt-chunk" style="--dx:-40px;--dy:180px;--r:-140deg;animation-delay:.25s" d="M${bx - 6} ${f(by - 2)}l9 -3l3 8l-9 3Z"/>` +
      `<path class="rt-chunk" style="--dx:56px;--dy:150px;--r:200deg;animation-delay:.35s" d="M${bx + 4} ${f(by - 2)}l8 -2l2 8l-8 2Z"/></g>` +
      spray +
      // The foreground paddy, its dike and the big moon in it, pinned to the foot so a wide window keeps them.
      '<g class="mv-b"><path d="M-60 902Q300 892 700 900T1300 898V1100H-60Z" fill="url(#rt-fg)"/>' +
      '<path d="M-60 902Q300 892 700 900T1300 898" fill="none" stroke="#1a2a1f" stroke-width="9"/><path d="M-60 897Q300 887 700 895T1300 893" fill="none" stroke="#7a9488" stroke-opacity=".28" stroke-width="1.4"/>' +
      `<g class="rt-fr"><ellipse cx="${MOON_X}" cy="950" rx="110" ry="26" fill="url(#rt-rf)"/><ellipse cx="${MOON_X}" cy="950" rx="32" ry="8" fill="#eef2de" fill-opacity=".85"/>` +
      `<path d="M${MOON_X - 50} 964h100M${MOON_X - 34} 974h68M${MOON_X - 70} 938h40M${MOON_X + 30} 940h44" stroke="#dfe8d8" stroke-opacity=".4" stroke-width="2"/></g>` +
      // The buffalo's reflection in the near paddy, walking with it.
      `<g transform="translate(292 906)" opacity=".24"><g class="rt-buf"><path transform="scale(1.3 -.8)" d="${SHADOW}" fill="#17221c"/></g></g>` +
      `<ellipse class="rt-plume" cx="${bx + 4}" cy="912" rx="100" ry="11" fill="${MUD}"/>` +
      [
        [180, 940, 0],
        [520, 930, -0.8],
        [760, 960, -1.5],
      ]
        .map(([x, y, d]) => `<ellipse class="rt-rip" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="22" ry="5" fill="none" stroke="#cfe0d8" stroke-opacity=".6" stroke-width="1.6"/>`)
        .join('') +
      '<g transform="translate(206 944)"><g class="rt-fish"><path d="M-9 0Q0 -6 9 0Q0 6 -9 0ZM-9 0L-15 -5V5Z" fill="#cfdcd4"/></g></g></g>' +
      // The waterwheel and its trough.
      '<path d="M138 772L252 822" stroke="#22200f" stroke-width="7" stroke-linecap="round"/><path class="rt-tr" d="M140 768L252 818" stroke="#cfe8e0" stroke-width="2.2"/>' +
      drops +
      '<path d="M90 934L130 846L170 934" fill="none" stroke="#141409" stroke-width="7"/>' +
      `<g transform="translate(130 846)"><g class="rt-wh"><circle r="74" fill="none" stroke="#2e2c1a" stroke-width="5"/><circle r="62" fill="none" stroke="#2e2c1a" stroke-width="2.6"/>` +
      `<path d="${spokes}" stroke="#2e2c1a" stroke-width="3"/><g fill="#3a3620" stroke="#8aa094" stroke-opacity=".3" stroke-width="1.2">${tubes}</g></g>` +
      '<circle r="8" fill="#141409"/><path d="M-70 -24A74 74 0 0 1 -10 -73" fill="none" stroke="#9ab0a4" stroke-opacity=".4" stroke-width="2"/></g>' +
      `<g class="mv-b"><g transform="translate(292 898)"><g class="rt-buf"><g transform="scale(1.3)">${buffalo()}</g></g></g></g>` +
      `<g ${FLY}>${fireflies(10, [0, 420, 440, 460], 'rt-ff')}${fireflies(3, [1190, 560, 180, 200], 'rt-ff')}${fireflies(6, [40, 520, 360, 360], 'rt-ffx')}</g>` +
      egret(-40, 96, 1, 0) +
      egret(-110, 128, 0.8, -0.3) +
      egret(-170, 84, 0.9, -0.6) +
      egret(-230, 140, 0.7, -0.9),
    nook:
      '<defs><radialGradient id="rt-wg" cx=".5" cy=".55"><stop offset="0" stop-color="#f2b462" stop-opacity=".6"/><stop offset=".6" stop-color="#d88a3a" stop-opacity=".26"/><stop offset="1" stop-color="#d88a3a" stop-opacity=".06"/></radialGradient></defs>' +
      // The house wall: woven bamboo on a post, a lit window with its shutter propped open.
      '<rect x="196" y="-58" width="260" height="514" fill="#110e08"/>' +
      `<path d="${weave}" stroke="#2a2414" stroke-opacity=".75" stroke-width="1.5"/>` +
      '<rect x="244" y="18" width="168" height="136" fill="#1d1309" stroke="#3a2c18" stroke-width="6"/>' +
      '<rect class="rt-flk" x="248" y="22" width="160" height="128" fill="url(#rt-wg)"/>' +
      '<path d="M256 118H402" stroke="#2a1a0c" stroke-width="4"/><path d="M276 118v-16h14v16M300 118v-24h18v24M352 118v-12h12v12" fill="#2a1a0c"/>' +
      '<g fill="#1a1109">' + [272, 302, 332, 362, 392].map(x => `<rect x="${x}" y="22" width="6" height="128"/>`).join('') + '</g>' +
      '<path d="M238 18L418 18L430 -44L230 -36Z" fill="#19130a" stroke="#3a2c18" stroke-width="2"/><path d="M236 -6L424 -12M234 -22L427 -28" stroke="#2c2414" stroke-width="2"/>' +
      '<path d="M420 18L444 92" stroke="#2a2010" stroke-width="4"/>' +
      '<rect x="188" y="-66" width="14" height="522" fill="#241b0f"/><path d="M190 -66V456" stroke="#4a3a22" stroke-opacity=".6" stroke-width="1.6"/>' +
      // The thatched eave and the maize hung under it to dry.
      '<path d="M120 -64L136 -128L452 -150V-56Z" fill="#1c160b"/>' +
      '<path d="M122 -59L452 -51" stroke="#3a2f17" stroke-width="11" stroke-dasharray="2 5"/>' +
      '<path d="M136 -128L452 -150" stroke="#6f7a62" stroke-opacity=".35" stroke-width="2"/>' +
      '<path d="M152 -62V-30" stroke="#5a4a2a" stroke-width="1.6"/>' +
      '<g fill="#a07a2a" fill-opacity=".8"><ellipse cx="145" cy="-12" rx="5" ry="16" transform="rotate(12 145 -12)"/><ellipse cx="152" cy="-8" rx="5" ry="17"/><ellipse cx="159" cy="-12" rx="5" ry="16" transform="rotate(-12 159 -12)"/></g>' +
      '<path d="M152 -32L138 -22M152 -32L166 -22M152 -32V-24" stroke="#6a5a30" stroke-width="3" stroke-linecap="round"/>' +
      // The porch rail of split bamboo, the floor and a woven back-basket.
      `<path d="${balusters}" stroke="#1a140b" stroke-width="6" stroke-linecap="round"/>` +
      '<g fill="#1d160c"><rect x="-350" y="346" width="460" height="9" rx="4"/><rect x="-350" y="404" width="460" height="6" rx="3"/>' +
      '<rect x="-342" y="334" width="12" height="122"/><rect x="-176" y="334" width="12" height="122"/><rect x="-8" y="334" width="12" height="122"/></g>' +
      '<path d="M-350 347H110" stroke="#5f6a56" stroke-opacity=".35" stroke-width="1.5"/>' +
      '<rect x="-360" y="454" width="820" height="20" fill="#140f08"/><path d="M-360 455H460" stroke="#3a2e1a" stroke-width="1.6"/>' +
      '<path d="M-112 456L-120 380Q-80 370 -40 380L-48 456Z" fill="#2a2010" stroke="#4a3a1e" stroke-width="2"/>' +
      '<path d="M-118 396Q-80 388 -42 396M-116 416Q-80 408 -44 416M-114 436Q-80 428 -46 436" fill="none" stroke="#4a3a1e" stroke-width="1.6"/>' +
      '<path d="M-110 384Q-132 420 -112 450" fill="none" stroke="#3a2c16" stroke-width="3"/>',
    front: `<g ${FLY}>${fireflies(2, [-120, 60, 150, 160], 'rt-ff')}</g>`,
  }
}
