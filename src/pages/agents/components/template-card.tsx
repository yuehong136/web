import React from 'react'
import { GitBranch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import { countFlowNodes, resolveLocalizedText } from '@/lib/agent'
import type { AgentTemplate } from '@/types/agent'
import {
  getCategory,
  getToneClasses,
  normalizeCategoryKey,
} from './template-category-config'

interface TemplateCardProps {
  template: AgentTemplate
  onSelect: (template: AgentTemplate) => void
  className?: string
}

const TemplateAvatar: React.FC<{ name: string; avatar?: string }> = ({ name, avatar }) => {
  if (avatar) {
    const src =
      avatar.startsWith('data:') || avatar.startsWith('http')
        ? avatar
        : `data:image/png;base64,${avatar}`
    return (
      <img
        src={src}
        alt={name}
        className="h-12 w-12 rounded-radius-lg object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  const gradient = getAvatarGradient(name || 'T')
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-radius-lg',
        'bg-gradient-to-br shadow-elevation-low',
        gradient,
      )}
    >
      <span className="text-lg font-semibold text-white">
        {(name || 'T').charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  className,
}) => {
  const title = resolveLocalizedText(template.title, '未命名模板')
  const description = resolveLocalizedText(template.description, '模板描述将在后续增量补齐。')
  const nodeCount = countFlowNodes(template)
  const categoryKey = normalizeCategoryKey(template.canvas_type)
  const category = getCategory(categoryKey)
  const tone = getToneClasses(category.tone)
  const Icon = category.icon

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(template)
    }
  }

  return (
    <Card
      variant="default"
      padding="none"
      role="button"
      tabIndex={0}
      className={cn(
        'group relative flex h-full flex-col rounded-radius-lg',
        'border-components-card-border bg-components-card-bg',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-state-focus hover:bg-components-card-bg-hover hover:shadow-elevation-low',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus',
        className,
      )}
      onClick={() => onSelect(template)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-1 flex-col gap-space-md p-space-lg">
        <div className="flex items-start gap-space-base">
          <TemplateAvatar name={title} avatar={template.avatar} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-text-primary">
              {title}
            </p>
            <span
              className={cn(
                'mt-space-xs inline-flex items-center gap-space-xs rounded-radius-full px-space-sm py-space-xs text-xs font-semibold',
                tone.bg,
                tone.text,
              )}
            >
              <Icon className="h-3 w-3" />
              {category.label}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 min-h-16 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-space-base border-t border-border-subtle pt-space-base">
          <span className="flex items-center gap-space-xs text-sm font-medium text-text-tertiary">
            <GitBranch className="h-4 w-4" />
            {nodeCount} 节点
          </span>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(template)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            使用模板
          </Button>
        </div>
      </div>
    </Card>
  )
}

TemplateCard.displayName = 'TemplateCard'
