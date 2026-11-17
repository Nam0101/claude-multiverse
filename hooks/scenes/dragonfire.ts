import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Dragonfire: a wizard in a tower, a spellbook on a lectern beside a crystal ball, and a dragon circling the night
// sky. When a command runs the dragon comes close and breathes a long stream of fire across the sky.
const FIRE = '#ff6a3d'
const MAGIC = '#b07cff'
const WOOD = '#2a1a14'
const BRASS = '#3a2a22'
const BALL = { x: 358, y: 300 }

const WING = 'M2 0C4 -40 -8 -72 -52 -96L-42 -66L-56 -64L-38 -44L-50 -36L-26 -20L-20 0Z'

/** The dragon in profile, facing right, its middle at the origin. Two wings, each flapping between two poses. */
function dragon(withFire: boolean): string {
  const rnd = random(88)
  const burst = Array.from({ length: 14 }, () => {
    const a = rnd() * Math.PI * 2
    const d = 90 + rnd() * 170

    return `<circle class="rl-bu" cx="0" cy="0" r="${f(3 + rnd() * 4)}" fill="${rnd() > 0.5 ? '#ffb347' : FIRE}" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d)}px"/>`
  }).join('')

  return (
    `<g fill="#050304" stroke="#7a4fb0" stroke-opacity=".4" stroke-width="1.6" stroke-linejoin="round">` +
    `<g transform="translate(8 -8)"><path class="rl-wing rl-w2" d="${WING}" fill="#0a0510"/></g>` +
    '<ellipse cx="0" cy="0" rx="42" ry="15"/>' +
    '<path d="M30 -6C50 -14 62 -30 72 -36L98 -30L106 -26L92 -22L98 -17L72 -22C66 -16 56 -2 40 8Z"/>' +
    '<path d="M78 -36L66 -52L88 -38Z"/>' +
    '<path d="M-38 -6C-80 -10 -110 10 -150 4L-170 -8L-160 10C-130 22 -100 26 -66 14C-52 10 -44 6 -38 8Z"/>' +
    '<path d="M-14 12L-8 30L-1 12ZM14 12L22 28L27 12Z"/>' +
    `<g transform="translate(4 -10)"><path class="rl-wing" d="${WING}"/></g></g>` +
    (withFire
      ? '<g transform="translate(104 -24)"><g class="rl-fire">' +
        '<path d="M0 0L1100 -170L1100 190Z" fill="url(#rl-fire)"/><path d="M0 0L860 -60L860 120Z" fill="url(#rl-fire2)"/></g>' +
        `<g transform="translate(700 20)">${burst}</g></g>`
      : '')
  )
}

const RUNES = [
  'M-4 -5L0 5L4 -5M-3 0H3',
  'M-4 -5V5M-4 -5L4 0L-4 3',
  'M0 -6V6M-5 -2L0 -6L5 -2',
  'M-4 -5H4L-4 5H4',
  'M-5 0A5 5 0 1 0 5 0A5 5 0 1 0 -5 0M0 -7V7',
]

function runeRing(light: string, radius: number, count: number, cls: string): string {
  const glyphs = Array.from(
    { length: count },
    (_, i) =>
      `<g transform="rotate(${f((360 / count) * i)}) translate(0 ${-radius})"><path d="${RUNES[i % RUNES.length]}" fill="none" stroke="${light}" stroke-width="1.9" stroke-linecap="round"/></g>`,
  ).join('')

  return (
    `<g transform="translate(${BALL.x} ${BALL.y})"><g class="${cls}">` +
    `<circle r="${radius}" fill="none" stroke="${light}" stroke-opacity=".22" stroke-dasharray="3 6"/>${glyphs}</g></g>`
  )
}

function sparks(light: string, count: number, seed: number, reach: number, seconds: number): string {
  const rnd = random(seed)

  return Array.from({ length: count }, () => {
    const dx = (rnd() - 0.5) * reach * 1.1
    const dy = -(reach * 0.5 + rnd() * reach)

    return (
      `<circle class="rl-sp" cx="${f(BALL.x + (rnd() - 0.5) * 18)}" cy="${f(BALL.y - 14)}" r="${f(1.6 + rnd() * 1.6)}" fill="${light}" ` +
      `style="--dx:${f(dx)}px;--dy:${f(dy)}px;animation-duration:${f(seconds * (0.7 + rnd() * 0.6))}s;animation-delay:${f(-rnd() * seconds)}s"/>`
    )
  }).join('')
}

/** The lectern with the open spellbook and the crystal ball, which is where the light comes from. */
function device(light: string, activity: Activity): string {
  const left = 'M242 296L281 301V260L244 254Z'
  const right = 'M284 301L322 296L320 254L284 260Z'
  const lines = (cls: string) =>
    `<g class="${cls}" stroke="${light}" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".75">` +
    '<path d="M249 266H275M249 274H277M249 282H273M250 290H271M291 264H315M291 272H313M291 280H316M292 288H311"/></g>'
  let fx = ''

  switch (activity) {
    case 'thinking':
      fx = runeRing(light, 44, 5, 'rl-orbit')
      break
    case 'responding':
      fx = ''
      break
    case 'tool':
      fx = sparks(light, 12, 5, 80, 1.1)
      break
    case 'run':
      fx = sparks(light, 8, 9, 90, 1.2) + `<circle class="rl-rp" cx="${BALL.x}" cy="${BALL.y}" r="26" fill="none" stroke="${light}" stroke-width="2.5"/>`
      break
    case 'read':
      fx =
        '<g transform="translate(283 278)">' +
        [0, 0.5, 1].map(d => `<path class="rl-fl" style="animation-delay:${d}s" d="M0 -22L-39 -26V16L0 22Z" fill="#eadcc4" fill-opacity=".92" stroke="#c9b88c"/>`).join('') +
        '</g>'
      break
    case 'web':
      fx =
        `<g transform="translate(${BALL.x} ${BALL.y})"><circle class="rl-spin" r="14" fill="none" stroke="${light}" stroke-width="2.2" stroke-dasharray="7 5"/>` +
        `<ellipse rx="10" ry="4.5" fill="none" stroke="#fff" stroke-opacity=".75"/><circle r="3" fill="${light}"/>` +
        `<circle class="rl-rp rl-rp-in" r="14" fill="none" stroke="${light}" stroke-width="1.6"/></g>`
      break
    case 'error': {
      const rnd = random(31)
      fx =
        '<path d="M350 289L357 299L364 295L368 305" fill="none" stroke="#050304" stroke-width="1.6"/>' +
        Array.from({ length: 8 }, (_, i) => {
          return (
            `<circle class="rl-puff" cx="${f(BALL.x + (rnd() - 0.5) * 20)}" cy="${f(BALL.y - 6)}" r="${f(12 + rnd() * 10)}" fill="${i % 2 ? '#7a3fb0' : '#4c2a78'}" ` +
            `style="--dx:${f((rnd() - 0.5) * 90)}px;animation-delay:${f(i * 0.18)}s"/>`
          )
        }).join('')
      break
    }
    case 'done':
      fx = runeRing(light, 44, 6, 'rl-ringglow') + sparks(light, 9, 17, 120, 2.8)
      break
    default:
      break
  }

  return (
    // The lectern.
    `<path d="M268 311H296L300 323H264Z M250 330H314L308 322H256Z" fill="${WOOD}" stroke="#4a2e22" stroke-width="1"/>` +
    // The book: cover, pages, text.
    `<path d="M238 300L282 306L326 300L328 304L282 311L236 304Z" fill="${BRASS}" stroke="#8a6a3a" stroke-width="1.2"/>` +
    `<path d="${left}M284 301L322 296L320 254L284 260Z" fill="#eadcc4" fill-opacity=".8"/>` +
    `<path d="${left}" fill="${light}" fill-opacity=".1"/><path d="${right}" fill="${light}" fill-opacity=".3"/>` +
    (activity === 'responding' ? `<path class="rl-pgl" d="${left}${right}" fill="${light}"/>` : '') +
    '<path d="M283 259V304" stroke="#6a5538" stroke-width="1.6"/>' +
    (activity === 'responding' ? lines('rl-txt') : lines('')) +
    // The crystal ball on its stand.
    `<path d="M342 330H374L368 320H348Z" fill="${BRASS}" stroke="#8a6a3a" stroke-width="1"/>` +
    `<circle cx="${BALL.x}" cy="${BALL.y}" r="24" fill="${light}" fill-opacity=".22"/>` +
    `<circle cx="${BALL.x}" cy="${BALL.y}" r="18" fill="${light}" fill-opacity=".3"/>` +
    `<circle cx="${BALL.x}" cy="${BALL.y}" r="10" fill="${light}" fill-opacity=".5"/>` +
    `<circle cx="${BALL.x}" cy="${BALL.y}" r="24" fill="none" stroke="${light}" stroke-opacity=".75" stroke-width="2"/>` +
    `<g transform="translate(${BALL.x} ${BALL.y})"><path class="rl-wisp" d="M-12 4C-8 -10 6 -14 12 -2M-6 10C2 2 8 6 9 -4" fill="none" stroke="${light}" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/></g>` +
    `<path d="M345 291A17 17 0 0 1 356 283" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round"/>` +
    fx
  )
}

function stars(next: () => number, count: number, box: [number, number, number, number], color: string): string {
  const [x0, y0, w, h] = box

  return Array.from({ length: count }, () => {
    const tw = next() > 0.62 ? ` class="rl-tw" style="animation-delay:${f(-next() * 5)}s"` : ''

    return `<circle cx="${f(x0 + next() * w)}" cy="${f(y0 + next() * h)}" r="${f(0.5 + next() * 1.3)}" fill="${color}" fill-opacity="${f(0.3 + next() * 0.5)}"${tw}/>`
  }).join('')
}

function castle(): string {
  const merlons = Array.from({ length: 12 }, (_, i) => `M${i * 36 + 4} 644h20v16h-20z`).join('')
  const windows: [number, number, number][] = [
    [80, 450, 0],
    [80, 540, 1.3],
    [210, 530, 2.1],
    [330, 640, 0.7],
    [110, 720, 3.2],
    [350, 740, 1.9],
  ]

  return (
    '<g fill="#07040a" stroke="#2a1624" stroke-width="2" stroke-linejoin="round">' +
    '<path d="M0 660H420V830H0Z"/>' +
    '<path d="M34 810V380H126V810Z"/><path d="M18 384L80 228L142 384Z"/>' +
    '<path d="M176 810V470H244V810Z"/><path d="M164 474L210 372L256 474Z"/>' +
    '<path d="M280 810V560H400V810Z"/>' +
    `<path d="${merlons}M284 542h20v18h-20zM320 542h20v18h-20zM356 542h20v18h-20z" stroke="none"/></g>` +
    '<path d="M80 228V192" stroke="#2a1624" stroke-width="3"/>' +
    `<path class="rl-flag" d="M80 194L116 202L80 212Z" fill="${FIRE}" fill-opacity=".55"/>` +
    '<g fill="#ff9a4a">' +
    windows
      .map(([x, y, d]) => `<path class="rl-win" style="animation-delay:${d}s" transform="translate(${x} ${y})" d="M-6 16V-4A6 6 0 0 1 6 -4V16Z"/>`)
      .join('') +
    '</g>'
  )
}

export function dragonfireWorld(): World {
  const next = random(1337)
  const embers = Array.from({ length: 26 }, () => {
    const x = Math.pow(next(), 1.4) * 1600

    return (
      `<circle class="rl-em" cx="${f(x)}" cy="${f(760 + next() * 260)}" r="${f(1.2 + next() * 2)}" fill="${next() > 0.4 ? '#ff8a4a' : '#ffc27a'}" ` +
      `style="--dx:${f((next() - 0.3) * 160)}px;animation-duration:${f(9 + next() * 8)}s;animation-delay:${f(-next() * 14)}s"/>`
    )
  }).join('')
  const star = (x: number, y: number, s: number, d: number) =>
    `<path class="rl-tw" style="animation-delay:${d}s" transform="translate(${x} ${y}) scale(${s})" d="M0 -6L1.6 -1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6 -1.6Z" fill="#ffe9a8"/>`
  const arch = 'M40 -70V-250A180 180 0 0 1 400 -250V-70Z'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'glass',
      thought: 'orbs',
      ink: '#050304',
      furniture: WOOD,
      metal: BRASS,
      paper: '#eadcc4',
      light: { idle: '#7a4fb0', work: MAGIC, bright: '#e6d4ff' },
      headTop: 226,
      glowAt: [BALL.x, BALL.y],
      device,
      wear: {
        behind: '<path d="M62 262L38 356H246L226 262Z" fill="#241438"/><path d="M62 262L38 356H70Z" fill="#150a24"/>',
        front:
          '<ellipse cx="150" cy="236" rx="102" ry="11" fill="#2a1850"/><path d="M52 236Q150 224 248 236" fill="none" stroke="#4a2e8a" stroke-width="2"/>' +
          '<path d="M92 232C100 178 130 118 172 76C186 62 204 66 212 80C196 78 192 92 198 110C206 150 212 190 212 232Z" fill="#34205f"/>' +
          '<path d="M92 232C100 178 130 118 172 76C168 130 152 190 150 232Z" fill="#1e1140" fill-opacity=".7"/>' +
          `<path d="M93 226C120 222 190 222 212 226V213C190 209 120 209 96 214Z" fill="${MAGIC}" fill-opacity=".85"/><rect x="146" y="211" width="12" height="14" fill="#ffe9a8"/>` +
          star(150, 196, 1, 0) +
          star(182, 168, 0.9, 1.4) +
          star(160, 136, 0.8, 2.6) +
          star(122, 220, 0.6, 3.3) +
          star(178, 108, 0.7, 0.8),
      },
      seatArt:
        `<g fill="${WOOD}" stroke="#4a2e22" stroke-width="1.2"><rect x="108" y="349" width="86" height="12" rx="6"/>` +
        '<path d="M118 361L108 456H124L130 361Z"/><path d="M184 361L194 456H178L172 361Z"/><rect x="114" y="408" width="74" height="7" rx="3"/></g>' +
        `<g fill="${MAGIC}" fill-opacity=".5"><path transform="translate(151 355) scale(.7)" d="M0 -6L1.6 -1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6 -1.6Z"/></g>`,
      tableArt:
        `<g fill="${WOOD}" stroke="#4a2e22" stroke-width="1.2"><rect x="166" y="330" width="304" height="20" rx="3"/>` +
        '<rect x="190" y="350" width="262" height="30"/><rect x="176" y="350" width="26" height="106"/><rect x="436" y="350" width="26" height="106"/></g>' +
        '<g fill="#6a4a2e"><circle cx="321" cy="365" r="5"/></g><path d="M200 358H300M342 358H440" stroke="#4a2e22" stroke-width="2"/>' +
        '<path d="M168 331H468" stroke="#6a4a30" stroke-opacity=".6" stroke-width="2"/>',
    },
    style:
      '.rl-tw{animation:rl-tw 4.5s ease-in-out infinite alternate}@keyframes rl-tw{from{opacity:.2}to{opacity:1}}' +
      '.st-thinking .rl-tw{animation-duration:1.8s}' +
      '.rl-em{opacity:0;animation:rl-em 12s linear infinite}' +
      '@keyframes rl-em{0%{opacity:0;transform:translate(0,0)}12%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-620px)}}' +
      '.rl-win{animation:rl-win 5s ease-in-out infinite alternate;opacity:.75}@keyframes rl-win{from{opacity:.45}to{opacity:.95}}' +
      '.st-responding .rl-win{animation-duration:1.4s}' +
      '.rl-flag{transform-box:fill-box;transform-origin:0 50%;animation:rl-flag 2.6s ease-in-out infinite alternate}' +
      '@keyframes rl-flag{from{transform:scaleX(1)}to{transform:scaleX(.6)}}' +
      // The dragon: a slow circuit across the top, two-pose wings, small and far in every state but run.
      '.rl-fly{animation:rl-fly 46s ease-in-out infinite}' +
      '@keyframes rl-fly{0%{transform:translate(180px,0) scaleX(1)}23%{transform:translate(740px,-60px) scaleX(1)}46%{transform:translate(1320px,-20px) scaleX(1)}' +
      '50%{transform:translate(1320px,-20px) scaleX(-1)}73%{transform:translate(740px,70px) scaleX(-1)}96%{transform:translate(180px,0) scaleX(-1)}100%{transform:translate(180px,0) scaleX(1)}}' +
      '.rl-dr{transform:scale(.46)}' +
      '.rl-wing{transform-box:fill-box;transform-origin:90% 100%;animation:rl-flap .9s ease-in-out infinite alternate}' +
      '.rl-w2{animation-delay:-.25s}' +
      '@keyframes rl-flap{from{transform:scaleY(1)}to{transform:scaleY(-.5)}}' +
      '.rl-fire,.rl-bu{opacity:0}' +
      '.st-run .rl-fly{animation:rl-fly-run 6s ease-in-out infinite alternate}' +
      '@keyframes rl-fly-run{from{transform:translate(120px,50px) scaleX(1)}to{transform:translate(560px,0) scaleX(1)}}' +
      '.st-run .rl-dr{animation:rl-near 1.6s ease-out both}@keyframes rl-near{from{transform:scale(.46)}to{transform:scale(.8)}}' +
      '.st-run .rl-fire{transform-box:fill-box;transform-origin:0 50%;animation:rl-breathe 4.5s ease-out infinite}' +
      '@keyframes rl-breathe{0%{opacity:0;transform:scaleX(.05)}12%{opacity:.92}55%{opacity:.9;transform:scaleX(1)}80%,100%{opacity:0;transform:scaleX(1)}}' +
      '.st-run .rl-bu{animation:rl-burst 4.5s ease-out infinite}' +
      '@keyframes rl-burst{0%,40%{opacity:0;transform:translate(0,0)}46%{opacity:1}85%,100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.rl-wdr{animation:rl-wdr 24s linear infinite}@keyframes rl-wdr{from{transform:translateX(-40px)}to{transform:translateX(470px)}}' +
      '.rl-halo{animation:rl-halo 7s ease-in-out infinite alternate}@keyframes rl-halo{from{opacity:.6}to{opacity:1}}' +
      '.st-thinking .rl-halo{animation-duration:2s}' +
      '.rl-wash{opacity:0}.st-done .rl-wash{animation:rl-wash 2.6s ease-out both}' +
      '@keyframes rl-wash{0%{opacity:0}60%{opacity:.5}100%{opacity:.35}}' +
      // The device's own motion.
      '.rl-wisp{animation:mv-spin 9s linear infinite}.st-run .rl-wisp,.st-tool .rl-wisp{animation-duration:2s}' +
      '.rl-orbit{animation:mv-spin 7s linear infinite}' +
      '.rl-ringglow{animation:rl-glow 2.2s ease-in-out infinite alternate}@keyframes rl-glow{from{opacity:.55}to{opacity:1}}' +
      '.rl-sp{opacity:0;animation:rl-sp 1.4s ease-out infinite}' +
      '@keyframes rl-sp{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.rl-rp{transform-box:fill-box;transform-origin:center;animation:rl-rp 1.5s ease-out infinite}' +
      '@keyframes rl-rp{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(2.4)}}' +
      '.rl-rp-in{animation-name:rl-rpin}@keyframes rl-rpin{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1)}}' +
      '.rl-spin{transform-box:fill-box;transform-origin:center;animation:mv-spin 3s linear infinite}' +
      '.rl-fl{animation:rl-fl 1.5s ease-in-out infinite both}' +
      '@keyframes rl-fl{0%{transform:scaleX(1)}45%,100%{transform:scaleX(-1)}}' +
      '.rl-pgl{animation:rl-pgl 1.1s ease-in-out infinite alternate}@keyframes rl-pgl{from{opacity:.1}to{opacity:.55}}' +
      '.rl-txt{animation:rl-txt 1.1s ease-in-out infinite alternate}@keyframes rl-txt{from{opacity:.4}to{opacity:1}}' +
      '.rl-puff{transform-box:fill-box;transform-origin:center;opacity:0;animation:rl-puff 2.2s ease-out infinite}' +
      '@keyframes rl-puff{0%{opacity:0;transform:scale(.3)}20%{opacity:.75}100%{opacity:0;transform:translate(var(--dx),-80px) scale(2.4)}}',
    scenery:
      '<defs><linearGradient id="rl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0610"/><stop offset=".6" stop-color="#130a14"/>' +
      '<stop offset="1" stop-color="#241018"/></linearGradient>' +
      '<radialGradient id="rl-moonh"><stop offset="0" stop-color="#e9dcc8" stop-opacity=".16"/><stop offset="1" stop-color="#e9dcc8" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="rl-low" cx=".2" cy="1" r="1"><stop offset="0" stop-color="${FIRE}" stop-opacity=".14"/><stop offset="1" stop-color="${FIRE}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="rl-gw" cx=".25" cy=".7" r=".8"><stop offset="0" stop-color="#5cff9a" stop-opacity=".22"/><stop offset="1" stop-color="#5cff9a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rl-fire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity=".95"/><stop offset=".2" stop-color="#ffb347" stop-opacity=".8"/>' +
      '<stop offset=".55" stop-color="#ff6a3d" stop-opacity=".45"/><stop offset="1" stop-color="#ff3d10" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rl-fire2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#rl-sky)"/>' +
      '<rect width="1600" height="1000" fill="url(#rl-low)"/>' +
      stars(next, 70, [0, 0, 1600, 560], '#efe4ff') +
      '<g class="rl-halo"><circle cx="980" cy="130" r="190" fill="url(#rl-moonh)"/></g><circle cx="980" cy="130" r="50" fill="#e9dcc8" fill-opacity=".17"/>' +
      '<circle cx="966" cy="120" r="9" fill="#e9dcc8" fill-opacity=".06"/><circle cx="994" cy="146" r="6" fill="#e9dcc8" fill-opacity=".06"/>' +
      `<g transform="translate(0 200)"><g class="rl-fly"><g class="rl-dr">${dragon(true)}</g></g></g>` +
      '<g class="mv-b">' +
      '<path d="M0 700L120 640L240 690L380 590L520 680L640 600L800 700L960 620L1100 690L1260 580L1400 660L1520 600L1600 650V1200H0Z" fill="#160c14"/>' +
      '<path d="M0 790L160 730L320 780L520 720L760 790L980 740L1200 800L1420 730L1600 780V1200H0Z" fill="#0e070c"/>' +
      castle() +
      '<rect y="830" width="1600" height="370" fill="#080408"/>' +
      '<rect x="0" y="770" width="900" height="120" fill="url(#rl-low)" opacity=".7"/>' +
      `<g>${embers}</g></g>` +
      '<rect class="rl-wash" width="1600" height="1000" fill="url(#rl-gw)"/>',
    nook:
      '<defs><linearGradient id="rl-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0508" stop-opacity="0"/><stop offset=".25" stop-color="#0a0508" stop-opacity=".88"/>' +
      '<stop offset="1" stop-color="#0a0508" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="rl-wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070411"/><stop offset=".7" stop-color="#1c0d26"/><stop offset="1" stop-color="#3a1630"/></linearGradient>' +
      `<clipPath id="rl-wc"><path d="${arch}"/></clipPath></defs>` +
      '<rect x="-30" y="-480" width="450" height="980" fill="url(#rl-wall)"/>' +
      '<rect x="0" y="452" width="420" height="80" fill="#08040a"/><path d="M0 453H420" stroke="#2a1624" stroke-width="2"/>' +
      `<path d="${arch}" fill="url(#rl-wsky)"/>` +
      `<g clip-path="url(#rl-wc)">${stars(random(5), 26, [44, -430, 352, 300], '#efe4ff')}` +
      '<path d="M330 -330a22 22 0 1 0 18 34a17 17 0 1 1 -18 -34z" fill="#efe4ff" fill-opacity=".7"/>' +
      '<path d="M40 -70V-150L110 -190L170 -140L250 -200L330 -130L400 -170V-70Z" fill="#0b0610"/>' +
      '<path d="M60 -70V-160H78V-176L90 -190L102 -176V-160H120V-70Z" fill="#06030a"/>' +
      `<g transform="translate(0 -300)"><g class="rl-wdr"><g transform="scale(.2)">${dragon(false)}</g></g></g></g>` +
      `<path d="${arch}M220 -430V-70M40 -250H400" fill="none" stroke="#1a1014" stroke-width="16" stroke-linejoin="round"/>` +
      `<path d="${arch}" fill="none" stroke="#3a2430" stroke-opacity=".6" stroke-width="2"/>` +
      '<rect x="22" y="-72" width="396" height="18" fill="#1a1014" stroke="#2a1a20"/>',
  }
}
