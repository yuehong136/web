import {
  useLayoutEffect,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from 'react'
import { LazyMotion, m, useReducedMotion, useSpring } from 'motion/react'

const loadFeatures = () =>
  import('../motion-features').then((module) => module.default)

/** Motion for Home; the feature bundle loads after the page has painted. */
export function HomeMotion({ children }: PropsWithChildren) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}

/** Where the welcome composer sat when the first message left it. */
export interface ComposerOrigin {
  top: number
  /** The draft had focus; the docked composer takes it over. */
  focused: boolean
}

/** Reads the welcome composer's position just before the view switches. */
export function readComposerOrigin(
  element: HTMLElement | null,
): ComposerOrigin | null {
  if (!element) return null
  return {
    top: element.getBoundingClientRect().top,
    focused: element.contains(document.activeElement),
  }
}

// ~320ms with a slight settle; the board's "composer docks" motion.
const DOCK_SPRING = { visualDuration: 0.32, bounce: 0.12 }

/**
 * The docked composer starts where the welcome composer was and springs to the
 * bottom. Without an origin, or with reduced motion, it is simply there.
 */
export function ComposerEntrance({
  origin,
  focusTarget,
  className,
  children,
}: PropsWithChildren<{
  origin: ComposerOrigin | null
  /** Receives focus when the welcome composer had it. */
  focusTarget?: RefObject<{ focus: () => void } | null>
  className?: string
}>) {
  const element = useRef<HTMLDivElement>(null)
  const consumed = useRef(false)
  const reduced = useReducedMotion()
  const y = useSpring(0, DOCK_SPRING)
  useLayoutEffect(() => {
    if (!origin || consumed.current || !element.current) return
    consumed.current = true
    if (origin.focused) focusTarget?.current?.focus()
    if (reduced) return
    const offset = origin.top - element.current.getBoundingClientRect().top
    if (Math.abs(offset) < 1) return
    y.jump(offset)
    y.set(0)
  }, [focusTarget, origin, reduced, y])
  return (
    <m.div
      ref={element}
      data-composer-entrance
      className={className}
      style={{ y }}
    >
      {children}
    </m.div>
  )
}
