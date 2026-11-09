import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain, Plus, Search } from 'lucide-react'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import { PageToolbar } from '@/components/patterns/page-toolbar'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { ListPagination } from '@/components/patterns/list-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FilterPopover,
  type FilterConfig,
} from '@/components/ui/filter-popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MemoryCard, CreateMemoryDialog } from '@/components/memory'
import { useMemoryStore } from '@/stores/memory'
import {
  useMemoryList,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useDebouncedSearch,
} from '@/hooks/use-memory'
import type { Memory } from '@/types/memory'

export function MemoryListPage() {
  const { t } = useTranslation()
  const {
    filter,
    setFilter,
    resetFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
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
  const filterConfig: FilterConfig[] = [
    {
      key: 'memoryType',
      label: t('memory.filters.memoryType'),
      options: ['raw', 'semantic', 'episodic', 'procedural'].map((value) => ({
        value,
        label: t(`memory.filters.${value}`),
      })),
    },
  ]
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={t('memory.page.title')}
          titleSize="md"
          description={t('memory.page.description')}
          wrapActions
          actions={
            <Button onClick={openCreateModal}>
              <Plus className="size-icon-sm" />
              {t('memory.page.create')}
            </Button>
          }
        />
      }
      toolbar={
        <PageToolbar
          wrap
          left={
            <Input
              aria-label={t('memory.filters.searchPlaceholder')}
              placeholder={t('memory.filters.searchPlaceholder')}
              className="max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="size-icon-sm" />}
            />
          }
          right={
            <>
              <FilterPopover
                filters={filterConfig}
                value={{ memoryType: filter.memoryType }}
                onChange={(value) =>
                  setFilter({ memoryType: value.memoryType ?? [] })
                }
              />
              {filtered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    resetFilter()
                  }}
                >
                  {t('memory.common.clear')}
                </Button>
              )}
            </>
          }
        />
      }
      footer={
        total > 0 && !query.isError ? (
          <div className="border-t border-border-subtle bg-background-surface px-space-lg pb-space-base [&>div]:mt-space-sm">
            <ListPagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null
      }
    >
      <div className="mx-auto max-w-7xl space-y-space-lg p-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="text-sm font-medium text-text-primary">
            {t('memory.workspace.yourMemories')}{' '}
            <span className="ml-space-xs rounded-radius-full bg-background-subtle px-space-sm py-space-xs text-xs text-text-secondary">
              {query.isPending ? '—' : total}
            </span>
          </h2>
          <p className="text-xs text-text-tertiary">
            {t('memory.workspace.listHint')}
          </p>
        </div>
        {query.isPending ? (
          <PageLoadingState />
        ) : query.isError ? (
          <PageErrorState onRetry={() => query.refetch()} />
        ) : !memories.length ? (
          <PageEmptyState
            title={t(
              filtered ? 'memory.empty.searchTitle' : 'memory.empty.listTitle',
            )}
            description={t(
              filtered
                ? 'memory.empty.searchDescription'
                : 'memory.empty.listDescription',
            )}
            icon={<Brain className="size-icon-lg" />}
            action={
              <Button
                onClick={
                  filtered
                    ? () => {
                        setSearch('')
                        resetFilter()
                      }
                    : openCreateModal
                }
              >
                {t(filtered ? 'memory.common.clear' : 'memory.page.create')}
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-space-base lg:grid-cols-2 2xl:grid-cols-3">
              {memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  data={memory}
                  onEdit={openEditModal}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          </>
        )}
      </div>
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
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('memory.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('memory.deleteDialog.description')}
            </AlertDialogDescription>
            <p className="text-sm font-medium break-words text-text-primary">
              {deleting?.name}
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={async (e) => {
                e.preventDefault()
                if (!deleting) return
                try {
                  await remove.mutateAsync(deleting.id)
                  setDeleting(null)
                } catch {
                  /* Mutation owns error feedback. */
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConsolePageTemplate>
  )
}
