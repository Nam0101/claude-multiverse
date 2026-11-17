import type { World } from './world'

// The Void, the anomaly: nothing left but two hands, a floating keyboard and one cursor.
export function voidWorld(): World {
  return {
    rig: {
      head: 'none',
      seat: 'none',
      table: 'none',
      machine: 'keys',
      cup: 'none',
      thought: 'none',
      handsOnly: true,
      floating: true,
      ink: '#2c2c36',
      furniture: '#1a1a20',
      metal: '#24242c',
      paper: '#c8c8d0',
      light: { idle: '#8a8aa0', work: '#d8d8ff', bright: '#ffffff' },
    },
    style: '',
    scenery:
      '<defs><radialGradient id="hk-bg" cx=".85" cy=".8" r=".8"><stop offset="0" stop-color="#0e0e12"/><stop offset="1" stop-color="#070709"/></radialGradient></defs>' +
      '<rect width="1600" height="1000" fill="url(#hk-bg)"/>',
    nook: '',
  }
}
