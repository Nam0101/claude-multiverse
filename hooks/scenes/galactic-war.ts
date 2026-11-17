import { f, random } from './kit'
import { U, X0, Y0 } from './rig'
import type { World } from './world'

// Galactic War: a tactical officer on a warship bridge. A huge viewport over a fleet battle; the console's
// holo screen and the officer's visor are the only warm-blue light in the corner.
const EN = '#ff4d5e'
const FR = '#5ff5ff'
const AC = '#4da3ff'

const ENEMY: readonly [number, number, number][] = [
  [300, 150, 1.5],
  [650, 66, 0.75],
  [1010, 96, 0.65],
]
const FRIEND: readonly [number, number, number][] = [
  [210, 640, 1.5],
  [360, 830, 0.85],
  [120, 500, 0.7],
]
// The enemy capital ship our volley hits, in the desk's own box.
const TARGET = { x: 205, y: -235, s: 1.05 }

function windows(): string {
  return [-96, -66, -36, -6, 24].map(x => `M${x} -3h7v3h-7z`).join('')
}

function friendHull(): string {
  return (
    `<ellipse cx="-138" cy="0" rx="34" ry="16" fill="url(#ng-gc)"/>` +
    '<path d="M-70 -24 L-40 -62 L-6 -28Z M-70 24 L-40 62 L-6 28Z" fill="#0d1424" stroke="#26365a" stroke-width="2"/>' +
    '<path d="M-130 -8 L-100 -24 L-30 -28 L50 -16 L140 0 L50 16 L-30 28 L-100 24 L-130 8Z" fill="#111a2c" stroke="#2a3b60" stroke-width="2"/>' +
    '<path d="M-22 -28 L-8 -46 L30 -46 L44 -18Z" fill="#16213a" stroke="#2a3b60" stroke-width="2"/>' +
    `<path d="M-118 -4 H110 M-118 4 H60" stroke="${FR}" stroke-opacity=".5" stroke-width="2" fill="none"/>` +
    `<path d="${windows()}" fill="${FR}" fill-opacity=".75"/><circle cx="-2" cy="-40" r="3" fill="${FR}"/>`
  )
}

function enemyHull(): string {
  return (
    `<ellipse cx="-138" cy="0" rx="30" ry="18" fill="url(#ng-gr)"/>` +
    '<path d="M-120 -12 L-80 -34 L-30 -24 L20 -58 L46 -26 L150 -10 L118 0 L150 10 L46 26 L20 58 L-30 24 L-80 34 L-120 12Z" fill="#150f1a" stroke="#4a2a3c" stroke-width="2"/>' +
    '<path d="M-60 -8 H100 M-60 8 H100" stroke="#ff4d5e" stroke-opacity=".45" stroke-width="2" fill="none"/>' +
    `<path d="M-100 -2h7v3h-7zM-70 -2h7v3h-7zM-40 -2h7v3h-7z" fill="${EN}" fill-opacity=".8"/>` +
    `<circle cx="20" cy="-44" r="3" fill="${EN}"/><circle cx="20" cy="44" r="3" fill="${EN}"/>`
  )
}

/** Targeting reticle at a point; the dashed ring turns, the brackets close in. */
function reticle(x: number, y: number, k: number, delay: number): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><g class="ng-ret" style="--rd:${f(delay)}s">` +
    `<circle class="ng-retc" r="34" fill="none" stroke="${EN}" stroke-width="2" stroke-dasharray="14 8"/>` +
    `<path d="M-46 -20V-46H-20M20 -46H46V-20M46 20V46H20M-20 46H-46V20M-9 0H9M0 -9V9" fill="none" stroke="${EN}" stroke-width="2.4"/></g></g>`
  )
}

function blip(x: number, y: number, k: number, delay: number): string {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><circle class="ng-blip" r="14" fill="none" stroke="${EN}" stroke-width="2" style="animation-delay:${f(delay)}s"/></g>`
}

function drifting(next: () => number, inner: string): string {
  return (
    `<g class="ng-drift" style="--dx:${f((next() - 0.3) * 40)}px;--dy:${f((next() - 0.5) * 22)}px;` +
    `animation-duration:${f(32 + next() * 24)}s;animation-delay:${f(-next() * 30)}s">${inner}</g>`
  )
}

function bolt(sx: number, sy: number, tx: number, ty: number, color: string, next: () => number): string {
  const angle = (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI
  const dist = Math.hypot(tx - sx, ty - sy)

  return (
    `<g transform="translate(${f(sx)} ${f(sy)}) rotate(${f(angle)})"><g class="ng-bolt" style="--bx:${f(dist * (0.3 + next() * 0.25))}px;` +
    `animation-duration:${f(6 + next() * 4)}s;animation-delay:${f(-next() * 9)}s">` +
    `<rect x="-9" y="-3" width="34" height="6" rx="3" fill="${color}" fill-opacity=".22"/>` +
    `<rect x="0" y="-1.2" width="22" height="2.4" rx="1.2" fill="${color}"/></g></g>`
  )
}

function fighter(next: () => number, index: number): string {
  const friendly = index % 2 === 0
  const color = friendly ? FR : EN
  const short = index % 3 !== 2
  const y = short ? 330 + next() * 560 : 80 + next() * 170
  const leftward = !short && index % 2 === 1
  const travel = short ? 620 + next() * 300 : 1750
  const startX = leftward ? 1660 : -60
  const angle = leftward ? 180 + (next() - 0.5) * 8 : (next() - 0.5) * 10

  return (
    `<g transform="translate(${startX} ${f(y)}) rotate(${f(angle)})"><g class="ng-zip" style="--zx:${f(travel)}px;` +
    `animation-duration:${f(short ? 9 + next() * 5 : 13 + next() * 6)}s;animation-delay:${f(-next() * 12)}s">` +
    `<path d="M10 0L-9 -6L-4 0L-9 6Z" fill="${color}" fill-opacity=".9"/>` +
    `<line x1="-8" y1="0" x2="-34" y2="0" stroke="${color}" stroke-opacity=".45" stroke-width="2"/></g></g>`
  )
}

function starMap(): string {
  const tile = (shift: number) => {
    const next = random(77)
    const grid = [0, 30, 60, 90, 120, 150].map(y => `M0 ${y}H330`).join('') + [0, 55, 110, 165, 220, 275, 330].map(x => `M${x} 0V180`).join('')
    const nodes = Array.from({ length: 8 }, () => [20 + next() * 290, 8 + next() * 164] as const)
    const route = nodes.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`).join('')
    const dots = nodes.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 3 === 0 ? 4 : 2.5}" fill="${i % 3 === 0 ? FR : '#9fe0ff'}"/>`).join('')

    return (
      `<g transform="translate(0 ${shift})"><path d="${grid}" stroke="${AC}" stroke-opacity=".22" fill="none"/>` +
      `<path d="${route}" stroke="${FR}" stroke-opacity=".5" stroke-dasharray="5 4" fill="none"/>${dots}</g>`
    )
  }

  return (
    '<g class="ng-map"><clipPath id="ng-mapc"><rect x="60" y="262" width="330" height="180"/></clipPath>' +
    `<rect x="60" y="262" width="330" height="180" fill="${AC}" fill-opacity=".07" stroke="${AC}" stroke-opacity=".55" stroke-width="2"/>` +
    `<g clip-path="url(#ng-mapc)"><g transform="translate(60 262)"><g class="ng-scr">${tile(0)}${tile(180)}</g></g></g></g>`
  )
}

function warp(): string {
  const next = random(5)

  return Array.from({ length: 34 }, () => {
    const angle = next() * 360
    const from = 24 + next() * 280
    const len = 50 + next() * 90

    return (
      `<g transform="translate(700 420) rotate(${f(angle)})"><line class="ng-warp" x1="${f(from)}" y1="0" x2="${f(from + len)}" y2="0" ` +
      `stroke="${next() > 0.5 ? '#9fe0ff' : FR}" stroke-width="${f(1 + next() * 1.6)}" stroke-linecap="round" ` +
      `style="--wx:${f(500 + next() * 500)}px;animation-delay:${f(-next() * 1.8)}s"/></g>`
    )
  }).join('')
}

export function galacticWarWorld(): World {
  const next = random(2077)
  const stars: string[] = []

  for (let index = 0; index < 55; index += 1) {
    const tw = index % 7 === 0 ? ` class="ng-tw" style="animation-delay:${f(-next() * 4)}s"` : ''

    stars.push(
      `<circle cx="${f(next() * 1600)}" cy="${f(next() * 920)}" r="${f(0.6 + next() * 1.4)}" fill="${next() > 0.8 ? '#9fe0ff' : '#dbe6ff'}" fill-opacity="${f(0.25 + next() * 0.55)}"${tw}/>`,
    )
  }

  const bolts: string[] = []

  for (let index = 0; index < 12; index += 1) {
    const enemyShoots = index % 2 === 0
    const e = ENEMY[index % 3] ?? ENEMY[0]!
    const fr = FRIEND[(index + 1) % 3] ?? FRIEND[0]!

    bolts.push(
      enemyShoots
        ? bolt(e[0] - 40 + next() * 60, e[1] + 20 + next() * 30, fr[0] + (next() - 0.5) * 120, fr[1] + (next() - 0.5) * 60, EN, next)
        : bolt(fr[0] + 60 + next() * 40, fr[1] - 20 - next() * 30, e[0] + (next() - 0.5) * 120, e[1] + (next() - 0.5) * 50, FR, next),
    )
  }

  const fighters = Array.from({ length: 9 }, (_, index) => fighter(next, index)).join('')
  const booms = [
    [250, 190, EN],
    [520, 120, EN],
    [140, 600, FR],
    [330, 760, FR],
    [880, 110, EN],
    [420, 520, EN],
    [60, 430, FR],
    [1250, 90, EN],
  ]
    .map(([x, y, c], index) => `<circle class="ng-boom" cx="${x}" cy="${y}" r="26" fill="url(#ng-bloom)" style="animation-delay:${f(-index * 0.9)}s;animation-duration:${f(5.5 + (index % 3))}s"/><circle class="ng-boom" cx="${x}" cy="${y}" r="5" fill="${c}" style="animation-delay:${f(-index * 0.9)}s;animation-duration:${f(5.5 + (index % 3))}s"/>`)
    .join('')

  const enemies = ENEMY.map(([x, y, s], index) =>
    drifting(
      next,
      `<g transform="translate(${x} ${y}) scale(${f(-s)} ${s})">${enemyHull()}</g>` + reticle(x, y, s * 1.1, index * 0.2) + blip(x, y, s * 1.2, index * 0.35),
    ),
  ).join('')
  const friends = FRIEND.map(([x, y, s]) => drifting(next, `<g transform="translate(${x} ${y}) scale(${f(s)} ${s})">${friendHull()}</g>`)).join('')

  const lamp = (x: number, y: number, length: number, delay: number) =>
    `<g transform="translate(${x} ${y})"><g class="ng-lamp" style="animation-delay:${delay}s">` +
    `<path d="M0 0L${length} ${-length * 0.22}L${length} ${length * 0.22}Z" fill="url(#ng-lr)"/>` +
    `<path d="M0 0L${-length} ${-length * 0.22}L${-length} ${length * 0.22}Z" fill="url(#ng-ll)"/></g>` +
    `<circle r="8" fill="${EN}" class="ng-lampb"/></g>`

  const skyLights = Array.from({ length: 16 }, (_, index) => `<circle cx="${60 + index * 100}" cy="${index % 2 === 0 ? 30 : 34}" r="2" fill="${AC}" fill-opacity=".45"/>`).join('')
  const deckLights = Array.from({ length: 11 }, (_, index) => `<rect x="${40 + index * 105}" y="946" width="30" height="3" fill="${AC}" fill-opacity="${index % 3 === 0 ? 0.4 : 0.16}"/>`).join('')

  // Desk-box art.
  const wallSeams = [60, 200, 330].map(x => `<line x1="${x}" y1="${x < 100 ? 74 : x < 250 ? 56 : 40}" x2="${x}" y2="460"/>`).join('')
  const leds = [232, 252, 272, 292, 312, 332, 352]
    .map((x, index) => `<rect class="ng-led" x="${x}" y="350" width="10" height="3" fill="${index % 3 === 2 ? EN : FR}" style="animation-delay:${f(-index * 0.7)}s"/>`)
    .join('')
  const keys = [250, 262, 274, 286, 298, 310, 322].map(x => `<rect x="${x}" y="320" width="8" height="4" fill="LIGHT" fill-opacity=".45"/>`).join('')
  const spokes = [0, 1, 2, 3, 4].map(index => `<rect class="ng-spk" x="${f(296 + index * 20)}" y="${f(296 - (index % 2) * 6)}" width="3" height="3" fill="#ffe2b0" style="--dx:${f((index - 2) * 16)}px;--dy:${f(-30 - index * 9)}px;animation-delay:${f(-index * 0.27)}s"/>`).join('')
  const eq = Array.from({ length: 7 }, (_, index) => `<rect class="ng-eqb" x="${24 + index * 11}" y="146" width="6" height="34" fill="${FR}" fill-opacity=".8" style="animation-delay:${f(-index * 0.13)}s;animation-duration:${f(0.4 + (index % 3) * 0.12)}s"/>`).join('')

  const mer = [0, 1, 2].map(index => `<ellipse class="ng-mer" rx="44" ry="44" fill="none" style="animation-delay:${f(-index * 2.33)}s"/>`).join('')
  const holo =
    '<g class="ng-holo">' +
    `<polygon points="318,216 342,216 362,176 298,176" fill="${AC}" fill-opacity=".12"/>` +
    `<g transform="translate(330 134)" fill="none" stroke="${FR}" stroke-opacity=".75" stroke-width="1.6">` +
    `<circle r="44"/><ellipse rx="44" ry="13"/><ellipse rx="44" ry="13" transform="rotate(-24)" stroke-opacity=".5"/>${mer}` +
    `<path class="ng-mer" d="M0 -22L16 0L0 22L-16 0Z" stroke="#ffffff" stroke-opacity=".8" style="animation-duration:4s"/>` +
    `<rect x="-30" y="-14" width="4" height="4" fill="${EN}" stroke="none"/><rect x="22" y="10" width="4" height="4" fill="${FR}" stroke="none"/><rect x="6" y="-30" width="4" height="4" fill="${EN}" stroke="none"/></g></g>`

  const nook =
    // Our target: an enemy capital ship above the bridge wall.
    drifting(
      next,
      `<g class="ng-hit"><g transform="translate(${TARGET.x} ${TARGET.y}) scale(${f(-TARGET.s)} ${TARGET.s})">${enemyHull()}</g></g>` +
        reticle(TARGET.x, TARGET.y, 1.25, 0.3) + blip(TARGET.x, TARGET.y, 1.4, 0.5),
    ) +
    [
      [284, -12, 222, -228, 0],
      [338, -22, 236, -240, 0.28],
      [284, -12, 196, -222, 0.56],
    ]
      .map(
        ([x1, y1, x2, y2, delay]) =>
          `<path class="ng-beam" pathLength="1" d="M${x1} ${y1}L${x2} ${y2}" stroke="${FR}" stroke-opacity=".45" stroke-width="12" fill="none" style="animation-delay:${delay}s"/>` +
          `<path class="ng-beam" pathLength="1" d="M${x1} ${y1}L${x2} ${y2}" stroke="#e8ffff" stroke-width="4" fill="none" style="animation-delay:${delay}s"/>`,
      )
      .join('') +
    `<circle class="ng-imp" cx="214" cy="-228" r="56" fill="url(#ng-bloom)"/>` +
    // The bridge wall, with two turrets.
    '<path d="M-40 74L210 56L430 30V470H-40Z" fill="#0b1324" stroke="#1a2a48" stroke-width="2"/>' +
    `<g stroke="#14203a" stroke-width="2">${wallSeams}</g>` +
    `<path d="M-40 74L210 56L430 30" fill="none" stroke="${AC}" stroke-opacity=".35" stroke-width="2"/>` +
    '<g stroke="#1b2740" stroke-width="9" stroke-linecap="round"><line x1="300" y1="30" x2="284" y2="-12"/><line x1="352" y1="22" x2="338" y2="-22"/></g>' +
    '<path d="M280 56L290 28L314 26L324 52ZM332 46L342 20L366 18L374 40Z" fill="#141d30" stroke="#2a3b60" stroke-width="2"/>' +
    lamp(46, 100, 150, 0) +
    `<ellipse class="ng-ring" cx="340" cy="262" rx="420" ry="420" fill="none" stroke="${FR}" stroke-width="2.5"/>` +
    `<ellipse class="ng-ring" cx="340" cy="262" rx="420" ry="420" fill="none" stroke="${FR}" stroke-width="2.5" style="animation-delay:.8s"/>` +
    `<ellipse class="ng-ring" cx="340" cy="262" rx="420" ry="420" fill="none" stroke="${AC}" stroke-width="2.5" style="animation-delay:1.6s"/>`

  const front = holo + `<g class="ng-eq">${eq}</g>` + spokes

  // The officer's helmet: a shell above the eyes, a translucent visor over them, an ear cup and a comms mic.
  const left = X0 + 1.5 * U
  const right = X0 + 12.5 * U
  const mic = `M${X0 + 12 * U} ${Y0 + 3.2 * U}Q${X0 + 13.4 * U} ${Y0 + 3.6 * U} ${X0 + 13 * U} ${Y0 + 5.1 * U}`
  const wearFront =
    `<path d="M${left} ${Y0 + 0.8 * U}V${Y0 - 0.6 * U}Q${left} ${Y0 - 2.6 * U} ${X0 + 7 * U} ${Y0 - 2.6 * U}Q${right} ${Y0 - 2.6 * U} ${right} ${Y0 - 0.6 * U}V${Y0 + 0.8 * U}Z" fill="#222c40" stroke="${AC}" stroke-opacity=".5" stroke-width="3"/>` +
    `<path d="M${X0 + 7 * U} ${Y0 - 2.5 * U}V${Y0 + 0.6 * U}" stroke="${AC}" stroke-opacity=".6" stroke-width="4"/>` +
    `<rect x="${X0 + 2.4 * U}" y="${Y0 + 0.75 * U}" width="${9.2 * U}" height="${4.5 * U}" rx="14" fill="${AC}" fill-opacity=".2" stroke="#9fe0ff" stroke-opacity=".55" stroke-width="3"/>` +
    `<path d="M${X0 + 3.4 * U} ${Y0 + 1.5 * U}L${X0 + 5 * U} ${Y0 + 1.5 * U}L${X0 + 4 * U} ${Y0 + 4.2 * U}H${X0 + 3.4 * U}Z" fill="#ffffff" fill-opacity=".14"/>` +
    `<rect x="${right - 8}" y="${Y0 + 1.6 * U}" width="14" height="${2.4 * U}" rx="4" fill="#222c40" stroke="${AC}" stroke-opacity=".5" stroke-width="2"/>` +
    `<path d="${mic}" fill="none" stroke="#222c40" stroke-width="4"/><circle cx="${X0 + 13 * U}" cy="${Y0 + 5.1 * U}" r="5" fill="${FR}"/>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'holo',
      cup: 'none',
      thought: 'bits',
      ink: '#03050a',
      furniture: '#141b2b',
      metal: '#222c40',
      paper: '#dbe6ff',
      light: { idle: '#3b6fb0', work: AC, bright: '#9fe0ff' },
      wear: { front: wearFront },
      headTop: Y0 - 2.6 * U,
      glowAt: [340, 262],
      seatArt:
        '<g fill="#141b2b"><rect x="92" y="166" width="40" height="190" rx="13"/><rect x="108" y="350" width="88" height="12" rx="6"/>' +
        '<rect x="142" y="362" width="14" height="68" rx="3"/><path d="M96 444H202L190 436H108Z"/><circle cx="104" cy="450" r="6"/><circle cx="198" cy="450" r="6"/><circle cx="151" cy="452" r="6"/></g>' +
        `<line x1="97" y1="176" x2="97" y2="330" stroke="${AC}" stroke-opacity=".4" stroke-width="2"/>`,
      tableArt:
        '<path d="M168 330H470V456H198Z" fill="#141b2b"/>' +
        `<line x1="168" y1="331" x2="470" y2="331" stroke="${AC}" stroke-opacity=".4" stroke-width="2"/>` +
        '<path d="M214 372H430M214 400H430" stroke="#0b1324" stroke-width="3"/>' +
        leds,
      device: (light, activity) => {
        const busy = activity === 'tool' || activity === 'run' || activity === 'responding'
        const bars = [0, 1, 2, 3, 4]
          .map(
            index =>
              `<rect class="ng-dbar" x="${f(318 + index * 14)}" y="${f(280 - index * 3)}" width="7" height="${busy ? 20 : 12}" fill="${light}" fill-opacity=".8" style="animation-delay:${f(-index * 0.17)}s"/>`,
          )
          .join('')

        return (
          `<path d="M232 330L244 306L350 300L372 330Z" fill="#222c40"/>` +
          keys.replace(/LIGHT/g, light) +
          `<path d="M298 300L304 232L396 214L392 292Z" fill="${light}" fill-opacity=".14" stroke="${light}" stroke-opacity=".8" stroke-width="2"/>` +
          `<path d="M312 244L384 230M312 256L366 246" stroke="${light}" stroke-opacity=".55" stroke-width="2"/>` +
          `<g transform="translate(366 268)"><g class="ng-rad"><circle r="14" fill="none" stroke="${light}" stroke-opacity=".7" stroke-width="1.6"/><path d="M0 0H14" stroke="${light}" stroke-width="2"/></g></g>` +
          bars
        )
      },
    },
    style:
      '.ng-drift{animation:ng-drift 40s ease-in-out infinite alternate}@keyframes ng-drift{to{transform:translate(var(--dx),var(--dy))}}' +
      '.ng-tw{animation:ng-tw 4s ease-in-out infinite alternate}@keyframes ng-tw{from{opacity:.2}to{opacity:1}}' +
      '@keyframes ng-in{from{opacity:0}to{opacity:1}}' +
      '.ng-bolt{opacity:0;animation:ng-bolt 7s linear infinite}' +
      '@keyframes ng-bolt{0%{opacity:0;transform:translateX(0)}12%{opacity:.8}85%{opacity:.8}100%{opacity:0;transform:translateX(var(--bx))}}' +
      '.ng-zip{opacity:0;animation:ng-zip 12s linear infinite}' +
      '@keyframes ng-zip{0%{opacity:0;transform:translateX(0)}6%{opacity:.75}90%{opacity:.75}100%{opacity:0;transform:translateX(var(--zx))}}' +
      '.ng-boom{opacity:0;transform-box:fill-box;transform-origin:center;animation:ng-boom 7s ease-out infinite}' +
      '@keyframes ng-boom{0%,70%{opacity:0;transform:scale(.3)}80%{opacity:.5}100%{opacity:0;transform:scale(1.5)}}' +
      '.st-idle .ng-boom{animation-duration:4.2s}' +
      '.ng-led{animation:ng-led 3s steps(1) infinite}@keyframes ng-led{0%{opacity:.9}50%{opacity:.2}}' +
      '.ng-rad{transform-box:fill-box;transform-origin:center;animation:mv-spin 3s linear infinite}' +
      '.ng-dbar{transform-box:fill-box;transform-origin:50% 100%;animation:ng-eq 1.2s ease-in-out infinite alternate}' +
      '.st-run .ng-dbar,.st-tool .ng-dbar{animation-duration:.4s}' +
      // tool: reticles lock on
      '.ng-ret{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-tool .ng-ret{animation:ng-lock 1.1s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--rd,0s)}' +
      '@keyframes ng-lock{0%{opacity:0;transform:scale(3) rotate(-100deg)}60%{opacity:1;transform:scale(1) rotate(0)}100%{opacity:.9;transform:scale(1) rotate(0)}}' +
      '.st-tool .ng-retc{transform-box:fill-box;transform-origin:center;animation:mv-spin 5s linear infinite}' +
      // read: the star map scrolls
      '.ng-map{opacity:0}.st-read .ng-map{animation:ng-in .7s ease-out both}' +
      '.st-read .ng-scr{animation:ng-scr 5s linear infinite}@keyframes ng-scr{to{transform:translateY(-180px)}}' +
      // thinking: the tactical hologram
      '.ng-holo{opacity:0}.st-thinking .ng-holo{animation:ng-in .8s ease-out both}' +
      '.ng-mer{transform-box:fill-box;transform-origin:center;animation:ng-mer 7s ease-in-out infinite}' +
      '@keyframes ng-mer{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}' +
      // responding: comms waveform
      '.ng-eq{opacity:0}.st-responding .ng-eq{opacity:1}' +
      '.ng-eqb{transform-box:fill-box;transform-origin:50% 100%;animation:ng-eq .5s ease-in-out infinite alternate}' +
      '@keyframes ng-eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}' +
      // run: the volley and its impact
      '.ng-beam{opacity:0;stroke-dasharray:.3 2;stroke-linecap:round}' +
      '.st-run .ng-beam{animation:ng-beam 1.7s ease-in infinite}' +
      '@keyframes ng-beam{0%{opacity:1;stroke-dashoffset:.3}38%{opacity:1;stroke-dashoffset:-1}39%,100%{opacity:0;stroke-dashoffset:-1}}' +
      '.ng-imp{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .ng-imp{animation:ng-imp 1.7s ease-out infinite}' +
      '@keyframes ng-imp{0%,30%{opacity:0;transform:scale(.3)}44%{opacity:.7}100%{opacity:0;transform:scale(1.5)}}' +
      '.st-run .ng-hit{animation:ng-jit .35s ease-in-out infinite alternate}@keyframes ng-jit{to{transform:translate(2px,1px)}}' +
      // web: sensor sweep
      '.ng-ring{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .ng-ring{animation:ng-ring 2.6s ease-out infinite}' +
      '@keyframes ng-ring{0%{opacity:.5;transform:scale(.08)}100%{opacity:0;transform:scale(.8)}}' +
      '.ng-blip{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .ng-blip{animation:ng-blip 2.6s ease-out infinite}' +
      '@keyframes ng-blip{0%,25%{opacity:0;transform:scale(.4)}35%{opacity:.9}100%{opacity:0;transform:scale(2.4)}}' +
      // error: red alert
      '.ng-lamp{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.ng-lampb{opacity:.3}.st-error .ng-lampb{opacity:1}' +
      '.st-error .ng-lamp{opacity:1;animation:mv-spin 2.2s linear infinite}' +
      '.ng-red{opacity:0}.st-error .ng-red{animation:ng-red 2.4s ease-in-out infinite}' +
      '@keyframes ng-red{0%,100%{opacity:.05}50%{opacity:.2}}' +
      '.st-error .ng-view{animation:ng-shake .6s ease-in-out infinite}' +
      '@keyframes ng-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,-1px)}}' +
      '.ng-spk{opacity:0}.st-error .ng-spk{animation:ng-spk 1.3s ease-out infinite}' +
      '@keyframes ng-spk{0%{opacity:0;transform:translate(0,0)}8%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      // done: warp jump
      '.ng-warp{opacity:0;transform-box:fill-box;transform-origin:0 50%}' +
      '.st-done .ng-warp{animation:ng-warp 1.8s cubic-bezier(.5,0,.9,.6) infinite}' +
      '@keyframes ng-warp{0%{opacity:0;transform:translateX(0) scaleX(.4)}15%{opacity:.8}100%{opacity:0;transform:translateX(var(--wx)) scaleX(3)}}' +
      '.ng-wb{opacity:0}.st-done .ng-wb{animation:ng-wb 2.4s ease-out both}' +
      '@keyframes ng-wb{0%{opacity:0}18%{opacity:.22}100%{opacity:0}}',
    scenery:
      '<defs><linearGradient id="ng-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a14"/><stop offset="1" stop-color="#0b1222"/></linearGradient>' +
      `<radialGradient id="ng-neb"><stop offset="0" stop-color="${AC}" stop-opacity=".12"/><stop offset="1" stop-color="${AC}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ng-pl" cx=".7" cy=".2" r=".9"><stop offset="0" stop-color="#2a5a9c"/><stop offset=".5" stop-color="#0f2447"/><stop offset="1" stop-color="#070a14"/></radialGradient>' +
      `<radialGradient id="ng-gc"><stop offset="0" stop-color="${FR}" stop-opacity=".9"/><stop offset="1" stop-color="${FR}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="ng-gr"><stop offset="0" stop-color="${EN}" stop-opacity=".9"/><stop offset="1" stop-color="${EN}" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="ng-bloom"><stop offset="0" stop-color="#fff4e0" stop-opacity=".9"/><stop offset=".4" stop-color="#9fe0ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fe0ff" stop-opacity="0"/></radialGradient>' +
      `<radialGradient id="ng-vg" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="${EN}" stop-opacity="0"/><stop offset="1" stop-color="${EN}" stop-opacity=".9"/></radialGradient>` +
      `<radialGradient id="ng-wbg"><stop offset="0" stop-color="#cfeeff" stop-opacity=".9"/><stop offset="1" stop-color="${AC}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="ng-lr"><stop offset="0" stop-color="${EN}" stop-opacity=".5"/><stop offset="1" stop-color="${EN}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="ng-ll" x1="1" x2="0"><stop offset="0" stop-color="${EN}" stop-opacity=".5"/><stop offset="1" stop-color="${EN}" stop-opacity="0"/></linearGradient></defs>` +
      '<g class="ng-view"><rect width="1600" height="1000" fill="url(#ng-bg)"/>' +
      '<circle cx="260" cy="260" r="420" fill="url(#ng-neb)"/><circle cx="1350" cy="300" r="380" fill="url(#ng-neb)" fill-opacity=".7"/>' +
      stars.join('') +
      '<circle cx="-150" cy="1180" r="520" fill="url(#ng-pl)"/>' +
      `<circle cx="-150" cy="1180" r="526" fill="none" stroke="${AC}" stroke-opacity=".28" stroke-width="3"/>` +
      '<path d="M-60 840Q120 800 300 880M-100 920Q100 880 330 970" fill="none" stroke="#4da3ff" stroke-opacity=".12" stroke-width="8"/>' +
      enemies +
      friends +
      bolts.join('') +
      fighters +
      booms +
      '</g>' +
      warp() +
      `<circle class="ng-wb" cx="700" cy="420" r="520" fill="url(#ng-wbg)"/>` +
      starMap() +
      // The bridge: top header, left pillar, deck.
      '<path d="M0 0H1600V40L1200 58H400L0 40Z" fill="#080c17" stroke="#1a2540" stroke-width="2"/>' +
      '<path d="M0 0L30 52V925L0 945Z" fill="#080c17" stroke="#1a2540" stroke-width="2"/>' +
      skyLights +
      '<path d="M0 925H1600V1000H0Z" fill="#0a1020"/><line x1="0" y1="925" x2="1600" y2="925" stroke="#4da3ff" stroke-opacity=".2" stroke-width="2"/>' +
      deckLights +
      '<g class="mv-r"><path d="M1570 0H1600V1000H1560Z" fill="#080c17" stroke="#1a2540" stroke-width="2"/></g>' +
      lamp(200, 70, 300, 0) +
      '<g class="mv-r">' + lamp(1400, 70, 300, -1.1) + '</g>' +
      '<rect class="ng-red" width="1600" height="1000" fill="url(#ng-vg)"/>',
    nook,
    front,
  }
}
