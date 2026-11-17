import type { Rig } from './rig'

/**
 * One universe's surroundings and its Claude. `scenery` is in the 1600×1000 picture and is cropped to the window;
 * `nook` and `front` are in the desk's own box, pinned to the bottom-right corner with it (`nook` behind the desk,
 * `front` over it). `style` reacts to the root's state classes: `st-<activity>`, `ultra`, `helper`.
 */
export type World = {
  rig: Rig
  style: string
  scenery: string
  nook: string
  front?: string
}
