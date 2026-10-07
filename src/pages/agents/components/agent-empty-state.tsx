import React from 'react'
import { Bot, FileInput, LayoutTemplate, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
    titleKey: 'agent.center.emptyTitle',
    title: 'No Agent assets yet',
    descriptionKey: 'agent.center.emptyDescription',
    description:
      'Create from blank, use a template, or import JSON to build your first Agent or Pipeline.',
  },
  search: {
    icon: Search,
    titleKey: 'agent.center.noMatchTitle',
    title: 'No matching assets',
    descriptionKey: 'agent.center.noMatchDescription',
    description: 'Try another keyword or adjust filters.',
  },
}

export const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  type,
  onCreate,
  onTemplate,
  onImport,
  className,
}) => {
  const { t } = useTranslation()
  const config = stateConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-16 text-center',
        className,
      )}
    >
      <div className="mb-space-lg flex h-20 w-20 items-center justify-center rounded-radius-xl bg-components-page-state-icon-bg text-components-page-state-icon">
        <Icon className="size-icon-2xl" />
      </div>

      <h3 className="mb-space-sm text-lg font-semibold text-text-primary">
        {t(config.titleKey, config.title)}
      </h3>
      <p className="mb-space-lg max-w-sm text-sm text-text-secondary">
        {t(config.descriptionKey, config.description)}
      </p>

      {type === 'list' ? (
        <div className="flex flex-wrap items-center justify-center gap-space-sm">
          {onCreate && (
            <Button onClick={onCreate} className="gap-space-sm">
              <Plus className="h-icon-sm w-icon-sm" />
              {t('agents.createAsset', '新建资产')}
            </Button>
          )}
          {onTemplate && (
            <Button
              variant="outline"
              onClick={onTemplate}
              className="gap-space-sm"
            >
              <LayoutTemplate className="h-icon-sm w-icon-sm" />
              {t('agents.createFromTemplate', '从模板创建')}
            </Button>
          )}
          {onImport && (
            <Button
              variant="outline"
              onClick={onImport}
              className="gap-space-sm"
            >
              <FileInput className="h-icon-sm w-icon-sm" />
              {t('agents.importJson', '导入 JSON')}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

AgentEmptyState.displayName = 'AgentEmptyState'
