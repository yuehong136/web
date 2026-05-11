import React from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
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
  const { conversations, isLoading } = useFetchConversationsByDialog(appId)

  // 按日期分组对话（侧边栏空间有限，不单独显示"昨天"分组）
  const groupedConversations = React.useMemo(() => {
    return groupConversationsByDate(conversations, { includeYesterday: false })
  }, [conversations])

  if (!appId) return null

  // 折叠状态下不显示
  if (isCollapsed) return null

  return (
    <div className="px-space-sm py-space-sm flex min-h-0 flex-1 flex-col">
      {/* 标题栏 */}
      <div className="rounded-radius-lg px-space-sm py-space-xs flex flex-shrink-0 items-center justify-between bg-background-subtle">
        <span className="flex-1 truncate text-xs font-medium text-text-tertiary">
          {appName || '应用'} 对话
        </span>
        <button
          onClick={onCreateNew}
          className="rounded-radius-sm p-space-2xs flex-shrink-0 transition-colors hover:bg-components-sidebar-item-bg-hover"
          title="新建对话"
        >
          <Plus className="h-3.5 w-3.5 text-text-tertiary" />
        </button>
      </div>

      {/* 对话列表 - 移除高度限制，使用 flex-1 充分利用空间 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-tertiary">
            暂无对话记录
          </p>
        ) : (
          <div className="space-y-3">
            {groupedConversations.map(
              ({ group, conversations: groupConvs }) => (
                <div key={group}>
                  {/* 分组标题 */}
                  <div className="sticky top-0 z-10 bg-components-sidebar-bg px-2 py-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                      {group}
                    </span>
                  </div>
                  {/* 分组内的对话 */}
                  <div className="space-y-0.5">
                    {groupConvs.map((conv: any) => (
                      <button
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                          currentConversationId === conv.id
                            ? 'bg-state-focus-subtle text-state-focus'
                            : 'text-text-secondary hover:bg-background-subtle',
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs">
                            {conv.name || conv.title || '未命名对话'}
                          </div>
                          <div className="text-[10px] text-text-tertiary">
                            {formatRelativeTime(
                              conv.update_time || conv.update_date,
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
