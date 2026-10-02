import React from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onCreateNew: () => void
  isCollapsed: boolean
}

export const SidebarConversations: React.FC<SidebarConversationsProps> = ({
  appId,
  appName,
  currentConversationId,
  onSelectConversation,
  onCreateNew,
  isCollapsed,
}) => {
  const { t } = useTranslation()
  const { conversations, isLoading } = useFetchConversationsByDialog(appId)

  // 按日期分组对话（侧边栏空间有限，不单独显示"昨天"分组）
  const groupedConversations = React.useMemo(() => {
    return groupConversationsByDate(conversations, { includeYesterday: false })
  }, [conversations])

  if (!appId) return null

  // 折叠状态下不显示
  if (isCollapsed) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col px-space-sm py-space-sm">
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center justify-between rounded-radius-lg bg-background-subtle px-space-sm py-space-xs">
        <span className="flex-1 truncate text-xs font-medium text-text-tertiary">
          {t('desktop.conversations.panelTitle', {
            appName: appName || t('desktop.conversations.appFallback'),
          })}
        </span>
        <button
          type="button"
          onClick={onCreateNew}
          className="shrink-0 rounded-radius-sm p-space-2xs transition-colors hover:bg-components-sidebar-item-bg-hover"
          aria-label={t('desktop.conversations.newConversation')}
          title={t('desktop.conversations.newConversation')}
        >
          <Plus className="size-icon-sm text-text-tertiary" />
        </button>
      </div>

      {/* 对话列表 - 移除高度限制，使用 flex-1 充分利用空间 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-space-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-space-lg">
            <div className="size-icon-sm animate-spin rounded-radius-full border-2 border-text-tertiary border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="py-space-lg text-center text-xs text-text-tertiary">
            {t('desktop.conversations.empty')}
          </p>
        ) : (
          <div className="space-y-space-md">
            {groupedConversations.map(
              ({ group, conversations: groupConvs }) => (
                <div key={group}>
                  {/* 分组标题 */}
                  <div className="sticky top-0 z-10 bg-components-sidebar-bg px-space-sm py-space-xs">
                    <span className="text-xs font-medium tracking-wide text-text-tertiary uppercase">
                      {t(`desktop.conversations.groups.${group}`)}
                    </span>
                  </div>
                  {/* 分组内的对话 */}
                  <div className="space-y-space-2xs">
                    {groupConvs.map((conv) => (
                      <button
                        type="button"
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={cn(
                          'flex w-full items-center gap-space-sm rounded-radius-lg px-space-sm py-space-sm text-left transition-colors',
                          currentConversationId === conv.id
                            ? 'bg-state-focus-subtle text-state-focus'
                            : 'text-text-secondary hover:bg-background-subtle',
                        )}
                      >
                        <MessageSquare className="size-icon-sm shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs">
                            {conv.name ||
                              conv.title ||
                              t('desktop.conversations.untitled')}
                          </div>
                          <div className="text-xs text-text-tertiary">
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
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
