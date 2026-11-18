import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Toy Box: a child's playroom at night, lit by a nightlight and the moon through the window. Claude is a tiny wind-up
// toy in a paper party hat, coding on a toy laptop at a desk built from blocks, among giant toys: a block tower
// against the window, a train set on the floor, a tin robot behind the desk, a rocking horse in the dark.
// Run: the train loops its track and the robot marches. Error: the block tower topples. Done: the jack-in-the-box
// pops and two toy rockets fizz up from the windowsill.
const RED = '#d93a40'
const RED_D = '#8e2a31'
const RED_DD = '#5a1a20'
const GOLD = '#e8b04a'
const GOLD_D = '#9a7428'
const TEAL_D = '#1d4f54'
const CREAM = '#e9dcc0'
const TIN = '#353b48'
const TIN_L = '#5a6478'
const TIN_D = '#22262f'
const DARK = '#14121a'

// Where the room's lines run to: the eye level of a critter sitting on the floor.
const VPX = 800
const VPY = 800

type Glyph = 'star' | 'heart' | 'moon' | 'tri' | 'diamond'
type Tone = { face: string; side: string; rim: string }

const TONES: Record<'red' | 'teal' | 'must' | 'green', Tone> = {
  red: { face: '#7e262d', side: '#4e171c', rim: '#a3434a' },
  teal: { face: '#215f64', side: '#143c40', rim: '#35858c' },
  must: { face: '#8a6a28', side: '#57421a', rim: '#ad8a3c' },
  green: { face: '#365e33', side: '#223c20', rim: '#4f8249' },
}

/** An invented mark painted on a block: plain shapes, never a letter. */
function glyph(kind: Glyph, cx: number, cy: number, r: number): string {
  switch (kind) {
    case 'star':
      return (
        'M' +
        Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5
          const d = i % 2 ? r * 0.45 : r

          return `${f(cx + d * Math.cos(a))} ${f(cy + d * Math.sin(a))}`
        }).join('L') +
        'Z'
      )
    case 'heart':
      return (
        `M${f(cx)} ${f(cy + r * 0.85)}C${f(cx - r * 1.35)} ${f(cy - r * 0.05)} ${f(cx - r * 0.7)} ${f(cy - r * 1.1)} ${f(cx)} ${f(cy - r * 0.35)}` +
        `C${f(cx + r * 0.7)} ${f(cy - r * 1.1)} ${f(cx + r * 1.35)} ${f(cy - r * 0.05)} ${f(cx)} ${f(cy + r * 0.85)}Z`
      )
    case 'moon':
      return `M${f(cx + r * 0.25)} ${f(cy - r)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r * 0.25)} ${f(cy + r)}A${f(r * 0.72)} ${f(r)} 0 0 1 ${f(cx + r * 0.25)} ${f(cy - r)}Z`
    case 'tri':
      return `M${f(cx)} ${f(cy - r)}L${f(cx + r * 0.95)} ${f(cy + r * 0.7)}L${f(cx - r * 0.95)} ${f(cy + r * 0.7)}Z`
    case 'diamond':
      return `M${f(cx)} ${f(cy - r)}L${f(cx + r * 0.75)} ${f(cy)}L${f(cx)} ${f(cy + r)}L${f(cx - r * 0.75)} ${f(cy)}Z`
  }
}

/** A wooden block: its front face with a raised rim and a mark, and the side face running back toward the eye. */
function block(x: number, y: number, s: number, tone: Tone, mark: Glyph, k = 0.1): string {
  const r = x + s
  const b = y + s
  const tx = r + (VPX - r) * k
  const ty = y + (VPY - y) * k
  const by = b + (VPY - b) * k

  return (
    `<path d="M${f(r)} ${f(y)}L${f(tx)} ${f(ty)}V${f(by)}L${f(r)} ${f(b)}Z" fill="${tone.side}"/>` +
    `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.05)}" fill="${tone.face}"/>` +
    `<rect x="${f(x + s * 0.1)}" y="${f(y + s * 0.1)}" width="${f(s * 0.8)}" height="${f(s * 0.8)}" rx="${f(s * 0.04)}" fill="none" stroke="${tone.rim}" stroke-width="${f(s * 0.035)}"/>` +
    `<path d="M${f(x + s * 0.05)} ${f(y + 1.5)}H${f(r - s * 0.05)}" stroke="#d8e0ff" stroke-opacity=".18" stroke-width="3"/>` +
    `<path d="${glyph(mark, x + s / 2, y + s / 2, s * 0.24)}" fill="${CREAM}" fill-opacity=".42"/>`
  )
}

/** The block tower in front of the window; each block topples its own way on an error. */
function tower(): string {
  // Kept clear of the left edge, which narrow windows crop by up to ~150 units.
  const parts: [number, number, number, Tone, Glyph, number][] = [
    [80, 681, 224, TONES.red, 'star', 0],
    [92, 477, 204, TONES.teal, 'moon', -2.5],
    [82, 293, 184, TONES.must, 'tri', 2],
    [104, 129, 164, TONES.green, 'heart', -4],
  ]

  return (
    '<g transform="translate(192 905)"><g class="tb-tow"><g transform="translate(-192 -905)">' +
    parts
      .map(
        ([x, y, s, tone, mark, rot], i) =>
          `<g class="tb-f${i + 1}"><g transform="rotate(${rot} ${f(x + s / 2)} ${f(y + s / 2)})">${block(x, y, s, tone, mark)}</g></g>`,
      )
      .join('') +
    '</g></g></g>'
  )
}

/** The window: night sky, the moon, a cross frame, curtains and the sill the rockets stand on. */
function windowArt(next: () => number): string {
  const stars = Array.from({ length: 11 }, (_, i) => {
    const x = 98 + next() * 300
    const y = 64 + next() * 250

    return `<circle class="tb-tw" style="animation-delay:${f(-i * 0.8)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.6)}" fill="#e8ecff"/>`
  }).join('')
  const curtain = (x0: number, x1: number, side: number) => {
    const mid = (x0 + x1) / 2
    const tie = side < 0 ? x0 + 14 : x1 - 14
    const folds = [0.25, 0.5, 0.75].map(t => `M${f(x0 + (x1 - x0) * t)} 30Q${f(tie + (mid - tie) * 0.3)} 250 ${f(x0 + (x1 - x0) * t)} 380`).join('')

    return (
      `<g class="tb-cur"><path d="M${x0} 28H${x1}Q${f(tie + side * -6)} 210 ${f(tie)} 252Q${f(mid)} 300 ${f(x1 - side * 4)} 384H${f(x0 + side * 4)}Q${f(tie)} 300 ${f(tie)} 252Q${f(x0 + (x1 - x0) * 0.5)} 200 ${x0} 28Z" fill="#4a1a22"/>` +
      `<path d="${folds}" fill="none" stroke="#6a2a32" stroke-opacity=".7" stroke-width="3"/>` +
      `<path d="M${f(tie - 16)} 246H${f(tie + 16)}" stroke="${GOLD_D}" stroke-width="7" stroke-linecap="round"/></g>`
    )
  }

  return (
    '<rect x="90" y="58" width="320" height="266" fill="url(#tb-sky)"/>' +
    '<g clip-path="url(#tb-wc)"><circle cx="352" cy="112" r="120" fill="url(#tb-halo)"/></g>' +
    stars +
    `<path d="${glyph('moon', 352, 112, 32)}" fill="#f1ecd8"/>` +
    '<g fill="#24161a" stroke="#3a262a" stroke-width="2"><path d="M76 44H424V338H76ZM90 58V324H410V58Z" fill-rule="evenodd"/><rect x="243" y="58" width="14" height="266"/><rect x="90" y="184" width="320" height="14"/></g>' +
    '<rect x="54" y="336" width="392" height="18" rx="3" fill="#2a1a18"/><path d="M56 337H444" stroke="#5a4038" stroke-width="2"/>' +
    '<rect x="26" y="20" width="450" height="9" rx="4" fill="#2a1a18"/><circle cx="26" cy="24" r="9" fill="#3a2620"/><circle cx="476" cy="24" r="9" fill="#3a2620"/>' +
    curtain(34, 112, -1) +
    curtain(390, 468, 1)
  )
}

/** A toy rocket standing on the sill, its flame and fizz hidden until it launches. */
function rocket(x: number, delay: number, rx: number, ry: number, rr: number): string {
  const sparks = [-1, 1, -0.5, 0.5]
    .map((k, i) => `<circle class="tb-fz" style="--dx:${f(k * 26)}px;animation-delay:${f(delay + i * 0.09)}s" cx="0" cy="-4" r="2.4" fill="#ffd36a"/>`)
    .join('')

  return (
    `<g transform="translate(${x} 336) scale(1.35)"><g class="tb-rk" style="--rx:${rx}px;--ry:${ry}px;--rr:${rr}deg;animation-delay:${delay}s">` +
    `<path class="tb-trl" style="animation-delay:${delay}s" d="M-6 -8L0 110L6 -8Z" fill="url(#tb-trail)"/>` +
    `<path class="tb-flm" style="animation-delay:${delay}s" d="M-7 -8Q0 30 7 -8Z" fill="url(#tb-flame)"/>` +
    sparks +
    `<path d="M-11 -14V-48Q-11 -66 0 -78Q11 -66 11 -48V-14Z" fill="#b8a888"/>` +
    `<path d="M-9.6 -56Q-7 -68 0 -78Q7 -68 9.6 -56Z" fill="${RED_D}"/>` +
    `<circle cx="0" cy="-38" r="5.5" fill="#1d4f54" stroke="${CREAM}" stroke-opacity=".7" stroke-width="2"/>` +
    `<path d="M-11 -30L-21 -6L-11 -12ZM11 -30L21 -6L11 -12Z" fill="${RED_D}"/>` +
    '<rect x="-6" y="-15" width="12" height="7" fill="#2a2228"/></g></g>'
  )
}

/** Where a rocket fizzes out into a ring of small soft sparkles. */
function burst(x: number, y: number, delay: number, seed: number): string {
  const next = random(seed)
  const colors = ['#ffd36a', '#fff0d0', '#ff7a6a', '#6fe0d4']

  return (
    `<g transform="translate(${x} ${y})"><circle class="tb-bg" style="animation-delay:${delay}s" r="80" fill="url(#tb-bglow)"/>` +
    Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 + next() * 0.3
      const d = 70 + next() * 34

      return (
        `<g class="tb-sp" style="--dx:${f(Math.cos(a) * d)}px;--dy:${f(Math.sin(a) * d + 18)}px;animation-delay:${f(delay + next() * 0.12)}s">` +
        `<path d="M0 -11L2.6 -2.6L11 0L2.6 2.6L0 11L-2.6 2.6L-11 0L-2.6 -2.6Z" fill="${colors[i % 4]}"/></g>`
      )
    }).join('') +
    '</g>'
  )
}

/** The jack-in-the-box on the floor beside the tower: shut, until done springs it open. */
function jackBox(next: () => number): string {
  const spring = [`0 0`, ...Array.from({ length: 10 }, (_, i) => `${i % 2 ? 15 : -15} ${-(i + 1) * 14.5}`), '0 -160'].join(' ')
  const confetti = Array.from({ length: 20 }, (_, i) => {
    const colors = [RED, GOLD, '#4fb8b0', CREAM]

    return (
      `<rect class="tb-cf" style="--dx:${f((next() - 0.5) * 420)}px;--dy:${f(-240 - next() * 200)}px;animation-delay:${f(0.35 + next() * 0.25)}s" ` +
      `x="${f(360 + (next() - 0.5) * 30)}" y="760" width="${f(11 + next() * 7)}" height="${f(6 + next() * 4)}" fill="${colors[i % 4]}" fill-opacity=".85"/>`
    )
  }).join('')

  return (
    // The jack, hidden in the box until it pops: a spring, a ruff, a round face and a two-pointed cap with bells.
    '<g class="tb-jack" clip-path="url(#tb-jc)"><g transform="translate(365 772)"><g class="tb-jw"><g transform="scale(1.3)">' +
    `<g class="tb-js"><polyline points="${spring}" fill="none" stroke="#a2a8b4" stroke-width="5" stroke-linejoin="round"/></g>` +
    '<g class="tb-jh">' +
    `<path d="M-30 -160L-22 -172L-12 -162L0 -174L12 -162L22 -172L30 -160L22 -150L12 -158L0 -148L-12 -158L-22 -150Z" fill="${CREAM}" fill-opacity=".9"/>` +
    '<circle cy="-196" r="32" fill="#e2cca8"/>' +
    '<g fill="#d9666a" fill-opacity=".6"><circle cx="-17" cy="-186" r="6"/><circle cx="17" cy="-186" r="6"/></g>' +
    `<g fill="${DARK}"><circle cx="-11" cy="-202" r="4"/><circle cx="11" cy="-202" r="4"/></g>` +
    `<path d="M-14 -186Q0 -172 14 -186" fill="none" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M-30 -214Q-40 -250 -66 -246Q-46 -238 -40 -206ZM0 -228Q-20 -236 -30 -214L-40 -206Q-20 -222 0 -222Z" fill="${RED_D}"/>` +
    '<path d="M30 -214Q40 -250 66 -246Q46 -238 40 -206ZM0 -228Q20 -236 30 -214L40 -206Q20 -222 0 -222Z" fill="#2a7076"/>' +
    `<path d="M-32 -212Q0 -236 32 -212L28 -204Q0 -222 -28 -204Z" fill="${GOLD_D}"/>` +
    `<g fill="${GOLD}"><circle cx="-66" cy="-246" r="7"/><circle cx="66" cy="-246" r="7"/></g>` +
    '</g></g></g></g></g>' +
    confetti +
    // The box: a harlequin front, a teal side with the crank, the lid on its hinge.
    '<g class="tb-box">' +
    `<path d="M430 775L474 778V892L430 905Z" fill="${TEAL_D}"/>` +
    '<rect x="300" y="775" width="130" height="130" rx="5" fill="#7e262d"/>' +
    `<rect x="310" y="785" width="110" height="110" rx="4" fill="none" stroke="${GOLD_D}" stroke-width="4"/>` +
    `<path d="M365 795L403 840L365 885L327 840Z" fill="${CREAM}" fill-opacity=".42"/>` +
    `<path d="M327 840L310 820V860ZM403 840L420 820V860Z" fill="${CREAM}" fill-opacity=".22"/>` +
    `<path d="${glyph('star', 365, 840, 13)}" fill="${RED_D}"/>` +
    `<circle cx="452" cy="836" r="7" fill="${GOLD_D}"/>` +
    `<g transform="translate(452 836)"><g class="tb-crk"><path d="M0 0V-30H16" fill="none" stroke="${GOLD_D}" stroke-width="5" stroke-linecap="round"/><circle cx="16" cy="-30" r="6" fill="${RED_D}"/></g></g>` +
    '<g transform="translate(296 770)"><g class="tb-lid">' +
    `<rect x="-2" y="-6" width="142" height="13" rx="3" fill="${RED_DD}"/><path d="M140 -6L182 -2V9L140 7Z" fill="#123236"/>` +
    `<path d="M2 -5H136" stroke="${GOLD_D}" stroke-width="2"/></g></g>` +
    '</g>'
  )
}

/** One car of the train, wheels on the rail at (0, 0), facing right. */
function car(kind: 'engine' | 'ball' | 'blocks'): string {
  const wheel = (x: number, r: number) =>
    `<circle cx="${x}" cy="${-r + 2}" r="${r}" fill="${DARK}" stroke="${GOLD_D}" stroke-width="2.5"/><circle cx="${x}" cy="${-r + 2}" r="3" fill="${GOLD_D}"/>`

  if (kind === 'engine') {
    const puffs = [0, 1, 2]
      .map(
        i =>
          `<g class="tb-pf" style="animation-delay:${f(-i * 0.3)}s" fill="#d8d0e0"><circle cx="22" cy="-108" r="13"/><circle cx="11" cy="-101" r="9"/><circle cx="33" cy="-102" r="10"/></g>`,
      )
      .join('')

    return (
      puffs +
      '<rect x="-62" y="-30" width="128" height="14" rx="3" fill="#24181a"/>' +
      `<rect x="-12" y="-66" width="66" height="38" rx="17" fill="${RED_D}"/><path d="M-6 -62H48" stroke="#b8484e" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M14 -64L10 -94H34L30 -64Z" fill="#2a2228"/><rect x="7" y="-102" width="30" height="9" rx="3" fill="${GOLD_D}"/>` +
      `<circle cx="42" cy="-67" r="7" fill="${GOLD_D}"/>` +
      `<rect x="-60" y="-92" width="52" height="64" rx="4" fill="#8a6a28"/><rect x="-66" y="-100" width="64" height="11" rx="4" fill="${RED_D}"/>` +
      `<rect x="-50" y="-82" width="30" height="22" rx="3" fill="${DARK}"/><rect class="tb-cab" x="-47" y="-79" width="24" height="16" rx="2" fill="#ffd38a" fill-opacity=".5"/>` +
      `<path d="M54 -30L72 -12H54Z" fill="${GOLD_D}"/>` +
      '<path class="tb-hl" d="M60 -48L190 -82V-12Z" fill="url(#tb-hb)"/><circle class="tb-hl" cx="60" cy="-48" r="28" fill="url(#tb-lamp)"/><circle cx="56" cy="-48" r="7" fill="#fff0c8" fill-opacity=".8"/>' +
      wheel(-38, 15) +
      wheel(4, 12) +
      wheel(36, 12)
    )
  }

  if (kind === 'ball') {
    return (
      '<rect x="-62" y="-26" width="14" height="5" fill="#24181a"/>' +
      `<circle cx="0" cy="-72" r="25" fill="#b8a888"/><path d="M-25 -72A25 25 0 0 0 25 -72Q0 -60 -25 -72Z" fill="${RED_D}"/><path d="M-18 -88Q0 -98 18 -88" fill="none" stroke="#2a7076" stroke-width="5"/>` +
      '<rect x="-50" y="-58" width="100" height="40" rx="4" fill="#215f64"/><rect x="-54" y="-62" width="108" height="8" rx="3" fill="#35858c"/>' +
      `<path d="${glyph('diamond', 0, -38, 10)}" fill="${CREAM}" fill-opacity=".4"/>` +
      wheel(-30, 12) +
      wheel(30, 12)
    )
  }

  return (
    '<rect x="-62" y="-26" width="14" height="5" fill="#24181a"/>' +
    `<g transform="rotate(-6 -18 -70)">${block(-36, -88, 34, TONES.must, 'star', 0)}</g>${block(4, -84, 30, TONES.red, 'heart', 0)}` +
    '<rect x="-50" y="-54" width="100" height="36" rx="4" fill="#365e33"/><rect x="-54" y="-58" width="108" height="8" rx="3" fill="#4f8249"/>' +
    wheel(-30, 12) +
    wheel(30, 12)
  )
}

// The train set: an oval of wooden track on the floor in front of the tower. Each car rides the oval on two eased
// back-and-forth moves a quarter loop apart (an ellipse), smaller on the far side, turning round at the ends.
const OX = 250
const OY = 952
const ORX = 240
const ORY = 36
const HALF = 2.8

function train(): string {
  const cars: ['engine' | 'ball' | 'blocks', number][] = [
    ['blocks', 1.32],
    ['ball', 0.66],
    ['engine', 0],
  ]
  // Parked on the front straight (cars at x 28, 148, 336), below the jack-in-the-box's lid.
  const start = HALF / 2 + 0.3

  return (
    `<ellipse cx="${OX}" cy="${OY}" rx="${ORX + 6}" ry="${ORY + 6}" fill="none" stroke="#3a2618" stroke-width="22"/>` +
    `<ellipse cx="${OX}" cy="${OY}" rx="${ORX + 6}" ry="${ORY + 6}" fill="none" stroke="#5a3e26" stroke-width="16"/>` +
    `<g fill="none" stroke="#241610" stroke-width="2.2"><ellipse cx="${OX}" cy="${OY}" rx="${ORX + 1}" ry="${ORY + 2}"/><ellipse cx="${OX}" cy="${OY}" rx="${ORX + 11}" ry="${ORY + 10}"/></g>` +
    cars
      .map(([kind, lag]) => {
        const p = start - lag

        return (
          `<g transform="translate(${OX} ${OY})"><g class="tb-tx" style="animation-delay:${f(-p)}s"><g class="tb-ty" style="animation-delay:${f(-p - HALF / 2)}s">` +
          `<g class="tb-tf" style="animation-delay:${f(-p)}s"><g transform="scale(1.5)">${car(kind)}</g></g></g></g></g>`
        )
      })
      .join('')
  )
}

/** The rocking horse at the back of the room, a dim shape in the moonlight, rocking on its own. */
function horse(): string {
  const wood = '#2a1b17'
  const rim = '#4e3428'

  return (
    '<g transform="translate(820 800)"><g class="tb-rock">' +
    `<path d="M-205 -58Q20 18 245 -58" fill="none" stroke="#1e1311" stroke-width="13" stroke-linecap="round"/>` +
    `<g stroke="${wood}" stroke-width="20" stroke-linecap="round"><path d="M-96 -196L-160 -44M-70 -196L-112 -28M104 -196L150 -32M128 -196L196 -46"/></g>` +
    `<path d="M-226 -46Q0 34 226 -46" fill="none" stroke="${wood}" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M-226 -50Q0 28 226 -50" fill="none" stroke="${rim}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M-130 -232C-162 -226 -186 -196 -196 -150C-178 -176 -160 -190 -136 -196" fill="#22161a" stroke="${rim}" stroke-width="2"/>` +
    `<path d="M-140 -212C-140 -262 -60 -268 0 -262C40 -258 70 -262 84 -282L104 -334C112 -356 134 -372 158 -364L224 -306C236 -294 230 -280 214 -282L182 -290C166 -292 150 -300 140 -290L132 -240C130 -196 90 -168 0 -166C-90 -164 -140 -176 -140 -212Z" fill="${wood}" stroke="${rim}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M134 -362L132 -392L152 -366Z" fill="${wood}" stroke="${rim}" stroke-width="2"/>` +
    '<path d="M100 -340C86 -320 92 -300 74 -284C64 -270 70 -258 56 -246" fill="none" stroke="#3e2820" stroke-width="12" stroke-linecap="round"/>' +
    `<path d="M-46 -262Q0 -280 46 -262L40 -226Q0 -216 -40 -226Z" fill="${RED_DD}"/><path d="M-4 -222V-170" stroke="#3a2a22" stroke-width="3"/><rect x="-12" y="-172" width="16" height="8" rx="2" fill="#3a2a22"/>` +
    `<rect x="124" y="-332" width="42" height="8" rx="3" fill="${CREAM}" fill-opacity=".22"/>` +
    `<circle cx="184" cy="-320" r="4" fill="${DARK}"/>` +
    '<g fill="#4a3228" fill-opacity=".5"><circle cx="-90" cy="-210" r="9"/><circle cx="-60" cy="-190" r="7"/><circle cx="70" cy="-196" r="8"/><circle cx="96" cy="-224" r="6"/></g>' +
    '</g></g>'
  )
}

/** The tin robot standing behind the desk, in the desk's own box: wound by the key on its back. */
function robot(): string {
  const leg = (x: number, second: boolean) =>
    `<g class="tb-leg${second ? ' tb-leg2' : ''}"><rect x="${x}" y="112" width="36" height="84" rx="4" fill="${TIN_D}" stroke="${TIN}" stroke-width="2"/>` +
    `<path d="M${x} 134H${x + 36}M${x} 154H${x + 36}M${x} 174H${x + 36}" stroke="#14161c" stroke-width="3"/>` +
    `<rect x="${x - 12}" y="188" width="60" height="28" rx="10" fill="${TIN}" stroke="${TIN_L}" stroke-width="2"/></g>`
  const arm =
    `<g fill="${TIN_D}" stroke="${TIN_L}" stroke-width="2">${[0, 1, 2, 3].map(i => `<rect x="-13" y="${4 + i * 19}" width="26" height="17" rx="7"/>`).join('')}</g>` +
    `<path d="M8 86A15 15 0 1 0 8 112" fill="none" stroke="${TIN_L}" stroke-width="8" stroke-linecap="round"/>`
  const dial = (x: number) =>
    `<circle cx="${x}" cy="-28" r="16" fill="${CREAM}" fill-opacity=".14" stroke="#8a94a8" stroke-width="2"/>` +
    `<g transform="translate(${x} -28)"><g class="tb-dial"><path d="M0 2V-12" stroke="${RED}" stroke-width="3" stroke-linecap="round"/></g></g>`
  const eyes = (cls: string, color: string) =>
    `<g class="${cls}"><circle cx="266" cy="-164" r="10" fill="${color}"/><circle cx="324" cy="-164" r="10" fill="${color}"/></g>`

  return (
    '<g class="tb-rob">' +
    // The key in its back, turning.
    '<g transform="translate(206 70)"><g class="tb-rkey"><rect x="-30" y="-4" width="30" height="8" fill="#7a5a22"/>' +
    `<path d="M-30 0C-42 -26 -62 -22 -58 0C-62 22 -42 26 -30 0Z" fill="${GOLD_D}" stroke="#5a3e14" stroke-width="2"/></g></g>` +
    leg(250, false) +
    leg(304, true) +
    '<g class="tb-tor">' +
    `<g transform="translate(204 -62)"><g class="tb-arm">${arm}</g></g>` +
    `<g transform="translate(386 -62) scale(-1 1)"><g class="tb-arm tb-arm2">${arm}</g></g>` +
    `<rect x="204" y="-92" width="182" height="214" rx="14" fill="${TIN}" stroke="${TIN_L}" stroke-width="3"/>` +
    '<rect x="213" y="-82" width="9" height="194" rx="4.5" fill="#8a94a8" fill-opacity=".16"/>' +
    '<rect x="232" y="-62" width="126" height="98" rx="10" fill="#1b1e26" stroke="#5a6478" stroke-width="2"/>' +
    dial(264) +
    dial(326) +
    `<circle class="tb-chl" cx="268" cy="14" r="6.5" fill="${RED}"/><circle class="tb-chl" style="animation-delay:-.8s" cx="295" cy="14" r="6.5" fill="${GOLD}"/>` +
    '<circle class="tb-chl" style="animation-delay:-.4s" cx="322" cy="14" r="6.5" fill="#6fe0d4"/>' +
    `<rect x="204" y="62" width="182" height="16" fill="${RED_D}"/>` +
    `<g fill="#8a94a8" fill-opacity=".5">${[218, 248, 278, 312, 342, 372].map(x => `<circle cx="${x}" cy="70" r="3"/>`).join('')}</g>` +
    `<rect x="274" y="-108" width="42" height="18" fill="${TIN_D}"/>` +
    '<g transform="translate(295 -100)"><g class="tb-head"><g transform="translate(-295 100)">' +
    `<rect x="216" y="-176" width="16" height="36" rx="5" fill="${TIN_D}"/><rect x="358" y="-176" width="16" height="36" rx="5" fill="${TIN_D}"/>` +
    `<rect x="228" y="-206" width="134" height="100" rx="14" fill="${TIN}" stroke="${TIN_L}" stroke-width="3"/>` +
    '<circle cx="295" cy="-164" r="58" fill="url(#tb-eyeg)"/>' +
    '<g fill="#101218" stroke="#6a7488" stroke-width="3"><circle cx="266" cy="-164" r="17"/><circle cx="324" cy="-164" r="17"/></g>' +
    '<g class="tb-pup">' +
    eyes('tb-eye', '#ffbf5a') +
    eyes('tb-eyer', '#ff5a4d') +
    '</g>' +
    '<rect x="256" y="-136" width="78" height="18" rx="5" fill="#101218" stroke="#6a7488" stroke-width="2"/>' +
    '<path d="M272 -136V-118M288 -136V-118M304 -136V-118M320 -136V-118" stroke="#6a7488" stroke-width="2"/>' +
    `<rect x="283" y="-214" width="24" height="10" rx="3" fill="${TIN_D}"/><path d="M295 -206V-244" stroke="#6a7488" stroke-width="5"/>` +
    `<circle class="tb-ab" cx="295" cy="-252" r="9" fill="${RED}"/>` +
    '<g transform="translate(295 -252)">' +
    [0, 0.5, 1]
      .map(d => `<circle class="tb-sig" style="animation-delay:${d}s" r="18" fill="none" stroke="#6fe0d4" stroke-width="2.5"/>`)
      .join('') +
    '</g></g></g></g>' +
    '</g></g>'
  )
}

/** The toy laptop: a chunky red base with candy buttons and a mustard lid around the screen. */
function device(light: string, activity: Activity): string {
  const colors = ['#c9952f', '#2f8a8c', '#4d8a4a', '#d9c9a8', '#c9952f', '#2f8a8c']
  const busy = activity === 'tool' || activity === 'run' || activity === 'responding' || activity === 'web'

  return (
    '<rect x="240" y="313" width="106" height="17" rx="8" fill="#8e2a31"/>' +
    '<rect x="246" y="313" width="94" height="5" rx="2.5" fill="#c4474d" fill-opacity=".5"/>' +
    colors.map((c, i) => `<circle cx="${256 + i * 13}" cy="322" r="4.4" fill="${c}"/>`).join('') +
    `<circle cx="248" cy="324" r="2.4" fill="${light}" fill-opacity="${busy ? 1 : 0.4}"/>` +
    '<path d="M333 328L352 232L372 236L353 330Z" fill="#9a7228"/>' +
    `<path d="M338 322L355 242L363 244L346 324Z" fill="${light}"/>` +
    `<path d="M338 322L355 242L344 246L326 322Z" fill="${light}" fill-opacity=".18"/>` +
    `<path d="${glyph('star', 363, 280, 6)}" fill="${CREAM}" fill-opacity=".7"/>`
  )
}

export function toyBoxWorld(): World {
  const next = random(54)
  const motes = Array.from({ length: 8 }, (_, i) => {
    const t = next()

    return `<circle class="tb-mote" style="animation-delay:${f(-i * 1.4)}s" cx="${f(300 + t * 420 + next() * 80)}" cy="${f(220 + t * 520)}" r="${f(1.3 + next() * 1.4)}" fill="#dfe6ff"/>`
  }).join('')
  const planks =
    Array.from({ length: 15 }, (_, i) => {
      const x1 = -420 + i * 175
      const x0 = VPX + (x1 - VPX) * 0.47

      return `M${f(x0)} 764L${f(x1)} 1000`
    }).join('') + 'M0 820H1600M0 900H1600'
  const pennants = Array.from({ length: 15 }, (_, i) => {
    const t = (i + 0.5) / 15
    const x = (1 - t) * (1 - t) * 470 + 2 * (1 - t) * t * 1040 + t * t * 1610
    const y = (1 - t) * (1 - t) * 26 + 2 * (1 - t) * t * 150 + t * t * 18
    const colors = ['#5e1c22', '#5c461a', '#143c40', '#4a4434']

    return `<path class="tb-pen" style="animation-delay:${f(-i * 0.5)}s" d="M${f(x - 17)} ${f(y)}H${f(x + 17)}L${f(x)} ${f(y + 40)}Z" fill="${colors[i % 4]}"/>`
  }).join('')
  const dust = (x: number, y: number, delay: number) =>
    `<g class="tb-dust" style="animation-delay:${delay}s"><ellipse cx="${x - 40}" cy="${y}" rx="34" ry="12" fill="#b8aab0"/><ellipse cx="${x + 36}" cy="${y - 4}" rx="28" ry="10" fill="#b8aab0"/></g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#07040a',
      furniture: '#3a2418',
      metal: RED_D,
      paper: '#efe2c8',
      light: { idle: '#3a8a84', work: '#6fe0d4', bright: '#d2fff8' },
      headTop: 240,
      glowAt: [354, 282],
      device,
      wear: {
        // A wind-up key in Claude's back.
        behind:
          '<g transform="translate(50 284)"><g class="tb-ck"><rect x="0" y="-4" width="22" height="8" fill="#7a5a22"/>' +
          `<path d="M2 0C-6 -20 -24 -18 -22 0C-24 18 -6 20 2 0Z" fill="${GOLD}" stroke="#7a5a22" stroke-width="2"/></g></g>`,
        // A paper party hat with stripes and a pom-pom; its band sits on the head, clear of the eyes.
        // Its pom-pom tops out at y 165, so the done hop (-18) stays inside the band's crop (y 150).
        front:
          `<path d="M94 242Q150 250 206 242L160 174Z" fill="${CREAM}"/>` +
          `<path d="M94 242Q150 250 206 242L196.8 228.4Q150 234.4 107.2 228.4ZM120.4 214.8Q150 218.8 187.6 214.8L179.5 202.9Q150 205.9 132 202.9ZM148.5 185.9Q158 187.9 168 185.9L160 174Z" fill="${RED}"/>` +
          `<g fill="#2f8a8c"><circle cx="132" cy="221.6" r="3.5"/><circle cx="172" cy="220.6" r="3.5"/><circle cx="155" cy="194.4" r="3"/></g>` +
          `<path d="M90 238L100 248L110 240L120 249L130 241L140 250L150 242L160 250L170 241L180 249L190 240L200 248L210 238" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/>` +
          `<g fill="${GOLD}"><circle cx="160" cy="173" r="7.5"/><circle cx="154.5" cy="170.5" r="4"/><circle cx="165.5" cy="170" r="4"/><circle cx="160" cy="168" r="3"/></g>`,
      },
      // A toy drum for a stool.
      seatArt:
        `<rect x="108" y="352" width="86" height="98" fill="${RED_D}"/>` +
        '<rect x="108" y="352" width="22" height="98" fill="#000000" fill-opacity=".22"/>' +
        `<polyline points="${Array.from({ length: 7 }, (_, i) => `${f(110 + i * 13.7)} ${i % 2 ? 440 : 362}`).join(' ')}" fill="none" stroke="${CREAM}" stroke-opacity=".75" stroke-width="3" stroke-linejoin="round"/>` +
        // Lacing knots at each turn, so the zigzag reads as a drum's cord.
        `<g fill="${CREAM}">${Array.from({ length: 7 }, (_, i) => `<circle cx="${f(110 + i * 13.7)}" cy="${i % 2 ? 437 : 365}" r="4"/>`).join('')}</g>` +
        `<rect x="104" y="350" width="94" height="11" rx="3" fill="${GOLD_D}"/><rect x="104" y="443" width="94" height="13" rx="3" fill="${GOLD_D}"/>` +
        '<ellipse cx="151" cy="350" rx="47" ry="6" fill="#d9c9a8" fill-opacity=".85"/>',
      // A desk built from blocks: a long plank across a cube and a cylinder.
      tableArt:
        block(228, 358, 98, TONES.red, 'star', 0) +
        '<rect x="414" y="358" width="48" height="94" fill="#215f64"/><rect x="414" y="358" width="12" height="94" fill="#000000" fill-opacity=".2"/>' +
        '<ellipse cx="438" cy="452" rx="24" ry="5" fill="#215f64"/>' +
        '<path d="M166 330L178 321H476L470 330Z" fill="#b08a44"/>' +
        '<rect x="166" y="330" width="304" height="28" rx="4" fill="#8a6a28"/>' +
        '<rect x="174" y="335" width="288" height="18" rx="3" fill="none" stroke="#ad8a3c" stroke-width="2.5"/>' +
        `<g fill="${CREAM}" fill-opacity=".35"><path d="${glyph('diamond', 216, 344, 6)}"/><path d="${glyph('heart', 420, 344, 6)}"/></g>`,
    },
    style:
      // Ambient: stars twinkle, the curtains and bunting stir, the nightlight breathes, the horse rocks on its own.
      '.tb-tw{animation:tb-tw 3.4s ease-in-out infinite alternate}@keyframes tb-tw{from{opacity:.25}to{opacity:.9}}' +
      '.tb-nl{animation:tb-nl 5s ease-in-out infinite alternate}@keyframes tb-nl{from{opacity:.72}to{opacity:1}}' +
      '.tb-cur{transform-box:fill-box;transform-origin:50% 0;animation:tb-cur 7s ease-in-out infinite alternate}@keyframes tb-cur{from{transform:skewX(-1.2deg)}to{transform:skewX(1.2deg)}}' +
      '.tb-pen{transform-box:fill-box;transform-origin:50% 0;animation:tb-pen 4s ease-in-out infinite alternate}@keyframes tb-pen{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.tb-mote{opacity:.3;animation:tb-mote 11s ease-in-out infinite alternate}@keyframes tb-mote{from{transform:translate(0,0)}to{transform:translate(30px,-50px)}}' +
      '.tb-rock{animation:tb-rock 5.2s ease-in-out infinite alternate}@keyframes tb-rock{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}' +
      '.st-run .tb-rock{animation:tb-rock2 1.3s ease-in-out infinite alternate}@keyframes tb-rock2{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      // The robot: eyes blink, the antenna glows, the key in its back and in Claude's turn.
      '.tb-eye{animation:tb-blink 5.5s steps(1) infinite}@keyframes tb-blink{0%,93%{opacity:1}94%,97%{opacity:.15}}' +
      '.tb-eyer{opacity:0}' +
      '.tb-ab{animation:tb-ab 3s ease-in-out infinite alternate}@keyframes tb-ab{from{opacity:.45}to{opacity:1}}' +
      '.tb-ck,.tb-rkey{transform-box:fill-box;transform-origin:center;animation:tb-ck 3.2s linear infinite}@keyframes tb-ck{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.12)}}' +
      '.tb-rkey{animation-duration:4.4s}' +
      '.st-responding .tb-ck{animation-duration:1.4s}' +
      '.st-tool .tb-ck,.st-run .tb-ck,.st-web .tb-ck,.st-run .tb-rkey,.st-tool .tb-rkey{animation-duration:.5s}' +
      '.tb-chl{opacity:.3}' +
      '.st-responding .tb-chl,.st-tool .tb-chl,.st-run .tb-chl{animation:tb-chl 1.2s steps(1) infinite}@keyframes tb-chl{0%,32%{opacity:1}33%,100%{opacity:.3}}' +
      '.st-tool .tb-dial,.st-run .tb-dial{animation:mv-spin 1.4s linear infinite}' +
      '.st-tool .tb-top,.st-read .tb-top,.st-web .tb-top,.st-run .tb-top{animation:tb-wobt 1.1s ease-in-out infinite alternate}@keyframes tb-wobt{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.st-tool .tb-sps,.st-read .tb-sps,.st-web .tb-sps,.st-run .tb-sps{animation:tb-sps .32s linear infinite}@keyframes tb-sps{to{transform:translateX(34px)}}' +
      // Thinking: the robot tilts its head. Read: it looks down. Web: its antenna sends rings.
      '.st-thinking .tb-head{animation:tb-tilt 2.6s ease-in-out infinite alternate}@keyframes tb-tilt{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
      '.st-thinking .tb-ab{animation-duration:.9s}' +
      '.st-read .tb-pup{transform:translateY(5px)}' +
      '.tb-sig{opacity:0}.st-web .tb-sig{animation:tb-sig 1.6s ease-out infinite}@keyframes tb-sig{0%{opacity:0;transform:scale(.4)}30%{opacity:.8}100%{opacity:0;transform:scale(2.4)}}' +
      // Run: the train loops its oval, puffing, and the robot marches.
      `.tb-tx{animation:tb-tx ${HALF}s ease-in-out infinite alternate paused}@keyframes tb-tx{from{transform:translateX(-${ORX}px)}to{transform:translateX(${ORX}px)}}` +
      `.tb-ty{animation:tb-ty ${HALF}s ease-in-out infinite alternate paused}@keyframes tb-ty{from{transform:translateY(-${ORY}px) scale(.8)}to{transform:translateY(${ORY}px) scale(1)}}` +
      `.tb-tf{animation:tb-tf ${HALF * 2}s steps(1) infinite paused}@keyframes tb-tf{50%{transform:scaleX(-1)}}` +
      '.st-run .tb-tx,.st-run .tb-ty,.st-run .tb-tf{animation-play-state:running}' +
      '.tb-pf,.tb-hl{opacity:0}' +
      '.st-run .tb-pf{transform-box:fill-box;transform-origin:center;animation:tb-pf .9s ease-out infinite}@keyframes tb-pf{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.55}100%{opacity:0;transform:translate(-60px,-110px) scale(2.8)}}' +
      '.st-run .tb-hl{opacity:.9}' +
      '.st-run .tb-leg{animation:tb-step .7s ease-in-out infinite}@keyframes tb-step{0%,50%,100%{transform:translateY(0)}25%{transform:translateY(-34px)}}' +
      '.st-run .tb-leg2{animation-delay:-.35s}' +
      '.st-run .tb-tor{animation:tb-bob .35s ease-in-out infinite alternate}@keyframes tb-bob{to{transform:translateY(-10px)}}' +
      '.st-run .tb-arm{animation:tb-swing .7s ease-in-out infinite alternate}@keyframes tb-swing{from{transform:rotate(-22deg)}to{transform:rotate(26deg) scaleY(.8)}}' +
      '.st-run .tb-arm2{animation-delay:-.7s}' +
      '.st-run .tb-rob{animation:tb-stomp 1.4s ease-in-out infinite alternate}@keyframes tb-stomp{from{transform:translateX(-20px) rotate(-2deg)}to{transform:translateX(20px) rotate(2deg)}}' +
      '.st-run .tb-eye{animation:none;opacity:1}' +
      // Error: the tower wobbles and comes down to the right: the heart block onto the rug, the triangle onto the
      // jack-in-the-box, the moon block over the box's corner onto the floor beside it. The robot's eyes go red.
      '.st-error .tb-tow{animation:tb-wob .6s ease-in-out both}@keyframes tb-wob{30%{transform:rotate(2deg)}65%{transform:rotate(-1.5deg)}}' +
      '.tb-f1,.tb-f2,.tb-f3,.tb-f4{transform-box:fill-box;transform-origin:center}' +
      '.st-error .tb-f4{animation:tb-f4 1.5s linear .25s both}' +
      '@keyframes tb-f4{14%{transform:translate(18px,-6px) rotate(12deg);animation-timing-function:cubic-bezier(.5,0,1,.6)}' +
      '70%{transform:translate(606px,612px) rotate(340deg);animation-timing-function:ease-out}80%{transform:translate(612px,590px) rotate(354deg);animation-timing-function:ease-in}' +
      '90%,100%{transform:translate(616px,612px) rotate(360deg)}}' +
      '.st-error .tb-f3{animation:tb-f3 1.3s linear .42s both}' +
      '@keyframes tb-f3{15%{transform:translate(14px,-5px) rotate(9deg);animation-timing-function:cubic-bezier(.5,0,1,.6)}' +
      '70%{transform:translate(188px,287px) rotate(345deg);animation-timing-function:ease-out}82%{transform:translate(190px,270px) rotate(356deg);animation-timing-function:ease-in}' +
      '92%,100%{transform:translate(191px,287px) rotate(360deg)}}' +
      '.st-error .tb-f2{animation:tb-f2 1.1s linear .6s both}' +
      '@keyframes tb-f2{22%{transform:translate(8px,-2px) rotate(14deg);animation-timing-function:ease-in}' +
      '48%{transform:translate(290px,30px) rotate(65deg);animation-timing-function:cubic-bezier(.5,0,1,.6)}' +
      '72%{transform:translate(392px,249px) rotate(90deg);animation-timing-function:ease-out}84%{transform:translate(392px,236px) rotate(86deg);animation-timing-function:ease-in}' +
      '94%,100%{transform:translate(392px,249px) rotate(90deg)}}' +
      '.st-error .tb-f1{animation:tb-f1 .5s ease-in-out .9s both}@keyframes tb-f1{40%{transform:translate(-6px,0) rotate(-2deg)}}' +
      '.tb-dust{opacity:0}.st-error .tb-dust{transform-box:fill-box;transform-origin:center;animation:tb-dust .9s ease-out both}' +
      '@keyframes tb-dust{0%{opacity:0;transform:scale(.3)}25%{opacity:.35}100%{opacity:0;transform:scale(1.8)}}' +
      '.st-error .tb-eye{opacity:0;animation:none}.st-error .tb-eyer{opacity:1}' +
      '.st-error .tb-head{animation:tb-jolt .4s ease-in-out 3}@keyframes tb-jolt{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}' +
      // Done: the crank turns, the lid flies open and the jack springs out; confetti; the rockets fizz up and
      // burst into small sparkles; the robot throws its arms up.
      '.tb-jack{opacity:0}.st-done .tb-jack{opacity:1}' +
      '.st-done .tb-box{animation:tb-shake .25s ease-in-out both}@keyframes tb-shake{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}' +
      '.st-done .tb-crk{animation:mv-spin .25s linear 2}' +
      '.st-done .tb-lid{animation:tb-lid .35s ease-out .25s both}@keyframes tb-lid{to{transform:rotate(-118deg)}}' +
      '.st-done .tb-js{animation:tb-js 1.3s ease-out both}' +
      '@keyframes tb-js{0%,28%{transform:scaleY(.04)}45%{transform:scaleY(1.16)}58%{transform:scaleY(.9)}70%{transform:scaleY(1.05)}80%,100%{transform:scaleY(1)}}' +
      '.st-done .tb-jh{animation:tb-jh 1.3s ease-out both}' +
      '@keyframes tb-jh{0%,28%{transform:translateY(300px)}45%{transform:translateY(-26px)}58%{transform:translateY(16px)}70%{transform:translateY(-8px)}80%,100%{transform:translateY(0)}}' +
      '.st-done .tb-jw{animation:tb-jbob 1.6s ease-in-out 1.2s infinite}@keyframes tb-jbob{25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}' +
      '.tb-cf{opacity:0;transform-box:fill-box;transform-origin:center}.st-done .tb-cf{animation:tb-cf 2.6s cubic-bezier(.2,.7,.4,1) both}' +
      '@keyframes tb-cf{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}45%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(220deg)}' +
      '100%{opacity:0;transform:translate(calc(var(--dx) * 1.3),calc(var(--dy) + 280px)) rotate(520deg)}}' +
      '.st-done .tb-rk{animation:tb-rk 1.3s both}' +
      '@keyframes tb-rk{0%{transform:translate(0,0)}8%{transform:translate(1px,-2px) rotate(3deg)}14%{transform:translate(-1px,0) rotate(-3deg)}' +
      '20%{transform:translate(0,-4px);animation-timing-function:cubic-bezier(.5,0,.9,.7)}95%{opacity:1}100%{opacity:0;transform:translate(var(--rx),var(--ry)) rotate(var(--rr))}}' +
      '.tb-flm,.tb-fz,.tb-trl{opacity:0}' +
      '.st-done .tb-trl{transform-box:fill-box;transform-origin:50% 0;animation:tb-trl 1.3s ease-in both}@keyframes tb-trl{0%,18%{opacity:0;transform:scaleY(.2)}30%{opacity:.9}95%{opacity:.9;transform:scaleY(1)}100%{opacity:0}}' +
      '.st-done .tb-flm{transform-box:fill-box;transform-origin:50% 0;animation:tb-flm .3s ease-in-out infinite alternate}@keyframes tb-flm{from{opacity:.65;transform:scaleY(.8)}to{opacity:1;transform:scaleY(1.25)}}' +
      '.st-done .tb-fz{animation:tb-fz .45s ease-out infinite}@keyframes tb-fz{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),22px)}}' +
      '.tb-sp{opacity:0}.st-done .tb-sp{animation:tb-sp 1.9s ease-out both}' +
      '@keyframes tb-sp{0%{opacity:0;transform:translate(0,0) scale(.3)}15%{opacity:1}65%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}' +
      '.tb-bg{opacity:0}.st-done .tb-bg{animation:tb-bg 1.8s ease-out both}@keyframes tb-bg{0%{opacity:0;transform:scale(.4)}20%{opacity:.8}100%{opacity:0;transform:scale(1.3)}}' +
      '.st-done .tb-arm{animation:tb-cheer .5s ease-out .3s both}@keyframes tb-cheer{to{transform:rotate(150deg)}}' +
      '.st-done .tb-eye{animation:none;opacity:1}',
    scenery:
      '<defs>' +
      '<linearGradient id="tb-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0609"/><stop offset=".75" stop-color="#160e12"/><stop offset="1" stop-color="#1b1115"/></linearGradient>' +
      '<linearGradient id="tb-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c120e"/><stop offset="1" stop-color="#0c0706"/></linearGradient>' +
      '<linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1030"/><stop offset="1" stop-color="#1a2552"/></linearGradient>' +
      '<radialGradient id="tb-halo"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".4"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tb-beam" gradientUnits="userSpaceOnUse" x1="250" y1="60" x2="760" y2="860"><stop offset="0" stop-color="#cdd8ff" stop-opacity=".09"/><stop offset="1" stop-color="#cdd8ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="tb-nlg"><stop offset="0" stop-color="#ffb860" stop-opacity=".3"/><stop offset=".45" stop-color="#ffa040" stop-opacity=".1"/><stop offset="1" stop-color="#ffa040" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tb-hb"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".42"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="tb-lamp"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-eyeg"><stop offset="0" stop-color="#ffbf5a" stop-opacity=".22"/><stop offset="1" stop-color="#ffbf5a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="tb-bglow"><stop offset="0" stop-color="#ffd88a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="tb-trail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36a" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="tb-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset=".5" stop-color="#ffb347"/><stop offset="1" stop-color="#ff6a3a" stop-opacity="0"/></linearGradient>' +
      '<pattern id="tb-wp" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M24 18L26 24L32 24L27 28L29 34L24 30L19 34L21 28L16 24L22 24Z" fill="#5a3a44"/><circle cx="72" cy="66" r="3" fill="#4a3038"/></pattern>' +
      '<clipPath id="tb-wc"><rect x="90" y="58" width="320" height="266"/></clipPath>' +
      '<clipPath id="tb-jc"><rect x="180" y="200" width="380" height="572"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#tb-wall)"/>' +
      '<rect width="1600" height="760" fill="url(#tb-wp)" opacity=".35"/>' +
      `<g class="tb-bun"><path d="M470 26Q1040 150 1610 18" fill="none" stroke="#3a2a2a" stroke-width="2"/>${pennants}</g>` +
      windowArt(next) +
      '<path d="M90 58H410L930 860H610Z" fill="url(#tb-beam)"/>' +
      motes +
      '<g class="mv-b">' +
      // The nightlight, plugged in low on the wall: pinned with the floor so the skirting never rises over it.
      '<g class="tb-nl"><circle cx="472" cy="712" r="230" fill="url(#tb-nlg)"/></g>' +
      `<rect x="458" y="690" width="28" height="42" rx="5" fill="#cdbf9e" fill-opacity=".35"/><path d="${glyph('moon', 472, 711, 12)}" fill="#ffcf7a" fill-opacity=".9"/>` +
      '<rect y="744" width="1600" height="300" fill="url(#tb-floor)"/>' +
      `<path d="${planks}" fill="none" stroke="#2a1c16" stroke-width="2"/>` +
      '<rect y="740" width="1600" height="22" fill="#22151a"/><path d="M0 741H1600" stroke="#3a262c" stroke-width="2"/>' +
      '<ellipse cx="820" cy="905" rx="440" ry="72" fill="#2a0f13"/><ellipse cx="820" cy="905" rx="384" ry="60" fill="none" stroke="#4a1a20" stroke-width="10"/>' +
      '<ellipse cx="820" cy="905" rx="300" ry="45" fill="none" stroke="#1b3a3c" stroke-width="7"/><ellipse cx="820" cy="905" rx="200" ry="29" fill="#33121a"/>' +
      horse() +
      tower() +
      jackBox(next) +
      dust(802, 900, 1.3) +
      dust(365, 762, 1.33) +
      dust(586, 925, 1.38) +
      train() +
      '</g>' +
      rocket(346, 0.15, -24, -170, -10) +
      rocket(404, 0.5, -110, -150, -26) +
      burst(316, 66, 1.4, 3) +
      burst(256, 118, 1.75, 4),
    nook:
      robot() +
      // A spinning top on the floor beside the drum.
      '<defs><clipPath id="tb-tc"><path d="M0 0L-34 -36Q-36 -58 0 -62Q36 -58 34 -36Z"/></clipPath></defs>' +
      '<g transform="translate(52 456)"><g class="tb-top">' +
      `<path d="M0 0L-34 -36Q-36 -58 0 -62Q36 -58 34 -36Z" fill="${RED_D}"/>` +
      `<g clip-path="url(#tb-tc)"><g class="tb-sps" fill="${CREAM}" fill-opacity=".3"><rect x="-40" y="-64" width="9" height="66"/><rect x="-6" y="-64" width="9" height="66"/><rect x="28" y="-64" width="9" height="66"/></g></g>` +
      `<ellipse cx="0" cy="-40" rx="34" ry="6" fill="${GOLD_D}"/>` +
      '<rect x="-5" y="-78" width="10" height="18" rx="3" fill="#215f64"/></g></g>',
  }
}
