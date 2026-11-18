import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Comic City: a night city drawn as a living comic page. Black gutters split the picture into panels, each printed in
// its own ink: a magenta panel on the left where a caped hero swings on a line across a halftone moon above inked
// towers, a cyan strip of far skyline along the top, a yellow rooftop panel with a water tower on the right, and an
// inset panel around the desk where Claude, in a translucent domino mask and a short cape, types on an inked laptop.
// The buildings sit a hair off register on a pale ink plate, like cheap newsprint. A command run jolts the panels,
// streaks speed lines and pops wordless burst shapes; an error snaps the hero's line, bangs a jagged burst, tilts the
// panels and cracks the left one; done slams in a starburst splash panel with a caped hero pose.
const INK = '#06040a'
const PALE = '#f3ecf7'
const MAG = '#ff4fa3'
const CYAN = '#3fd0ff'
const YEL = '#ffd23f'
const ORANGE = '#ff5a3a'
const CORAL = '#d97757'
const GUTTER = '#030207'
const METAL = '#2b2038'
const WOOD = '#1d1428'

/** A building's footprint in a skyline: left, right, roof. */
type Block = readonly [number, number, number]

/** A starburst around (0, 0), its tips ragged by `jag`: the wordless sound-effect shape. */
function star(outer: number, inner: number, points: number, jag = 0, seed = 1): string {
  const next = random(seed)
  const corners: string[] = []

  for (let index = 0; index < points * 2; index += 1) {
    const a = (index / (points * 2)) * Math.PI * 2 - Math.PI / 2 + (jag > 0 ? (next() - 0.5) * 0.14 : 0)
    const r = index % 2 === 0 ? outer * (1 - jag * next()) : inner

    corners.push(`${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`)
  }

  return `M${corners.join('L')}Z`
}

/** A halftone screen: one dot per cell, turned 45 degrees like a print screen. */
function screen(id: string, color: string, size: number, r: number): string {
  return (
    `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}"/></pattern>`
  )
}

/** Buildings in black ink over one colour plate a hair (2 px, still) off register, like cheap newsprint. */
function printed(d: string, plate: string): string {
  return `<path d="${d}" fill="${plate}" fill-opacity=".45" transform="translate(-2 -1)"/><path d="${d}" fill="${INK}"/>`
}

/** A wordless burst at (x, y) that pops on its own clock: an inked star with a hotter heart. */
function burst(x: number, y: number, r: number, outer: string, inner: string, cls: string, delay: number, seed: number, jag = 0.3): string {
  return (
    `<g transform="translate(${x} ${y})"><g class="${cls}" style="animation-delay:${delay}s">` +
    `<path d="${star(r, r * 0.6, 11, jag, seed)}" fill="${outer}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="${star(r * 0.55, r * 0.32, 9, jag * 0.8, seed + 1)}" fill="${inner}"/></g></g>`
  )
}

/** A row of buildings with ragged roofs from `from` to `to`. */
function skyline(seed: number, from: number, to: number, roof: [number, number], width: [number, number]): Block[] {
  const next = random(seed)
  const blocks: Block[] = []

  for (let x = from; x < to; ) {
    const w = width[0] + next() * (width[1] - width[0])

    blocks.push([x, x + w, roof[0] + next() * (roof[1] - roof[0])])
    x += w - 2
  }

  return blocks
}

const outline = (blocks: readonly Block[], floor: number): string =>
  blocks.map(([a, b, top]) => `M${f(a)} ${floor}V${f(top)}H${f(b)}V${floor}Z`).join('')

/** Lit windows on a skyline: a few of them breathe slowly. */
function lights(seed: number, blocks: readonly Block[], chance: number, color: string, size: [number, number], gap: [number, number], floor: number): string {
  const next = random(seed)
  const out: string[] = []

  for (const [x0, x1, top] of blocks) {
    for (let x = x0 + 7; x + size[0] < x1 - 5; x += gap[0]) {
      for (let y = top + 14; y + size[1] < floor; y += gap[1]) {
        if (next() < chance) {
          const breathe = next() < 0.14 ? ` class="cm-win" style="animation-delay:${f(-next() * 5)}s"` : ''

          out.push(`<rect${breathe} x="${f(x)}" y="${f(y)}" width="${size[0]}" height="${size[1]}" fill-opacity="${f(0.45 + next() * 0.45)}"/>`)
        }
      }
    }
  }

  return `<g fill="${color}">${out.join('')}</g>`
}

/** Thin wedges out from (0, 0): focus lines around a panel's hero, or a splash panel's rays. */
function wedges(count: number, inner: [number, number], outer: number, half: number, seed: number, turn = 0): string {
  const next = random(seed)
  let d = ''

  for (let index = 0; index < count; index += 1) {
    const a = (index / count) * Math.PI * 2 + turn + (seed > 1 ? (next() - 0.5) * 0.12 : 0)
    const r = inner[0] + next() * (inner[1] - inner[0])

    d +=
      `M${f(r * Math.cos(a))} ${f(r * Math.sin(a))}` +
      `L${f(outer * Math.cos(a - half))} ${f(outer * Math.sin(a - half))}L${f(outer * Math.cos(a + half))} ${f(outer * Math.sin(a + half))}Z`
  }

  return d
}

/** A thought bubble's scalloped rim around an ellipse. */
function cloud(cx: number, cy: number, rx: number, ry: number, bumps: number): string {
  const at = (index: number) => {
    const a = (index / bumps) * Math.PI * 2

    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const
  }
  let d = `M${f(at(0)[0])} ${f(at(0)[1])}`

  for (let index = 1; index <= bumps; index += 1) {
    const [x0, y0] = at(index - 1)
    const [x1, y1] = at(index)
    const r = Math.hypot(x1 - x0, y1 - y0) * 0.6

    d += `A${f(r)} ${f(r)} 0 0 1 ${f(x1)} ${f(y1)}`
  }

  return `${d}Z`
}

/** Speed lines in a box, in three staggered sets so they stream. */
function streaks(seed: number, box: [number, number, number, number], each: number): string {
  const next = random(seed)
  const [x, y, w, h] = box

  return [0, 1, 2]
    .map(set => {
      const lines = Array.from({ length: each }, () => {
        const sx = x + next() * w
        const sy = y + next() * h

        return `M${f(sx)} ${f(sy)}h${f(60 + next() * 120)}`
      }).join('')

      return `<path class="cm-spd" style="animation-delay:${f(-set * 0.27)}s" d="${lines}"/>`
    })
    .join('')
}

/** The swinging hero, hand on the line at (0, 0): head, cape, a leg tucked, an arm out. */
const SWINGER =
  `<g fill="${INK}" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">` +
  '<circle cx="-5" cy="14" r="6.5" stroke="none"/><path d="M-7 21L7 19L6 41L-4 42Z" stroke-width="1"/>' +
  '<path d="M-6 21C-20 27 -31 41 -36 55Q-22 58 -8 40Z" stroke="none"/>' +
  '<path d="M0 0L4 18M-6 23L-19 32M-3 41L11 50L8 63M4 41L0 56L-10 62" fill="none" stroke-width="5"/></g>'

/** The splash panel's hero: a blocky critter, fists on hips; the cape, eyes and starburst emblem go on separately. */
const poser = (c: string): string =>
  `<g fill="${c}"><rect x="-50" y="20" width="100" height="70"/><rect x="-70" y="48" width="20" height="20"/><rect x="50" y="48" width="20" height="20"/>` +
  '<rect x="-40" y="90" width="10" height="16"/><rect x="-20" y="90" width="10" height="16"/><rect x="10" y="90" width="10" height="16"/><rect x="30" y="90" width="10" height="16"/></g>'

/** The laptop, inked: its lid's back printed in halftone with the hero emblem, speed lines streaming off it. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'tool' || activity === 'run' || activity === 'responding' || activity === 'web' ? ' cm-busy' : ''
  const lid = 'M338 328L354 232L404 236L392 330Z'
  let dots = ''

  for (let y = 244; y <= 322; y += 10) {
    const left = 338 + ((328 - y) * 16) / 96 + 7
    const right = 392 + ((330 - y) * 12) / 94 - 6

    for (let x = left; x <= right; x += 10) {
      if (Math.hypot(x - 373, y - 281) > 18) {
        dots += `M${f(x - 2)} ${y}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`
      }
    }
  }

  return (
    `<g class="cm-sl${busy}"><path d="M412 248H452M418 266H448M410 284H456M420 300H442" stroke="${PALE}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></g>` +
    `<rect x="244" y="322" width="100" height="8" rx="2" fill="${METAL}" stroke="${INK}" stroke-width="2.5"/>` +
    `<g fill="${light}" fill-opacity=".6">${[252, 265, 278, 291, 304, 317].map(x => `<rect x="${x}" y="324" width="8" height="3"/>`).join('')}</g>` +
    `<path d="${lid}" fill="#3a1641" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="${dots}" fill="${MAG}" fill-opacity=".55"/>` +
    `<g transform="translate(373 281)"><circle r="13" fill="${YEL}" stroke="${INK}" stroke-width="2.5"/><path d="${star(10, 4, 8)}" fill="${CORAL}"/></g>` +
    `<path d="M336 327L352 234L357 234L341 327Z" fill="${light}"/>` +
    `<path d="M336 327L352 234L330 240L316 327Z" fill="${light}" fill-opacity=".16"/>`
  )
}

// The domino mask: its top edge (shared by the fill and the ink line) and the two lobes it closes with.
const MASK_TOP = 'C88 250 104 246 119.5 247C136.5 248 145 252 150 256C155 252 163.5 248 184 247C199 246 213 250 216.6 262'
const MASK = `M84 262${MASK_TOP}C218 272 212 286 197 288C181.6 290 165.3 282 150 274C134.7 282 119 290 104 288C89 286 82 272 84 262`

// The crack across the left panel on an error.
const CRACK = 'M426 470L372 494L388 520L330 542L348 568L282 590L298 620L230 640L248 670L168 692L186 718L98 742L118 772L24 792L-20 800'

const BOOKS = ['#7a2456', '#1f5c78', '#8a7322', '#4a2c70', '#8a2f3e', '#1f6a5a', '#7a2456', '#2a4a8a', '#8a7322']
const BOOK_SHIFT = [0, -4, 3, -2, 5, -3, 1, -5, 2]

const STYLE =
  // The hero swings on a line across the moon; faster when busy, wide on a run.
  '.cm-swing{animation:cm-swing 3.4s ease-in-out infinite alternate}@keyframes cm-swing{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}' +
  '.st-tool .cm-swing,.st-web .cm-swing,.st-responding .cm-swing,.st-read .cm-swing{animation-duration:2.3s}' +
  '.st-sleeping .cm-swing{animation-duration:7s}' +
  '.st-run .cm-swing{animation:cm-swing2 1.1s ease-in-out infinite alternate}@keyframes cm-swing2{from{transform:rotate(-36deg)}to{transform:rotate(36deg)}}' +
  '.cm-fig{transform-box:fill-box;transform-origin:center}' +
  '.cm-win{animation:cm-win 5s ease-in-out infinite alternate}@keyframes cm-win{to{opacity:.2}}' +
  '.cm-blimp{animation:cm-blimp 60s ease-in-out infinite alternate}@keyframes cm-blimp{to{transform:translateX(240px)}}' +
  '.cm-bcn{animation:cm-bcn 2.8s ease-in-out infinite}@keyframes cm-bcn{0%,100%{opacity:.25}50%{opacity:1}}' +
  '.cm-halo{animation:cm-halo 6s ease-in-out infinite alternate}@keyframes cm-halo{from{opacity:.6}}' +
  // Claude's cape and mask ties.
  '.cm-cape{transform-box:fill-box;transform-origin:100% 0;animation:cm-cape 1.9s ease-in-out infinite alternate}@keyframes cm-cape{from{transform:rotate(-5deg)}to{transform:rotate(3deg)}}' +
  '.st-run .cm-cape{animation-duration:.6s}' +
  '.cm-tie{transform-box:fill-box;transform-origin:100% 50%;animation:cm-tie 1.2s ease-in-out infinite alternate}@keyframes cm-tie{from{transform:rotate(-12deg)}to{transform:rotate(10deg)}}' +
  '.cm-busy{animation:cm-sl .5s linear infinite}@keyframes cm-sl{from{transform:translateX(-6px);opacity:1}to{transform:translateX(14px);opacity:.2}}' +
  // Thinking: a thought bubble with dots that pop. Responding: a speech bubble whose marks write themselves.
  '.cm-think,.cm-say{opacity:0;transform-origin:1250px 440px}' +
  '.st-thinking .cm-think,.st-responding .cm-say{animation:cm-in .4s cubic-bezier(.3,1.6,.5,1) .15s both}@keyframes cm-in{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:scale(1)}}' +
  '.cm-dot{transform-box:fill-box;transform-origin:center}.cm-bar{transform-box:fill-box;transform-origin:0 50%}' +
  '.st-thinking .cm-dot{animation:cm-dot 1.5s ease-in-out infinite}@keyframes cm-dot{0%,100%{transform:scale(.35)}30%{transform:scale(1.2)}55%{transform:scale(1)}}' +
  '.st-responding .cm-bar{animation:cm-bar 2.4s ease-out infinite}@keyframes cm-bar{0%{transform:scaleX(0)}35%,88%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}' +
  // Tool: the towers and the water tower get inked in. Read: a page turns over the top strip. Web: the beacons call.
  '.cm-inkd{opacity:0;stroke-dasharray:1 1}.st-tool .cm-inkd{animation:cm-ink 2.2s ease-in-out infinite}' +
  '@keyframes cm-ink{0%{opacity:.85;stroke-dashoffset:1}65%{opacity:.85;stroke-dashoffset:0}100%{opacity:0;stroke-dashoffset:0}}' +
  '.cm-flip{opacity:0}.st-read .cm-flip{animation:cm-flip 2.2s ease-in-out infinite}@keyframes cm-flip{0%{opacity:0;transform:translateX(0)}15%,80%{opacity:1}100%{opacity:0;transform:translateX(1350px)}}' +
  '.cm-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .cm-ring{animation:cm-ring 1.6s ease-out infinite}' +
  '@keyframes cm-ring{0%{opacity:0;transform:scale(.3)}25%{opacity:.8}100%{opacity:0;transform:scale(2.2)}}' +
  // Run: the panels jolt with each keypress, speed lines stream, bursts pop one after another, focus lines close in on Claude.
  '.cm-p1{transform-origin:210px 540px}.cm-p4{transform-origin:1420px 400px}' +
  '.st-run .cm-p1{animation:cm-jolt 1.4s ease-out infinite}@keyframes cm-jolt{0%,62%,100%{transform:translate(0,0)}70%{transform:translate(-6px,4px)}80%{transform:translate(2px,-1px)}}' +
  // A long pan would slide unrasterized skyline into view, so the strip only lurches with each keypress.
  '.st-run .cm-pan{animation:cm-pan 1.4s ease-out infinite}@keyframes cm-pan{0%,62%,100%{transform:translateX(0)}70%{transform:translateX(-14px)}80%{transform:translateX(5px)}}' +
  '.st-run .cm-p4{animation:cm-jolt 1.4s ease-out .08s infinite}' +
  '.cm-spd{opacity:0}.st-run .cm-spd{animation:cm-spd .8s linear infinite}@keyframes cm-spd{0%{opacity:0;transform:translateX(160px)}20%,80%{opacity:.6}100%{opacity:0;transform:translateX(-200px)}}' +
  '.cm-rb,.cm-eb{opacity:0}.st-run .cm-rb,.st-done .cm-rb{animation:cm-pop 2.4s ease-out infinite}' +
  '@keyframes cm-pop{0%{opacity:0;transform:scale(.2) rotate(-25deg)}8%{opacity:1;transform:scale(1.12) rotate(4deg)}14%{transform:scale(1) rotate(0)}55%{opacity:1;transform:scale(1)}75%,100%{opacity:0;transform:scale(1.08)}}' +
  '.cm-focus{opacity:0}.st-run .cm-focus{animation:cm-focus 1.4s ease-in-out infinite}@keyframes cm-focus{0%,100%{opacity:.18;transform:scale(1.05)}70%{opacity:.5;transform:scale(1)}}' +
  // Error: the line snaps and the hero drops out of frame, a jagged burst bangs, the panels tilt, the left one cracks.
  '.st-error .cm-swing{animation:cm-snap .5s ease-out both}@keyframes cm-snap{from{transform:rotate(-24deg)}to{transform:rotate(12deg)}}' +
  '.st-error .cm-rope{animation:cm-out .25s ease-out .3s both}@keyframes cm-out{to{opacity:0}}' +
  '.st-error .cm-fig{animation:cm-fall 1.6s cubic-bezier(.55,0,.9,.5) .35s both}@keyframes cm-fall{to{transform:translate(-50px,820px) rotate(-320deg)}}' +
  '.st-error .cm-eb{animation:cm-bang .45s cubic-bezier(.3,1.7,.5,1) .15s both}@keyframes cm-bang{from{opacity:0;transform:scale(.2) rotate(-30deg)}to{opacity:1;transform:scale(1) rotate(0)}}' +
  '.st-error .cm-p1{animation:cm-tilt .7s cubic-bezier(.3,1.6,.5,1) .1s both}@keyframes cm-tilt{to{transform:rotate(-3deg)}}' +
  '.st-error .cm-p4{animation:cm-tilt2 .7s cubic-bezier(.3,1.6,.5,1) .2s both}@keyframes cm-tilt2{to{transform:rotate(2.4deg)}}' +
  '.cm-crack{opacity:0;stroke-dasharray:1 1;stroke-dashoffset:1}.st-error .cm-crack{animation:cm-crack .4s ease-out .2s both}@keyframes cm-crack{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
  // Done: the hero lands in a starburst splash panel that slams in over the left, and the focus lines close in.
  '.st-done .cm-pend{opacity:0}' +
  '.cm-splash{opacity:0}.st-done .cm-splash{animation:cm-slam .55s ease-out .15s both}' +
  '@keyframes cm-slam{0%{opacity:0;transform:scale(1.4) rotate(8deg)}60%{opacity:1;transform:scale(.96) rotate(-5deg)}100%{opacity:1;transform:scale(1) rotate(-4deg)}}' +
  '.st-done .cm-rays{animation:mv-spin 40s linear infinite}' +
  '.st-done .cm-focus{animation:cm-focin .6s ease-out both}@keyframes cm-focin{from{opacity:0;transform:scale(1.3)}to{opacity:.55;transform:scale(1)}}'

export function comicCityWorld(): World {
  // The left panel: towers under the moon.
  const towers: Block[] = [
    [-20, 62, 590],
    [52, 128, 500],
    [120, 210, 620],
    [200, 280, 545],
    [272, 360, 610],
    [350, 440, 600],
  ]
  const towerPath =
    'M-20 1020V590H10V572H40V590H62V1020Z' +
    'M52 1020V500H60V470H72V440H88V372H92V440H108V470H120V500H128V1020Z' +
    'M120 1020V620L140 598L160 620L180 598L200 620H210V1020Z' +
    'M200 1020V545H210V520H238V468H242V520H270V545H280V1020Z' +
    'M272 1020V610H360V1020Z' +
    'M350 1020V600L440 560V1020Z'
  const shade = towers.map(([a, b, top]) => `<rect x="${f(a + (b - a) * 0.58)}" y="${top}" width="${f((b - a) * 0.42)}" height="${1020 - top}"/>`).join('')

  // The top strip: a far skyline with a needle tower, lurching on a run.
  const far = skyline(71, 425, 1680, [124, 188], [26, 64])
  const farPath = outline(far, 240) + 'M1020 240V128L1040 94L1060 128V240ZM1039 94V56H1041V94Z'

  // The chat panel: near rooftops, dim.
  const near = skyline(91, 400, 1660, [700, 860], [70, 150])

  // The yellow panel: rooftops and a water tower.
  const roofs = 'M1198 1020V498H1262V478H1300V498H1352V488H1400V1020ZM1392 1020V474H1640V1020Z'
  const tank = 'M1468 344H1572V404Q1520 420 1468 404ZM1460 346L1520 298L1580 346Z'

  // The desk's inset panel: its own skyline behind Claude.
  const back = skyline(57, 0, 520, [160, 300], [34, 80])

  const gutterLine = (d: string, opacity: number) => `<path d="${d}" fill="none" stroke="${PALE}" stroke-opacity="${opacity}" stroke-width="3" stroke-linejoin="round"/>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#07040b',
      furniture: WOOD,
      metal: METAL,
      paper: PALE,
      light: { idle: '#c04a92', work: MAG, bright: '#ffd86a' },
      headTop: 238,
      glowAt: [346, 280],
      device,
      wear: {
        behind:
          // A short cape off the shoulders, lined in yellow, and the mask's ties.
          `<g class="cm-cape"><path d="M74 254C56 284 44 324 30 374L46 364L52 382L66 362L74 348Z" fill="#b0236a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
          `<path d="M68 272C58 300 50 330 40 364" fill="none" stroke="${YEL}" stroke-opacity=".6" stroke-width="2.5"/></g>` +
          `<g class="cm-tie"><path d="M66 262L38 248L46 264ZM66 268L36 284L50 270Z" fill="${MAG}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g>`,
        front:
          // A domino mask of tinted film, so the eyes show through it, inked only along the top so nothing cuts across
          // them, and Claude's starburst on the chest.
          `<path d="${MASK}Z" fill="${MAG}" fill-opacity=".3"/>` +
          `<path d="M89 286C83 278 82 270 84 262C88 250 104 246 119.5 247C134 248 141 251 144 253M156 253C159 251 166 248 184 247C199 246 213 250 216.6 262C218 270 217 278 211 286" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M98 258Q120 246 146 254M154 254Q180 246 202 258" fill="none" stroke="${PALE}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
          `<g transform="translate(100 322)"><circle r="11" fill="${YEL}" stroke="${INK}" stroke-width="2.5"/><path d="${star(8.5, 3.4, 8)}" fill="${CORAL}"/></g>`,
      },
      seatArt: BOOKS.map((color, index) => {
        const y = 350 + index * 11.8
        const x = 110 + BOOK_SHIFT[index]!

        return (
          `<rect x="${x}" y="${f(y)}" width="82" height="11" rx="1.5" fill="${color}" stroke="${INK}" stroke-width="2"/>` +
          `<rect x="${x + 40}" y="${f(y + 3)}" width="14" height="5" fill="${PALE}" fill-opacity=".3"/>`
        )
      }).join(''),
      tableArt:
        `<path d="M192 343L180 456M192 343L208 456M446 343L432 456M446 343L460 456M184 404H456" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>` +
        `<path d="M192 343L180 456M192 343L208 456M446 343L432 456M446 343L460 456M184 404H456" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/>` +
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="${WOOD}" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M172 333H464" stroke="${MAG}" stroke-opacity=".5" stroke-width="2"/>` +
        // An ink bottle.
        `<path d="M418 330V318Q418 312 424 312H434Q440 312 440 318V330Z" fill="#160d22" stroke="${INK}" stroke-width="2"/>` +
        `<rect x="424" y="305" width="10" height="8" rx="1" fill="${INK}"/><rect x="421" y="319" width="16" height="6" fill="${MAG}" fill-opacity=".7"/>`,
    },
    style: STYLE,
    scenery:
      '<defs>' +
      screen('cm-dm', MAG, 13, 3.4) +
      screen('cm-dk', '#2a1c40', 7, 1.9) +
      screen('cm-do', '#b2641e', 8, 2.5) +
      screen('cm-dc', CYAN, 11, 2.5) +
      screen('cm-dv', MAG, 22, 3) +
      screen('cm-dy', YEL, 12, 2.8) +
      screen('cm-dn', MAG, 10, 2.3) +
      '<linearGradient id="cm-f1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#130a1b"/><stop offset=".5" stop-color="#130a1b" stop-opacity=".7"/><stop offset="1" stop-color="#130a1b" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cm-f2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07101c"/><stop offset=".35" stop-color="#07101c" stop-opacity=".85"/><stop offset="1" stop-color="#07101c" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cm-f4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120c07"/><stop offset="1" stop-color="#120c07" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cm-f5" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#110a1a" stop-opacity=".1"/><stop offset="1" stop-color="#110a1a"/></linearGradient>' +
      `<radialGradient id="cm-halo"><stop offset="0" stop-color="${YEL}" stop-opacity=".3"/><stop offset=".5" stop-color="${YEL}" stop-opacity=".1"/><stop offset="1" stop-color="${YEL}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="cm-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${PALE}" stop-opacity="0"/><stop offset=".5" stop-color="${PALE}" stop-opacity=".26"/><stop offset="1" stop-color="${PALE}" stop-opacity="0"/></linearGradient>` +
      '<clipPath id="cm-k1"><path d="M-20 -20H424L392 1020H-20Z"/></clipPath>' +
      '<clipPath id="cm-k2"><path d="M440 -20H1640V200L433 222Z"/></clipPath>' +
      '<clipPath id="cm-k3"><path d="M432 240L1640 216V1020H408Z"/></clipPath>' +
      '<clipPath id="cm-k4"><rect x="1198" y="228" width="442" height="792"/></clipPath>' +
      '<clipPath id="cm-k6"><rect x="-180" y="-200" width="360" height="400"/></clipPath>' +
      '<clipPath id="cm-km"><circle cx="206" cy="222" r="112"/></clipPath>' +
      '</defs>' +
      `<rect x="-100" y="-100" width="1800" height="1200" fill="${GUTTER}"/>` +
      // The chat panel: dark, a faint dot screen, near rooftops.
      '<g clip-path="url(#cm-k3)"><rect x="400" y="200" width="1240" height="820" fill="#0b0812"/>' +
      '<rect x="400" y="200" width="1240" height="820" fill="url(#cm-dv)" opacity=".14"/>' +
      `<path d="${outline(near, 1020)}" fill="#0f0a17" stroke="#1d142a" stroke-width="2"/>` +
      lights(93, near, 0.025, '#2c2040', [6, 9], [16, 24], 1000) +
      '</g>' +
      gutterLine('M408 1020L432 240L1640 216', 0.2) +
      // The yellow panel at the far right: rooftops, a water tower, the bubbles Claude thinks and speaks in.
      `<g class="mv-r"><path d="M1180 212H1640V1020H1180Z" fill="${GUTTER}"/><g class="cm-p4"><g clip-path="url(#cm-k4)">` +
      '<rect x="1198" y="228" width="442" height="792" fill="#120c07"/>' +
      '<rect x="1198" y="228" width="442" height="300" fill="url(#cm-dy)" opacity=".5"/><rect x="1198" y="226" width="442" height="304" fill="url(#cm-f4)"/>' +
      printed(`${roofs}${tank}`, MAG) +
      `<path d="M1478 404L1470 476M1562 404L1570 476M1505 412L1503 476M1535 412L1537 476M1474 428L1566 452M1474 452L1566 428M1520 298V256" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M1468 364H1572M1468 386H1572" stroke="${PALE}" stroke-opacity=".18" stroke-width="2"/>` +
      `<path class="cm-inkd" d="${tank}" pathLength="1" fill="none" stroke="${YEL}" stroke-width="3"/>` +
      `<circle class="cm-bcn" cx="1520" cy="254" r="3.5" fill="${YEL}"/><circle class="cm-ring" cx="1520" cy="254" r="16" fill="none" stroke="${YEL}" stroke-width="2"/>` +
      lights(95, [[1198, 1262, 498], [1300, 1352, 498], [1392, 1460, 474]], 0.1, YEL, [5, 7], [12, 16], 520) +
      burst(1330, 330, 68, MAG, YEL, 'cm-rb', 1.5, 31) +
      '</g>' +
      gutterLine('M1198 1020V228H1640', 0.42) +
      `<g class="cm-think"><g fill="${PALE}" fill-opacity=".92" stroke="${INK}" stroke-width="3"><circle cx="1262" cy="408" r="11"/><circle cx="1246" cy="436" r="7.5"/><circle cx="1236" cy="458" r="5"/>` +
      `<path d="${cloud(1318, 326, 92, 50, 9)}" stroke-width="4"/></g>` +
      `<g fill="${INK}"><circle class="cm-dot" cx="1284" cy="328" r="9"/><circle class="cm-dot" style="animation-delay:.2s" cx="1318" cy="328" r="9"/><circle class="cm-dot" style="animation-delay:.4s" cx="1352" cy="328" r="9"/></g></g>` +
      `<g class="cm-say"><g fill="${PALE}" fill-opacity=".94" stroke="${INK}" stroke-width="4" stroke-linejoin="round"><path d="M1268 358L1236 420L1306 368Z"/><ellipse cx="1320" cy="322" rx="98" ry="52"/></g>` +
      `<path d="M1270 358L1246 408L1302 366Z" fill="${PALE}"/>` +
      `<g fill="${INK}"><rect class="cm-bar" x="1266" y="302" width="108" height="8" rx="4"/><rect class="cm-bar" style="animation-delay:.45s" x="1266" y="318" width="86" height="8" rx="4"/>` +
      '<rect class="cm-bar" style="animation-delay:.9s" x="1266" y="334" width="60" height="8" rx="4"/></g></g>' +
      '</g></g>' +
      // The cyan strip along the top: far skyline, a needle tower, a blimp.
      '<g clip-path="url(#cm-k2)"><rect x="420" y="-20" width="1220" height="260" fill="#07101c"/>' +
      '<rect x="420" y="-20" width="1220" height="260" fill="url(#cm-dc)" opacity=".42"/><rect x="420" y="-22" width="1220" height="264" fill="url(#cm-f2)"/>' +
      `<g transform="translate(720 64)"><g class="cm-blimp"><ellipse rx="62" ry="17" fill="#05080f" stroke="${CYAN}" stroke-opacity=".35" stroke-width="2"/>` +
      `<path d="M52 -4L74 -18V18L52 6ZM-14 14H12V22H-14Z" fill="#05080f"/><path d="M-40 0H40" stroke="${CYAN}" stroke-opacity=".18" stroke-width="2"/></g></g>` +
      `<g class="cm-pan">${printed(farPath, CYAN)}${lights(73, far, 0.05, '#bfefff', [3, 4], [9, 11], 222)}` +
      `<circle class="cm-bcn" cx="1040" cy="54" r="3" fill="${YEL}"/><circle class="cm-ring" cx="1040" cy="54" r="16" fill="none" stroke="${CYAN}" stroke-width="2"/></g>` +
      `<g stroke="${PALE}" stroke-width="3" stroke-linecap="round" fill="none">${streaks(43, [470, 30, 1000, 170], 3)}</g>` +
      '<rect class="cm-flip" x="260" y="-20" width="180" height="260" fill="url(#cm-sw)"/>' +
      burst(1290, 104, 56, CYAN, YEL, 'cm-rb', 0.9, 41) +
      '</g>' +
      gutterLine('M440 -20L433 222L1640 200', 0.38) +
      // The magenta panel on the left: the moon, the swinging hero, the inked towers.
      '<g class="cm-p1"><g clip-path="url(#cm-k1)"><rect x="-20" y="-20" width="460" height="1040" fill="#130a1b"/>' +
      '<rect x="-20" y="-20" width="460" height="740" fill="url(#cm-dm)" opacity=".5"/><rect x="-20" y="-22" width="460" height="744" fill="url(#cm-f1)"/>' +
      '<circle class="cm-halo" cx="206" cy="222" r="240" fill="url(#cm-halo)"/>' +
      '<circle cx="206" cy="222" r="112" fill="#f0d36e" fill-opacity=".86"/>' +
      '<circle cx="258" cy="268" r="118" fill="url(#cm-do)" clip-path="url(#cm-km)"/>' +
      `<circle cx="206" cy="222" r="112" fill="none" stroke="${INK}" stroke-width="5"/>` +
      `<g class="cm-pend" transform="translate(228 -70)"><g class="cm-swing"><line class="cm-rope" y2="300" stroke="${PALE}" stroke-opacity=".7" stroke-width="2.2"/>` +
      `<g transform="translate(0 300)"><g class="cm-fig">${SWINGER}</g></g></g></g>` +
      `<g stroke="${PALE}" stroke-width="3.5" stroke-linecap="round" fill="none">${streaks(47, [10, 360, 330, 180], 3)}</g>` +
      printed(towerPath, CYAN) +
      `<g fill="url(#cm-dk)">${shade}</g>` +
      lights(17, towers, 0.085, YEL, [6, 9], [13, 20], 985) +
      `<path class="cm-inkd" d="${towerPath}" pathLength="1" fill="none" stroke="${CYAN}" stroke-width="3"/>` +
      `<rect x="18" y="20" width="150" height="42" fill="${YEL}" fill-opacity=".9" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M32 34h54M94 34h36M32 48h76M116 48h22" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
      // The crack that splits the panel on an error: dark ink with a pale lip.
      `<path class="cm-crack" pathLength="1" d="${CRACK}" fill="none" stroke="${PALE}" stroke-opacity=".85" stroke-width="4.5" transform="translate(3 4)"/>` +
      `<path class="cm-crack" pathLength="1" d="${CRACK}" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="bevel"/>` +
      burst(318, 440, 66, YEL, ORANGE, 'cm-rb', 0.2, 11) +
      burst(92, 520, 54, CYAN, YEL, 'cm-rb', 1.2, 13) +
      burst(160, 440, 110, ORANGE, YEL, 'cm-eb', 0, 21, 0.45) +
      '</g>' +
      gutterLine('M424 -20L392 1020', 0.45) +
      '</g>' +
      // Done: the splash panel, a hero pose in a starburst.
      `<g transform="translate(212 590)"><g class="cm-splash"><rect x="-190" y="-210" width="380" height="420" fill="${GUTTER}"/>` +
      '<g clip-path="url(#cm-k6)"><rect x="-180" y="-200" width="360" height="400" fill="#2a0c1e"/>' +
      `<g class="cm-rays"><path d="${wedges(12, [0, 0], 420, Math.PI / 24, 1)}" fill="${YEL}" fill-opacity=".4"/>` +
      `<path d="${wedges(12, [0, 0], 420, Math.PI / 24, 1, Math.PI / 12)}" fill="${MAG}" fill-opacity=".42"/></g>` +
      `<path d="${star(140, 92, 16)}" fill="#ffe680" fill-opacity=".75" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
      `<g transform="translate(0 -32) scale(1.35)"><path d="M-44 24H44L118 100L92 94L96 118L58 96ZM-44 24L-100 104L-74 98L-62 114L-38 82Z" fill="#b0236a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
      `<g stroke="${INK}" stroke-width="3">${poser('#7a3628')}</g>` +
      `<g fill="${INK}"><rect x="-22" y="30" width="10" height="20"/><rect x="14" y="30" width="10" height="20"/></g>` +
      `<g transform="translate(0 70)"><path d="${star(15, 6, 8)}" fill="${YEL}" stroke="${INK}" stroke-width="2"/></g></g>` +
      `<path d="M-140 112H140V220H-140Z" fill="${INK}"/><path d="M-140 113H140" stroke="${PALE}" stroke-opacity=".4" stroke-width="2"/></g>` +
      `<rect x="-180" y="-200" width="360" height="400" fill="none" stroke="${PALE}" stroke-opacity=".7" stroke-width="3"/></g></g>`,
    nook:
      // The inset panel around the desk: a dotted night sky, a skyline behind Claude, a rooftop, focus lines.
      '<defs><clipPath id="cm-k5"><rect x="12" y="-30" width="500" height="560"/></clipPath></defs>' +
      `<g transform="rotate(-1.2 240 230)"><rect x="-6" y="-48" width="540" height="600" fill="${GUTTER}"/>` +
      '<g clip-path="url(#cm-k5)"><rect x="12" y="-30" width="500" height="560" fill="#110a1a"/>' +
      '<rect x="12" y="-30" width="500" height="360" fill="url(#cm-dn)" opacity=".55"/><rect x="12" y="-32" width="500" height="364" fill="url(#cm-f5)"/>' +
      printed(outline(back, 420), CYAN) +
      lights(59, back, 0.05, YEL, [5, 7], [12, 16], 396) +
      `<rect x="12" y="406" width="500" height="130" fill="#0a0610"/><rect x="12" y="398" width="500" height="10" fill="#1c1428" stroke="${INK}" stroke-width="2"/>` +
      `<g transform="translate(200 296)"><g class="cm-focus"><path d="${wedges(28, [190, 260], 700, 0.012, 7)}" fill="${PALE}"/></g></g></g>` +
      `<rect x="12" y="-30" width="500" height="560" fill="none" stroke="${PALE}" stroke-opacity=".5" stroke-width="3"/>` +
      `<rect x="24" y="-16" width="128" height="30" fill="${YEL}" fill-opacity=".9" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M36 -6h40M84 -6h30M36 4h58" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`,
    front: burst(378, 128, 30, YEL, ORANGE, 'cm-rb', 0.5, 51) + burst(378, 128, 34, ORANGE, YEL, 'cm-eb', 0.1, 61, 0.45),
  }
}
