import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Paper World: a cut-paper night diorama. Layered paper hills throw soft shadows on the layer behind; a paper crescent
// moon and folded stars hang on strings; scalloped clouds drift; a windmill turns over a paper village on the right;
// a giant pop-up book lies open on the left. Claude wears a folded newspaper hat at a cardboard desk with a pinwheel.
// A command turns the page and a castle pops up out of the book; an error tears the sky, the moon's string snaps and
// it falls, and a cloud crumples into a ball; done sends a flock of paper cranes up out of the book and off the tree.
const RED = '#d9534f'
const RED_DARK = '#9a3532'
const CREAM = '#d6c7a2'
const CREAM_DARK = '#a8966f'
const KRAFT = '#6e5538'
const KRAFT_DARK = '#4a3826'
const EDGE = '#2a1e14'
const SHADE = '#020208'
const STRING = '#9a8b70'

/** Whole numbers, for the long hand-cut paths. */
const n = (v: number): string => String(Math.round(v))

type Ridge = { edge: string; top: (x: number) => number }
/** A spot on the ground: x, the foot's y, the height. */
type Spot = readonly [number, number, number]

/** A hand-cut paper ridge: a smooth curve through slightly jittered samples, and the height it follows. */
function ridge(base: number, amp: number, k: number, seed: number): Ridge {
  const next = random(seed)
  const a = next() * 6.28
  const b = next() * 6.28
  const top = (x: number) => base - amp * (0.62 * Math.sin(x * k + a) + 0.38 * Math.sin(x * k * 2.7 + b))
  const pts: (readonly [number, number])[] = []

  for (let x = -80; x <= 1680; x += 80) pts.push([x, top(x) + (next() - 0.5) * 6])

  let edge = ''

  pts.forEach(([x, y], i) => {
    const after = pts[i + 1]

    if (i === 0) edge += `M${x} ${n(y)}`
    else if (after === undefined) edge += `L${x} ${n(y)}`
    else edge += `Q${x} ${n(y)} ${n((x + after[0]) / 2)} ${n((y + after[1]) / 2)}`
  })

  return { edge, top }
}

/** One paper layer: a soft shadow on the layer behind (stacked strokes, no filter), the sheet, its lit cut edge. */
function hill(r: Ridge, fill: string, rim: string): string {
  return (
    `<g fill="none" stroke="${SHADE}" transform="translate(3 -5)"><path d="${r.edge}" stroke-opacity=".18" stroke-width="32"/>` +
    `<path d="${r.edge}" stroke-opacity=".26" stroke-width="14"/></g>` +
    `<path d="${r.edge}V1200H-80Z" fill="${fill}"/>` +
    `<path d="${r.edge}" fill="none" stroke="${rim}" stroke-opacity=".5" stroke-width="2"/>`
  )
}

/** Where trees stand on a ridge. */
function spots(r: Ridge, xs: readonly number[], h: number, seed: number): Spot[] {
  const next = random(seed)

  return xs.map(x => [x, r.top(x) + 6, h * (0.7 + next() * 0.6)] as const)
}

/** Two-tier paper firs, each folded down the middle: a lit half and a shaded half. */
function firs(at: readonly Spot[], lit: string, shade: string): string {
  let a = ''
  let b = ''

  for (const [x, y, t] of at) {
    const w = t * 0.36
    const half = (s: number) =>
      `M${n(x)} ${n(y - t)}L${n(x + s * w)} ${n(y - t * 0.36)}H${n(x)}ZM${n(x)} ${n(y - t * 0.64)}L${n(x + s * w * 1.3)} ${n(y)}H${n(x)}Z`

    a += half(-1)
    b += half(1)
  }

  return `<path d="${a}" fill="${lit}"/><path d="${b}" fill="${shade}"/>`
}

/** Round paper trees on sticks, folded down the middle. */
function rounds(at: readonly Spot[], lit: string, shade: string): string {
  let a = ''
  let b = ''
  let s = ''

  for (const [x, y, t] of at) {
    const r = t * 0.36
    const cy = y - t + r

    s += `M${n(x - 2)} ${n(y)}V${n(cy)}h4V${n(y)}Z`
    a += `M${n(x)} ${n(cy - r)}A${n(r)} ${n(r)} 0 0 0 ${n(x)} ${n(cy + r)}Z`
    b += `M${n(x)} ${n(cy - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(cy + r)}Z`
  }

  return `<path d="${s}" fill="#24190f"/><path d="${a}" fill="${lit}"/><path d="${b}" fill="${shade}"/>`
}

/** A paper cottage with a red roof trim and a lit window. */
function house(x: number, y: number): string {
  return (
    `<circle cx="${x}" cy="${y - 22}" r="40" fill="url(#pw-wl)"/>` +
    `<path d="M${x - 22} ${y}V${y - 32}L${x} ${y - 54}L${x + 22} ${y - 32}V${y}Z" fill="#3a3354"/>` +
    `<path d="M${x} ${y - 54}L${x + 22} ${y - 32}V${y}H${x}Z" fill="#2a2440"/>` +
    `<path d="M${x - 28} ${y - 29}L${x} ${y - 59}L${x + 28} ${y - 29}L${x + 22} ${y - 27}L${x} ${y - 51}L${x - 22} ${y - 27}Z" fill="#a3443f"/>` +
    `<rect x="${x - 6}" y="${y - 30}" width="12" height="12" fill="#f0c06a" fill-opacity=".9"/>` +
    `<path d="M${x - 6} ${y - 24}h12M${x} ${y - 30}v12" stroke="#3a3354" stroke-width="1.6"/>`
  )
}

/** The windmill on the far hill: a folded tower, a red cap, four lattice sails that turn. */
function mill(x: number, y: number): string {
  const hub = y - 132
  const sail = (i: number) =>
    `<g transform="rotate(${i * 90})"><path d="M6 -3H78V-24H14Z" fill="${i % 2 ? '#6d6249' : '#8c7f63'}"/>` +
    '<path d="M6 -3H78M26 -3V-24M46 -3V-24M64 -3V-24" stroke="#2e2a24" stroke-opacity=".6" stroke-width="1.6"/></g>'

  return (
    `<path d="M${x - 26} ${y}L${x - 12} ${hub + 6}H${x}V${y}Z" fill="#433d5e"/><path d="M${x} ${y}V${hub + 6}H${x + 12}L${x + 26} ${y}Z" fill="#2f2a47"/>` +
    `<path d="M${x - 18} ${hub + 10}Q${x} ${hub - 22} ${x + 18} ${hub + 10}Z" fill="#7e3330"/>` +
    `<path d="M${x - 7} ${y}V${y - 18}Q${x} ${y - 26} ${x + 7} ${y - 18}V${y}Z" fill="#14101c"/>` +
    `<rect x="${x - 5}" y="${y - 72}" width="10" height="12" fill="#f0c06a" fill-opacity=".75"/>` +
    `<g transform="translate(${x} ${hub})"><g class="pw-mill">${[0, 1, 2, 3].map(sail).join('')}</g><circle r="6" fill="#2e2a24"/></g>`
  )
}

/** A scalloped paper cloud around (0, 0) at its foot: half-round puffs along the top, a flat bottom. */
function puff(w: number, h: number, seed: number): string {
  const next = random(seed)
  const us = [-0.5, -0.3, -0.1, 0.12, 0.32, 0.5]
  const vs = [0, -0.44, -0.64, -0.58, -0.36, 0]
  let d = ''
  let prev: readonly [number, number] | undefined

  us.forEach((u, i) => {
    const p = [u * w + (i > 0 && i < 5 ? (next() - 0.5) * w * 0.05 : 0), (vs[i] ?? 0) * h * (0.9 + next() * 0.2)] as const

    if (prev === undefined) d += `M${n(p[0])} ${n(p[1])}`
    else {
      const r = Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 2

      d += `A${n(r)} ${n(r)} 0 0 1 ${n(p[0])} ${n(p[1])}`
    }

    prev = p
  })

  return `${d}Q0 ${n(h * 0.14)} ${n(-w / 2)} 0Z`
}

/** Two stacked paper clouds, each casting its shadow on what is behind it. */
function cloud(x: number, y: number, w: number, h: number, back: string, front: string, seed: number): string {
  const big = puff(w, h, seed)
  const small = puff(w * 0.66, h * 0.62, seed + 40)
  const fx = x - w * 0.06

  return (
    `<path d="${big}" transform="translate(${n(x + 9)} ${n(y + 11)})" fill="${SHADE}" fill-opacity=".5"/>` +
    `<path d="${big}" transform="translate(${n(x)} ${n(y)})" fill="${back}"/>` +
    `<path d="${small}" transform="translate(${n(fx + 6)} ${n(y + 9)})" fill="${SHADE}" fill-opacity=".3"/>` +
    `<path d="${small}" transform="translate(${n(fx)} ${n(y + 3)})" fill="${front}"/>`
  )
}

/** A folded paper star on its string from the top: it sways; it turns over while Claude thinks; it glows when done. */
function star(x: number, y: number, R: number, lit: string, shade: string, i: number, glow: boolean): string {
  const r = R * 0.46
  const at = (k: number, rad: number) => `${f(rad * Math.cos(-Math.PI / 2 + (k * Math.PI) / 5))} ${f(rad * Math.sin(-Math.PI / 2 + (k * Math.PI) / 5))}`
  let a = ''
  let b = ''

  for (let k = 0; k < 10; k += 2) {
    a += `M0 0L${at(k - 1, r)}L${at(k, R)}Z`
    b += `M0 0L${at(k, R)}L${at(k + 1, r)}Z`
  }

  const drop = y + 20

  return (
    `<g transform="translate(${x} -20)"><g class="pw-sw" style="animation-duration:${f(5 + (i % 4) * 0.9)}s;animation-delay:${f(-i * 1.1)}s">` +
    `<path d="M0 0V${n(drop - R)}" stroke="${STRING}" stroke-opacity=".4" stroke-width="1.2"/><g transform="translate(0 ${n(drop)})">` +
    (glow ? `<circle class="pw-sg" r="${n(R * 2.8)}" fill="url(#pw-sgl)"/>` : '') +
    `<g class="pw-fl" style="animation-delay:${f(-i * 0.35)}s"><path d="${a}" fill="${lit}"/><path d="${b}" fill="${shade}"/></g></g></g></g>`
  )
}

/** The crescent moon on its string: it swings; on an error the tear cuts the string and it falls behind the hills. */
function moon(): string {
  const R = 88
  const c = `M0 ${-R}A${R} ${R} 0 0 0 0 ${R}A123 123 0 0 1 0 ${-R}Z`

  return (
    '<g transform="translate(213 -20)"><g class="pw-sw" style="animation-duration:7.5s">' +
    `<path class="pw-snap" d="M0 0V102" stroke="${STRING}" stroke-opacity=".6" stroke-width="1.6"/>` +
    '<g class="pw-fall"><circle class="pw-halo" cx="-17" cy="255" r="210" fill="url(#pw-mh)"/>' +
    `<path d="M0 102V156" stroke="${STRING}" stroke-opacity=".6" stroke-width="1.6"/>` +
    '<g transform="translate(37 235) rotate(-25)">' +
    `<path d="${c}" transform="translate(8 10)" fill="${SHADE}" fill-opacity=".5"/><path d="${c}" fill="#c9b68c"/>` +
    `<path d="M0 ${-R}A${R} ${R} 0 0 0 0 ${R}" fill="none" stroke="#e6d8b4" stroke-opacity=".6" stroke-width="2.4"/>` +
    '<g fill="#ad9a72"><circle cx="-66" cy="-24" r="8"/><circle cx="-60" cy="34" r="5.5"/><circle cx="-76" cy="8" r="4"/></g>' +
    `<path d="M-54 -4q6 5 12 0M-52 22q4 4 9 0" fill="none" stroke="#5a4a34" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="-47" cy="9" r="5" fill="${RED}" fill-opacity=".45"/></g></g></g></g>`
  )
}

/** The rip across the sky paper: a dark gap with pale torn fibres either side, drawn in from the top. */
function tear(): string {
  const next = random(31)
  const [x0, y0, x1, y1] = [280, -12, -16, 404]
  const len = Math.hypot(x1 - x0, y1 - y0)
  const nx = -(y1 - y0) / len
  const ny = (x1 - x0) / len
  let d = `M${x0} ${y0}`
  let t = 0
  let off = 0

  // An irregular rip: uneven steps, the edge wandering a little either way rather than zigzagging.
  while (t < 1) {
    t = Math.min(1, t + 0.018 + next() * 0.03)
    off = t === 1 ? 0 : Math.max(-11, Math.min(11, off + (next() - 0.5) * 12))
    d += `L${n(x0 + (x1 - x0) * t + nx * off)} ${n(y0 + (y1 - y0) * t + ny * off)}`
  }

  return (
    '<g class="pw-tear" fill="none" stroke-linejoin="round">' +
    `<path class="pw-rip" pathLength="1" d="${d}" stroke="#d8caa6" stroke-opacity=".8" stroke-width="16"/>` +
    `<path class="pw-rip" pathLength="1" d="${d}" stroke="#010103" stroke-width="9"/></g>`
  )
}

/** The cloud crumpled into a paper ball: a faceted lump with its creases. */
function ball(): string {
  const next = random(23)
  const outline = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2
    const r = 34 + next() * 7

    return `${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)}`
  }).join('L')

  return (
    `<path d="M${outline}Z" fill="#5a5f94"/>` +
    '<path d="M-28 -12L-8 -30L-2 -8ZM-8 -30L18 -26L-2 -8Z" fill="#8086bc"/><path d="M-2 -8L30 4L14 28ZM-2 -8L14 28L-16 26Z" fill="#3e4270"/>' +
    '<path d="M-28 -12L-2 -8L30 4M-2 -8L-16 26M-8 -30L-2 -8M14 28L-2 -8" fill="none" stroke="#2a2d52" stroke-width="1.8"/>'
  )
}

/** An origami crane facing right, wings up: the far wing, the body with neck and tail, the near wing in two folds. */
function crane(lit: string, shade: string): string {
  return (
    `<g class="pw-wg"><path d="M-4 -2L14 -2L9 -34Z" fill="${shade}"/></g>` +
    `<path d="M-16 2L0 -4L18 2L0 8ZM-10 0L-36 -18L-14 4ZM8 0L30 -22L37 -16L31 -18L14 4Z" fill="${lit}"/>` +
    `<g class="pw-wg"><path d="M-13 -1L-1 -1L-7 -42Z" fill="${lit}"/><path d="M-1 -1L11 -1L-7 -42Z" fill="${shade}"/></g>`
  )
}

/** A paper plane, nose at (0, 0) pointing right. */
const PLANE = `<path d="M0 0L-50 -12L-33 0L-50 13Z" fill="${CREAM}"/><path d="M0 0L-33 0L-44 7Z" fill="${CREAM_DARK}"/>`

/** One castle tower: folded body, red cone roof, a pennant on a pole. */
function tower(x: number, w: number, top: number, roof: number): string {
  const l = x - w / 2
  const r = x + w / 2
  const tip = top - roof

  return (
    `<path d="M${l} 842V${top}H${x}V842Z" fill="#b9a47c"/><path d="M${x} 842V${top}H${r}V842Z" fill="#8b7653"/>` +
    `<path d="M${l - 7} ${top + 2}L${x} ${tip}V${top + 2}Z" fill="#c9504a"/><path d="M${r + 7} ${top + 2}L${x} ${tip}V${top + 2}Z" fill="#8f3531"/>` +
    `<path d="M${x} ${tip}V${tip - 26}" stroke="${EDGE}" stroke-width="2"/>` +
    `<g transform="translate(${x} ${tip - 26})"><path class="pw-flag" d="M0 0L24 6L0 12Z" fill="${RED}"/></g>`
  )
}

/** An arched window slit at (x, y), w wide and h tall. */
const slit = (x: number, y: number, w: number, h: number): string => `M${x} ${y + h}V${y + 4}Q${x + w / 2} ${y - 3} ${x + w} ${y + 4}V${y + h}Z`

/** The pop-up book lying open, its turning page, the castle folded flat inside it and the cranes it releases. */
function book(): string {
  const windows = slit(218, 670, 14, 24) + slit(205, 726, 10, 18) + slit(235, 726, 10, 18) + slit(136, 722, 10, 18) + slit(304, 722, 10, 18)
  let wall = 'M93 842V758'

  for (let x = 93; x < 357; x += 24) wall += `H${x + 12}V772H${x + 24}V758`

  const bits = Array.from({ length: 10 }, (_, i) => {
    const next = random(60 + i)
    const dx = (next() - 0.5) * 260
    const dy = -60 - next() * 110

    return (
      `<rect class="pw-bit" style="--dx:${n(dx)}px;--dy:${n(dy)}px;animation-delay:${f(1.25 + i * 0.04)}s" x="${n(220 + (next() - 0.5) * 20)}" y="${n(556 + next() * 20)}" ` +
      `width="9" height="7" fill="${i % 2 ? RED : CREAM}"/>`
    )
  }).join('')
  const flock = [
    [120, 800, 40, -800, 0, 0.9],
    [180, 770, 130, -860, 0.15, 1.1],
    [250, 790, -50, -780, 0.3, 0.8],
    [310, 770, 90, -900, 0.45, 1],
    [90, 740, 10, -760, 0.6, 0.75],
    [210, 730, 160, -840, 0.8, 0.95],
    [360, 800, 50, -820, 1, 0.85],
  ]
    .map(
      ([x, y, dx, dy, delay, s], i) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><g class="pw-cr" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s">` +
        `${i % 2 ? crane(RED, RED_DARK) : crane(CREAM, CREAM_DARK)}</g></g>`,
    )
    .join('')

  return (
    // The cover, the page block and the two pages, a shadow down the gutter and what is printed on the left page.
    '<path d="M6 890Q120 874 225 896Q330 874 444 890V903Q330 887 225 909Q120 887 6 903Z" fill="#7a2e2b"/>' +
    '<path d="M6 890Q120 874 225 896Q330 874 444 890" fill="none" stroke="#b5504a" stroke-width="2"/>' +
    '<path d="M14 882Q122 866 225 888Q328 866 436 882L440 892Q328 876 225 898Q122 876 10 892Z" fill="#bfae88"/>' +
    '<path d="M12 887Q122 871 225 893Q328 871 438 887" fill="none" stroke="#8f7f5e" stroke-width="1.2"/>' +
    '<path d="M40 798Q130 780 225 802V888Q122 866 14 882Z" fill="#9c8c6d"/><path d="M225 802Q320 780 410 798L436 882Q328 866 225 888Z" fill="#8c7d5f"/>' +
    '<path d="M52 813H204M48 827H150M160 827H206M44 841H206M38 855H120M130 855H206M32 869H182" stroke="#5f5440" stroke-opacity=".5" stroke-width="2.4"/>' +
    // The page that turns over on read and at the start of a run.
    '<g class="pw-page"><path d="M225 802Q320 780 410 798L436 882Q328 866 225 888Z" fill="#a39373"/>' +
    '<path d="M250 815H334M250 829H312M252 866Q300 832 346 852T426 850" fill="none" stroke="#5f5440" stroke-opacity=".5" stroke-width="2.4"/>' +
    '<circle cx="392" cy="822" r="9" fill="none" stroke="#5f5440" stroke-opacity=".5" stroke-width="2.4"/></g>' +
    '<path d="M214 802Q225 807 236 802V888Q225 893 214 888Z" fill="#000" fill-opacity=".22"/>' +
    // The castle, folded flat until a run: towers and keep, then the wall, then the bushes in front.
    `<g class="pw-pop" style="animation-delay:.35s">${tower(141, 42, 700, 60)}${tower(309, 42, 700, 60)}${tower(225, 60, 652, 78)}` +
    `<path d="${windows}" fill="#1c140e"/><path class="pw-lit" d="${windows}" fill="#f2c46a"/></g>` +
    `<g class="pw-pop" style="animation-delay:.65s"><path d="${wall}V842Z" fill="#a38e69"/><path d="M93 772H357" stroke="#c9b892" stroke-opacity=".6" stroke-width="2"/>` +
    '<path d="M207 842V806Q225 786 243 806V842Z" fill="#1c140e"/>' +
    '<path d="M213 842V800M219 842V795M225 842V793M231 842V795M237 842V800" stroke="#5a4a36" stroke-width="2"/>' +
    '<path d="M110 790h22M150 806h18M300 790h24M330 812h16M120 820h14" stroke="#7e6a4a" stroke-width="2"/></g>' +
    `<g class="pw-pop" style="animation-delay:.95s">${rounds(
      [
        [101, 852, 40],
        [130, 856, 30],
        [322, 856, 30],
        [350, 852, 40],
      ],
      '#3a5e4b',
      '#2c4a3b',
    )}</g>` +
    // The little pop-ups that always stand on the page corners.
    firs(
      [
        [54, 850, 46],
        [402, 852, 44],
      ],
      '#3a5e4b',
      '#264034',
    ) +
    bits +
    flock
  )
}

/** The cardboard laptop with a slanted lit screen, the paper crane beside it, the pinwheel in a paper cup. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${250 + i * 11}" y="321" width="7" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const line = (t: number, w: number) => `M${f(316 + 35 * t)} ${f(314 - 80 * t)}l${w} 1.5`
  const screen =
    activity === 'run'
      ? `<path class="pw-prog" d="${line(0.5, 16)}" stroke="#2a1e14" stroke-opacity=".7" stroke-width="5"/>`
      : `<path d="${[0.16, 0.3, 0.44, 0.58, 0.72].map((t, i) => line(t, 8 + ((i * 5) % 9))).join('')}" stroke="#3a2a1a" stroke-opacity=".5" stroke-width="2.6"/>`
  const blade = (i: number) => `<path transform="rotate(${i * 90})" d="M0 0L19 -3L15 -17Z" fill="${i % 2 ? CREAM : RED}"/>`

  return (
    `<path d="M238 330L245 318H338L344 330Z" fill="${KRAFT}" stroke="${EDGE}" stroke-width="1.6"/>` +
    '<path d="M241 328H341" stroke="#8d7150" stroke-width="2" stroke-dasharray="3 2"/>' +
    keys +
    `<path d="M336 320L370 238L380 241L346 322Z" fill="${KRAFT}" stroke="${EDGE}" stroke-width="1.6"/>` +
    `<path d="M314 318L350 234L370 238L336 320Z" fill="${light}" stroke="${KRAFT}" stroke-width="3" stroke-linejoin="round"/>` +
    screen +
    '<path d="M361 268l11 3l-3 9l-11 -3Z" fill="#cbb68c" fill-opacity=".5"/>' +
    `<path d="M400 300V252" stroke="#8a7656" stroke-width="2.5"/>` +
    `<path d="M390 330L387 300H413L410 330Z" fill="${CREAM}"/><path d="M394 330L392 300H397L399 330ZM404 330L405 300H410L408 330Z" fill="${RED}" fill-opacity=".8"/>` +
    `<g transform="translate(400 250)"><g class="pw-pin">${[0, 1, 2, 3].map(blade).join('')}</g><circle r="2.6" fill="${EDGE}"/></g>` +
    // A red paper crane on the floor beside the box.
    `<g transform="translate(76 452) scale(.62)">${crane(RED, RED_DARK)}</g>`
  )
}

/** A round leafy blob on the nook's tree: a shadow, a lit half and a shaded half. */
function blob(x: number, y: number, r: number): string {
  return (
    `<circle cx="${x + 7}" cy="${y + 9}" r="${r}" fill="${SHADE}" fill-opacity=".45"/>` +
    `<path d="M${x} ${y - r}A${r} ${r} 0 0 0 ${x} ${y + r}Z" fill="#2a4c42"/><path d="M${x} ${y - r}A${r} ${r} 0 0 1 ${x} ${y + r}Z" fill="#1d3a33"/>`
  )
}

export function paperWorldWorld(): World {
  const next = random(5)
  const l1 = ridge(470, 34, 0.0062, 11)
  const l2 = ridge(560, 38, 0.0048, 12)
  const l3 = ridge(650, 34, 0.0055, 13)
  const l4 = ridge(755, 36, 0.0044, 14)
  const l5 = ridge(868, 24, 0.0058, 15)
  const farXs = Array.from({ length: 22 }, (_, i) => (i < 11 ? 10 + i * 40 : 1180 + (i - 11) * 40) + next() * 16)
  const stars = [
    [60, 120, 16, 'g'],
    [395, 70, 13, 'r'],
    [345, 330, 12, 'g'],
    [520, 60, 11, 'd'],
    [690, 120, 12, 'd'],
    [900, 50, 10, 'd'],
    [1080, 105, 12, 'd'],
    [1225, 150, 14, 'g'],
    [1330, 70, 12, 'r'],
    [1440, 120, 16, 'g'],
    [1555, 60, 12, 'g'],
  ] as const
  const starTones = { g: ['#cdb27a', '#9c8352'], r: [RED, RED_DARK], d: ['#34375a', '#25284a'] } as const
  const hanging = stars
    .map(([x, y, R, tone], i) => {
      const [lit, shade] = starTones[tone]

      return star(x, y, R, lit, shade, i, tone !== 'd')
    })
    .join('')
  const fall = l1.top(1458) + 8 - 34 - 215
  const strands = [
    [292, -186, -60, [-138, -84]],
    [342, -192, -96, [-152, -110]],
  ] as const
  let mobileIndex = 0
  const mobile = strands
    .map(([x, top, low, cranes], s) => {
      const hung = cranes
        .map(y => {
          const k = mobileIndex++

          return (
            `<g transform="translate(0 ${y - top})"><g class="pw-mc" style="--dx:${180 + k * 26}px;--dy:${-380 - k * 30}px;animation-delay:${f(0.2 + k * 0.2)}s">` +
            `<g transform="scale(.55)">${k % 2 ? crane(CREAM, CREAM_DARK) : crane(RED, RED_DARK)}</g></g></g>`
          )
        })
        .join('')

      return (
        `<g transform="translate(${x} ${top})"><g class="pw-sw" style="animation-duration:${4.6 + s}s;animation-delay:-${s * 2}s">` +
        `<path d="M0 0V${low - top}" stroke="${STRING}" stroke-opacity=".55" stroke-width="1.2"/>${hung}</g></g>`
      )
    })
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#0d0a0c',
      furniture: KRAFT_DARK,
      metal: KRAFT,
      paper: '#e6d6b2',
      light: { idle: '#c9a66a', work: '#f0d08e', bright: '#fff0c8' },
      headTop: 215,
      glowAt: [342, 278],
      device,
      wear: {
        // The folded newspaper hat: two creased facets with printed lines, a red folded-up brim. It ends above the eyes.
        front:
          '<g shape-rendering="geometricPrecision">' +
          `<path d="M60 246L150 166V246Z" fill="${CREAM}"/><path d="M240 246L150 166V246Z" fill="${CREAM_DARK}"/>` +
          '<path d="M118 206h26M108 214h36M98 222h46M160 196h18M160 206h28M160 214h38M160 222h48" stroke="#5e5444" stroke-opacity=".5" stroke-width="2.4"/>' +
          `<path d="M52 232H248L244 252H56Z" fill="#c4453f"/><path d="M52 232H248" stroke="#e8857e" stroke-width="2"/>` +
          '<path d="M150 232V252" stroke="#8e2f2b" stroke-width="2"/><path d="M52 232L38 222L58 242Z" fill="#a33a35"/></g>',
      },
      seatArt:
        // A cardboard box with its flaps folded out, packing tape and printed arrows.
        `<path d="M110 354H192V456H110Z" fill="#5c4630" stroke="${EDGE}" stroke-width="1.6"/><path d="M170 354H192V456H170Z" fill="#46351f"/>` +
        `<path d="M110 352L94 338L116 342ZM192 352L208 338L186 342Z" fill="${KRAFT}" stroke="${EDGE}" stroke-width="1.2"/>` +
        `<rect x="110" y="349" width="82" height="7" fill="${KRAFT}"/><rect x="138" y="349" width="24" height="44" fill="#cbb68c" fill-opacity=".35"/>` +
        '<path d="M126 424v-18M120 412l6 -6l6 6M150 424v-18M144 412l6 -6l6 6" fill="none" stroke="#2a1e14" stroke-opacity=".6" stroke-width="2"/>',
      tableArt:
        // A cardboard desk: corrugated flutes along the top's edge, folded legs with tape round them.
        `<g fill="${KRAFT_DARK}" stroke="${EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="15" rx="1"/>` +
        '<path d="M186 345H210V456H186Z"/><path d="M428 345H452V456H428Z"/><path d="M210 402H428V410H210Z"/></g>' +
        `<path d="M168 338q3 -3.5 6 0${'t6 0'.repeat(49)}" fill="none" stroke="#7d6244" stroke-width="1.6"/>` +
        '<path d="M198 345V456M440 345V456" stroke="#3a2b1d" stroke-width="1.6"/>' +
        '<path d="M186 362h24M428 362h24" stroke="#cbb68c" stroke-opacity=".4" stroke-width="7"/>',
    },
    style:
      // Strings sway; stars turn over while Claude thinks; clouds drift; the moon glows.
      '.pw-sw{animation:pw-sw 6s ease-in-out infinite alternate}@keyframes pw-sw{from{transform:rotate(-2.4deg)}to{transform:rotate(2.4deg)}}' +
      '.st-thinking .pw-sw{animation-duration:3s}' +
      '.pw-fl{transform-box:fill-box;transform-origin:center}.st-thinking .pw-fl{animation:pw-fl 2.8s ease-in-out infinite}' +
      '@keyframes pw-fl{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}' +
      '.pw-cl{animation:pw-cl 34s ease-in-out infinite alternate}@keyframes pw-cl{from{transform:translateX(-28px)}to{transform:translateX(28px)}}' +
      '.pw-halo{transform-box:fill-box;transform-origin:center;animation:pw-halo 7s ease-in-out infinite alternate}@keyframes pw-halo{from{opacity:.65}to{opacity:1}}' +
      '.st-done .pw-halo{animation:pw-halo2 2.4s ease-out both}@keyframes pw-halo2{from{opacity:.8;transform:scale(1)}to{opacity:1;transform:scale(1.3)}}' +
      '@keyframes pw-on{to{opacity:1}}' +
      // The windmill and the pinwheel turn with the work.
      '.pw-mill,.pw-pin{transform-box:fill-box;transform-origin:center;animation:mv-spin 28s linear infinite}.pw-pin{animation-duration:9s}' +
      '.st-responding .pw-mill{animation-duration:11s}.st-tool .pw-mill,.st-run .pw-mill,.st-web .pw-mill{animation-duration:2.6s}.st-done .pw-mill{animation-duration:5s}' +
      '.st-thinking .pw-pin,.st-responding .pw-pin{animation-duration:2.4s}.st-tool .pw-pin,.st-run .pw-pin,.st-web .pw-pin,.st-read .pw-pin{animation-duration:.7s}.st-done .pw-pin{animation-duration:1.2s}' +
      '.pw-prog{transform-box:fill-box;transform-origin:0 50%;animation:pw-prog 1.6s ease-in-out infinite}@keyframes pw-prog{from{transform:scaleX(.1)}to{transform:scaleX(1)}}' +
      // Read and the start of a run: the book's page turns over at the spine.
      '.pw-page{transform-box:fill-box;transform-origin:0 50%}' +
      '.st-read .pw-page{animation:pw-turn 1.9s ease-in-out infinite}.st-run .pw-page{animation:pw-turn .8s ease-in-out both}' +
      '@keyframes pw-turn{0%,10%{transform:translateY(0) scaleX(1)}55%{transform:translateY(-18px) scaleX(0)}100%{transform:translateY(0) scaleX(-1)}}' +
      // Run: the castle pops up out of the book in three folds, its flags fly, its windows light, paper bits burst.
      '.pw-pop{transform-box:fill-box;transform-origin:50% 100%;transform:scale(1,0)}' +
      '.st-run .pw-pop{animation:pw-pop .9s cubic-bezier(.25,1.45,.5,1) both}' +
      '@keyframes pw-pop{from{transform:scale(1,0) skewX(16deg)}to{transform:scale(1,1) skewX(0deg)}}' +
      '.pw-flag{transform-box:fill-box;transform-origin:0 50%;animation:pw-flag 1.3s ease-in-out infinite alternate}' +
      '@keyframes pw-flag{from{transform:skewY(-10deg) scale(1,1)}to{transform:skewY(8deg) scale(.85,1)}}' +
      '.pw-lit{opacity:0}.st-run .pw-lit{animation:pw-on .9s ease-out 1.8s both}' +
      '.pw-bit{opacity:0;transform-box:fill-box;transform-origin:center}.st-run .pw-bit{animation:pw-bit 1.8s cubic-bezier(.2,.7,.5,1) both}' +
      '@keyframes pw-bit{0%{opacity:0;transform:translate(0,0) rotate(0deg)}12%{opacity:1}55%{opacity:1;transform:translate(calc(var(--dx) * .7),var(--dy)) rotate(200deg)}' +
      '100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 150px)) rotate(420deg)}}' +
      // Error: the sky tears, the moon's string snaps and it falls; a cloud crumples into a ball that drops on the hill.
      '.pw-tear{opacity:0}.st-error .pw-tear{opacity:1}' +
      '.pw-rip{stroke-dasharray:1 1;stroke-dashoffset:1}.st-error .pw-rip{animation:pw-rip .5s ease-in .05s both}@keyframes pw-rip{to{stroke-dashoffset:0}}' +
      '.pw-snap{transform-box:fill-box;transform-origin:50% 0}.st-error .pw-snap{animation:pw-snap .7s ease-out .28s both}' +
      '@keyframes pw-snap{0%{transform:scale(1,1)}40%{transform:scale(1,.5)}100%{transform:scale(1,.62)}}' +
      '.pw-fall{transform-box:fill-box;transform-origin:50% 40%}.st-error .pw-fall{animation:pw-fall 1.5s ease-in .28s both}' +
      '@keyframes pw-fall{0%{transform:translate(0,0) rotate(0deg)}12%{transform:translate(0,-8px) rotate(-4deg)}62%{transform:translate(40px,214px) rotate(38deg)}' +
      '76%{transform:translate(44px,196px) rotate(30deg)}88%{transform:translate(46px,210px) rotate(36deg)}100%{transform:translate(46px,206px) rotate(34deg)}}' +
      '.pw-crum{transform-box:fill-box;transform-origin:center}.st-error .pw-crum{animation:pw-crum .7s ease-in .1s both}' +
      '@keyframes pw-crum{0%{opacity:1;transform:scale(1,1) rotate(0deg)}60%{opacity:1}100%{opacity:0;transform:scale(.26,.34) rotate(-46deg)}}' +
      '.pw-ball{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .pw-ball{animation:pw-ball 1.2s ease-in .62s both}' +
      '@keyframes pw-ball{0%{opacity:0;transform:translate(0,0) rotate(0deg) scale(.6)}12%{opacity:1;transform:translate(0,0) rotate(20deg) scale(1)}' +
      '70%{opacity:1;transform:translate(16px,var(--fall)) rotate(220deg) scale(1)}84%{opacity:1;transform:translate(22px,calc(var(--fall) - 22px)) rotate(250deg) scale(1)}' +
      '100%{opacity:1;transform:translate(28px,var(--fall)) rotate(290deg) scale(1)}}' +
      // Done: cranes fly up out of the book and off the tree's strings, flapping; the stars glow.
      '.pw-cr{opacity:0}.st-done .pw-cr{animation:pw-cr 3.4s cubic-bezier(.45,.1,.6,1) both}' +
      '@keyframes pw-cr{0%{opacity:0;transform:translate(0,0) scale(.4)}10%{opacity:1;transform:translate(calc(var(--dx) * .05),calc(var(--dy) * .06)) scale(1)}' +
      '85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.7)}}' +
      '.st-done .pw-wg{transform-box:fill-box;transform-origin:50% 100%;animation:pw-wg .42s ease-in-out infinite alternate}@keyframes pw-wg{to{transform:scaleY(.25)}}' +
      '.st-done .pw-mc{animation:pw-mc 3s ease-in both}@keyframes pw-mc{0%{transform:translate(0,0)}12%{transform:translate(0,8px)}90%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.pw-sg{opacity:0}.st-done .pw-sg{animation:pw-on 1.6s ease-out .3s both}' +
      // Responding: a paper plane glides up the left; web: planes fly off from the screen toward the top right.
      '.pw-pl{opacity:0}.st-responding .pw-pl{animation:pw-pl 6.5s ease-in-out infinite}' +
      '@keyframes pw-pl{0%{opacity:0;transform:translate(0,0)}8%{opacity:.85}45%{transform:translate(170px,-250px)}75%{opacity:.85;transform:translate(300px,-430px)}100%{opacity:0;transform:translate(380px,-610px)}}' +
      '.pw-wp{opacity:0}.st-web .pw-wp{animation:pw-wp 2.4s ease-in infinite}' +
      '@keyframes pw-wp{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}85%{opacity:.9}100%{opacity:0;transform:translate(-230px,-600px)}}',
    scenery:
      '<defs><linearGradient id="pw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07081a"/><stop offset=".55" stop-color="#0e1029"/><stop offset="1" stop-color="#1a1733"/></linearGradient>' +
      '<linearGradient id="pw-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2350" stop-opacity="0"/><stop offset="1" stop-color="#2a2350" stop-opacity=".55"/></linearGradient>' +
      '<radialGradient id="pw-mh"><stop offset="0" stop-color="#e6d6aa" stop-opacity=".22"/><stop offset=".5" stop-color="#e6d6aa" stop-opacity=".07"/><stop offset="1" stop-color="#e6d6aa" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pw-wl"><stop offset="0" stop-color="#f0c06a" stop-opacity=".38"/><stop offset="1" stop-color="#f0c06a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="pw-sgl"><stop offset="0" stop-color="#f2d48a" stop-opacity=".5"/><stop offset="1" stop-color="#f2d48a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#pw-sky)"/><rect y="300" width="1600" height="260" fill="url(#pw-hz)"/>' +
      hanging +
      tear() +
      moon() +
      `<g class="pw-cl">${cloud(120, 405, 220, 84, '#343864', '#454a7a', 1)}</g>` +
      `<g class="pw-cl" style="animation-duration:29s;animation-direction:alternate-reverse">${cloud(430, 300, 180, 66, '#1f2242', '#282c50', 2)}</g>` +
      `<g class="pw-cl" style="animation-duration:41s">${cloud(720, 250, 280, 96, '#15182f', '#1b1f3a', 3)}${cloud(1010, 150, 220, 74, '#14172d', '#1a1d38', 4)}</g>` +
      `<g class="pw-cl" style="animation-duration:38s"><g class="pw-crum">${cloud(1430, 245, 230, 90, '#343864', '#454a7a', 5)}</g></g>` +
      // The far ridge with its tiny firs, the crumpled ball landing on it.
      hill(l1, '#20244a', '#5c629a') +
      firs(spots(l1, farXs, 26, 21), '#2a3060', '#1c2046') +
      `<g class="pw-cl" style="animation-duration:38s"><g transform="translate(1430 215)"><g class="pw-ball" style="--fall:${n(fall)}px">${ball()}</g></g></g>` +
      // The windmill's hill.
      hill(l2, '#1a1d3f', '#4e5590') +
      firs(spots(l2, [30, 72, 108, 150, 372, 410, 1190, 1232, 1420, 1462, 1505, 1548, 1590], 52, 22), '#28345c', '#1b2446') +
      mill(1330, Math.round(l2.top(1330) + 8)) +
      // The village hill: round trees and two cottages with lit windows.
      hill(l3, '#211a30', '#6e557a') +
      rounds(spots(l3, [40, 92, 356, 404, 1196, 1300, 1350, 1478, 1526, 1578], 62, 23), '#2b4644', '#1c302f') +
      house(1246, Math.round(l3.top(1246) + 8)) +
      house(1420, Math.round(l3.top(1420) + 8)) +
      // The near hill with tall firs at both ends.
      hill(l4, '#261c18', '#7e6046') +
      firs(spots(l4, [18, 62, 1214, 1572], 112, 24), '#34483a', '#22322a') +
      `<g transform="translate(40 660)"><g class="pw-pl"><g transform="rotate(-56)">${PLANE}</g></g></g>` +
      // The front sheet with the pop-up book on it.
      `<g class="mv-b">${hill(l5, '#17110d', '#6a4c34')}${book()}</g>`,
    nook:
      // The paper ground the desk stands on.
      '<g fill="none" stroke="#020208" transform="translate(3 -5)"><path d="M-10 414Q110 396 220 410T450 402" stroke-opacity=".18" stroke-width="30"/>' +
      '<path d="M-10 414Q110 396 220 410T450 402" stroke-opacity=".26" stroke-width="14"/></g>' +
      '<path d="M-10 414Q110 396 220 410T450 402V480H-10Z" fill="#1d1510"/><path d="M-10 414Q110 396 220 410T450 402" fill="none" stroke="#7a5a3e" stroke-opacity=".5" stroke-width="2"/>' +
      // The paper tree beside the desk, with a branch of hanging cranes.
      '<path d="M388 456L394 -170H404L412 456Z" fill="#33251a"/><path d="M399 456V-170H404L412 456Z" fill="#251a12"/>' +
      '<path d="M398 -196Q340 -206 268 -190L270 -182Q340 -196 398 -184Z" fill="#33251a"/>' +
      blob(400, -262, 74) +
      blob(342, -226, 50) +
      blob(452, -214, 54) +
      blob(396, -330, 46) +
      mobile +
      [0, 0.8, 1.6]
        .map(delay => `<g transform="translate(356 232)"><g class="pw-wp" style="animation-delay:${delay}s"><g transform="rotate(-111) scale(.8)">${PLANE}</g></g></g>`)
        .join(''),
    front:
      // Cut-paper grass at the floor's edge.
      '<path d="M0 462L6 442L12 460L20 436L28 460L36 446L44 462ZM392 462L398 444L406 460L414 438L422 460L430 448L438 462Z" fill="#2a3e30"/>',
  }
}
