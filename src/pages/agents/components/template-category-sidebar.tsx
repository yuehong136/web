import React from 'react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_ORDER,
  getToneClasses,
  type TemplateCategory,
} from './template-category-config'

interface TemplateCategorySidebarProps {
  value: string
  onChange: (key: string) => void
  counts: Record<string, number>
  className?: string
}

export const TemplateCategorySidebar: React.FC<TemplateCategorySidebarProps> = ({
  value,
  onChange,
  counts,
  className,
}) => {
  const renderItem = (category: TemplateCategory) => {
    const Icon = category.icon
    const isActive = value === category.key
    const count = counts[category.key] ?? 0
    const tone = getToneClasses(category.tone)

    return (
      <button
        key={category.key}
        type="button"
        onClick={() => onChange(category.key)}
        className={cn(
          'group relative flex w-full items-center gap-space-sm rounded-radius-md px-space-base py-space-sm text-left',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-state-focus',
          isActive
            ? 'bg-transparent text-text-primary'
            : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary',
        )}
      >
        {isActive ? (
          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-radius-full bg-state-focus" />
        ) : null}
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-radius-md transition-colors',
            isActive
              ? tone.text
              : 'text-text-tertiary group-hover:text-text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <span
          className={cn(
            'flex-1 truncate text-sm',
            isActive ? 'font-semibold text-text-primary' : 'font-medium',
          )}
        >
          {category.label}
        </span>

        {count > 0 ? (
          <span
            className={cn(
              'min-w-6 text-right text-xs font-semibold tabular-nums',
              isActive
                ? 'text-state-focus'
                : 'text-text-tertiary',
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
    )
  }

  const allItem = CATEGORY_ORDER.find((c) => c.isAll)!
  const recommendedItem = CATEGORY_ORDER.find((c) => c.isRecommended)!
  const regularItems = CATEGORY_ORDER.filter((c) => !c.isAll && !c.isRecommended)

  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-components-console-border bg-components-console-surface',
        className,
      )}
    >
      <div className="border-b border-border-subtle px-space-lg py-space-base">
        <p className="text-sm font-semibold text-text-primary">
          模板分类
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-space-base py-space-base">
        <div className="flex flex-col gap-space-xs">
          {renderItem(allItem)}
          {renderItem(recommendedItem)}
        </div>

        <div className="my-space-md h-px bg-border-subtle" />

        <div className="flex flex-col gap-space-xs">
          {regularItems.map(renderItem)}
        </div>
      </div>
    </aside>
  )
}

TemplateCategorySidebar.displayName = 'TemplateCategorySidebar'
