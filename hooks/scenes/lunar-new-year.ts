import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Lunar New Year: a Vietnamese Tết night in an old-town street. Red lanterns, apricot and peach blossom, firecracker
// strings under the eaves, and a lion dance at the left: when a command runs the lion leaps, shakes its head to the
// drum and rears up to snatch the red envelope hung on a pole.
const GOLD = '#e8b23a'
const GOLD_DIM = '#a8802a'
const RED = '#a81d29'
const RED_DARK = '#5a1018'
const CREAM = '#e6d8b8'
const LACQUER = '#4d0f16'

/** A red paper lantern hanging from (x, y), swinging about its hook. */
function lantern(x: number, y: number, s: number, d: number, extra = '', glow = true): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><g class="ln-sw ${extra}" style="--d:${f(d)}s">` +
    (glow ? '<circle cy="40" r="56" fill="url(#ln-gl)"/>' : '') +
    `<path d="M0 0V10" stroke="${GOLD}" stroke-width="2"/><rect x="-9" y="9" width="18" height="6" rx="2" fill="${GOLD}"/>` +
    '<ellipse cy="38" rx="25" ry="24" fill="url(#ln-lb)"/>' +
    `<path d="M0 14V62M-12 16Q-18 38 -12 60M12 16Q18 38 12 60" fill="none" stroke="${GOLD}" stroke-opacity=".35" stroke-width="1.6"/>` +
    `<rect x="-9" y="60" width="18" height="6" rx="2" fill="${GOLD}"/>` +
    // An invented gold mark.
    `<path d="M-6 33H6M0 28V46M-5 40L0 45L5 40" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M0 66V88" stroke="#c4202c" stroke-width="2.4"/><path d="M-5 88H5L4 104H-4Z" fill="#c4202c"/></g></g>`
  )
}

/** A string of firecrackers hanging from an eave: red tubes with gold bands, a fuse on top. */
function crackers(x: number, y: number, len: number): string {
  return (
    `<path d="M${x} ${y}V${y + 12}" stroke="#2a1a14" stroke-width="2.4"/>` +
    `<path d="M${x} ${y + 12}v${len}" stroke="#a3141c" stroke-width="11" stroke-dasharray="17 4"/>` +
    `<path d="M${x} ${y + 21}v${len}" stroke="${GOLD}" stroke-opacity=".8" stroke-width="11" stroke-dasharray="2 19"/>`
  )
}

/** A flowering branch: wood plus small clusters of five-petal blossoms. */
function blossoms(seed: number, wood: string, spots: [number, number][], colors: string[], n: number, spread: number): string {
  const next = random(seed)
  let out = ''

  for (const [cx, cy] of spots) {
    for (let k = 0; k < n; k += 1) {
      const a = next() * Math.PI * 2
      const r = Math.sqrt(next()) * spread

      out += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r * 0.8)}" r="${f(4.6 + next() * 3)}" fill="${colors[Math.floor(next() * colors.length)]}"/>`
    }
  }

  return wood + out
}

/** Town: tube houses with curved tile roofs, lit windows, a lantern at each door. Windows go into shared paths. */
function town(): string {
  const next = random(88)
  const wA: string[] = []
  const wB: string[] = []
  const doors: string[] = []
  const lamps: string[] = []
  const bodies: string[] = []
  const faces = ['#1d0d12', '#180b10', '#220f10', '#1a1013']
  let x = -30

  for (let i = 0; x < 1650; i += 1) {
    const w = 86 + next() * 48
    const h = 250 + next() * 150
    const top = 950 - h
    const mid = x > 380 && x < 1200
    const face = faces[i % 4]
    const roof = mid ? '#14090d' : '#2a1014'

    bodies.push(
      `<path d="M${f(x - 10)} ${f(top + 24)}Q${f(x + w * 0.2)} ${f(top + 18)} ${f(x + w / 2)} ${f(top - 26)}Q${f(x + w * 0.8)} ${f(top + 18)} ${f(x + w + 10)} ${f(top + 24)}L${f(x + w + 4)} ${f(top + 32)}H${f(x - 4)}Z" fill="${roof}" stroke="${GOLD_DIM}" stroke-opacity=".25" stroke-width="1.5"/>` +
        `<rect x="${f(x)}" y="${f(top + 32)}" width="${f(w)}" height="${f(h)}" fill="${face}"/>`,
    )

    for (const row of [top + 62, top + 130]) {
      for (const col of [0.16, 0.58]) {
        const target = (i + (row > top + 100 ? 1 : 0) + (col > 0.3 ? 1 : 0)) % 2 === 0 ? wA : wB

        if (next() > 0.2) target.push(`M${f(x + w * col)} ${f(row)}h${f(w * 0.26)}v34h${f(-w * 0.26)}Z`)
      }
    }

    doors.push(`M${f(x + w * 0.3)} 950V896Q${f(x + w * 0.5)} 876 ${f(x + w * 0.7)} 896V950Z`)
    lamps.push(`M${f(x + w * 0.5 - 6)} 884a6 6 0 1 0 12 0a6 6 0 1 0 -12 0Z`)
    x += w + 6 + next() * 10
  }

  return (
    bodies.join('') +
    '<g class="ln-wa"><path d="' + wA.join('') + '" fill="#f2a64a"/></g>' +
    '<g class="ln-wb"><path d="' + wB.join('') + '" fill="#f2a64a"/></g>' +
    `<path d="${doors.join('')}" fill="#e08a3a" fill-opacity=".35"/><path d="${lamps.join('')}" fill="#d9362e"/>`
  )
}

/** The lion's head, facing right, centered on (0, 0). */
function lionHead(): string {
  const next = random(5)
  const colors = [CREAM, GOLD, '#d8728c', '#2aa59a']
  let mane = ''

  for (let k = 0; k < 24; k += 1) {
    const a = (k / 24) * Math.PI * 2
    const r = 100 + (k % 2) * 10

    mane += `<circle cx="${f(Math.cos(a) * r * 1.12)}" cy="${f(Math.sin(a) * r * 0.98)}" r="${24 + (k % 3) * 4}" fill="${colors[k % 4]}"/>`
  }

  for (let k = 0; k < 14; k += 1) {
    const a = (k / 14) * Math.PI * 2 + 0.2

    mane += `<circle cx="${f(Math.cos(a) * 80)}" cy="${f(Math.sin(a) * 72)}" r="${f(17 + next() * 4)}" fill="${k % 2 ? '#f1e6cc' : '#ecbf56'}"/>`
  }

  return (
    mane +
    // Face.
    `<ellipse rx="88" ry="76" fill="${RED}" stroke="${GOLD}" stroke-width="4"/>` +
    '<path d="M-62 -46Q0 -86 62 -46" fill="none" stroke="#1f9d6b" stroke-width="8" stroke-linecap="round"/>' +
    `<path d="M-8 -68Q8 -122 38 -106Q20 -98 16 -66Z" fill="${GOLD}"/>` +
    `<circle cy="-52" r="14" fill="${GOLD}"/><circle cy="-52" r="8" fill="#fff0b8" fill-opacity=".85"/>` +
    '<circle cx="-58" cy="26" r="13" fill="#e8742a"/><circle cx="58" cy="26" r="13" fill="#e8742a"/>' +
    // Eyes with lids.
    '<circle cx="-36" cy="-14" r="22" fill="#f3ead2"/><circle cx="36" cy="-14" r="22" fill="#f3ead2"/>' +
    '<circle cx="-30" cy="-12" r="11" fill="#0d0709"/><circle cx="42" cy="-12" r="11" fill="#0d0709"/>' +
    '<circle cx="-26" cy="-17" r="3.6" fill="#fff"/><circle cx="46" cy="-17" r="3.6" fill="#fff"/>' +
    `<ellipse class="ln-lid" cx="-36" cy="-14" rx="23" ry="23" fill="${RED}"/><ellipse class="ln-lid" cx="36" cy="-14" rx="23" ry="23" fill="${RED}"/>` +
    '<path d="M-64 -44Q-38 -62 -10 -42M10 -42Q38 -62 64 -44" fill="none" stroke="#f4ead2" stroke-width="11" stroke-linecap="round"/>' +
    `<circle cy="12" r="12" fill="${GOLD}"/><circle cx="-4" cy="14" r="2.4" fill="#5a1018"/><circle cx="4" cy="14" r="2.4" fill="#5a1018"/>` +
    // Jaw, teeth, tongue and beard.
    `<g class="ln-jaw"><path d="M-58 38Q0 30 58 38Q64 82 0 92Q-64 82 -58 38Z" fill="#3b0a10" stroke="${GOLD}" stroke-width="3"/>` +
    `<path d="M-40 40L-34 54L-28 40ZM-14 38L-8 52L-2 38ZM10 38L16 52L22 38ZM32 40L38 54L44 40Z" fill="${CREAM}"/>` +
    '<ellipse cy="76" rx="26" ry="9" fill="#d8728c"/></g>' +
    `<path d="M-52 86Q-60 112 -44 122Q-40 112 -34 116Q-30 130 -18 134Q-14 122 -6 120Q2 134 12 132Q16 118 22 118Q34 130 44 122Q40 106 52 88Z" fill="${CREAM}"/>` +
    '<path class="ln-menv" transform="translate(58 24) rotate(-24)" d="M-11 -15H11V15H-11Z" fill="#c4202c" stroke="#e8b23a" stroke-width="2"/>'
  )
}

/** The pole, the red envelope hung high with a lettuce, and the string of it. */
function pole(): string {
  return (
    '<path d="M424 958V372Q424 330 380 330" fill="none" stroke="#5a341c" stroke-width="7" stroke-linecap="round"/>' +
    `<path d="M380 332V392" stroke="${GOLD}" stroke-width="1.6"/>` +
    '<g transform="translate(380 392)"><g class="ln-envs"><g class="ln-envw">' +
    '<ellipse cx="-12" cy="8" rx="16" ry="7" fill="#2f8a4f" transform="rotate(-30 -12 8)"/><ellipse cx="12" cy="8" rx="16" ry="7" fill="#3f9a5a" transform="rotate(30 12 8)"/>' +
    '<rect x="-22" y="14" width="44" height="60" rx="3" fill="#c4202c" stroke="#e8b23a" stroke-width="2"/>' +
    `<path d="M-22 14L0 38L22 14" fill="none" stroke="${GOLD_DIM}" stroke-width="2"/>` +
    `<circle cy="50" r="8" fill="none" stroke="${GOLD}" stroke-width="2"/><path d="M-4 50H4M0 46V54" stroke="${GOLD}" stroke-width="2"/>` +
    `<path d="M0 74V88" stroke="${GOLD}" stroke-width="2"/><path d="M-4 88H4L3 100H-3Z" fill="${GOLD}"/></g></g></g>`
  )
}

/** The lion, its cloth body and the front dancer's legs. Origin = the head's center at (300, 700). */
function lion(): string {
  const stripes = [30, 80, 130, 180]
    .map(x => `<path d="M${x} -150Q${x + 20} -60 ${x} 40" fill="none" stroke="${RED}" stroke-width="12" stroke-opacity=".85"/>`)
    .join('')
  const fringe = `<path d="M0 54Q60 66 120 52T240 54" fill="none" stroke="${CREAM}" stroke-width="9" stroke-dasharray="3 5" stroke-opacity=".8"/>`

  return (
    // The body cloth, anchored at its rear foot (-290, 150).
    '<g transform="translate(-290 150)">' +
    // The rear dancer's legs.
    '<path d="M40 54V100M82 54V100" stroke="#2a1014" stroke-width="20"/><path d="M30 100H52M72 100H94" stroke="#0e0608" stroke-width="9" stroke-linecap="round"/>' +
    '<g class="ln-cl">' +
    `<path d="M0 -104Q100 -176 246 -204V52Q180 64 120 50T0 62Z" fill="#a8761f" stroke="${GOLD}" stroke-width="2.4" stroke-linejoin="round"/>` +
    stripes +
    `<path d="M20 -108Q120 -170 240 -196" fill="none" stroke="#1f9d6b" stroke-width="10" stroke-opacity=".9"/>` +
    fringe +
    `<path d="M0 -104Q-40 -112 -52 -86Q-30 -92 0 -80Z" fill="${CREAM}"/></g></g>` +
    // The front: legs, bib and the head.
    '<g class="ln-fr"><g class="ln-lsw">' +
    '<path d="M-30 204V246M28 204V246" stroke="#c9a13c" stroke-width="24"/><path d="M-42 248H-16M16 248H42" stroke="#0e0608" stroke-width="9" stroke-linecap="round"/>' +
    `<path d="M-72 66Q-84 150 -66 206H66Q84 150 72 66Z" fill="${RED}" stroke="${GOLD}" stroke-width="3"/>` +
    `<path d="M-50 100H50M-56 140H56" stroke="${GOLD}" stroke-width="5" stroke-dasharray="10 8"/>` +
    `<g class="ln-hd">${lionHead()}</g></g></g>`
  )
}

/** The drum, its stand, the drummer and the rings of each beat. */
function drummer(): string {
  const arm = (x: number, cls: string, delay: number) =>
    `<g transform="translate(${x} 806)"><g class="ln-ar ${cls}" style="animation-delay:${delay}s">` +
    `<path d="M0 0V44" stroke="#9a1a26" stroke-width="14" stroke-linecap="round"/><circle cy="46" r="7" fill="#b27a58"/>` +
    `<path d="M0 46V84" stroke="${CREAM}" stroke-width="4" stroke-linecap="round"/><circle cy="86" r="4.6" fill="${GOLD}"/></g></g>`
  const rings = [0, 1, 2]
    .map(i => `<ellipse class="ln-ring" cx="100" cy="880" rx="56" ry="15" fill="none" stroke="#f1c86a" stroke-width="3" style="animation-delay:${f(i * 0.6)}s"/>`)
    .join('')

  return (
    // The drummer: a tunic, a head and a small gold-and-red cap.
    '<path d="M66 800Q100 784 134 800L140 884H60Z" fill="#8e1620"/>' +
    `<path d="M70 800L134 868" stroke="${GOLD}" stroke-width="8" stroke-opacity=".85"/>` +
    '<circle cx="100" cy="768" r="22" fill="#b27a58"/>' +
    `<path d="M76 762Q100 728 124 762Z" fill="#a81d29" stroke="${GOLD}" stroke-width="2.4"/><circle cx="100" cy="732" r="5" fill="${GOLD}"/>` +
    // The drum.
    '<path d="M54 950L68 906M146 950L132 906" stroke="#2a150e" stroke-width="7"/>' +
    '<rect x="44" y="880" width="112" height="64" rx="12" fill="#8e1620" stroke="#2a0a0e" stroke-width="2"/>' +
    `<rect x="44" y="892" width="112" height="4" fill="${GOLD}"/><rect x="44" y="928" width="112" height="4" fill="${GOLD}"/>` +
    `<path d="M52 886H148" stroke="${GOLD}" stroke-width="4" stroke-dasharray="1 13" stroke-linecap="round"/>` +
    `<g class="ln-dh"><ellipse cx="100" cy="880" rx="56" ry="15" fill="#c9b68a" stroke="#6a4a24" stroke-width="2"/><ellipse cx="100" cy="880" rx="40" ry="10" fill="none" stroke="#a8844a" stroke-width="2"/></g>` +
    arm(72, '', 0) +
    arm(128, 'r', -0.25) +
    rings
  )
}

/** The laptop in red lacquer and gold. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    `<rect x="246" y="323" width="96" height="7" rx="2" fill="#4a0f16" stroke="${GOLD}" stroke-opacity=".7"/>` +
    keys +
    `<path d="M334 327L360 238L370 240L344 329Z" fill="#5a1219" stroke="${GOLD}" stroke-opacity=".7" stroke-width="1.5"/>` +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>`
  )
}

export function lunarNewYearWorld(): World {
  const next = random(2027)
  const blossomTree =
    blossoms(11, '<path d="M-30 150C60 120 140 140 230 90C300 50 380 70 450 30M230 90C240 140 290 150 320 190M120 132C110 80 150 50 140 10" fill="none" stroke="#3a1d14" stroke-width="7" stroke-linecap="round"/>', [[230, 92], [320, 186], [450, 32], [140, 18], [96, 130], [350, 62], [180, 108]], ['#e58aa4', '#f0a8bc', '#d8728c'], 5, 30)
  const aprTree = blossoms(23, '<path d="M1640 60C1540 90 1470 60 1400 130C1350 180 1320 170 1260 230M1400 130C1420 80 1380 40 1400 -10" fill="none" stroke="#3a2412" stroke-width="7" stroke-linecap="round"/>', [[1400, 130], [1500, 80], [1290, 210], [1400, 20], [1580, 70]], ['#f2c230', '#e8b020', '#f6d460'], 5, 30)
  const stars = Array.from({ length: 10 }, () => `<circle cx="${f(next() * 1600)}" cy="${f(next() * 300)}" r="${f(1 + next() * 1.4)}" fill="#f4e6c0"/>`).join('')
  const lanterns = [0, 1, 2, 3]
    .map(seg =>
      [0.25, 0.5, 0.75]
        .map((t, k) => {
          const i = seg * 3 + k

          return lantern(-40 + seg * 400 + t * 400, 30 + 120 * t * (1 - t), 0.9, -i * 0.7, i === 4 ? 'ln-loose' : '', true)
        })
        .join(''),
    )
    .join('')
  const skyLanterns = Array.from({ length: 8 }, (_, i) => {
    const x = 120 + i * 190 + next() * 60

    return `<g transform="translate(${f(x)} ${f(980)}) scale(1.4)"><g class="ln-sky" style="--d:${f(i * 0.32)}s;--dx:${f((next() - 0.5) * 160)}px"><circle cy="-8" r="26" fill="url(#ln-gl)"/><path d="M-12 -22H12L15 6H-15Z" fill="#f08a3a" fill-opacity=".92"/><path d="M-12 -22H12" stroke="#ffd98a" stroke-width="2"/></g></g>`
  }).join('')
  const bursts = [
    [150, 190, 0.5, '#f6c453'],
    [1390, 150, 1.9, '#ee8aa6'],
    [330, 100, 3.3, '#f6e2a0'],
    [1500, 270, 4.7, '#f6c453'],
  ]
    .map(([x, y, d, c]) => {
      const rays = Array.from({ length: 10 }, (_, k) => {
        const a = (k / 10) * Math.PI * 2

        return `<path d="M${f(Math.cos(a) * 34)} ${f(Math.sin(a) * 34)}L${f(Math.cos(a) * 90)} ${f(Math.sin(a) * 90)}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`
      }).join('')

      return `<g transform="translate(${x} ${y}) scale(1.5)"><g class="ln-fw" style="--d:${d}s"><circle r="34" fill="url(#ln-gl)"/>${rays}</g></g>`
    })
    .join('')
  const petals = Array.from({ length: 12 }, (_, i) => {
    const x = 60 + i * 128 + next() * 40

    return `<g transform="translate(${f(x)} 0)"><g class="ln-pt" style="--d:${f(next() * 3)}s;--t:${f(6 + next() * 3)}s"><path class="ln-ps" style="animation-delay:${f(-next() * 2)}s" d="M0 0Q8 -6 10 2Q4 8 0 0Z" fill="${i % 2 ? '#f0a8bc' : '#f6c8d4'}" transform="scale(1.6)"/></g></g>`
  }).join('')
  const pops = [0, 1, 2, 3]
    .map(i => `<g transform="translate(100 ${470 + i * 54})"><g class="ln-pop" style="--d:${f(i * 0.4)}s"><g transform="scale(1.7)"><path d="M0 -14L4 -4L14 0L4 4L0 14L-4 4L-14 0L-4 -4Z" fill="#ffd98a"/><circle r="6" fill="#ff8a2a"/></g></g></g>`)
    .join('')
  const smoke = [0, 1, 2, 3, 4, 5]
    .map(i => `<circle class="ln-sm" cx="${100 + (i % 2) * 8}" cy="${500 + i * 28}" r="15" fill="#9a8a86" style="--d:${f(i * 0.4)}s"/>`)
    .join('')
  const glints = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(60 + i * 120 + next() * 40)}" cy="${f(965 + next() * 20)}" rx="${f(30 + next() * 30)}" ry="3" fill="#e8a040" fill-opacity=".12"/>`).join('')
  const kite =
    '<g class="ln-kite"><g class="ln-kt"><path d="M0 -42L28 0L0 52L-28 0Z" fill="#c4202c" stroke="#e8b23a" stroke-width="2"/><path d="M0 -42V52M-28 0H28" stroke="#e8b23a" stroke-width="1.6"/><path d="M0 -42L28 0H0Z" fill="#e8b23a" fill-opacity=".8"/>' +
    '<path d="M0 52Q-14 70 0 88T0 124T0 160" fill="none" stroke="#e8b23a" stroke-width="3"/><path d="M-6 74H6M-7 106H7M-6 140H6" stroke="#c4202c" stroke-width="5"/></g></g>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#0a0405',
      furniture: LACQUER,
      metal: GOLD,
      paper: CREAM,
      light: { idle: '#b88a48', work: '#ffcf5a', bright: '#ffe9a8' },
      headTop: 210,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // The small red-and-gold hat; the eyes stay clear below it.
          `<path d="M104 240C104 222 120 210 152 210C184 210 198 222 198 240Z" fill="#a8192a" stroke="${GOLD}" stroke-width="2"/>` +
          `<path d="M104 237H198" stroke="${GOLD}" stroke-width="5"/><circle cx="152" cy="205" r="7" fill="${GOLD}"/>` +
          `<path d="M120 222Q152 214 184 222" fill="none" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2"/>` +
          `<path class="ln-tas" d="M198 234Q214 238 210 262" fill="none" stroke="#c4202c" stroke-width="3"/><circle cx="210" cy="264" r="3.6" fill="${GOLD}"/>` +
          // The red silk scarf below the eyes, a knot and two tails on the far side.
          '<path d="M70 318H230V332H70Z" fill="#b01c28"/>' +
          `<path d="M70 322H230" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="6 5"/>` +
          '<circle cx="82" cy="326" r="9" fill="#c4202c"/>' +
          '<path class="ln-tail" d="M78 332L64 372L78 366L84 380L92 336Z" fill="#b01c28"/>',
      },
      seatArt:
        `<ellipse cx="151" cy="353" rx="46" ry="8" fill="#a0182a" stroke="${GOLD}" stroke-width="2"/>` +
        `<path d="M110 362Q100 410 112 456H190Q202 410 192 362Z" fill="${RED_DARK}" stroke="#2a0a0e" stroke-width="2"/>` +
        `<path d="M104 384H198M104 436H198" stroke="${GOLD}" stroke-width="4" stroke-opacity=".85"/>` +
        `<path d="M112 372H192" stroke="${GOLD}" stroke-width="3" stroke-dasharray="1 12" stroke-linecap="round"/>` +
        `<path d="M112 458H190" stroke="${GOLD}" stroke-width="3" stroke-opacity=".6"/>`,
      tableArt:
        `<rect x="166" y="330" width="304" height="13" rx="3" fill="${LACQUER}" stroke="${GOLD}" stroke-opacity=".8" stroke-width="2"/>` +
        '<path d="M170 333H466" stroke="#d4343c" stroke-opacity=".35" stroke-width="2"/>' +
        `<path d="M186 343H450V362H186Z" fill="#3a0b11" stroke="${GOLD}" stroke-opacity=".6" stroke-width="1.6"/>` +
        `<path d="M200 352H248M268 352H316M336 352H384M404 352H436" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" stroke-opacity=".8"/>` +
        `<path d="M196 362C190 392 196 430 190 456H208C204 430 210 392 212 362ZM426 362C420 392 426 430 420 456H438C434 430 440 392 442 362Z" fill="${LACQUER}" stroke="${GOLD}" stroke-opacity=".5"/>` +
        // The tray of candied fruit.
        `<ellipse cx="392" cy="327" rx="28" ry="5" fill="${GOLD}"/><ellipse cx="392" cy="325" rx="25" ry="3.6" fill="#7a5a1c"/>` +
        ['#c8352e', '#e8872a', '#6aa84f', '#efe0c0', '#e07890', '#7a4a2a', '#e8872a']
          .map((c, i) => `<circle cx="${372 + i * 6.6}" cy="${i % 2 ? 320 : 322}" r="4.6" fill="${c}"/>`)
          .join(''),
    },
    style:
      '.ln-sw{animation:ln-sw 4.6s ease-in-out infinite alternate;animation-delay:var(--d,0s)}' +
      '@keyframes ln-sw{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .ln-sw{animation-duration:2.4s}' +
      '.st-error .ln-loose{animation:ln-loose 1.7s ease-in-out infinite alternate;animation-delay:0s}' +
      '@keyframes ln-loose{from{transform:rotate(-38deg) translateY(10px)}to{transform:rotate(26deg) translateY(10px)}}' +
      '.ln-bl{animation:ln-bl 8s ease-in-out infinite alternate}@keyframes ln-bl{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}' +
      '.ln-wa{animation:ln-win 5s ease-in-out infinite alternate}.ln-wb{animation:ln-win 6.5s ease-in-out infinite alternate-reverse}' +
      '@keyframes ln-win{from{opacity:.3}to{opacity:.62}}' +
      '.ln-st{animation:ln-win 4s ease-in-out infinite alternate}' +
      '.ln-tas,.ln-tail{transform-box:fill-box;transform-origin:50% 0;animation:ln-tas 1.8s ease-in-out infinite alternate}' +
      '@keyframes ln-tas{from{transform:rotate(-8deg)}to{transform:rotate(10deg)}}' +
      // The lion: sway, breath, blink, jaw; head shake and leaps when a command runs.
      '.ln-lsw{transform-origin:0 250px;animation:ln-lsw 5s ease-in-out infinite alternate}@keyframes ln-lsw{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}' +
      '.ln-hd{transform-box:fill-box;transform-origin:50% 100%;animation:ln-breath 3.8s ease-in-out infinite alternate}@keyframes ln-breath{to{transform:scale(1.02,1.035)}}' +
      '.ln-lid{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.04);animation:ln-blink 5.4s ease-in-out infinite}' +
      '@keyframes ln-blink{0%,90%,100%{transform:scaleY(.04)}94%{transform:scaleY(1)}}' +
      '.ln-jaw{transform-box:fill-box;transform-origin:50% 0;animation:ln-jaw 4s ease-in-out infinite}@keyframes ln-jaw{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.08)}}' +
      '.st-run .ln-hd{transform-origin:50% 85%;animation:ln-shake .34s ease-in-out infinite alternate}@keyframes ln-shake{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}' +
      '.st-run .ln-jaw{animation:ln-chomp .34s ease-in-out infinite alternate}@keyframes ln-chomp{to{transform:scaleY(1.35)}}' +
      '.st-run .ln-fr{animation:ln-run 5s ease-in-out infinite}' +
      '@keyframes ln-run{0%,2%{transform:translate(0,0)}8%{transform:translate(0,-36px) rotate(-3deg)}14%{transform:translate(0,0)}20%{transform:translate(0,-36px) rotate(3deg)}26%{transform:translate(0,0)}' +
      '32%{transform:translate(0,-36px) rotate(-3deg)}38%{transform:translate(0,0)}44%{transform:translate(0,-60px) rotate(-8deg)}54%,72%{transform:translate(10px,-270px) rotate(-20deg)}84%{transform:translate(0,-30px)}92%,100%{transform:translate(0,0)}}' +
      '.st-run .ln-cl{animation:ln-cloth 5s ease-in-out infinite}' +
      '@keyframes ln-cloth{0%,2%{transform:skewY(0)}8%{transform:skewY(-4deg)}14%{transform:skewY(0)}20%{transform:skewY(-4deg)}26%{transform:skewY(0)}32%{transform:skewY(-4deg)}38%{transform:skewY(0)}' +
      '44%{transform:skewY(-12deg)}54%,72%{transform:skewY(-48deg)}84%{transform:skewY(-6deg)}92%,100%{transform:skewY(0)}}' +
      '.ln-menv{opacity:0}.st-run .ln-menv{animation:ln-menv 5s linear infinite}@keyframes ln-menv{0%,52%{opacity:0}55%,72%{opacity:1}75%,100%{opacity:0}}' +
      '.st-run .ln-envs{animation:ln-envs 5s linear infinite}@keyframes ln-envs{0%,52%{opacity:1}55%,90%{opacity:0}100%{opacity:1}}' +
      '.ln-envw{animation:ln-envw 3.2s ease-in-out infinite alternate}@keyframes ln-envw{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      // The drummer: slow in idle, steady in run, fast in tool.
      '.ln-ar{--a:12deg;animation:ln-hit 1.7s ease-in-out infinite alternate}.ln-ar.r{--a:-12deg}' +
      '@keyframes ln-hit{to{transform:rotate(var(--a))}}' +
      '.st-run .ln-ar{--a:34deg;animation-duration:.5s}.st-run .ln-ar.r{--a:-34deg}' +
      '.st-tool .ln-ar{--a:30deg;animation-duration:.22s}.st-tool .ln-ar.r{--a:-30deg}' +
      '.ln-dh{transform-box:fill-box;transform-origin:center}.st-tool .ln-dh{animation:ln-dh .22s ease-in-out infinite alternate}@keyframes ln-dh{to{transform:scale(1.025)}}' +
      '.ln-ring{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .ln-ring,.st-tool .ln-ring{animation:ln-ring 1.8s ease-out infinite}' +
      '@keyframes ln-ring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(2.8)}}' +
      '.st-tool .ln-ring{animation-duration:.9s}' +
      // The kite.
      '.ln-kite{opacity:0}.st-web .ln-kite{animation:ln-kite 6.5s linear infinite}' +
      '@keyframes ln-kite{0%{opacity:0;transform:translate(1760px,300px) rotate(-12deg)}6%{opacity:.95}94%{opacity:.95}100%{opacity:0;transform:translate(-220px,170px) rotate(8deg)}}' +
      '.ln-kt{animation:ln-kt 1.1s ease-in-out infinite alternate}@keyframes ln-kt{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}' +
      // Error: a firecracker string sputters (at most 2.5 pops a second) and a lantern hangs loose.
      '.ln-pop,.ln-sm{opacity:0}' +
      '.st-error .ln-pop{animation:ln-pop 1.6s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes ln-pop{0%{opacity:0;transform:scale(.2)}8%{opacity:.9;transform:scale(.8)}30%,100%{opacity:0;transform:scale(1.5)}}' +
      '.ln-sm{transform-box:fill-box;transform-origin:center}' +
      '.st-error .ln-sm{animation:ln-sm 2.4s ease-out infinite;animation-delay:var(--d)}' +
      '@keyframes ln-sm{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.38}100%{opacity:0;transform:translate(14px,-90px) scale(2.2)}}' +
      // Done: sky lanterns rise, small fireworks open one by one, petals swirl down.
      '.ln-sky,.ln-fw,.ln-pt{opacity:0}' +
      '.st-done .ln-sky{animation:ln-rise 9s ease-out both;animation-delay:var(--d)}' +
      '@keyframes ln-rise{0%{opacity:0;transform:translate(0,0)}12%{opacity:.85}85%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-1250px)}}' +
      '.st-done .ln-fw{animation:ln-fw 2.2s ease-out both;animation-delay:var(--d)}' +
      '@keyframes ln-fw{0%{opacity:0;transform:scale(.15)}14%{opacity:.95}100%{opacity:0;transform:scale(1.05)}}' +
      '.st-done .ln-pt{animation:ln-fall var(--t) linear both;animation-delay:var(--d)}' +
      '@keyframes ln-fall{0%{opacity:0;transform:translateY(-60px)}10%{opacity:.9}90%{opacity:.8}100%{opacity:0;transform:translateY(1080px)}}' +
      '.ln-ps{animation:ln-ps 1.8s ease-in-out infinite alternate}@keyframes ln-ps{from{transform:translateX(-50px) rotate(-40deg) scale(1.6)}to{transform:translateX(50px) rotate(60deg) scale(1.6)}}',
    scenery:
      '<defs><linearGradient id="ln-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07040a"/><stop offset=".55" stop-color="#150a10"/><stop offset="1" stop-color="#2a1210"/></linearGradient>' +
      '<radialGradient id="ln-gl"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".42"/><stop offset=".5" stop-color="#e8502a" stop-opacity=".14"/><stop offset="1" stop-color="#e8502a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ln-lb"><stop offset="0" stop-color="#e8483a"/><stop offset="1" stop-color="#8e1620"/></radialGradient>' +
      '<linearGradient id="ln-dim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#070307" stop-opacity="0"/><stop offset=".26" stop-color="#070307" stop-opacity=".5"/><stop offset=".74" stop-color="#070307" stop-opacity=".5"/><stop offset="1" stop-color="#070307" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ln-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1208"/><stop offset="1" stop-color="#8a4a1c"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#ln-sky)"/>' +
      `<g class="ln-st">${stars}</g>` +
      town() +
      '<rect y="950" width="1600" height="60" fill="#0d0608"/>' +
      glints +
      lanterns +
      '<rect x="380" width="840" height="1000" fill="url(#ln-dim)"/>' +
      // The old house at the left, with its tiled eave, the pillars, the door and couplets of invented marks.
      '<rect x="-20" y="440" width="410" height="520" fill="#1a0a0d"/>' +
      '<rect x="20" y="450" width="22" height="500" fill="#3a0f14"/><rect x="338" y="450" width="22" height="500" fill="#3a0f14"/>' +
      '<path d="M130 960V570Q190 530 250 570V960Z" fill="url(#ln-door)"/>' +
      `<path d="M-40 452Q60 440 190 380Q320 440 430 452L412 476H-22Z" fill="#2b1014" stroke="${GOLD_DIM}" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="M-22 466H412" stroke="${GOLD_DIM}" stroke-opacity=".6" stroke-width="3" stroke-dasharray="6 6"/>` +
      `<path d="M170 380Q190 350 210 380" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
      '<rect x="62" y="570" width="24" height="250" fill="#8e1620"/><rect x="300" y="570" width="24" height="250" fill="#8e1620"/>' +
      `<path d="M74 600V620M66 612H82M74 660V690M66 674H82M74 730V760M66 745H82M312 600V620M304 612H320M312 660V690M304 674H320M312 730V760M304 745H320" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>` +
      lantern(56, 490, 1.15, -1, '', true) +
      lantern(336, 490, 1.15, -2.2, '', true) +
      crackers(44, 478, 130) +
      crackers(100, 478, 170) +
      crackers(156, 478, 120) +
      crackers(212, 478, 100) +
      pops +
      smoke +
      '<g class="mv-r">' +
      `<path d="M1340 440Q1470 428 1610 380V470H1330Z" fill="#2b1014" stroke="${GOLD_DIM}" stroke-opacity=".4" stroke-width="2"/>` +
      crackers(1400, 466, 90) +
      crackers(1470, 466, 130) +
      crackers(1540, 466, 100) +
      '</g>' +
      `<g class="ln-bl" style="transform-origin:-30px 150px">${blossomTree}</g>` +
      '<g class="mv-r"><g class="mv-t">' +
      `<g class="ln-bl" style="transform-origin:1640px 60px">${aprTree}</g></g></g>` +
      pole() +
      // The lion at the left, the drum in front of its body.
      '<g transform="translate(300 700)">' +
      lion() +
      '</g>' +
      drummer() +
      '<path d="M-20 950H1700" stroke="#2a1214" stroke-width="3"/>' +
      kite +
      skyLanterns +
      bursts +
      petals,
    nook:
      // The pot of yellow apricot blossoms beside the desk, and a hanging red diamond and two lanterns above it.
      `<path d="M-14 456L-8 412H34L40 456Z" fill="#7a1a22" stroke="${GOLD}" stroke-width="2"/><path d="M-10 428H36" stroke="${GOLD}" stroke-width="3"/>` +
      `<g class="ln-bl" style="transform-origin:14px 410px">${blossoms(31, '<path d="M14 412C10 340 -10 290 -40 240M-14 322C-30 300 -60 296 -76 270M-8 290C10 250 8 200 -4 160" fill="none" stroke="#3a2412" stroke-width="5" stroke-linecap="round"/>', [[-40, 240], [-76, 268], [-4, 164], [-14, 322], [4, 220]], ['#f2c230', '#e8b020', '#f6d460'], 5, 22)}</g>` +
      lantern(236, -250, 0.9, -0.6) +
      lantern(372, -330, 0.8, -1.9) +
      '<g transform="translate(304 -150)"><g class="ln-sw" style="--d:-1.1s"><path d="M0 0V16" stroke="#e8b23a" stroke-width="2"/>' +
      `<path d="M0 16L24 44L0 72L-24 44Z" fill="#c4202c" stroke="${GOLD}" stroke-width="2"/><path d="M-6 44H6M0 38V50" stroke="${GOLD}" stroke-width="2.4"/>` +
      `<path d="M0 72V100" stroke="${GOLD}" stroke-width="2"/><path d="M-5 100H5L3 118H-3Z" fill="#c4202c"/></g></g>`,
  }
}
