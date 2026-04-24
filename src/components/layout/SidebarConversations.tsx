import React from 'react'
import { Plus, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import { groupConversationsByDate, formatRelativeTime } from '@/utils/conversation-utils'

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

  // 调试日志
  console.log('[SidebarConversations] appId:', appId, 'conversations:', conversations, 'isLoading:', isLoading)

  if (!appId) return null

  // 折叠状态下不显示
  if (isCollapsed) return null

  return (
    <div className="border-t border-border-subtle py-2 flex flex-col min-h-0 flex-1">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <span className="text-xs font-medium text-text-tertiary truncate flex-1">
          {appName || '应用'} 对话
        </span>
        <button
          onClick={onCreateNew}
          className="p-1 hover:bg-background-subtle rounded transition-colors flex-shrink-0"
          title="新建对话"
        >
          <Plus className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
      
      {/* 对话列表 - 移除高度限制，使用 flex-1 充分利用空间 */}
      <div className="flex-1 overflow-y-auto px-2 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-4">
            暂无对话记录
          </p>
        ) : (
          <div className="space-y-3">
            {groupedConversations.map(({ group, conversations: groupConvs }) => (
              <div key={group}>
                {/* 分组标题 */}
                <div className="px-2 py-1.5 sticky top-0 bg-components-sidebar-bg z-10">
                  <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
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
                        "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors",
                        currentConversationId === conv.id
                          ? "bg-state-focus-subtle text-state-focus"
                          : "hover:bg-background-subtle text-text-secondary"
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate">
                          {conv.name || conv.title || '未命名对话'}
                        </div>
                        <div className="text-[10px] text-text-tertiary">
                          {formatRelativeTime(conv.update_time || conv.update_date)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
