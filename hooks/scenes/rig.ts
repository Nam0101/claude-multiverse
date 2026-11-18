import type { Act, Activity } from '../../types'
import { f, gear, random } from './kit'

// Claude at the desk, drawn in the desk's own 420×460 box (x right, y down; the floor at 456). One builder serves the
// backdrop, a subagent's desk and the tiny Claude in the band, so all three make the same moves.
// Claude is a pixel critter in each universe's own gear. The screen is the only light, and its color and rhythm say
// what Claude is doing, which still reads where the frosted glass blurs the small things.

export type Head = 'hair' | 'headset' | 'dive' | 'goggles' | 'none'
export type Seat = 'chair' | 'stool' | 'none'
export type Table = 'desk' | 'console' | 'bench' | 'none'
export type Machine = 'laptop' | 'crt' | 'panel' | 'holo' | 'typewriter' | 'keys'
export type Cup = 'mug' | 'glass' | 'tea' | 'acorn' | 'none'
export type Thought = 'dust' | 'bits' | 'bubbles' | 'smoke' | 'spores' | 'orbs' | 'puffs' | 'none'

export type Rig = {
  head: Head
  seat: Seat
  table: Table
  machine: Machine
  cup: Cup
  thought: Thought
  /** Only the hands are left (the anomaly). */
  handsOnly?: boolean
  /** Zero gravity: Claude and the keyboard drift up and down. */
  floating?: boolean
  /** The darkest tone: the critter's eyes and shadow side. */
  ink: string
  /** The desk and the seat, a shade lighter than the ink. */
  furniture: string
  /** The machine's body. */
  metal: string
  paper: string
  /** The screen's light: waiting, working, busy with a tool. */
  light: { idle: string; work: string; bright: string }
  /**
   * A world's own gear for the critter, in place of `head`: markup behind its body and over it, in the desk's box
   * (build it with `cell`; the body is cells 2..12 across, 0..7 down).
   */
  wear?: { behind?: string; front?: string }
  /** How high the world's own gear reaches at x 206, where the antenna goes up; the body's top (238) without one. */
  headTop?: number
  /** A world's own machine on the desk, in place of `machine`: its light's color and Claude's activity give the markup. */
  device?: (light: string, activity: Activity) => string
  /** Where a world's own machine glows from, when it has one. */
  glowAt?: P
  /** A world's own seat and desk, in place of `seat` and `table`: the seat's top at 350, the desk's at 330. */
  seatArt?: string
  tableArt?: string
}

export type P = readonly [number, number]
type Look = 'screen' | 'window' | 'up' | 'down' | 'antenna' | 'prompt' | 'x' | 'happy' | 'wide' | 'shut'
/** Where an arm is, in cells, and how it moves. */
type Nub = { col: number; row: number; w?: number; h?: number; cls?: string; style?: string }
/** `body`: classes on the whole critter, outermost first, one group each. `gaze`: how the eyes move around `look`. */
type Pose = { look: Look; near: Nub; far: Nub; body?: string; blink: boolean; gaze?: string }

/** The activity each moment stands for: what a world's scenery, its machine and its CSS see. */
export const BASE: Record<Act, Activity> = {
  idle: 'idle',
  thinking: 'thinking',
  responding: 'responding',
  tool: 'tool',
  read: 'read',
  run: 'run',
  web: 'web',
  error: 'error',
  done: 'done',
  listening: 'idle',
  heard: 'idle',
  asking: 'idle',
  editing: 'tool',
  searching: 'read',
  planning: 'tool',
  tidying: 'idle',
  sleeping: 'idle',
  startled: 'idle',
}

// The critter is pixel art on a 16-unit grid: a body ten cells wide and seven tall, a nub of an arm on each side, four
// legs. Cell (0, 0) is at (38, 238), so it sits on the seat at 350 with its near arm on the keys at 262.
export const U = 16
export const X0 = 38
export const Y0 = 238
export const CORAL = '#d97757'
const ULTRA_BODY = '#7d5cf0'
const ERROR_LIGHT = '#e5484d'
const DONE_LIGHT = '#3fbf6f'
const ASK_LIGHT = '#f5b942'
const SPARK = '#ffd23f'

const typing = (seconds: number): Pose => ({
  look: 'screen',
  near: { col: 12, row: 4, cls: 'tap', style: `--ty:${seconds}s` },
  far: { col: 0, row: 4, cls: 'tap tap2', style: `--ty:${seconds}s` },
  blink: true,
})

const RESTING: Pick<Pose, 'near' | 'far'> = { near: { col: 12, row: 4.5 }, far: { col: 0, row: 4 } }
// Raised arms are one cell wide, up the sides past the top, so they read as arms and not ears.
const HAND_UP: Nub = { col: 1, row: -1.5, w: 1, h: 3 }
const ARMS_UP: Pick<Pose, 'near' | 'far'> = { near: { col: 12, row: -1.25, w: 1, h: 4 }, far: { col: 1, row: -1.25, w: 1, h: 4 } }

const POSE_OF: Record<Act, Pose> = {
  // Waiting for you: looks out of the window, at its cup, at you; sips; stretches; on an 18 s loop.
  idle: {
    look: 'window',
    gaze: 'cl-idle',
    near: { col: 12, row: 4.5, cls: 'cl-sip' },
    far: { col: 0, row: 4, cls: 'cl-reach' },
    body: 'breathe',
    blink: true,
  },
  // Eyes darting between ideas, a hand tapping its chin.
  thinking: { look: 'up', gaze: 'cl-dart', near: { col: 12, row: 4.5 }, far: { col: 0, row: 2.5, cls: 'cl-chin' }, body: 'sway', blink: true },
  // Typing, glancing over at the chat now and then.
  responding: { ...typing(0.34), gaze: 'cl-glance' },
  tool: { ...typing(0.15), gaze: 'cl-flick' },
  // Typing fast with its eyes up on the antenna.
  web: { ...typing(0.15), look: 'antenna' },
  // Eyes running along the lines.
  read: { look: 'down', gaze: 'cl-scan', near: { col: 12, row: 4, cls: 'flip' }, far: { col: 0, row: 4 }, blink: true },
  // Presses Enter, leans back and watches the machines go, presses again.
  run: { look: 'screen', gaze: 'cl-watch', near: { col: 12, row: 4, cls: 'cl-enter' }, far: { col: 0, row: 4 }, body: 'cl-back', blink: true },
  // Flinches, then scratches its head, shaking, a drop of sweat running down.
  error: { look: 'x', ...RESTING, far: { ...HAND_UP, cls: 'scratch' }, body: 'cl-flinch shake', blink: false },
  done: {
    look: 'happy',
    near: { ...ARMS_UP.near, cls: 'wave' },
    far: { ...ARMS_UP.far, cls: 'wave', style: 'animation-delay:-.4s' },
    body: 'hop',
    blink: false,
  },
  // You typing: it leans toward the prompt box and watches it.
  listening: { look: 'prompt', ...RESTING, body: 'cl-lean', blink: true },
  // You sent it: a jump, eyes wide.
  heard: { look: 'wide', ...RESTING, body: 'cl-jump', blink: false },
  // Your turn to answer: a hand up, head tilted, looking at you.
  asking: { look: 'prompt', ...RESTING, far: { ...HAND_UP, cls: 'wave', style: 'animation-duration:1.2s' }, body: 'cl-tilt', blink: true },
  editing: typing(0.22),
  // Holding a magnifier up to its eyes, which flick about behind it.
  searching: { look: 'screen', gaze: 'cl-flick', near: { col: 12, row: 4 }, far: { col: 0, row: 4 }, blink: true },
  // Typing slowly, eyes up on the checklist.
  planning: { ...typing(0.5), look: 'antenna' },
  // Sweeping the desk with its near arm.
  tidying: { look: 'down', near: { col: 12, row: 4, cls: 'cl-sweep' }, far: { col: 0, row: 4 }, blink: true },
  sleeping: { look: 'shut', ...RESTING, body: 'cl-doze', blink: false },
  // Stopped mid-turn: it jumps, arms up, eyes wide.
  startled: { look: 'wide', ...ARMS_UP, body: 'cl-jolt', blink: false },
}

/** Where each machine's light comes from. */
const MACHINES: Record<Machine, { glow: P }> = {
  laptop: { glow: [318, 268] },
  crt: { glow: [292, 280] },
  panel: { glow: [332, 292] },
  holo: { glow: [344, 252] },
  typewriter: { glow: [293, 262] },
  keys: { glow: [298, 252] },
}

export const RIG_STYLE =
  '.cr{shape-rendering:crispEdges}' +
  '.tap{animation:tap var(--ty,.34s) ease-in-out infinite alternate}' +
  '.tap2{animation-delay:calc(var(--ty,.34s) * -1)}' +
  '@keyframes tap{from{transform:translateY(0)}to{transform:translateY(-9px)}}' +
  '.flip{animation:flip .55s ease-in-out infinite alternate}' +
  '@keyframes flip{from{transform:translateX(-12px)}to{transform:translateX(4px)}}' +
  '.scratch{animation:scratch .22s ease-in-out infinite alternate}' +
  '@keyframes scratch{from{transform:translate(-3px,0)}to{transform:translate(4px,-4px)}}' +
  '.shake{animation:shake .5s ease-in-out infinite}' +
  '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}' +
  '.hop{animation:hop 1.2s ease-out 3}' +
  '@keyframes hop{0%,40%,100%{transform:translateY(0)}20%{transform:translateY(-18px)}}' +
  '.wave{animation:wave .8s ease-in-out infinite alternate}' +
  '@keyframes wave{from{transform:translateY(0)}to{transform:translateY(-8px)}}' +
  '.breathe{transform-box:fill-box;transform-origin:50% 100%;animation:breathe 4.5s ease-in-out infinite}' +
  '@keyframes breathe{50%{transform:scale(1.015,1.03)}}' +
  '.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 3.2s ease-in-out infinite alternate}' +
  '@keyframes sway{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}' +
  '.blink{transform-box:fill-box;transform-origin:center;animation:blink 4.2s steps(1) infinite}' +
  '@keyframes blink{0%,94%{transform:scaleY(1)}95%,99%{transform:scaleY(.15)}}' +
  '.peek{animation:peek 9s ease-in-out infinite}' +
  '@keyframes peek{0%,30%,100%{transform:translate(0,0)}40%,80%{transform:translate(-10px,-2px)}}' +
  // A subagent is born: Claude squashes and pops, and a small Claude shoots up out of it toward the portal.
  '.pop{transform-box:fill-box;transform-origin:50% 100%;animation:pop .9s ease-out both}' +
  '@keyframes pop{0%{transform:scale(1)}25%{transform:scale(1.14,.84)}50%{transform:scale(.9,1.12)}75%{transform:scale(1.03,.97)}100%{transform:scale(1)}}' +
  '.spawn-fly{opacity:0;animation:spawn-fly 1.7s cubic-bezier(.3,.7,.4,1) .3s both}' +
  '@keyframes spawn-fly{0%{opacity:0;transform:translate(0,0) scale(.3)}12%{opacity:1;transform:translate(0,-70px) scale(1)}88%{opacity:1}100%{opacity:0;transform:translate(var(--fx,140px),var(--fy,-760px)) scale(.55)}}' +
  '.spawn-ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:spawn-ring 1.1s ease-out .15s both}' +
  '@keyframes spawn-ring{0%{opacity:0;transform:scale(.2)}6%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(3.2)}}' +
  '.bob{animation:bob 5s ease-in-out infinite alternate}' +
  '@keyframes bob{to{transform:translateY(-12px)}}' +
  '.pg{animation:pg 1.1s ease-in-out infinite}' +
  '@keyframes pg{0%{transform:scaleX(1)}45%,100%{transform:scaleX(-1)}}' +
  '.ant{animation:ant .8s ease-out both}' +
  '@keyframes ant{from{transform:scaleY(.1)}to{transform:scaleY(1)}}' +
  '.sig{opacity:0;animation:sig 1.6s ease-out infinite}' +
  '@keyframes sig{0%{opacity:0;transform:scale(.5)}30%{opacity:.85}100%{opacity:0;transform:scale(1.5)}}' +
  '.th{opacity:0;animation:th var(--th,3.6s) ease-out infinite}' +
  '@keyframes th{0%{opacity:0;transform:translate(0,0) scale(.6)}18%{opacity:.85}100%{opacity:0;transform:translate(var(--dx,8px),-150px) scale(1.25)}}' +
  '.smk{stroke-dasharray:.35 .65;animation:smk 4.5s linear infinite}' +
  '@keyframes smk{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
  '.gl{animation:gl var(--gl,6s) ease-in-out infinite alternate}' +
  '@keyframes gl{from{opacity:.6}to{opacity:1}}' +
  '.gl-once{animation:gl-once 2.4s ease-out both}' +
  '@keyframes gl-once{0%{opacity:.3}30%{opacity:1}100%{opacity:.8}}' +
  '.cur{animation:cur 1.06s steps(1) infinite}' +
  '@keyframes cur{50%{opacity:0}}' +
  '.drip{opacity:0;animation:drip 2.2s ease-in infinite}' +
  '@keyframes drip{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(16px)}}' +
  '.tw-g{animation:none}' +
  '.st-responding .tw-g{animation:mv-spin 6s linear infinite}' +
  '.st-tool .tw-g,.st-run .tw-g,.st-web .tw-g,.st-read .tw-g{animation:mv-spin 1.6s linear infinite}' +
  'svg .tw-g.tw-r{animation-name:mv-spin-back}' +
  // The power-up.
  '.ul-fl{animation:ul-fl .7s ease-in-out infinite alternate}' +
  '@keyframes ul-fl{from{transform:scaleY(.82)}to{transform:scaleY(1.12)}}' +
  '.ul-glow{animation:gl 1.6s ease-in-out infinite alternate}' +
  '.ul-zap{opacity:0;animation:ul-zap 2.4s linear infinite}' +
  // FOR PEOPLE SENSITIVE TO FLASHING LIGHT: three bolts, each flashing once per 2.4 s a third of a period apart:
  // at most 1.25 flashes a second. Keep it under 3.
  '@keyframes ul-zap{0%,12%,100%{opacity:0}2%{opacity:.9}5%{opacity:.25}8%{opacity:.8}}' +
  '.ul-spark{opacity:0;animation:ul-spark 2s ease-out infinite}' +
  '@keyframes ul-spark{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-190px);opacity:0}}' +
  // Waiting: one 18 s loop for the eyes, the near arm (a sip, then a stretch), the far arm and the cup.
  '.cl-idle{animation:cl-idle 18s ease-in-out infinite}' +
  '@keyframes cl-idle{0%,28%,100%{transform:translate(0,0)}33%,44%{transform:translate(44px,6px)}49%,66%{transform:translate(4px,14px)}71%,84%{transform:translate(16px,-8px)}}' +
  '.cl-sip{animation:cl-sip 18s ease-in-out infinite}' +
  '@keyframes cl-sip{0%,30%,47%,70%,88%,100%{transform:translate(0,0)}34%,44%{transform:translate(0,-36px)}74%,84%{transform:translate(4px,-58px)}}' +
  '.cl-reach{animation:cl-reach 18s ease-in-out infinite}' +
  '@keyframes cl-reach{0%,70%,88%,100%{transform:translate(0,0)}74%,84%{transform:translate(-4px,-62px)}}' +
  '.cl-hcup{opacity:0;animation:cl-hcup 18s linear infinite}' +
  '@keyframes cl-hcup{0%,31%,46%,100%{opacity:0}33%,44%{opacity:1}}' +
  '.cl-cup{animation:cl-cup 18s linear infinite}' +
  '@keyframes cl-cup{0%,31%,46%,100%{opacity:1}33%,44%{opacity:0}}' +
  // The eyes at work.
  '.cl-dart{animation:cl-dart 5.2s ease-in-out infinite}' +
  '@keyframes cl-dart{0%,30%,90%,100%{transform:translate(0,0)}35%,58%{transform:translate(-14px,2px)}63%,86%{transform:translate(14px,-2px)}}' +
  '.cl-chin{animation:cl-chin 1.3s ease-in-out infinite}' +
  '@keyframes cl-chin{50%{transform:translateY(-4px)}}' +
  '.cl-glance{animation:cl-glance 7s ease-in-out infinite}' +
  '@keyframes cl-glance{0%,72%,92%,100%{transform:translate(0,0)}76%,88%{transform:translate(-30px,10px)}}' +
  '.cl-flick{animation:cl-flick 1.7s steps(1) infinite}' +
  '@keyframes cl-flick{0%{transform:translate(0,0)}40%{transform:translate(6px,-3px)}70%{transform:translate(-4px,2px)}}' +
  '.cl-scan{animation:cl-scan 2.7s linear infinite}' +
  '@keyframes cl-scan{0%,100%{transform:translate(-8px,0)}30%{transform:translate(8px,0)}33.3%{transform:translate(-8px,4px)}63%{transform:translate(8px,4px)}66.6%{transform:translate(-8px,8px)}97%{transform:translate(8px,8px)}}' +
  '.cl-enter{animation:cl-enter 5s ease-in-out infinite}' +
  '@keyframes cl-enter{0%,16%,100%{transform:translateY(0)}7%{transform:translateY(-22px)}11%{transform:translateY(3px)}}' +
  '.cl-back{animation:cl-back 5s ease-in-out infinite}' +
  '@keyframes cl-back{0%,16%,94%,100%{transform:translate(0,0)}26%,86%{transform:translate(-5px,-1px)}}' +
  '.cl-watch{animation:cl-watch 5s ease-in-out infinite}' +
  '@keyframes cl-watch{0%,16%,94%,100%{transform:translate(0,0)}26%,86%{transform:translate(-26px,-12px)}}' +
  // One-shot moves as a moment begins.
  '.cl-flinch{animation:cl-flinch .5s ease-out both}' +
  '@keyframes cl-flinch{30%{transform:translateY(-10px)}}' +
  '.cl-jump{animation:cl-jump .6s ease-out both}' +
  '@keyframes cl-jump{35%{transform:translateY(-16px)}70%{transform:translateY(2px)}}' +
  '.cl-jolt{animation:cl-jolt .55s cubic-bezier(.2,.8,.4,1) both}' +
  '@keyframes cl-jolt{30%{transform:translateY(-22px)}65%{transform:translateY(3px)}}' +
  '.cl-lean{animation:cl-lean .5s ease-out both}' +
  '@keyframes cl-lean{to{transform:translate(-6px,1px)}}' +
  '.cl-in{transform-box:fill-box;transform-origin:50% 100%;animation:cl-in .4s cubic-bezier(.3,1.5,.5,1) both}' +
  '@keyframes cl-in{from{transform:scale(0)}}' +
  '.cl-tilt{transform-box:fill-box;transform-origin:50% 100%;animation:cl-tilt 3s ease-in-out infinite alternate}' +
  '@keyframes cl-tilt{from{transform:rotate(-3deg)}to{transform:rotate(1deg)}}' +
  '.cl-doze{animation:cl-doze 4.8s ease-in-out infinite}' +
  '@keyframes cl-doze{50%{transform:translateY(4px)}}' +
  '.cl-sweep{animation:cl-sweep .7s ease-in-out infinite alternate}' +
  '@keyframes cl-sweep{to{transform:translateX(34px)}}' +
  // What goes with each moment: the dots, the cards, the magnifier, the Zs, the sweat, the confetti.
  '.cl-dot{animation:cl-dot 1s ease-in-out infinite}' +
  '@keyframes cl-dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}' +
  '.cl-bob{animation:cl-bob 1.6s ease-in-out infinite alternate}' +
  '@keyframes cl-bob{to{transform:translateY(-4px)}}' +
  '.cl-ink{stroke-dasharray:1;animation:cl-ink 3s ease-out infinite both}' +
  '@keyframes cl-ink{0%{stroke-dashoffset:1;opacity:1}22%,82%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}' +
  '.cl-mag{transform-box:fill-box;transform-origin:100% 100%;animation:cl-mag 1.8s ease-in-out infinite alternate}' +
  '@keyframes cl-mag{from{transform:rotate(-10deg)}to{transform:rotate(14deg)}}' +
  '.cl-z,.cl-cf,.cl-fly,.cl-puff,.cl-shock{opacity:0;transform-box:fill-box;transform-origin:center}' +
  '.cl-z{animation:cl-z 4.5s ease-out infinite}' +
  '@keyframes cl-z{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:.9}100%{opacity:0;transform:translate(34px,-64px) scale(1.3)}}' +
  '.cl-cf{animation:cl-cf 1.8s cubic-bezier(.2,.7,.4,1) both}' +
  '@keyframes cl-cf{0%{opacity:0;transform:translate(0,0) rotate(0)}12%,75%{opacity:1}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr))}}' +
  '.cl-fly{animation:cl-fly 1.5s ease-in infinite}' +
  '@keyframes cl-fly{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:.9}100%{opacity:0;transform:translate(var(--fx),var(--fy)) rotate(var(--fr))}}' +
  '.cl-puff{animation:cl-puff 1.2s ease-out infinite}' +
  '@keyframes cl-puff{0%{opacity:0;transform:translate(0,0) scale(.5)}30%{opacity:.7}100%{opacity:0;transform:translate(8px,-24px) scale(1.6)}}' +
  '.cl-sweat{opacity:0;animation:cl-sweat 1.6s ease-in infinite}' +
  '@keyframes cl-sweat{0%{opacity:0;transform:translateY(0)}25%{opacity:.9}100%{opacity:0;transform:translateY(20px)}}' +
  // Two small bursts a second apart: well under three flashes a second.
  '.cl-shock{animation:cl-shock .9s ease-out 2 both}' +
  '@keyframes cl-shock{0%{opacity:0;transform:scale(.6)}25%{opacity:1}100%{opacity:0;transform:scale(1.25)}}'

/** A cell's rectangle, in cells from the critter's corner. */
export function cell(col: number, row: number, w = 1, h = 1, attributes = ''): string {
  return `<rect x="${f(X0 + col * U)}" y="${f(Y0 + row * U)}" width="${f(w * U)}" height="${f(h * U)}"${attributes}/>`
}

/** Two hex colors mixed in sRGB, `by` of the way from `a` to `b`. */
export function mix(a: string, b: string, by: number): string {
  const channel = (hex: string, at: number) => parseInt(hex.slice(at, at + 2), 16)

  return (
    '#' +
    [1, 3, 5]
      .map(at =>
        Math.round(channel(a, at) + (channel(b, at) - channel(a, at)) * by)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/** Where the eyes sit for each way of looking: the two columns and the top row, in cells. */
const GAZE: Record<'screen' | 'window' | 'up' | 'down' | 'antenna' | 'prompt', readonly [number, number, number]> = {
  screen: [6, 9, 2],
  window: [4, 7, 1.5],
  up: [5, 8, 1],
  down: [6, 9, 3],
  // Up and to the right: the antenna, a card over the machine.
  antenna: [6.5, 9.5, 0.75],
  // Down and to the left, where the chat's prompt box is.
  prompt: [4, 7, 2.5],
}

/**
 * The eyes, by where they look: two tall pixels, an ✕ each on an error, a ^ each when done, big and shining when
 * surprised, a line each asleep. `gaze` moves them around where they look.
 */
function eyes(look: Look, color: string, blink: boolean, gaze?: string): string {
  const half = U / 2
  const sub = (col: number, row: number, cells: readonly P[]) =>
    cells.map(([x, y]) => `<rect x="${f(X0 + col * U + x * half)}" y="${f(Y0 + row * U + y * half)}" width="${half}" height="${half}"/>`).join('')

  if (look === 'x') {
    const cross: P[] = [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]

    return `<g fill="${color}">${sub(4.75, 2, cross)}${sub(8.25, 2, cross)}</g>`
  }

  if (look === 'happy') {
    const arc: P[] = [[1, 0], [0, 1], [2, 1]]

    return `<g fill="${color}">${sub(4.75, 2.25, arc)}${sub(8.25, 2.25, arc)}</g>`
  }

  if (look === 'wide') {
    const shine = ' fill="#ffffff" fill-opacity=".85"'

    return (
      `<g fill="${color}">${cell(4.75, 1.25, 1.5, 2.5)}${cell(8, 1.25, 1.5, 2.5)}</g>` +
      cell(4.9, 1.45, 0.4, 0.4, shine) +
      cell(8.15, 1.45, 0.4, 0.4, shine)
    )
  }

  if (look === 'shut') {
    return `<g fill="${color}">${cell(4.75, 3, 1.5, 0.375)}${cell(8, 3, 1.5, 0.375)}</g>`
  }

  const [left, right, row] = GAZE[look]
  const pair = cell(left, row, 1, 2) + cell(right, row, 1, 2)
  const moving = gaze ?? (look === 'window' ? 'peek' : undefined)
  const moved = moving === undefined ? pair : `<g class="${moving}">${pair}</g>`

  return `<g fill="${color}"${blink ? ' class="blink"' : ''}>${moved}</g>`
}

function nub(spec: Nub, color: string): string {
  return (
    `<g${spec.cls === undefined ? '' : ` class="${spec.cls}"`}${spec.style === undefined ? '' : ` style="${spec.style}"`} fill="${color}">` +
    `${cell(spec.col, spec.row, spec.w ?? 2, spec.h ?? 2)}</g>`
  )
}

function cupShape(cup: Cup, ink: string, light: string, paper: string): string {
  switch (cup) {
    case 'mug':
      return `<rect x="-7" y="-14" width="14" height="15" rx="3" fill="${ink}"/><path d="M7 -10 q7 0 7 5 q0 5 -7 5" fill="none" stroke="${ink}" stroke-width="3"/>`
    case 'glass':
      return `<rect x="-7" y="-20" width="14" height="21" rx="2" fill="${light}" fill-opacity=".18" stroke="${ink}" stroke-width="2"/><rect x="-6" y="-9" width="12" height="9" fill="#3a2414"/>`
    case 'tea':
      return `<path d="M-9 -9 h18 q-2 10 -9 10 q-7 0 -9 -10z" fill="${paper}" fill-opacity=".55"/>`
    case 'acorn':
      return `<path d="M-8 -6 h16 q0 8 -8 8 q-8 0 -8 -8z" fill="${ink}"/><path d="M-9 -7 q9 -9 18 0z" fill="#5a4a2a"/>`
    case 'none':
      return ''
  }
}

/** What each universe's Claude wears: behind the body (a backpack) and over it (a hat, a helmet). */
function accessory(rig: Rig, light: string): { behind: string; front: string } {
  const m = rig.metal
  const c = rig.furniture

  switch (rig.head) {
    case 'hair':
      // The familiar one wears nothing.
      return { behind: '', front: '' }
    case 'headset':
      return {
        behind: '',
        front:
          `<path d="M${X0 + 2.5 * U} ${Y0 + 8} V${Y0 - 12} H${X0 + 11.5 * U} V${Y0 + 8}" fill="none" stroke="${m}" stroke-width="6"/>` +
          `<g fill="${m}">${cell(11.25, 0.75, 1, 2.25)}</g>` +
          `<line x1="${X0 + 12.25 * U}" y1="${Y0 + 2.5 * U}" x2="${X0 + 13.5 * U}" y2="${Y0 + 3.4 * U}" stroke="${m}" stroke-width="4"/>` +
          `<rect x="${X0 + 13.5 * U - 4}" y="${Y0 + 3.4 * U - 4}" width="8" height="8" fill="${light}"/>`,
      }
    case 'dive':
      return {
        behind: '',
        front:
          `<rect x="${X0 + 1.5 * U}" y="${Y0 - 2 * U}" width="${11 * U}" height="${7.25 * U}" rx="40" fill="${light}" fill-opacity=".08" ` +
          `stroke="${m}" stroke-width="8"/>` +
          `<g fill="${m}">${cell(1, 5, 12, 0.75)}</g>` +
          `<g fill="${light}" fill-opacity=".45">${cell(2.25, 5.2, 0.35, 0.35)}${cell(6.8, 5.2, 0.35, 0.35)}${cell(11.4, 5.2, 0.35, 0.35)}</g>` +
          `<path d="M${X0 + 10 * U} ${Y0 - 1.25 * U} q${2 * U} 4 ${2.25 * U} ${2 * U}" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>`,
      }
    case 'goggles':
      return {
        behind: '',
        front:
          `<g fill="${m}">${cell(2, 0.25, 10, 0.5)}</g>` +
          `<g fill="${light}" fill-opacity=".55" stroke="${m}" stroke-width="3">` +
          `<circle cx="${X0 + 5.5 * U}" cy="${Y0 + 0.5 * U}" r="11"/><circle cx="${X0 + 8.5 * U}" cy="${Y0 + 0.5 * U}" r="11"/></g>`,
      }
    case 'none':
      return { behind: '', front: '' }
  }
}

/** How high each head reaches at the antenna's foot (x 206): the antenna goes up from there. */
const HEAD_TOP: Record<Head, number> = {
  hair: Y0,
  headset: Y0 - 12,
  dive: Y0 - 2 * U,
  goggles: Y0,
  none: Y0,
}

/**
 * The critter: the far arm, the body with its legs, eyes and what it wears; and apart from them the near arm, which is
 * drawn over the desk so it rests on the keys. Lit from the screen: its far side in shadow, a rim of light on the near.
 */
function critter(rig: Rig, pose: Pose, color: string, light: string, bright: boolean): { body: string; near: string } {
  if (rig.handsOnly === true) {
    // Nothing left but the arms and the eyes, which the screen lights.
    return {
      body: `<g class="cr">${nub(pose.far, color)}${eyes(pose.look, light, pose.blink, pose.gaze)}</g>`,
      near: `<g class="cr">${nub(pose.near, color)}</g>`,
    }
  }

  const wear = rig.wear === undefined ? accessory(rig, light) : { behind: rig.wear.behind ?? '', front: rig.wear.front ?? '' }
  const lit = bright
    ? ''
    : cell(2, 0, 3, 7, ` fill="${rig.ink}" fill-opacity=".22"`) + cell(11, 0, 1, 7, ` fill="${light}" fill-opacity=".28"`)
  const legs = [3, 5, 8, 10].map(col => cell(col, 7, 1, 1.5)).join('')

  return {
    body:
      `<g class="cr">${wear.behind}${nub(pose.far, color)}<g fill="${color}">${cell(2, 0, 10, 7)}${legs}</g>${lit}` +
      `${eyes(pose.look, mix(rig.ink, '#000000', 0.4), pose.blink, pose.gaze)}${wear.front}</g>`,
    near: `<g class="cr">${nub(pose.near, color)}</g>`,
  }
}

function seat(rig: Rig): string {
  const c = rig.furniture

  switch (rig.seat) {
    case 'chair':
      return (
        `<g fill="${c}"><rect x="106" y="262" width="15" height="92" rx="7"/><rect x="112" y="350" width="78" height="12" rx="5"/>` +
        `<rect x="146" y="362" width="9" height="62" rx="3"/><rect x="114" y="434" width="72" height="7" rx="3"/>` +
        `<circle cx="118" cy="447" r="6"/><circle cx="182" cy="447" r="6"/></g>`
      )
    case 'stool':
      return (
        `<g fill="${c}" stroke="${c}" stroke-width="7" stroke-linecap="round"><rect x="110" y="349" width="82" height="11" rx="5" stroke="none"/>` +
        `<line x1="120" y1="360" x2="110" y2="454"/><line x1="182" y1="360" x2="192" y2="454"/><line x1="116" y1="410" x2="186" y2="410" stroke-width="4"/></g>`
      )
    case 'none':
      return ''
  }
}

function table(rig: Rig): string {
  const c = rig.furniture

  switch (rig.table) {
    case 'desk':
      return `<g fill="${c}"><rect x="168" y="330" width="300" height="12" rx="2"/><rect x="178" y="342" width="12" height="114"/></g>`
    case 'console':
      return (
        `<path d="M170 330 L470 330 L470 456 L198 456Z" fill="${c}"/>` +
        `<line x1="170" y1="331" x2="470" y2="331" stroke="${rig.light.work}" stroke-opacity=".25" stroke-width="2"/>`
      )
    case 'bench':
      return (
        `<g fill="${c}"><rect x="166" y="326" width="304" height="18" rx="2"/><rect x="176" y="344" width="16" height="112"/>` +
        `<rect x="164" y="312" width="20" height="16" rx="2"/></g>`
      )
    case 'none':
      return ''
  }
}

function machine(rig: Rig, light: string, activity: Activity): string {
  const m = rig.metal

  switch (rig.machine) {
    case 'laptop':
      return (
        `<rect x="246" y="323" width="88" height="7" rx="2" fill="${m}"/>` +
        `<path d="M328 327 L334 248 L341 249 L335 328Z" fill="${m}"/>` +
        `<line x1="329" y1="324" x2="335" y2="251" stroke="${light}" stroke-width="2.5"/>`
      )
    case 'crt':
      return (
        `<rect x="236" y="321" width="64" height="8" rx="2" fill="${m}"/>` +
        `<rect x="300" y="238" width="110" height="86" rx="6" fill="${m}"/><rect x="330" y="324" width="50" height="6" fill="${m}"/>` +
        `<path d="M302 246 q-12 34 0 70" fill="none" stroke="${light}" stroke-width="4"/>`
      )
    case 'panel':
      return (
        `<path d="M296 326 L358 326 L372 266 L318 262Z" fill="${light}" fill-opacity=".5" stroke="${m}" stroke-width="5"/>` +
        `<g fill="${light}" fill-opacity=".8"><circle cx="208" cy="338" r="3"/><circle cx="224" cy="338" r="3"/><circle cx="240" cy="338" r="3"/>` +
        `<circle cx="256" cy="338" r="3"/></g><rect x="270" y="320" width="56" height="8" rx="2" fill="${m}"/>`
      )
    case 'holo':
      return (
        `<g class="bob" style="animation-duration:4s">` +
        `<rect x="304" y="214" width="80" height="76" rx="6" fill="${light}" fill-opacity=".16" stroke="${light}" stroke-opacity=".7" stroke-width="2"/>` +
        `<g stroke="${light}" stroke-opacity=".55" stroke-width="2"><line x1="314" y1="232" x2="360" y2="232"/><line x1="314" y1="246" x2="372" y2="246"/><line x1="314" y1="260" x2="350" y2="260"/></g>` +
        `<rect x="240" y="312" width="64" height="8" rx="3" fill="${m}"/>` +
        `<g fill="${light}" fill-opacity=".6">${[248, 258, 268, 278, 288, 298].map(x => `<rect x="${x}" y="314" width="4" height="3"/>`).join('')}</g></g>`
      )
    case 'typewriter':
      return (
        `<path d="M236 328 L246 300 L334 300 L344 328Z" fill="${m}"/><rect x="244" y="288" width="98" height="13" rx="6" fill="${rig.furniture}"/>` +
        `<rect x="266" y="236" width="54" height="56" fill="${rig.paper}" fill-opacity=".9"/>` +
        `<g stroke="${rig.ink}" stroke-width="2"><line x1="272" y1="250" x2="312" y2="250"/><line x1="272" y1="260" x2="306" y2="260"/><line x1="272" y1="270" x2="314" y2="270"/></g>` +
        `<g fill="${light}" fill-opacity=".55">${[252, 264, 276, 288, 300, 312, 324].map(x => `<circle cx="${x}" cy="316" r="3"/>`).join('')}</g>` +
        `<g transform="translate(360 306)"><g class="tw-g"><path d="${gear(20, 12)}" fill="${m}" fill-rule="evenodd"/></g></g>` +
        `<g transform="translate(386 286)"><g class="tw-g tw-r" style="animation-duration:1.1s"><path d="${gear(13, 8)}" fill="${m}" fill-rule="evenodd"/></g></g>`
      )
    case 'keys':
      return (
        `<g class="bob" style="animation-duration:4.4s"><rect x="248" y="326" width="86" height="9" rx="3" fill="${m}"/>` +
        `<g fill="${light}" fill-opacity=".35">${[256, 268, 280, 292, 304, 316].map(x => `<rect x="${x}" y="328" width="6" height="4"/>`).join('')}</g></g>` +
        `<rect class="cur" x="296" y="234" width="5" height="32" fill="${light}"/>`
      )
  }
}

/** The screen's light in a moment: its color, how strong it gets, and its rhythm. */
function lightOf(rig: Rig, activity: Act): { color: string; level: number; cls: string; seconds: number } {
  switch (activity) {
    case 'idle':
      return { color: rig.light.idle, level: 0.34, cls: 'gl', seconds: 7 }
    case 'listening':
      return { color: rig.light.idle, level: 0.38, cls: 'gl', seconds: 5 }
    case 'sleeping':
      return { color: rig.light.idle, level: 0.16, cls: 'gl', seconds: 9 }
    case 'heard':
    case 'tidying':
      return { color: rig.light.work, level: 0.46, cls: 'gl-once', seconds: 2.4 }
    case 'asking':
      return { color: ASK_LIGHT, level: 0.46, cls: 'gl', seconds: 2.4 }
    case 'startled':
      return { color: ASK_LIGHT, level: 0.5, cls: 'gl-once', seconds: 2.4 }
    case 'planning':
      return { color: rig.light.work, level: 0.56, cls: 'gl', seconds: 1.6 }
    case 'thinking':
      return { color: rig.light.work, level: 0.46, cls: 'gl', seconds: 3.2 }
    case 'responding':
      return { color: rig.light.work, level: 0.56, cls: 'gl', seconds: 1.1 }
    case 'error':
      return { color: ERROR_LIGHT, level: 0.62, cls: 'gl', seconds: 1.1 }
    case 'done':
      return { color: DONE_LIGHT, level: 0.62, cls: 'gl-once', seconds: 2.4 }
    default:
      return { color: rig.light.bright, level: 0.7, cls: 'gl', seconds: 0.8 }
  }
}

function glow(id: string, at: P, color: string, level: number, cls: string, seconds: number, small: boolean): string {
  const [x, y] = at
  const radius = small ? 190 : 300

  return (
    `<defs><radialGradient id="${id}-gl"><stop offset="0" stop-color="${color}" stop-opacity="${level}"/>` +
    `<stop offset=".4" stop-color="${color}" stop-opacity="${Math.round(level * 35) / 100}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<g class="${cls}" style="--gl:${seconds}s"><circle cx="${x}" cy="${y}" r="${radius}" fill="url(#${id}-gl)"/>` +
    `<polygon points="${x - 6},${y - 26} ${x - 6},${y + 26} ${x - 170},${y + 64} ${x - 170},${y - 86}" fill="${color}" fill-opacity="${Math.round(level * 18) / 100}"/></g>`
  )
}

function thoughts(kind: Thought, from: P, color: string): string {
  if (kind === 'none') {
    return ''
  }

  const next = random(17)
  const [x, y] = from

  if (kind === 'smoke') {
    return (
      `<g fill="none" stroke="${color}" stroke-opacity=".55" stroke-width="3" stroke-linecap="round">` +
      [0, 1, 2]
        .map(
          index =>
            `<path class="smk" pathLength="1" style="animation-delay:${-index * 1.5}s" ` +
            `d="M${x + index * 6} ${y} c-14 -24 18 -40 4 -66 c-12 -22 16 -38 6 -64"/>`,
        )
        .join('') +
      '</g>'
    )
  }

  const parts: string[] = []

  for (let index = 0; index < 7; index += 1) {
    const px = x + (next() - 0.5) * 30
    const py = y - next() * 10
    const style = `--dx:${f((next() - 0.5) * 50)}px;--th:${f(3 + next() * 1.8)}s;animation-delay:${f(-next() * 4)}s`
    const size = 3 + next() * 4
    let shape: string

    switch (kind) {
      case 'dust':
        shape = `<circle cx="${f(px)}" cy="${f(py)}" r="${f(size * 0.5)}" fill="${color}"/>`
        break
      case 'bits':
        shape = `<rect x="${f(px)}" y="${f(py)}" width="${f(size)}" height="${f(size)}" fill="${color}"/>`
        break
      case 'bubbles':
        shape = `<circle cx="${f(px)}" cy="${f(py)}" r="${f(size)}" fill="none" stroke="${color}" stroke-width="1.8"/>`
        break
      case 'spores':
        shape = `<circle cx="${f(px)}" cy="${f(py)}" r="${f(size * 0.7)}" fill="${color}" fill-opacity=".8"/>`
        break
      case 'orbs':
        shape = `<circle cx="${f(px)}" cy="${f(py)}" r="${f(size)}" fill="${color}" fill-opacity=".35" stroke="${color}" stroke-width="1"/>`
        break
      default:
        shape = `<g fill="${color}" fill-opacity=".6"><circle cx="${f(px)}" cy="${f(py)}" r="${f(size)}"/><circle cx="${f(px + size)}" cy="${f(py - 2)}" r="${f(size * 0.8)}"/></g>`
    }

    parts.push(`<g class="th" style="${style}">${shape}</g>`)
  }

  return parts.join('')
}

/** Papers and cups: the fuller the context, the more of them. */
function clutter(rig: Rig, level: number): string {
  if (level <= 0) {
    return ''
  }

  const paper = `fill="${rig.paper}" fill-opacity=".42"`
  const parts: string[] = [
    `<g ${paper}><rect x="172" y="324" width="40" height="3"/><rect x="175" y="320" width="38" height="3"/><rect x="171" y="316" width="40" height="3"/></g>`,
  ]

  if (level >= 2) {
    parts.push(`<g transform="translate(420 330)">${cupShape(rig.cup === 'none' ? 'mug' : rig.cup, rig.ink, rig.light.idle, rig.paper)}</g>`)
    parts.push(`<circle cx="226" cy="324" r="6" ${paper}/>`)
  }

  if (level >= 3) {
    parts.push(
      `<g ${paper}>${[0, 1, 2, 3, 4, 5, 6, 7].map(index => `<rect x="${398 + (index % 2) * 3}" y="${326 - index * 4}" width="40" height="3"/>`).join('')}</g>`,
    )
    parts.push(`<g transform="translate(446 330)">${cupShape('mug', rig.ink, rig.light.idle, rig.paper)}</g>`)
  }

  if (level >= 4) {
    parts.push(
      `<g ${paper}><rect x="140" y="450" width="40" height="3" transform="rotate(-8 160 451)"/>` +
        `<rect x="200" y="452" width="38" height="3" transform="rotate(6 219 453)"/>` +
        `${[0, 1, 2, 3, 4].map(index => `<rect x="${172 + (index % 2) * 4}" y="${312 - index * 4}" width="38" height="3"/>`).join('')}</g>`,
    )
  }

  return rig.floating ? `<g class="bob" style="animation-duration:6s">${parts.join('')}</g>` : parts.join('')
}

function notebook(rig: Rig): string {
  return (
    `<rect x="196" y="322" width="56" height="6" rx="1" fill="${rig.furniture}"/>` +
    `<rect x="198" y="319" width="52" height="4" fill="${rig.paper}" fill-opacity=".7"/>` +
    `<g transform="translate(224 320)"><path class="pg" d="M0 0 L26 -2 L26 -5 L0 -3Z" fill="${rig.paper}" fill-opacity=".9"/></g>`
  )
}

function antenna(top: P, light: string, ink: string): string {
  const [x, y] = top

  return (
    `<g transform="translate(${x} ${y})"><g class="ant"><line y2="-78" stroke="${ink}" stroke-width="4"/>` +
    `<circle cy="-80" r="5" fill="${light}"/></g>` +
    [0, 0.55, 1.1]
      .map(
        delay =>
          `<g transform="translate(0 -80)"><circle class="sig" style="animation-delay:${delay}s" r="16" fill="none" stroke="${light}" stroke-width="2"/></g>`,
      )
      .join('') +
    '</g>'
  )
}

function tongue(w: number, h: number): string {
  return (
    `M${f(-w / 2)} 0C${f(-w / 2)} ${f(-h * 0.4)} ${f(-w * 0.1)} ${f(-h * 0.7)} 0 ${f(-h)}` +
    `C${f(w * 0.1)} ${f(-h * 0.7)} ${f(w / 2)} ${f(-h * 0.4)} ${f(w / 2)} 0Z`
  )
}

/** The power-up behind Claude: golden flames, a glow, rising sparks; the bolts go in front. */
function aura(id: string): { behind: string; front: string } {
  const next = random(7)
  const flames = (count: number, spread: number, tallest: number, width: number, fill: string) =>
    Array.from({ length: count }, (_, index) => {
      const at = index / (count - 1) - 0.5
      const h = tallest * (1 - Math.abs(at) * 1.1) * (0.85 + next() * 0.3)

      return (
        `<g transform="translate(${f(150 + at * spread)} 390) rotate(${f(at * 30)})">` +
        `<path class="ul-fl" style="animation-duration:${(0.45 + next() * 0.4).toFixed(2)}s;animation-delay:${(-next()).toFixed(1)}s" ` +
        `d="${tongue(width, h)}" fill="url(#${id}-${fill})"/></g>`
      )
    }).join('')
  const bolt = (points: string, delay: number) =>
    `<g class="ul-zap" style="animation-delay:${delay}s" fill="none" stroke-linejoin="round" stroke-linecap="round">` +
    `<polyline points="${points}" stroke="#9fd8ff" stroke-width="7" stroke-opacity=".35"/><polyline points="${points}" stroke="#f2f8ff" stroke-width="2.5"/></g>`
  const sparks = Array.from({ length: 10 }, () => {
    const x = 150 + (next() - 0.5) * 200
    const y = 300 + next() * 60

    return `<rect class="ul-spark" style="animation-delay:${(-next() * 2).toFixed(1)}s" x="${f(x)}" y="${f(y)}" width="6" height="6" fill="${next() > 0.5 ? '#ffe27a' : '#ffb52e'}"/>`
  }).join('')

  return {
    behind:
      `<defs><radialGradient id="${id}-ug"><stop offset="0" stop-color="#fff3b0" stop-opacity=".5"/>` +
      `<stop offset=".4" stop-color="#ffcf3f" stop-opacity=".26"/><stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${id}-uo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9f1c" stop-opacity=".8"/>` +
      `<stop offset=".55" stop-color="#ffcf3f" stop-opacity=".5"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-ui" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/>` +
      `<stop offset=".6" stop-color="#ffe27a" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>` +
      `<circle class="ul-glow" cx="150" cy="270" r="240" fill="url(#${id}-ug)"/>` +
      flames(11, 240, 330, 58, 'uo') +
      flames(9, 170, 230, 42, 'ui'),
    front:
      sparks +
      bolt('70,150 92,190 74,204 108,252 94,268 120,304', 0) +
      bolt('300,120 278,166 298,178 266,226 284,242 258,286', 0.8) +
      bolt('196,60 178,96 200,108 172,144 186,156 164,184', 1.6),
  }
}

export type DeskState = {
  activity: Act
  clutter: number
  ultra: boolean
  /** A subagent is being born this moment: Claude pops and a small Claude flies off toward its portal. */
  spawning?: boolean
}

/** The small Claude a subagent starts as, centered on the head, its eyes on the way up. */
function hatchling(color: string, eyes: string): string {
  return (
    `<g transform="translate(${X0 + 7 * U} ${Y0 - 10})"><g class="spawn-fly"><g transform="scale(.42) translate(${-(X0 + 7 * U)} ${-(Y0 + 3.5 * U)})">` +
    `<g class="cr" fill="${color}">${cell(2, 0, 10, 7)}${[3, 5, 8, 10].map(col => cell(col, 7, 1, 1.5)).join('')}${cell(0, 3, 2, 2)}${cell(12, 3, 2, 2)}</g>` +
    `<g fill="${eyes}">${cell(5, 1, 1, 2)}${cell(8, 1, 1, 2)}</g></g></g></g>` +
    `<circle class="spawn-ring" cx="${X0 + 7 * U}" cy="${Y0 + 2 * U}" r="40" fill="none" stroke="${color}" stroke-width="6"/>`
  )
}

/** Just over the head, from the top of what it wears, never above the band's top edge (150). */
function over(top: number): number {
  return Math.max(top - 12, 200)
}

/** A bubble left of the head, its tail toward the prompt box, three dots bouncing: you are typing. */
function dots(rig: Rig, top: number): string {
  const x = 26
  const y = over(top) - 34

  return (
    `<g class="cl-in"><path d="M${x + 8} ${y} h44 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-30 l-10 8 v-8 h-4 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8z" ` +
    `fill="${rig.paper}" fill-opacity=".92" stroke="${rig.ink}" stroke-width="2"/>` +
    [0, 1, 2].map(index => `<circle class="cl-dot" style="animation-delay:${index * 0.15}s" cx="${x + 18 + index * 12}" cy="${y + 14}" r="3.5" fill="${rig.ink}"/>`).join('') +
    '</g>'
  )
}

/** An ! popping up over the head. */
function bang(rig: Rig, top: number): string {
  const y = over(top)

  return (
    `<g class="cl-in" fill="${SPARK}" stroke="${rig.ink}" stroke-width="3" paint-order="stroke">` +
    `<rect x="143" y="${y - 46}" width="14" height="28"/><rect x="143" y="${y - 14}" width="14" height="12"/></g>`
  )
}

/** A pixel ? in an amber bubble, up where the raised hand points. */
function question(rig: Rig, top: number): string {
  const y = over(top) - 50
  const mark: P[] = [[1, 0], [2, 0], [0, 1], [3, 1], [3, 2], [2, 3], [2, 5]]

  return (
    `<g class="cl-bob"><g class="cl-in"><rect x="24" y="${y}" width="48" height="44" rx="10" fill="${ASK_LIGHT}" stroke="${rig.ink}" stroke-width="2"/>` +
    `<g fill="${rig.ink}">${mark.map(([col, row]) => `<rect x="${36 + col * 6}" y="${y + 4 + row * 6}" width="6" height="6"/>`).join('')}</g></g></g>`
  )
}

/** A card hanging over the machine, a bar along its top, `rows` drawn on it. */
function card(rig: Rig, rows: string): string {
  return (
    `<g class="cl-in"><g transform="translate(300 160)"><rect width="96" height="58" rx="5" fill="${rig.paper}" fill-opacity=".94" stroke="${rig.ink}" stroke-width="2"/>` +
    `<rect x="1" y="1" width="94" height="9" rx="4" fill="${rig.ink}" fill-opacity=".28"/>${rows}</g></g>`
  )
}

/** A diff writing itself: a line out in red, two in green, one kept. */
function diff(rig: Rig): string {
  const lines: [string, number][] = [[ERROR_LIGHT, 62], [DONE_LIGHT, 74], [DONE_LIGHT, 50], [rig.ink, 66]]

  return card(
    rig,
    lines
      .map(([color, width], index) => {
        const y = 19 + index * 10

        return (
          `<rect x="6" y="${y - 3}" width="5" height="5" fill="${color}"/>` +
          `<line class="cl-ink" pathLength="1" style="animation-delay:${f(index * 0.35)}s" x1="16" y1="${y}" x2="${16 + width}" y2="${y}" stroke="${color}" stroke-width="5"/>`
        )
      })
      .join(''),
  )
}

/** A checklist ticking itself off. */
function checklist(rig: Rig): string {
  return card(
    rig,
    [58, 44, 52]
      .map((width, index) => {
        const y = 16 + index * 14

        return (
          `<rect x="8" y="${y}" width="9" height="9" fill="none" stroke="${rig.ink}" stroke-width="2"/>` +
          `<path class="cl-ink" pathLength="1" style="animation-delay:${f(index * 0.6)}s" d="M9 ${y + 4} l3 4 l7 -9" fill="none" stroke="${DONE_LIGHT}" stroke-width="3"/>` +
          `<line x1="24" y1="${y + 5}" x2="${24 + width}" y2="${y + 5}" stroke="${rig.ink}" stroke-opacity=".45" stroke-width="4"/>`
        )
      })
      .join(''),
  )
}

/** A magnifier held up from the near hand, swinging across the eyes. */
function lens(rig: Rig, light: string): string {
  return (
    `<g class="cl-mag"><line x1="184" y1="297" x2="236" y2="322" stroke="${rig.metal}" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="166" cy="286" r="22" fill="${light}" fill-opacity=".2" stroke="${rig.metal}" stroke-width="6"/>` +
    `<path d="M152 276 q6 -8 16 -8" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="3"/></g>`
  )
}

/** Papers flying off the desk's far end and dust puffing up where the arm sweeps. */
function sweepings(rig: Rig): string {
  const paper = `fill="${rig.paper}" fill-opacity=".7"`
  const papers: [number, number, number, number, number, number][] = [
    [388, 318, 52, 70, 40, 0],
    [404, 322, 66, 96, -30, -0.5],
    [376, 324, 40, 110, 70, -1],
  ]
  const dust: P[] = [[300, -0.2], [324, -0.9], [350, -0.5]]

  return (
    papers
      .map(
        ([x, y, fx, fy, fr, delay]) =>
          `<rect class="cl-fly" style="--fx:${fx}px;--fy:${fy}px;--fr:${fr}deg;animation-delay:${delay}s" x="${x}" y="${y}" width="30" height="4" ${paper}/>`,
      )
      .join('') +
    dust.map(([x, delay]) => `<circle class="cl-puff" style="animation-delay:${delay}s" cx="${x}" cy="324" r="5" ${paper}/>`).join('')
  )
}

/** Zs rising from the head. */
function snores(rig: Rig, top: number): string {
  const y = over(top) - 6

  return [0, 1, 2]
    .map(
      index =>
        `<path class="cl-z" style="animation-delay:${f(-index * 1.5)}s" d="M200 ${y} h11 l-11 11 h11" fill="none" stroke="${rig.paper}" stroke-width="3"/>`,
    )
    .join('')
}

/** A drop of sweat running down the near side of the head. */
function sweat(): string {
  return `<path class="cl-sweat" d="M222 ${Y0 + 6} q6 9 0 13 q-6 -4 0 -13z" fill="#8fd3ff"/>`
}

/** Three short strokes bursting out around the head, twice. */
function shock(top: number): string {
  const y = over(top) + 4
  const strokes: [number, number, number, number][] = [[96, y, -10, -12], [150, y - 18, 0, -16], [204, y, 10, -12]]

  return (
    `<g stroke="${SPARK}" stroke-width="4" stroke-linecap="round">` +
    strokes.map(([x, from, dx, dy]) => `<line class="cl-shock" x1="${x}" y1="${from}" x2="${x + dx}" y2="${from + dy}"/>`).join('') +
    '</g>'
  )
}

/** Confetti bursting up from the head, once. */
function confetti(top: number): string {
  const next = random(23)
  const colors = [CORAL, DONE_LIGHT, SPARK, '#7cc4ff']
  const y = over(top) - 4

  return Array.from({ length: 12 }, (_, index) => {
    const angle = Math.PI * (0.08 + (0.84 * index) / 11)
    const reach = 60 + next() * 50
    const style =
      `--cx:${f(-Math.cos(angle) * reach * 1.4)}px;--cy:${f(-Math.sin(angle) * reach * 0.6 - 6)}px;` +
      `--cr:${f((next() - 0.5) * 540)}deg;animation-delay:${f(next() * 0.25)}s`

    return `<rect class="cl-cf" style="${style}" x="147" y="${y}" width="7" height="${index % 3 === 0 ? 7 : 4}" fill="${colors[index % 4]}"/>`
  }).join('')
}

/** What a moment draws besides Claude, over everything else at the desk. */
function extras(rig: Rig, activity: Act, top: number, light: string): string {
  switch (activity) {
    case 'listening':
      return dots(rig, top)
    case 'heard':
      return bang(rig, top)
    case 'asking':
      return question(rig, top)
    case 'editing':
      return diff(rig)
    case 'planning':
      return checklist(rig)
    case 'searching':
      return lens(rig, light)
    case 'tidying':
      return sweepings(rig)
    case 'sleeping':
      return snores(rig, top)
    case 'startled':
      return shock(top)
    case 'error':
      return rig.handsOnly === true ? '' : sweat()
    case 'done':
      return confetti(top)
    default:
      return ''
  }
}

/**
 * Claude at the desk in one state. `id` keeps gradient names apart when one document draws two desks. `bright` draws
 * the critter in its own color, unshaded (the band, where it is small and wants to read crisp).
 */
export function deskScene(rig: Rig, state: DeskState, id: string, bright = false): string {
  const act = state.activity
  const base = BASE[act]
  const pose = POSE_OF[act]
  const light = lightOf(rig, act)
  const handsOnly = rig.handsOnly === true
  const color = state.ultra ? ULTRA_BODY : bright ? CORAL : mix(CORAL, rig.ink, 0.3)
  const body = critter(rig, pose, color, light.color, bright)
  const moving = (inner: string) =>
    (pose.body ?? '')
      .split(' ')
      .filter(Boolean)
      .reduceRight((within, cls) => `<g class="${cls}">${within}</g>`, inner)
  const top = rig.headTop ?? HEAD_TOP[rig.head]
  const ultra = state.ultra ? aura(id) : undefined
  const born = (inner: string) => (state.spawning === true ? `<g class="pop">${inner}</g>` : inner)
  // Waiting, Claude now and then takes its cup off the desk for a sip: the desk's cup fades as one shows in its hand.
  const sips = act === 'idle' && rig.cup !== 'none'
  const cup = rig.cup === 'none' ? '' : `<g transform="translate(392 330)">${cupShape(rig.cup, rig.ink, light.color, rig.paper)}</g>`
  const held = sips
    ? `<g class="cl-sip"><g class="cl-hcup"><g transform="translate(252 320)">${cupShape(rig.cup, rig.ink, light.color, rig.paper)}</g></g></g>`
    : ''
  const figure =
    (handsOnly ? '' : (rig.seatArt ?? seat(rig))) +
    born(moving(body.body)) +
    (rig.tableArt ?? table(rig)) +
    (sips ? `<g class="cl-cup">${cup}</g>` : cup) +
    clutter(rig, state.clutter) +
    (act === 'read' ? notebook(rig) : '') +
    (rig.device === undefined ? machine(rig, light.color, base) : rig.device(light.color, base)) +
    born(moving(body.near + held)) +
    (state.spawning === true ? hatchling(color, mix(rig.ink, '#000000', 0.4)) : '') +
    (act === 'web' && !handsOnly ? antenna([X0 + 10.5 * U, top], light.color, rig.metal) : '') +
    (act === 'thinking' && !handsOnly ? thoughts(rig.thought, [X0 + 7 * U, top - 10], rig.light.work) : '') +
    extras(rig, act, top, light.color)

  return (
    glow(id, rig.glowAt ?? MACHINES[rig.machine].glow, light.color, light.level, light.cls, light.seconds, handsOnly) +
    (ultra?.behind ?? '') +
    (rig.floating ? `<g class="bob">${figure}</g>` : figure) +
    (ultra?.front ?? '')
  )
}
