import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Key,
  type ReactElement,
  type ReactNode,
} from 'react'
import '@/components/patterns/resource-presence.css'

/*
 * Enter/exit motion for collection items (Tide: list in/out). Plain CSS
 * keyframes do the animating; this module only decides which items move:
 *
 * - first load: items fade and rise in, staggered over the first rows;
 * - a few items added or removed (create, delete, a narrow filter): only those
 *   fade in, or fade out before they leave the layout;
 * - a page turn or a large filter change swaps the items without motion.
 *
 * CSS rather than `motion`: entering items must stay visible even if a lazy
 * feature bundle never arrives, and the patterns chunk stays dependency-free.
 */

/** First-load items past this are below the fold and appear without motion. */
export const ENTER_LIMIT = 48
/** More added plus removed items than this is a swap (page turn), not an edit. */
export const MAX_ANIMATED_CHANGES = 6
// Keep in step with resource-presence.css: a 12 x 24ms stagger, 200ms enter
// and 160ms exit, plus a margin for a busy frame.
const ENTER_SETTLED_MS = 12 * 24 + 200 + 80
const EXIT_SETTLED_MS = 160 + 40

/** `stagger`: first load, delayed by position; `enter`: a later addition. */
type Phase = 'stagger' | 'enter' | 'exit'
interface Entry {
  key: Key
  element: ReactElement
}
interface PresenceState {
  /** The present children this state was derived from. */
  source: Entry[]
  /** Present children plus those still fading out, in display order. */
  rendered: Entry[]
  phases: ReadonlyMap<Key, Phase>
  exiting: ReadonlySet<Key>
  /** Bumped whenever items start entering, to schedule their cleanup. */
  entering: number
  /** A non-empty list has rendered; later arrivals are edits, not a first load. */
  loaded: boolean
}

const NO_EXITS: ReadonlySet<Key> = new Set()

const entriesOf = (children: ReactNode): Entry[] =>
  Children.toArray(children).flatMap((child) =>
    isValidElement(child) && child.key !== null
      ? [{ key: child.key, element: child }]
      : [],
  )

function firstLoad(entries: Entry[], entering: number): PresenceState {
  return {
    source: entries,
    rendered: entries,
    phases: new Map(
      entries.slice(0, ENTER_LIMIT).map(({ key }) => [key, 'stagger']),
    ),
    exiting: NO_EXITS,
    entering: entries.length ? entering + 1 : entering,
    loaded: entries.length > 0,
  }
}

/** Puts fading-out items back where they were among the present ones. */
function withExiting(
  entries: Entry[],
  previous: Entry[],
  exiting: ReadonlySet<Key>,
): Entry[] {
  if (!exiting.size) return entries
  const rendered = [...entries]
  previous.forEach((entry, index) => {
    if (exiting.has(entry.key))
      rendered.splice(Math.min(index, rendered.length), 0, entry)
  })
  return rendered
}

function derive(previous: PresenceState, entries: Entry[]): PresenceState {
  if (!previous.loaded) return firstLoad(entries, previous.entering)
  const present = new Set(entries.map((entry) => entry.key))
  const before = new Set(previous.source.map((entry) => entry.key))
  const added = entries.filter((entry) => !before.has(entry.key))
  const removed = previous.source.filter((entry) => !present.has(entry.key))
  if (!added.length && !removed.length) {
    return {
      ...previous,
      source: entries,
      rendered: withExiting(entries, previous.rendered, previous.exiting),
    }
  }
  const kept = entries.length - added.length
  const animate =
    kept > 0 && added.length + removed.length <= MAX_ANIMATED_CHANGES
  const phases = new Map<Key, Phase>()
  for (const { key } of entries) {
    const phase = previous.phases.get(key)
    // Items still entering finish; an item that returns while leaving enters.
    if (before.has(key)) {
      if (phase && phase !== 'exit') phases.set(key, phase)
    } else if (animate) phases.set(key, 'enter')
  }
  const exiting: ReadonlySet<Key> = animate
    ? new Set([
        ...[...previous.exiting].filter((key) => !present.has(key)),
        ...removed.map((entry) => entry.key),
      ])
    : NO_EXITS
  for (const key of exiting) phases.set(key, 'exit')
  return {
    source: entries,
    rendered: withExiting(entries, previous.rendered, exiting),
    phases,
    exiting,
    entering:
      animate && added.length ? previous.entering + 1 : previous.entering,
    loaded: true,
  }
}

const settleEnter = (state: PresenceState): PresenceState => {
  const phases = new Map(
    [...state.phases].filter(([, phase]) => phase === 'exit'),
  )
  return phases.size === state.phases.size ? state : { ...state, phases }
}

const settleExit = (state: PresenceState): PresenceState => {
  if (!state.exiting.size) return state
  return {
    ...state,
    rendered: state.rendered.filter((entry) => !state.exiting.has(entry.key)),
    phases: new Map(
      [...state.phases].filter(([key]) => !state.exiting.has(key)),
    ),
    exiting: NO_EXITS,
  }
}

const ResourceMotionContext = createContext<Phase | undefined>(undefined)

/**
 * Renders a collection's children with enter/exit motion. Children need stable
 * keys (they already have them from `.map`); items read their phase with
 * `useResourceMotion`.
 */
export function useResourcePresence(children: ReactNode): ReactNode {
  const entries = useMemo(() => entriesOf(children), [children])
  const [state, setState] = useState(() => firstLoad(entries, 0))
  // Derived while rendering, like any state kept from the previous render, so
  // a leaving item never misses a frame.
  let current = state
  if (state.source !== entries) {
    current = derive(state, entries)
    setState(current)
  }
  useEffect(() => {
    if (!current.entering) return
    const timer = setTimeout(() => setState(settleEnter), ENTER_SETTLED_MS)
    return () => clearTimeout(timer)
  }, [current.entering])
  useEffect(() => {
    if (!current.exiting.size) return
    const timer = setTimeout(() => setState(settleExit), EXIT_SETTLED_MS)
    return () => clearTimeout(timer)
  }, [current.exiting])
  // Present entries come from this render's children; leaving ones keep the
  // element they last rendered with.
  return current.rendered.map((entry) => (
    <ResourceMotionContext.Provider
      key={entry.key}
      value={current.phases.get(entry.key)}
    >
      {entry.element}
    </ResourceMotionContext.Provider>
  ))
}

export interface ResourceMotionProps {
  'data-resource-motion'?: Phase
  inert?: boolean
}

/** Attributes for an item's root `li`: its motion phase and inertness. */
export function useResourceMotion(): ResourceMotionProps {
  const phase = useContext(ResourceMotionContext)
  if (!phase) return {}
  return {
    'data-resource-motion': phase,
    // A leaving item is already gone: no focus, clicks or announcements.
    inert: phase === 'exit' || undefined,
  }
}
