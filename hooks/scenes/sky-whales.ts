import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Sky Whales: a dreamer in a knitted beanie codes on a rooftop at night, under string lights. Gigantic whales swim
// slowly through the clouds, their bellies and spots glowing. When a command runs the biggest one breaches up
// through the cloud bank and sprays stars; on an error it dives and a light rain starts; when done the lanterns rise
// and a calf joins its mother.
const WOOL = '#c4553f'
const CREAM = '#e8d9bd'
const MUSTARD = '#e0a63a'
const WOOD = '#2a1f2e'
const WOOD_EDGE = '#43324a'
const LANTERN = '#ffb15a'

const sparkle = (s: number): string =>
  `M0 ${f(-s)}L${f(s * 0.26)} ${f(-s * 0.26)}L${f(s)} 0L${f(s * 0.26)} ${f(s * 0.26)}L0 ${f(s)}L${f(-s * 0.26)} ${f(s * 0.26)}L${f(-s)} 0L${f(-s * 0.26)} ${f(-s * 0.26)}Z`

const starfish = (r: number): string => {
  const pts: string[] = []

  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r

    pts.push(`${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))}`)
  }

  return `M${pts.join('L')}Z`
}

/** One whale facing left, 600 long and centred on its own origin; its tail flukes sway, its spots pulse. */
function whale(rim: number, lite = false): string {
  const spots: [number, number, number][] = [
    [-196, -8, 5],
    [-128, -34, 4],
    [-64, -10, 6],
    [-2, -42, 4],
    [44, -6, 5],
    [96, -24, 4],
    [146, -2, 3.4],
    [-236, 34, 3.6],
    [-92, 42, 4],
    [14, 54, 4.6],
  ]

  return (
    '<path d="M-300 14C-304 -44 -236 -90 -130 -92C-20 -96 90 -74 176 -34C214 -18 236 -12 258 -14L262 -2C240 8 212 20 176 36C100 72 -20 94 -130 92C-230 90 -296 64 -300 14Z" fill="url(#wh-body)"/>' +
    '<g clip-path="url(#wh-clip)"><ellipse cx="-10" cy="96" rx="300" ry="62" fill="url(#wh-belly)"/>' +
    (lite ? '' : '<ellipse cx="-170" cy="70" rx="120" ry="40" fill="url(#wh-belly)" fill-opacity=".6"/><path d="M-250 60C-190 84 -120 92 -30 90M-230 74C-170 94 -100 100 -20 100M-200 48C-150 66 -90 74 -20 74" fill="none" stroke="#bfe8ff" stroke-opacity=".16" stroke-width="2"/>') +
    '</g>' +
    `<path d="M-300 14C-304 -44 -236 -90 -130 -92C-20 -96 90 -74 176 -34C214 -18 236 -12 258 -14" fill="none" stroke="#a8c4ff" stroke-opacity="${rim}" stroke-width="3" stroke-linecap="round"/>` +
    '<path d="M-298 24C-250 44 -190 58 -120 60" fill="none" stroke="#02040e" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="-236" cy="14" r="4.6" fill="#02040e"/><circle cx="-237.4" cy="12.6" r="1.4" fill="#cfe4ff"/>' +
    '<path d="M-112 56C-96 100 -56 132 -10 138C-22 106 -30 82 -34 62Z" fill="#0b1438" stroke="#a8c4ff" stroke-opacity=".3" stroke-width="2"/>' +
    `<g class="wh-spots" fill="#cfeeff">${spots.slice(0, lite ? 5 : 10).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>` +
    '<g transform="translate(258 -8)"><g class="wh-fl">' +
    '<path d="M0 6C14 -4 30 -30 40 -64C54 -52 80 -54 100 -66C94 -34 76 -10 50 4C34 12 14 14 0 10Z" fill="#0a1233"/>' +
    '<path d="M40 -64C54 -52 80 -54 100 -66" fill="none" stroke="#a8c4ff" stroke-opacity=".4" stroke-width="2.4" stroke-linecap="round"/></g></g>'
  )
}

function bank(y: number, seed: number, fill: string, rim: string, min: number, max: number, hmin: number, hmax: number): { fill: string; rim: string } {
  const next = random(seed)
  let d = `M-140 ${y}`
  let x = -140

  while (x < 1740) {
    const w = min + next() * (max - min)

    d += `a${f(w / 2)} ${f(hmin + next() * (hmax - hmin))} 0 0 1 ${f(w)} 0`
    x += w
  }

  return {
    fill: `<path d="${d}V1200H-140Z" fill="${fill}"/>`,
    rim: `<path d="${d}" fill="none" stroke="${rim}" stroke-width="2.4" stroke-linejoin="round"/>`,
  }
}

function jelly(color: string, glow: string): string {
  return (
    `<g class="wh-pulse"><path d="M-26 4C-26 -34 26 -34 26 4C16 -4 -16 -4 -26 4Z" fill="${color}" fill-opacity=".55" stroke="${glow}" stroke-opacity=".8" stroke-width="2"/>` +
    `<ellipse cx="0" cy="-12" rx="12" ry="8" fill="${glow}" fill-opacity=".35"/></g>` +
    `<path class="wh-tent" d="M-16 2C-22 20 -10 30 -16 50M-5 3C-10 22 2 32 -4 56M6 3C0 22 12 30 6 52M17 2C12 20 24 28 18 46" fill="none" stroke="${glow}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`
  )
}

const lanternShape = (s: number): string =>
  `<g transform="scale(${f(s)})"><circle r="24" fill="url(#wh-lglow)"/><path d="M-9-12H9L11 8Q0 14-11 8Z" fill="${LANTERN}"/><path d="M-9-12H9L7-16H-7Z" fill="#7a3a2a"/></g>`

/** The laptop on its crate, a small paper lantern and a mug. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${246 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const sway = activity === 'thinking' ? ' wh-lsw' : ''

  return (
    '<rect x="240" y="323" width="96" height="7" rx="2" fill="#4a4a62"/>' +
    keys +
    '<path d="M328 327L354 238L364 240L338 329Z" fill="#4a4a62"/>' +
    `<path d="M329 324L353 242L357 243L333 326Z" fill="${light}"/>` +
    `<path d="M329 324L353 242L340 246L320 324Z" fill="${light}" fill-opacity=".18"/>` +
    `<path d="M356 252l3 5l5 2l-5 2l-3 5l-3 -5l-5 -2l5 -2z" fill="${LANTERN}" fill-opacity=".9" transform="translate(0 6)"/>` +
    // The mug of cocoa.
    '<path d="M352 330H372L370 312H354Z" fill="#6a4a5a"/><path d="M372 316Q382 318 372 326" fill="none" stroke="#6a4a5a" stroke-width="3"/>' +
    '<ellipse cx="362" cy="312" rx="8" ry="2" fill="#3a2418"/>' +
    // The paper lantern.
    `<g class="${`wh-fl2${sway}`}"><circle cx="410" cy="300" r="34" fill="url(#wh-lglow)"/></g>` +
    `<path d="M398 288H422L426 316Q410 326 394 316Z" fill="${LANTERN}" fill-opacity=".92"/><path d="M398 288H422L418 282H402Z" fill="#7a3a2a"/>` +
    '<path d="M396 302H424" stroke="#7a3a2a" stroke-opacity=".5" stroke-width="2"/>'
  )
}

export function skyWhalesWorld(): World {
  const next = random(11)
  const stars = (n: number, y0: number, y1: number, k: number): string =>
    Array.from({ length: n }, () => `<circle cx="${f(next() * 1600)}" cy="${f(y0 + next() * (y1 - y0))}" r="${f(0.8 + next() * 1.3)}" fill="${k % 2 ? '#dfe8ff' : '#fff1d0'}"/>`).join('')
  const sparkles = Array.from({ length: 7 }, () => `<path d="${sparkle(5 + next() * 5)}" transform="translate(${f(next() * 1600)} ${f(20 + next() * 380)})" fill="#e8f0ff" fill-opacity=".8"/>`).join('')

  const far = bank(660, 3, '#131f58', '#5f7ed0', 170, 320, 30, 56)
  const mid = bank(715, 5, '#1a2a6c', '#7f9ce6', 150, 280, 26, 48)
  const front = bank(775, 8, '#22347e', '#9db6fa', 130, 240, 22, 42)

  // The sleeping town: two rows of gabled roofs with chimneys and a few lit windows.
  const town = (seed: number, base: number, hmin: number, hmax: number, fill: string, lit: number): string => {
    const g = random(seed)
    let x = -40
    let out = ''

    while (x < 1660) {
      const w = 100 + g() * 110
      const h = hmin + g() * (hmax - hmin)
      const roof = 26 + g() * 24

      out += `<path d="M${f(x)} ${base}V${f(base - h)}L${f(x + w / 2)} ${f(base - h - roof)}L${f(x + w)} ${f(base - h)}V${base}Z" fill="${fill}"/>`
      if (g() > 0.45) out += `<rect x="${f(x + w * 0.62)}" y="${f(base - h - roof - 18 + roof * 0.4)}" width="12" height="${f(roof + 12)}" fill="${fill}"/>`
      if (g() < lit) out += `<rect x="${f(x + w * 0.3)}" y="${f(base - h + 14)}" width="9" height="12" fill="#ffc872" fill-opacity=".75"/>`
      x += w + g() * 14
    }

    return out
  }

  const farWhale = (cx: number, cy: number, s: number, delay: number): string =>
    `<g transform="translate(${cx} ${cy}) scale(${s})"><g class="wh-bobY" style="animation-delay:${delay}s">${whale(0.55, true)}</g></g>`

  const sprayStars = Array.from({ length: 12 }, (_, i) => {
    const a = (-70 + (i / 11) * 140 + (next() - 0.5) * 14) * (Math.PI / 180)
    const power = 90 + next() * 120

    return `<path class="wh-sp" style="--dx:${f(Math.sin(a) * power)}px;--dy:${f(-Math.cos(a) * power * 0.9)}px;animation-delay:${f(next() * 0.35)}s" d="${sparkle(5 + next() * 5)}" fill="${i % 3 ? '#fff0b8' : '#bfe8ff'}"/>`
  }).join('')

  const puffs = Array.from({ length: 6 }, (_, i) => `<circle class="wh-pf" style="--dx:${f((i - 2.5) * 44)}px;animation-delay:${f(i * 0.05)}s" cx="${f(190 + i * 80)}" cy="${f(760 + (i % 2) * 14)}" r="${f(22 + next() * 20)}" fill="#7f9ce6"/>`).join('')

  const lanterns = Array.from({ length: 24 }, (_, i) => {
    const x = 20 + (i / 24) * 1560 + (next() - 0.5) * 30
    const dur = 5 + next() * 3

    return `<g class="wh-lan" style="--dx:${f((next() - 0.5) * 160)}px;animation-duration:${f(dur)}s;animation-delay:${f(next() * 1.5)}s"><g transform="translate(${f(x)} ${f(900 + next() * 40)})">${lanternShape(0.9 + next() * 0.8)}</g></g>`
  }).join('')

  const floaters = Array.from({ length: 5 }, (_, i) => {
    const x = i % 2 ? 40 + next() * 330 : 1230 + next() * 330

    return `<g class="wh-fly" style="animation-duration:${f(46 + next() * 24)}s;animation-delay:${f(-next() * 60)}s"><g transform="translate(${f(x)} ${f(700 + next() * 220)})">${lanternShape(0.7 + next() * 0.5)}</g></g>`
  }).join('')

  const jellies = [
    { y: 130, c: '#ff9ad5', g: '#ffd0f0', s: 2.2, d: 0 },
    { y: 300, c: '#7fe0ff', g: '#d2f6ff', s: 1.8, d: -4 },
    { y: 440, c: '#b59cff', g: '#e4d8ff', s: 2.6, d: -9 },
    { y: 210, c: '#7fe0ff', g: '#d2f6ff', s: 1.5, d: -12 },
    { y: 380, c: '#b59cff', g: '#e4d8ff', s: 1.7, d: -2 },
  ]
    .map(j => `<g class="wh-jf" style="animation-delay:${j.d}s"><g transform="translate(0 ${j.y}) scale(${j.s})"><g class="wh-jb" style="animation-delay:${j.d / 2}s">${jelly(j.c, j.g)}</g></g></g>`)
    .join('')

  const ring = (n: number, r: number, secs: number, rev: boolean, colors: string[]): string =>
    `<g class="wh-ring" style="animation-duration:${secs}s${rev ? ';animation-direction:reverse' : ''}">${Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2

      return `<path d="${starfish(7)}" transform="translate(${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}) rotate(${f(a * 57)})" fill="${colors[i % colors.length]}" fill-opacity=".92"/>`
    }).join('')}</g>`

  const bulbs = (path: (t: number) => [number, number], n: number, phase: number): string =>
    Array.from({ length: n }, (_, i) => {
      const [x, y] = path((i + 0.5) / n)
      const c = ['#ffc872', '#ff9ad5', '#9fe0ff', '#ffe08a'][(i + phase) % 4]

      return (
        `<g class="wh-tw" style="animation-delay:${f(-(i * 0.55))}s"><circle cx="${f(x)}" cy="${f(y + 9)}" r="13" fill="${c}" fill-opacity=".22"/></g><circle cx="${f(x)}" cy="${f(y + 9)}" r="3.4" fill="${c}"/>`
      )
    }).join('')

  const quad = (p0: [number, number], c: [number, number], p1: [number, number]) => (t: number): [number, number] => [
    (1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0],
    (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1],
  ]

  const shingles = Array.from({ length: 2 }, (_, i) => `<path d="M-430 ${474 + i * 22}H440" stroke="#1a2250" stroke-width="2"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#05060f',
      furniture: WOOD,
      metal: '#4a4a62',
      paper: CREAM,
      light: { idle: '#6c86c8', work: '#8fb4ff', bright: '#d6e4ff' },
      headTop: 207,
      glowAt: [338, 284],
      device,
      wear: {
        front:
          // The knitted beanie: a dome in stripes, a ribbed cuff above the eyes and a swaying pompom.
          '<defs><clipPath id="wh-bc"><path d="M62 252C58 214 92 192 150 192C208 192 242 214 238 252Z"/></clipPath></defs>' +
          `<g clip-path="url(#wh-bc)"><rect x="50" y="186" width="200" height="70" fill="${WOOL}"/>` +
          `<rect x="50" y="212" width="200" height="9" fill="${CREAM}"/><rect x="50" y="228" width="200" height="6" fill="${CREAM}" fill-opacity=".85"/>` +
          '<path d="M70 200L84 252M96 194L108 252M124 192L132 252M152 192V252M180 192L172 252M208 194L196 252M232 200L220 252" stroke="#8a3a2c" stroke-opacity=".5" stroke-width="2"/></g>' +
          `<rect x="62" y="238" width="176" height="14" rx="4" fill="${CREAM}"/>` +
          '<path d="M72 239V251M84 239V251M96 239V251M108 239V251M120 239V251M132 239V251M144 239V251M156 239V251M168 239V251M180 239V251M192 239V251M204 239V251M216 239V251M228 239V251" stroke="#b89f78" stroke-opacity=".7" stroke-width="2"/>' +
          `<g class="wh-pom"><circle cx="150" cy="186" r="17" fill="${CREAM}"/><path d="M138 182L146 176M152 172L160 178M144 192L156 194M162 188L164 196" stroke="#b89f78" stroke-width="2" stroke-linecap="round"/></g>` +
          // The scarf on the body, below the eyes, its tail swaying.
          `<rect x="68" y="318" width="164" height="16" rx="4" fill="${MUSTARD}"/><rect x="68" y="324" width="164" height="4" fill="${CREAM}" fill-opacity=".8"/>` +
          `<g class="wh-sc"><path d="M80 328H106L110 358H84Z" fill="${MUSTARD}"/><path d="M82 340H108M84 350H110" stroke="${CREAM}" stroke-width="4" stroke-opacity=".85"/><path d="M84 358V366M90 358V368M96 358V366M102 358V368M108 358V366" stroke="${MUSTARD}" stroke-width="2.4"/></g>`,
      },
      seatArt:
        // A plump cushion on a low crate.
        `<rect x="116" y="410" width="76" height="46" rx="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/><path d="M116 432H192" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        '<path d="M100 358C98 346 112 350 152 350C192 350 206 346 204 358C210 378 204 402 196 410H108C100 402 94 378 100 358Z" fill="#3a2f66" stroke="#5a4a96" stroke-width="2"/>' +
        '<path d="M104 372C130 380 174 380 200 372" fill="none" stroke="#5a4a96" stroke-width="2"/><circle cx="152" cy="352" r="3" fill="#8a7acc"/>' +
        `<path d="M104 408l-6 12M200 408l6 12" stroke="${MUSTARD}" stroke-width="3" stroke-linecap="round"/>`,
      tableArt:
        // A small crate for the laptop, and a second one under it.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"><rect x="166" y="330" width="304" height="12" rx="2"/><rect x="184" y="342" width="116" height="114"/><rect x="360" y="342" width="94" height="114"/></g>` +
        `<g stroke="${WOOD_EDGE}" stroke-width="2"><path d="M184 372H300M184 402H300M184 432H300M360 372H454M360 402H454M360 432H454"/><path d="M184 342L300 372M360 342L454 372"/></g>` +
        '<g fill="#8a7acc" fill-opacity=".5"><circle cx="190" cy="348" r="2.6"/><circle cx="294" cy="348" r="2.6"/><circle cx="366" cy="348" r="2.6"/><circle cx="448" cy="348" r="2.6"/></g>',
    },
    style:
      // The whales drift, bob and sway; flukes beat; spots pulse; clouds roll.
      '.wh-dr{animation:wh-dr 36s ease-in-out infinite alternate}@keyframes wh-dr{to{transform:translateX(46px)}}' +
      '.wh-dr2{animation-duration:48s;animation-direction:alternate-reverse}' +
      '.wh-bobY{animation:wh-bob 9s ease-in-out infinite alternate}@keyframes wh-bob{from{transform:translateY(-10px)}to{transform:translateY(12px)}}' +
      '.wh-fl{animation:wh-fl 5s ease-in-out infinite alternate}@keyframes wh-fl{from{transform:rotate(-9deg)}to{transform:rotate(10deg)}}' +
      '.wh-spots{animation:wh-pulse 5s ease-in-out infinite alternate}@keyframes wh-pulse{from{opacity:.4}to{opacity:.95}}' +
      '.wh-cl{animation:wh-cl 60s ease-in-out infinite alternate}@keyframes wh-cl{to{transform:translateX(70px)}}' +
      '.wh-cl2{animation-direction:alternate-reverse;animation-duration:44s}' +
      '.wh-tw{animation:wh-tw 3.2s ease-in-out infinite alternate}@keyframes wh-tw{from{opacity:.35}to{opacity:1}}' +
      '.wh-st{animation:wh-star 5s ease-in-out infinite alternate}.wh-st2{animation-duration:7s;animation-delay:-2s}.wh-st3{animation-duration:4s;animation-delay:-1s}' +
      '@keyframes wh-star{from{opacity:.4}to{opacity:1}}' +
      '.wh-pom{transform-box:fill-box;transform-origin:50% 100%;animation:wh-pom 2.6s ease-in-out infinite alternate}@keyframes wh-pom{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.wh-sc{transform-box:fill-box;transform-origin:50% 0;animation:wh-sc 3s ease-in-out infinite alternate}@keyframes wh-sc{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
      '.wh-fl2{animation:wh-lf 2.6s ease-in-out infinite alternate}@keyframes wh-lf{from{opacity:.65}to{opacity:1}}' +
      '.wh-lsw{animation-duration:.9s}' +
      '.wh-fly{animation:wh-fly 60s linear infinite}@keyframes wh-fly{from{transform:translate(0,0)}to{transform:translate(50px,-980px)}}' +
      // Chimney smoke.
      '.wh-sm{animation:wh-sm 7s ease-out infinite}@keyframes wh-sm{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.4}100%{opacity:0;transform:translate(40px,-110px) scale(2.2)}}' +
      // run: the big whale breaches up through the cloud bank and sprays stars.
      '.st-run .wh-brY{animation:wh-brY 7s linear infinite}' +
      '@keyframes wh-brY{0%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.7,.3,1)}30%{transform:translateY(-200px);animation-timing-function:ease-in-out}44%{transform:translateY(-220px);animation-timing-function:cubic-bezier(.5,0,.8,.6)}78%,100%{transform:translateY(0)}}' +
      '.st-run .wh-brR{animation:wh-brR 7s linear infinite}' +
      '@keyframes wh-brR{0%{transform:rotate(0);animation-timing-function:ease-out}30%{transform:rotate(30deg);animation-timing-function:ease-in-out}48%{transform:rotate(16deg)}78%{transform:rotate(-22deg)}100%{transform:rotate(0)}}' +
      '.wh-sp{opacity:0}.st-run .wh-sp{animation:wh-sp 7s ease-out infinite}' +
      '@keyframes wh-sp{0%,22%{opacity:0;transform:translate(0,0) scale(.4)}27%{opacity:1;transform:translate(0,0) scale(1)}42%{opacity:1;transform:translate(var(--dx),var(--dy))}66%{opacity:0;transform:translate(calc(var(--dx) * 1.3),calc(var(--dy) + 200px))}100%{opacity:0}}' +
      '.wh-pf{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .wh-pf{animation:wh-pf 7s ease-out infinite}' +
      '@keyframes wh-pf{0%,6%{opacity:0;transform:translate(0,0) scale(.4)}16%{opacity:.5}44%,100%{opacity:0;transform:translate(var(--dx),-90px) scale(1.5)}}' +
      // error: a whale dives, the clouds darken and a light rain falls.
      '.st-error .wh-brY{animation:wh-dive 4s ease-in both}@keyframes wh-dive{to{transform:translateY(240px)}}' +
      '.st-error .wh-brR{animation:wh-diveR 4s ease-in both}@keyframes wh-diveR{to{transform:rotate(-26deg)}}' +
      '.wh-dark{opacity:0}.st-error .wh-dark{animation:wh-dark 2.6s ease-out .3s both}@keyframes wh-dark{to{opacity:.5}}' +
      '.wh-rain{opacity:0}.st-error .wh-rain{animation:wh-rainin 2.4s ease-out .8s both}@keyframes wh-rainin{to{opacity:1}}' +
      // done: lanterns rise and a calf joins its mother.
      '.wh-lan{opacity:0}.st-done .wh-lan{animation:wh-lan 8s ease-in infinite}' +
      '@keyframes wh-lan{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}85%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-1150px)}}' +
      '.wh-calf{opacity:0}.st-done .wh-calf{animation:wh-calf 3.6s ease-out both}' +
      '@keyframes wh-calf{0%{opacity:0;transform:translate(560px,150px)}12%{opacity:1}100%{opacity:1;transform:translate(0,0)}}' +
      '.st-done .wh-spots{animation:none;opacity:1}' +
      // web: jellyfish-like sky creatures drift by.
      '.wh-jf{opacity:0}.st-web .wh-jf{animation:wh-jf 20s linear infinite}' +
      '@keyframes wh-jf{0%{opacity:0;transform:translateX(1760px)}6%{opacity:.85}92%{opacity:.85}100%{opacity:0;transform:translateX(-160px)}}' +
      '.wh-jb{animation:wh-jb 6s ease-in-out infinite alternate}@keyframes wh-jb{from{transform:translateY(-26px)}to{transform:translateY(26px)}}' +
      '.wh-pulse{transform-box:fill-box;transform-origin:50% 20%;animation:wh-bell 2.2s ease-in-out infinite alternate}@keyframes wh-bell{to{transform:scale(1.12,.84)}}' +
      '.wh-tent{transform-box:fill-box;transform-origin:50% 0;animation:wh-tent 2.2s ease-in-out infinite alternate}@keyframes wh-tent{to{transform:scale(.9,1.12) skewX(5deg)}}' +
      // tool: a school of tiny star-fish swirls.
      '.wh-school{opacity:0}.st-tool .wh-school{animation:wh-in .9s ease-out both}@keyframes wh-in{to{opacity:1}}' +
      '.wh-ring{animation:mv-spin 7s linear infinite}' +
      '.wh-sy{animation:wh-sy 3s ease-in-out infinite alternate}@keyframes wh-sy{from{transform:translate(-18px,-10px)}to{transform:translate(22px,12px)}}',
    scenery:
      '<defs><linearGradient id="wh-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050f"/><stop offset=".45" stop-color="#0a1448"/><stop offset=".85" stop-color="#1a2a70"/></linearGradient>' +
      '<linearGradient id="wh-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1538"/><stop offset="1" stop-color="#14204e"/></linearGradient>' +
      '<radialGradient id="wh-belly"><stop offset="0" stop-color="#a8f0ff" stop-opacity=".95"/><stop offset=".55" stop-color="#7aa8ff" stop-opacity=".45"/><stop offset="1" stop-color="#7aa8ff" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="wh-clip"><path d="M-300 14C-304 -44 -236 -90 -130 -92C-20 -96 90 -74 176 -34C214 -18 236 -12 258 -14L262 -2C240 8 212 20 176 36C100 72 -20 94 -130 92C-230 90 -296 64 -300 14Z"/></clipPath>' +
      '<radialGradient id="wh-moon"><stop offset="0" stop-color="#cfdcff" stop-opacity=".34"/><stop offset="1" stop-color="#cfdcff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="wh-lglow"><stop offset="0" stop-color="#ffb15a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb15a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="wh-col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#02040e" stop-opacity="0"/><stop offset=".14" stop-color="#02040e" stop-opacity=".3"/><stop offset=".86" stop-color="#02040e" stop-opacity=".3"/><stop offset="1" stop-color="#02040e" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#wh-sky)"/>' +
      `<g class="wh-st">${stars(24, 0, 600, 0)}</g><g class="wh-st wh-st2">${stars(22, 0, 600, 1)}</g><g class="wh-st wh-st3">${stars(18, 0, 640, 2)}${sparkles}</g>` +
      // The big crescent moon.
      '<circle cx="124" cy="116" r="170" fill="url(#wh-moon)"/><path d="M160 54A70 70 0 1 0 160 178A61 61 0 1 1 160 54Z" fill="#e6edff" fill-opacity=".92"/>' +
      // Far whale, top band, drifting the other way.
      `<g class="mv-r"><g class="wh-dr wh-dr2">${farWhale(1000, 140, 0.72, -3)}</g></g>` +
      `<g class="wh-cl wh-cl2">${far.fill}</g>` +
      // Mother whale at the far right, with the calf that joins her.
      `<g class="mv-r"><g transform="translate(1400 400) scale(1)"><g class="wh-dr wh-dr2" style="animation-delay:-14s"><g class="wh-bobY" style="animation-delay:-4s">${whale(0.85)}` +
      `<g class="wh-calf"><g transform="translate(-70 150) scale(.5)">${whale(0.5, true)}</g></g></g></g></g></g>` +
      `<g class="wh-cl">${mid.fill}${mid.rim}</g>` +
      // The big whale.
      '<g transform="translate(400 610) scale(1.3)"><g class="wh-dr"><g class="wh-bobY"><g class="wh-brY">' +
      `<g class="wh-brR">${whale(0.9)}</g><g transform="translate(-100 -158) scale(1.3)">${sprayStars}</g></g></g></g></g>` +
      puffs +
      `<g class="wh-cl wh-cl2" style="animation-duration:36s">${front.fill}${front.rim}</g>` +
      `<g class="wh-school"><g transform="translate(200 330) scale(1.5 .95)"><g class="wh-sy">${ring(9, 96, 8, false, ['#ffd98a', '#ffb3dc', '#a8ecff'])}${ring(7, 60, 5.5, true, ['#ffd98a', '#a8ecff', '#ffb3dc'])}${ring(5, 28, 3.6, false, ['#fff1c0', '#ffb3dc'])}</g></g></g>` +
      '<g class="mv-b">' +
      `<g fill="#0a1236">${town(21, 960, 30, 80, '#0b1440', 0.1)}</g>${town(22, 1010, 40, 100, '#050a1f', 0.3)}` +
      '<rect x="-40" y="1000" width="1700" height="400" fill="#050a1f"/>' +
      '</g>' +
      floaters +
      `<g class="wh-ls">${jellies}</g>` +
      `<g class="wh-lanterns">${lanterns}</g>` +
      '<rect class="wh-dark" width="1600" height="1000" fill="#02040e"/>' +
      `<g class="wh-rain">${rain({ seed: 6, count: 90, length: [24, 46], slant: 120, seconds: .9, stroke: '#b8d0ff', opacity: 0.4 })}</g>` +
      '<rect x="380" width="840" height="1000" fill="url(#wh-col)"/>',
    nook:
      '<defs><radialGradient id="wh-bg"><stop offset="0" stop-color="#ffc872" stop-opacity=".5"/><stop offset="1" stop-color="#ffc872" stop-opacity="0"/></radialGradient></defs>' +
      // The roof, a chimney with smoke and the pole the lights hang from.
      '<path d="M-440 456L450 456V640H-440Z" fill="#0a1236"/><path d="M-440 456H450" stroke="#2a3a7a" stroke-width="3"/>' +
      shingles +
      '<g fill="#080e2c"><rect x="-330" y="300" width="64" height="160"/><rect x="-340" y="290" width="84" height="14"/></g>' +
      '<circle class="wh-sm" cx="-298" cy="280" r="16" fill="#8a9ad0"/><circle class="wh-sm" style="animation-delay:-2.3s" cx="-298" cy="280" r="16" fill="#8a9ad0"/><circle class="wh-sm" style="animation-delay:-4.6s" cx="-298" cy="280" r="16" fill="#8a9ad0"/>' +
      '<rect x="4" y="60" width="7" height="400" fill="#080e2c"/><rect x="420" y="30" width="7" height="430" fill="#080e2c"/><path d="M-4 66H20M410 36H436" stroke="#080e2c" stroke-width="5"/>' +
      `<path d="M7 66Q220 190 424 36" fill="none" stroke="#14121f" stroke-width="2.4"/>${bulbs(quad([7, 66], [215, 190], [424, 36]), 13, 0)}` +
      `<path d="M7 66Q-150 190 -298 288" fill="none" stroke="#14121f" stroke-width="2.4"/>${bulbs(quad([7, 66], [-150, 190], [-298, 288]), 9, 1)}`,
  }
}
