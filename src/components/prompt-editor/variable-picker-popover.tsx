import React, { useCallback } from 'react'

import { cn } from '@/lib/utils'

const VARIABLE_PICKER_MAX_WIDTH = 432
const VARIABLE_PICKER_VIEWPORT_PADDING = 12

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function VariablePickerPopover({
  anchorElement,
  children,
  footer,
  header,
  onGestureCapture,
  onWheelCapture,
}: {
  anchorElement: HTMLElement
  children: React.ReactNode
  footer?: React.ReactNode
  header: React.ReactNode
  onGestureCapture: (event: React.SyntheticEvent) => void
  onWheelCapture: (event: React.WheelEvent<HTMLDivElement>) => void
}) {
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const [layout, setLayout] = React.useState(() => ({
    maxHeight: 360,
    width: VARIABLE_PICKER_MAX_WIDTH,
  }))

  const updateLayout = useCallback(() => {
    const anchorRect = anchorElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const maxWidth = Math.min(
      VARIABLE_PICKER_MAX_WIDTH,
      Math.max(240, viewportWidth - VARIABLE_PICKER_VIEWPORT_PADDING * 2),
    )
    const availableBelow =
      viewportHeight - anchorRect.top - VARIABLE_PICKER_VIEWPORT_PADDING
    const maxHeight = clamp(
      availableBelow,
      0,
      viewportHeight - VARIABLE_PICKER_VIEWPORT_PADDING * 2,
    )

    setLayout((previous) => {
      if (
        previous.maxHeight === maxHeight &&
        previous.width === maxWidth
      ) {
        return previous
      }

      return {
        maxHeight,
        width: maxWidth,
      }
    })
  }, [anchorElement])

  React.useLayoutEffect(() => {
    updateLayout()

    const resizeObserver = new ResizeObserver(() => {
      updateLayout()
    })

    resizeObserver.observe(anchorElement)

    if (popoverRef.current) {
      resizeObserver.observe(popoverRef.current)
    }

    const handleReposition = () => {
      updateLayout()
    }

    window.addEventListener('resize', handleReposition)
    document.addEventListener('scroll', handleReposition, true)
    window.visualViewport?.addEventListener('resize', handleReposition)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleReposition)
      document.removeEventListener('scroll', handleReposition, true)
      window.visualViewport?.removeEventListener('resize', handleReposition)
    }
  }, [anchorElement, updateLayout])

  return (
    <div
      ref={popoverRef}
      className={cn(
        'typeahead-popover flex flex-col overflow-hidden rounded-radius-xl border border-components-dropdown-border bg-components-dropdown-bg shadow-[var(--color-components-dropdown-shadow)]',
      )}
      style={{
        width: layout.width,
        maxHeight: layout.maxHeight,
      }}
      onWheelCapture={onWheelCapture}
      onMouseDownCapture={onGestureCapture}
      onPointerDownCapture={onGestureCapture}
      onTouchStartCapture={onGestureCapture}
      onTouchMoveCapture={onGestureCapture}
    >
      {header}
      {children}
      {footer}
    </div>
  )
}
