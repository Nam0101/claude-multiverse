import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Grand Prix: Claude is a race engineer on the pit wall of a night street circuit. Floodlit track curves in at the
// left and along the bottom, with catch fences, a footbridge, grandstands, a skyline and a timing tower. When a
// command runs open-wheel cars stream past; an error spins one out in tyre smoke under a slow yellow light; done
// brings small fireworks over the stand and a chequered flag on the bridge.
const CYAN = '#5fd0ff'
const NAVY = '#0a0d18'
const STEEL = '#1c2335'

type CP = [number, number, number]
type Pt = { x: number; y: number; w: number; dx: number; dy: number }

// The track's centre line: x, y and full width, from the far left to the near right.
const CPS: CP[] = [
  [-80, 468, 40], [140, 470, 56], [270, 492, 76], [350, 545, 104], [410, 625, 140], [500, 720, 190],
  [650, 808, 240], [860, 872, 290], [1120, 918, 330], [1420, 945, 370], [1720, 960, 400],
]

function sampleTrack(per: number): Pt[] {
  const out: Pt[] = []
  const cr = (a: number, b: number, c: number, d: number, t: number): number =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)

  for (let i = 0; i < CPS.length - 1; i += 1) {
    const p0 = CPS[Math.max(i - 1, 0)]!
    const p1 = CPS[i]!
    const p2 = CPS[i + 1]!
    const p3 = CPS[Math.min(i + 2, CPS.length - 1)]!
    const last = i === CPS.length - 2

    for (let k = 0; k < per + (last ? 1 : 0); k += 1) {
      const t = k / per

      out.push({ x: cr(p0[0], p1[0], p2[0], p3[0], t), y: cr(p0[1], p1[1], p2[1], p3[1], t), w: cr(p0[2], p1[2], p2[2], p3[2], t), dx: 1, dy: 0 })
    }
  }

  out.forEach((p, i) => {
    const a = out[Math.max(i - 1, 0)]!
    const b = out[Math.min(i + 1, out.length - 1)]!
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1

    p.dx = (b.x - a.x) / len
    p.dy = (b.y - a.y) / len
  })

  return out
}

const TRACK = sampleTrack(6)
/** A point offset from the centre line by `by` of the half width, plus `extra` pixels, towards the far (upper) side. */
const edge = (p: Pt, by: number, extra = 0): [number, number] => [p.x + p.dy * (p.w * 0.5 * by + extra), p.y - p.dx * (p.w * 0.5 * by + extra)]
const line = (pts: [number, number][]): string => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`).join('')

function dots(points: [number, number][], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** One open-wheel car seen from above, nose to the right, at the origin. */
function car(body: string, stripe: string, trail: string): string {
  return (
    `<rect class="gp-trail" x="-150" y="-3.5" width="116" height="7" fill="url(#${trail})"/>` +
    '<path d="M-130 -9H-40M-120 9H-40" stroke="#cfe8ff" stroke-opacity=".25" stroke-width="1.4"/>' +
    '<g fill="#07090f"><rect x="-31" y="-15" width="19" height="8" rx="2"/><rect x="-31" y="7" width="19" height="8" rx="2"/><rect x="17" y="-14" width="14" height="7" rx="2"/><rect x="17" y="7" width="14" height="7" rx="2"/></g>' +
    `<rect x="-44" y="-11" width="8" height="22" rx="1.5" fill="${stripe}"/>` +
    `<path d="M-36 -5L-10 -7L10 -4L42 -1.5V1.5L10 4L-10 7L-36 5Z" fill="${body}" stroke="#cfe8ff" stroke-opacity=".35" stroke-width="1"/>` +
    `<path d="M-30 0H40" stroke="${stripe}" stroke-width="2"/>` +
    `<rect x="36" y="-12" width="5" height="24" rx="1.5" fill="${stripe}"/><ellipse cx="-2" cy="0" rx="7" ry="3.6" fill="#05070b"/><ellipse cx="-2" cy="0" rx="3" ry="1.6" fill="#cfe8ff" fill-opacity=".4"/>`
  )
}

/** The cars' run along the centre line as keyframes: position, heading and size, with a fade at both ends. */
function driveKeys(): string {
  const cum = [0]

  for (let i = 1; i < TRACK.length; i += 1) cum.push(cum[i - 1]! + Math.hypot(TRACK[i]!.x - TRACK[i - 1]!.x, TRACK[i]!.y - TRACK[i - 1]!.y))

  const total = cum[cum.length - 1]!
  const stops = 17
  const frames: string[] = []
  let at = 0

  for (let j = 0; j < stops; j += 1) {
    const want = (j / (stops - 1)) * total

    while (at < TRACK.length - 2 && cum[at + 1]! < want) at += 1

    const a = TRACK[at]!
    const b = TRACK[at + 1]!
    const u = Math.min(1, Math.max(0, (want - cum[at]!) / (cum[at + 1]! - cum[at]! || 1)))
    const x = a.x + (b.x - a.x) * u
    const y = a.y + (b.y - a.y) * u
    const w = a.w + (b.w - a.w) * u
    const ang = (Math.atan2(a.dy + (b.dy - a.dy) * u, a.dx + (b.dx - a.dx) * u) * 180) / Math.PI
    const op = j === 0 || j === stops - 1 ? 0 : 1

    frames.push(`${f((j / (stops - 1)) * 100)}%{opacity:${op};transform:translate(${f(x)}px,${f(y)}px) rotate(${f(ang)}deg) scale(${f(0.3 + w / 250)})}`)
  }

  return `@keyframes gp-drive{${frames.join('')}}`
}

/** A floodlight pylon: mast, a bank of lamps, a halo and a soft cone onto the ground. */
function pylon(x: number, top: number, base: number): string {
  const lamps: [number, number][] = []

  for (let r = 0; r < 3; r += 1) for (let c = 0; c < 7; c += 1) lamps.push([x - 29 + c * 9, top - 28 + r * 9])

  return (
    `<path d="M${x - 4} ${base}L${x - 2} ${top}H${x + 2}L${x + 4} ${base}Z" fill="#070910" stroke="#26314a" stroke-opacity=".7"/>` +
    `<path d="M${x} ${top + 6}L${x - 120} ${base - 40}L${x + 120} ${base - 40}Z" fill="url(#gp-cone)"/>` +
    `<circle cx="${x}" cy="${top - 14}" r="110" fill="url(#gp-halo)"/>` +
    `<rect x="${x - 34}" y="${top - 34}" width="68" height="32" rx="3" fill="#0a0d16" stroke="#2a3552"/>` +
    `<path d="${dots(lamps, 5)}" fill="#fff4d6"/>`
  )
}

/** The telemetry traces on a screen, drawn with a path length of 1 so the dashes can race. */
function trace(x: number, y: number, w: number, h: number, color: string, seed: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i <= 10; i += 1) d += `${i === 0 ? 'M' : 'L'}${f(x + (w * i) / 10)} ${f(y + h * (0.15 + next() * 0.7))}`

  return `<path class="gp-tl" pathLength="1" d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>`
}

/** The pit-wall rig: a laptop under two stacked telemetry screens. Self-contained, for the portals and the band. */
function device(light: string, activity: Activity): string {
  const bars = Array.from({ length: 6 }, (_, i) => `<rect x="${f(300 + i * 14)}" y="${f(300 - (6 + ((i * 7) % 5) * 5))}" width="9" height="${f(6 + ((i * 7) % 5) * 5)}" fill="${light}" fill-opacity=".55"/>`).join('')
  const hot = activity === 'error' ? '#ff8f6a' : '#ffc15a'

  return (
    '<rect x="244" y="322" width="156" height="9" rx="2" fill="#262f44"/>' +
    Array.from({ length: 8 }, (_, i) => `<rect x="${252 + i * 14}" y="325" width="9" height="3" fill="${light}" fill-opacity=".5"/>`).join('') +
    // The post behind, and the two stacked screens.
    '<rect x="398" y="96" width="6" height="228" fill="#141a28"/>' +
    `<g fill="#0a0e17" stroke="#2f3c58" stroke-width="2.4"><rect x="266" y="96" width="140" height="54" rx="3"/><rect x="266" y="156" width="140" height="54" rx="3"/></g>` +
    `<g fill="${light}" fill-opacity=".1"><rect x="271" y="101" width="130" height="44"/><rect x="271" y="161" width="130" height="44"/></g>` +
    `<g stroke="${light}" stroke-opacity=".25" stroke-width="1"><path d="M271 123H401M271 183H401"/></g>` +
    trace(274, 104, 124, 38, light, 3) + trace(274, 104, 124, 38, hot, 5) +
    trace(274, 164, 124, 38, '#7dffb0', 8) + trace(274, 164, 124, 38, light, 12) +
    // The laptop screen with a lap-time bar chart.
    '<path d="M294 322L298 226H396L398 322Z" fill="#161c2b" stroke="#2f3c58" stroke-width="2.4" stroke-linejoin="round"/>' +
    `<path d="M300 318L303 232H392L393 318Z" fill="#05090f"/><path d="M300 318L303 232H392L393 318Z" fill="${light}" fill-opacity=".1"/>` +
    bars + trace(302, 240, 88, 44, light, 21) +
    `<path d="M302 302H392" stroke="${light}" stroke-opacity=".45"/>` +
    // A hand radio on the wall.
    '<rect x="428" y="298" width="14" height="32" rx="3" fill="#141a28" stroke="#2f3c58"/><path d="M435 298V284" stroke="#2f3c58" stroke-width="3"/><circle cx="435" cy="306" r="2" fill="#5fd0ff"/>'
  )
}

export function grandPrixWorld(): World {
  const next = random(23)
  const upper = TRACK.map(p => edge(p, 1))
  const lower = TRACK.map(p => edge(p, -1))
  const asphalt = `${line(upper)}${line([...lower].reverse()).replace('M', 'L')}Z`
  const mid = TRACK.map(p => [p.x, p.y] as [number, number])
  const fenceTop = TRACK.map(p => edge(p, 1, 10)).map(([x, y], i) => [x, y - (14 + TRACK[i]!.w * 0.2)] as [number, number])
  const fenceBase = TRACK.map(p => edge(p, 1, 10))
  const fence = `${line(fenceBase)}${line([...fenceTop].reverse()).replace('M', 'L')}Z`
  const posts = TRACK.filter((_, i) => i % 3 === 0)
    .map(p => {
      const [x, y] = edge(p, 1, 10)

      return `M${f(x)} ${f(y)}V${f(y - (14 + p.w * 0.2))}`
    })
    .join('')
  const skyline = (() => {
    let body = ''
    const win: [number, number][][] = [[], [], []]

    for (let x = -40, i = 0; x < 1640; x += 36 + next() * 40, i += 1) {
      const w = 40 + next() * 44
      const h = 40 + next() * (x > 200 && x < 700 ? 190 : 120)

      body += `<rect x="${f(x)}" y="${f(480 - h)}" width="${f(w)}" height="${f(h + 20)}" fill="${i % 2 ? '#0b0f1c' : '#0e1322'}"/>`

      for (let n = 0; n < Math.min(14, Math.floor(w * h / 420)); n += 1) win[Math.floor(next() * 3)]!.push([x + 5 + next() * (w - 12), 480 - h + 8 + next() * (h - 14)])
    }

    return (
      body +
      `<path d="${dots(win[0]!, 2.6)}" fill="#ffd89a" fill-opacity=".55"/><path class="gp-tw1" d="${dots(win[1]!, 2.6)}" fill="#9fdcff" fill-opacity=".7"/><path class="gp-tw2" d="${dots(win[2]!, 2.6)}" fill="#ffd89a" fill-opacity=".8"/>`
    )
  })()
  const crowd: [number, number][][] = [[], [], []]

  for (let i = 0; i < 260; i += 1) crowd[i % 3]!.push([585 + next() * 1030, 436 + next() * 78])

  const timing = Array.from({ length: 9 }, (_, i) => {
    const y = 92 + i * 26

    return `<g class="gp-row" style="animation-delay:${f(-i * 0.37)}s"><rect x="1530" y="${y}" width="10" height="16" fill="${['#ffd34d', '#5fd0ff', '#ff6fb1', '#7dffb0', '#ffffff'][i % 5]}"/><path d="M1546 ${y + 2}h8v12h-8zM1558 ${y + 2}h8v12h-8zM1570 ${y + 2}h8v12h-8z" fill="#e8f2ff" fill-opacity=".75"/></g>`
  }).join('')
  const cars = [
    ['#0f2a4a', '#5fd0ff', 'gp-tc'],
    ['#2a1240', '#ff6fb1', 'gp-tm'],
    ['#2e2308', '#ffc15a', 'gp-ta'],
    ['#0c2e2a', '#7dffb0', 'gp-tg'],
    ['#1b1b2e', '#ffffff', 'gp-tw'],
  ]
    .map(([b, s, t], i) => `<g class="gp-car${i > 1 ? ' gp-x' : ''}" style="--dl:${f(-i * 4.4)}s;--dr:${f(-i * 0.56)}s">${car(b!, s!, t!)}</g>`)
    .join('')
  const speed = Array.from({ length: 12 }, () => {
    const x = -200 + next() * 1700
    const y = 600 + next() * 380

    return `M${f(x)} ${f(y)}h${f(120 + next() * 200)}`
  }).join('')
  const burst = (x: number, y: number, color: string, delay: number): string => {
    let spokes = ''

    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2

      spokes += `M${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 14)}L${f(Math.cos(a) * 52)} ${f(Math.sin(a) * 52)}`
    }

    return (
      `<g transform="translate(${x} ${y}) scale(1.7)"><circle class="gp-fg" r="74" fill="url(#gp-fwg)" style="animation-delay:${delay}s"/>` +
      `<path class="gp-fw" d="${spokes}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="16 38" style="animation-delay:${delay}s"/></g>`
    )
  }
  const flag = Array.from({ length: 7 }, (_, c) => {
    let cells = ''

    for (let r = 0; r < 4; r += 1) cells += `<rect x="${c * 14}" y="${r * 13}" width="14" height="13" fill="${(c + r) % 2 ? '#05070b' : '#f2f6fb'}"/>`

    return `<g class="gp-wv" style="animation-delay:${f(-c * 0.16)}s">${cells}</g>`
  }).join('')
  const smoke = Array.from({ length: 8 }, (_, i) => `<circle class="gp-sm" cx="${f(-60 + i * 22)}" cy="${f((i % 3) * 14 - 14)}" r="${f(18 + (i % 3) * 5)}" fill="#c9d3e0" style="animation-delay:${f(0.15 + i * 0.12)}s"/>`).join('')
  const rotors = [-1, 1].map(s => [-1, 1].map(t => `<ellipse class="gp-rot" cx="${s * 30}" cy="${t * 12 - 4}" rx="17" ry="3.4" fill="#cfe8ff" fill-opacity=".5"/>`).join('')).join('')
  const kerb = `<path d="${line(upper)}" fill="none" stroke="#d9602a" stroke-opacity=".5" stroke-width="5"/><path d="${line(upper)}" fill="none" stroke="#f2f6fb" stroke-opacity=".5" stroke-width="5" stroke-dasharray="14 14"/>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#05060b',
      furniture: '#1a2030',
      metal: '#2b3447',
      paper: '#dfe6f0',
      light: { idle: '#3a86a8', work: CYAN, bright: '#d2f2ff' },
      headTop: 202,
      glowAt: [338, 216],
      device,
      wear: {
        // A team cap in plain navy with a white band, a headset over it: band, ear cups and a mic boom. Nothing
        // crosses the eye rows (y 254 and below, x 102..214).
        front:
          '<path d="M64 250C64 226 100 208 150 208C200 208 236 226 236 250Z" fill="#17304a" stroke="#2f4d6e" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M64 244H236V250H64Z" fill="#e8f0fa" fill-opacity=".85"/><path d="M150 208V244" stroke="#2f4d6e" stroke-width="2"/>' +
          '<path d="M214 246L264 250L266 257L212 254Z" fill="#0f2236" stroke="#2f4d6e" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<path d="M68 252C68 196 232 196 232 252" fill="none" stroke="#2b3447" stroke-width="6"/>' +
          '<rect x="58" y="258" width="14" height="32" rx="5" fill="#2b3447"/><rect x="228" y="258" width="14" height="32" rx="5" fill="#2b3447"/>' +
          `<rect x="62" y="266" width="6" height="16" rx="3" fill="${CYAN}" fill-opacity=".6"/>` +
          '<path d="M238 286C250 292 254 298 256 304" fill="none" stroke="#2b3447" stroke-width="4" stroke-linecap="round"/><circle cx="257" cy="306" r="4.5" fill="#141a28" stroke="#2b3447" stroke-width="2"/>',
      },
      seatArt:
        // A pit stool: cushion, a gas-lift post, a foot ring and a five-spoke base.
        '<ellipse cx="151" cy="355" rx="46" ry="8" fill="#232d44" stroke="#34415f" stroke-width="2"/><path d="M105 355H197V362H105Z" fill="#161d30"/>' +
        '<rect x="145" y="362" width="12" height="84" fill="#141a28" stroke="#2a3552"/><ellipse cx="151" cy="410" rx="36" ry="6" fill="none" stroke="#34415f" stroke-width="4"/>' +
        '<path d="M151 448L102 456M151 448L200 456M151 448L128 458M151 448L176 458" stroke="#141a28" stroke-width="6" stroke-linecap="round"/><ellipse cx="151" cy="446" rx="14" ry="5" fill="#1f2840"/>',
      tableArt:
        // The pit wall: a concrete top with a lip, a dark face with a kerb-stripe band and a neon edge.
        '<rect x="166" y="330" width="304" height="13" rx="2" fill="#2a3450" stroke="#3a4868" stroke-width="1.6"/>' +
        '<rect x="170" y="343" width="296" height="113" fill="#0d111c" stroke="#1f2840" stroke-width="1.6"/>' +
        `<path d="M171 350H465" stroke="${CYAN}" stroke-opacity=".6" stroke-width="2.4"/>` +
        '<path d="M171 428H465" stroke="#e8edf5" stroke-opacity=".3" stroke-width="12" stroke-dasharray="12 12"/>' +
        '<path d="M190 360V420M440 360V420" stroke="#1a2236" stroke-width="3"/><path d="M200 392Q260 410 330 392" fill="none" stroke="#1a2236" stroke-width="5"/>',
    },
    style:
      driveKeys() +
      '.gp-car{opacity:0;animation:gp-drive var(--ds,9s) linear var(--dl) infinite}.gp-x{display:none}' +
      '.st-run .gp-car{--ds:2.8s;animation-duration:2.8s;animation-delay:var(--dr)}.st-run .gp-x{display:inline}' +
      '.gp-trail{transform-box:fill-box;transform-origin:100% 50%}.st-run .gp-trail{transform:scaleX(1.7)}' +
      '.gp-sl{opacity:0}.st-run .gp-sl{animation:gp-sl .8s linear infinite}@keyframes gp-sl{0%{opacity:0;transform:translateX(0)}20%{opacity:.35}100%{opacity:0;transform:translateX(900px)}}' +
      // Ambient: crowd lights, windows, floodlights and the timing tower.
      '.gp-tw1{animation:gp-tw 3.6s ease-in-out infinite alternate}.gp-tw2{animation:gp-tw 2.8s ease-in-out -1.4s infinite alternate}@keyframes gp-tw{from{opacity:.3}to{opacity:1}}' +
      '.gp-row{animation:gp-row 2.4s ease-in-out infinite alternate}@keyframes gp-row{from{opacity:.45}to{opacity:1}}' +
      '.gp-beam{animation:gp-beam 6s ease-in-out infinite alternate}@keyframes gp-beam{from{opacity:.75}to{opacity:1}}' +
      '.gp-blink{animation:gp-blink 2.4s ease-in-out infinite}@keyframes gp-blink{0%,100%{opacity:.25}50%{opacity:1}}' +
      // Telemetry traces: dashes crawl, and race when a tool runs.
      '.gp-tl{stroke-dasharray:.3 .12;animation:gp-tel 3.4s linear infinite}@keyframes gp-tel{to{stroke-dashoffset:-.42}}' +
      '.st-tool .gp-tl,.st-run .gp-tl{animation-duration:.5s}.st-web .gp-tl{animation-duration:1.2s}' +
      // The spin-out: a car turns and slides in smoke, a yellow light pulses slowly.
      '.gp-spin{opacity:0}.st-error .gp-spin{animation:gp-spin 3.6s ease-out infinite}' +
      '@keyframes gp-spin{0%{opacity:0;transform:translate(-50px,-16px) rotate(-30deg)}6%{opacity:1}60%{opacity:1;transform:translate(24px,12px) rotate(780deg)}92%{opacity:1;transform:translate(30px,14px) rotate(780deg)}100%{opacity:0;transform:translate(30px,14px) rotate(780deg)}}' +
      '.gp-sm{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .gp-sm{animation:gp-sm 3.6s ease-out infinite}' +
      '@keyframes gp-sm{0%,4%{opacity:0;transform:scale(.3)}16%{opacity:.28}70%,100%{opacity:0;transform:scale(3.2)}}' +
      '.gp-yel{opacity:0}.st-error .gp-yel{animation:gp-yel 1.8s ease-in-out infinite}@keyframes gp-yel{0%,100%{opacity:.08}50%{opacity:.34}}' +
      '.gp-lamp{opacity:.25}.st-error .gp-lamp{animation:gp-yel 1.8s ease-in-out infinite;--x:1}' +
      // Done: fireworks over the stand, spaced 1.2 s apart, and the chequered flag.
      '.gp-fw,.gp-fg{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-done .gp-fw{animation:gp-fw 3.6s ease-out infinite}@keyframes gp-fw{0%,2%{opacity:0;transform:scale(.2)}8%{opacity:.9}55%{opacity:.6;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.15)}}' +
      '.st-done .gp-fg{animation:gp-fg 3.6s ease-out infinite}@keyframes gp-fg{0%,2%{opacity:0}9%{opacity:.3}40%,100%{opacity:0}}' +
      '.gp-flag{opacity:0}.st-done .gp-flag{animation:gp-fi .8s ease-out .2s both}@keyframes gp-fi{to{opacity:1}}' +
      '.gp-wv{animation:gp-wv .7s ease-in-out infinite alternate}@keyframes gp-wv{from{transform:translateY(-5px)}to{transform:translateY(5px)}}' +
      // Web: the camera drone hovers.
      '.gp-drone{opacity:0}.st-web .gp-drone{animation:gp-fi .8s ease-out both}' +
      '.gp-hov{animation:gp-hov 2.6s ease-in-out infinite alternate}@keyframes gp-hov{from{transform:translateY(-8px)}to{transform:translateY(8px)}}' +
      '.gp-rot{transform-box:fill-box;transform-origin:center;animation:gp-rot .12s linear infinite alternate}@keyframes gp-rot{to{transform:scaleX(.6)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="gp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03040a"/><stop offset=".6" stop-color="#0a0e1e"/><stop offset="1" stop-color="#241a44"/></linearGradient>' +
      '<linearGradient id="gp-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1224"/><stop offset=".4" stop-color="#080b16"/><stop offset="1" stop-color="#05070e"/></linearGradient>' +
      '<linearGradient id="gp-tar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2132"/><stop offset="1" stop-color="#10141f"/></linearGradient>' +
      '<radialGradient id="gp-halo"><stop offset="0" stop-color="#fff0c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gp-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c8" stop-opacity=".16"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="gp-city"><stop offset="0" stop-color="#6a3fa8" stop-opacity=".4"/><stop offset="1" stop-color="#6a3fa8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gp-fwg"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gp-yg"><stop offset="0" stop-color="#ffd34d" stop-opacity=".7"/><stop offset="1" stop-color="#ffd34d" stop-opacity="0"/></radialGradient>' +
      '<pattern id="gp-mesh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="#9fb6d8" stroke-opacity=".5" stroke-width="1"/></pattern>' +
      '<linearGradient id="gp-fnc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1020" stop-opacity="0"/><stop offset="1" stop-color="#0b1020" stop-opacity=".8"/></linearGradient>' +
      ['gp-tc#5fd0ff', 'gp-tm#ff6fb1', 'gp-ta#ffc15a', 'gp-tg#7dffb0', 'gp-tw#ffffff']
        .map(s => `<linearGradient id="${s.slice(0, 5)}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${s.slice(5)}" stop-opacity="0"/><stop offset="1" stop-color="${s.slice(5)}" stop-opacity=".85"/></linearGradient>`)
        .join('') +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#gp-sky)"/><ellipse cx="800" cy="470" rx="900" ry="90" fill="url(#gp-city)"/>' +
      skyline +
      // Everything on the ground follows the desk down when the window is wide.
      '<g class="mv-b">' +
      '<rect y="470" width="1600" height="700" fill="url(#gp-gnd)"/>' +
      // The grandstand: stepped body, a roof with a lit underside, and the crowd as specks of light.
      '<path d="M560 520V440L600 412H1600V520Z" fill="#0b0f1c"/><path d="M560 440L600 412H1600V424H610Z" fill="#141b30"/><path d="M606 424H1600" stroke="#8fb4ff" stroke-opacity=".3" stroke-width="3"/>' +
      '<g stroke="#171f36" stroke-width="2"><path d="M575 450H1600M570 470H1600M566 490H1600M562 508H1600"/></g>' +
      `<path d="${dots(crowd[0]!, 2.6)}" fill="#ffe8c0" fill-opacity=".6"/><path class="gp-tw1" d="${dots(crowd[1]!, 2.6)}" fill="#8fd8ff"/><path class="gp-tw2" d="${dots(crowd[2]!, 2.6)}" fill="#ff9fd0"/>` +
      // Floodlights.
      `<g class="gp-beam">${pylon(520, 160, 476)}${pylon(1250, 150, 480)}</g>` +
      // Track, kerbs, centre line, the far fence and the near tyre wall.
      `<path d="${asphalt}" fill="url(#gp-tar)"/>${kerb}` +
      `<path d="${line(mid)}" fill="none" stroke="#e8f0ff" stroke-opacity=".22" stroke-width="3" stroke-dasharray="26 34"/>` +
      `<path d="${line(lower)}" fill="none" stroke="#2b3a5e" stroke-width="9" stroke-dasharray="16 6"/>` +
      `<path d="${fence}" fill="url(#gp-mesh)" fill-opacity=".5"/><path d="${fence}" fill="url(#gp-fnc)"/><path d="${line(fenceTop)}" fill="none" stroke="#a9bde0" stroke-opacity=".6" stroke-width="2"/><path d="${posts}" stroke="#05070d" stroke-width="3"/>` +
      // The footbridge over the track at the left, and its flag pole.
      '<g><path d="M140 445V368M205 514V434" stroke="#070910" stroke-width="9"/><path d="M128 358L218 428L218 446L128 376Z" fill="#0b0f1c" stroke="#2a3552" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M128 376L218 446" stroke="#8fd8ff" stroke-opacity=".7" stroke-width="3"/><path d="M134 372L214 438M134 360L214 424" stroke="#2a3552" stroke-width="1.6"/>' +
      '<path d="M146 382V402M170 402V422M194 422V442" stroke="#fff0c8" stroke-opacity=".8" stroke-width="3"/><circle cx="146" cy="404" r="14" fill="url(#gp-halo)"/><circle cx="194" cy="444" r="14" fill="url(#gp-halo)"/>' +
      '<path d="M172 400V232" stroke="#3a4868" stroke-width="5"/><circle cx="172" cy="230" r="4" fill="#cfe8ff" fill-opacity=".6"/></g>' +
      // The cars and the spin-out.
      cars +
      `<path class="gp-sl" d="${speed}" stroke="#cfe8ff" stroke-width="2" stroke-linecap="round"/>` +
      '<ellipse class="gp-yel" cx="470" cy="610" rx="190" ry="140" fill="url(#gp-yg)"/>' +
      '<g transform="translate(430 640)">' + smoke + '<g class="gp-spin"><g transform="scale(1.1)">' + car('#2a1240', '#ff6fb1', 'gp-tm').replace(/<rect class="gp-trail"[^>]*\/>/, '') + '</g></g></g>' +
      '<path d="M500 595V560" stroke="#070910" stroke-width="5"/><rect x="490" y="548" width="20" height="14" rx="2" fill="#2a2208"/><circle class="gp-lamp" cx="500" cy="555" r="5" fill="#ffd34d"/><circle class="gp-yel" cx="500" cy="555" r="40" fill="url(#gp-yg)"/>' +
      '</g>' +
      // The timing tower at the top right: lights only.
      '<g class="mv-r"><g class="mv-t"><rect x="1520" y="66" width="74" height="262" rx="4" fill="#070a14" stroke="#2a3552" stroke-width="2"/><path d="M1557 66V30" stroke="#2a3552" stroke-width="3"/><circle class="gp-blink" cx="1557" cy="28" r="4" fill="#ff6fb1"/>' +
      `${timing}<path d="M1534 328V440M1580 328V440" stroke="#070a14" stroke-width="6"/>` +
      // Fireworks over the stand, small and well apart.
      burst(1290, 240, '#ffd34d', 0) + burst(1420, 330, '#5fd0ff', -1.2) + burst(1170, 360, '#ff6fb1', -2.4) +
      // The camera drone, hovering over the track's straight.
      '<g class="gp-drone"><g transform="translate(1330 420) scale(1.7)"><g class="gp-hov"><path d="M0 8L-60 120L60 120Z" fill="url(#gp-cone)"/>' +
      `<path d="M-30 -2L30 -2M-30 -14L30 -14" stroke="#2b3447" stroke-width="3"/><rect x="-14" y="-14" width="28" height="14" rx="4" fill="#161d2e" stroke="#3a4868" stroke-width="1.6"/>${rotors}` +
      `<circle cx="0" cy="8" r="7" fill="#0a0e17" stroke="#3a4868" stroke-width="1.6"/><circle class="gp-blink" cx="0" cy="8" r="2.4" fill="${CYAN}"/></g></g></g>` +
      '</g></g>' +
      // The chequered flag, over the footbridge.
      `<g class="mv-b"><g class="gp-flag" transform="translate(174 232) scale(1.7)">${flag}</g></g>`,
    nook:
      // A pit-lane gantry overhead: its bar of lamps and a yellow caution beacon that pulses in an error.
      '<rect x="-60" y="-232" width="500" height="14" rx="3" fill="#0a0d16" stroke="#2a3552" stroke-width="1.6"/><path d="M410 -218V456" stroke="#080b14" stroke-width="12"/>' +
      `<path d="${dots(Array.from({ length: 16 }, (_, i) => [-40 + i * 28, -212] as [number, number]), 8)}" fill="#fff0c8" fill-opacity=".7"/>` +
      '<path d="M-60 -204L440 -204L440 -150L-60 -150Z" fill="url(#gp-cone)" fill-opacity=".7"/>' +
      '<rect x="380" y="-262" width="26" height="30" rx="4" fill="#161d2e" stroke="#3a4868" stroke-width="1.6"/><circle class="gp-lamp" cx="393" cy="-247" r="8" fill="#ffd34d"/><circle class="gp-yel" cx="393" cy="-247" r="60" fill="url(#gp-yg)"/>',
  }
}
