import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Glacier Crack: a climber in a helmet and headlamp, roped to ice screws, at a laptop on a hanging portaledge deep
// inside a turquoise crevasse. Banded ice walls glow from within and run off toward a far blue dark; a strip of night
// sky and a snow bridge hang far above, a huge serac hangs off the upper left wall. A command makes the glacier groan
// and the serac break away in a rain of ice blocks; an error splits the ledge and the wall behind Claude in a zigzag
// crack while icicles drop; done pours a beam of light down through the ice and the whole crevasse glows.
const ICE = '#5ce1e6'
const PALE = '#c4f7f8'
const SNOW = '#d8f1f4'
const ROPE = '#c45fd6'
const WEB = '#3a4852'
const ALU = '#a3b8c0'
const VX = 800
const VY = 470

type Pt = readonly [number, number]

const line = (points: readonly Pt[]): string => points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('')

// The two lips of the crevasse, jagged, from the top of the picture down to where they meet far off.
const L_LIP: readonly Pt[] = [[540, -40], [566, 30], [590, 24], [622, 96], [646, 92], [676, 170], [700, 166], [728, 240], [748, 236], [770, 320], [784, 380], [792, 440]]
const R_LIP: readonly Pt[] = [[1060, -40], [1036, 26], [1012, 22], [982, 92], [958, 88], [926, 164], [904, 160], [874, 236], [856, 232], [834, 318], [820, 380], [810, 440]]

// The serac: a hanging mass of ice on the upper left wall, its jagged foot over the drop. It breaks along BREAK, low
// enough to show in a wide window: the stub above stays frozen to the wall, the piece below falls.
const SERAC_FOOT: readonly Pt[] = [[-40, 352], [62, 334], [112, 384], [172, 362], [224, 414], [272, 372], [334, 402], [364, 330], [424, 352]]
const BREAK: readonly Pt[] = [[-40, 116], [40, 128], [90, 108], [160, 132], [230, 112], [300, 134], [360, 112], [420, 124], [454, 132]]
const FOOT_BACK = line([...SERAC_FOOT].reverse()).replace('M', 'L')
const SERAC = `M-40 -40H380L408 26L470 58L452 140L482 206L444 268${FOOT_BACK}Z`
const PIECE = `${line(BREAK)}L452 140L482 206L444 268${FOOT_BACK}Z`
const STUB = `M-40 -40H380L408 26L470 58${line([...BREAK].reverse()).replace('M', 'L')}Z`

/** Icicles hanging under a line: each a slim triangle, longest at the line's start. */
function icicles(x0: number, y0: number, x1: number, y1: number, count: number, len: Pt, seed: number): { d: string[]; tips: Pt[] } {
  const next = random(seed)
  const d: string[] = []
  const tips: Pt[] = []

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.3 + next() * 0.4) / count
    const x = x0 + (x1 - x0) * t
    const y = y0 + (y1 - y0) * t - 3
    const l = (len[0] + (len[1] - len[0]) * t) * (0.4 + next() * 0.6)
    const w = 2 + l * 0.12

    d.push(`M${f(x - w)} ${f(y)}L${f(x + w * 0.2)} ${f(y + l)}L${f(x + w)} ${f(y)}Z`)
    tips.push([x + w * 0.2, y + l])
  }

  return { d, tips }
}

/** Dots as one path of tiny squares. */
function dots(points: readonly Pt[], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** The layered bands of one wall, running off toward the far end: soft glowing layers, their crisp edges, dirt lines. */
function bands(side: 'l' | 'r', seed: number): string {
  const next = random(seed)
  const x0 = side === 'l' ? -40 : 1640
  const ex = side === 'l' ? VX - 8 : VX + 8
  let glow = ''
  let edge = ''
  let dirt = ''

  for (let i = 0; i < 15; i += 1) {
    const y0 = -140 + i * 84 + next() * 30
    const ey = VY + (y0 - VY) * 0.06
    const d = `M${x0} ${f(y0)}Q${f((x0 + ex) / 2)} ${f((y0 + ey) / 2 + (next() - 0.5) * 60)} ${ex} ${f(ey)}`

    if (i % 2 === 0) {
      glow += `<path d="${d}" stroke-width="${f(10 + next() * 20)}"/>`
      edge += d
    } else {
      dirt += d
    }
  }

  return (
    `<g class="gc-bands" fill="none"><g stroke="url(#gc-b${side})">${glow}</g>` +
    `<path d="${edge}" stroke="url(#gc-e${side})" stroke-width="1.6"/><path d="${dirt}" stroke="url(#gc-d${side})" stroke-width="2.6"/></g>`
  )
}

/** Vertical fracture lines down a near wall, each with a chipped, lit edge beside it. */
function fractures(xs: readonly number[], seed: number, to = 1040): string {
  const next = random(seed)
  let dark = ''
  let lit = ''

  for (const x of xs) {
    const pts: Pt[] = []

    for (let y = -40; y <= to; y += 90) pts.push([x + (next() - 0.5) * 18, y])

    dark += line(pts)
    lit += line(pts.map(([px, py]) => [px + 4, py] as const))
  }

  return `<path d="${dark}" fill="none" stroke="#02090d" stroke-opacity=".8" stroke-width="3"/><path d="${lit}" fill="none" stroke="${ICE}" stroke-opacity=".16" stroke-width="1.4"/>`
}

/** An overhanging ice lip with icicles under it and a few drips falling from the longest. */
function overhang(top: string, x0: number, y0: number, x1: number, y1: number, count: number, len: Pt, seed: number, drips: number): string {
  const ice = icicles(x0, y0, x1, y1, count, len, seed)
  const dropAt = [...ice.tips]
    .sort((a, b) => b[1] - a[1])
    .slice(0, drips)
    .map(
      ([x, y], i) =>
        `<circle class="gc-drip" style="--fy:${f(120 + i * 40)}px;animation-delay:${f(-i * 1.1)}s" cx="${f(x)}" cy="${f(y + 2)}" r="2.2" fill="${PALE}"/>`,
    )
    .join('')

  return (
    `<path d="${ice.d.join('')}" fill="${PALE}" fill-opacity=".5"/>` +
    `<path d="${top}" fill="#134754"/>` +
    `<path d="M${x0 - 10} ${y0}L${x1 + 10} ${y1}" stroke="${PALE}" stroke-opacity=".35" stroke-width="2.4"/>` +
    dropAt
  )
}

/** The serac's top, frozen to the wall: a stratum, column lines, its shadowed side. It stays when the piece falls. */
function stub(): string {
  return (
    `<path d="${STUB}" fill="url(#gc-sf)"/>` +
    '<path d="M408 26L470 58L454 132L425 125L400 60Z" fill="#082631" fill-opacity=".85"/>' +
    `<path d="M-40 60Q200 38 440 80" fill="none" stroke="${ICE}" stroke-opacity=".26" stroke-width="7"/>` +
    '<path d="M-40 104Q200 84 450 120M120 -40L132 122M250 -40L237 114M360 -40L372 100L370 114" fill="none" stroke="#03121a" stroke-opacity=".65" stroke-width="2.6"/>' +
    `<path d="M454 132L470 58L408 26" fill="none" stroke="${PALE}" stroke-opacity=".42" stroke-width="2.4" stroke-linejoin="round"/>`
  )
}

/** The piece of the serac that breaks away: strata, column splits, a shadowed side, a lit foot, big icicles under it. */
function serac(): string {
  const ice = SERAC_FOOT.slice(1)
    .map(([x1, y1], i) => {
      const [x0, y0] = SERAC_FOOT[i] ?? [x1, y1]

      return icicles(x0, y0 + 4, x1, y1 + 4, 3, [56, 40], 31 + i).d.join('')
    })
    .join('')

  return (
    `<path d="${ice}" fill="${PALE}" fill-opacity=".55"/>` +
    `<path d="${PIECE}" fill="url(#gc-sf)"/>` +
    '<path d="M425 125L454 132L452 140L482 206L444 268L424 352L404 330L430 262L408 196L428 136Z" fill="#082631" fill-opacity=".85"/>' +
    `<g fill="none" stroke="${ICE}" stroke-opacity=".26" stroke-width="7"><path d="M-40 150Q200 128 456 166"/><path d="M-40 246Q200 222 466 250"/></g>` +
    '<path d="M-40 198Q200 176 462 206M-40 296Q200 276 440 306" fill="none" stroke="#03121a" stroke-opacity=".6" stroke-width="2"/>' +
    '<path d="M132 122L112 250L124 384M237 114L262 260L244 400M370 114L350 250L364 330" fill="none" stroke="#03121a" stroke-opacity=".7" stroke-width="3"/>' +
    `<path d="M136 122L116 250L128 384M241 114L266 260L248 400M374 114L354 250" fill="none" stroke="${PALE}" stroke-opacity=".18" stroke-width="1.5"/>` +
    `<path d="${line(SERAC_FOOT)}L444 268L482 206L452 140L454 132" fill="none" stroke="${PALE}" stroke-opacity=".42" stroke-width="2.4" stroke-linejoin="round"/>` +
    // The column splits light up down from the break as the glacier groans.
    `<path class="gc-scrk gc-split" pathLength="1" d="M237 114L262 260L244 400M132 122L112 250L124 384" fill="none" stroke="${PALE}" stroke-width="2.6" stroke-linejoin="round"/>`
  )
}

/** The rugged laptop, a thermos and a spare ice screw on the portaledge. */
function device(light: string, activity: Activity): string {
  const keys = `<path d="${Array.from({ length: 6 }, (_, i) => `M${252 + i * 13} 325h8v3h-8z`).join('')}" fill="${light}" fill-opacity=".55"/>`
  const steam =
    activity === 'idle' || activity === 'thinking'
      ? '<path class="gc-steam" d="M384 276c-6 -10 6 -16 0 -26M392 276c-6 -10 6 -16 0 -26" fill="none" stroke="#e3fafb" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>'
      : ''

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2a3740"/>' +
    keys +
    // The lid, turned a little toward the viewer so the screen face and its lines of code show.
    '<path d="M324 329L349 233L375 238L351 331Z" fill="#2a3740"/>' +
    `<path d="M330 323L352 240L368 243L346 325Z" fill="${light}"/>` +
    '<path d="M349 262h9M345 276h10M341 290h8M338 304h9" stroke="#06252b" stroke-opacity=".6" stroke-width="2.4"/>' +
    '<path d="M355 234l3 -5l3 5M366 236l3 -4l2 4M373 252l5 -2M334 323l3 -4l2 4" fill="none" stroke="#e8fbfc" stroke-opacity=".75" stroke-width="1.6"/>' +
    // The thermos, its cap off.
    '<rect x="378" y="288" width="18" height="42" rx="4" fill="#38535e" stroke="#7fa2ac" stroke-width="1.6"/>' +
    '<rect x="377" y="282" width="20" height="8" rx="3" fill="#18262c"/><path d="M381 302H393" stroke="#5ce1e6" stroke-opacity=".5" stroke-width="2"/>' +
    steam +
    // A spare ice screw lying by the thermos.
    '<path d="M404 326H444" stroke="#b9cbd2" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M412 324v4M418 324v4M424 324v4M430 324v4M436 324v4" stroke="#5b707a" stroke-width="1.4"/>' +
    '<path d="M444 320L456 322Q460 326 456 330L444 332Z" fill="#cfdbe0"/>'
  )
}

export function glacierCrackWorld(): World {
  const next = random(4127)

  // The sky: stars between the lips, in two twinkling sets.
  const starA: Pt[] = []
  const starB: Pt[] = []

  for (let i = 0; i < 46; i += 1) {
    const y = next() * next() * 400
    const lx = 540 + ((y + 40) / 480) * 252 + 14
    const rx = 1060 - ((y + 40) / 480) * 250 - 14

    if (rx - lx < 20) continue
    ;(i % 2 ? starA : starB).push([lx + next() * (rx - lx), y])
  }

  const leftWall = `M-40 -40L540 -40${line(L_LIP).replace('M', 'L')}L790 500L430 1040H-40Z`
  const rightWall = `M1640 -40L1060 -40${line(R_LIP).replace('M', 'L')}L812 500L1170 1040H1640Z`
  const lipLit = (lip: readonly Pt[]) => `<path d="${line(lip)}" fill="none" stroke="${PALE}" stroke-opacity=".22" stroke-width="2.4" stroke-linejoin="round"/>`

  // The snow bridge across the sky, its icicles, and the snow it sheds when the glacier groans.
  const bridgeIce = [...icicles(612, 104, 800, 88, 9, [26, 18], 21).d, ...icicles(800, 88, 990, 100, 9, [18, 26], 22).d].join('')
  const bridgeSift = [690, 780, 868]
    .map((x, i) => `<path class="gc-bsift" style="animation-delay:${f(0.3 + i * 0.25)}s" d="M${x} ${96 - i * 4}V560" stroke="${PALE}" stroke-opacity=".2" stroke-width="5" stroke-dasharray="10 28"/>`)
    .join('')

  // The ice blocks that break off the serac's foot, and the powder the collapse throws up.
  const blocks = Array.from({ length: 9 }, (_, i) => {
    const x = 70 + next() * 360
    const y = 330 + next() * 70
    const s = 14 + next() * 24
    const d = `M${f(-s)} ${f(-s * 0.6)}L${f(s * 0.5)} ${f(-s)}L${f(s)} ${f(s * 0.3)}L${f(-s * 0.3)} ${f(s * 0.8)}Z`
    const style =
      `--dx:${f((next() - 0.5) * 140)}px;--dy:${f(500 + next() * 120)}px;--r:${f((next() - 0.5) * 420)}deg;` +
      `animation-delay:${f(0.95 + i * 0.1)}s;animation-duration:${f(1.7 + next() * 0.5)}s`

    return (
      `<g transform="translate(${f(x)} ${f(y)})"><g class="gc-blk" style="${style}">` +
      `<path d="${d}" fill="${i % 2 ? '#2b7c8a' : '#1d5e6c'}" stroke="${PALE}" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/></g></g>`
    )
  }).join('')
  const powder = (cx: number, cy: number, n: number, spread: number, delay: number, seconds: number) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<circle class="gc-pw" style="animation-delay:${f(delay + i * 0.12)}s;animation-duration:${seconds}s" cx="${f(cx + (i - (n - 1) / 2) * spread + next() * 20)}" cy="${f(cy + (next() - 0.5) * 40)}" r="${f(50 + next() * 34)}" fill="url(#gc-pw)"/>`,
    ).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#030a0e',
      furniture: '#1b3a46',
      metal: '#2a3740',
      paper: '#e3f4f5',
      light: { idle: '#3a9aa4', work: ICE, bright: '#d4fbfc' },
      headTop: 198,
      glowAt: [346, 284],
      device,
      wear: {
        // The rope from the harness, up behind the far side to the anchor.
        behind: `<path d="M76 332C52 316 44 270 52 228S64 170 60 150" fill="none" stroke="${ROPE}" stroke-width="4" stroke-linecap="round"/>`,
        // An amber climbing helmet with vents and a dark rim that ends above the eyes; the headlamp on its strap sits
        // on the brow. Lower down, a teal harness, a tie-in knot and two ice screws on a gear loop.
        front:
          '<path d="M62 249C62 208 102 190 150 190C198 190 238 208 238 249Z" fill="#f0b43c" stroke="#8a5a14" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M62 249C62 214 92 196 126 191C100 204 86 226 88 249Z" fill="#c2861f"/>' +
          '<path d="M172 196C198 201 220 214 228 234" fill="none" stroke="#ffe39a" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>' +
          '<g fill="#6a440e"><rect x="114" y="199" width="16" height="6" rx="3"/><rect x="142" y="195" width="16" height="6" rx="3"/><rect x="170" y="199" width="16" height="6" rx="3"/></g>' +
          '<path d="M64 232C100 223 200 223 236 232V240C200 231 100 231 64 240Z" fill="#1d3f4a"/>' +
          '<rect x="58" y="243" width="184" height="8" rx="4" fill="#232c33"/>' +
          '<rect x="133" y="215" width="34" height="22" rx="6" fill="#20282e" stroke="#5f6e78" stroke-width="2"/>' +
          '<circle cx="150" cy="226" r="13" fill="#e9fdfd" fill-opacity=".22"/><circle cx="150" cy="226" r="6.5" fill="#f2ffff"/>' +
          '<rect x="70" y="326" width="160" height="9" fill="#2a6f7a"/><path d="M70 328H230" stroke="#86dfe3" stroke-opacity=".5" stroke-width="1.4"/>' +
          '<rect x="140" y="324" width="20" height="13" rx="3" fill="#c9d6dc"/>' +
          '<path d="M84 336H108" stroke="#d8a03a" stroke-width="2.4"/><g fill="#b9cbd2"><rect x="87" y="336" width="5" height="14" rx="1.5"/><rect x="99" y="336" width="5" height="12" rx="1.5"/></g>' +
          `<path d="M150 340C120 346 92 342 70 333" fill="none" stroke="${ROPE}" stroke-width="4" stroke-linecap="round"/>` +
          `<circle cx="152" cy="341" r="6" fill="${ROPE}" stroke="#6a2a78" stroke-width="1.6"/>`,
      },
      seatArt:
        // The portaledge's far strap, an ice axe planted in the ledge, a coil of rope, and a block of ice for a seat.
        `<path d="M174 332L300 30" stroke="${WEB}" stroke-width="4"/>` +
        '<path d="M60 456L49 340" stroke="#2f3a42" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M26 348Q48 334 76 342L50 352Z" fill="#b9cbd2"/><path d="M48 340L40 330H58Z" fill="#8fa3ab"/>' +
        `<g fill="none" stroke="${ROPE}" stroke-width="2.6"><ellipse cx="66" cy="449" rx="26" ry="5"/><ellipse cx="66" cy="443" rx="21" ry="4"/><ellipse cx="66" cy="438" rx="15" ry="3"/></g>` +
        '<path d="M98 362L112 352L192 350L204 358L208 456H94Z" fill="#17505d" stroke="#5fc6cf" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M96 392Q150 384 206 394M95 424Q150 416 207 426" fill="none" stroke="#5ce1e6" stroke-opacity=".32" stroke-width="3"/>' +
        '<path d="M182 360L198 452" stroke="#c4f7f8" stroke-opacity=".28" stroke-width="2"/>',
      tableArt:
        // The two-screw anchor and its master point, the rope from there to Claude's harness, and the portaledge:
        // straps to the master point, an aluminium frame, a teal bed hanging over the drop. The anchor is part of the
        // rig so a portal's Claude hangs from something too.
        `<path d="M300 36C220 120 120 112 60 150" fill="none" stroke="${ROPE}" stroke-width="4"/>` +
        '<g fill="#cfdbe0"><path d="M276 -14L292 -18L294 -2L280 2Z"/><path d="M312 -20L328 -22L328 -6L314 -4Z"/></g>' +
        '<g fill="none" stroke="#e8eef0" stroke-width="2.6"><ellipse cx="286" cy="10" rx="5" ry="9"/><ellipse cx="320" cy="4" rx="5" ry="9"/></g>' +
        '<path d="M286 18L300 26M320 12L300 26" stroke="#e3a43a" stroke-width="3"/>' +
        `<path d="M468 332L300 30M430 334L300 30" stroke="${WEB}" stroke-width="4"/>` +
        '<g fill="#7f949c"><rect x="396" y="196" width="10" height="7" rx="2"/><rect x="376" y="196" width="10" height="7" rx="2"/></g>' +
        `<ellipse cx="300" cy="32" rx="6" ry="10" fill="none" stroke="#cfdbe0" stroke-width="3"/>` +
        `<rect x="164" y="328" width="308" height="8" rx="4" fill="${ALU}" stroke="#5b707a" stroke-width="1.4"/>` +
        '<path d="M170 336H466V344Q318 362 170 344Z" fill="#1d4b58" stroke="#3f7f8c" stroke-width="1.4"/>' +
        '<path d="M182 344Q318 358 454 344" fill="none" stroke="#7fd3d8" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="5 4"/>' +
        `<rect x="164" y="328" width="8" height="28" rx="4" fill="${ALU}"/><rect x="464" y="328" width="8" height="28" rx="4" fill="${ALU}"/>` +
        '<rect x="168" y="350" width="300" height="6" rx="3" fill="#7d939c"/>',
    },
    style:
      '@keyframes gc-in{to{opacity:1}}' +
      '@keyframes gc-draw{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      // Ambient: stars twinkle, the ice glows and breathes, mist drifts in the drop, icicles drip, the rope sways.
      '.gc-tw{animation:gc-tw 3.4s ease-in-out infinite alternate}.gc-tw2{animation-delay:-1.7s}@keyframes gc-tw{from{opacity:.35}to{opacity:1}}' +
      '.gc-br{animation:gc-br 8s ease-in-out infinite alternate}@keyframes gc-br{from{opacity:.6}to{opacity:1}}' +
      '.gc-bands{opacity:.78}' +
      '.gc-deep{opacity:.7}.st-thinking .gc-deep{animation:gc-pulse 3.2s ease-in-out infinite alternate}@keyframes gc-pulse{from{opacity:.4}to{opacity:1}}' +
      '.st-done .gc-deep{animation:gc-in 2s ease-out .4s both}' +
      // Thinking: the headlamp's spot wanders the wall while Claude looks up.
      '.st-thinking .gc-spot{animation:gc-spot 3.2s ease-in-out infinite alternate}@keyframes gc-spot{from{transform:translate(-20px,10px)}to{transform:translate(40px,-60px)}}' +
      '.gc-mist{animation:gc-mist 18s ease-in-out infinite alternate}@keyframes gc-mist{to{transform:translateX(70px)}}' +
      '.gc-drip{opacity:0;animation:gc-drip 3.3s ease-in infinite}.st-responding .gc-drip{animation-duration:1.9s}' +
      '@keyframes gc-drip{0%,58%{opacity:0;transform:translateY(0)}62%{opacity:.85;transform:translateY(0)}100%{opacity:0;transform:translateY(var(--fy))}}' +
      '.gc-sway{animation:gc-sway 7s ease-in-out infinite alternate}.st-run .gc-sway{animation-duration:1.4s}@keyframes gc-sway{from{transform:rotate(-.7deg)}to{transform:rotate(.7deg)}}' +
      '.gc-steam{animation:gc-steam 3s ease-in-out infinite alternate}@keyframes gc-steam{from{opacity:.3;transform:translateY(0)}to{opacity:.8;transform:translateY(-6px)}}' +
      '.gc-led{animation:gc-led 2.4s steps(1) infinite}@keyframes gc-led{0%{opacity:1}50%{opacity:.2}}' +
      // Tool: the ice screw turns into the wall, shavings spraying off it.
      '.st-tool .gc-turn{animation:mv-spin .9s linear infinite}' +
      '.gc-shv{opacity:0}.st-tool .gc-shv{animation:gc-shv .9s ease-out infinite}' +
      '@keyframes gc-shv{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Read: the route topo unrolls on its screw.
      '.gc-topo{transform:scaleY(0)}.st-read .gc-topo{animation:gc-unroll 1.2s ease-out both}@keyframes gc-unroll{to{transform:scaleY(1)}}' +
      '.gc-route{stroke-dasharray:5 5;animation:gc-march 1.4s linear infinite}@keyframes gc-march{to{stroke-dashoffset:-10}}' +
      // Web: the radio on the strap calls out.
      '.gc-sig{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-web .gc-sig{animation:gc-sig 1.8s ease-out infinite;animation-delay:calc(var(--k) * .6s)}' +
      '@keyframes gc-sig{0%{opacity:0;transform:scale(.4)}25%{opacity:.85}100%{opacity:0;transform:scale(1.8)}}' +
      // Run: the glacier groans and shakes, a crack races across the serac's top, it sags on its hinge, breaks away
      // and falls the length of the wall in a rain of ice blocks and powder.
      '.st-run .gc-qk{animation:gc-qk .14s linear .1s 9}@keyframes gc-qk{25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,-1px)}}' +
      '.gc-scrk{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-run .gc-scrk{animation:gc-scrk 3.2s ease-out .1s both}' +
      '@keyframes gc-scrk{0%{opacity:1;stroke-dashoffset:1}16%{stroke-dashoffset:0}45%{opacity:1}100%{opacity:.3;stroke-dashoffset:0}}' +
      '.st-run .gc-split{animation-delay:.25s}' +
      '.gc-scar{opacity:0}.st-run .gc-scar{animation:gc-in 1.6s ease-out 1.1s both}' +
      '.st-run .gc-fall{animation:gc-fall 3.4s .15s both}' +
      '@keyframes gc-fall{0%{transform:rotate(0);animation-timing-function:ease-in-out}10%{transform:rotate(-.6deg);animation-timing-function:ease-in-out}' +
      '20%{transform:rotate(1.6deg);animation-timing-function:ease-in}27%{transform:translate(4px,16px) rotate(4deg);animation-timing-function:cubic-bezier(.4,0,.8,.7)}' +
      '82%{opacity:1}100%{transform:translate(-20px,900px) rotate(14deg);opacity:0}}' +
      '.gc-blk{opacity:0}.st-run .gc-blk{animation:gc-blk 2s cubic-bezier(.45,0,.85,.6) both}' +
      '@keyframes gc-blk{0%{opacity:0;transform:translate(0,0) rotate(0)}6%{opacity:1}86%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.gc-pw{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .gc-pw{animation-name:gc-pw;animation-timing-function:ease-out;animation-fill-mode:both}' +
      '@keyframes gc-pw{0%{opacity:0;transform:scale(.3)}20%{opacity:.9}100%{opacity:0;transform:translate(-20px,24px) scale(2.3)}}' +
      '.gc-sift{opacity:0}.st-run .gc-sift{animation:gc-sift 3.4s ease-out .2s both}@keyframes gc-sift{10%{opacity:1}75%{opacity:.8}100%{opacity:0}}' +
      '.gc-bsift{opacity:0}.st-run .gc-bsift{animation:gc-bsift 1.6s linear infinite}@keyframes gc-bsift{0%{opacity:0;stroke-dashoffset:0}20%,80%{opacity:1}100%{opacity:0;stroke-dashoffset:-380}}' +
      // Error: the ledge splits from its broken end and the crack climbs the wall beside Claude while the roof above
      // splits too; the alcove jolts, chips jump, icicles and roof chunks drop and shatter on the ledge.
      '.st-error .gc-nq{animation:gc-qk .13s linear .3s 6}' +
      '.gc-ck{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .gc-ck{animation:gc-draw var(--t,.5s) ease-out var(--d,.1s) both}' +
      '.gc-gap,.gc-gapx{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .gc-gap{animation:gc-gap .7s ease-out .35s both}.st-error .gc-gapx{animation:gc-gapx .7s ease-out .65s both}' +
      '@keyframes gc-gap{from{opacity:0;transform:scaleY(.15)}to{opacity:1;transform:scaleY(1)}}@keyframes gc-gapx{from{opacity:0;transform:scaleX(.15)}to{opacity:1;transform:scaleX(1)}}' +
      '.gc-chip,.gc-shat{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .gc-chip{animation:gc-chip 1.1s ease-out both}' +
      '@keyframes gc-chip{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:1}45%{transform:translate(var(--dx),var(--dy)) rotate(var(--r))}' +
      '100%{opacity:0;transform:translate(calc(var(--dx) * 1.5),10px) rotate(var(--r))}}' +
      '.gc-icef{transform-box:fill-box;transform-origin:50% 0}.st-error .gc-icef{animation:gc-icef .9s both}' +
      '@keyframes gc-icef{0%{transform:translate(0,0);animation-timing-function:ease-in-out}14%{transform:translate(1px,3px) rotate(2deg);animation-timing-function:cubic-bezier(.5,0,1,.6)}' +
      '80%{opacity:1;transform:translate(0,var(--fy))}86%,100%{opacity:0;transform:translate(0,var(--fy))}}' +
      '.st-error .gc-shat{animation:gc-chip .9s ease-out both}' +
      // Done: a beam pours down through the ice onto the ledge, the walls glow turquoise, crystals glitter in the light.
      '.gc-beam,.gc-dglow,.gc-dsky{opacity:0}' +
      '.st-done .gc-beam{animation:gc-in 1.5s ease-out .3s both}.st-done .gc-dglow{animation:gc-in 2.2s ease-out .4s both}' +
      '.st-done .gc-dsky{animation:gc-in 1.4s ease-out .1s both}.st-done .gc-bands{animation:gc-in 2.2s ease-out .4s both}' +
      '.gc-spk{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .gc-spk{animation:gc-spk 2.2s ease-in-out infinite}' +
      '@keyframes gc-spk{0%,100%{opacity:0;transform:scale(.2)}50%{opacity:.9;transform:scale(1) rotate(45deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="gc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071526"/><stop offset=".45" stop-color="#04101a"/><stop offset="1" stop-color="#02080d"/></linearGradient>' +
      '<linearGradient id="gc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1f40"/><stop offset=".5" stop-color="#081530"/><stop offset="1" stop-color="#050d1a"/></linearGradient>' +
      '<linearGradient id="gc-wl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f3b48"/><stop offset=".38" stop-color="#0b2c38"/><stop offset=".78" stop-color="#05141c"/><stop offset="1" stop-color="#030a0f"/></linearGradient>' +
      '<linearGradient id="gc-wr" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#0f3b48"/><stop offset=".38" stop-color="#0b2c38"/><stop offset=".78" stop-color="#05141c"/><stop offset="1" stop-color="#030a0f"/></linearGradient>' +
      // Band strokes fade out toward the far end, so the middle stays a quiet dark.
      ['l', 'r']
        .map(side => {
          const [a, b] = side === 'l' ? [-40, 760] : [1640, 840]
          const stops = (color: string, near: number, mid: number) =>
            `<stop offset="0" stop-color="${color}" stop-opacity="${near}"/><stop offset=".5" stop-color="${color}" stop-opacity="${mid}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>`
          const grad = (id: string, inner: string) =>
            `<linearGradient id="${id}${side}" gradientUnits="userSpaceOnUse" x1="${a}" y1="0" x2="${b}" y2="0">${inner}</linearGradient>`

          return grad('gc-b', stops(ICE, 0.3, 0.1)) + grad('gc-e', stops(PALE, 0.55, 0.12)) + grad('gc-d', stops('#01070b', 0.75, 0.3))
        })
        .join('') +
      `<radialGradient id="gc-gl"><stop offset="0" stop-color="${ICE}" stop-opacity=".28"/><stop offset=".5" stop-color="${ICE}" stop-opacity=".1"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="gc-gd"><stop offset="0" stop-color="${ICE}" stop-opacity=".34"/><stop offset=".55" stop-color="${ICE}" stop-opacity=".14"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="gc-dp"><stop offset="0" stop-color="${ICE}" stop-opacity=".16"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="gc-ms"><stop offset="0" stop-color="#3a9aa6" stop-opacity=".16"/><stop offset="1" stop-color="#3a9aa6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gc-pw"><stop offset="0" stop-color="#e3fafb" stop-opacity=".48"/><stop offset=".6" stop-color="#bff0f2" stop-opacity=".18"/><stop offset="1" stop-color="#bff0f2" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="gc-sk"><stop offset="0" stop-color="${PALE}" stop-opacity=".34"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></radialGradient>` +
      // In the serac's own space, so the stub and the falling piece meet without a seam.
      '<linearGradient id="gc-sf" gradientUnits="userSpaceOnUse" x1="0" y1="-40" x2="0" y2="414"><stop offset="0" stop-color="#16586a"/><stop offset=".6" stop-color="#1b6676"/><stop offset="1" stop-color="#0f4250"/></linearGradient>' +
      '<linearGradient id="gc-sc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3fb4bf" stop-opacity=".34"/><stop offset="1" stop-color="#1f6e7c" stop-opacity=".12"/></linearGradient>' +
      '<linearGradient id="gc-sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a5b68"/><stop offset="1" stop-color="#0c2a35"/></linearGradient>' +
      '<linearGradient id="gc-cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a5664"/><stop offset="1" stop-color="#0a2832"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#gc-bg)"/>' +
      // The strip of night sky far above, its stars, the far glow where the walls meet, mist in the drop.
      '<rect x="480" y="-40" width="640" height="540" fill="url(#gc-sky)"/>' +
      `<g fill="#eaf6ff"><path class="gc-tw" d="${dots(starA, 2.4)}"/><path class="gc-tw gc-tw2" d="${dots(starB, 1.8)}"/></g>` +
      '<ellipse class="gc-deep" cx="800" cy="470" rx="130" ry="300" fill="url(#gc-dp)"/>' +
      '<ellipse class="gc-mist" cx="770" cy="860" rx="360" ry="70" fill="url(#gc-ms)"/>' +
      // The snow bridge, hidden at both ends in the walls, pinned to the top so a wide window keeps it.
      '<g class="mv-t">' +
      '<path d="M560 72Q800 26 1040 62V116Q800 70 560 122Z" fill="url(#gc-sb)"/>' +
      `<path d="M560 72Q800 26 1040 62" fill="none" stroke="${SNOW}" stroke-opacity=".48" stroke-width="3.4"/>` +
      `<path d="M560 122Q800 70 1040 116" fill="none" stroke="${ICE}" stroke-opacity=".3" stroke-width="2"/>` +
      `<path d="${bridgeIce}" fill="${PALE}" fill-opacity=".32"/>` +
      bridgeSift +
      '</g>' +
      // The left wall: banded ice, a glow deep inside it, fractures, an overhang of icicles, a wedged block below.
      '<g class="gc-qk">' +
      `<path d="${leftWall}" fill="url(#gc-wl)"/>` +
      '<circle class="gc-br" cx="190" cy="600" r="430" fill="url(#gc-gl)"/>' +
      bands('l', 41) +
      fractures([66, 246, 404], 42) +
      lipLit(L_LIP) +
      overhang('M-40 546L470 592V606L-40 578Z', -30, 578, 460, 605, 22, [92, 40], 43, 3) +
      '<circle class="gc-dglow" cx="160" cy="560" r="470" fill="url(#gc-gd)"/>' +
      // The serac: the fresh ice the piece leaves behind, the stub that stays, the piece on its hinge at the break,
      // the crack where it breaks, its glow when the work is done, the snow that pours off.
      `<path class="gc-scar" d="${PIECE}" fill="url(#gc-sc)"/>` +
      stub() +
      `<g transform="translate(-40 116)"><g class="gc-fall"><g transform="translate(40 -116)">${serac()}</g></g></g>` +
      `<path class="gc-scrk" pathLength="1" d="${line(BREAK)}" fill="none" stroke="${ICE}" stroke-opacity=".35" stroke-width="10" stroke-linejoin="round"/>` +
      `<path class="gc-scrk" pathLength="1" d="${line(BREAK)}" fill="none" stroke="${PALE}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path class="gc-dglow" d="${SERAC}" fill="${ICE}" fill-opacity=".14"/>` +
      `<g class="gc-sift">${rain({ seed: 73, count: 8, length: [14, 28], slant: 20, seconds: 1.1, stroke: PALE, opacity: 0.4, box: [60, 120, 380, 560] })}</g>` +
      powder(220, 124, 3, 120, 0.5, 2.2) +
      blocks +
      powder(230, 400, 3, 110, 1.2, 2.2) +
      '<g class="mv-b">' +
      '<path d="M30 1040L70 900L180 862L330 876L392 940L380 1040Z" fill="url(#gc-cs)"/>' +
      `<path d="M66 904L180 860L332 874L394 936L330 892L182 880Z" fill="${SNOW}" fill-opacity=".2"/>` +
      `<path d="M70 900L180 862L330 876L392 940" fill="none" stroke="${SNOW}" stroke-opacity=".38" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M58 950Q220 924 386 966M48 990Q210 966 384 1004" fill="none" stroke="${ICE}" stroke-opacity=".22" stroke-width="4"/>` +
      powder(230, 860, 5, 60, 2, 2.8) +
      '</g></g>' +
      // The right wall, with its own glow, bands and an overhang near the top. Not pinned: it must stay lined up with
      // the left wall, or a narrow window slides it over the left one.
      '<g class="gc-qk">' +
      `<path d="${rightWall}" fill="url(#gc-wr)"/>` +
      '<circle class="gc-br" style="animation-delay:-4s" cx="1430" cy="470" r="400" fill="url(#gc-gl)"/>' +
      bands('r', 51) +
      // They stop above Claude's alcove, where they would read as cables.
      fractures([1236, 1376, 1530], 52, 410) +
      lipLit(R_LIP) +
      overhang('M1640 130L1110 218V232L1640 164Z', 1630, 164, 1120, 232, 20, [80, 36], 53, 1) +
      '<circle class="gc-dglow" cx="1440" cy="470" r="440" fill="url(#gc-gd)"/>' +
      '</g>' +
      // The sky brightening over the done beam, pinned to the top-right with it.
      '<g class="mv-r"><g class="mv-t"><ellipse class="gc-dsky" cx="1200" cy="-40" rx="340" ry="260" fill="url(#gc-sk)"/></g></g>' +
      // Spindrift sifting down from the lips.
      rain({ seed: 71, count: 18, length: [2, 5], slant: 80, seconds: 15, stroke: '#e3fafb', opacity: 0.3 }) +
      rain({ seed: 72, count: 8, length: [4, 8], slant: 120, seconds: 10, stroke: '#ffffff', opacity: 0.24 }),
    nook: nook(),
    front: sparkles(),
  }
}

/**
 * The crack: across the ledge from its broken end and up the wall beside Claude in one run, and through the ice roof
 * above Claude, their gaps opening as they go.
 */
function crack(): string {
  const floor: Pt[] = [[-96, 452], [-72, 436], [-50, 446], [-26, 418], [-4, 428], [16, 404], [34, 388]]
  const wall: Pt[] = [[34, 388], [18, 340], [40, 300], [16, 250], [36, 200], [10, 150], [28, 100], [6, 50]]
  const roof: Pt[] = [[150, -175], [176, -194], [156, -212], [188, -230], [170, -246], [192, -262]]
  const branches = 'M16 250L-14 222L-34 236M36 200L64 176M-50 446L-80 470M28 100L48 70M156 -212L118 -224L96 -214M188 -230L228 -240'
  const taper = (n: number, i: number, from: number, to: number) => from + ((to - from) * i) / (n - 1)
  const across = (pts: readonly Pt[], w: (i: number) => number) =>
    `${line(pts.map(([x, y], i) => [x, y - w(i)] as const))}${line([...pts].reverse().map(([x, y], i) => [x, y + w(pts.length - 1 - i)] as const)).replace('M', 'L')}Z`
  const upward = (pts: readonly Pt[], w: (i: number) => number) =>
    `${line(pts.map(([x, y], i) => [x - w(i), y] as const))}${line([...pts].reverse().map(([x, y], i) => [x + w(pts.length - 1 - i), y] as const)).replace('M', 'L')}Z`
  const gapStyle = `fill="#01070b" stroke="${ICE}" stroke-opacity=".55" stroke-width="1.4" stroke-linejoin="round"`
  const glow = (d: string, delay: number, seconds: number) =>
    `<path class="gc-ck" style="--d:${delay}s;--t:${seconds}s" pathLength="1" d="${d}" fill="none" stroke="${ICE}" stroke-opacity=".4" stroke-width="18" stroke-linejoin="round"/>` +
    `<path class="gc-ck" style="--d:${delay}s;--t:${seconds}s" pathLength="1" d="${d}" fill="none" stroke="${PALE}" stroke-width="3.4" stroke-linejoin="round"/>`
  const spots: readonly Pt[] = [[-80, 444], [-40, 432], [0, 420], [30, 360], [24, 270], [30, 170]]
  const chips = spots
    .map(
      ([x, y], i) =>
        `<path class="gc-chip" style="--dx:${f((i % 2 ? 1 : -1) * (14 + i * 4))}px;--dy:${f(-30 - (i % 3) * 14)}px;--r:${f(90 + i * 50)}deg;animation-delay:${f(0.15 + i * 0.1)}s" d="M${x - 7} ${y - 5}l12 -3l3 13l-11 2z" fill="${PALE}"/>`,
    )
    .join('')

  return (
    `<path class="gc-gap" d="${across(floor, i => taper(floor.length, i, 10, 4))}" ${gapStyle}/>` +
    `<path class="gc-gapx" d="${upward(wall, i => taper(wall.length, i, 8, 1.5))}" ${gapStyle}/>` +
    `<path class="gc-gapx" style="animation-delay:.6s" d="${upward(roof, i => taper(roof.length, i, 7, 2))}" ${gapStyle}/>` +
    glow(line([...floor, ...wall.slice(1)]), 0.05, 0.85) +
    glow(line(roof), 0.35, 0.5) +
    `<path class="gc-ck" style="--d:.75s" pathLength="1" d="${branches}" fill="none" stroke="${PALE}" stroke-opacity=".8" stroke-width="2.2"/>` +
    chips
  )
}

/** Claude's alcove: the ice roof with its icicles, the rope and anchor, gear on the wall, the ledge, the done beam. */
function nook(): string {
  const roof = icicles(-36, -170, 460, -188, 16, [62, 44], 61)
  const fallers = [-6, 262, 400].map(x => {
    let best = 0

    roof.tips.forEach(([tx], i) => {
      if (Math.abs(tx - x) < Math.abs((roof.tips[best]?.[0] ?? 0) - x)) best = i
    })

    return best
  })
  const hanging = roof.d.filter((_, i) => !fallers.includes(i)).join('')
  // The icicles that drop on an error, and the shards each throws where it lands on the ledge.
  const landAt = (x: number) => 404 - (x + 100) * 0.04
  const falling = fallers
    .map((i, k) => {
      const [x, y] = roof.tips[i] ?? [0, 0]

      return `<path class="gc-icef" style="--fy:${f(landAt(x) - y)}px;animation-delay:${f(0.45 + k * 0.18)}s" d="${roof.d[i] ?? ''}" fill="${PALE}" fill-opacity=".6"/>`
    })
    .join('')
  // They fall once the roof has cracked, and shatter as they land: 80% into the .9s fall.
  const shards = fallers
    .map((i, k) => {
      const x = roof.tips[i]?.[0] ?? 0
      const y = landAt(x)

      return [-1, 1]
        .map(
          (s, j) =>
            `<path class="gc-shat" style="--dx:${s * (16 + j * 6)}px;--dy:${-22 - j * 10}px;--r:${120 + j * 70}deg;animation-delay:${f(1.17 + k * 0.18)}s" d="M${f(x - 4)} ${f(y - 3)}l8 -2l2 7l-8 2z" fill="${PALE}"/>`,
        )
        .join('')
    })
    .join('')
  const drips = roof.tips
    .filter((_, i) => i === 3 || i === 9)
    .map(([x, y], i) => `<circle class="gc-drip" style="--fy:${f(560 - y - 140)}px;animation-delay:${f(-0.8 - i * 1.4)}s" cx="${f(x)}" cy="${f(y + 2)}" r="2" fill="${PALE}"/>`)
    .join('')
  const shavings = [0, 1, 2, 3, 4]
    .map(i => `<rect class="gc-shv" style="--dx:${f(Math.cos(i * 1.3) * 30)}px;--dy:${f(Math.sin(i * 1.3) * 22 + 12)}px;animation-delay:${f(-i * 0.18)}s" x="198" y="82" width="4" height="4" fill="${PALE}"/>`)
    .join('')

  return (
    '<defs>' +
    `<radialGradient id="gc-lamp"><stop offset="0" stop-color="${PALE}" stop-opacity=".2"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="gc-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2ffff" stop-opacity=".3"/><stop offset=".45" stop-color="${ICE}" stop-opacity=".17"/><stop offset="1" stop-color="${ICE}" stop-opacity=".07"/></linearGradient>` +
    '<linearGradient id="gc-bc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".2"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
    `<radialGradient id="gc-pool"><stop offset="0" stop-color="${PALE}" stop-opacity=".42"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
    '</defs>' +
    // Everything but the beam jolts when the error cracks the alcove.
    '<g class="gc-nq">' +
    // The headlamp's spot on the wall.
    '<ellipse class="gc-spot" cx="14" cy="120" rx="64" ry="46" fill="url(#gc-lamp)"/>' +
    // The ice roof over the alcove.
    `<path d="${hanging}" fill="${PALE}" fill-opacity=".5"/>` +
    falling +
    '<path d="M-60 -236L120 -262L470 -250V-188L-36 -168Z" fill="#134754"/>' +
    `<path d="M-36 -168L470 -188" stroke="${PALE}" stroke-opacity=".35" stroke-width="2.4"/>` +
    `<path d="M-60 -236L120 -262L470 -250" fill="none" stroke="${SNOW}" stroke-opacity=".25" stroke-width="2"/>` +
    drips +
    // The fixed rope down from above to the anchor (the rig draws the anchor itself).
    `<g transform="translate(232 -720)"><g class="gc-sway"><path d="M0 0C20 220 30 470 52 714" fill="none" stroke="${ROPE}" stroke-width="3.5"/></g></g>` +
    // The ice screw Claude drives while a tool runs, and its shavings.
    '<g transform="translate(200 84)"><circle r="8" fill="#7f949c"/><g class="gc-turn"><path d="M-4 -3L22 -6Q30 0 22 6L-4 3Z" fill="#cfdbe0"/><circle cx="20" r="3" fill="#0a1a20"/></g><circle r="3.4" fill="#eef4f6"/></g>' +
    shavings +
    // The route topo, rolled on its screw until Claude reads.
    '<circle cx="56" cy="-44" r="3.4" fill="#9fb4bc"/>' +
    '<g transform="translate(0 -38)"><g class="gc-topo"><rect x="16" y="0" width="80" height="104" fill="#e6f3f4" fill-opacity=".7" stroke="#8aaab0" stroke-width="1.6"/>' +
    '<path d="M24 22Q44 14 60 24T90 20M24 46Q46 38 62 48T90 42M24 72Q42 64 60 74T90 70" fill="none" stroke="#8aaab0" stroke-width="1.4"/>' +
    `<path class="gc-route" d="M34 96L44 74L38 56L56 40L52 22L70 8" fill="none" stroke="${ROPE}" stroke-width="2.4"/><circle cx="70" cy="8" r="4.4" fill="none" stroke="#e5484d" stroke-width="2.4"/></g></g>` +
    '<rect x="20" y="-42" width="72" height="7" rx="3.5" fill="#6f8a92"/>' +
    // The radio clipped to the strap, and the calls it sends.
    '<ellipse cx="346" cy="100" rx="4" ry="7" fill="none" stroke="#cfdbe0" stroke-width="2.4"/>' +
    '<rect x="336" y="106" width="22" height="32" rx="4" fill="#1d2a31" stroke="#5f7a84" stroke-width="2"/><path d="M352 106V80" stroke="#5f7a84" stroke-width="3"/>' +
    '<rect x="340" y="112" width="14" height="8" rx="1" fill="#3a9aa4" fill-opacity=".6"/><circle class="gc-led" cx="342" cy="130" r="2.4" fill="#ffd34d"/>' +
    [0, 1, 2].map(k => `<path class="gc-sig" style="--k:${k}" d="M340 74Q352 62 364 74" fill="none" stroke="${ICE}" stroke-width="2.6" stroke-linecap="round"/>`).join('') +
    // The ledge Claude sits on, seen from a little above, its broken end over the drop.
    '<path d="M-110 448L-84 402L40 388L200 384L470 380V470H-120Z" fill="#0d2f3a"/>' +
    `<path d="M-84 402L40 388L200 384L470 380V392L200 396L40 400L-80 414Z" fill="${SNOW}" fill-opacity=".1"/>` +
    `<path d="M-84 402L40 388L200 384L470 380" fill="none" stroke="${PALE}" stroke-opacity=".3" stroke-width="2"/>` +
    '<path d="M-110 448L-84 402L-96 452L-120 470Z" fill="#061820"/>' +
    crack() +
    shards +
    '</g>' +
    // The light that pours down through the ice when the work is done.
    '<g class="gc-beam"><path d="M-40 -720L170 -720L470 470L40 470Z" fill="url(#gc-bm)"/><path d="M30 -720L100 -720L330 470L170 470Z" fill="url(#gc-bc)"/>' +
    '<ellipse cx="250" cy="430" rx="240" ry="34" fill="url(#gc-pool)"/></g>'
  )
}

/** Ice crystals glittering in the done beam, kept off Claude's face. */
function sparkles(): string {
  const next = random(88)
  const out: string[] = []

  while (out.length < 11) {
    const y = -500 + next() * 920
    const t = (y + 720) / 1190
    const x = -40 + t * 80 + next() * (210 + t * 220)

    if (x > 410) continue
    if (x > 40 && x < 250 && y > 180 && y < 380) continue
    if (x > 230 && x < 420 && y > 220 && y < 340) continue
    const s = 0.6 + next() * 0.7

    out.push(
      `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path class="gc-spk" style="animation-delay:${f(-next() * 2.2)}s" d="M0 -7L1.6 -1.6L7 0L1.6 1.6L0 7L-1.6 1.6L-7 0L-1.6 -1.6Z" fill="#f4ffff"/></g>`,
    )
  }

  return out.join('')
}
