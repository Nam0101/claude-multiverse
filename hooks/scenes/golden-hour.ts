import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Golden Hour: the last of a sunset over flat, ripe rice fields in the countryside. A low sun sinks behind a village
// hedged in bamboo, a lone banyan stands on a mound, a dirt road runs home to a tiled farmhouse, a kite hangs in the
// dusk and a scarecrow in a conical hat keeps the field. Claude works on the farmhouse porch in a conical hat of its
// own. A command sends a vast starling murmuration swirling over the sun; an error is a gust that flattens the rice
// in a wave and blows the scarecrow's hat away; done lets the sun's last rim flare and fireflies rise over the field.
const STRAW = '#cdae6a'
const RIB = '#7a6034'
const WOOD = '#2c1b0e'
const WOOD_LIT = '#5e3c1e'
const BAMBOO = '#7c6232'
const BAMBOO_DK = '#4c3a1c'
const RIBBON = '#b27cc4'

type Row = { seed: number; x0: number; x1: number; cols: number; base: number; h: readonly [number, number]; per: number; s: number; cls: string }

/** One row of ripe rice in columns that sway as one: dark stalks and leaves, the drooping heads lit gold. */
function riceRow(row: Row): string {
  const next = random(row.seed)
  const w = (row.x1 - row.x0) / row.cols
  const r = Math.round
  let out = ''

  for (let c = 0; c < row.cols; c += 1) {
    let stalks = ''
    let heads = ''

    for (let j = 0; j < row.per; j += 1) {
      const x = r(row.x0 + c * w + (j + next()) * (w / row.per))
      const h = r(row.h[0] + next() * (row.h[1] - row.h[0]))
      const lean = r((next() - 0.35) * 7 * row.s)
      const dx = r(row.s * (5 + next() * 3))
      const dy = r(row.s * 4)
      stalks += `M${x} ${row.base}l${lean} ${-h}`
      if (j % 3 === 0) stalks += `M${x} ${row.base}q${r(-row.s * 6)} ${r(-h * 0.35)} ${r(-row.s * 15)} ${r(-h * 0.42)}`
      heads += `M${x + lean} ${row.base - h}q${dx} ${-dy} ${r(dx * 1.3)} ${r(dy * 2.8)}`
    }

    out += `<g class="gh-rc" style="--k:${f((row.x0 + (c + 0.5) * w) / 100)}"><path class="${row.cls}s" d="${stalks}"/><path class="${row.cls}h" d="${heads}"/></g>`
  }

  return `<g fill="none" stroke-linecap="round">${out}</g>`
}

/** The murmuration: ten clouds of starlings orbiting one moving centre at their own pace, each squeezing and turning. */
function flock(): string {
  const next = random(404)
  let out = ''

  for (let c = 0; c < 12; c += 1) {
    const rx = 50 + next() * 40
    const ry = 24 + next() * 20
    let d = ''

    for (let k = 0; k < 32; k += 1) {
      const a = next() * Math.PI * 2
      const m = Math.sqrt(next())

      d += `M${Math.round(Math.cos(a) * m * rx)} ${Math.round(Math.sin(a) * m * ry)}h2`
    }

    out +=
      `<g transform="rotate(${Math.round(next() * 360)})"><g class="gh-orb" style="animation-duration:${f(4.5 + next() * 5)}s${c % 3 === 0 ? ';animation-direction:reverse' : ''}">` +
      `<g transform="translate(${Math.round(10 + next() * 130)} 0)"><g class="gh-cm" style="animation-duration:${f(1.7 + next() * 1.6)}s;animation-delay:${f(-next() * 3)}s">` +
      `<ellipse rx="${Math.round(rx)}" ry="${Math.round(ry)}" fill="url(#gh-mbg)" stroke="none"/><path d="${d}"/></g></g></g></g>`
  }

  return `<g class="gh-fly"><g class="gh-flock"><g class="gh-fsh" fill="none" stroke="#0a0504" stroke-width="3.6" stroke-linecap="round">${out}</g></g></g>`
}

/** Fireflies that rise from the rice when the day's work is done, each pulsing slowly as it climbs. */
function fireflies(seed: number, n: number, box: readonly [number, number, number, number], alpha: number): string {
  const next = random(seed)

  return Array.from({ length: n }, () => {
    const x = box[0] + next() * box[2]
    const y = box[1] + next() * box[3]

    return (
      `<g transform="translate(${f(x)} ${f(y)})"${alpha < 1 ? ` opacity="${alpha}"` : ''}>` +
      `<g class="gh-ff" style="--dx:${Math.round((next() - 0.5) * 120)};--dy:${Math.round(-120 - next() * 240)};--t:${f(5 + next() * 3)}s;--d:${f(0.1 + next() * 1.5)}s;--b:${f(-next() * 1.7)}s">` +
      '<circle class="gh-fb" r="9" fill="url(#gh-ffg)"/></g></g>'
    )
  }).join('')
}

/** The lone banyan on its mound: a dome of leaf clumps lit on the sun's side, a gnarled trunk and hanging roots. */
function banyan(): string {
  const next = random(55)
  const clumps: [number, number, number][] = []

  for (let i = 0; i < 14; i += 1) {
    const t = i / 13

    clumps.push([-96 + t * 320 + (next() - 0.5) * 20, 436 - Math.sin(t * Math.PI) * 92 + (next() - 0.5) * 18, 34 + Math.sin(t * Math.PI) * 26 + next() * 10])
  }

  clumps.push([20, 420, 64], [110, 404, 60], [-40, 436, 52], [170, 432, 46])

  const disc = ([cx, cy, r]: [number, number, number]) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`
  const rim = clumps
    .filter(([cx]) => cx > 40)
    .map(([cx, cy, r]) => {
      const a0 = (-75 * Math.PI) / 180
      const a1 = (35 * Math.PI) / 180

      return `M${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))}A${f(r)} ${f(r)} 0 0 1 ${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))}`
    })
    .join('')

  return (
    '<ellipse cx="60" cy="616" rx="160" ry="18" fill="#0f0805"/>' +
    '<g class="gh-can">' +
    '<path d="M-26 436V610M-6 440V606M146 436V610M166 440V604M124 446V608" stroke="#0f0805" stroke-width="2.4"/>' +
    '<path d="M40 614C50 574 58 536 52 470H94C88 536 96 578 118 614Z" fill="#0f0805"/>' +
    '<path d="M94 470C88 536 96 578 118 614" fill="none" stroke="#e8843c" stroke-opacity=".3" stroke-width="2"/>' +
    '<path d="M70 482Q20 452 -34 432M76 478Q122 444 172 430M64 470Q48 432 18 410M82 470Q104 430 122 400" fill="none" stroke="#0f0805" stroke-width="9" stroke-linecap="round"/>' +
    `<path d="${clumps.map(disc).join('')}" fill="#100906"/>` +
    `<path d="${rim}" fill="none" stroke="#f0904a" stroke-opacity=".45" stroke-width="2.6" stroke-linecap="round"/>` +
    '</g>'
  )
}

/** The scarecrow, its foot at (0, 0): a pole, a ragged shirt, a straw head and a conical hat the wind can take. */
function scarecrow(): string {
  return (
    '<g class="gh-scw">' +
    '<path d="M0 0V-192" stroke="#120a06" stroke-width="6"/><path d="M-68 -150H68" stroke="#160c07" stroke-width="5" stroke-linecap="round"/>' +
    '<path class="gh-slv" d="M-66 -152l-8 38l9 -5l5 11l6 -13l7 6l3 -37Z" fill="#1e1522"/>' +
    '<path class="gh-slv" style="animation-delay:-1.1s" d="M66 -152l8 38l-9 -5l-5 11l-6 -13l-7 6l-3 -37Z" fill="#1e1522"/>' +
    '<path d="M-36 -154H36L42 -80L30 -86L22 -74L10 -84L0 -72L-12 -84L-22 -74L-32 -86L-42 -80Z" fill="#231927"/>' +
    '<circle cy="-172" r="15" fill="#3a2a14"/>' +
    '<path d="M-12 -160l-6 9M10 -160l6 10M-4 -158l-2 11M4 -158l2 11" stroke="#9a7838" stroke-width="2"/>' +
    '<path d="M-66 -152l-8 38M-36 -154L-42 -80M-15 -174a15 15 0 0 1 8 -12" fill="none" stroke="#f0a050" stroke-opacity=".5" stroke-width="2"/>' +
    '<g class="gh-shat"><path d="M-36 -182Q-13 -192 0 -218Q13 -192 36 -182Q0 -176 -36 -182Z" fill="#b8964e"/>' +
    '<path d="M-36 -182Q-13 -192 0 -218L-1 -179Q-20 -178 -36 -182Z" fill="#f0c878" fill-opacity=".5"/>' +
    '<path d="M-24 -186Q0 -183 24 -186" fill="none" stroke="#6a5028" stroke-width="1.4"/></g>' +
    '</g>'
  )
}

/** The laptop on the farmhouse table, and a little oil lamp beside it. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<rect x="244" y="323" width="98" height="7" rx="2" fill="#3a2c1e"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#3a2c1e"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The oil lamp: a foot, a glass font, a brass collar, the chimney and its flame.
    '<circle cx="398" cy="294" r="34" fill="#ffb860" fill-opacity=".1"/><circle cx="398" cy="294" r="15" fill="#ffc878" fill-opacity=".2"/>' +
    '<path d="M385 330h26l-4 -6h-18z" fill="#4a3620"/>' +
    '<ellipse cx="398" cy="317" rx="12" ry="8" fill="#a8783a" fill-opacity=".6" stroke="#c89a58" stroke-opacity=".7" stroke-width="1.5"/>' +
    '<rect x="392" y="305" width="12" height="5" fill="#8a6a34"/>' +
    `<g transform="translate(398 301)"><path class="${activity === 'error' ? 'gh-flm gh-gut' : 'gh-flm'}" d="M0 0q-4 -5 0 -13q4 8 0 13z" fill="#ffd27a"/></g>` +
    '<path d="M393 305q-4 -10 0 -18q1 -6 1 -14h8q0 8 1 14q4 8 0 18z" fill="#fff0d0" fill-opacity=".12" stroke="#e8d0a0" stroke-opacity=".55" stroke-width="1.4"/>'
  )
}

// Claude's conical hat: the brim sits on the head above the eyes, the far half in shade, a silk strap down each side.
const HAT =
  `<path d="M44 246Q104 222 150 178Q196 222 256 246Q150 257 44 246Z" fill="${STRAW}"/>` +
  '<path d="M44 246Q104 222 150 178L147 251Q90 252 44 246Z" fill="#4a381c" fill-opacity=".45"/>' +
  `<path d="M74 237Q150 246 226 237M100 222Q150 230 200 222M124 204Q150 210 176 204" fill="none" stroke="${RIB}" stroke-opacity=".7" stroke-width="1.6"/>` +
  '<path d="M44 246Q150 257 256 246" fill="none" stroke="#5e4624" stroke-width="2.4"/>' +
  '<path d="M152 181Q196 222 253 245" fill="none" stroke="#f4dea4" stroke-opacity=".6" stroke-width="2"/>' +
  '<circle cx="150" cy="179" r="2.6" fill="#8a6e3e"/>' +
  `<path d="M86 251Q88 304 108 338M214 251Q212 304 192 338" fill="none" stroke="${RIBBON}" stroke-width="3" stroke-linecap="round"/>`

export function goldenHourWorld(): World {
  const next = random(1808)
  // The first stars: three sets of dots, one of them twinkling.
  const starDots = (count: number) =>
    Array.from({ length: count }, () => `M${Math.round(next() * 1600)} ${Math.round(next() * 270)}h.1`).join('')
  const stars =
    `<g fill="none" stroke="#f4e6d0" stroke-linecap="round"><path d="${starDots(14)}" stroke-width="1.8" stroke-opacity=".3"/>` +
    `<path d="${starDots(12)}" stroke-width="2.4" stroke-opacity=".5"/><path class="gh-tw" d="${starDots(8)}" stroke-width="2.8" stroke-opacity=".7"/></g>`
  // Long streaks of cloud, lit from below: bright near the sun, faint across the top.
  const cloudSet = (count: number, near: boolean) => {
    let body = ''
    let edge = ''

    for (let i = 0; i < count; i += 1) {
      const x = near ? -80 + i * 150 + next() * 60 : 640 + i * 230 + next() * 80
      const y = near ? 330 + next() * 130 : 120 + next() * 160
      const w = 200 + next() * 220
      const h = 9 + next() * 12

      body += `M${f(x)} ${f(y)}q${f(w / 2)} ${f(-h * 2)} ${f(w)} 0q${f(-w / 2)} ${f(h * 0.9)} ${f(-w)} 0Z`
      edge += `M${f(x + w * 0.08)} ${f(y + h * 0.04)}q${f(w * 0.42)} ${f(h * 0.8)} ${f(w * 0.84)} 0`
    }

    return near
      ? `<path d="${body}" fill="#4a2026" fill-opacity=".8"/><path d="${edge}" fill="none" stroke="#ff9a5a" stroke-opacity=".5" stroke-width="2"/>`
      : `<path d="${body}" fill="#1e1222" fill-opacity=".9"/><path d="${edge}" fill="none" stroke="#c86a5a" stroke-opacity=".22" stroke-width="1.6"/>`
  }
  // The village on the horizon: humps of bamboo hedge, low where the sun goes down, a few areca palms and a far roof.
  let hedge = 'M-20 566'

  for (let x = -20; x < 1640; ) {
    const w = 26 + next() * 50
    const h = x > 150 && x < 350 ? 3 + next() * 4 : 10 + next() * 22

    hedge += `q${f(w / 2)} ${f(-h * 2)} ${f(w)} 0`
    x += w
  }

  hedge += 'V600H-20Z'
  const plumes = Array.from({ length: 12 }, () => {
    const x = next() * 1600

    return x > 140 && x < 360 ? '' : `M${f(x)} 562q${f(4 + next() * 6)} ${f(-24 - next() * 16)} ${f(14 + next() * 8)} ${f(-36 - next() * 14)}`
  }).join('')
  const palms = [560, 604, 1086, 1128]
    .map((x, i) => {
      const t = 474 - (i % 2) * 14

      return `M${x} 564q2 -44 3 ${t - 564}M${x + 3} ${t}q-14 -2 -22 10M${x + 3} ${t}q14 -2 22 10M${x + 3} ${t}q-6 -10 -16 -14M${x + 3} ${t}q6 -10 16 -14`
    })
    .join('')
  // The ripe field: far rows of gold, the dikes between paddies.
  let texture = ''

  for (let i = 0; i < 56; i += 1) {
    const y = 568 + Math.pow(next(), 1.6) * 96

    texture += `M${Math.round(next() * 1640 - 20)} ${Math.round(y)}h${Math.round((20 + next() * 70) * (1 + (y - 566) / 60))}`
  }

  const leaves = Array.from({ length: 6 }, (_, i) => {
    const x = 60 + next() * 160
    const y = 360 + next() * 110

    return (
      `<g transform="translate(${f(x)} ${f(y)})"><g class="gh-lf" style="--dx:${f(520 + next() * 600)}px;--dy:${f(-90 + next() * 260)}px;--d:${f(0.15 + i * 0.12)}s">` +
      `<path d="M0 0q6 -5 12 0q-6 5 -12 0Z" fill="${i % 2 ? '#d0923e' : '#6a4a1e'}"/></g></g>`
    )
  }).join('')
  const straw = Array.from({ length: 4 }, (_, i) =>
    `<g transform="translate(${f(372 + next() * 18)} ${f(526 + next() * 20)})"><g class="gh-sb" style="--dx:${f(220 + next() * 420)}px;--dy:${f(-160 + next() * 200)}px;--d:${f(0.3 + i * 0.1)}s">` +
    '<path d="M0 0l10 -3" stroke="#e0b868" stroke-width="2" stroke-linecap="round"/></g></g>',
  ).join('')
  const winds = Array.from({ length: 8 }, (_, i) => {
    const x = -260 + next() * 460
    const y = 110 + next() * 780
    const w = 90 + next() * 140

    return `<path class="gh-wd" style="--d:${f(i * 0.13)}s" d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-10 - next() * 10)} ${f(w)} 0t${f(w * 0.7)} 4"/>`
  }).join('')
  // Done's rays: overlapping soft wedges that add up to a fan, not separate beams.
  const rays = [-170, -156, -142, -128, -114, -100, -86, -74]
    .map((a, i) => `<path transform="rotate(${a} 250 556)" d="M250 556L940 ${556 - 64 - (i % 2) * 20}V${556 + 64 + (i % 2) * 20}Z"/>`)
    .join('')
  const egrets = (
    [
      [0, 0],
      [40, -22],
      [40, 22],
      [80, -42],
      [80, 40],
    ] as const
  )
    .map(
      ([dx, dy], i) =>
        `<g transform="translate(${1480 + dx} ${170 + dy})"><g class="gh-eg">` +
        `<path class="gh-wing" style="animation-delay:${f(-i * 0.13)}s" d="M-15 0Q-8 -10 0 0Q8 -10 15 0"/><path d="M12 1H-6l-6 -4M12 1l9 2"/></g></g>`,
    )
    .join('')
  // A paper kite flown from under the banyan: a diamond with a bowed tail.
  const kite =
    '<g transform="translate(180 130)"><g class="gh-kite">' +
    '<path d="M0 8Q-34 200 -114 478" fill="none" stroke="#e0c090" stroke-opacity=".22" stroke-width="1.2"/>' +
    '<g class="gh-kt"><g class="gh-tail"><path d="M0 32q-9 14 0 28t0 28t0 28t0 28" fill="none" stroke="#e8a048" stroke-opacity=".75" stroke-width="2"/>' +
    '<path d="M-6 57l12 6M6 57l-12 6M-6 85l12 6M6 85l-12 6M-6 113l12 6M6 113l-12 6" stroke="#e0603a" stroke-width="3"/></g>' +
    '<path d="M0 -30L24 0L0 34L-24 0Z" fill="#a8402a" stroke="#f0b060" stroke-opacity=".6" stroke-width="1.5"/>' +
    '<path d="M0 -30L-24 0H0Z" fill="#f0a848" fill-opacity=".55"/><path d="M0 -30V34M-24 0H24" stroke="#f0c888" stroke-opacity=".5" stroke-width="1.3"/></g></g></g>'
  const rafters = Array.from({ length: 16 }, (_, i) => `M${6 + i * 28} -27v7`).join('')
  const seams = Array.from({ length: 19 }, (_, i) => `M${22 + i * 22} -27V440`).join('')
  const doors = [30, 80, 130, 180].map(x => `M${x + 8} 20h34v150h-34zM${x + 8} 250h34v172h-34z`).join('')
  const lattice =
    Array.from({ length: 9 }, (_, i) => `M${270 + i * 14} 24V150`).join('') + Array.from({ length: 5 }, (_, i) => `M256 ${45 + i * 21}H396`).join('')
  const tiles =
    Array.from({ length: 10 }, (_, i) => `M-20 ${-50 - i * 16}H440`).join('') + Array.from({ length: 31 }, (_, i) => `M${-10 + i * 15} -34V-200`).join('')
  const bricks = 'M-20 450H440' + Array.from({ length: 10 }, (_, i) => `M${20 + i * 46} 440V450M${43 + i * 46} 450V460`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'dust',
      ink: '#0c0705',
      furniture: WOOD,
      metal: '#3a2c1e',
      paper: '#efe2c4',
      light: { idle: '#b8874c', work: '#ffc474', bright: '#ffe4b4' },
      headTop: 221,
      glowAt: [345, 284],
      device,
      wear: { front: HAT },
      // A bamboo stool, its legs ringed at the nodes.
      seatArt:
        `<g stroke="${BAMBOO_DK}" stroke-width="7" stroke-linecap="round"><path d="M116 358L110 454M186 358L192 454"/>` +
        '<path d="M134 358L131 446M168 358L171 446" stroke="#3a2c14" stroke-width="6"/></g>' +
        `<path d="M112 412H190M120 384H182" stroke="${BAMBOO_DK}" stroke-width="4"/>` +
        '<path d="M106 392h8M188 392h8M106 428h7M189 428h7" stroke="#2a200e" stroke-width="2"/>' +
        `<rect x="104" y="348" width="94" height="10" rx="4" fill="${BAMBOO}"/><path d="M108 352H194" stroke="#a88a4a" stroke-opacity=".6" stroke-width="1.5"/>`,
      // A plain farmhouse table in dark wood.
      tableArt:
        `<rect x="166" y="330" width="290" height="12" rx="2" fill="${WOOD}"/><path d="M168 331H454" stroke="${WOOD_LIT}" stroke-width="2"/>` +
        '<rect x="176" y="342" width="270" height="10" fill="#1e1309"/>' +
        `<rect x="180" y="342" width="13" height="114" fill="${WOOD}"/><rect x="428" y="342" width="13" height="114" fill="${WOOD}"/>` +
        `<path d="M193 424H428" stroke="${WOOD}" stroke-width="6"/>`,
    },
    style:
      '.gh-tw{animation:gh-tw 3.4s ease-in-out infinite alternate}@keyframes gh-tw{to{opacity:.2}}' +
      '@keyframes gh-on{to{opacity:1}}' +
      // The sun shimmers; done sinks it until its last rim flares, with rays fanning up from it.
      '.gh-sun{animation:gh-shim 5s ease-in-out infinite alternate}@keyframes gh-shim{from{opacity:.86}to{opacity:1}}' +
      '.st-done .gh-sun{animation:gh-sink 3.4s ease-in-out both}@keyframes gh-sink{to{transform:translateY(40px)}}' +
      '.gh-rim,.gh-rays,.gh-flare{opacity:0}.st-done .gh-rim{animation:gh-on 2.6s ease-out .5s both}' +
      '.st-done .gh-rays{animation:gh-on 2.4s ease-out .9s both}' +
      '.st-done .gh-flare{animation:gh-flare 3s ease-out .5s both}@keyframes gh-flare{0%{opacity:0}45%{opacity:1}100%{opacity:.8}}' +
      '.gh-sgl{animation:gh-pulse 7s ease-in-out infinite alternate}@keyframes gh-pulse{from{opacity:.85}to{opacity:1}}' +
      '.gh-cl{animation:gh-drift 44s ease-in-out infinite alternate}@keyframes gh-drift{to{transform:translateX(40px)}}' +
      // The kite: it bobs on the evening air, climbs while Claude thinks, swoops with a tool, spins in the gust.
      '.gh-kite{animation:gh-kb 5.5s ease-in-out infinite alternate}@keyframes gh-kb{from{transform:translate(-10px,6px)}to{transform:translate(12px,-8px)}}' +
      '.gh-kt{transform-box:fill-box;transform-origin:50% 30%;animation:gh-kw 2.3s ease-in-out infinite alternate}@keyframes gh-kw{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.st-thinking .gh-kite{animation:gh-climb 6s ease-out both}@keyframes gh-climb{to{transform:translate(20px,-46px)}}' +
      '.st-tool .gh-kite{animation:gh-swoop 1.8s ease-in-out infinite}@keyframes gh-swoop{0%,100%{transform:translate(0,0)}25%{transform:translate(40px,30px)}50%{transform:translate(0,50px)}75%{transform:translate(-40px,22px)}}' +
      '.st-error .gh-kt{animation:gh-kspin .6s ease-in-out infinite alternate}@keyframes gh-kspin{from{transform:rotate(-30deg)}to{transform:rotate(26deg)}}' +
      '.gh-tail{transform-box:fill-box;transform-origin:50% 0;animation:gh-tl 1.4s ease-in-out infinite alternate}@keyframes gh-tl{from{transform:skewX(-14deg)}to{transform:skewX(14deg)}}' +
      // The rice: rows sway as a slow rolling wave; a gust flattens them in a wave that runs left to right.
      '.gh-as{stroke:#5e3c1a;stroke-width:1.4}.gh-ah{stroke:#f0b058;stroke-opacity:.75;stroke-width:1.9}' +
      '.gh-bs{stroke:#3c2610;stroke-width:2.3}.gh-bh{stroke:#e8a44c;stroke-opacity:.72;stroke-width:2.8;stroke-dasharray:.1 3}' +
      '.gh-cs{stroke:#160d06;stroke-width:4.4}.gh-ch{stroke:#d4943e;stroke-opacity:.7;stroke-width:4.4;stroke-dasharray:.1 4.6}' +
      '.gh-rc{transform-box:fill-box;transform-origin:50% 100%;animation:gh-sway 4.8s ease-in-out infinite alternate;animation-delay:calc(var(--k) * -.32s)}' +
      '@keyframes gh-sway{from{transform:skewX(4deg)}to{transform:skewX(-5deg)}}' +
      '.st-responding .gh-rc,.st-tool .gh-rc{animation-duration:2.6s}' +
      '.st-error .gh-rc{animation:gh-gust 2.8s ease-in-out both;animation-delay:calc(var(--k) * .07s + .1s)}' +
      '@keyframes gh-gust{0%{transform:skewX(0)}16%{transform:skewX(-46deg) scaleY(.74)}30%{transform:skewX(-18deg) scaleY(.94)}44%{transform:skewX(-32deg) scaleY(.84)}' +
      '60%{transform:skewX(-10deg)}76%{transform:skewX(-20deg)}100%{transform:skewX(-8deg)}}' +
      '.gh-sh{opacity:0}.st-error .gh-sh{animation:gh-sh 2s linear .13s both}' +
      '@keyframes gh-sh{0%{opacity:0;transform:translateX(-300px)}12%{opacity:1}80%{opacity:.8}100%{opacity:0;transform:translateX(1900px)}}' +
      // The banyan breathes in the breeze and thrashes in the gust; its leaves fly.
      '.gh-can{transform-origin:60px 612px;animation:gh-cs 8s ease-in-out infinite alternate}@keyframes gh-cs{from{transform:rotate(-.5deg)}to{transform:rotate(.7deg)}}' +
      '.st-error .gh-can{animation:gh-cg 1.1s ease-in-out infinite alternate}@keyframes gh-cg{from{transform:rotate(.4deg)}to{transform:rotate(2.6deg)}}' +
      '.gh-lf,.gh-sb{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .gh-lf,.st-error .gh-sb{animation:gh-blow 2s ease-out both;animation-delay:var(--d)}' +
      '@keyframes gh-blow{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.95}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(300deg)}}' +
      // The scarecrow: sleeves flutter; in the gust it leans, its sleeves stream out and its hat flies off.
      '.gh-scw{animation:gh-sl 6s ease-in-out infinite alternate}@keyframes gh-sl{from{transform:rotate(-1deg)}to{transform:rotate(1deg)}}' +
      '.st-error .gh-scw{animation:gh-lean .9s ease-in-out .1s infinite alternate}@keyframes gh-lean{from{transform:rotate(1deg)}to{transform:rotate(6deg)}}' +
      '.gh-slv{transform-box:fill-box;transform-origin:50% 0;animation:gh-slf 2.4s ease-in-out infinite alternate}@keyframes gh-slf{from{transform:skewX(-5deg)}to{transform:skewX(6deg)}}' +
      '.st-error .gh-slv{animation:gh-slg .35s ease-in-out infinite alternate}@keyframes gh-slg{from{transform:rotate(-50deg) scaleY(.8)}to{transform:rotate(-68deg) scaleY(.7)}}' +
      '.gh-shat{transform-box:fill-box;transform-origin:center}' +
      '.st-error .gh-shat{animation:gh-hat 3.2s linear .1s both}' +
      '@keyframes gh-hat{0%{transform:translate(0,0) rotate(0)}8%{transform:translate(2px,-10px) rotate(-12deg)}20%{transform:translate(50px,-60px) rotate(40deg)}' +
      '45%{transform:translate(220px,-170px) rotate(170deg)}72%{transform:translate(440px,-240px) rotate(300deg);opacity:1}100%{transform:translate(720px,-280px) rotate(430deg);opacity:0}}' +
      '.gh-wd{opacity:0}.st-error .gh-wd{animation:gh-wd 1.3s linear infinite;animation-delay:var(--d)}' +
      '@keyframes gh-wd{0%{opacity:0;transform:translateX(0)}20%{opacity:.5}80%{opacity:.4}100%{opacity:0;transform:translateX(900px)}}' +
      // Run: the murmuration fades in over the sun and swirls, folding and stretching as it goes.
      '.gh-fly{opacity:0}.st-run .gh-fly{animation:gh-on .6s ease-out .1s both}' +
      '.gh-flock{transform:translate(210px,440px)}.st-run .gh-flock{animation:gh-path 7s ease-in-out infinite}' +
      '@keyframes gh-path{0%,100%{transform:translate(210px,440px)}18%{transform:translate(370px,370px)}36%{transform:translate(540px,320px)}' +
      '54%{transform:translate(450px,400px)}72%{transform:translate(270px,340px)}86%{transform:translate(160px,400px)}}' +
      '.st-run .gh-fsh{animation:gh-fsh 5.2s ease-in-out infinite}' +
      '@keyframes gh-fsh{0%,100%{transform:scale(1.15,.7) rotate(-8deg)}25%{transform:scale(.85,1) rotate(8deg)}50%{transform:scale(1.3,.6) rotate(-2deg)}75%{transform:scale(.9,.9) rotate(14deg)}}' +
      '.st-run .gh-orb{animation:gh-orb 6s linear infinite}@keyframes gh-orb{to{transform:rotate(360deg)}}' +
      '.gh-cm{transform-box:fill-box;transform-origin:center}.st-run .gh-cm{animation:gh-cm 2.4s ease-in-out infinite alternate}' +
      '@keyframes gh-cm{from{transform:scale(1.2,.7) rotate(-10deg)}to{transform:scale(.75,1.15) rotate(12deg)}}' +
      // Done: fireflies rise from the rice, pulsing slowly.
      '.gh-ff{opacity:0}.st-done .gh-ff{animation:gh-rise var(--t) ease-out both;animation-delay:var(--d)}' +
      '@keyframes gh-rise{0%{opacity:0;transform:translate(0,0)}14%{opacity:1}85%{opacity:.9}100%{opacity:.5;transform:translate(calc(var(--dx) * 1px),calc(var(--dy) * 1px))}}' +
      '.st-done .gh-fb{animation:gh-blink 1.7s ease-in-out var(--b) infinite}@keyframes gh-blink{0%,100%{opacity:.3}50%{opacity:1}}' +
      // Web: a skein of egrets flies home across the top.
      '.gh-eg{opacity:0;fill:none;stroke:#f2e8da;stroke-width:2.4;stroke-linecap:round}.st-web .gh-eg{animation:gh-egf 8s linear .1s both}' +
      '@keyframes gh-egf{0%{opacity:0;transform:translateX(0)}6%{opacity:.85}88%{opacity:.85}100%{opacity:0;transform:translateX(-1750px)}}' +
      '.gh-wing{transform-box:fill-box;transform-origin:50% 100%}.st-web .gh-wing{animation:gh-flap .6s ease-in-out infinite alternate}@keyframes gh-flap{to{transform:scaleY(.25)}}' +
      // The farmhouse: kitchen smoke, the swinging lantern, the lit window, the lamp's flame.
      '.gh-smk{stroke-dasharray:.3 .7;animation:gh-smk 6s linear infinite}@keyframes gh-smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.gh-smw{transform-origin:330px -200px;animation:gh-smw 9s ease-in-out infinite alternate}@keyframes gh-smw{from{transform:skewX(-6deg)}to{transform:skewX(4deg)}}' +
      '.st-error .gh-smw{animation:gh-smb 1.2s ease-out both}@keyframes gh-smb{to{transform:skewX(-34deg)}}' +
      '.gh-lan{animation:gh-lan 5s ease-in-out infinite alternate}@keyframes gh-lan{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .gh-lan{animation:gh-lanb .9s ease-in-out infinite alternate}@keyframes gh-lanb{from{transform:rotate(-6deg)}to{transform:rotate(16deg)}}' +
      '.gh-fl{animation:gh-fl 3.1s ease-in-out infinite alternate}@keyframes gh-fl{from{opacity:.72}to{opacity:1}}' +
      '.gh-win{opacity:.5}.st-done .gh-win,.st-read .gh-win{animation:gh-lamp 2.4s ease-out .3s both}@keyframes gh-lamp{from{opacity:.5}to{opacity:1}}' +
      '.gh-mo{opacity:0}.st-read .gh-mo{opacity:1;animation:gh-orb 2.2s linear infinite}' +
      '.gh-flm{transform-box:fill-box;transform-origin:50% 100%;animation:gh-flm .9s ease-in-out infinite alternate}@keyframes gh-flm{from{transform:scale(.9,.94)}to{transform:scale(1.06,1.1)}}' +
      '.gh-flm.gh-gut{animation:gh-gut .5s ease-in-out infinite alternate}@keyframes gh-gut{from{transform:skewX(-20deg) scale(.8,.7)}to{transform:skewX(-34deg) scale(.7,.6)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="gh-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="570"><stop offset="0" stop-color="#0b0814"/><stop offset=".3" stop-color="#160e1e"/>' +
      '<stop offset=".55" stop-color="#2c1622"/><stop offset=".75" stop-color="#4c2418"/><stop offset=".9" stop-color="#7a3c18"/><stop offset="1" stop-color="#9a5420"/></linearGradient>' +
      '<radialGradient id="gh-sg"><stop offset="0" stop-color="#ffb060" stop-opacity=".5"/><stop offset=".3" stop-color="#e8742c" stop-opacity=".22"/><stop offset="1" stop-color="#e8742c" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gh-hz"><stop offset="0" stop-color="#ffa050" stop-opacity=".45"/><stop offset=".45" stop-color="#c86428" stop-opacity=".16"/><stop offset="1" stop-color="#c86428" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gh-sd"><stop offset="0" stop-color="#fff0c8"/><stop offset=".45" stop-color="#ffc070"/><stop offset=".85" stop-color="#ff8a40"/><stop offset="1" stop-color="#f06a30"/></radialGradient>' +
      '<radialGradient id="gh-flg"><stop offset="0" stop-color="#fff0c4" stop-opacity=".85"/><stop offset=".3" stop-color="#ffc070" stop-opacity=".42"/><stop offset="1" stop-color="#ff9040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gh-ray" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffc878" stop-opacity=".26"/><stop offset=".4" stop-color="#ff9a50" stop-opacity=".08"/><stop offset="1" stop-color="#ff9a50" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="gh-mbg"><stop offset="0" stop-color="#0a0505" stop-opacity=".66"/><stop offset=".6" stop-color="#0a0505" stop-opacity=".3"/><stop offset="1" stop-color="#0a0505" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gh-fg"><stop offset="0" stop-color="#ffb860" stop-opacity=".3"/><stop offset=".5" stop-color="#e09040" stop-opacity=".12"/><stop offset="1" stop-color="#e09040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gh-fd" gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="0" y2="1000"><stop offset="0" stop-color="#6a4018"/><stop offset=".08" stop-color="#4a2c12"/><stop offset=".35" stop-color="#2c1a0c"/><stop offset="1" stop-color="#120a05"/></linearGradient>' +
      '<linearGradient id="gh-tx" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1300" y2="0"><stop offset="0" stop-color="#f2b25a" stop-opacity=".7"/><stop offset=".4" stop-color="#d89040" stop-opacity=".36"/><stop offset="1" stop-color="#8a5a28" stop-opacity=".18"/></linearGradient>' +
      '<linearGradient id="gh-dim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0806" stop-opacity="0"/><stop offset=".14" stop-color="#0d0806" stop-opacity=".4"/><stop offset=".86" stop-color="#0d0806" stop-opacity=".4"/><stop offset="1" stop-color="#0d0806" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="gh-shg"><stop offset="0" stop-color="#ffd890" stop-opacity=".34"/><stop offset=".5" stop-color="#f0b060" stop-opacity=".16"/><stop offset="1" stop-color="#f0b060" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gh-ffg"><stop offset="0" stop-color="#f6ffb0"/><stop offset=".25" stop-color="#e0f070" stop-opacity=".8"/><stop offset=".6" stop-color="#b8d040" stop-opacity=".2"/><stop offset="1" stop-color="#b8d040" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The dusk sky, its first stars and the evening star.
      '<rect width="1600" height="1000" fill="url(#gh-sky)"/>' +
      stars +
      '<g class="mv-r"><g class="mv-t"><circle cx="1452" cy="96" r="12" fill="#fff0d8" fill-opacity=".1"/><circle cx="1452" cy="96" r="2.2" fill="#fff4e0"/></g></g>' +
      // The sun's glow, the haze along the horizon, the rays of done and the sun itself.
      '<circle class="gh-sgl" cx="250" cy="556" r="420" fill="url(#gh-sg)"/>' +
      '<ellipse cx="250" cy="560" rx="900" ry="90" fill="url(#gh-hz)"/>' +
      `<g class="gh-rays" fill="url(#gh-ray)">${rays}</g>` +
      '<g class="gh-sun"><circle cx="250" cy="548" r="46" fill="url(#gh-sd)" fill-opacity=".95"/>' +
      '<circle class="gh-rim" cx="250" cy="548" r="46" fill="none" stroke="#fff2c8" stroke-width="3"/></g>' +
      `<g class="gh-cl">${cloudSet(5, true)}</g><g class="gh-cl" style="animation-direction:alternate-reverse">${cloudSet(4, false)}</g>` +
      kite +
      egrets +
      flock() +
      // The village on the horizon.
      `<path d="${hedge}" fill="#140b0a"/>` +
      `<path d="${plumes}${palms}" fill="none" stroke="#140b0a" stroke-width="3" stroke-linecap="round"/>` +
      '<path d="M860 566L872 548Q882 540 900 538H1020Q1038 540 1048 548L1060 566ZM874 548q-10 -2 -14 -12M1046 548q10 -2 14 -12M900 538L912 528H1008L1020 538" fill="#140b0a" stroke="#140b0a" stroke-width="3"/>' +
      // The field, its far rows of gold and the dikes between the paddies.
      '<rect y="562" width="1600" height="460" fill="url(#gh-fd)"/>' +
      `<path d="${texture}" fill="none" stroke="url(#gh-tx)" stroke-width="2" stroke-linecap="round"/>` +
      '<path d="M-20 612Q400 604 820 608T1640 606M-20 652Q500 642 900 648T1640 644M-20 708Q400 696 800 702T1640 698" fill="none" stroke="#120904" stroke-opacity=".5" stroke-width="3"/>' +
      '<ellipse cx="260" cy="604" rx="540" ry="74" fill="url(#gh-fg)"/>' +
      '<g class="gh-flare"><ellipse cx="250" cy="561" rx="330" ry="34" fill="url(#gh-flg)"/><ellipse cx="250" cy="561" rx="110" ry="5" fill="#fff4d6" fill-opacity=".8"/></g>' +
      // The dirt road home, from the banyan to the farmhouse yard.
      '<path d="M1232 858C900 788 560 660 140 598L152 606C580 690 930 860 1244 930Z" fill="#3e2a1a"/>' +
      '<path d="M1232 858C900 788 560 660 140 598" fill="none" stroke="#c08848" stroke-opacity=".3" stroke-width="2"/>' +
      banyan() +
      riceRow({ seed: 61, x0: -20, x1: 1220, cols: 12, base: 668, h: [24, 34], per: 6, s: 0.9, cls: 'gh-a' }) +
      '<g transform="translate(380 704)">' +
      scarecrow() +
      '</g>' +
      riceRow({ seed: 62, x0: -20, x1: 1220, cols: 11, base: 762, h: [54, 74], per: 6, s: 1.5, cls: 'gh-b' }) +
      '<g class="gh-sh"><ellipse cy="728" rx="230" ry="60" fill="url(#gh-shg)"/></g>' +
      '<g class="mv-b">' +
      riceRow({ seed: 63, x0: -30, x1: 1230, cols: 9, base: 1006, h: [120, 170], per: 5, s: 2.6, cls: 'gh-c' }) +
      '<g class="gh-sh" style="animation-delay:.3s"><ellipse cy="930" rx="300" ry="90" fill="url(#gh-shg)"/></g></g>' +
      // The chat column stays quiet.
      '<rect x="360" width="880" height="1000" fill="url(#gh-dim)"/>' +
      fireflies(71, 19, [0, 600, 430, 340], 1) +
      fireflies(72, 8, [440, 660, 720, 240], 0.45) +
      leaves +
      straw +
      `<g fill="none" stroke="#f0d6a8" stroke-opacity=".55" stroke-width="2" stroke-linecap="round">${winds}</g>`,
    nook:
      '<defs><radialGradient id="gh-lg"><stop offset="0" stop-color="#ffc878" stop-opacity=".5"/><stop offset=".5" stop-color="#ff9a48" stop-opacity=".14"/><stop offset="1" stop-color="#ff9a48" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gh-wgl"><stop offset="0" stop-color="#ffb060" stop-opacity=".34"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="gh-roof"><path d="M-16 -34L58 -196H440V-34Z"/></clipPath></defs>' +
      // Smoke from the kitchen fire behind the house.
      '<g class="gh-smw" fill="none" stroke="#7a6a66" stroke-linecap="round">' +
      [0, 1, 2]
        .map(
          i =>
            `<path class="gh-smk" pathLength="1" style="animation-delay:${-i * 2}s" stroke-opacity="${0.2 - i * 0.04}" stroke-width="${14 - i * 3}" ` +
            `d="M${330 + i * 8} -200c-16 -40 22 -70 6 -110c-14 -36 18 -70 4 -110c-10 -28 14 -50 8 -80"/>`,
        )
        .join('') +
      '</g>' +
      // The tiled roof with its curled ridge, lit along the top by the sunset.
      '<path d="M-16 -34L58 -196H440V-34Z" fill="#2a1610"/>' +
      `<g clip-path="url(#gh-roof)" fill="none" stroke="#140806"><path d="${tiles}" stroke-width="2"/></g>` +
      '<path d="M56 -198H440" stroke="#1c0d08" stroke-width="11"/><path d="M60 -198Q44 -200 36 -218" fill="none" stroke="#1c0d08" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M36 -218Q44 -203 60 -204H330M-16 -34L58 -196" fill="none" stroke="#f0904a" stroke-opacity=".4" stroke-width="2"/>' +
      '<rect x="-18" y="-40" width="460" height="13" fill="#1c1009"/><path d="M-18 -40H442" stroke="#6a4020" stroke-opacity=".5" stroke-width="2"/>' +
      `<path d="${rafters}" stroke="#140a05" stroke-width="7"/>` +
      // The house front: plank wall, wooden door panels behind Claude, a lit lattice window.
      '<rect y="-27" width="440" height="470" fill="#150d07"/>' +
      `<path d="${seams}" stroke="#0c0704" stroke-width="2"/>` +
      '<rect y="-6" width="440" height="9" fill="#21150b"/>' +
      `<path d="M30 6H230V440H30Z" fill="#1a110a"/><path d="${doors}" fill="none" stroke="#2a1b10" stroke-width="2.5"/>` +
      '<path d="M80 6V440M130 6V440M180 6V440" stroke="#0e0805" stroke-width="3"/>' +
      '<circle class="gh-win" cx="326" cy="88" r="130" fill="url(#gh-wgl)"/>' +
      '<rect x="256" y="24" width="140" height="126" fill="#5a3014"/>' +
      '<g class="gh-fl"><rect class="gh-win" x="256" y="24" width="140" height="126" fill="#f0a050"/></g>' +
      `<path d="${lattice}" stroke="#1a0f08" stroke-width="4"/>` +
      '<rect x="256" y="24" width="140" height="126" fill="none" stroke="#2c1b0e" stroke-width="8"/>' +
      // The porch pillars on their stone feet.
      `<rect y="-28" width="18" height="470" fill="${WOOD}"/><rect x="402" y="-28" width="18" height="470" fill="${WOOD}"/>` +
      '<path d="M3 -28V440M405 -28V440" stroke="#8a5a2c" stroke-opacity=".45" stroke-width="3"/>' +
      '<path d="M-5 438h28v18h-28zM397 438h28v18h-28z" fill="#3a302a"/>' +
      // The hurricane lantern hanging from the eave.
      '<g transform="translate(120 -27)"><g class="gh-lan"><path d="M0 0V22" stroke="#120a05" stroke-width="2"/>' +
      '<g class="gh-fl"><circle cy="46" r="110" fill="url(#gh-lg)"/></g>' +
      '<path d="M-9 22h18l3 6h-24z" fill="#2a1c10"/><ellipse cy="46" rx="11" ry="15" fill="#ffd28a" fill-opacity=".85"/>' +
      '<path d="M-11 46h22M0 31v30" stroke="#3a2614" stroke-width="1.5"/><path d="M-10 62h20v6h-20z" fill="#2a1c10"/></g></g>' +
      '<g transform="translate(120 19)"><g class="gh-mo"><path d="M28 0l-6 -5l6 2l6 -2z" fill="#e8d8b8" fill-opacity=".85"/></g></g>' +
      // The brick porch floor.
      '<rect x="-20" y="440" width="460" height="30" fill="#24170d"/><path d="M-20 440H440" stroke="#5a3a1c" stroke-opacity=".6" stroke-width="2"/>' +
      `<path d="${bricks}" stroke="#140c06" stroke-width="2"/>` +
      fireflies(73, 2, [22, 380, 30, 60], 1) +
      fireflies(74, 2, [376, 380, 24, 60], 1),
  }
}
