import { useEffect, useRef, useState } from 'react'
import { useReducedMotionPreference } from '@/themes'

/** Characters revealed per step, and the pause between steps. */
const STEP = 4
const INTERVAL_MS = 35

/**
 * Reveals a short plain-text message a few characters at a time, e.g. an
 * agent's opening line. With reduced motion the text shows at once.
 * `onComplete` runs once, when the whole text is visible.
 */
export function TypingText({
  text,
  onComplete,
}: {
  text: string
  onComplete?: () => void
}) {
  const reduced = useReducedMotionPreference()
  const [shown, setShown] = useState(() => (reduced ? text.length : 0))
  const [source, setSource] = useState(text)
  const completed = useRef(false)
  const done = useRef(onComplete)
  useEffect(() => {
    done.current = onComplete
  }, [onComplete])

  // A new text restarts, unless it only extends what is already shown.
  if (source !== text) {
    setSource(text)
    if (!text.startsWith(source.slice(0, shown))) setShown(0)
  }

  useEffect(() => {
    if (shown >= text.length) {
      if (!completed.current) {
        completed.current = true
        done.current?.()
      }
      return
    }
    const timer = setTimeout(
      () => setShown((count) => Math.min(text.length, count + STEP)),
      INTERVAL_MS,
    )
    return () => clearTimeout(timer)
  }, [shown, text])

  return (
    <span className="whitespace-pre-wrap" data-typing={shown < text.length}>
      {text.slice(0, shown)}
    </span>
  )
}
