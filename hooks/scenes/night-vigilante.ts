import type { Activity } from '../../types'
import { f, rain, random } from './kit'
import type { World } from './world'

// Night Vigilante: a hooded watcher on a gothic rooftop in the rain, a rugged field computer open on the stone
// parapet. Spires and stepped towers fade into the fog, a gargoyle spouts rainwater, steam drifts up from the vents,
// and a big rooftop searchlight throws Claude's own starburst onto the low clouds. When a command runs the beam
// sweeps the sky, the emblem flares and a grappling line shoots between the towers; an error makes the lamp sputter
// out under heavier rain; done holds the emblem steady while the clouds part on a full moon.
const CORAL = '#ff7a59'
const STONE = '#1c2029'
const STONE_EDGE = '#343a47'
const WET = '#4a5466'
const CASE = '#1d2128'
const CASE_EDGE = '#3a414d'
const LATCH = '#c8643f'

// The searchlight: its pivot on the roof, its tilt toward the clouds, and how far up the beam meets them.
const LAMP_X = 250
const LAMP_Y = 800
const TILT = 5.4
const REACH = 640

const RAYS = [1, 0.72, 0.9, 0.66, 0.96, 0.78, 0.7, 0.94, 0.74, 0.88, 0.64, 0.84]
const JITTER = [0, 4, -3, 5, -2, 3, -4, 2, -5, 3, -2, 4]

/** Claude's emblem: twelve uneven rays from one point, as a single round-capped path. */
function burst(r: number): string {
  return RAYS.map((k, i) => {
    const a = ((i * 30 + (JITTER[i] ?? 0) - 90) * Math.PI) / 180

    return `M0 0L${f(Math.cos(a) * r * k)} ${f(Math.sin(a) * r * k)}`
  }).join('')
}

/** A crouching stone grotesque facing right, feet on y 0: rump, spiny neck, a backswept horn, an open jaw. No wings. */
const GARGOYLE =
  'M-72 0C-80 -26 -70 -56 -46 -66C-28 -74 -8 -72 8 -64L16 -74L22 -64L30 -72L34 -62C42 -66 52 -72 62 -70L52 -96L72 -74' +
  'L86 -66L100 -58L100 -50L86 -48L98 -40L92 -34C78 -32 66 -26 62 -16L70 -6L76 0H50C46 -12 30 -16 16 -10C8 -6 2 0 -4 0Z'

type Tower = { x: number; w: number; top: number }

/** A row of rooftops as one path: flat blocks, stepped towers with a needle, gothic spires, clusters of pinnacles. */
function skyline(seed: number, from: number, to: number, base: number, lo: number, hi: number, wide: [number, number]): { d: string; towers: Tower[] } {
  const next = random(seed)
  const towers: Tower[] = []
  let d = ''

  for (let x = from; x < to; ) {
    const w = wide[0] + next() * (wide[1] - wide[0])
    // Now and then a tall one, so the row reads as towers and not as a ridge.
    const top = next() < 0.2 ? lo - (hi - lo) * 0.7 * next() : lo + next() * (hi - lo)
    const roll = next()
    const c = x + w / 2

    d += `M${f(x)} ${base}V${f(top)}H${f(x + w)}V${base}Z`

    if (roll < 0.32) {
      // Stepped crown and a thin needle.
      d +=
        `M${f(x + w * 0.14)} ${f(top + 1)}V${f(top - w * 0.3)}H${f(x + w * 0.86)}V${f(top + 1)}Z` +
        `M${f(x + w * 0.3)} ${f(top - w * 0.29)}V${f(top - w * 0.56)}H${f(x + w * 0.7)}V${f(top - w * 0.29)}Z` +
        `M${f(c - 2)} ${f(top - w * 0.55)}L${f(c)} ${f(top - w * 1.2)}L${f(c + 2)} ${f(top - w * 0.55)}Z`
    } else if (roll < 0.5) {
      // A belfry and a slim gothic spire.
      d +=
        `M${f(x + w * 0.25)} ${f(top + 1)}V${f(top - w * 0.5)}H${f(x + w * 0.75)}V${f(top + 1)}Z` +
        `M${f(x + w * 0.27)} ${f(top - w * 0.49)}L${f(c)} ${f(top - w * 1.5)}L${f(x + w * 0.73)} ${f(top - w * 0.49)}Z`
    } else if (roll < 0.62) {
      for (const k of [0.08, 0.92]) {
        const px = x + w * k

        d += `M${f(px - 4)} ${f(top + 1)}L${f(px)} ${f(top - 22)}L${f(px + 4)} ${f(top + 1)}Z`
      }
    } else if (roll < 0.8) {
      // A rooftop box for stairs or tanks.
      d += `M${f(x + w * 0.2)} ${f(top + 1)}V${f(top - 14)}H${f(x + w * 0.45)}V${f(top + 1)}Z`
    }

    towers.push({ x, w, top })
    x += w * (0.8 + next() * 0.45)
  }

  return { d, towers }
}

/** The field computer: a hard case open on the parapet, its lid a screen with a city grid and a mark per activity. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 7 }, (_, i) => `<rect x="${252 + i * 12}" y="313" width="8" height="3" fill="${light}" fill-opacity=".5"/>`).join('')
  const at = 'translate(360 266)'
  let mark: string

  switch (activity) {
    case 'error':
      mark = `<path d="M-9 -9L9 9M9 -9L-9 9" stroke="${light}" stroke-width="3" stroke-linecap="round"/>`
      break
    case 'done':
      mark = `<path d="M-10 0L-3 7L11 -8" fill="none" stroke="${light}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      break
    case 'web':
      mark = `<g fill="none" stroke="${light}" stroke-width="1.6"><circle class="nv-blip" r="7"/><circle class="nv-blip" r="7" style="animation-delay:-.5s"/></g><circle r="2.4" fill="${light}"/>`
      break
    case 'run':
      mark = `<g class="nv-blip"><circle r="9" fill="none" stroke="${light}" stroke-width="2"/></g><path d="M-14 0H-5M5 0H14M0 -14V-5M0 5V14" stroke="${light}" stroke-width="2"/>`
      break
    default:
      mark = `<circle r="6" fill="none" stroke="${light}" stroke-opacity=".8" stroke-width="1.6"/><circle r="2" fill="${light}"/>`
  }

  return (
    // The base of the case with its seam and two latches, the keys on top.
    `<rect x="240" y="311" width="172" height="19" rx="3" fill="${CASE}" stroke="${CASE_EDGE}" stroke-width="2"/>` +
    '<path d="M243 321H409" stroke="#0b0d11" stroke-width="2"/>' +
    `<g fill="${LATCH}"><rect x="268" y="317" width="13" height="8" rx="1.5"/><rect x="370" y="317" width="13" height="8" rx="1.5"/></g>` +
    keys +
    // The lid: a thick frame with steel corners, the screen inside it.
    `<path d="M298 314L313 222L410 227L404 314Z" fill="#191d24" stroke="${CASE_EDGE}" stroke-width="3" stroke-linejoin="round"/>` +
    '<g fill="#4a515e"><rect x="309" y="220" width="10" height="9" rx="2"/><rect x="402" y="224" width="10" height="9" rx="2"/><rect x="295" y="306" width="10" height="9" rx="2"/><rect x="398" y="306" width="10" height="9" rx="2"/></g>' +
    '<path d="M309 304L321 234L398 238L394 304Z" fill="#06090d"/>' +
    `<path d="M309 304L321 234L398 238L394 304Z" fill="${light}" fill-opacity=".13"/>` +
    `<path d="M318 252H396M315 270H395M312 288H394M340 236L336 304M364 237L362 304M384 238L383 304" stroke="${light}" stroke-opacity=".22" stroke-width="1.4"/>` +
    `<g transform="${at}">${mark}</g>` +
    // A short whip antenna on the lid's corner.
    `<path d="M408 228L420 182" stroke="#2c313b" stroke-width="3" stroke-linecap="round"/><circle cx="420" cy="181" r="3" fill="${LATCH}"/>` +
    // A coiled line and its grapnel on the parapet.
    '<g fill="none" stroke="#5a6272" stroke-width="2.2"><ellipse cx="200" cy="324" rx="20" ry="5"/><ellipse cx="200" cy="321" rx="17" ry="4"/></g>' +
    '<path d="M218 322L232 318M232 318L238 312M232 318L240 320M232 318L236 326" stroke="#8a94a6" stroke-width="2.2" stroke-linecap="round"/>'
  )
}

export function nightVigilanteWorld(): World {
  const next = random(4242)

  // The cloud deck over the top band, a lit underside under a dark body.
  const cloud = (x0: number, x1: number, n: number, y0: number, y1: number, seed: number): string => {
    const r = random(seed)
    let rim = ''
    let body = ''

    for (let i = 0; i < n; i += 1) {
      const cx = x0 + (i / (n - 1)) * (x1 - x0) + (r() - 0.5) * 50
      const cy = y0 + r() * (y1 - y0)
      const rx = 110 + r() * 110
      const ry = 38 + r() * 40

      rim += `<ellipse cx="${f(cx + 4)}" cy="${f(cy + 9)}" rx="${f(rx)}" ry="${f(ry)}" fill="#1b1e2a"/>`
      body += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${['#0e1119', '#11141d', '#0b0d14'][i % 3]}"/>`
    }

    return rim + body
  }

  // The city: a far row in the fog, a mid row with windows, and the cathedral spire the grapple lands on.
  const far = skyline(31, -40, 1640, 760, 420, 560, [56, 120])
  const mid = skyline(57, -60, 1640, 820, 540, 660, [70, 150])
  const windows = ['', '', '', '']

  for (const t of mid.towers) {
    for (let k = 0; k < 3; k += 1) {
      if (next() < 0.55) {
        const wx = t.x + 6 + next() * Math.max(4, t.w - 16)
        const wy = t.top + 12 + next() * 130

        windows[Math.max(0, Math.min(3, Math.floor(wx / 400)))] += `M${f(wx)} ${f(wy)}h3v5h-3z`
      }
    }
  }

  const windowGroups = windows.map((d, i) => `<path class="nv-wn" style="--d:${f(i * 0.32)}s" d="${d}" fill="#ffc9a0"/>`).join('')

  // The fog: a band and slow puffs.
  const puffs = Array.from({ length: 6 }, (_, i) => `<ellipse cx="${f(-100 + i * 330 + next() * 80)}" cy="${f(600 + next() * 120)}" rx="${f(240 + next() * 120)}" ry="${f(50 + next() * 30)}" fill="url(#nv-fp)"/>`).join('')

  // Steam from the vents.
  const steam = (x: number, y: number, n: number, drift: number, seed: number): string => {
    const r = random(seed)

    return Array.from({ length: n }, (_, i) => `<ellipse class="nv-st" cx="${x}" cy="${y}" rx="${f(18 + r() * 10)}" ry="${f(12 + r() * 6)}" fill="url(#nv-stm)" style="--sx:${f(drift + (r() - 0.5) * 30)}px;animation-delay:${f(-i * (6 / n))}s"/>`).join('')
  }

  // Rings spreading in the roof's puddles.
  const ripples = ([
    [120, 952, 26], [310, 972, 34], [470, 946, 20], [760, 984, 30], [1010, 958, 22],
  ] as const)
    .map(([x, y, rx], i) => `<ellipse class="nv-rp" cx="${x}" cy="${y}" rx="${rx}" ry="${f(rx * 0.22)}" fill="none" stroke="#9fb0c4" stroke-width="1.4" style="animation-delay:${f(-i * 0.47)}s"/>`)
    .join('')

  // The grapple: from the near tower's belfry to the cathedral spire.
  const G0 = [128, 400] as const
  const G1 = [388, 318] as const
  const gAngle = (Math.atan2(G1[1] - G0[1], G1[0] - G0[0]) * 180) / Math.PI

  // The searchlight's beam and the emblem it throws, in the lamp's own frame (pointing up), drawn behind the towers.
  const beam =
    `<g transform="translate(${LAMP_X} ${LAMP_Y})"><g class="nv-sw"><g transform="rotate(${TILT})"><g class="nv-lit">` +
    '<polygon points="-40,-80 40,-80 126,-628 -126,-628" fill="url(#nv-bm)"/>' +
    '<polygon points="-20,-80 20,-80 64,-628 -64,-628" fill="url(#nv-bm)"/>' +
    `<g transform="translate(0 ${-REACH}) rotate(${-TILT})"><g class="nv-sig"><g class="nv-fl">` +
    '<ellipse class="nv-bl" rx="300" ry="160" fill="url(#nv-blg)"/>' +
    '<ellipse rx="168" ry="98" fill="url(#nv-hal)"/>' +
    '<ellipse rx="128" ry="74" fill="url(#nv-ov)"/>' +
    `<g transform="scale(1 .6)" fill="none" stroke="#d4583a" stroke-linecap="round"><path d="${burst(60)}" stroke-width="13"/></g>` +
    '<ellipse rx="10" ry="6" fill="#d4583a"/>' +
    '<g fill="#0b0d13" fill-opacity=".32"><ellipse cx="-74" cy="-40" rx="74" ry="15"/><ellipse cx="66" cy="44" rx="84" ry="13"/><ellipse cx="96" cy="-22" rx="40" ry="9"/></g>' +
    '</g></g></g></g></g></g></g>'

  // The lamp itself, in front of everything: the drum turns with the beam; the yoke and pedestal stay put.
  const lamp =
    `<g transform="translate(${LAMP_X} ${LAMP_Y})"><g class="nv-sw"><g transform="rotate(${TILT})">` +
    '<g class="nv-lit"><circle cy="-78" r="78" fill="url(#nv-lg)"/></g>' +
    '<rect x="-44" y="-66" width="88" height="100" rx="6" fill="#1a1e26" stroke="#3b4250" stroke-width="2"/>' +
    '<path d="M-44 -40H44M-44 -14H44M-44 12H44" stroke="#2a303b" stroke-width="3"/>' +
    '<rect x="-34" y="34" width="68" height="14" rx="3" fill="#14171d" stroke="#2e3440" stroke-width="2"/>' +
    '<rect x="-51" y="-80" width="102" height="16" rx="4" fill="#262b35" stroke="#454d5c" stroke-width="2"/>' +
    '<ellipse class="nv-lens" cy="-80" rx="44" ry="8" fill="#ffe6da"/>' +
    `<ellipse class="nv-emb" cy="-80" rx="30" ry="5" fill="${CORAL}"/>` +
    '<path d="M-38 -60L-30 28" stroke="#5a6374" stroke-opacity=".5" stroke-width="2"/>' +
    '</g></g>' +
    '<g fill="#1a1e26" stroke="#3b4250" stroke-width="2"><circle cx="-52" r="9"/><circle cx="52" r="9"/></g></g>' +
    `<path d="M${LAMP_X - 52} ${LAMP_Y}V870H${LAMP_X + 52}V${LAMP_Y}" fill="none" stroke="#161a21" stroke-width="12"/>` +
    `<path d="M${LAMP_X - 14} 870H${LAMP_X + 14}L${LAMP_X + 22} 916H${LAMP_X - 22}Z" fill="#14171d" stroke="#2e3440" stroke-width="2"/>` +
    `<rect x="${LAMP_X - 46}" y="912" width="92" height="12" rx="3" fill="#191c23" stroke="#30363f" stroke-width="2"/>`

  // The near tower at the left: a spire, corner pinnacles, the belfry, a cornice with the gargoyle, a lancet window.
  const tower =
    '<path d="M-40 1000V330H170V1000Z M-34 330L64 92L162 330Z M140 330L158 262L176 330Z M-46 330L-30 270L-14 330Z" fill="#07080c"/>' +
    '<path d="M64 92V72" stroke="#07080c" stroke-width="4"/><circle cx="64" cy="69" r="4.5" fill="#07080c"/>' +
    '<path d="M64 92L162 330M158 262L176 330M170 330V1000" fill="none" stroke="#232836" stroke-width="2"/>' +
    '<g fill="#030406"><path d="M14 470V392Q14 366 32 354Q50 366 50 392V470Z"/><path d="M92 470V392Q92 366 110 354Q128 366 128 392V470Z"/></g>' +
    '<rect x="-40" y="496" width="232" height="18" fill="#0d0f15" stroke="#252a37" stroke-width="2"/>' +
    '<path d="M170 514H196V640H182V780H170Z" fill="#07080c" stroke="#1d212c" stroke-width="2"/>' +
    '<path d="M36 840V650Q36 600 72 580Q108 600 108 650V840Z" fill="#05060a" stroke="#1a1e28" stroke-width="3"/>' +
    '<path d="M42 836V652Q42 608 72 590Q102 608 102 652V836Z" fill="url(#nv-lw)"/>' +
    '<path d="M62 598V836M82 598V836" stroke="#05060a" stroke-width="3"/>' +
    `<g transform="translate(176 497) scale(1.5)"><path d="${GARGOYLE}" fill="#090a0f" stroke="#2b303d" stroke-width="1.4" stroke-linejoin="round"/></g>` +
    '<path class="nv-sp" d="M315 434Q332 470 336 560V720" fill="none" stroke="#a9bccd" stroke-opacity=".34" stroke-width="2.6" stroke-linecap="round"/>'

  // The tall stepped tower at the right with its needle and beacon.
  const deco =
    '<path d="M1205 1000V300H1325V1000Z M1215 301V250H1315V301Z M1230 251V200H1300V251Z M1245 201V160H1285V201Z M1260 161L1265 56L1270 161Z" fill="#090b10"/>' +
    '<path d="M1225 300V900M1245 300V900M1265 300V900M1285 300V900M1305 300V900" stroke="#121620" stroke-width="3"/>' +
    '<path d="M1205 300H1325M1215 250H1315M1230 200H1300M1245 160H1285" stroke="#262c3a" stroke-width="2"/>' +
    '<g fill="#ffc9a0" fill-opacity=".3"><rect x="1219" y="262" width="4" height="10"/><rect x="1307" y="262" width="4" height="10"/><rect x="1236" y="212" width="4" height="10"/><rect x="1290" y="212" width="4" height="10"/></g>' +
    '<circle class="nv-bc" cx="1265" cy="58" r="3.4" fill="#ffb36b"/>' +
    [0, 0.6, 1.2].map(d => `<circle class="nv-ring" cx="1265" cy="58" r="16" fill="none" stroke="#ffb36b" stroke-width="2" style="animation-delay:${d}s"/>`).join('')

  // The moon the clouds part on, and the two halves of the cloud over it.
  const rightClouds = (seed: number, x0: number, x1: number): string => cloud(x0, x1, 5, 40, 250, seed)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'smoke',
      ink: '#040508',
      furniture: STONE,
      metal: CASE,
      paper: '#d8dce4',
      light: { idle: '#b0603f', work: '#ff8a66', bright: '#ffd2bf' },
      headTop: 198,
      glowAt: [356, 268],
      device,
      wear: {
        // The cape behind: from the shoulders out past the body, a torn hem above the stone seat, flapping a little.
        behind:
          '<g shape-rendering="geometricPrecision"><path class="nv-cape" d="M68 250C44 296 32 352 26 414L44 406L60 420L80 408L102 422L126 410L178 412L202 424L222 410L244 422L262 408L276 416C270 352 258 296 232 250Z" fill="#141720" stroke="#363c4c" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M52 330Q46 370 44 404M250 330Q256 370 260 404" fill="none" stroke="#191c25" stroke-width="3"/></g>',
        // The hood: it frames the face with a low brooding brow that stops above the eyes.
        front:
          '<g shape-rendering="geometricPrecision">' +
          '<path d="M60 346C56 290 58 240 80 214C100 194 126 186 150 178C174 186 200 194 220 214C242 240 244 290 240 346H218V266C218 254 214 246 210 242L150 252L92 242C88 246 86 254 86 266V346Z" fill="#12141b" stroke="#2c313d" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M82 340V264C82 250 85 242 90 238L150 248L212 238C218 242 222 250 222 264V340" fill="none" stroke="#252a35" stroke-width="3"/>' +
          '<path d="M150 182Q144 206 148 232M110 204Q96 226 92 236" fill="none" stroke="#1c2029" stroke-width="2.4"/>' +
          '<path d="M220 214C242 240 244 290 240 346" fill="none" stroke="#454d5e" stroke-width="2"/></g>',
      },
      // A stone block for a seat: a capstone over coursed masonry.
      seatArt:
        `<rect x="100" y="348" width="102" height="12" rx="2" fill="#252a33" stroke="${STONE_EDGE}" stroke-width="1.5"/>` +
        '<rect x="106" y="360" width="90" height="96" fill="#171a21"/>' +
        '<path d="M106 384H196M106 410H196M106 434H196M140 360V384M172 384V410M128 410V434M160 434V456" stroke="#262b35" stroke-width="2"/>',
      // The desk is the parapet: a wet coping slab over a gothic arcade, with a small gargoyle at its end.
      tableArt:
        `<rect x="162" y="330" width="310" height="15" rx="2" fill="#23272f" stroke="${STONE_EDGE}" stroke-width="1.5"/>` +
        `<path d="M166 332H468" stroke="${WET}" stroke-opacity=".7" stroke-width="1.5"/>` +
        `<rect x="176" y="345" width="18" height="111" fill="${STONE}"/>` +
        `<path d="M236 345H460V456H236Z${[246, 288, 330, 372, 414].map(a => `M${a} 456V386Q${a} 364 ${a + 14} 354Q${a + 28} 364 ${a + 28} 386V456Z`).join('')}" fill="${STONE}" fill-rule="evenodd"/>` +
        `<path d="M236 345V456M460 345V456" stroke="${STONE_EDGE}" stroke-width="1.5"/>` +
        `<g transform="translate(450 330) scale(-.34 .34)"><path d="${GARGOYLE}" fill="#20242c" stroke="${STONE_EDGE}" stroke-width="3" stroke-linejoin="round"/></g>`,
    },
    style:
      // Ambient: rain, fog and clouds drift, steam rises, the gargoyle spouts, puddles ring, the cape flaps.
      '.nv-cl{animation:nv-drift 60s ease-in-out infinite alternate}@keyframes nv-drift{to{transform:translateX(-60px)}}' +
      '.nv-fog{animation:nv-fog 40s ease-in-out infinite alternate}@keyframes nv-fog{to{transform:translateX(-140px)}}' +
      '.nv-st{opacity:0;transform-box:fill-box;transform-origin:center;animation:nv-st 6s ease-out infinite}' +
      '@keyframes nv-st{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.55}100%{opacity:0;transform:translate(var(--sx),-220px) scale(2.4)}}' +
      '.st-tool .nv-st{animation-duration:2.2s}' +
      '.nv-sp{stroke-dasharray:7 11;animation:nv-drip .7s linear infinite}@keyframes nv-drip{to{stroke-dashoffset:-18}}' +
      '.nv-rp{opacity:0;transform-box:fill-box;transform-origin:center;animation:nv-rp 2.4s ease-out infinite}' +
      '@keyframes nv-rp{0%{opacity:.5;transform:scale(.2)}100%{opacity:0;transform:scale(1.3)}}' +
      '.nv-cape{transform-box:fill-box;transform-origin:50% 0;animation:nv-cape 3.4s ease-in-out infinite alternate}' +
      '@keyframes nv-cape{from{transform:skewX(-2deg)}to{transform:skewX(3deg) scaleX(1.03)}}' +
      '.nv-bc{animation:nv-bc 2.6s ease-in-out infinite}@keyframes nv-bc{0%,60%,100%{opacity:.2}75%{opacity:1}}' +
      '.nv-wn{opacity:.16}' +
      '.nv-blip{transform-box:fill-box;transform-origin:center;animation:nv-blip 1.1s ease-out infinite}' +
      '@keyframes nv-blip{from{transform:scale(.6);opacity:1}to{transform:scale(1.8);opacity:0}}' +
      // The emblem breathes softly on the clouds.
      '.nv-sig{animation:nv-sig 6s ease-in-out infinite alternate}@keyframes nv-sig{from{opacity:.8}to{opacity:1}}' +
      '.nv-bl,.nv-emb,.nv-moon,.nv-rh,.nv-dk,.nv-lt,.nv-ring,.nv-gr,.nv-hk,.nv-gs{opacity:0}' +
      '@keyframes nv-in{to{opacity:1}}' +
      // Thinking: far lightning lights the clouds softly, one glow at a time, two seconds apart.
      '.st-thinking .nv-lt{animation:nv-lt 4s ease-in-out infinite}.st-thinking .nv-lt2{animation-delay:-2s}' +
      '@keyframes nv-lt{0%{opacity:0}6%{opacity:1}24%{opacity:.25}34%,100%{opacity:0}}' +
      // Responding: the beam drifts. Tool: the vents gush. Read: the city lights up block by block. Web: the mast calls.
      '.st-responding .nv-sw{animation:nv-sway 6s ease-in-out infinite alternate}@keyframes nv-sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}' +
      '.st-read .nv-wn{animation:nv-wn 1.2s ease-out both;animation-delay:var(--d)}@keyframes nv-wn{to{opacity:.6}}' +
      '.st-web .nv-ring{transform-box:fill-box;transform-origin:center;animation:nv-ring 1.8s ease-out infinite}' +
      '@keyframes nv-ring{0%{opacity:0;transform:scale(.3)}20%{opacity:.8}100%{opacity:0;transform:scale(2.6)}}' +
      '.st-web .nv-bc{animation-duration:1.2s}' +
      // Run: the beam sweeps the sky and comes back, the emblem flares, then it keeps scanning; the grapple shoots.
      '.st-run .nv-sw{animation:nv-sweep 2s ease-in-out both,nv-scan 7s ease-in-out 3.4s infinite}' +
      '@keyframes nv-sweep{0%{transform:rotate(0)}32%{transform:rotate(-17deg)}72%{transform:rotate(9deg)}100%{transform:rotate(0)}}' +
      '@keyframes nv-scan{0%,100%{transform:rotate(0)}30%{transform:rotate(-9deg)}70%{transform:rotate(6deg)}}' +
      '.st-run .nv-sig,.st-done .nv-sig{animation:none;opacity:1}' +
      '.st-run .nv-fl{animation:nv-flare 1.6s ease-out 1.9s both}@keyframes nv-flare{0%{transform:scale(1)}30%{transform:scale(1.22)}100%{transform:scale(1.1)}}' +
      '.st-run .nv-bl{animation:nv-bloom 1.6s ease-out 1.9s both}@keyframes nv-bloom{0%{opacity:0}30%{opacity:1}100%{opacity:.55}}' +
      '.nv-gr{stroke-dasharray:1 1;stroke-dashoffset:1}' +
      '.st-run .nv-gr{animation:nv-shoot .7s cubic-bezier(.2,.7,.3,1) .35s both}@keyframes nv-shoot{from{opacity:1;stroke-dashoffset:1}to{opacity:1;stroke-dashoffset:0}}' +
      '.st-run .nv-hk{animation:nv-hook .7s cubic-bezier(.2,.7,.3,1) .35s both}@keyframes nv-hook{from{opacity:1;transform:translate(0,0)}to{opacity:1;transform:translate(var(--gx),var(--gy))}}' +
      '.nv-gs{transform-box:fill-box;transform-origin:center}' +
      '.st-run .nv-gs{animation:nv-gs .7s ease-out 1.05s both}@keyframes nv-gs{0%{opacity:0;transform:scale(.3)}30%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.7)}}' +
      // Error: the lamp sputters out, three dying flickers 0.6 s apart, the lens goes to an ember; the rain gets heavier.
      '.st-error .nv-lit{animation:nv-sput 2.4s ease-in-out both}' +
      '@keyframes nv-sput{0%{opacity:1}9%{opacity:.25}17%{opacity:.85}31%{opacity:.12}42%{opacity:.6}57%{opacity:.06}67%{opacity:.35}82%,100%{opacity:0}}' +
      '.st-error .nv-lens{animation:nv-dim 2.4s ease-in-out both}@keyframes nv-dim{to{opacity:.12}}' +
      '.st-error .nv-emb{animation:nv-in 1s ease-out 1.6s both}' +
      '.st-error .nv-rh{animation:nv-in .6s ease-out both}.st-error .nv-dk{animation:nv-in 1.4s ease-out both}' +
      // Done: the emblem holds bright and steady, the clouds part on a full moon, the rain eases.
      '.st-done .nv-fl{animation:nv-hold 1.4s ease-out both}@keyframes nv-hold{to{transform:scale(1.1)}}' +
      '.st-done .nv-bl{animation:nv-half 1.4s ease-out both}@keyframes nv-half{to{opacity:.6}}' +
      '.st-done .nv-moon{animation:nv-in 2.4s ease-out .4s both}' +
      '.st-done .nv-pl{animation:nv-pl 3s cubic-bezier(.3,.6,.3,1) both}@keyframes nv-pl{to{transform:translate(-280px,-30px);opacity:.55}}' +
      '.st-done .nv-pr{animation:nv-pr 3s cubic-bezier(.3,.6,.3,1) both}@keyframes nv-pr{to{transform:translate(260px,-40px);opacity:.55}}' +
      '.st-done .nv-rain{animation:nv-ease 2.4s ease-out both}@keyframes nv-ease{to{opacity:.35}}' +
      // Asleep: the lamp burns low.
      '.st-sleeping .nv-sig{animation:none;opacity:.55}',
    scenery:
      '<defs>' +
      '<linearGradient id="nv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06070b"/><stop offset=".42" stop-color="#0b0d14"/><stop offset=".68" stop-color="#161822"/><stop offset="1" stop-color="#0b0c11"/></linearGradient>' +
      '<radialGradient id="nv-ov"><stop offset="0" stop-color="#fff2e8" stop-opacity=".72"/><stop offset=".6" stop-color="#ffd8c6" stop-opacity=".6"/><stop offset=".88" stop-color="#ffab8c" stop-opacity=".5"/><stop offset=".97" stop-color="#ff7a59" stop-opacity=".26"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nv-hal"><stop offset=".6" stop-color="#ff9a78" stop-opacity=".2"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nv-blg"><stop offset="0" stop-color="#ffd8c6" stop-opacity=".3"/><stop offset=".5" stop-color="#ff9a78" stop-opacity=".14"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nv-bm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe4d6" stop-opacity=".26"/><stop offset=".45" stop-color="#ffe4d6" stop-opacity=".08"/><stop offset=".85" stop-color="#ffe4d6" stop-opacity=".1"/><stop offset="1" stop-color="#ffd2bf" stop-opacity=".2"/></linearGradient>' +
      '<radialGradient id="nv-ltg"><stop offset="0" stop-color="#b8c6ff" stop-opacity=".3"/><stop offset=".5" stop-color="#8a9ce0" stop-opacity=".12"/><stop offset="1" stop-color="#8a9ce0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nv-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1f2b" stop-opacity="0"/><stop offset=".55" stop-color="#1a1f2b" stop-opacity=".55"/><stop offset="1" stop-color="#1a1f2b" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="nv-fp"><stop offset="0" stop-color="#202633" stop-opacity="0"/><stop offset=".1" stop-color="#202633" stop-opacity=".4"/><stop offset="1" stop-color="#202633" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nv-mh"><stop offset=".3" stop-color="#e8e4d8" stop-opacity=".28"/><stop offset="1" stop-color="#e8e4d8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nv-stm"><stop offset="0" stop-color="#c8d0dc" stop-opacity=".3"/><stop offset="1" stop-color="#c8d0dc" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="nv-lg"><stop offset="0" stop-color="#ffe6da" stop-opacity=".5"/><stop offset=".4" stop-color="#ff9a78" stop-opacity=".16"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="nv-lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a6a" stop-opacity=".22"/><stop offset="1" stop-color="#ff9a6a" stop-opacity=".04"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#nv-sky)"/>' +
      // The moon, behind the clouds until done.
      '<g class="mv-r"><g class="mv-t"><g class="nv-moon"><circle cx="1460" cy="150" r="170" fill="url(#nv-mh)"/>' +
      '<circle cx="1460" cy="150" r="56" fill="#efe9da" fill-opacity=".8"/>' +
      '<g fill="#cfc8b6" fill-opacity=".5"><circle cx="1442" cy="136" r="11"/><circle cx="1474" cy="166" r="8"/><circle cx="1470" cy="128" r="5"/></g></g></g></g>' +
      // The far city in the fog, the fog band, the mid city with its windows.
      `<path d="${far.d}" fill="#131722"/>` +
      '<path d="M462 760V330H504V760Z M528 760V330H570V760Z M500 760V420H532V760Z M462 331L483 200L504 331Z M528 331L549 200L570 331Z M500 421L516 360L532 421Z' +
      'M880 760V300H990V760Z M892 301V250H978V301Z M906 251V206H964V251Z M920 207V176H950V207Z M932 177L935 96L938 177Z" fill="#12151f"/>' +
      `<g class="nv-fog"><rect x="-200" y="500" width="2100" height="300" fill="url(#nv-fg)"/>${puffs}</g>` +
      '<path d="M606 820V470H690V820Z M612 471L648 290L684 471Z M598 470L606 430L614 470Z M682 470L690 430L698 470Z' +
      'M364 820V420H412V820Z M368 421L388 296L408 421Z" fill="#0d1017"/>' +
      `<path d="${mid.d}" fill="#0b0d13"/>` +
      windowGroups +
      // The cloud deck: drifting, darkening on an error, lit by lightning while thinking.
      `<g class="nv-cl">${cloud(-120, 1240, 14, -10, 200, 91)}</g>` +
      '<g class="nv-lt"><ellipse cx="160" cy="70" rx="270" ry="150" fill="url(#nv-ltg)"/>' +
      '<path d="M120 10l-10 34l12 4l-14 42" fill="none" stroke="#dfe6ff" stroke-opacity=".5" stroke-width="2" stroke-linejoin="round"/></g>' +
      '<g class="mv-r"><g class="mv-t">' +
      `<g class="nv-pl">${rightClouds(93, 1240, 1440)}</g><g class="nv-pr">${rightClouds(97, 1470, 1680)}</g>` +
      '<g class="nv-lt nv-lt2"><ellipse cx="1440" cy="80" rx="250" ry="140" fill="url(#nv-ltg)"/>' +
      '<path d="M1490 16l-12 30l12 4l-12 40" fill="none" stroke="#dfe6ff" stroke-opacity=".5" stroke-width="2" stroke-linejoin="round"/></g>' +
      deco +
      '</g></g>' +
      '<rect class="nv-dk" width="1600" height="320" fill="#040509" fill-opacity=".45"/>' +
      // The beam and the emblem, behind the near tower.
      beam +
      tower +
      // The grapple line, its hook, and the spark where it bites.
      `<path class="nv-gr" pathLength="1" d="M${G0[0]} ${G0[1]}L${G1[0]} ${G1[1]}" fill="none" stroke="#b7c2d4" stroke-opacity=".6" stroke-width="2"/>` +
      `<g transform="translate(${G0[0]} ${G0[1]})"><g class="nv-hk" style="--gx:${G1[0] - G0[0]}px;--gy:${G1[1] - G0[1]}px"><g transform="rotate(${f(gAngle)})">` +
      '<path d="M-10 0H2M2 0L8 -6M2 0L8 6M2 0H10" fill="none" stroke="#dfe6f2" stroke-width="2.4" stroke-linecap="round"/></g></g></g>' +
      `<g transform="translate(${G1[0]} ${G1[1]})"><path class="nv-gs" d="M0 -12L3 -3L12 0L3 3L0 12L-3 3L-12 0L-3 -3Z" fill="#ffe6da"/></g>` +
      // The roof: the parapet edge, the wet surface, puddles, a vent with steam, the searchlight.
      '<g class="mv-b">' +
      '<rect x="-20" y="884" width="1640" height="18" fill="#0f1218" stroke="#222733" stroke-width="2"/>' +
      `<path d="M-20 885H1620" stroke="${WET}" stroke-opacity=".45" stroke-width="1.5"/>` +
      '<rect x="-20" y="902" width="1640" height="200" fill="#07080c"/>' +
      '<ellipse cx="300" cy="958" rx="130" ry="14" fill="#ff9a78" fill-opacity=".07"/><ellipse cx="760" cy="980" rx="110" ry="10" fill="#9fb0c4" fill-opacity=".05"/>' +
      ripples +
      '<rect x="56" y="836" width="22" height="70" fill="#14171d" stroke="#2a303b" stroke-width="2"/><rect x="48" y="826" width="38" height="12" rx="3" fill="#1a1e26" stroke="#2e3440" stroke-width="2"/>' +
      steam(67, 816, 5, 40, 61) +
      '</g>' +
      lamp +
      `<g class="nv-rain">${rain({ seed: 21, count: 44, length: [24, 46], slant: 160, seconds: 0.8, stroke: '#9fb0c4', opacity: 0.16 })}` +
      `${rain({ seed: 22, count: 22, length: [44, 76], slant: 190, seconds: 0.55, stroke: '#c6d2e0', opacity: 0.12 })}</g>` +
      `<g class="nv-rh">${rain({ seed: 23, count: 46, length: [60, 110], slant: 360, seconds: 0.4, stroke: '#c4d2e0', opacity: 0.28 })}</g>`,
    nook:
      '<defs><radialGradient id="nv-stn"><stop offset="0" stop-color="#c8d0dc" stop-opacity=".28"/><stop offset="1" stop-color="#c8d0dc" stop-opacity="0"/></radialGradient></defs>' +
      // The next roof over, with its water tower on stilts.
      '<path d="M252 1V456H440V1Z" fill="#090b10"/><rect x="246" y="-8" width="200" height="12" fill="#11141b" stroke="#232834" stroke-width="2"/>' +
      '<g fill="#ffc9a0" fill-opacity=".14"><rect x="276" y="40" width="10" height="16"/><rect x="396" y="40" width="10" height="16"/><rect x="336" y="96" width="10" height="16"/></g>' +
      '<g stroke="#10131a" stroke-width="7"><path d="M276 -8L284 -84M400 -8L392 -84M318 -8V-84M358 -8V-84"/></g>' +
      '<path d="M282 -20L392 -70M394 -20L284 -70M280 -46H396" stroke="#10131a" stroke-width="3"/>' +
      '<path d="M266 -90V-200Q338 -212 410 -200V-90Q338 -76 266 -90Z" fill="#0e1118" stroke="#262b37" stroke-width="2"/>' +
      '<path d="M286 -204V-84M308 -208V-80M330 -209V-79M352 -209V-79M374 -208V-80M394 -205V-84" stroke="#141821" stroke-width="2"/>' +
      '<path d="M266 -116Q338 -102 410 -116M266 -146Q338 -132 410 -146M266 -176Q338 -162 410 -176" fill="none" stroke="#272c38" stroke-width="2.5"/>' +
      '<path d="M256 -199L338 -250L420 -199Q338 -213 256 -199Z" fill="#0b0d12" stroke="#2b303c" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M338 -244V-256" stroke="#0b0d12" stroke-width="4"/>' +
      '<path d="M404 -206V-84" stroke="#3a4152" stroke-opacity=".6" stroke-width="2"/>' +
      '<path d="M252 -8L262 -96M262 -8L272 -96M253 -24H263M255 -44H265M257 -64H267M259 -84H269" stroke="#1a1e27" stroke-width="2"/>' +
      // A vent on Claude's roof, breathing steam.
      '<rect x="-62" y="380" width="24" height="76" fill="#14171d" stroke="#2a303b" stroke-width="2"/><path d="M-72 380H-28L-34 368H-66Z" fill="#1a1e26" stroke="#2e3440" stroke-width="2"/>' +
      Array.from({ length: 5 }, (_, i) => `<ellipse class="nv-st" cx="-50" cy="360" rx="${18 + (i % 3) * 5}" ry="${12 + (i % 2) * 4}" fill="url(#nv-stn)" style="--sx:${-30 - i * 8}px;animation-delay:${f(-i * 1.2)}s"/>`).join(''),
    front: rain({ seed: 24, count: 16, length: [22, 40], slant: 160, seconds: 0.8, stroke: '#9fb0c4', opacity: 0.14, box: [-60, -300, 520, 760] }),
  }
}
