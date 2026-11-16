import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, Plus, Search } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import { PageEmptyState, PageErrorState, Pager } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CreateMemoryDialog } from '@/components/memory'
import {
  MemoryCollection,
  MemoryFilterBar,
} from '@/components/memory/memory-collection'
import { useMemoryStore } from '@/stores/memory'
import {
  useMemoryList,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useDebouncedSearch,
} from '@/hooks/use-memory'
import type { Memory } from '@/types/memory'

const PAGE_SIZES = [12, 24, 48]

export function MemoryListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    filter,
    setFilter,
    resetFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    viewMode,
    setViewMode,
    createModalOpen,
    editingMemory,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    openEditModal,
  } = useMemoryStore()
  const [search, setSearch] = useState(filter.keywords)
  const debounced = useDebouncedSearch(search)
  const [deleting, setDeleting] = useState<Memory | null>(null)
  useEffect(() => {
    if (debounced !== filter.keywords) setFilter({ keywords: debounced })
  }, [debounced, filter.keywords, setFilter])
  const query = useMemoryList({
    page,
    page_size: pageSize,
    keywords: filter.keywords,
    memory_type: filter.memoryType.length ? filter.memoryType : undefined,
    storage_type: filter.storageType || undefined,
  })
  const create = useCreateMemory()
  const update = useUpdateMemory()
  const remove = useDeleteMemory()
  const memories = query.data?.memory_list ?? []
  const total = query.data?.total_count ?? 0
  const filtered =
    !!filter.keywords || !!filter.memoryType.length || !!filter.storageType
  const clearAll = () => {
    setSearch('')
    resetFilter()
  }
  const state = query.isPending
    ? 'loading'
    : query.isError
      ? 'error'
      : !memories.length
        ? 'empty'
        : 'content'

  return (
    <>
      <CollectionTemplate
        title={t('memory.page.title')}
        count={query.isPending ? undefined : total}
        countLabel={t('memory.page.results', { count: total })}
        actions={
          state === 'empty' && !filtered ? null : (
            <Button onClick={openCreateModal}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('memory.page.create')}
            </Button>
          )
        }
        filterBar={
          <MemoryFilterBar
            search={search}
            onSearchChange={setSearch}
            memoryType={filter.memoryType}
            onMemoryTypeChange={(memoryType) =>
              setFilter({ memoryType: memoryType as typeof filter.memoryType })
            }
            storageType={filter.storageType}
            onStorageTypeChange={(storageType) =>
              setFilter({
                storageType: storageType as typeof filter.storageType,
              })
            }
            onClearFilters={() =>
              setFilter({ memoryType: [], storageType: '' })
            }
            view={viewMode}
            onViewChange={setViewMode}
          />
        }
        state={state}
        errorState={
          <PageErrorState
            retryLabel={t('common.retry')}
            onRetry={() => {
              void query.refetch()
            }}
          />
        }
        emptyState={
          <PageEmptyState
            title={t(
              filtered ? 'memory.empty.searchTitle' : 'memory.empty.listTitle',
            )}
            description={t(
              filtered
                ? 'memory.empty.searchDescription'
                : 'memory.empty.listDescription',
            )}
            icon={
              filtered ? (
                <Search className="size-icon-lg" />
              ) : (
                <Brain className="size-icon-lg" />
              )
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={clearAll}>
                  {t('memory.common.clear')}
                </Button>
              ) : (
                <Button onClick={openCreateModal}>
                  <Plus className="size-icon-sm" aria-hidden="true" />
                  {t('memory.page.create')}
                </Button>
              )
            }
          />
        }
        footerNote={t('memory.workspace.listHint')}
        footer={
          <Pager
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            pageSizeOptions={PAGE_SIZES}
            onPageSizeChange={setPageSize}
          />
        }
      >
        <MemoryCollection
          memories={memories}
          view={viewMode}
          onOpen={(memory) => navigate(`/memory/${memory.id}`)}
          onEdit={openEditModal}
          onDelete={setDeleting}
        />
      </CollectionTemplate>
      <CreateMemoryDialog
        open={createModalOpen || !!editingMemory}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateModal()
            closeEditModal()
          }
        }}
        initialData={editingMemory}
        onCreate={(data) => create.mutate(data)}
        onUpdate={(id, data) => update.mutate({ id, data })}
        isLoading={create.isPending || update.isPending}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null)
        }}
        variant="destructive"
        pending={remove.isPending}
        title={t('memory.deleteDialog.title')}
        description={t('memory.deleteDialog.description')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove.mutateAsync(deleting.id)
            setDeleting(null)
          } catch {
            /* Mutation owns error feedback. */
          }
        }}
      >
        <p className="font-medium break-words text-text-primary">
          {deleting?.name}
        </p>
      </ConfirmDialog>
    </>
  )
}
