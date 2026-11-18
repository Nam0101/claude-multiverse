import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix } from './rig'
import type { World } from './world'

// Cherry Blossom: a hanami night on a cherry-blossom avenue. Rows of blossoming trees recede along a stone path to a
// far glow, paper lanterns hang on ropes between them, a full moon sits over the left canopy and petals fall all the
// time. Claude picnics under the nearest tree at a gingham-covered table, in a crown of blossoms. A command whips a
// gust into a petal whirlwind that rises under the big tree and sweeps off down the avenue; an error brings rain,
// clouds over the moon and snaps a blossoming twig onto the keyboard; done lights the lanterns down the avenue and
// spirals a flurry of petals up to the moon. Thinking draws a moonbeam, reading unfurls a poem strip, web flies
// paper cranes across the moon.

const VX = 800
const VY = 548
const HAZE = '#1e0e1a'
const BARK = '#140a0e'
const PETAL = '#f7c6d4'
const DEEP = '#e58aa6'
const MX = 330
const MY = 150

type Pt = readonly [number, number]
type Tone = { dark: string; mid: string; light: string; hi: string }

const NEAR: Tone = { dark: '#44172d', mid: '#943f61', light: '#bf6b8b', hi: '#e6aec1' }
const toneAt = (k: number): Tone => ({
  dark: mix(NEAR.dark, HAZE, k),
  mid: mix(NEAR.mid, HAZE, k),
  light: mix(NEAR.light, HAZE, k),
  hi: mix(NEAR.hi, HAZE, k),
})

/** The ground's height at depth z (1 = the nearest row, at the picture's foot), and a row's x there. */
const groundAt = (z: number): number => VY + 452 / z
const rowAt = (side: number, z: number): number => VX + (side * 700) / z
/** The stone path's half-width at a height on the ground. */
const halfPath = (y: number): number => 10 + (604 * (y - VY)) / 652
const n = (v: number): string => String(Math.round(v))
const always = (): boolean => true

function circ(x: number, y: number, r: number): string {
  return `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`
}

const CAP = ' stroke-linecap="round"'

/** Round puffs as zero-length strokes: with a round cap each `M x y h0` is a disc as wide as the stroke. */
function puffs(points: readonly Pt[], width: number, color: string, extra = CAP): string {
  return points.length === 0
    ? ''
    : `<path d="${points.map(([x, y]) => `M${n(x)} ${n(y)}h0`).join('')}" stroke="${color}" stroke-width="${f(width)}"${extra}/>`
}

/** A five-petal blossom as round petals around its heart. */
function flower(cx: number, cy: number, r: number): string {
  let d = ''

  for (let k = 0; k < 5; k += 1) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
    d += circ(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.48)
  }

  return d
}

/** A notched petal, pointing up from its base, for the few seen up close. */
function petal(x: number, y: number, deg: number, s: number): string {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a) * s
  const m = Math.sin(a) * s
  const p = [[-4, -2], [-6, -8], [-3.5, -12], [3.5, 2], [3.5, -2], [2.5, 4], [0.5, 10], [-3.5, 12]].map(([u, v]) => `${f(u! * c - v! * m)} ${f(u! * m + v! * c)}`)

  return `M${f(x)} ${f(y)}c${p[0]} ${p[1]} ${p[2]}l${p[3]} ${p[4]}c${p[5]} ${p[6]} ${p[7]}z`
}

/**
 * A canopy of blossom from big and small puffs: a shadow under each, the puff, a lit top on those clear of the chat
 * column, and flecks of single flowers.
 */
function canopy(big: readonly Pt[], small: readonly Pt[], size: number, tone: Tone, flecks: readonly Pt[], fleck: number, lit: (x: number) => boolean = always): string {
  const r = size * 0.66
  const shade = (points: readonly Pt[], by: number): Pt[] => points.map(([x, y]) => [x + by * 0.12, y + by * 0.2] as const)
  const top = (points: readonly Pt[], by: number): Pt[] => points.filter(([x]) => lit(x)).map(([x, y]) => [x - by * 0.2, y - by * 0.26] as const)

  return (
    `<g${CAP}>` +
    puffs(shade(big, size), size * 2, tone.dark, '') +
    puffs(shade(small, r), r * 2, tone.dark, '') +
    puffs(big, size * 1.76, tone.mid, '') +
    puffs(small, r * 1.76, tone.mid, '') +
    puffs(top(big, size), size * 1.05, tone.light, '') +
    puffs(top(small, r), r * 1.05, tone.light, '') +
    puffs(flecks.filter(([x]) => lit(x)), fleck, tone.hi, '') +
    '</g>'
  )
}

// A cherry trunk, its foot at (0, 0), forking low into three spreading limbs.
const TRUNK =
  'M-22 0C-16 -50 -18 -100 -26 -140C-50 -180 -90 -210 -140 -236L-132 -248C-86 -228 -48 -202 -22 -168C-20 -210 -16 -260 -4 -300' +
  'L10 -296C2 -254 2 -210 8 -170C30 -206 70 -240 130 -262L136 -250C82 -224 46 -190 26 -140C18 -96 18 -46 28 0Z'

/** One avenue tree as big as the nearest row; `lit` says which local x lands clear of the chat column. */
function tree(seed: number, big: number, small: number, tone: Tone, flecks: number, lit: (x: number) => boolean): string {
  const next = random(seed)
  const spot = (spread: number): Pt => {
    const a = next() * Math.PI * 2
    const d = 0.3 + Math.sqrt(next()) * 0.7

    return [34 + Math.cos(a) * 200 * d * spread, -440 + Math.sin(a) * 110 * d * spread + (Math.sin(a) > 0.4 ? 24 : 0)]
  }
  const bigs: Pt[] = [[34, -440], ...Array.from({ length: big - 1 }, () => spot(0.8))]
  const smalls = Array.from({ length: small }, () => spot(1.2))
  const dots = Array.from({ length: flecks }, () => spot(1.1)).map(([x, y]) => [x + (next() - 0.5) * 40, y - 34] as const)

  return `<path d="${TRUNK}" fill="${BARK}"/>` + canopy(bigs, smalls, 100, tone, dots, 9, lit)
}

/** The far trees of a row, too small to sway: one dim mass of puffs on thin trunks. */
const FAR_PUFFS: readonly (readonly [number, number, number])[] = [
  [-100, 14, 96],
  [10, -30, 110],
  [110, 14, 92],
  [10, 60, 76],
]

function farRow(side: number): string {
  let dark = ''
  let mid = ''
  let trunks = ''
  const disc = (x: number, y: number, r: number) => `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`

  for (const z of [3.8, 5.4, 7.6, 11]) {
    const s = 1.15 / z
    const x = rowAt(side, z)
    const y = groundAt(z)

    for (const [dx, dy, r] of FAR_PUFFS) {
      const px = x - side * (34 + dx) * s
      dark += disc(px + 12 * s, y + (dy + 20 - 440) * s, r * s)
      mid += disc(px, y + (dy - 440) * s, r * 0.88 * s)
    }

    trunks += `M${n(x - 12 * s)} ${n(y)}L${n(x - 5 * s)} ${n(y - 250 * s)}H${n(x + 7 * s)}L${n(x + 14 * s)} ${n(y)}Z`
  }

  const tone = toneAt(0.72)

  return `<path d="${trunks}" fill="${BARK}"/><path d="${dark}" fill="${tone.dark}"/><path d="${mid}" fill="${tone.mid}"/>`
}

/** A paper lantern hung from (0, 0): its glow, the lit paper, ribs and caps, and an invented blossom mark. */
function lantern(x: number, y: number, s: number, swing: number, lit: number, mark = false): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${s.toFixed(2)})"><g class="ck-ls" style="--b:${f(swing)}s">` +
    `<circle class="ck-lg" style="--b:${f(swing * 0.7)}s;--d:${lit.toFixed(2)}s" cy="34" r="74" fill="url(#ck-lgl)"/>` +
    '<ellipse cy="34" rx="16" ry="20" fill="url(#ck-lb)"/><ellipse class="ck-lc" cy="34" rx="11" ry="14" fill="#fff8ee"/>' +
    '<path class="ck-rb" d="M0 0V12M-9 12H9V15H-9ZM-8 53H8V56H-8ZM-14 26Q0 29 14 26M-16 34Q0 37 16 34M-14 42Q0 45 14 42M0 56V66"/>' +
    (mark ? '<path d="M0 28.5h0M5.2 32.3h0M3.2 38.4h0M-3.2 38.4h0M-5.2 32.3h0" stroke="#d2557a" stroke-opacity=".75" stroke-width="5.6" stroke-linecap="round"/>' : '') +
    '</g></g>'
  )
}

/** A rope of lanterns along one row, tied to each trunk under its blossoms; the far ones show only their light. */
function strand(side: number, depths: readonly number[]): { rope: string; lights: string; pools: string } {
  const tie = (z: number): Pt => [rowAt(side, z), VY + 268 / z]
  let rope = ''
  let lights = ''
  let pools = ''

  depths.forEach((z, i) => {
    const [x0, y0] = tie(z)

    if (i === 0) rope += `M${n(x0)} ${n(y0)}`
    if (i === depths.length - 1) return

    const z1 = depths[i + 1]!
    const [x1, y1] = tie(z1)
    const near = (1 / z + 1 / z1) / 2
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2 + 26 * near
    const hx = 0.25 * x0 + 0.5 * cx + 0.25 * x1
    const hy = 0.25 * y0 + 0.5 * cy + 0.25 * y1
    const zm = 1 / near
    const lit = 0.15 + (zm - 1) * 0.11

    rope += `Q${n(cx)} ${n(cy)} ${n(x1)} ${n(y1)}`

    if (zm <= 3.2) {
      lights += lantern(hx, hy, 1.3 * near, -i * 0.9 - side, lit)
      if (hx < 420) pools += `<ellipse cx="${n(hx)}" cy="${n(groundAt(zm))}" rx="${n(120 * near)}" ry="${n(20 * near)}" fill="url(#ck-pool)"/>`
    } else {
      lights += `<circle class="ck-lg" style="--b:${f(-i * 0.7)}s;--d:${lit.toFixed(2)}s" cx="${n(hx)}" cy="${n(hy + 34 * near)}" r="${f(56 * near)}" fill="url(#ck-lgs)"/>`
    }
  })

  return { rope: `<path d="${rope}" fill="none" stroke="#3a2226" stroke-width="1.6"/>`, lights, pools }
}

/** The run's whirlwind: rings of petals spinning round a pale funnel, off the dark ground under the big tree. */
function whirlwind(): string {
  const next = random(91)
  const rings = Array.from({ length: 6 }, (_, i) => {
    const r = 34 + i * 31
    const count = 11 + i * 3
    let lit = ''
    let deep = ''

    for (let k = 0; k < count; k += 1) {
      const a = (k / count) * Math.PI * 2 + next() * 0.5
      const rr = r * (0.75 + next() * 0.45)
      const dot = `M${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr)}h0`

      if (k % 3) lit += dot
      else deep += dot
    }

    return (
      `<g transform="translate(0 ${940 - i * 72}) scale(1 .4)"><g class="ck-vr" style="--t:${f(1.3 - i * 0.08)}s">` +
      `<circle r="${r}" fill="none" stroke="#fbe0e8" stroke-opacity=".34" stroke-width="5" stroke-dasharray="${n(r * 1.2)} ${n(r * 0.7)}"/>` +
      `<path d="${lit}" stroke="#ffe4ec"/><path d="${deep}" stroke="${DEEP}"/></g></g>`
    )
  }).join('')

  return (
    '<g transform="translate(236 0)"><g class="ck-vx"><g class="ck-vl" stroke-width="15" stroke-linecap="round">' +
    '<path d="M-24 950C-60 830 -120 700 -200 580C-120 540 120 540 200 580C120 700 60 830 24 950Z" fill="url(#ck-vf)" stroke="none"/>' +
    rings +
    '</g></g></g>'
  )
}

/** A shower as dashes running down long slanted lines: one path per layer, each line's dashes at its own phase. */
function shower(seed: number, count: number, slant: number, dash: number, gap: number, secs: number, color: string, opacity: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    d += `M${n(-200 + next() * 1900)} ${n(-next() * (dash + gap))}l${slant} 1200`
  }

  return (
    `<path class="ck-rd" style="--t:${secs}s;--o:${-(dash + gap)}px" d="${d}" stroke="${color}" stroke-opacity="${opacity}" ` +
    `stroke-width="1.5" stroke-dasharray="${dash} ${gap}" stroke-linecap="round"/>`
  )
}

/** An error's rain cloud sliding in by `x` after `delay`: its body, and a faint moonlit rim along its top edge. */
function cloud(top: string, rest: string, fill: string, x: number, delay: number): string {
  return `<g class="ck-cl" style="--x:${x}px;--d:${delay}s"><path d="${top}${rest}" fill="${fill}"/><path d="${top}" fill="none" stroke="#c4a0bc" stroke-opacity=".34" stroke-width="2.5"/></g>`
}

/** A paper crane gliding right; its wing beats. */
function crane(y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(-140 ${y}) scale(${s})"><g class="ck-cr" style="--b:${delay}s">` +
    '<path d="M-24 -2L-6 2L10 0L26 -12L16 4L-4 8Z" fill="#f3dfe6" fill-opacity=".8"/>' +
    '<path class="ck-wg" d="M-8 2L6 -22L12 2Z" fill="#e9c8d4" fill-opacity=".8"/></g></g>'
  )
}

/** Claude's laptop, its picnic lunch in a knotted pink cloth and a cup of tea with a petal afloat. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#3a2830"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#3a2830"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The bento, drawn at 3/4 size so it ends by x 398, inside the window; the cup stands right of it.
    '<g transform="matrix(.74 0 0 .74 75.8 85.8)"><path d="M374 330Q370 304 384 300H422Q436 304 432 330Z" fill="#b84d70"/>' +
    '<path d="M396 301Q386 283 399 286Q404 293 403 301ZM410 301Q414 284 425 289Q420 297 414 301Z" fill="#d86a8e"/>' +
    '<circle cx="404" cy="301" r="5" fill="#c85a7e"/><path d="M386 314h0M398 322h0M414 312h0M422 323h0" stroke="#f7d0dc" stroke-opacity=".6" stroke-width="4.8" stroke-linecap="round"/></g>' +
    '<path d="M400 319H412L410.6 330H401.4Z" fill="#eadbd2" fill-opacity=".85"/>' +
    `<path d="${petal(405, 321, 80, 0.45)}" fill="${PETAL}"/>`
  )
}

export function cherryBlossomWorld(): World {
  const next = random(2604)
  const sky = (count: number): Pt[] => Array.from({ length: count }, () => [next() * 1600, next() * 430] as const)
  const stars =
    puffs(sky(30), 1.6, '#f4e4ec', `${CAP} stroke-opacity=".5"`) +
    puffs(sky(10), 2.6, '#f4e4ec', `${CAP} stroke-opacity=".55"`) +
    [0, -1.7]
      .map(delay => puffs(sky(3), 3.6, '#fff0f4', `${CAP} class="ck-tw" style="animation-delay:${delay}s"`))
      .join('')

  // The avenue's near trees, far first; the far ones are a dim mass per row.
  const nears = [
    [-1, 2.7],
    [1, 2.7],
    [-1, 1.9],
    [1, 1.9],
    [-1, 1.4],
    [-1, 1],
  ] as const
  const grove = nears
    .map(([side, z], i) => {
      const s = 1.15 / z
      const sx = -side * s
      const x = rowAt(side, z)
      const lit = (lx: number) => {
        const px = x + sx * lx

        return px < 400 || px > 1200
      }
      const close = z <= 1.4

      return (
        `<g transform="translate(${f(x)} ${f(groundAt(z))}) scale(${sx.toFixed(3)} ${s.toFixed(3)})">` +
        `<g class="ck-sw" style="--k:${-side};--t:${7 + (i % 4)}s;--b:${f(-i * 1.3)}s">` +
        `${tree(31 + i * 7, close ? 7 : 5, close ? 8 : 6, toneAt(Math.min(0.72, (z - 1) * 0.34)), close ? 22 : 0, lit)}</g></g>`
      )
    })
    .join('')
  const ropeL = strand(-1, [1, 1.4, 1.9, 2.7, 3.8, 5.4, 7.6, 11])
  const ropeR = strand(1, [1.9, 2.7, 3.8, 5.4, 7.6, 11])

  // The stone path: joints in perspective, petals drifted along both curbs and littered across the ground.
  const rows = [1, 1.2, 1.45, 1.75, 2.1, 2.6, 3.2, 4, 5.2, 7]
  let joints = ''

  rows.forEach((z, i) => {
    const y = groundAt(z)
    const w = halfPath(y)
    joints += `M${n(VX - w)} ${n(y)}H${n(VX + w)}`

    if (i < rows.length - 1) {
      const y1 = groundAt(rows[i + 1]!)
      const w1 = halfPath(y1)

      for (const u of i % 2 ? [-0.5, 0, 0.5] : [-0.75, -0.25, 0.25, 0.75]) joints += `M${n(VX + u * w)} ${n(y)}L${n(VX + u * w1)} ${n(y1)}`
    }
  })

  let litterNear = ''
  let litterFar = ''

  for (let i = 0; i < 64; i += 1) {
    const z = 1 + Math.pow(next(), 1.7) * 9
    const y = groundAt(z) + ((next() - 0.5) * 24) / z
    const x = next() < 0.6 ? VX + (next() < 0.5 ? -1 : 1) * halfPath(y) * (0.84 + next() * 0.36) : VX + ((next() * 2 - 1) * 1000) / z
    const dot = `M${n(x)} ${n(y)}h${f(6 / z)}`

    if (z < 2.2) litterNear += dot
    else litterFar += dot
  }

  const curbs = [-1, 1].map(side => `M${VX + side * 9} ${VY}H${VX + side * 12}L${VX + side * 680} 1200H${VX + side * 520}Z`).join('')
  const strokes = (width: number, color = PETAL, extra = '') => `<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${extra}>`
  const deep = (i: number) => (i % 3 ? '' : ` stroke="${DEEP}"`)

  const fall =
    strokes(6, PETAL, ' stroke-opacity=".8"') +
    Array.from({ length: 24 }, (_, i) => {
      const x = -60 + next() * 1720
      const k = 0.8 + next() * 0.8

      return (
        `<g class="ck-pf" style="--dx:${n(80 + next() * 160)}px;--t:${f(9 + next() * 7)}s;--b:${f(-next() * 16)}s">` +
        `<path d="M${n(x)} -30q${n(4 * k)} ${n(-3 * k)} ${n(k)} ${n(-9 * k)}"${deep(i)}/></g>`
      )
    }).join('') +
    '</g>'

  const blow =
    strokes(7) +
    Array.from({ length: 20 }, (_, i) => {
      const x = 70 + next() * 330
      const y = 470 + next() * 230

      return (
        `<g class="ck-bl" style="--w:${n((next() - 0.5) * 240)}px;--t:${f(1.8 + next())}s;--b:${f(-next() * 2.6)}s">` +
        `<path d="M${n(x)} ${n(y)}q5 -3 2 -11"${deep(i)}/></g>`
      )
    }).join('') +
    '</g>'

  // Pinned to the top with the moon, so the flurry ends on the disc in any window shape.
  const flurry =
    `<g class="mv-t">${strokes(11)}` +
    Array.from({ length: 30 }, (_, i) => {
      const x = 110 + next() * 360
      const y = 640 + next() * 260

      return (
        `<g class="ck-fl" style="--x:${n(MX + (next() - 0.5) * 70 - x)}px;--y:${n(MY + (next() - 0.5) * 50 - y)}px;--t:${f(2.4 + next())}s;--d:${f(next() * 1.6)}s">` +
        `<path d="M${n(x)} ${n(y)}q7 -4 3 -16"${i % 2 ? '' : ' stroke="#ffe8ee"'}/></g>`
      )
    }).join('') +
    '</g></g>'

  const splashes = Array.from({ length: 6 }, (_, i) => {
    const z = 1 + next() * 2.4
    const x = VX + (i % 2 ? 1 : -1) * (halfPath(groundAt(z)) * (0.3 + next() * 0.9))

    return `<ellipse class="ck-spl" style="--b:${f(-next())}s" cx="${n(x)}" cy="${n(groundAt(z))}" rx="${f(18 / z)}" ry="${f(5 / z)}"/>`
  }).join('')

  const winds = [
    'M-60 820C120 760 240 600 330 470C420 340 560 250 760 200C980 150 1240 170 1660 90',
    'M-80 520C80 470 200 520 320 450C420 390 480 300 560 240',
    'M-40 940C200 900 420 860 640 880',
    'M-60 300C80 250 200 300 300 230C380 170 470 140 600 120',
  ]
    .map((d, i) => `<path class="ck-wd" style="--b:${f(-i * 0.37)}s" pathLength="1" d="${d}" stroke-width="${3 - i * 0.4}"/>`)
    .join('')

  // The branch that crosses the moon, and its twin over the top-right corner.
  const branch = (seed: number): string => {
    const r = random(seed)
    // Clusters of blossom along the branch, not a string of beads.
    const nodes: Pt[] = [[34, 0], [96, 14], [158, 40], [214, 82], [270, 132], [326, 168]]
    const around = (spread: number, lift: number): Pt[] => nodes.map(([x, y]) => [x + (r() - 0.5) * spread, y + (r() - 0.5) * spread * 0.7 - lift] as const)
    const big: Pt[] = [...nodes, ...around(40, 8)]
    const small: Pt[] = [...around(70, 0), ...around(70, 14), [180, -10], [166, 114]]
    const flecks: Pt[] = Array.from({ length: 14 }, () => {
      const [x, y] = big[Math.floor(r() * big.length)]!

      return [x + (r() - 0.5) * 40, y + (r() - 0.5) * 30 - 6] as const
    })

    return (
      '<path d="M0 6C80 10 150 36 210 80C250 110 286 144 340 172L344 164C292 136 256 100 218 68C160 22 90 -6 0 -8Z" fill="#160a10"/>' +
      '<path d="M130 26C140 6 160 -6 180 -10M240 106C246 86 262 72 280 68M190 64C190 86 180 102 166 114" fill="none" stroke="#160a10" stroke-width="4" stroke-linecap="round"/>' +
      canopy(big, small, 24, NEAR, flecks, 5)
    )
  }

  // The nook's tree: its trunk at the right edge, a limb arching over Claude and a lantern hung from it.
  const nn = random(404)
  const nookSpot = (spread: number): Pt => {
    const a = nn() * Math.PI * 2
    const d = 0.3 + Math.sqrt(nn()) * 0.7

    return [214 + Math.cos(a) * 190 * d * spread, -176 + Math.sin(a) * 80 * d * spread]
  }
  const nookBig: Pt[] = Array.from({ length: 13 }, () => nookSpot(0.78))
  const nookSmall: Pt[] = [...Array.from({ length: 12 }, () => nookSpot(1.2)), [-18, -100], [24, -78], [70, -92], [118, -70], [170, -80], [214, -58], [262, -66], [316, -44]]
  const nookFlecks: Pt[] = Array.from({ length: 18 }, () => [20 + nn() * 400, -260 + nn() * 200] as const)
  const blanketLitter = Array.from({ length: 24 }, () => `M${n(-10 + nn() * 440)} ${n(440 + nn() * 24)}h${f(3 + nn() * 3)}`).join('')

  const deskFall =
    strokes(7, PETAL, ' stroke-opacity=".85"') +
    Array.from({ length: 6 }, (_, i) => {
      const x = -140 + nn() * 560

      return (
        `<g class="ck-pf" style="--dx:${n(60 + nn() * 120)}px;--t:${f(8 + nn() * 5)}s;--b:${f(-nn() * 13)}s">` +
        `<path d="M${n(x)} -620q5 -3 2 -11"${i % 2 ? '' : ` stroke="${DEEP}"`}/></g>`
      )
    }).join('') +
    '</g>'

  const burst =
    strokes(7) +
    Array.from({ length: 9 }, (_, i) => {
      const a = -Math.PI * (0.1 + (i / 8) * 0.8)

      return (
        `<g class="ck-bu" style="--x:${n(Math.cos(a) * (60 + nn() * 50))}px;--y:${n(Math.sin(a) * (50 + nn() * 40) - 10)}px">` +
        `<path d="M290 312q5 -3 2 -11"${i % 2 ? '' : ` stroke="${DEEP}"`}/></g>`
      )
    }).join('') +
    '</g>'

  const heap =
    '<path d="M238 331Q246 306 270 300Q296 290 320 300Q342 308 348 331Z" fill="#c8607e"/>' +
    `<path d="${Array.from({ length: 16 }, () => `M${n(248 + nn() * 90)} ${n(326 - nn() * 24)}q4 -3 1 -8`).join('')}" fill="none" stroke="${PETAL}" stroke-width="5.5" stroke-linecap="round"/>` +
    puffs(
      [
        [268, 306],
        [300, 298],
        [326, 310],
      ],
      18,
      '#e98aa6',
    )

  const twig =
    '<g transform="translate(290 -44)"><g class="ck-snap">' +
    `<path d="M0 0C-10 14 -26 26 -52 40M-26 26C-30 36 -28 46 -34 54" fill="none" stroke="${BARK}" stroke-width="4.5" stroke-linecap="round"/>` +
    canopy(
      [
        [-16, 16],
        [-38, 32],
      ],
      [
        [-54, 44],
        [-32, 54],
      ],
      14,
      NEAR,
      [
        [-42, 26],
        [-20, 10],
        [-56, 38],
      ],
      5,
    ) +
    '</g></g>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'spores',
      ink: '#0a0508',
      furniture: '#2e1c14',
      metal: '#3a2830',
      paper: '#f4e6ea',
      light: { idle: '#c98aa0', work: '#f4aac2', bright: '#ffdce8' },
      headTop: 234,
      glowAt: [345, 284],
      device,
      wear: {
        // A crown of blossoms on a twig, two leaves, and petals fallen on its head: all above the eyes.
        front:
          '<path d="M64 243C100 230 200 230 236 243" fill="none" stroke="#4a2a22" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M96 238q7 -10 16 -5q-7 9 -16 5zM198 233q9 -6 16 1q-9 6 -16 -1z" fill="#5b7a3e"/>' +
          `<path d="${flower(80, 238, 10)}${flower(150, 228, 11.5)}${flower(220, 238, 10)}" fill="#f7bccd"/>` +
          `<path d="${flower(114, 231, 10.5)}${flower(186, 231, 10.5)}" fill="#e7869f"/>` +
          '<path d="M80 238h0M114 231h0M150 228h0M186 231h0M220 238h0" stroke="#a82e52" stroke-width="5.4" stroke-linecap="round"/>' +
          `<path d="${petal(132, 249, 70, 0.9)}${petal(170, 249, -64, 0.85)}${petal(202, 250, 40, 0.7)}" fill="${PETAL}"/>`,
      },
      // A wicker picnic basket with a napkin peeking out.
      seatArt:
        '<path d="M106 360H198L191 454H113Z" fill="#4a301c" stroke="#24160c" stroke-width="2"/>' +
        '<path d="M110 374H194M111 390H193M112 406H193M112 422H192M113 438H191" stroke="#7d5634" stroke-width="4" stroke-dasharray="7 5"/>' +
        '<path d="M110 382H194M111 398H193M112 414H192M113 430H191" stroke="#5e3e22" stroke-width="4" stroke-dasharray="7 5" stroke-dashoffset="6"/>' +
        '<rect x="100" y="347" width="104" height="13" rx="4" fill="#6a4628" stroke="#24160c" stroke-width="1.5"/>' +
        '<path d="M106 350H198" stroke="#9a7046" stroke-opacity=".6" stroke-width="2"/>' +
        '<path d="M180 360L206 357L196 390Z" fill="#c45a7a"/><rect x="145" y="358" width="12" height="22" rx="2" fill="#24160c"/>',
      // A low table under a pink gingham cloth with a scalloped hem.
      tableArt:
        '<path d="M188 366H200V456H188ZM434 366H446V456H434Z" fill="#2e1c14"/>' +
        `<path d="M158 329H478V362${'q-8 10 -16 0'.repeat(20)}Z" fill="#6a2a42"/>` +
        `<path d="${Array.from({ length: 20 }, (_, i) => `M${160 + i * 16} 329h8v35h-8z`).join('')}" fill="#f4c2d0" fill-opacity=".2"/>` +
        '<path d="M158 333H478v7H158zM158 347H478v7H158z" fill="#f4c2d0" fill-opacity=".2"/>' +
        '<path d="M158 329.5H478" stroke="#f9d4de" stroke-opacity=".45" stroke-width="2"/>',
    },
    style:
      '.ck-tw{animation:ck-tw 3.4s ease-in-out infinite alternate}@keyframes ck-tw{to{opacity:.2}}' +
      // The moon: its halo breathes; rain clouds cover it on an error; done swells it and rings out.
      '.ck-halo{transform-box:fill-box;transform-origin:center;animation:ck-halo 8s ease-in-out infinite alternate}@keyframes ck-halo{from{opacity:.75}to{opacity:.95}}' +
      '.st-done .ck-halo{animation:ck-hup 2.6s ease-out both}@keyframes ck-hup{from{opacity:.8;transform:scale(1)}to{opacity:1;transform:scale(1.28)}}' +
      '.st-error .ck-moon{animation:ck-dim 1.6s ease-out both}@keyframes ck-dim{to{opacity:.4}}' +
      '.ck-cl{opacity:0}.st-error .ck-cl{animation:ck-cl 1.8s cubic-bezier(.2,.7,.3,1) var(--d) both}@keyframes ck-cl{from{opacity:0;transform:translateX(var(--x))}to{opacity:.96;transform:translateX(0)}}' +
      '.ck-rb{fill:none;stroke:#5a2a2c;stroke-width:2}' +
      '.ck-mr{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .ck-mr{animation:ck-mr 2.2s ease-out .5s 2 both}' +
      '@keyframes ck-mr{0%{opacity:0;transform:scale(1)}15%{opacity:.6}100%{opacity:0;transform:scale(3.2)}}' +
      // Thinking: a shaft of moonlight down onto the avenue.
      '.ck-beam{opacity:0}.st-thinking .ck-beam{animation:ck-in 2.4s ease-out both}' +
      '@keyframes ck-rot{to{transform:rotate(360deg)}}' +
      // The trees sway from their feet; a gust bends them all one way; an error shivers them.
      '.ck-sw{transform-box:fill-box;transform-origin:50% 100%;animation:ck-sw var(--t) ease-in-out var(--b) infinite alternate}' +
      '@keyframes ck-sw{from{transform:rotate(calc(var(--k) * -.7deg))}to{transform:rotate(calc(var(--k) * .9deg))}}' +
      '.st-run .ck-sw{animation:ck-bend 1.2s ease-in-out var(--b) infinite alternate}@keyframes ck-bend{from{transform:rotate(calc(var(--k) * 1.2deg))}to{transform:rotate(calc(var(--k) * 3.6deg))}}' +
      '.st-error .ck-sw{animation:ck-shv .5s ease-in-out var(--b) infinite alternate}@keyframes ck-shv{from{transform:rotate(calc(var(--k) * -.5deg))}to{transform:rotate(calc(var(--k) * .6deg))}}' +
      '.ck-br{animation:ck-br 9s ease-in-out infinite alternate}@keyframes ck-br{from{transform:rotate(-1.2deg)}to{transform:rotate(1deg)}}' +
      '.st-run .ck-br{animation:ck-brr 1s ease-in-out infinite alternate}@keyframes ck-brr{from{transform:rotate(1deg)}to{transform:rotate(4deg)}}' +
      // The lanterns swing on their ropes and their light breathes.
      '.ck-ls{--a:5deg;animation:ck-ls 3.8s ease-in-out var(--b) infinite alternate}@keyframes ck-ls{from{transform:rotate(calc(var(--a) * -1))}to{transform:rotate(var(--a))}}' +
      '.st-tool .ck-ls{--a:9deg;animation-duration:1.4s}.st-error .ck-ls{--a:11deg;animation-duration:1s}' +
      '.st-run .ck-ls{animation:ck-lsr .8s ease-in-out var(--b) infinite alternate}@keyframes ck-lsr{from{transform:rotate(-8deg)}to{transform:rotate(-26deg)}}' +
      '.ck-lg{transform-box:fill-box;transform-origin:center;animation:ck-lg 3.2s ease-in-out var(--b) infinite alternate}@keyframes ck-lg{from{opacity:.6}to{opacity:.85}}' +
      '.st-responding .ck-lg{animation-duration:1.3s}' +
      '.st-error .ck-lg{animation:ck-lgd 1.2s ease-out both}@keyframes ck-lgd{to{opacity:.32}}' +
      // Done: the light runs down the avenue, lantern by lantern.
      '.st-done .ck-lg{animation:ck-lgu 1.3s ease-out var(--d) both}@keyframes ck-lgu{from{opacity:.6;transform:scale(1)}to{opacity:1;transform:scale(2.2)}}' +
      '.ck-lc{opacity:.15}.st-done .ck-lc{animation:ck-lc 1.3s ease-out var(--d) both}@keyframes ck-lc{to{opacity:.9}}' +
      // Petals fall all the time; thinking slows them, a gust drives them sideways.
      '.ck-pf{animation:ck-pf var(--t) linear var(--b) infinite}@keyframes ck-pf{to{transform:translate(calc(var(--dx) * var(--g,1)),1080px)}}' +
      '.st-thinking .ck-pf{animation-duration:calc(var(--t) * 1.6)}.st-run .ck-pf{--g:5;animation-duration:calc(var(--t) * .45)}' +
      '.ck-pf>path{transform-box:fill-box;transform-origin:center;animation:ck-pl calc(1.4s + var(--t) * .12) ease-in-out calc(var(--b) * .37) infinite alternate}' +
      '@keyframes ck-pl{from{transform:translateX(-16px) rotate(-40deg) scaleX(1)}to{transform:translateX(16px) rotate(50deg) scaleX(.35)}}' +
      // Run: the whirlwind rises and leans, the wind streaks past, a stream of petals blows along the avenue.
      '.ck-vx{opacity:0;transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .ck-vx{animation:ck-vx 4.4s cubic-bezier(.3,.6,.5,1) both}' +
      '@keyframes ck-vx{0%{opacity:0;transform:translate(0,0) scale(.3,.12)}22%{opacity:1;transform:translate(10px,0) scale(1.12)}100%{opacity:.9;transform:translate(250px,-60px) scale(.82)}}' +
      '.ck-vl{transform-box:fill-box;transform-origin:50% 100%}.st-run .ck-vl{animation:ck-vl 2.4s ease-in-out infinite alternate}' +
      '@keyframes ck-vl{from{transform:translateX(-20px) skewX(-4deg)}to{transform:translateX(50px) skewX(5deg)}}' +
      '.st-run .ck-vr{animation:ck-rot var(--t) linear infinite}' +
      '.ck-wd{opacity:0;fill:none;stroke:#fbe2ea;stroke-opacity:.38;stroke-linecap:round;stroke-dasharray:.25 1}' +
      '.st-run .ck-wd{opacity:1;animation:ck-wd 1.5s linear var(--b) infinite}@keyframes ck-wd{from{stroke-dashoffset:1.25}to{stroke-dashoffset:0}}' +
      '.ck-bl{opacity:0}.st-run .ck-bl{animation:ck-bl var(--t) linear var(--b) infinite}' +
      '@keyframes ck-bl{0%{opacity:0;transform:translate(0,0)}8%,90%{opacity:.85}50%{transform:translate(950px,var(--w))}100%{opacity:0;transform:translate(1900px,calc(var(--w) * -.4))}}' +
      '.st-run .ck-bl>path{transform-box:fill-box;transform-origin:center;animation:ck-rot .6s linear infinite}' +
      // Done: a flurry spirals up into the moon.
      '.ck-fl{opacity:0}.st-done .ck-fl{animation:ck-up var(--t) cubic-bezier(.35,.1,.6,1) var(--d) infinite}' +
      '@keyframes ck-up{0%{opacity:0;transform:translate(0,0)}12%,80%{opacity:.95}100%{opacity:0;transform:translate(var(--x),var(--y))}}' +
      '.st-done .ck-fl>path{transform-box:fill-box;transform-origin:center;animation:ck-fs .9s ease-in-out calc(var(--d) * -1.7) infinite alternate}' +
      '@keyframes ck-fs{from{transform:translateX(-76px) rotate(0)}to{transform:translateX(76px) rotate(200deg)}}' +
      // Read: a poem strip unfurls from the limb over Claude.
      '.ck-tz{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-read .ck-tz{animation:ck-tz 1s cubic-bezier(.3,1.3,.5,1) .15s both}@keyframes ck-tz{to{transform:scaleY(1)}}' +
      // Web: paper cranes glide across the moon.
      '.ck-cr{opacity:0}.st-web .ck-cr{animation:ck-cr 7s linear var(--b) infinite}@keyframes ck-cr{0%{opacity:0;transform:translate(0,0)}6%,94%{opacity:.8}100%{opacity:0;transform:translate(1900px,-70px)}}' +
      '.ck-wg{transform-box:fill-box;transform-origin:50% 100%}.st-web .ck-wg{animation:ck-wg .7s ease-in-out infinite alternate}@keyframes ck-wg{to{transform:scaleY(-.6)}}' +
      // Error: rain, splashes on the path, and the twig over the desk snaps onto the keyboard in a heap of petals.
      '.ck-rain{opacity:0}.st-error .ck-rain{animation:ck-in .5s ease-out .1s both}@keyframes ck-in{to{opacity:1}}' +
      '.st-error .ck-rd{animation:ck-rd var(--t) linear infinite}@keyframes ck-rd{to{stroke-dashoffset:var(--o)}}' +
      '.ck-spl{opacity:0;fill:none;stroke:#d6c4e0;stroke-width:1.6;transform-box:fill-box;transform-origin:center}.st-error .ck-spl{animation:ck-spl .9s ease-out var(--b) infinite}' +
      '@keyframes ck-spl{0%{opacity:0;transform:scale(.2)}20%{opacity:.6}100%{opacity:0;transform:scale(1.6)}}' +
      '.st-error .ck-snap{animation:ck-snap .9s ease-in-out .05s both}' +
      '@keyframes ck-snap{0%{transform:rotate(0)}14%{transform:rotate(-8deg)}26%{transform:translate(0,4px) rotate(4deg);animation-timing-function:cubic-bezier(.55,0,1,.55)}100%{transform:translate(0,354px) rotate(39deg)}}' +
      '.ck-hp{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-error .ck-hp{animation:ck-hp .5s cubic-bezier(.3,1.5,.5,1) .85s both}' +
      '@keyframes ck-hp{from{opacity:0;transform:scale(.3,.1)}to{opacity:1;transform:scale(1)}}' +
      '.ck-bu{opacity:0}.st-error .ck-bu{animation:ck-bu 1.2s ease-out .85s both}' +
      '@keyframes ck-bu{0%{opacity:0;transform:translate(0,0)}10%{opacity:.95}100%{opacity:0;transform:translate(var(--x),var(--y))}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ck-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07040a"/><stop offset=".36" stop-color="#0d0711"/><stop offset=".56" stop-color="#1e0f1c"/><stop offset="1" stop-color="#120a10"/></linearGradient>' +
      '<radialGradient id="ck-mh"><stop offset="0" stop-color="#f9dce6" stop-opacity=".3"/><stop offset=".35" stop-color="#f2b8ca" stop-opacity=".1"/><stop offset="1" stop-color="#f2b8ca" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ck-md" cx=".42" cy=".38"><stop offset="0" stop-color="#fff7f4"/><stop offset=".7" stop-color="#f9e2e6"/><stop offset="1" stop-color="#ecc6d2"/></radialGradient>' +
      '<radialGradient id="ck-lgl"><stop offset="0" stop-color="#ffc8a0" stop-opacity=".45"/><stop offset=".4" stop-color="#ff9e86" stop-opacity=".14"/><stop offset="1" stop-color="#ff9e86" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ck-lgs"><stop offset="0" stop-color="#ffe6d0"/><stop offset=".14" stop-color="#ffd0b0" stop-opacity=".9"/><stop offset=".22" stop-color="#ffb08a" stop-opacity=".3"/><stop offset="1" stop-color="#ffb08a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ck-lb" cx=".45" cy=".42"><stop offset="0" stop-color="#fff4e8"/><stop offset=".55" stop-color="#ffd6bc"/><stop offset="1" stop-color="#e8957e"/></radialGradient>' +
      '<linearGradient id="ck-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbe2ea" stop-opacity=".2"/><stop offset="1" stop-color="#fbe2ea" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ck-pool"><stop offset="0" stop-color="#ffb48a" stop-opacity=".22"/><stop offset="1" stop-color="#ffb48a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ck-vp"><stop offset="0" stop-color="#d0607e" stop-opacity=".2"/><stop offset="1" stop-color="#d0607e" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ck-path" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1217"/><stop offset=".6" stop-color="#2e242a"/></linearGradient>' +
      '<linearGradient id="ck-vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4b4c8" stop-opacity=".22"/><stop offset="1" stop-color="#f4b4c8" stop-opacity=".03"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ck-sky)"/>' +
      stars +
      // The full moon, its halo, the clouds an error brings and done's ring.
      `<g class="mv-t"><circle class="ck-halo" cx="${MX}" cy="${MY}" r="260" fill="url(#ck-mh)"/>` +
      `<g class="ck-moon"><circle cx="${MX}" cy="${MY}" r="62" fill="url(#ck-md)"/>` +
      `<path d="${circ(MX - 20, MY - 14, 14)}${circ(MX + 18, MY + 10, 18)}${circ(MX - 8, MY + 26, 9)}" fill="#dcaab9" fill-opacity=".3"/></g>` +
      `<circle class="ck-mr" cx="${MX}" cy="${MY}" r="70" fill="none" stroke="#ffd6e2" stroke-width="3"/>` +
      // One bank of two overlapping clouds drifts in from the left together, so a single lumpy edge sweeps the disc.
      cloud('M60 196Q66 156 120 160Q140 120 196 130Q240 96 296 124Q350 104 384 144Q440 138 452 182', 'Q462 220 410 222H96Q50 222 60 196Z', '#1a0e1c', -460, 0) +
      cloud('M240 124Q242 92 280 92Q296 60 340 68Q372 44 410 70Q456 74 458 120Q470 160 440 186', 'H256Q228 150 240 124Z', '#22131f', -460, 0.04) +
      '</g>' +
      // The far hills, the glow at the end of the avenue, the ground and the stone path.
      '<g class="mv-b"><path d="M-20 548V520Q120 498 240 512T480 504T720 520T960 508T1200 518T1440 504T1640 516V548Z" fill="#140a12"/>' +
      `<ellipse cx="${VX}" cy="${VY - 6}" rx="300" ry="70" fill="url(#ck-vp)"/>` +
      `<rect x="-20" y="${VY}" width="1660" height="700" fill="#0e080c"/>` +
      `<path d="M${VX - 10} ${VY}H${VX + 10}L${VX + 614} 1200H${VX - 614}Z" fill="url(#ck-path)"/>` +
      `<path d="${curbs}" fill="#c86a88" fill-opacity=".14"/>` +
      `<path d="${joints}" fill="none" stroke="#0e080b" stroke-width="2.2"/>` +
      `<path d="${litterNear}" fill="none" stroke="#f2b2c6" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${litterFar}" fill="none" stroke="#c8607e" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>` +
      ropeL.pools +
      farRow(-1) +
      farRow(1) +
      grove +
      ropeL.rope +
      ropeR.rope +
      ropeL.lights +
      ropeR.lights +
      splashes +
      whirlwind() +
      '</g>' +
      // Pinned to the top with the moon; its foot fades out, so the far end may drift.
      `<g class="mv-t"><path class="ck-beam" d="M${MX - 34} ${MY + 40}H${MX + 30}L640 1000H120Z" fill="url(#ck-bm)"/></g>` +
      `<g class="mv-t"><g transform="translate(-40 24)"><g class="ck-br">${branch(5)}</g></g></g>` +
      `<g class="mv-r"><g class="mv-t"><g transform="translate(1650 -6) scale(-.92 .92) rotate(-8)"><g class="ck-br">${branch(9)}</g></g></g></g>` +
      winds +
      crane(118, 1.7, 0) +
      crane(186, 1.3, -0.8) +
      crane(246, 1.5, -4.4) +
      fall +
      blow +
      flurry +
      `<g class="ck-rain">${shower(63, 36, 170, 30, 190, 0.42, '#d4c6e2', 0.42)}${shower(64, 26, 200, 46, 260, 0.34, '#efe6f4', 0.34)}</g>`,
    nook:
      // The picnic blanket on the ground, petals drifted on it.
      '<path d="M0 434H430L452 470H-24Z" fill="#3e1a28"/>' +
      `<path d="${Array.from({ length: 15 }, (_, i) => `M${i * 30 + 6} 434L${f(i * 31.6 - 18)} 470`).join('')}M-6 444H436M-14 458H444" stroke="#e9b3c4" stroke-opacity=".16" stroke-width="7"/>` +
      `<path d="${blanketLitter}" fill="none" stroke="${PETAL}" stroke-opacity=".55" stroke-width="4.5" stroke-linecap="round"/>` +
      // The tree Claude sits under.
      '<path d="M346 470C356 400 350 300 356 200C360 120 350 60 336 0C330 -30 320 -50 300 -70L318 -84C340 -64 356 -36 366 0C380 60 392 140 398 220C404 320 414 400 436 470Z' +
      'M336 -30C270 -60 190 -80 110 -84C60 -86 10 -96 -60 -120L-56 -132C10 -110 60 -100 112 -98C196 -96 276 -82 344 -50Z' +
      'M352 -60C350 -120 340 -170 320 -210L334 -216C356 -176 366 -126 366 -64Z" fill="#170b10"/>' +
      canopy(nookBig, nookSmall, 50, NEAR, nookFlecks, 7, x => x > 20) +
      '<path class="ck-rb" d="M140 -88V-24"/>' +
      lantern(140, -24, 1.35, -0.6, 0.1, true) +
      // Read: a poem strip unfurls from the limb, painted with a sprig, no writing.
      '<g transform="translate(66 -88)"><g class="ck-tz"><path class="ck-rb" d="M0 0V10"/><rect x="-10" y="10" width="20" height="70" rx="1" fill="#efe0cf"/>' +
      '<path d="M-3 74C-1 58 3 46 0 24M1 52Q6 48 7 42" fill="none" stroke="#5a3a30" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M0 26h0M7 41h0M-2 52h0M2 64h0" stroke="#e07a98" stroke-width="6" stroke-linecap="round"/></g></g>',
    front:
      deskFall +
      twig +
      `<g class="ck-hp">${heap}</g>` +
      burst,
  }
}
