/** What Claude is doing at the desk, as the backdrop and the band show it. */
export type Activity =
  | 'idle' // waiting for you: sips, looks out the window
  | 'thinking' // chin on hand, thoughts rising
  | 'responding' // typing steadily
  | 'tool' // typing fast, screen in the accent color
  | 'read' // flipping a notebook
  | 'run' // presses Enter, the machines around the desk move
  | 'web' // raises an antenna
  | 'error' // screen flushes red, scratches head
  | 'done' // stretches, screen flushes green

export type Desk = {
  activity: Activity
  /** The universes the running subagents' Claudes come from, oldest first, at most three: one portal each. */
  helpers: string[]
  /** The helper just born: Claude pops, a small Claude flies up and its portal opens. Null otherwise. */
  arriving: string | null
  /** The session just landed: a portal and the universe's name fill the middle for a few seconds. */
  intro: boolean
  /** How full the context is, 0 to 4: papers and cups piled on the desk. */
  clutter: number
}

/** Why the session is powered up: `/effort ultracode` for the session, or ultracode/ultrathink in this turn's prompt. */
export type Ultra = { session: boolean; turn: boolean }

/** How wide the desktop app's side panels are where the person said they are open, in CSS pixels; 0 when closed. */
export type Panels = { left: number; right: number }

declare module 'claude-code' {
  interface PluginState {
    multiverse: {
      /** The universe this session landed in, by id; null before the first pick. */
      universe: string | null
      desk: Shaped<Desk>
      ultra: Shaped<Ultra>
      /** The side panels the backdrop fits between, as `/multiverse panels` last set them across sessions. */
      panels: Panels
    }
  }
}
