import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Monday Ruins: the city burns, and it is still Monday. Claude has come in to work anyway, in a dusty hard hat with
// its badge clipped on, at a cracked monitor on what is left of an office floor: open walls, a sagging ceiling, a
// desk propped on cinder blocks. Smoke columns rise from broken towers with burning floors; ash drifts down.
// When a command runs the big tower on the left gives way and sinks into a rolling dust cloud; an error makes the
// ceiling sag and rain debris by the desk; done parts the smoke and lets a shaft of morning light onto the desk.
const EMBER = '#ffb565'
const HOT = '#ff9a48'
const HAT = '#d6a32a'
const HAT_EDGE = '#8a6414'
const DESK = '#2c231e'
const DESK_EDGE = '#3e322a'
const IRON = '#1e1915'
const PAPER = '#ddd2c2'
const SLAB = '#1d1714'
const SLAB_LIT = '#2f1e15'
const REBAR = '#4a3a30'

type Tower = { x: number; w: number; top: number; d: string }

/** A row of towers from `from` to `to`, standing on `base`; most have ragged tops where floors fell away. */
function skyline(next: () => number, from: number, to: number, base: number, top: (x: number) => number, w0: number, w1: number): Tower[] {
  const out: Tower[] = []

  for (let x = from; x < to; ) {
    const w = w0 + next() * (w1 - w0)
    const t = top(x + w / 2) + (next() - 0.5) * 50
    let d = `M${f(x)} ${base}V${f(t)}`

    if (next() < 0.62) {
      for (let i = 1; i <= 4; i += 1) {
        d += `L${f(x + (w * i) / 4)} ${f(t + (i % 2 ? 8 + next() * 30 : next() * 12) + (i === 4 ? 14 : 0))}`
      }
      d += `V${base}Z`
    } else {
      d += `H${f(x + w)}V${base}Z`
    }

    out.push({ x, w, top: t, d })
    x += w - 4 + next() * 10
  }

  return out
}

/** A few floors of a tower, as lines that a dash pattern cuts into windows. */
function floors(t: Tower, next: () => number, count: number, step: number, base: number): string {
  let d = ''
  const rows = Math.max(1, Math.min(14, Math.floor((base - t.top - 50) / step)))

  for (let k = 0; k < count; k += 1) {
    const y = t.top + 34 + Math.floor(next() * rows) * step
    d += `M${f(t.x + 5)} ${f(y)}H${f(t.x + t.w - 5)}`
  }

  return d
}

/** A flame tongue standing on (0, 0), `w` wide and `h` tall, its tip leaning `lean`. */
function tongue(w: number, h: number, lean: number): string {
  return (
    `M${f(-w / 2)} 0C${f(-w / 2)} ${f(-h * 0.45)} ${f(-w * 0.1 + lean * 0.5)} ${f(-h * 0.7)} ${f(lean)} ${f(-h)}` +
    `C${f(w * 0.18 + lean * 0.5)} ${f(-h * 0.62)} ${f(w / 2)} ${f(-h * 0.42)} ${f(w / 2)} 0Z`
  )
}

/** A fire on (x, y): an outer and an inner tongue flickering out of step, and a glow behind when `glow` is set. */
function fire(next: () => number, x: number, y: number, w: number, h: number, glow = 0): string {
  const lean = (next() - 0.5) * w * 0.7

  return (
    `<g transform="translate(${f(x)} ${f(y)})">` +
    (glow > 0 ? `<circle class="mr-gw" cy="${f(-h * 0.35)}" r="${f(glow)}" fill="url(#mr-gl)"/>` : '') +
    `<path class="mr-fl" style="--t:${f(0.5 + next() * 0.4)}s;--d:${f(-next())}s" d="${tongue(w, h, lean)}" fill="url(#mr-fo)"/>` +
    `<path class="mr-fl" style="--t:${f(0.4 + next() * 0.3)}s;--d:${f(-next())}s" d="${tongue(w * 0.55, h * 0.62, lean * 0.6)}" fill="url(#mr-fi)"/></g>`
  )
}

/** A smoke column from (x, y) drifting by (dx, dy): a still body of growing puffs, and puffs that keep rising through it. */
function plume(next: () => number, x: number, y: number, dx: number, dy: number, r: number, count: number, secs: number): string {
  let out = `<ellipse cx="${f(x)}" cy="${f(y + r * 0.3)}" rx="${f(r * 1.4)}" ry="${f(r * 0.8)}" fill="url(#mr-sl)"/>`

  for (let i = 0; i < 6; i += 1) {
    const t = i / 5

    out += `<ellipse cx="${f(x + dx * t + (next() - 0.5) * 24)}" cy="${f(y + dy * t)}" rx="${f(r * (0.8 + t * 2.3))}" ry="${f(r * (0.7 + t * 1.6))}" fill="url(#mr-sm)"/>`
  }

  for (let i = 0; i < count; i += 1) {
    out += `<circle class="mr-pf" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#mr-sm)" style="--dx:${f(dx)}px;--dy:${f(dy)}px;--t:${f(secs)}s;--d:${f((-secs * i) / count)}s"/>`
  }

  return out
}

/** A lattice girder between two chords: zigzag braces every `step`. */
function lattice(x0: number, x1: number, y0: number, y1: number, step: number): string {
  let d = `M${x0} ${y0}H${x1}M${x0} ${y1}H${x1}`

  for (let x = x0, i = 0; x < x1; x += step, i += 1) {
    d += `M${f(x)} ${i % 2 ? y0 : y1}L${f(Math.min(x1, x + step))} ${i % 2 ? y1 : y0}`
  }

  return d
}

/** A piece of the slab overhead, from x0 to x1: its broken concrete edge, the lit underside with its ceiling grid. */
function slab(x0: number, x1: number, end: string, left = false): string {
  const grid = Array.from({ length: Math.floor((x1 - x0) / 26) }, (_, i) => `M${x0 + 13 + i * 26} -138V-114`).join('')
  const body = left
    ? `M${x0} -178H244${end.slice(9)}H${x0}Z`
    : x0 < 0
      ? `${end}H${x1}V-112H${x0 + 26}L${x0 + 6} -126L${x0 - 4} -140Z`
      : `${end}H${x1}V-112H${x0}Z`

  return (
    `<path d="${body}" fill="${SLAB}"/><path d="M${x0 + 4} -140H${x1 - 4}" stroke="#3e3029" stroke-width="2"/>` +
    `<path d="M${x0 + 8} -138H${x1 - 6}V-114H${x0 + 8}Z" fill="${SLAB_LIT}"/>` +
    `<path d="${grid}M${x0 + 8} -126H${x1 - 6}" stroke="#140f0d" stroke-width="1.5"/>` +
    `<path d="M${x0 + 8} -113H${x1 - 6}" stroke="#ff8a3d" stroke-opacity=".28" stroke-width="2"/>`
  )
}

/** The salvaged office monitor with a cracked screen, the keyboard, and a chipped mug of coffee. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 12}" y="324" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const worse =
    activity === 'error'
      ? '<path d="M304 296L316 290L322 278M356 240L346 230M356 282L342 290L340 300" fill="none" stroke="#0e0907" stroke-width="1.4"/>' +
        '<path d="M262 330l4 -6l7 1l2 5zM280 330l3 -4l5 1l1 3zM296 330l2 -3l4 0l1 3z" fill="#4a3e36"/>'
      : ''

  return (
    // The keyboard.
    '<rect x="244" y="322" width="82" height="8" rx="2" fill="#2e2924"/>' +
    keys +
    // The monitor on its stand, turned toward Claude: its back, the bezel, the screen.
    '<path d="M318 330H368L362 324H324Z" fill="#2e2924"/><rect x="338" y="296" width="8" height="30" fill="#2e2924"/>' +
    '<path d="M362 226L376 232V302L362 300Z" fill="#1c1815"/>' +
    '<path d="M298 238L362 226V300L298 308Z" fill="#2e2924" stroke="#4a423b" stroke-width="1.5" stroke-linejoin="round"/>' +
    `<path d="M304 243L356 233V295L304 302Z" fill="${light}" fill-opacity=".8"/>` +
    '<path d="M310 252L340 247M310 260L346 254M310 268L330 265M314 276L348 270M310 285L336 281" stroke="#3a1c0c" stroke-opacity=".45" stroke-width="2.2"/>' +
    // The crack from one knock, the tape holding a corner, a sticky note.
    '<path d="M336 262L344 250L350 236M336 262L354 266M336 262L326 280L322 298M336 262L320 256L306 250M344 250L355 246M326 280L314 285" fill="none" stroke="#0e0907" stroke-width="1.4"/>' +
    '<circle cx="336" cy="262" r="3" fill="#0e0907" fill-opacity=".7"/>' +
    '<path d="M294 252L314 228L321 233L300 257Z" fill="#a89e90" fill-opacity=".9"/>' +
    '<rect x="351" y="285" width="12" height="12" fill="#e9c84a" transform="rotate(8 357 291)"/>' +
    // A singed top corner, its edge still glowing.
    '<path d="M336 231L362 226V252L354 244L348 236Z" fill="#140a06" fill-opacity=".85"/><path d="M336 231L348 236L354 244L362 252" fill="none" stroke="#ff8a3d" stroke-opacity=".7" stroke-width="1.4"/>' +
    worse +
    // The mug, chipped, still steaming.
    '<rect x="384" y="314" width="16" height="16" rx="2" fill="#d9cfc2"/><rect x="384" y="319" width="16" height="4" fill="#ff8a3d"/>' +
    '<path d="M400 317q7 0 7 5q0 5 -7 5" fill="none" stroke="#d9cfc2" stroke-width="3"/><path d="M389 314l3 3l3 -3z" fill="#2a211c"/>' +
    '<g fill="none" stroke="#e8dccc" stroke-opacity=".5" stroke-width="2" stroke-linecap="round">' +
    '<path class="mr-stm" d="M389 308c-4 -6 4 -10 0 -16"/><path class="mr-stm" style="animation-delay:-1.3s" d="M396 307c-4 -6 4 -10 0 -16"/></g>'
  )
}

export function mondayRuinsWorld(): World {
  const next = random(54)
  const inColumn = (x: number) => x > 430 && x < 1170

  // The far skyline: thin towers, taller at the edges, their windows a pattern; a few floors burning.
  const far = skyline(next, -30, 1640, 800, x => 440 + 120 * (1 - Math.abs(x - 800) / 800), 56, 110)
  const farHot: [string, string] = ['', '']
  let farFaint = ''

  for (const t of far) {
    const c = t.x + t.w / 2

    if (inColumn(c)) {
      if (next() < 0.12) farFaint += floors(t, next, 1, 16, 800)
    } else if (next() < 0.7) {
      const k = next() < 0.5 ? 0 : 1

      farHot[k] += floors(t, next, 1 + Math.floor(next() * 2), 16, 800)
    }
  }

  // Fires on the far roofs: two on the left, one in the middle (small and dim), one on the right.
  const roof = (at: number) => far.reduce((best, t) => (Math.abs(t.x + t.w / 2 - at) < Math.abs(best.x + best.w / 2 - at) ? t : best))
  const farFires = [
    [roof(60), 20, 38, 90],
    [roof(380), 18, 34, 80],
    [roof(1500), 18, 30, 70],
  ] as const
  const mid = roof(720)

  // The near skyline: lower, darker blocks in front of the big tower's foot.
  const near = skyline(next, -40, 1640, 860, x => 612 + 112 * (1 - Math.abs(x - 800) / 800), 84, 150)
  const nearHot: [string, string] = ['', '']
  let nearFaint = ''

  for (const t of near) {
    const c = t.x + t.w / 2

    if (inColumn(c)) {
      if (next() < 0.15) nearFaint += floors(t, next, 1, 19, 860)
    } else if (next() < 0.8) {
      const k = next() < 0.5 ? 0 : 1

      nearHot[k] += floors(t, next, 1 + Math.floor(next() * 3), 19, 860)
    }
  }

  // The big tower on the left, broken at the top and burning through a band of floors. It is the one that falls.
  const T1 =
    'M110 800V300L124 282L132 296L150 246L164 264L178 218L190 232L204 200L218 246L232 236L246 282L262 274L276 312L290 308' +
    'V380L268 392L256 422L270 446L290 460V800Z'
  const t1Hot =
    'M116 340H284M116 358H284M116 376H270M116 394H254M116 412H252M116 430H260M140 520H230M160 590H284M116 650H190'
  const tower1 =
    '<circle class="mr-gw" cx="204" cy="300" r="230" fill="url(#mr-gl)"/>' +
    `<path d="${T1}" fill="url(#mr-wpt)"/>` +
    '<path d="M290 380L268 392L256 422L270 446L290 460Z" fill="#3a1608"/>' +
    `<path class="mr-w1" d="${t1Hot}" stroke="${HOT}" stroke-width="8" stroke-dasharray="5 8 5 8 5 21 5 8"/>` +
    `<path class="mr-w2" d="M122 349H280M122 403H248M130 610H260" stroke="#ffc070" stroke-width="5" stroke-dasharray="3 10 3 23 3 10"/>` +
    '<path d="M110 800V300L124 282L132 296" fill="none" stroke="#ff7a2a" stroke-opacity=".35" stroke-width="2.4"/>' +
    `<path d="M150 246L146 226M178 218L184 196M204 200L200 178M232 236L240 220M262 274L268 254" stroke="${REBAR}" stroke-width="2.4"/>` +
    fire(next, 150, 250, 30, 60) +
    fire(next, 178, 222, 40, 88) +
    fire(next, 204, 204, 48, 110, 120) +
    fire(next, 232, 240, 34, 70) +
    fire(next, 262, 278, 30, 56) +
    fire(next, 276, 450, 34, 60)

  // Chunks that break off the tower as it goes.
  const chunks = Array.from({ length: 6 }, (_, i) => {
    const x = 150 + next() * 130
    const y = 250 + next() * 160
    const s = 6 + next() * 8

    return (
      `<path class="mr-ch" style="--dx:${f(-60 - next() * 120)}px;--dy:${f(300 + next() * 160)}px;--r:${f(-200 - next() * 300)}deg;animation-delay:${f(0.3 + i * 0.22)}s" ` +
      `d="M${f(x)} ${f(y)}l${f(s)} ${f(-s * 0.6)}l${f(s * 0.8)} ${f(s)}l${f(-s * 1.2)} ${f(s * 0.7)}z" fill="#120c0a" stroke="#5a3420" stroke-width="1.2"/>`
    )
  }).join('')

  // The dust cloud the tower sinks into: soft blobs that swell and roll out along the street.
  const dust = (front: boolean) =>
    Array.from({ length: front ? 5 : 7 }, (_, i) => {
      const x = (front ? 60 : 40) + next() * 330
      const y = front ? 760 + next() * 50 : 620 + next() * 140
      const r = front ? 70 + next() * 50 : 90 + next() * 70

      return `<circle class="mr-dc" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#mr-du)" style="--dx:${f((x - 200) * 0.9 + (next() - 0.3) * 60)}px;--dy:${f(-40 - next() * 70)}px;animation-delay:${f(0.15 + i * 0.2 + (front ? 0.5 : 0))}s"/>`
    }).join('')

  // The tower crane over the right, its jib snapped at the tip, a girder still swinging on the hook.
  const crane =
    `<path d="${lattice(1000, 1340, 112, 126, 20)}${lattice(1354, 1470, 112, 122, 18)}" fill="none" stroke="#080605" stroke-width="2.6"/>` +
    `<g transform="rotate(-34 1000 119)"><path d="${lattice(932, 1000, 112, 126, 17)}" fill="none" stroke="#080605" stroke-width="2.6"/></g>` +
    '<path d="M1340 112V700M1354 112V700" stroke="#080605" stroke-width="3"/>' +
    `<path d="${Array.from({ length: 15 }, (_, i) => `M1340 ${112 + i * 40}L1354 ${132 + i * 40}L1340 ${152 + i * 40}`).join('')}" fill="none" stroke="#080605" stroke-width="2"/>` +
    '<path d="M1340 112L1347 62L1354 112M1347 62L1090 112M1347 62L1466 112" fill="none" stroke="#080605" stroke-width="2"/>' +
    '<rect x="1432" y="122" width="36" height="30" fill="#080605"/><rect x="1354" y="126" width="26" height="20" fill="#080605"/>' +
    '<rect x="1360" y="130" width="14" height="8" fill="#5a2a14" fill-opacity=".8"/>' +
    '<rect x="1062" y="124" width="16" height="8" fill="#080605"/>' +
    '<g class="mr-hk"><path d="M1070 132V292M1070 304L1034 318M1070 304L1106 318" stroke="#080605" stroke-width="2"/>' +
    '<rect x="1063" y="290" width="14" height="14" rx="2" fill="#080605"/>' +
    '<path d="M1022 318H1118V330H1022Z" fill="#0a0706" stroke="#2a1a12" stroke-width="1.5"/><path d="M1022 324H1118" stroke="#2a1a12" stroke-width="1.5"/></g>'

  // The second tower, behind the crane, burning from the roof down.
  const T2 = 'M1200 840V286L1216 270L1230 284L1250 252L1266 262L1282 240L1300 268L1320 262V840Z'
  const tower2 =
    '<circle class="mr-gw" cx="1266" cy="300" r="260" fill="url(#mr-gl)" style="animation-delay:-1.3s"/>' +
    `<path d="${T2}" fill="url(#mr-wpt)"/>` +
    `<path class="mr-w2" d="M1206 300H1314M1206 319H1314M1206 338H1290M1220 376H1314" stroke="${HOT}" stroke-width="8" stroke-dasharray="5 8 5 21 5 8"/>` +
    fire(next, 1250, 256, 36, 74) +
    fire(next, 1282, 244, 42, 92, 110) +
    fire(next, 1310, 266, 28, 54)

  // Embers rising on the heat, most at the edges, a few faint ones across the middle; grouped by color.
  const embers = ['', '', '']

  for (let i = 0; i < 26; i += 1) {
    const zone = i % 5
    const x = zone < 2 ? next() * 430 : zone < 4 ? 1180 + next() * 420 : 440 + next() * 720
    const y = zone === 4 ? 780 + next() * 120 : 380 + next() * 480

    embers[zone === 4 ? 2 : next() > 0.4 ? 0 : 1] +=
      `<circle class="mr-em" cx="${f(x)}" cy="${f(y)}" r="${f(1 + next() * 1.2)}" ` +
      `style="--dx:${f(30 + next() * 130)}px;--dy:${f(-220 - next() * 320)}px;--t:${f(5 + next() * 5)}s;--d:${f(-next() * 9)}s"/>`
  }

  // The overcast of smoke across the top, lit orange from below over the fires.
  const overcast = (from: number, cls: string) =>
    `<g class="${cls}">` +
    Array.from({ length: 8 }, (_, i) => {
      const x = from + i * 130 + next() * 50
      const y = 10 + next() * 170

      return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(140 + next() * 90)}" ry="${f(50 + next() * 50)}" fill="${i % 2 ? '#120c0a' : '#170f0c'}" fill-opacity=".92"/>`
    }).join('') +
    '</g>'

  // The burnt-out car on the rubble, still burning inside.
  const car =
    '<g transform="translate(232 884) rotate(-6)">' +
    '<path d="M-100 20L-94 -4L-52 -10L-28 -32H38L62 -8L100 -2L104 20Z M-22 -26H8V-11H-40Z M14 -26H34L52 -11H14Z" fill="#100b09" fill-rule="evenodd" stroke="#3a2418" stroke-width="1.5" stroke-linejoin="round"/>' +
    `<path class="mr-w1" d="M-22 -26H8V-11H-40Z M14 -26H34L52 -11H14Z" fill="${HOT}" fill-opacity=".45"/>` +
    '<g fill="#050403" stroke="#2a1a12" stroke-width="2"><circle cx="-58" cy="22" r="13"/><circle cx="66" cy="22" r="13"/></g>' +
    fire(next, -6, -26, 30, 48, 70) +
    '</g>'

  // Paper sheets and grit floating in the light when the smoke parts.
  const motes = Array.from({ length: 9 }, () => {
    const y = -120 + next() * 420
    const x = 262 - (y + 140) * 0.08 + next() * 50

    return `<circle class="mr-mote" cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + next() * 1.4)}" fill="#ffecc8" style="--dx:${f((next() - 0.5) * 30)}px;--dy:${f(-20 - next() * 30)}px;animation-delay:${f(-next() * 5)}s"/>`
  }).join('')

  // Debris that rains off the sagging slab onto the desk.
  const rubble = Array.from({ length: 9 }, (_, i) => {
    const x = 232 + next() * 62
    const s = 5 + next() * 6

    return (
      `<path class="mr-db" style="--dx:${f((next() - 0.5) * 24)}px;--y:${f(402 + next() * 8)}px;--r:${f((next() - 0.5) * 420)}deg;animation-delay:${f(0.12 + i * 0.13)}s" ` +
      `d="M${f(x - s)} -84l${f(s)} ${f(-s * 0.8)}l${f(s * 1.1)} ${f(s * 0.5)}l${f(-s * 0.3)} ${f(s * 1.2)}z" fill="#7a6a5c" stroke="#a89482" stroke-width="1.2"/>`
    )
  }).join('')

  const hot = (d: string, cls: string, width: number, dash: string) =>
    d === '' ? '' : `<path class="${cls}" d="${d}" stroke="${HOT}" stroke-width="${width}" stroke-dasharray="${dash}"/>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#0a0706',
      furniture: DESK,
      metal: '#34302b',
      paper: PAPER,
      light: { idle: '#c26a32', work: '#ff8a3d', bright: '#ffc48a' },
      headTop: 206,
      glowAt: [334, 268],
      device,
      wear: {
        // A dusty hard hat whose brim ends above the eyes, and the office badge clipped to the front.
        front:
          `<path d="M64 250C64 216 100 196 150 196C200 196 236 216 236 250Z" fill="${HAT}" stroke="${HAT_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
          '<path d="M64 250C64 216 100 196 150 196C122 204 100 222 98 250Z" fill="#000" fill-opacity=".16"/>' +
          '<path d="M139 197C135 214 135 232 137 250H163C165 232 165 214 161 197Z" fill="#ecc250"/>' +
          `<path d="M106 210C100 222 98 236 98 250M194 210C200 222 202 236 202 250" fill="none" stroke="${HAT_EDGE}" stroke-opacity=".7" stroke-width="3"/>` +
          '<g fill="#c9b48c" fill-opacity=".6"><ellipse cx="120" cy="207" rx="14" ry="4"/><circle cx="182" cy="212" r="3"/><circle cx="194" cy="206" r="2"/><circle cx="106" cy="232" r="2.4"/></g>' +
          '<path d="M174 226L186 224L188 236L176 238Z" fill="#ff8a3d" fill-opacity=".9"/><path d="M178 231l6 -1" stroke="#3a2010" stroke-width="2"/>' +
          // Soot from the fires: a scorch on the dome, smeared toward the brim.
          '<path d="M206 236C208 226 218 220 228 226C234 232 232 242 226 246C218 248 208 246 206 236Z" fill="#2a1a10" fill-opacity=".6"/>' +
          '<g fill="#2a1a10" fill-opacity=".5"><circle cx="200" cy="244" r="2.4"/><circle cx="214" cy="218" r="1.8"/><circle cx="122" cy="238" r="3"/></g>' +
          `<path d="M50 245H250L257 253H43Z" fill="#c4921e" stroke="${HAT_EDGE}" stroke-width="1.5" stroke-linejoin="round"/>` +
          '<rect x="186" y="318" width="8" height="4" fill="#34302b"/>' +
          '<rect x="178" y="320" width="24" height="30" rx="2" fill="#e8e0d4"/><rect x="182" y="324" width="9" height="9" fill="#a85a3c"/>' +
          '<rect x="178" y="343" width="24" height="5" fill="#ff8a3d"/><path d="M194 326h5M194 330h4M182 338h16" stroke="#7a6e62" stroke-width="1.6"/>' +
          '<g fill="#b8a48c" fill-opacity=".45"><rect x="92" y="312" width="4" height="4"/><rect x="136" y="326" width="3" height="3"/><rect x="214" y="318" width="4" height="3"/><rect x="118" y="340" width="3" height="3"/></g>',
      },
      seatArt:
        // An office chair that has seen things: a torn back, the column on a star base, a brick for a lost caster.
        `<rect x="44" y="232" width="24" height="98" rx="9" fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="2"/>` +
        '<path d="M50 254l8 -5l6 8l-4 10l-8 -2z" fill="#8a7458" fill-opacity=".8"/>' +
        `<path d="M56 328V352H100" fill="none" stroke="${IRON}" stroke-width="7"/>` +
        `<rect x="62" y="350" width="150" height="13" rx="5" fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="2"/>` +
        `<rect x="130" y="363" width="10" height="60" fill="${IRON}"/>` +
        `<path d="M135 423L86 443M135 423L184 440M135 423L134 446" stroke="${IRON}" stroke-width="6" stroke-linecap="round"/>` +
        `<g fill="${IRON}"><circle cx="84" cy="449" r="6"/><circle cx="134" cy="450" r="6"/></g>` +
        '<rect x="172" y="440" width="30" height="16" fill="#5a2e22" stroke="#3a1c14"/>',
      tableArt:
        // The desk top on one metal leg and a stack of cinder blocks, dust along its edge.
        `<path d="M166 330H470V344H180L172 340Z" fill="${DESK}" stroke="${DESK_EDGE}" stroke-width="1.5"/>` +
        '<path d="M172 331H468" stroke="#7a6a5a" stroke-opacity=".5" stroke-width="1.5"/>' +
        `<rect x="182" y="344" width="10" height="106" fill="${IRON}"/><rect x="176" y="450" width="22" height="6" fill="${IRON}"/>` +
        '<g fill="#4a433c" stroke="#2a2520" stroke-width="1.5"><rect x="352" y="344" width="58" height="36"/><rect x="350" y="382" width="58" height="36"/><rect x="353" y="420" width="58" height="36"/></g>' +
        '<g fill="#1e1a17"><rect x="360" y="352" width="16" height="20"/><rect x="386" y="352" width="16" height="20"/><rect x="358" y="390" width="16" height="20"/>' +
        '<rect x="384" y="390" width="16" height="20"/><rect x="361" y="428" width="16" height="20"/><rect x="387" y="428" width="16" height="20"/></g>',
    },
    style:
      // Fire, glow, burning floors, smoke and embers: always.
      '.mr-fl{transform-box:fill-box;transform-origin:50% 100%;animation:mr-fl var(--t) ease-in-out var(--d) infinite alternate}' +
      '@keyframes mr-fl{from{transform:scale(1,.84)}to{transform:scale(.9,1.1)}}' +
      '.mr-gw{animation:mr-gw 2.8s ease-in-out infinite alternate}@keyframes mr-gw{from{opacity:.72}to{opacity:1}}' +
      '.mr-w1{animation:mr-w 1.9s ease-in-out infinite alternate}.mr-w2{animation:mr-w 2.7s ease-in-out -1.1s infinite alternate}' +
      '@keyframes mr-w{from{opacity:.5}to{opacity:1}}' +
      '.mr-pf{transform-box:fill-box;transform-origin:center;opacity:0;animation:mr-pf var(--t) linear var(--d) infinite}' +
      '@keyframes mr-pf{0%{opacity:0;transform:translate(0,0) scale(.5)}12%{opacity:.9}70%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(3.2)}}' +
      '.mr-sb{animation:mr-sb 46s ease-in-out infinite alternate}.mr-sb2{animation-duration:62s;animation-direction:alternate-reverse}' +
      '@keyframes mr-sb{to{transform:translateX(56px)}}' +
      '.mr-em{opacity:0;animation:mr-em var(--t) linear var(--d) infinite}' +
      '@keyframes mr-em{0%{opacity:0;transform:translate(0,0)}12%{opacity:.95}80%{opacity:.55}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.mr-hk{transform-origin:1070px 128px;animation:mr-hk 7s ease-in-out infinite alternate}@keyframes mr-hk{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}' +
      '.st-error .mr-hk{animation-duration:1.4s}' +
      '.mr-stm{opacity:0;animation:mr-stm 2.6s ease-out infinite}@keyframes mr-stm{0%{opacity:0;transform:translateY(4px)}30%{opacity:.8}100%{opacity:0;transform:translateY(-10px)}}' +
      // The office floor: the hanging light swings and buzzes, the cut cables sway.
      '.mr-sw{animation:mr-sw 5s ease-in-out infinite alternate}@keyframes mr-sw{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-error .mr-sw{animation:mr-sw2 .9s ease-in-out infinite alternate}@keyframes mr-sw2{from{transform:rotate(-13deg)}to{transform:rotate(9deg)}}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: the tube dips twice per cycle, cycles 4.3 s (2.1 s on an error) apart.
      '.mr-tube{animation:mr-tube 4.3s linear infinite}.st-error .mr-tube{animation-duration:2.1s}' +
      '@keyframes mr-tube{0%,84%,100%{opacity:1}86%{opacity:.35}88%{opacity:.95}91%{opacity:.4}94%{opacity:1}}' +
      '.mr-cab{transform-origin:52px -112px;animation:mr-cab 6s ease-in-out infinite alternate}@keyframes mr-cab{from{transform:rotate(-2deg)}to{transform:rotate(2.5deg)}}' +
      // A tool: the cut cable sparks, once every .8 s.
      '.mr-spk{opacity:0}.st-tool .mr-spk{animation:mr-spk .8s linear infinite}@keyframes mr-spk{0%{opacity:0}6%{opacity:1}26%,100%{opacity:0}}' +
      // A command runs: the big tower gives way, sheds chunks and sinks into a rolling dust cloud.
      '.mr-tw{transform-origin:110px 800px}' +
      '.st-run .mr-tw{animation:mr-fall 3.4s linear .1s both}' +
      '@keyframes mr-fall{0%{transform:translateY(0) rotate(0)}7%{transform:translateY(7px) rotate(-2.8deg)}13%{transform:translateY(5px) rotate(-2.2deg)}' +
      '20%{transform:translateY(16px) rotate(-3.4deg)}42%{transform:translateY(66px) rotate(-6.5deg)}62%{transform:translateY(150px) rotate(-13deg)}' +
      '80%{transform:translateY(250px) rotate(-20deg);opacity:1}100%{transform:translateY(340px) rotate(-27deg);opacity:0}}' +
      '.mr-dc{transform-box:fill-box;transform-origin:center;opacity:0}' +
      '.st-run .mr-dc{animation:mr-dc 3.2s ease-out both}' +
      '@keyframes mr-dc{0%{opacity:0;transform:translate(0,0) scale(.25)}20%{opacity:.9}100%{opacity:.85;transform:translate(var(--dx),var(--dy)) scale(1.55)}}' +
      '.mr-ch{transform-box:fill-box;transform-origin:center;opacity:0}' +
      '.st-run .mr-ch{animation:mr-ch 1.9s cubic-bezier(.5,0,.9,.5) both}' +
      '@keyframes mr-ch{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}}' +
      // An error: the broken slab over the desk sags, debris and dust rain down beside the keyboard and on the hat.
      '.mr-ceil{transform-origin:60px -112px}' +
      '.st-error .mr-ceil{animation:mr-sag 1.3s cubic-bezier(.2,.8,.3,1) both}' +
      '@keyframes mr-sag{0%{transform:rotate(0)}20%{transform:rotate(11deg)}32%{transform:rotate(8deg)}46%{transform:rotate(10.5deg)}62%{transform:rotate(9deg)}100%{transform:rotate(9.6deg)}}' +
      '.mr-eb{transform-box:fill-box;transform-origin:center;opacity:0}.st-error .mr-eb{animation:mr-eb 1.6s ease-out .1s both}' +
      '@keyframes mr-eb{0%{opacity:0;transform:scale(.3)}25%{opacity:.95}100%{opacity:.5;transform:translateY(26px) scale(1.4)}}' +
      '.mr-db{transform-box:fill-box;transform-origin:center;opacity:0}' +
      '.st-error .mr-db{animation:mr-db 1.25s cubic-bezier(.5,0,.9,.6) infinite}' +
      '@keyframes mr-db{0%{opacity:0;transform:translate(0,0) rotate(0)}6%{opacity:1}62%{opacity:1;transform:translate(var(--dx),var(--y)) rotate(var(--r))}' +
      '72%{transform:translate(var(--dx),calc(var(--y) - 10px)) rotate(var(--r))}82%{opacity:1;transform:translate(var(--dx),var(--y)) rotate(var(--r))}' +
      '100%{opacity:0;transform:translate(var(--dx),var(--y)) rotate(var(--r))}}' +
      '.mr-dt{opacity:0}.st-error .mr-dt{opacity:1;animation:mr-dt .6s linear infinite}@keyframes mr-dt{to{stroke-dashoffset:-60}}' +
      '.mr-hp{transform-box:fill-box;transform-origin:50% 100%;opacity:0}' +
      '.st-error .mr-hp{animation:mr-hp .6s ease-out .2s infinite}@keyframes mr-hp{0%{opacity:0;transform:scale(.3)}30%{opacity:.8}100%{opacity:0;transform:scale(1.6,1.3)}}' +
      // Done: the smoke over the sun parts, the sun turns from red to gold, and its light falls through the hole onto the desk.
      '.st-done .mr-cl{animation:mr-cl 3.4s ease-out both}@keyframes mr-cl{to{transform:translateX(-260px);opacity:.25}}' +
      '.st-done .mr-cr{animation:mr-cr 3.4s ease-out both}@keyframes mr-cr{to{transform:translateX(260px);opacity:.25}}' +
      '.st-done .mr-p3{animation:mr-thin 3s ease-out both}@keyframes mr-thin{to{opacity:.3}}' +
      '.mr-gold,.mr-shaft{opacity:0}.st-done .mr-gold{animation:mr-in 2.4s ease-out .3s both}.st-done .mr-shaft{animation:mr-in 2s ease-out .3s both}' +
      '@keyframes mr-in{to{opacity:1}}' +
      '.st-done .mr-red{animation:mr-out 2.4s ease-out both}@keyframes mr-out{to{opacity:0}}' +
      '.mr-mote{animation:mr-mote 5s ease-in-out infinite alternate}@keyframes mr-mote{to{transform:translate(var(--dx),var(--dy))}}' +
      // Web: a news helicopter crosses the top with a slow beacon and a searchlight.
      '.mr-heli{opacity:0}.st-web .mr-heli{opacity:1;animation:mr-heli 13s linear both}@keyframes mr-heli{to{transform:translateX(-1900px)}}' +
      '.mr-bcn{animation:mr-bcn 1.2s steps(1) infinite}@keyframes mr-bcn{0%{opacity:1}30%{opacity:.15}}' +
      '.mr-cone{transform-origin:0 6px;animation:mr-cone 3.4s ease-in-out infinite alternate}@keyframes mr-cone{from{transform:rotate(-10deg)}to{transform:rotate(12deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="mr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090605"/><stop offset=".42" stop-color="#120b08"/>' +
      '<stop offset=".7" stop-color="#24120a"/><stop offset=".86" stop-color="#1a0d07"/><stop offset="1" stop-color="#0c0705"/></linearGradient>' +
      '<radialGradient id="mr-gl"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".55"/><stop offset=".35" stop-color="#e0501a" stop-opacity=".24"/><stop offset="1" stop-color="#c03a10" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mr-sm"><stop offset="0" stop-color="#3d2e26" stop-opacity=".9"/><stop offset=".55" stop-color="#2a201a" stop-opacity=".72"/><stop offset="1" stop-color="#1e1612" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mr-sl"><stop offset="0" stop-color="#7a3a1a" stop-opacity=".55"/><stop offset=".6" stop-color="#4a2210" stop-opacity=".25"/><stop offset="1" stop-color="#4a2210" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mr-du"><stop offset="0" stop-color="#6a5444" stop-opacity=".85"/><stop offset=".55" stop-color="#4e3e32" stop-opacity=".55"/><stop offset="1" stop-color="#3a2e26" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mr-sh"><stop offset="0" stop-color="#ff9a5a" stop-opacity=".34"/><stop offset=".5" stop-color="#e0602a" stop-opacity=".12"/><stop offset="1" stop-color="#e0602a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="mr-sg"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".5"/><stop offset=".45" stop-color="#ffc070" stop-opacity=".16"/><stop offset="1" stop-color="#ffc070" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mr-fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c8401a" stop-opacity=".95"/><stop offset=".45" stop-color="#ff8a3d" stop-opacity=".9"/><stop offset="1" stop-color="#ffc070" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="mr-fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff2c0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffc66a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="mr-hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeccc" stop-opacity=".12"/><stop offset="1" stop-color="#ffeccc" stop-opacity="0"/></linearGradient>' +
      // Window grids with their walls: the far blocks, the near blocks, the two big towers.
      '<pattern id="mr-wpf" width="10" height="16" patternUnits="userSpaceOnUse"><rect width="10" height="16" fill="#140d0a"/><rect x="3" y="5" width="4" height="7" fill="#2b1911"/></pattern>' +
      '<pattern id="mr-wpn" width="13" height="19" patternUnits="userSpaceOnUse"><rect width="13" height="19" fill="#0a0706"/><rect x="4" y="6" width="5" height="9" fill="#21140d"/></pattern>' +
      '<pattern id="mr-wpt" width="13" height="19" patternUnits="userSpaceOnUse"><rect width="13" height="19" fill="#0f0a08"/><rect x="4" y="6" width="5" height="9" fill="#341e14"/></pattern>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#mr-sky)"/>' +
      // The fire glow on the horizon: strong over the left, softer at the right, faint in the middle.
      '<g opacity=".6"><circle class="mr-gw" cx="220" cy="720" r="560" fill="url(#mr-gl)"/></g>' +
      '<ellipse cx="800" cy="780" rx="440" ry="150" fill="url(#mr-gl)" opacity=".16"/>' +
      // The sun, a red disc through the smoke; gold once the smoke parts.
      '<g class="mv-r"><g class="mv-t">' +
      '<g class="mr-red"><circle cx="1510" cy="140" r="160" fill="url(#mr-sh)"/><circle cx="1510" cy="140" r="40" fill="#c8502a" fill-opacity=".72"/></g>' +
      '<g class="mr-gold"><circle cx="1510" cy="140" r="230" fill="url(#mr-sg)"/><circle cx="1510" cy="140" r="40" fill="#ffe0a8" fill-opacity=".85"/></g>' +
      `<g class="mr-cl" opacity=".55">${overcast(1300, 'mr-sb')}</g>` +
      '</g></g>' +
      `<g class="mr-sb2">${overcast(-120, 'mr-sb')}</g>` +
      // The far skyline, its burning floors and roof fires.
      `<path d="${far.map(t => t.d).join('')}" fill="url(#mr-wpf)"/>` +
      hot(farHot[0], 'mr-w1', 6, '4 6 4 6 4 14 4 6') +
      hot(farHot[1], 'mr-w2', 6, '4 6 4 18 4 6') +
      (farFaint === '' ? '' : `<path d="${farFaint}" stroke="${HOT}" stroke-opacity=".22" stroke-width="5" stroke-dasharray="4 7 4 19"/>`) +
      farFires.map(([t, w, h, g]) => fire(next, t.x + t.w * 0.5, t.top + 10, w, h, g)).join('') +
      // The middle: one small, dim fire far off and its smoke.
      `<g opacity=".5">${plume(next, mid.x + mid.w / 2, mid.top - 6, 150, -380, 32, 6, 18)}${fire(next, mid.x + mid.w / 2, mid.top + 8, 16, 26)}</g>` +
      // The big tower on the left with its smoke column, the chunks it sheds, and the dust behind the near blocks.
      plume(next, 204, 190, 200, -330, 50, 8, 15) +
      `<g class="mr-tw">${tower1}</g>` +
      chunks +
      dust(false) +
      // The right: the second tower, its smoke over the sun, the crane.
      '<g class="mv-r">' +
      `<g class="mr-p3">${plume(next, 1282, 236, 230, -330, 40, 7, 14)}</g>` +
      tower2 +
      crane +
      '<g class="mv-t"><g class="mr-cr">' +
      Array.from({ length: 5 }, (_, i) => `<ellipse cx="${f(1430 + i * 60 + next() * 30)}" cy="${f(110 + next() * 80)}" rx="${f(70 + next() * 50)}" ry="${f(28 + next() * 24)}" fill="#120c0a" fill-opacity=".85"/>`).join('') +
      '</g></g></g>' +
      // The near skyline, dark, its windows cut by the pattern, some floors on fire.
      `<path d="${near.map(t => t.d).join('')}" fill="url(#mr-wpn)" stroke="#4a2414" stroke-opacity=".35" stroke-width="1.5"/>` +
      hot(nearHot[0], 'mr-w1', 8, '5 8 5 8 5 20') +
      hot(nearHot[1], 'mr-w2', 8, '5 8 5 30 5 8') +
      (nearFaint === '' ? '' : `<path d="${nearFaint}" stroke="${HOT}" stroke-opacity=".2" stroke-width="6" stroke-dasharray="5 9 5 26"/>`) +
      dust(true) +
      // The street: fires along the foot of the blocks, the rubble, the car, a bent lamp post.
      '<rect y="840" width="1600" height="180" fill="#090605"/>' +
      '<ellipse class="mr-gw" cx="210" cy="846" rx="320" ry="56" fill="url(#mr-gl)"/>' +
      [30, 96, 168, 250, 330, 404].map((x, i) => fire(next, x, 850, 16 + (i % 3) * 5, 26 + (i % 2) * 18)).join('') +
      '<path d="M-20 1000V888Q60 858 120 872Q200 846 280 876Q360 862 440 902L480 1000Z" fill="#0b0807"/>' +
      '<path d="M-20 888Q60 858 120 872Q200 846 280 876Q360 862 440 902" fill="none" stroke="#5a2e18" stroke-opacity=".5" stroke-width="2"/>' +
      `<path d="M30 930L52 912M150 960L176 944M380 950L404 932" stroke="${REBAR}" stroke-width="2.4"/>` +
      car +
      '<path d="M470 1000L500 790Q510 768 540 772" fill="none" stroke="#0c0908" stroke-width="6" stroke-linecap="round"/><path d="M532 768H552L548 778H536Z" fill="#0c0908"/>' +
      `<g fill="${EMBER}">${embers[0]}</g><g fill="#ffd58a">${embers[1]}</g><g fill="${EMBER}" fill-opacity=".4">${embers[2]}</g>` +
      rain({ seed: 54, count: 24, length: [2, 3.6], slant: 300, seconds: 18, stroke: '#b5a595', opacity: 0.26 }) +
      // The helicopter.
      '<g class="mr-heli"><g transform="translate(1640 170)">' +
      '<g class="mr-cone"><path d="M-6 6L-70 300H60Z" fill="url(#mr-hc)"/></g>' +
      '<path d="M-22 0C-22 -10 -10 -12 4 -12C16 -12 22 -6 22 2C22 8 14 10 0 10C-14 10 -22 8 -22 0Z" fill="#0c0908" stroke="#3a2418" stroke-width="1.2"/>' +
      '<path d="M20 -2H62M60 -10V4M-14 16H18M-8 10V16M10 10V16M-36 -16H40" stroke="#0c0908" stroke-width="3"/>' +
      `<circle class="mr-bcn" cx="0" cy="-13" r="2.6" fill="${HOT}"/></g></g>`,
    nook:
      '<defs><linearGradient id="mr-sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2b0" stop-opacity="0"/>' +
      '<stop offset=".3" stop-color="#ffe2b0" stop-opacity=".06"/><stop offset=".46" stop-color="#ffd9a0" stop-opacity=".32"/><stop offset="1" stop-color="#ffd09a" stop-opacity=".2"/></linearGradient>' +
      '<radialGradient id="mr-tg"><stop offset="0" stop-color="#ffe6c0" stop-opacity=".3"/><stop offset="1" stop-color="#ffe6c0" stop-opacity="0"/></radialGradient></defs>' +
      // The morning light, through the hole in the slab (behind the slab, so only the hole and below show it).
      `<g class="mr-shaft"><path d="M262 -440H384L322 330H212Z" fill="url(#mr-sf)"/>${motes}</g>` +
      // The floor: its dusty top, its broken edge with the rebar out of it, rubble and a stray sheet or two.
      '<path d="M-150 456L-136 446L-146 436H440V530H-140Z" fill="#15110f"/><path d="M-146 436H440V456H-150L-136 446Z" fill="#241c17"/>' +
      '<path d="M-146 436H440" stroke="#4a3a30" stroke-width="2"/>' +
      `<path d="M-146 438L-172 428M-140 450L-170 456M-146 470L-170 490" stroke="${REBAR}" stroke-width="2.4"/>` +
      '<path d="M-120 438L-108 420L-90 426L-76 412L-58 424L-44 438ZM296 450l6 -8l10 2l4 6zM-30 448l5 -6l8 1l3 5z" fill="#2e2520" stroke="#45362c"/>' +
      `<g fill="${PAPER}" fill-opacity=".3"><rect x="-20" y="444" width="22" height="3" transform="rotate(-6 -9 445)"/><rect x="226" y="446" width="20" height="3" transform="rotate(4 236 447)"/></g>` +
      // A bent window mullion with a last shard of glass, and the steel column at the edge of the floor.
      '<path d="M-120 -112L-122 -40L-100 20" fill="none" stroke="#1a1412" stroke-width="5"/>' +
      '<path d="M-122 -100L-90 -100L-110 -30Z" fill="#c8d4d8" fill-opacity=".06" stroke="#c8d4d8" stroke-opacity=".18"/>' +
      '<rect x="-20" y="-176" width="38" height="632" fill="#0d0908"/><path d="M-17 -176V456M15 -176V456" stroke="#1f1814" stroke-width="6"/>' +
      '<path d="M-20 -112V456" stroke="#ff8a3d" stroke-opacity=".3" stroke-width="2"/>' +
      '<g fill="#2a201b"><circle cx="-8" cy="-96" r="2.4"/><circle cx="6" cy="-96" r="2.4"/><circle cx="-8" cy="-84" r="2.4"/><circle cx="6" cy="-84" r="2.4"/></g>' +
      // What is left of the back wall, a calendar with Monday ringed, a stopped clock.
      '<path d="M340 -112L322 -80L336 -44L326 -6L340 30L332 72L346 110L338 150L350 188L344 226L356 262L350 300L360 340V456H440V-112Z" fill="#120e0d"/>' +
      '<path d="M340 -112L322 -80L336 -44L326 -6L340 30L332 72L346 110L338 150L350 188L344 226L356 262L350 300L360 340" fill="none" stroke="#ff8a3d" stroke-opacity=".22" stroke-width="2"/>' +
      `<path d="M380 -60L392 -20L386 20M410 200L398 240L404 280" stroke="#241c18" stroke-width="2"/><path d="M336 -44L318 -52M340 30L320 26M346 110L328 118" stroke="${REBAR}" stroke-width="2"/>` +
      '<g transform="rotate(5 388 136)"><rect x="364" y="104" width="48" height="64" fill="#d8cdbd" fill-opacity=".75"/><rect x="364" y="104" width="48" height="12" fill="#b8452a" fill-opacity=".8"/>' +
      '<path d="M374 99V109M402 99V109" stroke="#2a2420" stroke-width="2.4"/>' +
      `<path d="${Array.from({ length: 12 }, (_, i) => `M${368 + (i % 4) * 11} ${121 + Math.floor(i / 4) * 14}h6v6h-6z`).join('')}" fill="#6a5e52" fill-opacity=".6"/>` +
      '<circle cx="371" cy="124" r="6.5" fill="none" stroke="#c43a22" stroke-width="2"/><path d="M412 154L400 168H412Z" fill="#120e0d"/></g>' +
      '<g transform="rotate(-12 392 20)"><circle cx="392" cy="20" r="18" fill="#2a2420" stroke="#4a3e34" stroke-width="3"/><circle cx="392" cy="20" r="14" fill="#cfc4b4" fill-opacity=".45"/>' +
      '<path d="M392 20V9M392 20L400 24" stroke="#1a1412" stroke-width="2"/><path d="M384 10L392 20L388 32" fill="none" stroke="#1a1412" stroke-width="1.2"/></g>' +
      // The slab overhead: a fixed piece on the column, the cracked piece that sags on an error, the piece on the wall, the hole.
      slab(-210, 60, 'M-210 -164L-196 -178L-180 -170L-160 -180') +
      `<path d="M-206 -150L-232 -160M-202 -126L-228 -116M-196 -170L-214 -192" stroke="${REBAR}" stroke-width="2.4"/>` +
      '<g fill="#3a2a20" stroke="#1d1714"><rect x="-176" y="-110" width="26" height="24" transform="rotate(38 -176 -110)"/><rect x="-92" y="-112" width="26" height="22" transform="rotate(-24 -66 -112)"/></g>' +
      slab(352, 440, 'M352 -112L344 -130L356 -146L346 -160L354 -178') +
      `<path d="M346 -140L322 -128M348 -122Q328 -96 316 -104M244 -150Q296 -116 350 -152" fill="none" stroke="${REBAR}" stroke-width="2.2"/>` +
      '<g class="mr-ceil">' +
      slab(60, 244, 'M244 -178L252 -162L240 -146L252 -132L242 -112', true) +
      '<path d="M60 -178L54 -150L62 -130L56 -112" fill="none" stroke="#060404" stroke-width="2.4"/>' +
      `<path d="M246 -150L268 -140M244 -124Q272 -96 286 -110" fill="none" stroke="${REBAR}" stroke-width="2.2"/>` +
      '<path d="M128 -112V-102" stroke="#3a322c" stroke-width="2"/><path d="M200 -112V-64" stroke="#3a322c" stroke-width="2.4" stroke-dasharray="3 2"/>' +
      '<g transform="translate(200 -64)"><g class="mr-sw"><g transform="rotate(-28)">' +
      '<ellipse class="mr-tube" cx="-46" cy="26" rx="84" ry="38" fill="url(#mr-tg)"/>' +
      '<rect x="-92" y="0" width="92" height="9" rx="2" fill="#2a2420" stroke="#3e3029"/><rect class="mr-tube" x="-86" y="7" width="80" height="4" rx="2" fill="#ffe9c8" fill-opacity=".9"/>' +
      '</g></g></g>' +
      // Two cut cables, one of them sparking when a tool runs.
      '<g class="mr-cab"><path d="M84 -112C78 -60 98 -20 88 28M108 -112C116 -80 102 -50 114 -26" fill="none" stroke="#0a0706" stroke-width="3"/>' +
      '<path d="M88 28l-3 6M88 28l3 6M114 -26l-2 6" stroke="#c87a40" stroke-width="1.5"/>' +
      '<g class="mr-spk"><path d="M88 30l-8 10M88 30l9 7M88 30l-1 13M88 30l11 -3" stroke="#ffe0a0" stroke-width="1.6"/><circle cx="88" cy="31" r="3" fill="#fff2c8"/></g></g>' +
      '</g>' +
      // A burst of dust from under the slab as it drops, then dust pouring from its broken end and a crack, onto the hat.
      '<circle class="mr-eb" cx="190" cy="-104" r="86" fill="url(#mr-du)"/><circle class="mr-eb" style="animation-delay:.25s" cx="270" cy="-92" r="64" fill="url(#mr-du)"/>' +
      '<g stroke="#9a8676" stroke-opacity=".55" stroke-width="3.5" stroke-dasharray="26 34" fill="none">' +
      '<path class="mr-dt" d="M240 -84V326"/><path class="mr-dt" style="animation-delay:-.25s" d="M258 -80V326"/><path class="mr-dt" style="animation-delay:-.4s" d="M150 -98V196"/></g>',
    front:
      `<ellipse class="mr-shaft" cx="262" cy="331" rx="52" ry="4" fill="#ffe0b0" fill-opacity=".5"/>` +
      rubble +
      '<g fill="#9a8676" fill-opacity=".55"><ellipse class="mr-hp" cx="150" cy="198" rx="14" ry="5"/>' +
      '<ellipse class="mr-hp" style="animation-delay:.35s" cx="262" cy="326" rx="30" ry="9"/><ellipse class="mr-hp" style="animation-delay:.6s" cx="290" cy="324" rx="22" ry="7"/></g>',
  }
}
