import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import {
  FilterBar,
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type ResourceItemProps,
} from '@/components/patterns'
import { AppActions, AppMetadata, AppStatus } from '@/components/studio'
import { useStudioStore, type TimeFormatType } from '@/stores/studio'
import type { DialogApp } from '@/types/api'

interface StudioFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  sortDescending: boolean
  onSortDescendingChange: (descending: boolean) => void
}

/** Search, status chip, one sort/display menu and the list/grid switch. */
export function StudioFilterBar({
  search,
  onSearchChange,
  sortDescending,
  onSortDescendingChange,
}: StudioFilterBarProps) {
  const { t } = useTranslation()
  const { status, timeFormat, viewMode } = useStudioStore(
    useShallow((state) => ({
      status: state.filter.status,
      timeFormat: state.timeFormat,
      viewMode: state.viewMode,
    })),
  )
  const { setFilter, setTimeFormat, setViewMode } = useStudioStore.getState()
  const timeFormats: Record<TimeFormatType, string> = {
    detailed: t('studio.toolbar.detailedTime'),
    compact: t('studio.toolbar.compactTime'),
    relative: t('studio.toolbar.relativeTime'),
  }
  return (
    <FilterBar
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: t('studio.filters.searchPlaceholder'),
      }}
      filters={[
        {
          key: 'status',
          label: t('studio.filters.status'),
          value: status,
          options: [
            { value: '1', label: t('studio.filters.published') },
            { value: '0', label: t('studio.filters.draft') },
          ],
        },
      ]}
      onFilterChange={(_, value) => setFilter({ status: value })}
      onClearFilters={() => setFilter({ status: [] })}
      sort={{
        value: sortDescending ? 'desc' : 'asc',
        onChange: (value) => onSortDescendingChange(value === 'desc'),
        options: [
          { value: 'desc', label: t('studio.toolbar.descending') },
          { value: 'asc', label: t('studio.toolbar.ascending') },
        ],
      }}
      display={[
        {
          key: 'time',
          label: t('studio.toolbar.timeFormat'),
          value: timeFormat,
          onChange: (value) => setTimeFormat(value as TimeFormatType),
          options: Object.entries(timeFormats).map(([value, label]) => ({
            value,
            label,
          })),
        },
      ]}
      view={{ value: viewMode, onChange: setViewMode }}
    />
  )
}

interface StudioAppListProps {
  apps: DialogApp[]
  onEdit: (app: DialogApp) => void
  onDelete: (app: DialogApp) => void
  onExport: (app: DialogApp) => void
}

/** The current page of apps as rows (default) or cards, with selection. */
export function StudioAppList({
  apps,
  onEdit,
  onDelete,
  onExport,
}: StudioAppListProps) {
  const { t } = useTranslation()
  const { selectedIds, timeFormat, viewMode } = useStudioStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      timeFormat: state.timeFormat,
      viewMode: state.viewMode,
    })),
  )
  const { toggleSelect, selectAll } = useStudioStore.getState()
  const visibleIds = apps.map((app) => app.id)
  const selectedOnPage = visibleIds.filter((id) =>
    selectedIds.includes(id),
  ).length
  const allSelected =
    visibleIds.length > 0 && selectedOnPage === visibleIds.length
  // Page-level select-all keeps selections made on other pages.
  const togglePage = () => {
    const visible = new Set(visibleIds)
    selectAll(
      allSelected
        ? selectedIds.filter((id) => !visible.has(id))
        : [...new Set([...selectedIds, ...visibleIds])],
    )
  }
  const item = (app: DialogApp): ResourceItemProps => ({
    name: app.name,
    description: app.description || t('studio.card.noDescription'),
    avatar: { src: app.icon, seed: app.id },
    status: <AppStatus status={app.status} />,
    actions: (
      <AppActions
        data={app}
        onEdit={onEdit}
        onDelete={onDelete}
        onExport={onExport}
      />
    ),
    onOpen: () => onEdit(app),
    selection: {
      checked: selectedIds.includes(app.id),
      onCheckedChange: () => toggleSelect(app.id),
      label: t('studio.card.selectApp', { name: app.name }),
    },
  })

  if (viewMode === 'grid')
    return (
      <ResourceGrid label={t('studio.page.title')}>
        {apps.map((app) => (
          <ResourceCard
            key={app.id}
            {...item(app)}
            eyebrow={t('studio.card.app')}
            meta={<AppMetadata app={app} timeFormat={timeFormat} />}
          />
        ))}
      </ResourceGrid>
    )
  return (
    <ResourceList
      label={t('studio.page.title')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('common.status')}
          meta={t('common.updateTime')}
          selection={{
            checked: allSelected,
            indeterminate: selectedOnPage > 0 && !allSelected,
            onCheckedChange: togglePage,
            label: t('studio.card.selectPage'),
          }}
        />
      }
    >
      {apps.map((app) => (
        <ResourceRow
          key={app.id}
          {...item(app)}
          meta={<AppMetadata app={app} timeFormat={timeFormat} compact />}
        />
      ))}
    </ResourceList>
  )
}
