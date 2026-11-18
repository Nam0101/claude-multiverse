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

/**
 * Everything Claude does at the desk: the activities, and finer moments each drawn as their own pose. A world's
 * scenery and machine see the activity a moment stands for (rig.ts `BASE`), so every universe reacts to them.
 */
export type Act =
  | Activity
  | 'listening' // you are typing in the prompt box: it turns to watch, three dots bounce
  | 'heard' // you sent a prompt: an ! pops over its head
  | 'asking' // waiting on your answer or approval: a hand up, a ? in a bubble
  | 'editing' // writing files: a diff card fills with lines
  | 'searching' // searching the code: a magnifier passes over its eyes
  | 'planning' // updating its plan: a checklist ticks itself off
  | 'tidying' // compacting the conversation: sweeps the desk clear
  | 'sleeping' // left alone a long while: dozes, Zzz
  | 'startled' // you stopped it mid-turn: jumps, eyes wide

export type Desk = {
  activity: Act
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
