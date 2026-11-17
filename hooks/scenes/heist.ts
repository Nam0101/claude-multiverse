import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// The Heist: a cat burglar at a laptop wired into the security panel of a museum vault hall at night. A giant round
// vault door fills the left third, a diamond glows on its pedestal at the far right, red lasers criss-cross the hall.
// When a command runs the wheel spins, the bolts pull back and the door swings open on gold light.
const RED = '#ff3a4c'
const GOLD = '#ffcb4d'
const STEEL = '#1a2536'
const STEEL_EDGE = '#34465f'
const VX = 250
const VY = 560
const VR = 205

/** A security camera on a bracket at (x, y), aimed `aim` degrees, panning `span` degrees each way, turning `away` when done. */
function camera(x: number, y: number, aim: number, span: number, away: number, delay: number, bx: number, by: number): string {
  return (
    `<path d="M${bx} ${by}L${x} ${y}" stroke="#0a0f18" stroke-width="7" stroke-linecap="round"/>` +
    `<g transform="translate(${x} ${y})"><g class="hs-cam" style="--r:${aim}deg;--a:${span}deg;--away:${away}deg;animation-delay:${delay}s">` +
    '<path class="hs-cone" d="M52 0L360 -86V86Z" fill="url(#hs-cone)"/>' +
    `<path d="M-6 -9H42L56 -12V12L42 9H-6Z" fill="#0d1420" stroke="${STEEL_EDGE}" stroke-width="2" stroke-linejoin="round"/>` +
    '<circle cx="56" cy="0" r="6" fill="#05080e" stroke="#46607f" stroke-width="2"/><circle cx="56" cy="0" r="2.2" fill="#8fb8ff" fill-opacity=".8"/>' +
    `<circle class="hs-led" cx="6" cy="-3" r="2.6" fill="${RED}" style="animation-delay:${delay}s"/>` +
    '<circle cx="0" cy="0" r="6" fill="#141d2c" stroke="#34465f" stroke-width="2"/></g></g>'
  )
}

/** The twelve bolts around the vault door: each slides inward along its own spoke when the door unlocks. */
function bolts(): string {
  return Array.from({ length: 12 }, (_, i) => {
    return (
      `<g transform="translate(${VX} ${VY}) rotate(${i * 30})"><rect class="hs-bolt" x="${VR - 8}" y="-9" width="34" height="18" rx="3" ` +
      `fill="#243349" stroke="#4a6385" stroke-width="2"/></g>`
    )
  }).join('')
}

/** The big spoked wheel on the door. */
function wheel(): string {
  const spokes = Array.from({ length: 6 }, (_, i) => {
    return `<g transform="rotate(${i * 60})"><rect x="-6" y="-78" width="12" height="78" rx="4" fill="#2a3b55" stroke="#5a7596" stroke-width="2"/><circle cy="-86" r="13" fill="#1d2a3f" stroke="#6f8bb0" stroke-width="2.4"/></g>`
  }).join('')

  return (
    `<g class="hs-wheel" transform="translate(${VX} ${VY})"><g class="hs-whin"><circle r="72" fill="none" stroke="#5a7596" stroke-width="9"/>` +
    `<circle r="72" fill="none" stroke="#0b121d" stroke-width="3"/>${spokes}` +
    '<circle r="26" fill="#223149" stroke="#7a96ba" stroke-width="3"/><circle r="10" fill="#0b121d" stroke="#6f8bb0" stroke-width="2"/></g></g>'
  )
}

/** Gold bars stacked on the vault's shelves, seen once the door is open. */
function ingots(): string {
  const rows: string[] = []

  for (let r = 0; r < 4; r += 1) {
    for (let i = 0; i <= 3 - r + 1; i += 1) {
      const x = VX - 150 + r * 34 + i * 70
      const y = VY + 158 - r * 26

      rows.push(`<path d="M${x} ${y}h58l-10 -24h-38Z" fill="${r % 2 ? '#e0a830' : GOLD}" stroke="#7a5410" stroke-width="2"/>`)
    }
  }

  return rows.join('')
}

/** A framed painting, drawn as dark abstract shapes. */
function painting(x: number, y: number, w: number, h: number, seed: number): string {
  const next = random(seed)
  const tones = ['#1b2c4a', '#3a1d3a', '#12354a', '#4a2a1a']
  const shapes = Array.from({ length: 4 }, (_, i) => {
    const sx = x + 12 + next() * (w - 40)
    const sy = y + 12 + next() * (h - 40)

    return i % 2
      ? `<circle cx="${f(sx + 14)}" cy="${f(sy + 14)}" r="${f(10 + next() * 16)}" fill="${tones[i]}" fill-opacity=".8"/>`
      : `<path d="M${f(sx)} ${f(sy + 30)}L${f(sx + 20)} ${f(sy)}L${f(sx + 44)} ${f(sy + 34)}Z" fill="${tones[i]}" fill-opacity=".8"/>`
  }).join('')

  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#070b13" stroke="#3b3220" stroke-width="7"/>` +
    `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="#0c1220" stroke="#6a5a30" stroke-opacity=".5" stroke-width="1.6"/>${shapes}`
  )
}

/** One laser pattern: lines across the hall between points on the walls. */
function lasers(seed: number, count: number): string {
  const next = random(seed)

  return Array.from({ length: count }, (_, i) => {
    const y1 = 250 + next() * 640
    const y2 = 250 + next() * 640

    return `<path style="--i:${i}" d="M-30 ${f(y1)}L1630 ${f(y2)}"/>`
  }).join('')
}

/** The laptop, a lockpick box wired into it, and a cable that climbs to the wall panel. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const busy = activity === 'tool' || activity === 'run' || activity === 'responding' ? ' hs-busy' : ''

  return (
    '<rect x="246" y="323" width="96" height="7" rx="2" fill="#222c40"/>' +
    keys +
    '<path d="M334 327L360 238L370 240L344 329Z" fill="#222c40"/>' +
    `<path d="M335 324L359 242L363 243L339 326Z" fill="${light}"/>` +
    `<path d="M335 324L359 242L346 246L326 324Z" fill="${light}" fill-opacity=".18"/>` +
    '<path d="M342 326C356 336 366 332 376 322" fill="none" stroke="#0a0f18" stroke-width="3.4" stroke-linecap="round"/>' +
    // The tap box: three lights and a dial.
    '<rect x="372" y="304" width="76" height="26" rx="4" fill="#141d2c" stroke="#34465f" stroke-width="2"/>' +
    `<circle class="hs-dial${busy}" cx="436" cy="317" r="7" fill="#0a0f18" stroke="#6f8bb0" stroke-width="2"/><path d="M436 317V311" stroke="${light}" stroke-width="2"/>` +
    `<g fill="${light}"><circle class="hs-bl${busy}" cx="385" cy="312" r="2.6"/><circle class="hs-bl${busy}" cx="395" cy="312" r="2.6" style="animation-delay:-.4s"/><circle class="hs-bl${busy}" cx="405" cy="312" r="2.6" style="animation-delay:-.8s"/></g>` +
    '<path d="M380 322H416" stroke="#34465f" stroke-width="2"/>' +
    '<path d="M410 304C410 270 396 230 384 190" fill="none" stroke="#0a0f18" stroke-width="3.4" stroke-linecap="round"/>' +
    // A pair of lockpicks lying in front.
    '<path d="M180 326L212 322M184 329L214 327" stroke="#8aa0c0" stroke-width="2" stroke-linecap="round"/>'
  )
}

export function heistWorld(): World {
  const next = random(2211)

  const columns = ([
    [452, 74],
    [1114, 66],
    [790, 46],
  ] as [number, number][])
    .map(
      ([x, w], i) =>
        `<rect x="${x}" y="0" width="${w}" height="810" fill="url(#hs-col)" opacity="${i === 2 ? 0.55 : 1}"/>` +
        `<rect x="${x - 8}" y="780" width="${w + 16}" height="34" fill="#0e1523" stroke="#1d2b44" stroke-width="2" opacity="${i === 2 ? 0.55 : 1}"/>` +
        `<rect x="${x - 8}" y="0" width="${w + 16}" height="22" fill="#0e1523" stroke="#1d2b44" stroke-width="2" opacity="${i === 2 ? 0.55 : 1}"/>`,
    )
    .join('')

  const floorLines =
    Array.from({ length: 17 }, (_, i) => `<path d="M${800 + (i - 8) * 52} 806L${800 + (i - 8) * 250} 1000"/>`).join('') +
    [830, 872, 928].map(y => `<path d="M0 ${y}H1600"/>`).join('')

  const skylightPanes =
    Array.from({ length: 5 }, (_, i) => `<path d="M${580 + i * 96} 0V120"/>`).join('') + '<path d="M540 60H1060"/>'

  const slats = (x: number, y: number, w: number, n: number): string =>
    Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * 14}" width="${w}" height="12" rx="2"/>`).join('')

  const motes = Array.from({ length: 12 }, (_, i) => {
    const x = 640 + next() * 380

    return `<circle class="hs-mote" cx="${f(x)}" cy="${f(180 + next() * 500)}" r="${f(1.2 + next() * 1.6)}" style="animation-delay:${f(-i * 1.3)}s"/>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'bits',
      ink: '#03040a',
      furniture: '#161d2b',
      metal: '#222c40',
      paper: '#cfd8e8',
      light: { idle: '#3f7fae', work: '#69d6ff', bright: '#d4f4ff' },
      headTop: 196,
      glowAt: [345, 284],
      device,
      wear: {
        front:
          // A black beanie with a ribbed cuff, a striped jersey, and a domino mask whose eye holes stay wide open.
          '<path d="M68 246C66 212 104 194 150 194C196 194 234 212 232 246Z" fill="#0b0d14" stroke="#262c3c" stroke-width="2"/>' +
          '<path d="M96 206C120 198 150 196 182 199" fill="none" stroke="#2c3550" stroke-width="3" stroke-linecap="round"/>' +
          '<rect x="62" y="232" width="176" height="19" rx="5" fill="#141824" stroke="#2c3448" stroke-width="2"/>' +
          '<path d="M82 234V249M98 234V249M114 234V249M130 234V249M146 234V249M162 234V249M178 234V249M194 234V249M210 234V249M224 234V249" stroke="#0b0d14" stroke-width="2"/>' +
          '<path d="M72 256L100 244H210L240 254L232 296L224 330H86L78 296ZM94 252H222V322H94Z" fill="#05060a" fill-opacity=".72" fill-rule="evenodd" stroke="#05060a" stroke-width="2"/>' +
          '<g fill="#05060a" fill-opacity=".5"><rect x="72" y="332" width="158" height="5"/><rect x="72" y="342" width="158" height="5"/></g>',
      },
      seatArt:
        '<ellipse cx="151" cy="352" rx="46" ry="7" fill="#2a2330" stroke="#3d3548" stroke-width="2"/>' +
        '<path d="M120 358L102 456M182 358L200 456M151 360V456" stroke="#222c40" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M110 418H192" stroke="#34465f" stroke-width="5"/>',
      tableArt:
        `<g fill="#161d2b" stroke="${STEEL_EDGE}" stroke-width="1.6"><rect x="166" y="330" width="304" height="14" rx="2"/>` +
        '<rect x="184" y="344" width="14" height="112"/><rect x="438" y="344" width="14" height="112"/><rect x="190" y="400" width="260" height="8"/></g>' +
        '<path d="M176 337H460" stroke="#5aa0d0" stroke-opacity=".45" stroke-width="2"/>' +
        // The loot sack under the desk.
        '<g class="hs-sack"><path d="M312 456C296 430 304 408 326 398C334 392 346 392 352 398C374 408 380 430 366 456Z" fill="#0b0f18" stroke="#2c3a52" stroke-width="2"/>' +
        '<path d="M322 398L330 388H348L356 398" fill="none" stroke="#2c3a52" stroke-width="3"/>' +
        `<circle cx="340" cy="394" r="6" fill="${GOLD}" fill-opacity=".8"/><path d="M336 394h8" stroke="#7a5410" stroke-width="2"/></g>`,
    },
    style:
      // Ambient: cameras sweep, lasers breathe, dust drifts in the moonbeam, the LED on each camera blinks slowly.
      '.hs-cam{transform:rotate(var(--r));animation:hs-pan 8s ease-in-out infinite alternate}' +
      '@keyframes hs-pan{from{transform:rotate(calc(var(--r) - var(--a)))}to{transform:rotate(calc(var(--r) + var(--a)))}}' +
      '.hs-led{animation:hs-led 2.4s ease-in-out infinite}@keyframes hs-led{0%,60%,100%{opacity:.25}30%{opacity:1}}' +
      '.hs-lz{opacity:.75;animation:hs-breathe 5s ease-in-out infinite alternate}@keyframes hs-breathe{to{opacity:.8}}' +
      '.hs-lzb{opacity:0}' +
      '.hs-mote{opacity:.25;animation:hs-mote 12s ease-in-out infinite alternate}@keyframes hs-mote{from{transform:translate(0,0)}to{transform:translate(26px,-60px)}}' +
      '.hs-gem{animation:hs-gem 3.2s ease-in-out infinite alternate}@keyframes hs-gem{from{opacity:.55}to{opacity:.9}}' +
      '.hs-bl{opacity:.5}.hs-bl.hs-busy{animation:hs-bl .9s ease-in-out infinite alternate}@keyframes hs-bl{from{opacity:.2}to{opacity:1}}' +
      '.hs-dial.hs-busy{transform-box:fill-box;transform-origin:center;animation:mv-spin 2.4s linear infinite}' +
      '.hs-wlk{animation:hs-wlk 6s ease-in-out infinite alternate}@keyframes hs-wlk{to{transform:translateX(18px)}}' +
      // Thinking: the lasers pulse slowly.
      '.st-thinking .hs-lz{animation:hs-pulse 3s ease-in-out infinite alternate}@keyframes hs-pulse{from{opacity:.3}to{opacity:.85}}' +
      // Tool: the grid shifts to another pattern, sliding as it goes.
      '.st-tool .hs-lz{animation:hs-shifta 1.8s ease-in-out infinite alternate;opacity:.3}' +
      '@keyframes hs-shifta{from{transform:translateY(-40px) rotate(-2deg)}to{transform:translateY(46px) rotate(2deg)}}' +
      '.st-tool .hs-lzb{opacity:.75;animation:hs-shiftb 1.8s ease-in-out infinite alternate}' +
      '@keyframes hs-shiftb{from{transform:translateY(50px) rotate(2deg)}to{transform:translateY(-36px) rotate(-2deg)}}' +
      '.hs-lz,.hs-lzb{transform-origin:800px 560px}' +
      // Web: a camera pans, wide and quick.
      '.st-web .hs-cam{--a:40deg;animation-duration:1.9s}' +
      // Read: the blueprints unroll.
      '.hs-bp{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
      '.st-read .hs-bp{animation:hs-unroll 1.2s ease-out both}@keyframes hs-unroll{to{transform:scaleY(1)}}' +
      '.hs-bpl{stroke-dasharray:5 5;animation:hs-march 1.4s linear infinite}@keyframes hs-march{to{stroke-dashoffset:-10}}' +
      // Run: the wheel spins up, the bolts withdraw, the door swings open on gold light.
      `.hs-door{transform-origin:${VX - VR}px ${VY}px}` +
      '.st-run .hs-whin{transform-box:fill-box;transform-origin:center;animation:hs-spin 1.5s cubic-bezier(.2,.7,.2,1) both}' +
      '@keyframes hs-spin{to{transform:rotate(780deg)}}' +
      '.st-run .hs-bolt{animation:hs-bolt .6s ease-in-out .8s both}@keyframes hs-bolt{to{transform:translateX(-30px);opacity:.5}}' +
      '.st-run .hs-door{animation:hs-swing 1.5s cubic-bezier(.5,0,.2,1) 1.5s both}@keyframes hs-swing{to{transform:scaleX(.14)}}' +
      '.hs-gold,.hs-spill{opacity:0}' +
      '.st-run .hs-gold{animation:hs-fade 1.8s ease-out 1.7s both}@keyframes hs-fade{to{opacity:.7}}' +
      '.st-run .hs-spill{animation:hs-fadeb 2s ease-out 2s both}@keyframes hs-fadeb{to{opacity:.34}}' +
      // Error: the alarm sweeps, lasers brighten, shutters drop.
      '.hs-alarm{opacity:0}.st-error .hs-alarm{animation:hs-alarm 1s ease-out both}@keyframes hs-alarm{to{opacity:1}}' +
      '.hs-wedge{animation:hs-rot 3.4s linear infinite}@keyframes hs-rot{to{transform:rotate(360deg)}}' +
      '.hs-vig{animation:hs-vig 3.4s ease-in-out infinite alternate}@keyframes hs-vig{from{opacity:.4}to{opacity:1}}' +
      '.st-error .hs-lz,.st-error .hs-lzb{animation:none;opacity:.95}.st-error .hs-lzb{opacity:.7}' +
      '.hs-shut{transform:translateY(-300px)}.st-error .hs-shut{animation:hs-drop .9s cubic-bezier(.3,0,.3,1.1) .3s both}@keyframes hs-drop{to{transform:translateY(0)}}' +
      '.st-error .hs-led{animation:hs-led 1.4s ease-in-out infinite}' +
      // Done: the case lifts, the diamond rises and arcs into the sack, the lasers go out one by one.
      '.st-done .hs-case{animation:hs-lift .6s ease-out both}@keyframes hs-lift{to{transform:translateY(-70px);opacity:0}}' +
      '.st-done .hs-gone{animation:hs-gone .05s linear .3s both}@keyframes hs-gone{to{opacity:0}}' +
      '.hs-fx,.hs-tr,.hs-land{opacity:0}' +
      '.st-done .hs-fx{animation:hs-fly 1.6s cubic-bezier(.4,0,.6,1) .3s both}' +
      '@keyframes hs-fly{0%{opacity:1;transform:translate(0,0) scale(1)}18%{opacity:1;transform:translate(4px,-40px) scale(.9)}60%{opacity:1;transform:translate(34px,230px) scale(.5)}99%{opacity:1;transform:translate(50px,534px) scale(.25)}100%{opacity:0;transform:translate(50px,534px) scale(.2)}}' +
      '.st-done .hs-tr{animation:hs-trail 1.6s ease-in-out both;animation-delay:calc(.3s + var(--d))}' +
      '@keyframes hs-trail{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:.9;transform:translate(4px,-30px) scale(.8)}60%{opacity:.7;transform:translate(34px,230px) scale(.5)}100%{opacity:0;transform:translate(50px,534px) scale(.2)}}' +
      '.st-done .hs-land{animation:hs-land .8s ease-out 1.8s both}@keyframes hs-land{0%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.4) rotate(40deg)}}' +
      '.hs-sack{transform-box:fill-box;transform-origin:50% 100%}.st-done .hs-sack{animation:hs-bulge .5s ease-out 1.8s both}@keyframes hs-bulge{40%{transform:scale(1.14,1.2)}to{transform:scale(1.06,1.1)}}' +
      '.st-done .hs-lz,.st-done .hs-lzb{animation:none;opacity:1}.st-done .hs-lzb{display:none}' +
      '.st-done .hs-lz path{animation:hs-off .5s ease-out both;animation-delay:calc(.2s + var(--i) * .22s)}@keyframes hs-off{to{opacity:0}}' +
      '.st-done .hs-cam{animation:hs-away 1.5s ease-in-out both}@keyframes hs-away{from{transform:rotate(var(--r))}to{transform:rotate(calc(var(--r) + var(--away)))}}' +
      '.st-done .hs-cone{animation:hs-coneoff 1.5s ease-out both}@keyframes hs-coneoff{to{opacity:0}}' +
      '.st-done .hs-led{animation:none;opacity:.15}',
    scenery:
      '<defs>' +
      '<linearGradient id="hs-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060c"/><stop offset=".6" stop-color="#080d18"/><stop offset="1" stop-color="#0a1120"/></linearGradient>' +
      '<linearGradient id="hs-col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a101b"/><stop offset=".35" stop-color="#16213a"/><stop offset=".55" stop-color="#101a2d"/><stop offset="1" stop-color="#070b14"/></linearGradient>' +
      '<linearGradient id="hs-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1526"/><stop offset="1" stop-color="#05080f"/></linearGradient>' +
      '<linearGradient id="hs-lzg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0"><stop offset="0" stop-color="#ff3a4c" stop-opacity=".9"/><stop offset=".3" stop-color="#ff3a4c" stop-opacity=".35"/><stop offset=".5" stop-color="#ff3a4c" stop-opacity=".14"/><stop offset=".7" stop-color="#ff3a4c" stop-opacity=".35"/><stop offset="1" stop-color="#ff3a4c" stop-opacity=".9"/></linearGradient>' +
      '<linearGradient id="hs-cone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4a5a" stop-opacity=".2"/><stop offset="1" stop-color="#ff4a5a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hs-wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".34"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="hs-door" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#2a3b57"/><stop offset=".6" stop-color="#1d2c48"/><stop offset="1" stop-color="#0f1a2c"/></radialGradient>' +
      '<radialGradient id="hs-gold"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".95"/><stop offset=".55" stop-color="#ffb43a" stop-opacity=".65"/><stop offset="1" stop-color="#8a5a10" stop-opacity=".5"/></radialGradient>' +
      '<linearGradient id="hs-spill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd870" stop-opacity=".7"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="hs-spot"><stop offset="0" stop-color="#cfe8ff" stop-opacity=".55"/><stop offset="1" stop-color="#cfe8ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="hs-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd4ff" stop-opacity=".1"/><stop offset="1" stop-color="#bcd4ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hs-gemg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fcff"/><stop offset=".5" stop-color="#7fd0f5"/><stop offset="1" stop-color="#3a78c8"/></linearGradient>' +
      '<radialGradient id="hs-vigg" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#ff5a2a" stop-opacity="0"/><stop offset="1" stop-color="#ff5a2a" stop-opacity=".16"/></radialGradient>' +
      '<clipPath id="hs-c1"><rect x="1394" y="296" width="152" height="188"/></clipPath>' +
      '<clipPath id="hs-c2"><rect x="540" y="0" width="520" height="124"/></clipPath>' +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#hs-bg)"/>' +
      // The skylight, the moon behind it, and a faint beam of moonlight.
      '<path d="M520 0H1080L1040 126H560Z" fill="#050912" stroke="#26385a" stroke-width="3"/>' +
      '<circle cx="740" cy="58" r="40" fill="#cfe0ff" fill-opacity=".14"/><circle cx="740" cy="58" r="24" fill="#dce8ff" fill-opacity=".55"/>' +
      `<g stroke="#26385a" stroke-width="3">${skylightPanes}</g>` +
      '<path d="M560 126H1040L1220 806H380Z" fill="url(#hs-beam)"/>' +
      motes +
      columns +
      // Paintings.
      painting(570, 180, 140, 112, 11) +
      painting(900, 190, 150, 120, 12) +
      painting(54, 110, 150, 120, 13) +
      // The floor.
      '<rect y="806" width="1600" height="200" fill="url(#hs-floor)"/>' +
      `<g stroke="#1b2a46" stroke-opacity=".6" stroke-width="1.6">${floorLines}</g>` +
      '<path d="M0 806H1600" stroke="#2a3d60" stroke-opacity=".7" stroke-width="3"/>' +
      // The vault: a steel frame, a gold-lit interior, the door with its wheel, the bolts.
      `<circle cx="${VX}" cy="${VY}" r="238" fill="#0d1523" stroke="#4a6a98" stroke-width="6"/>` +
      `<circle cx="${VX}" cy="${VY}" r="226" fill="none" stroke="#1d2c46" stroke-width="3"/>` +
      `<circle cx="${VX}" cy="${VY}" r="${VR + 2}" fill="#07090f"/>` +
      `<circle class="hs-gold" cx="${VX}" cy="${VY}" r="${VR}" fill="url(#hs-gold)"/>` +
      `<g class="hs-gold">${ingots()}</g>` +
      `<path class="hs-spill" d="M${VX + 40} ${VY - 190}L700 ${VY + 100}V870L${VX + 40} ${VY + 230}Z" fill="url(#hs-spill)"/>` +
      `<ellipse class="hs-spill" cx="${VX + 150}" cy="880" rx="260" ry="26" fill="${GOLD}" fill-opacity=".35"/>` +
      bolts() +
      '<g class="hs-door">' +
      `<circle cx="${VX}" cy="${VY}" r="${VR}" fill="url(#hs-door)" stroke="#43597c" stroke-width="5"/>` +
      `<circle cx="${VX}" cy="${VY}" r="${VR - 20}" fill="none" stroke="#0b121d" stroke-width="5"/>` +
      `<circle cx="${VX}" cy="${VY}" r="${VR - 26}" fill="none" stroke="#33496a" stroke-width="2"/>` +
      `<circle cx="${VX}" cy="${VY}" r="112" fill="#111b2d" stroke="#2e4466" stroke-width="3"/>` +
      `<path d="M${VX - 150} ${VY - 130}A196 196 0 0 1 ${VX - 40} ${VY - 190}" fill="none" stroke="#9fb8de" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>` +
      `<rect x="${VX + 108}" y="${VY - 22}" width="40" height="44" rx="6" fill="#0b121d" stroke="#43597c" stroke-width="2"/><circle cx="${VX + 128}" cy="${VY - 8}" r="4" fill="${RED}" fill-opacity=".9"/><circle cx="${VX + 128}" cy="${VY + 8}" r="4" fill="#2a3b55"/>` +
      wheel() +
      '</g>' +
      // The diamond on its pedestal, far right, lit from above.
      '<g class="mv-r">' +
      '<path d="M1388 0H1552L1500 440H1440Z" fill="url(#hs-beam)"/>' +
      '<circle cx="1470" cy="410" r="160" fill="url(#hs-spot)" opacity=".5"/>' +
      '<rect x="1424" y="474" width="92" height="340" fill="url(#hs-col)" stroke="#26385a" stroke-width="3"/>' +
      '<rect x="1408" y="458" width="124" height="22" fill="#111a2c" stroke="#3a5278" stroke-width="3"/>' +
      '<rect x="1400" y="798" width="140" height="20" fill="#0e1523" stroke="#26385a" stroke-width="3"/>' +
      '<rect x="1416" y="470" width="108" height="6" fill="#bcd8ff" fill-opacity=".5"/>' +
      '<path class="hs-case" d="M1408 458V326H1532V458" fill="#8fc4ff" fill-opacity=".05" stroke="#7fa6d8" stroke-opacity=".5" stroke-width="3"/>' +
      '<g transform="translate(1470 398)"><g class="hs-gone"><g class="hs-gem"><circle r="64" fill="url(#hs-spot)"/></g>' +
      '<path d="M-52 -14L-30 -42H30L52 -14L0 56Z" fill="url(#hs-gemg)" stroke="#e8fcff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M-52 -14H52M-30 -42L-14 -14L0 56L14 -14L30 -42M-14 -14L0 -42L14 -14" fill="none" stroke="#f4fdff" stroke-opacity=".6" stroke-width="1.8"/>' +
      '</g></g>' +
      `<g clip-path="url(#hs-c1)"><g class="hs-shut" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="1.6">${slats(1394, 296, 152, 14)}</g></g>` +
      '</g>' +
      // Cameras.
      camera(480, 24, 38, 18, 70, 0, 462, 0) +
      camera(1098, 24, 142, 18, -70, -3, 1116, 0) +
      '<g class="mv-r">' + camera(1590, 330, 168, 16, -60, -5, 1600, 330) + '</g>' +
      // The skylight shutter drops over the moon.
      `<g clip-path="url(#hs-c2)"><g class="hs-shut" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="1.6">${slats(540, 0, 520, 9)}</g></g>` +
      // The lasers, two patterns.
      `<g class="hs-lz" fill="none" stroke="url(#hs-lzg)" stroke-width="1.8">${lasers(31, 8)}</g>` +
      `<g class="hs-lzb" fill="none" stroke="url(#hs-lzg)" stroke-width="1.8">${lasers(77, 8)}</g>` +
      // The alarm beacon: two soft wedges turning slowly, and an amber rim over the picture.
      '<g class="hs-alarm"><rect class="hs-vig" width="1600" height="1000" fill="url(#hs-vigg)"/>' +
      '<g transform="translate(250 36)"><g class="hs-wedge"><path d="M0 0L1100 -190V190Z" fill="url(#hs-wg)"/><path d="M0 0L-1100 190V-190Z" fill="url(#hs-wg)"/></g>' +
      '<circle r="16" fill="#ff9a3a" fill-opacity=".9"/><circle r="40" fill="#ff9a3a" fill-opacity=".18"/></g></g>',
    nook:
      // The wall panel the laptop is wired into, with the blueprint rod beside it.
      '<g class="hs-wlk"><rect x="330" y="50" width="82" height="96" rx="6" fill="#0d1523" stroke="#34465f" stroke-width="3"/>' +
      '<rect x="340" y="60" width="62" height="34" rx="3" fill="#06101c" stroke="#25405f" stroke-width="2"/>' +
      '<path d="M346 84L356 72L366 78L378 66L396 74" fill="none" stroke="#69d6ff" stroke-opacity=".8" stroke-width="2"/>' +
      '<g fill="#ff3a4c"><circle class="hs-led" cx="346" cy="116" r="3.4"/></g><circle cx="362" cy="116" r="3.4" fill="#ffcb4d" fill-opacity=".7"/><circle cx="378" cy="116" r="3.4" fill="#4cff9a" fill-opacity=".7"/>' +
      '<path d="M342 132H400" stroke="#34465f" stroke-width="3"/></g>' +
      '<path d="M384 146C384 160 388 174 384 190" fill="none" stroke="#0a0f18" stroke-width="3.4"/>' +
      '<path d="M126 18H250" stroke="#0a0f18" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="hs-bp"><rect x="132" y="22" width="112" height="132" fill="#12375e" fill-opacity=".92" stroke="#6fb0f0" stroke-opacity=".8" stroke-width="2"/>' +
      `<g fill="none" stroke="#8fc4ff" stroke-opacity=".6" stroke-width="1.6"><rect x="146" y="36" width="52" height="42"/><circle cx="214" cy="56" r="14"/><path d="M146 96H230M146 112H214M146 128H224"/></g>` +
      '<path class="hs-bpl" d="M154 70L190 52M206 60L172 40" stroke="#ffcb4d" stroke-width="2.2" fill="none"/>' +
      '</g>',
    front:
      [0, 1, 2, 3].map(k => `<g transform="translate(290 -142)"><g class="hs-tr" style="--d:${k * 0.14}s"><path d="M0 -16L4 -4L16 0L4 4L0 16L-4 4L-16 0L-4 -4Z" fill="#f4fdff"/></g></g>`).join('') +
      '<g transform="translate(290 -142)"><g class="hs-fx"><path d="M-52 -14L-30 -42H30L52 -14L0 56Z" fill="url(#hs-gemg)" stroke="#e8fcff" stroke-opacity=".7" stroke-width="2.4" stroke-linejoin="round"/></g></g>' +
      '<g transform="translate(340 392)"><g class="hs-land"><path d="M0 -24L5 -5L24 0L5 5L0 24L-5 5L-24 0L-5 -5Z" fill="#fff6c0"/></g></g>',
  }
}
