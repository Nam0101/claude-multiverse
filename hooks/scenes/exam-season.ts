import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Exam Season: a student's room at 2 a.m. Stacks of books tower like skyscrapers down the left, a school clock hangs
// between them, the window over the desk shows a sleeping city. Claude studies in a hoodie and headphones under a desk
// lamp, sitting on a pile of textbooks beside a cup of instant noodles. A run whips the notes and pages into a paper
// storm round the stacks while a giant clock face sweeps behind them; an error tips the coffee, a wave of it floods
// the floor and the tallest stack topples; done brings dawn into the window and the pages fly out like birds.
const BLUE = '#7aa7ff'
const LAMP = '#ffd89a'
const PAPER = '#e6dfcc'
const WOOD = '#2a2119'
const WOOD_EDGE = '#3e3125'
const HOOD = '#2b3653'
const HOOD_EDGE = '#3e4c72'
const PHONES = '#181d29'
const COFFEE = '#3a2414'
const NOTES = ['#f2d35a', '#f08aa8', '#6fd6e8', '#9be07e'] as const
const SPINES = ['#43283c', '#24395a', '#2f4834', '#56422a', '#372d60', '#522a2a', '#244a50', '#4d4b2c'] as const

const g2 = (n: number): string => String(Math.round(n * 100) / 100)
const box = (x: number, y: number, w: number, h: number): string => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`
/** A point for a path drawn with round caps: each one a dot as wide as the stroke. */
const pt = (x: number, y: number): string => `M${f(x)} ${f(y)}h0`
/** A window light: a short stroke as tall as the stroke is wide. */
const lit = (x: number, y: number): string => `M${f(x)} ${f(y + 2.5)}h4`
const pick = <T>(list: readonly T[], at: number): T => list[at % list.length] as T

/** Invented marks in rows: short strokes with ticks and hooks, never letters of any script. */
function marks(next: () => number, x: number, y: number, w: number, rows: number, gap: number): string {
  let d = ''

  for (let r = 0; r < rows; r += 1) {
    const end = x + w * (0.6 + next() * 0.4)
    let cx = x

    while (cx < end - 3) {
      const len = Math.min(2 + next() * 6, end - cx)
      const kind = next()

      d += `M${f(cx)} ${f(y + r * gap)}h${f(len)}${kind < 0.25 ? 'v-2.5' : kind < 0.4 ? `m${f(-len / 2)} 0v2` : ''}`
      cx += len + 1.5 + next() * 2.5
    }
  }

  return d
}

/** A square sticky note with invented scribbles, turned `rot`; `cls` goes on an inner group so it can animate. */
function note(next: () => number, x: number, y: number, s: number, rot: number, color: string, cls = '', style = ''): string {
  const inner =
    `<path d="${box(-s / 2, -s / 2, s, s)}" fill="${color}" fill-opacity=".82"/>` +
    `<path d="${pickGlyph(Math.floor(next() * 3))}" transform="scale(${g2(s / 22)})" stroke="#2a2418" stroke-opacity=".55"/>`

  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${cls ? `<g class="${cls}"${style ? ` style="${style}"` : ''}>${inner}</g>` : inner}</g>`
}

type Book = { x: number; y: number; w: number; h: number; c: number; side: boolean }

/** A pile of books from `base` up to `top`, narrowing a little toward the top and leaning as it goes. */
function pile(seed: number, cx: number, base: number, top: number, w0: number, w1: number): Book[] {
  const next = random(seed)
  const books: Book[] = []
  let y = base
  let lean = 0

  while (y > top) {
    const h = 19 + next() * 20
    const t = (base - y) / (base - top)
    const w = (w0 + (w1 - w0) * t) * (0.84 + next() * 0.26)

    lean = lean * 0.7 + (next() - 0.5) * 10
    books.push({ x: cx - w / 2 + lean, y: y - h, w, h, c: Math.floor(next() * SPINES.length), side: next() < 0.34 })
    y -= h
  }

  return books
}

/** Books as a few paths: covers by color, page blocks, title bands that read as lit windows, rim light, tabs. */
function books(list: Book[], seed: number): string {
  const next = random(seed)
  const byColor = SPINES.map(() => '')
  const tabs = NOTES.map(() => '')
  let pages = ''
  let lines = ''
  let labels = ''
  let gold = ''
  let rim = ''

  for (const b of list) {
    byColor[b.c] += box(b.x, b.y, b.w, b.h)
    rim += `M${f(b.x + b.w - 1)} ${f(b.y + 1)}v${f(b.h - 2)}`

    if (b.side) {
      pages += box(b.x + 3, b.y + 2.5, b.w - 6, b.h - 5)
      lines += `M${f(b.x + 4)} ${f(b.y + b.h / 2)}h${f(b.w - 8)}`

      if (next() < 0.6) {
        const at = Math.floor(next() * NOTES.length)

        tabs[at] += next() < 0.5 ? box(b.x + b.w - 2, b.y + 3, 9, 5) : box(b.x - 7, b.y + b.h - 8, 9, 5)
      }
    } else {
      const lh = Math.min(6, b.h * 0.32)
      const band = box(b.x + b.w * (0.1 + next() * 0.45), b.y + (b.h - lh) / 2, b.w * (0.14 + next() * 0.2), lh)

      if (next() < 0.3) {
        gold += band
      } else {
        labels += band
      }

      if (next() < 0.45) {
        labels += box(b.x + b.w * 0.78, b.y + (b.h - 3) / 2, b.w * 0.1, 3)
      }
    }
  }

  return (
    byColor.map((d, i) => (d ? `<path d="${d}" fill="${pick(SPINES, i)}" stroke="#06070a" stroke-width="1.2"/>` : '')).join('') +
    `<path d="${pages}" fill="#d6ccb0" fill-opacity=".4"/><path d="${lines}" stroke="#6a604c" stroke-opacity=".55"/>` +
    `<path d="${labels}" fill="#e6dcc0" fill-opacity=".3"/><path d="${gold}" fill="#d9b25a" fill-opacity=".5"/>` +
    `<path d="${rim}" stroke="${BLUE}" stroke-opacity=".22" stroke-width="2"/>` +
    tabs.map((d, i) => (d ? `<path d="${d}" fill="${pick(NOTES, i)}" fill-opacity=".8"/>` : '')).join('')
  )
}

/** The round school clock: a pale face, ticks, hands at ten past two and a second hand that steps. */
function wallClock(cx: number, cy: number, r: number): string {
  let ticks = ''

  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6
    const r0 = i % 3 === 0 ? r * 0.72 : r * 0.8

    ticks += `M${f(cx + Math.sin(a) * r0)} ${f(cy - Math.cos(a) * r0)}L${f(cx + Math.sin(a) * r * 0.9)} ${f(cy - Math.cos(a) * r * 0.9)}`
  }

  return (
    `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#1a1e29" stroke="#353d52" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#c9c4b6" fill-opacity=".6"/>` +
    `<path d="${ticks}" stroke="#14161c" stroke-width="3"/>` +
    `<g transform="translate(${cx} ${cy})"><g class="ex-hh"><path d="M0 6V${f(-r * 0.5)}" transform="rotate(65)" stroke="#0d0f14" stroke-width="6" stroke-linecap="round"/></g>` +
    `<g class="ex-mh"><path d="M0 8V${f(-r * 0.76)}" transform="rotate(60)" stroke="#0d0f14" stroke-width="4" stroke-linecap="round"/></g>` +
    `<g class="ex-sh"><path d="M0 12V${f(-r * 0.84)}" stroke="#d8584a" stroke-width="1.8"/></g><circle r="4" fill="#d8584a"/></g>` +
    `<path d="M${f(cx - r * 0.7)} ${f(cy - r * 0.45)}A${r} ${r} 0 0 1 ${f(cx - r * 0.1)} ${f(cy - r * 0.86)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>`
  )
}

/** The clock face that looms over the stacks while a command runs: a ring of ticks and two sweeping hands. */
function giantClock(cx: number, cy: number, r: number): string {
  // The ticks are dashes round two rings: sixty fine ones and twelve bold ones, centred on the hours.
  const ring = (rr: number, n: number, dash: number): string => {
    const c = 2 * Math.PI * rr

    return `<circle r="${f(rr)}" fill="none" stroke-dasharray="${dash} ${f(c / n - dash)}" stroke-dashoffset="${f(dash / 2)}" `
  }

  return (
    `<g class="ex-gc"><g transform="translate(${cx} ${cy})"><g class="ex-gcs">` +
    `<circle r="${r}" fill="none" stroke="${BLUE}" stroke-opacity=".3" stroke-width="4"/>` +
    `<circle r="${f(r * 1.06)}" fill="none" stroke="${BLUE}" stroke-opacity=".12" stroke-width="10"/>` +
    `<g stroke="${BLUE}" stroke-opacity=".38">${ring(r * 0.965, 60, 3)}stroke-width="${f(r * 0.07)}"/>${ring(r * 0.92, 12, 8)}stroke-width="${f(r * 0.16)}"/></g>` +
    `<g class="ex-gm"><path d="M0 20V${f(-r * 0.8)}" stroke="${BLUE}" stroke-opacity=".42" stroke-width="7" stroke-linecap="round"/></g>` +
    `<g class="ex-gh"><path d="M0 14V${f(-r * 0.5)}" stroke="${BLUE}" stroke-opacity=".42" stroke-width="11" stroke-linecap="round"/></g>` +
    `<circle r="14" fill="${BLUE}" fill-opacity=".4"/></g></g></g>`
  )
}

/** A loose page folded down the middle, flapping: a paper bird. */
const BIRD = '<path d="M0 0L-24 -11L-19 6ZM0 0L24 -11L19 6Z"/>'

/** A few rows of invented marks for the loose sheets, centered on the sheet. */
const GLYPHS = ['M-8 -8h5m2 0h7v-2M-8 -3h3m2 0h9M-8 2h7m3 0h3v2M-8 7h10', 'M-8 -8h9m2 0h3M-8 -3h2v-2m3 2h8M-8 2h12M-8 7h4m2 0h5v-2', 'M-8 -8h3v2m2 -2h8M-8 -3h10M-8 2h4m2 0h6M-8 7h7v-2m2 2h3'] as const
const pickGlyph = (i: number): string => pick(GLYPHS, i)

function birds(next: () => number, count: number, from: [number, number, number, number], to: (x: number, y: number) => [number, number], scale: number, secs: number, delay: [number, number]): string {
  let out = `<g fill="${PAPER}" fill-opacity=".88" style="--s:${g2(scale)};--bs:${g2(secs)}s">`

  for (let i = 0; i < count; i += 1) {
    const x = from[0] + next() * from[2]
    const y = from[1] + next() * from[3]
    const [dx, dy] = to(x, y)

    out +=
      `<g transform="translate(${f(x)} ${f(y)})"><g class="ex-bd" style="--dx:${Math.round(dx)}px;--dy:${Math.round(dy)}px;animation-delay:${f(delay[0] + (i / count) * delay[1])}s">` +
      `<g class="ex-flap">${BIRD}</g></g></g>`
  }

  return out + '</g>'
}

/** The laptop, the desk lamp, a mug of coffee, a cup of instant noodles and a phone. Self-contained for the portals. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const mug =
    '<rect x="0" y="-18" width="16" height="18" rx="2.5" fill="#cdd6e8" fill-opacity=".9"/>' +
    '<path d="M16 -14q7 0 7 5q0 5 -7 5" fill="none" stroke="#cdd6e8" stroke-opacity=".9" stroke-width="3"/>' +
    `<rect x="1.5" y="-17" width="13" height="3" fill="${COFFEE}"/><path d="M2 -9h12" stroke="${BLUE}" stroke-opacity=".7" stroke-width="2"/>`
  const spilt = activity === 'error'
  const web = activity === 'web'

  return (
    // The lamp's light falling on the keys, under everything else.
    `<path d="M356 205L232 330H352L391.6 230.7Z" fill="${LAMP}" fill-opacity=".1"/><path d="M362 210L262 330H336L386 226Z" fill="${LAMP}" fill-opacity=".08"/>` +
    // The laptop, a sticky note flagged on its lid.
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2a3140"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2a3140"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/><path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M363 252L379 247L381 258L366 262Z" fill="#f2d35a" fill-opacity=".85"/>' +
    // The highlighter and the phone, face up.
    '<rect x="212" y="326" width="22" height="4" rx="2" fill="#e8e05a" fill-opacity=".85"/><rect x="212" y="326" width="6" height="4" rx="1.5" fill="#3a3a20"/>' +
    `<rect x="176" y="325" width="28" height="5" rx="1.5" fill="${PHONES}" stroke="#2c3344"/>` +
    (web
      ? `<rect class="ex-ph" x="178" y="325" width="24" height="2" fill="${BLUE}"/>` +
        `<g transform="translate(190 318)"><circle class="ex-ping" r="10" fill="none" stroke="${BLUE}" stroke-width="2"/><circle class="ex-ping" style="animation-delay:.5s" r="10" fill="none" stroke="${BLUE}" stroke-width="2"/></g>`
      : '') +
    // The mug: upright and steaming, or knocked over with the coffee running off the desk.
    (spilt
      ? `<g class="ex-sp"><path d="M300 329.5C300 327 340 326.5 372 328.5V331H300Z" fill="${COFFEE}"/>` +
        `<path d="M302 331H362V344H302Z" fill="${COFFEE}" fill-opacity=".85"/></g>` +
        `<path class="ex-drp" pathLength="1" d="M308 344V454M326 344V448M348 344V452" stroke="${COFFEE}" stroke-width="4" stroke-linecap="round"/>` +
        `<ellipse class="ex-sp" cx="330" cy="455" rx="44" ry="4" fill="${COFFEE}"/>` +
        `<g transform="translate(376 330)"><g class="ex-tip">${mug}</g></g>`
      : `<g transform="translate(376 330)">${mug}</g>` +
        '<path class="ex-stm" pathLength="1" d="M384 310c-6 -8 6 -12 0 -22" fill="none" stroke="#dfe6f2" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>') +
    // The instant noodles: lid peeled back, chopsticks in, steam curling up.
    '<path d="M403 300H437L433 330H407Z" fill="#e4ddcc" fill-opacity=".92"/><path d="M404.3 308H435.7L435.2 313H404.8Z" fill="#c8553d" fill-opacity=".9"/>' +
    '<path d="M412 320h5m3 0h3v-2m3 2h4" stroke="#6a3020" stroke-opacity=".7" stroke-width="1.4" fill="none"/>' +
    '<path d="M403 300L413 283L438 289L437 300Z" fill="#d4cab2" fill-opacity=".9"/>' +
    '<path d="M414 302L398 262M420 302L407 259" stroke="#b89060" stroke-width="2.6" stroke-linecap="round"/>' +
    '<g fill="none" stroke="#e8edf5" stroke-opacity=".42" stroke-width="2.4" stroke-linecap="round">' +
    '<path class="ex-stm" pathLength="1" d="M424 282c-8 -12 8 -18 0 -32c-6 -10 6 -16 0 -26"/>' +
    '<path class="ex-stm" pathLength="1" style="animation-delay:-1.6s" d="M432 286c-8 -12 8 -18 0 -32c-6 -10 6 -16 0 -26"/></g>' +
    // The desk lamp, clamped at the far end, its shade aimed down at the keys.
    '<path d="M442 330V320H460V330Z" fill="#232a38"/><path d="M452 320L444 214L398 184" fill="none" stroke="#2f3749" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M448 300L441 222M438 210L404 188" stroke="#4a5570" stroke-width="1.4"/>' +
    '<circle cx="444" cy="214" r="5" fill="#3a4358"/><circle cx="398" cy="184" r="4.5" fill="#3a4358"/>' +
    '<path d="M390.3 182.9L401.7 191.1L391.6 230.7L356 205Z" fill="#2f3749" stroke="#4a5570" stroke-width="1.6" stroke-linejoin="round"/>' +
    `<ellipse cx="373.8" cy="217.8" rx="20" ry="4" transform="rotate(35.8 373.8 217.8)" fill="#fff2cc" fill-opacity=".9"/>`
  )
}

export function examSeasonWorld(): World {
  const next = random(240)

  // The three towers of books: S1 and S3 tall like skyscrapers, S2 lower under the clock.
  const s1 = pile(31, 82, 960, 150, 128, 104)
  const s2 = pile(32, 215, 960, 446, 108, 96)
  const s3all = pile(33, 350, 960, 70, 124, 98)
  const cut = s3all.length - 7
  const s3 = s3all.slice(0, cut)
  const chunk = s3all.slice(cut)
  const s1Top = s1[s1.length - 1] ?? { x: 30, y: 150, w: 100, h: 20 }
  const s2Top = s2[s2.length - 1] ?? { x: 165, y: 446, w: 100, h: 20 }
  const chunkBase = chunk[0] ?? { x: 300, y: 260, w: 100, h: 20 }
  const chunkTop = chunk[chunk.length - 1] ?? { x: 300, y: 80, w: 100, h: 20 }
  const pivot: [number, number] = [chunkBase.x, chunkBase.y + chunkBase.h]
  const s1c = s1Top.x + s1Top.w / 2
  const s2c = s2Top.x + s2Top.w / 2
  const s3c = chunkTop.x + chunkTop.w / 2

  // On S1 a book lies open face down like a roof; on S2 a book lies open; on S3 a pencil cup with a ruler.
  const tent =
    `<path d="M${f(s1c - 58)} ${f(s1Top.y)}L${f(s1c)} ${f(s1Top.y - 38)}L${f(s1c + 58)} ${f(s1Top.y)}Z" fill="#2c3d62" stroke="#06070a" stroke-width="1.5"/>` +
    `<path d="M${f(s1c - 54)} ${f(s1Top.y)}L${f(s1c)} ${f(s1Top.y - 32)}L${f(s1c + 54)} ${f(s1Top.y)}" fill="none" stroke="#d6ccb0" stroke-opacity=".55" stroke-width="3"/>` +
    `<path d="M${f(s1c)} ${f(s1Top.y - 38)}V${f(s1Top.y)}" stroke="#06070a" stroke-width="2"/>`
  const open =
    `<g transform="translate(${f(s2c)} ${f(s2Top.y)})">` +
    '<path d="M0 0Q-24 -10 -50 -4V2Q-24 -4 0 4ZM0 0Q24 -10 50 -4V2Q24 -4 0 4Z" fill="#ddd3b8" fill-opacity=".8" stroke="#8a826c" stroke-width="1"/>' +
    '<path d="M-44 -3Q-24 -8 -6 -2M-40 0Q-24 -4 -8 1M6 -2Q24 -8 44 -3" fill="none" stroke="#6a604c" stroke-opacity=".6"/>' +
    '<g class="ex-flip"><path d="M0 0Q22 -12 46 -8L44 -4Q22 -6 0 2Z" fill="#efe8d4" fill-opacity=".9"/></g></g>'
  const cup =
    `<g transform="translate(${f(s3c)} ${f(chunkTop.y)})">` +
    '<path d="M-6 -30L-26 -86M2 -30L10 -92M8 -30L22 -78" stroke-width="4" stroke-linecap="round" fill="none" stroke="#c9a54a"/>' +
    '<path d="M-26 -86l-2 -8M10 -92v-8M22 -78l3 -8" stroke="#e8a0a0" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M-18 -30L-36 -120L-28 -122L-10 -30Z" fill="#8fa8c8" fill-opacity=".55" stroke="#06070a"/>' +
    '<path d="M-16 0V-32H16V0Z" fill="#1f2a40" stroke="#3a4a6a" stroke-width="1.6"/><path d="M-16 -24H16" stroke="#3a4a6a"/></g>'

  const stickies = [
    note(next, s1c + 30, 520, 24, -8, pick(NOTES, 0), 'ex-sn', 'animation-delay:.2s'),
    note(next, s1c - 22, 760, 22, 6, pick(NOTES, 1), 'ex-sn', 'animation-delay:.45s'),
    note(next, s2c + 26, 640, 22, 10, pick(NOTES, 2), 'ex-sn', 'animation-delay:.35s'),
    note(next, 372, 470, 24, -5, pick(NOTES, 0), 'ex-sn', 'animation-delay:.55s'),
    note(next, 330, 780, 20, 4, pick(NOTES, 3), 'ex-sn', 'animation-delay:.25s'),
  ].join('')
  const chunkNote = note(next, s3c + 14, chunkBase.y - 40, 22, -12, pick(NOTES, 1))

  // Three books fly loose off the top of S3 when it topples.
  const loose = [0, 1, 2]
    .map(i => {
      const b = chunk[2 + i * 2] ?? chunkTop
      const x = b.x + b.w / 2
      const y = b.y + b.h / 2

      return (
        `<g transform="translate(${f(x)} ${f(y)})"><g class="ex-lb" style="--dx:${f(-150 - i * 70)}px;--dy:${f(600 - i * 90)}px;--r:${-200 - i * 120}deg;animation-delay:${g2(0.45 + i * 0.12)}s">` +
        `<rect x="${f(-b.w / 2)}" y="${f(-b.h / 2)}" width="${f(b.w * 0.8)}" height="${f(b.h)}" fill="${pick(SPINES, i + 3)}" stroke="#06070a"/>` +
        `<rect x="${f(-b.w / 2 + 4)}" y="${f(-b.h / 2 + 3)}" width="${f(b.w * 0.8 - 8)}" height="${f(b.h - 6)}" fill="#d6ccb0" fill-opacity=".5"/></g></g>`
      )
    })
    .join('')

  // The fairy lights strung along the top of the wall, two strands twinkling out of step.
  const spans: [number, number, number, number, number][] = [
    [-30, 40, 430, 26, 40],
    [430, 26, 1180, 30, 34],
    [1180, 30, 1630, 42, 40],
  ]
  let wire = ''
  let bulbA = ''
  let bulbB = ''
  let haloA = ''
  let haloB = ''
  let count = 0

  for (const [x1, y1, x2, y2, sag] of spans) {
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 + sag * 2
    const n = Math.round((x2 - x1) / 62)

    wire += `M${x1} ${y1}Q${f(mx)} ${f(my)} ${x2} ${y2}`

    for (let k = 1; k < n; k += 1) {
      const t = k / n
      const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2
      const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2 + 7
      const dim = x > 470 && x < 1140

      if (count % 2 === 0) {
        bulbA += pt(x, y)
        haloA += dim ? '' : pt(x, y)
      } else {
        bulbB += pt(x, y)
        haloB += dim ? '' : pt(x, y)
      }

      count += 1
    }
  }

  // The run's paper storm: sheets and notes spiralling up round the towers, some behind them, some in front.
  const storm = (n: number, depth: number): string =>
    Array.from({ length: n }, (_, i) => {
      const x = 215 + (next() - 0.5) * 150
      const y = 900 + next() * 80
      const reach = Math.min(70 + next() * 120, 440 - x)
      const rx = next() < 0.5 ? reach : -reach
      const secs = 2.6 + next() * 1.2
      const sheet = i % 3 !== 2
      const body = sheet
        ? `<path d="M-11 -14h22v28h-22z"/><path d="${pickGlyph(i)}" fill="none" stroke="#4a4436" stroke-opacity=".6"/>`
        : `<path d="M-8 -8h16v16h-16z" fill="${pick(NOTES, i)}"/>`

      return (
        `<g transform="translate(${f(x)} ${f(y)}) scale(${g2(depth)})"><g class="ex-pc" style="--rx:${Math.round(rx)}px;--h:${Math.round(620 + next() * 320)}px;--r:${Math.round((next() - 0.5) * 900)}deg;--t:${f(secs)}s;--d:${f(-next() * secs)}s">${body}</g></g>`
      )
    }).join('')
  const whirl = [820, 610, 400]
    .map(
      (y, i) =>
        `<g transform="translate(215 ${y}) scale(1 .28)"><g class="ex-wh" style="animation-duration:${g2(1 + i * 0.25)}s">` +
        `<circle r="${170 - i * 12}" fill="none" stroke="#c8d6f0" stroke-opacity=".3" stroke-width="7" stroke-dasharray="160 220" stroke-linecap="round"/></g></g>`,
    )
    .join('')
  const swirl = Array.from({ length: 11 }, (_, k) => {
    const t = k / 10
    const a = t * Math.PI * 2.5
    const fade = k === 0 || k === 10 ? ';opacity:0' : k === 1 || k === 9 ? ';opacity:1' : ''

    return `${f(t * 100)}%{transform:translate(calc(var(--rx) * ${g2(Math.sin(a))}),calc(var(--h) * ${g2(-t)})) rotate(calc(var(--r) * ${g2(t)})) scale(${g2(0.85 + 0.25 * Math.cos(a))})${fade}}`
  }).join('')

  // The floor: boards, crumpled paper, a wastebasket.
  const ball = (x: number, y: number, r: number): string =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#cfc8b4" fill-opacity=".42"/><path d="M${x - r * 0.6} ${y - r * 0.2}l${f(r * 0.5)} ${f(r * 0.4)}l${f(r * 0.4)} ${f(-r * 0.6)}l${f(r * 0.4)} ${f(r * 0.5)}" fill="none" stroke="#5a5444" stroke-opacity=".6"/>`
  const seams = Array.from({ length: 12 }, (_, i) => `M${f(i * 140 + (i % 2) * 60)} ${i % 3 === 0 ? 906 : i % 3 === 1 ? 946 : 990}v${i % 3 === 2 ? 20 : 38}`).join('')

  // The coffee: drips from the desk, then a wave of it rolls left across the floor.
  const bubbles = Array.from({ length: 9 }, () => pt(80 + next() * 900, 905 + next() * 60)).join('')

  // The city in the window, in the nook's coordinates: glass x 64..366, y -466..-104.
  const far: string[] = []
  const near: string[] = []
  let litA = ''
  let litB = ''
  let litT = ''

  for (let x = 58; x < 366; ) {
    const w = 18 + next() * 16
    const top = -300 + next() * 100

    far.push(box(x, top, w, -104 - top))
    x += w + 2
  }

  for (let x = 56; x < 366; ) {
    const w = 26 + next() * 26
    const top = -250 + next() * 110

    near.push(box(x, top, w, -104 - top))

    for (let wy = top + 8; wy < -114; wy += 11) {
      for (let wx = x + 5; wx < x + w - 7; wx += 8) {
        const roll = next()

        if (roll < 0.05) {
          litT += lit(wx, wy)
        } else if (roll < 0.12) {
          litA += lit(wx, wy)
        } else if (roll < 0.16) {
          litB += lit(wx, wy)
        }
      }
    }

    x += w + 1
  }

  const stars = Array.from({ length: 22 }, () => pt(70 + next() * 290, -458 + next() * 170)).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'puffs',
      ink: '#05060a',
      furniture: WOOD,
      metal: '#2a3140',
      paper: PAPER,
      light: { idle: '#4f74b8', work: BLUE, bright: '#d4e2ff' },
      headTop: 198,
      glowAt: [350, 284],
      device,
      wear: {
        // The hood, up: it rises behind the head and frames the face; the eyes stay clear inside it.
        behind: `<path d="M56 302V244C56 208 98 194 150 194C202 194 244 208 244 244V302Z" fill="${HOOD}" stroke="${HOOD_EDGE}" stroke-width="2"/>`,
        front:
          `<path d="M77 322V258Q77 245 90 245H210Q223 245 223 258V322" fill="none" stroke="${HOOD}" stroke-width="14" stroke-linejoin="round"/>` +
          `<path d="M84 322V260Q84 252 92 252H208Q216 252 216 260V322" fill="none" stroke="${HOOD_EDGE}" stroke-width="2"/>` +
          // The hoodie's front below the face, with its drawstrings and pocket.
          `<path d="M70 320H230V350H70Z" fill="${HOOD}"/><path d="M98 338H202" stroke="${HOOD_EDGE}" stroke-width="2"/>` +
          '<path d="M124 321V342M176 321V342" stroke="#cfd6e6" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>' +
          // Headphones over the hood: the band, two cups with a blue ring, the cable to the laptop.
          `<path d="M60 268C60 186 240 186 240 268" fill="none" stroke="${PHONES}" stroke-width="9" stroke-linecap="round"/>` +
          '<path d="M66 252C70 204 230 204 234 252" fill="none" stroke="#3a4560" stroke-width="2"/>' +
          `<rect x="50" y="250" width="26" height="44" rx="9" fill="${PHONES}" stroke="#3a4560" stroke-width="2"/>` +
          `<rect x="224" y="250" width="26" height="44" rx="9" fill="${PHONES}" stroke="#3a4560" stroke-width="2"/>` +
          `<rect x="54" y="262" width="5" height="20" rx="2.5" fill="${BLUE}" fill-opacity=".9"/><rect x="241" y="262" width="5" height="20" rx="2.5" fill="${BLUE}" fill-opacity=".9"/>` +
          `<path d="M240 294C252 312 236 318 262 322" fill="none" stroke="${PHONES}" stroke-width="2.4"/>`,
      },
      // A pile of fat textbooks for a seat.
      seatArt:
        `<g stroke="#0a0c11" stroke-width="1.6"><rect x="100" y="350" width="102" height="22" fill="#3d2b52"/><rect x="108" y="372" width="92" height="26" fill="#223c50"/>` +
        '<rect x="97" y="398" width="106" height="28" fill="#50301f"/><rect x="104" y="426" width="98" height="30" fill="#2c4028"/></g>' +
        '<g fill="#d6ccb0" fill-opacity=".5"><rect x="104" y="353" width="94" height="16"/><rect x="101" y="401" width="98" height="22"/></g>' +
        '<path d="M106 361H196M103 412H197" stroke="#6a604c" stroke-opacity=".6"/>' +
        '<g fill="#d9b25a" fill-opacity=".55"><rect x="124" y="381" width="30" height="7"/><rect x="164" y="382" width="14" height="5"/><rect x="118" y="437" width="34" height="8"/></g>' +
        '<rect x="196" y="356" width="10" height="6" fill="#f08aa8" fill-opacity=".85"/><rect x="92" y="404" width="10" height="6" fill="#6fd6e8" fill-opacity=".85"/>',
      // A wooden study desk with a drawer unit, a note stuck on it and a backpack slumped against the leg.
      tableArt:
        `<rect x="166" y="330" width="304" height="14" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<rect x="176" y="344" width="14" height="112" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.4"/>` +
        `<rect x="360" y="344" width="104" height="112" fill="#221a14" stroke="${WOOD_EDGE}" stroke-width="1.6"/>` +
        `<path d="M366 382H458M366 420H458" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
        '<g fill="#5a4a38"><rect x="402" y="360" width="20" height="4" rx="2"/><rect x="402" y="398" width="20" height="4" rx="2"/><rect x="402" y="436" width="20" height="4" rx="2"/></g>' +
        '<path d="M432 352L452 355L449 374L429 371Z" fill="#9be07e" fill-opacity=".8"/><path d="M434 360h6m3 0h4M433 366h9" stroke="#2a3a20" stroke-opacity=".6" stroke-width="1.2"/>' +
        `<path d="M200 456C194 430 200 406 222 400C236 396 252 400 258 412C266 428 264 444 260 456Z" fill="${HOOD}" stroke="${HOOD_EDGE}" stroke-width="2"/>` +
        `<path d="M208 440H254M226 402C226 392 240 390 244 400" fill="none" stroke="${HOOD_EDGE}" stroke-width="2"/><rect x="214" y="420" width="36" height="16" rx="5" fill="#222c45" stroke="${HOOD_EDGE}"/>`,
    },
    style:
      // Ambient: the fairy lights twinkle, the second hand steps, steam curls, the notes stir in a draft.
      '.ex-fa{animation:ex-tw 3.6s ease-in-out infinite alternate}.ex-fb{animation:ex-tw 3.6s ease-in-out -1.8s infinite alternate}@keyframes ex-tw{from{opacity:.5}to{opacity:1}}' +
      '.ex-sh{animation:mv-spin 60s steps(60) infinite}' +
      '.ex-stm{stroke-dasharray:.4 .6;animation:ex-stm 3.2s linear infinite}@keyframes ex-stm{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
      '.ex-wn{animation:ex-stir 4.4s ease-in-out infinite alternate}@keyframes ex-stir{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-thinking .ex-wn{animation-duration:1.4s}' +
      '.ex-cur{transform-box:fill-box;transform-origin:50% 0;animation:ex-cur 6s ease-in-out infinite alternate}@keyframes ex-cur{from{transform:skewX(-1.5deg)}to{transform:skewX(1.5deg)}}' +
      '.ex-ctw{animation:ex-ctw 7s ease-in-out infinite}@keyframes ex-ctw{0%,40%{opacity:1}55%,85%{opacity:.1}100%{opacity:1}}' +
      '.ex-bcn{animation:ex-bcn 2.4s ease-in-out infinite}@keyframes ex-bcn{0%,100%{opacity:.25}50%{opacity:1}}' +
      '.ex-moth{animation:mv-spin 4.6s linear infinite}.ex-mw{animation:ex-mw .14s ease-in-out infinite alternate}@keyframes ex-mw{to{transform:scaleY(.25)}}' +
      '.st-thinking .ex-moth{animation-duration:2.2s}' +
      // Read: a page of the open book on S2 turns over and over.
      '.ex-flip{transform:scaleX(.15)}.st-read .ex-flip{animation:ex-flip .9s ease-in-out infinite}@keyframes ex-flip{0%{transform:scaleX(1)}50%,100%{transform:scaleX(-1)}}' +
      // Responding: days get crossed off the calendar. Tool: the highlighter streaks across the study sheet.
      '.ex-xn,.ex-hl{stroke-dasharray:1;stroke-dashoffset:1}' +
      '.st-responding .ex-xn{animation:ex-draw .5s ease-out var(--d) both}.st-tool .ex-hl{animation:ex-draw .4s ease-out var(--d) both}' +
      '@keyframes ex-draw{to{stroke-dashoffset:0}}' +
      // Web: the phone lights and pings, a plane crosses the window with its light blinking once a second.
      '.ex-ping{transform-box:fill-box;transform-origin:center;opacity:0;animation:ex-ping 1s ease-out infinite}@keyframes ex-ping{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}' +
      '.ex-ph{animation:ex-tw .5s ease-in-out infinite alternate}' +
      '.ex-plane{opacity:0}.st-web .ex-plane{animation:ex-plane 5s linear infinite}@keyframes ex-plane{0%{opacity:0;transform:translate(0,0)}8%,92%{opacity:1}100%{opacity:0;transform:translate(330px,-50px)}}' +
      '.ex-nav{animation:ex-bcn 1s ease-in-out infinite}' +
      // Run: the towers sway, a paper storm spirals up round them, the clock races and a giant face sweeps behind.
      '.st-run .ex-sway{animation:ex-sway 1.4s ease-in-out infinite alternate}@keyframes ex-sway{from{transform:rotate(-.7deg)}to{transform:rotate(.7deg)}}' +
      '.ex-storm,.ex-gc{opacity:0}.st-run .ex-storm{animation:ex-in .35s ease-out both}' +
      `.st-run .ex-pc{animation:ex-pc var(--t) linear var(--d) infinite}@keyframes ex-pc{${swirl}}` +
      '.st-run .ex-wh{animation-name:mv-spin;animation-timing-function:linear;animation-iteration-count:infinite}' +
      '.st-run .ex-gc{animation:ex-in .8s ease-out .1s both}@keyframes ex-in{to{opacity:1}}' +
      '.st-run .ex-gcs{animation:ex-gcs 1.1s cubic-bezier(.2,.8,.3,1) both}@keyframes ex-gcs{from{transform:scale(.25)}to{transform:scale(1)}}' +
      '.st-run .ex-gm{animation:mv-spin 1.5s linear infinite}.st-run .ex-gh{animation:mv-spin 12s linear infinite}' +
      '.st-run .ex-mh{animation:mv-spin 1.5s linear infinite}.st-run .ex-hh{animation:mv-spin 12s linear infinite}.st-run .ex-sh{animation:mv-spin 6s steps(60) infinite}' +
      '.st-run .ex-sn{animation:ex-stir .3s ease-in-out infinite alternate}' +
      // Error: the mug tips, coffee runs off the desk and rolls across the floor in a wave; the top of S3 topples.
      '.ex-tip{animation:ex-tip .45s cubic-bezier(.5,0,.7,1.3) .05s both}@keyframes ex-tip{to{transform:rotate(-90deg)}}' +
      '.ex-sp{transform-box:fill-box;transform-origin:100% 50%;animation:ex-sp .7s ease-out .35s both}@keyframes ex-sp{from{transform:scaleX(0)}to{transform:scaleX(1)}}' +
      '.ex-drp{stroke-dasharray:1;stroke-dashoffset:1;animation:ex-draw .6s ease-in .55s both}' +
      '.ex-wave{opacity:0}.st-error .ex-wave{animation:ex-wave 2.3s cubic-bezier(.25,.6,.35,1) .3s both}' +
      '@keyframes ex-wave{0%{opacity:0;transform:translate(1350px,30px)}8%{opacity:1}100%{opacity:1;transform:translate(60px,0)}}' +
      '.ex-crest{animation:ex-crest .8s ease-in-out infinite alternate}@keyframes ex-crest{to{transform:translateY(-8px)}}' +
      '.st-error .ex-top{animation:ex-top 1.8s cubic-bezier(.55,0,.75,.6) .25s both}' +
      '@keyframes ex-top{0%{transform:rotate(0)}12%{transform:rotate(4deg)}30%{transform:rotate(-8deg)}100%{transform:translate(-30px,560px) rotate(-92deg)}}' +
      '.ex-lb{opacity:0}.st-error .ex-lb{animation:ex-lb 1.8s cubic-bezier(.5,0,.8,.6) both}' +
      '@keyframes ex-lb{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.st-error .ex-sn{animation:ex-drop 1.4s ease-in both}.st-error .ex-wn{animation:ex-drop 1.6s ease-in .3s both}' +
      '@keyframes ex-drop{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(-20px,420px) rotate(70deg);opacity:0}}' +
      '.st-error .ex-sh{animation:ex-jit .25s ease-in-out infinite alternate}@keyframes ex-jit{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}' +
      // Done: dawn fills the window, the sun comes up over the city, its lights go out, the clock reaches six,
      // the window swings open and the pages fly out of it like birds.
      '.ex-dawn,.ex-shaft,.ex-warm,.ex-out{opacity:0}' +
      '.st-done .ex-dawn{animation:ex-in 2.6s ease-out both}.st-done .ex-warm{animation:ex-in 3s ease-out .3s both}' +
      '.st-done .ex-shaft{animation:ex-in 3.2s ease-out .4s both}.st-done .ex-out{animation:ex-in .4s ease-out .6s both}' +
      '.ex-sun{transform:translateY(70px)}.st-done .ex-sun{animation:ex-sun 3s cubic-bezier(.2,.7,.3,1) both}@keyframes ex-sun{from{transform:translateY(70px)}to{transform:translateY(-150px)}}' +
      '.st-done .ex-cl,.st-done .ex-ctw,.st-done .ex-stars{animation:ex-off 2.2s ease-out .3s both}@keyframes ex-off{to{opacity:.08}}' +
      '.st-done .ex-mh{animation:ex-m6 2.4s ease-in-out both}@keyframes ex-m6{to{transform:rotate(1380deg)}}' +
      '.st-done .ex-hh{animation:ex-h6 2.4s ease-in-out both}@keyframes ex-h6{to{transform:rotate(115deg)}}' +
      '.ex-sash{transform-box:fill-box;transform-origin:100% 50%}.st-done .ex-sash{animation:ex-sash 1.4s ease-in-out .2s both}@keyframes ex-sash{to{transform:scaleX(.18)}}' +
      '.ex-bd{opacity:0}.st-done .ex-bd{animation:ex-bd var(--bs) cubic-bezier(.3,.2,.6,1) infinite}' +
      '@keyframes ex-bd{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:1}55%{transform:translate(calc(var(--dx) * .35),calc(var(--dy) * .6)) scale(calc((1 + var(--s)) / 2))}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(var(--s))}}' +
      '.ex-flap{animation:ex-flap .34s ease-in-out infinite alternate}g:nth-child(2n)>.ex-bd>.ex-flap{animation-delay:-.2s}@keyframes ex-flap{to{transform:scaleY(-.5)}}' +
      // Ultra: the fairy lights race.
      '.ultra .ex-fa,.ultra .ex-fb{animation-duration:1.2s}',
    scenery:
      '<defs>' +
      '<linearGradient id="ex-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080c"/><stop offset=".55" stop-color="#0b0d13"/><stop offset="1" stop-color="#0e1118"/></linearGradient>' +
      '<linearGradient id="ex-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0e12"/><stop offset="1" stop-color="#050608"/></linearGradient>' +
      '<linearGradient id="ex-cof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a20"/><stop offset=".4" stop-color="#2e1c10"/><stop offset="1" stop-color="#140c06"/></linearGradient>' +
      '<linearGradient id="ex-shg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc890" stop-opacity=".2"/><stop offset=".6" stop-color="#ffb070" stop-opacity=".06"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ex-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07080c" stop-opacity=".45"/><stop offset="1" stop-color="#07080c" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="ex-moon"><stop offset="0" stop-color="#9cb8ff" stop-opacity=".1"/><stop offset="1" stop-color="#9cb8ff" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ex-wall)"/>' +
      // A cool wash of night on the left wall, behind the towers.
      '<ellipse cx="220" cy="420" rx="420" ry="520" fill="url(#ex-moon)"/>' +
      // The fairy lights.
      `<path d="${wire}" fill="none" stroke="#1e2330" stroke-width="2"/>` +
      `<g class="ex-fa" stroke="#ffcf7a" stroke-linecap="round"><path d="${haloA}" stroke-opacity=".08" stroke-width="22"/><path d="${bulbA}" stroke-opacity=".8" stroke-width="6"/></g>` +
      `<g class="ex-fb" stroke="#9cbcff" stroke-linecap="round"><path d="${haloB}" stroke-opacity=".08" stroke-width="22"/><path d="${bulbB}" stroke-opacity=".75" stroke-width="6"/></g>` +
      // The clock between the towers, and the giant face that looms when a command runs.
      wallClock(215, 262, 58) +
      giantClock(215, 330, 330) +
      `<g class="ex-storm" fill="${PAPER}" fill-opacity=".6">${storm(9, 0.95)}${whirl}</g>` +
      // The towers.
      `<g class="ex-sway" style="transform-origin:82px 960px">${books(s1, 41)}${tent}</g>` +
      `<g class="ex-sway" style="transform-origin:215px 960px;animation-delay:-.5s">${books(s2, 42)}${open}</g>` +
      `<g class="ex-sway" style="transform-origin:350px 960px;animation-delay:-.9s">${books(s3, 43)}` +
      `<g transform="translate(${f(pivot[0])} ${f(pivot[1])})"><g class="ex-top"><g transform="translate(${f(-pivot[0])} ${f(-pivot[1])})">${books(chunk, 44)}${cup}${chunkNote}</g></g></g></g>` +
      stickies +
      '<rect width="440" height="700" fill="url(#ex-dusk)"/>' +
      loose +
      `<g class="ex-storm" fill="${PAPER}" fill-opacity=".88">${storm(13, 1.4)}</g>` +
      // Done: pages lift off the towers and fly away up the wall.
      birds(next, 8, [40, 120, 340, 380], () => [-140 - next() * 260, -300 - next() * 280], 0.6, 3, [0.1, 1.6]) +
      // The floor.
      '<g class="mv-b"><rect y="870" width="1600" height="330" fill="url(#ex-floor)"/><rect y="860" width="1600" height="12" fill="#11141b"/><path d="M0 860H1600" stroke="#1d2230" stroke-width="2"/>' +
      `<path d="M0 902H1600M0 942H1600M0 986H1600${seams}" stroke="#14161d" stroke-width="2"/>` +
      ball(150, 984, 10) + ball(286, 990, 8) + ball(520, 978, 9) +
      '<path d="M436 920H498L490 996H444Z" fill="#10131a" stroke="#262c3a" stroke-width="2"/><path d="M446 924L452 994M458 924L460 994M470 924L468 994M482 924L476 994" stroke="#1d2230" stroke-width="2"/>' +
      ball(456, 916, 9) + ball(474, 912, 8) +
      '<path d="M560 998L612 976L668 990L620 1010Z" fill="#2a3a52" stroke="#06070a"/><path d="M566 996L612 978L660 990" fill="none" stroke="#d6ccb0" stroke-opacity=".4" stroke-width="2"/>' +
      // The coffee wave, its front on the left, rolling in from under the desk.
      '<g class="ex-wave">' +
      '<path d="M-10 1010Q8 890 90 846Q166 806 214 846Q166 838 164 878Q290 836 460 866Q800 904 1700 878V1010Z" fill="url(#ex-cof)"/>' +
      `<g class="ex-crest"><path d="M24 940Q44 878 90 846Q166 806 214 846" fill="none" stroke="#d8b68c" stroke-opacity=".6" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M164 878Q290 836 460 866Q800 904 1700 878" fill="none" stroke="#b08a60" stroke-opacity=".35" stroke-width="3"/>` +
      `<path d="M226 826h0M244 842h0M212 806h0M236 812h0M60 860h0M40 884h0" stroke="#d8b68c" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/></g>` +
      `<path d="${bubbles}" stroke="#d8b68c" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"/></g></g>` +
      // Done: the low dawn light falls through the window across the room.
      '<g class="mv-r"><path class="ex-shaft" d="M1232 80L1232 470L940 1000L560 1000Z" fill="url(#ex-shg)"/></g>',
    nook:
      '<defs>' +
      '<radialGradient id="ex-pool"><stop offset="0" stop-color="#ffd89a" stop-opacity=".2"/><stop offset=".5" stop-color="#ffc878" stop-opacity=".07"/><stop offset="1" stop-color="#ffc878" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ex-warmg"><stop offset="0" stop-color="#ffb878" stop-opacity=".22"/><stop offset="1" stop-color="#ffb878" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ex-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a18"/><stop offset=".7" stop-color="#0d1630"/><stop offset="1" stop-color="#1a2446"/></linearGradient>' +
      '<linearGradient id="ex-dawng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3a78"/><stop offset=".45" stop-color="#8a5a8a"/><stop offset=".8" stop-color="#f0a070"/><stop offset="1" stop-color="#ffd090"/></linearGradient>' +
      '<radialGradient id="ex-sung"><stop offset="0" stop-color="#fff0c0" stop-opacity=".9"/><stop offset=".35" stop-color="#ffc070" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a50" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="ex-wc"><rect x="64" y="-466" width="302" height="362"/></clipPath>' +
      '</defs>' +
      // The lamp's warm pool on the wall, and the dawn's warmth around the window.
      '<circle cx="380" cy="200" r="300" fill="url(#ex-pool)"/>' +
      '<circle class="ex-warm" cx="215" cy="-280" r="400" fill="url(#ex-warmg)"/>' +
      // The window and the sleeping city.
      '<g clip-path="url(#ex-wc)"><rect x="64" y="-466" width="302" height="362" fill="url(#ex-sky)"/>' +
      `<path class="ex-stars" d="${stars}" stroke="#dce6ff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>` +
      '<g class="ex-stars"><circle cx="314" cy="-412" r="34" fill="#9cb8ff" fill-opacity=".08"/><path d="M314 -428A16 16 0 1 0 326 -400A13 13 0 1 1 314 -428Z" fill="#e6ecf8" fill-opacity=".85"/></g>' +
      '<rect class="ex-dawn" x="64" y="-466" width="302" height="362" fill="url(#ex-dawng)"/>' +
      '<g class="ex-sun"><circle cx="150" cy="-104" r="90" fill="url(#ex-sung)"/><circle cx="150" cy="-104" r="26" fill="#ffe6b0"/></g>' +
      `<path d="${far.join('')}" fill="#0e1426"/><path d="M118 -300V-380M112 -330H124" stroke="#0e1426" stroke-width="4"/>` +
      '<circle class="ex-bcn" cx="118" cy="-382" r="3" fill="#ff6a5a"/>' +
      `<path d="${near.join('')}" fill="#05070c"/>` +
      `<g stroke-width="5"><path class="ex-cl" d="${litA}" stroke="#ffcf7a" stroke-opacity=".6"/><path class="ex-cl" d="${litB}" stroke="#a8c4ff" stroke-opacity=".45"/>` +
      `<path class="ex-ctw" d="${litT}" stroke="#ffcf7a" stroke-opacity=".6"/></g>` +
      `<g class="ex-out">${birds(next, 6, [80, -350, 120, 130], () => [170 + next() * 130, -50 - next() * 70], 0.3, 3.4, [0.5, 1.6])}</g>` +
      '<g class="ex-plane"><g transform="translate(40 -380)"><path d="M-10 0H10M-2 0L-6 -6M-2 0L-6 6" stroke="#5a6680" stroke-width="2"/><circle class="ex-nav" cx="10" cy="0" r="2.4" fill="#ff6a5a"/></g></g></g>' +
      // The glass, its two sashes, the frame and the sill.
      '<g fill="#9cb8ff" fill-opacity=".05"><rect x="64" y="-466" width="151" height="362"/></g>' +
      '<path d="M90 -440L130 -440L80 -300ZM100 -260L120 -260L76 -180Z" fill="#fff" fill-opacity=".04"/>' +
      '<g class="ex-sash"><rect x="215" y="-466" width="151" height="362" fill="#9cb8ff" fill-opacity=".05" stroke="#2a3246" stroke-width="5"/>' +
      '<path d="M215 -300H366" stroke="#2a3246" stroke-width="5"/><path d="M250 -440L284 -440L240 -330Z" fill="#fff" fill-opacity=".04"/></g>' +
      '<path d="M64 -300H215M215 -466V-104" stroke="#2a3246" stroke-width="6"/>' +
      '<rect x="57" y="-473" width="316" height="376" fill="none" stroke="#1c2130" stroke-width="14"/>' +
      '<rect x="40" y="-98" width="350" height="14" rx="2" fill="#1c2130" stroke="#2c3346" stroke-width="2"/>' +
      // A small plant on the sill.
      '<path d="M318 -98L322 -120H346L350 -98Z" fill="#3a2a22"/><path d="M334 -120C326 -140 316 -146 308 -146C318 -138 324 -130 330 -120M334 -120C336 -144 346 -152 356 -150C346 -142 340 -132 336 -120" fill="#2f5a3a"/>' +
      // The curtains, stirring, on their rod.
      '<path d="M8 -500H424" stroke="#262c3a" stroke-width="6" stroke-linecap="round"/>' +
      `<path class="ex-cur" d="M10 -498H70C74 -380 62 -240 78 -64H40C26 -200 18 -360 10 -498Z" fill="#1a2236" stroke="#26304a" stroke-width="2"/>` +
      `<path class="ex-cur" style="animation-delay:-3s" d="M362 -498H422C416 -360 410 -200 414 -64H372C380 -240 360 -380 362 -498Z" fill="#1a2236" stroke="#26304a" stroke-width="2"/>` +
      '<path d="M30 -480C34 -340 30 -200 50 -70M392 -480C388 -340 392 -200 396 -70" fill="none" stroke="#0e1320" stroke-width="3"/>' +
      // Sticky notes on the wall under the window, and a study sheet pinned up for the highlighter.
      note(next, 92, -46, 26, -7, pick(NOTES, 0), 'ex-wn') +
      note(next, 124, -10, 22, 9, pick(NOTES, 1), 'ex-wn', 'animation-delay:-1.2s') +
      note(next, 258, -54, 24, 5, pick(NOTES, 2), 'ex-wn', 'animation-delay:-2.1s') +
      note(next, 66, 22, 22, -12, pick(NOTES, 3), 'ex-wn', 'animation-delay:-.6s') +
      '<g transform="translate(150 -66) rotate(-3)"><g class="ex-wn" style="animation-delay:-3s">' +
      `<rect width="80" height="100" fill="${PAPER}" fill-opacity=".7"/><circle cx="40" cy="4" r="3.4" fill="#d8584a"/>` +
      `<path d="${marks(next, 8, 16, 64, 7, 11)}" fill="none" stroke="#3a3628" stroke-opacity=".6" stroke-width="1.3"/>` +
      ['M8 26H66', 'M8 56H58', 'M8 86H70']
        .map((d, i) => `<path class="ex-hl" pathLength="1" style="--d:${g2(0.1 + i * 0.3)}s" d="${d}" stroke="${i === 1 ? '#7ad6ff' : '#f2e35a'}" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>`)
        .join('') +
      '</g></g>' +
      // The calendar: a month of days crossed off up to the exam, which is ringed.
      '<g transform="translate(290 -40)"><rect width="112" height="136" fill="#d9d4c6" fill-opacity=".6"/><rect width="112" height="24" fill="#3b4f80"/>' +
      '<circle cx="20" cy="0" r="3" fill="#0e1118"/><circle cx="92" cy="0" r="3" fill="#0e1118"/>' +
      '<path d="M8 12h14m4 0h6v-3m6 3h10" stroke="#dfe6f5" stroke-opacity=".7" stroke-width="2" fill="none"/>' +
      `<path d="${Array.from({ length: 6 }, (_, i) => `M4 ${32 + i * 17}H108`).join('')}${Array.from({ length: 8 }, (_, i) => `M${4 + i * 14.85} 32V117`).join('')}" stroke="#4a4a52" stroke-opacity=".5"/>` +
      `<path d="${Array.from({ length: 16 }, (_, i) => {
        const cx = 4 + (i % 7) * 14.85 + 7.4
        const cy = 32 + Math.floor(i / 7) * 17 + 8.5

        return `M${f(cx - 4.5)} ${f(cy - 5)}L${f(cx + 4.5)} ${f(cy + 5)}M${f(cx + 4.5)} ${f(cy - 5)}L${f(cx - 4.5)} ${f(cy + 5)}`
      }).join('')}" stroke="#c84a40" stroke-opacity=".75" stroke-width="2"/>` +
      [16, 17, 18, 19]
        .map((i, k) => {
          const cx = 4 + (i % 7) * 14.85 + 7.4
          const cy = 32 + Math.floor(i / 7) * 17 + 8.5

          return `<path class="ex-xn" pathLength="1" style="--d:${g2(0.15 + k * 0.45)}s" d="M${f(cx - 4.5)} ${f(cy - 5)}L${f(cx + 4.5)} ${f(cy + 5)}M${f(cx + 4.5)} ${f(cy - 5)}L${f(cx - 4.5)} ${f(cy + 5)}" stroke="#c84a40" stroke-width="2"/>`
        })
        .join('') +
      `<ellipse cx="${f(4 + 3 * 14.85 + 7.4)}" cy="${f(32 + 3 * 17 + 8.5)}" rx="11" ry="10" fill="none" stroke="#e8584a" stroke-width="2.6"/></g>` +
      // A moth circling the lamp.
      '<g transform="translate(378 150) scale(1 .5)"><g class="ex-moth"><g transform="translate(34 0) scale(1 2)"><g class="ex-mw"><path d="M0 0L-6 -5L-7 2ZM0 0L6 -5L7 2Z" fill="#b8b0a0" fill-opacity=".8"/></g></g></g></g>' +
      // Done: pages lift off the desk and fly out through the window.
      birds(next, 8, [290, 120, 120, 170], (x, y) => [215 - x + (next() - 0.5) * 140, -300 - y + (next() - 0.5) * 80], 0.25, 2.8, [0.15, 1.6]),
  }
}
