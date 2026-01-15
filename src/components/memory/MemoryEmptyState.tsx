/**
 * 记忆库空状态组件
 */

import React from 'react'
import { Brain, Search, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'

interface MemoryEmptyStateProps {
  type: 'list' | 'search' | 'messages'
  onAction?: () => void
  className?: string
}

const emptyStates = {
  list: {
    icon: Brain,
    title: MEMORY_TEXTS.memories.noMemories,
    description: MEMORY_TEXTS.memories.noMemoriesDescription,
    actionText: MEMORY_TEXTS.memories.createMemory,
    showAction: true,
  },
  search: {
    icon: Search,
    title: MEMORY_TEXTS.memories.noResults,
    description: MEMORY_TEXTS.memories.noResultsDescription,
    actionText: '',
    showAction: false,
  },
  messages: {
    icon: MessageSquare,
    title: MEMORY_TEXTS.messages.noMessages,
    description: MEMORY_TEXTS.messages.noMessagesDescription,
    actionText: '',
    showAction: false,
  },
}

export const MemoryEmptyState: React.FC<MemoryEmptyStateProps> = ({
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
      <div className="mb-6 relative">
        <div
          className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
            'dark:from-purple-500/20 dark:to-pink-500/20'
          )}
        >
          <Icon className="h-10 w-10 text-purple-500" />
        </div>
        {/* 装饰点 */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-150" />
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {config.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {config.description}
      </p>

      {/* 操作按钮 */}
      {config.showAction && onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="h-4 w-4" />
          {config.actionText}
        </Button>
      )}
    </div>
  )
}

MemoryEmptyState.displayName = 'MemoryEmptyState'
