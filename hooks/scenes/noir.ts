import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Noir: a private eye's office on a rainy night, shot in black and white. Through the venetian blinds on the left the
// El trestle crosses the street, a lone streetlamp lights a man in a trench coat, and a dark sign hangs on the
// building across the way; the blinds throw bars of light across the back wall. Claude, the one splash of colour in
// the picture, types under a hanging bulb in a fedora. A command run sends a car's headlights sweeping the bars across
// the room and an El train rumbling past; an error pops the bulb; done stops the rain and lights the sign.
const SILVER = '#e6e6e6'
const DESK = '#1a1a1a'
const DESK_EDGE = '#2e2e2e'

/** The sign's invented marks, each drawn around its own centre in a 28-unit box. */
const GLYPHS = [
  'M-12 12H-5V3H3V-6H12V4M-9 -8h.1',
  'M-12 6A12 12 0 0 1 12 6M0 -6V-14M-6 13h.1M6 13h.1',
  'M-12 8Q-6 2 0 8Q6 14 12 8M0 -12L7 -1H-7Z',
  'M0 -12L10 -1L0 10L-10 -1ZM0 10V15M-9 -15H9',
  'M-12 -11Q0 -4 12 -11M-6 0Q2 6 10 -2l2 4M-12 11Q-2 17 6 11Q10 8 12 12',
]

const glyphs = (at: (i: number) => string): string => GLYPHS.map((d, i) => `<path transform="${at(i)}" d="${d}"/>`).join('')

/** Bars of light the blinds throw: each falls `slope` per unit across and widens with distance; `pad` fattens them. */
function bars(x0: number, x1: number, y0: number, count: number, gap: number, slope: number, pad = 0): string {
  const span = x1 - x0

  return Array.from({ length: count }, (_, i) => {
    const y = y0 + i * gap
    const far = y + span * slope

    return `M${x0} ${y - pad}L${x1} ${f(far - pad * 1.8)}V${f(far + 30 + pad * 1.8)}L${x0} ${y + 16 + pad}Z`
  }).join('')
}

/** The city behind the street: far blocks with a few lit windows, a water tower, the near facade with its fire escape. */
function city(): string {
  const next = random(1946)
  let blocks = ''
  let lit = ''
  let x = 52

  while (x < 300) {
    const w = 34 + next() * 46
    const top = x < 60 ? 252 : 196 + next() * 90

    blocks += `M${f(x)} 720V${f(top)}H${f(x + w)}V720Z`
    for (let y = top + 14; y < 690; y += 17) {
      for (let c = x + 6; c < x + w - 8; c += 11) {
        if (next() < 0.07) {
          lit += `M${f(c)} ${f(y)}h4v6h-4Z`
        }
      }
    }
    x += w + 2
  }

  let dark = ''
  let dim = ''

  for (const cx of [298, 380, 404]) {
    for (let r = 0; r < 12; r += 1) {
      const pane = `M${cx} ${190 + r * 42}h12v22h-12Z`

      if (next() < 0.14) {
        dim += pane
      } else {
        dark += pane
      }
    }
  }
  const near = `<path d="${dark}" fill="#141414"/><path d="${dim}" fill="#4a4a4a"/>`
  const escape = [236, 336, 436, 536, 636]
  const heavy = escape.map(y => `M372 ${y}H422`).join('') + escape.slice(0, -1).map(y => `M378 ${y}L416 ${y + 100}`).join('')
  const light = escape.map(y => `M372 ${y - 14}H422M372 ${y - 14}V${y}M397 ${y - 14}V${y}M422 ${y - 14}V${y}`).join('')

  return (
    `<path d="${blocks}" fill="#0a0a0a"/><path d="${lit}" fill="#9a9a9a" fill-opacity=".55"/>` +
    // The water tower on the first roof.
    '<path d="M60 196H112V236H60ZM56 196L86 176L116 196Z" fill="#0b0b0b"/><path d="M64 236L60 252M108 236L112 252M86 236V252" stroke="#0b0b0b" stroke-width="3"/>' +
    '<path d="M56 196L86 176L116 196" fill="none" stroke="#2a2a2a" stroke-width="1.5"/>' +
    // The building across the street.
    '<rect x="290" y="168" width="134" height="552" fill="#0a0a0a"/><rect x="286" y="160" width="140" height="10" fill="#181818"/>' +
    near +
    `<g fill="none" stroke="#1e1e1e" stroke-linecap="round"><path d="${heavy}" stroke-width="3"/><path d="${light}" stroke-width="1.5"/></g>`
  )
}

/** The sign across the street: dark tubes, and over them the lit layer that comes on when the case is closed. */
function sign(): string {
  // Placed so the blind slats nick the marks' tips rather than splitting them through their widest part.
  const at = (i: number) => `translate(344 ${441 + i * 56})`

  return (
    '<path d="M370 410H392M370 672H392" stroke="#161616" stroke-width="4"/>' +
    '<rect x="318" y="400" width="52" height="288" rx="4" fill="#0e0e0e" stroke="#262626" stroke-width="2"/>' +
    `<g fill="none" stroke="#333333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${glyphs(at)}<rect x="323" y="405" width="42" height="278" rx="3"/></g>` +
    '<g class="nr-lit"><ellipse cx="344" cy="544" rx="96" ry="200" fill="url(#nr-sg)"/>' +
    `<g fill="none" stroke="${SILVER}" stroke-linecap="round" stroke-linejoin="round"><g stroke-opacity=".22" stroke-width="11">${glyphs(at)}</g>` +
    `<g stroke="#f6f6f6" stroke-width="3.4">${glyphs(at)}<rect x="323" y="405" width="42" height="278" rx="3"/></g></g></g>`
  )
}

/** An El train of three cars running right on the trestle, its nose at x 0. */
function train(): string {
  const cars = [0, 1, 2]
    .map(c => {
      const x = -300 - c * 312
      const win = Array.from({ length: 9 }, (_, k) => `M${x + 14 + k * 31} 244h22v22h-22Z`).join('')

      return (
        `<rect x="${x - 10}" y="226" width="320" height="56" rx="20" fill="#e6e6e6" fill-opacity=".08"/>` +
        `<rect x="${x}" y="234" width="300" height="56" rx="5" fill="#080808" stroke="#4a4a4a" stroke-width="1.5"/>` +
        `<path d="M${x + 6} 235Q${x + 150} 220 ${x + 294} 235Z" fill="#080808" stroke="#4a4a4a" stroke-width="1.5"/>` +
        `<path d="${win}" fill="#ececec" fill-opacity=".78"/>` +
        `<g fill="#050505"><circle cx="${x + 46}" cy="293" r="7"/><circle cx="${x + 254}" cy="293" r="7"/></g>`
      )
    })
    .join('')

  return (
    cars +
    '<path d="M0 254L200 222V306L0 272Z" fill="url(#nr-tb)"/>' +
    '<circle cx="-2" cy="262" r="22" fill="url(#nr-ha)"/><circle cx="-2" cy="262" r="5" fill="#f6f6f6"/>'
  )
}

/** A rounded sedan heading left with its headlight beam, wheels on y 0, nose at x 0. */
function car(): string {
  return (
    '<path d="M4 -22L-240 -64V30L4 -12Z" fill="url(#nr-hb)"/><ellipse cx="-96" cy="-1" rx="104" ry="8" fill="url(#nr-hd)"/>' +
    '<path d="M0 -12C0 -22 6 -27 20 -28L40 -30C48 -44 62 -50 82 -50H102C116 -50 124 -42 130 -30L148 -28C158 -26 160 -18 160 -10V-2H0Z" fill="#060606" stroke="#6a6a6a" stroke-width="1.6"/>' +
    '<path d="M50 -31C56 -42 64 -45 80 -45V-31ZM86 -45H102C112 -45 118 -40 122 -31H86Z" fill="#262626"/>' +
    '<g fill="#050505" stroke="#2e2e2e" stroke-width="1.5"><circle cx="30" cy="-2" r="10"/><circle cx="128" cy="-2" r="10"/></g>' +
    '<circle cx="4" cy="-17" r="16" fill="url(#nr-ha)"/><circle cx="4" cy="-17" r="4" fill="#f6f6f6"/><circle cx="158" cy="-16" r="2.4" fill="#8a8a8a"/>'
  )
}

/** The man under the streetlamp: fedora, trench coat with the collar up, a rim of lamplight on the near side. Feet at 0. */
function stranger(): string {
  return (
    '<path d="M-10 0L118 7L120 2L10 -3Z" fill="#000" fill-opacity=".6"/>' +
    '<path d="M-9 -152H9L11 -141H-11ZM-19 -141H19L16 -137H-16ZM-7 -137H7V-127H-7ZM-12 -128H12L22 -121L24 -88L27 -46L30 -38H-30L-27 -46L-24 -88L-22 -121Z' +
    'M-13 -38H-4V-3H-13ZM4 -38H13V-3H4ZM-17 -4H-3V0H-17ZM3 -4H15L17 0H3Z" fill="#030303"/>' +
    '<path d="M-22 -121L-24 -88L-27 -46L-30 -38M-19 -141H-8M-11 -141L-9 -152" fill="none" stroke="#c8c8c8" stroke-opacity=".55" stroke-width="1.6"/>'
  )
}

/** The typewriter Claude works on: round keys, a platen, and a sheet that glows as its screen. The carriage steps. */
function device(light: string, _activity: Activity): string {
  const keys = [0, 1, 2]
    .map(row => Array.from({ length: 7 }, (_, k) => `<circle cx="${258 + row * 4 + k * 12}" cy="${306 + row * 8}" r="3"/>`).join(''))
    .join('')

  return (
    '<path d="M240 330L250 300H350L362 330Z" fill="#262626" stroke="#3c3c3c" stroke-width="1.5"/>' +
    '<path d="M268 300Q300 290 332 300" fill="none" stroke="#3c3c3c" stroke-width="3"/>' +
    `<g fill="#0a0a0a" stroke="${light}" stroke-opacity=".6" stroke-width="1.4">${keys}</g>` +
    '<rect x="244" y="326" width="114" height="4" fill="#0c0c0c"/>' +
    '<g class="nr-crg">' +
    `<rect x="262" y="206" width="80" height="78" fill="${light}"/>` +
    '<path d="M270 218H322M270 228H334M270 238H312M270 248H328M270 258H300" stroke="#050505" stroke-opacity=".5" stroke-width="2.4"/>' +
    '<rect x="258" y="268" width="88" height="3" fill="#5a5a5a"/>' +
    '<rect x="246" y="280" width="112" height="14" rx="7" fill="#141414" stroke="#3c3c3c" stroke-width="1.5"/>' +
    '<circle cx="242" cy="287" r="6" fill="#2c2c2c"/><circle cx="362" cy="287" r="6" fill="#2c2c2c"/>' +
    '<path d="M250 283L238 272" stroke="#9a9a9a" stroke-width="3" stroke-linecap="round"/></g>'
  )
}

export function noirWorld(): World {
  const next = random(40)
  const grain = Array.from({ length: 32 }, (_, i) => {
    const size = 0.8 + next() * 1.6

    return `<rect x="${f(next() * 160)}" y="${f(next() * 160)}" width="${f(size)}" height="${f(size)}" fill="${i % 3 ? '#fff' : '#000'}" fill-opacity="${f(i % 3 ? 0.08 + next() * 0.1 : 0.3)}"/>`
  }).join('')
  const slats = Array.from({ length: 33 }, (_, i) => `<rect class="nr-sl" x="58" y="${88 + i * 22}" width="364" height="6"/>`).join('')
  const drips = Array.from(
    { length: 7 },
    (_, i) => `<path class="nr-drip" style="animation-delay:${f(-i * 0.55)}s" d="M${f(80 + next() * 320)} ${f(100 + next() * 520)}v${f(10 + next() * 14)}" stroke="#c8c8c8" stroke-width="1.6" stroke-linecap="round"/>`,
  ).join('')
  const panels = Array.from({ length: 9 }, (_, i) => `M${-10 + i * 190} 744h160v156h-160Z`).join('')
  const boards = Array.from({ length: 4 }, (_, i) => `M-20 ${948 + i * 18}H1620`).join('')
  const fins = Array.from({ length: 14 }, (_, i) => `M${128 + i * 16} 868v56h10v-56Z`).join('')
  const shards = [-26, -10, 6, 18, 30]
    .map((dx, i) => `<path class="nr-sh" style="--dx:${dx}px;animation-delay:${f(0.5 + i * 0.04)}s" d="M${298 + i} 58l4 -5l3 6Z" fill="#d8d8d8"/>`)
    .join('')
  const haze = [
    [260, 180, 120, 26, 0],
    [330, 120, 90, 20, -5],
    [210, 250, 100, 18, -9],
  ]
    .map(([cx, cy, rx, ry, d]) => `<ellipse class="nr-haze" style="animation-delay:${d}s" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#d0d0d0" fill-opacity=".05"/>`)
    .join('')
  const clouds = [
    [120, 132, 96, 26],
    [270, 112, 110, 28],
    [390, 160, 84, 22],
    [170, 206, 80, 18],
  ]
    .map(([cx, cy, rx, ry], i) => `<ellipse class="nr-cl${i % 2 ? ' nr-cl2' : ''}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1d1d1d" fill-opacity=".9"/>`)
    .join('')
  const wall = bars(444, 1240, 30, 16, 46, 0.3)
  // A man in a fedora: pinched crown, a brim much wider than the head, the head, the neck, sloped shoulders of a coat.
  const visitor =
    'M1298 434L1301 410Q1308 404 1316 408Q1324 404 1331 410L1334 434ZM1274 438Q1316 425 1358 438Q1316 447 1274 438Z' +
    'M1301 455a15 17 0 1 0 30 0a15 17 0 1 0 -30 0ZM1309 466H1323V482H1309Z' +
    'M1306 474L1294 486Q1272 494 1262 512L1254 566H1378L1370 512Q1360 494 1338 486L1326 474Z'
  const doorMarks = GLYPHS.map((d, i) => `<path transform="translate(${1252 + i * 26} ${300 + (i - 2) * (i - 2) * 4}) scale(-.62 .62)" d="${d}"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'typewriter',
      cup: 'none',
      thought: 'smoke',
      ink: '#050505',
      furniture: DESK,
      metal: '#2c2c2c',
      paper: '#d8d8d8',
      light: { idle: '#8f8f8f', work: '#d6d6d6', bright: '#f4f4f4' },
      headTop: 194,
      glowAt: [302, 246],
      device,
      wear: {
        front:
          // A grey felt fedora snapped down at the front, its brim clear above the eyes; a trench coat with the collar up.
          '<path d="M70 352V300L58 286L86 298L100 352Z" fill="#7a7a7a" stroke="#9a9a9a" stroke-width="1"/>' +
          '<path d="M230 352V300L242 286L216 298V330L208 352Z" fill="#7a7a7a" stroke="#9a9a9a" stroke-width="1"/>' +
          '<path d="M70 326H230V352H70Z" fill="#7a7a7a"/><rect x="70" y="332" width="160" height="6" fill="#4a4a4a"/>' +
          '<rect x="116" y="330" width="12" height="10" fill="none" stroke="#a8a8a8" stroke-width="2"/>' +
          '<path d="M86 236L92 204Q96 190 118 192Q150 202 182 192Q204 190 208 204L214 236Z" fill="#4a4a4a" stroke="#5e5e5e" stroke-width="1.5"/>' +
          '<path d="M120 195Q150 206 180 195" fill="none" stroke="#2e2e2e" stroke-width="3"/>' +
          '<path d="M88 222H212L214 236H86Z" fill="#101010"/><path d="M94 222L90 234L100 230Z" fill="#101010"/>' +
          '<path d="M44 238Q60 230 88 232H212Q240 232 262 244Q236 244 212 242H88Q62 242 44 238Z" fill="#3e3e3e" stroke="#5e5e5e" stroke-width="1.5"/>' +
          '<path d="M208 204L214 236M212 233Q240 234 260 243" fill="none" stroke="#a0a0a0" stroke-opacity=".6" stroke-width="2"/>',
      },
      seatArt:
        // A wooden banker's swivel chair.
        '<path d="M54 352V262Q54 250 64 250H70V352Z" fill="#1c1c1c" stroke="#2e2e2e" stroke-width="1.5"/>' +
        '<path d="M92 350H206Q210 350 210 355V362H88V355Q88 350 92 350Z" fill="#242424" stroke="#363636" stroke-width="1.5"/>' +
        '<rect x="145" y="362" width="12" height="44" fill="#141414"/><path d="M134 404H168L162 418H140Z" fill="#1e1e1e"/>' +
        '<path d="M151 418L104 446M151 418L198 446M151 418V448" stroke="#1c1c1c" stroke-width="6" stroke-linecap="round"/>' +
        '<g fill="#0c0c0c" stroke="#2e2e2e"><circle cx="102" cy="450" r="5"/><circle cx="200" cy="450" r="5"/><circle cx="151" cy="451" r="5"/></g>',
      tableArt:
        // A pedestal desk, a stack of case files and a rotary phone.
        `<g fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="1.6"><rect x="160" y="330" width="314" height="14" rx="2"/>` +
        '<rect x="176" y="344" width="16" height="108"/><rect x="352" y="344" width="114" height="108"/><rect x="170" y="450" width="300" height="6"/></g>' +
        '<path d="M352 380H466M352 416H466" stroke="#0c0c0c" stroke-width="2"/>' +
        '<g fill="#6a6a6a"><rect x="400" y="358" width="18" height="4" rx="2"/><rect x="400" y="394" width="18" height="4" rx="2"/><rect x="400" y="430" width="18" height="4" rx="2"/></g>' +
        '<path d="M162 331H472" stroke="#5a5a5a" stroke-opacity=".5"/>' +
        '<path d="M172 330V322H226V330Z" fill="#6e6e6e"/><path d="M174 322V316H222V322ZM196 316V312H210V316Z" fill="#8a8a8a"/>' +
        '<g transform="translate(-14 0)"><path d="M398 330L404 312H458L464 330Z" fill="#0c0c0c" stroke="#3a3a3a" stroke-width="1.5"/>' +
        '<circle cx="431" cy="321" r="7" fill="#1c1c1c" stroke="#6a6a6a" stroke-width="1.4"/><circle cx="431" cy="321" r="2" fill="#6a6a6a"/>' +
        '<path d="M410 312V305M452 312V305" stroke="#3a3a3a" stroke-width="3"/>' +
        '<g class="nr-ring"><path d="M394 304Q392 294 402 294H408L410 300H452L454 294H460Q470 294 468 304L460 306H402Z" fill="#0c0c0c" stroke="#4a4a4a" stroke-width="1.5"/></g>' +
        '<g class="nr-wv" fill="none" stroke="#bdbdbd" stroke-width="2" stroke-linecap="round"><path d="M416 286Q431 276 446 286M408 278Q431 262 454 278"/></g></g>',
    },
    style:
      // Ambient: rain, drips on the glass, a buzzing streetlamp the wall's bars follow, the stranger's coat, film grain.
      '.nr-buzz{animation:nr-buzz 5.3s linear infinite}@keyframes nr-buzz{0%,45%,51%,56%,100%{opacity:1}48%{opacity:.7}54%{opacity:.82}}' +
      // The bars on the wall dim with the lamp, but once and slowly: they cover too much of the picture to flicker.
      '.nr-buzzw{animation:nr-buzzw 5.3s ease-in-out infinite}@keyframes nr-buzzw{0%,42%,56%,100%{opacity:1}49%{opacity:.84}}' +
      '.nr-strip{opacity:.8}' +
      '.nr-fig{transform-box:fill-box;transform-origin:50% 100%;animation:nr-sway 4.4s ease-in-out infinite alternate}@keyframes nr-sway{from{transform:skewX(-.8deg)}to{transform:skewX(.8deg)}}' +
      '.nr-cl{animation:nr-cl 30s ease-in-out infinite alternate}.nr-cl2{animation-direction:alternate-reverse}@keyframes nr-cl{to{transform:translateX(40px)}}' +
      '.nr-drip{opacity:0;animation:nr-drip 3.8s ease-in infinite}@keyframes nr-drip{0%{opacity:0;transform:translateY(0)}12%{opacity:.5}100%{opacity:0;transform:translateY(150px)}}' +
      '.nr-haze{opacity:.6;animation:nr-haze 14s ease-in-out infinite alternate}@keyframes nr-haze{to{transform:translate(40px,-24px)}}' +
      '.st-thinking .nr-haze{opacity:1}' +
      '.nr-swing{--a:1.6deg;--na:-1.6deg;animation:nr-swing 5s ease-in-out infinite alternate}@keyframes nr-swing{from{transform:rotate(var(--na))}to{transform:rotate(var(--a))}}' +
      '.nr-grain{animation:nr-grain .5s steps(1) infinite}@keyframes nr-grain{0%{transform:translate(0,0)}25%{transform:translate(-53px,31px)}50%{transform:translate(-17px,-71px)}75%{transform:translate(-89px,-23px)}}' +
      '.nr-scr{opacity:0;animation:nr-scr 2.9s steps(1) infinite}@keyframes nr-scr{0%{opacity:0;transform:translateX(0)}31%{opacity:1;transform:translateX(0)}36%{opacity:0}66%{opacity:.7;transform:translateX(-90px)}70%{opacity:0}}' +
      '.nr-exp{opacity:0;animation:nr-exp 3.7s ease-in-out infinite}@keyframes nr-exp{0%,100%{opacity:0}20%{opacity:.07}34%{opacity:.02}55%{opacity:.06}74%{opacity:0}}' +
      // The typewriter's carriage steps along and returns; the phone rings while Claude is on the web.
      '@keyframes nr-crg{0%{transform:translateX(0);animation-timing-function:steps(8,end)}84%{transform:translateX(-22px);animation-timing-function:ease-in-out}100%{transform:translateX(0)}}' +
      '.st-responding .nr-crg{animation:nr-crg 3.2s infinite}.st-tool .nr-crg,.st-run .nr-crg,.st-web .nr-crg{animation:nr-crg 1.6s infinite}' +
      '.nr-ring{transform-box:fill-box;transform-origin:center}.st-web .nr-ring{animation:nr-ring .9s linear infinite}' +
      '@keyframes nr-ring{0%,40%,100%{transform:translate(0,0)}5%,15%,25%,35%{transform:translate(0,-3px) rotate(-3deg)}10%,20%,30%{transform:translate(0,-2px) rotate(3deg)}}' +
      '.nr-wv{opacity:0}.st-web .nr-wv{animation:nr-wv .9s ease-out infinite}@keyframes nr-wv{0%{opacity:0}10%{opacity:.8}45%,100%{opacity:0}}' +
      // Tool: a visitor's shadow comes up behind the frosted glass of the door. Web: one walks past it.
      '.nr-vis{opacity:0}.st-tool .nr-vis{animation:nr-vis .7s ease-out .1s both}@keyframes nr-vis{to{opacity:1}}' +
      '.st-web .nr-vis{animation:nr-pass 3.2s ease-in-out infinite}@keyframes nr-pass{0%{opacity:0;transform:translateX(-110px)}20%,80%{opacity:1}100%{opacity:0;transform:translateX(110px)}}' +
      // Run: a car turns past below, its headlights sweep the bars across the room, then the El train rumbles by.
      '.nr-car,.nr-train,.nr-sweep,.nr-tsw{opacity:0}' +
      '.st-run .nr-car{animation:nr-car 6s linear infinite}@keyframes nr-car{0%{opacity:1;transform:translateX(0)}43%{opacity:1;transform:translateX(-640px)}44%,100%{opacity:0;transform:translateX(-640px)}}' +
      '.st-run .nr-sweep{animation:nr-sweep 6s linear infinite}@keyframes nr-sweep{0%{opacity:0;transform:translateX(0)}6%{opacity:1}40%{opacity:1}48%,100%{opacity:0;transform:translateX(1000px)}}' +
      '.st-run .nr-train{animation:nr-train 6s linear infinite}@keyframes nr-train{0%,13%{opacity:0;transform:translateX(0)}14%{opacity:1;transform:translateX(0)}75%{opacity:1;transform:translateX(1310px)}76%,100%{opacity:0;transform:translateX(1310px)}}' +
      '.st-run .nr-tsw{animation:nr-tsw 6s linear infinite}@keyframes nr-tsw{0%,15%{opacity:0;transform:translateX(444px)}20%{opacity:1}70%{opacity:1}76%,100%{opacity:0;transform:translateX(1900px)}}' +
      '.st-run .nr-rum{animation:nr-rum .16s linear .9s infinite}@keyframes nr-rum{0%,100%{transform:translate(0,0)}25%{transform:translate(1.4px,-1px)}50%{transform:translate(-1px,1.2px)}75%{transform:translate(1px,.6px)}}' +
      '.st-run .nr-swing{--a:3.6deg;--na:-3.6deg;animation-duration:1.3s}' +
      // Error: the bulb stutters and pops, the glass falls, the lamp jerks on its cord and the room goes dark.
      '.nr-dark{opacity:0}.st-error .nr-dark{animation:nr-dark 1.1s ease-out .45s both}@keyframes nr-dark{to{opacity:.46}}' +
      '.st-error .nr-bulb{animation:nr-pop 1.2s linear both}@keyframes nr-pop{0%{opacity:1}10%{opacity:.4}20%,36%{opacity:1}40%,100%{opacity:0}}' +
      '.nr-gli,.nr-sh{opacity:0}.nr-gli,.nr-sh{transform-box:fill-box;transform-origin:center}' +
      '.st-error .nr-gli{animation:nr-gli .5s ease-out .46s both}@keyframes nr-gli{0%{opacity:0;transform:scale(.3)}25%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}' +
      '.st-error .nr-sh{animation:nr-sh 1s cubic-bezier(.5,0,1,1) both}@keyframes nr-sh{0%{opacity:.9;transform:translate(0,0) rotate(0)}90%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),262px) rotate(200deg)}}' +
      '.st-error .nr-swing{animation:nr-jolt 3s ease-out both}@keyframes nr-jolt{0%,16%{transform:rotate(0)}22%{transform:rotate(5deg)}36%{transform:rotate(-4deg)}52%{transform:rotate(3deg)}68%{transform:rotate(-2deg)}84%{transform:rotate(1deg)}100%{transform:rotate(0)}}' +
      // Done: the rain stops, the blinds tilt open, the clouds part on the moon, the sign lights and the stranger walks off.
      '.st-done .nr-rain{animation:nr-dry 1.8s ease-out .2s both}@keyframes nr-dry{to{opacity:0}}' +
      '.nr-sl{transform-box:fill-box;transform-origin:center}.st-done .nr-sl{animation:nr-open 1.4s ease-in-out .3s both}@keyframes nr-open{to{transform:scaleY(.3)}}' +
      '.st-done .nr-cl{animation:nr-part 3s ease-out both}.st-done .nr-cl2{animation-name:nr-part2}@keyframes nr-part{to{transform:translateX(-260px)}}@keyframes nr-part2{to{transform:translateX(260px)}}' +
      '.nr-moon{opacity:0}.st-done .nr-moon{animation:nr-show 2.6s ease-out .8s both}@keyframes nr-show{to{opacity:1}}' +
      '.nr-lit{opacity:0}.st-done .nr-lit{animation:nr-lit 1.9s ease-out .5s both}@keyframes nr-lit{0%{opacity:0}30%{opacity:.55}42%{opacity:.25}100%{opacity:1}}' +
      '.st-done .nr-strip{animation:nr-brt 2s ease-out .8s both}@keyframes nr-brt{to{opacity:1}}' +
      '.nr-wide{opacity:0}.st-done .nr-wide{animation:nr-brt 1.6s ease-in-out .4s both}' +
      '.st-done .nr-fig{animation:nr-walk 3.4s linear .6s both}@keyframes nr-walk{0%{transform:translateX(0);opacity:1}80%{opacity:1}100%{transform:translateX(-150px);opacity:0}}',
    scenery:
      '<defs>' +
      '<linearGradient id="nr-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0c0c"/><stop offset=".45" stop-color="#151515"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient>' +
      '<linearGradient id="nr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161616"/><stop offset=".22" stop-color="#282828"/><stop offset=".34" stop-color="#333"/><stop offset=".62" stop-color="#1c1c1c"/><stop offset="1" stop-color="#0e0e0e"/></linearGradient>' +
      '<linearGradient id="nr-cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ececec" stop-opacity=".5"/><stop offset="1" stop-color="#ececec" stop-opacity=".05"/></linearGradient>' +
      '<radialGradient id="nr-ha"><stop offset="0" stop-color="#f2f2f2" stop-opacity=".7"/><stop offset=".3" stop-color="#f2f2f2" stop-opacity=".25"/><stop offset="1" stop-color="#f2f2f2" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nr-po"><stop offset="0" stop-color="#dcdcdc" stop-opacity=".36"/><stop offset="1" stop-color="#dcdcdc" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nr-st" gradientUnits="userSpaceOnUse" x1="444" y1="0" x2="1180" y2="0"><stop offset="0" stop-color="#d6d6d6" stop-opacity=".3"/><stop offset=".45" stop-color="#d6d6d6" stop-opacity=".12"/><stop offset="1" stop-color="#d6d6d6" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="nr-hd"><stop offset="0" stop-color="#f0f0f0" stop-opacity=".32"/><stop offset=".55" stop-color="#f0f0f0" stop-opacity=".12"/><stop offset="1" stop-color="#f0f0f0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nr-hb" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#f0f0f0" stop-opacity=".6"/><stop offset="1" stop-color="#f0f0f0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="nr-tb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0f0f0" stop-opacity=".55"/><stop offset="1" stop-color="#f0f0f0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="nr-tg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6e6e6" stop-opacity="0"/><stop offset=".5" stop-color="#e6e6e6" stop-opacity=".2"/><stop offset="1" stop-color="#e6e6e6" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="nr-bc"><path d="${wall}"/></clipPath>` +
      '<radialGradient id="nr-sg"><stop offset="0" stop-color="#f0f0f0" stop-opacity=".3"/><stop offset=".5" stop-color="#f0f0f0" stop-opacity=".1"/><stop offset="1" stop-color="#f0f0f0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nr-rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6e6e6" stop-opacity=".34"/><stop offset="1" stop-color="#e6e6e6" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="nr-dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset=".5" stop-color="#333"/><stop offset="1" stop-color="#252525"/></linearGradient>' +
      '<linearGradient id="nr-slg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#303030"/><stop offset=".3" stop-color="#0f0f0f"/><stop offset="1" stop-color="#090909"/></linearGradient>' +
      '<radialGradient id="nr-vg" cx=".55" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>' +
      `<pattern id="nr-gr" width="160" height="160" patternUnits="userSpaceOnUse">${grain}</pattern>` +
      '<clipPath id="nr-wc"><rect x="60" y="80" width="360" height="720"/></clipPath>' +
      '<clipPath id="nr-cc"><path d="M180 494H196L320 800H70Z"/></clipPath>' +
      '<clipPath id="nr-wl"><rect x="444" y="0" width="1200" height="1000"/></clipPath>' +
      '<clipPath id="nr-gc"><rect x="1236" y="176" width="136" height="384"/></clipPath>' +
      '</defs>' +
      // The back wall, the ceiling's moulding, the bars of light the blinds throw on it.
      '<rect width="1600" height="1000" fill="url(#nr-wall)"/>' +
      '<rect width="1600" height="18" fill="#090909"/><path d="M0 18H1600" stroke="#1e1e1e" stroke-width="2"/>' +
      `<g class="nr-buzzw"><path class="nr-strip" d="${wall}" fill="url(#nr-st)"/><path class="nr-wide" d="${bars(444, 1240, 30, 16, 46, 0.3, 5)}" fill="url(#nr-st)"/></g>` +
      '<g clip-path="url(#nr-bc)"><g class="nr-tsw"><rect x="-640" y="0" width="640" height="1000" fill="url(#nr-tg)"/></g></g>' +
      `<g clip-path="url(#nr-wl)"><g class="nr-sweep"><path d="${bars(100, 820, 40, 16, 46, 0.3)}" fill="url(#nr-hd)"/></g></g>` +
      // The wainscot, the radiator under the window, the floor.
      '<g class="mv-b"><rect x="-20" y="706" width="1640" height="10" fill="#1a1a1a"/><path d="M-20 706H1620" stroke="#2c2c2c" stroke-width="1.5"/>' +
      '<rect x="-20" y="716" width="1640" height="208" fill="#0d0d0d"/>' +
      `<path d="${panels}" fill="none" stroke="#181818" stroke-width="3"/>` +
      `<path d="${fins}" fill="#0a0a0a" stroke="#1e1e1e"/><rect x="120" y="924" width="236" height="6" fill="#0a0a0a"/>` +
      '<rect x="-20" y="922" width="1640" height="14" fill="#080808"/><rect x="-20" y="936" width="1640" height="80" fill="#070707"/>' +
      `<path d="${boards}" stroke="#111" stroke-width="1.5"/></g>` +
      // The office door at the right, its frosted glass lit from the hall, the name painted backwards on it.
      '<g class="mv-r"><g class="mv-b">' +
      '<rect x="1204" y="140" width="200" height="800" fill="#0d0d0d" stroke="#1f1f1f" stroke-width="6"/>' +
      '<rect x="1216" y="152" width="176" height="782" fill="#121212"/>' +
      '<rect x="1236" y="176" width="136" height="384" fill="url(#nr-dg)" stroke="#0a0a0a" stroke-width="4"/>' +
      `<g fill="none" stroke="#0a0a0a" stroke-opacity=".75" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">${doorMarks}</g>` +
      '<path d="M1266 352h22M1296 352h16M1320 352h22" stroke="#0a0a0a" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
      `<g clip-path="url(#nr-gc)"><g class="nr-vis"><g opacity=".4"><path d="${visitor}" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="12" stroke-linejoin="round"/></g><path d="${visitor}" fill="#050505" fill-opacity=".6"/></g></g>` +
      '<path d="M1236 604h136v130h-136ZM1236 760h136v150h-136Z" fill="none" stroke="#0a0a0a" stroke-width="4"/>' +
      '<circle cx="1382" cy="640" r="7" fill="#2a2a2a" stroke="#4a4a4a" stroke-width="1.5"/>' +
      '<rect x="1218" y="930" width="172" height="4" fill="#bdbdbd" fill-opacity=".5"/></g></g>' +
      // The window: the view, the blinds over it, the casing. It rattles while the train goes by.
      '<g class="nr-rum"><g clip-path="url(#nr-wc)">' +
      '<rect x="60" y="80" width="360" height="720" fill="url(#nr-sky)"/>' +
      '<g class="nr-moon"><circle cx="130" cy="150" r="80" fill="url(#nr-ha)" opacity=".45"/><circle cx="130" cy="150" r="20" fill="#d6d6d6" fill-opacity=".7"/></g>' +
      clouds +
      city() +
      sign() +
      '<path d="M94 350H106V720H94ZM268 350H280V720H268Z" fill="#090909"/>' +
      `<g transform="translate(40 0)"><g class="nr-train">${train()}</g></g>` +
      '<rect x="40" y="298" width="400" height="16" fill="#060606"/><path d="M40 298H440" stroke="#3a3a3a" stroke-opacity=".7" stroke-width="1.5"/>' +
      `<path d="${Array.from({ length: 20 }, (_, i) => `M${40 + i * 20} 314L${50 + i * 20} 338L${60 + i * 20} 314`).join('')}" fill="none" stroke="#050505" stroke-width="3.4"/>` +
      '<rect x="40" y="336" width="400" height="6" fill="#0a0a0a"/>' +
      // The street: far kerb, wet road, near pavement.
      '<rect x="60" y="706" width="360" height="14" fill="#151515"/><rect x="60" y="720" width="360" height="54" fill="#0c0c0c"/>' +
      '<path d="M70 742H140M260 750H330M150 762H230" stroke="#4a4a4a" stroke-opacity=".5" stroke-width="2"/>' +
      '<rect class="nr-lit" x="328" y="722" width="32" height="52" fill="url(#nr-rf)"/>' +
      `<g transform="translate(470 770) scale(1.22)"><g class="nr-car">${car()}</g></g>` +
      '<rect x="60" y="774" width="360" height="5" fill="#2a2a2a"/><rect x="60" y="779" width="360" height="21" fill="#141414"/>' +
      // The streetlamp, its cone of light and the rain caught in it, the stranger standing under it.
      '<g class="nr-buzz"><path d="M180 494H196L320 800H70Z" fill="url(#nr-cg)"/><circle cx="188" cy="484" r="84" fill="url(#nr-ha)"/>' +
      '<ellipse cx="200" cy="790" rx="130" ry="12" fill="url(#nr-po)"/><rect x="176" y="722" width="26" height="52" fill="url(#nr-rf)"/></g>' +
      '<path d="M184 798V500H192V798ZM176 798H200L196 782H180Z" fill="#070707"/>' +
      '<path d="M176 470H200L188 458ZM180 496H196V502H180Z" fill="#0a0a0a"/><path d="M178 472H198L196 496H180Z" fill="#f0f0f0" fill-opacity=".9"/>' +
      `<g transform="translate(230 796)"><g class="nr-fig">${stranger()}</g></g>` +
      '<g class="nr-rain">' +
      rain({ seed: 41, count: 36, length: [26, 44], slant: 120, seconds: 1, stroke: '#9a9a9a', opacity: 0.2, box: [60, 80, 360, 720] }) +
      `<g clip-path="url(#nr-cc)">${rain({ seed: 42, count: 22, length: [18, 34], slant: 120, seconds: 0.8, stroke: '#f0f0f0', opacity: 0.55, box: [70, 470, 260, 330] })}</g>` +
      drips +
      '</g></g>' +
      // The blinds, tilted open: headrail, slats, ladder tapes, the pull cord.
      '<rect x="54" y="80" width="372" height="10" fill="#1e1e1e"/>' +
      `<g fill="url(#nr-slg)">${slats}</g>` +
      '<path d="M140 90V800M340 90V800" stroke="#0e0e0e" stroke-width="1.5"/>' +
      '<path d="M412 88V520" stroke="#2a2a2a" stroke-width="1.5"/><path d="M409 520h6l2 18h-10Z" fill="#2a2a2a"/>' +
      // The casing, the sash rail, the sill.
      '<path d="M36 56H444V836H36ZM60 80V800H420V80Z" fill="#0c0c0c" fill-rule="evenodd"/>' +
      '<rect x="60" y="80" width="360" height="720" fill="none" stroke="#262626" stroke-width="2"/><rect x="36" y="56" width="408" height="780" fill="none" stroke="#1e1e1e" stroke-width="2"/>' +
      '<rect x="60" y="434" width="360" height="10" fill="#0e0e0e" opacity=".9"/>' +
      '<rect x="22" y="826" width="436" height="16" rx="2" fill="#161616"/><path d="M22 826H458" stroke="#3a3a3a" stroke-width="1.5"/></g>' +
      // The film itself: vignette, grain, a scratch or two, a breathing exposure; the dark after the bulb pops.
      '<rect class="nr-dark" x="-100" y="-100" width="1800" height="1200" fill="#000"/>' +
      '<rect width="1600" height="1000" fill="url(#nr-vg)"/>' +
      '<g class="nr-grain"><rect x="-100" y="-100" width="1800" height="1200" fill="url(#nr-gr)"/></g>' +
      '<g class="nr-scr" stroke="#fff" stroke-opacity=".07" stroke-width="1.2"><path d="M300 0V1000M1290 0V1000"/></g>' +
      '<rect class="nr-exp" width="1600" height="1000" fill="#000"/>',
    nook:
      '<defs><radialGradient id="nr-lg"><stop offset="0" stop-color="#f2f2f2" stop-opacity=".34"/><stop offset=".45" stop-color="#dedede" stop-opacity=".1"/><stop offset="1" stop-color="#dedede" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nr-lc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8e8e8" stop-opacity=".2"/><stop offset="1" stop-color="#e8e8e8" stop-opacity=".02"/></linearGradient></defs>' +
      haze +
      // The bulb on its cord over the desk, in a tin shade.
      '<g transform="translate(300 -580)"><g class="nr-swing"><path d="M0 0V602" stroke="#1c1c1c" stroke-width="3"/>' +
      '<g class="nr-bulb"><path d="M-30 630L-190 910H190L30 630Z" fill="url(#nr-lc)"/><circle cy="634" r="170" fill="url(#nr-lg)"/></g>' +
      '<ellipse cy="636" rx="8" ry="7" fill="#4a4a4a"/><ellipse class="nr-bulb" cy="636" rx="8" ry="7" fill="#f6f6f6"/>' +
      '<path d="M-6 600H6L10 610H-10ZM-10 610H10L36 632H-36Z" fill="#161616" stroke="#3a3a3a" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M-36 632H36" stroke="#8a8a8a" stroke-opacity=".7" stroke-width="2"/></g></g>' +
      '<path class="nr-gli" d="M300 38L304 52L318 56L304 60L300 74L296 60L282 56L296 52Z" fill="#fff"/>' +
      shards,
  }
}
