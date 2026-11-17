import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Pharaoh's Tomb: a scribe in a striped headcloth at a carved stone altar between two torches, in a torchlit hall of
// giant seated statues. Through the great doorway the night desert and its pyramids lie under a huge moon. When a
// command runs the stone door grinds up and sand pours; on an error scarabs swarm the walls and the torches gutter.
const GOLD = '#d4a537'
const LAPIS = '#1f4aa8'
const TURQ = '#3fb8a8'
const STONE = '#1d1626'
const STONE_HI = '#1f1828'
const BRONZE = '#6a4a22'
const SAND = '#d8b878'
const PAPYRUS = '#d8c48a'
const FLAME = '#ffb347'

/** Invented carved marks on a grid, as one path: circles, lenses, bars, zigzags, steps. Never real writing. */
function glyphs(seed: number, x: number, y: number, cols: number, rows: number, cw: number, ch: number): string {
  const f = (n: number) => String(Math.round(n))
  const next = random(seed)
  const s = Math.min(cw, ch) * 0.3
  let d = ''

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = x + c * cw + cw / 2
      const cy = y + r * ch + ch / 2
      const t = Math.floor(next() * 7)

      switch (t) {
        case 0:
          d += `M${f(cx + s)} ${f(cy)}a${f(s)} ${f(s)} 0 1 0 ${f(-2 * s)} 0a${f(s)} ${f(s)} 0 1 0 ${f(2 * s)} 0M${f(cx)} ${f(cy - 1)}h.1`
          break
        case 1:
          d += `M${f(cx - s)} ${f(cy + s * 0.4)}l${f(s * 0.5)} ${f(-s * 0.8)}l${f(s * 0.5)} ${f(s * 0.8)}l${f(s * 0.5)} ${f(-s * 0.8)}l${f(s * 0.5)} ${f(s * 0.8)}`
          break
        case 2:
          d += `M${f(cx - s)} ${f(cy)}Q${f(cx)} ${f(cy - s * 1.2)} ${f(cx + s)} ${f(cy)}Q${f(cx)} ${f(cy + s * 1.2)} ${f(cx - s)} ${f(cy)}M${f(cx)} ${f(cy)}h.1`
          break
        case 3:
          d += `M${f(cx - s * 0.7)} ${f(cy + s)}V${f(cy - s * 0.2)}M${f(cx)} ${f(cy + s)}V${f(cy - s)}M${f(cx + s * 0.7)} ${f(cy + s)}V${f(cy + s * 0.1)}`
          break
        case 4:
          d += `M${f(cx - s)} ${f(cy + s)}H${f(cx + s)}M${f(cx - s * 0.65)} ${f(cy + s * 0.3)}H${f(cx + s * 0.65)}M${f(cx - s * 0.3)} ${f(cy - s * 0.4)}H${f(cx + s * 0.3)}`
          break
        case 5:
          d += `M${f(cx - s)} ${f(cy + s)}Q${f(cx)} ${f(cy - s * 1.6)} ${f(cx + s)} ${f(cy + s)}M${f(cx)} ${f(cy - s * 0.2)}V${f(cy + s)}`
          break
        default:
          d += `M${f(cx - s)} ${f(cy)}H${f(cx + s)}M${f(cx)} ${f(cy - s)}V${f(cy + s)}M${f(cx - s * 0.6)} ${f(cy - s * 0.6)}L${f(cx + s * 0.6)} ${f(cy + s * 0.6)}`
      }
    }
  }

  return d
}

/** A wall torch around its own bracket at (0, 0): glow, stick, bronze cup and a flame that flickers. */
function torch(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    '<circle class="ph-tg" cy="-30" r="190" fill="url(#ph-glow)"/>' +
    '<path d="M-5 0H5L7 92H-7Z" fill="#3a2a1c"/>' +
    `<path d="M-15 -6H15L9 12H-9Z" fill="${BRONZE}" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.6"/>` +
    '<path d="M-9 60H9V68H-9Z" fill="#2a1d12"/>' +
    '<g class="ph-fl"><path d="M0 -64C-17 -40 -15 -18 0 -8C15 -18 17 -40 0 -64Z" fill="url(#ph-fire)"/>' +
    '<path d="M0 -40C-6 -28 -5 -17 0 -10C5 -17 6 -28 0 -40Z" fill="#fff6c8"/></g></g>'
  )
}

/** A giant seated statue, facing us: throne, knees, hands, torso, a striped headcloth. Local y up is negative. */
function statue(cx: number, base: number, s: number, rimSeed: string): string {
  const stripes = [-338, -322, -306]
    .map(y => `<path d="M-30 ${y}H30" stroke="${rimSeed}" stroke-opacity=".5" stroke-width="3"/>`)
    .join('')

  return (
    `<g transform="translate(${cx} ${base}) scale(${s})" fill="${STONE}" stroke="${GOLD}" stroke-opacity=".42" stroke-width="2.6" stroke-linejoin="round">` +
    '<path d="M-98 0V-100H98V0Z"/><rect x="-76" y="-310" width="152" height="214" fill="#171220"/>' +
    '<rect x="-62" y="-104" width="46" height="102"/><rect x="16" y="-104" width="46" height="102"/>' +
    '<rect x="-72" y="-160" width="64" height="62" fill="#1b1523"/><rect x="8" y="-160" width="64" height="62" fill="#1b1523"/>' +
    '<rect x="-72" y="-186" width="40" height="26" fill="#1f1828"/><rect x="32" y="-186" width="40" height="26" fill="#1f1828"/>' +
    '<path d="M-56 -160L-64 -292H64L56 -160Z" fill="#1c1624"/><rect x="-82" y="-292" width="26" height="110" fill="#1f1828"/><rect x="56" y="-292" width="26" height="110" fill="#1f1828"/>' +
    `<rect x="-26" y="-350" width="52" height="60" fill="${STONE_HI}"/>` +
    `<path d="M-38 -360H38L68 -286H36V-336H-36V-286H-68Z" fill="${LAPIS}" fill-opacity=".55"/>` +
    '<path d="M-10 -304H10" stroke-width="3"/>' +
    stripes +
    `<path d="M-26 -350V-296M26 -350V-296" stroke="${GOLD}" stroke-opacity=".25"/></g>`
  )
}

/** The golden sun disk with its rays, around (0, 0). */
function sunDisk(r: number): string {
  let rays = ''

  for (let i = 0; i < 16; i += 1) {
    const a = (i * 22.5 * Math.PI) / 180

    rays += `M${f(Math.cos(a) * (r + 6))} ${f(Math.sin(a) * (r + 6))}L${f(Math.cos(a) * (r + 22))} ${f(Math.sin(a) * (r + 22))}`
  }

  return `<path d="${rays}" stroke="${GOLD}" stroke-width="3" fill="none"/><circle r="${r}" fill="#8a6a22" stroke="${GOLD}" stroke-width="4"/><circle r="${f(r * 0.6)}" fill="none" stroke="#ffe08a" stroke-opacity=".8" stroke-width="2.4"/><circle r="${f(r * 0.22)}" fill="#ffe08a"/>`
}

/** A scarab beetle heading up from (0, 0). */
function scarab(): string {
  return (
    '<ellipse rx="7" ry="9" fill="#0b0c14" stroke="#3fb8a8" stroke-opacity=".85" stroke-width="1.4"/><circle cy="-10" r="3.4" fill="#0b0c14" stroke="#3fb8a8" stroke-opacity=".7" stroke-width="1"/>' +
    '<path d="M0 -8V8" stroke="#3fb8a8" stroke-opacity=".6" stroke-width="1"/>' +
    '<path d="M-6 -4L-12 -8M-7 1L-13 1M-6 6L-12 10M6 -4L12 -8M7 1L13 1M6 6L12 10" stroke="#3fb8a8" stroke-opacity=".7" stroke-width="1.4" fill="none"/>'
  )
}

/** The laptop beside a rolled papyrus that hangs down the altar and unrolls while Claude reads. */
function device(light: string, _activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 11}" y="325" width="7" height="3" fill="${light}" fill-opacity=".55"/>`).join('')

  return (
    '<rect x="246" y="323" width="92" height="7" rx="2" fill="#2d2630" stroke="#d4a537" stroke-opacity=".5"/>' +
    keys +
    '<path d="M328 327L350 238L360 240L338 329Z" fill="#2d2630" stroke="#d4a537" stroke-opacity=".5" stroke-width="1.2"/>' +
    `<path d="M329 324L349 242L353 243L333 326Z" fill="${light}"/>` +
    `<path d="M329 324L349 242L338 246L322 324Z" fill="${light}" fill-opacity=".2"/>` +
    // The papyrus: a roll on the altar's edge and a sheet that hangs down its face.
    `<g class="ph-scroll"><rect x="378" y="342" width="34" height="76" fill="${PAPYRUS}" fill-opacity=".92" stroke="#8a7a48" stroke-width="1.6"/>` +
    '<path d="M384 354H406M384 364H400M384 374H406M384 384H396M384 394H404M384 404H398" stroke="#5a4a2a" stroke-width="2.2"/></g>' +
    `<rect x="372" y="330" width="46" height="14" rx="7" fill="${PAPYRUS}" stroke="#8a7a48" stroke-width="1.6"/>` +
    `<circle cx="376" cy="337" r="5" fill="none" stroke="#8a7a48" stroke-width="1.4"/><circle cx="414" cy="337" r="5" fill="none" stroke="#8a7a48" stroke-width="1.4"/>`
  )
}

export function pharaohWorld(): World {
  const next = random(311)
  const stars = Array.from({ length: 16 }, () => `<circle cx="${f(100 + next() * 320)}" cy="${f(270 + next() * 250)}" r="${f(0.8 + next() * 1)}" fill="#e6ecff" fill-opacity="${f(0.4 + next() * 0.5)}"/>`).join('')
  const masonry =
    Array.from({ length: 12 }, (_, i) => `M0 ${150 + i * 74}H1600`).join('') +
    Array.from({ length: 12 }, (_, i) => Array.from({ length: 9 }, (_, j) => `M${(j * 190 + (i % 2) * 95) % 1700} ${150 + i * 74}v74`).join('')).join('')
  // Sequential light: each carving group gets a position 0..1 across the picture.
  const panels = Array.from({ length: 7 }, (_, i) => {
    const x = 800 + i * 66
    const t = (x / 1600).toFixed(2)

    return (
      `<g class="ph-car" style="--i:${t}"><rect x="${x}" y="300" width="52" height="400" fill="#100c16" stroke="${GOLD}" stroke-opacity=".4" stroke-width="2"/>` +
      `<path d="${glyphs(60 + i, x + 6, 316, 2, 8, 20, 46)}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/></g>`
    )
  }).join('')
  const frieze = [0, 1, 2, 3, 4, 5, 6, 7]
    .map(
      i =>
        `<g class="ph-car" style="--i:${(i / 8 + 0.06).toFixed(2)}"><path d="${glyphs(90 + i, 20 + i * 196, 46, 6, 2, 32, 28)}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/></g>`,
    )
    .join('')
  const trickles = [
    [560, 120, 330],
    [760, 150, 360],
    [1130, 130, 300],
    [1530, 160, 420],
    [700, 560, 320],
  ]
    .map(
      ([x, y, h], i) =>
        `<path d="M${x} ${(y as number) - 16}l6 8l-6 8" fill="none" stroke="#050408" stroke-width="2"/>` +
        `<path class="ph-sand" style="animation-delay:${f(-i * 0.37)}s" d="M${x} ${y}V${(y as number) + (h as number)}" stroke="${SAND}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="2 10" fill="none"/>`,
    )
    .join('')
  const motes = Array.from({ length: 14 }, (_, i) => `<circle class="ph-mote" style="animation-delay:${f(-i * 0.9)}s;--dx:${f((next() - 0.5) * 60)}px" cx="${f(100 + next() * 1400)}" cy="${f(300 + next() * 500)}" r="${f(1.2 + next() * 1.6)}" fill="${SAND}"/>`).join('')
  const pour = Array.from({ length: 17 }, (_, i) => `<path class="ph-pour" style="animation-delay:${f(-next())}s" d="M${100 + i * 19.5} 250V760" stroke="${SAND}" stroke-width="${f(2 + next() * 1.8)}" stroke-dasharray="${f(8 + next() * 10)} ${f(30 + next() * 30)}" fill="none"/>`).join('')
  const scarabs = Array.from({ length: 26 }, (_, i) => {
    const y = 190 + next() * 560
    const right = i % 2 === 0
    const seconds = 4.5 + next() * 3.5

    return (
      `<g transform="translate(0 ${f(y)})"><g class="ph-sc" style="--x0:${right ? -60 : 1660}px;--x1:${right ? 1660 : -60}px;animation-duration:${f(seconds)}s;animation-delay:${f(-next() * seconds)}s">` +
      `<g transform="rotate(${right ? 90 : -90}) scale(${f(1.7 + next() * 0.8)})"><g class="ph-leg" style="animation-delay:${f(-next())}s">${scarab()}</g></g></g></g>`
    )
  }).join('')

  const lintelMarks = glyphs(120, 40, 178, 5, 2, 36, 32) + glyphs(121, 310, 178, 5, 2, 36, 32)
  const altarMarks = glyphs(7, 204, 362, 10, 2, 24, 32)

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#08060c',
      furniture: STONE_HI,
      metal: '#2d2630',
      paper: PAPYRUS,
      light: { idle: '#6aa9a0', work: '#7fe0d0', bright: '#c8fff4' },
      headTop: 186,
      glowAt: [338, 282],
      device,
      wear: {
        front:
          // The striped headcloth: a blue dome with gold stripes, a gold brow band, two lappets and a cobra.
          // Everything stays above y 252 on the face, so the eyes are clear.
          `<path d="M88 250C86 216 112 202 150 202C188 202 214 216 212 250Z" fill="${LAPIS}"/>` +
          `<g fill="${GOLD}"><rect x="108" y="212" width="84" height="5"/><rect x="96" y="224" width="108" height="5"/><rect x="90" y="236" width="120" height="5"/></g>` +
          `<rect x="86" y="244" width="128" height="9" fill="${GOLD}"/><g fill="${LAPIS}"><rect x="100" y="246" width="6" height="5"/><rect x="128" y="246" width="6" height="5"/><rect x="166" y="246" width="6" height="5"/><rect x="194" y="246" width="6" height="5"/></g>` +
          [0, 1, 2, 3, 4, 5]
            .map(
              k =>
                `<rect x="62" y="${250 + k * 13}" width="26" height="13" fill="${k % 2 ? GOLD : LAPIS}"/><rect x="212" y="${250 + k * 13}" width="26" height="13" fill="${k % 2 ? GOLD : LAPIS}"/>`,
            )
            .join('') +
          `<path d="M143 206Q138 192 148 186Q160 188 157 206Z" fill="${GOLD}" stroke="#8a6a22" stroke-width="1.6"/><circle cx="150" cy="193" r="1.8" fill="#08060c"/>` +
          // The broad collar of three arcs, under the eyes.
          `<g fill="none" stroke-width="5"><path d="M92 322Q150 366 208 322" stroke="${GOLD}"/><path d="M100 322Q150 356 200 322" stroke="${LAPIS}"/><path d="M108 322Q150 346 192 322" stroke="${TURQ}"/></g>`,
      },
      seatArt:
        `<g fill="${STONE_HI}" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"><rect x="106" y="350" width="90" height="106"/><rect x="100" y="346" width="102" height="10" fill="#241c2e"/>` +
        '<path d="M120 380H182M120 400H170M120 420H182" stroke-opacity=".25"/></g>',
      tableArt:
        `<g fill="${STONE}" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"><rect x="166" y="344" width="304" height="112"/><rect x="160" y="330" width="316" height="16" fill="#241c2e"/>` +
        `<rect x="192" y="356" width="260" height="84" fill="#120e18"/></g><path d="${altarMarks}" fill="none" stroke="${GOLD}" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/>` +
        `<path d="M162 338H474" stroke="${GOLD}" stroke-opacity=".5" stroke-width="1.6"/>`,
    },
    style:
      '.ph-fl{transform-box:fill-box;transform-origin:50% 100%;animation:ph-fl .6s ease-in-out infinite alternate}' +
      '@keyframes ph-fl{from{transform:scale(.92,.88)}to{transform:scale(1.06,1.12)}}' +
      '.ph-tg{transform-box:fill-box;transform-origin:center;animation:ph-tg 2.2s ease-in-out infinite alternate}@keyframes ph-tg{from{opacity:.75}to{opacity:1}}' +
      // The torches flare when a tool runs, and gutter when something breaks.
      '.st-tool .ph-fl{animation:ph-flare .55s ease-in-out infinite alternate}@keyframes ph-flare{from{transform:scale(1.15,1.3)}to{transform:scale(1.4,1.7)}}' +
      '.st-tool .ph-tg{animation:ph-tgf .8s ease-in-out infinite alternate}@keyframes ph-tgf{from{opacity:.9;transform:scale(1.1)}to{opacity:1;transform:scale(1.3)}}' +
      '.st-error .ph-fl{animation:ph-gut 1.3s ease-in-out infinite}@keyframes ph-gut{0%,100%{transform:scale(.55,.35)}30%{transform:scale(.7,.6)}55%{transform:scale(.45,.28)}80%{transform:scale(.62,.45)}}' +
      '.st-error .ph-tg{animation:ph-tgg 1.3s ease-in-out infinite}@keyframes ph-tgg{0%,100%{opacity:.18}40%{opacity:.4}70%{opacity:.22}}' +
      '.ph-dark{opacity:0}.st-error .ph-dark{animation:ph-dark 1.6s ease-in-out both}@keyframes ph-dark{to{opacity:.3}}' +
      // The scarabs: only in an error, scuttling across the walls on wriggling legs.
      '.ph-sc{opacity:0}.st-error .ph-sc{opacity:1;animation-name:ph-crawl;animation-timing-function:linear;animation-iteration-count:infinite}' +
      '@keyframes ph-crawl{from{transform:translateX(var(--x0))}to{transform:translateX(var(--x1))}}' +
      '.ph-leg{animation:ph-wig .22s ease-in-out infinite alternate}@keyframes ph-wig{from{transform:translateX(-1.5px) rotate(-4deg)}to{transform:translateX(1.5px) rotate(4deg)}}' +
      // Sand trickles from the cracks, and dust drifts in the torchlight.
      '.ph-sand{animation:ph-trickle 1.5s linear infinite}@keyframes ph-trickle{to{stroke-dashoffset:-12}}' +
      '.ph-mote{opacity:0;animation:ph-mote 9s ease-in-out infinite}' +
      '@keyframes ph-mote{0%{opacity:0;transform:translate(0,0)}25%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),-120px)}}' +
      // The door: raised out of sight until a command runs; then it comes down and grinds up, sand pouring.
      '.ph-door{transform:translateY(-530px)}' +
      '.st-run .ph-door{animation:ph-open 3.2s cubic-bezier(.55,0,.4,1) .15s both}' +
      '@keyframes ph-open{0%{transform:translateY(0)}100%{transform:translateY(-530px)}}' +
      '.st-run .ph-grind{animation:ph-grind .12s linear 26 alternate}@keyframes ph-grind{from{transform:translateX(-1.4px)}to{transform:translateX(1.4px)}}' +
      '.ph-pour{opacity:0}.st-run .ph-pour{opacity:.75;animation:ph-fall .7s linear infinite}@keyframes ph-fall{to{stroke-dashoffset:-60}}' +
      '.ph-mound{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(.3)}.st-run .ph-mound{animation:ph-mound 3.4s ease-out .3s both}' +
      '@keyframes ph-mound{from{transform:scaleY(.2)}to{transform:scaleY(1)}}' +
      '.ph-dust{opacity:0}.st-run .ph-dust{transform-box:fill-box;transform-origin:center;animation:ph-dust 3.4s ease-out infinite}' +
      '@keyframes ph-dust{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.35}100%{opacity:0;transform:translate(var(--dx),-120px) scale(2.4)}}' +
      // The carvings: dim by default; on done they light up one after another, left to right, and stay lit.
      '.ph-car{opacity:.24}' +
      '.st-done .ph-car{animation:ph-lit 1.1s ease-out calc(.5s + var(--i) * 2.4s) both}@keyframes ph-lit{from{opacity:.24}to{opacity:1}}' +
      '.ph-beam,.ph-halo{opacity:0}.st-done .ph-beam{animation:ph-beam 1.4s ease-out .2s both}.st-done .ph-halo{animation:ph-halo 1.6s ease-out .8s both}' +
      '@keyframes ph-beam{to{opacity:1}}@keyframes ph-halo{to{opacity:1}}' +
      '.ph-disk{opacity:.45}.st-done .ph-disk{animation:ph-diskl 1.6s ease-out .8s both}@keyframes ph-diskl{to{opacity:1}}' +
      // The papyrus unrolls while Claude reads.
      '.ph-scroll{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.08)}.st-read .ph-scroll{animation:ph-unroll 1.1s ease-out both}' +
      '@keyframes ph-unroll{to{transform:scaleY(1)}}' +
      // A falcon glides across the top of the hall on the web.
      '.ph-bird{opacity:0}.st-web .ph-bird{animation:ph-glide 6s linear infinite}' +
      '@keyframes ph-glide{0%{opacity:0;transform:translate(-120px,30px)}6%,92%{opacity:1}100%{opacity:0;transform:translate(1720px,-30px)}}' +
      '.ph-wing{transform-box:fill-box;transform-origin:50% 100%;animation:ph-flap 1s ease-in-out infinite alternate}@keyframes ph-flap{to{transform:scaleY(.55)}}',
    scenery:
      '<defs>' +
      '<linearGradient id="ph-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0810"/><stop offset=".7" stop-color="#150f1c"/><stop offset="1" stop-color="#0a0710"/></linearGradient>' +
      '<linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050820"/><stop offset=".6" stop-color="#14204a"/><stop offset="1" stop-color="#2a2d5a"/></linearGradient>' +
      '<radialGradient id="ph-mh"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".4"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ph-glow"><stop offset="0" stop-color="#ffb347" stop-opacity=".34"/><stop offset=".5" stop-color="#ff9a3a" stop-opacity=".1"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ph-fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd36a"/><stop offset=".6" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ph-spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4ff" stop-opacity=".2"/><stop offset="1" stop-color="#9fb4ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="ph-bm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".4"/><stop offset="1" stop-color="#ffe9a8" stop-opacity=".25"/></linearGradient>' +
      '<radialGradient id="ph-sun"><stop offset="0" stop-color="#ffd36a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="ph-op"><rect x="90" y="250" width="340" height="510"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#ph-wall)"/>' +
      `<path d="${masonry}" stroke="#2a2036" stroke-opacity=".5" stroke-width="2" fill="none"/>` +
      // The night desert beyond the doorway: sky, huge moon, pyramids and dunes, and the door that closes it.
      '<g clip-path="url(#ph-op)"><rect x="90" y="250" width="340" height="510" fill="url(#ph-sky)"/>' +
      stars +
      '<circle cx="320" cy="390" r="170" fill="url(#ph-mh)"/><circle cx="320" cy="390" r="76" fill="#e8e2cc" fill-opacity=".9"/>' +
      '<g fill="#9a9488" fill-opacity=".35"><ellipse cx="300" cy="370" rx="18" ry="14"/><ellipse cx="344" cy="414" rx="14" ry="11"/><ellipse cx="316" cy="436" rx="9" ry="7"/></g>' +
      '<path d="M60 720L180 540L300 720Z" fill="#141a38"/><path d="M60 720L180 540L180 720Z" fill="#2a3560"/>' +
      '<path d="M270 720L350 610L430 720Z" fill="#141a38"/><path d="M270 720L350 610L350 720Z" fill="#242e58"/>' +
      '<path d="M90 720L130 668L170 720Z" fill="#1a2040" fill-opacity=".8"/>' +
      '<path d="M90 706Q160 690 240 708T430 700V770H90Z" fill="#1c1830"/><path d="M90 736Q200 716 300 738T430 730V770H90Z" fill="#14101f"/>' +
      '<g class="ph-grind"><g class="ph-door">' +
      `<rect x="90" y="250" width="340" height="510" fill="#1c1626" stroke="${GOLD}" stroke-opacity=".35" stroke-width="3"/>` +
      `<rect x="110" y="270" width="140" height="470" fill="#140f1c" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/><rect x="270" y="270" width="140" height="470" fill="#140f1c" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
      `<path d="${glyphs(130, 116, 290, 3, 8, 44, 56)}" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="${glyphs(131, 276, 290, 3, 8, 44, 56)}" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
      `<g transform="translate(260 500)"><circle r="26" fill="#8a6a22" fill-opacity=".8" stroke="${GOLD}" stroke-width="3"/></g></g></g></g>` +
      // The sand pouring through the opening, and the dust and mound it makes at the threshold.
      pour +
      '<path class="ph-mound" d="M90 760Q180 700 260 726Q340 696 430 760Z" fill="#8a7448"/>' +
      [0, 1, 2, 3].map(i => `<circle class="ph-dust" style="--dx:${f(-30 + i * 24)}px;animation-delay:${f(-i * 0.8)}s" cx="${f(150 + i * 80)}" cy="752" r="22" fill="#b89a60"/>`).join('') +
      // The doorway: jambs, a lintel with a winged sun, marks and the threshold.
      `<g fill="${STONE}" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"><rect x="30" y="170" width="60" height="600"/><rect x="430" y="170" width="60" height="600"/>` +
      '<rect x="14" y="170" width="492" height="80" fill="#1b1521"/><path d="M0 170Q260 112 520 170V182H0Z" fill="#241c2e"/><rect x="64" y="756" width="392" height="22" fill="#241c2e"/></g>' +
      `<g fill="${GOLD}" fill-opacity=".6"><path d="M240 212Q160 190 60 206Q150 208 240 222Z"/><path d="M280 212Q360 190 460 206Q370 208 280 222Z"/></g>` +
      `<circle cx="260" cy="214" r="20" fill="#8a6a22" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="${lintelMarks}" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M30 360H90M30 420H90M30 480H90M430 360H490M430 420H490M430 480H490" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
      // The moonlight that spills from the doorway across the floor.
      '<path d="M90 760H430L640 1000H-120Z" fill="url(#ph-spill)"/>' +
      // The floor of the hall.
      '<path d="M0 780H1600V1000H0Z" fill="#0b0810" fill-opacity=".7"/><path d="M0 780H1600" stroke="#3a2c4a" stroke-opacity=".5" stroke-width="2"/>' +
      '<path d="M200 780L-300 1000M600 780L400 1000M1000 780L1000 1000M1400 780L1700 1000M0 880H1600" stroke="#2a2036" stroke-opacity=".5" stroke-width="2" fill="none"/>' +
      // The carved frieze under the ceiling, the carved panels, and cracks that trickle sand.
      `<rect x="0" y="22" width="1600" height="96" fill="#0d0a13" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"/>` +
      frieze +
      panels +
      trickles +
      // The sun disk the moonlight finds on done, with the beam that reaches it from the doorway.
      '<path class="ph-beam" d="M430 262L430 306L956 236L956 196Z" fill="url(#ph-bm)"/>' +
      '<circle class="ph-halo" cx="990" cy="216" r="180" fill="url(#ph-sun)"/>' +
      '<g transform="translate(990 216)"><g class="ph-disk">' +
      sunDisk(54) +
      '</g></g>' +
      // The giant seated statues, lit by the doorway torches, and the torches beside the doorway.
      statue(640, 800, 1.1, GOLD) +
      '<g class="mv-r">' +
      statue(1420, 800, 1.3, LAPIS) +
      '</g>' +
      torch(20, 300, 1) +
      torch(500, 300, 1) +
      motes +
      // A falcon on the web, and scarabs in an error: both ride over the walls.
      '<g transform="translate(0 130)"><g class="ph-bird"><g transform="scale(2)"><g class="ph-wing"><path d="M-46 -4Q-20 -24 0 0Q20 -24 46 -4Q20 -10 0 6Q-20 -10 -46 -4Z" fill="#05040a" stroke="#d4a537" stroke-opacity=".6" stroke-width="1.2"/></g>' +
      '<path d="M-12 2L12 2L18 4L12 6L-12 6L-20 10L-18 3Z" fill="#05040a"/></g></g></g>' +
      scarabs +
      '<rect class="ph-dark" width="1600" height="1000" fill="#02010a"/>',
    nook:
      '<defs><radialGradient id="ph-tn"><stop offset="0" stop-color="#ffb347" stop-opacity=".3"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient></defs>' +
      // A carved stele behind the altar and two torches on either side.
      `<g fill="#0e0a14" stroke="${GOLD}" stroke-opacity=".3" stroke-width="2"><rect x="96" y="60" width="240" height="120" rx="3"/></g>` +
      `<path d="${glyphs(150, 108, 76, 7, 2, 32, 40)}" fill="none" stroke="${GOLD}" stroke-opacity=".4" stroke-width="1.8" stroke-linecap="round"/>` +
      torch(8, 200, 1) +
      torch(404, 200, 1) +
      '<rect x="0" y="452" width="470" height="30" fill="#0b0810" stroke="#2a2036" stroke-width="2"/>',
  }
}
