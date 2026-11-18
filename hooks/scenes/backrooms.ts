import type { Activity } from '../../types'
import { f, random } from './kit'
import type { World } from './world'

// Backrooms: endless yellowed office rooms after hours, the same damp carpet and monotone wallpaper in every
// direction, rows of buzzing fluorescent panels, doorways into more of the same. Claude keeps working at the one lone
// office desk, a badge on a lanyard. When a command runs the rooms shift: walls slide and a new corridor opens; an
// error puts the lights out row by row toward Claude; done opens an exit door at the end of the corridor on daylight.

// One-point perspective for the main room: x/z and y/z about the vanishing point, the ceiling 520 above the eye and
// the floor 600 below it at depth 1.
const VX = 800
const VY = 430
const CEIL = 520
const FLOOR = 600
const sx = (x: number, z: number): number => VX + x / z
const cy = (z: number): number => VY - CEIL / z
const fy = (z: number): number => VY + FLOOR / z
const s4 = (n: number): string => String(Math.round(n * 10000) / 10000)
const poly = (list: readonly (readonly [number, number])[]): string => `M${list.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`

const TUBE = '#fff2c4'
const FACE = ['#201a0b', '#19140a', '#110e07', '#0c0a05'] as const

/** A doorway in a wall: from x0 to x1, its top at y (all in the wall's own depth-1 units). */
type Door = readonly [number, number, number]

/**
 * A flat wall facing us at depth z, ceiling to floor, with doorways cut to the floor: wallpaper over a lit gradient, a
 * baseboard, and the thickness of the wall where its edges and door jambs turn away from the eye.
 */
function slab(z: number, x0: number, x1: number, doors: readonly Door[], tone: number, thick = 0.08): string {
  let d = `M${x0} ${-CEIL}H${x1}V${FLOOR}`

  for (const [a, b, t] of [...doors].sort((p, q) => q[0] - p[0])) {
    d += `H${b}V${t}H${a}V${FLOOR}`
  }

  d += `H${x0}Z`

  const k = z / (z + thick)
  const face = (x: number, top: number): string => `M${x} ${top}L${f(x * k)} ${f(top * k)}V${f(FLOOR * k)}L${x} ${FLOOR}Z`
  let faces = (x1 <= 0 ? face(x1, -CEIL) : '') + (x0 >= 0 ? face(x0, -CEIL) : '')
  let base = ''
  let from = x0

  for (const [a, b, t] of [...doors].sort((p, q) => p[0] - q[0])) {
    faces += (a < 0 ? face(a, t) : '') + (b > 0 ? face(b, t) : '') + (t < 0 ? `M${a} ${t}H${b}L${f(b * k)} ${f(t * k)}H${f(a * k)}Z` : '')
    base += `M${from} 560H${a}V${FLOOR}H${from}Z`
    from = b
  }

  base += `M${from} 560H${x1}V${FLOOR}H${from}Z`

  return (
    `<g transform="translate(${VX} ${VY}) scale(${s4(1 / z)})">` +
    `<path d="${d}" fill="url(#bk-w${tone})"/><path d="${d}" fill="url(#bk-wp)"/>` +
    `<path d="${base}" fill="#0a0805" fill-opacity=".6"/>` +
    (faces === '' ? '' : `<path d="${faces}" fill="${FACE[tone]}"/>`) +
    '</g>'
  )
}

const LIT = [-1350, -750, 750, 1350]
const DEAD = [-150, 150]

/**
 * One row of ceiling panels across the room in tile row k: the tubes, their glow on the ceiling and their pool of
 * light on the carpet. Rows put themselves out in turn on an error, the farthest first.
 */
function row(k: number, out: number, flicker: number, stutter = false): string {
  const z0 = 0.96 + 0.375 * k
  const z1 = z0 + 0.255
  const zc = (z0 + z1) / 2
  const level = Math.min(1, Math.pow(1.4 / zc, 1.25))
  const quad = (x: number) => poly([[sx(x - 120, z0), cy(z0)], [sx(x + 120, z0), cy(z0)], [sx(x + 120, z1), cy(z1)], [sx(x - 120, z1), cy(z1)]])
  let glow = ''
  let tubes = ''
  let dead = ''

  for (const x of DEAD) {
    dead += quad(x)
  }

  for (const x of LIT) {
    const at = sx(x, zc)

    if (at < -260 || at > 1860) {
      continue
    }

    const o = f(level * (at > 400 && at < 1200 ? 0.45 : 1))
    const fk = x === flicker ? ' class="bk-fk"' : ''

    glow +=
      `<ellipse${fk} cx="${f(at)}" cy="${f(fy(zc))}" rx="${f(380 / zc)}" ry="${f(70 / zc)}" fill="url(#bk-pool)" fill-opacity="${o}"/>` +
      `<ellipse${fk} cx="${f(at)}" cy="${f(cy(zc))}" rx="${f(340 / zc)}" ry="${f(96 / zc)}" fill="url(#bk-halo)" fill-opacity="${o}"/>`
    tubes += `<path${fk} d="${quad(x)}" fill="${TUBE}" fill-opacity="${o}"/>`

    if (k <= 2) {
      tubes +=
        `<path d="M${f(sx(x - 40, z0))} ${f(cy(z0))}L${f(sx(x - 40, z1))} ${f(cy(z1))}M${f(sx(x + 40, z0))} ${f(cy(z0))}L${f(sx(x + 40, z1))} ${f(cy(z1))}" ` +
        'stroke="#a8945a" stroke-opacity=".55" stroke-width="2"/>'
    }
  }

  return (
    `<g class="bk-row${stutter ? ' bk-st' : ''}" style="--d:${out}s"><g class="bk-h">${glow}</g>${tubes}</g>` +
    `<path d="${dead}" fill="#2a2412" stroke="#15110a" stroke-width="1.5"/>`
  )
}

// The side corridor behind the near wall, drawn in the picture with its own vanishing point, so it turns away to the
// left: its near frame meets the wall, its far end holds the exit door.
const CX = 230
const NL = -80
const NR = 420
const NT = cy(1.3)
const NB = fy(1.3)
const CD = 3.4
const cp = (x: number, y: number, d: number): readonly [number, number] => [CX + (x - CX) / d, VY + (y - VY) / d]

function corridor(): string {
  const [fl, ft] = cp(NL, NT, CD)
  const [fr, fb] = cp(NR, NB, CD)
  const near = { tl: cp(NL, NT, 1), tr: cp(NR, NT, 1), bl: cp(NL, NB, 1), br: cp(NR, NB, 1) }
  const far = { tl: [fl, ft] as const, tr: [fr, ft] as const, bl: [fl, fb] as const, br: [fr, fb] as const }
  const seams = [1.1, 1.22, 1.36, 1.52, 1.7, 1.92, 2.18, 2.5, 2.9]
    .map(d => {
      const [lx, ly0] = cp(NL, NT, d)
      const [, ly1] = cp(NL, NB, d)
      const [rx] = cp(NR, NT, d)

      return `M${f(lx)} ${f(ly0)}V${f(ly1)}M${f(rx)} ${f(ly0)}V${f(ly1)}`
    })
    .join('')
  // The exit door on the far wall and its sign.
  const [dx0, dy0] = cp(60, VY - 175 / 1.3, CD)
  const [dx1] = cp(250, NB, CD)
  const dw = dx1 - dx0
  const dh = fb - dy0
  const rows = [1.08, 1.32, 1.62, 1.98, 2.42, 2.95]
    .map((d, i) => {
      const e = d + 0.1
      const o = i === 2 ? 0.08 : f(0.52 - i * 0.03)
      const [hx, hy] = cp(170, NT, d + 0.05)
      const [px, py] = cp(170, NB, d + 0.05)

      return (
        `<g class="bk-cr${i % 3 === 0 ? ' bk-st' : ''}" style="--i:${i};--o:${o}"><g${i === 1 ? ' class="bk-fk" style="animation-delay:-2.6s"' : ''}>` +
        `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(170 / d)}" ry="${f(34 / d)}" fill="url(#bk-pool)"/>` +
        `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(160 / d)}" ry="${f(46 / d)}" fill="url(#bk-halo)"/>` +
        `<path d="${poly([cp(100, NT, d), cp(240, NT, d), cp(240, NT, e), cp(100, NT, e)])}" fill="${TUBE}"/></g></g>`
      )
    })
    .join('')

  return (
    `<path d="${poly([near.tl, near.tr, far.tr, far.tl])}" fill="#2b2512"/>` +
    `<path d="${poly([near.bl, near.br, far.br, far.bl])}" fill="#251f0e"/>` +
    `<path d="${poly([near.tl, far.tl, far.bl, near.bl])}" fill="#3d3316"/>` +
    `<path d="${poly([near.tr, far.tr, far.br, near.br])}" fill="#352c13"/>` +
    `<path d="${seams}" stroke="#0a0805" stroke-opacity=".3" stroke-width="2"/>` +
    `<path d="${poly([cp(NL, NB - 34, 1), cp(NL, NB - 34, CD), far.bl, near.bl])}${poly([cp(NR, NB - 34, 1), cp(NR, NB - 34, CD), far.br, near.br])}" fill="#0a0805" fill-opacity=".6"/>` +
    `<ellipse cx="${f(cp(130, NB, 1.5)[0])}" cy="${f(cp(130, NB, 1.5)[1])}" rx="80" ry="12" fill="url(#bk-stain)"/>` +
    `<rect x="${f(fl)}" y="${f(ft)}" width="${f(fr - fl)}" height="${f(fb - ft)}" fill="#2f2812"/>` +
    `<g class="bk-fog"><rect x="${NL}" y="${f(NT)}" width="${NR - NL}" height="${f(NB - NT)}" fill="url(#bk-fog)"/></g>` +
    // The door: its frame, the daylight behind it, the leaf that swings open, and the green sign above.
    `<rect x="${f(dx0 - 4)}" y="${f(dy0 - 4)}" width="${f(dw + 8)}" height="${f(dh + 4)}" fill="#120e07"/>` +
    `<g class="bk-day"><rect x="${f(dx0)}" y="${f(dy0)}" width="${f(dw)}" height="${f(dh)}" fill="#eef6ff"/></g>` +
    `<g class="bk-door"><rect x="${f(dx0)}" y="${f(dy0)}" width="${f(dw)}" height="${f(dh)}" fill="#2a2312" stroke="#3e3419" stroke-width="1.5"/>` +
    `<rect x="${f(dx0 + dw * 0.18)}" y="${f(dy0 + dh * 0.1)}" width="${f(dw * 0.64)}" height="${f(dh * 0.34)}" fill="none" stroke="#3e3419" stroke-width="1.5"/>` +
    `<rect x="${f(dx0 + dw - 9)}" y="${f(dy0 + dh * 0.52)}" width="5" height="3" fill="#8a7c4c"/></g>` +
    `<g class="bk-sign"><circle cx="${f(dx0 + dw / 2)}" cy="${f(dy0 - 14)}" r="34" fill="url(#bk-green)"/>` +
    `<rect x="${f(dx0 + dw / 2 - 17)}" y="${f(dy0 - 20)}" width="34" height="12" rx="1.5" fill="#1f9a56"/>` +
    `<path d="M${f(dx0 + dw / 2 - 12)} ${f(dy0 - 14)}h7m4 -3v6m4 -6l4 3l-4 3" fill="none" stroke="#c8ffd8" stroke-width="1.6"/></g>` +
    rows +
    `<g class="bk-clit"><rect x="${NL}" y="${f(NT)}" width="${NR - NL}" height="${f(NB - NT)}" fill="url(#bk-wash)"/></g>` +
    `<g class="bk-day"><circle cx="${f(dx0 + dw / 2)}" cy="${f(dy0 + dh / 2)}" r="210" fill="url(#bk-sun)"/>` +
    `<path d="${poly([[dx0, fb], [dx1, fb], cp(330, NB, 1.02), cp(70, NB, 1.02)])}" fill="url(#bk-shaft)"/>` +
    `<path d="${poly([[dx0, dy0], [dx0, fb], cp(NL, NB, 1.6), cp(NL, NT, 1.6)])}" fill="#dfeeff" fill-opacity=".07"/></g>`
  )
}

/** The beige monitor on the desk, the keyboard, a desk phone and a folder, with the troffer hanging over it all. */
function device(light: string, activity: Activity): string {
  const keys = Array.from({ length: 6 }, (_, i) => `<rect x="${246 + i * 10}" y="324" width="6" height="2.5" fill="${light}" fill-opacity=".45"/>`).join('')
  const ring = activity === 'web' ? ' bk-ring' : ''

  return (
    // The troffer over the desk on its two chains, hung from ceiling brackets.
    '<path d="M196 150V168M396 150V168" stroke="#2c2615" stroke-width="2.4" stroke-dasharray="4 2"/>' +
    '<path d="M188 151.5H204M388 151.5H404" stroke="#3a3220" stroke-width="3"/>' +
    '<g class="bk-fx"><g class="bk-fk" style="animation-delay:-3.9s">' +
    '<path d="M176 182H416L456 328H124Z" fill="#f2e09a" fill-opacity=".05"/>' +
    `<rect x="174" y="178" width="244" height="5" fill="${TUBE}" fill-opacity=".9"/></g>` +
    '<rect x="168" y="168" width="256" height="11" rx="2" fill="#4a4128"/><path d="M212 168V179M300 168V179M380 168V179" stroke="#2c2615" stroke-width="2"/></g>' +
    // The monitor, turned toward Claude: its screen face, its tapering side and its base.
    '<path d="M330 234L392 245V300L330 322Z" fill="#62593d"/><path d="M340 262L384 266M340 276L384 278M340 290L384 290" stroke="#4a4330" stroke-width="2.4"/>' +
    '<path d="M282 240L330 232V324L282 316Z" fill="#8a7f58"/><path d="M330 232V324" stroke="#9c9068" stroke-width="2"/>' +
    `<path d="M288 249L324 242V310L288 307Z" fill="${light}" fill-opacity=".9"/>` +
    '<path d="M291 254L320 248" stroke="#ffffff" stroke-opacity=".28" stroke-width="2"/><rect x="316" y="314" width="5" height="3" fill="#5a9a4a"/>' +
    '<path d="M300 330H364L358 321H306Z" fill="#5a523a"/>' +
    // The keyboard and a folder of printouts.
    `<path d="M236 330H310L306 321H240Z" fill="#8a7f58"/>${keys}` +
    '<path d="M170 330L175 322H224L229 330Z" fill="#b29e5a" fill-opacity=".9"/><path d="M178 322H220" stroke="#e6dcb8" stroke-opacity=".7" stroke-width="2"/>' +
    // The desk phone, in front of the monitor's side: its body, keypad, handset, cord and line light.
    '<path d="M364 330H416L411 314H369Z" fill="#7a7050"/>' +
    '<path d="M374 320h4M381 320h4M388 320h4M374 325h4M381 325h4M388 325h4" stroke="#4a4330" stroke-width="2"/>' +
    '<path d="M362 312Q362 303 371 303H409Q418 303 418 312L413 316H367Z" fill="#8f845c"/>' +
    '<path d="M416 326C430 334 424 344 440 342" fill="none" stroke="#5a523a" stroke-width="2"/>' +
    `<circle class="bk-led${ring}" cx="404" cy="322" r="2.4" fill="#e0603a"/>`
  )
}

export function backroomsWorld(): World {
  const next = random(7331)
  let grid = ''

  for (let x = -3000; x <= 3000; x += 300) {
    grid += `M${f(sx(x, 0.72))} ${f(cy(0.72))}L${f(sx(x, 9))} ${f(cy(9))}`
  }

  for (let k = 0; k <= 22; k += 1) {
    const z = 0.96 + 0.375 * k

    grid += `M${f(Math.max(-60, sx(-3000, z)))} ${f(cy(z))}H${f(Math.min(1660, sx(3000, z)))}`
  }

  // Damp patches in the carpet, each with a faint wet sheen catching the tubes.
  const stains = ([
    [-300, 1.12, 1.2],
    [520, 1.5, 1],
    [-60, 2.4, 1.3],
    [250, 3.6, 1.6],
    [-900, 2.9, 1],
  ] as const)
    .map(([x, z, s]) => {
      const rx = (260 / z) * s

      return (
        `<ellipse cx="${f(sx(x, z))}" cy="${f(fy(z))}" rx="${f(rx)}" ry="${f(rx * 0.16)}" fill="url(#bk-stain)"/>` +
        `<ellipse cx="${f(sx(x, z) - rx * 0.55)}" cy="${f(fy(z) + rx * 0.04)}" rx="${f(rx * 0.6)}" ry="${f(rx * 0.11)}" fill="url(#bk-stain)"/>` +
        `<ellipse cx="${f(sx(x, z) + rx * 0.2)}" cy="${f(fy(z) - rx * 0.03)}" rx="${f(rx * 0.45)}" ry="${f(rx * 0.04)}" fill="#c8b46a" fill-opacity=".07"/>`
      )
    })
    .join('')
  // The far wall's doorways, each a glimpse of another lit room; on web they light up one after another.
  const farDoors: Door[] = [
    [-5600, -5100, -175],
    [-2600, -2150, -175],
    [-700, -300, -175],
    [1300, 1750, -175],
    [3900, 4400, -175],
  ]
  const glimpses = farDoors
    .map(
      ([a, b], i) =>
        `<rect class="bk-gl" style="--i:${i}" x="${f(sx(a, 8))}" y="${f(cy(8))}" width="${f((b - a) / 8)}" height="${f(fy(8) - cy(8))}" fill="url(#bk-glim)"/>`,
    )
    .join('')
  const motes = Array.from({ length: 12 }, (_, i) => {
    const right = i % 3 !== 0
    const x = right ? 1210 + next() * 370 : 110 + next() * 240
    const y = right ? 70 + next() * 260 : 320 + next() * 420

    return `<circle class="bk-mote" style="animation-delay:${f(-next() * 14)}s;animation-duration:${f(11 + next() * 6)}s" cx="${f(x)}" cy="${f(y)}" r="${f(1.1 + next() * 1.4)}" fill="#f6e7a8" fill-opacity=".4"/>`
  }).join('')
  const nearDoor: Door = [-940, -560, -175]

  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'crt',
      cup: 'mug',
      thought: 'dust',
      ink: '#0a0804',
      furniture: '#3f3620',
      metal: '#6e6546',
      paper: '#e6dcb8',
      light: { idle: '#a3ab6c', work: '#d6df92', bright: '#f2f6cc' },
      headTop: 238,
      glowAt: [306, 276],
      device,
      wear: {
        front:
          // The lanyard runs down the sides, clear of the eyes, to the clip of an office badge.
          '<path d="M74 242L96 316Q99 325 136 325M226 242L218 316Q215 325 146 325" fill="none" stroke="#3d5a7a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<rect x="137" y="319" width="9" height="7" rx="1.5" fill="#9aa0a6"/>' +
          '<rect x="124" y="325" width="34" height="25" rx="3" fill="#e8e0c2"/><rect x="124" y="325" width="34" height="4" fill="#3d5a7a"/>' +
          '<rect x="128" y="332" width="10" height="12" fill="#6b5a36"/><path d="M142 334H154M142 339H151M142 344H155" stroke="#7a705a" stroke-width="2"/>',
      },
      seatArt:
        // An office swivel chair in tired mustard fabric.
        '<rect x="54" y="246" width="24" height="104" rx="9" fill="#4e4426"/><rect x="66" y="300" width="8" height="54" fill="#26211a"/>' +
        '<rect x="100" y="348" width="104" height="14" rx="6" fill="#544a2a"/><rect x="146" y="362" width="10" height="48" fill="#26211a"/>' +
        '<path d="M151 412L104 440M151 412L198 440M151 412L126 448M151 412L176 448" stroke="#26211a" stroke-width="6" stroke-linecap="round"/>' +
        '<g fill="#15120c"><circle cx="104" cy="446" r="6"/><circle cx="198" cy="446" r="6"/><circle cx="126" cy="451" r="5"/><circle cx="176" cy="451" r="5"/></g>',
      tableArt:
        // The lone desk: yellowed laminate, a modesty panel, a drawer pedestal.
        '<rect x="164" y="328" width="308" height="12" rx="2" fill="#6e5f31"/><rect x="164" y="338" width="308" height="4" fill="#4a3f20"/>' +
        '<rect x="184" y="342" width="196" height="54" fill="#342c18"/><rect x="172" y="342" width="12" height="114" fill="#3f3620"/>' +
        '<rect x="380" y="342" width="88" height="114" fill="#4a4024"/>' +
        '<path d="M386 348H462V380H386ZM386 386H462V418H386ZM386 424H462V452H386Z" fill="none" stroke="#2e2716" stroke-width="2"/>' +
        '<g fill="#9a8a52"><rect x="414" y="362" width="20" height="3"/><rect x="414" y="400" width="20" height="3"/><rect x="414" y="436" width="20" height="3"/></g>',
    },
    style:
      // Ambient: the tubes hum, two of them stutter now and then, dust drifts in the light.
      '.bk-h{animation:bk-bz .36s ease-in-out infinite alternate}@keyframes bk-bz{to{opacity:.86}}' +
      '.bk-fk{animation:bk-fk 5.2s linear infinite}' +
      // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: two dips per cycle, and the three stuttering tubes share one period at
      // phases apart, so no second holds more than 2 dips (tool: 2.6 s, still 2). Run, error and done stop them.
      '@keyframes bk-fk{0%,58%,100%{opacity:1}60%{opacity:.22}63%{opacity:.95}67%{opacity:.3}71%{opacity:1}}' +
      '.bk-mote{animation:bk-mote 14s ease-in-out infinite alternate}@keyframes bk-mote{to{transform:translate(24px,-50px)}}' +
      '.bk-cr{opacity:var(--o)}.bk-gl{opacity:.45}' +
      '.bk-sign{animation:bk-sign 4s ease-in-out infinite alternate}@keyframes bk-sign{from{opacity:.6}to{opacity:.95}}' +
      // Thinking: the hum swells and sags.
      '.st-thinking .bk-h{animation:bk-br 2.6s ease-in-out infinite alternate}@keyframes bk-br{from{opacity:.45}to{opacity:1}}' +
      // Tool: the bad tubes stutter more often.
      '.st-tool .bk-fk{animation-duration:2.6s}' +
      // Web: the far doorways light up one after another, and the phone line blinks.
      '.st-web .bk-gl{animation:bk-seek 1.8s ease-in-out infinite;animation-delay:calc(var(--i) * .3s)}@keyframes bk-seek{0%,100%{opacity:.35}40%{opacity:1}}' +
      '.bk-ring{animation:bk-ring .9s ease-in-out infinite alternate}@keyframes bk-ring{from{opacity:.2}to{opacity:1}}' +
      // Read: the floor plan unrolls on the wall.
      '.bk-memo{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}.st-read .bk-memo{animation:bk-unroll 1.1s ease-out both}@keyframes bk-unroll{to{transform:scaleY(1)}}' +
      // Run: the rooms shift. Walls slide past each other, the near wall pulls away and the corridor behind it lights up.
      '.st-run .bk-nl{animation:bk-nl 1.5s cubic-bezier(.45,0,.25,1) .1s both}@keyframes bk-nl{to{transform:translateX(-580px)}}' +
      '.st-run .bk-s2{animation:bk-s2 1.5s cubic-bezier(.45,0,.25,1) .5s both}@keyframes bk-s2{to{transform:translateX(400px)}}' +
      '.st-run .bk-s4{animation:bk-s4 1.4s cubic-bezier(.45,0,.25,1) .35s both}@keyframes bk-s4{to{transform:translateX(-170px)}}' +
      '.st-run .bk-p3{animation:bk-p3 1.6s cubic-bezier(.45,0,.25,1) .25s both}@keyframes bk-p3{to{transform:translateX(150px)}}' +
      '.st-run .bk-p5{animation:bk-p5 1.6s cubic-bezier(.45,0,.25,1) .45s both}@keyframes bk-p5{to{transform:translateX(-110px)}}' +
      '.st-run .bk-s8{animation:bk-s8 1.8s cubic-bezier(.45,0,.25,1) .2s both}@keyframes bk-s8{to{transform:translateX(260px)}}' +
      '.st-run .bk-cr{animation:bk-up .6s ease-out both;animation-delay:calc(.9s + var(--i) * .24s)}.st-run .bk-cr.bk-st{animation-name:bk-ign}' +
      '@keyframes bk-up{from{opacity:var(--o)}to{opacity:1}}@keyframes bk-ign{0%{opacity:var(--o)}30%{opacity:.85}50%{opacity:.3}100%{opacity:1}}' +
      '.st-run .bk-fk,.st-error .bk-fk{animation:none}' +
      '.bk-clit{opacity:0}.st-run .bk-clit{animation:bk-on 1.8s ease-out .9s both}@keyframes bk-on{to{opacity:1}}' +
      '.st-run .bk-fog{animation:bk-fog 1.8s ease-out .9s both}@keyframes bk-fog{to{opacity:.4}}' +
      // Error: the lights go out row by row, the farthest first, until only Claude's screen is left.
      // FLASHING: only rows 2 and 1 and the desk troffer stutter once each (3 dips at about 1.03, 1.2 and 1.35 s), and
      // each ramp of bk-out lasts at least 125 ms.
      '.st-error .bk-row{animation:bk-fade .45s ease-in both;animation-delay:var(--d)}.st-error .bk-row.bk-st{animation-name:bk-out;animation-duration:.5s}@keyframes bk-fade{to{opacity:0}}' +
      '@keyframes bk-out{0%{opacity:1}30%{opacity:.2}55%{opacity:.65}100%{opacity:0}}' +
      '.st-error .bk-cr{animation:bk-cout .55s ease-in both;animation-delay:calc(.05s + (5 - var(--i)) * .07s)}' +
      '@keyframes bk-cout{from{opacity:var(--o)}to{opacity:0}}' +
      '.st-error .bk-gl{animation:bk-fade .55s ease-in .1s both}' +
      '.st-error .bk-fx{animation:bk-out .5s ease-in 1.2s both}' +
      '.bk-dark{opacity:0}.st-error .bk-dark{animation:bk-dark 1.8s cubic-bezier(.2,.5,.4,1) both}' +
      '@keyframes bk-dark{0%{opacity:1;transform:translateX(-1000px)}100%{opacity:1;transform:translateX(1500px)}}' +
      // Done: the exit door at the end of the corridor swings open on daylight.
      '.bk-day,.bk-spill{opacity:0}.st-done .bk-day{animation:bk-on 1.6s ease-out .45s both}.st-done .bk-spill{animation:bk-on 1.8s ease-out .9s both}' +
      '.bk-door{transform-box:fill-box;transform-origin:0 50%}.st-done .bk-door{animation:bk-door 1.3s cubic-bezier(.4,0,.2,1) .3s both}@keyframes bk-door{to{transform:scaleX(.1)}}' +
      '.st-done .bk-sign{animation:bk-on 1s ease-out both}.st-done .bk-fk{animation:none}',
    scenery:
      '<defs>' +
      '<linearGradient id="bk-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312a14"/><stop offset="1" stop-color="#0b0905"/></linearGradient>' +
      '<linearGradient id="bk-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0905"/><stop offset="1" stop-color="#2b2411"/></linearGradient>' +
      '<linearGradient id="bk-w0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#73601f"/><stop offset=".5" stop-color="#524216"/><stop offset="1" stop-color="#2a220c"/></linearGradient>' +
      '<linearGradient id="bk-w1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e4c1a"/><stop offset=".5" stop-color="#3e3212"/><stop offset="1" stop-color="#1d170a"/></linearGradient>' +
      '<linearGradient id="bk-w2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#392f12"/><stop offset="1" stop-color="#1a150a"/></linearGradient>' +
      '<linearGradient id="bk-w3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#221d0d"/><stop offset="1" stop-color="#120f07"/></linearGradient>' +
      '<pattern id="bk-wp" patternUnits="userSpaceOnUse" width="64" height="96">' +
      '<path d="M0 0h4v96h-4z" fill="#000" fill-opacity=".16"/><path d="M32 0h2v96h-2z" fill="#f5e4a0" fill-opacity=".06"/>' +
      '<path d="M16 40l7 8l-7 8l-7-8zM48 88l7 8l-7 8l-7-8zM48 -8l7 8l-7 8l-7-8z" fill="#000" fill-opacity=".14"/></pattern>' +
      '<radialGradient id="bk-halo"><stop offset="0" stop-color="#f2dc8a" stop-opacity=".46"/><stop offset=".45" stop-color="#e8cf78" stop-opacity=".16"/><stop offset="1" stop-color="#e8cf78" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="bk-dk" x1="0" y1="0" x2="1" y2="0"><stop offset=".68" stop-color="#030201" stop-opacity=".62"/><stop offset="1" stop-color="#030201" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="bk-stain"><stop offset="0" stop-color="#040302" stop-opacity=".6"/><stop offset=".6" stop-color="#040302" stop-opacity=".32"/><stop offset="1" stop-color="#040302" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="bk-pool"><stop offset="0" stop-color="#e8d488" stop-opacity=".16"/><stop offset="1" stop-color="#e8d488" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="bk-glim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0dc90" stop-opacity=".42"/><stop offset="1" stop-color="#f0dc90" stop-opacity=".04"/></linearGradient>' +
      `<radialGradient id="bk-fog" gradientUnits="userSpaceOnUse" cx="${f(cp(170, VY, CD)[0])}" cy="${f(VY + 20)}" r="380"><stop offset="0" stop-color="#070503" stop-opacity=".86"/><stop offset=".45" stop-color="#070503" stop-opacity=".55"/><stop offset="1" stop-color="#070503" stop-opacity="0"/></radialGradient>` +
      '<radialGradient id="bk-wash" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#f4e0a0" stop-opacity=".16"/><stop offset="1" stop-color="#f4e0a0" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="bk-green"><stop offset="0" stop-color="#3ddc84" stop-opacity=".35"/><stop offset="1" stop-color="#3ddc84" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="bk-sun"><stop offset="0" stop-color="#eef6ff" stop-opacity=".55"/><stop offset=".35" stop-color="#d8e8ff" stop-opacity=".2"/><stop offset="1" stop-color="#d8e8ff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="bk-shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f0ff" stop-opacity=".42"/><stop offset="1" stop-color="#e4f0ff" stop-opacity=".03"/></linearGradient>' +
      '<linearGradient id="bk-spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f0ff" stop-opacity=".2"/><stop offset="1" stop-color="#e4f0ff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      // The ceiling grid and the carpet.
      `<rect width="1600" height="${VY}" fill="url(#bk-ceil)"/><rect y="${VY}" width="1600" height="${1000 - VY}" fill="url(#bk-floor)"/>` +
      `<path d="${grid}" stroke="#0a0805" stroke-opacity=".75" stroke-width="2"/>` +
      stains +
      // The far wall with its doorways onto more lit rooms.
      `<g class="bk-s8"><rect x="-500" y="${f(cy(8))}" width="2600" height="${f(fy(8) - cy(8))}" fill="#2a2410"/>${glimpses}` +
      `${slab(8, -9000, 9000, farDoors, 3)}</g>` +
      row(14, 0.1, 0) +
      row(10, 0.25, 0) +
      `<g class="bk-p5">${slab(5.6, -1300, -1100, [], 3)}</g>` +
      `<g class="bk-s4">${slab(4.4, -2000, -1250, [], 2)}</g>` +
      slab(4.4, 1650, 4200, [[2500, 3000, -175]], 2) +
      row(7, 0.4, 0) +
      `<g class="bk-p3">${slab(3, 260, 440, [], 2)}</g>` +
      row(5, 0.55, 0) +
      row(3, 0.7, 0) +
      `<g class="bk-s2">${slab(2.1, 820, 3400, [[1180, 1580, -190]], 1)}</g>` +
      row(2, 0.88, 1350, true) +
      row(1, 1.05, 0, true) +
      motes +
      corridor() +
      // The near wall, with its doorway into the corridor.
      `<g class="bk-nl">${slab(1.3, -2400, -470, [nearDoor], 0, 0.06)}</g>` +
      `<path class="bk-spill" d="${poly([[sx(nearDoor[0], 1.3) + 20, NB], [sx(nearDoor[1], 1.3), NB], [520, 1010], [-60, 1010]])}" fill="url(#bk-spill)"/>` +
      '<rect class="bk-dark" x="-2400" y="-200" width="3400" height="1400" fill="url(#bk-dk)"/>',
    nook:
      // The desk's shadow on the carpet, a damp patch, the monitor's cord, and a floor plan that unrolls while reading.
      '<ellipse cx="300" cy="452" rx="214" ry="14" fill="#000" fill-opacity=".45"/><ellipse cx="151" cy="452" rx="62" ry="8" fill="#000" fill-opacity=".4"/>' +
      '<ellipse cx="40" cy="446" rx="80" ry="11" fill="url(#bk-stain)"/><ellipse cx="52" cy="444" rx="34" ry="3" fill="#c8b46a" fill-opacity=".07"/>' +
      '<path d="M398 300C430 330 440 420 470 452" fill="none" stroke="#15110a" stroke-width="3"/>' +
      '<path d="M76 -48V-40" stroke="#15110a" stroke-width="2"/>' +
      '<g class="bk-memo"><rect x="30" y="-42" width="96" height="112" fill="#d8cfa6" fill-opacity=".85"/>' +
      '<path d="M40 -30H116V58H40ZM40 -6H72V18M90 -30V6H116M56 18V58M72 34H104V58M90 18H116" fill="none" stroke="#4a4024" stroke-width="2.4"/>' +
      '<path d="M96 40l8 8M104 40l-8 8" stroke="#a0402a" stroke-width="2.4"/><circle cx="78" cy="-38" r="3" fill="#a0402a"/></g>',
  }
}
