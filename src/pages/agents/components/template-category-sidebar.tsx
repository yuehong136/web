import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ManagedSecondaryNavigation } from '@/components/layout/workbench-navigation'
import {
  CATEGORY_ORDER,
  categoryLabelKey,
  type TemplateCategory,
} from './template-category-config'

interface TemplateCategorySidebarProps {
  value: string
  onChange: (key: string) => void
  counts: Record<string, number>
  className?: string
}

/**
 * Template categories in the shell's secondary panel. Rows match the shared
 * secondary navigation (selected background, neutral icons, quiet counts).
 */
export function TemplateCategorySidebar({
  value,
  onChange,
  counts,
  className,
}: TemplateCategorySidebarProps) {
  const { t } = useTranslation()
  const title = t('agents.templateCategories')
  const renderItem = (category: TemplateCategory) => {
    const Icon = category.icon
    const active = value === category.key
    const count = counts[category.key] ?? 0
    return (
      <li key={category.key}>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => onChange(category.key)}
          className={cn(
            'flex min-h-[var(--control-height-sm)] w-full items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-left text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus',
            active
              ? 'bg-accent-soft font-medium text-accent-fg'
              : 'text-fg-muted hover:bg-fill-hover hover:text-fg',
          )}
        >
          <Icon className="size-icon-sm shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            {t(categoryLabelKey(category.key))}
          </span>
          {count > 0 ? (
            <span className="text-xs text-fg-subtle tabular-nums">{count}</span>
          ) : null}
        </button>
      </li>
    )
  }
  const pinned = CATEGORY_ORDER.filter(
    (category) => category.isAll || category.isRecommended,
  )
  const regular = CATEGORY_ORDER.filter(
    (category) => !category.isAll && !category.isRecommended,
  )

  return (
    <ManagedSecondaryNavigation
      section="agents"
      title={title}
      fallbackClassName={cn(
        'h-full w-64 shrink-0 border-r border-line-subtle',
        className,
      )}
    >
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
        <header className="flex min-h-[calc(var(--control-height)+var(--space-sm))] shrink-0 items-center px-space-base py-space-sm">
          <p className="truncate text-sm font-semibold text-fg">{title}</p>
        </header>
        <nav
          aria-label={title}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-space-sm"
        >
          <ul className="flex flex-col gap-space-2xs">
            {pinned.map(renderItem)}
          </ul>
          <ul className="mt-space-sm flex flex-col gap-space-2xs border-t border-line-subtle pt-space-sm">
            {regular.map(renderItem)}
          </ul>
        </nav>
      </div>
    </ManagedSecondaryNavigation>
  )
}
