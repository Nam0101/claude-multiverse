import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Wizard Academy: a castle school of wizardry at night, and Claude at the near end of a long table in its great hall,
// in a pointed hat and a plain knitted scarf, writing with an enchanted quill on a parchment that floats over an open
// spellbook. Candles float under a ceiling enchanted to show the night sky, a tall window on the left looks out on
// towers above a dark lake, a staircase hangs from the right wall and swings, a cauldron simmers by the left wall.
// A run whirls the candle flames into a spiral and sends books flying round Claude's hat; an error boils the cauldron
// over in green smoke while clouds roll over the ceiling; done bursts fireworks, a coral starburst among them.
const GOLD = '#ffd27a'
const FLAME = '#ffe4a4'
const WAX = '#e9dec6'
const PLUM = '#2a1736'
const CORAL = '#e5865f'
const OAK = '#2a1d16'
const OAK_EDGE = '#4a3424'
const PAPER = '#efe2c4'
const QUILL_INK = '#4a2e18'
const SIL = '#04050c'
const LIT = '#ffcf6e'
const HAT = '#232a66'
const HAT_EDGE = '#4652a8'
const SCARF = '#2e6a72'
const KNIT = '#45878f'

// The hall in one-point perspective: a point at depth s (1 near, FAR at the far wall) sits s of the way from the
// vanishing point to where it would be on the near plane. The side walls are the planes x = WL and x = WR.
const VX = 800
const VY = 430
const WL = -80
const WR = 1680
const TOP = 40
const FLOOR = 1060
const FAR = 0.42

const px = (X: number, s: number): number => VX + (X - VX) * s
const py = (Y: number, s: number): number => VY + (Y - VY) * s
const at = (X: number, Y: number, s: number): string => `${f(px(X, s))} ${f(py(Y, s))}`
const dot = (x: number, y: number, r: number): string =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`
/** A point drawn as a zero-length round-capped stroke: the stroke width sets its size. */
const pip = (x: number, y: number): string => `M${f(x)} ${f(y)}h0`
const sparkle = (x: number, y: number, s: number): string =>
  `M${f(x)} ${f(y - s)}L${f(x + s * 0.24)} ${f(y - s * 0.24)}L${f(x + s)} ${f(y)}L${f(x + s * 0.24)} ${f(y + s * 0.24)}L${f(x)} ${f(y + s)}` +
  `L${f(x - s * 0.24)} ${f(y + s * 0.24)}L${f(x - s)} ${f(y)}L${f(x - s * 0.24)} ${f(y - s * 0.24)}Z`
const glowDef = (id: string, color: string, alpha: number): string =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${alpha}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`

/** Where the walls stop and the enchanted sky begins, over x. */
function cornice(x: number): number {
  const edge = py(TOP, FAR)
  const left = px(WL, FAR)
  const right = px(WR, FAR)

  if (x < left) {
    return TOP + ((x - WL) / (left - WL)) * (edge - TOP)
  }

  if (x > right) {
    return TOP + ((WR - x) / (WR - right)) * (edge - TOP)
  }

  return edge
}

/** Two curves from (x1, y1) up to a point at `apex` and down to (x2, y2): a pointed arch. */
function pointed(x1: number, y1: number, x2: number, y2: number, apex: number): string {
  const xm = (x1 + x2) / 2

  return (
    `C${f(x1)} ${f(y1 - (y1 - apex) * 0.6)} ${f(xm - (xm - x1) * 0.35)} ${f(apex + (y1 - apex) * 0.1)} ${f(xm)} ${f(apex)}` +
    `C${f(xm + (x2 - xm) * 0.35)} ${f(apex + (y2 - apex) * 0.1)} ${f(x2)} ${f(y2 - (y2 - apex) * 0.6)} ${f(x2)} ${f(y2)}`
  )
}

/** A pointed window on a side wall (plane X) between depths `near` and `far`, foreshortened toward the far end. */
function arch(X: number, near: number, far: number, top: number, bottom: number, rise: number): string {
  const x1 = px(X, near)
  const t1 = py(top, near)

  return `M${f(x1)} ${f(py(bottom, near))}V${f(t1)}${pointed(x1, t1, px(X, far), py(top, far), py(top - rise, (near + far) / 2))}V${f(py(bottom, far))}Z`
}

/** Claude's starburst, the hero emblem: `points` rays around its own center. */
function burst(r: number, points: number, inner: number): string {
  return (
    'M' +
    Array.from({ length: points * 2 }, (_, i) => {
      const a = (i * Math.PI) / points - Math.PI / 2
      const len = i % 2 === 0 ? r : r * inner

      return `${f(len * Math.cos(a))} ${f(len * Math.sin(a))}`
    }).join('L') +
    'Z'
  )
}

/** The enchanted ceiling's stars: three twinkling sets of dots and a few bright sparkles, all above the cornice. */
function stars(): string {
  const next = random(911)
  // Big and small stars apart from the dim ones over the chat column, each set twinkling on its own beat.
  const sets: string[][] = [[], [], []]
  const bright: string[] = []

  for (let i = 0; i < 130; i += 1) {
    const x = next() * 1600
    const y = 6 + next() * 300
    const big = next() > 0.6
    const column = x > 420 && x < 1180

    if (y > cornice(x) - 12) {
      continue
    }

    if (!column && big && bright.length < 8 && next() > 0.6) {
      bright.push(sparkle(x, y, 5 + next() * 2))
      continue
    }

    sets[column ? 2 : big ? 0 : 1]?.push(pip(x, y))
  }

  return (
    '<g stroke="#e6e0ff" stroke-linecap="round">' +
    sets.map((set, i) => `<path class="wa-tw${i ? ` wa-tw${i + 1}` : ''}" d="${set.join('')}" stroke-width="${[3.4, 2.2, 1.8][i]}" stroke-opacity="${[0.75, 0.6, 0.5][i]}"/>`).join('') +
    `</g><path class="wa-tw wa-tw3" d="${bright.join('')}" fill="#fff4d6"/>`
  )
}

type Candle = { x: number; y: number; k: number; dim: boolean; glow: boolean }

/** Candles floating at every depth of the hall; the few over the chat column stay far, small and dim. */
function candleField(): Candle[] {
  const next = random(4242)
  const out: Candle[] = []

  for (let i = 0; i < 300 && out.length < 62; i += 1) {
    const s = 0.46 + next() * 0.54
    const x = px(-40 + next() * 1720, s)
    const y = py(-90 + next() * 600, s)
    const column = x > 430 && x < 1170

    if (x < 8 || x > 1592 || y < 50 || y > 600 || (x > 1190 && y > 460) || (column && s > 0.6)) {
      continue
    }

    out.push({ x, y, k: s * 1.15, dim: column, glow: !column && s > 0.58 })
  }

  return out
}

function candles(list: Candle[]): string {
  const stick = (c: Candle): string => `M${f(c.x - 4 * c.k)} ${f(c.y)}h${f(8 * c.k)}v${f(40 * c.k)}h${f(-8 * c.k)}Z`
  const flame = (c: Candle): string =>
    `M${f(c.x)} ${f(c.y - 17 * c.k)}q${f(5.5 * c.k)} ${f(9 * c.k)} 0 ${f(15 * c.k)}q${f(-5.5 * c.k)} ${f(-6 * c.k)} 0 ${f(-15 * c.k)}Z`
  const pace = [5.2, 6.4, 4.6, 7.1] as const
  const drift = [16, -20, 24, -14] as const

  return [0, 1, 2, 3]
    .map(g => {
      const mine = list.filter((_, i) => i % 4 === g)
      const near = mine.filter(c => !c.dim)
      const far = mine.filter(c => c.dim)
      const dx = drift[g] ?? 16

      return (
        `<g class="wa-cg" style="--b:${pace[g] ?? 5}s;--dx:${dx}px;--nx:${-dx}px;animation-delay:${f(-g * 1.7)}s">` +
        `<g class="wa-glows" fill="url(#wa-cg)">${near.filter(c => c.glow).map(c => `<circle cx="${f(c.x)}" cy="${f(c.y - 9 * c.k)}" r="${f(28 * c.k)}"/>`).join('')}</g>` +
        `<path d="${near.map(stick).join('')}" fill="${WAX}" fill-opacity=".92"/>` +
        // The far ones over the chat column are only their flames, small warm points.
        `<path class="wa-fl" d="${near.map(flame).join('')}" fill="${FLAME}"/><path class="wa-fl" d="${far.map(flame).join('')}" fill="${FLAME}" fill-opacity=".55"/></g>`
      )
    })
    .join('')
}

/** One candle floating close over the desk, in the desk's box. */
function nearCandle(x: number, y: number, k: number, delay: number): string {
  return (
    `<g class="wa-cg" style="--b:5.8s;--dx:8px;--nx:-8px;animation-delay:${delay}s">` +
    `<circle class="wa-glows" cx="${x}" cy="${f(y - 9 * k)}" r="${f(40 * k)}" fill="url(#wa-cg)"/>` +
    `<rect x="${f(x - 4 * k)}" y="${y}" width="${f(8 * k)}" height="${f(40 * k)}" fill="${WAX}"/>` +
    `<path class="wa-fl" d="M${x} ${f(y - 17 * k)}q${f(5.5 * k)} ${f(9 * k)} 0 ${f(15 * k)}q${f(-5.5 * k)} ${f(-6 * k)} 0 ${f(-15 * k)}Z" fill="${FLAME}"/></g>`
  )
}

/** The run's whirl: the candle flames drawn into two spiral arms that spin around a glow in the left third. */
function vortex(): string {
  const orbs: string[] = []

  for (let i = 0; i < 22; i += 1) {
    const t = Math.floor(i / 2) / 10
    const a = t * Math.PI * 1.8 + (i % 2) * Math.PI
    const r = 26 + t * 150

    orbs.push(`<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(9 + t * 9)}"/>`)
  }

  const arm = (phase: number): string =>
    'M' +
    Array.from({ length: 30 }, (_, j) => {
      const t = j / 29
      const a = t * Math.PI * 1.8 + phase
      const r = 26 + t * 150

      return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`
    }).join('L')

  return (
    `<g transform="translate(236 380)"><g class="wa-vx"><circle r="160" fill="url(#wa-vg)"/><g class="wa-vxs">` +
    `<path d="${arm(0)}${arm(Math.PI)}" fill="none" stroke="${GOLD}" stroke-opacity=".32" stroke-width="3" stroke-linecap="round"/>` +
    `<g fill="url(#wa-orb)">${orbs.join('')}</g></g></g></g>`
  )
}

/** Castle towers with conical roofs on a base wall, two sets of lit windows that twinkle out of step. */
function towers(list: readonly (readonly [number, number, number, number])[], base: string, seed: number): string {
  const next = random(seed)
  const a: string[] = []
  const b: string[] = []
  let shape = base

  list.forEach(([x, w, top, roof], i) => {
    shape += `M${x} 600V${top}L${f(x + w / 2)} ${top - roof}L${x + w} ${top}V600Z`

    for (let j = 0; j < 3; j += 1) {
      ;((i + j) % 2 ? a : b).push(`M${f(x + 3 + next() * (w - 10))} ${f(top + 12 + next() * (566 - top - 24))}h4v7h-4Z`)
    }
  })

  return (
    `<path d="${shape}" fill="${SIL}"/>` +
    `<path class="wa-lit" d="${a.join('')}" fill="${LIT}"/><path class="wa-lit wa-lit2" d="${b.join('')}" fill="${LIT}"/>`
  )
}

/** A banner on the right wall between two depths: one plum cloth for the whole school, Claude's starburst on it. */
function banner(near: number, far: number, delay: number): string {
  const top = 90
  const bottom = 560
  const mid = (near + far) / 2
  const xm = px(WR, mid)
  const d = `M${at(WR, top, near)}L${at(WR, top, far)}L${at(WR, bottom, far)}L${f(xm)} ${f(py(bottom + 70, mid))}L${at(WR, bottom, near)}Z`
  const wide = Math.abs(px(WR, near) - px(WR, far))

  return (
    `<g class="wa-ban" style="animation-delay:${delay}s"><path d="${d}" fill="${PLUM}" stroke="${GOLD}" stroke-opacity=".32" stroke-width="2"/>` +
    `<g transform="translate(${f(xm)} ${f(py(300, mid))}) scale(${(wide / 56).toFixed(2)} ${mid.toFixed(2)})">` +
    `<path class="wa-emb" d="${burst(22, 10, 0.34)}" fill="${CORAL}"/></g></g>`
  )
}

/** A long table running toward the far wall, with dim gold plates down it. */
function longTable(X: number): string {
  const near = 0.8
  const far = 0.47
  const Y = 900
  const w = 66
  const plates = [0.5, 0.57, 0.64, 0.71, 0.78].map(s => pip(px(X - 30, s), py(Y, s)) + pip(px(X + 30, s), py(Y, s))).join('')

  return (
    `<path d="M${at(X - w, Y, near)}L${at(X + w, Y, near)}L${at(X + w, Y, far)}L${at(X - w, Y, far)}Z" fill="#1a120e" stroke="#2a1d16" stroke-width="1.5"/>` +
    `<path d="M${at(X - w, Y, near)}H${f(px(X + w, near))}V${f(py(Y + 34, near))}H${f(px(X - w, near))}Z" fill="#100b09"/>` +
    `<path d="${plates}" stroke="${GOLD}" stroke-opacity=".26" stroke-width="5" stroke-linecap="round"/>`
  )
}

/** The staircase hanging from a landing high on the right wall; it sways, and swings away when a tool runs. */
function staircase(): string {
  let profile = 'M0 0'
  let nosings = ''
  let balusters = ''

  for (let i = 0; i < 9; i += 1) {
    const x = -i * 32 - 16

    profile += 'h-32v24'
    nosings += `M${-i * 32} ${i * 24}h-30`
    balusters += `M${x} ${i * 24}V${f(-58 + (-2 - x) * 0.75)}`
  }

  return (
    '<path d="M1574 136V72Q1574 44 1597 36Q1620 44 1620 72V136Z" fill="url(#wa-door)"/>' +
    '<g fill="#161120" stroke="#2c2440" stroke-width="2"><path d="M1556 136H1620V156H1556ZM1568 156H1620V196Z"/><path d="M1240 356H1326V374H1240ZM1258 374H1312L1286 404Z"/></g>' +
    '<g transform="translate(1590 138)"><g class="wa-stair">' +
    `<path d="${profile}V252L24 18V0Z" fill="#151020" stroke="#2c2440" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${nosings}" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
    `<path d="${balusters}" stroke="#2c2338" stroke-width="2.5"/>` +
    '<path d="M-2 -58L-286 155" stroke="#3a2e4a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M-298 216V150H-284V216Z" fill="#1c1628" stroke="#3a2e4a" stroke-width="1.5"/><circle cx="-291" cy="146" r="7" fill="#2a2238" stroke="#4a3c5a"/>' +
    '</g></g>'
  )
}

/** A tawny owl gliding toward us, broad fingered wings, a pale heart-shaped face; a letter in its talons on web. */
function owl(x: number, y: number, scale: number, n: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})"><g class="wa-owl wa-owl${n}" style="animation-delay:${delay}s">` +
    '<path class="wa-wing" d="M-8 -6C-24 -20 -50 -22 -66 -10L-60 -5L-65 1L-56 3L-59 9L-46 7C-34 7 -20 7 -8 9ZM8 -6C24 -20 50 -22 66 -10L60 -5L65 1L56 3L59 9L46 7C34 7 20 7 8 9Z" fill="#4a3a34" stroke="#6e5a4e" stroke-width="1.2"/>' +
    '<path d="M0 -22C14 -22 18 -10 16 4C14 18 8 24 0 24C-8 24 -14 18 -16 4C-18 -10 -14 -22 0 -22Z" fill="#5a463e"/>' +
    '<path d="M0 -20C4 -24 13 -20 13 -11C13 -3 6 2 0 6C-6 2 -13 -3 -13 -11C-13 -20 -4 -24 0 -20Z" fill="#cdb79c"/>' +
    `<path d="${dot(-5, -11, 2.8)}${dot(5, -11, 2.8)}" fill="#140c0a"/><path d="M-1.6 -5L0 -1L1.6 -5Z" fill="#8a6a3a"/>` +
    `<g class="wa-lt"><rect x="-10" y="22" width="20" height="13" rx="1.5" fill="${PAPER}" fill-opacity=".9"/>` +
    `<path d="M-10 23L0 30L10 23" fill="none" stroke="#9a8a6a" stroke-width="1.2"/><circle cy="30" r="2.4" fill="${CORAL}"/></g></g></g>`
  )
}

/** The cauldron on its fire by the left wall: it simmers, and on an error it boils over in green foam and smoke. */
function cauldron(): string {
  const tongue = (x: number, y: number, h: number, w: number): string =>
    `M${x - w} ${y}C${x - w} ${f(y - h * 0.4)} ${x - 2} ${f(y - h * 0.7)} ${x} ${y - h}C${x + 2} ${f(y - h * 0.7)} ${x + w} ${f(y - h * 0.4)} ${x + w} ${y}Z`
  const bubbles = [-46, -18, 8, 30, 54]
    .map((dx, i) => `<circle class="wa-bub" style="animation-delay:${f(-i * 0.5)}s" cx="${165 + dx}" cy="790" r="${3 + (i % 3)}"/>`)
    .join('')
  const puffs = (
    [
      [-30, 0],
      [40, 0.35],
      [-80, 0.7],
      [70, 1.05],
      [-10, 1.4],
      [96, 1.75],
      [-56, 2.1],
    ] as const
  )
    .map(([dx, d]) => `<circle class="wa-smk" style="--dx:${dx}px;--d:${d}s" cx="${165 + dx * 0.2}" cy="768" r="54"/>`)
    .join('')

  return (
    '<circle class="wa-ggl" cx="165" cy="780" r="230" fill="url(#wa-gg)"/>' +
    '<circle class="wa-fglow" cx="165" cy="930" r="150" fill="url(#wa-fire)"/>' +
    '<ellipse cx="165" cy="950" rx="124" ry="12" fill="#050308" fill-opacity=".8"/>' +
    '<path d="M100 952L230 934M108 934L232 954" stroke="#2a1a10" stroke-width="12" stroke-linecap="round"/>' +
    `<path class="wa-fire" d="${tongue(138, 944, 34, 11)}${tongue(165, 946, 48, 13)}${tongue(194, 944, 30, 10)}" fill="#ff9a3c" fill-opacity=".9"/>` +
    `<path class="wa-fire wa-fire2" d="${tongue(140, 944, 20, 6)}${tongue(165, 946, 30, 7)}${tongue(192, 944, 18, 5)}" fill="${GOLD}"/>` +
    '<path d="M96 890L84 944M234 890L246 944M165 912V946" stroke="#141018" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M78 800C58 852 78 916 165 922C252 916 272 852 252 800Z" fill="#17121c" stroke="#2e2638" stroke-width="2"/>' +
    '<path d="M92 822C88 852 100 884 126 898" fill="none" stroke="#4a3e5a" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M228 836C232 860 226 884 206 900" fill="none" stroke="#ff9a3c" stroke-opacity=".22" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="165" cy="790" rx="120" ry="44" fill="url(#wa-brg)"/>' +
    '<ellipse cx="165" cy="798" rx="92" ry="14" fill="#1e1828" stroke="#3e3450" stroke-width="3"/>' +
    '<ellipse cx="165" cy="798" rx="80" ry="9" fill="#1d7564"/><ellipse class="wa-brewx" cx="165" cy="798" rx="80" ry="9" fill="#86ec5c"/>' +
    `<g fill="none" stroke="#8fe8cf" stroke-width="1.6">${bubbles}</g>` +
    '<g fill="none" stroke="#9fd8c8" stroke-opacity=".3" stroke-width="3" stroke-linecap="round">' +
    '<path class="wa-wisp" pathLength="1" d="M150 786c-12 -26 16 -42 2 -70c-10 -22 14 -36 6 -60"/>' +
    '<path class="wa-wisp" pathLength="1" style="animation-delay:-2.5s" d="M182 786c12 -24 -14 -40 0 -66c10 -22 -12 -36 -4 -58"/></g>' +
    '<path class="wa-drip" d="M86 804v44q0 9 7 9q7 0 7 -9v-44ZM130 810v62q0 8 6 8q6 0 6 -8v-62ZM198 810v38q0 8 6 8q6 0 6 -8v-38ZM234 804v54q0 8 6 8q6 0 6 -8v-54Z" fill="#6cd24c" fill-opacity=".9"/>' +
    '<g class="wa-foam"><path d="M74 800C62 778 84 760 104 768C108 744 140 738 154 754C164 732 200 736 204 756C222 744 252 758 250 778C262 784 260 800 256 802Z" fill="#6cd24c" fill-opacity=".9"/>' +
    `<path d="${dot(112, 774, 6)}${dot(160, 760, 8)}${dot(214, 772, 5)}${dot(138, 784, 4)}" fill="#c4ffa4" fill-opacity=".7"/></g>` +
    `<g fill="url(#wa-sm)">${puffs}</g>`
  )
}

/** One burst of fireworks in the ceiling's sky; the hero one carries Claude's coral starburst at its heart. */
function firework(x: number, y: number, r: number, color: string, delay: number, hero = false): string {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8

    return `M${f(Math.cos(a) * r * 0.28)} ${f(Math.sin(a) * r * 0.28)}L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`
  }).join('')
  const sparks = Array.from({ length: 16 }, (_, i) => {
    const a = ((i + 0.5) * Math.PI) / 8

    return dot(Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 2.2)
  }).join('')

  return (
    `<g transform="translate(${x} ${y})"><g class="wa-fw${hero ? ' wa-fwh' : ''}" style="--d:${delay}s">` +
    `<circle r="${f(r * 1.3)}" fill="url(#wa-fwg)"/><path d="${rays}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${sparks}" fill="${color}"/>${hero ? `<path d="${burst(r * 0.44, 10, 0.34)}" fill="${CORAL}"/>` : ''}</g></g>`
  )
}

/** The books that leave the pile and fly round Claude's hat on a run, drawn stretched so the flattened ring undoes it. */
function bookRing(): string {
  const colors = ['#7a2e34', '#2e4f7a', '#3e6a3a', '#6a4a8a', '#8a6a2e', '#2e6a6a'] as const
  const ys = (v: number): string => f((v * 1.4) / 0.24)
  const books = colors
    .map((color, i) => {
      const a = (i * Math.PI) / 3

      return (
        `<g transform="translate(${f(Math.cos(a) * 220)} ${f(Math.sin(a) * 220)})"><g class="wa-orbk"><g class="wa-flap" style="animation-delay:${f(-i * 0.13)}s">` +
        `<path d="M0 ${ys(-3)}L-25 ${ys(-11)}L-22 ${ys(8)}L0 ${ys(12)}ZM0 ${ys(-3)}L25 ${ys(-11)}L22 ${ys(8)}L0 ${ys(12)}Z" fill="${color}"/>` +
        `<path d="M0 ${ys(-1)}L-19 ${ys(-7)}L-18 ${ys(6)}L0 ${ys(10)}ZM0 ${ys(-1)}L19 ${ys(-7)}L18 ${ys(6)}L0 ${ys(10)}Z" fill="${PAPER}" fill-opacity=".85"/></g></g></g>`
      )
    })
    .join('')

  return `<g transform="translate(220 128)"><g class="wa-ring"><g transform="scale(1 .24)"><g class="wa-orb">${books}</g></g></g></g>`
}

/** The open spellbook, the inkpot, the parchment floating over them and the quill that writes on it by itself. */
function device(light: string, activity: Activity): string {
  const writing = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web' || activity === 'thinking'
  const pace = activity === 'responding' ? 1.6 : activity === 'thinking' ? 4.4 : 0.9
  const lines = [0, 1, 2, 3, 4]
    .map(i => `<path class="wa-gl" pathLength="1" style="--w:${f(i * 0.8)}s" d="M314 ${246 + i * 10}q2 -4 4 0${'t4 0'.repeat(i === 4 ? 7 : 13 - (i % 2) * 3)}"/>`)
    .join('')
  const blot = activity === 'error' ? '<path d="M340 268c6 -6 16 -2 14 6c6 2 4 12 -4 10c-2 8 -14 6 -12 -2c-8 0 -6 -12 2 -14z" fill="#2a1a10"/>' : ''
  const scroll = 'M306 234C330 230 356 238 380 234V298C356 302 330 294 306 298Z'

  return (
    '<path d="M238 330L245 319H339L346 330Z" fill="#3a2216" stroke="#5a3a24" stroke-width="1.5"/>' +
    `<path d="M248 321Q270 315 292 320V328H248ZM292 320Q314 315 336 321V328H292Z" fill="${PAPER}" fill-opacity=".88"/>` +
    `<path d="M254 323.5h30M298 323.5h30M254 326.5h24M298 326.5h26" stroke="${light}" stroke-opacity=".7" stroke-width="1.3"/>` +
    '<path d="M380 330V320Q380 315 385 315H395Q400 315 400 320V330Z" fill="#120e1a" stroke="#3a3048" stroke-width="1.5"/><rect x="384" y="310" width="12" height="5" rx="1" fill="#2a2236"/>' +
    `<g class="wa-flt"><ellipse cx="342" cy="266" rx="60" ry="54" fill="${light}" fill-opacity=".16"/>` +
    `<path d="${scroll}" fill="${PAPER}" fill-opacity=".94"/><path d="${scroll}" fill="${light}" fill-opacity=".22"/>` +
    `<g fill="none" stroke="${QUILL_INK}" stroke-width="1.4" stroke-linecap="round">${lines}</g>${blot}` +
    '<g fill="#d9c79c" stroke="#9a855a" stroke-width="1.2"><rect x="300" y="227" width="86" height="9" rx="4.5"/><rect x="300" y="295" width="86" height="9" rx="4.5"/></g></g>' +
    `<g${writing ? ` class="wa-q" style="--q:${pace}s"` : ''}>` +
    '<path d="M354 284C362 260 380 234 412 208C407 234 390 260 358 286Z" fill="#f1ece2"/>' +
    '<path d="M355 285L410 210M366 264l-8 -2M374 250l-8 -3M384 236l-8 -3M394 224l-7 -3" stroke="#b8ad98" stroke-width="1.2"/>' +
    '<path d="M351 289L354 281L359 284Z" fill="#1a1420"/>' +
    `<circle class="wa-spk" opacity="0" cx="352" cy="288" r="3" fill="${light}"/></g>`
  )
}

const LEG = (x: number): string => `M${x} 356h22v8h-4v24h6v12h-6v40h4v16h-22v-16h4v-40h-6v-12h6v-24h-4Z`

const STYLE =
  // Ambient: stars twinkle, candles bob and flicker, banners sway, the staircase drifts, the lake shimmers.
  '.wa-tw{animation:wa-tw 3.6s ease-in-out infinite alternate}.wa-tw2{animation-duration:5s;animation-delay:-2.2s}.wa-tw3{animation-duration:2.6s;animation-delay:-1.1s}' +
  '@keyframes wa-tw{from{opacity:.3}to{opacity:1}}' +
  '.wa-lit{animation:wa-tw 4s ease-in-out infinite alternate}.wa-lit2{animation-duration:5.4s;animation-delay:-2s}' +
  '.wa-cg{animation:wa-bob var(--b) ease-in-out infinite alternate}@keyframes wa-bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
  '.wa-fl{animation:wa-fl 1.8s ease-in-out infinite alternate}@keyframes wa-fl{from{opacity:.72}to{opacity:1}}' +
  '.wa-glows,.wa-fglow{animation:wa-fl 2.6s ease-in-out infinite alternate}.st-error .wa-fglow{animation-duration:.9s}' +
  '.wa-ban{transform-box:fill-box;transform-origin:50% 0;animation:wa-ban 7s ease-in-out infinite alternate}@keyframes wa-ban{from{transform:skewX(-1deg)}to{transform:skewX(1.2deg)}}' +
  '.wa-emb{opacity:.62}' +
  '.wa-stair{animation:wa-sway 8s ease-in-out infinite alternate}@keyframes wa-sway{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
  '.wa-bub{opacity:0;animation:wa-bub 2.4s ease-in infinite}@keyframes wa-bub{0%{opacity:0;transform:translateY(0)}20%{opacity:.8}100%{opacity:0;transform:translateY(-60px)}}' +
  '.wa-wisp{stroke-dasharray:.3 .7;animation:wa-wisp 5s linear infinite}@keyframes wa-wisp{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
  '.wa-fire{transform-box:fill-box;transform-origin:50% 100%;animation:wa-fire .5s ease-in-out infinite alternate}.wa-fire2{animation-duration:.37s}' +
  '@keyframes wa-fire{from{transform:scaleY(.82)}to{transform:scaleY(1.1)}}' +
  '.wa-owl1{animation:wa-fly 20s linear infinite}.wa-owl2,.wa-owl3,.wa-lt{opacity:0}' +
  '@keyframes wa-fly{0%{transform:translate(0,0)}50%{transform:translate(-1000px,44px)}100%{transform:translate(-2060px,-6px)}}' +
  '.wa-wing{transform-box:fill-box;transform-origin:50% 70%;animation:wa-wing .38s ease-in-out infinite alternate}@keyframes wa-wing{to{transform:scaleY(-.45)}}' +
  '.wa-oeye{transform-box:fill-box;transform-origin:center;animation:wa-blink 5.4s steps(1) infinite}@keyframes wa-blink{0%,92%{transform:scaleY(1)}93%,97%{transform:scaleY(.1)}}' +
  '.st-sleeping .wa-oeye{animation:none;transform:scaleY(.1)}' +
  '.wa-pw{transform-box:fill-box;transform-origin:50% 0}' +
  '.wa-tail{transform-box:fill-box;transform-origin:50% 0;animation:wa-tail 3s ease-in-out infinite alternate}@keyframes wa-tail{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}' +
  // The parchment floats; the quill writes while Claude works and the lines write themselves in.
  '.wa-flt{animation:wa-flt 4.4s ease-in-out infinite alternate}@keyframes wa-flt{from{transform:translateY(-3px)}to{transform:translateY(4px)}}' +
  '.wa-q{animation:wa-q var(--q) ease-in-out infinite}' +
  '@keyframes wa-q{0%,100%{transform:translate(0,0)}15%{transform:translate(-36px,-30px)}30%{transform:translate(-18px,-31px)}45%{transform:translate(0,-30px)}' +
  '55%{transform:translate(-34px,-20px)}70%{transform:translate(-10px,-21px)}85%{transform:translate(-30px,-10px)}}' +
  '.wa-gl{stroke-dasharray:1;stroke-dashoffset:0}' +
  '.st-responding .wa-gl,.st-tool .wa-gl,.st-run .wa-gl{animation:wa-write 4s linear var(--w) infinite backwards}' +
  '@keyframes wa-write{0%{stroke-dashoffset:1}20%,100%{stroke-dashoffset:0}}' +
  '.wa-spk{opacity:0;transform-box:fill-box;transform-origin:center}' +
  '.st-responding .wa-spk,.st-tool .wa-spk,.st-run .wa-spk{animation:wa-spk .7s ease-out infinite}' +
  '@keyframes wa-spk{0%{opacity:0;transform:scale(.4)}30%{opacity:1}100%{opacity:0;transform:scale(1.8)}}' +
  // Thinking: the candles drift about the hall.
  '.st-thinking .wa-cg{animation:wa-drift var(--b) ease-in-out infinite alternate}' +
  '@keyframes wa-drift{from{transform:translate(var(--nx),8px)}to{transform:translate(var(--dx),-22px)}}' +
  // Tool: the staircase swings away from its landing and back.
  '.st-tool .wa-stair{animation:wa-swing 3.4s ease-in-out infinite}@keyframes wa-swing{0%,100%{transform:rotate(0)}35%,50%{transform:rotate(21deg)}}' +
  // Read: a book floats open beside Claude and turns its pages.
  '.wa-rbook{opacity:0}.st-read .wa-rbook{animation:wa-pop .7s ease-out both}' +
  '@keyframes wa-pop{from{opacity:0;transform:translateY(24px) scale(.5)}to{opacity:1;transform:translateY(0) scale(1)}}' +
  '.st-read .wa-page{animation:wa-page 1s ease-in-out infinite}@keyframes wa-page{0%{transform:scaleX(1)}45%,100%{transform:scaleX(-1)}}' +
  // Web: owls fly the post across the hall, the perched one flaps and drops a letter on the desk.
  '.st-web .wa-owl{animation:wa-fly 4.6s linear infinite;opacity:1}.st-web .wa-lt{opacity:1}' +
  '.st-web .wa-pw{animation:wa-pw .34s ease-in-out 8 alternate}@keyframes wa-pw{to{transform:rotate(var(--r))}}' +
  '.wa-drop{opacity:0}.st-web .wa-drop{animation:wa-drop 1.5s cubic-bezier(.45,0,.75,1) .4s both}' +
  '@keyframes wa-drop{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:1}100%{opacity:1;transform:translate(34px,170px) rotate(8deg)}}' +
  // Run: the hall's candles give their flames to a spinning spiral, the books fly up and circle Claude's hat.
  '.st-run .wa-cands{animation:wa-dim .8s ease-out both}@keyframes wa-dim{to{opacity:.16}}' +
  '.wa-vx{opacity:0}.st-run .wa-vx{animation:wa-vin 1.1s cubic-bezier(.3,.7,.4,1) both}' +
  '@keyframes wa-vin{from{opacity:0;transform:scale(.25) rotate(-90deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}' +
  '.st-run .wa-vxs{animation:mv-spin 3.8s linear infinite}' +
  '.wa-ring{opacity:0}.st-run .wa-ring{animation:wa-ring 1.1s cubic-bezier(.3,.7,.4,1) both}' +
  '@keyframes wa-ring{from{opacity:0;transform:translateY(230px) scale(.3)}to{opacity:1;transform:translateY(0) scale(1)}}' +
  '.st-run .wa-orb{animation:mv-spin 3.6s linear infinite}.st-run .wa-orbk{animation:mv-spin-back 3.6s linear infinite}' +
  '.st-run .wa-flap{animation:wa-flap .42s ease-in-out infinite alternate}@keyframes wa-flap{to{transform:scaleX(.4)}}' +
  // Error: the cauldron boils over in green foam and smoke, clouds roll over the ceiling, the candles gutter.
  '.wa-foam,.wa-drip{transform-box:fill-box;transform:scaleY(0)}.wa-foam{transform-origin:50% 100%}.wa-drip{transform-origin:50% 0}' +
  '.st-error .wa-foam{animation:wa-grow .8s cubic-bezier(.3,1.3,.5,1) .15s both}.st-error .wa-drip{animation:wa-grow 1.3s ease-in .7s both}' +
  '@keyframes wa-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
  '.wa-smk{opacity:0;transform-box:fill-box;transform-origin:center}' +
  '.st-error .wa-smk{animation:wa-smk 2.8s ease-out var(--d) infinite}' +
  '@keyframes wa-smk{0%{opacity:0;transform:translate(0,0) scale(.4)}14%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),-400px) scale(2.2)}}' +
  '.wa-ggl,.wa-brewx{opacity:0}.st-error .wa-ggl,.st-error .wa-brewx{animation:wa-show .9s ease-out both}@keyframes wa-show{to{opacity:1}}' +
  '.st-error .wa-bub{animation-duration:.9s}' +
  '.wa-cloud{opacity:0}.st-error .wa-cloud{animation:wa-cloud 2s ease-out both}' +
  '@keyframes wa-cloud{from{opacity:0;transform:translateX(var(--cx))}to{opacity:1;transform:translateX(0)}}' +
  '.st-error .wa-fl{animation:wa-gut 1.4s ease-in-out infinite alternate}@keyframes wa-gut{from{opacity:.18}to{opacity:.5}}' +
  '.st-error .wa-glows{animation:none;opacity:.3}' +
  // Done: fireworks open over the towers, the coral starburst stays a while; the candles rise and burn bright.
  '.wa-fw{opacity:0}.st-done .wa-fw{animation:wa-fw 2.4s ease-out var(--d) both}' +
  '@keyframes wa-fw{0%{opacity:0;transform:scale(.15)}16%{opacity:.95}65%{opacity:.6}100%{opacity:0;transform:scale(1.12)}}' +
  '.st-done .wa-fwh{animation-name:wa-fwh;animation-duration:2s}' +
  '@keyframes wa-fwh{0%{opacity:0;transform:scale(.15)}20%{opacity:1}100%{opacity:.75;transform:scale(1)}}' +
  '.st-done .wa-cg{animation:wa-rise 2.6s ease-out both}@keyframes wa-rise{to{transform:translateY(-34px)}}' +
  '.st-done .wa-fl{animation:none;opacity:1}.st-done .wa-emb{animation:wa-show 1.4s ease-out .3s both}'

export function wizardAcademyWorld(): World {
  const left = px(WL, FAR)
  const right = px(WR, FAR)
  const edge = py(TOP, FAR)
  const floor = py(FLOOR, FAR)
  const w1 = arch(WL, 0.9, 0.64, 200, 820, 140)
  const w2 = arch(WL, 0.58, 0.5, 200, 820, 140)
  const courses = [260, 480, 700, 920]
    .map(Y => `M${at(WL, Y, 1)}L${at(WL, Y, FAR)}M${at(WR, Y, 1)}L${at(WR, Y, FAR)}`)
    .join('')
  const pilasters = [
    [WL, 0.615],
    [WL, 0.48],
    [WR, 0.8],
    [WR, 0.63],
    [WR, 0.5],
  ]
    .map(([X = WL, s = 1]) => `M${f(px(X, s) - 8 * s)} ${f(py(TOP, s))}h${f(16 * s)}V${f(py(FLOOR, s))}h${f(-16 * s)}Z`)
    .join('')
  const ribs = [0.9, 0.615, 0.48, FAR]
    .map(s => `M${at(WL, TOP, s)}${pointed(px(WL, s), py(TOP, s), px(WR, s), py(TOP, s), py(TOP - 560, s))}`)
    .join('')
  const floorLines =
    Array.from({ length: 12 }, (_, i) => `M${at(WL + i * 160, FLOOR, FAR)}L${at(WL + i * 160, FLOOR, 1)}`).join('') +
    [0.5, 0.6, 0.72, 0.86].map(s => `M${at(WL, FLOOR, s)}L${at(WR, FLOOR, s)}`).join('')
  const mullions =
    [0.813, 0.727].map(s => `M${f(px(WL, s))} ${f(py(120, s))}V${f(py(820, s))}`).join('') +
    [470, 660].map(Y => `M${at(WL, Y, 0.9)}L${at(WL, Y, 0.64)}`).join('')
  // Error: a bank of clouds rolling in from one side, each a flat-bottomed bank with two billows on top; the billows
  // catch the moon on their tops, except where they would cross the chat column.
  const clouds = (side: number): string => {
    let shapes = ''
    let rims = ''

    for (const [x, y, rx, ry] of [
      [120, 60, 230, 60],
      [340, 118, 200, 48],
      [190, 176, 190, 40],
    ] as const) {
      const cx = side < 0 ? x : 1600 - x

      shapes += `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${f(ry * 0.6)}"/>`

      for (const [bx, by, r] of [
        [cx - side * -rx * 0.35, y - ry * 0.35, ry * 0.8],
        [cx + side * -rx * 0.2, y - ry * 0.5, ry],
      ] as const) {
        shapes += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(r)}"/>`

        if (bx + r * 0.94 < 420 || bx - r * 0.94 > 1180) {
          rims += `M${f(bx - r * 0.94)} ${f(by - r * 0.34)}A${f(r)} ${f(r)} 0 0 1 ${f(bx + r * 0.94)} ${f(by - r * 0.34)}`
        }
      }
    }

    return (
      `<g class="wa-cloud" style="--cx:${side * 560}px"><g fill="#1e192f">${shapes}</g>` +
      `<path d="${rims}" fill="none" stroke="#6a6296" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/></g>`
    )
  }

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#05040a',
      furniture: OAK,
      metal: '#3a2216',
      paper: PAPER,
      light: { idle: '#c9a35a', work: GOLD, bright: '#fff0c4' },
      headTop: 232,
      glowAt: [342, 266],
      device,
      wear: {
        front:
          // A plain knitted scarf in one colour, its tail hanging on the far side.
          `<path d="M66 320H234V335H66Z" fill="${SCARF}"/>` +
          `<path d="M78 322v11M92 322v11M106 322v11M120 322v11M134 322v11M148 322v11M162 322v11M176 322v11M190 322v11M204 322v11M218 322v11" stroke="${KNIT}" stroke-width="2"/>` +
          `<g class="wa-tail"><path d="M78 332H102L106 374H82Z" fill="${SCARF}" stroke="#1f4a50" stroke-width="1.5"/>` +
          `<path d="M84 374v7M90 374v7M96 374v7M102 374v7" stroke="${KNIT}" stroke-width="2"/></g>` +
          // The pointed hat, its tip flopped back, gold stars and a crescent on it; the brim stays above the eyes.
          `<path d="M98 236C110 214 122 196 134 182C122 180 110 184 102 190C110 172 132 158 156 160C176 164 190 196 206 236Z" fill="${HAT}" stroke="${HAT_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
          '<path d="M160 166C177 174 188 200 199 230" fill="none" stroke="#6a78d0" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="${sparkle(148, 206, 7)}${sparkle(176, 222, 4.5)}${sparkle(124, 222, 4.5)}${sparkle(101, 191, 5)}" fill="${GOLD}"/>` +
          `<path d="M166 184a7 7 0 1 0 7 10a5.5 5.5 0 1 1 -7 -10Z" fill="${GOLD}" fill-opacity=".9"/>` +
          `<ellipse cx="152" cy="239" rx="88" ry="9" fill="${HAT}" stroke="${HAT_EDGE}" stroke-width="2"/>`,
      },
      seatArt:
        // A bench from the hall's long tables, its slab legs cut with pointed arches.
        `<g fill="${OAK}" stroke="${OAK_EDGE}" stroke-width="1.6"><rect x="92" y="350" width="120" height="12" rx="3"/>` +
        '<path d="M104 362H130V456H104ZM110 456V420Q117 404 124 420V456Z" fill-rule="evenodd"/>' +
        '<path d="M174 362H200V456H174ZM180 456V420Q187 404 194 420V456Z" fill-rule="evenodd"/></g>' +
        `<path d="M96 353H208" stroke="${GOLD}" stroke-opacity=".14" stroke-width="1.5"/>`,
      tableArt:
        // The near end of a long hall table on turned legs, a gold goblet at its end.
        `<g fill="${OAK}" stroke="${OAK_EDGE}" stroke-width="1.6"><rect x="160" y="330" width="314" height="16" rx="2"/><rect x="168" y="346" width="298" height="10"/>` +
        `<path d="${LEG(186)}"/><path d="${LEG(430)}"/></g>` +
        `<path d="M164 334H470" stroke="${GOLD}" stroke-opacity=".16" stroke-width="1.5"/>` +
        '<path d="M446 304H464L461 315Q455 320 449 315Z" fill="#c9a24a" stroke="#7a5a1a" stroke-width="1.2"/><path d="M455 318V326M448 329H462" stroke="#c9a24a" stroke-width="2.6"/>',
    },
    style: STYLE,
    scenery:
      '<defs>' +
      '<linearGradient id="wa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06050f"/><stop offset=".45" stop-color="#0d0b22"/><stop offset="1" stop-color="#110e24"/></linearGradient>' +
      '<linearGradient id="wa-rib" gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="0"><stop offset="0" stop-color="#2a2342"/><stop offset="1" stop-color="#2a2342" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="wa-wl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17131f"/><stop offset="1" stop-color="#0d0b15"/></linearGradient>' +
      '<linearGradient id="wa-wr" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#17131f"/><stop offset="1" stop-color="#0d0b15"/></linearGradient>' +
      '<linearGradient id="wa-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#09070f"/><stop offset="1" stop-color="#120d16"/></linearGradient>' +
      '<linearGradient id="wa-out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090e2a"/><stop offset=".75" stop-color="#1a2550"/><stop offset="1" stop-color="#121a3c"/></linearGradient>' +
      '<linearGradient id="wa-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a" stop-opacity=".04"/><stop offset="1" stop-color="#ffb850" stop-opacity=".3"/></linearGradient>' +
      '<radialGradient id="wa-cg"><stop offset="0" stop-color="#ffd27a" stop-opacity=".42"/><stop offset=".45" stop-color="#ffb850" stop-opacity=".14"/><stop offset="1" stop-color="#ffb850" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wa-orb"><stop offset="0" stop-color="#fff6d8"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wa-sm"><stop offset="0" stop-color="#b6ff8a" stop-opacity=".8"/><stop offset=".55" stop-color="#5fcf4f" stop-opacity=".45"/><stop offset="1" stop-color="#2a7a2a" stop-opacity="0"/></radialGradient>' +
      glowDef('wa-mw', '#6a5acd', 0.16) +
      glowDef('wa-mh', '#dfe6ff', 0.35) +
      glowDef('wa-vg', GOLD, 0.3) +
      glowDef('wa-gg', '#7cff5a', 0.3) +
      glowDef('wa-fire', '#ff9a3c', 0.34) +
      glowDef('wa-brg', '#3fe0b0', 0.26) +
      glowDef('wa-fwg', '#fff0c8', 0.4) +
      `<clipPath id="wa-w1"><path d="${w1}"/></clipPath><clipPath id="wa-w2"><path d="${w2}"/></clipPath>` +
      '</defs>' +
      // The enchanted ceiling: the night sky itself, a faint milky band, the vault's ribs fading up into it.
      '<rect width="1600" height="1000" fill="url(#wa-sky)"/>' +
      '<ellipse cx="800" cy="110" rx="820" ry="80" transform="rotate(-7 800 110)" fill="url(#wa-mw)"/>' +
      stars() +
      `<path d="${ribs}" fill="none" stroke="url(#wa-rib)" stroke-width="12"/>` +
      // Error: clouds roll in over the ceiling from both sides.
      clouds(-1) +
      clouds(1) +
      // Done: fireworks over the towers, the hero one kept just left of the chat column.
      firework(130, 96, 84, GOLD, 0.1) +
      firework(305, 150, 96, '#ffc2a6', 0.55, true) +
      firework(1440, 100, 84, '#ffe6a8', 0.3) +
      firework(1280, 196, 58, '#c9b6ff', 1.05) +
      // The walls, the far wall and the floor, with stone courses, pilasters and the cornice where the sky begins.
      `<path d="M${WL} ${TOP}L${f(left)} ${f(edge)}V${f(floor)}L${WL} ${FLOOR}Z" fill="url(#wa-wl)"/>` +
      `<path d="M${WR} ${TOP}L${f(right)} ${f(edge)}V${f(floor)}L${WR} ${FLOOR}Z" fill="url(#wa-wr)"/>` +
      `<rect x="${f(left)}" y="${f(edge)}" width="${f(right - left)}" height="${f(floor - edge)}" fill="#0c0a15"/>` +
      `<path d="M${WL} ${FLOOR}L${f(left)} ${f(floor)}H${f(right)}L${WR} ${FLOOR}Z" fill="url(#wa-floor)"/>` +
      `<path d="${floorLines}" stroke="#17121f" stroke-width="2"/>` +
      `<path d="${courses}" stroke="#1b1628" stroke-opacity=".8" stroke-width="2"/>` +
      `<path d="${pilasters}" fill="#191428" stroke="#251e36" stroke-width="1.5"/>` +
      `<path d="M${WL} ${TOP}L${f(left)} ${f(edge)}H${f(right)}L${WR} ${TOP}" fill="none" stroke="#1e1930" stroke-width="8"/>` +
      `<path d="M${WL} ${TOP + 6}L${f(left)} ${f(edge + 4)}H${f(right)}L${WR} ${TOP + 6}" fill="none" stroke="${GOLD}" stroke-opacity=".1" stroke-width="1.5"/>` +
      // The far wall: a tall dim window over the high table.
      `<path d="M712 600V400${pointed(712, 400, 888, 400, 318)}V600Z" fill="#0e1128" stroke="#1d1830" stroke-width="6"/>` +
      '<path d="M770 410V600M830 410V600M712 500H888" stroke="#0c0a15" stroke-width="5"/>' +
      '<path d="M520 640H1080V652H520Z" fill="#08060d"/><path d="M530 652H1070V676H530Z" fill="#0a080f"/>' +
      // The near window on the left wall: the moon, the school's towers on their cliff, the dark lake below.
      '<g clip-path="url(#wa-w1)"><rect y="100" width="270" height="700" fill="url(#wa-out)"/>' +
      '<circle cx="196" cy="262" r="74" fill="url(#wa-mh)"/><circle cx="196" cy="262" r="22" fill="#efe8d0" fill-opacity=".92"/>' +
      // Done: a burst seen through the glass, right over the towers.
      firework(104, 262, 62, '#ffe0a0', 0.35) +
      `<path d="${pip(40, 300)}${pip(120, 230)}${pip(70, 380)}${pip(160, 340)}" stroke="#e6e0ff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>` +
      '<path d="M0 585L30 560L70 575L120 548L170 570L220 552L270 566V640H0Z" fill="#0b1230"/>' +
      towers(
        [
          [22, 24, 452, 46],
          [56, 20, 496, 30],
          [90, 34, 404, 74],
          [132, 20, 470, 38],
          [160, 26, 508, 32],
          [196, 18, 526, 24],
        ],
        'M14 600V548H224V600Z',
        51,
      ) +
      `<path d="M0 596H262V630Q232 640 214 664H0Z" fill="${SIL}"/><rect y="650" width="270" height="150" fill="#050918"/>` +
      '<path class="wa-lit" d="M186 676h22M182 690h30M188 704h18M184 718h26" stroke="#efe8d0" stroke-opacity=".45" stroke-width="2"/>' +
      `<path d="M34 672v16M106 668v26M146 674v14" stroke="${LIT}" stroke-opacity=".25" stroke-width="2"/>` +
      `<path d="${mullions}" stroke="#1b1630" stroke-width="5"/></g>` +
      `<path d="${w1}" fill="none" stroke="#262038" stroke-width="10"/>` +
      `<path d="M${at(WL, 834, 0.9)}L${at(WL, 834, 0.64)}" stroke="#2a2340" stroke-width="9"/>` +
      // A farther window, another tower in it.
      '<g clip-path="url(#wa-w2)"><rect x="280" y="210" width="90" height="460" fill="url(#wa-out)"/>' +
      towers(
        [
          [298, 14, 470, 36],
          [322, 18, 440, 46],
          [346, 12, 500, 24],
        ],
        'M290 600V540H368V600Z',
        77,
      ) +
      `<rect x="280" y="598" width="90" height="70" fill="#050918"/><path d="M${f(px(WL, 0.54))} 200V700" stroke="#1b1630" stroke-width="4"/></g>` +
      `<path d="${w2}" fill="none" stroke="#262038" stroke-width="7"/>` +
      // Moonlight from the window across the floor.
      '<path d="M60 700L236 650L620 1000H170Z" fill="#aab6ff" fill-opacity=".04"/>' +
      // The school's banners on the right wall.
      banner(0.74, 0.69, 0) +
      banner(0.57, 0.535, -2.6) +
      // The long tables.
      [250, 615, 985, 1350].map(longTable).join('') +
      // The cauldron by the left wall, on its fire.
      `<g class="mv-b">${cauldron()}</g>` +
      // The staircase that hangs from a landing high on the right wall.
      `<g class="mv-r"><g class="mv-t">${staircase()}</g></g>` +
      // The floating candles, and the spiral they become when a command runs.
      `<g class="wa-cands">${candles(candleField())}</g>` +
      vortex() +
      // Owls under the ceiling: one glides past now and then, three carry the post on web.
      owl(1720, 160, 1.1, 1, -6) +
      owl(1720, 236, 1.2, 2, -0.6) +
      owl(1720, 112, 1.4, 3, -2.9),
    nook:
      // Two candles floating close over the desk.
      nearCandle(150, -40, 1.4, 0) +
      nearCandle(330, -120, 1.25, -2.4) +
      // The owl on its wall perch, whose wings open on web.
      '<path d="M420 140H362q-12 0 -12 -10M420 186L384 140" fill="none" stroke="#1c1624" stroke-width="5" stroke-linecap="round"/>' +
      '<g transform="translate(388 112)">' +
      '<path class="wa-pw" style="--r:38deg" d="M-18 -8C-28 4 -26 20 -12 28L-10 0Z" fill="#2a1f1c"/>' +
      '<path class="wa-pw" style="--r:-38deg" d="M18 -8C28 4 26 20 12 28L10 0Z" fill="#2a1f1c"/>' +
      '<path d="M0 -28C15 -28 20 -14 18 2C16 18 9 28 0 28C-9 28 -16 18 -18 2C-20 -14 -15 -28 0 -28Z" fill="#3e2f2a"/>' +
      '<path d="M-10 4Q0 0 10 4Q12 18 0 24Q-12 18 -10 4Z" fill="#5c4a40"/>' +
      '<path d="M-15 -18Q0 -30 15 -18Q17 -6 0 0Q-17 -6 -15 -18Z" fill="#6e5a4c"/>' +
      `<g class="wa-oeye"><path d="${dot(-6, -12, 4.6)}${dot(6, -12, 4.6)}" fill="${GOLD}"/><path d="${dot(-6, -12, 2)}${dot(6, -12, 2)}" fill="#0a0608"/></g>` +
      '<path d="M-2 -6L0 -1L2 -6Z" fill="#c9a24a"/><path d="M-6 28v4M6 28v4" stroke="#c9a24a" stroke-width="2"/></g>' +
      // Books stacked on the floor under the table.
      '<g stroke="#0a0608" stroke-width="1.5"><rect x="296" y="440" width="96" height="16" rx="2" fill="#4a1e2a"/>' +
      '<rect x="304" y="426" width="84" height="14" rx="2" fill="#24385a"/><rect x="298" y="414" width="88" height="12" rx="2" fill="#3a4a2a"/></g>' +
      // Read: the book that floats open beside Claude.
      '<g transform="translate(96 92)"><g class="wa-rbook">' +
      `<ellipse cx="0" cy="10" rx="56" ry="40" fill="url(#wa-cg)"/>` +
      '<path d="M0 4L-36 -4V22L0 30ZM0 4L36 -4V22L0 30Z" fill="#4a1e2a"/>' +
      `<path d="M0 2L-31 -5V19L0 27ZM0 2L31 -5V19L0 27Z" fill="${PAPER}"/>` +
      `<path d="M-26 2L-6 6M-26 8L-6 12M-26 14L-10 17M6 6L26 2M6 12L26 8M6 17L22 14" stroke="${GOLD}" stroke-width="1.6"/>` +
      `<path class="wa-page" d="M0 2L31 -5V19L0 27Z" fill="${PAPER}" fill-opacity=".95" stroke="#c9b48a" stroke-width="1"/></g></g>`,
    front:
      bookRing() +
      // Web: the letter the owl drops onto the desk.
      `<g transform="translate(386 150)"><g class="wa-drop"><rect x="-11" y="-7" width="22" height="14" rx="1.5" fill="${PAPER}"/>` +
      `<path d="M-11 -6L0 1L11 -6" fill="none" stroke="#9a8a6a" stroke-width="1.2"/><circle cy="1" r="2.6" fill="${CORAL}"/></g></g>`,
  }
}
