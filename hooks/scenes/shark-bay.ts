import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Shark Bay: a 1970s beach town, closed for the night under a big moon. A long pier hung with string lights runs out
// into the bay, folded umbrellas stand on the sand, a bell buoy rocks on the swell, and a huge dorsal fin circles in
// the moonlight with the shark's dark shape under it. Claude keeps watch from the lifeguard tower in a visor and a
// whistle, on a CB radio with a coiled mic. A command sends the fin racing for the shore; an error breaches the shark
// in a leap across the moon; done turns it out to sea and the buoy's light goes green.
const TEAL = '#3fd1c4'
const MOON = '#e4eeea'
const RIM = '#a8cdd0'
const FOAM = '#d4eaec'
const WOOD = '#1b2830'
const WOOD_LIT = '#456070'
const FURN = '#2b3b45'
const CREAM = '#e6dfcd'
const RED = '#b8392e'
const BULB = '#ffcf7a'
const DARK = '#02070b'

// Where the fin circles: an ellipse on the water under the moon, in the left third.
const OX = 330
const OY = 690
const ORX = 140
const ORY = 34
const A0 = Math.PI / 2 + Math.PI / 24

// A shark side-on, nose to the right, about 280 long, centred on its middle.
const SHARK =
  'M132 -4C118 -20 84 -30 40 -32L18 -33C8 -50 -4 -70 -22 -86C-20 -66 -22 -48 -30 -31C-60 -26 -88 -16 -108 -9' +
  'L-122 -24L-150 -62C-146 -40 -138 -18 -126 -2L-146 30C-132 22 -118 12 -108 5C-84 14 -50 22 -10 27L26 28L4 64L50 24' +
  'C80 20 112 12 132 -4Z'
// The dorsal fin, its foot on the waterline at 0, swept back to the left: it travels right.
const FIN = 'M36 0C30 -34 8 -72 -30 -100C-20 -66 -22 -28 -42 0Z'

/** The fin over the shark's shape under the water, its wake and the foam at its foot. */
function fin(extra = ''): string {
  return (
    `<path class="sk-shd" d="${SHARK}" transform="translate(4 24) scale(1.05 .3)" fill="${DARK}" fill-opacity=".5"/>` +
    `<path d="M-44 2Q-110 -3 -190 -2M-44 5Q-110 12 -190 18" fill="none" stroke="${FOAM}" stroke-opacity=".22" stroke-width="2"/>` +
    `<g clip-path="url(#sk-wl)"><g class="sk-fb"><path d="${FIN}" fill="#04090e"/>` +
    `<path d="M36 0C30 -34 8 -72 -30 -100" fill="none" stroke="${RIM}" stroke-opacity=".6" stroke-width="2.4"/></g></g>` +
    `<path d="M-50 1Q-30 -5 -8 1T34 1Q44 -6 52 2" fill="none" stroke="${FOAM}" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>` +
    extra
  )
}

/** The circling fin, frame by frame: nearer and bigger at the front, seen edge-on as it turns at either end. */
function orbitKeys(): string {
  const steps = 24
  const frames: string[] = []

  for (let k = 0; k <= steps; k += 1) {
    const a = A0 + (k / steps) * Math.PI * 2
    const s = 0.85 + 0.5 * ((Math.sin(a) + 1) / 2)
    const side = -Math.sin(a)
    const sx = s * Math.sign(side) * Math.max(0.22, Math.abs(side))

    frames.push(`${f((k / steps) * 100)}%{transform:translate(${f(OX + ORX * Math.cos(a))}px,${f(OY + ORY * Math.sin(a))}px) scale(${sx.toFixed(2)},${s.toFixed(2)})}`)
  }

  return `@keyframes sk-orb{${frames.join('')}}`
}

// The breach: out of the water at the left, over the moon, back in at the right.
const BR_FROM = 236
const BR_TO = 404
const BR_SEA = 700
const BR_HIGH = 372

function breachKeys(): string {
  const steps = 14
  const t0 = -0.14
  const t1 = 1.14
  const frames: string[] = []

  for (let k = 0; k <= steps; k += 1) {
    const t = t0 + ((t1 - t0) * k) / steps
    const x = BR_FROM + (BR_TO - BR_FROM) * t
    const y = BR_SEA - 4 * BR_HIGH * t * (1 - t)
    const angle = (Math.atan2(-4 * BR_HIGH * (1 - 2 * t), BR_TO - BR_FROM) * 180) / Math.PI

    frames.push(`${f((k / steps) * 100)}%{opacity:1;transform:translate(${f(x)}px,${f(y)}px) rotate(${f(angle)}deg)}`)
  }

  return `@keyframes sk-br{${frames.join('')}}`
}

/** Spray thrown up where the shark leaves or hits the water: drops, a crown and rings, all after `delay`. */
function splash(x: number, y: number, size: number, delay: number, next: () => number): string {
  const drops = Array.from({ length: 9 }, (_, i) => {
    const dx = (i % 2 ? 1 : -1) * (10 + next() * 56) * size
    const up = -(50 + next() * 90) * size

    return `<circle class="sk-dr" style="--dl:${f(delay + next() * 0.12)}s;--x:${f(dx)}px;--y:${f(up)}px" cx="${f(x + (next() - 0.5) * 22)}" cy="${f(y - 4)}" r="${f(2 + next() * 2.5)}"/>`
  }).join('')
  const rings = [0, 0.35, 0.7]
    .map(d => `<ellipse class="sk-rg" style="--dl:${f(delay + d)}s" cx="${x}" cy="${y}" rx="${f(34 * size)}" ry="${f(7 * size)}" fill="none" stroke="${FOAM}" stroke-width="2"/>`)
    .join('')

  return (
    `<g fill="${FOAM}" fill-opacity=".85">${drops}<g transform="translate(${x} ${y}) scale(${size})">` +
    `<path class="sk-cr" style="--dl:${f(delay)}s" d="M-34 0L-28 -24L-20 -6L-12 -40L-4 -8L4 -48L10 -7L18 -34L26 -5L32 -22L36 0Q0 7 -34 0Z"/></g></g>` +
    rings
  )
}

/** A crest line across the bay, wide enough to slide one period without a seam. */
function wave(y: number, amp: number, p: number): string {
  const n = Math.ceil((1600 + 2 * p) / (p / 2))

  return `M${-p} ${y}q${f(p / 4)} ${f(-amp * 2)} ${f(p / 2)} 0${`t${f(p / 2)} 0`.repeat(n - 1)}`
}

const SWELLS = [
  { y: 546, amp: 1.5, p: 140, w: 1.2, o: 0.16, s: 40 },
  { y: 570, amp: 2, p: 180, w: 1.3, o: 0.17, s: 36 },
  { y: 600, amp: 3, p: 230, w: 1.5, o: 0.18, s: 32 },
  { y: 638, amp: 4, p: 290, w: 1.7, o: 0.19, s: 30 },
  { y: 684, amp: 5, p: 360, w: 2, o: 0.2, s: 26 },
  { y: 740, amp: 7, p: 440, w: 2.3, o: 0.2, s: 24 },
  { y: 804, amp: 9, p: 520, w: 2.6, o: 0.2, s: 22 },
  { y: 878, amp: 11, p: 600, w: 3, o: 0.18, s: 20 },
]

/** The pier: deck, pilings and rail running out into the bay, lamp posts with string lights, their reflections. */
function pier(): string {
  const at = (u: number) => {
    const s = 1 - 0.68 * u
    const wl = 652 - 104 * u

    return { s, x: -70 + 450 * u, wl, deck: wl - 34 * s }
  }
  const waterAt = (x: number) => 652 - 104 * ((x + 70) / 450)
  let piles = ''
  let braces = ''
  let rails = ''
  let posts = ''
  const tops: [number, number, number][] = []

  for (let i = 0; i <= 16; i += 1) {
    const { s, x, wl, deck } = at(i / 16)
    const w = 2 + 4 * s

    piles += `M${f(x - w / 2)} ${f(deck)}h${f(w)}V${f(wl + 2)}h${f(-w)}Z`
    rails += `M${f(x)} ${f(deck)}V${f(deck - 12 * s)}`

    if (i < 16) {
      const n = at((i + 1) / 16)

      braces += `M${f(x)} ${f(deck + 9 * s)}L${f(n.x)} ${f(n.wl - 4 * n.s)}M${f(x)} ${f(wl - 4 * s)}L${f(n.x)} ${f(n.deck + 9 * n.s)}`
    }

    if (i % 2 === 0) {
      posts += `M${f(x)} ${f(deck)}V${f(deck - 46 * s)}`
      tops.push([x, deck - 46 * s, s])
    }
  }

  let strings = ''
  let bulbs = ''
  let shine = ''

  for (let k = 0; k < tops.length - 1; k += 1) {
    const [x1, y1, s1] = tops[k]!
    const [x2, y2] = tops[k + 1]!
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 + 14 * s1
    let dots = ''

    strings += `M${f(x1)} ${f(y1)}Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`

    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2
      const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2 + 2

      dots += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(1.1 + 2.3 * s1)}"/>`
      shine += `M${f(bx)} ${f(waterAt(bx) + 5)}v${f(8 + 26 * s1)}`
    }

    bulbs += `<g class="sk-bb" style="--i:${k}">${dots}</g>`
  }

  const near = at(0)
  const far = at(1)

  return (
    `<path class="sk-rf" d="${shine}" stroke="${BULB}" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${braces}" stroke="#0a141a" stroke-width="1.6"/>` +
    `<path d="${piles}" fill="#03080c"/>` +
    `<path d="M${near.x} ${f(near.deck)}L${far.x} ${f(far.deck)}V${f(far.deck + 9 * far.s)}L${near.x} ${f(near.deck + 9)}Z" fill="#060d13"/>` +
    `<path d="M${near.x} ${f(near.deck)}L${far.x} ${f(far.deck)}" stroke="#4d6a76" stroke-opacity=".45" stroke-width="1.6"/>` +
    `<path d="${rails}M${near.x} ${f(near.deck - 12)}L${far.x} ${f(far.deck - 12 * far.s)}" stroke="#08111a" stroke-width="2"/>` +
    `<path d="${posts}" stroke="#0a141b" stroke-width="2.6"/>` +
    // The bait shack at the far end, its window lit.
    `<path d="M364 ${f(far.deck)}V${f(far.deck - 15)}L376 ${f(far.deck - 23)}L388 ${f(far.deck - 15)}V${f(far.deck)}Z" fill="#050b10" stroke="#3d5764" stroke-opacity=".5"/>` +
    `<rect x="372" y="${f(far.deck - 11)}" width="6" height="5" fill="${BULB}" fill-opacity=".85"/>` +
    `<path class="sk-pg" d="${strings}" fill="none" stroke="${BULB}" stroke-opacity=".22" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="${strings}" fill="none" stroke="${BULB}" stroke-opacity=".1" stroke-width="5"/>` +
    `<path d="${strings}" fill="none" stroke="#0e1a22" stroke-width="1"/>` +
    `<g fill="${BULB}">${bulbs}</g>`
  )
}

/** The beach town across the bay at the right: clapboard houses with lit windows, a water tower, a radio mast. */
function town(next: () => number): string {
  let houses = ''
  let roofs = ''
  let windows = ''
  let tv = ''
  let x = 1160

  for (let i = 0; i < 9; i += 1) {
    const w = 30 + next() * 20
    const h = 16 + next() * 14
    const base = 525
    const peak = base - h - 9 - next() * 6

    houses += `M${f(x)} ${base}V${f(base - h)}L${f(x + w / 2)} ${f(peak)}L${f(x + w)} ${f(base - h)}V${base}Z`
    roofs += `M${f(x)} ${f(base - h)}L${f(x + w / 2)} ${f(peak)}L${f(x + w)} ${f(base - h)}`

    if (next() > 0.25) {
      windows += `M${f(x + 6)} ${f(base - h + 5)}h5v6h-5z`
    }

    if (next() > 0.45) {
      if (i % 3 === 1) {
        tv += `M${f(x + w - 13)} ${f(base - h + 6)}h6v5h-6z`
      } else {
        windows += `M${f(x + w - 12)} ${f(base - h + 6)}h5v6h-5z`
      }
    }

    x += w + 6 + next() * 16
  }

  return (
    '<path d="M1110 525C1200 502 1300 494 1400 496S1580 484 1720 488V525Z" fill="#050a10"/>' +
    // The radio mast with its red light, which calls out over the bay while Claude is on the web.
    '<path d="M1410 525L1420 374L1430 525M1413 480H1427M1415 440H1425M1417 405H1423M1413 480L1425 440M1427 480L1415 440M1415 440L1423 405M1425 440L1417 405" fill="none" stroke="#08111a" stroke-width="2.2"/>' +
    '<g transform="translate(1420 371)"><g class="sk-ml"><circle r="22" fill="url(#sk-rh)"/><circle r="3" fill="#ff6a50"/></g>' +
    '<circle class="sk-mr" r="18" fill="none" stroke="#ff8a70" stroke-opacity=".7" stroke-width="2"/>' +
    '<circle class="sk-mr" style="animation-delay:.5s" r="18" fill="none" stroke="#ff8a70" stroke-opacity=".7" stroke-width="2"/></g>' +
    `<path d="${houses}" fill="#060c12"/><path d="${roofs}" fill="none" stroke="#3f5866" stroke-opacity=".55" stroke-width="1.4"/>` +
    `<path d="${windows}" fill="#ffc46b" fill-opacity=".78"/><path class="sk-tvw" d="${tv}" fill="#8fc0ff"/>` +
    // The water tower.
    '<path d="M1314 525L1322 470M1346 525L1338 470M1316 502H1344M1318 488L1342 502M1342 488L1318 502" fill="none" stroke="#060c12" stroke-width="3"/>' +
    '<g fill="#060c12" stroke="#3f5866" stroke-opacity=".5" stroke-width="1.2"><rect x="1310" y="446" width="40" height="26" rx="6"/><path d="M1307 449L1330 432L1353 449Z"/></g>'
  )
}

/** Dots as one path of tiny squares. */
function dots(points: [number, number][], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** A folded beach umbrella stuck in the sand: pole, furled canopy in two colours, its strap. */
function umbrella(x: number, base: number, height: number, tilt: number, a: string, b: string): string {
  const top = -height

  return (
    `<g transform="translate(${x} ${base}) rotate(${tilt})">` +
    `<path d="M0 0V${top}" stroke="#141a1d" stroke-width="3"/><path d="M0 ${top}V${top - 8}" stroke="#141a1d" stroke-width="2"/>` +
    `<path d="M0 ${top}C-10 ${top + 18} -11 ${top + 54} -2 ${top + 80}H0Z" fill="${a}"/>` +
    `<path d="M0 ${top}C10 ${top + 18} 11 ${top + 54} 2 ${top + 80}H0Z" fill="${b}"/>` +
    `<path d="M2 ${top + 4}C11 ${top + 22} 11 ${top + 54} 3 ${top + 78}" fill="none" stroke="${RIM}" stroke-opacity=".35" stroke-width="1.2"/>` +
    `<path d="M-8 ${top + 44}L8 ${top + 40}" stroke="#141a1d" stroke-width="2.4"/>` +
    '<ellipse cy="1" rx="10" ry="2.5" fill="#0b0f11"/></g>'
  )
}

/** Claude's emblem: an eight-point starburst around (x, y). */
function starburst(x: number, y: number, outer: number, inner: number): string {
  return (
    'M' +
    Array.from({ length: 16 }, (_, i) => {
      const r = i % 2 ? inner : outer
      const a = (i * Math.PI) / 8 - Math.PI / 2

      return `${f(x + r * Math.cos(a))} ${f(y + r * Math.sin(a))}`
    }).join('L') +
    'Z'
  )
}

/** The CB radio on the tower's shelf: a keypad deck, the set with its lit S-meter, and the hand mic on its coiled cord. */
function device(light: string, activity: Activity): string {
  const needle: Record<Activity, number> = { idle: -38, thinking: -22, responding: 8, tool: 14, read: -8, web: 18, run: 36, error: 58, done: 0 }
  const keys = [0, 1, 2, 3].map(i => `<rect x="${244 + i * 13}" y="322" width="10" height="5" rx="1" fill="${light}" fill-opacity=".5"/>`).join('')
  const ticks = [-60, -35, -10, 15, 40, 60]
    .map(a => {
      const r = (a * Math.PI) / 180

      return `M${f(335 + 19 * Math.sin(r))} ${f(297 - 19 * Math.cos(r))}L${f(335 + 23 * Math.sin(r))} ${f(297 - 23 * Math.cos(r))}`
    })
    .join('')
  let coil = ''

  for (let i = 0; i <= 13; i += 1) {
    const t = i / 13
    const x = (1 - t) * (1 - t) * 404 + 2 * (1 - t) * t * 424 + t * t * 431
    const y = (1 - t) * (1 - t) * 326 + 2 * (1 - t) * t * 384 + t * t * 306

    coil += `M${f(x + 3.4)} ${f(y)}a3.4 2.2 0 1 0 -6.8 0a3.4 2.2 0 1 0 6.8 0`
  }

  return (
    '<rect x="238" y="319" width="62" height="11" rx="2" fill="#1a2329" stroke="#3a4a54" stroke-width="1.2"/>' +
    keys +
    '<rect x="296" y="256" width="124" height="74" rx="5" fill="#141c21" stroke="#3a4a54" stroke-width="2"/>' +
    '<rect x="303" y="263" width="110" height="60" rx="3" fill="#43525b"/><path d="M303 265H413" stroke="#8ea0a8" stroke-opacity=".5" stroke-width="1.5"/>' +
    `<rect x="309" y="269" width="52" height="30" rx="2" fill="${light}" fill-opacity=".88"/>` +
    `<path d="M316 294A20 20 0 0 1 354 294${ticks}" fill="none" stroke="#06221f" stroke-opacity=".6" stroke-width="1.4"/>` +
    `<g transform="translate(335 297) rotate(${needle[activity]})"><g class="sk-ndl"><path d="M-1.4 0L0 -24L1.4 0Z" fill="#071a18"/></g></g>` +
    '<rect x="367" y="271" width="38" height="16" rx="2" fill="#160b07"/>' +
    '<g fill="#ff8a4a" fill-opacity=".85"><rect x="373" y="275" width="10" height="3"/><rect x="373" y="280" width="10" height="3"/><rect x="389" y="275" width="10" height="3"/><rect x="389" y="280" width="6" height="3"/></g>' +
    '<g fill="#10161a" stroke="#6a7c86" stroke-width="1.4"><circle cx="376" cy="309" r="8"/><circle cx="399" cy="309" r="6"/></g>' +
    '<path d="M376 309L381 303M399 309V303" stroke="#c9d6dc" stroke-width="1.6"/>' +
    '<rect x="322" y="306" width="34" height="5" rx="2.5" fill="#10161a"/><rect x="334" y="304" width="6" height="9" rx="1" fill="#9aabb3"/>' +
    '<circle class="sk-tx" cx="313" cy="309" r="3" fill="#ff5a3c" opacity=".18"/>' +
    '<rect x="420" y="262" width="6" height="10" rx="2" fill="#3a4a54"/>' +
    `<path d="${coil}" fill="none" stroke="#0d1317" stroke-width="2"/>` +
    '<g transform="rotate(6 430 270)"><rect x="421" y="268" width="19" height="38" rx="9" fill="#1b2328" stroke="#56666f" stroke-width="1.4"/>' +
    '<path d="M425 276H436M425 280H436M425 284H436" stroke="#56666f" stroke-width="1.2"/><rect x="417" y="286" width="4" height="10" rx="1.5" fill="#56666f"/></g>'
  )
}

export function sharkBayWorld(): World {
  const next = random(23)
  const starA: [number, number][] = []
  const starB: [number, number][] = []

  for (let i = 0; i < 60; i += 1) {
    const p: [number, number] = [next() * 1600, 8 + next() * 440]

    if (Math.hypot(p[0] - 320, p[1] - 290) > 120) {
      ;(i % 2 === 0 ? starA : starB).push(p)
    }
  }

  // The moon's path on the water: glints that widen toward the shore, in three groups that twinkle out of step.
  const glints: string[] = ['', '', '']

  for (let i = 0; i < 30; i += 1) {
    const u = i / 29
    const y = 532 + Math.pow(u, 1.25) * 330
    const spread = 10 + u * 82

    glints[i % 3] += `<ellipse cx="${f(320 + (next() - 0.5) * 2 * spread)}" cy="${f(y)}" rx="${f(4 + u * 18 + next() * 7)}" ry="${f(1 + u * 1.6)}"/>`
  }

  const swells = SWELLS.map(
    (s, i) =>
      `<path class="sk-sw" style="--s:${s.s}s;--p:${i % 2 ? '' : '-'}${s.p}px" d="${wave(s.y, s.amp, s.p)}" stroke-width="${s.w}" stroke-opacity="${s.o}"/>`,
  ).join('')
  const ripples =
    `<ellipse class="sk-rp" cx="0" cy="2" rx="40" ry="7" fill="none" stroke="${FOAM}" stroke-width="1.6"/>` +
    `<ellipse class="sk-rp" style="animation-delay:-1.3s" cx="0" cy="2" rx="40" ry="7" fill="none" stroke="${FOAM}" stroke-width="1.6"/>`
  const bow =
    `<path d="M30 -2Q46 -18 66 -6M28 3Q50 -2 70 8" fill="none" stroke="${FOAM}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>` +
    `<g fill="${FOAM}" fill-opacity=".7"><circle cx="54" cy="-16" r="2.4"/><circle cx="64" cy="-10" r="2"/><circle cx="44" cy="-22" r="1.8"/></g>`
  const flag = (cls: string, color: string) =>
    `<g class="${cls}"><path class="sk-fw" d="M0 0C-14 -3 -30 3 -46 0V26C-30 29 -14 23 0 26Z" fill="${color}"/></g>`
  const gable = Array.from({ length: 20 }, (_, i) => {
    const x = -2 + i * 22
    const top = x < 210 ? 94 - ((x + 22) / 232) * 62 : 94 - ((442 - x) / 232) * 62

    return `M${x} ${f(top + 2)}V94`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'bubbles',
      ink: '#02070c',
      furniture: FURN,
      metal: '#2b3a44',
      paper: CREAM,
      light: { idle: '#2a9a90', work: TEAL, bright: '#b5fff4' },
      headTop: 234,
      glowAt: [335, 284],
      device,
      wear: {
        front:
          // The whistle on its lanyard, below the eyes; then the visor: a white band with red piping and a
          // translucent teal eyeshade over the radio side, all above row 1.
          `<path d="M76 246C72 290 88 318 140 326M224 246C228 290 212 318 160 326" fill="none" stroke="${CREAM}" stroke-opacity=".7" stroke-width="2.2"/>` +
          '<rect x="138" y="320" width="22" height="11" rx="5.5" fill="#c7d2d7" stroke="#6f7d84" stroke-width="1"/>' +
          '<rect x="158" y="322" width="10" height="6" rx="1" fill="#a9b6bc"/><circle cx="145" cy="325.5" r="2.2" fill="#55636a"/>' +
          '<path d="M66 248V239Q150 230 234 239V248Q150 240 66 248Z" fill="#e9e4d6"/>' +
          `<path d="M66 245Q150 237 234 245" fill="none" stroke="${RED}" stroke-width="2.2"/>` +
          `<path d="M184 241Q236 234 278 247L274 255Q232 249 184 251Z" fill="${TEAL}" fill-opacity=".5" stroke="#1f7a72" stroke-width="1.4"/>`,
      },
      seatArt:
        // The lookout stool: a plank seat on splayed legs with cross braces, a striped towel over its edge.
        `<path d="M114 360L102 456M190 360L202 456M108 392H196M106 424H198" stroke="${FURN}" stroke-width="6" stroke-linecap="round"/>` +
        `<rect x="104" y="350" width="96" height="10" rx="3" fill="${FURN}" stroke="${WOOD_LIT}" stroke-opacity=".55" stroke-width="1.5"/>` +
        '<path d="M150 352H176V386L172 389L168 386L163 389L159 386L154 389L150 386Z" fill="#2c7f78"/>' +
        `<path d="M150 362H176M150 373H176" stroke="${CREAM}" stroke-opacity=".6" stroke-width="3"/>`,
      tableArt:
        // The shelf under the tower's window, and the red rescue tube on the floor beneath it.
        `<g fill="${FURN}"><rect x="180" y="342" width="11" height="114"/><rect x="446" y="342" width="11" height="114"/></g>` +
        `<path d="M191 354L230 342M446 354L407 342" stroke="${FURN}" stroke-width="5"/>` +
        `<rect x="166" y="330" width="302" height="12" rx="2" fill="${FURN}" stroke="${WOOD_LIT}" stroke-opacity=".55" stroke-width="1.5"/>` +
        `<rect x="226" y="434" width="196" height="20" rx="10" fill="${RED}"/><path d="M238 439H410" stroke="#e8897c" stroke-opacity=".5" stroke-width="2"/>` +
        `<path d="M420 444Q440 440 444 454" fill="none" stroke="${CREAM}" stroke-opacity=".6" stroke-width="2.5"/>`,
    },
    style:
      orbitKeys() +
      breachKeys() +
      // The sky: stars, drifting cloud streaks.
      '.sk-tw1{animation:sk-tw 3.6s ease-in-out infinite alternate}.sk-tw2{animation:sk-tw 2.7s ease-in-out -1.3s infinite alternate}@keyframes sk-tw{from{opacity:.3}to{opacity:.85}}' +
      '.sk-cl{animation:sk-cl 50s ease-in-out infinite alternate}@keyframes sk-cl{to{transform:translateX(70px)}}' +
      // The moon's path and the swell.
      '.sk-g1{animation:sk-g 2.2s ease-in-out infinite alternate}.sk-g2{animation:sk-g 1.7s ease-in-out -.8s infinite alternate}.sk-g3{animation:sk-g 2.9s ease-in-out -1.9s infinite alternate}' +
      '@keyframes sk-g{from{opacity:.2}to{opacity:.9}}' +
      // Done: the moon's path widens and brightens as the water calms (a slow 2.4 s ramp, peak glow alpha .35).
      '.sk-glit{opacity:.75}.st-done .sk-glit{transform-box:fill-box;transform-origin:50% 0;animation:sk-glw 2.4s ease-out .4s both}' +
      '@keyframes sk-glw{to{opacity:1;transform:scaleX(1.25)}}' +
      '.sk-mp{opacity:0}.st-done .sk-mp{animation:sk-on 2.4s ease-out .4s both}' +
      '.sk-sw{animation:sk-sw var(--s) linear infinite}@keyframes sk-sw{to{transform:translateX(var(--p))}}' +
      '.st-run .sk-sw{animation-duration:calc(var(--s) / 3.5)}.st-error .sk-sw{animation-duration:calc(var(--s) / 2.5)}.st-thinking .sk-sw{animation-duration:calc(var(--s) * 1.6)}' +
      '.st-run .sk-hv,.st-error .sk-hv{animation:sk-hv 1.2s ease-in-out infinite alternate}@keyframes sk-hv{from{transform:translateY(-6px)}to{transform:translateY(7px)}}' +
      // The fin circling; slower while thinking, dipping under while reading so its shadow shows.
      '.sk-orb{transform:translate(312px,724px) scale(-1.34,1.35);animation:sk-orb 26s linear infinite}.st-thinking .sk-orb{animation-duration:46s}' +
      '.st-run .sk-orb,.st-error .sk-orb,.st-done .sk-orb{display:none}' +
      '.sk-fb{animation:sk-fb 2.8s ease-in-out infinite alternate}@keyframes sk-fb{from{transform:translateY(-2px)}to{transform:translateY(5px)}}' +
      '.st-read .sk-orb .sk-fb{animation:sk-sink 1.8s ease-in-out both}@keyframes sk-sink{to{transform:translateY(70px)}}.st-read .sk-shd{fill-opacity:.85}' +
      '.sk-rp{opacity:0;transform-box:fill-box;transform-origin:center}.st-thinking .sk-rp,.st-read .sk-rp{animation:sk-rp 2.6s ease-out infinite}' +
      '@keyframes sk-rp{0%{opacity:.6;transform:scale(.4)}100%{opacity:0;transform:scale(2.6)}}' +
      // Run: the fin turns for the shore and charges. Done: it turns and heads out to sea.
      '.sk-chg,.sk-dep,.sk-br{opacity:0}' +
      '.st-run .sk-chg{animation:sk-chg 3.4s ease-in infinite}' +
      '@keyframes sk-chg{0%{opacity:0;transform:translate(312px,724px) scale(-1.34,1.35)}6%{opacity:1}16%{transform:translate(300px,734px) scale(-.7,1.5)}' +
      '66%{opacity:1;transform:translate(262px,846px) scale(-1.25,2.95)}76%{opacity:1;transform:translate(258px,856px) scale(-1.25,3)}90%,100%{opacity:0;transform:translate(256px,862px) scale(-1.25,3)}}' +
      // Its wake: white water drawn in behind it on the same clock, then fading.
      '.sk-wk{opacity:0}.st-run .sk-wk{animation:sk-wk 3.4s ease-in infinite}' +
      '@keyframes sk-wk{0%{opacity:0;stroke-dashoffset:1}6%{opacity:1}16%{stroke-dashoffset:.88}66%{stroke-dashoffset:.04}76%{opacity:1;stroke-dashoffset:0}100%{opacity:0;stroke-dashoffset:0}}' +
      '.st-done .sk-dep{animation:sk-dep 4.2s ease-in-out .1s both}' +
      '@keyframes sk-dep{0%{opacity:1;transform:translate(312px,724px) scale(-1.34,1.35)}20%{transform:translate(304px,716px) scale(-.3,1.28)}' +
      '34%{transform:translate(312px,702px) scale(.6,1.18)}80%{opacity:1}100%{opacity:0;transform:translate(440px,580px) scale(.3,.42)}}' +
      // Error: the shark breaches across the moon; spray where it leaves and where it lands.
      '.st-error .sk-br{animation:sk-br 2.2s linear .15s both}' +
      '.sk-dr,.sk-rg,.sk-cr{opacity:0;transform-box:fill-box}.sk-rg{transform-origin:center}.sk-cr{transform-origin:50% 100%}' +
      '.st-error .sk-dr{animation:sk-dr 1.3s ease-out var(--dl) both}' +
      '@keyframes sk-dr{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}45%{transform:translate(calc(var(--x) * .6),var(--y))}100%{opacity:0;transform:translate(var(--x),24px)}}' +
      '.st-error .sk-rg{animation:sk-rg 2s ease-out var(--dl) both}@keyframes sk-rg{0%{opacity:0;transform:scale(.2)}12%{opacity:.7}100%{opacity:0;transform:scale(2.6)}}' +
      '.st-error .sk-cr{animation:sk-cr 1.2s ease-out var(--dl) both}@keyframes sk-cr{0%{opacity:0;transform:scaleY(.1)}18%{opacity:.8;transform:scaleY(1)}100%{opacity:0;transform:scaleY(.5)}}' +
      // The bell buoy: rocking, ringing, its light blinking red; green when done.
      '.sk-rk{animation:sk-rk 4.2s ease-in-out infinite alternate}@keyframes sk-rk{from{transform:rotate(-4deg) translateY(-2px)}to{transform:rotate(4deg) translateY(3px)}}' +
      '.st-tool .sk-rk{animation-duration:2s}' +
      '.st-run .sk-rk,.st-error .sk-rk{animation:sk-rk2 .85s ease-in-out infinite alternate}@keyframes sk-rk2{from{transform:rotate(-15deg) translateY(-7px)}to{transform:rotate(14deg) translateY(5px)}}' +
      '.sk-bell{transform-box:fill-box;transform-origin:50% 0}.st-tool .sk-bell,.st-run .sk-bell,.st-error .sk-bell{animation:sk-bell .42s ease-in-out infinite alternate}' +
      '@keyframes sk-bell{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}' +
      '.sk-dong{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .sk-dong,.st-run .sk-dong,.st-error .sk-dong{animation:sk-dong .84s ease-out infinite}' +
      '@keyframes sk-dong{0%{opacity:.85;transform:scale(.6)}100%{opacity:0;transform:scale(1.7)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the beacons blink once per 1.3 s at the fastest, each ramping over .15 s or more.
      '.sk-lr{animation:sk-blink 3.4s ease-in-out infinite}@keyframes sk-blink{0%,64%,100%{opacity:.22}76%,86%{opacity:1}}.st-run .sk-lr{animation-duration:1.4s}' +
      '.st-done .sk-lr{animation:sk-off .5s ease-out both}@keyframes sk-off{to{opacity:0}}' +
      '.sk-lg{opacity:0}.st-done .sk-lg{animation:sk-on 1.4s ease-out .6s both}@keyframes sk-on{to{opacity:1}}' +
      // The pier's string lights: a soft shimmer, a chase while a tool works, all the way up when done.
      '.sk-bb{animation:sk-bb 3.2s ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.45s)}@keyframes sk-bb{from{opacity:.55}to{opacity:.9}}' +
      '.st-tool .sk-bb{animation:sk-chase 1.6s steps(1) infinite;animation-delay:calc(var(--i) * .2s)}@keyframes sk-chase{0%{opacity:1}25%,100%{opacity:.22}}' +
      '.st-done .sk-bb{animation:sk-bon 1s ease-out both;animation-delay:calc(var(--i) * .16s + .3s)}@keyframes sk-bon{from{opacity:.4}to{opacity:1}}' +
      '.st-sleeping .sk-bb{animation:none;opacity:.3}' +
      '.sk-pg{opacity:0}.st-done .sk-pg{animation:sk-on 2s ease-out .4s both}' +
      '.sk-rf{animation:sk-rf 1.8s ease-in-out infinite alternate}@keyframes sk-rf{from{opacity:.4}to{opacity:1}}' +
      // The town: the mast calls out on the web, the tower's antenna answers while Claude talks.
      '.sk-ml{animation:sk-blink 2.8s ease-in-out infinite}.st-web .sk-ml{animation-duration:1.3s}' +
      '.sk-mr,.sk-ar{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .sk-mr{animation:sk-sig 1.5s ease-out infinite}.st-web .sk-ar,.st-responding .sk-ar{animation:sk-sig 1.4s ease-out infinite}' +
      '@keyframes sk-sig{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}' +
      '.sk-tvw{animation:sk-tvw 2.6s ease-in-out infinite alternate}@keyframes sk-tvw{from{opacity:.3}to{opacity:.75}}' +
      // The shore: the wash, and the surge the charge drives up the sand.
      '.sk-wash{animation:sk-wash 5.5s ease-in-out infinite}@keyframes sk-wash{0%,100%{transform:translateY(5px);opacity:.25}50%{transform:translateY(-6px);opacity:.7}}' +
      '.st-run .sk-wash{animation-duration:2.2s}' +
      '.sk-surge{opacity:0}.st-run .sk-surge{animation:sk-surge 2.2s ease-out infinite}.st-error .sk-surge{animation:sk-surge 2.4s ease-out 2.2s both}' +
      '@keyframes sk-surge{0%{opacity:0;transform:translateY(26px)}25%{opacity:.6}100%{opacity:0;transform:translateY(-30px)}}' +
      // Flags: they whip in the run; the tower hoists red on an error and green when done.
      '.sk-fw{transform-box:fill-box;transform-origin:100% 50%;animation:sk-fw 1.7s ease-in-out infinite alternate}' +
      '@keyframes sk-fw{from{transform:skewY(-7deg) scaleX(1)}to{transform:skewY(6deg) scaleX(.88)}}' +
      '.st-run .sk-fw,.st-error .sk-fw{animation-duration:.55s}' +
      '.sk-fr,.sk-fg{opacity:0}.st-error .sk-fr,.st-done .sk-fg{animation:sk-hoist 1.2s ease-out .25s both}' +
      '@keyframes sk-hoist{from{opacity:1;transform:translateY(150px)}to{opacity:1;transform:translateY(0)}}' +
      '.st-error .sk-fy,.st-done .sk-fy{animation:sk-off .3s ease-out both}' +
      '.sk-bfg{opacity:0}.st-done .sk-bfg{animation:sk-on 1.2s ease-out .8s both}' +
      // The radio: the S-meter needle, the transmit lamp, the antenna in the wind.
      '.sk-ndl{animation:sk-ndl 3.4s ease-in-out infinite alternate}@keyframes sk-ndl{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      '.st-responding .sk-ndl,.st-tool .sk-ndl,.st-web .sk-ndl,.st-run .sk-ndl{animation-duration:.32s}' +
      '.sk-tx{opacity:.18}.st-responding .sk-tx,.st-web .sk-tx,.st-run .sk-tx{animation:sk-tx .5s steps(1) infinite}@keyframes sk-tx{50%{opacity:1}}' +
      '.sk-aw{animation:sk-aw 3.2s ease-in-out infinite alternate}@keyframes sk-aw{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02060b"/><stop offset=".55" stop-color="#07121c"/><stop offset="1" stop-color="#0e2230"/></linearGradient>' +
      '<linearGradient id="sk-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c5562" stop-opacity="0"/><stop offset="1" stop-color="#2c5562" stop-opacity=".25"/></linearGradient>' +
      '<radialGradient id="sk-mh"><stop offset="0" stop-color="#d6e8e6" stop-opacity=".3"/><stop offset=".25" stop-color="#a8cdd0" stop-opacity=".12"/><stop offset="1" stop-color="#a8cdd0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sk-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2533"/><stop offset=".25" stop-color="#081a26"/><stop offset="1" stop-color="#040c13"/></linearGradient>' +
      '<radialGradient id="sk-mg"><stop offset="0" stop-color="#a8cdd0" stop-opacity=".16"/><stop offset="1" stop-color="#a8cdd0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sk-mpg"><stop offset="0" stop-color="#d8ecec" stop-opacity=".35"/><stop offset=".5" stop-color="#a8cdd0" stop-opacity=".12"/><stop offset="1" stop-color="#a8cdd0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sk-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20282b"/><stop offset=".4" stop-color="#151b1e"/><stop offset="1" stop-color="#0b0f11"/></linearGradient>' +
      '<radialGradient id="sk-rh"><stop offset="0" stop-color="#ff6a50" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a50" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sk-gh"><stop offset="0" stop-color="#7dffa8" stop-opacity=".5"/><stop offset=".4" stop-color="#3fd18a" stop-opacity=".16"/><stop offset="1" stop-color="#3fd18a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="sk-wl"><rect x="-200" y="-300" width="400" height="303"/></clipPath>' +
      `<clipPath id="sk-air"><rect width="800" height="${BR_SEA}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#sk-sky)"/>' +
      `<path class="sk-tw1" d="${dots(starA, 2.6)}" fill="#dce8ee" fill-opacity=".8"/><path class="sk-tw2" d="${dots(starB, 2.2)}" fill="#c8dce6" fill-opacity=".7"/>` +
      '<rect y="430" width="1600" height="96" fill="url(#sk-hz)"/>' +
      // The moon, and the cloud streaks drifting over it.
      `<circle cx="320" cy="290" r="280" fill="url(#sk-mh)"/><circle cx="320" cy="290" r="70" fill="${MOON}" fill-opacity=".9"/>` +
      '<g fill="#b9c8c6" fill-opacity=".35"><circle cx="301" cy="272" r="16"/><circle cx="341" cy="308" r="11"/><circle cx="332" cy="262" r="7"/><circle cx="296" cy="314" r="6"/></g>' +
      '<g class="sk-cl" fill="#0a1520" fill-opacity=".92"><ellipse cx="250" cy="246" rx="170" ry="7"/><ellipse cx="430" cy="232" rx="110" ry="5"/><ellipse cx="170" cy="196" rx="120" ry="5"/></g>' +
      '<g class="sk-cl" style="animation-direction:alternate-reverse" fill="#0b1824" fill-opacity=".8"><ellipse cx="1300" cy="200" rx="200" ry="9"/><ellipse cx="900" cy="140" rx="240" ry="8"/><ellipse cx="1460" cy="116" rx="160" ry="6"/></g>' +
      `<g class="mv-r"><g class="mv-b">${town(next)}</g></g>` +
      '<g class="mv-b">' +
      // The bay, the far headland, the moon on the water.
      '<path d="M-80 525V504Q-10 490 60 497T200 503Q300 509 420 525Z" fill="#050a10"/>' +
      '<path d="M40 498l8 -16l8 16M100 500l7 -14l7 14M150 503l6 -12l6 12" fill="#050a10"/>' +
      '<rect y="524" width="1600" height="720" fill="url(#sk-sea)"/>' +
      '<path d="M0 524.5H1600" stroke="#4d7a86" stroke-opacity=".3"/>' +
      '<ellipse cx="320" cy="700" rx="110" ry="190" fill="url(#sk-mg)"/><ellipse class="sk-mp" cx="320" cy="700" rx="100" ry="200" fill="url(#sk-mpg)"/>' +
      `<g class="sk-hv"><g fill="none" stroke="#6fb7c0">${swells}</g></g>` +
      `<g class="sk-glit" fill="${MOON}" fill-opacity=".6"><g class="sk-g1">${glints[0]}</g><g class="sk-g2">${glints[1]}</g><g class="sk-g3">${glints[2]}</g></g>` +
      pier() +
      // The fin, circling.
      `<g class="sk-orb">${fin(ripples)}</g>` +
      // The bell buoy: float, lattice, bell, the light on top and its reflection.
      '<g transform="translate(150 792)">' +
      '<g class="sk-lr"><path d="M-3 10H3V54H-3Z" fill="#ff6a50" fill-opacity=".22"/></g><g class="sk-lg"><path d="M-4 10H4V64H-4Z" fill="#7dffa8" fill-opacity=".3"/></g>' +
      '<g class="sk-rk">' +
      '<path d="M-20 -20L-7 -92M20 -20L7 -92M-17 -36H17M-13 -58H13M-9 -80H9M-17 -36L13 -58M17 -36L-13 -58M-13 -58L9 -80M13 -58L-9 -80" fill="none" stroke="#6e2621" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M20 -20L7 -92" stroke="#e09a90" stroke-opacity=".35" stroke-width="1.4"/>' +
      '<g transform="translate(0 -57)"><g class="sk-bell"><path d="M-7 14C-7 4 -5 0 0 0C5 0 7 4 7 14H9V17H-9V14Z" fill="#8a6c34" stroke="#c9a65a" stroke-opacity=".5"/></g></g>' +
      `<path class="sk-dong" d="M-24 -62Q-33 -52 -24 -42M24 -62Q33 -52 24 -42" fill="none" stroke="${FOAM}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>` +
      '<path d="M-30 0L-25 -20H25L30 0Q0 9 -30 0Z" fill="#5c1f1b" stroke="#c46a60" stroke-opacity=".35" stroke-width="1.5"/><rect x="-25" y="-14" width="50" height="5" fill="#2a0e0c"/>' +
      '<rect x="-6" y="-104" width="12" height="12" rx="2" fill="#11171b"/>' +
      '<g class="sk-lr"><circle cy="-98" r="26" fill="url(#sk-rh)"/><circle cy="-98" r="4.5" fill="#ff6a50"/></g>' +
      '<g class="sk-lg"><circle cy="-98" r="70" fill="url(#sk-gh)"/><circle cy="-98" r="5" fill="#7dffa8"/></g></g>' +
      `<ellipse rx="38" ry="5" fill="none" stroke="${FOAM}" stroke-opacity=".35" stroke-width="2"/></g>` +
      // Run and done: the fin charging the shore, and heading out to sea.
      `<g fill="none" stroke="${FOAM}" stroke-linecap="round" stroke-dasharray="1 1">` +
      '<path class="sk-wk" pathLength="1" d="M314 726Q296 790 262 852" stroke-opacity=".16" stroke-width="26"/>' +
      '<path class="sk-wk" pathLength="1" d="M314 726Q296 790 262 852" stroke-opacity=".75" stroke-width="4"/>' +
      '<g stroke-opacity=".5" stroke-width="2.6"><path class="sk-wk" pathLength="1" d="M238 694Q244 780 256 848"/><path class="sk-wk" pathLength="1" d="M386 754Q330 800 268 852"/></g></g>' +
      `<g class="sk-chg">${fin(bow)}</g><g class="sk-dep">${fin()}</g>` +
      // Error: the breach, cut off where it is still under the water.
      `<g clip-path="url(#sk-air)"><g class="sk-br"><path d="${SHARK}" transform="scale(1.12)" fill="${DARK}" stroke="${RIM}" stroke-opacity=".4" stroke-width="2"/></g></g>` +
      splash(BR_FROM, BR_SEA, 0.8, 0.38, next) +
      splash(BR_TO, BR_SEA - 6, 1.1, 2.08, next) +
      // The beach: sand, the wash, the surge, folded umbrellas, the warning sign and flags.
      '<path d="M-80 866C150 852 420 878 700 930S1240 994 1700 980V1240H-80Z" fill="url(#sk-sand)"/>' +
      '<path d="M-80 866C150 852 420 878 700 930S1240 994 1700 980" fill="none" stroke="#3b5058" stroke-opacity=".5" stroke-width="6"/>' +
      `<path class="sk-wash" d="M-80 861C150 847 420 873 700 925S1240 989 1700 975" fill="none" stroke="${FOAM}" stroke-opacity=".5" stroke-width="2.5" stroke-dasharray="40 14 70 20"/>` +
      `<path class="sk-surge" d="M-80 858C100 842 300 852 470 874V886C300 864 100 854 -80 870Z" fill="${FOAM}" fill-opacity=".5"/>` +
      umbrella(170, 988, 104, -4, '#6e2c28', '#a39d8b') +
      umbrella(216, 994, 112, 3, '#2a625f', '#a39d8b') +
      umbrella(262, 986, 100, -2, '#7d6a32', '#6e2c28') +
      umbrella(308, 992, 108, 5, '#2c4870', '#a39d8b') +
      '<path d="M118 958V900" stroke="#141a1d" stroke-width="4"/><rect x="98" y="878" width="40" height="26" rx="2" fill="#8f7a35" stroke="#2a2410" stroke-width="2"/>' +
      '<path d="M112 897C115 891 119 887 125 885C123 889 123 893 125 897Z" fill="#14110a"/><path d="M103 899q4 -3 8 0t8 0t8 0t8 0" fill="none" stroke="#14110a" stroke-width="2"/>' +
      '<path d="M372 986V796" stroke="#141a1d" stroke-width="3.4"/><circle cx="372" cy="794" r="3" fill="#2a3236"/>' +
      `<g transform="translate(372 798)">${flag('', '#a5352c')}<g class="sk-bfg">${flag('', '#3a9a5c')}</g><g transform="translate(0 30)">${flag('', '#b08a2e')}</g></g>` +
      '</g>',
    nook:
      // The tower: back posts and a half wall behind Claude, the front posts, the header and the gable, the roof.
      '<g fill="#0b1217"><rect x="34" y="104" width="8" height="200"/><rect x="378" y="104" width="8" height="200"/></g>' +
      '<rect x="10" y="300" width="400" height="160" fill="#0d151b"/><path d="M10 330H410M10 360H410M10 390H410M10 420H410" stroke="#17222a" stroke-width="2"/>' +
      `<rect x="6" y="294" width="408" height="9" rx="2" fill="${WOOD}" stroke="${WOOD_LIT}" stroke-opacity=".5"/>` +
      `<g fill="${WOOD}" stroke="${WOOD_LIT}" stroke-opacity=".45" stroke-width="1.5"><rect x="0" y="100" width="14" height="360"/><rect x="406" y="100" width="14" height="360"/>` +
      '<rect x="-30" y="94" width="480" height="12"/></g>' +
      `<path d="M-22 94L210 32L442 94Z" fill="#101a21"/><path d="${gable}" stroke="#0a1116" stroke-width="2"/>` +
      `<circle cx="210" cy="68" r="9" fill="#060b0f" stroke="${WOOD_LIT}" stroke-opacity=".4"/>` +
      '<path d="M-46 98L210 20L466 98V110L210 33L-46 110Z" fill="#17232b"/>' +
      `<path d="M-46 98L210 20L466 98" fill="none" stroke="${RIM}" stroke-opacity=".4" stroke-width="2"/>` +
      // The life ring on its hook.
      '<path d="M393 133L404 116" stroke="#5a5448" stroke-width="2"/>' +
      `<circle cx="393" cy="150" r="17" fill="none" stroke="#a9a395" stroke-width="8"/><circle cx="393" cy="150" r="17" fill="none" stroke="${RED}" stroke-width="8" stroke-dasharray="13.35 13.35"/>` +
      // The flagpole: yellow for the night, red hoisted on an error, green when done.
      '<path d="M64 64V-150" stroke="#2a3640" stroke-width="3"/><circle cx="64" cy="-152" r="3.4" fill="#4a5a64"/>' +
      `<g transform="translate(64 -146)">${flag('sk-fy', '#c99a36')}${flag('sk-fr', '#c43b30')}${flag('sk-fg', '#3fae66')}</g>` +
      // The CB whip antenna, sending rings while Claude talks.
      '<rect x="338" y="54" width="12" height="6" rx="2" fill="#2a3640"/>' +
      '<g transform="translate(344 56)"><g class="sk-aw"><path d="M0 0L6 -182" stroke="#56666f" stroke-width="2"/><circle cx="6" cy="-184" r="3" fill="#8ea0a8"/>' +
      [0, 0.45, 0.9].map(d => `<circle class="sk-ar" style="animation-delay:${d}s" cx="6" cy="-184" r="22" fill="none" stroke="${TEAL}" stroke-opacity=".85" stroke-width="2.6"/>`).join('') +
      '</g></g>',
    front:
      // The front wall of the tower under its window sill, a dim coral starburst painted on it.
      `<rect x="-6" y="404" width="432" height="56" fill="${WOOD}"/><path d="M-6 424H426M-6 444H426" stroke="#121c22" stroke-width="2"/>` +
      `<rect x="-6" y="400" width="432" height="9" rx="2" fill="${WOOD}" stroke="${WOOD_LIT}" stroke-opacity=".55" stroke-width="1.4"/>` +
      `<path d="${starburst(210, 434, 17, 6)}" fill="#d97757" fill-opacity=".5"/>`,
  }
}
