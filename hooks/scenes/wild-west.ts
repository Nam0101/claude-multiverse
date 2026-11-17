import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Wild West: a telegraph operator in a cowboy hat at a station-office desk, a frontier town at night under a huge
// moon. A wooden trestle crosses a canyon in the top-left; when a command runs a lit steam train thunders over it.
const SIL = '#07050f'
const MID = '#100b20'
const FAR = '#1b1637'
const AMBER = '#ffb347'
const WIN = '#ffc766'
const WOOD = '#2a1d16'
const WOOD_EDGE = '#43301f'
const BRASS = '#c8963c'

/** Flat-topped mesas along a horizon, as one path. */
function mesas(seed: number, base: number, from: number, to: number, hMin: number, hMax: number, wMin: number, wMax: number): string {
  const next = random(seed)
  let x = from
  let d = ''

  while (x < to) {
    const w = wMin + next() * (wMax - wMin)
    const h = hMin + next() * (hMax - hMin)
    const slope = 10 + next() * 24
    const step = next() > 0.55 ? 0.35 : 0

    d += `M${f(x)} ${base}L${f(x + slope)} ${f(base - h)}`
    d += step > 0 ? `H${f(x + w * 0.4)}V${f(base - h - 14)}H${f(x + w * 0.62)}V${f(base - h)}` : ''
    d += `H${f(x + w - slope)}L${f(x + w)} ${base}Z`
    x += w * (0.55 + next() * 0.35)
  }

  return d
}

/** A saguaro as fat round strokes, with a faint moonlit rim under it. */
function saguaro(x: number, base: number, h: number, s: number): string {
  const arm = h * 0.4
  const d = `M0 0V${f(-h)}M0 ${f(-arm)}H${f(-34 * s)}V${f(-arm - 56 * s)}M0 ${f(-arm - 34 * s)}H${f(32 * s)}V${f(-arm - 80 * s)}`

  return (
    `<g transform="translate(${x} ${base})" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${d}" stroke="#4a4f95" stroke-opacity=".3" stroke-width="${f(25 * s)}"/>` +
    `<path d="${d}" stroke="${SIL}" stroke-width="${f(20 * s)}"/></g>`
  )
}

/** Wind-mill wheel: a ring, ten blades, a hub. Drawn around (0, 0). */
function wheel(r: number): string {
  let blades = ''

  for (let i = 0; i < 10; i += 1) {
    const a = (i * 36 * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    // A blade is a thin kite along the radius.
    blades += `M${f(c * 8 - s * 3)} ${f(s * 8 + c * 3)}L${f(c * r - s * 7)} ${f(s * r + c * 7)}L${f(c * r + s * 7)} ${f(s * r - c * 7)}L${f(c * 8 + s * 3)} ${f(s * 8 - c * 3)}Z`
  }

  return `<path d="${blades}" fill="#2a2450" stroke="#8886c8" stroke-opacity=".55" stroke-width="1.2"/><circle r="${r}" fill="none" stroke="#2a2450" stroke-width="4"/><circle r="${r}" fill="none" stroke="#8886c8" stroke-opacity=".3" stroke-width="1"/><circle r="9" fill="${SIL}"/>`
}

function wheelSet(cx: number, cy: number, r: number): string {
  const spokes = `M${-r * 0.85} 0H${r * 0.85}M${f(-r * 0.43)} ${f(-r * 0.74)}L${f(r * 0.43)} ${f(r * 0.74)}M${f(r * 0.43)} ${f(-r * 0.74)}L${f(-r * 0.43)} ${f(r * 0.74)}`

  return (
    `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#0a0716" stroke="#4a468a" stroke-width="3"/>` +
    `<g class="ww-wh"><path d="${spokes}" stroke="#5a56a0" stroke-width="2.4"/></g><circle r="${f(r * 0.18)}" fill="#6a66b0"/></g>`
  )
}

/** The lit steam train, facing right with its nose at x 0 and the rails at y 0. */
function train(): string {
  const next = random(41)
  const dark = '#0b0818'
  const edge = '#4a4890'
  let cars = ''

  for (let k = 0; k < 4; k += 1) {
    const x = -372 - 120 * (k + 1) + 12
    const windows = [14, 38, 62, 86].map(w => `<rect x="${x + w}" y="-92" width="15" height="21"/>`).join('')

    cars +=
      `<rect x="${x}" y="-112" width="108" height="78" rx="4" fill="${dark}" stroke="${edge}" stroke-opacity=".5" stroke-width="2"/>` +
      `<path d="M${x - 4} -112Q${x + 54} -128 ${x + 112} -112Z" fill="#14102a"/>` +
      `<rect x="${x + 4}" y="-34" width="100" height="8" fill="#05030c"/>` +
      `<g fill="${WIN}" fill-opacity=".92">${windows}</g>` +
      wheelSet(x + 22, -14, 14) +
      wheelSet(x + 86, -14, 14)
  }

  const puffs = Array.from({ length: 8 }, (_, i) => {
    const r = 18 + next() * 12

    return (
      `<circle class="ww-sm" cx="-33" cy="-146" r="${f(r)}" fill="#6f6788" ` +
      `style="--dx:${f(-420 - next() * 260)}px;--dy:${f(-60 - next() * 70)}px;animation-delay:${f(-i * 0.3)}s"/>`
    )
  }).join('')

  return (
    // The long train behind the engine first, so the engine overlaps its tender.
    cars +
    // The tender and its coal.
    `<rect x="-372" y="-92" width="96" height="58" rx="3" fill="${dark}" stroke="${edge}" stroke-opacity=".5" stroke-width="2"/>` +
    '<path d="M-372 -92Q-346 -124 -322 -108Q-300 -128 -276 -92Z" fill="#04020a"/>' +
    wheelSet(-346, -16, 16) +
    wheelSet(-300, -16, 16) +
    // The cab, its roof and its lit windows.
    `<rect x="-262" y="-146" width="108" height="104" fill="${dark}" stroke="${edge}" stroke-opacity=".55" stroke-width="2"/>` +
    '<rect x="-272" y="-158" width="128" height="14" rx="3" fill="#161230"/>' +
    `<rect x="-246" y="-122" width="36" height="36" fill="${WIN}" fill-opacity=".95"/><rect x="-196" y="-122" width="30" height="36" fill="${WIN}" fill-opacity=".95"/>` +
    // The boiler, the domes, the stack and the cowcatcher.
    `<rect x="-166" y="-98" width="146" height="54" rx="22" fill="${dark}" stroke="${edge}" stroke-opacity=".55" stroke-width="2"/>` +
    '<path d="M-166 -62H-20" stroke="#6a66b0" stroke-opacity=".4" stroke-width="2"/>' +
    '<ellipse cx="-98" cy="-100" rx="14" ry="11" fill="#161230"/><ellipse cx="-138" cy="-100" rx="10" ry="9" fill="#161230"/>' +
    '<path d="M-54 -96L-48 -128L-62 -144H-4L-18 -128L-12 -96Z" fill="#0b0818" stroke="#4a4890" stroke-opacity=".5" stroke-width="2"/>' +
    `<path d="M-262 -44H8V-30H-262Z" fill="#05030c"/><path d="M12 -26L-16 -44V-4Z" fill="#05030c" stroke="${edge}" stroke-opacity=".5" stroke-width="2"/>` +
    '<path d="M12 -26L-16 -44M8 -18L-14 -30M4 -10L-12 -18" stroke="#6a66b0" stroke-opacity=".5" stroke-width="2"/>' +
    // The headlamp with its beam, and the connecting rod on the wheels.
    `<rect x="-28" y="-128" width="18" height="20" rx="3" fill="#fff0b8"/><path d="M-10 -118L300 -188V-48Z" fill="url(#ww-beam)"/>` +
    `<circle cx="-19" cy="-118" r="34" fill="url(#ww-lamp)"/>` +
    '<g class="ww-rod"><rect x="-190" y="-34" width="128" height="7" rx="3" fill="#6a66b0"/></g>' +
    wheelSet(-64, -28, 28) +
    wheelSet(-122, -28, 28) +
    wheelSet(-180, -28, 28) +
    puffs
  )
}

/** A hanging kerosene lamp's glass and brass, centered on its hook at (0, 0). */
function lamp(): string {
  return (
    `<path d="M0 0V26" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
    `<rect x="-9" y="24" width="18" height="6" rx="2" fill="${BRASS}"/>` +
    `<path d="M-10 30H10L12 60H-12Z" fill="${AMBER}" fill-opacity=".28" stroke="${BRASS}" stroke-width="2"/>` +
    `<path d="M0 36Q6 46 0 56Q-6 46 0 36Z" fill="#fff0b8"/>` +
    `<rect x="-14" y="60" width="28" height="8" rx="3" fill="${BRASS}"/>`
  )
}

/** The laptop beside a brass telegraph key and its ticker tape. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 11}" y="325" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const tape = activity === 'read' || activity === 'web' || activity === 'tool'

  return (
    // The laptop, seen from the side.
    '<rect x="246" y="323" width="92" height="7" rx="2" fill="#3a3128"/>' +
    keys +
    '<path d="M328 327L350 238L360 240L338 329Z" fill="#3a3128"/>' +
    `<path d="M329 324L349 242L353 243L333 326Z" fill="${light}"/>` +
    `<path d="M329 324L349 242L338 246L322 324Z" fill="${light}" fill-opacity=".2"/>` +
    // The telegraph key: a walnut base, a post and a brass lever with its knob.
    `<rect x="364" y="322" width="48" height="8" rx="2" fill="#4a2f1c" stroke="${WOOD_EDGE}"/>` +
    `<rect x="388" y="310" width="8" height="12" fill="${BRASS}"/>` +
    '<g transform="translate(392 313)"><g class="ww-key">' +
    `<path d="M-24 -2L18 -6L18 -2L-24 3Z" fill="${BRASS}"/><circle cx="-24" cy="-4" r="6" fill="#1b1008" stroke="${BRASS}" stroke-width="2"/></g></g>` +
    `<circle cx="408" cy="318" r="3" fill="${BRASS}"/><circle cx="372" cy="318" r="2.6" fill="${BRASS}"/>` +
    (tape ? `<path class="ww-tape" d="M398 330Q410 340 400 352" fill="none" stroke="${'#e8dcc0'}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="6 4"/>` : '')
  )
}

function pole(x: number): string {
  return (
    `<g fill="#0b0814"><rect x="${x - 6}" y="586" width="12" height="320"/><rect x="${x - 34}" y="590" width="68" height="8" rx="2"/>` +
    `<path d="M${x - 26} 590V582H${x - 21}V590M${x + 21} 590V582H${x + 26}V590" stroke="#6a68b0" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M${x - 6} 650L${x - 22} 668M${x + 6} 650L${x + 22} 668" stroke="#0b0814" stroke-width="3"/></g>`
  )
}

export function wildWestWorld(): World {
  const next = random(88)
  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = next() * 1600
    const y = next() * 520
    const r = 0.8 + next() * 1.1
    const twinkle = i % 4 === 0

    return `<circle${twinkle ? ` class="ww-tw" style="animation-delay:${f(-next() * 4)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#dfe3ff" fill-opacity="${f(0.3 + next() * 0.45)}"/>`
  }).join('')

  // The trestle: four bents with splayed legs, a tie and an X at every story, and a long X under the deck.
  const deck = 270
  const foot = 650
  const bentX = [200, 310, 420, 530]
  const half = (y: number) => 13 + ((y - deck) / (foot - deck)) * 13
  const stories = [350, 430, 510, 590, foot]
  let legs = ''
  let ties = ''
  let braces = ''

  for (const cx of bentX) {
    legs += `M${cx - 13} ${deck}L${cx - 26} ${foot}M${cx + 13} ${deck}L${cx + 26} ${foot}`

    stories.forEach((y, k) => {
      ties += `M${f(cx - half(y))} ${y}H${f(cx + half(y))}`

      if (k > 0) {
        const up = stories[k - 1] as number

        braces += `M${f(cx - half(up))} ${up}L${f(cx + half(y))} ${y}M${f(cx + half(up))} ${up}L${f(cx - half(y))} ${y}`
      }
    })
  }

  for (let i = 0; i < bentX.length - 1; i += 1) {
    const a = bentX[i] as number
    const b = bentX[i + 1] as number

    braces += `M${a} ${deck + 10}L${b} 350M${b} ${deck + 10}L${a} 350M${a} 350L${b} 430M${b} 350L${a} 430`
  }

  // Wires: two per span between four poles and into the office wall. `pulse` carries dots along the same curves.
  const polesX = [30, 420, 800, 1150]
  let wires = ''

  for (let i = 0; i < polesX.length - 1; i += 1) {
    const a = polesX[i] as number
    const b = polesX[i + 1] as number

    for (const [dy, sag] of [[0, 38], [14, 44]] as const) {
      wires += `M${a - 26} ${586 + dy}Q${(a + b) / 2} ${586 + dy + sag * 2} ${b - 26} ${586 + dy}`
      wires += `M${a + 26} ${586 + dy}Q${(a + b) / 2} ${586 + dy + sag * 2} ${b + 26} ${586 + dy}`
    }
  }

  wires += 'M1176 586Q1200 640 1226 660M1176 600Q1204 654 1226 672'

  const windows = (list: number[][], w: number, h: number) =>
    list.map(([x, y], i) => `<rect class="ww-win" style="animation-delay:${f(-i * 0.7)}s" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')
  const rocks = Array.from({ length: 14 }, (_, i) => {
    const dx = -210 + next() * 560
    const h = 120 + next() * 240
    const s = 9 + next() * 9
    const piece =
      i % 3 === 0
        ? `<rect x="${f(-s * 1.6)}" y="-3" width="${f(s * 3.2)}" height="6" fill="#4a3220" stroke="#b08a60" stroke-opacity=".8" stroke-width="1.4"/>`
        : `<path d="M${-s} 0L${f(-s * 0.4)} ${-s}L${s} ${f(-s * 0.5)}L${f(s * 0.6)} ${s}L${f(-s * 0.5)} ${f(s * 0.7)}Z" fill="#3a2f48" stroke="#a898b8" stroke-opacity=".8" stroke-width="1.4"/>`

    return (
      `<g transform="translate(130 760)"><g class="ww-rx" style="--dx:${f(dx)}px;--d:${f(0.05 + i * 0.04)}s"><g class="ww-ry" style="--h:${f(-h)}px;--g:${f(50 + next() * 70)}px">` +
      `<g class="ww-rr" style="--r:${f((next() - 0.5) * 900)}deg">${piece}</g></g></g></g>`
    )
  }).join('')
  // The smoke column: a stem of puffs that climbs, and a cap of bigger puffs that spreads at the top.
  const smoke = Array.from({ length: 15 }, (_, i) => {
    const cap = i >= 7
    const r = cap ? 46 + next() * 26 : 30 + next() * 18
    const dx = cap ? (next() - 0.5) * 230 : (next() - 0.5) * 40
    const dy = cap ? -(430 + next() * 130) : -(150 + (i + 1) * 48 + next() * 30)

    return `<circle class="ww-bs" cx="${f(122 + next() * 16)}" cy="${f(742 + next() * 14)}" r="${f(r)}" fill="#6a5e58" style="--dx:${f(dx)}px;--dy:${f(dy)}px;--d:${f(0.05 + i * 0.07)}s"/>`
  }).join('')
  // A dust ring that rolls out along the ground.
  const rings = [0, 1].map(i => `<ellipse class="ww-dr" style="--d:${i * 0.4}s" cx="130" cy="806" rx="26" ry="7" fill="none" stroke="#a08a70" stroke-width="7"/>`).join('')
  const weeds = Array.from({ length: 8 }, (_, i) => {
    const a = i * 22

    return `<ellipse rx="19" ry="${f(8 + (i % 3) * 4)}" fill="none" stroke="#6a5330" stroke-opacity=".85" stroke-width="1.6" transform="rotate(${a})"/>`
  }).join('')
  const bat = (x: number, y: number, d: number) =>
    `<g transform="translate(${x} ${y})"><g class="ww-bat" style="animation-delay:${d}s"><path d="M-10 0Q-5 -8 0 0Q5 -8 10 0Q5 -3 0 3Q-5 -3 -10 0Z" fill="#05030c"/></g></g>`
  const notes = [0, 1, 2]
    .map(
      i =>
        `<g class="ww-note" style="--dx:${f(-30 + i * 34)}px;animation-delay:${f(i * 0.55)}s"><g transform="translate(${420 + i * 40} 640)"><ellipse rx="5" ry="3.6" fill="${WIN}"/><path d="M4.4 0V-18" stroke="${WIN}" stroke-width="1.8"/></g></g>`,
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
      ink: '#07050c',
      furniture: WOOD,
      metal: '#3a3128',
      paper: '#e8dcc0',
      light: { idle: '#a8935a', work: '#ffcf6a', bright: '#fff0b8' },
      headTop: 204,
      glowAt: [338, 282],
      device,
      wear: {
        front:
          // The neckerchief sits under the eyes; the hat sits above them. Nothing covers the eyes.
          '<path d="M90 322H210L202 332L150 348L98 332Z" fill="#a23b2a"/>' +
          '<g fill="#f0d8b8" fill-opacity=".75"><circle cx="112" cy="328" r="2"/><circle cx="136" cy="334" r="2"/><circle cx="164" cy="334" r="2"/><circle cx="188" cy="328" r="2"/><circle cx="150" cy="341" r="2"/></g>' +
          '<circle cx="92" cy="326" r="7" fill="#8a2f22"/><circle cx="208" cy="326" r="7" fill="#8a2f22"/>' +
          // The hat: a wide curled brim, a pinched crown, a band with a brass concho.
          '<path d="M96 240C94 214 108 202 130 204L150 212L172 204C194 202 206 214 204 240Z" fill="#4d3626" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M150 212V240" stroke="#2a1a10" stroke-opacity=".7" stroke-width="3"/>' +
          '<path d="M96 240H204L205 228H95Z" fill="#241610"/>' +
          '<path d="M34 238C58 226 100 240 150 242C200 240 242 226 266 238C252 254 200 252 150 252C100 252 48 254 34 238Z" fill="#5b402b" stroke="#2a1a10" stroke-width="2"/>' +
          `<path d="M40 238C70 232 104 244 150 245C196 244 230 232 260 238" fill="none" stroke="#c28a4e" stroke-opacity=".6" stroke-width="2.2"/>` +
          `<circle cx="150" cy="234" r="5" fill="${BRASS}"/><circle cx="124" cy="234" r="3" fill="${BRASS}"/><circle cx="176" cy="234" r="3" fill="${BRASS}"/>`,
      },
      seatArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"><path d="M104 352H198L192 366H110Z"/>` +
        '<path d="M116 366L106 454M184 366L194 454M150 366V440" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M110 408H190" stroke-width="5"/></g>' +
        `<ellipse cx="151" cy="351" rx="48" ry="5" fill="#3d2a1d" stroke="${WOOD_EDGE}"/>`,
      tableArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="13" rx="2"/>` +
        '<rect x="182" y="343" width="12" height="113"/><rect x="438" y="343" width="12" height="113"/>' +
        '<rect x="198" y="350" width="236" height="52" rx="2" fill="#241912"/>' +
        '<path d="M316 350V402" stroke-width="2"/></g>' +
        `<g fill="${BRASS}"><circle cx="256" cy="376" r="3.4"/><circle cx="376" cy="376" r="3.4"/></g>` +
        '<path d="M170 336H468" stroke="#6a4a2e" stroke-opacity=".6" stroke-width="1.6"/>',
    },
    style:
      '.ww-tw{animation:ww-tw 3.4s ease-in-out infinite alternate}@keyframes ww-tw{from{opacity:.2}to{opacity:1}}' +
      '.st-thinking .ww-tw{animation-duration:1.5s}' +
      '.ww-win{animation:ww-fl 3.1s ease-in-out infinite alternate}@keyframes ww-fl{from{opacity:.72}to{opacity:1}}' +
      '.ww-lf{animation:ww-fl 2.3s ease-in-out infinite alternate}' +
      // The windmill: slow in the night breeze, fast when a tool runs.
      '.ww-wm{animation:mv-spin 16s linear infinite}.st-thinking .ww-wm{animation-duration:9s}' +
      '.st-tool .ww-wm{animation-duration:1.3s}' +
      '.ww-vane{transform-box:fill-box;transform-origin:0 50%;animation:ww-vane 7s ease-in-out infinite alternate}@keyframes ww-vane{to{transform:rotate(7deg)}}' +
      // Smoke from a chimney.
      '.ww-ch{transform-box:fill-box;transform-origin:center;animation:ww-ch 6s ease-out infinite;opacity:0}' +
      '@keyframes ww-ch{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:.4}100%{opacity:0;transform:translate(34px,-96px) scale(2.2)}}' +
      // The tumbleweed rolls through every so often.
      '.ww-tx{animation:ww-tx 17s linear -1.8s infinite}@keyframes ww-tx{0%{transform:translateX(-120px)}38%,100%{transform:translateX(1740px)}}' +
      '.ww-th{animation:ww-th .8s ease-in-out infinite alternate}@keyframes ww-th{from{transform:translateY(0)}to{transform:translateY(-18px)}}' +
      '.ww-tr{animation:mv-spin 1.5s linear infinite}' +
      '.ww-bat{animation:ww-bat 11s linear infinite}@keyframes ww-bat{0%{transform:translate(0,0) scale(1,1)}25%{transform:translate(90px,-26px) scale(1,.5)}50%{transform:translate(190px,10px) scale(1,1)}75%{transform:translate(290px,-20px) scale(1,.5)}100%{transform:translate(380px,6px) scale(1,1)}}' +
      // The telegraph: the key taps when words and tools flow, and dots race along the wires on the web.
      '.ww-key{transform-box:view-box}' +
      '.st-responding .ww-key{animation:ww-tap .42s ease-in-out infinite alternate}.st-tool .ww-key,.st-run .ww-key,.st-web .ww-key{animation:ww-tap .17s ease-in-out infinite alternate}' +
      '@keyframes ww-tap{from{transform:rotate(0)}to{transform:rotate(5deg)}}' +
      '.ww-tape{animation:ww-march .5s linear infinite}@keyframes ww-march{to{stroke-dashoffset:-20}}' +
      '.ww-pulse{opacity:0}.st-web .ww-pulse{opacity:1;animation:ww-pulse 1.2s linear infinite}' +
      '@keyframes ww-pulse{to{stroke-dashoffset:-96}}' +
      '.ww-note{opacity:0}.st-responding .ww-note{animation:ww-note 2.6s ease-out infinite}' +
      '@keyframes ww-note{0%{opacity:0;transform:translate(0,0)}20%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),-120px)}}' +
      // The train: off the trestle until a command runs, then it thunders across, trailing smoke.
      '.ww-train{opacity:0}.st-run .ww-train{animation:ww-go 6.8s linear -1.6s infinite}' +
      '@keyframes ww-go{0%{opacity:1;transform:translateX(-60px)}78%{opacity:1;transform:translateX(1900px)}78.1%,100%{opacity:0;transform:translateX(1900px)}}' +
      '.ww-wh{animation:mv-spin .75s linear infinite}' +
      '.ww-rod{animation:ww-rod .37s ease-in-out infinite alternate}@keyframes ww-rod{to{transform:translateY(5px)}}' +
      '.ww-sm{opacity:0;transform-box:fill-box;transform-origin:center;animation:ww-sm 2.4s ease-out infinite}' +
      '@keyframes ww-sm{0%{opacity:0;transform:translate(0,0) scale(.5)}12%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(3.4)}}' +
      '.ww-tres{animation:none}.st-run .ww-tres{animation:ww-rumble .16s linear infinite alternate}@keyframes ww-rumble{to{transform:translateY(1.4px)}}' +
      '.ww-hit{animation:none}' +
      // The dynamite: a slow orange bloom, smoke and rocks. Only the soft bloom is big, and it ramps over a second.
      '.ww-bloom,.ww-core,.ww-bs,.ww-rx,.ww-dr{opacity:0}' +
      '.st-error .ww-bloom{transform-box:fill-box;transform-origin:center;animation:ww-bloom 3.8s ease-out 0s both}' +
      '@keyframes ww-bloom{0%{opacity:0;transform:scale(.45)}20%{opacity:.34;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}' +
      '.st-error .ww-core{transform-box:fill-box;transform-origin:center;animation:ww-core 3s ease-out 0s both}' +
      '@keyframes ww-core{0%{opacity:0;transform:scale(.4)}15%{opacity:.7;transform:scale(1.15)}100%{opacity:0;transform:scale(1.7)}}' +
      '.st-error .ww-dr{transform-box:fill-box;transform-origin:center;animation:ww-dr 2.4s ease-out var(--d) both}@keyframes ww-dr{0%{opacity:0;transform:scale(.3)}12%{opacity:.7}100%{opacity:0;transform:scale(11,3.2)}}' +
      '.st-error .ww-ml{animation:ww-out .35s ease-out .1s both}@keyframes ww-out{to{opacity:0}}' +
      '.st-error .ww-bs{transform-box:fill-box;transform-origin:center;animation:ww-bs 3.6s cubic-bezier(.15,.7,.3,1) var(--d) both}' +
      '@keyframes ww-bs{0%{opacity:0;transform:translate(0,0) scale(.4)}14%{opacity:.75}65%{opacity:.55}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2.2)}}' +
      '.st-error .ww-rx{animation:ww-rx 2.7s linear var(--d) both}@keyframes ww-rx{0%{opacity:0}4%{opacity:1}78%{opacity:1}100%{opacity:0;transform:translateX(var(--dx))}}' +
      '.st-error .ww-ry{animation:ww-ry 2.7s linear var(--d) both}' +
      '@keyframes ww-ry{0%{transform:translateY(0);animation-timing-function:cubic-bezier(.2,.6,.4,1)}38%{transform:translateY(var(--h));animation-timing-function:cubic-bezier(.6,0,.9,.5)}100%{transform:translateY(var(--g))}}' +
      '.st-error .ww-rr{animation:ww-rr 2.7s linear var(--d) both}@keyframes ww-rr{to{transform:rotate(var(--r))}}' +
      '.st-error .ww-mine{animation:ww-quake .14s ease-in-out 8 .2s}@keyframes ww-quake{from{transform:translate(-2px,0)}to{transform:translate(2px,1px)}}' +
      '.st-error .ww-lf{animation-duration:.5s}' +
      // The coyote lifts its head and howls at the moon, and a shooting star crosses.
      '.ww-head{transform:rotate(-6deg)}.st-done .ww-head{animation:ww-howl 2.4s ease-in-out .3s both}' +
      '@keyframes ww-howl{0%{transform:rotate(-6deg)}40%,100%{transform:rotate(56deg)}}' +
      '.ww-ring{opacity:0}.st-done .ww-ring{transform-box:fill-box;transform-origin:0 100%;animation:ww-ring 1.8s ease-out 1.1s infinite}' +
      '@keyframes ww-ring{0%{opacity:0;transform:scale(.4)}25%{opacity:.7}100%{opacity:0;transform:scale(1.5)}}' +
      '.ww-ss{opacity:0}.st-done .ww-ss{animation:ww-ss 1.9s ease-in .5s both}' +
      '@keyframes ww-ss{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translate(-780px,190px)}}' +
      '.st-done .ww-ss2{animation-delay:1.7s}',
    scenery:
      '<defs>' +
      '<linearGradient id="ww-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04061a"/><stop offset=".38" stop-color="#0d0d2e"/><stop offset=".64" stop-color="#241a42"/><stop offset=".8" stop-color="#3b2442"/></linearGradient>' +
      '<radialGradient id="ww-mh"><stop offset="0" stop-color="#cfc8e8" stop-opacity=".2"/><stop offset=".5" stop-color="#8f8cc8" stop-opacity=".07"/><stop offset="1" stop-color="#8f8cc8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ww-amber"><stop offset="0" stop-color="#ffb347" stop-opacity=".5"/><stop offset=".5" stop-color="#ff9a3a" stop-opacity=".14"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ww-blast"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".95"/><stop offset=".35" stop-color="#ff9a3a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ww-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3b55" stop-opacity="0"/><stop offset="1" stop-color="#7a3b55" stop-opacity=".3"/></linearGradient>' +
      '<linearGradient id="ww-deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08060f" stop-opacity="0"/><stop offset="1" stop-color="#08060f" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="ww-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1226"/><stop offset="1" stop-color="#09060f"/></linearGradient>' +
      '<linearGradient id="ww-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd890" stop-opacity=".3"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ww-lamp"><stop offset="0" stop-color="#fff0b8" stop-opacity=".6"/><stop offset="1" stop-color="#fff0b8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ww-tail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="150" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ww-sky)"/>' +
      stars +
      // The huge moon and its halo, pinned to the right with the mesa and the coyote in front of it.
      '<g class="mv-r"><circle cx="1390" cy="410" r="250" fill="url(#ww-mh)"/>' +
      '<circle cx="1390" cy="410" r="104" fill="#bdb6a0" fill-opacity=".8"/>' +
      '<g fill="#9a9488" fill-opacity=".4"><ellipse cx="1359" cy="379" rx="23" ry="19"/><ellipse cx="1418" cy="438" rx="19" ry="15"/><ellipse cx="1382" cy="455" rx="13" ry="9"/><ellipse cx="1427" cy="377" rx="10" ry="8"/></g></g>' +
      '<g transform="translate(1500 60)"><g class="ww-ss "><path d="M0 0L150 -30L150 -26Z" fill="url(#ww-tail)"/><circle r="3.4" fill="#fff"/></g></g>' +
      '<g transform="translate(1380 170)"><g class="ww-ss ww-ss2"><path d="M0 0L150 -30L150 -26Z" fill="url(#ww-tail)"/><circle r="3.4" fill="#fff"/></g></g>' +
      bat(1180, 250, 0) +
      bat(1230, 300, -5) +
      // The far mesas along the horizon, a band of dusk haze and the canyon's far wall.
      `<path d="${mesas(5, 600, -40, 1700, 40, 110, 120, 280)}" fill="${FAR}"/>` +
      '<rect y="440" width="1600" height="360" fill="url(#ww-haze)"/>' +
      `<path d="${mesas(9, 640, -60, 1700, 30, 80, 140, 320)}" fill="#130f28"/>` +
      // The mesa at the right with the coyote standing on it against the moon.
      '<g class="mv-r"><path d="M1090 700L1126 560L1150 490L1176 474H1498L1516 494L1566 506L1640 528V760H1090Z" fill="#0b0818"/>' +
      '<path d="M1176 474H1498" stroke="#8886c8" stroke-opacity=".35" stroke-width="2"/>' +
      '<g transform="translate(1346 474) scale(1.55)"><g fill="#05030c" stroke="#05030c" stroke-linecap="round">' +
      '<ellipse cx="8" cy="-17" rx="13" ry="17" transform="rotate(14 8 -17)" stroke="none"/><path d="M-9 -26V0M-3 -24V0" stroke-width="4.4"/><path d="M14 -5C28 -2 36 -6 38 6" fill="none" stroke-width="6"/>' +
      '<path d="M0 -34C-4 -40 -8 -44 -10 -48" fill="none" stroke-width="9"/>' +
      '<g transform="translate(-10 -46)"><g class="ww-head"><ellipse cx="-4" cy="0" rx="9" ry="5.5" stroke="none"/><path d="M-10 -2L-28 3L-28 5.6L-10 4Z" stroke="none"/><path d="M0 -4L5 -17L7 -3ZM-6 -4L-3 -15L1 -4Z" stroke="none"/></g></g></g>' +
      '<g transform="translate(-34 -62)" fill="none" stroke="#e8e0f8" stroke-linecap="round" stroke-width="1.8"><path class="ww-ring" d="M0 0Q-8 -8 0 -16"/><path class="ww-ring" style="animation-delay:1.5s" d="M-6 4Q-18 -8 -6 -22"/><path class="ww-ring" style="animation-delay:1.9s" d="M-12 8Q-28 -8 -12 -28"/></g></g></g>' +
      // The trestle across the canyon, the long cliffs and the train, back to front.
      '<rect x="110" y="280" width="500" height="400" fill="#4a4a90" fill-opacity=".16"/>' +
      '<g class="ww-tres">' +
      `<path d="${legs}" stroke="#0a0714" stroke-width="7" fill="none"/>` +
      `<path d="${ties}" stroke="#0a0714" stroke-width="4" fill="none"/>` +
      `<path d="${braces}" stroke="#0a0714" stroke-width="3" fill="none"/>` +
      `<path d="${legs}" stroke="#9a98e0" stroke-opacity=".4" stroke-width="1.4" fill="none" transform="translate(-4 0)"/>` +
      '<rect x="100" y="270" width="520" height="16" fill="#0a0714"/><path d="M100 288H620" stroke="#0a0714" stroke-width="9" stroke-dasharray="3 16"/>' +
      '<path d="M100 270H620" stroke="#7a78c0" stroke-opacity=".4" stroke-width="1.6"/></g>' +
      '<rect x="140" y="400" width="480" height="400" fill="url(#ww-deep)"/>' +
      // The cliffs.
      `<path d="M-30 272H112L122 300L108 340L130 380L112 430L142 482L120 540L152 600L134 680L162 760L152 830H-30Z" fill="${MID}"/>` +
      `<path d="M590 272H812V820H640L626 740L652 690L620 630L642 570L614 500L638 440L608 380L626 330L596 300Z" fill="${MID}"/>` +
      '<path d="M-30 272H112M590 272H812" stroke="#8886c8" stroke-opacity=".3" stroke-width="2"/>' +
      '<path d="M-30 266H812" stroke="#6a68b0" stroke-opacity=".55" stroke-width="2"/><path d="M-30 272H812" stroke="#0a0714" stroke-width="5" stroke-dasharray="5 11"/>' +
      '<g transform="translate(0 270) scale(.8)"><g class="ww-train">' +
      train() +
      '</g></g>' +
      // The butte the track runs into, with a timber portal.
      `<path d="M806 274V206L832 150L876 124H970L1004 160L1022 232V820H806Z" fill="${MID}"/>` +
      '<path d="M806 150V272" stroke="#06040c" stroke-width="3"/><path d="M832 150H970" stroke="#8886c8" stroke-opacity=".3" stroke-width="2"/>' +
      '<path d="M796 272V146H816V272Z" fill="#06040c" stroke="#2a1d16" stroke-width="2"/><rect x="788" y="134" width="36" height="12" fill="#2a1d16"/>' +
      // The town's ground and a lit, dim row of false fronts.
      '<rect y="800" width="1600" height="220" fill="url(#ww-gnd)"/><path d="M-20 801H1620" stroke="#4a3f78" stroke-opacity=".35" stroke-width="2"/>' +
      // The water tower, church, hotel, stable and jail: dim shapes.
      `<g fill="${MID}"><path d="M672 800V686M708 800V686" stroke="${MID}" stroke-width="7"/><path d="M672 740L708 686M708 740L672 686" stroke="${MID}" stroke-width="3"/>` +
      '<rect x="654" y="630" width="72" height="58" rx="4"/><path d="M648 632L690 596L732 632Z"/><path d="M654 650H726M654 668H726" stroke="#2a2448" stroke-width="2"/></g>' +
      `<g fill="${MID}"><path d="M556 800V706L572 690H632L646 706V800Z"/><path d="M742 800V690H770V678H820V690H848V800Z"/>` +
      '<path d="M864 800V744L904 716L944 744V800Z"/><path d="M964 800V716H1062V800Z"/>' +
      '<path d="M1086 800V660H1132V800Z"/><path d="M1080 662L1109 598L1138 662Z"/></g>' +
      '<g stroke="#8886c8" stroke-opacity=".28" stroke-width="2" fill="none"><path d="M556 706L572 690H632L646 706M742 690H770V678H820V690H848M964 716H1062M1080 662L1109 598L1138 662"/></g>' +
      `<g fill="${WIN}" fill-opacity=".3"><rect x="578" y="728" width="22" height="26"/><rect x="760" y="722" width="18" height="24"/><rect x="812" y="722" width="18" height="24"/>` +
      '<rect x="984" y="740" width="14" height="18"/><rect x="1102" y="690" width="14" height="22"/></g>' +
      '<circle class="ww-ch" cx="808" cy="676" r="12" fill="#6a6280"/><circle class="ww-ch" style="animation-delay:-2s" cx="808" cy="676" r="11" fill="#6a6280"/><circle class="ww-ch" style="animation-delay:-4s" cx="808" cy="676" r="12" fill="#6a6280"/>' +
      // The saloon: a false front, a sign board, a balcony, lit windows and batwing doors.
      `<ellipse cx="450" cy="806" rx="170" ry="22" fill="url(#ww-amber)"/><circle class="ww-lf" cx="450" cy="700" r="170" fill="url(#ww-amber)" fill-opacity=".55"/>` +
      `<g fill="#120c20" stroke="#8886c8" stroke-opacity=".3" stroke-width="2"><rect x="360" y="626" width="180" height="174"/><path d="M420 626V594H480V626Z"/><rect x="352" y="620" width="196" height="9"/><rect x="348" y="702" width="204" height="8"/></g>` +
      `<rect x="428" y="600" width="44" height="22" fill="#3a2410" stroke="${AMBER}" stroke-opacity=".7" stroke-width="2"/><path d="M434 608H458M434 614H450M462 608H466" stroke="${AMBER}" stroke-opacity=".8" stroke-width="2"/>` +
      `<g fill="#120c20"><path d="M352 710V744M376 710V744M400 710V744M424 710V744M448 710V744M472 710V744M496 710V744M520 710V744M544 710V744" stroke="#120c20" stroke-width="4"/></g>` +
      `<g fill="${WIN}">${windows([[372, 648], [430, 648], [488, 648]], 32, 44)}${windows([[372, 748], [496, 748]], 36, 40)}</g>` +
      '<path d="M410 748H490V800H410Z" fill="#05030c"/><path d="M416 760H446V800H416ZM454 760H484V800H454Z" fill="#2a1a10"/><path d="M416 770H446M454 770H484" stroke="#ffb347" stroke-opacity=".6" stroke-width="3"/>' +
      '<g stroke="#05030c" stroke-width="2.4"><path d="M388 648V692M404 648V692M446 648V692M462 648V692M504 648V692M520 648V692M372 770H408M508 770H532"/></g>' +
      notes +
      // The hill, the gold mine's mouth, the ore cart and the windmill on its crest.
      '<g transform="translate(250 580)"><g fill="#1a1538"><path d="M-14 160L-36 96L-10 0L10 0L36 96L14 160Z" stroke="#1a1538" stroke-width="5"/>' +
      '<path d="M-20 130L20 70M20 130L-20 70M-12 40H12" stroke="#2a2448" stroke-width="2.4" fill="none"/></g>' +
      '<g class="ww-vane" transform="translate(0 0)"><path d="M0 0H64L88 -14V16L64 6Z" fill="#17112b" stroke="#6a68b0" stroke-opacity=".3" stroke-width="1"/></g>' +
      `<g class="ww-wm">${wheel(76)}</g></g>` +
      '<g class="ww-mine">' +
      '<path d="M-40 800V736C10 700 80 688 150 700C230 712 300 762 372 800Z" fill="#0d091b" stroke="#8886c8" stroke-opacity=".3" stroke-width="2"/>' +
      '<rect x="88" y="712" width="84" height="88" fill="#010006"/>' +
      '<g fill="#2a1d16" stroke="#43301f" stroke-width="2"><rect x="78" y="704" width="104" height="12"/><rect x="82" y="716" width="12" height="84"/><rect x="166" y="716" width="12" height="84"/><path d="M94 716L110 704M166 716L150 704" fill="none"/></g>' +
      `<g class="ww-ml"><circle cx="130" cy="728" r="26" fill="url(#ww-amber)"/><rect x="127" y="718" width="6" height="12" rx="2" fill="${WIN}"/></g>` +
      '<path d="M130 800L212 834M104 800L168 834" stroke="#4a468a" stroke-opacity=".5" stroke-width="2"/>' +
      '<g transform="translate(214 800)"><path d="M-26 0H26L20 28H-20Z" fill="#17112b" stroke="#6a68b0" stroke-opacity=".5" stroke-width="2"/><circle cx="-12" cy="30" r="6" fill="#0a0716"/><circle cx="12" cy="30" r="6" fill="#0a0716"/>' +
      '<path d="M-18 0Q-6 -14 6 -8Q16 -14 20 0Z" fill="#3a3448"/></g></g>' +
      // The dynamite: bloom, core, smoke and rocks, above the mine.
      '<circle class="ww-bloom" cx="130" cy="750" r="250" fill="url(#ww-blast)"/><circle class="ww-core" cx="130" cy="752" r="130" fill="url(#ww-blast)"/>' +
      rings +
      smoke +
      rocks +
      // Telegraph poles and their wires across the town and into the office.
      `<path d="${wires}" fill="none" stroke="#0b0814" stroke-width="2.2"/>` +
      `<path class="ww-pulse" d="${wires}" fill="none" stroke="#ffd890" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 96"/>` +
      polesX.map(pole).join('') +
      // A tumbleweed bounces along the road.
      '<g transform="translate(0 904)"><g class="ww-tx"><g class="ww-th"><g class="ww-tr">' +
      `${weeds}</g></g></g></g>` +
      // Foreground cacti.
      saguaro(70, 1010, 250, 1.1) +
      saguaro(560, 990, 150, 0.8) +
      saguaro(1100, 1000, 210, 1),
    nook:
      '<defs><radialGradient id="ww-lg"><stop offset="0" stop-color="#ffb347" stop-opacity=".42"/><stop offset=".5" stop-color="#ff9a3a" stop-opacity=".12"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient></defs>' +
      // The office wall: planks under a shingled eave, a post, a window and a wanted poster of invented marks.
      '<path d="M40 112H470V470H40Z M226 150V248H304V150Z" fill-rule="evenodd" fill="#150e0b"/>' +
      '<g stroke="#2a1b12" stroke-width="2"><path d="M70 112V456M100 112V456M130 112V456M160 112V456M190 112V456M320 112V456M350 112V456M380 112V456M410 112V456M440 112V456M215 248V456M247 248V456M279 248V456"/></g>' +
      `<g fill="none" stroke="${WOOD_EDGE}" stroke-width="5"><path d="M226 150V248H304V150Z"/><path d="M265 150V248M226 199H304"/></g><rect x="218" y="248" width="94" height="8" fill="#2a1d16"/>` +
      '<path d="M30 92H478V116H30Z" fill="#1d130e" stroke="#3a281a" stroke-width="2"/><path d="M34 118Q48 126 62 118T90 118T118 118T146 118T174 118T202 118T230 118T258 118T286 118T314 118T342 118T370 118T398 118T426 118T454 118T482 118" fill="none" stroke="#3a281a" stroke-width="3"/>' +
      '<rect x="28" y="100" width="20" height="360" fill="#241810" stroke="#3a281a" stroke-width="2"/>' +
      '<g transform="translate(72 132) rotate(-3)"><rect width="52" height="64" fill="#cdbf9c" fill-opacity=".8" stroke="#8a7a58" stroke-width="2"/><circle cx="26" cy="22" r="10" fill="none" stroke="#6a5a3a" stroke-width="2"/><path d="M10 42H42M12 50H40M16 58H36" stroke="#6a5a3a" stroke-width="2"/></g>' +
      // The kerosene lamp on the eave, with its warm glow.
      '<circle class="ww-lf" cx="344" cy="184" r="150" fill="url(#ww-lg)"/>' +
      '<g transform="translate(344 114)">' +
      lamp() +
      '</g>' +
      // The wire into the office, and the dots that race along it on the web.
      '<path id="ww-w" d="M44 112Q230 150 430 108V300L410 314" fill="none" stroke="#0b0814" stroke-width="2.4"/>' +
      '<path class="ww-pulse" d="M44 112Q230 150 430 108V300L410 314" fill="none" stroke="#ffd890" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 70"/>' +
      '<rect x="426" y="100" width="8" height="12" fill="#6a68b0" fill-opacity=".5"/>' +
      // The floor.
      '<rect x="0" y="452" width="470" height="30" fill="#140d09" stroke="#2a1b12" stroke-width="2"/>',
  }
}
