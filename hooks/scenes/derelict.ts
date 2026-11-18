import type { Activity } from '../../types'
import { f, random } from './kit'
import { mix, type P } from './rig'
import type { World } from './world'

// Derelict: a dark corridor deep inside a drifting freighter. Ribbed bulkheads recede into the black, chains sway,
// pipes drip and the vents hiss; something nobody has seen moves in the ceiling duct and under the floor grates.
// Claude, in a bubble helmet with a shoulder lamp, watches a motion tracker. A command run makes the blips close in
// and the vents blast; an error kills the lights, the beacon throws a turning red beam and a long shadow slides along
// the wall; done seals the airlock under a green light and the corridor goes quiet.
const GREEN = '#5cff9d'
const AMBER = '#ffb347'
const RED = '#ff4436'
const STEAM = '#cdd8d4'
const HAZARD = '#d99a2b'
const METAL = '#2a3532'
const METAL_EDGE = '#41504b'

// The corridor is one-point perspective: every bulkhead is the same octagon scaled toward the vanishing point.
const VX = 800
const VY = 420
const OCT: readonly P[] = [
  [-700, -560],
  [700, -560],
  [1000, -260],
  [1000, 410],
  [790, 620],
  [-790, 620],
  [-1000, 410],
  [-1000, -260],
]
const RIBS = [0.9, 0.66, 0.49, 0.365, 0.27, 0.2, 0.15, 0.112]
// Ceiling, the chamfers, the walls and the floor, each a shade apart.
const FACE = ['#070b0c', '#090e0f', '#0b1213', '#0a1011', '#0c1415', '#0a1011', '#0b1213', '#090e0f']

const pt = (s: number, x: number, y: number): string => `${f(VX + s * x)} ${f(VY + s * y)}`
const ring = (s: number): string => `M${OCT.map(([x, y]) => pt(s, x, y)).join('L')}Z`

/** A pipe along a side wall at height `yy` (wall units), running from depth `from` to `to`, with flanges. */
function pipe(side: number, yy: number, r: number, from: number, to: number): string {
  const x = (s: number) => VX + side * 1000 * s
  const y = (s: number) => VY + yy * s
  const flanges = [0.8, 0.66, 0.55, 0.45]
    .filter(s => s < from && s > to)
    .map(s => `<rect x="${f(x(s) - 3 * s)}" y="${f(y(s) - r * s * 1.35)}" width="${f(6 * s)}" height="${f(r * s * 2.7)}"/>`)
    .join('')

  return (
    `<path d="M${f(x(from))} ${f(y(from) - r * from)}L${f(x(to))} ${f(y(to) - r * to)}V${f(y(to) + r * to)}L${f(x(from))} ${f(y(from) + r * from)}Z" fill="#151e1f"/>` +
    `<path d="M${f(x(from))} ${f(y(from) - r * from * 0.55)}L${f(x(to))} ${f(y(to) - r * to * 0.55)}" stroke="#4a645d" stroke-opacity=".5" stroke-width="1.6"/>` +
    `<g fill="#243231">${flanges}</g>`
  )
}

/** A chain hanging from the ceiling at `x`, `len` long, ending in a hook or a slung crate; it sways from its top. */
function chain(x: number, len: number, delay: number, crate: boolean): string {
  let d = ''

  for (let y = -10; y < len; y += 26) {
    d += `M${x - 4} ${y + 6}a4 6 0 1 0 8 0a4 6 0 1 0-8 0M${x} ${y + 11}v15`
  }

  const end = crate
    ? `<path d="M${x} ${len}L${x - 30} ${len + 22}M${x} ${len}L${x + 30} ${len + 22}" stroke="#2e3b39" stroke-width="2.5"/>` +
      `<rect x="${x - 36}" y="${len + 20}" width="72" height="54" rx="3" fill="#182120" stroke="#33423f" stroke-width="2"/>` +
      `<path d="M${x - 36} ${len + 32}h72M${x - 36} ${len + 62}h72M${x - 12} ${len + 20}v54M${x + 12} ${len + 20}v54" stroke="#263331" stroke-width="2"/>` +
      `<path d="M${x - 34} ${len + 47}h68" stroke="${HAZARD}" stroke-opacity=".5" stroke-width="6" stroke-dasharray="6 6"/>`
    : `<path d="M${x} ${len}v10c0 16-16 16-16 4" fill="none" stroke="#3a4846" stroke-width="4" stroke-linecap="round"/>`

  return (
    `<g class="de-sway" style="animation-delay:${delay}s"><path d="${d}" fill="none" stroke="#2e3b39" stroke-width="2.6"/>${end}</g>`
  )
}

/** Puffs of steam from (x, y), drifting by (dx, dy) and spreading. */
function steam(seed: number, x: number, y: number, dx: number, dy: number, count: number, size = 1, cls = 'de-puff', spread = 10): string {
  const next = random(seed)

  return Array.from({ length: count }, (_, i) => {
    const r = (20 + next() * 14) * size
    const style = `--dx:${f(dx * (0.8 + next() * 0.4))}px;--dy:${f(dy * (0.8 + next() * 0.4))}px;animation-delay:${f(-(i / count) * 4.2)}s`

    return `<circle class="${cls}" style="${style}" cx="${f(x + (next() - 0.5) * spread)}" cy="${f(y + (next() - 0.5) * 10)}" r="${f(r)}" fill="url(#de-stm)"/>`
  }).join('')
}

/** A caged lamp on a bulkhead: its warm pool, and a red one that takes over on an error. */
function lamp(x: number, y: number, k: number, flicker: boolean): string {
  const w = 12 * k
  const h = 17 * k

  return (
    `<g${flicker ? ' class="de-flk"' : ''}>` +
    `<circle class="de-amb" cx="${x}" cy="${y}" r="${f(140 * k)}" fill="url(#de-lamp)"/>` +
    `<circle class="de-alarm" cx="${x}" cy="${y}" r="${f(150 * k)}" fill="url(#de-lampr)"/>` +
    `<rect class="de-amb" x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(3 * k)}" fill="${AMBER}"/>` +
    `<rect class="de-alarm" x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(3 * k)}" fill="${RED}"/>` +
    `<path d="M${f(x - w / 2 - 2)} ${f(y)}h${f(w + 4)}M${f(x)} ${f(y - h / 2 - 2)}v${f(h + 4)}" stroke="#121918" stroke-width="${f(2 * k)}"/>` +
    `<rect x="${f(x - w / 2 - 3)}" y="${f(y - h / 2 - 3)}" width="${f(w + 6)}" height="${f(h + 6)}" rx="${f(4 * k)}" fill="none" stroke="#2d3a37" stroke-width="${f(2.4 * k)}"/></g>`
  )
}

/** The motion tracker: a fan screen with range rings, a pulse that runs outward and blips, on a chunky console. */
function device(light: string, activity: Activity): string {
  const R = 56
  const arc = (r: number) => `M${f(-r * 0.866)} ${f(-r * 0.5)}A${r} ${r} 0 0 1 ${f(r * 0.866)} ${f(-r * 0.5)}`
  const ray = (deg: number) => {
    const a = (deg * Math.PI) / 180

    return `M0 0L${f(R * Math.cos(a))} ${f(R * Math.sin(a))}`
  }
  const pulse = { idle: 3, thinking: 1.8, run: 0.9, error: 0.7, done: 4 }[activity as string] ?? 1.5
  const blip = (x: number, y: number, cls: string, style = '') =>
    `<circle class="${cls}" cx="${x}" cy="${y}" r="3.4" fill="${light}"${style === '' ? '' : ` style="${style}"`}/>`
  let blips = ''

  if (activity === 'run') {
    blips =
      blip(-30, -42, 'de-blip', '--dx:22px;--dy:30px') +
      blip(8, -50, 'de-blip', '--dx:-6px;--dy:36px;animation-delay:-1s') +
      blip(36, -30, 'de-blip', '--dx:-26px;--dy:20px;animation-delay:-2s')
  } else if (activity === 'error') {
    blips =
      blip(-6, -12, 'de-near') +
      blip(5, -16, 'de-near', 'animation-delay:-.25s') +
      blip(0, -24, 'de-near', 'animation-delay:-.5s') +
      blip(-14, -20, 'de-near', 'animation-delay:-.15s')
  } else if (activity !== 'done') {
    blips = blip(-26, -38, 'de-bf') + (activity === 'idle' ? '' : blip(22, -44, 'de-bf', 'animation-delay:-.7s'))
  }

  return (
    // The console wedge and its keypad.
    `<path d="M240 330L250 312H414L422 330Z" fill="#1f2826" stroke="${METAL_EDGE}" stroke-width="1.5"/>` +
    `<rect x="244" y="318" width="92" height="10" rx="2" fill="${METAL}"/>` +
    `<g fill="${light}" fill-opacity=".45">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${250 + i * 14}" y="321" width="9" height="4"/>`).join('')}</g>` +
    `<g fill="${light}">${[0, 1, 2, 3].map(i => `<rect x="${362 + i * 12}" y="319" width="7" height="4" fill-opacity="${i < 2 || activity === 'run' || activity === 'error' ? 0.9 : 0.25}"/>`).join('')}</g>` +
    // The tracker head: a carry handle, a grip, the bezel and the fan.
    `<path d="M306 230V219H398V230" fill="none" stroke="${METAL_EDGE}" stroke-width="6" stroke-linejoin="round"/>` +
    `<rect x="290" y="228" width="124" height="84" rx="10" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="2"/>` +
    `<rect x="414" y="246" width="10" height="48" rx="4" fill="#1f2826"/>` +
    `<rect x="298" y="236" width="108" height="68" rx="6" fill="#071009"/>` +
    `<g transform="translate(352 300)">` +
    `<path d="M0 0L${f(-R * 0.866)} ${f(-R * 0.5)}A${R} ${R} 0 0 1 ${f(R * 0.866)} ${f(-R * 0.5)}Z" fill="${light}" fill-opacity=".07"/>` +
    `<g fill="none" stroke="${light}" stroke-width="1.2" stroke-opacity=".35"><path d="${arc(20)}${arc(38)}${ray(-120)}${ray(-90)}${ray(-60)}"/></g>` +
    `<path d="${arc(R)}${ray(-150)}${ray(-30)}" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="2"/>` +
    `<path class="de-pulse" style="--p:${pulse}s" d="${arc(R)}" fill="none" stroke="${light}" stroke-width="3"/>` +
    (activity === 'thinking' || activity === 'run'
      ? `<g class="de-sweep"><path d="M0 0L-9 -55L9 -55Z" fill="${light}" fill-opacity=".3"/><path d="M0 0V-56" stroke="${light}" stroke-width="2"/></g>`
      : '') +
    blips +
    `<rect x="-5" y="-4" width="10" height="5" fill="${light}"/></g>` +
    `<circle cx="306" cy="244" r="2.4" fill="${activity === 'error' ? RED : AMBER}"/>`
  )
}

export function derelictWorld(): World {
  const next = random(4071)

  const faces = OCT.map((v, i) => {
    const w = OCT[(i + 1) % 8]!

    return `<path d="M${pt(1.4, v[0], v[1])}L${pt(1.4, w[0], w[1])}L${pt(0.11, w[0], w[1])}L${pt(0.11, v[0], v[1])}Z" fill="${FACE[i]}"/>`
  }).join('')
  const seams = OCT.map(([x, y]) => `M${pt(1.4, x, y)}L${pt(0.112, x, y)}`).join('')
  const ribs = RIBS.map((s, i) => {
    const tone = mix('#172123', '#06090a', i / 7)

    return (
      `<path d="${ring(s * 1.1)}${ring(s)}" fill="${tone}" fill-rule="evenodd"/>` +
      `<path d="${ring(s)}" fill="none" stroke="#45625a" stroke-opacity="${f(0.5 - i * 0.06)}" stroke-width="${f(Math.max(1, 3 * s))}"/>`
    )
  }).join('')
  const minor = [0.9, 0.66, 0.49, 0.365].map(s => `<path d="${ring(s * 0.86)}" stroke-width="${f(5 * s)}"/>`).join('')
  const bolts = [0.66, 0.49]
    .flatMap(s => [-1, 1].flatMap(side => [-180, -60, 60, 180, 300].map(y => `<circle cx="${f(VX + side * 1050 * s)}" cy="${f(VY + y * 1.05 * s)}" r="${f(5 * s)}"/>`)))
    .join('')

  // The ceiling duct along the top-left chamfer, and its lit vent slits.
  const chamfer = (s: number, u: number) => pt(s, -1000 + 300 * u, -260 - 300 * u)
  const duct = `M${chamfer(0.95, 0.25)}L${chamfer(0.95, 0.75)}L${chamfer(0.5, 0.75)}L${chamfer(0.5, 0.25)}Z`
  const bands = [0.9, 0.8, 0.7, 0.6].map(s => `M${chamfer(s, 0.25)}L${chamfer(s, 0.75)}`).join('')
  const slits = Array.from({ length: 12 }, (_, i) => {
    const s = 0.52 + i * 0.034

    return `<path class="de-slit" style="--i:${11 - i}" d="M${chamfer(s, 0.4)}L${chamfer(s, 0.6)}" stroke-width="${f(3.4 * s)}"/>`
  }).join('')

  // Grit that shakes loose from the duct's lower edge while something crawls through it.
  const dust = [0.56, 0.61, 0.66, 0.71, 0.76, 0.81, 0.86]
    .map((s, i) => {
      const [x, y] = chamfer(s, 0.27).split(' ')

      return `<rect class="de-dust" style="animation-delay:${f(-i * 0.37)}s" x="${x}" y="${y}" width="3" height="3"/>`
    })
    .join('')

  // The lit floor grate on the left, its bars, and what passes under it.
  const floorAt = (s: number, x: number) => pt(s, x, 620)
  const grate = `M${floorAt(0.9, -790)}L${floorAt(0.9, -560)}L${floorAt(0.73, -560)}L${floorAt(0.73, -790)}Z`
  const bars =
    [0.76, 0.79, 0.82, 0.85, 0.88].map(s => `M${floorAt(s, -790)}L${floorAt(s, -560)}`).join('') +
    [-790, -732.5, -675, -617.5, -560].map(x => `M${floorAt(0.73, x)}L${floorAt(0.9, x)}`).join('')

  // The airlock in the left wall, between two bulkheads: its frame, the dark inside, the two leaves, the beacon.
  const leafTop = 'M170 287.7L280 310.8V440.8L170 445.2Z'
  const leafBottom = 'M170 445.2L280 440.8V570.8L170 602.7Z'
  const leafLines = (top: boolean) =>
    top
      ? '<path d="M200 294V444M250 304.5V442M170 366L280 375" stroke="#2a3735" stroke-width="2"/><path d="M170 437L280 433" stroke="#0b1010" stroke-width="12"/><path d="M170 437L280 433" stroke="' +
        HAZARD +
        '" stroke-width="9" stroke-dasharray="8 7" stroke-opacity=".8"/>'
      : '<path d="M200 446V593M250 442V579M170 524L280 506" stroke="#2a3735" stroke-width="2"/><path d="M170 453L280 448.5" stroke="#0b1010" stroke-width="12"/><path d="M170 453L280 448.5" stroke="' +
        HAZARD +
        '" stroke-width="9" stroke-dasharray="8 7" stroke-opacity=".8"/>'

  // The wall terminal on the right: the ship's log scrolls on it while Claude reads, a signal while it searches.
  const term = (s: number, y: number) => pt(s, 1000, y)
  const logLines = [-140, -115, -90, -65]
    .map((y, i) => `<path class="de-ln" style="--i:${i}" d="M${term(0.418, y)}L${term(0.472, y + (i % 2) * 10)}"/>`)
    .join('')
  const wave = Array.from({ length: 9 }, (_, i) => term(0.418 + i * 0.00675, -95 + (i % 2 ? -32 : 32))).join('L')

  const motes = Array.from({ length: 10 }, (_, i) => {
    const x = next() < 0.5 ? 40 + next() * 340 : 1240 + next() * 300

    return `<circle class="de-mote" style="animation-delay:${f(-i * 1.7)}s" cx="${f(x)}" cy="${f(160 + next() * 520)}" r="${f(1 + next() * 1.4)}"/>`
  }).join('')
  const drips = [
    [100, 682, 0],
    [280, 616, -1.1],
    [1190, 616, -0.5],
  ]
    .map(([x, y, d]) => `<rect class="de-drip" style="animation-delay:${d}s" x="${x! - 1.5}" y="${y}" width="3" height="7" rx="1.5"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'bits',
      ink: '#020405',
      furniture: '#141c1d',
      metal: METAL,
      paper: '#c9d6cf',
      light: { idle: '#33a56c', work: GREEN, bright: '#c2ffdc' },
      headTop: 196,
      glowAt: [352, 272],
      device,
      wear: {
        front:
          '<g shape-rendering="geometricPrecision">' +
          // The bubble helmet: clear, so the eyes show through, with two glints on the glass.
          '<path d="M60 324V266C60 206 104 184 150 184C196 184 240 206 240 266V324Z" fill="#a8f0cc" fill-opacity=".08" stroke="#a9cfc0" stroke-opacity=".6" stroke-width="3"/>' +
          '<path d="M80 252C82 224 102 204 128 197" fill="none" stroke="#ffffff" stroke-opacity=".34" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M216 214C225 223 231 235 233 248" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="3" stroke-linecap="round"/>' +
          // The neck ring and its studs.
          `<rect x="52" y="318" width="196" height="14" rx="5" fill="#33403d" stroke="${METAL_EDGE}" stroke-width="1.5"/>` +
          `<g fill="#8a9e97">${[72, 111, 150, 189, 228].map(x => `<circle cx="${x}" cy="325" r="2"/>`).join('')}</g>` +
          // The shoulder lamp on its bracket, lit.
          `<path d="M62 320L54 300" stroke="#33403d" stroke-width="4"/>` +
          `<rect x="32" y="284" width="30" height="16" rx="3" fill="${METAL}" stroke="${METAL_EDGE}" stroke-width="1.5"/>` +
          '<rect x="30" y="285" width="6" height="14" rx="2" fill="#fff1c8"/><circle cx="36" cy="292" r="8" fill="#ffe7a8" fill-opacity=".2"/>' +
          // A crew patch: the coral starburst.
          '<path d="M96 334L98 339L103 340L98 341L96 346L94 341L89 340L94 339Z" fill="#f0c9b8" fill-opacity=".8"/></g>',
      },
      seatArt:
        // A bolted jump seat with a loose harness strap.
        '<rect x="104" y="348" width="96" height="13" rx="5" fill="#1e2a2a" stroke="#34433f" stroke-width="1.5"/>' +
        '<path d="M118 361L128 372H174L184 361Z" fill="#141c1d"/><rect x="145" y="372" width="12" height="70" fill="#1a2324"/>' +
        `<path d="M151 380V436" stroke="${HAZARD}" stroke-opacity=".55" stroke-width="10" stroke-dasharray="5 6"/>` +
        '<rect x="116" y="440" width="70" height="10" rx="3" fill="#1a2324" stroke="#2c3a38"/>' +
        '<path d="M112 360C102 384 106 404 118 420" fill="none" stroke="#3b4a46" stroke-width="5" stroke-linecap="round"/>' +
        '<rect x="112" y="416" width="12" height="8" rx="2" fill="#7f948e"/>',
      tableArt:
        // A steel console desk with a hazard band, and the ship's cat in its carrier underneath.
        '<rect x="166" y="330" width="304" height="14" rx="2" fill="#172122" stroke="#2c3a39" stroke-width="1.5"/>' +
        '<rect x="168" y="344" width="300" height="8" fill="#0c1213"/>' +
        `<path d="M172 348H464" stroke="${HAZARD}" stroke-width="6" stroke-dasharray="9 9" stroke-opacity=".6"/>` +
        '<g fill="#141c1d" stroke="#2c3a39" stroke-width="1.5"><rect x="180" y="352" width="16" height="104"/><rect x="440" y="352" width="16" height="104"/></g>' +
        '<g class="de-carrier"><rect x="318" y="404" width="112" height="52" rx="10" fill="#26302d" stroke="#3a4642" stroke-width="2"/>' +
        '<path d="M354 404V396H394V404" fill="none" stroke="#3a4642" stroke-width="5"/>' +
        '<path d="M398 418H420M398 428H420M398 438H420" stroke="#141a19" stroke-width="3"/>' +
        '<rect x="324" y="410" width="56" height="40" rx="4" fill="#040606"/>' +
        '<g class="de-cat"><ellipse cx="345" cy="429" rx="3.8" ry="3" fill="#d6f56a"/><ellipse cx="358" cy="429" rx="3.8" ry="3" fill="#d6f56a"/>' +
        '<path d="M345 426.5V431.5M358 426.5V431.5" stroke="#1a2010" stroke-width="1.4"/></g>' +
        '<path d="M333 411V449M341 411V449M352 411V449M362 411V449M371 411V449" stroke="#56645f" stroke-width="2"/></g>',
    },
    style:
      // Ambient: chains sway, drips fall, vents breathe, a strip light stutters now and then, dust hangs in the light.
      '.de-sway{transform-box:fill-box;transform-origin:50% 0;animation:de-sway 5.5s ease-in-out infinite alternate}' +
      '@keyframes de-sway{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}' +
      '@keyframes de-swing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      '.de-drip{fill:#7fa79a;opacity:0;animation:de-drip 2.6s ease-in infinite}' +
      '@keyframes de-drip{0%{opacity:0;transform:translateY(0)}12%{opacity:.8}85%{opacity:.6}100%{opacity:0;transform:translateY(64px)}}' +
      '.de-puff{transform-box:fill-box;transform-origin:center;opacity:0;animation:de-puff 4.2s ease-out infinite}' +
      '@keyframes de-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.22}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.4)}}' +
      '@keyframes de-blast{0%{opacity:0;transform:translate(0,0) scale(.5)}12%{opacity:.62}100%{opacity:0;transform:translate(calc(var(--dx) * 1.7),calc(var(--dy) * 1.7)) scale(4)}}' +
      '.de-mote{fill:#d8e6df;opacity:.2;animation:de-mote 14s ease-in-out infinite alternate}@keyframes de-mote{to{transform:translate(18px,-46px)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: two soft dips in half a second, once every 7 s; under 3 a second.
      '.de-flk{animation:de-flk 7s linear infinite}@keyframes de-flk{0%,86%,90%,93%,100%{opacity:1}88%{opacity:.3}91.5%{opacity:.4}}' +
      '.de-strip{transition:none}' +
      '@keyframes de-in{to{opacity:1}}@keyframes de-out{to{opacity:0}}@keyframes de-dim{to{opacity:.06}}@keyframes de-bright{to{opacity:.62}}' +
      '@keyframes de-breathe{from{opacity:.5}to{opacity:.95}}' +
      '.de-glow{animation:de-breathe 4s ease-in-out infinite alternate}' +
      '.de-guide{stroke-dasharray:5 21;animation:de-chase 2.6s linear infinite}@keyframes de-chase{to{stroke-dashoffset:-26}}' +
      // The duct: a dark spot runs along the slits now and then, often while a tool works, fast on a run.
      '.de-slit{animation:de-pass 12s linear infinite;animation-delay:calc(var(--i) * .14s + 2s)}' +
      '@keyframes de-pass{0%,7%,100%{opacity:1}2.5%{opacity:.06}}' +
      '@keyframes de-pass2{0%,34%,100%{opacity:1}14%{opacity:.06}}' +
      '.st-tool .de-slits,.st-run .de-slits{stroke-opacity:1}' +
      '.de-dglow,.de-dust{opacity:0}.st-tool .de-dglow,.st-run .de-dglow{animation:de-in .4s ease-out both}' +
      '.st-tool .de-dust,.st-run .de-dust{animation:de-dust 1.3s ease-in infinite}' +
      '@keyframes de-dust{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(120px)}}' +
      '.st-tool .de-slit{animation:de-pass2 1.9s linear infinite;animation-delay:calc(var(--i) * .11s)}' +
      '.st-tool .de-sway{animation-duration:2.6s}' +
      // The tracker on the desk.
      '.de-pulse{animation:de-pulse var(--p,2s) ease-out infinite}@keyframes de-pulse{0%{opacity:0;transform:scale(.08)}15%{opacity:1}100%{opacity:0;transform:scale(1)}}' +
      '.de-sweep{animation:de-scan 1.5s ease-in-out infinite alternate}@keyframes de-scan{from{transform:rotate(-56deg)}to{transform:rotate(56deg)}}' +
      '.de-bf{animation:de-breathe 1.4s ease-in-out infinite alternate}' +
      '.de-blip{animation:de-close 3s cubic-bezier(.5,0,.8,.6) infinite}' +
      '@keyframes de-close{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}90%{opacity:1;transform:translate(var(--dx),var(--dy))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.de-near{animation:de-throb .5s ease-in-out infinite alternate}@keyframes de-throb{from{opacity:.35}to{opacity:1}}' +
      // The cat: it blinks, stares on an error, dozes when it is over.
      '.de-cat{transform-box:fill-box;transform-origin:center;animation:de-blink 5.5s steps(1) infinite}@keyframes de-blink{0%,93%{transform:scaleY(1)}94%,98%{transform:scaleY(.1)}}' +
      '@keyframes de-wide{to{transform:scale(1.35)}}@keyframes de-squint{to{transform:scaleY(.3)}}' +
      '@keyframes de-rattle{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}' +
      // Thinking: the tracker pings sweep out across the floor from the desk.
      '.de-ping{opacity:0}.st-thinking .de-ping{animation:de-ping 2.6s ease-out infinite}' +
      '@keyframes de-ping{0%{opacity:0;transform:scale(.08)}10%{opacity:.5}100%{opacity:0;transform:scale(1)}}' +
      // Responding: the floor guide lights run quicker toward the dark.
      '.st-responding .de-guide{animation-duration:.8s}.st-responding .de-guides{opacity:.95}' +
      '.de-gglow{opacity:0}.st-responding .de-gglow{animation:de-in .5s ease-out both}.st-responding .de-glow{animation:none;opacity:1}' +
      // Read and web: the wall terminal wakes, the log types out, or a signal crawls across it.
      '.de-ln{opacity:.16;stroke-dasharray:90}.de-wv{opacity:0}.de-scr{opacity:.25}' +
      '.st-read .de-scr,.st-web .de-scr{opacity:1}' +
      '.st-read .de-ln{opacity:.9;animation:de-type 1.6s steps(8) infinite;animation-delay:calc(var(--i) * -.4s)}@keyframes de-type{from{stroke-dashoffset:90}to{stroke-dashoffset:0}}' +
      '.st-web .de-wv{opacity:.9;stroke-dasharray:8 5;animation:de-chase .7s linear infinite}' +
      // Run: the blips close in, every vent blasts, the chains swing, the strips stutter, something races under the grate.
      '.st-run .de-puff{animation:de-blast 1.5s ease-out infinite}' +
      '.de-gush{transform-box:fill-box;transform-origin:center;opacity:0}.st-run .de-gush{animation:de-gush 1.7s ease-out infinite}' +
      '@keyframes de-gush{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(3.4)}}' +
      '.st-run .de-sway{animation:de-swing 1.3s ease-in-out infinite alternate}' +
      '.st-run .de-slit{animation:de-pass2 1.3s linear infinite;animation-delay:calc(var(--i) * .08s)}' +
      '.st-run .de-strip{animation:de-stutter 1.3s linear infinite}@keyframes de-stutter{0%,40%,60%,100%{opacity:.36}50%{opacity:.08}}' +
      '.st-run .de-glow{animation-duration:.8s}' +
      '.de-under{opacity:0}.st-run .de-under{animation:de-under 2.4s cubic-bezier(.45,0,.55,1) .1s infinite}' +
      '@keyframes de-under{0%{opacity:0;transform:translateX(-220px)}15%,80%{opacity:.95}100%{opacity:0;transform:translateX(300px)}}' +
      // Error: the lights die, the beacon turns a red beam, a long shadow slides along the wall, the cat stares.
      '.de-alarm,.de-wash,.de-beam,.de-ghost,.de-bk-r,.de-bk-g,.de-ok,.de-seal{opacity:0}' +
      '.st-error .de-alarm{animation:de-in .5s ease-out both}.st-error .de-amb{animation:de-out .4s ease-out both}' +
      '.st-error .de-strip,.st-error .de-glow{animation:de-dim .5s ease-out both}' +
      '.st-error .de-guides{animation:de-dim .5s ease-out both}' +
      '.st-error .de-wash{animation:de-in .6s ease-out .1s both}' +
      '.st-error .de-beam{animation:de-in .4s ease-out both}.st-error .de-rot{animation:de-spin 2.8s linear infinite}@keyframes de-spin{to{transform:rotate(360deg)}}' +
      '.st-error .de-ghost{animation:de-ghost 2.8s cubic-bezier(.4,0,.6,1) .2s both}' +
      '@keyframes de-ghost{0%{opacity:0;transform:translateX(420px)}14%,82%{opacity:.95}100%{opacity:0;transform:translateX(-640px)}}' +
      '.st-error .de-lash{transform-box:fill-box;transform-origin:0 50%;animation:de-lash .8s ease-in-out infinite alternate}@keyframes de-lash{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      '.st-error .de-sway{animation:de-swing 2.2s ease-in-out infinite alternate}' +
      '.de-bk-a{animation:de-breathe 2.6s ease-in-out infinite alternate}' +
      '.st-error .de-bk-a{animation:none;opacity:0}.st-error .de-bk-r{animation:de-in .3s ease-out both}' +
      '.st-error .de-cat{animation:de-wide .3s ease-out both}.st-error .de-carrier{animation:de-rattle .18s linear 8}' +
      // Done: the airlock leaves slide shut, steam hisses at the seam, the beacon turns green, the lights come back.
      '.de-lt{transform:translateY(-104px)}.de-lb{transform:translateY(104px)}' +
      '.st-done .de-lt{animation:de-shut-t .8s cubic-bezier(.6,0,.3,1) .05s both}@keyframes de-shut-t{from{transform:translateY(-104px)}to{transform:translateY(0)}}' +
      '.st-done .de-lb{animation:de-shut-b .8s cubic-bezier(.6,0,.3,1) .05s both}@keyframes de-shut-b{from{transform:translateY(104px)}to{transform:translateY(0)}}' +
      '.st-done .de-ok,.st-done .de-bk-g{animation:de-in .6s ease-out .8s both}.st-done .de-bk-a{animation:de-out .3s ease-out .75s both}' +
      '.st-done .de-guides{animation:de-full 1s ease-out .9s both}@keyframes de-full{to{opacity:.95}}.st-done .de-guide{animation:none}' +
      '.de-seal{transform-box:fill-box;transform-origin:center}.st-done .de-seal{animation:de-hiss 1.6s ease-out .8s both}' +
      '@keyframes de-hiss{0%{opacity:0;transform:translate(0,0) scale(.3)}25%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.4)}}' +
      '.st-done .de-strip{animation:de-bright 1.2s ease-out .8s both}.st-done .de-flk{animation:none}' +
      '.st-done .de-puff{animation:none}.st-done .de-sway{animation-duration:10s}.st-done .de-cat{animation:de-squint .5s ease-out 1.4s both}' +
      // The rig's finer moments.
      '.st-sleeping .de-strip{opacity:.14}.st-sleeping .de-cat{animation:de-squint .6s ease-out both}' +
      '.st-startled .de-cat{animation:de-wide .3s ease-out both}',
    scenery:
      '<defs>' +
      '<radialGradient id="de-fog" cx="800" cy="420" r="660" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity=".97"/><stop offset=".22" stop-color="#000" stop-opacity=".85"/><stop offset=".6" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="de-lamp"><stop offset="0" stop-color="${AMBER}" stop-opacity=".42"/><stop offset=".35" stop-color="${AMBER}" stop-opacity=".13"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="de-lampr"><stop offset="0" stop-color="${RED}" stop-opacity=".45"/><stop offset=".35" stop-color="${RED}" stop-opacity=".14"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="de-wash"><stop offset="0" stop-color="${RED}" stop-opacity=".26"/><stop offset=".55" stop-color="${RED}" stop-opacity=".1"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="de-beamg" cx="0" cy="0" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${RED}" stop-opacity=".34"/><stop offset=".5" stop-color="${RED}" stop-opacity=".12"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="de-okg"><stop offset="0" stop-color="${GREEN}" stop-opacity=".38"/><stop offset=".4" stop-color="${GREEN}" stop-opacity=".12"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="de-stm"><stop offset="0" stop-color="${STEAM}"/><stop offset=".45" stop-color="${STEAM}" stop-opacity=".55"/><stop offset="1" stop-color="${STEAM}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="de-dark"><stop offset="0" stop-color="#000" stop-opacity=".95"/><stop offset=".6" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="de-grg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GREEN}" stop-opacity=".1"/><stop offset="1" stop-color="${GREEN}" stop-opacity=".34"/></linearGradient>` +
      '<clipPath id="de-door"><path d="M170 287.7L280 310.8V570.8L170 602.7Z"/></clipPath>' +
      `<clipPath id="de-grc"><path d="${grate}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="#05080a"/>' +
      faces +
      `<path d="${seams}" stroke="#1e2c2c" stroke-width="2" stroke-opacity=".7"/>` +
      // The duct and its slits, behind the ribs.
      `<path d="${duct}" fill="#162122" stroke="#2c3b38" stroke-width="2"/>` +
      `<path d="M${chamfer(0.95, 0.25)}L${chamfer(0.5, 0.25)}" stroke="#3d544e" stroke-width="2"/>` +
      `<path d="${bands}" stroke="#0a1010" stroke-width="5"/>` +
      `<path class="de-dglow" d="${duct}" fill="${AMBER}" fill-opacity=".16"/>` +
      `<g class="de-slits" stroke="${AMBER}" stroke-opacity=".5" stroke-linecap="round">${slits}</g>` +
      `<g fill="#cdb98e">${dust}</g>` +
      ribs +
      `<g fill="none" stroke="#1b2729">${minor}</g>` +
      `<g fill="#26332f">${bolts}</g>` +
      '<rect width="1600" height="1000" fill="url(#de-fog)"/>' +
      // The far end: a shut bulkhead with one tiny light.
      `<path d="${ring(0.112)}" fill="#020304"/><circle cx="800" cy="402" r="14" fill="${AMBER}" fill-opacity=".07"/><circle cx="800" cy="402" r="2.2" fill="${AMBER}" fill-opacity=".6"/>` +
      // Pipes low on both walls and one high on the left, dripping.
      pipe(-1, 345, 16, 0.95, 0.4) +
      pipe(-1, 388, 11, 0.95, 0.4) +
      pipe(-1, -250, 12, 0.95, 0.42) +
      pipe(1, 345, 16, 0.95, 0.4) +
      pipe(1, -250, 12, 0.95, 0.42) +
      drips +
      // The left steam vent and the right ceiling vent.
      '<path d="M18 652L60 642V688L18 702Z" fill="#0d1414" stroke="#33423f" stroke-width="2"/><path d="M18 666L60 657M18 680L60 671M18 693L60 683" stroke="#26332f" stroke-width="2.4"/>' +
      `<path d="M${pt(0.6, 820, -425)}L${pt(0.6, 880, -385)}L${pt(0.54, 880, -385)}L${pt(0.54, 820, -425)}Z" fill="#0d1414" stroke="#33423f" stroke-width="2"/>` +
      // The airlock: frame, the dark inside, two leaves that open and shut, a hazard seam, the beacon over it.
      '<path d="M154 272.7L292 304.2V576.5L154 619Z" fill="#131c1c" stroke="#2e3d3a" stroke-width="2"/>' +
      '<path d="M170 287.7L280 310.8V570.8L170 602.7Z" fill="#010202"/>' +
      '<path d="M186 330L266 345V530L186 556Z" fill="none" stroke="#16211f" stroke-width="2"/>' +
      `<g clip-path="url(#de-door)"><g class="de-lt"><path d="${leafTop}" fill="#23302e"/>${leafLines(true)}</g>` +
      `<g class="de-lb"><path d="${leafBottom}" fill="#23302e"/>${leafLines(false)}</g></g>` +
      `<g class="de-ok"><circle cx="225" cy="443" r="250" fill="url(#de-okg)"/><path d="M154 272.7L292 304.2V576.5L154 619Z" fill="none" stroke="${GREEN}" stroke-opacity=".7" stroke-width="3"/>` +
      `<path d="M170 445.2L280 440.8" stroke="${GREEN}" stroke-width="4"/></g>` +
      '<rect x="211" y="282" width="28" height="7" rx="2" fill="#1c2625" stroke="#33423f"/>' +
      `<g class="de-bk-a"><circle cx="225" cy="276" r="40" fill="url(#de-lamp)"/><path d="M215 282A10 10 0 0 1 235 282Z" fill="${AMBER}"/></g>` +
      `<g class="de-bk-r"><circle cx="225" cy="276" r="46" fill="url(#de-lampr)"/><path d="M215 282A10 10 0 0 1 235 282Z" fill="${RED}"/></g>` +
      `<g class="de-bk-g"><circle cx="225" cy="276" r="90" fill="url(#de-okg)"/><path d="M215 282A10 10 0 0 1 235 282Z" fill="${GREEN}"/></g>` +
      // The wall terminal on the right wall.
      `<path d="M${term(0.485, -175)}L${term(0.405, -175)}L${term(0.405, -10)}L${term(0.485, -10)}Z" fill="#111918" stroke="#33423f" stroke-width="2"/>` +
      `<path class="de-scr" d="M${term(0.478, -164)}L${term(0.412, -164)}L${term(0.412, -21)}L${term(0.478, -21)}Z" fill="${GREEN}" fill-opacity=".1"/>` +
      `<g fill="none" stroke="${GREEN}" stroke-width="2.4">${logLines}<path class="de-wv" d="M${wave}"/></g>` +
      // Strip lights on the near bulkheads' inner faces, and the caged lamps.
      `<g stroke="#c2f4dc" stroke-linecap="round">` +
      '<path class="de-strip" d="M145 280V662" stroke-width="3" opacity=".34"/><path class="de-strip" d="M145 280V662" stroke-width="12" opacity=".06"/>' +
      '<path class="de-strip de-flk" d="M313 306V606" stroke-width="2.4" opacity=".22"/>' +
      '<path class="de-strip" d="M1455 280V662" stroke-width="3" opacity=".34"/><path class="de-strip" d="M1455 280V662" stroke-width="12" opacity=".06"/>' +
      '<path class="de-strip" d="M1287 306V606" stroke-width="2.4" opacity=".22" style="animation-delay:-.6s"/></g>' +
      lamp(152, 262, 1, false) +
      lamp(320, 302, 0.74, true) +
      lamp(1448, 262, 1, false) +
      lamp(1280, 302, 0.74, false) +
      // Floor guide lights along both foot seams.
      `<g class="de-gglow" stroke="${GREEN}" stroke-width="16" stroke-opacity=".14" stroke-linecap="round"><path d="M${pt(0.95, -790, 620)}L${pt(0.5, -790, 620)}M${pt(0.95, 790, 620)}L${pt(0.5, 790, 620)}"/></g>` +
      `<g class="de-guides" stroke="${GREEN}" stroke-width="4" opacity=".5"><path class="de-guide" d="M${pt(0.95, -790, 620)}L${pt(0.5, -790, 620)}"/><path class="de-guide" d="M${pt(0.95, 790, 620)}L${pt(0.5, 790, 620)}"/></g>` +
      `<g fill="#d8e6df">${motes}</g>` +
      // The error: a red wash on the left wall, the long shadow passing over it, the beacon's turning beam.
      '<circle class="de-wash" cx="230" cy="340" r="500" fill="url(#de-wash)"/>' +
      '<g class="de-ghost"><ellipse cx="190" cy="440" rx="210" ry="140" fill="url(#de-dark)"/>' +
      '<g class="de-lash"><path d="M286 394C392 350 452 470 556 446C640 424 700 372 806 392C716 402 650 462 560 490C450 520 384 452 290 492Z" fill="#000" fill-opacity=".9"/></g></g>' +
      '<g class="de-beam"><g transform="translate(225 276)"><g class="de-rot"><path d="M0 0L560 -88L560 88Z" fill="url(#de-beamg)"/><path d="M0 0L560 -34L560 34Z" fill="url(#de-beamg)"/></g></g></g>' +
      // Chains from the ceiling: two on the left (one with a slung crate), two on the right.
      chain(92, 520, 0, false) +
      chain(340, 300, -1.8, true) +
      chain(1352, 280, -3.1, false) +
      chain(1432, 210, -0.9, false) +
      // The lit floor grate and what passes beneath it, pinned to the foot of the window.
      '<g class="mv-b">' +
      `<path d="${grate}" fill="#04100a"/>` +
      `<path class="de-glow" d="${grate}" fill="url(#de-grg)"/>` +
      `<g clip-path="url(#de-grc)"><g class="de-under"><ellipse cx="230" cy="925" rx="90" ry="34" fill="url(#de-dark)"/>` +
      '<path d="M160 917C120 907 90 937 40 927C80 923 110 945 160 935Z" fill="#000" fill-opacity=".85"/></g></g>' +
      `<path d="${bars}" stroke="#030605" stroke-width="5"/>` +
      `<path d="${grate}" fill="none" stroke="#2a3a36" stroke-width="2"/>` +
      steam(14, 225, 930, 40, -300, 6, 1, 'de-gush', 150) +
      '</g>' +
      // Steam: from the left wall vent, down from the right ceiling vent, and the hiss at the airlock seam on done.
      steam(11, 62, 668, 190, -90, 7) +
      steam(12, 1318, 196, -16, 150, 6) +
      `<circle class="de-seal" style="--dx:-60px;--dy:-10px" cx="200" cy="444" r="26" fill="url(#de-stm)"/>` +
      `<circle class="de-seal" style="--dx:80px;--dy:-30px" cx="258" cy="441" r="22" fill="url(#de-stm)"/>`,
    nook:
      // A floor vent left of the desk, steaming, and the tracker's pings that sweep out across the floor.
      '<path d="M10 446H84L80 456H14Z" fill="#0d1414" stroke="#33423f" stroke-width="2"/><path d="M24 448V455M38 448V455M52 448V455M66 448V455" stroke="#26332f" stroke-width="3"/>' +
      steam(13, 46, 440, 10, -190, 5, 0.7) +
      `<g transform="translate(352 272)" fill="none" stroke="${GREEN}" stroke-width="3">` +
      [0, 0.85, 1.7].map(d => `<path class="de-ping" vector-effect="non-scaling-stroke" style="animation-delay:${d}s" d="M-426 298A520 520 0 0 1 -398 -334"/>`).join('') +
      '</g>',
  }
}
