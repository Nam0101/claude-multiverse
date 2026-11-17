// Shared pieces of every scene: a seeded random, compact numbers, and the frame that pins the desk to the
// bottom-right corner of whatever window shape the picture is cropped to.
//
// The picture is 1600×1000 and fills the window with `slice`, so a narrow window crops both sides and a wide one
// crops top and bottom. `mv-r` slides its content left by about what a narrower window crops on the right, `mv-b`
// up by what a wider one crops at the foot, `mv-t` down by what it crops at the top.
//
// The desktop app draws the backdrop under its side panels and tells a mod nothing about them. Where the person
// says which panels are open, the picture is fitted to the strip between them instead, by a transform that CSS
// works out from the window's size, and the shifts are exact for that strip.

/** A fixed random sequence per seed: a universe looks the same every time it is drawn. */
export function random(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A number cut to one decimal, so the markup stays small. */
export function f(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** Where the desk's 420×460 box sits in the picture: its own corner, clear of the chat column and the prompt. */
export const CORNER = { x: 1180, y: 540 }

const PIN_RIGHT: readonly (readonly [string, number])[] = [
  ['3/2', 50],
  ['7/5', 100],
  ['13/10', 150],
  ['6/5', 200],
  ['11/10', 250],
  ['1/1', 300],
  ['4/5', 400],
  ['3/5', 500],
  ['1/2', 560],
]

const PIN_TALL: readonly (readonly [string, number])[] = [
  ['17/10', 30],
  ['9/5', 56],
  ['19/10', 79],
  ['2/1', 100],
  ['11/5', 136],
  ['12/5', 167],
]

/** A toothed wheel around its own center as one even-odd path: teeth, a hub hole and four round windows. */
export function gear(radius: number, teeth: number): string {
  const depth = Math.max(3, radius * 0.16)
  const inner = radius - depth
  const step = (Math.PI * 2) / teeth
  const points: string[] = []

  for (let index = 0; index < teeth; index += 1) {
    const a = index * step

    for (const [r, at] of [
      [inner, a],
      [radius, a + step * 0.2],
      [radius, a + step * 0.5],
      [inner, a + step * 0.7],
    ] as const) {
      points.push(`${f(r * Math.cos(at))} ${f(r * Math.sin(at))}`)
    }
  }

  const hole = (cx: number, cy: number, r: number) =>
    `M${f(cx + r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0Z`
  const windows = [0, 1, 2, 3]
    .map(index => hole(Math.cos((index * Math.PI) / 2 + 0.6) * inner * 0.55, Math.sin((index * Math.PI) / 2 + 0.6) * inner * 0.55, inner * 0.2))
    .join('')

  return `M${points.join('L')}Z${hole(0, 0, inner * 0.16)}${radius > 16 ? windows : ''}`
}

/** How much of the window the app's side panels cover on each side, in CSS pixels. */
export type Insets = { left: number; right: number }

// The window's shape picks each shift, in steps, for a picture that fills the whole window.
const PINS_BY_SHAPE =
  PIN_RIGHT.map(([ratio, by]) => `@media (max-aspect-ratio:${ratio}){.mv-r{transform:translateX(-${by}px)}}`).join('') +
  PIN_TALL.map(
    ([ratio, by]) =>
      `@media (min-aspect-ratio:${ratio}){.mv-b{transform:translateY(-${by}px)}.mv-t{transform:translateY(${by}px)}}`,
  ).join('')

/** The strip between the panels, never narrower than a sliver, so a tiny window divides by nothing. */
function strip(covered: number): string {
  return `max(100vw - ${covered}px, 240px)`
}

// The chat column the app centers in the strip, with a little air, and how much of the nook must clear it: from the
// critter's far arm to the machine's edge, in picture units.
const COLUMN = 780
const NOOK_SPAN = 380

/**
 * The picture scaled to cover the strip and centered on it, cut to it; the shifts exact for its shape. A strip
 * too narrow for the nook beside the chat column shrinks the nook toward its corner, to no less than 60%:
 * `--mv-f`, which the flight to a portal divides by so the small Claude still lands in it.
 */
function fitStyle({ left, right }: Insets): string {
  const wide = strip(left + right)
  const tall = `max(0, 500 - 800 * (100vh / ${wide}))`

  return (
    `.mv-strip{clip-path:inset(0 ${right}px 0 ${left}px) view-box}` +
    `.mv-fit{--mv-s:max(calc(${wide} / 1600px), calc(100vh / 1000px));` +
    `--mv-f:clamp(.6, (${wide} - ${COLUMN}px) / 2 / (${NOOK_SPAN}px * var(--mv-s)), 1);` +
    `transform:translate(calc(${left}px + (${wide} - 1600px * var(--mv-s)) / 2), calc((100vh - 1000px * var(--mv-s)) / 2)) ` +
    'scale(var(--mv-s))}' +
    '.mv-n{transform-origin:1600px 1000px;transform:scale(var(--mv-f))}' +
    `.mv-r{transform:translateX(calc(-1px * max(0, 800 - 500 * (${wide} / 100vh))))}` +
    `.mv-b{transform:translateY(calc(-1px * ${tall}))}` +
    `.mv-t{transform:translateY(calc(1px * ${tall}))}`
  )
}

export const COMMON =
  '.mv-in{animation:mv-in .9s ease-out both}' +
  '@keyframes mv-in{from{opacity:0}to{opacity:1}}' +
  '@keyframes mv-spin{to{transform:rotate(360deg)}}' +
  '@keyframes mv-spin-back{to{transform:rotate(-360deg)}}' +
  // Asked for less motion: every scene rests as a still picture, and what only flashes stays hidden.
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'

/**
 * The whole backdrop document: scenery cropped to the window, or to the strip between the side panels where
 * `insets` covers some of it, the desk's nook pinned to that area's bottom-right corner.
 */
export function frame(
  parts: { classes: string; style: string; scenery: string; nook: string; overlay: string },
  insets: Insets = { left: 0, right: 0 },
): string {
  const picture =
    parts.scenery +
    `<g class="mv-r"><g class="mv-b"><g class="mv-n"><g transform="translate(${CORNER.x} ${CORNER.y})">${parts.nook}</g></g></g></g>` +
    parts.overlay

  // The whole window: the shape the picture has always had, which needs nothing newer than media queries.
  if (insets.left + insets.right <= 0) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" ' +
      `preserveAspectRatio="xMidYMid slice" class="${parts.classes}">` +
      `<style>${COMMON}${PINS_BY_SHAPE}${parts.style}</style>${picture}</svg>`
    )
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" class="${parts.classes}">` +
    `<style>${COMMON}${fitStyle(insets)}${parts.style}</style>` +
    `<g class="mv-strip"><g class="mv-fit">${picture}</g></g></svg>`
  )
}

/** Rain or drizzle that loops without a seam: each line falls `slant` sideways per 1000 down. */
export function rain(options: {
  seed: number
  count: number
  length: [number, number]
  slant: number
  seconds: number
  stroke: string
  opacity: number
  box?: [number, number, number, number]
}): string {
  const next = random(options.seed)
  const [x0, y0, width, height] = options.box ?? [-100, 0, 1900, 1000]
  const lines: string[] = []

  for (let index = 0; index < options.count; index += 1) {
    const x = x0 + next() * width
    const y = y0 + next() * height
    const length = options.length[0] + next() * (options.length[1] - options.length[0])
    const dx = (length * options.slant) / 1000

    lines.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + dx)}" y2="${f(y + length)}"/>`)
  }

  const body = lines.join('')
  const shift = f((options.slant * height) / 1000)

  return (
    `<g stroke="${options.stroke}" stroke-opacity="${options.opacity}" stroke-width="1.2" stroke-linecap="round">` +
    `<g style="animation:mv-fall-${options.seed} ${options.seconds}s linear infinite">` +
    `<style>@keyframes mv-fall-${options.seed}{to{transform:translate(${shift}px,${height}px)}}</style>` +
    `${body}<g transform="translate(${f(-Number(shift))} ${-height})">${body}</g></g></g>`
  )
}
