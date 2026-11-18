import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Subway Night: an empty platform at midnight. Tiled walls under two tubes, one of them failing; the yellow safety
// line along the edge; a tiled arch on the left where the tunnel opens into the dark, a signal at its mouth.
// Claude sits on a platform bench in a hoodie and headphones, the laptop on a suitcase. A command sends an express
// roaring out of the tunnel and the wind takes the papers; an error flickers the lights and a rat bolts along the
// edge; done brings the last train in, and its doors slide open on warm light.
const YEL = '#f5d547'
const WARM = '#ffd98a'
const STEEL = '#262d35'
const BENCH = '#2c333b'
const BENCH_EDGE = '#47515c'
const CASE = '#24323f'
const CASE_EDGE = '#3d4f61'
// One car, and where its two doors sit: near the ends, so the stopped car's long run of windows spans the chat
// column and the bright open doors stand either side of it.
const CAR = 1000
const DOORS = [38, 886] as const
const DW = 76
// Where the last train's nose stops: off the right edge, its middle car from x 300 to 1300.
const STOP = 2300
// The tunnel mouth, and the same arch left open for the rings inside it.
const ARCH = 'M-80 706V430A195 180 0 0 1 310 430V706Z'
const ARC = 'M-80 706V430A195 180 0 0 1 310 430V706'

// Invented marks for the signs and the board, each in a 24 by 32 box: no letters of any script.
const GLYPHS = [
  'M4 8Q12 0 20 8Q12 16 4 8ZM12 16V28M6 28H18',
  'M4 28V12Q12 2 20 12V28M9 28V16Q12 12 15 16V28',
  'M4 10Q8 4 12 10T20 10M4 22Q8 16 12 22T20 22',
  'M16 16A4 4 0 1 0 8 16A4 4 0 1 0 16 16M12 4V9M12 23V28M3 16H6M18 16H21',
  'M4 20Q12 4 20 20M12 25V28',
  'M12 4L21 16L12 28L3 16ZM12 15V17',
]

/** A row of glyphs at a scale, each its own path, sharing the stroke of the group they go in. */
function glyphRow(ids: readonly number[], x: number, y: number, scale: number, step: number): string {
  return ids.map((g, i) => `<path transform="translate(${f(x + i * step)} ${y}) scale(${scale})" d="${GLYPHS[g]}"/>`).join('')
}

/** A station name sign on the far wall: the name in invented marks, the line under it with its stops. */
function sign(x: number, y: number, here: boolean): string {
  const stops = [0, 1, 2, 3, 4, 5].map(i => `M${x + 31.5 + i * 46} ${y + 62}a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0`).join('')

  return (
    `<rect x="${x}" y="${y}" width="300" height="80" rx="4" fill="#090b0e" stroke="${YEL}" stroke-opacity=".8" stroke-width="3"/>` +
    `<g fill="none" stroke="#e9edf0" stroke-opacity=".88" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
    glyphRow([0, 1, 2, 3, 4, 5], x + 40, y + 8, 1, 38) +
    '</g>' +
    `<path d="M${x + 24} ${y + 62}H${x + 276}" stroke="${YEL}" stroke-width="4"/>` +
    `<path d="${stops}" fill="#090b0e" stroke="#e9edf0" stroke-width="2"/>` +
    (here ? `<g class="sw-trk"><circle cx="${x + 36}" cy="${y + 62}" r="7" fill="${YEL}" stroke="#fff" stroke-width="2"/></g>` : '')
  )
}

/** A pillar on the platform: dark tiles, a lit edge, a striped plinth and a line marker. */
function pillar(x: number, w: number, lit: boolean, marker: number): string {
  return (
    `<rect x="${x}" y="-200" width="${w}" height="1150" fill="url(#sw-tl)"/>` +
    `<rect x="${x}" y="-200" width="${w}" height="1150" fill="#020304" fill-opacity=".64"/>` +
    (lit ? `<rect x="${x + w - 6}" y="-200" width="6" height="1150" fill="#3a444d" fill-opacity=".55"/>` : '') +
    `<rect x="${x - 4}" y="876" width="${w + 8}" height="74" fill="#0a0c0e"/>` +
    `<path d="M${x - 4} 883H${x + w + 4}" stroke="${YEL}" stroke-opacity="${marker * 0.8}" stroke-width="8" stroke-dasharray="9 7"/>` +
    `<rect x="${x + w / 2 - 20}" y="430" width="40" height="40" rx="8" fill="${YEL}" fill-opacity="${marker}"/>` +
    `<path transform="translate(${x + w / 2 - 12} 434)" d="${GLYPHS[1]}" fill="none" stroke="#0b0d10" stroke-width="4" stroke-linecap="round"/>`
  )
}

/** A fixture hanging from the ceiling: a dead tube, or a lit one with its glow carrying the given classes. */
function tube(x: number, w: number, lit: string, rods = true): string {
  return (
    (rods ? `<path d="M${x + 24} 30V62M${x + w - 24} 30V62" stroke="#1a1f24" stroke-width="2.4"/>` : '') +
    `<rect x="${x}" y="62" width="${w}" height="12" rx="3" fill="#191e23" stroke="#2a3138"/>` +
    (lit === ''
      ? `<rect x="${x + 8}" y="74" width="${w - 16}" height="6" rx="3" fill="#2a3036"/>`
      : `<g class="${lit}"><ellipse cx="${x + w / 2}" cy="84" rx="${w * 0.75}" ry="46" fill="url(#sw-tg)"/>` +
        `<rect x="${x + 8}" y="74" width="${w - 16}" height="6" rx="3" fill="#effff8"/></g>`)
  )
}

/**
 * A train whose nose is at x `nose`, its cars trailing left. The express smears its windows; the last train keeps
 * its doors on classes so they can slide open on the light inside.
 */
function train(cars: number, nose: number, express: boolean): string {
  const h = DW / 2
  const p = { body: '', roof: '', skirt: '', stripe: '', hi: '', win: '', mul: '', gaps: '', frames: '', inner: '', poles: '', left: '', right: '', lw: '', rw: '', streak: '' }

  for (let k = 0; k < cars; k += 1) {
    const s = nose - (k + 1) * CAR
    const lead = k === 0
    const end = s + CAR - (lead ? 0 : 4)

    p.body += lead
      ? `M${s + 4} 706V430Q${s + 4} 414 ${s + 20} 414H${s + CAR - 74}Q${s + CAR} 414 ${s + CAR} 480V706Z`
      : `M${s + 4} 706V430Q${s + 4} 414 ${s + 20} 414H${s + CAR - 20}Q${s + CAR - 4} 414 ${s + CAR - 4} 430V706Z`
    p.roof += `M${s + 12} 418H${s + CAR - (lead ? 86 : 22)}V427H${s + 12}Z`
    p.skirt += `M${s + 4} 606H${end}V706H${s + 4}Z`
    p.stripe += `M${s + 4} 596H${end}V602H${s + 4}Z`
    p.hi += `M${s + 14} 438H${end - 24}`
    p.gaps += `M${s - 7} 448h14v238h-14z`

    // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: one long glazed band per car with thin mullions, not separate
    // windows, so a train passing at speed does not strobe; only the doors break it, under three times a second.
    p.win += `M${s + 126} 466H${s + (lead ? 862 : 874)}V552H${s + 126}Z`

    for (let i = 1; i < 6; i += 1) {
      p.mul += `M${s + 129 + i * 124} 466V552`
    }

    for (const u of lead ? [DOORS[0]] : DOORS) {
      const x = s + u

      p.frames += `M${x - 4} 434h${DW + 8}v272h${-DW - 8}z`
      p.inner += `M${x} 438h${DW}v268h${-DW}z`
      p.poles += `M${x + h} 440V706`
      p.left += `M${x} 438h${h}v268h${-h}z`
      p.right += `M${x + h} 438h${h}v268h${-h}z`
      p.lw += `M${x + 7} 468h${h - 12}v82h${12 - h}z`
      p.rw += `M${x + h + 5} 468h${h - 12}v82h${12 - h}z`
    }

    if (express) {
      p.streak += `M${s + 40} 479H${s + 870}M${s + 20} 509H${s + 900}M${s + 60} 539H${s + 860}`
    }
  }

  const tail = nose - cars * CAR
  const cab =
    `<path d="M${nose - 64} 446H${nose - 22}Q${nose - 8} 470 ${nose - 5} 526H${nose - 64}Z" fill="#0b1117" stroke="#3a4652" stroke-width="2"/>` +
    `<path d="M${nose - 54} 456L${nose - 36} 514" stroke="#6b7884" stroke-opacity=".5" stroke-width="3"/>` +
    `<rect x="${nose - 68}" y="424" width="40" height="15" rx="2" fill="#050608"/>` +
    `<g fill="none" stroke="${YEL}" stroke-width="6" stroke-linecap="round">${glyphRow([1, 4, 2], nose - 66, 426, 0.34, 12)}</g>` +
    `<path d="M${nose} 642L${nose + 560} 598V706H${nose}Z" fill="url(#sw-beam)"/>` +
    `<circle cx="${nose - 20}" cy="654" r="70" fill="url(#sw-hl)"/>` +
    `<g fill="#fff7dc"><circle cx="${nose - 12}" cy="654" r="6"/><circle cx="${nose - 30}" cy="654" r="6"/></g>`
  const door = (cls: string, leaf: string, glass: string): string =>
    `<g${express ? '' : ` class="${cls}"`}><path d="${leaf}" fill="#2b333c" stroke="#404a55" stroke-width="1.5"/>` +
    `<path d="${glass}" fill="${WARM}" fill-opacity=".45"/></g>`

  return (
    `<path d="${p.gaps}" fill="#050608"/>` +
    `<path d="${p.body}" fill="${STEEL}"/>` +
    `<path d="${p.roof}" fill="#171c22"/>` +
    `<path d="${p.skirt}" fill="#1b2027"/>` +
    `<path d="${p.stripe}" fill="${YEL}" fill-opacity=".62"/>` +
    `<path d="${p.hi}" stroke="#5c6772" stroke-opacity=".45" stroke-width="2"/>` +
    `<path d="${p.win}" fill="${WARM}" fill-opacity="${express ? 0.46 : 0.56}"/>` +
    `<path d="${p.mul}" stroke="#1a1f25" stroke-opacity="${express ? 0.3 : 0.62}" stroke-width="${express ? 6 : 10}"/>` +
    (express ? `<path d="${p.streak}" stroke="#fff1c0" stroke-opacity=".24" stroke-width="1.6"/>` : '') +
    `<path d="${p.frames}" fill="#0d1014"/>` +
    (express
      ? ''
      : `<g class="sw-in"><path d="${p.inner}" fill="${WARM}"/><path d="${p.poles}" stroke="#b8925a" stroke-width="3"/></g>`) +
    door('sw-dl', p.left, p.lw) +
    door('sw-dr', p.right, p.rw) +
    cab +
    (express ? `<rect x="${tail + 10}" y="646" width="9" height="9" fill="#ff4b4b"/><circle cx="${tail + 14}" cy="650" r="16" fill="#ff4b4b" fill-opacity=".2"/>` : '')
  )
}

/** The laptop showing the line map with its train on the way, and a takeaway coffee, on the suitcase. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${252 + i * 14}" y="325" width="9" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const fast = activity === 'run' || activity === 'tool'
  const screen = 'M314 318L328 244L394 247L388 318Z'

  return (
    '<rect x="244" y="322" width="150" height="9" rx="2" fill="#2a3139"/>' +
    keys +
    '<path d="M300 326L318 230L404 234L396 326Z" fill="#20262d" stroke="#3b4550" stroke-width="2" stroke-linejoin="round"/>' +
    `<path d="${screen}" fill="#06080a"/><path d="${screen}" fill="${light}" fill-opacity=".1"/>` +
    `<path d="M326 298H348L362 282H384" fill="none" stroke="${YEL}" stroke-width="3.4" stroke-linejoin="round"/>` +
    '<path d="M344 254L356 268V308" fill="none" stroke="#5ec8e0" stroke-width="3"/>' +
    '<g fill="#06080a" stroke="#e9edf0" stroke-width="1.4"><circle cx="331" cy="298" r="2.4"/><circle cx="341" cy="298" r="2.4"/>' +
    '<circle cx="374" cy="282" r="2.4"/><circle cx="384" cy="282" r="2.4"/><circle cx="356" cy="289" r="4"/></g>' +
    `<g class="sw-mk${fast ? ' sw-mkf' : ''}"><rect x="325" y="292" width="9" height="5" rx="1" fill="${light}"/></g>` +
    '<path d="M418 300H442L438 330H422Z" fill="#d8d2c4"/><path d="M419.4 308H440.6L439.8 318H420.2Z" fill="#6b4a2e"/>' +
    '<rect x="416" y="295" width="28" height="6" rx="2" fill="#ece8de"/>'
  )
}

export function subwayNightWorld(): World {
  const next = random(23)

  // Holes in the bench's back, where it shows left of Claude.
  const perfs = Array.from({ length: 18 }, (_, i) => `M${38 + (i % 3) * 9} ${272 + Math.floor(i / 3) * 12}h3v3h-3z`).join('')
  const ribs = [204, 232, 260, 288, 316, 344, 372, 400, 428].map(x => `M${x} 340V436`).join('')
  const sleepers = Array.from({ length: 47 }, (_, i) => `M${324 + i * 28} 689V706`).join('')
  const seams = Array.from({ length: 15 }, (_, i) => {
    const x = -180 + i * 140

    return `M${x} 751L${f(800 + (x - 800) * 2.4)} 1200`
  }).join('')
  const sheet = '<path d="M-16 -5L14 -7L16 4L-14 6Z" fill="#a9afb4" fill-opacity=".6"/><path d="M-10 -2H8M-9 2H6" stroke="#4d5359" stroke-width="1.4"/>'
  const papers = (
    [
      [90, 806, 0.55],
      [190, 868, 0.7],
      [310, 792, 0.85],
      [60, 930, 1],
      [250, 954, 1.15],
    ] as const
  )
    .map(
      ([x, y, d], i) =>
        `<g transform="translate(${x} ${y})"><g class="sw-pf" style="--d:${d}s;--dx:${1750 + i * 60}px;--dy:${-120 - i * 30}px">` +
        `<g class="sw-pr" style="animation-delay:${f(-i * 0.7)}s">${sheet}</g></g></g>`,
    )
    .join('')
  const wind = [762, 800, 836, 874, 912]
    .map((y, i) => `<path class="sw-wd" style="animation-delay:${f(-i * 0.23)}s" d="M0 ${y}H${240 + (i % 2) * 80}" stroke="#cfd6dc" stroke-opacity=".14" stroke-width="2"/>`)
    .join('')
  const spill = (x: number): string => `<path d="M${x} 719H${x + DW}L${x + DW + 70} 1010H${x - 70}Z" fill="url(#sw-spg)"/>`
  const dust = (x0: number, w: number): string =>
    Array.from({ length: 6 }, () => {
      const style = `--t:${f(7 + next() * 6)}s;--dx:${f((next() - 0.5) * 60)}px;--dy:${f(-20 - next() * 40)}px;animation-delay:${f(-next() * 8)}s`

      return `<circle class="sw-ds" style="${style}" cx="${f(x0 + next() * w)}" cy="${f(130 + next() * 420)}" r="${f(1.2 + next() * 1.2)}" fill="#dfe9e4" fill-opacity=".5"/>`
    }).join('')
  // Sparks from the snapped end of the failing tube, where it hangs once it has dropped.
  const sparks = [0, 1, 2, 3, 4]
    .map(i => `<circle class="sw-spk" style="--dx:${(i - 2) * 20}px;animation-delay:${f(0.45 + i * 0.3)}s" cx="${1492 + (i % 2) * 6}" cy="${138 + (i % 3) * 3}" r="2.2" fill="#ffe9a0"/>`)
    .join('')
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6

    return `M${f(Math.sin(a) * 26)} ${f(-Math.cos(a) * 26)}L${f(Math.sin(a) * 31)} ${f(-Math.cos(a) * 31)}`
  }).join('')
  const ring = (s: number, w: number): string =>
    `<path transform="translate(${f(115 * (1 - s))} ${f(610 * (1 - s))}) scale(${s})" d="${ARC}" fill="none" stroke="#161a1f" stroke-width="${f(w / s)}"/>`
  // Work lamps down both walls of the tunnel, smaller and dimmer as they go in.
  const lamps = [0.82, 0.66, 0.52, 0.4, 0.3]
    .map(s =>
      [-60, 290]
        .map(x => `<circle cx="${f(115 + (x - 115) * s)}" cy="${f(610 - 140 * s)}" r="${f(3.4 * s)}" fill-opacity="${f(0.15 + 0.5 * s)}"/>`)
        .join(''),
    )
    .join('')
  const lamp = (cls: string, cy: number, color: string): string =>
    `<g class="${cls}"><circle cx="296" cy="${cy}" r="15" fill="${color}" fill-opacity=".22"/><circle cx="296" cy="${cy}" r="6" fill="${color}"/></g>`
  const dotted = (cls: string, color: string, inner: string): string =>
    `<g class="${cls}" fill="none" stroke="${color}" stroke-width="4.6" stroke-dasharray="4.6 2.4" stroke-linecap="round">${inner}</g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#05070a',
      furniture: BENCH,
      metal: '#262d35',
      paper: '#d8dce0',
      light: { idle: '#a4964e', work: YEL, bright: '#fff3c0' },
      headTop: 214,
      glowAt: [358, 284],
      device,
      wear: {
        front:
          // The hood up, its opening above the eyes; the strings hang outside the eyes' columns.
          '<path d="M60 300V256C60 230 96 216 150 216C204 216 240 230 240 256V300H210V250C192 242 108 242 90 250V300Z" fill="#2f3846" stroke="#4b586a" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M90 300V250C108 242 192 242 210 250V300" fill="none" stroke="#5b697c" stroke-width="2"/>' +
          '<path d="M95 300V331M205 300V331" stroke="#e8e1c4" stroke-width="3"/><path d="M92.5 329h5v7h-5zM202.5 329h5v7h-5z" fill="#c9c09c"/>' +
          // Headphones over the hood, a yellow light on each cup.
          '<path d="M58 254C56 198 244 198 242 254" fill="none" stroke="#101418" stroke-width="7" stroke-linecap="round"/>' +
          '<path d="M68 234C82 210 218 210 232 234" fill="none" stroke="#3b4552" stroke-width="2"/>' +
          '<g fill="#101418" stroke="#3b4552" stroke-width="2"><rect x="46" y="244" width="22" height="38" rx="7"/><rect x="232" y="244" width="22" height="38" rx="7"/></g>' +
          `<g fill="${YEL}"><circle cx="57" cy="263" r="3"/><circle cx="243" cy="263" r="3"/></g>`,
      },
      seatArt:
        // A steel platform bench: a perforated back, the seat, cast legs, an armrest at the end.
        `<path d="M30 262H232V344H30Z" fill="${BENCH}" stroke="${BENCH_EDGE}" stroke-width="2"/>` +
        `<path d="${perfs}" fill="#0b0e11"/>` +
        `<path d="M26 348H212V362H26Z" fill="#38424c" stroke="${BENCH_EDGE}" stroke-width="2"/>` +
        '<path d="M30 352H208" stroke="#5a6672" stroke-width="1.5"/>' +
        '<path d="M44 362H60L62 450H42ZM174 362H190L192 450H172ZM34 450H70V456H34ZM164 450H200V456H164Z" fill="#1d2329"/>' +
        '<path d="M26 312H48V321H26Z" fill="#38424c"/><path d="M31 321H40V348H31Z" fill="#1d2329"/>',
      tableArt:
        // A hard-shell suitcase on its side: ribs, the zip seam, wheels, the handle pulled up, two stickers.
        `<rect x="176" y="330" width="286" height="116" rx="12" fill="${CASE}" stroke="${CASE_EDGE}" stroke-width="2"/>` +
        `<path d="${ribs}" stroke="#18222d" stroke-width="4"/>` +
        '<path d="M176 388H462" stroke="#18222d" stroke-width="3"/>' +
        '<path d="M180 340V346M458 340V346M180 430V436M458 430V436" stroke="#5a6b7c" stroke-width="6" stroke-linecap="round"/>' +
        '<g fill="#0b0e11"><circle cx="198" cy="450" r="6"/><circle cx="440" cy="450" r="6"/></g>' +
        '<path d="M448 330V258M458 330V258" stroke="#59636e" stroke-width="3"/><rect x="442" y="250" width="22" height="9" rx="3" fill="#161b20" stroke="#3b4550"/>' +
        `<circle cx="228" cy="366" r="13" fill="${YEL}"/>` +
        `<path transform="translate(220 356) scale(.66)" d="${GLYPHS[1]}" fill="none" stroke="#14181c" stroke-width="5" stroke-linecap="round"/>` +
        '<rect x="300" y="398" width="112" height="22" rx="4" fill="#e6e1d0" fill-opacity=".8"/>' +
        `<path d="M308 409H404" stroke="${YEL}" stroke-width="4"/>` +
        '<path d="M317 409a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M353 409a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M389 409a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="#fff" stroke="#14181c" stroke-width="1.4"/>',
    },
    style:
      // The tubes: the right one fails in bursts of three dips, never more than three a second.
      '.sw-fk{animation:sw-fk 7s linear infinite}' +
      '@keyframes sw-fk{0%,14.5%,100%{opacity:1}2%{opacity:.25}4%{opacity:1}7%{opacity:.3}9%{opacity:.95}12%{opacity:.2}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: on an error the small tubes come back three times in 1.5 s, the big
      // pools of light only dim once.
      '.st-error .sw-lt{animation:sw-err 1.5s linear infinite}' +
      '@keyframes sw-err{0%{opacity:.4}6%{opacity:1}12%{opacity:.15}22%{opacity:.9}34%{opacity:.2}44%{opacity:.85}58%{opacity:.1}70%,100%{opacity:.4}}' +
      '.st-error .sw-pl{animation:sw-dim .6s ease-out both}@keyframes sw-dim{to{opacity:.5}}' +
      '.sw-spk{opacity:0}.st-error .sw-spk{animation:sw-spk 1.5s ease-in infinite}' +
      '@keyframes sw-spk{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}100%{opacity:0;transform:translate(var(--dx),170px)}}' +
      '.st-error .sw-snap{animation:sw-snap 1.2s cubic-bezier(.4,0,.6,1) .12s both}' +
      '@keyframes sw-snap{0%{transform:rotate(0)}30%{transform:rotate(27deg)}48%{transform:rotate(18deg)}64%{transform:rotate(25deg)}80%{transform:rotate(21deg)}100%{transform:rotate(23deg)}}' +
      // The clock ticks; what hangs from the ceiling sways in the express's wind.
      '.sw-sec{animation:mv-spin 60s steps(60) infinite}' +
      '.st-run .sw-swg{animation:sw-swg .8s ease-in-out infinite alternate}@keyframes sw-swg{from{transform:rotate(-1.8deg)}to{transform:rotate(1.8deg)}}' +
      // The signal: red when nothing comes, amber while Claude works, green for a train.
      '.sw-sa,.sw-sg{opacity:0}' +
      '.st-thinking .sw-sa,.st-responding .sw-sa,.st-tool .sw-sa,.st-read .sw-sa,.st-web .sw-sa{opacity:1}' +
      '.st-thinking .sw-sr,.st-responding .sw-sr,.st-tool .sw-sr,.st-read .sw-sr,.st-web .sw-sr,.st-run .sw-sr,.st-done .sw-sr{opacity:0}' +
      '.st-run .sw-sg,.st-done .sw-sg{opacity:1}' +
      '.st-tool .sw-sa{animation:sw-bl 1s steps(1) infinite}.st-error .sw-sr{animation:sw-bl .8s steps(1) infinite}' +
      '@keyframes sw-bl{50%{opacity:.12}}' +
      // The tunnel: a far train glows and fades while Claude thinks; the express lights it before it bursts out.
      '.sw-far{opacity:0}.st-thinking .sw-far{animation:sw-far 2.6s ease-in-out infinite alternate}@keyframes sw-far{to{opacity:.75}}' +
      '.sw-apr{opacity:0}.st-run .sw-apr{animation:sw-apr 6.5s ease-out infinite}' +
      '@keyframes sw-apr{0%{opacity:0}5%{opacity:.85}9%{opacity:1}17%{opacity:.3}26%,100%{opacity:0}}' +
      // The express: seven cars at full speed, one every 6.5 s while the command runs.
      '.sw-rt,.sw-dt{display:none}.st-run .sw-rt,.st-done .sw-dt{display:inline}' +
      '.st-run .sw-rm{animation:sw-rm 6.5s linear infinite}@keyframes sw-rm{0%{transform:translateX(-1100px)}62.5%,100%{transform:translateX(9150px)}}' +
      // The last train comes in and stops; its doors open on warm light that spills over the platform.
      '.st-done .sw-dt{animation:sw-arr 1.9s cubic-bezier(.25,.46,.45,.94) both}@keyframes sw-arr{from{transform:translateX(-2900px)}to{transform:translateX(0)}}' +
      '.st-done .sw-dl{animation:sw-dl .5s ease-in-out 1.95s both}@keyframes sw-dl{to{transform:translateX(-34px)}}' +
      '.st-done .sw-dr{animation:sw-dr .5s ease-in-out 1.95s both}@keyframes sw-dr{to{transform:translateX(34px)}}' +
      '.sw-in{opacity:.12}.st-done .sw-in{animation:sw-on .7s ease-out 1.95s both}@keyframes sw-on{from{opacity:.12}to{opacity:1}}' +
      '.sw-sp{opacity:0}.st-done .sw-sp{animation:sw-up .9s ease-out 2.05s both}@keyframes sw-up{from{opacity:0}to{opacity:1}}' +
      // The departure board: its status line changes with the state; a scan runs over it while Claude works.
      '.sw-b2,.sw-b3,.sw-b4{opacity:0}.st-run .sw-b1,.st-error .sw-b1,.st-done .sw-b1{opacity:0}' +
      '.st-run .sw-b2{opacity:1;animation:sw-bl 1s steps(1) infinite}.st-error .sw-b3{opacity:1;animation:sw-bl 1.2s steps(1) infinite}.st-done .sw-b4{opacity:1}' +
      '.sw-scan{opacity:0}.st-responding .sw-scan,.st-tool .sw-scan{opacity:1;animation:sw-scan 2.2s linear infinite}.st-tool .sw-scan{animation-duration:.9s}' +
      '@keyframes sw-scan{from{transform:translateX(0)}to{transform:translateX(176px)}}' +
      // The sign's dot runs the line while Claude reads; the speaker calls out on the web.
      '.sw-trk{opacity:0}.st-read .sw-trk{opacity:1;animation:sw-trk 2.4s ease-in-out infinite alternate}@keyframes sw-trk{to{transform:translateX(230px)}}' +
      '.sw-pa{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .sw-pa{animation:sw-pa 1.5s ease-out infinite}' +
      '@keyframes sw-pa{0%{opacity:0;transform:scale(.3)}20%{opacity:.7}100%{opacity:0;transform:scale(1.5)}}' +
      // Papers on the platform, and the wind that takes them.
      '.sw-pr{transform-box:fill-box;transform-origin:center;animation:sw-rock 3.4s ease-in-out infinite alternate}@keyframes sw-rock{from{transform:rotate(-3deg)}to{transform:rotate(4deg)}}' +
      '.st-run .sw-pr{animation:mv-spin .6s linear infinite}' +
      '.st-run .sw-pf{animation:sw-pf 2.2s cubic-bezier(.55,0,.85,.7) var(--d) both}' +
      '@keyframes sw-pf{0%{transform:translate(0,0)}35%{transform:translate(calc(var(--dx) * .22),var(--dy))}100%{transform:translate(var(--dx),calc(var(--dy) * .3))}}' +
      '.sw-wd{opacity:0}.st-run .sw-wd{animation:sw-wd 1.1s linear infinite}@keyframes sw-wd{0%{opacity:0;transform:translateX(-400px)}25%,70%{opacity:1}100%{opacity:0;transform:translateX(1500px)}}' +
      '.sw-fp{opacity:0}.st-run .sw-fp{animation:sw-fp 1.5s ease-in var(--d) both}' +
      '@keyframes sw-fp{0%{opacity:0;transform:translate(0,0)}12%{opacity:.85}100%{opacity:.85;transform:translate(var(--dx),var(--dy))}}' +
      // The rat bolts along the edge.
      '.sw-rat{opacity:0}.st-error .sw-rat{animation:sw-rat 2.6s cubic-bezier(.35,0,.65,1) .25s both}' +
      '@keyframes sw-rat{0%{opacity:0;transform:translateX(0)}6%{opacity:1}94%{opacity:1;transform:translateX(-1540px)}100%{opacity:0;transform:translateX(-1600px)}}' +
      '.sw-gait{animation:sw-gait .14s ease-in-out infinite alternate}@keyframes sw-gait{to{transform:translateY(-3px)}}' +
      // Dust in the light, a drip from the ceiling, the little train on the laptop's map.
      '.sw-ds{animation:sw-ds var(--t) ease-in-out infinite alternate}@keyframes sw-ds{to{transform:translate(var(--dx),var(--dy))}}' +
      '.sw-drp{animation:sw-drp 3.6s ease-in infinite}' +
      '@keyframes sw-drp{0%{opacity:0;transform:translateY(0)}6%{opacity:.8}38%{opacity:.8;transform:translateY(752px)}39%,100%{opacity:0;transform:translateY(752px)}}' +
      '.sw-rip{transform-box:fill-box;transform-origin:center;opacity:0;animation:sw-rip 3.6s ease-out infinite}' +
      '@keyframes sw-rip{0%,38%{opacity:0;transform:scale(.2)}41%{opacity:.6}75%,100%{opacity:0;transform:scale(1.7)}}' +
      '.sw-mk{animation:sw-mk 3.2s ease-in-out infinite alternate}.sw-mkf{animation-duration:.7s}@keyframes sw-mk{to{transform:translateX(16px)}}',
    scenery:
      '<defs>' +
      '<pattern id="sw-tl" width="56" height="28" patternUnits="userSpaceOnUse"><rect width="56" height="28" fill="#151b20"/>' +
      '<path d="M0 .8H56M0 14.8H56M.8 0V14M28.8 14V28" stroke="#0a0d10" stroke-width="1.6"/><path d="M3 3.5H25M31 17.5H53" stroke="#232b32" stroke-width="1.2"/></pattern>' +
      '<pattern id="sw-tac" width="12" height="7" patternUnits="userSpaceOnUse"><rect width="12" height="7" fill="#1b1d17"/><circle cx="6" cy="3.5" r="2.2" fill="#3a3722"/></pattern>' +
      '<linearGradient id="sw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020304" stop-opacity=".6"/><stop offset=".3" stop-color="#020304" stop-opacity=".1"/>' +
      '<stop offset=".75" stop-color="#020304" stop-opacity=".2"/><stop offset="1" stop-color="#020304" stop-opacity=".7"/></linearGradient>' +
      `<linearGradient id="sw-yl" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${YEL}" stop-opacity=".95"/>` +
      `<stop offset=".22" stop-color="${YEL}" stop-opacity=".9"/><stop offset=".33" stop-color="${YEL}" stop-opacity=".45"/><stop offset=".67" stop-color="${YEL}" stop-opacity=".45"/>` +
      `<stop offset=".78" stop-color="${YEL}" stop-opacity=".9"/><stop offset="1" stop-color="${YEL}" stop-opacity=".95"/></linearGradient>` +
      '<linearGradient id="sw-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0e11"/><stop offset="1" stop-color="#10141a"/></linearGradient>' +
      '<radialGradient id="sw-pool"><stop offset="0" stop-color="#d6efe6" stop-opacity=".2"/><stop offset=".35" stop-color="#d6efe6" stop-opacity=".085"/><stop offset="1" stop-color="#d6efe6" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sw-tg"><stop offset="0" stop-color="#e8fff6" stop-opacity=".55"/><stop offset="1" stop-color="#e8fff6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sw-vg" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse"><stop offset=".24" stop-color="#020305" stop-opacity="0"/>' +
      '<stop offset=".35" stop-color="#020305" stop-opacity=".34"/><stop offset=".5" stop-color="#020305" stop-opacity=".44"/><stop offset=".65" stop-color="#020305" stop-opacity=".34"/>' +
      '<stop offset=".76" stop-color="#020305" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sw-tun" x1="-80" y1="0" x2="310" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#010203" stop-opacity=".97"/>' +
      '<stop offset=".6" stop-color="#010203" stop-opacity=".82"/><stop offset="1" stop-color="#010203" stop-opacity=".2"/></linearGradient>' +
      '<radialGradient id="sw-hl"><stop offset="0" stop-color="#fff6d8" stop-opacity=".7"/><stop offset=".35" stop-color="#ffe29a" stop-opacity=".3"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sw-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3c8" stop-opacity=".34"/><stop offset="1" stop-color="#fff3c8" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="sw-spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WARM}" stop-opacity=".42"/><stop offset="1" stop-color="${WARM}" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="sw-rf"><stop offset="0" stop-color="#d6efe6" stop-opacity=".16"/><stop offset="1" stop-color="#d6efe6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sw-rg" x1="330" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sw-cn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>' +
      `<radialGradient id="sw-bg"><stop offset="0" stop-color="${YEL}" stop-opacity=".12"/><stop offset="1" stop-color="${YEL}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="sw-cg"><stop offset="0" stop-color="#d6efe6" stop-opacity=".2"/><stop offset="1" stop-color="#d6efe6" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The ceiling and the far wall: tiles, a band of yellow tiles, the station's name, the posters.
      '<rect width="1600" height="98" fill="#07090b"/><path d="M0 22H1600M0 36H1600" stroke="#0f1317" stroke-width="5"/>' +
      '<rect x="336" y="96" width="1264" height="546" fill="url(#sw-tl)"/><rect x="336" y="96" width="1264" height="546" fill="url(#sw-wall)"/>' +
      '<path d="M0 97H1600" stroke="#151a1f" stroke-width="4"/>' +
      '<rect x="336" y="382" width="1264" height="16" fill="#4f441b"/><path d="M336 390H1600" stroke="#2c260f" stroke-width="16" stroke-dasharray="2 26"/>' +
      '<rect x="336" y="402" width="1264" height="3" fill="#3a3214"/>' +
      sign(700, 284, false) +
      '<rect x="430" y="452" width="150" height="136" fill="#0c1014" stroke="#2a3138" stroke-width="4"/><circle cx="505" cy="506" r="30" fill="#1a2128"/>' +
      '<rect x="720" y="452" width="240" height="136" fill="#0c1014" stroke="#2a3138" stroke-width="4"/><path d="M740 570L820 470M790 570L870 470M840 570L920 470" stroke="#1a2128" stroke-width="12"/>' +
      '<g class="mv-r">' +
      sign(1240, 284, true) +
      '<rect x="1236" y="452" width="210" height="136" fill="#101a28" stroke="#2a3138" stroke-width="4"/>' +
      `<circle cx="1296" cy="504" r="30" fill="${YEL}" fill-opacity=".55"/>` +
      '<path d="M1250 560Q1290 540 1330 560T1410 560T1450 560" fill="none" stroke="#5ec8e0" stroke-opacity=".45" stroke-width="3"/>' +
      `<g fill="none" stroke="#e9edf0" stroke-opacity=".5" stroke-width="5">${glyphRow([5, 2, 0], 1350, 476, 0.6, 22)}</g>` +
      '</g>' +
      '<rect x="336" y="624" width="1264" height="18" fill="#0b0e11"/>' +
      // The tunnel's dark, its rings, the far glow.
      `<path d="${ARCH}" fill="#020304"/>` +
      ring(0.82, 5) +
      ring(0.66, 4) +
      ring(0.52, 3) +
      ring(0.4, 2.4) +
      ring(0.3, 2) +
      '<circle cx="40" cy="596" r="2.6" fill="#ff5a4a" fill-opacity=".8"/>' +
      // The trench: cables, the covered third rail, the running rails, the sleepers.
      '<rect x="310" y="640" width="1290" height="70" fill="#060709"/>' +
      '<path d="M310 652H1600" stroke="#15191d" stroke-width="3"/><path d="M310 659H1600" stroke="#121518" stroke-width="2"/>' +
      '<rect x="-100" y="666" width="1700" height="6" fill="#2c2b22"/>' +
      `<path d="${sleepers}" stroke="#101316" stroke-width="9"/>` +
      '<path d="M-100 686H1600M-100 700H1600" stroke="#3a424b" stroke-width="3"/>' +
      '<path d="M-100 684.5H1600M-100 698.5H1600" stroke="#9aa4ae" stroke-opacity=".28" stroke-width="1"/>' +
      // The trains: the express while a command runs, the last train when it is done.
      `<g class="sw-rt"><g class="sw-rm">${train(7, 0, true)}</g></g>` +
      `<g class="sw-dt">${train(3, STOP, false)}</g>` +
      // The tunnel's mouth over them: the dark they come out of, the headlights' glow, the tiled arch.
      `<path d="${ARCH}" fill="url(#sw-tun)"/>` +
      '<ellipse class="sw-far" cx="60" cy="610" rx="150" ry="100" fill="url(#sw-hl)"/>' +
      `<g fill="#ffcf7a">${lamps}</g>` +
      '<ellipse class="sw-apr" cx="140" cy="610" rx="240" ry="170" fill="url(#sw-hl)"/>' +
      '<path class="sw-apr" d="M330 684.5H1200M330 698.5H1200" stroke="url(#sw-rg)" stroke-width="2.4"/>' +
      `<path d="M-200 -200H336V706H-200Z${ARCH}" fill-rule="evenodd" fill="url(#sw-tl)"/>` +
      `<path d="M-200 -200H336V706H-200Z${ARCH}" fill-rule="evenodd" fill="#020304" fill-opacity=".34"/>` +
      '<path d="M-91 706V430A206 191 0 0 1 321 430V706" fill="none" stroke="#5b4e1c" stroke-width="20" stroke-dasharray="26 3"/>' +
      `<path d="${ARC}" fill="none" stroke="#8c7a2c" stroke-opacity=".7" stroke-width="2"/>` +
      '<path d="M101 226H129L125 262H105Z" fill="#8c7a2c"/>' +
      '<rect x="336" y="96" width="20" height="546" fill="url(#sw-cn)"/>' +
      '<path d="M296 594V706" stroke="#0d1013" stroke-width="4"/><rect x="283" y="536" width="26" height="58" rx="5" fill="#040506" stroke="#2a3036" stroke-width="2"/>' +
      lamp('sw-sr', 552, '#ff4d4d') +
      lamp('sw-sa', 552, '#ffb340') +
      lamp('sw-sg', 578, '#5fe08a') +
      // Our platform: the edge, the yellow line, the studs, the floor and what lies on it.
      '<g class="mv-b">' +
      '<rect x="-20" y="706" width="1640" height="13" fill="#252a30"/><path d="M-20 707H1620" stroke="#525b64" stroke-opacity=".7" stroke-width="2"/>' +
      '<rect x="-20" y="719" width="1640" height="16" fill="url(#sw-yl)"/>' +
      '<rect x="-20" y="737" width="1640" height="14" fill="url(#sw-tac)"/>' +
      '<rect x="-20" y="751" width="1640" height="460" fill="url(#sw-fl)"/>' +
      `<path d="${seams}" stroke="#151a1f" stroke-width="2"/>` +
      '<ellipse cx="145" cy="790" rx="150" ry="22" fill="url(#sw-rf)"/><g class="mv-r"><ellipse cx="1405" cy="790" rx="150" ry="22" fill="url(#sw-rf)"/></g>' +
      `<g class="sw-sp">${spill(338)}${spill(1186)}${spill(1338)}` +
      `<ellipse cx="376" cy="727" rx="80" ry="10" fill="${WARM}" fill-opacity=".3"/><ellipse cx="1224" cy="727" rx="80" ry="10" fill="${WARM}" fill-opacity=".3"/>` +
      `<ellipse cx="1376" cy="727" rx="80" ry="10" fill="${WARM}" fill-opacity=".3"/></g>` +
      '<ellipse cx="214" cy="852" rx="46" ry="7" fill="#1b2228" fill-opacity=".7"/>' +
      '<ellipse class="sw-rip" cx="214" cy="852" rx="30" ry="5" fill="none" stroke="#9fb0bb" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<g class="sw-drp"><ellipse cx="214" cy="100" rx="2.2" ry="4" fill="#bcd0da"/></g>' +
      papers +
      wind +
      '<g transform="translate(1480 727)"><g class="sw-rat"><g class="sw-gait"><g transform="scale(2.2)">' +
      '<path d="M17 -4Q30 -2 34 -10Q38 -16 46 -12" fill="none" stroke="#4a5058" stroke-width="2" stroke-linecap="round"/>' +
      '<g fill="#16181b" stroke="#8a929a" stroke-opacity=".6" stroke-width="1.2"><path d="M-16 -6Q-10 -14 4 -13Q16 -12 18 -4Q18 0 12 0H-12Q-18 -1 -16 -6Z"/>' +
      '<path d="M-16 -6L-26 -3L-15 -1Z"/><circle cx="-10" cy="-12" r="3.4"/></g>' +
      '<path d="M-8 0V3M8 0V3" stroke="#16181b" stroke-width="2.4"/><circle cx="-18" cy="-6.5" r="1.3" fill="#ffe27a"/></g></g></g></g>' +
      pillar(600, 62, false, 0.4) +
      '</g>' +
      // The tubes' pools of light, and the dark the middle of the station keeps.
      '<ellipse class="sw-pl" cx="150" cy="80" rx="560" ry="780" fill="url(#sw-pool)"/>' +
      '<g class="mv-r"><ellipse class="sw-pl" cx="1405" cy="80" rx="520" ry="780" fill="url(#sw-pool)"/></g>' +
      '<rect x="-100" y="-100" width="1800" height="1200" fill="url(#sw-vg)"/>' +
      // The pillar by the bench, with the speaker that calls out.
      '<g class="mv-r"><g class="mv-b">' +
      pillar(1112, 64, true, 0.92) +
      '<path d="M1112 220L1090 210V246L1112 236Z" fill="#14181c" stroke="#2f363e" stroke-width="2"/>' +
      '<g fill="none" stroke="#dfe6ea" stroke-width="2.4">' +
      [0, 0.5, 1].map(d => `<circle class="sw-pa" style="animation-delay:${d}s" cx="1084" cy="228" r="16"/>`).join('') +
      '</g></g></g>' +
      // The fixtures: the left tube, two dead ones over the middle, the failing one on the right.
      tube(40, 210, 'sw-lt') +
      tube(560, 180, '') +
      tube(860, 180, '') +
      // The clock over the tunnel, at midnight.
      '<g transform="translate(115 96)"><g class="sw-swg"><g transform="translate(-115 -96)">' +
      '<path d="M115 96V120" stroke="#1b2126" stroke-width="4"/><g transform="translate(115 158)">' +
      '<circle r="46" fill="url(#sw-cg)"/><circle r="37" fill="#cfd5d9" fill-opacity=".82" stroke="#1a1f24" stroke-width="6"/>' +
      `<path d="${ticks}" stroke="#1a1f24" stroke-width="3"/>` +
      '<path d="M0 4V-17" stroke="#0b0d10" stroke-width="5" stroke-linecap="round" transform="rotate(-3)"/>' +
      '<path d="M0 5V-27" stroke="#0b0d10" stroke-width="3.4" stroke-linecap="round" transform="rotate(-1)"/>' +
      '<g class="sw-sec"><path d="M0 7V-30" stroke="#d94a3a" stroke-width="1.6"/></g><circle r="3" fill="#0b0d10"/></g></g></g></g>' +
      // The departure board, hung over the far end of the platform.
      '<g class="mv-r"><g transform="translate(1395 30)"><g class="sw-swg"><g transform="translate(-1395 -30)">' +
      '<ellipse cx="1395" cy="158" rx="200" ry="74" fill="url(#sw-bg)"/>' +
      '<path d="M1290 30V116M1500 30V116" stroke="#1c2227" stroke-width="3"/>' +
      '<rect x="1252" y="116" width="286" height="84" rx="3" fill="#050608" stroke="#2b3239" stroke-width="3"/>' +
      dotted('', YEL, glyphRow([2, 0, 5, 1, 3, 4, 0, 2, 5, 1], 1264, 126, 0.55, 16.5)) +
      `<rect x="1476" y="124" width="46" height="24" rx="4" fill="${YEL}" fill-opacity=".9"/>` +
      `<path transform="translate(1491 127) scale(.55)" d="${GLYPHS[1]}" fill="none" stroke="#050608" stroke-width="6"/>` +
      dotted('sw-b1', YEL, glyphRow([3, 1, 4, 5], 1264, 162, 0.55, 16.5)) +
      dotted('sw-b2', YEL, '<path transform="translate(1264 162)" d="M0 0L9 9L0 18M15 0L24 9L15 18M30 0L39 9L30 18M45 0L54 9L45 18"/>') +
      dotted('sw-b3', '#ff7a4a', `<path transform="translate(1264 162)" d="M9 0L18 9L9 18L0 9ZM3 15L15 3"/>${glyphRow([2, 4], 1290, 162, 0.55, 16.5)}`) +
      dotted('sw-b4', '#7be08f', '<path transform="translate(1264 162)" d="M0 9H44M50 0V18M57 0V18"/>') +
      dotted('', YEL, glyphRow([5, 0], 1480, 162, 0.55, 16.5)) +
      '<rect class="sw-scan" x="1262" y="122" width="10" height="72" fill="#fff6c8" fill-opacity=".3"/>' +
      '</g></g></g></g>' +
      // The failing tube in front of it: on an error its right rod gives and it swings down, sparking.
      '<g class="mv-r"><path d="M1324 30V62M1486 30V46" stroke="#1a1f24" stroke-width="2.4"/>' +
      '<g transform="translate(1324 66)"><g class="sw-snap"><g transform="translate(-1324 -66)">' +
      `<path d="M1486 52V62" stroke="#1a1f24" stroke-width="2.4"/>${tube(1300, 210, 'sw-lt sw-fk', false)}</g></g></g>` +
      `${sparks}</g>` +
      // Dust turning in the light.
      dust(20, 380) +
      `<g class="mv-r">${dust(1220, 360)}</g>`,
    nook:
      // The shadow under the bench and the suitcase, and a wire bin at the bench's end.
      '<ellipse cx="250" cy="456" rx="240" ry="10" fill="#000" fill-opacity=".45"/>' +
      '<path d="M-6 392H32L28 456H-2Z" fill="#12161a" stroke="#2e353d" stroke-width="2"/>' +
      '<path d="M4 398L6 452M13 398V452M22 398L20 452" stroke="#2e353d" stroke-width="2"/>' +
      '<path d="M-10 388H36V394H-10Z" fill="#2e353d"/>' +
      '<path d="M2 388Q8 374 18 383Q26 377 30 388Z" fill="#a9afb4" fill-opacity=".5"/>',
    front: [
      [-160, 404, 0.75, 760, -40],
      [-120, 372, 1.05, 720, -80],
    ]
      .map(
        ([x, y, d, dx, dy]) =>
          `<g transform="translate(${x} ${y})"><g class="sw-fp" style="--d:${d}s;--dx:${dx}px;--dy:${dy}px"><g class="sw-pr">${sheet}</g></g></g>`,
      )
      .join(''),
  }
}
