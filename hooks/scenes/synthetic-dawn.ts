import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Synthetic Dawn: a pristine white-tiled lab at night, a glass wall onto a dark pine forest. A tall glass pod on the
// left holds a sleeping synthetic; a neural lattice grows over the wall from the pod like a tree and runs along the
// ceiling to a socket above Claude's desk; cables cross the floor from the desk to the pod. Thinking sends light down
// the lattice toward the pod. A command powers the cables, fogs the pod, slides its glass open and lights the
// synthetic's eyes. An error rings the pod in soft red and dims the lattice. Done walks the synthetic out to raise a
// hand to Claude while the lattice blooms warm and dawn comes up behind the trees.
const ICE = '#8fe3ff'
const PALE = '#dff8ff'
const WARM = '#ffc48a'
const RED = '#ff5a64'
const METAL = '#141e28'
const EDGE = '#34485a'
const DARK = '#0b1219'

type Net = { segs: [number, number, number, number, number][]; dots: [number, number, number, number][] }

const r0 = (n: number): number => Math.round(n)
/** A node: a zero-length stroke with round caps draws a dot of the stroke's width. */
const dot = (x: number, y: number): string => `M${r0(x)} ${r0(y)}h0`

/** A lattice as one group per level (its distance from the pod), so light can step along it level by level. */
function netMarkup(net: Net, column?: [number, number]): { levels: string; warm: string } {
  type Slot = { s: string; sd: string; o: string; od: string }
  const by = new Map<number, Slot>()
  const slot = (lv: number): Slot => {
    const found = by.get(lv)

    if (found !== undefined) {
      return found
    }

    const made = { s: '', sd: '', o: '', od: '' }
    by.set(lv, made)

    return made
  }
  const inColumn = (x: number): boolean => column !== undefined && x > column[0] && x < column[1]
  let warm = ''
  let warmDim = ''
  let warmDots = ''

  for (const [x1, y1, x2, y2, lv] of net.segs) {
    const d = `M${r0(x1)} ${r0(y1)}L${r0(x2)} ${r0(y2)}`
    const s = slot(lv)

    if (inColumn((x1 + x2) / 2)) {
      s.sd += d
      warmDim += d
    } else {
      s.s += d
      warm += d
    }
  }

  for (const [x, y, , lv] of net.dots) {
    const s = slot(lv)

    if (inColumn(x)) {
      s.od += dot(x, y)
    } else {
      s.o += dot(x, y)
      warmDots += dot(x, y)
    }
  }

  const levels = [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(
      ([lv, s]) =>
        `<g class="sn-lv" style="--d:${f((15 - lv) * 0.16)}s;--u:${f(1.4 + lv * 0.06)}s">` +
        (s.o ? `<path d="${s.o}" stroke="${ICE}" stroke-opacity=".12" stroke-width="${lv < 3 ? 22 : 16}"/>` : '') +
        (s.s ? `<path d="${s.s}" stroke="${ICE}" stroke-opacity=".65" stroke-width="${f(Math.max(1.5, 3.6 - lv * 0.4))}"/>` : '') +
        (s.sd ? `<path d="${s.sd}" stroke="${ICE}" stroke-opacity=".2" stroke-width="1.4"/>` : '') +
        (s.o ? `<path d="${s.o}" stroke="${PALE}" stroke-width="${lv < 3 ? 8 : 5.6}"/>` : '') +
        (s.od ? `<path d="${s.od}" stroke="${PALE}" stroke-opacity=".3" stroke-width="4.4"/>` : '') +
        '</g>',
    )
    .join('')

  return {
    levels,
    warm:
      (warm ? `<path d="${warm}" stroke="${WARM}" stroke-opacity=".75" stroke-width="2"/>` : '') +
      (warmDim ? `<path d="${warmDim}" stroke="${WARM}" stroke-opacity=".22" stroke-width="1.6"/>` : '') +
      (warmDots ? `<path d="${warmDots}" stroke="#ffe6c8" stroke-width="5.6"/>` : ''),
  }
}

/** The lattice over the left wall, grown from the pod's cap, and its line along the header beam toward the desk. */
function canopy(): Net {
  const next = random(23)
  const net: Net = { segs: [], dots: [] }
  const add = (x1: number, y1: number, x2: number, y2: number, lv: number, r: number): void => {
    net.segs.push([x1, y1, x2, y2, lv])
    net.dots.push([x2, y2, r, lv])
  }
  // Each branch bends along the ceiling, the wall's edges and the pod instead of running into them, like ivy.
  const grow = (x: number, y: number, ang: number, len: number, lv: number, depth: number): void => {
    let ex = Math.min(416, Math.max(16, x + Math.cos(ang) * len))
    let ey = Math.min(720, Math.max(98 + next() * 14, y + Math.sin(ang) * len))

    if (ex > 118 && ex < 382 && ey > 226) {
      ex = ex < 250 ? 112 - next() * 20 : 388 + next() * 20
    }

    if (Math.hypot(ex - x, ey - y) < 16 || net.dots.some(([dx, dy]) => Math.hypot(dx - ex, dy - ey) < 14)) {
      return
    }

    add(x, y, ex, ey, lv, depth > 1 ? 3.4 : 2.4)

    if (depth === 0) {
      return
    }

    const heading = Math.atan2(ey - y, ex - x)
    const n = depth > 1 && next() < 0.3 ? 3 : 2

    for (let k = 0; k < n; k += 1) {
      grow(ex, ey, heading + (k - (n - 1) / 2) * 0.66 + (next() - 0.5) * 0.3, len * (0.8 + next() * 0.12), lv + 1, depth - 1)
    }
  }

  net.dots.push([250, 236, 5, 0])
  add(250, 236, 250, 194, 1, 4)
  grow(250, 194, -3.05, 84, 1, 4)
  grow(250, 194, 2.75, 84, 1, 4)
  grow(250, 194, -2.45, 74, 1, 4)
  grow(250, 194, -1.75, 60, 1, 3)
  grow(250, 194, -1.05, 66, 1, 3)
  grow(250, 194, -0.2, 76, 1, 4)

  // A few cross-links between near nodes make it a lattice rather than a bare tree.
  const tips = net.dots.slice(2)
  let links = 0

  for (let i = 0; i < tips.length && links < 12; i += 1) {
    for (let j = i + 1; j < tips.length && links < 12; j += 1) {
      const [ax, ay, , al] = tips[i] ?? [0, 0, 0, 0]
      const [bx, by, , bl] = tips[j] ?? [0, 0, 0, 0]
      const d = Math.hypot(ax - bx, ay - by)

      if (Math.abs(al - bl) <= 1 && d > 24 && d < 52 && next() < 0.5) {
        net.segs.push([ax, ay, bx, by, Math.max(al, bl)])
        links += 1
      }
    }
  }

  const main: [number, number][] = [
    [250, 204],
    [322, 160],
    [404, 122],
    [530, 106],
    [670, 102],
    [810, 100],
    [950, 100],
    [1090, 102],
    [1230, 106],
    [1370, 108],
    [1510, 108],
    [1780, 108],
  ]

  for (let i = 1; i < main.length; i += 1) {
    const [x1, y1] = main[i - 1] ?? [0, 0]
    const [x2, y2] = main[i] ?? [0, 0]

    add(x1, y1, x2, y2, i + 1, i < 3 ? 3.4 : 2.6)

    if (i >= 3 && i < main.length - 1) {
      const tx = x2 + (next() - 0.5) * 50
      const ty = y2 + 18 + next() * 16

      add(x2, y2, tx, ty, i + 2, 2)
    }
  }

  return net
}

/** One joint of the synthetic: a dark socket with a fine mesh across it, and the glow it shows while being read. */
function joint(cx: number, cy: number, r: number, index: number): string {
  const k = Math.SQRT1_2
  let d = ''

  for (const [nx, ny, tx, ty] of [
    [k, k, k, -k],
    [k, -k, k, k],
  ] as const) {
    for (const o of [-0.5, 0, 0.5]) {
      const off = o * r
      const h = Math.sqrt(r * r - off * off) * 0.86
      const mx = cx + nx * off
      const my = cy + ny * off

      d += `M${f(mx - tx * h)} ${f(my - ty * h)}L${f(mx + tx * h)} ${f(my + ty * h)}`
    }
  }

  return (
    `<circle class="sn-jg" style="--j:${index}" cx="${cx}" cy="${cy}" r="${r + 20}" fill="url(#sn-eg)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3a4652" stroke="#8a9aa8" stroke-opacity=".6"/>` +
    `<path d="${d}" stroke="${ICE}" stroke-opacity=".6" stroke-width="1"/>`
  )
}

/** Claude's starburst, the hero emblem: rays of two lengths around a small disc. */
function burst(cx: number, cy: number, r: number): string {
  let d = ''

  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2
    const len = i % 2 ? r * 0.62 : r
    const p = (at: number, by: number): string => `${f(cx + Math.cos(at) * by)} ${f(cy + Math.sin(at) * by)}`

    d += `M${p(a - 0.2, r * 0.2)}L${p(a, len)}L${p(a + 0.2, r * 0.2)}Z`
  }

  return `<path d="${d}" fill="#d97757"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.24)}" fill="#ffd2bd"/>`
}

/** The synthetic: smooth and featureless, mesh at the joints, asleep with its head tipped until it wakes. */
function synthetic(): string {
  const skin = ' fill="url(#sn-skin)"'
  let n = 0
  const j = (cx: number, cy: number, r: number): string => joint(cx, cy, r, n++)

  return (
    '<g class="sn-hover"><g class="sn-fig">' +
    // Legs, knees, pelvis and hips.
    `<path d="M210 616C206 652 214 690 218 722H240C243 690 248 652 246 628Z"${skin}/><path d="M290 616C294 652 286 690 282 722H260C257 690 252 652 254 628Z"${skin}/>` +
    `<path d="M218 742C214 778 219 808 221 836H237C240 808 244 778 240 742Z"${skin}/><path d="M282 742C286 778 281 808 279 836H263C260 808 256 778 260 742Z"${skin}/>` +
    `<path d="M216 836H241L246 848H210Z"${skin}/><path d="M284 836H259L254 848H290Z"${skin}/>` +
    `<path d="M222 580H278L290 612C280 628 264 634 250 634C236 634 220 628 210 612Z"${skin}/>` +
    j(250, 572, 8) +
    j(226, 622, 6) +
    j(274, 622, 6) +
    j(229, 732, 7) +
    j(271, 732, 7) +
    // The torso, its seams and the dormant core.
    `<path d="M194 398C194 388 216 384 250 384C284 384 306 388 306 398L300 452C296 500 284 536 280 564L220 564C216 536 204 500 200 452Z"${skin}/>` +
    '<path d="M250 392V556M214 440C230 452 270 452 286 440" fill="none" stroke="#3d4a57" stroke-opacity=".7" stroke-width="1.4"/>' +
    '<circle cx="250" cy="432" r="5" fill="#2b3642" stroke="#5d6e7e" stroke-width="1.2"/>' +
    `<g class="sn-core"><circle cx="250" cy="432" r="26" fill="url(#sn-eg)"/><circle cx="250" cy="432" r="4" fill="${PALE}"/></g>` +
    `<g class="sn-star"><circle cx="250" cy="432" r="40" fill="url(#sn-cg)"/>${burst(250, 432, 15)}</g>` +
    // The far arm, hanging.
    `<path d="M186 410L200 412L194 500L180 498Z"${skin}/><path d="M180 516L194 517L190 600L178 598Z"${skin}/>` +
    `<path d="M176 600L192 601L194 626C190 636 178 636 175 626Z"${skin}/>` +
    j(187, 508, 6) +
    // The neck and the head, tipped while it sleeps.
    `<path d="M242 360H258L260 388H240Z"${skin}/>` +
    j(250, 378, 6) +
    '<g class="sn-head">' +
    `<ellipse cx="250" cy="332" rx="24" ry="31"${skin}/>` +
    '<path d="M229 324C240 319 260 319 271 324" fill="none" stroke="#3d4a57" stroke-width="1.4"/>' +
    '<path d="M238 334H246M254 334H262" stroke="#2b3642" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle class="sn-dream" cx="250" cy="324" r="44" fill="url(#sn-eg)"/>' +
    '<g class="sn-eyes"><circle cx="250" cy="334" r="34" fill="url(#sn-eg)"/>' +
    '<path d="M237 334H247M253 334H263" stroke="#f2fdff" stroke-width="3" stroke-linecap="round"/></g>' +
    '</g>' +
    j(196, 404, 8) +
    // The near arm: it rises toward Claude when done, the forearm up and the hand open.
    '<g class="sn-arm">' +
    `<path d="M314 410L300 412L306 500L320 498Z"${skin}/>` +
    '<g class="sn-fore">' +
    `<path d="M320 516L306 517L310 600L322 598Z"${skin}/><path d="M324 600L308 601L306 626C310 636 322 636 325 626Z"${skin}/>` +
    '</g>' +
    j(313, 508, 6) +
    '</g>' +
    j(304, 404, 8) +
    '</g></g>'
  )
}

/** The pod: its cap with the lattice's root, the lit interior, the synthetic, fog, the sliding glass and the base. */
function pod(): string {
  const next = random(41)
  const motes = Array.from({ length: 8 }, () => {
    const style = `--m:${f(7 + next() * 5)}s;animation-delay:${f(-next() * 10)}s`

    return `<circle class="sn-mote" style="${style}" cx="${f(176 + next() * 148)}" cy="${f(700 + next() * 140)}" r="${f(1.3 + next() * 1.3)}" fill="${PALE}"/>`
  }).join('')
  const fog = (
    [
      [250, 790, 124, 84, 1],
      [222, 700, 112, 92, 1.12],
      [280, 610, 116, 92, 1.24],
      [240, 520, 122, 92, 1.36],
      [266, 430, 112, 86, 1.48],
      [236, 350, 108, 72, 1.6],
    ] as const
  )
    .map(([x, y, rx, ry, at]) => `<ellipse class="sn-fog" style="--f:${at}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#sn-fg)"/>`)
    .join('')
  const conduit = 'M148 850V292M352 850V292'

  return (
    // The pod's light on the wall and the floor.
    '<circle class="sn-pglow" cx="250" cy="560" r="430" fill="url(#sn-pg)"/>' +
    '<rect class="sn-pglow" x="130" y="904" width="240" height="120" fill="url(#sn-rf)"/>' +
    // The side conduits from the base up to the cap.
    `<path d="${conduit}" stroke="${DARK}" stroke-width="7"/><path d="${conduit}" stroke="${EDGE}" stroke-width="1.4"/>` +
    `<path class="sn-pu" pathLength="1" d="M148 850V292" stroke="${PALE}" stroke-width="3" stroke-dasharray=".1 2"/>` +
    `<path class="sn-pu" pathLength="1" d="M352 850V292" stroke="${PALE}" stroke-width="3" stroke-dasharray=".1 2"/>` +
    // The interior.
    '<g clip-path="url(#sn-pc)"><rect x="158" y="288" width="184" height="564" fill="url(#sn-pi)"/>' +
    '<ellipse class="sn-pglow" cx="250" cy="850" rx="150" ry="280" fill="url(#sn-bl)"/>' +
    `<rect class="sn-redt" x="158" y="288" width="184" height="564" fill="${RED}" fill-opacity=".14"/>` +
    `${motes}</g>` +
    synthetic() +
    // Fog, the scanner ring, and the front glass that slides up into the cap.
    '<g clip-path="url(#sn-pc)">' +
    fog +
    '<g class="sn-scan"><ellipse cx="250" cy="840" rx="96" ry="13" fill="none" stroke="#8fe3ff" stroke-opacity=".16" stroke-width="12"/>' +
    `<ellipse cx="250" cy="840" rx="96" ry="13" fill="none" stroke="${PALE}" stroke-opacity=".9" stroke-width="2"/></g>` +
    '<g class="sn-glass"><rect x="160" y="290" width="180" height="560" fill="#bfefff" fill-opacity=".04"/>' +
    '<rect x="172" y="296" width="9" height="548" fill="#e8fbff" fill-opacity=".13"/><rect x="186" y="296" width="3" height="548" fill="#e8fbff" fill-opacity=".08"/>' +
    '<rect x="318" y="296" width="6" height="548" fill="#e8fbff" fill-opacity=".06"/>' +
    `<path d="M161 290V850M339 290V850" stroke="${ICE}" stroke-opacity=".4" stroke-width="2"/><path d="M162 847H338" stroke="${PALE}" stroke-opacity=".7" stroke-width="2.4"/></g>` +
    '</g>' +
    // The cap.
    `<path d="M142 292L150 254C156 244 196 236 250 236C304 236 344 244 350 254L358 292Z" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    '<path d="M168 250C200 243 300 243 332 250" fill="none" stroke="#5d7488" stroke-opacity=".6" stroke-width="2"/>' +
    `<rect x="150" y="282" width="200" height="10" fill="${DARK}"/>` +
    `<path class="sn-pglow" d="M160 290H340" stroke="${ICE}" stroke-width="3"/>` +
    `<circle cx="250" cy="236" r="8" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    // The base, its ring light, the data flow and the flare when power arrives.
    `<path d="M134 850H366L374 904H126Z" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/>` +
    `<path d="M140 878H360" stroke="${DARK}" stroke-width="3"/>` +
    `<g fill="${ICE}" fill-opacity=".7"><circle cx="232" cy="891" r="2.4"/><circle cx="250" cy="891" r="2.4"/><circle cx="268" cy="891" r="2.4"/></g>` +
    `<path class="sn-pglow" d="M146 852H354" stroke="${ICE}" stroke-width="3"/>` +
    `<path class="sn-flow" d="M146 852H354" stroke="${PALE}" stroke-width="3" stroke-dasharray="10 14"/>` +
    `<g class="sn-flare"><ellipse cx="250" cy="852" rx="150" ry="26" fill="url(#sn-bl)"/><path d="M146 852H354" stroke="${PALE}" stroke-width="4"/></g>` +
    // Fog spilling over the base once the glass opens.
    '<ellipse class="sn-spill" cx="250" cy="912" rx="170" ry="20" fill="url(#sn-fg)"/>' +
    '<ellipse class="sn-spill" cx="196" cy="932" rx="130" ry="16" fill="url(#sn-fg)"/>' +
    '<ellipse class="sn-spill" cx="312" cy="928" rx="140" ry="18" fill="url(#sn-fg)"/>' +
    // The warning ring that circles the pod on an error, and its red light on the floor.
    `<g class="sn-err"><ellipse cx="250" cy="916" rx="230" ry="36" fill="url(#sn-rg)"/><path d="M146 852H354" stroke="${RED}" stroke-width="3"/>` +
    '<g class="sn-erm">' +
    `<ellipse cx="250" cy="800" rx="128" ry="22" fill="none" stroke="${RED}" stroke-opacity=".16" stroke-width="14"/>` +
    '<ellipse cx="250" cy="800" rx="128" ry="22" fill="none" stroke="#ff7a80" stroke-opacity=".6" stroke-width="2"/>' +
    '<ellipse class="sn-orb" pathLength="1" cx="250" cy="800" rx="128" ry="22" fill="none" stroke="#ffc0c3" stroke-width="3.4" stroke-dasharray=".16 .84" stroke-linecap="round"/>' +
    '</g></g>'
  )
}

/** A ridge of pines as one silhouette: tiered trees that overlap along a base line. */
function pines(seed: number, from: number, to: number, base: number, low: number, high: number): string {
  const next = random(seed)
  let d = `M${from} 1000V${base}`

  for (let x = from; x < to; ) {
    const h = low + next() * (high - low)
    const w = h * (0.36 + next() * 0.12)
    const cx = x + w / 2
    const tiers = 3
    const step = h / (tiers + 0.6)
    const left: string[] = []
    const right: string[] = []

    for (let t = 0; t < tiers; t += 1) {
      const y = base - t * step
      const half = (w / 2) * (1 - t / (tiers + 0.4))

      left.push(`${r0(cx - half)} ${r0(y)}`, `${r0(cx - half * 0.42)} ${r0(y - step * 0.62)}`)
      right.unshift(`${r0(cx + half * 0.42)} ${r0(y - step * 0.62)}`, `${r0(cx + half)} ${r0(y)}`)
    }

    d += `L${left.join('L')}L${r0(cx)} ${r0(base - h)}L${right.join('L')}`
    x += w * (0.4 + next() * 0.7)
  }

  return `${d}V1000Z`
}

/** The floating glass terminal: an emitter puck on the desk, a glass keyboard, and a pane hovering over the beam. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web' ? ' sn-busy' : ''
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 11}" y="324" width="7" height="2.6"/>`).join('')
  const lines = (
    [
      [325, 240, 40],
      [323, 252, 54],
      [321, 264, 32],
      [319, 276, 48],
      [317, 288, 26],
    ] as const
  )
    .map(([x, y, w], i) => `<path class="sn-ln${busy}" style="animation-delay:${f(-i * 0.22)}s" d="M${x} ${y}h${w}"/>`)
    .join('')

  return (
    `<path d="M338 322L318 302H402L384 322Z" fill="${light}" fill-opacity=".07"/>` +
    `<rect x="330" y="322" width="58" height="8" rx="4" fill="#223040" stroke="${EDGE}" stroke-width="1.2"/>` +
    `<path d="M338 323.5H380" stroke="${light}" stroke-opacity=".85" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M244 330L250 321H322L328 330Z" fill="${light}" fill-opacity=".12" stroke="${light}" stroke-opacity=".45" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<g fill="${light}" fill-opacity=".6">${keys}</g>` +
    '<g class="sn-float">' +
    `<path d="M310 298L320 222H410L400 298Z" fill="${light}" fill-opacity=".1" stroke="${light}" stroke-opacity=".75" stroke-width="2" stroke-linejoin="round"/>` +
    '<path d="M322 225H407" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.4"/>' +
    `<g stroke="${light}" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round">${lines}</g>` +
    // A little outline of the synthetic in the corner of the pane.
    `<g fill="none" stroke="${light}" stroke-opacity=".85" stroke-width="1.6"><circle cx="390" cy="242" r="5"/><path d="M382 264C382 254 398 254 398 264L396 284M384 264L386 284"/></g>` +
    '</g>'
  )
}

export function syntheticDawnWorld(): World {
  const next = random(5)
  const lattice = netMarkup(canopy(), [430, 1190])
  const right: Net = {
    segs: [
      [300, -436, 300, -344, 12],
      [300, -344, 300, -256, 13],
      [300, -256, 300, -176, 14],
      [300, -344, 352, -378, 13],
      [300, -344, 246, -316, 13],
      [300, -256, 362, -234, 14],
      [300, -256, 236, -282, 14],
      [352, -378, 398, -360, 14],
      [246, -316, 212, -350, 14],
      [362, -234, 404, -262, 15],
    ],
    dots: [
      [300, -344, 3.4, 12],
      [300, -256, 3.4, 13],
      [352, -378, 3, 13],
      [246, -316, 3, 13],
      [362, -234, 3, 14],
      [236, -282, 2.6, 14],
      [398, -360, 2.4, 14],
      [212, -350, 2.4, 14],
      [404, -262, 2.4, 15],
    ],
  }
  const wall = netMarkup(right)
  const tiles = (x0: number, x1: number): string => {
    let d = ''

    for (let x = x0; x <= x1; x += 44) {
      d += `M${x} 80V830`
    }

    for (let y = 80; y <= 830; y += 44) {
      d += `M${x0} ${y}H${x1}`
    }

    return d
  }
  const floor =
    Array.from({ length: 19 }, (_, i) => {
      const x = 800 + (i - 9) * 120

      return `M${x} 830L${f(800 + (x - 800) * 1.77)} 1100`
    }).join('') + [842, 860, 886, 922, 970].map(y => `M-20 ${y}H1620`).join('')
  const stars = Array.from({ length: 26 }, () => `M${f(470 + next() * 760)} ${f(120 + next() * 300)}h2.4v2.4h-2.4z`).join('')
  const cable1 = 'M392 334C398 362 386 372 340 372H-800'
  const cable2 = 'M410 336C418 368 404 380 352 380H-800'
  const riser1 = 'M780 912H420C394 912 382 900 372 888'
  const riser2 = 'M780 920H404C380 920 366 914 356 904'
  const pings = [0, 0.8, 1.6].map(d => `<g class="sn-ping" style="animation-delay:${d}s"><circle cx="404" cy="122" r="12" fill="url(#sn-eg)"/><circle cx="404" cy="122" r="3.6" fill="${PALE}"/></g>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'holo',
      cup: 'none',
      thought: 'orbs',
      ink: '#03060a',
      furniture: '#182330',
      metal: '#223040',
      paper: '#dfe9f0',
      light: { idle: '#4aa6c8', work: ICE, bright: PALE },
      headTop: 214,
      glowAt: [356, 262],
      device,
      wear: {
        // A chrome neural headset over the top of the head: its rim stops at y 252, above the eyes' top row, and the
        // temple bars and their nodes sit outside the eye columns (x 102..214).
        front:
          '<path d="M64 252C64 228 100 212 150 212C200 212 236 228 236 252Z" fill="#5f6d7b" stroke="#2b3642" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M70 244C92 232 120 228 150 228C180 228 208 232 230 244V250H70Z" fill="#36424e"/>' +
          '<path d="M96 222C116 215 136 214 150 214C168 214 186 216 202 222C186 220 168 219 150 219C132 219 114 220 96 222Z" fill="#e4eef6"/>' +
          '<path d="M64 251H236" stroke="#a6b6c4" stroke-width="2"/>' +
          // Slim temple bars down the sides, outside the eye columns, each ending in a glowing node.
          '<path d="M69 250H75V264H69ZM225 250H231V264H225Z" fill="#4a5764" stroke="#2b3642" stroke-width="1.2"/>' +
          // A lattice of nodes across the dome's dark band, and the seam down the near side into its node.
          `<g class="sn-seam" fill="none" stroke-linecap="round"><path d="M104 240L126 228L150 234L174 226L198 238M126 228L136 246M150 234L162 246M174 226L186 244" stroke="${ICE}" stroke-opacity=".6" stroke-width="1.4"/>` +
          `<path d="M104 240h0M126 228h0M150 234h0M174 226h0M198 238h0M136 246h0M162 246h0M186 244h0" stroke="${PALE}" stroke-width="3.6"/>` +
          `<path d="M172 216C202 221 224 232 228 246V264" stroke="${ICE}" stroke-opacity=".25" stroke-width="6"/><path d="M172 216C202 221 224 232 228 246V264" stroke="${ICE}" stroke-width="2"/>` +
          `<path d="M72 268h0M228 268h0" stroke="${ICE}" stroke-opacity=".3" stroke-width="13"/><path d="M72 268h0M228 268h0" stroke="${PALE}" stroke-width="6"/></g>`,
      },
      seatArt:
        // A molded lab stool on one pedestal, with a thin light ring under the seat.
        '<path d="M106 356C106 352 126 350 151 350C176 350 196 352 196 356C196 364 176 368 151 368C126 368 106 364 106 356Z" fill="#1d2935" stroke="#3a4b5c" stroke-width="2"/>' +
        `<path d="M116 362C132 368 170 368 186 362" fill="none" stroke="${ICE}" stroke-opacity=".4" stroke-width="1.5"/>` +
        '<path d="M146 368H156L158 444H144Z" fill="#141e28"/>' +
        '<ellipse cx="151" cy="450" rx="40" ry="6" fill="#141e28" stroke="#2e3d4c" stroke-width="2"/>',
      tableArt:
        // A white slab desk, lit along its front edge, on a thin leg and a side panel.
        '<rect x="166" y="330" width="304" height="10" rx="2" fill="#1f2c39" stroke="#3d5163" stroke-width="1.4"/>' +
        '<path d="M170 331H466" stroke="#cfe6f2" stroke-opacity=".4" stroke-width="1.4"/>' +
        `<path d="M172 340H464" stroke="${ICE}" stroke-opacity=".5" stroke-width="2"/>` +
        '<path d="M186 341H196L192 456H182Z" fill="#141e28"/>' +
        '<path d="M428 341H452V456H428Z" fill="#141e28" stroke="#2b3a49" stroke-width="1.4"/>' +
        `<path d="M434 360V440" stroke="${ICE}" stroke-opacity=".25" stroke-width="2"/>`,
    },
    style:
      // Ambient: the pod's light breathes, the synthetic floats a little in its sleep, motes rise in the pod, mist
      // drifts past the trees, the headpiece seam pulses and the glass pane hovers.
      '.sn-pglow{animation:sn-br 5s ease-in-out infinite alternate}@keyframes sn-br{from{opacity:.7}to{opacity:1}}' +
      '.sn-hover{animation:sn-hover 6s ease-in-out infinite alternate}@keyframes sn-hover{to{transform:translateY(-4px)}}' +
      '.sn-mote{opacity:0;animation:sn-mote var(--m,9s) linear infinite}' +
      '@keyframes sn-mote{0%{opacity:0;transform:translateY(0)}15%{opacity:.7}85%{opacity:.4}100%{opacity:0;transform:translateY(-440px)}}' +
      '.st-responding .sn-mote{animation-duration:3.6s}' +
      '.sn-mist{animation:sn-mist 34s ease-in-out infinite alternate}.sn-mist2{animation-duration:46s;animation-direction:alternate-reverse}' +
      '@keyframes sn-mist{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
      '.sn-stars{animation:sn-tw 5s ease-in-out infinite alternate}@keyframes sn-tw{from{opacity:.45}to{opacity:.9}}' +
      '.sn-seam{animation:sn-seam 3.4s ease-in-out infinite alternate}@keyframes sn-seam{from{opacity:.45}to{opacity:1}}' +
      '.st-thinking .sn-seam,.st-run .sn-seam{animation-duration:.8s}' +
      '.sn-float{animation:sn-float 4.8s ease-in-out infinite alternate}@keyframes sn-float{to{transform:translateY(-6px)}}' +
      '.sn-ln{opacity:.8}.sn-busy{animation:sn-ln 1.1s ease-in-out infinite alternate}@keyframes sn-ln{from{opacity:.25}to{opacity:1}}' +
      // The lattice: each level breathes on its own; thinking steps light from Claude's corner to the pod.
      '.sn-lv{opacity:.42;animation:sn-lv 6s ease-in-out infinite alternate;animation-delay:calc(var(--d) * -2)}' +
      '@keyframes sn-lv{from{opacity:.3}to{opacity:.62}}' +
      '.st-responding .sn-lv{animation-duration:1.8s}' +
      '.st-thinking .sn-lv{animation:sn-cas 3.2s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes sn-cas{0%{opacity:.28}7%{opacity:1}30%,100%{opacity:.28}}' +
      '.sn-dream{opacity:0}.st-thinking .sn-dream{animation:sn-dream 3.2s ease-out infinite}' +
      '@keyframes sn-dream{0%,74%{opacity:0}82%{opacity:.85}100%{opacity:0}}' +
      '.st-run .sn-lv,.st-done .sn-lv{animation:sn-on .6s ease-out var(--u) both}@keyframes sn-on{from{opacity:.3}to{opacity:1}}' +
      '.st-error .sn-lat{animation:sn-dim 1.2s ease-out both}@keyframes sn-dim{to{opacity:.25}}' +
      '.st-error .sn-lv{animation:none;opacity:.4}' +
      '.sn-warm,.sn-bloom,.sn-dawn{opacity:0}' +
      '.st-done .sn-warm{animation:sn-in 2s ease-out .5s both}.st-done .sn-bloom{animation:sn-in 2.6s ease-out .6s both}' +
      '.st-done .sn-dawn{animation:sn-in 3.2s ease-out .4s both}@keyframes sn-in{to{opacity:1}}' +
      '.st-done .sn-stars{animation:sn-out 3s ease-out both}@keyframes sn-out{to{opacity:.1}}' +
      // Web: pings run out along the ceiling line, away from the pod.
      '.sn-ping{opacity:0}.st-web .sn-ping{animation:sn-ping 2.4s linear infinite}' +
      '@keyframes sn-ping{0%{opacity:0;transform:translate(0,0)}8%{opacity:.8}85%{opacity:.5}100%{opacity:0;transform:translate(860px,-16px)}}' +
      // Responding: data marches into the pod's base ring. Tool: a scanner ring sweeps the synthetic. Read: its
      // joints light one after another.
      '.sn-flow{opacity:0}.st-responding .sn-flow{opacity:.8;animation:sn-flow 1s linear infinite}@keyframes sn-flow{to{stroke-dashoffset:-24}}' +
      '.sn-scan{opacity:0}.st-tool .sn-scan{opacity:1;animation:sn-scan 2.2s ease-in-out infinite alternate}@keyframes sn-scan{to{transform:translateY(-530px)}}' +
      '.sn-jg{opacity:0}.st-read .sn-jg{animation:sn-jg 2.6s ease-in-out infinite;animation-delay:calc(var(--j) * .2s)}' +
      '@keyframes sn-jg{0%,100%{opacity:0}15%{opacity:1}45%{opacity:0}}' +
      // Run: power runs down the cables from the desk, up the pod's conduits; the base flares, fog fills the pod,
      // the glass slides up into the cap, the head lifts and the eyes light.
      '.sn-pw,.sn-pr,.sn-pu{opacity:0}' +
      '.st-run .sn-pw{opacity:1;animation:sn-pw 1.2s linear infinite backwards}@keyframes sn-pw{0%{stroke-dashoffset:.06}75%,100%{stroke-dashoffset:-1}}' +
      '.st-run .sn-pr{opacity:1;animation:sn-pr 1.2s linear .62s infinite backwards}@keyframes sn-pr{0%{stroke-dashoffset:.1}30%,100%{stroke-dashoffset:-1}}' +
      '.st-run .sn-pu{opacity:1;animation:sn-pr 1.2s linear 1s infinite backwards}' +
      '.sn-flare{opacity:0}.st-run .sn-flare{animation:sn-in .5s ease-out 1s both}' +
      '.sn-fog{opacity:0}.st-run .sn-fog{animation:sn-fog 1.6s ease-out var(--f) both}' +
      '@keyframes sn-fog{from{opacity:0;transform:translateY(90px)}to{opacity:1;transform:translateY(0)}}' +
      '.st-run .sn-glass{animation:sn-open 1s cubic-bezier(.5,0,.3,1) 1.6s both}.st-done .sn-glass{animation:sn-open .9s cubic-bezier(.5,0,.3,1) both}' +
      '@keyframes sn-open{to{transform:translateY(-580px)}}' +
      '.sn-spill{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .sn-spill{animation:sn-spill 2.4s ease-out 1.9s both}' +
      '@keyframes sn-spill{from{opacity:0;transform:scaleX(.4)}to{opacity:1;transform:scaleX(1.5)}}' +
      '.sn-eyes,.sn-core{opacity:0}.st-run .sn-eyes{animation:sn-in .5s ease-out 2.2s both}.st-done .sn-eyes{animation:sn-in .4s ease-out .3s both}' +
      '.st-run .sn-core{animation:sn-in .6s ease-out 1.8s both}' +
      '.sn-head{transform-origin:250px 372px;transform:rotate(-7deg)}' +
      '.st-run .sn-head{animation:sn-lift .8s ease-in-out 2s both}.st-done .sn-head{animation:sn-lift .6s ease-out both}@keyframes sn-lift{to{transform:rotate(0)}}' +
      // Error: a soft red ring rides up and down the pod, the pod's light and the lattice dim.
      '.sn-err,.sn-redt{opacity:0}.st-error .sn-err,.st-error .sn-redt{animation:sn-in .6s ease-out both}' +
      '.st-error .sn-erm{animation:sn-erm 3.6s ease-in-out infinite alternate}@keyframes sn-erm{to{transform:translateY(-450px)}}' +
      '.st-error .sn-orb{animation:sn-orb 1.8s linear infinite}@keyframes sn-orb{to{stroke-dashoffset:-1}}' +
      '.st-error .sn-pglow{animation:sn-dim 1.2s ease-out both}.st-error .sn-head{transform:rotate(-12deg) translateY(4px)}' +
      // Done: the glass opens, the synthetic steps out and raises a hand to Claude, a starburst wakes in its chest.
      '.st-done .sn-hover{animation:none}' +
      '.st-done .sn-fig{animation:sn-step 1.5s ease-in-out .7s both}' +
      '.sn-fig{transform-origin:250px 848px}@keyframes sn-step{0%{transform:translate(0,0) scale(1)}45%{transform:translate(14px,-10px) scale(1.02)}100%{transform:translate(28px,52px) scale(1.06)}}' +
      '.sn-arm{transform-origin:306px 404px}.sn-fore{transform-origin:313px 508px}' +
      '.st-done .sn-arm{animation:sn-arm .9s ease-out 1.9s both}@keyframes sn-arm{to{transform:rotate(-34deg)}}' +
      '.st-done .sn-fore{animation:sn-fore .9s ease-out 1.9s both,sn-wave 1.1s ease-in-out 2.8s infinite alternate}' +
      '@keyframes sn-fore{to{transform:rotate(-146deg)}}@keyframes sn-wave{from{transform:rotate(-146deg)}to{transform:rotate(-160deg)}}' +
      '.sn-star{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .sn-star{animation:sn-star 1s ease-out 1.8s both}' +
      '@keyframes sn-star{from{opacity:0;transform:scale(.2) rotate(-40deg)}to{opacity:1;transform:scale(1) rotate(0)}}' +
      '.st-sleeping .sn-pglow{animation:sn-doze 1.2s ease-out both}@keyframes sn-doze{to{opacity:.5}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070b"/><stop offset=".55" stop-color="#08111a"/><stop offset="1" stop-color="#112230"/></linearGradient>' +
      '<linearGradient id="sn-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1016"/><stop offset="1" stop-color="#0f1820"/></linearGradient>' +
      '<linearGradient id="sn-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c141c"/><stop offset=".5" stop-color="#080d13"/><stop offset="1" stop-color="#05080c"/></linearGradient>' +
      '<linearGradient id="sn-mi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc0d2" stop-opacity="0"/><stop offset=".5" stop-color="#9cc0d2" stop-opacity=".12"/><stop offset="1" stop-color="#9cc0d2" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sn-dw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9e6a" stop-opacity="0"/><stop offset=".6" stop-color="#ff9e6a" stop-opacity=".1"/><stop offset="1" stop-color="#ffb27a" stop-opacity=".26"/></linearGradient>' +
      '<linearGradient id="sn-sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfefff" stop-opacity=".07"/><stop offset="1" stop-color="#cfefff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sn-pi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06121a"/><stop offset=".6" stop-color="#0b2632"/><stop offset="1" stop-color="#12404f"/></linearGradient>' +
      '<linearGradient id="sn-rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fe3ff" stop-opacity=".16"/><stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sn-skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4f5c68"/><stop offset=".55" stop-color="#97a5b1"/><stop offset="1" stop-color="#6d8797"/></linearGradient>' +
      '<radialGradient id="sn-pg"><stop offset="0" stop-color="#8fe3ff" stop-opacity=".2"/><stop offset=".5" stop-color="#8fe3ff" stop-opacity=".06"/><stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-bl"><stop offset="0" stop-color="#bff1ff" stop-opacity=".55"/><stop offset="1" stop-color="#bff1ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-fg"><stop offset="0" stop-color="#e6f6fc" stop-opacity=".5"/><stop offset="1" stop-color="#e6f6fc" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-eg"><stop offset="0" stop-color="#bff4ff" stop-opacity=".9"/><stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-cg"><stop offset="0" stop-color="#ffb08a" stop-opacity=".8"/><stop offset=".5" stop-color="#d97757" stop-opacity=".3"/><stop offset="1" stop-color="#d97757" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-wg"><stop offset="0" stop-color="#ffc48a" stop-opacity=".28"/><stop offset="1" stop-color="#ffc48a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sn-rg"><stop offset="0" stop-color="#ff5a64" stop-opacity=".35"/><stop offset="1" stop-color="#ff5a64" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="sn-pc"><rect x="158" y="288" width="184" height="564"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="#070b10"/>' +
      // Through the glass wall: the night sky, a few stars, dawn when done, and three ridges of pines in the mist.
      '<rect x="430" y="80" width="840" height="760" fill="url(#sn-sky)"/>' +
      `<path class="sn-stars" d="${stars}" fill="#cfe8ff" fill-opacity=".4"/>` +
      '<rect class="sn-dawn" x="430" y="300" width="840" height="540" fill="url(#sn-dw)"/>' +
      '<circle class="sn-dawn" cx="850" cy="640" r="360" fill="url(#sn-wg)"/>' +
      `<path d="${pines(31, 400, 1300, 560, 60, 170)}" fill="#0a1520"/>` +
      '<rect class="sn-mist" x="300" y="520" width="1100" height="110" fill="url(#sn-mi)"/>' +
      `<path d="${pines(32, 380, 1300, 668, 100, 260)}" fill="#060c12"/>` +
      '<rect class="sn-mist sn-mist2" x="300" y="640" width="1100" height="110" fill="url(#sn-mi)"/>' +
      `<path d="${pines(33, 360, 1320, 800, 150, 360)}" fill="#03070b"/>` +
      // The glass wall's frame and a faint sheen on the panes.
      '<path d="M520 112L600 112L470 820L430 820ZM980 112L1010 112L880 820L860 820Z" fill="#cfefff" fill-opacity=".02"/>' +
      '<rect x="430" y="80" width="840" height="28" fill="#0c131a"/><path d="M430 107H1270" stroke="#2a3a4a" stroke-width="2"/>' +
      `<g fill="#0a1118">${[460, 655, 850, 1045, 1240].map(x => `<rect x="${x - 4}" y="108" width="8" height="716"/>`).join('')}</g>` +
      `<path d="${[460, 655, 850, 1045, 1240].map(x => `M${x - 4} 108V824`).join('')}" stroke="#26364a" stroke-opacity=".7" stroke-width="1.4"/>` +
      // The white-tiled walls either side, the ceiling and its light slot.
      '<rect x="0" y="80" width="456" height="760" fill="url(#sn-wall)"/><rect x="1244" y="80" width="400" height="760" fill="url(#sn-wall)"/>' +
      `<path d="${tiles(0, 440)}${tiles(1252, 1604)}" stroke="#060a0f" stroke-width="2"/>` +
      '<path d="M456 80V840M1244 80V840" stroke="#1a2632" stroke-width="3"/>' +
      '<rect width="1600" height="80" fill="#05080c"/><rect y="42" width="1600" height="4" fill="#cfefff" fill-opacity=".09"/>' +
      '<rect y="80" width="1600" height="60" fill="url(#sn-sl)"/>' +
      // The floor, the lattice and the pod move together, pinned to the foot.
      '<g class="mv-b">' +
      '<rect x="-20" y="830" width="1640" height="400" fill="url(#sn-fl)"/>' +
      `<path d="${floor}" stroke="#101a24" stroke-width="1.4"/>` +
      `<path d="M-20 830H1620" stroke="${ICE}" stroke-opacity=".26" stroke-width="2"/>` +
      `<g fill="none" stroke-linecap="round"><path d="${riser1}${riser2}" stroke="${DARK}" stroke-width="6"/><path d="${riser1}${riser2}" stroke="#26384a" stroke-width="1.2"/>` +
      `<path class="sn-pr" pathLength="1" d="${riser1}" stroke="${PALE}" stroke-width="3" stroke-dasharray=".1 2"/>` +
      `<path class="sn-pr" pathLength="1" d="${riser2}" stroke="${PALE}" stroke-width="3" stroke-dasharray=".1 2" style="animation-delay:.74s"/></g>` +
      '<circle class="sn-bloom" cx="250" cy="200" r="320" fill="url(#sn-wg)"/>' +
      `<g class="sn-lat" fill="none" stroke-linecap="round">${lattice.levels}${pings}</g>` +
      `<g class="sn-warm" fill="none" stroke-linecap="round">${lattice.warm}</g>` +
      pod() +
      '</g>',
    nook:
      // The lattice comes down the right wall to a socket above the desk; a cable drops from it to the terminal.
      `<g class="sn-lat" fill="none" stroke-linecap="round">${wall.levels}</g>` +
      `<g class="sn-warm" fill="none" stroke-linecap="round">${wall.warm}</g>` +
      `<path d="M300 -160C300 -40 384 60 388 200C390 260 388 300 386 322" fill="none" stroke="${DARK}" stroke-width="4"/>` +
      `<circle cx="300" cy="-168" r="10" fill="${METAL}" stroke="${EDGE}" stroke-width="2"/><circle class="sn-pglow" cx="300" cy="-168" r="3.6" fill="${ICE}"/>` +
      // The cables from the desk down to the floor and away toward the pod, with the power that runs along them.
      `<g fill="none" stroke-linecap="round"><path d="${cable1}${cable2}" stroke="${DARK}" stroke-width="6"/><path d="${cable1}${cable2}" stroke="#26384a" stroke-width="1.2"/>` +
      `<path class="sn-pw" pathLength="1" d="${cable1}" stroke="${ICE}" stroke-opacity=".3" stroke-width="10" stroke-dasharray=".05 2"/>` +
      `<path class="sn-pw" pathLength="1" d="${cable1}" stroke="${PALE}" stroke-width="3" stroke-dasharray=".05 2"/>` +
      `<path class="sn-pw" pathLength="1" d="${cable2}" stroke="${PALE}" stroke-width="3" stroke-dasharray=".05 2" style="animation-delay:.12s"/></g>`,
  }
}
