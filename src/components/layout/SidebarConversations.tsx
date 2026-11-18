import React from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { cn } from '@/lib/utils'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import { getCurrentLanguage } from '@/locales/i18n'
import {
  groupConversationsByDate,
  formatRelativeTime,
} from '@/utils/conversation-utils'

interface SidebarConversationsProps {
  appId: string | undefined
  appName: string | undefined
  /** App icon for the group row; falls back to the name's initial. */
  appIcon?: string | null
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateNew: () => void
  isCollapsed: boolean
  /** The web panel puts "New chat" at its top; Desktop keeps this button. */
  showCreate?: boolean
}

/**
 * The selected app's conversations as one group: the app row, then threads
 * by date, each with its relative time. Rows carry `data-nav-row` so the
 * mobile sheet can raise them to touch size.
 */
export const SidebarConversations: React.FC<SidebarConversationsProps> = ({
  appId,
  appName,
  appIcon,
  currentConversationId,
  onSelectConversation,
  onCreateNew,
  isCollapsed,
  showCreate = true,
}) => {
  const { t } = useTranslation()
  const { conversations, isLoading } = useFetchConversationsByDialog(appId)

  // The panel is narrow, so "yesterday" folds into the last seven days.
  const groupedConversations = React.useMemo(() => {
    return groupConversationsByDate(conversations, { includeYesterday: false })
  }, [conversations])

  if (!appId || isCollapsed) return null
  const name = appName || t('desktop.conversations.appFallback')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[var(--control-height-sm)] shrink-0 items-center gap-space-sm px-space-base pt-space-xs">
        <EntityAvatar name={name} src={appIcon} seed={appId} size="2xs" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
          {name}
        </span>
        {conversations.length > 0 ? (
          <span className="shrink-0 text-xs text-fg-subtle tabular-nums">
            {conversations.length}
          </span>
        ) : null}
        {showCreate ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCreateNew}
            aria-label={t('desktop.conversations.newConversation')}
          >
            <Plus className="size-icon-sm" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <nav
        aria-label={t('desktop.conversations.panelTitle', { appName: name })}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-space-sm pb-space-sm"
      >
        {isLoading && conversations.length === 0 ? (
          <div className="flex justify-center py-space-lg">
            <Spinner size="sm" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-space-sm py-space-lg text-center text-xs text-fg-subtle">
            {t('desktop.conversations.empty')}
          </p>
        ) : (
          groupedConversations.map(({ group, conversations: groupConvs }) => (
            <section
              key={group}
              aria-label={t(`desktop.conversations.groups.${group}`)}
            >
              <p
                aria-hidden="true"
                className="sticky top-0 z-10 bg-canvas px-space-sm pt-space-sm pb-space-2xs text-xs font-medium text-fg-subtle"
              >
                {t(`desktop.conversations.groups.${group}`)}
              </p>
              <ul className="flex flex-col gap-space-2xs">
                {groupConvs.map((conv) => {
                  const active = currentConversationId === conv.id
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        data-nav-row
                        onClick={() => onSelectConversation(conv.id)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[var(--control-height-sm)] w-full items-center gap-space-sm rounded-radius-md px-space-sm text-left text-sm outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-line-focus motion-reduce:transition-none',
                          active
                            ? 'bg-accent-soft font-medium text-accent-fg'
                            : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
                        )}
                      >
                        {/* Whose conversation it is, at a glance. */}
                        <EntityAvatar
                          name={name}
                          src={appIcon}
                          seed={appId}
                          size="xs"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {conv.name ||
                            conv.title ||
                            t('desktop.conversations.untitled')}
                        </span>
                        <span className="shrink-0 text-xs font-normal text-fg-subtle tabular-nums">
                          {formatRelativeTime(
                            conv.update_time || conv.update_date,
                            {
                              locale: getCurrentLanguage(),
                              format: (key, count) =>
                                t(`desktop.conversations.time.${key}`, {
                                  count,
                                }),
                            },
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </nav>
    </div>
  )
}
