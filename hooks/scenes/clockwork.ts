import { f, gear } from './kit'
import type { World } from './world'

// Clockwork: the mechanic at a mechanical typewriter geared to the workshop. The wall's gears tick while Claude
// thinks, turn slowly while it writes, and spin when it uses a tool.

type Wheel = { x: number; y: number; r: number; teeth: number; back: boolean }

const WHEELS: readonly Wheel[] = [
  { x: 120, y: 860, r: 220, teeth: 44, back: false },
  { x: 334, y: 682, r: 80, teeth: 16, back: true },
  { x: 1500, y: 140, r: 190, teeth: 38, back: false },
  { x: 1546, y: 420, r: 104, teeth: 21, back: true },
  { x: 1280, y: 250, r: 64, teeth: 13, back: true },
]

function wheel(w: Wheel): string {
  // A wheel's period follows its teeth, so meshing wheels look geared together.
  const seconds = w.teeth * 0.9

  return (
    `<g transform="translate(${w.x} ${w.y})"><g class="dh-g${w.back ? ' dh-back' : ''}" style="--d:${f(seconds)}s">` +
    `<path d="${gear(w.r, w.teeth)}" fill="#c9a04e" fill-opacity=".07" fill-rule="evenodd" stroke="#c9a04e" stroke-opacity=".3" stroke-width="2"/></g></g>`
  )
}

export function clockworkWorld(): World {
  return {
    rig: {
      head: 'goggles',
      seat: 'stool',
      table: 'bench',
      machine: 'typewriter',
      cup: 'mug',
      thought: 'puffs',
      ink: '#060403',
      furniture: '#2c2015',
      metal: '#3d2e1b',
      paper: '#e5d8bf',
      light: { idle: '#a07a36', work: '#c9a04e', bright: '#f0cf84' },
    },
    style:
      '.dh-g{animation:none}' +
      '.st-thinking .dh-g{animation:dh-tick calc(var(--d) * 2) steps(40) infinite}' +
      '.st-responding .dh-g{animation:mv-spin calc(var(--d) * 3) linear infinite}' +
      '.st-tool .dh-g,.st-read .dh-g,.st-web .dh-g{animation:mv-spin var(--d) linear infinite}' +
      '.st-run .dh-g{animation:mv-spin calc(var(--d) * .4) linear infinite}' +
      '@keyframes dh-tick{to{transform:rotate(360deg)}}' +
      'svg .dh-g.dh-back{animation-direction:reverse}' +
      '.dh-hand{animation:mv-spin 60s linear infinite}',
    scenery:
      '<defs><radialGradient id="dh-bg" cx=".8" cy=".25" r="1"><stop offset="0" stop-color="#271d13"/><stop offset="1" stop-color="#140f0a"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#dh-bg)"/>' +
      '<g fill="none" stroke="#3d2e1b" stroke-width="14"><path d="M0 120 H260 Q300 120 300 160 V420"/><path d="M0 170 H200"/></g>' +
      '<g fill="#5a4426"><circle cx="300" cy="300" r="10"/><circle cx="200" cy="170" r="8"/></g>' +
      WHEELS.map(wheel).join('') +
      // A wall clock, its hand always going round.
      '<g transform="translate(560 150)"><circle r="78" fill="#1c150e" stroke="#c9a04e" stroke-opacity=".35" stroke-width="5"/>' +
      `${Array.from({ length: 12 }, (_, index) => `<rect x="-2" y="-70" width="4" height="${index % 3 === 0 ? 14 : 8}" fill="#c9a04e" fill-opacity=".4" transform="rotate(${index * 30})"/>`).join('')}` +
      '<g class="dh-hand"><rect x="-2" y="-58" width="4" height="62" fill="#c9a04e" fill-opacity=".55"/></g><circle r="6" fill="#c9a04e" fill-opacity=".6"/></g>',
    nook:
      '<g transform="translate(410 230)"><g class="dh-g dh-back" style="--d:11.7s">' +
      `<path d="${gear(46, 13)}" fill="#3d2e1b" fill-rule="evenodd"/></g></g>`,
  }
}
