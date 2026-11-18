import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Verdant Hollow: a hermit in a hood of leaves and moss, working in the hollow of a great tree in an ancient mossy
// forest. Fog lies low, moonlight falls in shafts through a gap in the canopy, fireflies drift everywhere. On the
// left a forest guardian of moss and stone, an antlered stag spirit, rests in the fog. A command wakes it: it rises
// and walks slowly through the fog. An error makes roots burst from the ground and topple a stump; done gathers the
// fireflies into a glowing spiral.
const STONE = '#253027'
const STONE_LIT = '#3c493d'
const STONE_DARK = '#151c16'
const MOSS = '#2f5a2c'
const MOSS_LIT = '#5f9a45'
const MOSS_DARK = '#1d3a1e'
const WOOD = '#3a2a1a'
const WOOD_EDGE = '#55402a'
const BARK = '#120f0a'
// The edges of the old tree at the left and the great tree at the right, top to bottom.
const LEFT_EDGE: readonly [number, number][] = [
  [64, -20],
  [70, 140],
  [68, 320],
  [76, 480],
  [86, 600],
  [104, 690],
]
const RIGHT_EDGE: readonly [number, number][] = [
  [1250, -20],
  [1238, 180],
  [1212, 380],
  [1186, 520],
  [1168, 620],
  [1156, 760],
  [1140, 860],
]

/** A leaf from its stem at (x, y), pointing up before `rot`, with its midrib. */
function leaf(x: number, y: number, len: number, w: number, rot: number, fill: string): string {
  return (
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0Q${w} ${f(-len * 0.45)} 0 ${-len}Q${-w} ${f(-len * 0.45)} 0 0Z" fill="${fill}"/>` +
    `<path d="M0 0V${f(-len * 0.85)}" stroke="#16301a" stroke-opacity=".7" stroke-width="1.4"/></g>`
  )
}

/** A whole number, for the many small generated shapes. */
const n = (value: number): string => String(Math.round(value))

/** A fern frond as strokes: a bending stem and its leaflets, from (x, y) leaning by `rot` degrees. */
function frond(x: number, y: number, len: number, rot: number, bend: number): { stem: string; leaves: string } {
  const a = (rot * Math.PI) / 180
  const at = (u: number, v: number): [number, number] => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)]
  const stem: string[] = []
  const leaves: string[] = []

  for (let i = 0; i <= 7; i += 1) {
    const t = i / 7
    const [px, py] = at(bend * len * t * t, -len * t)

    stem.push(`${n(px)} ${n(py)}`)

    if (i > 0 && i < 7) {
      const lw = len * 0.22 * (1 - t * 0.75)

      for (const side of [-1, 1]) {
        const [qx, qy] = at(bend * len * t * t + side * lw, -len * t - lw * 0.45)

        leaves.push(`M${n(px)} ${n(py)}l${n(qx - px)} ${n(qy - py)}`)
      }
    }
  }

  return { stem: `M${stem.join('L')}`, leaves: leaves.join('') }
}

/** A small glowing mushroom on the ground at (x, y). */
function mushroom(x: number, y: number, s: number, delay: number): string {
  return (
    `<circle class="vh-mg" style="animation-delay:${delay}s" cx="${x}" cy="${f(y - 8 * s)}" r="${f(24 * s)}" fill="url(#vh-gl)"/>` +
    `<path d="M${x} ${y}V${f(y - 8 * s)}" stroke="#cfd8b8" stroke-opacity=".8" stroke-width="${f(3 * s)}"/>` +
    `<path d="M${f(x - 8 * s)} ${f(y - 7 * s)}Q${x} ${f(y - 20 * s)} ${f(x + 8 * s)} ${f(y - 7 * s)}Z" fill="#c4f5a4"/>`
  )
}

/** Tall trunks in one layer, each flaring at its foot, as one path. */
function trunks(count: number, x0: number, x1: number, w0: number, w1: number, base: number, seed: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const x = x0 + ((x1 - x0) * (i + 0.2 + next() * 0.6)) / count
    const w = w0 + next() * (w1 - w0)
    const b = base + next() * 24

    d +=
      `M${f(x - w / 2)} -10L${f(x - w * 0.6)} ${f(b - 50)}Q${f(x - w * 0.7)} ${f(b)} ${f(x - w * 1.4)} ${f(b + 6)}` +
      `H${f(x + w * 1.4)}Q${f(x + w * 0.7)} ${f(b)} ${f(x + w * 0.6)} ${f(b - 50)}L${f(x + w / 2)} -10Z`
  }

  return d
}

/** The canopy's lower edge: clumps of leaves hanging, highest over the moon gap. */
function canopy(seed: number, low: number, amp: number): string {
  const next = random(seed)
  let d = 'M1660 -20H-60V60'
  let x = -60
  let y = 60

  while (x < 1660) {
    const nx = x + 60 + next() * 50
    const gap = nx > 290 && nx < 560
    const ny = gap ? 8 + next() * 22 : low + next() * amp

    d += `Q${f((x + nx) / 2)} ${f(Math.max(y, ny) + 26)} ${f(nx)} ${f(ny)}`
    x = nx
    y = ny
  }

  return `${d}Z`
}

/** Hanging moss: wavy strands from (x, y) down, as one path. */
function strands(seed: number, spots: readonly [number, number, number][]): string {
  const next = random(seed)

  return spots
    .map(([x, y, len]) => {
      const h = len * (0.6 + next() * 0.5)

      return `M${f(x)} ${f(y)}q4 ${f(h / 4)} 0 ${f(h / 2)}t0 ${f(h / 2)}`
    })
    .join('')
}

/** An uneven coat of moss along a trunk's edge: `side` 1 grows it to the right of the edge, -1 to the left. */
function mossBand(edge: readonly [number, number][], side: number, seed: number): string {
  const next = random(seed)
  const at = (y: number): number => {
    for (let i = 1; i < edge.length; i += 1) {
      const [x1, y1] = edge[i]!
      const [x0, y0] = edge[i - 1]!

      if (y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)
    }

    return edge[edge.length - 1]![0]
  }
  const y0 = edge[0]![1]
  const y1 = edge[edge.length - 1]![1]
  const outer: string[] = []
  const inner: string[] = []

  for (let y = y0; y <= y1; y += 26) {
    outer.push(`${n(at(y) - side * 2)} ${n(y)}`)
    inner.unshift(`${n(at(y) + side * (6 + next() * (next() > 0.7 ? 34 : 16)))} ${n(y + 13)}`)
  }

  return `M${outer.join('L')}L${inner.join('L')}Z`
}

/** The forest guardian in its own frame: the ground under its hooves at 0, facing right. */
function guardian(): string {
  const rear = 'M-26 0C-34 50-26 86-10 112L-4 186H10L14 108C28 78 30 36 24 0Z'
  const front = 'M-18 0C-20 40-14 80-10 112L-6 186H8L10 112C14 80 18 40 18 0Z'
  const leg = (x: number, d: string, fill: string, phase: string) =>
    `<g transform="translate(${x} -200)"><g class="vh-st"><g class="vh-lg ${phase}"><path d="${d}" fill="${fill}"/>` +
    `<path d="M-11 185H10L13 200H-13Z" fill="#0b110c"/><path d="M-15 100q15 -10 30 0q-5 12 -15 13q-10 -1 -15 -13Z" fill="${MOSS}"/></g></g></g>`
  // The back's line, for the moss mantle to follow: rump at the left, withers high at the right.
  const back: readonly [number, number][] = [
    [-122, -226],
    [-108, -268],
    [-56, -290],
    [0, -292],
    [44, -302],
    [90, -314],
    [130, -316],
    [158, -262],
  ]
  const topAt = (x: number): number => {
    for (let i = 1; i < back.length; i += 1) {
      const [x1, y1] = back[i]!
      const [x0, y0] = back[i - 1]!

      if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }

    return -262
  }
  const shag = random(9)
  let mantle = 'M-120 -222C-132 -262-104 -290-56 -290C-6 -290 44 -302 90 -314C128 -322 156 -298 158 -262'

  for (let x = 154, i = 0; x > -118; x -= 10 + shag() * 8, i += 1) mantle += `L${n(x)} ${n(topAt(x) + 30 + (i % 2 ? 14 + shag() * 18 : shag() * 6))}`

  const belly = [-90, -62, -30, 4, 40, 76, 108]
    .map((x, i) => `M${x} ${x > 60 ? -184 : -178}q-3 ${8 + (i % 3) * 6} 1 ${16 + (i % 3) * 10}`)
    .join('')
  const beard = [0, 1, 2, 3, 4]
    .map(i => {
      const t = i / 4

      return `M${n(216 - 58 * t)} ${n(-392 + 130 * t)}q6 ${12 + (i % 2) * 8} 0 ${26 + (i % 3) * 10}`
    })
    .join('')
  const nearAntler =
    'M188 -398C176 -440 150 -478 132 -520C116 -556 112 -590 118 -630M170 -450C186 -472 214 -486 236 -512' +
    'M146 -496C162 -526 186 -546 194 -582M126 -540C108 -560 92 -578 80 -612M120 -590C134 -612 150 -626 154 -650M118 -630C106 -646 96 -652 84 -664'
  const farAntler =
    'M204 -400C222 -446 252 -486 280 -528C298 -556 306 -588 304 -624M226 -450C246 -458 270 -470 296 -472' +
    'M258 -500C280 -510 306 -528 320 -556M290 -548C302 -574 326 -590 340 -600M304 -600C292 -620 284 -640 286 -660'
  const antlerMoss = strands(5, [
    [150, -500, 50],
    [128, -552, 60],
    [176, -456, 36],
    [252, -486, 46],
    [288, -540, 56],
    [104, -572, 40],
    [306, -594, 34],
  ])
  const perched = (
    [
      [236, -514, -60, -120],
      [80, -614, -90, -80],
      [154, -652, 30, -140],
      [320, -558, 110, -90],
      [286, -662, 60, -150],
    ] as const
  )
    .map(
      ([x, y, dx, dy], i) =>
        `<circle class="vh-pf" style="--x:${dx}px;--y:${dy}px;animation-delay:${f(-i * 0.9)}s,${f(0.3 + i * 0.12)}s" cx="${x}" cy="${y}" r="9" fill="url(#vh-ff)"/>`,
    )
    .join('')
  return (
    '<g class="vh-walk"><g class="vh-rise"><g class="vh-bob">' +
    leg(-70, rear, STONE_DARK, 'vh-lgB') +
    leg(100, front, STONE_DARK, 'vh-lgA') +
    // The body: stone under a shaggy mantle of moss, its plates, the glowing marks and the heart-stone.
    `<path d="M-120 -222C-132 -262-104 -290-56 -290C-6 -290 44 -302 90 -314C128 -322 156 -298 158 -262C160 -226 146 -196 118 -186C82 -174 40 -182 0 -180C-44 -178-84 -172-106 -186C-120 -196-118 -208-120 -222Z" fill="${STONE}"/>` +
    `<path d="M-100 -238L-64 -250L-36 -232L-50 -200L-92 -204ZM-20 -244L24 -256L52 -232L32 -198L-10 -206ZM66 -246L104 -256L124 -224L98 -194L62 -210Z" fill="${STONE_LIT}" fill-opacity=".55" stroke="${STONE_DARK}" stroke-width="2"/>` +
    // Invented marks, never letters: nested ripples, a fern-vein sprig and an arc of dots.
    `<path class="vh-rune" d="M-86 -210q18 -26 36 0M-77 -210q9 -13 18 0M-68 -210h.1M2 -204C8 -216 14 -230 16 -246M5 -209q9 1 13 -6M7 -214q-10 -1 -14 -10M11 -224q10 0 14 -9M14 -235q-8 -2 -10 -10M70 -210h.1M78 -221h.1M90 -226h.1M102 -221h.1M110 -210h.1" fill="none" stroke="#c8ffa8" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${mantle}Z" fill="#29502a"/>` +
    `<path d="M-118 -232C-124 -264-100 -288-56 -289C-6 -289 44 -301 90 -313C126 -320 152 -300 156 -270" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".5" stroke-width="3"/>` +
    `<path d="${belly}" fill="none" stroke="${MOSS_DARK}" stroke-width="3" stroke-linecap="round"/>` +
    '<circle class="vh-heart" cx="138" cy="-246" r="42" fill="url(#vh-gl)"/>' +
    '<path d="M138 -260l10 14l-10 14l-10 -14Z" fill="#cdf5b0" fill-opacity=".75"/>' +
    // The neck, its mane and beard of moss.
    `<path d="M92 -296C102 -336 126 -374 160 -406L218 -392C200 -356 182 -318 160 -258Z" fill="${STONE}"/>` +
    `<path d="M80 -290C92 -340 120 -384 158 -418L176 -406C146 -374 126 -340 114 -296Z" fill="#29502a"/>` +
    `<path d="${beard}" fill="none" stroke="${MOSS}" stroke-width="4" stroke-linecap="round"/>` +
    // The head, which looks about, with its antlers.
    '<g transform="translate(10 -24)"><g class="vh-hd">' +
    `<path d="${farAntler}" fill="none" stroke="#18201a" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="${farAntler}" fill="none" stroke="${MOSS}" stroke-opacity=".6" stroke-width="4" stroke-dasharray="40 14 24 30" stroke-linecap="round"/>` +
    `<path d="M172 -392C160 -414 136 -426 116 -428C128 -410 146 -396 166 -384Z" fill="${MOSS_DARK}"/>` +
    `<path d="M156 -376C166 -404 204 -410 228 -394L272 -366C282 -358 278 -344 266 -342L226 -338C204 -334 178 -340 162 -352Z" fill="${STONE}"/>` +
    `<path d="M160 -384C172 -404 206 -410 228 -394L240 -386C214 -397 186 -397 166 -378Z" fill="#29502a"/>` +
    '<ellipse cx="268" cy="-356" rx="5" ry="4" fill="#0a100b"/>' +
    '<path d="M200 -378q9 5 18 0" fill="none" stroke="#0a100b" stroke-width="2.6" stroke-linecap="round"/>' +
    '<g class="vh-eye"><circle cx="209" cy="-377" r="30" fill="url(#vh-eg)"/><ellipse cx="209" cy="-377" rx="8" ry="4.6" fill="#f0ffe0"/></g>' +
    `<path d="${nearAntler}" fill="none" stroke="#222c23" stroke-width="13" stroke-linecap="round"/>` +
    `<path d="${nearAntler}" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".45" stroke-width="5" stroke-dasharray="44 12 26 28" stroke-linecap="round"/>` +
    `<g class="vh-sway"><path d="${antlerMoss}" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/></g>` +
    perched +
    '</g></g>' +
    leg(-92, rear, STONE, 'vh-lgA') +
    leg(124, front, STONE, 'vh-lgB') +
    '</g></g></g>'
  )
}

/** The bark-framed screen on a stone slab, a sprout on its lid, and a jar of fireflies. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="9" height="3.4" rx="1.6" fill="${light}" fill-opacity=".5"/>`).join('')
  const lit = activity === 'done' ? 1 : 0.75
  const bugs = [
    [384, 318],
    [395, 309],
    [390, 323],
  ]
    .map(([x, y], i) => `<circle class="vh-jf" style="animation-delay:${-i * 0.7}s" cx="${x}" cy="${y}" r="2.6" fill="#eeffa8" fill-opacity="${lit}"/>`)
    .join('')

  return (
    '<path d="M244 330L249 321H339L343 330Z" fill="#3c443a" stroke="#58624f" stroke-width="1.4"/>' +
    keys +
    `<path d="M246 322q4 -5 9 -1q3 -4 8 0" fill="none" stroke="${MOSS_LIT}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M333 328C338 300 346 268 354 236L368 239C360 272 352 304 347 330Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
    `<path d="M337 324C341 300 348 272 356 244L361 245C354 272 347 300 342 326Z" fill="${light}"/>` +
    `<path d="M337 324C341 300 348 272 356 244L344 250C338 278 330 304 327 324Z" fill="${light}" fill-opacity=".16"/>` +
    `<path d="M361 238C363 228 361 220 357 214" fill="none" stroke="${WOOD_EDGE}" stroke-width="2.4"/>` +
    '<path d="M357 216Q345 207 339 213Q347 223 357 216ZM358 220Q369 209 376 215Q367 226 358 220Z" fill="#6fbf4a"/>' +
    `<path d="M344 330q4 -7 10 -2q4 -6 9 0" fill="${MOSS}"/>` +
    // The jar of fireflies, kept inside the picture's right edge (desk-box x 420).
    `<circle cx="390" cy="314" r="${activity === 'done' ? 28 : 22}" fill="#d8ff8a" fill-opacity=".1"/>` +
    `<path d="M374 330V302Q374 296 380 296H400Q406 296 406 302V330Z" fill="${light}" fill-opacity=".1" stroke="#a8c4a0" stroke-opacity=".6" stroke-width="2"/>` +
    bugs +
    '<rect x="377" y="288" width="26" height="9" rx="3" fill="#8a6a44"/><path d="M377 293H403" stroke="#5a4228" stroke-width="1.4"/>' +
    '<path d="M380 302V324" stroke="#ffffff" stroke-opacity=".22" stroke-width="2"/>'
  )
}

export function verdantHollowWorld(): World {
  const next = random(23)
  // Fireflies: thick on the left and right, a few faint ones in the middle.
  const flies = Array.from({ length: 60 }, (_, i) => {
    const zone = i % 10
    let x: number
    let y: number
    let dim = 1

    if (zone < 4) {
      x = 20 + next() * 400
      y = 120 + next() * 760
    } else if (zone < 7) {
      x = 1190 + next() * 390
      y = 70 + next() * 420
    } else if (zone < 9) {
      x = 440 + next() * 720
      y = 40 + next() * 170
      dim = 0.55
    } else {
      x = 460 + next() * 680
      y = 260 + next() * 560
      dim = 0.35
    }

    // Pace and drift come from nth-child rules in the style; only the phase is per fly.
    return `<circle style="--d:${f(-next() * 5)}s" cx="${n(x)}" cy="${n(y)}" r="${n(5 + next() * 5)}"${dim < 1 ? ` fill-opacity="${dim}"` : ''}/>`
  }).join('')
  // Done: three arms of fireflies swirl in from all around and settle into a spiral.
  const arms: string[] = ['', '', '']
  const spiral = Array.from({ length: 48 }, (_, i) => {
    const arm = i % 3
    const t = (Math.floor(i / 3) + 1) / 16
    const r = 14 + 156 * t
    const a = (arm * 2 * Math.PI) / 3 + t * 1.7 * Math.PI
    const x = r * Math.cos(a)
    const y = r * Math.sin(a) * 0.86

    arms[arm] += `${arms[arm] === '' ? 'M' : 'L'}${n(x)} ${n(y)}`

    return `<circle style="--d:${f(t * 0.6 + next() * 0.3)}s" cx="${n(x)}" cy="${n(y)}" r="${f(9 - 4.5 * t)}"/>`
  }).join('')
  const trails = arms.map(d => `<path class="vh-trail" pathLength="1" d="${d}"/>`).join('')
  // Error: roots burst out of the ground around the stump and fling dirt.
  const root = (x: number, h: number, dx: number, w: number, delay: number) =>
    `<path class="vh-root" style="animation-delay:${delay}s" d="M${x - w} 934C${x - w} ${f(934 - h * 0.5)} ${f(x + dx - w * 0.4)} ${f(934 - h * 0.85)} ${x + dx} ${934 - h}` +
    `C${f(x + dx + w * 0.3)} ${f(934 - h * 0.7)} ${x + w} ${f(934 - h * 0.4)} ${x + w} 934Z"/>`
  const roots =
    root(150, 130, -44, 13, 0.16) +
    root(214, 210, -40, 18, 0.06) +
    root(262, 110, -16, 11, 0.22) +
    root(306, 250, -28, 22, 0) +
    root(404, 270, 30, 24, 0.03) +
    root(458, 170, 46, 16, 0.12) +
    root(512, 120, 54, 12, 0.2)
  const clods = Array.from({ length: 10 }, (_, i) => {
    const x = 220 + next() * 250
    const s = 4 + next() * 5

    return `<path class="vh-clod" style="--x:${f((next() - 0.5) * 180)}px;--y:${f(-90 - next() * 120)}px;animation-delay:${f(0.08 + i * 0.03)}s" d="M${f(x)} 928l${f(s)} ${f(-s * 0.6)}l${f(s * 0.4)} ${f(s)}l${f(-s)} ${f(s * 0.5)}Z"/>`
  }).join('')
  const dust = [0, 1, 2]
    .map(i => `<ellipse class="vh-dust" style="animation-delay:${f(0.15 + i * 0.2)}s" cx="${300 + i * 70}" cy="${918 - i * 6}" rx="70" ry="30" fill="url(#vh-du)"/>`)
    .join('')
  // Moss shaken off the guardian's back as it rises, and dust at its hooves.
  const shed = Array.from({ length: 7 }, (_, i) => {
    const x = 30 + i * 40 + next() * 20

    return `<path class="vh-deb" style="--x:${f((next() - 0.5) * 60)}px;animation-delay:${f(0.4 + next() * 0.6)}s" d="M${f(x)} 560q6 -6 12 0q-2 7 -6 8q-5 -1 -6 -8Z" fill="${MOSS_LIT}"/>`
  }).join('')
  const hoofDust = [-90, 0, 100]
    .map((x, i) => `<ellipse class="vh-hdust" style="animation-delay:${f(0.5 + i * 0.25)}s" cx="${150 + x}" cy="760" rx="90" ry="24" fill="url(#vh-fog)"/>`)
    .join('')
  const ferns = (spots: readonly [number, number, number, number, number][], cls: string) => {
    const all = spots.map(([x, y, l, r, b]) => frond(x, y, l, r, b))

    return (
      `<g class="${cls}" fill="none" stroke-linecap="round"><path d="${all.map(p => p.stem + p.leaves).join('')}" stroke="#1d4422" stroke-width="3.4"/>` +
      `<path d="${all.map(p => p.stem).join('')}" stroke="${MOSS_LIT}" stroke-opacity=".5" stroke-width="1.6"/></g>`
    )
  }
  const leftMoss = strands(3, Array.from({ length: 16 }, (_, i): [number, number, number] => [20 + i * 26 + next() * 14, 60 + next() * 70, 70 + next() * 110]))
  const rightMoss = strands(4, Array.from({ length: 12 }, (_, i): [number, number, number] => [1230 + i * 30 + next() * 12, 40 + next() * 60, 60 + next() * 120]))
  const midMoss = strands(6, Array.from({ length: 10 }, (_, i): [number, number, number] => [600 + i * 60 + next() * 30, 50 + next() * 50, 30 + next() * 50]))
  const fungi = (
    [
      [1243, 170, 1.1],
      [1234, 250, 0.8],
      [1224, 330, 1.25],
      [1212, 410, 0.9],
    ] as const
  )
    .map(
      ([x, y, s], i) =>
        `<g class="vh-fg" style="animation-delay:${f(i * 0.35)}s"><ellipse cx="${x}" cy="${f(y + 6)}" rx="${f(44 * s)}" ry="${f(18 * s)}" fill="url(#vh-gl)"/></g>` +
        `<path d="M${x} ${y}q${f(-26 * s)} ${f(-14 * s)} ${f(-46 * s)} ${f(4 * s)}q${f(22 * s)} ${f(8 * s)} ${f(46 * s)} ${f(2 * s)}Z" fill="#4a5a34"/>` +
        `<path d="M${f(x - 44 * s)} ${f(y + 4 * s)}q${f(22 * s)} ${f(8 * s)} ${f(44 * s)} ${f(2 * s)}" fill="none" stroke="#b8f08a" stroke-opacity=".5" stroke-width="2"/>`,
    )
    .join('')
  const bark = 'M1260 -10C1262 200 1250 400 1236 600M1330 -10C1326 220 1320 460 1310 700M1420 -10C1424 260 1430 520 1436 760M1500 -10C1506 240 1520 500 1540 700'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      // The firefly jar stands where the cup would, so the rig draws none.
      cup: 'none',
      thought: 'spores',
      ink: '#040a06',
      furniture: WOOD,
      metal: '#3c443a',
      paper: '#e4ecd0',
      light: { idle: '#6fbf5a', work: '#a8ec7a', bright: '#e2ffc0' },
      headTop: 205,
      glowAt: [350, 282],
      device,
      wear: {
        behind: leaf(204, 222, 40, 14, 40, MOSS_DARK),
        // A hood cut from one great leaf, its tip drooping back, with a moss trim around the face: the eyes sit well
        // inside it and the arms stay free. A firefly rests on the tip.
        front:
          '<path d="M70 320V262C70 238 82 222 100 214C80 206 56 194 38 168C70 178 104 194 136 202C192 204 230 224 230 266V320H212V268Q212 248 192 248H108Q88 248 88 268V320Z" fill="#356a30" stroke="#16301a" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M210 236C170 212 110 200 46 172M182 220l-4 -12M152 210l-6 -10M122 202l-6 -9M94 192l-5 -8M168 214l4 10M138 206l4 9M108 198l3 8" fill="none" stroke="#1a3a1c" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/>' +
          `<path d="M80 300V264C80 238 104 222 136 214" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".5" stroke-width="2.4"/>` +
          leaf(176, 208, 34, 12, 14, '#5a9a42') +
          leaf(198, 214, 28, 10, 46, '#4c8a3a') +
          `<path d="M88 320V268Q88 248 108 248H192Q212 248 212 268V320" fill="none" stroke="${MOSS_LIT}" stroke-width="5"/>` +
          '<path d="M88 320V268Q88 248 108 248H192Q212 248 212 268V320" fill="none" stroke="#8fcf62" stroke-opacity=".5" stroke-width="8" stroke-dasharray="0 9" stroke-linecap="round"/>' +
          '<path d="M74 318L80 334L86 318M214 318L220 334L226 318" fill="#356a30"/>' +
          '<circle class="vh-hf" cx="40" cy="166" r="9" fill="#d8ff8a" fill-opacity=".22"/><circle cx="40" cy="166" r="2.6" fill="#f0ffc0"/>',
      },
      // A mossy stump with its rings, a mushroom on its side and roots at its foot.
      seatArt:
        `<path d="M100 456C108 436 112 410 112 354H190C190 410 194 436 202 456Z" fill="#2c2015" stroke="#45331f" stroke-width="2"/>` +
        '<path d="M128 362V450M151 360V452M174 362V450" stroke="#1a130c" stroke-width="2.4"/>' +
        '<path d="M102 456C92 450 82 452 72 458H114ZM200 456C212 449 224 451 234 458H190Z" fill="#2c2015"/>' +
        '<ellipse cx="151" cy="354" rx="41" ry="7" fill="#5a4228"/><ellipse cx="151" cy="354" rx="27" ry="4.4" fill="none" stroke="#3a2a18" stroke-width="1.6"/>' +
        '<ellipse cx="151" cy="354" rx="12" ry="2" fill="none" stroke="#3a2a18" stroke-width="1.4"/>' +
        `<path d="M110 356Q114 372 122 362Q128 378 136 364L110 358ZM168 362Q176 376 182 364Q188 372 192 358Z" fill="${MOSS}"/>` +
        '<path d="M196 418V404" stroke="#d8d0b0" stroke-width="4"/><path d="M184 406Q196 388 208 406Z" fill="#b8eaa0"/><path d="M184 430V422" stroke="#d8d0b0" stroke-width="3"/><path d="M177 423Q184 413 191 423Z" fill="#9fd88a"/>',
      // A half-log desk with moss over its edge, on two roots.
      tableArt:
        `<path d="M200 352C204 380 194 400 198 428C200 442 192 452 186 456H216C210 444 214 430 214 410C214 390 222 372 220 352Z" fill="#2c2015"/>` +
        '<path d="M432 352C436 380 446 402 442 428C440 442 448 452 454 456H426C430 444 426 428 426 410C426 390 418 372 416 352Z" fill="#2c2015"/>' +
        `<path d="M166 330H470V336C470 348 462 354 450 354H186C174 354 166 348 166 336Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M168 331H468" stroke="#7a5f3e" stroke-width="2.4"/>' +
        '<ellipse cx="171" cy="342" rx="5" ry="11" fill="#5a4228"/><ellipse cx="171" cy="342" rx="2" ry="5" fill="none" stroke="#3a2a18"/>' +
        `<path d="M196 334H300Q296 346 290 340Q284 352 276 341Q268 350 262 340Q254 348 246 338Q236 350 228 339Q218 346 210 338Q202 344 196 334Z" fill="${MOSS}"/>` +
        `<path d="M196 334H300" stroke="${MOSS_LIT}" stroke-opacity=".7" stroke-width="2"/>`,
    },
    style:
      // Ambient: fireflies glow up and down slowly and wander; the fog drifts; the moss sways; the shafts breathe.
      '.vh-ffs circle{--b:3.1s;--x:22px;--y:-16px;animation:vh-bl var(--b) ease-in-out var(--d) infinite alternate,vh-dr calc(var(--b) * 3.6) ease-in-out calc(var(--d) * 2.3) infinite alternate}' +
      '.vh-ffs circle:nth-child(2n){--b:4.2s;--x:-26px}.vh-ffs circle:nth-child(3n){--b:2.4s;--y:17px}.vh-ffs circle:nth-child(5n){--b:3.7s;--x:12px;--y:-9px}' +
      '@keyframes vh-bl{0%,30%{opacity:.12}100%{opacity:1}}' +
      '@keyframes vh-dr{0%{transform:translate(0,0)}50%{transform:translate(var(--x),var(--y))}100%{transform:translate(calc(var(--x) * -.7),calc(var(--y) * .6))}}' +
      '.st-responding .vh-ffs circle{animation-duration:1.4s,calc(var(--b) * 3.6)}' +
      '.st-error .vh-ffs{animation:vh-dim .8s ease-out both}@keyframes vh-dim{to{opacity:.3}}' +
      '.st-done .vh-ffs{animation:vh-dim 1.6s ease-in both}' +
      // Each fog bank sets its own pace (--fd, --fl) and its run phase (--fr), chosen so none is faded out on entering run.
      '.vh-fd{animation:vh-fd var(--fd) ease-in-out var(--fl) infinite alternate}@keyframes vh-fd{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
      '.st-run .vh-fd{animation:vh-fdr 6s linear var(--fr) infinite}' +
      '@keyframes vh-fdr{0%{opacity:0;transform:translateX(160px)}20%,80%{opacity:1}100%{opacity:0;transform:translateX(-200px)}}' +
      '.vh-sway{transform-box:fill-box;transform-origin:50% 0;animation:vh-sway 7s ease-in-out infinite alternate}' +
      '@keyframes vh-sway{from{transform:skewX(-3deg)}to{transform:skewX(3deg)}}' +
      '.vh-fern{transform-box:fill-box;transform-origin:50% 100%;animation:vh-fern 6s ease-in-out infinite alternate}' +
      '@keyframes vh-fern{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}' +
      '.vh-shaft{animation:vh-shaft 11s ease-in-out infinite alternate}@keyframes vh-shaft{from{opacity:.55}to{opacity:1}}' +
      '.vh-mg{animation:vh-mg 5s ease-in-out infinite alternate}@keyframes vh-mg{from{opacity:.45}to{opacity:.9}}' +
      '.st-thinking .vh-mg{animation-duration:1.6s}' +
      '.vh-fg{animation:vh-mg 6s ease-in-out infinite alternate}' +
      '.st-tool .vh-fg{animation:vh-fgt 1.4s ease-in-out infinite}@keyframes vh-fgt{0%,100%{opacity:.35}40%{opacity:1}}' +
      '.st-done .vh-fg,.st-done .vh-mg{animation:vh-up 2s ease-out both}@keyframes vh-up{to{opacity:1}}' +
      '.vh-jf{animation:vh-bl 1.8s ease-in-out infinite alternate}' +
      '.vh-hf{animation:vh-mg 2.6s ease-in-out infinite alternate}' +
      // The guardian rests and breathes, looks about; its marks and heart glow faintly.
      '.vh-rise{transform:translateY(176px)}' +
      '.vh-st{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.12)}' +
      '.vh-lg{transform-box:fill-box;transform-origin:50% 0}' +
      '.vh-bob{animation:vh-breath 5s ease-in-out infinite alternate}@keyframes vh-breath{to{transform:translateY(3px)}}' +
      '.vh-hd{transform-origin:180px -366px;animation:vh-look 9s ease-in-out infinite alternate}' +
      '@keyframes vh-look{from{transform:rotate(-2deg)}to{transform:rotate(3deg)}}' +
      '.vh-eye{opacity:0}.st-thinking .vh-eye{animation:vh-half 1.4s ease-out both}@keyframes vh-half{to{opacity:.35}}' +
      '.vh-rune{opacity:.2}.vh-heart{opacity:.3}' +
      '.vh-pf{animation:vh-bl 2.6s ease-in-out infinite alternate}' +
      // Run: the guardian opens its eye, rises rear first, sheds moss, and walks slowly through the fog.
      '.st-run .vh-eye{animation:vh-on .6s ease-out .1s both}@keyframes vh-on{to{opacity:1}}' +
      '.st-run .vh-rune,.st-run .vh-heart{animation:vh-on 1.2s ease-out .3s both}' +
      '.st-run .vh-rise{animation:vh-rise 1.5s cubic-bezier(.4,0,.3,1) .15s both}' +
      // It stands 32px into the ground so its antler tips clear the top crop of a 16:9 window.
      '@keyframes vh-rise{0%{transform:translateY(176px)}40%{transform:translateY(124px) rotate(2.5deg)}100%{transform:translateY(32px)}}' +
      '.st-run .vh-st{animation:vh-stand 1.5s cubic-bezier(.4,0,.3,1) .15s both}@keyframes vh-stand{to{transform:scaleY(1)}}' +
      '.st-run .vh-bob{animation:vh-step .9s ease-in-out 1.65s infinite alternate}@keyframes vh-step{to{transform:translateY(-5px)}}' +
      '.st-run .vh-lgA{animation:vh-lgA 1.8s ease-in-out 1.65s infinite}.st-run .vh-lgB{animation:vh-lgB 1.8s ease-in-out 1.65s infinite}' +
      '@keyframes vh-lgA{0%,100%{transform:rotate(0)}25%{transform:rotate(-11deg)}75%{transform:rotate(11deg)}}' +
      '@keyframes vh-lgB{0%,100%{transform:rotate(0)}25%{transform:rotate(11deg)}75%{transform:rotate(-11deg)}}' +
      '.st-run .vh-walk{animation:vh-walk 12s cubic-bezier(.4,0,.6,1) 1.65s both}@keyframes vh-walk{to{transform:translateX(80px)}}' +
      '.st-run .vh-hd{animation:vh-nod 1.8s ease-in-out 1.65s infinite}@keyframes vh-nod{0%,100%{transform:rotate(0)}50%{transform:rotate(2.5deg)}}' +
      '.st-run .vh-pf{animation:vh-bl 2.6s ease-in-out infinite alternate,vh-flee 2.4s ease-in both}' +
      '@keyframes vh-flee{to{opacity:0;transform:translate(var(--x),var(--y))}}' +
      '.vh-deb,.vh-hdust{opacity:0}' +
      '.st-run .vh-deb{transform-box:fill-box;transform-origin:center;animation:vh-deb 1.5s ease-in both}' +
      '@keyframes vh-deb{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x),200px) rotate(160deg)}}' +
      '.st-run .vh-hdust{transform-box:fill-box;transform-origin:center;animation:vh-hdust 2s ease-out both}' +
      '@keyframes vh-hdust{0%{opacity:0;transform:scale(.4)}25%{opacity:.8}100%{opacity:0;transform:scale(1.8)}}' +
      // Error: the ground jolts, roots burst up, dirt flies and the stump topples.
      '.st-error .vh-quake{animation:vh-quake .18s linear 4}@keyframes vh-quake{25%{transform:translate(-3px,1px)}75%{transform:translate(3px,-1px)}}' +
      '.vh-root{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}' +
      '.st-error .vh-root{animation:vh-root .55s cubic-bezier(.3,1.5,.5,1) both}@keyframes vh-root{to{transform:scaleY(1)}}' +
      '.vh-stump{transform-box:fill-box;transform-origin:0 100%}' +
      '.st-error .vh-stump{animation:vh-topple 1.2s cubic-bezier(.5,0,.75,.6) .3s both}' +
      '@keyframes vh-topple{0%{transform:translate(0,0) rotate(0)}22%{transform:translate(4px,-20px) rotate(7deg)}82%{transform:translate(-4px,0) rotate(-88deg)}91%{transform:translate(-4px,-4px) rotate(-80deg)}100%{transform:translate(-4px,0) rotate(-86deg)}}' +
      '.vh-clod,.vh-dust{opacity:0}' +
      '.st-error .vh-clod{animation:vh-clod 1.3s cubic-bezier(.2,.6,.4,1) both}' +
      '@keyframes vh-clod{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}45%{transform:translate(var(--x),var(--y))}100%{opacity:0;transform:translate(calc(var(--x) * 1.5),20px)}}' +
      '.st-error .vh-dust{transform-box:fill-box;transform-origin:50% 100%;animation:vh-hdust 2.2s ease-out both}' +
      '.st-error .vh-owl{animation:vh-quake .2s linear 5}' +
      // The guardian startles: it lifts its chest, throws its head up and opens its eye.
      '.st-error .vh-rise{animation:vh-flinch 1s cubic-bezier(.3,1.3,.5,1) .15s both}' +
      '@keyframes vh-flinch{0%{transform:translateY(176px)}35%{transform:translateY(150px) rotate(-2deg)}100%{transform:translateY(162px) rotate(-1deg)}}' +
      '.st-error .vh-hd{animation:vh-start 1.1s cubic-bezier(.3,1.4,.5,1) .2s both}' +
      '@keyframes vh-start{30%{transform:rotate(-12deg)}100%{transform:rotate(-8deg)}}' +
      '.st-error .vh-eye{animation:vh-on .3s ease-out .2s both}' +
      // Done: the fireflies swirl into a spiral that slowly turns, its heart glowing.
      '.vh-sp circle{opacity:0}' +
      '.st-done .vh-sp circle{animation:vh-swarm 1.7s cubic-bezier(.2,.7,.3,1) var(--d) both,vh-tw 1.8s ease-in-out calc(var(--d) * 3 + 1.9s) infinite alternate}' +
      // Each fly starts three times as far out and a third of a turn back, so the swarm spirals in about the centre.
      '@keyframes vh-swarm{0%{opacity:0;transform:rotate(-150deg) scale(3)}25%{opacity:1}100%{opacity:1;transform:rotate(0) scale(1)}}' +
      '@keyframes vh-tw{from{opacity:1}to{opacity:.55}}' +
      '.st-done .vh-spin{animation:mv-spin 32s linear infinite}' +
      '.vh-core{opacity:0}.st-done .vh-core{animation:vh-core 2.2s ease-out .5s both}@keyframes vh-core{to{opacity:.7}}' +
      '.vh-trail{stroke-dasharray:1;stroke-dashoffset:1}.st-done .vh-trail{animation:vh-trail 2.2s ease-out .4s both}@keyframes vh-trail{to{stroke-dashoffset:0}}' +
      '.st-done .vh-eye{animation:vh-half 2.4s ease-out .8s both}' +
      // The owl blinks; it stares wide and tilts its head while Claude reads.
      '.vh-oe{transform-box:fill-box;transform-origin:center;animation:vh-blink 5.5s steps(1) infinite}' +
      '@keyframes vh-blink{0%,92%{transform:scaleY(1)}93%,98%{transform:scaleY(.12)}}' +
      '.vh-owl{transform-origin:300px -150px}' +
      '.st-read .vh-owl{animation:vh-tilt 2.4s ease-in-out infinite alternate}@keyframes vh-tilt{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}' +
      '.st-read .vh-oe{animation:vh-wide .5s ease-out both}@keyframes vh-wide{to{transform:scale(1.25)}}' +
      // Web: dew lights up along the spider web, one drop after another.
      '.vh-dew{opacity:.3}.st-web .vh-dew{animation:vh-dew 1.4s ease-in-out infinite}@keyframes vh-dew{0%,100%{opacity:.3}30%{opacity:1}}' +
      '.vh-web{opacity:.35}.st-web .vh-web{animation:vh-on 1s ease-out both}' +
      // The hermit's lantern, and the firefly on the hood.
      '.vh-lan{animation:vh-mg 4s ease-in-out infinite alternate}' +
      '.st-responding .vh-zip{animation:mv-spin 2.4s linear infinite}.vh-zip{animation:mv-spin 9s linear infinite}',
    scenery:
      '<defs>' +
      '<linearGradient id="vh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030806"/><stop offset=".4" stop-color="#07120b"/><stop offset=".75" stop-color="#0b1a10"/><stop offset="1" stop-color="#08130c"/></linearGradient>' +
      '<radialGradient id="vh-moon"><stop offset="0" stop-color="#cfeec4" stop-opacity=".2"/><stop offset="1" stop-color="#cfeec4" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="vh-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcf5c8" stop-opacity=".22"/><stop offset=".7" stop-color="#cdeeb8" stop-opacity=".07"/><stop offset="1" stop-color="#cdeeb8" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="vh-fog"><stop offset="0" stop-color="#b4d6bc" stop-opacity=".34"/><stop offset=".55" stop-color="#9cc6a6" stop-opacity=".14"/><stop offset="1" stop-color="#9cc6a6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="vh-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3a27" stop-opacity="0"/><stop offset=".6" stop-color="#1c3a27" stop-opacity=".6"/><stop offset="1" stop-color="#1c3a27" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="vh-ff"><stop offset="0" stop-color="#f6ffc8"/><stop offset=".2" stop-color="#e2ff8e" stop-opacity=".9"/><stop offset=".45" stop-color="#b8f060" stop-opacity=".22"/><stop offset="1" stop-color="#8edb6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vh-gl"><stop offset="0" stop-color="#b4f58a" stop-opacity=".5"/><stop offset="1" stop-color="#8edb6a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vh-eg"><stop offset="0" stop-color="#f0ffe0" stop-opacity=".8"/><stop offset=".3" stop-color="#b8f5a0" stop-opacity=".3"/><stop offset="1" stop-color="#b8f5a0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vh-back"><stop offset="0" stop-color="#7fb48a" stop-opacity=".26"/><stop offset="1" stop-color="#7fb48a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vh-du"><stop offset="0" stop-color="#9a8a6a" stop-opacity=".45"/><stop offset="1" stop-color="#9a8a6a" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#vh-sky)"/>' +
      '<circle cx="420" cy="0" r="420" fill="url(#vh-moon)"/>' +
      // The forest receding into the fog, layer by layer.
      `<path d="${trunks(16, -40, 1640, 14, 28, 690, 11)}" fill="#0f2317"/>` +
      '<rect y="430" width="1600" height="340" fill="url(#vh-band)"/>' +
      `<path d="${trunks(9, -40, 1640, 30, 56, 730, 12)}" fill="#0a1a10"/>` +
      `<path d="${trunks(3, 560, 1140, 80, 110, 790, 13)}" fill="#07110a"/>` +
      // Moonlight falls through the gap in the canopy onto the guardian.
      '<g class="vh-shaft"><path d="M322 20H362L120 820H20Z" fill="url(#vh-sh)"/><path d="M384 20H452L300 860H150Z" fill="url(#vh-sh)"/></g>' +
      '<g class="vh-shaft" style="animation-delay:-5s"><path d="M470 20H520L420 860H330Z" fill="url(#vh-sh)" fill-opacity=".8"/><path d="M290 20H306L40 700H0Z" fill="url(#vh-sh)"/></g>' +
      // The great tree at the right: the hermit's hollow opens in its foot.
      '<g class="mv-r">' +
      // Wide at the foot so the hollow's bark rim (in the nook, which rides up in wide windows) stays inside it.
      `<path d="M1250 -20C1242 180 1214 380 1186 520C1170 620 1156 760 1140 860C1126 920 1110 970 1096 1020H1660V-20Z" fill="${BARK}"/>` +
      `<path d="${bark}" fill="none" stroke="#070604" stroke-width="5"/>` +
      `<path d="${mossBand(RIGHT_EDGE, 1, 32)}" fill="${MOSS}" fill-opacity=".75"/>` +
      `<path d="M1246 -20C1238 180 1210 380 1182 520C1166 620 1152 760 1136 860" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".3" stroke-width="3" stroke-dasharray="150 70 100 130" stroke-linecap="round"/>` +
      `<path d="M1250 120C1150 96 1020 100 880 70C820 58 760 64 700 40" fill="none" stroke="${BARK}" stroke-width="30" stroke-linecap="round"/>` +
      `<path d="M1250 110C1150 86 1020 90 880 60C820 48 760 54 700 30" fill="none" stroke="${MOSS}" stroke-opacity=".8" stroke-width="7" stroke-linecap="round"/>` +
      fungi +
      '</g>' +
      // The canopy over everything, with its moon gap.
      '<g class="mv-t">' +
      `<path d="${canopy(21, 70, 70)}" fill="#07120a"/>` +
      `<path d="${canopy(22, 40, 50)}" fill="#030805"/>` +
      '</g>' +
      // The ground, the old tree at the far left, the guardian, and the foreground.
      '<g class="mv-b"><g class="vh-quake">' +
      '<path d="M-40 1000V800C300 788 600 812 900 800C1200 790 1400 812 1640 800V1000Z" fill="#07100a"/>' +
      '<path d="M-40 800C300 788 600 812 900 800C1200 790 1400 812 1640 800" fill="none" stroke="#1f3a22" stroke-width="2"/>' +
      '<ellipse cx="300" cy="560" rx="340" ry="300" fill="url(#vh-back)"/>' +
      `<g class="vh-fd" style="--fd:44s;--fl:0s;--fr:-1.5s"><ellipse cx="260" cy="680" rx="420" ry="70" fill="url(#vh-fog)"/></g>` +
      `<path d="M-90 -20H64C72 140 66 320 76 480C84 600 92 680 120 724C150 750 200 748 240 752L-90 800Z" fill="#0b130d"/>` +
      `<path d="M10 -20C16 200 12 420 24 640M40 -20C46 180 44 380 52 600" fill="none" stroke="#050906" stroke-width="5"/>` +
      `<path d="${mossBand(LEFT_EDGE, -1, 31)}" fill="${MOSS}" fill-opacity=".75"/>` +
      `<path d="M66 -20C74 140 68 320 78 480C86 600 92 660 106 700" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="140 60 90 120" stroke-linecap="round"/>` +
      `<g transform="translate(150 776)">${guardian()}</g>` +
      shed +
      hoofDust +
      // The roots in front of the guardian's hooves, ferns, and fog over them.
      '<path d="M-40 1000V770C40 748 120 758 200 762C280 766 360 750 440 760C500 768 540 784 600 796C630 804 650 820 660 1000Z" fill="#060d08"/>' +
      `<path d="M-40 770C40 748 120 758 200 762C280 766 360 750 440 760C500 768 540 784 600 796" fill="none" stroke="${MOSS}" stroke-width="5"/>` +
      `<path d="M-40 768C40 746 120 756 200 760C280 764 360 748 440 758" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".35" stroke-width="2"/>` +
      ferns(
        [
          [70, 774, 70, -30, 0.3],
          [96, 776, 60, 18, -0.3],
          [250, 768, 64, -22, 0.25],
          [276, 770, 54, 26, -0.2],
          [452, 770, 58, -14, 0.3],
        ],
        'vh-fern',
      ) +
      `<g class="vh-fd" style="--fd:36s;--fl:-12s;--fr:-4s"><ellipse cx="200" cy="770" rx="400" ry="54" fill="url(#vh-fog)"/></g>` +
      `<g class="vh-fd" style="--fd:52s;--fl:-30s;--fr:-3s"><ellipse cx="820" cy="800" rx="460" ry="50" fill="url(#vh-fog)" fill-opacity=".55"/></g>` +
      mushroom(104, 786, 1, 0) +
      mushroom(122, 790, 0.7, -2) +
      mushroom(480, 930, 0.9, -1) +
      mushroom(500, 934, 0.6, -3) +
      // The stump the roots topple.
      `<g fill="#2e2116" stroke="#7a5f3e" stroke-width="2.4">${roots}</g>` +
      '<g class="vh-stump">' +
      '<path d="M282 932C290 910 292 880 294 842H388C390 880 392 910 400 932Z" fill="#2a1f14" stroke="#45331f" stroke-width="2"/>' +
      '<path d="M312 850V926M340 848V928M366 850V926" stroke="#170f09" stroke-width="2.6"/>' +
      '<ellipse cx="341" cy="842" rx="47" ry="9" fill="#5a4228"/><ellipse cx="341" cy="842" rx="30" ry="5.4" fill="none" stroke="#3a2a18" stroke-width="1.8"/>' +
      `<path d="M294 844Q300 862 308 850Q316 868 324 852Q332 862 338 850L300 842ZM354 848Q362 866 370 852Q378 862 388 844Z" fill="${MOSS}"/>` +
      mushroom(322, 840, 0.9, -1.5) +
      mushroom(352, 838, 0.7, -2.5) +
      '</g>' +
      `<g fill="#2c2015">${clods}</g>` +
      dust +
      ferns(
        [
          [24, 1004, 110, -24, 0.35],
          [70, 1006, 96, 6, -0.25],
          [150, 1004, 80, 28, -0.3],
          [210, 1006, 70, -8, 0.3],
          [560, 1008, 60, 20, -0.25],
        ],
        'vh-fern',
      ) +
      '</g></g>' +
      // Hanging moss under the canopy.
      '<g class="mv-t">' +
      `<g class="vh-sway"><path d="${leftMoss}" fill="none" stroke="#284a2a" stroke-width="2.6"/></g>` +
      `<g class="vh-sway" style="animation-delay:-3s"><path d="${midMoss}" fill="none" stroke="#1d3820" stroke-width="2.2"/></g>` +
      `<g class="mv-r"><g class="vh-sway" style="animation-delay:-5s"><path d="${rightMoss}" fill="none" stroke="#284a2a" stroke-width="2.6"/></g></g>` +
      '</g>' +
      // The fireflies.
      `<g class="vh-ffs" fill="url(#vh-ff)">${flies}</g>` +
      '<g transform="translate(250 250)">' +
      '<circle class="vh-core" r="110" fill="url(#vh-gl)"/>' +
      `<g class="vh-spin"><g fill="none" stroke="#d8ff8a" stroke-opacity=".28" stroke-width="3" stroke-linecap="round">${trails}</g>` +
      `<g class="vh-sp" fill="url(#vh-ff)">${spiral}</g></g></g>`,
    nook:
      '<defs><radialGradient id="vh-in" cx=".55" cy=".6" r=".7"><stop offset="0" stop-color="#22170d"/><stop offset="1" stop-color="#0b0705"/></radialGradient>' +
      '<radialGradient id="vh-lt"><stop offset="0" stop-color="#e8ff9a" stop-opacity=".36"/><stop offset="1" stop-color="#e8ff9a" stop-opacity="0"/></radialGradient></defs>' +
      // The owl in a knothole above the hollow.
      '<ellipse cx="300" cy="-196" rx="38" ry="48" fill="#050302" stroke="#241a10" stroke-width="9"/>' +
      `<path d="M262 -236Q300 -262 338 -236" fill="none" stroke="${MOSS}" stroke-width="8" stroke-linecap="round"/>` +
      '<g class="vh-owl">' +
      '<path d="M272 -150C268 -186 278 -216 300 -218C322 -216 332 -186 328 -150Z" fill="#4a3c28"/>' +
      '<path d="M280 -212L276 -228L290 -216ZM320 -212L324 -228L310 -216Z" fill="#4a3c28"/>' +
      '<circle cx="290" cy="-196" r="11" fill="#6a5638"/><circle cx="310" cy="-196" r="11" fill="#6a5638"/>' +
      '<g class="vh-oe"><circle cx="290" cy="-196" r="6.4" fill="#f0d878"/><circle cx="290" cy="-196" r="3" fill="#140c04"/></g>' +
      '<g class="vh-oe"><circle cx="310" cy="-196" r="6.4" fill="#f0d878"/><circle cx="310" cy="-196" r="3" fill="#140c04"/></g>' +
      '<path d="M296 -186L300 -178L304 -186Z" fill="#c8a050"/>' +
      '<path d="M286 -168q4 4 8 0M300 -168q4 4 8 0M292 -160q4 4 8 0" fill="none" stroke="#2a2014" stroke-width="1.6"/>' +
      '</g>' +
      // The hollow: its dark warm inside, the grain of the wood, the bark lip with moss over it.
      '<path d="M14 470L16 118C20 -24 120 -84 234 -84C350 -84 432 -16 438 112L442 470Z" fill="url(#vh-in)"/>' +
      '<path d="M70 470C64 300 76 120 120 20M150 470C146 330 150 160 180 -40M330 470C336 320 344 170 320 -50M400 470C404 340 410 200 404 40" fill="none" stroke="#2a1b10" stroke-opacity=".7" stroke-width="2.4"/>' +
      '<ellipse cx="120" cy="180" rx="10" ry="16" fill="none" stroke="#2a1b10" stroke-width="2.4"/>' +
      // The shelf with jars and books, the drying herbs, the lantern.
      `<rect x="262" y="64" width="160" height="9" rx="2" fill="${WOOD}"/><path d="M276 73L284 88M406 73L398 88" stroke="${WOOD}" stroke-width="4"/>` +
      '<rect x="274" y="34" width="20" height="30" rx="5" fill="#8edb6a" fill-opacity=".14" stroke="#9fb89a" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<rect x="300" y="44" width="16" height="20" rx="4" fill="#c8a060" fill-opacity=".2" stroke="#9fb89a" stroke-opacity=".45" stroke-width="1.6"/>' +
      '<g fill="#4a3424"><rect x="340" y="40" width="10" height="24"/><rect x="351" y="36" width="9" height="28" fill="#2f4a2a"/><rect x="361" y="44" width="11" height="20" fill="#5a3a2a"/></g>' +
      '<rect x="380" y="56" width="34" height="8" rx="2" fill="#3a2e1c"/>' +
      '<path d="M40 -10Q120 10 210 -22" fill="none" stroke="#6a5236" stroke-width="1.6"/>' +
      '<g fill="#4a6a32"><path d="M70 -2l-6 26h12Z"/><path d="M110 6l-5 30h10Z" fill="#6a7a3a"/><path d="M150 2l-6 24h12Z"/><path d="M186 -10l-5 22h10Z" fill="#5a6a30"/></g>' +
      '<path d="M100 -64V20" stroke="#3a2a1a" stroke-width="2"/>' +
      '<circle class="vh-lan" cx="100" cy="44" r="70" fill="url(#vh-lt)"/>' +
      '<path d="M88 22H112V30H88Z" fill="#5a4228"/><path d="M88 30H112V62Q112 68 106 68H94Q88 68 88 62Z" fill="#cfe8a0" fill-opacity=".14" stroke="#a8c4a0" stroke-opacity=".6" stroke-width="1.6"/>' +
      '<g transform="translate(100 46)"><g class="vh-zip"><circle cx="5" cy="0" r="2.4" fill="#eeffa8"/><circle cx="-4" cy="6" r="2" fill="#eeffa8" fill-opacity=".8"/></g></g>' +
      // The spider web in the arch's corner, beaded with dew.
      '<g class="vh-web" fill="none" stroke="#d6e8cc" stroke-width="1.1"><path d="M392 6L350 -46M392 6L392 -62M392 6L430 -30M392 6L440 30M392 6L432 72M392 6L380 70M392 6L346 40"/>' +
      '<path d="M380 -8L392 -14L404 -6L408 10L402 22L388 24L378 14ZM366 -24L392 -34L418 -16L424 14L414 40L384 44L364 26ZM356 -38L392 -50L426 -26L434 22L422 56L382 60L352 34Z"/></g>' +
      [
        [370, -26],
        [392, -34],
        [418, -16],
        [424, 14],
        [414, 40],
        [384, 44],
      ]
        .map(([x, y], i) => `<circle class="vh-dew" style="animation-delay:${f(i * 0.2)}s" cx="${x}" cy="${y}" r="2.4" fill="#e8ffd8"/>`)
        .join('') +
      // The bark lip of the hollow and the moss on it.
      '<path d="M14 470L16 118C20 -24 120 -84 234 -84C350 -84 432 -16 438 112L442 470" fill="none" stroke="#1c140c" stroke-width="26"/>' +
      '<path d="M14 470L16 118C20 -24 120 -84 234 -84C350 -84 432 -16 438 112L442 470" fill="none" stroke="#3e2e1e" stroke-width="3"/>' +
      `<path d="M18 160C22 -20 120 -86 234 -86C350 -86 430 -22 436 130" fill="none" stroke="${MOSS}" stroke-width="12" stroke-linecap="round"/>` +
      '<path d="M18 160C22 -20 120 -86 234 -86C350 -86 430 -22 436 130" fill="none" stroke="#6aa84f" stroke-opacity=".5" stroke-width="9" stroke-dasharray="26 10 12 16 34 12" stroke-linecap="round"/>' +
      `<g class="vh-sway"><path d="${strands(8, [
        [60, -40, 50],
        [96, -64, 40],
        [150, -78, 56],
        [206, -82, 36],
        [262, -82, 50],
        [318, -72, 34],
        [40, 20, 60],
      ])}" fill="none" stroke="${MOSS_LIT}" stroke-opacity=".6" stroke-width="2.4"/></g>` +
      // The floor of the hollow: moss and roots.
      '<path d="M14 448C80 440 160 452 240 446C320 440 400 450 442 446V470H14Z" fill="#0d1a0e"/>' +
      `<path d="M14 448C80 440 160 452 240 446C320 440 400 450 442 446" fill="none" stroke="${MOSS}" stroke-width="4"/>`,
    front:
      // A root breaks up through the floor of the hollow on an error; ferns at the lip.
      '<g fill="#2a1e14" stroke="#4a3824" stroke-width="2">' +
      '<path class="vh-root" style="animation-delay:.1s" d="M14 460C12 420 24 380 40 352C46 380 40 420 44 460Z"/>' +
      '<path class="vh-root" style="animation-delay:.22s" d="M300 460C298 430 308 400 326 380C330 404 320 432 326 460Z"/></g>' +
      ferns(
        [
          [10, 462, 60, -10, 0.35],
          [36, 464, 44, 22, -0.3],
        ],
        'vh-fern',
      ),
  }
}
