import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Summit: a mountaineer in a fur-trimmed hood at a laptop in the door of a small tent on a ledge, high above a sea of
// clouds. A knife-edge peak towers at the left with a long ice slope. When a command runs an avalanche roars down it.
const ICE = '#8ec8ff'
const GOLD = '#ffcf6a'
const FLAG_COLORS = ['#4a78c8', '#d8d8d0', '#c0463c', '#4ea66a', '#d8b43c']
const FABRIC = '#6a3a1c'
const FABRIC_EDGE = '#b8683a'
const FUR = '#d8cfc0'

type Point = readonly [number, number]

/** A point on a quadratic curve. */
function quad(p0: Point, p1: Point, p2: Point, t: number): [number, number] {
  const u = 1 - t

  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}

/** A string of plain coloured prayer flags hung in a sag between two points. */
function flagString(a: Point, b: Point, sag: number, count: number, size: number, seed: number): string {
  const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag]
  const r = random(seed)
  const flags = Array.from({ length: count }, (_, i) => {
    const [x, y] = quad(a, mid, b, (i + 0.5) / count)

    return (
      `<rect class="su-fg" x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size * 0.75)}" fill="${FLAG_COLORS[i % 5]}" fill-opacity=".85" ` +
      `style="animation-delay:${f(-r() * 2)}s"/>`
    )
  }).join('')

  return `<path d="M${a[0]} ${a[1]}Q${f(mid[0])} ${f(mid[1])} ${b[0]} ${b[1]}" stroke="#2a3548" stroke-width="2.4" fill="none"/>${flags}`
}

/** The laptop with frosted edges and the little gas stove with its pot, at the right of the desk. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#2a3340" stroke="#5a6a80" stroke-width="1.2"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#2a3340" stroke="#5a6a80" stroke-width="1.2"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M338 238L348 238M352 242L360 242" stroke="#e8f2ff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
    // The stove: a canister, a burner, three pot legs and the pot with its lid.
    '<rect x="390" y="314" width="20" height="16" rx="3" fill="#3a4a5a" stroke="#6a7a90" stroke-width="1.4"/>' +
    '<path d="M394 314H406L404 306H396Z" fill="#2a3340"/>' +
    '<path d="M388 306L384 296M412 306L416 296" stroke="#6a7a90" stroke-width="2.4" stroke-linecap="round"/>' +
    '<g class="su-fl"><ellipse cx="400" cy="302" rx="9" ry="12" fill="url(#su-flame)"/>' +
    '<path d="M400 312C394 304 396 296 400 290C404 296 406 304 400 312Z" fill="#bfe4ff" fill-opacity=".9"/></g>' +
    '<circle class="su-fg2" cx="400" cy="300" r="50" fill="url(#su-hot)"/>' +
    '<path d="M382 278H418V294H382Z" fill="#3a4a5a" stroke="#8aa0b8" stroke-width="1.6"/><path d="M380 278H420" stroke="#8aa0b8" stroke-width="3" stroke-linecap="round"/>' +
    '<path class="su-st" d="M396 270C392 258 404 254 400 242" stroke="#dfeaff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>'
  )
}

export function summitWorld(): World {
  const next = random(73)
  const stars = Array.from({ length: 95 }, (_, i) => {
    const x = next() * 1600
    const y = next() * 640
    const r = 0.7 + next() * 1.3

    return `<circle${i % 7 === 0 ? ` class="su-tw" style="animation-delay:${f(-next() * 3)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#dfe9ff" fill-opacity="${f(0.3 + next() * 0.4)}"/>`
  }).join('')

  const range = (base: number, amp: number, fill: string, seed: number, x0: number): string => {
    const r = random(seed)
    let d = `M${x0} 800L${x0} ${base}`

    for (let x = x0; x < 1700; x += 40 + r() * 60) d += `L${f(x)} ${f(base - r() * amp)}`

    return `<path d="${d}L1700 800Z" fill="${fill}"/>`
  }

  const cloudLayer = (y: number, count: number, fill: string, seed: number, cls: string): string => {
    const r = random(seed)
    const puffs = Array.from({ length: count }, (_, i) => {
      const x = -100 + (i / count) * 1900 + r() * 80

      return `<ellipse cx="${f(x)}" cy="${f(y + r() * 40)}" rx="${f(110 + r() * 110)}" ry="${f(34 + r() * 36)}" fill="${fill}"/>`
    }).join('')

    return `<g class="${cls}">${puffs}</g>`
  }

  const route: [number, number][] = [
    [60, 690], [110, 640], [95, 590], [150, 560], [135, 510], [180, 470], [170, 420], [205, 380], [195, 330], [225, 290], [218, 240], [236, 200], [242, 160],
  ]
  const lamps = route
    .map(([x, y], i) => `<g class="su-lp" style="animation-delay:${f(-i * 0.37)}s"><circle cx="${x}" cy="${y}" r="9" fill="#ffe9b0" fill-opacity=".18"/><circle cx="${x}" cy="${y}" r="2.4" fill="#fff0c8"/></g>`)
    .join('')

  const avalanche = Array.from({ length: 12 }, (_, i) => {
    const r = 42 + (i % 4) * 14

    return `<circle class="su-av" cx="${f(330 + (i % 3) * 14)}" cy="${f(290 + (i % 4) * 10)}" r="${r}" fill="url(#su-snow)" style="animation-delay:${f(i * 0.16)}s"/>`
  }).join('')

  const drift = Array.from({ length: 16 }, (_, i) => {
    const y = 80 + next() * 800

    return `<ellipse class="su-sp" cx="1700" cy="${f(y)}" rx="${f(90 + next() * 120)}" ry="${f(2.4 + next() * 3)}" fill="#e8f2ff" style="animation-delay:${f(-i * 0.19)}s;animation-duration:${f(1.3 + next() * 0.8)}s"/>`
  }).join('')

  const rays = Array.from({ length: 6 }, (_, i) => `<path d="M-80 720L${f(700 + i * 160)} ${f(60 + i * 40)}L${f(780 + i * 160)} ${f(90 + i * 40)}Z" fill="url(#su-ray)"/>`).join('')

  const crevasses = '<path d="M300 330L350 350M330 420L400 436M380 500L450 520M300 230L330 244M360 580L440 600M270 290L292 300" stroke="#0e1628" stroke-opacity=".8" stroke-width="3" stroke-linecap="round" fill="none"/>'
  const streaks = '<path d="M284 200L310 330L370 450L470 580M290 260L350 430L440 560M300 150L330 300L420 480" stroke="#bcd4ff" stroke-opacity=".16" stroke-width="3" fill="none"/>'

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'mug',
      thought: 'puffs',
      ink: '#05080f',
      furniture: '#2a3340',
      metal: '#2a3340',
      paper: '#e8f0ff',
      light: { idle: '#7fb0d8', work: '#bfe4ff', bright: '#ffffff' },
      headTop: 198,
      glowAt: [340, 282],
      device,
      wear: {
        front:
          // The hood, shell side, with a ring of fur around the open face; the goggles pushed up on the brow.
          '<path d="M60 250C58 212 96 192 150 192C204 192 242 212 240 250Z" fill="#c8552d" stroke="#7a2e14" stroke-width="3" stroke-linejoin="round"/>' +
          '<path d="M84 218C100 204 126 198 150 198" stroke="#f08a5a" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          `<g fill="${FUR}"><rect x="62" y="238" width="176" height="16" rx="8"/><rect x="62" y="248" width="34" height="46" rx="14"/><rect x="204" y="248" width="34" height="38" rx="14"/></g>` +
          '<g fill="#9a907f" fill-opacity=".6"><circle cx="86" cy="246" r="3"/><circle cx="122" cy="244" r="3"/><circle cx="160" cy="246" r="3"/><circle cx="196" cy="244" r="3"/><circle cx="224" cy="250" r="3"/></g>' +
          '<path d="M96 222C110 208 190 208 204 222" stroke="#1a1f2a" stroke-width="6" fill="none" stroke-linecap="round"/>' +
          `<circle cx="122" cy="224" r="15" fill="#7fb8e0" fill-opacity=".45" stroke="#1a1f2a" stroke-width="4"/><circle cx="178" cy="224" r="15" fill="#7fb8e0" fill-opacity=".45" stroke="#1a1f2a" stroke-width="4"/>` +
          '<path d="M114 218L128 212" stroke="#e8f4ff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>' +
          // A chest harness with a carabiner.
          '<path d="M96 330L150 350M204 330L150 350" stroke="#e8c030" stroke-width="5" fill="none"/>' +
          '<rect x="143" y="340" width="14" height="14" rx="4" fill="none" stroke="#c8d4e0" stroke-width="3"/>',
      },
      seatArt:
        '<path d="M104 350H198L206 456H96Z" fill="#1a2230" stroke="#3a4a60" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M100 400H204M98 428H206" stroke="#c8552d" stroke-opacity=".7" stroke-width="5"/>' +
        '<rect x="102" y="344" width="96" height="10" rx="5" fill="#2a3a50" stroke="#4a5e7a" stroke-width="1.6"/>',
      tableArt:
        '<rect x="166" y="330" width="304" height="16" rx="3" fill="#1a2230" stroke="#4a5e7a" stroke-width="2"/>' +
        '<path d="M176 346H206V456H176ZM426 346H456V456H426Z" fill="#141b28" stroke="#3a4a60" stroke-width="2"/>' +
        '<path d="M172 396H460" stroke="#c8552d" stroke-opacity=".7" stroke-width="6"/>' +
        '<path d="M240 348V396M320 348V396M380 348V396" stroke="#2a3548" stroke-width="3"/>' +
        '<g fill="#8ec8ff" fill-opacity=".55"><rect x="168" y="328" width="60" height="4" rx="2"/><rect x="330" y="328" width="90" height="4" rx="2"/></g>',
    },
    style:
      '.su-tw{animation:su-tw 3.4s ease-in-out infinite alternate}@keyframes su-tw{from{opacity:.25}to{opacity:1}}' +
      '.su-lp{animation:su-lp 2.4s ease-in-out infinite alternate}@keyframes su-lp{from{opacity:.55}to{opacity:1}}' +
      '.su-cl{animation:su-drift 60s ease-in-out infinite alternate}.su-cl2{animation-duration:80s;animation-direction:alternate-reverse}.su-cl3{animation-duration:46s}' +
      '@keyframes su-drift{to{transform:translateX(70px)}}' +
      // Flags flutter; in a gust they whip hard.
      '.su-fg{transform-box:fill-box;transform-origin:0 50%;animation:su-fg 1.1s ease-in-out infinite alternate}@keyframes su-fg{from{transform:skewY(-9deg) scaleX(1)}to{transform:skewY(9deg) scaleX(.86)}}' +
      '.st-error .su-fg{animation:su-fgw .22s ease-in-out infinite alternate}@keyframes su-fgw{from{transform:skewY(-24deg) scaleX(.7)}to{transform:skewY(20deg) scaleX(1.1)}}' +
      '.su-flag{transform-box:fill-box;transform-origin:0 50%;opacity:0}.st-done .su-flag{animation:su-show 1.2s ease-out 1.6s both,su-fg .5s ease-in-out 1.6s infinite alternate}' +
      '@keyframes su-show{to{opacity:1}}' +
      // The tent flaps; a gust snaps them.
      '.su-flap{transform-box:fill-box;transform-origin:50% 0;animation:su-flap 3.8s ease-in-out infinite alternate}.su-flap2{animation-direction:alternate-reverse}' +
      '@keyframes su-flap{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}' +
      '.st-error .su-flap{animation:su-snap .3s ease-in-out infinite alternate}.st-error .su-flap2{animation-name:su-snap2}' +
      '@keyframes su-snap{from{transform:rotate(-6deg)}to{transform:rotate(7deg)}}@keyframes su-snap2{from{transform:rotate(6deg)}to{transform:rotate(-7deg)}}' +
      // Spindrift: soft streaks blown sideways, only in a gust.
      '.su-sp{opacity:0}.st-error .su-sp{animation:su-sp 1.6s linear infinite}' +
      '@keyframes su-sp{0%{opacity:0;transform:translateX(0)}15%{opacity:.18}85%{opacity:.16}100%{opacity:0;transform:translateX(-2100px)}}' +
      // The stove.
      '.su-fl{transform-box:fill-box;transform-origin:50% 100%;animation:su-fl .6s ease-in-out infinite alternate}@keyframes su-fl{from{transform:scale(.8,.75)}to{transform:scale(1,1)}}' +
      '.st-tool .su-fl{animation:su-roar .45s ease-in-out infinite alternate}@keyframes su-roar{from{transform:scale(1.5,1.7)}to{transform:scale(1.9,2.3)}}' +
      '.su-fg2{opacity:.25;animation:su-hot 1.4s ease-in-out infinite alternate}.st-tool .su-fg2{opacity:.7}@keyframes su-hot{from{transform:scale(.9)}to{transform:scale(1.05)}}' +
      '.su-fg2{transform-box:fill-box;transform-origin:center}' +
      '.su-st{opacity:0;animation:su-steam 3s ease-out infinite}.st-tool .su-st{animation-duration:1.2s}@keyframes su-steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.5}100%{opacity:0;transform:translateY(-26px)}}' +
      // The radio antenna sends rings.
      '.su-ring{opacity:0;transform-box:fill-box;transform-origin:center}.st-web .su-ring{animation:su-ring 2.4s ease-out infinite}' +
      '@keyframes su-ring{0%{opacity:.7;transform:scale(.15)}100%{opacity:0;transform:scale(3.4)}}' +
      '.su-beacon{animation:su-tw 1.4s ease-in-out infinite alternate}' +
      // The avalanche: a rolling white cloud down the far slope.
      '.su-av,.su-pw{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .su-av{animation:su-av 3.2s ease-in infinite}' +
      '@keyframes su-av{0%{opacity:0;transform:translate(0,0) scale(.4)}12%{opacity:.5}80%{opacity:.42;transform:translate(250px,430px) scale(2.2)}100%{opacity:0;transform:translate(290px,470px) scale(2.3)}}' +
      '.st-run .su-pw{animation:su-pw 3.2s ease-out infinite}@keyframes su-pw{0%{opacity:0;transform:scale(.3)}60%{opacity:.25}100%{opacity:0;transform:scale(1.2)}}' +
      // Done: alpenglow on the tip, rays, a summit flag.
      '.su-gold,.su-dawn,.su-rays{opacity:0}.st-done .su-gold{animation:su-show 2.4s ease-out .4s both}' +
      '.st-done .su-dawn{animation:su-dawn 3s ease-out .2s both}.st-done .su-rays{animation:su-dawn 3.4s ease-out .8s both}@keyframes su-dawn{to{opacity:.32}}',
    scenery:
      '<defs>' +
      '<linearGradient id="su-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040a"/><stop offset=".6" stop-color="#091226"/><stop offset="1" stop-color="#14264a"/></linearGradient>' +
      '<linearGradient id="su-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a7aa8"/><stop offset=".5" stop-color="#34496e"/><stop offset="1" stop-color="#1a2840"/></linearGradient>' +
      '<radialGradient id="su-snow"><stop offset="0" stop-color="#f2f8ff" stop-opacity=".7"/><stop offset=".6" stop-color="#cfe0f8" stop-opacity=".35"/><stop offset="1" stop-color="#cfe0f8" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="su-flame"><stop offset="0" stop-color="#bfe4ff"/><stop offset=".5" stop-color="#5aa8ff" stop-opacity=".8"/><stop offset="1" stop-color="#2a6aff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="su-hot"><stop offset="0" stop-color="#9ad0ff" stop-opacity=".5"/><stop offset="1" stop-color="#9ad0ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="su-gl"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".85"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="su-ray" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".7"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#su-sky)"/>' +
      '<ellipse cx="900" cy="260" rx="900" ry="90" fill="#4a64a0" fill-opacity=".1" transform="rotate(-28 900 260)"/>' +
      stars +
      // Distant ranges above the clouds.
      range(690, 90, '#0c1528', 5, 620) +
      range(730, 60, '#101b33', 6, 380) +
      '<ellipse class="su-dawn" cx="300" cy="800" rx="1000" ry="260" fill="url(#su-gl)"/>' +
      `<g class="su-rays">${rays}</g>` +
      // The peak: a dark west face and the long moonlit ice slope to the right.
      '<path d="M260 70L215 170L170 300L120 430L40 560L-60 780L290 780L250 560L236 400L252 240Z" fill="#16223a" stroke="#2c3e60" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M260 70L282 170L300 300L340 420L420 540L520 650L660 780L290 780L250 560L236 400L252 240Z" fill="url(#su-ice)" stroke="#6a88b8" stroke-opacity=".5" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M260 70L252 240L236 400L250 560L290 780" stroke="#9db8e0" stroke-opacity=".45" stroke-width="3" fill="none"/>' +
      streaks +
      crevasses +
      '<path d="M170 300L205 330M120 430L170 455M215 170L238 190" stroke="#1c2a44" stroke-width="3" fill="none"/>' +
      '<path d="M222 150L170 300M165 316L120 430" stroke="#3a4e72" stroke-opacity=".6" stroke-width="2" fill="none"/>' +
      // The headlamps of the climbers.
      `<g>${lamps}</g>` +
      // Alpenglow on the tip and the summit flag.
      '<circle class="su-gold" cx="260" cy="110" r="130" fill="url(#su-gl)"/>' +
      `<path class="su-gold" d="M260 70L226 160L246 172L254 150L272 186L284 172Z" fill="${GOLD}"/>` +
      '<path d="M260 70V40" stroke="#cfd8e8" stroke-width="3"/>' +
      '<path class="su-flag" d="M260 40L296 48L260 58Z" fill="#c0463c"/>' +
      // The avalanche.
      `<g>${avalanche}<ellipse class="su-pw" cx="440" cy="560" rx="170" ry="110" fill="url(#su-snow)"/><ellipse class="su-pw" style="animation-delay:.9s" cx="580" cy="700" rx="200" ry="90" fill="url(#su-snow)"/></g>` +
      // The sea of clouds.
      '<rect y="740" width="1600" height="300" fill="#0d1626"/>' +
      cloudLayer(730, 12, '#1a2c4a', 11, 'su-cl') +
      cloudLayer(790, 11, '#16253f', 12, 'su-cl su-cl2') +
      cloudLayer(870, 10, '#101c32', 13, 'su-cl su-cl3') +
      cloudLayer(950, 9, '#0b1424', 14, 'su-cl su-cl2') +
      // A long string of flags across the top right.
      `<g class="mv-r"><g class="mv-t">${flagString([860, 4], [1600, 150], 90, 15, 20, 21)}</g></g>` +
      `<g>${drift}</g>`,
    nook:
      // The ledge, the tent with its doorway and flaps, guy lines and flags, an antenna mast and the ice axes.
      '<path d="M-200 444C-120 436 60 442 200 440C320 438 420 442 520 440V480H-200Z" fill="#101826" stroke="#8fa8c8" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M-60 442C-40 430 -10 430 10 442M250 440C270 428 300 428 330 440" stroke="#d8e4f8" stroke-opacity=".5" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      `<path d="M200 30L-110 446H520L200 30Z" fill="${FABRIC}" stroke="${FABRIC_EDGE}" stroke-opacity=".7" stroke-width="3" stroke-linejoin="round"/>` +
      '<path d="M200 30L40 446M200 30L340 446" stroke="#3a1e10" stroke-opacity=".6" stroke-width="3"/>' +
      '<path d="M-30 446C-30 290 50 170 150 146C250 170 350 290 340 446Z" fill="#06080e"/>' +
      '<ellipse cx="150" cy="380" rx="150" ry="110" fill="url(#su-hot)" fill-opacity=".35"/>' +
      `<path class="su-flap" d="M128 130C60 180 10 300 -34 446H-110C-70 290 30 160 128 130Z" fill="${FABRIC}" stroke="${FABRIC_EDGE}" stroke-opacity=".7" stroke-width="3"/>` +
      `<path class="su-flap su-flap2" d="M176 130C250 180 310 300 346 446H424C390 290 280 160 176 130Z" fill="${FABRIC}" stroke="${FABRIC_EDGE}" stroke-opacity=".7" stroke-width="3"/>` +
      '<path d="M-20 446L-130 460M360 446L470 460" stroke="#c8d4e0" stroke-opacity=".5" stroke-width="2"/>' +
      flagString([200, 30], [420, -40], 40, 5, 16, 33) +
      flagString([200, 30], [-30, -110], 50, 6, 16, 34) +
      // The ice axes planted beside the door and a coil of rope.
      '<g stroke="#9aa8bc" stroke-width="4" stroke-linecap="round" fill="none"><path d="M-44 440L-30 262M-14 440L2 276"/><path d="M-52 266L-24 258L-26 272M-6 280L22 272L20 286" stroke="#c8d4e0"/></g>' +
      '<ellipse cx="80" cy="440" rx="22" ry="6" fill="none" stroke="#e8a030" stroke-width="4"/><ellipse cx="80" cy="436" rx="18" ry="5" fill="none" stroke="#e8a030" stroke-width="3"/>' +
      // The radio mast on its pole, its rings and a beacon.
      '<path d="M410 440V60" stroke="#6a7a90" stroke-width="4"/><path d="M398 80H422M402 96H418" stroke="#6a7a90" stroke-width="3"/>' +
      '<circle class="su-beacon" cx="410" cy="56" r="5" fill="#ff8a7a"/>' +
      '<g transform="translate(410 56)"><circle class="su-ring" r="30" fill="none" stroke="#7fd4ff" stroke-width="3"/><circle class="su-ring" style="animation-delay:.8s" r="30" fill="none" stroke="#7fd4ff" stroke-width="3"/><circle class="su-ring" style="animation-delay:1.6s" r="30" fill="none" stroke="#7fd4ff" stroke-width="3"/></g>',
  }
}
