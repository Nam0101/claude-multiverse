import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Dinosaurs: a caveman at a stone slab in a prehistoric jungle. A volcano smokes at the upper left, long-necked
// dinosaurs walk the horizon, pterosaurs cross the sky. When a command runs the volcano erupts.
const ACCENT = '#ff9a2a'
const LAVA = '#ff5a1f'
const JUNGLE = '#3f7a35'
const STONE = '#2b2219'
const STONE_EDGE = '#4a3a28'

const PW = 'M4 -2L-10 -58L8 -40L22 -64L26 -34L44 -38L22 -2Z'

/** A pterosaur in profile, facing right, its body at the origin; the wings flap between two poses. */
function ptero(): string {
  return (
    '<g fill="#0a0704" stroke="#ff9a2a" stroke-opacity=".2" stroke-width="1.5" stroke-linejoin="round">' +
    `<g transform="translate(2 -2)"><path class="kl-wg kl-wg2" d="${PW}" fill="#050302"/></g>` +
    '<ellipse rx="17" ry="6"/><path d="M12 -3L62 -9L66 -6L16 4Z"/><path d="M12 -5L-10 -18L18 -7Z"/><path d="M-14 0L-40 7L-14 4Z"/>' +
    `<path class="kl-wg" d="${PW}"/></g>`
  )
}

/** A long-necked dinosaur in profile, facing right, standing on y=0. The neck lowers to graze when Claude is idle. */
function sauro(graze: number, step: number): string {
  const leg = (x: number, delay: number) => `<g transform="translate(${x} -56)"><g class="kl-lg" style="animation-delay:${f(delay)}s"><path d="M-9 0H9L8 56H-8Z"/></g></g>`
  const arcs = [0, 0.45, 0.9]
    .map(d => `<path class="kl-wv" style="animation-delay:${d}s" d="M2 -14A15 15 0 0 1 2 14" fill="none" stroke="#ffae4a" stroke-width="3" stroke-linecap="round"/>`)
    .join('')

  return (
    '<g fill="#100b06" stroke="#ff9a2a" stroke-opacity=".18" stroke-width="2" stroke-linejoin="round">' +
    '<path d="M-60 -92C-120 -92 -160 -62 -210 -30C-160 -50 -120 -50 -60 -52Z"/>' +
    leg(-48, step) +
    leg(54, step) +
    '<ellipse cx="0" cy="-78" rx="72" ry="34"/>' +
    leg(-28, step - 1.3) +
    leg(36, step - 1.3) +
    `<g transform="translate(46 -96)"><g class="kl-neck" style="--gd:${f(graze)}s">` +
    '<path d="M0 14C14 -30 34 -80 66 -118L80 -110C58 -70 46 -26 26 22Z"/>' +
    '<ellipse cx="84" cy="-116" rx="14" ry="7" transform="rotate(-12 84 -116)"/>' +
    `<g transform="translate(100 -118)">${arcs}</g></g></g></g>`
  )
}

/** A big two-legged predator in profile, facing right, standing on y=0. */
function predator(): string {
  const legPath = 'M-22 0C-30 40 -26 80 -10 112L-18 130L24 130L22 118C16 100 18 60 30 20L26 0Z'

  return (
    '<g fill="#050402">' +
    '<path d="M-30 -190C-110 -200 -190 -170 -260 -120C-190 -150 -110 -140 -40 -110Z"/>' +
    '<g class="kl-step"><g transform="translate(-6 -130)"><g class="kl-pl"><path d="' + legPath + '"/></g></g>' +
    '<g transform="translate(24 -130)"><g class="kl-pl kl-pl2"><path d="' + legPath + '"/></g></g>' +
    '<path d="M-40 -200C-10 -235 60 -245 110 -225C140 -260 170 -285 205 -283C245 -280 262 -262 266 -240L270 -228L248 -226L252 -214L240 -204C220 -200 190 -204 170 -190L150 -168C120 -150 90 -130 60 -120L-10 -110Z"/>' +
    '<path d="M120 -170L152 -150L142 -143L116 -158Z"/>' +
    `<circle cx="232" cy="-258" r="3.4" fill="${ACCENT}" fill-opacity=".85"/></g></g>`
  )
}

/** A giant fern frond as one stroked path: a curved stem with a leaflet each side of every joint. */
function fern(x0: number, y0: number, len: number, angle: number, bend: number, shade: string, delay: number): string {
  const steps = 15
  const parts: string[] = []
  const pts: [number, number, number][] = []

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const a = ((angle + bend * t * t) * Math.PI) / 180
    const r = len * t
    const px = x0 + Math.sin(a) * r
    const py = y0 - Math.cos(a) * r

    pts.push([px, py, a])
  }

  parts.push(`M${f(pts[0]![0])} ${f(pts[0]![1])}${pts.slice(1).map(([x, y]) => `L${f(x)} ${f(y)}`).join('')}`)

  for (let i = 2; i <= steps; i += 1) {
    const [x, y, a] = pts[i]!
    const size = len * 0.2 * Math.sin((1 - i / (steps + 1)) * Math.PI * 0.9 + 0.2)

    for (const side of [-1, 1]) {
      const la = a + side * 1.15
      parts.push(`M${f(x)} ${f(y)}l${f(Math.sin(la) * size)} ${f(-Math.cos(la) * size)}`)
    }
  }

  return (
    `<path class="kl-fr" style="transform-origin:${f(x0)}px ${f(y0)}px;animation-delay:${f(delay)}s" d="${parts.join('')}" fill="none" ` +
    `stroke="${shade}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

const GLYPHS = ['m0 8l6-12l6 12', 'm0 0h12m-6 0v14', 'm12 0l-12 7l12 7', 'm0 2c6-4 12-4 12 2s-12 4-12 10', 'm6 0v14m-6-6h12', 'm0 0l12 14m0-14l-12 14']

/** The stone tablet with glowing runes, and pebbles for keys. */
function device(light: string, activity: Activity): string {
  const rowClass: Partial<Record<Activity, string>> = {
    responding: 'kl-row',
    tool: 'kl-pulse',
    run: 'kl-pulse kl-fast',
    thinking: 'kl-breath',
    web: 'kl-breath',
  }
  const cls = rowClass[activity] ?? ''
  const rows = [0, 1, 2]
    .map(r => {
      const d = [0, 1, 2, 3, 4].map(c => `M${282 + c * 16} ${248 + r * 18}${GLYPHS[(r * 2 + c * 3 + (r === 1 ? 1 : 0)) % GLYPHS.length]}`).join('')

      return (
        `<g class="${cls}" style="animation-delay:${f(r * 0.3)}s" fill="none" stroke="${light}" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="${d}" stroke-width="7" stroke-opacity=".22"/><path d="${d}" stroke-width="2.2"/></g>`
      )
    })
    .join('')
  const typing = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web'
  const pebbles = Array.from(
    { length: 7 },
    (_, i) =>
      `<ellipse${typing ? ' class="kl-pb"' : ''} style="animation-delay:${f(i * 0.07)}s" cx="${252 + i * 12}" cy="324" rx="5.2" ry="4" fill="#5a4b3a" stroke="#2b2219"/>`,
  ).join('')

  return (
    '<path d="M268 326L262 244Q262 230 278 228L366 224Q382 224 384 240L388 324Z" fill="#3a3026" stroke="#5a4a38" stroke-width="2"/>' +
    '<path d="M277 317L273 249Q273 240 282 240L362 237Q371 237 372 246L376 315Z" fill="#120d08"/>' +
    `<path d="M277 317L273 249Q273 240 282 240L362 237Q371 237 372 246L376 315Z" fill="${light}" fill-opacity=".1" stroke="${light}" stroke-opacity=".3"/>` +
    rows +
    (activity === 'error' ? '<path d="M334 230L324 262L342 278L328 314" fill="none" stroke="#060402" stroke-width="2.4"/>' : '') +
    pebbles
  )
}

function palm(x: number, y: number, s: number): string {
  const fronds = [-70, -40, -15, 15, 40, 70]
    .map(a => {
      const r = (a * Math.PI) / 180

      return `M0 0Q${f(Math.sin(r) * 30 * s)} ${f(-26 * s)} ${f(Math.sin(r) * 60 * s)} ${f(-14 * s + Math.abs(a) * 0.25 * s)}`
    })
    .join('')

  return `<g transform="translate(${x} ${y})"><path d="M0 0V${f(-70 * s)}" stroke="#0d130a" stroke-width="${f(5 * s)}"/><g transform="translate(0 ${f(-70 * s)})"><path d="${fronds}" fill="none" stroke="#101a0c" stroke-width="${f(4 * s)}" stroke-linecap="round"/></g></g>`
}

export function dinosaursWorld(): World {
  const next = random(65)
  const stars = Array.from({ length: 34 }, () => `<circle cx="${f(next() * 1600)}" cy="${f(next() * 420)}" r="${f(0.5 + next() * 1.1)}" fill="#ffe2b0" fill-opacity="${f(0.2 + next() * 0.4)}"/>`).join('')
  const smoke = Array.from({ length: 7 }, (_, i) => {
    return (
      `<circle class="kl-sm" cx="${f(250 + next() * 24)}" cy="232" r="${f(26 + next() * 22)}" fill="#3a2c20" ` +
      `style="--dx:${f(80 + next() * 140)}px;animation-delay:${f(-i * 2)}s"/>`
    )
  }).join('')
  const ash = Array.from({ length: 9 }, (_, i) => {
    return (
      `<circle class="kl-ash" cx="${f(200 + next() * 150)}" cy="${f(190 - next() * 70)}" r="${f(60 + next() * 60)}" fill="#1e1710" ` +
      `style="--dx:${f(120 + next() * 160)}px;animation-delay:${f(i * 0.25)}s"/>`
    )
  }).join('')
  const rocks = Array.from({ length: 13 }, (_, i) => {
    const dx = (next() - 0.35) * 460
    const h = -(170 + next() * 190)
    const dur = 2.2 + next() * 1.4

    return (
      `<g class="kl-rkx" style="--dx:${f(dx)}px;--d:${f(dur)}s;--dl:${f(-i * 0.37)}s"><g class="kl-rky" style="--h:${f(h)}px;--g:${f(-h * 0.45)}px;--d:${f(dur)}s;--dl:${f(-i * 0.37)}s">` +
      `<circle r="${f(5 + next() * 5)}" fill="${i % 3 ? '#ffae4a' : LAVA}"/></g></g>`
    )
  }).join('')
  const ferns = [
    fern(30, 980, 330, 18, 26, '#1d3a18', 0),
    fern(70, 990, 380, -4, 30, '#2a5424', -1.2),
    fern(120, 995, 300, -26, -20, '#23461e', -2.1),
    fern(190, 1000, 400, 16, 28, '#2f5f28', -0.6),
    fern(240, 1000, 330, 40, 22, '#1d3a18', -3),
    fern(10, 990, 280, 60, 10, '#3f7a35', -1.7),
    fern(160, 1000, 260, -50, -14, '#2a5424', -2.6),
    fern(300, 1000, 250, 30, 30, '#23461e', -0.2),
  ].join('')
  const trees = [20, 330, 620, 900, 1240, 1500].map((x, i) => palm(x, 720 + (i % 2) * 14, 0.8 + (i % 3) * 0.25)).join('')
  const walkers = [
    { s: 0.62, y: 744, dur: 190, off: 40, gd: -2, st: 0 },
    { s: 0.4, y: 702, dur: 240, off: 150, gd: -9, st: -0.7 },
    { s: 0.5, y: 722, dur: 210, off: 100, gd: -14, st: -1.1 },
  ]
    .map(
      d =>
        `<g class="kl-wk" style="animation-duration:${d.dur}s;animation-delay:${-d.off}s"><g transform="translate(0 ${d.y}) scale(${d.s})">${sauro(d.gd, d.st)}</g></g>`,
    )
    .join('')
  const flyers = [
    { y: 130, s: 0.9, dur: 52, off: 10 },
    { y: 250, s: 0.7, dur: 66, off: 40 },
    { y: 70, s: 0.6, dur: 80, off: 20 },
    { y: 330, s: 0.8, dur: 58, off: 5 },
  ]
    .map(d => `<g transform="translate(0 ${d.y})"><g class="kl-fl" style="animation-duration:${d.dur}s;animation-delay:${-d.off}s"><g transform="scale(${d.s})">${ptero()}</g></g></g>`)
    .join('')
  const ripples = [1500, 1100, 700, 300]
    .map(x => `<ellipse class="kl-rip" style="animation-delay:${f((1900 - x) / 509)}s" cx="${x}" cy="962" rx="30" ry="7" fill="none" stroke="#c8a870" stroke-width="2.5"/>`)
    .join('')
  const signals = [0, 0.7, 1.4].map(d => `<circle class="kl-sg" style="animation-delay:${d}s" cx="1535" cy="440" r="20" fill="#cdbb9a"/>`).join('')
  const paint =
    'M110 -266a16 16 0 1 0 .1 0M110 -292v10M110 -222v10M84 -250h-10M136 -250h10M126 -268l8 -8M94 -268l-8 -8' +
    'M100 -150a4 4 0 1 0 .1 0M100 -146V-124M100 -138L88 -128M100 -138L114 -148L134 -172M100 -124L92 -104M100 -124L108 -104' +
    'M154 -138a4 4 0 1 0 .1 0M154 -134V-112M154 -126L142 -116M154 -126L168 -136L186 -158M154 -112L146 -92M154 -112L162 -92' +
    'M170 -210C190 -230 220 -230 238 -216L262 -268L268 -264L246 -208L244 -176M214 -204L212 -176M186 -204L184 -176M170 -210L146 -190M262 -268L276 -262' +
    'M200 -112a3 3 0 1 0 .1 0M214 -104a3 3 0 1 0 .1 0M228 -112a3 3 0 1 0 .1 0M242 -104a3 3 0 1 0 .1 0M96 -80h160'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'acorn',
      thought: 'smoke',
      ink: '#060402',
      furniture: STONE,
      metal: '#3a3026',
      paper: '#e8dcc0',
      light: { idle: '#a07a3a', work: '#ffae4a', bright: '#ffd28a' },
      headTop: 212,
      glowAt: [326, 282],
      device,
      wear: {
        front:
          '<path d="M130 240L134 214L146 232L154 206L166 232L178 212L184 240Z" fill="#3a2614"/>' +
          '<g transform="rotate(-24 172 222)"><rect x="150" y="219" width="44" height="7" rx="3" fill="#e8dcc0"/>' +
          '<g fill="#e8dcc0"><circle cx="150" cy="218" r="5"/><circle cx="150" cy="227" r="5"/><circle cx="194" cy="218" r="5"/><circle cx="194" cy="227" r="5"/></g></g>' +
          '<path d="M70 310L230 334V350L70 332Z" fill="#b9772e"/>' +
          '<g fill="#3a1c08"><ellipse cx="92" cy="322" rx="5" ry="3.4"/><ellipse cx="122" cy="328" rx="4.6" ry="3.2"/><ellipse cx="150" cy="332" rx="5" ry="3.4"/>' +
          '<ellipse cx="180" cy="338" rx="4.6" ry="3.2"/><ellipse cx="208" cy="342" rx="5" ry="3.4"/></g>' +
          '<path d="M70 310L230 334" stroke="#e0a45a" stroke-opacity=".5" stroke-width="1.5"/>',
      },
      seatArt:
        `<path d="M100 456C98 400 106 356 150 351C194 356 202 400 200 456Z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="2"/>` +
        '<path d="M118 380C126 372 138 374 142 382M162 410C170 402 180 404 184 412" fill="none" stroke="#4a3a28" stroke-width="2"/>' +
        `<ellipse cx="128" cy="356" rx="14" ry="3.5" fill="${JUNGLE}" fill-opacity=".55"/>`,
      tableArt:
        `<path d="M166 332L188 327L440 329L470 334L466 352L420 357L196 355L170 350Z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="2"/>` +
        `<g fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="2"><rect x="178" y="355" width="34" height="36" rx="10"/><rect x="174" y="389" width="40" height="36" rx="12"/><rect x="170" y="423" width="46" height="33" rx="12"/>` +
        '<rect x="426" y="355" width="34" height="36" rx="10"/><rect x="422" y="389" width="40" height="36" rx="12"/><rect x="418" y="423" width="46" height="33" rx="12"/></g>' +
        '<path d="M200 338H300M360 340H430" stroke="#4a3a28" stroke-opacity=".7" stroke-width="2"/>',
    },
    style:
      // Volcano, smoke, eruption.
      '.kl-sm{opacity:0;transform-box:fill-box;transform-origin:center;animation:kl-sm 14s linear infinite}' +
      '@keyframes kl-sm{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.4}100%{opacity:0;transform:translate(var(--dx),-380px) scale(2.6)}}' +
      '.kl-crater{animation:kl-cr 3s ease-in-out infinite alternate}@keyframes kl-cr{from{opacity:.6}to{opacity:1}}' +
      '.kl-lv{animation:kl-cr 2.4s ease-in-out infinite alternate}' +
      '.kl-ash,.kl-rkx,.kl-fount,.kl-erg{opacity:0}' +
      '.st-run .kl-ash{transform-box:fill-box;transform-origin:center;animation:kl-ash 6s ease-out infinite}' +
      '@keyframes kl-ash{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-340px) scale(2.2)}}' +
      '.st-run .kl-fount{transform-box:fill-box;transform-origin:50% 100%;animation:kl-fount 1.1s ease-in-out infinite alternate}' +
      '@keyframes kl-fount{from{opacity:.75;transform:scaleY(.8)}to{opacity:1;transform:scaleY(1.05)}}' +
      '.st-run .kl-erg{animation:kl-erg 1.6s ease-in-out infinite alternate}@keyframes kl-erg{from{opacity:.4}to{opacity:.8}}' +
      '.st-run .kl-rkx{animation:kl-rkx var(--d) linear infinite;animation-delay:var(--dl)}' +
      '@keyframes kl-rkx{0%{opacity:0;transform:translateX(0)}6%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateX(var(--dx))}}' +
      '.st-run .kl-rky{animation:kl-rky var(--d) linear infinite;animation-delay:var(--dl)}' +
      '@keyframes kl-rky{0%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}42%{transform:translateY(var(--h));animation-timing-function:cubic-bezier(.6,0,.9,.5)}100%{transform:translateY(var(--g))}}' +
      // Dinosaurs and pterosaurs.
      '.kl-wk{animation:kl-wk 200s linear infinite}@keyframes kl-wk{from{transform:translateX(-420px)}to{transform:translateX(2000px)}}' +
      '.kl-lg{animation:kl-lg 2.6s ease-in-out infinite alternate}@keyframes kl-lg{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}' +
      '.st-idle .kl-neck{animation:kl-graze 18s ease-in-out infinite;animation-delay:var(--gd)}' +
      '@keyframes kl-graze{0%,18%{transform:rotate(0)}32%,62%{transform:rotate(74deg)}76%,100%{transform:rotate(0)}}' +
      '.st-done .kl-neck{transform:rotate(-10deg)}' +
      '.kl-wv{opacity:0;transform-box:fill-box;transform-origin:0 50%}' +
      '.st-done .kl-wv{animation:kl-wv 1.8s ease-out infinite}@keyframes kl-wv{0%{opacity:0;transform:scale(.4)}20%{opacity:.85}100%{opacity:0;transform:scale(2.4)}}' +
      '.kl-wg{transform-box:fill-box;transform-origin:40% 100%;animation:kl-wg .7s ease-in-out infinite alternate}.kl-wg2{animation-delay:-.2s}' +
      '@keyframes kl-wg{from{transform:scaleY(1)}to{transform:scaleY(-.45)}}' +
      '.kl-fl{animation:kl-fl 60s linear infinite}@keyframes kl-fl{from{transform:translateX(-180px)}to{transform:translateX(1800px)}}' +
      '.kl-circ{opacity:0}.st-thinking .kl-circ{opacity:1;animation:kl-circ 8s ease-in-out infinite}' +
      '@keyframes kl-circ{0%{transform:translate(-190px,0) scaleX(1)}24%{transform:translate(0,-50px) scaleX(1)}48%{transform:translate(190px,0) scaleX(1)}52%{transform:translate(190px,0) scaleX(-1)}' +
      '76%{transform:translate(0,55px) scaleX(-1)}96%{transform:translate(-190px,0) scaleX(-1)}100%{transform:translate(-190px,0) scaleX(1)}}' +
      // Ferns, and the predator's footfalls.
      '.kl-fr{animation:kl-fsw 6s ease-in-out infinite alternate}@keyframes kl-fsw{from{transform:rotate(-1.2deg)}to{transform:rotate(1.4deg)}}' +
      '.st-error .kl-fr{animation:kl-shk .22s ease-in-out infinite alternate}@keyframes kl-shk{from{transform:rotate(-2.6deg)}to{transform:rotate(2.6deg)}}' +
      '.kl-pred{opacity:0}.st-error .kl-pred{animation:kl-pass 5.5s linear both}' +
      '@keyframes kl-pass{0%{opacity:1;transform:translateX(1900px)}100%{opacity:1;transform:translateX(-900px)}}' +
      '.kl-step{animation:kl-stp .9s ease-in-out infinite}@keyframes kl-stp{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}' +
      '.kl-pl{animation:kl-lg .9s ease-in-out infinite alternate}.kl-pl2{animation-direction:alternate-reverse}' +
      '.kl-rip{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .kl-rip{animation:kl-rip 1.1s ease-out both}@keyframes kl-rip{0%{opacity:0;transform:scale(.3)}20%{opacity:.55}100%{opacity:0;transform:scale(5,2.6)}}' +
      // Smoke signals, sunrise.
      '.kl-sg{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .kl-sg{animation:kl-sg 4.2s ease-out infinite}@keyframes kl-sg{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.7}60%,100%{opacity:0;transform:translate(20px,-300px) scale(2.2)}}' +
      '.kl-sun,.kl-dawn{opacity:0}.st-done .kl-sun{animation:kl-sun 3.4s ease-out both}' +
      '@keyframes kl-sun{from{opacity:0;transform:translateY(120px)}to{opacity:.9;transform:translateY(0)}}' +
      '.st-done .kl-dawn{animation:kl-dawn 3s ease-out both}@keyframes kl-dawn{from{opacity:0}to{opacity:.8}}' +
      // Cave paintings.
      '.kl-lit{opacity:0}.st-read .kl-lit{animation:kl-lit 1.6s ease-out both}@keyframes kl-lit{0%{opacity:0}100%{opacity:1}}' +
      '.kl-pglow{opacity:0}.st-read .kl-pglow{animation:kl-lit 2s ease-out both}' +
      // The tablet.
      '.kl-row{animation:kl-row 1.4s ease-in-out infinite}@keyframes kl-row{0%,10%{opacity:.15}35%,100%{opacity:1}}' +
      '.kl-pulse{animation:kl-pu .9s ease-in-out infinite alternate}.kl-fast{animation-duration:.5s}@keyframes kl-pu{from{opacity:.45}to{opacity:1}}' +
      '.kl-breath{animation:kl-pu 2.6s ease-in-out infinite alternate}' +
      '.kl-pb{animation:kl-pb .3s ease-in-out infinite alternate}@keyframes kl-pb{to{transform:translateY(-2px)}}',
    scenery:
      '<defs><linearGradient id="kl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0905"/><stop offset=".55" stop-color="#1a1008"/><stop offset=".72" stop-color="#2e1a0a"/><stop offset="1" stop-color="#140d06"/></linearGradient>' +
      `<radialGradient id="kl-cg"><stop offset="0" stop-color="${LAVA}" stop-opacity=".55"/><stop offset="1" stop-color="${LAVA}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="kl-eg"><stop offset="0" stop-color="${LAVA}" stop-opacity=".3"/><stop offset="1" stop-color="${LAVA}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="kl-sg"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".3"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="kl-fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0b0"/><stop offset=".3" stop-color="#ffae4a" stop-opacity=".9"/><stop offset="1" stop-color="${LAVA}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="kl-dw" x1="0" y1="0" x2="0" y2="1"><stop offset=".4" stop-color="${ACCENT}" stop-opacity="0"/><stop offset=".72" stop-color="${ACCENT}" stop-opacity=".3"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></linearGradient></defs>` +
      '<rect width="1600" height="1000" fill="url(#kl-sky)"/>' +
      stars +
      '<g class="kl-sun"><circle cx="1010" cy="660" r="420" fill="url(#kl-sg)"/><circle cx="1010" cy="660" r="62" fill="#ffd28a" fill-opacity=".8"/></g>' +
      '<rect class="kl-dawn" width="1600" height="1000" fill="url(#kl-dw)"/>' +
      // The volcano.
      '<path d="M-60 700L150 360L222 242H300L350 340L560 700Z" fill="#150e08" stroke="#2e2014" stroke-width="2"/>' +
      '<path d="M222 242L180 360L130 440L170 700M300 242L330 330L380 440" fill="none" stroke="#0c0804" stroke-width="10" stroke-opacity=".5"/>' +
      `<g fill="none" stroke="${LAVA}" stroke-linecap="round"><path class="kl-lv" d="M236 246L212 330L226 410L196 520" stroke-width="3" stroke-opacity=".6"/>` +
      '<path class="kl-lv" d="M284 246L306 320L292 400L330 500" stroke-width="2.5" stroke-opacity=".5" style="animation-delay:-1s"/></g>' +
      '<circle class="kl-crater" cx="261" cy="238" r="120" fill="url(#kl-cg)"/><ellipse cx="261" cy="242" rx="38" ry="7" fill="#ffae4a" fill-opacity=".8"/>' +
      smoke +
      '<circle class="kl-erg" cx="261" cy="230" r="520" fill="url(#kl-eg)"/>' +
      `<g transform="translate(261 240)"><path class="kl-fount" d="M-26 4C-34 -70 -52 -150 -70 -230L-4 -170L22 -250C30 -170 44 -90 28 4Z" fill="url(#kl-fo)"/>${rocks}</g>` +
      ash +
      // Pterosaurs, one circling when Claude thinks.
      flyers +
      `<g transform="translate(1010 240)"><g class="kl-circ"><g transform="scale(1.4)">${ptero()}</g></g></g>` +
      // The far ridge with the smoke-signal fire, then the dinosaurs behind the hills.
      '<g class="mv-r"><path d="M1380 470C1440 440 1500 436 1560 440C1590 442 1600 450 1620 470V520H1380Z" fill="#150e08"/>' +
      `<ellipse cx="1535" cy="442" rx="14" ry="5" fill="${ACCENT}" fill-opacity=".6"/>${signals}</g>` +
      '<g class="mv-b">' +
      walkers +
      '<path d="M0 760C160 720 320 780 520 740C760 700 960 780 1200 740C1400 710 1500 760 1600 740V1200H0Z" fill="#0f0a06"/>' +
      trees +
      '<path d="M0 840C200 800 420 850 640 820C900 790 1200 850 1600 810V1200H0Z" fill="#0a0704"/>' +
      '<rect y="900" width="1600" height="300" fill="#080503"/>' +
      `<g>${ferns}</g>` +
      ripples +
      '</g>' +
      `<g class="kl-pred"><g transform="translate(0 985) scale(1.7)">${predator()}</g></g>`,
    nook:
      '<defs><radialGradient id="kl-pg" cx=".5" cy=".5"><stop offset="0" stop-color="#ffae4a" stop-opacity=".3"/><stop offset="1" stop-color="#ffae4a" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="M44 456C28 380 32 120 66 -90C86 -230 140 -330 220 -334C280 -332 306 -250 308 -120C310 20 304 300 304 456Z" fill="#1b140c" stroke="#2f2316" stroke-width="3"/>' +
      '<path d="M70 -60C90 40 80 200 96 456M250 -300C270 -200 260 -60 280 100" fill="none" stroke="#120c07" stroke-width="5" stroke-opacity=".7"/>' +
      `<g fill="${JUNGLE}" fill-opacity=".4"><ellipse cx="120" cy="-322" rx="38" ry="8"/><ellipse cx="250" cy="-326" rx="26" ry="6"/><ellipse cx="60" cy="-60" rx="12" ry="26"/></g>` +
      '<ellipse class="kl-pglow" cx="182" cy="-170" rx="150" ry="140" fill="url(#kl-pg)"/>' +
      `<path d="${paint}" fill="none" stroke="#c9772e" stroke-opacity=".38" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path class="kl-lit" d="${paint}" fill="none" stroke="#ffc46a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      '<rect x="0" y="452" width="420" height="80" fill="#080503"/><path d="M0 453H420" stroke="#2a1d10" stroke-width="2"/>' +
      '<g fill="#1a130b"><ellipse cx="350" cy="450" rx="14" ry="6"/><ellipse cx="380" cy="453" rx="9" ry="4"/></g>',
  }
}
