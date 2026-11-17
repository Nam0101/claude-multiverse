import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Robot Factory: the inside of a vast hall. Two big arms weld robots together on a conveyor, a gantry crane up top
// holds a giant half-built head. While a command runs the belt moves, the arms swing and spark, and a finished little
// robot rolls off and waves. An error jams an arm; a beacon turns and steam vents.
const AMBER = '#ffb21f'
const STEEL = '#232b36'
const STEEL_HI = '#3c4858'
const STEEL_LO = '#151b23'
const CYAN = '#8fe8ff'

/** A pendant lamp on a chain from the crane beam, with the cone of light it throws. */
function lamp(x: number, drop: number, cone: number, delay: number): string {
  return (
    `<g transform="translate(${x} 92)"><g class="rf-lp" style="animation-delay:${delay}s">` +
    `<path d="M0 0V${drop}" stroke="#0a0d12" stroke-width="3"/>` +
    `<path d="M-34 ${drop + 26}L-12 ${drop}H12L34 ${drop + 26}Z" fill="#1a212a" stroke="${STEEL_HI}" stroke-width="2" stroke-linejoin="round"/>` +
    `<ellipse cx="0" cy="${drop + 27}" rx="34" ry="5" fill="#ffe6a8" fill-opacity=".9"/>` +
    `<path d="M-30 ${drop + 30}L30 ${drop + 30}L${cone} 860L${-cone} 860Z" fill="url(#rf-cone)"/></g></g>`
  )
}

/** A big six-axis arm, shoulder at (x, y), reaching over the belt; `flip` mirrors it. */
function arm(x: number, y: number, flip: number, delay: number, jam: boolean): string {
  const upper =
    `<path d="M-6 -18L176 -13V13L-6 20Z" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M20 -13H48V13H20ZM110 -12H132V12H110Z" fill="${AMBER}" fill-opacity=".55"/>`
  const fore =
    `<path d="M-4 -13L150 -9V9L-4 13Z" fill="${STEEL}" stroke="${STEEL_HI}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M30 -10H50V10H30Z" fill="${AMBER}" fill-opacity=".55"/>` +
    // The wrist and the welding torch.
    `<g transform="translate(150 0)"><rect x="-4" y="-12" width="22" height="24" rx="4" fill="#2e3846" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<path d="M14 -5H40L50 4V12H36L28 6H14Z" fill="#171d26" stroke="${STEEL_HI}" stroke-width="2"/><circle cx="50" cy="8" r="3" fill="#ffd9a0"/></g>`

  return (
    `<g transform="translate(${x} ${y}) scale(${flip} 1)"><g transform="rotate(-5)"><g class="rf-a1" style="animation-delay:${delay}s">` +
    upper +
    `<g transform="translate(176 0) rotate(87)"><g class="rf-a2${jam ? ' rf-jm' : ''}" style="animation-delay:${delay + 0.3}s">${fore}</g>` +
    `<circle r="17" fill="#202833" stroke="${AMBER}" stroke-opacity=".7" stroke-width="3"/></g>` +
    `</g></g><circle r="27" fill="#1a212b" stroke="${STEEL_HI}" stroke-width="4"/><circle r="9" fill="${AMBER}" fill-opacity=".7"/></g>`
  )
}

/** A small boxy robot standing on the belt, feet at y 0. `lit` turns on its eyes. */
function bot(lit: boolean, waving: boolean): string {
  const eye = lit ? CYAN : '#0b2a35'

  return (
    `<circle cx="-11" cy="-8" r="8" fill="#10151c" stroke="${STEEL_HI}" stroke-width="2"/><circle cx="11" cy="-8" r="8" fill="#10151c" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="-19" y="-44" width="38" height="30" rx="5" fill="#34404e" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="-9" y="-37" width="18" height="10" rx="2" fill="#10151c"/><circle cx="0" cy="-32" r="2.6" fill="${AMBER}"/>` +
    `<rect x="-15" y="-68" width="30" height="22" rx="6" fill="#3f4c5c" stroke="${STEEL_HI}" stroke-width="2"/>` +
    `<rect x="-9" y="-61" width="5" height="8" rx="1.5" fill="${eye}"/><rect x="4" y="-61" width="5" height="8" rx="1.5" fill="${eye}"/>` +
    `<path d="M0 -68V-77" stroke="${STEEL_HI}" stroke-width="2.4"/><circle cx="0" cy="-79" r="3" fill="${lit ? AMBER : '#5a4a1c'}"/>` +
    `<rect x="-27" y="-42" width="8" height="18" rx="3" fill="#2a3340"/>` +
    (waving
      ? `<g transform="translate(19 -40)"><g class="rf-wv"><rect x="0" y="-3" width="8" height="22" rx="3" fill="#2a3340" transform="rotate(-150)"/></g></g>`
      : `<rect x="19" y="-42" width="8" height="18" rx="3" fill="#2a3340"/>`)
  )
}

/** The giant half-built head: plated on the left, open ribs and wires on the right, two empty eye sockets. */
function head(): string {
  const wires = [
    ['M30 60C60 100 40 150 70 200', AMBER],
    ['M60 40C100 90 90 150 112 190', '#3fb8c8'],
    ['M10 70C20 120 10 170 24 232', '#c0453a'],
  ]
    .map(([d, c]) => `<path d="${d}" fill="none" stroke="${c}" stroke-opacity=".7" stroke-width="3.4" stroke-linecap="round"/>`)
    .join('')
  const rivets = [-100, -70, -40, -12]
    .map(x => `<circle cx="${x}" cy="50" r="3" fill="${STEEL_HI}"/><circle cx="${x}" cy="232" r="3" fill="${STEEL_HI}"/>`)
    .join('')
  const socket = (x: number) =>
    `<circle cx="${x}" cy="124" r="36" fill="#05080b" stroke="#4a586c" stroke-width="6"/><circle cx="${x}" cy="124" r="24" fill="#0b2a35"/>` +
    `<g class="rf-eye"><circle cx="${x}" cy="124" r="92" fill="url(#rf-eg)"/><circle cx="${x}" cy="124" r="24" fill="#bff6ff"/><circle cx="${x}" cy="124" r="11" fill="#ffffff"/></g>`

  return (
    '<path d="M-72 0L-66 36M72 0L66 36" stroke="#6a7a90" stroke-width="5"/>' +
    `<rect x="-96" y="8" width="192" height="24" rx="5" fill="#1a212b" stroke="${STEEL_HI}" stroke-width="2.4"/>` +
    '<rect x="-122" y="32" width="244" height="224" rx="48" fill="#10151c"/>' +
    // The open right half: ribs, a dark cavity and wires.
    `<path d="M0 34Q92 32 120 98V190Q92 254 0 254Z" fill="#06090d"/><path d="M0 34Q92 32 120 98M0 254Q92 254 120 190M0 104H120M0 150H120M0 196H120M42 34V254M84 40V250" fill="none" stroke="#3a4656" stroke-width="4"/>` +
    wires +
    // The plated left half.
    `<path d="M-122 82Q-122 32 -74 32H0V256H-74Q-122 256 -122 208Z" fill="#2d3745" stroke="${STEEL_HI}" stroke-width="3" stroke-linejoin="round"/>` +
    '<path d="M-122 70H0M-60 32V256" stroke="#10151c" stroke-opacity=".7" stroke-width="3" fill="none"/>' +
    rivets +
    `<path d="M-110 90Q-108 60 -84 46" fill="none" stroke="#6b7d94" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>` +
    socket(-58) +
    socket(58) +
    // The mouth grille and a floating plate waiting to be fitted.
    `<rect x="-56" y="196" width="112" height="38" rx="6" fill="#06090d" stroke="#46556a" stroke-width="3"/>` +
    '<path d="M-36 200V230M-18 200V230M0 200V230M18 200V230M36 200V230" stroke="#46556a" stroke-width="3"/>' +
    '<path d="M-60 32V14M-48 32V20" stroke="#46556a" stroke-width="4"/>'
  )
}

const SEAT =
  '<rect x="100" y="262" width="14" height="92" rx="6" fill="#222a34"/><rect x="108" y="350" width="86" height="14" rx="6" fill="#2a3340"/>' +
  `<rect x="108" y="350" width="86" height="3" fill="${AMBER}" fill-opacity=".6"/>` +
  '<rect x="146" y="364" width="10" height="64" fill="#1a2028"/><g fill="#1a2028"><rect x="112" y="428" width="78" height="8" rx="3"/><circle cx="118" cy="446" r="7"/><circle cx="184" cy="446" r="7"/><circle cx="151" cy="448" r="6"/></g>'

const TABLE =
  `<rect x="166" y="330" width="304" height="14" rx="2" fill="#2e3846"/><path d="M166 331H470" stroke="${STEEL_HI}" stroke-width="2"/>` +
  '<rect x="176" y="344" width="294" height="112" fill="#1b222b"/>' +
  '<path d="M176 380H470M176 416H470M300 344V456" stroke="#10151c" stroke-width="3"/>' +
  `<rect x="176" y="344" width="294" height="8" fill="url(#rf-hzd)"/><rect x="176" y="442" width="294" height="14" fill="url(#rf-hzd)"/>`

/** The laptop, a big round stop button and a small monitor on the supervisor's control desk. */
function device(light: string, activity: Activity): string {
  const err = activity === 'error'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const lift = err ? 5 : 0
  const bars = [0, 1, 2, 3, 4]
    .map(i => {
      const h = err ? 8 : 8 + ((i * 7 + 3) % 5) * 5

      return `<rect class="rf-mb" style="--d:${f(1.1 + i * 0.27)}s" x="${408 + i * 9}" y="${f(300 - h)}" width="6" height="${h}" fill="${light}" fill-opacity=".85"/>`
    })
    .join('')

  return (
    '<defs><pattern id="rf-hzd" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#12161c"/><rect width="8" height="16" fill="#d49a1a"/></pattern>' +
    '<radialGradient id="rf-rg"><stop offset="0" stop-color="#ff5a4a" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a4a" stop-opacity="0"/></radialGradient></defs>' +
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2e3846"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2e3846"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The stop button: a striped base, a stem and a big red dome.
    `<circle class="${err ? 'rf-bp' : ''}" cx="376" cy="306" r="34" fill="url(#rf-rg)" fill-opacity="${err ? 1 : 0.35}"/>` +
    '<rect x="352" y="318" width="48" height="12" rx="3" fill="url(#rf-hzd)" stroke="#0a0d12" stroke-width="1.6"/>' +
    '<rect x="368" y="310" width="16" height="9" fill="#1a1f27"/>' +
    `<g transform="translate(0 ${lift})"><path d="M356 311Q376 282 396 311Z" fill="#b3261e"/><path d="M356 311H396" stroke="#6a1510" stroke-width="3"/>` +
    '<path d="M364 304Q372 292 382 292" fill="none" stroke="#ff9a8a" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></g>' +
    // The monitor with its bars.
    '<rect x="402" y="262" width="56" height="46" rx="4" fill="#1a2028" stroke="#3c4858" stroke-width="2"/><rect x="407" y="267" width="46" height="34" fill="#06141a"/>' +
    bars +
    `<path d="M407 276H453" stroke="${light}" stroke-opacity=".3" stroke-width="1.4"/>` +
    '<rect x="424" y="308" width="12" height="16" fill="#1a2028"/><rect x="414" y="322" width="32" height="8" rx="2" fill="#2a3340"/>'
  )
}

export function robotFactoryWorld(): World {
  const next = random(23)
  const ticks = Array.from({ length: 22 }, (_, i) => `M${-72 + i * 36} 806v14`).join('')
  const units = [-150, 70, 290, 510].map(x => `<g transform="translate(${x} 800) scale(1.5)">${bot(false, false)}</g>`).join('')
  const braces = (() => {
    const parts: string[] = []

    for (const [x1, x2] of [
      [30, 700],
      [730, 1180],
    ] as const) {
      const n = Math.round((x2 - x1) / 120)
      const w = (x2 - x1) / n

      for (let i = 0; i < n; i += 1) {
        const a = x1 + i * w
        const b = a + w

        parts.push(i % 2 === 0 ? `M${f(a)} 110L${f(b)} 330` : `M${f(a)} 330L${f(b)} 110`)
      }

      parts.push(`M${x1} 110H${x2}M${x1} 330H${x2}`)
    }

    return parts.join('')
  })()
  const sparkSet = (x: number, y: number, delay: number) =>
    `<g transform="translate(${x} ${y})"><circle class="rf-ws" r="26" fill="url(#rf-wg)" style="--l:${delay}s;--dx:0px;--dy:0px"/>` +
    Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI * (0.15 + i * 0.17)

      return `<rect class="rf-ws" x="-2.5" y="-2.5" width="5" height="5" fill="#ffe6a8" style="--l:${delay}s;--dx:${f(Math.cos(a) * (28 + next() * 20) * (i % 2 ? 1 : -1))}px;--dy:${f(Math.sin(a) * 46)}px"/>`
    }).join('') +
    '</g>'
  const steam = (x: number, y: number) =>
    Array.from({ length: 4 }, (_, i) => `<circle class="rf-st" cx="${x}" cy="${y}" r="${22 + i * 5}" fill="#c6d0d8" style="--l:${f(i * 0.55)}s;--dx:${f((i - 1.5) * 14)}px"/>`).join('') +
    `<rect x="${x - 10}" y="${y}" width="20" height="14" rx="3" fill="#2a3340" stroke="${STEEL_HI}" stroke-width="2"/>`
  const heads = (y: number) =>
    [0, 1, 2, 3]
      .map(
        i =>
          `<g transform="translate(${1276 + i * 76} ${y})"><rect x="-24" y="-36" width="48" height="36" rx="9" fill="#27303b" stroke="${STEEL_HI}" stroke-width="2"/>` +
          `<rect class="rf-bl" style="animation-delay:${f(-next() * 5)}s" x="-14" y="-24" width="6" height="9" fill="${i % 2 ? CYAN : AMBER}"/><rect class="rf-bl" style="animation-delay:${f(-next() * 5)}s" x="8" y="-24" width="6" height="9" fill="${i % 2 ? CYAN : AMBER}"/></g>`,
      )
      .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#04070a',
      furniture: '#232b36',
      metal: '#2e3846',
      paper: '#e6e2d0',
      light: { idle: '#b08a3a', work: '#ffc247', bright: '#ffe6a8' },
      headTop: 206,
      glowAt: [335, 282],
      device,
      wear: {
        front:
          '<defs><linearGradient id="rf-hb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6f6ff" stop-opacity=".5"/><stop offset="1" stop-color="#d6f6ff" stop-opacity="0"/></linearGradient></defs>' +
          '<path d="M218 226L300 190V262Z" fill="url(#rf-hb)"/>' +
          '<path d="M72 242Q74 204 150 202Q226 204 228 242Z" fill="#d9a31a" stroke="#8a6410" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M72 242Q80 214 118 208V242Z" fill="#fff0b0" fill-opacity=".25"/>' +
          '<path d="M144 203H156V242H144Z" fill="#f0bd36"/><path d="M60 238H240L252 246H60Z" fill="#b88510" stroke="#8a6410" stroke-width="2" stroke-linejoin="round"/>' +
          '<rect x="198" y="214" width="26" height="16" rx="4" fill="#1a1f27" stroke="#3c4858" stroke-width="2"/><circle cx="220" cy="222" r="5.2" fill="#e8fbff"/>',
      },
      seatArt: SEAT,
      tableArt: TABLE,
    },
    style:
      // The belt and what rides on it: slow while idle, quick while a command runs, still on an error.
      '.rf-bt{animation:rf-belt 3.6s linear infinite}@keyframes rf-belt{to{transform:translateX(36px)}}' +
      '.rf-ch{animation:rf-chs 22s linear infinite}@keyframes rf-chs{to{transform:translateX(220px)}}' +
      '.st-run .rf-bt{animation-duration:.9s}.st-run .rf-ch{animation-duration:5.5s}' +
      '.st-tool .rf-bt{animation-duration:.6s}.st-tool .rf-ch{animation-duration:3.8s}' +
      '.st-error .rf-bt,.st-error .rf-ch{animation:none}' +
      // The arms.
      '.rf-a1{animation:rf-a1 7s ease-in-out infinite alternate}@keyframes rf-a1{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.rf-a2{animation:rf-a2 6s ease-in-out infinite alternate}@keyframes rf-a2{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}' +
      '.st-responding .rf-a1,.st-thinking .rf-a1{animation-duration:3.2s}.st-responding .rf-a2,.st-thinking .rf-a2{animation-duration:2.8s}' +
      '.st-run .rf-a1{animation-name:rf-a1b;animation-duration:1.7s}@keyframes rf-a1b{from{transform:rotate(-8deg)}to{transform:rotate(9deg)}}' +
      '.st-run .rf-a2{animation-name:rf-a2b;animation-duration:1.3s}@keyframes rf-a2b{from{transform:rotate(-10deg)}to{transform:rotate(11deg)}}' +
      '.st-tool .rf-a1{animation-name:rf-a1b;animation-duration:.75s}.st-tool .rf-a2{animation-name:rf-a2b;animation-duration:.6s}' +
      '.st-error .rf-a1,.st-error .rf-a2{animation:none}' +
      '.st-error .rf-a2.rf-jm{animation:rf-jam .14s linear infinite alternate}@keyframes rf-jam{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
      // Weld sparks: a burst at each torch about once a second, never more than three bursts in any second.
      '.rf-ws{opacity:0}.st-run .rf-ws,.st-tool .rf-ws{animation:rf-ws 1.1s linear infinite;animation-delay:var(--l)}' +
      '.st-tool .rf-ws{animation-duration:.85s}' +
      '@keyframes rf-ws{0%{opacity:0;transform:translate(0,0)}5%{opacity:1}35%{opacity:0;transform:translate(var(--dx),var(--dy))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // The finished robot rolls off the belt's end and waves.
      '.rf-fin{opacity:0}.st-run .rf-fin{animation:rf-fin 7s ease-in-out -1.2s infinite}' +
      '@keyframes rf-fin{0%{opacity:0;transform:translateX(0)}4%{opacity:1}42%{opacity:1;transform:translateX(250px)}92%{opacity:1;transform:translateX(250px)}98%,100%{opacity:0;transform:translateX(250px)}}' +
      '.rf-wv{animation:rf-wv .5s ease-in-out infinite alternate}@keyframes rf-wv{from{transform:rotate(-24deg)}to{transform:rotate(30deg)}}' +
      // The crane: a slow drift, a long traverse while the page is on the web, and a nod when the work is done.
      '.rf-trav{animation:rf-drift 14s ease-in-out infinite alternate}@keyframes rf-drift{from{transform:translateX(-16px)}to{transform:translateX(16px)}}' +
      '.st-web .rf-trav{animation:rf-trav 3.4s ease-in-out infinite alternate}@keyframes rf-trav{from{transform:translateX(-170px)}to{transform:translateX(170px)}}' +
      '.rf-sw{animation:rf-sw 6s ease-in-out infinite alternate}@keyframes rf-sw{from{transform:rotate(-.9deg)}to{transform:rotate(.9deg)}}' +
      '.st-done .rf-nd{animation:rf-nod 1.1s ease-in-out .5s 3}@keyframes rf-nod{0%,100%{transform:translateY(0)}40%{transform:translateY(16px)}}' +
      '.rf-eye{opacity:0}.st-done .rf-eye{animation:rf-on .9s ease-out .15s both}@keyframes rf-on{to{opacity:1}}' +
      '.rf-lp{animation:rf-lp 5s ease-in-out infinite alternate}@keyframes rf-lp{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
      // The warning beacon and the steam.
      '.rf-bk{opacity:.0}.st-error .rf-bk{animation:rf-bk .6s ease-out both}@keyframes rf-bk{to{opacity:1}}' +
      '.rf-bw{animation:rf-spin 2.6s linear infinite}@keyframes rf-spin{to{transform:rotate(360deg)}}' +
      '.rf-bl2{opacity:.3}.st-error .rf-bl2{animation:rf-pl 1.3s ease-in-out infinite alternate}@keyframes rf-pl{from{opacity:.6}to{opacity:1}}' +
      '.rf-st{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .rf-st{animation:rf-st 2.6s ease-out infinite;animation-delay:var(--l)}' +
      '@keyframes rf-st{0%{opacity:0;transform:translate(0,0) scale(.4)}20%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),-140px) scale(2.3)}}' +
      '.rf-mb{transform-box:fill-box;transform-origin:50% 100%;animation:rf-mb var(--d) ease-in-out infinite alternate}@keyframes rf-mb{from{transform:scaleY(.35)}to{transform:scaleY(1)}}' +
      '.rf-bp{animation:rf-pl 1.4s ease-in-out infinite alternate}' +
      '.rf-bl{animation:rf-bl 5s ease-in-out infinite}@keyframes rf-bl{0%,88%,100%{opacity:.7}92%{opacity:.15}}' +
      '.rf-sg{opacity:.9}.st-error .rf-sg{opacity:.12}.rf-sa{opacity:.18}.st-error .rf-sa{animation:rf-pl 1.3s ease-in-out infinite alternate}',
    scenery:
      '<defs>' +
      '<linearGradient id="rf-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e14"/><stop offset="1" stop-color="#151c26"/></linearGradient>' +
      '<linearGradient id="rf-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd28a" stop-opacity=".2"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="rf-eg"><stop offset="0" stop-color="#8fe8ff" stop-opacity=".6"/><stop offset=".4" stop-color="#8fe8ff" stop-opacity=".2"/><stop offset="1" stop-color="#8fe8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rf-wg"><stop offset="0" stop-color="#fff1c0" stop-opacity=".8"/><stop offset=".4" stop-color="#ffb21f" stop-opacity=".3"/><stop offset="1" stop-color="#ffb21f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rf-bg"><stop offset="0" stop-color="#ffb21f" stop-opacity=".55"/><stop offset="1" stop-color="#ffb21f" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rf-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb21f" stop-opacity=".5"/><stop offset="1" stop-color="#ffb21f" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rf-vg" x1="0" y1="0" x2="1" y2="0"><stop offset=".22" stop-color="#04060a" stop-opacity="0"/><stop offset=".38" stop-color="#04060a" stop-opacity=".5"/><stop offset=".62" stop-color="#04060a" stop-opacity=".5"/><stop offset=".78" stop-color="#04060a" stop-opacity="0"/></linearGradient>' +
      '<pattern id="rf-hz" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="20" height="20" fill="#12161c"/><rect width="10" height="20" fill="#c9921a"/></pattern>' +
      '<clipPath id="rf-bc"><rect x="-40" y="700" width="680" height="125"/></clipPath></defs>' +
      '<rect width="1600" height="1000" fill="url(#rf-wall)"/>' +
      // Skylight strips, columns and the cross bracing of the hall.
      '<g fill="#18222e"><rect x="0" y="0" width="1600" height="34"/></g><path d="M0 34H1600" stroke="#2a3646" stroke-width="3"/>' +
      '<g stroke="#0d1218" stroke-width="3"><path d="M120 0V34M300 0V34M480 0V34M660 0V34M840 0V34M1020 0V34M1200 0V34M1380 0V34M1560 0V34"/></g>' +
      `<path d="${braces}" stroke="#202a38" stroke-width="5" fill="none"/>` +
      '<g fill="#161d27" stroke="#243040" stroke-width="2"><rect x="-4" y="34" width="34" height="900"/><rect x="700" y="34" width="30" height="900"/><rect x="1180" y="34" width="30" height="900"/></g>' +
      '<rect x="-4" y="600" width="34" height="60" fill="url(#rf-hz)"/><rect x="1180" y="600" width="30" height="60" fill="url(#rf-hz)"/>' +
      // The crane's bridge and rails.
      '<rect x="-20" y="46" width="1640" height="14" fill="#1c2430"/><rect x="-20" y="62" width="1640" height="30" fill="#232c39" stroke="#3a4656" stroke-width="2"/>' +
      '<path d="M-20 66H1620M-20 88H1620" stroke="#3a4656" stroke-width="2"/>' +
      lamp(150, 60, 150, 0) +
      lamp(900, 54, 90, -1.7) +
      lamp(1330, 60, 150, -3.1) +
      // The trolley, its hoist and the giant half-built head.
      '<g class="rf-trav"><g transform="translate(600 92)">' +
      `<rect x="-52" y="-26" width="104" height="34" rx="5" fill="#2a3340" stroke="${STEEL_HI}" stroke-width="2"/><rect x="-52" y="-26" width="104" height="8" fill="url(#rf-hz)"/>` +
      '<circle cx="-30" cy="8" r="6" fill="#171d26"/><circle cx="30" cy="8" r="6" fill="#171d26"/>' +
      '<path d="M-20 8V150M20 8V150" stroke="#6a7a90" stroke-width="5"/>' +
      '<g transform="translate(0 150)"><g class="rf-sw"><g class="rf-nd">' +
      head() +
      '</g></g></g></g></g>' +
      // The belt, with its ticks and the robots on it, and the two arms.
      '<g fill="#161d27" stroke="#243040" stroke-width="2"><rect x="60" y="560" width="60" height="380"/><rect x="490" y="560" width="60" height="380"/></g>' +
      arm(90, 560, 1, 0, true) +
      arm(520, 560, -1, -0.5, false) +
      '<rect x="-20" y="826" width="660" height="60" fill="#1a212b" stroke="#2c3644" stroke-width="2"/><rect x="-20" y="850" width="660" height="14" fill="url(#rf-hz)"/>' +
      '<g fill="#161d27"><rect x="30" y="886" width="26" height="54"/><rect x="210" y="886" width="26" height="54"/><rect x="390" y="886" width="26" height="54"/><rect x="570" y="886" width="26" height="54"/></g>' +
      '<rect x="-20" y="800" width="660" height="26" fill="#0b0e13"/>' +
      '<g clip-path="url(#rf-bc)">' +
      `<g class="rf-bt"><path d="${ticks}" stroke="#2c3644" stroke-width="3"/></g>` +
      `<g class="rf-ch">${units}</g>` +
      '</g>' +
      '<g fill="#1a212b" stroke="#2c3644" stroke-width="2"><rect x="620" y="800" width="110" height="86"/></g><rect x="620" y="800" width="110" height="10" fill="url(#rf-hz)"/>' +
      '<g transform="translate(330 800) scale(1.9)"><g class="rf-fin">' +
      bot(true, true) +
      '</g></g>' +
      sparkSet(272, 772, 0) +
      sparkSet(322, 772, -0.55) +
      // The beacon on the wall, with its sweep that turns softly.
      '<g transform="translate(70 420)"><rect x="-6" y="14" width="12" height="130" fill="#161d27"/><rect x="-18" y="8" width="36" height="12" rx="3" fill="#232c39"/>' +
      '<circle class="rf-bl2" r="22" fill="url(#rf-bg)"/><path d="M-12 8A12 14 0 0 1 12 8Z" fill="#d9831a"/>' +
      '<g class="rf-bk"><g class="rf-bw"><path d="M0 0L420 -110V110Z" fill="url(#rf-beam)"/></g></g></g>' +
      steam(150, 920) +
      steam(480, 920) +
      '<g class="mv-b"><rect x="-20" y="940" width="1700" height="200" fill="#0b0f14"/><rect x="-20" y="940" width="1700" height="12" fill="url(#rf-hz)"/>' +
      '<path d="M-20 1000H1700" stroke="#1a222d" stroke-width="3"/></g>' +
      // The parts rack at the far right.
      '<g class="mv-r"><path d="M1180 140H1640M1180 168H1640" stroke="#222c39" stroke-width="12"/><g fill="#2c3644"><rect x="1300" y="130" width="14" height="48"/><rect x="1470" y="130" width="14" height="48"/></g>' +
      '<circle cx="1392" cy="154" r="16" fill="none" stroke="#3a4656" stroke-width="5"/><path d="M1376 154H1408M1392 138V170" stroke="#3a4656" stroke-width="3"/>' +
      '<g fill="#1a222d" stroke="#2c3644" stroke-width="2"><rect x="1236" y="360" width="380" height="10"/><rect x="1236" y="450" width="380" height="10"/><rect x="1236" y="360" width="10" height="170"/><rect x="1590" y="360" width="10" height="170"/></g>' +
      heads(358) +
      heads(448) +
      '</g>' +
      '<rect width="1600" height="1000" fill="url(#rf-vg)"/>',
    nook:
      '<defs><linearGradient id="rf-lc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd28a" stop-opacity=".16"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></linearGradient></defs>' +
      // A work lamp above the desk.
      '<path d="M150 -512V-96" stroke="#0a0d12" stroke-width="3"/>' +
      '<path d="M112 -64L132 -96H168L188 -64Z" fill="#1a212a" stroke="#3c4858" stroke-width="2" stroke-linejoin="round"/>' +
      '<ellipse cx="150" cy="-63" rx="38" ry="5" fill="#ffe6a8" fill-opacity=".85"/>' +
      '<path d="M116 -58L184 -58L260 300L40 300Z" fill="url(#rf-lc)"/>' +
      // A control cabinet and a stack light that follows the work.
      '<rect x="262" y="-40" width="150" height="190" rx="6" fill="#161d27" stroke="#2c3644" stroke-width="3"/><path d="M262 40H412M262 100H412" stroke="#0e1319" stroke-width="3"/>' +
      '<g fill="#0a0d12"><rect x="278" y="-24" width="52" height="50" rx="3"/><rect x="344" y="-24" width="52" height="50" rx="3"/></g>' +
      `<g fill="${AMBER}" fill-opacity=".5"><rect x="284" y="-6" width="40" height="3"/><rect x="284" y="4" width="26" height="3"/></g>` +
      '<g fill="#3fb8c8" fill-opacity=".45"><rect x="350" y="-8" width="10" height="24"/><rect x="366" y="2" width="10" height="14"/><rect x="382" y="-14" width="10" height="30"/></g>' +
      '<g><circle cx="284" cy="64" r="5" fill="#3fdc84" fill-opacity=".8"/><circle cx="302" cy="64" r="5" fill="#ffb21f" fill-opacity=".6"/><circle cx="320" cy="64" r="5" fill="#c0453a" fill-opacity=".4"/></g>' +
      '<path d="M336 -40V-110" stroke="#0a0d12" stroke-width="7"/><rect x="326" y="-170" width="20" height="64" rx="4" fill="#161d27" stroke="#2c3644" stroke-width="2"/>' +
      '<circle class="rf-sg" cx="336" cy="-152" r="16" fill="#3fdc84"/><circle class="rf-sa" cx="336" cy="-134" r="16" fill="#ffb21f"/><circle cx="336" cy="-116" r="16" fill="#8a2c26" fill-opacity=".6"/>' +
      '<path d="M270 150V250M404 150V250" stroke="#0e1319" stroke-width="8"/>',
    front: '',
  }
}
