import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Spirit Forest: a lantern keeper in a woven hat at a wooden desk deep in a bamboo forest at night. Mist drifts
// between the stalks, paper lanterns hang from bamboo poles along a stone path, and pale spirit wisps float among
// them with the fireflies. A command sends a procession of floating lanterns and spirits flowing up through the
// forest, across its crown and down the far side; an error is a gust that bends the bamboo and blows every lantern
// out; done brings a great fox-like spirit drawn in light, its tail curled around the forest, and the lanterns relight.
const MINT = '#a8f0d8'
const PALE = '#e8fff5'
const PAPER = '#efe6c8'
const WOOD = '#2a2318'
const WOOD_EDGE = '#46392a'
const CANE = '#1f3528'
const CANE_LIT = '#41695a'
const STRAW = '#9c8554'
const BAMBOO = '#2f3d27'

type Pt = readonly [number, number]

/** Points along a smooth curve through `points` (Catmull-Rom), `per` samples per span. */
function spline(points: readonly Pt[], per: number): Pt[] {
  const at = (i: number): Pt => points[Math.max(0, Math.min(points.length - 1, i))]!
  const out: Pt[] = []

  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)]

    for (let s = 0; s < per; s += 1) {
      const t = s / per
      const k = (p: number, q: number, r: number, u: number) =>
        0.5 * (2 * q + (r - p) * t + (2 * p - 5 * q + 4 * r - u) * t * t + (3 * q - p - 3 * r + u) * t * t * t)

      out.push([k(a[0], b[0], c[0], d[0]), k(a[1], b[1], c[1], d[1])])
    }
  }

  out.push(at(points.length - 1))

  return out
}

const r0 = (v: number) => String(Math.round(v))
const line = (points: readonly Pt[]) => 'M' + points.map(([x, y]) => `${r0(x)} ${r0(y)}`).join('L')

/** The same Catmull-Rom curve through `points` as `spline`, written exactly as one cubic per span. */
function curve(points: readonly Pt[]): string {
  const at = (i: number): Pt => points[Math.max(0, Math.min(points.length - 1, i))]!
  const xy = (x: number, y: number) => `${r0(x)} ${r0(y)}`
  let d = 'M' + xy(...at(0))

  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, e] = [at(i - 1), at(i), at(i + 1), at(i + 2)]

    d += `C${xy(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6)} ${xy(c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6)} ${xy(...c)}`
  }

  return d
}

/** A bamboo leaf from (x, y) toward angle `a`, `l` long and `w` wide at its middle, as path data. */
function leaf(x: number, y: number, a: number, l: number, w: number): string {
  const [c, s] = [Math.cos(a), Math.sin(a)]
  const [mx, my] = [x + c * l * 0.45, y + s * l * 0.45]

  return `M${r0(x)} ${r0(y)}Q${r0(mx - s * w)} ${r0(my + c * w)} ${r0(x + c * l)} ${r0(y + s * l)}Q${r0(mx + s * w)} ${r0(my - c * w)} ${r0(x)} ${r0(y)}Z`
}

type Stalk = readonly [x: number, w: number, lean: number]
type Look = { fill: string; node: string; rim: string; rimOpacity: number; leaf: string; size: number; leafy: number; step?: number }

/** A stand of bamboo rooted below the picture: the canes, their node rings, a moonlit rim and sprays of leaves. */
function grove(stalks: readonly Stalk[], seed: number, look: Look): string {
  const next = random(seed)
  const top = -40
  const base = 1010
  let bodies = ''
  let nodes = ''
  let rims = ''
  let leaves = ''

  for (const [x, w, lean] of stalks) {
    const xAt = (y: number) => x + (lean * (base - y)) / (base - top)

    bodies += `M${r0(x)} ${base}L${r0(x + lean)} ${top}h${r0(w)}L${r0(x + w)} ${base}Z`
    rims += `M${r0(x + 1.5)} ${base}L${r0(x + lean + 1.5)} ${top}`

    for (let y = 40 + next() * 90; y < 980; y += (look.step ?? 110) + next() * 70) {
      const at = xAt(y)

      nodes += `M${f(at - 1.5)} ${r0(y)}h${f(w + 3)}`

      if (next() < look.leafy) {
        const right = next() < 0.5

        for (let k = 0; k < 3; k += 1) {
          const a = 0.3 + k * 0.4 + next() * 0.2

          leaves += leaf(right ? at + w : at, y + 2, right ? a : Math.PI - a, look.size * (0.7 + next() * 0.6), look.size * 0.13)
        }
      }
    }
  }

  return (
    `<path d="${bodies}" fill="${look.fill}"/>` +
    `<path d="${nodes}" fill="none" stroke="${look.node}" stroke-width="3"/>` +
    (look.rimOpacity > 0 ? `<path d="${rims}" fill="none" stroke="${look.rim}" stroke-opacity="${look.rimOpacity}" stroke-width="2"/>` : '') +
    (leaves === '' ? '' : `<path d="${leaves}" fill="${look.leaf}"/>`)
  )
}

/**
 * A round paper lantern hanging from (x, y), `k` its place in the wave of light: halo, glowing paper, dark caps and
 * ribs, the shade that falls over it when it blows out, and the smoke that rises after.
 */
function lantern(x: number, y: number, s: number, k: number, smoke = true): string {
  return (
    `<g transform="translate(${r0(x)} ${r0(y)}) scale(${s})"><g class="sp-ls" style="--k:${k}">` +
    '<circle class="sp-hl" cy="34" r="70" fill="url(#sp-lh)"/>' +
    (smoke ? '<path class="sp-smk" d="M0 4c-7-9 6-15 0-24s5-14 1-22" fill="none" stroke="#9fb5ac" stroke-width="2.4" stroke-linecap="round"/>' : '') +
    '<ellipse cy="34" rx="20" ry="24" fill="url(#sp-lb)"/>' +
    `<path d="M-1 0h2v9h-2zM-9 8h18v5h-18zM-9 55h18v5h-18zM-1.5 60h3v7h-3zM-4 67h8l-1 10h-6z" fill="${WOOD}"/>` +
    '<ellipse class="sp-dk" cy="34" rx="20.5" ry="24.5" fill="#0e130f"/></g></g>'
  )
}

/** A lantern floating free, centered on its origin, for the procession. */
const FLOAT =
  '<circle r="54" fill="url(#sp-lh)"/><ellipse rx="17" ry="20" fill="url(#sp-lb)"/>' +
  `<path d="M-8-24h16v5h-16zM-8 19h16v5h-16zM-1.5 24h3v9h-3z" fill="${WOOD}"/>`

/** A spirit wisp: a soft wide halo, a pale flame whose tapering tail curls over at its tip, a bright core. */
const FLAME =
  '<circle r="42" fill="url(#sp-wh)"/>' +
  '<path class="sp-tl" d="M9 0A9 9 0 1 1-9 0C-10-9-5-18-5-27C-5-33-8-38-12-38C-16-38-19-36-21-33C-23-38-20-45-13-46C-6-47 2-41 2-30C2-18 10-10 9 0Z" fill="url(#sp-wf)"/>'
const WISP = FLAME + '<circle r="4" fill="#f6fffb"/>'

function wisp(x: number, y: number, s: number, next: () => number): string {
  const d = () => r0((next() - 0.5) * 90)

  return (
    `<g transform="translate(${r0(x)} ${r0(y)}) scale(${s})"><g class="sp-wd" style="--ax:${d()}px;--ay:${d()}px;--bx:${d()}px;--by:${d()}px;` +
    `--t:${f(10 + next() * 8)}s;animation-delay:${f(-next() * 12)}s">${WISP}</g></g>`
  )
}

function fireflies(count: number, box: readonly [number, number, number, number], next: () => number): string {
  const [x0, y0, w, h] = box

  return Array.from(
    { length: count },
    () =>
      `<circle class="sp-ff" style="--fx:${r0((next() - 0.5) * 50)}px;--fy:${r0((next() - 0.5) * 40)}px;--t:${f(2.6 + next() * 2.6)}s;` +
      `animation-delay:${f(-next() * 5)}s" cx="${r0(x0 + next() * w)}" cy="${r0(y0 + next() * h)}" r="${f(1.5 + next() * 1.2)}"/>`,
  ).join('')
}

// The procession's route: up out of the forest floor at the left, over the crown of the forest and down the far
// side. Where it crosses above the chat column it dims, as if behind the canopy.
const ROUTE: readonly Pt[] = [
  [-90, 930], [110, 820], [250, 660], [320, 480], [350, 310], [430, 160], [600, 60], [800, 22], [1000, 30],
  [1190, 90], [1360, 190], [1480, 330], [1560, 470], [1700, 560],
]

function procession(next: () => number): { keys: string; trail: string; body: string } {
  const points = spline(ROUTE, 2)
  const lengths = [0]

  for (let i = 1; i < points.length; i += 1) {
    lengths.push(lengths[i - 1]! + Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]))
  }

  const total = lengths[lengths.length - 1]!
  const keys = points
    .map(([x, y], i) => {
      const clear = Math.max(0, Math.min(1, (Math.abs(x - 800) - 280) / 140))
      const o = i === 0 || i === points.length - 1 ? 0 : 0.28 + 0.72 * clear

      return `${f((lengths[i]! / total) * 100)}%{transform:translate(${r0(x)}px,${r0(y)}px) scale(${(0.62 + (0.5 * y) / 900).toFixed(2)});opacity:${o.toFixed(2)}}`
    })
    .join('')
  const trail = curve(ROUTE)
  const item = (seconds: number, at: number, inner: string) =>
    `<g class="sp-pe" style="animation-duration:${seconds}s;animation-delay:${f(-at)}s">` +
    `<g transform="translate(${r0((next() - 0.5) * 70)} ${r0((next() - 0.5) * 60)}) scale(${(0.75 + next() * 0.45).toFixed(2)})">${inner}</g></g>`
  const lanterns = Array.from({ length: 8 }, (_, i) => item(18, (i + next() * 0.4) * 2.25, FLOAT)).join('')
  const wisps = Array.from({ length: 9 }, (_, i) => item(12, (i + next() * 0.5) * 1.33, FLAME)).join('')

  return {
    keys: `@keyframes sp-pr{${keys}}`,
    trail:
      `<path class="sp-rib" pathLength="1" d="${trail}" fill="none" stroke="url(#sp-rg)" stroke-opacity=".12" stroke-width="54" stroke-linecap="round"/>` +
      `<path class="sp-rib" pathLength="1" d="${trail}" fill="none" stroke="url(#sp-rp)" stroke-opacity=".5" stroke-width="2.4"/>`,
    body: wisps + lanterns,
  }
}

// The great spirit: a fox-like shape sitting among the stalks at the left, facing the desk, made only of light.
const FOX =
  'M452 302C440 288 418 280 400 264L378 162L352 226L320 172L306 240C270 268 240 330 214 410C186 490 130 560 118 680' +
  'C108 780 126 860 170 896L366 898C358 820 350 720 362 600C372 500 404 420 428 360C440 332 452 318 452 302Z'
const FOX_MARKS =
  'M372 282Q387 268 402 282M452 304Q432 304 416 296M372 184L366 222M322 192L318 226M424 318L408 326L418 334L398 344M402 410l-14 16l16-2' +
  'M392 460l-14 16l16-2M206 770c-34-10-40-60-6-76c30-14 54 14 40 38c-10 16-32 12-32-4M270 896C262 850 230 820 196 806' +
  'M330 898C326 820 322 740 334 650'
// Its tail curls from behind it up the left edge, along the crown of the forest and down the far side.
const TAIL: readonly Pt[] = [
  [160, 884], [64, 862], [14, 730], [22, 530], [70, 330], [170, 170], [330, 64], [560, 8], [820, -6], [1080, 10],
  [1290, 76], [1430, 186], [1490, 320], [1468, 436], [1410, 474], [1372, 446],
]

function tail(): { shape: string; strands: string } {
  const spine = spline(TAIL, 3)
  const n = spine.length
  const left: Pt[] = []
  const right: Pt[] = []
  const inner: Pt[] = []

  spine.forEach(([x, y], i) => {
    const t = i / (n - 1)
    const [ax, ay] = spine[Math.max(0, i - 1)]!
    const [bx, by] = spine[Math.min(n - 1, i + 1)]!
    const length = Math.hypot(bx - ax, by - ay) || 1
    const [nx, ny] = [-(by - ay) / length, (bx - ax) / length]
    const half = (t < 0.16 ? 60 + (t / 0.16) * 100 : 160 * Math.pow(1 - (t - 0.16) / 0.84, 0.85) + 3) / 2

    left.push([x + nx * half, y + ny * half])
    right.push([x - nx * half, y - ny * half])
    inner.push([x + nx * half * 0.45, y + ny * half * 0.45])
  })

  return {
    shape: line(left) + 'L' + line([...right].reverse()).slice(1) + 'Z',
    strands: line(inner.slice(2, -3)),
  }
}

/** The keeper's laptop in a split-bamboo frame, its own little lantern on a stand and a pot of brushes. */
function device(light: string, activity: Activity): string {
  const out = activity === 'error'
  const glow = activity === 'done' ? 0.3 : 0.18
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<rect x="244" y="323" width="96" height="7" rx="2" fill="${BAMBOO}"/>` +
    keys +
    `<path d="M332 328L357 238L367 240L342 330Z" fill="${BAMBOO}"/>` +
    `<path d="M334 325L358 242L362 243L338 327Z" fill="${light}"/>` +
    `<path d="M334 325L358 242L345 246L325 325Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M270 323v7M308 323v7M339 306l9 2.4M345 282l9 2.4M352 258l9 2.4" stroke="#56693f" stroke-width="1.6"/>' +
    // The lantern on its stand: lit, out with a curl of smoke after an error, rising off the desk while a command runs.
    `<path d="M396 330V262Q396 254 382 256" fill="none" stroke="${WOOD_EDGE}" stroke-width="3"/><rect x="384" y="326" width="24" height="4" rx="2" fill="${WOOD_EDGE}"/>` +
    (out
      ? ''
      : `<g class="sp-dl"><circle cx="380" cy="292" r="40" fill="${MINT}" fill-opacity="${glow / 2}"/><circle cx="380" cy="292" r="24" fill="${MINT}" fill-opacity="${glow}"/></g>`) +
    `<path d="M380 256v16" stroke="${WOOD}" stroke-width="2"/>` +
    `<ellipse cx="380" cy="292" rx="14" ry="17" fill="${out ? '#3a3a2c' : PAPER}"/>` +
    `<path d="M373 272h14v4h-14zM373 308h14v4h-14z" fill="${WOOD}"/>` +
    '<path d="M367 284h26M366 292h28M367 300h26" stroke="#8a7a52" stroke-opacity=".45" stroke-width="1.2"/>' +
    (out ? '<path class="sp-ds" d="M380 268c-6-10 6-16 0-26s6-14 0-24" fill="none" stroke="#9fb5ac" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>' : '') +
    (activity === 'run'
      ? `<g class="sp-rise"><circle cx="380" cy="236" r="22" fill="${MINT}" fill-opacity=".22"/><ellipse cx="380" cy="236" rx="9" ry="11" fill="${PAPER}"/>` +
        `<path d="M375 223h10v3h-10zM375 246h10v3h-10z" fill="${WOOD}"/></g>`
      : '') +
    `<rect x="444" y="308" width="13" height="22" rx="3" fill="${BAMBOO}"/><path d="M447 308l-5-22M452 308l3-24" stroke="#6a5436" stroke-width="2.4" stroke-linecap="round"/>`
  )
}

/** An unlit spare lantern resting on the ground, which lights when the work is done. */
function spare(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><circle class="sp-sp" r="54" fill="url(#sp-lh)"/>` +
    `<ellipse rx="20" ry="24" fill="${PAPER}" fill-opacity=".22"/><ellipse class="sp-sp" rx="20" ry="24" fill="url(#sp-lb)"/>` +
    `<path d="M-9-26h18v5h-18zM-9 21h18v5h-18z" fill="${WOOD}"/></g>`
  )
}

export function spiritForestWorld(): World {
  const next = random(41)
  const march = procession(random(7))
  const fox = tail()
  const far = grove(
    Array.from({ length: 22 }, (_, i): Stalk => [i * 76 - 20 + next() * 36, 5 + next() * 5, (next() - 0.5) * 40]),
    3,
    { fill: '#0f241d', node: '#1a3a2f', rim: MINT, rimOpacity: 0, leaf: '#0f241d', size: 24, leafy: 0, step: 190 },
  )
  const mid = { fill: '#08130f', node: '#1b3529', rim: MINT, rimOpacity: 0.11, leaf: '#0a1a14', size: 42, leafy: 0.3 }
  const midLeft = grove(
    [[18, 16, 8], [96, 20, -6], [172, 14, 10], [236, 18, -4], [292, 13, 6], [352, 17, -8], [404, 12, 4]],
    5,
    mid,
  )
  const midRight = grove([[1200, 13, -6], [1258, 18, 8], [1322, 15, -4], [1386, 20, 6], [1452, 16, -8], [1512, 14, 4]], 9, mid)
  const near = { fill: '#030806', node: '#13281f', rim: MINT, rimOpacity: 0.16, leaf: '#040b08', size: 64, leafy: 0.45 }
  const nearLeft = grove([[-14, 44, 6], [50, 28, -12]], 11, near)
  const nearRight = grove([[1550, 50, -10]], 13, near)
  const canopy = Array.from({ length: 12 }, (_, i) => {
    const [x, y] = [i * 140 - 20 + next() * 80, -6 + next() * 30]

    return Array.from({ length: 4 }, (_, k) => leaf(x, y, Math.PI / 2 + (k - 1.5) * 0.42 + (next() - 0.5) * 0.2, 50 + next() * 50, 8 + next() * 3)).join('')
  }).join('')
  // The lanterns on their poles along the stone path, nearest first.
  const poles: [number, number, number, number, number][] = [
    [60, 990, 330, 118, 1.3],
    [212, 905, 410, 252, 1],
    [302, 845, 470, 332, 0.78],
    [366, 800, 520, 390, 0.6],
  ]
  const poleArt = poles
    .map(([x, base, top, hook, s]) => {
      const w = 8 * s

      return (
        `<path d="M${x} ${base}V${top}" stroke="${CANE}" stroke-width="${f(w)}"/>` +
        `<path d="M${x} ${top + 6}Q${f((x + hook) / 2)} ${f(top - 12 * s)} ${hook} ${top + 4}" fill="none" stroke="${CANE}" stroke-width="${f(w * 0.6)}" stroke-linecap="round"/>` +
        `<path d="M${f(x - w / 2 - 1)} ${top + 90}h${f(w + 2)}M${f(x - w / 2 - 1)} ${top + 210}h${f(w + 2)}" stroke="${CANE_LIT}" stroke-width="2"/>`
      )
    })
    .join('')
  const poleLanterns = poles.map(([, , top, hook, s], i) => lantern(hook, top + 4, s, i + 1)).join('')
  const pools = poles
    .map(([, base, , hook, s], i) => `<ellipse class="sp-hl" style="--k:${i + 1}" cx="${hook}" cy="${r0(base - 6)}" rx="${r0(90 * s)}" ry="${r0(16 * s)}" fill="url(#sp-lh)"/>`)
    .join('')
  const stones = [
    [150, 972, 50, 12], [262, 900, 38, 9], [334, 846, 29, 7], [388, 803, 22, 5], [424, 772, 15, 4],
  ]
    .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`)
    .join('')
  // Small lanterns strung on ropes across the top corners.
  const rope = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, at: readonly number[], k0: number) =>
    `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="#1a2a22" stroke-width="2.4"/>` +
    at
      .map((t, i) => {
        const u = 1 - t

        return lantern(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1, 0.5, k0 + i, false)
      })
      .join('')
  const wispsLeft = [[70, 300, 1.3], [210, 220, 1], [370, 400, 1.15], [150, 640, 1.4], [300, 730, 1.1]]
    .map(([x, y, s]) => wisp(x!, y!, s!, next))
    .join('')
  const wispsRight = [[1260, 330, 1.15], [1430, 210, 1], [1540, 430, 1.3]].map(([x, y, s]) => wisp(x!, y!, s!, next)).join('')
  const glints = (at: readonly (readonly [number, number])[]) =>
    at.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="url(#sp-lh)"/><circle cx="${x}" cy="${y}" r="1.8" fill="${PALE}" fill-opacity=".7"/>`).join('')
  const distant = glints([[180, 612], [290, 590]]) + `<g class="mv-r">${glints([[1250, 604], [1350, 586], [1480, 612]])}</g>`
  const flyLeaves = Array.from(
    { length: 14 },
    (_, i) =>
      `<path class="sp-lf" style="--dy:${r0(60 + next() * 160)}px;--r:${r0(360 + next() * 540)}deg;animation-delay:${f(0.1 + (i % 7) * 0.16 + next() * 0.2)}s" ` +
      `d="${leaf(-80, 140 + next() * 720, (next() - 0.5) * 0.8, 46 + next() * 22, 7)}"/>`,
  ).join('')
  const streaks = Array.from({ length: 10 }, () => [next() * 1600, 80 + next() * 840, 80 + next() * 120] as const)
  const streakPath = [0, 1600]
    .map(o => streaks.map(([x, y, l]) => `M${r0(x + o - 1600)} ${r0(y)}q${r0(l / 4)} -12 ${r0(l / 2)} 0t${r0(l / 2)} 0`).join(''))
    .join('')
  const motes = [[300, 500], [220, 640], [380, 300], [160, 760], [80, 420], [140, 200], [420, 560], [260, 380]]
    .map(([x, y], i) => `<circle class="sp-mo" style="animation-delay:${f(0.6 + i * 0.35)}s" cx="${x}" cy="${y}" r="2.6" fill="${PALE}"/>`)
    .join('')
  // Invented marks, letters in no script: a teardrop, an arch over a dash, a wave, a spiral hook, an arc of dots, a leaf.
  const glyphs =
    'M65-243c4 5 7 9 7 13a7 7 0 0 1-14 0c0-4 3-8 7-13zM82-232q8-10 16 0M86-226h8M60-206q10-8 20 0t20 0' +
    'M67-181a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6 6 0 1 1 12 0l-2 8M62-148q12-16 30-8q-12 14-30 8zM62-148l22-6M62-148l-4 4'
  const dots = 'M84-178h0M86-185h0M91-189h0M96-185h0M98-178h0'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#040a08',
      furniture: WOOD,
      metal: BAMBOO,
      paper: PAPER,
      light: { idle: '#5aa48c', work: MINT, bright: '#dcfff2' },
      headTop: 207,
      glowAt: [345, 284],
      device,
      wear: {
        // The woven conical hat: its brim casts a shade on the head's top row only, so the eyes stay clear below it.
        front:
          '<rect x="70" y="238" width="160" height="12" fill="#040a08" fill-opacity=".3"/>' +
          `<path d="M150 172L264 241Q150 258 36 241Z" fill="${STRAW}"/>` +
          '<path d="M150 172L264 241Q208 250 150 252Z" fill="#c4ab72" fill-opacity=".45"/>' +
          '<path d="M122 189Q150 193 178 189M93 207Q150 215 207 207M65 224Q150 236 235 224" fill="none" stroke="#5e4b2a" stroke-opacity=".7" stroke-width="1.6"/>' +
          '<path d="M150 172L110 247M150 172L190 247M150 172V252" stroke="#5e4b2a" stroke-opacity=".35" stroke-width="1.2"/>' +
          '<path d="M36 241Q150 258 264 241" fill="none" stroke="#e2cf98" stroke-opacity=".7" stroke-width="2.4"/>' +
          `<path d="M228 247l6 19" stroke="#6a5a3a" stroke-width="1.6"/><circle cx="235" cy="270" r="4" fill="${MINT}" fill-opacity=".85"/>`,
      },
      // A cut length of giant bamboo for a stool, a woven cushion on top.
      seatArt:
        `<rect x="114" y="354" width="74" height="102" rx="4" fill="${CANE}"/><path d="M114 404h74" stroke="${CANE_LIT}" stroke-width="3"/>` +
        `<rect x="170" y="356" width="7" height="98" fill="${MINT}" fill-opacity=".12"/><rect x="116" y="356" width="14" height="98" fill="#040a08" fill-opacity=".3"/>` +
        '<ellipse cx="151" cy="352" rx="46" ry="8" fill="#4a3f28"/><path d="M112 352Q151 364 190 352M124 348Q151 356 178 348" fill="none" stroke="#6f5f3a" stroke-width="2"/>',
      // A wooden plank on bamboo legs lashed with straw rope.
      tableArt:
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<g fill="${CANE}"><rect x="186" y="343" width="12" height="113"/><rect x="438" y="343" width="12" height="113"/><rect x="198" y="400" width="240" height="7"/></g>` +
        `<path d="M184 380h16M184 432h16M436 380h16M436 432h16" stroke="${CANE_LIT}" stroke-width="2.4"/>` +
        `<path d="M184 346l16 8M200 346l-16 8M436 346l16 8M452 346l-16 8" stroke="${STRAW}" stroke-width="2"/>`,
    },
    style:
      march.keys +
      // Ambient: the bamboo sways, the mist drifts, moonbeams breathe, wisps float, fireflies glow and fade.
      '.sp-sw{transform-box:fill-box;transform-origin:50% 100%;animation:sp-sw 7s ease-in-out infinite alternate}' +
      '@keyframes sp-sw{from{transform:skewX(calc(var(--s,1)*-.7deg))}to{transform:skewX(calc(var(--s,1)*.7deg))}}' +
      '.sp-ms{animation:sp-ms 36s ease-in-out infinite alternate}@keyframes sp-ms{from{transform:translateX(-80px)}to{transform:translateX(80px)}}' +
      '.sp-bm{animation:sp-bm 9s ease-in-out infinite alternate}@keyframes sp-bm{from{opacity:.45}to{opacity:1}}' +
      '.sp-wd{animation:sp-wd var(--t,12s) ease-in-out infinite}' +
      '@keyframes sp-wd{0%,100%{transform:translate(0,0);opacity:.7}33%{transform:translate(var(--ax),var(--ay));opacity:1}66%{transform:translate(var(--bx),var(--by));opacity:.85}}' +
      '.sp-tl{transform-box:fill-box;transform-origin:69% 84%;animation:sp-tl calc(var(--t,12s)/4) ease-in-out infinite alternate}' +
      '@keyframes sp-tl{from{transform:rotate(-8deg)}to{transform:rotate(10deg)}}' +
      '.sp-ff{fill:#dcff9c;opacity:.1;animation:sp-ff var(--t,3s) ease-in-out infinite}' +
      '@keyframes sp-ff{0%,100%{opacity:.06;transform:translate(0,0)}50%{opacity:.9;transform:translate(var(--fx),var(--fy))}}' +
      // The lanterns swing on their hooks and their light breathes; it ripples down the path while Claude writes.
      '.sp-ls{animation:sp-ls 5s ease-in-out infinite alternate;animation-delay:calc(var(--k)*-.7s)}@keyframes sp-ls{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.sp-hl{transform-box:fill-box;transform-origin:center;animation:sp-hl 4s ease-in-out infinite alternate;animation-delay:calc(var(--k)*-.6s)}' +
      '@keyframes sp-hl{from{opacity:.7}to{opacity:1}}' +
      '.sp-dk,.sp-smk,.sp-sp{opacity:0}' +
      '.st-responding .sp-hl{animation:sp-fl 2.4s ease-in-out infinite;animation-delay:calc(var(--k)*-.3s)}' +
      '@keyframes sp-fl{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.14)}}' +
      // Run: the lanterns flare in a wave and the procession flows along its glowing trail.
      '.st-run .sp-hl{animation:sp-fl 1.5s ease-in-out infinite;animation-delay:calc(var(--k)*-.18s)}' +
      '.sp-proc{opacity:0}.st-run .sp-proc{animation:sp-in .9s ease-out .1s both}@keyframes sp-in{to{opacity:1}}' +
      '.st-run .sp-pe{animation:sp-pr 18s linear infinite}' +
      '.sp-rib{stroke-dasharray:1;stroke-dashoffset:1}.st-run .sp-rib{animation:sp-draw 2.2s ease-out both}@keyframes sp-draw{to{stroke-dashoffset:0}}' +
      '.sp-rise{animation:sp-rise 3.2s ease-in infinite}@keyframes sp-rise{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(-80px,-440px)}}' +
      // Error: a gust bends the bamboo, swings the lanterns and blows them out, sweeps the spirits and the mist away.
      '.st-error .sp-sw{animation:sp-gust 3.4s ease-out .1s both}' +
      '@keyframes sp-gust{0%{transform:skewX(0)}16%{transform:skewX(calc(var(--s,1)*-6deg))}30%{transform:skewX(calc(var(--s,1)*-3.6deg))}' +
      '46%{transform:skewX(calc(var(--s,1)*-5.4deg))}66%{transform:skewX(calc(var(--s,1)*-2deg))}84%{transform:skewX(calc(var(--s,1)*-3deg))}100%{transform:skewX(calc(var(--s,1)*-1deg))}}' +
      '.st-error .sp-ls{animation:sp-gsw 3s ease-out both;animation-delay:calc(var(--k)*.04s)}' +
      '@keyframes sp-gsw{0%{transform:rotate(0)}18%{transform:rotate(-32deg)}36%{transform:rotate(-14deg)}54%{transform:rotate(-24deg)}76%{transform:rotate(-8deg)}100%{transform:rotate(-4deg)}}' +
      '.st-error .sp-hl{animation:sp-off .5s ease-in both;animation-delay:calc(.25s + var(--k)*.06s)}@keyframes sp-off{to{opacity:0}}' +
      '.st-error .sp-dk{animation:sp-dk .6s ease-in both;animation-delay:calc(.25s + var(--k)*.06s)}@keyframes sp-dk{to{opacity:.84}}' +
      '.st-error .sp-smk{animation:sp-smk 2.4s ease-out both;animation-delay:calc(.6s + var(--k)*.06s)}' +
      '@keyframes sp-smk{0%{opacity:0;transform:translateY(0)}25%{opacity:.7}100%{opacity:0;transform:translateY(-36px)}}' +
      '.sp-ds{animation:sp-smk 2.4s ease-out infinite}' +
      '.st-error .sp-blow{animation:sp-blow 1.6s ease-in .15s both}@keyframes sp-blow{to{transform:translate(460px,-90px);opacity:0}}' +
      '.st-error .sp-ms{animation:sp-mg 2.8s ease-in both}@keyframes sp-mg{to{transform:translateX(560px);opacity:.3}}' +
      '.st-error .sp-ffs{animation:sp-off .8s ease-in both}' +
      '.sp-lf{fill:#6aa58b}.sp-lf,.sp-wind{opacity:0}.st-error .sp-lf{transform-box:fill-box;transform-origin:center;animation:sp-lf 2.1s cubic-bezier(.4,.2,.6,.9) infinite}' +
      '@keyframes sp-lf{0%{opacity:0;transform:translate(0,0) rotate(0)}10%,88%{opacity:.9}100%{opacity:0;transform:translate(1800px,var(--dy)) rotate(var(--r))}}' +
      '.st-error .sp-wind{animation:sp-wnd 3.2s ease-out .1s both}@keyframes sp-wnd{0%{opacity:0}15%{opacity:1}70%{opacity:.7}100%{opacity:0}}' +
      '.sp-ws{animation:sp-ws .9s linear infinite}@keyframes sp-ws{from{transform:translateX(0)}to{transform:translateX(1600px)}}' +
      '.sp-gm{opacity:0}.st-error .sp-gm{animation:sp-gm 2.6s ease-in-out infinite}' +
      '@keyframes sp-gm{0%{opacity:0;transform:translateX(-380px)}30%{opacity:1}100%{opacity:0;transform:translateX(420px)}}' +
      // Done: the great spirit draws itself in light, the forest glows and every lantern relights down the path.
      '.sp-fox,.sp-wash,.sp-mo,.sp-fill{opacity:0}' +
      '.st-done .sp-fox{animation:sp-in .8s ease-out .1s both}.st-done .sp-wash{animation:sp-in 2.4s ease-out .3s both}' +
      '.sp-fd{stroke-dasharray:1;stroke-dashoffset:1}.st-done .sp-fd{animation:sp-draw 2s ease-in-out .15s both}' +
      '.st-done .sp-fill{animation:sp-in 1.8s ease-out .6s both}' +
      '.st-done .sp-mo{animation:sp-mo 3.2s ease-out infinite}@keyframes sp-mo{0%{opacity:0;transform:translateY(0)}20%{opacity:.85}100%{opacity:0;transform:translateY(-140px)}}' +
      '.st-done .sp-hl{animation:sp-on 1.1s ease-out both;animation-delay:calc(.35s + var(--k)*.11s)}@keyframes sp-on{from{opacity:0}to{opacity:1}}' +
      '.st-done .sp-dk{animation:sp-dko 1.1s ease-out both;animation-delay:calc(.35s + var(--k)*.11s)}@keyframes sp-dko{from{opacity:.84}to{opacity:0}}' +
      '.st-done .sp-sp{animation:sp-in 1s ease-out 1.5s both}' +
      // The desk: the lantern flickers while a tool runs, a scroll unrolls to read, spirits circle the hat while
      // thinking and fly off with messages for the web.
      '.st-tool .sp-dl{animation:sp-flk .34s ease-in-out infinite alternate}@keyframes sp-flk{from{opacity:.6}to{opacity:1}}' +
      '.sp-scr{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-read .sp-scr{animation:sp-unr 1.2s ease-out both}@keyframes sp-unr{to{transform:scaleY(1)}}' +
      '.sp-orb{opacity:0}.st-thinking .sp-orb{animation:sp-in .8s ease-out both,mv-spin 7s linear infinite}' +
      '.sp-msg{opacity:0}.st-web .sp-msg{animation:sp-msg 2.4s ease-in infinite}' +
      '@keyframes sp-msg{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(140px,-560px) scale(1)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020605"/><stop offset=".4" stop-color="#06110e"/>' +
      '<stop offset=".62" stop-color="#0d211b"/><stop offset=".8" stop-color="#0a1914"/><stop offset="1" stop-color="#050c0a"/></linearGradient>' +
      '<radialGradient id="sp-haze"><stop offset="0" stop-color="#cdeee0" stop-opacity=".16"/><stop offset=".5" stop-color="#a8f0d8" stop-opacity=".05"/><stop offset="1" stop-color="#a8f0d8" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="sp-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PALE}" stop-opacity=".1"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="sp-mist"><stop offset="0" stop-color="#9fd0bf" stop-opacity=".15"/><stop offset="1" stop-color="#9fd0bf" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sp-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a15" stop-opacity="0"/><stop offset=".25" stop-color="#08130f"/><stop offset="1" stop-color="#040907"/></linearGradient>' +
      `<radialGradient id="sp-lh"><stop offset="0" stop-color="#f4f6dc" stop-opacity=".5"/><stop offset=".35" stop-color="${MINT}" stop-opacity=".18"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="sp-lb" cx=".45" cy=".4"><stop offset="0" stop-color="#fff8e2"/><stop offset=".6" stop-color="#efdcab"/><stop offset="1" stop-color="#b4cf9e"/></radialGradient>' +
      `<radialGradient id="sp-wh"><stop offset="0" stop-color="${PALE}" stop-opacity=".44"/><stop offset=".45" stop-color="${MINT}" stop-opacity=".14"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="sp-gs"><stop offset="0" stop-color="#d4f2e6" stop-opacity=".22"/><stop offset=".5" stop-color="#d4f2e6" stop-opacity=".09"/><stop offset="1" stop-color="#d4f2e6" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="sp-wf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2fff9" stop-opacity=".9"/><stop offset=".55" stop-color="${MINT}" stop-opacity=".5"/><stop offset="1" stop-color="${MINT}" stop-opacity=".2"/></linearGradient>` +
      ['rg', 'rp']
        .map(
          (id, i) =>
            `<linearGradient id="sp-${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">` +
            [[0, 1], [0.28, 1], [0.36, 0.25], [0.66, 0.25], [0.75, 1], [1, 1]]
              .map(([at, o]) => `<stop offset="${at}" stop-color="${i ? PALE : MINT}" stop-opacity="${o}"/>`)
              .join('') +
            '</linearGradient>',
        )
        .join('') +
      `<linearGradient id="sp-fx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MINT}" stop-opacity=".34"/><stop offset="1" stop-color="${MINT}" stop-opacity=".1"/></linearGradient>` +
      `<radialGradient id="sp-fw"><stop offset="0" stop-color="${MINT}" stop-opacity=".16"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#sp-sky)"/>' +
      '<circle cx="200" cy="-40" r="560" fill="url(#sp-haze)"/>' +
      '<g class="sp-bm" fill="url(#sp-beam)"><path d="M90 0H170L330 1000H200Z"/><path d="M230 0H282L420 1000H352Z" style="opacity:.7"/></g>' +
      '<g class="mv-r"><path class="sp-bm" style="animation-delay:-4s" d="M1330 0H1380L1300 1000H1220Z" fill="url(#sp-beam)"/></g>' +
      `<g class="sp-sw" style="--s:.4">${far}</g>` +
      distant +
      '<g class="sp-ms"><g fill="url(#sp-mist)"><ellipse cx="150" cy="600" rx="380" ry="80"/><ellipse cx="760" cy="630" rx="420" ry="70"/>' +
      '<ellipse cx="1300" cy="590" rx="400" ry="84"/><ellipse cx="1700" cy="640" rx="300" ry="60"/></g></g>' +
      '<g class="mv-b"><rect y="640" width="1600" height="420" fill="url(#sp-floor)"/>' +
      `<g fill="#14261f" stroke="${MINT}" stroke-opacity=".1" stroke-width="1.5">${stones}</g>${pools}</g>` +
      `<g class="sp-sw" style="animation-delay:-3s">${midLeft}</g>` +
      // The great spirit and the glow it gives the forest.
      '<circle class="sp-wash" cx="250" cy="560" r="560" fill="url(#sp-fw)"/>' +
      `<g class="sp-fox"><path class="sp-fill" d="${fox.shape}" fill="url(#sp-rg)" fill-opacity=".14" stroke="url(#sp-rg)" stroke-opacity=".1" stroke-width="18"/>` +
      `<path class="sp-fd" pathLength="1" d="${fox.shape}" fill="none" stroke="url(#sp-rp)" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path class="sp-fill" d="${fox.strands}" fill="none" stroke="url(#sp-rp)" stroke-opacity=".3" stroke-width="1.6"/>` +
      `<path class="sp-fill" d="${FOX}" fill="url(#sp-fx)" stroke="${MINT}" stroke-opacity=".14" stroke-width="16" stroke-linejoin="round"/>` +
      `<path class="sp-fd" pathLength="1" d="${FOX}" fill="none" stroke="${PALE}" stroke-opacity=".95" stroke-width="3" stroke-linejoin="round"/>` +
      `<g class="sp-fill"><path d="M452 302C440 288 418 280 400 264C392 282 394 302 408 313C424 322 444 316 452 302Z" fill="${PALE}" fill-opacity=".2"/>` +
      `<path d="${FOX_MARKS}" fill="none" stroke="${PALE}" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/><circle cx="450" cy="302" r="4.4" fill="${PALE}"/></g>` +
      `${motes}</g>` +
      `<g class="mv-r"><g class="sp-sw" style="--s:.9;animation-delay:-5s">${midRight}</g></g>` +
      `<g class="mv-b">${poleArt}${poleLanterns}</g>` +
      `<g class="mv-t">${rope(-20, 40, 200, 130, 440, 36, [0.18, 0.46, 0.74], 0)}</g>` +
      `<g class="mv-r"><g class="mv-t">${rope(1170, 56, 1400, 140, 1620, 46, [0.34, 0.66], 9)}</g></g>` +
      `<g class="sp-blow">${wispsLeft}</g><g class="mv-r"><g class="sp-blow">${wispsRight}</g></g>` +
      `<g class="sp-ffs">${fireflies(9, [0, 300, 420, 560], next)}${fireflies(3, [0, 880, 400, 100], next)}` +
      `<g class="mv-r">${fireflies(5, [1190, 120, 400, 420], next)}</g></g>` +
      // The procession, on the trail it lights.
      `<g class="sp-proc">${march.trail}${march.body}</g>` +
      `<g class="mv-t"><path d="${canopy}" fill="#030806"/></g>` +
      `<g class="sp-sw" style="--s:1.2;animation-delay:-1s">${nearLeft}</g>` +
      `<g class="mv-r"><g class="sp-sw" style="--s:1.2;animation-delay:-6s">${nearRight}</g></g>` +
      '<g class="mv-b"><g class="sp-ms" style="animation-duration:26s;animation-direction:alternate-reverse"><g fill="url(#sp-mist)">' +
      '<ellipse cx="200" cy="930" rx="460" ry="70"/><ellipse cx="900" cy="960" rx="520" ry="60"/><ellipse cx="1500" cy="920" rx="420" ry="70"/></g></g>' +
      '<path d="M-20 1000L-8 958L4 1000M30 1000L44 948L52 1000M96 1000L112 962L118 1000M380 1000L392 966L404 1000M1260 1000L1270 962L1284 1000" fill="#040a07"/></g>' +
      // The gust: leaves torn off the stalks and streaks of wind.
      flyLeaves +
      `<g class="sp-wind"><g class="sp-ws"><path d="${streakPath}" fill="none" stroke="${PALE}" stroke-opacity=".34" stroke-width="2.6" stroke-linecap="round"/></g></g>` +
      // Broad streams of mist torn sideways through the left of the forest.
      [[150, 300, 0], [110, 540, 0.5], [170, 780, 1]]
        .map(([x, y, d]) => `<g class="sp-gm" style="animation-delay:${d}s"><ellipse cx="${x}" cy="${y}" rx="300" ry="40" fill="url(#sp-gs)" transform="rotate(-4 ${x} ${y})"/></g>`)
        .join(''),
    nook:
      // The ground under the desk.
      '<path d="M-60 452Q40 440 150 448T360 446T480 450V480H-60Z" fill="#050c0a"/>' +
      // The keeper's lantern pole with its arm, its lantern and a rolled scroll.
      `<rect x="12" y="-266" width="11" height="722" fill="${CANE}"/><rect x="13" y="-266" width="2" height="722" fill="${MINT}" fill-opacity=".07"/>` +
      `<path d="M10 -190h15M10 -70h15M10 50h15M10 170h15M10 290h15M10 400h15" stroke="${CANE_LIT}" stroke-width="2.4"/>` +
      `<path d="M17 -256Q84 -284 156 -264" fill="none" stroke="${CANE}" stroke-width="6" stroke-linecap="round"/>` +
      lantern(146, -266, 1.05, 9) +
      `<g class="sp-scr"><rect x="44" y="-256" width="56" height="166" fill="${PAPER}" fill-opacity=".86"/>` +
      `<path d="${glyphs}" fill="none" stroke="#3a3426" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${dots}" stroke="#3a3426" stroke-width="3.4" stroke-linecap="round"/><rect x="40" y="-94" width="64" height="7" rx="3.5" fill="#6a5a3a"/></g>` +
      `<rect x="40" y="-262" width="64" height="8" rx="4" fill="#a89c78"/>` +
      // A wisp keeps the keeper company; spare lanterns wait on the ground.
      `<g class="sp-blow">${wisp(260, -130, 0.6, next)}</g>` +
      spare(34, 428, 0.72) +
      spare(76, 436, 0.6) +
      // Thinking: small spirits circle the hat. Web: they fly off with messages.
      '<g transform="translate(150 110)"><g class="sp-orb">' +
      [0, 1, 2].map(i => `<g transform="rotate(${i * 120}) translate(84 0) scale(.8)">${WISP}</g>`).join('') +
      '</g></g>' +
      [0, 1, 2].map(i => `<g class="sp-msg" style="animation-delay:${f(i * 0.8)}s"><g transform="translate(206 120) scale(.6)">${FLAME}</g></g>`).join(''),
    front: `<g class="sp-ms" style="animation-duration:22s"><ellipse cx="200" cy="452" rx="280" ry="26" fill="url(#sp-mist)"/></g>`,
  }
}
