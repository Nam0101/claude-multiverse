import type { Activity } from '../../types'
import { f, gear, random } from './kit'
import type { World } from './world'

// Blueprint: Claude is a part on a drafting sheet, white ink on deep cyanotype blue, at a drafting board of its own.
// A rocket on its gantry fills the left third, dimensioned and annotated in invented marks; a detail view and a moon
// with its orbit sit at the far right. When a command runs the rocket draws itself again line by line and the gantry
// arms swing clear; an error rings it in red pen and an eraser rubs at it; done launches the drawing off the page.
const INK = '#e8f2ff'
const PALE = '#8fbbe8'
const NAVY = '#0c2341'
const RED = '#ff6464'
const GREEN = '#78e2ad'

// Invented marks for the labels, each in an 8×10 box: none is a letter of any script.
const GLYPHS = [
  'M0 9L4 1L8 9ZM4 5V7',
  'M4 0V4M0 4H8L4 10Z',
  'M1 1H7V9H1ZM1 9L7 1',
  'M0 5Q2 0 4 5Q6 10 8 5',
  'M4 1Q7 1 7 4Q7 7 4 7Q1 7 1 4Q1 1 4 1M0 10H8',
  'M0 5H3M5 5H8M4 1V3M4 7V9',
  'M0 1L4 5L0 9M5 9H8',
  'M1 9V4Q4 0 7 4V9M1 6H3',
]

/** A glyph's path moved to (x, y) and scaled: its commands are all absolute M L H V Q Z. */
function place(d: string, x: number, y: number, s: number): string {
  return d.replace(/([MLHVQZ])([^MLHVQZ]*)/g, (_, c: string, args: string) => {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number)
    const out = n.map((v, i) => (c === 'H' ? v * s + x : c === 'V' ? v * s + y : i % 2 ? v * s + y : v * s + x))

    return c + out.map(f).join(' ')
  })
}

/** A run of `n` invented marks starting at (x, y). */
function marks(x: number, y: number, seed: number, n: number, s = 1): string {
  const next = random(seed)

  return Array.from({ length: n }, (_, i) => place(GLYPHS[Math.floor(next() * GLYPHS.length)]!, x + i * 11 * s, y, s)).join('')
}

/** A vertical dimension: arrowheads at both ends, a gap in the middle for its figure. */
function dimV(x: number, y1: number, y2: number, seed: number, n = 4, s = 1): string {
  const m = (y1 + y2) / 2
  const gap = (n * 11 * s) / 2 + 5

  return (
    `<path d="M${x} ${y1 + 2}V${f(m - gap)}M${x} ${f(m + gap)}V${y2 - 2}"/>` +
    `<path d="M${x} ${y1}l-4 12h8ZM${x} ${y2}l-4 -12h8Z" stroke="none" fill="${PALE}"/>` +
    `<g transform="translate(${x} ${f(m)}) rotate(-90)"><path d="${marks(f2(-gap + 6), -5 * s, seed, n, s)}"/></g>`
  )
}

function f2(v: number): number {
  return Math.round(v * 10) / 10
}

/** A horizontal dimension, the same way. */
function dimH(y: number, x1: number, x2: number, seed: number, n = 4, s = 1): string {
  const m = (x1 + x2) / 2
  const gap = (n * 11 * s) / 2 + 5

  return (
    `<path d="M${x1 + 2} ${y}H${f(m - gap)}M${f(m + gap)} ${y}H${x2 - 2}"/>` +
    `<path d="M${x1} ${y}l12 -4v8ZM${x2} ${y}l-12 -4v8Z" stroke="none" fill="${PALE}"/>` +
    `<path d="${marks(f2(m - gap + 6), y - 5 * s, seed, n, s)}"/>`
  )
}

/** The rocket's lines, in the order the pen draws them, with when each starts (s). */
type Line = { d: string; at: number; erase?: boolean }

const HULL: readonly Line[] = [
  { d: 'M206 232C206 160 240 104 260 72C280 104 314 160 314 232', at: 0 },
  { d: 'M206 232H314V332H206Z', at: 0.12 },
  { d: 'M278 278A18 18 0 1 0 242 278A18 18 0 1 0 278 278', at: 0.22 },
  { d: 'M271 278A11 11 0 1 0 249 278A11 11 0 1 0 271 278', at: 0.28 },
  { d: 'M206 332L196 362H324L314 332', at: 0.34 },
  { d: 'M196 362V522H324V362', at: 0.42 },
  { d: 'M196 408H324M196 478H324M232 362V408M288 478V522', at: 0.55, erase: true },
  { d: 'M196 522L186 550H334L324 522', at: 0.64 },
  { d: 'M186 550V782H334V550', at: 0.72 },
  { d: 'M186 606H334M186 726H334', at: 0.82 },
  { d: 'M228 606V726M292 606V726', at: 0.9 },
  { d: 'M186 652L120 762V814L186 782', at: 1 },
  { d: 'M186 700L134 786', at: 1.42 },
  { d: 'M196 782L192 800H328L324 782', at: 1.15 },
]
const FIN = { d: 'M0 0L66 110V162L0 130', spar: 'M0 48L52 134', x: 334, y: 652 }
const FLIGHT = 'M262 64C420 -24 980 -14 1250 92'
const BELL = 'M-9 0L-12 12Q-16 32 -18 46H18Q16 32 12 12L9 0'
const BELLS = [222, 260, 298]
const SILHOUETTE =
  'M260 72C280 104 314 160 314 232V332L324 362V522L334 550V652L400 762V814L334 782L328 800H192L186 782L120 814V762L186 652V550L196 522V362L206 332V232C206 160 240 104 260 72Z'

/** One inked line: the line itself and the pen's bright tip that runs along it while it is drawn. */
function inked(d: string, at: number, erase = false): string {
  const delay = `style="--d:${f(at)}s"`

  return (
    `<path class="bp-ln${erase ? ' bp-er' : ''}" pathLength="1" ${delay} d="${d}"/>` +
    `<path class="bp-pen" pathLength="1" ${delay} d="${d}"/>`
  )
}

/** A bell in the picture's own coordinates, for the construction layer that stays on the sheet. */
function bellAt(x: number): string {
  return place(BELL, x, 800, 1)
}

/** A hand-drawn red ring: a little wobble, the ends overlapping. */
function scribble(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const next = random(seed)
  const points: string[] = []

  for (let i = 0; i <= 40; i += 1) {
    const a = -2 + (i / 40) * (Math.PI * 2 + 0.6)
    const k = 1 + (next() - 0.5) * 0.05 + i * 0.003

    points.push(`${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`)
  }

  return `M${points.join('L')}`
}

/** The drafting board Claude types at: a keyboard, a tilted board with the rocket on it, the drafting machine's arm. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web' ? ' bp-busy' : ''
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${251 + i * 12}" y="322" width="7" height="3"/>`).join('')
  const mini = [
    'M-7 -18Q-6 -28 0 -36Q6 -28 7 -18',
    'M-7 -18V22H7V-18',
    'M-7 0H7',
    'M-7 10L-15 26V30L-7 24M7 10L15 26V30L7 24',
    'M-4 22L-6 30H6L4 22',
  ]
    .map((d, i) => `<path class="bp-mn" pathLength="1" style="--d:${f(0.15 + i * 0.22)}s" d="${d}"/>`)
    .join('')

  return (
    `<path d="M352 326L366 300M400 320L394 298" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M328 326L404 318L424 222L346 232Z" fill="${light}" fill-opacity=".16" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M336 320L398 314L415 230L351 238Z" fill="none" stroke="${light}" stroke-opacity=".5"/>` +
    `<g transform="translate(380 274) rotate(11)" fill="none" stroke="${light}" stroke-width="1.6" stroke-linejoin="round">${mini}` +
    '<path d="M-22 -36V30M-25 -36H-19M-25 30H-19" stroke-opacity=".6" stroke-width="1"/></g>' +
    `<rect x="244" y="319" width="92" height="10" rx="2" fill="${NAVY}" stroke="${INK}" stroke-width="1.6"/>` +
    `<g fill="${light}" fill-opacity=".6">${keys}</g>` +
    `<path d="M346 232L318 206L384 262" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<g fill="${NAVY}" stroke="${INK}" stroke-width="1.6"><circle cx="346" cy="232" r="4"/><circle cx="318" cy="206" r="4"/></g>` +
    `<g class="bp-dh${busy}"><path d="M384 262L420 255M384 262L377 298" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="384" cy="262" r="5" fill="${NAVY}" stroke="${INK}" stroke-width="1.6"/></g>` +
    `<path d="M420 330H458V284Z" fill="${NAVY}" fill-opacity=".6" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M429 326H450V302Z" fill="none" stroke="${PALE}" stroke-width="1.2"/>` +
    `<path d="M404 328L448 324" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M448 324L456 323" stroke="${light}" stroke-width="2"/>`
  )
}

export function blueprintWorld(): World {
  const next = random(4242)

  // The sheet's grid: a fine one and a coarse one.
  let fine = ''
  let coarse = ''

  for (let x = 20; x < 1600; x += 20) {
    if (x % 100) {
      fine += `M${x} 0V1000`
    } else {
      coarse += `M${x} 0V1000`
    }
  }

  for (let y = 20; y < 1000; y += 20) {
    if (y % 100) {
      fine += `M0 ${y}H1600`
    } else {
      coarse += `M0 ${y}H1600`
    }
  }

  // The gantry: two rails, braced bay by bay.
  let lattice = 'M34 852V150M86 852V150M26 150H94'

  for (let y = 150; y < 852; y += 58.5) {
    lattice += `M34 ${f(y)}H86M34 ${f(y)}L86 ${f(y + 58.5)}M86 ${f(y)}L34 ${f(y + 58.5)}`
  }

  const arm = (y: number, length: number) =>
    `<g transform="translate(86 ${y})"><g class="bp-arm">` +
    `<path d="M0 -7H${length}M0 7H${length}M${length} -12V12${Array.from({ length: Math.floor(length / 14) }, (_, i) => `M${i * 14} ${i % 2 ? 7 : -7}L${i * 14 + 14} ${i % 2 ? -7 : 7}`).join('')}"/>` +
    `<circle r="5" fill="${NAVY}"/></g></g>`

  const ground = Array.from({ length: 33 }, (_, i) => `M${-6 + i * 14} 872l-10 12`).join('')

  const ink =
    HULL.map(line => inked(line.d, line.at, line.erase)).join('') +
    `<g transform="translate(${FIN.x} ${FIN.y})"><g class="bp-fin">${inked(FIN.d, 1.05)}${inked(FIN.spar, 1.48)}</g></g>` +
    BELLS.map((x, i) => `<g transform="translate(${x} 800)"><g class="bp-noz" style="animation-delay:${f(-i * 0.3)}s">${inked(BELL, 1.25 + i * 0.06)}</g></g>`).join('')

  const ghost =
    HULL.map(line => line.d).join('') +
    `M334 652L400 762V814L334 782` +
    BELLS.map(bellAt).join('') +
    [72, 232, 332, 362, 522, 550, 782, 846].map(y => `M148 ${y}H372`).join('') +
    'M186 520V830M334 520V830'

  const hidden =
    'M242 374H278Q308 374 308 404V478Q308 508 278 508H242Q212 508 212 478V404Q212 374 242 374Z' +
    'M230 562H290Q318 562 318 590V618Q318 646 290 646H230Q202 646 202 618V590Q202 562 230 562Z' +
    'M230 656H290Q318 656 318 684V742Q318 770 290 770H230Q202 770 202 742V684Q202 656 230 656Z' +
    'M260 508V562M260 646V656'

  const balloon = (bx: number, by: number, px: number, py: number, seed: number, d: number) =>
    `<path class="bp-ld" pathLength="1" style="--d:${d}s" d="M${bx + 13} ${by}L${px} ${py}"/>` +
    `<circle cx="${px}" cy="${py}" r="2.6" fill="${PALE}" stroke="none"/>` +
    `<circle cx="${bx}" cy="${by}" r="13" fill="${NAVY}"/><path d="${marks(bx - 4, by - 5, seed, 1)}"/>`

  const puffs = Array.from({ length: 12 }, (_, i) => {
    const r = 14 + next() * 12
    const x = 260 + (next() - 0.5) * 90
    const style = `--x:${f(-280 + next() * 400)}px;--y:${f(-14 - next() * 70)}px;--s:${f(1.5 + next() * 1.1)};--d:${f(0.12 + i * 0.05)}s`

    return `<circle class="bp-pf" style="${style}" cx="${f(x)}" cy="${f(858 - next() * 14)}" r="${f(r)}"/>`
  }).join('')

  const vents = [
    [190, 540, -22],
    [330, 540, 22],
    [194, 792, -26],
    [326, 792, 26],
  ]
    .map(([x, y, dx], i) => `<circle class="bp-vt" style="--vx:${dx}px;animation-delay:${f(i * 0.35)}s" cx="${x}" cy="${y}" r="9"/>`)
    .join('')

  const crumbs = Array.from({ length: 7 }, (_, i) => {
    const x = 214 + next() * 92

    return `<rect class="bp-cr" style="animation-delay:${f(0.3 + next() * 0.9)}s" x="${f(x)}" y="${f(462 + next() * 10)}" width="${f(3 + next() * 3)}" height="3"/>`
  }).join('')

  const ticks = Array.from({ length: 33 }, (_, i) => `M${24 + i * 12} 186v${i % 5 ? 6 : 11}`).join('')

  const scale = Array.from({ length: 8 }, (_, i) => `<rect x="${30 + i * 40}" y="948" width="40" height="8"${i % 2 ? '' : ` fill="${PALE}" fill-opacity=".5"`}/>`).join('')

  const wave = [0, 0.5, 1]
    .map(
      delay =>
        `<path class="bp-wv" style="animation-delay:${delay}s" d="M4 -40A40 40 0 0 1 40 -4M6 -62A62 62 0 0 1 62 -6"/>`,
    )
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#030a17',
      furniture: NAVY,
      metal: '#16355e',
      paper: '#dce9f7',
      light: { idle: '#5f9ad6', work: '#a9d2ff', bright: '#e4f2ff' },
      headTop: 234,
      glowAt: [380, 272],
      device,
      wear: {
        // A pencil tucked behind the head.
        behind:
          `<g transform="translate(76 232) rotate(-28)"><path d="M-4 30V-22L0 -34L4 -22V30Z" fill="${NAVY}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M-4 -22H4" stroke="${INK}" stroke-width="1.4"/><circle cy="-31" r="1.6" fill="${INK}"/></g>`,
        // Claude drawn as a part: an ink outline with its construction lines run past the corners, a dimension over
        // its head, and a draftsman's eyeshade whose brim stays above the eyes.
        front:
          `<g fill="none" stroke="${INK}" stroke-linecap="round"><rect x="70" y="238" width="160" height="112" stroke-width="2" stroke-opacity=".85"/>` +
          '<path d="M86 350V374H102V350M118 350V374H134V350M166 350V374H182V350M198 350V374H214V350" stroke-width="1.4" stroke-opacity=".7"/>' +
          '<path d="M56 350H70M230 350H244M70 350V364M230 350V364M230 238H244" stroke-width="1.2" stroke-opacity=".5"/></g>' +
          `<g fill="none" stroke="${PALE}" stroke-width="1.3"><path d="M70 230V212M230 230V212M72 220H128M172 220H228"/>` +
          `<path d="${marks(133, 215, 9, 3, 0.9)}"/></g><path d="M70 220l11 -4v8ZM230 220l-11 -4v8Z" fill="${PALE}"/>` +
          `<path d="M66 236H234V246H66Z" fill="#9fd0ff" fill-opacity=".3" stroke="${INK}" stroke-width="1.8"/>` +
          `<path d="M150 236L256 234L284 260L150 250Z" fill="#9fd0ff" fill-opacity=".26" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
      },
      seatArt:
        `<g fill="${NAVY}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"><rect x="106" y="350" width="90" height="10" rx="3"/><path d="M146 360H156V412H146Z"/></g>` +
        `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><ellipse cx="151" cy="414" rx="30" ry="5"/><path d="M151 416L112 450M151 416L190 450M151 416V450"/></g>` +
        `<g fill="${NAVY}" stroke="${INK}" stroke-width="1.6"><circle cx="112" cy="451" r="4.5"/><circle cx="190" cy="451" r="4.5"/><circle cx="151" cy="452" r="4"/></g>` +
        `<g fill="none" stroke="${PALE}" stroke-width="1.2" stroke-opacity=".8"><path d="M50 350H64M50 456H64"/>${dimV(57, 350, 456, 5, 2, 0.8)}</g>`,
      tableArt:
        `<g fill="${NAVY}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"><rect x="166" y="330" width="304" height="12" rx="2"/>` +
        '<rect x="300" y="342" width="112" height="16"/><rect x="182" y="342" width="12" height="114"/><rect x="436" y="342" width="12" height="114"/></g>' +
        `<g fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"><path d="M348 350H364M188 412H436"/></g>` +
        `<path d="M172 336H464" stroke="${PALE}" stroke-opacity=".45" stroke-width="1.4"/>` +
        `<g fill="${NAVY}" stroke="${INK}" stroke-width="1.8"><g transform="translate(352 456) rotate(-24)"><rect x="-6" y="-92" width="12" height="92" rx="5"/></g>` +
        '<g transform="translate(378 456) rotate(-14)"><rect x="-6" y="-80" width="12" height="80" rx="5"/></g></g>' +
        `<g fill="none" stroke="${PALE}" stroke-width="1.2"><path d="M166 346V398M470 346V398"/>${dimH(392, 166, 470, 6, 3)}</g>`,
    },
    style:
      // Ambient: the hidden lines creep, the beacon breathes, the satellite rounds the moon, the detail's gears turn.
      '.bp-hid{stroke-dasharray:8 5;animation:bp-march 4s linear infinite}@keyframes bp-march{to{stroke-dashoffset:-26}}' +
      '.bp-flow{stroke-dasharray:6 8;animation:bp-flow 2.8s linear infinite}@keyframes bp-flow{to{stroke-dashoffset:-28}}' +
      '.bp-bcn{animation:bp-bcn 2.6s ease-in-out infinite}@keyframes bp-bcn{0%,100%{opacity:.25}50%{opacity:1}}' +
      '.bp-ox{animation:bp-ox 7s cubic-bezier(.37,0,.63,1) infinite alternate}@keyframes bp-ox{from{transform:translateX(-132px)}to{transform:translateX(132px)}}' +
      '.bp-oy{animation:bp-oy 7s cubic-bezier(.37,0,.63,1) -3.5s infinite alternate}@keyframes bp-oy{from{transform:translateY(-38px)}to{transform:translateY(38px)}}' +
      '.bp-g1{animation:mv-spin 24s linear infinite}.bp-g2{animation:mv-spin-back 16s linear infinite}' +
      '.st-tool .bp-g1,.st-run .bp-g1{animation-duration:3s}.st-tool .bp-g2,.st-run .bp-g2{animation-duration:2s}' +
      '.st-tool .bp-flow,.st-run .bp-flow{animation-duration:.6s}' +
      // The rocket's ink: whole at rest, drawn again line by line when a command runs, the pen's tip leading.
      '.bp-ln{stroke-dasharray:1 1}.bp-pen{opacity:0;stroke:#fff;stroke-width:5;stroke-dasharray:.04 2}' +
      '.st-run .bp-ln{animation:bp-draw 1.1s cubic-bezier(.3,.1,.3,1) both;animation-delay:var(--d)}' +
      '@keyframes bp-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.st-run .bp-pen{animation:bp-pen 1.1s cubic-bezier(.3,.1,.3,1) both;animation-delay:var(--d)}' +
      '@keyframes bp-pen{0%{opacity:0;stroke-dashoffset:.04}3%,96%{opacity:1}100%{opacity:0;stroke-dashoffset:-1}}' +
      '.st-run .bp-hid,.st-run .bp-hat{animation:bp-in .6s ease-out 1.5s both}@keyframes bp-in{from{opacity:0}}' +
      '.st-run .bp-arm{animation:bp-arm 1s ease-in-out 1.7s both}@keyframes bp-arm{to{transform:rotate(-64deg)}}' +
      '.st-done .bp-arm{animation:bp-arm .5s ease-in-out both}' +
      '.bp-noz{transform-box:fill-box;transform-origin:50% 0}' +
      '.st-run .bp-noz{animation:bp-gim .9s ease-in-out infinite alternate}@keyframes bp-gim{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      '.bp-vt{opacity:0}.st-run .bp-vt{transform-box:fill-box;transform-origin:center;animation:bp-vt 1.4s ease-out infinite}' +
      '@keyframes bp-vt{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.85}100%{opacity:0;transform:translate(var(--vx),-34px) scale(1.7)}}' +
      '.bp-mn{stroke-dasharray:1 1}.st-run .bp-mn,.st-responding .bp-mn{animation:bp-draw .9s ease-out both;animation-delay:var(--d)}' +
      '.bp-dh.bp-busy{animation:bp-dh .9s ease-in-out infinite alternate}.st-tool .bp-dh{animation-duration:.4s}' +
      '@keyframes bp-dh{from{transform:translate(-5px,3px)}to{transform:translate(6px,-4px)}}' +
      // Thinking: the compass swings round the detail view and draws its circle again.
      '.bp-cmp{transform:rotate(-60deg)}.st-thinking .bp-cmp{animation:bp-cmp 3s linear infinite}' +
      '@keyframes bp-cmp{from{transform:rotate(-60deg)}to{transform:rotate(300deg)}}' +
      '.bp-dc{stroke-dasharray:1 1}.st-thinking .bp-dc{animation:bp-draw 3s linear infinite}' +
      // Responding: the leaders are inked again, one after another.
      '.bp-ld{stroke-dasharray:1 1}.st-responding .bp-ld{animation:bp-ld 2.4s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes bp-ld{0%{stroke-dashoffset:1}50%,100%{stroke-dashoffset:0}}' +
      // Tool: the parallel rule sweeps down the drawing.
      '.bp-rule,.bp-mag{opacity:0}' +
      '.st-tool .bp-rule{animation:bp-rule 1.8s ease-in-out infinite alternate}@keyframes bp-rule{from{opacity:1;transform:translateY(0)}to{opacity:1;transform:translateY(560px)}}' +
      // Read: a magnifier glides down the hull.
      '.st-read .bp-mag{animation:bp-mag 3.2s ease-in-out infinite alternate}@keyframes bp-mag{from{opacity:1;transform:translate(0,0)}to{opacity:1;transform:translate(8px,470px)}}' +
      // Web: the dish on the gantry calls, the moon's relay answers.
      '.bp-wv,.bp-wr{opacity:0}.st-web .bp-wv,.st-web .bp-wr{animation:bp-wv 1.5s ease-out infinite}' +
      '@keyframes bp-wv{0%{opacity:0;transform:scale(.4)}25%{opacity:.9}100%{opacity:0;transform:scale(1.7)}}' +
      '.bp-wr{transform-box:fill-box;transform-origin:center}' +
      // Error: a red ring around the fin, the fin sags, an eraser rubs the second stage out, the sheet is stamped.
      '.bp-rc{opacity:0;stroke-dasharray:1 1}.st-error .bp-rc{animation:bp-rc .8s ease-out .15s both}' +
      '@keyframes bp-rc{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.bp-rx,.bp-era,.bp-smg{opacity:0}.st-error .bp-rx{animation:bp-on .3s ease-out .9s both}@keyframes bp-on{to{opacity:1}}' +
      '.st-error .bp-fin{animation:bp-fin .9s cubic-bezier(.5,0,.4,1.4) .3s both}@keyframes bp-fin{to{transform:rotate(15deg)}}' +
      '.st-error .bp-era{animation:bp-on .25s ease-out .2s both}' +
      '.st-error .bp-erx{animation:bp-rub .26s ease-in-out .2s infinite alternate}@keyframes bp-rub{from{transform:translateX(-36px)}to{transform:translateX(36px)}}' +
      '.st-error .bp-smg{animation:bp-on 1.4s ease-out .3s both}' +
      '.st-error .bp-er{animation:bp-out 1.2s ease-out .3s both}@keyframes bp-out{to{opacity:.15}}' +
      '.bp-cr{opacity:0}.st-error .bp-cr{animation:bp-cr 1s ease-in infinite}' +
      '@keyframes bp-cr{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(70px)}}' +
      '.bp-sx,.bp-so{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .bp-sx{animation:bp-stamp .45s cubic-bezier(.3,0,.4,1.3) .7s both}.st-done .bp-so{animation:bp-stamp .45s cubic-bezier(.3,0,.4,1.3) 1.3s both}' +
      '@keyframes bp-stamp{from{opacity:0;transform:scale(1.8) rotate(-14deg)}to{opacity:.9;transform:scale(1) rotate(-14deg)}}' +
      // Done: the drawn rocket lifts off the page in line-art fire and smoke, leaving its construction lines behind.
      '.st-done .bp-rk{animation:bp-up 2.8s cubic-bezier(.6,0,.9,.6) .25s both}' +
      '@keyframes bp-up{0%{transform:translateY(0)}8%{transform:translateY(4px)}100%{transform:translateY(-1260px)}}' +
      '.bp-fl{opacity:0}.st-done .bp-fl{animation:bp-on .3s ease-out .1s both}' +
      '.bp-flk{transform-box:fill-box;transform-origin:50% 0}.st-done .bp-flk{animation:bp-flk .2s ease-in-out infinite alternate}@keyframes bp-flk{from{transform:scaleY(.86)}to{transform:scaleY(1.1)}}' +
      '.bp-pf{opacity:0}.st-done .bp-pf{transform-box:fill-box;transform-origin:center;animation:bp-pf 3.2s ease-out both;animation-delay:var(--d)}' +
      '@keyframes bp-pf{0%{opacity:0;transform:translate(0,0) scale(.3)}12%{opacity:1}70%{opacity:.85}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(var(--s))}}' +
      '.st-done .bp-gh{animation:bp-gh 1.5s ease-out .6s both}@keyframes bp-gh{to{opacity:.55}}' +
      '.bp-tr{opacity:0;stroke-dasharray:1 1}.st-done .bp-tr{animation:bp-tr 1.6s ease-in-out .9s both}' +
      '@keyframes bp-tr{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.bp-orr{opacity:0}.st-done .bp-orr{animation:bp-on .6s ease-out 1.7s both}' +
      // Powered up: the rocket's ink runs gold.
      '.ultra .bp-ink{stroke:#ffe2a0}',
    scenery:
      '<defs>' +
      '<radialGradient id="bp-bg" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#0d2646"/><stop offset=".7" stop-color="#0c2241"/><stop offset="1" stop-color="#081931"/></radialGradient>' +
      '<radialGradient id="bp-lit"><stop offset="0" stop-color="#2a5a96" stop-opacity=".5"/><stop offset="1" stop-color="#2a5a96" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="bp-sil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".07"/><stop offset=".6" stop-color="#cfe6ff" stop-opacity=".16"/><stop offset="1" stop-color="#cfe6ff" stop-opacity=".1"/></linearGradient>' +
      `<pattern id="bp-hp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V8" stroke="${PALE}" stroke-width="1.4"/></pattern>` +
      '<radialGradient id="bp-lens"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".08"/><stop offset="1" stop-color="#cfe6ff" stop-opacity=".24"/></radialGradient>' +
      '<radialGradient id="bp-smg"><stop offset="0" stop-color="#d8e8fa" stop-opacity=".34"/><stop offset=".6" stop-color="#b8d2ee" stop-opacity=".18"/><stop offset="1" stop-color="#b8d2ee" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="bp-flg"><stop offset="0" stop-color="#eaf4ff" stop-opacity=".5"/><stop offset="1" stop-color="#8fbbe8" stop-opacity=".08"/></radialGradient>' +
      '<radialGradient id="bp-bc"><stop offset="0" stop-color="#e8f2ff" stop-opacity=".6"/><stop offset="1" stop-color="#e8f2ff" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The sheet: deep cyanotype blue, lighter where the drawing is, its grid.
      '<rect width="1600" height="1000" fill="url(#bp-bg)"/>' +
      '<ellipse cx="240" cy="480" rx="420" ry="560" fill="url(#bp-lit)"/>' +
      '<ellipse cx="1440" cy="300" rx="300" ry="320" fill="url(#bp-lit)" opacity=".6"/>' +
      `<path d="${fine}" stroke="#6f9fd6" stroke-opacity=".07"/><path d="${coarse}" stroke="#7fb0e6" stroke-opacity=".15" stroke-width="1.2"/>` +
      // The construction lines stay on the sheet whatever the ink does.
      `<path class="bp-gh" d="${ghost}" fill="none" stroke="${PALE}" stroke-width="1.3" opacity=".26"/>` +
      `<path d="M260 40V880" fill="none" stroke="${PALE}" stroke-width="1.3" stroke-opacity=".6" stroke-dasharray="26 6 4 6"/>` +
      // The flight path over the top of the sheet, inked when the rocket goes.
      `<path d="${FLIGHT}" fill="none" stroke="${PALE}" stroke-width="1.4" stroke-opacity=".3" stroke-dasharray="10 8"/>` +
      `<path class="bp-tr" pathLength="1" d="${FLIGHT}" fill="none" stroke="${INK}" stroke-width="2" stroke-opacity=".7"/>` +
      // The gantry, its dish and beacon, its swing arms.
      `<g fill="none" stroke="${INK}" stroke-opacity=".75" stroke-width="1.8" stroke-linejoin="round"><path d="${lattice}"/>` +
      '<path d="M60 150V100M68 140Q72 160 98 156M78 152L98 128"/><circle cx="99" cy="126" r="3"/></g>' +
      '<circle class="bp-bcn" cx="60" cy="96" r="18" fill="url(#bp-bc)"/><circle cx="60" cy="96" r="4" fill="#e8f2ff"/>' +
      `<g transform="translate(99 126)" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round">${wave}</g>` +
      `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round">${arm(263, 120)}${arm(471, 110)}</g>` +
      // The pad and the ground.
      `<path d="M96 852H424V866H96Z" fill="${NAVY}" stroke="${INK}" stroke-width="2"/><path d="M214 852V866M306 852V866" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M-10 872H440" stroke="${INK}" stroke-width="2"/><path d="${ground}" stroke="${PALE}" stroke-width="1.3" stroke-opacity=".7"/>` +
      // The rocket: a faint body, hatched nose, hidden tanks, white ink, the plume that waits for the launch.
      '<g class="bp-rk">' +
      '<g class="bp-fl"><circle cx="260" cy="900" r="110" fill="url(#bp-flg)"/>' +
      BELLS.map(
        (x, i) =>
          `<g transform="translate(${x} 846)"><path class="bp-flk" style="animation-delay:${f(-i * 0.07)}s" d="${i === 1 ? 'M-20 0Q-30 80 0 170Q30 80 20 0' : 'M-15 0Q-22 56 0 116Q22 56 15 0'}" fill="url(#bp-flg)" stroke="${INK}" stroke-width="2"/>` +
          `<path class="bp-flk" d="${i === 1 ? 'M-9 0Q-13 44 0 96Q13 44 9 0' : 'M-7 0Q-10 30 0 64Q10 30 7 0'}" fill="none" stroke="${INK}" stroke-width="1.4"/></g>`,
      ).join('') +
      '</g>' +
      `<path d="${SILHOUETTE}" fill="url(#bp-sil)"/>` +
      `<path class="bp-hat" d="M206 232C206 160 240 104 260 72C280 104 314 160 314 232Z" fill="url(#bp-hp)" opacity=".5"/>` +
      `<path class="bp-hid" d="${hidden}" fill="none" stroke="${PALE}" stroke-width="1.6" opacity=".75"/>` +
      `<g class="bp-ink" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ink}</g>` +
      '</g>' +
      // The launch smoke and the vents.
      `<g fill="#1b4475" stroke="${INK}" stroke-width="2">${puffs}</g>` +
      `<g fill="${NAVY}" fill-opacity=".6" stroke="${INK}" stroke-width="1.6">${vents}</g>` +
      // Dimensions and the annotation balloons.
      `<g fill="none" stroke="${PALE}" stroke-width="1.4" stroke-opacity=".85">` +
      '<path d="M268 72H420M322 846H420M120 818V916M400 818V916" stroke-opacity=".6"/>' +
      dimV(412, 72, 846, 11, 5) +
      dimH(906, 120, 400, 12, 4) +
      balloon(132, 186, 222, 192, 21, 0) +
      balloon(132, 404, 196, 430, 22, 0.4) +
      balloon(132, 628, 186, 616, 23, 0.8) +
      `<path d="M150 440H178M342 440H370" stroke="${INK}" stroke-width="3" stroke-dasharray="14 4 3 4"/>` +
      `<path d="M150 440V426l-4 6h8l-4 -6M370 440V426l-4 6h8l-4 -6" stroke="${INK}"/>` +
      '</g>' +
      // Tool: the parallel rule.
      `<g class="bp-rule"><rect x="20" y="186" width="392" height="22" fill="${NAVY}" fill-opacity=".75" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="${ticks}M20 202H412" fill="none" stroke="${INK}" stroke-width="1.2"/></g>` +
      // Read: the magnifier.
      `<g class="bp-mag"><g transform="translate(262 206)"><circle r="46" fill="url(#bp-lens)" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M-33 33L-70 70" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M-36 36L-68 68" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>` +
      '<path d="M-28 -22A36 36 0 0 1 4 -36" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/></g></g>' +
      // Error: the red pen, the eraser and its smudge.
      `<ellipse class="bp-smg" cx="260" cy="446" rx="86" ry="50" fill="url(#bp-smg)"/>` +
      `<g fill="${PALE}">${crumbs}</g>` +
      `<g class="bp-era"><g transform="translate(260 438)"><g class="bp-erx"><rect x="-42" y="-24" width="84" height="48" rx="7" fill="${NAVY}" stroke="${INK}" stroke-width="2.4"/>` +
      `<rect x="-8" y="-24" width="30" height="48" fill="${PALE}" fill-opacity=".3" stroke="${INK}" stroke-width="1.6"/><path d="M-32 -10H-18M-32 0H-16M-32 10H-20" stroke="${PALE}" stroke-width="1.4"/></g></g></g>` +
      `<g fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">` +
      `<path class="bp-rc" pathLength="1" d="${scribble(342, 738, 66, 96, 3)}"/>` +
      `<g class="bp-rx"><path d="M352 748l26 34M378 748l-26 34M346 642Q362 610 392 596"/><path d="M392 596l-14 -2M392 596l-6 12"/>` +
      `<path d="${marks(352, 570, 31, 3, 1.1)}" stroke-width="2.4"/></g></g>` +
      // The scale bar along the foot.
      `<g class="mv-b"><g fill="none" stroke="${PALE}" stroke-width="1.2" stroke-opacity=".7">${scale}<path d="${marks(30, 964, 41, 2, 0.8)}${marks(334, 964, 42, 2, 0.8)}"/></g></g>` +
      // The far right: a detail view of the engine with its compass, and the moon on its orbit at the top.
      '<g class="mv-r"><g transform="translate(1440 400)">' +
      `<g fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">` +
      `<path d="M-26 -56L-30 -36Q-38 0 -68 52L-58 58Q-30 4 -20 -36L-18 -56ZM26 -56L30 -36Q38 0 68 52L58 58Q30 4 20 -36L18 -56Z" fill="url(#bp-hp)"/>` +
      '<path d="M-26 -56V-80Q-26 -88 -18 -88H18Q26 -88 26 -80V-56"/>' +
      `<path d="M-26 -76H26" stroke="${PALE}" stroke-dasharray="4 3"/>` +
      `<path class="bp-flow" d="M0 -70V48M-12 -64V30M12 -64V30" stroke="${PALE}" stroke-width="1.4"/>` +
      `<g transform="translate(50 -44)"><g class="bp-g1"><path d="${gear(22, 12)}" fill="${NAVY}" fill-rule="evenodd"/></g></g>` +
      `<g transform="translate(58.7 -11.6)"><g class="bp-g2"><path d="${gear(15, 8)}" fill="${NAVY}" fill-rule="evenodd"/></g></g></g>` +
      `<g transform="rotate(-60)"><path class="bp-dc" pathLength="1" d="M92 0A92 92 0 1 1 -92 0A92 92 0 1 1 92 0" fill="none" stroke="${INK}" stroke-width="2.6"/></g>` +
      `<circle cx="-65" cy="-65" r="14" fill="${NAVY}" stroke="${INK}" stroke-width="2"/><path d="${marks(-69, -70, 51, 1)}" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
      `<path d="${marks(-28, 110, 52, 5)}" fill="none" stroke="${PALE}" stroke-width="1.4"/>` +
      `<g class="bp-cmp" fill="${NAVY}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">` +
      '<path d="M41 -118L50 -118L3 -10L-2 -12Z"/><path d="M0 -11L0 0" stroke-width="1.4"/>' +
      '<path d="M43 -118L52 -118L96 -14L89 -12Z"/><path d="M89 -12L92 0L96 -14" fill="#e8f2ff"/>' +
      '<rect x="42" y="-152" width="8" height="22" rx="2"/><circle cx="46" cy="-124" r="9"/></g>' +
      '</g>' +
      '<g class="mv-t"><g transform="translate(1452 132)">' +
      `<circle r="56" fill="${NAVY}" stroke="${INK}" stroke-width="2.4"/>` +
      `<g fill="none" stroke="${PALE}" stroke-width="1.2" stroke-opacity=".5"><ellipse rx="20" ry="56"/><ellipse rx="40" ry="56"/><path d="M-48 -28H48M-56 0H56M-48 28H48"/></g>` +
      `<g fill="none" stroke="${INK}" stroke-width="1.6" stroke-opacity=".75"><circle cx="-18" cy="-20" r="9"/><circle cx="20" cy="14" r="12"/><circle cx="-10" cy="30" r="6"/></g>` +
      `<circle class="bp-wr" r="70" fill="none" stroke="${INK}" stroke-width="2"/>` +
      `<g transform="rotate(-12)"><ellipse rx="132" ry="38" fill="none" stroke="${PALE}" stroke-width="1.4" stroke-dasharray="7 6" stroke-opacity=".7"/>` +
      `<g class="bp-ox"><g class="bp-oy"><g fill="${NAVY}" stroke="${INK}" stroke-width="1.4"><rect x="-4" y="-3" width="8" height="6"/><path d="M-15 -3H-6V3H-15ZM6 -3H15V3H6Z"/></g></g></g>` +
      `<g class="bp-orr"><g class="bp-ox" style="animation-delay:-7s"><g class="bp-oy" style="animation-delay:-10.5s"><path d="M0 -10L4 -4V6L7 10H-7L-4 6V-4Z" fill="${NAVY}" stroke="${INK}" stroke-width="1.6" transform="rotate(80)"/></g></g></g></g>` +
      '</g></g></g>',
    nook:
      // The title block of the sheet, above the board, with its stamps.
      `<g fill="none" stroke="${INK}" stroke-width="2" stroke-opacity=".85"><path d="M232 40H412V124H232Z"/></g>` +
      `<g fill="none" stroke="${PALE}" stroke-width="1.2"><path d="M232 68H412M232 96H412M300 68V124M356 96V124"/>` +
      `<path d="${marks(244, 49, 61, 7, 1.2)}" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="${marks(310, 77, 62, 4)}${marks(310, 105, 63, 2)}${marks(240, 105, 64, 2, 0.9)}${marks(364, 105, 65, 1)}"/>` +
      '<path d="M266 72L271 80V92L275 96H257L261 92V80Z" stroke="#e8f2ff" stroke-width="1.4"/><path d="M386 118L394 104L402 118Z"/></g>' +
      `<g class="bp-sx" fill="none" stroke="${RED}" stroke-width="3"><circle cx="330" cy="82" r="32"/><circle cx="330" cy="82" r="25" stroke-width="1.6"/>` +
      `<path d="M308 104L352 60"/><path d="${marks(312, 76, 71, 3, 1.1)}" stroke-width="2"/></g>` +
      `<g class="bp-so" fill="none" stroke="${GREEN}" stroke-width="3"><circle cx="330" cy="82" r="32"/>` +
      '<path d="M330 60L336 76L353 76L339 86L344 103L330 93L316 103L321 86L307 76L324 76Z" stroke-width="2.2" stroke-linejoin="round"/></g>',
  }
}
