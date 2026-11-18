import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Lighthouse Coast: a rocky headland on a stormy night. A tall lighthouse on the cliff sweeps its beam slowly over
// the sea, surf breaks on the rocks below it, a coaster rides the swell far out. Claude keeps watch from the porch
// of the keeper's cottage in a yellow sou'wester. When a command runs a huge wave bursts up the cliff; on an error
// the lamp sputters out and the ship drifts onto the reef firing a flare; done relights it and the ship steams clear.
const LAMP = '#ffd66b'
const LAMP_HOT = '#fff3c8'
const BRASS = '#b08a3a'
const WOOD = '#2c2117'
const WOOD_EDGE = '#46341f'
const ROCK = '#060b0f'
const HAT = '#d7a733'
const HAT_SHADE = '#96701d'
const HAT_LIT = '#f3d06a'
const COAT = '#c39328'

// The lighthouse is drawn in its own coordinates and placed by SHIFT, clear of the crop at both window extremes.
const SHIFT = 'translate(36 20)'

// The lamp, in the lighthouse's coordinates (picture 266, 210): the beam turns about it and fades out by BEAM_END
// (picture x 1060).
const LX = 230
const LY = 190
const BEAM_END = 1024

// The tower: its foot just under the headland's ridge (picture y 552), its top under the gallery, narrowing by NAR.
const TB = 532
const TT = 232
const BL = 162
const BR = 298
const NAR = 28
const inset = (y: number): number => ((TB - y) / (TB - TT)) * NAR
const band = (low: number, high: number): string =>
  `M${f(BL + inset(high))} ${high}L${f(BR - inset(high))} ${high}L${f(BR - inset(low))} ${low}L${f(BL + inset(low))} ${low}Z`

/** A rolling swell and its crest line, wide enough to slide one period left without a seam. */
function swell(y: number, amp: number, p: number, fill: string): { fill: string; crest: string } {
  const n = Math.ceil((1600 + 2 * p) / (p / 2))
  const d = `M${-p} ${y}q${f(p / 4)} ${f(-amp * 2)} ${f(p / 2)} 0${`t${f(p / 2)} 0`.repeat(n - 1)}`

  return {
    fill: `<path d="${d}V1200H${-p}Z" fill="${fill}"/>`,
    crest: `<path d="${d}" fill="none" stroke="#7fb8c8" stroke-opacity=".22" stroke-width="2"/>`,
  }
}

const SWELLS = [
  { y: 574, amp: 5, p: 240, fill: '#0a1820', secs: 40, bob: 5 },
  { y: 618, amp: 10, p: 360, fill: '#0c1f29', secs: 31, bob: 6 },
  { y: 684, amp: 18, p: 500, fill: '#0f2631', secs: 24, bob: 5.2 },
  { y: 772, amp: 28, p: 680, fill: '#122d3a', secs: 18, bob: 6.6 },
  { y: 878, amp: 38, p: 880, fill: '#153443', secs: 14, bob: 5.8 },
]

/** A small coaster with its bow to the right, waterline at y 0: hull, bridge aft, funnel, a mast and its lights. */
function ship(): string {
  return (
    '<g fill="#03070a" stroke="#2d5a6a" stroke-opacity=".45" stroke-width="1.4" stroke-linejoin="round">' +
    '<path d="M-66 -7H56L74 -16L64 9H-60Z"/><path d="M-52 -7V-25H-16V-7Z"/><path d="M-48 -25V-33H-24V-25Z"/>' +
    '<path d="M-42 -33L-40 -48H-30L-30 -33Z"/><path d="M30 -7V-50M30 -40L58 -12M30 -40L4 -12" fill="none"/></g>' +
    `<g fill="${LAMP}" fill-opacity=".8">${[-48, -40, -32, -24].map(x => `<rect x="${x}" y="-20" width="4" height="3"/>`).join('')}</g>` +
    '<circle cx="30" cy="-50" r="9" fill="#fff3c8" fill-opacity=".14"/><circle cx="30" cy="-50" r="2.2" fill="#fff6dc"/>' +
    '<circle cx="64" cy="-11" r="2" fill="#ff7a5c"/><circle cx="-60" cy="-9" r="1.8" fill="#fff6dc" fill-opacity=".8"/>' +
    // Dressed overall when it is done: a string of lamps from stern to masthead to bow.
    '<path class="lh-dress" style="--d:.4s" d="M-62 -9L30 -50L70 -15" fill="none" stroke="#3a5560" stroke-width=".8"/>' +
    `<path class="lh-dress" style="--d:.9s" d="M-62 -9L30 -50L70 -15" fill="none" stroke="${LAMP}" stroke-opacity=".22" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
    [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.15, 1.35, 1.55, 1.75]
      .map((t, i) => {
        const [x, y] = t <= 1 ? [-62 + 92 * t, -9 - 41 * t] : [30 + 40 * (t - 1) / 0.8, -50 + 35 * (t - 1) / 0.8]

        return `<circle class="lh-dress" style="--d:${f(0.5 + i * 0.12)}s" cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${i % 2 ? '#ffe9b0' : LAMP}"/>`
      })
      .join('') +
    // The signal lamp on the bridge, which talks while Claude is on the web.
    '<circle class="lh-sig" cx="-36" cy="-36" r="4.6" fill="#f4fbff"/><circle class="lh-sig" cx="-36" cy="-36" r="20" fill="#f4fbff" fill-opacity=".24"/>'
  )
}

/** The keeper's radio set, a keyboard and a little Fresnel lens lamp. No gradients: the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${250 + i * 13}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const out = activity === 'error'
  const ribs = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const half = 19 - Math.abs(i - 2.5) * 3.2
      const y = 264 + i * 8.6

      return `<rect x="${f(394 - half)}" y="${f(y)}" width="${f(half * 2)}" height="7.6" rx="3" fill="${LAMP}" fill-opacity="${out ? '.1' : '.34'}" stroke="${BRASS}" stroke-width="1.4"/>`
    })
    .join('')
  const core = out
    ? `<ellipse class="lh-sput" cx="394" cy="290" rx="6" ry="10" fill="${LAMP}" fill-opacity=".45"/>`
    : `<circle cx="394" cy="290" r="26" fill="${LAMP}" fill-opacity=".14"/><circle cx="394" cy="290" r="15" fill="${LAMP}" fill-opacity=".26"/>` +
      `<ellipse cx="394" cy="290" rx="6" ry="10" fill="${LAMP_HOT}"/>`

  return (
    // The keyboard.
    '<rect x="240" y="321" width="92" height="9" rx="2" fill="#2a3237"/>' +
    keys +
    // The radio set: a wooden case, a brass bezel round its screen, two knobs and a speaker grille.
    '<rect x="286" y="238" width="84" height="86" rx="5" fill="#3a2a1b" stroke="#5a4128" stroke-width="2"/>' +
    `<rect x="292" y="245" width="58" height="53" rx="6" fill="${BRASS}"/><rect x="296" y="249" width="50" height="45" rx="4" fill="#090e0c"/>` +
    `<rect x="296" y="249" width="50" height="45" rx="4" fill="${light}" fill-opacity=".16"/>` +
    `<path d="M301 261H331M301 271H340M301 281H324" stroke="${light}" stroke-opacity=".8" stroke-width="2.4"/>` +
    `<g fill="${BRASS}"><circle cx="360" cy="258" r="5"/><circle cx="360" cy="278" r="5"/></g>` +
    '<path d="M360 253V258M360 273V278" stroke="#2a1d10" stroke-width="1.6"/>' +
    '<path d="M296 306H350M296 312H350M296 318H350" stroke="#21170d" stroke-width="2.4"/>' +
    // The Fresnel lens on its brass stand: stacked prism rings round a bright core.
    `<path d="M374 330L379 316H409L414 330Z" fill="${BRASS}"/><rect x="380" y="312" width="28" height="5" fill="#6e5420"/>` +
    core +
    ribs +
    `<path d="M378 264Q394 246 410 264Z" fill="${BRASS}"/><circle cx="394" cy="250" r="2.6" fill="${BRASS}"/>`
  )
}

export function lighthouseCoastWorld(): World {
  const next = random(29)

  const swells = SWELLS.map((s, i) => {
    const w = swell(s.y, s.amp, s.p, s.fill)

    return `<g class="lh-bob" style="animation-duration:${s.bob}s;animation-delay:${f(-i * 1.3)}s"><g style="animation:lh-r${i} ${s.secs}s linear infinite">${w.fill}${w.crest}</g></g>`
  })
  const rollKeys = SWELLS.map((s, i) => `@keyframes lh-r${i}{to{transform:translateX(${-s.p}px)}}`).join('')

  // Storm clouds: a heavy band over the top, a lit underside near the lamp.
  const cloudBank = (x0: number, x1: number, count: number): string =>
    Array.from({ length: count }, (_, i) => {
      const x = x0 + ((x1 - x0) * i) / (count - 1) + (next() - 0.5) * 60
      const y = 30 + next() * 200
      const rx = 120 + next() * 100
      const ry = 44 + next() * 46

      return `<ellipse cx="${f(x)}" cy="${f(y + 6)}" rx="${f(rx + 4)}" ry="${f(ry + 3)}" fill="#122029"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${i % 2 ? '#0a141b' : '#0c1820'}"/>`
    }).join('')

  // Stars that the clearing shows when it is done.
  let stars = ''
  for (let i = 0; i < 26; i += 1) {
    stars += `M${f(-40 + next() * 760)} ${f(10 + next() * 150)}h3v3h-3z`
  }

  // The headland under the lighthouse and the boulders at its foot where the surf breaks.
  const headland =
    'M-80 1000V500L-40 490L8 500L60 486L104 516L150 540L320 544L352 556L372 590L396 604L412 640L436 662L452 700L476 724L500 760V1000Z'
  const strata =
    'M-60 560L40 548L120 572M-40 640L60 620L160 650L260 636M372 590L340 640L360 700M412 640L392 700L420 760M-60 720L80 700L200 730'
  const boulders =
    'M250 806L268 744L300 726L328 738L352 708L384 700L410 722L440 712L470 738L500 732L530 760L562 772L584 806Z'
  const reef = 'M1166 658L1178 630L1192 636L1204 604L1222 620L1236 610L1252 640L1268 628L1290 660Z M1292 666L1302 644L1312 650L1322 634L1340 668Z'

  // The tower's bands, windows and door.
  const tower =
    `<path d="${band(TB, TT)}" fill="url(#lh-tw)"/>` +
    `<path d="${band(352, 318)}${band(470, 436)}" fill="#0b1318" fill-opacity=".85"/>` +
    `<g fill="${LAMP}" fill-opacity=".55"><rect x="225" y="280" width="10" height="16"/><rect x="225" y="392" width="10" height="16"/></g>` +
    '<path d="M216 532V510Q230 494 244 510V532Z" fill="#1e1608"/><path d="M220 532V512Q230 500 240 512V532Z" fill="#ffb84d" fill-opacity=".3"/>'
  const railing = `M178 204H282${Array.from({ length: 9 }, (_, i) => `M${178 + i * 13} 204V222`).join('')}`

  // The big wave and the spray it throws up the cliff.
  const wavePath =
    'M-300 0C-220 -10 -170 -90 -150 -160C-150 -190 -170 -205 -140 -212C-100 -232 -40 -236 0 -214C80 -170 180 -40 320 0Z'
  const crestPath = 'M-150 -170C-156 -196 -168 -204 -140 -212C-100 -232 -40 -236 0 -214C30 -198 60 -170 84 -140'
  const plumeBlobs = [
    [-20, -120, 120, 140],
    [24, -236, 96, 118],
    [-46, -318, 78, 84],
    [62, -96, 104, 76],
    [-92, -58, 88, 58],
    [10, -380, 56, 54],
  ]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#lh-spr)"/>`)
    .join('')
  const drops = Array.from({ length: 16 }, () => {
    const x = (next() - 0.5) * 160
    const y = -80 - next() * 220
    const dx = (next() - 0.5) * 260
    const dy = -40 - next() * 140

    return `<circle class="lh-dr" style="--dx:${f(dx)}px;--dy:${f(dy)}px" cx="${f(x)}" cy="${f(y)}" r="${f(2 + next() * 3.5)}" fill="#e6f3f6" fill-opacity=".85"/>`
  }).join('')
  const splash = (x: number, y: number, s: number, delay: number): string =>
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="lh-sp" style="animation-delay:${delay}s">` +
    '<ellipse cx="0" cy="-34" rx="30" ry="36" fill="url(#lh-spr)"/><ellipse cx="-14" cy="-60" rx="18" ry="24" fill="url(#lh-spr)"/>' +
    '<ellipse cx="0" cy="0" rx="34" ry="5" fill="#d8eef2" fill-opacity=".5"/></g></g>'

  // Fog that rolls in over the water while Claude thinks.
  const fog = Array.from(
    { length: 9 },
    (_, i) => {
      const cx = -60 + i * 210 + next() * 80
      const thick = cx < 360 || cx > 1340

      // Thicker and narrower over the left third and the far right, thin over the chat column.
      return `<ellipse cx="${f(cx)}" cy="${f(600 + next() * 110)}" rx="${f((thick ? 170 : 220) + next() * 100)}" ry="${f(20 + next() * 22)}" fill="#8aa4b0" fill-opacity="${thick ? '.17' : '.07'}"/>`
    },
  ).join('')

  // Stone courses of the cottage wall in the nook.
  let courses = ''
  for (let row = 0; row < 13; row += 1) {
    const y = 60 + row * 30
    courses += `M336 ${y}H440`
    for (let k = 0; k < 3; k += 1) {
      courses += `M${f(350 + k * 34 + (row % 2) * 17)} ${y}v30`
    }
  }

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'none',
      thought: 'puffs',
      ink: '#04090d',
      furniture: WOOD,
      metal: '#2a3237',
      paper: '#e6dcc4',
      light: { idle: '#b08f3e', work: LAMP, bright: '#fff0b8' },
      headTop: 230,
      glowAt: [322, 272],
      device,
      wear: {
        front:
          // The sou'wester: a dome crown and a brim that runs long down the back of the neck. It stops at row 1, so
          // the eyes stay clear; a chin strap runs down the lit side, clear of them.
          `<path d="M86 246C88 226 110 210 150 210C190 210 212 226 214 246Z" fill="${HAT}"/>` +
          `<path d="M86 246C88 230 100 218 120 213C106 224 100 234 102 246Z" fill="${HAT_SHADE}"/>` +
          `<path d="M176 215C196 220 208 230 210 244H200C198 232 190 223 176 215Z" fill="${HAT_LIT}" fill-opacity=".8"/>` +
          `<path d="M88 238C120 232 180 232 212 238" fill="none" stroke="${HAT_SHADE}" stroke-width="2" stroke-dasharray="4 4"/>` +
          // The brim's fill ends at y 252, so its 2px edge stops at 253, above the eyes' highest row (254).
          `<path d="M34 286C40 264 58 250 84 244L216 242C234 242 246 242 254 246C248 250 234 252 216 252L86 252C70 258 56 272 46 292Z" fill="${HAT}" stroke="${HAT_SHADE}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M214 253Q224 278 222 306" fill="none" stroke="#6a4a12" stroke-width="2.4"/>` +
          // The oilskin coat over rows 5-7 (from y 318, below the eyes' lowest row), a V at the neck, a toggle.
          `<path d="M70 318H128L150 338L172 318H230V350H70Z" fill="${COAT}"/>` +
          `<path d="M70 318H90V350H70Z" fill="#04090d" fill-opacity=".3"/><path d="M222 318H230V350H222Z" fill="${HAT_LIT}" fill-opacity=".5"/>` +
          `<path d="M128 318L150 338L172 318M150 338V350" fill="none" stroke="${HAT_SHADE}" stroke-width="2.4"/>` +
          '<rect x="140" y="340" width="20" height="4" rx="2" fill="#3a2a14"/>',
      },
      seatArt:
        // A rope spool: two wooden flanges with turns of hemp between.
        `<rect x="103" y="442" width="96" height="10" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/><ellipse cx="151" cy="452" rx="48" ry="6" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<rect x="112" y="356" width="78" height="88" fill="#6e5a38"/>' +
        `<path d="${Array.from({ length: 9 }, (_, i) => `M112 ${365 + i * 9}H190`).join('')}" stroke="#4a3b23" stroke-width="2"/>` +
        `<path d="${Array.from({ length: 9 }, (_, r) => Array.from({ length: 7 }, (_, k) => `M${118 + k * 10 + (r % 2) * 5} ${364 + r * 9}l4 -7`).join('')).join('')}" stroke="#8c7550" stroke-width="1.6"/>` +
        '<rect x="112" y="356" width="18" height="88" fill="#04090d" fill-opacity=".32"/>' +
        `<rect x="103" y="346" width="96" height="10" fill="#3a2a1c" stroke="${WOOD_EDGE}" stroke-width="1.6"/><ellipse cx="151" cy="347" rx="48" ry="6" fill="#3a2a1c" stroke="#5a4128" stroke-width="1.6"/>` +
        '<ellipse cx="151" cy="347" rx="9" ry="2.4" fill="#120c07"/>',
      tableArt:
        // A weathered plank desk with a drawer and a cross brace.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="164" y="328" width="308" height="14" rx="2"/>` +
        '<rect x="176" y="342" width="284" height="20"/><rect x="180" y="362" width="14" height="94"/><rect x="442" y="362" width="14" height="94"/>' +
        '<rect x="194" y="418" width="248" height="8"/></g>' +
        `<path d="M232 330V342M312 330V342M392 330V342" stroke="#1a130c" stroke-width="1.6"/>` +
        `<rect x="296" y="346" width="84" height="12" rx="2" fill="none" stroke="#1a130c" stroke-width="1.6"/><circle cx="338" cy="352" r="2.6" fill="${BRASS}"/>` +
        `<g fill="${BRASS}"><circle cx="170" cy="335" r="3"/><circle cx="466" cy="335" r="3"/></g>`,
    },
    style:
      rollKeys +
      '.lh-bob{animation:lh-bob 6s ease-in-out infinite alternate}@keyframes lh-bob{from{transform:translateY(-6px)}to{transform:translateY(6px)}}' +
      '.st-error .lh-bob{animation-duration:2.2s!important}' +
      '.lh-cl{animation:lh-cl 46s ease-in-out infinite alternate}.lh-cl2{animation-duration:58s;animation-direction:alternate-reverse}' +
      '@keyframes lh-cl{to{transform:translateX(40px)}}' +
      '.st-error .lh-cl{animation-duration:9s}' +
      // The beam turns about the lamp: seen from the side, a turning beam is one that stretches and folds through
      // the lamp. Soft and slow; when it faces us the lantern glows up over more than a second.
      '.lh-sw{--sw:7s}.st-thinking .lh-sw,.st-read .lh-sw{--sw:9s}.st-responding .lh-sw{--sw:6s}' +
      '.st-tool .lh-sw,.st-web .lh-sw{--sw:4.5s}.st-run .lh-sw{--sw:5s}' +
      // The beam's left edge is the lamp, so its own box pins the pivot wherever the lighthouse sits.
      '.lh-sweep{transform-box:fill-box;transform-origin:0 50%;animation:lh-sweep var(--sw) ease-in-out infinite alternate}' +
      '@keyframes lh-sweep{from{transform:scaleX(1)}to{transform:scaleX(-1)}}' +
      '.lh-flare{opacity:.15;animation:lh-flare calc(var(--sw) * 2) linear infinite}' +
      '@keyframes lh-flare{0%,15%{opacity:.15}25%{opacity:.85}35%,100%{opacity:.15}}' +
      '.lh-lens{animation:lh-lens calc(var(--sw) * 2) linear infinite}@keyframes lh-lens{from{transform:translateX(-14px)}to{transform:translateX(14px)}}' +
      // The error: the lamp sputters out, a couple of slow dips, then dark.
      '.st-error .lh-lit{animation:lh-sputter 1.6s ease-in both}' +
      '@keyframes lh-sputter{0%{opacity:1}14%{opacity:.4}28%{opacity:.85}46%{opacity:.2}60%{opacity:.5}80%{opacity:.06}100%{opacity:0}}' +
      '.lh-sput{animation:lh-sput2 1.8s ease-in-out infinite}@keyframes lh-sput2{0%,100%{opacity:.25}50%{opacity:.7}}' +
      '@keyframes lh-in{to{opacity:1}}' +
      // Done: the lamp blooms back, the beam relights.
      // It holds dark for a beat first, so the relight reads as a relight.
      '.st-done .lh-lit{animation:lh-relight 2s ease-out both}@keyframes lh-relight{0%,18%{opacity:0}40%{opacity:.55}100%{opacity:1}}' +
      '.lh-bloom{opacity:0}.st-done .lh-bloom{animation:lh-bloom 3.4s ease-out both}@keyframes lh-bloom{0%,11%{opacity:0}42%{opacity:.8}100%{opacity:.4}}' +
      '.lh-stars{opacity:0}.st-done .lh-stars{animation:lh-in 2.4s ease-out .4s both}' +
      '.st-done .lh-cla{animation:lh-lift 4s ease-out both}@keyframes lh-lift{to{transform:translate(-140px,-70px);opacity:.3}}' +
      '.st-done .lh-rain{animation:lh-rainoff 2.6s ease-out both}@keyframes lh-rainoff{to{opacity:.25}}' +
      '.lh-gale{opacity:0}.st-error .lh-gale{animation:lh-in 1s ease-out both}' +
      // The ship: rocks on the swell; on an error it drifts onto the reef, on done it steams clear.
      '.lh-sbob{transform-box:fill-box;transform-origin:50% 100%;animation:lh-sbob 5s ease-in-out infinite alternate}' +
      '@keyframes lh-sbob{from{transform:rotate(-2.4deg) translateY(-2px)}to{transform:rotate(2.4deg) translateY(3px)}}' +
      '.st-error .lh-sbob{animation:lh-sbob2 1.5s ease-in-out infinite alternate}@keyframes lh-sbob2{from{transform:rotate(-7deg)}to{transform:rotate(5deg) translateY(4px)}}' +
      '.st-error .lh-ship{animation:lh-drift 2.8s ease-in-out both}@keyframes lh-drift{to{transform:translate(-74px,28px)}}' +
      '.st-error .lh-sp{animation-duration:2.6s}' +
      '.lh-dress{opacity:0}.st-done .lh-dress{animation:lh-in .6s ease-out both;animation-delay:var(--d)}' +
      '.st-done .lh-ship{animation:lh-pass 5s ease-in-out both}@keyframes lh-pass{to{transform:translateX(180px)}}' +
      '.lh-sig{opacity:0}.st-web .lh-sig{animation:lh-sig 1.3s steps(1) infinite}@keyframes lh-sig{0%{opacity:0}12%{opacity:1}40%{opacity:0}55%,100%{opacity:1}}' +
      '.lh-puff{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .lh-puff{animation:lh-puff 2.4s ease-out .5s both}' +
      '@keyframes lh-puff{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.7}100%{opacity:0;transform:translate(-30px,-46px) scale(1.8)}}' +
      // The distress flare: up on a smoky trail, then it hangs and drifts down.
      '.lh-flr{opacity:0}.st-error .lh-flr{animation:lh-flr 4s ease-out .3s both}' +
      '@keyframes lh-flr{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}36%{transform:translate(-18px,-250px)}100%{opacity:.75;transform:translate(-34px,-196px)}}' +
      '.lh-trail{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .lh-trail{animation:lh-trail 1.6s ease-out .3s both}' +
      '@keyframes lh-trail{0%{opacity:.6;stroke-dashoffset:1}70%{opacity:.5;stroke-dashoffset:0}100%{opacity:.3;stroke-dashoffset:0}}' +
      // Surf on the rocks all the time, a little burst here and there.
      '.lh-sp{transform-box:fill-box;transform-origin:50% 100%;opacity:0;animation:lh-sp 6s ease-out infinite}' +
      '@keyframes lh-sp{0%,70%{opacity:0;transform:scale(.4,.1)}78%{opacity:.75;transform:scale(.9,.8)}90%{opacity:.35;transform:scale(1.1,1.1)}100%{opacity:0;transform:scale(1.15,1)}}' +
      '.lh-foamr{animation:lh-foamr 3.4s ease-in-out infinite alternate}@keyframes lh-foamr{from{opacity:.25}to{opacity:.6}}' +
      // The run: a huge swell stands up, breaks on the boulders and bursts up the cliff, every 4.5 s.
      '.lh-wave,.lh-plume,.lh-dr,.lh-foam{opacity:0}' +
      '.lh-wave{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .lh-wave{animation:lh-wave 4.5s ease-in-out infinite}' +
      '@keyframes lh-wave{0%{opacity:0;transform:translate(280px,90px) scale(.55,.35)}8%{opacity:1}30%{opacity:1;transform:translate(0,0) scale(1,1)}38%{opacity:1;transform:translate(-30px,40px) scale(1,.6)}48%,100%{opacity:0;transform:translate(-50px,100px) scale(1,.2)}}' +
      '.lh-plume{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .lh-plume{animation:lh-plume 4.5s ease-out infinite}' +
      '@keyframes lh-plume{0%,30%{opacity:0;transform:scale(.35,.08)}36%{opacity:.95;transform:scale(.7,.45)}56%{opacity:.9;transform:scale(1,1)}74%{opacity:.55;transform:translateY(16px) scale(1.08,1.04)}92%,100%{opacity:0;transform:translateY(40px) scale(1.12,.96)}}' +
      '.st-run .lh-dr{animation:lh-dr 4.5s ease-out infinite}' +
      '@keyframes lh-dr{0%,34%{opacity:0;transform:translate(0,0)}40%{opacity:.9}70%{opacity:.8;transform:translate(var(--dx),var(--dy))}100%{opacity:0;transform:translate(calc(var(--dx) * 1.3),calc(var(--dy) + 170px))}}' +
      '.lh-foam{transform-box:fill-box;transform-origin:center}.st-run .lh-foam{animation:lh-foam 4.5s ease-out infinite}' +
      '@keyframes lh-foam{0%,34%{opacity:0;transform:scale(.3)}42%{opacity:.7}85%,100%{opacity:0;transform:scale(1.5)}}' +
      // Fog while thinking.
      '.lh-fog{opacity:0}.st-thinking .lh-fog{animation:lh-in 2.4s ease-out both}' +
      '.lh-fogd{animation:lh-fogd 16s ease-in-out infinite alternate}@keyframes lh-fogd{from{transform:translateX(-60px)}to{transform:translateX(60px)}}' +
      // The porch lantern swings in the wind, the eave drips.
      '.lh-lsw{animation:lh-lsw 3.6s ease-in-out infinite alternate}@keyframes lh-lsw{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}' +
      '.st-error .lh-lsw{animation-duration:1.1s}' +
      '.lh-flk{animation:lh-flk 2.6s ease-in-out infinite alternate}@keyframes lh-flk{from{opacity:.7}to{opacity:1}}' +
      '.lh-drip{opacity:0;animation:lh-drip 2.4s ease-in infinite}@keyframes lh-drip{0%{opacity:0;transform:translateY(0)}15%{opacity:.8}100%{opacity:0;transform:translateY(150px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="lh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03070a"/><stop offset=".42" stop-color="#07111a"/><stop offset=".58" stop-color="#0d1f2a"/><stop offset="1" stop-color="#0a1820"/></linearGradient>' +
      '<linearGradient id="lh-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e6274" stop-opacity="0"/><stop offset="1" stop-color="#2e6274" stop-opacity=".2"/></linearGradient>' +
      `<radialGradient id="lh-halo"><stop offset="0" stop-color="${LAMP}" stop-opacity=".2"/><stop offset=".45" stop-color="${LAMP}" stop-opacity=".06"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lh-glo"><stop offset="0" stop-color="${LAMP_HOT}" stop-opacity=".7"/><stop offset=".35" stop-color="${LAMP}" stop-opacity=".25"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="lh-bl"><stop offset="0" stop-color="${LAMP_HOT}" stop-opacity=".42"/><stop offset=".5" stop-color="${LAMP}" stop-opacity=".12"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="lh-bm" gradientUnits="userSpaceOnUse" x1="${LX}" y1="0" x2="${BEAM_END}" y2="0"><stop offset="0" stop-color="${LAMP_HOT}" stop-opacity=".42"/><stop offset=".2" stop-color="${LAMP}" stop-opacity=".16"/><stop offset=".5" stop-color="${LAMP}" stop-opacity=".04"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></linearGradient>` +
      '<linearGradient id="lh-tw" gradientUnits="userSpaceOnUse" x1="176" y1="0" x2="284" y2="0"><stop offset="0" stop-color="#141f26"/><stop offset=".6" stop-color="#34464f"/><stop offset="1" stop-color="#1f2d35"/></linearGradient>' +
      '<linearGradient id="lh-wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d5361"/><stop offset=".5" stop-color="#123845"/><stop offset="1" stop-color="#0c2631"/></linearGradient>' +
      '<radialGradient id="lh-spr"><stop offset="0" stop-color="#eef8fa" stop-opacity=".72"/><stop offset=".55" stop-color="#cfe6ec" stop-opacity=".3"/><stop offset="1" stop-color="#cfe6ec" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lh-fl"><stop offset="0" stop-color="#ffd2bf" stop-opacity=".9"/><stop offset=".3" stop-color="#ff7a59" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>' +
      `<clipPath id="lh-glass"><rect x="202" y="158" width="56" height="64"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#lh-sky)"/><rect y="440" width="1600" height="140" fill="url(#lh-hz)"/>' +
      `<path class="lh-stars" d="${stars}" fill="#dfe9f2" fill-opacity=".8"/>` +
      `<g transform="${SHIFT}"><g class="lh-lit"><circle cx="${LX}" cy="${LY}" r="360" fill="url(#lh-halo)"/></g></g>` +
      `<g class="lh-cla"><g class="lh-cl">${cloudBank(-120, 820, 9)}</g></g><g class="lh-cl lh-cl2">${cloudBank(780, 1720, 9)}</g>` +
      // The far sea, then the ship and its reef at the right.
      swells[0] +
      '<g class="mv-r"><g transform="translate(1340 590)">' +
      '<path class="lh-trail" pathLength="1" d="M0 -20Q-4 -150 -18 -250" fill="none" stroke="#c9b0a8" stroke-width="2"/>' +
      '<g class="lh-flr"><circle cy="-20" r="56" fill="url(#lh-fl)"/><circle cy="-20" r="3.4" fill="#fff0e8"/></g>' +
      `<g class="lh-ship"><g class="lh-sbob"><g transform="scale(1.25)">${ship()}</g></g><ellipse class="lh-puff" cx="-44" cy="-68" rx="10" ry="8" fill="#dfe9ee"/></g></g></g>` +
      swells[1] +
      '<g class="mv-r">' +
      `<path d="${reef}" fill="${ROCK}" stroke="#20323d" stroke-opacity=".6" stroke-width="1.4" stroke-linejoin="round"/>` +
      '<g class="lh-foamr" fill="none" stroke="#cfe6ec" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 9 5 11"><path d="M1160 660Q1196 652 1230 662T1296 666"/><path d="M1288 670Q1316 664 1346 670"/></g>' +
      `${splash(1228, 652, 0.9, -2.2)}</g>` +
      swells[2] +
      // The headland and the lighthouse.
      `<path d="${headland}" fill="${ROCK}"/>` +
      '<path d="M-80 500L-40 490L8 500L60 486L104 516L150 540L320 544L352 556L372 590L396 604L412 640L436 662L452 700L476 724" fill="none" stroke="#23394a" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/>' +
      `<path d="${strata}" fill="none" stroke="#132029" stroke-width="3"/>` +
      '<path d="M120 538l4 -10M136 540l6 -12M170 540l5 -10M340 551l6 -12M30 494l4 -10M70 488l6 -12" stroke="#1b2c33" stroke-width="2.4" stroke-linecap="round"/>' +
      `<g transform="${SHIFT}">` +
      tower +
      // The gallery, the lantern and its dome.
      '<path d="M176 222H284V232H176Z" fill="#0a1116"/><path d="M182 232L192 243H268L278 232Z" fill="#0a1116"/>' +
      '<rect x="202" y="158" width="56" height="64" fill="#141008"/>' +
      `<g class="lh-lit"><rect x="202" y="158" width="56" height="64" fill="${LAMP}" fill-opacity=".72"/>` +
      `<g clip-path="url(#lh-glass)"><g class="lh-lens lh-sw" fill="${LAMP_HOT}" fill-opacity=".75">${[196, 224, 252, 280].map(x => `<rect x="${x}" y="158" width="10" height="64"/>`).join('')}</g></g>` +
      `<ellipse cx="${LX}" cy="${LY}" rx="9" ry="15" fill="#fffaf0"/></g>` +
      '<path d="M216 158V222M230 158V222M244 158V222M202 190H258" stroke="#0a0f12" stroke-width="2.4"/>' +
      `<path d="${railing}" stroke="#0a1116" stroke-width="2.6" fill="none"/>` +
      '<path d="M194 150H266V158H194Z M200 150Q230 104 260 150Z" fill="#0b1318" stroke="#2a3d48" stroke-width="1.4"/>' +
      '<circle cx="230" cy="114" r="6" fill="#0b1318" stroke="#2a3d48" stroke-width="1.4"/><path d="M230 108V84" stroke="#2a3d48" stroke-width="2"/>' +
      `<g class="lh-lit"><circle cx="${LX}" cy="${LY}" r="110" fill="url(#lh-glo)"/><g class="lh-flare lh-sw"><circle cx="${LX}" cy="${LY}" r="70" fill="url(#lh-glo)"/></g></g>` +
      `<circle class="lh-bloom" cx="${LX}" cy="${LY}" r="240" fill="url(#lh-bl)"/>` +
      // The beam, and a soft haze around it.
      `<g class="lh-lit"><g class="lh-sweep lh-sw"><path d="M${LX} ${LY - 12}L${BEAM_END} ${LY - 112}V${LY + 124}L${LX} ${LY + 12}Z" fill="url(#lh-bm)" fill-opacity=".45"/>` +
      `<path d="M${LX} ${LY - 7}L${BEAM_END} ${LY - 72}V${LY + 84}L${LX} ${LY + 7}Z" fill="url(#lh-bm)"/></g></g></g>` +
      // The near sea, the fog, the boulders, the surf.
      `<g class="lh-fog"><g class="lh-fogd">${fog}</g></g>` +
      swells[3] +
      `<path d="${boulders}" fill="${ROCK}" stroke="#1f3340" stroke-opacity=".7" stroke-width="2" stroke-linejoin="round"/>` +
      '<g class="lh-foamr" fill="none" stroke="#cfe6ec" stroke-width="2"><path d="M262 770Q300 760 330 772T400 768T470 774T560 780"/></g>' +
      splash(300, 730, 1, 0) +
      splash(470, 740, 0.9, -3.1) +
      splash(400, 704, 0.7, -4.4) +
      swells[4] +
      // The run's wave and burst.
      `<g transform="translate(470 790) scale(1.2)"><g class="lh-wave"><path d="${wavePath}" fill="url(#lh-wv)"/>` +
      '<path d="M-140 -200C-90 -220 -40 -222 -10 -206C-50 -196 -100 -190 -140 -200Z" fill="#3a8090" fill-opacity=".45"/>' +
      `<path d="${crestPath}" fill="none" stroke="#e2f2f5" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>` +
      '<path d="M-120 -150q20 -8 36 0M-60 -120q24 -8 44 2M30 -150q20 -6 34 4M-170 -60q20 -8 34 0" fill="none" stroke="#cfe6ec" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/></g></g>' +
      `<g transform="translate(340 740) scale(1.15)"><g class="lh-plume">${plumeBlobs}</g>${drops}` +
      '<ellipse class="lh-foam" cx="20" cy="20" rx="170" ry="18" fill="none" stroke="#e2f2f5" stroke-opacity=".55" stroke-width="3"/></g>' +
      // The rain, slanting in off the sea; a gale's worth more on an error.
      `<g class="lh-rain">${rain({ seed: 31, count: 36, length: [22, 42], slant: -240, seconds: 0.85, stroke: '#9cc0cc', opacity: 0.15 })}` +
      `${rain({ seed: 32, count: 24, length: [40, 70], slant: -280, seconds: 0.58, stroke: '#cfe4ea', opacity: 0.12 })}</g>` +
      `<g class="lh-gale">${rain({ seed: 33, count: 22, length: [40, 80], slant: -420, seconds: 0.45, stroke: '#cfe4ea', opacity: 0.16 })}</g>`,
    nook:
      '<defs>' +
      `<radialGradient id="lh-lan"><stop offset="0" stop-color="${LAMP}" stop-opacity=".34"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".1"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="lh-win"><stop offset="0" stop-color="#ffc861" stop-opacity=".3"/><stop offset="1" stop-color="#ffc861" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The stone quay under the desk.
      '<path d="M-80 448H440V476H-80Z" fill="#0a1015"/><path d="M-80 448H440" stroke="#23343e" stroke-width="2"/>' +
      `<path d="${Array.from({ length: 9 }, (_, i) => `M${-60 + i * 58} 450V476`).join('')}" stroke="#05080b" stroke-width="2"/>` +
      // The cottage wall, its window and the eave.
      '<rect x="336" y="60" width="110" height="390" fill="#0d151b"/>' +
      `<path d="${courses}" stroke="#1a2731" stroke-width="2" fill="none"/>` +
      '<circle cx="378" cy="143" r="80" fill="url(#lh-win)"/>' +
      '<rect x="352" y="110" width="52" height="66" fill="#2a1d0c" stroke="#05090c" stroke-width="4"/>' +
      '<g fill="#ffc861" fill-opacity=".5"><rect x="356" y="114" width="20" height="27"/><rect x="380" y="114" width="20" height="27"/><rect x="356" y="145" width="20" height="27"/><rect x="380" y="145" width="20" height="27"/></g>' +
      '<path d="M300 74L446 30V54L306 90Z" fill="#05090c" stroke="#1d2b33" stroke-width="2" stroke-linejoin="round"/>' +
      // The life ring on the wall.
      '<circle cx="388" cy="212" r="18" fill="none" stroke="#d8d2c4" stroke-opacity=".85" stroke-width="9"/>' +
      '<circle cx="388" cy="212" r="18" fill="none" stroke="#b5483a" stroke-width="9" stroke-dasharray="14.1 14.17"/>' +
      // The porch lantern on its bracket.
      '<path d="M336 92H300M336 110L310 92" stroke="#05090c" stroke-width="4"/>' +
      '<g transform="translate(304 92)"><g class="lh-lsw">' +
      '<g class="lh-flk"><circle cy="44" r="96" fill="url(#lh-lan)"/></g>' +
      '<path d="M0 0V24" stroke="#05090c" stroke-width="2"/>' +
      `<path d="M-8 24H8L11 32H-11Z M-10 32H10V54H-10Z M-11 54H11L8 60H-8Z" fill="#0b0f12" stroke="${BRASS}" stroke-width="1.6"/>` +
      `<rect x="-7" y="34" width="14" height="18" fill="${LAMP}" fill-opacity=".85"/><path d="M0 37Q4 44 0 50Q-4 44 0 37Z" fill="${LAMP_HOT}"/>` +
      '</g></g>' +
      // A coil of rope on the quay.
      '<g fill="none" stroke="#6e5a38" stroke-width="5"><ellipse cx="24" cy="444" rx="36" ry="8"/><ellipse cx="24" cy="437" rx="30" ry="7"/><ellipse cx="24" cy="430" rx="22" ry="5"/></g>' +
      '<path d="M-12 444Q24 456 60 444" fill="none" stroke="#04090d" stroke-opacity=".5" stroke-width="3"/>',
    front: [
      [312, 90, 0],
      [352, 78, -0.9],
      [394, 66, -1.7],
      [432, 54, -0.4],
    ]
      .map(([x, y, d]) => `<ellipse class="lh-drip" style="animation-delay:${d}s" cx="${x}" cy="${y}" rx="1.6" ry="3.2" fill="#bcd6e0"/>`)
      .join(''),
  }
}
