import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import {
  FilterBar,
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type CollectionView,
  type ResourceItemProps,
} from '@/components/patterns'
import { ResourceCreateCard } from '@/components/patterns/resource-card'
import {
  AppActions,
  AppKnowledgeChip,
  AppMetadata,
  AppStatus,
  ModelChip,
} from '@/components/studio'
import { useStudioStore, type TimeFormatType } from '@/stores/studio'
import type { DialogApp } from '@/types/api'

interface StudioFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  sortDescending: boolean
  onSortDescendingChange: (descending: boolean) => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

/** Search, status chip, one sort/display menu and the list/grid switch. */
export function StudioFilterBar({
  search,
  onSearchChange,
  sortDescending,
  onSortDescendingChange,
  view,
  onViewChange,
}: StudioFilterBarProps) {
  const { t } = useTranslation()
  const { status, timeFormat } = useStudioStore(
    useShallow((state) => ({
      status: state.filter.status,
      timeFormat: state.timeFormat,
    })),
  )
  const { setFilter, setTimeFormat } = useStudioStore.getState()
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
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

interface StudioAppListProps {
  apps: DialogApp[]
  view: CollectionView
  onEdit: (app: DialogApp) => void
  onDelete: (app: DialogApp) => void
  onExport: (app: DialogApp) => void
  /** Ends the grid with a "new project" card. */
  onCreate?: () => void
}

/** The current page of chat apps as cards or rows, with selection. */
export function StudioAppList({
  apps,
  view,
  onEdit,
  onDelete,
  onExport,
  onCreate,
}: StudioAppListProps) {
  const { t } = useTranslation()
  const { selectedIds, timeFormat } = useStudioStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      timeFormat: state.timeFormat,
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
    avatar: { src: app.icon, seed: app.id, badge: 'chat' },
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

  if (view === 'grid')
    return (
      <ResourceGrid label={t('studio.page.title')}>
        {apps.map((app) => (
          <ResourceCard
            key={app.id}
            {...item(app)}
            eyebrow={t('studio.card.chatApp')}
            chips={
              <>
                <ModelChip reference={app.llm_id} />
                <AppKnowledgeChip app={app} />
              </>
            }
            meta={<AppMetadata app={app} timeFormat={timeFormat} card />}
          />
        ))}
        {onCreate ? (
          <ResourceCreateCard
            label={t('studio.page.createProject')}
            description={t('studio.card.createDescription')}
            onClick={onCreate}
          />
        ) : null}
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
