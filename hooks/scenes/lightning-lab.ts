import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Lightning Lab: a mad scientist's stone tower at night. A storm rages in the arched window, green flasks bubble on
// the shelves, a plasma sphere hums. Two coil towers face each other across the room; when a command runs the lever
// is thrown and thin arcs leap between them.
const BRASS = '#c79a3a'
const IRON = '#1a1f2e'
const IRON_EDGE = '#2c3450'
const GREEN = '#3ddc84'
const PLASMA = '#b78cff'
const CYAN = '#7fd4ff'
const WARM = '#ffc65a'

/** A zig-zag from one point to another, bowed upward: the path of an arc. */
function bolt(from: [number, number], to: [number, number], seed: number, parts: number, jitter: number, bow: number): string {
  const next = random(seed)
  const points: string[] = []

  for (let index = 0; index <= parts; index += 1) {
    const t = index / parts
    const edge = index === 0 || index === parts ? 0 : 1
    const x = from[0] + (to[0] - from[0]) * t + (next() - 0.5) * jitter * 0.9 * edge
    const y = from[1] + (to[1] - from[1]) * t - bow * Math.sin(Math.PI * t) + (next() - 0.5) * jitter * 2 * edge

    points.push(`${f(x)} ${f(y)}`)
  }

  return `M${points.join('L')}`
}

type Kind = 'round' | 'conical' | 'jar' | 'tubes'

/** One flask on a shelf, its bottom at (x, y): glass, green liquid, a highlight and rising bubbles. */
function flask(kind: Kind, x: number, y: number, s: number, seed: number, crack = false): string {
  const next = random(seed)
  const glass = 'fill="#bfe9ff" fill-opacity=".07" stroke="#8fd6ff" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"'
  let body: string
  let liquid: string
  let top: number

  switch (kind) {
    case 'round': {
      const r = 21 * s
      const cy = y - r
      const w = r * 0.99

      body = `<circle cx="${f(x)}" cy="${f(cy)}" r="${f(r)}" ${glass}/><rect x="${f(x - 5 * s)}" y="${f(cy - r - 17 * s)}" width="${f(10 * s)}" height="${f(19 * s)}" ${glass}/>`
      liquid = `<path d="M${f(x - w)} ${f(cy - r * 0.1)}A${f(r)} ${f(r)} 0 1 0 ${f(x + w)} ${f(cy - r * 0.1)}Z" fill="${GREEN}" fill-opacity=".62"/>`
      top = cy - r
      break
    }
    case 'conical': {
      const h = 58 * s
      const b = 24 * s
      const n = 6 * s

      body = `<path d="M${f(x - n)} ${f(y - h - 12 * s)}H${f(x + n)}V${f(y - h)}L${f(x + b)} ${f(y)}H${f(x - b)}L${f(x - n)} ${f(y - h)}Z" ${glass}/>`
      liquid = `<path d="M${f(x - n - 7 * s)} ${f(y - h * 0.55)}L${f(x + n + 7 * s)} ${f(y - h * 0.55)}L${f(x + b)} ${f(y)}H${f(x - b)}Z" fill="${GREEN}" fill-opacity=".62"/>`
      top = y - h
      break
    }
    case 'jar': {
      const w = 15 * s
      const h = 70 * s

      body = `<rect x="${f(x - w)}" y="${f(y - h)}" width="${f(w * 2)}" height="${f(h)}" rx="${f(5 * s)}" ${glass}/>`
      liquid = `<rect x="${f(x - w + 1.5)}" y="${f(y - h * 0.62)}" width="${f(w * 2 - 3)}" height="${f(h * 0.62 - 1.5)}" rx="4" fill="${GREEN}" fill-opacity=".62"/>`
      top = y - h
      break
    }
    case 'tubes': {
      const parts = [-17, 0, 17].map((dx, index) => {
        const h = (54 - index * 6) * s
        const tx = x + dx * s

        return (
          `<rect x="${f(tx - 6 * s)}" y="${f(y - h)}" width="${f(12 * s)}" height="${f(h)}" rx="${f(6 * s)}" ${glass}/>` +
          `<rect x="${f(tx - 4.5 * s)}" y="${f(y - h * 0.5)}" width="${f(9 * s)}" height="${f(h * 0.5 - 1.5)}" rx="3" fill="${index === 1 ? '#7fe6ff' : GREEN}" fill-opacity=".6"/>`
        )
      })

      body = parts.join('')
      liquid = ''
      top = y - 54 * s
      break
    }
  }

  const bubbles = [0, 1, 2]
    .map(
      index =>
        `<circle class="ll-bub" cx="${f(x + (next() - 0.5) * 16 * s)}" cy="${f(y - 8 * s)}" r="${f(1.6 + next() * 1.6)}" fill="#c8ffe2" ` +
        `style="--d:${f(2 + next() * 2)};--h:${f(Math.max(24, y - top - 10))}px;animation-delay:${f(-next() * 3)}s"/>`,
    )
    .join('')
  const shine = `<path d="M${f(x - 9 * s)} ${f(y - 22 * s)}V${f(y - 40 * s)}" stroke="#ffffff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`
  const crackMark = crack
    ? `<path class="ll-crack" d="M${f(x - 2)} ${f(y - 52 * s)}l7 9l-8 8l9 10l-6 8" fill="none" stroke="#eaffff" stroke-width="2" stroke-linejoin="round"/>`
    : ''

  return `<g>${liquid}${body}${shine}${bubbles}${crackMark}</g>`
}

/** A coil tower: copper winding on a dark core, a steel ring on top and the glow around it. */
function tower(cx: number, top: number, bottom: number, half: number, ring: number, id: string): string {
  const lines: string[] = []

  for (let y = top + 18; y < bottom; y += 9) {
    lines.push(`M${f(cx - half)} ${y}h${f(half * 2)}`)
  }

  return (
    `<rect x="${f(cx - half)}" y="${top}" width="${f(half * 2)}" height="${bottom - top}" fill="url(#ll-core)"/>` +
    `<path d="${lines.join('')}" stroke="#b57a3c" stroke-opacity=".5" stroke-width="3.2"/>` +
    `<rect x="${f(cx + half - 8)}" y="${top}" width="3" height="${bottom - top}" fill="${CYAN}" fill-opacity=".28"/>` +
    `<rect x="${f(cx - half - 7)}" y="${top - 6}" width="${f(half * 2 + 14)}" height="12" rx="3" fill="${IRON_EDGE}"/>` +
    `<rect x="${f(cx - half - 7)}" y="${bottom - 6}" width="${f(half * 2 + 14)}" height="12" rx="3" fill="${IRON_EDGE}"/>` +
    `<rect x="${f(cx - 9)}" y="${top - 30}" width="18" height="30" fill="${IRON_EDGE}"/>` +
    `<ellipse cx="${cx}" cy="${top - 40}" rx="${ring}" ry="${f(ring * 0.31)}" fill="none" stroke="#3b4260" stroke-width="16"/>` +
    `<ellipse cx="${cx}" cy="${top - 40}" rx="${ring}" ry="${f(ring * 0.31)}" fill="none" stroke="#a9b8e0" stroke-opacity=".4" stroke-width="3"/>` +
    `<circle class="ll-ch" id="${id}" cx="${cx}" cy="${top - 40}" r="${f(ring * 2.7)}" fill="url(#ll-halo)"/>`
  )
}

/** A leather stool and a heavy workbench for the scientist. */
const SEAT =
  '<ellipse cx="151" cy="352" rx="45" ry="7" fill="#4a2a2a"/><rect x="106" y="352" width="90" height="13" rx="6" fill="#3a2024"/>' +
  `<g fill="${BRASS}" fill-opacity=".8"><circle cx="124" cy="359" r="1.8"/><circle cx="151" cy="361" r="1.8"/><circle cx="178" cy="359" r="1.8"/></g>` +
  '<rect x="144" y="365" width="14" height="70" fill="#20222e"/>' +
  `<rect x="136" y="396" width="30" height="7" rx="3" fill="${BRASS}" fill-opacity=".6"/>` +
  '<g stroke="#20222e" stroke-width="7" stroke-linecap="round"><path d="M151 434L116 454M151 434L186 454M151 434V455"/></g>'

const TABLE =
  '<g fill="#2b2230"><rect x="166" y="330" width="304" height="14" rx="2"/><rect x="178" y="344" width="14" height="112"/><rect x="442" y="344" width="14" height="112"/>' +
  '<rect x="192" y="344" width="250" height="22"/><rect x="192" y="414" width="250" height="8"/></g>' +
  `<line x1="166" y1="331" x2="470" y2="331" stroke="${BRASS}" stroke-opacity=".5" stroke-width="2"/>` +
  '<g fill="#0d0d12" fill-opacity=".7"><ellipse cx="226" cy="337" rx="14" ry="3"/><ellipse cx="410" cy="338" rx="9" ry="2.4"/></g>' +
  `<g fill="${BRASS}" fill-opacity=".7"><rect x="304" y="352" width="30" height="5" rx="2"/><circle cx="222" cy="355" r="2.4"/><circle cx="412" cy="355" r="2.4"/></g>`

/** The laptop, two dial gauges and a knife switch wired to it; the lever is thrown while a command runs. */
function device(light: string, activity: Activity): string {
  const lean = activity === 'run' ? 30 : activity === 'error' ? 8 : -30
  const needle = (cx: number, cy: number, angle: number, cls: string) =>
    `<g transform="translate(${cx} ${cy}) rotate(${angle})"><g class="${cls}"><path d="M0 2V-10" stroke="#ff7a4a" stroke-width="1.6" stroke-linecap="round"/></g></g>`
  const hot = activity === 'run' || activity === 'tool'
  const err = activity === 'error'
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const dial = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="11.5" fill="#d9d2b0" stroke="${BRASS}" stroke-width="2.4"/>` +
    `<path d="M${cx - 8} ${cy + 4}A9 9 0 0 1 ${cx + 8} ${cy + 4}" fill="none" stroke="#6a5a30" stroke-width="1.4" stroke-dasharray="1.6 2.6"/>`

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2e2c3a"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2e2c3a"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The wire from the laptop to the switch, with a spark running along it.
    '<path d="M342 327Q382 356 420 327" fill="none" stroke="#08080d" stroke-width="5" stroke-linecap="round"/>' +
    `<path class="ll-dp" d="M342 327Q382 356 420 327" fill="none" stroke="${CYAN}" stroke-width="2" stroke-linecap="round" stroke-dasharray="5 46" stroke-opacity="${hot ? 0.9 : 0.3}"/>` +
    // The dial gauges.
    `<rect x="348" y="293" width="54" height="37" rx="4" fill="#262436" stroke="${IRON_EDGE}" stroke-width="2"/>` +
    dial(364, 311) +
    dial(387, 311) +
    needle(364, 311, err ? 60 : hot ? 38 : -42, 'll-nd') +
    needle(387, 311, err ? 62 : hot ? 22 : -18, 'll-nd ll-nd2') +
    // The knife switch: a base, a post, and the blade with its handle.
    `<rect x="416" y="322" width="46" height="8" rx="2" fill="#242030" stroke="${BRASS}" stroke-opacity=".7" stroke-width="1.4"/>` +
    `<rect x="454" y="312" width="6" height="12" rx="2" fill="${BRASS}"/>` +
    `<circle cx="457" cy="311" r="${hot ? 4 : 2.6}" fill="${hot ? '#fff1b0' : '#6a5a30'}"/>` +
    `<g transform="translate(436 321) rotate(${lean})"><g class="${activity === 'run' ? 'll-throw' : ''}">` +
    `<rect x="-3" y="-52" width="6" height="52" rx="2" fill="#8a93aa"/><rect x="-7.5" y="-68" width="15" height="19" rx="6" fill="#241418" stroke="#4a2a30" stroke-width="1.6"/></g></g>` +
    `<circle cx="436" cy="321" r="5.5" fill="${BRASS}"/>`
  )
}

export function lightningLabWorld(): World {
  const next = random(11)
  const stones = (() => {
    const parts: string[] = []

    for (let row = 0; row < 20; row += 1) {
      const y = row * 52
      let x = row % 2 === 0 ? 0 : -60

      parts.push(`M0 ${y}H1600`)

      while (x < 1600) {
        x += 90 + next() * 70
        parts.push(`M${f(x)} ${y}v52`)
      }
    }

    return parts.join('')
  })()
  const cloud = (cx: number, cy: number, w: number, fill: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${f(w * 0.34)}" fill="${fill}"/>`
  const clouds = [
    cloud(290, 130, 74, '#0a1226'),
    cloud(380, 110, 70, '#0e1a34'),
    cloud(440, 170, 60, '#0a1226'),
    cloud(320, 205, 80, '#12203f'),
    cloud(250, 255, 66, '#0b1429'),
    cloud(410, 260, 70, '#0e1a34'),
  ].join('')
  const frameBolt = 'M330 130L344 188L322 196L350 258L330 266L360 330'
  const strike = bolt([350, 150], [424, 320], 21, 8, 16, 0)
  // Tendrils: each leaves the core and wanders to the glass, rotating about the core.
  const tends = Array.from({ length: 9 }, (_, i) => {
    const base = (i / 9) * 360 + next() * 20
    const len = 64 + next() * 12
    const bend = (next() - 0.5) * 60

    return (
      `<g transform="rotate(${f(base)})"><g class="ll-tn" style="--s:${f(3 + next() * 2.5)};--l:${f(-next() * 4)}s;--a:${f(8 + next() * 14)}deg">` +
      `<path d="M0 0Q${f(len * 0.5)} ${f(bend)} ${f(len)} ${f(bend * 0.2)}" fill="none" stroke="${i % 3 === 0 ? '#ffffff' : '#d4b8ff'}" ` +
      `stroke-opacity="${i % 3 === 0 ? 0.85 : 0.7}" stroke-width="${i % 3 === 0 ? 1.6 : 2.2}" stroke-linecap="round"/></g></g>`
    )
  }).join('')
  const shelf = (y: number, x1: number, x2: number) =>
    `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="11" rx="2" fill="#2a1f24" stroke="#3d2c30"/>` +
    `<path d="M${x1 + 10} ${y + 11}l-8 22M${x2 - 10} ${y + 11}l8 22" stroke="#3d2c30" stroke-width="4"/>`
  const flasks =
    flask('round', 266, 500, 1, 31) +
    flask('conical', 318, 500, 1, 32) +
    flask('jar', 366, 500, 1, 33) +
    flask('round', 418, 500, 1.18, 34, true) +
    flask('tubes', 474, 500, 1, 35) +
    flask('jar', 262, 584, 0.9, 36) +
    flask('round', 312, 584, 0.9, 37) +
    flask('conical', 362, 584, 1.1, 38) +
    flask('tubes', 416, 584, 1, 39) +
    flask('round', 470, 584, 0.85, 40)
  const sparks = [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55

      return `<circle class="ll-bs" cx="150" cy="40" r="2.6" fill="#ffe7a0" style="--dx:${f(Math.cos(a) * 80)}px;--dy:${f(Math.sin(a) * 80)}px;animation-delay:${f(i * 0.35)}s"/>`
    })
    .join('')
  const leftArcs = [bolt([150, 242], [800, 96], 61, 15, 24, 90), bolt([150, 244], [800, 96], 62, 13, 26, 70), bolt([148, 240], [800, 96], 63, 16, 22, 110)]
  const rightArcs = [bolt([1462, 168], [800, 96], 71, 14, 24, 80), bolt([1462, 170], [800, 96], 72, 15, 26, 100), bolt([1464, 166], [800, 96], 73, 13, 22, 60)]
  const arcLine = (d: string, variant: number) =>
    `<g class="ll-arc" style="--l:${f(-variant * 0.6 - 0.25)}s"><path d="${d}" stroke="#8fd0ff" stroke-opacity=".28" stroke-width="9"/>` +
    `<path d="${d}" stroke="#f4fbff" stroke-width="2.4"/></g>`
  const smoke = [0, 1, 2, 3, 4]
    .map(
      i =>
        `<circle class="ll-soot" cx="${f(292 + i * 7)}" cy="232" r="${f(10 + i * 2.5)}" fill="#14141c" ` +
        `style="--dx:${f(-30 + i * 22)}px;animation-delay:${f(i * 0.35)}s"/>`,
    )
    .join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#05070d',
      furniture: '#2b2230',
      metal: '#2e2c3a',
      paper: '#e9e2cc',
      light: { idle: '#5fa0c8', work: CYAN, bright: '#d4f4ff' },
      headTop: 214,
      glowAt: [335, 282],
      device,
      wear: {
        front:
          // Wild white tufts, then a leather strap, and brass goggles pushed up on the forehead: the eyes stay clear.
          '<path d="M72 242L66 214L86 232L90 202L108 230L120 206L130 232L146 198L160 230L174 204L184 232L198 200L208 230L226 210L228 242Z" fill="#d6d0c2"/>' +
          '<path d="M72 246L56 250L72 258ZM228 246L244 248L228 258Z" fill="#d6d0c2"/>' +
          '<path d="M82 218L98 232M150 204L146 230M200 206L206 228" stroke="#a49e90" stroke-width="2"/>' +
          '<rect x="68" y="239" width="164" height="10" rx="2" fill="#3a2616"/>' +
          `<g fill="${BRASS}"><rect x="134" y="236" width="32" height="5" rx="2"/></g>` +
          '<g fill="#8fd8ff" fill-opacity=".4" stroke="#c79a3a" stroke-width="4"><circle cx="118" cy="234" r="15"/><circle cx="182" cy="234" r="15"/></g>' +
          '<g fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"><path d="M108 228Q113 223 119 224"/><path d="M172 228Q177 223 183 224"/></g>',
      },
      seatArt: SEAT,
      tableArt: TABLE,
    },
    style:
      '.ll-cl{animation:ll-cl 38s ease-in-out infinite alternate}@keyframes ll-cl{to{transform:translateX(34px)}}' +
      '.ll-cl2{animation-duration:52s;animation-direction:alternate-reverse}' +
      // The storm in the window: a soft flash and a thin bolt every nine seconds, one ramp long enough to be gentle.
      '.ll-wf{opacity:0;animation:ll-wf 9s ease-out infinite}@keyframes ll-wf{0%,100%{opacity:0}2.2%{opacity:.26}4%{opacity:.1}9%{opacity:0}}' +
      '.ll-wf2{animation-delay:-4.6s}' +
      '.ll-wb{opacity:0;animation:ll-wb 9s ease-out infinite}@keyframes ll-wb{0%,100%{opacity:0}2.2%{opacity:.85}7%{opacity:0}}' +
      '.ll-wb2{animation-delay:-4.6s}' +
      // A roof rod catches a soft strike while the page is on the web.
      '.ll-stk{opacity:0}.st-web .ll-stk{animation:ll-stk 3.4s ease-out .85s infinite}' +
      '@keyframes ll-stk{0%,100%{opacity:0}4%{opacity:.95}12%{opacity:.35}22%{opacity:0}}' +
      '.ll-tip{opacity:.0}.st-web .ll-tip{animation:ll-stk 3.4s ease-out .85s infinite}' +
      // The flasks bubble, fast while a tool runs.
      '.ll-bub{opacity:0;animation:ll-bub calc(var(--d) * 1s) ease-in infinite}' +
      '@keyframes ll-bub{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:.85}100%{opacity:0;transform:translateY(calc(var(--h) * -1)) scale(1.1)}}' +
      '.st-responding .ll-bub{animation-duration:calc(var(--d) * .55s)}' +
      '.st-tool .ll-bub{animation-duration:calc(var(--d) * .22s)}' +
      '.ll-gg{opacity:.55;animation:ll-pulse 5s ease-in-out infinite alternate}@keyframes ll-pulse{to{opacity:.95}}' +
      '.st-tool .ll-gg{opacity:.9;animation:ll-pulse .5s ease-in-out infinite alternate}' +
      '.ll-crack{opacity:0}.st-error .ll-crack{animation:ll-show .3s ease-out .5s both}@keyframes ll-show{to{opacity:1}}' +
      // The plasma sphere: tendrils dance, wilder while thinking, and the glow rises when a command runs.
      '.ll-tn{animation:ll-dance var(--s) ease-in-out infinite alternate;animation-delay:var(--l)}' +
      '@keyframes ll-dance{from{transform:rotate(calc(var(--a) * -1))}to{transform:rotate(var(--a))}}' +
      '.st-thinking .ll-tn{animation-name:ll-dance2;animation-duration:calc(var(--s) * .32)}' +
      '@keyframes ll-dance2{from{transform:rotate(-38deg) scale(.9)}to{transform:rotate(38deg) scale(1.08)}}' +
      '.ll-sg{opacity:.45;animation:ll-pulse 4s ease-in-out infinite alternate}.st-run .ll-sg{opacity:.9;animation-duration:.9s}' +
      '.st-thinking .ll-sg{opacity:.75;animation-duration:1.2s}' +
      '.ll-ch{opacity:.4;animation:ll-pulse 3.6s ease-in-out infinite alternate}.st-run .ll-ch{opacity:.95;animation-duration:.9s}' +
      // The arcs between the towers: three, each flashing once every 1.8 s a third of a period apart.
      '.ll-arc{opacity:0}.st-run .ll-arc{animation:ll-arc 1.8s linear infinite;animation-delay:var(--l)}' +
      '@keyframes ll-arc{0%{opacity:0}4%{opacity:1}12%{opacity:.75}28%,100%{opacity:0}}' +
      '.ll-dp{stroke-dashoffset:0}.st-run .ll-dp{animation:ll-dash 1s linear infinite}@keyframes ll-dash{to{stroke-dashoffset:-102}}' +
      '.ll-pl{opacity:0}.st-run .ll-pl{opacity:.85;animation:ll-dash 1.4s linear infinite}' +
      '.ll-throw{animation:ll-throw .5s cubic-bezier(.3,1.4,.5,1) both}@keyframes ll-throw{from{transform:rotate(-70deg)}to{transform:rotate(0)}}' +
      '.ll-sp{opacity:0}.st-run .ll-sp{animation:ll-sp 1.6s ease-out infinite}' +
      '@keyframes ll-sp{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // Dial needles tremble, harder while busy.
      '.ll-nd{animation:ll-tr 2.4s ease-in-out infinite alternate}.ll-nd2{animation-duration:1.7s}' +
      '@keyframes ll-tr{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}' +
      '.st-run .ll-nd,.st-tool .ll-nd,.st-responding .ll-nd{animation-duration:.22s}' +
      '.ll-wd{animation:ll-tr 3s ease-in-out infinite alternate}' +
      '.st-read .ll-wd{animation:ll-sweep 2.2s ease-in-out infinite alternate}@keyframes ll-sweep{from{transform:rotate(-60deg)}to{transform:rotate(60deg)}}' +
      // An explosion puff, a cracked flask and soot smoke.
      '.ll-ex{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ll-ex{animation:ll-ex 1.8s ease-out both}' +
      '@keyframes ll-ex{0%{opacity:0;transform:scale(.2)}8%{opacity:.8;transform:scale(.8)}100%{opacity:0;transform:scale(2.4)}}' +
      '.ll-soot{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .ll-soot{animation:ll-soot 4.2s ease-out infinite}' +
      '@keyframes ll-soot{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-150px) scale(2.6)}}' +
      '.ll-leak{opacity:0}.st-error .ll-leak{animation:ll-leak 1.6s ease-in .6s infinite}@keyframes ll-leak{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(40px)}}' +
      // The bulb above lights warmly when the work is done.
      '.ll-on{opacity:0}.st-done .ll-on{animation:ll-on 1.1s ease-out .1s both}@keyframes ll-on{to{opacity:1}}' +
      '.ll-bs{opacity:0}.st-done .ll-bs{animation:ll-sp 2.2s ease-out infinite}' +
      '.ll-sway{animation:ll-sway 7s ease-in-out infinite alternate}@keyframes ll-sway{from{transform:rotate(-.9deg)}to{transform:rotate(.9deg)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ll-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d18"/><stop offset="1" stop-color="#151a2c"/></linearGradient>' +
      '<linearGradient id="ll-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1230"/><stop offset="1" stop-color="#27385f"/></linearGradient>' +
      '<linearGradient id="ll-core" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1018"/><stop offset=".6" stop-color="#3a2418"/><stop offset="1" stop-color="#6a4326"/></linearGradient>' +
      '<radialGradient id="ll-halo"><stop offset="0" stop-color="#9fdcff" stop-opacity=".5"/><stop offset=".35" stop-color="#7fb8ff" stop-opacity=".16"/><stop offset="1" stop-color="#7fb8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ll-green"><stop offset="0" stop-color="#3ddc84" stop-opacity=".34"/><stop offset="1" stop-color="#3ddc84" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ll-sph" cx=".4" cy=".35"><stop offset="0" stop-color="#cfd8ff" stop-opacity=".14"/><stop offset=".7" stop-color="#6a58d8" stop-opacity=".14"/><stop offset="1" stop-color="#b8a8ff" stop-opacity=".34"/></radialGradient>' +
      '<radialGradient id="ll-sglow"><stop offset="0" stop-color="#b78cff" stop-opacity=".5"/><stop offset=".4" stop-color="#8a6cff" stop-opacity=".2"/><stop offset="1" stop-color="#8a6cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ll-corebl"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#e3ccff" stop-opacity=".85"/><stop offset="1" stop-color="#b78cff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ll-vg" x1="0" y1="0" x2="1" y2="0"><stop offset=".22" stop-color="#04060c" stop-opacity="0"/><stop offset=".38" stop-color="#04060c" stop-opacity=".5"/><stop offset=".62" stop-color="#04060c" stop-opacity=".5"/><stop offset=".78" stop-color="#04060c" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="ll-wc"><path d="M235 430V200A115 115 0 0 1 465 200V430Z"/></clipPath></defs>' +
      '<rect width="1600" height="1000" fill="url(#ll-wall)"/>' +
      `<path d="${stones}" stroke="#222a44" stroke-opacity=".55" stroke-width="2" fill="none"/>` +
      // The arched window with the thunderstorm.
      '<path d="M235 430V200A115 115 0 0 1 465 200V430Z" fill="url(#ll-sky)"/>' +
      '<g clip-path="url(#ll-wc)">' +
      `<g class="ll-cl">${clouds}</g>` +
      '<g class="ll-cl ll-cl2"><ellipse cx="340" cy="170" rx="90" ry="26" fill="#0a1226" fill-opacity=".8"/><ellipse cx="260" cy="320" rx="80" ry="24" fill="#0a1226" fill-opacity=".7"/></g>' +
      `<path d="M300 430V372L322 372V350L336 350V372L360 372V430Z M390 430V330L405 330L420 322L424 304L428 322L440 330V430Z" fill="#050914"/>` +
      '<path d="M424 304V336" stroke="#8fa0c8" stroke-width="2"/>' +
      `<path class="ll-wb" d="${frameBolt}" fill="none" stroke="#f0f6ff" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path class="ll-wb ll-wb2" d="M410 120L396 180L416 190L392 252" fill="none" stroke="#f0f6ff" stroke-width="2.4" stroke-linejoin="round"/>` +
      '<rect class="ll-wf" x="235" y="85" width="230" height="345" fill="#cfe0ff"/><rect class="ll-wf ll-wf2" x="235" y="85" width="230" height="345" fill="#cfe0ff"/>' +
      `<g stroke="#9ab8ff" stroke-width="1.2" stroke-linecap="round">${rain({ seed: 3, count: 30, length: [14, 30], slant: 220, seconds: 0.8, stroke: '#9ab8ff', opacity: 0.4, box: [200, 60, 300, 400] })}</g>` +
      `<path class="ll-stk" d="${strike}" fill="none" stroke="#f4f8ff" stroke-width="2.6" stroke-linejoin="round"/>` +
      '<circle class="ll-tip" cx="424" cy="304" r="22" fill="url(#ll-halo)"/>' +
      '</g>' +
      '<path d="M235 430V200A115 115 0 0 1 465 200V430" fill="none" stroke="#313a58" stroke-width="12"/>' +
      '<path d="M350 85V430M235 270H465" stroke="#06080f" stroke-width="5"/>' +
      '<rect x="222" y="430" width="256" height="14" rx="3" fill="#2a3150"/>' +
      // The shelves and the flasks.
      '<ellipse cx="370" cy="540" rx="190" ry="110" fill="url(#ll-green)" class="ll-gg"/>' +
      shelf(500, 236, 500) +
      shelf(584, 236, 500) +
      flasks +
      // The left coil tower.
      `${tower(105, 275, 900, 40, 66, 'll-h1')}` +
      '<path d="M20 900H190L176 1100H34Z" fill="#171c2c" stroke="#262e48" stroke-width="2"/>' +
      '<rect x="14" y="890" width="182" height="16" rx="3" fill="#232b44"/>' +
      '<g class="mv-b">' +
      '<rect x="-20" y="954" width="1700" height="200" fill="#0b0e18"/><path d="M-20 954H1700" stroke="#2a3250" stroke-width="3"/>' +
      '<path d="M-20 1010H1700M-20 1060H1700" stroke="#1a2038" stroke-width="2"/>' +
      // The cable from the tower to the desk, with a spark running along it.
      '<path d="M105 940C190 1000 250 960 330 985S620 1010 800 982S1260 1005 1640 970" fill="none" stroke="#06070d" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M105 936C190 996 250 956 330 981S620 1006 800 978S1260 1001 1640 966" fill="none" stroke="#2b3350" stroke-width="2"/>' +
      `<path class="ll-pl" d="M105 940C190 1000 250 960 330 985S620 1010 800 982S1260 1005 1640 970" fill="none" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" stroke-dasharray="14 88"/>` +
      // The plasma sphere on its pedestal.
      '<rect x="200" y="980" width="260" height="30" rx="4" fill="#1a2036" stroke="#2c3556" stroke-width="2"/>' +
      '<path d="M296 936H364L376 962H284Z" fill="#2c3040" stroke="#3d4560" stroke-width="2"/>' +
      `<rect x="268" y="960" width="124" height="22" rx="6" fill="#262c44" stroke="${BRASS}" stroke-opacity=".6" stroke-width="2"/>` +
      '<circle class="ll-sg" cx="330" cy="850" r="215" fill="url(#ll-sglow)"/>' +
      '<circle cx="330" cy="850" r="84" fill="#0a0a1c"/><circle cx="330" cy="850" r="84" fill="url(#ll-sph)" stroke="#b8c8ff" stroke-opacity=".4" stroke-width="2.4"/>' +
      `<g transform="translate(330 850)">${tends}<circle class="ll-sg" r="30" fill="url(#ll-corebl)"/></g>` +
      '<path d="M270 810Q282 786 310 778" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>' +
      '</g>' +
      // The arcs between the towers, in two halves that meet in the dark middle.
      `<g fill="none" stroke-linejoin="round" stroke-linecap="round">${leftArcs.map(arcLine).join('')}</g>` +
      '<g class="mv-r">' +
      // The right coil tower on a stone bracket.
      '<path d="M1380 548H1640V520H1400Z M1400 520L1440 600H1640V520Z" fill="#171c2c" stroke="#262e48" stroke-width="2"/>' +
      '<path d="M1420 560Q1480 600 1560 590" stroke="#262e48" stroke-width="3" fill="none"/>' +
      `${tower(1510, 230, 505, 34, 56, 'll-h2')}` +
      '<circle cx="1510" cy="150" r="9" fill="#a9b8e0" fill-opacity=".8"/>' +
      `<g fill="none" stroke-linejoin="round" stroke-linecap="round">${rightArcs.map(arcLine).join('')}</g>` +
      '</g>',
    nook:
      '<defs><radialGradient id="ll-bulb"><stop offset="0" stop-color="#fff2c4" stop-opacity=".85"/><stop offset=".3" stop-color="#ffc65a" stop-opacity=".4"/><stop offset="1" stop-color="#ff9a2a" stop-opacity="0"/></radialGradient></defs>' +
      // The big wall gauge and its pipe.
      '<path d="M330 -300V76" stroke="#14172a" stroke-width="14"/><path d="M330 -300V76" stroke="#2c3556" stroke-width="2" transform="translate(-4 0)"/>' +
      '<rect x="318" y="-120" width="24" height="10" rx="3" fill="#232b44"/><rect x="318" y="-40" width="24" height="10" rx="3" fill="#232b44"/>' +
      `<circle cx="330" cy="112" r="38" fill="#14172a" stroke="${BRASS}" stroke-width="4"/><circle cx="330" cy="112" r="31" fill="#d9d2b0" fill-opacity=".92"/>` +
      '<path d="M310 130A26 26 0 0 1 350 130M306 112A26 26 0 0 1 312 94" fill="none" stroke="#6a5a30" stroke-width="2" stroke-dasharray="2 4"/>' +
      '<g transform="translate(330 112)"><g class="ll-wd"><path d="M0 8V-24" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/></g></g><circle cx="330" cy="112" r="3.6" fill="#232b44"/>' +
      // The cable up from the switch, and the cord the great bulb hangs by.
      '<path d="M440 300V-460" stroke="#08080e" stroke-width="9"/><path d="M437 300V-460" stroke="#2b3350" stroke-width="1.6"/>' +
      `<path class="ll-pl" d="M440 300V-460" stroke="${CYAN}" stroke-width="3" stroke-dasharray="14 88" fill="none"/>` +
      '<g fill="#232b44"><rect x="432" y="-60" width="16" height="10" rx="3"/><rect x="432" y="-200" width="16" height="10" rx="3"/></g>' +
      '<path d="M150 -512V-30" stroke="#0a0a12" stroke-width="3"/>' +
      `<rect x="136" y="-32" width="28" height="22" rx="4" fill="${BRASS}"/><rect x="136" y="-24" width="28" height="3" fill="#6a4f1a"/>` +
      '<circle cx="150" cy="40" r="50" fill="#dfe8ff" fill-opacity=".07" stroke="#b8c8e8" stroke-opacity=".45" stroke-width="2.4"/>' +
      '<path d="M138 -10Q132 22 118 36" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>' +
      '<path d="M138 -4V24L144 30L150 22L156 30L162 24V-4" fill="none" stroke="#8a7a58" stroke-width="2"/>' +
      `<g class="ll-on"><circle cx="150" cy="40" r="210" fill="url(#ll-bulb)"/><circle cx="150" cy="40" r="46" fill="#ffd77a" fill-opacity=".55"/>` +
      `<path d="M138 -4V24L144 30L150 22L156 30L162 24V-4" fill="none" stroke="#fff6d8" stroke-width="3"/>${sparks}</g>`,
    front:
      // Sparks at the switch while it runs; a puff and soot over the laptop on an error.
      [0, 1, 2]
        .map(
          i =>
            `<rect class="ll-sp" x="${f(456 + i * 3)}" y="308" width="3.4" height="3.4" fill="#fff1b0" style="--dx:${f(-10 + i * 12)}px;--dy:${f(-34 - i * 8)}px;animation-delay:${f(i * 0.55)}s"/>`,
        )
        .join('') +
      '<g class="ll-ex"><circle cx="300" cy="248" r="26" fill="#ffb56a" fill-opacity=".55"/><circle cx="296" cy="250" r="14" fill="#fff0c8" fill-opacity=".8"/></g>' +
      smoke,
  }
}
