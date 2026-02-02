import React from 'react'
import { Sparkles, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DialogApp } from '@/types/api'

// 对话信息类型（来自 API 响应）
interface ConversationInfo {
  id: string
  name?: string
  title?: string
  update_time?: number
  update_date?: string
  message_count?: number
}

interface AppHistoryPanelProps {
  app: DialogApp
  conversations: ConversationInfo[]
  isLoading: boolean
  onSelectNew: () => void
  onSelectConversation: (conversationId: string) => void
}

// 格式化相对时间
const formatRelativeTime = (timestamp?: number | string): string => {
  if (!timestamp) return ''
  
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * 1000) 
    : new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export const AppHistoryPanel: React.FC<AppHistoryPanelProps> = ({
  app,
  conversations,
  isLoading,
  onSelectNew,
  onSelectConversation,
}) => {
  return (
    <div
      className={cn(
        "absolute left-full top-0 ml-1",
        "w-72 bg-components-card-bg rounded-xl",
        "border border-border-default shadow-lg",
        "z-50"
      )}
      // 阻止鼠标离开事件冒泡，保持面板打开
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-border-default">
        <h4 className="text-sm font-medium text-text-primary truncate">
          {app.name} 的对话历史
        </h4>
      </div>
      
      <div className="max-h-[280px] overflow-y-auto">
        {/* 新建对话选项 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelectNew()
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-subtle transition-colors"
        >
          <Sparkles className="w-4 h-4 text-state-focus flex-shrink-0" />
          <span className="text-sm font-medium text-text-primary">开启新对话</span>
        </button>
        
        <div className="h-px bg-border-subtle mx-4" />
        
        {/* 历史对话列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <MessageSquare className="w-6 h-6 text-text-tertiary mb-2" />
            <p className="text-xs text-text-tertiary">暂无历史对话</p>
          </div>
        ) : (
          conversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectConversation(conv.id)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-subtle text-left transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">
                  {conv.name || conv.title || '未命名对话'}
                </div>
                <div className="text-xs text-text-tertiary">
                  {formatRelativeTime(conv.update_time || conv.update_date)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
