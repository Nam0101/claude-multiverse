import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Storm Chaser: Claude in the cab of a pickup, a radar laptop on the dash, parked on the night plains. A rotating
// supercell with a tornado fills the left of the sky. When a command runs the funnel grows and throws debris
// around it; an error brings hail and cracks the windshield; done ropes the tornado out and lets the stars through.
const RADAR = '#58e0a0'
const SEAT = '#1c2430'
const SEAT_EDGE = '#2f3b4c'
const DASH = '#10151d'
const DASH_EDGE = '#2a3544'
const SILHOUETTE = '#06080c'

// The funnel, in the picture: where it leaves the cloud and where it meets the ground.
const FN_TOP = 372
const FN_BOT = 652
const centerAt = (t: number): number => 340 - 34 * Math.pow(t, 1.4)
const halfAt = (t: number): number => 100 * Math.pow(1 - t, 0.9) + 7

function funnelPath(): string {
  const n = 16
  const left: string[] = []
  const right: string[] = []

  for (let i = 0; i <= n; i += 1) {
    const t = i / n
    const y = FN_TOP + t * (FN_BOT - FN_TOP)
    const wob = Math.sin(i * 1.7) * 2.2 * (1 - t)

    left.push(`${f(centerAt(t) - halfAt(t) + wob)} ${f(y)}`)
    right.push(`${f(centerAt(t) + halfAt(t) + wob)} ${f(y)}`)
  }

  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}

/** Curved bands across the funnel that slide side to side out of step: a spinning column. */
function funnelBands(): string {
  let out = ''

  for (let i = 0; i < 15; i += 1) {
    const t = (i + 0.6) / 16.4
    const y = FN_TOP + t * (FN_BOT - FN_TOP)
    const c = centerAt(t)
    const h = halfAt(t)
    const d = `M${f(c - h * 0.85)} ${f(y)}Q${f(c)} ${f(y + h * 0.3)} ${f(c + h * 0.85)} ${f(y)}`

    out += `<path class="sc-bd" style="--a:${f(h * 0.42)}px;animation-delay:${f(-i * 0.37)}s" d="${d}" fill="none" stroke="#a9bfd6" stroke-opacity=".3" stroke-width="${f(2 + (1 - t) * 3)}" stroke-linecap="round"/>`
    out += `<path class="sc-bd" style="--a:${f(h * 0.42)}px;animation-delay:${f(-i * 0.37 - 0.65)}s" d="${d}" fill="none" stroke="#04070b" stroke-opacity=".45" stroke-width="${f(3 + (1 - t) * 3)}" stroke-linecap="round" transform="translate(0 ${f(5 + (1 - t) * 4)})"/>`
  }

  return out
}

/** The rotating striations of the cloud base: broken rings and spiral arms in a squashed disc, turning slowly. */
function striations(next: () => number): string {
  const rings = [
    [60, 22], [108, 26], [164, 30], [226, 34], [296, 30], [366, 26],
  ] as const
  let out = ''

  for (const [r, w] of rings) {
    const c = 2 * Math.PI * r
    const dash = Array.from({ length: 6 }, () => f(c * (0.04 + next() * 0.13))).join(' ')

    out += `<circle r="${r}" fill="none" stroke="#1d2b40" stroke-opacity=".9" stroke-width="${w}" stroke-dasharray="${dash}"/>`
    out += `<circle r="${r + w * 0.35}" fill="none" stroke="#45607f" stroke-opacity=".55" stroke-width="3" stroke-dasharray="${Array.from({ length: 5 }, () => f(c * (0.02 + next() * 0.08))).join(' ')}"/>`
  }

  for (let k = 0; k < 4; k += 1) {
    const a0 = (k * Math.PI) / 2
    let d = ''

    for (let s = 0; s <= 12; s += 1) {
      const r = 40 + s * 30
      const a = a0 + s * 0.2

      d += `${s === 0 ? 'M' : 'L'}${f(r * Math.cos(a))} ${f(r * Math.sin(a))}`
    }

    out += `<path d="${d}" fill="none" stroke="#0a111b" stroke-opacity=".8" stroke-width="16" stroke-linecap="round"/>`
    out += `<path d="${d}" fill="none" stroke="#5a7898" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>`
  }

  return out
}

type Debris = { y: number; rx: number; ry: number; secs: number; ph: number; shape: 'cow' | 'board' | 'plank' | 'fence' | 'post' | 'roof' }

const DEBRIS: Debris[] = [
  { y: 440, rx: 150, ry: 26, secs: 2.8, ph: 0, shape: 'cow' },
  { y: 420, rx: 128, ry: 22, secs: 3.2, ph: 2.1, shape: 'board' },
  { y: 500, rx: 112, ry: 24, secs: 2.3, ph: 4.2, shape: 'fence' },
  { y: 548, rx: 92, ry: 20, secs: 2.6, ph: 1, shape: 'plank' },
  { y: 584, rx: 80, ry: 18, secs: 2, ph: 3.3, shape: 'roof' },
  { y: 616, rx: 66, ry: 14, secs: 2.2, ph: 5.5, shape: 'board' },
  { y: 470, rx: 138, ry: 24, secs: 3.5, ph: 5.1, shape: 'post' },
  { y: 526, rx: 104, ry: 22, secs: 3, ph: 2.7, shape: 'fence' },
]

function debrisShape(shape: Debris['shape']): string {
  const body = `fill="${SILHOUETTE}" stroke="#5b708a" stroke-opacity=".6" stroke-width="1.2"`

  switch (shape) {
    case 'cow':
      return (
        `<g transform="scale(1.2)"><g ${body}><rect x="-17" y="-8" width="34" height="15" rx="6"/><path d="M15 -7L27 -11L30 -3L18 2Z"/>` +
        '<path d="M24 -11L22 -17M28 -10L31 -16" fill="none" stroke-width="2"/></g>' +
        `<path d="M-13 6V20M-6 6V19M7 6V20M14 6V18M-17 -4Q-27 -4 -26 6" fill="none" stroke="${SILHOUETTE}" stroke-width="3" stroke-linecap="round"/></g>`
      )
    case 'board':
      return `<rect x="-17" y="-3" width="34" height="6" ${body}/><path d="M-6 -3V3M8 -3V3" stroke="#5b708a" stroke-opacity=".5"/>`
    case 'plank':
      return `<rect x="-22" y="-2.5" width="44" height="5" ${body}/>`
    case 'fence':
      return `<g ${body}><rect x="-26" y="-9" width="4" height="22"/><rect x="22" y="-9" width="4" height="22"/><rect x="-26" y="-5" width="52" height="3"/><rect x="-26" y="3" width="52" height="3"/></g>`
    case 'post':
      return `<rect x="-3" y="-15" width="6" height="30" ${body}/>`
    case 'roof':
      return `<path d="M-22 8L0 -10L22 8L10 8L0 -2L-10 8Z" ${body}/>`
  }
}

function orbitKeys(name: string, rx: number, ry: number, ph: number): string {
  const steps = 12
  const frames = Array.from({ length: steps + 1 }, (_, k) => {
    const a = (k / steps) * Math.PI * 2 + ph

    return `${f((k / steps) * 100)}%{transform:translate(${f(rx * Math.cos(a))}px,${f(ry * Math.sin(a))}px) scale(${f(1 + 0.28 * Math.sin(a))})}`
  }).join('')

  return `@keyframes ${name}{${frames}}`
}

/** A pole with its crossarm and insulators, and the three wires that sag to the next one. */
function pole(x: number, top: number, base: number, arm: number): string {
  const s = arm / 70

  return (
    `<path d="M${x - 3 * s} ${base}L${x - 2 * s} ${top}H${x + 2 * s}L${x + 3 * s} ${base}Z" fill="#05070a" stroke="#27374c" stroke-opacity=".6" stroke-width="1.4"/>` +
    `<rect x="${f(x - arm)}" y="${f(top + 14 * s)}" width="${f(arm * 2)}" height="${f(5 * s)}" fill="#05070a" stroke="#27374c" stroke-opacity=".6"/>` +
    `<path d="M${f(x - arm * 0.7)} ${f(top + 14 * s)}V${f(top + 6 * s)}M${f(x)} ${f(top)}V${f(top - 6 * s)}M${f(x + arm * 0.7)} ${f(top + 14 * s)}V${f(top + 6 * s)}" stroke="#2f4259" stroke-width="${f(2.4 * s)}"/>`
  )
}

function wires(x1: number, top1: number, arm1: number, x2: number, top2: number, arm2: number): string {
  const s1 = arm1 / 70
  const s2 = arm2 / 70
  const mid = (x1 + x2) / 2
  const sag = (x2 - x1) * 0.05
  const a = (dx1: number, dy1: number, dx2: number, dy2: number): string => {
    const ya = top1 + dy1 * s1
    const yb = top2 + dy2 * s2

    return `M${f(x1 + dx1 * arm1)} ${f(ya)}Q${f(mid + dx1 * arm1 * 0.5 + dx2 * arm2 * 0.5)} ${f((ya + yb) / 2 + sag)} ${f(x2 + dx2 * arm2)} ${f(yb)}`
  }

  return `<path d="${a(-0.7, 6, -0.7, 6)}${a(0, -6, 0, -6)}${a(0.7, 6, 0.7, 6)}" fill="none" stroke="#2a3b52" stroke-opacity=".85" stroke-width="1.6"/>`
}

/** Dots as one path of tiny squares. */
function dots(points: [number, number][], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** The rugged laptop and its radar. Self-contained: no gradients, since the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${254 + i * 14}" y="325" width="9" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const wedge = (a0: number, a1: number, opacity: number): string => {
    const p = (a: number) => `${f(36 * Math.cos((a * Math.PI) / 180))} ${f(36 * Math.sin((a * Math.PI) / 180))}`

    return `<path d="M0 0L${p(a0)}A36 36 0 0 0 ${p(a1)}Z" fill="${light}" fill-opacity="${opacity}"/>`
  }
  const blips = activity === 'error' ? '' : '<g class="sc-bl"><circle cx="-8" cy="-14" r="5" fill="#ffd34d" fill-opacity=".8"/><circle cx="-12" cy="-10" r="3.2" fill="#ff5d4a" fill-opacity=".85"/><circle cx="12" cy="9" r="4" fill="#58e0a0" fill-opacity=".7"/><circle cx="-16" cy="-16" r="2" fill="#ff5d4a" fill-opacity=".9"/></g>'

  return (
    // The case with its orange corner bumpers and carry handle.
    '<rect x="244" y="322" width="150" height="9" rx="2" fill="#262d38"/>' +
    keys +
    '<path d="M300 326L318 230L404 234L396 326Z" fill="#232a35" stroke="#3a4656" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M300 326L304 306M396 326L399 306M318 230L322 246M404 234L401 250" stroke="#d98a2a" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M330 224Q360 212 392 227" fill="none" stroke="#3a4656" stroke-width="4" stroke-linecap="round"/>' +
    `<path d="M316 318L328 244L394 247L388 318Z" fill="#05110d"/><path d="M316 318L328 244L394 247L388 318Z" fill="${light}" fill-opacity=".1"/>` +
    // The radar.
    '<g transform="translate(358 284)">' +
    `<g fill="none" stroke="${light}" stroke-opacity=".5" stroke-width="1.4"><circle r="36"/><circle r="24"/><circle r="12"/><path d="M-36 0H36M0 -36V36"/></g>` +
    `<g class="sc-sweep">${wedge(-30, -14, 0.14)}${wedge(-14, 0, 0.22)}${wedge(0, 10, 0.42)}<path d="M0 0H36" stroke="${light}" stroke-width="2"/></g>` +
    blips +
    '</g>' +
    `<path d="M322 306H382" stroke="${light}" stroke-opacity=".35" stroke-width="2"/>` +
    // The GPS puck with its blinking dot, and a phone-sized notepad on the dash.
    '<rect x="408" y="320" width="26" height="10" rx="4" fill="#232a35"/><circle class="sc-led" cx="421" cy="325" r="2.2" fill="#ffd34d"/>' +
    '<rect x="440" y="318" width="22" height="12" rx="2" fill="#d6dbe0" fill-opacity=".85"/><path d="M444 322H458M444 326H454" stroke="#6b7a8c" stroke-width="1.4"/>'
  )
}

export function stormChaserWorld(): World {
  const next = random(11)

  // The cloud tower over the left: two layers of ellipses, a lit rim under a dark body.
  const tower = (() => {
    let rim = ''
    let body = ''

    for (let i = 0; i < 18; i += 1) {
      const u = i / 17
      const cx = -60 + u * 780 + (next() - 0.5) * 60
      const dome = Math.sin(Math.PI * Math.min(1, Math.max(0, (cx + 60) / 800)))
      const cy = 300 - dome * (150 + next() * 90)
      const rx = 70 + next() * 80
      const ry = 44 + next() * 46

      rim += `<ellipse cx="${f(cx - 5)}" cy="${f(cy - 8)}" rx="${f(rx + 4)}" ry="${f(ry + 4)}" fill="#26384f"/>`
      body += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${i % 3 === 0 ? '#0c131d' : i % 3 === 1 ? '#090f18' : '#0e1622'}"/>`
    }

    return rim + body
  })()
  const farClouds = Array.from({ length: 8 }, (_, i) => `<ellipse cx="${f(860 + i * 110 + next() * 40)}" cy="${f(70 + next() * 200)}" rx="${f(110 + next() * 80)}" ry="${f(40 + next() * 40)}" fill="${i % 2 ? '#0a111b' : '#0d1522'}"/>`).join('')
  const starA: [number, number][] = []
  const starB: [number, number][] = []

  for (let i = 0; i < 52; i += 1) {
    const p: [number, number] = [next() * 1600, 8 + next() * 430]

    ;(i % 2 === 0 ? starA : starB).push(p)
  }

  // The wheat: three rows of stalks, each swaying as one around the foot of the picture.
  const wheat = (y0: number, y1: number, count: number, height: number, color: string, opacity: number, cls: string): string => {
    let d = ''

    for (let i = 0; i < count; i += 1) {
      const x = -40 + next() * 1700
      const y = y0 + next() * (y1 - y0)
      const lean = (next() - 0.5) * 4

      d += `M${f(x)} ${f(y)}l${f(lean)} ${f(-height)}`
    }

    return `<path class="sc-wh ${cls}" d="${d}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${f(height / 7)}" stroke-linecap="round"/>`
  }
  const furrows = Array.from({ length: 22 }, (_, i) => `M790 646L${f(-1100 + i * 190)} 1010`).join('')
  const town = Array.from({ length: 14 }, () => [900 + next() * 340, 648 + next() * 8] as [number, number])
  const debris = DEBRIS.map((d, i) => {
    const t = (d.y - FN_TOP) / (FN_BOT - FN_TOP)

    return `<g transform="translate(${f(centerAt(t))} ${d.y})"><g class="sc-orb sc-o${i}"><g class="sc-sp" style="--s:${f(d.secs * 0.7)}s"><g transform="scale(1.6)">${debrisShape(d.shape)}</g></g></g></g>`
  }).join('')
  const orbitCss = DEBRIS.map((d, i) => orbitKeys(`sc-o${i}`, d.rx, d.ry, d.ph) + `.st-run .sc-o${i}{animation:sc-o${i} ${d.secs}s linear infinite}`).join('')

  // The windmill wheel's blades.
  const blades = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const p = (r: number, off: number) => `${f(r * Math.cos(a) - off * Math.sin(a))} ${f(r * Math.sin(a) + off * Math.cos(a))}`

    return `M${p(10, -1.5)}L${p(52, -4.5)}L${p(52, 4.5)}L${p(10, 1.5)}Z`
  }).join('')
  const lattice = 'M1306 652L1326 520M1354 652L1334 520M1308 640H1352M1312 616H1348M1316 592H1344M1320 568H1340M1306 652L1348 616M1354 652L1312 616M1312 616L1344 568M1348 616L1316 568M1316 568L1340 540M1344 568L1320 540'
  const crackAt: [number, number] = [320, -70]
  const cracks = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 + next() * 22) * Math.PI) / 180
    const len = 90 + next() * 90
    const p = (k: number, j: number) => `${f(crackAt[0] + Math.cos(a + j) * len * k)} ${f(crackAt[1] + Math.sin(a + j) * len * k)}`

    return `<path class="sc-ck" pathLength="1" style="--d:${f(0.25 + (i % 5) * 0.05)}s" d="M${crackAt[0]} ${crackAt[1]}L${p(0.35, 0.05)}L${p(0.62, -0.08)}L${p(1, 0.04)}M${p(0.62, -0.08)}L${p(0.85, 0.34)}" fill="none" stroke="#dcecff" stroke-opacity=".85" stroke-width="1.8" stroke-linejoin="round"/>`
  }).join('')
  const ringPts = (r: number): string => Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 + 8) * Math.PI) / 180

    return `${f(crackAt[0] + Math.cos(a) * r * (0.9 + (i % 3) * 0.1))} ${f(crackAt[1] + Math.sin(a) * r * (0.9 + (i % 3) * 0.1))}`
  }).join('L')
  const drops = Array.from({ length: 16 }, () => `<ellipse cx="${f(60 + next() * 340)}" cy="${f(-180 + next() * 360)}" rx="${f(1.4 + next() * 1.6)}" ry="${f(2 + next() * 3)}" fill="#bcd6f0" fill-opacity="${f(0.18 + next() * 0.2)}"/>`).join('')
  const stones = Array.from({ length: 10 }, (_, i) => `<circle class="sc-stone" cx="${f(250 + i * 21 + (i % 3) * 5)}" cy="326" r="${f(2.6 + (i % 3))}" fill="#eaf4ff" style="animation-delay:${f(-i * 0.23)}s"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#04070b',
      furniture: SEAT,
      metal: '#262d38',
      paper: '#d6dbe0',
      light: { idle: '#3a8f6a', work: RADAR, bright: '#c8ffe0' },
      headTop: 218,
      glowAt: [358, 284],
      device,
      wear: {
        // A mesh-back cap: crown, a pale front panel with a funnel patch, the bill over the laptop side. The
        // crown ends at y 250, above the eyes.
        front:
          '<path d="M62 250C62 224 100 204 150 204C200 204 238 224 238 250Z" fill="#222c3a" stroke="#364559" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M150 204C200 204 238 224 238 250H172C176 232 166 214 150 204Z" fill="#2c394b"/>' +
          '<path d="M122 232L168 232L152 246L142 246Z" fill="#e9eef3" fill-opacity=".85"/><path d="M134 240L156 240" stroke="#222c3a" stroke-width="2"/>' +
          '<path d="M104 214C122 208 140 206 150 206" fill="none" stroke="#4a5d78" stroke-width="2" stroke-dasharray="4 5"/>' +
          '<circle cx="150" cy="204" r="4" fill="#d98a2a"/>' +
          '<path d="M64 246H236V253H64Z" fill="#141b25"/>' +
          '<path d="M214 246L262 250L264 258L212 254Z" fill="#141b25" stroke="#364559" stroke-width="1.5" stroke-linejoin="round"/>',
      },
      seatArt:
        // The truck's bench seat: a tall back with a headrest, the cushion under the critter.
        `<path d="M56 236C56 224 64 220 74 220H226C236 220 244 224 244 236V352H56Z" fill="${SEAT}" stroke="${SEAT_EDGE}" stroke-width="2"/>` +
        `<path d="M108 218V196C108 186 116 182 126 182H174C184 182 192 186 192 196V218Z" fill="${SEAT}" stroke="${SEAT_EDGE}" stroke-width="2"/>` +
        `<path d="M72 232V350M228 232V350M150 232V350" stroke="${SEAT_EDGE}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 5"/>` +
        `<path d="M60 350H240C244 356 244 372 238 380H62C56 372 56 356 60 350Z" fill="#232e3e" stroke="${SEAT_EDGE}" stroke-width="2"/>` +
        `<path d="M70 380H230V420H70Z" fill="#0d121a"/><path d="M80 420V456M220 420V456" stroke="#0d121a" stroke-width="8"/>` +
        '<path d="M60 236L236 340" stroke="#0a0f16" stroke-opacity=".0"/>',
      tableArt:
        // The dashboard: top pad, vent slits, a gauge cluster that glows a little, the glove box, a CB radio.
        `<path d="M166 346V332C166 330 168 329 170 329H466C469 329 470 331 470 333V346Z" fill="${DASH}" stroke="${DASH_EDGE}" stroke-width="2"/>` +
        `<rect x="170" y="344" width="296" height="112" fill="#0b0f15" stroke="${DASH_EDGE}" stroke-width="1.6"/>` +
        `<g stroke="${DASH_EDGE}" stroke-width="3" stroke-linecap="round"><path d="M184 360H226M184 370H226M184 380H226"/></g>` +
        `<rect x="246" y="356" width="104" height="52" rx="6" fill="#06090d" stroke="${DASH_EDGE}"/>` +
        '<circle cx="274" cy="382" r="16" fill="#0b1510" stroke="#34514a" stroke-width="2"/><circle cx="324" cy="382" r="16" fill="#0b1510" stroke="#34514a" stroke-width="2"/>' +
        `<path d="M274 382L266 372M324 382L334 374" stroke="${RADAR}" stroke-opacity=".7" stroke-width="2"/>` +
        '<path d="M362 360H452V398H362Z" fill="#121922" stroke="#2a3544"/><rect x="372" y="370" width="30" height="8" fill="#3a8f6a" fill-opacity=".5"/><circle cx="424" cy="374" r="6" fill="#1d2632" stroke="#3b4a5e"/><circle cx="440" cy="374" r="3" fill="#ffd34d" fill-opacity=".7"/>' +
        '<path d="M184 412H452V440H184Z" fill="#0e131a" stroke="#222c3a"/><rect x="310" y="422" width="34" height="5" rx="2" fill="#2a3544"/>',
    },
    style:
      orbitCss +
      // The cloud: striations turn, the funnel sways and its bands slide.
      '.sc-rot{animation:sc-rot 70s linear infinite}@keyframes sc-rot{to{transform:rotate(360deg)}}' +
      '.st-run .sc-rot{animation-duration:22s}.st-thinking .sc-rot{animation-duration:110s}.st-done .sc-rot{animation-duration:150s}' +
      '.sc-fn{transform-origin:340px 372px}.sc-sway{transform-origin:340px 372px;animation:sc-sway 7s ease-in-out infinite alternate}' +
      '@keyframes sc-sway{from{transform:rotate(-2.4deg)}to{transform:rotate(2.8deg)}}' +
      '.sc-bd{animation:sc-bd 1.3s ease-in-out infinite alternate}@keyframes sc-bd{from{transform:translateX(calc(var(--a) * -1))}to{transform:translateX(var(--a))}}' +
      '.st-run .sc-bd{animation-duration:.55s}' +
      '.st-run .sc-fn{animation:sc-grow 2.4s ease-out both}@keyframes sc-grow{to{transform:scale(1.4,1.02)}}' +
      '.st-done .sc-fn{animation:sc-rope 4.2s ease-in-out both}' +
      '@keyframes sc-rope{0%{transform:scale(1,1);opacity:1}60%{transform:scale(.4,.92) skewX(8deg);opacity:.9}100%{transform:scale(.16,.84) skewX(26deg) translateX(40px);opacity:.38}}' +
      '.st-done .sc-sway{animation-duration:2.2s}' +
      // Dust at the foot, the rain curtain, the debris.
      '.sc-dst{transform-box:fill-box;transform-origin:50% 50%;animation:sc-dst 3.2s ease-in-out infinite alternate}@keyframes sc-dst{from{transform:scaleX(.92)}to{transform:scaleX(1.1)}}' +
      '.st-run .sc-dst{animation:sc-dstrun 2.4s ease-out both}@keyframes sc-dstrun{to{transform:scale(1.5,1.5)}}' +
      '.st-done .sc-dst{animation:sc-fade 4s ease-out both}@keyframes sc-fade{to{opacity:.12}}' +
      '.sc-deb{opacity:0}.st-run .sc-deb{animation:sc-fi 1s ease-out both}@keyframes sc-fi{to{opacity:1}}' +
      '.sc-sp{transform-box:fill-box;transform-origin:center;animation:mv-spin var(--s,2s) linear infinite}' +
      '.sc-cur{animation:sc-cur 9s ease-in-out infinite alternate}@keyframes sc-cur{from{transform:translateX(-14px)}to{transform:translateX(18px)}}' +
      // Lightning: soft glows in the clouds, 4 s apart, each rising over about a third of a second.
      '.sc-lt{opacity:0;animation:sc-lt 8s ease-in-out infinite}.sc-lt2{animation-delay:-4s}.sc-lt3{animation-delay:-2s}' +
      '@keyframes sc-lt{0%,88%{opacity:0}92%{opacity:.3}97%{opacity:.08}100%{opacity:0}}' +
      '.st-done .sc-lt{display:none}' +
      '.sc-sup{transition:none}.st-done .sc-sup{animation:sc-clear 4s ease-out both}@keyframes sc-clear{to{opacity:.3}}' +
      '.sc-stars{opacity:0}.st-done .sc-stars{animation:sc-fi 3s ease-out .5s both}' +
      '.sc-tw1{animation:sc-tw 3.4s ease-in-out infinite alternate}.sc-tw2{animation:sc-tw 2.6s ease-in-out -1.3s infinite alternate}@keyframes sc-tw{from{opacity:.35}to{opacity:1}}' +
      '.sc-clear{opacity:0}.st-done .sc-clear{animation:sc-fi 4s ease-out 1s both}' +
      // The field and the wind.
      '.sc-wh{transform-origin:0 1000px;animation:sc-wh 3.6s ease-in-out infinite alternate}.sc-w2{animation-duration:4.4s;animation-delay:-1.2s}.sc-w3{animation-duration:5.2s;animation-delay:-2.6s}' +
      '@keyframes sc-wh{from{transform:skewX(-1.2deg)}to{transform:skewX(1.5deg)}}' +
      '.st-responding .sc-wh{animation-duration:1.6s}.st-read .sc-wh,.st-thinking .sc-wh{animation-duration:7s}' +
      '.sc-gust{opacity:0}.st-responding .sc-gust{animation:sc-gust 3.6s ease-in-out infinite}@keyframes sc-gust{0%{opacity:0;transform:translateX(-500px)}30%,70%{opacity:.16}100%{opacity:0;transform:translateX(1500px)}}' +
      '.sc-wheel{animation:sc-rot 8s linear infinite}.st-responding .sc-wheel,.st-run .sc-wheel{animation-duration:2.2s}.st-thinking .sc-wheel,.st-read .sc-wheel{animation-duration:20s}.st-done .sc-wheel{animation-duration:30s}' +
      '.sc-win{animation:sc-win 3.4s ease-in-out infinite alternate}@keyframes sc-win{from{opacity:.65}to{opacity:1}}' +
      // The radar.
      '.sc-sweep{animation:sc-rot 3.2s linear infinite}.st-web .sc-sweep{animation-duration:.9s}.st-read .sc-sweep,.st-idle .sc-sweep{animation-duration:4.4s}.st-run .sc-sweep{animation-duration:1.8s}' +
      '.sc-bl{animation:sc-bl 3.2s ease-in-out infinite}@keyframes sc-bl{0%,100%{opacity:.55}50%{opacity:1}}' +
      '.sc-led{animation:sc-led 1.6s steps(1) infinite}@keyframes sc-led{0%{opacity:1}50%{opacity:.15}}' +
      // The wipers, parked below the dash until a tool is in use.
      '.sc-wp{transform:rotate(-84deg)}.st-tool .sc-wp{animation:sc-wipe 1.2s ease-in-out infinite alternate}' +
      '@keyframes sc-wipe{from{transform:rotate(-84deg)}to{transform:rotate(70deg)}}' +
      '.sc-wp2{animation-delay:-.05s}' +
      '.sc-charm{animation:sc-charm 3.6s ease-in-out infinite alternate}@keyframes sc-charm{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.st-error .sc-charm{animation-duration:.5s}' +
      // The weather balloon.
      '.sc-bal{opacity:0}.st-web .sc-bal{animation:sc-bal 7s linear infinite}' +
      '@keyframes sc-bal{0%{opacity:0;transform:translate(0,0) scale(1)}6%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translate(-80px,-840px) scale(.55)}}' +
      '.sc-ping{opacity:0}.st-web .sc-ping{animation:sc-ping 1.1s ease-out infinite}@keyframes sc-ping{0%{opacity:.5;transform:scale(.2)}100%{opacity:0;transform:scale(1)}}' +
      '.sc-ping{transform-box:fill-box;transform-origin:center}' +
      // Hail, and the crack that spreads over the glass.
      '.sc-hail{opacity:0}.st-error .sc-hail{opacity:1}' +
      '.sc-stone{opacity:0}.st-error .sc-stone{animation:sc-stone .7s ease-in infinite}' +
      '@keyframes sc-stone{0%{opacity:0;transform:translateY(-130px)}12%{opacity:1}55%{opacity:1;transform:translateY(0)}72%{transform:translateY(-22px)}88%{transform:translateY(0);opacity:.8}100%{opacity:0;transform:translateY(0)}}' +
      '.sc-ck{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .sc-ck{animation:sc-ck .7s ease-out var(--d,.3s) both}' +
      '@keyframes sc-ck{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.sc-chip{opacity:0}.st-error .sc-chip{animation:sc-chip .5s ease-out .2s both}@keyframes sc-chip{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}' +
      '.sc-chip{transform-box:fill-box;transform-origin:center}' +
      '.sc-cloudg{animation:sc-drift 50s ease-in-out infinite alternate}@keyframes sc-drift{to{transform:translateX(30px)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060b"/><stop offset=".5" stop-color="#09111e"/><stop offset=".82" stop-color="#14282b"/><stop offset="1" stop-color="#21443b"/></linearGradient>' +
      '<linearGradient id="sc-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14130a"/><stop offset=".3" stop-color="#0d0d07"/><stop offset="1" stop-color="#070704"/></linearGradient>' +
      '<linearGradient id="sc-fnl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a2330"/><stop offset=".42" stop-color="#4a5d74"/><stop offset=".7" stop-color="#2c3a4c"/><stop offset="1" stop-color="#151d28"/></linearGradient>' +
      '<linearGradient id="sc-fnv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05080d" stop-opacity=".7"/><stop offset=".25" stop-color="#05080d" stop-opacity="0"/><stop offset="1" stop-color="#05080d" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="sc-disc"><stop offset="0" stop-color="#04070c"/><stop offset=".6" stop-color="#0c1522"/><stop offset="1" stop-color="#0d1624" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-lg"><stop offset="0" stop-color="#c8d8ff" stop-opacity=".5"/><stop offset="1" stop-color="#c8d8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-dustg"><stop offset="0" stop-color="#8a7d62" stop-opacity=".55"/><stop offset=".6" stop-color="#5a5240" stop-opacity=".25"/><stop offset="1" stop-color="#5a5240" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-hz"><stop offset="0" stop-color="#4fae8a" stop-opacity=".32"/><stop offset="1" stop-color="#4fae8a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-win"><stop offset="0" stop-color="#ffc766" stop-opacity=".5"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-balg"><stop offset="0" stop-color="#dff0ff" stop-opacity=".35"/><stop offset="1" stop-color="#dff0ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sc-clr"><stop offset="0" stop-color="#2a5a6a" stop-opacity=".5"/><stop offset="1" stop-color="#2a5a6a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="sc-curt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f94ac" stop-opacity=".26"/><stop offset="1" stop-color="#7f94ac" stop-opacity=".02"/></linearGradient>' +
      '<linearGradient id="sc-gst" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a7a3a" stop-opacity="0"/><stop offset=".5" stop-color="#8a7a3a" stop-opacity=".8"/><stop offset="1" stop-color="#8a7a3a" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="720" fill="url(#sc-sky)"/>' +
      `<g class="sc-stars"><path class="sc-tw1" d="${dots(starA, 3.2)}" fill="#dce8ff"/><path class="sc-tw2" d="${dots(starB, 2.6)}" fill="#c8dcff"/></g>` +
      '<ellipse class="sc-clear" cx="760" cy="300" rx="900" ry="420" fill="url(#sc-clr)"/>' +
      '<ellipse cx="320" cy="650" rx="620" ry="90" fill="url(#sc-hz)"/>' +
      // Far storm clouds on the right, and the supercell on the left.
      `<g class="sc-cloudg sc-sup">${farClouds}</g>` +
      '<g class="sc-sup">' +
      `<ellipse cx="420" cy="60" rx="760" ry="64" fill="#080d16"/>${tower}` +
      '<g class="sc-lt"><circle cx="210" cy="190" r="250" fill="url(#sc-lg)"/><path d="M236 110l-14 54l18 5l-24 64l14 5l-18 40" fill="none" stroke="#e8f0ff" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"/></g>' +
      '<g class="sc-lt sc-lt2"><circle cx="560" cy="150" r="220" fill="url(#sc-lg)"/></g>' +
      '<g class="sc-lt sc-lt3"><circle cx="1280" cy="130" r="230" fill="url(#sc-lg)"/><path d="M1300 40l-12 50l15 5l-18 56l12 4" fill="none" stroke="#e8f0ff" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round"/></g>' +
      '<g transform="translate(340 356) scale(1 .28)"><circle r="420" fill="url(#sc-disc)"/>' +
      `<g class="sc-rot">${striations(next)}</g></g></g>` +
      // The rain curtain beside the funnel.
      '<path d="M440 396L640 396L720 650L350 650Z" fill="url(#sc-curt)" fill-opacity=".6"/>' +
      '<g stroke="#9db4cc" stroke-opacity=".12" stroke-width="2"><path d="M470 400L420 650M530 400L492 650M600 400L578 650M680 400L664 650"/></g>' +
      // The tornado.
      `<g class="sc-fn"><g class="sc-sway"><path d="${funnelPath()}" fill="url(#sc-fnl)"/>${funnelBands()}</g></g>` +
      '<ellipse class="sc-dst" cx="312" cy="650" rx="150" ry="34" fill="url(#sc-dustg)"/>' +
      // The ground: plains, a far town, the field and its furrows.
      '<rect y="648" width="1600" height="400" fill="url(#sc-gnd)"/>' +
      `<path d="${dots(town, 2.6)}" fill="#ffd27a" fill-opacity=".7"/>` +
      `<path d="${furrows}" stroke="#2c2a14" stroke-opacity=".55" stroke-width="2"/>` +
      '<rect class="sc-gust" y="700" width="900" height="240" fill="url(#sc-gst)"/>' +
      wheat(660, 760, 70, 14, '#6d5a26', 0.5, 'sc-w1') +
      wheat(760, 860, 60, 24, '#7d6830', 0.55, 'sc-w2') +
      wheat(860, 1000, 46, 40, '#8f7835', 0.55, 'sc-w3') +
      // A fence along the field edge.
      `<path d="M0 676H640M0 690H640" stroke="#201d10" stroke-width="2"/><path d="${Array.from({ length: 14 }, (_, i) => `M${10 + i * 46} 664V700`).join('')}" stroke="#14120a" stroke-width="5"/>` +
      // The poles and the wires between them.
      pole(70, 150, 720, 70) + pole(440, 326, 690, 40) + pole(700, 418, 668, 28) + pole(900, 470, 660, 20) + pole(1060, 508, 656, 14) +
      wires(70, 150, 70, 440, 326, 40) + wires(440, 326, 40, 700, 418, 28) + wires(700, 418, 28, 900, 470, 20) + wires(900, 470, 20, 1060, 508, 14) +
      // Debris, thrown around the funnel while a command runs.
      `<g class="sc-deb">${debris}</g>` +
      // The farm, far right behind the windshield: the windmill, the house and barn with lit windows.
      '<g class="mv-r">' +
      '<ellipse cx="1450" cy="640" rx="260" ry="50" fill="url(#sc-hz)"/>' +
      `<path d="${lattice}" fill="none" stroke="#04060a" stroke-width="3"/><path d="M1306 652L1326 520H1334L1354 652Z" fill="#04060a" fill-opacity=".6" stroke="#04060a" stroke-width="3" stroke-linejoin="round"/>` +
      '<g transform="translate(1330 508)"><path d="M0 0H70L80 -10V10L70 0Z" fill="#04060a" stroke="#04060a" stroke-width="2"/><g class="sc-wheel"><path d="' + blades + '" fill="#04060a" stroke="#2a3b50" stroke-opacity=".7" stroke-width="1.2"/><circle r="54" fill="none" stroke="#04060a" stroke-width="2.4"/><circle r="5" fill="#2a3b50"/></g></g>' +
      '<g fill="#05070b" stroke="#2a3b50" stroke-opacity=".5" stroke-width="1.5" stroke-linejoin="round"><path d="M1410 650V614L1458 584L1506 614V650Z"/><path d="M1486 650V604L1520 570L1558 604V650Z"/><rect x="1566" y="590" width="26" height="62"/><path d="M1564 590Q1579 574 1594 590Z"/><rect x="1428" y="574" width="9" height="22"/></g>' +
      '<g class="sc-win"><circle cx="1430" cy="630" r="22" fill="url(#sc-win)"/><circle cx="1480" cy="630" r="22" fill="url(#sc-win)"/><circle cx="1524" cy="618" r="18" fill="url(#sc-win)"/><rect x="1424" y="624" width="11" height="12" fill="#ffc766"/><rect x="1474" y="624" width="11" height="12" fill="#ffc766"/><rect x="1519" y="612" width="10" height="11" fill="#ffc766" fill-opacity=".8"/></g>' +
      '<path d="M1190 652H1600" stroke="#04060a" stroke-width="3"/><path d="' + Array.from({ length: 12 }, (_, i) => `M${1200 + i * 34} 640V656`).join('') + '" stroke="#04060a" stroke-width="3"/>' +
      '</g>' +
      // The hail: steep white streaks.
      `<g class="sc-hail">${rain({ seed: 21, count: 30, length: [34, 60], slant: 120, seconds: 0.45, stroke: '#f2f8ff', opacity: 0.8 })}</g>` +
      // The weather balloon, climbing out of the field at the left.
      '<g class="sc-bal"><g transform="translate(190 720)"><circle r="46" fill="url(#sc-balg)"/>' +
      '<ellipse cy="-34" rx="19" ry="25" fill="#cfdde8" fill-opacity=".85"/><path d="M-4 -52Q0 -58 4 -52" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M0 -9V24" stroke="#cfdde8" stroke-opacity=".6" stroke-width="1.4"/><rect x="-6" y="24" width="12" height="9" fill="#e8e0cc" fill-opacity=".85"/><circle class="sc-led" cx="0" cy="38" r="2.4" fill="#ffd34d"/></g></g>',
    nook:
      '<defs><linearGradient id="sc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ec3e8" stop-opacity=".08"/><stop offset=".5" stop-color="#9ec3e8" stop-opacity=".02"/><stop offset="1" stop-color="#9ec3e8" stop-opacity=".05"/></linearGradient></defs>' +
      // The cab frame around the glass: roof, A-pillar, and a mirror with a charm hanging from it.
      '<path d="M24 -250H440V340H-40Z M60 -204L384 -204Q412 -204 424 -170V332H-8Z" fill="#05070a" fill-opacity=".95" fill-rule="evenodd"/>' +
      '<path d="M60 -204L384 -204Q412 -204 424 -170V332H-8Z" fill="url(#sc-glass)"/>' +
      '<path d="M60 -204L-8 332" stroke="#26313f" stroke-width="3" fill="none"/><path d="M60 -204L384 -204" stroke="#26313f" stroke-width="3"/>' +
      '<path d="M170 -204V-246L214 -250V-204Z" fill="#0a0e14" stroke="#26313f" stroke-width="2"/><path d="M190 -230H212" stroke="#58e0a0" stroke-opacity=".3" stroke-width="2"/>' +
      '<path d="M120 -170L190 -170L120 80Z M230 -170L262 -170L170 90L140 90Z" fill="#fff" fill-opacity=".03"/>' +
      `<g>${drops}</g>` +
      `<g transform="translate(200 -204)"><g class="sc-charm"><path d="M0 0V26" stroke="#3a4656" stroke-width="2"/><path d="M-9 26H9L2 56H-2Z" fill="#3a4656" stroke="#58e0a0" stroke-opacity=".5"/></g></g>` +
      // The wipers.
      '<g fill="none" stroke="#0c1117" stroke-linecap="round">' +
      '<g transform="translate(130 340)"><g class="sc-wp"><path d="M0 0V-214" stroke-width="4"/><path d="M0 -40V-206" stroke="#1b2531" stroke-width="7"/></g></g>' +
      '<g transform="translate(330 340)"><g class="sc-wp sc-wp2"><path d="M0 0V-214" stroke-width="4"/><path d="M0 -40V-206" stroke="#1b2531" stroke-width="7"/></g></g></g>' +
      // The cracks.
      `<g>${cracks}<path class="sc-ck" pathLength="1" style="--d:.7s" d="M${ringPts(44)}Z" fill="none" stroke="#dcecff" stroke-opacity=".6" stroke-width="1.4"/><path class="sc-ck" pathLength="1" style="--d:.85s" d="M${ringPts(96)}Z" fill="none" stroke="#dcecff" stroke-opacity=".45" stroke-width="1.2"/></g>` +
      `<g transform="translate(${crackAt[0]} ${crackAt[1]})"><path class="sc-chip" d="M0 -9L4 -3L10 0L4 3L0 9L-4 3L-10 0L-4 -3Z" fill="#eaf4ff"/></g>`,
    front: `<g>${stones}</g>`,
  }
}
