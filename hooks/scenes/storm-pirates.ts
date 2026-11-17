import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Storm Pirates: a pirate captain on the deck in a storm. Layered waves roll, rain slants, a lantern swings, a
// far-off ship waits on the horizon. When a command runs the cannons fire across the water at it.
const GOLD = '#ffd04d'
const BRASS = '#b58a30'
const WOOD = '#2a1f16'
const WOOD_EDGE = '#3f2f20'
const PAPER = '#eadfc6'

/** A rolling wave: a filled swell and its crest line, wide enough to slide one period left without a seam. */
function wave(y: number, amp: number, p: number, fill: string, crest: string): { fill: string; crest: string } {
  const n = Math.ceil((1600 + 2 * p) / (p / 2))
  const d = `M${-p} ${y}q${f(p / 4)} ${f(-amp * 2)} ${f(p / 2)} 0${`t${f(p / 2)} 0`.repeat(n - 1)}`

  return {
    fill: `<path d="${d}V1200H${-p}Z" fill="${fill}"/>`,
    crest: `<path d="${d}" fill="none" stroke="${crest}" stroke-opacity=".28" stroke-width="2"/>`,
  }
}

const SWELLS = [
  { y: 548, amp: 6, p: 260, fill: '#0b2230', crest: '#4fb3c4', secs: 44, bob: 5 },
  { y: 598, amp: 12, p: 380, fill: '#0e2c3a', crest: '#4fb3c4', secs: 34, bob: 6.5 },
  { y: 668, amp: 20, p: 520, fill: '#123846', crest: '#5fc0d0', secs: 26, bob: 5.5 },
  { y: 756, amp: 30, p: 700, fill: '#174754', crest: '#6ccad8', secs: 20, bob: 7 },
  { y: 856, amp: 40, p: 900, fill: '#1c5562', crest: '#7ad2de', secs: 16, bob: 6 },
]

function ship(): string {
  return (
    '<g fill="#04080c" stroke="#2f7f8f" stroke-opacity=".35" stroke-width="1.5" stroke-linejoin="round">' +
    '<path d="M-104 -6H-70L-60 -22H-40V-6H80L100 -24L108 -6L84 20H-80Z"/>' +
    '<path d="M-50 -6V-122H-45V-6M10 -6V-150H15V-6M62 -6V-104H67V-6"/>' +
    '<path d="M-84 -112H-14L-20 -52L-40 -58L-60 -50L-80 -56Z"/><path d="M-26 -140H46L40 -70L22 -78L2 -68L-22 -76Z"/><path d="M34 -98H92L88 -52L72 -58L52 -50L38 -56Z"/>' +
    '<path d="M15 -150L36 -146L15 -140Z"/></g>' +
    `<circle cx="100" cy="-24" r="9" fill="${GOLD}" fill-opacity=".14"/><circle cx="100" cy="-24" r="2.6" fill="${GOLD}" fill-opacity=".85"/>`
  )
}

/** One cannon on the deck, seen from behind and the side, aimed up-left at the horizon. */
function cannon(x: number, y: number, tilt: number, delay: number, target: [number, number], flightLift: number, id: number): string {
  const rad = (tilt * Math.PI) / 180
  const mx = x - 170 * Math.cos(rad)
  const my = y - 170 * Math.sin(rad)
  const dx = target[0] - mx
  const dy = target[1] - my
  const smoke = [0, 1, 2, 3]
    .map(
      i =>
        `<circle class="cb-sm" cx="${f(mx - 6)}" cy="${f(my)}" r="${14 + i * 3}" fill="#7f969e" style="--dx:${f(-40 - i * 26)}px;animation-delay:${f(delay + i * 0.06)}s"/>`,
    )
    .join('')

  return (
    `<g class="cb-rec" style="animation-delay:${delay}s">` +
    `<path d="M-70 8H44V66H-76Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2" transform="translate(${x} ${y})"/>` +
    `<g transform="translate(${x} ${y})"><g fill="#0f1417" stroke="#3a4a50" stroke-width="2"><circle cx="-44" cy="58" r="26"/><circle cx="24" cy="58" r="26"/></g>` +
    '<g stroke="#3a4a50" stroke-width="2"><path d="M-44 36V80M-66 58H-22M24 36V80M2 58H46"/></g>' +
    `<g transform="rotate(${tilt})"><path d="M2 -20L-150 -15L-158 -22L-172 -20V20L-158 22L-150 15L2 20Z" fill="#161d21" stroke="#5a6a70" stroke-opacity=".6" stroke-width="2"/>` +
    '<circle cx="6" cy="0" r="22" fill="#161d21" stroke="#5a6a70" stroke-opacity=".6" stroke-width="2"/>' +
    `<path d="M-30 -20V20M-110 -17V17" stroke="${BRASS}" stroke-opacity=".7" stroke-width="3"/></g></g></g>` +
    `<circle class="cb-mf" cx="${f(mx)}" cy="${f(my)}" r="70" fill="url(#cb-mf)" style="animation-delay:${delay}s"/>` +
    smoke +
    `<g transform="translate(${f(mx)} ${f(my)})"><g class="cb-bx" style="--dx:${f(dx)}px;animation-delay:${delay}s"><g class="cb-by" style="--h:${f(-flightLift)}px;--g:${f(dy)}px;animation-delay:${delay}s">` +
    '<circle class="cb-bs" r="9" fill="#10171a" stroke="#b8c8cc" stroke-opacity=".8" stroke-width="1.6" style="animation-delay:' +
    `${delay}s"/></g></g></g>` +
    `<g transform="translate(${target[0]} ${target[1]})"><g class="cb-spl" style="animation-delay:${delay}s">` +
    '<ellipse rx="26" ry="7" fill="none" stroke="#cfe6ec" stroke-width="2.4"/>' +
    [-16, -6, 6, 16].map((k, j) => `<path class="cb-dp" style="--dx:${k}px;animation-delay:${f(delay + j * 0.03)}s" d="M${k} 0v-16" stroke="#cfe6ec" stroke-width="3" stroke-linecap="round"/>`).join('') +
    `</g></g>`
  )
}

const cog = (cx: number, cy: number, rot: number): string => `<g transform="translate(${cx} ${cy}) rotate(${rot})"><path d="M0 -9V9M-9 0H9" stroke="#e9d9a8" stroke-width="1.6"/></g>`

/** The laptop, a brass compass and a rolled chart with a spyglass on the chart table. */
function device(light: string, activity: Activity): string {
  const needle =
    activity === 'thinking' ? 'cb-needle cb-spin' : activity === 'web' || activity === 'read' ? 'cb-needle cb-seek' : 'cb-needle cb-wob'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    // The laptop.
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#3a3024"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#3a3024"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The compass.
    '<path d="M356 330H378L373 322H361Z" fill="#3a3024"/>' +
    `<circle cx="367" cy="311" r="17" fill="${BRASS}" stroke="#6a4f1a" stroke-width="2"/><circle cx="367" cy="311" r="13" fill="#0b1013"/>` +
    cog(367, 311, 0) +
    `<g transform="translate(367 311)"><g class="${needle}"><path d="M0 -11L3 0H-3Z" fill="${GOLD}"/><path d="M0 11L3 0H-3Z" fill="#6a7a80"/></g></g>` +
    '<circle cx="367" cy="311" r="2" fill="#e9d9a8"/>' +
    // The rolled chart with its ribbon, and the spyglass on top of it.
    `<rect x="398" y="316" width="70" height="14" rx="7" fill="${PAPER}" fill-opacity=".9"/><circle cx="404" cy="323" r="5" fill="none" stroke="#9a8a62" stroke-width="1.6"/>` +
    '<rect x="428" y="316" width="5" height="14" fill="#8a2e24"/>' +
    `<path d="M402 307L440 303V311L402 315Z" fill="${BRASS}"/><path d="M440 304L470 302V310L440 311Z" fill="#8a6a22"/>` +
    '<path d="M416 305V313M452 303V311" stroke="#3a2a10" stroke-width="2"/>' +
    '<g class="cb-gl" transform="translate(471 306)"><path d="M0 -12L2.4 -2.4L12 0L2.4 2.4L0 12L-2.4 2.4L-12 0L-2.4 -2.4Z" fill="#fff6d0"/></g>'
  )
}

const bird = (x: number, y: number, s: number, delay: number): string =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g class="cb-bird" style="animation-delay:${delay}s"><path class="cb-wing" d="M-12 0Q-6 -10 0 0Q6 -10 12 0" fill="none" stroke="#9db4bb" stroke-width="2.4" stroke-linecap="round"/></g></g>`

export function stormPiratesWorld(): World {
  const next = random(7)
  const swells = SWELLS.map((s, i) => {
    const w = wave(s.y, s.amp, s.p, s.fill, s.crest)

    return `<g class="cb-bob" style="animation-duration:${s.bob}s;animation-delay:${f(-i * 1.3)}s"><g class="cb-roll" style="animation:cb-r${i} ${s.secs}s linear infinite">${w.fill}${w.crest}</g></g>`
  }).join('')
  const rollKeys = SWELLS.map((s, i) => `@keyframes cb-r${i}{to{transform:translateX(${-s.p}px)}}`).join('')
  const clouds = (side: number): string => {
    const base = side < 0 ? -80 : 740

    return Array.from({ length: 7 }, (_, i) => {
      const x = base + i * 125 + next() * 40
      const y = 40 + next() * 220

      return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(120 + next() * 90)}" ry="${f(46 + next() * 50)}" fill="${i % 2 ? '#0b1620' : '#0f1f2a'}" fill-opacity=".96"/>`
    }).join('')
  }
  const glints = [0, 1, 2, 3, 4, 5, 6, 7]
    .map(i => `<ellipse class="cb-tw" style="animation-delay:${f(-i * 0.7)}s" cx="${f(780 + (next() - 0.5) * 360)}" cy="${f(560 + i * 42)}" rx="${f(14 + i * 3)}" ry="2" fill="#dff1f5"/>`)
    .join('')
  const spray = Array.from({ length: 12 }, (_, i) => `<circle cx="${f(100 + i * 60 + next() * 40)}" cy="${f(470 + next() * 60 + (i % 3) * 30)}" r="${f(3 + next() * 5)}" fill="#cfe6ec" fill-opacity=".6"/>`).join('')
  const planks = Array.from({ length: 5 }, (_, i) => `<path d="M-20 ${960 + i * 30}H1700" stroke="#1d150e" stroke-width="2"/>`).join('')
  const balusters = Array.from({ length: 15 }, (_, i) => `<rect x="${-10 + i * 120}" y="820" width="16" height="116" rx="3"/>`).join('')
  const sail = (d: string, delay: number) => `<path class="cb-sail" style="animation-delay:${delay}s" d="${d}" fill="#1c2a30" fill-opacity=".92" stroke="#35505a" stroke-width="2" stroke-linejoin="round"/>`
  const mapRoute = 'M268 160C280 130 300 150 312 118C322 92 340 100 348 70'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#030609',
      furniture: WOOD,
      metal: '#3a3024',
      paper: PAPER,
      light: { idle: '#a08a40', work: GOLD, bright: '#ffe9a8' },
      headTop: 208,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // The bandana first, then the tricorn over it: the eyes stay clear below both.
          '<path d="M68 244C96 236 204 236 232 244V254C204 249 96 249 68 254Z" fill="#8a2e24"/>' +
          '<g fill="#e8d0b0" fill-opacity=".7"><circle cx="96" cy="245" r="1.8"/><circle cx="128" cy="244" r="1.8"/><circle cx="170" cy="244" r="1.8"/><circle cx="204" cy="245" r="1.8"/></g>' +
          '<path class="cb-tail" d="M68 246L50 266L62 263L54 280L72 258Z" fill="#8a2e24"/>' +
          '<path d="M50 240L88 214L112 200H188L212 214L250 240C224 232 196 238 150 250C104 238 76 232 50 240Z" fill="#0b0f12" stroke="#2a3238" stroke-width="2" stroke-linejoin="round"/>' +
          `<path d="M50 240C76 232 104 238 150 250C196 238 224 232 250 240" fill="none" stroke="${GOLD}" stroke-opacity=".85" stroke-width="3"/>` +
          `<path d="M100 222H200" stroke="${GOLD}" stroke-opacity=".5" stroke-width="3"/>` +
          '<path d="M212 208C236 196 252 200 258 178C246 192 232 190 210 200Z" fill="#e8e0cc" fill-opacity=".85"/>',
      },
      seatArt:
        `<path d="M108 352C98 380 98 430 108 456H194C204 430 204 380 194 352Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        `<g stroke="${WOOD_EDGE}" stroke-width="2" stroke-opacity=".8"><path d="M128 356V454M151 357V455M174 356V454"/></g>` +
        '<g fill="#3a3430"><path d="M101 372H201V380H101ZM101 424H201V432H101Z"/></g>' +
        `<ellipse cx="151" cy="352" rx="43" ry="6" fill="#3a2c1e" stroke="${WOOD_EDGE}"/>`,
      tableArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="14" rx="2"/>` +
        '<path d="M182 344H200L196 370L204 400L196 456H186L180 400L188 370Z"/><path d="M436 344H454L450 370L458 400L450 456H440L434 400L442 370Z"/>' +
        '<rect x="190" y="408" width="260" height="8"/></g>' +
        `<g fill="${BRASS}"><circle cx="172" cy="337" r="3.4"/><circle cx="464" cy="337" r="3.4"/><circle cx="321" cy="350" r="3"/></g>`,
    },
    style:
      rollKeys +
      '.cb-bob{animation:cb-bob 6s ease-in-out infinite alternate}@keyframes cb-bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
      '.cb-rock{transform-origin:800px 760px;animation:cb-rock 8s ease-in-out infinite alternate}@keyframes cb-rock{from{transform:rotate(-.6deg)}to{transform:rotate(.6deg)}}' +
      '.st-error .cb-rock{animation-duration:1.2s}.st-error .cb-rock{animation-name:cb-rock-big}@keyframes cb-rock-big{from{transform:rotate(-1.1deg)}to{transform:rotate(1.1deg)}}' +
      '.cb-ship{animation:cb-ship 6s ease-in-out infinite alternate;transform-origin:250px 534px}@keyframes cb-ship{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}' +
      '.cb-cl{animation:cb-drift 40s ease-in-out infinite alternate}@keyframes cb-drift{to{transform:translateX(34px)}}' +
      '.cb-cl2{animation-direction:alternate-reverse}' +
      '.st-done .cb-cl{animation:cb-part-l 3.2s ease-out both}.st-done .cb-cl2{animation-name:cb-part-r}' +
      '@keyframes cb-part-l{to{transform:translateX(-380px)}}@keyframes cb-part-r{to{transform:translateX(380px)}}' +
      // Lightning: a soft glow in the clouds, one bolt every four seconds at most, each ramping in over ~.2 s.
      '.cb-lt{opacity:0;animation:cb-lt 8s ease-in-out infinite}.cb-lt2{animation-delay:-4s}' +
      '@keyframes cb-lt{0%,90%{opacity:0}93%{opacity:.34}99%,100%{opacity:0}}' +
      '.st-done .cb-lt{display:none}' +
      '.cb-moon,.cb-beam{opacity:0}.st-done .cb-moon{animation:cb-show 3s ease-out .6s both}.st-done .cb-beam{animation:cb-show 3.4s ease-out 1.2s both}' +
      '@keyframes cb-show{to{opacity:1}}' +
      '.st-done .cb-rainw{animation:cb-rainoff 2.6s ease-out both}@keyframes cb-rainoff{to{opacity:.15}}' +
      '.cb-tw{animation:cb-tw 3.2s ease-in-out infinite alternate;opacity:.15}@keyframes cb-tw{to{opacity:.55}}' +
      // Mast and sails.
      '.cb-sail{transform-box:fill-box;transform-origin:50% 0;animation:cb-sail 4.6s ease-in-out infinite alternate}' +
      '@keyframes cb-sail{from{transform:skewX(-2.4deg) scaleY(1)}to{transform:skewX(2.4deg) scaleY(.97)}}' +
      '.cb-tail{transform-box:fill-box;transform-origin:100% 0;animation:cb-tail 1.8s ease-in-out infinite alternate}@keyframes cb-tail{from{transform:rotate(-8deg)}to{transform:rotate(10deg)}}' +
      // The lantern pendulum.
      '.cb-pend{--a:11deg;--na:-11deg;animation:cb-pend 4.2s ease-in-out infinite alternate}' +
      '@keyframes cb-pend{from{transform:rotate(var(--na))}to{transform:rotate(var(--a))}}' +
      '.st-tool .cb-pend{--a:17deg;--na:-17deg;animation-duration:1.5s}' +
      '.cb-fl{animation:cb-fl 2.4s ease-in-out infinite alternate}@keyframes cb-fl{from{opacity:.75}to{opacity:1}}' +
      // The chart unrolls while Claude reads.
      '.cb-map{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-read .cb-map{animation:cb-unroll 1.3s ease-out both}@keyframes cb-unroll{to{transform:scaleY(1)}}' +
      '.cb-route{stroke-dasharray:6 6;animation:cb-march 1.4s linear infinite}@keyframes cb-march{to{stroke-dashoffset:-12}}' +
      // The compass.
      '.cb-needle{transform-box:view-box}' +
      '.cb-wob{animation:cb-wob 4s ease-in-out infinite alternate}@keyframes cb-wob{from{transform:rotate(-14deg)}to{transform:rotate(18deg)}}' +
      '.cb-seek{animation:cb-wob 1.6s ease-in-out infinite alternate}' +
      '.cb-spin{animation:mv-spin 1.1s linear infinite}' +
      // The spyglass glint and the gulls.
      '.cb-gl{opacity:0}.st-web .cb-gl{animation:cb-glint 1.3s ease-out infinite}' +
      '@keyframes cb-glint{0%{opacity:0;transform:translate(471px,306px) scale(.3)}25%{opacity:1;transform:translate(471px,306px) scale(1)}60%,100%{opacity:0;transform:translate(471px,306px) scale(.5)}}' +
      '.cb-bird{opacity:0}.st-web .cb-bird{animation:cb-bird 9s linear infinite}' +
      '@keyframes cb-bird{0%{opacity:0;transform:translateX(0)}8%,90%{opacity:.85}100%{opacity:0;transform:translateX(-1900px)}}' +
      '.cb-wing{transform-box:fill-box;transform-origin:50% 100%;animation:cb-wing .5s ease-in-out infinite alternate}@keyframes cb-wing{to{transform:scaleY(.35)}}' +
      // The broadside: a soft muzzle glow, smoke, the ball's arc, the splash. Each cannon repeats every 4.5 s.
      '.cb-mf,.cb-sm,.cb-bx,.cb-spl{opacity:0}' +
      '.st-run .cb-mf{animation:cb-mf 4.5s ease-out infinite}@keyframes cb-mf{0%,3%{opacity:0}5%{opacity:.6}14%,100%{opacity:0}}' +
      '.st-run .cb-sm{transform-box:fill-box;transform-origin:center;animation:cb-sm 4.5s ease-out infinite}' +
      '@keyframes cb-sm{0%,4%{opacity:0;transform:translate(0,0) scale(.4)}9%{opacity:.5}50%,100%{opacity:0;transform:translate(var(--dx),-70px) scale(2.8)}}' +
      '.st-run .cb-bx{animation:cb-bx 4.5s linear infinite}' +
      '@keyframes cb-bx{0%,4%{opacity:0;transform:translateX(0)}5%{opacity:1}37%{opacity:1;transform:translateX(var(--dx))}38%,100%{opacity:0;transform:translateX(var(--dx))}}' +
      '.st-run .cb-by{animation:cb-by 4.5s linear infinite}' +
      '@keyframes cb-by{0%,4%{transform:translateY(0);animation-timing-function:cubic-bezier(.3,.6,.5,1)}20%{transform:translateY(var(--h));animation-timing-function:cubic-bezier(.5,0,.8,.5)}37%,100%{transform:translateY(var(--g))}}' +
      '.st-run .cb-bs{transform-box:fill-box;transform-origin:center;animation:cb-bs 4.5s linear infinite}@keyframes cb-bs{0%,4%{transform:scale(1)}37%,100%{transform:scale(.3)}}' +
      '.st-run .cb-spl{animation:cb-spl 4.5s ease-out infinite}@keyframes cb-spl{0%,37%{opacity:0;transform:scale(.2)}40%{opacity:.85}62%,100%{opacity:0;transform:scale(1.9)}}' +
      '.cb-dp{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .cb-rec{animation:cb-rec 4.5s ease-out infinite}@keyframes cb-rec{0%,4%{transform:translate(0,0)}6%{transform:translate(9px,3px)}20%,100%{transform:translate(0,0)}}' +
      // The wave that comes over the rail.
      '.cb-crash{opacity:0}.st-error .cb-crash{animation:cb-crash 3.4s ease-out both}' +
      '@keyframes cb-crash{0%{opacity:0;transform:translate(-460px,520px)}20%{opacity:.6}42%{opacity:.6;transform:translate(0,40px)}58%{opacity:.55;transform:translate(0,0)}100%{opacity:0;transform:translate(60px,200px)}}',
    scenery:
      '<defs><linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060a"/><stop offset=".5" stop-color="#08121a"/><stop offset="1" stop-color="#0f2530"/></linearGradient>' +
      '<radialGradient id="cb-lg"><stop offset="0" stop-color="#bcd8ff" stop-opacity=".45"/><stop offset="1" stop-color="#bcd8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cb-mf"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset=".35" stop-color="#ffb347" stop-opacity=".4"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cb-mh"><stop offset="0" stop-color="#dfeaee" stop-opacity=".3"/><stop offset="1" stop-color="#dfeaee" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="cb-bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8f0" stop-opacity=".26"/><stop offset="1" stop-color="#cfe8f0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cb-cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a4a56"/><stop offset="1" stop-color="#0a222b"/></linearGradient>' +
      '<linearGradient id="cb-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7f8f" stop-opacity="0"/><stop offset="1" stop-color="#2f7f8f" stop-opacity=".22"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#cb-sky)"/><rect y="380" width="1600" height="170" fill="url(#cb-hz)"/>' +
      '<g class="cb-moon"><circle cx="780" cy="120" r="150" fill="url(#cb-mh)"/><circle cx="780" cy="120" r="42" fill="#dfeaee" fill-opacity=".6"/></g>' +
      '<path class="cb-beam" d="M755 150L805 150L1180 960L400 960Z" fill="url(#cb-bm)"/>' +
      `<g class="cb-cl">${clouds(-1)}</g><g class="cb-cl cb-cl2">${clouds(1)}</g>` +
      '<g class="cb-lt"><circle cx="340" cy="170" r="210" fill="url(#cb-lg)"/>' +
      '<path d="M360 60l-16 70l18 6l-20 80l14 4l-22 70" fill="none" stroke="#e6f2ff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/></g>' +
      '<g class="cb-lt cb-lt2"><circle cx="1280" cy="150" r="190" fill="url(#cb-lg)"/>' +
      '<path d="M1300 40l-14 60l16 6l-18 70l12 4l-18 60" fill="none" stroke="#e6f2ff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/></g>' +
      '<g class="cb-rock"><g class="mv-b">' +
      '<rect y="540" width="1600" height="700" fill="#0a1c26"/>' +
      `<g class="cb-ship"><g transform="translate(250 538) scale(.9)">${ship()}</g></g>` +
      swells +
      glints +
      // The rail, the balusters and the deck.
      '<g fill="#1a130d" stroke="#2f2418" stroke-width="2"><rect x="-20" y="804" width="1720" height="18" rx="4"/><rect x="-20" y="934" width="1720" height="14"/>' +
      `${balusters}</g>` +
      '<path d="M-20 806H1700" stroke="#4a3622" stroke-opacity=".6" stroke-width="2"/>' +
      '<rect x="-20" y="948" width="1720" height="300" fill="#0f0b08"/>' +
      planks +
      cannon(190, 872, 18, 0, [296, 566], 300, 1) +
      cannon(440, 905, 14, -2.25, [176, 584], 260, 2) +
      `</g></g><g class="mv-r">` +
      // The mast, its two torn sails and the rigging, at the far right.
      '<rect x="1432" y="-20" width="22" height="1100" fill="#120d09"/><rect x="1230" y="76" width="380" height="11" rx="4" fill="#1a130d"/><rect x="1270" y="438" width="340" height="11" rx="4" fill="#1a130d"/>' +
      sail('M1250 88H1596V330L1566 362L1546 332L1506 374L1476 336L1426 382L1396 330L1346 368L1306 322L1270 352Z', 0) +
      sail('M1290 450H1596V596L1560 630L1538 598L1494 640L1464 600L1410 636L1370 596L1326 624Z', -1.7) +
      '<g stroke="#0c1318" stroke-width="2.4"><path d="M1443 -10L1090 830M1443 -10L1250 830M1443 440L1180 830"/></g>' +
      '<path d="M1443 -20L1520 -12L1500 8L1520 28L1443 24Z" fill="#05090c"/></g>' +
      `<g class="cb-rock"><g class="mv-b"><g class="cb-crash"><path d="M-200 1200V760C-120 620 80 470 320 500C480 520 520 610 650 650C800 570 1000 530 1200 610C1350 670 1500 650 1800 710V1200Z" fill="url(#cb-cw)"/>` +
      '<path d="M-120 650C0 560 140 500 320 500C480 520 520 610 650 650C800 570 1000 530 1200 610" fill="none" stroke="#cfe6ec" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>' +
      `${spray}</g></g></g>` +
      `<g class="cb-rainw">${rain({ seed: 4, count: 52, length: [22, 42], slant: 260, seconds: 0.9, stroke: '#9fc3cf', opacity: 0.16 })}` +
      `${rain({ seed: 5, count: 28, length: [40, 72], slant: 300, seconds: 0.6, stroke: '#cfe6ec', opacity: 0.13 })}</g>` +
      bird(1750, 330, 1.2, 0) +
      bird(1820, 372, 0.9, 0.6) +
      bird(1900, 310, 1, 1.4) +
      bird(1700, 420, 0.8, 2),
    nook:
      '<defs><radialGradient id="cb-lantern"><stop offset="0" stop-color="#ffd04d" stop-opacity=".36"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".12"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>' +
      // The lantern on its pendulum, with the beam it hangs from.
      '<rect x="200" y="-512" width="220" height="12" rx="4" fill="#120d09"/>' +
      '<g transform="translate(300 -500)"><g class="cb-pend"><path d="M0 0V210" stroke="#1a130d" stroke-width="3"/>' +
      '<g class="cb-fl"><circle cx="0" cy="248" r="190" fill="url(#cb-lantern)"/></g>' +
      `<path d="M-14 210H14L18 222H-18Z M-18 222H18V272H-18Z M-18 272H18L12 280H-12Z" fill="#0b0f12" stroke="${BRASS}" stroke-width="2"/>` +
      `<path d="M-13 226H13V268H-13Z" fill="${GOLD}" fill-opacity=".85"/><path d="M0 232Q6 246 0 262Q-6 246 0 232Z" fill="#fff6d0"/></g></g>` +
      // The chart on its roller.
      '<path d="M252 14V-30M360 14V-30" stroke="#120d09" stroke-width="3"/>' +
      `<g class="cb-map"><rect x="246" y="22" width="122" height="176" fill="${PAPER}" fill-opacity=".9" stroke="#9a8a62" stroke-width="2"/>` +
      '<path d="M258 60C276 40 300 56 320 42C340 30 352 44 360 36M258 120C280 100 296 124 316 108C336 96 346 112 360 100M270 190C290 176 310 188 330 172" fill="none" stroke="#7a6a44" stroke-width="2"/>' +
      `<path class="cb-route" d="${mapRoute}" fill="none" stroke="#8a2e24" stroke-width="2.4"/><path d="M342 62L356 76M356 62L342 76" stroke="#8a2e24" stroke-width="3.2"/>` +
      '<circle cx="272" cy="176" r="11" fill="none" stroke="#7a6a44" stroke-width="1.6"/><path d="M272 164V188M260 176H284" stroke="#7a6a44" stroke-width="1.6"/></g>' +
      `<rect x="240" y="14" width="134" height="12" rx="6" fill="${PAPER}" fill-opacity=".85" stroke="#9a8a62"/>`,
  }
}
