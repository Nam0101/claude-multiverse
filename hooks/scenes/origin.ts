import { f, random } from './kit'
import type { World } from './world'

// Origin #0001, home: a night room, a laptop and a desk lamp, stardust drifting past the window.
export function originWorld(): World {
  const next = random(1)
  const stars: string[] = []

  for (let index = 0; index < 46; index += 1) {
    const x = 40 + next() * 360
    const y = -400 + next() * 330
    const r = 0.6 + next() * 1.6
    const twinkle = next() > 0.6 ? ` class="g-tw" style="animation-delay:${f(-next() * 5)}s"` : ''

    stars.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${next() > 0.75 ? '#f0b48a' : '#efe3d2'}" fill-opacity="${f(0.35 + next() * 0.5)}"${twinkle}/>`)
  }

  const motes: string[] = []

  for (let index = 0; index < 28; index += 1) {
    motes.push(`<circle cx="${f(next() * 1600)}" cy="${f(next() * 1000)}" r="${f(0.8 + next())}" fill="#e8c9a8" fill-opacity="${f(0.08 + next() * 0.12)}"/>`)
  }

  return {
    rig: {
      head: 'hair',
      seat: 'chair',
      table: 'desk',
      machine: 'laptop',
      cup: 'mug',
      thought: 'dust',
      ink: '#070504',
      furniture: '#1f1813',
      metal: '#2b241f',
      paper: '#d6c9b6',
      light: { idle: '#c98a5e', work: '#e8875a', bright: '#ffb38a' },
    },
    style:
      '.g-drift{animation:g-drift 70s ease-in-out infinite alternate}@keyframes g-drift{to{transform:translate(-26px,-12px)}}' +
      '.g-tw{animation:g-tw 5s ease-in-out infinite alternate}@keyframes g-tw{from{opacity:.15}to{opacity:1}}' +
      '.st-thinking .g-tw{animation-duration:1.6s}' +
      '.g-lamp{opacity:0}.st-run .g-lamp{animation:g-lamp 1.4s ease-in-out infinite}' +
      '@keyframes g-lamp{0%,100%{opacity:.15}30%,70%{opacity:.75}}' +
      '.st-run .g-drift{animation-duration:6s}',
    scenery:
      '<defs><radialGradient id="g-wall" cx=".8" cy=".35" r=".9"><stop offset="0" stop-color="#261d17"/>' +
      '<stop offset="1" stop-color="#140f0c"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#g-wall)"/>' +
      '<rect y="930" width="1600" height="70" fill="#110d0a"/><line x1="0" y1="930" x2="1600" y2="930" stroke="#2a211b" stroke-width="2"/>' +
      `<g class="g-drift">${motes.join('')}</g>`,
    nook:
      '<defs><linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0d1a"/>' +
      '<stop offset="1" stop-color="#1e1828"/></linearGradient><clipPath id="g-win"><rect x="40" y="-400" width="360" height="330"/></clipPath>' +
      '<radialGradient id="g-cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="40" y="-400" width="360" height="330" fill="url(#g-sky)"/>' +
      `<g clip-path="url(#g-win)"><g class="g-drift" style="animation-duration:50s">${stars.join('')}</g>` +
      '<path d="M330 -350 a26 26 0 1 0 22 40 a20 20 0 1 1 -22 -40z" fill="#efe3d2" fill-opacity=".5"/></g>' +
      '<g fill="none" stroke="#241c16" stroke-width="12"><rect x="40" y="-400" width="360" height="330"/>' +
      '<line x1="220" y1="-400" x2="220" y2="-70"/><line x1="40" y1="-235" x2="400" y2="-235"/></g>' +
      '<rect x="28" y="-72" width="384" height="12" fill="#241c16"/>' +
      // The desk lamp, off: it flicks on when a command runs.
      '<path class="g-lamp" d="M372 262 L330 330 L420 330 Z" fill="url(#g-cone)"/>' +
      '<g fill="#1a1410"><ellipse cx="400" cy="328" rx="16" ry="4"/><path d="M398 326 L392 270 L372 252" fill="none" stroke="#1a1410" stroke-width="5"/>' +
      '<path d="M360 246 L386 240 L382 266 Z"/></g>',
  }
}
