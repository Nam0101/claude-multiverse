import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Sorcerer Sanctum: an old sanctum library at night, after the mystic-sorcerer film. Through a huge round window on
// the left the city folds over itself like a kaleidoscope; relics float by the tall shelves on the right and orange
// spell circles of invented runes turn in the air. Claude wears a high-collared deep-blue cloak and writes in a
// floating spellbook. A command draws a spell circle that opens a portal onto another sky; an error shatters it into
// sparks; done aligns the relics into a mandala while the folded city settles.
const ACC = '#ff9a3c'
const HOT = '#ffd8a0'
const EMBER = '#ff6a2a'
const CLOAK = '#1f3182'
const CLOAK_DK = '#111b4c'
const LINING = '#2a3e9c'
const TRIM = '#ffb45e'
const WOOD = '#1d1522'
const WOOD_EDGE = '#33263a'
const PAPER = '#f2e2c4'
const BRASS = '#b88a3a'
const CORAL = '#d97757'
// The round window, in the picture.
const WX = 210
const WY = 420
const WR = 176
// The spell circle's centre above the desk, in the desk's box: the portal, the shatter and the mandala.
const PX = 215
const PY = -85
const RAD = Math.PI / 180

/** A full circle as a path, so it can be drawn on with a dash. */
const ring = (r: number, cx = 0, cy = 0): string =>
  `M${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 1 ${f(cx + r)} ${f(cy)}Z`

/** A small round mark as a subpath, so many of them share one element. */
const dot = (x: number, y: number, r: number): string =>
  `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`

const polar = (deg: number, r: number, cx = 0, cy = 0): string =>
  `${f(cx + Math.cos(deg * RAD) * r)} ${f(cy + Math.sin(deg * RAD) * r)}`

/** A star polygon {n/k} in a circle of radius r. */
const star = (r: number, n: number, k: number): string =>
  'M' + Array.from({ length: n }, (_, i) => polar(-90 + (i * k * 360) / n, r)).join('L') + 'Z'

type Mark = readonly ['o', number, number, number] | readonly ['p', readonly number[]]

// Invented rune marks in a unit box (u along the ring, v outward): rings, dots, bars and meanders, never letters.
const GLYPHS: readonly (readonly Mark[])[] = [
  [['o', 0, 0.35, 0.45], ['p', [0, -0.1, 0, -1]]],
  [['o', 0, 0, 0.75], ['o', 0, 0, 0.25]],
  [['p', [0, -1, 0.7, 0, 0, 1, -0.7, 0, 0, -1]], ['o', 0, 0, 0.16]],
  [['p', [-0.8, 0, -0.3, 0]], ['p', [0.3, 0, 0.8, 0]], ['o', -0.8, 0, 0.22], ['o', 0.8, 0, 0.22], ['o', 0, 0, 0.3]],
  [['p', [0, 0, 0.45, 0, 0.45, 0.6, -0.5, 0.6, -0.5, -0.6, 0.7, -0.6]]],
  [['o', -0.45, 0.45, 0.17], ['o', 0.45, 0.45, 0.17], ['o', 0, -0.25, 0.17], ['p', [-0.75, -0.9, 0.75, -0.9]]],
  [['o', 0, 0.2, 0.4], ['p', [0, -0.3, 0, -1]], ['p', [-0.45, -0.1, -0.85, -0.6]], ['p', [0.45, -0.1, 0.85, -0.6]]],
  [['p', [-0.7, -0.8, -0.3, 0, -0.7, 0.8]], ['p', [0.1, -0.8, 0.5, 0, 0.1, 0.8]]],
]

/** A band of runes around a ring of radius r, all in one path. */
function runes(r: number, count: number, size: number, seed: number): string {
  const next = random(seed)
  let d = ''

  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const x = (u: number, v: number) => c * (r + v * size) - s * u * size
    const y = (u: number, v: number) => s * (r + v * size) + c * u * size

    for (const mark of GLYPHS[Math.floor(next() * GLYPHS.length)]!) {
      if (mark[0] === 'o') {
        // A small dot is a zero-length round-capped stroke; a larger one a little ring.
        d +=
          mark[3] < 0.3
            ? `M${f(x(mark[1], mark[2]))} ${f(y(mark[1], mark[2]))}h.1`
            : dot(x(mark[1], mark[2]), y(mark[1], mark[2]), mark[3] * size)
      } else {
        // The first point absolute, the rest as short relative moves.
        const pts = mark[1]
        let px = x(pts[0]!, pts[1]!)
        let py = y(pts[0]!, pts[1]!)

        d += `M${f(px)} ${f(py)}l`

        for (let k = 2; k + 1 < pts.length; k += 2) {
          const nx = x(pts[k]!, pts[k + 1]!)
          const ny = y(pts[k]!, pts[k + 1]!)

          d += `${f(nx - px)} ${f(ny - py)} `
          px = nx
          py = ny
        }
      }
    }
  }

  return d
}

/** A cheaper rune band for small or far circles: two dashed rings whose broken marks read as script. */
function band(r: number, width: number, seed: number): string {
  const next = random(seed)
  const dashes = Array.from({ length: 8 }, () => f(1 + next() * width * 0.7)).join(' ')

  return (
    `<circle r="${f(r)}" stroke-width="${f(width)}" stroke-opacity=".75" stroke-dasharray="${dashes}"/>` +
    `<circle r="${f(r)}" stroke-width="${f(width * 0.35)}" stroke-dasharray="${f(width * 0.3)} ${f(width * 0.9)}" stroke-dashoffset="${f(width * 0.4)}"/>`
  )
}

/** A spell circle around its own centre: a rune band turning one way, an eleven-point star turning the other. */
function sigil(r: number, seed: number, seconds: number, glyphs = true): string {
  const tick = r * 0.91
  const period = (tick * 2 * Math.PI) / 60
  const script = glyphs
    ? `<path d="${runes(r * 0.755, Math.max(8, Math.round(r / 6)), Math.max(2.2, r * 0.055), seed)}" stroke-width="1.5" stroke-linecap="round"/>`
    : band(r * 0.755, Math.max(3, r * 0.1), seed)

  return (
    `<g class="ss-o" style="--s:${f(seconds)}s"><path d="${ring(r)}" stroke-width="${f(Math.max(1.4, r / 42))}"/>` +
    `<circle r="${f(tick)}" stroke-width="${f(Math.max(2, r / 20))}" stroke-dasharray="1.4 ${f(period - 1.4)}"/>` +
    `<path d="${ring(r * 0.84)}${ring(r * 0.67)}" stroke-width="1.1"/>${script}</g>` +
    `<g class="ss-i" style="--s:${f(seconds * 0.7)}s"><path d="${star(r * 0.64, 11, 4)}${ring(r * 0.28)}${ring(r * 0.12)}" stroke-width="1.3"/></g>`
  )
}

/** One slab of the folded city: buildings standing on a line `ground` below the centre and reaching up toward it. */
function slab(seed: number, ground: number, span: number, low: number, high: number, wide: readonly [number, number], gap: number): string {
  const next = random(seed)
  let d = ''

  for (let x = -span / 2; x < span / 2; ) {
    const w = wide[0] + next() * (wide[1] - wide[0])
    const h = low + next() * (high - low)
    let top = ground - h

    d += `M${f(x)} ${f(ground + 14)}V${f(top)}h${f(w - 1.5)}V${f(ground + 14)}Z`

    if (next() < 0.35) {
      d += `M${f(x + w * 0.28)} ${f(top)}v${f(-h * 0.16)}h${f(w * 0.4)}v${f(h * 0.16)}Z`
      top -= h * 0.16
    }

    if (next() < 0.18) {
      d += `M${f(x + w * 0.5 - 0.8)} ${f(top)}v-14h1.6v14Z`
    }

    x += w + next() * gap
  }

  return d
}

/** A row of book spines standing on a shelf at `y`, split by colour so each colour is one path. */
function books(seed: number, x0: number, x1: number, shelves: readonly number[], tall: number, tones: number): { spines: string[]; bands: string } {
  const next = random(seed)
  const spines = Array.from({ length: tones }, () => '')
  let bands = ''

  for (const y of shelves) {
    for (let x = Math.round(x0 + next() * 6); x < x1 - 8; ) {
      const w = Math.round(8 + next() * 11)
      const h = Math.round(tall * (0.62 + next() * 0.38))
      const tone = Math.floor(next() * tones)

      spines[tone] += `M${x} ${y}h${w - 1}v${-h}h${1 - w}Z`

      if (next() < 0.15) {
        bands += `M${x + 1} ${y - Math.round(h * 0.82)}h${w - 3}v2h${3 - w}Z`
      }

      x += w + (next() < 0.08 ? 12 : 0)
    }
  }

  return { spines, bands }
}

/** Claude's own emblem, a coral starburst, as the cloak's clasp. */
function starburst(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 16 }, (_, i) => polar(-90 + i * 22.5, i % 2 ? r * 0.38 : i % 4 ? r * 0.72 : r, cx, cy))

  return `<path d="M${pts.join('L')}Z" fill="${CORAL}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.24)}" fill="${HOT}"/>`
}

/** The floating spellbook: two glowing pages over a rune slate the near arm types on. */
function device(light: string, activity: Activity): string {
  const busy = activity === 'responding' || activity === 'tool' || activity === 'run'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="324" width="8" height="3" rx="1" fill="${light}" fill-opacity=".6"/>`).join('')
  const flip = busy
    ? `<g transform="translate(340 250)"><path class="ss-flip" style="animation-duration:${activity === 'responding' ? 1.3 : 0.7}s" ` +
      `d="M0 0Q26 -9 54 -2L57 44Q29 38 0 47Z" fill="${light}" fill-opacity=".92" stroke="#7a3a14" stroke-opacity=".5"/></g>`
    : ''
  const motes = busy
    ? [0, 1, 2, 3]
        .map(i => `<rect class="ss-up" style="--dx:${(i - 1.5) * 14}px;animation-delay:${f(i * 0.5)}s" x="${318 + i * 12}" y="244" width="4" height="4" fill="${light}"/>`)
        .join('')
    : ''
  const disc =
    activity === 'tool'
      ? `<g transform="translate(340 318) scale(1 .26)"><g fill="none" stroke="${light}" stroke-opacity=".9">${sigil(66, 9, 2.6)}</g></g>`
      : ''

  return (
    `<rect x="242" y="322" width="96" height="8" rx="2" fill="#2a2234" stroke="#3e3350"/>${keys}${disc}` +
    `<ellipse class="ss-bkg" cx="340" cy="316" rx="58" ry="7" fill="${light}" fill-opacity=".24"/>` +
    '<g class="ss-bk">' +
    '<path d="M279 252Q310 240 340 250Q370 240 401 250L405 301Q372 291 340 303Q308 291 275 301Z" fill="#3b1d2e" stroke="#5c3047" stroke-width="1.6"/>' +
    `<path d="M284 250Q312 240 339 249V297Q311 288 281 296Z" fill="${light}" fill-opacity=".84"/>` +
    `<path d="M341 249Q368 240 396 248L399 296Q369 288 341 297Z" fill="${light}" fill-opacity=".84"/>` +
    '<path d="M290 259Q312 252 333 257M290 269Q312 262 333 267M290 279Q306 274 324 277M347 257Q368 250 390 256M347 267Q368 260 391 266M347 277Q362 272 382 276" ' +
    'fill="none" stroke="#4a2410" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 2 1 2"/>' +
    '<path d="M340 249V299" stroke="#5c3047" stroke-width="2"/>' +
    `<path d="M352 297L354 318L350 313L346 318L348 298Z" fill="${ACC}"/>` +
    flip +
    motes +
    '</g>'
  )
}

/** A relic floating at (x, y) that drifts to (tx, ty) on the mandala when done. */
function relic(x: number, y: number, tx: number, ty: number, phase: number, body: string): string {
  return (
    `<g transform="translate(${x} ${y})"><g class="ss-rel" style="--tx:${f(tx - x)}px;--ty:${f(ty - y)}px">` +
    `<g class="ss-flt" style="--fd:${phase}s">${body}</g></g></g>`
  )
}

/** A small rune ring that pops up around a relic while Claude thinks. */
function thinkRing(x: number, y: number, r: number, seed: number): string {
  return `<g transform="translate(${x} ${y})"><g class="ss-tr"><g fill="none" stroke="${ACC}" stroke-opacity=".9">${sigil(r, seed, 4, false)}</g></g></g>`
}

export function sorcererSanctumWorld(): World {
  const next = random(9151)

  // The folded city in the window: six slabs standing in from the rim, eight more standing out from a small core.
  const outer = Array.from(
    { length: 6 },
    (_, k) => `<path class="${k === 0 ? 'ss-gnd' : 'ss-fold'}" transform="rotate(${k * 60})" d="${slab(40 + k, 186, 200, 38, 100, [15, 27], 9)}"/>`,
  ).join('')
  const inner = Array.from({ length: 8 }, (_, k) => `<path transform="rotate(${k * 45 + 22.5})" d="${slab(60 + k, -30, 34, 12, 42, [6, 10], 3)}"/>`).join('')
  // Stars as zero-length strokes with round caps: one short subpath each.
  let stars = ''

  for (let i = 0; i < 40; i += 1) {
    const a = next() * Math.PI * 2
    const r = 50 + next() * 122

    stars += `M${Math.round(WX + Math.cos(a) * r)} ${Math.round(WY + Math.sin(a) * r)}h.1`
  }

  const spokes = Array.from({ length: 12 }, (_, k) => `M${polar(k * 30, 150, WX, WY)}L${polar(k * 30, WR, WX, WY)}`).join('')
  const studs = Array.from({ length: 12 }, (_, k) => {
    const a = k * 30 * RAD

    return `M${Math.round(WX + Math.cos(a) * (WR + 11))} ${Math.round(WY + Math.sin(a) * (WR + 11))}h.1`
  }).join('')

  // The back wall's two arched bookcases, barely lit, behind the chat.
  // Its books are a repeating pattern: behind the glass nobody counts them.
  const backRows = [270, 390, 510, 630, 750]
  const backCases = [615, 985]
    .map(
      cx =>
        `<path d="M${cx - 150} 860V236Q${cx - 150} 130 ${cx} 130Q${cx + 150} 130 ${cx + 150} 236V860Z" fill="#0e0c17" stroke="#17131f" stroke-width="3"/>` +
        `<path d="${backRows.map(y => `M${cx - 140} ${y - 92}h280v92h-280Z`).join('')}" fill="url(#ss-bks)"/>` +
        `<path d="${backRows.map(y => `M${cx - 140} ${y}h280v8h-280Z`).join('')}" fill="#15111e"/>`,
    )
    .join('')
  const spinePattern = (() => {
    const b = books(300, 0, 76, [92], 88, 2)

    return (
      '<pattern id="ss-bks" width="72" height="120" y="58" patternUnits="userSpaceOnUse">' +
      `<path d="${b.spines[0]}" fill="#141120"/><path d="${b.spines[1]}" fill="#19141f"/></pattern>`
    )
  })()

  // The tall bookcase at the far right.
  const shelves = [236, 376, 516, 656, 796, 936]
  const right = books(77, 1216, 1600, shelves.slice(0, 5), 118, 5)
  const tones = ['#22141c', '#141b2e', '#231d12', '#1c1326', '#15211d']
  const embers = (count: number, x0: number, x1: number, seed: number) => {
    const rnd = random(seed)

    return Array.from({ length: count }, () => {
      const style = `--d:${f(6 + rnd() * 5)}s;--dx:${f((rnd() - 0.5) * 60)}px;--t:${f(-rnd() * 10)}s`

      return `<circle class="ss-mote" style="${style}" cx="${f(x0 + rnd() * (x1 - x0))}" cy="${f(560 + rnd() * 380)}" r="${f(1.4 + rnd() * 1.8)}" fill="${ACC}"/>`
    }).join('')
  }

  // The portal's sparks, thrown off the rim and spiralling out.
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const style = `--d:${f(0.9 + next() * 0.6)}s;--dx:${f(50 + next() * 70)}px;--dy:${f(-20 - next() * 50)}px;--t:${f(1 + i * 0.06)}s`

    return `<g transform="rotate(${f(i * 20 + next() * 10)}) translate(0 -137)"><path class="ss-spk" style="${style}" d="M0 0l-16 -3"/></g>`
  }).join('')

  // The shattered circle: ten arcs that fly apart, and embers that drift down.
  const shards = Array.from({ length: 10 }, (_, i) => {
    const a = i * 36 + 4
    const out = 90 + next() * 80
    // Those flying left stop short of the chat column and fall instead.
    const left = Math.cos(a * RAD) < 0
    const dx = Math.max(Math.cos(a * RAD) * out, -45)
    const style = `--dx:${f(dx)}px;--dy:${f(Math.sin(a * RAD) * out + (left ? 90 : 50))}px;--r:${f((next() - 0.5) * 140)}deg`
    const d =
      `M${polar(a - 15, 126, PX, PY)}A126 126 0 0 1 ${polar(a + 15, 126, PX, PY)}` +
      `L${polar(a + 13, 110, PX, PY)}A110 110 0 0 0 ${polar(a - 13, 110, PX, PY)}Z`

    return `<path class="ss-sh" style="${style}" d="${d}"/>`
  }).join('')
  const fallen = Array.from({ length: 10 }, () => {
    const a = next() * 360
    const style = `--dx:${f(Math.cos(a * RAD) * 30 + (next() - 0.5) * 30)}px;--dy:${f(70 + next() * 100)}px;--t:${f(0.8 + next() * 0.7)}s`

    return `<circle class="ss-emb" style="${style}" cx="${f(PX + Math.cos(a * RAD) * 118)}" cy="${f(PY + Math.sin(a * RAD) * 118)}" r="${f(1.8 + next() * 1.6)}"/>`
  }).join('')

  // The mandala the relics align on: they sit on its ring at -150, -30 and 90 degrees.
  const seats: [number, number][] = [-150, -30, 90].map(a => [PX + Math.cos(a * RAD) * 150, PY + Math.sin(a * RAD) * 150])
  const petals = Array.from(
    { length: 12 },
    (_, k) => `M${polar(k * 30, 60)}Q${polar(k * 30 - 13, 102)} ${polar(k * 30, 138)}Q${polar(k * 30 + 13, 102)} ${polar(k * 30, 60)}Z`,
  ).join('')

  const orb =
    '<circle class="ss-orbl" r="46" fill="url(#ss-orbg)"/>' +
    [0, 0.6, 1.2].map(d => `<circle class="ss-rip" style="animation-delay:${d}s" r="30" fill="none" stroke="#8fe6f2" stroke-width="2"/>`).join('') +
    '<circle r="24" fill="url(#ss-orbf)" stroke="#8fe6f2" stroke-opacity=".55" stroke-width="1.5"/>' +
    '<g class="ss-swirl"><path d="M-15 2Q-8 -14 0 0T15 -2" fill="none" stroke="#d8fbff" stroke-opacity=".65" stroke-width="2"/></g>' +
    '<path d="M-11 -14Q-4 -20 5 -19" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>' +
    `<ellipse cy="31" rx="20" ry="5" fill="none" stroke="${ACC}" stroke-opacity=".7" stroke-width="1.6"/>`
  const hourglass =
    '<circle r="52" fill="url(#ss-hgg)"/>' +
    '<g class="ss-hg"><g transform="scale(1.3)">' +
    `<path d="M-13 -19L-11 19M13 -19L11 19" stroke="${BRASS}" stroke-width="2.4"/>` +
    '<path d="M-9 -19Q-9 -4 0 0Q9 -4 9 -19ZM-9 19Q-9 4 0 0Q9 4 9 19Z" fill="#cfe6ff" fill-opacity=".12" stroke="#cfe6ff" stroke-opacity=".5" stroke-width="1.4"/>' +
    `<path d="M-6 -12Q0 -9 6 -12Q4 -5 0 -2Q-4 -5 -6 -12Z" fill="${HOT}" fill-opacity=".9"/><path d="M-8 18Q0 8 8 18Z" fill="${HOT}" fill-opacity=".9"/>` +
    `<path class="ss-sand" d="M0 -1V15" stroke="${HOT}" stroke-width="1.4" stroke-dasharray="2 2"/>` +
    `<g fill="${BRASS}"><rect x="-17" y="-25" width="34" height="6" rx="2"/><rect x="-17" y="19" width="34" height="6" rx="2"/></g></g></g>`
  const tome =
    // The page block, which glows once the cover swings open.
    `<rect x="-30" y="-20" width="60" height="40" rx="2" fill="${PAPER}" fill-opacity=".25"/>` +
    `<g class="ss-pgl"><rect x="-30" y="-20" width="60" height="40" rx="2" fill="${HOT}" fill-opacity=".85"/>` +
    '<path d="M-23 -10H23M-23 -1H18M-23 8H20" stroke="#6a3410" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 2 1 2"/></g>' +
    // The leather cover, hinged at its spine on the right so it opens over the shelves, with brass corners and a rune seal.
    '<g transform="translate(32 0)"><g class="ss-cov"><rect x="-64" y="-22" width="64" height="44" rx="3" fill="#5a2a1e" stroke="#7a3e2a" stroke-width="1.6"/>' +
    `<rect x="-9" y="-22" width="9" height="44" rx="2" fill="#3a170f"/><path d="M-54 -22h-10v10M-54 22h-10v-10" fill="none" stroke="${BRASS}" stroke-width="3"/>` +
    `<path transform="translate(-37 0)" d="${ring(11)}${star(9, 11, 4)}" fill="none" stroke="${ACC}" stroke-opacity=".75" stroke-width="1.4"/></g></g>` +
    // The chains that bind it, their broken ends hanging.
    '<g class="ss-chain" fill="none" stroke="#7d768a" stroke-width="2.4" stroke-dasharray="4 2.5" stroke-linecap="round">' +
    '<path d="M-36 -12L36 12M-36 12L36 -12M-35 13Q-41 30 -33 46M35 13Q41 28 34 40"/>' +
    '<rect x="-6" y="-5" width="12" height="10" rx="2" fill="#a08a50" stroke="none"/></g>'
  const rise = [0, 1, 2]
    .map(i => `<rect class="ss-rise" style="animation-delay:${f(1 + i * 0.7)}s;--dx:${(i - 1) * 16}px" x="${-6 + i * 6}" y="-20" width="4" height="4" fill="${HOT}"/>`)
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'tea',
      thought: 'orbs',
      ink: '#05040a',
      furniture: WOOD,
      metal: '#2a2234',
      paper: PAPER,
      light: { idle: '#c46a2c', work: ACC, bright: '#ffcf8a' },
      headTop: 220,
      glowAt: [340, 270],
      device,
      wear: {
        behind:
          // The cloak falling behind, swaying a little, and its high flared collar standing up behind the head.
          `<path class="ss-cape" d="M62 258H238L262 368Q240 380 214 372Q182 384 150 374Q118 384 86 372Q60 380 38 368Z" fill="${CLOAK_DK}" stroke="#0a1030" stroke-width="2"/>` +
          `<path d="M76 306L26 198Q40 186 56 190Q150 262 244 190Q260 186 274 198L224 306Z" fill="${LINING}" stroke="${CLOAK_DK}" stroke-width="3" stroke-linejoin="round"/>` +
          `<path d="M44 198L72 280M100 214L104 236M200 214L196 236M256 198L228 280" stroke="${CLOAK_DK}" stroke-width="2.4" stroke-opacity=".8"/>` +
          `<path d="M76 306L26 198Q40 186 56 190Q150 262 244 190Q260 186 274 198L224 306" fill="none" stroke="${TRIM}" stroke-opacity=".85" stroke-width="2.6" stroke-linejoin="round"/>`,
        front:
          // The cloak's front edges down the sides of the body, clear of the eyes, and the robe with its clasp.
          `<path d="M70 262L88 280V320H70Z" fill="${CLOAK}"/><path d="M230 262L212 280V320H230Z" fill="${CLOAK}"/>` +
          `<path d="M70 262L88 280V320M230 262L212 280V320" fill="none" stroke="${TRIM}" stroke-opacity=".8" stroke-width="2"/>` +
          `<path d="M66 318H234V352H66Z" fill="${CLOAK}" stroke="${CLOAK_DK}" stroke-width="2"/>` +
          `<path d="M66 320H234" stroke="${TRIM}" stroke-opacity=".85" stroke-width="2.4"/><path d="M150 324V352" stroke="${CLOAK_DK}" stroke-width="2"/>` +
          starburst(150, 334, 10),
      },
      seatArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><path d="M104 348H198L194 362H108Z"/>` +
        '<path d="M112 362L104 452H116L122 362ZM180 362L186 452H198L190 362Z"/><rect x="110" y="410" width="82" height="7" rx="2"/></g>' +
        `<g fill="${WOOD_EDGE}"><circle cx="110" cy="453" r="5"/><circle cx="192" cy="453" r="5"/></g>`,
      tableArt:
        `<g fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="13" rx="2"/>` +
        '<path d="M174 343H462V360Q318 374 174 360Z"/><path d="M184 360H198L194 456H186ZM440 360H454L452 456H444Z"/></g>' +
        `<path d="M206 352H430" stroke="${ACC}" stroke-opacity=".32" stroke-width="1.4" stroke-dasharray="6 4 2 4"/>` +
        '<rect x="412" y="318" width="52" height="12" rx="1" fill="#2c1824" stroke="#4a2a3a"/>' +
        '<rect x="416" y="307" width="44" height="11" rx="1" fill="#1a2140" stroke="#2e3a66"/>' +
        '<rect x="420" y="298" width="36" height="9" rx="1" fill="#2a2416" stroke="#4a4024"/>',
    },
    style:
      // Ambient: the folded city turns, the spell circles turn, relics float, embers rise, the cloak sways.
      '.ss-o{animation:mv-spin var(--s,60s) linear infinite}.ss-i{animation:mv-spin-back var(--s,40s) linear infinite}' +
      '.ss-kal{animation:mv-spin 150s linear infinite}.ss-kal2{animation:mv-spin-back 100s linear infinite}' +
      '.ss-fold2{animation:ss-breath 9s ease-in-out infinite alternate}@keyframes ss-breath{from{transform:scale(.93)}to{transform:scale(1.06)}}' +
      '.ss-arm{animation:mv-spin 40s linear infinite}.ss-swirl{animation:mv-spin 7s linear infinite}' +
      '.ss-flt{animation:ss-flt 6s ease-in-out var(--fd,0s) infinite alternate}@keyframes ss-flt{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
      '.ss-mote{opacity:0;animation:ss-mote var(--d) linear var(--t) infinite}' +
      '@keyframes ss-mote{0%{opacity:0;transform:translate(0,0)}20%{opacity:.75}100%{opacity:0;transform:translate(var(--dx),-170px)}}' +
      '.ss-cape{transform-box:fill-box;transform-origin:50% 0;animation:ss-cape 4.6s ease-in-out infinite alternate}' +
      '@keyframes ss-cape{from{transform:skewX(-4deg)}to{transform:skewX(4deg)}}' +
      '.ss-bk{animation:ss-bk 4s ease-in-out infinite alternate}@keyframes ss-bk{from{transform:translateY(-3px)}to{transform:translateY(3px)}}' +
      '.ss-flip{animation:ss-flip 1.3s ease-in-out infinite}@keyframes ss-flip{0%,15%{transform:scaleX(1)}60%,100%{transform:scaleX(-1)}}' +
      '.ss-up{opacity:0;animation:ss-up 2s ease-out infinite}@keyframes ss-up{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-70px)}}' +
      '.ss-sand{animation:ss-trk .6s linear infinite}@keyframes ss-trk{to{stroke-dashoffset:-4}}' +
      '.ss-dorm{opacity:.45}.ss-amb{opacity:.75}.ss-tsig{opacity:.55}.ss-ward{opacity:.4}' +
      '@keyframes ss-show{to{opacity:1}}@keyframes ss-out{to{opacity:0}}@keyframes ss-fade{to{opacity:.07}}' +
      // Thinking: rune rings pop up around the relics and the hourglass turns over.
      '.ss-tr{opacity:0}.st-thinking .ss-tr{animation:ss-pop .9s cubic-bezier(.3,1.4,.5,1) both}' +
      '@keyframes ss-pop{from{opacity:0;transform:scale(.3)}to{opacity:.9;transform:scale(1)}}' +
      '.st-thinking .ss-hg{animation:ss-turn 1.4s cubic-bezier(.6,0,.3,1) .4s both}@keyframes ss-turn{to{transform:rotate(180deg)}}' +
      '.st-thinking .ss-dorm{opacity:.5}' +
      // Responding and tool: the circles quicken, the inner city folds in and out.
      '.st-responding .ss-amb .ss-o,.st-responding .ss-tsig .ss-o{animation-duration:14s}' +
      '.st-tool .ss-dorm{opacity:.65}.st-tool .ss-dorm .ss-o{animation-duration:7s}.st-tool .ss-dorm .ss-i{animation-duration:5s}' +
      '.st-tool .ss-fold2{animation-duration:1.6s}.st-tool .ss-kal{animation-duration:50s}' +
      // Read: the chained tome sheds its chains and opens on glowing pages.
      '.st-read .ss-chain{animation:ss-drop 1s ease-in both}@keyframes ss-drop{to{opacity:0;transform:translateY(28px)}}' +
      '.st-read .ss-cov{animation:ss-opn .9s ease-in-out .4s both}@keyframes ss-opn{to{transform:scaleX(-1)}}' +
      '.ss-pgl,.ss-rise{opacity:0}.st-read .ss-pgl{animation:ss-show .5s ease-out .8s both}' +
      '.st-read .ss-rise{animation:ss-rise 2.2s ease-out infinite}' +
      '@keyframes ss-rise{0%{opacity:0;transform:translate(0,0)}20%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),-60px)}}' +
      // Web: the scrying orb lights up and sends out ripples.
      '.ss-orbl{opacity:.45}.st-web .ss-orbl{animation:ss-pulse 1s ease-in-out infinite alternate}@keyframes ss-pulse{from{opacity:.55}to{opacity:1}}' +
      '.ss-rip{opacity:0}.st-web .ss-rip{animation:ss-rip 1.8s ease-out infinite}@keyframes ss-rip{0%{opacity:.85;transform:scale(.6)}100%{opacity:0;transform:scale(2.3)}}' +
      '.st-web .ss-swirl{animation-duration:1.3s}' +
      // Run: a spell circle draws itself, its rim catches in sparks and it opens on another sky.
      '.ss-pt,.ss-er,.ss-man{display:none}.st-run .ss-pt,.st-error .ss-er,.st-done .ss-man{display:inline}' +
      '.st-run .ss-dorm,.st-error .ss-dorm,.st-done .ss-dorm{animation:ss-out .5s ease-out both}' +
      '.ss-drw{stroke-dasharray:1 1;stroke-dashoffset:1;animation:ss-drw 1.1s cubic-bezier(.4,0,.2,1) both}@keyframes ss-drw{to{stroke-dashoffset:0}}' +
      '.ss-st{stroke-dasharray:1 1;stroke-dashoffset:1;animation:ss-st 2.2s ease-out .4s both}' +
      '@keyframes ss-st{45%{stroke-dashoffset:0;opacity:1}70%{opacity:.9}100%{stroke-dashoffset:0;opacity:.15}}' +
      '.ss-fi{opacity:0;animation:ss-show .6s ease-out both}' +
      '.ss-pin{transform:scale(0);animation:ss-grow 1s cubic-bezier(.2,.9,.3,1) 1.1s both}@keyframes ss-grow{from{transform:scale(0)}to{transform:scale(1)}}' +
      '.ss-srg{opacity:0;animation:ss-show .3s ease-out 1s both,mv-spin 1.3s linear infinite}' +
      '.ss-srg2{opacity:0;animation:ss-show .3s ease-out 1.05s both,mv-spin-back 2s linear infinite}' +
      '.ss-spk{opacity:0;animation:ss-spk var(--d) ease-out var(--t) infinite}' +
      '@keyframes ss-spk{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-run .ss-kal{animation-duration:22s}.st-run .ss-kal2{animation-duration:14s}' +
      // Error: a circle snaps together, shudders and shatters; embers drift down; the window glass cracks.
      '.ss-jit{animation:ss-jit .12s linear .25s 5}@keyframes ss-jit{0%,100%{transform:translate(0,0)}33%{transform:translate(-3px,2px)}66%{transform:translate(3px,-2px)}}' +
      '.ss-sh{opacity:0;transform-box:fill-box;transform-origin:center;animation:ss-sh 2.8s cubic-bezier(.3,.6,.4,1) both}' +
      '@keyframes ss-sh{0%{opacity:0;transform:translate(0,0) rotate(0)}10%{opacity:.95}30%{opacity:.95;transform:translate(0,0) rotate(0)}' +
      '100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.ss-est{opacity:0;animation:ss-est 1.4s ease-out both}@keyframes ss-est{15%{opacity:.9}55%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.3) rotate(30deg)}}' +
      '.ss-emb{opacity:0;animation:ss-emb 2.2s ease-out var(--t) both}@keyframes ss-emb{0%{opacity:0;transform:translate(0,0)}12%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.ss-crk{stroke-dasharray:1 1;stroke-dashoffset:1}.st-error .ss-crk{animation:ss-drw .6s ease-out .5s both}' +
      '.st-error .ss-kal{animation:ss-jolt .5s ease-in-out 3}@keyframes ss-jolt{0%,100%{transform:rotate(0)}30%{transform:rotate(-7deg)}70%{transform:rotate(5deg)}}' +
      '.st-error .ss-flt{animation:ss-shk .3s ease-in-out 6}@keyframes ss-shk{0%,100%{transform:translate(0,0)}25%{transform:translate(-4px,2px)}75%{transform:translate(4px,-2px)}}' +
      // Done: the relics drift onto the mandala as it blooms; the folded city turns upright and settles into a dawn.
      '.st-done .ss-rel{animation:ss-align 1.6s cubic-bezier(.5,0,.2,1) .1s both}@keyframes ss-align{to{transform:translate(var(--tx),var(--ty))}}' +
      '.ss-mg{animation:ss-mand 2s cubic-bezier(.2,.8,.3,1) .8s both}' +
      '@keyframes ss-mand{from{opacity:0;transform:scale(.4) rotate(-40deg)}to{opacity:1;transform:scale(1) rotate(0)}}' +
      '.st-done .ss-kal{animation:ss-settle 2.8s cubic-bezier(.2,.8,.2,1) both}@keyframes ss-settle{from{transform:rotate(-50deg)}to{transform:rotate(0)}}' +
      '.st-done .ss-kal2{animation:ss-settle2 2.8s cubic-bezier(.2,.8,.2,1) both}@keyframes ss-settle2{from{transform:rotate(60deg)}to{transform:rotate(0)}}' +
      '.st-done .ss-fold,.st-done .ss-fold2{animation:ss-fade 2.2s ease-in .3s both}' +
      '.ss-dawn{opacity:0}.st-done .ss-dawn{animation:ss-show 2.4s ease-out .6s both}' +
      '.st-done .ss-ward{animation:ss-ward 2s ease-out .6s both}@keyframes ss-ward{to{opacity:.9}}' +
      // Power-up, helpers and the rig's quieter moments.
      '.ultra .ss-amb .ss-o,.ultra .ss-dorm .ss-o{animation-duration:9s}.ultra .ss-dorm{opacity:.5}' +
      '.helper .ss-tsig{opacity:.9}.helper .ss-tsig .ss-o{animation-duration:10s}' +
      '.st-sleeping .ss-bkg{opacity:.35}.st-sleeping .ss-dorm{opacity:.16}' +
      '.st-startled .ss-flt{animation:ss-shk .3s ease-in-out 2}',
    scenery:
      '<defs>' +
      '<linearGradient id="ss-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07060d"/><stop offset=".55" stop-color="#0b0a14"/><stop offset="1" stop-color="#0f0c19"/></linearGradient>' +
      '<radialGradient id="ss-sky"><stop offset="0" stop-color="#4e54a6"/><stop offset=".32" stop-color="#2a3078"/><stop offset=".55" stop-color="#454c98"/><stop offset=".72" stop-color="#6a6cb6"/><stop offset=".86" stop-color="#4a5098"/><stop offset="1" stop-color="#161a40"/></radialGradient>' +
      '<linearGradient id="ss-dawnf" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#ff9a3c" stop-opacity="0"/><stop offset=".72" stop-color="#ff9a3c" stop-opacity=".4"/><stop offset="1" stop-color="#ffc98a" stop-opacity=".6"/></linearGradient>' +
      `<radialGradient id="ss-halo"><stop offset="0" stop-color="${ACC}" stop-opacity=".3"/><stop offset=".5" stop-color="${ACC}" stop-opacity=".1"/><stop offset="1" stop-color="${ACC}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="ss-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb0ff" stop-opacity=".07"/><stop offset="1" stop-color="#9fb0ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ss-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a14" stop-opacity="0"/><stop offset="1" stop-color="#0b0a14" stop-opacity=".8"/></linearGradient>' +
      '<pattern id="ss-w1" width="16" height="22" patternUnits="userSpaceOnUse"><rect width="16" height="22" fill="#0e1330"/>' +
      '<path d="M2 3h3v4h-3zM10 12h3v4h-3z" fill="#ffc777" fill-opacity=".78"/><path d="M10 3h3v4h-3zM2 12h3v4h-3z" fill="#a8bcff" fill-opacity=".38"/></pattern>' +
      '<pattern id="ss-w2" width="8" height="12" patternUnits="userSpaceOnUse"><rect width="8" height="12" fill="#0e1330"/>' +
      '<path d="M1.5 2h1.8v2.6h-1.8zM5 7h1.8v2.6h-1.8z" fill="#ffc777" fill-opacity=".8"/></pattern>' +
      spinePattern +
      `<clipPath id="ss-wc"><circle cx="${WX}" cy="${WY}" r="${WR}"/></clipPath>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ss-bg)"/>' +
      // The ceiling and the gallery rail of the upper floor.
      '<rect width="1600" height="40" fill="#07060c"/><rect y="38" width="1600" height="8" fill="#17121f"/><rect y="88" width="1600" height="8" fill="#17121f"/>' +
      '<path d="M0 67H1600" stroke="#120e1a" stroke-width="42" stroke-dasharray="6 22"/>' +
      backCases +
      // Wainscot under the window and the window seat.
      '<rect y="662" width="430" height="200" fill="#0d0a14"/><path d="M20 690h120v150h-120ZM160 690h120v150h-120ZM300 690h110v150h-110Z" fill="none" stroke="#18141f" stroke-width="3"/>' +
      `<rect x="-10" y="642" width="446" height="20" rx="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
      '<rect x="24" y="628" width="190" height="16" rx="8" fill="#1a2250"/>' +
      '<rect x="300" y="622" width="62" height="20" rx="1" fill="#2b1923"/><rect x="306" y="610" width="50" height="12" rx="1" fill="#192239"/>' +
      // A faint fall of light from the window.
      '<path d="M330 560L420 500L640 1000H360Z" fill="url(#ss-beam)"/>' +
      // The round window: a stone surround, the folded city behind the glass, mullions, a frame carved with runes.
      `<circle cx="${WX}" cy="${WY}" r="${WR + 34}" fill="#0d0a15" stroke="#1f1828" stroke-width="3"/>` +
      `<g clip-path="url(#ss-wc)"><circle cx="${WX}" cy="${WY}" r="${WR}" fill="url(#ss-sky)"/>` +
      `<path d="${stars}" stroke="#d8deff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>` +
      `<circle class="ss-dawn" cx="${WX}" cy="${WY}" r="${WR}" fill="url(#ss-dawnf)"/>` +
      `<g transform="translate(${WX} ${WY})"><g class="ss-kal"><g fill="url(#ss-w1)" stroke="#34428a" stroke-width="1">${outer}</g></g>` +
      `<g class="ss-fold2"><g class="ss-kal2"><g fill="url(#ss-w2)" stroke="#34428a" stroke-width="1">${inner}</g>` +
      '<circle r="30" fill="#0e1330" stroke="#34428a" stroke-width="1.5"/></g></g></g>' +
      `<path class="ss-crk" pathLength="1" d="M260 380L300 352L322 330L352 318M260 380L236 340L228 300L206 270M260 380L300 410L330 452M260 380L222 404L180 410L140 440" fill="none" stroke="#e6edff" stroke-opacity=".6" stroke-width="1.6"/>` +
      '</g>' +
      `<path d="M${polar(200, WR - 8, WX, WY)}A${WR - 8} ${WR - 8} 0 0 1 ${polar(268, WR - 8, WX, WY)}" fill="none" stroke="#c8d4ff" stroke-opacity=".12" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="${spokes}${ring(150, WX, WY)}" fill="none" stroke="#1a1322" stroke-width="4"/>` +
      `<circle cx="${WX}" cy="${WY}" r="${WR + 11}" fill="none" stroke="${WOOD}" stroke-width="22"/>` +
      `<path d="${ring(WR, WX, WY)}${ring(WR + 22, WX, WY)}" fill="none" stroke="#3a2c40" stroke-width="2"/>` +
      `<g class="ss-ward" transform="translate(${WX} ${WY})" fill="none" stroke="${ACC}">${band(WR + 11, 8, 12)}</g>` +
      `<path d="${studs}" stroke="#4a3a4a" stroke-width="7" stroke-linecap="round"/>` +
      // A spell circle hanging above the window.
      `<g transform="translate(322 140)"><g class="ss-amb" fill="none" stroke="${ACC}"><circle r="92" fill="url(#ss-halo)" stroke="none"/>${sigil(56, 3, 50, false)}</g></g>` +
      // The floor, a brass armillary and stacked books under the window.
      '<g class="mv-b"><rect y="860" width="1600" height="200" fill="#09070f"/><path d="M0 860H1600" stroke="#1d1726" stroke-width="3"/>' +
      `<path d="${Array.from({ length: 17 }, (_, i) => `M${800 + (i - 8) * 60} 860L${800 + (i - 8) * 210} 1000`).join('')}" stroke="#120e19" stroke-width="2"/>` +
      '<ellipse cx="800" cy="940" rx="380" ry="44" fill="none" stroke="#2a1e18" stroke-opacity=".7" stroke-width="3"/>' +
      `<path d="M308 860L322 838H338L352 860Z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/><path d="M330 838V814" stroke="${BRASS}" stroke-width="3"/>` +
      `<g transform="translate(330 770)"><circle r="44" fill="none" stroke="${BRASS}" stroke-opacity=".8" stroke-width="3"/>` +
      `<g class="ss-arm" fill="none" stroke="${BRASS}" stroke-opacity=".65" stroke-width="2"><ellipse rx="44" ry="13" transform="rotate(-24)"/><ellipse rx="13" ry="44" transform="rotate(30)"/></g>` +
      `<circle r="7" fill="${ACC}" fill-opacity=".85"/></g>` +
      '<rect x="40" y="838" width="110" height="22" rx="1" fill="#23182f"/><rect x="50" y="818" width="92" height="20" rx="1" fill="#2d2617"/><rect x="58" y="802" width="76" height="16" rx="1" fill="#192239"/>' +
      `${embers(9, 30, 400, 5)}</g>` +
      // The tall bookcase at the far right, a spell circle above it, embers rising in front.
      '<g class="mv-r"><rect x="1196" y="96" width="420" height="920" fill="#0d0a15"/>' +
      `<path d="${shelves.map(y => `M1214 ${y}h404v10h-404Z`).join('')}" fill="${WOOD}"/>` +
      tones.map((tone, i) => `<path d="${right.spines[i]}" fill="${tone}"/>`).join('') +
      `<path d="${right.bands}" fill="#7a5a38" fill-opacity=".25"/>` +
      `<rect x="1196" y="96" width="18" height="920" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/><rect x="1186" y="84" width="430" height="18" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/>` +
      '<rect x="1196" y="560" width="420" height="440" fill="url(#ss-shade)"/>' +
      `<g class="mv-t"><g transform="translate(1478 168)"><g class="ss-tsig" fill="none" stroke="${ACC}"><circle r="104" fill="url(#ss-halo)" stroke="none"/>${sigil(64, 8, 70, false)}</g></g></g>` +
      `${embers(8, 1230, 1580, 6)}</g>`,
    nook:
      '<defs>' +
      '<radialGradient id="ss-orbf" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#e2fcff"/><stop offset=".35" stop-color="#5fd0e0"/><stop offset="1" stop-color="#0f3352"/></radialGradient>' +
      '<radialGradient id="ss-orbg"><stop offset="0" stop-color="#5fd0e0" stop-opacity=".4"/><stop offset="1" stop-color="#5fd0e0" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="ss-hgg"><stop offset="0" stop-color="${HOT}" stop-opacity=".22"/><stop offset="1" stop-color="${HOT}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="ss-psky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16345e"/><stop offset=".42" stop-color="#4c74a6"/><stop offset=".56" stop-color="#f0a464"/><stop offset=".7" stop-color="#ffcf8e"/></linearGradient>' +
      '<clipPath id="ss-pc"><circle r="128"/></clipPath>' +
      '</defs>' +
      // The dormant spell circle that waits above the desk.
      `<g class="ss-dorm"><g transform="translate(${PX} ${PY})"><circle r="170" fill="url(#ss-halo)"/><g fill="none" stroke="${ACC}">${sigil(116, 21, 90)}</g></g></g>` +
      // Run: the portal.
      `<g class="ss-pt"><circle class="ss-fi" style="animation-delay:.6s" cx="${PX}" cy="${PY}" r="205" fill="url(#ss-halo)"/>` +
      `<g transform="translate(${PX} ${PY})"><g class="ss-pin"><g clip-path="url(#ss-pc)"><rect x="-130" y="-130" width="260" height="260" fill="url(#ss-psky)"/>` +
      '<circle cx="32" cy="10" r="40" fill="#ffe0b0" fill-opacity=".3"/><circle cx="32" cy="10" r="17" fill="#fff0d2" fill-opacity=".95"/>' +
      '<path d="M-130 40L-90 0L-60 18L-20 -28L14 6L50 -18L90 20L130 -6V130H-130Z" fill="#2b4a78"/>' +
      '<path d="M-20 -28L-30 -14L-22 -16L-14 -10L-8 -18ZM50 -18L42 -8L50 -10L58 -6ZM-90 0L-98 8L-88 6L-82 9Z" fill="#dce9f7" fill-opacity=".85"/>' +
      '<path d="M-130 72L-96 38L-64 60L-30 22L6 54L40 32L80 66L130 42V130H-130Z" fill="#142443"/></g></g>' +
      `<g fill="none" stroke="${ACC}"><path class="ss-drw" style="animation-delay:.1s" pathLength="1" d="${ring(140)}" stroke-width="3.4"/>` +
      `<path class="ss-drw" style="animation-delay:.3s" pathLength="1" d="${ring(118)}" stroke-width="1.6"/>` +
      `<g class="ss-fi" style="animation-delay:.45s"><g class="ss-o" style="--s:12s"><circle r="129" stroke-width="5" stroke-dasharray="1.4 12.1"/>` +
      `<path d="${runes(108, 18, 6, 33)}" stroke-width="1.6" stroke-linecap="round"/></g></g>` +
      `<path class="ss-st" pathLength="1" d="${star(116, 11, 4)}" stroke-width="1.6"/></g>` +
      `<circle class="ss-srg" r="135" fill="none" stroke="${HOT}" stroke-width="7" stroke-dasharray="2 10" stroke-linecap="round"/>` +
      `<circle class="ss-srg2" r="141" fill="none" stroke="${ACC}" stroke-width="4" stroke-dasharray="12 6 3 9"/>` +
      `<g stroke="${HOT}" stroke-width="3.2" stroke-linecap="round">${sparks}</g></g></g>` +
      // Error: the shattering circle.
      `<g class="ss-er"><g class="ss-jit"><g fill="${EMBER}" fill-opacity=".28" stroke="${HOT}" stroke-width="1.6">${shards}</g>` +
      `<g transform="translate(${PX} ${PY})"><path class="ss-est" d="${star(100, 11, 4)}${ring(44)}" fill="none" stroke="${EMBER}" stroke-width="1.8"/></g></g>` +
      `<g fill="${HOT}">${fallen}</g></g>` +
      // Done: the mandala.
      `<g class="ss-man"><g transform="translate(${PX} ${PY})"><g class="ss-mg"><circle r="230" fill="url(#ss-halo)"/>` +
      `<g fill="none" stroke="${ACC}"><path d="${ring(150)}" stroke-width="3"/><path d="${ring(163)}${ring(137)}" stroke-width="1.2"/>` +
      `<path d="${petals}" fill="${ACC}" fill-opacity=".1" stroke-width="1.5"/>` +
      `<g class="ss-o" style="--s:40s" stroke="${HOT}">${band(150, 9, 44)}</g>${sigil(56, 17, 16, false)}</g>` +
      `<circle r="12" fill="${HOT}" fill-opacity=".9"/></g></g></g>` +
      // The floating relics, each with the rune ring that wakes around it while Claude thinks.
      thinkRing(76, -222, 44, 51) +
      thinkRing(368, -210, 48, 52) +
      thinkRing(72, 30, 54, 53) +
      relic(76, -222, seats[0]![0], seats[0]![1], -1.5, orb) +
      relic(368, -210, seats[1]![0], seats[1]![1], -4, hourglass) +
      relic(72, 30, seats[2]![0], seats[2]![1], -2.6, tome + rise),
  }
}
