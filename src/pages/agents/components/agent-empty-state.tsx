import React from 'react'
import { Bot, FileInput, LayoutTemplate, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AgentEmptyStateProps {
  type: 'list' | 'search'
  onCreate?: () => void
  onTemplate?: () => void
  onImport?: () => void
  className?: string
}

const stateConfig = {
  list: {
    icon: Bot,
    title: '还没有 Agent 资产',
    description: '从空白创建、模板创建或导入 JSON 开始构建你的第一个 Agent 或 Pipeline。',
  },
  search: {
    icon: Search,
    title: '没有匹配的资产',
    description: '换个关键词或调整筛选条件试试。',
  },
}

export const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  type,
  onCreate,
  onTemplate,
  onImport,
  className,
}) => {
  const config = stateConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className,
      )}
    >
      <div className="mb-space-lg relative">
        <div
          className={cn(
            'w-20 h-20 rounded-radius-xl flex items-center justify-center',
            'bg-gradient-to-br from-components-avatar-gradient-purple-from/10 to-components-avatar-gradient-purple-to/10',
          )}
        >
          <Icon className="w-icon-2xl h-icon-2xl text-components-badge-purple-text" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-components-avatar-gradient-purple-from rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-components-avatar-gradient-purple-to rounded-full animate-pulse delay-150" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-space-sm">
        {config.title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-space-lg">
        {config.description}
      </p>

      {type === 'list' ? (
        <div className="flex flex-wrap items-center justify-center gap-space-sm">
          {onCreate && (
            <Button onClick={onCreate} className="gap-space-sm">
              <Plus className="w-icon-sm h-icon-sm" />
              新建资产
            </Button>
          )}
          {onTemplate && (
            <Button variant="outline" onClick={onTemplate} className="gap-space-sm">
              <LayoutTemplate className="w-icon-sm h-icon-sm" />
              从模板创建
            </Button>
          )}
          {onImport && (
            <Button variant="outline" onClick={onImport} className="gap-space-sm">
              <FileInput className="w-icon-sm h-icon-sm" />
              导入 JSON
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

AgentEmptyState.displayName = 'AgentEmptyState'
