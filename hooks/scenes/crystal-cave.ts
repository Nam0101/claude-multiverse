import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Crystal Cave: a vast cavern of glowing violet and pink crystal. Giant hexagonal columns rise out of a still
// underground lake that mirrors them, crystals hang from the ceiling, and a great geode sits in the water at the
// left. Claude is a crystal miner in a hard hat with a headlamp, the laptop on a mine cart full of ore. A command
// makes the crystals resonate: a slow wave of light runs across the columns and the hum spreads as rings. An error
// cracks the giant column and its shards fall into the lake; done splits the geode open to its blazing core.
const WATER = 785
const IRON = '#2a2232'
const IRON_EDGE = '#4c3e5a'
const WOOD = '#3a2618'
const WOOD_DARK = '#24160e'

type Hue = 'v' | 'p'
type Column = { x: number; s: number; h: number; lean: number; hue: Hue; tip: number }

/** A tip's three facets and the edge highlight, per hue. */
const TIPS: Record<Hue, readonly [string, string, string, string]> = {
  v: ['#5e2c92', '#9a50d8', '#dba0ff', '#f2d4ff'],
  p: ['#7e2470', '#c84ea6', '#ffaee4', '#ffd8f2'],
}
/** The two sides of a small crystal, per hue. */
const SMALL: Record<Hue, readonly [string, string]> = {
  v: ['#4a2276', '#b46cf0'],
  p: ['#6a1e60', '#ec74c8'],
}

// The columns at the left, back to front, the giant last; and the ones at the right behind the desk.
const LEFT: readonly Column[] = [
  { x: -20, s: 46, h: 560, lean: 8, hue: 'v', tip: 6 },
  { x: 300, s: 40, h: 470, lean: 10, hue: 'p', tip: -4 },
  { x: 60, s: 34, h: 400, lean: -6, hue: 'p', tip: 4 },
  { x: 392, s: 22, h: 250, lean: -6, hue: 'v', tip: 3 },
]
const GIANT: Column = { x: 178, s: 58, h: 640, lean: 2, hue: 'v', tip: -6 }
const CRACK = 330
const RIGHT: readonly Column[] = [
  { x: 1600, s: 38, h: 340, lean: -14, hue: 'p', tip: 0 },
  { x: 1520, s: 40, h: 470, lean: 8, hue: 'v', tip: 4 },
  { x: 1268, s: 28, h: 360, lean: 10, hue: 'v', tip: -3 },
  { x: 1392, s: 52, h: 600, lean: -4, hue: 'p', tip: 5 },
  { x: 1226, s: 16, h: 190, lean: 12, hue: 'p', tip: 0 },
]

const pt = (x: number, y: number): string => `${f(x)} ${f(y)}`

/** A point of a shape drawn standing at (0, 0), turned `deg` about its foot at (bx, by). */
function turn(x: number, y: number, bx: number, by: number, deg: number): string {
  const a = (deg * Math.PI) / 180

  return pt(bx + x * Math.cos(a) - y * Math.sin(a), by + x * Math.sin(a) + y * Math.cos(a))
}

/** A small crystal as two path pieces, its shadow side and its lit side, already placed. */
function shard(bx: number, by: number, s: number, h: number, deg: number): { dark: string; lit: string } {
  const p = (x: number, y: number) => turn(x, y, bx, by, deg)
  const top = -h
  const apex = p(0, top - s * 1.4)

  return {
    dark: `M${p(-s, 0)}L${p(-s, top)}L${apex}L${p(0, top + s * 0.3)}L${p(0, 0)}Z`,
    lit: `M${p(0, 0)}L${p(0, top + s * 0.3)}L${apex}L${p(s, top)}L${p(s, 0)}Z`,
  }
}

/** Small crystals, grouped by hue into four paths. */
function shards(list: readonly (readonly [number, number, number, number, number, Hue])[], opacity = 1): string {
  const parts: Record<Hue, { dark: string; lit: string }> = { v: { dark: '', lit: '' }, p: { dark: '', lit: '' } }

  for (const [x, y, s, h, deg, hue] of list) {
    const one = shard(x, y, s, h, deg)

    parts[hue].dark += one.dark
    parts[hue].lit += one.lit
  }

  return (['v', 'p'] as const)
    .map(hue =>
      parts[hue].dark === ''
        ? ''
        : `<path d="${parts[hue].dark}" fill="${SMALL[hue][0]}" fill-opacity="${opacity}"/><path d="${parts[hue].lit}" fill="${SMALL[hue][1]}" fill-opacity="${opacity}"/>`,
    )
    .join('')
}

/**
 * A hexagonal column standing at (0, 0), its faces from `bottom` up to `top` (negative), lit from the right, and its
 * pointed tip when `tip` is given (the tip's sideways shift).
 */
function prism(s: number, bottom: number, top: number, hue: Hue, tip: number | null, paint: string = hue): string {
  const k = tip === null ? 0 : s * 0.22
  const [t0, t1, t2, edge] = TIPS[hue]
  const faces =
    `<path d="M${pt(-s, bottom)}V${f(top)}L${pt(-s / 2, top + k)}V${f(bottom)}Z" fill="url(#cc-${paint}0)"/>` +
    `<path d="M${pt(-s / 2, bottom)}V${f(top + k)}H${f(s / 2)}V${f(bottom)}Z" fill="url(#cc-${paint}1)"/>` +
    `<path d="M${pt(s / 2, bottom)}V${f(top + k)}L${pt(s, top)}V${f(bottom)}Z" fill="url(#cc-${paint}2)"/>` +
    // The light inside, a soft streak up the middle face.
    `<path d="M${pt(-s * 0.08, bottom - 20)}V${f(top + k + 12)}" stroke="#ffd8ff" stroke-opacity=".2" stroke-width="${f(s * 0.2)}" stroke-linecap="round"/>`

  if (tip === null) {
    return faces + `<path d="M${pt(-s / 2, bottom)}V${f(top)}M${pt(s / 2, bottom)}V${f(top)}" stroke="${edge}" stroke-opacity=".4" stroke-width="1.5"/>`
  }

  const apex = pt(tip, top - s * 1.3)

  return (
    faces +
    `<path d="M${pt(-s, top)}L${pt(-s / 2, top + k)}L${apex}Z" fill="${t0}"/>` +
    `<path d="M${pt(-s / 2, top + k)}H${f(s / 2)}L${apex}Z" fill="${t1}"/>` +
    `<path d="M${pt(s / 2, top + k)}L${pt(s, top)}L${apex}Z" fill="${t2}"/>` +
    `<path d="M${pt(-s / 2, bottom)}V${f(top + k)}L${apex}M${pt(s / 2, bottom)}V${f(top + k)}L${apex}M${pt(-s, top)}L${apex}L${pt(s, top)}" ` +
    `fill="none" stroke="${edge}" stroke-opacity=".45" stroke-width="1.5" stroke-linejoin="round"/>`
  )
}

/** The column's lit side and tip: the shape its light swells in. */
function glowPath(c: Column): string {
  const top = -c.h
  const apex = pt(c.tip, top - c.s * 1.3)

  return `M${pt(-c.s / 2, 0)}V${f(top + c.s * 0.22)}L${apex}L${pt(c.s, top)}V0Z`
}

function outline(c: Column): string {
  const top = -c.h

  return `M${pt(-c.s, 0)}V${f(top)}L${pt(c.tip, top - c.s * 1.3)}L${pt(c.s, top)}V0Z`
}

/** When the wave of light reaches a column: the moving band passes it 28% into its own pulse. */
const waveAt = (x: number): number => ((x + 300) / 1900) * 2.8 - 0.78

function column(c: Column, next: () => number): string {
  const style = `--b:${f(6 + next() * 4)}s;--d:${f(-next() * 8)}s;--w:${f(waveAt(c.x))}s`

  return (
    `<g transform="translate(${c.x} ${WATER}) rotate(${c.lean})">` +
    `<ellipse class="cc-halo" cx="0" cy="${f(-c.h * 0.62)}" rx="${f(c.s * 3.2)}" ry="${f(c.h * 0.55)}" fill="url(#cc-h${c.hue})"/>` +
    prism(c.s, 0, -c.h, c.hue, c.tip) +
    `<path class="cc-rz" style="${style}" d="${glowPath(c)}" fill="url(#cc-rzg)"/></g>`
  )
}

/** The giant: a lower part and a top that slips when the column cracks, the crack itself, and a bead of light. */
function giant(next: () => number): string {
  const c = GIANT
  const s = c.s
  const cut = -CRACK
  const cracks: readonly (readonly [string, number])[] = [
    [`M${-s} ${cut + 4}L-36 ${cut + 8}L-18 ${cut - 8}L0 ${cut + 4}L20 ${cut - 10}L40 ${cut + 2}L${s} ${cut - 4}`, 0.1],
    [`M-18 ${cut - 8}L-38 ${cut - 34}L-48 ${cut - 70}`, 0.3],
    [`M20 ${cut - 10}L38 ${cut + 22}L50 ${cut + 54}`, 0.35],
    [`M0 ${cut + 4}L-12 ${cut + 30}`, 0.45],
    [`M40 ${cut + 2}L50 ${cut - 26}`, 0.4],
    [`M-36 ${cut + 8}L-52 ${cut + 36}`, 0.5],
  ]
  const style = `--b:${f(6 + next() * 4)}s;--d:${f(-next() * 8)}s;--w:${f(waveAt(c.x))}s`

  return (
    `<g transform="translate(${c.x} ${WATER}) rotate(${c.lean})">` +
    `<ellipse class="cc-halo cc-gh" cx="0" cy="${f(-c.h * 0.62)}" rx="${f(s * 3.2)}" ry="${f(c.h * 0.55)}" fill="url(#cc-hv)"/>` +
    prism(s, 0, cut, c.hue, null, 'g') +
    `<path class="cc-dead" d="M${pt(-s, 0)}V${f(cut)}H${f(s)}V0Z" fill="#12081c"/>` +
    `<path class="cc-brk" d="M${pt(-s, cut)}L${pt(-s * 0.55, cut - 9)}L${pt(-s * 0.15, cut + 5)}L${pt(s * 0.3, cut - 11)}L${pt(s, cut)}V${f(cut + 10)}H${f(-s)}Z" fill="#1c0a2c" stroke="#f0c0ff" stroke-opacity=".6" stroke-width="1.5"/>` +
    `<g class="cc-top">${prism(s, cut, -c.h, c.hue, c.tip, 'g')}<path class="cc-dead" d="M${pt(-s, cut)}V${f(-c.h)}L${pt(c.tip, -c.h - s * 1.3)}L${pt(s, -c.h)}V${f(cut)}Z" fill="#12081c"/></g>` +
    `<path class="cc-rz cc-gz" style="${style}" d="${glowPath(c)}" fill="url(#cc-rzg)"/>` +
    `<ellipse class="cc-bead" style="--l:${f(-c.h + 60)}px" cx="0" cy="-30" rx="${f(s * 0.45)}" ry="26" fill="url(#cc-bd)"/>` +
    `<ellipse class="cc-ckg" cx="0" cy="${cut}" rx="${f(s * 1.5)}" ry="34" fill="url(#cc-bd)"/>` +
    cracks
      .map(([d, delay]) => `<path class="cc-ck" pathLength="1" style="--d:${delay}s" d="${d}" fill="none" stroke="#ffe8ff" stroke-width="3.4" stroke-linejoin="round"/>`)
      .join('') +
    '</g>'
  )
}

/** Mirror images of the columns in the lake, fading with depth. */
function reflections(list: readonly Column[]): string {
  return (
    `<g class="cc-rfl" transform="translate(0 ${2 * WATER}) scale(1 -1)">` +
    list.map(c => `<path transform="translate(${c.x} ${WATER}) rotate(${c.lean})" d="${outline(c)}" fill="url(#cc-r${c.hue})"/>`).join('') +
    '</g>'
  )
}

/** The far wall: dim crystal silhouettes across the middle of the cave, as two paths. */
function backWall(next: () => number): string {
  let body = ''
  let lit = ''

  for (let x = 380; x < 1270; x += 46 + next() * 34) {
    const s = 16 + next() * 26
    const h = 150 + next() * 280 + (Math.abs(x - 820) / 440) * 170
    const lean = (next() - 0.5) * 12
    const tip = (next() - 0.5) * s * 0.4
    const p = (px: number, py: number) => turn(px, py, x, WATER, lean)
    const apex = p(tip, -h - s * 1.3)

    body += `M${p(-s, 0)}L${p(-s, -h)}L${apex}L${p(s, -h)}L${p(s, 0)}Z`
    lit += `M${p(s * 0.1, 0)}L${p(s * 0.1, -h + s * 0.2)}L${apex}L${p(s, -h)}L${p(s, 0)}Z`
  }

  return (
    `<path d="${body}" fill="#0c0616" stroke="#3c2460" stroke-opacity=".4" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${lit}" fill="#160c27"/>`
  )
}

/** The geode in the water at the left: a split rock around a lining of crystal teeth and a core of light. */
function geode(next: () => number): string {
  const cx = 232
  const cy = 728
  const rx = 172
  const ry = 140
  const n = 14
  const bump = (a: number) => 1 + 0.045 * Math.sin(a * 5 + 1) + 0.03 * Math.sin(a * 11)
  const at = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180

    return [cx + rx * Math.cos(a) * bump(a), cy + ry * Math.sin(a) * bump(a)]
  }
  const [tx, ty] = at(-90)
  const [, by] = at(90)
  const zig = [0, 10, -8, 12, -6, 8, 0]
  const seam = zig.map((dx, i) => pt(cx + dx, ty + ((by - ty) * i) / (zig.length - 1)))
  const back = [...seam].reverse().slice(1, -1).join('L')
  const side = (sign: number) =>
    Array.from({ length: n }, (_, k) => {
      const [x, y] = at(-90 + sign * (k + 1) * (180 / n))

      return pt(x, y)
    }).join('L')
  const rim = (sign: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const [x, y] = at(-90 + sign * k * (180 / n))

      return pt(x, y)
    }).join('L')
  const half = (sign: number, cls: string, marks: string) =>
    `<g class="${cls}"><path d="M${pt(tx, ty)}L${side(sign)}L${back}Z" fill="url(#cc-rock)" stroke="#120c18" stroke-width="2"/>` +
    `<path d="${marks}" fill="none" stroke="#0a0710" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M${rim(sign)}" fill="none" stroke="#b070e0" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/></g>`
  // The lining: crystal teeth around the hollow, pointing in.
  const ccy = cy - 16
  const teeth = (rx0: number, ry0: number, inner: number, count: number, phase: number): [string, string, string] => {
    const out: [string, string, string] = ['', '', '']

    for (let k = 0; k < count; k += 1) {
      const a = ((k + phase) / count) * Math.PI * 2
      const w = (Math.PI / count) * 0.95
      const p = (r: number, b: number) => pt(cx + Math.cos(b) * rx0 * r, ccy + Math.sin(b) * ry0 * r)

      out[k % 3] += `M${p(1, a - w)}L${p(inner - next() * 0.08, a)}L${p(1, a + w)}Z`
    }

    return out
  }
  const outer = teeth(130, 98, 0.66, 24, 0)
  const inner = teeth(90, 68, 0.5, 16, 0.5)
  const rays = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 10) * Math.PI * 2
    const w = 0.035 + (k % 3) * 0.012
    const p = (b: number) => pt(Math.cos(b) * 330, Math.sin(b) * 330)

    return `M0 0L${p(a - w)}L${p(a + w)}Z`
  }).join('')
  const sparks = Array.from({ length: 10 }, (_, k) => {
    const x = cx + (next() - 0.5) * 80
    const y = ccy + (next() - 0.5) * 40

    return `<path class="cc-spk" style="--d:${f(0.7 + k * 0.17)}s;--dx:${f((next() - 0.5) * 240)}px" d="M${pt(x, y - 7)}L${pt(x + 3, y)}L${pt(x, y + 7)}L${pt(x - 3, y)}Z" fill="#fff0ff"/>`
  }).join('')

  return (
    `<g class="cc-geo">` +
    // The hollow, its lining and the core, hidden until the rock splits.
    `<ellipse cx="${cx}" cy="${ccy}" rx="132" ry="100" fill="url(#cc-cav)"/>` +
    `<path d="${outer[0]}" fill="#7a34b0"/><path d="${outer[1]}" fill="#b956e0"/><path d="${outer[2]}" fill="#e48aff"/>` +
    `<path d="${inner[0] + inner[2]}" fill="#f0b4ff"/><path d="${inner[1]}" fill="#ff9fe0"/>` +
    `<circle class="cc-core" cx="${cx}" cy="${ccy}" r="74" fill="url(#cc-core)"/>` +
    half(-1, 'cc-gl', 'M112 700l14 -8l10 6l12 -4M92 752l16 -2l8 6M166 640l12 8l14 -2M146 772l10 -8l12 2M84 690l8 12') +
    half(1, 'cc-gr', 'M302 690l-14 -6l-10 6l-12 -2M338 744l-16 4l-10 -6M290 630l-10 10l-14 -2M304 772l-10 -6l-12 4M374 700l-6 12') +
    `<path class="cc-seam" pathLength="1" d="M${seam.join('L')}" fill="none" stroke="#ffc8ff" stroke-width="2.6" stroke-linejoin="round"/>` +
    '</g>' +
    // The light it lets out.
    `<circle class="cc-bloom" cx="${cx}" cy="${ccy}" r="340" fill="url(#cc-bloom)"/>` +
    `<g transform="translate(${cx} ${ccy})"><g class="cc-ray"><g class="cc-rays"><path d="${rays}" fill="url(#cc-ray)"/></g></g></g>` +
    sparks
  )
}

/** The laptop on the cart, and a crystal on a brass stand that sings with the screen's light. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#3a3046"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#3a3046"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M372 330H400L395 321H377Z" fill="#9a7440"/>' +
    `<g class="${activity === 'run' ? 'cc-hum cc-humr' : 'cc-hum'}"><path d="M379 321V300L386 288L393 300V321Z" fill="${light}" fill-opacity=".55" stroke="#f6dcff" stroke-width="1.5" stroke-linejoin="round"/>` +
    '<path d="M386 290V320" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.5"/></g>'
  )
}

export function crystalCaveWorld(): World {
  const next = random(7331)
  const ceilY = (x: number) => 58 + 46 * Math.pow(Math.abs(x - 800) / 800, 1.5)
  let ceiling = 'M-40 -40H1640V' + f(ceilY(1640))

  for (let x = 1640; x >= -40; x -= 38) {
    ceiling += `L${pt(x, ceilY(x) + (next() - 0.5) * 28)}`
  }

  ceiling += 'Z'

  // Crystals hanging from the ceiling: glowing at the sides, dark over the middle of the cave.
  const hanging = (xs: readonly number[], long: number) =>
    xs.flatMap(x => {
      const hue: Hue = next() > 0.5 ? 'v' : 'p'
      const big = [x, ceilY(x) - 6, 8 + next() * 8, long * (0.45 + next() * 0.7), 180 + (next() - 0.5) * 22, hue] as const
      const side = next() > 0.5 ? 1 : -1

      return [big, [x + side * (12 + next() * 6), ceilY(x) - 6, 5 + next() * 4, long * (0.2 + next() * 0.3), 180 + side * (14 + next() * 14), hue] as const]
    })
  const leftHang = hanging([28, 92, 250, 300, 356], 130)
  const midHang = hanging([470, 540, 610, 690, 770, 850, 930, 1010, 1080, 1140], 70)
  const rightHang = hanging([1290, 1350, 1420, 1500, 1570], 130)
  const midHangPaths = (() => {
    let dark = ''
    let lit = ''

    for (const [x, y, s, h, deg] of midHang) {
      const one = shard(x, y, s, h, deg)

      dark += one.dark
      lit += one.lit
    }

    return `<path d="${dark}" fill="#100819"/><path d="${lit}" fill="#22133a"/>`
  })()
  const hangGlow = (list: readonly (readonly [number, number, number, number, number, Hue])[]) =>
    list.map(([x, y, , h, , hue]) => `<ellipse cx="${f(x)}" cy="${f(y + h * 0.6)}" rx="${f(26 + h * 0.2)}" ry="${f(h * 0.7)}" fill="url(#cc-h${hue})" fill-opacity=".8"/>`).join('')
  const drip = (x: number, top: number, s: number, h: number, delay: number) => {
    const tipY = top + h + s * 1.4

    return {
      crystal: [x, top, s, h, 180, 'p'] as const,
      drop: `<ellipse class="cc-dr" style="--d:${delay}s;--l:${f(WATER + 6 - tipY)}px" cx="${x}" cy="${f(tipY + 3)}" rx="2.2" ry="4" fill="#f4c8ff"/>`,
      splash: `<ellipse class="cc-sp" style="--d:${delay}s" cx="${x}" cy="${WATER + 7}" rx="12" ry="3" fill="none" stroke="#f0c0ff" stroke-width="1.6"/>`,
    }
  }
  const dripL = drip(412, ceilY(412) - 6, 9, 112, -1.2)
  const dripR = drip(1238, ceilY(1238) - 6, 9, 118, -3.4)

  const leftCols = LEFT.map(c => column(c, next)).join('') + giant(next)
  const rightCols = RIGHT.map(c => column(c, next)).join('')
  const motes = (count: number, x0: number, x1: number, y0: number, y1: number) =>
    Array.from({ length: count }, () => {
      const style = `--t:${f(7 + next() * 5)}s;--d:${f(-next() * 12)}s;--dx:${f((next() - 0.5) * 70)}px`

      return `<circle class="cc-mt" style="${style}" cx="${f(x0 + next() * (x1 - x0))}" cy="${f(y0 + next() * (y1 - y0))}" r="${f(1.4 + next() * 2)}" fill="#f6d2ff"/>`
    }).join('')
  const glints = (count: number, x0: number, x1: number) =>
    Array.from({ length: count }, () => {
      const y = WATER + 10 + next() * 120

      return `<ellipse class="cc-gt" style="--d:${f(-next() * 3.4)}s" cx="${f(x0 + next() * (x1 - x0))}" cy="${f(y)}" rx="${f(8 + next() * 18)}" ry="1.6" fill="#ecc0ff"/>`
    }).join('')
  // Water lines that break the reflections into strips: dark across the lake, light only at the sides.
  const rows = Array.from({ length: 11 }, (_, i) => WATER + 6 + Math.pow(i + 1, 1.55) * 5.4)
  const darkRows = rows.map(y => `M-20 ${f(y)}H1620`).join('')
  const lightRows = (x0: number, x1: number) => rows.map(y => `M${x0} ${f(y + 2)}H${x1}`).join('')
  const ring = (cls: string, x: number, y: number, rx: number, ry: number, delay: number, color: string, width: number) =>
    `<ellipse class="${cls}" style="--d:${f(delay)}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="${width}"/>`
  const hum = (x: number, y: number, r: number, lakeX: number, lakeR: number) =>
    [0, 0.93, 1.87].map(d => ring('cc-ring', x, y, r, r, d, '#f0b8ff', 3) + ring('cc-ring', lakeX, WATER + 8, lakeR, Math.round(lakeR / 5.5), d + 0.3, '#e7a6ff', 2.4)).join('')
  // The shards the cracked column drops, and where they hit the water.
  const crackX = GIANT.x + CRACK * Math.sin((GIANT.lean * Math.PI) / 180)
  const crackY = WATER - CRACK * Math.cos((GIANT.lean * Math.PI) / 180)
  const fallen = Array.from({ length: 12 }, (_, i) => {
    const x = crackX - 50 + i * 9 + next() * 6
    const y = crackY - 6 + next() * 14
    const dx = (i - 5.5) * 13 + (next() - 0.5) * 20
    const dy = WATER - 2 - y
    const d = 0.45 + next() * 0.3
    const z = 9 + next() * 9
    const style = `--d:${f(d)}s;--dx:${f(dx)}px;--dy:${f(dy)}px;--r:${f((next() - 0.5) * 600)}deg`

    return (
      `<path class="cc-sd" style="${style}" d="M${pt(x, y - z)}L${pt(x + z * 0.6, y + z * 0.5)}L${pt(x - z * 0.5, y + z * 0.4)}Z" fill="${i % 2 ? '#e48aff' : '#f6c4ff'}"/>` +
      `<ellipse class="cc-ss" style="--d:${f(d + 1)}s" cx="${f(x + dx)}" cy="${WATER + 6}" rx="14" ry="3.4" fill="none" stroke="#f0c8ff" stroke-width="2"/>`
    )
  }).join('')
  const puffs = [0, 1, 2]
    .map(i => `<circle class="cc-pf" style="animation-delay:${f(0.4 + i * 0.12)}s" cx="${f(crackX - 20 + i * 22)}" cy="${f(crackY - 4 + (i % 2) * 8)}" r="${18 + i * 4}" fill="#d8b4ec" fill-opacity=".5"/>`)
    .join('')
  const giantMid: [number, number] = [GIANT.x + 470 * Math.sin((GIANT.lean * Math.PI) / 180) + 4, WATER - 470]
  const r2 = RIGHT[3]!
  const r2Rad = (r2.lean * Math.PI) / 180
  const r2Mid: [number, number] = [r2.x + 420 * Math.sin(r2Rad), WATER - 420 * Math.cos(r2Rad)]
  const r2Tip: [number, number] = [r2.x + (r2.h + r2.s * 1.3) * Math.sin(r2Rad), WATER - (r2.h + r2.s * 1.3) * Math.cos(r2Rad)]
  const pings = [0, 0.6, 1.2].map(d => ring('cc-pg', Math.round(r2Tip[0]), Math.round(r2Tip[1] + 14), 22, 22, d, '#ffc8f0', 2.4)).join('')

  // A face's light, top to bottom; given a height, laid along the column itself so the giant's two parts match.
  const vGrad = (id: string, top: string, bottom: string, height = 0) =>
    `<linearGradient id="${id}" ${height ? `gradientUnits="userSpaceOnUse" x1="0" y1="${-height}" x2="0" y2="0"` : 'x1="0" y1="0" x2="0" y2="1"'}>` +
    `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  const radial = (id: string, stops: readonly (readonly [number, string, number])[], extra = '') =>
    `<radialGradient id="${id}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#08040e',
      furniture: IRON,
      metal: '#3a3046',
      paper: '#e8dcf0',
      light: { idle: '#9a5cc8', work: '#e07bff', bright: '#f6c8ff' },
      headTop: 200,
      glowAt: [345, 284],
      device,
      wear: {
        // A miner's hard hat: dome, ridge and brim all above row 1, so the eyes stay clear under it. The headlamp
        // sits on the front of the dome and throws a faint beam over the cart.
        front:
          '<path class="cc-beam" d="M160 216L432 148L432 332L160 232Z" fill="#fff0d0" fill-opacity=".07"/>' +
          '<path d="M72 244C72 206 106 192 150 192C194 192 228 206 228 244Z" fill="#d49a2a"/>' +
          '<path d="M72 244C72 206 106 192 150 192C126 196 106 214 102 244Z" fill="#a8741c"/>' +
          '<path d="M142 193H158V244H142Z" fill="#e3ad3c"/>' +
          '<path d="M182 198C204 204 218 218 222 238" fill="none" stroke="#f4cc66" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>' +
          '<rect x="58" y="240" width="184" height="10" rx="5" fill="#b88220"/><rect x="64" y="248" width="172" height="3" fill="#5a3c10" fill-opacity=".7"/>' +
          '<circle cx="150" cy="224" r="20" fill="#fff3d4" fill-opacity=".18"/>' +
          '<rect x="138" y="212" width="24" height="24" rx="5" fill="#2a2430" stroke="#4a4058" stroke-width="2"/>' +
          '<circle cx="150" cy="224" r="8" fill="#fff3d4"/><circle cx="147" cy="221" r="2.6" fill="#ffffff"/>',
      },
      seatArt:
        // A wooden crate with an invented crystal mark stencilled on it.
        `<rect x="104" y="352" width="96" height="104" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="2"/>` +
        `<rect x="100" y="346" width="104" height="8" rx="2" fill="#4a3222"/>` +
        `<path d="M104 378H200M104 404H200M104 430H200" stroke="${WOOD_DARK}" stroke-width="2"/>` +
        `<path d="M104 352H114V456H104ZM190 352H200V456H190Z" fill="#2c1c12"/>` +
        '<path d="M152 386L164 404L152 422L140 404Z" fill="none" stroke="#c9a0e0" stroke-opacity=".6" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M140 404H164M152 386V422" stroke="#c9a0e0" stroke-opacity=".35" stroke-width="1.5"/>',
      tableArt:
        // The mine cart: crystal ore heaped at the back, a plank across it for the laptop, wheels on the rails, a
        // pickaxe leaning on it. Flat colours only, since a portal draws the rig without the scenery's gradients.
        `<path d="M40 448H480" stroke="#3a3046" stroke-width="2"/>` +
        `<path d="${Array.from({ length: 12 }, (_, i) => `M${48 + i * 36} 450h20v6h-20Z`).join('')}" fill="#2a1c14"/>` +
        `<path d="M40 451H480" stroke="#6a5c78" stroke-width="4"/>` +
        `<g class="cc-cart">${shards([
          [418, 334, 9, 34, -16, 'p'],
          [442, 334, 12, 52, 6, 'v'],
          [462, 334, 7, 26, 22, 'p'],
          [404, 334, 6, 18, -30, 'v'],
        ])}</g>` +
        `<path d="M176 340H462L446 420H192Z" fill="${IRON}" stroke="${IRON_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
        '<path d="M236 340V420M318 340V420M400 340V420" stroke="#1a1420" stroke-width="5"/>' +
        `<rect x="168" y="330" width="302" height="11" rx="3" fill="#3d3248" stroke="${IRON_EDGE}" stroke-width="1.5"/>` +
        `<path d="${Array.from({ length: 11 }, (_, i) => `M${182 + i * 27} 335.5a2 2 0 1 0 .1 0`).join('')}" fill="#7a6a88"/>` +
        '<rect x="200" y="418" width="238" height="8" fill="#1a1420"/>' +
        [226, 412]
          .map(
            x =>
              `<circle cx="${x}" cy="430" r="20" fill="#15101a" stroke="#5a4a68" stroke-width="4"/>` +
              `<path d="M${x - 14} 430H${x + 14}M${x} 416V444" stroke="#3a3046" stroke-width="3"/><circle cx="${x}" cy="430" r="5" fill="#7a6a88"/>`,
          )
          .join('') +
        '<path d="M466 452L438 298" stroke="#7a5634" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M408 310Q434 286 470 296L468 303Q436 296 412 316Z" fill="#8a8496" stroke="#4a4458" stroke-width="1.5" stroke-linejoin="round"/>',
    },
    style:
      // Ambient: the crystals breathe, dust motes rise, the water shimmers, drips fall from the ceiling.
      '.cc-rz{opacity:.06;animation:cc-br var(--b,7s) ease-in-out var(--d,0s) infinite alternate}@keyframes cc-br{from{opacity:.04}to{opacity:.3}}' +
      '.cc-halo{animation:cc-ha 9s ease-in-out infinite alternate}@keyframes cc-ha{from{opacity:.6}to{opacity:1}}' +
      '.cc-mt{opacity:0;animation:cc-mt var(--t,9s) linear var(--d,0s) infinite}' +
      '@keyframes cc-mt{0%{opacity:0;transform:translate(0,0)}25%{opacity:.85}100%{opacity:0;transform:translate(var(--dx,0px),-150px)}}' +
      '.cc-sh{animation:cc-sh 7s linear infinite}.cc-sh2{animation-duration:11s;animation-direction:reverse}@keyframes cc-sh{to{stroke-dashoffset:-176}}' +
      '.cc-gt{animation:cc-gt 3.4s ease-in-out var(--d,0s) infinite alternate}@keyframes cc-gt{from{opacity:.08}to{opacity:.55}}' +
      '.cc-dr{opacity:0;animation:cc-dr 5s ease-in var(--d,0s) infinite}' +
      '@keyframes cc-dr{0%{opacity:0;transform:translateY(0)}4%{opacity:.8}26%{opacity:.8;transform:translateY(var(--l))}27%,100%{opacity:0;transform:translateY(var(--l))}}' +
      '.cc-sp,.cc-ring,.cc-pg,.cc-ss,.cc-pf,.cc-sd{transform-box:fill-box;transform-origin:center;opacity:0}' +
      '.cc-sp{animation:cc-sp 5s ease-out var(--d,0s) infinite}@keyframes cc-sp{0%,26%{opacity:0;transform:scale(.2)}28%{opacity:.7}55%,100%{opacity:0;transform:scale(2.6)}}' +
      '.cc-seam{opacity:.16;stroke-dasharray:1;stroke-dashoffset:0}' +
      '.cc-beam{opacity:.5}' +
      '.cc-core,.cc-bloom,.cc-ray,.cc-spk,.cc-bead,.cc-band,.cc-brk,.cc-gref{opacity:0}' +
      // Thinking: something stirs in the geode, its seam glows. Responding: the dust rises faster.
      '.st-thinking .cc-seam{animation:cc-seam 2.6s ease-in-out infinite alternate}@keyframes cc-seam{from{opacity:.15}to{opacity:.6}}' +
      '.st-thinking .cc-mt{animation-duration:15s}' +
      '.st-responding .cc-mt{animation-duration:5s}.st-responding .cc-rz{animation-duration:2.6s}' +
      // Tool and read: the headlamp burns brighter, the ore in the cart glows.
      '.st-tool .cc-beam,.st-read .cc-beam{opacity:1}' +
      '.st-tool .cc-cart{animation:cc-cart 1.2s ease-in-out infinite alternate}@keyframes cc-cart{from{opacity:.55}to{opacity:1}}' +
      // Web: the tall crystal at the right listens, rings at its tip.
      '.st-web .cc-pg{animation:cc-ring 1.8s ease-out var(--d,0s) infinite both}' +
      // Run: the crystals resonate. A band of light crosses the cave, each column swells as it passes, the hum
      // spreads in rings in the air and on the water, a bead of light climbs the giant.
      '.st-run .cc-rz{animation:cc-wave 2.8s ease-in-out var(--w,0s) infinite both}@keyframes cc-wave{0%,100%{opacity:.08}28%{opacity:.85}62%{opacity:.1}}' +
      '.st-run .cc-ring{animation:cc-ring 2.8s ease-out var(--d,0s) infinite both}' +
      '@keyframes cc-ring{0%{opacity:0;transform:scale(.3)}12%{opacity:.6}100%{opacity:0;transform:scale(3.4)}}' +
      '.st-run .cc-bead{animation:cc-bead 2.8s ease-in infinite}' +
      '@keyframes cc-bead{0%{opacity:0;transform:translateY(0)}10%,80%{opacity:.9}100%{opacity:0;transform:translateY(var(--l))}}' +
      '.st-run .cc-band{animation:cc-band 2.8s linear infinite}' +
      '@keyframes cc-band{0%{opacity:0;transform:translateX(0)}12%,88%{opacity:1}100%{opacity:0;transform:translateX(1900px)}}' +
      '.st-run .cc-rfl{animation:cc-rfl 1.4s ease-in-out infinite alternate}@keyframes cc-rfl{from{opacity:.7}to{opacity:1}}' +
      '.st-run .cc-humr{animation:cc-cart .7s ease-in-out infinite alternate}' +
      // Error: the giant column cracks, its light dies, its top slips and shards fall into the lake.
      '.cc-ck{opacity:0;stroke-dasharray:1;stroke-dashoffset:1}' +
      '.st-error .cc-ck{animation:cc-ck .5s ease-out var(--d,.1s) both}@keyframes cc-ck{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.cc-ckg{opacity:0}.st-error .cc-ckg{animation:cc-ckg 1.4s ease-out .1s both}@keyframes cc-ckg{0%{opacity:0}25%{opacity:.75}100%{opacity:.25}}.st-error .cc-brk{opacity:1}.cc-dead{opacity:0}.st-error .cc-dead{animation:cc-dead 1.1s ease-out .15s both}@keyframes cc-dead{to{opacity:.62}}' +
      '.cc-top{transform-box:fill-box;transform-origin:100% 100%}' +
      '.st-error .cc-top{animation:cc-slip .8s cubic-bezier(.55,0,.75,.6) .45s both}@keyframes cc-slip{to{transform:translate(18px,16px) rotate(9deg)}}' +
      '.st-error .cc-rz{animation:cc-dim 1.6s ease-out both}@keyframes cc-dim{from{opacity:.25}to{opacity:.05}}' +
      // Two dips of the giant's light in its first half second: under three a second.
      '.st-error .cc-gz{animation:cc-die 1.3s ease-out both}@keyframes cc-die{0%{opacity:.55}14%{opacity:.08}30%{opacity:.45}52%,100%{opacity:0}}' +
      '.st-error .cc-gh{animation:cc-gh 1.4s ease-out both}@keyframes cc-gh{to{opacity:.3}}' +
      '.st-error .cc-sd{animation:cc-sd 1.1s cubic-bezier(.45,0,.9,.55) var(--d,.5s) both}' +
      '@keyframes cc-sd{0%{opacity:0;transform:translate(0,0) rotate(0)}6%,88%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      '.st-error .cc-ss{animation:cc-ss 1s ease-out var(--d,1.4s) both}@keyframes cc-ss{0%{opacity:.75;transform:scale(.2)}100%{opacity:0;transform:scale(2.6)}}' +
      '.st-error .cc-pf{animation:cc-pf 1.6s ease-out both}@keyframes cc-pf{0%{opacity:.6;transform:scale(.3)}100%{opacity:0;transform:scale(2.4)}}' +
      '.st-error .cc-shk{animation:cc-shk .4s ease-in-out .35s 3}@keyframes cc-shk{0%,100%{transform:translateX(0)}30%{transform:translateX(-4px)}70%{transform:translateX(4px)}}' +
      // Done: the geode's seam lights, the rock splits in two and the core blazes out; every column glows.
      '.st-done .cc-seam{animation:cc-sdraw 1s ease-out both}' +
      '@keyframes cc-sdraw{0%{opacity:0;stroke-dashoffset:1}30%{opacity:1;stroke-dashoffset:0}60%{opacity:1}100%{opacity:0;stroke-dashoffset:0}}' +
      '.st-done .cc-geo{animation:cc-jit .1s linear 4}@keyframes cc-jit{50%{transform:translateX(2px)}}' +
      '.cc-gl,.cc-gr{transform-box:fill-box}.cc-gl{transform-origin:0 100%}.cc-gr{transform-origin:100% 100%}' +
      '.st-done .cc-gl{animation:cc-opl 1.4s cubic-bezier(.3,.7,.3,1) .45s both}@keyframes cc-opl{to{transform:translate(-30px,4px) rotate(-15deg)}}' +
      '.st-done .cc-gr{animation:cc-opr 1.4s cubic-bezier(.3,.7,.3,1) .45s both}@keyframes cc-opr{to{transform:translate(30px,4px) rotate(15deg)}}' +
      '.st-done .cc-core{animation:cc-on 1.2s ease-out .55s both}.st-done .cc-bloom{animation:cc-on 1.6s ease-in-out .6s both}' +
      '.st-done .cc-ray{animation:cc-on 1.8s ease-out 1s both}.st-done .cc-gref{animation:cc-on 1.6s ease-out .8s both}@keyframes cc-on{from{opacity:0}to{opacity:1}}' +
      '.st-done .cc-rays{animation:mv-spin 40s linear infinite}' +
      '.st-done .cc-spk{animation:cc-spk 2.2s ease-out var(--d,1s) infinite both}' +
      '@keyframes cc-spk{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-250px)}}' +
      '.st-done .cc-rz{animation:cc-glow 2s ease-out .6s both}@keyframes cc-glow{from{opacity:.1}to{opacity:.5}}',
    scenery:
      '<defs>' +
      '<linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040208"/><stop offset=".5" stop-color="#0a0513"/><stop offset=".86" stop-color="#150b24"/><stop offset="1" stop-color="#1e1131"/></linearGradient>' +
      '<linearGradient id="cc-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#170c27"/><stop offset=".2" stop-color="#0d0717"/><stop offset="1" stop-color="#040208"/></linearGradient>' +
      vGrad('cc-v0', '#4c2378', '#1a0c2c') +
      vGrad('cc-v1', '#7c38b8', '#261040') +
      vGrad('cc-v2', '#b866ee', '#3a1a5a') +
      vGrad('cc-p0', '#5e1a58', '#200a22') +
      vGrad('cc-p1', '#a8348e', '#300f30') +
      vGrad('cc-p2', '#ee70c8', '#4a1844') +
      vGrad('cc-g0', '#4c2378', '#1a0c2c', GIANT.h) +
      vGrad('cc-g1', '#7c38b8', '#261040', GIANT.h) +
      vGrad('cc-g2', '#b866ee', '#3a1a5a', GIANT.h) +
      '<linearGradient id="cc-rzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0ff" stop-opacity=".95"/><stop offset=".45" stop-color="#f0a8ff" stop-opacity=".55"/><stop offset="1" stop-color="#e07bff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cc-rv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#a65ee6" stop-opacity=".28"/><stop offset=".4" stop-color="#7a3cb0" stop-opacity=".07"/><stop offset="1" stop-color="#7a3cb0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cc-rp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e066c0" stop-opacity=".26"/><stop offset=".4" stop-color="#a83488" stop-opacity=".07"/><stop offset="1" stop-color="#a83488" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cc-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0513" stop-opacity="0"/><stop offset="1" stop-color="#0a0513" stop-opacity=".88"/></linearGradient>' +
      '<linearGradient id="cc-rock" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#3e3048"/><stop offset=".5" stop-color="#251b2f"/><stop offset="1" stop-color="#0e0a14"/></linearGradient>' +
      '<linearGradient id="cc-bandg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e07bff" stop-opacity="0"/><stop offset=".5" stop-color="#f0b0ff" stop-opacity=".09"/><stop offset="1" stop-color="#e07bff" stop-opacity="0"/></linearGradient>' +
      radial('cc-hv', [[0, '#a050f0', 0.34], [0.5, '#7a30c0', 0.12], [1, '#7a30c0', 0]]) +
      radial('cc-hp', [[0, '#f060c8', 0.3], [0.5, '#c03898', 0.1], [1, '#c03898', 0]]) +
      radial('cc-haze', [[0, '#3c1e60', 0.45], [1, '#3c1e60', 0]]) +
      radial('cc-cav', [[0, '#5a2080', 1], [1, '#14061f', 1]]) +
      radial('cc-core', [[0, '#ffffff', 1], [0.25, '#ffe2fb', 0.95], [0.6, '#f39cff', 0.5], [1, '#e07bff', 0]]) +
      radial('cc-bloom', [[0, '#ffd6fa', 0.34], [0.4, '#e07bff', 0.13], [1, '#e07bff', 0]]) +
      radial('cc-ray', [[0, '#ffe6ff', 0.3], [1, '#ffe6ff', 0]], ' gradientUnits="userSpaceOnUse" cx="0" cy="0" r="330"') +
      radial('cc-bd', [[0, '#ffffff', 0.95], [1, '#ffd0ff', 0]]) +
      radial('cc-gref', [[0, '#ffc8f6', 0.5], [1, '#ffc8f6', 0]]) +
      '</defs>' +
      // The cave air, its far haze over the water and the far wall of dim crystal.
      '<rect width="1600" height="790" fill="url(#cc-sky)"/>' +
      `<ellipse cx="800" cy="${WATER}" rx="980" ry="190" fill="url(#cc-haze)"/>` +
      backWall(next) +
      // The left cluster and the giant.
      `<g class="cc-shk">${leftCols}</g>` +
      `<g class="mv-r">${rightCols}</g>` +
      `<rect x="-60" y="430" width="1720" height="360" fill="url(#cc-fog)"/>` +
      // The ceiling and what hangs from it.
      `<g class="mv-t"><path d="${ceiling}" fill="#050209"/>` +
      hangGlow(leftHang) +
      shards([...leftHang, dripL.crystal]) +
      midHangPaths +
      '</g>' +
      `<g class="mv-r"><g class="mv-t">${hangGlow(rightHang)}${shards([...rightHang, dripR.crystal])}${dripR.drop}</g></g>` +
      dripL.drop +
      // The geode, and small crystals at the water's edge.
      geode(next) +
      shards([
        [8, WATER, 10, 70, -14, 'p'],
        [34, WATER, 8, 46, 12, 'v'],
        [96, WATER, 7, 28, -20, 'v'],
        [150, WATER, 9, 38, 8, 'p'],
        [318, WATER, 8, 32, -10, 'p'],
        [362, WATER, 10, 52, 16, 'v'],
        [414, WATER, 9, 60, -8, 'p'],
      ]) +
      `<g class="mv-r">${shards([
        [1196, WATER, 8, 44, -12, 'v'],
        [1214, WATER, 6, 26, 14, 'p'],
        [1330, WATER, 9, 50, -16, 'p'],
        [1460, WATER, 10, 64, 10, 'v'],
        [1568, WATER, 8, 40, -8, 'p'],
      ])}</g>` +
      // The lake: its mirror, the water lines, glints, the hum's rings and the drips.
      `<rect y="${WATER}" width="1600" height="260" fill="url(#cc-lake)"/>` +
      reflections([...LEFT, GIANT]) +
      `<ellipse class="cc-gref" cx="232" cy="866" rx="120" ry="80" fill="url(#cc-gref)"/>` +
      `<path class="cc-sh" d="${darkRows}" stroke="#05020a" stroke-width="2" stroke-dasharray="150 26"/>` +
      `<path class="cc-sh cc-sh2" d="${darkRows}" stroke="#05020a" stroke-opacity=".45" stroke-width="1.4" stroke-dasharray="60 116" transform="translate(0 3)"/>` +
      `<path class="cc-sh" d="${lightRows(-20, 430)}" stroke="#d9a0ff" stroke-opacity=".14" stroke-width="1.6" stroke-dasharray="14 74"/>` +
      glints(7, 20, 420) +
      dripL.splash +
      hum(giantMid[0], giantMid[1], 60, GIANT.x, 70) +
      `<g class="mv-r">${reflections(RIGHT)}` +
      `<path class="cc-sh" d="${lightRows(1170, 1620)}" stroke="#d9a0ff" stroke-opacity=".14" stroke-width="1.6" stroke-dasharray="14 74"/>` +
      glints(5, 1190, 1590) +
      dripR.splash +
      hum(Math.round(r2Mid[0]), Math.round(r2Mid[1]), 50, r2.x, 60) +
      pings +
      motes(9, 1210, 1580, 160, 720) +
      '</g>' +
      // The error's shards and dust, the run's band of light, the dust motes.
      fallen +
      puffs +
      '<rect class="cc-band" x="-430" y="60" width="260" height="740" fill="url(#cc-bandg)"/>' +
      motes(15, 20, 410, 160, 760),
    nook:
      // The rock shelf the rails run along, and a cluster of crystal beside the crate.
      '<path d="M-130 470L-104 448Q-70 438 -20 441L480 438V480H-130Z" fill="#0a0610"/>' +
      '<path d="M-104 448Q-70 438 -20 441L480 438" fill="none" stroke="#6a3a98" stroke-opacity=".45" stroke-width="2"/>' +
      '<ellipse cx="30" cy="388" rx="74" ry="86" fill="url(#cc-hp)"/>' +
      shards([
        [12, 444, 10, 52, -14, 'p'],
        [34, 444, 13, 78, 6, 'v'],
        [56, 444, 8, 36, 24, 'p'],
      ]),
  }
}
