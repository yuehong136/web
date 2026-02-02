import React, { useState } from 'react'
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
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null)
  
  // 获取 hover 应用的历史对话
  const { conversations, isLoading: loadingHistory } = useFetchConversationsByDialog(hoveredAppId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="w-8 h-8 text-text-tertiary mb-2" />
        <p className="text-sm text-text-secondary">
          {searchTerm ? '没有找到匹配的应用' : '暂无可用应用'}
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
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'bg-state-focus-subtle'
                  : 'hover:bg-background-subtle'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
                  isSelected
                    ? 'bg-state-focus text-text-inverted'
                    : 'bg-background-subtle text-text-secondary'
                )}
              >
                {app.icon ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {app.name}
                </div>
                {app.description && (
                  <div className="text-xs text-text-tertiary truncate">
                    {app.description}
                  </div>
                )}
              </div>
              {/* 右箭头，表示有子菜单 */}
              <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
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
