import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Dragon Pass: a mountain road that runs under the colossal skeleton of a long-dead dragon. Its ribs arch over the
// pass in a receding nave of bone, its horned skull lies in the snow at the left, and a pass warden in a hooded cloak
// keeps the toll-house at the foot of the right slope. When a command runs, ghostly amber fire flows up through the
// ribs and the skull's jaw creaks open; on an error an avalanche of snow and bones slides down the slope; when it is
// done the skull's eyes glow gold, the barrier lifts and a caravan passes beneath.
const AMBER = '#e0a84a'
const GOLD = '#ffd27a'
const PALE = '#ffe6b0'
const BONE = '#6f6350'
const BONE_LIT = '#a89a80'
const TOOTH = '#d2c6ae'
const SNOW = '#d9d2c5'
const STONE = '#2c2620'
const STONE_EDGE = '#463d32'
const WOOL = '#4b3e31'
const WOOL_EDGE = '#6e5c46'
const TRIM = '#b08540'

type Pt = readonly [number, number]

/** Where the pass vanishes, and how far away each pair of ribs stands (1 is the nearest). */
const VP: Pt = [790, 430]
const DEPTH = [1, 0.7, 0.5, 0.36, 0.26, 0.19] as const
const FADE = [1, 0.86, 0.7, 0.56, 0.44, 0.34] as const
/** One left rib around the vanishing point at depth 1: spine, two control points, the bow, two more, the tip. */
const RIB: readonly Pt[] = [
  [0, -410],
  [-430, -420],
  [-790, -270],
  [-785, -40],
  [-780, 170],
  [-735, 330],
  [-690, 440],
]

const pt = (p: Pt): string => `${Math.round(p[0])} ${Math.round(p[1])}`
const TONGUE = 'M-.5 0C-.5 -.4 -.1 -.7 0 -1C.1 -.7 .5 -.4 .5 0Z'
const place = (p: Pt, s: number, side: number): Pt => [VP[0] + side * p[0] * s, VP[1] + p[1] * s]
const ribPoints = (s: number, side: number): Pt[] => RIB.map(p => place(p, s, side))

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const u = 1 - t

  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ]
}

/** The rib's two halves (spine to bow, bow to tip) and the whole rib from its tip up to the spine. */
function ribPaths(s: number, side: number): { upper: string; lower: string; up: string } {
  const [p0, p1, p2, p3, p4, p5, p6] = ribPoints(s, side) as [Pt, Pt, Pt, Pt, Pt, Pt, Pt]

  return {
    upper: `M${pt(p0)}C${pt(p1)} ${pt(p2)} ${pt(p3)}`,
    lower: `M${pt(p3)}C${pt(p4)} ${pt(p5)} ${pt(p6)}`,
    up: `M${pt(p6)}C${pt(p5)} ${pt(p4)} ${pt(p3)}C${pt(p2)} ${pt(p1)} ${pt(p0)}`,
  }
}

/** One pair of ribs and the vertebra they hang from: bone, a shadow on the inner side, snow on the outer. */
function arch(k: number): string {
  const s = DEPTH[k] ?? 1
  const w = 40 * s + 3
  const [cx, cy] = place([0, -410], s, 1)
  const ribs = [-1, 1]
    .map(side => {
      const { upper, lower } = ribPaths(s, side)

      return (
        `<g stroke="url(#dp-bone)"><path d="${upper}" stroke-width="${f(w)}"/><path d="${lower}" stroke-width="${f(w * 0.72)}"/></g>` +
        (k < 3
          ? `<g stroke="#0c0a08" stroke-opacity=".5" transform="translate(${f(-side * w * 0.24)} ${f(w * 0.16)})"><path d="${upper}" stroke-width="${f(w * 0.36)}"/><path d="${lower}" stroke-width="${f(w * 0.26)}"/></g>`
          : '') +
        (k < 4
          ? `<g stroke="url(#dp-snowg)" transform="translate(${f(side * w * 0.3)} ${f(-w * 0.3)})"><path d="${upper}" stroke-width="${f(w * 0.22)}"/><path d="${lower}" stroke-width="${f(w * 0.14)}"/></g>`
          : '')
      )
    })
    .join('')
  const [, , , , , , tipL] = ribPoints(s, -1) as Pt[]
  const [, , , , , , tipR] = ribPoints(s, 1) as Pt[]
  const drift = (p: Pt | undefined) =>
    p === undefined || k > 3 ? '' : `<ellipse cx="${f(p[0])}" cy="${f(p[1] + 4 * s)}" rx="${f(70 * s)}" ry="${f(14 * s)}" fill="#3f3a33"/>`
  const vertebra =
    `<path d="M${f(cx - 16 * s)} ${f(cy - 14 * s)}L${f(cx - 3 * s)} ${f(cy - 130 * s)}L${f(cx + 16 * s)} ${f(cy - 14 * s)}Z" fill="url(#dp-bone)"/>` +
    `<rect x="${f(cx - 38 * s)}" y="${f(cy - 22 * s)}" width="${f(76 * s)}" height="${f(44 * s)}" rx="${f(14 * s)}" fill="url(#dp-bone)" stroke="#1a1612" stroke-width="${f(3 * s)}"/>` +
    `<path d="M${f(cx - 30 * s)} ${f(cy - 20 * s)}H${f(cx + 30 * s)}" stroke="${SNOW}" stroke-opacity=".35" stroke-width="${f(5 * s)}"/>`

  return `<g opacity="${FADE[k] ?? 1}"><g fill="none" stroke-linecap="round">${ribs}</g>${drift(tipL)}${drift(tipR)}${vertebra}</g>`
}

/** The spine between the vertebrae, going away down the middle of the pass. */
function spine(): string {
  const parts: string[] = []

  for (let k = 0; k < DEPTH.length - 1; k += 1) {
    const a = DEPTH[k] ?? 1
    const b = DEPTH[k + 1] ?? 1
    const [, ya] = place([0, -410], a, 1)
    const [, yb] = place([0, -410], b, 1)

    parts.push(
      `<path d="M${VP[0]} ${f(ya)}V${f(yb)}" stroke="url(#dp-bone)" stroke-width="${f(24 * a)}" opacity="${FADE[k] ?? 1}"/>` +
        `<rect x="${f(VP[0] - 24 * (a + b) * 0.5)}" y="${f((ya + yb) / 2 - 12 * a)}" width="${f(48 * (a + b) * 0.5)}" height="${f(22 * a)}" rx="${f(8 * a)}" fill="url(#dp-bone)" opacity="${FADE[k] ?? 1}"/>`,
    )
  }

  return parts.join('')
}

/** Ghostly fire up every rib: a soft glow inside the bone and a bright tongue running from the tip to the spine. */
function fire(): string {
  const glows: string[] = []
  const runs: string[] = []

  DEPTH.forEach((s, k) => {
    const w = 40 * s + 3

    for (const side of [-1, 1]) {
      const { up } = ribPaths(s, side)
      const delay = f((DEPTH.length - 1 - k) * 0.16 + (side > 0 ? 0.08 : 0))

      if (k < 3) {
        glows.push(`<path d="${up}" stroke-width="${f(w * 1.5)}" opacity="${FADE[k] ?? 1}"/>`)
      }

      if (k > 4) {
        continue
      }

      runs.push(`<path class="dp-fl" pathLength="1" style="animation-delay:${delay}s" d="${up}" stroke-width="${f(w * 0.45)}"/>`)
    }
  })

  // Flame tongues licking up from the nearest ribs, only where they stand clear of the chat column.
  const tongues: string[] = []
  const next = random(33)

  for (const k of [0, 1]) {
    const s = DEPTH[k] ?? 1

    for (const side of [-1, 1]) {
      const q = ribPoints(s, side) as [Pt, Pt, Pt, Pt, Pt, Pt, Pt]

      for (const t of [0.3, 0.6, 0.88]) {
        for (const half of [0, 1]) {
          const p = half === 0 ? cubic(q[0], q[1], q[2], q[3], t) : cubic(q[3], q[4], q[5], q[6], t * 0.6)

          if ((p[0] > 400 && p[0] < 1200) || (p[0] < 450 && p[1] > 520)) {
            continue
          }

          const h = (k === 0 ? 46 : 32) * (0.7 + next() * 0.6)
          const w = h * 0.42

          tongues.push(
            `<g transform="translate(${Math.round(p[0])} ${Math.round(p[1] - 6)}) scale(${f(w)} ${f(h)})"><path class="dp-ft" style="animation-delay:${f(-next())}s" d="${TONGUE}"/></g>`,
          )
        }
      }
    }
  }

  const sparks = Array.from({ length: 12 }, (_, i) => {
    const left = i % 2 === 0
    const x = left ? 40 + next() * 330 : 1240 + next() * 330
    const y = 120 + next() * 380

    return `<circle class="dp-sp" style="animation-delay:${f(-next() * 2)}s" cx="${f(x)}" cy="${f(y)}" r="${f(2 + next() * 2.4)}" fill="${PALE}"/>`
  }).join('')

  return (
    '<g class="dp-fire">' +
    `<g class="dp-fg" fill="none" stroke="url(#dp-fireg)" stroke-opacity=".3" stroke-linecap="round">${glows.join('')}</g>` +
    `<g fill="none" stroke="url(#dp-fireg)" stroke-linecap="round">${runs.join('')}</g>` +
    `<g fill="url(#dp-tongue)">${tongues.join('')}</g>` +
    sparks +
    '</g>'
  )
}

/** Done: gold light running up the two near left ribs from their feet, stopping short of the chat column. */
function ribRims(): string {
  const paths = [0, 1].map(k => {
    // RIB's x runs negative, so side 1 is the left rib.
    const q = ribPoints(DEPTH[k] ?? 1, 1) as [Pt, Pt, Pt, Pt, Pt, Pt, Pt]
    const pts: Pt[] = []

    for (let i = 0; i <= 10; i += 1) {
      pts.push(cubic(q[6], q[5], q[4], q[3], i / 10))
    }

    for (let i = 1; i <= 20; i += 1) {
      const p = cubic(q[3], q[2], q[1], q[0], i / 20)

      if (p[0] > 380) {
        break
      }

      pts.push(p)
    }

    return `<path class="dp-rim dp-rr" pathLength="1" d="M${pts.map(pt).join('L')}" stroke-width="${k === 0 ? 5 : 4}"/>`
  })

  return `<g fill="none" stroke="${GOLD}" stroke-opacity=".85" stroke-linejoin="round">${paths.join('')}</g>`
}

/** The skull, facing right along the pass, in its own box: the cranium's top at y 22, the jaw's foot at about 196. */
function skull(): string {
  const upperTeeth: string[] = []
  const lowerTeeth: string[] = []

  for (let x = 150; x <= 426; x += 17) {
    const y = 154 - ((x - 160) * 12) / 240
    const fang = Math.abs(x - 218) < 9 || Math.abs(x - 388) < 9
    const len = fang ? 26 : 12

    upperTeeth.push(`M${f(x - 6)} ${f(y - 2)}L${f(x)} ${f(y + len)}L${f(x + 6)} ${f(y - 2)}Z`)
  }

  for (let x = 160; x <= 420; x += 17) {
    const y = 160 - ((x - 160) * 10) / 260

    lowerTeeth.push(`M${f(x - 5)} ${f(y + 2)}L${f(x + 1)} ${f(y - 11)}L${f(x + 6)} ${f(y + 2)}Z`)
  }

  const socket = 'M150 66C162 52 196 46 222 56C236 64 238 82 226 96C210 108 178 108 160 98C148 90 144 76 150 66Z'
  const cranium =
    'M38 150C22 128 18 92 34 66C52 36 92 22 138 22C178 22 206 30 228 46L246 50C280 56 330 66 372 80C400 88 424 98 438 114L446 128L432 140L400 142C330 146 240 150 160 154C110 156 66 156 38 150Z'

  return (
    // The glow in its mouth, seen once the jaw opens.
    '<ellipse class="dp-mg" cx="270" cy="160" rx="190" ry="26" fill="url(#dp-mouth)"/>' +
    // The lower jaw on its hinge.
    `<g class="dp-jaw"><path d="M40 150C100 160 200 160 300 156C360 154 400 150 428 146L434 154C420 166 380 176 320 182C240 190 140 196 82 192C56 190 40 176 40 150Z" fill="${BONE}" stroke="#2a241d" stroke-width="3"/>` +
    '<path d="M70 184C150 188 260 180 380 168" fill="none" stroke="#3a3229" stroke-width="4"/>' +
    `<path d="${lowerTeeth.join('')}" fill="${TOOTH}"/></g>` +
    // The horns, the far one first.
    '<path d="M128 24C122 -26 128 -74 152 -120C146 -70 154 -30 174 26Z" fill="#4e4537" stroke="#2a241d" stroke-width="3"/>' +
    `<path d="M86 32C52 -4 20 -52 4 -126C40 -82 86 -42 134 22Z" fill="${BONE}" stroke="#2a241d" stroke-width="3"/>` +
    `<path d="M62 8C40 -20 22 -60 10 -110" fill="none" stroke="${BONE_LIT}" stroke-opacity=".55" stroke-width="3"/>` +
    // The frill of spikes along the back.
    '<path d="M36 70L2 54L30 90ZM26 102L-10 100L24 122ZM36 132L4 146L42 148Z" fill="#4e4537"/>' +
    // The cranium and the long snout.
    `<path d="${cranium}" fill="${BONE}" stroke="#2a241d" stroke-width="3"/>` +
    '<path d="M60 120C140 112 300 118 420 124L432 140L400 142C330 146 240 150 160 154C110 156 66 156 38 150Z" fill="#000" fill-opacity=".22"/>' +
    `<path d="M40 70C60 38 100 26 140 26C180 26 210 34 230 48M262 58C300 64 350 74 392 88" fill="none" stroke="${BONE_LIT}" stroke-opacity=".6" stroke-width="3"/>` +
    '<path d="M228 46L252 20L246 50ZM398 90L414 68L418 96Z" fill="#5d5344"/>' +
    `<path d="M70 40C96 22 150 18 196 28C170 32 120 32 76 46ZM282 60C320 64 360 74 396 88C360 84 320 76 284 68Z" fill="${SNOW}" fill-opacity=".7"/>` +
    // Its openings: the temple, the eye socket, the hollow before the eye, the nostril.
    '<g fill="#0a0807"><path d="M70 74C84 58 112 56 126 66C134 84 128 106 112 118C96 124 76 116 70 100C66 90 66 82 70 74Z"/>' +
    `<path d="${socket}"/>` +
    '<path d="M262 92C290 88 324 94 340 102C334 116 318 124 296 124C276 124 262 116 258 106Z"/>' +
    '<path d="M402 100C410 96 420 98 424 104C418 110 408 110 402 106Z"/></g>' +
    '<path d="M140 52C170 36 214 36 248 50" fill="none" stroke="#857862" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M120 134C180 126 260 128 340 134" fill="none" stroke="#3a3229" stroke-width="4"/>' +
    `<path d="${upperTeeth.join('')}" fill="${TOOTH}" stroke="#4a4135" stroke-width="1"/>` +
    // What burns in the socket: an ember at rest, ghost fire on a run, gold when done.
    '<g class="dp-ey"><ellipse cx="192" cy="80" rx="36" ry="24" fill="url(#dp-eyeg)"/></g>' +
    '<g class="dp-ef">' +
    [
      [176, 74, 22],
      [194, 68, 30],
      [212, 74, 20],
    ]
      .map(
        ([x, y, h], i) =>
          `<g transform="translate(${x} ${y}) scale(12 ${h})"><path class="dp-ft" style="animation-delay:${f(-i * 0.23)}s" d="${TONGUE}" fill="url(#dp-tongue)"/></g>`,
      )
      .join('') +
    '</g>' +
    // Done: the bone warms to gold, both openings light up and a gold rim runs along the horn and the crest.
    `<path class="dp-gw" d="${cranium}" fill="${GOLD}" fill-opacity=".2"/>` +
    `<g class="dp-eg"><ellipse cx="192" cy="80" rx="40" ry="27" fill="url(#dp-goldg)"/><ellipse cx="98" cy="90" rx="34" ry="34" fill="url(#dp-goldg)" opacity=".85"/>` +
    `<ellipse cx="192" cy="80" rx="12" ry="8" fill="${PALE}" fill-opacity=".9"/><ellipse cx="98" cy="90" rx="9" ry="10" fill="${PALE}" fill-opacity=".8"/></g>` +
    `<g fill="none" stroke="${GOLD}" stroke-width="4"><path class="dp-rim" pathLength="1" d="M4 -126C40 -82 86 -42 134 22"/>` +
    '<path class="dp-rim" pathLength="1" d="M34 66C52 36 92 22 138 22C178 22 206 30 228 46L246 50C280 56 330 66 372 80"/></g>'
  )
}

/** A hooded traveller walking right, feet at 0: a cloak, a pack, a staff with or without a lantern. */
function walker(lantern: boolean, pack: boolean): string {
  return (
    (pack ? '<rect x="-16" y="-42" width="11" height="22" rx="3" fill="#0d0b09" stroke="#4a3d2c" stroke-width="1.2"/>' : '') +
    '<path d="M-10 0L-7 -30C-7 -40 -4 -48 1 -48C6 -48 9 -40 9 -30L12 0Z" fill="#0d0b09" stroke="#4a3d2c" stroke-width="1.2"/>' +
    '<path d="M-5 -46C-6 -54 0 -58 4 -56C8 -54 8 -48 6 -44Z" fill="#0d0b09"/>' +
    '<path d="M11 0L18 -58" stroke="#2a2118" stroke-width="2.4"/>' +
    (lantern
      ? `<circle cx="18" cy="-52" r="28" fill="url(#dp-lantern)"/><rect x="15" y="-56" width="6" height="8" rx="1" fill="${GOLD}"/>`
      : '')
  )
}

/** A shaggy pack beast walking right, feet at 0, with bundles on its back. */
function beast(): string {
  return (
    '<path d="M-30 -14C-32 -30 -20 -38 0 -38C20 -38 30 -32 32 -22L38 -24C46 -26 52 -20 50 -12L44 -6C40 -8 36 -10 32 -10L30 0H24L22 -9H-14L-16 0H-22L-25 -11Z" fill="#0d0b09" stroke="#4a3d2c" stroke-width="1.2"/>' +
    '<path d="M44 -24C48 -32 54 -32 56 -28M40 -25C40 -32 36 -34 32 -32" fill="none" stroke="#6a5c48" stroke-width="2"/>' +
    '<rect x="-20" y="-52" width="18" height="15" rx="2" fill="#1a140e" stroke="#4a3d2c" stroke-width="1.2"/><rect x="0" y="-50" width="16" height="13" rx="2" fill="#1a140e" stroke="#4a3d2c" stroke-width="1.2"/>' +
    '<path d="M-26 -14C-24 -6 -20 -4 -16 -6M-6 -10V-4M10 -10V-4" stroke="#2a2118" stroke-width="2"/>'
  )
}

/** The road out of the pass: a widening ribbon through points with their half-widths. */
function ribbon(points: readonly (readonly [number, number, number])[]): string {
  const left: string[] = []
  const right: string[] = []

  points.forEach((p, i) => {
    const prev = points[Math.max(0, i - 1)] ?? p
    const nxt = points[Math.min(points.length - 1, i + 1)] ?? p
    const tx = nxt[0] - prev[0]
    const ty = nxt[1] - prev[1]
    const len = Math.hypot(tx, ty) || 1
    const nx = -ty / len
    const ny = tx / len

    left.push(`${f(p[0] + nx * p[2])} ${f(p[1] + ny * p[2])}`)
    right.unshift(`${f(p[0] - nx * p[2])} ${f(p[1] - ny * p[2])}`)
  })

  return `M${left.join('L')}L${right.join('L')}Z`
}

/** Falling snow, one path of round dots per layer, looped without a seam. */
function snow(id: number, count: number, size: number, opacity: number, slant: number, box: readonly [number, number, number, number]): { markup: string; key: string } {
  const next = random(id)
  const [x0, y0, w, h] = box
  let d = ''

  for (let i = 0; i < count; i += 1) {
    d += `M${Math.round(x0 + next() * w)} ${Math.round(y0 + next() * h)}h0`
  }

  const shift = (slant * h) / 1000

  return {
    markup:
      `<g class="dp-s${id}" stroke="${SNOW}" stroke-opacity="${opacity}" stroke-width="${size}" stroke-linecap="round">` +
      `<path d="${d}"/><path transform="translate(${f(-shift)} ${-h})" d="${d}"/></g>`,
    key: `@keyframes dp-f${id}{to{transform:translate(${f(shift)}px,${h}px)}}`,
  }
}

/** Invented toll marks carved into slate or painted on a board: a wave with a dot, a knobbed bone, a coin on a
 * stick, a sprout on a bar. Pictures, not strokes, so no cell reads as a letter of any script. Draw round-capped. */
function marks(seed: number, x: number, y: number, rows: number, cols: number, dx: number, dy: number, size: number): string {
  const next = random(seed)
  const ring = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`
  let d = ''

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const gx = x + c * dx
      const gy = y + r * dy
      const s = size
      const a = Math.floor(next() * 4)

      d +=
        a === 0
          ? `M${f(gx)} ${f(gy + s * 0.5)}q${f(s * 0.25)} ${f(-s * 0.45)} ${f(s * 0.5)} 0t${f(s * 0.5)} 0M${f(gx + s * 0.12)} ${f(gy + s)}h0`
          : a === 1
            ? `M${f(gx + s * 0.22)} ${f(gy + s * 0.7)}L${f(gx + s * 0.78)} ${f(gy + s * 0.3)}${ring(gx + s * 0.14, gy + s * 0.76, s * 0.13)}${ring(gx + s * 0.86, gy + s * 0.24, s * 0.13)}`
            : a === 2
              ? `${ring(gx + s * 0.28, gy + s * 0.72, s * 0.2)}M${f(gx + s * 0.42)} ${f(gy + s * 0.58)}L${f(gx + s)} ${f(gy)}`
              : `M${f(gx)} ${f(gy + s * 0.88)}h${f(s * 0.72)}M${f(gx + s * 0.36)} ${f(gy + s * 0.88)}q0 ${f(-s * 0.55)} ${f(s * 0.52)} ${f(-s * 0.82)}`
    }
  }

  return d
}

/** The rune-slate: a stone tablet whose face glows, stone keys, a stack of toll coins and a dragon's fang. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'tool' || activity === 'run' || activity === 'web' || activity === 'responding' ? ' dp-busy' : ''
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${251 + i * 13}" y="323" width="9" height="4" rx="1" fill="${light}" fill-opacity=".5"/>`).join('')

  return (
    `<rect x="244" y="321" width="92" height="9" rx="2" fill="#3f382f" stroke="${STONE_EDGE}"/>` +
    keys +
    `<path d="M298 330L305 319H391L398 330Z" fill="#3f382f" stroke="${STONE_EDGE}"/>` +
    '<path d="M306 321L311 231L389 226L393 321Z" fill="#4a433a" stroke="#62584b" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="M314 314L318 239L382 235L385 314Z" fill="${light}" fill-opacity=".86"/>` +
    `<path class="dp-gly${busy}" d="${marks(9, 324, 246, 5, 4, 14, 13, 7)}" fill="none" stroke="#2a1d0c" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>` +
    '<path d="M306 232L320 230L311 244ZM393 228L378 227L390 241ZM306 321L320 321L308 308ZM393 321L380 321L392 308Z" fill="#6d5f49"/>' +
    // The coins and the fang.
    `<g fill="#c9953e" stroke="#6e5020" stroke-width="1.2">${[0, 1, 2, 3].map(i => `<ellipse cx="${416 + (i % 2)}" cy="${326 - i * 4}" rx="11" ry="3.4"/>`).join('')}</g>` +
    `<path d="M430 330C434 317 445 306 456 300C451 311 447 320 447 330Z" fill="${TOOTH}" stroke="#6a5e4a" stroke-width="1.4"/>`
  )
}

export function dragonPassWorld(): World {
  const next = random(4242)
  const flakes = [
    snow(1, 64, 2.4, 0.45, 220, [-200, 0, 2000, 1000]),
    snow(2, 34, 4, 0.58, 300, [-240, 0, 2080, 1000]),
    snow(3, 12, 5.4, 0.55, 360, [-300, 0, 2200, 1000]),
    // Big slow flakes only at the sides, clear of the chat column.
    snow(4, 8, 7.5, 0.5, 90, [-180, 0, 500, 1000]),
    snow(5, 8, 7.5, 0.5, 90, [1270, 0, 430, 1000]),
  ]
  let stars = ''

  for (let i = 0; i < 50; i += 1) {
    stars += `M${Math.round(next() * 1600)} ${Math.round(next() * 300)}h0`
  }

  const wind = Array.from({ length: 5 }, (_, i) => {
    const y = 60 + i * 86 + next() * 30
    const x = -200 + next() * 600

    return `<path class="dp-wd" style="animation-delay:${f(-i * 0.9)}s" d="M${f(x)} ${f(y)}q120 -18 260 -4t260 10" fill="none" stroke="${SNOW}" stroke-opacity=".16" stroke-width="1.6" stroke-linecap="round"/>`
  }).join('')
  const road = ribbon([
    [790, 438, 2],
    [770, 500, 7],
    [720, 580, 14],
    [630, 670, 24],
    [540, 750, 32],
    [500, 806, 38],
    [560, 850, 44],
    [740, 874, 50],
    [980, 884, 56],
    [1260, 896, 62],
    [1640, 910, 70],
  ])
  const ruts = 'M778 470C740 560 660 640 560 740C480 820 560 860 760 876C980 892 1300 898 1640 906'
  // The caravan wades through the drift in front of the skull's jaw, so its silhouettes stand against the bone.
  const caravan = [walker(true, false), beast(), walker(false, true), beast(), walker(true, true)]
    .map((body, i) => {
      const x = 210 - Math.floor((i + 1) / 2) * 100 - Math.floor(i / 2) * 86

      return `<g transform="translate(${x} ${f(846 + 0.075 * x)}) scale(1.4)"><g class="dp-bob" style="animation-delay:${f(-i * 0.21)}s">${body}</g></g>`
    })
    .join('')
  const bones =
    // Bones scattered in the snow below the skull.
    `<g fill="${BONE}" stroke="#2a241d" stroke-width="2">` +
    '<path d="M60 902C110 884 170 880 230 892" fill="none" stroke="#5d5344" stroke-width="11" stroke-linecap="round"/>' +
    '<rect x="300" y="890" width="34" height="20" rx="7"/><path d="M308 890L316 866L326 890Z"/>' +
    '<rect x="352" y="900" width="26" height="16" rx="6"/><path d="M-10 940C40 922 90 924 130 940" fill="none" stroke="#5d5344" stroke-width="9" stroke-linecap="round"/></g>'
  const tumble = (x: number, y: number, sx: number, sy: number, r: number, delay: number, shape: string): string =>
    `<g transform="translate(${x} ${y})"><g class="dp-tb" style="--sx:${sx}px;--sy:${sy}px;animation-delay:${f(delay)}s"><g class="dp-spin" style="--r:${r}deg;animation-delay:${f(delay)}s">${shape}</g></g></g>`
  const chunk = (x: number, y: number, r: number, delay: number): string =>
    tumble(x, y, 260 + next() * 80, -300 - next() * 80, 200, delay, `<ellipse rx="${f(r)}" ry="${f(r * 0.7)}" fill="#c6bfb2" fill-opacity=".7"/>`)
  const vertebraShape = `<g fill="${BONE_LIT}" stroke="#2a241d" stroke-width="2"><rect x="-16" y="-10" width="32" height="20" rx="7"/><path d="M-6 -10L0 -34L6 -10Z"/></g>`
  const ribShape = `<path d="M-40 14C-30 -10 0 -22 40 -16" fill="none" stroke="${BONE_LIT}" stroke-width="10" stroke-linecap="round"/>`
  const longBone = `<g fill="${BONE_LIT}" stroke="#2a241d" stroke-width="2"><rect x="-30" y="-5" width="60" height="10" rx="5"/><circle cx="-30" cy="-5" r="7"/><circle cx="-30" cy="6" r="7"/><circle cx="30" cy="-5" r="7"/><circle cx="30" cy="6" r="7"/></g>`
  const clouds = [
    [1570, 210, 120, 80],
    [1500, 290, 140, 90],
    [1400, 360, 160, 96],
    [1360, 300, 120, 70],
    [1460, 430, 130, 70],
    [1290, 430, 160, 90],
    [1190, 480, 130, 66],
    [1270, 510, 150, 52],
    [1110, 510, 90, 42],
  ]
    .map(([x, y, rx, ry], i) => `<ellipse class="dp-bil" style="animation-delay:${f(-i * 0.3)}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#dp-powder)"/>`)
    .join('')
  const flakeKeys = flakes.map(l => l.key).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'puffs',
      ink: '#060504',
      furniture: STONE,
      metal: '#3f382f',
      paper: '#e6dcc8',
      light: { idle: '#a07a3a', work: AMBER, bright: '#ffe2a6' },
      headTop: 206,
      glowAt: [350, 276],
      device,
      wear: {
        behind:
          // The cloak falling behind the body to the seat.
          `<path d="M70 244C50 284 42 330 38 368H74Z" fill="${WOOL}"/><path d="M230 250C246 290 252 330 254 364H230Z" fill="${WOOL}"/>`,
        front:
          // A deep pointed cowl with an amber-stitched edge and a fang toggle; the face opening leaves the eyes clear.
          `<path d="M104 206C84 188 54 184 30 200C42 204 54 214 64 240Z" fill="${WOOL}" stroke="${WOOL_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M64 336L62 262C62 228 96 202 150 200C204 200 238 226 240 262L242 336ZM90 328V262C90 250 100 244 112 244H206C218 244 226 250 226 262V328Z" fill="${WOOL}" fill-rule="evenodd" stroke="${WOOL_EDGE}" stroke-width="2"/>` +
          `<path d="M70 252C76 226 104 208 150 206C190 206 220 222 232 246" fill="none" stroke="#8a7458" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M90 328V262C90 250 100 244 112 244H206C218 244 226 250 226 262V328" fill="none" stroke="${TRIM}" stroke-opacity=".9" stroke-width="3"/>` +
          `<path d="M66 262C66 230 98 206 150 204C202 206 234 230 236 262" fill="none" stroke="${TRIM}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 4"/>` +
          `<path d="M110 205C134 198 170 197 196 203" fill="none" stroke="${SNOW}" stroke-opacity=".85" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M38 196C52 190 66 190 80 194" fill="none" stroke="${SNOW}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
          // The mantle across the shoulders with its toggle.
          `<path d="M60 326H244V342C200 348 104 348 60 342Z" fill="${WOOL}" stroke="${WOOL_EDGE}" stroke-width="2"/>` +
          `<path d="M60 330H244" stroke="${TRIM}" stroke-opacity=".7" stroke-width="2"/>` +
          `<path d="M150 328C154 336 160 342 168 344C160 346 152 342 148 336Z" fill="${TOOTH}"/><circle cx="148" cy="332" r="4" fill="${AMBER}"/>`,
      },
      seatArt:
        // A dragon's vertebra on a stone plinth: the round centrum, its side wings, a fur pelt over the top.
        `<path d="M98 440H206V456H98Z" fill="${STONE}" stroke="#3d342b" stroke-width="2"/>` +
        `<path d="M116 382C96 376 80 370 64 356C66 378 88 400 116 406ZM188 382C208 376 224 370 240 356C238 378 216 400 188 406Z" fill="${BONE_LIT}" stroke="#2a241d" stroke-width="2"/>` +
        `<rect x="112" y="362" width="80" height="80" rx="20" fill="${BONE}" stroke="#2a241d" stroke-width="2"/>` +
        `<path d="M118 398C140 405 164 405 186 398M118 422C140 429 164 429 186 422" fill="none" stroke="#4e4537" stroke-width="3"/><path d="M120 372V430" stroke="${BONE_LIT}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` +
        '<path d="M100 350C120 344 180 344 204 350L206 372C198 377 190 368 182 375C172 368 164 378 154 372C144 378 136 368 126 375C116 368 108 377 98 371Z" fill="#5e5142" stroke="#776650" stroke-width="1.4"/>',
      tableArt:
        `<path d="M196 344H462V456H196Z" fill="#221d18"/>` +
        '<path d="M196 382H462M196 420H462M262 344V382M366 344V382M228 382V420M318 382V420M420 382V420M282 420V456M394 420V456" stroke="#110e0b" stroke-width="2.4"/>' +
        `<rect x="162" y="328" width="310" height="16" rx="3" fill="#3b342b" stroke="#554a3c" stroke-width="1.6"/>` +
        `<path d="M168 331H466" stroke="${SNOW}" stroke-opacity=".22" stroke-width="2"/>` +
        // A rib bone bolted along the counter's front edge.
        `<path d="M180 352C260 358 380 358 452 350" fill="none" stroke="${BONE_LIT}" stroke-width="7" stroke-linecap="round"/>` +
        `<g fill="${BONE_LIT}" stroke="#2a241d" stroke-width="1.4"><circle cx="176" cy="348" r="6"/><circle cx="176" cy="357" r="6"/><circle cx="456" cy="346" r="6"/><circle cx="456" cy="355" r="6"/></g>` +
        `<rect x="304" y="394" width="44" height="14" rx="2" fill="#6e5020" stroke="${TRIM}" stroke-opacity=".7"/><path d="M314 401H338" stroke="#1a1208" stroke-width="3"/>`,
    },
    style:
      flakeKeys +
      '.dp-s1{animation:dp-f1 11s linear infinite}.dp-s2{animation:dp-f2 6.5s linear infinite}.dp-s3{animation:dp-f3 3.6s linear infinite}.dp-s4{animation:dp-f4 14s linear infinite}.dp-s5{animation:dp-f5 15s linear -6s infinite}' +
      '.st-tool .dp-s1,.st-web .dp-s1{animation-duration:6s}.st-tool .dp-s2,.st-web .dp-s2{animation-duration:3.6s}.st-tool .dp-s3,.st-web .dp-s3{animation-duration:2.2s}' +
      '.st-done .dp-snow{animation:dp-calm 2.4s ease-out both}@keyframes dp-calm{to{opacity:.35}}' +
      '.dp-wd{stroke-dasharray:180 900;animation:dp-wind 5.4s linear infinite}@keyframes dp-wind{from{stroke-dashoffset:200;transform:translateX(0)}to{stroke-dashoffset:-700;transform:translateX(500px)}}' +
      '.st-tool .dp-wd,.st-error .dp-wd{animation-duration:2.6s}' +
      '.dp-tw{animation:dp-tw 5s ease-in-out infinite alternate}@keyframes dp-tw{from{opacity:.2}to{opacity:.6}}' +
      '.dp-drift{animation:dp-drift 8s ease-in-out infinite}@keyframes dp-drift{0%{opacity:0;transform:translateX(0)}30%{opacity:.8}100%{opacity:0;transform:translateX(150px)}}' +
      '.dp-drift2{animation-delay:-4s}' +
      // The ember in the skull's eye: a slow breath at rest, quicker while thinking, out on an error.
      '.dp-ey{animation:dp-ember 4.4s ease-in-out infinite alternate}@keyframes dp-ember{from{opacity:.16}to{opacity:.42}}' +
      '.st-thinking .dp-ey{animation:dp-ember2 2.2s ease-in-out infinite alternate}@keyframes dp-ember2{from{opacity:.25}to{opacity:.8}}' +
      '.st-run .dp-ey{animation:dp-blaze .7s ease-out both}@keyframes dp-blaze{from{opacity:.3}to{opacity:1}}' +
      '.st-error .dp-ey,.st-done .dp-ey{animation:dp-out .6s ease-out both}@keyframes dp-out{to{opacity:.04}}' +
      '.dp-ef,.dp-eg,.dp-gw,.dp-halo,.dp-mg,.dp-fire,.dp-vpg,.dp-nb{opacity:0}' +
      '.st-read .dp-nb{animation:dp-show .9s ease-out both}' +
      '.st-run .dp-ef{animation:dp-show .5s ease-out .2s both}@keyframes dp-show{to{opacity:1}}' +
      '.st-done .dp-eg{animation:dp-show .8s ease-out .1s both}.st-done .dp-gw{animation:dp-show 1s ease-out .1s both}' +
      // Gold rims sweep along the horn, the crest and up the near ribs.
      '.dp-rim{stroke-dasharray:1;stroke-dashoffset:1;opacity:0}.st-done .dp-rim{opacity:1;animation:dp-crk 1.1s ease-out .2s both}.st-done .dp-rr{animation-duration:1.4s;animation-delay:.35s}' +
      '.st-done .dp-halo{animation:dp-halo 1.6s ease-out .2s both}@keyframes dp-halo{to{opacity:.85}}' +
      '.st-done .dp-vpg{animation:dp-halo 2.4s ease-out .4s both}' +
      // The jaw creaks open in fits on a run.
      '.dp-jaw{transform-origin:44px 152px}' +
      '.st-run .dp-jaw{animation:dp-creak 2.4s linear .1s both}' +
      '@keyframes dp-creak{0%{transform:rotate(0)}14%{transform:rotate(2.6deg)}22%{transform:rotate(2deg)}44%{transform:rotate(5.2deg)}52%{transform:rotate(4.6deg)}78%{transform:rotate(8deg)}100%{transform:rotate(8.5deg)}}' +
      '.st-run .dp-mg{animation:dp-show 1.4s ease-out .3s both}' +
      // Ghost fire through the ribs: a glow fades in, bright tongues run up each rib from the far ones to the near.
      '.st-run .dp-fire{animation:dp-show .6s ease-out .1s both}' +
      '.st-run .dp-fg{animation:dp-fg 2.6s ease-in-out infinite alternate}@keyframes dp-fg{from{opacity:.6}to{opacity:1}}' +
      '.dp-fl{stroke-dasharray:.18 1.4;stroke-dashoffset:.18}' +
      '.st-run .dp-fl{animation:dp-flow 1.5s linear infinite}@keyframes dp-flow{from{stroke-dashoffset:.18}to{stroke-dashoffset:-1.2}}' +
      '.dp-ft{transform-box:fill-box;transform-origin:50% 100%}.st-run .dp-ft{animation:dp-lick .5s ease-in-out infinite alternate}@keyframes dp-lick{from{transform:scale(.85,.7)}to{transform:scale(1.05,1.15)}}' +
      '.dp-sp{opacity:0}.st-run .dp-sp{animation:dp-rise 2.2s ease-out infinite}@keyframes dp-rise{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(30px,-140px)}}' +
      '.dp-gly.dp-busy{animation:dp-gly .9s ease-in-out infinite alternate}@keyframes dp-gly{from{opacity:.4}to{opacity:1}}' +
      // Web: the signal fire on the far cliff answers in slow pulses.
      '.dp-bc{opacity:.12}.st-web .dp-bc{animation:dp-bc 1.2s ease-in-out infinite alternate}@keyframes dp-bc{from{opacity:.25}to{opacity:1}}' +
      // The toll-house lantern sways in the wind, harder in a gust.
      '.dp-lamp{transform-origin:20px -52px;animation:dp-swing 4.4s ease-in-out infinite alternate}' +
      '@keyframes dp-swing{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.st-tool .dp-lamp,.st-web .dp-lamp{animation-duration:1.6s}.st-error .dp-lamp{animation:dp-swing2 .7s ease-in-out infinite alternate}' +
      '@keyframes dp-swing2{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}' +
      '.dp-fl2{animation:dp-flick 2.6s ease-in-out infinite alternate}@keyframes dp-flick{from{opacity:.7}to{opacity:1}}' +
      // Error: the slope cracks and an avalanche of snow and bones slides down it.
      '.dp-av,.dp-tb{opacity:0}' +
      '.dp-crk{stroke-dasharray:1;stroke-dashoffset:1}.st-error .dp-crk{animation:dp-crk .4s ease-out both}@keyframes dp-crk{to{stroke-dashoffset:0}}' +
      '.st-error .dp-av{animation:dp-av 2.4s cubic-bezier(.2,0,.5,1) both}' +
      '@keyframes dp-av{0%{opacity:0;transform:translate(230px,-290px)}10%{opacity:1}100%{opacity:1;transform:translate(0,0)}}' +
      '.dp-bil{transform-box:fill-box;transform-origin:center}.st-error .dp-bil{animation:dp-bil 1.6s ease-in-out infinite alternate}@keyframes dp-bil{to{transform:scale(1.12,1.18)}}' +
      '.st-error .dp-tb{animation:dp-tb 2.2s cubic-bezier(.35,0,.7,1) both}' +
      '@keyframes dp-tb{0%{opacity:0;transform:translate(var(--sx),var(--sy))}10%{opacity:1}92%{opacity:1}100%{opacity:.8;transform:translate(0,0)}}' +
      '.dp-spin{transform-box:fill-box;transform-origin:center}.st-error .dp-spin{animation:dp-spin 2.2s linear both}@keyframes dp-spin{to{transform:rotate(var(--r))}}' +
      // Done: the barrier lifts and a caravan emerges from the blowing snow, wading past the skull toward the toll-house.
      '.dp-bar{transform-origin:18px 200px}.st-done .dp-bar{animation:dp-lift 1.5s cubic-bezier(.5,0,.3,1) .3s both}@keyframes dp-lift{to{transform:rotate(78deg)}}' +
      '.dp-cv{opacity:0}.st-done .dp-cv{animation:dp-show .6s ease-out .15s both}' +
      '.st-done .dp-cw{animation:dp-walk 9s linear both}@keyframes dp-walk{to{transform:translate(200px,15px)}}' +
      '.st-done .dp-bob{animation:dp-bob .42s ease-in-out infinite alternate}@keyframes dp-bob{to{transform:translateY(-3px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="dp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060505"/><stop offset=".45" stop-color="#0e0c0a"/><stop offset="1" stop-color="#1a1612"/></linearGradient>' +
      '<linearGradient id="dp-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b17"/><stop offset="1" stop-color="#36312b"/></linearGradient>' +
      '<linearGradient id="dp-cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25211c"/><stop offset=".5" stop-color="#15120f"/><stop offset="1" stop-color="#0d0b09"/></linearGradient>' +
      '<linearGradient id="dp-bone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#7a6d58"/><stop offset=".24" stop-color="#5e5446"/><stop offset=".4" stop-color="#3a342b"/><stop offset=".6" stop-color="#3a342b"/><stop offset=".76" stop-color="#5e5446"/><stop offset="1" stop-color="#7a6d58"/></linearGradient>' +
      `<linearGradient id="dp-snowg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="${SNOW}" stop-opacity=".7"/><stop offset=".26" stop-color="${SNOW}" stop-opacity=".45"/><stop offset=".42" stop-color="${SNOW}" stop-opacity=".12"/><stop offset=".58" stop-color="${SNOW}" stop-opacity=".12"/><stop offset=".74" stop-color="${SNOW}" stop-opacity=".45"/><stop offset="1" stop-color="${SNOW}" stop-opacity=".7"/></linearGradient>` +
      `<linearGradient id="dp-fireg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="${GOLD}"/><stop offset=".19" stop-color="${AMBER}" stop-opacity=".85"/><stop offset=".265" stop-color="${AMBER}" stop-opacity=".4"/><stop offset=".38" stop-color="${AMBER}" stop-opacity=".2"/><stop offset=".5" stop-color="${AMBER}" stop-opacity=".12"/><stop offset=".62" stop-color="${AMBER}" stop-opacity=".2"/><stop offset=".735" stop-color="${AMBER}" stop-opacity=".4"/><stop offset=".81" stop-color="${AMBER}" stop-opacity=".85"/><stop offset="1" stop-color="${GOLD}"/></linearGradient>` +
      `<linearGradient id="dp-tongue" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${AMBER}" stop-opacity=".9"/><stop offset=".6" stop-color="${GOLD}" stop-opacity=".6"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="dp-eyeg"><stop offset="0" stop-color="${PALE}"/><stop offset=".35" stop-color="${AMBER}" stop-opacity=".85"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="dp-goldg"><stop offset="0" stop-color="#fff2c8"/><stop offset=".4" stop-color="${GOLD}" stop-opacity=".9"/><stop offset="1" stop-color="${GOLD}" stop-opacity=".1"/></radialGradient>` +
      `<radialGradient id="dp-halo"><stop offset="0" stop-color="${GOLD}" stop-opacity=".42"/><stop offset=".5" stop-color="${AMBER}" stop-opacity=".12"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="dp-mouth"><stop offset="0" stop-color="${GOLD}" stop-opacity=".95"/><stop offset=".5" stop-color="${AMBER}" stop-opacity=".55"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="dp-lantern"><stop offset="0" stop-color="${GOLD}" stop-opacity=".55"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="dp-haze"><stop offset="0" stop-color="#3a332a" stop-opacity=".7"/><stop offset=".6" stop-color="#2a251f" stop-opacity=".3"/><stop offset="1" stop-color="#2a251f" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="dp-dawn"><stop offset="0" stop-color="${GOLD}" stop-opacity=".3"/><stop offset=".5" stop-color="${AMBER}" stop-opacity=".1"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="dp-moon"><stop offset="0" stop-color="#e9e1d2" stop-opacity=".22"/><stop offset="1" stop-color="#e9e1d2" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dp-powder"><stop offset="0" stop-color="#ddd7cb" stop-opacity=".5"/><stop offset=".6" stop-color="#bdb6aa" stop-opacity=".28"/><stop offset="1" stop-color="#bdb6aa" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="dp-plume"><stop offset="0" stop-color="#d6d0c4" stop-opacity=".3"/><stop offset="1" stop-color="#d6d0c4" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#dp-sky)"/>' +
      `<path d="${stars}" stroke="#ddd3c2" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
      `<path class="dp-tw" d="${stars.split('M').slice(1, 16).map(s => 'M' + s).join('')}" stroke="#fff3dc" stroke-width="2.6" stroke-linecap="round"/>` +
      '<g class="mv-r"><g class="mv-t"><circle cx="1440" cy="120" r="130" fill="url(#dp-moon)"/><circle cx="1440" cy="120" r="28" fill="#e9e1d2" fill-opacity=".55"/><circle cx="1430" cy="114" r="6" fill="#bdb3a2" fill-opacity=".4"/></g></g>' +
      // The far range seen through the pass, with its snow.
      '<path d="M380 446L450 360L520 300L580 330L640 250L700 300L760 282L800 330L840 270L900 226L960 300L1020 280L1080 350L1160 400L1230 446Z" fill="#221e1a"/>' +
      '<path d="M610 290L640 250L668 280L650 276L638 292ZM868 264L900 226L934 266L912 258L898 272ZM740 296L760 282L778 304L762 300Z" fill="#57514a"/>' +
      '<circle class="dp-vpg" cx="790" cy="430" r="260" fill="url(#dp-dawn)"/>' +
      // The cliffs on both sides, the floor of the pass and the road.
      '<path d="M0 80L80 116L150 186L240 226L330 296L420 336L520 396L620 424L740 440L800 446V1000H0Z" fill="url(#dp-cliff)"/>' +
      '<path d="M0 80L80 116L150 186L104 204L54 150L0 168ZM240 226L330 296L420 336L396 346L310 312L226 252Z" fill="#4c463e" fill-opacity=".9"/>' +
      `<g fill="none" stroke="${SNOW}" stroke-width="3.4" stroke-linecap="round"><path d="M10 96L80 128L140 196M190 216L250 240L320 310M380 330L420 345" stroke-opacity=".55"/><path d="M420 345L440 352L520 404" stroke-opacity=".3"/></g>` +
      // The right slope is pinned with the avalanche that slides down it.
      '<g class="mv-r"><path d="M1600 60L1520 96L1440 166L1350 206L1260 276L1150 326L1040 386L920 428L780 446V1000H1600Z" fill="url(#dp-cliff)"/>' +
      '<path d="M1600 60L1520 96L1440 166L1486 176L1548 120L1600 132ZM1350 206L1260 276L1150 326L1180 334L1276 292L1366 226Z" fill="#4c463e" fill-opacity=".9"/>' +
      `<g fill="none" stroke="${SNOW}" stroke-width="3.4" stroke-linecap="round"><path d="M1590 76L1520 108L1450 176M1400 196L1340 222L1270 290M1200 312L1180 321" stroke-opacity=".55"/><path d="M1180 321L1140 340L1060 392" stroke-opacity=".3"/></g></g>` +
      '<path d="M700 444L880 444L1600 650V1000H0V720Z" fill="url(#dp-floor)"/>' +
      `<path d="${road}" fill="#0f0d0b" fill-opacity=".42"/>` +
      `<path d="${ruts}" fill="none" stroke="#2a2621" stroke-width="3" stroke-dasharray="14 10"/>` +
      // The beacon on the left cliff, lit on a web search.
      `<g transform="translate(372 330)"><path d="M-10 0L-4 -18H4L10 0Z" fill="#100d0a"/><g class="dp-bc"><circle cy="-22" r="34" fill="url(#dp-lantern)"/><path d="M-5 -18C-5 -26 -1 -30 0 -36C1 -30 5 -26 5 -18Z" fill="${GOLD}"/></g></g>` +
      // The ribs, far ones first, with haze between them and the near ones.
      arch(5) +
      arch(4) +
      arch(3) +
      `<ellipse cx="${VP[0]}" cy="${VP[1]}" rx="520" ry="300" fill="url(#dp-haze)"/>` +
      `<g fill="none" stroke-linecap="butt">${spine()}</g>` +
      arch(2) +
      arch(1) +
      arch(0) +
      // Spindrift blowing off the cliff tops.
      '<ellipse class="dp-drift" cx="170" cy="190" rx="120" ry="22" fill="url(#dp-plume)"/>' +
      '<g class="mv-r"><ellipse class="dp-drift dp-drift2" cx="1400" cy="186" rx="130" ry="24" fill="url(#dp-plume)"/></g>' +
      fire() +
      ribRims() +
      // The skull in the snow at the left, the caravan wading past its jaw, the drift and loose bones.
      `<g class="mv-b"><circle class="dp-halo" cx="200" cy="726" r="250" fill="url(#dp-halo)"/>` +
      `<g transform="translate(-10 638) scale(1.1)">${skull()}</g>` +
      `<g class="dp-cv"><g class="dp-cw">${caravan}</g></g>` +
      '<path d="M-20 836C40 822 90 832 150 846C210 860 300 852 380 868C420 876 450 900 470 1000H-20Z" fill="#2e2a25"/>' +
      `<path d="M-20 836C40 822 90 832 150 846C210 860 300 852 380 868" fill="none" stroke="${SNOW}" stroke-opacity=".35" stroke-width="3"/>` +
      `${bones}</g>` +
      // The avalanche down the right slope.
      '<g class="mv-r">' +
      `<path class="dp-crk" pathLength="1" d="M1600 92L1560 104L1530 96L1490 126L1450 140L1420 170" fill="none" stroke="${SNOW}" stroke-opacity=".8" stroke-width="3"/>` +
      `<g class="dp-av">${clouds}</g>` +
      chunk(1240, 470, 14, 0.1) +
      chunk(1320, 430, 18, 0.25) +
      chunk(1170, 520, 11, 0.35) +
      chunk(1400, 400, 12, 0.15) +
      chunk(1290, 510, 16, 0.45) +
      chunk(1460, 360, 10, 0.3) +
      tumble(1220, 440, 320, -380, 540, 0.15, vertebraShape) +
      tumble(1350, 470, 260, -360, -420, 0.3, ribShape) +
      tumble(1140, 500, 340, -300, 380, 0.42, longBone) +
      tumble(1420, 330, 220, -300, 300, 0.05, ribShape) +
      '</g>' +
      wind +
      `<g class="dp-snow">${flakes.map(l => l.markup).join('')}</g>`,
    nook:
      // The toll-house: a timber lean-to roof under snow, a stone wall, a notice board, the lantern and the barrier.
      // The wall runs up into a planked gable under the roof, so no sky shows between them.
      `<path d="M30 -36L440 -135V456H30Z" fill="#1b1713"/>` +
      '<path d="M140 -48V-57M200 -48V-71M260 -48V-86M320 -48V-100M380 -48V-115" stroke="#0f0c0a" stroke-width="3"/><path d="M30 -48H440" stroke="#2a2118" stroke-width="5"/>' +
      `<path d="M30 -10H440M30 40H440M30 92H440M30 144H440M30 196H440M30 250H440M30 304H440M110 -48V-10M240 -48V-10M380 -48V-10M60 -10V40M180 -10V40M310 -10V40M120 40V92M250 40V92M400 40V92M70 92V144M200 92V144M340 92V144M130 144V196M270 144V196M410 144V196M80 196V250M220 196V250M360 196V250M140 250V304M290 250V304" stroke="#0f0c0a" stroke-width="3"/>` +
      // The notice board with toll marks.
      '<circle class="dp-nb" cx="326" cy="96" r="120" fill="url(#dp-lantern)"/>' +
      '<rect x="252" y="44" width="148" height="104" rx="3" fill="#2a1f15" stroke="#4a3826" stroke-width="3"/>' +
      '<rect x="264" y="56" width="58" height="76" fill="#cfc3aa" fill-opacity=".34"/><rect x="332" y="60" width="56" height="52" fill="#cfc3aa" fill-opacity=".28"/>' +
      `<path d="${marks(21, 270, 64, 5, 3, 16, 13, 7)}${marks(22, 338, 68, 3, 3, 16, 13, 7)}" fill="none" stroke="#120d08" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>` +
      '<path d="M282 134L294 120L306 134Z" fill="#8a2e24" fill-opacity=".6"/>' +
      // The roof.
      '<path d="M-14 -44L452 -158V-134L-14 -22Z" fill="#1f1810" stroke="#3a2c1d" stroke-width="2"/>' +
      `<path d="M-18 -46C80 -78 260 -126 456 -170L456 -160C260 -116 80 -66 -16 -38Z" fill="${SNOW}" fill-opacity=".72"/>` +
      `<path d="${[24, 70, 98, 150, 214, 250, 318, 352, 410].map((x, i) => `M${x} ${f(-22 - (x + 14) * 0.245)}v${8 + (i % 3) * 6}`).join('')}" stroke="#bdb6aa" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>` +
      // The pillar that holds the barrier, and the barrier itself.
      `<path d="M-6 120H44V456H-6Z" fill="#26211b" stroke="${STONE_EDGE}" stroke-width="2"/><path d="M-6 190H44M-6 262H44M-6 334H44M-6 400H44" stroke="#14110d" stroke-width="2.4"/>` +
      `<path d="M-12 108H50V124H-12Z" fill="#3a332a"/><path d="M-12 108H50" stroke="${SNOW}" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>` +
      '<path d="M-378 206V318M-388 206L-378 214L-368 206" fill="none" stroke="#1e170f" stroke-width="7" stroke-linecap="round"/>' +
      '<g class="dp-bar"><path d="M18 194H-386V206H18Z" fill="#33271a" stroke="#4a3826" stroke-width="2"/>' +
      `<g fill="${TRIM}" fill-opacity=".75"><rect x="-90" y="192" width="7" height="16"/><rect x="-190" y="192" width="7" height="16"/><rect x="-290" y="192" width="7" height="16"/><rect x="-380" y="192" width="7" height="16"/></g>` +
      '<rect x="18" y="186" width="34" height="28" rx="3" fill="#3a332a" stroke="#4d453a" stroke-width="2"/></g>' +
      `<circle cx="18" cy="200" r="6" fill="#5a4a32" stroke="${TRIM}" stroke-width="1.6"/>` +
      // The lantern hung from the roof's low corner.
      `<g class="dp-lamp"><path d="M20 -52V-8" stroke="#1a140e" stroke-width="2.4"/><g class="dp-fl2"><circle cx="20" cy="12" r="150" fill="url(#dp-lantern)" opacity=".7"/></g>` +
      `<path d="M8 -8H32L36 2H4Z M6 2H34V30H6Z M6 30H34L28 38H12Z" fill="#0f0c09" stroke="${TRIM}" stroke-width="1.6"/>` +
      `<path d="M10 5H30V27H10Z" fill="${GOLD}" fill-opacity=".85"/><path d="M20 8Q25 16 20 25Q15 16 20 8Z" fill="#fff6d0"/></g>` +
      // Drifts at the foot of the wall.
      '<path d="M-60 456C0 430 80 436 140 446C240 436 330 440 440 432V470H-60Z" fill="#35312b"/>',
    front: `<path d="M-40 462C40 448 120 452 200 458C280 450 360 452 440 446V470H-40Z" fill="#3a352f"/>`,
  }
}
