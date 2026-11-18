import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Henchbot Lair: an evil genius at a villain console inside a hollow volcano at night. A giant ray cannon on the left
// aims up through the crater at a huge moon; two dozen tiny teal helper bots waddle on the catwalks, ride the
// conveyor and study the moon plan on the wall. When a command runs the cannon's rings charge one by one and its beam
// hits the moon, which shrinks a little. On an error the bots pile into a heap and the beam fizzles to smoke.
const LIME = '#b8f03a'
const CORAL = '#d97757'
const TEAL = '#34a99d'
const TEAL_D = '#23786f'
const CREAM = '#e9dfc2'
const CRATE = '#5a3d26'
const METAL = '#2b2036'
const EDGE = '#3d3050'
const DECK = '#211829'
const CAPE = '#5a2490'
const CAPE_D = '#2c1046'

// The moon, and the cannon's pivot: the barrel is drawn pointing up, then tilted onto the moon.
const MX = 165
const MY = 178
const MR = 118
const PX = 300
const PY = 745
const TILT = f((Math.atan2(MX - PX, PY - MY) * 180) / Math.PI)
const REACH = Math.round(Math.hypot(MX - PX, MY - PY))
const LENS_AT = 366

// Where the bots on the left fall in an error: a heap at the cannon's foot (x, y, how it lands tilted).
const HEAP: readonly (readonly [number, number, number])[] = [
  [154, 792, -8],
  [174, 792, 12],
  [194, 792, -14],
  [214, 792, 6],
  [164, 775, 18],
  [184, 775, -10],
  [204, 775, 22],
  [174, 758, -20],
  [194, 758, 9],
  [184, 741, -6],
  [128, 792, -92],
]

// A bot's parts take their colours from the style: body, belly, lens eye, lime pupil and antenna tip, arms.
const BODY =
  '<path d="M-10-14a10 11 0 1 0 20 0a10 11 0 1 0-20 0M-8-3.5h6v3.5h-6M2-3.5h6v3.5h-6M-1-25h2v-7h-2"/>' +
  '<path class="hb-bl" d="M-8.5-12A8.5 7.5 0 0 0 8.5-12Z"/><circle cx="3" cy="-16" r="5"/>' +
  '<path class="hb-lm" d="M2.5-18h3.5v3.5h-3.5ZM-2.2-36h4.4v4.4h-4.4Z"/>'
const ARMS = {
  cheer: '<path class="hb-a hb-arm" d="M-9-13l-5 6M9-13l5 6"/>',
  salute: '<path class="hb-a" d="M-9-13l-5 6M8-14l5-9"/>',
  carry: '<path class="hb-a" d="M-9-15l-3-11M9-15l3-11"/><rect class="hb-cr" x="-13" y="-41" width="26" height="14" rx="2"/>',
}

type Bot = { x: number; y: number; k: number; s?: number; flip?: boolean; role?: string; vars?: string; arms?: keyof typeof ARMS }

/** One helper bot standing on its feet at (x, y): a round teal body, a cream belly, one big lens eye, one antenna. */
function bot(b: Bot): string {
  const s = b.s ?? 1
  const scale = s === 1 && b.flip !== true ? '' : ` scale(${b.flip === true ? -s : s} ${s})`

  return (
    `<g transform="translate(${f(b.x)} ${f(b.y)})${scale}">` +
    `<g class="hb-mv${b.role === undefined ? '' : ` ${b.role}`}" style="--k:${b.k}${b.vars === undefined ? '' : `;${b.vars}`}">` +
    `<g class="hb-wd">${BODY}${ARMS[b.arms ?? 'cheer']}</g></g></g>`
  )
}

/** The move from a bot's spot to a target, in its own scaled and maybe mirrored frame. */
function toward(x: number, y: number, s: number, flip: boolean, tx: number, ty: number): [string, string] {
  return [`${f((tx - x) / (flip ? -s : s))}px`, `${f((ty - y) / s)}px`]
}

/** Claude's coral starburst: twelve rays. */
function starburst(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI) / 12
    const at = i % 2 === 0 ? r : r * 0.3

    return `${f(cx + at * Math.cos(a))} ${f(cy + at * Math.sin(a))}`
  })

  return `M${points.join('L')}Z`
}

/** A catwalk along the wall: back rail, truss, deck and a row of small running lights. */
function catwalk(x0: number, x1: number, y: number): string {
  let posts = ''
  let lights = ''

  for (let x = x0 + 20; x < x1; x += 44) {
    posts += `M${x} ${y}V${y - 26}`
    lights += `M${x + 18} ${y + 3}h4v3h-4Z`
  }

  return (
    `<path d="M${x0} ${y - 26}H${x1}${posts}" stroke="#2e2338" stroke-width="3" fill="none"/>` +
    `<path d="M${x0} ${y + 22}H${x1}M${x0} ${y + 8}${'l14 14 14-14'.repeat(Math.floor((x1 - x0) / 28))}" stroke="#1f1728" stroke-width="2" fill="none"/>` +
    `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="8" fill="${DECK}" stroke="#3a2c44" stroke-width="1.5"/>` +
    `<path d="${lights}" fill="${LIME}" fill-opacity=".45"/>`
  )
}

/** The ray cannon: platform, tilted barrel with five charge rings and a pronged emitter, the dome it rises from. */
function cannon(): string {
  const half = (y: number) => 30 - ((10 - y) * 9) / 340
  const rings = [0, 1, 2, 3, 4]
    .map(i => {
      const y = -95 - i * 52
      const w = half(y) + 9

      return (
        `<rect x="${f(-w)}" y="${y - 8}" width="${f(w * 2)}" height="16" rx="5" fill="#2a2036" stroke="${EDGE}" stroke-width="2"/>` +
        `<g class="hb-rg" style="--i:${i};--j:${4 - i}"><ellipse cy="${y}" rx="${f(w + 24)}" ry="24" fill="url(#hb-ringg)"/>` +
        `<rect x="${f(-w + 2)}" y="${y - 5}" width="${f(w * 2 - 4)}" height="10" rx="4" fill="${LIME}"/></g>`
      )
    })
    .join('')

  return (
    // The platform it stands on.
    `<path d="M140 862H462V908H140Z" fill="#140e1a" stroke="${EDGE}" stroke-width="2"/>` +
    '<path d="M176 866V908M300 866V908M424 866V908" stroke="#1f1728" stroke-width="6"/>' +
    `<path d="M140 862L162 794H438L462 862Z" fill="#1a1322" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M162 795H438" stroke="${LIME}" stroke-opacity=".28" stroke-width="2"/>` +
    `<path d="M158 834${'l8-14h10l-8 14h12'.repeat(13)}" fill="#3a4614"/>` +
    `<path class="hb-led" d="M160 846H444" stroke="${LIME}" stroke-opacity=".4" stroke-width="2" stroke-dasharray="3 9"/>` +
    // The barrel, its beam, rings and emitter.
    `<g transform="translate(${PX} ${PY}) rotate(${TILT})"><g class="hb-gun">` +
    `<g class="hb-beam"><rect x="-22" y="${-REACH}" width="44" height="${REACH - LENS_AT}" fill="url(#hb-beamg)"/>` +
    `<rect x="-4.5" y="${-REACH}" width="9" height="${REACH - LENS_AT}" rx="4" fill="#f4ffd6"/></g>` +
    `<path d="M-30 10L-21-330H21L30 10Z" fill="url(#hb-barg)" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    '<path d="M-25 0L-17-322" stroke="#7a70a8" stroke-opacity=".45" stroke-width="2"/>' +
    rings +
    `<rect x="-26" y="-342" width="52" height="14" rx="4" fill="#2a2036" stroke="${EDGE}" stroke-width="2"/>` +
    '<path d="M-22-342L-13-382L-6-380L-11-342ZM22-342L13-382L6-380L11-342Z" fill="#3a2f48" stroke="#4a3d5a" stroke-width="1.5"/>' +
    `<circle class="hb-lh" cy="${-LENS_AT}" r="34" fill="url(#hb-lensg)"/>` +
    `<circle class="hb-lens" cy="${-LENS_AT}" r="8" fill="${LIME}"/>` +
    '</g></g>' +
    // The dome the barrel rises out of, with the starburst on it.
    `<circle cx="${PX}" cy="${PY}" r="62" fill="url(#hb-domeg)" stroke="${EDGE}" stroke-width="3"/>` +
    '<path d="M238 752Q300 774 362 752" fill="none" stroke="#120c18" stroke-width="4"/>' +
    `<path d="${starburst(PX, PY + 22, 19)}" fill="${CORAL}" fill-opacity=".9"/>`
  )
}

/** The villain console: a sloped deck, a target screen, one big button and two big levers. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `M${250 + i * 13} 320h9v4h-9Z`).join('')
  const pull = activity === 'run' ? 18 : -14
  const lever = (x: number, knob: string) =>
    `<g transform="translate(${x} 300) rotate(${pull})"><path d="M-2.5 0V-40H2.5V0Z" fill="#4a3d58"/>` +
    `<circle cy="-42" r="7" fill="${knob}"/><circle cx="-2.5" cy="-44.5" r="2" fill="#fff" fill-opacity=".45"/></g>`

  return (
    `<path d="M232 330L246 298H408L416 330Z" fill="${METAL}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="${keys}" fill="${light}" fill-opacity=".55"/>` +
    '<rect x="322" y="282" width="12" height="18" fill="#1a1322"/>' +
    `<rect x="282" y="210" width="96" height="74" rx="6" fill="#140e1b" stroke="${EDGE}" stroke-width="3"/>` +
    `<rect x="290" y="218" width="80" height="58" rx="3" fill="${light}" fill-opacity=".2"/>` +
    `<g fill="none" stroke="${light}" stroke-width="2" stroke-opacity=".85"><circle cx="350" cy="242" r="12"/><path d="M350 225V259M333 242H367"/></g>` +
    `<path d="M296 226h26v3h-26ZM296 234h18v3h-18ZM296 242h22v3h-22ZM296 264h66v4h-66Z" fill="${light}" fill-opacity=".7"/>` +
    '<path d="M324 210V202h12v8" fill="#1a1322"/><circle class="hb-warn" cx="330" cy="200" r="5" fill="#ff5a4a"/>' +
    `<ellipse cx="358" cy="307" rx="16" ry="5" fill="#120c18" stroke="${LIME}" stroke-opacity=".5" stroke-width="1.5"/>` +
    '<g class="hb-btn"><path d="M346 306a12 10 0 0 1 24 0Z" fill="#ff5a4a"/>' +
    '<path d="M350 301a7 5 0 0 1 9-4" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></g>' +
    '<rect x="383" y="296" width="28" height="7" rx="2" fill="#120c18"/>' +
    lever(390, LIME) +
    lever(404, CORAL)
  )
}

const STYLE =
  // The bots: colours, a waddle each, two walkers that turn around, two pairs that keep bumping into each other.
  `.hb-wd{fill:${TEAL};animation:hb-wad calc(.9s + var(--k) * .013s) ease-in-out calc(var(--k) * -.37s) infinite alternate}` +
  `.hb-bl{fill:${CREAM}}.hb-wd>circle{fill:#0b1418;stroke:${CREAM};stroke-width:2px}.hb-lm{fill:${LIME};opacity:.85}` +
  `.hb-a{fill:none;stroke:${TEAL_D};stroke-width:3px;stroke-linecap:round}.hb-cr{fill:${CRATE};stroke:#2c1c10;stroke-width:1.5px}` +
  '@keyframes hb-wad{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
  '.st-responding .hb-wd{animation-duration:.7s}.st-tool .hb-wd{animation-duration:.42s}' +
  '.hb-walk{animation:hb-walk var(--ws) ease-in-out var(--wl) infinite}' +
  '@keyframes hb-walk{0%{transform:translateX(0) scaleX(1)}45%{transform:translateX(var(--wx)) scaleX(1)}50%{transform:translateX(var(--wx)) scaleX(-1)}95%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}' +
  '.hb-bump{animation:hb-bump 3.4s ease-in-out infinite}' +
  '@keyframes hb-bump{0%,100%{transform:translateX(0)}40%{transform:translateX(var(--bx))}46%{transform:translateX(calc(var(--bx) - 7px))}54%{transform:translateX(calc(var(--bx) - 4px))}}' +
  '.hb-arm{transform-box:fill-box;transform-origin:50% 0}' +
  // Ambient: stars twinkle, the lava breathes, the belt runs, the banner sways, the cape stirs.
  '.hb-st{animation:hb-tw 3.6s ease-in-out infinite alternate}@keyframes hb-tw{from{opacity:.35}to{opacity:1}}' +
  '.hb-lava{animation:hb-lava 5s ease-in-out infinite alternate}@keyframes hb-lava{from{opacity:.7}to{opacity:1}}' +
  '.hb-bub{opacity:0;transform-box:fill-box;transform-origin:center;animation:hb-bub 3.2s ease-in infinite}' +
  '@keyframes hb-bub{0%{opacity:0;transform:scale(.4)}30%{opacity:.8}88%{opacity:.8;transform:translateY(-8px) scale(1)}100%{opacity:0;transform:translateY(-10px) scale(1.6)}}' +
  '.hb-led{animation:hb-led 2.6s ease-in-out infinite alternate}@keyframes hb-led{from{opacity:.45}to{opacity:1}}' +
  '.hb-flag{transform-origin:1320px 54px;animation:hb-flag 6s ease-in-out infinite alternate}@keyframes hb-flag{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
  '.hb-cape{transform-origin:72px 258px;animation:hb-cape 3.8s ease-in-out infinite alternate}@keyframes hb-cape{to{transform:rotate(4deg)}}' +
  'svg{--rd:40s;--bt:2.4s}.st-responding{--rd:24s;--bt:1.4s}.st-tool,.st-run{--rd:13s;--bt:.8s}' +
  '.hb-belt{stroke-dasharray:9 7;animation:hb-belt var(--bt) linear infinite}@keyframes hb-belt{to{stroke-dashoffset:-16}}' +
  '.hb-ride{animation:hb-ride var(--rd) linear infinite;animation-delay:calc(var(--p) * var(--rd) * -1)}' +
  '@keyframes hb-ride{0%{opacity:0;transform:translateX(0)}6%,90%{opacity:1}100%{opacity:0;transform:translateX(486px)}}' +
  '.st-error .hb-ride,.st-error .hb-belt{animation-play-state:paused}' +
  // The cannon at rest: the rings hum faintly.
  '.hb-rg,.hb-lh,.hb-beam,.hb-hit,.hb-hs,.hb-smk,.hb-ws,.hb-tg,.hb-cf,.hb-sig,.hb-scan,.hb-bglow{opacity:0}.hb-lens{opacity:.55}' +
  '.st-idle .hb-rg,.st-responding .hb-rg{animation:hb-stand 4s ease-in-out calc(var(--i) * -.8s) infinite alternate}@keyframes hb-stand{to{opacity:.16}}' +
  '.hb-beam{transform-box:fill-box;transform-origin:50% 100%}.hb-moon,.hb-smk,.hb-cf,.hb-sig,.hb-tg{transform-box:fill-box;transform-origin:center}' +
  // Thinking: everyone stops and looks up; the ledge crew gathers at the moon plan, which lights up.
  '.st-thinking .hb-mv,.st-run .hb-mv,.st-error .hb-mv{animation:none}' +
  '.st-thinking .hb-wd,.st-read .hb-ldg .hb-wd{animation:hb-look .7s ease-out both}@keyframes hb-look{to{transform:rotate(-12deg)}}' +
  '.st-thinking .hb-gather{animation:hb-gather 1.2s ease-in-out .1s both}@keyframes hb-gather{to{transform:translateX(var(--gx))}}' +
  '.hb-plan{opacity:.45}.st-thinking .hb-plan,.st-thinking .hb-bglow{animation:hb-lit .8s ease-out both}@keyframes hb-lit{to{opacity:1}}' +
  '.hb-arc{stroke-dasharray:5 5;animation:hb-march 1.2s linear infinite}@keyframes hb-march{to{stroke-dashoffset:-10}}' +
  // Read: the plan draws itself again while a scan line runs down it.
  '.st-read .hb-plan{stroke-dasharray:1;animation:hb-draw 1.6s ease-in-out both}@keyframes hb-draw{from{stroke-dashoffset:1;opacity:1}to{stroke-dashoffset:0;opacity:1}}' +
  '.st-read .hb-scan{animation:hb-scan 1.5s ease-in-out infinite}@keyframes hb-scan{0%{opacity:0;transform:translateY(0)}15%,85%{opacity:.8}100%{opacity:0;transform:translateY(118px)}}' +
  // Tool: the welder at the dome throws sparks.
  '.st-tool .hb-ws{animation:hb-ws .7s ease-out calc(var(--i) * -.064s) infinite}' +
  '@keyframes hb-ws{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--sx),var(--sy))}}' +
  '.st-tool .hb-tg{animation:hb-tg .6s ease-in-out infinite alternate}@keyframes hb-tg{from{opacity:.5;transform:scale(.8)}to{opacity:1;transform:scale(1.1)}}' +
  // Web: the dish turns, signal rings go up, every bot's eye and antenna pings in a wave.
  '.hb-dish{transform-box:fill-box;transform-origin:50% 100%}.st-web .hb-dish{animation:hb-turn 1.6s ease-in-out infinite alternate}' +
  '@keyframes hb-turn{from{transform:scaleX(1)}to{transform:scaleX(-.6)}}' +
  '.st-web .hb-sig{animation:hb-sig 1.5s ease-out calc(var(--i) * .5s) infinite}@keyframes hb-sig{0%{opacity:0;transform:scale(.3)}25%{opacity:.7}100%{opacity:0;transform:scale(1.8)}}' +
  '.st-web .hb-lm{animation:hb-ping 1.1s ease-in-out calc(var(--k) * -.09s) infinite}@keyframes hb-ping{0%,100%{opacity:.25}50%{opacity:1}}' +
  // Run: the rings charge one by one, the lens swells, the beam fires and the moon shrinks; the crew looks up.
  '.st-run .hb-rg{animation:hb-on .25s ease-out calc(.15s + var(--i) * .22s) both,hb-hum .9s ease-in-out 1.6s infinite alternate}' +
  '@keyframes hb-on{from{opacity:0}to{opacity:1}}@keyframes hb-hum{from{opacity:1}to{opacity:.72}}' +
  '.st-run .hb-lh,.st-run .hb-lens{animation:hb-on .4s ease-out 1s both}' +
  '.st-run .hb-beam{animation:hb-fire .22s ease-out 1.3s both,hb-shim .5s ease-in-out 1.6s infinite alternate}' +
  '@keyframes hb-fire{from{opacity:1;transform:scaleY(0)}to{opacity:1;transform:scaleY(1)}}@keyframes hb-shim{from{opacity:1}to{opacity:.78}}' +
  '.st-run .hb-hit{animation:hb-on .3s ease-out 1.48s both,hb-shim .6s ease-in-out 1.8s infinite alternate}' +
  '.st-run .hb-hs{animation:hb-ws .9s ease-out calc(1.5s + var(--i) * .15s) infinite}' +
  '.st-run .hb-moon{animation:hb-shrink 1.3s ease-in-out 1.5s both}@keyframes hb-shrink{to{transform:scale(.8)}}' +
  '.st-run .hb-gun{animation:hb-kick 1.2s ease-out 1.3s both}@keyframes hb-kick{0%{transform:translateY(0)}8%{transform:translateY(10px)}100%{transform:translateY(0)}}' +
  '.st-run .hb-wd{animation:hb-look .5s ease-out 1.3s both}' +
  '.hb-btn{transform-box:fill-box;transform-origin:50% 100%}.st-run .hb-btn{animation:hb-press 1.4s ease-in-out infinite}' +
  '@keyframes hb-press{0%,55%,100%{transform:scaleY(1)}68%{transform:scaleY(.55)}}' +
  // Error: the beam sputters out in smoke, the barrel droops, the rings die, the bots pile into a heap.
  '.hb-warn{opacity:.25}.st-error .hb-warn{animation:hb-warn .9s ease-in-out infinite alternate}@keyframes hb-warn{from{opacity:.25}to{opacity:1}}' +
  '.st-error .hb-beam{animation:hb-fizz 1.3s ease-out .1s both}' +
  '@keyframes hb-fizz{0%{opacity:1;transform:scaleY(0)}14%{opacity:1;transform:scaleY(.34)}24%{transform:scaleY(.16)}34%{opacity:.9;transform:scaleY(.28)}55%{opacity:.5;transform:scaleY(.06)}70%,100%{opacity:0;transform:scaleY(0)}}' +
  '.st-error .hb-rg{animation:hb-die .6s ease-in calc(.3s + var(--j) * .12s) both}@keyframes hb-die{from{opacity:.8}to{opacity:0}}' +
  '.st-error .hb-gun{animation:hb-droop 1.1s cubic-bezier(.3,1.5,.5,1) .35s both}@keyframes hb-droop{to{transform:rotate(-8deg)}}' +
  '.st-error .hb-smk{animation:hb-smk 2.6s ease-out calc(.45s + var(--i) * .4s) infinite}' +
  '@keyframes hb-smk{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.55}100%{opacity:0;transform:translate(var(--sx),-170px) scale(2.6)}}' +
  '.st-error .hb-wd{animation:hb-panic .2s ease-in-out infinite alternate}@keyframes hb-panic{from{transform:translateX(-2px) rotate(-8deg)}to{transform:translateX(2px) rotate(8deg)}}' +
  '.st-error .hb-pile{animation:hb-pile .7s var(--pd) both}' +
  '@keyframes hb-pile{0%{transform:translate(0,0) rotate(0);animation-timing-function:ease-out}30%{transform:translate(calc(var(--hx) * .3),calc(var(--hy) * .3 - 30px)) rotate(calc(var(--hr) * .5));animation-timing-function:ease-in}100%{transform:translate(var(--hx),var(--hy)) rotate(var(--hr))}}' +
  '.st-error .hb-pile .hb-wd{animation:hb-dizzy 1.3s ease-in-out 1s infinite alternate}@keyframes hb-dizzy{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
  // Done: the bots hop with their arms thrown up, the cannon pops confetti, the rings chase.
  '.st-done .hb-mv{animation:hb-hop .6s ease-out calc(var(--k) * .011s) 5}@keyframes hb-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}}' +
  '.st-done .hb-arm{animation:hb-cheer .3s ease-out both}@keyframes hb-cheer{to{transform:scale(1.1,-1.7)}}' +
  '.st-done .hb-cf{animation:hb-cf 3.4s linear var(--cd) both}' +
  '@keyframes hb-cf{0%{opacity:1;transform:translate(0,0) rotate(0);animation-timing-function:cubic-bezier(.2,.7,.4,1)}28%{opacity:1;transform:translate(var(--cx),var(--cy)) rotate(calc(var(--cr) * .4))}85%{opacity:.9}100%{opacity:0;transform:translate(calc(var(--cx) * 1.2),calc(var(--cy) + 300px)) rotate(var(--cr))}}' +
  '.st-done .hb-rg{animation:hb-chase 1.2s ease-in-out calc(var(--i) * .2s) infinite}@keyframes hb-chase{0%,100%{opacity:.12}40%{opacity:.85}}' +
  '.st-done .hb-lh{animation:hb-pop .9s ease-out both}@keyframes hb-pop{0%{opacity:0}20%{opacity:1}100%{opacity:0}}' +
  // A few of the rig's finer moments.
  '.st-sleeping .hb-lm{opacity:.3}.st-sleeping .hb-wd{animation-duration:3s}'

export function henchbotLairWorld(): World {
  const next = random(4242)

  // Pixel stars in three twinkling sets, one path each.
  const stars = [0, 1, 2]
    .map(set => {
      let d = ''

      for (let i = 0; i < 16; i += 1) {
        const x = -20 + next() * 1000
        const y = next() * 330
        const size = x > 420 ? 2 : 3

        d += `M${f(x)} ${f(y)}h${size}v${size}h-${size}Z`
      }

      return `<path class="hb-st" style="animation-delay:${-set * 1.4}s" d="${d}" fill="#dfe4ff" fill-opacity="${set === 2 ? 0.5 : 0.8}"/>`
    })
    .join('')

  // The crater's jagged opening, its rim lit by the moon.
  const rim =
    'M1010 -40L990 20L960 40L930 30L900 78L860 92L820 84L790 128L740 140L700 136L668 176L620 190L580 186L548 224L500 238L470 232' +
    'L440 270L400 290L370 284L340 318L300 326L270 316L240 344L200 350L170 340L140 362L100 368L70 356L40 378L0 384L-40 380'
  const craters = [
    [118, 110, 20],
    [200, 92, 12],
    [150, 190, 26],
    [222, 168, 10],
    [96, 168, 9],
    [190, 236, 13],
    [240, 120, 7],
  ]
    .map(([x, y, r]) => `M${x! - r!} ${y! + MY - 150}a${r} ${r} 0 1 0 ${r! * 2} 0a${r} ${r} 0 1 0 ${-r! * 2} 0Z`)
    .join('')

  // The bots on the left: catwalks and the platform. Each knows its heap slot for an error.
  type Left = { x: number; y: number; flip?: boolean; walk?: [number, number]; bump?: boolean; heap?: number }
  const left: Left[] = [
    { x: 22, y: 560, walk: [34, 7], heap: 10 },
    { x: 62, y: 560, heap: 7 },
    { x: 98, y: 560, bump: true, heap: 8 },
    { x: 142, y: 560, flip: true, bump: true, heap: 9 },
    { x: 188, y: 560, heap: 6 },
    { x: 18, y: 690, heap: 1 },
    { x: 60, y: 690, walk: [70, 9], heap: 4 },
    { x: 150, y: 690, flip: true, heap: 5 },
    { x: 196, y: 690, heap: 2 },
    { x: 168, y: 792, heap: 0 },
    { x: 206, y: 792, flip: true, heap: 3 },
    { x: 388, y: 792, flip: true },
  ]
  const leftBots = left
    .map((b, k) => {
      const roles: string[] = []
      const vars: string[] = []

      if (b.walk !== undefined) {
        roles.push('hb-walk')
        vars.push(`--wx:${b.walk[0]}px;--ws:${b.walk[1]}s;--wl:${f(-next() * 4)}s`)
      }

      if (b.bump === true) {
        roles.push('hb-bump')
        vars.push('--bx:11px')
      }

      const slot = b.heap === undefined ? undefined : HEAP[b.heap]

      if (slot !== undefined && b.heap !== undefined) {
        const [hx, hy] = toward(b.x, b.y, 1, b.flip === true, slot[0], slot[1])

        roles.push('hb-pile')
        vars.push(`--hx:${hx};--hy:${hy};--hr:${slot[2]}deg;--pd:${f(0.05 + b.heap * 0.07)}s`)
      }

      return bot({ x: b.x, y: b.y, k, flip: b.flip, role: roles.join(' ') || undefined, vars: vars.join(';') || undefined })
    })
    .join('')

  // The conveyor into the hatch: crates and crate-carrying bots ride it.
  const rollers = Array.from({ length: 15 }, (_, i) => `M${-30 + i * 32} 887a5 5 0 1 0 10 0a5 5 0 1 0-10 0Z`).join('')
  const cargo = [0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86]
    .map((p, i) => {
      const load =
        i % 2 === 1
          ? bot({ x: -70, y: 880, k: 20 + i, arms: 'carry' })
          : `<rect class="hb-cr" x="-83" y="858" width="26" height="22" rx="2"/><circle cx="-70" cy="869" r="4.5" fill="${CREAM}" fill-opacity=".55"/>`

      return `<g class="hb-ride" style="--p:${p}">${load}</g>`
    })
    .join('')

  // The welder's sparks, the smoke of a failed shot, the beam's hits on the moon, the confetti of a win.
  const welds = Array.from(
    { length: 11 },
    (_, i) =>
      `<rect class="hb-ws" style="--i:${i};--sx:${f(12 + next() * 52)}px;--sy:${f(-40 + next() * 80)}px" x="360" y="772" width="6" height="6" fill="${i % 2 === 1 ? '#ffe27a' : LIME}"/>`,
  ).join('')
  const smoke = Array.from(
    { length: 6 },
    (_, i) =>
      `<circle class="hb-smk" style="--i:${i};--sx:${f(16 + next() * 50)}px" cx="${f(162 + next() * 10)}" cy="${f(398 + next() * 8)}" r="${f(12 + next() * 6)}" fill="#6e6276"/>`,
  ).join('')
  const hits = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + 0.4

    return `<rect class="hb-hs" style="--i:${i};--sx:${f(Math.cos(a) * 80)}px;--sy:${f(Math.sin(a) * 80)}px" x="${MX - 2}" y="${MY - 2}" width="4" height="4" fill="#f4ffd6"/>`
  }).join('')
  const confetti = (count: number, x: number, y: number, spread: [number, number], seed: number) => {
    const pick = random(seed)
    const tones = [LIME, CORAL, TEAL, CREAM, '#b070e0', '#ffcf4d']

    return Array.from({ length: count }, (_, i) => {
      const cx = spread[0] + pick() * (spread[1] - spread[0])
      const cy = -60 - pick() * 200

      return (
        `<rect class="hb-cf" style="--cx:${f(cx)}px;--cy:${f(cy)}px;--cr:${f((pick() - 0.5) * 900)}deg;--cd:${f(pick() * 0.3)}s" ` +
        `x="${x}" y="${y}" width="${f(5 + pick() * 4)}" height="${f(3 + pick() * 3)}" fill="${tones[i % tones.length]}"/>`
      )
    }).join('')
  }

  // The ledge by the desk: bots that gather in front of the moon plan while Claude thinks.
  type Ledge = { x: number; arms?: keyof typeof ARMS; walk?: number; bump?: boolean; flip?: boolean }
  const ledge: Ledge[] = [{ x: 8 }, { x: 58, arms: 'carry' }, { x: 128, bump: true }, { x: 170, bump: true, flip: true }, { x: 312, walk: 30 }, { x: 372 }]
  const gather = [196, 222, 248, 274, 300, 326]
  const pile: readonly (readonly [number, number, number])[] = [
    [226, -60, -8],
    [252, -60, 10],
    [278, -60, -14],
    [239, -83, 16],
    [265, -83, -6],
    [252, -106, 12],
  ]
  const ledgeBots = ledge
    .map((b, i) => {
      const flip = b.flip ?? b.x > 262
      const roles = ['hb-ldg', 'hb-gather', 'hb-pile']
      const [gx] = toward(b.x, -60, 1.3, flip, gather[i] ?? b.x, -60)
      const slot: readonly [number, number, number] = pile[i] ?? [b.x, -60, 0]
      const [hx, hy] = toward(b.x, -60, 1.3, flip, slot[0], slot[1])
      const vars = [`--gx:${gx};--hx:${hx};--hy:${hy};--hr:${slot[2]}deg;--pd:${f(0.05 + i * 0.08)}s`]

      if (b.walk !== undefined) {
        roles.push('hb-walk')
        vars.push(`--wx:${b.walk}px;--ws:8s;--wl:-2s`)
      }

      if (b.bump === true) {
        roles.push('hb-bump')
        vars.push('--bx:6.5px')
      }

      return bot({ x: b.x, y: -60, k: 30 + i, s: 1.3, flip, role: roles.join(' '), vars: vars.join(';'), arms: b.arms })
    })
    .join('')
  const floorBots =
    bot({ x: 38, y: 456, k: 40, s: 1.4, arms: 'salute' }) + bot({ x: 262, y: 456, k: 41, s: 1.3, flip: true }) + bot({ x: 330, y: 456, k: 42, s: 1.3 })

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'bits',
      ink: '#08040b',
      furniture: '#1e1527',
      metal: METAL,
      paper: '#e9e2c9',
      light: { idle: '#7fb33a', work: LIME, bright: '#e2ffa0' },
      headTop: 238,
      glowAt: [330, 247],
      device,
      wear: {
        behind:
          // The cape falls behind the chair; the high collar flares up on both sides of the head, lining toward us.
          `<path class="hb-cape" d="M72 258C48 296 34 346 24 398L38 390L48 404L64 390L80 402L96 386L108 352Z" fill="${CAPE}" stroke="${CAPE_D}" stroke-width="2"/>` +
          `<path d="M74 300C50 272 32 240 25 198Q60 226 102 230H198Q242 226 280 198C272 240 252 272 226 300Z" fill="${CAPE}" stroke="${CAPE_D}" stroke-width="2" stroke-linejoin="round"/>` +
          '<path d="M80 286C58 262 42 240 36 212Q66 234 104 240H196Q234 234 264 212C258 240 242 262 220 286Z" fill="#9a48c8"/>' +
          '<path d="M25 198Q60 226 102 230H198Q242 226 280 198" fill="none" stroke="#c890f0" stroke-opacity=".7" stroke-width="2"/>',
        front:
          // The collar's front edges on the shoulders, and welding goggles pushed up on the forehead, clear of the eyes.
          `<path d="M70 250H90L70 292ZM230 250H210L230 292Z" fill="${CAPE}"/>` +
          '<rect x="68" y="239" width="164" height="7" fill="#24182c"/>' +
          `<g fill="${LIME}" fill-opacity=".38" stroke="#2e2238" stroke-width="5"><circle cx="122" cy="235" r="12"/><circle cx="178" cy="235" r="12"/></g>` +
          '<path d="M114 231a9 9 0 0 1 7-5M170 231a9 9 0 0 1 7-5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>',
      },
      seatArt:
        `<rect x="104" y="348" width="94" height="14" rx="6" fill="${CAPE}" stroke="#7a3ab0" stroke-width="2"/>` +
        '<rect x="144" y="362" width="14" height="72" fill="#1e1527"/>' +
        '<path d="M108 452L151 432L194 452" stroke="#1e1527" stroke-width="8" stroke-linecap="round" fill="none"/>' +
        `<path d="M116 440H186" stroke="${LIME}" stroke-opacity=".35" stroke-width="2"/>`,
      tableArt:
        `<rect x="166" y="330" width="304" height="14" rx="2" fill="#1e1527" stroke="${EDGE}" stroke-width="1.6"/>` +
        `<path d="M170 337H462" stroke="${LIME}" stroke-opacity=".35" stroke-width="2"/>` +
        `<rect x="180" y="344" width="14" height="112" fill="#1e1527" stroke="${EDGE}" stroke-width="1.6"/>` +
        `<rect x="384" y="344" width="80" height="112" fill="#1e1527" stroke="${EDGE}" stroke-width="1.6"/>` +
        '<path d="M394 362H452M394 372H452M394 382H452" stroke="#0e0912" stroke-width="4"/>' +
        `<g class="hb-led" fill="${LIME}"><circle cx="398" cy="404" r="3"/><circle cx="410" cy="404" r="3" fill="${CORAL}"/></g>`,
    },
    style: STYLE,
    scenery:
      '<defs>' +
      `<radialGradient id="hb-sky" gradientUnits="userSpaceOnUse" cx="${MX}" cy="${MY}" r="900"><stop offset="0" stop-color="#1d2150"/><stop offset=".35" stop-color="#10123a"/><stop offset=".7" stop-color="#090a22"/><stop offset="1" stop-color="#07071a"/></radialGradient>` +
      '<radialGradient id="hb-halo"><stop offset="0" stop-color="#e8eaff" stop-opacity=".26"/><stop offset=".5" stop-color="#c8ccff" stop-opacity=".08"/><stop offset="1" stop-color="#c8ccff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hb-moong" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#f4efdc"/><stop offset=".6" stop-color="#d8d0b8"/><stop offset="1" stop-color="#9f9788"/></radialGradient>' +
      '<linearGradient id="hb-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17101f"/><stop offset=".35" stop-color="#0d0912"/><stop offset=".7" stop-color="#0c0810"/><stop offset="1" stop-color="#1a0b10"/></linearGradient>' +
      '<linearGradient id="hb-barg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3150"/><stop offset=".35" stop-color="#231b30"/><stop offset="1" stop-color="#110c17"/></linearGradient>' +
      '<radialGradient id="hb-domeg" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#3a3150"/><stop offset=".6" stop-color="#1e1729"/><stop offset="1" stop-color="#110c17"/></radialGradient>' +
      `<radialGradient id="hb-ringg"><stop offset="0" stop-color="${LIME}" stop-opacity=".55"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="hb-lensg"><stop offset="0" stop-color="#f4ffd6" stop-opacity=".9"/><stop offset=".4" stop-color="${LIME}" stop-opacity=".45"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="hb-beamg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${LIME}" stop-opacity="0"/><stop offset=".5" stop-color="${LIME}" stop-opacity=".6"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="hb-hitg"><stop offset="0" stop-color="#f4ffd6" stop-opacity=".95"/><stop offset=".35" stop-color="${LIME}" stop-opacity=".5"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="hb-torch"><stop offset="0" stop-color="#fff6c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hb-lavag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8501a" stop-opacity=".75"/><stop offset=".3" stop-color="#7a1c08" stop-opacity=".8"/><stop offset="1" stop-color="#2a0804"/></linearGradient>' +
      '<linearGradient id="hb-heat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a1a" stop-opacity="0"/><stop offset="1" stop-color="#ff5a1a" stop-opacity=".16"/></linearGradient>' +
      '</defs>' +
      // The night sky in the crater, the moon, and the rock of the volcano around the opening.
      '<rect width="1600" height="1000" fill="url(#hb-sky)"/>' +
      stars +
      `<g class="hb-moon"><circle cx="${MX}" cy="${MY}" r="250" fill="url(#hb-halo)"/><circle cx="${MX}" cy="${MY}" r="${MR}" fill="url(#hb-moong)"/>` +
      `<path d="${craters}" fill="#aaa18a" fill-opacity=".55"/></g>` +
      `<circle class="hb-hit" cx="${MX}" cy="${MY}" r="92" fill="url(#hb-hitg)"/>` +
      hits +
      `<path d="M-60 -60H1660V1060H-60Z${rim}L-40 -40Z" fill="url(#hb-rock)" fill-rule="evenodd"/>` +
      `<path d="${rim}" fill="none" stroke="#2a2442" stroke-width="6"/><path d="${rim}" fill="none" stroke="#6a5f94" stroke-opacity=".55" stroke-width="1.6"/>` +
      // Rock: strata, a darker slab on the left wall, teeth hanging from the crater lip, a glowing lava vein.
      '<path d="M-40 470C200 450 500 500 800 470S1400 430 1640 460M-40 760C300 740 600 790 900 770S1400 720 1640 750M300 400C600 380 900 420 1200 380" stroke="#1a1222" stroke-width="2" fill="none"/>' +
      '<path d="M-40 380L40 378L72 430L50 520L86 600L-40 640Z" fill="#0a070d" stroke="#1c1424" stroke-width="2"/>' +
      '<path d="M1000 -10L1000 40L1026 84L1050 40L1084 120L1112 46L1160 96L1190 30L1240 112L1270 40L1320 70L1350 20L1400 60L1440 -10Z" fill="#0a070d" stroke="#1c1424" stroke-width="2"/>' +
      '<g class="hb-lava"><path d="M18 640L44 700L30 760L62 820L50 880" fill="none" stroke="#ff6a2a" stroke-opacity=".16" stroke-width="10"/>' +
      '<path d="M18 640L44 700L30 760L62 820L50 880" fill="none" stroke="#ffa64a" stroke-opacity=".7" stroke-width="2"/></g>' +
      // A dark bridge across the lair.
      `<path d="M330 578H1200${Array.from({ length: 9 }, (_, i) => `M${360 + i * 100} 578V604`).join('')}M330 626H1200M330 612${'l30 14 30-14'.repeat(14)}" fill="none" stroke="#1c1424" stroke-width="2.5"/>` +
      '<rect x="330" y="604" width="870" height="8" fill="#150f1b"/>' +
      // The dish on the wall.
      '<g transform="translate(46 478) scale(1.4)"><path d="M-3 0V-16H3V0Z" fill="#2e2338"/><g class="hb-dish"><path d="M-18-26Q0-2 18-26Q0-14-18-26Z" fill="#3d3050" stroke="#5a4c6e" stroke-width="1.5"/>' +
      `<path d="M0-18L4-36" stroke="#5a4c6e" stroke-width="2"/><circle cx="4" cy="-37" r="2.5" fill="${LIME}"/></g>` +
      [0, 1, 2].map(i => `<circle class="hb-sig" style="--i:${i}" cx="4" cy="-37" r="14" fill="none" stroke="${LIME}" stroke-width="2"/>`).join('') +
      '</g>' +
      // Catwalks and a ladder on the left wall, then the cannon, then its crew.
      catwalk(-30, 218, 560) +
      catwalk(-30, 236, 690) +
      '<path d="M222 568V690M236 568V690M222 590H236M222 614H236M222 638H236M222 662H236" stroke="#2e2338" stroke-width="2.5"/>' +
      cannon() +
      leftBots +
      '<circle class="hb-tg" cx="362" cy="774" r="30" fill="url(#hb-torch)"/>' +
      welds +
      smoke +
      confetti(28, 213, 387, [-170, 150], 77) +
      // The floor, the lava channel, the conveyor into its hatch.
      '<g class="mv-b"><rect x="-40" y="840" width="1680" height="120" fill="url(#hb-heat)"/>' +
      '<path d="M-40 900H1640V952H-40Z" fill="#0e0810"/><path d="M-40 901H1640" stroke="#3a1c1a" stroke-width="2"/>' +
      '<g class="hb-lava"><rect x="-40" y="952" width="1680" height="64" fill="url(#hb-lavag)"/>' +
      `<path d="M-40 954Q60 948 160 954${'t200 0'.repeat(9)}" fill="none" stroke="#ffb060" stroke-opacity=".55" stroke-width="2"/></g>` +
      [
        [80, 0],
        [250, -1.1],
        [340, -2.3],
        [700, -0.6],
      ]
        .map(([x, d]) => `<circle class="hb-bub" style="animation-delay:${d}s" cx="${x}" cy="966" r="4" fill="#ff9a4a"/>`)
        .join('') +
      '<path d="M406 900V846Q433 818 460 846V900Z" fill="#050307" stroke="#3a2c44" stroke-width="3"/>' +
      `<circle class="hb-led" cx="433" cy="812" r="4" fill="${LIME}"/>` +
      `<rect x="-40" y="880" width="464" height="14" fill="#1a1322" stroke="#2e2338" stroke-width="1.5"/><path d="${rollers}" fill="#0b0810"/>` +
      '<path class="hb-belt" d="M-40 881H424" stroke="#4a3d5a" stroke-width="3"/>' +
      cargo +
      '</g>' +
      // The far right: a slab of wall, two pipes, and the starburst banner.
      '<g class="mv-r"><path d="M1460 -10H1640V560H1500L1474 420L1494 300L1452 160Z" fill="#0b070e" stroke="#1c1424" stroke-width="2"/>' +
      '<path d="M1522 -10V560M1558 -10V560" stroke="#150e1b" stroke-width="20"/>' +
      '<path d="M1512 100h20v10h-20ZM1548 160h20v10h-20ZM1512 260h20v10h-20ZM1548 340h20v10h-20ZM1512 420h20v10h-20Z" fill="#2a2036"/>' +
      `<path class="hb-led" d="M1520 104h4v3h-4ZM1556 344h4v3h-4Z" fill="${LIME}"/>` +
      '<g class="mv-t"><rect x="1244" y="46" width="152" height="8" rx="3" fill="#1e1527"/>' +
      '<g class="hb-flag"><path d="M1262 54H1378V250L1320 222L1262 250Z" fill="#33124e" stroke="#5a2a80" stroke-width="3"/>' +
      '<path d="M1272 64H1368V234L1320 210L1272 234Z" fill="none" stroke="#7a3ab0" stroke-opacity=".6" stroke-width="1.5"/>' +
      `<path d="${starburst(1320, 140, 36)}" fill="${CORAL}" fill-opacity=".85"/></g></g></g>`,
    nook:
      // The moon plan on the wall above the ledge, the ledge crew, the floor by the desk and its bots.
      '<defs><radialGradient id="hb-bgl"><stop offset="0" stop-color="#7fe0ff" stop-opacity=".22"/><stop offset="1" stop-color="#7fe0ff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="hb-bglow" cx="275" cy="-178" r="170" fill="url(#hb-bgl)"/>' +
      '<rect x="150" y="-246" width="250" height="136" rx="3" fill="#0d2433" stroke="#2f5a70" stroke-width="3"/>' +
      '<path d="M150 -212H400M150 -178H400M150 -144H400M200 -246V-110M250 -246V-110M300 -246V-110M350 -246V-110" stroke="#173a4c" stroke-width="1"/>' +
      '<path class="hb-plan" pathLength="1" d="M372-205a24 24 0 1 0-48 0a24 24 0 1 0 48 0M338-215l20 20M358-215l-20 20M312-242l10 10M386-242l-10 10M184-122L196-146L214-140L204-118ZM176-118H222M166-236H196M166-228H188M166-220H200" fill="none" stroke="#a8e6ff" stroke-width="2"/>' +
      `<path class="hb-arc" d="M210-148Q258-236 322-206" fill="none" stroke="${LIME}" stroke-opacity=".8" stroke-width="2"/>` +
      `<rect class="hb-scan" x="154" y="-240" width="242" height="3" fill="${LIME}"/>` +
      `<g fill="${CORAL}"><circle cx="158" cy="-238" r="3"/><circle cx="392" cy="-238" r="3"/></g>` +
      `<path d="M-40 -86H430${Array.from({ length: 8 }, (_, i) => `M${i * 60} -86V-60`).join('')}" stroke="#2e2338" stroke-width="3" fill="none"/>` +
      `<rect x="-40" y="-60" width="470" height="9" fill="${DECK}" stroke="#3a2c44" stroke-width="1.5"/>` +
      '<path d="M20 -51L50 -20M140 -51L110 -20M260 -51L290 -20M380 -51L350 -20" stroke="#1f1728" stroke-width="4"/>' +
      ledgeBots +
      '<path d="M-90 476L-46 450H440V480H-90Z" fill="#0e0810"/><path d="M-46 451H440" stroke="#3a1c1a" stroke-width="2"/>' +
      floorBots +
      confetti(16, 250, -150, [-170, 150], 91),
  }
}
