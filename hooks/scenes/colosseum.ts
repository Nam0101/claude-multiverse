import type { Activity } from '../../types'
import { f, random } from './kit'
import { cell } from './rig'
import type { World } from './world'

// Colosseum: a scribe in a laurel wreath codes on a marble ledge in the stands of a torchlit night arena. Tiers of
// arches curve around the sand track, crowds fill the stands with tiny torches, banners hang. When a command runs
// four chariots race along the track in dust; an error throws a wheel; done rains roses and the crowd cheers.
const INK = '#07050a'
const GOLD = '#d9a93c'
const MARBLE = '#3b352f'
const MARBLE_EDGE = '#6a5e50'
const BRONZE = '#5a3f1c'
const FLAME = '#ffa63a'
const CHARIOTS = ['#c0303c', '#3a6ac0', '#dcd2b8', '#3a9a5a']

const K = 105
const u = (x: number): number => (x - 800) / 800
/** The height of a curved tier at `x`: the stands bend toward the viewer at both ends. */
const wy = (x: number, y0: number): number => y0 + K * u(x) ** 2

/** A band between two curved heights, from one edge of the picture to the other. */
function band(a: number, b: number, fill: string, extra = ''): string {
  const xs = Array.from({ length: 15 }, (_, i) => -40 + i * 120)
  const top = xs.map(x => `${x} ${f(wy(x, a))}`)
  const bottom = [...xs].reverse().map(x => `${x} ${f(wy(x, b))}`)

  return `<path d="M${top.join('L')}L${bottom.join('L')}Z" fill="${fill}"${extra}/>`
}

/** A curved line along a tier from `xa` to `xb`, exact for the parabola. */
function seg(xa: number, xb: number, y0: number): string {
  const ya = wy(xa, y0)
  const slope = (2 * K * u(xa)) / 800
  const xm = (xa + xb) / 2

  return `M${f(xa)} ${f(ya)}Q${f(xm)} ${f(ya + slope * (xm - xa))} ${f(xb)} ${f(wy(xb, y0))}`
}

/** The arch openings of one tier: all of them dark, and the ones near the edges lit by torches in two alternating sets. */
function arches(top: number, bottom: number): string {
  const dark: string[] = []
  const litA: string[] = []
  const litB: string[] = []

  for (let i = 0, x = -16; x < 1640; i += 1, x += 56) {
    const yb = wy(x, bottom) - 4
    const yt = wy(x, top) + 10
    const d = `M${f(x - 13)} ${f(yb)}V${f(yt + 13)}A13 13 0 0 1 ${f(x + 13)} ${f(yt + 13)}V${f(yb)}Z`

    dark.push(d)

    if (Math.abs(x - 800) > 380 && i % 3 !== 1) {
      ;(i % 2 ? litB : litA).push(d)
    }
  }

  return (
    `<path d="${dark.join('')}" fill="#0a0709"/>` +
    `<path class="co-la" d="${litA.join('')}" fill="#ff9a3a" fill-opacity=".55"/>` +
    `<path class="co-lb" d="${litB.join('')}" fill="#ff9a3a" fill-opacity=".55"/>`
  )
}

/** A bronze tripod brazier with a bowl, a bed of embers and layered flames; `s` scales it. */
function brazier(x: number, y: number, s: number, glow: boolean): string {
  const flame = (k: number, fill: string, o: number, d: number) =>
    `<path class="co-fl" style="animation-delay:${f(d)}s" d="M0 0C${f(-11 * k)} ${f(-8 * k)} ${f(-8 * k)} ${f(-24 * k)} 0 ${f(-38 * k)}C${f(8 * k)} ${f(-24 * k)} ${f(11 * k)} ${f(-8 * k)} 0 0Z" fill="${fill}" fill-opacity="${o}"/>`

  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">` +
    (glow
      ? '<g class="co-gl"><circle cy="-30" r="96" fill="#ff9a3a" fill-opacity=".05"/><circle cy="-30" r="62" fill="#ff9a3a" fill-opacity=".08"/><circle cy="-30" r="34" fill="#ffc060" fill-opacity=".12"/></g>'
      : '') +
    `<path d="M-22 0L-30 44M22 0L30 44M0 4V46" stroke="${BRONZE}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M-30 -4Q0 34 30 -4Z" fill="${BRONZE}" stroke="#8a6428" stroke-width="2"/><ellipse cy="-4" rx="30" ry="5" fill="#2a1a0c" stroke="#8a6428" stroke-width="2"/>` +
    flame(1.2, '#ff7a2a', 0.9, 0) +
    flame(0.85, FLAME, 0.95, -0.2) +
    flame(0.5, '#ffe49a', 0.95, -0.4) +
    '</g>'
  )
}

function banner(x: number, y: number, fill: string, h: number, d: number): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)})"><g class="co-bn" style="--d:${f(d)}s">` +
    `<path d="M-12 0H12V${h}L0 ${h - 14}L-12 ${h}Z" fill="${fill}" stroke="#1a0c0c" stroke-width="1.5"/>` +
    `<path d="M-12 8H12" stroke="${GOLD}" stroke-width="3"/><circle cy="${f(h * 0.45)}" r="5" fill="none" stroke="${GOLD}" stroke-width="2"/></g></g>`
  )
}

/** A horse, facing right, galloping legs on their own clocks. */
function horse(dx: number, dy: number, shade: string, delay: number): string {
  return (
    `<g transform="translate(${dx} ${dy})" fill="${shade}" stroke="${shade}">` +
    '<path stroke="#8a5a2a" stroke-opacity=".5" stroke-width="1.4" d="M34 -46C34 -56 52 -58 70 -54L84 -74L100 -76L110 -66L96 -62L88 -46C84 -34 50 -30 34 -46Z"/>' +
    '<path fill="none" stroke-width="3.4" stroke-linecap="round" d="M36 -46Q20 -44 16 -24"/>' +
    `<g class="co-lg" style="animation-delay:${f(delay)}s"><path fill="none" stroke-width="5" stroke-linecap="round" d="M70 -38L84 -12L92 0"/></g>` +
    `<g class="co-lg" style="animation-delay:${f(delay - 0.15)}s"><path fill="none" stroke-width="5" stroke-linecap="round" d="M44 -38L32 -12L24 0"/></g>` +
    '</g>'
  )
}

/** A racing chariot, facing right, feet on the ground line at the origin; a wheel that can fly, trailing dust. */
function chariot(accent: string, n: number): string {
  const spokes = 'M0 -17V17M-17 0H17M-12 -12L12 12M-12 12L12 -12'
  const puffs = [0, 1, 2]
    .map(i => `<ellipse class="co-pf" style="animation-delay:${f(i * 0.28)}s" cx="-62" cy="-8" rx="17" ry="10" fill="#a6835a"/>`)
    .join('')
  const big = (n === 1 ? [0, 1, 2, 3, 4] : [])
    .map(i => `<ellipse class="co-big" style="--bx:${-30 - i * 22}px;--by:${-50 - (i % 3) * 22}px;animation-delay:${f(0.5 + i * 0.12)}s" cx="-20" cy="-10" rx="${26 + i * 4}" ry="${16 + i * 3}" fill="#a6835a"/>`)
    .join('')

  return (
    `<g class="co-car co-c${n}" style="--d:${f(4 + n * 0.45)}s;--l:${f(-0.5 - n * 1.15)}s"><g class="co-bob">` +
    puffs +
    horse(0, 0, '#120c10', 0) +
    horse(8, -5, '#17101a', -0.1) +
    // The yoke pole and reins, the car, the driver.
    `<path d="M2 -32L58 -48M-16 -66L62 -60" stroke="${INK}" stroke-width="3" fill="none"/>` +
    `<path d="M-58 -54L-54 -26H6L8 -34H-46L-48 -54Z" fill="${INK}" stroke="${accent}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M-36 -54L-30 -78L-18 -76L-14 -54Z" fill="${INK}"/><circle cx="-24" cy="-86" r="7.5" fill="${INK}"/>` +
    `<path d="M-30 -92Q-24 -104 -16 -94Q-22 -96 -30 -92Z" fill="${accent}"/><path d="M-32 -64L-62 -72" stroke="${accent}" stroke-width="2.4"/>` +
    // The wheel.
    `<g transform="translate(-30 -17)"><g class="co-whx"><g class="co-why"><g class="co-wh">` +
    `<circle r="17" fill="none" stroke="#8a6a38" stroke-width="3.2"/><path d="${spokes}" stroke="#8a6a38" stroke-width="1.6"/></g></g></g></g>` +
    big +
    '</g></g>'
  )
}

function dasher(y: number, s: number, n: number): string {
  return `<g transform="translate(0 ${y}) scale(${s})">${chariot(CHARIOTS[n] ?? '#fff', n)}</g>`
}

function eagle(): string {
  const wing = 'M260 372C240 366 218 372 204 388C222 382 238 384 250 388L256 398H264L270 388C282 384 298 382 316 388C302 372 280 366 260 372Z'

  return (
    `<path d="M259 396V650H261V396" stroke="#3a2a14" stroke-width="3" fill="none"/>` +
    '<circle cx="260" cy="378" r="46" fill="#ffb347" fill-opacity=".06"/>' +
    `<path d="${wing}" fill="#a07c2a" stroke="#e8c765" stroke-opacity=".6" stroke-width="1.6"/><circle cx="260" cy="362" r="6" fill="#a07c2a"/><path d="M265 361L274 365L265 366Z" fill="#e8c765"/>` +
    `<path d="M236 410H284" stroke="#a07c2a" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="238" cy="420" r="5" fill="#a07c2a"/><circle cx="282" cy="420" r="5" fill="#a07c2a"/>` +
    '<g transform="translate(260 414)"><g class="co-bn" style="--d:-1s"><path d="M-20 0H20V54L0 42L-20 54Z" fill="#9c2a38" stroke="#a07c2a" stroke-width="2"/><path d="M-20 8H20" stroke="#d9a93c" stroke-width="3"/></g></g>' +
    '<g transform="translate(204 388)"><g class="co-gt"><path d="M0 -14L3 -3L14 0L3 3L0 14L-3 3L-14 0L-3 -3Z" fill="#fff2c0"/></g></g>' +
    '<g transform="translate(316 388)"><g class="co-gt co-gt2"><path d="M0 -14L3 -3L14 0L3 3L0 14L-3 3L-14 0L-3 -3Z" fill="#fff2c0"/></g></g>'
  )
}

function pigeon(y: number, s: number, delay: number): string {
  return (
    `<g transform="translate(1700 ${y}) scale(${s})"><g class="co-pg" style="animation-delay:${f(delay)}s">` +
    '<path class="co-wg" d="M-10 0Q-5 -9 0 0Q5 -9 10 0" fill="none" stroke="#c9c1b8" stroke-width="2.6" stroke-linecap="round"/></g></g>'
  )
}

/** A laurel leaf from (x, y) at angle `a` degrees, as path data. */
function leaf(x: number, y: number, a: number): string {
  const r = (a * Math.PI) / 180
  const tx = x + 14 * Math.cos(r)
  const ty = y + 14 * Math.sin(r)
  const nx = -Math.sin(r) * 5
  const ny = Math.cos(r) * 5

  return `M${f(x)} ${f(y)}Q${f((x + tx) / 2 + nx)} ${f((y + ty) / 2 + ny)} ${f(tx)} ${f(ty)}Q${f((x + tx) / 2 - nx)} ${f((y + ty) / 2 - ny)} ${f(x)} ${f(y)}Z`
}

function wreath(): string {
  const leaves: string[] = []

  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10
    const x = 74 + t * 152
    const y = 254 - 28 * (1 - ((x - 150) / 76) ** 2)
    const slope = (56 * (x - 150)) / 5776

    // Leaves lie along the ring, pointing toward the brow's top and alternating sides of the band.
    const a = (Math.atan(slope) * 180) / Math.PI - 90 + (t < 0.5 ? 0 : 180) + 90
    leaves.push(leaf(x, y, a - 35), leaf(x, y, a + 35 + 180))
  }

  return leaves.join('')
}

function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const flare = activity === 'tool' ? ' co-flx' : ''

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#3a2c1a"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#3a2c1a"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    `<path d="M334 327L360 238" stroke="${GOLD}" stroke-opacity=".6" stroke-width="1.4"/>` +
    // A papyrus scroll.
    '<rect x="366" y="320" width="32" height="10" rx="5" fill="#e6d9b0" fill-opacity=".92"/><circle cx="371" cy="325" r="2.6" fill="none" stroke="#9a8a62"/><rect x="383" y="320" width="3" height="10" fill="#9c2a38"/>' +
    // A small bronze brazier on the ledge.
    `<g class="co-bz${flare}"><circle cx="430" cy="278" r="70" fill="#ff9a3a" fill-opacity=".05"/><circle cx="430" cy="278" r="46" fill="#ff9a3a" fill-opacity=".08"/><circle cx="430" cy="278" r="28" fill="#ffc060" fill-opacity=".13"/></g>` +
    `<path d="M416 330L422 306M444 330L438 306M430 330V308" stroke="${BRONZE}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M412 298Q430 322 448 298Z" fill="${BRONZE}" stroke="#8a6428" stroke-width="1.6"/><ellipse cx="430" cy="298" rx="18" ry="3.6" fill="#2a1a0c" stroke="#8a6428" stroke-width="1.6"/>` +
    '<g transform="translate(430 298)"><g class="co-fl"><path d="M0 0C-9 -6 -7 -18 0 -30C7 -18 9 -6 0 0Z" fill="#ff7a2a" fill-opacity=".92"/></g><g class="co-fl" style="animation-delay:-.3s"><path d="M0 0C-5 -4 -4 -12 0 -19C4 -12 5 -4 0 0Z" fill="#ffe49a"/></g></g>'
  )
}

export function colosseumWorld(): World {
  const next = random(77)
  const stars = Array.from(
    { length: 30 },
    () => `<circle class="co-tw" style="animation-delay:${f(-next() * 5)}s" cx="${f(next() * 1600)}" cy="${f(next() * 250)}" r="${f(0.8 + next() * 1)}" fill="#e6e8f4"/>`,
  ).join('')
  const rows = [506, 534, 562, 590]
  const crowd = rows
    .map((y0, r) => {
      const body = `<path d="${seg(-40, 1640, y0 + 9)}" fill="none" stroke="${r % 2 ? '#110a13' : '#0d080f'}" stroke-width="15" stroke-dasharray="11 2.6"/>`
      const tunic = `<path d="${seg(-40, 1640, y0 + 6)}" fill="none" stroke="#d6c8a4" stroke-opacity=".32" stroke-width="10" stroke-dasharray="5 ${38 + r * 9}" stroke-dashoffset="${r * 17}"/>`
      const heads = Array.from({ length: 6 }, (_, s) => {
        const xa = -40 + s * 280

        return `<g class="co-hd" style="--w:${f(s * 0.55)}s"><path d="${seg(xa, xa + 280, y0)}" fill="none" stroke="#0a060c" stroke-width="9.5" stroke-linecap="round" stroke-dasharray="0 13.6" stroke-dashoffset="${r * 5}"/></g>`
      }).join('')
      const torches = [
        [-40, 420],
        [1180, 1640],
      ]
        .map(([a = 0, b = 0]) => `<path class="co-tq" style="animation-delay:${f(-r * 0.5)}s" d="${seg(a, b, y0 - 6)}" fill="none" stroke="#ffb040" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 ${46 + r * 8}" stroke-dashoffset="${r * 11}"/>`)
        .join('')
      const arms = `<g class="co-ar" style="animation-delay:${f(r * 0.18)}s">${band(y0 - 22, y0 - 4, 'url(#co-arm)')}</g>`

      return body + tunic + heads + torches + arms
    })
    .join('')
  const banners = [90, 190, 330, 470, 1130, 1270, 1410, 1520]
    .map((x, i) => banner(x, wy(x, 250) + 24, ['#9c2a38', '#4a2a7a', '#9c2a38', '#a8802a', '#4a2a7a', '#9c2a38', '#a8802a', '#4a2a7a'][i] ?? '#9c2a38', 70, -i * 0.7))
    .join('')
  const petals = Array.from({ length: 22 }, (_, i) => {
    const x = -40 + next() * 1700
    const s = 1 + next() * 0.9
    const d = `M${f(x)} 0C${f(x + 3 * s)} ${f(-5 * s)} ${f(x + 8 * s)} ${f(-3 * s)} ${f(x + 8 * s)} ${f(2 * s)}C${f(x + 4 * s)} ${f(6 * s)} ${f(x + s)} ${f(5 * s)} ${f(x)} 0Z`

    return `<path class="co-rp" d="${d}" fill="${['#d93a58', '#ff7a96', '#b2203e'][i % 3]}" style="--sx:${f((next() - 0.5) * 220)}px;animation-duration:${f(3.6 + next() * 2)}s;animation-delay:${f(next() * 0.8)}s"/>`
  }).join('')
  const embers = Array.from(
    { length: 6 },
    (_, i) => `<circle class="co-em" style="animation-delay:${f(-next() * 4)}s;animation-duration:${f(3 + next() * 2)}s" cx="${f((i < 3 ? 110 : 1470) + (next() - 0.5) * 50)}" cy="${f(590 - next() * 20)}" r="2.2" fill="#ffb347"/>`,
  ).join('')
  const spine = Array.from({ length: 7 }, (_, i) => `<ellipse cx="${f(420 + i * 44)}" cy="696" rx="6" ry="8" fill="#6a5640"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#08050a',
      furniture: MARBLE,
      metal: '#3a2c1a',
      paper: '#e6d9b0',
      light: { idle: '#a8823a', work: '#ffcb6a', bright: '#fff0c0' },
      headTop: 236,
      glowAt: [345, 284],
      device,
      wear: {
        behind: `<path class="co-rib" d="M72 250L40 262L52 266L34 284L62 272Z" fill="#9c2a38"/>`,
        front:
          // The laurel wreath arches over the brow: the eyes stay clear below it.
          `<path d="M74 254Q150 218 226 254" fill="none" stroke="#7a5a1c" stroke-width="3"/>` +
          `<path d="${wreath()}" fill="${GOLD}" stroke="#7a5a1c" stroke-width=".8"/>` +
          // A cream tunic: a fold over the far shoulder and a gold-edged hem at the desk.
          '<path d="M72 328Q150 318 228 328V350H72Z" fill="#b8ac8a"/>' +
          `<path d="M72 328Q150 318 228 328" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
          `<path d="M206 262H230V350H206Z" fill="#b8ac8a"/><path d="M212 270V344M220 268V346" stroke="#8a7e60" stroke-width="2"/>` +
          `<circle cx="214" cy="272" r="4.5" fill="${GOLD}"/>`,
      },
      seatArt:
        `<path d="M104 352V456H198V352Z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="2"/>` +
        `<path d="M118 360V454M134 360V454M151 360V454M168 360V454M184 360V454" stroke="#2a2520" stroke-width="3"/>` +
        `<rect x="100" y="350" width="102" height="8" fill="#4a423a" stroke="${MARBLE_EDGE}"/>`,
      tableArt:
        `<rect x="166" y="330" width="304" height="16" fill="#4a423a" stroke="${MARBLE_EDGE}" stroke-width="1.6"/>` +
        `<path d="M166 330H470" stroke="#8a7a66" stroke-opacity=".5" stroke-width="2"/>` +
        `<g fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="1.6"><rect x="186" y="346" width="40" height="110"/><rect x="410" y="346" width="40" height="110"/></g>` +
        '<path d="M196 350V454M206 350V454M216 350V454M420 350V454M430 350V454M440 350V454" stroke="#2a2520" stroke-width="2"/>' +
        `<path d="M226 360H410V376H226Z" fill="#241f1a" stroke="${MARBLE_EDGE}"/>`,
    },
    style:
      '.co-tw{animation:co-tw 4s ease-in-out infinite alternate;opacity:.25}@keyframes co-tw{to{opacity:.8}}' +
      // Fire.
      '.co-fl{transform-box:fill-box;transform-origin:50% 100%;animation:co-fl .55s ease-in-out infinite alternate}@keyframes co-fl{from{transform:scale(.9,.84)}to{transform:scale(1.06,1.14)}}' +
      '.co-gl,.co-bz{animation:co-gl 3.4s ease-in-out infinite alternate}@keyframes co-gl{from{opacity:.75}to{opacity:1}}' +
      '.st-tool .co-fl{animation:co-flare .7s ease-in-out infinite alternate}@keyframes co-flare{from{transform:scale(1.2,1.4)}to{transform:scale(1.6,2.1)}}' +
      '.st-tool .co-gl,.co-flx{transform-box:fill-box;transform-origin:center;animation:co-glx .8s ease-in-out infinite alternate}@keyframes co-glx{from{opacity:.9;transform:scale(1.1)}to{opacity:1;transform:scale(1.5)}}' +
      '.co-em{opacity:0;animation:co-em 4s ease-out infinite}@keyframes co-em{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(14px,-180px)}}' +
      // The torches among the crowd, and the arches they light.
      '.co-tq{animation:co-tq 1.9s ease-in-out infinite alternate}@keyframes co-tq{from{opacity:.65}to{opacity:1}}' +
      '.co-la{animation:co-la 3.1s ease-in-out infinite alternate}.co-lb{animation:co-la 2.3s ease-in-out infinite alternate-reverse}@keyframes co-la{from{opacity:.55}to{opacity:1}}' +
      '.st-read .co-la,.st-read .co-lb{animation-duration:1.3s}' +
      '.st-error .co-tq{animation:co-dip 3s ease-in-out both}@keyframes co-dip{0%{opacity:1;transform:translateY(0)}20%,65%{opacity:.25;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}' +
      // Banners.
      '.co-bn{transform-box:fill-box;transform-origin:50% 0;animation:co-bn 3.8s ease-in-out infinite alternate;animation-delay:var(--d)}@keyframes co-bn{from{transform:skewX(-4deg)}to{transform:skewX(4deg)}}' +
      '.st-responding .co-bn{animation-duration:2s}.st-done .co-bn{animation:co-bnw .8s ease-in-out infinite alternate;animation-delay:var(--d)}@keyframes co-bnw{from{transform:skewX(-11deg)}to{transform:skewX(11deg)}}' +
      '.co-rib{transform-box:fill-box;transform-origin:100% 50%;animation:co-rib 1.7s ease-in-out infinite alternate}@keyframes co-rib{from{transform:rotate(-8deg)}to{transform:rotate(9deg)}}' +
      // The crowd: a slow wave while thinking; arms up and cheering in the finish.
      '.st-thinking .co-hd{animation:co-wave 3.4s ease-in-out infinite;animation-delay:var(--w)}@keyframes co-wave{0%,55%,100%{transform:translateY(0)}25%{transform:translateY(-7px)}}' +
      '.co-ar{opacity:0}.st-done .co-ar{opacity:.9;animation:co-cheer .7s ease-in-out infinite alternate}@keyframes co-cheer{from{transform:translateY(2px)}to{transform:translateY(-6px)}}' +
      '.st-done .co-hd{animation:co-cheer .7s ease-in-out infinite alternate;animation-delay:var(--w)}' +
      // Roses.
      '.co-rp{transform-box:fill-box;transform-origin:center;opacity:0}.st-done .co-rp{animation:co-rain 5s linear both}' +
      '@keyframes co-rain{0%{opacity:0;transform:translate(0,-40px) rotate(0)}10%{opacity:.85}85%{opacity:.85}100%{opacity:0;transform:translate(var(--sx),1060px) rotate(420deg)}}' +
      // The eagle standard glints; pigeons cross.
      '.co-gt{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .co-gt{animation:co-gt 1.5s ease-out infinite}.st-web .co-gt2{animation-delay:.75s}' +
      '@keyframes co-gt{0%{opacity:0;transform:scale(.3)}25%{opacity:1;transform:scale(1)}65%,100%{opacity:0;transform:scale(.5)}}' +
      '.co-pg{opacity:0}.st-web .co-pg{animation:co-pg 6s linear infinite}@keyframes co-pg{0%{opacity:0;transform:translateX(0)}6%,92%{opacity:.9}100%{opacity:0;transform:translateX(-1900px)}}' +
      '.co-wg{transform-box:fill-box;transform-origin:50% 100%;animation:co-wg .3s ease-in-out infinite alternate}@keyframes co-wg{to{transform:scaleY(.3)}}' +
      // The race.
      '.co-car{opacity:0}.st-run .co-car{animation:co-dash var(--d) linear var(--l) infinite}' +
      '@keyframes co-dash{0%{opacity:0;transform:translateX(-300px)}4%,95%{opacity:1}100%{opacity:0;transform:translateX(1900px)}}' +
      '.st-run .co-bob{animation:co-bob .22s ease-in-out infinite alternate}@keyframes co-bob{to{transform:translateY(-3px)}}' +
      '.co-lg{transform-box:fill-box;transform-origin:50% 0;animation:co-lg .26s ease-in-out infinite alternate}@keyframes co-lg{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}' +
      '.co-wh{animation:mv-spin .5s linear infinite}' +
      '.co-pf{opacity:0}.st-run .co-pf{animation:co-pf 1s ease-out infinite}@keyframes co-pf{0%{opacity:.5;transform:translate(0,0) scale(.5)}100%{opacity:0;transform:translate(-60px,-16px) scale(2)}}' +
      '.co-pf,.co-big{transform-box:fill-box;transform-origin:center}' +
      // The crash: one chariot loses its wheel, skids and a cloud rises.
      '.st-error .co-c1{animation:co-skid 3.4s cubic-bezier(.2,.7,.3,1) both}' +
      '@keyframes co-skid{0%{opacity:1;transform:translateX(260px) rotate(0)}35%{opacity:1;transform:translateX(520px) rotate(-3deg)}100%{opacity:1;transform:translateX(700px) rotate(-6deg)}}' +
      '.st-error .co-whx{animation:co-wx 2.4s linear both}@keyframes co-wx{to{transform:translateX(440px)}}' +
      '.st-error .co-why{animation:co-wy 2.4s both}@keyframes co-wy{0%{transform:translateY(0);animation-timing-function:ease-out}35%{transform:translateY(-170px);animation-timing-function:ease-in}100%{transform:translateY(17px)}}' +
      '.st-error .co-wh{animation:mv-spin .4s linear infinite}' +
      '.co-big{opacity:0}.st-error .co-big{animation:co-big 2.8s ease-out both}@keyframes co-big{0%{opacity:0;transform:translate(0,0) scale(.3)}25%{opacity:.45}100%{opacity:0;transform:translate(var(--bx),var(--by)) scale(2.6)}}',
    scenery:
      '<defs><linearGradient id="co-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04050e"/><stop offset=".6" stop-color="#120d1e"/><stop offset="1" stop-color="#2a1420"/></linearGradient>' +
      '<linearGradient id="co-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1a"/><stop offset="1" stop-color="#6a4c2c"/></linearGradient>' +
      '<radialGradient id="co-vg"><stop offset="0" stop-color="#030208" stop-opacity=".62"/><stop offset=".6" stop-color="#030208" stop-opacity=".35"/><stop offset="1" stop-color="#030208" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="co-hz"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".3"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>' +
      '<pattern id="co-arm" width="15" height="20" patternUnits="userSpaceOnUse"><rect x="5" y="3" width="3" height="17" fill="#0a060c"/><circle cx="6.5" cy="3" r="2.6" fill="#0a060c"/></pattern></defs>' +
      '<rect width="1600" height="1000" fill="url(#co-sky)"/>' +
      stars +
      '<path d="M240 82A52 52 0 1 0 292 134A42 42 0 1 1 240 82Z" fill="#dfe4f2" fill-opacity=".85"/>' +
      '<ellipse cx="800" cy="460" rx="900" ry="330" fill="url(#co-hz)"/>' +
      // The curved arcade: three tiers of arches, each with its cornice.
      band(252, 322, '#251c16') +
      arches(252, 322) +
      band(326, 396, '#2b2119') +
      arches(326, 396) +
      band(400, 470, '#30261d') +
      arches(400, 470) +
      [250, 322, 326, 396, 400, 470]
        .map(y => `<path d="${seg(-40, 1640, y)}" fill="none" stroke="#6a5640" stroke-opacity=".55" stroke-width="3"/>`)
        .join('') +
      banners +
      // The stands: stone seating, then the crowd row by row.
      band(474, 640, '#241a14') +
      '<path d="' + seg(-40, 1640, 640) + '" fill="none" stroke="#4a3a2a" stroke-width="10"/>' +
      crowd +
      band(640, 700, '#171210') +
      embers +
      // The sand and the track.
      '<path d="' + seg(-40, 1640, 646) + 'L1640 900L-40 900Z" fill="url(#co-sand)" fill-opacity=".9"/>' +
      '<path d="M-40 730Q800 700 1640 730M-40 770Q800 740 1640 770M-40 812Q800 782 1640 812" stroke="#a6835a" stroke-opacity=".16" stroke-width="3" fill="none"/>' +
      // The central barrier: low wall, eggs, turning posts and the obelisk.
      '<rect x="330" y="684" width="630" height="26" rx="6" fill="#2e2822" stroke="#5a4a38" stroke-width="2"/>' +
      spine +
      '<path d="M342 684L350 650L358 684ZM940 684L948 650L956 684Z" fill="#3a3028" stroke="#8a6a38" stroke-width="2"/>' +
      '<path d="M638 684L642 442H650L654 684Z" fill="#2a2420" stroke="#5a4a38" stroke-width="2"/><path d="M642 442L646 420L650 442Z" fill="#a07c2a"/>' +
      '<path d="M645 470v14M645 500v10M645 530v16M645 566v10" stroke="#6a5a48" stroke-width="3"/>' +
      brazier(342, 640, 0.6, false) +
      brazier(948, 640, 0.6, false) +
      eagle() +
      brazier(128, 640, 1, true) +
      // The vignette keeps the chat column dark.
      '<ellipse cx="800" cy="470" rx="420" ry="560" fill="url(#co-vg)"/>' +
      '<g class="mv-r">' +
      brazier(1490, 630, 1, true) +
      '<rect x="1560" y="-10" width="60" height="860" fill="#0a0709"/><path d="M1574 0V850M1588 0V850M1602 0V850" stroke="#2a2018" stroke-width="3"/>' +
      '</g>' +
      '<rect x="-10" y="-10" width="64" height="860" fill="#0a0709"/><path d="M12 0V850M26 0V850M40 0V850" stroke="#2a2018" stroke-width="3"/>' +
      // The track-side ledge in the foreground.
      '<g class="mv-b"><rect x="-20" y="826" width="1660" height="14" fill="#4a423a" stroke="#6a5e50"/>' +
      '<path d="M-20 858H1640" stroke="#1d1814" stroke-width="34" stroke-dasharray="16 22"/><rect x="-20" y="874" width="1660" height="140" fill="#17120f"/><path d="M-20 876H1640" stroke="#4a3e32" stroke-width="3"/>' +
      '</g>' +
      // The four chariots, far lane to near.
      '<g class="mv-b">' +
      dasher(738, 1.15, 0) +
      dasher(768, 1.35, 1) +
      dasher(798, 1.55, 2) +
      dasher(828, 1.75, 3) +
      '</g>' +
      pigeon(110, 1.2, -1.5) +
      pigeon(150, 1, -2.4) +
      pigeon(80, 1.1, -3.1) +
      pigeon(190, 0.9, -3.8) +
      pigeon(130, 1.3, -4.4) +
      pigeon(170, 1, -5) +
      petals,
    nook:
      // A fluted pillar behind the desk with a wall torch, and the ledge's plinth.
      `<rect x="368" y="-540" width="56" height="994" fill="#17120f" stroke="${MARBLE_EDGE}" stroke-opacity=".5" stroke-width="2"/>` +
      '<path d="M380 -540V452M392 -540V452M404 -540V452M416 -540V452" stroke="#0a0709" stroke-width="3"/>' +
      '<g transform="translate(396 -90)"><circle cy="-20" r="56" fill="#ff9a3a" fill-opacity=".07"/><circle cy="-20" r="30" fill="#ffc060" fill-opacity=".1"/>' +
      `<path d="M-8 0H8L5 22H-5Z" fill="${BRONZE}"/><g class="co-fl"><path d="M0 -2C-9 -8 -7 -22 0 -34C7 -22 9 -8 0 -2Z" fill="${FLAME}" fill-opacity=".92"/></g></g>` +
      '<rect x="-80" y="452" width="520" height="22" fill="#2a241e"/><path d="M-80 452H440" stroke="#6a5e50" stroke-width="2"/>',
    front: '',
  }
}
