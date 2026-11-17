import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Polar Night: a researcher in a fur-trimmed parka at a laptop inside an ice station, heater glowing. Outside a
// frozen bay under aurora curtains, snow, icebergs, a polar bear on the ice and a towering glacier on the left.
// A command makes a huge slab of the glacier calve into the sea; an error is a soft blizzard gust; done blazes
// the aurora and shifts its colour.
const FUR = '#e4ddcc'
const PARKA = '#8c3a30'

/** One aurora curtain: a soft hanging band with a wavy upper edge, and the vertical rays inside it. */
function curtain(x0: number, x1: number, y0: number, amp: number, len: number, phase: number, grad: string, seed: number): { band: string; rays: string } {
  const top = (x: number) => y0 + Math.sin(x * 0.0055 + phase) * amp + Math.sin(x * 0.013 + phase * 2) * amp * 0.4
  const low = (x: number) => top(x) + len * (0.7 + 0.3 * Math.sin(x * 0.009 + phase * 1.7))
  const next = random(seed)
  const xs: number[] = []

  for (let x = x0; x <= x1; x += 40) xs.push(x)

  const upper = xs.map(x => `${f(x)} ${f(top(x))}`)
  const lower = [...xs].reverse().map(x => `${f(x)} ${f(low(x))}`)
  const rays = Array.from({ length: Math.round((x1 - x0) / 24) }, (_, i) => {
    const x = x0 + i * 24

    return `M${f(x)} ${f(top(x))}h8v${f((low(x) - top(x)) * (0.45 + next() * 0.55))}h-8Z`
  }).join('')

  return {
    band: `<path d="M${upper.join('L')}L${lower.join('L')}Z" fill="url(#${grad})" fill-opacity=".75"/>`,
    rays: `<path d="${rays}" fill="url(#${grad})" fill-opacity=".8"/>`,
  }
}

/** A mass of ice with a lit face and a shadow face. */
function berg(x: number, y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="pn-berg" style="animation-delay:${delay}s">` +
    '<path d="M-90 0L-70 -38L-40 -30L-10 -76L26 -52L48 -64L84 -14L96 0Z" fill="#1d4a64"/>' +
    '<path d="M-10 -76L26 -52L48 -64L84 -14L96 0H4L-6 -30Z" fill="#2c6a8a"/>' +
    '<path d="M-90 0L-70 -38L-40 -30L-10 -76L-6 -30L4 0Z" fill="#0f2f44" fill-opacity=".8"/>' +
    '<path d="M-100 2Q0 10 104 2" fill="none" stroke="#9fd6ea" stroke-opacity=".3" stroke-width="2.4"/>' +
    '<path d="M-90 4Q0 26 96 4Z" fill="#0b2436" fill-opacity=".7"/></g></g>'
  )
}

/** The polar bear in profile, walking right: four legs swing from the shoulder and hip. */
function bear(): string {
  const leg = (x: number, delay: number, dark: boolean) =>
    `<g transform="translate(${x} 8)"><g class="pn-leg" style="animation-delay:${delay}s"><rect x="-7" y="0" width="14" height="30" rx="6" fill="${dark ? '#b9c9d3' : '#d6e2ea'}"/></g></g>`

  return (
    leg(-34, -0.5, true) +
    leg(30, 0, true) +
    '<ellipse cx="0" cy="-8" rx="52" ry="26" fill="#d6e2ea"/>' +
    '<path d="M-48 -26Q-20 -42 20 -34L40 -22Q10 -30 -20 -22Z" fill="#fff" fill-opacity=".18"/>' +
    '<g class="pn-nod"><ellipse cx="58" cy="-14" rx="22" ry="16" fill="#d6e2ea"/><path d="M70 -14Q88 -10 90 0Q82 6 68 2Z" fill="#cdd9e2"/>' +
    '<circle cx="90" cy="-1" r="3.2" fill="#0a141c"/><circle cx="64" cy="-18" r="2" fill="#0a141c"/><circle cx="50" cy="-28" r="5.4" fill="#d6e2ea"/></g>' +
    leg(-26, 0.5, false) +
    leg(38, -0.25, false) +
    '<path d="M-52 -8L-60 -14" stroke="#d6e2ea" stroke-width="7" stroke-linecap="round"/>'
  )
}

/** The laptop, a thermometer and a notebook on the desk. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${254 + i * 11}" y="323" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const bars = [60, 80, 44, 72, 52]
    .map((w, i) => `<rect x="${346 - w / 2 + 6}" y="${243 + i * 10}" width="${w}" height="4" rx="1.4" fill="#04121a" fill-opacity=".5"/>`)
    .join('')
  const extra =
    activity === 'run'
      ? '<rect class="pn-prog" x="318" y="292" width="76" height="5" fill="#ffffff" fill-opacity=".8"/>'
      : activity === 'web'
        ? '<g fill="none" stroke="#04121a" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"><path d="M360 296Q372 284 384 296"/><path d="M352 300Q372 278 392 300"/></g>'
        : '<rect class="pn-cur" x="318" y="292" width="6" height="8" fill="#04121a" fill-opacity=".7"/>'

  return (
    '<path d="M240 330L250 318H346L352 330Z" fill="#1c2c38" stroke="#4a6a7c" stroke-width="2"/>' +
    keys +
    '<path d="M338 318L400 224L414 228L360 322Z" fill="#1c2c38" stroke="#4a6a7c" stroke-width="3"/>' +
    `<path d="M345 316L398 232L408 235L360 318Z" fill="${light}"/>` +
    `<path d="M345 316L398 232L388 236L355 316Z" fill="#ffffff" fill-opacity=".12"/>` +
    '<g transform="translate(4 -4) scale(.96)">' +
    bars +
    extra +
    '</g>' +
    '<rect x="430" y="300" width="9" height="30" rx="4" fill="#dfe9ef" fill-opacity=".22" stroke="#7a9aac" stroke-width="2"/><rect x="433" y="312" width="3" height="16" fill="#e5484d"/>'
  )
}

export function polarNightWorld(): World {
  const next = random(17)
  const stars = Array.from({ length: 80 }, (_, i) => {
    const tw = i % 6 === 0

    return `<circle${tw ? ` class="pn-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${f(next() * 1600)}" cy="${f(next() * 440)}" r="${f(0.7 + next() * 1.1)}" fill="#e6f2ff" fill-opacity="${f(0.25 + next() * 0.45)}"/>`
  }).join('')
  const a1 = curtain(-40, 1640, 70, 40, 230, 0.4, 'pn-g1', 3)
  const a2 = curtain(200, 1500, 130, 34, 180, 2.1, 'pn-g2', 5)
  const a3 = curtain(500, 1650, 40, 30, 190, 4.2, 'pn-g3', 7)
  const b1 = curtain(100, 1400, 100, 36, 220, 3.2, 'pn-g4', 9)
  const b2 = curtain(700, 1640, 150, 30, 170, 1.0, 'pn-g5', 11)
  const reflect = [0, 1, 2, 3, 4, 5, 6]
    .map(i => `<ellipse class="pn-rf" style="animation-delay:${f(-i * 1.3)}s" cx="${f(520 + i * 150 + next() * 40)}" cy="${f(560 + (i % 3) * 38)}" rx="${f(50 + next() * 40)}" ry="3" fill="#6fe8b8"/>`)
    .join('')
  const cliffs =
    '<path d="M-20 540L120 470L240 510L340 440L460 500L600 460L760 520L900 480L1040 520L1200 470L1360 515L1500 480L1640 520V560H-20Z" fill="#0b1c2b"/>' +
    '<path d="M340 440L400 470L330 480ZM600 460L650 485L590 490ZM1200 470L1260 495L1190 500Z" fill="#5a8cac" fill-opacity=".35"/>'
  const debris = [0, 1, 2, 3, 4]
    .map(i => `<path class="pn-deb" style="--dx:${60 + i * 26}px;animation-delay:${f(0.5 + i * 0.12)}s" d="M${300 + i * 22} ${320 + i * 40}l16 -8l8 14l-14 10Z" fill="#7fb6d0"/>`)
    .join('')
  const spray = [-54, -34, -14, 8, 28, 50, 70]
    .map(
      (x, i) =>
        `<path class="pn-sp" style="--h:${f(1.1 + (i % 3) * 0.55)};animation-delay:${f(1.9 + i * 0.03)}s" d="M${x} 0Q${x + 6} -${60 + (i % 3) * 30} ${x + 12} -${96 + (i % 4) * 36}Q${x + 14} -40 ${x + 14} 0Z" fill="#cfe6f2" fill-opacity=".8"/>`,
    )
    .join('')
  const wave = `M-200 0${Array.from({ length: 8 }, () => 'q50 -26 100 0').join('')}`
  const crevasses = 'M60 200L80 300L56 380M150 160L170 260L146 340L168 460M230 230L214 330L238 420M110 480L92 560L116 640M200 520L220 600L196 690'
  const bliss = (offset: number) =>
    Array.from({ length: 14 }, () => {
      const x = next() * 800
      const y = next() * 1000

      return `<path d="M${f(x + offset)} ${f(y)}h${f(50 + next() * 90)}l8 6" fill="none"/>`
    }).join('')
  const streakSet = [0, 800, 1600].map(o => bliss(o)).join('')
  const shelfDots = Array.from({ length: 18 }, () => `<ellipse cx="${f(next() * 1500)}" cy="${f(850 + next() * 130)}" rx="${f(30 + next() * 60)}" ry="3" fill="#2f5870" fill-opacity=".4"/>`).join('')
  const bolts = Array.from({ length: 7 }, (_, i) => `<circle cx="${242 + i * 24}" cy="152" r="1.8" fill="#6a8aa0"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'mug',
      thought: 'puffs',
      ink: '#050c14',
      furniture: '#2a3a48',
      metal: '#34505f',
      paper: '#e8f0f4',
      light: { idle: '#4f8fb8', work: '#7fd0ff', bright: '#d4f0ff' },
      headTop: 204,
      glowAt: [352, 270],
      device,
      wear: {
        // The parka's hood: a red shell around an open face with a thick fur trim. The eyes sit well inside it.
        front:
          `<path fill-rule="evenodd" d="M50 346V268C50 222 96 204 150 204C204 204 250 222 250 268V346ZM80 254Q80 232 104 232H196Q220 232 220 254V306Q220 326 198 326H102Q80 326 80 306Z" fill="${PARKA}" stroke="#4a1a16" stroke-width="2.4" stroke-linejoin="round"/>` +
          '<path d="M64 300V268C64 234 100 216 150 216C200 216 236 234 236 268V300" fill="none" stroke="#b25a48" stroke-opacity=".5" stroke-width="3"/>' +
          `<path d="M80 254Q80 232 104 232H196Q220 232 220 254V306Q220 326 198 326H102Q80 326 80 306Z" fill="none" stroke="${FUR}" stroke-width="10" stroke-linejoin="round"/>` +
          `<path d="M80 254Q80 232 104 232H196Q220 232 220 254V306Q220 326 198 326H102Q80 326 80 306Z" fill="none" stroke="#f1ece0" stroke-width="17" stroke-linecap="round" stroke-dasharray="0 11" stroke-opacity=".85"/>` +
          '<path d="M150 326V346" stroke="#4a1a16" stroke-width="3"/><rect x="144" y="334" width="12" height="7" rx="2" fill="#c9a44a"/>' +
          '<path d="M60 340H240" stroke="#4a1a16" stroke-opacity=".6" stroke-width="3"/>',
      },
      seatArt:
        '<rect x="112" y="364" width="78" height="86" rx="3" fill="#3a4a54" stroke="#5a7282" stroke-width="2"/>' +
        '<path d="M112 392H190M112 420H190M151 364V450" stroke="#5a7282" stroke-width="2"/>' +
        '<ellipse cx="151" cy="352" rx="44" ry="8" fill="#d8d0bf"/><ellipse cx="151" cy="350" rx="40" ry="5" fill="#eee8da" fill-opacity=".8"/>',
      tableArt:
        '<g fill="#2a3a48" stroke="#5a7a8c" stroke-width="1.8"><rect x="166" y="330" width="304" height="14" rx="3"/>' +
        '<rect x="188" y="344" width="12" height="112"/><rect x="436" y="344" width="12" height="112"/><rect x="200" y="400" width="236" height="7"/></g>' +
        '<path d="M166 330H470" stroke="#dfeef6" stroke-opacity=".45" stroke-width="2.4"/>' +
        '<path d="M176 344l4 10l4 -10M300 344l3 8l3 -8M410 344l4 12l4 -12" fill="none" stroke="#bfe0f0" stroke-opacity=".5" stroke-width="2"/>',
    },
    style:
      '.pn-tw{animation:pn-tw 3.6s ease-in-out infinite alternate}@keyframes pn-tw{to{opacity:.15}}' +
      '@keyframes pn-fi{to{opacity:1}}' +
      // The aurora: curtains sway slowly; each has its own pace.
      '.pn-ar{animation:pn-ar 13s ease-in-out infinite alternate}@keyframes pn-ar{from{transform:translateX(-34px) skewX(-3deg)}to{transform:translateX(34px) skewX(3deg)}}' +
      '.pn-ao{animation:pn-ao 7s ease-in-out infinite alternate}@keyframes pn-ao{from{opacity:.55}to{opacity:.95}}' +
      '.pn-ar2{opacity:0}.st-done .pn-ar2{animation:pn-bl 2.8s ease-out both}@keyframes pn-bl{to{opacity:.35}}' +
      '.pn-rf{opacity:.06;animation:pn-rf 5s ease-in-out infinite alternate}@keyframes pn-rf{to{opacity:.2}}' +
      '.st-done .pn-rf{animation-name:pn-rf2}@keyframes pn-rf2{from{opacity:.1}to{opacity:.34}}' +
      '.pn-berg{animation:pn-bob 7s ease-in-out infinite alternate}@keyframes pn-bob{to{transform:translateY(4px)}}' +
      '.st-run .pn-berg{animation:pn-rock 1.9s ease-in-out 2.1s 3 both}@keyframes pn-rock{0%,100%{transform:rotate(0)}30%{transform:translateY(5px) rotate(-2.4deg)}70%{transform:translateY(-3px) rotate(2deg)}}' +
      // Run: the slab cracks, leans and falls; ice rains off it; the splash, rings and a wave roll out.
      '.pn-chunk{transform-origin:430px 720px}.st-run .pn-chunk{animation:pn-calve 2.7s ease-in .15s both}' +
      '@keyframes pn-calve{0%{transform:rotate(0)}12%{transform:rotate(.8deg)}22%{transform:rotate(-.5deg)}55%{transform:translate(14px,8px) rotate(8deg)}82%{transform:translate(70px,70px) rotate(30deg)}100%{transform:translate(116px,250px) rotate(46deg)}}' +
      '.pn-crack{stroke-dasharray:900;stroke-dashoffset:900;opacity:0}.st-run .pn-crack{animation:pn-cr .8s ease-out both}@keyframes pn-cr{0%{opacity:1}100%{opacity:.9;stroke-dashoffset:0}}' +
      '.pn-scar{opacity:0}.st-run .pn-scar{animation:pn-fi 2.4s ease-out 1.2s both}' +
      '.pn-deb{opacity:0}.st-run .pn-deb{animation:pn-deb 1.8s ease-in both}@keyframes pn-deb{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),300px) rotate(180deg)}}' +
      '.pn-splash{opacity:0}.st-run .pn-splash{animation:pn-splash 2.6s ease-out 1.9s both}@keyframes pn-splash{0%{opacity:0}8%{opacity:1}100%{opacity:0}}' +
      '.pn-sp{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}.st-run .pn-sp{animation:pn-sp 2.4s ease-out 1.9s both}' +
      '@keyframes pn-sp{0%{transform:scaleY(0)}22%{transform:scaleY(var(--h))}100%{transform:scaleY(.2)}}' +
      '.pn-foam{transform-box:fill-box;transform-origin:center;opacity:0}.st-run .pn-foam{animation:pn-foam 3s ease-out 1.9s both}@keyframes pn-foam{0%{opacity:0;transform:scale(.3)}20%{opacity:.8}100%{opacity:0;transform:scale(2.6)}}' +
      '.pn-ring{transform-box:fill-box;transform-origin:center;opacity:0}.st-run .pn-ring{animation:pn-ring 4.2s ease-out 1.95s both}@keyframes pn-ring{0%{opacity:0;transform:scale(.2)}12%{opacity:.8}100%{opacity:0;transform:scale(9)}}' +
      '.pn-roll{opacity:0}.st-run .pn-roll{animation:pn-roll 5.6s ease-out 2.1s both}@keyframes pn-roll{0%{opacity:0;transform:translateX(0)}12%{opacity:.7}100%{opacity:0;transform:translateX(1150px)}}' +
      // Error: a soft gust of snow streaks and a faint white wash.
      '.pn-bliz{opacity:0}.st-error .pn-bliz{animation:pn-fi 1.1s ease-out .2s both}' +
      '.pn-bs{animation:pn-bs 1.5s linear infinite}@keyframes pn-bs{to{transform:translateX(-800px)}}' +
      '.pn-wash{opacity:0}.st-error .pn-wash{animation:pn-wash 4.2s ease-in-out both}@keyframes pn-wash{0%{opacity:0}35%{opacity:.2}100%{opacity:.13}}' +
      '.pn-ww{opacity:0}.st-error .pn-ww{animation:pn-ww 1.6s ease-out .3s both}@keyframes pn-ww{to{opacity:.35}}' +
      // Web: the dish turns and sends signal arcs.
      '.pn-dish{animation:pn-dsw 16s ease-in-out infinite alternate}@keyframes pn-dsw{from{transform:rotate(-8deg)}to{transform:rotate(6deg)}}' +
      '.st-web .pn-dish{animation:pn-dt 3.2s ease-in-out infinite alternate}@keyframes pn-dt{from{transform:rotate(-34deg)}to{transform:rotate(10deg)}}' +
      '.pn-sg{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-web .pn-sg{animation:pn-sg 2s ease-out infinite;animation-delay:calc(var(--k) * .6s)}' +
      '@keyframes pn-sg{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.8}100%{opacity:0;transform:translate(-22px,-80px) scale(1.8)}}' +
      // The radar dome sweeps; a spotlight searches the bay while Claude reads; the dome pulses as it writes.
      '.pn-sw{animation:pn-sw 5s linear infinite}@keyframes pn-sw{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}' +
      '.st-tool .pn-sw{animation-duration:1.4s}' +
      '.pn-halo{animation:pn-halo 5s ease-in-out infinite alternate}@keyframes pn-halo{from{opacity:.55}to{opacity:.95}}' +
      '.st-responding .pn-halo{animation-duration:1.3s}' +
      '.pn-sl{opacity:0}.st-read .pn-sl{animation:pn-sl 3.6s ease-in-out infinite alternate}@keyframes pn-sl{from{opacity:.8;transform:rotate(-8deg)}to{opacity:.8;transform:rotate(14deg)}}' +
      '.pn-bk{animation:pn-bk 2.4s ease-in-out infinite}@keyframes pn-bk{0%,62%,100%{opacity:.25}78%{opacity:1}}' +
      // The bear walks along the ice and fades at both ends; its legs swing.
      '.pn-bear{animation:pn-walk 70s linear both}@keyframes pn-walk{to{transform:translateX(1000px)}}' +
      '.pn-leg{animation:pn-leg 1.4s ease-in-out infinite alternate}@keyframes pn-leg{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}' +
      '.pn-nod{animation:pn-nod 6s ease-in-out infinite}@keyframes pn-nod{0%,60%,100%{transform:translateY(0)}75%{transform:translateY(7px) rotate(5deg)}}' +
      '.pn-lf{animation:pn-lf 2.6s ease-in-out infinite alternate}@keyframes pn-lf{from{opacity:.7}to{opacity:1}}' +
      // The heater and the screen.
      '.pn-heat{animation:pn-ht 5s ease-in-out infinite alternate}@keyframes pn-ht{from{opacity:.7}to{opacity:1}}' +
      '.pn-cur{animation:pn-cur 1.1s steps(1) infinite}@keyframes pn-cur{50%{opacity:0}}' +
      '.pn-prog{transform-box:fill-box;transform-origin:0 50%;animation:pn-prog 2.4s ease-in-out infinite}@keyframes pn-prog{from{transform:scaleX(.05)}to{transform:scaleX(1)}}' +
      // Thinking: frosty breath.
      '.pn-br{opacity:0;transform-box:fill-box;transform-origin:center}.st-thinking .pn-br{animation:pn-br 2.6s ease-out infinite;animation-delay:calc(var(--k) * .8s)}' +
      '@keyframes pn-br{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:.55}100%{opacity:0;transform:translate(-50px,-30px) scale(2.4)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="pn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020812"/><stop offset=".45" stop-color="#071a2c"/><stop offset=".56" stop-color="#103a50"/><stop offset="1" stop-color="#0a2234"/></linearGradient>' +
      '<linearGradient id="pn-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#103348"/><stop offset="1" stop-color="#071a2a"/></linearGradient>' +
      '<linearGradient id="pn-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3de8a0" stop-opacity="0"/><stop offset=".6" stop-color="#3de8a0" stop-opacity=".3"/><stop offset="1" stop-color="#7affc8" stop-opacity=".55"/></linearGradient>' +
      '<linearGradient id="pn-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3aa8ff" stop-opacity="0"/><stop offset=".6" stop-color="#3aa8ff" stop-opacity=".25"/><stop offset="1" stop-color="#6ad0ff" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="pn-g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6aff" stop-opacity="0"/><stop offset=".6" stop-color="#9a6aff" stop-opacity=".22"/><stop offset="1" stop-color="#c49aff" stop-opacity=".42"/></linearGradient>' +
      '<linearGradient id="pn-g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6ad0" stop-opacity="0"/><stop offset=".6" stop-color="#ff6ad0" stop-opacity=".5"/><stop offset="1" stop-color="#ff9ae0" stop-opacity=".85"/></linearGradient>' +
      '<linearGradient id="pn-g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6ff6a" stop-opacity="0"/><stop offset=".6" stop-color="#b6ff6a" stop-opacity=".45"/><stop offset="1" stop-color="#d8ff9a" stop-opacity=".85"/></linearGradient>' +
      '<linearGradient id="pn-gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f2f46"/><stop offset=".6" stop-color="#1e4f6c"/><stop offset="1" stop-color="#2c6584"/></linearGradient>' +
      '<linearGradient id="pn-gc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a6283"/><stop offset="1" stop-color="#4a88a8"/></linearGradient>' +
      '<linearGradient id="pn-wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfeef6" stop-opacity="0"/><stop offset=".5" stop-color="#dfeef6" stop-opacity=".6"/><stop offset="1" stop-color="#dfeef6" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="pn-lg"><stop offset="0" stop-color="#ffc878" stop-opacity=".5"/><stop offset="1" stop-color="#ffc878" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pn-fm"><stop offset="0" stop-color="#e6f4fa" stop-opacity=".9"/><stop offset="1" stop-color="#e6f4fa" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#pn-sky)"/>' +
      stars +
      `<g class="pn-ao"><g class="pn-ar" style="animation-duration:15s">${a1.band}${a1.rays}</g></g>` +
      `<g class="pn-ao" style="animation-duration:9s;animation-delay:-3s"><g class="pn-ar" style="animation-duration:11s;animation-direction:alternate-reverse">${a2.band}${a2.rays}</g></g>` +
      `<g class="pn-ao" style="animation-duration:11s;animation-delay:-6s"><g class="pn-ar" style="animation-duration:17s">${a3.band}${a3.rays}</g></g>` +
      `<g class="pn-ar2"><g class="pn-ar" style="animation-duration:12s">${b1.band}${b1.rays}</g><g class="pn-ar" style="animation-duration:14s;animation-direction:alternate-reverse">${b2.band}${b2.rays}</g></g>` +
      cliffs +
      '<rect y="520" width="1600" height="480" fill="url(#pn-sea)"/>' +
      '<path d="M0 520H1600" stroke="#6fb8d8" stroke-opacity=".3" stroke-width="2"/>' +
      reflect +
      berg(640, 600, 0.9, 0) +
      berg(940, 572, 0.6, -2) +
      berg(1100, 640, 1.1, -4) +
      berg(1420, 590, 0.7, -1) +
      // The glacier wall, its inner face and the slab that calves.
      '<path d="M-20 730V150L40 100L90 140L150 84L210 130L260 96L300 150V290L270 310V730Z" fill="url(#pn-gl)"/>' +
      '<path d="M60 150L110 140L150 84L120 200ZM210 130L260 96L240 220Z" fill="#9fd0e6" fill-opacity=".22"/>' +
      `<path d="${crevasses}" fill="none" stroke="#071a2a" stroke-opacity=".6" stroke-width="3"/>` +
      '<path d="M-20 150L40 100L90 140L150 84L210 130L260 96L300 150" fill="none" stroke="#dff2fa" stroke-opacity=".5" stroke-width="3" stroke-linejoin="round"/>' +
      '<path class="pn-scar" d="M270 310L300 290V730H270Z" fill="#8fd6ee" fill-opacity=".35"/>' +
      '<path d="M270 300L300 290V730H270Z" fill="#0c2a40"/>' +
      '<g class="pn-chunk"><path d="M270 300L300 276L360 284L430 326L444 430L430 730H270Z" fill="url(#pn-gc)"/>' +
      '<path d="M300 276L360 284L430 326L444 430L430 730H392L404 430L386 330Z" fill="#bfe6f4" fill-opacity=".2"/>' +
      '<path d="M270 300L300 276L360 284L430 326" fill="none" stroke="#e6f6fc" stroke-opacity=".6" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M330 360L346 470L322 560L342 660M390 400L376 520L396 620" fill="none" stroke="#0c2a40" stroke-opacity=".5" stroke-width="2.4"/></g>' +
      '<path class="pn-crack" d="M294 150L284 230L304 300L284 400L304 480L286 560L300 660L286 730" fill="none" stroke="#e6f6fc" stroke-width="3.4" stroke-linejoin="round"/>' +
      debris +
      // The water in front of the glacier's foot: the slab sinks behind it.
      '<path d="M-20 722Q100 712 220 722T460 722T700 724V820H-20Z" fill="#0b2436"/><path d="M-20 722Q100 712 220 722T460 722T700 724" fill="none" stroke="#8fd0e8" stroke-opacity=".35" stroke-width="2.4"/>' +
      // The splash: foam, spray, rings, and the wave that rolls across the bay.
      '<g transform="translate(448 726)"><g class="pn-splash"><ellipse class="pn-foam" cx="0" cy="-6" rx="110" ry="40" fill="url(#pn-fm)"/>' +
      spray +
      '</g><ellipse class="pn-ring" cx="0" cy="4" rx="60" ry="8" fill="none" stroke="#cfe6f2" stroke-width="3"/><ellipse class="pn-ring" style="animation-delay:2.4s" cx="0" cy="4" rx="60" ry="8" fill="none" stroke="#cfe6f2" stroke-width="2.4"/></g>' +
      `<g transform="translate(300 730)"><g class="pn-roll"><path d="${wave}" fill="none" stroke="#cfe6f2" stroke-width="4" stroke-linecap="round"/><path d="${wave}" transform="translate(40 18) scale(.9 1)" fill="none" stroke="#9fd0e6" stroke-opacity=".6" stroke-width="3"/></g></g>` +
      // The foreground ice shelf with the sled and the bear.
      '<path d="M-20 820Q200 790 460 810T980 800T1400 830T1700 820V1100H-20Z" fill="#17323f"/>' +
      '<path d="M-20 820Q200 790 460 810T980 800T1400 830T1700 820" fill="none" stroke="#cfe6f2" stroke-opacity=".35" stroke-width="3"/>' +
      shelfDots +
      '<g transform="translate(300 860)"><g class="pn-bear"><g transform="scale(1.1)">' +
      bear() +
      '</g></g></g>' +
      '<g transform="translate(150 905)">' +
      '<path d="M-96 8Q-110 -2 -100 -14M96 8Q110 -2 100 -14" fill="none" stroke="#7a5a3a" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M-98 10H98" stroke="#7a5a3a" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M-84 8V-20H84V8" fill="none" stroke="#5a4028" stroke-width="5"/><rect x="-80" y="-22" width="160" height="8" fill="#5a4028"/>' +
      '<rect x="-70" y="-60" width="60" height="38" rx="3" fill="#3a5a6a"/><rect x="-4" y="-50" width="52" height="28" rx="3" fill="#6a4a30"/><path d="M-70 -42H-10M-4 -36H48" stroke="#1a2a34" stroke-width="2"/>' +
      '<path d="M-76 -62Q-20 -80 52 -56" fill="none" stroke="#c9a44a" stroke-width="3"/>' +
      '<path d="M70 -22V-100" stroke="#5a4028" stroke-width="4"/><circle class="pn-lf" cx="70" cy="-90" r="40" fill="url(#pn-lg)"/><rect x="63" y="-98" width="14" height="16" rx="3" fill="#ffc878"/>' +
      '</g>' +
      rain({ seed: 31, count: 48, length: [3, 6], slant: 60, seconds: 17, stroke: '#e6f2ff', opacity: 0.45 }) +
      rain({ seed: 32, count: 26, length: [6, 11], slant: 120, seconds: 9, stroke: '#ffffff', opacity: 0.4 }) +
      // The blizzard gust: a faint white wash and streaks racing sideways.
      '<g class="pn-wash"><rect width="1600" height="1000" fill="#dfeef6" fill-opacity=".85"/></g>' +
      `<g class="pn-bliz"><g stroke="#f4faff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"><g class="pn-bs">${streakSet}</g></g></g>`,
    nook:
      '<defs><clipPath id="pn-wc"><rect x="232" y="44" width="180" height="108" rx="6"/></clipPath>' +
      '<radialGradient id="pn-hg"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".4"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pn-dg" cx=".4" cy=".35"><stop offset="0" stop-color="#cfe2ee"/><stop offset="1" stop-color="#4a6a80"/></radialGradient>' +
      '<radialGradient id="pn-dh"><stop offset="0" stop-color="#7fd8ff" stop-opacity=".4"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="pn-slg" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#e6f6ff" stop-opacity=".28"/><stop offset="1" stop-color="#e6f6ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="pn-wsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04101c"/><stop offset="1" stop-color="#103a50"/></linearGradient></defs>' +
      // The roof gear: spotlight, radar dome (lit, sweeping), the dish and a beacon mast.
      '<g transform="translate(338 -48)"><g class="pn-sl"><path d="M0 0L-760 -60V90Z" fill="url(#pn-slg)"/></g></g>' +
      '<path d="M420 20V-96" stroke="#5a7a8c" stroke-width="4"/><circle class="pn-bk" cx="420" cy="-98" r="4" fill="#ff7a6a"/>' +
      '<path d="M130 20V-14" stroke="#5a7a8c" stroke-width="6"/>' +
      '<g transform="translate(130 -14)"><g class="pn-dish"><path d="M-30 -14Q0 22 30 -14Z" fill="#5a7a8c" stroke="#bfe0f0" stroke-opacity=".6" stroke-width="2.4"/><path d="M0 6L-8 -32" stroke="#bfe0f0" stroke-width="2.4"/><circle cx="-8" cy="-34" r="3.4" fill="#bfe0f0"/></g></g>' +
      [0, 1, 2].map(k => `<path class="pn-sg" style="--k:${k}" d="M108 -52Q124 -62 138 -52" fill="none" stroke="#7fd8ff" stroke-width="3" stroke-linecap="round"/>`).join('') +
      '<rect x="330" y="-6" width="16" height="26" fill="#3a5060"/>' +
      '<circle class="pn-halo" cx="338" cy="-48" r="74" fill="url(#pn-dh)"/>' +
      '<circle cx="338" cy="-48" r="40" fill="url(#pn-dg)" stroke="#bfe0f0" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M298 -48H378M338 -88V-8M310 -76Q338 -48 310 -20M366 -76Q338 -48 366 -20" fill="none" stroke="#3a5a70" stroke-opacity=".6" stroke-width="1.8"/>' +
      '<g transform="translate(338 -52)"><g class="pn-sw"><path d="M0 0L28 -14V14Z" fill="#7fd8ff" fill-opacity=".85"/><path d="M0 8V-26" stroke="#d4f4ff" stroke-width="3"/></g></g>' +
      // The station's wall, in snow: seams, a window onto the aurora, a map and a gauge.
      '<path d="M16 66Q16 22 58 22H460V470H16Z" fill="#0e1d2b" stroke="#2a4a60" stroke-width="3"/>' +
      '<path d="M10 22Q60 4 140 12T300 10T470 14V24H10Z" fill="#a8c4d4" fill-opacity=".55"/>' +
      '<path d="M16 24L16 40M60 24V34M200 24V38M330 24V32" stroke="#dfeef6" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>' +
      '<g stroke="#1c3448" stroke-width="2"><path d="M16 190H460M16 310H460M130 22V456M230 190V456"/></g>' +
      '<g clip-path="url(#pn-wc)"><rect x="232" y="44" width="180" height="108" fill="url(#pn-wsk)"/>' +
      '<path class="pn-halo" d="M240 120Q290 70 340 100T412 70V90Q360 120 330 130T240 150Z" fill="#3de8a0" fill-opacity=".4"/>' +
      '<path class="pn-halo" style="animation-delay:-2s" d="M240 96Q300 56 360 80T412 50V66Q370 96 320 100T240 120Z" fill="#7a6aff" fill-opacity=".3"/>' +
      '<path d="M232 152Q300 132 360 144T412 138V160H232Z" fill="#cfe6f2" fill-opacity=".2"/>' +
      rain({ seed: 41, count: 12, length: [3, 6], slant: 80, seconds: 4, stroke: '#ffffff', opacity: 0.7, box: [232, 44, 180, 108] }) +
      '<rect class="pn-ww" x="232" y="44" width="180" height="108" fill="#dfeef6"/></g>' +
      '<rect x="232" y="44" width="180" height="108" rx="6" fill="none" stroke="#5a7a8c" stroke-width="7"/><path d="M322 44V152" stroke="#5a7a8c" stroke-width="4"/>' +
      '<path d="M236 50L260 50L236 74Z" fill="#dfeef6" fill-opacity=".5"/>' +
      bolts +
      '<rect x="56" y="62" width="62" height="78" rx="2" fill="#e8dfc8" fill-opacity=".8" stroke="#8a7a5a" stroke-width="2"/>' +
      '<path d="M66 118Q80 96 92 108T108 78M66 86H100M66 96H90" fill="none" stroke="#6a5a3a" stroke-width="2"/><path d="M96 112L108 124M108 112L96 124" stroke="#a03a2a" stroke-width="2.4"/>' +
      '<circle cx="164" cy="90" r="20" fill="#16283a" stroke="#5a7a8c" stroke-width="3"/><path d="M164 90L176 78" stroke="#ffc878" stroke-width="3" stroke-linecap="round"/><circle cx="164" cy="90" r="3" fill="#8aa0b0"/>' +
      '<path d="M16 456H460V480H16Z" fill="#08121c"/>' +
      '<path d="M16 456H460" stroke="#2a4a60" stroke-width="3"/>' +
      // The heater under the desk, glowing.
      '<g class="pn-heat"><circle cx="330" cy="430" r="170" fill="url(#pn-hg)"/></g>' +
      '<rect x="296" y="404" width="68" height="52" rx="5" fill="#2a1c18" stroke="#5a3a2a" stroke-width="2"/>' +
      '<g class="pn-heat" fill="#ff9a4a"><rect x="304" y="414" width="52" height="5" rx="2"/><rect x="304" y="426" width="52" height="5" rx="2"/><rect x="304" y="438" width="52" height="5" rx="2"/></g>',
    front: [0, 1, 2]
      .map(k => `<circle class="pn-br" style="--k:${k}" cx="78" cy="${296 + k * 4}" r="${6 + k}" fill="#e8f4fa"/>`)
      .join(''),
  }
}
