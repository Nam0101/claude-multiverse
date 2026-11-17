import type { Activity } from '../../types'
import { f, random, rain } from './kit'
import { U, X0, Y0, cell } from './rig'
import type { World } from './world'

// KAIJU & MECHA: a mecha pilot in a cockpit, a ruined city at night through the glass, an original kaiju walking
// slowly along the far skyline, the mecha's own arm in the corner. The kaiju always starts a state at the same spot
// (the backdrop is redrawn on every state change), so the punch and the searchlights can be aimed at a known place.

const MINT = '#3de8b0'
const PALE = '#a8ffe2'
const ALARM = '#ff8a3d'
const GROUND = 800
const KX = 230
// Where the punch lands and where the lights converge, in picture coordinates.
const HIT: readonly [number, number] = [268, 645]
const FOCUS: readonly [number, number] = [190, 600]

const px = (col: number) => f(X0 + col * U)
const py = (row: number) => f(Y0 + row * U)

type Pt = readonly [number, number]

/** The kaiju's back from the tail up to the head: the dorsal plates stand on it. */
const SPINE: readonly Pt[] = [
  [-250, -60],
  [-195, -98],
  [-150, -140],
  [-118, -190],
  [-80, -232],
  [-30, -258],
  [25, -262],
  [75, -250],
  [118, -228],
]
const PLATE_SIZE = [20, 26, 36, 46, 54, 58, 54, 46] as const

function plates(): [string, string] {
  const sets: [string[], string[]] = [[], []]

  SPINE.slice(0, -1).forEach((p, i) => {
    const q = SPINE[i + 1] ?? p
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    const size = PLATE_SIZE[i] ?? 30

    ;[0.27, 0.73].forEach((k, which) => {
      const mx = p[0] + dx * k
      const my = p[1] + dy * k
      const half = len * 0.17
      const lift = size * (which === 0 ? 0.78 : 1)
      const set = sets[which] ?? []

      set.push(
        `M${f(mx - ux * half)} ${f(my - uy * half)}L${f(mx + uy * lift - ux * 9)} ${f(my - ux * lift - uy * 9)}L${f(mx + ux * half)} ${f(my + uy * half)}Z`,
      )
    })
  })

  return [sets[0].join('') + 'M140 -222L156 -252L172 -224Z', sets[1].join('')]
}

function kaiju(): string {
  const [plateA, plateB] = plates()
  const body =
    `M-300 -34${SPINE.map(([x, y]) => `L${x} ${y}`).join('')}L150 -222L190 -224L224 -208L236 -190L228 -176L198 -172L176 -164L150 -150L128 -128L118 -98` +
    'L90 -72L40 -78L-60 -88L-130 -84L-190 -58L-250 -38Z'

  return (
    `<g transform="translate(${KX} ${GROUND})"><g class="kj-walk"><g class="kj-hit"><g class="kj-bob">` +
    `<ellipse cx="-20" cy="-230" rx="270" ry="120" fill="url(#kj-halo)"/>` +
    '<g transform="translate(-100 -110)"><g class="kj-leg kj-leg2"><path d="M35 -10Q20 40 30 100L22 110H100L98 100Q94 60 110 -10Z" fill="#06080b"/></g></g>' +
    `<path d="${body}" fill="#06080b" stroke="${MINT}" stroke-opacity=".22" stroke-width="1.6" stroke-linejoin="round"/>` +
    '<path d="M95 -150L150 -125L164 -117L150 -108L96 -116Z" fill="#06080b"/>' +
    '<g transform="translate(40 -110)"><g class="kj-leg"><path d="M-6 0Q8 50 10 100L0 110H80L78 100Q60 50 62 0Z" fill="#06080b"/></g></g>' +
    `<path class="kj-pl" d="${plateA}" fill="${MINT}"/><path class="kj-pl kj-pl2" d="${plateB}" fill="${MINT}"/>` +
    `<ellipse class="kj-eye" cx="200" cy="-207" rx="5" ry="3" fill="${PALE}"/>` +
    kaijuHud() +
    '</g></g></g></g>'
  )
}

function brackets(x: number, y: number, w: number, h: number, c: number): string {
  return (
    `M${x} ${y + c}V${y}H${x + c}M${x + w - c} ${y}H${x + w}V${y + c}M${x + w} ${y + h - c}V${y + h}H${x + w - c}M${x + c} ${y + h}H${x}V${y + h - c}`
  )
}

/** The HUD that follows the kaiju: a reticle for thinking, lock-on boxes for a tool. */
function kaijuHud(): string {
  const box = (x: number, y: number, w: number, h: number, c: number, delay: number) =>
    `<path class="kj-bx" style="animation-delay:${delay}s" d="${brackets(x, y, w, h, c)}" fill="none" stroke="${PALE}" stroke-width="3.5"/>`

  return (
    `<g class="kj-hud kj-an" transform="translate(30 -170)" fill="none" stroke="${MINT}" stroke-width="2.5">` +
    '<circle class="kj-rot" r="132" stroke-dasharray="14 10" stroke-opacity=".65"/>' +
    '<circle class="kj-rot kj-rev" r="98" stroke-dasharray="44 16 6 16" stroke-opacity=".55"/>' +
    '<path d="M-168 0H-92M92 0H168M0 -168V-92M0 92V168" stroke-opacity=".7"/>' +
    '<rect class="kj-scan" x="-150" y="-1" width="300" height="2.5" fill="#a8ffe2" stroke="none"/>' +
    `<g fill="${MINT}" stroke="none" fill-opacity=".7"><rect class="kj-dat" x="150" y="-100" width="46" height="5"/><rect class="kj-dat" style="animation-delay:-.5s" x="150" y="-84" width="30" height="5"/>` +
    '<rect class="kj-dat" style="animation-delay:-.9s" x="150" y="-68" width="40" height="5"/></g></g>' +
    '<g class="kj-hud kj-lk">' +
    box(-120, -276, 240, 196, 26, 0) +
    box(128, -262, 118, 96, 16, -0.4) +
    box(-318, -124, 130, 100, 14, -0.8) +
    '</g>'
  )
}

type Ruin = { shapes: string; wins: string }

function ruins(seed: number, base: number, min: number, max: number, fill: string, widths: [number, number], colors: readonly [string, string], density: number): Ruin {
  const next = random(seed)
  const shapes: string[] = []
  let a = ''
  let b = ''

  for (let x = -30; x < 1640; ) {
    const w = widths[0] + next() * (widths[1] - widths[0])
    const edge = Math.abs(x + w / 2 - 800) / 800
    const h = (min + next() * (max - min)) * (0.7 + 0.3 * Math.min(1, edge * 1.4))
    const top = base - h
    const steps = 2 + Math.floor(next() * 3)
    const ys: number[] = []

    for (let s = 0; s <= steps; s += 1) {
      ys.push(top + next() * h * 0.22 + (next() > 0.7 ? 18 : 0))
    }

    shapes.push(`<path d="M${f(x)} ${base}V${f(ys[0] ?? top)}${ys.map((y, s) => `L${f(x + (w * s) / steps)} ${f(y)}`).join('')}V${base}Z" fill="${fill}"/>`)

    const lowest = Math.max(...ys) + 10

    for (let wy = lowest; wy < base - 50; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 14) {
        if (next() < density) {
          if (next() > 0.35) {
            a += `M${f(wx)} ${f(wy)}h4v7h-4z`
          } else {
            b += `M${f(wx)} ${f(wy)}h4v7h-4z`
          }
        }
      }
    }

    x += w + next() * 8
  }

  return {
    shapes: shapes.join(''),
    wins: `<path d="${a}" fill="${colors[0]}" fill-opacity=".4"/><path class="kj-fl" d="${b}" fill="${colors[1]}" fill-opacity=".55"/>`,
  }
}

function beam(base: Pt, from: number, to: number, seconds: number, delay: number, aim: Pt): string {
  const toward = (Math.atan2(aim[0] - base[0], base[1] - aim[1]) * 180) / Math.PI

  return (
    `<g transform="translate(${base[0]} ${base[1]})"><g class="kj-bm" style="--a0:${from}deg;--a1:${to}deg;--t:${f(toward)}deg;--d:${seconds}s;animation-delay:${-delay}s">` +
    '<polygon points="0,0 -34,-1100 34,-1100" fill="url(#kj-beam)"/></g>' +
    '<ellipse cy="2" rx="16" ry="5" fill="#1a1f24"/></g>'
  )
}

function arm(): string {
  return (
    '<g class="mv-b"><g transform="translate(140 900)"><g class="kj-arm"><g transform="rotate(-64)">' +
    '<polygon points="-520,-100 -10,-78 -10,78 -520,100" fill="#161b20" stroke="#38434c" stroke-width="3"/>' +
    '<polygon points="-430,-92 -110,-72 -110,-18 -430,-30" fill="#262d34"/><polygon points="-430,92 -110,72 -110,18 -430,30" fill="#262d34"/>' +
    `<rect class="kj-lite" x="-410" y="-6" width="310" height="12" fill="${MINT}" fill-opacity=".55"/>` +
    '<rect x="-16" y="-88" width="24" height="176" rx="7" fill="#262d34" stroke="#38434c" stroke-width="3"/>' +
    '<rect x="8" y="-72" width="122" height="144" rx="18" fill="#161b20" stroke="#38434c" stroke-width="3"/>' +
    '<g fill="#262d34" stroke="#38434c" stroke-width="2"><rect x="58" y="-68" width="72" height="32" rx="9"/><rect x="58" y="-35" width="72" height="32" rx="9"/><rect x="58" y="-2" width="72" height="32" rx="9"/><rect x="58" y="31" width="72" height="36" rx="9"/></g>' +
    `<g fill="${MINT}" fill-opacity=".7"><circle cx="122" cy="-52" r="4"/><circle cx="122" cy="-19" r="4"/><circle cx="122" cy="14" r="4"/><circle cx="122" cy="48" r="4"/></g>` +
    '</g></g></g></g>'
  )
}

function impact(): string {
  const sparks = [0, 1, 2, 3, 4, 5]
    .map(k => {
      const a = (k / 6) * Math.PI * 2 + 0.4

      return `<line x1="${f(Math.cos(a) * 54)}" y1="${f(Math.sin(a) * 36)}" x2="${f(Math.cos(a) * 96)}" y2="${f(Math.sin(a) * 66)}"/>`
    })
    .join('')

  return (
    `<g transform="translate(${HIT[0]} ${HIT[1]})" fill="none">` +
    `<ellipse class="kj-ir" rx="90" ry="62" stroke="${PALE}" stroke-width="5"/>` +
    `<ellipse class="kj-ir kj-ir2" rx="90" ry="62" stroke="${MINT}" stroke-width="3"/>` +
    `<g class="kj-ir kj-ir3" stroke="${ALARM}" stroke-width="3" stroke-linecap="round">${sparks}</g></g>`
  )
}

function cracks(): string {
  const next = random(9)
  const origin: Pt = [200, -300]
  const lines: string[] = []

  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2 + next() * 0.4
    let x = origin[0]
    let y = origin[1]
    let d = `M${x} ${y}`

    for (let step = 0; step < 3; step += 1) {
      const run = 40 + next() * 60
      const bend = (next() - 0.5) * 0.9

      x += Math.cos(angle + bend) * run
      y += Math.sin(angle + bend) * run
      d += `L${f(x)} ${f(y)}`
    }

    lines.push(`<path class="kj-crk" pathLength="1" d="${d}" style="animation-delay:${f(next() * 0.35)}s"/>`)
  }

  const ring = `<ellipse class="kj-crk" pathLength="1" cx="${origin[0]}" cy="${origin[1]}" rx="64" ry="48" style="animation-delay:.3s"/>`

  return `<g fill="none" stroke="#e8fff6" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${lines.join('')}${ring}</g>`
}

function hud(light: string, activity: Activity): string {
  const rim = `<rect x="330" y="208" width="88" height="92" rx="7" fill="${light}" fill-opacity=".12" stroke="${light}" stroke-opacity=".8" stroke-width="2.5"/>`
  const at = (inner: string) => `<g transform="translate(374 254)" fill="none" stroke="${light}" stroke-width="2.5">${inner}</g>`
  let body: string

  switch (activity) {
    case 'thinking':
      body = at('<circle class="kj-rot" r="30" stroke-dasharray="8 6"/><circle class="kj-rot kj-rev" r="18" stroke-dasharray="14 5"/><circle r="3" fill="' + light + '"/>')
      break
    case 'tool':
      body = at(`<path class="kj-bx" d="${brackets(-28, -24, 56, 48, 12)}" stroke-width="3"/><path d="M-36 0h14M22 0h14M0 -32v10M0 22v10" stroke-opacity=".7"/>`)
      break
    case 'read':
      body = at(
        `<g class="kj-hl">${[-30, -18, -6, 6, 18, 30, 42]
          .map((y, i) => `<line x1="-34" y1="${y}" x2="${34 - (i % 3) * 12}" y2="${y}" stroke-width="3"/>`)
          .join('')}</g>`,
      )
      break
    case 'run':
      body = at(
        `<g fill="${light}" stroke="none">${[-30, -14, 2, 18]
          .map((x, i) => `<rect class="kj-pb" style="animation-delay:${f(-i * 0.18)}s" x="${x}" y="-32" width="10" height="64"/>`)
          .join('')}</g>`,
      )
      break
    case 'web':
      body = at(`<circle r="32" stroke-opacity=".6"/><circle r="16" stroke-opacity=".6"/><path class="kj-rot" d="M0 0L32 0A32 32 0 0 0 22 -23Z" fill="${light}" fill-opacity=".5" stroke="none" style="animation-duration:2.4s"/>`)
      break
    case 'error':
      body = at(`<path d="M0 -32L32 24H-32Z" stroke-width="4"/><path d="M0 -10V8M0 14v2" stroke-width="5" stroke-linecap="round"/>`)
      break
    case 'done':
      body = at('<circle r="30" stroke-opacity=".6"/><path d="M-16 2l11 11l22 -26" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
      break
    default:
      body = at(`<circle r="30" stroke-opacity=".45"/><circle r="15" stroke-opacity=".45"/><path class="kj-rot" d="M0 0V-30" stroke-opacity=".8" style="animation-duration:7s"/>`)
  }

  return rim + body
}

export function kaijuWorld(): World {
  const next = random(54)
  const far = ruins(1, 800, 120, 300, '#0f161b', [44, 90], ['#3de8b0', '#ff8a3d'], 0.05)
  const near = ruins(2, 890, 90, 250, '#070a0d', [60, 120], ['#3de8b0', '#ff8a3d'], 0.04)
  const stars: string[] = []

  for (let index = 0; index < 26; index += 1) {
    stars.push(`<circle cx="${f(next() * 1600)}" cy="${f(next() * 420)}" r="${f(0.6 + next() * 1)}" fill="#d8f5ec" fill-opacity="${f(0.2 + next() * 0.4)}"/>`)
  }

  const fires = [
    [64, 884],
    [548, 872],
    [980, 868],
    [1384, 872],
    [1510, 850],
    [820, 888],
  ]
    .map(
      ([x, y], index) =>
        `<g transform="translate(${x} ${y})"><circle r="52" fill="url(#kj-fire)"/><path class="kj-fr" style="animation-delay:${f(-index * 0.7)}s" d="M-6 0Q-8 -12 0 -22Q8 -12 6 0Z" fill="${ALARM}" fill-opacity=".8"/></g>`,
    )
    .join('')

  const lights: Pt[] = [
    [60, 872],
    [480, 876],
    [900, 872],
  ]
  const sweeps: [number, number, number, number][] = [
    [-34, 22, 9, 0],
    [-28, 34, 12, 4],
    [-20, 38, 10.5, 7],
  ]
  const beams = lights.map((base, index) => beam(base, sweeps[index]?.[0] ?? 0, sweeps[index]?.[1] ?? 0, sweeps[index]?.[2] ?? 9, sweeps[index]?.[3] ?? 0, FOCUS)).join('')

  const tilePanel = (x: number, y: number, scale: number) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><rect width="340" height="230" fill="${MINT}" fill-opacity=".05" stroke="${MINT}" stroke-opacity=".35" stroke-width="2"/>` +
    '<g clip-path="url(#kj-pc)"><g class="kj-sc"><use href="#kj-tile"/><use href="#kj-tile" y="240"/></g></g></g>'

  const blips = [
    [38, -20],
    [-62, 30],
    [70, 52],
    [-20, -74],
  ]
    .map(([x, y], index) => `<circle class="kj-bl" style="animation-delay:${f(-index * 0.7)}s" cx="${x}" cy="${y}" r="4.5" fill="${PALE}"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'chair',
      table: 'console',
      machine: 'panel',
      cup: 'none',
      thought: 'bits',
      ink: '#040607',
      furniture: '#1a1f24',
      metal: '#262d34',
      paper: '#d8f5ec',
      light: { idle: '#2f9c7c', work: MINT, bright: PALE },
      headTop: Y0 - 30,
      glowAt: [374, 254],
      wear: {
        front:
          // The helmet: a dome and brim above the eyes, ear cups, and the crown of small mint lights.
          `<path d="M${px(1.6)} ${py(1)}V${py(-0.1)}Q${px(1.6)} ${py(-1.3)} ${px(4)} ${py(-1.3)}H${px(10)}Q${px(12.4)} ${py(-1.3)} ${px(12.4)} ${py(-0.1)}V${py(1)}Z" fill="#262d34"/>` +
          `<rect x="${px(1.6)}" y="${py(0.7)}" width="${f(10.8 * U)}" height="${f(0.3 * U)}" fill="#3a444d"/>` +
          `<g fill="#1a1f24"><rect x="${px(1.05)}" y="${py(1.1)}" width="${f(1.1 * U)}" height="${f(2.8 * U)}" rx="5"/><rect x="${px(11.85)}" y="${py(1.1)}" width="${f(1.1 * U)}" height="${f(2.8 * U)}" rx="5"/></g>` +
          `<g fill="${MINT}" fill-opacity=".8"><rect x="${px(1.35)}" y="${py(2.2)}" width="5" height="8"/><rect x="${px(12.15)}" y="${py(2.2)}" width="5" height="8"/></g>` +
          `<g stroke="#3a444d" stroke-width="2.5">${[3.8, 5.6, 7.4, 9.2].map(c => `<line x1="${px(c)}" y1="${py(-1.3)}" x2="${px(c)}" y2="${py(c % 2 > 1 ? -1.9 : -1.7)}"/>`).join('')}</g>` +
          `<g fill="${MINT}">${[3.8, 5.6, 7.4, 9.2].map((c, i) => `<rect class="kj-nc" style="animation-delay:${f(-i * 0.5)}s" x="${f(X0 + c * U - 2.5)}" y="${py(c % 2 > 1 ? -2.15 : -1.95)}" width="5" height="5"/>`).join('')}</g>` +
          `<g fill="${MINT}">${[3, 5, 7, 9, 11].map((c, i) => `<rect class="kj-nc" style="animation-delay:${f(-i * 0.3)}s" x="${f(X0 + c * U)}" y="${py(-0.45)}" width="5" height="5"/>`).join('')}</g>` +
          // The harness: shoulder belts and a waist strap with a mint buckle.
          `<g fill="#1a1f24">${cell(2, 1, 0.8, 4.6)}${cell(11.2, 1, 0.8, 4.6)}${cell(2, 5.1, 10, 0.7)}</g>` +
          `<g fill="${MINT}" fill-opacity=".85">${cell(6.6, 5.15, 0.9, 0.6)}</g>`,
      },
      seatArt:
        '<g fill="#1a1f24"><rect x="84" y="196" width="32" height="154" rx="12"/><rect x="104" y="349" width="96" height="12" rx="6"/><rect x="146" y="361" width="10" height="84"/>' +
        '<rect x="112" y="440" width="80" height="8" rx="3"/></g>' +
        `<path d="M92 206h16M92 216h16" stroke="${MINT}" stroke-opacity=".5" stroke-width="2"/>`,
      tableArt:
        '<path d="M150 330H470V456H212L190 396Z" fill="#1a1f24"/>' +
        `<path d="M150 330H470" stroke="${MINT}" stroke-opacity=".55" stroke-width="2.5"/>` +
        `<g fill="${MINT}" fill-opacity=".6">${[238, 252, 266, 280, 294, 308].map(x => `<rect x="${x}" y="350" width="8" height="5"/>`).join('')}</g>` +
        `<g fill="${ALARM}" fill-opacity=".6">${[238, 252, 266].map(x => `<rect x="${x}" y="362" width="8" height="5"/>`).join('')}</g>` +
        '<path d="M330 350H452M330 366H430M330 382H410" stroke="#262d34" stroke-width="5" stroke-linecap="round"/>',
      device: (light, activity) => {
        const working = activity !== 'idle' && activity !== 'done'

        return (
          '<path d="M232 330L244 302H404L416 330Z" fill="#262d34"/>' +
          `<g fill="${light}" fill-opacity=".7">${[262, 280, 298, 316, 334, 352].map(x => `<rect x="${x}" y="312" width="8" height="4"/>`).join('')}</g>` +
          `<g transform="translate(270 304)"><g class="${working ? 'kj-joy' : ''}"><line x1="0" y1="0" x2="-6" y2="-44" stroke="#3a444d" stroke-width="8" stroke-linecap="round"/>` +
          `<ellipse cx="-7" cy="-50" rx="10" ry="12" fill="#1a1f24" stroke="${light}" stroke-width="2"/><circle cx="-7" cy="-54" r="3" fill="${light}"/></g>` +
          '<circle r="10" fill="#1a1f24"/></g>' +
          `<g transform="translate(312 304)"><g class="${working ? 'kj-joy kj-joy2' : ''}"><line x1="0" y1="0" x2="6" y2="-40" stroke="#3a444d" stroke-width="8" stroke-linecap="round"/>` +
          `<ellipse cx="7" cy="-46" rx="10" ry="12" fill="#1a1f24" stroke="${light}" stroke-width="2"/><circle cx="7" cy="-50" r="3" fill="${light}"/></g>` +
          '<circle r="10" fill="#1a1f24"/></g>' +
          `<g class="kj-hudfloat">${hud(light, activity)}</g>`
        )
      },
    },
    style:
      '.kj-walk{animation:kj-walk 60s linear infinite}.st-run .kj-walk,.st-done .kj-walk{animation:none}' +
      '@keyframes kj-walk{0%{transform:translateX(0);opacity:0}2%{opacity:1}84%{opacity:1}100%{transform:translateX(2100px);opacity:0}}' +
      '.kj-bob{animation:kj-bob 2.6s ease-in-out infinite alternate}@keyframes kj-bob{to{transform:translateY(-5px)}}' +
      '.kj-leg{animation:kj-leg 3s ease-in-out infinite alternate}.kj-leg2{animation-delay:-3s}@keyframes kj-leg{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.kj-pl{animation:kj-pl 3.6s ease-in-out infinite alternate}.kj-pl2{animation-delay:-1.8s}@keyframes kj-pl{from{opacity:.55}to{opacity:1}}' +
      '.kj-eye{animation:kj-pl 2s ease-in-out infinite alternate}' +
      '.kj-bm{animation:kj-sw var(--d) ease-in-out infinite alternate;opacity:.65}' +
      '@keyframes kj-sw{from{transform:rotate(var(--a0))}to{transform:rotate(var(--a1))}}' +
      '.st-done .kj-bm{animation:kj-cv 2.4s ease-in-out both}@keyframes kj-cv{from{opacity:.65}to{opacity:1;transform:rotate(var(--t))}}' +
      '.kj-spot{opacity:0}.st-done .kj-spot{animation:kj-spot 3s ease-out both}@keyframes kj-spot{0%{opacity:0}40%{opacity:.3}100%{opacity:.22}}' +
      '.st-done .kj-hit{animation:kj-stag 3.2s cubic-bezier(.2,.7,.3,1) both}' +
      '@keyframes kj-stag{0%{transform:none}35%{transform:translate(-62px,0) rotate(-5deg)}100%{transform:translate(-44px,0) rotate(-3deg)}}' +
      '.st-run .kj-hit{animation:kj-rec 5s ease-in-out infinite}' +
      '@keyframes kj-rec{0%,27%,100%{transform:none}33%{transform:translate(-22px,0) rotate(-1.6deg)}60%{transform:none}}' +
      '.kj-arm{animation:kj-armi 5s ease-in-out infinite alternate}@keyframes kj-armi{to{transform:translateY(-7px)}}' +
      '.st-run .kj-arm{animation:kj-punch 5s ease-in-out infinite}' +
      '@keyframes kj-punch{0%,100%{transform:none}16%{transform:translate(-16px,60px) scale(.95)}28%{transform:translate(56px,-103px) scale(1.3)}40%{transform:translate(50px,-94px) scale(1.27)}62%{transform:none}}' +
      '.kj-lite{animation:kj-pl 2.6s ease-in-out infinite alternate}' +
      '.kj-ir{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .kj-ir{animation:kj-ring 5s ease-out infinite}.st-run .kj-ir2{animation-delay:.12s}.st-run .kj-ir3{animation-delay:.04s}' +
      '@keyframes kj-ring{0%,27%{opacity:0;transform:scale(.2)}29%{opacity:.8}58%{opacity:0;transform:scale(2.4)}100%{opacity:0;transform:scale(2.4)}}' +
      '.kj-hud{opacity:0}.st-thinking .kj-an,.st-tool .kj-lk{opacity:1}' +
      '.kj-rot{animation:mv-spin 16s linear infinite;transform-box:fill-box;transform-origin:center}.kj-rev{animation-name:mv-spin-back;animation-duration:11s}' +
      '.kj-scan{animation:kj-scan 3s ease-in-out infinite alternate}@keyframes kj-scan{from{transform:translateY(-150px)}to{transform:translateY(150px)}}' +
      '.kj-dat{transform-box:fill-box;transform-origin:left;animation:kj-dat 1.4s ease-in-out infinite alternate}@keyframes kj-dat{from{transform:scaleX(.3)}to{transform:scaleX(1)}}' +
      '.kj-bx{transform-box:fill-box;transform-origin:center;animation:kj-bx 1.7s ease-out infinite}' +
      '@keyframes kj-bx{0%{opacity:.2;transform:scale(1.4)}35%,80%{opacity:.95;transform:scale(1)}100%{opacity:.4;transform:scale(1)}}' +
      '.kj-hl{animation:kj-hl 1.6s linear infinite}@keyframes kj-hl{to{transform:translateY(-12px)}}' +
      '.kj-pb{transform-box:fill-box;transform-origin:50% 100%;animation:kj-pb .9s ease-in-out infinite alternate}@keyframes kj-pb{from{transform:scaleY(.25)}to{transform:scaleY(1)}}' +
      '.kj-joy{animation:kj-joy .7s ease-in-out infinite alternate}.kj-joy2{animation-delay:-.35s}@keyframes kj-joy{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.kj-hudfloat{animation:kj-hf 5s ease-in-out infinite alternate}@keyframes kj-hf{to{transform:translateY(-3px)}}' +
      '.kj-nc{animation:kj-nc 1.8s ease-in-out infinite alternate}@keyframes kj-nc{from{opacity:.35}to{opacity:1}}' +
      '.kj-fl{animation:kj-fl 4s ease-in-out infinite alternate}@keyframes kj-fl{from{opacity:.3}to{opacity:1}}' +
      '.kj-fr{transform-box:fill-box;transform-origin:50% 100%;animation:kj-fr 2.3s ease-in-out infinite alternate}@keyframes kj-fr{from{transform:scale(1,.8)}to{transform:scale(1.15,1.2)}}' +
      '.kj-cloud{animation:kj-cl 90s ease-in-out infinite alternate}@keyframes kj-cl{to{transform:translateX(120px)}}' +
      '.kj-sch{opacity:0}.st-read .kj-sch{opacity:1}' +
      '.kj-sc{animation:kj-sc 7s linear infinite}@keyframes kj-sc{to{transform:translateY(-240px)}}' +
      '.kj-rd{opacity:0}.st-web .kj-rd{opacity:1}.kj-sweep{animation:mv-spin 3.2s linear infinite}' +
      '.kj-bl{opacity:0}.st-web .kj-bl{animation:kj-bl 3.2s ease-out infinite}@keyframes kj-bl{0%{opacity:.9}60%,100%{opacity:0}}' +
      '.kj-al{opacity:0}.st-error .kj-al{animation:kj-al 2.4s ease-in-out infinite}@keyframes kj-al{0%,100%{opacity:.08}50%{opacity:.42}}' +
      '.kj-lamp{opacity:.25}.st-error .kj-lamp{animation:kj-lamp 2.4s ease-in-out infinite}@keyframes kj-lamp{0%,100%{opacity:.4}50%{opacity:1}}' +
      '.kj-crk{opacity:0;stroke-dasharray:1}.st-error .kj-crk{opacity:1;animation:kj-crk .8s ease-out both}@keyframes kj-crk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
    scenery:
      '<defs><linearGradient id="kj-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0e12"/><stop offset=".55" stop-color="#101a1e"/><stop offset=".82" stop-color="#1a3534"/><stop offset="1" stop-color="#0c1416"/></linearGradient>' +
      '<radialGradient id="kj-halo"><stop offset="0" stop-color="#3de8b0" stop-opacity=".22"/><stop offset="1" stop-color="#3de8b0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="kj-fire"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".4"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="kj-cloud"><stop offset="0" stop-color="#2a4a48" stop-opacity=".35"/><stop offset="1" stop-color="#2a4a48" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="kj-alarm"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="kj-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d8f5ec" stop-opacity=".3"/><stop offset="1" stop-color="#d8f5ec" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="kj-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3de8b0" stop-opacity="0"/><stop offset="1" stop-color="#3de8b0" stop-opacity=".6"/></linearGradient>' +
      '<clipPath id="kj-pc"><rect width="340" height="230"/></clipPath>' +
      `<g id="kj-tile" fill="none" stroke="${MINT}" stroke-width="1.6" stroke-opacity=".6"><circle cx="70" cy="60" r="38"/><circle cx="70" cy="60" r="20"/><path d="M70 12v96M22 60h96" stroke-dasharray="6 5"/>` +
      '<rect x="150" y="24" width="150" height="70"/><path d="M150 110h150M150 104v12M300 104v12M175 24v70M225 24v70"/><path d="M20 150L90 140L130 190L60 214Z"/><path d="M160 150h130v54h-130zM160 177h130M130 190L160 177"/>' +
      `<g fill="${MINT}" stroke="none"><rect x="20" y="224" width="90" height="5"/><rect x="130" y="224" width="40" height="5"/><rect x="190" y="224" width="110" height="5"/></g></g></defs>` +
      '<rect width="1600" height="1000" fill="url(#kj-sky)"/>' +
      stars.join('') +
      '<g class="kj-cloud"><ellipse cx="300" cy="640" rx="360" ry="90" fill="url(#kj-cloud)"/><ellipse cx="1100" cy="700" rx="420" ry="80" fill="url(#kj-cloud)"/><ellipse cx="760" cy="520" rx="300" ry="60" fill="url(#kj-cloud)"/></g>' +
      beams +
      far.shapes +
      far.wins +
      kaiju() +
      '<defs><radialGradient id="kj-spg"><stop offset="0" stop-color="#e8fff6" stop-opacity=".85"/><stop offset=".55" stop-color="#e8fff6" stop-opacity=".3"/><stop offset="1" stop-color="#e8fff6" stop-opacity="0"/></radialGradient></defs><ellipse cx="210" cy="620" rx="170" ry="190" fill="url(#kj-spg)" class="kj-spot"/>' +
      near.shapes +
      near.wins +
      fires +
      '<rect y="880" width="1600" height="140" fill="#05070a"/>' +
      rain({ seed: 1954, count: 24, length: [6, 14], slant: 60, seconds: 3.4, stroke: '#9fb8b0', opacity: 0.2 }) +
      arm() +
      impact() +
      // The schematics scroll on the left and the right of the glass while Claude reads.
      `<g class="kj-sch">${tilePanel(34, 70, 1)}<g class="mv-r">${tilePanel(1268, 84, 0.82)}</g></g>` +
      // A radar sweep, top right, while Claude searches the web.
      `<g class="mv-r"><g class="mv-t"><g class="kj-rd" transform="translate(1450 160)" fill="none" stroke="${MINT}" stroke-opacity=".4" stroke-width="2">` +
      '<circle r="44"/><circle r="88"/><circle r="132"/><path d="M-140 0H140M0 -140V140" stroke-opacity=".25"/>' +
      '<g class="kj-sweep"><path d="M0 0L132 0A132 132 0 0 0 91 -95Z" fill="url(#kj-sw)" stroke="none"/><line x1="0" y1="0" x2="132" y2="0" stroke="#a8ffe2" stroke-opacity=".7"/></g>' +
      `${blips}</g></g></g>`,
    nook:
      // The cockpit: an A-pillar, a header, a rib across the glass and the glass itself, with its reflections.
      `<path d="M-110 -540H-62L34 330H-8Z" fill="#161b20"/><path d="M-96 -540L4 330" stroke="${MINT}" stroke-opacity=".3" stroke-width="2"/>` +
      `<path d="M-110 -540H430V-500Q150 -480 -110 -440Z" fill="#161b20"/><path d="M-100 -450Q150 -490 430 -510" fill="none" stroke="${MINT}" stroke-opacity=".35" stroke-width="2"/>` +
      '<path d="M-8 -150Q200 -240 440 -230" fill="none" stroke="#1a1f24" stroke-width="12"/>' +
      `<path d="M30 -430L430 -480V300H40Z" fill="${MINT}" fill-opacity=".035"/>` +
      '<path d="M150 -470l70 -8l-140 760h-70z" fill="#e8fff6" fill-opacity=".035"/><path d="M270 -480l36 -4l-110 700h-36z" fill="#e8fff6" fill-opacity=".03"/>' +
      '<rect x="-120" y="440" width="560" height="40" fill="#11161a"/>' +
      `<line x1="-120" y1="441" x2="440" y2="441" stroke="${MINT}" stroke-opacity=".3" stroke-width="2"/>` +
      // Alarm lamps: dim housings, glowing orange only in an error.
      `<g transform="translate(6 -40)"><circle class="kj-al" r="190" fill="url(#kj-alarm)"/><circle r="10" fill="#3a2410"/><circle class="kj-lamp" r="8" fill="${ALARM}"/></g>` +
      `<g transform="translate(360 -470)"><circle class="kj-al" r="190" fill="url(#kj-alarm)"/><circle r="10" fill="#3a2410"/><circle class="kj-lamp" r="8" fill="${ALARM}"/></g>` +
      `<g fill="${MINT}" fill-opacity=".6">${[-380, -340, -300].map(y => `<rect class="kj-nc" style="animation-delay:${f(y / -170)}s" x="-34" y="${y}" width="6" height="6"/>`).join('')}</g>`,
    front: cracks(),
  }
}
