import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import {
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import type { DialogApp } from '@/types/api'

/** Every dialog app; the ones already in the workspace are marked as added. */
export function ExploreMarket({
  apps,
  loading,
}: {
  apps: DialogApp[]
  loading: boolean
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
    <div className="flex-1 overflow-y-auto p-space-lg">
      <ul className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const added = app.status === '1'
          return (
            <li
              key={app.id}
              className="flex flex-col gap-space-base rounded-radius-lg border border-components-card-border bg-components-card-bg p-space-md transition-colors hover:border-border-strong"
            >
              <div className="flex min-w-0 items-center gap-space-sm">
                <EntityAvatar
                  name={app.name}
                  src={app.icon}
                  seed={app.id}
                  size="sm"
                />
                <h3 className="truncate text-sm font-medium text-components-card-meta-title">
                  {app.name}
                </h3>
              </div>
              {app.description && (
                <p className="line-clamp-3 text-sm text-components-card-meta-description">
                  {app.description}
                </p>
              )}
              <Button
                size="sm"
                className="mt-auto w-full"
                variant={added ? 'outline' : 'default'}
                disabled={added}
              >
                {added
                  ? t('explore.market.added')
                  : t('explore.market.addToWorkspace')}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
