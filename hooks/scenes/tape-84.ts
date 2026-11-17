import { f, random } from './kit'
import type { World } from './world'

// Mag Tape '84: the machine-room engineer at a CRT, rows of cabinets blinking behind, tape reels that spin when a
// command runs.
const LEDS = ['#ffb000', '#7fd17f', '#ff6b5e']

function reel(cx: number, cy: number, r: number, seconds: number): string {
  const holes = [0, 120, 240]
    .map(a => `<circle cx="${f(Math.cos((a * Math.PI) / 180) * r * 0.5)}" cy="${f(Math.sin((a * Math.PI) / 180) * r * 0.5)}" r="${f(r * 0.24)}" fill="#0b0f17"/>`)
    .join('')

  return (
    `<g transform="translate(${cx} ${cy})"><g class="bt-reel" style="--rs:${seconds}s">` +
    `<circle r="${r}" fill="#1a2130" stroke="#ffb000" stroke-opacity=".3" stroke-width="2"/>${holes}<circle r="${f(r * 0.14)}" fill="#ffb000" fill-opacity=".4"/></g></g>`
  )
}

export function tape84World(): World {
  const next = random(84)
  const cabinets: string[] = []

  for (let index = 0, x = 6; x < 1600; index += 1, x += 104) {
    cabinets.push(`<rect x="${x}" y="230" width="96" height="640" rx="3" fill="#0f1521" stroke="#1a2232" stroke-width="2"/>`)

    for (let led = 0; led < 7; led += 1) {
      const kind = Math.floor(next() * 3)
      cabinets.push(
        `<rect class="bt-led bt-l${kind}" style="animation-delay:${f(-next() * 6)}s" x="${f(x + 16 + (led % 2) * 14)}" y="${f(270 + led * 26)}" ` +
          `width="5" height="5" fill="${LEDS[kind] ?? '#ffb000'}"/>`,
      )
    }

    if (index % 3 === 1) {
      cabinets.push(reel(x + 28, 640, 22, 2.2) + reel(x + 68, 640, 22, 1.6))
    }

    cabinets.push(`<g stroke="#1a2232" stroke-width="2"><line x1="${x + 10}" y1="760" x2="${x + 86}" y2="760"/><line x1="${x + 10}" y1="800" x2="${x + 86}" y2="800"/></g>`)
  }

  return {
    rig: {
      head: 'headset',
      seat: 'chair',
      table: 'desk',
      machine: 'crt',
      cup: 'mug',
      thought: 'bits',
      ink: '#04060a',
      furniture: '#161c28',
      metal: '#1e2533',
      paper: '#d8cfb8',
      light: { idle: '#a07c2c', work: '#ffb000', bright: '#ffd166' },
    },
    style:
      '.bt-led{animation:bt-blink 4s steps(1) infinite}.bt-l1{animation-duration:5.7s}.bt-l2{animation-duration:7.3s}' +
      '@keyframes bt-blink{0%{opacity:.85}40%{opacity:.12}70%{opacity:.6}}' +
      '.st-run .bt-led,.st-tool .bt-led{animation-duration:.45s}.st-run .bt-l1,.st-tool .bt-l1{animation-duration:.7s}' +
      '.bt-reel{animation:none}.st-run .bt-reel,.st-tool .bt-reel,.st-read .bt-reel{animation:mv-spin var(--rs,2s) linear infinite}' +
      '.bt-sweep{animation:bt-sweep 9s linear infinite}@keyframes bt-sweep{from{transform:translateY(-200px)}to{transform:translateY(1100px)}}',
    scenery:
      '<defs><linearGradient id="bt-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e16"/>' +
      '<stop offset="1" stop-color="#0e1320"/></linearGradient>' +
      '<pattern id="bt-scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fill-opacity=".35"/></pattern>' +
      '<linearGradient id="bt-sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb000" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#ffb000" stop-opacity=".045"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></linearGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#bt-bg)"/>' +
      cabinets.join('') +
      '<rect y="870" width="1600" height="130" fill="#0a0d15"/>' +
      `<g stroke="#ffb000" stroke-opacity=".06">${[-6, -4, -2, 0, 2, 4, 6].map(k => `<line x1="${800 + k * 40}" y1="870" x2="${800 + k * 260}" y2="1000"/>`).join('')}</g>` +
      '<rect class="bt-sweep" width="1600" height="160" fill="url(#bt-sw)"/>' +
      '<rect width="1600" height="1000" fill="url(#bt-scan)"/>',
    nook: '',
  }
}
