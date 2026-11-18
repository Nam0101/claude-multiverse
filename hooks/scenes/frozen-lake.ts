import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Frozen Lake: an ice fisher in a fur trapper hat at a laptop in the doorway of a wooden ice-fishing shanty, a line
// running down an augered hole under the desk. Night on a vast frozen lake: a pale moon in a milky haze, pine shores,
// a few far shanties with lit windows and tip-up flags dotted on the ice. A command booms the ice: cracks race across
// it and a huge dark shape glides beneath, lit from below. An error splits the ice by the shanty and water sloshes up;
// done tugs the line, a fish leaps out of the hole, the haze parts and the moon shows in the water.
const WOOD = '#2a2119'
const WOOD_EDGE = '#3d3024'
const FUR = '#a89a82'
const FUR_TIP = '#d2c6ae'
const FLAG = '#d8703a'
const SNOW = '#7d939f'
const EDGE = '#cfe8f4'
const WARM = '#ffb866'

/** A snowy spruce: drooping tiers down both sides, and snow along the top of each tier. */
function pine(x: number, base: number, h: number, w: number): { body: string; snow: string } {
  const n = Math.max(4, Math.round(h / 46))
  const top = base - h
  const tiers = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n

    return { y: top + h * 0.9 * t, half: (w / 2) * Math.pow(t, 0.85) }
  })
  const side = (s: number): string[] =>
    tiers.flatMap((tier, i) => {
      const out = [`${f(x + s * tier.half)} ${f(tier.y)}`]

      if (i < n - 1) out.push(`${f(x + s * tier.half * 0.36)} ${f(tier.y - 5)}`)

      return out
    })
  const trunk = Math.max(3, w * 0.05)
  const right = side(1)
  const left = side(-1).reverse()
  const body =
    `M${f(x)} ${f(top)}L${right.join('L')}L${f(x + trunk)} ${f(tiers[n - 1]!.y)}L${f(x + trunk)} ${base}` +
    `L${f(x - trunk)} ${base}L${f(x - trunk)} ${f(tiers[n - 1]!.y)}L${left.join('L')}Z`
  const snow = tiers
    .map((tier, i) => {
      const from = i === 0 ? { y: top, half: 0 } : { y: tiers[i - 1]!.y - 5, half: tiers[i - 1]!.half * 0.36 }

      return `M${f(x + from.half)} ${f(from.y + 2)}L${f(x + tier.half * 0.92)} ${f(tier.y)}M${f(x - from.half)} ${f(from.y + 2)}L${f(x - tier.half * 0.92)} ${f(tier.y)}`
    })
    .join('')

  return { body, snow }
}

function pines(list: readonly (readonly [number, number, number, number])[]): string {
  const made = list.map(([x, base, h, w]) => pine(x, base, h, w))

  return (
    `<path d="${made.map(p => p.body).join('')}" fill="#05090c"/>` +
    `<path d="${made.map(p => p.snow).join('')}" fill="none" stroke="#8aa0ab" stroke-opacity=".28" stroke-width="2.6" stroke-linecap="round"/>`
  )
}

/** The far shore: a long low row of spiky spruce tops on the horizon. */
function treeline(y: number, x0: number, x1: number, lo: number, hi: number, seed: number): string {
  const next = random(seed)
  const points: string[] = [`M${x0} ${y + 8}`]

  for (let x = x0; x < x1; ) {
    const h = lo + next() * (hi - lo)
    const step = 8 + next() * 11

    points.push(`L${f(x)} ${f(y - h * 0.22)}L${f(x + step / 2)} ${f(y - h)}`)
    x += step
  }

  points.push(`L${x1} ${y + 8}Z`)

  return points.join('')
}

/** A far shanty on the ice: a lit window and a smoking stovepipe. */
function shanty(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    '<ellipse cx="0" cy="2" rx="54" ry="6" fill="#000" fill-opacity=".35"/>' +
    `<circle class="fl-sm" style="animation-delay:${delay}s" cx="-23" cy="-94" r="8" fill="#7a8a94" fill-opacity=".35"/>` +
    '<rect x="-26" y="-90" width="7" height="26" fill="#1a1d20"/>' +
    '<rect x="-40" y="-52" width="80" height="52" fill="#130f0b"/>' +
    '<path d="M-47 -50L0 -78L47 -50Z" fill="#0c0a08"/>' +
    `<path d="M-49 -49L0 -80L49 -49L40 -47L0 -71L-40 -47Z" fill="${SNOW}" fill-opacity=".5"/>` +
    `<circle class="fl-sw" cx="14" cy="-30" r="34" fill="url(#fl-wl)"/>` +
    `<rect class="fl-sw" x="6" y="-38" width="17" height="13" fill="${WARM}" fill-opacity=".75"/>` +
    '</g>'
  )
}

/** A tip-up over a hole on the ice: its flag lies flat until a fish takes the bait. */
function tipUp(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    '<ellipse rx="10" ry="2.8" fill="#02070a"/>' +
    '<path d="M-13 1H13" stroke="#3a2e22" stroke-width="2.4"/>' +
    `<g class="fl-tu" style="--d:${f(delay)}s"><path d="M0 0V-30" stroke="#8a949a" stroke-width="1.8"/><path d="M0 -30L12 -26L0 -21Z" fill="${FLAG}"/></g>` +
    '</g>'
  )
}

/** A rugged laptop, the rod in its holder with its line down the hole under the desk, and a tip-up by the hole. */
function device(light: string, activity: Activity): string {
  const done = activity === 'done'
  const rod = done ? 'fl-tug' : activity === 'run' ? 'fl-shk' : activity === 'thinking' || activity === 'tool' ? 'fl-jig' : ''
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    // The hole, its snow rim and the black water; the moon shows in it once a fish is in.
    '<ellipse cx="372" cy="449" rx="41" ry="10" fill="#34454e"/><ellipse cx="372" cy="448" rx="32" ry="7" fill="#02070a"/>' +
    '<ellipse cx="364" cy="447" rx="14" ry="2.2" fill="#1d3a48" fill-opacity=".8"/>' +
    (done
      ? '<g class="fl-mr"><ellipse cx="378" cy="448" rx="28" ry="6" fill="#e8f0f2" fill-opacity=".22"/><ellipse cx="378" cy="448" rx="13" ry="4" fill="#eef4f6"/></g>'
      : '') +
    // The tip-up beside it.
    '<path d="M300 452H336" stroke="#4a3a28" stroke-width="3" stroke-linecap="round"/>' +
    `<g transform="translate(318 451)"><g ${done ? 'class="fl-pop"' : 'transform="rotate(-80)"'}>` +
    `<path d="M0 0V-42" stroke="#9aa4aa" stroke-width="2"/><path d="M0 -42L15 -37L0 -31Z" fill="${FLAG}"/></g></g>` +
    // The laptop, its rubber corners and the screen facing Claude.
    '<rect x="244" y="322" width="96" height="8" rx="2" fill="#2b353c"/>' +
    keys +
    '<path d="M334 328L356 242L367 245L345 330Z" fill="#2b353c"/>' +
    `<path d="M337 325L357 248L361 249L341 327Z" fill="${light}"/>` +
    `<path d="M337 325L357 248L346 251L326 325Z" fill="${light}" fill-opacity=".16"/>` +
    '<path d="M354 239L369 243L367 252L352 248ZM331 321L346 325L345 331L330 330Z" fill="#161c20"/>' +
    // The rod in its holder; the line goes down to the hole.
    '<rect x="396" y="314" width="14" height="16" rx="2" fill="#1d2328"/>' +
    `<g transform="translate(403 318)"><g${rod === '' ? '' : ` class="${rod}"`}>` +
    '<path d="M-33 -58L-31 130" stroke="#d6e6ee" stroke-opacity=".6" stroke-width="1.1"/>' +
    '<path d="M0 0L-33 -58" stroke="#4a3e30" stroke-width="3.2" stroke-linecap="round"/>' +
    '<path d="M0 0L-8 -14" stroke="#8a6a44" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="-4" cy="-6" r="4.6" fill="#6a747c"/><circle cx="-33" cy="-58" r="2.2" fill="#e07a3a"/>' +
    '</g></g>'
  )
}

export function frozenLakeWorld(): World {
  const next = random(23)
  const stars = Array.from({ length: 36 }, (_, i) => {
    const tw = i % 5 === 0

    return `<circle${tw ? ` class="fl-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${f(next() * 1600)}" cy="${f(next() * 400)}" r="${f(0.6 + next())}" fill="#dfe9ee" fill-opacity="${f(0.14 + next() * 0.3)}"/>`
  }).join('')
  const clearStars = Array.from({ length: 24 }, () => `<circle cx="${f(next() * 1600)}" cy="${f(next() * 380)}" r="${f(0.7 + next() * 0.9)}" fill="#eef4f7" fill-opacity="${f(0.3 + next() * 0.4)}"/>`).join('')
  const streaks = Array.from({ length: 24 }, () => {
    const y = 500 + Math.pow(next(), 1.2) * 480
    const k = (y - 470) / 530
    const x = next() * 1700 - 50

    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(50 + k * 240 * (0.5 + next()))}" ry="${f(1 + k * 4)}"/>`
  }).join('')
  const shimmer = Array.from({ length: 16 }, (_, i) => {
    const y = 486 + Math.pow(i / 15, 1.25) * 470
    const k = (y - 470) / 530

    return `<ellipse cx="${f(322 + (next() - 0.5) * 30 * k)}" cy="${f(y)}" rx="${f(14 + k * 150 * (0.6 + next() * 0.5))}" ry="${f(1.2 + k * 3.5)}" fill-opacity="${f(0.26 - k * 0.17)}"/>`
  }).join('')
  const glints = Array.from({ length: 14 }, (_, i) => {
    const x = 20 + next() * 390
    const y = 590 + next() * 380
    const r = 3 + next() * 3

    return (
      `<path class="fl-gl" style="animation-delay:${f(-i * 0.37 - next())}s" d="M${f(x)} ${f(y - r)}L${f(x + 1)} ${f(y - 1)}L${f(x + r)} ${f(y)}` +
      `L${f(x + 1)} ${f(y + 1)}L${f(x)} ${f(y + r)}L${f(x - 1)} ${f(y + 1)}L${f(x - r)} ${f(y)}L${f(x - 1)} ${f(y - 1)}Z"/>`
    )
  }).join('')
  const wisps = Array.from({ length: 10 }, () => {
    const x = next() * 1600
    const y = 580 + next() * 400
    const len = 90 + next() * 160

    return `<path d="M${f(x)} ${f(y)}q${f(len * 0.3)} -3 ${f(len * 0.6)} 0t${f(len * 0.4)} 0" stroke-width="${f(1.5 + next() * 2)}"/>`
  }).join('')

  // The boom: a long crack racing across the ice toward the shanty, with branches off it.
  const main: [number, number][] = []

  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16

    main.push([-10 + t * 1190, 772 + t * 120 + (i % 2 === 0 ? -1 : 1) * (6 + next() * 14)])
  }

  const crack = (pts: readonly (readonly [number, number])[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`
  const branches = [2, 5, 8, 11, 13].map((at, j) => {
    const [bx, by] = main[at]!
    const up = j % 2 === 0 ? -1 : 1
    const pts: [number, number][] = [[bx, by]]

    for (let k = 1; k <= 4; k += 1) pts.push([bx + k * (22 + next() * 18) * (j === 4 ? -1 : 1), by + up * k * (14 + next() * 12)])

    return { d: crack(pts), delay: 0.15 + (at / 16) * 0.8 }
  })
  const runCracks =
    `<path class="fl-rc" pathLength="1" d="${crack(main)}" stroke="#7fc4e6" stroke-opacity=".22" stroke-width="7"/>` +
    `<path class="fl-rc" pathLength="1" d="${crack(main)}" stroke="${EDGE}" stroke-opacity=".8" stroke-width="1.8"/>` +
    branches.map(b => `<path class="fl-rc" pathLength="1" style="animation-delay:${f(b.delay)}s" d="${b.d}" stroke="${EDGE}" stroke-opacity=".6" stroke-width="1.3"/>`).join('')

  // The split by the shanty on an error: a jagged line across the floor, the black gap, the water sloshing out.
  const split: [number, number][] = []

  for (let x = -220; x <= 480; x += 35) split.push([x, 424 + (split.length % 2 === 0 ? -1 : 1) * (3 + next() * 5)])

  const gap = `M${split.map(([x, y]) => `${x} ${f(y - 3)}`).join('L')}L${[...split].reverse().map(([x, y]) => `${x} ${f(y + 5)}`).join('L')}Z`
  const slosh = (heights: readonly number[], delay: number, fill: string, foam: number) => {
    const xs = heights.map((_, i) => -120 + (i * 600) / (heights.length - 1))
    const top = xs.map((x, i) => [x, 426 - heights[i]!] as const)
    const edge = top
      .slice(1)
      .map(([x, y], i) => `Q${f((x + top[i]![0]) / 2)} ${f(Math.min(y, top[i]![1]) - 26)} ${f(x)} ${f(y)}`)
      .join('')
    const start = `M${f(top[0]![0])} ${f(top[0]![1])}`

    return (
      `<g class="fl-sl" style="animation-delay:${f(delay)}s"><path d="${start}${edge}V430H${f(top[0]![0])}Z" fill="${fill}"/>` +
      `<path d="${start}${edge}" fill="none" stroke="#a6d4e8" stroke-opacity="${foam}" stroke-width="3" stroke-linecap="round"/></g>`
    )
  }
  const drop = (x: number, y: number, dx: number, dy: number, d: number, r: number, cls: string) =>
    `<circle class="${cls}" style="--dx:${dx}px;--dy:${dy}px;--d:${f(d)}s" cx="${x}" cy="${y}" r="${r}" fill="${EDGE}" fill-opacity=".85"/>`
  const hutPlanks = Array.from({ length: 16 }, (_, i) => `M${18 + i * 27} -92V404`).join('')
  const icicles = [-6, 8, 21, 36, 52, 66, 396, 410, 424, 440, 456]
    .map(x => `M${x} -73h6l-3 ${f(9 + next() * 12)}Z`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#04080b',
      furniture: WOOD,
      metal: '#2b353c',
      paper: '#e4ecef',
      light: { idle: '#4a90b8', work: '#86c4e6', bright: '#d2ecfa' },
      headTop: 200,
      glowAt: [348, 284],
      device,
      wear: {
        // A trapper hat: a plaid crown, its fur brim turned up above the eyes and the fur flaps down the cheeks, clear
        // of every place the eyes go.
        front:
          '<circle cx="150" cy="188" r="7" fill="#d2c6ae"/>' +
          '<path d="M74 234C74 200 108 190 150 190C192 190 226 200 226 234Z" fill="#7a2e28"/>' +
          '<path d="M96 234V202H110V234ZM142 234V193H158V234ZM190 234V202H204V234ZM80 210H220V220H78Z" fill="#000" fill-opacity=".42"/>' +
          '<path d="M103 200V232M150 192V232M197 200V232M78 215H222" stroke="#c25a4a" stroke-opacity=".5" stroke-width="1.4"/>' +
          `<path d="M66 252C64 236 76 228 150 228C224 228 236 236 234 252Z" fill="${FUR}"/>` +
          `<path d="M74 241Q150 232 226 241" fill="none" stroke="${FUR_TIP}" stroke-opacity=".75" stroke-width="9" stroke-linecap="round" stroke-dasharray="0 9"/>` +
          '<path d="M68 251H232" stroke="#5e5444" stroke-width="2"/>' +
          `<g class="fl-flap"><path d="M68 246H90V292Q79 309 68 292Z" fill="${FUR}"/><path d="M73 256V292M85 256V292" stroke="${FUR_TIP}" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 9"/>` +
          '<path d="M79 304Q76 318 80 330" fill="none" stroke="#5e5444" stroke-width="2"/><circle cx="80" cy="332" r="3.6" fill="#5e5444"/></g>' +
          `<g class="fl-flap" style="animation-delay:-1.3s"><path d="M210 246H232V292Q221 309 210 292Z" fill="${FUR}"/><path d="M215 256V292M227 256V292" stroke="${FUR_TIP}" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 9"/>` +
          '<path d="M221 304Q224 318 220 330" fill="none" stroke="#5e5444" stroke-width="2"/><circle cx="220" cy="332" r="3.6" fill="#5e5444"/></g>',
      },
      // An upturned bucket with a foam pad: the ice fisher's seat.
      seatArt:
        '<ellipse cx="151" cy="456" rx="54" ry="5" fill="#000" fill-opacity=".35"/>' +
        '<path d="M114 352H188L196 450H106Z" fill="#3f4e57"/>' +
        '<path d="M121 354H129L122 448H113Z" fill="#fff" fill-opacity=".07"/>' +
        '<path d="M112 372H190M111 380H191" stroke="#2c3940" stroke-width="2"/>' +
        '<rect x="102" y="442" width="98" height="11" rx="3" fill="#35434b"/>' +
        '<path d="M108 430Q151 462 194 430" fill="none" stroke="#6a767e" stroke-width="2.4"/>' +
        '<rect x="108" y="344" width="86" height="10" rx="5" fill="#34402c"/>',
      // A weathered plank on two crossed trestles, snow on its far end.
      tableArt:
        `<path d="M216 342L238 452M238 342L216 452M426 342L448 452M448 342L426 452" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>` +
        '<g fill="#4a3a28"><circle cx="227" cy="397" r="3"/><circle cx="437" cy="397" r="3"/></g>' +
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M172 337H464" stroke="#17120d" stroke-width="1.4"/>' +
        `<path d="M392 331Q408 321 428 326Q446 319 470 327V331Z" fill="${SNOW}" fill-opacity=".6"/>` +
        '<g fill="#34454e"><ellipse cx="227" cy="455" rx="20" ry="4"/><ellipse cx="437" cy="455" rx="20" ry="4"/></g>',
    },
    style:
      '@keyframes fl-in{to{opacity:1}}' +
      '@keyframes fl-draw{to{stroke-dashoffset:0}}' +
      // The sky: veils of milky haze drift over the moon; done parts them.
      '.fl-veil{animation:fl-veil 46s ease-in-out infinite alternate}.fl-veil2{animation-duration:38s;animation-direction:alternate-reverse}' +
      '@keyframes fl-veil{from{transform:translateX(-40px)}to{transform:translateX(50px)}}' +
      '.st-done .fl-veil{animation:fl-part 3s ease-out .2s both}.st-done .fl-veil2{animation-name:fl-part2}' +
      '@keyframes fl-part{to{transform:translateX(-300px);opacity:.15}}@keyframes fl-part2{to{transform:translateX(300px);opacity:.15}}' +
      '.fl-halo{animation:fl-halo 9s ease-in-out infinite alternate}@keyframes fl-halo{from{opacity:.7}to{opacity:1}}' +
      '.fl-moon{opacity:.82}.st-done .fl-moon{animation:fl-in 2.4s ease-out .4s both}' +
      '.fl-mg,.fl-clear{opacity:0}.fl-mpath{opacity:.6}.st-done .fl-mg{animation:fl-in 2.4s ease-out .5s both}' +
      '.st-done .fl-mpath{animation:fl-in 2.6s ease-out .8s both}.st-done .fl-clear{animation:fl-in 2.4s ease-out .6s both}' +
      '.fl-tw{animation:fl-tw 3.4s ease-in-out infinite alternate}@keyframes fl-tw{to{opacity:.2}}' +
      '.fl-fog{animation:fl-fog 40s ease-in-out infinite alternate}@keyframes fl-fog{from{transform:translateX(60px)}to{transform:translateX(-90px)}}' +
      // Smoke from the stovepipes; the far shanties' windows; glints and blowing snow on the ice.
      '.fl-sm{transform-box:fill-box;transform-origin:center;opacity:0;animation:fl-sm 6s ease-out infinite}' +
      '@keyframes fl-sm{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.6}100%{opacity:0;transform:translate(-34px,-96px) scale(2.6)}}' +
      '.st-tool .fl-sm,.st-responding .fl-sm{animation-duration:3.4s}' +
      '.fl-sw{opacity:.6}.helper .fl-sw{opacity:1}' +
      '.fl-win{animation:fl-win 3.6s ease-in-out infinite alternate}@keyframes fl-win{from{opacity:.75}to{opacity:1}}' +
      '.fl-gl{opacity:0;animation:fl-gl 5s ease-in-out infinite}@keyframes fl-gl{0%,70%,100%{opacity:0}82%{opacity:.85}}' +
      '.fl-wind{animation:fl-wind 34s linear infinite}@keyframes fl-wind{to{transform:translateX(-1600px)}}' +
      // The hat's flaps sway.
      '.fl-flap{transform-box:fill-box;transform-origin:50% 0;animation:fl-flap 3.4s ease-in-out infinite alternate}' +
      '@keyframes fl-flap{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .fl-flap{animation-duration:.4s}' +
      // The rod: it jigs while Claude thinks, shivers when the ice booms, and bends to the fish when done.
      '.fl-jig{animation:fl-jig 1.8s ease-in-out infinite}@keyframes fl-jig{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-4deg)}82%{transform:rotate(1deg)}}' +
      '.fl-shk{animation:fl-shk .3s ease-in-out infinite alternate}@keyframes fl-shk{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}' +
      '.fl-tug{animation:fl-tug 1.6s ease-in-out both}' +
      '@keyframes fl-tug{0%,100%{transform:rotate(0)}10%{transform:rotate(-10deg)}20%{transform:rotate(-2deg)}30%{transform:rotate(-12deg)}48%{transform:rotate(0)}}' +
      // Tip-up flags spring up across the lake when done, one after another.
      '.fl-tu{transform:rotate(-78deg)}.st-done .fl-tu{animation:fl-tup .6s cubic-bezier(.3,1.7,.5,1) both;animation-delay:var(--d)}' +
      '@keyframes fl-tup{from{transform:rotate(-78deg)}to{transform:rotate(0)}}' +
      '.fl-pop{animation:fl-tup .6s cubic-bezier(.3,1.7,.5,1) .15s both}' +
      // Run: the ice booms. Cracks race to the shanty, the ice lights from below and a huge shape glides under it.
      '.fl-rc{stroke-dasharray:1;stroke-dashoffset:1}.st-run .fl-rc{animation:fl-draw 1s ease-out .05s both}' +
      '.fl-ug{opacity:0}.st-run .fl-ug{animation:fl-ug 6s ease-in-out .15s both}@keyframes fl-ug{0%{opacity:0}12%{opacity:1}75%{opacity:.85}100%{opacity:.35}}' +
      '.fl-bx{opacity:0}.st-run .fl-bx{animation:fl-bx 6s cubic-bezier(.3,.2,.6,1) both}' +
      '@keyframes fl-bx{0%{opacity:0;transform:translateX(0)}10%{opacity:.95}85%{opacity:.95}100%{opacity:.7;transform:translateX(700px)}}' +
      '.fl-bw{animation:fl-bw 2.4s ease-in-out infinite alternate}@keyframes fl-bw{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
      '.st-run .fl-hut{animation:fl-shud .3s ease-in-out .2s 3}@keyframes fl-shud{0%,100%{transform:translateX(0)}30%{transform:translateX(-3px)}70%{transform:translateX(3px)}}' +
      '.fl-sd{opacity:0}.st-run .fl-sd,.st-error .fl-sd{animation:fl-sd 1.6s ease-in both;animation-delay:var(--d)}' +
      '@keyframes fl-sd{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(130px)}}' +
      // Error: the ice splits by the shanty, it lurches, and water sloshes up out of the split and the hole.
      '.fl-ec{stroke-dasharray:1;stroke-dashoffset:1}.st-error .fl-ec{animation:fl-draw .8s ease-out .05s both}' +
      '.fl-gap{transform-box:fill-box;transform-origin:center;transform:scaleY(0)}.st-error .fl-gap{animation:fl-gap .5s ease-out .1s both}@keyframes fl-gap{to{transform:scaleY(1)}}' +
      '.fl-sl{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}.st-error .fl-sl{animation:fl-sl 2s ease-in-out .1s infinite}' +
      '@keyframes fl-sl{0%,100%{transform:scaleY(.04)}25%{transform:scaleY(1)}50%{transform:scaleY(.35)}75%{transform:scaleY(.8)}}' +
      '.fl-dr{opacity:0}.st-error .fl-dr{animation:fl-dr 1.3s infinite;animation-delay:var(--d)}.st-done .fl-fd{animation:fl-dr 1.1s both;animation-delay:var(--d)}' +
      '@keyframes fl-dr{0%{opacity:0;transform:translate(0,0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}10%{opacity:.9}' +
      '50%{transform:translate(calc(var(--dx) * .6),var(--dy));animation-timing-function:cubic-bezier(.6,0,.8,.4)}100%{opacity:0;transform:translate(var(--dx),24px)}}' +
      '.fl-fd{opacity:0}' +
      '.st-error .fl-hut{animation:fl-lurch 1.6s ease-out both}' +
      '@keyframes fl-lurch{0%{transform:rotate(0)}18%{transform:rotate(-1.8deg)}40%{transform:rotate(-.6deg)}60%{transform:rotate(-1.3deg)}100%{transform:rotate(-1deg)}}' +
      // Done: the line tugs, a fish leaps out of the hole and drops back, rings spread and the moon shows in the water.
      '.fl-fy{opacity:0}.st-done .fl-fy{animation:fl-fy 1.5s .3s both}' +
      '@keyframes fl-fy{0%{opacity:0;transform:translate(0,0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}6%{opacity:1}' +
      '50%{transform:translate(-14px,-250px);animation-timing-function:cubic-bezier(.6,0,.8,.4)}94%{opacity:1}100%{opacity:0;transform:translate(-26px,6px)}}' +
      '.st-done .fl-fr{animation:fl-fr 1.5s linear .3s both}' +
      '@keyframes fl-fr{0%{transform:rotate(-80deg)}40%{transform:rotate(-30deg)}50%{transform:rotate(0)}60%{transform:rotate(30deg)}100%{transform:rotate(86deg)}}' +
      '.fl-rp{transform-box:fill-box;transform-origin:center;opacity:0}.st-done .fl-rp{animation:fl-rp 1.6s ease-out both;animation-delay:var(--d)}' +
      '@keyframes fl-rp{0%{opacity:0;transform:scale(.3)}15%{opacity:.85}100%{opacity:0;transform:scale(1.3)}}' +
      '.fl-mr{opacity:0;animation:fl-in 1s ease-out 1.8s both}',
    scenery:
      '<defs>' +
      '<linearGradient id="fl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070a"/><stop offset=".28" stop-color="#070c10"/>' +
      '<stop offset=".42" stop-color="#0f171d"/><stop offset=".475" stop-color="#1a252c"/><stop offset=".49" stop-color="#131d23"/>' +
      '<stop offset=".62" stop-color="#0f181e"/><stop offset="1" stop-color="#090e12"/></linearGradient>' +
      '<radialGradient id="fl-mk"><stop offset="0" stop-color="#9fb2bc" stop-opacity=".1"/><stop offset=".5" stop-color="#9fb2bc" stop-opacity=".035"/><stop offset="1" stop-color="#9fb2bc" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fl-mh"><stop offset="0" stop-color="#dbe6ea" stop-opacity=".3"/><stop offset=".35" stop-color="#cfdde4" stop-opacity=".1"/><stop offset="1" stop-color="#cfdde4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fl-mp"><stop offset="0" stop-color="#cfe0e8" stop-opacity=".1"/><stop offset="1" stop-color="#cfe0e8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="fl-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb2bc" stop-opacity="0"/><stop offset=".5" stop-color="#9fb2bc" stop-opacity=".13"/><stop offset="1" stop-color="#9fb2bc" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="fl-ug"><stop offset="0" stop-color="#63b9e0" stop-opacity=".34"/><stop offset=".5" stop-color="#4a90b8" stop-opacity=".18"/><stop offset="1" stop-color="#4a90b8" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="fl-wl"><stop offset="0" stop-color="${WARM}" stop-opacity=".42"/><stop offset="1" stop-color="${WARM}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#fl-sky)"/>' +
      stars +
      `<g class="fl-clear">${clearStars}</g>` +
      // Milky haze across the top of the sky.
      '<g class="fl-veil fl-veil2" fill="#4a5a64"><ellipse cx="820" cy="90" rx="620" ry="60" fill-opacity=".06"/><ellipse cx="1320" cy="210" rx="420" ry="46" fill-opacity=".06"/></g>' +
      // The moon in its hazy ring.
      '<circle cx="320" cy="160" r="520" fill="url(#fl-mk)"/>' +
      '<circle class="fl-halo" cx="320" cy="160" r="240" fill="url(#fl-mh)"/>' +
      '<circle cx="320" cy="160" r="150" fill="none" stroke="#c9d8df" stroke-opacity=".07" stroke-width="14"/>' +
      '<circle class="fl-mg" cx="320" cy="160" r="120" fill="url(#fl-mh)"/>' +
      '<g class="fl-moon"><circle cx="320" cy="160" r="40" fill="#e8eef0"/><path d="M302 146a9 7 0 1 0 1 0ZM330 172a12 8 0 1 0 1 0ZM334 140a6 5 0 1 0 1 0Z" fill="#b9c5cb" fill-opacity=".45"/></g>' +
      '<g class="fl-veil" fill="#8a9ba5"><ellipse cx="300" cy="150" rx="230" ry="20" fill-opacity=".16"/><ellipse cx="380" cy="186" rx="190" ry="14" fill-opacity=".12"/></g>' +
      '<g class="fl-veil fl-veil2" fill="#8a9ba5"><ellipse cx="250" cy="196" rx="200" ry="16" fill-opacity=".1"/><ellipse cx="330" cy="126" rx="160" ry="12" fill-opacity=".12"/></g>' +
      // The far shore under the horizon fog.
      `<path d="${treeline(476, -20, 1620, 8, 30, 5)}" fill="#0b1216"/>` +
      '<rect class="fl-fog" x="-200" y="418" width="2000" height="120" fill="url(#fl-fg)"/>' +
      // The ice: the moon's path, lit from below on a run with the huge shape gliding through it, drifts and cracks.
      '<ellipse cx="322" cy="730" rx="150" ry="260" fill="url(#fl-mp)"/>' +
      `<g class="fl-mpath" fill="#cfe0e8">${shimmer}</g>` +
      '<ellipse class="fl-ug" cx="330" cy="805" rx="470" ry="150" fill="url(#fl-ug)"/>' +
      '<g transform="translate(220 805)"><g class="fl-bx"><g class="fl-bw"><g transform="scale(1 .42)">' +
      '<path d="M0 0C-10 -40 -80 -95 -200 -100C-320 -104 -430 -70 -520 -26L-600 -84L-584 0L-600 84L-520 26C-430 70 -320 104 -200 100C-80 95 -10 40 0 0Z' +
      'M-130 -88L-230 -176L-250 -94ZM-130 88L-230 176L-250 94ZM-360 -84L-420 -140L-440 -72ZM-360 84L-420 140L-440 72Z" fill="#010406" fill-opacity=".92" stroke="#8fd0ec" stroke-opacity=".12" stroke-width="8"/>' +
      '<g fill="#bfe6f4" fill-opacity=".5"><circle cx="-46" cy="-34" r="6"/><circle cx="-46" cy="34" r="6"/></g></g></g></g></g>' +
      `<g fill="#2a3b45" fill-opacity=".35">${streaks}</g>` +
      '<path d="M40 700L120 690L170 720L260 706M120 690L140 652M560 640L640 660L720 648M930 700L1010 690L1080 716M300 870L420 846L520 874M1040 860L1120 884M60 930L160 912L230 940" fill="none" stroke="#6f8a98" stroke-opacity=".16" stroke-width="1.2"/>' +
      `<g fill="none" stroke-linejoin="round">${runCracks}</g>` +
      // The near shore on the left: a snowy spit and big spruce.
      '<path d="M-40 430C60 440 170 470 240 512C262 526 250 540 220 546C150 556 60 568 -40 590Z" fill="#1a262d"/>' +
      '<path d="M-40 430C60 440 170 470 240 512" fill="none" stroke="#5f7682" stroke-opacity=".3" stroke-width="2.4"/>' +
      pines([
        [-20, 580, 430, 170],
        [60, 556, 330, 128],
        [128, 534, 250, 98],
        [186, 524, 180, 72],
        [232, 530, 110, 46],
      ]) +
      `<g class="mv-r">${pines([
        [1380, 560, 260, 96],
        [1450, 570, 360, 124],
        [1530, 584, 420, 144],
        [1610, 572, 380, 130],
      ])}</g>` +
      `<g fill="#e6f2f8">${glints}</g>` +
      shanty(80, 662, 0.75, 0) +
      shanty(250, 616, 0.55, -2) +
      shanty(374, 590, 0.42, -4) +
      tipUp(36, 776, 1.1, 0.3) +
      tipUp(176, 722, 0.9, 0.55) +
      tipUp(322, 762, 1, 0.8) +
      tipUp(110, 884, 1.25, 1.05) +
      tipUp(398, 688, 0.75, 1.3) +
      tipUp(276, 950, 1.35, 1.55) +
      // The split that runs off across the lake from the shanty on an error.
      '<g class="mv-b"><path class="fl-ec" pathLength="1" d="M1196 938L1120 926L1060 934L980 912L900 918L820 896L740 902L660 880L580 884L500 862L420 868L340 846L260 850L180 830L100 834L20 816" fill="none" stroke="#020507" stroke-width="4"/>' +
      '<path class="fl-ec" pathLength="1" d="M1196 935L1120 923L1060 931L980 909L900 915L820 893L740 899L660 877L580 881L500 859L420 865L340 843L260 847L180 827L100 831L20 813" fill="none" stroke="#b8dcec" stroke-opacity=".55" stroke-width="1.4"/></g>' +
      `<g class="fl-wind" fill="none" stroke="#a9bcc6" stroke-opacity=".1" stroke-linecap="round">${wisps}<g transform="translate(1600 0)">${wisps}</g></g>`,
    nook:
      '<defs><radialGradient id="fl-door" cx=".5" cy=".72" r=".75"><stop offset="0" stop-color="#4a2a14"/><stop offset=".55" stop-color="#22140b"/><stop offset="1" stop-color="#0b0806"/></radialGradient></defs>' +
      '<g transform="translate(228 404)"><g class="fl-hut"><g transform="translate(-228 -404)">' +
      // The stovepipe and its smoke, the walls, the roof under snow and its icicles.
      [0, -1.5, -3, -4.5].map(d => `<circle class="fl-sm" style="animation-delay:${d}s" cx="363" cy="-252" r="10" fill="#7a8a94" fill-opacity=".3"/>`).join('') +
      '<rect x="356" y="-236" width="14" height="112" fill="#1c2023"/><path d="M348 -236H378L372 -246H354Z" fill="#141719"/>' +
      '<rect x="14" y="-94" width="440" height="498" fill="#1a140f"/>' +
      `<path d="${hutPlanks}" stroke="#110d0a" stroke-width="2"/>` +
      '<path d="M-14 -86L228 -186L470 -86V-72L228 -170L-14 -72Z" fill="#0f0c0a"/>' +
      `<path d="M-22 -84L228 -196L478 -84C470 -74 456 -72 446 -80C436 -72 420 -74 412 -84L228 -174L44 -84C34 -72 18 -74 10 -80C2 -72 -14 -74 -22 -84Z" fill="${SNOW}" fill-opacity=".55"/>` +
      `<path d="${icicles}" fill="#a9c3d0" fill-opacity=".5"/>` +
      // The lit window, frosted at its corners, and a pair of snowshoes under it.
      '<circle class="fl-win" cx="342" cy="-12" r="110" fill="url(#fl-wl)"/>' +
      '<rect x="300" y="-52" width="84" height="80" fill="#2a1a0c"/>' +
      `<rect class="fl-win" x="304" y="-48" width="76" height="72" fill="${WARM}" fill-opacity=".6"/>` +
      '<path d="M342 -48V24M304 -12H380" stroke="#2a2018" stroke-width="5"/><rect x="300" y="-52" width="84" height="80" fill="none" stroke="#33281d" stroke-width="6"/>' +
      '<path d="M304 24V6Q318 18 330 24ZM380 24V10Q370 20 360 24ZM304 -48V-34Q312 -44 322 -48Z" fill="#dfeef6" fill-opacity=".35"/>' +
      `<path d="M294 30H390V34Q342 41 294 34Z" fill="${SNOW}" fill-opacity=".6"/>` +
      '<path d="M392 66C408 68 410 130 396 196C382 130 378 68 392 66ZM412 74C428 76 430 138 416 204C402 138 398 76 412 74Z" fill="#17110c" stroke="#5a4430" stroke-width="3.4"/>' +
      '<path d="M384 96H400M384 116H402M386 136H400M404 104H420M404 124H422M406 144H420M392 70V190M412 78V198" stroke="#3d3024" stroke-width="1.4"/>' +
      // The doorway, warm inside, its frame under snow, and the plank door swung open.
      '<rect x="44" y="92" width="232" height="312" fill="url(#fl-door)"/>' +
      '<path d="M40 404V88H280V404" fill="none" stroke="#33281d" stroke-width="8"/>' +
      `<path d="M32 86H288V82Q160 72 32 82Z" fill="${SNOW}" fill-opacity=".55"/>` +
      '<path d="M36 88L-52 110V404H36Z" fill="#221a12" stroke="#33281d" stroke-width="3"/>' +
      '<path d="M14 94V404M-8 99V404M-30 104V404" stroke="#16110c" stroke-width="2"/>' +
      '<path d="M-48 146L32 126M-48 376H32M-48 376L32 126" stroke="#33281d" stroke-width="4"/><circle cx="-40" cy="262" r="4" fill="#6a5a48"/>' +
      // Snow drifted against the walls.
      '<path d="M-90 410Q-60 392 -30 402Q0 390 40 404Q160 398 280 404Q330 392 380 402Q420 390 470 400V414H-90Z" fill="#2c3c45"/>' +
      '<path d="M-90 410Q-60 392 -30 402Q0 390 40 404M280 404Q330 392 380 402Q420 390 470 400" fill="none" stroke="#6d8592" stroke-opacity=".35" stroke-width="2"/>' +
      // Snow shaken off the eaves when the ice booms.
      [-4, 18, 40, 60, 400, 420, 444, 462]
        .map((x, i) => `<circle class="fl-sd" style="--d:${f(0.2 + (i % 4) * 0.12)}s" cx="${x}" cy="${-70 + (i % 3) * 6}" r="${2.5 + (i % 2)}" fill="#dfeef6"/>`)
        .join('') +
      '</g></g></g>' +
      // The split in the ice in front of the shanty and the water sloshing out of it.
      `<path class="fl-gap" d="${gap}" fill="#020608"/>` +
      `<path class="fl-ec" pathLength="1" d="M${split.map(([x, y]) => `${x} ${f(y - 3)}`).join('L')}" fill="none" stroke="${EDGE}" stroke-opacity=".7" stroke-width="2"/>` +
      slosh([6, 70, 60, 110, 70, 104, 64, 120, 76, 100, 58, 112, 84, 70, 96, 8], 0.5, '#123848', 0.35) +
      slosh([4, 50, 90, 44, 80, 56, 96, 48, 70, 92, 52, 84, 46, 96, 62, 6], 0, '#1d4c62', 0.6),
    front:
      // Error: water gushes up out of the hole and spray flies.
      `<g class="fl-sl" style="animation-delay:.12s"><path d="M342 448C342 410 354 376 372 370C390 376 402 410 402 448Z" fill="#1d4c62" fill-opacity=".92"/>` +
      '<path d="M350 404C356 386 364 374 372 372C380 374 388 386 394 404" fill="none" stroke="#a6d4e8" stroke-opacity=".65" stroke-width="2.6"/>' +
      '<path d="M358 376L350 352L364 372ZM372 370L372 342L378 368ZM386 376L398 354L390 378Z" fill="#a6d4e8" fill-opacity=".7"/></g>' +
      drop(372, 420, -40, -150, 0.2, 4, 'fl-dr') +
      drop(372, 420, 30, -170, 0.35, 3.5, 'fl-dr') +
      drop(372, 430, -70, -110, 0.6, 3, 'fl-dr') +
      drop(-90, 410, -40, -160, 0.25, 4, 'fl-dr') +
      drop(-60, 410, 30, -130, 0.5, 3.5, 'fl-dr') +
      drop(444, 400, 20, -170, 0.3, 4, 'fl-dr') +
      drop(272, 400, -30, -140, 0.45, 3.5, 'fl-dr') +
      // Done: the fish leaps out of the hole and drops back in; rings spread on the water.
      '<g transform="translate(372 446)"><g class="fl-fy"><g class="fl-fr"><g transform="scale(1.6)">' +
      '<path d="M30 0C18 -11 -8 -12 -22 -4L-34 -13L-31 0L-34 13L-22 4C-8 12 18 11 30 0Z" fill="#b9ccd6"/>' +
      '<path d="M30 0C18 -11 -8 -12 -22 -4V-1C-6 -6 16 -6 30 0Z" fill="#5f7a88"/><path d="M-4 -9L6 -17L11 -8Z" fill="#7f97a4"/>' +
      '<circle cx="20" cy="-2" r="2" fill="#0a1216"/><path d="M5 -6Q9 0 5 6" fill="none" stroke="#e8f2f6" stroke-opacity=".6" stroke-width="1.4"/>' +
      '</g></g></g></g>' +
      drop(372, 444, -46, -90, 0.3, 3.5, 'fl-fd') +
      drop(372, 444, 40, -100, 0.32, 3, 'fl-fd') +
      drop(372, 444, -10, -130, 0.35, 3, 'fl-fd') +
      drop(346, 446, -50, -70, 1.72, 3.5, 'fl-fd') +
      drop(346, 446, 30, -80, 1.75, 3, 'fl-fd') +
      `<ellipse class="fl-rp" style="--d:.3s" cx="372" cy="448" rx="30" ry="6.5" fill="none" stroke="${EDGE}" stroke-width="2"/>` +
      `<ellipse class="fl-rp" style="--d:1.75s" cx="352" cy="448" rx="30" ry="6.5" fill="none" stroke="${EDGE}" stroke-width="2"/>`,
  }
}
