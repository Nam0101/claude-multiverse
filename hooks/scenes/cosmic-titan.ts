import type { Activity } from '../../types'
import { f, random } from './kit'
import type { P } from './rig'
import type { World } from './world'

// Cosmic Titan: a colossal armored titan sits on a throne cut into a shattered moon, adrift in a violet nebula, a
// small blazing star hovering over its open palm. Claude codes at its feet on a floating shard, in a golden crested
// helm, at a rune-lit obsidian slab. Run: the titan raises the star and rings of dust spin up around it, shards in
// orbit; error: the moon cracks along a glowing fault and shards fall away; done: the star blooms into a soft halo
// and the hand comes down.
const GOLD = '#f2c14e'
const PALE = '#fff3c8'
const BRONZE = '#9a6b30'
const LIT = '#d9a24a'
const ROCK = '#1c1628'
const EDGE = '#4a3c62'
const CARVE = '#5c4c7c'
const FIRE = '#ff9a3d'

// The moon (its center and radius), the titan's star shoulder, and the star arm's angles in degrees on screen: the
// upper arm from the shoulder, the forearm from the elbow; at rest, raised for a run, lowered when done.
const MC: P = [220, 400]
const MR = 330
const SH: P = [330, 285]
const UPPER = 130
const TO_STAR = 150
const LIFT = 70
const REST = { a: 75, b: -80 }
const RAISED = { a: 30, b: -92 }
const LOWERED = { a: 95, b: 0 }

const at = (p: P, deg: number, len: number): P => [p[0] + len * Math.cos((deg * Math.PI) / 180), p[1] + len * Math.sin((deg * Math.PI) / 180)]
const pt = (p: P): string => `${f(p[0])} ${f(p[1])}`
const STAR0 = at(at(SH, REST.a, UPPER), REST.b, TO_STAR)
const STAR1 = at(at(SH, RAISED.a, UPPER), RAISED.b, TO_STAR + LIFT)
// The CSS turns that take the arm from rest to a pose: the upper arm by Δa, the forearm by Δb − Δa inside it.
const turn = (pose: { a: number; b: number }) => ({ ua: pose.a - REST.a, fa: pose.b - REST.b - (pose.a - REST.a) })

/** A path of absolute M/L/C/Q/Z commands mirrored across the titan's axis (x 210). */
function mirror(d: string): string {
  let even = true

  return d.replace(/[A-Z]|-?\d+(?:\.\d+)?/g, token => {
    if (/[A-Z]/.test(token)) {
      even = true

      return token
    }

    const out = even ? f(420 - Number(token)) : token
    even = !even

    return out
  })
}

/** Invented rune marks, each a small stroked path around (x, y). */
const GLYPHS: ((x: number, y: number, s: number) => string)[] = [
  (x, y, s) => `M${f(x)} ${f(y - 7 * s)}L${f(x + 4 * s)} ${f(y - 3 * s)}L${f(x)} ${f(y + s)}L${f(x - 4 * s)} ${f(y - 3 * s)}ZM${f(x)} ${f(y + s)}V${f(y + 7 * s)}`,
  (x, y, s) =>
    `M${f(x - 5 * s)} ${f(y - 2 * s)}L${f(x)} ${f(y - 7 * s)}L${f(x + 5 * s)} ${f(y - 2 * s)}M${f(x - 5 * s)} ${f(y + 5 * s)}L${f(x)} ${f(y)}L${f(x + 5 * s)} ${f(y + 5 * s)}` +
    `M${f(x - s)} ${f(y + 7 * s)}h${f(2 * s)}v${f(2 * s)}h${f(-2 * s)}z`,
  (x, y, s) => `M${f(x - 5 * s)} ${f(y - 6 * s)}H${f(x + 5 * s)}L${f(x - 5 * s)} ${f(y + 6 * s)}H${f(x + 5 * s)}Z`,
  (x, y, s) => `M${f(x - 5 * s)} ${f(y)}A${f(5 * s)} ${f(5 * s)} 0 0 1 ${f(x + 5 * s)} ${f(y)}M${f(x)} ${f(y - s)}V${f(y + 7 * s)}`,
  (x, y, s) => `M${f(x - 4 * s)} ${f(y - 6 * s)}L${f(x + 4 * s)} ${f(y + 6 * s)}M${f(x + 4 * s)} ${f(y - 6 * s)}L${f(x - 4 * s)} ${f(y + 6 * s)}M${f(x - 5 * s)} ${f(y)}H${f(x + 5 * s)}`,
]

/** A starburst of `n` rays: Claude's own emblem. */
function burst(cx: number, cy: number, outer: number, inner: number, n: number): string {
  const points = Array.from({ length: n * 2 }, (_, i) => pt(at([cx, cy], -90 + (i * 180) / n, i % 2 ? inner : outer)))

  return `M${points.join('L')}Z`
}

/** An irregular rock: `n` corners around the origin, radius `r` give or take. */
function rock(next: () => number, r: number, n: number): string {
  return `M${Array.from({ length: n }, (_, i) => pt(at([0, 0], (i * 360) / n + next() * 30, r * (0.62 + next() * 0.45)))).join('L')}Z`
}

/** A drifting shard at (x, y): its rock, a lit edge, and how it drifts. */
function shard(next: () => number, x: number, y: number, r: number, fill = ROCK): string {
  const d = rock(next, r, 5 + Math.floor(next() * 3))
  const corners = d.slice(1, -1).split('L')
  const style = `--x:${f((next() - 0.5) * r * 0.9)}px;--y:${f((next() - 0.5) * r * 0.8)}px;--r:${f((next() - 0.5) * 50)}deg;--t:${f(10 + next() * 10)}s;--d:${f(-next() * 10)}s`

  return (
    `<g transform="translate(${f(x)} ${f(y)})"><g class="tn-dr" style="${style}">` +
    `<path d="${d}" fill="${fill}" stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="M${corners[2]}L${corners[3]}L${corners[4]}" fill="none" stroke="${LIT}" stroke-opacity=".55" stroke-width="1.6"/></g></g>`
  )
}

/** The moon with the bite broken out of its right side, the glowing seam along the break, its craters and the limb. */
function moon(next: () => number): string {
  const start = at(MC, -38, MR)
  const end = at(MC, 52, MR)
  const bite = Array.from({ length: 10 }, (_, i) => {
    const t = (i + 1) / 11

    return at(MC, 52 - t * 90, MR - 36 - 78 * Math.sin(Math.PI * t) - (i % 2 ? 14 : -6) * next())
  })
  const edge = `M${pt(end)}L${bite.map(pt).join('L')}L${pt(start)}`
  // The broken face along the bite, a band of raw rock the star lights.
  const inward = [end, ...bite, start].map(([x, y]): P => {
    const k = 28 / Math.hypot(MC[0] - x, MC[1] - y)

    return [x + (MC[0] - x) * k, y + (MC[1] - y) * k]
  })
  const face = `${edge}L${inward.reverse().map(pt).join('L')}Z`
  const craters = ([
    [-30, 300, 24], [-60, 480, 18], [40, 196, 14], [112, 146, 18], [160, 100, 10], [262, 94, 9], [304, 132, 22], [364, 206, 12], [418, 252, 14], [404, 606, 12],
  ] as const)
    .map(
      ([x, y, r]) =>
        `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.82)}" fill="#120d1c" fill-opacity=".6"/>` +
        `<path d="M${x - r} ${y}A${r} ${f(r * 0.82)} 0 0 0 ${x + r} ${y}" fill="none" stroke="#7a6c9c" stroke-opacity=".35" stroke-width="1.6"/>`,
    )
    .join('')

  return (
    `<path d="M${pt(start)}A${MR} ${MR} 0 1 0 ${pt(end)}L${bite.map(pt).join('L')}Z" fill="url(#tn-moon)"/>` +
    '<ellipse cx="-40" cy="420" rx="70" ry="120" fill="#120d1c" fill-opacity=".3"/><ellipse cx="70" cy="250" rx="46" ry="30" fill="#120d1c" fill-opacity=".22"/>' +
    craters +
    `<path d="${face}" fill="url(#tn-frac)"/>` +
    `<path d="M${pt(at(MC, -165, MR - 2))}A${MR} ${MR} 0 0 1 ${pt(at(MC, -70, MR - 2))}" fill="none" stroke="#b4a6dc" stroke-opacity=".45" stroke-width="3"/>` +
    `<g class="tn-seam" fill="none" stroke-linejoin="round"><path d="${edge}" stroke="${GOLD}" stroke-opacity=".38" stroke-width="9"/>` +
    `<path d="${edge}" stroke="#ffd98a" stroke-opacity=".85" stroke-width="2"/></g>`
  )
}

/** Three pieces of the upper limb that break away on an error, over the dark holes they leave. */
function rimPieces(next: () => number): string {
  return ([
    [-128, -114],
    [-70, -58],
    [-51, -41],
  ] as const)
    .map(([a0, a1], i) => {
      const mid = (a0 + a1) / 2
      const d = `M${pt(at(MC, a0, MR + 1))}L${pt(at(MC, mid, MR + 2))}L${pt(at(MC, a1, MR + 1))}L${pt(at(MC, a1, MR - 34 - next() * 8))}L${pt(at(MC, mid + (next() - 0.5) * 6, MR - 50))}L${pt(at(MC, a0, MR - 30 - next() * 10))}Z`

      return (
        `<path d="${d}" fill="#07050c"/><path class="tn-hole" d="${d}" fill="none" stroke="${FIRE}" stroke-opacity=".7" stroke-width="2"/>` +
        `<path class="tn-fall" style="--x:${f(Math.cos((mid * Math.PI) / 180) * 150)}px;--y:${f(Math.sin((mid * Math.PI) / 180) * 150)}px;--r:${i % 2 ? 50 : -40}deg;--d:${f(0.4 + i * 0.16)}s" d="${d}" fill="url(#tn-moon)" stroke="#0b0812" stroke-opacity=".55" stroke-width="1.4"/>`
      )
    })
    .join('')
}

/** The fault lines: dark scars at rest, drawn in fire on an error. */
function faults(): string {
  const lines = [
    'M446 500L414 520L398 506L366 548L338 560L300 604M398 506L404 474',
    'M478 214L444 236L430 216L398 250L392 196L366 176L350 120L326 104M392 196L414 168',
    'M60 236L40 214L52 186L24 160L34 130L6 100M40 214L14 222',
    'M210 712L218 736L204 752L222 790M204 752L184 768',
  ]

  return (
    `<g fill="none" stroke="#07050c" stroke-opacity=".7" stroke-width="1.6">${lines.map(d => `<path d="${d}"/>`).join('')}</g>` +
    '<g fill="none" stroke-linejoin="round" stroke-linecap="round">' +
    lines
      .map(
        (d, i) =>
          `<path class="tn-ft" pathLength="1" style="--d:${f(0.08 + i * 0.12)}s" d="${d}" stroke="${FIRE}" stroke-opacity=".45" stroke-width="9"/>` +
          `<path class="tn-ft" pathLength="1" style="--d:${f(0.08 + i * 0.12)}s" d="${d}" stroke="#ffe2a0" stroke-width="2.4"/>`,
      )
      .join('') +
    '</g>'
  )
}

/** The throne cut into the moon: the recess, two spired pillars with runes and a rune channel, the armrests, the dais. */
function throne(): string {
  const pillar = 'M36 700L36 290L62 230L88 290L88 700Z'
  const runes = [0, 1, 2, 3, 4]
    .flatMap(i => [
      `<path class="tn-rn" style="--i:${i}" d="${GLYPHS[i % 5]!(62, [330, 390, 528, 588, 648, 0][i]!, 1.5)}"/>`,
      `<path class="tn-rn" style="--i:${i + 3}" d="${GLYPHS[(i + 2) % 5]!(358, [330, 390, 528, 588, 648, 0][i]!, 1.5)}"/>`,
    ])
    .join('')
  const arm = 'M0 444L110 444L110 496L0 496Z'
  const armTop = 'M4 436L106 436L110 444L0 444Z'

  return (
    `<path d="M30 760L30 290L62 222L94 290L94 300C160 284 260 284 326 300L326 290L358 222L390 290L390 760Z" fill="#0d0915" fill-opacity=".6" stroke="${CARVE}" stroke-opacity=".6" stroke-width="2"/>` +
    `<g fill="url(#tn-pil)" stroke="${CARVE}" stroke-opacity=".6" stroke-width="2"><path d="${pillar}"/><path d="${mirror(pillar)}"/></g>` +
    `<path d="M46 296L46 690M78 296L78 690M342 296L342 690M374 296L374 690" stroke="${BRONZE}" stroke-opacity=".45" stroke-width="2"/>` +
    `<path class="tn-ch" d="M62 300L62 690M358 300L358 690" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
    `<g fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round">${runes}</g>` +
    `<g fill="#2e2640" stroke="${CARVE}" stroke-opacity=".6" stroke-width="1.6"><path d="${arm}"/><path d="${mirror(arm)}"/></g>` +
    `<g fill="#4a4064"><path d="${armTop}"/><path d="${mirror(armTop)}"/></g>` +
    '<path d="M20 710L400 710L406 716L14 716Z" fill="#4a4064"/>' +
    `<path d="M14 716L406 716L406 742L14 742Z" fill="#2e2640" stroke="${CARVE}" stroke-opacity=".5" stroke-width="1.6"/>` +
    '<path d="M-6 742L426 742L426 770L370 788L320 776L270 792L220 778L170 794L120 776L80 790L48 772L20 784L-6 770Z" fill="#1d1729"/>' +
    `<path d="M-6 742L426 742" stroke="${CARVE}" stroke-opacity=".5" stroke-width="1.6"/>`
  )
}

/** The titan: obsidian and bronze plates, a tall crowned helm with a faceless visor, the star arm in two halves. */
function titan(): string {
  const both = (d: string) => `<path d="${d}"/><path d="${mirror(d)}"/>`
  const plate = `fill="url(#tn-pl)" stroke="${BRONZE}" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"`
  let tips = ''
  const rays = [-3, -2, -1, 0, 1, 2, 3]
    .map(k => {
      const base: P = [210 + k * 15, 162]
      const tip = at(base, -90 + k * 16, 98 - Math.abs(k) * 16)

      tips += `M${f(tip[0])} ${f(tip[1] - 3)}l2.4 4l-2.4 4l-2.4 -4z`

      return `M${f(base[0] - 6)} 164L${pt(tip)}L${f(base[0] + 6)} 164Z`
    })
    .join('')
  const arm = (inner: string) =>
    `<g transform="translate(${pt(SH)})"><g class="tn-ua"><g transform="rotate(${REST.a - 90})">${inner}</g></g></g>`
  const flare = 'M0 -30L3.5 -3.5L30 0L3.5 3.5L0 30L-3.5 3.5L-30 0L-3.5 -3.5Z'

  return (
    // The near-side arm, resting on its armrest.
    `<g ${plate}><path d="M68 292L120 300L98 422L48 410Z"/><circle cx="73" cy="416" r="21"/><path d="M48 410L100 420L94 462L44 458Z"/>` +
    '<path d="M32 452L104 452L102 478Q68 492 34 478Z"/></g>' +
    `<path d="M48 458L48 480M62 458L62 484M76 458L76 484M90 458L90 480" stroke="${BRONZE}" stroke-opacity=".55" stroke-width="2"/>` +
    // The upper half of the star arm, under the pauldron.
    arm(
      `<g ${plate}><path d="M-24 -6L24 -6L21 130L-21 130Z"/><circle cy="130" r="21"/></g>` +
        `<path d="M-23 44L23 44M-22 92L22 92" stroke="${BRONZE}" stroke-opacity=".6" stroke-width="2"/>`,
    ) +
    // Legs, torso, belt.
    `<g ${plate}>${both('M118 566L198 566L190 694L128 694Z')}${both('M106 692L200 692L206 712L100 712Z')}${both('M112 490L206 490L204 572L116 572Z')}` +
    `${both('M128 548Q160 528 192 548L186 584L160 598L134 584Z')}` +
    '<path d="M120 292C160 278 260 278 300 292L294 398C260 420 160 420 126 398Z"/>' +
    '<path d="M138 404L282 404L278 426L142 426Z"/><path d="M142 428L278 428L274 448L146 448Z"/><path d="M146 450L274 450L270 468L150 468Z"/>' +
    `<path d="M126 468L294 468L298 494L122 494Z"/>${both('M122 494L164 494L160 534L126 530Z')}${both('M166 494L206 494L204 538L168 536Z')}</g>` +
    `<path d="M159 574L159 688M261 574L261 688M210 288L210 414M132 338C170 328 196 340 210 350C224 340 250 328 288 338" fill="none" stroke="${BRONZE}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M210 290L210 400" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
    // Pauldrons, gorget, helm, crown.
    `<g ${plate}>${both('M56 356C62 324 86 306 118 304L114 320C94 324 78 338 72 362Z')}${both('M46 338C40 286 74 258 122 254C150 252 166 264 170 284L152 296C118 292 88 306 70 344Z')}` +
    '<path d="M148 260L272 260L292 296L128 296Z"/>' +
    `<path d="${rays}"/>` +
    '<path d="M166 264L158 204C158 166 180 150 210 148C240 150 262 166 262 204L254 264L210 282Z"/>' +
    '<path d="M162 180L258 180L254 158L166 158Z"/></g>' +
    `<path d="M210 150L210 196M170 232L184 262M250 232L236 262" fill="none" stroke="${BRONZE}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M242 152C256 160 262 180 262 204L254 262M374 344C380 300 360 262 300 254M300 292L294 398M286 548Q290 556 288 584" fill="none" stroke="${LIT}" stroke-opacity=".95" stroke-width="2.6"/>` +
    `<path d="M46 338C40 300 60 262 120 254M178 156C192 149 228 149 242 156" fill="none" stroke="${LIT}" stroke-opacity=".45" stroke-width="2"/>` +
    `<path d="${tips}" fill="${GOLD}"/>` +
    // The faceless visor: a slit of light.
    '<ellipse class="tn-vis" cx="210" cy="212" rx="74" ry="28" fill="url(#tn-vg)"/>' +
    `<path d="M170 204L250 204L246 216L214 224L206 224L174 216Z" fill="${GOLD}"/>` +
    '<path class="tn-vise" d="M170 204L250 204L246 216L214 224L206 224L174 216Z" fill="#ff6a3a"/>' +
    '<path d="M180 208L240 208" stroke="#fff6d8" stroke-opacity=".8" stroke-width="2"/>' +
    // The forearm, the open palm and the star over it.
    arm(
      `<g transform="translate(0 ${UPPER})"><g class="tn-fa"><g transform="rotate(${REST.b - REST.a + 180})">` +
        `<g ${plate}><path d="M-19 8L19 8L23 -94L-23 -94Z"/>` +
        '<path d="M-23 -94C-31 -102 -30 -116 -23 -121L-18 -111L-12 -125L-6 -113L0 -127L6 -113L12 -125L18 -111L23 -121C30 -116 31 -102 23 -94Z"/></g>' +
        `<path d="M-21 -60L21 -60M-22 -84L22 -84" stroke="${BRONZE}" stroke-opacity=".7" stroke-width="2.4"/>` +
        `<path d="M16 -90L19 -6" stroke="${LIT}" stroke-opacity=".8" stroke-width="2"/>` +
        `<g transform="translate(0 ${-TO_STAR})"><g class="tn-lift"><g class="tn-star">` +
        '<circle r="84" fill="url(#tn-sg)"/>' +
        `<g class="tn-fl"><path d="${flare}" fill="${PALE}" fill-opacity=".85"/></g>` +
        '<circle r="9" fill="#fffaf0"/></g></g></g>' +
        '</g></g></g>',
    )
  )
}

/** The rune-lit obsidian slab Claude types on, and its rune keys. Self-contained: portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const next = random(41)
  const row = (y: number, i: number) => {
    let x = 320
    let d = ''

    while (x < 374) {
      const k = Math.floor(next() * 4)

      d +=
        k === 0
          ? `M${x} ${y + 2}h7M${x + 2.5} ${y - 3}h2v2h-2z`
          : k === 1
            ? `M${x + 3} ${y - 3}l3 3l-3 3l-3 -3z`
            : k === 2
              ? `M${x} ${y}q2 -4 4 0t4 0`
              : `M${x} ${y}h2v2h-2z`
      x += 9 + Math.floor(next() * 4)
    }

    return `<path class="tn-sr" style="--i:${i}" d="${d}"/>`
  }
  const keys = Array.from({ length: 6 }, (_, i) => `M${254 + i * 13} 325l3 -3l3 3l-3 3z`).join('')

  return (
    `<path d="M242 330L248 320H336L342 330Z" fill="#221a30" stroke="${EDGE}" stroke-width="1.4"/>` +
    `<path d="${keys}" fill="${light}" fill-opacity=".65"/>` +
    '<rect x="298" y="323" width="104" height="7" rx="2" fill="#2a2238"/>' +
    `<path d="M304 326L308 232L318 222H382L392 232L396 326Z" fill="#100b18" stroke="#7a5a2e" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M314 318L317 238L324 231H376L383 238L386 318Z" fill="${light}" fill-opacity=".1"/>` +
    `<g fill="none" stroke="${light}" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round">${[248, 262, 276, 290, 304].map(row).join('')}</g>` +
    `<path d="${burst(350, 240, 4.5, 1.8, 6)}" fill="${activity === 'done' ? '#ffb08a' : '#d97757'}"/>` +
    `<path d="M305 324L309 234" stroke="${light}" stroke-width="2.6"/>`
  )
}

export function cosmicTitanWorld(): World {
  const next = random(3141)
  const starA: string[] = []
  const starB: string[] = []

  for (let i = 0; i < 84; i += 1) {
    const x = next() * 1600
    const y = next() * 1000
    const s = next() > 0.85 ? 3.2 : 2.2

    ;(i % 2 ? starA : starB).push(`M${f(x)} ${f(y)}h${s}v${s}h-${s}z`)
  }

  const sparkles = ([
    [690, 330, 1], [1260, 90, 1.3], [1500, 250, 1], [80, 40, 0.9], [1100, 470, 0.8], [560, 60, 0.8],
  ] as const)
    .map(([x, y, s], i) => `<path class="tn-tw${(i % 2) + 1}" transform="translate(${x} ${y}) scale(${s})" d="M0 -9L1.6 -1.6L9 0L1.6 1.6L0 9L-1.6 1.6L-9 0L-1.6 -1.6Z" fill="#efe6ff"/>`)
    .join('')
  // Chunks of the moon: three big ones off the break (they fall away on an error), a trail across the top, more at
  // the far right and under the dais.
  const chunks = ([
    [538, 246, 44, 0.6], [574, 420, 36, 0.8], [524, 578, 30, 1],
  ] as const)
    .map(([x, y, r, d], i) => `<g class="tn-fall" style="--x:${60 + i * 30}px;--r:${40 + i * 20}deg;--d:${d}s">${shard(next, x, y, r, '#3a3256')}</g>`)
    .join('')
  const trail = ([
    [646, 152, 24], [724, 92, 17], [826, 138, 13], [936, 72, 11], [1046, 116, 9], [1136, 58, 8], [92, 862, 20], [300, 904, 15], [480, 834, 12],
  ] as const)
    .map(([x, y, r]) => shard(next, x, y, r))
    .join('')
  const right = ([
    [1430, 200, 30], [1524, 330, 22], [1390, 470, 18], [1556, 118, 14], [1290, 300, 12],
  ] as const)
    .map(([x, y, r]) => shard(next, x, y, r))
    .join('')
  const crumbs = Array.from({ length: 6 }, (_, i) => `<rect class="tn-cr" style="animation-delay:${f(-i * 1.1)}s" x="${f(30 + next() * 360)}" y="${f(780 + next() * 14)}" width="${f(3 + next() * 4)}" height="${f(3 + next() * 3)}" fill="${EDGE}"/>`).join('')
  // Run: rings of dust and shards around the raised star, seen at a tilt.
  const orbit = Array.from({ length: 6 }, (_, i) => {
    const r = 120 + (i % 3) * 30

    return `<g class="tn-sp" style="--t:${f(2.6 + (i % 3) * 0.9)}s;animation-delay:${f(-i * 0.7)}s"><g transform="translate(${r} 0) scale(1 3.3)"><path d="${rock(next, 9 + (i % 2) * 4, 5)}" fill="${ROCK}" stroke="${LIT}" stroke-opacity=".7" stroke-width="1.4"/></g></g>`
  }).join('')
  const vortex =
    `<g transform="translate(${pt(STAR1)}) rotate(-14)"><g class="tn-vx"><g transform="scale(1 .3)">` +
    `<circle r="200" fill="url(#tn-dg)"/>` +
    [
      [86, 5, '2 7', 2.2],
      [128, 7, '3 10', 3.4],
      [176, 6, '2 16', 4.6],
    ]
      .map(([r, w, dash, t]) => `<g class="tn-sp" style="--t:${t}s"><circle r="${r}" fill="none" stroke="${GOLD}" stroke-opacity=".8" stroke-width="${w}" stroke-dasharray="${dash}"/></g>`)
      .join('') +
    `${orbit}</g></g></g>`
  // Done: the star, let go, hangs where it was and blooms.
  const nova =
    `<g transform="translate(${pt(STAR0)})"><circle class="tn-nova" r="250" fill="url(#tn-nv)"/>` +
    `<circle class="tn-nr" r="60" fill="none" stroke="#ffe9a6" stroke-opacity=".7" stroke-width="3"/><circle class="tn-nr tn-nr2" r="60" fill="none" stroke="#ffe9a6" stroke-opacity=".5" stroke-width="2"/>` +
    '<g class="tn-rel"><circle r="88" fill="url(#tn-sg)"/><circle r="10" fill="#fffaf0"/></g></g>'
  // Read: a crown of stars joins up at the top right.
  const crown: P[] = [[1160, 236], [1214, 150], [1268, 206], [1320, 104], [1372, 206], [1426, 150], [1480, 236]]
  const constellation =
    `<g class="mv-r"><g class="mv-t"><g fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.4">` +
    crown.slice(1).map((p, i) => `<path class="tn-cl" pathLength="1" style="--d:${f(i * 0.16)}s" d="M${pt(crown[i]!)}L${pt(p)}"/>`).join('') +
    `<path class="tn-cl" pathLength="1" style="--d:1s" d="M${pt(crown[6]!)}L${pt(crown[0]!)}"/></g>` +
    crown.map(p => `<circle class="tn-cn" cx="${p[0]}" cy="${p[1]}" r="3.4" fill="${PALE}"/>`).join('') +
    '</g></g>'
  // Web: a comet crosses the top.
  const comet = (delay: number, y: number) =>
    `<g transform="translate(1700 ${y})"><g class="tn-cm" style="animation-delay:${delay}s"><path d="M0 0L170 -23" stroke="url(#tn-ct)" stroke-width="3" stroke-linecap="round"/>` +
    `<circle r="12" fill="url(#tn-sg)"/><circle r="2.6" fill="#fffaf0"/></g></g>`
  const ua = turn(RAISED)
  const lo = turn(LOWERED)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'dust',
      ink: '#05030a',
      furniture: '#1a1426',
      metal: '#2a2238',
      paper: '#e8dcc0',
      light: { idle: '#a88536', work: GOLD, bright: '#ffe6a0' },
      headTop: 200,
      glowAt: [346, 272],
      device,
      wear: {
        front:
          // A violet plume sweeps back from a gold ridge on a gold dome; the brow band carries Claude's starburst and
          // ends above the eyes, the cheek guards stay outside them.
          '<path d="M164 200C166 176 150 158 120 156C96 155 74 166 60 188L72 185L64 199C80 184 100 178 118 182C134 186 146 196 150 206Z" fill="#6e2f94" stroke="#36124e" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M78 177C96 166 118 164 138 171M90 187C106 179 124 178 142 186" fill="none" stroke="#c48ae8" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M66 254V236C66 208 102 196 150 196C198 196 234 208 234 236V254Z" fill="#e8b545" stroke="#6e4a1c" stroke-width="2"/>' +
          '<path d="M67 252V236C67 212 86 201 116 198C98 206 90 222 90 252Z" fill="#a8772a"/>' +
          '<path d="M194 201C219 207 230 220 231 238" fill="none" stroke="#fff0c0" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M141 210L145 188Q152 181 159 188L163 210Z" fill="#f2c14e" stroke="#6e4a1c" stroke-width="1.6" stroke-linejoin="round"/>' +
          '<path d="M62 240H238V254H62Z" fill="#6e4a1c"/><path d="M62 240H238" stroke="#ffd77a" stroke-opacity=".6" stroke-width="1.5"/>' +
          '<g fill="#ffd77a" fill-opacity=".8"><circle cx="80" cy="247" r="1.8"/><circle cx="110" cy="247" r="1.8"/><circle cx="190" cy="247" r="1.8"/><circle cx="220" cy="247" r="1.8"/></g>' +
          `<path d="${burst(150, 247, 6.5, 2.6, 6)}" fill="#d97757"/>` +
          '<path d="M64 252H88V282L77 297L64 290Z" fill="#c8922f" stroke="#6e4a1c" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M214 252H238V290L225 297L214 283Z" fill="#e8b545" stroke="#6e4a1c" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M210 210L211.5 214.5L216 216L211.5 217.5L210 222L208.5 217.5L204 216L208.5 214.5Z" fill="#fffbe8"/>',
      },
      seatArt:
        // A small throne: two spired posts with gold finials, a carved seat.
        `<g fill="#1d1629" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"><path d="M56 352V198L66 178L76 198V352Z"/><path d="M224 352V198L234 178L244 198V352Z"/></g>` +
        '<path d="M76 216H224V352H76Z" fill="#16111f"/>' +
        `<path d="M66 202V344M234 202V344" stroke="${BRONZE}" stroke-opacity=".7" stroke-width="2"/>` +
        `<g fill="${GOLD}"><circle cx="66" cy="178" r="4.5"/><circle cx="234" cy="178" r="4.5"/></g>` +
        `<path d="M92 346H212V358H92Z" fill="#2a2238" stroke="${BRONZE}" stroke-width="1.6"/>` +
        `<path d="M98 358H206V456H98Z" fill="#15101f" stroke="${EDGE}" stroke-width="2"/>` +
        `<path d="${GLYPHS[1]!(152, 404, 1.6)}" fill="none" stroke="${GOLD}" stroke-opacity=".4" stroke-width="1.8"/>`,
      tableArt:
        // An obsidian slab on two carved blocks, a gold inlay along its edge.
        `<path d="M166 330H470V346H166Z" fill="#1a1426" stroke="${EDGE}" stroke-width="1.6"/>` +
        `<path d="M168 333H468" stroke="${GOLD}" stroke-opacity=".35" stroke-width="1.5"/>` +
        `<g fill="#120d1a" stroke="#3a2d4e" stroke-width="1.6"><path d="M186 346H220V456H186Z"/><path d="M418 346H452V456H418Z"/></g>` +
        `<path d="${GLYPHS[0]!(203, 396, 1.4)}${GLYPHS[3]!(435, 396, 1.4)}" fill="none" stroke="${GOLD}" stroke-opacity=".3" stroke-width="1.6"/>`,
    },
    style:
      // Ambient: stars twinkle, the nebula drifts, the moon floats, shards drift, the star flickers, the visor breathes.
      '.tn-tw1{animation:tn-tw 3.6s ease-in-out infinite alternate}.tn-tw2{animation:tn-tw 2.8s ease-in-out -1.4s infinite alternate}' +
      '@keyframes tn-tw{from{opacity:.3}to{opacity:.9}}' +
      '.tn-neb{animation:tn-neb 46s ease-in-out infinite alternate}.tn-neb2{animation-duration:60s;animation-direction:alternate-reverse}' +
      '@keyframes tn-neb{to{transform:translate(-40px,18px)}}' +
      '.tn-float{animation:tn-float 9s ease-in-out infinite alternate}@keyframes tn-float{from{transform:translateY(-6px)}to{transform:translateY(6px)}}' +
      '.tn-dr{transform-box:fill-box;transform-origin:center;animation:tn-dr var(--t,14s) ease-in-out var(--d,0s) infinite alternate}' +
      '@keyframes tn-dr{to{transform:translate(var(--x),var(--y)) rotate(var(--r))}}' +
      '.tn-cr{opacity:0;animation:tn-cr 6.6s linear infinite}@keyframes tn-cr{0%{opacity:0;transform:translateY(0)}15%{opacity:.7}100%{opacity:0;transform:translateY(170px)}}' +
      '.tn-star{animation:tn-flk 1.9s ease-in-out infinite alternate}@keyframes tn-flk{from{transform:scale(.92)}to{transform:scale(1.06)}}' +
      '.tn-fl{animation:mv-spin 24s linear infinite}' +
      '.tn-vis{opacity:.55;animation:tn-vis 5s ease-in-out infinite alternate}@keyframes tn-vis{from{opacity:.4}to{opacity:.75}}' +
      '.tn-seam{opacity:.8;animation:tn-seam 6s ease-in-out infinite alternate}@keyframes tn-seam{to{opacity:1}}' +
      '.tn-rn{opacity:.28}.tn-sr{opacity:.8}' +
      '@keyframes tn-in{to{opacity:1}}' +
      // Thinking: the star pulses and the visor glows with it.
      '.st-thinking .tn-star{animation:tn-pulse 2.4s ease-in-out -1s infinite}@keyframes tn-pulse{0%,100%{transform:scale(.95)}50%{transform:scale(1.45)}}' +
      '.st-thinking .tn-vis{animation:tn-vis2 2.4s ease-in-out -1s infinite}@keyframes tn-vis2{0%,100%{opacity:.45}50%{opacity:1}}' +
      // Responding and tool: light runs down the throne's channels; on a tool the runes light in turn.
      '.tn-ch{opacity:0;stroke-dasharray:14 46}.st-responding .tn-ch{opacity:.6;animation:tn-ch 1.6s linear infinite}' +
      '.st-tool .tn-ch{opacity:.7;animation:tn-ch .7s linear infinite}@keyframes tn-ch{to{stroke-dashoffset:-60}}' +
      '.st-responding .tn-rn{opacity:.45}' +
      '.st-tool .tn-rn{animation:tn-rn 1.4s ease-in-out infinite;animation-delay:calc(var(--i) * -.18s)}@keyframes tn-rn{50%{opacity:1}}' +
      '.st-tool .tn-sr,.st-run .tn-sr{animation:tn-sr .9s ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.15s)}@keyframes tn-sr{from{opacity:.35}to{opacity:1}}' +
      // Read: a crown of stars joins up. Web: comets cross the top.
      '.tn-cl{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-read .tn-cl{animation:tn-ft 1.2s ease-out var(--d) both}' +
      '.tn-cn{opacity:.3}.st-read .tn-cn{animation:tn-cn 1.6s ease-in-out infinite alternate}@keyframes tn-cn{to{opacity:1}}' +
      '.tn-cm{opacity:0}.st-web .tn-cm{animation:tn-cm 2.8s linear infinite}' +
      '@keyframes tn-cm{0%{opacity:0;transform:translate(0,0)}8%,85%{opacity:1}100%{opacity:0;transform:translate(-1900px,260px)}}' +
      // Run: the titan raises the star, rings of dust and shards spin up around it, the break in the moon lights up.
      `.st-run .tn-ua{animation:tn-ua1 1.3s cubic-bezier(.45,0,.2,1) both}@keyframes tn-ua1{to{transform:rotate(${ua.ua}deg)}}` +
      `.st-run .tn-fa{animation:tn-fa1 1.3s cubic-bezier(.45,0,.2,1) both}@keyframes tn-fa1{to{transform:rotate(${ua.fa}deg)}}` +
      `.st-run .tn-lift{animation:tn-lift 1s ease-out .5s both}@keyframes tn-lift{to{transform:translateY(${-LIFT}px) scale(1.25)}}` +
      '.st-run .tn-star{animation:tn-pulse 1.8s ease-in-out infinite}' +
      '.st-run .tn-vis{animation:tn-in 1.2s ease-out both}.st-run .tn-seam{animation:tn-in 1s ease-out both}' +
      '.tn-vx{opacity:0}.st-run .tn-vx{animation:tn-vx 1.3s ease-out .8s both}@keyframes tn-vx{from{opacity:0;transform:scale(.25)}to{opacity:1;transform:scale(1)}}' +
      '.st-run .tn-sp{animation:mv-spin var(--t,4s) linear infinite}' +
      // Error: the moon jolts, the faults draw in fire, pieces of the limb and the big chunks fall away, the star sputters.
      '.st-error .tn-float{animation:tn-shake .4s ease-in-out 3}@keyframes tn-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-4px,2px)}75%{transform:translate(4px,-2px)}}' +
      '.tn-ft{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .tn-ft{animation:tn-ft .8s ease-out var(--d,.1s) both}' +
      '@keyframes tn-ft{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.tn-hole,.tn-vise{opacity:0}.st-error .tn-hole{animation:tn-in .3s ease-out .5s both}.st-error .tn-vise{animation:tn-in .4s ease-out both}' +
      '.tn-fall{transform-box:fill-box;transform-origin:center}' +
      '.st-error .tn-fall{animation:tn-fall 2.4s cubic-bezier(.55,0,.85,.5) var(--d,.45s) both}' +
      '@keyframes tn-fall{85%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y,360px)) rotate(var(--r))}}' +
      '.st-error .tn-star{animation:tn-sput 1.6s ease-in-out infinite}' +
      '@keyframes tn-sput{0%,100%{opacity:1;transform:scale(1)}30%{opacity:.45;transform:scale(.8)}55%{opacity:.85}75%{opacity:.4;transform:scale(.75)}}' +
      // Done: the star is let go and blooms into a soft halo, the hand comes down, the visor calms.
      '.tn-rel,.tn-nova,.tn-nr{opacity:0}' +
      '.st-done .tn-star{animation:tn-out .5s ease-out both}@keyframes tn-out{to{opacity:0;transform:scale(1.4)}}' +
      '.st-done .tn-rel{animation:tn-rel 3.4s ease-out both}@keyframes tn-rel{from{opacity:1;transform:translateY(0)}to{opacity:1;transform:translateY(-24px)}}' +
      '.st-done .tn-nova{animation:tn-nova 3.2s ease-out .3s both}@keyframes tn-nova{0%{opacity:0;transform:scale(.2)}35%{opacity:1;transform:scale(1)}100%{opacity:.95;transform:scale(1.08)}}' +
      '.st-done .tn-nr{animation:tn-nr 2.4s ease-out .35s both}.st-done .tn-nr2{animation-delay:.9s;animation-duration:3.4s}' +
      '@keyframes tn-nr{0%{opacity:.7;transform:scale(.3)}100%{opacity:0;transform:scale(3.6)}}' +
      `.st-done .tn-ua{animation:tn-ua2 1.6s ease-in-out .6s both}@keyframes tn-ua2{to{transform:rotate(${lo.ua}deg)}}` +
      `.st-done .tn-fa{animation:tn-fa2 1.6s ease-in-out .6s both}@keyframes tn-fa2{to{transform:rotate(${lo.fa}deg)}}` +
      '.st-done .tn-vis{animation:tn-calm 2s ease-out both}@keyframes tn-calm{to{opacity:.3}}' +
      // Claude asleep: the titan dims its visor too.
      '.st-sleeping .tn-vis{animation:none;opacity:.15}',
    scenery:
      '<defs>' +
      '<linearGradient id="tn-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07040d"/><stop offset=".55" stop-color="#0d0814"/><stop offset="1" stop-color="#130a1d"/></linearGradient>' +
      '<radialGradient id="tn-nb"><stop offset="0" stop-color="#6a3aa8" stop-opacity=".55"/><stop offset=".5" stop-color="#4a2580" stop-opacity=".22"/><stop offset="1" stop-color="#4a2580" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tn-nm"><stop offset="0" stop-color="#a8398e" stop-opacity=".45"/><stop offset=".5" stop-color="#6e2470" stop-opacity=".18"/><stop offset="1" stop-color="#6e2470" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tn-ni"><stop offset="0" stop-color="#3a3aa0" stop-opacity=".4"/><stop offset="1" stop-color="#3a3aa0" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="tn-ng"><stop offset="0" stop-color="${GOLD}" stop-opacity=".3"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="tn-moon" gradientUnits="userSpaceOnUse" cx="120" cy="220" r="540"><stop offset="0" stop-color="#5d5280"/><stop offset=".4" stop-color="#3a3254"/><stop offset=".75" stop-color="#221b34"/><stop offset="1" stop-color="#161122"/></radialGradient>' +
      '<linearGradient id="tn-pil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2240"/><stop offset=".5" stop-color="#433a5e"/><stop offset="1" stop-color="#261f3a"/></linearGradient>' +
      '<linearGradient id="tn-pl" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="400" y2="0"><stop offset="0" stop-color="#08060d"/><stop offset=".6" stop-color="#130e1c"/><stop offset="1" stop-color="#2a2034"/></linearGradient>' +
      `<radialGradient id="tn-vg"><stop offset="0" stop-color="${GOLD}" stop-opacity=".7"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="tn-sg"><stop offset="0" stop-color="#fffaf0" stop-opacity=".95"/><stop offset=".12" stop-color="#ffe9a6" stop-opacity=".8"/><stop offset=".4" stop-color="${GOLD}" stop-opacity=".32"/><stop offset="1" stop-color="${FIRE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="tn-nv"><stop offset="0" stop-color="#fff3c4" stop-opacity=".34"/><stop offset=".4" stop-color="${GOLD}" stop-opacity=".2"/><stop offset=".75" stop-color="#b04aa0" stop-opacity=".07"/><stop offset="1" stop-color="#b04aa0" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="tn-dg"><stop offset=".3" stop-color="${GOLD}" stop-opacity="0"/><stop offset=".55" stop-color="${GOLD}" stop-opacity=".26"/><stop offset=".8" stop-color="#b04aa0" stop-opacity=".14"/><stop offset="1" stop-color="#b04aa0" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="tn-frac" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2e2640"/><stop offset="1" stop-color="#7a6a9c"/></linearGradient>' +
      '<linearGradient id="tn-ct" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#tn-bg)"/>' +
      // The nebula.
      '<g class="tn-neb"><ellipse cx="1280" cy="150" rx="560" ry="280" fill="url(#tn-nm)"/><ellipse cx="800" cy="30" rx="480" ry="150" fill="url(#tn-nb)" opacity=".4"/></g>' +
      '<g class="tn-neb tn-neb2"><ellipse cx="820" cy="1000" rx="700" ry="220" fill="url(#tn-ni)" opacity=".7"/><ellipse cx="1350" cy="640" rx="300" ry="160" fill="url(#tn-nm)" opacity=".5"/></g>' +
      '<g class="mv-r"><ellipse cx="1540" cy="440" rx="330" ry="430" fill="url(#tn-nb)"/></g>' +
      '<g fill="none" stroke-linecap="round"><path d="M980 0C1100 120 1300 150 1640 90" stroke="#b04aa0" stroke-opacity=".07" stroke-width="44"/>' +
      '<path d="M1180 400C1300 330 1420 360 1640 280" stroke="#6a3aa8" stroke-opacity=".08" stroke-width="60"/></g>' +
      `<path class="tn-tw1" d="${starA.join('')}" fill="#e6dcff" fill-opacity=".8"/><path class="tn-tw2" d="${starB.join('')}" fill="#f6eedc" fill-opacity=".7"/>` +
      sparkles +
      '<ellipse cx="700" cy="250" rx="380" ry="60" transform="rotate(-12 700 250)" fill="url(#tn-ng)" opacity=".5"/>' +
      `<g class="mv-r">${right}</g>` +
      trail +
      constellation +
      comet(0, 40) +
      comet(-1.4, 150) +
      // The moon and its titan, floating as one.
      '<g class="tn-float">' +
      '<ellipse cx="220" cy="400" rx="560" ry="520" fill="url(#tn-nb)"/>' +
      moon(next) +
      rimPieces(next) +
      throne() +
      faults() +
      crumbs +
      titan() +
      chunks +
      vortex +
      nova +
      '</g>',
    nook:
      // A floating shard for a floor, a rune-carved obelisk behind the desk, a small rock drifting above.
      `<path d="M-10 452L40 448L90 454L150 446L230 452L300 447L380 453L440 449V480H-10Z" fill="#120d1a" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M380 452V-140L398 -178L416 -140V452Z" fill="#110c19" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M380 -118H416M380 196H416" stroke="${BRONZE}" stroke-opacity=".7" stroke-width="3"/>` +
      `<g fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round">${[0, 1, 2, 3, 4].map(i => `<path class="tn-rn" style="--i:${i}" d="${GLYPHS[(i + 1) % 5]!(398, -84 + i * 56, 1.3)}"/>`).join('')}</g>` +
      shard(random(77), 250, -90, 40) +
      shard(random(78), 120, -190, 18),
  }
}
