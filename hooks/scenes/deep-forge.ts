import type { Activity } from '../../types'
import { f, random } from './kit'
import { cell } from './rig'
import type { World } from './world'

// Deep Forge: a dwarven smith in a horned iron helmet, working at a laptop on a stone bench in a hall carved into
// the mountain. A water wheel drives a giant trip-hammer over a glowing anvil; lava runs in channels through the floor.
// When a command runs the hammer slams the ingot and a small, short burst of sparks fans out.
const FIRE = '#ff8a2a'
const HOT = '#ffcf6a'
const IRON = '#4a4f57'
const IRON_DARK = '#23262b'
const STONE = '#17100d'
const STONE_EDGE = '#3a2418'
const LEATHER = '#5a3a22'

/** A rune: an invented mark in a ±12 box. */
const RUNES = [
  'M-6 -11V11M-6 -2L6 -11M-6 2L6 11',
  'M0 -11L9 0L0 11L-9 0ZM0 -4V4',
  'M-8 -10H8M0 -10V11M-8 4L0 11L8 4',
  'M-7 11L0 -11L7 11M-5 3H5',
  'M-8 -9L8 -9L-8 9L8 9M0 -9V9',
  'M-9 0A9 9 0 1 0 9 0A9 9 0 1 0 -9 0M0 -11V11',
  'M-7 -11V11M7 -11V11M-7 0H7',
  'M-9 -6L0 -11L9 -6M-9 6L0 11L9 6M0 -11V11',
]

/** One giant carved guardian, seen from the front, its feet at the origin and its head 520 up. */
function guardian(x: number, y: number, s: number, flip: number, seed: number, eyeCls = 'df-eye'): string {
  const rnd = random(seed)
  const cracks = Array.from({ length: 5 }, () => {
    const cx = (rnd() - 0.5) * 120
    const cy = -120 - rnd() * 280

    return `M${f(cx)} ${f(cy)}l${f(8 + rnd() * 14)} ${f(16 + rnd() * 14)}l${f(-10 - rnd() * 8)} ${f(20 + rnd() * 18)}`
  }).join('')

  return (
    `<g transform="translate(${x} ${y}) scale(${f(s * flip)} ${s})" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="3" stroke-linejoin="round">` +
    '<rect x="-110" y="-50" width="220" height="50"/><rect x="-96" y="-76" width="192" height="30"/>' +
    '<path d="M-52 -76H-12V-250H-56ZM12 -76H52L56 -250H12Z"/>' +
    '<path d="M-74 -250H74L96 -300L84 -430H-84L-96 -300Z"/>' +
    '<path d="M-74 -300H74V-318H-74Z" fill="#241610"/>' +
    '<circle cx="-104" cy="-420" r="44"/><circle cx="104" cy="-420" r="44"/>' +
    '<path d="M-134 -410L-150 -310L-122 -296L-100 -380ZM134 -410L150 -310L122 -296L100 -380Z"/>' +
    '<path d="M-36 -432H36L40 -500L0 -526L-40 -500Z"/>' +
    '<path d="M-44 -496L-70 -540L-60 -500ZM44 -496L70 -540L60 -500Z"/>' +
    '<path d="M-36 -466H36L48 -396L0 -340L-48 -396Z" fill="#1d130e"/>' +
    '<rect x="150" y="-560" width="12" height="520" fill="#1d130e"/>' +
    '<path d="M162 -560L228 -540V-470L162 -490Z"/>' +
    `<path d="${cracks}" fill="none" stroke="#0a0605" stroke-width="3"/>` +
    '<path d="M-84 -430V-300M84 -430V-300" fill="none" stroke="#2e1d15" stroke-width="3"/>' +
    `<g class="${eyeCls}" fill="${FIRE}"><rect x="-22" y="-476" width="14" height="6"/><rect x="8" y="-476" width="14" height="6"/></g></g>`
  )
}

/** A hanging brazier on a chain: the bowl, the flame and the glow it throws. */
function brazier(x: number, top: number, drop: number, s: number, delay: number): string {
  return (
    `<g transform="translate(${x} ${top}) scale(${s})">` +
    `<path d="M0 -${top}V${drop}" stroke="#3a2c24" stroke-width="7" stroke-dasharray="9 5" fill="none"/>` +
    `<circle class="df-glow" cx="0" cy="${drop + 20}" r="200" fill="url(#df-hg)" style="animation-delay:${delay}s"/>` +
    `<path d="M-46 ${drop}H46L30 ${drop + 34}H-30Z" fill="${IRON_DARK}" stroke="${IRON}" stroke-width="3"/>` +
    `<path d="M-52 ${drop}H52" stroke="${IRON}" stroke-width="5"/>` +
    `<g class="df-flame" style="animation-delay:${delay}s"><path d="M-30 ${drop}C-34 ${drop - 30} -10 ${drop - 36} -8 ${drop - 66}C14 ${drop - 44} 34 ${drop - 28} 30 ${drop}Z" fill="${FIRE}" fill-opacity=".85"/>` +
    `<path d="M-14 ${drop}C-16 ${drop - 18} -2 ${drop - 22} 0 ${drop - 40}C10 ${drop - 26} 16 ${drop - 14} 14 ${drop}Z" fill="${HOT}"/></g></g>`
  )
}

/** The laptop of black iron with a rune-lit lid, a small anvil with its ingot and a pair of tongs. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const hot = activity === 'run' || activity === 'tool'

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2c2f35" stroke="#4a4f57" stroke-width="1.2"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2c2f35" stroke="#4a4f57" stroke-width="1.2"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The small anvil and its glowing ingot.
    '<path d="M388 330V322H396L392 314H438L452 312L440 320H428L432 330Z" fill="#23262b" stroke="#5a606a" stroke-width="1.6" stroke-linejoin="round"/>' +
    `<rect x="402" y="308" width="24" height="6" rx="2" fill="${FIRE}" fill-opacity="${hot ? 1 : 0.7}"/>` +
    `<circle class="df-ing" cx="414" cy="306" r="24" fill="url(#df-hg)"/>` +
    // The tongs and a little hammer.
    '<path d="M456 330L486 302M462 330L492 306" stroke="#5a606a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M456 330L464 326M462 330L470 326" stroke="#5a606a" stroke-width="3"/>'
  )
}

export function deepForgeWorld(): World {
  const next = random(41)

  // The stalactites hang from the top of the picture.
  const drips: string[] = []

  for (let x = -20; x < 1640; x += 40 + next() * 50) {
    const w = 30 + next() * 50
    const h = 30 + next() * 90

    drips.push(`M${f(x)} -4L${f(x + w / 2)} ${f(h)}L${f(x + w)} -4`)
  }

  const ceiling = `<path d="${drips.join('')}Z" fill="#050303"/>`
  const wheelSpokes = Array.from({ length: 12 }, (_, i) => `<path d="M0 0L${f(Math.cos((i * Math.PI) / 6) * 118)} ${f(Math.sin((i * Math.PI) / 6) * 118)}"/>`).join('')
  const buckets = Array.from({ length: 12 }, (_, i) => `<rect x="-9" y="-136" width="18" height="24" transform="rotate(${i * 30})"/>`).join('')
  const lobes = [0, 120, 240].map(a => `<rect x="-11" y="-58" width="22" height="42" rx="6" transform="rotate(${a})"/>`).join('')

  const sparks = Array.from({ length: 11 }, (_, i) => {
    const a = -Math.PI + (i / 10) * Math.PI
    const d = 48 + next() * 24

    return `<circle class="df-sp" cx="0" cy="0" r="${f(3.4 + next() * 2.4)}" fill="${i % 3 ? HOT : '#ffe9b0'}" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d * 0.8 - 6)}px"/>`
  }).join('')

  const embers = (count: number, cls: string, seed: number): string => {
    const r = random(seed)

    return Array.from({ length: count }, () => {
      const x = r() * 1600
      const y = 640 + r() * 330

      return `<circle class="${cls}" cx="${f(x)}" cy="${f(y)}" r="${f(1.4 + r() * 2.4)}" fill="${r() > 0.5 ? FIRE : HOT}" style="--rise:${f(-160 - r() * 260)}px;--sway:${f((r() - 0.5) * 70)}px;animation-duration:${f(5 + r() * 5)}s;animation-delay:${f(-r() * 9)}s"/>`
    }).join('')
  }

  const steam = Array.from({ length: 11 }, (_, i) => {
    const x = 60 + i * 150 + next() * 60
    const y = 720 + next() * 120
    const r = 50 + next() * 40

    return `<circle class="df-stm" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#df-steam)" style="animation-delay:${f(-i * 0.37)}s"/>`
  }).join('')

  const runeSlots: [number, number, number][] = [
    [1338, 262, 0],
    [1400, 238, 1],
    [1462, 262, 2],
    [1322, 360, 3],
    [1478, 360, 4],
    [1322, 540, 5],
    [1478, 540, 6],
    [1400, 330, 7],
  ]
  const runes = runeSlots
    .map(
      ([x, y, i], n) =>
        `<g transform="translate(${x} ${y})"><circle class="df-rg" r="34" fill="url(#df-hg)" style="animation-delay:${f(0.4 + n * 0.4)}s"/>` +
        `<path class="df-ru" d="${RUNES[i]}" fill="none" stroke="${HOT}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${f(0.4 + n * 0.4)}s"/></g>`,
    )
    .join('')
  const emblem =
    '<g transform="translate(1400 450)"><circle r="44" fill="#0a0605" stroke="#3a2418" stroke-width="5"/>' +
    `<circle class="df-ru" r="30" fill="none" stroke="${HOT}" stroke-width="4" style="animation-delay:3.6s"/>` +
    `<path class="df-ru" d="M0 -24V24M-24 0H24M-17 -17L17 17M17 -17L-17 17" stroke="${HOT}" stroke-width="3" style="animation-delay:3.6s"/></g>`

  const lava = (cls: string, op: number) =>
    `<g class="${cls}" fill="none" stroke-linecap="round" opacity="${op}">` +
    '<path d="M-20 712H430M1190 712H1620" stroke="#8a2f08" stroke-width="22"/><path d="M-20 712H430M1190 712H1620" stroke="#ff8a2a" stroke-width="7"/>' +
    '<path d="M430 712H1190" stroke="#8a2f08" stroke-width="12" stroke-opacity=".5"/><path d="M430 712H1190" stroke="#ff8a2a" stroke-width="3" stroke-opacity=".5"/>' +
    '<path d="M200 740C170 820 100 900 20 1000" stroke="#8a2f08" stroke-width="26"/><path d="M200 740C170 820 100 900 20 1000" stroke="#ff8a2a" stroke-width="9"/>' +
    '<path d="M700 716C716 800 650 900 580 1000" stroke="#8a2f08" stroke-width="16" stroke-opacity=".5"/><path d="M700 716C716 800 650 900 580 1000" stroke="#ff8a2a" stroke-width="5" stroke-opacity=".5"/>' +
    '<path d="M1010 716C1060 800 1180 880 1330 1000" stroke="#8a2f08" stroke-width="22"/><path d="M1010 716C1060 800 1180 880 1330 1000" stroke="#ff8a2a" stroke-width="8"/>' +
    '<path d="M840 716C850 790 900 860 960 1000" stroke="#8a2f08" stroke-width="12" stroke-opacity=".4"/></g>'

  const flagstones = Array.from({ length: 9 }, (_, i) => `<path d="M${f(800 + (i - 4) * 90)} 704L${f(800 + (i - 4) * 420)} 1000" stroke="#0a0605" stroke-width="2"/>`).join('')

  const raven =
    '<g transform="translate(0 250)"><g class="df-raven"><g transform="scale(1.5)" fill="#0b0807" stroke="#ff8a2a" stroke-opacity=".5" stroke-width="1.4" stroke-linejoin="round">' +
    '<ellipse rx="15" ry="6"/><path d="M-12 0L-30 -3L-28 5Z"/><path d="M12 -2L22 -6L30 -3L22 0Z"/>' +
    '<path class="df-wing" d="M-4 -2C-6 -22 8 -34 22 -38C14 -24 14 -12 8 -2Z"/>' +
    '<path class="df-wing df-w2" d="M-2 0C-14 -16 -28 -24 -44 -26C-32 -14 -22 -6 -10 2Z"/></g></g></g>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#060302',
      furniture: '#2a1c15',
      metal: '#2c2f35',
      paper: '#d8c9ae',
      light: { idle: '#b8793a', work: '#ffb454', bright: '#ffe2a0' },
      headTop: 204,
      glowAt: [330, 282],
      device,
      wear: {
        behind: `<path d="M216 318L232 350H214Z" fill="${LEATHER}" fill-opacity="0"/>`,
        front:
          // The horned helmet: a dome and a brow band, the face left open below it. Cheek guards sit outside the eyes.
          `<path d="M66 246C66 214 98 198 150 198C202 198 234 214 234 246Z" fill="${IRON}" stroke="${IRON_DARK}" stroke-width="3" stroke-linejoin="round"/>` +
          '<path d="M82 222C96 208 124 202 150 202" fill="none" stroke="#8a93a0" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          `<path d="M66 240H234V250H66Z" fill="${IRON_DARK}"/>` +
          `<g fill="${HOT}" fill-opacity=".8"><circle cx="86" cy="245" r="2.4"/><circle cx="118" cy="245" r="2.4"/><circle cx="150" cy="245" r="2.4"/><circle cx="182" cy="245" r="2.4"/><circle cx="214" cy="245" r="2.4"/></g>` +
          `<path d="M150 198V236" stroke="${IRON_DARK}" stroke-width="5"/>` +
          // The horns, curving out and up.
          '<path d="M72 222C48 220 34 196 36 168C48 186 64 190 80 200Z" fill="#cfc4ae" stroke="#7a6f5c" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M228 222C252 220 266 196 264 168C252 186 236 190 220 200Z" fill="#cfc4ae" stroke="#7a6f5c" stroke-width="2.4" stroke-linejoin="round"/>' +
          // Cheek plates beside the open face.
          `<path d="M66 250H88L84 282H70Z" fill="${IRON}" stroke="${IRON_DARK}" stroke-width="2"/>` +
          `<path d="M234 250H218L220 276H232Z" fill="${IRON}" stroke="${IRON_DARK}" stroke-width="2"/>` +
          // A short braided beard and the leather apron with its straps.
          `<path d="M104 330H196L186 350H114Z" fill="${LEATHER}" stroke="#2a1a10" stroke-width="2"/>` +
          `<path d="M84 262L110 330M216 262L190 330" stroke="${LEATHER}" stroke-width="7" fill="none"/>` +
          `<path d="M120 336H180" stroke="#2a1a10" stroke-width="2"/><circle cx="150" cy="340" r="4" fill="#b58a30"/>`,
      },
      seatArt:
        `<path d="M104 352H198L206 456H96Z" fill="#241713" stroke="${STONE_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M96 396H206M100 424H202" stroke="${IRON}" stroke-width="5" stroke-opacity=".8"/>` +
        '<path d="M126 360L120 446M170 360L176 446" stroke="#0a0605" stroke-opacity=".6" stroke-width="2"/>' +
        `<rect x="106" y="346" width="90" height="8" rx="2" fill="#3a2418" stroke="${STONE_EDGE}" stroke-width="1.6"/>`,
      tableArt:
        '<rect x="166" y="330" width="304" height="18" rx="3" fill="#1d130e" stroke="#3a2418" stroke-width="2"/>' +
        '<path d="M176 348H206L210 456H172ZM426 348H456L460 456H422Z" fill="#17100d" stroke="#2e1d15" stroke-width="2"/>' +
        `<path d="M172 392H460" stroke="${IRON}" stroke-width="5" stroke-opacity=".8"/>` +
        '<path d="M240 350V392M320 350V392M380 350V392" stroke="#2e1d15" stroke-width="3"/>' +
        `<g fill="${IRON}"><circle cx="178" cy="339" r="3"/><circle cx="458" cy="339" r="3"/></g>` +
        `<ellipse cx="320" cy="440" rx="82" ry="10" fill="${FIRE}" fill-opacity=".12"/>`,
    },
    style:
      // The slow world: the lava breathes, flames flicker, the guardians' eyes smoulder.
      '.df-lv{animation:df-breathe 4.2s ease-in-out infinite alternate}@keyframes df-breathe{from{opacity:.72}to{opacity:.95}}' +
      '.st-tool .df-lv{animation:df-pulse 1.6s ease-in-out infinite alternate}@keyframes df-pulse{from{opacity:.6}to{opacity:1}}' +
      '.df-flame{transform-box:fill-box;transform-origin:50% 100%;animation:df-fl .8s ease-in-out infinite alternate}@keyframes df-fl{from{transform:scale(1,.88)}to{transform:scale(.92,1.08)}}' +
      '.df-glow{animation:df-gl 2.2s ease-in-out infinite alternate}@keyframes df-gl{from{opacity:.55}to{opacity:.9}}' +
      '.df-eye{animation:df-gl 3s ease-in-out infinite alternate;opacity:.6}' +
      '.df-ing{animation:df-gl 1.6s ease-in-out infinite alternate}' +
      '.df-sway{animation:df-swing 7s ease-in-out infinite alternate;transform-origin:50% 0}@keyframes df-swing{from{transform:rotate(-.8deg)}to{transform:rotate(.8deg)}}' +
      // The water wheel and the cam.
      '.df-wheel{animation:mv-spin 12s linear infinite}.df-cam{animation:mv-spin 4s linear infinite}' +
      '.st-run .df-wheel{animation-duration:2.2s}.st-run .df-cam{animation-duration:1.2s}' +
      '.df-arm{transform-origin:580px 540px;animation:df-slam 4s ease-in-out infinite}' +
      '.st-run .df-arm{animation:df-slamr 1.2s ease-in-out infinite}.st-tool .df-arm{animation-duration:3s}' +
      '@keyframes df-slam{0%{transform:rotate(0)}35%{transform:rotate(9deg)}50%{transform:rotate(9deg);animation-timing-function:cubic-bezier(.6,0,1,.6)}56%{transform:rotate(0)}59%{transform:rotate(1.6deg)}63%,100%{transform:rotate(0)}}' +
      '@keyframes df-slamr{0%{transform:rotate(0)}26%{transform:rotate(10deg)}34%{transform:rotate(10deg);animation-timing-function:cubic-bezier(.6,0,1,.6)}42%{transform:rotate(0)}46%{transform:rotate(2deg)}52%,100%{transform:rotate(0)}}' +
      '.df-flow{stroke-dasharray:8 12;animation:df-run .6s linear infinite}@keyframes df-run{to{stroke-dashoffset:-20}}' +
      // The hit: a small glow and a short fan of sparks, once per stroke.
      '.df-hit,.df-wp,.df-rf,.df-roar{opacity:0}.df-hit,.df-rf{transform-box:fill-box;transform-origin:center}' +
      '.df-hit{animation:df-hit 4s ease-out infinite}.st-tool .df-hit{animation-duration:3s}' +
      '@keyframes df-hit{0%,49%{opacity:0;transform:scale(.6)}52%{opacity:.5;transform:scale(1)}60%,100%{opacity:0;transform:scale(1.3)}}' +
      '.df-sp{opacity:0;--k:.7;animation:df-sp 4s ease-out infinite}.st-tool .df-sp{animation-duration:3s}' +
      '@keyframes df-sp{0%,50%{opacity:0;transform:translate(0,0)}52%{opacity:1}68%,100%{opacity:0;transform:translate(calc(var(--dx) * var(--k)),calc(var(--dy) * var(--k)))}}' +
      '.df-wp{animation:df-wp 4s ease-out infinite}@keyframes df-wp{0%,49%{opacity:0}52%{opacity:.5}66%,100%{opacity:0}}' +
      '.st-run .df-hit{animation:df-hitr 1.2s ease-out infinite}@keyframes df-hitr{0%,40%{opacity:0;transform:scale(.6)}43%{opacity:.5;transform:scale(1)}62%,100%{opacity:0;transform:scale(1.5)}}' +
      '.st-run .df-sp{--k:2.8;animation:df-spr 1.2s ease-out infinite}@keyframes df-spr{0%,41%{opacity:0;transform:translate(0,0)}43%{opacity:1}72%,100%{opacity:0;transform:translate(calc(var(--dx) * var(--k)),calc(var(--dy) * var(--k)))}}' +
      '.st-run .df-wp{animation:df-wpr 1.2s ease-out infinite}@keyframes df-wpr{0%,40%{opacity:.25}43%{opacity:.95}70%,100%{opacity:.25}}' +
      '.st-run .df-rf{animation:df-rf 1.2s ease-out infinite}@keyframes df-rf{0%,41%{opacity:0;transform:scale(.3)}44%{opacity:.5}78%,100%{opacity:0;transform:scale(3.2)}}' +
      '.st-run .df-roar{opacity:.55;animation:df-gl .7s ease-in-out infinite alternate}.st-run .df-mouth{animation-duration:.7s}' +
      '.df-wst{opacity:0}.st-run .df-wst{opacity:.4}' +
      '.df-ing2{animation:df-gl 1.4s ease-in-out infinite alternate}' +
      // The bellows pump.
      '.df-bl{transform-origin:232px 382px;animation:df-bl 6s ease-in-out infinite}.df-fold{transform-box:fill-box;transform-origin:50% 100%;animation:df-fold 6s ease-in-out infinite}' +
      '.st-tool .df-bl,.st-tool .df-fold{animation-duration:.9s}' +
      '@keyframes df-bl{0%,100%{transform:rotate(0)}50%{transform:rotate(-7deg)}}@keyframes df-fold{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.62)}}' +
      '.df-mouth{animation:df-gl 2.4s ease-in-out infinite alternate}.st-tool .df-mouth{animation-duration:.9s}' +
      // Embers: a few always, many while thinking.
      '.df-em{opacity:0;animation:df-em 7s ease-out infinite}.df-emx{opacity:0}.st-thinking .df-emx{animation:df-em 4s ease-out infinite}' +
      '@keyframes df-em{0%{opacity:0;transform:translate(0,0)}12%{opacity:.85}100%{opacity:0;transform:translate(var(--sway),var(--rise))}}' +
      // The raven crosses the hall.
      '.df-raven{opacity:0}.st-web .df-raven{animation:df-fly 6.5s linear infinite}' +
      '@keyframes df-fly{0%{opacity:0;transform:translate(1800px,0)}6%{opacity:.95;transform:translate(1700px,-6px)}50%{transform:translate(800px,24px)}94%{opacity:.95}100%{opacity:0;transform:translate(-200px,-10px)}}' +
      '.df-wing{transform-box:fill-box;transform-origin:50% 100%;animation:df-flap .36s ease-in-out infinite alternate}.df-w2{transform-origin:100% 100%}@keyframes df-flap{to{transform:scaleY(.3)}}' +
      // Error: the lava channel overflows and steam rises.
      '.df-swell,.df-tg,.df-ck{opacity:0}.df-tn{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}' +
      '.st-error .df-swell{animation:df-sw 2.4s ease-out both}@keyframes df-sw{to{opacity:.85}}' +
      '.st-error .df-tg{animation:df-tg 3s ease-out both}@keyframes df-tg{to{opacity:.3}}' +
      '.st-error .df-tn{animation:df-tn 3.2s ease-out both}@keyframes df-tn{0%{opacity:1;stroke-dashoffset:1}100%{opacity:.9;stroke-dashoffset:0}}' +
      '.st-error .df-ck{animation:df-ck 2.4s ease-out .3s both}@keyframes df-ck{to{opacity:.9}}' +
      '.st-error .df-eyer rect{fill:#ff3a2a}.st-error .df-eyer{animation:df-eyr 1.2s ease-in-out infinite alternate;opacity:1}@keyframes df-eyr{from{opacity:.6}to{opacity:1}}' +
      '.df-stm{opacity:0;transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-error .df-stm{animation:df-steam 3.4s ease-out infinite}' +
      '@keyframes df-steam{0%{opacity:0;transform:translateY(0) scale(.5)}25%{opacity:.5}100%{opacity:0;transform:translateY(-300px) scale(1.7)}}' +
      '.st-error .df-lv{animation:none;opacity:1}' +
      // Done: the runes light one by one and the door glows.
      '.df-ru{opacity:.2}.st-done .df-ru{animation:df-ru .5s ease-out both}@keyframes df-ru{from{opacity:.2}to{opacity:1}}' +
      '.df-rg{opacity:0}.st-done .df-rg{animation:df-rg .8s ease-out both}@keyframes df-rg{from{opacity:0}to{opacity:.55}}' +
      '.df-door{opacity:0}.st-done .df-door{animation:df-door 3s ease-in-out 1.8s both}@keyframes df-door{from{opacity:0}to{opacity:.7}}',
    scenery:
      '<defs>' +
      '<linearGradient id="df-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050303"/><stop offset=".55" stop-color="#0f0907"/><stop offset="1" stop-color="#1c0f09"/></linearGradient>' +
      '<linearGradient id="df-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150c08"/><stop offset="1" stop-color="#070403"/></linearGradient>' +
      '<radialGradient id="df-hg"><stop offset="0" stop-color="#ffb454" stop-opacity=".55"/><stop offset=".45" stop-color="#ff8a2a" stop-opacity=".18"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="df-haze"><stop offset="0" stop-color="#ff6a1a" stop-opacity=".3"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="df-steam"><stop offset="0" stop-color="#e6d4c6" stop-opacity=".5"/><stop offset="1" stop-color="#e6d4c6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="df-lavafill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a2a"/><stop offset="1" stop-color="#a13a0c"/></linearGradient>' +
      '<radialGradient id="df-dglow" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#df-wall)"/>' +
      // The vault: ribs and pillars, big and dim.
      '<g fill="none" stroke="#1d130e" stroke-width="22"><path d="M-40 360C80 120 260 40 420 20M1640 360C1520 120 1340 40 1180 20M420 20C600 -10 1000 -10 1180 20"/></g>' +
      `<g fill="#120b08" stroke="${STONE_EDGE}" stroke-width="3"><rect x="590" y="40" width="70" height="680"/><rect x="940" y="40" width="70" height="680"/><rect x="574" y="40" width="102" height="30"/><rect x="924" y="40" width="102" height="30"/></g>` +
      '<ellipse cx="800" cy="720" rx="900" ry="120" fill="url(#df-haze)"/>' +
      ceiling +
      // The great door at the far right, carved with runes that wake when a job is done.
      '<g class="mv-r">' +
      `<path d="M1262 640V330A138 138 0 0 1 1538 330V640Z" fill="#0d0705" stroke="#3a2418" stroke-width="10"/>` +
      '<path d="M1400 192V640" stroke="#3a2418" stroke-width="6"/>' +
      `<path d="M1270 400H1530M1270 600H1530" stroke="${IRON}" stroke-width="12" stroke-opacity=".7"/>` +
      '<g fill="#2c2f35"><circle cx="1290" cy="400" r="6"/><circle cx="1510" cy="400" r="6"/><circle cx="1290" cy="600" r="6"/><circle cx="1510" cy="600" r="6"/></g>' +
      runes +
      emblem +
      '<path class="df-door" d="M1262 640V330A138 138 0 0 1 1538 330V640Z" fill="url(#df-dglow)"/>' +
      '<path d="M1214 640H1586L1560 700H1240Z" fill="#150d09" stroke="#2e1d15" stroke-width="3"/></g>' +
      // The guardians flank the hall: huge, carved, dim.
      guardian(520, 700, 0.95, 1, 5, 'df-eye df-eyer') +
      guardian(1100, 700, 0.95, -1, 9) +
      // Braziers on chains.
      brazier(300, 0, 150, 1, 0) +
      brazier(1160, 0, 120, 0.9, -0.5) +
      brazier(740, 0, 70, 0.55, -1) +
      // The floor, the flagstones and the lava channels.
      '<rect y="700" width="1600" height="300" fill="url(#df-floor)"/>' +
      `<path d="M-20 700H1620" stroke="${STONE_EDGE}" stroke-width="4"/>` +
      `<g opacity=".6">${flagstones}</g>` +
      lava('df-lv', 1) +
      // The furnace with its bellows, upper left.
      `<g><path d="M44 440V210L110 150V0H190V150L256 210V440Z" fill="#14100e" stroke="${STONE_EDGE}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path class="df-mouth" d="M96 440V350C96 300 204 300 204 350V440Z" fill="url(#df-lavafill)"/>` +
      `<circle class="df-mouth" cx="150" cy="380" r="150" fill="url(#df-hg)"/><circle class="df-roar" cx="150" cy="380" r="230" fill="url(#df-hg)"/>` +
      `<path d="M96 440V350C96 300 204 300 204 350V440" fill="none" stroke="${IRON}" stroke-width="8"/>` +
      // The bellows.
      '<path d="M232 402H340L346 414H228Z" fill="#2a1a12" stroke="#3a2418" stroke-width="2"/>' +
      '<g class="df-bl"><path d="M232 356H338L344 364H228Z" fill="#2a1a12" stroke="#3a2418" stroke-width="2"/>' +
      '<path d="M338 360L346 346" stroke="#3a2418" stroke-width="6" stroke-linecap="round"/></g>' +
      `<g class="df-fold"><path d="M232 362L338 366V402H232Z" fill="${LEATHER}" stroke="#2a1a10" stroke-width="2"/><path d="M262 364V402M292 366V402M318 366V402" stroke="#2a1a10" stroke-width="3"/></g>` +
      `<path d="M232 386H210L204 372" stroke="${IRON}" stroke-width="7" fill="none" stroke-linejoin="round"/></g>` +
      // The water wheel in its pit, fed by a flume.
      '<path d="M-40 700H260L250 800H-30Z" fill="#06100f"/><ellipse cx="110" cy="708" rx="150" ry="14" fill="#1d5560" fill-opacity=".5"/>' +
      '<rect x="-60" y="476" width="180" height="16" rx="3" fill="#2a1a12" stroke="#3a2418" stroke-width="2"/>' +
      '<g stroke="#4fa8b8" stroke-opacity=".7" stroke-width="5" fill="none"><path class="df-flow" d="M-10 492V560"/><path class="df-flow" style="animation-delay:-.2s" d="M30 492V560"/><path class="df-flow" style="animation-delay:-.4s" d="M70 492V560"/></g>' +
      '<g transform="translate(120 630)"><g class="df-wheel">' +
      `<circle r="128" fill="none" stroke="#2a1a12" stroke-width="14"/><circle r="128" fill="none" stroke="${IRON}" stroke-width="3"/><circle r="92" fill="none" stroke="#2a1a12" stroke-width="8"/>` +
      `<g stroke="#3a2418" stroke-width="9">${wheelSpokes}</g><g fill="#3a2418" stroke="#1a100b" stroke-width="2">${buckets}</g>` +
      `<circle class="df-wst" r="146" fill="none" stroke="#bfe4f0" stroke-width="6" stroke-dasharray="70 90" stroke-linecap="round"/><circle class="df-wst" r="104" fill="none" stroke="#bfe4f0" stroke-width="5" stroke-dasharray="50 110" stroke-linecap="round"/><circle r="22" fill="${IRON_DARK}" stroke="${IRON}" stroke-width="4"/></g></g>` +
      // The shaft to the cam.
      `<path d="M120 630H505" stroke="#1d130e" stroke-width="16"/><path d="M120 624H505" stroke="${IRON}" stroke-opacity=".5" stroke-width="3"/>` +
      '<g transform="translate(505 630)"><g class="df-cam">' +
      `<circle r="30" fill="#2c2f35" stroke="${IRON}" stroke-width="3"/><g fill="#2c2f35" stroke="${IRON}" stroke-width="2">${lobes}</g></g></g>` +
      // The anvil and its stone pedestal.
      '<path d="M296 760V712H392V760Z" fill="#1d130e" stroke="#3a2418" stroke-width="3"/>' +
      '<path d="M266 672L286 668H410L398 690H378L384 712H308L314 690H290Z" fill="#2c2f35" stroke="#5a606a" stroke-width="2.4" stroke-linejoin="round"/>' +
      `<rect x="314" y="656" width="72" height="12" rx="3" fill="${FIRE}"/><rect x="326" y="658" width="48" height="5" rx="2" fill="#ffe2a0"/>` +
      '<circle class="df-ing2" cx="350" cy="660" r="70" fill="url(#df-hg)"/><rect class="df-wp" x="318" y="656" width="64" height="12" rx="4" fill="#fff0c8"/><ellipse class="df-rf" cx="350" cy="742" rx="60" ry="14" fill="none" stroke="#ffb454" stroke-width="4"/>' +
      // The giant trip-hammer: a beam, a head, braced on a pivot post.
      '<path d="M556 760V520L580 500L604 520V760Z" fill="#1d130e" stroke="#3a2418" stroke-width="3"/>' +
      '<g class="df-arm">' +
      // The long wooden helve, thick and banded, through the iron head.
      `<path d="M300 580L604 526L612 560L300 618Z" fill="#6a4426" stroke="#2a1a10" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M300 588L604 534" stroke="#a8743c" stroke-opacity=".6" stroke-width="4"/>` +
      '<path d="M400 566V600M470 556V592M540 543V580" stroke="#2a1a10" stroke-width="3"/>' +
      // The sledge head: a dark iron block with flared faces, a brass collar and two bands.
      `<path d="M262 588H402L394 600V646L402 660H262L270 646V600Z" fill="#15171b" stroke="#3a3f47" stroke-width="3" stroke-linejoin="round"/>` +
      '<path d="M270 592H394" stroke="#6a7078" stroke-opacity=".7" stroke-width="3"/>' +
      '<rect x="310" y="580" width="40" height="86" rx="3" fill="#7a5a26" stroke="#2a1a10" stroke-width="3"/>' +
      '<rect x="306" y="596" width="48" height="8" fill="#b58a30"/><rect x="306" y="640" width="48" height="8" fill="#b58a30"/>' +
      `<path d="M266 652H398" stroke="${FIRE}" stroke-opacity=".6" stroke-width="3"/>` +
      '<path d="M606 520H644V566H606Z" fill="#23262b" stroke="#4a4f57" stroke-width="3"/>' +
      '</g>' +
      '<path d="M540 580L580 520L620 580Z" fill="#23262b" stroke="#4a4f57" stroke-width="3"/><circle cx="580" cy="540" r="24" fill="#2c2f35" stroke="#8a929c" stroke-width="4"/><circle cx="580" cy="540" r="8" fill="#b58a30"/><g fill="#8a929c"><circle cx="580" cy="522" r="3"/><circle cx="580" cy="558" r="3"/><circle cx="562" cy="540" r="3"/><circle cx="598" cy="540" r="3"/></g>' +
      `<g transform="translate(350 660)"><ellipse class="df-hit" rx="64" ry="26" fill="url(#df-dglow)"/>${sparks}</g>` +
      // Embers and the flood and steam of an error.
      '<g class="df-swell" fill="none" stroke-linecap="round"><path d="M-20 712H430M1190 712H1620" stroke="#ff8a2a" stroke-width="34" stroke-opacity=".35"/><path d="M200 740C170 820 100 900 20 1000" stroke="#ff8a2a" stroke-width="40" stroke-opacity=".35"/><path d="M1010 716C1060 800 1180 880 1330 1000" stroke="#ff8a2a" stroke-width="34" stroke-opacity=".35"/><path d="M-20 712H430M1190 712H1620" stroke="#ffcf6a" stroke-width="10"/><path d="M200 740C170 820 100 900 20 1000" stroke="#ffcf6a" stroke-width="12"/><path d="M1010 716C1060 800 1180 880 1330 1000" stroke="#ffcf6a" stroke-width="10"/></g>' +
      '<g class="df-tg"><ellipse cx="260" cy="860" rx="260" ry="90" fill="url(#df-hg)"/><ellipse cx="1060" cy="850" rx="200" ry="80" fill="url(#df-hg)"/><ellipse cx="780" cy="850" rx="200" ry="70" fill="url(#df-hg)"/></g>' +
      '<g fill="none" stroke-linecap="round">' +
      [
        'M300 712C320 760 280 800 330 860C350 890 330 930 380 990',
        'M120 712C100 770 150 820 110 880',
        'M430 716C470 750 450 800 500 840C520 870 500 920 540 960',
        'M1030 716C1010 770 1060 800 1040 860C1030 900 1070 940 1050 990',
        'M900 716C930 760 880 800 920 850',
        'M640 716C620 760 670 790 640 850C630 890 660 930 650 990',
      ]
        .map((d, k) => `<path class="df-tn" pathLength="1" d="${d}" stroke="#ff8a2a" stroke-width="${6 - (k % 3)}" style="animation-delay:${f(k * 0.18)}s"/>`)
        .join('') +
      '</g>' +
      '<g class="df-ck" fill="none" stroke="#ff8a2a" stroke-width="2.4" stroke-linecap="round"><path d="M150 800L190 840L170 890M360 780L420 810L400 870M560 760L610 800M720 780L690 840L740 880M860 800L910 830M980 760L1030 790L1010 850M130 900L90 950M470 900L520 950"/></g>' +
      steam +
      embers(12, 'df-em', 3) +
      embers(26, 'df-emx', 8) +
      raven,
    nook:
      // A tool rack on the wall behind the desk, a hung chain, and a quench bucket on the floor.
      `<g fill="none" stroke="${IRON}" stroke-width="3"><rect x="250" y="40" width="150" height="8" rx="2" fill="#2a1a12" stroke="#3a2418"/></g>` +
      `<g fill="${IRON_DARK}" stroke="#5a606a" stroke-width="2"><path d="M270 48V120"/><path d="M262 120H290V150H262Z"/><path d="M320 48V150L312 170H328L320 150"/><path d="M370 48V132M356 132H384L380 150H360Z"/></g>` +
      '<path d="M390 48V200" stroke="#3a2c24" stroke-width="5" stroke-dasharray="8 5" fill="none"/>' +
      '<path d="M330 410H392L388 456H334Z" fill="#1d130e" stroke="#3a2418" stroke-width="2"/>' +
      '<ellipse cx="361" cy="410" rx="31" ry="6" fill="#1d5560" fill-opacity=".8"/>' +
      '<circle class="df-stm" cx="361" cy="400" r="26" fill="url(#df-steam)" style="animation:df-steam 3.4s ease-out infinite;opacity:0"/>',
    front:
      '<g transform="translate(414 306)">' +
      `<circle class="df-sp" cx="0" cy="0" r="2" fill="${HOT}" style="--dx:-14px;--dy:-26px"/>` +
      `<circle class="df-sp" cx="0" cy="0" r="2" fill="${HOT}" style="--dx:12px;--dy:-30px"/>` +
      `<circle class="df-sp" cx="0" cy="0" r="1.6" fill="#ffe9b0" style="--dx:0px;--dy:-36px"/></g>`,
  }
}
