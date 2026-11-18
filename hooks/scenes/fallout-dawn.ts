import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Fallout Dawn: a sickly green-yellow dawn over a dead wasteland. Two cooling towers stand black against the rising
// sun on the left, their plumes climbing into heavy toxic clouds; a dead city runs along the horizon to a gutted
// tower on the right. Claude keeps watch from a sandbagged post in a hazmat hood, a radiation counter by the laptop.
// A command rolls a radioactive dust storm across the plain; an error pins the counter and turns the warning lamp;
// done parts the clouds, drops a clean sunbeam on the post and opens a green sprout on the sandbags.
const LIME = '#b6e33a'
const HAZ = '#b39a2e'
const HAZ_DARK = '#6e5f1c'
const RUBBER = '#191b10'
const OLIVE = '#3b4128'
const SAND = '#4a4630'
const SAND_2 = '#3e3b28'
const SAND_DARK = '#25231a'
const RUST = '#3a2818'
const RUST_EDGE = '#5a3e24'
const SIL = '#080a06'
const AMBER = '#ffb24a'

const op = (value: number): string => value.toFixed(2).replace(/^0/, '')

/** A cooling tower's hyperbolic shell, its top whole or broken open. */
function shell(cx: number, base: number, h: number, bw: number, tw: number, broken: boolean): string {
  const top = base - h
  const cy = base - h * 0.45
  const rim = broken
    ? [[-0.5, -3], [-0.3, 16], [-0.1, 9], [0.06, 36], [0.28, 20], [0.52, 5], [1, 0]].map(([k, d]) => `L${f(cx + tw * k!)} ${f(top + d!)}`).join('')
    : `Q${cx} ${f(top - 8)} ${f(cx + tw)} ${f(top)}`

  return `M${f(cx - bw)} ${base}Q${f(cx - tw * 0.6)} ${f(cy)} ${f(cx - tw)} ${f(top)}${rim}Q${f(cx + tw * 0.6)} ${f(cy)} ${f(cx + bw)} ${base}Z`
}

/** One side of a shell, for the rim of dawn light on it. */
function side(cx: number, base: number, h: number, bw: number, tw: number, dir: 1 | -1): string {
  return `M${f(cx + dir * tw)} ${f(base - h)}Q${f(cx + dir * tw * 0.6)} ${f(base - h * 0.45)} ${f(cx + dir * bw)} ${base}`
}

/**
 * Steam billowing out of a tower and leaning downwind: puffs drawn top first, so the dense base sits in front, each a
 * shadowed lump with a lit side toward the sun.
 */
function plume(
  p: { cx: number; top: number; n: number; lean: number; r0: number; grow: number; toward: 1 | -1; shade: string; lit: string; fade: number },
  seed: number,
): string {
  const next = random(seed)

  return Array.from({ length: p.n }, (_, k) => {
    const i = p.n - 1 - k
    const r = (p.r0 + i * p.grow) * (0.8 + next() * 0.4)
    const x = p.cx + i * p.lean + i * i * p.lean * 0.12 + (next() - 0.5) * p.r0 * 1.1
    const y = p.top - 4 - i * 24 + (next() - 0.5) * 18
    const lx = x + p.toward * r * (0.12 + next() * 0.22)

    return (
      `<g class="fd-pf" style="animation-delay:${f(-i * 1.3)}s" opacity="${op(Math.max(0.2, 1 - i * p.fade))}">` +
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${p.shade}"/>` +
      `<circle cx="${f(lx)}" cy="${f(y + r * (0.08 + next() * 0.2))}" r="${f(r * (0.58 + next() * 0.2))}" fill="${p.lit}" fill-opacity=".45"/></g>`
    )
  }).join('')
}

/** A lumpy outline through the points, each step a bulging arc: the rolling edge of the storm. */
function lumps(points: readonly (readonly [number, number])[], next: () => number): string {
  let d = ''

  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1]!
    const [bx, by] = points[i]!
    const r = Math.hypot(bx - ax, by - ay) * (0.56 + next() * 0.2)

    d += `A${f(r)} ${f(r)} 0 0 1 ${f(bx)} ${f(by)}`
  }

  return d
}

/** A rounded sack as path data, from x0 to x1 with its top at y. */
function bag(x0: number, y: number, x1: number, h = 34): string {
  const r = h / 2 - 3

  return `M${x0 + r} ${y}H${x1 - r}Q${x1} ${y} ${x1} ${y + r}V${y + h - r}Q${x1} ${y + h} ${x1 - r} ${y + h}H${x0 + r}Q${x0} ${y + h} ${x0} ${y + h - r}V${y + r}Q${x0} ${y} ${x0 + r} ${y}Z`
}

/** Rows of sandbags in two tones, with a stitched seam along each. */
function sandbags(rows: readonly (readonly [number, number, number])[]): string {
  let a = ''
  let b = ''
  let seams = ''

  rows.forEach(([y, x0, x1], i) => {
    if (i % 2 === 0) a += bag(x0, y, x1)
    else b += bag(x0, y, x1)
    seams += `M${x0 + 12} ${y + 19}H${x1 - 12}`
  })

  return (
    `<path d="${a}" fill="${SAND}" stroke="${SAND_DARK}" stroke-width="2"/><path d="${b}" fill="${SAND_2}" stroke="${SAND_DARK}" stroke-width="2"/>` +
    `<path d="${seams}" stroke="${SAND_DARK}" stroke-width="1.6" stroke-dasharray="3 4"/>`
  )
}

/** The warning mark painted on signs and drums: an invented three-vaned hazard glyph in a broken ring. */
function hazardMark(r: number): string {
  let d = ''

  for (let k = 0; k < 3; k += 1) {
    const a0 = ((-118 + k * 120) * Math.PI) / 180
    const a1 = ((-62 + k * 120) * Math.PI) / 180
    const p = (rr: number, a: number) => `${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))}`

    d += `M${p(r * 0.32, a0)}L${p(r * 0.86, a0 - 0.08)}A${f(r * 0.86)} ${f(r * 0.86)} 0 0 1 ${p(r * 0.86, a1 + 0.08)}L${p(r * 0.32, a1)}Z`
  }

  return `<path d="${d}M${f(r * 0.18)} 0A${f(r * 0.18)} ${f(r * 0.18)} 0 1 1 ${f(-r * 0.18)} 0A${f(r * 0.18)} ${f(r * 0.18)} 0 1 1 ${f(r * 0.18)} 0Z" fill="${RUBBER}"/>`
}

/** The field laptop, and the yellow radiation counter whose needle reads the moment. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 14}" y="324.5" width="9" height="2.5" fill="${light}" fill-opacity=".55"/>`).join('')
  // Where the needle rests, and how far and fast it wobbles around that.
  const [angle, swing, secs] =
    activity === 'error'
      ? [66, 1.6, 0.22]
      : activity === 'run'
        ? [24, 24, 0.7]
        : activity === 'done'
          ? [-64, 0, 1]
          : activity === 'idle' || activity === 'thinking'
            ? [-46, 6, 2.6]
            : [-14, 14, 0.9]
  const lamp = activity === 'error' ? '#ff7a3a' : activity === 'done' ? '#7fe36a' : activity === 'run' ? '#ffd24a' : '#5d7a24'
  const halo = activity === 'error' || activity === 'run' ? `<circle cx="408" cy="287" r="11" fill="${lamp}" fill-opacity=".3"/>` : ''

  return (
    // The laptop: an olive case, the lid seen edge-on with its screen toward Claude.
    `<rect x="244" y="322" width="104" height="8" rx="2" fill="${OLIVE}"/>` +
    keys +
    `<path d="M336 327L360 238L373 241L349 329Z" fill="${OLIVE}"/>` +
    `<path d="M337 323L360 243L364 244L341 325Z" fill="${light}"/>` +
    `<path d="M337 323L360 243L347 247L327 323Z" fill="${light}" fill-opacity=".16"/>` +
    // The lid's dark back face and the hinge block, so the laptop reads at thumbnail size.
    `<path d="M349 329L373 241L378 243L355 330Z" fill="#20241a"/>` +
    `<path d="M357 235h17v7h-17zM242 320h8v10h-8zM339 324h18v6h-18z" fill="${RUBBER}"/>` +
    // The counter: a yellow box with a carry handle, a dial window, two knobs and a lamp.
    `<path d="M377 293V283Q377 277 383 277H403Q409 277 409 283V293" fill="none" stroke="${RUBBER}" stroke-width="4"/>` +
    `<rect x="370" y="292" width="46" height="38" rx="4" fill="${HAZ}" stroke="${HAZ_DARK}" stroke-width="2"/>` +
    `<rect x="375" y="297" width="36" height="21" rx="3" fill="#14160d"/>` +
    `<path d="M380 316A13 13 0 0 1 406 316Z" fill="#e2dfbe"/>` +
    `<g fill="none" stroke-width="3"><path d="M383.5 312.5A10 10 0 0 1 388 307.3" stroke="#5aa83a"/><path d="M389.5 306.5A10 10 0 0 1 398 307" stroke="#d8b02a"/><path d="M399.5 307.6A10 10 0 0 1 402.6 312.4" stroke="#d0502a"/></g>` +
    `<g transform="translate(393 316) rotate(${angle})"><g class="fd-nd" style="--a:${swing}deg;--s:${secs}s"><path d="M0 0V-12" stroke="${RUBBER}" stroke-width="1.8" stroke-linecap="round"/></g></g>` +
    `<circle cx="393" cy="316" r="2" fill="${RUBBER}"/>` +
    `<g fill="${RUBBER}"><circle cx="380" cy="324" r="3"/><circle cx="391" cy="324" r="3"/></g>` +
    `<g transform="translate(404 324) scale(.36)">${hazardMark(14)}</g>` +
    halo +
    `<circle cx="408" cy="287" r="4" fill="${lamp}"/>`
  )
}

export function falloutDawnWorld(): World {
  const next = random(5309)

  // The cloud ceiling, in two banks that part when done: dark bodies over undersides lit by the dawn.
  const bank = (x0: number, x1: number, lit: (x: number) => number): string => {
    let rims = ''
    let bodies = ''

    for (let i = 0; i < 9; i += 1) {
      const x = x0 + (i / 8) * (x1 - x0) + (next() - 0.5) * 50
      const y = 26 + next() * 160
      const rx = 110 + next() * 90
      const ry = 42 + next() * 40

      rims += `<ellipse cx="${f(x + 8)}" cy="${f(y + 13)}" rx="${f(rx + 6)}" ry="${f(ry + 4)}" fill="#6f8026" fill-opacity="${op(lit(x))}"/>`
      bodies += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${['#0b0f07', '#0e1309', '#10160a'][i % 3]}"/>`
    }

    return rims + bodies
  }
  const litLeft = (x: number) => Math.max(0.12, 0.55 - Math.max(0, x - 300) / 900)
  const litRight = (x: number) => (x > 1300 ? 0.2 : 0.1)

  // Long thin streaks of haze across the low sky, brightest toward the sun.
  const streaks = Array.from({ length: 6 }, (_, i) => {
    const x = 120 + i * 260 + next() * 80
    const strength = Math.max(0.05, 0.24 - Math.abs(x - 300) / 2400)

    return `<ellipse cx="${f(x)}" cy="${f(468 + next() * 90)}" rx="${f(220 + next() * 160)}" ry="${f(5 + next() * 4)}" fill="#c8d860" fill-opacity="${op(strength)}"/>`
  }).join('')

  // The dead city along the horizon: a far row in the haze and a near row in silhouette, broken tops.
  const skyline = (x0: number, x1: number, tall: number, seed: number): string => {
    const r = random(seed)
    let d = ''
    let x = x0

    while (x < x1) {
      const w = 24 + r() * 54
      const top = 648 - (24 + r() * tall)

      d +=
        r() < 0.5
          ? `M${f(x)} 648V${f(top + 18)}L${f(x + w * 0.3)} ${f(top)}L${f(x + w * 0.52)} ${f(top + 14)}L${f(x + w * 0.74)} ${f(top + 5)}L${f(x + w)} ${f(top + 24)}V648Z`
          : `M${f(x)} 648V${f(top)}H${f(x + w)}V648Z`
      x += w + r() * 10 - 3
    }

    return d
  }
  const litWindows = Array.from({ length: 9 }, () => `M${f(520 + next() * 680)} ${f(600 + next() * 36)}h4v5h-4z`).join('')

  // The gutted tower at the far right: its broken roofline, the window holes the sky shows through.
  const roofline: [number, number][] = [[1240, 300], [1268, 272], [1288, 290], [1318, 236], [1346, 252], [1372, 196], [1410, 214]]
  const roofAt = (x: number): number => {
    for (let i = 1; i < roofline.length; i += 1) {
      const [ax, ay] = roofline[i - 1]!
      const [bx, by] = roofline[i]!

      if (x <= bx) return ay + ((x - ax) / (bx - ax)) * (by - ay)
    }

    return 214
  }
  let holes = ''
  let floors = ''

  for (let c = 0; c < 7; c += 1) {
    for (let r = 0; r < 14; r += 1) {
      const x = 1250 + c * 22
      const y = 300 + r * 24

      if (y < Math.max(roofAt(x), roofAt(x + 12)) + 12 || next() < 0.16) continue
      holes += `M${x} ${y}h12v13h-12z`
    }
  }
  for (let r = 0; r < 15; r += 1) floors += `M1242 ${296 + r * 24}H1408`
  let holes2 = ''

  for (let c = 0; c < 7; c += 1) {
    for (let r = 0; r < 7; r += 1) {
      if (next() < 0.2) continue
      holes2 += `M${1436 + c * 22} ${470 + r * 24}h12v12h-12z`
    }
  }

  // Cracks in the dry ground.
  const cracks = Array.from({ length: 12 }, (_, i) => {
    let x = i < 7 ? next() * 420 : 1180 + next() * 420
    let y = 700 + next() * 280
    let d = `M${f(x)} ${f(y)}`

    for (let s = 0; s < 4; s += 1) {
      x += (next() - 0.5) * 60
      y += 6 + next() * 16
      d += `L${f(x)} ${f(y)}`
    }

    return d
  }).join('')

  // The fence along the left foreground: leaning posts, sagging wires and their barbs.
  const posts: [number, number, number][] = [[14, 704, 802], [130, 714, 798], [248, 722, 794], [366, 730, 790]]
  let wires = ''
  let barbs = ''

  for (let i = 0; i < posts.length - 1; i += 1) {
    const [xa, ta, ba] = posts[i]!
    const [xb, tb, bb] = posts[i + 1]!

    for (const k of [0.12, 0.42, 0.72]) {
      const ya = ta + (ba - ta) * k
      const yb = tb + (bb - tb) * k
      const broken = i === 1 && k === 0.42

      wires += broken
        ? `M${xa} ${f(ya)}Q${f(xa + 30)} ${f(ya + 26)} ${f(xa + 44)} ${f(ya + 46)}`
        : `M${xa} ${f(ya)}Q${f((xa + xb) / 2)} ${f((ya + yb) / 2 + 9)} ${xb} ${f(yb)}`
      if (!broken) {
        for (let t = 0.15; t < 0.95; t += 0.17) {
          const bx = xa + (xb - xa) * t
          const by = ya + (yb - ya) * t + 9 * 4 * t * (1 - t)

          barbs += `M${f(bx - 3)} ${f(by - 3)}l6 6m0 -6l-6 6`
        }
      }
    }
  }
  const postPath = posts.map(([x, t, b], i) => `M${x} ${b}L${x + (i % 2 ? 3 : -4)} ${t}`).join('')

  // Radioactive dust: motes that rise and fade, fewer and fainter over the chat.
  const motes = Array.from({ length: 25 }, (_, i) => {
    const zone = i % 5
    const x = zone < 2 ? next() * 420 : zone < 4 ? 1180 + next() * 420 : 420 + next() * 760
    const o = zone === 4 ? 0.3 : 0.75

    return `<circle class="fd-mt" style="--dx:${f((next() - 0.3) * 60)}px;--t:${f(9 + next() * 7)}s;--o:${o};animation-delay:${f(-next() * 14)}s" cx="${f(x)}" cy="${f(380 + next() * 560)}" r="${f(1.4 + next() * 1.8)}"/>`
  }).join('')

  // Two carrion birds circling in the glow over the towers.
  const bird = (cx: number, cy: number, r: number, secs: number, delay: number): string =>
    `<g transform="translate(${cx} ${cy})"><g class="fd-orb" style="animation-duration:${secs}s;animation-delay:${delay}s"><g transform="translate(${r} 0)">` +
    `<path class="fd-wing" d="M-10 0Q-5 -7 0 0Q5 -7 10 0" fill="none" stroke="${SIL}" stroke-width="2.6" stroke-linecap="round"/></g></g></g>`

  // The storm front, drawn with its leading edge at x 0 and rolled in from the left while a command runs: a lumpy
  // wall of dust with a lit rim, churning lumps inside it, sparks and glowing motes swept along.
  const crest: [number, number][] = []

  for (let x = -1720; x <= -200; x += 130) crest.push([x, 250 + (next() - 0.5) * 70])
  crest.push([-96, 226])
  for (let y = 300; y <= 990; y += 86) crest.push([-24 + (next() - 0.5) * 70 + Math.sin(y / 130) * 22, y])
  const edge = lumps(crest, next)
  const inner = Array.from({ length: 13 }, (_, i) => {
    const [x, y] = i < 6 ? [-1500 + i * 240, 330 + next() * 40] : [-110 - next() * 40, 330 + (i - 6) * 96]

    return `<circle class="fd-bl" style="animation-delay:${f(-i * 0.45)}s" cx="${f(x)}" cy="${f(y)}" r="${f(58 + next() * 30)}" fill="#1c2512" fill-opacity=".28"/>`
  }).join('')
  const sparks = Array.from({ length: 36 }, (_, i) => {
    const style = `--dx:${f(90 + next() * 120)}px;--dy:${f((next() - 0.6) * 70)}px;--t:${f(1.1 + next() * 0.9)}s;animation-delay:${f(-next() * 2)}s`
    const x = -760 + next() * 780
    const y = 260 + next() * 720

    return i % 6 === 0
      ? `<circle class="fd-sp" style="${style}" cx="${f(x)}" cy="${f(y)}" r="12" fill="url(#fd-tox)"/>`
      : `<circle class="fd-sp" style="${style}" cx="${f(x)}" cy="${f(y)}" r="${f(1.8 + next() * 1.8)}"/>`
  }).join('')

  // Crepuscular rays fanning up from the sun.
  const rays = [-164, -140, -116, -92, -68, -44].map((a, i) => {
    const w = 7 + (i % 2) * 5
    const p = (deg: number) => `${f(290 + 860 * Math.cos((deg * Math.PI) / 180))} ${f(640 + 860 * Math.sin((deg * Math.PI) / 180))}`

    return `M290 640L${p(a - w / 2)}L${p(a + w / 2)}Z`
  }).join('')

  // Leaning utility poles down the dead highway, their wires sagging toward the city.
  const poles: [number, number, number][] = [[600, 900, 220], [700, 760, 112], [748, 700, 58], [772, 672, 30]]
  const poleLines =
    poles.map(([x, b, h], i) => `M${x} ${b}L${x + (i % 2 ? 6 : -5)} ${b - h}M${f(x - h * 0.18)} ${f(b - h * 0.9)}H${f(x + h * 0.18)}`).join('') +
    poles
      .slice(1)
      .map(([x, b, h], i) => {
        const [px, pb, ph] = poles[i]!

        return `M${f(px - ph * 0.15)} ${f(pb - ph * 0.9)}Q${f((px + x) / 2)} ${f((pb - ph * 0.9 + b - h * 0.9) / 2 + 18)} ${f(x - h * 0.15)} ${f(b - h * 0.9)}`
      })
      .join('')
  const dust = Array.from({ length: 34 }, () => `M${f(-1500 + next() * 1480)} ${f(290 + next() * 700)}h${f(20 + next() * 50)}`).join('')

  // Done: warm motes drifting down the sunbeam over the post.
  const sunMotes = Array.from({ length: 9 }, (_, i) => `<circle class="fd-dm" style="animation-delay:${f(0.6 + i * 0.25)}s" cx="${f(30 + next() * 200)}" cy="${f(-200 + next() * 420)}" r="${f(1.6 + next() * 1.4)}" fill="#fff6d0"/>`).join('')

  const towerA = { cx: 165, base: 668, h: 340, bw: 132, tw: 88 }
  const towerB = { cx: 440, base: 656, h: 250, bw: 98, tw: 66 }
  const towerC = { cx: 1112, base: 650, h: 116, bw: 44, tw: 29 }
  const topA = towerA.base - towerA.h

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'spores',
      ink: '#050703',
      furniture: '#2c3020',
      metal: OLIVE,
      paper: '#d8d6b8',
      light: { idle: '#6f8f2a', work: LIME, bright: '#e4ff9a' },
      headTop: 206,
      glowAt: [350, 282],
      device,
      wear: {
        // An air bottle on the back, showing past the far side.
        behind:
          `<rect x="40" y="244" width="22" height="86" rx="10" fill="${OLIVE}" stroke="${RUBBER}" stroke-width="2"/>` +
          `<rect x="44" y="236" width="14" height="10" rx="3" fill="${RUBBER}"/><path d="M51 238C51 222 64 218 76 226" fill="none" stroke="${RUBBER}" stroke-width="4"/>`,
        // A yellow hazmat hood framing a wide see-through visor (the eyes stay clear behind it), a filter below.
        front:
          `<path d="M52 326L58 236C58 210 92 198 150 198C208 198 242 210 242 236L248 326H206V250H84V326Z" fill="${HAZ}" stroke="${HAZ_DARK}" stroke-width="2" stroke-linejoin="round"/>` +
          `<path d="M60 230C92 220 208 220 240 230M70 240V322M226 240V322" fill="none" stroke="${HAZ_DARK}" stroke-width="2" stroke-dasharray="5 4"/>` +
          `<rect x="84" y="250" width="122" height="72" rx="8" fill="#d8f0a0" fill-opacity=".13" stroke="${RUBBER}" stroke-width="6"/>` +
          `<g transform="translate(150 218) scale(.5)"><circle r="16" fill="${RUBBER}" fill-opacity=".25"/>${hazardMark(15)}</g>` +
          `<g fill="${RUBBER}"><rect x="78" y="244" width="10" height="10" rx="2"/><rect x="202" y="244" width="10" height="10" rx="2"/><rect x="78" y="316" width="10" height="10" rx="2"/><rect x="202" y="316" width="10" height="10" rx="2"/></g>` +
          '<path d="M188 256L203 267M197 256L203 260.5M90 304L104 318M90 312L96 318" stroke="#f4ffe0" stroke-opacity=".42" stroke-width="2.2" stroke-linecap="round"/>' +
          `<path d="M128 321H172L165 334H135Z" fill="${RUBBER}"/>` +
          `<circle cx="150" cy="338" r="11" fill="${OLIVE}" stroke="${RUBBER}" stroke-width="3"/>` +
          `<path d="M144 334H156M143 338H157M144 342H156" stroke="${RUBBER}" stroke-width="1.6"/>` +
          `<rect x="212" y="282" width="15" height="19" rx="2" fill="#d8d6b8" fill-opacity=".85"/><circle cx="219.5" cy="293" r="3.4" fill="${LIME}"/>`,
      },
      seatArt:
        // A stack of three sandbags.
        `<path d="${bag(98, 420, 204, 36)}${bag(102, 385, 200, 36)}${bag(106, 350, 196, 36)}" fill="${SAND}" stroke="${SAND_DARK}" stroke-width="2"/>` +
        `<path d="M112 440H190M116 405H186M120 370H182" stroke="${SAND_DARK}" stroke-width="1.6" stroke-dasharray="3 4"/>` +
        `<path d="M98 434l-7 -5v11zM204 434l7 -5v11zM102 399l-7 -5v11zM200 399l7 -5v11z" fill="${SAND_2}" stroke="${SAND_DARK}" stroke-width="1.4"/>` +
        '<path d="M120 354H182" stroke="#6c6646" stroke-width="2" stroke-linecap="round"/>' +
        `<path d="M136 428h12m5 0h4m5 0h12" stroke="${SAND_DARK}" stroke-width="3"/>`,
      tableArt:
        // A scrap steel plate on two rusted drums, one of them leaking.
        `<rect x="166" y="330" width="304" height="13" rx="2" fill="#2c3020" stroke="#4a5032" stroke-width="1.6"/>` +
        '<g fill="#5a6040"><circle cx="174" cy="336.5" r="2.2"/><circle cx="246" cy="336.5" r="2.2"/><circle cx="330" cy="336.5" r="2.2"/><circle cx="412" cy="336.5" r="2.2"/></g>' +
        `<g fill="${RUST}" stroke="${RUST_EDGE}" stroke-width="1.6"><rect x="188" y="343" width="50" height="113" rx="3"/><rect x="404" y="343" width="50" height="113" rx="3"/></g>` +
        `<path d="M188 372H238M188 424H238M404 372H454M404 424H454" stroke="${RUST_EDGE}" stroke-width="3"/>` +
        `<path d="M188 384H238V410H188Z" fill="${HAZ}" fill-opacity=".55"/><g transform="translate(213 397)">${hazardMark(11)}</g>` +
        `<path d="M196 343h22v5q-2 9 -5 0q-3 15 -6 0q-3 8 -11 0z" fill="${LIME}" fill-opacity=".55"/>`,
    },
    style:
      // The sky: clouds drift, plumes billow and lean downwind, the sun's haze breathes.
      '.fd-cl{animation:fd-drift 50s ease-in-out infinite alternate}@keyframes fd-drift{to{transform:translateX(40px)}}.fd-cr{animation-direction:alternate-reverse}' +
      '.fd-pf{transform-box:fill-box;transform-origin:center;animation:fd-pf 9s ease-in-out infinite alternate}' +
      '@keyframes fd-pf{from{transform:translate(0,0) scale(1)}to{transform:translate(9px,-12px) scale(1.08)}}' +
      `.fd-pa{transform-origin:${towerA.cx}px ${topA}px}.fd-pb{transform-origin:${towerB.cx}px ${towerB.base - towerB.h}px}` +
      '.fd-pa,.fd-pb{animation:fd-lean 11s ease-in-out infinite alternate}@keyframes fd-lean{from{transform:skewX(-2deg)}to{transform:skewX(-7deg)}}' +
      '.fd-br{animation:fd-br 6s ease-in-out infinite alternate}@keyframes fd-br{from{opacity:.7}to{opacity:1}}' +
      '.fd-crk{animation:fd-br 3.6s ease-in-out infinite alternate}.fd-pud{animation:fd-br 4.6s ease-in-out infinite alternate}' +
      '.fd-mt{opacity:0;animation:fd-mt var(--t,12s) linear infinite}' +
      '@keyframes fd-mt{0%{opacity:0;transform:translate(0,0)}15%,80%{opacity:var(--o,.7)}100%{opacity:0;transform:translate(var(--dx,10px),-170px)}}' +
      '.fd-orb{animation:mv-spin 16s linear infinite}' +
      '.fd-wing{transform-box:fill-box;transform-origin:50% 100%;animation:fd-flap .7s ease-in-out infinite alternate}@keyframes fd-flap{to{transform:scaleY(.4)}}' +
      '.fd-blk{animation:fd-blk 3s steps(1) infinite}@keyframes fd-blk{0%{opacity:.9}50%{opacity:.15}}' +
      '.fd-rag{transform-box:fill-box;transform-origin:0 50%;animation:fd-rag 1.5s ease-in-out infinite alternate}' +
      '@keyframes fd-rag{from{transform:skewY(-5deg) scaleX(.92)}to{transform:skewY(6deg) scaleX(1.04)}}' +
      '.fd-nd{animation:fd-nd var(--s,2s) ease-in-out infinite alternate}@keyframes fd-nd{from{transform:rotate(calc(var(--a,0deg) * -1))}to{transform:rotate(var(--a,0deg))}}' +
      // Thinking: the plumes slow and the crack in the tower pulses. Tool: the plumes churn.
      '.st-thinking .fd-pf{animation-duration:16s}.st-thinking .fd-crk{animation-duration:1.6s}' +
      '.st-tool .fd-pf{animation-duration:2.6s}.st-tool .fd-rag{animation-duration:.8s}' +
      '.st-read .fd-rag{animation-duration:3.6s}' +
      // Responding: dust blows along the plain.
      '.fd-gust{opacity:0}.st-responding .fd-gust{animation:fd-gust 4.2s ease-in-out infinite}' +
      '@keyframes fd-gust{0%{opacity:0;transform:translateX(-700px)}30%,70%{opacity:1}100%{opacity:0;transform:translateX(1400px)}}' +
      // Web: the whip antenna on the post calls out.
      '.fd-sig{opacity:0}.st-web .fd-sig{transform-box:fill-box;transform-origin:center;animation:fd-sig 1.5s ease-out infinite}' +
      '@keyframes fd-sig{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.7)}}.st-web .fd-blk{animation-duration:1.2s}' +
      // Run: the radioactive storm front rolls in from the left, sparks swirling in it; the plumes bend.
      '.fd-storm{opacity:0}.st-run .fd-storm{opacity:1}' +
      '.st-run .fd-sw{animation:fd-roll 7s linear both}' +
      '@keyframes fd-roll{0%{transform:translateX(0)}8%{transform:translateX(300px)}25%{transform:translateX(680px)}43%{transform:translateX(980px)}100%{transform:translateX(1520px)}}' +
      '.st-run .fd-bl{transform-box:fill-box;transform-origin:center;animation:fd-churn 2.2s ease-in-out infinite alternate}' +
      '@keyframes fd-churn{to{transform:translate(6px,-8px) scale(1.08)}}' +
      '.fd-sp{opacity:0}.st-run .fd-sp{animation:fd-sp var(--t,1.4s) linear infinite}' +
      '@keyframes fd-sp{0%{opacity:0;transform:translate(0,0)}25%,70%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.st-run .fd-stk{animation:fd-stk .9s linear infinite}@keyframes fd-stk{to{transform:translateX(220px)}}' +
      '.st-run .fd-pa,.st-run .fd-pb{animation:fd-gale 2.6s ease-out both}@keyframes fd-gale{to{transform:skewX(-24deg)}}' +
      '.st-run .fd-rag{animation-duration:.5s}' +
      // Error: the warning lamp lights and turns slowly, its siren rings out, an amber rim closes in.
      '.fd-alarm,.fd-vig{opacity:0}.st-error .fd-alarm{animation:fd-on .5s ease-out both}.st-error .fd-vig{animation:fd-on 1.2s ease-out both}' +
      '@keyframes fd-on{to{opacity:1}}' +
      '.st-error .fd-sweep{animation:mv-spin 4s linear infinite}' +
      '.fd-ring{opacity:0}.st-error .fd-ring{transform-box:fill-box;transform-origin:center;animation:fd-ring 2s ease-out infinite}' +
      '@keyframes fd-ring{0%{opacity:.6;transform:scale(.4)}100%{opacity:0;transform:scale(2.6)}}' +
      // Done: the clouds part, the poison drains from the sky, a clean sunbeam falls and the sprout opens.
      '.st-done .fd-cl{animation:fd-part-l 3.4s cubic-bezier(.2,.6,.3,1) both}.st-done .fd-cr{animation-name:fd-part-r}' +
      '@keyframes fd-part-l{to{transform:translateX(-340px)}}@keyframes fd-part-r{to{transform:translateX(400px)}}' +
      '.fd-clean,.fd-warm,.fd-beam,.fd-sunw,.fd-sglow{opacity:0}' +
      '.st-done .fd-clean{animation:fd-on 2.6s ease-out .4s both}.st-done .fd-warm{animation:fd-warm 3s ease-out .2s both}@keyframes fd-warm{to{opacity:.45}}' +
      '.st-done .fd-sunw{animation:fd-on 2.4s ease-out .3s both}.st-done .fd-beam{animation:fd-on 2s ease-out .5s both}' +
      '.st-done .fd-sick,.st-done .fd-mtg{animation:fd-off 3s ease-out both}@keyframes fd-off{to{opacity:.35}}' +
      '.fd-dm{opacity:0}.st-done .fd-dm{animation:fd-dm 3.4s ease-in-out infinite}@keyframes fd-dm{0%{opacity:0;transform:translate(0,0)}30%,70%{opacity:.8}100%{opacity:0;transform:translate(-18px,70px)}}' +
      '.fd-spr{transform-box:fill-box;transform-origin:50% 100%;transform:scale(.22)}.st-done .fd-spr{animation:fd-grow 1.4s cubic-bezier(.3,.8,.4,1) .4s both}' +
      '@keyframes fd-grow{from{transform:scale(.22)}to{transform:scale(1)}}' +
      '.fd-lfl,.fd-lfr{transform-box:fill-box}.fd-lfl{transform-origin:100% 100%;transform:rotate(64deg) scale(.5)}.fd-lfr{transform-origin:0 100%;transform:rotate(-64deg) scale(.5)}' +
      '.st-done .fd-lfl,.st-done .fd-lfr{animation:fd-open 1s ease-out 1.3s both}@keyframes fd-open{to{transform:rotate(0) scale(1)}}' +
      '.st-done .fd-sglow{animation:fd-on 1.6s ease-out 1s both}.st-done .fd-rag{animation-duration:4s}',
    scenery:
      '<defs>' +
      '<linearGradient id="fd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050703"/><stop offset=".45" stop-color="#0b1006"/><stop offset=".8" stop-color="#1a210c"/><stop offset="1" stop-color="#2c3712"/></linearGradient>' +
      '<radialGradient id="fd-dawn"><stop offset="0" stop-color="#e6f07a" stop-opacity=".6"/><stop offset=".22" stop-color="#b8c843" stop-opacity=".3"/><stop offset=".55" stop-color="#6d7d22" stop-opacity=".1"/><stop offset="1" stop-color="#6d7d22" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fd-halo"><stop offset="0" stop-color="#f4f9b0" stop-opacity=".75"/><stop offset=".35" stop-color="#d0e060" stop-opacity=".3"/><stop offset="1" stop-color="#d0e060" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fd-sun" cx=".5" cy=".55"><stop offset="0" stop-color="#eef6b8"/><stop offset=".7" stop-color="#e4ee98"/><stop offset="1" stop-color="#cfe06a"/></radialGradient>' +
      '<radialGradient id="fd-sunw2"><stop offset="0" stop-color="#fff8e0"/><stop offset=".7" stop-color="#ffe6a8"/><stop offset="1" stop-color="#f4c46a"/></radialGradient>' +
      '<linearGradient id="fd-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d850" stop-opacity="0"/><stop offset=".65" stop-color="#c8d850" stop-opacity=".16"/><stop offset="1" stop-color="#c8d850" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fd-gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2410"/><stop offset=".18" stop-color="#131909"/><stop offset="1" stop-color="#070905"/></linearGradient>' +
      '<radialGradient id="fd-ray" gradientUnits="userSpaceOnUse" cx="290" cy="640" r="860"><stop offset="0" stop-color="#eef59a" stop-opacity=".14"/><stop offset=".35" stop-color="#d8e870" stop-opacity=".045"/><stop offset="1" stop-color="#d8e870" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="fd-tox"><stop offset="0" stop-color="#d6ff5a" stop-opacity=".75"/><stop offset=".4" stop-color="#9ccc2a" stop-opacity=".3"/><stop offset="1" stop-color="#9ccc2a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="fd-st" gradientUnits="userSpaceOnUse" x1="-1700" y1="0" x2="40" y2="0"><stop offset="0" stop-color="#050703" stop-opacity=".84"/><stop offset=".75" stop-color="#0d1308" stop-opacity=".8"/><stop offset=".94" stop-color="#1f2a10" stop-opacity=".8"/><stop offset="1" stop-color="#3a4a1a" stop-opacity=".78"/></linearGradient>' +
      '<radialGradient id="fd-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#ff8a2a" stop-opacity="0"/><stop offset="1" stop-color="#ff8a2a" stop-opacity=".22"/></radialGradient>' +
      '<radialGradient id="fd-clr"><stop offset="0" stop-color="#fff6d8" stop-opacity=".46"/><stop offset=".45" stop-color="#d8e4ec" stop-opacity=".16"/><stop offset="1" stop-color="#d8e4ec" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="fd-wm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20345a"/><stop offset=".55" stop-color="#42444c"/><stop offset=".85" stop-color="#8c6a3e"/><stop offset="1" stop-color="#bc8846"/></linearGradient>' +
      '<linearGradient id="fd-gs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8040" stop-opacity="0"/><stop offset=".5" stop-color="#8a8040" stop-opacity=".2"/><stop offset="1" stop-color="#8a8040" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      // The sky, and the sickly dawn spreading from the sun.
      '<rect width="1600" height="660" fill="url(#fd-sky)"/>' +
      '<g class="fd-sick"><ellipse cx="290" cy="640" rx="700" ry="360" fill="url(#fd-dawn)"/><ellipse cx="1500" cy="650" rx="420" ry="170" fill="url(#fd-dawn)" opacity=".45"/></g>' +
      '<rect class="fd-warm" width="1600" height="660" fill="url(#fd-wm)"/>' +
      // The sun, half risen between the towers, and its rays.
      `<path class="fd-br" d="${rays}" fill="url(#fd-ray)"/>` +
      '<circle class="fd-br" cx="290" cy="640" r="170" fill="url(#fd-halo)"/>' +
      '<circle cx="290" cy="646" r="92" fill="url(#fd-sun)"/><circle class="fd-sunw" cx="290" cy="646" r="92" fill="url(#fd-sunw2)"/>' +
      streaks +
      // The cloud ceiling, and the clean sky the parting shows on the right.
      `<g class="mv-r"><circle class="fd-clean" cx="1330" cy="40" r="330" fill="url(#fd-clr)"/></g>` +
      `<g class="fd-cl">${bank(-120, 820, litLeft)}</g><g class="fd-cl fd-cr">${bank(800, 1720, litRight)}</g>` +
      // The horizon haze, then the far tower and the dead city in it.
      '<rect y="560" width="1600" height="120" fill="url(#fd-hz)"/>' +
      plume({ cx: towerC.cx, top: towerC.base - towerC.h, n: 6, lean: 6, r0: 14, grow: 5, toward: -1, shade: '#151b0c', lit: '#36401a', fade: 0.12 }, 3) +
      `<path d="${shell(towerC.cx, towerC.base, towerC.h, towerC.bw, towerC.tw, false)}" fill="#11160b"/>` +
      `<path d="${skyline(460, 1250, 150, 31)}" fill="#11160b"/>` +
      `<path d="${skyline(480, 1240, 90, 47)}" fill="#090c06"/>` +
      `<path d="${litWindows}" fill="${LIME}" fill-opacity=".22"/>` +
      // A leaning radio mast in the city with its slow light.
      '<path d="M996 648L1016 470M1032 648L1018 470M999 620H1029M1003 590H1027M1006 560H1025M1009 530H1023M1012 500H1021M999 620L1027 590M1029 620L1003 590M1003 590L1025 560M1027 590L1006 560" fill="none" stroke="#070905" stroke-width="2.4"/>' +
      '<circle class="fd-blk" cx="1017" cy="466" r="3.4" fill="#ff9a4a"/>' +
      // The two big cooling towers against the sun, their plumes, the glowing crack.
      `<g class="fd-pb">${plume({ cx: towerB.cx, top: towerB.base - towerB.h, n: 10, lean: 7, r0: 26, grow: 5.5, toward: -1, shade: '#1a210f', lit: '#4c5822', fade: 0.07 }, 2)}</g>` +
      `<g class="fd-pa">${plume({ cx: towerA.cx, top: topA, n: 14, lean: 6, r0: 36, grow: 6.5, toward: 1, shade: '#283112', lit: '#8d9c3c', fade: 0.05 }, 1)}</g>` +
      `<path d="${shell(towerB.cx, towerB.base, towerB.h, towerB.bw, towerB.tw, false)}" fill="${SIL}"/>` +
      `<path d="${side(towerB.cx, towerB.base, towerB.h, towerB.bw, towerB.tw, -1)}" fill="none" stroke="#d8e870" stroke-opacity=".4" stroke-width="2.4"/>` +
      `<path d="${shell(towerA.cx, towerA.base, towerA.h, towerA.bw, towerA.tw, true)}" fill="${SIL}"/>` +
      `<path d="${side(towerA.cx, towerA.base, towerA.h, towerA.bw, towerA.tw, 1)}" fill="none" stroke="#d8e870" stroke-opacity=".45" stroke-width="2.6"/>` +
      `<path d="M${towerA.cx - 40} ${topA + 30}L${towerA.cx - 52} ${towerA.base - 4}M${towerA.cx + 30} ${topA + 50}L${towerA.cx + 40} ${towerA.base - 4}M${towerB.cx - 20} ${towerB.base - towerB.h + 20}L${towerB.cx - 28} ${towerB.base - 4}" stroke="#1a2010" stroke-width="3"/>` +
      `<ellipse class="fd-crk" cx="${towerA.cx + 12}" cy="${topA + 100}" rx="30" ry="74" fill="url(#fd-tox)" opacity=".6"/>` +
      `<path class="fd-crk" d="M${towerA.cx + 5} ${topA + 36}L${towerA.cx + 14} ${topA + 62}L${towerA.cx + 6} ${topA + 84}L${towerA.cx + 18} ${topA + 118}L${towerA.cx + 10} ${topA + 150}" fill="none" stroke="${LIME}" stroke-opacity=".7" stroke-width="2.2" stroke-linejoin="round"/>` +
      bird(300, 440, 70, 14, 0) +
      bird(300, 440, 112, 19, -6) +
      // The plain: dry ground, cracks, the dead highway into the city.
      '<rect y="644" width="1600" height="356" fill="url(#fd-gnd)"/>' +
      '<path d="M786 646L816 646L1330 1000L230 1000Z" fill="#0d1009"/>' +
      '<path d="M786 646L230 1000M816 646L1330 1000" stroke="#262c16" stroke-opacity=".8" stroke-width="2"/>' +
      '<path d="M801 650L782 1000" stroke="#8a8a58" stroke-opacity=".16" stroke-width="3" stroke-dasharray="14 22"/>' +
      `<path d="${cracks}M640 900L700 880L760 912L820 890M900 760L940 776L990 768" fill="none" stroke="#040503" stroke-width="2"/>` +
      `<path d="${poleLines}" fill="none" stroke="#050604" stroke-width="3" stroke-linecap="round"/>` +
      '<rect class="fd-gust" x="0" y="700" width="760" height="260" fill="url(#fd-gs)"/>' +
      // The far right: the gutted tower and a tilted ruin, rubble at their feet.
      '<g class="mv-r">' +
      `<path d="M1240 648V${roofline.map(([x, y]) => `${x} ${y}`).join('L')}V648Z" fill="#0b0e08" stroke="#2a3416" stroke-opacity=".6" stroke-width="2"/>` +
      `<path d="${floors}" stroke="#141a0c" stroke-width="2"/><path d="${holes}" fill="#1f2810"/>` +
      '<path d="M1300 262l-4 -26M1322 238l6 -30M1360 226l-3 -22M1392 205l8 -24M1270 272l-6 -18" stroke="#3a4220" stroke-width="2"/>' +
      '<path d="M1426 648V452L1500 418L1560 440L1610 428V648Z" fill="#090c06" stroke="#2a3416" stroke-opacity=".5" stroke-width="2"/>' +
      `<path d="${holes2}" fill="#1a220e"/>` +
      '<path d="M1180 656Q1230 626 1290 650Q1350 622 1420 652Q1500 628 1610 650V672H1180Z" fill="#0b0e07"/>' +
      '</g>' +
      // The left foreground: fence and barbed wire, a hazard sign, a tipped drum leaking into a glowing pool.
      '<g class="mv-b">' +
      `<path d="${postPath}" stroke="#14130b" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="${wires}" fill="none" stroke="#3a3a26" stroke-opacity=".85" stroke-width="1.6"/><path d="${barbs}" stroke="#3a3a26" stroke-width="1.4"/>` +
      '<ellipse class="fd-pud" cx="246" cy="886" rx="74" ry="14" fill="url(#fd-tox)"/><ellipse cx="246" cy="886" rx="40" ry="6" fill="#c8f04a" fill-opacity=".32"/>' +
      '<ellipse class="fd-pud" cx="40" cy="772" rx="40" ry="7" fill="url(#fd-tox)" style="animation-delay:-2s"/>' +
      '<ellipse class="fd-pud" cx="392" cy="952" rx="54" ry="9" fill="url(#fd-tox)" style="animation-delay:-1s"/>' +
      `<g transform="translate(318 868) rotate(-72)"><rect x="-24" y="-36" width="48" height="72" rx="4" fill="${RUST}" stroke="${RUST_EDGE}" stroke-width="2"/>` +
      `<path d="M-24 -12H24M-24 14H24" stroke="${RUST_EDGE}" stroke-width="3"/><ellipse cx="0" cy="-36" rx="24" ry="6" fill="#140e06"/></g>` +
      `<path d="M282 852q-14 10 -20 30" stroke="${LIME}" stroke-opacity=".55" stroke-width="4" stroke-linecap="round" fill="none"/>` +
      '<path d="M92 948L80 790" stroke="#14130b" stroke-width="6" stroke-linecap="round"/>' +
      `<g transform="translate(82 786) rotate(-9)"><path d="M-34 -28H32L36 -20V28H-30L-34 18Z" fill="${HAZ}" fill-opacity=".8" stroke="${HAZ_DARK}" stroke-width="2"/>` +
      `<path d="M-34 6L-22 18L-30 28Z" fill="#14130b"/>${hazardMark(22)}</g>` +
      '</g>' +
      `<g class="fd-mtg" fill="#d6f56a">${motes}</g>` +
      // The storm front, waiting off to the left.
      '<g class="fd-storm"><g class="fd-sw">' +
      `<path d="M-1720 1000V${f(crest[0]![1])}${edge}L40 1000Z" fill="url(#fd-st)"/>` +
      inner +
      `<path d="M-1720 ${f(crest[0]![1])}${edge}" fill="none" stroke="#c8e85a" stroke-opacity=".1" stroke-width="22"/>` +
      `<path d="M-1720 ${f(crest[0]![1])}${edge}" fill="none" stroke="#d4f070" stroke-opacity=".34" stroke-width="3.5"/>` +
      `<g class="fd-stk"><path d="${dust}" stroke="#a8b860" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/></g>` +
      `<g fill="#dcff6e">${sparks}</g>` +
      '</g></g>' +
      // Error: the amber rim.
      '<rect class="fd-vig" width="1600" height="1000" fill="url(#fd-vig)"/>',
    nook:
      '<defs>' +
      `<linearGradient id="fd-wg" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${AMBER}" stop-opacity=".3"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="fd-lmp"><stop offset="0" stop-color="${AMBER}" stop-opacity=".6"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="fd-spot"><stop offset="0" stop-color="#fff2c0" stop-opacity=".45"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      // The post: a steel roof sheet on one post and a brace, a whip antenna, the warning lamp on top.
      '<path d="M398 -98V456M398 40L262 -80" stroke="#1c1910" stroke-width="10"/>' +
      '<path d="M150 -78L476 -104L478 -90L152 -64Z" fill="#2a261a" stroke="#4a4028" stroke-width="2"/>' +
      `<path d="${Array.from({ length: 18 }, (_, i) => {
        const x = 160 + i * 18
        const y = -78 + (x - 150) * (-26 / 326)

        return `M${x} ${f(y + 2)}l1 12`
      }).join('')}" stroke="#14110a" stroke-width="2"/>` +
      '<path d="M300 -90V-268" stroke="#2a2c1c" stroke-width="3"/><circle cx="300" cy="-270" r="3.5" fill="#b6e33a" fill-opacity=".8"/>' +
      [0, 0.5, 1].map(d => `<circle class="fd-sig" style="animation-delay:${d}s" cx="300" cy="-270" r="18" fill="none" stroke="${LIME}" stroke-width="2"/>`).join('') +
      // The lamp: dark until an error, then lit, turning, ringing.
      '<rect x="384" y="-108" width="28" height="11" rx="2" fill="#1c1910"/>' +
      '<path d="M386 -108A12 16 0 0 1 410 -108Z" fill="#4a2a14" stroke="#1c1910" stroke-width="2"/>' +
      '<g class="fd-alarm">' +
      // Each light wedge is three nested layers, so its sides ramp softly instead of stepping.
      `<g transform="translate(398 -114)"><g class="fd-sweep" fill="url(#fd-wg)" fill-opacity=".4">${[0, 180]
        .map(a => [250, 170, 90].map(w => `<path d="M0 0L-1200 -${w}V${w}Z"${a ? ` transform="rotate(${a})"` : ''}/>`).join(''))
        .join('')}</g></g>` +
      '<circle cx="398" cy="-114" r="46" fill="url(#fd-lmp)"/>' +
      `<path d="M386 -108A12 16 0 0 1 410 -108Z" fill="${AMBER}"/>` +
      [0, 1].map(d => `<circle class="fd-ring" style="animation-delay:${d}s" cx="398" cy="-114" r="22" fill="none" stroke="${AMBER}" stroke-opacity=".7" stroke-width="2.4"/>`).join('') +
      '</g>' +
      // The sandbag parapet on the left, the back wall under the desk, a stick with a rag in the wind.
      '<path d="M-30 224V96" stroke="#1c1910" stroke-width="5"/>' +
      '<g transform="translate(-30 100)"><path class="fd-rag" d="M0 0C16 -5 32 3 50 -3L44 9L54 16C36 21 16 14 0 18Z" fill="#6a5636" fill-opacity=".9"/></g>' +
      sandbags([
        [422, -70, -2], [422, 0, 66], [388, -64, 0], [388, 2, 64], [354, -70, -6], [354, -4, 62], [320, -62, 0], [320, 2, 60],
        [286, -66, -4], [286, -2, 58], [252, -58, 2], [252, 4, 56], [218, -52, -2], [218, 0, 48],
        [422, 236, 300], [422, 302, 366], [388, 250, 316], [388, 318, 384], [354, 236, 300], [354, 302, 366],
      ]) +
      // A jerrycan on the floor.
      `<path d="M24 456V412L32 404H62L68 410V456Z" fill="#3d4524" stroke="${RUBBER}" stroke-width="2"/><path d="M32 416L60 448M60 416L32 448" stroke="#2a3018" stroke-width="3"/><path d="M40 404V396H56V404" fill="none" stroke="${RUBBER}" stroke-width="3"/>` +
      // The tin can on the parapet, and the sprout that opens in it when done.
      '<circle class="fd-sglow" cx="8" cy="168" r="80" fill="url(#fd-spot)"/>' +
      '<rect x="-4" y="200" width="24" height="20" rx="2" fill="#4a4a3a" stroke="#22221a" stroke-width="1.6"/><path d="M-4 206H20" stroke="#6a6a50" stroke-width="2"/>' +
      '<g class="fd-spr"><g transform="translate(8 201) scale(1.4) translate(-8 -201)"><path d="M8 201C6 186 11 174 8 158" fill="none" stroke="#6fd85a" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path class="fd-lfl" d="M8 160C-4 150 -20 150 -28 160C-18 168 -2 168 8 160Z" fill="#7fe36a"/>' +
      '<path class="fd-lfr" d="M8 160C18 148 34 146 42 156C32 166 18 168 8 160Z" fill="#62cc52"/>' +
      '<path d="M8 160V150" stroke="#9af07e" stroke-width="2.4" stroke-linecap="round"/></g></g>',
    front:
      // Done: the clean sunbeam over the post, warm motes drifting down it.
      '<defs><linearGradient id="fd-bm" gradientUnits="userSpaceOnUse" x1="0" y1="-720" x2="0" y2="380"><stop offset="0" stop-color="#fff4cc" stop-opacity=".3"/><stop offset="1" stop-color="#fff4cc" stop-opacity=".07"/></linearGradient></defs>' +
      '<path class="fd-beam" d="M96 -720H226L250 380H-70Z" fill="url(#fd-bm)"/>' +
      sunMotes,
  }
}
