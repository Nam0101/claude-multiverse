import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Coral Reef: a snorkeller at a table-coral desk on the sand of a shallow reef at dusk. Warm light falls through the
// rippling surface in slanting rays, caustics wobble over the coral, sea fans sway and a school of fish drifts
// overhead. A command whips the school into a living tornado over the reef; an error puffs up a startled pufferfish
// while a shark cruises along the surface; done brings a sea turtle gliding past and sets the coral glowing.
const INK = '#031012'
const SAND = '#1a2e2b'
const SILVER = '#a6ccd0'
const PINK = '#a3465a'
const RED = '#ad4b40'
const ORANGE = '#ad683e'
const PURPLE = '#6a4e8c'
const OCHRE = '#957d42'
const OLIVE = '#6a7844'
const TEAL = '#3e8a80'
const FAN_N = '#8a4472'
const GLOW_G = '#7dffcc'
const GLOW_P = '#ff8cc0'
const CASE = '#1e3c42'
const BUMPER = '#c4463c'

/** A small fish centred on (x, y), `len` long, facing right (1) or left (-1), as path data. */
function fish(x: number, y: number, len: number, dir: number): string {
  const h = len * 0.42
  const n = x + (dir * len) / 2
  const c = x + (dir * len) / 8
  const t = x - dir * len * 0.3
  const e = x - (dir * len) / 2

  return `M${f(n)} ${f(y)}Q${f(c)} ${f(y - h)} ${f(t)} ${f(y)}Q${f(c)} ${f(y + h)} ${f(n)} ${f(y)}ZM${f(t + dir * 2)} ${f(y)}L${f(e)} ${f(y - h * 0.6)}V${f(y + h * 0.6)}Z`
}

/** A loose school in an ellipse, split in two paths so the halves can drift apart a little. */
function school(cx: number, cy: number, rx: number, ry: number, count: number, seed: number, dir: number): [string, string] {
  const next = random(seed)
  let a = ''
  let b = ''

  for (let i = 0; i < count; i += 1) {
    const ang = next() * Math.PI * 2
    const d = Math.sqrt(next())
    const p = fish(cx + Math.cos(ang) * rx * d, cy + Math.sin(ang) * ry * d, 11 + next() * 8, dir)

    if (i % 2 === 0) a += p
    else b += p
  }

  return [a, b]
}

/** Branches from (0, 0) upward, forking in two, sorted by depth into thick, middle and fine strokes. */
function branches(next: () => number, depth: number, spread: number, len: number, bend: number, limit: number): [string, string, string] {
  let thick = ''
  let mid = ''
  let fine = ''
  const grow = (x: number, y: number, a: number, l: number, k: number): void => {
    const x2 = x + Math.sin(a) * l
    const y2 = y - Math.cos(a) * l
    const seg = `M${f(x)} ${f(y)}Q${f((x + x2) / 2 + (next() - 0.5) * l * bend)} ${f((y + y2) / 2)} ${f(x2)} ${f(y2)}`

    if (k < 2) thick += seg
    else if (k < 4) mid += seg
    else fine += seg

    if (k < depth) {
      const s = spread / Math.pow(1.55, k)
      const turn = (v: number) => Math.max(-limit, Math.min(limit, v))

      grow(x2, y2, turn(a - s * (0.45 + next() * 0.6)), l * (0.7 + next() * 0.16), k + 1)
      grow(x2, y2, turn(a + s * (0.45 + next() * 0.6)), l * (0.7 + next() * 0.16), k + 1)
    }
  }

  grow(0, 0, 0, len, 0)

  return [thick, mid, fine]
}

/** A sea fan: a translucent web on a forking lattice with a fine mesh across it, swaying from its foot. */
function seaFan(x: number, y: number, h: number, color: string, seed: number, delay: number): string {
  const next = random(seed)
  const [a, b, c] = branches(next, 4, 0.72, h * 0.34, 0.35, 0.72)
  const w = h * 0.6
  let mesh = ''

  for (const k of [0.34, 0.52, 0.7, 0.88]) {
    const pts: string[] = []
    const span = 0.2 + k * 0.42

    for (let s = -4; s <= 4; s += 1) {
      const ang = (s / 4) * span

      pts.push(`${f(Math.sin(ang) * h * k * 0.82 + (next() - 0.5) * 6)} ${f(-Math.cos(ang) * h * k + (next() - 0.5) * 6)}`)
    }

    mesh += `M${pts.join('L')}`
  }

  return (
    `<g transform="translate(${x} ${y})"><g class="cr-fan" style="animation-delay:${delay}s" fill="none" stroke="${color}" stroke-linecap="round">` +
    `<path d="M-4 0C${f(-w)} ${f(-h * 0.3)} ${f(-w)} ${f(-h * 0.96)} 0 ${f(-h)}C${f(w)} ${f(-h * 0.96)} ${f(w)} ${f(-h * 0.3)} 4 0Z" fill="${color}" fill-opacity=".12" stroke="none"/>` +
    `<path d="${mesh}" stroke-width="1.4" stroke-opacity=".7"/><path d="${c}" stroke-width="2"/><path d="${b}" stroke-width="3.4"/><path d="${a}" stroke-width="6.4"/></g></g>`
  )
}

/** A brain coral: a dome with meandering grooves and the dusk on its shoulder. */
function brain(x: number, y: number, r: number, color: string, groove: string, seed: number): string {
  const next = random(seed)
  const ry = r * 0.72
  let grooves = ''

  for (let k = 1; k <= 3; k += 1) {
    const rr = r * (1 - k * 0.24)
    const ph = next() * 6
    const pts: string[] = []

    for (let s = 0; s <= 12; s += 1) {
      const a = Math.PI + (s / 12) * Math.PI
      const w = Math.sin(s * 2.1 + ph) * r * 0.06

      pts.push(`${f(x + Math.cos(a) * (rr + w))} ${f(y + Math.sin(a) * (rr + w) * 0.72)}`)
    }

    grooves += `M${pts.join('L')}`
  }

  return (
    `<path d="M${f(x - r)} ${f(y)}A${f(r)} ${f(ry)} 0 0 1 ${f(x + r)} ${f(y)}Z" fill="${color}"/>` +
    `<path d="${grooves}" fill="none" stroke="${groove}" stroke-width="${f(Math.max(2, r * 0.05))}" stroke-linejoin="round"/>` +
    `<path d="M${f(x - r * 0.86)} ${f(y - ry * 0.5)}Q${f(x - r * 0.6)} ${f(y - ry * 1.02)} ${f(x + r * 0.1)} ${f(y - ry * 0.99)}" fill="none" stroke="#f2c492" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>`
  )
}

/** Tube sponges standing on (x, y): [offset, height, width, lean] each, with dark mouths. */
function tubes(x: number, y: number, list: readonly (readonly [number, number, number, number])[], color: string, rim: string): string {
  let body = ''
  let holes = ''

  for (const [dx, h, w, lean] of list) {
    const bx = x + dx
    const tx = bx + lean

    body += `M${f(bx - w / 2)} ${y}L${f(tx - w * 0.62)} ${f(y - h)}H${f(tx + w * 0.62)}L${f(bx + w / 2)} ${y}Z`
    holes += `M${f(tx - w * 0.62)} ${f(y - h)}a${f(w * 0.62)} ${f(w * 0.2)} 0 1 0 ${f(w * 1.24)} 0a${f(w * 0.62)} ${f(w * 0.2)} 0 1 0 ${f(-w * 1.24)} 0Z`
  }

  return `<path d="${body}" fill="${color}"/><path d="${holes}" fill="${INK}" stroke="${rim}" stroke-width="2.4"/>`
}

/** A table coral: a flat scalloped plate on a short stalk. */
function tableCoral(x: number, y: number, n: number, color: string, rim: string): string {
  const w = n * 14

  return (
    `<path d="M${x - 9} ${y + 3}Q${x - 12} ${y + 26} ${x - 20} ${y + 42}H${x + 20}Q${x + 12} ${y + 26} ${x + 9} ${y + 3}Z" fill="${color}" fill-opacity=".85"/>` +
    `<path d="M${x - w / 2} ${y}Q${x} ${y - 14} ${x + w / 2} ${y}v3${'q-7 7 -14 0'.repeat(n)}Z" fill="${color}"/>` +
    `<path d="M${x - w / 2} ${y}Q${x} ${y - 14} ${x + w / 2} ${y}" fill="none" stroke="${rim}" stroke-opacity=".6" stroke-width="2.4"/>`
  )
}

/** Branching coral, thick and blunt. */
function staghorn(x: number, y: number, len: number, color: string, seed: number): string {
  const [a, b] = branches(random(seed), 3, 1.1, len, 0.2, 1.1)

  return (
    `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-linecap="round">` +
    `<path d="${a}" stroke-width="${f(len * 0.26)}"/><path d="${b}" stroke-width="${f(len * 0.17)}"/></g>`
  )
}

/** A sea anemone: a squat foot and a crown of tentacles that waves. */
function anemone(x: number, y: number, r: number, base: string, tip: string, delay: number): string {
  let d = ''

  for (let i = 0; i < 9; i += 1) {
    const a = -Math.PI / 2 + (i - 4) * 0.3
    const l = r * (0.8 + (i % 3) * 0.16)

    d += `M${f(Math.cos(a) * r * 0.3)} 0q${f(Math.cos(a) * l * 0.5 + 5)} ${f(Math.sin(a) * l * 0.5)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}`
  }

  return (
    `<g transform="translate(${x} ${y})"><g class="cr-ane" style="animation-delay:${delay}s"><path d="${d}" fill="none" stroke="${tip}" stroke-width="${f(r * 0.2)}" stroke-linecap="round"/></g>` +
    `<path d="M${f(-r * 0.55)} 6Q${f(-r * 0.5)} ${f(-r * 0.2)} 0 ${f(-r * 0.22)}Q${f(r * 0.5)} ${f(-r * 0.2)} ${f(r * 0.55)} 6Z" fill="${base}"/></g>`
  )
}

/** Sea whips: three thin rods from one foot, bending in the swell. */
function whip(x: number, y: number, h: number, color: string, delay: number, seed: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < 3; i += 1) {
    const lean = (i - 1) * 18 + (next() - 0.5) * 12

    d += `M0 0Q${f(lean * 0.2)} ${f(-h * 0.45)} ${f(lean)} ${f(-h * (0.72 + next() * 0.28))}`
  }

  return `<g transform="translate(${x} ${y})"><g class="cr-whip" style="animation-delay:${delay}s"><path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/></g></g>`
}

/** A five-armed star centred on (x, y). */
function star(x: number, y: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.42

    return `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`
  })

  return `M${pts.join('L')}Z`
}

/** Tiny squares scattered in ellipses: [cx, cy, rx, ry, count] each. */
function specks(next: () => number, list: readonly (readonly [number, number, number, number, number])[], size: number): string {
  let d = ''

  for (const [cx, cy, rx, ry, n] of list) {
    for (let i = 0; i < n; i += 1) {
      const a = next() * Math.PI * 2
      const r = Math.sqrt(next())

      d += `M${f(cx + Math.cos(a) * rx * r)} ${f(cy + Math.sin(a) * ry * r)}h${size}v${size}h-${size}z`
    }
  }

  return d
}

/** A wobbly net of light lines, as the surface focuses it on whatever lies below. */
function caustics(next: () => number, x0: number, y0: number, w: number, h: number, cell: number): string {
  let d = ''
  const half = cell / 2
  const j = () => Math.round((next() - 0.5) * cell * 0.55)

  for (let y = y0; y <= y0 + h; y += cell) {
    d += `M${x0} ${y + j()}`
    for (let x = half; x <= w; x += half) d += `l${half} ${j()}`
  }

  for (let x = x0; x <= x0 + w; x += cell) {
    d += `M${x + j()} ${y0}`
    for (let y = half; y <= h; y += half) d += `l${j()} ${half}`
  }

  return d
}

/**
 * The fish tornado: a dim column of distant fish, and rings of nearer ones turning around it. Each ring is a dashed
 * circle squashed flat, so its dashes stay level fish-shaped streaks all the way round as it turns.
 */
function tornado(next: () => number): string {
  const top = 130
  const tall = 510
  const centre = (t: number) => 236 + Math.sin(t * 3.4) * 14 + t * 22
  const radius = (t: number) => 34 + 142 * Math.pow(1 - t, 1.1)
  const left: string[] = []
  const right: string[] = []

  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12

    left.push(`${f(centre(t) - radius(t) * 0.9)} ${f(top + t * tall)}`)
    right.push(`${f(centre(t) + radius(t) * 0.9)} ${f(top + t * tall)}`)
  }

  const dash = () => Array.from({ length: 7 }, () => `${Math.round(6 + next() * 14)} ${Math.round(8 + next() * 40)}`).join(' ')
  let rings = ''

  // Rings at uneven heights and depths, silver and dark in turn, so the column reads as a crowd and not a coil.
  for (let i = 0; i < 16; i += 1) {
    const t = Math.min(1, (i + next() * 0.8) / 15)
    const r = radius(t) * (0.7 + next() * 0.38)

    rings +=
      `<g transform="translate(${f(centre(t) + (next() - 0.5) * 14)} ${f(top + t * tall)}) scale(1 ${f(0.26 + next() * 0.1)})">` +
      `<circle class="cr-rg" style="animation-duration:${f(3.4 - t * 1.7)}s;animation-delay:${f(-next() * 3)}s" r="${f(r)}" ` +
      `${i % 3 === 1 ? 'stroke="#4d7884" ' : ''}stroke-width="${Math.round(10 + next() * 6)}" stroke-dasharray="${dash()}"/></g>`
  }

  // A few fish near enough to see whole, swimming round the column: left in front, right behind.
  const laps: readonly (readonly [number, number, number])[] = [
    [0.12, 0, 0],
    [0.16, 0, -1.1],
    [0.22, 0, -2.2],
    [0.58, 1, -0.4],
    [0.63, 1, -1.3],
    [0.68, 1, -2],
  ]
  const hero = laps
    .map(
      ([t, k, d]) =>
        `<g transform="translate(${f(centre(t))} ${f(top + t * tall)})"><g class="cr-o${k}" style="animation-delay:${d}s"><path d="${fish(0, 0, 30, 1)}" fill="#c4e2e4"/></g></g>`,
    )
    .join('')

  return `<path d="M${left.join('L')}L${right.reverse().join('L')}Z" fill="url(#cr-fun)"/><g fill="none" stroke="${SILVER}" stroke-opacity=".85" stroke-linecap="round">${rings}</g>${hero}`
}

/** One lap round the column: in front the fish swims left and looks bigger, behind it swims right, smaller and dim. */
function orbit(name: string, rx: number): string {
  const frames = Array.from({ length: 13 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2
    const s = 1 + 0.25 * Math.sin(a)

    return `${f((k / 12) * 100)}%{transform:translate(${f(rx * Math.cos(a))}px,${f(rx * 0.3 * Math.sin(a))}px) scale(${f(Math.sin(a) > 0.01 ? -s : s)},${f(s)});opacity:${f(0.75 + 0.25 * Math.sin(a))}}`
  }).join('')

  return `@keyframes ${name}{${frames}}`
}

/** A reef fish that swims out along its beat, turns and swims back. */
function reefFish(body: string, x: number, y: number, s: number, w: number, secs: number, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="cr-sw" style="--w:${f(w / s)}px;--d:${secs}s;animation-delay:${delay}s">${body}</g></g>`
}

const TANG = `<path d="M20 0Q12 -15 -6 -13Q-14 -7 -13 0Q-14 7 -6 13Q12 15 20 0ZM-11 0L-24 -9L-21 0L-24 9Z" fill="#a8873e"/><circle cx="11" cy="-3" r="2" fill="${INK}"/>`
const ANGEL =
  '<path d="M18 0Q12 -12 -2 -12L-14 -30L-9 -9Q-12 0 -9 9L-14 30L-2 12Q12 12 18 0ZM-9 0L-19 -8V8Z" fill="#53639c"/>' +
  `<path d="M6 -11V11M-2 -12V12" stroke="#d2b85e" stroke-opacity=".75" stroke-width="2.6"/><circle cx="11" cy="-3" r="1.8" fill="${INK}"/>`
const BUTTERFLY =
  '<path d="M16 0Q10 -14 -6 -12Q-14 -6 -14 0Q-14 6 -6 12Q10 14 16 0ZM-12 0L-21 -7V7Z" fill="#b5ad8c"/>' +
  '<path d="M8 -11Q5 0 8 11" fill="none" stroke="#1c2422" stroke-width="4"/><path d="M-7 -10Q-10 0 -7 10" fill="none" stroke="#c28a3a" stroke-width="3"/>'
const SQUIRREL =
  '<path d="M18 0Q14 -9 -2 -9Q-12 -6 -14 0Q-12 6 -2 9Q14 9 18 0ZM-13 0L-24 -8L-21 0L-24 8ZM-2 -9L4 -14L10 -7Z" fill="#b2463b"/>' +
  `<circle cx="10" cy="-2" r="3" fill="#e8d8c8" fill-opacity=".8"/><circle cx="11" cy="-2" r="1.5" fill="${INK}"/>`

/** The reef shark, facing left: one dark silhouette with a swaying tail and a rim of dusk along its back. */
const SHARK =
  '<g transform="translate(148 0)"><g class="cr-tail"><path d="M0 -10L62 -78Q52 -30 40 2Q56 30 66 46L0 10Z" fill="#06171c"/></g></g>' +
  '<path d="M-200 4Q-186 -18 -140 -24Q-80 -32 -36 -34L-10 -96Q4 -96 14 -34Q80 -28 152 -9V10Q80 22 10 26L-6 66Q-22 60 -30 28Q-100 28 -150 18Q-192 16 -200 4Z" fill="#06171c"/>' +
  '<path d="M60 -26L74 -46L84 -22Z" fill="#06171c"/>' +
  '<path d="M-196 0Q-180 -18 -140 -24Q-80 -32 -36 -34M14 -34Q80 -28 150 -9M-10 -96L-36 -34" fill="none" stroke="#7fb0b2" stroke-opacity=".32" stroke-width="2.4"/>' +
  '<path d="M-122 -10V10M-112 -11V12M-102 -11V12" stroke="#17343c" stroke-width="2.4"/><circle cx="-164" cy="-6" r="2.6" fill="#2c4c52"/>'

/** The sea turtle, facing right; its flippers row from the shoulder. */
const TURTLE =
  '<g transform="translate(30 -14)"><g class="cr-fl cr-fl2"><path d="M0 0Q-20 -40 -70 -58Q-40 -30 -12 8Z" fill="#3a4630"/></g></g>' +
  '<path d="M-58 -10Q-80 -22 -90 -14Q-78 -6 -60 -2Z" fill="#3a4630"/>' +
  '<path d="M50 -8Q70 -18 88 -12Q100 -6 96 2Q86 10 66 8Q54 6 50 2Z" fill="#5d6c4c"/><circle cx="84" cy="-6" r="2.4" fill="#0a1208"/>' +
  '<path d="M-70 0Q-64 -40 -10 -44Q50 -46 66 -4Q60 26 -4 28Q-62 26 -70 0Z" fill="#525c32"/>' +
  '<path d="M-40 -32L-20 -14L10 -16L32 -34M-20 -14L-28 16M10 -16L18 18M-58 -6L-20 -14M10 -16L56 -10" fill="none" stroke="#2e361e" stroke-width="3"/>' +
  '<path d="M-62 -18Q-40 -44 -6 -44Q40 -44 60 -18" fill="none" stroke="#e8b07a" stroke-opacity=".4" stroke-width="3"/>' +
  '<g transform="translate(26 12)"><g class="cr-fl"><path d="M0 0Q-10 44 -64 70Q-36 30 -16 -4Z" fill="#5d6c4c"/></g></g>' +
  '<path d="M-56 14Q-78 30 -86 26Q-78 14 -60 6Z" fill="#5d6c4c"/>'

/** The pufferfish: a plump tan fish whose spines only show when it puffs up. */
function puffer(): string {
  const spines = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2

    return `M${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 13)}L${f(Math.cos(a) * 25)} ${f(Math.sin(a) * 19)}`
  }).join('')

  return (
    '<path d="M-18 0L-30 -9L-27 0L-30 9Z" fill="#7a6a40"/>' +
    `<path class="cr-spk" d="${spines}" stroke="#ddd3a8" stroke-width="1.8" stroke-linecap="round"/>` +
    '<ellipse rx="20" ry="15" fill="#8e7e4c"/><path d="M-17 4Q0 18 18 3Q2 9 -17 4Z" fill="#d4cba6" fill-opacity=".7"/>' +
    '<path d="M-8 -8h3v3h-3zM2 -11h3v3h-3zM-14 -2h3v3h-3zM-3 -3h3v3h-3zM7 -5h2v2h-2z" fill="#3a3220"/>' +
    '<path d="M2 2Q-3 11 -8 4Z" fill="#6a5a30"/><circle cx="11" cy="-4" r="3.6" fill="#e8e0c0"/><circle cx="12" cy="-4" r="1.9" fill="#0a0a08"/>'
  )
}

/** The rugged laptop on the coral, a starfish on the rim and an anemone at the end of the desk. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const screen =
    activity === 'run'
      ? `<rect class="cr-prog" x="332" y="296" width="44" height="5" fill="${light}" fill-opacity=".9"/>`
      : `<path d="M330 300q6 -6 12 0t12 0t12 0t12 0" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="2"/>`
  // Startled, the anemone pulls its tentacles in.
  const crown =
    activity === 'error'
      ? '<path d="M416 330Q418 314 430 312Q442 314 444 330Z" fill="#5a3a6a"/><path d="M422 316Q430 308 438 316" fill="none" stroke="#c77fae" stroke-width="4" stroke-linecap="round"/>'
      : anemone(430, 324, 17, '#5a3a6a', '#c77fae', 0)

  return (
    `<rect x="242" y="321" width="104" height="9" rx="3" fill="${CASE}"/>` +
    keys +
    `<path d="M300 326L316 234L400 238L394 326Z" fill="${CASE}" stroke="#2f5c62" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M300 326L303 311M394 326L396 311M316 234L318 248M400 238L398 252" stroke="${BUMPER}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M313 318L326 246L388 249L383 318Z" fill="#041412"/><path d="M313 318L326 246L388 249L383 318Z" fill="${light}" fill-opacity=".14"/>` +
    `<path d="${fish(356, 272, 28, 1)}" fill="${light}" fill-opacity=".75"/>` +
    screen +
    crown +
    `<path d="${star(414, 339, 9)}" fill="${BUMPER}"/>`
  )
}

export function coralReefWorld(): World {
  const next = random(41)
  const ray = (x0: number, w0: number, slant: number): string =>
    `<path class="cr-ray" style="animation-duration:${f(6 + next() * 5)}s;animation-delay:${f(-next() * 6)}s" d="M${f(x0)} -10H${f(x0 + w0)}L${f(x0 + slant + w0 * 3.4)} 1000H${f(x0 + slant)}Z"/>`
  const raysL = Array.from({ length: 6 }, (_, i) => ray(-120 + i * 92 + next() * 30, 24 + next() * 36, 330)).join('')
  const raysR = Array.from({ length: 3 }, (_, i) => ray(1250 + i * 112 + next() * 30, 22 + next() * 30, 330)).join('')
  const ripple = (y: number, amp: number, stroke: string, op: number, w: number) =>
    `<path d="M-140 ${y}q35 ${-amp} 70 0${'t70 0'.repeat(27)}" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${w}"/>`
  const glints = Array.from(
    { length: 7 },
    (_, i) => `<ellipse class="cr-gli" style="animation-delay:${f(-i * 0.9)}s" cx="${f(60 + i * 62 + next() * 30)}" cy="${f(8 + next() * 36)}" rx="${f(8 + next() * 14)}" ry="1.6" fill="#fff0d8"/>`,
  ).join('')
  const motes = specks(next, [[800, 500, 820, 520, 40]], 2.2)
  const [schA, schB] = school(230, 250, 170, 70, 24, 5, -1)
  const [schC, schD] = school(1420, 190, 130, 46, 12, 6, -1)
  // Far coral heads along the distant reef line.
  let heads = ''

  for (let x = -40; x < 1660; x += 40 + next() * 50) {
    const r = 12 + next() * 26

    heads += `M${f(x)} ${f(778 - Math.sin(x * 0.004) * 16)}a${f(r)} ${f(r * 0.8)} 0 0 1 ${f(2 * r)} 0Z`
  }

  const bubbles = [
    [150, 600, 0, 8],
    [292, 590, -2.6, 10],
    [62, 630, -5, 9],
    [384, 640, -1.3, 7],
    [210, 650, -4, 11],
  ]
    .map(([x, y, d, s]) => `<circle class="cr-bub" style="animation-delay:${d}s;--dx:${f((next() - 0.5) * 40)}px;animation-duration:${s}s" cx="${x}" cy="${y}" r="${f(3 + next() * 4)}"/>`)
    .join('')
  const cauL = caustics(next, -40, 420, 500, 500, 76)
  const cauR = caustics(next, 1150, 840, 500, 180, 64)
  const pink = specks(next, [[118, 380, 130, 170, 28], [200, 600, 44, 30, 7], [352, 480, 80, 100, 10]], 3)
  const green = specks(next, [[246, 552, 84, 8, 9], [36, 590, 62, 36, 10], [404, 650, 44, 24, 6], [104, 640, 34, 40, 6]], 3)
  const nookPink = specks(next, [[390, -60, 150, 150, 24]], 3)
  const nookGreen = specks(next, [[440, 410, 70, 40, 9], [34, 380, 30, 50, 7]], 3)
  const sandLines = [880, 912, 948, 984].map((y, i) => `M-40 ${y}Q${300 + i * 40} ${y - 14} ${640 + i * 30} ${y}T1700 ${y - 6}`).join('')
  const anthias = [
    [300, -150, 0],
    [352, -60, -1.2],
    [226, -206, -2.1],
    [180, -110, -0.6],
  ]
    .map(([x, y, d]) => `<g transform="translate(${x} ${y})"><g class="cr-an" style="animation-delay:${d}s"><path d="${fish(0, 0, 17, -1)}" fill="#cf6f3c"/></g></g>`)
    .join('')
  const trail = (cls: string, x: number, y: number, n: number) =>
    Array.from(
      { length: n },
      (_, i) => `<circle class="${cls}" style="animation-delay:${f(i * 0.27)}s;--dx:${f((next() - 0.5) * 26)}px" cx="${x}" cy="${y}" r="${f(2.6 + next() * 3)}"/>`,
    ).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: INK,
      furniture: '#2a3a38',
      metal: CASE,
      paper: '#e4eee8',
      light: { idle: '#2c9a90', work: '#56d6c6', bright: '#bdfcee' },
      headTop: 239,
      glowAt: [356, 282],
      device,
      wear: {
        // The snorkel rises behind the far side, so raised arms stay in front of it.
        behind:
          '<path d="M66 300Q52 298 52 282V204" fill="none" stroke="#1c3a40" stroke-width="10" stroke-linecap="round"/>' +
          '<path d="M52 288V212" stroke="#3d7478" stroke-opacity=".5" stroke-width="2.4"/>' +
          `<path d="M52 210V194" stroke="${BUMPER}" stroke-width="13" stroke-linecap="round"/>`,
        // A wide glass mask: a clear lens over both eyes, a dark rubber frame, the strap in coral red.
        front:
          `<path d="M70 272H86V284H70ZM224 272H230V284H224Z" fill="${BUMPER}"/>` +
          '<rect x="80" y="240" width="150" height="92" rx="20" fill="none" stroke="#2f8a88" stroke-opacity=".55" stroke-width="2.4"/>' +
          '<rect x="84" y="246" width="142" height="80" rx="16" fill="#c8f4f0" fill-opacity=".13" stroke="#10262a" stroke-width="6"/>' +
          '<path d="M210 256H220L210 272H200Z" fill="#ffffff" fill-opacity=".35"/>' +
          '<path d="M140 326Q142 338 156 340Q170 338 172 326Z" fill="#c8f4f0" fill-opacity=".12" stroke="#10262a" stroke-width="4"/>',
      },
      seatArt:
        // A giant clam on a rock: ribbed shells and the blue mantle showing in the gap.
        '<path d="M108 410Q102 436 108 456H194Q200 436 194 410Z" fill="#162a2c"/>' +
        '<path d="M96 382Q100 410 151 414Q202 410 206 382Z" fill="#776f5c"/>' +
        '<path d="M96 380Q94 356 112 352H190Q208 356 206 380Z" fill="#878068"/>' +
        '<path d="M96 380L106 374L116 384L126 374L136 384L146 374L156 384L166 374L176 384L186 374L196 384L206 380L196 388L186 380L176 390L166 380L156 390L146 380L136 390L126 380L116 390L106 380Z" fill="#3f63a8"/>' +
        '<path d="M106 379h3v3h-3zM136 383h3v3h-3zM166 379h3v3h-3zM190 382h3v3h-3z" fill="#9fe8f0" fill-opacity=".8"/>' +
        '<path d="M112 356Q114 368 120 376M134 354V378M151 353V378M168 354V378M190 356Q188 368 182 376M110 392Q122 404 134 408M151 392V412M192 392Q180 404 168 408" fill="none" stroke="#524a3a" stroke-width="2.2"/>',
      tableArt:
        // A table coral for a desk: a broad scalloped plate on a thick stalk.
        '<path d="M310 342Q318 384 302 456H362Q346 384 354 342Z" fill="#4e4a2e"/><path d="M302 456Q290 446 284 456M362 456Q374 444 382 456" fill="#4e4a2e" stroke="#4e4a2e" stroke-width="6"/>' +
        `<path d="M164 334Q170 328 200 329H440Q470 328 474 334V338${'q-7 8 -15.5 0'.repeat(20)}Z" fill="#6e6440"/>` +
        '<path d="M166 331Q174 328 200 329H440Q468 328 472 331" fill="none" stroke="#a8945a" stroke-opacity=".7" stroke-width="2.4"/>' +
        '<path d="M180 336h3v3h-3zM216 337h3v3h-3zM262 336h3v3h-3zM298 337h3v3h-3zM338 336h3v3h-3zM382 337h3v3h-3zM446 336h3v3h-3z" fill="#cfe8a0" fill-opacity=".5"/>',
    },
    style:
      // The water: rays breathe, the surface ripples, caustics wobble, motes drift.
      '.cr-ray{animation:cr-ray 7s ease-in-out infinite alternate}@keyframes cr-ray{from{opacity:.4}to{opacity:1}}' +
      '.cr-rays{opacity:.8}.st-done .cr-rays{animation:cr-up 2.4s ease-out .4s both}@keyframes cr-up{to{opacity:1}}' +
      '.cr-rip{animation:cr-rip 9s linear infinite}@keyframes cr-rip{to{transform:translateX(-140px)}}' +
      '.cr-rip2{animation-duration:14s;animation-direction:reverse}' +
      '.cr-gli{opacity:.1;animation:cr-gli 2.6s ease-in-out infinite alternate}@keyframes cr-gli{to{opacity:.7}}' +
      '.cr-cau{animation:cr-cau 6s ease-in-out infinite alternate}@keyframes cr-cau{from{transform:translate(-10px,-6px);opacity:.45}to{transform:translate(12px,8px);opacity:1}}' +
      '.cr-cau2{animation-duration:8.5s;animation-direction:alternate-reverse}' +
      '.cr-mote{animation:cr-mote 14s ease-in-out infinite alternate}@keyframes cr-mote{to{transform:translate(18px,-26px)}}' +
      '.st-thinking .cr-mote{animation-duration:5s}' +
      '.cr-bub{fill:none;stroke:#bfeee8;stroke-width:1.6;opacity:0;animation:cr-bub 8s ease-in infinite}' +
      '@keyframes cr-bub{0%{opacity:0;transform:translate(0,0)}10%{opacity:.7}85%{opacity:.5}100%{opacity:0;transform:translate(var(--dx,10px),-470px)}}' +
      // The reef sways.
      '.cr-fan{animation:cr-fan 7s ease-in-out infinite alternate}@keyframes cr-fan{from{transform:rotate(-1.8deg)}to{transform:rotate(2.2deg)}}' +
      '.cr-whip{animation:cr-whip 4.2s ease-in-out infinite alternate}@keyframes cr-whip{from{transform:skewX(-6deg)}to{transform:skewX(6deg)}}' +
      '.cr-ane{animation:cr-ane 2.6s ease-in-out infinite alternate}@keyframes cr-ane{from{transform:skewX(-9deg)}to{transform:skewX(9deg)}}' +
      '.st-responding .cr-ane{animation-duration:1.1s}' +
      // The school drifts; it slows while Claude thinks and hurries while it writes.
      '.cr-sch{animation:cr-sch 16s ease-in-out infinite alternate}@keyframes cr-sch{from{transform:translate(-26px,8px)}to{transform:translate(30px,-10px)}}' +
      '.cr-sch2{animation-duration:11s;animation-direction:alternate-reverse}' +
      '.st-thinking .cr-sch{animation-duration:26s}.st-responding .cr-sch{animation-duration:6s}' +
      '.cr-schg{transform-box:fill-box;transform-origin:center}' +
      '.st-run .cr-schg{animation:cr-out .9s ease-in both}@keyframes cr-out{to{opacity:0;transform:scale(.6,.4)}}' +
      '.st-error .cr-schg{animation:cr-scat 1.2s ease-out both}@keyframes cr-scat{to{opacity:.2;transform:scale(1.8)}}' +
      // Reef fish swim their beats; on an error they dart for cover.
      '.cr-sw{animation:cr-sw var(--d,14s) linear infinite}' +
      '@keyframes cr-sw{0%{transform:translateX(0) scaleX(1)}46%{transform:translateX(var(--w)) scaleX(1)}50%{transform:translateX(var(--w)) scaleX(-1)}96%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}' +
      '.st-error .cr-sw,.st-error .cr-an{animation:cr-dart .7s ease-in both}@keyframes cr-dart{to{transform:translate(-110px,36px) scale(.5);opacity:0}}' +
      '.cr-an{animation:cr-an 3s ease-in-out infinite alternate}@keyframes cr-an{from{transform:translate(-6px,3px)}to{transform:translate(8px,-4px)}}' +
      // Run: the school whips into a tornado of fish over the reef, stirring the sand at its foot.
      '.cr-tor{opacity:0;transform-origin:240px 130px}' +
      '.st-run .cr-tor{animation:cr-form 1.9s cubic-bezier(.2,.7,.3,1) both}' +
      '@keyframes cr-form{0%{opacity:0;transform:scale(.3,.06)}18%{opacity:1}100%{opacity:1;transform:scale(1,1)}}' +
      '.cr-tsw{transform-origin:240px 130px;animation:cr-tsw 3.2s ease-in-out infinite alternate}@keyframes cr-tsw{from{transform:rotate(-3deg)}to{transform:rotate(3.5deg)}}' +
      '.st-run .cr-rg{animation:cr-rot 3s linear infinite}@keyframes cr-rot{to{transform:rotate(360deg)}}' +
      orbit('cr-o0', 151) +
      orbit('cr-o1', 84) +
      '.st-run .cr-o0{animation:cr-o0 3.2s linear infinite}.st-run .cr-o1{animation:cr-o1 2.3s linear infinite}' +
      '.cr-silt{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .cr-silt{animation:cr-silt 2.4s ease-out .4s both}' +
      '@keyframes cr-silt{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}' +
      '.cr-prog{transform-box:fill-box;transform-origin:0 50%;animation:cr-prog 2.2s ease-in-out infinite}@keyframes cr-prog{from{transform:scaleX(.05)}to{transform:scaleX(1)}}' +
      // Error: the shark cruises along the surface and the pufferfish blows up.
      '.cr-shk{opacity:0}.st-error .cr-shk{animation:cr-shk 6.5s linear both}' +
      '@keyframes cr-shk{0%{opacity:0;transform:translateX(0)}6%{opacity:1}94%{opacity:1}100%{opacity:0;transform:translateX(-2300px)}}' +
      '.cr-tail{animation:cr-tail 1.4s ease-in-out infinite alternate}@keyframes cr-tail{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.cr-pfb{animation:cr-hov 4s ease-in-out infinite alternate}@keyframes cr-hov{to{transform:translate(6px,-8px)}}' +
      '.cr-pf{transform-box:fill-box;transform-origin:center}' +
      '.st-error .cr-pf{animation:cr-puff .55s cubic-bezier(.3,1.5,.5,1) .15s both}@keyframes cr-puff{to{transform:scale(1.9,2.5)}}' +
      '.cr-spk{opacity:0}.st-error .cr-spk{animation:cr-fi .3s ease-out .35s both}@keyframes cr-fi{to{opacity:1}}' +
      // Done: a sea turtle glides past and the coral lights up.
      '.cr-tur{opacity:0}.st-done .cr-tur{animation:cr-tur 11s linear both}' +
      '@keyframes cr-tur{0%{opacity:0;transform:translate(0,0)}5%{opacity:1}50%{transform:translate(900px,-50px)}95%{opacity:1}100%{opacity:0;transform:translate(1800px,-60px)}}' +
      '.cr-fl{animation:cr-fl 2.2s ease-in-out infinite alternate}@keyframes cr-fl{from{transform:rotate(-26deg)}to{transform:rotate(18deg)}}' +
      '.cr-fl2{animation-delay:-1.1s}' +
      '.cr-glo{opacity:0}.st-done .cr-glo{animation:cr-fi 2.2s ease-out .3s both}' +
      '.cr-pol{opacity:.12}.st-done .cr-pol{animation:cr-pol 1.8s ease-out .2s both}@keyframes cr-pol{to{opacity:.95}}' +
      // Read: a stingray lifts off the sand and glides away.
      '.cr-sr{opacity:0}.st-read .cr-sr{animation:cr-sr 7s ease-out both}' +
      '@keyframes cr-sr{0%{opacity:0;transform:translate(0,0)}10%{opacity:.95}85%{opacity:.95}100%{opacity:0;transform:translate(560px,-60px)}}' +
      '.cr-wing{transform-box:fill-box;transform-origin:center;animation:cr-wing 1.8s ease-in-out infinite alternate}@keyframes cr-wing{to{transform:scaleY(.6)}}' +
      // Web: bubbles stream from the snorkel; tool: from the anemone.
      '.cr-wb,.cr-tb{fill:none;stroke:#cff6f0;stroke-width:1.6;opacity:0}' +
      '.st-web .cr-wb{animation:cr-wb 1.6s ease-out infinite}.st-tool .cr-tb{animation:cr-wb 1.3s ease-out infinite}' +
      '@keyframes cr-wb{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),-190px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="cr-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e3a42"/><stop offset=".14" stop-color="#0a2e36"/><stop offset=".45" stop-color="#071e25"/><stop offset=".8" stop-color="#05161b"/><stop offset="1" stop-color="#041113"/></linearGradient>' +
      '<radialGradient id="cr-sun"><stop offset="0" stop-color="#ffbf86" stop-opacity=".38"/><stop offset=".45" stop-color="#f08a64" stop-opacity=".13"/><stop offset="1" stop-color="#f08a64" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cr-surf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8086" stop-opacity=".45"/><stop offset="1" stop-color="#3f8086" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cr-rayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd2a0" stop-opacity=".2"/><stop offset=".4" stop-color="#8fe8d8" stop-opacity=".07"/><stop offset="1" stop-color="#8fe8d8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cr-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10303a"/><stop offset="1" stop-color="#071a1e"/></linearGradient>' +
      '<linearGradient id="cr-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20362f"/><stop offset="1" stop-color="#0e1b19"/></linearGradient>' +
      `<radialGradient id="cr-gp"><stop offset="0" stop-color="${GLOW_P}" stop-opacity=".3"/><stop offset="1" stop-color="${GLOW_P}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="cr-gg"><stop offset="0" stop-color="${GLOW_G}" stop-opacity=".26"/><stop offset="1" stop-color="${GLOW_G}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="cr-siltg"><stop offset="0" stop-color="#8a8a6a" stop-opacity=".45"/><stop offset="1" stop-color="#8a8a6a" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="cr-fun" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${SILVER}" stop-opacity="0"/><stop offset=".2" stop-color="${SILVER}" stop-opacity=".26"/>` +
      `<stop offset=".5" stop-color="#1c3e46" stop-opacity=".55"/><stop offset=".8" stop-color="${SILVER}" stop-opacity=".26"/><stop offset="1" stop-color="${SILVER}" stop-opacity="0"/></linearGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#cr-sea)"/>' +
      // The surface overhead: the dusk sun through it, ripples and glints.
      '<ellipse cx="230" cy="-30" rx="560" ry="210" fill="url(#cr-sun)"/>' +
      '<g class="mv-t"><rect width="1600" height="72" fill="url(#cr-surf)"/>' +
      `<g class="cr-rip">${ripple(16, 5, '#ffd8b0', 0.22, 2)}${ripple(52, 4, '#9fe8e0', 0.12, 2)}</g>` +
      `<g class="cr-rip cr-rip2">${ripple(32, 6, '#cfeee6', 0.14, 2.4)}</g>` +
      `${glints}</g>` +
      `<g class="cr-rays" fill="url(#cr-rayg)">${raysL}<g class="mv-r">${raysR}</g></g>` +
      // The far reef and the sand.
      '<g class="mv-b"><path d="M-40 800Q100 740 240 770Q380 724 520 760Q700 730 860 770Q1020 742 1180 766Q1340 730 1480 770Q1580 760 1660 780V900H-40Z" fill="#081c21"/>' +
      `<path d="${heads}" fill="#0c262c"/>` +
      '<path d="M-40 860Q200 836 440 852T940 848T1420 858T1700 850V1200H-40Z" fill="url(#cr-sand)"/>' +
      `<path d="${sandLines}" fill="none" stroke="#2e4a44" stroke-opacity=".5" stroke-width="2"/>` +
      `<g class="cr-cau cr-cau2"><path d="${cauR}" fill="none" stroke="#a8f2e2" stroke-opacity=".07" stroke-width="2.4" stroke-linejoin="round"/></g></g>` +
      // The school far right, and the shark cruising along the surface.
      `<g class="mv-r"><g class="cr-schg"><path class="cr-sch" d="${schC}" fill="${SILVER}" fill-opacity=".45"/><path class="cr-sch cr-sch2" d="${schD}" fill="#6f9aa2" fill-opacity=".5"/></g>` +
      `<g class="mv-t"><g transform="translate(1760 178) scale(1.15)"><g class="cr-shk">${SHARK}</g></g></g></g>` +
      // The turtle, when the work is done.
      `<g transform="translate(110 300) scale(1.25)"><g class="cr-tur">${TURTLE}</g></g>` +
      // The school over the reef: it becomes the tornado on a run.
      `<g class="cr-schg"><path class="cr-sch" d="${schA}" fill="${SILVER}" fill-opacity=".55"/><path class="cr-sch cr-sch2" d="${schB}" fill="#6f9aa2" fill-opacity=".6"/></g>` +
      `<path class="cr-mote" d="${motes}" fill="#cfeee8" fill-opacity=".22"/>` +
      // The reef: rock, two sea fans, brain corals, a table coral, staghorn, sponges, anemones and whips.
      '<g class="mv-b">' +
      '<path d="M-60 1000V620Q-30 566 40 576Q90 530 150 562Q210 534 270 572Q330 552 380 600Q430 640 460 730Q482 836 540 900Q590 952 680 1000Z" fill="url(#cr-rock)"/>' +
      '<path d="M-60 620Q-30 566 40 576Q90 530 150 562Q210 534 270 572Q330 552 380 600Q430 640 460 730" fill="none" stroke="#3f8480" stroke-opacity=".35" stroke-width="3"/>' +
      seaFan(118, 574, 430, PINK, 11, 0) +
      seaFan(352, 598, 260, PURPLE, 13, -3) +
      `<circle class="cr-glo" cx="130" cy="400" r="270" fill="url(#cr-gp)"/>` +
      whip(392, 616, 120, ORANGE, -1, 3) +
      whip(10, 650, 96, RED, -2.4, 4) +
      tableCoral(246, 556, 13, OLIVE, '#b4c070') +
      brain(36, 616, 82, OCHRE, '#5a4a22', 7) +
      staghorn(200, 632, 46, ORANGE, 9) +
      staghorn(316, 690, 38, RED, 10) +
      staghorn(446, 790, 30, PINK, 12) +
      tubes(78, 690, [[0, 86, 22, -8], [28, 122, 26, 2], [56, 74, 20, 10]], PURPLE, '#9a7ac0') +
      brain(404, 672, 58, OLIVE, '#3a4622', 8) +
      brain(196, 782, 52, '#8a5a5a', '#4a2a2e', 14) +
      anemone(162, 690, 36, '#5a3050', '#d27a9a', -0.8) +
      anemone(428, 760, 28, '#2a4a46', TEAL, -1.7) +
      anemone(300, 812, 30, '#5a3a24', '#d89a52', -2.2) +
      `<circle class="cr-glo" cx="300" cy="640" r="210" fill="url(#cr-gg)"/>` +
      `<path class="cr-pol" d="${pink}" fill="${GLOW_P}"/><path class="cr-pol" d="${green}" fill="${GLOW_G}"/>` +
      reefFish(TANG, 40, 470, 1, 280, 16, -3) +
      reefFish(BUTTERFLY, 250, 540, 0.9, 140, 10, -6) +
      reefFish(ANGEL, 80, 790, 1.1, 220, 19, -2) +
      reefFish(SQUIRREL, 190, 870, 0.9, 170, 12, -8) +
      `<g class="cr-cau"><path d="${cauL}" fill="none" stroke="#bff4e6" stroke-opacity=".07" stroke-width="3" stroke-linejoin="round"/></g>` +
      bubbles +
      '<ellipse class="cr-silt" cx="262" cy="640" rx="190" ry="60" fill="url(#cr-siltg)"/>' +
      // The stingray, when Claude reads: it lifts off the foot of the reef and glides away over the sand.
      '<g transform="translate(70 900) scale(1.4)"><g class="cr-sr"><path d="M-36 2Q-70 10 -112 4" fill="none" stroke="#3e6260" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="cr-wing"><path d="M48 0Q24 -12 2 -28Q-16 -8 -42 0Q-16 8 2 26Q24 12 48 0Z" fill="#4c706c"/><path d="M-4 -6h3v3h-3zM8 2h3v3h-3zM-12 4h3v3h-3z" fill="#a8d0c8" fill-opacity=".6"/></g></g></g>' +
      '</g>' +
      // The tornado of fish.
      `<g class="cr-tor"><g class="cr-tsw">${tornado(next)}</g></g>` +
      `<g class="mv-r">${reefFish(TANG, 1250, 430, 0.8, 240, 15, -9)}</g>`,
    nook:
      '<defs><linearGradient id="cr-nr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2e34"/><stop offset="1" stop-color="#081a1d"/></linearGradient></defs>' +
      // The reef behind the desk, climbing to the right with a sea fan on top.
      '<path d="M-90 480V400Q-50 372 10 384Q60 360 110 380Q160 366 230 350Q280 300 310 220Q336 140 380 80Q420 30 480 14V480Z" fill="url(#cr-nr)"/>' +
      '<path d="M-90 400Q-50 372 10 384Q60 360 110 380Q160 366 230 350Q280 300 310 220Q336 140 380 80Q420 30 480 14" fill="none" stroke="#3f8480" stroke-opacity=".3" stroke-width="3"/>' +
      seaFan(392, 92, 330, FAN_N, 23, -2) +
      `<circle class="cr-glo" cx="390" cy="-80" r="230" fill="url(#cr-gp)"/>` +
      whip(300, 214, 70, ORANGE, -0.7, 5) +
      brain(446, 458, 84, OLIVE, '#3e4826', 29) +
      tubes(0, 458, [[8, 70, 20, -6], [34, 104, 24, 4], [60, 58, 18, 9]], PURPLE, '#9a7ac0') +
      '<path d="M-90 452Q60 440 200 450T480 446V480H-90Z" fill="' + SAND + '"/>' +
      `<circle class="cr-glo" cx="430" cy="410" r="160" fill="url(#cr-gg)"/>` +
      `<path class="cr-pol" d="${nookPink}" fill="${GLOW_P}"/><path class="cr-pol" d="${nookGreen}" fill="${GLOW_G}"/>` +
      anthias +
      `<g transform="translate(250 -40) scale(1.1)"><g class="cr-pfb"><g class="cr-pf">${puffer()}</g></g></g>`,
    front: trail('cr-wb', 52, 188, 5) + trail('cr-tb', 430, 300, 5),
  }
}
