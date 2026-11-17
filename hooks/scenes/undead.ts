import { f, random } from './kit'
import { U, X0, Y0, cell } from './rig'
import type { World } from './world'

// Undead: a survivor barricaded in a room. A big boarded window on the left with zombie silhouettes shambling past
// the gaps, a bare bulb that dims irregularly, a generator by the wall. Dark, never gory.
const ACC = '#9bd14a'
const DANGER = '#d83a3a'
const WIN = { x: 50, y: 130, w: 340, h: 670 }
const PLANK_Y = [150, 246, 342, 438, 534, 630, 726]
const PLANK_H = 40

/** A zombie standing at (x, y) on the ground, facing `dir`, walking `travel` px. Local height is about 215. */
function zombie(x: number, y: number, s: number, dir: 1 | -1, travel: number, seconds: number, delay: number, fill: string): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * dir)} ${f(s)})">` +
    `<g class="xs-z" style="--zx:${f(travel / s)}px;animation-duration:${f(seconds)}s;animation-delay:${f(delay)}s"><g class="xs-zb" style="animation-delay:${f(delay / 3)}s">` +
    `<path d="M-22 -168Q-30 -120 -26 -70L-32 -68H32L26 -120Q30 -160 14 -176ZM-26 -70H-8L-12 0H-32ZM6 -70H28L30 0H8Z" fill="${fill}"/>` +
    `<circle cx="12" cy="-196" r="21" fill="${fill}"/>` +
    `<path d="M10 -160L64 -150M16 -140L70 -122" stroke="${fill}" stroke-width="13" stroke-linecap="round" fill="none"/>` +
    '<path class="xs-eyes" d="M16 -200h5v4h-5zM26 -200h5v4h-5z" fill="#9bd14a" fill-opacity=".55"/></g></g></g>'
  )
}

/** A rotting hand reaching in from the left, in its own rotated frame: forearm, palm, fingers. */
function hand(x: number, y: number, angle: number, cls: string, delay: number, scale = 1): string {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${scale})"><g class="${cls}" style="animation-delay:${f(delay)}s"><g class="xs-wig">` +
    '<path d="M-150 -9L-18 -7Q-14 -13 2 -12Q18 -10 18 0Q18 11 2 12Q-14 13 -18 7L-150 10Z" fill="#26311f"/>' +
    '<path d="M10 -8L40 -15M13 -3L48 -5M13 3L47 6M9 8L38 17M-6 -11L8 -24" stroke="#26311f" stroke-width="5" stroke-linecap="round" fill="none"/>' +
    '<path d="M-130 -4L-20 -3" stroke="#3e5230" stroke-width="2" fill="none"/></g></g></g>'
  )
}

export function undeadWorld(): World {
  const next = random(1347)

  // Outside the window: far and near zombies, clipped to the gaps.
  const zombies = [
    [90, 770, 1.45, 1, 250, 22, -3, '#0c110a'],
    [330, 760, 1.5, -1, 240, 26, -11, '#0c110a'],
    [60, 800, 2.3, 1, 300, 30, -9, '#050704'],
    [380, 805, 2.2, -1, 290, 34, -20, '#050704'],
    [200, 790, 1.9, 1, 160, 20, -14, '#070a06'],
  ]
    .map(([x, y, s, dir, travel, sec, delay, fill]) => zombie(x as number, y as number, s as number, dir as 1 | -1, travel as number, sec as number, delay as number, fill as string))
    .join('')

  const planks = PLANK_Y.map((y, index) => {
    const tilt = (next() - 0.5) * 3.2
    const x = WIN.x - 14 + next() * 8
    const w = WIN.w + 18 + next() * 10
    const nails = `M${f(x + 14)} ${y + 20}m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M${f(x + w - 14)} ${y + 20}m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`

    return (
      `<g transform="rotate(${f(tilt)} ${f(x + w / 2)} ${y + 20})"><g class="xs-pl" style="--j:${f(index % 2 === 0 ? 1 : -1)};animation-delay:${f(-next() * 0.4)}s">` +
      `<rect x="${f(x)}" y="${y}" width="${f(w)}" height="${PLANK_H}" rx="3" fill="url(#xs-wood)" stroke="#120d07" stroke-width="2"/>` +
      `<path d="${nails}" fill="#0b0805"/><path d="M${f(x + 30)} ${y + 12}H${f(x + w - 60)}" stroke="#1a130b" stroke-width="2"/></g></g>`
    )
  }).join('')

  const gapY = PLANK_Y.slice(0, 6).map(y => y + PLANK_H + 28)
  const ambientHands = [1, 4].map((k, i) => hand(330, gapY[k] ?? 300, 8 - i * 12, 'xs-hand', i * -5.5)).join('')
  const burstHands = gapY.map((y, i) => hand(300 + (i % 2) * 40, y, (i % 3) * 7 - 7, 'xs-hand-e', i * 0.09, 1.05)).join('')
  const shafts = gapY
    .map((y, i) => `<polygon class="xs-shaft" points="${WIN.x + WIN.w},${y - 28} ${WIN.x + WIN.w},${y + 28} 1100,${y + 330 + i * 30} 1100,${y + 190 + i * 30}" fill="url(#xs-shaft)" style="animation-delay:${f(i * 0.15)}s"/>`)
    .join('')
  const dust = Array.from({ length: 16 }, () => `<circle class="xs-dust" cx="${f(WIN.x + 10 + next() * (WIN.w - 20))}" cy="${f(WIN.y + 60 + next() * 400)}" r="${f(1.2 + next() * 1.4)}" fill="#cfd2b8" style="animation-delay:${f(-next() * 2.4)}s"/>`).join('')
  const motes = Array.from({ length: 12 }, () => `<circle class="xs-mote" cx="${f(1150 + next() * 400)}" cy="${f(150 + next() * 320)}" r="${f(0.8 + next() * 1.2)}" fill="#f2dc9a" fill-opacity="${f(0.2 + next() * 0.25)}" style="animation-delay:${f(-next() * 14)}s"/>`).join('')

  const generator =
    '<ellipse cx="215" cy="932" rx="130" ry="9" fill="#050704" fill-opacity=".7"/>' +
    '<g class="xs-gen"><rect x="110" y="846" width="210" height="82" rx="8" fill="#2c302a" stroke="#3b4036" stroke-width="2"/>' +
    '<rect x="130" y="818" width="124" height="32" rx="14" fill="#2c302a" stroke="#3b4036" stroke-width="2"/>' +
    '<rect x="288" y="780" width="12" height="70" fill="#1f231d"/><rect x="284" y="776" width="20" height="8" rx="2" fill="#1f231d"/>' +
    '<path d="M130 862H250M130 876H250M130 890H250M130 904H250" stroke="#171a14" stroke-width="3"/>' +
    '<rect x="262" y="860" width="46" height="48" rx="4" fill="#171a14"/>' +
    `<circle class="xs-led" cx="285" cy="876" r="5" fill="${ACC}"/><path d="M270 896H300" stroke="#3b4036" stroke-width="3"/>` +
    '<path d="M110 880Q90 884 92 904" stroke="#171a14" stroke-width="5" fill="none"/></g>' +
    '<path d="M320 905Q600 962 1040 948" stroke="#0e120c" stroke-width="6" fill="none"/>' +
    [0, 1, 2, 3].map(i => `<circle class="xs-puff" cx="294" cy="774" r="9" fill="#8a8f80" style="animation-delay:${f(i * 0.55)}s"/>`).join('')

  const smallBoards = [-250, -190, -130, -70].map(y => `<rect x="24" y="${y}" width="212" height="26" rx="3" fill="url(#xs-wood)" stroke="#120d07" stroke-width="2"/>`).join('')
  const nookDust = Array.from({ length: 8 }, () => `<circle class="xs-dust" cx="${f(40 + next() * 180)}" cy="${f(-160 + next() * 110)}" r="1.5" fill="#cfd2b8" style="animation-delay:${f(-next() * 2.4)}s"/>`).join('')

  const pins = [
    [286, -214, ACC],
    [330, -180, DANGER],
    [378, -222, ACC],
    [300, -120, ACC],
    [352, -100, DANGER],
    [392, -150, ACC],
  ]
  const pinMarkup = pins
    .map(([x, y, c], i) => `<circle class="xs-halo" cx="${x}" cy="${y}" r="13" fill="${c}" style="animation-delay:${f(-i * 0.25)}s"/><circle cx="${x}" cy="${y}" r="3.5" fill="${c}"/>`)
    .join('')

  const nook =
    // Boarded window above the desk; hands reach through now and then.
    `<rect x="30" y="-270" width="200" height="230" fill="url(#xs-out)"/><rect class="xs-dawn" x="30" y="-270" width="200" height="230" fill="url(#xs-sun)"/>` +
    smallBoards +
    hand(190, -217, 14, 'xs-hand xs-hand-n', -2, 0.9) +
    hand(170, -97, -10, 'xs-hand xs-hand-n', -9, 0.9) +
    nookDust +
    '<rect x="30" y="-270" width="200" height="230" fill="none" stroke="#2a2116" stroke-width="10"/>' +
    // A wall map with pins.
    `<circle class="xs-mapglow" cx="337" cy="-155" r="150" fill="url(#xs-glow)"/>` +
    '<g class="xs-map"><rect x="262" y="-250" width="150" height="190" fill="#d9dcc8" fill-opacity=".2" stroke="#3a2e1c" stroke-width="3"/>' +
    `<path d="M272 -230Q310 -210 330 -240T400 -228M272 -190Q320 -170 350 -200T404 -180M272 -150Q300 -120 340 -140T404 -110M272 -90Q320 -80 360 -100" stroke="${ACC}" stroke-opacity=".45" stroke-width="1.5" fill="none"/>` +
    `<path d="M286 -214L330 -180L378 -222M330 -180L300 -120L352 -100L392 -150" stroke="#d9dcc8" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>${pinMarkup}</g>` +
    // The flashlight on the crate, and its beam.
    '<defs><linearGradient id="xs-beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#f4f0c0" stop-opacity=".4"/><stop offset="1" stop-color="#f4f0c0" stop-opacity="0"/></linearGradient></defs>' +
    '<g transform="translate(428 322)"><g class="xs-sweep"><path d="M0 0L-900 -120V120Z" fill="url(#xs-beam)"/></g></g>' +
    '<rect x="428" y="316" width="32" height="14" rx="3" fill="#2c302a"/><rect x="424" y="313" width="8" height="20" rx="2" fill="#44483c"/>' +
    // The CB radio and its waves.
    '<rect x="360" y="298" width="52" height="32" rx="3" fill="#2c302a" stroke="#171a14" stroke-width="2"/>' +
    `<circle cx="376" cy="314" r="7" fill="#171a14"/><rect class="xs-rled" x="392" y="304" width="12" height="5" fill="${ACC}"/><path d="M390 318H404M390 323H404" stroke="#171a14" stroke-width="2"/>` +
    '<line x1="404" y1="298" x2="418" y2="234" stroke="#44483c" stroke-width="3"/>' +
    [0, 0.7, 1.4]
      .map(d => `<circle class="xs-wave" cx="418" cy="234" r="130" fill="none" stroke="${ACC}" stroke-width="2.5" style="animation-delay:${d}s"/>`)
      .join('')

  const bandanaTail = `<g class="xs-tail"><path d="M${X0 + 12.3 * U} ${Y0 - 0.1 * U}L${X0 + 14.6 * U} ${Y0 - 0.6 * U}L${X0 + 14.2 * U} ${Y0 + 0.5 * U}L${X0 + 15 * U} ${Y0 + 1.4 * U}L${X0 + 12.3 * U} ${Y0 + 0.9 * U}Z" fill="#c8312f"/></g>`
  const wearFront =
    `<path d="M${X0 + 2 * U} ${Y0 - 0.1 * U}Q${X0 + 7 * U} ${Y0 - 1.6 * U} ${X0 + 12 * U} ${Y0 - 0.1 * U}Z" fill="#c8312f"/>` +
    cell(1.75, -0.15, 10.5, 1.1, ' fill="#c8312f"') +
    cell(1.75, 0.65, 10.5, 0.25, ' fill="#7a1a1a"') +
    bandanaTail +
    `<g transform="rotate(-14 ${X0 + 9.4 * U} ${Y0 + 4.7 * U})">${cell(8.2, 4.3, 2.4, 0.9, ' fill="#d9dcc8" fill-opacity=".92"')}${cell(9.2, 4.3, 0.2, 0.9, ' fill="#8a8d78"')}</g>`

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'laptop',
      cup: 'mug',
      thought: 'spores',
      ink: '#050704',
      furniture: '#2a2116',
      metal: '#2c302a',
      paper: '#d9dcc8',
      light: { idle: '#8f9a5a', work: '#b8d46a', bright: '#e4f59a' },
      wear: { front: wearFront },
      headTop: Y0 - 0.9 * U,
      glowAt: [326, 272],
      seatArt:
        '<g><path d="M118 350H184L198 456H104Z" fill="#2c302a"/><path d="M116 372H186M110 438H192" stroke="#171a14" stroke-width="3"/>' +
        '<ellipse cx="151" cy="351" rx="33" ry="5" fill="#3b4036"/><path d="M122 404L130 392M170 420L178 410" stroke="#5a3a1c" stroke-width="3"/></g>',
      tableArt:
        '<g stroke="#120d07" stroke-width="2">' +
        '<rect x="168" y="392" width="94" height="64" fill="#2a2116"/><rect x="264" y="392" width="94" height="64" fill="#251d12"/><rect x="360" y="392" width="94" height="64" fill="#2a2116"/>' +
        '<rect x="168" y="330" width="150" height="62" fill="#30261a"/><rect x="322" y="330" width="148" height="62" fill="#2a2116"/></g>' +
        '<path d="M168 330L318 392M318 330L168 392M322 330L470 392M470 330L322 392M168 392L262 456M262 392L168 456M360 392L454 456M454 392L360 456" stroke="#1a130b" stroke-width="3"/>' +
        '<path d="M176 340H310M330 340H462" stroke="#4a3a22" stroke-opacity=".6" stroke-width="2"/>',
      device: (light, activity) => {
        const busy = activity !== 'idle' && activity !== 'thinking'

        return (
          '<rect x="238" y="322" width="112" height="8" rx="2" fill="#2c302a"/>' +
          `<g fill="${light}" fill-opacity="${busy ? 0.55 : 0.3}">${[246, 258, 270, 282, 294, 306].map(x => `<rect x="${x}" y="323" width="7" height="3"/>`).join('')}</g>` +
          '<path d="M336 326L346 236L363 238L354 328Z" fill="#2c302a"/>' +
          `<line x1="334" y1="324" x2="344" y2="240" stroke="${light}" stroke-width="3"/>` +
          '<path d="M346 262L356 276L349 290L358 306" stroke="#050704" stroke-width="2" fill="none"/>' +
          '<rect x="340" y="296" width="18" height="6" fill="#d9dcc8" fill-opacity=".6" transform="rotate(-8 349 299)"/>' +
          '<path d="M350 330Q380 340 392 328" stroke="#171a14" stroke-width="3" fill="none"/>'
        )
      },
    },
    style:
      '@keyframes xs-in{from{opacity:0}to{opacity:1}}' +
      // Zombies: they shamble across the gaps with a lurching gait, loop, and fade at the ends.
      '.xs-z{opacity:0;animation:xs-walk 24s linear infinite}' +
      '@keyframes xs-walk{0%{opacity:0;transform:translateX(0)}8%{opacity:1}92%{opacity:1}100%{opacity:0;transform:translateX(var(--zx))}}' +
      '.xs-zb{transform-box:fill-box;transform-origin:50% 100%;animation:xs-lurch 1.7s ease-in-out infinite}' +
      '@keyframes xs-lurch{0%,100%{transform:translateY(0) rotate(-2deg)}35%{transform:translateY(-7px) rotate(3deg)}65%{transform:translateY(0) rotate(6deg)}}' +
      '.st-thinking .xs-z{animation-play-state:paused}' +
      '.st-thinking .xs-zb{animation:xs-mill 2.6s ease-in-out infinite alternate}' +
      '@keyframes xs-mill{from{transform:rotate(-7deg) translateX(-6px)}to{transform:rotate(7deg) translateX(6px)}}' +
      '.st-error .xs-eyes{fill:#d83a3a;fill-opacity:.8}' +
      '.st-done .xs-z{animation:xs-retreat 3.6s ease-in both}' +
      '@keyframes xs-retreat{0%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(-260px)}}' +
      // Hands in the gaps.
      '.xs-hand{opacity:0;animation:xs-reach 15s ease-in-out infinite}' +
      '@keyframes xs-reach{0%,68%,100%{opacity:0;transform:translateX(-70px)}74%{opacity:1;transform:translateX(0)}86%{opacity:1;transform:translateX(-10px)}93%{opacity:0;transform:translateX(-70px)}}' +
      '.st-error .xs-hand-n{animation-duration:2.6s}' +
      '.xs-hand-e{opacity:0}.st-error .xs-hand-e{animation:xs-burst .45s cubic-bezier(.2,.9,.3,1) both}' +
      '@keyframes xs-burst{0%{opacity:0;transform:translateX(-90px)}100%{opacity:1;transform:translateX(0)}}' +
      '.st-error .xs-wig{transform-box:fill-box;transform-origin:0 50%;animation:xs-wig .6s ease-in-out infinite alternate}' +
      '@keyframes xs-wig{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}' +
      // error: the door bangs.
      '.st-error .xs-bang{animation:xs-bang 1.1s ease-in-out infinite}' +
      '@keyframes xs-bang{0%,100%{transform:translateX(0)}6%{transform:translateX(-5px)}13%{transform:translateX(3px)}22%{transform:translateX(0)}}' +
      '.st-error .xs-pl{animation:xs-jolt 1.1s ease-in-out infinite}' +
      '@keyframes xs-jolt{0%,100%{transform:translate(0,0)}8%{transform:translate(calc(var(--j) * 5px),-4px)}18%{transform:translate(0,2px)}30%{transform:translate(0,0)}}' +
      '.xs-dust{opacity:0}.st-error .xs-dust{animation:xs-dust 2.4s linear infinite}' +
      '@keyframes xs-dust{0%{opacity:0;transform:translateY(0)}15%{opacity:.7}100%{opacity:0;transform:translateY(120px)}}' +
      // The bulb dims irregularly and softly.
      '.xs-glow{transform-box:fill-box;transform-origin:center;animation:xs-bulb 11s ease-in-out infinite}' +
      '@keyframes xs-bulb{0%,40%,70%,100%{opacity:1}6%{opacity:.82}9%{opacity:.94}14%{opacity:.68}18%{opacity:.9}44%{opacity:.78}48%{opacity:.95}74%{opacity:.84}79%{opacity:.97}}' +
      '.st-run .xs-glow{animation:xs-steady 1.4s ease-out both}' +
      '@keyframes xs-steady{from{opacity:.8;transform:scale(1)}to{opacity:1;transform:scale(1.25)}}' +
      '.xs-mote{animation:xs-mote 14s ease-in-out infinite alternate}@keyframes xs-mote{to{transform:translate(18px,-26px)}}' +
      // Generator.
      '.xs-led{opacity:.55}.st-run .xs-led{opacity:1}' +
      '.st-run .xs-gen{animation:xs-vib .11s linear infinite alternate}@keyframes xs-vib{from{transform:translate(-1px,0)}to{transform:translate(1.2px,.8px)}}' +
      '.xs-puff{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-run .xs-puff{animation:xs-puff 2.2s ease-out infinite}' +
      '@keyframes xs-puff{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:.4}100%{opacity:0;transform:translate(26px,-120px) scale(3)}}' +
      // tool: the flashlight sweeps.
      '.xs-sweep{opacity:0;transform-box:fill-box;transform-origin:100% 50%}' +
      '.st-tool .xs-sweep{opacity:1;animation:xs-sweep 3.2s ease-in-out infinite alternate}' +
      '@keyframes xs-sweep{from{transform:rotate(-16deg)}to{transform:rotate(5deg)}}' +
      // read: the map lights up.
      '.xs-map{opacity:.5}.st-read .xs-map{opacity:1}' +
      '.xs-mapglow{opacity:0}.st-read .xs-mapglow{animation:xs-glow 1.6s ease-out both}@keyframes xs-glow{from{opacity:0}to{opacity:.38}}' +
      '.xs-halo{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-read .xs-halo{animation:xs-halo 1.5s ease-in-out infinite alternate}@keyframes xs-halo{from{opacity:.1;transform:scale(.7)}to{opacity:.55;transform:scale(1.3)}}' +
      // web: the CB radio.
      '.xs-wave{opacity:0;transform-box:fill-box;transform-origin:center}' +
      '.st-web .xs-wave{animation:xs-wave 2.2s ease-out infinite}' +
      '@keyframes xs-wave{0%{opacity:.6;transform:scale(.06)}100%{opacity:0;transform:scale(1)}}' +
      '.xs-rled{opacity:.35}.st-web .xs-rled,.st-responding .xs-rled{animation:xs-rl 1.2s ease-in-out infinite alternate}@keyframes xs-rl{from{opacity:.3}to{opacity:1}}' +
      '.xs-tail{transform-box:fill-box;transform-origin:0 30%;animation:xs-tail 2.6s ease-in-out infinite alternate}@keyframes xs-tail{from{transform:rotate(-5deg)}to{transform:rotate(9deg)}}' +
      // done: dawn.
      '.xs-shaft,.xs-dawn{opacity:0}.st-done .xs-shaft{animation:xs-in 2.4s ease-out both}' +
      '.st-done .xs-dawn{animation:xs-dawn 3s ease-out both}@keyframes xs-dawn{from{opacity:0}to{opacity:.32}}',
    scenery:
      '<defs><pattern id="xs-wall" width="110" height="1000" patternUnits="userSpaceOnUse"><rect width="110" height="1000" fill="#0b0f0a"/>' +
      '<rect width="3" height="1000" fill="#060805"/><rect x="48" width="1.5" height="1000" fill="#0e130c"/></pattern>' +
      '<linearGradient id="xs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2e1c"/><stop offset="1" stop-color="#241b10"/></linearGradient>' +
      '<linearGradient id="xs-out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26331f"/><stop offset="1" stop-color="#10160d"/></linearGradient>' +
      '<linearGradient id="xs-sun" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd890"/><stop offset="1" stop-color="#ffe9b8" stop-opacity=".2"/></linearGradient>' +
      '<linearGradient id="xs-shaft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe6a8" stop-opacity=".26"/><stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="xs-bulb"><stop offset="0" stop-color="#f2dc9a" stop-opacity=".34"/><stop offset=".5" stop-color="#f2dc9a" stop-opacity=".1"/><stop offset="1" stop-color="#f2dc9a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xs-glow"><stop offset="0" stop-color="#e4f59a" stop-opacity=".5"/><stop offset="1" stop-color="#e4f59a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xs-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>' +
      `<clipPath id="xs-wclip"><rect x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}"/></clipPath></defs>` +
      '<rect width="1600" height="1000" fill="url(#xs-wall)"/>' +
      '<rect y="925" width="1600" height="75" fill="#080b07"/><line x1="0" y1="925" x2="1600" y2="925" stroke="#1a2016" stroke-width="2"/>' +
      '<path d="M0 960H1600M0 985H1600" stroke="#0e120c" stroke-width="2"/>' +
      // The big boarded window: outside first, then the planks over it.
      `<rect x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" fill="url(#xs-out)"/>` +
      `<g clip-path="url(#xs-wclip)">${zombies}<rect class="xs-dawn" x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" fill="url(#xs-sun)"/></g>` +
      '<g class="xs-bang">' +
      planks +
      '<g clip-path="url(#xs-wclip)"><g transform="rotate(-52 220 470)"><rect x="-90" y="448" width="620" height="44" rx="3" fill="url(#xs-wood)" stroke="#120d07" stroke-width="2"/>' +
      '<path d="M-70 470m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M510 470m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" fill="#0b0805"/></g></g>' +
      `<rect x="${WIN.x - 6}" y="${WIN.y - 6}" width="${WIN.w + 12}" height="${WIN.h + 12}" fill="none" stroke="#2a2116" stroke-width="14"/>` +
      ambientHands +
      burstHands +
      dust +
      '</g>' +
      shafts +
      generator +
      motes +
      // The bare bulb, top right.
      '<g class="mv-r"><g class="mv-t">' +
      '<line x1="1420" y1="-200" x2="1420" y2="178" stroke="#050704" stroke-width="3"/>' +
      '<circle class="xs-glow" cx="1420" cy="196" r="330" fill="url(#xs-bulb)"/>' +
      '<rect x="1414" y="172" width="12" height="12" fill="#2c302a"/><circle cx="1420" cy="196" r="12" fill="#f2dc9a" fill-opacity=".85"/></g></g>' +
      '<rect width="1600" height="1000" fill="url(#xs-vig)"/>',
    nook,
  }
}
