import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Wave Planet: an endless knee-deep ocean at dusk. What reads as a mountain range on the left horizon is a wave as
// tall as mountains, backlit by the set sun; a ringed gas giant rises behind the lander that stands in the shallows,
// and Claude works the lander's console from a seat in the water. When a command runs the wave rears up and comes
// on while the thrusters spool up; an error knocks the lander onto one leg in a burst of spray; done lifts it off as
// the wave passes.
const ICE = '#bfe4ff'
const FOAM = '#e8f6ff'
const CORAL = '#d97757'
const HZ = 590
const SUIT = '#c9d3dc'
const SUIT_EDGE = '#7d8b98'
const PX = 1410
const PY = 400
const PR = 210

/** The wave's crest: a wall standing over the left third, a shoulder, then a low ridge along the whole horizon. */
function crestY(x: number): number {
  const wall = 230 / (1 + Math.exp((x - 400) / 34))
  const hills = (11 * Math.sin(x / 74 + 0.6) + 6 * Math.sin(x / 29)) * (0.4 + wall / 230)
  const shoulder = 44 * Math.exp(-(((x - 590) / 110) ** 2))
  const far = 22 * Math.exp(-(((x - 1000) / 200) ** 2))

  return HZ - (32 + wall + shoulder + far + hills)
}

const XS = [...Array.from({ length: 68 }, (_, i) => -240 + i * 14), ...Array.from({ length: 29 }, (_, i) => 720 + i * 40)]
const along = (dy: (y: number) => number): string[] => XS.map(x => `${x} ${Math.round(crestY(x) + dy(crestY(x)))}`)
const CREST = `M${along(() => 0).join('L')}`
const BODY = `${CREST}L1840 598L-240 598Z`
const FACE = `M${along(() => 9).join('L')}L${along(y => Math.min(9 + 0.44 * (HZ - y), HZ - 2 - y)).reverse().join('L')}Z`
const LIP = `${CREST}L${along(y => Math.min(5 + 0.05 * (HZ - y), HZ - y)).reverse().join('L')}Z`
/** Spray feathering back off the top of the wall as it rears up. */
const FEATHERS = Array.from({ length: 37 }, (_, i) => {
  const x = -230 + i * 18
  const k = (Math.sin(i * 2.7) + 1) / 2

  return `M${x} ${Math.round(crestY(x))}l${Math.round(-8 - k * 10)} ${Math.round(-10 - k * 14)}`
}).join('')

/** Dots as one path of tiny squares. */
function dots(points: [number, number][], size: number): string {
  return points.map(([x, y]) => `M${f(x)} ${f(y)}h${size}v${size}h${-size}z`).join('')
}

/** Claude's own emblem, a coral starburst. */
function starburst(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.4

    return `${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))}`
  })

  return `<path d="M${points.join('L')}Z" fill="${CORAL}"/>`
}

/** A tongue of water rising from its foot at (0, 0). */
function tongue(w: number, h: number): string {
  return `M${f(-w / 2)} 0C${f(-w / 2)} ${f(-h * 0.5)} ${f(-w * 0.15)} ${f(-h * 0.8)} 0 ${f(-h)}C${f(w * 0.15)} ${f(-h * 0.8)} ${f(w / 2)} ${f(-h * 0.5)} ${f(w / 2)} 0Z`
}

/** The lander's console: a rugged screen with the wave's height on it, keys, and a chronometer ticking off the hours. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${252 + i * 13}" y="325" width="8" height="3" fill="${light}" fill-opacity=".55"/>`).join('')
  const peak = activity === 'run' ? 250 : activity === 'error' ? 266 : activity === 'done' ? 294 : 284
  const marks = [0, 90, 180, 270]
    .map(a => `<path d="M0 -10V-7" stroke="#9aa7b2" stroke-width="2" transform="rotate(${a})"/>`)
    .join('')

  return (
    '<rect x="244" y="322" width="152" height="9" rx="2" fill="#26323f"/>' +
    keys +
    '<path d="M300 326L314 232L406 236L400 326Z" fill="#1f2a36" stroke="#3a4a5c" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M300 326L303 306M400 326L401 306M314 232L317 248M406 236L405 252" stroke="#9aa7b2" stroke-width="6" stroke-linecap="round"/>' +
    `<path d="M310 318L322 242L397 245L392 318Z" fill="#050d14"/><path d="M310 318L322 242L397 245L392 318Z" fill="${light}" fill-opacity=".1"/>` +
    `<path d="M318 284H394M314 300H393" stroke="${light}" stroke-opacity=".18" stroke-width="1"/>` +
    `<path d="M316 306H334C340 306 342 ${peak} 350 ${peak}C356 ${peak} 360 300 366 304H390" fill="none" stroke="${light}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<rect x="378" y="296" width="5" height="8" fill="${light}" fill-opacity=".85"/>` +
    `<g fill="${light}" fill-opacity=".6"><circle cx="330" cy="322" r="1.6"/><circle cx="340" cy="322" r="1.6"/><circle cx="350" cy="322" r="1.6"/></g>` +
    '<path d="M398 324C412 334 440 336 458 330" fill="none" stroke="#0b1219" stroke-width="3.4" stroke-linecap="round"/>' +
    // The chronometer on its stand: every tick is a long time somewhere else.
    '<rect x="280" y="313" width="12" height="10" rx="2" fill="#26323f"/>' +
    '<circle cx="286" cy="303" r="12" fill="#0b141c" stroke="#9aa7b2" stroke-width="2.6"/>' +
    `<g transform="translate(286 303)">${marks}<g class="wv-tick"><path d="M0 2V-8" stroke="${light}" stroke-width="2" stroke-linecap="round"/></g>` +
    '<circle r="2" fill="#9aa7b2"/></g>'
  )
}

/** The lander, around the middle of its feet at (0, 0): legs, two bells, a descent stage and a rounded cabin. */
function lander(): string {
  const legs =
    '<g class="wv-legs">' +
    '<path d="M-80 -82L-110 -6M80 -82L110 -6M-46 -72L-102 -28M46 -72L102 -28" fill="none" stroke="#1d2935" stroke-width="7" stroke-linecap="round"/>' +
    `<path d="M-80 -82L-110 -6M80 -82L110 -6" fill="none" stroke="${ICE}" stroke-opacity=".2" stroke-width="1.6"/>` +
    '<g fill="#253341" stroke="#3a4b5c" stroke-width="1.6"><ellipse cx="-112" cy="-3" rx="20" ry="5.5"/><ellipse cx="112" cy="-3" rx="20" ry="5.5"/></g></g>'
  const flame = (x: number) => `<path d="M${x - 20} -50C${x - 18} -20 ${x - 8} 14 ${x} 40C${x + 8} 14 ${x + 18} -20 ${x + 20} -50Z" fill="url(#wv-plg)"/>`
  const arcs = [0, 0.5, 1]
    .map(d => `<path class="wv-arc" style="animation-delay:${d}s" d="M-9 -10.7A14 14 0 0 1 9 -10.7" fill="none" stroke="${ICE}" stroke-width="1.6"/>`)
    .join('')

  return (
    // The floodlight's beam and the pool it throws on the water, while a tool works.
    '<g transform="translate(-100 -112)"><g class="wv-beam"><path d="M0 0L-150 160L-60 186Z" fill="url(#wv-bm)"/>' +
    '<ellipse cx="-104" cy="176" rx="58" ry="10" fill="url(#wv-lm)"/></g></g>' +
    legs +
    `<g class="wv-plm"><g class="wv-plf">${flame(-40)}${flame(40)}</g></g>` +
    '<g class="wv-thr"><g class="wv-thf"><ellipse cx="-40" cy="-44" rx="30" ry="16" fill="url(#wv-thg)"/><ellipse cx="40" cy="-44" rx="30" ry="16" fill="url(#wv-thg)"/>' +
    '<ellipse cx="0" cy="-4" rx="150" ry="18" fill="url(#wv-thg)" opacity=".5"/></g></g>' +
    '<path d="M-56 -72H-24L-18 -50H-62ZM24 -72H56L62 -50H18Z" fill="#0c131a" stroke="#3a4a5a" stroke-width="1.6"/>' +
    '<path d="M-96 -72H96L84 -126H-84Z" fill="#141e28" stroke="#2e3e4f" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M-40 -72L-37 -126M40 -72L37 -126M-90 -96H-56M56 -96H90" stroke="#0a1118" stroke-width="2"/>' +
    starburst(0, -99, 13) +
    '<rect x="-106" y="-120" width="14" height="10" rx="2" fill="#2a3846"/><circle cx="-102" cy="-114" r="2.4" fill="#dfeffa" fill-opacity=".7"/>' +
    '<path d="M-74 -126V-184Q-74 -216 -42 -216H42Q74 -216 74 -184V-126Z" fill="#18232e" stroke="#34475b" stroke-width="2"/>' +
    '<rect x="-54" y="-200" width="108" height="26" rx="10" fill="#08131d" stroke="#4a6378" stroke-width="2"/>' +
    `<rect class="wv-win" x="-49" y="-195" width="98" height="16" rx="7" fill="${ICE}" fill-opacity=".26"/>` +
    `<path d="M-74 -150H74" stroke="${ICE}" stroke-opacity=".3" stroke-width="3"/>` +
    '<path d="M-18 -128V-160Q-18 -166 -12 -166H12Q18 -166 18 -160V-128" fill="none" stroke="#2c3b4b" stroke-width="2"/>' +
    '<g fill="#223040" stroke="#3a4b5c" stroke-width="1.2"><rect x="-84" y="-182" width="10" height="20" rx="2"/><rect x="74" y="-182" width="10" height="20" rx="2"/></g>' +
    // The dusk light on its left edges.
    `<path d="M-74 -128V-184Q-74 -216 -42 -216H0M-96 -72L-84 -126" fill="none" stroke="${ICE}" stroke-opacity=".3" stroke-width="2"/>` +
    // The dish on its mast, which turns to the sky for the web, and the beacon.
    '<path d="M44 -216V-236" stroke="#2c3b4b" stroke-width="3"/>' +
    '<g transform="translate(44 -238)"><g class="wv-dish"><path d="M-17 -6Q0 10 17 -6Z" fill="#26323f" stroke="#5a7388" stroke-width="1.5"/>' +
    `<path d="M0 1V-12" stroke="#5a7388" stroke-width="1.5"/><circle cy="-13" r="2.2" fill="${ICE}"/><g transform="translate(0 -13)">${arcs}</g></g></g>` +
    '<path d="M-36 -216V-230" stroke="#2c3b4b" stroke-width="3"/>' +
    `<circle class="wv-bcn" cx="-36" cy="-233" r="11" fill="url(#wv-lm)"/><circle class="wv-bcn" cx="-36" cy="-233" r="3.4" fill="${ICE}"/>` +
    '<g class="wv-warn"><circle cx="-36" cy="-233" r="13" fill="#ffb347" fill-opacity=".25"/><circle cx="-36" cy="-233" r="4" fill="#ffc46b"/></g>'
  )
}

export function wavePlanetWorld(): World {
  const next = random(4041)

  const starA: [number, number][] = []
  const starB: [number, number][] = []
  for (let i = 0; i < 46; i += 1) {
    const p: [number, number] = [next() * 1600, 8 + next() * 400]
    ;(i % 2 === 0 ? starA : starB).push(p)
  }

  // The planet's cloud bands, turned with its ring.
  const tones = ['#28414f', '#33505f', '#22394a', '#3c5d6c', '#2b4656', '#46697a']
  let bandY = PY - PR - 10
  let bands = ''
  for (let i = 0; bandY < PY + PR; i += 1) {
    const h = 22 + next() * 40
    bands += `<rect x="${PX - 260}" y="${f(bandY)}" width="520" height="${f(h + 1)}" fill="${tones[i % tones.length]}"/>`
    bandY += h
  }
  const ring = (rx: number, ry: number, width: number, opacity: number, back: boolean) =>
    `<path d="M${PX - rx} ${PY}A${rx} ${ry} 0 0 ${back ? 1 : 0} ${PX + rx} ${PY}" fill="none" stroke="url(#wv-rg)" stroke-opacity="${opacity}" stroke-width="${width}"/>`
  const rings = (back: boolean) =>
    `<g transform="rotate(-16 ${PX} ${PY})">${ring(330, 50, 14, 1, back)}${ring(362, 56, 6, 0.6, back)}</g>`

  // Ripple lines on the mirror: thinner and closer near the horizon, dimmer over the chat column.
  const lineSide: string[] = []
  const lineMid: string[] = []
  for (let i = 0; i < 44; i += 1) {
    const y = HZ + 6 + Math.pow(next(), 1.6) * 400
    const len = 16 + (y - HZ) * (0.3 + next() * 0.5)
    const x = -40 + next() * 1640
    const mid = x + len / 2
    ;(mid > 400 && mid < 1200 ? lineMid : lineSide).push(`M${Math.round(x)} ${Math.round(y)}h${Math.round(len)}`)
  }
  const glints = Array.from({ length: 14 }, () => `M${Math.round(next() * 400)} ${Math.round(598 + next() * 110)}h${Math.round(10 + next() * 34)}`)
  const planetGlints = Array.from({ length: 10 }, () => `M${Math.round(1230 + next() * 330)} ${Math.round(598 + next() * 90)}h${Math.round(12 + next() * 40)}`).join('')

  // The sand under the shallows, seen through the water at the foot of the picture.
  const floor = Array.from({ length: 6 }, (_, k) => {
    const y = 838 + k * 26 + k * k * 2
    const p = 44 + k * 8
    const n = Math.ceil(900 / p) * 2

    return `M-40 ${y}q${f(p / 4)} ${-4 - k} ${f(p / 2)} 0${`t${f(p / 2)} 0`.repeat(n - 1)}`
  }).join('')
  const pebbles = Array.from({ length: 7 }, () => `<ellipse cx="${f(40 + next() * 660)}" cy="${f(850 + next() * 130)}" rx="${f(4 + next() * 5)}" ry="${f(2 + next() * 2)}"/>`).join('')

  const spray = [-60, 0, 60, 120, 180, 240, 300, 350]
    .map((x, i) => `<ellipse class="wv-spr" style="animation-delay:${f(-i * 0.63)}s" cx="${x}" cy="${f(crestY(x) - 4)}" rx="${f(40 + next() * 26)}" ry="${f(9 + next() * 7)}" fill="url(#wv-sp)"/>`)
    .join('')

  const ripple = (cx: number, cy: number, rx: number, ry: number, opacity: number, delay: number) =>
    `<ellipse class="wv-rp" style="animation-delay:${delay}s" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ICE}" stroke-opacity="${opacity}" stroke-width="1.6"/>`
  const paw = (x: number, y: number, delay: number) =>
    `<g class="wv-paw" style="animation-delay:${delay}s"><path d="M${x} ${y}h46M${x + 20} ${y + 7}h60M${x - 14} ${y + 14}h40M${x + 40} ${y - 6}h30"/></g>`

  const washEdge = 'M-60 830Q60 790 200 812Q330 832 470 800Q560 780 640 818'
  const washDrops = Array.from({ length: 9 }, (_, i) => `<circle cx="${f(i * 76 + next() * 30)}" cy="${f(786 + next() * 30 - (i % 3) * 14)}" r="${f(3 + next() * 4)}"/>`).join('')

  const splash = [
    [-52, 110, 36],
    [-28, 170, 44],
    [-6, 214, 50],
    [16, 166, 42],
    [38, 118, 34],
  ]
    .map(([a, h, w], i) => `<g transform="rotate(${a})"><path class="wv-spl" style="animation-delay:${f(i * 0.05)}s" d="${tongue(w!, h!)}" fill="url(#wv-spg)"/></g>`)
    .join('')
  const flecks = Array.from({ length: 10 }, (_, i) => {
    const dx = (i - 4.5) * 34 + (next() - 0.5) * 20
    const dy = -60 - next() * 120

    return `<circle class="wv-dp" style="--dx:${f(dx)}px;--dy:${f(dy + 160)}px;animation-delay:${f(i * 0.06)}s" r="${f(2.5 + next() * 3)}" fill="${FOAM}"/>`
  }).join('')
  const drops = Array.from({ length: 10 }, (_, i) => {
    const x = 30 + i * 40 + next() * 20
    const y = -60 + next() * 120

    return `<ellipse class="wv-drop" style="--dx:${f((next() - 0.5) * 40)}px;animation-delay:${f(i * 0.11)}s" cx="${f(x)}" cy="${f(y)}" rx="2.4" ry="4.4" fill="${FOAM}"/>`
  }).join('')

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'panel',
      cup: 'none',
      thought: 'orbs',
      ink: '#03070b',
      furniture: '#1b2632',
      metal: '#9aa7b2',
      paper: '#d4e0e8',
      light: { idle: '#5f8fae', work: ICE, bright: '#e6f5ff' },
      headTop: 202,
      glowAt: [356, 282],
      device,
      wear: {
        // The life-support pack on its back.
        behind:
          `<rect x="26" y="252" width="48" height="88" rx="10" fill="#aab6c0" stroke="${SUIT_EDGE}" stroke-width="2"/>` +
          '<rect x="33" y="262" width="12" height="44" rx="4" fill="#7c8995"/><rect x="50" y="262" width="12" height="20" rx="3" fill="#7c8995"/>' +
          `<circle cx="56" cy="322" r="3.6" fill="${ICE}" fill-opacity=".85"/>`,
        // The explorer's helmet: a white shell over the crown and sides, a clear visor over the eyes, a lamp, the
        // coral starburst on the dome, and a neck ring under the visor.
        front:
          `<path d="M66 332V240A40 40 0 0 1 106 200H194A40 40 0 0 1 234 240V332ZM80 254Q80 246 88 246H212Q220 246 220 254V314Q220 322 212 322H88Q80 322 80 314Z" fill="${SUIT}" fill-rule="evenodd" stroke="${SUIT_EDGE}" stroke-width="2.5" stroke-linejoin="round"/>` +
          `<path d="M80 254Q80 246 88 246H212Q220 246 220 254V314Q220 322 212 322H88Q80 322 80 314Z" fill="${ICE}" fill-opacity=".1" stroke="#5c6a77" stroke-width="2"/>` +
          '<path d="M118 208Q158 202 196 210" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M200 252Q214 254 214 272" fill="none" stroke="#ffffff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>' +
          `<rect x="228" y="212" width="16" height="16" rx="4" fill="#5c6a77"/><circle cx="244" cy="220" r="4.4" fill="${ICE}"/>` +
          starburst(150, 224, 11) +
          '<rect x="62" y="328" width="176" height="9" rx="4" fill="#6c7a87" stroke="#4a5763" stroke-width="1.5"/>',
      },
      seatArt:
        // A flight seat on a post, standing in the water.
        '<rect x="143" y="360" width="16" height="74" fill="#1a2430"/>' +
        '<path d="M120 434H182L190 456H112Z" fill="#1a2430" stroke="#2b3a4a" stroke-width="1.6"/>' +
        '<path d="M104 350H198L193 363H109Z" fill="#2a3644" stroke="#3d4e60" stroke-width="2" stroke-linejoin="round"/>' +
        `<path d="M110 356H192" stroke="${ICE}" stroke-opacity=".28" stroke-width="2"/>` +
        '<path d="M118 363V386M184 363V386" stroke="#3d4e60" stroke-width="4"/>',
      tableArt:
        // The console bench: a lit edge, switches, vents, two struts down into the water.
        '<rect x="166" y="330" width="304" height="13" rx="2" fill="#1b2632" stroke="#2f3e50" stroke-width="1.6"/>' +
        `<path d="M170 331.5H466" stroke="${ICE}" stroke-opacity=".3" stroke-width="1.6"/>` +
        '<rect x="178" y="343" width="282" height="50" fill="#111a23" stroke="#2a3846" stroke-width="1.6"/>' +
        `<g fill="${ICE}" fill-opacity=".45">${[196, 210, 224, 238].map(x => `<rect x="${x}" y="356" width="7" height="4" rx="1"/>`).join('')}</g>` +
        '<circle cx="262" cy="358" r="2.4" fill="#ffb347" fill-opacity=".6"/>' +
        '<path d="M300 356H440M300 366H440M300 376H440" stroke="#0a1118" stroke-width="3"/>' +
        '<path d="M196 393V456M442 393V456" stroke="#1b2632" stroke-width="10"/><path d="M196 424H442" stroke="#16202a" stroke-width="5"/>' +
        // Knee-deep water over the feet of the seat and the bench, part of the rig so portals and the band show it
        // too: plain fills (no gradient), resting opacities in attributes, the left end fading out in steps.
        '<g class="wv-wet"><g fill="#0d2230"><rect x="-100" y="416" width="40" height="44" fill-opacity=".15"/>' +
        '<rect x="-60" y="416" width="40" height="44" fill-opacity=".3"/><rect x="-20" y="416" width="40" height="44" fill-opacity=".45"/>' +
        '<rect x="20" y="416" width="450" height="44" fill-opacity=".6"/></g>' +
        `<path d="M-20 416H470" stroke="${ICE}" stroke-opacity=".2" stroke-width="1.6"/>` +
        `<g fill="none" stroke="${ICE}" stroke-width="1.4"><ellipse class="wv-fr" cx="151" cy="417" rx="22" ry="4" stroke-opacity=".4"/>` +
        '<ellipse class="wv-fr" style="animation-delay:-1.4s" cx="196" cy="417" rx="14" ry="3" stroke-opacity=".4"/>' +
        '<ellipse class="wv-fr" style="animation-delay:-2.8s" cx="442" cy="417" rx="14" ry="3" stroke-opacity=".4"/>' +
        '<ellipse class="wv-rp" style="animation-delay:-.9s" cx="151" cy="417" rx="46" ry="7" stroke-opacity=".5" opacity="0"/></g></g>',
    },
    style:
      // The wave: it builds slowly far off, rears up and comes on when a command runs, breaks on an error, passes on
      // done. Its translucent face shows when it rises; spray blows off the crest.
      '.wv-build{transform-origin:220px 590px;animation:wv-build 18s ease-in-out infinite alternate}' +
      '@keyframes wv-build{to{transform:scale(1.03,1.12)}}' +
      '.st-run .wv-build{animation:wv-rise 3s cubic-bezier(.2,.65,.3,1) both}' +
      '@keyframes wv-rise{to{transform:translateY(24px) scale(1.3,2)}}' +
      '.st-error .wv-build{animation:wv-break 2.6s ease-in-out both}' +
      '@keyframes wv-break{0%{transform:translateY(20px) scale(1.26,1.82)}30%{transform:translateY(26px) scale(1.32,1.94)}100%{transform:translateY(32px) scale(1.42,1.15)}}' +
      '.st-done .wv-build{animation:wv-pass 3.6s ease-in-out both}' +
      '@keyframes wv-pass{35%{transform:translateY(8px) scale(1.08,1.35)}100%{transform:translate(110px,4px) scale(1.04,.78)}}' +
      '.wv-face{opacity:.3}.st-run .wv-face{animation:wv-on 2s ease-out .3s both}.st-error .wv-face{opacity:.85}' +
      '@keyframes wv-on{to{opacity:1}}' +
      '.wv-fth{opacity:0}.st-run .wv-fth{animation:wv-on 1.6s ease-out .5s both}.st-error .wv-fth{opacity:.8}' +
      '.wv-spr{--o:.44;opacity:0;transform-box:fill-box;transform-origin:center;animation:wv-spr 5s ease-out infinite}' +
      '.st-run .wv-spr,.st-error .wv-spr{--o:.75;animation-duration:2.4s}' +
      '@keyframes wv-spr{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:var(--o)}100%{opacity:0;transform:translate(-150px,-26px) scale(1.7)}}' +
      // The sky: stars come out when the lander is away.
      '.wv-stars{opacity:.55}.st-done .wv-stars{animation:wv-on 2.4s ease-out .4s both}' +
      '.wv-tw{animation:wv-tw 4.4s ease-in-out infinite alternate}.wv-tw2{animation-delay:-2.2s}@keyframes wv-tw{from{opacity:.45}to{opacity:1}}' +
      // Mist, the mirror's ripple lines and glints, the sand under the shallows.
      '.wv-mist{animation:wv-drift 30s ease-in-out infinite alternate}.wv-mist2{animation-duration:23s;animation-direction:alternate-reverse}' +
      '@keyframes wv-drift{from{transform:translateX(-36px)}to{transform:translateX(40px)}}' +
      '.st-responding .wv-mist{animation-duration:7s}' +
      '.wv-ln{animation:wv-shim 5s ease-in-out infinite alternate}.wv-ln2{animation-delay:-2.5s}@keyframes wv-shim{from{opacity:.55}to{opacity:1}}' +
      '.wv-gl{animation:wv-shim 2.2s ease-in-out infinite alternate}.wv-gl2{animation-delay:-1.1s}' +
      '.st-run .wv-lines{animation:wv-back 3s ease-out both}@keyframes wv-back{to{transform:translate(-40px,-14px)}}' +
      '.wv-floor{opacity:.45}.st-run .wv-floor{animation:wv-floor 2.6s ease-out both}.st-read .wv-floor{animation:wv-floor 1.4s ease-out both}' +
      '@keyframes wv-floor{to{opacity:.95}}' +
      // Ripples: always a little at the feet, everywhere while Claude thinks.
      '.wv-rp{opacity:0;transform-box:fill-box;transform-origin:center}.st-thinking .wv-rp{animation:wv-rp 3.2s ease-out infinite}' +
      '@keyframes wv-rp{0%{opacity:0;transform:scale(.25)}15%{opacity:.75}100%{opacity:0;transform:scale(1.8)}}' +
      '.wv-fr{transform-box:fill-box;transform-origin:center;animation:wv-fr 4.2s ease-out infinite}' +
      '@keyframes wv-fr{0%{opacity:0;transform:scale(.4)}20%{opacity:.6}100%{opacity:0;transform:scale(1.5)}}' +
      // Wind on the water while Claude writes.
      '.wv-paw{opacity:0}.st-responding .wv-paw{animation:wv-paw 3.6s linear infinite}' +
      '@keyframes wv-paw{0%{opacity:0;transform:translateX(-200px)}25%,70%{opacity:1}100%{opacity:0;transform:translateX(720px)}}' +
      // The old beacon half sunk in the shallows: it blinks once every 2.4 s, faster and pinging while Claude reads.
      '.wv-wl{animation:wv-blink 2.4s ease-in-out infinite}.st-read .wv-wl{animation-duration:.9s}' +
      '@keyframes wv-blink{0%,64%,100%{opacity:.2}80%{opacity:1}}' +
      '.wv-scan{opacity:0;transform-box:fill-box;transform-origin:center}.st-read .wv-scan{animation:wv-sig 1.8s ease-out infinite}' +
      '@keyframes wv-sig{0%{opacity:0;transform:scale(.3)}20%{opacity:.8}100%{opacity:0;transform:scale(2.6)}}' +
      // The surge that runs in over the shallows on an error.
      '.wv-wash{opacity:0}.st-error .wv-wash{animation:wv-wash 2.8s ease-out both}' +
      '@keyframes wv-wash{0%{opacity:0;transform:translateX(-620px)}12%{opacity:1}42%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translate(90px,50px)}}' +
      // The lander: beacon, window, floodlight (tool), dish (web), thrusters (run), tilt and spray (error), liftoff (done).
      '.wv-bcn{animation:wv-blink 2s ease-in-out infinite}' +
      '.wv-win{animation:wv-glow 5s ease-in-out infinite alternate}@keyframes wv-glow{from{opacity:.55}to{opacity:1}}' +
      '.st-sleeping .wv-win{animation:none;opacity:.25}' +
      '.wv-warn{opacity:0}.st-error .wv-warn{animation:wv-blink 1.2s ease-in-out infinite}' +
      '.wv-beam{opacity:0}.st-tool .wv-beam{opacity:1;animation:wv-sweep 1.8s ease-in-out infinite alternate}' +
      '@keyframes wv-sweep{from{transform:rotate(-14deg)}to{transform:rotate(12deg)}}' +
      '.st-web .wv-dish{animation:wv-aim .9s ease-out both}@keyframes wv-aim{to{transform:rotate(-40deg)}}' +
      '.wv-arc{opacity:0}.st-web .wv-arc{animation:wv-arc 1.5s ease-out infinite}' +
      '@keyframes wv-arc{0%{opacity:0;transform:scale(.6)}20%{opacity:.85}100%{opacity:0;transform:scale(3.6)}}' +
      '.wv-thr{opacity:0}.st-run .wv-thr{animation:wv-on .7s ease-out .3s both}' +
      '.st-run .wv-thf{animation:wv-flick .45s ease-in-out infinite alternate}@keyframes wv-flick{from{opacity:.7}to{opacity:1}}' +
      '.wv-stm{opacity:0;transform-box:fill-box;transform-origin:50% 100%}' +
      '.st-run .wv-stm{animation:wv-stm 2.6s ease-out .4s both}@keyframes wv-stm{from{opacity:0;transform:scale(.4,.3)}to{opacity:.75;transform:scale(1.25,1.5)}}' +
      '.st-done .wv-stm{animation:wv-stm2 3.4s ease-out .1s both}@keyframes wv-stm2{0%{opacity:0;transform:scale(.4,.3)}30%{opacity:.9}100%{opacity:.35;transform:scale(1.9,2.6)}}' +
      '.st-run .wv-rum{animation:wv-rum .16s linear .6s infinite alternate}@keyframes wv-rum{from{transform:translate(-1px,0)}to{transform:translate(1px,1px)}}' +
      '.wv-tilt{transform-origin:123px -3px}.st-error .wv-tilt{animation:wv-tilt 1.5s cubic-bezier(.3,.6,.4,1) both}' +
      '@keyframes wv-tilt{0%{transform:rotate(0)}35%{transform:rotate(10deg)}60%{transform:rotate(6deg)}80%{transform:rotate(8.6deg)}100%{transform:rotate(8deg)}}' +
      '.wv-spl{opacity:0;transform-box:fill-box;transform-origin:50% 100%}.st-error .wv-spl{animation:wv-spl 2.2s ease-out infinite}' +
      '@keyframes wv-spl{0%{opacity:0;transform:scale(.3,.1)}12%{opacity:.9}45%{opacity:.65;transform:scale(1,1)}100%{opacity:0;transform:scale(1.15,1.25)}}' +
      '.wv-dp{opacity:0}.st-error .wv-dp{animation:wv-dp 1.4s ease-in infinite}' +
      '@keyframes wv-dp{0%{opacity:0;transform:translate(0,0)}12%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}' +
      '.wv-drop{opacity:0}.st-error .wv-drop{animation:wv-drop 1.1s ease-in infinite}' +
      '@keyframes wv-drop{0%{opacity:0;transform:translate(0,0)}15%{opacity:.85}100%{opacity:0;transform:translate(var(--dx),300px)}}' +
      '.wv-rfl{opacity:.4}.st-done .wv-rfl{animation:wv-off .6s ease-out .5s both}.st-error .wv-rfl{animation:wv-off .5s ease-out both}@keyframes wv-off{to{opacity:0}}' +
      '.st-done .wv-ld{animation:wv-lift 3.2s cubic-bezier(.55,0,.8,.45) .5s both}@keyframes wv-lift{to{transform:translateY(-720px)}}' +
      '.wv-trail{opacity:0;transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(0)}' +
      '.st-done .wv-trail{opacity:1;animation:wv-trail 3.2s cubic-bezier(.55,0,.8,.45) .5s both}@keyframes wv-trail{to{transform:scaleY(1)}}' +
      '.wv-plm{opacity:0}.st-done .wv-plm{animation:wv-on .5s ease-out .05s both}' +
      '.wv-plf{transform-origin:0 -50px}.st-done .wv-plf{animation:wv-plf .28s ease-in-out infinite alternate}@keyframes wv-plf{from{transform:scaleY(.82)}to{transform:scaleY(1.12)}}' +
      '.wv-legs{transform-origin:0 -78px}.st-done .wv-legs{animation:wv-fold .7s ease-in-out 1.1s both}@keyframes wv-fold{to{transform:scale(.78,.3)}}' +
      // The shallows at the desk: they ebb as the wave draws the water, and surge on an error.
      '.st-run .wv-wet{animation:wv-ebb 2.6s ease-out both}@keyframes wv-ebb{to{transform:translateY(9px)}}' +
      '.st-error .wv-wet{animation:wv-surge 1.4s ease-out both}@keyframes wv-surge{40%{transform:translateY(-14px)}to{transform:translateY(-6px)}}' +
      // The chronometer ticks once a second, four times a second while a command runs.
      '.wv-tick{animation:mv-spin 12s steps(12) infinite}.st-run .wv-tick{animation-duration:3s}.st-thinking .wv-tick{animation-duration:24s}',
    scenery:
      '<defs>' +
      '<linearGradient id="wv-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03060a"/><stop offset=".35" stop-color="#060c13"/><stop offset=".55" stop-color="#0d1a26"/><stop offset=".6" stop-color="#15283a"/><stop offset="1" stop-color="#0a141d"/></linearGradient>' +
      '<radialGradient id="wv-dusk"><stop offset="0" stop-color="#d8efff" stop-opacity=".4"/><stop offset=".3" stop-color="#8dbcd6" stop-opacity=".2"/><stop offset=".65" stop-color="#3f6f8c" stop-opacity=".06"/><stop offset="1" stop-color="#3f6f8c" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="wv-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity="0"/><stop offset="1" stop-color="${ICE}" stop-opacity=".07"/></linearGradient>` +
      '<linearGradient id="wv-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15293a"/><stop offset=".06" stop-color="#102030"/><stop offset=".3" stop-color="#0a1520"/><stop offset="1" stop-color="#060b11"/></linearGradient>' +
      `<radialGradient id="wv-dr" cx=".5" cy="0" r=".5"><stop offset="0" stop-color="${ICE}" stop-opacity=".16"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="wv-wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3647"/><stop offset=".18" stop-color="#10222f"/><stop offset=".55" stop-color="#0b1823"/><stop offset="1" stop-color="#09141d"/></linearGradient>' +
      '<linearGradient id="wv-fc" gradientUnits="userSpaceOnUse" x1="-100" y1="0" x2="1700" y2="0"><stop offset="0" stop-color="#8fd0ea" stop-opacity=".3"/><stop offset=".26" stop-color="#8fd0ea" stop-opacity=".26"/><stop offset=".4" stop-color="#8fd0ea" stop-opacity=".1"/><stop offset="1" stop-color="#8fd0ea" stop-opacity=".04"/></linearGradient>' +
      `<linearGradient id="wv-fm" gradientUnits="userSpaceOnUse" x1="-100" y1="0" x2="1700" y2="0"><stop offset="0" stop-color="${FOAM}" stop-opacity=".85"/><stop offset=".26" stop-color="${FOAM}" stop-opacity=".7"/><stop offset=".36" stop-color="#cfe9ff" stop-opacity=".25"/><stop offset=".7" stop-color="${ICE}" stop-opacity=".14"/><stop offset="1" stop-color="${ICE}" stop-opacity=".1"/></linearGradient>` +
      `<radialGradient id="wv-sp"><stop offset="0" stop-color="${FOAM}" stop-opacity=".6"/><stop offset="1" stop-color="${FOAM}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="wv-ms"><stop offset="0" stop-color="${ICE}" stop-opacity=".1"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="wv-hl"><stop offset="0" stop-color="${ICE}" stop-opacity=".55"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      '<linearGradient id="wv-wa" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#123040" stop-opacity=".9"/><stop offset=".7" stop-color="#123040" stop-opacity=".7"/><stop offset="1" stop-color="#123040" stop-opacity="0"/></linearGradient>' +
      `<clipPath id="wv-pc"><circle cx="${PX}" cy="${PY}" r="${PR}"/></clipPath>` +
      '<radialGradient id="wv-pt" gradientUnits="userSpaceOnUse" cx="1330" cy="330" r="330"><stop offset="0" stop-color="#03070b" stop-opacity="0"/><stop offset=".4" stop-color="#03070b" stop-opacity=".15"/><stop offset=".7" stop-color="#03070b" stop-opacity=".7"/><stop offset="1" stop-color="#03070b" stop-opacity=".93"/></radialGradient>' +
      `<radialGradient id="wv-ph" gradientUnits="userSpaceOnUse" cx="${PX}" cy="${PY}" r="${PR + 30}"><stop offset=".86" stop-color="${ICE}" stop-opacity="0"/><stop offset=".88" stop-color="${ICE}" stop-opacity=".16"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="wv-rg" gradientUnits="userSpaceOnUse" x1="${PX - 362}" y1="0" x2="${PX + 362}" y2="0"><stop offset="0" stop-color="${ICE}" stop-opacity="0"/><stop offset=".18" stop-color="${ICE}" stop-opacity=".25"/><stop offset=".38" stop-color="#d7ecfa" stop-opacity=".55"/><stop offset=".62" stop-color="${ICE}" stop-opacity=".35"/><stop offset="1" stop-color="${ICE}" stop-opacity=".12"/></linearGradient>` +
      '</defs>' +
      '<rect width="1600" height="1000" fill="url(#wv-sky)"/>' +
      `<g class="mv-t"><g class="wv-stars"><path class="wv-tw" d="${dots(starA, 2.6)}" fill="#dfeeff"/><path class="wv-tw wv-tw2" d="${dots(starB, 2)}" fill="#cfe2ff"/></g></g>` +
      '<g class="mv-b">' +
      // The set sun's glow behind the wave, and the haze along the horizon.
      '<ellipse cx="140" cy="420" rx="560" ry="330" fill="url(#wv-dusk)"/>' +
      `<path d="M-40 236Q140 214 330 228T560 222M-20 292Q160 276 300 288T470 284M10 172Q150 160 260 170" fill="none" stroke="${ICE}" stroke-opacity=".07" stroke-width="5" stroke-linecap="round"/>` +
      '<rect y="470" width="1600" height="120" fill="url(#wv-hz)"/>' +
      // The ringed gas giant rising behind the lander: the far half of the ring, the banded disc, the near half.
      '<g class="mv-r">' +
      rings(true) +
      `<circle cx="${PX}" cy="${PY}" r="${PR}" fill="#1d3240"/>` +
      `<g clip-path="url(#wv-pc)"><g transform="rotate(-16 ${PX} ${PY})">${bands}` +
      `<ellipse cx="${PX - 70}" cy="${PY + 64}" rx="28" ry="12" fill="#4d7180" fill-opacity=".7"/>` +
      `<ellipse cx="${PX}" cy="${PY + 16}" rx="330" ry="50" fill="none" stroke="#03070b" stroke-opacity=".45" stroke-width="16"/></g>` +
      `<rect x="${PX - PR}" y="${PY - PR}" width="${PR * 2}" height="${PR * 2}" fill="url(#wv-pt)"/></g>` +
      `<circle cx="${PX}" cy="${PY}" r="${PR + 30}" fill="url(#wv-ph)"/>` +
      `<path d="M${f(PX + PR * Math.cos(2.2))} ${f(PY - PR * Math.sin(2.2))}A${PR} ${PR} 0 0 0 ${f(PX + PR * Math.cos(3.6))} ${f(PY - PR * Math.sin(3.6))}" fill="none" stroke="${ICE}" stroke-opacity=".42" stroke-width="3" stroke-linecap="round"/>` +
      rings(false) +
      '</g>' +
      // The mirror sea, and the glow it gives back.
      `<rect y="${HZ}" width="1600" height="700" fill="url(#wv-sea)"/>` +
      `<path d="M-60 ${HZ}A210 330 0 0 0 360 ${HZ}Z" fill="url(#wv-dr)"/>` +
      `<g class="mv-r"><ellipse cx="${PX}" cy="${HZ + 50}" rx="190" ry="60" fill="#2a4556" fill-opacity=".14"/>` +
      `<path class="wv-gl" d="${planetGlints}" stroke="${ICE}" stroke-opacity=".14" stroke-width="2" stroke-linecap="round"/></g>` +
      // The wave, with its reflection in the shallows.
      '<g class="wv-build">' +
      `<g transform="translate(0 ${HZ * 2}) scale(1 -1)" opacity=".35"><path d="${BODY}" fill="#0a1822"/><path d="${CREST}" fill="none" stroke="${ICE}" stroke-opacity=".12" stroke-width="2"/></g>` +
      `<path d="${BODY}" fill="url(#wv-wb)"/>` +
      `<path class="wv-face" d="${FACE}" fill="url(#wv-fc)"/>` +
      `<path d="${CREST}" fill="none" stroke="url(#wv-fm)" stroke-width="12" stroke-opacity=".14"/>` +
      `<path d="${LIP}" fill="url(#wv-fm)" fill-opacity=".45"/>` +
      `<path d="${CREST}" fill="none" stroke="url(#wv-fm)" stroke-width="2.6"/>` +
      `<path class="wv-fth" d="${FEATHERS}" fill="none" stroke="${FOAM}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>` +
      spray +
      '</g>' +
      // Ripple lines and glints.
      `<g class="wv-lines" stroke="${ICE}" stroke-linecap="round" stroke-width="1.6"><path class="wv-ln" d="${lineSide.join('')}" stroke-opacity=".2"/>` +
      `<path class="wv-ln wv-ln2" d="${lineMid.join('')}" stroke-opacity=".08"/></g>` +
      `<g stroke="${FOAM}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"><path class="wv-gl" d="${glints.slice(0, 7).join('')}"/><path class="wv-gl wv-gl2" d="${glints.slice(7).join('')}"/></g>` +
      // The sand under the knee-deep water.
      `<g class="wv-floor"><path d="${floor}" fill="none" stroke="#2a3f47" stroke-width="2.6"/><g fill="#1b2a31">${pebbles}</g></g>` +
      // Mist over the water.
      '<g class="wv-mist"><ellipse cx="260" cy="588" rx="380" ry="34" fill="url(#wv-ms)"/><ellipse cx="1380" cy="604" rx="320" ry="30" fill="url(#wv-ms)"/></g>' +
      '<g class="wv-mist wv-mist2"><ellipse cx="820" cy="596" rx="420" ry="26" fill="url(#wv-ms)" opacity=".6"/><ellipse cx="420" cy="900" rx="520" ry="60" fill="url(#wv-ms)" opacity=".5"/></g>' +
      // An old beacon half sunk in the shallows, from someone who came before.
      '<path d="M108 806Q112 772 150 768L196 770Q222 776 228 806Z" fill="#111a22" stroke="#2c3b4a" stroke-width="2"/>' +
      '<g transform="rotate(14 170 790)"><rect x="166" y="640" width="8" height="150" fill="#131c25" stroke="#2c3b4a" stroke-width="1.5"/>' +
      '<path d="M150 676H192" stroke="#2c3b4a" stroke-width="4"/>' +
      '<path d="M192 672L236 660L240 690L196 700Z" fill="#16222d" stroke="#34465a" stroke-width="1.5"/><path d="M214 666L218 695M194 686L238 675" stroke="#2c3b4a" stroke-width="1.2"/>' +
      `<circle class="wv-wl" cx="170" cy="636" r="18" fill="url(#wv-hl)"/><circle class="wv-wl" cx="170" cy="636" r="4.5" fill="${ICE}"/>` +
      `<g transform="translate(170 636)" fill="none" stroke="${ICE}" stroke-width="1.6">${[0, 0.6, 1.2].map(d => `<circle class="wv-scan" style="animation-delay:${d}s" r="20"/>`).join('')}</g></g>` +
      `<path class="wv-gl" d="M188 818h14M184 832h22M190 848h12" stroke="${ICE}" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse class="wv-fr" cx="168" cy="806" rx="70" ry="10" fill="none" stroke="${ICE}" stroke-opacity=".3" stroke-width="1.4"/>` +
      // Ripples spreading over the water while Claude thinks.
      ripple(168, 806, 80, 12, 0.65, 0) +
      ripple(400, 700, 90, 12, 0.55, -0.8) +
      ripple(90, 920, 110, 16, 0.6, -1.6) +
      ripple(300, 640, 70, 8, 0.55, -2.4) +
      ripple(720, 760, 80, 11, 0.22, -1.2) +
      ripple(980, 640, 60, 7, 0.18, -2) +
      // Cat's-paws of wind.
      `<g stroke="${FOAM}" stroke-opacity=".32" stroke-width="2" stroke-linecap="round">${paw(60, 660, 0)}${paw(-40, 760, -1.2)}${paw(120, 880, -2.4)}</g>` +
      // The surge.
      `<g class="wv-wash"><path d="M-60 1100V830Q60 790 200 812Q330 832 470 800Q560 780 640 818Q720 860 640 1100Z" fill="url(#wv-wa)"/>` +
      `<path d="M-40 872Q90 846 220 862Q360 880 500 852M-50 930Q100 904 260 924Q420 942 560 914" fill="none" stroke="${FOAM}" stroke-opacity=".16" stroke-width="3"/>` +
      `<path d="${washEdge}" fill="none" stroke="${FOAM}" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="${washEdge}" fill="none" stroke="${FOAM}" stroke-opacity=".12" stroke-width="16" stroke-linecap="round" transform="translate(0 8)"/>` +
      `<g fill="${FOAM}" fill-opacity=".45">${washDrops}</g></g>` +
      '</g>',
    nook:
      '<defs>' +
      `<radialGradient id="wv-thg"><stop offset="0" stop-color="#f2fbff" stop-opacity=".9"/><stop offset=".4" stop-color="${ICE}" stop-opacity=".45"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="wv-plg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" stop-color="#d8f0ff" stop-opacity=".7"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="wv-bm" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity=".32"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></linearGradient>` +
      '<radialGradient id="wv-stg"><stop offset="0" stop-color="#d6ecf8" stop-opacity=".4"/><stop offset=".6" stop-color="#a9cde0" stop-opacity=".16"/><stop offset="1" stop-color="#a9cde0" stop-opacity="0"/></radialGradient>' +
      `<linearGradient id="wv-trg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity=".35"/><stop offset=".5" stop-color="#d6ecf8" stop-opacity=".18"/><stop offset="1" stop-color="#d6ecf8" stop-opacity=".05"/></linearGradient>` +
      `<radialGradient id="wv-lm"><stop offset="0" stop-color="${ICE}" stop-opacity=".5"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="wv-spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity="0"/><stop offset=".5" stop-color="#d6ecf8" stop-opacity=".4"/><stop offset="1" stop-color="${FOAM}" stop-opacity=".7"/></linearGradient>` +
      `<radialGradient id="wv-mn"><stop offset="0" stop-color="${ICE}" stop-opacity=".12"/><stop offset="1" stop-color="${ICE}" stop-opacity="0"/></radialGradient>` +
      '</defs>' +
      // The lander's reflection in the shallows, and the mist at its feet.
      '<g class="wv-rfl"><g transform="translate(272 112) scale(1.1 -.8)"><path d="M-80 -82L-110 -6M80 -82L110 -6" stroke="#141f29" stroke-width="7"/>' +
      '<path d="M-96 -72H96L84 -126H-84ZM-74 -126V-184Q-74 -216 -42 -216H42Q74 -216 74 -184V-126Z" fill="#141f29"/>' +
      `<rect x="-49" y="-195" width="98" height="16" rx="7" fill="${ICE}" fill-opacity=".3"/></g></g>` +
      '<ellipse class="wv-mist" cx="272" cy="104" rx="240" ry="24" fill="url(#wv-mn)"/>' +
      // The trail it leaves when it lifts off.
      '<rect class="wv-trail" x="261" y="-660" width="22" height="712" fill="url(#wv-trg)"/>' +
      `<g class="wv-ld"><g transform="translate(272 104)"><g class="wv-tilt"><g class="wv-rum"><g transform="scale(1.1)">${lander()}</g></g></g></g></g>` +
      // Ripples at its feet, steam from the water under the bells.
      '<g transform="translate(272 104) scale(1.1)">' +
      `<g fill="none" stroke="${ICE}" stroke-width="1.4"><ellipse class="wv-fr" cx="-112" cy="-2" rx="30" ry="5" stroke-opacity=".35"/><ellipse class="wv-fr" style="animation-delay:-2s" cx="112" cy="-2" rx="30" ry="5" stroke-opacity=".35"/></g>` +
      ripple(-112, -2, 50, 8, 0.5, -0.5) +
      ripple(112, -2, 50, 8, 0.5, -1.7) +
      '<ellipse class="wv-stm" cx="-90" cy="-14" rx="100" ry="34" fill="url(#wv-stg)"/><ellipse class="wv-stm" cx="0" cy="-10" rx="120" ry="40" fill="url(#wv-stg)"/>' +
      '<ellipse class="wv-stm" cx="100" cy="-14" rx="100" ry="34" fill="url(#wv-stg)"/></g>' +
      // The spray that bursts over its lifted foot on an error.
      `<g transform="translate(149 102)">${splash}${flecks}</g>`,
    // Droplets raining over the desk corner on an error.
    front: drops,
  }
}
