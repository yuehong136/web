import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { cn } from '@/lib/utils'

export interface ConversationListItem {
  key: string
  label: string
  /** Items with the same group are listed under one heading, in order. */
  group?: string
}

export interface ConversationListAction {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  onSelect: (item: ConversationListItem) => void
}

export interface ConversationListProps {
  items: ConversationListItem[]
  activeKey?: string
  onSelect: (key: string) => void
  /** The "new conversation" button above the list. */
  creation?: { label: string; icon?: ReactNode; onClick: () => void }
  groupLabel?: (group: string) => ReactNode
  /** Per-conversation menu (rename, delete…). */
  actions?: ConversationListAction[]
  /** Accessible name of a conversation's menu button. */
  actionsLabel?: (item: ConversationListItem) => string
  className?: string
}

/**
 * A side panel's conversations: a new-conversation button, then the
 * conversations grouped by date. The current one is marked with
 * `aria-current`; each has a menu that shows on hover or keyboard focus
 * (always on touch screens).
 */
export function ConversationList({
  items,
  activeKey,
  onSelect,
  creation,
  groupLabel,
  actions = [],
  actionsLabel,
  className,
}: ConversationListProps) {
  const groups = new Map<string, ConversationListItem[]>()
  for (const item of items) {
    const group = item.group ?? ''
    groups.set(group, [...(groups.get(group) ?? []), item])
  }
  return (
    <div className={cn('flex flex-col gap-space-2xs p-space-sm', className)}>
      {creation ? (
        <button
          type="button"
          onClick={creation.onClick}
          className="mb-space-xs flex items-center gap-space-sm rounded-radius-lg bg-fill-selected px-space-base py-space-sm text-sm font-medium text-fg outline-hidden transition-colors hover:bg-action-bg hover:text-action-fg focus-visible:ring-2 focus-visible:ring-line-focus motion-reduce:transition-none [&_svg]:size-icon-sm"
        >
          {creation.icon}
          {creation.label}
        </button>
      ) : null}
      {[...groups].map(([group, entries]) => (
        <section key={group || 'all'} className="min-w-0">
          {group && groupLabel ? (
            <h3 className="px-space-sm pt-space-sm pb-space-2xs text-xs font-medium text-fg-subtle">
              {groupLabel(group)}
            </h3>
          ) : null}
          <ul className="flex flex-col gap-space-2xs">
            {entries.map((item) => {
              const active = item.key === activeKey
              return (
                <li key={item.key} className="group/conversation relative">
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(item.key)}
                    className={cn(
                      'flex w-full min-w-0 items-center rounded-radius-md px-space-sm py-space-xs text-start text-sm outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-line-focus motion-reduce:transition-none',
                      actions.length > 0 && 'pe-space-2xl',
                      active
                        ? 'bg-fill-selected text-fg'
                        : 'text-fg hover:bg-fill-hover',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                  </button>
                  {actions.length > 0 ? (
                    <ActionMenu>
                      <ActionMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={actionsLabel?.(item) ?? item.label}
                          className="absolute top-1/2 right-space-2xs -translate-y-1/2 opacity-0 group-focus-within/conversation:opacity-100 group-hover/conversation:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                        >
                          <MoreHorizontal
                            aria-hidden="true"
                            className="size-icon-sm"
                          />
                        </Button>
                      </ActionMenuTrigger>
                      <ActionMenuContent align="end">
                        {actions.map((action) => (
                          <ActionMenuItem
                            key={action.key}
                            danger={action.danger}
                            onSelect={() => action.onSelect(item)}
                          >
                            {action.icon}
                            {action.label}
                          </ActionMenuItem>
                        ))}
                      </ActionMenuContent>
                    </ActionMenu>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
