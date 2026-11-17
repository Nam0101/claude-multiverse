import { f, gear, random } from './kit'
import { cell, X0, Y0 } from './rig'
import type { World } from './world'

// Collapsing Universe: reality is coming apart around Claude. Stars and shards fall into a collapse point (upper left) over
// a warped grid, giant cracks split the picture, and inside the cracks other universes show through.
const ACC = '#9b6bff'
const CY = '#3cf2ff'
const MG = '#ff4fd8'
const WHITE = '#e6dcff'
const C = { x: 330, y: 250 }

type Pt = readonly [number, number]

/** A jagged tear around a spine: its polygon, and the spine's own path. */
function tear(spine: Pt[], half: number[], seed: number): { poly: string; spine: string } {
  const next = random(seed)
  const left: Pt[] = []
  const right: Pt[] = []

  const side = (at: Pt, normal: Pt, width: number, sign: number, jag: number): Pt => [at[0] + normal[0] * sign * (width + jag), at[1] + normal[1] * sign * (width + jag)]

  spine.forEach((p, i) => {
    const a = spine[Math.max(0, i - 1)] ?? p
    const b = spine[Math.min(spine.length - 1, i + 1)] ?? p
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const normal: Pt = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len]
    const w = half[i] ?? 10

    left.push(side(p, normal, w, 1, (next() - 0.5) * w * 0.5))
    right.push(side(p, normal, w, -1, (next() - 0.5) * w * 0.5))

    const q = spine[i + 1]

    if (q !== undefined) {
      const mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
      const wm = ((half[i] ?? 10) + (half[i + 1] ?? 10)) / 2

      left.push(side(mid, normal, wm * 0.55, 1, (next() - 0.3) * wm * 0.6))
      right.push(side(mid, normal, wm * 0.55, -1, (next() - 0.3) * wm * 0.6))
    }
  })

  const all = [...left, ...right.reverse()]

  return {
    poly: all.map(([x, y]) => `${f(x)},${f(y)}`).join(' '),
    spine: spine.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(''),
  }
}

const NEON =
  '<g class="sd-vig" transform="translate(172 514) rotate(-8)"><rect x="-44" y="-24" width="88" height="48" rx="7" fill="#14081a" stroke="#ff4fd8" stroke-width="3"/>' +
  '<rect x="-44" y="-24" width="88" height="48" rx="7" fill="none" stroke="#ff4fd8" stroke-opacity=".3" stroke-width="9"/>' +
  `<path d="M-28 0H8M-2 -12L14 0L-2 12" fill="none" stroke="${CY}" stroke-width="3.5" stroke-linecap="round"/><circle cx="28" cy="-12" r="3" fill="${CY}"/><circle cx="28" cy="12" r="3" fill="${MG}"/></g>`

const HAND =
  '<g class="sd-vig" transform="translate(118 712)"><path d="M-8 52V10H8V52Z" fill="#53693a"/><circle cx="0" cy="4" r="12" fill="#6b8a4a"/>' +
  '<path d="M-10 -2L-16 -28M-4 -4L-5 -34M3 -4L6 -32M9 -1L17 -24M-12 6L-24 -8" stroke="#6b8a4a" stroke-width="5" stroke-linecap="round" fill="none"/></g>'

const PLANET =
  '<g class="sd-vig" transform="translate(620 112)"><circle r="23" fill="url(#sd-pl)"/>' +
  '<ellipse rx="40" ry="9" transform="rotate(-18)" fill="none" stroke="#ffd0a0" stroke-opacity=".8" stroke-width="3"/></g>'

const GEAR = `<g transform="translate(790 64)"><g class="sd-vig"><g class="sd-gear"><path d="${gear(21, 10)}" fill="#c9a14a" fill-rule="evenodd" stroke="#6a4a18" stroke-width="1.5"/></g></g></g>`

const WING =
  '<g class="sd-vig" transform="translate(1410 292) scale(1.35)"><path d="M0 30L-6 -24L-50 -44Q-44 -22 -62 -8Q-52 6 -44 22Q-34 24 -18 40Q-8 38 0 30Z" fill="#7a1f2a" stroke="#ff9a4d" stroke-opacity=".7" stroke-width="2"/>' +
  '<path d="M-6 -24L-62 -8M-6 -24L-44 22M-6 -24L-18 40" stroke="#ff9a4d" stroke-opacity=".8" stroke-width="2" fill="none"/></g>'

export function collapseWorld(): World {
  const next = random(404)

  const tears = [
    { id: 1, spine: [[318, 258], [262, 372], [182, 512], [140, 640], [88, 780], [48, 900]] as Pt[], half: [5, 26, 50, 58, 38, 8], fill: 'sd-t1', vig: NEON + HAND },
    { id: 2, spine: [[336, 236], [470, 176], [620, 112], [790, 64], [960, 24]] as Pt[], half: [5, 18, 34, 30, 6], fill: 'sd-t2', vig: PLANET + GEAR },
    { id: 3, spine: [[1560, 50], [1490, 170], [1410, 290], [1340, 410], [1300, 520]] as Pt[], half: [6, 28, 52, 42, 8], fill: 'sd-t3', vig: WING },
  ].map(t => ({ ...t, ...tear(t.spine, t.half, 40 + t.id) }))

  const tearMarkup = tears
    .map(
      t =>
        `<clipPath id="sd-c${t.id}"><polygon points="${t.poly}"/></clipPath>` +
        `<g class="sd-tf"><polygon points="${t.poly}" fill="url(#${t.fill})"/><g clip-path="url(#sd-c${t.id})">${t.vig}` +
        `<polygon points="${t.poly}" fill="none" stroke="${ACC}" stroke-opacity=".45" stroke-width="16"/></g></g>` +
        `<polygon class="sd-glow" points="${t.poly}" fill="none" stroke="${ACC}" stroke-opacity=".3" stroke-width="12" stroke-linejoin="round"/>` +
        `<polygon class="sd-edge" pathLength="1" points="${t.poly}" fill="none" stroke="${WHITE}" stroke-width="2" stroke-linejoin="round"/>` +
        `<polygon class="sd-err" points="${t.poly}" fill="none" stroke="#ff3a7a" stroke-width="5" stroke-linejoin="round"/>` +
        `<polygon class="sd-white" points="${t.poly}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>`,
    )
    .join('')

  // Hairline cracks from the collapse point.
  const hair: string[] = []

  for (let index = 0; index < 8; index += 1) {
    const angle = (index * 45 + 20 + next() * 20) * (Math.PI / 180)
    const length = 280 + next() * 560
    let x = C.x
    let y = C.y
    let d = `M${C.x} ${C.y}`

    for (let step = 1; step <= 6; step += 1) {
      const a = angle + (next() - 0.5) * 0.6
      x += Math.cos(a) * (length / 6)
      y += Math.sin(a) * (length / 6)
      d += `L${f(x)} ${f(y)}`
    }

    hair.push(d)
  }

  const hairPath = hair.join('')

  // The warped grid: rings with geometric radii, and rays.
  const rings = Array.from({ length: 9 }, (_, k) => {
    const r = 60 * Math.pow(1.4, k)

    return `<ellipse cx="${C.x}" cy="${C.y}" rx="${f(r)}" ry="${f(r * 0.66)}" stroke-opacity="${f(Math.max(0.05, 0.2 - k * 0.018))}"/>`
  }).join('')
  const rays = Array.from({ length: 20 }, (_, k) => {
    const a = (k / 20) * Math.PI * 2

    return `M${f(C.x + Math.cos(a) * 50)} ${f(C.y + Math.sin(a) * 33)}L${f(C.x + Math.cos(a) * 1500)} ${f(C.y + Math.sin(a) * 1000)}`
  }).join('')

  const stars = Array.from({ length: 30 }, () => {
    const angle = next() * 360
    const r = 140 + next() * 900
    const len = 8 + next() * 16

    return (
      `<g transform="translate(${C.x} ${C.y}) rotate(${f(angle)})"><line class="sd-star" x1="${f(r)}" y1="0" x2="${f(r + len)}" y2="0" stroke="${next() > 0.7 ? CY : WHITE}" ` +
      `stroke-width="${f(1 + next() * 1.2)}" stroke-linecap="round" style="--t:${f(-r)}px;--d:${f(9 + next() * 8)}s;animation-delay:${f(-next() * 14)}s"/></g>`
    )
  }).join('')

  const colors = [ACC, WHITE, CY, MG]
  const shards = Array.from({ length: 16 }, (_, index) => {
    const angle = next() * 360
    const r = 150 + next() * 600
    const size = 6 + next() * 12
    const pts = [
      [r - size, -size * 0.6],
      [r + size * 0.8, -size * 0.9],
      [r + size, size * 0.5],
      [r - size * 0.4, size],
    ]
      .map(([x, y]) => `${f(x ?? 0)},${f(y ?? 0)}`)
      .join(' ')

    return (
      `<g transform="rotate(${f(angle)})"><g class="sd-sh" style="--t:${f(-r)}px;--o:${f(500 + next() * 400)}px;--d:${f(8 + next() * 6)}s;animation-delay:${f(-next() * 12)}s">` +
      `<polygon class="sd-sp" points="${pts}" fill="${colors[index % 4]}" fill-opacity=".6"/></g></g>`
    )
  }).join('')

  const fall = [
    [190, 470], [140, 620], [250, 330], [560, 130], [700, 90], [900, 40], [1450, 220], [1380, 330], [1330, 440], [90, 800],
  ]
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y})"><polygon class="sd-fall" points="0,0 ${f(10 + next() * 10)},${f(next() * 6)} ${f(6 + next() * 8)},${f(12 + next() * 8)} ${f(-4)},${f(8 + next() * 6)}" ` +
        `fill="${i % 2 === 0 ? ACC : WHITE}" style="--fx:${f((next() - 0.5) * 80)}px;--fr:${f((next() - 0.5) * 360)}deg;animation-delay:${f(-i * 0.37)}s"/></g>`,
    )
    .join('')

  const glitchBars = [
    [90, 28, CY, 760], [210, 16, MG, 520], [380, 22, CY, 980], [560, 14, MG, 640], [720, 26, CY, 820], [850, 18, MG, 1000],
  ]
    .map(([y, h, c, w], i) => `<rect class="sd-gs" x="${i % 2 === 0 ? -100 : 700}" y="${y}" width="${w}" height="${h}" fill="${c}" style="animation-delay:${f(-i * 0.5)}s;--sx:${i % 2 === 0 ? 36 : -30}px"/>`)
    .join('')
  const slices = [[120, 40], [330, 44], [590, 50], [800, 36]]
    .map(([y, h], i) => `<clipPath id="sd-s${i}"><rect x="-200" y="${y}" width="2000" height="${h}"/></clipPath><g clip-path="url(#sd-s${i})"><use href="#sd-w" class="sd-sl" style="--sx:${i % 2 === 0 ? 38 : -30}px;animation-delay:${f(-i * 0.45)}s"/></g>`)
    .join('')

  const body = [cell(2, 0, 10, 7), ...[3, 5, 8, 10].map(col => cell(col, 7, 1, 1.5))].join('')
  const wearBehind =
    `<g transform="translate(-8 1)"><g class="sd-gh" fill="${CY}" fill-opacity=".28">${body}</g></g>` +
    `<g transform="translate(8 -1)"><g class="sd-gh sd-gh2" fill="${MG}" fill-opacity=".26">${body}</g></g>`
  const bit = (x: number, y: number, d: string, color: string, delay: number, dur: number) =>
    `<g transform="translate(${x} ${y})"><g class="sd-fl" style="animation-delay:${delay}s;animation-duration:${dur}s"><path d="${d}" stroke="${color}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>`
  const wearFront =
    bit(30, 206, 'M0 0L-7 6L0 12', CY, 0, 4.2) +
    bit(252, 192, 'M0 0L7 6L0 12', MG, -1.1, 5) +
    bit(14, 270, 'M0 0V12M-5 3H5', ACC, -2, 4.6) +
    bit(150, 168, 'M0 0H8V8H0Z', WHITE, -0.6, 3.8) +
    bit(250, 244, 'M0 12L6 0', CY, -2.6, 4.4)

  const nook =
    // The ground is a slab of glitched floor at the foot of the picture.
    `<rect x="-60" y="448" width="500" height="12" fill="#1a1426"/><line x1="-60" y1="448" x2="440" y2="448" stroke="${CY}" stroke-opacity=".6" stroke-width="2"/>` +
    `<line x1="-56" y1="451" x2="436" y2="451" stroke="${MG}" stroke-opacity=".5" stroke-width="2"/>` +
    '<path d="M60 448L70 460M300 448L290 460" stroke="#e6dcff" stroke-opacity=".6" stroke-width="1.5"/>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'glass',
      thought: 'bits',
      ink: '#040308',
      furniture: '#1a1426',
      metal: '#261d38',
      paper: WHITE,
      light: { idle: '#6a4fb0', work: ACC, bright: '#e4d4ff' },
      wear: { behind: wearBehind, front: wearFront },
      headTop: Y0 - 4,
      glowAt: [350, 272],
      seatArt:
        '<g fill="#1a1426"><rect x="110" y="350" width="82" height="11" rx="4"/><rect x="142" y="361" width="16" height="42"/><rect x="148" y="412" width="16" height="42"/>' +
        '<ellipse cx="156" cy="452" rx="42" ry="6"/></g>' +
        `<line x1="110" y1="350" x2="192" y2="350" stroke="${CY}" stroke-opacity=".6" stroke-width="2"/><line x1="112" y1="353" x2="194" y2="353" stroke="${MG}" stroke-opacity=".5" stroke-width="2"/>`,
      tableArt:
        '<g fill="#1a1426"><rect x="168" y="330" width="302" height="11" rx="2"/><rect x="178" y="341" width="12" height="115"/>' +
        '<rect x="438" y="341" width="12" height="58"/><rect x="446" y="408" width="12" height="48"/></g>' +
        `<line x1="168" y1="330" x2="470" y2="330" stroke="${CY}" stroke-opacity=".7" stroke-width="2"/><line x1="170" y1="333" x2="472" y2="333" stroke="${MG}" stroke-opacity=".5" stroke-width="2"/>` +
        '<path d="M300 330L308 341M380 330L372 341" stroke="#e6dcff" stroke-opacity=".7" stroke-width="1.5"/>',
      device: (light, activity) => {
        const busy = activity === 'tool' || activity === 'run' || activity === 'responding'
        const lines = Array.from({ length: 8 }, (_, i) => `M300 ${240 + i * 8}H${i % 3 === 0 ? 372 : 402}`).join('')

        return (
          '<rect x="244" y="324" width="92" height="6" rx="2" fill="#261d38"/>' +
          '<rect x="346" y="318" width="16" height="12" fill="#261d38"/><rect x="332" y="326" width="44" height="4" rx="2" fill="#261d38"/>' +
          '<rect x="290" y="226" width="120" height="94" rx="6" fill="#261d38"/>' +
          `<clipPath id="sd-scr"><rect x="298" y="234" width="104" height="70"/></clipPath>` +
          `<rect x="298" y="234" width="104" height="70" fill="${light}" fill-opacity=".2"/>` +
          `<g clip-path="url(#sd-scr)"><path class="sd-scan${busy ? ' sd-scan-b' : ''}" d="${lines}" stroke="${light}" stroke-opacity=".55" stroke-width="2" fill="none"/>` +
          `<rect class="sd-band" x="298" y="234" width="104" height="10" fill="${MG}" fill-opacity=".28"/><rect class="sd-block" x="330" y="262" width="22" height="7" fill="${CY}" fill-opacity=".5"/></g>` +
          '<path d="M402 234L368 262L378 270L336 304M368 262L360 242" stroke="#e6dcff" stroke-opacity=".85" stroke-width="1.8" fill="none"/>' +
          `<path d="M402 234L368 262L378 270L336 304" stroke="${MG}" stroke-opacity=".35" stroke-width="5" fill="none"/>`
        )
      },
    },
    style:
      '@keyframes sd-in{from{opacity:0}to{opacity:1}}' +
      '.sd-star{opacity:0;animation:sd-star var(--d,10s) linear infinite}' +
      '@keyframes sd-star{0%{opacity:0;transform:translateX(0)}12%{opacity:.8}85%{opacity:.6}100%{opacity:0;transform:translateX(var(--t))}}' +
      '.st-done .sd-star{animation-duration:30s}' +
      '.sd-rings{transform-box:fill-box;transform-origin:center;animation:sd-rings 12s linear infinite}' +
      '@keyframes sd-rings{from{transform:scale(1)}to{transform:scale(.7143)}}' +
      '.sd-sh{opacity:0;animation:sd-shard var(--d,10s) linear infinite}' +
      '@keyframes sd-shard{0%{opacity:0;transform:translateX(0)}12%{opacity:.85}88%{opacity:.6}100%{opacity:0;transform:translateX(var(--t))}}' +
      '.sd-sp{transform-box:fill-box;transform-origin:center;animation:mv-spin 7s linear infinite}' +
      '.st-thinking .sd-sh{animation:none;opacity:.8}.st-thinking .sd-orb{animation:mv-spin 18s linear infinite}' +
      '.sd-orb{transform-box:fill-box;transform-origin:center}' +
      '.st-run .sd-sh{animation-name:sd-fly;animation-duration:1.7s}' +
      '@keyframes sd-fly{0%{opacity:0;transform:translateX(0)}15%{opacity:.9}100%{opacity:0;transform:translateX(var(--o))}}' +
      '.st-done .sd-sh{animation:none;opacity:.12}' +
      '.sd-core{transform-box:fill-box;transform-origin:center;animation:sd-core 6s ease-in-out infinite alternate}' +
      '@keyframes sd-core{from{opacity:.75;transform:scale(.94)}to{opacity:1;transform:scale(1.06)}}' +
      '.st-done .sd-core{animation:sd-coreoff 3.4s ease-in-out both}@keyframes sd-coreoff{to{opacity:.3;transform:scale(.6)}}' +
      // Cracks breathe; respond with a faster pulse; the error flash is red-magenta once per 1.4 s.
      '.sd-glow{animation:sd-breathe 6s ease-in-out infinite alternate}@keyframes sd-breathe{from{opacity:.6}to{opacity:1}}' +
      '.st-responding .sd-glow{animation:sd-pulse 1.1s ease-in-out infinite alternate}@keyframes sd-pulse{from{opacity:.3}to{opacity:1.4}}' +
      '.sd-err,.sd-white{opacity:0}' +
      '.st-error .sd-err{animation:sd-eflash 1.4s ease-out infinite}@keyframes sd-eflash{0%{opacity:0}13%{opacity:.9}60%,100%{opacity:0}}' +
      '.sd-fall{opacity:0}.st-error .sd-fall{animation:sd-fall 2.2s ease-in infinite}' +
      '@keyframes sd-fall{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.9}100%{opacity:0;transform:translate(var(--fx),340px) rotate(var(--fr))}}' +
      // Crack tips: a pulse of light running along each edge.
      '.sd-edge{animation:sd-run 5s ease-in-out infinite alternate}@keyframes sd-run{from{opacity:.75}to{opacity:1}}' +
      // tool: glitch slices.
      '.sd-sl{display:none}.st-tool .sd-sl{display:block;animation:sd-slice 1.3s steps(1) infinite}' +
      '@keyframes sd-slice{0%{transform:translateX(0)}25%{transform:translateX(var(--sx))}55%{transform:translateX(calc(var(--sx) * -.6))}80%{transform:translateX(0)}}' +
      '.sd-gs{opacity:0}.st-tool .sd-gs{animation:sd-gs 3s steps(1) infinite}' +
      '@keyframes sd-gs{0%{opacity:0;transform:translateX(0)}20%{opacity:.09;transform:translateX(var(--sx))}60%{opacity:.06;transform:translateX(0)}80%,100%{opacity:0}}' +
      // run: the shockwave.
      '.sd-sw{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .sd-sw{animation:sd-sw 2.2s ease-out infinite}@keyframes sd-sw{0%{opacity:.7;transform:scale(.03)}100%{opacity:0;transform:scale(1)}}' +
      // web: the other universes light up.
      '.sd-vig{opacity:.55}.st-web .sd-vig{opacity:1}' +
      '.st-web .sd-tf{animation:sd-tfb 1.4s ease-in-out infinite alternate}@keyframes sd-tfb{from{opacity:.75}to{opacity:1}}' +
      '.sd-gear{transform-box:fill-box;transform-origin:center;animation:mv-spin 14s linear infinite}.st-web .sd-gear{animation-duration:4s}' +
      '.sd-vg{opacity:0}.st-web .sd-vg{animation:sd-vg 1.6s ease-in-out infinite alternate}@keyframes sd-vg{from{opacity:.25}to{opacity:.7}}' +
      // done: the cracks heal, glow white, then dim.
      '.st-done .sd-tf{animation:sd-gone 3s ease-in both}@keyframes sd-gone{to{opacity:0}}' +
      '.st-done .sd-glow{animation:sd-dim 3.4s ease-in-out both}@keyframes sd-dim{to{opacity:.1}}' +
      '.st-done .sd-edge{stroke-dasharray:1 1;animation:sd-heal 3.4s ease-in-out both}@keyframes sd-heal{from{stroke-dashoffset:0}to{stroke-dashoffset:.85}}' +
      '.st-done .sd-white{animation:sd-wh 3.4s ease-in-out both}@keyframes sd-wh{0%{opacity:0}30%{opacity:.8}100%{opacity:.18}}' +
      '.st-done .sd-hair{animation:sd-dim 3.4s ease-in-out both}' +
      // The critter's glitch ghosts and code shards, the monitor.
      '.sd-gh{animation:sd-gh 4.4s steps(1) infinite}.sd-gh2{animation-delay:-1.7s}' +
      '@keyframes sd-gh{0%,86%,100%{transform:translate(0,0)}88%{transform:translate(3px,-1px)}93%{transform:translate(-2px,1px)}}' +
      '.sd-fl{transform-box:fill-box;transform-origin:center;animation:sd-fl 4.4s ease-in-out infinite}' +
      '@keyframes sd-fl{0%,100%{transform:translate(0,0) rotate(-6deg)}50%{transform:translate(4px,-9px) rotate(8deg)}}' +
      '.sd-scan{animation:sd-scan 2.4s steps(1) infinite}.sd-scan-b{animation-duration:.9s}' +
      '@keyframes sd-scan{0%,70%,100%{transform:translateX(0)}74%{transform:translateX(5px)}82%{transform:translateX(-4px)}}' +
      '.sd-band{animation:sd-band 3.4s linear infinite}@keyframes sd-band{from{transform:translateY(-12px)}to{transform:translateY(74px)}}' +
      '.sd-block{animation:sd-block 3.6s steps(1) infinite}@keyframes sd-block{0%{transform:translate(0,0)}30%{transform:translate(30px,-18px)}60%{transform:translate(-12px,22px)}}',
    scenery:
      '<defs><linearGradient id="sd-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0716"/><stop offset="1" stop-color="#08060d"/></linearGradient>' +
      `<radialGradient id="sd-core"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".12" stop-color="${WHITE}" stop-opacity=".7"/><stop offset=".4" stop-color="${ACC}" stop-opacity=".28"/><stop offset="1" stop-color="${ACC}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="sd-t1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f3a"/><stop offset="1" stop-color="#0a1a2a"/></linearGradient>' +
      '<linearGradient id="sd-t2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1240"/><stop offset="1" stop-color="#3a1a1a"/></linearGradient>' +
      '<linearGradient id="sd-t3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0e1c"/><stop offset="1" stop-color="#14091c"/></linearGradient>' +
      '<radialGradient id="sd-pl" cx=".35" cy=".3"><stop offset="0" stop-color="#ffb070"/><stop offset="1" stop-color="#5a2060"/></radialGradient>' +
      `<radialGradient id="sd-vgl"><stop offset="0" stop-color="${WHITE}" stop-opacity=".5"/><stop offset="1" stop-color="${ACC}" stop-opacity="0"/></radialGradient></defs>` +
      '<rect width="1600" height="1000" fill="url(#sd-bg)"/>' +
      `<g class="sd-rings" fill="none" stroke="${ACC}" stroke-width="1.4">${rings}</g>` +
      `<path d="${rays}" stroke="${ACC}" stroke-opacity=".07" stroke-width="1" fill="none"/>` +
      stars +
      `<g class="sd-core"><circle cx="${C.x}" cy="${C.y}" r="190" fill="url(#sd-core)"/><circle cx="${C.x}" cy="${C.y}" r="16" fill="#040308"/>` +
      `<ellipse cx="${C.x}" cy="${C.y}" rx="64" ry="18" transform="rotate(-18 ${C.x} ${C.y})" fill="none" stroke="${WHITE}" stroke-opacity=".6" stroke-width="2"/></g>` +
      `<g transform="translate(${C.x} ${C.y})"><g class="sd-orb"><circle r="780" fill="none"/>${shards}</g></g>` +
      '<g id="sd-w">' +
      tearMarkup +
      `<g class="sd-hair"><path d="${hairPath}" stroke="${ACC}" stroke-opacity=".16" stroke-width="7" fill="none"/><path d="${hairPath}" stroke="${WHITE}" stroke-opacity=".45" stroke-width="1.4" fill="none"/></g>` +
      '</g>' +
      `<circle class="sd-vg" cx="172" cy="514" r="110" fill="url(#sd-vgl)"/><circle class="sd-vg" cx="705" cy="90" r="110" fill="url(#sd-vgl)"/><circle class="sd-vg" cx="1410" cy="292" r="120" fill="url(#sd-vgl)"/>` +
      slices +
      glitchBars +
      fall +
      [0, 0.73, 1.46].map(d => `<ellipse class="sd-sw" cx="${C.x}" cy="${C.y}" rx="1000" ry="760" fill="none" stroke="${WHITE}" stroke-width="7" style="animation-delay:${d}s"/>`).join('') +
      '<rect width="1600" height="1000" fill="none"/>',
    nook,
  }
}
