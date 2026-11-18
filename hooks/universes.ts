import type { ThemeBackdropGlass, ThemeSetArgs } from 'claude-code'

import type { Act, Desk } from '../types'
import { makeColors } from './make-colors.js'
import { alienJungleWorld } from './scenes/alien-jungle'
import { arenaRockWorld } from './scenes/arena-rock'
import { armoredGeniusWorld } from './scenes/armored-genius'
import { ashfallWorld } from './scenes/ashfall'
import { asteroidDrillWorld } from './scenes/asteroid-drill'
import { autumnRoadWorld } from './scenes/autumn-road'
import { backroomsWorld } from './scenes/backrooms'
import { blackHoleWorld } from './scenes/black-hole'
import { blueprintWorld } from './scenes/blueprint'
import { canyonWindWorld } from './scenes/canyon-wind'
import { carnivalWorld } from './scenes/carnival'
import { carrierDeckWorld } from './scenes/carrier-deck'
import { casinoSpyWorld } from './scenes/casino-spy'
import { castleSiegeWorld } from './scenes/castle-siege'
import { cherryBlossomWorld } from './scenes/cherry-blossom'
import { christmasEveWorld } from './scenes/christmas-eve'
import { clayTownWorld } from './scenes/clay-town'
import { clockworkWorld } from './scenes/clockwork'
import { collapseWorld } from './scenes/collapse'
import { colosseumWorld } from './scenes/colosseum'
import { comicCityWorld } from './scenes/comic-city'
import { coralReefWorld } from './scenes/coral-reef'
import { cosmicTitanWorld } from './scenes/cosmic-titan'
import { crystalCaveWorld } from './scenes/crystal-cave'
import { dataStreamWorld } from './scenes/data-stream'
import { deepWorld } from './scenes/deep'
import { deepForgeWorld } from './scenes/deep-forge'
import { derelictWorld } from './scenes/derelict'
import { dinosaursWorld } from './scenes/dinosaurs'
import { dragonPassWorld } from './scenes/dragon-pass'
import { dragonfireWorld } from './scenes/dragonfire'
import { dreamscapeWorld } from './scenes/dreamscape'
import { drownedCityWorld } from './scenes/drowned-city'
import { duneWalkerWorld } from './scenes/dune-walker'
import { examSeasonWorld } from './scenes/exam-season'
import { falloutDawnWorld } from './scenes/fallout-dawn'
import { frozenLakeWorld } from './scenes/frozen-lake'
import { galacticWarWorld } from './scenes/galactic-war'
import { giantTreeWorld } from './scenes/giant-tree'
import { glacierCrackWorld } from './scenes/glacier-crack'
import { goldenHourWorld } from './scenes/golden-hour'
import { grandPrixWorld } from './scenes/grand-prix'
import { halloweenWorld } from './scenes/halloween'
import { heistWorld } from './scenes/heist'
import { henchbotLairWorld } from './scenes/henchbot-lair'
import { hologramCityWorld } from './scenes/hologram-city'
import { infiniteStairsWorld } from './scenes/infinite-stairs'
import { inkWashWorld } from './scenes/ink-wash'
import { jazzNightWorld } from './scenes/jazz-night'
import { jungleGameWorld } from './scenes/jungle-game'
import { kaijuWorld } from './scenes/kaiju'
import { COMMON, CORNER, frame } from './scenes/kit'
import type { Insets } from './scenes/kit'
import { libraryEndlessWorld } from './scenes/library-endless'
import { lighthouseCoastWorld } from './scenes/lighthouse-coast'
import { lightningLabWorld } from './scenes/lightning-lab'
import { liminalPoolWorld } from './scenes/liminal-pool'
import { lostTempleWorld } from './scenes/lost-temple'
import { lowPolyWorld } from './scenes/low-poly'
import { lunarNewYearWorld } from './scenes/lunar-new-year'
import { marigoldBridgeWorld } from './scenes/marigold-bridge'
import { memoryLaneWorld } from './scenes/memory-lane'
import { mirrorMazeWorld } from './scenes/mirror-maze'
import { mondayRuinsWorld } from './scenes/monday-ruins'
import { monsoonWorld } from './scenes/monsoon'
import { moonTrekWorld } from './scenes/moon-trek'
import { mothershipWorld } from './scenes/mothership'
import { museumNightWorld } from './scenes/museum-night'
import { neonWorld } from './scenes/neon-2099'
import { nightKitchenWorld } from './scenes/night-kitchen'
import { nightVigilanteWorld } from './scenes/night-vigilante'
import { ninjaMoonWorld } from './scenes/ninja-moon'
import { noirWorld } from './scenes/noir'
import { oceanLinerWorld } from './scenes/ocean-liner'
import { oldQuarterWorld } from './scenes/old-quarter'
import { orbitalRingWorld } from './scenes/orbital-ring'
import { originWorld } from './scenes/origin'
import { paperWorldWorld } from './scenes/paper-world'
import { pharaohWorld } from './scenes/pharaoh'
import { pixelQuestWorld } from './scenes/pixel-quest'
import { polarNightWorld } from './scenes/polar-night'
import { redPlanetWorld } from './scenes/red-planet'
import { riceTerraceWorld } from './scenes/rice-terrace'
import { BASE, RIG_STYLE, deskScene } from './scenes/rig'
import { robotFactoryWorld } from './scenes/robot-factory'
import { rushHourWorld } from './scenes/rush-hour'
import { rustBeltWorld } from './scenes/rust-belt'
import { saltFlatsWorld } from './scenes/salt-flats'
import { savannaDawnWorld } from './scenes/savanna-dawn'
import { sharkBayWorld } from './scenes/shark-bay'
import { shrunkWorld } from './scenes/shrunk'
import { skyIslandsWorld } from './scenes/sky-islands'
import { skyTempleWorld } from './scenes/sky-temple'
import { skyWhalesWorld } from './scenes/sky-whales'
import { sorcererSanctumWorld } from './scenes/sorcerer-sanctum'
import { spiritForestWorld } from './scenes/spirit-forest'
import { stainedGlassWorld } from './scenes/stained-glass'
import { stormChaserWorld } from './scenes/storm-chaser'
import { stormPiratesWorld } from './scenes/storm-pirates'
import { subwayNightWorld } from './scenes/subway-night'
import { summitWorld } from './scenes/summit'
import { syntheticDawnWorld } from './scenes/synthetic-dawn'
import { synthwaveHighwayWorld } from './scenes/synthwave-highway'
import { tape84World } from './scenes/tape-84'
import { thunderRealmWorld } from './scenes/thunder-realm'
import { titanStepsWorld } from './scenes/titan-steps'
import { toyBoxWorld } from './scenes/toy-box'
import { trenchLineWorld } from './scenes/trench-line'
import { undeadWorld } from './scenes/undead'
import { underworldWorld } from './scenes/underworld'
import { verdantHollowWorld } from './scenes/verdant-hollow'
import { voidWorld } from './scenes/void'
import { voidDriftWorld } from './scenes/void-drift'
import { wavePlanetWorld } from './scenes/wave-planet'
import { wayfinderSeaWorld } from './scenes/wayfinder-sea'
import { wildWestWorld } from './scenes/wild-west'
import { wizardAcademyWorld } from './scenes/wizard-academy'
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
    id: 'monday-ruins',
    name: 'Monday Ruins',
    role: 'Monday office worker',
    machine: 'a cracked, taped monitor on a desk propped on cinder blocks',
    around: 'a burning city, smoke columns, a skyscraper about to fall',
    weight: LOUD,
    anchors: {
      'surface-0': '#120d0b',
      'surface-1': '#18120f',
      'surface-2': '#1e1713',
      'surface-3': '#241c18',
      'text-primary': '#f8f0e6',
      'text-secondary': '#d2c3b2',
      'text-muted': '#a89786',
    },
    roles: { accent: '#ff8a3d', danger: '#e8505b', success: '#7fcf6a', warning: '#f0c04a', pro: '#a98be0' },
    fills: { danger: 400, pro: 400 },
    glass: loudGlass('#120d0b'),
    world: mondayRuinsWorld,
  },
  {
    id: 'ashfall',
    name: 'Ashfall',
    role: 'Volcanologist',
    machine: 'a rugged seismograph laptop and a drum recorder at a ridge field station',
    around: 'an erupting volcano, lava rivers, ash falling like grey snow',
    weight: LOUD,
    anchors: {
      'surface-0': '#171010',
      'surface-1': '#1d1515',
      'surface-2': '#221818',
      'surface-3': '#271d1d',
      'text-primary': '#faece9',
      'text-secondary': '#d6c1bc',
      'text-muted': '#ab958f',
    },
    roles: { accent: '#ff4d2e', danger: '#e8455a', success: '#7fcf7a', warning: '#f5b54a', pro: '#b48cff' },
    glass: loudGlass('#171010'),
    world: ashfallWorld,
  },
  {
    id: 'rust-belt',
    name: 'Rust Belt',
    role: 'Scavenger',
    machine: 'a robot-head monitor on a car battery',
    around: 'a machine graveyard at dusk, a fallen giant robot',
    weight: LOUD,
    anchors: {
      'surface-0': '#110c09',
      'surface-1': '#16110d',
      'surface-2': '#1c1612',
      'surface-3': '#221b16',
      'text-primary': '#f8f0e8',
      'text-secondary': '#cfc1b4',
      'text-muted': '#a69689',
    },
    roles: { accent: '#c8693a', danger: '#e05a48', success: '#4fb39c', warning: '#e0a43c', pro: '#a088e0' },
    fills: { danger: 400 },
    glass: loudGlass('#110c09'),
    world: rustBeltWorld,
  },
  {
    id: 'fallout-dawn',
    name: 'Fallout Dawn',
    role: 'Wasteland watchman',
    machine: 'a field laptop and a radiation counter on a drum desk',
    around: 'cooling towers at a toxic dawn, a dead city',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c1009',
      'surface-1': '#12170e',
      'surface-2': '#181e13',
      'surface-3': '#1f2619',
      'text-primary': '#eaf2dc',
      'text-secondary': '#b9c0ae',
      'text-muted': '#919888',
    },
    roles: { accent: '#b6e33a', danger: '#ff6a4a', success: '#5fd38a', warning: '#f2b33d', pro: '#a98bff' },
    gitLift: 0.06,
    glass: loudGlass('#0c1009'),
    world: falloutDawnWorld,
  },
  {
    id: 'drowned-city',
    name: 'Drowned City',
    role: 'Flood survivor',
    machine: 'a laptop in a hard case on a raft',
    around: 'a drowned city, skyscrapers in black water',
    weight: LOUD,
    anchors: {
      'surface-0': '#071116',
      'surface-1': '#0b171d',
      'surface-2': '#101e25',
      'surface-3': '#14242c',
      'text-primary': '#e6f3f6',
      'text-secondary': '#b7cdd4',
      'text-muted': '#88a3ac',
    },
    roles: { accent: '#5fb3c9', danger: '#ef6b62', success: '#5fd3a0', warning: '#e9b949', pro: '#9d8fff' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.06,
    glass: loudGlass('#071116'),
    world: drownedCityWorld,
  },
  {
    id: 'trench-line',
    name: 'Trench Line',
    role: 'Field radio operator',
    machine: 'a field radio and a telegraph key in a dugout',
    around: 'a rain-soaked trench, shattered trees, wire, parachute flares',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c0d0a',
      'surface-1': '#121310',
      'surface-2': '#181914',
      'surface-3': '#21221c',
      'text-primary': '#ecebe2',
      'text-secondary': '#bbbab0',
      'text-muted': '#919086',
    },
    roles: { accent: '#d9c27a', danger: '#e5604c', success: '#8fbf6a', warning: '#e8a24a', pro: '#a99be0' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.04,
    glass: loudGlass('#0c0d0a'),
    world: trenchLineWorld,
  },
  {
    id: 'dune-walker',
    name: 'Dune Walker',
    role: 'Caravan scout',
    machine: 'a rugged laptop on a camp table, a brass teapot',
    around: 'endless dunes at sunset, a camel caravan, a haboob',
    weight: LOUD,
    anchors: {
      'surface-0': '#110b07',
      'surface-1': '#18110b',
      'surface-2': '#1f160f',
      'surface-3': '#281d14',
      'text-primary': '#fbf2e2',
      'text-secondary': '#d6c9b4',
      'text-muted': '#ab9d88',
    },
    roles: { accent: '#e8b04a', danger: '#e5543c', success: '#6fbf73', warning: '#ff9a3a', pro: '#a98be0' },
    glass: loudGlass('#110b07'),
    world: duneWalkerWorld,
  },
  {
    id: 'salt-flats',
    name: 'Salt Flats',
    role: 'Timing officer',
    machine: 'a timing console under a canopy',
    around: 'a mirror salt flat, a rocket car',
    weight: LOUD,
    anchors: {
      'surface-0': '#070b13',
      'surface-1': '#0c121c',
      'surface-2': '#121a26',
      'surface-3': '#192333',
      'text-primary': '#edf2f7',
      'text-secondary': '#c2cbd5',
      'text-muted': '#9aa5b1',
    },
    roles: { accent: '#3e7cb1', danger: '#e5484d', success: '#3fbf6f', warning: '#e9b949', pro: '#7d5cf0' },
    gitLift: 0.04,
    glass: loudGlass('#070b13'),
    world: saltFlatsWorld,
  },
  {
    id: 'monsoon',
    name: 'Monsoon',
    role: 'Jungle ranger',
    machine: 'a laptop in a dry bag under a tarp',
    around: 'a monsoon downpour, a swollen river, a red dirt road',
    weight: LOUD,
    anchors: {
      'surface-0': '#07100c',
      'surface-1': '#0c1712',
      'surface-2': '#111e18',
      'surface-3': '#17261f',
      'text-primary': '#e4f3ea',
      'text-secondary': '#b8cbc0',
      'text-muted': '#8fa499',
    },
    roles: { accent: '#4fd18b', danger: '#e5574f', success: '#8fd65a', warning: '#e8b04a', pro: '#a88cf0' },
    fills: { danger: 400 },
    gitLift: 0.05,
    glass: loudGlass('#07100c'),
    world: monsoonWorld,
  },
  {
    id: 'glacier-crack',
    name: 'Glacier Crack',
    role: 'Crevasse climber',
    machine: 'a frosty laptop on a hanging portaledge',
    around: 'a glowing turquoise crevasse, a hanging serac, a snow bridge under the stars',
    weight: LOUD,
    anchors: {
      'surface-0': '#061419',
      'surface-1': '#0b1d23',
      'surface-2': '#0f242b',
      'surface-3': '#12282f',
      'text-primary': '#e3fafb',
      'text-secondary': '#b0d4d6',
      'text-muted': '#84a9ad',
    },
    roles: { accent: '#5ce1e6', danger: '#f2716b', success: '#5fe0a0', warning: '#f2c14e', pro: '#a68cff' },
    gitLift: 0.08,
    glass: loudGlass('#061419'),
    world: glacierCrackWorld,
  },
  {
    id: 'canyon-wind',
    name: 'Canyon Wind',
    role: 'Canyon camper',
    machine: 'a rugged laptop on a sandstone slab, an anemometer beside it',
    around: 'red rock walls, a stone arch at sunset, a dust devil',
    weight: LOUD,
    anchors: {
      'surface-0': '#120a09',
      'surface-1': '#190f0d',
      'surface-2': '#211513',
      'surface-3': '#2a1b18',
      'text-primary': '#fbeee9',
      'text-secondary': '#cfbcb4',
      'text-muted': '#a8958e',
    },
    roles: { accent: '#e8744a', danger: '#ff5a52', success: '#7cc98a', warning: '#f2b84b', pro: '#b094ff' },
    glass: loudGlass('#120a09'),
    world: canyonWindWorld,
  },
  {
    id: 'void-drift',
    name: 'Void Drift',
    role: 'Deep-space drifter',
    machine: 'a flight computer on an EVA work platform',
    around: 'a colossal ringed gas giant, small moons, deep space',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0a14',
      'surface-1': '#121220',
      'surface-2': '#171628',
      'surface-3': '#1f1e35',
      'text-primary': '#efebff',
      'text-secondary': '#c2bce0',
      'text-muted': '#938cb3',
    },
    roles: { accent: '#9b7bff', danger: '#ff5d73', success: '#5fe3a8', warning: '#ffc45a', pro: '#62d0ff' },
    glass: loudGlass('#0a0a14'),
    world: voidDriftWorld,
  },
  {
    id: 'moon-trek',
    name: 'Moon Trek',
    role: 'Astronaut',
    machine: 'a rugged laptop on a fold-out table beside the lander',
    around: 'the grey lunar plain, Earth overhead, a lander and a rover',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0c0f',
      'surface-1': '#111317',
      'surface-2': '#171a1f',
      'surface-3': '#1f2329',
      'text-primary': '#f0f1f3',
      'text-secondary': '#c0c3c9',
      'text-muted': '#999da5',
    },
    roles: { accent: '#bfc7d5', danger: '#ff6a5e', success: '#5fd3a0', warning: '#e9b949', pro: '#a99bff' },
    gitLift: 0.04,
    glass: loudGlass('#0b0c0f'),
    world: moonTrekWorld,
  },
  {
    id: 'orbital-ring',
    name: 'Orbital Ring',
    role: 'Station crew',
    machine: 'a console in a station corridor',
    around: 'a night-side planet, an orbital ring, a docking shuttle',
    weight: LOUD,
    anchors: {
      'surface-0': '#070a12',
      'surface-1': '#0d121c',
      'surface-2': '#121825',
      'surface-3': '#18202f',
      'text-primary': '#edf1f8',
      'text-secondary': '#c2c9d7',
      'text-muted': '#939caf',
    },
    roles: { accent: '#2f6fed', danger: '#ff5d6c', success: '#4fd49a', warning: '#ffc24d', pro: '#a98bff' },
    glass: loudGlass('#070a12'),
    world: orbitalRingWorld,
  },
  {
    id: 'alien-jungle',
    name: 'Alien Jungle',
    role: 'Xenobiologist',
    machine: 'a field laptop beside specimen jars',
    around: 'a glowing alien jungle, a spiral fungus, two moons',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0a17',
      'surface-1': '#120f1d',
      'surface-2': '#181527',
      'surface-3': '#1e1b2e',
      'text-primary': '#f0edfb',
      'text-secondary': '#c6c1d9',
      'text-muted': '#a09bb5',
    },
    roles: { accent: '#3df5d0', danger: '#f0506e', success: '#8be36a', warning: '#ffc35a', pro: '#b07cff' },
    glass: loudGlass('#0d0a17'),
    world: alienJungleWorld,
  },
  {
    id: 'hologram-city',
    name: 'Hologram City',
    role: 'Sky-lounge coder',
    machine: 'a holographic keyboard and a floating holo screen',
    around: 'white towers, a giant hologram koi, maglev lines',
    weight: LOUD,
    anchors: {
      'surface-0': '#06121a',
      'surface-1': '#0b1922',
      'surface-2': '#10202a',
      'surface-3': '#152731',
      'text-primary': '#e6f8fb',
      'text-secondary': '#b8d4da',
      'text-muted': '#8aa9b1',
    },
    roles: { accent: '#00e5ff', danger: '#ff5c6c', success: '#5ce8b0', warning: '#ffc94d', pro: '#a98bff' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.08,
    glass: loudGlass('#06121a'),
    world: hologramCityWorld,
  },
  {
    id: 'synthwave-highway',
    name: 'Synthwave Highway',
    role: 'Neon road-tripper',
    machine: 'a synth and a retro monitor in a pickup bed',
    around: 'a neon grid highway, a striped sunset',
    weight: LOUD,
    anchors: {
      'surface-0': '#110a1e',
      'surface-1': '#170f27',
      'surface-2': '#1d1430',
      'surface-3': '#241a39',
      'text-primary': '#f8f0ff',
      'text-secondary': '#d8c6ea',
      'text-muted': '#ab96c1',
    },
    roles: { accent: '#ff6ad5', danger: '#ff5470', success: '#4fe0b0', warning: '#ffc35a', pro: '#7ad8ff' },
    gitLift: 0.04,
    glass: loudGlass('#110a1e'),
    world: synthwaveHighwayWorld,
  },
  {
    id: 'data-stream',
    name: 'Data Stream',
    role: 'Data runner',
    machine: 'a green-code terminal, jacked into the board by a cable',
    around: 'a motherboard canyon, a towering CPU, packet trains on the traces, green glyph rain',
    weight: LOUD,
    anchors: {
      'surface-0': '#050d07',
      'surface-1': '#0a140d',
      'surface-2': '#0f1b12',
      'surface-3': '#152419',
      'text-primary': '#effcf2',
      'text-secondary': '#c0dcc8',
      'text-muted': '#90ad98',
    },
    roles: { accent: '#39ff6a', danger: '#ff5a5a', success: '#4fe0b0', warning: '#ffc44d', pro: '#6fc8ff' },
    glass: loudGlass('#050d07'),
    world: dataStreamWorld,
  },
  {
    id: 'lighthouse-coast',
    name: 'Lighthouse Coast',
    role: 'Lighthouse keeper',
    machine: 'a radio set and a Fresnel lamp on the porch desk',
    around: 'a rocky headland, a sweeping lighthouse beam, crashing surf, a ship offshore',
    weight: LOUD,
    anchors: {
      'surface-0': '#060e14',
      'surface-1': '#0b161d',
      'surface-2': '#101c24',
      'surface-3': '#15232c',
      'text-primary': '#e8f0f4',
      'text-secondary': '#b9c6cd',
      'text-muted': '#8b9aa3',
    },
    roles: { accent: '#ffd66b', danger: '#ff6b5e', success: '#5fd3a0', warning: '#ff9f4a', pro: '#a99bff' },
    fills: { danger: 400, pro: 400 },
    glass: loudGlass('#060e14'),
    world: lighthouseCoastWorld,
  },
  {
    id: 'dragon-pass',
    name: 'Dragon Pass',
    role: 'Pass warden',
    machine: 'a glowing rune-slate on a stone toll counter',
    around: "a mountain pass under a dragon's ribcage, its skull in the snow",
    weight: LOUD,
    anchors: {
      'surface-0': '#12100d',
      'surface-1': '#191613',
      'surface-2': '#1f1c18',
      'surface-3': '#26221d',
      'text-primary': '#f4eee4',
      'text-secondary': '#d0c6b7',
      'text-muted': '#a59a8a',
    },
    roles: { accent: '#e0a84a', danger: '#f2645a', success: '#8ccf6a', warning: '#f5c35a', pro: '#b48cff' },
    fills: { danger: 400 },
    gitLift: 0.07,
    glass: loudGlass('#12100d'),
    world: dragonPassWorld,
  },
  {
    id: 'crystal-cave',
    name: 'Crystal Cave',
    role: 'Crystal miner',
    machine: 'a laptop on a mine cart',
    around: 'a crystal cavern, an underground lake',
    weight: LOUD,
    anchors: {
      'surface-0': '#120b1c',
      'surface-1': '#181023',
      'surface-2': '#1e152b',
      'surface-3': '#261c35',
      'text-primary': '#f4eafb',
      'text-secondary': '#c9bcd4',
      'text-muted': '#a396ae',
    },
    roles: { accent: '#e07bff', danger: '#f0506e', success: '#5fd49a', warning: '#f2b84b', pro: '#9d8cff' },
    gitLift: 0.04,
    glass: loudGlass('#120b1c'),
    world: crystalCaveWorld,
  },
  {
    id: 'titan-steps',
    name: 'Titan Steps',
    role: 'Wandering traveller',
    machine: 'a strapped laptop on a stone tablet, in a giant stone palm',
    around: 'a valley of colossal ruined statues, giant steps, dust, stars and a small moon',
    weight: LOUD,
    anchors: {
      'surface-0': '#0e0d0b',
      'surface-1': '#161411',
      'surface-2': '#1c1a16',
      'surface-3': '#221f1b',
      'text-primary': '#f3efe8',
      'text-secondary': '#c9c3b9',
      'text-muted': '#9e978c',
    },
    roles: { accent: '#c9b48a', danger: '#e0604f', success: '#7fb77e', warning: '#e0a84a', pro: '#a08ed8' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.05,
    glass: loudGlass('#0e0d0b'),
    world: titanStepsWorld,
  },
  {
    id: 'castle-siege',
    name: 'Castle Siege',
    role: 'Siege engineer',
    machine: 'a laptop in an oak field case, a model trebuchet',
    around: 'a burning castle, a trebuchet against the moon',
    weight: LOUD,
    anchors: {
      'surface-0': '#130c0b',
      'surface-1': '#1a1211',
      'surface-2': '#201716',
      'surface-3': '#271d1b',
      'text-primary': '#faf0ed',
      'text-secondary': '#d8c4be',
      'text-muted': '#ad9993',
    },
    roles: { accent: '#e8553a', danger: '#ec4f63', success: '#7fcf6a', warning: '#f2b84a', pro: '#b48cff' },
    fills: { danger: 400, pro: 400 },
    glass: loudGlass('#130c0b'),
    world: castleSiegeWorld,
  },
  {
    id: 'sky-temple',
    name: 'Sky Temple',
    role: 'Temple archivist',
    machine: "a lit hanging-scroll screen on a scholar's table",
    around: 'a thousand lantern-lit steps, a red temple with a great bell, a sea of clouds, cranes',
    weight: LOUD,
    anchors: {
      'surface-0': '#120c0b',
      'surface-1': '#1a1312',
      'surface-2': '#211918',
      'surface-3': '#29201e',
      'text-primary': '#f7efe6',
      'text-secondary': '#cdc2b7',
      'text-muted': '#a09589',
    },
    roles: { accent: '#c0392b', danger: '#ff6a5c', success: '#6cc79a', warning: '#f2b544', pro: '#b39cff' },
    gitLift: 0.07,
    glass: loudGlass('#120c0b'),
    world: skyTempleWorld,
  },
  {
    id: 'giant-tree',
    name: 'Giant Tree',
    role: 'Treehouse keeper',
    machine: 'a log-slice screen on a split-log desk',
    around: 'a tree as big as a mountain, rope-ladder villages, roots like ridges',
    weight: LOUD,
    anchors: {
      'surface-0': '#0e0f09',
      'surface-1': '#14160e',
      'surface-2': '#1a1c13',
      'surface-3': '#22251a',
      'text-primary': '#eef0de',
      'text-secondary': '#bfc1b1',
      'text-muted': '#949689',
    },
    roles: { accent: '#c6d96a', danger: '#e5584a', success: '#5fd39a', warning: '#e8b84a', pro: '#b08ce8' },
    fills: { danger: 400 },
    gitLift: 0.08,
    glass: loudGlass('#0e0f09'),
    world: giantTreeWorld,
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    role: 'Ink-wash scholar',
    machine: "a laptop and an inkstone on a flanged scholar's table",
    around: 'a living ink painting, a huge waterfall, misty peaks, a red seal',
    weight: LOUD,
    anchors: {
      'surface-0': '#0e0d0b',
      'surface-1': '#151412',
      'surface-2': '#1c1a17',
      'surface-3': '#23211d',
      'text-primary': '#f3f0ea',
      'text-secondary': '#c3beb5',
      'text-muted': '#97928a',
    },
    roles: { accent: '#d6cfc2', danger: '#e5564b', success: '#6fc488', warning: '#e0b44c', pro: '#a58de8' },
    gitLift: 0.04,
    glass: loudGlass('#0e0d0b'),
    world: inkWashWorld,
  },
  {
    id: 'pixel-quest',
    name: 'Pixel Quest',
    role: 'Pixel hero',
    machine: 'a retro 8-bit computer with a cartridge',
    around: 'a side-scrolling level, a horned pixel boss, a castle',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0d18',
      'surface-1': '#121221',
      'surface-2': '#18182b',
      'surface-3': '#1f1f36',
      'text-primary': '#ededf5',
      'text-secondary': '#c2c1d0',
      'text-muted': '#9594a8',
    },
    roles: { accent: '#ffd23f', danger: '#ff5a5f', success: '#4fd08c', warning: '#ff9a3a', pro: '#9b7bff' },
    gitLift: 0.04,
    glass: loudGlass('#0d0d18'),
    world: pixelQuestWorld,
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    role: 'Draftsman',
    machine: 'a tilted drafting board with a drafting-machine arm',
    around: 'a blueprint sheet, a rocket on its gantry, a moon on its orbit',
    weight: LOUD,
    anchors: {
      'surface-0': '#07121f',
      'surface-1': '#0b1828',
      'surface-2': '#0f1f31',
      'surface-3': '#14263b',
      'text-primary': '#eef4fb',
      'text-secondary': '#c0cfdf',
      'text-muted': '#93a6bb',
    },
    roles: { accent: '#cde3ff', danger: '#ff6464', success: '#5fd39a', warning: '#f2c14e', pro: '#a99bff' },
    fills: { danger: 400 },
    gitLift: 0.08,
    glass: loudGlass('#07121f'),
    world: blueprintWorld,
  },
  {
    id: 'noir',
    name: 'Noir',
    role: 'Private eye',
    machine: 'a typewriter under a hanging bulb',
    around: 'a rainy street through the blinds, a stranger under a streetlamp',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0b0b',
      'surface-1': '#111111',
      'surface-2': '#171717',
      'surface-3': '#1e1e1e',
      'text-primary': '#f0f0f0',
      'text-secondary': '#c4c4c4',
      'text-muted': '#979797',
    },
    roles: { accent: '#e6e6e6', danger: '#d66a62', success: '#8fbf8a', warning: '#d9b25e', pro: '#a99bd6' },
    fills: { pro: 400 },
    glass: loudGlass('#0b0b0b'),
    world: noirWorld,
  },
  {
    id: 'toy-box',
    name: 'Toy Box',
    role: 'Wind-up toy',
    machine: 'a toy laptop on a desk of building blocks',
    around: 'a moonlit playroom, a block tower, a tin robot, a toy train',
    weight: LOUD,
    anchors: {
      'surface-0': '#120d0e',
      'surface-1': '#1a1415',
      'surface-2': '#211a1b',
      'surface-3': '#271f20',
      'text-primary': '#fbf3ec',
      'text-secondary': '#c8beb6',
      'text-muted': '#9f958e',
    },
    roles: { accent: '#d93a40', danger: '#ff6a3d', success: '#6fd08c', warning: '#f2b84b', pro: '#b48cff' },
    gitLift: 0.06,
    glass: loudGlass('#120d0e'),
    world: toyBoxWorld,
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    role: 'Glazier',
    machine: "an arched leaded screen on a glazier's bench",
    around: 'a dark nave, a rose window throwing coloured beams',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c0912',
      'surface-1': '#14101e',
      'surface-2': '#1b1628',
      'surface-3': '#231d33',
      'text-primary': '#f2eef6',
      'text-secondary': '#c8c2d0',
      'text-muted': '#a09aaa',
    },
    roles: { accent: '#ffb000', danger: '#e5484d', success: '#3fbf6f', warning: '#ff8a3d', pro: '#a989f0' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.04,
    glass: loudGlass('#0c0912'),
    world: stainedGlassWorld,
  },
  {
    id: 'old-quarter',
    name: 'Old Quarter',
    role: 'Tea-stall regular',
    machine: 'A laptop on a low red plastic table, next to a glass of iced tea',
    around: 'The old streets of Hanoi at night: tube houses with tile roofs and shutters, tangled power lines, lanterns, signs in an invented script, the train street and motorbikes',
    weight: LOUD,
    anchors: {
      'surface-0': '#110b07',
      'surface-1': '#19110b',
      'surface-2': '#20160e',
      'surface-3': '#281c12',
      'text-primary': '#f7ede0',
      'text-secondary': '#c0b5a6',
      'text-muted': '#968d82',
    },
    roles: { accent: '#f2b544', danger: '#ff6a55', success: '#7fd08a', warning: '#ff9d4a', pro: '#c39bff' },
    glass: loudGlass('#110b07'),
    world: oldQuarterWorld,
  },
  {
    id: 'rush-hour',
    name: 'Rush Hour',
    role: 'Rush-hour commuter',
    machine: 'a laptop on a striped road barricade, a paper coffee cup',
    around: 'a huge city crossing at dusk, a sea of umbrellas',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c0d11',
      'surface-1': '#121318',
      'surface-2': '#17191f',
      'surface-3': '#1e2028',
      'text-primary': '#eceef3',
      'text-secondary': '#c3c6cf',
      'text-muted': '#979ba7',
    },
    roles: { accent: '#ff5c5c', danger: '#ff7a45', success: '#52e08a', warning: '#ffb23e', pro: '#9a8cff' },
    fills: { danger: 400 },
    glass: loudGlass('#0c0d11'),
    world: rushHourWorld,
  },
  {
    id: 'subway-night',
    name: 'Subway Night',
    role: 'Night commuter',
    machine: 'a laptop on a suitcase, on a platform bench',
    around: 'an empty platform at midnight, a tunnel mouth, the last train',
    weight: LOUD,
    anchors: {
      'surface-0': '#090c0f',
      'surface-1': '#0e1216',
      'surface-2': '#13181d',
      'surface-3': '#1a2026',
      'text-primary': '#eef1f4',
      'text-secondary': '#c2c8ce',
      'text-muted': '#99a1a9',
    },
    roles: { accent: '#f5d547', danger: '#e5484d', success: '#3fbf6f', warning: '#f0913a', pro: '#9b87f5' },
    glass: loudGlass('#090c0f'),
    world: subwayNightWorld,
  },
  {
    id: 'library-endless',
    name: 'Endless Library',
    role: 'Night librarian',
    machine: "a leather-bound laptop beside a green banker's lamp",
    around: 'an endless corridor of shelves, rolling ladders, warm sconces',
    weight: LOUD,
    anchors: {
      'surface-0': '#150f0a',
      'surface-1': '#1b140e',
      'surface-2': '#201812',
      'surface-3': '#261d15',
      'text-primary': '#f8efe4',
      'text-secondary': '#d2c3b0',
      'text-muted': '#a89886',
    },
    roles: { accent: '#d9a066', danger: '#e0604a', success: '#8cb86a', warning: '#f0c45a', pro: '#a88ad0' },
    fills: { pro: 400 },
    gitLift: 0.05,
    glass: loudGlass('#150f0a'),
    world: libraryEndlessWorld,
  },
  {
    id: 'exam-season',
    name: 'Exam Season',
    role: 'Student',
    machine: 'a laptop under a desk lamp, beside a cup of instant noodles',
    around: 'towers of books, a school clock, a sleeping city at 2 a.m.',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0c11',
      'surface-1': '#0f1218',
      'surface-2': '#151820',
      'surface-3': '#1c2029',
      'text-primary': '#eceff5',
      'text-secondary': '#c0c6d2',
      'text-muted': '#959dab',
    },
    roles: { accent: '#7aa7ff', danger: '#f0626a', success: '#5fd39a', warning: '#f2c14e', pro: '#b48cff' },
    glass: loudGlass('#0a0c11'),
    world: examSeasonWorld,
  },
  {
    id: 'dreamscape',
    name: 'Dreamscape',
    role: 'Dreamer',
    machine: 'a little door on a desk that is a door laid flat, a teacup floating over the keys',
    around: 'an upside-down city, floating doors, stairs to a moon that is a door',
    weight: LOUD,
    anchors: {
      'surface-0': '#110b1b',
      'surface-1': '#171022',
      'surface-2': '#1c1428',
      'surface-3': '#241a33',
      'text-primary': '#f4eefb',
      'text-secondary': '#c9bddb',
      'text-muted': '#a093b6',
    },
    roles: { accent: '#ff9ecf', danger: '#ff5c7c', success: '#5fe0a8', warning: '#ffc75a', pro: '#b89cff' },
    glass: loudGlass('#110b1b'),
    world: dreamscapeWorld,
  },
  {
    id: 'backrooms',
    name: 'Backrooms',
    role: 'Lost office worker',
    machine: 'a beige CRT at a lone office desk',
    around: 'endless yellowed rooms, buzzing fluorescent lights, a far exit door',
    weight: LOUD,
    anchors: {
      'surface-0': '#100e07',
      'surface-1': '#16130b',
      'surface-2': '#1c1910',
      'surface-3': '#221e13',
      'text-primary': '#f5efd8',
      'text-secondary': '#cbc3a6',
      'text-muted': '#9d957a',
    },
    roles: { accent: '#8a7a2e', danger: '#e0604a', success: '#8fbf5a', warning: '#e0b040', pro: '#a88ad0' },
    fills: { pro: 400 },
    glass: loudGlass('#100e07'),
    world: backroomsWorld,
  },
  {
    id: 'mirror-maze',
    name: 'Mirror Maze',
    role: 'Mirror walker',
    machine: 'a cheval mirror for a screen on a glass desk',
    around: 'a maze of mirrors, a thousand reflections',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0e13',
      'surface-1': '#11151b',
      'surface-2': '#171c23',
      'surface-3': '#1e242d',
      'text-primary': '#e8eef4',
      'text-secondary': '#bcc5cf',
      'text-muted': '#939daa',
    },
    roles: { accent: '#b8e1ff', danger: '#e5484d', success: '#4fc98a', warning: '#e9b949', pro: '#a98bff' },
    fills: { danger: 400 },
    gitLift: 0.05,
    glass: loudGlass('#0b0e13'),
    world: mirrorMazeWorld,
  },
  {
    id: 'infinite-stairs',
    name: 'Infinite Stairs',
    role: 'Stair walker',
    machine: 'a laptop with a model of the loop hovering above it',
    around: 'a Penrose loop of stairs in violet night, climbers who never reach the top',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0912',
      'surface-1': '#110f18',
      'surface-2': '#17151f',
      'surface-3': '#1f1b29',
      'text-primary': '#f1eef7',
      'text-secondary': '#c5c0d3',
      'text-muted': '#9a94ad',
    },
    roles: { accent: '#6c5ce7', danger: '#e5484d', success: '#4cc38a', warning: '#e9b949', pro: '#5fb8e8' },
    glass: loudGlass('#0b0912'),
    world: infiniteStairsWorld,
  },
  {
    id: 'armored-genius',
    name: 'Armored Genius',
    role: 'Suit engineer',
    machine: 'a holographic workbench with floating panels',
    around: 'a cliffside workshop, a powered suit in its gantry',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a1014',
      'surface-1': '#0f171c',
      'surface-2': '#141d23',
      'surface-3': '#1a252c',
      'text-primary': '#eaf6f5',
      'text-secondary': '#b3c1c0',
      'text-muted': '#8b9899',
    },
    roles: { accent: '#2ee6d6', danger: '#ff6b6b', success: '#5fd38a', warning: '#ffc247', pro: '#a98bff' },
    gitLift: 0.04,
    glass: loudGlass('#0a1014'),
    world: armoredGeniusWorld,
  },
  {
    id: 'henchbot-lair',
    name: 'Henchbot Lair',
    role: 'Evil genius',
    machine: 'a villain console with big levers and one big button',
    around: 'a volcano lair, a moon ray cannon, two dozen helper bots',
    weight: LOUD,
    anchors: {
      'surface-0': '#0f0913',
      'surface-1': '#160f1b',
      'surface-2': '#1c1422',
      'surface-3': '#231a2b',
      'text-primary': '#f2eef5',
      'text-secondary': '#c8bfd0',
      'text-muted': '#9c92a6',
    },
    roles: { accent: '#b8f03a', danger: '#ff5a6a', success: '#4fd6a8', warning: '#ffb347', pro: '#b48cff' },
    glass: loudGlass('#0f0913'),
    world: henchbotLairWorld,
  },
  {
    id: 'cosmic-titan',
    name: 'Cosmic Titan',
    role: 'Cosmic warlord',
    machine: 'a rune-lit obsidian slab',
    around: 'a titan on a throne in a shattered moon, a star in its palm, a violet nebula',
    weight: LOUD,
    anchors: {
      'surface-0': '#0d0814',
      'surface-1': '#150f1e',
      'surface-2': '#1a1324',
      'surface-3': '#20182c',
      'text-primary': '#f3eefa',
      'text-secondary': '#c9bfd8',
      'text-muted': '#9c90ad',
    },
    roles: { accent: '#f2c14e', danger: '#ff6a5a', success: '#6fd39a', warning: '#ff9a3d', pro: '#b48cff' },
    glass: loudGlass('#0d0814'),
    world: cosmicTitanWorld,
  },
  {
    id: 'synthetic-dawn',
    name: 'Synthetic Dawn',
    role: 'Roboticist',
    machine: 'a floating glass terminal',
    around: 'a tiled lab, a synthetic in a glass pod, a forest beyond the glass',
    weight: LOUD,
    anchors: {
      'surface-0': '#070b10',
      'surface-1': '#0c1219',
      'surface-2': '#111922',
      'surface-3': '#18212c',
      'text-primary': '#edf6fa',
      'text-secondary': '#c2ced6',
      'text-muted': '#98a6b1',
    },
    roles: { accent: '#8fe3ff', danger: '#ff5a64', success: '#4fd8a0', warning: '#ffc061', pro: '#b49cff' },
    glass: loudGlass('#070b10'),
    world: syntheticDawnWorld,
  },
  {
    id: 'night-vigilante',
    name: 'Night Vigilante',
    role: 'Night vigilante',
    machine: 'a field computer in a hard case on a stone parapet',
    around: 'a gothic rooftop in the rain, a searchlight throwing a starburst on the clouds',
    weight: LOUD,
    anchors: {
      'surface-0': '#090b10',
      'surface-1': '#0f1219',
      'surface-2': '#141822',
      'surface-3': '#1b1f2a',
      'text-primary': '#eef0f6',
      'text-secondary': '#c1c6d3',
      'text-muted': '#949bab',
    },
    roles: { accent: '#ff7a59', danger: '#f2485a', success: '#5fd39a', warning: '#ffc857', pro: '#9d8cff' },
    glass: loudGlass('#090b10'),
    world: nightVigilanteWorld,
  },
  {
    id: 'thunder-realm',
    name: 'Thunder Realm',
    role: 'Thunder warrior',
    machine: 'a rune-stone tablet, a rune hammer on its plinth',
    around: 'a golden hall in a world-tree, ravens, a sea of storm clouds',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0d14',
      'surface-1': '#10141d',
      'surface-2': '#141924',
      'surface-3': '#19202d',
      'text-primary': '#eaf2fc',
      'text-secondary': '#b6c1d1',
      'text-muted': '#8c97a9',
    },
    roles: { accent: '#6fb7ff', danger: '#ff6a5c', success: '#5fd39a', warning: '#ffc04d', pro: '#b49cff' },
    glass: loudGlass('#0a0d14'),
    world: thunderRealmWorld,
  },
  {
    id: 'shrunk',
    name: 'Shrunk',
    role: 'Shrunk hero',
    machine: 'a propped-up phone on a matchbox',
    around: 'a giant desk at night, a towering coffee mug, a pencil log, a keyboard cliff',
    weight: LOUD,
    anchors: {
      'surface-0': '#0e0a07',
      'surface-1': '#15100b',
      'surface-2': '#1d1711',
      'surface-3': '#251e16',
      'text-primary': '#f6eee4',
      'text-secondary': '#d3c8b9',
      'text-muted': '#a99d8d',
    },
    roles: { accent: '#ffb347', danger: '#ef5a4c', success: '#76c47e', warning: '#f2d35b', pro: '#a98be0' },
    fills: { pro: 400 },
    glass: loudGlass('#0e0a07'),
    world: shrunkWorld,
  },
  {
    id: 'sorcerer-sanctum',
    name: 'Sorcerer Sanctum',
    role: 'Sorcerer',
    machine: 'a floating spellbook over a rune slate',
    around: 'a sanctum library, a round window on a folded city, floating relics, spell circles',
    weight: LOUD,
    anchors: {
      'surface-0': '#0b0a14',
      'surface-1': '#12101c',
      'surface-2': '#161421',
      'surface-3': '#1c1a29',
      'text-primary': '#f3eff8',
      'text-secondary': '#c6c0d4',
      'text-muted': '#958fa6',
    },
    roles: { accent: '#ff9a3c', danger: '#ff5f6d', success: '#5fd39a', warning: '#ffc94d', pro: '#a594ff' },
    glass: loudGlass('#0b0a14'),
    world: sorcererSanctumWorld,
  },
  {
    id: 'ocean-liner',
    name: 'Ocean Liner',
    role: 'Wireless operator',
    machine: 'a spark-gap wireless set and a telegraph key',
    around: 'a grand liner at night, an iceberg on a starlit sea',
    weight: LOUD,
    anchors: {
      'surface-0': '#070b12',
      'surface-1': '#0d121a',
      'surface-2': '#121821',
      'surface-3': '#171e29',
      'text-primary': '#eef2f7',
      'text-secondary': '#bec6d2',
      'text-muted': '#8e98a8',
    },
    roles: { accent: '#e8c27a', danger: '#ff6b5e', success: '#5fd3a0', warning: '#ffa04a', pro: '#a99bff' },
    glass: loudGlass('#070b12'),
    world: oceanLinerWorld,
  },
  {
    id: 'shark-bay',
    name: 'Shark Bay',
    role: 'Lifeguard',
    machine: 'a CB radio with a coiled mic in the lifeguard tower',
    around: 'a moonlit bay, a circling fin, the pier and a bell buoy',
    weight: LOUD,
    anchors: {
      'surface-0': '#06101a',
      'surface-1': '#0b1721',
      'surface-2': '#101d29',
      'surface-3': '#162533',
      'text-primary': '#e8f4f4',
      'text-secondary': '#bacdd0',
      'text-muted': '#8ca1a6',
    },
    roles: { accent: '#3fd1c4', danger: '#ff6058', success: '#7ad67e', warning: '#f2b84b', pro: '#a99bff' },
    gitLift: 0.04,
    glass: loudGlass('#06101a'),
    world: sharkBayWorld,
  },
  {
    id: 'museum-night',
    name: 'Museum Night',
    role: 'Night guard',
    machine: 'a security monitor of camera feeds and a flashlight',
    around: "a museum's great hall at night, a dinosaur skeleton, a whale skeleton under the skylight, a stone guardian",
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0d13',
      'surface-1': '#0f131b',
      'surface-2': '#141923',
      'surface-3': '#1a202c',
      'text-primary': '#edf3fc',
      'text-secondary': '#c0cada',
      'text-muted': '#939fb3',
    },
    roles: { accent: '#9cc8ff', danger: '#ff6a5e', success: '#5fd39a', warning: '#ffc85a', pro: '#c4a2ff' },
    glass: loudGlass('#0a0d13'),
    world: museumNightWorld,
  },
  {
    id: 'casino-spy',
    name: 'Casino Spy',
    role: 'Casino spy',
    machine: 'a laptop disguised as a cigarette case, on a baize card table',
    around: 'a Riviera casino terrace at night, a chandelier, a roulette wheel, a yacht in the bay',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0a10',
      'surface-1': '#101018',
      'surface-2': '#15151f',
      'surface-3': '#1c1c28',
      'text-primary': '#f4efe4',
      'text-secondary': '#c7c0b1',
      'text-muted': '#989182',
    },
    roles: { accent: '#f0d38a', danger: '#ff5d6c', success: '#5fd39a', warning: '#ffab4a', pro: '#9fb4ff' },
    fills: { pro: 400 },
    glass: loudGlass('#0a0a10'),
    world: casinoSpyWorld,
  },
  {
    id: 'carrier-deck',
    name: 'Carrier Deck',
    role: 'Fighter pilot',
    machine: 'a rugged flight-ops panel on a deck console',
    around: 'a carrier deck at sunset, a jet on the catapult, the island tower',
    weight: LOUD,
    anchors: {
      'surface-0': '#0c0a12',
      'surface-1': '#13101a',
      'surface-2': '#1a1622',
      'surface-3': '#221d2b',
      'text-primary': '#f6efeb',
      'text-secondary': '#c9bfbd',
      'text-muted': '#9e9497',
    },
    roles: { accent: '#ff8c42', danger: '#ff5a5f', success: '#5fd39a', warning: '#ffd04a', pro: '#a98bff' },
    glass: loudGlass('#0c0a12'),
    world: carrierDeckWorld,
  },
  {
    id: 'wizard-academy',
    name: 'Wizard Academy',
    role: 'Wizard student',
    machine: 'an enchanted quill writing on a floating parchment over a spellbook',
    around: "a castle school's great hall, floating candles, a starry enchanted ceiling, towers over a lake",
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0812',
      'surface-1': '#120f1b',
      'surface-2': '#16131f',
      'surface-3': '#1c1827',
      'text-primary': '#f2eefa',
      'text-secondary': '#c6bfd2',
      'text-muted': '#968fa6',
    },
    roles: { accent: '#ffd27a', danger: '#ff6b6b', success: '#6fd39a', warning: '#ff9f4a', pro: '#b39bff' },
    glass: loudGlass('#0a0812'),
    world: wizardAcademyWorld,
  },
  {
    id: 'derelict',
    name: 'Derelict',
    role: 'Salvage tech',
    machine: 'a motion tracker on a steel console',
    around: 'a derelict freighter corridor, an airlock, something in the ducts',
    weight: LOUD,
    anchors: {
      'surface-0': '#05080a',
      'surface-1': '#0a0f11',
      'surface-2': '#0f1618',
      'surface-3': '#161e20',
      'text-primary': '#eef6f2',
      'text-secondary': '#c3cec9',
      'text-muted': '#95a39d',
    },
    roles: { accent: '#5cff9d', danger: '#ff5a4c', success: '#3fd47a', warning: '#ffb347', pro: '#9d8cff' },
    glass: loudGlass('#05080a'),
    world: derelictWorld,
  },
  {
    id: 'jungle-game',
    name: 'Jungle Game',
    role: 'Jungle explorer',
    machine: 'a carved board game with a crystal orb',
    around: 'an old house overrun by jungle, a stampede through the wall',
    weight: LOUD,
    anchors: {
      'surface-0': '#090e0a',
      'surface-1': '#0e140f',
      'surface-2': '#131b15',
      'surface-3': '#1a231c',
      'text-primary': '#ecf5ec',
      'text-secondary': '#c0cdbf',
      'text-muted': '#98a698',
    },
    roles: { accent: '#6be38b', danger: '#ff6b5e', success: '#9cdf52', warning: '#f0b44a', pro: '#a98bff' },
    glass: loudGlass('#090e0a'),
    world: jungleGameWorld,
  },
  {
    id: 'wave-planet',
    name: 'Wave Planet',
    role: 'Ocean-planet explorer',
    machine: "a lander's console in knee-deep water",
    around: 'an endless shallow sea, a mountain-high wave, a ringed gas giant',
    weight: LOUD,
    anchors: {
      'surface-0': '#070c12',
      'surface-1': '#0c131b',
      'surface-2': '#121b25',
      'surface-3': '#19242f',
      'text-primary': '#eef5fa',
      'text-secondary': '#c3cfd9',
      'text-muted': '#9aa9b5',
    },
    roles: { accent: '#bfe4ff', danger: '#ef6b62', success: '#5fd39a', warning: '#e9b949', pro: '#9f9bff' },
    gitLift: 0.04,
    glass: loudGlass('#070c12'),
    world: wavePlanetWorld,
  },
  {
    id: 'mothership',
    name: 'Mothership',
    role: 'Signal operator',
    machine: 'a field receiver with five tone keys',
    around: 'a desert night, a colossal saucer overhead',
    weight: LOUD,
    anchors: {
      'surface-0': '#0a0812',
      'surface-1': '#13101f',
      'surface-2': '#171327',
      'surface-3': '#1f1a33',
      'text-primary': '#f1edfb',
      'text-secondary': '#c6bedb',
      'text-muted': '#9d94b5',
    },
    roles: { accent: '#b48cff', danger: '#ff5a6e', success: '#5fe0a0', warning: '#ffc15a', pro: '#6fd8ff' },
    glass: loudGlass('#0a0812'),
    world: mothershipWorld,
  },
  {
    id: 'asteroid-drill',
    name: 'Asteroid Drill',
    role: 'Drill crew',
    machine: 'a drill control console with pressure gauges',
    around: 'a jagged asteroid, a drill derrick, a big blue planet ahead',
    weight: LOUD,
    anchors: {
      'surface-0': '#07080c',
      'surface-1': '#101217',
      'surface-2': '#14161d',
      'surface-3': '#1b1e26',
      'text-primary': '#f2eee8',
      'text-secondary': '#c7c1b8',
      'text-muted': '#9a948b',
    },
    roles: { accent: '#ff9d3a', danger: '#ff5d52', success: '#5fd38f', warning: '#ffd24a', pro: '#8fb2ff' },
    fills: { pro: 400 },
    glass: loudGlass('#07080c'),
    world: asteroidDrillWorld,
  },
  {
    id: 'comic-city',
    name: 'Comic City',
    role: 'Masked hero',
    machine: 'an inked comic-panel laptop on a drawing desk',
    around: 'a halftone comic-page city, a hero swinging across the moon',
    weight: LOUD,
    anchors: {
      'surface-0': '#0e0a13',
      'surface-1': '#140f1a',
      'surface-2': '#1a1421',
      'surface-3': '#211a2a',
      'text-primary': '#f6eef6',
      'text-secondary': '#cdc0d0',
      'text-muted': '#a596aa',
    },
    roles: { accent: '#ff4fa3', danger: '#ff6a3d', success: '#4fdc9a', warning: '#ffd23f', pro: '#4fc8ff' },
    glass: loudGlass('#0e0a13'),
    world: comicCityWorld,
  },
  {
    id: 'night-kitchen',
    name: 'Night Kitchen',
    role: 'Night-shift chef',
    machine: 'a tablet on a recipe stand at a steel prep table',
    around: 'a Paris kitchen in the rush: copper pans, a roaring range, rooftops and a far iron tower',
    weight: LOUD,
    anchors: {
      'surface-0': '#0f0a08',
      'surface-1': '#16100c',
      'surface-2': '#1c1511',
      'surface-3': '#261c16',
      'text-primary': '#f7ede4',
      'text-secondary': '#d2c3b6',
      'text-muted': '#a99888',
    },
    roles: { accent: '#e8955a', danger: '#e8505b', success: '#6cc08b', warning: '#f0b840', pro: '#a98be0' },
    fills: { danger: 400 },
    glass: loudGlass('#0f0a08'),
    world: nightKitchenWorld,
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
    id: 'coral-reef',
    name: 'Coral Reef',
    role: 'Snorkeller',
    machine: 'a rugged laptop on a table coral',
    around: 'a shallow reef at dusk, sea fans, a school of fish',
    weight: 1,
    anchors: {
      'surface-0': '#051517',
      'surface-1': '#0a1c1f',
      'surface-2': '#0e2124',
      'surface-3': '#132629',
      'text-primary': '#e6f6f4',
      'text-secondary': '#b2d1ce',
      'text-muted': '#86a8a5',
    },
    roles: { accent: '#d9443a', danger: '#ff6b7f', success: '#5fd3a0', warning: '#f0b44c', pro: '#a58cf0' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#051517', opacity: 0.5 },
    world: coralReefWorld,
  },
  {
    id: 'sky-islands',
    name: 'Sky Islands',
    role: 'Sky pilot',
    machine: 'a laptop and a brass altimeter in an island workshop',
    around: 'floating islands, waterfalls, rope bridges, an airship',
    weight: 1,
    anchors: {
      'surface-0': '#07101c',
      'surface-1': '#0c1725',
      'surface-2': '#111d2e',
      'surface-3': '#162436',
      'text-primary': '#edf4fb',
      'text-secondary': '#b6c7d9',
      'text-muted': '#8a9db3',
    },
    roles: { accent: '#3a8dde', danger: '#ef6f6c', success: '#5fd39a', warning: '#f0b95a', pro: '#a58cff' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#07101c', opacity: 0.5 },
    world: skyIslandsWorld,
  },
  {
    id: 'frozen-lake',
    name: 'Frozen Lake',
    role: 'Ice fisher',
    machine: 'a rugged laptop by an ice hole in a shanty doorway',
    around: 'a frozen lake under a hazy moon, pine shores, far shanties, something huge under the ice',
    weight: 1,
    anchors: {
      'surface-0': '#070b0e',
      'surface-1': '#0d1418',
      'surface-2': '#121a1f',
      'surface-3': '#182127',
      'text-primary': '#ebf2f6',
      'text-secondary': '#b5c3cb',
      'text-muted': '#8798a3',
    },
    roles: { accent: '#4a90b8', danger: '#ff6b6b', success: '#5fd39a', warning: '#ffc45a', pro: '#a68cff' },
    glass: { blur: 16, tint: '#070b0e', opacity: 0.5 },
    world: frozenLakeWorld,
  },
  {
    id: 'verdant-hollow',
    name: 'Verdant Hollow',
    role: 'Forest hermit',
    machine: 'a root-framed screen in a hollow tree',
    around: 'a mossy ancient forest, fireflies, a stag guardian of moss and stone',
    weight: 1,
    anchors: {
      'surface-0': '#08110b',
      'surface-1': '#0d1810',
      'surface-2': '#121e15',
      'surface-3': '#18261b',
      'text-primary': '#e8f5e0',
      'text-secondary': '#b5c8ad',
      'text-muted': '#8a9c86',
    },
    roles: { accent: '#8edb6a', danger: '#ff7b6b', success: '#5fd3a0', warning: '#f0c35a', pro: '#b59cff' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#08110b', opacity: 0.5 },
    world: verdantHollowWorld,
  },
  {
    id: 'spirit-forest',
    name: 'Spirit Forest',
    role: 'Lantern keeper',
    machine: 'a bamboo-framed laptop beside a paper lantern',
    around: 'a bamboo forest at night, paper lanterns, drifting spirits',
    weight: 1,
    anchors: {
      'surface-0': '#07110e',
      'surface-1': '#0b1813',
      'surface-2': '#101e18',
      'surface-3': '#15251e',
      'text-primary': '#e4f3ec',
      'text-secondary': '#b2c9be',
      'text-muted': '#86a096',
    },
    roles: { accent: '#a8f0d8', danger: '#f07a7a', success: '#7fd88a', warning: '#f0c56a', pro: '#b9a2ff' },
    glass: { blur: 16, tint: '#07110e', opacity: 0.5 },
    world: spiritForestWorld,
  },
  {
    id: 'paper-world',
    name: 'Paper World',
    role: 'Paper artist',
    machine: 'a cardboard laptop and a pinwheel on a cardboard desk',
    around: 'cut-paper hills, a paper moon on a string, a pop-up book',
    weight: 1,
    anchors: {
      'surface-0': '#0d0c15',
      'surface-1': '#14131d',
      'surface-2': '#1a1824',
      'surface-3': '#201e2c',
      'text-primary': '#f4efe6',
      'text-secondary': '#c4bcb2',
      'text-muted': '#968f86',
    },
    roles: { accent: '#d9534f', danger: '#ff6b5e', success: '#7cbf7a', warning: '#e3a94b', pro: '#a78bdb' },
    glass: { blur: 16, tint: '#0d0c15', opacity: 0.5 },
    world: paperWorldWorld,
  },
  {
    id: 'clay-town',
    name: 'Clay Town',
    role: 'Clay townsperson',
    machine: 'a clay laptop on a lumpy clay desk',
    around: 'a plasticine town at night, a moon on a thread, a toy train line',
    weight: 1,
    anchors: {
      'surface-0': '#140c09',
      'surface-1': '#1a110d',
      'surface-2': '#211612',
      'surface-3': '#281b16',
      'text-primary': '#fbf2ea',
      'text-secondary': '#d6c3b3',
      'text-muted': '#ab9584',
    },
    roles: { accent: '#b8561e', danger: '#e5584a', success: '#86b86a', warning: '#e3a640', pro: '#a98ad6' },
    fills: { danger: 400, pro: 400 },
    glass: { blur: 16, tint: '#140c09', opacity: 0.5 },
    world: clayTownWorld,
  },
  {
    id: 'low-poly',
    name: 'Low Poly',
    role: 'Facet sculptor',
    machine: 'a faceted laptop and a floating gem on a hilltop slab desk',
    around: 'a low-poly valley at dusk, a faceted moon, a polygon lake, triangle pines',
    weight: 1,
    anchors: {
      'surface-0': '#0a1112',
      'surface-1': '#0f1819',
      'surface-2': '#141e1f',
      'surface-3': '#1a2526',
      'text-primary': '#eaf5f1',
      'text-secondary': '#b9c3c0',
      'text-muted': '#8c9593',
    },
    roles: { accent: '#5b8c85', danger: '#e0707e', success: '#6fcf97', warning: '#e6b45e', pro: '#a596e0' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#0a1112', opacity: 0.5 },
    world: lowPolyWorld,
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    role: 'Rice farmer',
    machine: 'a laptop and an oil lamp on the farmhouse porch',
    around: 'golden rice fields at sunset, a lone banyan, a scarecrow',
    weight: 1,
    anchors: {
      'surface-0': '#120c08',
      'surface-1': '#18110b',
      'surface-2': '#1e160f',
      'surface-3': '#241a12',
      'text-primary': '#fdf1e2',
      'text-secondary': '#d2c2ae',
      'text-muted': '#a8967f',
    },
    roles: { accent: '#ffb86b', danger: '#ff6a55', success: '#9ccf6a', warning: '#ffd25a', pro: '#b897e0' },
    glass: { blur: 16, tint: '#120c08', opacity: 0.5 },
    world: goldenHourWorld,
  },
  {
    id: 'rice-terrace',
    name: 'Rice Terrace',
    role: 'Rice farmer',
    machine: 'a laptop and a kerosene lantern on a bamboo desk',
    around: 'flooded rice terraces under the moon, a waterwheel, stilt houses',
    weight: 1,
    anchors: {
      'surface-0': '#070c08',
      'surface-1': '#0d140e',
      'surface-2': '#121a13',
      'surface-3': '#172119',
      'text-primary': '#eef5e8',
      'text-secondary': '#b9c6b0',
      'text-muted': '#8b9a84',
    },
    roles: { accent: '#4a8a2c', danger: '#ec6a54', success: '#7ccf6a', warning: '#e6b44c', pro: '#a68ee0' },
    glass: { blur: 16, tint: '#070c08', opacity: 0.5 },
    world: riceTerraceWorld,
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    role: 'Hanami picnicker',
    machine: 'a laptop on a gingham-draped picnic table',
    around: 'a moonlit cherry avenue, paper lanterns, falling petals',
    weight: 1,
    anchors: {
      'surface-0': '#130a0f',
      'surface-1': '#1b1116',
      'surface-2': '#23161d',
      'surface-3': '#2b1b23',
      'text-primary': '#fcf0f3',
      'text-secondary': '#c9b7bd',
      'text-muted': '#a08f96',
    },
    roles: { accent: '#e0607e', danger: '#ff6a55', success: '#7ccf8a', warning: '#f0b450', pro: '#b190f0' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#130a0f', opacity: 0.5 },
    world: cherryBlossomWorld,
  },
  {
    id: 'autumn-road',
    name: 'Autumn Road',
    role: 'Autumn poet',
    machine: 'a laptop on a park-bench table, a glass of tea',
    around: "a lamplit tree-lined lane in autumn, falling leaves, a flower seller's bicycle",
    weight: 1,
    anchors: {
      'surface-0': '#18100b',
      'surface-1': '#1f150e',
      'surface-2': '#251a12',
      'surface-3': '#2b1f17',
      'text-primary': '#f6ede0',
      'text-secondary': '#d4c2ad',
      'text-muted': '#a8957f',
    },
    roles: { accent: '#e8893a', danger: '#e8574a', success: '#7fbf6a', warning: '#f0c050', pro: '#b08fd8' },
    fills: { danger: 400, pro: 400 },
    gitLift: 0.07,
    glass: { blur: 16, tint: '#18100b', opacity: 0.5 },
    world: autumnRoadWorld,
  },
  {
    id: 'liminal-pool',
    name: 'Liminal Pool',
    role: 'Night lifeguard',
    machine: 'a rugged laptop and a stopwatch on a tiled poolside counter',
    around: 'an endless tiled pool hall, arches into the dark, water lit from below',
    weight: 1,
    anchors: {
      'surface-0': '#050f11',
      'surface-1': '#0a171a',
      'surface-2': '#0f1e21',
      'surface-3': '#142629',
      'text-primary': '#e6f5f5',
      'text-secondary': '#b4c8c9',
      'text-muted': '#86999b',
    },
    roles: { accent: '#1c7f8e', danger: '#f0706a', success: '#5fd6a0', warning: '#f2c25c', pro: '#a78bfa' },
    gitLift: 0.05,
    glass: { blur: 16, tint: '#050f11', opacity: 0.5 },
    world: liminalPoolWorld,
  },
  {
    id: 'memory-lane',
    name: 'Memory Lane',
    role: 'Projectionist',
    machine: 'a film projector with a keyboard deck, on a stack of film tins',
    around: 'a river of light, drifting picture frames, a film reel, a floating screen',
    weight: 1,
    anchors: {
      'surface-0': '#0e0c11',
      'surface-1': '#15121a',
      'surface-2': '#1a1720',
      'surface-3': '#211d27',
      'text-primary': '#f3eef4',
      'text-secondary': '#c1bcc2',
      'text-muted': '#938f95',
    },
    roles: { accent: '#f2c49b', danger: '#f07a78', success: '#7fd4a2', warning: '#f2b45e', pro: '#b9a2ff' },
    glass: { blur: 16, tint: '#0e0c11', opacity: 0.5 },
    world: memoryLaneWorld,
  },
  {
    id: 'marigold-bridge',
    name: 'Marigold Bridge',
    role: 'Altar keeper',
    machine: 'a painted wooden laptop at a family altar',
    around: 'a marigold-petal bridge, a spirit city of stacked towers, papel picado',
    weight: 1,
    anchors: {
      'surface-0': '#120a10',
      'surface-1': '#191017',
      'surface-2': '#1f141d',
      'surface-3': '#261a23',
      'text-primary': '#faefea',
      'text-secondary': '#cfc0ba',
      'text-muted': '#a3938e',
    },
    roles: { accent: '#ffa726', danger: '#ff5d6c', success: '#6fd08c', warning: '#ffd54f', pro: '#b88cff' },
    glass: { blur: 16, tint: '#120a10', opacity: 0.5 },
    world: marigoldBridgeWorld,
  },
  {
    id: 'wayfinder-sea',
    name: 'Wayfinder Sea',
    role: 'Wayfinder',
    machine: 'a star compass of shells and sticks on a voyaging canoe',
    around: 'a calm starry sea, a crab-claw sail, a path of stars, a glowing manta',
    weight: 1,
    anchors: {
      'surface-0': '#050c14',
      'surface-1': '#0a151e',
      'surface-2': '#0f1c27',
      'surface-3': '#152431',
      'text-primary': '#e8f6f4',
      'text-secondary': '#b0c4c2',
      'text-muted': '#889a9a',
    },
    roles: { accent: '#4fe0c8', danger: '#ff6b6b', success: '#8ee06a', warning: '#ffc857', pro: '#b49aff' },
    gitLift: 0.04,
    glass: { blur: 16, tint: '#050c14', opacity: 0.5 },
    world: wayfinderSeaWorld,
  },
  {
    id: 'savanna-dawn',
    name: 'Savanna Dawn',
    role: 'Safari ranger',
    machine: 'a solar-panel laptop on a camp table',
    around: 'a savanna sunrise from a jutting granite rock, giraffes, elephants, zebras, acacias',
    weight: 1,
    anchors: {
      'surface-0': '#120c08',
      'surface-1': '#1a120c',
      'surface-2': '#20170f',
      'surface-3': '#271c13',
      'text-primary': '#f8efe4',
      'text-secondary': '#cfc1ae',
      'text-muted': '#a59481',
    },
    roles: { accent: '#ffb84d', danger: '#ff6a55', success: '#8cc46a', warning: '#ff8f4a', pro: '#b39bff' },
    glass: { blur: 16, tint: '#120c08', opacity: 0.5 },
    world: savannaDawnWorld,
  },
  {
    id: 'christmas-eve',
    name: 'Christmas Eve',
    role: 'Night before Christmas',
    machine: 'a laptop and a mug of cocoa by the armchair',
    around: 'a living room on Christmas Eve, the tree, the fireplace, a sleigh across the moon',
    weight: 1,
    anchors: {
      'surface-0': '#0d0a0c',
      'surface-1': '#141013',
      'surface-2': '#1b1519',
      'surface-3': '#231b20',
      'text-primary': '#f8eeee',
      'text-secondary': '#cbbfc0',
      'text-muted': '#9d8f91',
    },
    roles: { accent: '#ff6b6b', danger: '#ff7a3c', success: '#6fd98a', warning: '#ffc35a', pro: '#b49aff' },
    fills: { danger: 400 },
    glass: { blur: 16, tint: '#0d0a0c', opacity: 0.5 },
    world: christmasEveWorld,
  },
  {
    id: 'jazz-night',
    name: 'Jazz Night',
    role: 'Jazz pianist',
    machine: 'a laptop on a grand piano',
    around: 'a hilltop at blue hour, a lamp post, a city of lights',
    weight: 1,
    anchors: {
      'surface-0': '#0a0b18',
      'surface-1': '#0f1121',
      'surface-2': '#14172b',
      'surface-3': '#1b1e36',
      'text-primary': '#eef0fd',
      'text-secondary': '#bec3dc',
      'text-muted': '#8f95b0',
    },
    roles: { accent: '#8aa4ff', danger: '#ff6b7a', success: '#5fe0a8', warning: '#ffc76a', pro: '#c99aff' },
    glass: { blur: 16, tint: '#0a0b18', opacity: 0.5 },
    world: jazzNightWorld,
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

/** A moment carries its own class beside its activity's, so a world's scenery reacts to it as to that activity. */
function classesOf(activity: Act, ultra: boolean, helpers: number): string {
  const base = BASE[activity]
  const own = base === activity ? '' : ` st-${activity}`

  return `st-${base}${own}${ultra ? ' ultra' : ''}${helpers > 0 ? ' helper' : ''}`
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
export const DOING: Record<Act, string> = {
  idle: 'is waiting for you',
  thinking: 'is thinking',
  responding: 'is writing',
  tool: 'is using a tool',
  read: 'is reading files',
  run: 'is running a command',
  web: 'is searching the web',
  error: 'hit an error',
  done: 'is done',
  listening: 'is listening',
  heard: 'is on it',
  asking: 'is waiting for your answer',
  editing: 'is editing files',
  searching: 'is searching the code',
  planning: 'is planning',
  tidying: 'is tidying the desk',
  sleeping: 'is dozing',
  startled: 'was stopped',
}
