import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Halloween: a little witch-hatted Claude at an old wooden table with a candle and a cauldron, in a pumpkin patch
// under a huge orange moon. A crooked house on a hill sits in the left third; a witch on a broom crosses the moon.
// Spooky-cute: a run lights every jack-o'-lantern in a wave and sends bats out of the house.
const SIL = '#07030c'

/** Unit-size jack-o'-lantern faces (scaled by the pumpkin's radius). */
const FACES = [
  'M-.5 -.1L-.28 -.44L-.08 -.1ZM.08 -.1L.28 -.44L.5 -.1ZM-.07 .08L0 -.08L.07 .08ZM-.52 .2Q0 .66 .52 .2L.4 .36L.26 .24L.12 .4L-.04 .26L-.2 .4L-.34 .26Z',
  'M-.46 -.14a.15 .17 0 1 0 .3 0a.15 .17 0 1 0 -.3 0ZM.16 -.14a.15 .17 0 1 0 .3 0a.15 .17 0 1 0 -.3 0ZM-.06 .06L0 -.06L.06 .06ZM-.44 .24Q0 .6 .44 .24Q0 .44 -.44 .24Z',
  'M-.5 -.2L-.2 -.34L-.1 -.1L-.4 -.04ZM.5 -.2L.2 -.34L.1 -.1L.4 -.04ZM-.08 .06L0 -.08L.08 .06ZM-.4 .24L.4 .24L.36 .4L.2 .34L.1 .44L-.1 .34L-.22 .44L-.34 .36Z',
]

/** A bat with outstretched wings, about 34 wide. */
const BAT = 'M-17 -3Q-10 -11 -3 -3L0 -7L3 -3Q10 -11 17 -3Q11 -1 8 5L3 1L0 6L-3 1L-8 5Q-11 -1 -17 -3Z'

/** A pumpkin lantern at (x, y): lobed body, stem, and a glowing face that the run's wave lights. */
function pumpkin(x: number, y: number, r: number, face: number, delay: number): string {
  const s = f(r)

  const lobe = (cx: number, rx: number, ry: number): string => `M${f(cx - rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`

  return (
    `<g transform="translate(${f(x)} ${f(y)})">` +
    `<path d="${lobe(-r * 0.46, r * 0.58, r * 0.82)}${lobe(r * 0.46, r * 0.58, r * 0.82)}${lobe(0, r * 0.66, r * 0.86)}" fill="#431a06" stroke="#1d0a03" stroke-width="2"/>` +
    `<path d="M-3 ${f(-r * 0.8)}Q0 ${f(-r * 1.15)} ${f(r * 0.28)} ${f(-r * 1.1)}L${f(r * 0.18)} ${f(-r * 0.78)}Z" fill="#1c2a0f"/>` +
    `<g class="hw-face" style="animation-delay:${f(delay)}s"><circle r="${f(r * 1.5)}" fill="url(#hw-pg)"/>` +
    `<path d="${FACES[face % 3]}" transform="scale(${s})" fill="#ffc15a"/></g></g>`
  )
}

/** A bare, crooked tree: branches grown by seeded recursion, one path per thickness. */
function tree(x: number, y: number, s: number, seed: number): string {
  const next = random(seed)
  const levels = ['', '', '', '', '']

  const branch = (px: number, py: number, angle: number, length: number, depth: number): void => {
    const nx = px + Math.cos(angle) * length
    const ny = py + Math.sin(angle) * length

    levels[depth] += `M${f(px)} ${f(py)}L${f(nx)} ${f(ny)}`

    if (depth < 4) {
      branch(nx, ny, angle - (0.25 + next() * 0.6), length * (0.7 + next() * 0.15), depth + 1)
      branch(nx, ny, angle + (0.25 + next() * 0.6), length * (0.7 + next() * 0.15), depth + 1)
      if (depth === 1 && next() > 0.3) branch(nx, ny, angle + (next() - 0.5) * 0.4, length * 0.6, depth + 1)
    }
  }

  branch(0, 0, -Math.PI / 2 + (next() - 0.5) * 0.4, 130, 0)
  const widths = [17, 11, 7, 4, 2]

  return (
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="hw-sway" style="animation-delay:${f(-seed % 5)}s">` +
    `<g fill="none" stroke="${SIL}" stroke-linecap="round" stroke-linejoin="round">` +
    levels.map((d, i) => `<path d="${d}" stroke-width="${widths[i]}"/>`).join('') +
    '</g></g></g>'
  )
}

/** A bat as a flapping group at the origin of its own frame. */
const bat = (scale: number): string =>
  `<g transform="scale(${scale})"><path class="hw-flap" d="${BAT}" fill="#0b0613" stroke="#6a4a9a" stroke-opacity=".6" stroke-width="1.6" stroke-linejoin="round"/></g>`

/** A gravestone with its top at y - h. */
function stone(x: number, y: number, w: number, h: number, cross: boolean): string {
  return (
    `<path d="M${x - w / 2} ${y}V${y - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${y - h + w / 2}V${y}Z" fill="#17122a" stroke="#34295a" stroke-width="2.4"/>` +
    (cross
      ? `<path d="M${x} ${y - h + 16}V${y - h + 44}M${x - 10} ${y - h + 26}H${x + 10}" stroke="#4a3d78" stroke-width="3" stroke-linecap="round"/>`
      : `<path d="M${x - 10} ${y - h + 24}H${x + 10}M${x - 10} ${y - h + 34}H${x + 6}" stroke="#4a3d78" stroke-width="3" stroke-linecap="round"/>`)
  )
}

/** The laptop, a candle that can gutter, and a small bubbling cauldron. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const boil = activity === 'thinking' ? ' hw-boil' : ''

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2a2036"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2a2036"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M352 270l6 -8l6 8l-6 4Z" fill="#07030c" fill-opacity=".7"/>' +
    // The candle: wax, a drip, a flame and its halo.
    '<g class="hw-cg"><circle cx="381" cy="288" r="30" fill="#ffb347" fill-opacity=".09"/><circle cx="381" cy="288" r="15" fill="#ffd27a" fill-opacity=".14"/></g>' +
    '<rect x="374" y="298" width="14" height="32" rx="2" fill="#e8dcc0"/><path d="M374 298H388V303Q383 308 380 303Q377 309 374 303Z" fill="#fff4da"/>' +
    '<path d="M381 297V292" stroke="#2a2036" stroke-width="1.6"/>' +
    '<g class="hw-flame"><path d="M381 294Q372 284 381 270Q390 284 381 294Z" fill="#ffb347"/><path d="M381 292Q377 285 381 277Q385 285 381 292Z" fill="#fff0b0"/></g>' +
    // The cauldron: legs, a belly, the brew, bubbles.
    '<path d="M402 326L398 334M450 326L454 334" stroke="#07030c" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M396 306C392 328 404 332 426 332C448 332 460 328 456 306Z" fill="#0d0813" stroke="#3a2d52" stroke-width="2"/>' +
    '<ellipse cx="426" cy="306" rx="31" ry="7" fill="#0d0813" stroke="#3a2d52" stroke-width="2"/>' +
    '<ellipse cx="426" cy="306" rx="26" ry="4.6" fill="#6fe04a" fill-opacity=".85"/>' +
    `<g fill="#b8ff8a" fill-opacity=".85"><circle class="hw-bub${boil}" cx="416" cy="304" r="3.4" style="animation-delay:0s"/><circle class="hw-bub${boil}" cx="428" cy="304" r="4.4" style="animation-delay:-.5s"/><circle class="hw-bub${boil}" cx="438" cy="304" r="3" style="animation-delay:-1s"/></g>` +
    '<path d="M390 312Q388 318 392 322" fill="none" stroke="#6a4a9a" stroke-opacity=".5" stroke-width="2"/>'
  )
}

export function halloweenWorld(): World {
  const next = random(3131)

  // The patch: three rows, small and far to big and near.
  const patch: string[] = []
  const rows: [number, number, number, number][] = [
    [800, 17, 120, 1],
    [868, 27, 170, 2],
    [946, 40, 240, 3],
  ]

  for (const [y, r, step, row] of rows) {
    for (let x = row * 30 - 40; x < 1640; x += step + next() * 30) {
      const rr = r * (0.8 + next() * 0.45)

      patch.push(pumpkin(x, y + next() * 20, rr, Math.floor(next() * 3), (x / 1600) * 1.8))
    }
  }

  const vines = [
    'M-20 836C120 810 240 850 380 826S640 850 800 828S1100 850 1300 826S1560 846 1640 830',
    'M-20 912C160 892 300 926 480 904S800 926 1000 904S1360 924 1640 906',
  ]
    .map(d => `<path d="${d}"/>`)
    .join('')

  // The fence: iron spears on two rails.
  let fence = ''

  for (let x = 470; x < 1260; x += 34) fence += `M${x - 3} 772V724L${x} 708L${x + 3} 724V772Z`

  const stars = Array.from({ length: 24 }, () => `<circle cx="${f(next() * 1600)}" cy="${f(next() * 520)}" r="${f(0.8 + next() * 1.4)}"/>`).join('')

  // A swarm for the run: each bat leaves the tower window along its own line, loops, and fades.
  const swarm = Array.from({ length: 14 }, (_, i) => {
    const a = -Math.PI * (0.05 + next() * 0.9)
    const d = 260 + next() * 560
    const dx = Math.cos(a) * d + 160
    const dy = Math.sin(a) * d * 0.8 - 40

    return `<g class="hw-sw" style="--dx:${f(dx)}px;--dy:${f(dy)}px;animation-delay:${f(i * 0.17)}s">${bat(1.5 + next() * 1.1)}</g>`
  }).join('')

  // A looser heart of bats over the moon for the done beat.
  const heart = Array.from({ length: 20 }, (_, i) => {
    const t = (i / 20) * Math.PI * 2 + 0.1
    const hx = 272 + 16 * Math.sin(t) ** 3 * 6.9
    const hy = 212 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 7

    return `<g transform="translate(${f(hx)} ${f(hy)})"><g class="hw-hb" style="--sx:${f(391 - hx + (next() - 0.5) * 30)}px;--sy:${f(289 - hy)}px;animation-delay:${f(i * 0.03)}s">${bat(1.6)}</g></g>`
  }).join('')

  // Bats that drift across the sky all the time.
  const drifters = ([
    [120, 4, 0.9, 34, 0],
    [330, 3, 1.1, 46, -9],
    [60, 5, 0.8, 52, -22],
    [210, 2, 1, 40, -30],
    [160, 6, 0.7, 60, -14],
  ] as [number, number, number, number, number][])
    .map(
      ([y, , s, secs, delay]) =>
        `<g transform="translate(0 ${y})"><g class="hw-fly" style="animation-duration:${secs}s;animation-delay:${delay}s"><g transform="translate(-40 0)">${bat(s)}</g></g></g>`,
    )
    .join('')

  const windows: [number, number, number, number][] = [
    [182, 446, 22, 34],
    [252, 432, 22, 38],
    [322, 448, 22, 34],
    [352, 336, 18, 28],
    [228, 372, 14, 20],
  ]
  const lit = windows
    .map(([x, y, w, h]) => `<path d="M${x} ${y + h}V${y + 8}Q${x + w / 2} ${y - 6} ${x + w} ${y + 8}V${y + h}Z" fill="#ffb347"/>`)
    .join('')
  const winGlow = windows.map(([x, y, w, h]) => `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w * 2.2}" fill="url(#hw-pg)"/>`).join('')

  const web = '<path d="M-62 0L62 0M0 -62L0 62M-44 -44L44 44M44 -44L-44 44" stroke="#8a78b8" stroke-opacity=".45" stroke-width="1.4"/>' +
    [20, 38, 56].map(r => `<path d="M${-r} 0Q${-r * 0.5} ${-r * 0.5} 0 ${-r}Q${r * 0.5} ${-r * 0.5} ${r} 0" fill="none" stroke="#8a78b8" stroke-opacity=".4" stroke-width="1.2"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bubbles',
      ink: '#050208',
      furniture: '#2a1a10',
      metal: '#2a2036',
      paper: '#e8dcc0',
      light: { idle: '#b07a4a', work: '#ff9a3c', bright: '#ffd9a0' },
      headTop: 168,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // A pointy hat with a bent tip: the brim sits above the eyes, the band and buckle on the cone.
          '<path d="M104 240C116 206 132 176 156 154C176 136 206 126 238 142C212 148 204 166 200 192C198 212 198 228 198 240Z" fill="#150b24" stroke="#3a2260" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M106 226H199V240H104Z" fill="#6a2fa8"/><rect x="140" y="224" width="20" height="18" rx="2" fill="none" stroke="#ff9a3c" stroke-width="3"/>' +
          '<path d="M124 190C134 176 146 166 158 160" fill="none" stroke="#5a3a8a" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>' +
          '<g transform="rotate(-3 150 244)"><ellipse cx="150" cy="243" rx="112" ry="10" fill="#150b24" stroke="#3a2260" stroke-width="2.4"/></g>',
      },
      seatArt:
        '<ellipse cx="151" cy="352" rx="44" ry="6" fill="#3a2414" stroke="#5a3a22" stroke-width="2"/>' +
        '<path d="M118 358L104 456M184 358L198 456M151 360V456" stroke="#2a1a10" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M110 416H192" stroke="#5a3a22" stroke-width="4"/>',
      tableArt:
        '<g fill="#2a1a10" stroke="#5a3a22" stroke-width="1.8"><rect x="166" y="330" width="304" height="14" rx="3"/>' +
        '<path d="M182 344H202L198 372L206 404L198 456H186L180 404L188 372Z"/><path d="M436 344H456L452 372L460 404L452 456H442L436 404L444 372Z"/>' +
        '<rect x="196" y="410" width="250" height="7"/></g>' +
        '<path d="M176 336H280M300 336H456" stroke="#5a3a22" stroke-opacity=".7" stroke-width="1.6"/>' +
        '<path d="M190 346Q230 374 262 346" fill="none" stroke="#8a78b8" stroke-opacity=".5" stroke-width="1.6"/>',
    },
    style:
      // Ambient: mist drifts, trees sway, bats drift and flap, the lanterns flicker, the candle burns.
      '.hw-mist{animation:hw-mist 38s ease-in-out infinite alternate}@keyframes hw-mist{to{transform:translateX(120px)}}' +
      '.hw-mist2{animation-duration:52s;animation-direction:alternate-reverse}' +
      '.hw-sway{animation:hw-sway 6s ease-in-out infinite alternate}@keyframes hw-sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.4deg)}}' +
      '.hw-fly{animation:hw-fly 40s linear infinite}@keyframes hw-fly{0%{transform:translate(0,0)}25%{transform:translate(450px,-24px)}50%{transform:translate(900px,14px)}75%{transform:translate(1350px,-18px)}100%{transform:translate(1800px,0)}}' +
      '.hw-flap{transform-box:fill-box;transform-origin:center;animation:hw-flap var(--fd,.38s) ease-in-out infinite alternate}@keyframes hw-flap{from{transform:scaleY(1)}to{transform:scaleY(.4)}}' +
      '.st-tool .hw-bats{--fd:.13s}.st-tool .hw-fly{animation-duration:14s!important}' +
      '.hw-face{opacity:.55;animation:hw-fl 3.4s ease-in-out infinite alternate}@keyframes hw-fl{from{opacity:.42}to{opacity:.72}}' +
      '.hw-flame{transform-box:fill-box;transform-origin:50% 100%;animation:hw-flame .9s ease-in-out infinite alternate}@keyframes hw-flame{from{transform:scale(.92,1) skewX(-3deg)}to{transform:scale(1.05,1.1) skewX(3deg)}}' +
      '.hw-cg{animation:hw-glow 2.6s ease-in-out infinite alternate}@keyframes hw-glow{from{opacity:.7}to{opacity:1}}' +
      '.hw-win{opacity:.32;animation:hw-win 5s ease-in-out infinite alternate}@keyframes hw-win{to{opacity:.5}}' +
      '.hw-crow{transform-box:fill-box;transform-origin:50% 100%;animation:hw-crow 5s ease-in-out infinite}@keyframes hw-crow{0%,70%,100%{transform:rotate(0)}78%,90%{transform:rotate(-14deg)}}' +
      '.hw-wit{animation:hw-wit 48s linear infinite}@keyframes hw-wit{0%{transform:translate(-200px,40px)}50%{transform:translate(760px,-20px)}100%{transform:translate(1800px,40px)}}' +
      '.hw-bub{transform-box:fill-box;transform-origin:center;animation:hw-bub 2.8s ease-in-out infinite}@keyframes hw-bub{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.2)}}' +
      '.hw-boil{animation:hw-boil .9s ease-out infinite}@keyframes hw-boil{0%{transform:translateY(0) scale(.6);opacity:1}100%{transform:translateY(-34px) scale(1.5);opacity:0}}' +
      // Thinking: the cauldron brew glows and spits.
      // Run: the lanterns light in a wave across the patch, and bats burst out of the house.
      '.st-run .hw-face{animation:hw-wave 2.6s ease-in-out infinite}@keyframes hw-wave{0%,100%{opacity:.4}30%,52%{opacity:1}}' +
      '.hw-sw{opacity:0}.st-run .hw-sw{animation:hw-sw 3.2s ease-out infinite}' +
      '@keyframes hw-sw{0%{opacity:0;transform:translate(0,0) scale(.5)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.3)}}' +
      // Error: the ghost pops up, the candle gutters, the lanterns gutter.
      '.hw-ghost{transform:translateY(170px)}' +
      '.st-error .hw-ghost{animation:hw-pop .7s cubic-bezier(.2,1.4,.4,1) .15s both,hw-bob 1.6s ease-in-out .9s infinite alternate}' +
      '@keyframes hw-pop{to{transform:translateY(0)}}@keyframes hw-bob{from{transform:translateY(0)}to{transform:translateY(-12px)}}' +
      '.hw-gsway{transform-box:fill-box;transform-origin:50% 100%;animation:hw-gs 1s ease-in-out infinite alternate}@keyframes hw-gs{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      '.st-error .hw-flame{animation:hw-gutter .8s ease-in-out infinite}@keyframes hw-gutter{0%,100%{transform:scale(.5,.45)}30%{transform:scale(.7,.7) skewX(8deg)}60%{transform:scale(.4,.3)}}' +
      '.st-error .hw-cg{animation:none;opacity:.25}' +
      '.st-error .hw-face{animation:hw-dim 1.3s ease-in-out infinite alternate}@keyframes hw-dim{from{opacity:.12}to{opacity:.4}}' +
      // Done: the windows glow warm, bats settle into a heart over the moon.
      '.st-done .hw-win{animation:hw-warm 1.6s ease-out both}@keyframes hw-warm{to{opacity:1}}' +
      '.st-done .hw-face{animation:none;opacity:.85}' +
      '.hw-hb{opacity:0}.st-done .hw-hb{animation:hw-hb 1.6s cubic-bezier(.2,.8,.3,1) both}' +
      '@keyframes hw-hb{from{opacity:0;transform:translate(var(--sx),var(--sy)) scale(.5)}15%{opacity:1}to{opacity:1;transform:translate(0,0) scale(1)}}' +
      // Web: the witch crosses the moon.
      '.st-web .hw-wit{animation:hw-wcross 3.6s ease-in-out both}@keyframes hw-wcross{from{transform:translate(-80px,70px)}to{transform:translate(740px,-30px)}}',
    scenery:
      '<defs><linearGradient id="hw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07030f"/><stop offset=".55" stop-color="#150a26"/><stop offset="1" stop-color="#2a1236"/></linearGradient>' +
      '<radialGradient id="hw-halo"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".45"/><stop offset=".5" stop-color="#d4601a" stop-opacity=".16"/><stop offset="1" stop-color="#d4601a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hw-moon" cx=".4" cy=".38" r=".75"><stop offset="0" stop-color="#ffb866"/><stop offset=".7" stop-color="#e07a26"/><stop offset="1" stop-color="#b8541a"/></radialGradient>' +
      '<radialGradient id="hw-gg"><stop offset="0" stop-color="#a8b8ff" stop-opacity=".28"/><stop offset="1" stop-color="#a8b8ff" stop-opacity="0"/></radialGradient><radialGradient id="hw-pg"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset=".5" stop-color="#ff8a2a" stop-opacity=".16"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hw-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150a1e"/><stop offset="1" stop-color="#05030a"/></linearGradient>' +
      '<linearGradient id="hw-mg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a86c8" stop-opacity="0"/><stop offset=".5" stop-color="#9a86c8" stop-opacity=".16"/><stop offset="1" stop-color="#9a86c8" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="hw-gc"><rect x="170" y="560" width="260" height="222"/></clipPath></defs>' +
      '<rect width="1600" height="1000" fill="url(#hw-sky)"/>' +
      `<g fill="#cdbfee" fill-opacity=".55">${stars}</g>` +
      // The huge moon, with craters and thin clouds across it.
      '<circle cx="330" cy="250" r="360" fill="url(#hw-halo)"/>' +
      '<circle cx="330" cy="250" r="180" fill="url(#hw-moon)"/>' +
      '<g fill="#b8541a" fill-opacity=".55"><circle cx="270" cy="200" r="30"/><circle cx="390" cy="160" r="20"/><circle cx="410" cy="300" r="34"/><circle cx="300" cy="320" r="16"/></g>' +
      '<path d="M120 190C220 170 300 200 400 180C460 170 500 190 520 196" fill="none" stroke="#3a1a4a" stroke-opacity=".5" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M150 290C260 306 340 280 470 300" fill="none" stroke="#3a1a4a" stroke-opacity=".4" stroke-width="9" stroke-linecap="round"/>' +
      // The witch on her broom, crossing.
      '<g transform="translate(0 240)"><g class="hw-wit"><g transform="scale(2.3)">' +
      `<path d="M-34 6L32 -8" stroke="${SIL}" stroke-width="3.6" stroke-linecap="round"/><path d="M-32 6L-58 -4L-56 8L-60 16Z" fill="${SIL}"/>` +
      `<path d="M-8 -2Q-4 -14 8 -12Q12 -4 8 0L18 -1L14 8L-4 6Z" fill="${SIL}"/><circle cx="10" cy="-18" r="5" fill="${SIL}"/>` +
      `<path d="M2 -20L24 -22L14 -44Z" fill="${SIL}"/><path d="M-6 -2L-20 -6" stroke="${SIL}" stroke-width="3"/>` +
      `<path d="M-6 0L-22 6L-18 12Z" fill="${SIL}"/>` +
      '</g></g></g>' +
      // The distant hill, the crooked house and its glowing windows.
      '<path d="M-40 760C60 640 150 560 260 540C380 560 520 650 740 770V1000H-40Z" fill="#0b0514"/>' +
      '<g transform="translate(260 552) scale(1.3) translate(-260 -552)">' +
      `<g fill="${SIL}" stroke="#1d1030" stroke-width="2" stroke-linejoin="round">` +
      '<path d="M138 552L150 410L240 392L330 408L396 400L402 552Z"/>' +
      '<path d="M120 414L238 316L360 410L350 422L238 342L132 426Z"/>' +
      '<path d="M322 410L338 280L356 232L376 276L384 410Z"/>' +
      '<path d="M308 286L356 214L396 290Z"/>' +
      '<path d="M170 392L176 340L196 338L198 392Z"/>' +
      '<path d="M150 552L142 520L400 520L398 552Z"/>' +
      '<path d="M90 552L96 500L124 496L130 552ZM410 552L416 486L446 488L450 552Z"/></g>' +
      '<g class="hw-win">' +
      winGlow +
      lit +
      '<path d="M222 552V518Q238 498 254 518V552Z" fill="#ffb347"/></g></g>' +
      // Crooked trees.
      tree(590, 770, 0.8, 4) +
      tree(1262, 772, 1.05, 9) +
      '<g class="mv-r">' + tree(1440, 770, 0.8, 21) + '</g>' +
      // The graveyard: the fence, the stones, and the sheet ghost that pops out from behind the first one.
      `<g fill="${SIL}" stroke="#1d1030" stroke-width="2"><path d="${fence}"/></g>` +
      '<path d="M462 738H1260M462 760H1260" stroke="#07030c" stroke-width="6"/>' +
      '<g clip-path="url(#hw-gc)"><g transform="translate(310 782)"><g class="hw-ghost"><g class="hw-gsway"><circle cy="-100" r="130" fill="url(#hw-gg)"/><g transform="scale(1.5)" opacity=".68">' +
      '<path d="M-46 0C-50 -70 -36 -118 0 -118C36 -118 50 -70 46 0L32 -12L20 2L6 -12L-6 2L-20 -12L-32 2Z" fill="#cfd6ee"/>' +
      '<path d="M-44 -50Q-72 -76 -62 -98Q-50 -86 -40 -70ZM44 -50Q72 -76 62 -98Q50 -86 40 -70Z" fill="#cfd6ee"/>' +
      '<ellipse cx="-15" cy="-82" rx="7" ry="11" fill="#1a1226"/><ellipse cx="15" cy="-82" rx="7" ry="11" fill="#1a1226"/><ellipse cx="0" cy="-54" rx="9" ry="13" fill="#1a1226"/>' +
      '<circle cx="-28" cy="-62" r="6" fill="#ffb0c0" fill-opacity=".5"/><circle cx="28" cy="-62" r="6" fill="#ffb0c0" fill-opacity=".5"/>' +
      '</g></g></g></g></g>' +
      stone(282, 782, 62, 92, true) +
      stone(660, 770, 54, 70, false) +
      stone(1130, 772, 58, 80, true) +
      stone(1200, 766, 50, 66, false) +
      // The ground and the pumpkin patch.
      '<rect y="780" width="1600" height="240" fill="url(#hw-ground)"/>' +
      `<g fill="none" stroke="#1c2a0f" stroke-width="4" stroke-linecap="round" stroke-opacity=".7">${vines}</g>` +
      patch.join('') +
      // The scarecrow, far right.
      '<g class="mv-r"><g transform="translate(1520 800)"><g class="hw-sway" style="animation-delay:-2s">' +
      `<path d="M0 0V-250M-90 -180H90" stroke="#1a0f08" stroke-width="9" stroke-linecap="round"/>` +
      '<path d="M-34 -186L-28 -110L28 -110L34 -186Z" fill="#2a1030" stroke="#4a2a60" stroke-width="2"/><rect x="-14" y="-170" width="14" height="14" fill="#5a3a1a"/>' +
      '<path d="M-90 -186L-34 -178M90 -186L34 -178" stroke="#2a1030" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M-98 -178L-110 -156M-92 -176L-100 -152M98 -178L110 -156M92 -176L100 -152M-20 -112L-24 -96M0 -110V-92M20 -112L24 -96" stroke="#b08a3a" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-222" r="30" fill="#3a2a18" stroke="#1a0f08" stroke-width="2"/>' +
      '<path d="M-14 -228l8 4M14 -228l-8 4" stroke="#ffb347" stroke-width="3" stroke-linecap="round"/><path d="M-12 -208Q0 -200 12 -208" fill="none" stroke="#1a0f08" stroke-width="2.6"/>' +
      '<path d="M-52 -238H52Q22 -250 12 -296Q0 -318 -12 -296Q-22 -250 -52 -238Z" fill="#150b24" stroke="#3a2260" stroke-width="2"/>' +
      '<g class="hw-crow"><path d="M70 -186Q84 -204 98 -196Q106 -208 114 -200L108 -188Q96 -176 82 -182Z" fill="#050208"/></g>' +
      '</g></g></g>' +
      // Mist across the patch and the bats, over everything else.
      '<g class="hw-mist"><rect x="-200" y="690" width="1000" height="90" fill="url(#hw-mg)"/><rect x="500" y="770" width="1100" height="110" fill="url(#hw-mg)"/></g>' +
      '<g class="hw-mist hw-mist2"><rect x="-100" y="800" width="1300" height="120" fill="url(#hw-mg)"/><rect x="700" y="660" width="900" height="80" fill="url(#hw-mg)"/></g>' +
      `<g class="hw-bats">${drifters}<g transform="translate(391 289)">${swarm}</g>${heart}</g>`,
    nook:
      // A garland of tiny pumpkins and a cobweb in the corner above the table.
      '<path d="M10 -150C120 -110 280 -110 410 -160" fill="none" stroke="#2a1a10" stroke-width="3"/>' +
      [60, 140, 220, 300, 372]
        .map(
          (x, i) =>
            `<g transform="translate(${x} ${-128 + Math.sin(i * 1.2) * -6 + (i % 2) * 6})"><ellipse rx="13" ry="11" fill="#c85a14" stroke="#7a3008" stroke-width="2"/><path d="M0 -10V-16" stroke="#1c2a0f" stroke-width="3"/><path d="M-5 -2L-2 -6L1 -2ZM3 -2L6 -6L9 -2Z" fill="#ffe08a" transform="translate(-2 0)"/></g>`,
        )
        .join('') +
      `<g transform="translate(396 -92) scale(.8)">${web}</g>` +
      '<g transform="translate(226 -150)"><path d="M0 0V24" stroke="#2a1a10" stroke-width="2"/><path d="M-8 24H8L6 58H-6Z" fill="#6a8a3a" fill-opacity=".8"/><path d="M-10 24H10" stroke="#8a5a2a" stroke-width="3"/></g>' +
      // A small lit pumpkin on the floor beside the table.
      pumpkin(405, 432, 24, 1, 0.2),
  }
}
