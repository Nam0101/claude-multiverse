import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Red Planet: a Mars colonist in a bubble helmet at a habitat terminal. Rust dunes under a maroon night, two moons,
// a dome cluster, a rover and dust devils. A rocket waits on its launch tower in the left third: a command lifts it
// off on a soft plume, an error brings a dust-storm wall, and a finished task lights the domes and shows the Earth.
const AMBER = '#ffb347'
const WARM = '#ffd9a0'
const RUST = '#c4552d'
const BASE = 560

/** A smooth, wavy ridge: a filled dune and its crest line, wide enough to cover the picture. */
function ridge(y: number, amp: number, step: number, seed: number): { fill: string; crest: string } {
  const next = random(seed)
  const pts: [number, number][] = []

  for (let x = -100, i = 0; x <= 1700 + step; x += step, i += 1) pts.push([x, y + (i % 2 ? 1 : -1) * amp * (0.4 + next() * 0.6)])

  const [x0, y0] = pts[0]!
  const [x1, y1] = pts[1]!
  const line = `M${f(x0)} ${f(y0)}Q${f(x0 + step / 2)} ${f(y0 - amp * 1.6)} ${f(x1)} ${f(y1)}${pts
    .slice(2)
    .map(([x, py]) => `T${f(x)} ${f(py)}`)
    .join('')}`

  return { fill: `${line}V1100H-100Z`, crest: line }
}

/** A habitat dome with ribs and a ring of windows: the windows light up in a cascade when a task is done. */
function dome(cx: number, r: number, ry: number, first: number): { markup: string; count: number } {
  const rows: [number, number][] = [
    ...[-0.62, -0.31, 0, 0.31, 0.62].map((k): [number, number] => [k * r, 16]),
    ...[-0.36, 0, 0.36].map((k): [number, number] => [k * r, ry * 0.56]),
  ]
  const windows = rows
    .map(
      ([dx, up], i) =>
        `<rect class="rp-win${(first + i) % 3 === 0 ? ' rp-on' : ''}" style="--i:${first + i}" x="${f(cx + dx - 3.5)}" y="${f(BASE - up - 8)}" width="7" height="10" rx="2.4" fill="${WARM}"/>`,
    )
    .join('')
  const ribs = [-0.55, 0.55]
    .map(k => `M${f(cx + k * r)} ${BASE}Q${f(cx + k * r * 0.9)} ${f(BASE - ry * 1.1)} ${cx} ${f(BASE - ry)}`)
    .join('')

  return {
    count: rows.length,
    markup:
      `<ellipse class="rp-dg" cx="${cx}" cy="${BASE - 12}" rx="${f(r * 1.5)}" ry="${f(ry * 1.15)}" fill="url(#rp-dglow)"/>` +
      `<path d="M${cx - r} ${BASE}A${r} ${ry} 0 0 1 ${cx + r} ${BASE}Z" fill="url(#rp-dome)" stroke="#9a6a80" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="${ribs}" fill="none" stroke="#9a6a80" stroke-opacity=".35" stroke-width="2"/>` +
      windows,
  }
}

/** The rocket on its pad, in local coordinates: x 0 is its axis, y 0 the pad's surface. */
function rocket(): string {
  return (
    '<g class="rp-rocket">' +
    // The plume sits behind the rocket and lifts with it.
    '<g class="rp-plume"><g class="rp-fl"><ellipse cx="0" cy="96" rx="82" ry="170" fill="url(#rp-po)"/><ellipse cx="0" cy="62" rx="30" ry="106" fill="url(#rp-pi)"/></g></g>' +
    '<path d="M-30 -110L-66 -12L-62 0H-30Z M30 -110L66 -12L62 0H30Z" fill="#5c3042" stroke="#2a1520" stroke-width="2"/>' +
    '<path d="M-12 -80L0 -6L12 -80Z" fill="#3a2030"/>' +
    '<path d="M-32 -30V-330C-32 -380 -12 -420 0 -440C12 -420 32 -380 32 -330V-30Z" fill="url(#rp-hull)" stroke="#2a1520" stroke-width="2.4"/>' +
    '<path d="M-32 -330C-32 -380 -12 -420 0 -440C12 -420 32 -380 32 -330Z" fill="#7a2c2c"/>' +
    '<rect x="-32" y="-252" width="64" height="16" fill="#b2442a"/><rect x="-32" y="-150" width="64" height="9" fill="#3a2430"/>' +
    '<path d="M-15 -212L0 -230L15 -212V-200L0 -218L-15 -200Z" fill="#b2442a"/>' +
    '<rect x="9" y="-326" width="6" height="290" fill="#ffffff" fill-opacity=".12"/>' +
    '<g fill="#ffcf85" stroke="#2a1520" stroke-width="3.4"><circle cx="0" cy="-300" r="7.5"/><circle cx="0" cy="-275" r="7.5"/></g>' +
    '<path d="M-24 -30H24L32 -4H-32Z" fill="#2a1520"/><path d="M-22 -4L-16 8H-6L-4 -4ZM-5 -4L-3 8H3L5 -4ZM22 -4L16 8H6L4 -4Z" fill="#1a0c14"/>' +
    '<circle class="rp-bk" cx="0" cy="-444" r="3.4" fill="#ff9a6a"/></g>'
  )
}

/** The launch tower with three swing arms that fold away when the engines light. */
function tower(): string {
  const rails = 'M-124 0V-392M-74 0V-392'
  const braces = Array.from({ length: 9 }, (_, i) => {
    const y = -i * 42

    return i % 2 ? `M-124 ${y}L-74 ${y - 42}` : `M-74 ${y}L-124 ${y - 42}`
  }).join('')
  const rungs = Array.from({ length: 10 }, (_, i) => `M-124 ${-i * 42}H-74`).join('')
  const arms = [-110, -226, -322]
    .map(
      y =>
        `<g transform="translate(-74 ${y})"><g class="rp-arm"><path d="M0 -5H42V5H0Z" fill="#4a2c3a" stroke="#8a5a6e" stroke-opacity=".6" stroke-width="1.6"/>` +
        `<path d="M42 -9V9" stroke="#8a5a6e" stroke-width="3"/><circle cx="36" cy="-9" r="2.6" fill="${AMBER}"/></g></g>`,
    )
    .join('')

  return (
    `<path d="${rails}${braces}${rungs}" fill="none" stroke="#8a5a6e" stroke-opacity=".7" stroke-width="3"/>` +
    '<path d="M-99 -392V-430" stroke="#8a5a6e" stroke-width="3"/><circle class="rp-bk" cx="-99" cy="-432" r="4" fill="#ff9a6a"/>' +
    arms
  )
}

/** A six-wheeled rover facing right with its headlights (pale) and a second, amber set for emergencies. */
function rover(): string {
  const wheels = [-32, 0, 32]
    .map(
      x =>
        `<g transform="translate(${x} -12)"><circle r="12" fill="#1a0c14" stroke="#7a5566" stroke-width="2.4"/><g class="rp-wh"><path d="M-8 0H8M0 -8V8" stroke="#7a5566" stroke-width="2.4"/></g></g>`,
    )
    .join('')

  return (
    `<g class="rp-rover"><path class="rp-hlw" d="M48 -34L230 -78V8Z" fill="url(#rp-hl)"/><path class="rp-hla" d="M48 -34L230 -78V8Z" fill="url(#rp-hla)"/>` +
    '<g class="rp-dust"><circle cx="-60" cy="-8" r="9" fill="#a85a3a"/><circle cx="-80" cy="-12" r="12" fill="#a85a3a"/><circle cx="-104" cy="-14" r="14" fill="#a85a3a"/></g>' +
    '<path d="M-40 -46L-12 -66H8L-14 -46Z" fill="#2a3a58" stroke="#5a7aa8" stroke-opacity=".6" stroke-width="1.6"/>' +
    '<path d="M-30 -46V-84" stroke="#8a5a6e" stroke-width="2.4"/><circle class="rp-bk" cx="-30" cy="-86" r="3.4" fill="#ff9a6a"/>' +
    '<path d="M12 -44L24 -62H40L44 -44Z" fill="#2a1a2a" stroke="#7a5566" stroke-width="2"/><path d="M26 -58H38L40 -48H24Z" fill="#7fc8e8" fill-opacity=".45"/>' +
    '<rect x="-46" y="-44" width="94" height="24" rx="6" fill="#6a4452" stroke="#2a1520" stroke-width="2.4"/>' +
    '<rect x="-38" y="-38" width="30" height="5" fill="#2a1520"/><rect x="-38" y="-30" width="62" height="3" fill="#2a1520" fill-opacity=".6"/>' +
    wheels +
    `<circle class="rp-hlw" cx="47" cy="-33" r="4" fill="#fff1c9"/><circle class="rp-hla" cx="47" cy="-33" r="4" fill="${AMBER}"/></g>`
  )
}

function dust(x: number, y: number, h: number, w: number, delay: number): string {
  const rings = Array.from({ length: 8 }, (_, i) => {
    const t = i / 7

    return `<ellipse cx="${f(Math.sin(i * 1.1) * 5)}" cy="${f(-t * h)}" rx="${f(w * (0.28 + t * 0.72))}" ry="${f(5 + t * 6)}" fill="#c8754a" fill-opacity="${f(0.3 - t * 0.09)}"/>`
  }).join('')

  return `<g transform="translate(${x} ${y})"><g class="rp-dv" style="animation-delay:${delay}s"><g class="rp-ds" style="animation-delay:${delay / 2}s">${rings}</g></g></g>`
}

function moon(x: number, y: number, r: number): string {
  return (
    `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="url(#rp-moonh)"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.86)}" fill="#8a707a"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.86)}" fill="url(#rp-moons)"/>` +
    `<g fill="#5c4650" fill-opacity=".7"><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.15)}" r="${f(r * 0.22)}"/><circle cx="${f(x + r * 0.35)}" cy="${f(y + r * 0.25)}" r="${f(r * 0.16)}"/></g>`
  )
}

/** The habitat terminal: a keyboard slab and a rugged monitor on an arm, with a progress bar or signal glyph by state. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${256 + i * 11}" y="322" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const bars = [78, 54, 90, 40, 66, 30]
    .map((w, i) => `<rect x="310" y="${240 + i * 8.5}" width="${w}" height="4" rx="1.4" fill="#06100e" fill-opacity=".55"/>`)
    .join('')
  const extra =
    activity === 'run'
      ? '<rect x="310" y="286" width="86" height="6" fill="#06100e" fill-opacity=".5"/><rect class="rp-prog" x="310" y="286" width="86" height="6" fill="#ffffff" fill-opacity=".8"/>'
      : activity === 'web'
        ? `<g fill="none" stroke="#06100e" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"><path class="rp-sig" d="M370 288Q382 276 394 288"/><path class="rp-sig rp-s2" d="M362 292Q382 270 402 292"/></g>`
        : '<rect class="rp-cur" x="310" y="290" width="6" height="8" fill="#06100e" fill-opacity=".7"/>'

  return (
    '<path d="M242 330L252 317H340L350 330Z" fill="#24131f" stroke="#5a3a4a" stroke-width="2"/>' +
    keys +
    '<rect x="326" y="296" width="10" height="24" fill="#3a2230"/>' +
    '<rect x="296" y="224" width="116" height="80" rx="8" fill="#1c0f19" stroke="#6a4a5a" stroke-width="4"/>' +
    `<rect x="304" y="232" width="100" height="64" rx="3" fill="${light}"/>` +
    bars +
    extra +
    '<path d="M304 232H340L316 296H304Z" fill="#ffffff" fill-opacity=".1"/>' +
    '<path d="M404 224V196" stroke="#6a4a5a" stroke-width="3"/><circle class="rp-bk" cx="404" cy="194" r="3.4" fill="#ff9a6a"/>' +
    '<g fill="#06100e" fill-opacity=".5"><rect x="298" y="299" width="14" height="2"/><rect x="298" y="302" width="14" height="2"/></g>'
  )
}

export function redPlanetWorld(): World {
  const next = random(11)
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = next() * 1600
    const y = next() * 480
    const tw = i % 5 === 0

    return `<circle${tw ? ` class="rp-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(0.7 + next() * 1.1)}" fill="#f0d8e0" fill-opacity="${f(0.25 + next() * 0.4)}"/>`
  }).join('')
  const far = ridge(612, 14, 190, 3)
  const mid = ridge(672, 22, 240, 5)
  const near = ridge(806, 30, 300, 9)
  const mesas =
    '<path d="M140 612L170 560H250L270 612ZM520 612L548 580H620L640 612ZM900 612L920 590H1010L1030 612Z" fill="#3a1424"/>'
  const bands = [150, 560, 1050]
    .map((x, i) => `<ellipse class="rp-band" style="animation-delay:${-i * 11}s" cx="${x}" cy="${590 + i * 8}" rx="360" ry="22" fill="#c4693a" fill-opacity=".08"/>`)
    .join('')
  const d1 = dome(1262, 64, 56, 0)
  const d2 = dome(1372, 46, 42, d1.count)
  const d3 = dome(1452, 34, 32, d1.count + d2.count)
  const smoke = Array.from({ length: 7 }, (_, i) => {
    const dx = (i - 3) * 62
    const r = 24 + (i % 3) * 8

    return `<circle class="rp-sm" style="--dx:${dx}px;animation-delay:${f(0.8 + (i % 4) * 0.12)}s" cx="${f((i - 3) * 26)}" cy="-10" r="${r}" fill="url(#rp-smoke)"/>`
  }).join('')
  const vents = [0, 1, 2, 3]
    .map(i => `<circle class="rp-vent" style="animation-delay:${f(i * 0.55)}s" cx="${i % 2 ? 36 : -36}" cy="${-280 + i * 24}" r="8" fill="#e9c9d0"/>`)
    .join('')
  const streaks = Array.from({ length: 22 }, () => {
    const x = next() * 1100
    const y = 380 + next() * 600

    return `<path d="M${f(x)} ${f(y)}h${f(60 + next() * 90)}" stroke="#e9a37a" stroke-opacity=".38" stroke-width="${f(1.5 + next() * 1.5)}" stroke-linecap="round"/>`
  }).join('')
  const lumps = Array.from({ length: 14 }, (_, i) => `<circle cx="${f(560 + i * 52 - (i % 2) * 30)}" cy="${f(450 + (i % 3) * 30 + next() * 30)}" r="${f(80 + next() * 40)}" fill="url(#rp-lump)"/>`).join('')
  const pstars = Array.from({ length: 7 }, () => `<circle cx="${f(268 + next() * 110)}" cy="${f(60 + next() * 100)}" r="1.3" fill="#fff" fill-opacity=".6"/>`).join('')
  const hits = Array.from({ length: 12 }, (_, i) => `<path class="rp-hit" style="animation-delay:${f(-i * 0.13)}s" d="M${f(262 + next() * 120)} ${f(54 + next() * 130)}l-26 8" stroke="#e9a37a" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"/>`).join('')
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2

    return `<circle cx="${f(320 + Math.cos(a) * 66)}" cy="${f(118 + Math.sin(a) * 66)}" r="3" fill="#8a5a6e"/>`
  }).join('')
  const stripes = Array.from({ length: 14 }, (_, i) => `M${40 + i * 28} 456l10 -14h9l-10 14Z`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#12060c',
      furniture: '#2d1722',
      metal: '#5a3a4a',
      paper: '#e8d4c8',
      light: { idle: '#3f9a98', work: '#6fe8d0', bright: '#c8fff2' },
      headTop: 206,
      glowAt: [352, 266],
      device,
      wear: {
        // The oxygen tank at its back, with a hose to the collar.
        behind:
          '<rect x="38" y="246" width="34" height="90" rx="12" fill="#4a3a44" stroke="#2a1a22" stroke-width="3"/>' +
          `<rect x="38" y="272" width="34" height="9" fill="${RUST}"/><rect x="38" y="296" width="34" height="5" fill="#2a1a22"/>` +
          '<path d="M55 246Q46 214 92 214" fill="none" stroke="#6a4a58" stroke-width="5" stroke-linecap="round"/>',
        // The bubble visor: clear glass over the whole face, a collar ring and a helmet lamp. The eyes stay open.
        front:
          '<path d="M54 334V262C54 224 98 202 150 202C202 202 246 224 246 262V334Z" fill="#dcc4ff" fill-opacity=".09" stroke="#e8d8ff" stroke-opacity=".6" stroke-width="5" stroke-linejoin="round"/>' +
          '<path d="M80 240Q100 218 140 212" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M212 226Q226 236 232 252" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="46" y="324" width="208" height="24" rx="9" fill="#3b2a35" stroke="#7a5a68" stroke-width="3"/>' +
          `<rect x="52" y="333" width="196" height="5" fill="${RUST}"/><g fill="#9a7a88"><circle cx="64" cy="336" r="2.4"/><circle cx="236" cy="336" r="2.4"/></g>` +
          `<rect x="44" y="252" width="12" height="18" rx="4" fill="${WARM}" stroke="#3b2a35" stroke-width="2.4"/>` +
          '<rect x="192" y="198" width="22" height="8" rx="3" fill="#7a5a68"/>',
      },
      seatArt:
        '<ellipse cx="151" cy="450" rx="44" ry="7" fill="#1a0c14"/><path d="M144 364H158V446H144Z" fill="#3a2230"/>' +
        '<path d="M110 452L146 436M192 452L158 436" stroke="#3a2230" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="108" y="350" width="86" height="15" rx="7" fill="#4a2c3a" stroke="#6a4458" stroke-width="2"/>' +
        `<rect x="112" y="356" width="78" height="3" fill="${RUST}" fill-opacity=".7"/>`,
      tableArt:
        '<g fill="#2d1722" stroke="#5a3a4a" stroke-width="1.8"><rect x="166" y="330" width="304" height="14" rx="3"/>' +
        '<rect x="180" y="344" width="276" height="40" rx="3" fill="#22121c"/><rect x="190" y="384" width="12" height="72"/><rect x="436" y="384" width="12" height="72"/></g>' +
        '<g fill="#5a3a4a"><rect x="300" y="360" width="38" height="5" rx="2"/><circle cx="192" cy="350" r="2.6"/><circle cx="444" cy="350" r="2.6"/><circle cx="192" cy="376" r="2.6"/><circle cx="444" cy="376" r="2.6"/></g>' +
        '<g><circle cx="244" cy="356" r="2.6" fill="#3f9a98"/><circle class="rp-bk" cx="254" cy="356" r="2.6" fill="#ff9a6a"/></g>' +
        // A jar of red soil with a green sprout.
        '<rect x="428" y="302" width="26" height="28" rx="5" fill="#dcc4ff" fill-opacity=".12" stroke="#9a8ab0" stroke-opacity=".6" stroke-width="2"/>' +
        '<rect x="430" y="318" width="22" height="10" rx="3" fill="#8a3a22"/><path d="M441 318V306M441 310Q447 304 450 306M441 312Q435 306 432 308" fill="none" stroke="#6fd08a" stroke-width="2.2" stroke-linecap="round"/>',
    },
    style:
      '.rp-tw{animation:rp-tw 3.4s ease-in-out infinite alternate}@keyframes rp-tw{to{opacity:.2}}' +
      '.rp-bk{animation:rp-bk 2.4s ease-in-out infinite}@keyframes rp-bk{0%,62%,100%{opacity:.25}78%{opacity:1}}' +
      '.rp-dv{animation:rp-dv 28s ease-in-out infinite alternate}@keyframes rp-dv{to{transform:translateX(90px)}}' +
      '.rp-ds{animation:rp-ds 3.6s ease-in-out infinite alternate}@keyframes rp-ds{from{transform:skewX(-8deg)}to{transform:skewX(8deg)}}' +
      '.rp-band{animation:rp-bd 44s ease-in-out infinite alternate}@keyframes rp-bd{to{transform:translateX(160px)}}' +
      '.st-done .rp-dv{opacity:.4}' +
      '@keyframes rp-fadein{to{opacity:1}}' +
      // Dome windows: a few are always lit, the rest glow when Claude writes and cascade on when it is done.
      '.rp-win{opacity:.26}.rp-on{opacity:.85}' +
      '.st-responding .rp-win{animation:rp-chase 1.8s ease-in-out infinite;animation-delay:calc(var(--i) * -.17s)}' +
      '@keyframes rp-chase{50%{opacity:.85}}' +
      '.st-done .rp-win{animation:rp-lit .7s ease-out both;animation-delay:calc(var(--i) * .1s)}@keyframes rp-lit{from{opacity:.2}to{opacity:1}}' +
      '.rp-dg{opacity:0}.st-done .rp-dg{animation:rp-fadein 2.2s ease-out .3s both}' +
      '.rp-earth{opacity:0}.st-done .rp-earth{animation:rp-earth 2.2s ease-out .3s both}' +
      '@keyframes rp-earth{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}' +
      // Run: the arms swing away, the engines glow up, the rocket climbs out of frame on a soft plume.
      '.rp-arm{transform-origin:0 0}.st-run .rp-arm{animation:rp-swing 1.3s ease-in-out .15s both}@keyframes rp-swing{to{transform:rotate(-7deg) scaleX(.1)}}' +
      '.rp-plume{opacity:0}.st-run .rp-plume{animation:rp-fadein 1.1s ease-out .25s both}' +
      '.rp-fl{transform-origin:0 0}.st-run .rp-fl{animation:rp-flk .55s ease-in-out infinite alternate}@keyframes rp-flk{from{transform:scaleY(.86)}to{transform:scaleY(1.08)}}' +
      '.st-run .rp-rocket{animation:rp-lift 5.2s linear .7s both}@keyframes rp-lift{0%{transform:translateY(0);animation-timing-function:ease-in}30%{transform:translateY(-70px);animation-timing-function:ease-in}60%{transform:translateY(-360px)}100%{transform:translateY(-1150px)}}' +
      '.rp-pg{opacity:0}.st-run .rp-pg{animation:rp-pg 7s ease-out .2s both}@keyframes rp-pg{0%{opacity:0}16%{opacity:.8}65%{opacity:.55}100%{opacity:.12}}' +
      '.rp-sm{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .rp-sm{animation:rp-sm 5s ease-out both}' +
      '@keyframes rp-sm{0%{opacity:0;transform:translate(0,0) scale(.4)}22%{opacity:.55}100%{opacity:.2;transform:translate(var(--dx),-34px) scale(2.6)}}' +
      '.rp-trail{opacity:0;transform-origin:0 0}.st-run .rp-trail{animation:rp-trail 5s ease-out 1.6s both}' +
      '@keyframes rp-trail{0%{opacity:0;transform:scaleY(.05)}25%{opacity:.7}100%{opacity:.25;transform:scaleY(1)}}' +
      // Thinking: cold vapor vents from the rocket. Read: a searchlight sweeps the sky.
      '.rp-vent{opacity:0;transform-box:fill-box;transform-origin:center}.st-thinking .rp-vent{animation:rp-vent 2.6s ease-out infinite}' +
      '@keyframes rp-vent{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:.4}100%{opacity:0;transform:translate(var(--vx,24px),-70px) scale(2)}}' +
      '.rp-sl{opacity:0}.st-read .rp-sl{animation:rp-sl 3.4s ease-in-out infinite alternate}@keyframes rp-sl{from{opacity:.7;transform:rotate(-40deg)}to{opacity:.7;transform:rotate(-6deg)}}' +
      // Tool: the rover drives off along the dunes, wheels turning, dust behind it.
      '.st-tool .rp-rover{animation:rp-drive 7.5s linear both}@keyframes rp-drive{to{transform:translateX(1300px)}}' +
      '.st-tool .rp-wh{animation:mv-spin .7s linear infinite}' +
      '.rp-dust{opacity:0}.st-tool .rp-dust{animation:rp-dust 1.2s ease-out infinite}@keyframes rp-dust{0%{opacity:.4}100%{opacity:0;transform:translateX(-30px)}}' +
      '.rp-hla{opacity:0}.st-error .rp-hlw{opacity:0}.st-error .rp-hla{animation:rp-amb 1.2s ease-in-out infinite}' +
      '@keyframes rp-amb{0%,100%{opacity:.1}50%{opacity:1}}' +
      // Web: the dish turns toward the Earth and beams.
      '.rp-dish{animation:rp-dsw 16s ease-in-out infinite alternate}@keyframes rp-dsw{from{transform:rotate(-8deg)}to{transform:rotate(6deg)}}' +
      '.st-web .rp-dish{animation:rp-dturn 3.2s ease-in-out infinite alternate}@keyframes rp-dturn{from{transform:rotate(-30deg)}to{transform:rotate(8deg)}}' +
      '.rp-bm{opacity:0}.st-web .rp-bm{animation:rp-fadein .9s ease-out .3s both}' +
      '.rp-bm path:last-child{stroke-dasharray:10 12;animation:rp-march 1s linear infinite}@keyframes rp-march{to{stroke-dashoffset:-22}}' +
      '.rp-ps{opacity:0}.st-web .rp-ps{animation:rp-ps 2.2s ease-out infinite;animation-delay:calc(var(--k) * .55s)}' +
      '@keyframes rp-ps{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:.8}100%{opacity:0;transform:translate(-226px,-221px) scale(1.5)}}' +
      '.rp-sig{opacity:.3}.st-web .rp-sig{animation:rp-sg 1.2s ease-in-out infinite alternate}.rp-s2{animation-delay:-.6s!important}@keyframes rp-sg{to{opacity:1}}' +
      // Screen details.
      '.rp-cur{animation:rp-cur 1.1s steps(1) infinite}@keyframes rp-cur{50%{opacity:0}}' +
      '.rp-prog{transform-box:fill-box;transform-origin:0 50%;animation:rp-prog 2.4s ease-in-out infinite}@keyframes rp-prog{from{transform:scaleX(.05)}to{transform:scaleX(1)}}' +
      // Error: the dust-storm wall sweeps across, grit hits the porthole, amber warning lights blink.
      '.rp-storm{opacity:0}.st-error .rp-storm{animation:rp-storm 4.4s cubic-bezier(.3,.2,.5,1) both}' +
      '@keyframes rp-storm{0%{opacity:0;transform:translateX(-1500px)}10%{opacity:1}86%{opacity:1}100%{opacity:0;transform:translateX(1900px)}}' +
      '.st-error .rp-sk{animation:rp-sk .6s linear infinite}@keyframes rp-sk{to{transform:translateX(-110px)}}' +
      '.rp-wd{opacity:0}.st-error .rp-wd{animation:rp-fadein .8s ease-out .3s both}' +
      '.rp-hit{opacity:0}.st-error .rp-hit{animation:rp-hit .5s linear infinite}@keyframes rp-hit{0%{opacity:0;transform:translate(60px,-14px)}20%{opacity:1}100%{opacity:0;transform:translate(-60px,14px)}}' +
      '.rp-ab{opacity:0}.st-error .rp-ab{animation:rp-amb 1.2s ease-in-out infinite}',
    scenery:
      '<defs>' +
      '<linearGradient id="rp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0310"/><stop offset=".28" stop-color="#1f0a26"/><stop offset=".5" stop-color="#43142b"/><stop offset=".6" stop-color="#6e2a26"/><stop offset="1" stop-color="#3a1214"/></linearGradient>' +
      '<linearGradient id="rp-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9733a" stop-opacity="0"/><stop offset=".6" stop-color="#d9733a" stop-opacity=".24"/><stop offset="1" stop-color="#d9733a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="rp-moonh"><stop offset="0" stop-color="#f0c8c8" stop-opacity=".22"/><stop offset="1" stop-color="#f0c8c8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rp-moons" x1="0" y1="0" x2="1" y2="0"><stop offset=".3" stop-color="#12060c" stop-opacity="0"/><stop offset="1" stop-color="#12060c" stop-opacity=".7"/></linearGradient>' +
      '<radialGradient id="rp-eh"><stop offset="0" stop-color="#7ab8ff" stop-opacity=".5"/><stop offset="1" stop-color="#7ab8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rp-ea" cx=".35" cy=".35"><stop offset="0" stop-color="#8fd0ff"/><stop offset=".6" stop-color="#2a6ad0"/><stop offset="1" stop-color="#0a2a70"/></radialGradient>' +
      '<linearGradient id="rp-hull" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3440"/><stop offset=".6" stop-color="#a48c98"/><stop offset="1" stop-color="#4e3844"/></linearGradient>' +
      '<radialGradient id="rp-po" cx=".5" cy=".25"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".55"/><stop offset=".6" stop-color="#d9501f" stop-opacity=".2"/><stop offset="1" stop-color="#d9501f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rp-pi" cx=".5" cy=".2"><stop offset="0" stop-color="#fff0cc" stop-opacity=".95"/><stop offset=".5" stop-color="#ffb064" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a30" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rp-pad"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".6"/><stop offset=".5" stop-color="#d9501f" stop-opacity=".22"/><stop offset="1" stop-color="#d9501f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="rp-smoke"><stop offset="0" stop-color="#c88a6a" stop-opacity=".7"/><stop offset="1" stop-color="#c88a6a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rp-tr" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d09a80" stop-opacity=".5"/><stop offset="1" stop-color="#d09a80" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rp-dome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a52"/><stop offset="1" stop-color="#2a1626"/></linearGradient>' +
      '<radialGradient id="rp-dglow"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rp-hl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff1c9" stop-opacity=".5"/><stop offset="1" stop-color="#fff1c9" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="rp-hla" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${AMBER}" stop-opacity=".6"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></linearGradient>` +
      '<linearGradient id="rp-sl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe9c8" stop-opacity=".3"/><stop offset="1" stop-color="#ffe9c8" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="rp-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b5532a" stop-opacity="0"/><stop offset=".35" stop-color="#b5532a" stop-opacity=".34"/><stop offset=".92" stop-color="#c4693a" stop-opacity=".36"/><stop offset="1" stop-color="#c4693a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="rp-lump"><stop offset="0" stop-color="#c4693a" stop-opacity=".34"/><stop offset="1" stop-color="#c4693a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="rp-bmg" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7fe8d0" stop-opacity=".4"/><stop offset="1" stop-color="#7fe8d0" stop-opacity=".05"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#rp-sky)"/><rect y="470" width="1600" height="190" fill="url(#rp-hz)"/>' +
      stars +
      moon(410, 92, 12) +
      '<g class="mv-r">' +
      moon(1410, 100, 26) +
      // The Earth, tiny and blue, shown when a task is done.
      '<g transform="translate(1250 208)"><g class="rp-earth"><circle r="64" fill="url(#rp-eh)"/><circle r="20" fill="url(#rp-ea)"/><path d="M-7 -5Q-2 -10 3 -6Q-1 -2 -6 0ZM2 4Q8 2 10 7Q5 10 2 8Z" fill="#6fd08a" fill-opacity=".7"/></g></g></g>' +
      mesas +
      bands +
      `<path d="${far.fill}" fill="#3c1620"/><path d="${far.crest}" fill="none" stroke="${RUST}" stroke-opacity=".28" stroke-width="2"/>` +
      `<path d="${mid.fill}" fill="#481c18"/><path d="${mid.crest}" fill="none" stroke="#e0925f" stroke-opacity=".24" stroke-width="2"/>` +
      dust(560, 668, 120, 34, 0) +
      dust(980, 676, 150, 42, -9) +
      dust(300, 700, 90, 26, -17) +
      // The launch pad: tower, rocket, tanks, a shed.
      '<g transform="translate(262 728)">' +
      '<ellipse cx="0" cy="14" rx="230" ry="30" fill="#1a0a10" fill-opacity=".6"/>' +
      '<path d="M-190 0H190L208 18H-208Z" fill="#33202c" stroke="#7a5566" stroke-opacity=".6" stroke-width="2"/><rect x="-170" y="18" width="340" height="14" fill="#1c0e14"/>' +
      '<g fill="#4a2c3a" stroke="#8a5a6e" stroke-opacity=".6" stroke-width="2"><rect x="104" y="-62" width="34" height="62" rx="14"/><rect x="146" y="-50" width="30" height="50" rx="12"/></g>' +
      `<rect x="-190" y="-28" width="46" height="28" rx="3" fill="#3a2230" stroke="#8a5a6e" stroke-opacity=".6" stroke-width="2"/><rect x="-182" y="-20" width="12" height="9" fill="${WARM}" fill-opacity=".8"/>` +
      '<path d="M-60 -2H60" stroke="#8a5a6e" stroke-opacity=".35" stroke-width="2"/>' +
      tower() +
      '<g transform="translate(-99 -396)"><g class="rp-sl"><path d="M0 0L460 -70V70Z" fill="url(#rp-sl)"/></g></g>' +
      '<path class="rp-trail" d="M-12 0L-34 -820H34L12 0Z" fill="url(#rp-tr)"/>' +
      rocket() +
      vents +
      '<ellipse class="rp-pg" cx="0" cy="8" rx="230" ry="44" fill="url(#rp-pad)"/>' +
      smoke +
      '</g>' +
      `<path d="${near.fill}" fill="#2a100d"/><path d="${near.crest}" fill="none" stroke="#e0925f" stroke-opacity=".2" stroke-width="2.4"/>` +
      '<g transform="translate(300 882)">' +
      rover() +
      '</g>' +
      '<path d="M-100 960Q400 930 800 960T1700 950V1100H-100Z" fill="#200a0a"/>' +
      // The habitat cluster on its plateau, with the comms dish on a mast.
      '<g class="mv-r"><g class="mv-b"><g transform="translate(1600 560) scale(1.2) translate(-1600 -560)">' +
      `<path d="M1170 680Q1200 568 1260 ${BASE}H1640V700Z" fill="#2a1118"/>` +
      d1.markup +
      d2.markup +
      d3.markup +
      `<rect x="1318" y="${BASE - 18}" width="12" height="14" fill="#3a2030"/><rect x="1414" y="${BASE - 16}" width="12" height="12" fill="#3a2030"/>` +
      `<path d="M1262 ${BASE - 56}V${BASE - 96}" stroke="#8a5a6e" stroke-width="3"/><circle class="rp-bk" cx="1262" cy="${BASE - 98}" r="3.6" fill="#ff9a6a"/>` +
      `<g fill="${AMBER}"><circle class="rp-ab" cx="1372" cy="${BASE - 46}" r="4"/><circle class="rp-ab" cx="1452" cy="${BASE - 36}" r="4"/></g>` +
      // The beam to the Earth, then the dish itself.
      `<g class="rp-bm"><path d="M1534 488L1322 258L1296 288Z" fill="url(#rp-bmg)"/><path d="M1534 488L1308 267" fill="none" stroke="#7fe8d0" stroke-opacity=".5" stroke-width="2.4"/></g>` +
      [0, 1, 2].map(k => `<circle class="rp-ps" style="--k:${k}" cx="1534" cy="488" r="9" fill="none" stroke="#7fe8d0" stroke-width="2.4"/>`).join('') +
      `<path d="M1540 ${BASE}V496" stroke="#8a5a6e" stroke-width="4"/>` +
      '<g transform="translate(1540 496)"><g class="rp-dish"><path d="M-26 -12Q0 18 26 -12Z" fill="#6a4a5a" stroke="#c8a0b4" stroke-opacity=".6" stroke-width="2.4"/><path d="M0 4L-6 -26" stroke="#c8a0b4" stroke-width="2.4"/><circle cx="-6" cy="-28" r="3.4" fill="#c8a0b4"/></g></g>' +
      '</g></g></g>' +
      // The dust-storm wall (error).
      `<g class="rp-storm"><rect x="0" y="470" width="1300" height="560" fill="url(#rp-sw)"/>${lumps}<g class="rp-sk">${streaks}</g></g>`,
    nook:
      '<defs><clipPath id="rp-pc"><circle cx="320" cy="118" r="60"/></clipPath>' +
      '<linearGradient id="rp-ps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0624"/><stop offset=".6" stop-color="#5a2028"/><stop offset="1" stop-color="#8a3a22"/></linearGradient></defs>' +
      // The habitat's hull wall, with a seam, a pipe and a hazard strip at the floor.
      '<path d="M16 60Q16 20 56 20H460V470H16Z" fill="#1a0c16" stroke="#3a1d2c" stroke-width="3"/>' +
      '<g stroke="#2e1624" stroke-width="2"><path d="M16 180H460M16 300H460M130 20V456"/></g>' +
      '<path d="M38 20V440" stroke="#3a2030" stroke-width="9"/><circle cx="38" cy="210" r="9" fill="#5a3a4a"/><circle cx="38" cy="210" r="3" fill="#1a0c16"/>' +
      '<g fill="#8a5a6e"><circle cx="38" cy="120" r="3"/><circle cx="38" cy="330" r="3"/></g>' +
      '<g fill="#2a1520" stroke="#5a3a4a" stroke-width="2"><rect x="70" y="50" width="48" height="34" rx="4"/></g>' +
      '<g><circle cx="82" cy="62" r="3" fill="#3f9a98"/><circle cx="94" cy="62" r="3" fill="#3f9a98" fill-opacity=".4"/><circle class="rp-bk" cx="106" cy="62" r="3" fill="#ff9a6a"/>' +
      `<circle cx="82" cy="74" r="3" fill="${WARM}" fill-opacity=".6"/><circle cx="94" cy="74" r="3" fill="#3f9a98" fill-opacity=".6"/></g>` +
      '<path d="M16 456H460V480H16Z" fill="#100810"/>' +
      `<path d="${stripes}" fill="${RUST}" fill-opacity=".5"/>` +
      // The porthole onto the dunes: the dust hits it in a storm, and the Earth shows in it when done.
      '<g clip-path="url(#rp-pc)"><rect x="250" y="50" width="140" height="140" fill="url(#rp-ps)"/>' +
      pstars +
      '<path d="M250 150Q290 126 330 142T400 134V190H250Z" fill="#4a1a18"/><path d="M250 168Q300 150 350 164T400 158V190H250Z" fill="#2e0e10"/>' +
      '<g transform="translate(300 84)"><g class="rp-earth"><circle r="14" fill="url(#rp-eh)"/><circle r="5" fill="url(#rp-ea)"/></g></g>' +
      '<g class="rp-wd"><rect x="250" y="50" width="140" height="140" fill="#b5532a" fill-opacity=".34"/>' +
      hits +
      '</g></g>' +
      '<circle cx="320" cy="118" r="64" fill="none" stroke="#5a3a4a" stroke-width="9"/><circle cx="320" cy="118" r="59" fill="none" stroke="#1a0c16" stroke-width="2.4"/>' +
      bolts +
      '<path d="M270 70Q290 52 320 52" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>',
  }
}
