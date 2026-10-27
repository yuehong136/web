import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FilterPopover } from '@/components/ui/filter-popover'
import { ListPageTemplate } from '@/components/page-templates'
import {
  ListPagination,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { AssetListControls } from '@/components/patterns/asset-list-controls'
import { AppCard, AppListView, AppEmptyState } from '@/components/studio'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { ImportTemplateDialog } from './components/ImportTemplateDialog'
import { useStudioStore } from '@/stores/studio'
import {
  useFetchDialogList,
  useDeleteDialogApps,
  useExportDialogApps,
} from '@/hooks/use-dialog-apps'
import { ROUTES } from '@/constants'
import type { DialogApp } from '@/types/api'

export function StudioPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const store = useStudioStore()
  const [deletion, setDeletion] = useState<{
    ids: string[]
    name?: string
  } | null>(null)
  const [sortDesc, setSortDesc] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const projectTrigger = useRef<HTMLButtonElement>(null)
  const {
    data,
    loading,
    isError,
    refetch,
    searchString,
    handleInputChange,
    pagination,
    setPagination,
  } = useFetchDialogList(12)
  const deleteApps = useDeleteDialogApps()
  const exportApps = useExportDialogApps()
  const apps = useMemo(
    () =>
      [
        ...data.dialogs.filter(
          (app) =>
            !store.filter.status.length ||
            store.filter.status.includes(app.status),
        ),
      ].sort(
        (a, b) =>
          (sortDesc ? -1 : 1) *
          ((a.update_time ?? a.create_time ?? 0) -
            (b.update_time ?? b.create_time ?? 0)),
      ),
    [data.dialogs, store.filter.status, sortDesc],
  )
  const filtered = Boolean(searchString || store.filter.status.length)
  const state = isError
    ? 'error'
    : loading && !data.dialogs.length
      ? 'loading'
      : !apps.length
        ? 'empty'
        : 'content'
  const resetFilters = () => {
    handleInputChange('')
    store.setFilter({ status: [] })
  }
  const editApp = (app: DialogApp) => {
    const params = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon }),
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${params}`)
  }
  const deleteApp = (app: DialogApp) => {
    if (!deleteApps.isPending) setDeletion({ ids: [app.id], name: app.name })
  }
  const confirmDelete = () => {
    if (!deletion || deleteApps.isPending) return
    const ids = deletion.ids
    deleteApps.mutate(ids, {
      onSuccess: () => {
        const current = useStudioStore.getState()
        current.selectAll(current.selectedIds.filter((id) => !ids.includes(id)))
        setDeletion(null)
      },
    })
  }
  const controls = (
    <AssetListControls
      view={store.viewMode}
      onViewChange={store.setViewMode}
      timeFormat={store.timeFormat}
      onTimeFormatChange={store.setTimeFormat}
      sortDescending={sortDesc}
      onToggleSort={() => setSortDesc((value) => !value)}
      labels={{
        view: t('common.viewToggle'),
        grid: t('studio.toolbar.gridView'),
        list: t('studio.toolbar.listView'),
        timeFormat: t('studio.toolbar.timeFormat'),
        detailed: t('studio.toolbar.detailedTime'),
        compact: t('studio.toolbar.compactTime'),
        relative: t('studio.toolbar.relativeTime'),
        newest: t('studio.toolbar.descending'),
        oldest: t('studio.toolbar.ascending'),
      }}
    />
  )
  return (
    <>
      <ListPageTemplate
        title={t('studio.page.title')}
        description={t('studio.page.description')}
        className="p-space-base md:p-space-lg"
        headerActions={
          <div className="flex flex-wrap gap-space-sm">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.import')}
            </Button>
            <Button ref={projectTrigger} onClick={store.openProjectTypeModal}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.createProject')}
            </Button>
          </div>
        }
        toolbarLeft={
          <div className="flex min-w-0 flex-1 items-center gap-space-sm">
            <Input
              type="search"
              aria-label={t('studio.filters.searchPlaceholder')}
              placeholder={t('studio.filters.searchPlaceholder')}
              value={searchString}
              onChange={(event) => handleInputChange(event.target.value)}
              leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
            />
            <FilterPopover
              className="h-auto min-h-[var(--control-height-sm)]"
              filters={[
                {
                  key: 'status',
                  label: t('studio.filters.status'),
                  options: [
                    { value: '1', label: t('studio.filters.published') },
                    { value: '0', label: t('studio.filters.draft') },
                  ],
                },
              ]}
              value={{ status: store.filter.status }}
              onChange={(value) =>
                store.setFilter({ status: value.status ?? [] })
              }
            />
          </div>
        }
        toolbarRight={controls}
        state={state}
        loadingState={
          <PageLoadingState
            title={t('studio.page.loadingTitle')}
            description={t('studio.page.loadingDescription')}
          />
        }
        errorState={
          <PageErrorState
            title={t('studio.page.errorTitle')}
            description={t('studio.page.errorDescription')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              void refetch()
            }}
          />
        }
        emptyState={
          <AppEmptyState
            type={filtered ? 'search' : 'list'}
            onAction={store.openProjectTypeModal}
            onReset={resetFilters}
          />
        }
        pagination={
          <ListPagination
            total={data.total}
            page={pagination.current}
            pageSize={pagination.pageSize}
            onPageChange={(current) =>
              setPagination({ ...pagination, current })
            }
            onPageSizeChange={(pageSize) =>
              setPagination({ current: 1, pageSize })
            }
          />
        }
      >
        <div className="mb-space-base flex flex-wrap items-center justify-between gap-space-sm text-sm text-text-secondary">
          <p>{t('studio.page.results', { count: data.total })}</p>
          <p className="text-xs">{t('studio.filters.pageScope')}</p>
        </div>
        {store.selectedIds.length > 0 && (
          <section
            aria-label={t('studio.page.selection')}
            className="mb-space-base flex flex-wrap items-center gap-space-sm rounded-radius-lg border border-border-default bg-background-subtle p-space-sm"
          >
            <span className="mr-auto text-sm font-medium">
              {t('studio.pagination.selected', {
                count: store.selectedIds.length,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={exportApps.isPending}
              onClick={() => exportApps.mutate(store.selectedIds)}
            >
              <Download className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.exportSelected', {
                count: store.selectedIds.length,
              })}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteApps.isPending}
              onClick={() => setDeletion({ ids: [...store.selectedIds] })}
            >
              <Trash2 className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.deleteSelected', {
                count: store.selectedIds.length,
              })}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('studio.page.clearSelection')}
              onClick={store.clearSelection}
            >
              <X className="size-icon-sm" aria-hidden="true" />
            </Button>
          </section>
        )}
        {store.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                data={app}
                onEdit={editApp}
                onDelete={deleteApp}
                onExport={(app) => exportApps.mutate([app.id])}
                selected={store.selectedIds.includes(app.id)}
                onSelect={store.toggleSelect}
                timeFormat={store.timeFormat}
              />
            ))}
          </div>
        ) : (
          <AppListView
            data={apps}
            selectedIds={store.selectedIds}
            onSelect={store.toggleSelect}
            onSelectAll={store.selectAll}
            onEdit={editApp}
            onDelete={deleteApp}
            onExport={(app) => exportApps.mutate([app.id])}
            timeFormat={store.timeFormat}
          />
        )}
      </ListPageTemplate>
      <CreateProjectModal
        isOpen={store.projectTypeModalOpen}
        onClose={store.closeProjectTypeModal}
        onCreateProject={(type) => {
          store.closeProjectTypeModal()
          if (type === 'app') store.openCreateAppModal()
          else navigate('/agents?create=1')
        }}
      />
      <CreateAppModal
        isOpen={store.createAppModalOpen}
        onClose={store.closeCreateAppModal}
        returnFocusRef={projectTrigger}
      />
      <AlertDialog
        open={Boolean(deletion)}
        onOpenChange={(open) => {
          if (!open && !deleteApps.isPending) setDeletion(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studio.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletion?.name
                ? t('studio.deleteDialog.namedDescription', {
                    name: deletion.name,
                  })
                : t('studio.deleteDialog.bulkDescription', {
                    count: deletion?.ids.length ?? 0,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteApps.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              loading={deleteApps.isPending}
              onClick={confirmDelete}
            >
              {t('common.delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImportTemplateDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  )
}
