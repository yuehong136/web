import { useCallback, type ReactNode } from 'react'
import {
  WorkbenchHeaderSlot,
  useWorkbenchHeader,
} from '@/components/layout/workbench-header'
import { cn } from '@/lib/utils'

export interface ChatThreadHeaderProps {
  title: ReactNode
  /** Who answers in this conversation (app or model), shown once here. */
  identity?: ReactNode
  actions?: ReactNode
  /** A new conversation without a title yet. */
  placeholder?: boolean
}

/**
 * The conversation header: title, the answering identity, then actions.
 * Inside the app shell it moves into the workbench header (one header row, as
 * on the boards); standalone and embedded pages keep it inline.
 */
export function ChatThreadHeader({
  title,
  identity,
  actions,
  placeholder = false,
}: ChatThreadHeaderProps) {
  const titleSlot = useWorkbenchHeader('title')
  const actionsSlot = useWorkbenchHeader('actions', Boolean(actions))
  const bindTitleRoot = titleSlot.bindRoot
  const bindActionsRoot = actionsSlot.bindRoot
  const bindRoot = useCallback(
    (element: HTMLElement | null) => {
      bindTitleRoot(element)
      bindActionsRoot(element)
    },
    [bindTitleRoot, bindActionsRoot],
  )

  const heading = (
    <>
      <h1
        className={cn(
          'min-w-0 truncate text-base',
          placeholder
            ? 'font-medium text-text-secondary'
            : 'font-semibold text-text-primary',
        )}
      >
        {title}
      </h1>
      {identity && (
        <span
          className="hidden h-6 max-w-60 min-w-0 shrink-0 items-center gap-space-xs rounded-radius-md border border-border-default bg-background-surface ps-space-xs pe-space-sm text-xs text-text-secondary sm:inline-flex"
          data-thread-identity
        >
          {identity}
        </span>
      )}
    </>
  )
  const actionGroup = actions ? (
    <div className="ms-auto flex shrink-0 items-center gap-space-2xs">
      {actions}
    </div>
  ) : null

  if (titleSlot.placement === 'inline')
    return (
      <header
        ref={bindRoot}
        className={cn(
          'flex min-h-12 shrink-0 items-center gap-space-sm ps-space-md pe-space-sm',
          !placeholder && 'border-b border-border-subtle',
        )}
        data-thread-header
      >
        {heading}
        {actionGroup}
      </header>
    )

  return (
    <span ref={bindRoot} hidden data-thread-header data-placement="workbench">
      <WorkbenchHeaderSlot
        placement={titleSlot.placement}
        target={titleSlot.target}
        inline={null}
      >
        <div className="flex min-w-0 flex-1 items-center gap-space-sm">
          {heading}
        </div>
      </WorkbenchHeaderSlot>
      {actionGroup ? (
        <WorkbenchHeaderSlot
          placement={actionsSlot.placement}
          target={actionsSlot.target}
          inline={null}
        >
          {actionGroup}
        </WorkbenchHeaderSlot>
      ) : null}
    </span>
  )
}
