import { useEffect, useRef } from 'react'

/** Reveal settled feedback inside its own portal scroll area without moving focus. */
export function useProviderFeedback<T extends HTMLElement>(
  feedback: string | boolean | null | undefined,
) {
  const scrollArea = useRef<T>(null)
  useEffect(() => {
    if (feedback == null || feedback === '') return
    const frame = requestAnimationFrame(() => {
      const area = scrollArea.current
      if (area) area.scrollTop = area.scrollHeight
    })
    return () => cancelAnimationFrame(frame)
  }, [feedback])
  return scrollArea
}
