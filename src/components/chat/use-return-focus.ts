import { useRef } from 'react'

/**
 * Returns focus to the element that had it when a programmatically opened
 * Radix dialog closes. Without a Dialog.Trigger, Radix has nothing to refocus
 * and focus falls to <body>. When that element lived in a popup that has since
 * closed (a citation popover's 详情 button), focus goes to the control that
 * opened the popup instead.
 */
export function useReturnFocus() {
  const targets = useRef<HTMLElement[]>([])

  return {
    onOpenAutoFocus: () => {
      targets.current = getReturnFocusTargets()
    },
    onCloseAutoFocus: (event: Event) => {
      const candidates = targets.current
      targets.current = []
      for (const target of candidates) {
        if (!target.isConnected) continue
        target.focus()
        if (document.activeElement === target) {
          event.preventDefault()
          return
        }
      }
    },
  }
}

function getReturnFocusTargets(): HTMLElement[] {
  const opener = document.activeElement
  if (!(opener instanceof HTMLElement) || opener === document.body) return []
  const popup = opener.closest<HTMLElement>('[role="dialog"][id]')
  const popupTrigger = popup
    ? Array.from(
        document.querySelectorAll<HTMLElement>('[aria-controls]'),
      ).find((element) =>
        element.getAttribute('aria-controls')?.split(/\s+/).includes(popup.id),
      )
    : undefined
  return popupTrigger ? [opener, popupTrigger] : [opener]
}
