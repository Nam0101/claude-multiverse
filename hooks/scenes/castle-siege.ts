import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Castle Siege: a siege engineer's field tent on a night battlefield, a castle across the moat with two towers
// burning. A counterweight trebuchet stands behind the tent against a smoky moon. When a command runs it swings
// and hurls a fireball up off the top that comes down on the keep; an error drops a boulder beside the tent; done lowers
// the drawbridge, opens the lit gate, raises the camp's banners on the towers and lets the fires die down.
const STONE_RIM = '#8a3a1c'
const TIMBER = '#120a07'
const TIMBER_RIM = '#6a2e18'
const WOOD = '#2a1a11'
const WOOD_EDGE = '#3e2818'
const IRON = '#4a4244'
const PARCH = '#e2cfa8'
const INK = '#4a2e1a'
const GOLD = '#d9a440'
const OURS = '#b2402a'
const THEIRS = '#28324c'

// The trebuchet, in the desk's box: its axle, the throwing arm, the sling, and where the fireball leaves it.
// The whole engine is drawn at `SCALE` around the middle of its base.
const AXLE: readonly [number, number] = [270, -170]
const BASE: readonly [number, number] = [270, 22]
const SCALE = 1.2
const LONG = 200
const SLING = 30
const RELEASE_DEG = -100
const RELEASE: readonly [number, number] = [
  BASE[0] + SCALE * (AXLE[0] + LONG * Math.cos((RELEASE_DEG * Math.PI) / 180) - BASE[0]),
  BASE[1] + SCALE * (AXLE[1] + LONG * Math.sin((RELEASE_DEG * Math.PI) / 180) + SLING - BASE[1]),
]
// The shot is split so neither leg crosses the chat column in any window shape: the pinned nook throws the fireball
// steeply up off the top, and the unpinned scenery drops it from above the top edge onto the keep (picture coords).
const HIT_AT: readonly [number, number] = [180, 240]
const FALL_FROM: readonly [number, number] = [560, -90]
// The ground under the boulder where it comes to rest beside the tent, in the desk's box.
const THUD: readonly [number, number] = [-44, 64]

/** A flame tongue standing on (x, y), `w` wide and `h` tall, leaning `deg`. */
function flame(x: number, y: number, w: number, h: number, deg: number): string {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  const p = (px: number, py: number) => `${Math.round(x + px * c - py * s)} ${Math.round(y + px * s + py * c)}`

  return `M${p(-w / 2, 0)}C${p(-w / 2, -h * 0.45)} ${p(-w * 0.12, -h * 0.62)} ${p(0, -h)}C${p(w * 0.16, -h * 0.6)} ${p(w / 2, -h * 0.42)} ${p(w / 2, 0)}Z`
}

/** A short time for a style: one decimal, no leading zero. */
function t(value: number): string {
  return f(value).replace(/^(-?)0\./, '$1.')
}

/** A fire: a soft glow and a row of flickering tongues, outer orange, inner gold. */
function fire(x: number, y: number, n: number, spread: number, tall: number, w: number, seed: number, glow: number): string {
  const next = random(seed)
  let outer = ''
  let core = ''

  for (let i = 0; i < n; i += 1) {
    const at = n === 1 ? 0 : i / (n - 1) - 0.5
    const h = tall * (1 - Math.abs(at) * 0.9) * (0.8 + next() * 0.35)
    const tilt = at * 26 + (next() - 0.5) * 8
    const time = `--t:${t(0.55 + next() * 0.5)}s;--d:${t(-next())}s`

    outer += `<path class="cs-fl" style="${time}" d="${flame(x + at * spread, y, w, h, tilt)}"/>`
    if (i % 2 === 1 || n < 3) core += `<path class="cs-fl" style="${time}" d="${flame(x + at * spread, y + 2, w * 0.5, h * 0.55, tilt)}"/>`
  }

  return `<g class="cs-fire"><circle class="cs-fg" cx="${x}" cy="${f(y - tall * 0.35)}" r="${glow}" fill="url(#cs-fglow)"/><g fill="url(#cs-fo)">${outer}</g><g fill="url(#cs-fc)">${core}</g></g>`
}

/** Crenellations along a wall top at `y`, from x0 to x1. */
function merlons(x0: number, x1: number, y: number, w = 12, h = 13): string {
  const n = Math.max(2, Math.round((x1 - x0 + 9) / (w + 9)))
  const step = (x1 - x0 - w) / (n - 1)
  let d = ''

  for (let i = 0; i < n; i += 1) d += `M${f(x0 + i * step)} ${y}h${w}v${-h}h${-w}Z`

  return d
}

/** A ladder leaning on the wall: two rails from the foot to the top, rungs between. */
function ladder(x1: number, x2: number, foot: number, t1: number, t2: number, top: number): string {
  let rungs = ''

  for (let y = foot - 16; y > top + 8; y -= 20) {
    const k = (foot - y) / (foot - top)

    rungs += `M${f(x1 + (t1 - x1) * k)} ${y}H${f(x2 + (t2 - x2) * k)}`
  }

  return `<path d="M${x1} ${foot}L${t1} ${top}M${x2} ${foot}L${t2} ${top}${rungs}" fill="none" stroke="#2c1a10" stroke-width="4" stroke-linecap="round"/>`
}

/** The camp's banner: a swallowtail with an invented gold mark, a ring over a chevron. */
function ourBanner(w: number, h: number): string {
  return (
    `<path d="M0 0H${w}L${f(w * 0.76)} ${f(h / 2)}L${w} ${h}H0Z" fill="${OURS}" stroke="#5a1a10" stroke-width="1.2"/>` +
    `<path d="M${f(w * 0.12)} ${f(h * 0.82)}L${f(w * 0.34)} ${f(h * 0.4)}L${f(w * 0.56)} ${f(h * 0.82)}" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
    `<circle cx="${f(w * 0.34)}" cy="${f(h * 0.24)}" r="${f(h * 0.1)}" fill="none" stroke="${GOLD}" stroke-width="2"/>`
  )
}

/** The throwing arm around its axle, with the hanging counterweight and, on the big one, the sling. */
function arm(model: boolean): string {
  const rim = model ? ' stroke="#d89a5e" stroke-width="5"' : ` stroke="${TIMBER_RIM}" stroke-width="2"`
  const sling = model
    ? ''
    : `<g transform="translate(${LONG} 0)"><g class="cs-cw" transform="rotate(-55)"><path d="M0 0V${SLING - 7}" stroke="#6a5444" stroke-width="2"/>` +
      `<circle class="cs-stone" cy="${SLING}" r="8" fill="#2c2420" stroke="#6a5a52" stroke-width="1.4"/>` +
      `<g class="cs-load"><circle cy="${SLING}" r="28" fill="url(#cs-fb)"/><circle cy="${SLING}" r="8" fill="#ffd98a"/></g></g></g>`

  return (
    `<g class="cs-arm" transform="rotate(55)">` +
    `<path d="M-76 -11L${LONG} -4.5V4.5L-76 11Z" fill="${model ? '#8a5630' : TIMBER}"${rim}/>` +
    (model ? '' : `<path d="M-74 -11L${LONG} -4.5" stroke="#c08a74" stroke-opacity=".45" stroke-width="1.6"/><path d="M-44 -10V10M40 -8V8M120 -6V6" stroke="${IRON}" stroke-width="3"/>`) +
    `<g transform="translate(-70 0)"><g class="cs-cw" transform="rotate(-55)">` +
    `<path d="M0 0L-18 14M0 0L18 14" stroke="${model ? '#6a4428' : '#3a3234'}" stroke-width="${model ? 8 : 3.4}"/>` +
    `<rect x="-30" y="12" width="60" height="52" rx="3" fill="${model ? '#4a3020' : '#1e140d'}"${rim}/>` +
    (model ? '' : `<path d="M-30 29H30M-30 47H30" stroke="${IRON}" stroke-width="3.4"/><path d="M-30 13H30" stroke="#c08a74" stroke-opacity=".45" stroke-width="1.6"/>`) +
    `</g></g>${sling}</g>`
  )
}

/** The laptop in an iron-bound oak case on a plan sheet, and a model trebuchet that throws when the big one does. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<path d="M232 330L242 321H352L346 330Z" fill="${PARCH}" fill-opacity=".6"/>` +
    '<rect x="246" y="323" width="96" height="7" rx="1.5" fill="#3a2414" stroke="#6a5a54" stroke-width="1"/>' +
    keys +
    '<path d="M334 327L360 238L371 240L345 329Z" fill="#3a2414" stroke="#6a5a54" stroke-width="1.2"/>' +
    '<path d="M356 250L368 253M342 300L354 303" stroke="#7a6a64" stroke-width="2.4"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The model on its base.
    '<rect x="382" y="325" width="66" height="5" rx="1" fill="#4a3020"/>' +
    '<path d="M393 326L410 292L427 326M399 314H421" fill="none" stroke="#9a6438" stroke-width="3" stroke-linejoin="round"/>' +
    `<g transform="translate(410 292) scale(.22)">${arm(true)}</g>` +
    `<circle cx="410" cy="292" r="2.6" fill="${GOLD}"/>`
  )
}

export function castleSiegeWorld(): World {
  const next = random(1415)

  // The sky: stars where the smoke thins, slow banks of smoke along the top.
  const stars = Array.from({ length: 16 }, () => `M${Math.round(860 + next() * 740)} ${Math.round(8 + next() * 230)}h2.4v2.4h-2.4z`).join('')
  const banks = [
    [280, 40, 420, 90],
    [760, 70, 380, 64],
    [1120, 24, 320, 58],
    [560, 160, 260, 46],
    [120, 120, 260, 60],
  ]
    .map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${i % 2 ? '#1a0f0d' : '#160c0a'}" fill-opacity=".7"/>`)
    .join('')

  // Smoke rising from the two burning towers and drifting right over the field.
  const plume = (x: number, y: number, n: number, dx: number, dy: number, secs: number, seed: number) => {
    const rnd = random(seed)
    const puffs = Array.from({ length: n }, (_, i) => {
      const style = `--dx:${Math.round(dx * (0.8 + rnd() * 0.4))}px;--dy:${Math.round(dy * (0.85 + rnd() * 0.3))}px;--s:${f(2.4 + rnd() * 1.6)};--d:${t(-(i / n) * secs)}s`

      return `<circle class="cs-sm" style="${style}" cx="${f(x + (rnd() - 0.5) * 24)}" cy="${y}" r="${f(24 + rnd() * 14)}"${i % 2 ? ' fill="#2a1b17"' : ''}/>`
    }).join('')

    return `<g style="--t:${secs}s" fill="#231613">${puffs}</g>`
  }

  // Embers lifting off the fires, in two colours.
  const sources: [number, number][] = [[20, 170], [128, 90], [284, 300]]
  const embers: [string, string] = ['', '']
  for (let i = 0; i < 24; i += 1) {
    const [sx, sy] = sources[i % 3]!
    const style = `--dx:${Math.round(80 + next() * 300)}px;--dy:${Math.round(-(150 + next() * 250))}px;--t:${t(3.6 + next() * 3)}s;--d:${t(-next() * 6)}s`

    embers[next() > 0.5 ? 0 : 1] += `<circle class="cs-em" style="${style}" cx="${Math.round(sx + (next() - 0.5) * 80)}" cy="${Math.round(sy + next() * 40)}" r="${f(1.4 + next() * 1.5)}"/>`
  }

  // The besiegers' camp on the far hills: tents with a glow at the door, a far trebuchet, small campfires.
  const tents = [
    [560, 634, 18], [604, 634, 14], [700, 632, 20], [870, 622, 16], [930, 621, 22], [1060, 618, 18], [1120, 622, 14],
  ]
  const tentBodies = tents.map(([x, y, w]) => `M${f(x! - w! / 2)} ${y}L${x} ${f(y! - w! * 0.8)}L${f(x! + w! / 2)} ${y}Z`).join('')
  const tentDoors = tents.map(([x, y]) => `M${x! - 2} ${y}L${x} ${y! - 6}L${x! + 2} ${y}Z`).join('')
  const torches = Array.from({ length: 14 }, (_, i) => {
    const x = 520 + i * 48 + next() * 20
    const y = 642 - Math.sin((x - 380) / 260) * 14 + next() * 10

    return `M${f(x)} ${f(y)}h2v2h-2z`
  }).join('')
  const campfire = (x: number, y: number, d: number) =>
    `<circle cx="${x}" cy="${y - 6}" r="22" fill="url(#cs-cg)"/>` +
    `<g fill="url(#cs-fo)" opacity=".6"><path class="cs-fl" style="--t:.6s;--d:${t(d)}s" d="${flame(x - 3, y, 7, 14, -8)}"/>` +
    `<path class="cs-fl" style="--t:.8s;--d:${t(d - 0.3)}s" d="${flame(x + 3, y, 6, 11, 10)}"/></g>`

  // Stone courses on the keep and the wall.
  const courses = [460, 500, 540, 580, 250, 290, 330, 370, 410].map(y => `M${y > 420 ? -40 : 92} ${y}H${y > 420 ? 262 : 196}`).join('')

  // Arrow slits lit by the fire inside, in two sets that flicker out of step.
  const slit = (x: number, y: number) => `M${x} ${y}h5v22h-5Z`
  const slitsA = [slit(110, 214), slit(173, 214), slit(110, 330), slit(173, 330), slit(281, 400), slit(401, 400), slit(8, 300)].join('') + 'M130 236V206A14 14 0 0 1 158 206V236Z'
  const slitsB = [slit(141, 430), slit(281, 480), slit(401, 480), slit(30, 390), slit(173, 440), slit(110, 480)].join('')

  // The palisade of sharpened stakes along the foot at the left.
  let stakes = ''
  for (let x = -40, i = 0; x < 400; x += 20, i += 1) {
    const top = 912 + Math.sin(i * 1.3) * 12 + (i % 3) * 6

    stakes += `M${x} 1010V${f(top)}L${x + 7} ${f(top - 16)}L${x + 14} ${f(top)}V1010Z`
  }

  // The fireball's impact on the keep: lit stones thrown up and to the right (clear of the great window), sparks all
  // round, smoke.
  const debris = Array.from({ length: 12 }, (_, i) => {
    const d = 60 + next() * 80
    const style = `--dx:${Math.round(Math.cos(-1.5 + (i / 11) * 2) * d)}px;--up:${Math.round(-30 - next() * 60)}px;--dy:${Math.round(50 + next() * 110)}px`

    return `<rect class="cs-deb" style="${style}" x="-4" y="-4" width="${f(6 + next() * 6)}" height="${f(5 + next() * 4)}"/>`
  }).join('')
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.4
    const d = 80 + next() * 40

    return `<circle class="cs-spk" style="--dx:${Math.round(Math.cos(a) * d)}px;--dy:${Math.round(Math.sin(a) * d * 0.85 - 24)}px" r="3"/>`
  }).join('')
  const hitSmoke = [0, 1, 2, 3]
    .map(i => `<circle class="cs-ism" style="--dx:${i * 18}px;--dy:${-50 - i * 22}px;animation-delay:${t(i * 0.08)}s" cx="${i * 10 - 14}" r="24"/>`)
    .join('')

  // The boulder's dust, rolling up and to the right over the tent, and the clods it throws.
  const dust = Array.from({ length: 9 }, (_, i) => {
    const style = `--dx:${Math.round(-10 + i * 30 + next() * 20)}px;--dy:${Math.round(-60 - next() * 170)}px;--s:${f(3.8 + next() * 1.2)};animation-delay:${f(0.5 + i * 0.03)}s`

    return `<circle class="cs-dust" style="${style}" cx="${f(THUD[0] + (next() - 0.3) * 50)}" cy="${f(THUD[1] - 10 - next() * 20)}" r="${f(22 + next() * 12)}" fill="${i % 2 ? '#8a6c56' : '#7a5e4a'}"/>`
  }).join('')
  const clods = Array.from({ length: 10 }, (_, i) => {
    const style = `--dx:${Math.round((i - 3) * 26 + (next() - 0.5) * 12)}px;--up:${Math.round(-90 - next() * 90)}px;--dy:${Math.round(20 + next() * 40)}px`

    return `<rect class="cs-clod" style="${style}" width="${f(7 + next() * 5)}" height="${f(6 + next() * 4)}"/>`
  }).join('')

  // The pavilion's roof: stripes from the ridge to the eave, dark red and canvas.
  const stripes: [string, string] = ['', '']
  for (let i = 0; i < 8; i += 1) {
    const r0 = 50 + i * 40
    const e0 = -60 + i * 66.25

    stripes[i % 2] += `M${r0} -24H${r0 + 40}L${f(e0 + 66.25)} 80H${f(e0)}Z`
  }
  let scallops = 'M-62 78H472V100'
  for (let x = 472; x > -62; x -= 26.7) scallops += `Q${f(x - 13.35)} 116 ${f(x - 26.7)} 100`
  scallops += 'Z'

  // The winch wheel's spokes.
  const spokes = Array.from({ length: 4 }, (_, i) => {
    const a = (i * Math.PI) / 4

    return `M${f(140 - Math.cos(a) * 40)} ${f(-40 - Math.sin(a) * 40)}L${f(140 + Math.cos(a) * 40)} ${f(-40 + Math.sin(a) * 40)}`
  }).join('')

  // The boulder itself: a big rock, lit on its upper edge by the fires, that drops in spinning and bounces once.
  const boulder =
    `<g class="cs-bo"><g transform="translate(${THUD[0]} ${THUD[1] - 58})"><g class="cs-bx"><g class="cs-by"><g class="cs-spin"><g transform="scale(2.7)">` +
    '<path d="M-22 4L-19 -9L-9 -20L5 -21L17 -13L23 1L18 12L7 21L-8 20L-18 13Z" fill="#3a302c" stroke="#1a1412" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M-21 2L-18 -9L-9 -19L5 -20L16 -13" fill="none" stroke="#e09a6a" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M-8 -10L2 -2L-2 8M6 -14L12 -4M-12 10L-4 6" fill="none" stroke="#151110" stroke-width="1.1"/></g></g></g></g></g></g>'

  // A fireball with a short comet trail: `x` moves it sideways and sets its opacity, `y` moves it up or down.
  const comet = (x: string, y: string) =>
    [[6, 0.16, 0.15], [8, 0.26, 0.11], [10, 0.38, 0.07], [12, 0.5, 0.035]]
      .map(([r, o, d]) => `<g class="${x}" style="--d:${d}s"><g class="${y}"><circle r="${r}" fill="#ff7a2a" fill-opacity="${o}"/></g></g>`)
      .join('') +
    `<g class="${x}"><g class="${y}"><circle r="46" fill="url(#cs-fb)"/><circle r="14" fill="#ffb24a"/><circle r="9" fill="#ffd98a"/><circle r="5" fill="#fff6d8"/></g></g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#070404',
      furniture: WOOD,
      metal: '#3a2414',
      paper: PARCH,
      light: { idle: '#a8643a', work: '#ff8a4a', bright: '#ffd0a0' },
      headTop: 220,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // A quilted gambeson collar below the eyes.
          '<path d="M70 318H230V334H70Z" fill="#5a2a1c"/>' +
          '<path d="M70 326H230M92 318V334M116 318V334M140 318V334M164 318V334M188 318V334M212 318V334" stroke="#3a180e" stroke-width="1.6"/>' +
          // The kettle helmet: a steel dome with a comb, a riveted band and a wide brim, all above the eyes.
          '<path d="M84 242C84 214 112 196 150 196C188 196 216 214 216 242Z" fill="#4c4648" stroke="#2a2628" stroke-width="2"/>' +
          '<path d="M104 222C114 207 132 200 150 199" fill="none" stroke="#b0a8ac" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M150 197V236" stroke="#2e2a2c" stroke-width="4"/>' +
          '<path d="M86 234H214V242H86Z" fill="#3a3436"/>' +
          '<g fill="#9a9296"><circle cx="100" cy="238" r="1.8"/><circle cx="125" cy="238" r="1.8"/><circle cx="175" cy="238" r="1.8"/><circle cx="200" cy="238" r="1.8"/></g>' +
          '<path d="M48 246C82 236 218 236 252 246L248 253C214 245 86 245 52 253Z" fill="#5a5456" stroke="#2a2628" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M56 246C90 239 210 239 244 246" fill="none" stroke="#ff9a5a" stroke-opacity=".4" stroke-width="1.5"/>',
      },
      seatArt:
        // A folding camp stool: a leather sling on crossed legs.
        `<path d="M114 360L188 452M188 360L114 452" stroke="${WOOD}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M104 453H126M176 453H198" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M108 352V364M194 352V364" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>` +
        '<path d="M102 349Q151 360 200 349V357Q151 368 102 357Z" fill="#4a2a1a" stroke="#2a180e" stroke-width="1.5"/>' +
        '<circle cx="151" cy="406" r="4" fill="#6a5a54"/>',
      tableArt:
        // A trestle table, a plan hanging over its front edge.
        `<path d="M226 456L246 342L266 456M232 420H260M416 456L436 342L456 456M422 420H450M246 398H436" fill="none" stroke="${WOOD}" stroke-width="8" stroke-linejoin="round"/>` +
        `<rect x="166" y="330" width="304" height="12" rx="1.5" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.5"/>` +
        '<path d="M262 331V341M382 331V341" stroke="#160d08" stroke-width="1.5"/>' +
        `<path d="M262 331H352V372Q340 380 326 372Q308 366 290 374Q276 380 262 372Z" fill="${PARCH}" fill-opacity=".72"/>` +
        `<path d="M272 366L284 346L296 366M284 346L302 336M314 366V350H318V346H322V350H326V346H330V350H334V366" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
        `<path d="M302 336Q318 322 328 344" fill="none" stroke="#8a2e1e" stroke-width="1.4" stroke-dasharray="2 2"/>`,
    },
    style:
      // Fire: tongues flicker (shape only), glows breathe slowly, windows waver.
      '.cs-fl{transform-box:fill-box;transform-origin:50% 100%;animation:cs-fl var(--t,.7s) ease-in-out var(--d,0s) infinite alternate}' +
      '@keyframes cs-fl{from{transform:scale(.9,.8) skewX(-5deg)}to{transform:scale(1.05,1.08) skewX(4deg)}}' +
      '.cs-fg{animation:cs-fg 2.6s ease-in-out infinite alternate}@keyframes cs-fg{from{opacity:.65}to{opacity:1}}' +
      '.cs-wa{animation:cs-wn 1.7s ease-in-out infinite alternate}.cs-wb{animation:cs-wn 2.3s ease-in-out -1s infinite alternate}' +
      '@keyframes cs-wn{from{opacity:.5}to{opacity:.95}}' +
      '.cs-rf,.cs-sm,.cs-winch,.cs-imp,.cs-ism,.cs-spin,.cs-dust{transform-box:fill-box;transform-origin:center}' +
      '.cs-rf{animation:cs-rf 2.2s ease-in-out infinite alternate}' +
      '@keyframes cs-rf{from{opacity:.45;transform:scaleX(.88)}to{opacity:1;transform:scaleX(1.06)}}' +
      // Smoke, embers, banks of smoke, the ribbon over the moon.
      '.cs-sm{opacity:0;animation:cs-sm var(--t) linear var(--d) infinite}' +
      '@keyframes cs-sm{0%{opacity:0;transform:translate(0,0) scale(.6)}12%{opacity:.75}70%{opacity:.45}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(var(--s))}}' +
      '.cs-em{opacity:0;animation:cs-em var(--t) linear var(--d) infinite}' +
      '@keyframes cs-em{0%{opacity:0;transform:translate(0,0)}10%{opacity:.95}80%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.cs-drift{animation:cs-drift 40s ease-in-out infinite alternate}@keyframes cs-drift{to{transform:translateX(46px)}}' +
      '.cs-rib{animation:cs-rib 16s ease-in-out infinite alternate}@keyframes cs-rib{from{transform:translateX(-30px)}to{transform:translateX(30px)}}' +
      // Banners in the wind; faster while Claude writes.
      '.cs-bn{transform-box:fill-box;transform-origin:0 50%;animation:cs-bn 2.2s ease-in-out infinite alternate}' +
      '@keyframes cs-bn{from{transform:skewY(-6deg) scaleX(.93)}to{transform:skewY(5deg) scaleX(1.02)}}' +
      '.cs-gon{transform-box:fill-box;transform-origin:50% 0;animation:cs-gon 3s ease-in-out infinite alternate}' +
      '@keyframes cs-gon{from{transform:skewX(-5deg)}to{transform:skewX(5deg) scaleY(.97)}}' +
      '.st-responding .cs-bn{animation-duration:1.1s}.st-responding .cs-gon{animation-duration:1.4s}' +
      '.cs-lant{animation:cs-lant 4s ease-in-out infinite alternate}@keyframes cs-lant{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      // Tool: the winch wheel turns. Thinking: the shot is plotted on the plan. Read: a scroll unrolls.
      '.st-tool .cs-winch{animation:mv-spin 1.4s linear infinite}.st-responding .cs-winch{animation:mv-spin 7s linear infinite}' +
      '.cs-trace{stroke-dasharray:1;stroke-dashoffset:0}' +
      '.st-thinking .cs-trace{animation:cs-trace 2.2s ease-in-out infinite}@keyframes cs-trace{0%{stroke-dashoffset:1}60%,100%{stroke-dashoffset:0}}' +
      '.cs-scroll{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-read .cs-scroll{animation:cs-unroll 1.1s ease-out both}@keyframes cs-unroll{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      // Web: carrier pigeons leave the tent.
      '.cs-pg{opacity:0}.st-web .cs-pg{animation:cs-pg 4.2s linear infinite}' +
      '@keyframes cs-pg{0%{opacity:0;transform:translate(0,0) scale(.6)}8%{opacity:.9}88%{opacity:.85}100%{opacity:0;transform:translate(-220px,-760px) scale(1)}}' +
      '.cs-wing{transform-box:fill-box;transform-origin:50% 100%;animation:cs-wing .32s ease-in-out infinite alternate}@keyframes cs-wing{to{transform:scaleY(-.6)}}' +
      // Run: the counterweight drops, the arm swings up and over, the fireball flies to the keep and bursts; the arm
      // settles and is winched back down. One shot every 4.8 s.
      '.st-run .cs-arm{animation:cs-arm 4.8s ease-in-out infinite}.st-run .cs-cw{animation:cs-cw 4.8s ease-in-out infinite}' +
      '@keyframes cs-arm{0%,5%{transform:rotate(55deg);animation-timing-function:cubic-bezier(.6,0,.9,.7)}17.7%{transform:rotate(-100deg);animation-timing-function:ease-out}' +
      '23%{transform:rotate(-122deg)}32%{transform:rotate(-74deg)}41%{transform:rotate(-98deg)}' +
      '50%{transform:rotate(-84deg)}62%{transform:rotate(-90deg)}94%,100%{transform:rotate(55deg)}}' +
      '@keyframes cs-cw{0%,5%{transform:rotate(-55deg);animation-timing-function:cubic-bezier(.6,0,.9,.7)}17.7%{transform:rotate(100deg);animation-timing-function:ease-out}' +
      '23%{transform:rotate(122deg)}32%{transform:rotate(74deg)}41%{transform:rotate(98deg)}' +
      '50%{transform:rotate(84deg)}62%{transform:rotate(90deg)}94%,100%{transform:rotate(-55deg)}}' +
      '.cs-load{opacity:0}.st-run .cs-load{animation:cs-load 4.8s linear infinite}@keyframes cs-load{0%{opacity:0}5%,17.6%{opacity:1}17.8%,100%{opacity:0}}' +
      '.st-run .cs-stone{opacity:0}' +
      // The shot's first leg (nook): off the sling, steeply up and away, fading out above the engine. Its second leg
      // (scenery): from above the top edge, down onto the keep, where it bursts at 40% with a .12 s ramp.
      '.cs-ux,.cs-fx{opacity:0}' +
      '.st-run .cs-ux{animation:cs-ux 4.8s linear var(--d,0s) infinite}.st-run .cs-uy{animation:cs-uy 4.8s linear var(--d,0s) infinite}' +
      '@keyframes cs-ux{0%,17.7%{opacity:0;transform:translateX(0)}17.8%{opacity:1;transform:translateX(0)}23.5%{opacity:1}27.5%,100%{opacity:0;transform:translateX(var(--dx))}}' +
      '@keyframes cs-uy{0%,17.7%{transform:translateY(0) scale(1)}27.5%,100%{transform:translateY(var(--dy)) scale(.6)}}' +
      '.st-run .cs-fx{animation:cs-fx 4.8s linear var(--d,0s) infinite}.st-run .cs-fy{animation:cs-fy 4.8s linear var(--d,0s) infinite}' +
      '@keyframes cs-fx{0%,25%{opacity:0;transform:translateX(0)}25.1%{opacity:1;transform:translateX(0)}40%{opacity:1;transform:translateX(var(--dx))}40.3%,100%{opacity:0;transform:translateX(var(--dx))}}' +
      '@keyframes cs-fy{0%,25%{transform:translateY(0);animation-timing-function:cubic-bezier(.5,0,1,1)}40%,100%{transform:translateY(var(--dy))}}' +
      '.cs-imp,.cs-deb,.cs-spk,.cs-ism,.cs-nf{opacity:0}' +
      '.st-run .cs-imp{animation:cs-imp 4.8s ease-out infinite}@keyframes cs-imp{0%,40%{opacity:0;transform:scale(.3)}42.5%{opacity:.85;transform:scale(1)}52%{opacity:.6;transform:scale(1.3)}72%,100%{opacity:0;transform:scale(1.7)}}' +
      '.st-run .cs-deb{animation:cs-deb 4.8s linear infinite}' +
      '@keyframes cs-deb{0%,40%{opacity:0;transform:translate(0,0) rotate(0)}41%{opacity:1}49%{transform:translate(calc(var(--dx) * .45),var(--up)) rotate(90deg);animation-timing-function:ease-in}69%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(240deg)}71%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-run .cs-spk{animation:cs-spk 4.8s ease-out infinite}@keyframes cs-spk{0%,40%{opacity:0;transform:translate(0,0)}42%{opacity:1}56%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-run .cs-ism{animation:cs-ism 4.8s ease-out infinite}@keyframes cs-ism{0%,41%{opacity:0;transform:translate(0,0) scale(.4)}47%{opacity:.7}88%,100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.6)}}' +
      '.st-run .cs-nf{animation:cs-nf 4.8s ease-out infinite}@keyframes cs-nf{0%,41%{opacity:0}47%,90%{opacity:1}100%{opacity:0}}' +
      // Error: a boulder drops out of the sky beside the tent, bounces once, throws dirt and a big dust cloud; the tent
      // and the engine shake, the standard's pole is knocked askew, a plan swings loose and the lantern swings.
      '.cs-bo,.cs-dust,.cs-clod{opacity:0}.st-error .cs-bo{animation:cs-show .1s both}' +
      '.st-error .cs-bx{animation:cs-bx .55s linear both}@keyframes cs-bx{from{transform:translateX(-200px)}to{transform:translateX(0)}}' +
      '.st-error .cs-by{animation:cs-by .9s both}' +
      '@keyframes cs-by{0%{transform:translateY(-1500px);animation-timing-function:cubic-bezier(.45,0,1,1)}61%{transform:translateY(0);animation-timing-function:ease-out}80%{transform:translateY(-22px);animation-timing-function:ease-in}100%{transform:translateY(0)}}' +
      '.st-error .cs-spin{animation:cs-spin .9s ease-out both}@keyframes cs-spin{from{transform:rotate(-260deg)}to{transform:rotate(0)}}' +
      '.st-error .cs-dust{animation:cs-dust 2.8s ease-out both}@keyframes cs-dust{0%{opacity:0;transform:translate(0,0) scale(.3)}8%{opacity:.58}' +
      '35%{transform:translate(calc(var(--dx) * .65),calc(var(--dy) * .65)) scale(calc(var(--s) * .72))}50%{opacity:.4}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(var(--s))}}' +
      '.st-error .cs-lean{animation:cs-lean 1.2s cubic-bezier(.3,1.5,.5,1) .56s both}@keyframes cs-lean{to{transform:rotate(9deg)}}' +
      '.st-error .cs-clod{animation:cs-clod 1.1s .55s both}' +
      '@keyframes cs-clod{0%{opacity:1;transform:translate(0,0);animation-timing-function:ease-out}45%{transform:translate(calc(var(--dx) * .6),var(--up));animation-timing-function:ease-in}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-error .cs-tent{animation:cs-jolt .7s ease-out .55s both}' +
      '@keyframes cs-jolt{0%,100%{transform:translate(0,0)}15%{transform:translate(-5px,3px)}35%{transform:translate(4px,-2px)}55%{transform:translate(-3px,1px)}75%{transform:translate(2px,0)}}' +
      '.st-error .cs-treb{animation:cs-wob 1s ease-out .55s both}@keyframes cs-wob{0%,100%{transform:rotate(0)}25%{transform:rotate(-1.6deg)}55%{transform:rotate(1deg)}80%{transform:rotate(-.4deg)}}' +
      '.st-error .cs-fall{animation:cs-fall 1s cubic-bezier(.3,1.6,.5,1) .62s both}@keyframes cs-fall{to{transform:rotate(26deg)}}' +
      '.st-error .cs-lant{animation:cs-lant-x .8s ease-in-out .55s 3 alternate}@keyframes cs-lant-x{from{transform:rotate(-20deg)}to{transform:rotate(18deg)}}' +
      // Done: the drawbridge comes down over the moat, the portcullis lifts on a lit gate, the defenders' pennants
      // come down and the camp's banners go up, and the fires settle toward dawn.
      '.cs-bridge{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-done .cs-bridge{animation:cs-lower 1.9s ease-in-out .2s both}@keyframes cs-lower{to{transform:scaleY(-.32)}}' +
      '.st-done .cs-chu{animation:cs-hide .4s ease-out .2s both}@keyframes cs-hide{to{opacity:0}}' +
      '.cs-chd,.cs-gate,.cs-ours,.cs-dawn{opacity:0}' +
      '.st-done .cs-chd{animation:cs-show .5s ease-out 1.6s both}@keyframes cs-show{to{opacity:1}}' +
      '.cs-port{transform-box:fill-box;transform-origin:50% 0}.st-done .cs-port{animation:cs-port 1.5s ease-in-out .9s both}@keyframes cs-port{to{transform:scaleY(.1)}}' +
      '.st-done .cs-gate{animation:cs-show 1.6s ease-out 1.1s both}' +
      '.st-done .cs-theirs{animation:cs-strike 1s ease-in .2s both}@keyframes cs-strike{to{opacity:0;transform:translateY(40px)}}' +
      '.st-done .cs-ours{animation:cs-hoist 2s cubic-bezier(.3,.7,.4,1) .5s both}@keyframes cs-hoist{from{opacity:0;transform:translateY(80px)}25%{opacity:1}to{opacity:1;transform:translateY(0)}}' +
      '.st-done .cs-fire,.st-done .cs-smk{animation:cs-calm 2.8s ease-out .8s both}@keyframes cs-calm{to{opacity:.4}}' +
      '.st-done .cs-dawn{animation:cs-show 3.4s ease-out 1s both}',
    scenery:
      '<defs>' +
      '<linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070405"/><stop offset=".42" stop-color="#0f0707"/><stop offset=".6" stop-color="#1c0b08"/><stop offset=".66" stop-color="#28100b"/><stop offset="1" stop-color="#120807"/></linearGradient>' +
      '<radialGradient id="cs-haze"><stop offset="0" stop-color="#9a3a16" stop-opacity=".52"/><stop offset=".5" stop-color="#5a200e" stop-opacity=".16"/><stop offset="1" stop-color="#5a200e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-fb"><stop offset="0" stop-color="#fff0c0" stop-opacity=".95"/><stop offset=".35" stop-color="#ff9a3a" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-dawng"><stop offset="0" stop-color="#e8a050" stop-opacity=".32"/><stop offset="1" stop-color="#e8a050" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cs-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110908"/><stop offset="1" stop-color="#060303"/></linearGradient>' +
      '<linearGradient id="cs-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#201210"/><stop offset=".5" stop-color="#150c0b"/><stop offset="1" stop-color="#0d0707"/></linearGradient>' +
      '<linearGradient id="cs-round" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>' +
      '<linearGradient id="cs-fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a1a" stop-opacity=".95"/><stop offset=".45" stop-color="#ff8a2a" stop-opacity=".8"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cs-fc" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0b0" stop-opacity=".95"/><stop offset=".6" stop-color="#ffc65a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc65a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="cs-fglow"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".5"/><stop offset=".45" stop-color="#ff5a1a" stop-opacity=".18"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-hz"><stop offset="0" stop-color="#a8401a" stop-opacity=".26"/><stop offset="1" stop-color="#a8401a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-cg"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".35"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-burst"><stop offset="0" stop-color="#fff0c0" stop-opacity=".9"/><stop offset=".3" stop-color="#ffa040" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cs-gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd88a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb050" stop-opacity=".9"/></linearGradient>' +
      '<linearGradient id="cs-spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc060" stop-opacity=".38"/><stop offset="1" stop-color="#ffc060" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#cs-sky)"/>' +
      '<circle cx="170" cy="330" r="640" fill="url(#cs-haze)"/>' +
      '<ellipse class="cs-dawn" cx="260" cy="640" rx="760" ry="230" fill="url(#cs-dawng)"/>' +
      `<path d="${stars}" fill="#e8d8d0" fill-opacity=".42"/>` +
      `<g class="cs-drift cs-smk">${banks}</g>` +
      // The far hills with the besiegers' tents, their torches and a second trebuchet, lit from behind by the fires.
      '<ellipse cx="720" cy="630" rx="820" ry="80" fill="url(#cs-hz)"/>' +
      '<path d="M380 650C520 618 640 640 780 624S1040 604 1180 620S1460 600 1640 614V700H380Z" fill="#0c0706" stroke="#4a1c0e" stroke-opacity=".6" stroke-width="2"/>' +
      `<path d="${tentBodies}" fill="#140a08" stroke="#3a1a10" stroke-opacity=".5"/><path d="${tentDoors}" fill="#d0702e" fill-opacity=".32"/>` +
      `<path class="cs-wb" d="${torches}" fill="#ffa040" fill-opacity=".7"/>` +
      '<g transform="translate(1000 614) scale(1.7)" fill="#090403" stroke="#090403" stroke-width="2"><path d="M-12 0L0 -26L12 0M-6 -12H6M0 -26L22 -42M0 -26L-10 -20" fill="none"/><path d="M-14 -20h7v8h-7Z"/></g>' +
      '<rect y="650" width="1600" height="360" fill="url(#cs-gnd)"/>' +
      campfire(610, 712, -0.2) +
      campfire(800, 698, -0.5) +
      campfire(1010, 726, -0.1) +
      // The castle: the curtain wall, the round tower with its broken roof, the keep, the gatehouse.
      `<g fill="url(#cs-st)" stroke="${STONE_RIM}" stroke-opacity=".45" stroke-width="2" stroke-linejoin="round">` +
      `<path d="M-40 612V424H262V612Z${merlons(-40, 262, 424)}"/>` +
      '<path d="M-30 612V258H56V612Z"/><path d="M-42 260H68L54 222L44 232L36 204L18 150Z"/>' +
      `<path d="M92 612V172H196V612Z"/><path d="M86 172V156H202V172Z${merlons(86, 202, 156)}"/>` +
      `<path d="M262 612V336H306V612Z${merlons(262, 306, 336)}M382 612V336H426V612Z${merlons(382, 426, 336)}"/>` +
      `<path d="M306 612V386H382V612Z${merlons(306, 382, 386)}"/></g>` +
      '<path d="M44 236L60 212M38 226L48 204" stroke="#070303" stroke-width="3"/>' +
      `<path d="${courses}" stroke="#070404" stroke-opacity=".55" stroke-width="1.5"/>` +
      '<g fill="url(#cs-round)"><rect x="-30" y="258" width="86" height="354"/><rect x="262" y="336" width="44" height="276"/><rect x="382" y="336" width="44" height="276"/></g>' +
      `<g fill="#ff8a3a"><path class="cs-wa" d="${slitsA}"/><path class="cs-wb" d="${slitsB}"/></g>` +
      // The gate: a dark arch, the light inside it on done, the portcullis, the drawbridge and its chains.
      '<path d="M322 612V500A22 22 0 0 1 366 500V612Z" fill="#050303"/>' +
      '<g class="cs-gate"><path d="M322 612V500A22 22 0 0 1 366 500V612Z" fill="url(#cs-gg)"/><path d="M322 612H366L392 700H296Z" fill="url(#cs-spill)"/></g>' +
      '<path class="cs-port" d="M327 490V612M335 482V612M344 479V612M353 482V612M361 490V612M322 512H366M322 536H366M322 560H366M322 584H366" stroke="#2a2224" stroke-width="3"/>' +
      // The moat, with the fires in it.
      '<rect x="-40" y="612" width="520" height="40" fill="#0a0505"/>' +
      '<g fill="#ff7a30" fill-opacity=".22"><ellipse class="cs-rf" cx="16" cy="626" rx="44" ry="6"/><ellipse class="cs-rf" style="animation-delay:-.8s" cx="132" cy="632" rx="56" ry="7"/>' +
      '<ellipse class="cs-rf" style="animation-delay:-1.5s" cx="284" cy="628" rx="26" ry="5"/><ellipse class="cs-rf" style="animation-delay:-.4s" cx="200" cy="644" rx="34" ry="4"/></g>' +
      '<path d="M-40 652H480" stroke="#1e0f0a" stroke-width="2"/>' +
      '<path class="cs-chu" d="M326 444V492M362 444V492" stroke="#4a4042" stroke-width="2.4" stroke-dasharray="3 2"/>' +
      `<g class="cs-bridge"><rect x="320" y="492" width="48" height="120" fill="${WOOD}" stroke="#4a2e1a" stroke-width="1.5"/>` +
      `<path d="M332 492V612M344 492V612M356 492V612" stroke="#180e08" stroke-width="1.5"/><path d="M320 520H368M320 584H368" stroke="${IRON}" stroke-width="3"/></g>` +
      '<path class="cs-chd" d="M326 444L322 650M362 444L366 650" stroke="#4a4042" stroke-width="2.4" stroke-dasharray="3 2"/>' +
      '<circle cx="326" cy="444" r="3" fill="#0a0505"/><circle cx="362" cy="444" r="3" fill="#0a0505"/>' +
      // Siege ladders on the wall and a siege tower rolled up beside the gate.
      ladder(60, 84, 656, 66, 88, 414) +
      ladder(208, 234, 656, 220, 244, 414) +
      '<g fill="#0f0806" stroke="#5a2414" stroke-opacity=".35" stroke-width="1.5">' +
      `<path d="M446 652V404H506V652Z"/><path d="M440 404V390H512V404Z${merlons(440, 512, 390, 8, 9)}"/></g>` +
      '<path d="M446 470L506 530M506 470L446 530M446 562L506 622M506 562L446 622M446 470H506M446 530H506M446 562H506M446 622H506" stroke="#2a160e" stroke-width="3"/>' +
      '<path d="M446 412L428 450" stroke="#2a160e" stroke-width="5" stroke-linecap="round"/>' +
      '<g fill="#0a0504" stroke="#3a1a10" stroke-width="2"><circle cx="458" cy="652" r="11"/><circle cx="494" cy="652" r="11"/></g>' +
      // Smoke from the burning towers, then the fires: the round tower's roof, the keep's top, the gatehouse,
      // flames out of the keep's great window.
      `<g class="cs-smk">${plume(20, 140, 9, 440, -260, 12, 3)}${plume(128, 60, 9, 520, -240, 11, 5)}${plume(284, 290, 5, 300, -260, 10, 9)}</g>` +
      fire(20, 216, 6, 64, 108, 30, 21, 150) +
      fire(126, 156, 7, 76, 120, 30, 22, 170) +
      fire(284, 326, 4, 30, 62, 18, 23, 80) +
      fire(144, 222, 2, 14, 40, 14, 24, 50) +
      // Flags: the defenders' pennants now, the camp's banners on done.
      '<path d="M198 156V66M404 336V248" stroke="#2a1d16" stroke-width="3"/><g fill="#8a6a2a"><circle cx="198" cy="64" r="3"/><circle cx="404" cy="246" r="3"/></g>' +
      `<g transform="translate(198 70)"><g class="cs-theirs"><g class="cs-bn"><path d="M0 0L46 10L0 20Z" fill="${THEIRS}"/><path d="M5 10Q14 5 22 10" fill="none" stroke="#8a96b0" stroke-width="2"/></g></g></g>` +
      `<g transform="translate(404 252)"><g class="cs-theirs"><g class="cs-bn" style="animation-delay:-.7s"><path d="M0 0L40 9L0 18Z" fill="${THEIRS}"/><path d="M5 9Q12 5 19 9" fill="none" stroke="#8a96b0" stroke-width="2"/></g></g></g>` +
      `<g transform="translate(198 70)"><g class="cs-ours"><g class="cs-bn">${ourBanner(90, 60)}</g></g></g>` +
      `<g transform="translate(404 252)"><g class="cs-ours"><g class="cs-bn" style="animation-delay:-.7s">${ourBanner(76, 50)}</g></g></g>` +
      // The fireball's second leg, down from above the top edge onto the keep; where it lands, the burst, the stones it
      // knocks out, its smoke, and the fire it starts.
      `<g transform="translate(${FALL_FROM[0]} ${FALL_FROM[1]})" style="--dx:${HIT_AT[0] - FALL_FROM[0]}px;--dy:${HIT_AT[1] - FALL_FROM[1]}px">${comet('cs-fx', 'cs-fy')}</g>` +
      `<g transform="translate(${HIT_AT[0]} ${HIT_AT[1]})"><circle class="cs-imp" r="130" fill="url(#cs-burst)"/><g fill="#3a2824">${hitSmoke}</g>` +
      `<g fill="#4a3a32" stroke="#c0683a" stroke-width="1.2">${debris}</g><g fill="#ffd27a">${sparks}</g></g>` +
      `<g class="cs-nf">${fire(HIT_AT[0] + 4, HIT_AT[1] + 12, 4, 34, 72, 18, 25, 90)}</g>` +
      `<g fill="#ffb35a">${embers[0]}</g><g fill="#ff8a3a">${embers[1]}</g>` +
      // The palisade at the foot.
      `<g class="mv-b"><path d="${stakes}M-40 952H400" fill="#0a0504" stroke="#5a2410" stroke-opacity=".35" stroke-width="1.2"/></g>`,
    nook:
      '<defs><radialGradient id="cs-moon"><stop offset="0" stop-color="#e8a080" stop-opacity=".3"/><stop offset=".5" stop-color="#c06a48" stop-opacity=".1"/><stop offset="1" stop-color="#c06a48" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cs-lg"><stop offset="0" stop-color="#ffb45a" stop-opacity=".3"/><stop offset="1" stop-color="#ffb45a" stop-opacity="0"/></radialGradient></defs>' +
      // The smoky moon behind the engine's head: the A-frame, the axle and the cocked arm cross it.
      '<circle cx="296" cy="-180" r="150" fill="url(#cs-moon)"/><circle cx="296" cy="-180" r="52" fill="#e3a58a" fill-opacity=".52"/>' +
      '<path d="M318 -206a11 11 0 1 0 1 0ZM324 -160a7 7 0 1 0 1 0ZM270 -150a5 5 0 1 0 1 0Z" fill="#b8705a" fill-opacity=".4"/>' +
      '<g class="cs-rib"><ellipse cx="296" cy="-206" rx="130" ry="11" fill="#120a09" fill-opacity=".72"/></g>' +
      // The camp's ground under the engine. Its left end starts under the valance and rises behind the roof, so no edge
      // shows beside the tent when the nook rides up in wide windows.
      '<path d="M-36 104C-10 60 40 36 200 22S400 14 470 12V140H-36Z" fill="#0c0706"/>' +
      // The trebuchet.
      `<g transform="translate(${BASE[0]} ${BASE[1]}) scale(${SCALE})"><g class="cs-treb"><g transform="translate(${-BASE[0]} ${-BASE[1]})">` +
      `<g class="cs-winch"><circle cx="140" cy="-40" r="40" fill="none" stroke="#1e130c" stroke-width="7"/><path d="${spokes}" stroke="#1e130c" stroke-width="4.5"/></g><circle cx="140" cy="-40" r="7" fill="#2a2224"/>` +
      `<path d="M140 -80A40 40 0 0 1 178 -52" fill="none" stroke="${TIMBER_RIM}" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="M150 14H420V28H150Z" fill="${TIMBER}" stroke="${TIMBER_RIM}" stroke-width="2"/>` +
      `<path d="M208 18L266 -164M332 18L274 -164" stroke="#0b0604" stroke-width="11"/>` +
      `<g transform="translate(${AXLE[0]} ${AXLE[1]})">${arm(false)}</g>` +
      `<path d="M190 22L264 -172M350 22L276 -172" stroke="${TIMBER}" stroke-width="14" stroke-linecap="round"/>` +
      `<path d="M183 20L257 -172" stroke="${TIMBER_RIM}" stroke-opacity=".7" stroke-width="2.4"/><path d="M357 20L283 -172" stroke="#c08a74" stroke-opacity=".35" stroke-width="1.6"/>` +
      `<path d="M225 -70H315M203 -10H337M420 22L304 -112" stroke="${TIMBER}" stroke-width="7"/>` +
      `<circle cx="${AXLE[0]}" cy="${AXLE[1]}" r="10" fill="#2a2224" stroke="#6a5a54" stroke-width="2"/></g></g></g>` +
      // The fireball's first leg: off the sling, steeply up and away over the engine (it stays right of the chat column).
      `<g transform="translate(${f(RELEASE[0])} ${f(RELEASE[1])})" style="--dx:-70px;--dy:-260px">${comet('cs-ux', 'cs-uy')}</g>` +
      // The pavilion: back wall, pinned plans, a scroll, the lantern, the tied-back flap, the striped roof and valance,
      // and the camp's standard on its pole.
      '<g class="cs-tent">' +
      '<path d="M-36 100H470V460H-36Z" fill="#170e0b"/>' +
      '<path d="M4 100V460M84 100V460M164 100V460M244 100V460M324 100V460M404 100V460" stroke="#1f120e" stroke-width="40"/>' +
      `<g transform="translate(292 124) rotate(-2)"><path d="M0 0H112V84H0Z" fill="${PARCH}" fill-opacity=".5"/>` +
      `<path d="M10 76L24 46L38 76M24 46L46 30M24 46L14 54M82 76V52H86V48H90V52H94V48H98V52H102V76M6 81H106M16 78V84M36 78V84M56 78V84M76 78V84M96 78V84" fill="none" stroke="${INK}" stroke-width="1.6"/>` +
      '<path class="cs-trace" pathLength="1" d="M46 30Q70 2 92 46" fill="none" stroke="#9a3420" stroke-width="2"/>' +
      '<path d="M88 42L96 50M96 42L88 50" stroke="#9a3420" stroke-width="2"/>' +
      `<g fill="${GOLD}"><circle cx="4" cy="4" r="2"/><circle cx="108" cy="4" r="2"/></g></g>` +
      `<g transform="translate(-4 186)"><g class="cs-fall"><path d="M0 0H46V60H0Z" fill="${PARCH}" fill-opacity=".45"/>` +
      `<path d="M6 52V30H10V26H14V30H18V26H22V30H26V18H34V52Z" fill="none" stroke="${INK}" stroke-width="1.4"/><circle cx="3" cy="3" r="2" fill="${GOLD}"/></g></g>` +
      `<path d="M146 102H264V110H146Z" fill="${WOOD}" stroke="${WOOD_EDGE}"/>` +
      `<g transform="translate(150 110)"><g class="cs-scroll"><path d="M0 0H110V74H0Z" fill="${PARCH}" fill-opacity=".62"/>` +
      `<path d="M10 14H70M10 24H96M10 34H84M10 44H60M10 54H90" stroke="${INK}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="6 3"/>` +
      `<circle cx="88" cy="16" r="9" fill="none" stroke="#9a3420" stroke-width="1.6"/></g></g>` +
      '<g transform="translate(112 104)"><g class="cs-lant"><path d="M0 0V34" stroke="#3a3032" stroke-width="2"/><circle cy="52" r="64" fill="url(#cs-lg)"/>' +
      '<path d="M-9 34H9L11 40H-11ZM-10 40H10V62H-10ZM-11 62H11L8 67H-8Z" fill="#1a1210" stroke="#7a5a3a" stroke-width="1.4"/>' +
      '<path d="M-7 43H7V59H-7Z" fill="#ffb45a" fill-opacity=".85"/><path d="M0 46Q4 51 0 57Q-4 51 0 46Z" fill="#fff0c0"/></g></g>' +
      '<path d="M-36 100H-4Q-18 200 -36 310Z" fill="#3a1610" stroke="#5a2a1a" stroke-opacity=".5"/><path d="M-36 236Q-26 232 -20 240" fill="none" stroke="#8a6a3a" stroke-width="2"/>' +
      `<path d="${stripes[0]}" fill="#3d1711"/><path d="${stripes[1]}" fill="#2c2018"/>` +
      '<path d="M50 -24H370" stroke="#4a2418" stroke-width="3"/><circle cx="210" cy="-26" r="5" fill="#8a6a2a"/>' +
      `<path d="${scallops}" fill="#4a1a12"/><path d="M-62 84H472" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2"/>` +
      // The standard's pole: its foot stays put, its top is lashed at the valance (-22, 84) and the boulder knocks it askew.
      '<path d="M-22 84V460" stroke="#2a1a10" stroke-width="5"/>' +
      '<g transform="translate(-22 84)"><g class="cs-lean"><g transform="translate(22 -84)">' +
      '<path d="M-22 -172V90" stroke="#2a1a10" stroke-width="5"/><path d="M-32 -160H48" stroke="#2a1a10" stroke-width="4"/>' +
      `<path d="M-22 -190L-17 -174H-27Z" fill="${GOLD}" fill-opacity=".8"/>` +
      `<g transform="translate(-26 -158)"><g class="cs-gon"><path d="M0 0H70V112L52 98L35 112L18 98L0 112Z" fill="${OURS}" stroke="#5a1a10" stroke-width="1.5"/>` +
      `<path d="M14 80L35 46L56 80" fill="none" stroke="${GOLD}" stroke-width="4"/><circle cx="35" cy="28" r="9" fill="none" stroke="${GOLD}" stroke-width="3"/></g></g>` +
      '</g></g></g></g>' +
      // The boulder that drops beside the tent, drawn over it: its dust, the rock, the clods it throws.
      dust +
      boulder +
      `<g transform="translate(${THUD[0] - 4} ${THUD[1] - 8})" fill="#241810">${clods}</g>` +
      // The pigeons that carry word out.
      [0, 1]
        .map(
          i =>
            `<g transform="translate(${200 + i * 40} ${70 - i * 16})"><g class="cs-pg" style="animation-delay:${-i * 1.3}s"><g transform="scale(2.6)">` +
            '<path d="M-6 0Q0 -4 8 -1Q3 3 -6 0Z" fill="#b8aca8"/><path class="cs-wing" d="M-2 -1Q2 -12 8 -14Q6 -6 2 -1Z" fill="#cfc4c0"/></g></g></g>',
        )
        .join(''),
  }
}
