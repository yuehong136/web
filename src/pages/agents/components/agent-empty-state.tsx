import { useTranslation } from 'react-i18next'
import { Bot, FileInput, LayoutTemplate, Plus, Search } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'
interface AgentEmptyStateProps {
  type: 'list' | 'search'
  onCreate?: () => void
  onTemplate?: () => void
  onImport?: () => void
  onReset?: () => void
  className?: string
}
export function AgentEmptyState({
  type,
  onCreate,
  onTemplate,
  onImport,
  onReset,
  className,
}: AgentEmptyStateProps) {
  const { t } = useTranslation()
  const search = type === 'search'
  return (
    <PageEmptyState
      className={className}
      title={t(search ? 'agents.noMatchTitle' : 'agents.emptyTitle')}
      description={t(
        search ? 'agents.noMatchDescription' : 'agents.emptyDescription',
      )}
      icon={
        search ? (
          <Search className="size-icon-lg" />
        ) : (
          <Bot className="size-icon-lg" />
        )
      }
      action={
        search ? (
          onReset && (
            <Button variant="outline" onClick={onReset}>
              {t('agents.resetFilters')}
            </Button>
          )
        ) : (
          <div className="flex flex-wrap justify-center gap-space-sm">
            {onCreate && (
              <Button onClick={onCreate}>
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t('agents.createAsset')}
              </Button>
            )}
            {onTemplate && (
              <Button variant="outline" onClick={onTemplate}>
                <LayoutTemplate className="size-icon-sm" aria-hidden="true" />
                {t('agents.createFromTemplate')}
              </Button>
            )}
            {onImport && (
              <Button variant="outline" onClick={onImport}>
                <FileInput className="size-icon-sm" aria-hidden="true" />
                {t('agents.importJson')}
              </Button>
            )}
          </div>
        )
      }
    />
  )
}
