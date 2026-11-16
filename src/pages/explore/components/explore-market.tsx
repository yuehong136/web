import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResourceCard, ResourceGrid } from '@/components/patterns/resource-card'
import { ModelChip } from '@/pages/home/components/model-chip'
import {
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import type { DialogApp } from '@/types/api'

/**
 * Every dialog app as a card; the ones already in the workspace are marked as
 * added and open a conversation with the app.
 */
export function ExploreMarket({
  apps,
  loading,
  onOpenApp,
}: {
  apps: DialogApp[]
  loading: boolean
  /** Starts a conversation with an app that is already in the workspace. */
  onOpenApp?: (appId: string) => void
}) {
  const { t } = useTranslation()
  if (loading)
    return (
      <PageLoadingState
        title={t('explore.sidebar.loadingApps')}
        description={null}
      />
    )
  if (!apps.length)
    return <PageEmptyState title={t('explore.sidebar.noApps')} />
  return (
    <div className="flex-1 overflow-y-auto">
      <ResourceGrid label={t('explore.header.market')}>
        {apps.map((app) => {
          const added = app.status === '1'
          return (
            <ResourceCard
              key={app.id}
              name={app.name}
              description={app.description || undefined}
              avatar={{ src: app.icon, seed: app.id, badge: 'chat' }}
              eyebrow={t('explore.market.kind')}
              chips={
                app.llm_id ? <ModelChip reference={app.llm_id} /> : undefined
              }
              meta={
                <Button
                  size="sm"
                  className="relative z-10 w-full"
                  variant={added ? 'outline' : 'default'}
                  disabled={added}
                >
                  {added ? <Check aria-hidden="true" /> : null}
                  {added
                    ? t('explore.market.added')
                    : t('explore.market.addToWorkspace')}
                </Button>
              }
              onOpen={added && onOpenApp ? () => onOpenApp(app.id) : undefined}
            />
          )
        })}
      </ResourceGrid>
    </div>
  )
}
