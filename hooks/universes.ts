import type { ThemeBackdropGlass, ThemeSetArgs } from 'claude-code'

import type { Activity, Desk } from '../types'
import { makeColors } from './make-colors.js'
import { arenaRockWorld } from './scenes/arena-rock'
import { blackHoleWorld } from './scenes/black-hole'
import { carnivalWorld } from './scenes/carnival'
import { clockworkWorld } from './scenes/clockwork'
import { collapseWorld } from './scenes/collapse'
import { colosseumWorld } from './scenes/colosseum'
import { deepWorld } from './scenes/deep'
import { deepForgeWorld } from './scenes/deep-forge'
import { dinosaursWorld } from './scenes/dinosaurs'
import { dragonfireWorld } from './scenes/dragonfire'
import { galacticWarWorld } from './scenes/galactic-war'
import { grandPrixWorld } from './scenes/grand-prix'
import { halloweenWorld } from './scenes/halloween'
import { heistWorld } from './scenes/heist'
import { kaijuWorld } from './scenes/kaiju'
import { COMMON, CORNER, frame } from './scenes/kit'
import type { Insets } from './scenes/kit'
import { lightningLabWorld } from './scenes/lightning-lab'
import { lostTempleWorld } from './scenes/lost-temple'
import { lunarNewYearWorld } from './scenes/lunar-new-year'
import { neonWorld } from './scenes/neon-2099'
import { ninjaMoonWorld } from './scenes/ninja-moon'
import { originWorld } from './scenes/origin'
import { pharaohWorld } from './scenes/pharaoh'
import { polarNightWorld } from './scenes/polar-night'
import { redPlanetWorld } from './scenes/red-planet'
import { RIG_STYLE, deskScene } from './scenes/rig'
import { robotFactoryWorld } from './scenes/robot-factory'
import { skyWhalesWorld } from './scenes/sky-whales'
import { stormChaserWorld } from './scenes/storm-chaser'
import { stormPiratesWorld } from './scenes/storm-pirates'
import { summitWorld } from './scenes/summit'
import { tape84World } from './scenes/tape-84'
import { undeadWorld } from './scenes/undead'
import { underworldWorld } from './scenes/underworld'
import { voidWorld } from './scenes/void'
import { wildWestWorld } from './scenes/wild-west'
import type { World } from './scenes/world'

type Anchors = {
  'surface-0': string
  'surface-1': string
  'surface-2': string
  'surface-3': string
  'text-primary': string
  'text-secondary': string
  'text-muted': string
}
type Roles = { accent: string; danger: string; success: string; warning: string; pro: string }

export type Universe = {
  id: string
  name: string
  /** Who Claude is here, what it types on, what is around it: the person's own table. */
  role: string
  machine: string
  around: string
  /** How often a new session lands here: 1 for a calm one, more for a loud one, less for the anomaly. */
  weight: number
  /** The spinner shouts in this one. */
  shouts?: boolean
  anchors: Anchors
  roles: Roles
  /** The stop a filled danger or pro control uses, where 450 (makeColors' own) leaves its hover text under contrast here. */
  fills?: { danger?: number; pro?: number }
  /** How far the stock git colors are lifted toward white, so they read on this universe's surface-3. */
  gitLift?: number
  glass: ThemeBackdropGlass
  world: () => World
}

// The loud universes come up half again as often as a calm one, under a thinner veil so their set pieces show.
const LOUD = 1.5

/** `opacity` goes up where a set piece's brightest moment would leave the chat's secondary text under 4.5:1. */
function loudGlass(tint: string, opacity = 0.44): ThemeBackdropGlass {
  return { blur: 10, tint, opacity }
}

export const UNIVERSES: readonly Universe[] = [
  {
    id: 'origin',
    name: 'Origin #0001',
    role: 'The familiar one',
    machine: 'a laptop, a desk lamp',
    around: 'a room at night, stardust past the window',
    weight: 1,
    anchors: {
      'surface-0': '#1a1512',
      'surface-1': '#201a16',
      'surface-2': '#26201b',
      'surface-3': '#28211d',
      'text-primary': '#f6efe7',
      'text-secondary': '#cfc0b1',
      'text-muted': '#a59484',
    },
    roles: { accent: '#d97757', danger: '#d65a4a', success: '#7fae6a', warning: '#d9a441', pro: '#a582c9' },
    fills: { danger: 400 },
    gitLift: 0.16,
    glass: { blur: 16, tint: '#1a1512', opacity: 0.5 },
    world: originWorld,
  },
  {
    id: 'galactic-war',
    name: 'Galactic War',
    role: 'Tactical officer',
    machine: 'a bridge console, holo screens',
    around: 'a fleet and laser fire beyond the glass',
    weight: LOUD,
    anchors: {
      'surface-0': '#080b15',
      'surface-1': '#0f131f',
      'surface-2': '#121725',
      'surface-3': '#171d2d',
      'text-primary': '#eaf0fc',
      'text-secondary': '#bcc6dc',
      'text-muted': '#8e99b2',
    },
    roles: { accent: '#4da3ff', danger: '#ff4d5e', success: '#5fe39a', warning: '#ffc14d', pro: '#b48cff' },
    glass: loudGlass('#080b15'),
    world: galacticWarWorld,
  },
  {
    id: 'undead',
    name: 'Undead',
    role: 'Survivor',
    machine: 'an old laptop on stacked crates',
    around: 'boarded-up windows, the undead shambling outside',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c100b',
      'surface-1': '#111610',
      'surface-2': '#161c15',
      'surface-3': '#1b221a',
      'text-primary': '#edf1e8',
      'text-secondary': '#c0c8b6',
      'text-muted': '#929b88',
    },
    roles: { accent: '#9bd14a', danger: '#e04848', success: '#6fcf8a', warning: '#e0b040', pro: '#a88fd8' },
    fills: { danger: 400 },
    glass: loudGlass('#0c100b'),
    world: undeadWorld,
  },
  {
    id: 'collapse',
    name: 'Collapsing Universe',
    role: 'Reality patcher',
    machine: 'a cracked, static-filled screen',
    around: 'rifts in space, shards of other universes leaking through',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0710',
      'surface-1': '#15111e',
      'surface-2': '#181421',
      'surface-3': '#1f1a2c',
      'text-primary': '#f4f0fc',
      'text-secondary': '#c8bedc',
      'text-muted': '#9b90b3',
    },
    roles: { accent: '#9b6bff', danger: '#ff4f7a', success: '#4fe3a8', warning: '#ffc24f', pro: '#ff4fd8' },
    glass: loudGlass('#0a0710'),
    world: collapseWorld,
  },
  {
    id: 'neon-2099',
    name: 'Neon 2099',
    role: 'Street hacker',
    machine: 'a cyberdeck, a holo screen',
    around: 'a neon megacity, acid rain',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0815',
      'surface-1': '#150f20',
      'surface-2': '#191225',
      'surface-3': '#251c36',
      'text-primary': '#f7eefc',
      'text-secondary': '#d1bedc',
      'text-muted': '#a592b3',
    },
    roles: { accent: '#ff3ea5', danger: '#ff5a5a', success: '#3ee8a0', warning: '#ffcf4a', pro: '#29e3ff' },
    gitLift: 0.04,
    glass: loudGlass('#0d0815'),
    world: neonWorld,
  },
  {
    id: 'kaiju',
    name: 'Kaiju & Mecha',
    role: 'Mecha pilot',
    machine: 'a cockpit, control sticks, a HUD',
    around: 'a ruined city, giant beasts',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0f10',
      'surface-1': '#101516',
      'surface-2': '#151b1c',
      'surface-3': '#1a2123',
      'text-primary': '#e4f2ee',
      'text-secondary': '#b9cdc8',
      'text-muted': '#8ca29c',
    },
    roles: { accent: '#3de8b0', danger: '#ff5d4d', success: '#7fe36a', warning: '#ff8a3d', pro: '#9f9bff' },
    fills: { pro: 400 },
    glass: loudGlass('#0b0f10'),
    world: kaijuWorld,
  },
  {
    id: 'black-hole',
    name: 'Black Hole',
    role: 'Researcher',
    machine: 'a gravitational-wave station',
    around: 'an accretion disk, stars pulled in',
    weight: LOUD,
    anchors: {
      'surface-0': '#060608',
      'surface-1': '#111114',
      'surface-2': '#131317',
      'surface-3': '#1e1e23',
      'text-primary': '#f5f3ee',
      'text-secondary': '#cbc6bd',
      'text-muted': '#9d988f',
    },
    roles: { accent: '#f2b56b', danger: '#ff6a5a', success: '#6fd39a', warning: '#ffd36b', pro: '#7ab8ff' },
    glass: loudGlass('#060608', 0.56),
    world: blackHoleWorld,
  },
  {
    id: 'dragonfire',
    name: 'Dragonfire',
    role: 'Wizard',
    machine: 'a spellbook, a crystal ball',
    around: 'castle towers, a dragon circling the sky',
    weight: LOUD,
    anchors: {
      'surface-0': '#120b0c',
      'surface-1': '#181011',
      'surface-2': '#1e1516',
      'surface-3': '#241a1b',
      'text-primary': '#f8ede9',
      'text-secondary': '#d6c0ba',
      'text-muted': '#ab958f',
    },
    roles: { accent: '#ff6a3d', danger: '#e8455a', success: '#7fcf6a', warning: '#f0b44a', pro: '#b07cff' },
    fills: { danger: 400 },
    glass: loudGlass('#120b0c', 0.54),
    world: dragonfireWorld,
  },
  {
    id: 'dinosaurs',
    name: 'Dinosaurs',
    role: 'Cave dweller',
    machine: 'a carved stone slab that glows',
    around: 'a fern forest, a volcano, long-necked dinosaurs',
    weight: LOUD,
    anchors: {
      'surface-0': '#110d08',
      'surface-1': '#17120c',
      'surface-2': '#1d1710',
      'surface-3': '#231c14',
      'text-primary': '#f7efe4',
      'text-secondary': '#d3c4ad',
      'text-muted': '#a99a83',
    },
    roles: { accent: '#ff9a2a', danger: '#f0583a', success: '#7fbf5a', warning: '#ffd04a', pro: '#b08fd8' },
    fills: { danger: 400 },
    glass: loudGlass('#110d08', 0.54),
    world: dinosaursWorld,
  },
  {
    id: 'storm-pirates',
    name: 'Storm Pirates',
    role: 'Captain',
    machine: 'a laptop on the chart table, a brass compass',
    around: 'a stormy sea, big waves, an enemy ship on the horizon',
    weight: LOUD,
    anchors: {
      'surface-0': '#070c11',
      'surface-1': '#0e141a',
      'surface-2': '#11181f',
      'surface-3': '#161e26',
      'text-primary': '#eaf2f6',
      'text-secondary': '#bccbd5',
      'text-muted': '#8e9eaa',
    },
    roles: { accent: '#ffd04d', danger: '#ff6058', success: '#5fd3a0', warning: '#ff9a4a', pro: '#a99bff' },
    glass: loudGlass('#070c11'),
    world: stormPiratesWorld,
  },
  {
    id: 'red-planet',
    name: 'Red Planet',
    role: 'Colonist',
    machine: 'a terminal in the habitat dome',
    around: 'red dunes, two moons, a rocket on the pad',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d060e',
      'surface-1': '#150a15',
      'surface-2': '#1b0e1b',
      'surface-3': '#231324',
      'text-primary': '#f6eaf0',
      'text-secondary': '#beb3ba',
      'text-muted': '#948a91',
    },
    roles: { accent: '#ff7a45', danger: '#ff5a4e', success: '#5fd3a0', warning: '#ffc247', pro: '#b48cff' },
    glass: loudGlass('#0d060e'),
    world: redPlanetWorld,
  },
  {
    id: 'wild-west',
    name: 'Wild West',
    role: 'Telegraph operator',
    machine: 'a telegraph key beside the laptop',
    around: 'a frontier town at night, a train on the trestle',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0912',
      'surface-1': '#13101d',
      'surface-2': '#1b1728',
      'surface-3': '#241e34',
      'text-primary': '#f4efe6',
      'text-secondary': '#cdc3b6',
      'text-muted': '#a09685',
    },
    roles: { accent: '#e8a23c', danger: '#e5543c', success: '#6fbf73', warning: '#f2c14e', pro: '#c9803a' },
    fills: { pro: 400 },
    gitLift: 0.04,
    glass: loudGlass('#0b0912'),
    world: wildWestWorld,
  },
  {
    id: 'pharaoh',
    name: "Pharaoh's Tomb",
    role: 'Tomb scribe',
    machine: 'a laptop on a stone altar, torches',
    around: 'pyramids under the moon, sand pouring',
    weight: LOUD,
    anchors: {
      'surface-0': '#09070f',
      'surface-1': '#110d1a',
      'surface-2': '#191325',
      'surface-3': '#231a33',
      'text-primary': '#f3eee6',
      'text-secondary': '#cdc5bb',
      'text-muted': '#9f968c',
    },
    roles: { accent: '#d9a441', danger: '#e0533f', success: '#3fb8a8', warning: '#e8b84a', pro: '#4a7bd8' },
    fills: { danger: 400 },
    glass: loudGlass('#09070f'),
    world: pharaohWorld,
  },
  {
    id: 'lightning-lab',
    name: 'Lightning Lab',
    role: 'Mad scientist',
    machine: 'a laptop wired to a big lever',
    around: 'lightning towers, bubbling flasks',
    weight: LOUD,
    anchors: {
      'surface-0': '#090c14',
      'surface-1': '#0f1320',
      'surface-2': '#131828',
      'surface-3': '#181e30',
      'text-primary': '#e9f1ff',
      'text-secondary': '#b1b8c4',
      'text-muted': '#8b919c',
    },
    roles: { accent: '#7fd4ff', danger: '#ff5c6c', success: '#4ade80', warning: '#ffc247', pro: '#b08cff' },
    glass: loudGlass('#090c14'),
    world: lightningLabWorld,
  },
  {
    id: 'ninja-moon',
    name: 'Ninja Moon',
    role: 'Ninja',
    machine: 'a laptop on a low table, a paper lantern',
    around: 'a castle under a red moon, ninjas on the rooftops',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0810',
      'surface-1': '#110e19',
      'surface-2': '#161320',
      'surface-3': '#1d1a2a',
      'text-primary': '#f1ecf2',
      'text-secondary': '#cbc5d0',
      'text-muted': '#9d97a8',
    },
    roles: { accent: '#d9344a', danger: '#ff6b6b', success: '#6fd3b0', warning: '#ffb35a', pro: '#a99bff' },
    fills: { pro: 400 },
    glass: loudGlass('#0a0810'),
    world: ninjaMoonWorld,
  },
  {
    id: 'colosseum',
    name: 'Colosseum',
    role: 'Scribe in the stands',
    machine: 'a laptop on a marble ledge',
    around: 'a torchlit arena, chariots racing',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c0907',
      'surface-1': '#16120e',
      'surface-2': '#1d1812',
      'surface-3': '#251e17',
      'text-primary': '#f4eee4',
      'text-secondary': '#cfc6b8',
      'text-muted': '#a39a8b',
    },
    roles: { accent: '#d9a93c', danger: '#e8505b', success: '#6cc08b', warning: '#ff9a3a', pro: '#a98be0' },
    fills: { danger: 400, pro: 400 },
    glass: loudGlass('#0c0907'),
    world: colosseumWorld,
  },
  {
    id: 'storm-chaser',
    name: 'Storm Chaser',
    role: 'Storm chaser',
    machine: 'a radar laptop in a pickup',
    around: 'the plains, a tornado',
    weight: LOUD,
    anchors: {
      'surface-0': '#070b12',
      'surface-1': '#0c121b',
      'surface-2': '#121a25',
      'surface-3': '#1a2431',
      'text-primary': '#eef3f7',
      'text-secondary': '#c3cbd3',
      'text-muted': '#9ca6b0',
    },
    roles: { accent: '#5fe0a0', danger: '#e5484d', success: '#3fbf6f', warning: '#e9b949', pro: '#7d5cf0' },
    gitLift: 0.04,
    glass: loudGlass('#070b12'),
    world: stormChaserWorld,
  },
  {
    id: 'robot-factory',
    name: 'Robot Factory',
    role: 'Line supervisor',
    machine: 'a control desk over the line',
    around: 'robot arms building robots',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0d12',
      'surface-1': '#10151c',
      'surface-2': '#151b23',
      'surface-3': '#1b222b',
      'text-primary': '#f0ece0',
      'text-secondary': '#b6b4ac',
      'text-muted': '#8f8e89',
    },
    roles: { accent: '#ffb21f', danger: '#ff5a4a', success: '#4ade80', warning: '#ff9a3a', pro: '#8fe8ff' },
    glass: loudGlass('#0a0d12'),
    world: robotFactoryWorld,
  },
  {
    id: 'grand-prix',
    name: 'Grand Prix',
    role: 'Race engineer',
    machine: "the pit wall's screens",
    around: 'cars streaking past under floodlights',
    weight: LOUD,
    anchors: {
      'surface-0': '#070913',
      'surface-1': '#0e121e',
      'surface-2': '#151b2b',
      'surface-3': '#1d2538',
      'text-primary': '#eef3fa',
      'text-secondary': '#c3cbd9',
      'text-muted': '#9ca6b8',
    },
    roles: { accent: '#5fd0ff', danger: '#e5484d', success: '#3fbf6f', warning: '#ffc15a', pro: '#7d5cf0' },
    gitLift: 0.08,
    glass: loudGlass('#070913'),
    world: grandPrixWorld,
  },
  {
    id: 'carnival',
    name: 'Carnival',
    role: 'Ride operator',
    machine: 'a control booth with levers',
    around: 'a ferris wheel, a roller coaster',
    weight: LOUD,
    anchors: {
      'surface-0': '#120c20',
      'surface-1': '#181028',
      'surface-2': '#1e1530',
      'surface-3': '#251a38',
      'text-primary': '#f6efff',
      'text-secondary': '#d0c3e2',
      'text-muted': '#a496ba',
    },
    roles: { accent: '#ff5f9e', danger: '#ef6a5e', success: '#58c98a', warning: '#f2b84a', pro: '#a98bff' },
    glass: loudGlass('#120c20'),
    world: carnivalWorld,
  },
  {
    id: 'arena-rock',
    name: 'Arena Rock',
    role: 'Sound engineer',
    machine: 'a laptop and a mixer on a flight case',
    around: 'a band on a huge stage, a crowd with their hands up',
    weight: LOUD,
    anchors: {
      'surface-0': '#07040f',
      'surface-1': '#0d0818',
      'surface-2': '#130c20',
      'surface-3': '#190f28',
      'text-primary': '#f7f1ff',
      'text-secondary': '#d0c6e0',
      'text-muted': '#a99dc0',
    },
    roles: { accent: '#ff3fa4', danger: '#e5484d', success: '#4cd98a', warning: '#ffb02e', pro: '#9a5cff' },
    glass: loudGlass('#07040f'),
    world: arenaRockWorld,
  },
  {
    id: 'underworld',
    name: 'Underworld',
    role: 'Keeper of the ledger',
    machine: 'a laptop on an old ledger desk, a soul-fire lantern',
    around: 'a glowing river, a ferryman, a great iron gate',
    weight: LOUD,
    anchors: {
      'surface-0': '#040b0d',
      'surface-1': '#081418',
      'surface-2': '#0d1c21',
      'surface-3': '#12242a',
      'text-primary': '#eefaf6',
      'text-secondary': '#c1d6d1',
      'text-muted': '#92aaa5',
    },
    roles: { accent: '#4ff0d0', danger: '#e5584d', success: '#5dd68a', warning: '#e0b84a', pro: '#7a8cff' },
    fills: { pro: 400 },
    glass: loudGlass('#040b0d', 0.5),
    world: underworldWorld,
  },
  {
    id: 'lunar-new-year',
    name: 'Lunar New Year',
    role: 'Festival host',
    machine: 'a red lacquer laptop on a low table',
    around: 'a lion dance, red lanterns, firecrackers',
    weight: LOUD,
    anchors: {
      'surface-0': '#140808',
      'surface-1': '#1d0f0d',
      'surface-2': '#251412',
      'surface-3': '#2d1918',
      'text-primary': '#fbf0e6',
      'text-secondary': '#c1b6ae',
      'text-muted': '#9a8f89',
    },
    roles: { accent: '#f2b134', danger: '#ff5a4d', success: '#7ccf7a', warning: '#ffb23f', pro: '#d98bc2' },
    gitLift: 0.04,
    glass: loudGlass('#140808'),
    world: lunarNewYearWorld,
  },
  {
    id: 'lost-temple',
    name: 'Lost Temple',
    role: 'Explorer',
    machine: 'a rugged laptop on a crate, a lantern',
    around: 'a carved stone face in the jungle, a rope bridge',
    weight: LOUD,
    anchors: {
      'surface-0': '#06100e',
      'surface-1': '#0c1816',
      'surface-2': '#101e1b',
      'surface-3': '#15251f',
      'text-primary': '#e9f3ee',
      'text-secondary': '#b0bab6',
      'text-muted': '#8a9490',
    },
    roles: { accent: '#3dffc0', danger: '#e8604a', success: '#7cd67a', warning: '#e8a030', pro: '#b48cff' },
    glass: loudGlass('#06100e'),
    world: lostTempleWorld,
  },
  {
    id: 'heist',
    name: 'The Heist',
    role: 'Safecracker',
    machine: 'a laptop tapped into the security panel',
    around: 'a vault door, a diamond behind laser beams',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0c12',
      'surface-1': '#0f1219',
      'surface-2': '#141822',
      'surface-3': '#1b1f2a',
      'text-primary': '#eef1f8',
      'text-secondary': '#c1c7d6',
      'text-muted': '#949cb0',
    },
    roles: { accent: '#ff3a4c', danger: '#ff5a2a', success: '#4cff9a', warning: '#ffcb4d', pro: '#69d6ff' },
    glass: loudGlass('#0a0c12'),
    world: heistWorld,
  },
  {
    id: 'halloween',
    name: 'Halloween',
    role: 'Witch',
    machine: 'a laptop beside a bubbling cauldron',
    around: "a haunted house under an orange moon, jack-o'-lanterns",
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0814',
      'surface-1': '#130c1c',
      'surface-2': '#191124',
      'surface-3': '#20172c',
      'text-primary': '#f3eef8',
      'text-secondary': '#cdc5d8',
      'text-muted': '#9d92ac',
    },
    roles: { accent: '#ff9a3c', danger: '#e84a5a', success: '#7be04f', warning: '#ffc15a', pro: '#b48cff' },
    glass: loudGlass('#0d0814', 0.52),
    world: halloweenWorld,
  },
  {
    id: 'deep-forge',
    name: 'Deep Forge',
    role: 'Smith',
    machine: 'an iron laptop by the anvil',
    around: 'a forge hall under the mountain, a trip-hammer, rivers of lava',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0705',
      'surface-1': '#150b08',
      'surface-2': '#1d110c',
      'surface-3': '#261710',
      'text-primary': '#fff1e3',
      'text-secondary': '#d9c4b0',
      'text-muted': '#ac9684',
    },
    roles: { accent: '#ff8a2a', danger: '#ff5040', success: '#6fd08c', warning: '#ffcf6a', pro: '#b48cff' },
    glass: loudGlass('#0d0705'),
    world: deepForgeWorld,
  },
  {
    id: 'summit',
    name: 'Summit',
    role: 'Mountaineer',
    machine: 'a frosted laptop in the tent door',
    around: 'a knife-edge peak above the clouds, headlamps on the face',
    weight: LOUD,
    anchors: {
      'surface-0': '#070a12',
      'surface-1': '#0d1220',
      'surface-2': '#131a2b',
      'surface-3': '#1a2338',
      'text-primary': '#eef4ff',
      'text-secondary': '#c0c9dc',
      'text-muted': '#8f9bb5',
    },
    roles: { accent: '#6cb8ff', danger: '#ff5e5e', success: '#5fe39a', warning: '#ffb84d', pro: '#b48cff' },
    gitLift: 0.04,
    glass: loudGlass('#070a12', 0.52),
    world: summitWorld,
  },
  {
    id: 'tape-84',
    name: "Mag Tape '84",
    role: 'Machine-room engineer',
    machine: 'a CRT, tape reels',
    around: 'rows of cabinets blinking their lights',
    weight: 1,
    shouts: true,
    anchors: {
      'surface-0': '#0b0f17',
      'surface-1': '#10151f',
      'surface-2': '#151b27',
      'surface-3': '#1a212f',
      'text-primary': '#f5eedd',
      'text-secondary': '#cbbf9f',
      'text-muted': '#9d927a',
    },
    roles: { accent: '#ffb000', danger: '#ff6b5e', success: '#6fcf7f', warning: '#ff9e3d', pro: '#9fa8ff' },
    glass: { blur: 16, tint: '#0b0f17', opacity: 0.5 },
    world: tape84World,
  },
  {
    id: 'deep',
    name: 'The Deep',
    role: 'Diver',
    machine: 'a control panel inside a diving bell',
    around: 'glowing fish past the porthole',
    weight: 1,
    anchors: {
      'surface-0': '#071521',
      'surface-1': '#0b1c2a',
      'surface-2': '#0f2333',
      'surface-3': '#112636',
      'text-primary': '#e8f5f8',
      'text-secondary': '#b4d2d9',
      'text-muted': '#86a8b2',
    },
    roles: { accent: '#2fc6c6', danger: '#ef6f6c', success: '#5fd39a', warning: '#e9b949', pro: '#8f9bff' },
    fills: { pro: 400 },
    gitLift: 0.12,
    glass: { blur: 16, tint: '#071521', opacity: 0.48 },
    world: deepWorld,
  },
  {
    id: 'clockwork',
    name: 'Clockwork',
    role: 'Mechanic',
    machine: 'a mechanical typewriter geared to the wall',
    around: 'a brass workshop',
    weight: 1,
    anchors: {
      'surface-0': '#17120d',
      'surface-1': '#1d1711',
      'surface-2': '#231c15',
      'surface-3': '#29211a',
      'text-primary': '#f5ede0',
      'text-secondary': '#d0c1a8',
      'text-muted': '#a5967f',
    },
    roles: { accent: '#c9a04e', danger: '#cf5b45', success: '#84ad62', warning: '#e08a3c', pro: '#a487c8' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.08,
    glass: { blur: 16, tint: '#17120d', opacity: 0.5 },
    world: clockworkWorld,
  },
  {
    id: 'polar-night',
    name: 'Polar Night',
    role: 'Polar researcher',
    machine: 'a laptop in an ice station',
    around: 'a glacier, the northern lights, a polar bear',
    weight: 1,
    anchors: {
      'surface-0': '#050b12',
      'surface-1': '#0b141d',
      'surface-2': '#101a25',
      'surface-3': '#16212e',
      'text-primary': '#eaf4fa',
      'text-secondary': '#b8c5cf',
      'text-muted': '#8999a5',
    },
    roles: { accent: '#5ee0b8', danger: '#ff6b6b', success: '#5fe0a0', warning: '#ffc857', pro: '#a88bff' },
    glass: { blur: 16, tint: '#050b12', opacity: 0.5 },
    world: polarNightWorld,
  },
  {
    id: 'sky-whales',
    name: 'Sky Whales',
    role: 'Dreamer',
    machine: 'a laptop on a rooftop crate',
    around: 'whales swimming through the clouds',
    weight: 1,
    anchors: {
      'surface-0': '#080c1e',
      'surface-1': '#0c1228',
      'surface-2': '#111832',
      'surface-3': '#161e3a',
      'text-primary': '#eef2ff',
      'text-secondary': '#c0c9e6',
      'text-muted': '#929dc2',
    },
    roles: { accent: '#8fb4ff', danger: '#ef7a8a', success: '#6fd3a6', warning: '#f0b95a', pro: '#b59cff' },
    glass: { blur: 16, tint: '#080c1e', opacity: 0.5 },
    world: skyWhalesWorld,
  },
  {
    id: 'void',
    name: 'The Void',
    role: 'Just the hands',
    machine: 'a floating keyboard, one cursor',
    around: 'nothing',
    weight: 0.35,
    anchors: {
      'surface-0': '#08080a',
      'surface-1': '#121215',
      'surface-2': '#121216',
      'surface-3': '#1c1c21',
      'text-primary': '#efeff2',
      'text-secondary': '#c4c4cc',
      'text-muted': '#93939d',
    },
    roles: { accent: '#b8b8ff', danger: '#e06666', success: '#6fbf8a', warning: '#d9b25a', pro: '#a990e6' },
    fills: { danger: 400, pro: 400 },
    glass: { blur: 12, tint: '#08080a', opacity: 0.4 },
    world: voidWorld,
  },
]

/** A name as a key: no accents, no case, letters and digits only ("The Deep" and "the-deep" are both "thedeep"). */
export function keyOf(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function universeOf(id: string | null | undefined): Universe | undefined {
  return UNIVERSES.find(universe => universe.id === id)
}

/** A universe by what the person typed: its id or name, whole, else the first that starts with it. */
export function universeNamed(text: string): Universe | undefined {
  const key = keyOf(text)

  if (key === '') {
    return undefined
  }

  return (
    UNIVERSES.find(universe => keyOf(universe.id) === key || keyOf(universe.name) === key) ??
    UNIVERSES.find(universe => keyOf(universe.name).startsWith(key))
  )
}

/** A universe by weight, never one in `avoid` (where the last session landed, the portals already open). `roll` is in [0, 1). */
export function pickUniverse(avoid: readonly string[], roll: number): Universe {
  const pool = UNIVERSES.filter(universe => !avoid.includes(universe.id))
  let left = roll * pool.reduce((sum, universe) => sum + universe.weight, 0)

  for (const universe of pool) {
    left -= universe.weight

    if (left < 0) {
      return universe
    }
  }

  return pool[pool.length - 1] ?? UNIVERSES[0]!
}

/** The line a session shows when it lands somewhere. */
export function arrival(universe: Universe): string {
  const opening =
    universe.id === 'void'
      ? 'Anomaly! You fell into'
      : universe.id === 'collapse'
        ? 'Reality is breaking! You fell into the'
        : 'You just fell into the universe of'

  return `${opening} ${universe.name}. Claude here: ${universe.role.toLowerCase()} · ${universe.machine} · ${universe.around}.`
}

// The design system's own git colors for dark mode, as makeColors hands them out when a look names none.
const STOCK_GIT = {
  added: '#32d74b',
  removed: '#ff2c56',
  modified: '#ffd014',
  merged: '#b796ff',
  closed: '#ff6159',
  conflicting: '#fa832e',
  draft: '#a6a6a6',
} as const

function lift(hex: string, by: number): string {
  return (
    '#' +
    [1, 3, 5]
      .map(at => {
        const value = parseInt(hex.slice(at, at + 2), 16)

        return Math.round(value + (255 - value) * by)
          .toString(16)
          .padStart(2, '0')
      })
      .join('')
  )
}

function liftedGit(by: number): Record<keyof typeof STOCK_GIT, string> {
  return Object.fromEntries(Object.entries(STOCK_GIT).map(([state, hex]) => [state, lift(hex, by)])) as Record<
    keyof typeof STOCK_GIT,
    string
  >
}

const looks = new Map<string, { colors: NonNullable<ThemeSetArgs['colors']>; problems: string[] }>()

/** A universe's palette, built once: its colors and the contrast notes `makeColors` raised. */
export function paletteOf(universe: Universe): { colors: NonNullable<ThemeSetArgs['colors']>; problems: string[] } {
  const ready = looks.get(universe.id)

  if (ready !== undefined) {
    return ready
  }

  const { roles, fills, gitLift } = universe
  const { theme, problems } = makeColors({
    label: `Multiverse: ${universe.name}`,
    id: `multiverse-${universe.id}`,
    only: 'dark',
    roles: {
      ...roles,
      danger: { seed: roles.danger, ...(fills?.danger !== undefined && { fillShade: fills.danger }) },
      pro: { seed: roles.pro, ...(fills?.pro !== undefined && { fillShade: fills.pro }) },
    },
    dark: {
      gray: { anchors: universe.anchors },
      ...(gitLift !== undefined && { git: liftedGit(gitLift) }),
    },
  })
  const look = { colors: theme, problems }

  looks.set(universe.id, look)

  return look
}

// A scene's name is 1 to 64 letters, digits, `_` or `-`: our own prefix, so no other mod's hook takes it for its own.
const SCENE_PREFIX = 'multiverse-'

/** The scene name a universe's backdrop goes by. */
export function sceneName(universe: Universe): string {
  return `${SCENE_PREFIX}${universe.id}`
}

export function universeOfScene(scene: string): Universe | undefined {
  return scene.startsWith(SCENE_PREFIX) ? universeOf(scene.slice(SCENE_PREFIX.length)) : undefined
}

const worlds = new Map<string, World>()

function worldOf(universe: Universe): World {
  const ready = worlds.get(universe.id)

  if (ready !== undefined) {
    return ready
  }

  const world = universe.world()

  worlds.set(universe.id, world)

  return world
}

function classesOf(activity: Activity, ultra: boolean, helpers: number): string {
  return `st-${activity}${ultra ? ' ultra' : ''}${helpers > 0 ? ' helper' : ''}`
}

const FONT = 'font-family="system-ui,-apple-system,Segoe UI,sans-serif"'

function escaped(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** The running subagents' universes, oldest first, as many as there are portals. */
function helpersOf(desk: Desk): Universe[] {
  return desk.helpers
    .slice(0, SLOTS.length)
    .map(id => universeOf(id))
    .filter((place): place is Universe => place !== undefined)
}

// Up to three portals along the top-right, the oldest rightmost: each at half size, a 190×200 window on screen.
const SLOTS: readonly (readonly [number, number])[] = [
  [1320, 40],
  [1095, 40],
  [870, 40],
]
const PORTAL_SCALE = 0.5
// The window inside a portal, in the desk box's own coordinates.
const WINDOW = { x: 60, y: 70, width: 380, height: 400 }
// Where the small Claude leaves from: the critter's head, in the picture, with the nook at its corner.
const HEAD = { x: CORNER.x + 150, y: CORNER.y + 228 }

// A portal's ring always swirls. A newborn's portal opens as the small Claude reaches it, the helper drops in and
// the ring flashes once.
const PORTAL_STYLE =
  '.mvp-sw{stroke-dasharray:40 26;animation:mvp-sw 7s linear infinite}' +
  '@keyframes mvp-sw{to{stroke-dashoffset:-660}}' +
  '.mvp-open{transform-box:fill-box;transform-origin:center;animation:mvp-open .8s cubic-bezier(.2,1.5,.4,1) .9s both}' +
  '@keyframes mvp-open{from{opacity:0;transform:scale(.05)}to{opacity:1;transform:scale(1)}}' +
  '.mvp-drop{animation:mvp-drop .7s cubic-bezier(.3,1.4,.5,1) 1.5s both}' +
  '.mvb-drop{animation:mvp-drop .7s cubic-bezier(.3,1.4,.5,1) both}' +
  '@keyframes mvp-drop{from{opacity:0;transform:translateY(-140px)}to{opacity:1;transform:translateY(0)}}' +
  '.mvp-flash{transform-box:fill-box;transform-origin:center;opacity:0;animation:mvp-flash 1s ease-out 1.8s both}' +
  '@keyframes mvp-flash{0%{opacity:0;transform:scale(.8)}8%{opacity:.9;transform:scale(.82)}100%{opacity:0;transform:scale(1.35)}}'

/** A subagent's Claude, from another universe, typing along in portal `slot`. */
function portal(helper: Universe, slot: number, isArriving: boolean): string {
  const world = worldOf(helper)
  const [x, y] = SLOTS[slot]!
  const ring = world.rig.light.work
  const clip = `mvp-c${slot}`
  const box = `x="${WINDOW.x}" y="${WINDOW.y}" width="${WINDOW.width}" height="${WINDOW.height}" rx="48"`
  const desk = deskScene(world.rig, { activity: 'responding', clutter: 0, ultra: false }, `h${slot}`)

  return (
    `<g class="mv-r"><g class="mv-t"><g transform="translate(${x} ${y}) scale(${PORTAL_SCALE})">` +
    `<g${isArriving ? ' class="mvp-open"' : ''}>` +
    `<defs><clipPath id="${clip}"><rect ${box}/></clipPath></defs>` +
    `<rect x="${WINDOW.x - 18}" y="${WINDOW.y - 18}" width="${WINDOW.width + 36}" height="${WINDOW.height + 36}" rx="64" ` +
    `class="mvp-sw" fill="none" stroke="${ring}" stroke-opacity=".5" stroke-width="6"/>` +
    `<rect ${box} fill="${helper.anchors['surface-0']}" fill-opacity=".92" stroke="${ring}" stroke-opacity=".7" stroke-width="4"/>` +
    `<g clip-path="url(#${clip})">${isArriving ? `<g class="mvp-drop">${desk}</g>` : desk}</g>` +
    `<text x="${WINDOW.x + WINDOW.width / 2}" y="${WINDOW.y + WINDOW.height + 62}" text-anchor="middle" font-size="34" ` +
    `font-weight="700" letter-spacing="3" fill="${ring}" fill-opacity=".85" ${FONT}>${escaped(helper.name.toUpperCase())}</text>` +
    '</g>' +
    (isArriving
      ? `<rect ${box} class="mvp-flash" fill="none" stroke="${world.rig.light.bright}" stroke-width="10"/>`
      : '') +
    '</g></g></g>'
  )
}

// The nook's bottom-right corner, which a narrow strip shrinks the nook toward by `--mv-f`.
const NOOK_END = { x: 1600, y: 1000 }

/**
 * Where the small Claude flies to reach portal `slot`, from the head, for the desk's `spawn-fly`. The flight runs
 * inside the nook, so where the nook is shrunk by `--mv-f` its head sits nearer the corner and each step is shorter:
 * the target is measured from the corner, divided by `--mv-f`, then taken back to the head.
 */
function flightTo(slot: number): string {
  const [x, y] = SLOTS[slot]!
  const toX = x + (WINDOW.x + WINDOW.width / 2) * PORTAL_SCALE - NOOK_END.x
  const toY = y + (WINDOW.y + WINDOW.height / 2) * PORTAL_SCALE - NOOK_END.y

  return (
    `--fx:calc(${Math.round(toX)}px / var(--mv-f, 1) + ${NOOK_END.x - HEAD.x}px);` +
    `--fy:calc(${Math.round(toY)}px / var(--mv-f, 1) + ${NOOK_END.y - HEAD.y}px)`
  )
}

// The landing: a portal swirls open in the middle with the universe's name, then the picture is left alone.
const INTRO_STYLE =
  '.mvi-all{opacity:0;animation:mvi-all 5s ease-out both}' +
  '@keyframes mvi-all{0%{opacity:0}10%{opacity:1}72%{opacity:1}100%{opacity:0}}' +
  '.mvi-z{animation:mvi-z 5s cubic-bezier(.2,.8,.3,1) both}' +
  '@keyframes mvi-z{0%{transform:scale(.5)}14%{transform:scale(1)}78%{transform:scale(1.05)}100%{transform:scale(1.7)}}' +
  '.mvi-r1{animation:mv-spin 9s linear infinite}' +
  '.mvi-r2{animation:mv-spin-back 13s linear infinite}' +
  '.mvi-r3{animation:mv-spin 21s linear infinite}' +
  '.mvi-t{opacity:0;animation:mvi-t 5s ease-out both}' +
  '@keyframes mvi-t{0%,8%{opacity:0;transform:translateY(24px)}22%,76%{opacity:1;transform:translateY(0)}100%{opacity:0}}'

function intro(universe: Universe): string {
  const world = worldOf(universe)
  const glow = world.rig.light.bright
  const accent = universe.roles.accent
  // Long names shrink so the title fits a narrow window, which crops the picture's sides.
  const size = Math.min(112, Math.round(1050 / (universe.name.length * 0.66)))
  const baseline = 440 + Math.round(size * 0.35)

  return (
    '<g class="mvi-all" pointer-events="none">' +
    '<defs><radialGradient id="mvi-v"><stop offset="0" stop-color="#000" stop-opacity=".72"/>' +
    '<stop offset=".55" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    `<radialGradient id="mvi-c"><stop offset="0" stop-color="${glow}" stop-opacity=".5"/>` +
    `<stop offset=".4" stop-color="${accent}" stop-opacity=".18"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>` +
    '<ellipse cx="800" cy="440" rx="760" ry="380" fill="url(#mvi-v)"/>' +
    '<g transform="translate(800 440)"><g class="mvi-z"><circle r="300" fill="url(#mvi-c)"/>' +
    `<g fill="none" stroke="${accent}">` +
    '<g class="mvi-r1"><circle r="230" stroke-width="5" stroke-dasharray="120 40 20 40" stroke-opacity=".7"/></g>' +
    '<g class="mvi-r2"><circle r="270" stroke-width="3" stroke-dasharray="6 18" stroke-opacity=".6"/></g>' +
    `<g class="mvi-r3"><circle r="190" stroke-width="2" stroke="${glow}" stroke-dasharray="300 80" stroke-opacity=".55"/></g>` +
    '</g></g></g>' +
    `<g class="mvi-t" ${FONT} text-anchor="middle">` +
    `<text x="800" y="330" font-size="26" letter-spacing="12" fill="${glow}" fill-opacity=".8">` +
    `UNIVERSE ${UNIVERSES.indexOf(universe) + 1}/${UNIVERSES.length}</text>` +
    `<text x="800" y="${baseline}" font-size="${size}" font-weight="800" letter-spacing="4" fill="#ffffff" ` +
    `stroke="${accent}" stroke-width="2" stroke-opacity=".6" paint-order="stroke">${escaped(universe.name.toUpperCase())}</text>` +
    `<text x="800" y="${baseline + 70}" font-size="34" letter-spacing="8" fill="${accent}">${escaped(universe.role.toUpperCase())}</text>` +
    '</g></g>'
  )
}

function keyOfDesk(universe: Universe, desk: Desk, helpers: readonly Universe[], ultra: boolean, insets?: Insets): string {
  return [
    universe.id,
    desk.activity,
    desk.clutter,
    helpers.map(helper => helper.id).join(','),
    desk.arriving ?? '',
    desk.intro,
    ultra,
    insets === undefined ? '' : `${insets.left},${insets.right}`,
  ].join('|')
}

const scenes = new Map<string, string>()

/**
 * The backdrop document for a universe and a desk, built the first time it is asked for. `insets` are the side
 * panels the person said are open: the picture fits the strip between them.
 */
export function sceneOf(universe: Universe, desk: Desk, ultra: boolean, insets?: Insets): string {
  const helpers = helpersOf(desk)
  const key = keyOfDesk(universe, desk, helpers, ultra, insets)
  const ready = scenes.get(key)

  if (ready !== undefined) {
    return ready
  }

  const world = worldOf(universe)
  const slot = helpers.findIndex(helper => helper.id === desk.arriving)
  const spawning = slot >= 0
  const main = deskScene(world.rig, { activity: desk.activity, clutter: desk.clutter, ultra, spawning }, 'm')
  const source = frame({
    classes: classesOf(desk.activity, ultra, helpers.length),
    style: RIG_STYLE + (helpers.length > 0 ? PORTAL_STYLE : '') + (desk.intro ? INTRO_STYLE : '') + world.style,
    scenery: world.scenery,
    nook: world.nook + (spawning ? `<g style="${flightTo(slot)}">${main}</g>` : main) + (world.front ?? ''),
    overlay:
      helpers.map((helper, index) => portal(helper, index, helper.id === desk.arriving)).join('') +
      (desk.intro ? intro(universe) : ''),
  }, insets)

  scenes.set(key, source)

  return source
}

// Each helper in the band stands this far left of the one before it.
const BAND_STEP = 264

const bands = new Map<string, string>()

/** The tiny Claude for the band above the prompt: the same desk and moves, the critter in its own color. */
export function bandOf(universe: Universe, desk: Desk, ultra: boolean): { source: string; width: number; height: number } {
  const helpers = helpersOf(desk)
  const height = 52
  // The desk's box from just left of the far arm to past the cup, and from above the tallest hat to the floor;
  // each helper widens it to the left.
  const viewX = 24 - BAND_STEP * helpers.length
  const viewWidth = 436 + BAND_STEP * helpers.length
  const viewHeight = 310
  const width = Math.round((height * viewWidth) / viewHeight)
  const key = keyOfDesk(universe, { ...desk, intro: false }, helpers, ultra)
  const ready = bands.get(key)

  if (ready !== undefined) {
    return { source: ready, width, height }
  }

  const world = worldOf(universe)
  const others = helpers
    .map((helper, index) => {
      const inner = deskScene(worldOf(helper).rig, { activity: 'responding', clutter: 0, ultra: false }, `bh${index}`, true)

      return (
        `<g transform="translate(${-250 - BAND_STEP * index} 40) scale(.8)">` +
        (helper.id === desk.arriving ? `<g class="mvb-drop">${inner}</g>` : inner) +
        '</g>'
      )
    })
    .join('')
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} 150 ${viewWidth} ${viewHeight}" ` +
    `width="${width}" height="${height}" class="${classesOf(desk.activity, ultra, helpers.length)}">` +
    `<style>${COMMON}${RIG_STYLE}${helpers.length > 0 ? PORTAL_STYLE : ''}${world.style}</style>${others}` +
    `${deskScene(world.rig, { activity: desk.activity, clutter: desk.clutter, ultra }, 'b', true)}</svg>`

  bands.set(key, source)

  return { source, width, height }
}

/** What the band says Claude is doing. */
export const DOING: Record<Activity, string> = {
  idle: 'is waiting for you',
  thinking: 'is thinking',
  responding: 'is writing',
  tool: 'is using a tool',
  read: 'is reading files',
  run: 'is running a command',
  web: 'is searching the web',
  error: 'hit an error',
  done: 'is done',
}
