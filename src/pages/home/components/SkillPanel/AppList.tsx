import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFetchConversationsByDialog } from '@/hooks/use-chat-request'
import { AppHistoryPanel } from './AppHistoryPanel'
import type { DialogApp } from '@/types/api'

interface AppListProps {
  apps: DialogApp[]
  selectedAppIds: string[]
  onSelectApp: (app: DialogApp, conversationId?: string | null) => void
  onStartNewConversation: () => void
  isLoading: boolean
  searchTerm: string
}

export const AppList: React.FC<AppListProps> = ({
  apps,
  selectedAppIds,
  onSelectApp,
  onStartNewConversation,
  isLoading,
  searchTerm,
}) => {
  const { t } = useTranslation()
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null)

  // 获取 hover 应用的历史对话
  const { conversations, isLoading: loadingHistory } =
    useFetchConversationsByDialog(hoveredAppId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-text-tertiary" />
        <p className="text-sm text-text-secondary">
          {searchTerm
            ? t('home.skillPanel.noAppMatch', '没有找到匹配的应用')
            : t('home.skillPanel.noApps', '暂无可用应用')}
        </p>
      </div>
    )
  }

  return (
    <div className="py-1">
      {apps.map((app) => {
        const isSelected = selectedAppIds.includes(app.id)
        const isHovered = hoveredAppId === app.id

        return (
          <div
            key={app.id}
            className="relative"
            onMouseEnter={() => setHoveredAppId(app.id)}
            onMouseLeave={() => setHoveredAppId(null)}
          >
            {/* 应用项 */}
            <button
              onClick={() => onSelectApp(app, null)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'bg-state-focus-subtle'
                  : 'hover:bg-background-subtle',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg',
                  isSelected
                    ? 'bg-state-focus text-text-inverted'
                    : 'bg-background-subtle text-text-secondary',
                )}
              >
                {app.icon ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {app.name}
                </div>
                {app.description && (
                  <div className="truncate text-xs text-text-tertiary">
                    {app.description}
                  </div>
                )}
              </div>
              {/* 右箭头，表示有子菜单 */}
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
            </button>

            {/* 向右展开的历史面板 */}
            {isHovered && (
              <AppHistoryPanel
                app={app}
                conversations={conversations}
                isLoading={loadingHistory}
                onSelectNew={() => {
                  // 如果是当前选中的应用，只开启新对话；否则选择该应用
                  if (isSelected) {
                    onStartNewConversation()
                  } else {
                    onSelectApp(app, null)
                  }
                }}
                onSelectConversation={(convId) => onSelectApp(app, convId)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
