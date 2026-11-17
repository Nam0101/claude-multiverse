import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Carnival: a ride operator in a straw boater works a little control booth at a night fair. A giant ferris wheel
// turns, its gondolas upright; a roller coaster climbs its lift hill and races through a loop. When a command runs
// the train goes round; on an error the fuse blows, the string lights go dark section by section and a balloon
// floats away; when done small fireworks go up, spaced well apart.
const GOLD = '#ffd070'
const PINK = '#e0507a'
const STRAW = '#d8bf7a'
const WOOD = '#3a2a5a'
const WOOD_EDGE = '#5a4488'
const BULB = [GOLD, '#ff7aa8', '#7fd8ff', '#9affc0']

// The wheel: its centre and radius, and the ground the whole fair stands on.
const WC: [number, number] = [290, 410]
const WR = 270
const GROUND = 880

// The coaster: the lift hill, the crest, the drop, then the foot of the loop.
const LOOP: [number, number] = [1480, 440]
const LR = 120
const FOOT = LOOP[1] + LR

type Pt = { x: number; y: number; a: number; t: number }

/** The train's path over the lift hill, crest and drop, sampled with the time it takes (it speeds up as it falls). */
function ride(): { pts: Pt[]; total: number } {
  const A: [number, number] = [1010, 570]
  const B: [number, number] = [1272, 242]
  const segs: { n: number; at: (u: number) => [number, number] }[] = [
    { n: 6, at: u => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u] },
    {
      n: 4,
      at: u => [(1 - u) ** 2 * 1272 + 2 * u * (1 - u) * 1300 + u * u * 1330, (1 - u) ** 2 * 242 + 2 * u * (1 - u) * 205 + u * u * 240],
    },
    {
      n: 10,
      at: u => [
        (1 - u) ** 3 * 1330 + 3 * (1 - u) ** 2 * u * 1380 + 3 * (1 - u) * u * u * 1400 + u ** 3 * 1450,
        (1 - u) ** 3 * 240 + 3 * (1 - u) ** 2 * u * 300 + 3 * (1 - u) * u * u * FOOT + u ** 3 * FOOT,
      ],
    },
    { n: 2, at: u => [1450 + 30 * u, FOOT] },
  ]
  const raw: [number, number][] = []

  segs.forEach((s, si) => {
    for (let i = si === 0 ? 0 : 1; i <= s.n; i += 1) raw.push(s.at(i / s.n))
  })

  const pts: Pt[] = []
  let t = 0

  raw.forEach(([x, y], i) => {
    const [px, py] = raw[Math.max(0, i - 1)] as [number, number]
    const [nx, ny] = raw[Math.min(raw.length - 1, i + 1)] as [number, number]
    const speed = (yy: number, xx: number) => (xx < 1285 ? 320 : Math.sqrt(320 * 320 + 2 * 1250 * Math.max(0, yy - 240)))

    if (i > 0) t += Math.hypot(x - px, y - py) / ((speed(y, x) + speed(py, px)) / 2)
    pts.push({ x, y, a: (Math.atan2(ny - py, nx - px) * 180) / Math.PI, t })
  })

  return { pts, total: t }
}

const train = (): string =>
  '<g transform="scale(1.5)">' +
  [-34, 0, 34]
    .map(
      x =>
        `<rect x="${x - 14}" y="-17" width="28" height="13" rx="4" fill="#ff5c8c"/><rect x="${x - 14}" y="-17" width="28" height="3" rx="1.5" fill="#fff0b8"/>` +
        `<circle cx="${x}" cy="-24" r="3.4" fill="#ffe2a0"/><path d="M${x - 4} -21L${x - 7} -31M${x + 4} -21L${x + 7} -31" stroke="#ffe2a0" stroke-width="2" stroke-linecap="round"/>`,
    )
    .join('') +
  `<path d="M-48 -3H48" stroke="#1a1030" stroke-width="3"/><circle cx="56" cy="-10" r="22" fill="#fff0b8" fill-opacity=".22"/><circle cx="50" cy="-10" r="4" fill="#fff6d0"/></g>`

function tent(cx: number, h: number, w: number, c1: string, c2: string): string {
  const k = 8
  const eave = GROUND - h * 0.42
  const step = w / k
  const wedge = (par: number) =>
    Array.from({ length: k }, (_, i) => i)
      .filter(i => i % 2 === par)
      .map(i => `M${cx} ${GROUND - h}L${f(cx - w / 2 + i * step)} ${f(eave)}L${f(cx - w / 2 + (i + 1) * step)} ${f(eave)}Z`)
      .join('')
  const scallop = `M${cx - w / 2} ${f(eave)}${`a${f(step / 2)} 10 0 0 0 ${f(step)} 0`.repeat(k)}`

  return (
    `<rect x="${cx - w / 2}" y="${f(eave)}" width="${w}" height="${f(GROUND - eave)}" fill="#120a24"/>` +
    `<path d="${wedge(0)}" fill="${c1}"/><path d="${wedge(1)}" fill="${c2}"/><path d="${scallop}V${f(eave)}Z" fill="${c1}"/>` +
    `<path d="M${cx - 16} ${GROUND}V${GROUND - 44}a16 16 0 0 1 32 0V${GROUND}Z" fill="${GOLD}" fill-opacity=".3"/>` +
    `<path d="M${cx} ${GROUND - h}V${GROUND - h - 30}l24 8l-24 8" fill="${PINK}" stroke="#2a1840" stroke-width="2"/>`
  )
}

/** The laptop and a lever box, with a spark that jumps at the fuse when something fails. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${246 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const lamps = ['#ff6a7a', GOLD, '#7affb0'].map((c, i) => `<circle class="ca-lamp" style="animation-delay:${i * -0.5}s" cx="${362 + i * 14}" cy="311" r="3" fill="${c}"/>`).join('')
  const lever = (x: number, c: string, i: number) =>
    `<g transform="translate(${x} 306)"><g class="ca-lv" style="animation-delay:${i * -0.35}s"><rect x="-2" y="-34" width="4" height="34" fill="#c8b8d8"/><circle cy="-36" r="6" fill="${c}"/></g></g>`

  return (
    '<rect x="240" y="323" width="96" height="7" rx="2" fill="#4a3a6a"/>' +
    keys +
    '<path d="M328 327L354 238L364 240L338 329Z" fill="#4a3a6a"/>' +
    `<path d="M329 324L353 242L357 243L333 326Z" fill="${light}"/>` +
    `<path d="M329 324L353 242L340 246L320 324Z" fill="${light}" fill-opacity=".18"/>` +
    // The lever box.
    '<rect x="348" y="302" width="60" height="28" rx="3" fill="#2a1f48" stroke="#6a54a8" stroke-width="2"/>' +
    lamps +
    lever(366, '#ff6a7a', 0) +
    lever(380, GOLD, 1) +
    lever(394, '#7affb0', 2) +
    '<g class="ca-spark"><circle cx="378" cy="296" r="22" fill="#ffcf70" fill-opacity=".5"/><path d="M370 288l6 8l-6 4l8 8" fill="none" stroke="#fff0b8" stroke-width="2.4" stroke-linejoin="round"/></g>'
  )
}

export function carnivalWorld(): World {
  const next = random(23)
  const stars = Array.from({ length: 36 }, () => `<circle cx="${f(next() * 1600)}" cy="${f(next() * 520)}" r="${f(0.8 + next() * 1.2)}" fill="#e8e0ff"/>`).join('')

  // The wheel: bulbs in three chase groups, gondolas that stay upright, spokes and rims.
  const bulbGroup = (g: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const a = ((i * 3 + g) * 10 * Math.PI) / 180

      return `<circle cx="${f(Math.cos(a) * WR)}" cy="${f(Math.sin(a) * WR)}" r="6.5" fill="${BULB[(i + g) % 4]}"/>`
    }).join('')
  const gondolas = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    const c = [PINK, '#f2b84a', '#4aa8d8', '#8a6ad0'][i % 4]

    return (
      `<g transform="translate(${f(Math.cos(a) * WR)} ${f(Math.sin(a) * WR)})"><g class="ca-gon">${i === 3 ? '<g class="ca-sw3">' : ''}` +
      `<path d="M0 0V14" stroke="#8a6ad0" stroke-width="2"/><rect x="-19" y="14" width="38" height="28" rx="6" fill="${c}"/><rect class="ca-gw" style="--w:${f(0.2 + i * 0.04)}s" x="-13" y="20" width="26" height="12" rx="2" fill="#ffe2a0" fill-opacity=".7"/>${i === 3 ? '</g>' : ''}</g></g>`
    )
  }).join('')
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6

    return `M0 0L${f(Math.cos(a) * WR)} ${f(Math.sin(a) * WR)}`
  }).join('')
  const legs =
    `M${WC[0]} ${WC[1]}L150 ${GROUND}M${WC[0]} ${WC[1]}L430 ${GROUND}M${WC[0]} ${WC[1]}L220 ${GROUND}M${WC[0]} ${WC[1]}L360 ${GROUND}` +
    `M${f(WC[0] - 70)} ${GROUND - 130}H${f(WC[0] + 70)}M${f(WC[0] - 100)} ${GROUND - 260}H${f(WC[0] + 100)}`

  // The carousel at the bottom left: a striped canopy and horses that rise and fall as they go round.
  const horse = (i: number) =>
    `<g transform="translate(120 ${812 + (i % 2) * 6})"><g class="ca-orb" style="animation-delay:calc(var(--cs,7s) * ${f(-i * 0.25)})"><g class="ca-hb" style="animation-delay:${f(-i * 0.5)}s">` +
    `<ellipse rx="19" ry="9" fill="${['#e8d8b8', '#d8a8c0', '#a8c8e8', '#e8c878'][i]}"/><path d="M12 -4L20 -18L30 -16L28 -8L18 0Z" fill="${['#e8d8b8', '#d8a8c0', '#a8c8e8', '#e8c878'][i]}"/>` +
    '<path d="M-12 6V20M12 6V20" stroke="#3a2a5a" stroke-width="3"/></g></g></g>'
  const canopy =
    '<path d="M12 776L120 718L228 776Z" fill="#6a2a58"/><path d="M120 718L66 776H92ZM120 718L150 776H176Z" fill="#c8a868" fill-opacity=".8"/>' +
    `<path d="M12 776${'a18 10 0 0 0 36 0'.repeat(6)}Z" fill="#8a2a48"/><path d="M120 718V700" stroke="#c8a868" stroke-width="3"/><circle cx="120" cy="698" r="5" fill="${GOLD}"/>` +
    '<path d="M36 786V858M78 786V858M120 786V858M162 786V858M204 786V858" stroke="#a88a50" stroke-opacity=".7" stroke-width="3"/>' +
    '<rect x="14" y="856" width="212" height="22" rx="3" fill="#3a2a5a" stroke="#5a4488" stroke-width="2"/>' +
    `<g class="ca-rb ca-rb1">${[0, 3, 6].map(i => `<circle cx="${30 + i * 30}" cy="790" r="3.6" fill="${BULB[i % 4]}"/>`).join('')}</g>`

  // Strings of bulbs along the top, in four sections that can go dark one after another.
  const section = (x0: number, x1: number, y0: number, y1: number, cls: string, n: number, phase: number): string => {
    const midY = (y0 + y1) / 2 + 90
    const pt = (t: number): [number, number] => [
      (1 - t) ** 2 * x0 + 2 * t * (1 - t) * ((x0 + x1) / 2) + t * t * x1,
      (1 - t) ** 2 * y0 + 2 * t * (1 - t) * midY + t * t * y1,
    ]
    const bulbs = Array.from({ length: n }, (_, i) => {
      const [x, y] = pt((i + 0.5) / n)
      const c = BULB[(i + phase) % 4]

      return `<circle cx="${f(x)}" cy="${f(y + 7)}" r="11" fill="${c}" fill-opacity=".2"/><circle cx="${f(x)}" cy="${f(y + 7)}" r="3.6" fill="${c}"/>`
    }).join('')

    return `<g class="ca-sec ${cls}"><path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${f(midY)} ${x1} ${y1}" fill="none" stroke="#1a1030" stroke-width="2"/>${bulbs}</g>`
  }

  // Fireworks: small bursts, far apart in time.
  const burst = (x: number, y: number, c: string, d: number, r: number): string => {
    const rays = (n: number, r0: number, r1: number, off: number) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + off

        return `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)}L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)}`
      }).join('')

    return (
      `<g transform="translate(${x} ${y})"><g class="ca-fw" style="animation-delay:${d}s">` +
      `<path d="${rays(12, r * 0.55, r, 0)}" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>` +
      `<path d="${rays(8, r * 0.2, r * 0.45, 0.2)}" stroke="#fff0c8" stroke-width="3" stroke-linecap="round" fill="none"/>` +
      `<path d="${rays(20, r * 0.62, r * 1.1, 0.1)}" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 14" fill="none"/></g></g>`
    )
  }

  // The coaster's train, sampled along the hill and the drop, then round the loop and away.
  const { pts, total } = ride()
  const d2 = 1
  const d3 = 0.7
  const T = total + d2 + d3 + 1.8
  const pc = (t: number) => f((t / T) * 100)
  const tr = pts.map((p, i) => `${pc(p.t)}%{${i === 0 ? 'opacity:1;' : ''}transform:translate(${f(p.x)}px,${f(p.y)}px) rotate(${f(p.a)}deg)}`).join('')
  const posts = Array.from({ length: 6 }, (_, i) => {
    const x = 1040 + i * 44
    const y = 570 + ((x - 1010) / 262) * (242 - 570)

    return `M${x} ${f(y)}V${GROUND}`
  }).join('') + `M1390 540V${GROUND}M1570 540V${GROUND}M1350 330V${GROUND}`

  const tents = tent(610, 230, 290, '#3a1c4e', '#5a2a66') + tent(900, 290, 340, '#1c3a5a', '#2a5a80') + tent(1140, 200, 240, '#4a2030', '#703a48')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#07040f',
      furniture: WOOD,
      metal: '#4a3a6a',
      paper: '#e8dcc0',
      light: { idle: '#b88a50', work: '#f2b84a', bright: '#ffe9a8' },
      headTop: 206,
      glowAt: [338, 284],
      device,
      wear: {
        front:
          // The straw boater: a flat brim above the eyes, a striped crown and a red ribbon.
          `<ellipse cx="150" cy="242" rx="98" ry="9" fill="#bda262"/><path d="M54 242C54 236 246 236 246 242" fill="none" stroke="#e6d08e" stroke-opacity=".6" stroke-width="2"/>` +
          `<rect x="98" y="206" width="104" height="36" rx="3" fill="${STRAW}"/>` +
          '<path d="M115.3 206H132.7V242H115.3ZM150 206H167.3V242H150ZM184.7 206H202V242H184.7Z" fill="#b89a58"/>' +
          '<ellipse cx="150" cy="206" rx="52" ry="8" fill="#e6d08e"/>' +
          '<rect x="98" y="226" width="104" height="11" fill="#8a2a48"/><path d="M98 231.5H202" stroke="#e8dcc0" stroke-opacity=".7" stroke-width="2" stroke-dasharray="8 6"/>' +
          // A red bow tie at the throat, below the eyes.
          '<path d="M134 322L150 330L134 338Z M166 322L150 330L166 338Z" fill="#c8334a"/><rect x="146" y="325" width="8" height="10" rx="2" fill="#8a2030"/>',
      },
      seatArt:
        `<rect x="102" y="350" width="96" height="16" rx="7" fill="#8a2a48" stroke="#c8506a" stroke-width="2"/><path d="M144 366H156V440H144Z" fill="${WOOD}"/>` +
        `<path d="M150 440L108 456M150 440L192 456M150 440V456" stroke="${WOOD_EDGE}" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="418" r="7" fill="#5a4488"/>`,
      tableArt:
        // The booth counter: a gold-trimmed top over a red and cream striped front.
        `<rect x="160" y="330" width="312" height="12" rx="2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="2"/><path d="M162 331H470" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2"/>` +
        '<rect x="172" y="342" width="296" height="114" fill="#2a1840"/>' +
        `<path d="${Array.from({ length: 6 }, (_, i) => `M${172 + i * 52} 342h26v114h-26Z`).join('')}" fill="#6a2440"/>` +
        `<path d="${Array.from({ length: 6 }, (_, i) => `M${198 + i * 52} 342h26v114h-26Z`).join('')}" fill="#7a6a62" fill-opacity=".75"/>`,
    },
    style:
      // Ambient life.
      '.ca-wheel{animation:mv-spin 80s linear infinite}.ca-gon{animation:mv-spin-back 80s linear infinite}' +
      '.ca-rb{opacity:.9}.ca-tw{animation:ca-tw 2.6s ease-in-out infinite alternate}@keyframes ca-tw{from{opacity:.5}to{opacity:1}}' +
      '.ca-st{animation:ca-tw 4s ease-in-out infinite alternate}.ca-st2{animation-duration:6s;animation-delay:-2s}' +
      '.ca-car{--cs:7s}.st-tool .ca-car{--cs:2.2s}' +
      '.ca-orb{animation:ca-orb var(--cs,7s) cubic-bezier(.37,0,.63,1) infinite alternate}@keyframes ca-orb{from{transform:translateX(-78px)}to{transform:translateX(78px)}}' +
      '.ca-hb{animation:ca-hb 1.6s ease-in-out infinite alternate}@keyframes ca-hb{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
      '.ca-lv{animation:ca-lv 6s ease-in-out infinite alternate;transform-box:view-box}@keyframes ca-lv{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}' +
      '.st-run .ca-lv,.st-tool .ca-lv{animation-duration:.9s}' +
      '.ca-lamp{animation:ca-tw 1.6s ease-in-out infinite alternate}' +
      '.ca-bal{animation:ca-bal 5s ease-in-out infinite alternate}@keyframes ca-bal{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}' +
      '.ca-bn{transform-box:view-box;transform-origin:404px 330px}' +
      // web: the bulbs chase around the wheel.
      '.st-web .ca-rb{animation:ca-chase 1.2s ease-in-out infinite}.st-web .ca-rb2{animation-delay:-.4s}.st-web .ca-rb3{animation-delay:-.8s}' +
      '@keyframes ca-chase{0%,100%{opacity:.15}35%{opacity:1}}' +
      // run: the coaster train goes up the lift hill, down the drop, round the loop and away.
      '.ca-t,.ca-park{opacity:1}.ca-t{opacity:0}.st-run .ca-park{opacity:0}' +
      `.st-run .ca-t1{animation:ca-t1 ${f(T)}s linear infinite}` +
      `@keyframes ca-t1{${tr}${pc(total + 0.01)}%{opacity:0}100%{opacity:0}}` +
      `.st-run .ca-t2{animation:ca-t2 ${f(T)}s linear infinite}` +
      `@keyframes ca-t2{0%,${pc(total)}%{opacity:0;transform:rotate(0)}${pc(total + 0.01)}%{opacity:1}${pc(total + d2)}%{opacity:1;transform:rotate(-360deg)}${pc(total + d2 + 0.01)}%,100%{opacity:0;transform:rotate(-360deg)}}` +
      `.st-run .ca-t3{animation:ca-t3 ${f(T)}s linear infinite}` +
      `@keyframes ca-t3{0%,${pc(total + d2)}%{opacity:0;transform:translate(1480px,${FOOT}px)}${pc(total + d2 + 0.01)}%{opacity:1;transform:translate(1480px,${FOOT}px)}${pc(total + d2 + d3)}%{opacity:1;transform:translate(1760px,${FOOT}px)}${pc(total + d2 + d3 + 0.01)}%,100%{opacity:0;transform:translate(1760px,${FOOT}px)}}` +
      // error: the fuse blows, the strings go dark in turn and a balloon floats away.
      '.st-error .ca-spark{animation:ca-spark 1.6s ease-out both}' +
      '@keyframes ca-spark{0%{opacity:0}12%{opacity:.8}50%{opacity:.3}100%{opacity:0}}.ca-spark{opacity:0}' +
      '.st-error .ca-s1{animation:ca-off .35s ease-out .15s both}.st-error .ca-s2{animation:ca-off .35s ease-out .4s both}' +
      '.st-error .ca-s3{animation:ca-off .35s ease-out .65s both}.st-error .ca-s4{animation:ca-off .35s ease-out .9s both}.st-error .ca-s5{animation:ca-off .35s ease-out 1.15s both}' +
      '.st-error .ca-rb1{animation:ca-off .3s ease-out .2s both}.st-error .ca-rb2{animation:ca-off .3s ease-out .4s both}.st-error .ca-rb3{animation:ca-off .3s ease-out .6s both}' +
      '.st-error .ca-gw{animation:ca-off .3s ease-out var(--w) both}@keyframes ca-off{to{opacity:.04}}' +
      // The wheel lurches to a stop with a small back-swing, one gondola swinging on its pivot.
      '.st-error .ca-wheel{animation:ca-lurch 1.1s ease-out both}.st-error .ca-gon{animation:ca-lurchb 1.1s ease-out both}' +
      '@keyframes ca-lurch{0%{transform:rotate(0)}22%{transform:rotate(4deg)}50%{transform:rotate(-2.4deg)}75%{transform:rotate(.8deg)}100%{transform:rotate(0)}}' +
      '@keyframes ca-lurchb{0%{transform:rotate(0)}22%{transform:rotate(-4deg)}50%{transform:rotate(2.4deg)}75%{transform:rotate(-.8deg)}100%{transform:rotate(0)}}' +
      '.st-error .ca-sw3{animation:ca-swing 1.3s ease-in-out .3s infinite alternate}@keyframes ca-swing{from{transform:rotate(-28deg)}to{transform:rotate(28deg)}}' +
      // A soft spark at the hub, and the train stalls halfway up the lift hill.
      '.ca-hs{opacity:0}.st-error .ca-hs{animation:ca-hs 1.8s ease-out .35s both}' +
      '@keyframes ca-hs{0%{opacity:0}9%{opacity:.8}24%{opacity:.15}40%{opacity:.7}65%,100%{opacity:0}}' +
      '.st-error .ca-pk{animation:ca-stall 1.3s ease-out both}@keyframes ca-stall{to{transform:translate(131px,-164px)}}' +
      '.ca-dim{opacity:0}.st-error .ca-dim{animation:ca-dim 1.6s ease-out .3s both}@keyframes ca-dim{to{opacity:.55}}' +
      '.st-error .ca-balloon{animation:ca-fly 6s ease-in .8s both}@keyframes ca-fly{0%{transform:translate(0,0)}100%{transform:translate(-160px,-1000px) rotate(-18deg)}}' +
      // done: small fireworks, one at a time, never a big flash.
      '.ca-fw{opacity:0}.st-done .ca-fw{animation:ca-fw 5.6s ease-out infinite}' +
      '@keyframes ca-fw{0%{opacity:0;transform:scale(.25)}5%{opacity:.85}22%{opacity:.85;transform:scale(.9)}58%,100%{opacity:0;transform:scale(1.08)}}' +
      '.st-done .ca-rb1{animation:ca-pay 1.4s ease-in-out .2s both}.st-done .ca-rb2{animation:ca-pay 1.4s ease-in-out .55s both}.st-done .ca-rb3{animation:ca-pay 1.4s ease-in-out .9s both}' +
      '@keyframes ca-pay{0%{opacity:.3}45%{opacity:1}100%{opacity:.9}}',
    scenery:
      '<defs><linearGradient id="ca-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030f"/><stop offset=".6" stop-color="#150b32"/><stop offset="1" stop-color="#3a1a52"/></linearGradient>' +
      '<radialGradient id="ca-halo"><stop offset="0" stop-color="#8a5ad0" stop-opacity=".4"/><stop offset="1" stop-color="#8a5ad0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ca-col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#02010a" stop-opacity="0"/><stop offset=".14" stop-color="#02010a" stop-opacity=".34"/><stop offset=".86" stop-color="#02010a" stop-opacity=".34"/><stop offset="1" stop-color="#02010a" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#ca-sky)"/>' +
      `<g class="ca-st">${stars}</g>` +
      '<g class="mv-b">' +
      `<circle cx="${WC[0]}" cy="${WC[1]}" r="330" fill="url(#ca-halo)"/>` +
      tents +
      // The wheel on its A-frame.
      `<path d="${legs}" fill="none" stroke="#3a2c64" stroke-width="11" stroke-linecap="round"/><path d="M${WC[0]} ${WC[1]}L150 ${GROUND}M${WC[0]} ${WC[1]}L430 ${GROUND}" stroke="#6a54b0" stroke-opacity=".6" stroke-width="2" fill="none"/>` +
      `<g transform="translate(${WC[0]} ${WC[1]})"><g class="ca-wheel">` +
      `<circle r="${WR}" fill="none" stroke="#a488f0" stroke-width="8"/><circle r="${WR - 14}" fill="none" stroke="#4a3a80" stroke-width="3"/><circle r="110" fill="none" stroke="#4a3a80" stroke-width="3"/>` +
      `<path d="${spokes}" stroke="#6a54b0" stroke-width="3.5" fill="none"/>` +
      `<g class="ca-rb ca-rb1">${bulbGroup(0)}</g><g class="ca-rb ca-rb2">${bulbGroup(1)}</g><g class="ca-rb ca-rb3">${bulbGroup(2)}</g>` +
      `${gondolas}<circle r="26" fill="#2a1f48" stroke="#8a6ad0" stroke-width="3"/><circle r="8" fill="${GOLD}"/></g>` +
      '<g class="ca-hs"><circle r="38" fill="#ffcf70" fill-opacity=".4"/><path d="M-8 -14l8 10l-8 6l12 14" fill="none" stroke="#fff0b8" stroke-width="3" stroke-linejoin="round"/></g></g>' +
      `<g transform="translate(150 878) scale(1.3) translate(-120 -878)"><g class="ca-car">${canopy}${[0, 1, 2, 3].map(horse).join('')}</g></g>` +
      // The coaster: posts, the track over the hill and the drop, the loop and the exit rail.
      '<g class="mv-r">' +
      `<path d="${posts}" stroke="#2a1f48" stroke-width="5" fill="none"/>` +
      `<path d="M1010 570L1272 242Q1300 205 1330 240C1380 300 1400 ${FOOT} 1450 ${FOOT}H1700" fill="none" stroke="#a488f0" stroke-width="8" stroke-linejoin="round"/>` +
      `<path d="M1010 580L1272 252Q1300 215 1330 250C1380 310 1400 ${FOOT + 8} 1450 ${FOOT + 8}H1700" fill="none" stroke="#2a1f48" stroke-width="4"/>` +
      `<circle cx="${LOOP[0]}" cy="${LOOP[1]}" r="${LR}" fill="none" stroke="#a488f0" stroke-width="8"/><circle cx="${LOOP[0]}" cy="${LOOP[1]}" r="${LR + 8}" fill="none" stroke="#2a1f48" stroke-width="4"/>` +
      `<g class="ca-pk"><g class="ca-park" transform="translate(1010 570) rotate(-51.4)">${train()}</g></g>` +
      `<g class="ca-t ca-t1">${train()}</g>` +
      `<g transform="translate(${LOOP[0]} ${LOOP[1]})"><g class="ca-t ca-t2"><g transform="translate(0 ${LR})">${train()}</g></g></g>` +
      `<g class="ca-t ca-t3">${train()}</g></g>` +
      `<rect x="-40" y="${GROUND}" width="1700" height="500" fill="#0e0a1e"/>` +
      '<path d="M-40 884H1700" stroke="#3a2a5a" stroke-width="3"/></g>' +
      section(-20, 420, 30, 46, 'ca-s1', 9, 0) +
      section(420, 820, 46, 34, 'ca-s2', 9, 1) +
      section(820, 1220, 34, 50, 'ca-s3', 9, 2) +
      section(1220, 1640, 50, 36, 'ca-s4', 9, 3) +
      burst(120, 150, '#ff7aa8', 0, 120) +
      burst(400, 110, GOLD, 1.1, 105) +
      burst(260, 360, '#7fd8ff', 2.2, 100) +
      burst(560, 330, '#c0a0ff', 3.3, 95) +
      burst(80, 330, '#9affc0', 4.4, 90) +
      '<rect class="ca-dim" width="1600" height="1000" fill="#02010a"/>' +
      '<rect x="380" width="840" height="1000" fill="url(#ca-col)"/>',
    nook:
      // The booth: floor, posts, a striped awning with its own string of bulbs, and a balloon on a string.
      '<rect x="-120" y="456" width="560" height="120" fill="#0e0a1e"/><path d="M-120 456H440" stroke="#3a2a5a" stroke-width="3"/>' +
      '<rect x="20" y="120" width="400" height="336" fill="#150d2a"/><path d="M20 190H420M20 260H420M20 330H420" stroke="#241840" stroke-width="2"/>' +
      '<rect x="12" y="62" width="14" height="394" fill="#3a2a5a"/><rect x="414" y="62" width="14" height="394" fill="#3a2a5a"/>' +
      '<path d="M-30 118L20 62H420L470 118Z" fill="#7a2442"/>' +
      '<path d="M3.3 118L38 62H78L53 118ZM85 118L118 62H158L145 118ZM170 118L198 62H238L237 118ZM255 118L278 62H318L329 118ZM340 118L358 62H398L421 118Z" fill="#c8b898" fill-opacity=".85"/>' +
      `<path d="M-30 118${'a22 11 0 0 0 44 0'.repeat(11)}Z" fill="#7a2442"/>` +
      `<g class="ca-sec ca-s5">${Array.from({ length: 8 }, (_, i) => `<circle cx="${f(2 + i * 56)}" cy="136" r="10" fill="${BULB[i % 4]}" fill-opacity=".22"/><circle cx="${f(2 + i * 56)}" cy="136" r="3.6" fill="${BULB[i % 4]}"/>`).join('')}</g>` +
      '<g class="ca-balloon"><g class="ca-bn"><g class="ca-bal"><path d="M404 330V196" stroke="#c8b8d8" stroke-width="1.6"/>' +
      '<ellipse cx="404" cy="170" rx="22" ry="27" fill="#d8344c"/><path d="M404 197l-5 7h10Z" fill="#d8344c"/><ellipse cx="396" cy="160" rx="5" ry="9" fill="#ff9aa8" fill-opacity=".5"/></g></g></g>',
  }
}
