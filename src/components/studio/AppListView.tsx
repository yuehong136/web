import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { cn } from '@/lib/utils'
import type { DialogApp } from '@/types/api'
import { AppAvatar } from './app-avatar'
import { AppActions } from './app-actions'
import { AppMetadata, AppStatus } from './app-metadata'
import type { TimeFormatType } from './AppCard'

interface AppListViewProps {
  data: DialogApp[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onEdit: (app: DialogApp) => void
  onDelete: (app: DialogApp) => void
  onExport?: (app: DialogApp) => void
  isLoading?: boolean
  timeFormat?: TimeFormatType
}
export function AppListView({
  data,
  selectedIds,
  onSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onExport,
  isLoading = false,
  timeFormat = 'detailed',
}: AppListViewProps) {
  const { t } = useTranslation()
  if (isLoading)
    return (
      <PageLoadingState
        title={t('studio.page.loadingTitle')}
        description={t('studio.page.loadingDescription')}
      />
    )
  if (!data.length)
    return (
      <PageEmptyState
        title={t('studio.empty.listTitle')}
        description={t('studio.empty.listDescription')}
      />
    )
  const allSelected = data.every((app) => selectedIds.includes(app.id))
  const visibleIds = new Set(data.map((app) => app.id))
  return (
    <div className="rounded-radius-lg border border-border-default bg-background-surface">
      <div className="flex items-center gap-space-sm border-b border-border-subtle px-space-md py-space-sm">
        <Checkbox
          aria-label={t('studio.card.selectPage')}
          checked={allSelected}
          indeterminate={
            !allSelected && data.some((app) => selectedIds.includes(app.id))
          }
          onCheckedChange={() =>
            onSelectAll(
              allSelected
                ? selectedIds.filter((id) => !visibleIds.has(id))
                : [...new Set([...selectedIds, ...visibleIds])],
            )
          }
        />
        <span className="text-xs text-text-secondary">
          {t('studio.card.selectPage')}
        </span>
      </div>
      <ul className="divide-y divide-border-subtle">
        {data.map((app) => (
          <li
            key={app.id}
            className={cn(
              'relative flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:gap-space-lg',
              selectedIds.includes(app.id) && 'bg-state-selected-bg',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-space-sm pr-[var(--control-height-sm)] md:pr-0">
              <Checkbox
                checked={selectedIds.includes(app.id)}
                onCheckedChange={() => onSelect(app.id)}
                aria-label={t('studio.card.selectApp', { name: app.name })}
              />
              <AppAvatar name={app.name} icon={app.icon} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">
                  <button
                    type="button"
                    className="max-w-full truncate rounded-radius-sm text-left outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
                    onClick={() => onEdit(app)}
                  >
                    {app.name}
                  </button>
                </h2>
                <p className="truncate text-sm text-text-secondary">
                  {app.description || t('studio.card.noDescription')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm md:max-w-80 md:justify-end">
              <AppStatus status={app.status} />
              <AppMetadata app={app} timeFormat={timeFormat} />
            </div>
            <div className="absolute top-space-md right-space-md md:static md:shrink-0">
              <AppActions
                data={app}
                onEdit={onEdit}
                onDelete={onDelete}
                onExport={onExport}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
