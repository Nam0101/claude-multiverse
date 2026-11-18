import type { Activity } from '../../types'
import { f, random } from './kit'
import { cell } from './rig'
import type { World } from './world'

// Moon Trek: Claude in a white spacesuit with a gold visor, at a fold-out table on the grey plain beside its lunar
// lander. Earth hangs big and blue over the left; a low sun off to the right throws long black shadows from the
// lander, the rover and every boulder. On a tool the rover drives up in slow dust arcs; a command lifts the ascent
// stage off the lander; an error is a meteorite strike that jolts the table; done turns the Earth full and lays a
// trail of boot prints from the rover to the desk.
const EX = 252
const EY = 236
const R = 168
const FOIL = '#7a5f28'
const FOIL_LIT = '#ad8a3e'
const FOIL_DARK = '#3b2d14'
const SUIT = '#b7bdc7'
const SUIT_LIT = '#dfe4ea'
const SUIT_DARK = '#7c828c'
const VISOR = '#dba640'
const ROCK = '#1d1e22'
const ROCK_LIT = '#5b5d64'
// Where the error's meteorite lands, in the desk's box: on the ground behind the lander's left leg.
const IX = 110
const IY = 112

type Pt = readonly [number, number]

/** The horizon: the Moon's near, slightly curved skyline. */
const hz = (x: number): number => 600 + ((x - 800) / 800) ** 2 * 28

/** A smooth closed blob through n points around (cx, cy). */
function blob(cx: number, cy: number, rx: number, ry: number, n: number, next: () => number): string {
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const k = 0.62 + next() * 0.6

    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as const
  })
  const at = (i: number): Pt => pts[(i + n) % n]!
  const mid = (i: number) => `${f((at(i)[0] + at(i + 1)[0]) / 2)} ${f((at(i)[1] + at(i + 1)[1]) / 2)}`
  let d = `M${mid(-1)}`

  // Through the midpoints, each vertex the control point: smooth, and a third smaller than cubic curves.
  for (let i = 0; i < n; i += 1) {
    d += `Q${f(at(i)[0])} ${f(at(i)[1])} ${mid(i)}`
  }

  return d + 'Z'
}

/** Dots as one path of tiny squares. */
function dots(points: Pt[], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** The left part of an ellipse, cut by a terminator arc `inner` wide: the side turned away from the sun. */
function crescent(cx: number, cy: number, rx: number, ry: number, inner: number): string {
  return `M${f(cx)} ${f(cy - ry)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx)} ${f(cy + ry)}A${f(inner)} ${f(ry)} 0 0 1 ${f(cx)} ${f(cy - ry)}Z`
}

/** A crater seen low across the plain: a raised rim, a black bowl, its left wall lit by the sun on the right. */
function crater(cx: number, cy: number, rx: number, ry: number): string {
  const p = (deg: number) => `${f(cx + rx * 1.08 * Math.cos((deg * Math.PI) / 180))} ${f(cy + ry * 1.2 * Math.sin((deg * Math.PI) / 180))}`

  return (
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * 1.16)}" ry="${f(ry * 1.36)}" fill="#3c3d43" fill-opacity=".5"/>` +
    `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="#060708"/>` +
    `<path d="${crescent(cx, cy, rx, ry, rx * 0.5)}" fill="#55575e" fill-opacity=".8"/>` +
    `<path d="M${p(-75)}A${f(rx * 1.08)} ${f(ry * 1.2)} 0 0 1 ${p(70)}" fill="none" stroke="#74767d" stroke-opacity=".6" stroke-width="2"/>`
  )
}

/** A boulder lit from the right, its shadow stretched far to the left along the ground. */
function boulder(x: number, y: number, s: number, len: number): string {
  const p = (pts: number[][]) => pts.map(([a = 0, b = 0]) => `${f(x + a * s)} ${f(y + b * s)}`).join('L')

  return (
    `<path d="M${p([[4, 1.6], [-5, -0.6], [-len, 0.4], [-len, 1.8], [-5, 2.8]])}Z" fill="#000" fill-opacity=".75"/>` +
    `<path d="M${p([[-7, 1.8], [-6.5, -3.5], [-2.5, -7.5], [3, -7.2], [7, -2.8], [7.6, 1.8]])}Z" fill="${ROCK}"/>` +
    `<path d="M${p([[-2.5, -7.5], [3, -7.2], [7, -2.8], [7.6, 1.8], [2.4, 2], [0.6, -3.6]])}Z" fill="${ROCK_LIT}"/>`
  )
}

/** The Earth: a blue disc whose land and clouds turn slowly, a thin lit atmosphere, its night side on the left. */
function earth(next: () => number): string {
  let greens = ''
  let tans = ''

  for (let i = 0; i < 9; i += 1) {
    const cx = EX - 300 + (i + next() * 0.5) * (600 / 9)
    const cy = EY + (next() - 0.5) * R * 1.3
    const rx = 30 + next() * 40
    const ry = 26 + next() * 36

    greens += blob(cx, cy, rx, ry, 8, next)

    if (i % 2 === 0) {
      tans += blob(cx + rx * 0.2, cy - ry * 0.1, rx * 0.5, ry * 0.45, 6, next)
    }
  }

  let thick = ''
  let thin = ''

  for (let i = 0; i < 15; i += 1) {
    const x = EX - 260 + next() * 520
    const y = EY - R + 16 + next() * (2 * R - 32)
    const len = 24 + next() * 70
    const seg = `M${f(x)} ${f(y)}q${f(len / 2)} ${f(-4 - next() * 10)} ${f(len)} 0`

    if (i % 2) {
      thin += seg
    } else {
      thick += seg
    }
  }

  const land = `<path d="${greens}" fill="#3d6a3c"/><path d="${tans}" fill="#8a7a4d"/>`
  const clouds =
    `<path d="${thick}" fill="none" stroke="#eef4fb" stroke-opacity=".62" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="${thin}" fill="none" stroke="#eef4fb" stroke-opacity=".45" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="M${EX + 40} ${EY + 30}a14 12 0 1 1 10 12a8 7 0 1 1 -6 -6" fill="none" stroke="#eef4fb" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`
  const rings = [0, 1, 2]
    .map(k => `<circle class="mt-er" style="animation-delay:${f(-k * 0.7)}s" cx="${EX}" cy="${EY}" r="${R + 18}" fill="none" stroke="#8cc2ff" stroke-width="2.4"/>`)
    .join('')

  return (
    `<circle class="mt-halo" cx="${EX}" cy="${EY}" r="320" fill="url(#mt-halo)"/>` +
    rings +
    `<circle cx="${EX}" cy="${EY}" r="${R}" fill="url(#mt-ocean)"/>` +
    `<g clip-path="url(#mt-ec)"><g class="mt-land">${land}<g transform="translate(-600 0)">${land}</g></g>` +
    `<ellipse cx="${EX + 6}" cy="${EY + R - 4}" rx="74" ry="17" fill="#e8eef5" fill-opacity=".8"/>` +
    `<ellipse cx="${EX - 8}" cy="${EY - R + 3}" rx="46" ry="10" fill="#e8eef5" fill-opacity=".6"/>` +
    `<g class="mt-cld">${clouds}<g transform="translate(-520 0)">${clouds}</g></g></g>` +
    `<circle cx="${EX}" cy="${EY}" r="${R}" fill="url(#mt-limb)"/>` +
    `<circle cx="${EX}" cy="${EY}" r="${R + 16}" fill="url(#mt-atm)"/>` +
    `<g class="mt-night"><path d="${crescent(EX, EY, R + 1, R + 1, R * 0.32)}" fill="#01030a" fill-opacity=".5"/>` +
    `<path d="${crescent(EX, EY, R + 1, R + 1, R * 0.52)}" fill="#01030a" fill-opacity=".86"/></g>`
  )
}

/** The rover, parked at the origin (between its wheels, on the ground), facing right. */
function rover(next: () => number): string {
  const wheel = (x: number) =>
    `<g transform="translate(${x} -24)"><g class="mt-wh"><circle r="24" fill="#0d0e11" stroke="#80858e" stroke-width="3"/>` +
    '<circle r="18.5" fill="none" stroke="#a7adb6" stroke-opacity=".5" stroke-width="3.5" stroke-dasharray="5 4.4"/>' +
    '<path d="M-15 0H15M0 -15V15" stroke="#50545c" stroke-width="2.2"/><circle r="5" fill="#666b74"/></g></g>'
  // The rooster tails: dust thrown up and back off each wheel in clean arcs.
  const tails = [-80, 80]
    .map(wx =>
      Array.from({ length: 5 }, (_, k) => {
        const dx = -60 - next() * 100
        const h = -24 - next() * 44

        return `<circle class="mt-rt" cx="${wx - 8}" cy="-5" r="${f(5 + next() * 5)}" fill="#a09c92" fill-opacity=".6" style="--dx:${f(dx)}px;--h:${f(h)}px;animation-delay:${f(k * 0.18)}s"/>`
      }).join(''),
    )
    .join('')

  return (
    '<path d="M124 2L-110 -3L-480 1L-480 9L-110 11Z" fill="#000" fill-opacity=".72"/>' +
    '<g fill="#0a0b0d" stroke="#3b3e44" stroke-width="2"><circle cx="-64" cy="-30" r="22"/><circle cx="96" cy="-30" r="22"/></g>' +
    tails +
    '<g class="mt-bnc">' +
    '<path d="M-120 -46H124L118 -36H-114Z" fill="#30333a"/><path d="M-120 -46H124" stroke="#a3a9b2" stroke-width="2"/>' +
    `<rect x="-118" y="-66" width="38" height="20" fill="${FOIL}"/><path d="M-80 -66V-46" stroke="${FOIL_LIT}" stroke-width="2.4"/>` +
    '<path d="M-60 -46V-78H-36M-36 -46L-32 -62M-24 -46V-78H0M0 -46L4 -62" fill="none" stroke="#8d939c" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M44 -46V-72" stroke="#7d838c" stroke-width="3"/><rect x="32" y="-84" width="26" height="13" rx="2" fill="#3a3e46" stroke="#80868f" stroke-width="1.5"/>' +
    '<path d="M76 -46L72 -112M92 -46L100 -104" stroke="#8a9099" stroke-width="2.2"/>' +
    '<g transform="translate(70 -118) rotate(-35)"><path d="M-27 0Q0 15 27 0Z" fill="#c9cfd8" fill-opacity=".9"/>' +
    '<path d="M-18 4L18 4M0 7V-16" stroke="#7d838c" stroke-width="1.4"/></g>' +
    '<path d="M108 -46V-58" stroke="#7d838c" stroke-width="2.5"/><rect x="100" y="-69" width="17" height="11" rx="2" fill="#2c3036" stroke="#80868f"/>' +
    '<g fill="none" stroke="#9ea4ad" stroke-width="5"><path d="M-110 -40A31 31 0 0 1 -50 -40"/><path d="M50 -40A31 31 0 0 1 110 -40"/></g>' +
    '</g>' +
    wheel(-80) +
    wheel(80)
  )
}

/** Boot prints from the rover to the desk, along one curve; they appear one by one when the work is done. */
function footprints(): string {
  const P: Pt[] = [
    [330, 806],
    [640, 838],
    [980, 884],
    [1236, 958],
  ]
  const [a, b, c, d] = P as [Pt, Pt, Pt, Pt]
  const n = 24
  let out = ''

  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1)
    const u = 1 - t
    const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0]
    const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
    const tx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
    const ty = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
    const len = Math.hypot(tx, ty)
    const s = 0.8 + (y - 800) / 380
    const side = i % 2 ? 1 : -1
    const px = x - (ty / len) * 5 * side * s
    const py = y + (tx / len) * 5 * side * s
    const angle = (Math.atan2(ty, tx) * 180) / Math.PI

    out += `<ellipse class="mt-fp" style="--i:${i}" transform="translate(${f(px)} ${f(py)}) rotate(${Math.round(angle)}) scale(${f(s)})" rx="10" ry="4.4"/>`
  }

  return `<g fill="#030304" stroke="#9a9da4" stroke-opacity=".75" stroke-width="1.3">${out}</g>`
}

/** The lander, standing on its pads at the origin: foil-wrapped descent stage, the ascent stage that lifts off. */
function lander(next: () => number): string {
  const crinkle = (x0: number, x1: number, y0: number, y1: number, n: number, color: string, op: number): string => {
    let d = ''

    for (let i = 0; i < n; i += 1) {
      d += `M${f(x0 + next() * (x1 - x0))} ${f(y0 + next() * (y1 - y0))}l${f(4 + next() * 8)} ${f((next() - 0.5) * 8)}l${f(3 + next() * 6)} ${f((next() - 0.5) * 8)}`
    }

    return `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="1.4" stroke-linejoin="round"/>`
  }
  const leg = (s: number, stroke: string) =>
    `<path d="M${s * 88} -98L${s * 130} -6M${s * 66} -62L${s * 122} -18M${s * 108} -52L${s * 74} -64" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>` +
    `<ellipse cx="${s * 132}" cy="-2" rx="20" ry="5.5" fill="${stroke}"/>`
  const rcs = (x: number) =>
    `<g transform="translate(${x} -200)" fill="#5a5f68"><rect x="-4" y="-4" width="8" height="8"/>` +
    '<path d="M-4 -2L-12 -4V4L-4 2ZM4 -2L12 -4V4L4 2ZM-2 -4L-4 -12H4L2 -4ZM-2 4L-4 12H4L2 4Z"/></g>'
  const rungs = [-50, -41, -32, -23, -14].map(y => `M-9 ${y}H9`).join('')
  const bits = Array.from({ length: 12 }, (_, i) => {
    const x = -56 + next() * 112
    const dx = (x < 0 ? -1 : 1) * (60 + next() * 150)
    const dy = -40 + next() * 170

    return (
      `<g transform="translate(${f(x)} -138)"><path class="mt-fb" style="--dx:${f(dx)}px;--dy:${f(dy)}px;--r:${f((next() - 0.5) * 900)}deg" ` +
      `d="M-3.5 -2L3 -3.2L4 2L-2.4 3.2Z" fill="${i % 3 ? FOIL_LIT : '#e2c47e'}"/></g>`
    )
  }).join('')
  const signal = [0, 1, 2]
    .map(k => `<path class="mt-sg" style="animation-delay:${f(-k * 0.6)}s" d="M-3 -12Q-14 0 -3 12" fill="none" stroke="#9cc4ff" stroke-width="2.4" stroke-linecap="round"/>`)
    .join('')

  return (
    // The long black shadow, cast far to the left over the plain.
    '<path d="M150 2L-130 -5L-560 -1L-980 6L-980 17L-560 16L-130 14Z" fill="#000" fill-opacity=".74"/>' +
    leg(-1, '#4b5059') +
    leg(1, '#9aa0aa') +
    // The ascent stage, its plume hidden in the descent stage until it lifts.
    '<g class="mt-asc">' +
    '<path class="mt-pl" d="M-13 -140H13L30 -44H-30Z" fill="url(#mt-plume)"/>' +
    '<path d="M-78 -140L-82 -178L-66 -214L-36 -238H-20L-28 -140Z" fill="#3b3f47"/>' +
    '<path d="M-28 -140L-20 -238H30L36 -140Z" fill="#666c76"/>' +
    '<path d="M36 -140L30 -238L60 -222L80 -190L78 -140Z" fill="#9aa1ab"/>' +
    '<path d="M-78 -140L-82 -178L-66 -214L-36 -238H30L60 -222L80 -190L78 -140" fill="none" stroke="#24272c" stroke-width="1.6" stroke-linejoin="round"/>' +
    `<path d="M-80 -152H80V-140H-80Z" fill="${FOIL}"/><path d="M36 -152H80V-140H36Z" fill="${FOIL_LIT}"/>` +
    '<path d="M-17 -229H-3V-205ZM3 -229H17L3 -205Z" fill="#06070a" stroke="#4b5059" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path class="mt-cab" d="M-14 -226H-5V-212ZM5 -226H14L5 -212Z" fill="#ffcf7a" fill-opacity=".4"/>' +
    '<rect x="-12" y="-192" width="24" height="26" rx="2" fill="#2b2e34" stroke="#4b4f57" stroke-width="1.5"/>' +
    '<rect x="-12" y="-252" width="24" height="14" fill="#555a63"/><rect x="-17" y="-257" width="34" height="5" rx="2" fill="#7c828b"/>' +
    rcs(-86) +
    rcs(86) +
    '<path d="M52 -226L86 -262M-40 -238L-58 -276M22 -238L36 -274M-44 -236L-50 -248" stroke="#8a9099" stroke-width="2" fill="none"/>' +
    '<g transform="translate(94 -268) rotate(-35)"><path d="M-18 0Q0 11 18 0Z" fill="#c6ccd5"/><path d="M0 4V-12" stroke="#9aa0aa" stroke-width="1.5"/></g>' +
    '<g transform="translate(-50 -250) rotate(-20)"><path d="M-10 0Q0 6 10 0Z" fill="#aab0b9"/></g>' +
    '<g class="mt-bcn"><circle cy="-261" r="11" fill="#ff8a5a" fill-opacity=".22"/><circle cy="-261" r="2.8" fill="#ffb08a"/></g>' +
    '</g>' +
    // The descent stage in its gold foil, lit from the right.
    `<path d="M-90 -132L-62 -140V-58L-90 -66Z" fill="${FOIL_DARK}"/>` +
    `<path d="M-62 -140H62V-58H-62Z" fill="${FOIL}"/>` +
    `<path d="M62 -140L90 -132V-66L62 -58Z" fill="${FOIL_LIT}"/>` +
    crinkle(-60, 54, -132, -66, 10, '#c9a456', 0.45) +
    crinkle(-58, 54, -132, -66, 6, '#2a1f0c', 0.5) +
    crinkle(63, 80, -128, -70, 5, '#e2c27a', 0.5) +
    '<path d="M-90 -132L-62 -140H62L90 -132V-126L62 -134H-62L-90 -126Z" fill="#17181b"/>' +
    '<path d="M-62 -140V-58M62 -140V-58" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>' +
    '<path d="M-18 -58H18L26 -36H-26Z" fill="#1a1b1f" stroke="#3b3e45" stroke-width="1.5"/>' +
    // The front leg with its ladder and porch.
    `<path d="M0 -60V2" stroke="#7d838c" stroke-width="5"/><path d="M-9 -58V-6M9 -58V-6${rungs}" stroke="#8e949d" stroke-width="2" fill="none"/>` +
    '<ellipse cx="0" cy="5" rx="20" ry="5.5" fill="#8a9099"/><rect x="-20" y="-66" width="40" height="6" fill="#4d525b"/>' +
    // Lift-off: the engine's glow on the deck, the deck spray, dust off the pads, shreds of foil.
    '<circle class="mt-ign" cy="-140" r="72" fill="url(#mt-flame)"/>' +
    '<ellipse class="mt-bl" cy="-138" rx="84" ry="13" fill="url(#mt-dust)"/>' +
    '<ellipse class="mt-bl mt-bl2" cy="2" rx="160" ry="16" fill="url(#mt-dust)"/>' +
    bits +
    `<g transform="translate(80 -270)">${signal}</g>`
  )
}

/** The rugged laptop, a rock sample under a scan light, and a small dish on a tripod aimed at the Earth. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const dish = activity === 'thinking' ? ' mt-slow' : activity === 'responding' || activity === 'web' || activity === 'tool' ? ' mt-scan' : ''
  const scan =
    activity === 'read'
      ? `<path d="M368 292L352 316H384Z" fill="${light}" fill-opacity=".16"/><rect class="mt-scl" x="352" y="312" width="32" height="2" fill="${light}"/>`
      : ''

  return tilt(
    '<rect x="244" y="322" width="104" height="8" rx="2" fill="#30353d"/>' +
      keys +
      '<path d="M332 328L358 236L372 239L346 330Z" fill="#30353d" stroke="#4c525b" stroke-width="1.5" stroke-linejoin="round"/>' +
      `<path d="M336 323L359 243L364 244L341 325Z" fill="${light}"/>` +
      `<path d="M336 323L359 243L346 247L326 323Z" fill="${light}" fill-opacity=".16"/>` +
      '<path d="M347 329L350 319M371 241L368 251" stroke="#c9ced6" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M356 330L358 321L366 315L376 318L381 326L379 330Z" fill="#3b3d42"/><path d="M366 315L376 318L381 326L372 327Z" fill="#7a7d84"/>' +
      scan +
      '<path d="M394 330L404 298L414 330M404 298V278" stroke="#7d838d" stroke-width="2.4" fill="none" stroke-linejoin="round"/>' +
      `<g transform="translate(404 274)"><g class="mt-dish${dish}"><g transform="rotate(-35)"><path d="M-21 0Q0 13 21 0Z" fill="#c4cad3" stroke="#8a9099" stroke-width="1.2"/>` +
      `<path d="M0 5V-15" stroke="#9aa0a9" stroke-width="1.6"/><circle cy="-16" r="2.4" fill="${light}"/></g></g></g>`,
  )
}

/** The table's things, turned about its right foot so an impact can tip them. */
function tilt(inner: string): string {
  return `<g transform="translate(460 454)"><g class="mt-tilt"><g transform="translate(-460 -454)">${inner}</g></g></g>`
}

export function moonTrekWorld(): World {
  const next = random(1969)

  // Stars: none in front of the Earth, few and faint over the chat column.
  const starA: Pt[] = []
  const starB: Pt[] = []
  const starDim: Pt[] = []

  for (let i = 0; i < 150; i += 1) {
    const p: Pt = [next() * 1600, next() * 600]

    if (Math.hypot(p[0] - EX, p[1] - EY) < R + 26) {
      continue
    }

    if (p[0] > 420 && p[0] < 1180) {
      if (i % 3 === 0) {
        starDim.push(p)
      }
    } else {
      ;(i % 2 ? starA : starB).push(p)
    }
  }

  const sparkle = ([x, y, s]: number[]) =>
    `<path class="mt-tw2" transform="translate(${x} ${y}) scale(${s})" d="M0 -9L1.6 -1.6L9 0L1.6 1.6L0 9L-1.6 1.6L-9 0L-1.6 -1.6Z" fill="#eef2ff"/>`
  const ridge = Array.from({ length: 22 }, (_, i) => `${-40 + i * 80} ${f(hz(-40 + i * 80))}`).join('L')
  const craters =
    crater(96, 688, 66, 13) +
    crater(338, 646, 40, 8) +
    crater(196, 930, 168, 34) +
    crater(36, 812, 40, 10) +
    `<g opacity=".55">${crater(620, 662, 56, 10) + crater(900, 726, 84, 15) + crater(760, 842, 50, 11)}</g>` +
    `<g class="mv-r">${crater(1290, 652, 46, 9) + crater(1540, 662, 40, 8)}</g>`
  const boulders =
    boulder(370, 704, 3, 44) +
    boulder(62, 662, 2.4, 52) +
    boulder(330, 870, 4.4, 40) +
    boulder(160, 742, 2, 58) +
    boulder(700, 706, 1.8, 52) +
    boulder(1010, 770, 2.6, 46) +
    `<g class="mv-r">${boulder(1250, 712, 2.4, 46) + boulder(1574, 742, 3, 40)}</g>`
  let pebLit = ''
  let pebDark = ''

  for (let i = 0; i < 64; i += 1) {
    const x = next() * 1600
    const y = 612 + next() ** 1.5 * 380
    const inCol = x > 420 && x < 1180

    if (inCol && i % 2) {
      continue
    }

    const s = 1.2 + (y - 600) / 160

    pebLit += `M${f(x)} ${f(y)}h${f(s)}v${f(s * 0.6)}h${f(-s)}z`
    pebDark += `M${f(x - s * 2.6)} ${f(y + s * 0.2)}h${f(s * 2.6)}v${f(s * 0.5)}h${f(-s * 2.6)}z`
  }

  const ascKeys = Array.from({ length: 11 }, (_, i) => {
    const t = i * 0.5

    return `${i * 10}%{transform:translate(${f(-3 * t * t)}px,${f(-30 * t * t)}px) rotate(${f(-1.6 * t)}deg)}`
  }).join('')
  const ejecta = Array.from({ length: 12 }, (_, i) => {
    const dx = -230 + next() * 440
    const h = -60 - next() * 160
    const dy = -6 + next() * 30

    return (
      `<g transform="translate(${IX} ${IY - 4})"><path class="mt-ej" style="--dx:${f(dx)}px;--h:${f(h)}px;--dy:${f(dy)}px" ` +
      `d="M-3 -2L1 -4L4 0L1 3L-3 2Z" fill="${i % 2 ? '#8b8e95' : '#5d6068'}"/></g>`
    )
  }).join('')
  const puffs = [
    [-60, -70, 0.38, 52],
    [30, -110, 0.42, 46],
    [-14, -170, 0.48, 40],
    [-110, -20, 0.4, 36],
  ]
    .map(
      ([x = 0, y = 0, d = 0, r = 0]) =>
        `<ellipse class="mt-pf" style="--x:${x}px;--y:${y}px;animation-delay:${d}s" cx="${IX}" cy="${IY - 6}" rx="${r}" ry="${f(r * 0.8)}" fill="url(#mt-dust)"/>`,
    )
    .join('')
  // Pebbles from the strike that rain down on the table and around Claude.
  const fallout = [
    [456, 326, -150],
    [16, 452, -110],
    [-34, 452, -90],
  ]
    .map(
      ([x = 0, y = 0, h = 0]) =>
        `<g transform="translate(${IX} ${IY - 4})"><path class="mt-ej" style="--dx:${x - IX}px;--h:${h}px;--dy:${y - IY + 4}px" d="M-5 -3L1.5 -6.5L6.5 0L1.5 5L-5 3Z" fill="#9a9da4"/></g>`,
    )
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#040507',
      furniture: '#262a31',
      metal: '#30353d',
      paper: '#d9dde3',
      light: { idle: '#55779f', work: '#94bfff', bright: '#d6e8ff' },
      headTop: 211,
      glowAt: [345, 284],
      device,
      wear: {
        // The life-support pack on its back, with a whip antenna on the far side.
        behind:
          `<rect x="50" y="214" width="40" height="124" rx="6" fill="${SUIT_DARK}"/><path d="M54 222H86" stroke="#5d636d" stroke-width="3"/>` +
          '<path d="M58 214V180" stroke="#8a9099" stroke-width="2"/><circle cx="58" cy="178" r="2.6" fill="#e5484d"/>',
        // The helmet: a white shell around a gold visor the eyes show through, then the neck ring, the chest
        // pack and white boots.
        front:
          `<path d="M68 322V252C68 218 104 198 150 198C196 198 232 218 232 252V322ZM100 244H204Q220 244 220 260V306Q220 320 206 320H98Q84 320 84 306V260Q84 244 100 244Z" fill="${SUIT}" fill-rule="evenodd"/>` +
          '<path d="M68 322V252C68 232 76 218 88 208V322Z" fill="#000" fill-opacity=".2"/>' +
          `<path d="M182 204C210 212 228 228 230 252V318" fill="none" stroke="${SUIT_LIT}" stroke-opacity=".85" stroke-width="3"/>` +
          `<path d="M150 199V243" stroke="${SUIT_DARK}" stroke-width="2"/>` +
          `<path d="M100 244H204Q220 244 220 260V306Q220 320 206 320H98Q84 320 84 306V260Q84 244 100 244Z" fill="${VISOR}" fill-opacity=".3" stroke="#5a606a" stroke-width="3"/>` +
          `<path d="M100 245H204Q218 245 219 252H85Q86 245 100 245Z" fill="${VISOR}" fill-opacity=".6"/>` +
          '<path d="M206 251Q216 253 216 266" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>' +
          '<circle cx="211" cy="300" r="4" fill="#5d9cf0" fill-opacity=".85"/>' +
          '<rect x="70" y="318" width="160" height="12" rx="3" fill="#5d636d"/><path d="M73 320H227" stroke="#9aa1ab" stroke-width="1.5"/>' +
          `<rect x="70" y="330" width="160" height="20" fill="${SUIT}"/><rect x="70" y="330" width="30" height="20" fill="#000" fill-opacity=".2"/>` +
          '<rect x="104" y="326" width="50" height="20" rx="3" fill="#d3d8df" stroke="#6b717b" stroke-width="1.5"/>' +
          '<rect x="110" y="331" width="6" height="4" fill="#e5484d"/><rect x="120" y="331" width="6" height="4" fill="#3fbf6f"/><rect x="130" y="331" width="6" height="4" fill="#5d9cf0"/>' +
          '<circle cx="146" cy="337" r="3" fill="#6b717b"/>' +
          `<g fill="#c3c9d2">${[3, 5, 8, 10].map(col => cell(col, 7.6, 1, 0.9)).join('')}</g>` +
          `<g fill="#3a3e45">${[3, 5, 8, 10].map(col => cell(col, 8.3, 1, 0.2)).join('')}</g>`,
      },
      // A foil-wrapped experiment crate with a radiator panel.
      seatArt:
        `<rect x="102" y="356" width="100" height="100" rx="3" fill="${FOIL}"/><path d="M102 356H122V456H102Z" fill="${FOIL_DARK}"/>` +
        `<path d="M126 372l8 4l7 -3l9 5M130 404l9 -3l8 4l7 -2M124 436l9 3l8 -4l9 2" fill="none" stroke="${FOIL_LIT}" stroke-opacity=".7" stroke-width="1.6"/>` +
        '<rect x="164" y="370" width="30" height="74" fill="#1b1d21"/><path d="M168 380H190M168 390H190M168 400H190M168 410H190M168 420H190M168 430H190" stroke="#3a3e45" stroke-width="2"/>' +
        '<rect x="98" y="347" width="108" height="10" rx="3" fill="#4d535d" stroke="#727984" stroke-width="1.5"/>',
      // A fold-out table on thin legs with footpads like the lander's, a foil stowage bag under it.
      tableArt: tilt(
        '<path d="M176 454L192 342M460 454L444 342" stroke="#5d636d" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M186 398L236 342M450 398L400 342" stroke="#4a5059" stroke-width="2.5"/>' +
          '<ellipse cx="176" cy="454" rx="13" ry="3.5" fill="#6d737d"/><ellipse cx="460" cy="454" rx="13" ry="3.5" fill="#6d737d"/>' +
          `<path d="M262 342H372L366 372C340 380 292 380 268 372Z" fill="${FOIL}"/><path d="M276 352l10 4l9 -3l12 4l10 -3l12 3" fill="none" stroke="${FOIL_LIT}" stroke-opacity=".7" stroke-width="1.5"/>` +
          '<rect x="166" y="330" width="304" height="12" rx="2" fill="#3a3f48"/><path d="M168 331H468" stroke="#8f97a3" stroke-width="2"/>',
      ),
    },
    style:
      // Ambient: the stars, the Earth turning, the lander's beacon, a ship passing high in orbit.
      '.mt-tw1{animation:mt-tw 4.6s ease-in-out infinite alternate}.mt-tw2{animation:mt-tw 6.2s ease-in-out -2s infinite alternate}' +
      '@keyframes mt-tw{from{opacity:.45}to{opacity:1}}' +
      '.mt-land{animation:mt-rot 160s linear infinite}@keyframes mt-rot{to{transform:translateX(600px)}}' +
      '.mt-cld{animation:mt-rotc 110s linear infinite}@keyframes mt-rotc{to{transform:translateX(520px)}}' +
      '.mt-halo{transform-box:fill-box;transform-origin:center;opacity:.75}' +
      '.mt-bcn{animation:mt-bcn 2.4s ease-in-out infinite}@keyframes mt-bcn{0%,70%,100%{opacity:.25}82%{opacity:1}}' +
      '.mt-cab{animation:mt-cab 5s ease-in-out infinite alternate}@keyframes mt-cab{from{opacity:.55}to{opacity:1}}' +
      '.mt-orb{animation:mt-orb 48s linear -14s infinite}' +
      '@keyframes mt-orb{0%{transform:translate(-80px,0);opacity:0}3%{opacity:.9}42%{opacity:.9}45%{transform:translate(1760px,46px);opacity:0}100%{transform:translate(1760px,46px);opacity:0}}' +
      // Thinking: the Earth's glow breathes and the table dish sweeps slowly.
      '.st-thinking .mt-halo{animation:mt-br 3.2s ease-in-out infinite alternate}@keyframes mt-br{to{opacity:1;transform:scale(1.06)}}' +
      '.mt-slow{animation:mt-dsh 4s ease-in-out infinite alternate}.mt-scan{animation:mt-dsh 1.3s ease-in-out infinite alternate}' +
      '@keyframes mt-dsh{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}' +
      // Responding and web: the lander calls home; on web the Earth answers in rings.
      '.mt-sg{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-responding .mt-sg{animation:mt-sg 1.8s ease-out infinite}.st-web .mt-sg{animation:mt-sg 1.2s ease-out infinite}' +
      '@keyframes mt-sg{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:.85}100%{opacity:0;transform:translate(-160px,-24px) scale(2.2)}}' +
      '.mt-er{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .mt-er{animation:mt-er 2.1s ease-out infinite}' +
      '@keyframes mt-er{0%{opacity:0;transform:scale(1)}12%{opacity:.55}100%{opacity:0;transform:scale(1.45)}}' +
      // Read: the scan light runs over the rock sample.
      '.mt-scl{animation:mt-scl .8s ease-in-out infinite alternate}@keyframes mt-scl{to{transform:translateY(12px)}}' +
      // Tool: the rover drives in from the left, wheels rolling, dust arcing off them.
      '.st-tool .mt-rov{animation:mt-drive 2.8s cubic-bezier(.2,.55,.3,1) both}@keyframes mt-drive{from{transform:translateX(-420px)}}' +
      '.st-tool .mt-wh{animation:mt-roll 2.8s cubic-bezier(.2,.55,.3,1) both}@keyframes mt-roll{from{transform:rotate(-1003deg)}}' +
      '.st-tool .mt-bnc{animation:mt-bnc .35s ease-in-out 8 alternate}@keyframes mt-bnc{to{transform:translateY(-2.5px)}}' +
      '.mt-rt{opacity:0;transform-box:fill-box;transform-origin:center}.st-tool .mt-rt{animation:mt-rt .9s linear 3}' +
      '@keyframes mt-rt{0%{opacity:0;transform:translate(0,0) scale(.5);animation-timing-function:cubic-bezier(.2,.6,.4,1)}' +
      '12%{opacity:.8}50%{transform:translate(calc(var(--dx) * .5),var(--h)) scale(1.2);animation-timing-function:cubic-bezier(.5,0,.8,.5)}' +
      '100%{opacity:0;transform:translate(var(--dx),0) scale(1.9)}}' +
      '.mt-haze{opacity:0;transform-box:fill-box;transform-origin:100% 50%}.st-tool .mt-haze{animation:mt-haze 3.2s ease-out both}' +
      '@keyframes mt-haze{0%{opacity:0;transform:scaleX(.3)}45%{opacity:.75}100%{opacity:.4;transform:scaleX(1)}}' +
      // Run: the ascent stage lights its engine, shreds of foil blow off the deck, and it climbs away.
      `.mt-asc{transform-box:fill-box;transform-origin:50% 60%}.st-run .mt-asc{animation:mt-asc 5s linear .25s both}@keyframes mt-asc{${ascKeys}}` +
      '.mt-pl{opacity:0;transform-box:fill-box;transform-origin:50% 0}' +
      '.st-run .mt-pl{animation:mt-pl .5s ease-out .15s both,mt-plf .45s ease-in-out .65s infinite alternate}' +
      '@keyframes mt-pl{from{opacity:0;transform:scaleY(.2)}to{opacity:.95;transform:scaleY(1)}}@keyframes mt-plf{from{transform:scaleY(1)}to{transform:scaleY(.84)}}' +
      '.mt-ign{opacity:0}.st-run .mt-ign{animation:mt-ign 3.4s ease-out .1s both}@keyframes mt-ign{0%{opacity:0}8%{opacity:.9}35%{opacity:.55}100%{opacity:0}}' +
      '.mt-bl{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .mt-bl{animation:mt-bl 2.8s ease-out .15s both}.st-run .mt-bl2{animation-delay:.3s}' +
      '@keyframes mt-bl{0%{opacity:0;transform:scale(.25,.5)}15%{opacity:.9}100%{opacity:0;transform:scale(2.2,1.5)}}' +
      '.mt-fb{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .mt-fb{animation:mt-fb 2.4s cubic-bezier(.2,.7,.4,1) .2s both}' +
      '@keyframes mt-fb{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      // Error: a meteorite streaks in behind the lander, a soft flash, dust and stones thrown up, the ground
      // jolts and the table tips.
      '.mt-met{opacity:0}.st-error .mt-met{animation:mt-met .38s ease-in both}' +
      '@keyframes mt-met{0%{opacity:0;transform:translate(260px,-590px)}15%{opacity:1}96%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(0,0)}}' +
      '.mt-fl{opacity:0}.st-error .mt-fl{animation:mt-fl 1s linear .36s both}@keyframes mt-fl{0%{opacity:0}14%{opacity:.75}100%{opacity:0}}' +
      '.mt-pf{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .mt-pf{animation:mt-pf 3.2s cubic-bezier(.2,.7,.4,1) both}' +
      '@keyframes mt-pf{0%{opacity:0;transform:translate(0,0) scale(.2)}10%{opacity:1}55%{opacity:.85}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(3)}}' +
      '.mt-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .mt-ring{animation:mt-ring 2s ease-out .38s both}' +
      '@keyframes mt-ring{0%{opacity:0;transform:scale(.3,.5)}12%{opacity:.9}100%{opacity:0;transform:scale(3.6,1.6)}}' +
      '.mt-newc{opacity:0}.st-error .mt-newc{animation:mt-in .5s ease-out .45s both}@keyframes mt-in{to{opacity:1}}' +
      '.mt-ej{opacity:0}.st-error .mt-ej{animation:mt-ej 1.5s .38s both}' +
      '@keyframes mt-ej{0%{opacity:0;transform:translate(0,0);animation-timing-function:cubic-bezier(.25,.6,.5,1)}5%{opacity:1}' +
      '45%{transform:translate(calc(var(--dx) * .45),var(--h));animation-timing-function:cubic-bezier(.5,0,.75,.4)}85%,100%{opacity:1;transform:translate(var(--dx),var(--dy))}}' +
      '.st-error .mt-qk{animation:mt-qk .5s ease-out .38s 2}@keyframes mt-qk{0%,100%{transform:none}20%{transform:translate(-8px,4px)}45%{transform:translate(6px,-3px)}70%{transform:translate(-3px,2px)}}' +
      '.st-error .mt-tilt{animation:mt-tilt 1.3s ease-out .38s both}' +
      '@keyframes mt-tilt{0%{transform:none}18%{transform:rotate(-6deg)}40%{transform:rotate(1deg)}62%{transform:rotate(-3.8deg)}82%{transform:rotate(-2.8deg)}100%{transform:rotate(-3deg)}}' +
      // Done: the night slides off the Earth until it is full, its glow blooms over the plain, and boot prints
      // appear one by one from the rover to the desk.
      '.st-done .mt-night{animation:mt-day 1.8s ease-out .1s both}@keyframes mt-day{to{opacity:0}}' +
      '.st-done .mt-halo{animation:mt-bloom 2.6s ease-out both}@keyframes mt-bloom{to{opacity:1;transform:scale(1.2)}}' +
      '.mt-es{opacity:0}.st-done .mt-es{animation:mt-in 2.4s ease-out .3s both}' +
      '.mt-fp{opacity:0}.st-done .mt-fp{animation:mt-in .35s ease-out both;animation-delay:calc(.2s + var(--i) * .09s)}',
    scenery:
      '<defs>' +
      '<linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020203"/><stop offset=".6" stop-color="#050609"/><stop offset="1" stop-color="#090a0e"/></linearGradient>' +
      '<linearGradient id="mt-gnd" gradientUnits="userSpaceOnUse" x1="0" y1="595" x2="0" y2="1000"><stop offset="0" stop-color="#2d2e33"/><stop offset=".3" stop-color="#1f2024"/><stop offset="1" stop-color="#101114"/></linearGradient>' +
      '<radialGradient id="mt-sun"><stop offset="0" stop-color="#fff3e0" stop-opacity=".14"/><stop offset=".4" stop-color="#ffe9c8" stop-opacity=".05"/><stop offset="1" stop-color="#ffe9c8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mt-ocean" cx=".64" cy=".42" r=".78"><stop offset="0" stop-color="#4d92dc"/><stop offset=".55" stop-color="#2160ad"/><stop offset="1" stop-color="#0c2a5c"/></radialGradient>' +
      '<radialGradient id="mt-limb"><stop offset=".68" stop-color="#020814" stop-opacity="0"/><stop offset="1" stop-color="#020814" stop-opacity=".7"/></radialGradient>' +
      '<radialGradient id="mt-atm"><stop offset=".86" stop-color="#7fb8ff" stop-opacity="0"/><stop offset=".91" stop-color="#8cc2ff" stop-opacity=".55"/><stop offset="1" stop-color="#7fb8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mt-halo"><stop offset=".45" stop-color="#3f82dc" stop-opacity=".2"/><stop offset="1" stop-color="#3f82dc" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mt-flame"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset=".3" stop-color="#ffc56e" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mt-plume" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d2" stop-opacity=".95"/><stop offset=".35" stop-color="#ffc067" stop-opacity=".6"/><stop offset="1" stop-color="#ff9248" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="mt-dust"><stop offset="0" stop-color="#a6a299" stop-opacity=".62"/><stop offset=".6" stop-color="#7a776f" stop-opacity=".26"/><stop offset="1" stop-color="#7a776f" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mt-flash"><stop offset="0" stop-color="#fff4de" stop-opacity=".9"/><stop offset=".35" stop-color="#ffd7a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd7a0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mt-es"><stop offset="0" stop-color="#6aa6ff" stop-opacity=".2"/><stop offset="1" stop-color="#6aa6ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mt-tail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff1d4" stop-opacity=".95"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="mt-ec"><circle cx="${EX}" cy="${EY}" r="${R}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#mt-sky)"/>' +
      `<path class="mt-tw1" d="${dots(starA, 2.6)}" fill="#dfe6f2"/><path class="mt-tw2" d="${dots(starB, 2)}" fill="#c9d3e4"/>` +
      `<path d="${dots(starDim, 1.8)}" fill="#c9d3e4" fill-opacity=".4"/>` +
      [
        [60, 70, 0.9],
        [1300, 118, 0.8],
        [1546, 300, 1],
        [30, 470, 0.7],
        [1226, 420, 0.6],
      ]
        .map(sparkle)
        .join('') +
      // A ship in lunar orbit, crossing high now and then.
      '<g class="mt-orb"><g transform="translate(0 92)"><circle r="7" fill="#cfe0ff" fill-opacity=".18"/>' +
      '<path d="M-10 -3H4L10 0L4 3H-10Z" fill="#9aa1ab"/><path d="M-10 -3V3" stroke="#d0d6de" stroke-width="1.5"/><circle cx="10" r="1.4" fill="#fff"/></g></g>' +
      earth(next) +
      // The low sun, just past the right edge.
      '<g class="mv-r"><circle cx="1680" cy="560" r="380" fill="url(#mt-sun)"/></g>' +
      // The highlands on the skyline: a big massif on the left, low hills across, a ridge behind the lander.
      '<g class="mv-b"><g class="mt-qk">' +
      '<path d="M-60 660V590C-10 548 50 516 112 510C168 505 214 530 262 556C312 582 380 600 480 612V660Z" fill="#121317"/>' +
      '<path d="M112 510C168 505 214 530 262 556C312 582 380 600 480 612V640C380 628 262 602 186 564C150 546 128 528 112 510Z" fill="#2b2c31"/>' +
      '<path d="M112 510C168 505 214 530 262 556C312 582 380 600 480 612" fill="none" stroke="#5c5e65" stroke-opacity=".55" stroke-width="2"/>' +
      '<path d="M236 650C270 600 312 570 346 566C380 562 424 586 476 610V650Z" fill="#17181c"/>' +
      '<path d="M346 566C380 562 424 586 476 610V630C428 612 384 588 346 566Z" fill="#303136"/>' +
      '<path d="M400 650C520 606 640 596 760 600C900 604 1000 592 1160 606V650Z" fill="#111215"/>' +
      '<g class="mv-r"><path d="M1140 660V616C1240 600 1320 572 1392 566C1470 560 1560 578 1700 598V660Z" fill="#131418"/>' +
      '<path d="M1392 566C1470 560 1560 578 1700 598V626C1580 606 1480 584 1392 566Z" fill="#2c2d32"/></g>' +
      // The plain.
      `<path d="M${ridge}L1640 1220L-40 1220Z" fill="url(#mt-gnd)"/>` +
      `<path d="M${ridge}" fill="none" stroke="#5a5c63" stroke-opacity=".45" stroke-width="1.5"/>` +
      '<ellipse class="mt-es" cx="300" cy="770" rx="470" ry="190" fill="url(#mt-es)"/>' +
      `<path d="${pebDark}" fill="#050506" fill-opacity=".6"/><path d="${pebLit}" fill="#4c4e55" fill-opacity=".7"/>` +
      craters +
      boulders +
      footprints() +
      // The rover, its dust haze, and where it parks.
      '<ellipse class="mt-haze" cx="40" cy="784" rx="250" ry="24" fill="url(#mt-dust)"/>' +
      `<g transform="translate(186 798) scale(1.18)"><g class="mt-rov">${rover(next)}</g></g>` +
      '</g></g>',
    nook:
      '<g class="mt-qk">' +
      // The strike: a streak, a soft flash, a fresh crater, a plume and a ring of dust, stones flung out.
      `<g class="mt-newc"><ellipse cx="${IX}" cy="${IY + 2}" rx="24" ry="5.5" fill="#060708"/><path d="${crescent(IX, IY + 2, 24, 5.5, 12)}" fill="#55575e" fill-opacity=".7"/></g>` +
      puffs +
      `<ellipse class="mt-ring" cx="${IX}" cy="${IY + 2}" rx="54" ry="10" fill="url(#mt-dust)"/>` +
      `<circle class="mt-fl" cx="${IX}" cy="${IY - 6}" r="110" fill="url(#mt-flash)"/>` +
      ejecta +
      `<g transform="translate(${IX} ${IY})"><g class="mt-met"><path d="M0 0L64 -152L71 -148Z" fill="url(#mt-tail)"/><circle r="3.6" fill="#fff4dc"/></g></g>` +
      `<g transform="translate(270 150)">${lander(next)}</g>` +
      '</g>',
    front: fallout,
  }
}
