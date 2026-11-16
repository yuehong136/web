import * as React from 'react'
import { cn } from '@/lib/utils'

export type KbdProps = React.HTMLAttributes<HTMLElement>

/** One key cap, e.g. in a tooltip or menu shortcut: mono 12px on the surface. */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex h-icon-sm min-w-icon-sm items-center justify-center rounded-radius-sm border border-border-default bg-background-surface px-space-2xs font-mono text-xs leading-none font-medium whitespace-nowrap text-text-tertiary',
        className,
      )}
      {...props}
    />
  ),
)
Kbd.displayName = 'Kbd'

export interface KbdShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Key names in press order, e.g. `['Ctrl', 'K']`. */
  keys: string | readonly string[]
}

/** A key combination rendered as separate caps, read out as one phrase. */
export const KbdShortcut = ({
  keys,
  className,
  ...props
}: KbdShortcutProps) => {
  const list = typeof keys === 'string' ? [keys] : keys
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-space-2xs',
        className,
      )}
      {...props}
    >
      {list.map((key, index) => (
        <Kbd key={`${key}-${index}`}>{key}</Kbd>
      ))}
    </span>
  )
}
