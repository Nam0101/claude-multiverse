import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Thunder Realm: Claude in a winged steel helm at a rune-stone tablet, high in a colossal world-tree above a sea of
// storm clouds. On a cliff in the tree stands a golden mead-hall with crossed dragon gables; two ravens circle it and
// a waterfall pours off the edge into the clouds. An old rune-carved hammer rests on a stone by the desk: a command
// lifts it to call lightning out of a ring of clouds, an error slams it down in a shock ring, done unfurls an aurora
// over the hall and brings the ravens down to roost.
const ACCENT = '#6fb7ff'
const LIT = '#b4dcff'
const GOLD = '#d9a441'
const BRASS = '#c9a040'
const BARK = '#1b1510'
const TIMBER = '#3a2414'
const WOOD = '#2a1c12'
const WOOD_EDGE = '#4a3220'
const STONE = '#2a303c'
const STONE_EDGE = '#4a5468'
const CORAL = '#d97757'

// Invented marks on a 10×14 grid: rings, curls, cups and dots, none of them a letter of any script.
const GLYPHS = [
  'M5 5.5V14M2 10L5 13L8 10M7.5 3A2.5 2.5 0 1 1 2.5 3A2.5 2.5 0 1 1 7.5 3',
  'M1 12A4 4 0 0 1 9 12M3.4 12A1.6 1.6 0 0 1 6.6 12M5 1.5V4.5',
  'M1 3Q3 0 5 3T9 3M5 4V10M6.8 12a1.8 1.8 0 1 1-3.6 0a1.8 1.8 0 1 1 3.6 0',
  'M3 7a2 2 0 1 1 4 0a4 4 0 1 1-8 0M8 13L5 11',
  'M1 2Q5 6 9 2M1 7Q5 11 9 7M5 9V14',
  'M2 2Q0 7 2 12M8 2Q10 7 8 12M5 3v.1M5 7v.1M5 11v.1',
  'M2 3A3 3 0 0 1 8 3M5 6V13M2 9.5h.1M8 9.5h.1',
  'M1 6Q5 0 9 6M3 9v.1M7 9v.1M5 12.5v.1',
]

type Mark = [x: number, y: number, scale: number, turn: number, glyph: number]

/** A mark centred on (x, y), turned and scaled, as one matrix. */
function mark([x, y, s, r, k]: Mark, extra = ''): string {
  const c = s * Math.cos((r * Math.PI) / 180)
  const n = s * Math.sin((r * Math.PI) / 180)
  const q = (v: number) => String(Math.round(v * 1000) / 1000)

  return `<path${extra} transform="matrix(${q(c)} ${q(n)} ${q(-n)} ${q(c)} ${f(x - 5 * c + 7 * n)} ${f(y - 5 * n - 7 * c)})" d="${GLYPHS[k % 8]}"/>`
}

/** An eight-point starburst: Claude's own emblem. */
function star(cx: number, cy: number, big: number, small: number): string {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const r = i % 2 === 0 ? big : small

    return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`
  })

  return `M${points.join('L')}Z`
}

/** A sea of cloud billows wide enough to slide one period left without a seam. */
function billow(i: number, y: number, p: number, h: number, fill: string, rim: string, secs: number): { svg: string; css: string } {
  const widths = [0.4, 0.25, 0.35]
  const heights = [1, 0.7, 0.85]
  const n = Math.ceil((1600 + 2 * p) / p)
  let d = `M${-p} ${y}`

  for (let k = 0; k < n; k += 1) {
    for (let j = 0; j < 3; j += 1) {
      d += `a${f((widths[j]! * p) / 2)} ${f(heights[j]! * h)} 0 0 1 ${f(widths[j]! * p)} 0`
    }
  }

  return {
    svg:
      `<path style="animation:tr-sea${i} ${secs}s linear infinite" d="${d}V1100H${-p}Z" fill="${fill}" stroke="${rim}" stroke-opacity=".5" stroke-width="2"/>`,
    css: `@keyframes tr-sea${i}{to{transform:translateX(${-p}px)}}`,
  }
}

/** A storm cloud layer: dark bodies over a faintly lit rim. */
function storm(seed: number, x0: number, n: number, step: number, y0: number, y1: number): string {
  const next = random(seed)
  const tones = ['#0b1019', '#0d1320', '#0a0e17']
  let rim = ''
  let body = ''

  for (let i = 0; i < n; i += 1) {
    const cx = x0 + i * step + next() * 50
    const cy = y0 + next() * (y1 - y0)
    const rx = 110 + next() * 90
    const ry = 40 + next() * 36

    rim += `<ellipse cx="${f(cx - 6)}" cy="${f(cy - 7)}" rx="${f(rx + 5)}" ry="${f(ry + 5)}"/>`
    body += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${tones[i % 3]}"/>`
  }

  return `<g fill="#26354f">${rim}</g>${body}`
}

/** A mass of the canopy: big dark overlapping crowns with a dim rim. */
function leaves(seed: number, cx: number, cy: number, n: number, spread: number): string {
  const next = random(seed)
  let body = ''

  for (let i = 0; i < n; i += 1) {
    const x = cx + (next() - 0.5) * spread
    const y = cy + (next() - 0.5) * spread * 0.35

    body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(70 + next() * 50)}" ry="${f(36 + next() * 22)}" fill="${i % 2 ? '#09130f' : '#0b1713'}"/>`
  }

  return `<g stroke="#1d3a31" stroke-opacity=".55" stroke-width="2.5">${body}</g>`
}

/** A bird's flight around an ellipse: it banks at the ends and grows a little on the near side. */
function orbitKeys(name: string, cx: number, cy: number, rx: number, ry: number, ph: number, size: number): string {
  const steps = 12
  const frames = Array.from({ length: steps + 1 }, (_, k) => {
    const a = ph + (k / steps) * Math.PI * 2
    const s = size * (1 + 0.16 * Math.sin(a))
    const raw = -3 * Math.sin(a)
    const face = Math.abs(raw) < 0.2 ? (raw < 0 || (raw === 0 && Math.cos(a) > 0) ? -0.2 : 0.2) : Math.max(-1, Math.min(1, raw))

    return `${f((k / steps) * 100)}%{transform:translate(${f(cx + rx * Math.cos(a))}px,${f(cy + ry * Math.sin(a))}px) scale(${(face * s).toFixed(2)},${s.toFixed(2)})}`
  }).join('')

  return `@keyframes ${name}{${frames}}`
}

const RAVEN_WINGS = 'M-4 -1C-6 -12 -14 -20 -25 -22C-18 -14 -12 -6 -8 1ZM3 -2C4 -14 10 -22 19 -26C14 -16 10 -8 7 0Z'
const RAVEN_BODY = 'M-17 3L-10 0Q-2 -4 8 -3L13 -6L17 -5L22 -3L15 -1Q10 3 0 4L-12 7Z'

function raven(cls: string): string {
  return (
    `<g class="${cls}"><g fill="#05070b" stroke="#a8bcdc" stroke-opacity=".75" stroke-width="1.4" stroke-linejoin="round">` +
    `<path class="tr-flap" d="${RAVEN_WINGS}"/><path d="${RAVEN_BODY}"/></g></g>`
  )
}

/** A gable dragon carved at the end of a barge board, looking outward. */
const DRAGON =
  `<path d="M-7 5C-8 -8 -2 -21 9 -29C17 -35 29 -35 37 -29L49 -25L41 -20L47 -15L33 -15C25 -15 19 -11 13 -2Z" fill="${TIMBER}" stroke="${BRASS}" stroke-opacity=".75" stroke-width="1.6" stroke-linejoin="round"/>` +
  `<path d="M3 -25C-5 -33 -5 -45 5 -49C3 -41 7 -35 13 -33" fill="none" stroke="${BRASS}" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>` +
  '<circle cx="22" cy="-26" r="3" fill="#120a05"/>'

/** The rune-stone tablet and its pebble keys. Self-contained: the portals draw the rig alone. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${254 + i * 13}" y="323" width="8" height="3" rx="1" fill="${light}" fill-opacity=".55"/>`).join('')
  const rows = [
    'M337 244h12m4 0h8m4 0h14',
    'M337 257h7m4 0h16m4 0h10',
    'M337 270h18m4 0h9m4 0h6',
    'M337 283h6m4 0h14m4 0h12',
    'M337 296h12m4 0h18',
    'M337 309h16m4 0h8',
  ]
  const text = rows
    .map((d, i) => `<path class="tr-tx" style="animation-delay:${f(-i * 0.35)}s" d="${d}"/>`)
    .join('')
  const mood =
    activity === 'error'
      ? `<path d="M348 232L358 258L350 270L364 296L356 322" fill="none" stroke="#ff7a5c" stroke-width="2.4" stroke-linejoin="round"/>`
      : activity === 'done'
        ? `<path d="${star(366, 276, 18, 6)}" fill="${CORAL}" fill-opacity=".9"/>`
        : ''

  return (
    `<path d="M244 330L250 319H336L341 330Z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="1.4" stroke-linejoin="round"/>` +
    keys +
    `<path d="M322 330L326 232L334 221L360 216L398 220L408 232L404 330Z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M331 322L334 234L396 232L397 322Z" fill="${light}" fill-opacity=".12" stroke="${light}" stroke-opacity=".55" stroke-width="1.5"/>` +
    `<g fill="none" stroke="${light}" stroke-opacity=".8" stroke-width="3" stroke-linecap="round">${text}</g>` +
    `<path d="M334 226L344 222M388 222L400 228" stroke="${STONE_EDGE}" stroke-width="2"/>` +
    mood
  )
}

export function thunderRealmWorld(): World {
  const next = random(41)

  // The cloud sea: far, middle (behind the cliff) and near (in front of it).
  const seaFar = billow(0, 668, 300, 26, '#0c1220', '#263652', 96)
  const seaMid = billow(1, 742, 420, 38, '#0e1626', '#2c3e5c', 74)
  const seaNear = billow(2, 846, 560, 52, '#111a2b', '#33476a', 58)

  // The ravens: a slow circle over the gables, a wide flight across the sky while Claude searches the web.
  const orbits =
    orbitKeys('tr-o1', 0, 0, 190, 70, -Math.PI / 2, 1.6) +
    orbitKeys('tr-o2', 0, 0, 160, 58, Math.PI / 2, 1.4) +
    orbitKeys('tr-w', 560, -140, 700, 90, -Math.PI / 2, 2.3)

  // The hall's runes: on the lintel over the door, then up both barge boards to the dragons.
  const ts = [0.16, 0.3, 0.44, 0.58, 0.72]
  const marks: [Mark, number][] = [
    ...[0, 1, 2, 3, 4].map((i): [Mark, number] => [[262 + i * 15, 521, 0.85, 0, i * 3], i]),
    ...ts.map((t, j): [Mark, number] => [[178 + 140 * t, 504 - 182 * t, 0.7, -52.4, j * 5 + 1], 5 + j]),
    ...ts.map((t, j): [Mark, number] => [[406 - 140 * t, 504 - 182 * t, 0.7, 52.4, j * 5 + 3], 5 + j]),
  ]
  const carved = marks.map(([m]) => mark(m)).join('')
  const lit = marks.map(([m, i]) => mark(m, ` class="tr-rn" style="--i:${i}"`)).join('')

  // The golden roof's shingle rows, between the ridge and the eave.
  const lerp = (a: readonly [number, number], b: readonly [number, number], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const shingles = [0.2, 0.4, 0.6, 0.8]
    .map(t => {
      const [x1, y1] = lerp([292, 356], [184, 498], t)
      const [x2, y2] = lerp([118, 370], [44, 488], t)

      return `M${f(x1!)} ${f(y1!)}L${f(x2!)} ${f(y2!)}`
    })
    .join('')

  // The aurora: rays along a rising curve over the hall, unfurling left to right.
  const ray = (i: number) => {
    const base = 300 - i * 6 + 22 * Math.sin(i * 0.55)
    const h = 170 + 40 * Math.sin(i * 0.9 + 1)

    return `<rect class="tr-ray" style="--d:${f(0.2 + i * 0.07)}s" x="${-20 + i * 22}" y="${f(base - h)}" width="26" height="${f(h)}"/>`
  }
  const all = Array.from({ length: 22 }, (_, i) => i)
  const rays =
    `<g fill="url(#tr-aur1)">${all.filter(i => i % 3 !== 2).map(ray).join('')}</g>` +
    `<g fill="url(#tr-aur2)">${all.filter(i => i % 3 === 2).map(ray).join('')}</g>`
  const auroraEdge = Array.from({ length: 22 }, (_, i) => `${i === 0 ? 'M' : 'L'}${f(-7 + i * 22)} ${f(296 - i * 6 + 22 * Math.sin(i * 0.55))}`).join('')

  const starsA: string[] = []
  const starsB: string[] = []

  for (let i = 0; i < 40; i += 1) {
    ;(i % 2 ? starsB : starsA).push(`M${f(next() * 1600)} ${f(6 + next() * 250)}h2.4v2.4h-2.4z`)
  }

  const smoke = [0, 1, 2].map(i => `<circle class="tr-smk" style="animation-delay:${f(-i * 2.5)}s" cx="206" cy="356" r="14" fill="url(#tr-smg)"/>`).join('')
  const falls = [390, 397, 404, 411]
    .map((x, i) => `<path class="tr-fl" style="animation-delay:${f(-i * 0.27)}s" d="M${x} 606L${x + (x - 400) * 0.6} 846"/>`)
    .join('')

  // Desk corner: the plinth's runes, the hammer's runes and its crackle.
  const plinthMarks = [0, 1, 2, 3, 4].map(i => [-6 + i * 17, 430, 0.85, 0, i * 3 + 2] as Mark)
  const hammerMarks: Mark[] = [
    [-4, 383, 0.75, 0, 6],
    [22, 383, 0.95, 0, 0],
    [43, 386, 0.7, 0, 3],
  ]
  const arcs = ['M-10 366l-9 -5l4 -5l-9 -6', 'M54 372l9 -4l-3 -6l9 -5', 'M14 404l-5 8l6 2l-4 8']
    .map((d, i) => `<path class="tr-arc" style="animation-delay:${f(-i * 0.4)}s" d="${d}"/>`)
    .join('')
  // The channel from the ring's eye to the hammer: two shapes that take turns, so it crackles without flashing.
  const channel = [
    'M150 -296L118.5 -252.3L127 -208.5L87.5 -164.8L96 -121L54.5 -77.3L55 -33.5L21.5 10.3L10 54M96 -121L122 -92L114 -62',
    'M150 -296L142.5 -252.3L103 -208.5L111.5 -164.8L72 -121L74.5 -77.3L35 -33.5L35.5 10.3L10 54M111.5 -164.8L84 -140L90 -112',
  ]
    .map(
      (d, i) =>
        `<g class="tr-c${i}"><path d="${d}" stroke="${ACCENT}" stroke-opacity=".3" stroke-width="9"/><path d="${d}" stroke="#eef6ff" stroke-opacity=".9" stroke-width="2.4"/></g>`,
    )
    .join('')
  const ringBolts = ['M96 -330L112 -318L104 -310L122 -296', 'M190 -336L176 -322L186 -314L168 -300']
    .map(
      (d, i) =>
        `<g class="tr-rb" style="animation-delay:${f(1.85 + i * 0.8)}s"><path d="${d}" pathLength="1" stroke="${ACCENT}" stroke-opacity=".35" stroke-width="7"/>` +
        `<path d="${d}" pathLength="1" stroke="#eef6ff" stroke-width="2"/></g>`,
    )
    .join('')
  const puffs = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2
    const r = 150 + (next() - 0.5) * 30
    const size = 30 + next() * 20

    return [f(r * Math.cos(a)), f(r * Math.sin(a)), f(size)]
  })
  const ringRims = puffs.map(([x, y, s]) => `<circle cx="${x}" cy="${Number(y) - 6}" r="${Number(s) + 4}"/>`).join('')
  const ringBodies = puffs.map(([x, y, s], i) => `<circle cx="${x}" cy="${y}" r="${s}" fill="${i % 2 ? '#101726' : '#0d1320'}"/>`).join('')
  const chips = [
    [-70, -60],
    [-40, -96],
    [10, -110],
    [60, -90],
    [96, -50],
    [-96, -30],
  ]
    .map(([dx, dy], i) => `<path class="tr-chip" style="--dx:${dx}px;--dy:${dy}px" d="M${18 + i * 2} 390l7 -5l6 6l-5 7z" fill="#5a6478"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#04060b',
      furniture: WOOD,
      metal: STONE,
      paper: '#e4d8bc',
      light: { idle: '#3d6f9e', work: ACCENT, bright: '#d2ecff' },
      headTop: 198,
      glowAt: [364, 276],
      device,
      wear: {
        // A winged steel helm: dome, crest band and brow band all end at 252, above the eyes; the wings sweep up
        // and out from the sides.
        front:
          '<g fill="#b8c4d4" stroke="#e6eef8" stroke-width="1.2" stroke-linejoin="round">' +
          [
            '',
            ' transform="matrix(-1 0 0 1 300 0)"',
          ]
            .map(
              t =>
                `<g${t}><g class="tr-wg"><path d="M72 236C54 230 36 214 26 186C42 200 58 210 76 220Z"/><path d="M74 228C60 214 50 192 50 160C62 182 72 200 84 216Z"/>` +
                '<path d="M82 222C76 204 76 182 84 158C90 180 92 200 94 216Z"/>' +
                '<path d="M44 204L70 222M60 184L78 214M84 172L88 210" fill="none" stroke="#7a879a" stroke-width="1.4"/></g></g>',
            )
            .join('') +
          '</g>' +
          '<path d="M68 248C68 214 104 192 150 192C196 192 232 214 232 248Z" fill="#6c788c" stroke="#9aa8bc" stroke-width="2"/>' +
          '<path d="M143 193H157V248H143Z" fill="#a8823e"/>' +
          '<path d="M92 224C106 207 124 200 138 199" fill="none" stroke="#d4deea" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="62" y="238" width="176" height="14" rx="4" fill="#4a5568" stroke="#8a98ae" stroke-width="1.5"/>' +
          `<g fill="#d8b45a">${[78, 106, 134, 166, 194, 222].map(x => `<circle cx="${x}" cy="245" r="2"/>`).join('')}</g>`,
      },
      seatArt:
        // A plank bench under a fur pelt.
        `<g stroke="${WOOD}" stroke-width="8" stroke-linecap="round"><path d="M114 362L104 452M188 362L198 452"/><path d="M110 420H192" stroke-width="5"/></g>` +
        `<rect x="100" y="349" width="104" height="13" rx="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        '<path d="M98 347H204V360Q200 368 192 364Q184 370 176 364Q166 369 158 363Q148 368 140 363Q130 369 122 364Q112 368 104 363Q98 366 98 360Z" fill="#4a4038" stroke="#6a5e52" stroke-width="1.2"/>',
      tableArt:
        // A heavy timber table with a carved wave along the apron and iron straps.
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="16" rx="2"/>` +
        '<rect x="182" y="346" width="18" height="110"/><rect x="436" y="346" width="18" height="110"/><rect x="200" y="404" width="236" height="8"/></g>' +
        '<path d="M176 339q8 -5 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0" fill="none" stroke="#8a6234" stroke-opacity=".7" stroke-width="1.6"/>' +
        '<g fill="#4a5466"><rect x="180" y="330" width="22" height="5"/><rect x="434" y="330" width="22" height="5"/></g>',
    },
    style:
      seaFar.css +
      seaMid.css +
      seaNear.css +
      orbits +
      // Storm clouds roll, leaves sway, far lightning glows behind the clouds now and then.
      '.tr-drift{animation:tr-drift 46s ease-in-out infinite alternate}.tr-drift2{animation-duration:58s;animation-direction:alternate-reverse}' +
      '@keyframes tr-drift{from{transform:translateX(-40px)}to{transform:translateX(40px)}}' +
      '.st-responding .tr-drift{animation-duration:12s}.st-responding .tr-drift2{animation-duration:15s}' +
      '.tr-sway{transform-origin:60px 380px;animation:tr-sway 9s ease-in-out infinite alternate}@keyframes tr-sway{from{transform:rotate(-.5deg)}to{transform:rotate(.6deg)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: two soft glows, each once per 9 s, 4.5 s apart, rising over ~.36 s.
      '.tr-lt{opacity:0;animation:tr-lt 9s ease-in-out infinite}.tr-lt2{animation-delay:-4.5s}' +
      '@keyframes tr-lt{0%,86%{opacity:0}90%{opacity:.3}100%{opacity:0}}' +
      '.st-run .tr-lt,.st-done .tr-lt{animation:none}' +
      // The hall: fire in the windows, smoke from the ridge, the waterfall.
      '.tr-win{animation:tr-win 3.4s ease-in-out infinite alternate}@keyframes tr-win{from{opacity:.7}to{opacity:1}}' +
      '.tr-hg{animation:tr-win 5s ease-in-out infinite alternate}' +
      '.st-sleeping .tr-win{animation:none;opacity:.4}' +
      '.tr-smk{transform-box:fill-box;transform-origin:center;opacity:0;animation:tr-smk 7.5s ease-out infinite}' +
      '@keyframes tr-smk{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:.4}100%{opacity:0;transform:translate(40px,-150px) scale(2.4)}}' +
      '.tr-fl{stroke-dasharray:24 42;animation:tr-fl 1s linear infinite}@keyframes tr-fl{to{stroke-dashoffset:-66}}' +
      '.tr-mist{transform-box:fill-box;transform-origin:center;animation:tr-mist 3.6s ease-in-out infinite alternate}' +
      '@keyframes tr-mist{from{transform:scale(.85);opacity:.5}to{transform:scale(1.15);opacity:.9}}' +
      // Thinking: the runes light one by one, up the boards to the dragons' eyes.
      '.tr-rn{opacity:0}' +
      '.st-thinking .tr-rn{animation:tr-rn 4.4s ease-in-out infinite;animation-delay:calc(var(--i) * .24s)}' +
      '@keyframes tr-rn{0%{opacity:0}7%,58%{opacity:1}74%,100%{opacity:0}}' +
      '.st-error .tr-lit{stroke:#ff7a5c}.st-error .tr-ey{fill:#ff7a5c}' +
      '.st-error .tr-rn{animation:tr-rerr 1.6s ease-out .68s both}@keyframes tr-rerr{0%{opacity:0}8%{opacity:.95}100%{opacity:0}}' +
      '.st-done .tr-lit{stroke:#ffd98a}.st-done .tr-ey{fill:#ffd98a}' +
      '.st-done .tr-rn{animation:tr-on 1.4s ease-out both;animation-delay:calc(var(--i) * .08s)}@keyframes tr-on{to{opacity:.9}}' +
      '.tr-emb,.tr-stars{opacity:0}.st-done .tr-emb{animation:tr-on 1.6s ease-out .4s both}.st-done .tr-stars{animation:tr-on 3s ease-out .8s both}' +
      // The ravens.
      '.tr-o1{animation:tr-o1 15s linear infinite}.tr-o2{animation:tr-o2 15s linear infinite}' +
      '.tr-flap{animation:tr-flap .46s ease-in-out infinite alternate}@keyframes tr-flap{from{transform:scaleY(1)}to{transform:scaleY(-.5)}}' +
      '.tr-o2 .tr-flap{animation-delay:-.2s}' +
      '.st-web .tr-o1{animation:tr-w 8s linear infinite}.st-web .tr-o2{animation:tr-w 8s linear -.9s infinite}' +
      '.st-done .tr-o1{animation:tr-d1 2.6s ease-in-out both}.st-done .tr-o2{animation:tr-d2 2.8s ease-in-out both}' +
      '@keyframes tr-d1{0%{transform:translate(0,-70px) scale(1.34,1.34)}35%{transform:translate(70px,-110px) scale(1.4,1.4)}70%{transform:translate(110px,-66px) scale(1.4,1.4)}100%{transform:translate(94px,-47px) scale(1.4,1.4)}}' +
      '@keyframes tr-d2{0%{transform:translate(0,58px) scale(-1.62,1.62)}40%{transform:translate(-110px,10px) scale(-1.5,1.5)}75%{transform:translate(-98px,30px) scale(-1.4,1.4)}100%{transform:translate(-91px,37px) scale(-1.4,1.4)}}' +
      '.st-done .tr-flap{animation:tr-fold 2.6s ease-in-out both}' +
      '@keyframes tr-fold{0%,20%,40%,60%{transform:scaleY(1)}10%,30%,50%{transform:scaleY(-.5)}75%{transform:scaleY(.4)}88%{transform:scaleY(.7)}100%{transform:scaleY(.12)}}' +
      '.st-error .tr-flock{animation:tr-scat 2s ease-out .68s both}@keyframes tr-scat{25%{transform:translate(-10px,-70px)}100%{transform:translate(0,0)}}' +
      '.st-error .tr-flap{animation-duration:.22s}' +
      // Done: the aurora unfurls over the hall.
      '.tr-ray{opacity:0;transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-done .tr-ray{animation:tr-unf 1.1s ease-out var(--d) both,tr-shim 2.8s ease-in-out calc(var(--d) + 1.1s) infinite alternate}' +
      '@keyframes tr-unf{from{opacity:0;transform:scaleY(.15)}to{opacity:.9;transform:scaleY(1)}}' +
      '@keyframes tr-shim{from{opacity:.9;transform:scaleY(1)}to{opacity:.55;transform:scaleY(.86)}}' +
      '.tr-ae{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-done .tr-ae{animation:tr-ae 1.8s ease-out .2s both}' +
      '@keyframes tr-ae{0%{opacity:.7;stroke-dashoffset:1}100%{opacity:.6;stroke-dashoffset:0}}' +
      // The ring of clouds over the desk: it turns slowly, and fast with a glowing eye while a command runs.
      '.tr-ring{animation:mv-spin 90s linear infinite}.st-run .tr-ring{animation-duration:6s}' +
      '.st-done .tr-ringg{animation:tr-off 3s ease-out both}.st-error .tr-ringg{animation:tr-off 1.4s ease-out .7s both}@keyframes tr-off{to{opacity:.3}}' +
      '.tr-eye{opacity:0}.st-run .tr-eye{animation:tr-eye 1.6s ease-in-out .4s infinite alternate}@keyframes tr-eye{from{opacity:.25}to{opacity:.6}}' +
      // The hammer: it lifts, turns head up and hovers on run; trembles on a tool; slams down on an error.
      '.tr-ham{transform-box:fill-box;transform-origin:center}' +
      '.st-run .tr-ham{animation:tr-lift 1.1s cubic-bezier(.3,0,.2,1) both,tr-hov 1.8s ease-in-out 1.1s infinite alternate}' +
      '@keyframes tr-lift{0%{transform:translate(0,0) rotate(0)}18%{transform:translate(0,5px) rotate(-4deg)}100%{transform:translate(-10px,-150px) rotate(180deg)}}' +
      '@keyframes tr-hov{from{transform:translate(-10px,-150px) rotate(180deg)}to{transform:translate(-10px,-158px) rotate(183deg)}}' +
      '.st-error .tr-ham{animation:tr-slam 1.2s both}' +
      '@keyframes tr-slam{0%{transform:translate(-6px,-136px) rotate(-8deg);animation-timing-function:ease-out}' +
      '40%{transform:translate(-8px,-156px) rotate(-16deg);animation-timing-function:cubic-bezier(.6,0,1,.6)}' +
      '56%{transform:translate(0,0) rotate(0);animation-timing-function:ease-out}62%{transform:translate(0,-9px) rotate(1.5deg)}70%,100%{transform:translate(0,0) rotate(0)}}' +
      '.st-tool .tr-ham{transform-origin:50% 100%;animation:tr-rat .2s ease-in-out infinite alternate}@keyframes tr-rat{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
      '.tr-hr{opacity:0}.st-responding .tr-hr{animation:tr-hum 1.6s ease-in-out infinite alternate}@keyframes tr-hum{from{opacity:.2}to{opacity:.85}}' +
      '.st-tool .tr-hr,.ultra .tr-hr{opacity:.8}.st-run .tr-hr{animation:tr-on .6s ease-out .4s both}' +
      // Small crackles, three a cycle a third apart: under three flashes a second.
      '.tr-arc{opacity:0}.st-tool .tr-arc,.st-run .tr-arc{animation:tr-arc 1.2s linear infinite}@keyframes tr-arc{0%,100%{opacity:0}8%{opacity:.9}20%{opacity:0}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the channel to the hammer is two thin shapes trading places 1.25 times a
      // second, two small bolts strike in the ring per 2.4 s, and the wide sky glow comes once per 2.4 s, peaks at .3
      // and ramps in over ~.14 s.
      '.tr-rb{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-run .tr-rb{animation:tr-bolt 2.4s linear infinite}' +
      '.tr-cbg{opacity:0}.st-run .tr-cbg{animation:tr-on .25s ease-out 1.05s both}' +
      '.st-run .tr-c0{animation:tr-alt .8s steps(1) infinite}.st-run .tr-c1{animation:tr-alt .8s steps(1) -.4s infinite}@keyframes tr-alt{0%{opacity:1}50%{opacity:0}}' +
      '@keyframes tr-bolt{0%{opacity:0;stroke-dashoffset:1}4%{opacity:1;stroke-dashoffset:0}12%{opacity:.9;stroke-dashoffset:0}24%,100%{opacity:0;stroke-dashoffset:0}}' +
      '.tr-sky,.tr-hgl{opacity:0}.st-run .tr-sky{animation:tr-sky 2.4s ease-out 1.05s infinite}@keyframes tr-sky{0%{opacity:0}6%{opacity:.3}34%,100%{opacity:0}}' +
      '.st-run .tr-hgl{animation:tr-hgl 2.4s ease-out 1.05s infinite}@keyframes tr-hgl{0%{opacity:.3}5%{opacity:1}40%,100%{opacity:.35}}' +
      // Read: the plinth's runes light in turn.
      '.tr-pr{opacity:0}.st-read .tr-pr{animation:tr-rn 2.6s ease-in-out infinite;animation-delay:calc(var(--i) * .3s)}' +
      // Error: the impact, a shock ring along the floor, chips, cracks, a jolt.
      '.tr-shk{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-error .tr-shk{animation:tr-shk 1.7s cubic-bezier(.2,.6,.3,1) .67s both}.st-error .tr-shk2{animation-delay:.9s}' +
      '@keyframes tr-shk{0%{opacity:0;transform:scale(.4)}6%{opacity:.95;transform:scale(.7)}100%{opacity:0;transform:scale(13)}}' +
      '.tr-dust{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-error .tr-dust{animation:tr-dust 1.6s ease-out .67s both}' +
      '@keyframes tr-dust{0%{opacity:0;transform:scale(.3)}15%{opacity:.8}100%{opacity:0;transform:scale(2.6,1.6)}}' +
      '.tr-imp{opacity:0}.st-error .tr-imp{animation:tr-imp .9s ease-out .62s both}@keyframes tr-imp{0%{opacity:0}15%{opacity:.7}100%{opacity:0}}' +
      '.tr-chip{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .tr-chip{animation:tr-chip 1s cubic-bezier(.2,.7,.4,1) .67s both}' +
      '@keyframes tr-chip{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(220deg)}}' +
      '.tr-crk{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}.st-error .tr-crk{animation:tr-crk 1.8s ease-out .68s both}' +
      '@keyframes tr-crk{0%{opacity:1;stroke-dashoffset:1}25%{opacity:1;stroke-dashoffset:0}100%{opacity:.35;stroke-dashoffset:0}}' +
      '.st-error .tr-jolt{animation:tr-jolt .5s ease-out .67s both}@keyframes tr-jolt{20%{transform:translate(-5px,3px)}45%{transform:translate(4px,-2px)}70%{transform:translate(-2px,1px)}100%{transform:translate(0,0)}}' +
      // The rig: the tablet's runes, the helm's wings flutter when done.
      '.tr-tx{animation:tr-tx 2.2s ease-in-out infinite alternate}@keyframes tr-tx{from{opacity:.45}to{opacity:1}}' +
      '.st-tool .tr-tx,.st-run .tr-tx{animation-duration:.6s}' +
      '.tr-wg{transform-origin:76px 226px}.st-done .tr-wg{animation:tr-wg .45s ease-in-out 6 alternate}@keyframes tr-wg{to{transform:rotate(-12deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060b"/><stop offset=".45" stop-color="#080c15"/><stop offset=".7" stop-color="#0d1320"/><stop offset="1" stop-color="#111a2a"/></linearGradient>' +
      '<radialGradient id="tr-hz"><stop offset="0" stop-color="#3a5f9a" stop-opacity=".18"/><stop offset="1" stop-color="#3a5f9a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tr-lg"><stop offset="0" stop-color="#c8dcff" stop-opacity=".5"/><stop offset="1" stop-color="#c8dcff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tr-hall"><stop offset="0" stop-color="#ffb850" stop-opacity=".26"/><stop offset=".5" stop-color="#ffa040" stop-opacity=".1"/><stop offset="1" stop-color="#ffa040" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="tr-roof" gradientUnits="userSpaceOnUse" x1="0" y1="356" x2="0" y2="498"><stop offset="0" stop-color="${GOLD}"/><stop offset="1" stop-color="#7a5018"/></linearGradient>` +
      '<linearGradient id="tr-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0a0"/><stop offset="1" stop-color="#c8822a"/></linearGradient>' +
      '<linearGradient id="tr-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8d0f0" stop-opacity=".38"/><stop offset="1" stop-color="#a8d0f0" stop-opacity=".08"/></linearGradient>' +
      '<radialGradient id="tr-mist"><stop offset="0" stop-color="#c8e0f8" stop-opacity=".3"/><stop offset="1" stop-color="#c8e0f8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tr-aur1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe0b8" stop-opacity="0"/><stop offset=".65" stop-color="#5fe0b8" stop-opacity=".2"/><stop offset=".93" stop-color="#9ff4d6" stop-opacity=".5"/><stop offset="1" stop-color="#b8ffe8" stop-opacity="0"/></linearGradient>' +
      `<linearGradient id="tr-aur2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ACCENT}" stop-opacity="0"/><stop offset=".65" stop-color="${ACCENT}" stop-opacity=".2"/><stop offset=".93" stop-color="#bfe0ff" stop-opacity=".45"/><stop offset="1" stop-color="#bfe0ff" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="tr-smg"><stop offset="0" stop-color="#7a8aa4" stop-opacity=".6"/><stop offset="1" stop-color="#7a8aa4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tr-emb"><stop offset="0" stop-color="#ffcf80" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#tr-sky)"/>' +
      `<g class="tr-stars" fill="#dce8ff"><path d="${starsA.join('')}"/><path d="${starsB.join('')}" fill-opacity=".6"/></g>` +
      '<ellipse cx="800" cy="650" rx="900" ry="100" fill="url(#tr-hz)"/>' +
      // The storm clouds across the top, in two layers rolling opposite ways, and the far lightning.
      `<g class="tr-drift">${storm(3, -120, 9, 210, 10, 150)}</g>` +
      `<g class="tr-drift tr-drift2">${storm(5, -40, 8, 230, 90, 230)}</g>` +
      '<g class="tr-lt"><circle cx="230" cy="80" r="220" fill="url(#tr-lg)"/><path d="M250 0l-14 46l16 5l-20 56l13 4l-16 44" fill="none" stroke="#e8f2ff" stroke-opacity=".6" stroke-width="2.2" stroke-linejoin="round"/></g>' +
      '<g class="mv-r"><g class="mv-t"><g class="tr-lt tr-lt2"><circle cx="1450" cy="90" r="200" fill="url(#tr-lg)"/><path d="M1470 0l-12 44l15 5l-18 52l12 4" fill="none" stroke="#e8f2ff" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round"/></g></g></g>' +
      // The aurora, behind the tree.
      rays +
      `<path class="tr-ae" pathLength="1" d="${auroraEdge}" fill="none" stroke="#c8ffec" stroke-width="2.4" stroke-linecap="round"/>` +
      // Far peaks through the cloud sea on the right.
      '<g class="mv-r"><path d="M1180 700L1262 566L1290 590L1340 500L1372 540L1410 470L1468 560L1500 538L1560 600L1640 560V700Z" fill="#0a0f18"/>' +
      '<path d="M1180 700L1262 566L1290 590L1340 500L1372 540L1410 470L1468 560L1500 538L1560 600L1640 560" fill="none" stroke="#3e5578" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"/></g>' +
      seaFar.svg +
      seaMid.svg +
      // The world-tree: a trunk rising behind the hall, its canopy along the top, framing the left third.
      `<path d="M-130 1000C-90 860 -80 700 -72 560C-66 420 -62 260 -46 90L112 64C104 200 112 340 126 460C140 580 180 760 270 1000Z" fill="${BARK}"/>` +
      '<path d="M-30 110C-36 200 -40 300 -44 400M2 96C0 200 -2 300 -4 420M36 90C38 190 42 300 46 420M74 82C72 190 78 300 88 420" fill="none" stroke="#4a3828" stroke-opacity=".8" stroke-width="3"/>' +
      '<path d="M16 150q8 14 0 28M60 220q-8 16 2 30M-20 260q8 12 0 26" fill="none" stroke="#5a4430" stroke-opacity=".7" stroke-width="2"/>' +
      '<path d="M112 64C104 200 112 340 126 460C140 580 180 760 214 880" fill="none" stroke="#b07a32" stroke-opacity=".45" stroke-width="4"/>' +
      '<path d="M-46 90C-62 260 -66 420 -72 560" fill="none" stroke="#5a6c90" stroke-opacity=".5" stroke-width="3"/>' +
      '<g class="tr-sway">' +
      `<g fill="${BARK}"><path d="M50 110C140 40 260 10 400 -6C520 -18 640 -26 760 -50L766 -24C640 0 520 14 400 26C280 40 170 80 110 150Z"/>` +
      '<path d="M-36 104C-70 60 -110 30 -160 10L-150 -20C-100 0 -60 30 -10 76Z"/><path d="M14 90C20 50 24 10 24 -30L70 -30C66 10 64 50 72 90Z"/></g>' +
      `<path d="M300 20C330 50 350 90 356 130M560 -10C600 14 626 44 640 84" fill="none" stroke="${BARK}" stroke-width="10" stroke-linecap="round"/>` +
      '<path d="M50 110C140 40 260 10 400 -6C520 -18 640 -26 760 -50" fill="none" stroke="#6a5038" stroke-opacity=".8" stroke-width="2.4"/>' +
      leaves(5, -20, 0, 4, 220) +
      leaves(1, 200, -6, 4, 240) +
      leaves(2, 440, -34, 4, 260) +
      leaves(4, 680, -56, 3, 220) +
      leaves(6, 360, 124, 2, 70) +
      leaves(7, 646, 94, 2, 60) +
      '</g>' +
      // A root as big as a ridge, down in the clouds.
      `<path d="M120 820C340 740 600 760 920 880" fill="none" stroke="${BARK}" stroke-width="34" stroke-linecap="round"/>` +
      '<path d="M120 806C340 726 600 746 920 866" fill="none" stroke="#2a2018" stroke-width="2"/>' +
      // The cliff in the tree.
      '<path d="M-40 598C40 588 130 590 210 598C290 606 370 600 448 612L456 640C440 690 456 730 430 770C410 810 370 850 330 880L-40 900Z" fill="#0b0f17"/>' +
      '<path d="M448 612L420 660L436 720M300 606L310 660L280 740M150 600L170 650" fill="none" stroke="#1b2230" stroke-width="2"/>' +
      '<path d="M-40 598C40 588 130 590 210 598C290 606 370 600 448 612" fill="none" stroke="#6a4c24" stroke-opacity=".5" stroke-width="2.5"/>' +
      // The golden hall.
      '<circle class="tr-hg" cx="280" cy="500" r="280" fill="url(#tr-hall)"/>' +
      '<g transform="matrix(1.15 0 0 1.15 -43.5 -90)">' +
      `<path d="M96 398L126 346M140 398L110 346" stroke="${TIMBER}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M126 346c4 -7 12 -9 17 -5l-6 3M110 346c-4 -7 -12 -9 -17 -5l6 3" fill="none" stroke="${BRASS}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>` +
      '<path d="M54 486L206 494V600L54 594Z" fill="#1a110a" stroke="#2e1e12" stroke-width="2"/>' +
      '<path d="M80 487V595M106 489V596M132 490V597M158 491V598M184 492V599" stroke="#2a1c10" stroke-width="2"/>' +
      `<g class="tr-win" fill="#ffc861">${[74, 112, 150].map(x => `<rect x="${x}" y="${506 + (x - 74) * 0.04}" width="10" height="12"/>`).join('')}</g>` +
      [78, 114, 150, 186]
        .map((x, i) => `<ellipse cx="${x}" cy="${f(556 + i * 1.4)}" rx="12" ry="15" fill="${i % 2 ? '#4a2a1e' : '#22324c'}" stroke="#8a6a30" stroke-width="2"/><circle cx="${x}" cy="${f(556 + i * 1.4)}" r="3" fill="${BRASS}"/>`)
        .join('') +
      '<path d="M292 356L184 498L44 488L118 370Z" fill="url(#tr-roof)"/>' +
      `<path d="${shingles}" stroke="#6a4612" stroke-opacity=".7" stroke-width="2" stroke-dasharray="9 3"/>` +
      '<path d="M292 356L118 370" stroke="#f0c860" stroke-opacity=".85" stroke-width="4" stroke-linecap="round"/><path d="M184 498L44 488" stroke="#4a2e10" stroke-width="4"/>' +
      '<rect x="206" y="490" width="172" height="110" fill="#1f140c"/>' +
      '<path d="M226 490V600M246 490V600M338 490V600M358 490V600" stroke="#2e1e12" stroke-width="2"/>' +
      `<g fill="${TIMBER}"><rect x="202" y="486" width="10" height="114"/><rect x="372" y="486" width="10" height="114"/></g>` +
      '<path d="M206 492L292 372L378 492Z" fill="#1a100a"/>' +
      '<circle class="tr-emb" cx="292" cy="444" r="46" fill="url(#tr-emb)"/>' +
      `<circle cx="292" cy="444" r="22" fill="#24160c" stroke="${BRASS}" stroke-width="3"/><path d="${star(292, 444, 17, 5)}" fill="${CORAL}" fill-opacity=".85"/>` +
      '<path d="M182 500L292 354L402 500L386 500L292 374L198 500Z" fill="#b07a26"/>' +
      `<rect x="250" y="510" width="84" height="22" fill="${TIMBER}" stroke="#6a4a22" stroke-width="1.6"/>` +
      '<path d="M268 600V556Q292 532 316 556V600Z" fill="url(#tr-door)"/><path d="M300 600V546Q309 548 316 556V600Z" fill="#2a1a0e"/>' +
      '<g class="tr-win" fill="#ffc861"><rect x="222" y="540" width="10" height="16"/><rect x="352" y="540" width="10" height="16"/></g>' +
      '<ellipse cx="292" cy="606" rx="70" ry="8" fill="#ffc861" fill-opacity=".22"/>' +
      '<path d="M178 504L318 322M406 504L266 322" stroke="#7a5420" stroke-width="16"/>' +
      `<path d="M178 504L318 322M406 504L266 322" stroke="${TIMBER}" stroke-width="12"/>` +
      `<g transform="translate(318 322)">${DRAGON}</g><g transform="translate(266 322) scale(-1 1)">${DRAGON}</g>` +
      `<g fill="none" stroke="#9a7a44" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${carved}</g>` +
      `<g class="tr-lit" fill="none" stroke="${LIT}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${lit}` +
      `<circle class="tr-rn tr-ey" style="--i:10" cx="340" cy="296" r="3.4" fill="${LIT}" stroke="none"/><circle class="tr-rn tr-ey" style="--i:10" cx="244" cy="296" r="3.4" fill="${LIT}" stroke="none"/></g>` +
      smoke +
      '</g>' +
      // Roots over the cliff and down into the clouds.
      `<g fill="none" stroke="${BARK}" stroke-linecap="round"><path d="M100 604C180 632 300 642 400 680C440 696 452 740 440 800" stroke-width="20"/>` +
      '<path d="M80 640C140 700 200 760 230 860" stroke-width="16"/><path d="M30 700C50 780 40 860 20 940" stroke-width="22"/>' +
      '<path d="M150 610C240 600 360 612 470 650C520 668 560 700 580 760" stroke-width="12"/></g>' +
      '<path d="M100 598C180 626 300 636 400 674M150 605C240 595 360 607 470 645" fill="none" stroke="#3a2c1e" stroke-width="2"/>' +
      // The waterfall off the cliff's lip.
      '<path d="M386 604L410 604L424 846L374 846Z" fill="url(#tr-fall)"/>' +
      `<g fill="none" stroke="#d8ecff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round">${falls}</g>` +
      '<ellipse class="tr-mist" cx="398" cy="836" rx="70" ry="26" fill="url(#tr-mist)"/>' +
      // The ravens.
      `<g class="tr-flock"><g transform="translate(255 285)">${raven('tr-o1')}${raven('tr-o2')}</g></g>` +
      seaNear.svg,
    nook:
      '<defs><radialGradient id="tr-eyeg"><stop offset="0" stop-color="#dcefff" stop-opacity=".7"/><stop offset=".45" stop-color="#6fb7ff" stop-opacity=".3"/><stop offset="1" stop-color="#6fb7ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tr-skyg"><stop offset="0" stop-color="#bcd8ff" stop-opacity=".9"/><stop offset="1" stop-color="#bcd8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tr-hglg"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".8"/><stop offset=".4" stop-color="#6fb7ff" stop-opacity=".35"/><stop offset="1" stop-color="#6fb7ff" stop-opacity="0"/></radialGradient></defs>' +
      // The ring of clouds over the desk, its eye and the sky glow.
      '<circle class="tr-sky" cx="150" cy="-300" r="300" fill="url(#tr-skyg)"/>' +
      '<g class="tr-ringg"><g transform="translate(150 -320)"><circle class="tr-eye" r="120" fill="url(#tr-eyeg)"/>' +
      '<g transform="scale(1 .3)"><g class="tr-ring"><circle r="124" fill="#05080e" fill-opacity=".6"/><circle r="118" fill="none" stroke="#2e4262" stroke-width="6" stroke-dasharray="46 30"/>' +
      `<g fill="#34486a">${ringRims}</g>${ringBodies}</g></g></g></g>` +
      `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${ringBolts}<g class="tr-cbg">${channel}</g></g>` +
      // The ledge, the plinth and the hammer.
      '<path d="M-160 452C-80 444 40 446 160 450C260 452 360 446 440 450V470H-160Z" fill="#0d1119" stroke="#2a3346" stroke-width="2"/>' +
      // Plinth and hammer drawn a quarter larger around the plinth's foot.
      '<g transform="matrix(1.25 0 0 1.25 -5.5 -114)"><g class="tr-jolt">' +
      '<circle class="tr-hgl" cx="12" cy="157" r="60" fill="url(#tr-hglg)"/>' +
      `<path d="M-26 456L-22 410L-14 404H62L70 410L74 456Z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
      '<path d="M-20 416H68" stroke="#1c212b" stroke-width="2"/>' +
      `<g fill="none" stroke="#5a6680" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${plinthMarks.map(m => mark(m)).join('')}</g>` +
      `<g fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${plinthMarks.map((m, i) => mark(m, ` class="tr-pr" style="--i:${i}"`)).join('')}</g>` +
      '<path class="tr-crk" pathLength="1" d="M24 404L18 420L28 432L20 454M24 404L40 418L36 440" fill="none" stroke="#ff8a5a" stroke-width="2"/>' +
      '<g class="tr-ham">' +
      '<path d="M20 290Q22 284 24 290L26 356H18Z" fill="#3a281a" stroke="#5a4430" stroke-width="1.2"/><path d="M22 298V350" stroke="#24180f" stroke-width="1.4"/>' +
      '<rect x="15" y="352" width="14" height="7" rx="1.5" fill="#5a6476"/>' +
      '<path d="M10 359H34Q37 359 37 362V372C46 374 54 384 56 402C50 394 43 391 37 393V403Q37 406 34 406H10Q7 406 7 403V396L0 394L-10 404V360L0 370L7 368V362Q7 359 10 359Z" fill="#4a5466" stroke="#8090a8" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M7 368V396M37 372V393" stroke="#2e3644" stroke-width="2"/>' +
      `<g fill="none" stroke="#2a313e" stroke-width="1.8" stroke-linecap="round">${hammerMarks.map(m => mark(m)).join('')}</g>` +
      `<g class="tr-hr" fill="none" stroke="${LIT}" stroke-width="2" stroke-linecap="round">${hammerMarks.map(m => mark(m)).join('')}</g>` +
      `<g fill="none" stroke="#cfe8ff" stroke-width="1.6" stroke-linejoin="round">${arcs}</g>` +
      '</g></g></g>',
    front:
      '<defs><radialGradient id="tr-impg"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".8"/><stop offset="1" stop-color="#6fb7ff" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="tr-imp" cx="22" cy="430" r="90" fill="url(#tr-impg)"/>' +
      '<g fill="none" stroke="#d8ecff" vector-effect="non-scaling-stroke">' +
      '<ellipse class="tr-shk" cx="22" cy="454" rx="40" ry="9" stroke-width="5" vector-effect="non-scaling-stroke"/>' +
      '<ellipse class="tr-shk tr-shk2" cx="22" cy="454" rx="40" ry="9" stroke-width="3" stroke-opacity=".8" vector-effect="non-scaling-stroke"/></g>' +
      '<g fill="#7a8498" fill-opacity=".35"><ellipse class="tr-dust" cx="-10" cy="452" rx="40" ry="14"/><ellipse class="tr-dust" cx="54" cy="452" rx="40" ry="14"/></g>' +
      chips,
  }
}
