import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Lost Temple: a jungle at night around a huge carved stone face with a doorway beneath it, a waterfall at the
// left and a rope bridge over a gorge. When a command runs a giant stone rolls out of the doorway and thunders
// across the foreground; when it is done the gem eyes and the doorway light up gold.
const STONE = '#1a2622'
const STONE_HI = '#2c3f38'
const STONE_LO = '#0c1412'
const GEM = '#3dffc0'
const BRASS = '#b08a3a'
const WOOD = '#4a3824'
const LEAF = '#12301c'

/** A hanging vine: a thin stem plus leaves as one dotted stroke, swaying from its top. */
function vine(x: number, len: number, bend: number, d: number): string {
  const path = `M${x} -10C${x + bend} ${f(len * 0.35)} ${x - bend} ${f(len * 0.7)} ${x + bend / 2} ${len}`

  return (
    `<g class="lt-vn" style="transform-origin:${x}px -10px;animation-delay:${f(d)}s">` +
    `<path d="${path}" fill="none" stroke="#1b4a2a" stroke-width="3"/>` +
    `<path d="${path}" fill="none" stroke="#1f5a30" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 17"/></g>`
  )
}

/** A giant leaf pointing along `angle` from (x, y). */
function leaf(x: number, y: number, len: number, angle: number, d: number, fill = LEAF): string {
  const w = len * 0.28

  return (
    `<g transform="translate(${x} ${y}) rotate(${angle})"><g class="lt-lf" style="animation-delay:${f(d)}s">` +
    `<path d="M0 0C${f(len * 0.3)} ${f(-w * 1.2)} ${f(len * 0.8)} ${f(-w)} ${len} 0C${f(len * 0.8)} ${f(w)} ${f(len * 0.3)} ${f(w * 1.2)} 0 0Z" fill="${fill}" stroke="#1d4a2a" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M0 0H${len}M${f(len * 0.3)} 0L${f(len * 0.5)} ${f(-w * 0.9)}M${f(len * 0.5)} 0L${f(len * 0.7)} ${f(-w * 0.8)}M${f(len * 0.3)} 0L${f(len * 0.5)} ${f(w * 0.9)}M${f(len * 0.5)} 0L${f(len * 0.7)} ${f(w * 0.8)}" stroke="#2a6a3c" stroke-opacity=".6" stroke-width="2" fill="none"/></g></g>`
  )
}

/** The bridge: ropes, a deck of planks (a few can fall), and the hangers. */
function bridge(): string {
  const p0: [number, number] = [590, 440]
  const p1: [number, number] = [1030, 540]
  const p2: [number, number] = [1480, 460]
  const at = (t: number): [number, number, number] => {
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])

    return [x, y, Math.atan2(dy, dx)]
  }
  const fixed: string[] = []
  const hangers: string[] = []
  let loose = ''
  const n = 30

  for (let i = 1; i < n; i += 1) {
    const [x, y, a] = at(i / n)
    const c = Math.cos(a) * 11
    const s = Math.sin(a) * 11
    const px = -Math.sin(a) * 5
    const py = Math.cos(a) * 5
    const poly = `M${f(x - c + px)} ${f(y - s + py)}L${f(x + c + px)} ${f(y + s + py)}L${f(x + c - px)} ${f(y + s - py)}L${f(x - c - px)} ${f(y - s - py)}Z`
    const fall = i >= 8 && i < 22

    if (fall) {
      loose += `<path class="lt-pl" style="--d:${f((i - 8) * 0.1)}s;--x:${(i % 2 ? 1 : -1) * 40}px;--r:${(i % 2 ? 1 : -1) * 70}deg" d="${poly}" fill="#5a4328" stroke="#1a120a"/>`
    } else {
      fixed.push(poly)
    }

    if (i % 3 === 0) hangers.push(`M${f(x)} ${f(y)}V${f(y - 40)}`)
  }

  const rope = (dy: number) => `M${p0[0]} ${p0[1] + dy}Q${p1[0]} ${p1[1] + dy} ${p2[0]} ${p2[1] + dy}`

  return (
    `<g class="lt-br"><path d="${rope(-40)}" fill="none" stroke="#4a3a24" stroke-width="3"/>` +
    `<path d="${hangers.join('')}" stroke="#4a3a24" stroke-width="1.6"/>` +
    `<path d="${fixed.join('')}" fill="#3b2c1a" stroke="#1a120a"/>${loose}` +
    `<path d="${rope(0)}" fill="none" stroke="#4a3a24" stroke-width="3"/></g>` +
    `<rect x="574" y="380" width="14" height="100" fill="#2a1e12"/><rect x="1470" y="400" width="14" height="100" fill="#2a1e12"/>`
  )
}

/** The temple: wall, carved face with gem eyes, doorway, steps, braziers. */
function temple(): string {
  const next = random(41)
  let bricks = ''

  for (let y = 230; y < 960; y += 46) {
    bricks += `M110 ${y}H600`

    for (let x = 130 + (y % 92 === 0 ? 0 : 40); x < 600; x += 80 + next() * 30) bricks += `M${f(x)} ${y}v46`
  }

  const teeth = Array.from({ length: 8 }, (_, i) => `M${248 + i * 26} 482l13 22l13 -22Z`).join('') + Array.from({ length: 7 }, (_, i) => `M${261 + i * 26} 520l13 -20l13 20Z`).join('')
  const glyphs = [0, 1, 2, 3, 4]
    .map(i => `M200 ${650 + i * 52}h22v14h-22ZM208 ${656 + i * 52}h6M478 ${650 + i * 52}h22v14h-22ZM486 ${656 + i * 52}h6`)
    .join('')
  const gem = (x: number, y: number, r: number) =>
    `<circle class="lt-halo" cx="${x}" cy="${y}" r="${r * 4.2}" fill="url(#lt-gg)"/>` +
    `<circle class="lt-gm" cx="${x}" cy="${y}" r="${r}" fill="url(#lt-gem)"/>` +
    `<path d="M${x} ${y - r}L${x + r * 0.7} ${y}L${x} ${y + r}L${x - r * 0.7} ${y}Z" fill="#d8fff0" fill-opacity=".55"/>`

  return (
    '<g class="lt-tm">' +
    `<path d="M110 960V480L150 450V310L180 280V200L240 158H460L520 200V280L550 310V450L590 480V960Z" fill="${STONE}"/>` +
    `<path d="${bricks}" stroke="${STONE_LO}" stroke-width="2" fill="none"/>` +
    // The headdress, the face block and its brow.
    `<path d="M170 218L190 164L240 194L290 142L350 184L410 142L460 194L510 164L530 218Z" fill="#22322d" stroke="${STONE_HI}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M236 190L290 160M410 160L464 190" stroke="${STONE_HI}" stroke-width="3"/>` +
    `<rect x="190" y="216" width="320" height="346" rx="22" fill="url(#lt-st)" stroke="${STONE_HI}" stroke-width="3"/>` +
    `<path d="M205 304Q350 268 495 304V332Q350 298 205 332Z" fill="#2c3d37" stroke="${STONE_LO}" stroke-width="2"/>` +
    '<rect x="226" y="338" width="88" height="56" rx="10" fill="#040807"/><rect x="386" y="338" width="88" height="56" rx="10" fill="#040807"/>' +
    gem(270, 366, 19) +
    gem(430, 366, 19) +
    gem(350, 262, 15) +
    `<path d="M336 392H364L390 470H310Z" fill="#16211e" stroke="${STONE_LO}" stroke-width="2"/><path d="M328 462H340M360 462H372" stroke="#030605" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M210 410Q228 470 262 500M490 410Q472 470 438 500" fill="none" stroke="${STONE_LO}" stroke-width="3"/>` +
    `<rect x="240" y="480" width="220" height="42" rx="6" fill="#030605"/><path d="${teeth}" fill="${STONE_HI}"/>` +
    `<circle cx="190" cy="430" r="28" fill="#22322d" stroke="${STONE_HI}" stroke-width="2.4"/><circle cx="510" cy="430" r="28" fill="#22322d" stroke="${STONE_HI}" stroke-width="2.4"/>` +
    gem(190, 430, 10) +
    gem(510, 430, 10) +
    '<ellipse cx="236" cy="226" rx="46" ry="12" fill="#1b3a22" fill-opacity=".8"/><ellipse cx="470" cy="300" rx="34" ry="9" fill="#1b3a22" fill-opacity=".7"/><ellipse cx="300" cy="560" rx="60" ry="10" fill="#1b3a22" fill-opacity=".8"/>' +
    // The doorway under the face, its frame, glyph columns and steps.
    `<rect x="150" y="562" width="400" height="398" fill="#16211e" stroke="${STONE_HI}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="${glyphs}" stroke="${STONE_HI}" stroke-width="2" fill="none"/>` +
    '<path d="M290 960V664Q290 604 350 604Q410 604 410 664V960Z" fill="#020403"/>' +
    `<path d="M274 960V658Q274 586 350 586Q426 586 426 658V960" fill="none" stroke="${STONE_HI}" stroke-width="14"/>` +
    '<path class="lt-dg" d="M200 960Q200 600 350 600Q500 600 500 960Z" fill="url(#lt-gold)"/>' +
    `<rect x="236" y="934" width="228" height="14" fill="${STONE_HI}"/><rect x="214" y="948" width="272" height="14" fill="#223530"/>` +
    // Braziers either side.
    [210, 490]
      .map(
        x =>
          `<circle class="lt-bg" cx="${x}" cy="860" r="64" fill="url(#lt-amb)"/><path d="M${x - 18} 900H${x + 18}L${x + 12} 924H${x - 12}Z" fill="#101a17"/><path d="M${x - 22} 900Q${x} 912 ${x + 22} 900" fill="none" stroke="${BRASS}" stroke-width="3"/>` +
          `<path class="lt-fl" d="M${x - 11} 898Q${x - 14} 872 ${x} 850Q${x + 14} 872 ${x + 11} 898Z" fill="#ff9a2a"/><path class="lt-fl" d="M${x - 5} 898Q${x - 6} 880 ${x} 868Q${x + 6} 880 ${x + 5} 898Z" fill="#ffe08a"/>`,
      )
      .join('') +
    '</g>'
  )
}

/** The boulder: a carved round stone with grooves and a glyph ring, drawn about its centre. */
function boulder(): string {
  return (
    '<g transform="scale(1.34)">' +
    `<circle r="120" fill="url(#lt-bo)" stroke="#4a665e" stroke-width="5"/>` +
    `<circle r="92" fill="none" stroke="${STONE_LO}" stroke-width="5"/><circle r="52" fill="none" stroke="${STONE_LO}" stroke-width="4"/>` +
    `<path d="M0 -120V-92M0 92V120M-120 0H-92M92 0H120M-85 -85L-65 -65M85 85L65 65M85 -85L65 -65M-85 85L-65 65" stroke="${STONE_LO}" stroke-width="6"/>` +
    `<path d="M-10 -78H10V-64H-10ZM-10 64H10V78H-10ZM-78 -10H-64V10H-78ZM64 -10H78V10H64Z" fill="${STONE_HI}"/>` +
    '<path d="M-40 -30L-10 -12L-26 14M30 20L58 40" stroke="#070c0b" stroke-width="4" fill="none"/>' +
    '<ellipse cx="-60" cy="-70" rx="34" ry="18" fill="#1b3a22" fill-opacity=".85"/><circle cx="20" cy="0" r="12" fill="url(#lt-gem)" fill-opacity=".5"/></g>'
  )
}

function snake(x: number, y: number, d: number): string {
  return (
    `<g transform="translate(${x} ${y})"><g class="lt-sn" style="--d:${f(d)}s"><g transform="scale(1.5)"><g class="lt-ss" style="animation-delay:${f(-d)}s">` +
    '<path d="M0 0Q12 18 0 36T0 72T0 108" fill="none" stroke="#3a7a3a" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M0 0Q12 18 0 36T0 72T0 108" fill="none" stroke="#d8b43a" stroke-width="10" stroke-dasharray="3 12"/>' +
    '<ellipse cx="0" cy="114" rx="8" ry="11" fill="#4a8a44"/><circle cx="-3" cy="112" r="1.8" fill="#ffd84a"/><circle cx="3" cy="112" r="1.8" fill="#ffd84a"/>' +
    '<path d="M0 124V134M0 134L-3 139M0 134L3 139" stroke="#d8344a" stroke-width="1.6"/></g></g></g></g>'
  )
}

function macaw(y: number, d: number, scale: number): string {
  return (
    `<g class="lt-mc" style="--y:${y}px;animation-delay:${f(d)}s"><g transform="scale(${scale})">` +
    '<path d="M16 2L62 12M14 4L56 22" stroke="#c9302c" stroke-width="5" stroke-linecap="round"/><path d="M16 2L50 -2" stroke="#2a63c2" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse rx="19" ry="8" fill="#c9302c"/><circle cx="-20" cy="-4" r="8.5" fill="#c9302c"/><circle cx="-23" cy="-6" r="4" fill="#efe6d0"/><circle cx="-24" cy="-6" r="1.6" fill="#111"/>' +
    '<path d="M-27 -6Q-38 -4 -32 4Q-28 0 -26 -2Z" fill="#e8d8a8"/>' +
    '<g class="lt-wg"><path d="M-2 -2Q8 -30 30 -22Q20 -6 8 4Z" fill="#2a63c2"/><path d="M6 -8Q14 -22 28 -20Q18 -10 12 -2Z" fill="#e8c13a"/></g></g></g>'
  )
}

/** The laptop in a rugged khaki case with brass corners. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<rect x="246" y="323" width="96" height="7" rx="2" fill="#3c4430" stroke="${BRASS}" stroke-opacity=".8"/>` +
    keys +
    `<path d="M334 327L360 238L370 240L344 329Z" fill="#3c4430" stroke="${BRASS}" stroke-opacity=".8" stroke-width="1.5"/>` +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    `<path d="M246 323H254M246 330H254M334 323H342" stroke="${BRASS}" stroke-width="2"/>`
  )
}

export function lostTempleWorld(): World {
  const next = random(808)
  const ridge = (y: number, amp: number, fill: string, seed: number) => {
    const r = random(seed)
    let d = `M-20 1000V${y}`

    for (let x = -20; x <= 1640; x += 40) d += `L${x} ${f(y - r() * amp)}`

    return `<path d="${d}V1000Z" fill="${fill}"/>`
  }
  const fireflies = Array.from({ length: 22 }, () => {
    const x = next() * 1600
    const y = 200 + next() * 700

    return `<circle class="lt-ff" cx="${f(x)}" cy="${f(y)}" r="9" fill="url(#lt-ffg)" style="--x:${f((next() - 0.5) * 120)}px;--y:${f((next() - 0.5) * 90)}px;--t:${f(7 + next() * 5)}s;animation-delay:${f(-next() * 8)}s"/>`
  }).join('')
  const delays = [0.25, 0.5, 0.75, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0]
  const puffs = Array.from({ length: 9 }, (_, i) => `<circle class="lt-pf" cx="${f(430 + i * 155)}" cy="${f(925 + (i % 2) * 14)}" r="${f(70 + (i % 3) * 14)}" fill="#5a4c3c" style="animation-delay:${delays[i]}s"/>`).join('')
  const pebbles = Array.from({ length: 12 }, (_, i) => `<circle class="lt-pb" cx="${f(450 + i * 120)}" cy="945" r="${f(4 + (i % 3) * 2)}" fill="#7a6a56" style="--x:${i % 2 ? 40 : 30}px;animation-delay:${f(0.3 + i * 0.22)}s"/>`).join('')
  const door = [0, 1, 2].map(i => `<circle class="lt-pf" cx="${330 + i * 30}" cy="930" r="70" fill="#5a4c3c" style="animation-delay:${f(i * 0.08)}s"/>`).join('')
  const motes = Array.from({ length: 9 }, (_, i) => `<circle class="lt-mt" cx="${f(290 + i * 15)}" cy="${f(900 - (i % 3) * 20)}" r="${f(2 + (i % 3))}" fill="#ffd978" style="animation-delay:${f(i * 0.45)}s"/>`).join('')
  const streaks = [0, 1, 2, 3, 4].map(i => `<path class="lt-wf" d="M${28 + i * 17} 170V860" stroke="#9fe0e0" stroke-opacity=".4" stroke-width="5" stroke-dasharray="38 22" style="animation-delay:${f(-i * 0.4)}s"/>`).join('')
  const orb = (cls: string, rs: number[]) => `<g class="lt-orb ${cls}">${rs.map((r, i) => `<circle cx="${r}" cy="0" r="9" fill="url(#lt-ffg)" transform="rotate(${i * 72} 0 0) translate(0 0)"/>`).join('')}</g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'spores',
      ink: '#050908',
      furniture: WOOD,
      metal: BRASS,
      paper: '#d8c89c',
      light: { idle: '#5aa88c', work: '#7ff0c8', bright: '#c8ffe8' },
      headTop: 196,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // The wide-brimmed hat: the brim stays above the eyes.
          '<path d="M44 242Q150 222 256 242Q150 256 44 242Z" fill="#6a4a2a" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M90 238L96 208Q110 196 128 206Q150 194 172 206Q192 196 206 208L212 238Z" fill="#7a5632" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M128 206Q150 220 172 206" fill="none" stroke="#3a2412" stroke-width="3"/>' +
          '<path d="M92 230H210" stroke="#2a140c" stroke-width="9"/><circle cx="186" cy="230" r="3.6" fill="#3dd6b0"/>' +
          // The satchel strap over the shoulder, hugging the right edge, and the bag at the hip.
          '<path d="M222 246L212 326" stroke="#4a2c14" stroke-width="10"/>' +
          '<path d="M162 326H228L224 354H166Z" fill="#6b4526" stroke="#2a1a10" stroke-width="2"/><path d="M162 326H228L222 342H168Z" fill="#7d5430"/>' +
          `<rect x="190" y="336" width="10" height="9" rx="2" fill="${BRASS}"/>`,
      },
      seatArt:
        `<ellipse cx="151" cy="352" rx="42" ry="7" fill="#5a4228" stroke="#2a1a10" stroke-width="2"/>` +
        '<path d="M110 356Q100 405 112 456H190Q202 405 192 356Z" fill="#4a3320" stroke="#2a1a10" stroke-width="2"/>' +
        '<path d="M130 358V455M151 359V456M172 358V455" stroke="#2a1a10" stroke-width="2" stroke-opacity=".8"/>' +
        '<path d="M103 380H199M103 430H199" stroke="#2a3030" stroke-width="6"/>',
      tableArt:
        `<rect x="218" y="330" width="216" height="126" fill="${WOOD}" stroke="#2a1a10" stroke-width="2"/>` +
        '<path d="M218 358H434M218 386H434M218 414H434M218 442H434" stroke="#2a1a10" stroke-width="2" stroke-opacity=".8"/>' +
        '<path d="M222 334L430 452M430 334L222 452" stroke="#6a5030" stroke-opacity=".5" stroke-width="5"/>' +
        `<path d="M218 330H246V356M434 330H406V356M218 456H246V430M434 456H406V430" fill="none" stroke="${BRASS}" stroke-width="4"/>` +
        '<path d="M244 400h14v10h-14ZM264 400h6M276 400h14v10h-14Z" fill="none" stroke="#c8b078" stroke-opacity=".6" stroke-width="2"/>' +
        '<path d="M218 372Q326 384 434 370" fill="none" stroke="#b09860" stroke-width="3" stroke-opacity=".7"/>' +
        // The lantern on the crate.
        `<rect x="386" y="326" width="20" height="4" fill="#2a2418"/><path d="M388 326L386 296H406L404 326Z" fill="#ffb347" fill-opacity=".85" stroke="#2a2418" stroke-width="2"/>` +
        '<path d="M396 322Q390 312 396 304Q402 312 396 322Z" fill="#fff0b0"/>' +
        `<path d="M384 296H408L404 288H388Z" fill="#2a2418"/><path d="M390 288Q396 276 402 288" fill="none" stroke="${BRASS}" stroke-width="2"/>`,
    },
    style:
      '.lt-vn{animation:lt-vn 6s ease-in-out infinite alternate}@keyframes lt-vn{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}' +
      '.lt-lf{animation:lt-lf 5s ease-in-out infinite alternate}@keyframes lt-lf{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.lt-wf{animation:lt-wf 1.1s linear infinite}@keyframes lt-wf{to{stroke-dashoffset:-60}}' +
      '.lt-ml{animation:lt-ml 20s ease-in-out infinite alternate}@keyframes lt-ml{to{transform:translateX(160px)}}' +
      '.lt-fl{transform-box:fill-box;transform-origin:50% 100%;animation:lt-fl .9s ease-in-out infinite alternate}@keyframes lt-fl{to{transform:scale(.88,1.12)}}' +
      '.lt-bg{animation:lt-bg 2.6s ease-in-out infinite alternate}@keyframes lt-bg{from{opacity:.55}to{opacity:.9}}' +
      '.lt-lg{animation:lt-bg 3.2s ease-in-out infinite alternate}' +
      // Gem eyes breathe; fireflies wander.
      '.lt-gm{animation:lt-gp 4.2s ease-in-out infinite alternate}@keyframes lt-gp{from{opacity:.5}to{opacity:.95}}' +
      '.lt-ff{animation:lt-ff var(--t) ease-in-out infinite}' +
      '@keyframes lt-ff{0%,100%{opacity:.15;transform:translate(0,0)}25%{opacity:.9;transform:translate(var(--x),var(--y))}50%{opacity:.25;transform:translate(calc(var(--x)*.3),calc(var(--y)*1.6))}75%{opacity:.85;transform:translate(calc(var(--x)*-.8),calc(var(--y)*.4))}}' +
      '.st-tool .lt-ff{animation-duration:2.6s}' +
      '.lt-orb{opacity:0}.st-tool .lt-orb{opacity:1;animation:lt-orb 2.4s linear infinite}.st-tool .lt-orb.o2{animation-duration:3.4s;animation-direction:reverse}.st-tool .lt-orb.o3{animation-duration:1.8s}' +
      '@keyframes lt-orb{to{transform:rotate(360deg)}}' +
      // Run: the stone rolls out of the doorway and thunders across; dust kicks up; the ground shakes.
      '.lt-bx{opacity:0}.st-run .lt-bx{animation:lt-roll 4.6s linear infinite}' +
      '@keyframes lt-roll{0%{opacity:0;transform:translate(350px,850px) scale(.45)}2%{opacity:1}12%{transform:translate(560px,830px) scale(.85)}22%{transform:translate(900px,795px) scale(1)}74%{opacity:1;transform:translate(1850px,800px) scale(1)}80%,100%{opacity:0;transform:translate(2000px,800px) scale(1)}}' +
      '.st-run .lt-bs{animation:lt-spin .7s linear infinite}@keyframes lt-spin{to{transform:rotate(360deg)}}' +
      '.lt-pf{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .lt-pf{animation:lt-puff 4.6s ease-out infinite}' +
      '@keyframes lt-puff{0%{opacity:0;transform:translate(0,0) scale(.3)}5%{opacity:.45}30%,100%{opacity:0;transform:translate(-30px,-60px) scale(2)}}' +
      '.lt-pb{opacity:0}.st-run .lt-pb{animation:lt-peb 4.6s ease-out infinite}@keyframes lt-peb{0%{opacity:0;transform:translate(0,0)}3%{opacity:.9}12%{transform:translate(var(--x),-90px)}22%{transform:translate(calc(var(--x)*1.8),0)}30%{transform:translate(calc(var(--x)*2.2),-40px)}38%{transform:translate(calc(var(--x)*2.6),0)}50%,100%{opacity:0;transform:translate(calc(var(--x)*2.6),0)}}' +
      '.st-run .lt-tm,.st-run .lt-grd{animation:lt-shk .14s ease-in-out infinite alternate}@keyframes lt-shk{to{transform:translateY(2.4px)}}' +
      // Error: snakes drop from the vines, planks fall from the bridge.
      '.lt-sn{opacity:0}.st-error .lt-sn{animation:lt-drop 1.4s cubic-bezier(.3,1.4,.5,1) both;animation-delay:var(--d)}' +
      '@keyframes lt-drop{0%{opacity:0;transform:translateY(-230px)}10%{opacity:1}100%{opacity:1;transform:translateY(0)}}' +
      '.lt-ss{animation:lt-ss 1.3s ease-in-out infinite alternate}@keyframes lt-ss{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.lt-pl{transform-box:fill-box;transform-origin:center}' +
      '.st-error .lt-pl{animation:lt-pfall 1.6s ease-in both;animation-delay:var(--d)}' +
      '@keyframes lt-pfall{0%{opacity:1;transform:scale(1.35)}100%{opacity:0;transform:translate(var(--x),520px) rotate(var(--r)) scale(1.35)}}' +
      '.st-error .lt-br{animation:lt-brs .5s ease-in-out infinite alternate}@keyframes lt-brs{from{transform:rotate(-.4deg)}to{transform:rotate(.4deg)}}' +
      // Done: the eyes and gems and the doorway glow, slowly, and sparks of gold rise from the door.
      '.lt-halo,.lt-dg,.lt-mt{opacity:0}' +
      '.st-done .lt-halo{animation:lt-on 1.5s ease-out .3s both}@keyframes lt-on{to{opacity:.5}}' +
      '.st-done .lt-dg{animation:lt-dg 1.6s ease-out .2s both}@keyframes lt-dg{to{opacity:.34}}' +
      '.st-done .lt-gm{animation:none;opacity:1}' +
      '.st-done .lt-mt{animation:lt-mt 4s ease-out infinite}@keyframes lt-mt{0%{opacity:0;transform:translateY(0)}15%{opacity:.8}100%{opacity:0;transform:translateY(-260px)}}' +
      // Read: the map unrolls. Web: macaws.
      '.lt-map{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.04)}' +
      '.st-read .lt-map{animation:lt-unroll 1.3s ease-out both}@keyframes lt-unroll{to{transform:scaleY(1)}}' +
      '.lt-route{stroke-dasharray:6 6;animation:lt-march 1.4s linear infinite}@keyframes lt-march{to{stroke-dashoffset:-12}}' +
      '.lt-mc{opacity:0}.st-web .lt-mc{animation:lt-fly 6s linear infinite}' +
      '@keyframes lt-fly{0%{opacity:0;transform:translate(1760px,var(--y))}5%{opacity:1}95%{opacity:1}100%{opacity:0;transform:translate(-260px,calc(var(--y) - 80px))}}' +
      '.lt-wg{transform-box:fill-box;transform-origin:30% 100%;animation:lt-wg .32s ease-in-out infinite alternate}@keyframes lt-wg{to{transform:scaleY(-.6)}}',
    scenery:
      '<defs><linearGradient id="lt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02080a"/><stop offset=".6" stop-color="#07151a"/><stop offset="1" stop-color="#0c2420"/></linearGradient>' +
      '<linearGradient id="lt-st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26362f"/><stop offset="1" stop-color="#121c19"/></linearGradient>' +
      '<radialGradient id="lt-bo" cx=".35" cy=".3"><stop offset="0" stop-color="#34483f"/><stop offset="1" stop-color="#141e1b"/></radialGradient>' +
      '<radialGradient id="lt-gem"><stop offset="0" stop-color="#eafff6"/><stop offset=".4" stop-color="#3dffc0"/><stop offset="1" stop-color="#0a8a66"/></radialGradient>' +
      '<radialGradient id="lt-gg"><stop offset="0" stop-color="#3dffc0" stop-opacity=".7"/><stop offset="1" stop-color="#3dffc0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lt-gold" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#fff0b0" stop-opacity="1"/><stop offset=".45" stop-color="#ffc040" stop-opacity=".75"/><stop offset="1" stop-color="#e8a030" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lt-amb"><stop offset="0" stop-color="#ffb347" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lt-ffg"><stop offset="0" stop-color="#e8ff9a"/><stop offset=".25" stop-color="#c8f06a" stop-opacity=".7"/><stop offset="1" stop-color="#c8f06a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="lt-mist"><stop offset="0" stop-color="#8ac8c0" stop-opacity=".22"/><stop offset="1" stop-color="#8ac8c0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="lt-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ae0d4" stop-opacity=".07"/><stop offset="1" stop-color="#9ae0d4" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#lt-sky)"/>' +
      '<circle cx="1360" cy="130" r="110" fill="url(#lt-mist)"/><circle cx="1360" cy="130" r="30" fill="#bfe8e0" fill-opacity=".35"/>' +
      ridge(620, 90, '#08161a', 3) +
      ridge(720, 70, '#0a1c1c', 9) +
      '<path d="M1000 -20L1160 -20L900 960L560 960Z" fill="url(#lt-ray)"/>' +
      // The far cliff on the right and the gorge in between.
      `<path d="M1400 390L1480 370L1600 350V1000H1320L1350 720Z" fill="#0d1a18"/><path d="M1400 390L1480 370L1600 350" stroke="${STONE_HI}" stroke-opacity=".5" stroke-width="3" fill="none"/>` +
      '<rect x="600" y="640" width="780" height="360" fill="#030a0a" fill-opacity=".7"/>' +
      bridge() +
      '<ellipse class="lt-ml" cx="500" cy="700" rx="520" ry="70" fill="url(#lt-mist)"/><ellipse class="lt-ml" style="animation-direction:alternate-reverse" cx="1000" cy="780" rx="560" ry="80" fill="url(#lt-mist)"/>' +
      // Waterfall at the left.
      '<path d="M-20 -10H150L124 100L96 170H-20Z" fill="#0a1614"/><path d="M-20 160H150V960H-20Z" fill="#0b1816"/>' +
      '<rect x="20" y="168" width="92" height="700" fill="#7fc8cc" fill-opacity=".18"/>' +
      streaks +
      '<ellipse cx="66" cy="880" rx="110" ry="40" fill="url(#lt-mist)"/><ellipse cx="66" cy="900" rx="90" ry="22" fill="#8ac8c8" fill-opacity=".2"/>' +
      temple() +
      // Vines and leaves.
      [150, 240, 330, 520, 612, 700, 860, 1000, 1290, 1380, 1470, 1560].map((x, i) => vine(x, 150 + ((i * 53) % 120), 26 - (i % 3) * 14, -i * 0.5)).join('') +
      '<g class="mv-r"><g class="mv-t">' +
      leaf(1640, -10, 340, 118, 0) +
      leaf(1640, -10, 300, 148, -1.4, '#17381f') +
      leaf(1560, -20, 260, 102, -2.5) +
      '</g></g>' +
      leaf(-30, -10, 300, 52, 0) +
      leaf(-30, -10, 240, 78, -2, '#17381f') +
      '<g class="mv-b">' +
      leaf(-20, 1010, 360, -62, -1) +
      leaf(40, 1020, 300, -84, -3, '#17381f') +
      leaf(-20, 1000, 280, -32, -2) +
      '</g>' +
      fireflies +
      '<g class="lt-grd"><path d="M-20 952H1700V1010H-20Z" fill="#050b0a"/><path d="M-20 952H1700" stroke="#1a2a24" stroke-width="3"/></g>' +
      '<g class="lt-bx"><g class="lt-bs">' + boulder() + '</g></g>' +
      door +
      puffs +
      pebbles +
      '<g transform="translate(350 0)">' + motes + '</g>' +
      snake(520, 215, 0) +
      snake(612, 250, 0.3) +
      snake(1290, 260, 0.6) +
      snake(1380, 190, 0.9) +
      snake(1470, 300, 1.2) +
      macaw(190, 0, 1.4) +
      macaw(280, 0.8, 1.2) +
      macaw(130, 1.6, 1.0),
    nook:
      '<circle class="lt-lg" cx="396" cy="300" r="170" fill="url(#lt-amb)"/>' +
      // The old map hanging above the desk: rolled until Claude reads, then unrolled.
      '<path d="M270 -100V30M350 -100V30" stroke="#3a2a18" stroke-width="2"/>' +
      '<g class="lt-map"><rect x="240" y="34" width="132" height="168" fill="#d8c89c" fill-opacity=".92" stroke="#8a7440" stroke-width="2"/>' +
      '<path d="M252 70C272 52 296 68 316 54C336 42 352 56 362 48M252 130C274 112 292 136 312 120C332 108 346 124 362 112M262 190C284 176 304 188 326 172" fill="none" stroke="#7a6a44" stroke-width="2"/>' +
      '<path class="lt-route" d="M262 170C280 150 300 160 316 130C330 106 344 112 352 80" fill="none" stroke="#8a2e24" stroke-width="2.4"/><path d="M342 72L358 88M358 72L342 88" stroke="#8a2e24" stroke-width="3.4"/>' +
      '<circle cx="270" cy="68" r="10" fill="none" stroke="#7a6a44" stroke-width="1.6"/><path d="M270 58V78M260 68H280" stroke="#7a6a44" stroke-width="1.6"/></g>' +
      '<rect x="232" y="26" width="148" height="14" rx="7" fill="#d8c89c" stroke="#8a7440"/>' +
      // Vines hanging over the corner.
      '<path d="M120 -300C140 -250 100 -210 124 -150C138 -110 112 -80 124 -40" fill="none" stroke="#1b4a2a" stroke-width="3"/><path d="M120 -300C140 -250 100 -210 124 -150C138 -110 112 -80 124 -40" fill="none" stroke="#1f5a30" stroke-width="13" stroke-linecap="round" stroke-dasharray="0 17"/>' +
      // Fireflies swarm round the lantern while a tool works.
      '<g transform="translate(396 290)">' +
      orb('o1', [46, 74, 98, 60, 84]) +
      orb('o2', [56, 92, 70, 110, 80]) +
      orb('o3', [38, 64, 88, 52, 104]) +
      '</g>',
  }
}
