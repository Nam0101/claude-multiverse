import { f, rain, random } from './kit'
import { U, X0, Y0, cell } from './rig'
import type { World } from './world'

// NEON 2099: a street hacker on a stool at a noodle-bar counter, a neon megacity at night behind: towers with lit
// windows, giant vertical glyph signs, flying cars in lanes, pink acid rain and a wet street underneath.

const PINK = '#ff3ea5'
const CYAN = '#29e3ff'
const MINT = '#3dffd0'
const RED = '#ff4a55'

const at = (list: readonly string[], index: number): string => list[index % list.length] ?? PINK

type Layer = {
  seed: number
  base: number
  fill: string
  min: number
  max: number
  widths: [number, number]
  density: number
  colors: readonly string[]
  edge?: string
}

/** A row of towers: taller toward the edges so the middle (the chat) stays low and dark. */
function skyline(layer: Layer): { shapes: string; windows: string } {
  const next = random(layer.seed)
  const shapes: string[] = []
  const wins = layer.colors.map(() => '')

  for (let x = -20; x < 1620; ) {
    const w = layer.widths[0] + next() * (layer.widths[1] - layer.widths[0])
    const edge = Math.abs(x + w / 2 - 800) / 800
    const lift = 0.3 + 0.7 * Math.min(1, Math.max(0, (edge - 0.3) / 0.45))
    const h = (layer.min + next() * (layer.max - layer.min)) * lift
    const top = layer.base - h

    shapes.push(
      `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(h + 4)}" fill="${layer.fill}"` +
        (layer.edge === undefined ? '' : ` stroke="${layer.edge}" stroke-opacity=".2" stroke-width="1.2"`) +
        '/>',
    )

    if (next() > 0.62) {
      shapes.push(`<path d="M${f(x + w * 0.5)} ${f(top)}V${f(top - 24 - next() * 50)}" stroke="${layer.fill}" stroke-width="3"/>`)
    }

    for (let wy = top + 12; wy < layer.base - 40; wy += 16) {
      for (let wx = x + 7; wx < x + w - 9; wx += 12) {
        if (next() < layer.density) {
          const slot = Math.floor(next() * layer.colors.length)
          wins[slot] = `${wins[slot] ?? ''}M${f(wx)} ${f(wy)}h4v6h-4z`
        }
      }
    }

    x += w + 2 + next() * 6
  }

  return {
    shapes: shapes.join(''),
    windows: layer.colors
      .map(
        (color, slot) =>
          `<path class="ne-wk ne-w${slot}" d="${wins[slot] ?? ''}" fill="${color}" fill-opacity="${slot === 0 ? 0.75 : 0.6}"/>`,
      )
      .join(''),
  }
}

/** One abstract glyph (never a letter) in a box of side `s` centred at (cx, cy), as path data. */
function glyph(kind: number, cx: number, cy: number, s: number): string {
  const r = s / 2
  const a = (rx: number) => `a${f(rx)} ${f(rx)} 0 1 0`

  switch (kind % 9) {
    case 0:
      return `M${f(cx + r)} ${f(cy)}${a(r)} ${f(-s)} 0${a(r)} ${f(s)} 0z`
    case 1:
      return `M${f(cx - r)} ${f(cy - r)}h${f(s)}v${f(s)}h${f(-s)}z`
    case 2:
      return `M${f(cx)} ${f(cy - r)}v${f(s)}M${f(cx - r)} ${f(cy)}h${f(s)}`
    case 3:
      return `M${f(cx + r * 0.3)} ${f(cy - r)}L${f(cx - r * 0.5)} ${f(cy + r * 0.1)}h${f(r * 0.9)}L${f(cx - r * 0.3)} ${f(cy + r)}`
    case 4:
      return `M${f(cx - r)} ${f(cy - r * 0.7)}h${f(s)}M${f(cx - r)} ${f(cy)}h${f(s * 0.7)}M${f(cx - r)} ${f(cy + r * 0.7)}h${f(s)}`
    case 5:
      return `M${f(cx)} ${f(cy - r)}L${f(cx + r)} ${f(cy + r)}H${f(cx - r)}z`
    case 6:
      return `M${f(cx - r)} ${f(cy + r * 0.4)}a${f(r)} ${f(r)} 0 0 1 ${f(s)} 0M${f(cx - r)} ${f(cy + r * 0.8)}h${f(s)}`
    case 7:
      return `M${f(cx)} ${f(cy - r)}L${f(cx + r)} ${f(cy)}L${f(cx)} ${f(cy + r)}L${f(cx - r)} ${f(cy)}z`
    default:
      return `M${f(cx - r)} ${f(cy - r)}h${f(s * 0.7)}a${f(r * 0.5)} ${f(r * 0.5)} 0 0 1 0 ${f(s * 0.5)}h${f(-s * 0.4)}v${f(s * 0.5)}`
  }
}

type Sign = { x: number; y: number; w: number; h: number; color: string; seed: number; hum: number; right: boolean }

const SIGNS: readonly Sign[] = [
  { x: 64, y: 130, w: 72, h: 470, color: PINK, seed: 11, hum: 0, right: false },
  { x: 188, y: 250, w: 60, h: 380, color: CYAN, seed: 12, hum: 1, right: false },
  { x: 296, y: 90, w: 54, h: 290, color: PINK, seed: 13, hum: 2, right: false },
  { x: 1486, y: 70, w: 74, h: 520, color: CYAN, seed: 14, hum: 1, right: true },
  { x: 1372, y: 190, w: 58, h: 360, color: PINK, seed: 15, hum: 2, right: true },
  { x: 1262, y: 40, w: 52, h: 270, color: CYAN, seed: 16, hum: 0, right: true },
]

function signMarkup(s: Sign): string {
  const next = random(s.seed)
  const cx = s.x + s.w / 2
  const slots = Math.max(2, Math.floor(s.h / (s.w * 1.15)))
  const size = s.w * 0.44
  let d = ''

  for (let slot = 0; slot < slots; slot += 1) {
    d += glyph(Math.floor(next() * 9), cx, s.y + (s.h / slots) * (slot + 0.5), size)
  }

  return (
    `<g class="ne-sg ne-h${s.hum}" style="color:${s.color}">` +
    `<rect x="${s.x - 16}" y="${s.y - 16}" width="${s.w + 32}" height="${s.h + 32}" rx="20" fill="currentColor" fill-opacity=".06"/>` +
    `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="10" fill="#0a0614" fill-opacity=".6" stroke="currentColor" stroke-width="5" stroke-opacity=".9"/>` +
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".95"/>` +
    `<rect x="${f(cx - 3)}" y="${s.y + s.h}" width="6" height="30" fill="#2a1c3a"/></g>`
  )
}

type Board = { x: number; y: number; w: number; h: number; color: string; right: boolean }

const BOARDS: readonly Board[] = [
  { x: 36, y: 690, w: 250, h: 110, color: CYAN, right: false },
  { x: 1226, y: 650, w: 220, h: 96, color: PINK, right: true },
]

function boardMarkup(b: Board): string {
  const cx = b.x + b.w * 0.28
  const cy = b.y + b.h / 2

  return (
    `<g class="ne-sg ne-h1" style="color:${b.color}">` +
    `<rect x="${b.x - 10}" y="${b.y - 10}" width="${b.w + 20}" height="${b.h + 20}" rx="12" fill="currentColor" fill-opacity=".06"/>` +
    `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="#0a0614" fill-opacity=".7" stroke="currentColor" stroke-width="4" stroke-opacity=".85"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(b.h * 0.3)}" fill="none" stroke="currentColor" stroke-width="4"/>` +
    `<path d="M${f(cx)} ${f(cy - b.h * 0.12)}v${f(b.h * 0.24)}M${f(b.x + b.w * 0.5)} ${f(b.y + b.h * 0.3)}h${f(b.w * 0.38)}M${f(b.x + b.w * 0.5)} ${f(b.y + b.h * 0.5)}h${f(b.w * 0.26)}` +
    `M${f(b.x + b.w * 0.5)} ${f(b.y + b.h * 0.7)}h${f(b.w * 0.34)}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-opacity=".9"/></g>`
  )
}

function car(y: number, size: number, dir: 1 | -1, seconds: number, delay: number, color: string): string {
  const flip = dir === 1 ? '' : ' transform="scale(-1 1)"'

  return (
    `<g transform="translate(0 ${y})"><g class="ne-car${dir === 1 ? '' : ' ne-carL'}" style="animation-duration:${seconds}s;animation-delay:${-delay}s">` +
    `<g${flip}><g transform="scale(${size})">` +
    `<rect x="-120" y="1.5" width="120" height="3" fill="url(#${color === PINK ? 'ne-tp' : 'ne-tc'})"/>` +
    `<path d="M0 0h16l6 3.5-2 2.5h-20z" fill="#1c1228" stroke="${color}" stroke-width="1.2"/>` +
    `<circle cx="21" cy="4" r="1.8" fill="#ffffff"/></g></g></g></g>`
  )
}

function glitchSlices(): string {
  const next = random(404)
  const slices: string[] = []
  const targets = [
    ...SIGNS.map(s => ({ x: s.x - 6, y: s.y, w: s.w + 12, h: s.h, right: s.right })),
    ...BOARDS.map(b => ({ x: b.x - 4, y: b.y, w: b.w + 8, h: b.h, right: b.right })),
  ]

  targets.forEach((t, index) => {
    for (let k = 0; k < 2; k += 1) {
      const y = t.y + next() * (t.h - 14)
      const slice =
        `<rect class="ne-gs" style="animation-delay:${-(k * 0.95 + (index % 2) * 0.35)}s" x="${f(t.x - next() * 14)}" y="${f(y)}" ` +
        `width="${f(t.w + next() * 40)}" height="${f(3 + next() * 9)}" fill="${k === 0 ? RED : '#ffd0d8'}"/>`

      slices.push(t.right ? `<g class="mv-r">${slice}</g>` : slice)
    }
  })

  return slices.join('')
}

export function neonWorld(): World {
  const next = random(2099)
  const far = skyline({ seed: 1, base: 930, fill: '#120a20', min: 260, max: 620, widths: [50, 100], density: 0.08, colors: [PINK, CYAN, '#ffd08a'] })
  const mid = skyline({ seed: 2, base: 950, fill: '#170c28', min: 280, max: 700, widths: [60, 110], density: 0.1, colors: [CYAN, PINK, '#ffd08a'] })
  const near = skyline({ seed: 3, base: 970, fill: '#0e0718', min: 320, max: 800, widths: [70, 130], density: 0.07, colors: [PINK, CYAN], edge: PINK })

  const leftSigns = SIGNS.filter(s => !s.right).map(signMarkup).join('')
  const rightSigns = `<g class="mv-r">${SIGNS.filter(s => s.right).map(signMarkup).join('')}</g>`
  const boards = BOARDS.map(b => (b.right ? `<g class="mv-r">${boardMarkup(b)}</g>` : boardMarkup(b))).join('')

  // The done pulse: a green-cyan outline over each sign, lit once and left glowing.
  const doneRing = (x: number, y: number, w: number, h: number, rx: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${MINT}" stroke-width="6"/>`
  const done =
    `<g class="ne-dn">${SIGNS.filter(s => !s.right).map(s => doneRing(s.x, s.y, s.w, s.h, 10)).join('')}${BOARDS.filter(b => !b.right).map(b => doneRing(b.x, b.y, b.w, b.h, 6)).join('')}</g>` +
    `<g class="mv-r"><g class="ne-dn">${SIGNS.filter(s => s.right).map(s => doneRing(s.x, s.y, s.w, s.h, 10)).join('')}${BOARDS.filter(b => b.right).map(b => doneRing(b.x, b.y, b.w, b.h, 6)).join('')}</g></g>`

  const lanes: [number, number, 1 | -1, number, number, string][] = [
    [120, 1.2, 1, 34, 6, CYAN],
    [196, 0.9, -1, 41, 20, PINK],
    [292, 1.5, 1, 27, 14, PINK],
    [388, 1, -1, 36, 3, CYAN],
    [470, 1.7, 1, 24, 18, CYAN],
    [560, 1.1, -1, 31, 9, PINK],
    [650, 1.4, 1, 29, 22, PINK],
  ]

  const motes: string[] = []

  for (let index = 0; index < 28; index += 1) {
    const side = next()
    const x = side < 0.45 ? 10 + next() * 400 : side < 0.9 ? 1190 + next() * 400 : 430 + next() * 740
    const seconds = 3.6 + next() * 3

    motes.push(
      `<circle class="ne-mote" style="animation-duration:${f(seconds)}s;animation-delay:${f(-next() * seconds)}s" cx="${f(x)}" cy="${f(640 + next() * 260)}" r="${f(1.2 + next() * 1.6)}" fill="${next() > 0.5 ? CYAN : PINK}"/>`,
    )
  }

  const streams: string[] = []

  for (let index = 0; index < 30; index += 1) {
    const left = index % 2 === 0
    const x = left ? 8 + next() * 410 : 1196 + next() * 390
    const y1 = 120 + next() * 240
    const y2 = y1 + 380 + next() * 320
    const seconds = 0.9 + next() * 1.1
    const line =
      `<line class="ne-str" style="animation-duration:${f(seconds)}s;animation-delay:${f(-next() * seconds)}s" x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2)}" ` +
      `stroke="${at([CYAN, PINK, MINT], index)}" stroke-width="${f(1.4 + next() * 1.2)}"/>`

    streams.push(left ? line : `<g class="mv-r">${line}</g>`)
  }

  const ripples: string[] = []

  for (let index = 0; index < 12; index += 1) {
    ripples.push(
      `<line class="ne-rp" style="animation-delay:${f(-next() * 6)}s" x1="${f(next() * 1500)}" y1="${f(912 + index * 8)}" x2="${f(60 + next() * 1500)}" y2="${f(912 + index * 8)}" ` +
        `stroke="${index % 2 === 0 ? PINK : CYAN}" stroke-opacity="${f(0.1 + next() * 0.14)}" stroke-width="2"/>`,
    )
  }

  const reflect = (s: Sign) =>
    `<rect class="ne-rf" style="animation-delay:${f(-s.hum * 1.3)}s" x="${s.x}" y="905" width="${s.w}" height="95" fill="url(#${s.color === PINK ? 'ne-rp' : 'ne-rc'})"/>`

  const ticker = (y: number, h: number, dash: string, color: string, seconds: number) =>
    `<line class="ne-tkl" style="animation-duration:${seconds}s;--len:${dash.split(' ').reduce((sum, n) => sum + Number(n), 0)}" x1="-60" y1="${y}" x2="1660" y2="${y}" stroke="${color}" stroke-width="${h}" stroke-dasharray="${dash}"/>`

  return {
    rig: {
      head: 'none',
      seat: 'stool',
      table: 'desk',
      machine: 'holo',
      cup: 'none',
      thought: 'bits',
      ink: '#05030a',
      furniture: '#1c1228',
      metal: '#2a1c3a',
      paper: '#f0dcff',
      light: { idle: '#8a3a9f', work: PINK, bright: '#ff9ad5' },
      headTop: Y0,
      glowAt: [352, 252],
      wear: {
        // The cable from the back of the neck runs down and trails along the floor to its plug.
        behind:
          `<path class="ne-cab" d="M${X0 + 2.4 * U} ${Y0 + 2.5 * U}C${X0 - 1.2 * U} ${Y0 + 2.5 * U} ${X0 - 2.6 * U} ${Y0 + 8 * U} ${X0 - 3 * U} ${Y0 + 12.4 * U}Q${X0 - 3.3 * U} ${Y0 + 13.6 * U} ${X0 - 5.2 * U} ${Y0 + 13.5 * U}" ` +
          `fill="none" stroke="#2a1c3a" stroke-width="6" stroke-linecap="round"/>` +
          `<path class="ne-cab" d="M${X0 + 2.4 * U} ${Y0 + 2.5 * U}C${X0 - 1.2 * U} ${Y0 + 2.5 * U} ${X0 - 2.6 * U} ${Y0 + 8 * U} ${X0 - 3 * U} ${Y0 + 12.4 * U}Q${X0 - 3.3 * U} ${Y0 + 13.6 * U} ${X0 - 5.2 * U} ${Y0 + 13.5 * U}" ` +
          `fill="none" stroke="${PINK}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 14" stroke-linecap="round"/>` +
          `<rect x="${X0 - 5.2 * U - 12}" y="${Y0 + 13.5 * U - 5}" width="14" height="10" rx="2" fill="#3a2650"/>` +
          `<rect class="ne-led" x="${X0 - 5.2 * U - 8}" y="${Y0 + 13.5 * U - 2}" width="5" height="4" fill="${PINK}"/>`,
        front:
          // The jack in the back of the head, then the visor: a translucent band the eyes show through.
          `<g fill="#3a2650">${cell(1.35, 1.9, 0.75, 1.4)}</g><g fill="${PINK}">${cell(1.5, 2.3, 0.3, 0.3, ' class="ne-led"')}</g>` +
          `<defs><linearGradient id="ne-vz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${PINK}" stop-opacity=".42"/>` +
          `<stop offset="1" stop-color="${CYAN}" stop-opacity=".42"/></linearGradient></defs>` +
          `<rect x="${f(X0 + 1.5 * U)}" y="${f(Y0 + 1.05 * U)}" width="${f(11 * U)}" height="${f(3.1 * U)}" rx="9" fill="url(#ne-vz)"/>` +
          `<rect x="${f(X0 + 1.5 * U)}" y="${f(Y0 + 1.05 * U)}" width="${f(11 * U)}" height="2.5" fill="${PINK}" fill-opacity=".9"/>` +
          `<rect x="${f(X0 + 1.5 * U)}" y="${f(Y0 + 4.1 * U)}" width="${f(11 * U)}" height="2.5" fill="${CYAN}" fill-opacity=".9"/>` +
          `<path d="M${f(X0 + 8.4 * U)} ${f(Y0 + 1.3 * U)}l${U * 1.2} 0l-${U * 0.9} ${U * 2.7}h-${U * 0.7}z" fill="#ffffff" fill-opacity=".14"/>`,
      },
      seatArt:
        `<g fill="#1c1228"><rect x="110" y="349" width="82" height="12" rx="6"/><rect x="146" y="361" width="10" height="84"/>` +
        `<ellipse cx="151" cy="450" rx="42" ry="6"/></g>` +
        `<ellipse cx="151" cy="410" rx="28" ry="4" fill="none" stroke="#2a1c3a" stroke-width="4"/>` +
        `<line x1="116" y1="360" x2="186" y2="360" stroke="${PINK}" stroke-opacity=".7" stroke-width="2"/>`,
      tableArt:
        // A noodle-bar counter: neon lip, a stencilled glyph panel, a steaming bowl and chopsticks at the far end.
        `<path d="M166 330H470V456H190Z" fill="#1c1228"/>` +
        `<rect x="166" y="330" width="304" height="8" rx="2" fill="#2a1c3a"/>` +
        `<line x1="168" y1="339" x2="468" y2="339" stroke="${PINK}" stroke-width="2.5" stroke-opacity=".85"/>` +
        `<g fill="none" stroke="${CYAN}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round">` +
        `<path d="${glyph(0, 250, 394, 34)}"/><path d="${glyph(4, 320, 394, 34)}"/><path d="${glyph(7, 390, 394, 34)}"/></g>` +
        `<path d="M424 322h40q-3 14-20 14t-20-14z" fill="#2a1c3a"/><path d="M424 322q20-14 40 0" fill="#f0dcff" fill-opacity=".55"/>` +
        `<line x1="440" y1="312" x2="470" y2="296" stroke="#f0dcff" stroke-opacity=".7" stroke-width="2"/><line x1="446" y1="314" x2="474" y2="302" stroke="#f0dcff" stroke-opacity=".7" stroke-width="2"/>` +
        `<path class="ne-steam" d="M436 308q-6-10 0-18q6-8 0-16" fill="none" stroke="#f0dcff" stroke-opacity=".4" stroke-width="2.5"/>` +
        `<path class="ne-steam" style="animation-delay:-1.4s" d="M452 306q-6-10 0-18q6-8 0-16" fill="none" stroke="#f0dcff" stroke-opacity=".4" stroke-width="2.5"/>`,
      device: (light, activity) => {
        const working = activity === 'responding' || activity === 'tool' || activity === 'run' || activity === 'web'
        const rows = [0, 1, 2, 3, 4]
          .map(row => {
            const width = [74, 52, 88, 40, 64][row] ?? 60
            const x = 312 + (row === 1 || row === 3 ? 12 : 0)

            return `<rect class="${working ? 'ne-ln' : ''}" style="animation-delay:${f(-row * 0.37)}s" x="${x}" y="${228 + row * 11}" width="${width}" height="4" rx="2" fill="${light}" fill-opacity=".75"/>`
          })
          .join('')
        const body =
          activity === 'error'
            ? `<path d="M330 232l56 48M386 232l-56 48" stroke="${light}" stroke-width="5" stroke-linecap="round"/>`
            : activity === 'done'
              ? `<path d="M332 262l16 16l38-44" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
              : activity === 'thinking'
                ? `<g fill="${light}">${[0, 1, 2].map(k => `<circle class="ne-dot" style="animation-delay:${f(-k * 0.3)}s" cx="${338 + k * 22}" cy="258" r="5"/>`).join('')}</g>`
                : rows

        return (
          `<polygon points="318,318 336,318 410,292 302,292" fill="${light}" fill-opacity=".1"/>` +
          `<rect x="246" y="318" width="92" height="12" rx="3" fill="#2a1c3a"/>` +
          `<g fill="${light}" fill-opacity=".75">${[254, 264, 274, 284, 294, 304, 314, 324].map(x => `<rect x="${x}" y="321" width="6" height="3"/>`).join('')}</g>` +
          `<g class="ne-float"><rect x="300" y="212" width="112" height="82" rx="6" fill="${light}" fill-opacity=".13" stroke="${light}" stroke-opacity=".8" stroke-width="2"/>` +
          `<rect x="300" y="212" width="112" height="9" rx="4" fill="${light}" fill-opacity=".4"/>${body}</g>`
        )
      },
    },
    style:
      '.ne-sg{animation:ne-hum 4.2s ease-in-out infinite alternate}.ne-h1{animation-delay:-1.4s}.ne-h2{animation-delay:-2.7s}' +
      '@keyframes ne-hum{from{opacity:.78}to{opacity:1}}' +
      '.st-responding .ne-sg{animation-duration:2.1s}' +
      '.st-tool .ne-sg{animation:ne-flk 1.9s ease-in-out infinite}' +
      '@keyframes ne-flk{0%,100%{opacity:1}7%{opacity:.6}14%{opacity:1}56%{opacity:.88}63%{opacity:.68}70%{opacity:1}}' +
      '.st-error .ne-sg{color:' + RED + '!important;animation:none;opacity:.9}' +
      '.ne-wk{animation:ne-wk 7s ease-in-out infinite alternate}.ne-w1{animation-duration:9s;animation-delay:-3s}.ne-w2{animation-duration:11s;animation-delay:-6s}' +
      '@keyframes ne-wk{from{opacity:.55}to{opacity:1}}' +
      '.ne-car{animation:ne-fly 30s linear infinite}.ne-carL{animation-name:ne-flyL}' +
      '@keyframes ne-fly{from{transform:translateX(-300px)}to{transform:translateX(1900px)}}' +
      '@keyframes ne-flyL{from{transform:translateX(1900px)}to{transform:translateX(-300px)}}' +
      '.ne-rf{animation:ne-rf 5s ease-in-out infinite alternate}@keyframes ne-rf{from{opacity:.35;transform:translateX(-3px)}to{opacity:.8;transform:translateX(3px)}}' +
      '.ne-rp{animation:ne-rp 6s ease-in-out infinite alternate}@keyframes ne-rp{from{transform:translateX(-22px)}to{transform:translateX(22px)}}' +
      '.ne-mote{opacity:0}.st-thinking .ne-mote,.st-responding .ne-mote{animation:ne-rise 4.6s ease-out infinite}' +
      '.st-responding .ne-mote{animation-name:ne-rise2}' +
      '@keyframes ne-rise{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(-420px)}}' +
      '@keyframes ne-rise2{0%{opacity:0;transform:translateY(0)}15%{opacity:.4}100%{opacity:0;transform:translateY(-240px)}}' +
      '.ne-tk{opacity:0}.st-read .ne-tk{opacity:1}' +
      '.ne-tkl{animation:ne-tk 2.4s linear infinite}@keyframes ne-tk{to{stroke-dashoffset:calc(var(--len) * -1)}}' +
      '.ne-str{opacity:0;stroke-dasharray:2 14 8 30 2 60;stroke-linecap:round}' +
      '.st-run .ne-str{opacity:.8;animation:ne-str 1.2s linear infinite}' +
      '@keyframes ne-str{to{stroke-dashoffset:-116}}' +
      '.ne-web{opacity:0}.st-web .ne-web{opacity:1}.st-web .ne-beam{animation:ne-beam 1.8s ease-in-out infinite alternate}' +
      '@keyframes ne-beam{from{opacity:.45}to{opacity:1}}' +
      '.ne-ring{transform-box:fill-box;transform-origin:center;opacity:0}.st-web .ne-ring{animation:ne-ring 2.4s ease-out infinite}' +
      '@keyframes ne-ring{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(4.5)}}' +
      '.ne-gs{opacity:0}.st-error .ne-gs{animation:ne-gs 1.9s ease-in-out infinite}' +
      '@keyframes ne-gs{0%,100%{opacity:0;transform:translateX(0)}8%{opacity:.5;transform:translateX(8px)}16%{opacity:0}52%{opacity:.4;transform:translateX(-10px)}60%{opacity:0}}' +
      '.ne-dn{opacity:0}.st-done .ne-dn{animation:ne-dn 3s ease-out both}' +
      '@keyframes ne-dn{0%{opacity:0}22%{opacity:.85}100%{opacity:.32}}' +
      '.ne-cab{stroke-dashoffset:0;animation:ne-cab 1.6s linear infinite}@keyframes ne-cab{to{stroke-dashoffset:-34}}' +
      '.ne-led{animation:ne-led 2.2s ease-in-out infinite alternate}@keyframes ne-led{from{opacity:.4}to{opacity:1}}' +
      '.ne-float{animation:ne-float 4s ease-in-out infinite alternate}@keyframes ne-float{to{transform:translateY(-5px)}}' +
      '.ne-ln{transform-box:fill-box;transform-origin:left;animation:ne-ln 1.1s ease-in-out infinite alternate}' +
      '@keyframes ne-ln{from{transform:scaleX(.45)}to{transform:scaleX(1)}}' +
      '.ne-dot{animation:ne-dot 1s ease-in-out infinite alternate}@keyframes ne-dot{from{opacity:.25}to{opacity:1}}' +
      '.ne-steam{animation:ne-steam 3s ease-out infinite}@keyframes ne-steam{0%{opacity:0;transform:translateY(6px)}40%{opacity:1}100%{opacity:0;transform:translateY(-12px)}}',
    scenery:
      '<defs><linearGradient id="ne-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0614"/><stop offset=".6" stop-color="#150a26"/><stop offset="1" stop-color="#2a0f3a"/></linearGradient>' +
      '<linearGradient id="ne-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3ea5" stop-opacity="0"/><stop offset="1" stop-color="#ff3ea5" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="ne-tp" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ff3ea5" stop-opacity=".9"/><stop offset="1" stop-color="#ff3ea5" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ne-tc" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#29e3ff" stop-opacity=".9"/><stop offset="1" stop-color="#29e3ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ne-rp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3ea5" stop-opacity=".5"/><stop offset="1" stop-color="#ff3ea5" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ne-rc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#29e3ff" stop-opacity=".5"/><stop offset="1" stop-color="#29e3ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ne-bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#29e3ff" stop-opacity=".5"/><stop offset="1" stop-color="#29e3ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ne-bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c3a"/><stop offset="1" stop-color="#0b0614"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#ne-bg)"/>' +
      far.shapes +
      far.windows +
      '<rect y="600" width="1600" height="340" fill="url(#ne-haze)"/>' +
      mid.shapes +
      mid.windows +
      near.shapes +
      // A rooftop tower for the dish.
      '<rect x="226" y="330" width="116" height="640" fill="#0e0718" stroke="#ff3ea5" stroke-opacity=".2" stroke-width="1.2"/>' +
      near.windows +
      leftSigns +
      rightSigns +
      boards +
      // The dish on the roof; its beams and rings only come out while Claude searches the web.
      '<g transform="translate(284 330)"><rect x="-3" y="-34" width="6" height="34" fill="#2a1c3a"/><g transform="translate(0 -34) rotate(-38)">' +
      '<path d="M-24 -4Q0 22 24 -4z" fill="#2a1c3a" stroke="#29e3ff" stroke-opacity=".6" stroke-width="2"/><line x1="0" y1="8" x2="0" y2="-22" stroke="#29e3ff" stroke-opacity=".7" stroke-width="2"/></g>' +
      '<g class="ne-web" transform="translate(0 -34) rotate(-38)"><g class="ne-beam"><polygon points="0,-8 1100,-190 1100,150 0,8" fill="url(#ne-bm)" fill-opacity=".55"/></g>' +
      '<g transform="translate(0 -22)" fill="none" stroke="#29e3ff" stroke-width="2.5"><circle class="ne-ring" r="22"/><circle class="ne-ring" style="animation-delay:-.8s" r="22"/><circle class="ne-ring" style="animation-delay:-1.6s" r="22"/></g></g></g>' +
      `<g class="ne-flyers">${lanes.map(lane => car(...lane)).join('')}</g>` +
      done +
      `<g class="ne-str-g">${streams.join('')}</g>` +
      `<g>${motes.join('')}</g>` +
      '<g class="ne-tk"><rect x="-10" y="26" width="1620" height="52" fill="#29e3ff" fill-opacity=".05"/>' +
      ticker(44, 9, '34 8 12 8 6 8 60 12 20 8 8 8', CYAN, 2.6) +
      ticker(62, 5, '10 6 40 6 4 6 22 10 14 6', PINK, 3.6) +
      '</g>' +
      rain({ seed: 2099, count: 40, length: [22, 50], slant: 140, seconds: 1.15, stroke: '#ff7ac8', opacity: 0.32 }) +
      rain({ seed: 2098, count: 16, length: [14, 28], slant: 140, seconds: 1.9, stroke: '#ff9ad5', opacity: 0.16 }) +
      glitchSlices() +
      '<g class="mv-b"><rect y="900" width="1600" height="220" fill="url(#ne-bl)"/>' +
      '<line x1="0" y1="902" x2="1600" y2="902" stroke="#ff3ea5" stroke-opacity=".25" stroke-width="2"/>' +
      `${SIGNS.filter(s => !s.right).map(reflect).join('')}<g class="mv-r">${SIGNS.filter(s => s.right).map(reflect).join('')}</g>` +
      ripples.join('') +
      '</g>',
    nook:
      // The counter's awning with a hanging bowl sign, over the desk.
      '<rect x="96" y="96" width="350" height="16" rx="3" fill="#1c1228"/>' +
      `<line x1="98" y1="114" x2="444" y2="114" stroke="${PINK}" stroke-width="3" stroke-opacity=".85"/>` +
      '<rect x="420" y="96" width="10" height="236" fill="#1c1228"/>' +
      `<g class="ne-sg ne-h2" style="color:${CYAN}"><path d="M330 138h60q-4 24-30 24t-30-24z" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>` +
      '<path d="M338 128q6-8 12 0t12 0t12 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></g>' +
      `<circle cx="150" cy="142" r="14" fill="${PINK}" fill-opacity=".55"/><circle cx="150" cy="142" r="44" fill="${PINK}" fill-opacity=".08"/><line x1="150" y1="114" x2="150" y2="128" stroke="#2a1c3a" stroke-width="3"/>`,
    front: '',
  }
}
