import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Activity, Panels } from '../types'
import {
  DOING,
  UNIVERSES,
  arrival,
  bandOf,
  keyOf,
  paletteOf,
  pickUniverse,
  sceneName,
  sceneOf,
  universeNamed,
  universeOf,
  universeOfScene,
} from './universes'
import type { Universe } from './universes'

const PLUGIN = 'multiverse'
// Written out where the command is registered and hooked: validate reads the literal there.
const COMMAND = 'multiverse'
// The universe the last new session landed in, across sessions: the next one lands somewhere else.
const LAST_KEY = 'last-universe'
// The side panels the person last declared, across sessions.
const PANELS_KEY = 'panels'
// The desktop app's sidebar and right-hand panel, as wide as they open by default. The app tells a mod nothing about
// them, so until the person says otherwise both count as open and the picture fits the strip between them.
const SIDEBAR = 260
const RIGHT_PANEL = 320
const BOTH: Panels = { left: SIDEBAR, right: RIGHT_PANEL }
// Wider than any panel a window leaves room for: a typo can't push the picture off screen.
const WIDEST = 1200

const universe = atom({ plugin: 'multiverse', key: 'universe' } as const, null)
const desk = atom(
  { plugin: 'multiverse', key: 'desk' } as const,
  { activity: 'idle', helpers: [], arriving: null, intro: false, clutter: 0 },
  { shape: 'desk-2' },
)
const ultra = atom({ plugin: 'multiverse', key: 'ultra' } as const, { session: false, turn: false }, { shape: 'ultra-1' })
const panels = atom({ plugin: 'multiverse', key: 'panels' } as const, BOTH)

// How long a state stays on screen before the next one takes it: a quick Read between two lines of text would
// otherwise flash the backdrop, which redraws whole on every change.
const HOLD_MS = 900
const HELD_MS: Partial<Record<Activity, number>> = { error: 2400, done: 1500 }
// After a reply, Claude stretches this long and then waits for you again.
const SETTLE_MS = 6000
// A newborn subagent: Claude pops, a small Claude flies up and its portal opens, for this long.
const ARRIVE_MS = 2600
// The universe's name stays in the middle this long after landing.
const INTRO_MS = 5200
// Portals along the top: a fourth subagent at once runs without one.
const PORTALS = 3

// The module's own variables start over on a reload, and `session.start` puts the desk back to idle to match.
let shown: Activity = 'idle'
let wanted: Activity = 'idle'
let shownAt = Number.NEGATIVE_INFINITY
let pending: Timer | undefined
let settling: Timer | undefined
let arrived: Timer | undefined
let introduced: Timer | undefined
// Each running subagent and the universe its Claude comes from; null past the last portal.
const agents = new Map<string, string | null>()

/** Runs a step whose failure must never cost the turn: a tool that already ran, a compaction that already happened. */
async function quietly($: EngineInterface, step: () => Promise<void>): Promise<void> {
  try {
    await step()
  } catch (error) {
    $.ui.log(`multiverse: the backdrop keeps its last picture (${String(error)})`, { to: 'debug' })
  }
}

function roll(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32
}

async function write($: EngineInterface, activity: Activity): Promise<void> {
  if (activity === shown) {
    return
  }

  shown = activity
  shownAt = performance.now()
  await update($, desk, was => ({ ...was, activity }))
}

/** Asks for a state: drawn now if the one on screen has had its time, else as soon as it has. The latest ask wins. */
async function show($: EngineInterface, activity: Activity): Promise<void> {
  if (activity === wanted) {
    return
  }

  wanted = activity
  pending?.cancel()
  pending = undefined

  const wait = shownAt + (HELD_MS[shown] ?? HOLD_MS) - performance.now()

  if (wait <= 0) {
    await write($, activity)

    return
  }

  pending = $.clock.after(wait, () => {
    pending = undefined
    // A redraw that fails leaves the last picture on screen; nothing else rides on it.
    write($, wanted).catch(() => undefined)
  })
}

function settle($: EngineInterface): void {
  settling?.cancel()
  settling = $.clock.after(SETTLE_MS, () => {
    settling = undefined
    show($, 'idle').catch(() => undefined)
  })
}

/** What Claude does at the desk for a tool: flips the notebook to read, presses Enter to run, raises the antenna for the web. */
function activityOfTool(tool: string): Activity {
  if (/^(Read|Grep|Glob|LS|NotebookRead)$/.test(tool)) {
    return 'read'
  }

  if (/^(Bash|BashOutput|PowerShell)$/.test(tool)) {
    return 'run'
  }

  if (/^(WebFetch|WebSearch)$/.test(tool) || (tool.startsWith('mcp__') && /web|search|fetch|brows|navigate/i.test(tool))) {
    return 'web'
  }

  return 'tool'
}

function helpersNow(): string[] {
  return [...agents.values()].filter((helper): helper is string => helper !== null)
}

/** A subagent starts: a Claude from another universe opens the next portal, and the desk shows it being born. */
async function spawn($: EngineInterface, agentId: string): Promise<void> {
  if (agents.has(agentId)) {
    return
  }

  const taken = helpersNow()

  if (taken.length >= PORTALS) {
    agents.set(agentId, null)

    return
  }

  const here = await read($, universe)
  const helper = pickUniverse(here === null ? taken : [here, ...taken], roll()).id

  agents.set(agentId, helper)
  await update($, desk, was => ({ ...was, helpers: helpersNow(), arriving: helper }))
  arrived?.cancel()
  arrived = $.clock.after(ARRIVE_MS, () => {
    arrived = undefined
    update($, desk, was => (was.arriving === null ? was : { ...was, arriving: null })).catch(() => undefined)
  })
}

async function leave($: EngineInterface, agentId: string): Promise<void> {
  const helper = agents.get(agentId)

  agents.delete(agentId)

  if (helper !== undefined && helper !== null) {
    await update($, desk, was => ({
      ...was,
      helpers: helpersNow(),
      arriving: was.arriving === helper ? null : was.arriving,
    }))
  }
}

/** Shows the universe's name over the picture for a few seconds. */
async function introduce($: EngineInterface): Promise<void> {
  introduced?.cancel()
  await update($, desk, was => ({ ...was, intro: true }))
  introduced = $.clock.after(INTRO_MS, () => {
    introduced = undefined
    update($, desk, was => (was.intro ? { ...was, intro: false } : was)).catch(() => undefined)
  })
}

function clutterOf(percent: number): number {
  return percent < 35 ? 0 : percent < 55 ? 1 : percent < 70 ? 2 : percent < 85 ? 3 : 4
}

/** Sets the session's look to a universe: its palette, always dark, and its backdrop. */
async function land($: EngineInterface, place: Universe): Promise<void> {
  const { colors, problems } = paletteOf(place)
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    void $.ui.toast(`multiverse (${place.name}): ${unpainted}`)
  }

  await $.theme.set({
    colors,
    backdrop: { scene: sceneName(place), glass: place.glass },
    overrideColorScheme: 'dark',
  })
}

async function moveTo($: EngineInterface, place: Universe): Promise<void> {
  await update($, universe, () => place.id)
  await $.store.set(LAST_KEY, place.id)
  await introduce($)
  await land($, place)
}

async function setUltra($: EngineInterface, isUltra: boolean): Promise<void> {
  await update($, ultra, was => (was.session === isUltra ? was : { ...was, session: isUltra }))
}

// Only /effort's output row says what became of ultracode, typed with arguments or picked in its menu alike:
// `Ultracode on (this session only): …`, `Ultracode off. …`, or `… · Ultracode off` after a level.
const ULTRACODE_SAID = /<local-command-stdout>[\s\S]*?\bUltracode (on|off)\b/i

function listText(current: Universe | undefined): string {
  return [
    'The universes (who Claude is there · the machine · around it):',
    ...UNIVERSES.map(
      place =>
        `${place.id === current?.id ? '▸' : '•'} ${place.name}: ${place.role} · ${place.machine} · ${place.around}` +
        (place.weight < 1 ? ' (rare)' : place.weight > 1 ? ' (intense)' : ''),
    ),
    `/${COMMAND} next jumps to another universe, /${COMMAND} <name> goes to one, /${COMMAND} ultra toggles ultra, ` +
      `/${COMMAND} panels fits the picture between the side panels.`,
  ].join('\n')
}

/** A stored or typed width as a whole number of pixels within reach, or undefined where it is none. */
function widthOf(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value

  return typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= WIDEST
    ? Math.round(number)
    : undefined
}

/** Panels read back from the store; anything else there counts as never set. */
function panelsOf(value: unknown): Panels | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const left = widthOf((value as Record<string, unknown>).left)
  const right = widthOf((value as Record<string, unknown>).right)

  return left === undefined || right === undefined ? undefined : { left, right }
}

function panelsText(now: Panels): string {
  return now.left + now.right === 0
    ? 'Side panels: none. The picture fills the window.'
    : `Side panels: left ${now.left}px, right ${now.right}px. The picture fits the strip between them.`
}

const PANELS_USAGE =
  `/${COMMAND} panels both | left | right | off says which of the app's side panels are open; ` +
  `/${COMMAND} panels <left px> <right px> sets their widths.`

/** What `/multiverse panels …` asks for, from the words after "panels"; undefined where they make no sense. */
function panelsAsked(words: readonly string[]): Panels | undefined {
  const [first, second] = words

  switch (first?.toLowerCase()) {
    case 'both':
    case 'on':
      return BOTH
    case 'left':
      return { left: SIDEBAR, right: 0 }
    case 'right':
      return { left: 0, right: RIGHT_PANEL }
    case 'off':
    case 'none':
      return { left: 0, right: 0 }
  }

  const left = widthOf(first)
  const right = widthOf(second)

  return left === undefined || right === undefined || words.length !== 2 ? undefined : { left, right }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'multiverse',
        description:
          `This session's universe: "list" names all ${UNIVERSES.length}, "next" jumps to another, a name goes there, ` +
          '"ultra" toggles ultra, "panels" fits the picture between the side panels.',
      })
    } catch (error) {
      void $.ui.toast(`multiverse: /${COMMAND} could not be registered (${String(error)})`)
    }

    const stored = panelsOf(await $.store.get(PANELS_KEY))

    if (stored !== undefined) {
      await update($, panels, () => stored)
    }

    let place = universeOf(await read($, universe))
    const isNew = place === undefined

    if (place === undefined) {
      const last = await $.store.get(LAST_KEY)
      place = pickUniverse(typeof last === 'string' ? [last] : [], roll())
      await update($, universe, () => place!.id)
      await $.store.set(LAST_KEY, place.id)
    }

    shown = 'idle'
    wanted = 'idle'
    shownAt = Number.NEGATIVE_INFINITY
    agents.clear()
    arrived?.cancel()
    introduced?.cancel()
    await update($, desk, was => ({ ...was, activity: 'idle' as const, helpers: [], arriving: null, intro: false }))
    await update($, ultra, was => ({ ...was, turn: false }))

    if (isNew) {
      await introduce($)
    }

    await land($, place)

    if (isNew) {
      void $.ui.toast(arrival(place))
    }

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const text = e.text.trim()
    settling?.cancel()

    // A slash command is no prompt: `/effort ultracode` tells its outcome in its output row.
    if (!text.startsWith('/') && /\bultra(code|think)\b/i.test(text)) {
      await update($, ultra, was => ({ ...was, turn: true }))
    }

    return next(e)
  })

  // The picker hands `command.run` no text, so the row the session keeps of /effort's output is where it shows.
  on('session.append', { door: 'command' }, async ($, e, next) => {
    if (e.agentId === undefined) {
      const text = e.message.content.map(block => (block.type === 'text' ? String(block.text) : '')).join('\n')
      const said = ULTRACODE_SAID.exec(text)

      if (said !== null) {
        await setUltra($, said[1]!.toLowerCase() === 'on')
      }
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) {
      // A subagent's turn: a portal opens on a Claude from another universe typing along.
      await spawn($, e.agentId)

      return next(e)
    }

    settling?.cancel()
    await show($, 'thinking')

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) {
      return yield* next(e)
    }

    for await (const chunk of next(e)) {
      const activity: Activity | undefined =
        chunk.kind === 'thinking'
          ? 'thinking'
          : chunk.kind === 'text'
            ? 'responding'
            : chunk.kind === 'tool' || chunk.kind === 'input'
              ? 'tool'
              : undefined

      if (activity !== undefined) {
        await show($, activity)
      }

      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) {
      return next(e)
    }

    await quietly($, () => show($, activityOfTool(e.tool)))

    const result = await next(e)

    if (result.isError === true) {
      await quietly($, () => show($, 'error'))
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      await leave($, e.agentId)

      return next(e)
    }

    await update($, ultra, was => (was.turn ? { ...was, turn: false } : was))

    if (e.isAborted) {
      await show($, 'idle')
    } else {
      await show($, e.reason === 'answer' ? 'done' : 'error')
      settle($)
    }

    return next(e)
  })

  // The context filling up piles papers and cups on the desk; /compact clears it.
  on('session.measure', async ($, e, next) => {
    const { percent, tokens, window } = e.context
    const full = percent ?? (tokens !== undefined && window > 0 ? (tokens / window) * 100 : undefined)

    if (full !== undefined) {
      const clutter = clutterOf(full)

      await update($, desk, was => (was.clutter === clutter ? was : { ...was, clutter }))
    }

    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)

    await quietly($, async () => {
      await update($, desk, was => ({ ...was, clutter: 0 }))
    })

    return result
  })

  on('command.run', { command: 'multiverse' }, async ($, e) => {
    const asked = e.args.trim()
    const key = keyOf(asked)
    const current = universeOf(await read($, universe))

    if (key === '' || key === 'list') {
      return { text: (current === undefined ? '' : `This session is in ${current.name}.\n`) + listText(current) }
    }

    if (key === 'ultra') {
      const was = await read($, ultra)

      await update($, ultra, () => ({ ...was, session: !was.session }))

      return { text: was.session ? 'Ultra off.' : 'Ultra on: a golden aura, lightning around the desk.' }
    }

    const [word, ...rest] = asked.split(/\s+/)

    if (keyOf(word ?? '') === 'panels') {
      if (rest.length === 0) {
        return { text: `${panelsText(await read($, panels))}\n${PANELS_USAGE}` }
      }

      const wanted = panelsAsked(rest)

      if (wanted === undefined) {
        return { text: `"${rest.join(' ')}" is not a panel setting.\n${PANELS_USAGE}` }
      }

      await update($, panels, () => wanted)
      await $.store.set(PANELS_KEY, wanted)

      return { text: panelsText(wanted) }
    }

    const place = key === 'next' ? pickUniverse(current === undefined ? [] : [current.id], roll()) : universeNamed(asked)

    if (place === undefined) {
      return { text: `No universe is called "${asked}".\n${listText(current)}` }
    }

    await moveTo($, place)

    return { text: arrival(place) }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const place = universeOfScene(e.props.scene)

    if (place === undefined) {
      return next(e)
    }

    const now = await read($, desk)
    const power = await read($, ultra)
    // Only the desktop app has side panels; the phone's backdrop fills its screen.
    const sides = e.surface === 'desktop' ? await read($, panels) : undefined
    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        isInteractive
        alt={`${place.name}: Claude ${DOING[now.activity]}`}
        source={sceneOf(place, now, power.session || power.turn, sides)}
      />
    )
  })

  // The tiny Claude above the prompt: the same desk and the same moves, drawn crisp and light.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (e.surface !== 'desktop' && e.surface !== 'mobile' && e.surface !== 'terminal')) {
      return next(e)
    }

    const place = universeOf(await read($, universe))

    if (place === undefined) {
      return next(e)
    }

    const now = await read($, desk)
    const power = await read($, ultra)
    const isUltra = power.session || power.turn

    // The terminal draws no picture: while ultra is on it gets a sparking row of its own, animated by the terminal.
    if (e.surface === 'terminal') {
      if (!isUltra) {
        return next(e)
      }

      const { Client } = $.ui.resolve(e)

      return (
        <Client
          key="ultra"
          module="./ultra-row.tsx"
          props={{ name: place.name, accent: place.roles.accent, doing: DOING[now.activity] }}
        />
      )
    }

    const band = bandOf(place, now, isUltra)
    const said = `${place.name} · Claude ${DOING[now.activity]}${isUltra ? ' · ultra' : ''}`
    const { Box, Svg, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg isInteractive alt={said} source={band.source} width={band.width} height={band.height} />
        <Text dimColor>{said}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const place = universeOf(await read($, universe))

    if (place === undefined) {
      return next(e)
    }

    const power = await read($, ultra)
    // One label: the footer joins modes with "&", which a name like Kaiju & Mecha already holds.
    const label = power.session || power.turn ? `${place.name} · ultra` : place.name

    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, label] } })
  })

  // Mag Tape '84's machines shout.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const place = universeOf(await read($, universe))

    if (place?.shouts !== true) {
      return next(e)
    }

    return next({
      ...e,
      props: { ...e.props, word: e.props.word.toUpperCase(), message: e.props.message?.toUpperCase() ?? null },
    })
  })
}
