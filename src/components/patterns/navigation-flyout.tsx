import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { useActivePortalTheme } from '@/components/ui/portal-theme'

interface NavigationFlyoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  children: React.ReactNode
  content: React.ReactNode
}

/** Hover previews do not move focus; ArrowRight opens the same panel for keyboard navigation. */
export const NavigationFlyout = ({
  open,
  onOpenChange,
  label,
  children,
  content,
}: NavigationFlyoutProps) => {
  const anchor = React.useRef<HTMLDivElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const keyboard = React.useRef(false)
  const closing = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const theme = useActivePortalTheme(open)
  const cancelClose = () => {
    if (closing.current) clearTimeout(closing.current)
  }
  const scheduleClose = () => {
    cancelClose()
    if (keyboard.current) return
    closing.current = setTimeout(() => onOpenChange(false), 140)
  }
  React.useEffect(
    () => () => {
      if (closing.current) clearTimeout(closing.current)
    },
    [],
  )
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>
        <div
          ref={anchor}
          onPointerEnter={(event) => {
            if (event.pointerType !== 'mouse') return
            keyboard.current = false
            cancelClose()
            onOpenChange(true)
          }}
          onPointerLeave={scheduleClose}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              cancelClose()
              keyboard.current = true
              onOpenChange(true)
            }
          }}
        >
          {children}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          ref={panel}
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          aria-label={label}
          data-theme={theme}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            if (keyboard.current)
              panel.current
                ?.querySelector<HTMLElement>(
                  'a[href],button:not([disabled]),input:not([disabled])',
                )
                ?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (keyboard.current)
              anchor.current?.querySelector<HTMLElement>('a,button')?.focus()
          }}
          className="z-40 flex max-h-[var(--radix-popover-content-available-height)] w-[224px] flex-col overflow-hidden rounded-radius-xl border border-border-default bg-components-sidebar-bg text-text-primary shadow-elevation-high outline-hidden"
        >
          {content}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
