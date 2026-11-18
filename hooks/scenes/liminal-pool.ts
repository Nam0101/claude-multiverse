import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Liminal Pool: an endless indoor pool hall at night, nobody there. White tiles gone grey in the dark, a barrel
// vault of arches repeating into black, still turquoise water lit from below, caustics crawling over the ceiling.
// Claude is the lifeguard in a swim cap at a tiled desk beside its stand. A command sends one slow wave rolling
// down the endless pool with a band of light on the vault; an error shuts the lights off hall by hall into the
// distance; done brings the underwater lights back as a wave of turquoise from the far end.
//
// Everything in the hall comes from one projection: a point (x, y) at depth d lands at (800 + x/d, 430 + y/d).
// The hall is 2000 wide, its walls rise from the floor (y 570) to the vault's springing (y -150), the vault is a
// half circle over them; bays are 0.75 deep, so a shape drawn near and scaled about the vanishing point is the
// same shape farther down the hall.
const VX = 800
const VY = 430
const HALL = 1000
const FLOOR = 570
const SPRING = -150
const WATER = 600
const POOL_L = -620
const POOL_R = 380
const DEPTH = 900
/** The near edge, then each arch down the hall. */
const RIBS = [0.8, ...Array.from({ length: 13 }, (_, j) => 1.3 + 0.75 * j)]
const CAP = '#1f8f9c'
const PALE = '#cfe3e1'

type Pt = readonly [number, number]

const sx = (x: number, d: number) => VX + x / d
const sy = (y: number, d: number) => VY + y / d
const at = (x: number, y: number, d: number) => `${f(sx(x, d))} ${f(sy(y, d))}`
/** Distance fades the hall toward the black at its end. */
const fog = (d: number) => Math.min(1, Math.exp(-(d - 1.1) / 4.2))
const depthAt = (i: number) => RIBS[Math.min(i, RIBS.length - 1)] ?? 1

/** The hall's cross-section at one depth, closed: floor, walls, vault. */
function section(d: number): string {
  const r = f(HALL / d)

  return `M${at(-HALL, FLOOR, d)}H${f(sx(HALL, d))}V${f(sy(SPRING, d))}A${r} ${r} 0 0 0 ${at(-HALL, SPRING, d)}Z`
}

/** An arch at one depth, open at the floor: up the left wall, over the vault, down the right. */
function arch(d: number, inset: number): string {
  const h = HALL - inset
  const r = f(h / d)

  return `M${at(-h, FLOOR, d)}V${f(sy(SPRING, d))}A${r} ${r} 0 0 1 ${at(h, SPRING, d)}V${f(sy(FLOOR, d))}`
}

/** An arched doorway in a side wall between two depths, opening onto another lit pool room. */
function doorway(side: number, d0: number, d1: number): string {
  const za = (d0 + 0.15) * DEPTH
  const zb = (d1 - 0.15) * DEPTH
  const radius = (zb - za) / 2
  const top = 170
  const x = side * HALL
  const wall: Pt[] = [
    [za, FLOOR],
    [za, top],
    ...Array.from({ length: 5 }, (_, k): Pt => {
      const a = Math.PI - (k + 1) * (Math.PI / 6)

      return [za + radius + radius * Math.cos(a), top - radius * Math.sin(a)]
    }),
    [zb, top],
    [zb, FLOOR],
  ]

  return `M${wall.map(([z, y]) => at(x, y, z / DEPTH)).join('L')}Z`
}

/** A point on the hall's inner surface for the caustics: up the right wall, over the vault, down the left. */
const RISE = 450
const ARC = Math.PI * HALL
const SPAN = RISE * 2 + ARC

function surface(s: number): Pt {
  if (s < RISE) {
    return [HALL, SPRING + RISE - s]
  }

  if (s < RISE + ARC) {
    const t = (s - RISE) / HALL

    return [HALL * Math.cos(t), SPRING - HALL * Math.sin(t)]
  }

  return [-HALL, SPRING + (s - RISE - ARC)]
}

/** Smooth lines through the midpoints of each run of on-screen points: one Q, then T carries it on exactly. */
function smooth(points: readonly Pt[]): string {
  let out = ''
  let run: Pt[] = []
  const n = (v: number) => String(Math.round(v))
  const mid = (a: Pt, b: Pt) => `${n((a[0] + b[0]) / 2)} ${n((a[1] + b[1]) / 2)}`
  const flush = () => {
    const [p0, p1, p2] = run

    if (p0 !== undefined && p1 !== undefined && p2 !== undefined) {
      out += `M${mid(p0, p1)}Q${n(p1[0])} ${n(p1[1])} ${mid(p1, p2)}`

      for (let i = 2; i + 1 < run.length; i += 1) {
        out += `T${mid(run[i] ?? p2, run[i + 1] ?? p2)}`
      }
    }

    run = []
  }

  for (const p of points) {
    if (p[0] > -60 && p[0] < 1660 && p[1] > -60 && p[1] < 1000) {
      run.push(p)
    } else {
      flush()
    }
  }

  flush()

  return out
}

/**
 * One caustic net on the vault, as near, middle and far lines. Rows run across the vault a tenth deeper each, on
 * one shared grid; each row waves in antiphase with the last, so neighbours pinch together and leave the lens
 * cells a rippled pool throws on its ceiling. Spacing in the hall grows with depth, so the cells stay round.
 */
function caustics(seed: number, flip: number): [string, string, string] {
  const next = random(seed)
  const out: [string, string, string] = ['', '', '']
  const start = 120 + next() * 60

  for (let r = 0; r < 16; r += 1) {
    const d0 = 1.22 * 1.1 ** r
    const points: Pt[] = []

    for (let k = 0; start + k * 105 < SPAN - 120; k += 1) {
      const lift = ((k + r + flip) % 2 === 0 ? 1 : -1) * 0.08 * (0.7 + next() * 0.6)
      const [x, y] = surface(start + k * 105 + (next() - 0.5) * 40)
      const d = d0 * Math.exp(lift)

      points.push([sx(x, d), sy(y, d)])
    }

    out[r < 6 ? 0 : r < 11 ? 1 : 2] += smooth(points)
  }

  return out
}

/** The hall's tile grout: lines down the hall on the walls, vault and deck, and rings across it. */
function tiles(): { hall: string; deck: string } {
  const rays: string[] = []
  const ray = (x: number, y: number, near: number) => rays.push(`M${at(x, y, near)}L${at(x, y, 8)}`)

  for (const y of [450, 330, 210, 90, -30]) {
    ray(-HALL, y, 1.2)
    ray(HALL, y, 1.2)
  }

  for (let k = 1; k < 26; k += 1) {
    const t = k * 0.12

    ray(HALL * Math.cos(t), SPRING - HALL * Math.sin(t), 1.2)
  }

  const depths: number[] = []

  for (let d = 1.24; d < 2.6; d += 0.135) depths.push(d)
  for (let d = 2.72; d < 4.8; d += 0.27) depths.push(d)

  const rings = depths.map(d => arch(d, 0)).join('')
  const deckRays = [-880, -760, 560, 680, 800, 920].map(x => `M${at(x, FLOOR, 0.9)}L${at(x, FLOOR, 8)}`).join('')
  const deckRings = depths
    .map(d => `M${at(-HALL, FLOOR, d)}H${f(sx(POOL_L - 60, d))}M${f(sx(POOL_R + 60, d))} ${f(sy(FLOOR, d))}H${f(sx(HALL, d))}`)
    .join('')

  return { hall: rays.join('') + rings, deck: deckRays + deckRings }
}

/** The lane rope's floats: little beads down the water, two colours in runs of three. */
function rope(x: number): [string, string] {
  const out: [string, string] = ['', '']

  for (let i = 0, d = 1.02; d < 5.2; i += 1, d += 0.1) {
    const w = 24 / d
    const h = 15 / d

    out[Math.floor(i / 3) % 2] += `M${f(sx(x, d) - w / 2)} ${f(sy(WATER, d) - h)}h${f(w)}v${f(h)}h${f(-w)}z`
  }

  return out
}

/** One chrome rail of the pool ladder at the near left edge, at one depth. */
function rail(d: number): string {
  const path: Pt[] = [
    [-704, FLOOR],
    [-704, 452],
    [-694, 426],
    [-664, 414],
    [-634, 424],
    [-618, 452],
    [-612, 600],
    [-612, 680],
  ]

  return `M${path.map(([x, y]) => at(x, y, d)).join('L')}`
}

/** The keyframes of one pass down the pool: steady speed in the hall, so it slows on screen as it goes. */
function passKeys(name: string, seconds: number, speed: number): string {
  const frames: string[] = []

  for (let i = 0; i <= 12; i += 1) {
    const p = i * 7.5
    const d = 1 + speed * (p / 100) * seconds
    const o = i === 0 || i === 12 ? 0 : i >= 10 ? 0.45 : 1

    frames.push(`${f(p)}%{transform:scale(${(1 / d).toFixed(3)});opacity:${o}}`)
  }

  return `@keyframes ${name}{${frames.join('')}100%{transform:scale(.1);opacity:0}}`
}

/** The laptop in a rubber shell, a stopwatch on its lanyard and a water bottle on the tiled desk. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${254 + i * 12}" y="322" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const hand = activity === 'run' || activity === 'tool' ? 'lm-sw lm-swf' : activity === 'error' ? 'lm-sw lm-sws' : 'lm-sw'
  const lines = [44, 30, 52, 38]
    .map((w, i) => `<path d="M${f(366 + i * 7.6)} ${f(298 - i * 13)}l${f(w * 0.36)} ${f(-w * 0.6)}" stroke="#04181b" stroke-opacity=".45" stroke-width="3"/>`)
    .join('')

  return (
    '<path d="M238 330L248 318H346L354 330Z" fill="#1c3336" stroke="#4d7a7e" stroke-width="2"/>' +
    keys +
    '<path d="M336 321L394 225L411 230L358 325Z" fill="#1c3336" stroke="#4d7a7e" stroke-width="3" stroke-linejoin="round"/>' +
    `<path d="M345 317L395 235L404 238L357 319Z" fill="${light}"/>` +
    lines +
    '<path d="M345 317L395 235L388 238L352 318Z" fill="#ffffff" fill-opacity=".14"/>' +
    `<path d="M372 330C364 326 364 306 378 302" fill="none" stroke="${CAP}" stroke-width="2"/>` +
    '<rect x="380" y="294" width="6" height="6" rx="1" fill="#9fb7b7"/>' +
    `<circle cx="383" cy="315" r="13" fill="${PALE}" stroke="#5f8486" stroke-width="2.4"/><circle cx="383" cy="315" r="9.5" fill="#0b1c1e"/>` +
    `<g transform="translate(383 315)"><g class="${hand}"><path d="M-1.2 1.4V-8.2H1.2V1.4Z" fill="${light}"/></g><circle r="1.8" fill="${PALE}"/></g>` +
    '<rect x="400" y="294" width="15" height="36" rx="5" fill="#5fc6c8" fill-opacity=".26" stroke="#8fd8d8" stroke-opacity=".6" stroke-width="1.6"/>' +
    `<rect x="403" y="285" width="9" height="10" rx="2" fill="${CAP}"/><path d="M402 313H413" stroke="#bff3ef" stroke-opacity=".4" stroke-width="2"/>`
  )
}

export function liminalPoolWorld(): World {
  const next = random(29)
  const grout = tiles()
  const netA = caustics(11, 0)
  const netB = caustics(37, 1)
  const net = (lines: [string, string, string]) =>
    `<path d="${lines[0]}" stroke-width="3"/><path d="${lines[1]}" stroke-width="2" stroke-opacity=".8"/><path d="${lines[2]}" stroke-width="1.3" stroke-opacity=".6"/>`

  // Arches and doorways, far to near so the near ones overlap.
  const bays = RIBS.slice(1)
    .map((d, j) => ({ d, j }))
    .reverse()
    .map(({ d, j }) => {
      const o = f(fog(d))
      const nextRib = depthAt(j + 2)
      const doors =
        j < 12
          ? `<g opacity="${o}"><path d="${doorway(-1, d, nextRib)}" fill="url(#lm-dr)" stroke="#2a4649" stroke-width="2"/>` +
            `<path d="${doorway(1, d, nextRib)}" fill="url(#lm-dr)" stroke="#2a4649" stroke-width="2"/></g>`
          : ''

      return (
        doors +
        `<g opacity="${o}"><path d="${arch(d, 32)}" stroke="#25403f" stroke-width="${f(64 / d)}"/>` +
        `<path d="${arch(d, 66)}" stroke="#6a9596" stroke-opacity=".5" stroke-width="${f(Math.max(1, 3 / d))}"/></g>`
      )
    })
    .join('')

  // Darkness per slice of the hall: the error puts it on near to far, done lifts it far to near.
  const dark = RIBS.map((d, i) => {
    const inner = depthAt(i + 1)

    return `<path class="lm-dk" style="--i:${i}" fill-rule="evenodd" d="${section(d)}${i + 1 < RIBS.length ? section(inner) : ''}"/>`
  }).join('')

  // The water of each slice, for done's turquoise wave.
  const tide = RIBS.map((d, i) => {
    const far = i + 1 < RIBS.length ? depthAt(i + 1) : 60

    return `<path class="lm-tq" style="--i:${i}" d="M${at(POOL_L, WATER, d)}L${at(POOL_R, WATER, d)}L${at(POOL_R, WATER, far)}L${at(POOL_L, WATER, far)}Z"/>`
  }).join('')

  // Each bay's lights: a sconce on each arch's pillar and an underwater lamp in each pool wall.
  const lights = RIBS.slice(1, 13)
    .map((d, j) => {
      const i = j + 1
      const m = (d + depthAt(i + 1)) / 2
      const o = f(fog(m) * 0.95 + 0.05)
      const sconce = (side: number) => {
        const x = sx(side * (HALL - 48), d)
        const y = sy(-40, d)

        return (
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(118 / d)}" fill="url(#lm-sg)"/>` +
          `<rect x="${f(x - 7 / d)}" y="${f(y - 15 / d)}" width="${f(14 / d)}" height="${f(30 / d)}" rx="${f(5 / d)}" fill="#e6fbf8"/>`
        )
      }
      const lamp = (x: number) =>
        `<ellipse cx="${f(sx(x, m))}" cy="${f(sy(650, m))}" rx="${f(185 / m)}" ry="${f(64 / m)}" fill="url(#lm-ug)"/>` +
        `<ellipse cx="${f(sx(x, m))}" cy="${f(sy(650, m))}" rx="${f(20 / m)}" ry="${f(8 / m)}" fill="#e9fffc" fill-opacity=".9"/>`

      return (
        `<g class="lm-lt" style="--i:${i}"><g opacity="${o}">` +
        `<g${i === 6 ? ' class="lm-fl"' : ''}>${sconce(-1)}${sconce(1)}</g>` +
        `<g class="lm-lb" style="animation-delay:${f(-i * 0.7)}s">${lamp(POOL_L)}${lamp(POOL_R)}</g></g></g>`
      )
    })
    .join('')

  const glints = Array.from({ length: 12 }, (_, i) => {
    const d = 1.12 + next() * 1.9
    const x = POOL_L + 60 + next() * (POOL_R - POOL_L - 120)
    const w = (30 + next() * 40) / d

    return `<path class="lm-gn" style="animation-delay:${f(-next() * 3.4)}s" d="M${f(sx(x, d) - w / 2)} ${f(sy(WATER, d))}h${f(w)}" stroke-width="${f(3 / d)}"/>`
  }).join('')
  const ropeA = rope(-287)
  const ropeB = rope(47)
  const stripes = [-453, -120, 213]
    .map(x => `M${VX} ${VY}L${f(sx(x - 26, 900 / 700))} 1130L${f(sx(x + 26, 900 / 700))} 1130Z`)
    .join('')
  const waveKeys = passKeys('lm-wv', 5.6, 1.45)
  const pingKeys = '@keyframes lm-pg{0%{transform:scale(.77);opacity:0}8%{opacity:.55}100%{transform:scale(.1);opacity:0}}'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#031012',
      furniture: '#2c4648',
      metal: '#2b4f55',
      paper: '#e4f4f3',
      light: { idle: '#3aa6b0', work: '#5fdde6', bright: '#c2fbff' },
      headTop: 220,
      glowAt: [372, 276],
      device,
      wear: {
        front:
          // The swim cap, its sheen and the goggles pushed up on it: all above the eyes' top row.
          `<path d="M63 252C61 226 96 211 150 211C204 211 239 226 237 252Z" fill="${CAP}"/>` +
          '<path d="M86 234C102 222 126 218 150 218" fill="none" stroke="#bff3f0" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M64 242C100 233 200 233 236 242" fill="none" stroke="#0c2d31" stroke-width="4"/>' +
          `<g stroke="${PALE}" stroke-width="3" fill="#0b2a2e"><ellipse cx="122" cy="233" rx="15" ry="9"/><ellipse cx="178" cy="233" rx="15" ry="9"/></g>` +
          `<path d="M137 233H163" stroke="${PALE}" stroke-width="3"/>` +
          '<g fill="#9ff4ee" fill-opacity=".75"><circle cx="116" cy="230" r="2.6"/><circle cx="172" cy="230" r="2.6"/></g>' +
          // The towel round its shoulders, below the eyes, one end hanging.
          '<path d="M68 318H232V334H68Z" fill="#d8ecea"/><path d="M74 334H94V356H74Z" fill="#c6dedc"/>' +
          `<path d="M68 322.5H232M68 329.5H232M74 340H94M74 347H94" stroke="${CAP}" stroke-width="2.4"/>`,
      },
      seatArt:
        // The lifeguard stand: splayed white rails, rungs, the seat plank and the rescue tube on its strap.
        '<g stroke="#56706f" stroke-linecap="round"><path d="M114 354L98 452M188 354L204 452" stroke-width="8"/>' +
        '<path d="M110 384H192M106 414H196M102 442H200" stroke-width="5"/></g>' +
        '<path d="M114 356L99 450M188 356L203 450" stroke="#a9c6c5" stroke-opacity=".4" stroke-width="2"/>' +
        '<rect x="100" y="347" width="102" height="9" rx="3" fill="#88a6a5"/><path d="M102 348H200" stroke="#d8ecea" stroke-opacity=".5" stroke-width="1.6"/>' +
        '<path d="M106 358C94 364 88 376 87 390" fill="none" stroke="#23393b" stroke-width="2"/>' +
        '<rect x="79" y="388" width="16" height="62" rx="8" fill="#c4553e"/><path d="M81 404H93M81 434H93" stroke="#7e3122" stroke-width="2"/>',
      tableArt:
        // A tiled poolside counter: a coping top, one leg and a tiled pedestal.
        '<rect x="166" y="330" width="304" height="13" rx="2" fill="#5c7a7b"/><path d="M166 331H470" stroke="#bfe0de" stroke-opacity=".45" stroke-width="1.6"/>' +
        '<rect x="180" y="343" width="11" height="113" fill="#2c4648"/>' +
        '<rect x="300" y="343" width="170" height="113" fill="#253e41"/>' +
        '<path d="M300 371H470M300 399H470M300 427H470M334 343V456M368 343V456M402 343V456M436 343V456" stroke="#0f2023" stroke-width="2"/>' +
        '<path d="M301 343V456" stroke="#5fc6c8" stroke-opacity=".3" stroke-width="2"/>',
    },
    style:
      // Caustics: two nets crossfade and drift; they quicken with work and surge while a command runs.
      '.lm-cau{opacity:.75}' +
      '.lm-ca,.lm-cb{animation:lm-cx 6.5s ease-in-out infinite alternate}.lm-cb{animation-delay:-6.5s}' +
      '@keyframes lm-cx{from{opacity:.12;transform:translate(0,0)}to{opacity:.95;transform:translate(4px,-6px)}}' +
      '.st-responding .lm-ca,.st-responding .lm-cb{animation-duration:3.6s}' +
      '.st-tool .lm-ca,.st-tool .lm-cb,.st-web .lm-ca,.st-web .lm-cb{animation-duration:2.4s}' +
      '.st-run .lm-cau{animation:lm-surge 1.3s ease-in-out infinite alternate}@keyframes lm-surge{from{opacity:.85}to{opacity:1}}' +
      '.st-run .lm-ca,.st-run .lm-cb{animation-duration:1.2s}' +
      // The lamps breathe, the water glints, the lone ring drifts, a drop falls from the vault now and then.
      '.lm-lb{animation:lm-lb 5s ease-in-out infinite alternate}@keyframes lm-lb{from{opacity:.72}to{opacity:1}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: one small far sconce dips twice in .4 s, once every 7 s.
      '.lm-fl{animation:lm-fl 7s linear infinite}@keyframes lm-fl{0%,88%,91%,94%,100%{opacity:1}89%{opacity:.25}92.5%{opacity:.3}}' +
      '.lm-gn{opacity:.1;animation:lm-gn 3.4s ease-in-out infinite alternate}@keyframes lm-gn{to{opacity:.7}}' +
      '.lm-ring{transform-box:fill-box;transform-origin:center;animation:lm-ring 16s ease-in-out infinite alternate}' +
      '@keyframes lm-ring{from{transform:translate(-9px,2px) rotate(-2deg)}to{transform:translate(10px,-2px) rotate(3deg)}}' +
      '.st-run .lm-ring{animation:lm-heave 1.3s ease-in-out infinite alternate}@keyframes lm-heave{from{transform:translateY(6px) rotate(-4deg)}to{transform:translateY(-10px) rotate(4deg)}}' +
      '.lm-drop{opacity:0;animation:lm-drop 9s ease-in infinite}' +
      '@keyframes lm-drop{0%{opacity:0;transform:translateY(0)}2%{opacity:.8}10%{opacity:.8;transform:translateY(726px)}10.5%,100%{opacity:0;transform:translateY(726px)}}' +
      '.lm-rip{transform-box:fill-box;transform-origin:center;opacity:0;animation:lm-rip 9s ease-out infinite}.lm-rip2{animation-delay:.45s}' +
      '@keyframes lm-rip{0%,10%{opacity:0;transform:scale(.2)}11%{opacity:.7}32%,100%{opacity:0;transform:scale(2.8)}}' +
      '.st-thinking .lm-drop,.st-thinking .lm-rip{animation-duration:3.2s}' +
      '.lm-sw{transform-box:view-box;animation:mv-spin 60s steps(60) infinite}.lm-swf{animation:mv-spin 1s linear infinite}.lm-sws{animation:none}' +
      // Run: one slow wave rolls away down the endless pool, a band of its light sweeping the vault with it.
      `.lm-wv{opacity:0}.st-run .lm-wv{animation:lm-wv 5.6s linear infinite}${waveKeys}` +
      '.st-run .lm-rope{animation:lm-rope 1.4s ease-in-out infinite alternate}@keyframes lm-rope{from{transform:translateY(3px)}to{transform:translateY(-4px)}}' +
      // Web: a ping runs down the hall into the dark.
      `.lm-pg{opacity:0}.st-web .lm-pg{animation:lm-pg 2s ease-out infinite}.st-web .lm-pg2{animation-delay:1s}${pingKeys}` +
      // Error: the lights go out one bay after another, into the distance; a dim emergency lamp comes on.
      '.lm-dk{opacity:0}' +
      '.st-error .lm-dk{animation:lm-dk .34s ease-in both;animation-delay:calc(.2s + var(--i) * .16s)}@keyframes lm-dk{to{opacity:.82}}' +
      '.st-error .lm-lt{animation:lm-lo .34s ease-in both;animation-delay:calc(.2s + var(--i) * .16s)}@keyframes lm-lo{to{opacity:0}}' +
      '.lm-em{opacity:0}.st-error .lm-em{animation:lm-fi 1s ease-out 2.4s both}@keyframes lm-fi{to{opacity:1}}' +
      '.lm-emb{animation:lm-emb 3s ease-in-out infinite alternate}@keyframes lm-emb{from{opacity:.45}to{opacity:1}}' +
      '.st-error .lm-cau{animation:lm-lo .6s ease-in .3s both}' +
      // Done: the lights come back from the far end toward Claude as a wave of turquoise, and the caustics bloom.
      '.st-done .lm-dk{animation:lm-up .5s ease-out both;animation-delay:calc((13 - var(--i)) * .075s)}@keyframes lm-up{from{opacity:.72}to{opacity:0}}' +
      '.st-done .lm-lt{animation:lm-on .5s ease-out both;animation-delay:calc((13 - var(--i)) * .075s)}@keyframes lm-on{from{opacity:0}to{opacity:1}}' +
      '.lm-tq{opacity:0}.st-done .lm-tq{animation:lm-tq 1.6s ease-out both;animation-delay:calc((13 - var(--i)) * .075s)}' +
      '@keyframes lm-tq{0%{opacity:0}25%{opacity:.35}100%{opacity:.22}}' +
      '.st-done .lm-cau{animation:lm-bloom 2.2s ease-out .9s both}@keyframes lm-bloom{from{opacity:.35}to{opacity:1}}' +
      '.st-done .lm-ca,.st-done .lm-cb{animation:lm-cfull 2.4s ease-out .8s both}@keyframes lm-cfull{from{opacity:.15}to{opacity:.9}}',
    scenery:
      '<defs>' +
      '<radialGradient id="lm-hall" gradientUnits="userSpaceOnUse" cx="800" cy="430" r="1000"><stop offset="0" stop-color="#000203"/><stop offset=".07" stop-color="#020708"/>' +
      '<stop offset=".24" stop-color="#081416"/><stop offset=".55" stop-color="#112426"/><stop offset="1" stop-color="#1a3134"/></radialGradient>' +
      '<radialGradient id="lm-deck" gradientUnits="userSpaceOnUse" cx="800" cy="430" r="900"><stop offset="0" stop-color="#000203"/><stop offset=".25" stop-color="#091618"/>' +
      '<stop offset=".6" stop-color="#142a2c"/><stop offset="1" stop-color="#1c3739"/></radialGradient>' +
      '<linearGradient id="lm-wt" gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="1000"><stop offset="0" stop-color="#021113"/><stop offset=".35" stop-color="#06292e"/>' +
      '<stop offset=".72" stop-color="#0a4950"/><stop offset="1" stop-color="#12707a"/></linearGradient>' +
      '<radialGradient id="lm-fog" gradientUnits="userSpaceOnUse" cx="800" cy="430" r="620"><stop offset="0" stop-color="#000203" stop-opacity=".97"/>' +
      '<stop offset=".08" stop-color="#000203" stop-opacity=".85"/><stop offset=".26" stop-color="#000203" stop-opacity=".42"/><stop offset=".55" stop-color="#000203" stop-opacity=".1"/>' +
      '<stop offset="1" stop-color="#000203" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="lm-dr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010405"/><stop offset=".55" stop-color="#021113"/><stop offset="1" stop-color="#0b3a3e"/></linearGradient>' +
      '<linearGradient id="lm-cs" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#8ff7ee" stop-opacity=".85"/>' +
      '<stop offset=".27" stop-color="#8ff7ee" stop-opacity=".8"/><stop offset=".4" stop-color="#8ff7ee" stop-opacity=".2"/><stop offset=".6" stop-color="#8ff7ee" stop-opacity=".2"/>' +
      '<stop offset=".73" stop-color="#8ff7ee" stop-opacity=".8"/><stop offset="1" stop-color="#8ff7ee" stop-opacity=".85"/></linearGradient>' +
      '<radialGradient id="lm-ug"><stop offset="0" stop-color="#a6fbf3" stop-opacity=".7"/><stop offset=".35" stop-color="#3fd6d0" stop-opacity=".28"/><stop offset="1" stop-color="#3fd6d0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lm-sg"><stop offset="0" stop-color="#e4fbf8" stop-opacity=".55"/><stop offset=".35" stop-color="#a8ece6" stop-opacity=".16"/><stop offset="1" stop-color="#a8ece6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lm-sh"><stop offset="0" stop-color="#2fb8b4" stop-opacity=".2"/><stop offset="1" stop-color="#2fb8b4" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="lm-wf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6fbf3" stop-opacity=".5"/><stop offset="1" stop-color="#3fd6d0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="lm-wg" gradientUnits="userSpaceOnUse" x1="180" y1="0" x2="1180" y2="0"><stop offset="0" stop-color="#c8fffa" stop-opacity=".9"/>' +
      '<stop offset=".3" stop-color="#8ff7ee" stop-opacity=".4"/><stop offset=".7" stop-color="#8ff7ee" stop-opacity=".4"/><stop offset="1" stop-color="#c8fffa" stop-opacity=".9"/></linearGradient>' +
      '<radialGradient id="lm-em"><stop offset="0" stop-color="#e0674f" stop-opacity=".55"/><stop offset="1" stop-color="#e0674f" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The hall: tiled walls and vault, the water's light on its shoulders, the grout, the caustics.
      '<rect width="1600" height="1000" fill="url(#lm-hall)"/>' +
      '<ellipse cx="170" cy="150" rx="460" ry="300" fill="url(#lm-sh)"/><ellipse cx="1430" cy="150" rx="460" ry="300" fill="url(#lm-sh)"/>' +
      `<path d="${grout.hall}" fill="none" stroke="#030a0b" stroke-opacity=".6" stroke-width="1.6"/>` +
      `<g class="lm-cau" fill="none" stroke="url(#lm-cs)" stroke-linecap="round"><g class="lm-ca">${net(netA)}</g><g class="lm-cb">${net(netB)}</g></g>` +
      `<g fill="none">${bays}</g>` +
      // The deck, the pool cut into it with its lit inner walls and coping, the water.
      `<path d="M${VX} ${VY}L${at(-HALL, FLOOR, 0.7)}L${at(HALL, FLOOR, 0.7)}Z" fill="url(#lm-deck)"/>` +
      `<path d="${grout.deck}" fill="none" stroke="#030a0b" stroke-opacity=".6" stroke-width="1.6"/>` +
      `<path d="M${VX} ${VY}L${at(POOL_L, FLOOR, 0.8)}L${at(POOL_R, FLOOR, 0.8)}Z" fill="#164549"/>` +
      `<path d="M${VX} ${VY}L${at(POOL_L - 60, FLOOR, 0.8)}L${at(POOL_L, FLOOR, 0.8)}ZM${VX} ${VY}L${at(POOL_R, FLOOR, 0.8)}L${at(POOL_R + 60, FLOOR, 0.8)}Z" fill="#3b5a5c"/>` +
      `<path d="M${VX} ${VY}L${at(POOL_L, WATER, 0.8)}L${at(POOL_R, WATER, 0.8)}Z" fill="url(#lm-wt)"/>` +
      `<path d="${stripes}" fill="#010a0b" fill-opacity=".45"/>` +
      `<g fill="#2fe6dc">${tide}</g>` +
      `<g stroke="#bff7f2" stroke-linecap="round">${glints}</g>` +
      `<g class="lm-rope"><path d="${ropeA[0]}${ropeB[0]}" fill="#1d8a95" fill-opacity=".8"/><path d="${ropeA[1]}${ropeB[1]}" fill="${PALE}" fill-opacity=".55"/></g>` +
      // The drop from the vault and its rings, and the lone ring float.
      '<circle class="lm-drop" cx="380" cy="146" r="3" fill="#bff3ef"/>' +
      `<g fill="none" stroke="#bff3ef" stroke-width="1.6"><ellipse class="lm-rip" cx="380" cy="872" rx="26" ry="8"/><ellipse class="lm-rip lm-rip2" cx="380" cy="872" rx="26" ry="8"/></g>` +
      '<ellipse cx="394" cy="931" rx="64" ry="21" fill="#010a0b" fill-opacity=".45"/>' +
      '<g class="lm-ring"><ellipse cx="390" cy="920" rx="50" ry="17" fill="none" stroke="#a9c4c2" stroke-width="15"/>' +
      `<ellipse cx="390" cy="920" rx="50" ry="17" fill="none" stroke="${CAP}" stroke-width="15" pathLength="8" stroke-dasharray="1 1"/>` +
      '<path d="M350 910Q390 896 430 910" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/></g>' +
      // The ladder at the near left edge.
      `<g fill="none" stroke="#9fbcbc" stroke-linecap="round" stroke-linejoin="round"><path d="${rail(1.36)}" stroke-width="5"/><path d="${rail(1.52)}" stroke-width="4.4"/>` +
      `<path d="M${at(-612, 640, 1.36)}L${at(-612, 640, 1.52)}M${at(-612, 690, 1.36)}L${at(-612, 690, 1.52)}" stroke-opacity=".4" stroke-width="3"/></g>` +
      // The wave: drawn at the near end and scaled about the vanishing point, it travels down the hall.
      `<g transform="translate(${VX} ${VY})"><g class="lm-wv"><g transform="translate(${-VX} ${-VY})">` +
      `<g fill="none" stroke="#5fe0d8"><path d="${arch(1, 40)}" stroke-opacity=".07" stroke-width="170"/><path d="${arch(1, 40)}" stroke-opacity=".12" stroke-width="60"/>` +
      `<path d="${arch(1, 40)}" stroke-opacity=".3" stroke-width="10"/></g>` +
      '<path d="M180 1012C300 970 620 976 800 972C980 970 1100 976 1180 1012C1080 990 960 984 800 992C620 1000 400 986 180 1012Z" fill="#010a0b" fill-opacity=".45"/>' +
      '<path d="M180 1012C400 986 620 1000 800 992C960 986 1080 998 1180 1012C1060 1090 320 1090 180 1012Z" fill="url(#lm-wf)"/>' +
      '<g fill="none" stroke="url(#lm-wg)" stroke-linecap="round"><path d="M180 1012C400 986 620 1000 800 992C960 986 1080 998 1180 1012" stroke-width="6"/>' +
      '<path d="M190 1020C400 996 620 1008 800 1001C960 996 1080 1006 1170 1020" stroke="#e6fffc" stroke-opacity=".5" stroke-width="5" stroke-dasharray="6 16"/>' +
      '<path d="M180 1092C420 1076 940 1080 1180 1092" stroke-opacity=".45" stroke-width="3.4"/><path d="M180 1146C420 1134 940 1136 1180 1146" stroke-opacity=".25" stroke-width="3"/></g>' +
      '</g></g></g>' +
      // The far dark, then the darkness that falls bay by bay, then the lights themselves.
      '<rect width="1600" height="1000" fill="url(#lm-fog)"/>' +
      `<g fill="#000203">${dark}</g>` +
      lights +
      [0, 1]
        .map(
          k =>
            `<g transform="translate(${VX} ${VY})"><g class="lm-pg${k ? ' lm-pg2' : ''}"><g transform="translate(${-VX} ${-VY})">` +
            `<path d="${arch(1, 40)}" fill="none" stroke="#7ff0e8" stroke-width="6"/></g></g></g>`,
        )
        .join('') +
      `<g class="lm-em"><g class="lm-emb"><circle cx="${f(sx(-952, 1.3))}" cy="${f(sy(-150, 1.3))}" r="80" fill="url(#lm-em)"/>` +
      `<rect x="${f(sx(-952, 1.3) - 7)}" y="${f(sy(-150, 1.3) - 5)}" width="14" height="10" rx="3" fill="#e0674f" fill-opacity=".85"/></g></g>`,
    nook:
      '<defs><radialGradient id="lm-sd"><stop offset="0" stop-color="#000203" stop-opacity=".6"/><stop offset="1" stop-color="#000203" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="270" cy="456" rx="260" ry="18" fill="url(#lm-sd)"/>' +
      // A ring buoy on its post beside the stand.
      '<rect x="-16" y="132" width="8" height="324" rx="2" fill="#3d5658"/><path d="M-12 138H12V152" fill="none" stroke="#3d5658" stroke-width="4"/>' +
      '<g transform="translate(10 186)">' +
      `<circle r="30" fill="none" stroke="${PALE}" stroke-width="13"/><circle r="30" fill="none" stroke="${CAP}" stroke-width="13" pathLength="8" stroke-dasharray="1 1"/>` +
      '<circle r="36" fill="none" stroke="#7d9a9a" stroke-width="1.6" stroke-dasharray="7 5"/><path d="M-20 -14Q-6 -26 12 -24" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/></g>',
  }
}
