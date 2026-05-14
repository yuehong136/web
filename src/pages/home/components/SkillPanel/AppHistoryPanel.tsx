import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
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
const formatRelativeTime = (
  timestamp: number | string | undefined,
  t: ReturnType<typeof useTranslation>['t'],
): string => {
  if (!timestamp) return ''

  const date =
    typeof timestamp === 'number'
      ? new Date(timestamp * 1000)
      : new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return t('common.justNow', '刚刚')
  if (diffMinutes < 60) {
    return t('home.skillPanel.minutesAgo', '{{count}}分钟前', {
      count: diffMinutes,
    })
  }
  if (diffHours < 24) {
    return t('home.skillPanel.hoursAgo', '{{count}}小时前', {
      count: diffHours,
    })
  }
  if (diffDays === 1) return t('common.yesterday', '昨天')
  if (diffDays < 7) {
    return t('home.skillPanel.daysAgo', '{{count}}天前', {
      count: diffDays,
    })
  }

  return date.toLocaleDateString(getCurrentLanguage(), {
    month: 'short',
    day: 'numeric',
  })
}

export const AppHistoryPanel: React.FC<AppHistoryPanelProps> = ({
  app,
  conversations,
  isLoading,
  onSelectNew,
  onSelectConversation,
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'absolute left-full top-0 ml-1',
        'w-72 rounded-xl bg-components-card-bg',
        'border border-border-default shadow-lg',
        'z-50',
      )}
      // 阻止鼠标离开事件冒泡，保持面板打开
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* 标题 */}
      <div className="border-b border-border-default px-4 py-3">
        <h4 className="truncate text-sm font-medium text-text-primary">
          {t('home.skillPanel.historyTitle', '{{name}} 的对话历史', {
            name: app.name,
          })}
        </h4>
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {/* 新建对话选项 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelectNew()
          }}
          className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-background-subtle"
        >
          <Sparkles className="h-4 w-4 flex-shrink-0 text-state-focus" />
          <span className="text-sm font-medium text-text-primary">
            {t('home.skillPanel.newConversation', '开启新对话')}
          </span>
        </button>

        <div className="mx-4 h-px bg-border-subtle" />

        {/* 历史对话列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <MessageSquare className="mb-2 h-6 w-6 text-text-tertiary" />
            <p className="text-xs text-text-tertiary">
              {t('home.skillPanel.noHistory', '暂无历史对话')}
            </p>
          </div>
        ) : (
          conversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectConversation(conv.id)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background-subtle"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text-primary">
                  {conv.name ||
                    conv.title ||
                    t('home.skillPanel.unnamedConversation', '未命名对话')}
                </div>
                <div className="text-xs text-text-tertiary">
                  {formatRelativeTime(conv.update_time || conv.update_date, t)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
