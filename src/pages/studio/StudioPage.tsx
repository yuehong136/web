import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CollectionTemplate } from '@/components/page-templates'
import {
  BulkActionBar,
  PageErrorState,
  CollectionSkeleton,
  Pager,
} from '@/components/patterns'
import { AppEmptyState } from '@/components/studio'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { ImportTemplateDialog } from './components/ImportTemplateDialog'
import { StudioAppList, StudioFilterBar } from './components/studio-app-list'
import { TemplateStartRow } from './components/template-start-row'
import { useStudioStore } from '@/stores/studio'
import { useCollectionView } from '@/stores/collection-view'
import {
  useFetchDialogList,
  useDeleteDialogApps,
  useExportDialogApps,
} from '@/hooks/use-dialog-apps'
import { ROUTES } from '@/constants'
import type { DialogApp } from '@/types/api'

const PAGE_SIZES = [6, 12, 24, 48]

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
  // Where create dialogs return focus: the header button, the grid's create
  // card or an empty-state path, whichever opened them.
  const createOrigin = useRef<HTMLElement | null>(null)
  const {
    data,
    loading,
    fetching,
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
  const [view, setView] = useCollectionView(
    'studio',
    loading && !data.dialogs.length ? undefined : data.total,
    Boolean(searchString),
  )
  const state = isError
    ? 'error'
    : loading && !data.dialogs.length
      ? 'loading'
      : !apps.length
        ? 'empty'
        : 'content'
  const firstUse = state === 'empty' && !filtered
  const rememberOrigin = () => {
    createOrigin.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }
  const openProjects = () => {
    rememberOrigin()
    store.openProjectTypeModal()
  }
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
  const selectedIds = store.selectedIds

  return (
    <>
      <CollectionTemplate
        title={t('studio.page.title')}
        count={data.total}
        countLabel={t('studio.page.results', { count: data.total })}
        actions={
          // The first-use empty state carries create, template and import.
          firstUse ? null : (
            <>
              <Button variant="ghost" onClick={() => setImportOpen(true)}>
                <Upload className="size-icon-sm" aria-hidden="true" />
                {t('studio.page.import')}
              </Button>
              <Button onClick={openProjects}>
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t('studio.page.createProject')}
              </Button>
            </>
          )
        }
        filterBar={
          firstUse ? undefined : (
            <StudioFilterBar
              search={searchString}
              onSearchChange={handleInputChange}
              sortDescending={sortDesc}
              onSortDescendingChange={setSortDesc}
              view={view}
              onViewChange={setView}
            />
          )
        }
        state={state}
        refreshing={fetching && !loading}
        loadingState={
          <CollectionSkeleton
            view={view === 'list' ? 'list' : 'grid'}
            label={t('studio.page.loadingTitle')}
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
            onCreate={() => {
              rememberOrigin()
              store.openCreateAppModal()
            }}
            onTemplate={() => navigate(ROUTES.AGENT_TEMPLATES)}
            onImport={() => setImportOpen(true)}
            onReset={resetFilters}
          />
        }
        footerNote={t('studio.filters.pageScope')}
        footer={
          <Pager
            page={pagination.current}
            pageSize={pagination.pageSize}
            total={data.total}
            onPageChange={(current) =>
              setPagination({ ...pagination, current })
            }
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={(pageSize) =>
              setPagination({ current: 1, pageSize })
            }
          />
        }
        bulkActions={
          selectedIds.length ? (
            <BulkActionBar
              count={selectedIds.length}
              onClear={store.clearSelection}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={exportApps.isPending}
                onClick={() => exportApps.mutate(selectedIds)}
              >
                <Download className="size-icon-sm" aria-hidden="true" />
                {t('common.export')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-fg"
                disabled={deleteApps.isPending}
                onClick={() => setDeletion({ ids: [...selectedIds] })}
              >
                <Trash2 className="size-icon-sm" aria-hidden="true" />
                {t('common.delete')}
              </Button>
            </BulkActionBar>
          ) : null
        }
      >
        <StudioAppList
          apps={apps}
          view={view}
          onEdit={editApp}
          onDelete={deleteApp}
          onExport={(app) => exportApps.mutate([app.id])}
          onCreate={openProjects}
        />
        {view === 'grid' && !filtered ? <TemplateStartRow /> : null}
      </CollectionTemplate>
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
        returnFocusRef={createOrigin}
      />
      <ConfirmDialog
        open={Boolean(deletion)}
        onOpenChange={(open) => {
          if (!open && !deleteApps.isPending) setDeletion(null)
        }}
        variant="destructive"
        pending={deleteApps.isPending}
        title={t('studio.deleteDialog.title')}
        description={
          deletion?.name
            ? t('studio.deleteDialog.namedDescription', {
                name: deletion.name,
              })
            : t('studio.deleteDialog.bulkDescription', {
                count: deletion?.ids.length ?? 0,
              })
        }
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
      <ImportTemplateDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </>
  )
}
