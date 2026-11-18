import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Sky Islands: a pilot in a leather flying cap, goggles pushed up, codes in a little open workshop on its own floating
// island. Rock islands hang over a sea of cloud at nightfall, waterfalls spill off their lips, rope bridges sag between
// them and a tower stands against the moon. A command brings an airship sailing in between the islands; an error
// snaps a bridge and crumbles rock off an island's lip; done lights lanterns along the bridges and makes the falls glitter.
const LEATHER = '#6b4429'
const LEATHER_DK = '#3e2616'
const BRASS = '#c8963e'
const CREAM = '#e9e3d3'
const WOOD = '#2c2018'
const WOOD_EDGE = '#45331f'
const LAMP = '#ffc46b'
const ACCENT = '#3a8dde'
const ROPE = '#6b5842'

type Pt = readonly [number, number]
type Tone = { body: string; lit: string; grass: string; rim: string; rimOp: number }

const pts = (list: readonly Pt[]): string => list.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')

/** A floating island: a grassy top over an inverted, craggy cone of rock, lit from the moon on its left. */
function isle(cx: number, top: number, hw: number, depth: number, seed: number, tone: Tone, small = false): string {
  const next = random(seed)
  const n = small ? 4 : 6
  const c = small ? 4 : 8
  const tip: Pt = [cx + (next() - 0.5) * hw * 0.3, top + depth]
  const crest: Pt[] = Array.from({ length: c + 1 }, (_, i) => [cx - hw + (i * 2 * hw) / c, top + (i === 0 || i === c ? 5 : (next() - 0.6) * 7)] as Pt)
  const side = (sign: number): Pt[] =>
    Array.from({ length: n - 1 }, (_, k) => {
      const t = (k + 1) / n

      return [cx + (tip[0] - cx) * t + sign * hw * Math.pow(1 - t, 0.8) * (0.86 + next() * 0.28), top + depth * Math.pow(t, 1.05)] as Pt
    })
  const right = side(1)
  const left = side(-1)
  const body = `<path d="M${pts(crest)}L${pts(right)}L${pts([tip])}L${pts([...left].reverse())}Z" fill="${tone.body}"/>`
  const lit = `<path d="M${pts([crest[0]!, ...left, tip, [cx - hw * 0.06, top + depth * 0.5], [cx - hw * 0.3, top + depth * 0.2], [cx - hw * 0.46, top + 8]])}Z" fill="${tone.lit}"/>`
  const grass =
    `<path d="M${pts(crest)}" fill="none" stroke="${tone.grass}" stroke-width="${small ? 7 : 12}" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="M${pts(crest.map(([x, y]) => [x, y - (small ? 3 : 5)] as Pt))}" fill="none" stroke="${tone.rim}" stroke-opacity="${tone.rimOp}" stroke-width="2" stroke-linecap="round"/>`

  if (small) {
    return body + lit + grass
  }

  const strata = [0, 2, 3]
    .map(k => {
      const l = left[k]!
      const r = right[k]!

      return `M${f(l[0])} ${f(l[1])}L${f((l[0] * 2 + r[0]) / 3)} ${f(l[1] + (next() - 0.5) * 12)}L${f((l[0] + r[0] * 2) / 3)} ${f(r[1] + (next() - 0.5) * 12)}L${f(r[0])} ${f(r[1])}`
    })
    .join('')
  const roots = [left[1]!, left[3]!, right[2]!, right[3]!, tip]
    .map(([x, y], i) => `M${f(x)} ${f(y)}q${4 + i} ${16 + i * 4} ${-3 + i} ${30 + i * 6}q-5 12 2 ${20 + i * 3}`)
    .join('')
  const drips = [crest[0]!, crest[c]!].map(([x, y]) => `M${f(x - 6)} ${f(y + 4)}l3 9l3 -8l3 12l3 -10l3 7`).join('')

  return (
    body +
    lit +
    `<path d="M${pts([crest[0]!, ...left, tip])}" fill="none" stroke="#8fb4e0" stroke-opacity=".4" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="${strata}" fill="none" stroke="#050a12" stroke-opacity=".5" stroke-width="2"/>` +
    `<path d="${roots}" fill="none" stroke="${tone.body}" stroke-width="2.2" stroke-linecap="round"/>` +
    grass +
    `<path d="${drips}" fill="none" stroke="${tone.grass}" stroke-width="2.4" stroke-linejoin="round"/>`
  )
}

/** A waterfall pouring off a lip: a soft sheet, streaks that run down it, foam at the lip, mist where it ends. */
function fall(x: number, y0: number, y1: number, w: number, secs: number, mist: boolean, glitter: number, seed: number): string {
  const next = random(seed)
  const spread = (y1 - y0) * 0.035
  const streaks = Array.from({ length: 4 }, (_, i) => {
    const u = (i + 0.5) / 4 - 0.5
    const xa = x + w / 2 + u * w
    const xb = x + w / 2 + u * (w + spread * 2)

    return `<path class="si-fl" style="animation-duration:${f(secs * (0.85 + i * 0.1))}s;animation-delay:${f(-next() * 2)}s" d="M${f(xa)} ${y0}L${f(xb)} ${y1}" stroke-width="${f(1.6 + (i % 2))}"/>`
  }).join('')
  // Sparkles in absolute coordinates: a CSS transform on them would replace a transform attribute.
  const sparkles = Array.from({ length: glitter }, (_, i) => {
    const y = y0 + 20 + next() * (y1 - y0 - 80)
    const sx = x + w / 2 + (next() - 0.5) * (w + spread)
    const s = 7 + next() * 5
    const k = s * 0.22

    return `<path class="si-gt" style="animation-delay:${f(i * 0.17 + next() * 0.3)}s" d="M${f(sx)} ${f(y - s)}l${f(k)} ${f(s - k)}l${f(s - k)} ${f(k)}l${f(k - s)} ${f(k)}l${f(-k)} ${f(s - k)}l${f(-k)} ${f(k - s)}l${f(k - s)} ${f(-k)}l${f(s - k)} ${f(-k)}Z"/>`
  }).join('')

  return (
    `<path d="M${x} ${y0}H${x + w}L${f(x + w + spread)} ${y1}H${f(x - spread)}Z" fill="url(#si-wf)"/>` +
    `<g stroke="#dcefff" stroke-opacity=".6" stroke-dasharray="34 22">${streaks}</g>` +
    `<ellipse cx="${x + w / 2}" cy="${y0 + 2}" rx="${w / 2 + 5}" ry="4" fill="#e6f3ff" fill-opacity=".55"/>` +
    (mist ? `<ellipse class="si-mist" cx="${x + w / 2}" cy="${y1 - 6}" rx="${w * 2.6}" ry="${w}" fill="url(#si-ms)"/>` : '') +
    `<g fill="#f4faff">${sparkles}</g>`
  )
}

/** A rolling band of cloud tops, a whole number of bumps wide, so it slides one period left without a seam. */
function clouds(y: number, radii: readonly number[], fill: string, rim: string, rimOp: number): { svg: string; period: number } {
  const period = radii.reduce((sum, r) => sum + 2 * r, 0)
  const reps = Math.ceil((1640 + period) / period)
  const bumps = Array.from({ length: reps }, () => radii.map((r, i) => `a${r} ${f(r * 0.55)} 0 0 1 ${2 * r} ${i % 2 ? -6 : 6}`).join('')).join('')
  const line = `M-20 ${y}${bumps}`

  return {
    svg: `<path d="${line}V1200H-20Z" fill="${fill}"/><path d="${line}" fill="none" stroke="${rim}" stroke-opacity="${rimOp}" stroke-width="2.4"/>`,
    period,
  }
}

const H = 28

/**
 * A rope bridge between two lips: a plank deck and a hand rope sagging under it, hangers between them, lanterns on
 * the rope. Drawn as two halves that each swing down from their own end when it snaps, inside a group that sways.
 * A snapping bridge can stand on a `lip` of rock that later breaks away, taking its first post and half with it.
 */
function bridge(a: Pt, b: Pt, sag: number, lamps: readonly number[], delay: number, snaps: boolean, lip?: { svg: string; at: Pt }): string {
  const [ax, ay] = a
  const [bx, by] = b
  const mx = (ax + bx) / 2
  const my = (ay + by) / 2
  const deckC: Pt = [mx, my + 2 * sag]
  const ropeA: Pt = [ax, ay - H]
  const ropeB: Pt = [bx, by - H]
  const ropeC: Pt = [mx, my - H + 2 * (sag - 8)]
  const at = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => [
    (1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0],
    (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1],
  ]
  const deck = (t: number): Pt => at(a, deckC, b, t)
  const rope = (t: number): Pt => at(ropeA, ropeC, ropeB, t)
  const split = (p0: Pt, c: Pt, p1: Pt): [string, string] => {
    const m = at(p0, c, p1, 0.5)

    return [
      `M${f(p0[0])} ${f(p0[1])}Q${f((p0[0] + c[0]) / 2)} ${f((p0[1] + c[1]) / 2)} ${f(m[0])} ${f(m[1])}`,
      `M${f(m[0])} ${f(m[1])}Q${f((c[0] + p1[0]) / 2)} ${f((c[1] + p1[1]) / 2)} ${f(p1[0])} ${f(p1[1])}`,
    ]
  }
  const [deckL, deckR] = split(a, deckC, b)
  const [ropeL, ropeR] = split(ropeA, ropeC, ropeB)
  const hangers = (t0: number): string =>
    Array.from({ length: 5 }, (_, i) => {
      const t = t0 + ((i + 1) * 0.5) / 6
      const q = rope(t)

      return `M${f(q[0])} ${f(q[1])}V${f(deck(t)[1])}`
    }).join('')
  // Each lantern hangs under the hand rope and lights in turn, from both ends toward the middle.
  const lamp = (t: number): string => {
    const [px, py] = rope(t)
    const rank = Math.round(Math.min(t, 1 - t) * 10)

    return (
      `<g transform="translate(${f(px)} ${f(py)})"><path d="M0 0V7M-5 7H5V21H-5Z"/>` +
      `<g class="si-ll" style="animation-delay:${f(delay + rank * 0.14)}s" stroke="none"><circle cy="14" r="30" fill="url(#si-ln)"/><rect x="-3.5" y="9" width="7" height="10" rx="2" fill="${LAMP}"/></g></g>`
    )
  }
  const m = deck(0.5)
  const fray = (dir: number) => `<path class="si-fr" d="M${f(m[0])} ${f(m[1])}l${6 * dir} 5M${f(m[0])} ${f(m[1])}l${7 * dir} -2M${f(m[0])} ${f(m[1] - 2)}l${5 * dir} 8" stroke="#9a8462" stroke-width="1.4"/>`
  const halfOf = (deckD: string, ropeD: string, t0: number, dir: number) =>
    `<path d="${ropeD}${hangers(t0)}" fill="none" stroke="${ROPE}" stroke-width="1.6"/>` +
    `<path d="${deckD}" fill="none" stroke="#3b2d20" stroke-width="7" stroke-dasharray="6 2.6"/>` +
    `<path d="${deckD}" fill="none" stroke="#8a7252" stroke-opacity=".75" stroke-width="1.4"/>` +
    `<g fill="#2a2018" stroke="#5a4632" stroke-width="1.2">${lamps.filter(t => (dir < 0 ? t < 0.5 : t > 0.5)).map(lamp).join('')}</g>` +
    (snaps ? fray(-dir) : '')
  const swing = (p: Pt, r: number, inner: string) =>
    snaps
      ? `<g transform="translate(${f(p[0])} ${f(p[1])})"><g class="si-h" style="--r:${f(r)}deg"><g transform="translate(${f(-p[0])} ${f(-p[1])})">${inner}</g></g></g>`
      : inner
  const deg = (y: number, x: number) => (Math.atan2(y, x) * 180) / Math.PI
  const tilt = deg(by - ay, bx - ax)
  const planks = snaps
    ? `<g fill="#4a3826">${[0.4, 0.45, 0.5, 0.55, 0.6]
        .map((t, i) => {
          const [px, py] = deck(t)

          return `<rect class="si-pk" style="--dx:${(i - 2) * 26}px;--rt:${(i % 2 ? -1 : 1) * (160 + i * 40)}deg;animation-delay:${f(0.3 + i * 0.07)}s" x="${f(px - 4)}" y="${f(py - 3)}" width="8" height="6"/>`
        })
        .join('')}</g>`
    : ''
  const post = ([x, y]: Pt) => `<path d="M${f(x - 2.5)} ${f(y + 4)}V${f(y - H - 6)}h5V${f(y + 4)}Z" fill="#3a2c20" stroke="#5a4632"/>`
  // Both halves sway the same way about the chord through a, so they can sit in separate groups.
  const sway = (inner: string) => `<g class="si-sw${snaps ? ' si-sn' : ''}" style="--x:${f(ax)}px;--y:${f(ay)}px;--a:${f(tilt)}deg">${inner}</g>`
  const left = swing(a, 88 - deg(m[1] - ay, m[0] - ax), halfOf(deckL, ropeL, 0, -1))
  const right = swing(b, 92 - deg(m[1] - by, m[0] - bx), halfOf(deckR, ropeR, 0.5, 1))

  if (!lip) {
    return sway(left + right) + planks + post(a) + post(b)
  }

  const [px, py] = lip.at

  return (
    `<g transform="translate(${f(px)} ${f(py)})"><g class="si-ch"><g transform="translate(${f(-px)} ${f(-py)})">${lip.svg}${sway(left)}${post(a)}</g></g></g>` +
    sway(right) +
    planks +
    post(b)
  )
}

/** A big airship: a ribbed envelope over a wooden hull with lit portholes, a stern propeller, a searchlight. */
function airship(): string {
  const ribs = [-112, -74, -36, 2, 40, 78, 116]
    .map(x => {
      const h = 54 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 9) / 160, 2)))

      return `M${x} ${f(-h)}Q${x + 12} 0 ${x} ${f(h)}`
    })
    .join('')

  return (
    '<ellipse cx="40" cy="186" rx="150" ry="14" fill="#03070e" fill-opacity=".35"/>' +
    '<g transform="translate(18 104)"><g class="si-beam"><path d="M-8 0L-96 220H112L8 0Z" fill="url(#si-bm)"/></g></g>' +
    '<g fill="#162336" stroke="#3a5a84" stroke-width="2" stroke-linejoin="round"><path d="M-128 -22L-192 -62L-174 -14Z"/><path d="M-128 22L-192 62L-174 14Z"/><path d="M-140 -5L-204 0L-140 5Z"/></g>' +
    '<path d="M-150 0C-150 -46 -70 -54 10 -54C96 -54 168 -34 168 0C168 34 96 54 10 54C-70 54 -150 46 -150 0Z" fill="url(#si-env)" stroke="#3a5a84" stroke-width="2"/>' +
    `<path d="M-148 10C-60 22 80 22 166 10V20C80 32 -60 32 -146 20Z" fill="${ACCENT}" fill-opacity=".85"/>` +
    `<path d="${ribs}" fill="none" stroke="#0a1322" stroke-opacity=".5" stroke-width="2"/>` +
    '<path d="M-124 -30C-60 -50 60 -54 140 -28" fill="none" stroke="#e4f0ff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
    `<path d="M-70 47L-80 74M-20 53L-30 74M40 53L50 74M92 44L98 74" stroke="${ROPE}" stroke-width="1.6"/>` +
    '<path d="M-104 72H120L100 100Q10 112 -84 100Z" fill="#2a1f17" stroke="#4a3624" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M-104 72H120" stroke="#7a6448" stroke-width="3"/>' +
    `<g fill="${LAMP}" fill-opacity=".9">${[-70, -40, -10, 20, 50, 80].map(x => `<circle cx="${x}" cy="87" r="4"/>`).join('')}</g>` +
    '<path d="M-100 86H-122" stroke="#4a3624" stroke-width="4"/>' +
    '<g transform="translate(-124 86)"><ellipse class="si-prop" rx="4" ry="22" fill="#4a5a72" fill-opacity=".85"/></g>' +
    `<circle class="si-nav" cx="168" cy="0" r="4.5" fill="#a8e0ff"/><circle cx="118" cy="76" r="3" fill="${LAMP}"/>`
  )
}

/** The same ship far off: a pale silhouette with one light. */
const farShip =
  '<g fill="#1b3050"><ellipse cx="0" cy="0" rx="150" ry="52"/><path d="M-128 -20L-190 -58L-172 -12ZM-128 20L-190 58L-172 12Z"/>' +
  '<path d="M-100 70H116L98 98H-82Z"/><path d="M-60 46V72M60 46V72" stroke="#1b3050" stroke-width="6"/></g>' +
  `<circle cx="20" cy="84" r="10" fill="${LAMP}" fill-opacity=".8"/>`

const tree = (x: number, y: number, s: number, tone: string, rim: string): string =>
  `<path d="M${x} ${y}V${f(y - 16 * s)}" stroke="${tone}" stroke-width="${f(4 * s)}"/>` +
  `<g fill="${tone}"><circle cx="${x}" cy="${f(y - 26 * s)}" r="${f(15 * s)}"/><circle cx="${f(x - 11 * s)}" cy="${f(y - 18 * s)}" r="${f(10 * s)}"/><circle cx="${f(x + 11 * s)}" cy="${f(y - 19 * s)}" r="${f(11 * s)}"/></g>` +
  `<path d="M${f(x - 13 * s)} ${f(y - 30 * s)}A${f(15 * s)} ${f(15 * s)} 0 0 1 ${f(x + 6 * s)} ${f(y - 40 * s)}" fill="none" stroke="${rim}" stroke-opacity=".5" stroke-width="2"/>`

const pine = (x: number, y: number, h: number, tone: string, rim: string): string =>
  `<path d="M${x} ${y}L${f(x - h * 0.28)} ${y}L${x} ${f(y - h)}L${f(x + h * 0.28)} ${y}Z M${f(x - h * 0.22)} ${f(y - h * 0.35)}L${x} ${f(y - h * 1.05)}L${f(x + h * 0.22)} ${f(y - h * 0.35)}Z" fill="${tone}"/>` +
  `<path d="M${f(x - h * 0.28)} ${y}L${x} ${f(y - h)}" stroke="${rim}" stroke-opacity=".4" stroke-width="1.6"/>`

/** A warm glow round a window that swells when the work is done. */
const glowAt = (x: number, y: number, r: number): string => `<circle class="si-wg" cx="${x}" cy="${y}" r="${r}" fill="url(#si-ln)"/>`

const crystal = (x: number, y: number, s: number): string =>
  `<g class="si-cry" transform="translate(${x} ${y})"><circle r="${f(18 * s)}" fill="url(#si-cg)"/><path d="M0 ${f(-9 * s)}L${f(5 * s)} 0L0 ${f(9 * s)}L${f(-5 * s)} 0Z" fill="#8cc8ff"/></g>`

/** The laptop, a brass altimeter and a model airship hanging from a brass stand, on the workbench. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const needle = activity === 'run' || activity === 'tool' ? 'si-nd si-nf' : activity === 'error' ? 'si-nd si-nx' : 'si-nd'
  const ticks = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4

    return `M${f(386 + Math.cos(a) * 10)} ${f(304 + Math.sin(a) * 10)}L${f(386 + Math.cos(a) * 12.5)} ${f(304 + Math.sin(a) * 12.5)}`
  }).join('')

  return (
    // The stand rises behind the altimeter; its arm holds the model ship over the laptop, clear of the cap.
    `<path d="M396 330V175M396 177H316M396 195L378 177" fill="none" stroke="${BRASS}" stroke-width="2"/><circle cx="396" cy="174" r="2.5" fill="${BRASS}"/>` +
    // A scale model of the big airship: a pale envelope with the blue stripe, stern fins and a wooden gondola.
    `<g transform="translate(320 177)"><g class="si-mdl"><path d="M0 0V12M-5 27L-6 30M5 27L6 30" stroke="#9a8a6a" stroke-width="1.2"/>` +
    `<path d="M-15 16L-25 9L-23 18ZM-15 24L-25 31L-23 22Z" fill="#1d5a9a"/><ellipse cy="20" rx="20" ry="8" fill="#a9bad2"/>` +
    `<path d="M-19 22Q0 26 19 22" fill="none" stroke="${ACCENT}" stroke-width="2.4"/><ellipse cx="3" cy="16" rx="10" ry="2" fill="#ffffff" fill-opacity=".5"/>` +
    '<rect x="-8" y="29.5" width="16" height="4" rx="1.5" fill="#7a5a3a"/></g></g>' +
    '<rect x="246" y="323" width="92" height="7" rx="2" fill="#2e3a4a"/>' +
    keys +
    '<path d="M332 327L356 240L366 242L342 329Z" fill="#2e3a4a"/>' +
    `<path d="M334 324L356 244L360 245L338 326Z" fill="${light}"/>` +
    `<path d="M334 324L356 244L345 248L326 324Z" fill="${light}" fill-opacity=".16"/>` +
    `<path d="M374 330H398L394 321H378Z" fill="${WOOD_EDGE}"/>` +
    `<circle cx="386" cy="304" r="17" fill="${BRASS}" stroke="#7a5420" stroke-width="2"/><circle cx="386" cy="304" r="13" fill="#0b1420"/>` +
    `<path d="${ticks}" stroke="#e9dcb8" stroke-width="1.4"/>` +
    `<g transform="translate(386 304)"><g class="${needle}"><path d="M-1.8 0L0 -11L1.8 0Z" fill="#ffe2a0"/></g></g><circle cx="386" cy="304" r="2" fill="${BRASS}"/>`
  )
}

export function skyIslandsWorld(): World {
  const next = random(29)
  const starA: Pt[] = []
  const starB: Pt[] = []

  for (let i = 0; i < 64; i += 1) {
    const p: Pt = [next() * 1600, 6 + next() * 470]

    if (Math.hypot(p[0] - 226, p[1] - 150) > 70) (i % 3 === 0 ? starB : starA).push(p)
  }

  const dots = (list: readonly Pt[], s: number) => list.map(([x, y]) => `M${f(x)} ${f(y)}h${s}v${s}h${-s}z`).join('')
  // Every band has an even number of bumps, so its alternating rises cancel and the rim stays level across the loop.
  const bandA = clouds(724, [60, 92, 70, 110, 80, 64], '#0d1c33', '#6a9ad0', 0.14)
  const bandB = clouds(778, [52, 80, 64, 96, 70, 58], '#11243f', '#7aaade', 0.17)
  const bandC = clouds(846, [72, 100, 84, 120], '#152b4a', '#88b8e8', 0.2)
  const bandD = clouds(918, [90, 130, 104, 150], '#19324f', '#94c2ee', 0.2)
  const bands = [bandA, bandB, bandC, bandD]
  const bandSecs = [150, 105, 78, 58]
  const band = (i: number) => `<g class="si-cl" style="animation:si-c${i} ${bandSecs[i]}s linear infinite">${bands[i]!.svg}</g>`

  const nearTone: Tone = { body: '#0d1727', lit: '#1f3354', grass: '#163e31', rim: '#62b08a', rimOp: 0.55 }
  const midTone: Tone = { body: '#0b1424', lit: '#132238', grass: '#12302a', rim: '#4a8a6c', rimOp: 0.4 }
  const farTone: Tone = { body: '#0b1a32', lit: '#10213c', grass: '#0f2a2c', rim: '#2f5a80', rimOp: 0.35 }
  const pebbleTone: Tone = { body: '#0e1a2c', lit: '#1a2c48', grass: '#163e31', rim: '#62b08a', rimOp: 0.5 }
  const bob = (inner: string, secs: number, delay: number) => `<g class="si-bob" style="animation-duration:${secs}s;animation-delay:${delay}s">${inner}</g>`
  const islets = [
    [560, 476, 66, 72, 3],
    [1010, 526, 48, 56, 4],
    [790, 606, 38, 44, 5],
  ]
    .map(([x, y, w, d, s], i) => bob(isle(x!, y!, w!, d!, s!, farTone, true), 9 + i * 2, -i * 3))
    .join('')
  const rocks = [
    [398, 150, 16, 26, 11],
    [62, 656, 26, 40, 12],
    [1222, 384, 20, 30, 13],
    [1566, 122, 15, 24, 14],
  ]
    .map(([x, y, w, d, s], i) => bob(isle(x!, y!, w!, d!, s!, pebbleTone, true), 5 + i * 1.3, -i * 1.7))
    .join('')

  // Island A, the big one on the left: trees, a stone tower against the moon, a waterfall, the lip that crumbles.
  const islandA =
    isle(150, 270, 200, 300, 7, nearTone) +
    crystal(96, 384, 1) +
    crystal(186, 410, 0.8) +
    crystal(146, 470, 0.7) +
    tree(24, 272, 1.15, '#10291f', '#5aa883') +
    pine(72, 272, 66, '#0f251d', '#5aa883') +
    tree(128, 272, 0.85, '#10291f', '#5aa883') +
    '<path d="M186 276V178H222V276Z" fill="#131d2d" stroke="#2a3c58" stroke-width="2"/>' +
    '<path d="M186 196H222M186 226H222M186 252H222" stroke="#0a111c" stroke-width="2"/>' +
    glowAt(204, 207, 46) +
    `<rect class="si-win" x="199" y="200" width="10" height="14" rx="5" fill="${LAMP}"/>` +
    '<path d="M180 180L204 134L228 180Z" fill="#1a2638" stroke="#2f4566" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="M204 134V116L217 120L204 125" fill="${ACCENT}" stroke="#2f4566"/>`
  // The slab of the lip under the bridge's end that shears off on an error. It follows island A's own outline and
  // tone, so it only shows when it breaks; it takes the pine, the bridge's first post and its left half with it. The
  // scar under it is painted with the sky's own gradient, and a raw edge marks the break.
  const fracture = 'L268.3 389.8L246 380L236 352L252 330L262 304L276 286L283 268.1'
  const scar =
    `<path d="M283 258H364V296L320.6 315.7L294.1 364.7${fracture}Z" fill="url(#si-sky)"/>` +
    `<path d="M${fracture.slice(1)}" fill="none" stroke="#2c4568" stroke-width="2.5" stroke-linejoin="round"/>`
  const lip = {
    at: [292, 330] as Pt,
    svg:
      `<path d="M283 268.1L300 267.5L350 275L320.6 315.7L294.1 364.7${fracture}Z" fill="${nearTone.body}"/>` +
      `<path d="M283 268.1L300 267.5L350 275" fill="none" stroke="${nearTone.grass}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<path d="M283 263.1L300 262.5L350 270" fill="none" stroke="${nearTone.rim}" stroke-opacity="${nearTone.rimOp}" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M344 279l3 9l3 -8l3 12l3 -10l3 7" fill="none" stroke="${nearTone.grass}" stroke-width="2.4" stroke-linejoin="round"/>` +
      // Its raw, moonlit break face, shown only once it starts to give.
      `<path class="si-rw" d="M${fracture.slice(1)}L294 272L287 290L273 306L264 330L250 352L258 370L276 378Z" fill="#2e4a70" stroke="#4a6a96" stroke-width="1.2" stroke-linejoin="round"/>` +
      pine(296, 274, 40, '#0f251d', '#5aa883'),
  }
  const pebbles = Array.from({ length: 8 }, (_, i) => {
    const x = 246 + next() * 92
    const y = 290 + next() * 84
    const s = 3 + next() * 5

    return `<path class="si-pb" style="--dx:${f((next() - 0.3) * 80)}px;--rt:${f(200 + next() * 300)}deg;animation-delay:${f(0.5 + i * 0.09)}s" d="M${f(x)} ${f(y)}l${f(s)} ${f(-s * 0.6)}l${f(s * 0.5)} ${f(s)}l${f(-s)} ${f(s * 0.5)}Z"/>`
  }).join('')

  // Island M, small and dim in the middle of the sky, holding both bridges.
  const islandM =
    isle(760, 166, 118, 150, 8, midTone) +
    tree(712, 168, 0.9, '#0e241c', '#4a8a6c') +
    '<path d="M776 170V150H808V170Z" fill="#111a28"/><path d="M770 152L792 136L814 152Z" fill="#162236"/>' +
    `<rect class="si-win" x="787" y="155" width="6" height="7" fill="${LAMP}" fill-opacity=".7"/>` +
    pine(842, 170, 34, '#0e241c', '#4a8a6c')

  // Island R, on the right above the workshop: a cottage, a windmill, a waterfall down its face.
  const blades = [0, 1, 2, 3]
    .map(k => `<g transform="rotate(${k * 90})"><path d="M-6 -12H6V-62H-6Z" fill="#26384f" stroke="#5a7aa0" stroke-opacity=".6" stroke-width="1.5"/><path d="M-6 -28H6M-6 -45H6" stroke="#5a7aa0" stroke-opacity=".5"/></g>`)
    .join('')
  const islandR =
    isle(1452, 238, 172, 252, 9, nearTone) +
    crystal(1414, 336, 0.9) +
    crystal(1490, 404, 0.75) +
    '<path d="M1322 242V214H1370V242Z" fill="#162132" stroke="#2a3c58" stroke-width="1.5"/>' +
    '<path d="M1314 216L1346 190L1378 216Z" fill="#203048" stroke="#2f4566" stroke-width="1.5" stroke-linejoin="round"/>' +
    glowAt(1339, 227, 44) +
    `<rect class="si-win" x="1334" y="222" width="10" height="10" fill="${LAMP}"/>` +
    tree(1446, 240, 1, '#10291f', '#5aa883') +
    '<path d="M1516 242L1521 172H1535L1540 242Z" fill="#18243a" stroke="#2f4566" stroke-width="1.5"/>' +
    '<path d="M1516 174L1528 158L1540 174Z" fill="#203048"/>' +
    `<g transform="translate(1528 166)"><g class="si-wm">${blades}</g><circle r="5" fill="#3a4a62"/></g>` +
    pine(1590, 240, 54, '#0f251d', '#5aa883') +
    // It fades into spray above the workshop roof, so none of it shows inside the open workshop.
    fall(1394, 240, 580, 20, 1.2, true, 4, 23)

  const gulls = [
    [0, 0, 1],
    [34, -18, 0.8],
    [58, 10, 0.9],
    [90, -8, 0.7],
    [120, 16, 0.8],
  ]
    .map(
      ([x, y, s], i) =>
        `<g transform="translate(${1680 + x!} ${110 + y!}) scale(${s})"><g class="si-gull" style="animation-delay:${f(i * 0.12)}s"><path class="si-wing" style="animation-delay:${f(-i * 0.13)}s" d="M-11 0Q-5 -8 0 0Q5 -8 11 0"/></g></g>`,
    )
    .join('')
  const wisps = [
    [120, 404, 170, 34, 0],
    [300, 480, 140, 28, 1.2],
    [40, 560, 150, 30, 2.1],
  ]
    .map(([x, y, rx, ry, d]) => `<ellipse class="si-wisp" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#si-wp)"/>`)
    .join('')

  // The eave of the workshop roof carries a string of lanterns of its own.
  const eave = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 0.5) / 6
    const x = -26 + t * 462
    const y = 110 - t * 60

    return (
      `<g transform="translate(${f(x)} ${f(y)})"><rect x="-3" width="6" height="8" rx="2" fill="#2a2018"/>` +
      `<g class="si-ll" style="animation-delay:${f(0.4 + i * 0.18)}s"><circle cy="4" r="18" fill="url(#si-ln)"/><rect x="-2" y="1.5" width="4" height="5" fill="${LAMP}"/></g></g>`
    )
  }).join('')
  const eaveRope = `M-26 ${f(110)}${Array.from({ length: 8 }, (_, i) => {
    const t0 = i / 8
    const t1 = (i + 1) / 8
    const x1 = -26 + t1 * 462
    const y1 = 110 - t1 * 60
    const cx = -26 + ((t0 + t1) / 2) * 462

    return `Q${f(cx)} ${f(110 - ((t0 + t1) / 2) * 60 + 10)} ${f(x1)} ${f(y1)}`
  }).join('')}`
  const propeller = [0, 180]
    .map(r => `<path transform="rotate(${r})" d="M-5 -4C-10 -20 -8 -40 -2 -46C6 -40 8 -20 5 -4Z" fill="#7a5434" stroke="#a87a4a" stroke-width="1.2"/>`)
    .join('')
  const breeze = [0, 1, 2]
    .map(k => `<path class="si-bz" style="animation-delay:${f(k * 0.33)}s" d="M100 ${132 + k * 18}h46" stroke="#cfe6ff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#050a14',
      furniture: WOOD,
      metal: '#2e3a4a',
      paper: '#e6ecf2',
      light: { idle: '#2f78c4', work: '#5aaef0', bright: '#cfe8ff' },
      headTop: 210,
      glowAt: [350, 284],
      device,
      wear: {
        // The white flying scarf's tail streams back in the wind, behind the far arm.
        behind:
          // Its tip stays right of x 26 through the whole swing, inside the band's crop.
          `<g transform="translate(74 327)"><g class="si-scf"><path d="M0 -6C-14 -12 -26 -12 -38 -20L-41 -7C-28 -2 -14 2 0 8Z" fill="${CREAM}" stroke="#b9ae94" stroke-width="1.5"/>` +
          `<path d="M-38 -20L-45 -22L-41 -7Z" fill="${CREAM}"/></g></g>`,
        // The leather cap with ear flaps and a fleece edge, the goggles pushed up on the crown: all of it ends
        // above row 1, and the scarf wraps below row 5, so the eyes stay clear.
        front:
          `<path d="M62 250C62 222 98 205 150 205C202 205 238 222 238 250Z" fill="${LEATHER}" stroke="${LEATHER_DK}" stroke-width="2"/>` +
          `<path d="M150 206V248" stroke="${LEATHER_DK}" stroke-width="2"/>` +
          '<path d="M76 228C88 214 110 208 134 207" fill="none" stroke="#9a6a42" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="M62 244H86V282Q86 292 74 292Q62 292 62 282ZM214 244H238V282Q238 292 226 292Q214 292 214 282Z" fill="${LEATHER}" stroke="${LEATHER_DK}" stroke-width="2"/>` +
          `<path d="M62 249H238" stroke="${CREAM}" stroke-width="5"/>` +
          '<path d="M63 237C100 225 200 225 237 237" fill="none" stroke="#2b1d14" stroke-width="7"/>' +
          `<g fill="#8fc8f0" fill-opacity=".6" stroke="${BRASS}" stroke-width="4"><circle cx="124" cy="226" r="11"/><circle cx="176" cy="226" r="11"/></g>` +
          `<path d="M135 226H165" stroke="${BRASS}" stroke-width="4"/>` +
          '<path d="M117 222Q120 218 125 218M169 222Q172 218 177 218" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/>' +
          `<path d="M66 320Q150 331 234 320V331Q150 342 66 331Z" fill="${CREAM}" stroke="#b9ae94" stroke-width="1.5"/>`,
      },
      seatArt:
        `<rect x="112" y="360" width="78" height="96" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M116 364L186 452M186 364L116 452" stroke="${WOOD_EDGE}" stroke-opacity=".8" stroke-width="3"/>` +
        `<path d="M112 392H190M112 424H190" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M112 378H190" stroke="${CREAM}" stroke-opacity=".5" stroke-width="3"/>` +
        '<path d="M108 350H194Q200 350 200 356V362H102V356Q102 350 108 350Z" fill="#2f4c6e" stroke="#46698f" stroke-width="1.5"/>' +
        `<path d="M105 357H197" stroke="${CREAM}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="4 4"/>`,
      tableArt:
        `<rect x="166" y="330" width="304" height="14" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M226 331V343M300 331V343M374 331V343M440 331V343" stroke="#1a130d" stroke-width="2"/>' +
        `<path d="M184 344H198V456H184ZM438 344H452V456H438Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<path d="M198 406H438" stroke="${WOOD}" stroke-width="7"/>` +
        `<path d="M182 351H200M182 357H200M436 351H454M436 357H454" stroke="${CREAM}" stroke-opacity=".55" stroke-width="2.4"/>` +
        '<path d="M166 331H470" stroke="#8fb8e0" stroke-opacity=".25" stroke-width="1.5"/>' +
        `<g fill="none" stroke="${CREAM}" stroke-opacity=".45" stroke-width="3"><circle cx="445" cy="384" r="12"/><circle cx="445" cy="384" r="6"/></g>`,
    },
    style:
      bands.map((b, i) => `@keyframes si-c${i}{to{transform:translateX(-${b.period}px)}}`).join('') +
      '@keyframes si-fi{to{opacity:1}}' +
      // Ambient: the falls run, the mist breathes, stars twinkle, rocks and islets bob, the far ship drifts.
      '.si-fl{animation:si-fl 1.1s linear infinite}@keyframes si-fl{to{stroke-dashoffset:-56}}' +
      '.si-mist{transform-box:fill-box;transform-origin:center;animation:si-mist 4s ease-in-out infinite alternate}@keyframes si-mist{from{opacity:.55;transform:scale(.9)}to{opacity:.95;transform:scale(1.1)}}' +
      '.si-tw{animation:si-tw 3.4s ease-in-out infinite alternate}@keyframes si-tw{from{opacity:.25}to{opacity:.9}}' +
      '.si-bob{animation:si-bob 6s ease-in-out infinite alternate}@keyframes si-bob{from{transform:translateY(-6px)}to{transform:translateY(6px)}}' +
      '.si-far{animation:si-far 26s ease-in-out infinite alternate}@keyframes si-far{from{transform:translateX(-160px)}to{transform:translateX(160px)}}' +
      '.st-run .si-far{opacity:0}' +
      '.si-cry{opacity:.6;animation:si-cry 4.5s ease-in-out infinite alternate}@keyframes si-cry{from{opacity:.45}to{opacity:.85}}' +
      '.st-done .si-cry,.ultra .si-cry{animation:si-fi 1.4s ease-out both}' +
      '.si-win{opacity:.7;animation:si-win 5s ease-in-out infinite alternate}@keyframes si-win{to{opacity:.95}}' +
      '.si-wm{animation:mv-spin 16s linear infinite}.st-responding .si-wm{animation-duration:6s}.st-run .si-wm{animation-duration:2.2s}.st-done .si-wm{animation-duration:5s}' +
      '.si-mdl{animation:si-mdl 3.6s ease-in-out infinite alternate}@keyframes si-mdl{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}.st-run .si-mdl{animation-duration:1.1s}' +
      // The bridges sway on their chords; the scarf streams; the altimeter wanders.
      '.si-sw{animation:si-sw 6.5s ease-in-out infinite alternate}' +
      '@keyframes si-sw{from{transform:translate(var(--x),var(--y)) rotate(var(--a)) scaleY(.88) rotate(calc(-1 * var(--a))) translate(calc(-1 * var(--x)),calc(-1 * var(--y)))}' +
      'to{transform:translate(var(--x),var(--y)) rotate(var(--a)) scaleY(1.08) rotate(calc(-1 * var(--a))) translate(calc(-1 * var(--x)),calc(-1 * var(--y)))}}' +
      '.si-scf{animation:si-scf 1.6s ease-in-out infinite alternate}@keyframes si-scf{from{transform:rotate(-7deg)}to{transform:rotate(6deg)}}' +
      '.si-nd{animation:si-nd 4s ease-in-out infinite alternate}@keyframes si-nd{from{transform:rotate(-30deg)}to{transform:rotate(40deg)}}' +
      '.si-nf{animation-duration:.7s}.si-nx{animation:si-nx 1.6s ease-in both}@keyframes si-nx{to{transform:rotate(160deg)}}' +
      // The workshop: the propeller on the wall turns, faster as Claude works and fastest on a tool's test run.
      '.si-pr{animation:mv-spin 9s linear infinite}.st-responding .si-pr{animation-duration:1.8s}.st-tool .si-pr{animation-duration:.45s}.st-run .si-pr{animation-duration:.8s}' +
      '.si-bz{opacity:0}.st-tool .si-bz{animation:si-bz 1s ease-out infinite}@keyframes si-bz{0%{opacity:0;transform:translateX(0)}30%{opacity:.6}100%{opacity:0;transform:translateX(90px)}}' +
      '.si-sock{transform-box:fill-box;transform-origin:100% 50%;animation:si-sock 1.4s ease-in-out infinite alternate}@keyframes si-sock{from{transform:scaleX(.9) rotate(4deg)}to{transform:scaleX(1) rotate(-3deg)}}' +
      '.st-thinking .si-sock,.st-read .si-sock{animation:si-droop 2s ease-out both}@keyframes si-droop{to{transform:scaleX(.8) rotate(-34deg)}}' +
      '.si-lg{transform-box:fill-box;transform-origin:center;opacity:.6;animation:si-lg 5s ease-in-out infinite alternate}@keyframes si-lg{to{opacity:.8}}' +
      '.st-read .si-lg{animation:si-lgr 1.2s ease-out both}@keyframes si-lgr{to{opacity:1;transform:scale(1.25)}}' +
      '.st-error .si-lp{animation:si-swing 1.2s ease-in-out 3}@keyframes si-swing{0%,100%{transform:rotate(0)}25%{transform:rotate(14deg)}75%{transform:rotate(-14deg)}}' +
      // Thinking and reading: wisps of cloud drift past the big island. Web: moonlit gulls fly over.
      '.si-wisp{opacity:0}.st-thinking .si-wisp,.st-read .si-wisp{animation:si-wisp 9s ease-in-out both}' +
      '@keyframes si-wisp{0%{opacity:0;transform:translateX(-120px)}25%{opacity:.6}100%{opacity:.4;transform:translateX(160px)}}' +
      '.si-gull{opacity:0}.st-web .si-gull{animation:si-gull 8s linear infinite}' +
      '@keyframes si-gull{0%{opacity:0;transform:translateX(0)}6%,90%{opacity:1}100%{opacity:0;transform:translateX(-1960px)}}' +
      '.si-wing{transform-box:fill-box;transform-origin:50% 100%;animation:si-wing .45s ease-in-out infinite alternate}@keyframes si-wing{to{transform:scaleY(.3)}}' +
      // Run: the airship sails in between the islands, propeller turning, searchlight sweeping the clouds.
      '.si-ship{opacity:0}.st-run .si-ship{animation:si-sail 2.8s cubic-bezier(.2,.7,.3,1) both}' +
      '@keyframes si-sail{from{opacity:1;transform:translateX(-600px)}to{opacity:1;transform:translateX(0)}}' +
      '.si-sb{animation:si-bob 3.2s ease-in-out infinite alternate}' +
      '.si-prop{transform-box:fill-box;transform-origin:center;animation:si-prop .2s linear infinite alternate}@keyframes si-prop{to{transform:scaleY(.18)}}' +
      '.si-beam{animation:si-beam 3.4s ease-in-out infinite alternate}@keyframes si-beam{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}' +
      '.si-nav{animation:si-nav 1.2s steps(1) infinite}@keyframes si-nav{50%{opacity:.15}}' +
      // Error: the near bridge snaps in the middle and its halves swing down; planks fall, the lip crumbles.
      '.st-error .si-sn{animation:none}' +
      '.st-error .si-h{animation:si-snap 2.8s .2s both}' +
      '@keyframes si-snap{0%{transform:rotate(0);animation-timing-function:cubic-bezier(.5,0,.9,.6)}24%{transform:rotate(calc(var(--r) * 1.12));animation-timing-function:ease-in-out}' +
      '42%{transform:rotate(calc(var(--r) * .9))}60%{transform:rotate(calc(var(--r) * 1.05))}78%{transform:rotate(calc(var(--r) * .98))}100%{transform:rotate(var(--r))}}' +
      '.si-fr{opacity:0}.st-error .si-fr{animation:si-fi .2s .2s both}' +
      '.si-pk,.si-pb{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .si-pk,.st-error .si-pb{animation:si-pk 2.2s ease-in both}' +
      '@keyframes si-pk{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),540px) rotate(var(--rt))}}' +
      // The slab turns about its own middle (set by the group around it), tipping outward as it drops into the clouds.
      '.st-error .si-ch{animation:si-ch 2.4s ease-in .45s both}.si-rw{opacity:0}.st-error .si-rw{animation:si-fi .3s .45s both}' +
      '@keyframes si-ch{0%{transform:translate(0,0) rotate(0)}8%{transform:translate(2px,3px) rotate(3deg)}16%{transform:translate(-1px,2px) rotate(-2deg)}24%{transform:translate(1px,8px) rotate(4deg)}88%{opacity:1}100%{opacity:0;transform:translate(40px,560px) rotate(38deg)}}' +
      '.si-du{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .si-du{animation:si-du 2.4s ease-out .5s both}' +
      '@keyframes si-du{0%{opacity:0;transform:scale(.3)}20%{opacity:.5}100%{opacity:0;transform:scale(2.4)}}' +
      // Done: lanterns light one after another along the bridges and the eave; the waterfalls glitter.
      '.si-ll{opacity:0}.st-done .si-ll{animation:si-fi .9s ease-out both}' +
      '.st-done .si-win{animation:si-fi 1.2s ease-out both}' +
      '.si-wg{opacity:.3}.st-done .si-wg{animation:si-wg 1.6s ease-out .2s both}@keyframes si-wg{to{opacity:1}}' +
      '.si-bow{opacity:0}.st-done .si-bow{animation:si-bow 2.4s ease-out .6s both}@keyframes si-bow{to{opacity:.75}}' +
      '.si-gt{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .si-gt{animation:si-gt 1.3s ease-in-out infinite}' +
      '@keyframes si-gt{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:.95;transform:scale(1)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="si-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="#02060f"/><stop offset=".34" stop-color="#061128"/><stop offset=".6" stop-color="#0b1d3c"/><stop offset=".72" stop-color="#132e55"/><stop offset=".8" stop-color="#0e2242"/><stop offset="1" stop-color="#091a30"/></linearGradient>' +
      '<radialGradient id="si-dk"><stop offset="0" stop-color="#2d5c98" stop-opacity=".34"/><stop offset=".6" stop-color="#1a3a6a" stop-opacity=".12"/><stop offset="1" stop-color="#1a3a6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-rs"><stop offset="0" stop-color="#8a6c9c" stop-opacity=".22"/><stop offset="1" stop-color="#8a6c9c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-mh"><stop offset="0" stop-color="#a8c8ee" stop-opacity=".3"/><stop offset=".45" stop-color="#7aa4d8" stop-opacity=".1"/><stop offset="1" stop-color="#7aa4d8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="si-wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff" stop-opacity=".5"/><stop offset=".7" stop-color="#9cc9f2" stop-opacity=".26"/><stop offset="1" stop-color="#9cc9f2" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="si-ms"><stop offset="0" stop-color="#dcefff" stop-opacity=".45"/><stop offset="1" stop-color="#dcefff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-cg"><stop offset="0" stop-color="#5aaef0" stop-opacity=".6"/><stop offset="1" stop-color="#3a8dde" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-ln"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset=".4" stop-color="#ffb04a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-wp"><stop offset="0" stop-color="#a8c4e6" stop-opacity=".34"/><stop offset="1" stop-color="#a8c4e6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="si-du"><stop offset="0" stop-color="#9aaac0" stop-opacity=".6"/><stop offset="1" stop-color="#9aaac0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="si-env" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9cb8"/><stop offset=".4" stop-color="#4c5f80"/><stop offset="1" stop-color="#1a2438"/></linearGradient>' +
      '<linearGradient id="si-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8ecff" stop-opacity=".3"/><stop offset="1" stop-color="#d8ecff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#si-sky)"/>' +
      '<ellipse cx="520" cy="724" rx="1150" ry="190" fill="url(#si-dk)"/><ellipse cx="170" cy="716" rx="520" ry="84" fill="url(#si-rs)"/>' +
      `<path d="${dots(starA, 2.4)}" fill="#dce8ff" fill-opacity=".55"/><path class="si-tw" d="${dots(starB, 3)}" fill="#e8f0ff"/>` +
      // The moon, low over the big island, the tower standing against it.
      '<circle cx="226" cy="150" r="190" fill="url(#si-mh)"/><circle cx="226" cy="150" r="34" fill="#e2eaf4" fill-opacity=".85"/>' +
      '<g fill="#c4d2e4" fill-opacity=".5"><circle cx="216" cy="142" r="6"/><circle cx="238" cy="160" r="4"/><circle cx="230" cy="136" r="3"/></g>' +
      islets +
      `<g transform="translate(1050 352) scale(.22)"><g class="si-far">${farShip}</g></g>` +
      `<g class="mv-b">${band(0)}</g>` +
      islandR +
      islandM +
      bridge([872, 168], [1288, 238], 66, [0.14, 0.28, 0.42, 0.58, 0.72, 0.86], 0.9, false) +
      rocks +
      islandA +
      scar +
      `<g class="si-bow" fill="none" stroke-width="8" stroke-opacity=".5">${['#f0a0b0', '#ffd890', '#a8f0c0', '#90c8ff', '#c0a8ff'].map((c, i) => `<path d="M${84 + i * 8} 800A${182 - i * 8} ${182 - i * 8} 0 0 1 ${448 - i * 8} 800" stroke="${c}"/>`).join('')}</g>` +
      bridge([344, 268], [648, 168], 58, [0.14, 0.29, 0.43, 0.57, 0.71, 0.86], 0.2, true, lip) +
      // The big waterfall pours in front of the slab, so the slab falls away behind the water.
      fall(254, 270, 806, 24, 1.1, true, 7, 21) +
      '<ellipse class="si-du" cx="296" cy="332" rx="78" ry="40" fill="url(#si-du)"/>' +
      `<g fill="#22344f">${pebbles}</g>` +
      wisps +
      `<g class="mv-b">${band(1)}` +
      `<g class="si-ship"><g transform="translate(232 596)"><g class="si-sb">${airship()}</g></g></g>` +
      `${band(2)}${band(3)}</g>` +
      `<g fill="none" stroke="#c8dcf0" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round">${gulls}</g>`,
    nook:
      '<defs><radialGradient id="si-lm"><stop offset="0" stop-color="#ffc46b" stop-opacity=".34"/><stop offset=".5" stop-color="#ffa64a" stop-opacity=".1"/><stop offset="1" stop-color="#ffa64a" stop-opacity="0"/></radialGradient></defs>' +
      // Claude's own island: a grassy top, the workshop's low plank wall, its posts and slanted roof.
      '<path d="M-40 452Q-20 444 0 448T60 446T140 449T240 445T340 448T460 446V520H-40Z" fill="#0f1828"/>' +
      '<path d="M-40 452Q-20 444 0 448T60 446T140 449T240 445T340 448T460 446" fill="none" stroke="#163e31" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M-40 447Q-20 439 0 443T60 441T140 444T240 440T340 443T460 441" fill="none" stroke="#62b08a" stroke-opacity=".45" stroke-width="2"/>' +
      '<path d="M-40 452l-6 14l4 10l-8 16" fill="none" stroke="#0f1828" stroke-width="6"/>' +
      '<rect x="22" y="352" width="384" height="96" fill="#191310"/><path d="M22 378H406M22 404H406M22 428H406" stroke="#0f0b08" stroke-width="2"/>' +
      `<rect x="10" y="74" width="14" height="378" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
      `<rect x="404" y="44" width="14" height="408" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
      `<path d="M6 100L422 54" stroke="${WOOD}" stroke-width="12"/><path d="M6 106L422 60" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
      `<path d="M-34 82L446 20L448 42L-32 106Z" fill="#241a13" stroke="${WOOD_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="${Array.from({ length: 12 }, (_, i) => `M${f(-14 + i * 38)} ${f(80 - i * 4.9)}l2 22`).join('')}" stroke="#120d09" stroke-width="2"/>` +
      '<path d="M-34 82L446 20" stroke="#9cc4ec" stroke-opacity=".35" stroke-width="2"/>' +
      // The windsock on its pole above the roof.
      `<path d="M398 22V-66" stroke="${WOOD_EDGE}" stroke-width="4"/><circle cx="398" cy="-68" r="3" fill="${BRASS}"/>` +
      `<g class="si-sock"><path d="M394 -64L334 -56L336 -44L394 -50Z" fill="${CREAM}" fill-opacity=".85"/>` +
      `<path d="M374 -61.4L354 -58.8L355 -46.6L374 -48.2Z" fill="${ACCENT}"/><path d="M394 -64L334 -56L336 -44L394 -50Z" fill="none" stroke="#9a8a6a" stroke-width="1.2"/></g>` +
      // The eave's lantern string.
      `<path d="${eaveRope}" fill="none" stroke="${ROPE}" stroke-width="1.4"/>` +
      eave +
      // A propeller mounted on the wall, and the breeze it throws on a test run.
      `<g transform="translate(66 158)"><g class="si-pr">${propeller}</g><circle r="7" fill="${BRASS}" stroke="#7a5420" stroke-width="2"/></g>` +
      breeze +
      // The oil lamp hanging from the beam.
      '<g transform="translate(300 67)"><g class="si-lp"><path d="M0 0V40" stroke="#3a3024" stroke-width="2"/>' +
      '<circle class="si-lg" cy="52" r="120" fill="url(#si-lm)"/>' +
      `<path d="M-8 40H8L10 44H-10Z M-9 44H9V62H-9Z M-10 62H10L6 67H-6Z" fill="#1a1410" stroke="${BRASS}" stroke-width="1.5"/>` +
      `<rect x="-6" y="46" width="12" height="14" rx="2" fill="${LAMP}" fill-opacity=".85"/></g></g>`,
    front: '<path d="M96 456l3 -10l3 10M126 456l2 -8l3 8M212 456l3 -11l2 11M300 456l2 -7l3 7M398 456l3 -10l2 10" fill="none" stroke="#2f6a50" stroke-width="2"/>',
  }
}
