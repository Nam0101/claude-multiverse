import { f, random } from './kit'
import type { World } from './world'

// The Deep: the diver at the control panel inside a diving bell, glowing fish passing the portholes.

function fish(y: number, size: number, seconds: number, delay: number, width: number, flip: boolean): string {
  const body =
    `<g transform="scale(${flip ? -size : size} ${size})"><ellipse rx="16" ry="7" fill="#5ff3ff" fill-opacity=".55"/>` +
    '<path d="M-14 0 L-26 -8 L-24 0 L-26 8Z" fill="#5ff3ff" fill-opacity=".4"/><circle cx="9" cy="-2" r="1.6" fill="#e9ffff"/></g>'

  return (
    `<g transform="translate(0 ${y})"><g class="dv-swim" style="--w:${width}px;animation-duration:${seconds}s;animation-delay:${delay}s` +
    `${flip ? ';animation-direction:reverse' : ''}">${body}</g></g>`
  )
}

function porthole(id: string, cx: number, cy: number, r: number, seed: number): string {
  const next = random(seed)
  const motes = Array.from(
    { length: 16 },
    () => `<circle cx="${f(cx - r + next() * r * 2)}" cy="${f(cy - r + next() * r * 2)}" r="${f(0.8 + next() * 1.4)}" fill="#7ff3f3" fill-opacity="${f(0.2 + next() * 0.5)}"/>`,
  ).join('')

  return (
    `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#dv-water)"/>` +
    `<g clip-path="url(#${id})"><g class="dv-float">${motes}</g><g transform="translate(${cx - r - 40} 0)">` +
    fish(cy - r * 0.3, 1, 9, -2, r * 2 + 80, false) +
    fish(cy + r * 0.25, 0.7, 13, -7, r * 2 + 80, true) +
    fish(cy + r * 0.05, 0.5, 17, -11, r * 2 + 80, false) +
    '</g></g>' +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#163646" stroke-width="22"/>` +
    Array.from({ length: 10 }, (_, index) => {
      const a = (index / 10) * Math.PI * 2

      return `<circle cx="${f(cx + Math.cos(a) * (r + 2))}" cy="${f(cy + Math.sin(a) * (r + 2))}" r="3" fill="#2a5a6a"/>`
    }).join('')
  )
}

export function deepWorld(): World {
  const bubbles = Array.from(
    { length: 9 },
    (_, index) =>
      `<circle class="dv-bub" style="animation-delay:${f(-index * 0.45)}s;--dx:${index % 2 === 0 ? 6 : -6}px" cx="${30 + (index % 3) * 6}" cy="110" r="${3 + (index % 3) * 2}" fill="none" stroke="#7ff3f3" stroke-opacity=".6" stroke-width="1.5"/>`,
  ).join('')

  return {
    rig: {
      head: 'dive',
      seat: 'stool',
      table: 'console',
      machine: 'panel',
      cup: 'none',
      thought: 'bubbles',
      ink: '#02070a',
      furniture: '#0d2631',
      metal: '#163646',
      paper: '#cfe6ea',
      light: { idle: '#2a8f9a', work: '#2fc6c6', bright: '#7ff3f3' },
    },
    style:
      '.dv-swim{animation:dv-swim 10s linear infinite}@keyframes dv-swim{from{transform:translateX(0)}to{transform:translateX(var(--w,300px))}}' +
      '.dv-float{animation:dv-float 14s ease-in-out infinite alternate}@keyframes dv-float{to{transform:translate(8px,-18px)}}' +
      '.dv-bub{opacity:0}.st-run .dv-bub,.st-tool .dv-bub{animation:dv-bub 2.6s ease-in infinite}' +
      '@keyframes dv-bub{0%{opacity:0;transform:translate(0,0)}15%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-170px)}}' +
      '.dv-needle{transform:rotate(-40deg)}.st-run .dv-needle{animation:dv-needle 1.2s ease-in-out infinite alternate}' +
      '@keyframes dv-needle{from{transform:rotate(-30deg)}to{transform:rotate(60deg)}}' +
      '.st-thinking .dv-swim{animation-duration:16s}',
    scenery:
      '<defs><linearGradient id="dv-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d27"/>' +
      '<stop offset="1" stop-color="#051019"/></linearGradient>' +
      '<radialGradient id="dv-water" cx=".5" cy=".3"><stop offset="0" stop-color="#0a3550"/><stop offset="1" stop-color="#021220"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#dv-wall)"/>' +
      `<g fill="none" stroke="#0f2a36" stroke-width="16">${[110, 520, 930, 1340].map(x => `<path d="M${x} 0 Q${x - 40} 500 ${x} 1000"/>`).join('')}</g>` +
      `<g fill="#173a48">${[110, 520, 930, 1340].flatMap(x => [120, 320, 520, 720, 920].map(y => `<circle cx="${x - 40 * (1 - Math.pow((y - 500) / 500, 2)) * 0.5}" cy="${y}" r="4"/>`)).join('')}</g>` +
      '<rect y="150" width="1600" height="18" fill="#123040"/><rect y="150" width="1600" height="4" fill="#1d4a5c"/>' +
      porthole('dv-p1', 260, 420, 130, 5),
    nook:
      porthole('dv-p2', 220, -260, 112, 9) +
      // The gauge whose needle swings when a command runs, and the valve that bubbles.
      '<g transform="translate(60 -30)"><circle r="26" fill="#0d2631" stroke="#2a5a6a" stroke-width="4"/>' +
      '<g class="dv-needle"><line x2="18" stroke="#7ff3f3" stroke-width="3" stroke-linecap="round"/></g><circle r="4" fill="#2a5a6a"/></g>' +
      '<rect x="-20" y="100" width="90" height="14" rx="5" fill="#123040"/><rect x="24" y="92" width="16" height="10" fill="#1d4a5c"/>' +
      bubbles,
  }
}
