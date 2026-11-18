import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Jazz Night: a pianist in a fedora plays a grand piano on a hilltop overlook at blue hour, a whole city of lights
// spread out in the valley below. A lamp post and a bench stand on the crest under a violet afterglow and the first
// stars. A command sets the lantern swinging while two tiny dancers twirl beneath it and glowing notes drift up; an
// error brings rain and drops the piano lid; done brightens the stars and sends shooting stars across.
const PERI = '#8aa4ff'
const LAMP = '#ffd590'
const AMBER = '#ffc46e'
const WARM = '#ffe8c2'
const COOL = '#c4d0ff'
const LACQ = '#0c0e22'
const RIM = '#2e3466'
const GOLD = '#c9a45a'
const HILL = '#05061a'
const IRON = '#0a0b1e'

/** Two decimals, for opacities. */
const a2 = (value: number): string => String(Math.round(value * 100) / 100)

/** A circle as a path piece, so many of them make one element. */
const disc = (cx: number, cy: number, r: number): string =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`

/** An ellipse as a path piece. */
const oval = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`

/** A rectangle as a path piece. */
const box = (x: number, y: number, w: number, h: number): string => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`

/** A city-light colour across the picture, dimmed where the chat column runs. */
const fade = (id: string, color: string, mid: number): string =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">` +
  `<stop offset=".22" stop-color="${color}"/><stop offset=".3" stop-color="${color}" stop-opacity="${mid}"/>` +
  `<stop offset=".7" stop-color="${color}" stop-opacity="${mid}"/><stop offset=".78" stop-color="${color}"/></linearGradient>`

const halo = (id: string, color: string, alpha: number): string =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${alpha}"/>` +
  `<stop offset=".45" stop-color="${color}" stop-opacity="${a2(alpha * 0.35)}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`

/** The valley's lights: dotted streets in perspective, avenues fanning out, scattered windows, far towers, highways. */
function city(next: () => number): string {
  const rows = ['', '', '', '']

  for (let k = 0; k < 15; k += 1) {
    const t = (k + 0.5) / 15
    const y = 556 + 290 * t ** 1.7
    const s = 0.4 + 1.4 * t
    const points: string[] = []

    for (let x = -40; x <= 1640; x += 210) points.push(`${x} ${f(y + Math.sin(x * 0.006 + k * 1.9) * 3 * s)}`)

    const dash = Array.from({ length: 7 }, () => `.01 ${f((next() < 0.18 ? 30 + next() * 70 : 3 + next() * 7) * s)}`).join(' ')

    rows[(k % 2) * 2 + ((k >> 1) % 2)] +=
      `<polyline points="${points.join(' ')}" stroke-width="${f(1.1 + 1.9 * t)}" stroke-dasharray="${dash}"/>`
  }

  const avenues = Array.from({ length: 14 }, (_, i) => {
    const bottom = -1500 + (i * 4600) / 13 + (next() - 0.5) * 160
    const at = (y: number) => 800 + ((y - 490) / 510) * (bottom - 800)

    return `M${f(at(560))} 560L${f(at(880))} 880`
  }).join('')
  const windows = (count: number) =>
    Array.from({ length: count }, () => {
      const t = next() ** 1.6
      const size = 0.9 + 1.8 * t

      return `M${f(next() * 1600)} ${f(556 + 280 * t)}h${f(size)}v${f(size)}h-${f(size)}z`
    }).join('')
  let towers = ''
  let lit = ''

  for (const [x, w, h] of [
    [168, 12, 46],
    [184, 10, 64],
    [198, 12, 38],
    [352, 10, 52],
    [366, 8, 34],
    [1268, 12, 50],
    [1286, 10, 72],
    [1304, 12, 44],
    [1470, 10, 40],
  ] as const) {
    towers += box(x, 562 - h, w, h + 4)

    for (let r = 0; r * 6 + 6 < h; r += 1) {
      for (let c = 0; c * 4 + 3 < w; c += 1) {
        if (next() < 0.45) lit += `M${f(x + 1.5 + c * 4)} ${562 - h + 4 + r * 6}h1.6v1.8h-1.6z`
      }
    }
  }

  const roads =
    'M-40 622C260 610 520 652 800 664S1320 692 1640 672M40 790C150 730 250 690 400 650S640 598 820 578M1640 770C1520 730 1430 690 1300 660S1080 610 900 588'
  const sparkles = ['', '']

  for (let i = 0; i < 24; i += 1) {
    const side = i % 5
    const t = next() ** 1.4
    const x = side < 2 ? next() * 420 : side < 4 ? 1180 + next() * 420 : 420 + next() * 760
    const y = side < 2 ? 558 + 160 * t : 558 + 240 * t

    sparkles[i % 3 ? 0 : 1] +=
      `<circle class="jz-tw${i % 2 ? '' : ' jz-tw2'}" style="animation-delay:${f(-next() * 5)}s" cx="${f(x)}" cy="${f(y)}" ` +
      `r="${f(1.3 + 1.7 * t)}"${side === 4 ? ' fill-opacity=".35"' : ''}/>`
  }

  return (
    '<g class="jz-city">' +
    '<ellipse cx="220" cy="562" rx="380" ry="36" fill="url(#jz-hz)"/><ellipse cx="1400" cy="558" rx="320" ry="30" fill="url(#jz-hz)"/>' +
    '<ellipse cx="800" cy="562" rx="400" ry="24" fill="url(#jz-hz)" opacity=".35"/>' +
    `<path d="${towers}" fill="#0b0d2c"/><path d="${lit}" fill="${AMBER}" fill-opacity=".75"/>` +
    '<circle class="jz-bk" cx="1291" cy="488" r="2" fill="#ff7a7a"/>' +
    '<g fill="none" stroke-linecap="round">' +
    `<g class="jz-ra" stroke="url(#jz-ca)">${rows[0]}</g><g class="jz-rb" stroke="url(#jz-ca)">${rows[1]}</g>` +
    `<g class="jz-rb" stroke="url(#jz-cw)">${rows[2]}</g><g class="jz-ra" stroke="url(#jz-cw)">${rows[3]}</g>` +
    `<path d="${avenues}" stroke="url(#jz-cw)" stroke-width="1.3" stroke-dasharray=".01 5.4" opacity=".8"/>` +
    `<path d="${roads}" stroke="url(#jz-ca)" stroke-opacity=".16" stroke-width="7"/>` +
    `<path class="jz-hl" d="${roads}" stroke="url(#jz-cw)" stroke-width="2.4" stroke-dasharray=".01 9.99"/>` +
    `<path class="jz-tl" d="${roads}" stroke="url(#jz-cr)" stroke-width="2.2" stroke-dasharray=".01 12.99"/>` +
    '</g>' +
    `<path d="${windows(70)}" fill="url(#jz-ca)"/><path d="${windows(36)}" fill="url(#jz-cb)"/>` +
    `<g fill="${AMBER}">${sparkles[0]}</g><g fill="${WARM}">${sparkles[1]}</g>` +
    '</g>'
  )
}

/** Two tiny dancers, drawn in one colour: the lead, and the partner who twirls under their joined hands. */
function dancers(color: string): string {
  return (
    `<g stroke="${color}" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
    '<path d="M0 -40V-21L-5 0M0 -21L5 -1M0 -38L11 -57M0 -36L-8 -26" stroke-width="4.6"/>' +
    '<path d="M22 -38L11 -57" stroke-width="3.6"/></g>' +
    `<circle cy="-46" r="4.8" fill="${color}"/>` +
    `<g class="jz-spin"><path d="M22 -39V-28" stroke="${color}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M19 -30H25L37 -9L8 -6Z" fill="${color}"/>` +
    `<path d="M18 -7L17 0M26 -8L28 -1" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="22" cy="-44" r="4.2" fill="${color}"/></g>`
  )
}

/** Glowing notes: soft dots that rise and sway, already in flight when the state begins. */
function notes(next: () => number, count: number, box: [number, number, number, number], rise: [number, number], drift: [number, number]): string {
  const [x0, y0, w, h] = box

  return Array.from({ length: count }, (_, i) => {
    const x = f(x0 + next() * w)
    const y = f(y0 + next() * h)
    const style =
      `--dx:${f(drift[0] + next() * (drift[1] - drift[0]))}px;--dy:${f(-(rise[0] + next() * (rise[1] - rise[0])))}px;` +
      `animation-delay:${f((-i * 3.6) / count)}s`

    return (
      `<g class="jz-nt" style="${style}"><g class="jz-nx${i % 2 ? ' jz-nx2' : ''}">` +
      `<circle cx="${x}" cy="${y}" r="15" fill="url(#${i % 2 ? 'jz-nw' : 'jz-ng'})"/><circle cx="${x}" cy="${y}" r="3.2"/></g></g>`
    )
  }).join('')
}

/** The laptop on the piano's front, its light thrown up onto the lid while the lid is open. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'run' || activity === 'tool' || activity === 'web'
  const keys = `<path d="${Array.from({ length: 7 }, (_, i) => box(254 + i * 11, 313, 7, 2.4)).join('')}" fill="${light}" fill-opacity=".55"/>`

  return (
    (activity === 'error' ? '' : `<path d="M358 252C380 256 398 266 410 282L404 290C392 276 378 268 358 264Z" fill="${light}" fill-opacity=".12"/>`) +
    '<path d="M244 318L248 310H338L342 318Z" fill="#2a2e4c"/>' +
    keys +
    '<path d="M334 316L348 236L356 238L342 318Z" fill="#2a2e4c"/>' +
    `<path d="M336 314L349 240L352.5 241L339 315Z" fill="${light}"/>` +
    `<path d="M336 314L349 240L337 245L320 314Z" fill="${light}" fill-opacity="${busy ? '.24' : '.15'}"/>`
  )
}

export function jazzNightWorld(): World {
  const next = random(23)
  const still = ['', '', '']
  let twinkling = ''

  for (let i = 0; i < 50; i += 1) {
    const x = next() * 1600
    const y = next() ** 1.3 * 470
    const alpha = (0.3 + next() * 0.6) * (x > 420 && x < 1180 ? 0.65 : 1)

    if (i % 6 === 0) {
      const delay = f(-next() * 4)

      twinkling += `<circle class="jz-tw${i % 12 ? '' : ' jz-tw2'}" style="animation-delay:${delay}s" cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + next() * 1.2)}" opacity="${f(alpha)}"/>`
    } else {
      still[alpha < 0.42 ? 0 : alpha < 0.62 ? 1 : 2] += disc(x, y, 0.6 + next() * 1.2)
    }
  }

  const stars = still.map((d, i) => `<path d="${d}" opacity="${['.32', '.52', '.76'][i]}"/>`).join('') + twinkling
  const glints = [
    [90, 90, 1],
    [214, 164, 0.8],
    [330, 70, 1.1],
    [150, 276, 0.7],
    [384, 40, 0.6],
    [1222, 72, 0.6],
    [1262, 146, 0.9],
    [1404, 62, 1.1],
    [1526, 206, 0.8],
    [1346, 290, 0.7],
  ]
    .map(
      ([x, y, s], i) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><g class="jz-glint" style="animation-delay:${f(0.15 + i * 0.13)}s">` +
        '<circle r="12" fill="url(#jz-sg)"/><path d="M0 -10L1.6 -1.6L10 0L1.6 1.6L0 10L-1.6 1.6L-10 0L-1.6 -1.6Z" fill="#eef2ff"/></g></g>',
    )
    .join('')
  const shooting = (x: number, y: number, angle: number, travel: number, delay: number) =>
    `<g transform="translate(${x} ${y}) rotate(${angle})"><g class="jz-ss" style="--l:${travel}px;animation-delay:${delay}s">` +
    '<path d="M-160 -.6L0 -1.8V1.8L-160 .6Z" fill="url(#jz-ssg)"/><circle r="8" fill="url(#jz-sg)"/><circle r="2.2" fill="#fff"/></g></g>'
  const nodes: [number, number][] = [
    [70, 112],
    [140, 76],
    [214, 100],
    [262, 160],
    [226, 226],
    [150, 214],
    [104, 162],
    [322, 62],
  ]
  const constellation =
    '<g class="jz-con">' +
    `<path class="jz-cline" pathLength="1" d="M70 112L140 76L214 100L262 160L226 226L150 214L104 162L70 112M214 100L322 62" fill="none" stroke="${PERI}" stroke-opacity=".55" stroke-width="1.3"/>` +
    nodes.map(([x, y], i) => `<circle class="jz-cnode" style="animation-delay:${f(0.2 + i * 0.3)}s" cx="${x}" cy="${y}" r="2.4" fill="#e6ecff"/>`).join('') +
    '</g>'
  const wisps =
    `<path d="${oval(200, 400, 260, 9)}${oval(1380, 380, 240, 8)}" fill="#5a4a9a" fill-opacity=".28"/>` +
    `<path d="${oval(430, 440, 180, 6)}${oval(1240, 424, 160, 5)}${oval(780, 330, 320, 7)}${oval(120, 300, 160, 5)}" fill="#5a4a9a" fill-opacity=".16"/>`
  const storm = [
    [-40, 60, 380, 130],
    [300, 24, 380, 120],
    [720, 44, 440, 124],
    [1110, 28, 400, 124],
    [1500, 70, 380, 140],
    [180, 190, 340, 74],
    [1330, 210, 320, 74],
    [760, 170, 360, 60],
  ]
    .map(([x, y, rx, ry]) => oval(x!, y!, rx!, ry!))
    .join('')
  const beam = (x: number, y: number, delay: number) =>
    `<g transform="translate(${x} ${y})"><g class="jz-bsw" style="animation-delay:${delay}s"><path d="M-4 0L-48 -640H48L4 0Z" fill="url(#jz-bm)"/></g></g>`
  const flies = Array.from(
    { length: 8 },
    () =>
      `<g transform="translate(${f(20 + next() * 240)} ${f(470 + next() * 250)})">` +
      `<g class="jz-fly" style="--dx:${f((next() - 0.5) * 70)}px;--dy:${f((next() - 0.5) * 44)}px;--t:${f(2.4 + next() * 2)}s">` +
      `<g class="jz-fg" style="animation-delay:${f(-next() * 2)}s"><circle r="13" fill="url(#jz-nw)"/><circle r="2.6" fill="#fff0b8"/></g></g></g>`,
  ).join('')
  const hillTop =
    'M-40 752C40 736 140 724 240 722C330 720 410 736 480 764C570 800 660 840 780 856C900 870 1040 868 1180 884C1300 898 1440 912 1640 920'
  const crown = [
    [24, 470, 66],
    [92, 496, 52],
    [-24, 530, 58],
    [58, 446, 50],
    [124, 470, 36],
    [0, 420, 44],
    [-40, 470, 40],
    [70, 530, 40],
  ]
    .map(([x, y, r]) => disc(x!, y!, r!))
    .join('')
  const shoulder = 'M-560 470C-420 454 -260 428 -140 394C-40 366 60 326 180 304C290 286 390 280 480 278'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#04050e',
      furniture: LACQ,
      metal: '#2a2e4c',
      paper: '#ece8f6',
      light: { idle: '#6f86d8', work: PERI, bright: '#d4ddff' },
      headTop: 205,
      glowAt: [330, 276],
      device,
      wear: {
        // The fedora sits above the eyes (its brim ends by y 252); a small bow tie sits below them.
        front:
          '<g transform="rotate(-3 150 244)"><g class="jz-hat">' +
          '<path d="M90 242C90 218 96 200 114 197C130 194 140 204 150 203C160 204 170 194 186 197C204 200 210 218 210 242Z" fill="#1b1d3a"/>' +
          '<path d="M140 204C144 213 156 213 160 204" fill="none" stroke="#0c0d20" stroke-width="2"/>' +
          `<path d="M99 234C99 218 104 207 116 203" fill="none" stroke="${PERI}" stroke-opacity=".35" stroke-width="2"/>` +
          '<path d="M90 227C120 232 180 232 210 227V240C180 245 120 245 90 240Z" fill="#5f74c4"/>' +
          '<path d="M48 245C66 234 104 236 150 238C196 236 234 234 252 245C238 252 198 250 150 250C102 250 62 252 48 245Z" fill="#151731" stroke="#2c3262" stroke-width="1.5"/>' +
          `<path d="M54 243C80 238 120 240 150 240C180 240 220 238 246 243" fill="none" stroke="${PERI}" stroke-opacity=".4" stroke-width="1.6"/></g></g>` +
          '<path d="M150 329L136 321V337ZM150 329L164 321V337Z" fill="#0c0d1e"/><rect x="146" y="325" width="8" height="8" rx="2" fill="#262a52"/>',
      },
      seatArt:
        // The piano bench: lacquered legs, an apron, a tufted velvet cushion.
        `<path d="M115 364L119 452M187 364L183 452" stroke="${LACQ}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M117 368L120 448" stroke="${RIM}" stroke-width="1.4"/>` +
        `<circle cx="119" cy="453" r="3" fill="${GOLD}"/><circle cx="183" cy="453" r="3" fill="${GOLD}"/>` +
        `<rect x="107" y="355" width="88" height="11" rx="1.5" fill="${LACQ}" stroke="${RIM}" stroke-width="1.4"/>` +
        '<rect x="103" y="345" width="96" height="11" rx="4" fill="#1c1f3e"/>' +
        `<path d="M109 349H193" stroke="${PERI}" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="2 12" stroke-linecap="round"/>`,
      tableArt:
        // The grand piano: legs, the pedal lyre and the casters.
        `<g fill="${LACQ}" stroke="${RIM}" stroke-width="1.4"><path d="M230 340H248L245 448H233Z"/><path d="M392 350H410L406 448H396Z"/>` +
        '<rect x="309" y="434" width="40" height="8" rx="2"/></g>' +
        `<path d="M322 352V434M336 352V434" stroke="${LACQ}" stroke-width="3"/>` +
        `<path d="${box(313, 442, 7, 3)}${box(325.5, 442, 7, 3)}${box(338, 442, 7, 3)}${disc(239, 452, 4)}${disc(401, 452, 4)}" fill="${GOLD}"/>` +
        // The lid, propped open: its underside, the gold plate inside, the stick in front.
        `<g class="jz-lid"><path d="M258 318L278 222C330 218 384 240 416 284V318Z" fill="#151834" stroke="${RIM}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<path d="M278 222C330 218 384 240 416 284" fill="none" stroke="${PERI}" stroke-opacity=".6" stroke-width="2.4"/>` +
        `<path d="M266 318C296 302 360 296 404 306L412 318Z" fill="${GOLD}" fill-opacity=".38"/>` +
        '<path d="M372 318L362 243" stroke="#07081a" stroke-width="3.2" stroke-linecap="round"/></g>' +
        // The case, its lacquer catching the sky, and the keyboard.
        `<path d="M244 318H398C412 318 418 326 418 334S412 352 398 352H244Z" fill="${LACQ}" stroke="${RIM}" stroke-width="1.6"/>` +
        `<path d="M248 322H404" stroke="${PERI}" stroke-opacity=".45" stroke-width="1.6"/>` +
        `<path d="M252 345C300 349 360 349 404 343" fill="none" stroke="${PERI}" stroke-opacity=".16" stroke-width="1.2"/>` +
        `<rect x="194" y="331" width="56" height="11" rx="1.5" fill="${LACQ}" stroke="${RIM}" stroke-width="1.4"/>` +
        '<rect x="198" y="325" width="50" height="6" fill="#e6e1d2" fill-opacity=".9"/>' +
        `<path d="${[202, 208, 216, 222, 228, 236, 242].map(x => box(x, 325, 3, 4)).join('')}" fill="#0b0c1a"/>` +
        `<rect x="190" y="318" width="8" height="24" rx="2" fill="${LACQ}" stroke="${RIM}" stroke-width="1.2"/>`,
    },
    style:
      '@keyframes jz-in{from{opacity:0}to{opacity:1}}' +
      // Ambient: stars and city lights twinkle, the traffic flows, the lantern sways, the clouds drift, a plane crosses.
      '.jz-tw{animation:jz-tw 3s ease-in-out infinite alternate}.jz-tw2{animation-duration:4.6s}@keyframes jz-tw{from{opacity:.2}to{opacity:1}}' +
      '.jz-stars{opacity:.78}' +
      '.jz-ra{animation:jz-br 5s ease-in-out infinite alternate}.jz-rb{animation:jz-br 7s ease-in-out -3s infinite alternate}' +
      '@keyframes jz-br{from{opacity:.66}to{opacity:1}}' +
      '.jz-cl{animation:jz-cl 70s ease-in-out infinite alternate}@keyframes jz-cl{to{transform:translateX(60px)}}' +
      '.jz-hl{animation:jz-hl 11s linear infinite}@keyframes jz-hl{from{stroke-dashoffset:0}to{stroke-dashoffset:-100}}' +
      '.jz-tl{animation:jz-tl 14s linear infinite}@keyframes jz-tl{from{stroke-dashoffset:0}to{stroke-dashoffset:130}}' +
      '.jz-sw{animation:jz-sw 6s ease-in-out infinite alternate}@keyframes jz-sw{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}' +
      '.jz-lg{animation:jz-lg 4.5s ease-in-out infinite alternate}@keyframes jz-lg{from{opacity:.82}to{opacity:1}}' +
      '.jz-plane{animation:jz-plane 80s linear infinite}@keyframes jz-plane{to{transform:translateX(-1900px)}}' +
      '.jz-bl{animation:jz-bl 1.6s steps(1) infinite}.jz-bk{animation:jz-bl 2.4s steps(1) infinite}@keyframes jz-bl{0%{opacity:1}14%,100%{opacity:.12}}' +
      '.st-sleeping .jz-lg{animation:none;opacity:.5}' +
      // Thinking: a constellation traces itself among the stars.
      '.jz-con{display:none}.st-thinking .jz-con{display:inline}' +
      '.st-thinking .jz-cline{stroke-dasharray:1;stroke-dashoffset:1;animation:jz-draw 2.8s ease-in-out .2s both}@keyframes jz-draw{to{stroke-dashoffset:0}}' +
      '.st-thinking .jz-cnode{animation:jz-in .6s ease-out both}' +
      // Responding: fireflies come out around the bench.
      '.jz-ff{display:none}.st-responding .jz-ff{display:inline;animation:jz-in 1.2s ease-out both}' +
      '.jz-fly{animation:jz-fly var(--t) ease-in-out infinite alternate}@keyframes jz-fly{to{transform:translate(var(--dx),var(--dy))}}' +
      '.jz-fg{animation:jz-tw 1.6s ease-in-out infinite alternate}' +
      // Tool: premiere searchlights sweep up out of the city; the traffic hurries.
      '.jz-beam{display:none}.st-tool .jz-beam{display:inline;animation:jz-in .8s ease-out both}' +
      '.jz-bsw{animation:jz-bsw 3.8s ease-in-out infinite alternate}@keyframes jz-bsw{from{transform:rotate(-15deg)}to{transform:rotate(13deg)}}' +
      '.st-tool .jz-hl{animation-duration:4s}.st-tool .jz-tl{animation-duration:5s}' +
      // Read: a warm glow travels across the city like an eye along a line.
      '.jz-scan{display:none}.st-read .jz-scan{display:inline;animation:jz-scan 4.4s linear infinite}' +
      '@keyframes jz-scan{0%{transform:translateX(-200px)}28%,72%{opacity:1}34%,66%{opacity:.3}100%{transform:translateX(1800px)}}' +
      // Web: the mast on the far ridge sends out rings.
      '.jz-ring{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .jz-ring{animation:jz-ring 2.1s ease-out infinite}@keyframes jz-ring{0%{opacity:0;transform:scale(.3)}25%{opacity:.85}100%{opacity:0;transform:scale(3.6)}}' +
      // Run: the lantern swings, two dancers twirl beneath it, glowing notes and ribbons of melody drift up.
      '.st-run .jz-sw{animation:jz-swr 1.6s ease-in-out infinite alternate}@keyframes jz-swr{from{transform:rotate(-16deg)}to{transform:rotate(16deg)}}' +
      '.st-run .jz-lg{animation-duration:1.6s}' +
      '.jz-dance{opacity:0}.st-run .jz-dance{animation:jz-in .6s ease-out .1s both}' +
      '.st-run .jz-pair{animation:jz-pair 3s ease-in-out infinite alternate}@keyframes jz-pair{from{transform:translateX(-11px) rotate(-4deg)}to{transform:translateX(11px) rotate(4deg)}}' +
      '.jz-spin{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .jz-spin{animation:jz-spin 1.5s ease-in-out infinite}@keyframes jz-spin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1.25)}}' +
      '.jz-nt,.jz-mel{opacity:0}' +
      '.st-run .jz-nt{animation:jz-nt 3.6s ease-out infinite}' +
      '@keyframes jz-nt{0%{opacity:0;transform:translate(0,0) scale(.5)}14%{opacity:1}75%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2)}}' +
      '.st-run .jz-nx{animation:jz-nx 1.2s ease-in-out infinite alternate}.st-run .jz-nx2{animation-direction:alternate-reverse}@keyframes jz-nx{from{transform:translateX(-10px)}to{transform:translateX(10px)}}' +
      '.st-run .jz-mel{opacity:1;stroke-dasharray:.24 .76;animation:jz-flow 2.8s linear infinite}@keyframes jz-flow{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      // Error: clouds roll over the stars, rain sweeps in, the lantern flickers, the piano lid drops shut.
      '.jz-rain,.jz-storm{display:none}' +
      '.st-error .jz-rain{display:inline;animation:jz-in 1s ease-out .1s both}' +
      '.st-error .jz-storm{display:inline;animation:jz-roll 2.4s ease-out both}@keyframes jz-roll{from{opacity:0;transform:translateY(-150px)}to{opacity:1;transform:translateY(0)}}' +
      '.st-error .jz-city{animation:jz-dim 2s ease-out both}@keyframes jz-dim{to{opacity:.5}}' +
      '.st-error .jz-stars{animation:jz-dim2 1.6s ease-out both}@keyframes jz-dim2{to{opacity:.12}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: two soft dips in 1 s, each ramping over 260 ms or more.
      '.st-error .jz-lg{animation:jz-flk 2.6s ease-in-out both}@keyframes jz-flk{0%{opacity:1}16%{opacity:.35}26%{opacity:.9}38%{opacity:.3}50%{opacity:.75}100%{opacity:.6}}' +
      '.jz-lid{transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-error .jz-lid{animation:jz-slam 1.3s ease-in .25s both}' +
      '@keyframes jz-slam{0%{transform:scaleY(1)}40%{transform:scaleY(.06)}52%{transform:scaleY(.17)}64%{transform:scaleY(.06)}72%{transform:scaleY(.09)}80%,100%{transform:scaleY(.06)}}' +
      '.jz-thud{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .jz-thud{animation:jz-thud 1s ease-out .72s both}@keyframes jz-thud{0%{opacity:0;transform:scale(.6)}25%{opacity:.9}100%{opacity:0;transform:scale(1.5)}}' +
      // Done: the stars brighten and glint, two shooting stars cross, Claude tips its hat.
      '.st-done .jz-stars{animation:jz-up 1.6s ease-out both}@keyframes jz-up{to{opacity:1}}' +
      '.st-done .jz-tw{animation-duration:1.4s}' +
      '.jz-glint{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-done .jz-glint{animation:jz-glint 1.5s ease-out both}@keyframes jz-glint{0%{opacity:0;transform:scale(.2)}50%{opacity:1;transform:scale(1.35)}100%{opacity:.9;transform:scale(1)}}' +
      '.jz-ss{opacity:0}.st-done .jz-ss{animation:jz-ss 1.4s ease-in both}' +
      '@keyframes jz-ss{0%{opacity:0;transform:translateX(0)}15%,70%{opacity:1}100%{opacity:0;transform:translateX(var(--l))}}' +
      '.st-done .jz-hat{transform-box:fill-box;transform-origin:20% 100%;animation:jz-tip 1.7s ease-in-out .35s both}' +
      '@keyframes jz-tip{0%,100%{transform:translate(0,0) rotate(0)}35%,62%{transform:translate(6px,-16px) rotate(-12deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="jz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03041a"/><stop offset=".26" stop-color="#080b2a"/>' +
      '<stop offset=".42" stop-color="#111540"/><stop offset=".5" stop-color="#1e1c4a"/><stop offset=".56" stop-color="#2a2252"/><stop offset="1" stop-color="#07081c"/></linearGradient>' +
      '<radialGradient id="jz-ag"><stop offset="0" stop-color="#9a6aa8" stop-opacity=".5"/><stop offset=".35" stop-color="#5a3c88" stop-opacity=".28"/>' +
      '<stop offset=".7" stop-color="#2a2260" stop-opacity=".1"/><stop offset="1" stop-color="#2a2260" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="jz-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151741"/><stop offset=".14" stop-color="#0c0e2c"/><stop offset="1" stop-color="#07081c"/></linearGradient>' +
      halo('jz-hz', '#ffb070', 0.3) +
      fade('jz-ca', AMBER, 0.3) +
      fade('jz-cw', WARM, 0.28) +
      fade('jz-cr', '#ff7a6a', 0.3) +
      fade('jz-cb', COOL, 0.3) +
      halo('jz-lamp', LAMP, 0.42) +
      `<linearGradient id="jz-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LAMP}" stop-opacity=".26"/><stop offset="1" stop-color="${LAMP}" stop-opacity="0"/></linearGradient>` +
      halo('jz-nw', LAMP, 0.6) +
      halo('jz-ng', PERI, 0.65) +
      halo('jz-sg', '#c8d4ff', 0.6) +
      '<linearGradient id="jz-ssg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8eeff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity=".9"/></linearGradient>' +
      '<linearGradient id="jz-bm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#dfe4ff" stop-opacity=".3"/><stop offset="1" stop-color="#dfe4ff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      // The blue-hour sky: a violet afterglow low in the west, the first stars, thin lit wisps.
      '<rect width="1600" height="1000" fill="url(#jz-sky)"/>' +
      '<ellipse cx="200" cy="548" rx="820" ry="260" fill="url(#jz-ag)"/>' +
      '<g class="mv-r"><ellipse cx="1500" cy="552" rx="420" ry="150" fill="url(#jz-ag)" opacity=".55"/></g>' +
      `<g class="jz-stars" fill="#e2e8ff">${stars}</g>` +
      constellation +
      glints +
      shooting(40, 40, 36, 400, 0.4) +
      shooting(1330, 46, 28, 360, 1.8) +
      '<g transform="translate(1700 150)"><g class="jz-plane"><circle class="jz-bl" r="1.8" fill="#ff8a8a"/><circle cx="6" r="1.2" fill="#e8ecff" fill-opacity=".8"/></g></g>' +
      `<g class="jz-cl">${wisps}</g>` +
      `<g class="jz-storm"><path d="${storm}" transform="translate(0 -5)" fill="${PERI}" fill-opacity=".3"/><path d="${storm}" fill="#101231" fill-opacity=".96"/></g>` +
      // The far ridges, a radio mast on the right one.
      '<path d="M-20 550V522C80 508 170 512 250 500C340 488 430 510 530 516C640 522 730 506 830 508C940 512 1040 524 1140 514C1240 504 1330 486 1430 494C1510 500 1570 510 1620 506V550Z" fill="#14173f"/>' +
      '<path d="M-20 522C80 508 170 512 250 500C340 488 430 510 530 516C640 522 730 506 830 508C940 512 1040 524 1140 514C1240 504 1330 486 1430 494C1510 500 1570 510 1620 506" fill="none" stroke="#3a3474" stroke-opacity=".5" stroke-width="1.5"/>' +
      '<path d="M-20 552V538C120 528 240 534 380 530C520 526 640 540 800 536C960 532 1100 540 1240 532C1380 524 1500 532 1620 528V552Z" fill="#0d0f31"/>' +
      '<g class="mv-r"><path d="M1446 498L1452 430L1458 498M1447.5 482H1456.5M1449 462H1455M1450.2 446H1453.8" fill="none" stroke="#252a62" stroke-width="2"/>' +
      '<circle class="jz-bk" cx="1452" cy="428" r="2.6" fill="#ff7a7a"/>' +
      [0, 0.7, 1.4].map(d => `<circle class="jz-ring" style="animation-delay:${d}s" cx="1452" cy="428" r="18" fill="none" stroke="${PERI}" stroke-width="2.2"/>`).join('') +
      '</g>' +
      // The valley floor and the city of lights on it.
      '<rect y="546" width="1600" height="454" fill="url(#jz-gr)"/>' +
      city(next) +
      `<g class="jz-beam">${beam(120, 640, 0)}${beam(210, 604, -1.9)}<g class="mv-r">${beam(1420, 600, -0.9)}${beam(1510, 630, -2.6)}</g></g>` +
      '<g class="jz-scan"><ellipse cx="0" cy="650" rx="190" ry="84" fill="url(#jz-hz)"/><ellipse cx="0" cy="650" rx="110" ry="9" fill="url(#jz-nw)"/></g>' +
      // The hilltop overlook: a tree, the crest with its path, the bench and the lamp post, the dancers.
      '<g class="mv-b">' +
      `<path d="M74 734C70 680 60 640 48 594C40 562 42 532 54 500" fill="none" stroke="${HILL}" stroke-width="11" stroke-linecap="round"/>` +
      `<path d="M52 604C32 584 8 576 -18 574M58 546C80 528 102 522 124 512" fill="none" stroke="${HILL}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${crown}" fill="${HILL}"/>` +
      `<path d="${hillTop}V1080H-40Z" fill="${HILL}"/><path d="${hillTop}" fill="none" stroke="#2c2a68" stroke-opacity=".85" stroke-width="2"/>` +
      '<path d="M120 742C230 742 330 752 420 784C520 820 640 852 780 866" fill="none" stroke="#b9b4ea" stroke-opacity=".06" stroke-width="12" stroke-linecap="round"/>' +
      '<ellipse cx="318" cy="728" rx="110" ry="13" fill="url(#jz-nw)" opacity=".7"/>' +
      `<path d="M148 682V728M228 682V728M146 712L141 729M230 712L235 729" stroke="${IRON}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="${box(142, 684, 92, 6)}${box(142, 694, 92, 5)}${box(137, 706, 102, 6)}" fill="${IRON}" stroke="#2c2a5e" stroke-width="1.3"/>` +
      `<path d="M140 706H238M144 684H232" stroke="${LAMP}" stroke-opacity=".38" stroke-width="1.4"/>` +
      `<path d="M249 728L253 706H271L275 728Z${box(258.5, 478, 7, 230)}${box(255, 642, 14, 6)}${box(256, 548, 12, 5)}" fill="${IRON}" stroke="#2c2a5e" stroke-width="1.4"/>` +
      `<path d="M262 482C262 452 292 440 310 452C317 457 318 464 316 470" fill="none" stroke="${IRON}" stroke-width="5" stroke-linecap="round"/>` +
      `<circle cx="262" cy="474" r="5" fill="${IRON}"/>` +
      '<g transform="translate(316 470)"><g class="jz-sw">' +
      '<g class="jz-lg"><circle cy="34" r="230" fill="url(#jz-lamp)"/><path d="M-8 46L-96 262H96L8 46Z" fill="url(#jz-cone)"/></g>' +
      `<path d="M0 0V12" stroke="${IRON}" stroke-width="2"/><path d="M-10 12H10L14 19H-14Z" fill="${IRON}"/>` +
      `<path d="M-9 19H9L7 44H-7Z" fill="${LAMP}" fill-opacity=".95"/><circle cy="31" r="4" fill="#fff8e4"/>` +
      `<path d="M-9 19H9L7 44H-7ZM0 19V44" fill="none" stroke="${IRON}" stroke-width="2"/><path d="M-8 44H8L3 51H-3Z" fill="${IRON}"/>` +
      '</g></g>' +
      '<g transform="translate(338 728) scale(2.15)"><g class="jz-dance"><g class="jz-pair">' +
      `<g transform="translate(-1.3 -.7)" opacity=".95">${dancers(LAMP)}</g>${dancers('#0c0d22')}` +
      '</g></g></g>' +
      `<g class="jz-ff">${flies}</g>` +
      `<g fill="#f2f4ff">${notes(next, 9, [280, 590, 120, 90], [260, 380], [-80, 20])}</g>` +
      `<path class="jz-mel" pathLength="1" d="M352 690C300 620 400 580 340 500S280 380 340 300" fill="none" stroke="${PERI}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` +
      `<path class="jz-mel" pathLength="1" style="animation-delay:-1.4s" d="M330 700C400 640 310 590 380 520S420 410 370 330" fill="none" stroke="${LAMP}" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>` +
      '</g>' +
      `<g class="jz-rain">${rain({ seed: 71, count: 20, length: [16, 30], slant: 120, seconds: 0.8, stroke: '#aab8f0', opacity: 0.4 })}` +
      `${rain({ seed: 72, count: 10, length: [26, 46], slant: 140, seconds: 0.55, stroke: '#d6deff', opacity: 0.3 })}</g>`,
    nook:
      // The hill's shoulder behind the piano, and what rises from the open lid while a command runs.
      `<path d="${shoulder}V520H-560Z" fill="${HILL}"/><path d="${shoulder}" fill="none" stroke="#2c2a68" stroke-opacity=".85" stroke-width="2"/>` +
      `<g fill="#f2f4ff">${notes(next, 7, [292, 226, 120, 70], [300, 520], [-60, 40])}</g>` +
      `<path class="jz-mel" pathLength="1" d="M404 250C434 170 344 120 384 30S434 -110 364 -220" fill="none" stroke="${PERI}" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` +
      `<path class="jz-mel" pathLength="1" style="animation-delay:-1.2s" d="M360 244C314 164 404 104 344 14S294 -126 344 -256" fill="none" stroke="${LAMP}" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>`,
    front:
      `<g class="jz-rain">${rain({ seed: 73, count: 6, length: [16, 28], slant: 120, seconds: 0.8, stroke: '#b4c0f4', opacity: 0.35, box: [0, -200, 470, 650] })}</g>` +
      `<path class="jz-thud" d="M262 304l-12 -6M266 296l-6 -12M420 304l12 -6M416 296l6 -12" fill="none" stroke="${PERI}" stroke-width="2.4" stroke-linecap="round"/>`,
  }
}
