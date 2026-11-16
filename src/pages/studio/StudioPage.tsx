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
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { AppEmptyState } from '@/components/studio'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { ImportTemplateDialog } from './components/ImportTemplateDialog'
import { StudioAppList, StudioFilterBar } from './components/studio-app-list'
import { useStudioStore } from '@/stores/studio'
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
  const selectedIds = store.selectedIds

  return (
    <>
      <CollectionTemplate
        title={t('studio.page.title')}
        count={data.total}
        countLabel={t('studio.page.results', { count: data.total })}
        actions={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              <Upload className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.import')}
            </Button>
            <Button ref={projectTrigger} onClick={store.openProjectTypeModal}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('studio.page.createProject')}
            </Button>
          </>
        }
        filterBar={
          <StudioFilterBar
            search={searchString}
            onSearchChange={handleInputChange}
            sortDescending={sortDesc}
            onSortDescendingChange={setSortDesc}
          />
        }
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
                className="text-status-error"
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
          onEdit={editApp}
          onDelete={deleteApp}
          onExport={(app) => exportApps.mutate([app.id])}
        />
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
        returnFocusRef={projectTrigger}
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
