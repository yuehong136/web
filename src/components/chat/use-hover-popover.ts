import { useEffect, useRef, useState, type PointerEvent } from 'react'

// A pointer resting on the trigger previews it; moving away closes it again.
const HOVER_OPEN_DELAY = 350
const HOVER_CLOSE_DELAY = 200

/**
 * Open state for a popover that a mouse previews on hover and a click or the
 * keyboard opens for good. Touch and pen only open it by tapping. A hover
 * preview never pulls focus into the popover (`openedByHover`).
 */
export function useHoverPopover() {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openedByHover = useRef(false)
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (open) return
    timer.current = setTimeout(() => {
      openedByHover.current = true
      setOpen(true)
    }, HOVER_OPEN_DELAY)
  }
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    clearTimer()
    if (!openedByHover.current) return
    timer.current = setTimeout(() => {
      openedByHover.current = false
      setOpen(false)
    }, HOVER_CLOSE_DELAY)
  }
  const onOpenChange = (next: boolean) => {
    clearTimer()
    openedByHover.current = false
    setOpen(next)
  }
  return {
    open,
    onOpenChange,
    hoverProps: { onPointerEnter, onPointerLeave },
    /** Pass to `onOpenAutoFocus`: a hover preview keeps focus where it is. */
    preventHoverFocus: (event: Event) => {
      if (openedByHover.current) event.preventDefault()
    },
  }
}
