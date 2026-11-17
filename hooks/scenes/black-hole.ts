import type { Activity } from '../../types'
import { f, random } from './kit'
import { U, X0, Y0, cell } from './rig'
import type { World } from './world'

// Black Hole: a researcher at the event horizon. A huge black hole at the upper left: a tilted accretion disk of dashed
// rings that turn, a thin photon ring, lensing arcs, stars spiralling in, a probe being stretched. Every loop runs on
// `--k`, the clock rate: 1 normally, 5 (five times slower) while Claude thinks.

const GOLD = '#f2b56b'
const BLUE = '#7ab8ff'
const PALE = '#ffe9c4'
const HOLE: readonly [number, number] = [310, 280]
const TILT = 18
const SHADOW = 128
const FLAT = 0.24

const px = (col: number) => f(X0 + col * U)
const py = (row: number) => f(Y0 + row * U)

/** Half an elliptical ring band, the far half (over the top) or the near half (under). */
function band(far: boolean, outer: number, inner: number): string {
  const sweep = far ? 1 : 0

  return (
    `M${-outer} 0A${outer} ${f(outer * FLAT)} 0 0 ${sweep} ${outer} 0L${inner} 0` +
    `A${inner} ${f(inner * FLAT)} 0 0 ${1 - sweep} ${-inner} 0Z`
  )
}

function rings(far: boolean): string {
  const sweep = far ? 1 : 0

  return Array.from({ length: 7 }, (_, index) => {
    const r = 172 + index * 30
    const pattern = index % 2 === 0 ? '.07 .02 .16 .03 .05 .02' : '.05 .03 .1 .02 .2 .03'
    const sum = index % 2 === 0 ? 0.35 : 0.43

    return (
      `<path class="hd-d" pathLength="1" style="--s:${sum};--d:${f(7 + index * 3.4)}s${far ? ';animation-direction:normal' : ''}" ` +
      `d="M${-r} 0A${r} ${f(r * FLAT)} 0 0 ${sweep} ${r} 0" fill="none" stroke="url(#hd-dp)" stroke-width="${f(10 - index * 0.8)}" ` +
      `stroke-opacity="${f(0.95 - index * 0.09)}" stroke-dasharray="${pattern}"/>`
    )
  }).join('')
}

/** A star or a bit of debris on a spiral: it turns, and its radius shrinks, so it falls in. */
function orbiter(index: number, next: () => number, debris: boolean): string {
  const radius = debris ? 150 + next() * 110 : 190 + next() * 250
  const spin = (debris ? 14 : 30) + next() * 40
  const fall = (debris ? 20 : 40) + next() * 30
  const size = debris ? 2.4 + next() * 2 : 1.4 + next() * 1.6

  return (
    `<g class="hd-or" style="--d:${f(spin)}s;animation-delay:${f(-next() * spin)}s"><g class="hd-in" style="--e:${f(fall)}s;animation-delay:${f(-next() * fall)}s">` +
    `<circle class="hd-st${debris ? ' hd-db' : ''}" cx="${f(radius)}" cy="0" r="${f(size)}" fill="${index % 3 === 0 ? PALE : '#e8eef8'}"/></g></g>`
  )
}

/** Probes launched toward the hole while Claude uses a tool. */
function launch(): string {
  const starts: [number, number, number][] = [
    [1130, 520, 0],
    [1050, 640, 0.85],
    [1180, 410, 1.7],
    [960, 560, 2.55],
  ]

  return starts
    .map(([x, y, delay]) => {
      const angle = (Math.atan2(HOLE[1] - y, HOLE[0] - x) * 180) / Math.PI
      const reach = Math.hypot(HOLE[0] - x, HOLE[1] - y)

      return (
        `<g transform="translate(${x} ${y}) rotate(${f(angle)})"><g class="hd-pb" style="--L:${f(reach * 0.92)}px;animation-delay:${-delay}s">` +
        '<rect x="-96" y="-1.5" width="96" height="3" fill="url(#hd-trail)"/>' +
        `<path d="M12 0L-4 -5H-10V5H-4Z" fill="#f0eadc"/><rect x="-8" y="-13" width="6" height="26" fill="#22222a" stroke="#f0eadc" stroke-opacity=".8" stroke-width="1.2"/>` +
        `<circle cx="-12" r="3" fill="${GOLD}"/></g></g>`
      )
    })
    .join('')
}

/** One chirp of a gravitational wave: it swells and quickens, then rings down to a flat line. */
function chirp(x0: number, mid: number, width: number): string {
  const points: string[] = []

  for (let step = 0; step <= 50; step += 1) {
    const u = step / 50
    const amp = u < 0.72 ? 21 * Math.pow(u / 0.72, 2.2) : 21 * Math.exp(-(u - 0.72) * 16)
    const phase = Math.PI * 2 * (1.5 + 7 * u * u)

    points.push(`${f(x0 + u * width)} ${f(mid - amp * Math.sin(phase))}`)
  }

  return points.join('L')
}

function terminal(light: string, activity: Activity): string {
  const mid = 259
  const path = `M${chirp(302, mid, 50)}L${chirp(352, mid, 50)}L${chirp(402, mid, 50)}L${chirp(452, mid, 50)}`
  const fast = activity === 'tool' || activity === 'run' || activity === 'responding' || activity === 'web'
  const jag = Array.from({ length: 24 }, (_, index) => `${302 + index * 4.2} ${mid + (index % 2 === 0 ? -18 : 18) * (0.4 + ((index * 7) % 5) / 5)}`).join('L')
  const trace =
    activity === 'error'
      ? `<path class="hd-jag" d="M${jag}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linejoin="round"/>`
      : `<g class="hd-plot${fast ? ' hd-fast' : ''}"><path d="${path}" fill="none" stroke="${light}" stroke-width="2.2" stroke-linejoin="round"/></g>`

  return (
    '<rect x="344" y="298" width="16" height="22" fill="#22222a"/>' +
    '<rect x="246" y="318" width="92" height="12" rx="3" fill="#22222a"/>' +
    `<g fill="${light}" fill-opacity=".55">${[254, 264, 274, 284, 294, 304, 314, 324].map(x => `<rect x="${x}" y="321" width="6" height="3"/>`).join('')}</g>` +
    `<rect x="290" y="214" width="124" height="88" rx="7" fill="#22222a" stroke="${light}" stroke-opacity=".55" stroke-width="2"/>` +
    `<rect x="296" y="220" width="112" height="76" rx="3" fill="${light}" fill-opacity=".1"/>` +
    `<g stroke="${light}" stroke-opacity=".28" stroke-width="1"><path d="M302 232V286M302 259H402M302 245H402M302 273H402"/></g>` +
    `<clipPath id="hd-pclip"><rect x="302" y="230" width="100" height="58"/></clipPath><g clip-path="url(#hd-pclip)">${trace}</g>` +
    `<rect x="302" y="224" width="26" height="3" fill="${light}" fill-opacity=".7"/><rect x="334" y="224" width="12" height="3" fill="${light}" fill-opacity=".4"/>`
  )
}

export function blackHoleWorld(): World {
  const next = random(404)
  const stars: string[] = []

  for (let index = 0; index < 64; index += 1) {
    const twinkle = index % 4 === 0 ? ` class="hd-tw" style="animation-delay:${f(-next() * 6)}s;--d:${f(4 + next() * 4)}s"` : ''

    stars.push(
      `<circle${twinkle} cx="${f(next() * 1600)}" cy="${f(next() * 1000)}" r="${f(0.5 + next() * 1)}" fill="${next() > 0.8 ? '#cfe0ff' : '#f0eadc'}" fill-opacity="${f(0.25 + next() * 0.5)}"/>`,
    )
  }

  const spirals = Array.from({ length: 12 }, (_, index) => orbiter(index, next, false)).join('')
  const debris = Array.from({ length: 8 }, (_, index) => orbiter(index, next, true)).join('')

  // Spectrum lines: dark absorption lines and a few bright emission lines on a pale band, in a pattern that repeats
  // every 120 units so it can drift without a seam.
  const lineSet: string[] = []

  for (let copy = 0; copy < 5; copy += 1) {
    ;[
      [12, 2, 0],
      [27, 4, 0],
      [41, 2, 1],
      [58, 3, 0],
      [74, 2, 0],
      [93, 5, 0],
      [108, 2, 1],
    ].forEach(([x, w, bright]) => {
      lineSet.push(`<rect x="${copy * 120 + (x ?? 0)}" y="0" width="${w ?? 2}" height="46" fill="${bright === 1 ? PALE : '#040406'}" fill-opacity="${bright === 1 ? 0.85 : 0.7}"/>`)
    })
  }

  const rays = [
    'M1390 770C1010 740 600 650 440 470S170 540 110 380S30 220 -40 140',
    'M1390 790C1020 790 610 700 470 520S210 580 140 420S60 260 -30 190',
    'M1390 750C1000 700 590 600 420 430S150 490 90 340S10 190 -50 100',
  ]
    .map(
      (d, index) =>
        `<path class="hd-sg" pathLength="1" style="animation-delay:${f(-index * 0.9)}s" d="${d}" fill="none" stroke="${index === 1 ? PALE : BLUE}" stroke-width="3" stroke-linecap="round" stroke-dasharray=".02 .16"/>` +
        `<path d="${d}" fill="none" stroke="${BLUE}" stroke-opacity=".1" stroke-width="1.5"/>`,
    )
    .join('')

  const tick = Array.from({ length: 12 }, (_, index) => `M0 ${index % 3 === 0 ? -50 : -53}V-58`).map((d, i) => `<path transform="rotate(${i * 30})" d="${d}"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'stool',
      table: 'console',
      machine: 'panel',
      cup: 'tea',
      thought: 'orbs',
      ink: '#020203',
      furniture: '#15151a',
      metal: '#22222a',
      paper: '#f0eadc',
      light: { idle: '#8a7a5a', work: GOLD, bright: PALE },
      headTop: Y0 - 34,
      glowAt: [352, 258],
      wear: {
        behind: `<g fill="#bdb8aa">${cell(0.9, -0.4, 12.2, 7)}</g>`,
        front:
          // A white hood around the face, and lab goggles pushed up on the brow: the eyes stay in the open.
          `<path fill-rule="evenodd" fill="#e8e3d6" d="M${px(1.4)} ${py(5.8)}V${py(0)}Q${px(1.4)} ${py(-2.1)} ${px(4)} ${py(-2.1)}H${px(10)}Q${px(12.6)} ${py(-2.1)} ${px(12.6)} ${py(0)}V${py(5.8)}Z` +
          `M${px(3.3)} ${py(0.95)}H${px(10.7)}V${py(5.3)}H${px(3.3)}Z"/>` +
          `<path d="M${px(3.3)} ${py(0.95)}V${py(5.3)}M${px(10.7)} ${py(0.95)}V${py(5.3)}" stroke="#b8b2a2" stroke-width="3" fill="none"/>` +
          `<path d="M${px(2.2)} ${py(5.6)}V${py(1.6)}M${px(11.8)} ${py(5.6)}V${py(1.6)}M${px(6)} ${py(-1.6)}V${py(-0.4)}" stroke="#c9c4b6" stroke-width="2" fill="none"/>` +
          `<rect x="${px(1.4)}" y="${py(0.1)}" width="${f(11.2 * U)}" height="${f(0.7 * U)}" fill="#3a3f4a"/>` +
          `<g fill="${BLUE}" fill-opacity=".5" stroke="#22222a" stroke-width="3"><circle cx="${px(4.6)}" cy="${py(-0.55)}" r="11"/><circle cx="${px(9.4)}" cy="${py(-0.55)}" r="11"/></g>` +
          `<path d="M${px(4.1)} ${py(-0.8)}l5 -4M${px(8.9)} ${py(-0.8)}l5 -4" stroke="#ffffff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`,
      },
      device: terminal,
    },
    style:
      '.st-thinking{--k:5}.st-responding{--k:.8}.st-run{--k:.5}' +
      '.hd-d{animation:hd-fl calc(var(--d) * var(--k,1)) linear infinite}@keyframes hd-fl{to{stroke-dashoffset:calc(var(--s) * -1)}}' +
      '.hd-or{animation:mv-spin calc(var(--d) * var(--k,1)) linear infinite}' +
      '.hd-in{animation:hd-in calc(var(--e) * var(--k,1)) linear infinite}' +
      '@keyframes hd-in{0%{transform:scale(1);opacity:0}8%{opacity:1}85%{opacity:1}100%{transform:scale(.16);opacity:0}}' +
      '.hd-st{transform-box:fill-box;transform-origin:center}.hd-db{opacity:0}' +
      '.st-error .hd-st{animation:hd-spag 2.8s ease-in infinite;fill:#ff5a3c}.st-error .hd-db{opacity:1}' +
      '@keyframes hd-spag{0%{transform:scale(1,1)}100%{transform:scale(16,.2);opacity:.25}}' +
      '.hd-tw{animation:hd-tw calc(var(--d) * var(--k,1)) ease-in-out infinite alternate}@keyframes hd-tw{from{opacity:.2}to{opacity:1}}' +
      '.hd-lens{animation:mv-spin 220s linear infinite}' +
      '.hd-pr{animation:hd-pr calc(16s * var(--k,1)) ease-in infinite;transform-box:fill-box;transform-origin:center}' +
      '@keyframes hd-pr{0%{opacity:0;transform:scale(1,1)}10%{opacity:.9}60%{transform:scale(2.2,.8)}88%{opacity:.35;transform:translateX(30px) scale(8,.25)}100%{opacity:0;transform:translateX(50px) scale(12,.15)}}' +
      '.st-error .hd-pr{animation-duration:3.2s}.st-error .hd-pr *{fill:#ff5a3c}' +
      '.hd-hand{animation:mv-spin calc(12s * var(--k,1)) linear infinite}.hd-hand2{animation-duration:calc(144s * var(--k,1))}' +
      '.st-thinking .hd-ck{animation:hd-ck 6s ease-in-out infinite alternate}@keyframes hd-ck{to{transform:scale(1.8,.8)}}' +
      '.hd-rip{opacity:0;transform-box:fill-box;transform-origin:center}.st-thinking .hd-rip{animation:hd-rip 9s ease-out infinite}' +
      '@keyframes hd-rip{0%{opacity:.5;transform:scale(.7)}100%{opacity:0;transform:scale(3.4)}}' +
      '.hd-pb{opacity:0}.st-tool .hd-pb{animation:hd-launch 3.4s ease-in infinite}' +
      '@keyframes hd-launch{0%{opacity:0;transform:translateX(0) scale(1)}8%{opacity:.9}78%{opacity:.9;transform:translateX(calc(var(--L) * .85)) scale(.35)}100%{opacity:0;transform:translateX(var(--L)) scale(.15)}}' +
      '.hd-spec{opacity:0}.st-read .hd-spec{opacity:1}.hd-sl{animation:hd-sl 3s linear infinite}@keyframes hd-sl{to{transform:translateX(-120px)}}' +
      '.hd-jets{opacity:0}.st-run .hd-jets{opacity:1}' +
      '.st-run .hd-jet{animation:hd-jet 1s ease-out both}@keyframes hd-jet{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      '.st-run .hd-jp{animation:hd-jp 1.4s ease-in-out infinite alternate}@keyframes hd-jp{from{opacity:.6}to{opacity:1}}' +
      '.hd-js{stroke-dasharray:3 22 8 40}.st-run .hd-js{animation:hd-js .8s linear infinite}@keyframes hd-js{to{stroke-dashoffset:-73}}' +
      '.hd-sg{opacity:0}.st-web .hd-sg{opacity:1;animation:hd-sg 2.8s linear infinite}@keyframes hd-sg{to{stroke-dashoffset:-.18}}' +
      '.hd-red{opacity:0}.st-error .hd-red{animation:hd-red 2.8s ease-in-out infinite}@keyframes hd-red{0%,100%{opacity:.05}50%{opacity:.22}}' +
      '.hd-flare{opacity:0}.st-done .hd-flare{animation:hd-flare 3.4s ease-out both}@keyframes hd-flare{0%{opacity:0}35%{opacity:.5}100%{opacity:.2}}' +
      '.hd-plot{animation:hd-plot 2.6s linear infinite}.hd-fast{animation-duration:1.1s}.st-thinking .hd-plot{animation-duration:13s}' +
      '@keyframes hd-plot{to{transform:translateX(-50px)}}.hd-jag{animation:hd-jag .5s steps(2) infinite}@keyframes hd-jag{to{transform:translateY(3px)}}' +
      '.hd-bk{animation:hd-bk 3.6s ease-in-out infinite alternate}@keyframes hd-bk{from{opacity:.3}to{opacity:1}}',
    scenery:
      '<defs><radialGradient id="hd-halo"><stop offset="0" stop-color="#f2b56b" stop-opacity=".3"/><stop offset=".35" stop-color="#f2b56b" stop-opacity=".1"/><stop offset="1" stop-color="#f2b56b" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="hd-dp" gradientUnits="userSpaceOnUse" x1="-360" y1="0" x2="360" y2="0"><stop offset="0" stop-color="#cfe6ff"/><stop offset=".3" stop-color="${PALE}"/><stop offset=".6" stop-color="${GOLD}"/><stop offset="1" stop-color="#d9692a"/></linearGradient>` +
      '<linearGradient id="hd-trail" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#f2b56b" stop-opacity=".9"/><stop offset="1" stop-color="#f2b56b" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hd-jetg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".55"/><stop offset=".5" stop-color="#7ab8ff" stop-opacity=".2"/><stop offset="1" stop-color="#7ab8ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="hd-redg"><stop offset="0" stop-color="#c8402a" stop-opacity=".6"/><stop offset="1" stop-color="#c8402a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hd-spg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a5ad0"/><stop offset=".3" stop-color="#2fa8b8"/><stop offset=".55" stop-color="#6bbf5a"/><stop offset=".78" stop-color="#e0b040"/><stop offset="1" stop-color="#d04a2a"/></linearGradient>' +
      '<clipPath id="hd-spc"><rect width="360" height="46"/></clipPath></defs>' +
      '<rect width="1600" height="1000" fill="#040406"/>' +
      `<g>${stars.join('')}</g>` +
      `<g transform="translate(${HOLE[0]} ${HOLE[1]})">` +
      '<circle r="560" fill="url(#hd-halo)"/>' +
      // Jets out of the poles, only while a command runs.
      `<g class="hd-jets" transform="rotate(${TILT})">` +
      [1, -1]
        .map(
          sign =>
            `<g transform="scale(1 ${sign})"><g class="hd-jet"><g class="hd-jp"><polygon points="-10,-100 10,-100 44,-1000 -44,-1000" fill="url(#hd-jetg)"/>` +
            '<polygon points="-4,-100 4,-100 12,-1000 -12,-1000" fill="#cfe6ff" fill-opacity=".35"/>' +
            '<line class="hd-js" x1="0" y1="-110" x2="0" y2="-1000" stroke="#ffffff" stroke-opacity=".8" stroke-width="2.5"/></g></g></g>',
        )
        .join('') +
      '</g>' +
      // Time ripples while thinking.
      `<g fill="none" stroke="${GOLD}" stroke-width="2">${[0, 1, 2].map(k => `<circle class="hd-rip" style="animation-delay:${-k * 3}s" r="200"/>`).join('')}</g>` +
      `${spirals}${debris}` +
      '<g transform="rotate(-6)"><circle class="hd-lens" r="206" fill="none" stroke="#ffffff" stroke-opacity=".1" stroke-width="3" stroke-dasharray="110 900"/>' +
      '<circle class="hd-lens" style="animation-direction:reverse" r="264" fill="none" stroke="#cfe6ff" stroke-opacity=".1" stroke-width="2" stroke-dasharray="70 700"/>' +
      '<circle class="hd-lens" style="animation-duration:300s" r="330" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="2" stroke-dasharray="160 1000"/></g>' +
      `<g transform="rotate(${TILT})"><path d="${band(true, 360, 160)}" fill="url(#hd-dp)" fill-opacity=".28"/>${rings(true)}` +
      // The lensed far side of the disk, wrapped over and under the shadow.
      `<path d="M-146 0A146 146 0 0 1 146 0" fill="none" stroke="url(#hd-dp)" stroke-width="12" stroke-opacity=".75"/><path d="M-146 0A146 146 0 0 0 146 0" fill="none" stroke="url(#hd-dp)" stroke-width="5" stroke-opacity=".5"/></g>` +
      `<circle r="${SHADOW}" fill="#000"/>` +
      `<circle r="${SHADOW + 4}" fill="none" stroke="${PALE}" stroke-opacity=".85" stroke-width="2.4"/><circle r="${SHADOW + 10}" fill="none" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
      `<g transform="rotate(${TILT})"><path d="${band(false, 360, 160)}" fill="url(#hd-dp)" fill-opacity=".34"/>${rings(false)}` +
      // The soft flare of a done: the same bands, brighter, fading to a faint glow.
      `<g class="hd-flare"><path d="${band(true, 360, 160)}" fill="${PALE}"/><path d="${band(false, 360, 160)}" fill="${PALE}"/><ellipse rx="400" ry="110" fill="url(#hd-halo)"/></g></g>` +
      '</g>' +
      // The probe being stretched, far from the hole.
      `<g transform="translate(380 520) rotate(${f((Math.atan2(HOLE[1] - 520, HOLE[0] - 380) * 180) / Math.PI)})"><g class="hd-pr">` +
      `<path d="M12 0L-4 -5H-10V5H-4Z" fill="#f0eadc"/><rect x="-8" y="-13" width="6" height="26" fill="#22222a" stroke="#f0eadc" stroke-opacity=".8" stroke-width="1.2"/></g></g>` +
      launch() +
      rays +
      // A wall clock at the top right: its hand slows and the face stretches while Claude thinks.
      `<g class="mv-r"><g class="mv-t"><g transform="translate(1440 150)"><g class="hd-ck"><circle r="62" fill="#0a0a10" fill-opacity=".6" stroke="${GOLD}" stroke-opacity=".45" stroke-width="3"/>` +
      `<g stroke="${GOLD}" stroke-opacity=".5" stroke-width="2.5">${tick}</g>` +
      `<line class="hd-hand" x1="0" y1="8" x2="0" y2="-50" stroke="${PALE}" stroke-opacity=".8" stroke-width="2.5"/><line class="hd-hand hd-hand2" x1="0" y1="4" x2="0" y2="-32" stroke="${GOLD}" stroke-width="4"/>` +
      `<circle r="5" fill="${GOLD}"/></g></g></g></g>` +
      // Spectrum lines, lower left, while Claude reads.
      '<g class="hd-spec" transform="translate(40 700)"><rect x="-6" y="-6" width="372" height="58" rx="4" fill="#040406" fill-opacity=".55" stroke="#f0eadc" stroke-opacity=".2"/>' +
      '<g clip-path="url(#hd-spc)"><rect width="360" height="46" fill="url(#hd-spg)" fill-opacity=".55"/>' +
      `<g class="hd-sl">${lineSet.join('')}</g></g>` +
      '<path d="M0 62H360" stroke="#f0eadc" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 12"/></g>' +
      // Redshift haze while Claude errs.
      `<ellipse class="hd-red" cx="${HOLE[0] + 80}" cy="${HOLE[1] + 60}" rx="420" ry="300" fill="url(#hd-redg)"/>`,
    nook:
      '<rect x="-80" y="456" width="520" height="16" fill="#0d0d12"/>' +
      `<line x1="-80" y1="457" x2="440" y2="457" stroke="${GOLD}" stroke-opacity=".25" stroke-width="2"/>` +
      '<rect x="424" y="60" width="6" height="270" fill="#15151a"/>' +
      `<circle class="hd-bk" cx="427" cy="54" r="6" fill="${GOLD}"/><circle class="hd-bk" cx="427" cy="54" r="26" fill="${GOLD}" fill-opacity=".1"/>` +
      `<path d="M427 120Q300 150 232 120" fill="none" stroke="#22222a" stroke-width="4"/>`,
    front: '',
  }
}
