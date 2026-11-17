import { expect, mock, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'multiverse',
  surface: 'desktop',
  component: 'Backdrop',
  props: { scene: 'multiverse-origin', plugin: 'multiverse', glass: { blur: 16, opacity: 0.5 } },
} as const

const BAND = {
  plugin: 'multiverse',
  surface: 'desktop',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

// A command the person typed at the prompt of a wide window.
const TYPED = { kind: 'composer' } as const
const WIDE = { isFullscreen: false, columns: 120 }

async function sourceOf(ui: { find: (query: { type: string }) => Promise<{ props: Record<string, unknown> } | undefined> }) {
  return String((await ui.find({ type: 'Svg' }))?.props.source ?? '')
}

test('the backdrop draws the universe its scene names, Claude waiting', async $ => {
  const ui = await $.ui.mount(BACKDROP)

  expect(await sourceOf(ui)).toContain('class="st-idle"')
  await ui.unmount()
})

test('a scene another plugin set is left to it', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return Text({ children: 'engine' })
  })

  const ui = await $.ui.mount({ ...BACKDROP, props: { ...BACKDROP.props, plugin: 'theme-examples' } })

  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})

test('a turn starting sets Claude thinking, and the backdrop draws it again', async ($, on) => {
  on('turn.start', (_, e) => ({ turnId: e.turnId }))

  const ui = await $.ui.mount(BACKDROP)

  await $.turn.start({ text: 'hi', turnId: 't1' })
  expect(await sourceOf(ui)).toContain('class="st-thinking"')
  await ui.unmount()
})

test('a new session lands in a universe other than the last, sets its look, and the band shows the tiny Claude', async ($, on) => {
  const stored = new Map<string, unknown>([['last-universe', 'origin']])
  const scenes: string[] = []

  mock.clock(on)

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'multiverse' } }))
  on('store.get', (_, e) => ({ value: stored.get(e.key) }))
  on('store.set', (_, e) => {
    stored.set(e.key, e.value)

    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    const backdrop = e.backdrop as { scene?: string } | undefined

    scenes.push(backdrop?.scene ?? '')

    return { value: { isDrawn: true, requestId: 'r1' } }
  })
  on('ui.toast', () => ({ value: undefined }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(scenes).toHaveLength(1)
  expect(scenes[0]).toMatch(/^multiverse-/)
  expect(scenes[0]).not.toBe('multiverse-origin')
  expect(stored.get('last-universe')).toBe(scenes[0]!.slice('multiverse-'.length))

  const ui = await $.ui.mount(BAND)

  expect(await sourceOf(ui)).toContain('st-idle')
  expect((await ui.find({ type: 'Text' }))?.text).toMatch(/· Claude is waiting for you$/)
  await ui.unmount()
})

test('the desktop backdrop fits between the side panels the person names, and fills the window once they are off', async ($, on) => {
  mock.store(on)

  const ui = await $.ui.mount(BACKDROP)
  const both = await sourceOf(ui)

  expect(both).toContain('class="mv-strip"')
  expect(both).toContain('clip-path:inset(0 320px 0 260px)')

  const off = await $.command.run({ command: 'multiverse', args: 'panels off', origin: TYPED, presentation: WIDE })

  expect(String(off.text)).toContain('none')
  expect(await sourceOf(ui)).toContain('viewBox="0 0 1600 1000"')
  expect(await sourceOf(ui)).not.toContain('mv-strip')

  await $.command.run({ command: 'multiverse', args: 'panels 300 400', origin: TYPED, presentation: WIDE })
  expect(await sourceOf(ui)).toContain('clip-path:inset(0 400px 0 300px)')

  const wrong = await $.command.run({ command: 'multiverse', args: 'panels wide', origin: TYPED, presentation: WIDE })

  expect(String(wrong.text)).toContain('is not a panel setting')
  expect(await sourceOf(ui)).toContain('clip-path:inset(0 400px 0 300px)')
  await ui.unmount()
})

test('the phone backdrop always fills its screen', async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'mobile' })

  expect(await sourceOf(ui)).toContain('viewBox="0 0 1600 1000"')
  expect(await sourceOf(ui)).not.toContain('mv-strip')
  await ui.unmount()
})

test('a subagent opens a portal on another universe, Claude pops it out, and the portal closes when it ends', async ($, on) => {
  const clock = mock.clock(on)

  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', (_, e) => ({ text: e.answer }))

  const ui = await $.ui.mount(BACKDROP)

  await $.turn.start({ text: 'go', turnId: 's1', agentId: 'a1' })

  const born = await sourceOf(ui)

  expect(born).toContain('class="mvp-open"')
  expect(born).toContain('class="pop"')
  expect(born).toContain('class="spawn-fly"')

  await clock.advance(3000)

  const settled = await sourceOf(ui)

  expect(settled).toContain('class="mvp-sw"')
  expect(settled).not.toContain('class="mvp-open"')
  expect(settled).not.toContain('class="spawn-fly"')

  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 's1', agentId: 'a1', reason: 'answer' })
  expect(await sourceOf(ui)).not.toContain('class="mvp-sw"')
  await ui.unmount()
})

test('a new session shows the universe it landed in by name, then leaves the picture alone', async ($, on) => {
  const clock = mock.clock(on)
  let scene = ''

  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'multiverse' } }))
  on('theme.set', (_, e) => {
    scene = (e.backdrop as { scene?: string } | undefined)?.scene ?? ''

    return { value: { isDrawn: true, requestId: 'r1' } }
  })
  on('ui.toast', () => ({ value: undefined }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BACKDROP, props: { ...BACKDROP.props, scene } })

  expect(await sourceOf(ui)).toContain('class="mvi-all"')
  await clock.advance(6000)
  expect(await sourceOf(ui)).not.toContain('class="mvi-all"')
  await ui.unmount()
})

test('on the terminal, ultracode from the /effort picker sparks a row above the prompt and marks the mode line; a level ends it', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'r1' } }))

  // The engine's /effort, beneath the mod: the picker prints what it did and nothing else says so.
  let printed = ''

  on('command.run', { command: 'effort' }, () => ({ text: printed }))

  // The mode line as it reaches the engine, beneath the mod's rewrite.
  let modes: readonly string[] = []

  on('ui.render', { component: 'SessionMode' }, (_, e, next) => {
    modes = (e.props as { modes: readonly string[] }).modes

    return next(e)
  })

  await $.command.run({ command: 'multiverse', args: 'galactic war', origin: TYPED, presentation: WIDE })

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const mode = await $.ui.mount({ plugin: 'multiverse', surface: 'terminal', component: 'SessionMode', props: { modes: [] } })

  expect(await band.find({ type: 'Client' })).toBeUndefined()
  expect(modes).toEqual(['Galactic War'])

  printed = 'Ultracode on (this session only): dynamic workflows on every task. Effort stays high.'
  await $.command.run({ command: 'effort', args: '', origin: TYPED, presentation: WIDE })

  const row = await band.find({ type: 'Client' })

  expect(row?.props.props).toMatchObject({ name: 'Galactic War', doing: 'is waiting for you' })
  expect((await band.find({ type: 'Text', text: 'Galactic War', in: 'ultra' }))?.props.color).toBe(
    (row?.props.props as { accent: string }).accent,
  )
  expect(JSON.stringify(await band.drawn({ in: 'ultra' }))).toContain('"U"')
  await mode.drawn()
  expect(modes).toEqual(['Galactic War · ultra'])

  printed = 'Set effort level to high (this session only): thorough · Ultracode off'
  await $.command.run({ command: 'effort', args: 'high', origin: TYPED, presentation: WIDE })

  expect(await band.find({ type: 'Client' })).toBeUndefined()
  await mode.drawn()
  expect(modes).toEqual(['Galactic War'])
  await band.unmount()
  await mode.unmount()
})

test('/effort ultracode off turns ultra off, and the desktop band keeps its tiny Claude', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'r1' } }))

  let printed = 'Ultracode on (this session only): dynamic workflows on every task. Effort stays high.'

  on('command.run', { command: 'effort' }, () => ({ text: printed }))

  await $.command.run({ command: 'multiverse', args: 'the deep', origin: TYPED, presentation: WIDE })
  await $.command.run({ command: 'effort', args: 'ultracode', origin: TYPED, presentation: WIDE })

  const ui = await $.ui.mount(BAND)

  expect((await ui.find({ type: 'Text' }))?.text).toMatch(/ · ultra$/)

  printed = 'Ultracode off. Effort stays high.'
  await $.command.run({ command: 'effort', args: 'ultracode off', origin: TYPED, presentation: WIDE })

  expect((await ui.find({ type: 'Text' }))?.text).toMatch(/· Claude is waiting for you$/)
  expect(await ui.find({ type: 'Client' })).toBeUndefined()
  await ui.unmount()
})
