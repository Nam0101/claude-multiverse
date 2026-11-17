import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Underworld: Claude is a ferryman's clerk, hooded, at a ledger desk by a lantern of blue soul-fire. A vast cavern:
// stalactites, ghost-fire braziers, drifting wisps, a great black iron gate in the far wall, and a glowing river with
// a cloaked ferryman poling a long boat across it. Beats: the gate grinds open and soul-light streams over the river
// (run), a three-headed hound rises behind the rocks and barks soft rings (error), the river brightens and wisps
// rise like lanterns (done), the ledger pages turn (read), a bat-winged messenger crosses (web), braziers flare (tool).
const TEAL = '#4ff0d0'
const BLUE = '#5ad8ff'
const GHOST = '#bffff0'
const ROCK = '#03090b'
const n = (value: number): string => String(Math.round(value))

function stalactites(seed: number, base: string, edge: string, longest: number, step: number): string {
  const next = random(seed)
  let d = 'M-20 -10'
  let x = -20

  while (x < 1640) {
    const w = step * (0.7 + next() * 0.6)
    const len = 30 + next() * longest

    d += `L${n(x + w * 0.5)} ${n(len)}L${n(x + w)} ${n(8 + next() * 14)}`
    x += w
  }

  return `<path d="${d}L1640 -10Z" fill="${base}" stroke="${edge}" stroke-opacity=".4" stroke-width="2"/>`
}

/** A brazier of blue-green ghost fire on an iron stand. */
function brazier(x: number, y: number, s: number): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    '<circle class="uw-bg" cy="-70" r="150" fill="url(#uw-bgl)"/>' +
    '<path d="M-6 0L-4 -46H4L6 0ZM-26 0H26M-18 -4L0 -30L18 -4" fill="none" stroke="#050d0f" stroke-width="5"/>' +
    '<path d="M-34 -62H34L24 -38Q0 -28 -24 -38Z" fill="#071114" stroke="#2f6b6a" stroke-opacity=".7" stroke-width="2"/>' +
    '<g transform="translate(0 -62)"><g class="uw-fl"><path d="M-24 0C-34 -30 -14 -50 -6 -86C0 -64 6 -56 8 -44C18 -60 22 -70 20 -92C34 -64 34 -20 24 0Z" fill="url(#uw-flame)"/>' +
    '<path d="M-10 0C-14 -16 -4 -26 0 -46C8 -30 12 -16 10 0Z" fill="#e8fff8" fill-opacity=".75"/></g></g></g>'
  )
}

function door(h: number): string {
  const d = h < 240 ? 1 : -1
  const studs = [340, 400, 460, 520, 570].map(y => `<circle cx="${h + d * 20}" cy="${y}" r="3.5"/><circle cx="${h + d * 120}" cy="${y}" r="3.5"/>`).join('')

  return (
    `<g class="uw-d ${d > 0 ? 'uw-dl' : 'uw-dr'}"><path d="M${h} 600V310Q${h} 190 240 190V600Z" fill="#0b1a1c" stroke="#3b8a86" stroke-opacity=".85" stroke-width="2.5"/>` +
    `<path d="M${h} 390H240M${h} 490H240M${h} 570H240" stroke="#1a3434" stroke-width="7"/>` +
    `<path d="M${h + d * 40} 600V260M${h + d * 80} 600V215M${h + d * 120} 600V195" stroke="#122424" stroke-width="5"/>` +
    `<g fill="#2f6b6a" fill-opacity=".8">${studs}</g><circle cx="${240 - d * 22}" cy="430" r="13" fill="none" stroke="#3b8a86" stroke-opacity=".8" stroke-width="4"/></g>`
  )
}

function houndHead(dx: number, dy: number, delay: number): string {
  return (
    `<g transform="translate(${dx} ${dy})"><path d="M30 -22Q10 -42 -20 -32L-72 -14L-74 -2L-42 4L-72 18L-62 30L-10 24Q30 32 42 6Z" fill="#050d10" stroke="#3b8a86" stroke-opacity=".55" stroke-width="2"/>` +
    '<path d="M20 -34L34 -70L46 -30Z" fill="#050d10"/><path d="M-60 6L-56 18L-48 8ZM-40 6L-36 18L-30 8Z" fill="#9fe8da" fill-opacity=".7"/>' +
    '<circle class="uw-he" cx="-6" cy="-14" r="26" fill="url(#uw-eye)"/><ellipse class="uw-he2" cx="-6" cy="-14" rx="7" ry="4" fill="#f4ffb0"/>' +
    `<g transform="translate(-74 6)"><ellipse class="uw-bark" style="animation-delay:${delay}s" rx="14" ry="20" fill="none" stroke="#a8fff0" stroke-width="3"/></g></g>`
  )
}

function hound(): string {
  return (
    '<g transform="translate(1370 700) scale(1.3)"><g class="uw-hound"><path d="M-200 40C-210 -60 -140 -120 -60 -140L60 -150C150 -140 210 -80 200 40Z" fill="#050d10" stroke="#3b8a86" stroke-opacity=".45" stroke-width="2"/>' +
    '<path d="M-150 -110L-140 -150L-122 -118M-90 -135L-80 -178L-62 -140M-20 -148L-8 -192L14 -150M50 -146L64 -184L80 -140M110 -130L130 -164L140 -110" fill="#050d10"/>' +
    '<path d="M-100 -110Q-130 -170 -122 -208M0 -130Q6 -190 2 -246M100 -120Q124 -170 122 -206" fill="none" stroke="#050d10" stroke-width="46" stroke-linecap="round"/>' +
    houndHead(-122, -222, 0) +
    houndHead(2, -262, 0.5) +
    houndHead(122, -220, 1) +
    '</g></g>'
  )
}

function ferry(): string {
  return (
    '<g transform="translate(140 706) scale(1.3)"><g class="uw-boat"><g class="uw-bob">' +
    '<ellipse cx="160" cy="22" rx="190" ry="12" fill="url(#uw-refl)"/>' +
    '<path d="M0 -12Q10 16 64 18H250Q292 16 326 -34Q304 -4 280 -8H40Q18 -8 0 -12Z" fill="#050c0f" stroke="#3b8a86" stroke-opacity=".6" stroke-width="2"/>' +
    '<path d="M70 -8L60 -112Q70 -144 100 -140Q124 -134 120 -100L112 -8Z" fill="#06100f" stroke="#3b8a86" stroke-opacity=".45" stroke-width="1.6"/>' +
    '<path d="M72 -118Q86 -158 108 -130L100 -118Z" fill="#06100f"/><circle cx="90" cy="-114" r="2.4" fill="#a8fff0"/><circle cx="102" cy="-114" r="2.4" fill="#a8fff0"/>' +
    '<g class="uw-pole"><path d="M108 -90L168 60" stroke="#120c08" stroke-width="5" stroke-linecap="round"/></g>' +
    '<ellipse cx="168" cy="62" rx="22" ry="5" fill="none" stroke="#bffff0" stroke-opacity=".5" stroke-width="2"/>' +
    '<path d="M300 -20V-92Q300 -108 282 -106" fill="none" stroke="#120c08" stroke-width="4"/>' +
    '<circle cx="282" cy="-80" r="70" fill="url(#uw-bgl)"/><path d="M274 -102H290L292 -62H272Z" fill="#071114" stroke="#2f6b6a" stroke-width="2"/>' +
    `<path d="M281 -94Q288 -82 281 -68Q274 -82 281 -94Z" fill="${BLUE}"/></g></g></g>`
  )
}

function messenger(): string {
  const wing = 'M0 0Q-30 -52 -92 -44Q-70 -30 -82 -12Q-60 -16 -62 4Q-40 0 -30 22Z'

  return (
    '<g transform="translate(1720 400) scale(1.5)"><g class="uw-msg"><g class="uw-mb">' +
    `<g class="uw-wing"><path d="${wing}" fill="#050d10" stroke="#3b8a86" stroke-opacity=".6" stroke-width="1.5"/></g>` +
    `<g class="uw-wing uw-wr"><path d="${wing}" transform="scale(-1 1)" fill="#050d10" stroke="#3b8a86" stroke-opacity=".6" stroke-width="1.5"/></g>` +
    '<path d="M-10 -8Q0 -26 10 -8L8 28L-8 28Z" fill="#06100f"/><circle cy="-14" r="8" fill="#06100f"/><circle cx="-3" cy="-14" r="1.6" fill="#a8fff0"/><circle cx="3" cy="-14" r="1.6" fill="#a8fff0"/>' +
    `<rect x="-14" y="2" width="12" height="7" rx="1" fill="#cfeee6" fill-opacity=".8"/><circle cx="-8" cy="6" r="14" fill="url(#uw-bgl)"/>` +
    '</g></g></g>'
  )
}

function device(light: string, activity: Activity): string {
  const marks = [296, 302, 308, 314, 320].map(y => `<path d="M${364 + (y % 3) * 2} ${y}h${18 - (y % 4) * 2}M${398 + (y % 2) * 2} ${y}h${16 - (y % 3) * 2}" stroke="#4a6a60" stroke-width="1.6"/>`).join('')
  const lit = activity === 'idle' ? '.5' : '.8'

  return (
    '<path d="M240 330L346 330L346 322L246 322Z" fill="#1c2628"/>' +
    `<g fill="${light}" fill-opacity=".5">${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${252 + i * 13}" y="324" width="8" height="3"/>`).join('')}</g>` +
    '<path d="M334 325L356 236L368 238L346 327Z" fill="#1c2628" stroke="#3b8a86" stroke-opacity=".5"/>' +
    `<path d="M338 322L356 241L363 243L344 324Z" fill="${light}"/><path d="M338 322L356 241L340 246L322 322Z" fill="${light}" fill-opacity=".16"/>` +
    // The ledger on its slope.
    '<path d="M366 330L372 316H422L428 330Z" fill="#120c08"/>' +
    '<path d="M360 292H394V322H360ZM394 292H428V322H394Z" fill="#cfe2d6" fill-opacity=".78" stroke="#2a3a34" stroke-width="2"/>' +
    `<g fill-opacity="${lit}">${marks}</g><path d="M394 290V324" stroke="#2a3a34" stroke-width="3"/>` +
    [0, 0.4, 0.8].map(d => `<path class="uw-pg" style="animation-delay:${d}s;transform-origin:394px 308px" d="M394 292H428V322H394Z" fill="#dff0e4" stroke="#2a3a34" stroke-width="1.6"/>`).join('') +
    // The lantern of soul-fire.
    `<circle cx="448" cy="302" r="62" fill="url(#uw-bgl)"/><path d="M438 298H458L460 330H436Z" fill="none" stroke="#050d10" stroke-width="3"/><path d="M436 296Q448 284 460 296" fill="none" stroke="#050d10" stroke-width="3"/>` +
    `<g class="uw-fl" style="transform-origin:448px 328px"><path d="M448 308Q458 318 448 328Q438 318 448 308Z" fill="${BLUE}"/></g>`
  )
}

export function underworldWorld(): World {
  const next = random(13)
  const ripples = [636, 664, 692, 724, 758, 792]
    .map((y, i) => `<path class="uw-rp" style="animation-duration:${8 - i}s" d="M-120 ${y}q15 -5 30 0${'t30 0'.repeat(60)}" fill="none" stroke="${i % 2 ? TEAL : BLUE}" stroke-opacity="${f(0.1 + i * 0.03)}" stroke-width="${f(1.4 + i * 0.3)}"/>`)
    .join('')
  const wisps = Array.from({ length: 14 }, (_, i) => {
    const x = 60 + next() * 1500
    const y = 300 + next() * 480
    const dim = x > 420 && x < 1180 ? 0.55 : 1

    return (
      `<g transform="translate(${n(x)} ${n(y)})" style="opacity:${dim}"><g class="uw-w" style="--dx:${n((next() - 0.5) * 160)}px;--t:${n(9 + next() * 8)}s;animation-delay:-${n(next() * 9)}s">` +
      `<circle r="${n(14 + next() * 8)}" fill="url(#uw-wg)"/><circle r="2.6" fill="${GHOST}"/></g></g>`
    )
  }).join('')
  const lanterns = Array.from({ length: 14 }, (_, i) =>
    `<g transform="translate(${n(80 + next() * 1440)} ${n(650 + next() * 130)})"><g class="uw-ln" style="--dx:${n((next() - 0.5) * 120)}px;animation-delay:${f(0.1 + i * 0.12)}s">` +
    '<circle r="26" fill="url(#uw-wg)"/><rect x="-5" y="-8" width="10" height="15" rx="3" fill="#e8fff4" fill-opacity=".92"/></g></g>',
  ).join('')
  const soulStream = Array.from({ length: 12 }, (_, i) => `<g transform="translate(250 ${n(640 + next() * 80)})"><g class="uw-sw" style="animation-delay:${f(0.5 + i * 0.22)}s;--len:${n(900 + next() * 500)}px"><circle r="${n(8 + next() * 8)}" fill="url(#uw-wg)"/><circle r="2.4" fill="#fff"/></g></g>`).join('')
  const far = (seed: number, y: number, h: number, fill: string) => {
    const r = random(seed)
    let d = `M-20 ${y + 40}`

    for (let x = -20; x < 1660; x += 70) {
      d += `L${x + 20} ${n(y - r() * h)}L${x + 50} ${n(y - r() * h * 0.6)}`
    }

    return `<path d="${d}L1660 ${y + 40}Z" fill="${fill}"/>`
  }
  const drips = [520, 980, 1290].map((x, i) => `<circle class="uw-dp" style="animation-delay:${f(i * 1.3)}s" cx="${x}" cy="120" r="2.6" fill="#9fe8da"/>`).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'none',
      thought: 'orbs',
      ink: '#02080a',
      furniture: '#1b1a17',
      metal: '#1c2628',
      paper: '#cfe2d6',
      light: { idle: '#3aa8b0', work: '#5ff0d0', bright: '#bffff0' },
      headTop: 196,
      glowAt: [312, 276],
      device,
      wear: {
        behind: '<path d="M64 262C30 320 26 400 38 440L118 440L118 350Z" fill="#06100f"/>',
        front:
          // A deep hood around the open face, its tip trailing; the eyes stay clear inside it.
          '<path d="M44 350C36 280 56 206 150 188C244 206 264 280 256 350L236 350C240 290 226 236 150 226C74 236 60 290 64 350Z" fill="#081315" stroke="#2f6b6a" stroke-opacity=".7" stroke-width="2"/>' +
          '<path d="M132 196Q112 168 80 176Q108 186 116 206Z" fill="#081315" stroke="#2f6b6a" stroke-opacity=".6" stroke-width="2"/>' +
          '<path d="M68 340C66 292 80 244 150 232C220 244 234 292 232 340" fill="none" stroke="#5ff0d0" stroke-opacity=".3" stroke-width="2"/>' +
          '<circle cx="58" cy="338" r="4" fill="#5ad8ff" fill-opacity=".9"/>',
      },
      seatArt:
        '<g fill="#1b1a17" stroke="#2f3a38" stroke-width="2"><ellipse cx="152" cy="352" rx="46" ry="8"/></g>' +
        '<g stroke="#1b1a17" stroke-width="8" stroke-linecap="round"><path d="M124 358L112 454M152 360V456M180 358L192 454"/></g>' +
        '<path d="M110 408H194" stroke="#2f3a38" stroke-width="4"/>',
      tableArt:
        '<rect x="166" y="330" width="304" height="14" rx="2" fill="#1b1a17" stroke="#2f6b6a" stroke-opacity=".6" stroke-width="1.6"/>' +
        '<rect x="190" y="344" width="272" height="112" fill="#141310" stroke="#2f3a38" stroke-width="2"/>' +
        '<g fill="none" stroke="#2f3a38" stroke-width="2"><rect x="200" y="356" width="120" height="40"/><rect x="332" y="356" width="120" height="40"/><rect x="200" y="404" width="252" height="40"/></g>' +
        '<g fill="none" stroke="#3b8a86" stroke-opacity=".7" stroke-width="3"><circle cx="260" cy="376" r="7"/><circle cx="392" cy="376" r="7"/><circle cx="326" cy="424" r="7"/></g>' +
        '<g fill="#2f6b6a" fill-opacity=".7"><rect x="166" y="330" width="10" height="14"/><rect x="460" y="330" width="10" height="14"/></g>',
    },
    style:
      '.uw-fl{transform-box:fill-box;transform-origin:50% 100%;animation:uw-fl 1.3s ease-in-out infinite alternate}@keyframes uw-fl{from{transform:scale(.92,.88)}to{transform:scale(1.06,1.12)}}' +
      '.uw-bg{animation:uw-bgk 2.6s ease-in-out infinite alternate}@keyframes uw-bgk{from{opacity:.7}to{opacity:1}}' +
      '.st-tool .uw-fl{animation:uw-flare 1.1s ease-in-out infinite alternate}@keyframes uw-flare{from{transform:scale(1.05,1.1)}to{transform:scale(1.25,1.45)}}' +
      '.st-tool .uw-bg{animation:uw-bgf 1.1s ease-in-out infinite alternate}@keyframes uw-bgf{from{opacity:.75;transform:scale(1.05)}to{opacity:.85;transform:scale(1.25)}}' +
      '.uw-bg{transform-box:fill-box;transform-origin:center}' +
      '.uw-rp{animation:uw-rpk 7s linear infinite}@keyframes uw-rpk{to{transform:translateX(-60px)}}' +
      '.uw-w{animation:uw-wk var(--t,12s) ease-in-out infinite}' +
      '@keyframes uw-wk{0%{opacity:0;transform:translate(0,0)}20%{opacity:.85}80%{opacity:.7}100%{opacity:0;transform:translate(var(--dx),-170px)}}' +
      '.st-thinking .uw-w{animation-duration:calc(var(--t) * .55)}' +
      '.uw-bob{animation:uw-bobk 3.2s ease-in-out infinite alternate}@keyframes uw-bobk{from{transform:translateY(-3px) rotate(-.6deg)}to{transform:translateY(3px) rotate(.6deg)}}' +
      '.uw-boat{animation:uw-drift 130s linear infinite}@keyframes uw-drift{to{transform:translateX(1500px)}}' +
      '.uw-pole{transform-origin:108px -90px;animation:uw-polek 4.6s ease-in-out infinite alternate}@keyframes uw-polek{from{transform:rotate(-7deg)}to{transform:rotate(6deg)}}' +
      '.uw-dp{opacity:0;animation:uw-drk 4.2s ease-in infinite}@keyframes uw-drk{0%{opacity:0;transform:translateY(0)}10%{opacity:.8}60%,100%{opacity:0;transform:translateY(150px)}}' +
      '.uw-mist{animation:uw-mistk 40s ease-in-out infinite alternate}@keyframes uw-mistk{to{transform:translateX(120px)}}' +
      // Run: the gate grinds open, soul-light fills the opening and streams out across the river.
            '.uw-d{transform-box:fill-box}.uw-dl{transform-origin:0% 50%}.uw-dr{transform-origin:100% 50%}' +
      '.st-run .uw-d{animation:uw-open 1.8s ease-in-out .2s both}@keyframes uw-open{to{transform:scaleX(.1)}}' +
      '.uw-gg,.uw-ss,.uw-sw{opacity:0}' +
      '.st-run .uw-gg{animation:uw-ggk 1.6s ease-out .2s both}@keyframes uw-ggk{to{opacity:.4}}' +
      '.st-run .uw-ss{animation:uw-ssk 2s ease-out 1s both}@keyframes uw-ssk{to{opacity:.5}}' +
      '.st-run .uw-sw{animation:uw-swk 3.2s ease-in infinite}' +
      '@keyframes uw-swk{0%{opacity:0;transform:translateX(0)}15%{opacity:.9}80%{opacity:.6}100%{opacity:0;transform:translateX(var(--len))}}' +
      // Error: the hound rises behind the rocks, its eyes glow and it barks in soft rings.
      '.uw-hound{opacity:0;transform:translateY(320px)}.st-error .uw-hound{animation:uw-rise 1.7s ease-out both}' +
      '@keyframes uw-rise{0%{opacity:0;transform:translateY(320px)}30%{opacity:1}100%{opacity:1;transform:translateY(0)}}' +
      '.uw-he,.uw-he2{opacity:0}.st-error .uw-he,.st-error .uw-he2{animation:uw-eye 1.4s ease-out 1s both}@keyframes uw-eye{to{opacity:1}}' +
      '.uw-bark{opacity:0;transform-box:fill-box;transform-origin:center}.st-error .uw-bark{animation:uw-barkk 1.6s ease-out 1.3s infinite}' +
      '@keyframes uw-barkk{0%{opacity:0;transform:scale(.3)}15%{opacity:.8}100%{opacity:0;transform:scale(4.5)}}' +
      '.uw-dark{opacity:0}.st-error .uw-dark{animation:uw-darkk 1.4s ease-in-out both}@keyframes uw-darkk{to{opacity:.4}}' +
      // Done: the river brightens, a flock of wisps rises like lanterns.
      '.uw-rb{opacity:0}.st-done .uw-rb{animation:uw-rbk 1.8s ease-out both}@keyframes uw-rbk{to{opacity:.3}}' +
      '.uw-ln{opacity:0}.st-done .uw-ln{animation:uw-lift 6.4s ease-out both}' +
      '@keyframes uw-lift{0%{opacity:0;transform:translate(0,0)}8%{opacity:.95}80%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-720px)}}' +
      // Read: the ledger's pages turn.
      '.uw-pg{opacity:0}.st-read .uw-pg{animation:uw-flip 1.5s ease-in-out infinite}' +
      '@keyframes uw-flip{0%{opacity:1;transform:scaleX(1)}40%{opacity:1;transform:scaleX(-1)}72%{opacity:1;transform:scaleX(-1)}73%,99%{opacity:0;transform:scaleX(1)}100%{opacity:1;transform:scaleX(1)}}' +
      // Web: a bat-winged messenger crosses.
      '.uw-msg{opacity:0}.st-web .uw-msg{animation:uw-fly 7s linear both}' +
      '@keyframes uw-fly{0%{opacity:0;transform:translateX(0)}4%{opacity:1}96%{opacity:1}100%{opacity:0;transform:translateX(-2000px)}}' +
      '.st-web .uw-mb{animation:uw-mbk 1.3s ease-in-out infinite alternate}@keyframes uw-mbk{from{transform:translateY(-26px)}to{transform:translateY(26px)}}' +
      '.uw-wing{animation:uw-wf .36s ease-in-out infinite alternate}.uw-wr{animation-direction:alternate-reverse}' +
      '@keyframes uw-wf{from{transform:rotate(-16deg)}to{transform:rotate(18deg)}}',
    scenery:
      '<defs><linearGradient id="uw-bg0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010507"/><stop offset=".5" stop-color="#05161a"/><stop offset="1" stop-color="#0a2a2e"/></linearGradient>' +
      '<linearGradient id="uw-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d8fff4" stop-opacity=".95"/><stop offset=".4" stop-color="#4ff0d0" stop-opacity=".85"/><stop offset="1" stop-color="#2a8cff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="uw-bgl"><stop offset="0" stop-color="#4ff0d0" stop-opacity=".34"/><stop offset=".5" stop-color="#2a9cff" stop-opacity=".1"/><stop offset="1" stop-color="#2a9cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="uw-wg"><stop offset="0" stop-color="#bffff0" stop-opacity=".7"/><stop offset="1" stop-color="#4ff0d0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="uw-eye"><stop offset="0" stop-color="#e8ff7a" stop-opacity=".8"/><stop offset="1" stop-color="#7aff9a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="uw-river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2c34"/><stop offset=".45" stop-color="#0f4a50"/><stop offset="1" stop-color="#051a20"/></linearGradient>' +
      '<radialGradient id="uw-refl"><stop offset="0" stop-color="#4ff0d0" stop-opacity=".35"/><stop offset="1" stop-color="#4ff0d0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="uw-gate" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8fff8"/><stop offset=".5" stop-color="#4ff0d0"/><stop offset="1" stop-color="#2a9cff"/></linearGradient>' +
      '<linearGradient id="uw-stream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bffff0" stop-opacity=".8"/><stop offset=".5" stop-color="#4ff0d0" stop-opacity=".3"/><stop offset="1" stop-color="#4ff0d0" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="uw-mst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4ff0d0" stop-opacity="0"/><stop offset=".6" stop-color="#4ff0d0" stop-opacity=".16"/><stop offset="1" stop-color="#4ff0d0" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#uw-bg0)"/>' +
      far(3, 520, 150, '#06171a') +
      far(8, 580, 90, '#081f22') +
      '<rect class="uw-mist" x="-200" y="500" width="2000" height="130" fill="url(#uw-mst)"/>' +
      // The great gate in the far wall, set in a lighter rock face.
      '<path d="M-20 610V260Q-20 90 240 90Q500 90 500 260V610Z" fill="#08201f" fill-opacity=".8"/>' +
      '<path d="M52 604V300Q52 142 240 142Q428 142 428 300V604Z" fill="#050b0d" stroke="#3b8a86" stroke-opacity=".9" stroke-width="4"/>' +
      '<path d="M100 600V310Q100 190 240 190Q380 190 380 310V600Z" fill="#010304"/>' +
      '<path class="uw-gg" d="M100 600V310Q100 190 240 190Q380 190 380 310V600Z" fill="url(#uw-gate)"/>' +
      door(100) +
      door(380) +
      '<path d="M70 150L80 118L90 150M120 130L130 98L140 130M190 120L200 86L210 120M270 120L280 86L290 120M340 130L350 98L360 130M390 150L400 118L410 150" fill="#050b0d" stroke="#2f6b6a" stroke-opacity=".5" stroke-width="2"/>' +
      `<circle cx="240" cy="166" r="14" fill="none" stroke="${TEAL}" stroke-opacity=".6" stroke-width="3"/><path d="M240 154V178M230 166H250" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2.4"/>` +
      '<rect x="40" y="598" width="400" height="26" fill="#040c0e"/>' +
      brazier(40, 598, 1) +
      brazier(440, 598, 1) +
      brazier(760, 620, 0.7) +
      brazier(1130, 640, 0.9) +
      // The river.
      '<rect x="-20" y="622" width="1700" height="200" fill="url(#uw-river)"/>' +
      '<ellipse cx="240" cy="700" rx="200" ry="60" fill="url(#uw-refl)"/><ellipse cx="800" cy="690" rx="700" ry="60" fill="#4ff0d0" fill-opacity=".06"/>' +
      ripples +
      '<path class="uw-ss" d="M210 612L250 600L1660 640V760L240 640Z" fill="url(#uw-stream)"/>' +
      soulStream +
      '<rect class="uw-rb" x="-20" y="622" width="1700" height="200" fill="url(#uw-gate)"/>' +
      ferry() +
      wisps +
      '<g class="mv-r">' +
      hound() +
      // The rocks in front of the hound, and the near bank.
      '<path d="M1180 1000V640L1230 580L1290 610L1340 560L1400 596L1460 548L1520 590L1580 556L1640 600V1000Z" fill="#030a0c" stroke="#2f6b6a" stroke-opacity=".4" stroke-width="2"/>' +
      '</g>' +
      '<path d="M-20 1000V860Q80 820 190 850Q300 890 430 870Q640 900 760 1000Z" fill="#030a0c" stroke="#2f6b6a" stroke-opacity=".3" stroke-width="2"/>' +
      stalactites(21, '#071a1d', TEAL, 190, 74) +
      stalactites(34, ROCK, TEAL, 120, 90) +
      drips +
      messenger() +
      lanterns +
      '<rect class="uw-dark" width="1600" height="1000" fill="#010506"/>',
    nook:
      '<path d="M-40 462V420Q60 400 150 430L330 424L430 440V462Z" fill="#030a0c" stroke="#2f6b6a" stroke-opacity=".35" stroke-width="2"/>' +
      '<path d="M300 456L318 380L340 456M350 456L372 360L394 456" fill="#050d10" stroke="#2f6b6a" stroke-opacity=".3" stroke-width="2"/>',
    front:
      `<g fill="${TEAL}" fill-opacity=".35"><circle cx="196" cy="346" r="2"/><circle cx="296" cy="346" r="2"/></g>`,
  }
}
