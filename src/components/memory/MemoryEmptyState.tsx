/**
 * 记忆库空状态组件
 */

import { useTranslation } from 'react-i18next'
import { Brain, Search, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MemoryEmptyStateProps {
  type: 'list' | 'search' | 'messages'
  onAction?: () => void
  className?: string
}

const emptyStates = {
  list: {
    icon: Brain,
    titleKey: 'memory.empty.listTitle',
    descriptionKey: 'memory.empty.listDescription',
    actionTextKey: 'memory.page.create',
    showAction: true,
  },
  search: {
    icon: Search,
    titleKey: 'memory.empty.searchTitle',
    descriptionKey: 'memory.empty.searchDescription',
    actionTextKey: undefined,
    showAction: false,
  },
  messages: {
    icon: MessageSquare,
    titleKey: 'memory.empty.messagesTitle',
    descriptionKey: 'memory.empty.messagesDescription',
    actionTextKey: undefined,
    showAction: false,
  },
}

export function MemoryEmptyState({
  type,
  onAction,
  className,
}: MemoryEmptyStateProps) {
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
      <div className="mb-space-lg flex h-20 w-20 items-center justify-center rounded-radius-xl bg-components-page-state-icon-bg text-components-page-state-icon">
        <Icon className="size-icon-2xl" />
      </div>

      {/* 标题 */}
      <h3 className="mb-space-sm text-lg font-semibold text-text-primary">
        {t(config.titleKey)}
      </h3>

      {/* 描述 */}
      <p className="mb-space-lg max-w-sm text-sm text-text-secondary">
        {t(config.descriptionKey)}
      </p>

      {/* 操作按钮 */}
      {config.showAction && onAction && (
        <Button onClick={onAction} className="gap-space-sm">
          <Plus className="h-icon-sm w-icon-sm" />
          {config.actionTextKey ? t(config.actionTextKey) : null}
        </Button>
      )}
    </div>
  )
}
