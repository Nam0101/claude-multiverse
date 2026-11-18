import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Ashfall: a volcanologist's field station on a ridge across the valley from an erupting volcano, with ash falling
// like grey snow. Lava rivers glow down the cone and the ash plume bends across the top of the sky. When a command
// runs the volcano erupts: a lava fountain, bombs arcing out, the ash column billowing up. An error sends a
// pyroclastic cloud rolling down the slope toward the station; done cools the lava to crust and thins the ash to stars.
const ACCENT = '#ff4d2e'
const LAVA = '#ff6a2a'
const HOT = '#ffb24f'
const ASH = '#b3a9a4'
const DUST = '#7a706c'
const CASE = '#2e2724'
const CASE_EDGE = '#4a3f3a'
const CX = 262
const CY = 352

// The plume: puffs from the crater up, then bent along the top of the sky by the wind. [x, y, r]
const PLUME: readonly (readonly [number, number, number])[] = [
  [262, 304, 44], [242, 256, 58], [286, 248, 50], [258, 200, 70], [208, 172, 56], [312, 154, 78],
  [254, 118, 72], [376, 104, 86], [466, 82, 94], [570, 68, 98], [680, 62, 94], [790, 68, 88],
  [898, 78, 82], [1000, 90, 74], [1094, 100, 64], [1180, 108, 54],
]

// The bombs a command throws out of the crater: sideways, how high, where they land on the flanks below the crater.
const BOMBS: readonly (readonly [number, number, number, number])[] = [
  [-230, -230, 300, 0.05], [-140, -320, 175, 0.45], [-60, -360, 96, 0.9], [70, -340, 110, 0.25],
  [140, -280, 196, 0.7], [-250, -190, 400, 1.15], [150, -210, 280, 1.4], [-190, -380, 260, 1.75], [104, -400, 150, 2],
]

// The pyroclastic flow, puff by puff, laid along the ground it rolls over (y 100), heading right: a low,
// ground-hugging front and a tall billow trailing behind it. [x, y, r]
const PYRO: readonly (readonly [number, number, number])[] = [
  [-230, 50, 44], [-170, 48, 54], [-100, 46, 60], [-30, 46, 60], [40, 48, 56], [110, 52, 50], [172, 58, 46],
  [228, 70, 36], [-200, -10, 62], [-130, -30, 76], [-60, -20, 70], [10, -4, 60], [80, 12, 48],
  [140, 30, 36], [-170, -100, 64], [-100, -120, 72], [-30, -84, 58], [36, -46, 44], [-130, -186, 56], [-62, -170, 48],
]

// The three lava rivers down the cone, as one path.
const RIVERS =
  'M236 360C226 392 206 420 196 462C184 512 150 548 140 600C130 650 96 700 70 770' +
  'M262 362C266 400 256 440 262 488C268 540 250 590 258 650C264 700 248 750 252 812' +
  'M290 360C300 392 318 420 322 462C328 512 348 552 352 600C356 640 372 690 384 760'

type Box = readonly [number, number, number, number]

/** Flakes or stars as one path: each a round-cap dot, or with `tail` a short dash along the way it falls. */
function dots(seed: number, count: number, box: Box, tail = 'h.1'): string {
  const next = random(seed)
  const [x0, y0, w, h] = box
  let d = ''

  for (let i = 0; i < count; i += 1) {
    d += `M${Math.round(x0 + next() * w)} ${Math.round(y0 + next() * h)}${tail}`
  }

  return d
}

/**
 * One layer of falling ash, drifting down and sideways and swaying, looping without a seam. `halo` draws a wider,
 * fainter stroke under each flake so the big near ones look soft, like wet snow.
 */
function ashfall(o: { seed: number; count: number; size: number; seconds: number; opacity: number; drift: number; sway: number; cls: string; box?: Box; tail?: string; halo?: number }): { markup: string; keys: string } {
  const d = dots(o.seed, o.count, o.box ?? [-80, 0, 1760, 1000], o.tail)
  const body = (o.halo ? `<path d="${d}" stroke-width="${o.halo}" stroke-opacity="${f(o.opacity * 0.26)}"/>` : '') + `<path d="${d}"/>`

  return {
    markup:
      `<g class="${o.cls}" stroke="${ASH}" stroke-opacity="${o.opacity}" stroke-width="${o.size}" stroke-linecap="round">` +
      `<g class="af-sw" style="animation-duration:${o.sway}s;animation-delay:${f(-o.sway * 0.4)}s"><g style="animation:af-f${o.seed} ${o.seconds}s linear infinite">` +
      `${body}<g transform="translate(${-o.drift} -1000)">${body}</g></g></g></g>`,
    keys: `@keyframes af-f${o.seed}{to{transform:translate(${o.drift}px,1000px)}}`,
  }
}

/** A charred dead tree, its foot at (x, y). */
function tree(x: number, y: number, s: number, lean: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s}) rotate(${lean})" fill="none" stroke="#060303" stroke-linecap="round">` +
    '<path d="M0 0C-2 -30 3 -60 0 -96" stroke-width="7"/>' +
    '<path d="M0 -38L-24 -62L-32 -66M1 -56L20 -82L28 -86M0 -74L-12 -94M-24 -62L-26 -76M20 -82L18 -96" stroke-width="3.4"/>' +
    `<path d="M-24 -62L-32 -66M20 -82L28 -86M-2 -96h.1" stroke="${DUST}" stroke-opacity=".35" stroke-width="2"/></g>`
  )
}

/** A seismograph row: a jagged line across the screen, with a burst of big swings around `burst` when it shakes. */
function trace(y: number, amp: number, seed: number, burst: number): string {
  const next = random(seed)
  let d = `M307 ${y}`

  for (let i = 1; i <= 13; i += 1) {
    const near = burst > 0 ? Math.exp(-((i - burst) ** 2) / 5) * burst : 0
    const a = amp * (0.35 + next() * 0.65) + near

    d += `L${307 + i * 3} ${f(y + (i % 2 ? -a : a))}`
  }

  return d
}

/** A short wobbly line around the drum's paper. */
function drumLine(y: number, seed: number): string {
  const next = random(seed)
  let d = `M373 ${y}`

  for (let x = 377; x <= 413; x += 4) {
    d += `L${x} ${f(y + (next() - 0.5) * 2.4)}`
  }

  return d
}

/** The rugged laptop with its seismograph, and a drum recorder whose pen swings with the ground. No gradients: the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const shaking = activity === 'run' || activity === 'error'
  const amp = activity === 'run' ? 4 : activity === 'error' ? 3.4 : activity === 'tool' ? 2.8 : activity === 'done' ? 0.5 : 1.5
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${246 + i * 12}" y="324" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')

  return (
    // The case, the rubber corners, the carry handle, the screen.
    `<rect x="236" y="320" width="122" height="11" rx="3" fill="${CASE}" stroke="${CASE_EDGE}" stroke-width="1.5"/>` +
    keys +
    `<path d="M282 326L296 232L362 236L356 326Z" fill="#2a2421" stroke="${CASE_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    '<path d="M282 326L285 308M356 326L358 308M296 232L298 248M362 236L361 252" stroke="#120e0d" stroke-width="8" stroke-linecap="round"/>' +
    `<path d="M306 226Q328 216 350 229" fill="none" stroke="${CASE_EDGE}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M300 232L358 236" stroke="${ASH}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M294 318L306 246L352 249L348 318Z" fill="#0b0605"/><path d="M294 318L306 246L352 249L348 318Z" fill="${light}" fill-opacity=".1"/>` +
    // Two rows of the record so far, and the live row drawn as it comes in.
    `<g fill="none" stroke="${light}" stroke-width="1.6" stroke-linejoin="round">` +
    `<path d="${trace(262, 1.3, 3, 0)}" stroke-opacity=".4"/><path d="${trace(281, shaking ? 2.6 : 1.4, 5, 0)}" stroke-opacity=".6"/>` +
    `<path class="af-tr" pathLength="1" d="${trace(301, amp, 9, shaking ? 7 : 0)}"/></g>` +
    // The drum recorder.
    `<rect x="364" y="318" width="56" height="12" rx="2" fill="${CASE}" stroke="${CASE_EDGE}" stroke-width="1.5"/>` +
    `<path d="M368 318V298M416 318V298" stroke="${CASE_EDGE}" stroke-width="3"/>` +
    '<rect x="370" y="290" width="46" height="25" rx="8" fill="#d8cdc6" fill-opacity=".8"/>' +
    `<g fill="none" stroke="#3a2a26" stroke-width="1.2"><path class="af-dr" d="${drumLine(296, 1)}"/><path class="af-dr" d="${drumLine(302, 2)}"/><path class="af-dr" d="${drumLine(308, 4)}"/></g>` +
    `<path d="M418 276V318" stroke="${CASE_EDGE}" stroke-width="3"/>` +
    `<g transform="translate(418 278)"><g class="${shaking ? 'af-pen af-pen2' : 'af-pen'}"><path d="M0 0L-24 22" stroke="#6a5a50" stroke-width="2.4"/>` +
    `<circle cx="-24" cy="22" r="2.2" fill="${ACCENT}"/></g></g>` +
    // Reading: the headlamp's warm pool on the notebook.
    (activity === 'read' ? '<ellipse class="af-beam" opacity="0" cx="240" cy="321" rx="24" ry="5" fill="#ffe6b8" fill-opacity=".5"/>' : '')
  )
}

export function ashfallWorld(): World {
  const next = random(4051)
  // Fine ash over the whole picture, the chat column included; big soft flakes only either side of it.
  const left: Box = [-80, 0, 470, 1000]
  const right: Box = [1190, 0, 480, 1000]
  const layers = [
    ashfall({ seed: 31, count: 150, size: 3.2, seconds: 22, opacity: 0.34, drift: 120, sway: 7, cls: 'af-al' }),
    ashfall({ seed: 32, count: 90, size: 5.4, seconds: 15, opacity: 0.42, drift: 90, sway: 5.5, cls: 'af-al' }),
    ashfall({ seed: 33, count: 40, size: 8.4, seconds: 10, opacity: 0.48, drift: 60, sway: 4.2, cls: 'af-al' }),
    ashfall({ seed: 34, count: 90, size: 5.4, seconds: 7, opacity: 0.46, drift: 140, sway: 3.6, cls: 'af-alx' }),
    ashfall({ seed: 51, count: 44, size: 9, seconds: 13, opacity: 0.46, drift: 40, sway: 5, cls: 'af-al', box: left, tail: 'l1 3' }),
    ashfall({ seed: 52, count: 24, size: 12, seconds: 9, opacity: 0.46, drift: 50, sway: 4, cls: 'af-al', box: left, halo: 22 }),
  ]
  // The same either side of the station, pinned to the right edge; a thicker fall there comes down after an eruption.
  const station = [
    ashfall({ seed: 53, count: 36, size: 9, seconds: 13.5, opacity: 0.46, drift: 40, sway: 5.2, cls: 'af-al', box: right, tail: 'l1 3' }),
    ashfall({ seed: 54, count: 18, size: 12, seconds: 9.5, opacity: 0.46, drift: 50, sway: 4.4, cls: 'af-al', box: right, halo: 22 }),
    ashfall({ seed: 55, count: 30, size: 10, seconds: 8, opacity: 0.5, drift: 70, sway: 3.8, cls: 'af-alr', box: right, tail: 'l1 4' }),
  ]
  // Under the plume across the top band, flakes drop out of it and fade before they reach the chat.
  const fallout = dots(56, 34, [420, -30, 760, 210], 'l1 4')
  const plumeAsh =
    `<g class="af-al" stroke="${ASH}" stroke-opacity=".4" stroke-width="7.5" stroke-linecap="round"><g class="af-sw" style="animation-duration:6.4s">` +
    `<path class="af-fo" d="${fallout}"/><path class="af-fo" style="animation-delay:-4.5s" d="${fallout}"/></g></g>`
  const plume = PLUME.map(([x, y, r], i) => {
    const flat = i >= 7
    const rx = flat ? r * 1.22 : r
    const ry = flat ? r * 0.82 : r
    const shade = ['#221816', '#281d1a', '#1d1513'][i % 3]

    return (
      '<g class="af-pf">' +
      `<ellipse cx="${x - 3}" cy="${y - 4}" rx="${f(rx + 3)}" ry="${f(ry + 3)}" fill="#34271f"/>` +
      `<ellipse cx="${x}" cy="${y}" rx="${f(rx)}" ry="${f(ry)}" fill="${shade}"/></g>`
    )
  }).join('')
  // Lobes hanging under the bent plume, behind it, so its underside billows unevenly.
  const lobes = PLUME.slice(6).map(([x, y, r], i) => {
    const cx = x + (next() - 0.5) * r * 0.9
    const cy = y + r * (0.36 + next() * 0.3)
    const cr = r * (0.36 + next() * 0.24)

    return (
      '<g class="af-pf">' +
      `<circle cx="${f(cx - 2)}" cy="${f(cy - 3)}" r="${f(cr + 2.5)}" fill="#34271f"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(cr)}" fill="${i % 2 ? '#241a17' : '#1f1614'}"/></g>`
    )
  }).join('')
  const column = Array.from({ length: 10 }, (_, i) => {
    const dx = [-30, 24, -12, 44, -52, 12, 34, -22, 50, -40][i]

    return `<circle class="af-col" cx="${CX}" cy="${CY - 60}" r="70" fill="url(#af-colg)" style="--dx:${dx}px;animation-delay:${f(i * 0.32)}s"/>`
  }).join('')
  // Each bomb with a fading trail behind it; its path rides in CSS variables, its start in --d.
  const bombs =
    `<g transform="translate(${CX} ${CY - 8})">` +
    BOMBS.map(
      ([dx, h, g, delay]) =>
        `<g style="--dx:${dx}px;--h:${h}px;--g:${g}px">` +
        `<g class="af-bx" style="--d:${f(delay + 0.07)}s"><g class="af-by"><circle r="3.8" fill="${LAVA}" fill-opacity=".5"/></g></g>` +
        `<g class="af-bx" style="--d:${delay}s"><g class="af-by"><circle r="22" fill="url(#af-bomb)"/><circle r="6" fill="${HOT}"/></g></g></g>`,
    ).join('') +
    '</g>'
  // Where each bomb lands, a glowing spatter that cools before the next one comes down.
  const impacts = BOMBS.map(([dx, , g, delay]) => {
    const x = CX + dx
    const y = CY - 8 + g

    return (
      `<g class="af-imp" style="--d:${f(delay + 2.29)}s"><ellipse cx="${x}" cy="${y}" rx="22" ry="7" fill="url(#af-impg)"/>` +
      `<path d="M${x - 10} ${y - 3}h.1M${x + 9} ${y - 5}h.1M${x + 1} ${y - 8}h.1" stroke="${HOT}" stroke-width="3" stroke-linecap="round"/></g>`
    )
  }).join('')
  const spatter = Array.from({ length: 6 }, (_, i) => {
    const x = CX - 30 + i * 12
    const dx = (i - 2.5) * 6

    return `<circle class="af-sp" cx="${x}" cy="${CY - 4}" r="2.6" fill="${HOT}" style="--dx:${f(dx)}px;animation-delay:${f(-i * 0.37)}s"/>`
  }).join('')
  const pyro = PYRO.map(([x, y, r]) => `<circle class="af-ch" cx="${x}" cy="${y}" r="${r}" fill="url(#af-pyg)"/>`).join('')
  // The close flakes in front of the desk start left of x 28 or right of 284: with their 50 of drift, 16 of sway and
  // 6 of flake they never cross the eyes (x 102..214).
  const close = dots(41, 5, [-60, -400, 88, 860], 'l1 3') + dots(42, 9, [284, -400, 156, 860], 'l1 3')
  const cracks =
    'M20 900L70 884L110 896L160 880M180 912L230 896L262 906M300 884L352 892L400 878M120 940L170 926L220 934' +
    'M470 902L520 894L560 900M640 910L700 902'
  const slopes = 'M204 394L188 430M222 386L214 420M296 380L306 410M318 392L334 430M180 452L166 480M340 446L356 478M150 500L138 524M366 494L380 520'
  const ridges = 'M226 366C200 440 150 520 92 640M250 372C236 470 214 560 190 700M300 366C330 450 372 540 452 660M318 372C380 470 470 590 600 740'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#060303',
      furniture: '#2a201c',
      metal: CASE,
      paper: '#e2d6cf',
      light: { idle: '#a8562a', work: '#ff9a4a', bright: '#ffd9a0' },
      headTop: 204,
      glowAt: [322, 282],
      device,
      wear: {
        // The heat-proof coat's aluminised hood, behind the body so only its silver edges show.
        behind:
          '<path d="M54 358L58 262C60 236 82 222 110 220H190C218 222 240 236 242 262L246 358Z" fill="#7d7672"/>' +
          '<path d="M60 268L58 352M240 268L242 352" stroke="#cbc3be" stroke-opacity=".55" stroke-width="3"/>' +
          '<path d="M56 316H70M230 316H244" stroke="#4a4441" stroke-width="2"/>',
        // A hard hat with a reflective band and a headlamp; under the eyes, a respirator with two acid-gas
        // cartridges. The hat's brim ends at 252 and the mask starts at 318, so the eyes stay clear in every gaze.
        front:
          '<path class="af-beam" opacity="0" d="M234 232L244 230L276 322H218Z" fill="#ffe6b8" fill-opacity=".26"/>' +
          '<path d="M62 248C62 214 100 194 150 194C200 194 238 214 238 248Z" fill="#b9b0aa" stroke="#6f6661" stroke-width="2"/>' +
          '<path d="M150 198V244" stroke="#d3ccc7" stroke-width="9" stroke-linecap="round"/>' +
          `<path d="M66 236H234" stroke="${ACCENT}" stroke-width="5"/>` +
          '<rect x="50" y="244" width="200" height="8" rx="3" fill="#9e958f"/>' +
          '<rect x="222" y="222" width="18" height="14" rx="3" fill="#221c1a"/><circle cx="238" cy="229" r="5" fill="#ffe6b8"/>' +
          `<path d="M108 204h.1M130 199h.1M176 200h.1M198 207h.1M90 216h.1" stroke="${DUST}" stroke-width="3.4" stroke-linecap="round"/>` +
          '<path d="M100 318L72 290M220 318L234 298" stroke="#1d1918" stroke-width="4"/>' +
          '<path d="M118 326C118 320 138 318 160 318C182 318 202 320 202 326V330C202 340 182 346 160 346C138 346 118 340 118 330Z" fill="#1d1918" stroke="#3a3330" stroke-width="2"/>' +
          '<rect x="152" y="322" width="16" height="16" rx="4" fill="#2e2826"/><path d="M155 327H165M155 332H165" stroke="#0c0a09" stroke-width="2"/>' +
          '<g fill="#d6a63a" stroke="#1d1918" stroke-width="3"><circle cx="110" cy="326" r="11.5"/><circle cx="210" cy="326" r="11.5"/></g>' +
          '<g fill="none" stroke="#7a5c1c" stroke-width="2"><circle cx="110" cy="326" r="5"/><circle cx="210" cy="326" r="5"/></g>',
      },
      seatArt:
        // A hard equipment case, latched, a hazard strip on its side, ash on its lid.
        `<rect x="102" y="350" width="98" height="106" rx="7" fill="#2b2320" stroke="${CASE_EDGE}" stroke-width="2"/>` +
        '<path d="M103 372H199M103 436H199" stroke="#18120f" stroke-width="4"/>' +
        '<g fill="#5a4c44"><rect x="118" y="360" width="14" height="18" rx="2"/><rect x="170" y="360" width="14" height="18" rx="2"/></g>' +
        '<path d="M110 392H192V408H110Z" fill="#d6a63a" fill-opacity=".7"/>' +
        '<path d="M116 392L108 408M132 392L124 408M148 392L140 408M164 392L156 408M180 392L172 408M196 392L188 408" stroke="#120d0b" stroke-width="5"/>' +
        `<path d="M106 351H196" stroke="${DUST}" stroke-opacity=".6" stroke-width="2.4"/>`,
      tableArt:
        // A plank on two crates.
        '<rect x="164" y="330" width="300" height="12" rx="2" fill="#3a2c24" stroke="#4e3d32" stroke-width="1.5"/>' +
        '<g fill="#221915" stroke="#3a2c24" stroke-width="2"><rect x="182" y="342" width="54" height="114"/><rect x="400" y="342" width="54" height="114"/></g>' +
        '<path d="M182 342L236 456M236 342L182 456M400 342L454 456M454 342L400 456" stroke="#3a2c24" stroke-width="3"/>' +
        `<path d="M166 331H462" stroke="${DUST}" stroke-opacity=".4" stroke-width="2"/>` +
        // A lava-rock sample on the ground under the desk, still glowing in its cracks, ash on its top.
        '<path d="M260 456C256 444 264 431 279 430C288 422 305 425 311 435C320 439 320 450 317 456Z" fill="#171110" stroke="#2c211d" stroke-width="1.5"/>' +
        `<path d="M268 450L279 441L288 445L299 434M288 445L292 454M300 446L310 441" fill="none" stroke="${ACCENT}" stroke-opacity=".8" stroke-width="1.8"/>` +
        `<path d="M272 432Q288 424 304 429" fill="none" stroke="${ASH}" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>`,
    },
    style:
      [...layers, ...station].map(l => l.keys).join('') +
      // Ambient: ash sways down, the plume billows and drifts, lava flows, the crater breathes and spatters.
      '.af-sw{animation:af-sw 6s ease-in-out infinite alternate}@keyframes af-sw{from{transform:translateX(-16px)}to{transform:translateX(16px)}}' +
      '.af-fo{animation:af-fo 9s linear infinite}@keyframes af-fo{0%{opacity:0;transform:translate(0,0)}22%{opacity:1}62%{opacity:1}100%{opacity:0;transform:translate(26px,290px)}}' +
      '.af-pf{transform-box:fill-box;transform-origin:center;animation:af-pf 8s ease-in-out infinite alternate}@keyframes af-pf{to{transform:scale(1.08) translate(4px,-3px)}}' +
      // Puffs out of step with each other, without timing every one.
      '.af-pf:nth-child(2n){animation-duration:6.4s;animation-delay:-2.6s}.af-pf:nth-child(3n){animation-duration:9.6s;animation-delay:-5s}.af-pf:nth-child(5n+1){animation-duration:7.2s;animation-delay:-1.4s}' +
      '.af-plume{animation:af-drift 30s ease-in-out infinite alternate}@keyframes af-drift{to{transform:translateX(24px)}}' +
      '.af-pl{animation:af-gl 4s ease-in-out infinite alternate}@keyframes af-gl{from{opacity:.65}to{opacity:1}}' +
      '.af-flow{stroke-dasharray:10 22;animation:af-flow 2.8s linear infinite}@keyframes af-flow{to{stroke-dashoffset:-64}}' +
      '.af-cg{transform-box:fill-box;transform-origin:center;animation:af-gl 4s ease-in-out infinite alternate}' +
      '.af-hz{animation:af-gl 6s ease-in-out infinite alternate}' +
      '.af-fnt{transform-box:fill-box;transform-origin:50% 100%;transform:scale(.8,.14);animation:af-fnt 1.3s ease-in-out infinite alternate}' +
      '@keyframes af-fnt{from{transform:scale(.8,.11)}to{transform:scale(1,.19)}}' +
      '.af-sp{opacity:0;animation:af-sp 2.2s ease-out infinite}' +
      '@keyframes af-sp{0%{opacity:0;transform:translate(0,0)}12%{opacity:.9}50%{transform:translate(var(--dx),-36px)}100%{opacity:0;transform:translate(calc(var(--dx) * 2),6px)}}' +
      '.af-tw{animation:af-tw 3s ease-in-out infinite alternate}.af-tw2{animation-duration:2.3s;animation-delay:-1.1s}@keyframes af-tw{from{opacity:.35}to{opacity:1}}' +
      '.af-win{animation:af-win 3.4s ease-in-out infinite alternate}@keyframes af-win{from{opacity:.7}to{opacity:1}}' +
      '.af-bcn{animation:af-bcn 2s ease-in-out infinite}@keyframes af-bcn{0%,100%{opacity:.2}50%{opacity:1}}' +
      '.af-anem{transform-box:fill-box;transform-origin:center;animation:af-anem 1s ease-in-out infinite}@keyframes af-anem{50%{transform:scaleX(-1)}}' +
      // The instruments.
      '.af-tr{stroke-dasharray:1;stroke-dashoffset:1;animation:af-tr 2.4s linear infinite}@keyframes af-tr{to{stroke-dashoffset:0}}' +
      '.af-dr{stroke-dasharray:6 3;animation:af-dr 1.4s linear infinite}@keyframes af-dr{to{stroke-dashoffset:-18}}' +
      '.af-pen{animation:af-pen .5s ease-in-out infinite alternate}@keyframes af-pen{from{transform:rotate(-2deg)}to{transform:rotate(3deg)}}' +
      '.af-pen2{animation-duration:.13s}.af-pen2{animation-name:af-pen2}@keyframes af-pen2{from{transform:rotate(-11deg)}to{transform:rotate(12deg)}}' +
      // Thinking and the quick states.
      '.st-thinking .af-pf{animation-duration:14s}.st-thinking .af-cg,.st-thinking .af-pl{animation-duration:7s}' +
      '.st-responding .af-anem{animation-duration:.4s}' +
      '.st-tool .af-sp{animation-duration:1.1s}.st-tool .af-cg{animation-duration:1.2s}.st-tool .af-pen{animation-duration:.22s}' +
      '.st-read .af-beam{animation:af-in .6s ease-out both}' +
      '.af-drone{opacity:0}.st-web .af-drone{animation:af-drone 6s ease-in-out infinite}' +
      '@keyframes af-drone{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}55%{transform:translate(-640px,-170px)}90%{opacity:1}100%{opacity:0;transform:translate(-940px,-110px)}}' +
      '.af-rot{transform-box:fill-box;transform-origin:center;animation:af-rot .12s linear infinite alternate}@keyframes af-rot{to{transform:scaleX(.3)}}' +
      '.st-web .af-bcn{animation-duration:1s}' +
      // Run: the ground shakes, a lava fountain climbs, bombs arc out, the ash column billows up, the plume swells.
      '.st-run .af-quake{animation:af-quake .18s linear infinite}@keyframes af-quake{0%,100%{transform:translate(0,0)}25%{transform:translate(-1.6px,.8px)}75%{transform:translate(1.6px,-.8px)}}' +
      '.st-run .af-fnt{animation:af-up .9s ease-out both,af-fl .45s ease-in-out .9s infinite alternate}' +
      '@keyframes af-up{from{transform:scale(.8,.14)}to{transform:scale(1,1)}}@keyframes af-fl{from{transform:scale(1,1)}to{transform:scale(.88,.86)}}' +
      '.st-run .af-cg{animation:af-cgup 1s ease-out both}@keyframes af-cgup{from{opacity:.75;transform:scale(1)}to{opacity:1;transform:scale(1.3)}}' +
      '.st-run .af-pl{animation:af-in 1.2s ease-out both}' +
      '.af-hz{transform-box:fill-box;transform-origin:center}.st-run .af-hz{animation:af-hzup 1.6s ease-out both}@keyframes af-hzup{from{opacity:.7}to{opacity:1;transform:scale(1.18)}}' +
      `.st-run .af-plume{transform-origin:${CX}px ${CY}px;animation:af-swell 2.6s ease-out both}@keyframes af-swell{to{transform:scale(1.1,1.14)}}` +
      '.af-col{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .af-col{animation:af-col 3.2s ease-out infinite}' +
      '@keyframes af-col{0%{opacity:0;transform:translate(0,0) scale(.4)}10%{opacity:.95}70%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-300px) scale(2.8)}}' +
      '.af-bx{opacity:0}.st-run .af-bx{animation:af-bx 2.6s linear var(--d) infinite}' +
      '@keyframes af-bx{0%{opacity:0;transform:translateX(0)}4%{opacity:1}88%{opacity:1;transform:translateX(var(--dx))}100%{opacity:0;transform:translateX(var(--dx))}}' +
      '.st-run .af-by{animation:af-by 2.6s linear var(--d) infinite}' +
      '@keyframes af-by{0%{transform:translateY(0);animation-timing-function:cubic-bezier(.3,.6,.5,1)}40%{transform:translateY(var(--h));animation-timing-function:cubic-bezier(.5,0,.8,.5)}88%,100%{transform:translateY(var(--g))}}' +
      '.af-imp{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .af-imp{animation:af-imp 2.6s ease-out var(--d) infinite}' +
      '@keyframes af-imp{0%{opacity:1;transform:scale(.3)}14%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1)}}' +
      '.st-run .af-sp{animation-duration:.9s}' +
      // A second after the column rises, its ash comes down thick around the station.
      '.af-alr{opacity:0}.st-run .af-alr{animation:af-in 1.6s ease-in 1.1s both}.st-error .af-alr{animation:af-in 1s ease-out both}' +
      // Error: the pyroclastic cloud rolls down the flank and across the valley toward the station; the sky darkens.
      '.af-pyro{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .af-pyro{animation:af-pyro 4.2s cubic-bezier(.25,.6,.35,1) both}' +
      // It leans along the steep flank at first and levels out as it reaches the valley floor.
      '@keyframes af-pyro{0%{opacity:0;transform:translate(0,0) rotate(34deg) scale(.45)}10%{opacity:.94}50%{transform:translate(420px,300px) rotate(17deg) scale(1)}100%{opacity:.94;transform:translate(690px,360px) rotate(5deg) scale(1.25)}}' +
      '.af-ch{transform-box:fill-box;transform-origin:center;animation:af-ch 1.7s ease-in-out infinite alternate}@keyframes af-ch{to{transform:translate(-4px,-7px) scale(1.12)}}' +
      '.af-ch:nth-child(2n){animation-delay:-.7s}.af-ch:nth-child(3n){animation-delay:-1.2s}.af-ch:nth-child(5n){animation-duration:1.3s}' +
      '.af-dim,.af-alx{opacity:0}.st-error .af-dim{animation:af-in 1.4s ease-out both}.st-error .af-alx{animation:af-in 1s ease-out both}' +
      '.st-error .af-bcn{animation-duration:.8s}' +
      '@keyframes af-in{to{opacity:1}}' +
      // Done: the lava cools to crust, the fountain sinks, the plume drifts off and the ash thins to show the stars.
      '.st-done .af-lv{animation:af-out 2.8s ease-in-out both}@keyframes af-out{to{opacity:0}}' +
      '.af-crust{opacity:0}.st-done .af-crust{animation:af-in 2.8s ease-in-out .2s both}' +
      '.st-done .af-cg{animation:af-thin 3s ease-out both}.st-done .af-pl,.st-done .af-hz{animation:af-thin 2.6s ease-out both}@keyframes af-thin{to{opacity:.2}}' +
      '.st-done .af-fnt{animation:af-sink 1.4s ease-in both}@keyframes af-sink{to{transform:scale(.6,.02);opacity:0}}' +
      '.st-done .af-sp{display:none}' +
      '.st-done .af-al{animation:af-ashoff 2.6s ease-out both}@keyframes af-ashoff{to{opacity:.2}}' +
      '.st-done .af-plume{animation:af-part 4s ease-out both}@keyframes af-part{to{opacity:.32;transform:translate(70px,-24px)}}' +
      '.af-stars,.af-clr{opacity:0}.st-done .af-stars{animation:af-in 2.2s ease-out .8s both}.st-done .af-clr{animation:af-in 3s ease-out both}' +
      '.st-done .af-anem{animation-duration:3s}' +
      '@keyframes af-fn{to{transform:translate(50px,860px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="af-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060303"/><stop offset=".45" stop-color="#0e0707"/><stop offset=".72" stop-color="#1a0c09"/><stop offset="1" stop-color="#120807"/></linearGradient>' +
      '<radialGradient id="af-hzg"><stop offset="0" stop-color="#ff4d2e" stop-opacity=".26"/><stop offset=".5" stop-color="#b8341c" stop-opacity=".1"/><stop offset="1" stop-color="#b8341c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-crg"><stop offset="0" stop-color="#ffd08a" stop-opacity=".85"/><stop offset=".25" stop-color="#ff6a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-plg"><stop offset="0" stop-color="#ff6a2a" stop-opacity=".42"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="af-vol" gradientUnits="userSpaceOnUse" x1="0" y1="350" x2="0" y2="840"><stop offset="0" stop-color="#26140f"/><stop offset=".4" stop-color="#170c0a"/><stop offset="1" stop-color="#0b0605"/></linearGradient>' +
      '<linearGradient id="af-fntg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff0c0"/><stop offset=".3" stop-color="#ffb24f"/><stop offset=".7" stop-color="#ff6a2a" stop-opacity=".8"/><stop offset="1" stop-color="#ff4d2e" stop-opacity="0"/></linearGradient>' +
      // The column's puffs, lit from below by the crater.
      '<radialGradient id="af-colg" cx=".5" cy=".6" r=".56" fx=".5" fy=".84"><stop offset="0" stop-color="#c8693c" stop-opacity=".95"/><stop offset=".3" stop-color="#7a4632" stop-opacity=".93"/><stop offset=".65" stop-color="#46322a" stop-opacity=".86"/><stop offset="1" stop-color="#2a1d19" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-bomb"><stop offset="0" stop-color="#ffb24f" stop-opacity=".7"/><stop offset="1" stop-color="#ff4d2e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-impg"><stop offset="0" stop-color="#ffd08a" stop-opacity=".9"/><stop offset=".4" stop-color="#ff6a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff3a1a" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="af-ash"><stop offset="0" stop-color="${ASH}" stop-opacity=".18"/><stop offset=".45" stop-color="${ASH}" stop-opacity=".08"/><stop offset="1" stop-color="${ASH}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="af-pyg" cx=".42" cy=".34"><stop offset="0" stop-color="#4c3c35"/><stop offset=".7" stop-color="#33271f"/><stop offset="1" stop-color="#2a1f1b" stop-opacity=".2"/></radialGradient>' +
      '<radialGradient id="af-pgl"><stop offset="0" stop-color="#ff5a2a" stop-opacity=".34"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-clg"><stop offset="0" stop-color="#1c1a3c" stop-opacity=".7"/><stop offset="1" stop-color="#1c1a3c" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#af-sky)"/>' +
      // The stars and the clearing sky behind the ash, seen only once it thins.
      '<ellipse class="af-clr" cx="900" cy="180" rx="900" ry="460" fill="url(#af-clg)"/>' +
      `<g class="af-stars" stroke="#e8dcff" stroke-linecap="round"><path class="af-tw" d="${dots(7, 34, [0, 0, 1600, 430])}" stroke-width="2.6"/>` +
      `<path class="af-tw af-tw2" d="${dots(8, 30, [0, 0, 1600, 430])}" stroke-width="2"/></g>` +
      '<ellipse class="af-hz" cx="270" cy="470" rx="620" ry="420" fill="url(#af-hzg)"/>' +
      // The plume.
      `<g class="af-plume">${lobes}${plume}` +
      `<g class="af-pl"><circle cx="${CX}" cy="300" r="110" fill="url(#af-plg)"/><circle cx="250" cy="236" r="96" fill="url(#af-plg)" opacity=".7"/><circle cx="292" cy="170" r="90" fill="url(#af-plg)" opacity=".4"/></g></g>` +
      plumeAsh +
      // The far ranges, ash lying pale on their crests.
      '<path d="M300 780L420 690L520 724L640 650L760 702L880 642L1000 690L1120 630L1240 680L1360 612L1480 662L1640 604V1000H300Z" fill="#0f0807"/>' +
      `<path d="M420 690L520 724L640 650L760 702L880 642L1000 690L1120 630L1240 680L1360 612L1480 662L1640 604" fill="none" stroke="${DUST}" stroke-opacity=".16" stroke-width="2"/>` +
      '<path d="M380 820L520 760L660 790L800 744L940 786L1080 740L1220 780L1360 734L1640 770V1000H380Z" fill="#0a0505"/>' +
      // The volcano: the cone, its gullies, the glowing crater, lava rivers, the fountain and spatter.
      '<g class="af-quake">' +
      `<path d="M-140 840C-40 740 90 560 168 430C190 394 204 372 214 360L232 352Q${CX} 344 292 352L310 360C322 374 338 398 362 440C430 560 560 730 760 840Z" fill="url(#af-vol)"/>` +
      `<path d="${ridges}" fill="none" stroke="#070303" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M214 360C204 372 190 394 168 430C120 510 70 590 20 660" fill="none" stroke="${ACCENT}" stroke-opacity=".2" stroke-width="3"/>` +
      `<path d="M310 360C322 374 338 398 362 440C400 506 450 580 520 660" fill="none" stroke="${ACCENT}" stroke-opacity=".12" stroke-width="3"/>` +
      `<path d="${slopes}" fill="none" stroke="${DUST}" stroke-opacity=".2" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle class="af-cg" cx="${CX}" cy="${CY - 8}" r="190" fill="url(#af-crg)"/>` +
      `<g class="af-lv" fill="none" stroke-linecap="round">` +
      `<path d="${RIVERS}" stroke="${ACCENT}" stroke-opacity=".22" stroke-width="16"/>` +
      `<path d="${RIVERS}" stroke="${LAVA}" stroke-opacity=".9" stroke-width="4.5"/>` +
      `<path class="af-flow" d="${RIVERS}" stroke="${HOT}" stroke-width="2.4"/>` +
      `<path d="${cracks}" stroke="${ACCENT}" stroke-opacity=".45" stroke-width="2"/></g>` +
      `<g class="af-crust" fill="none" stroke-linecap="round"><path d="${RIVERS}" stroke="#2c1c17" stroke-width="7"/>` +
      `<path d="${RIVERS}" stroke="${ACCENT}" stroke-opacity=".38" stroke-width="1.4" stroke-dasharray="2 16"/></g>` +
      `<path class="af-fnt" d="M${CX - 32} ${CY}C${CX - 26} ${CY - 90} ${CX - 10} ${CY - 170} ${CX} ${CY - 240}C${CX + 10} ${CY - 170} ${CX + 26} ${CY - 90} ${CX + 32} ${CY}Z" fill="url(#af-fntg)"/>` +
      `<ellipse cx="${CX}" cy="${CY}" rx="40" ry="8" fill="${HOT}"/><ellipse cx="${CX}" cy="${CY + 1}" rx="26" ry="4.6" fill="#fff0c0" fill-opacity=".8"/>` +
      `<path d="M${CX - 50} ${CY}Q${CX} ${CY + 12} ${CX + 50} ${CY}L${CX + 56} ${CY + 12}H${CX - 56}Z" fill="#26140f"/>` +
      `<path d="M${CX - 50} ${CY}Q${CX} ${CY + 12} ${CX + 50} ${CY}" fill="none" stroke="${HOT}" stroke-opacity=".55" stroke-width="2"/>` +
      spatter +
      '</g>' +
      // Run: the eruption column and the bombs.
      column +
      bombs +
      impacts +
      // The valley floor, charred trees on it.
      '<g class="mv-b"><path d="M-100 900C200 868 480 880 760 902C900 912 1000 932 1100 964V1100H-100Z" fill="#090505"/>' +
      `<path d="M-100 900C200 868 480 880 760 902C900 912 1000 932 1100 964" fill="none" stroke="${DUST}" stroke-opacity=".22" stroke-width="2.4"/>` +
      tree(46, 900, 1.3, -4) +
      tree(560, 884, 0.7, 6) +
      tree(690, 896, 0.55, -8) +
      tree(930, 922, 0.85, 4) +
      '</g>' +
      // The ash-laden air: a grey haze over the volcano and valley, and over the sky by the station.
      '<ellipse class="af-al" cx="30" cy="790" rx="450" ry="380" fill="url(#af-ash)"/>' +
      '<g class="mv-r"><ellipse class="af-al" cx="1580" cy="720" rx="430" ry="400" fill="url(#af-ash)"/></g>' +
      // Error: the pyroclastic cloud, and the dark it brings.
      '<rect class="af-dim" width="1600" height="1000" fill="#030101" fill-opacity=".3"/>' +
      `<g transform="translate(330 470)"><g class="af-pyro"><ellipse cx="10" cy="98" rx="290" ry="40" fill="url(#af-pgl)"/>${pyro}</g></g>` +
      // The survey drone, flown out toward the plume while Claude is on the web.
      '<g class="mv-r"><g transform="translate(1470 470) rotate(-6)"><g class="af-drone">' +
      '<circle r="10" fill="#ff4d2e" fill-opacity=".14"/><rect x="-10" y="-3" width="20" height="7" rx="2" fill="#0a0606"/>' +
      '<path d="M-17 -6H-5M5 -6H17" stroke="#0a0606" stroke-width="2.4"/>' +
      '<ellipse class="af-rot" cx="-11" cy="-8" rx="8" ry="1.6" fill="#6a605c"/><ellipse class="af-rot" cx="11" cy="-8" rx="8" ry="1.6" fill="#6a605c"/>' +
      `<circle class="af-bcn" cx="0" cy="5" r="2" fill="${ACCENT}"/></g></g></g>` +
      // The ash.
      layers.map(l => l.markup).join('') +
      `<g class="mv-r">${station.map(l => l.markup).join('')}</g>`,
    nook:
      '<defs><radialGradient id="af-hw"><stop offset="0" stop-color="#ffb860" stop-opacity=".4"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="af-bk"><stop offset="0" stop-color="#ff4d2e" stop-opacity=".55"/><stop offset="1" stop-color="#ff4d2e" stop-opacity="0"/></radialGradient></defs>' +
      // The ridge the station sits on, rising behind the desk, ash on its crest.
      '<path d="M-220 480C-100 426 30 338 150 282C220 250 300 232 440 224V720H-220Z" fill="#0c0706"/>' +
      `<path d="M-220 480C-100 426 30 338 150 282C220 250 300 232 440 224" fill="none" stroke="${DUST}" stroke-opacity=".32" stroke-width="3"/>` +
      tree(-92, 432, 1.1, 5) +
      // The hut: corrugated walls, ash on the roof, a lit window. Hut and mast sit 30 left so the mast's top stays in.
      '<g transform="translate(-30 0)"><circle class="af-win" cx="322" cy="190" r="44" fill="url(#af-hw)"/>' +
      '<rect x="298" y="162" width="92" height="66" fill="#140d0b" stroke="#2e2320" stroke-width="2"/>' +
      '<path d="M306 166V226M318 166V180M318 198V226M342 166V226M354 166V188M378 166V226" stroke="#211816" stroke-width="1"/>' +
      '<path d="M288 168L344 138L400 168Z" fill="#1c1310" stroke="#2e2320" stroke-width="2" stroke-linejoin="round"/>' +
      `<path d="M292 165L344 137L396 165" fill="none" stroke="${ASH}" stroke-opacity=".5" stroke-width="3.4"/>` +
      '<rect class="af-win" x="312" y="182" width="20" height="14" fill="#ffb860" fill-opacity=".72"/>' +
      '<path d="M322 182V196M312 189H332" stroke="#140d0b" stroke-width="2"/>' +
      '<rect x="354" y="190" width="18" height="38" fill="#0a0605"/>' +
      // The mast: a solar panel, a GPS dome, the cup anemometer, a beacon on top.
      '<path d="M403 228V-124M409 228V-124" stroke="#1d1614" stroke-width="3"/>' +
      `<path d="${Array.from({ length: 22 }, (_, i) => `M403 ${228 - i * 16}L409 ${220 - i * 16}`).join('')}" stroke="#2a201d" stroke-width="1.6"/>` +
      '<path d="M352 -2L404 -24V8L352 30Z" fill="#141a24" stroke="#3a4250" stroke-width="2"/>' +
      '<path d="M369 -9V23M386 -16V16M352 14L404 -8" stroke="#2c3442" stroke-width="1.2"/>' +
      `<path d="M352 -3L404 -25" stroke="${ASH}" stroke-opacity=".45" stroke-width="2.4"/>` +
      '<path d="M395 -70a11 11 0 0 1 22 0Z" fill="#b9b0aa"/>' +
      '<path d="M406 -124V-140" stroke="#1d1614" stroke-width="3"/>' +
      '<g class="af-anem"><path d="M382 -140H430" stroke="#2a201d" stroke-width="2.4"/><path d="M376 -146a7 7 0 0 0 12 0ZM424 -134a7 7 0 0 1 12 0Z" fill="#3a2e2a"/></g>' +
      '<circle class="af-bcn" cx="406" cy="-148" r="26" fill="url(#af-bk)"/><circle class="af-bcn" cx="406" cy="-148" r="4" fill="#ff4d2e"/></g>' +
      // The ground the desk stands on, ash drifted over it.
      '<path d="M-90 462Q20 444 120 452T320 448T520 452V520H-90Z" fill="#221a17"/>' +
      `<path d="M-90 462Q20 444 120 452T320 448T520 452" fill="none" stroke="${ASH}" stroke-opacity=".38" stroke-width="3"/>`,
    // Close flakes drifting past the desk.
    front:
      `<g stroke="${ASH}" stroke-opacity=".42" stroke-width="7" stroke-linecap="round"><g class="af-sw" style="animation-duration:4.6s">` +
      `<g style="animation:af-fn 10s linear infinite"><path d="${close}"/><g transform="translate(-50 -860)"><path d="${close}"/></g></g></g></g>`,
  }
}
