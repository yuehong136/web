/**
 * 应用空状态组件
 * 参考 MemoryEmptyState 实现
 */

import React from 'react'
import { Sparkles, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { STUDIO_TEXTS } from '@/constants/studio-texts'

interface AppEmptyStateProps {
  type: 'list' | 'search'
  onAction?: () => void
  className?: string
}

const emptyStates = {
  list: {
    icon: Sparkles,
    title: STUDIO_TEXTS.noApps,
    description: STUDIO_TEXTS.noAppsDescription,
    actionText: STUDIO_TEXTS.createFirstApp,
    showAction: true,
  },
  search: {
    icon: Search,
    title: STUDIO_TEXTS.noResults,
    description: STUDIO_TEXTS.noResultsDescription,
    actionText: '',
    showAction: false,
  },
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  type,
  onAction,
  className,
}) => {
  const config = emptyStates[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* 图标 */}
      <div className="mb-space-lg relative">
        <div
          className={cn(
            'w-20 h-20 rounded-radius-xl flex items-center justify-center',
            'bg-gradient-to-br from-components-avatar-gradient-purple-from/10 to-components-avatar-gradient-purple-to/10'
          )}
        >
          <Icon className="w-icon-2xl h-icon-2xl text-components-badge-purple-text" />
        </div>
        {/* 装饰点 */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-components-avatar-gradient-purple-from rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-components-avatar-gradient-purple-to rounded-full animate-pulse delay-150" />
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-text-primary mb-space-sm">
        {config.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-text-secondary max-w-sm mb-space-lg">
        {config.description}
      </p>

      {/* 操作按钮 */}
      {config.showAction && onAction && (
        <Button onClick={onAction} className="gap-space-sm">
          <Plus className="w-icon-sm h-icon-sm" />
          {config.actionText}
        </Button>
      )}
    </div>
  )
}

AppEmptyState.displayName = 'AppEmptyState'
