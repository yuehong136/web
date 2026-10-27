import { useTranslation } from 'react-i18next'
import { AppWindow, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageEmptyState } from '@/components/patterns/page-states'

interface AppEmptyStateProps {
  type: 'list' | 'search'
  onAction?: () => void
  onReset?: () => void
  className?: string
}
export function AppEmptyState({
  type,
  onAction,
  onReset,
  className,
}: AppEmptyStateProps) {
  const { t } = useTranslation()
  const search = type === 'search'
  return (
    <PageEmptyState
      className={className}
      title={t(search ? 'studio.empty.searchTitle' : 'studio.empty.listTitle')}
      description={t(
        search
          ? 'studio.empty.searchDescription'
          : 'studio.empty.listDescription',
      )}
      icon={
        search ? (
          <Search className="size-icon-lg" />
        ) : (
          <AppWindow className="size-icon-lg" />
        )
      }
      action={
        search
          ? onReset && (
              <Button variant="outline" onClick={onReset}>
                {t('studio.filters.reset')}
              </Button>
            )
          : onAction && (
              <Button onClick={onAction}>
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t('studio.empty.createFirst')}
              </Button>
            )
      }
    />
  )
}
