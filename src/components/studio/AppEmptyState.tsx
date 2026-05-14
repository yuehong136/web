/**
 * 应用空状态组件
 * 参考 MemoryEmptyState 实现
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppEmptyStateProps {
  type: 'list' | 'search'
  onAction?: () => void
  className?: string
}

const emptyStates = {
  list: {
    icon: Sparkles,
    titleKey: 'studio.empty.listTitle',
    title: '还没有应用',
    descriptionKey: 'studio.empty.listDescription',
    description: '开始创建您的第一个 AI 应用，让 AI 为您的业务赋能',
    actionTextKey: 'studio.empty.createFirst',
    actionText: '创建第一个应用',
    showAction: true,
  },
  search: {
    icon: Search,
    titleKey: 'studio.empty.searchTitle',
    title: '未找到匹配的应用',
    descriptionKey: 'studio.empty.searchDescription',
    description: '尝试调整搜索条件或筛选器',
    actionTextKey: undefined,
    actionText: '',
    showAction: false,
  },
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  type,
  onAction,
  className,
}) => {
  const { t } = useTranslation()
  const config = emptyStates[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-16 text-center',
        className,
      )}
    >
      {/* 图标 */}
      <div className="mb-space-lg relative">
        <div
          className={cn(
            'rounded-radius-xl flex h-20 w-20 items-center justify-center',
            'from-components-avatar-gradient-purple-from/10 to-components-avatar-gradient-purple-to/10 bg-gradient-to-br',
          )}
        >
          <Icon className="w-icon-2xl h-icon-2xl text-components-badge-purple-text" />
        </div>
        {/* 装饰点 */}
        <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-components-avatar-gradient-purple-from" />
        <div className="absolute -bottom-1 -left-1 h-2 w-2 animate-pulse rounded-full bg-components-avatar-gradient-purple-to delay-150" />
      </div>

      {/* 标题 */}
      <h3 className="mb-space-sm text-lg font-semibold text-text-primary">
        {t(config.titleKey, config.title)}
      </h3>

      {/* 描述 */}
      <p className="mb-space-lg max-w-sm text-sm text-text-secondary">
        {t(config.descriptionKey, config.description)}
      </p>

      {/* 操作按钮 */}
      {config.showAction && onAction && (
        <Button onClick={onAction} className="gap-space-sm">
          <Plus className="w-icon-sm h-icon-sm" />
          {config.actionTextKey
            ? t(config.actionTextKey, config.actionText)
            : config.actionText}
        </Button>
      )}
    </div>
  )
}

AppEmptyState.displayName = 'AppEmptyState'
