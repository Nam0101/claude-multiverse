import type { Activity } from '../../types'
import { f, random } from './kit'
import { cell } from './rig'
import type { World } from './world'

// Ninja Moon: a hooded ninja codes on a rooftop terrace beside a paper lantern. A tiered castle keep stands on its
// stone base under a huge red moon. When a command runs three ninjas dash and leap across the rooftops, throwing
// stars arcing; an error drops a lantern and scatters the crows; done turns the moon silver and swirls the petals.
const INK = '#06050b'
const WOOD = '#2a1c18'
const WOOD_EDGE = '#43302a'
const CREST = '#a8283c'
const PETAL = ['#f4a6bd', '#ffd3e0', '#e888a6']

/** A curved, upturned castle roof: eaves at `y`, ridge `h` above, `w` to either side. */
function roof(cx: number, y: number, w: number, h: number): string {
  const a = (dx: number, dy: number) => `${f(cx + dx)} ${f(y + dy)}`

  return (
    `<path d="M${a(-w, -12)}Q${a(-w * 0.7, 8)} ${a(-w * 0.4, 2)}H${f(cx + w * 0.4)}Q${a(w * 0.7, 8)} ${a(w, -12)}` +
    `Q${a(w * 0.64, -8)} ${a(w * 0.5, -h * 0.4)}Q${a(w * 0.3, -h * 0.9)} ${a(0, -h)}Q${a(-w * 0.3, -h * 0.9)} ${a(-w * 0.5, -h * 0.4)}` +
    `Q${a(-w * 0.64, -8)} ${a(-w, -12)}Z" fill="#0b0813" stroke="#4a1a30" stroke-opacity=".7" stroke-width="2" stroke-linejoin="round"/>`
  )
}

/** One castle storey: a wall, posts, and lit paper windows that wake one after another while Claude reads. */
function storey(cx: number, y0: number, y1: number, w: number, windows: number, seed: number): string {
  const next = random(seed)
  const lit = Array.from({ length: windows }, (_, i) => {
    const x = cx - w / 2 + ((i + 0.5) * w) / windows - 4

    return `<rect class="nj-win" style="--wd:${f(next() * 2.4)}s" x="${f(x)}" y="${f(y0 + (y1 - y0) * 0.35)}" width="8" height="${f((y1 - y0) * 0.38)}" rx="1.5" fill="#ffb35a"/>`
  }).join('')

  return (
    `<rect x="${f(cx - w / 2)}" y="${y0}" width="${w}" height="${y1 - y0}" fill="#17121f" stroke="#2c1d36" stroke-width="2"/>` +
    `<path d="M${f(cx - w / 2 + 8)} ${y0}V${y1}M${f(cx + w / 2 - 8)} ${y0}V${y1}M${f(cx - w / 2)} ${f(y1 - 6)}H${f(cx + w / 2)}" stroke="#08060e" stroke-width="3"/>` +
    lit
  )
}

function castle(): string {
  const cx = 300
  const courses = Array.from(
    { length: 6 },
    (_, i) => `<path d="M${f(120 + i * 8 + 10)} ${f(630 + i * 22)}Q${cx} ${f(618 + i * 22)} ${f(480 - i * 8 - 10)} ${f(630 + i * 22)}" fill="none" stroke="#2c2036" stroke-width="2"/>`,
  ).join('')

  return (
    // The stone base, its wall curving out at the foot.
    '<path d="M104 780C128 720 150 660 172 612H428C450 660 472 720 496 780Z" fill="#120d1a" stroke="#34233f" stroke-width="2"/>' +
    courses +
    '<path d="M268 780V716Q300 690 332 716V780Z" fill="#05040a"/>' +
    storey(cx, 520, 612, 230, 5, 21) +
    roof(cx, 520, 172, 40) +
    storey(cx, 442, 516, 176, 4, 22) +
    roof(cx, 442, 134, 38) +
    storey(cx, 376, 438, 124, 3, 23) +
    roof(cx, 376, 102, 36) +
    storey(cx, 330, 372, 84, 2, 24) +
    roof(cx, 330, 80, 44) +
    // Ridge ornaments and a finial.
    `<path d="M${cx} 286V262M${cx - 7} 266L${cx} 252L${cx + 7} 266" stroke="#4a1a30" stroke-width="3" fill="none"/>` +
    '<path d="M214 516C204 506 202 496 210 490M386 516C396 506 398 496 390 490" stroke="#4a1a30" stroke-width="3" fill="none"/>'
  )
}

/** A pine silhouette: stacked boughs on a trunk, as one path. */
function pine(x: number, y: number, h: number, w: number, fill: string): string {
  const tiers = 5
  const left: string[] = [`${f(x)} ${f(y - h)}`]

  for (let t = 0; t < tiers; t += 1) {
    const bottom = y - h * 0.3 - (h * 0.7 * (tiers - 1 - t)) / tiers
    const half = (w / 2) * (0.38 + (0.62 * (t + 1)) / tiers)

    left.push(`${f(x - half * 0.55)} ${f(bottom - h * 0.06)}`, `${f(x - half)} ${f(bottom)}`, `${f(x - half * 0.3)} ${f(bottom - h * 0.02)}`)
  }

  const right = left
    .slice(1)
    .reverse()
    .map(p => {
      const [px = 0, py = 0] = p.split(' ').map(Number)

      return `${f(2 * x - px)} ${py}`
    })

  return `<path d="M${left.join('L')}L${f(x - 6)} ${f(y - h * 0.28)}V${y}H${f(x + 6)}V${f(y - h * 0.28)}L${right.join('L')}Z" fill="${fill}"/>`
}

/** A ninja on the ridge, facing right, feet at the origin: leaping, a blade over the shoulder, a scarf in the wind. */
function ninja(): string {
  return (
    `<g fill="${INK}">` +
    '<circle cx="3" cy="-52" r="8"/><path d="M-6 -46L8 -44L11 -24L-5 -20Z"/>' +
    `<path d="M-7 -44L-34 -74" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/></g>` +
    `<g fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">` +
    '<path d="M-2 -24L-26 -10L-38 -22"/><path d="M5 -24L26 -10L40 -22"/>' +
    '<path d="M2 -42L-18 -37L-34 -44"/><path d="M8 -42L26 -50"/></g>' +
    `<path d="M-3 -56Q-22 -64 -38 -54Q-28 -52 -42 -46" fill="none" stroke="${CREST}" stroke-width="3.2" stroke-linecap="round"/>` +
    '<rect x="3" y="-54" width="7" height="2.2" rx="1" fill="#f2e8d0" fill-opacity=".85"/>'
  )
}

/** A throwing star leaving the ninja's hand: it travels across, rises and falls, and spins. */
function star(delay: number): string {
  return (
    `<g transform="translate(26 -50)"><g class="nj-sx" style="animation-delay:${f(delay)}s"><g class="nj-sy" style="animation-delay:${f(delay)}s">` +
    '<path class="nj-spin" d="M0 -8L2.4 -2.4L8 0L2.4 2.4L0 8L-2.4 2.4L-8 0L-2.4 -2.4Z" fill="#dfe6f0"/></g></g></g>'
  )
}

function dasher(y: number, scale: number, delay: number, seconds: number): string {
  return (
    `<g transform="translate(0 ${y}) scale(${scale})"><g class="nj-dash" style="animation-duration:${seconds}s;animation-delay:${f(delay)}s">` +
    `<g class="nj-hop" style="animation-delay:${f(delay * 0.7)}s">${ninja()}${star(delay * 0.3)}</g></g></g>`
  )
}

function crow(x: number, y: number, s: number, dx: number, dy: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="nj-crow" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${f(delay)}s">` +
    `<g class="nj-perch"><path d="M-8 0C-8 -9 2 -13 10 -9L17 -11L12 -6C12 -1 6 2 0 2Z M-8 -1L-18 3L-8 3Z" fill="${INK}"/></g>` +
    `<g class="nj-flap"><path d="M-14 0Q-7 -12 0 0Q7 -12 14 0" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/></g></g></g>`
  )
}

function cat(x: number, y: number): string {
  return (
    `<g transform="translate(${x} ${y})"><path d="M-2 0C-4 -16 2 -26 10 -30C8 -34 9 -40 12 -44L16 -39L22 -39L26 -44C29 -40 30 -34 28 -30C36 -26 40 -16 38 0Z" fill="${INK}"/>` +
    `<path class="nj-tail" d="M38 -3C58 -2 62 -22 54 -32" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    '<ellipse cx="16" cy="-35" rx="1.7" ry="2.2" fill="#ffd96b"/><ellipse cx="22" cy="-35" rx="1.7" ry="2.2" fill="#ffd96b"/></g>'
  )
}

function hawk(): string {
  const wing = 'M-4 0C-20 -26 -52 -34 -82 -24C-60 -18 -40 -8 -22 4Z'

  return (
    '<g transform="translate(1700 190) scale(1.3)"><g class="nj-hawk"><g class="nj-glide">' +
    `<path d="M-6 0C-6 -9 6 -12 18 -6L30 -4L18 0C10 8 -2 8 -10 4L-30 12L-26 2Z" fill="${INK}"/>` +
    `<path d="M-14 6L-26 18L-14 12Z" fill="${INK}"/>` +
    '<path d="M2 8H16" stroke="#8a2234" stroke-width="3" stroke-linecap="round"/><rect x="-2" y="8" width="20" height="5" rx="2" fill="#2a1c18" stroke="#8a2234" stroke-opacity=".7"/>' +
    `<g class="nj-wing"><path d="${wing}" fill="${INK}"/></g>` +
    `<g class="nj-wing nj-wing2"><path d="${wing}" fill="${INK}" transform="translate(0 4) scale(.9)"/></g>` +
    '</g></g></g>'
  )
}

function bamboo(x: number, top: number, d: number, seed: number): string {
  const next = random(seed)
  const base = 1010
  const w = 9 + next() * 4
  const nodes: string[] = []
  const leaves: string[] = []

  for (let y = base - 90; y > top; y -= 66 + next() * 14) {
    nodes.push(`M${f(x - w / 2 - 1)} ${f(y)}h${f(w + 2)}`)

    if (y < top + 420) {
      const side = next() < 0.5 ? -1 : 1
      const len = 44 + next() * 36

      leaves.push(`M${f(x)} ${f(y)}Q${f(x + side * len * 0.5)} ${f(y - 14)} ${f(x + side * len)} ${f(y + 8 + next() * 14)}Q${f(x + side * len * 0.5)} ${f(y - 2)} ${f(x)} ${f(y)}Z`)
    }
  }

  return (
    `<g class="nj-bam" style="animation-delay:${f(d)}s">` +
    `<path d="M${f(x - w / 2)} ${base}L${f(x - w / 3)} ${top}H${f(x + w / 3)}L${f(x + w / 2)} ${base}Z" fill="#0c1b1a" stroke="#1f3a36" stroke-opacity=".6" stroke-width="1.4"/>` +
    `<path d="${nodes.join('')}" stroke="#274a44" stroke-opacity=".8" stroke-width="2.4" fill="none"/>` +
    `<path d="${leaves.join('')}" fill="#0f2421"/></g>`
  )
}

/** Drifting cherry petals: one path each, falling and tumbling on its own clock. */
function petals(): string {
  const next = random(808)

  return Array.from({ length: 30 }, (_, i) => {
    const x = -40 + next() * 1700
    const s = 0.8 + next() * 0.9
    const d = `M${f(x)} 0C${f(x + 4 * s)} ${f(-4 * s)} ${f(x + 9 * s)} ${f(-2 * s)} ${f(x + 9 * s)} ${f(3 * s)}C${f(x + 5 * s)} ${f(6 * s)} ${f(x + 2 * s)} ${f(5 * s)} ${f(x)} 0Z`

    return `<path class="nj-pt" d="${d}" fill="${PETAL[i % 3]}" style="--sx:${f((next() - 0.3) * 280)}px;animation-duration:${f(13 + next() * 12)}s;animation-delay:${f(-next() * 24)}s"/>`
  }).join('')
}

/** The petals that swirl up in the finish. */
function swirl(): string {
  const next = random(909)

  return Array.from({ length: 26 }, (_, i) => {
    const x = 60 + next() * 1480
    const y = 980 - next() * 160
    const s = 1.1 + next() * 0.8
    const d = `M${f(x)} ${f(y)}C${f(x + 4 * s)} ${f(y - 4 * s)} ${f(x + 9 * s)} ${f(y - 2 * s)} ${f(x + 9 * s)} ${f(y + 3 * s)}C${f(x + 5 * s)} ${f(y + 6 * s)} ${f(x + 2 * s)} ${f(y + 5 * s)} ${f(x)} ${f(y)}Z`
    const a = (next() - 0.5) * 340

    return (
      `<path class="nj-sw" d="${d}" fill="${PETAL[i % 3]}" ` +
      `style="--a:${f(a)}px;--b:${f(-a * 0.8)}px;--c:${f(a * 0.6)}px;animation-delay:${f(next() * 1.4)}s;animation-duration:${f(3.4 + next() * 1.6)}s"/>`
    )
  }).join('')
}

/** The laptop, a rolled scroll and a paper lantern on the low table, a throwing star beside them. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const flame = activity === 'thinking' ? 'nj-fl nj-fast' : 'nj-fl'

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#1b1a26"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#1b1a26"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The scroll.
    '<rect x="364" y="321" width="34" height="9" rx="4.5" fill="#e8dcc2" fill-opacity=".92"/><rect x="376" y="321" width="4" height="9" fill="#8a2234"/>' +
    `<circle cx="368" cy="325.5" r="2.4" fill="none" stroke="#9a8a62"/>` +
    // The paper lantern: layered glow instead of a gradient, so it holds up wherever the desk is drawn.
    `<g class="${flame}"><circle cx="428" cy="298" r="76" fill="#ffb25a" fill-opacity=".05"/><circle cx="428" cy="298" r="52" fill="#ffb25a" fill-opacity=".08"/><circle cx="428" cy="298" r="32" fill="#ffc77a" fill-opacity=".12"/>` +
    '<rect x="412" y="276" width="32" height="48" fill="#ffd9a0" fill-opacity=".88"/></g>' +
    `<rect x="408" y="270" width="40" height="60" fill="none" stroke="${WOOD}" stroke-width="4"/><path d="M428 272V326M410 298H446" stroke="${WOOD}" stroke-width="2.4"/>` +
    '<path d="M402 270L428 252L454 270Z" fill="#150f13" stroke="#43302a"/><rect x="404" y="326" width="48" height="5" fill="#150f13"/>' +
    // A throwing star on the table.
    '<path d="M352 326L353.6 322.4L357 321L353.6 319.6L352 316L350.4 319.6L347 321L350.4 322.4Z" fill="#cdd5e2" transform="translate(0 4)"/>'
  )
}

export function ninjaMoonWorld(): World {
  const next = random(41)
  const stars = Array.from(
    { length: 34 },
    (_, i) => `<circle class="nj-tw" style="animation-delay:${f(-next() * 5)}s;animation-duration:${f(3 + next() * 4)}s" cx="${f(next() * 1600)}" cy="${f(next() * 480)}" r="${f(0.8 + next() * 1.1)}" fill="#dfe6f4"/>`,
  ).join('')
  const horizon = Array.from({ length: 13 }, (_, i) => pine(40 + i * 126 + next() * 40, 770, 70 + next() * 90, 34 + next() * 14, '#130c1d')).join('')
  const cranes = [
    `<path d="M180 160q10 -8 20 0q10 -8 20 0" fill="none" stroke="#0a0710" stroke-width="2"/>`,
  ].join('')
  const crowsOn =
    crow(182, 445, 1.5, -300, -360, 0) +
    crow(235, 358, 1.4, -200, -420, 0.1) +
    crow(420, 447, 1.5, 300, -380, 0.05) +
    crow(250, 794, 1.5, -360, -300, 0.2) +
    crow(56, 600, 1.5, -240, -400, 0.3)
  const ridgeRows = [836, 858, 882, 908, 936, 966, 996]
    .map((y, i) => `<path d="M-20 ${y}H1640" stroke="${i % 2 ? '#14101e' : '#191325'}" stroke-width="13" stroke-dasharray="15 3"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#05040a',
      furniture: WOOD,
      metal: '#1b1a26',
      paper: '#e8dcc2',
      light: { idle: '#5d7390', work: '#8fd0ff', bright: '#e4f4ff' },
      headTop: 222,
      glowAt: [345, 284],
      device,
      wear: {
        // A katana over the shoulder, its hilt wrapped.
        behind:
          `<path d="M116 330L50 214" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
          '<path d="M58 226L48 208" stroke="#7a2234" stroke-width="7" stroke-linecap="round" stroke-dasharray="3 3"/>' +
          `<circle cx="63" cy="233" r="8" fill="#1a1522" stroke="#4a3a5a" stroke-width="2"/>`,
        // The hood and the face wrap, with the eye slit between them left open on the coral.
        front:
          `<path d="M62 262C62 226 100 214 150 214C200 214 238 226 238 262H226V250H74V262Z" fill="#100d19" stroke="#2a2238" stroke-width="2" stroke-linejoin="round"/>` +
          '<path d="M96 232Q150 222 204 232" fill="none" stroke="#2a2238" stroke-width="2"/>' +
          cell(2, 1, 1.9, 5, ' fill="#100d19"') +
          cell(10.1, 1, 1.9, 5, ' fill="#100d19"') +
          '<path d="M70 326Q150 314 230 326V350H70Z" fill="#100d19"/>' +
          '<path d="M80 336L220 330M78 344L222 338" stroke="#2a2238" stroke-width="2"/>' +
          // A crimson scarf knotted at the cheek, its tails in the wind.
          `<circle cx="76" cy="292" r="6" fill="${CREST}"/>` +
          `<path class="nj-scarf" d="M72 292L38 280L48 292L30 304L56 298Z" fill="${CREST}"/>` +
          `<path class="nj-scarf nj-scarf2" d="M72 294L44 312L56 314L40 328L68 304Z" fill="#7a1c2c"/>`,
      },
      seatArt:
        `<path d="M104 352Q98 404 106 456H196Q204 404 198 352Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M104 392H198M102 424H200" stroke="#7a2234" stroke-width="5"/>` +
        '<g fill="#4a3a30"><circle cx="118" cy="372" r="2.4"/><circle cx="151" cy="372" r="2.4"/><circle cx="184" cy="372" r="2.4"/></g>' +
        '<ellipse cx="151" cy="352" rx="46" ry="7" fill="#4a1a28" stroke="#6a2a3a"/>',
      tableArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="13" rx="2"/>` +
        '<rect x="180" y="343" width="270" height="6"/><rect x="178" y="349" width="14" height="107"/><rect x="444" y="349" width="14" height="107"/>' +
        '<rect x="192" y="410" width="252" height="7"/></g>' +
        '<g fill="#a8283c" fill-opacity=".8"><rect x="166" y="330" width="9" height="13" rx="2"/><rect x="461" y="330" width="9" height="13" rx="2"/></g>',
    },
    style:
      '.nj-tw{animation:nj-tw 4s ease-in-out infinite alternate;opacity:.25}@keyframes nj-tw{to{opacity:.8}}' +
      '.nj-cl{animation:nj-cl 36s ease-in-out infinite alternate}.nj-cl2{animation-duration:48s;animation-direction:alternate-reverse}@keyframes nj-cl{to{transform:translateX(70px)}}' +
      '.nj-halo{animation:nj-halo 7s ease-in-out infinite alternate}@keyframes nj-halo{from{opacity:.8}to{opacity:1}}' +
      '.st-thinking .nj-halo{animation-duration:2.6s}' +
      // The moon: red, then silver once the work is done.
      '.nj-silver{opacity:0}.st-done .nj-red{animation:nj-fadeout 2.6s ease-in-out .3s both}.st-done .nj-silver{animation:nj-fadein 2.6s ease-in-out .3s both}' +
      '@keyframes nj-fadeout{to{opacity:0}}@keyframes nj-fadein{to{opacity:1}}' +
      '.nj-cool{opacity:0}.st-done .nj-cool{animation:nj-cool 2.8s ease-in-out .3s both}@keyframes nj-cool{to{opacity:.3}}' +
      // Petals.
      '.nj-pt{transform-box:fill-box;transform-origin:center;opacity:0;animation:nj-fall 18s linear infinite}' +
      '@keyframes nj-fall{0%{opacity:0;transform:translate(0,-30px) rotate(0)}6%{opacity:.8}50%{transform:translate(calc(var(--sx)*.6),520px) rotate(200deg)}92%{opacity:.8}100%{opacity:0;transform:translate(var(--sx),1060px) rotate(400deg)}}' +
      '.st-tool .nj-pt{animation-duration:8s}' +
      '.nj-sw{transform-box:fill-box;transform-origin:center;opacity:0}' +
      '.st-done .nj-sw{animation:nj-sw 4.4s ease-in-out both}' +
      '@keyframes nj-sw{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.9}35%{transform:translate(var(--a),-300px) rotate(240deg)}65%{transform:translate(var(--b),-620px) rotate(520deg)}100%{opacity:0;transform:translate(var(--c),-980px) rotate(780deg)}}' +
      // Castle windows.
      '.nj-win{animation:nj-win 5s ease-in-out infinite alternate;opacity:.7}@keyframes nj-win{to{opacity:1}}' +
      '.st-responding .nj-win{opacity:1;animation:none}' +
      '.st-read .nj-win{animation:nj-scan 1.8s ease-in-out infinite;animation-delay:var(--wd)}@keyframes nj-scan{0%,100%{opacity:.3}50%{opacity:1}}' +
      // The cat's tail, the paper lantern's flame, the scarf.
      '.nj-tail{transform-box:fill-box;transform-origin:0 100%;animation:nj-tail 3.4s ease-in-out infinite alternate}@keyframes nj-tail{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}' +
      '.nj-fl{animation:nj-fl 3s ease-in-out infinite alternate}@keyframes nj-fl{from{opacity:.78}to{opacity:1}}.nj-fast{animation-duration:.9s}' +
      '.nj-scarf{transform-box:fill-box;transform-origin:100% 50%;animation:nj-scarf 1.5s ease-in-out infinite alternate}.nj-scarf2{animation-delay:-.7s}' +
      '@keyframes nj-scarf{from{transform:rotate(-7deg) scaleX(.92)}to{transform:rotate(8deg) scaleX(1.06)}}' +
      // Bamboo sways softly, and hard while a tool works.
      '.nj-bam{transform-box:fill-box;transform-origin:50% 100%;animation:nj-bam 5.5s ease-in-out infinite alternate}@keyframes nj-bam{from{transform:rotate(-1deg)}to{transform:rotate(1.4deg)}}' +
      '.st-tool .nj-bam{animation:nj-bamh .85s ease-in-out infinite alternate}@keyframes nj-bamh{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}' +
      // The messenger hawk.
      '.nj-hawk{opacity:0}.st-web .nj-hawk{animation:nj-hawk 5.2s linear infinite;animation-delay:-1.4s}' +
      '@keyframes nj-hawk{0%{opacity:0;transform:translateX(0)}6%,94%{opacity:.95}100%{opacity:0;transform:translateX(-2100px)}}' +
      '.st-web .nj-glide{animation:nj-glide 1.7s ease-in-out infinite alternate}@keyframes nj-glide{from{transform:translateY(-14px)}to{transform:translateY(16px)}}' +
      '.nj-wing{transform-box:fill-box;transform-origin:100% 100%;animation:nj-wing .46s ease-in-out infinite alternate}.nj-wing2{animation-delay:-.1s;opacity:.6}@keyframes nj-wing{from{transform:scaleY(1.1)}to{transform:scaleY(-.55)}}' +
      // The dash: three ninjas cross the rooftops, hopping, each throwing stars that arc ahead.
      '.nj-dash{opacity:0}.st-run .nj-dash{animation:nj-dash 3.6s linear infinite}' +
      '@keyframes nj-dash{0%{opacity:0;transform:translateX(-200px)}4%,94%{opacity:1}100%{opacity:0;transform:translateX(1800px)}}' +
      '.st-run .nj-hop{animation:nj-hop .9s infinite}@keyframes nj-hop{0%,100%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.6,.4,1)}45%{transform:translateY(-78px);animation-timing-function:cubic-bezier(.6,0,.8,.4)}90%{transform:translateY(0)}}' +
      '.nj-sx,.nj-sy{opacity:0}.st-run .nj-sx{animation:nj-sx 1.3s linear infinite}.st-run .nj-sy{animation:nj-sy 1.3s infinite}' +
      '@keyframes nj-sx{0%{opacity:0;transform:translateX(0)}6%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translateX(340px)}}' +
      '@keyframes nj-sy{0%{transform:translateY(0);animation-timing-function:ease-out}40%{transform:translateY(-70px);animation-timing-function:ease-in}100%{transform:translateY(40px)}}' +
      '.nj-spin{transform-box:fill-box;transform-origin:center;animation:mv-spin .4s linear infinite}' +
      // The crows sit on the eaves; an error sends them scattering.
      '.nj-flap{opacity:0}.nj-flap path{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-error .nj-perch{opacity:0}.st-error .nj-flap{opacity:1}.st-error .nj-flap path{animation:nj-wf .26s ease-in-out infinite alternate}' +
      '@keyframes nj-wf{from{transform:scaleY(1)}to{transform:scaleY(-.6)}}' +
      '.st-error .nj-crow{animation:nj-scatter 3.2s ease-in both}' +
      '@keyframes nj-scatter{0%{opacity:1;transform:translate(0,0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // The lantern drops, lands and flares softly.
      '.st-error .nj-lan{animation:nj-drop 1.3s cubic-bezier(.5,0,.9,.55) both}' +
      '@keyframes nj-drop{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(18px,420px) rotate(38deg)}}' +
      '.nj-lflare{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .nj-lflare{animation:nj-lflare 2.6s ease-out 1.2s both}' +
      '@keyframes nj-lflare{0%{opacity:0;transform:scale(.5)}25%{opacity:.34}100%{opacity:0;transform:scale(2.4)}}' +
      '.st-error .nj-lamp{animation:nj-lamp 3.6s ease-in .1s both}@keyframes nj-lamp{0%,60%{opacity:1}100%{opacity:.3}}',
    scenery:
      '<defs><linearGradient id="nj-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05050d"/><stop offset=".55" stop-color="#110a1d"/><stop offset="1" stop-color="#2a0f22"/></linearGradient>' +
      '<radialGradient id="nj-hr"><stop offset="0" stop-color="#d03a4c" stop-opacity=".32"/><stop offset=".5" stop-color="#8a1a2e" stop-opacity=".12"/><stop offset="1" stop-color="#8a1a2e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nj-hs"><stop offset="0" stop-color="#cfdcf0" stop-opacity=".3"/><stop offset=".5" stop-color="#8aa0c4" stop-opacity=".11"/><stop offset="1" stop-color="#8aa0c4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nj-mr" cx=".42" cy=".38"><stop offset="0" stop-color="#c8343f"/><stop offset=".7" stop-color="#8e1c2c"/><stop offset="1" stop-color="#5e1020"/></radialGradient>' +
      '<radialGradient id="nj-ms" cx=".42" cy=".38"><stop offset="0" stop-color="#f1f5fb"/><stop offset=".7" stop-color="#b8c5d8"/><stop offset="1" stop-color="#8493ac"/></radialGradient>' +
      '<linearGradient id="nj-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1c36" stop-opacity="0"/><stop offset="1" stop-color="#7a1c36" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="nj-cool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a5a9a" stop-opacity="0"/><stop offset="1" stop-color="#4a6aa8" stop-opacity=".7"/></linearGradient>' +
      '<radialGradient id="nj-lg"><stop offset="0" stop-color="#ffc060" stop-opacity=".9"/><stop offset=".4" stop-color="#ff9a3a" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#nj-sky)"/>' +
      stars +
      // The moon.
      '<g class="nj-halo"><circle class="nj-red" cx="340" cy="296" r="330" fill="url(#nj-hr)"/><circle class="nj-silver" cx="340" cy="296" r="330" fill="url(#nj-hs)"/></g>' +
      '<g class="nj-red"><circle cx="340" cy="296" r="150" fill="url(#nj-mr)"/>' +
      '<g fill="#5a0f1e" fill-opacity=".4"><ellipse cx="296" cy="262" rx="30" ry="22"/><ellipse cx="382" cy="338" rx="38" ry="26"/><ellipse cx="360" cy="236" rx="16" ry="12"/><ellipse cx="280" cy="348" rx="18" ry="14"/></g></g>' +
      '<g class="nj-silver"><circle cx="340" cy="296" r="150" fill="url(#nj-ms)"/>' +
      '<g fill="#6a7c98" fill-opacity=".35"><ellipse cx="296" cy="262" rx="30" ry="22"/><ellipse cx="382" cy="338" rx="38" ry="26"/><ellipse cx="360" cy="236" rx="16" ry="12"/><ellipse cx="280" cy="348" rx="18" ry="14"/></g></g>' +
      `<g class="nj-cl"><ellipse cx="520" cy="200" rx="200" ry="14" fill="#1a0f26" fill-opacity=".85"/><ellipse cx="260" cy="330" rx="170" ry="10" fill="#1a0f26" fill-opacity=".8"/></g>` +
      `<g class="nj-cl nj-cl2"><ellipse cx="900" cy="130" rx="260" ry="16" fill="#150c20" fill-opacity=".8"/><ellipse cx="1300" cy="250" rx="220" ry="12" fill="#1a0f26" fill-opacity=".8"/></g>` +
      cranes +
      // Mountains, the horizon haze and the far pines.
      '<path d="M-20 700L120 590L240 660L380 560L520 650L700 580L900 660L1100 570L1280 650L1440 590L1620 670V820H-20Z" fill="#160d22"/>' +
      '<path d="M-20 750L180 670L340 730L560 650L760 730L980 660L1200 740L1400 670L1620 740V820H-20Z" fill="#0f0919"/>' +
      '<rect y="560" width="1600" height="260" fill="url(#nj-hz)"/>' +
      '<rect class="nj-cool" y="400" width="1600" height="420" fill="url(#nj-cool)"/>' +
      horizon +
      '<g transform="translate(300 780) scale(1.25) translate(-300 -780)">' +
      castle() +
      '</g>' +
      // Pines on both flanks.
      pine(40, 800, 420, 130, '#0b0714') +
      pine(120, 800, 300, 100, '#0d0816') +
      '<g class="mv-r">' +
      pine(1300, 800, 470, 150, '#0b0714') +
      pine(1400, 800, 360, 120, '#0d0816') +
      pine(1530, 800, 520, 150, '#0b0714') +
      // The lantern on its beam: it is the one that falls.
      `<rect x="1250" y="320" width="160" height="9" rx="3" fill="${WOOD}"/><path d="M1370 329V352" stroke="#43302a" stroke-width="2"/>` +
      '<g class="nj-lan"><g class="nj-lflare"><circle cx="1370" cy="378" r="60" fill="url(#nj-lg)"/></g><g class="nj-lamp">' +
      '<circle cx="1370" cy="378" r="46" fill="url(#nj-lg)" fill-opacity=".5"/>' +
      '<ellipse cx="1370" cy="378" rx="18" ry="24" fill="#e0573a" fill-opacity=".92" stroke="#43302a" stroke-width="2"/><path d="M1352 378H1388M1370 354V402" stroke="#43302a" stroke-width="1.6"/>' +
      '<rect x="1360" y="350" width="20" height="5" fill="#150f13"/><rect x="1360" y="401" width="20" height="5" fill="#150f13"/></g></g>' +
      crow(1270, 468, 1, 320, -340, 0.15) +
      bamboo(1470, 40, 0, 11) +
      bamboo(1520, 150, -1.1, 12) +
      bamboo(1566, 20, -2.3, 13) +
      bamboo(1440, 330, -.6, 14) +
      bamboo(1592, 260, -1.7, 15) +
      '</g>' +
      bamboo(20, 120, -.9, 16) +
      bamboo(62, 300, -2, 17) +
      crowsOn +
      // The rooftops: the ridge the ninjas run along, tile rows below it, the cat on the ridge.
      '<g class="mv-b">' +
      '<path d="M-20 1100V800Q300 806 600 800T1200 800T1640 800V1100Z" fill="#0a0812"/>' +
      '<path d="M-20 800H1640" stroke="#241a32" stroke-width="12" stroke-dasharray="17 2"/>' +
      '<path d="M-20 806H1640" stroke="#05040a" stroke-width="3"/>' +
      ridgeRows +
      '<path d="M60 800L50 770L74 794ZM1520 800L1530 770L1506 794Z" fill="#241a32"/>' +
      cat(150, 794) +
      dasher(794, 1.8, -0.2, 3.6) +
      dasher(796, 1.5, -1.5, 3.6) +
      dasher(792, 1.9, -2.7, 3.6) +
      '</g>' +
      petals() +
      '<g class="mv-r"><g class="mv-t">' +
      hawk() +
      '</g></g>' +
      swirl(),
    nook:
      // The terrace the desk stands on: boards, an eave line behind, and a lantern post.
      '<rect x="-80" y="452" width="520" height="22" fill="#1a1210"/><path d="M-80 452H440" stroke="#43302a" stroke-width="2"/>' +
      '<path d="M-60 456V470M20 456V470M100 456V470M180 456V470M260 456V470M340 456V470M420 456V470" stroke="#0c0807" stroke-width="2"/>',
    front:
      '<g fill="#f4a6bd" fill-opacity=".8"><path class="nj-pt" style="--sx:-40px;animation-duration:9s;animation-delay:-2s" d="M300 150C304 146 309 148 309 153C305 156 302 155 300 150Z"/>' +
      '<path class="nj-pt" style="--sx:-60px;animation-duration:11s;animation-delay:-6s" d="M360 150C364 146 369 148 369 153C365 156 362 155 360 150Z"/></g>',
  }
}
